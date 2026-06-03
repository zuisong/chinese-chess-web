import { createSignal, Show, createStore, createEffect } from "solid-js";
import { For } from "@solidjs/web";
import { BOARD_WIDTH, BOARD_HEIGHT, SQUARE_SIZE, PIECE_IMAGE_MAP } from "../constants";
import { GameStateManager, SoundManager, StorageManager } from "../core";
import { XiangQiEngine } from "../engine/index";
import { DST, IN_BOARD, SRC } from "../engine/position";
import type { Move, PieceType, Square } from "../engine/types";
import {
  animated,
  difficulty,
  handicap,
  moveMode,
  setAnimated,
  setDifficulty,
  setHandicap,
  setMainScene,
  setMoveMode,
  setScores,
  setShowScore,
  setSoundEnabled,
  setThinking,
  showScore,
  soundEnabled,
  thinking,
  onlineRoomId,
  setOnlineRoomId,
  onlineRole,
  setOnlineRole,
  onlineTurn,
  setOnlineTurn,
  setOnlineRedConnected,
  setOnlineBlackConnected,
  setOnlineToken,
  setOnlineConnected,
  setChatMessages,
} from "../store";
import { locale } from "../i18n";
import type { Difficulty } from "../types";
import type { Handicap, MoveMode } from "../types/ui.types";
import { CoordinateSystem } from "../game/CoordinateSystem";
import boardImg from "../assets/images/board.jpg";
import oosImg from "../assets/images/oos.gif";
import thinkingImg from "../assets/images/thinking.gif";
import { createMove, unsafeSquare } from "../engine/types";

interface PieceData {
  sq: number;
  pieceType: PieceType;
  x: number;
  y: number;
  animating: boolean;
}

const STARTUP_FEN = [
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKABNR w - - 0 1",
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w - - 0 1",
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w - - 0 1",
];

