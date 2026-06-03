// backend/src/main.rs
#![allow(clippy::collapsible_if)]

mod board;

use axum::{
    Json, Router,
    extract::{
        Path, Query, State,
        ws::{Message, WebSocket, WebSocketUpgrade},
    },
    http::{Method, StatusCode},
    response::IntoResponse,
    routing::{get, post},
};
use dashmap::DashMap;
use futures_util::{sink::SinkExt, stream::StreamExt};
use serde::{Deserialize, Serialize};
use std::{net::SocketAddr, sync::Arc};
use tokio::sync::broadcast;
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

use crate::board::Board;

#[derive(Clone, Copy, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum PlayerSide {
    #[serde(rename = "red")]
    Red,
    #[serde(rename = "black")]
    Black,
}

#[derive(Clone, Copy, Serialize, Deserialize, Debug, PartialEq, Eq)]
pub enum PlayerRole {
    #[serde(rename = "red")]
    Red,
    #[serde(rename = "black")]
    Black,
    #[serde(rename = "spectator")]
    Spectator,
}

// Room definition
pub struct Room {
    pub room_id: String,
    pub board: Board,
    pub moves: Vec<String>, // UCCI move history (e.g. "h2e2")
    pub red_token: String,
    pub black_token: String,
    pub red_connected: bool,
    pub black_connected: bool,
    pub pending_retract: Option<PlayerSide>,
    pub pending_restart: Option<PlayerSide>,
    pub broadcast_tx: broadcast::Sender<RoomEvent>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct RoomState {
    pub room_id: String,
    pub fen: String,
    pub moves: Vec<String>,
    pub turn: PlayerSide,
    pub red_connected: bool,
    pub black_connected: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(tag = "type")]
pub enum RoomEvent {
    #[serde(rename = "state")]
    State(RoomState),
    #[serde(rename = "chat")]
    Chat { sender: PlayerRole, message: String },
    #[serde(rename = "retract_request")]
    RetractRequest { sender: PlayerSide },
    #[serde(rename = "restart_request")]
    RestartRequest { sender: PlayerSide },
    #[serde(rename = "info")]
    Info { message: String },
}

// Global application state
type Lobbies = Arc<DashMap<String, Room>>;

#[derive(Deserialize)]
struct CreateRoomQuery {
    side: Option<PlayerSide>,
}

#[derive(Serialize)]
struct CreateRoomResponse {
    room_id: String,
    role: PlayerSide,
    token: String,
}

#[derive(Deserialize)]
struct JoinParams {
    token: Option<String>,
    role: Option<PlayerRole>,
}

// WebSocket message structures
#[derive(Deserialize, Debug)]
#[serde(tag = "type")]
enum ClientMsg {
    #[serde(rename = "move")]
    Move { src: usize, dst: usize },
    #[serde(rename = "chat")]
    Chat { message: String },
    #[serde(rename = "request_retract")]
    RequestRetract,
    #[serde(rename = "request_restart")]
    RequestRestart,
    #[serde(rename = "response_retract")]
    ResponseRetract { agree: bool },
    #[serde(rename = "response_restart")]
    ResponseRestart { agree: bool },
}

#[derive(Serialize, Clone, Debug)]
#[serde(tag = "type")]
enum ServerMsg {
    #[serde(rename = "init")]
    Init {
        room_id: String,
        role: PlayerRole,
        token: String,
        fen: String,
        moves: Vec<String>,
        turn: PlayerSide,
        red_connected: bool,
        black_connected: bool,
    },
    #[serde(rename = "state")]
    State(RoomState),
    #[serde(rename = "error")]
    Error { message: String },
    #[serde(rename = "chat")]
    Chat { sender: PlayerRole, message: String },
    #[serde(rename = "retract_request")]
    RetractRequest { sender: PlayerSide },
    #[serde(rename = "restart_request")]
    RestartRequest { sender: PlayerSide },
    #[serde(rename = "info")]
    Info { message: String },
}

#[tokio::main]
async fn main() {
    let lobbies: Lobbies = Arc::new(DashMap::new());

    // CORS configuration to allow local Vite server
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(vec![Method::GET, Method::POST])
        .allow_headers(Any);

    let app = Router::new()
        .route("/api/match/create", post(create_room))
        .route("/ws/match/:room_id", get(ws_handler))
        .layer(cors)
        .with_state(lobbies);

    let addr = SocketAddr::from(([0, 0, 0, 0], 8080));
    println!("Backend server starting at {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

// REST route to create a room
async fn create_room(
    State(lobbies): State<Lobbies>,
    Query(query): Query<CreateRoomQuery>,
) -> impl IntoResponse {
    let room_id = Uuid::new_v4().to_string();
    let red_token = Uuid::new_v4().to_string();
    let black_token = Uuid::new_v4().to_string();
    let (tx, _) = broadcast::channel(100);

    let board = Board::new();

    let initial_room = Room {
        room_id: room_id.clone(),
        board,
        moves: Vec::new(),
        red_token: red_token.clone(),
        black_token: black_token.clone(),
        red_connected: false,
        black_connected: false,
        pending_retract: None,
        pending_restart: None,
        broadcast_tx: tx,
    };

    lobbies.insert(room_id.clone(), initial_room);

    let preferred_side = query.side.unwrap_or(PlayerSide::Red);
    let token = if preferred_side == PlayerSide::Black {
        black_token
    } else {
        red_token
    };

    (
        StatusCode::OK,
        Json(CreateRoomResponse {
            room_id,
            role: preferred_side,
            token,
        }),
    )
}

// WebSocket connection handler
async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(room_id): Path<String>,
    Query(params): Query<JoinParams>,
    State(lobbies): State<Lobbies>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, room_id, params, lobbies))
}

