// backend/src/board.rs

pub const PIECE_KING: u8 = 0; // 帅/将
pub const PIECE_ADVISOR: u8 = 1; // 仕/士
pub const PIECE_BISHOP: u8 = 2; // 象
pub const PIECE_KNIGHT: u8 = 3; // 马
pub const PIECE_ROOK: u8 = 4; // 车
pub const PIECE_CANNON: u8 = 5; // 炮
pub const PIECE_PAWN: u8 = 6; // 兵/卒

const IN_BOARD_: [u8; 256] = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0,
    0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const IN_FORT_: [u8; 256] = [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

// LEGAL_SPAN and home_half have been cleaned up because legal_span handles the match

// Let's populate the non-zero span elements during runtime or as static array.
// In JS:
// LEGAL_SPAN[dst - src + 256]:
// 3 at -34, -30, 30, 34 (Bishop moves: rank delta = 2, file delta = 2)
// 2 at -17, -15, 15, 17 (Advisor moves: rank delta = 1, file delta = 1)
// 1 at -16, -1, 1, 16 (King / Pawn moves: rank/file delta = 1)
// Let's define it explicitly as a helper function instead of array to be safer and avoid any index issues, or map it:
fn legal_span(diff: i32) -> u8 {
    match diff {
        -16 | -1 | 1 | 16 => 1,
        -17 | -15 | 15 | 17 => 2,
        -34 | -30 | 30 | 34 => 3,
        _ => 0,
    }
}

// In JS: KNIGHT_PIN_ = [...]
// Non-zero values are:
// index 256-16 = 240: -16
// index 256-16 = 240? Wait:
// line 120: 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -16, 0, -16, 0, 0, 0
// Wait, let's write a direct formula for knight pin to avoid relying on hardcoded offset list!
// In Xiangqi, a knight moves from sqSrc to sqDst.
// The knight moves in an L-shape (2 squares in one direction, 1 in the perpendicular direction).
// The pin (obstruction) is the square adjacent to sqSrc in the direction of the 2-square step.
// Let's compute it:
// Let ySrc = sqSrc >> 4, xSrc = sqSrc & 15.
// Let yDst = sqDst >> 4, xDst = sqDst & 15.
// dy = yDst - ySrc, dx = xDst - xSrc.
// If abs(dy) == 2 && abs(dx) == 1:
//   pin square is sqSrc + (dy / 2 << 4) = sqSrc + (dy / 2 * 16)
// If abs(dy) == 1 && abs(dx) == 2:
//   pin square is sqSrc + dx / 2.
// This is extremely simple, robust, and doesn't require any pre-computed array!
fn knight_pin(sq_src: usize, sq_dst: usize) -> usize {
    let y_src = (sq_src >> 4) as i32;
    let x_src = (sq_src & 15) as i32;
    let y_dst = (sq_dst >> 4) as i32;
    let x_dst = (sq_dst & 15) as i32;
    let dy = y_dst - y_src;
    let dx = x_dst - x_src;
    if dy.abs() == 2 && dx.abs() == 1 {
        (sq_src as i32 + (dy / 2) * 16) as usize
    } else if dy.abs() == 1 && dx.abs() == 2 {
        (sq_src as i32 + dx / 2) as usize
    } else {
        sq_src // Invalid knight move
    }
}

pub fn in_board(sq: usize) -> bool {
    sq < 256 && IN_BOARD_[sq] != 0
}

pub fn in_fort(sq: usize) -> bool {
    sq < 256 && IN_FORT_[sq] != 0
}

pub fn side_tag(sd: usize) -> u8 {
    (8 + (sd << 3)) as u8
}

pub fn opp_side_tag(sd: usize) -> u8 {
    (16 - (sd << 3)) as u8
}

pub fn square_forward(sq: usize, sd: usize) -> usize {
    (sq as i32 - 16 + (sd << 5) as i32) as usize
}

pub fn king_span(sq_src: usize, sq_dst: usize) -> bool {
    let diff = sq_dst as i32 - sq_src as i32;
    legal_span(diff) == 1
}

pub fn advisor_span(sq_src: usize, sq_dst: usize) -> bool {
    let diff = sq_dst as i32 - sq_src as i32;
    legal_span(diff) == 2
}

pub fn bishop_span(sq_src: usize, sq_dst: usize) -> bool {
    let diff = sq_dst as i32 - sq_src as i32;
    legal_span(diff) == 3
}

pub fn bishop_pin(sq_src: usize, sq_dst: usize) -> usize {
    (sq_src + sq_dst) >> 1
}

pub fn away_half(sq: usize, sd: usize) -> bool {
    (sq & 0x80) == (sd << 7)
}

pub fn same_half(sq_src: usize, sq_dst: usize) -> bool {
    ((sq_src ^ sq_dst) & 0x80) == 0
}

pub fn same_rank(sq_src: usize, sq_dst: usize) -> bool {
    ((sq_src ^ sq_dst) & 0xf0) == 0
}

pub fn same_file(sq_src: usize, sq_dst: usize) -> bool {
    ((sq_src ^ sq_dst) & 0x0f) == 0
}

const KING_DELTA: [i32; 4] = [-16, -1, 1, 16];
const ADVISOR_DELTA: [i32; 4] = [-17, -15, 15, 17];
const KNIGHT_CHECK_DELTA: [[i32; 2]; 4] = [[-33, -18], [-31, -14], [14, 31], [18, 33]];

#[derive(Clone, Debug)]
pub struct Board {
    pub squares: [u8; 256],
    pub sd_player: usize, // 0 for Red, 1 for Black
}

impl Board {
    pub fn new() -> Self {
        let mut b = Board {
            squares: [0; 256],
            sd_player: 0,
        };
        b.load_fen("rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1");
        b
    }

    pub fn load_fen(&mut self, fen: &str) {
        self.squares = [0; 256];
        let mut parts = fen.split_whitespace();
        let board_part = parts.next().unwrap_or("");
        let active_part = parts.next().unwrap_or("w");

        self.sd_player = if active_part == "b" { 1 } else { 0 };

        let mut rank = 3;
        let mut file = 3;

        for ch in board_part.chars() {
            if ch == '/' {
                rank += 1;
                file = 3;
            } else if ch.is_ascii_digit() {
                let count = ch.to_digit(10).unwrap() as usize;
                file += count;
            } else {
                let sq = (rank << 4) + file;
                let pc = match ch {
                    'K' => 8 + PIECE_KING,
                    'A' => 8 + PIECE_ADVISOR,
                    'B' => 8 + PIECE_BISHOP,
                    'N' => 8 + PIECE_KNIGHT,
                    'R' => 8 + PIECE_ROOK,
                    'C' => 8 + PIECE_CANNON,
                    'P' => 8 + PIECE_PAWN,
                    'k' => 16 + PIECE_KING,
                    'a' => 16 + PIECE_ADVISOR,
                    'b' => 16 + PIECE_BISHOP,
                    'n' => 16 + PIECE_KNIGHT,
                    'r' => 16 + PIECE_ROOK,
                    'c' => 16 + PIECE_CANNON,
                    'p' => 16 + PIECE_PAWN,
                    _ => 0,
                };
                if sq < 256 {
                    self.squares[sq] = pc;
                }
                file += 1;
            }
        }
    }

    pub fn to_fen(&self) -> String {
        let mut board_str = String::new();
        for rank in 3..13 {
            let mut empty = 0;
            for file in 3..12 {
                let sq = (rank << 4) + file;
                let pc = self.squares[sq];
                if pc == 0 {
                    empty += 1;
                } else {
                    if empty > 0 {
                        board_str.push_str(&empty.to_string());
                        empty = 0;
                    }
                    let ch = match pc {
                        8 => 'K',
                        9 => 'A',
                        10 => 'B',
                        11 => 'N',
                        12 => 'R',
                        13 => 'C',
                        14 => 'P',
                        16 => 'k',
                        17 => 'a',
                        18 => 'b',
                        19 => 'n',
                        20 => 'r',
                        21 => 'c',
                        22 => 'p',
                        _ => '?',
                    };
                    board_str.push(ch);
                }
            }
            if empty > 0 {
                board_str.push_str(&empty.to_string());
            }
            if rank < 12 {
                board_str.push('/');
            }
        }
        let active = if self.sd_player == 0 { "w" } else { "b" };
        format!("{} {} - - 0 1", board_str, active)
    }

    pub fn legal_move(&self, src: usize, dst: usize) -> bool {
        if !in_board(src) || !in_board(dst) {
            return false;
        }
        let pc_src = self.squares[src];
        let pc_self_side = side_tag(self.sd_player);
        if (pc_src & pc_self_side) == 0 {
            return false;
        }

        let pc_dst = self.squares[dst];
        if (pc_dst & pc_self_side) != 0 {
            return false;
        }

        match pc_src - pc_self_side {
            PIECE_KING => in_fort(dst) && king_span(src, dst),
            PIECE_ADVISOR => in_fort(dst) && advisor_span(src, dst),
            PIECE_BISHOP => {
                same_half(src, dst)
                    && bishop_span(src, dst)
                    && self.squares[bishop_pin(src, dst)] == 0
            }
            PIECE_KNIGHT => {
                let pin = knight_pin(src, dst);
                pin != src && self.squares[pin] == 0
            }
            PIECE_ROOK | PIECE_CANNON => {
                let delta = if same_rank(src, dst) {
                    if dst < src { -1 } else { 1 }
                } else if same_file(src, dst) {
                    if dst < src { -16 } else { 16 }
                } else {
                    return false;
                };

                let mut pin = (src as i32 + delta) as usize;
                while pin != dst && self.squares[pin] == 0 {
                    pin = (pin as i32 + delta) as usize;
                }

                if pin == dst {
                    return pc_dst == 0 || (pc_src - pc_self_side) != PIECE_CANNON;
                }
                if pc_dst == 0 || (pc_src - pc_self_side) != PIECE_CANNON {
                    return false;
                }

                pin = (pin as i32 + delta) as usize;
                while pin != dst && self.squares[pin] == 0 {
                    pin = (pin as i32 + delta) as usize;
                }

                pin == dst
            }
            PIECE_PAWN => {
                if away_half(dst, self.sd_player) && (dst == src - 1 || dst == src + 1) {
                    return true;
                }
                dst == square_forward(src, self.sd_player)
            }
            _ => false,
        }
    }

    pub fn checked(&self) -> bool {
        let pc_self_side = side_tag(self.sd_player);
        let pc_opp_side = opp_side_tag(self.sd_player);

        // Find self King
        let mut sq_king = 0;
        for sq in 0..256 {
            if self.squares[sq] == pc_self_side + PIECE_KING {
                sq_king = sq;
                break;
            }
        }
        if sq_king == 0 {
            return false;
        }

        // 1. Check Pawn threat
        let forward = square_forward(sq_king, self.sd_player);
        if forward < 256 && self.squares[forward] == pc_opp_side + PIECE_PAWN {
            return true;
        }
        if sq_king > 0 && self.squares[sq_king - 1] == pc_opp_side + PIECE_PAWN {
            return true;
        }
        if sq_king < 255 && self.squares[sq_king + 1] == pc_opp_side + PIECE_PAWN {
            return true;
        }

        // 2. Check Knight threat
        for i in 0..4 {
            let idx = sq_king as i32 + ADVISOR_DELTA[i];
            if (0..256).contains(&idx) && self.squares[idx as usize] != 0 {
                continue;
            }
            for &offset in &KNIGHT_CHECK_DELTA[i] {
                let target = sq_king as i32 + offset;
                if (0..256).contains(&target)
                    && self.squares[target as usize] == pc_opp_side + PIECE_KNIGHT
                {
                    return true;
                }
            }
        }

        // 3. Check Rook, Cannon, King threats (long-range sliding pieces)
        for &delta in &KING_DELTA {
            let mut sq_dst = (sq_king as i32 + delta) as usize;
            while in_board(sq_dst) {
                let pc_dst = self.squares[sq_dst];
                if pc_dst > 0 {
                    if pc_dst == pc_opp_side + PIECE_ROOK || pc_dst == pc_opp_side + PIECE_KING {
                        return true;
                    }
                    break;
                }
                sq_dst = (sq_dst as i32 + delta) as usize;
            }
            sq_dst = (sq_dst as i32 + delta) as usize;
            while in_board(sq_dst) {
                let pc_dst = self.squares[sq_dst];
                if pc_dst > 0 {
                    if pc_dst == pc_opp_side + PIECE_CANNON {
                        return true;
                    }
                    break;
                }
                sq_dst = (sq_dst as i32 + delta) as usize;
            }
        }

        false
    }

    pub fn make_move(&mut self, src: usize, dst: usize) -> bool {
        if !self.legal_move(src, dst) {
            return false;
        }

        let pc_src = self.squares[src];
        let pc_dst = self.squares[dst];

        // Try moving
        self.squares[src] = 0;
        self.squares[dst] = pc_src;

        if self.checked() {
            // Undo move
            self.squares[src] = pc_src;
            self.squares[dst] = pc_dst;
            return false;
        }

        // Switch active player
        self.sd_player = 1 - self.sd_player;
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_board_initialization() {
        let b = Board::new();
        // Red king should be at rank 12 (bottom), file 7 (middle) -> 12 * 16 + 7 = 199
        assert_eq!(b.squares[199], 8 + PIECE_KING);
    }

    #[test]
    fn test_legal_moves() {
        let mut b = Board::new();
        // Pawn at 9 * 16 + 3 = 147 moving forward to 131 should be legal
        assert!(b.legal_move(147, 131));
        // Moving backward to 163 should be illegal
        assert!(!b.legal_move(147, 163));

        // Make legal move
        assert!(b.make_move(147, 131));
        assert_eq!(b.squares[147], 0);
        assert_eq!(b.squares[131], 8 + PIECE_PAWN);
    }
}