export default function GameBoard() {
  const [pieces, setPieces] = createStore<PieceData[]>([]);
  const [selectedSquare, setSelectedSquare] = createSignal<number | null>(null);
  const [validMoves, setValidMoves] = createSignal<number[]>([]);
  const [isBusy, setIsBusy] = createSignal(false);
  const [initialFen, setInitialFen] = createSignal("");

  const isFlipped = () => onlineRole() === "black";

  // Core instances
  const engine = new XiangQiEngine();
  const storageManager = new StorageManager();
  const soundManager = new SoundManager(true);
  const gameState = new GameStateManager(engine);

  let ws: WebSocket | null = null;

  function connectSocket(roomId: string, token: string) {
    if (ws) {
      ws.close();
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/match/${roomId}?token=${token}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setOnlineConnected(true);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "init") {
        setOnlineRoomId(data.room_id);
        setOnlineRole(data.role);
        setOnlineToken(data.token);
        setOnlineTurn(data.turn);
        setOnlineRedConnected(data.red_connected);
        setOnlineBlackConnected(data.black_connected);

        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set("room", data.room_id);
        url.searchParams.set("token", data.token);
        window.history.replaceState({}, "", url.toString());

        // Load board
        engine.loadFen(data.fen);
        createPieces();
        flushBoard();
        setScores(() => engine.getScores());
      } else if (data.type === "state") {
        setOnlineTurn(data.turn);
        setOnlineRedConnected(data.red_connected);
        setOnlineBlackConnected(data.black_connected);

        if (engine.getFen() !== data.fen) {
          if (data.moves.length > engine.getHistoryLength()) {
            const lastMoveStr = data.moves[data.moves.length - 1];
            const mv = engine.ucciMoveToInternal(lastMoveStr);
            const src = SRC(mv);
            const dst = DST(mv);
            animateMove(src, dst).then(() => {
              engine.loadFen(data.fen);
              flushBoard();
              soundManager.playMove();
              checkGameStateLocal();
            });
          } else {
            engine.loadFen(data.fen);
            flushBoard();
            checkGameStateLocal();
          }
        }
      } else if (data.type === "chat") {
        setChatMessages((prev) => [...prev, { sender: data.sender, message: data.message }]);
      } else if (data.type === "retract_request") {
        const sideName = data.sender === "red" ? "红方" : "黑方";
        const agree = confirm(`对方 (${sideName}) 申请悔棋，您同意吗？`);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "response_retract", agree }));
        }
      } else if (data.type === "restart_request") {
        const sideName = data.sender === "red" ? "红方" : "黑方";
        const agree = confirm(`对方 (${sideName}) 申请重新开始，您同意吗？`);
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "response_restart", agree }));
        }
      } else if (data.type === "info") {
        setChatMessages((prev) => [...prev, { sender: "system", message: data.message }]);
      } else if (data.type === "error") {
        alert(data.message);
      }
    };

    ws.onclose = () => {
      setOnlineConnected(false);
    };
  }

  // Create the public API object
  const gameController = {
    retract: () => {
      if (onlineRoomId()) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "request_retract" }));
        }
        return;
      }
      if (engine.getHistoryLength() > 1) {
        engine.undoInternalMove();
        if (moveMode() !== 2 && engine.getHistoryLength() > 1) {
          engine.undoInternalMove();
        }
        flushBoard();
        setScores(() => engine.getScores());
        saveGame();
      }
    },
    recommend: () => {
      if (onlineRoomId()) {
        alert("在线对局不能使用提示");
        return;
      }
      if (isBusy()) return;
      if (engine.isMate() || engine.repStatus(3) > 0) return;

      clearSelection();
      setThinking(true);
      setIsBusy(true);

      setTimeout(() => {
        const ucciMove = engine.findBestMove(64, 1000);
        setThinking(false);
        setIsBusy(false);
        if (ucciMove !== "nomove") {
          const internalMove = engine.ucciMoveToInternal(ucciMove);
          addMove(internalMove);
        }
      }, 100);
    },
    setSound: (enabled: boolean) => {
      soundManager.setEnabled(enabled);
      setSoundEnabled(enabled);
      saveGame();
    },
    setDifficulty: (level: Difficulty) => {
      gameState.setDifficulty(level);
      setDifficulty(level);
      saveGame();
    },
    setMoveMode: (mode: MoveMode) => {
      gameState.setMoveMode(mode);
      setMoveMode(mode);
      saveGame();
    },
    setHandicap: (val: Handicap) => {
      gameState.setHandicap(val);
      setHandicap(val);
      saveGame();
    },
    setAnimated: (enabled: boolean) => {
      setAnimated(enabled);
      saveGame();
    },
    setShowScore: (show: boolean) => {
      setShowScore(show);
      saveGame();
    },
    restart: () => {
      if (onlineRoomId()) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: "request_restart" }));
        }
        return;
      }
      const fen = STARTUP_FEN[handicap()] || STARTUP_FEN[0];
      setInitialFen(fen);
      engine.loadFen(fen);

      createPieces();
      clearSelection();
      setIsBusy(false);

      if (moveMode() === 1) {
        response();
      } else {
        checkGameState();
      }
      setScores(() => engine.getScores());
      saveGame();
    },
    getScores: () => engine.getScores(),
    getMoveList: () => {
      return engine.getMoveList().map((m) => {
        const ucci = engine.moveToString(m);
        return `${ucci.slice(0, 2).toUpperCase()}-${ucci.slice(2, 4).toUpperCase()}`;
      });
    },
    createOnlineGame: async (side: "red" | "black" = "red") => {
      try {
        const res = await fetch(`/api/match/create?side=${side}`, {
          method: "POST",
        });
        const data = await res.json();
        if (data.room_id) {
          connectSocket(data.room_id, data.token);
        }
      } catch (err) {
        console.error("Failed to create online game:", err);
        alert("无法连接服务器以创建对战");
      }
    },
    sendChat: (msg: string) => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "chat", message: msg }));
      }
    },
    quitOnlineGame: () => {
      if (ws) {
        ws.close();
        ws = null;
      }
      setOnlineRoomId(null);
      setOnlineRole(null);
      setOnlineTurn(null);
      setOnlineToken(null);
      setOnlineConnected(false);
      setChatMessages([]);

      const url = new URL(window.location.href);
      url.searchParams.delete("room");
      url.searchParams.delete("token");
      window.history.replaceState({}, "", url.toString());
      loadGame();
    },
  };

  function computerMove() {
    if (onlineRoomId()) return false;
    let side = 1;
    if (moveMode() === 1) side = 0;
    if (moveMode() === 2) return false;
    return engine.sdPlayer === side;
  }

  function createPieces() {
    const newPieces: PieceData[] = [];
    for (let i = 0; i < 256; i++) {
      if (IN_BOARD(i)) {
        const pieceType = engine.getPiece(unsafeSquare(i));
        const pos = CoordinateSystem.getScreenPosition(i, isFlipped(), false);
        newPieces.push({
          sq: i,
          pieceType,
          x: pos.x,
          y: pos.y,
          animating: false,
        });
      }
    }
    setPieces(() => newPieces);
  }

  function flushBoard() {
    setPieces((draft) => {
      for (const p of draft) {
        const pieceType = engine.getPiece(unsafeSquare(p.sq));
        const pos = CoordinateSystem.getScreenPosition(p.sq, isFlipped(), false);
        p.pieceType = pieceType;
        p.x = pos.x;
        p.y = pos.y;
        p.animating = false;
      }
    });
  }

  function clearSelection() {
    setSelectedSquare(null);
    setValidMoves([]);
    gameState.clearSelection();
  }

  function updateSelection() {
    const sq = gameState.selectedSquare;
    if (sq === 0) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    const piece = pieces.find((p) => p.sq === sq);
    if (piece && piece.pieceType !== 0) {
      setSelectedSquare(sq);
      const moves = gameState.getLegalMoves(unsafeSquare(sq));
      setValidMoves(moves.map((mv) => DST(mv)));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  }

  async function animateMove(src: number, dst: number): Promise<void> {
    if (!animated()) {
      return Promise.resolve();
    }

    const dstPos = CoordinateSystem.getScreenPosition(dst, isFlipped(), false);

    return new Promise<void>((resolve) => {
      setPieces((draft) => {
        const piece = draft.find((p) => p.sq === src);
        if (piece) {
          piece.x = dstPos.x;
          piece.y = dstPos.y;
          piece.animating = true;
        }
      });

      setTimeout(() => {
        resolve();
      }, 200);
    });
  }

  async function makeMove(src: Square, dst: Square) {
    const mv = createMove(src, dst);
    if (!engine.legalMove(mv)) {
      clearSelection();
      return;
    }

    if (onlineRoomId()) {
      if (onlineRole() !== onlineTurn()) {
        alert("不是你的回合！");
        clearSelection();
        return;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "move", src, dst }));
      }
      clearSelection();
      return;
    }

    if (!engine.makeInternalMove(mv)) {
      soundManager.playIllegal();
      return;
    }

    setIsBusy(true);
    await animateMove(src as number, dst as number);
    flushBoard();
    soundManager.playMove();
    clearSelection();
    checkGameState();
    saveGame();
  }

  function checkGameState() {
    if (engine.isMate()) {
      const isWin = computerMove();
      if (isWin) {
        soundManager.playWin();
      } else {
        soundManager.playLoss();
      }
      alert(isWin ? "你赢了！" : "你输了！");
      setIsBusy(false);
      return;
    }
    if (engine.repStatus(3) > 0) {
      soundManager.playDraw();
      alert("双方不变作和");
      setIsBusy(false);
      return;
    }

    if (engine.inCheck()) {
      if (computerMove()) {
        soundManager.playCheck2();
      } else {
        soundManager.playCheck();
      }
    } else if (engine.captured()) {
      if (computerMove()) {
        soundManager.playCapture2();
      } else {
        soundManager.playCapture();
      }
    } else {
      if (computerMove()) {
        soundManager.playMove2();
      } else {
        soundManager.playMove();
      }
    }

    setScores(() => engine.getScores());
    response();
  }

  function checkGameStateLocal() {
    if (engine.isMate()) {
      alert("对局结束！");
      setIsBusy(false);
      return;
    }
    if (engine.repStatus(3) > 0) {
      soundManager.playDraw();
      alert("双方不变作和");
      setIsBusy(false);
      return;
    }

    if (engine.inCheck()) {
      soundManager.playCheck();
    } else if (engine.captured()) {
      soundManager.playCapture();
    } else {
      soundManager.playMove();
    }

    setScores(() => engine.getScores());
  }

  function response() {
    if (!computerMove()) {
      setIsBusy(false);
      return;
    }

    setThinking(true);
    setIsBusy(true);

    setTimeout(() => {
      const ucciMove = engine.findBestMove(64, 1000);
      setThinking(false);

      if (ucciMove === "nomove") {
        setIsBusy(false);
        return;
      }
      const internalMove = engine.ucciMoveToInternal(ucciMove);
      addMove(internalMove);
    }, 250);
  }

  async function addMove(mv: Move) {
    if (!engine.legalMove(mv)) return;
    if (!engine.makeInternalMove(mv)) return;

    setIsBusy(true);
    await animateMove(SRC(mv as number), DST(mv as number));
    flushBoard();
    checkGameState();
    saveGame();
  }

  function saveGame() {
    if (onlineRoomId()) return; // Online games are hosted on server
    const moves = engine
      .getMoveList()
      .filter((m) => (m as number) > 0)
      .map((m) => engine.moveToString(m));
    const s = {
      fen: engine.getFen(),
      initialFen: initialFen() || engine.getFen(),
      moves,
      handicap: handicap(),
      moveMode: moveMode(),
      difficulty: difficulty(),
      soundEnabled: soundEnabled(),
      animated: animated(),
      showScore: showScore(),
    };
    storageManager.save(s);
  }

  function loadGame() {
    const s = storageManager.load();
    if (s) {
      if (s.handicap !== undefined) setHandicap(s.handicap);
      if (s.moveMode !== undefined) setMoveMode(s.moveMode);
      if (s.difficulty !== undefined) setDifficulty(s.difficulty);
      if (s.soundEnabled !== undefined) {
        setSoundEnabled(s.soundEnabled);
        soundManager.setEnabled(s.soundEnabled);
      }
      if (s.animated !== undefined) setAnimated(s.animated);
      if (s.showScore !== undefined) setShowScore(s.showScore);

      if (s.initialFen && s.moves) {
        setInitialFen(s.initialFen);
        engine.loadFen(s.initialFen);
        for (const u of s.moves) {
          const mv = engine.ucciMoveToInternal(u);
          engine.makeInternalMove(mv);
        }
      } else if (s.fen) {
        engine.loadFen(s.fen);
        setInitialFen(s.fen);
      }
      createPieces();
      flushBoard();
      checkGameState();
      setScores(() => engine.getScores());
    } else {
      gameController.restart();
    }
  }

  function handleClick(e: MouseEvent) {
    if (isBusy()) return;

    const target = e.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();

    const xPercent = (e.clientX - rect.left) / rect.width;
    const yPercent = (e.clientY - rect.top) / rect.height;

    const x = xPercent * BOARD_WIDTH;
    const y = yPercent * BOARD_HEIGHT;

    const sq = CoordinateSystem.getSquareAt(x, y, isFlipped());
    if (sq !== null) {
      clickSquare(unsafeSquare(sq));
    }
  }

  function clickSquare(sq: Square) {
    // If playing online and is not our turn, don't allow selecting pieces belonging to us
    if (onlineRoomId() && onlineRole() !== onlineTurn()) {
      return;
    }

    if (gameState.selectPiece(sq)) {
      soundManager.playClick();
      updateSelection();
      return;
    }
    const move = gameState.tryMove(sq);
    if (move) {
      const src = SRC(move);
      const dst = DST(move);
      makeMove(unsafeSquare(src), unsafeSquare(dst));
    }
  }

  function getSelectedPosition() {
    if (selectedSquare() === null) return null;
    return CoordinateSystem.getScreenPosition(selectedSquare()!, isFlipped(), false);
  }

  createEffect(
    () => locale(),
    (l) => {
      localStorage.setItem("locale", l);
      document.title = (l === "ja" ? "将棋" : "象棋") + " (Xiangqi)";
    },
  );

  createEffect(
    () => {},
    () => {
      setMainScene(() => gameController);

      const params = new URLSearchParams(window.location.search);
      const room = params.get("room");
      const token = params.get("token") || "";
      if (room) {
        connectSocket(room, token);
      } else {
        loadGame();
      }
    },
  );

  return (
    <div class="relative flex w-full items-center justify-center overflow-hidden p-1">
      <div
        class="game-board relative aspect-521/577 w-full max-w-[521px] cursor-pointer rounded-sm shadow-2xl"
        style={{
          "background-image": `url(${boardImg})`,
          "background-size": "100% 100%",
          "touch-action": "none",
        }}
        onClick={handleClick}
      >
        {/* Selection marker */}
        <Show when={selectedSquare() !== null}>
          <img
            src={oosImg}
            alt="selected"
            style={{
              position: "absolute",
              left: `${(getSelectedPosition()!.x / BOARD_WIDTH) * 100}%`,
              top: `${(getSelectedPosition()!.y / BOARD_HEIGHT) * 100}%`,
              width: `${(SQUARE_SIZE / BOARD_WIDTH) * 100}%`,
              height: `${(SQUARE_SIZE / BOARD_HEIGHT) * 100}%`,
              "pointer-events": "none",
              "z-index": 5,
            }}
          />
        </Show>

        {/* Valid move markers */}
        <For each={validMoves()}>
          {(dst) => {
            const pos = CoordinateSystem.getScreenPosition(dst, isFlipped(), true);
            return (
              <div
                style={{
                  position: "absolute",
                  left: `${(pos.x / BOARD_WIDTH) * 100}%`,
                  top: `${(pos.y / BOARD_HEIGHT) * 100}%`,
                  width: "3%",
                  height: "auto",
                  "aspect-ratio": "1/1",
                  "border-radius": "50%",
                  "background-color": "rgba(0, 0, 255, 0.5)",
                  "pointer-events": "none",
                  "z-index": 15,
                  transform: "translate(-50%, -50%)",
                }}
              />
            );
          }}
        </For>

        {/* Pieces - using For for iterations */}
        <For each={pieces}>
          {(piece) => {
            const textureKey = () => PIECE_IMAGE_MAP[piece.pieceType];
            return (
              <Show when={textureKey() && piece.pieceType !== 0}>
                <img
                  data-sq={piece.sq}
                  src={textureKey()}
                  alt="piece"
                  style={{
                    position: "absolute",
                    left: `${(piece.x / BOARD_WIDTH) * 100}%`,
                    top: `${(piece.y / BOARD_HEIGHT) * 100}%`,
                    width: `${(SQUARE_SIZE / BOARD_WIDTH) * 100}%`,
                    height: `${(SQUARE_SIZE / BOARD_HEIGHT) * 100}%`,
                    transition: piece.animating ? "left 0.2s linear, top 0.2s linear" : "none",
                    "pointer-events": "none",
                    "z-index": piece.animating ? 100 : 10,
                  }}
                />
              </Show>
            );
          }}
        </For>

        {/* Thinking indicator */}
        <Show when={thinking()}>
          <div
            style={{
              position: "absolute",
              inset: "0",
              display: "flex",
              "justify-content": "center",
              "align-items": "center",
              "pointer-events": "none",
              "z-index": 200,
            }}
          >
            <img src={thinkingImg} alt="thinking" style={{ width: "10%", height: "auto" }} />
          </div>
        </Show>
      </div>
    </div>
  );
}