async fn handle_socket(socket: WebSocket, room_id: String, params: JoinParams, lobbies: Lobbies) {
    let (mut ws_sender, mut ws_receiver) = socket.split();

    // 1. Authenticate or assign role
    let mut role = PlayerRole::Spectator;
    let mut player_token = params.token.clone().unwrap_or_default();

    // Scope to lookup/update connection states
    {
        let mut room = match lobbies.get_mut(&room_id) {
            Some(r) => r,
            None => {
                let _ = ws_sender
                    .send(Message::Text(
                        serde_json::to_string(&ServerMsg::Error {
                            message: "Room not found".to_string(),
                        })
                        .unwrap()
                        .into(),
                    ))
                    .await;
                return;
            }
        };

        if !player_token.is_empty() {
            if player_token == room.red_token {
                role = PlayerRole::Red;
                room.red_connected = true;
            } else if player_token == room.black_token {
                role = PlayerRole::Black;
                room.black_connected = true;
            }
        } else {
            // Assign role if empty
            let requested_role = params.role.unwrap_or(PlayerRole::Spectator);
            if requested_role == PlayerRole::Red && !room.red_connected {
                role = PlayerRole::Red;
                player_token = room.red_token.clone();
                room.red_connected = true;
            } else if requested_role == PlayerRole::Black && !room.black_connected {
                role = PlayerRole::Black;
                player_token = room.black_token.clone();
                room.black_connected = true;
            } else if !room.red_connected {
                role = PlayerRole::Red;
                player_token = room.red_token.clone();
                room.red_connected = true;
            } else if !room.black_connected {
                role = PlayerRole::Black;
                player_token = room.black_token.clone();
                room.black_connected = true;
            }
        }
    }

    // Subscribe to state broadcasts
    let mut rx = {
        let room = lobbies.get(&room_id).unwrap();
        room.broadcast_tx.subscribe()
    };

    // Send init packet
    let init_msg = {
        let room = lobbies.get(&room_id).unwrap();
        ServerMsg::Init {
            room_id: room.room_id.clone(),
            role,
            token: player_token.clone(),
            fen: room.board.to_fen(),
            moves: room.moves.clone(),
            turn: if room.board.sd_player == 0 {
                PlayerSide::Red
            } else {
                PlayerSide::Black
            },
            red_connected: room.red_connected,
            black_connected: room.black_connected,
        }
    };

    if let Ok(init_txt) = serde_json::to_string(&init_msg) {
        let _ = ws_sender.send(Message::Text(init_txt.into())).await;
    }

    // Broadcast updated state to all participants
    broadcast_room_state(&room_id, &lobbies);

    // Spawn a task to listen for broadcast messages and push them to client
    let bcast_sender = lobbies.get(&room_id).unwrap().broadcast_tx.clone();

    #[allow(clippy::collapsible_if)]
    let send_task = tokio::spawn(async move {
        while let Ok(event) = rx.recv().await {
            let msg = match event {
                RoomEvent::State(state) => ServerMsg::State(state),
                RoomEvent::Chat { sender, message } => ServerMsg::Chat { sender, message },
                RoomEvent::RetractRequest { sender } => ServerMsg::RetractRequest { sender },
                RoomEvent::RestartRequest { sender } => ServerMsg::RestartRequest { sender },
                RoomEvent::Info { message } => ServerMsg::Info { message },
            };
            if let Ok(text) = serde_json::to_string(&msg) {
                if ws_sender.send(Message::Text(text.into())).await.is_err() {
                    break;
                }
            }
        }
    });

    // Listen for incoming messages from the client
    while let Some(Ok(msg)) = ws_receiver.next().await {
        let text = match msg {
            Message::Text(t) => t,
            _ => continue,
        };

        let client_msg: ClientMsg = match serde_json::from_str(&text) {
            Ok(m) => m,
            Err(_) => continue,
        };

        match client_msg {
            ClientMsg::Move { src, dst } => {
                let mut valid = false;
                let mut err_msg = "Invalid move";

                // Check authorization and execute move on the board
                if let Some(mut room) = lobbies.get_mut(&room_id) {
                    let expected_turn = if room.board.sd_player == 0 {
                        PlayerRole::Red
                    } else {
                        PlayerRole::Black
                    };
                    if role != expected_turn {
                        err_msg = "Not your turn";
                    } else {
                        // Generate UCCI move string for the history
                        let move_str = format_ucci_move(src, dst);

                        if room.board.make_move(src, dst) {
                            room.moves.push(move_str);
                            valid = true;
                        }
                    }
                }

                if valid {
                    broadcast_room_state(&room_id, &lobbies);
                } else {
                    let _ = bcast_sender.send(RoomEvent::State(RoomState {
                        room_id: room_id.clone(),
                        fen: lobbies.get(&room_id).unwrap().board.to_fen(),
                        moves: lobbies.get(&room_id).unwrap().moves.clone(),
                        turn: if lobbies.get(&room_id).unwrap().board.sd_player == 0 {
                            PlayerSide::Red
                        } else {
                            PlayerSide::Black
                        },
                        red_connected: lobbies.get(&room_id).unwrap().red_connected,
                        black_connected: lobbies.get(&room_id).unwrap().black_connected,
                    }));
                    let err = ServerMsg::Error {
                        message: err_msg.to_string(),
                    };
                    println!(
                        "Rejected move (anti-cheat triggered): src={}, dst={} by role={:?} in room={}",
                        src, dst, role, room_id
                    );
                    let _ = err;
                }
            }
            ClientMsg::RequestRetract => {
                if role == PlayerRole::Red || role == PlayerRole::Black {
                    let side = if role == PlayerRole::Red {
                        PlayerSide::Red
                    } else {
                        PlayerSide::Black
                    };
                    let mut online_count = 0;
                    if let Some(room) = lobbies.get(&room_id) {
                        if room.red_connected {
                            online_count += 1;
                        }
                        if room.black_connected {
                            online_count += 1;
                        }
                    }

                    if online_count < 2 {
                        // Opponent offline: perform retract directly
                        if let Some(mut room) = lobbies.get_mut(&room_id) {
                            execute_retract(&mut room);
                        }
                        broadcast_room_state(&room_id, &lobbies);
                    } else {
                        // Opponent online: ask for consent
                        if let Some(mut room) = lobbies.get_mut(&room_id) {
                            room.pending_retract = Some(side);
                        }
                        let _ = bcast_sender.send(RoomEvent::RetractRequest { sender: side });
                    }
                }
            }
            ClientMsg::RequestRestart => {
                if role == PlayerRole::Red || role == PlayerRole::Black {
                    let side = if role == PlayerRole::Red {
                        PlayerSide::Red
                    } else {
                        PlayerSide::Black
                    };
                    let mut online_count = 0;
                    if let Some(room) = lobbies.get(&room_id) {
                        if room.red_connected {
                            online_count += 1;
                        }
                        if room.black_connected {
                            online_count += 1;
                        }
                    }

                    if online_count < 2 {
                        // Opponent offline: perform restart directly
                        if let Some(mut room) = lobbies.get_mut(&room_id) {
                            room.board = Board::new();
                            room.moves.clear();
                        }
                        broadcast_room_state(&room_id, &lobbies);
                    } else {
                        // Opponent online: ask for consent
                        if let Some(mut room) = lobbies.get_mut(&room_id) {
                            room.pending_restart = Some(side);
                        }
                        let _ = bcast_sender.send(RoomEvent::RestartRequest { sender: side });
                    }
                }
            }
            ClientMsg::ResponseRetract { agree } => {
                if role == PlayerRole::Red || role == PlayerRole::Black {
                    let side = if role == PlayerRole::Red {
                        PlayerSide::Red
                    } else {
                        PlayerSide::Black
                    };
                    let mut requester = None;
                    if let Some(room) = lobbies.get(&room_id) {
                        requester = room.pending_retract;
                    }
                    if let Some(req) = requester {
                        if req != side {
                            // Valid response from opponent
                            if agree {
                                if let Some(mut room) = lobbies.get_mut(&room_id) {
                                    execute_retract(&mut room);
                                    room.pending_retract = None;
                                }
                                broadcast_room_state(&room_id, &lobbies);
                                let sender_name = if role == PlayerRole::Red {
                                    "红方"
                                } else {
                                    "黑方"
                                };
                                let _ = bcast_sender.send(RoomEvent::Info {
                                    message: format!("{} 同意了悔棋", sender_name),
                                });
                            } else {
                                if let Some(mut room) = lobbies.get_mut(&room_id) {
                                    room.pending_retract = None;
                                }
                                let sender_name = if role == PlayerRole::Red {
                                    "红方"
                                } else {
                                    "黑方"
                                };
                                let _ = bcast_sender.send(RoomEvent::Info {
                                    message: format!("{} 拒绝了悔棋申请", sender_name),
                                });
                            }
                        }
                    }
                }
            }
            ClientMsg::ResponseRestart { agree } => {
                if role == PlayerRole::Red || role == PlayerRole::Black {
                    let side = if role == PlayerRole::Red {
                        PlayerSide::Red
                    } else {
                        PlayerSide::Black
                    };
                    let mut requester = None;
                    if let Some(room) = lobbies.get(&room_id) {
                        requester = room.pending_restart;
                    }
                    if let Some(req) = requester {
                        if req != side {
                            // Valid response from opponent
                            if agree {
                                if let Some(mut room) = lobbies.get_mut(&room_id) {
                                    room.board = Board::new();
                                    room.moves.clear();
                                    room.pending_restart = None;
                                }
                                broadcast_room_state(&room_id, &lobbies);
                                let sender_name = if role == PlayerRole::Red {
                                    "红方"
                                } else {
                                    "黑方"
                                };
                                let _ = bcast_sender.send(RoomEvent::Info {
                                    message: format!("{} 同意了重局", sender_name),
                                });
                            } else {
                                if let Some(mut room) = lobbies.get_mut(&room_id) {
                                    room.pending_restart = None;
                                }
                                let sender_name = if role == PlayerRole::Red {
                                    "红方"
                                } else {
                                    "黑方"
                                };
                                let _ = bcast_sender.send(RoomEvent::Info {
                                    message: format!("{} 拒绝了重局申请", sender_name),
                                });
                            }
                        }
                    }
                }
            }
            ClientMsg::Chat { message } => {
                let _ = bcast_sender.send(RoomEvent::Chat {
                    sender: role,
                    message,
                });
            }
        }
    }

    // Client disconnected, cleanup connection state
    send_task.abort();

    let mut should_remove = false;
    if let Some(mut room) = lobbies.get_mut(&room_id) {
        if role == PlayerRole::Red {
            room.red_connected = false;
        } else if role == PlayerRole::Black {
            room.black_connected = false;
        }
        if !room.red_connected && !room.black_connected && room.broadcast_tx.receiver_count() <= 1 {
            // Note: receiver_count() might be <= 1 because the current client's receiver task
            // might still count, or is already shut down. Checking <= 1 is safer.
            // Let's check receiver_count() <= 1 or similar, or just check receiver_count() == 0.
            // Actually, when a client websocket disconnects, its receiver is dropped.
            // Let's use <= 1 to be safe, or we can check if it's 0. Let's do `room.broadcast_tx.receiver_count() == 0`
            // since the rx in send_task has been aborted/dropped when `send_task.abort()` is called,
            // but to be absolutely safe, let's use `room.broadcast_tx.receiver_count() <= 0`.
            // Wait, broadcast channel's receiver_count() returns usize. So we check if receiver_count() == 0.
            should_remove = true;
        }
    }

    if should_remove {
        lobbies.remove(&room_id);
    } else {
        // Broadcast final offline status
        broadcast_room_state(&room_id, &lobbies);
    }
}

fn execute_retract(room: &mut Room) {
    if room.moves.is_empty() {
        return;
    }
    let remaining_moves = room.moves.clone();
    room.board = Board::new();
    room.moves.clear();
    for mv_str in remaining_moves
        .iter()
        .take(remaining_moves.len().saturating_sub(1))
    {
        if let Some((src, dst)) = parse_ucci_move(mv_str) {
            if room.board.make_move(src, dst) {
                room.moves.push(mv_str.clone());
            }
        }
    }
}

fn broadcast_room_state(room_id: &str, lobbies: &Lobbies) {
    if let Some(room) = lobbies.get(room_id) {
        let state = RoomState {
            room_id: room.room_id.clone(),
            fen: room.board.to_fen(),
            moves: room.moves.clone(),
            turn: if room.board.sd_player == 0 {
                PlayerSide::Red
            } else {
                PlayerSide::Black
            },
            red_connected: room.red_connected,
            black_connected: room.black_connected,
        };
        let _ = room.broadcast_tx.send(RoomEvent::State(state));
    }
}

// Convert board square coords to UCCI coordinate strings
fn format_ucci_move(src: usize, dst: usize) -> String {
    let src_file = (src & 15) - 3;
    let src_rank = 9 - ((src >> 4) - 3);
    let dst_file = (dst & 15) - 3;
    let dst_rank = 9 - ((dst >> 4) - 3);

    let file_char = |f: usize| -> char {
        match f {
            0 => 'a',
            1 => 'b',
            2 => 'c',
            3 => 'd',
            4 => 'e',
            5 => 'f',
            6 => 'g',
            7 => 'h',
            8 => 'i',
            _ => 'x',
        }
    };

    format!(
        "{}{}{}{}",
        file_char(src_file),
        src_rank,
        file_char(dst_file),
        dst_rank
    )
}

fn parse_ucci_move(mv_str: &str) -> Option<(usize, usize)> {
    if mv_str.len() != 4 {
        return None;
    }
    let chars: Vec<char> = mv_str.chars().collect();
    let file_val = |c: char| -> Option<usize> {
        if ('a'..='i').contains(&c) {
            Some((c as usize - 'a' as usize) + 3)
        } else {
            None
        }
    };
    let rank_val = |c: char| -> Option<usize> {
        if c.is_ascii_digit() {
            Some(9 - (c as usize - '0' as usize) + 3)
        } else {
            None
        }
    };

    let src_file = file_val(chars[0])?;
    let src_rank = rank_val(chars[1])?;
    let dst_file = file_val(chars[2])?;
    let dst_rank = rank_val(chars[3])?;

    Some(((src_rank << 4) + src_file, (dst_rank << 4) + dst_file))
}
