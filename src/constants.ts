// src/constants.ts

export const BOARD_WIDTH = 521;
export const BOARD_HEIGHT = 577;
export const SQUARE_SIZE = 57;

// Horizontal Layout (Desktop)
export const UI_WIDTH = 300;
export const TOTAL_WIDTH_HORIZONTAL = BOARD_WIDTH + UI_WIDTH;
export const TOTAL_HEIGHT_HORIZONTAL = BOARD_HEIGHT;
export const UI_OFFSET_X_HORIZONTAL = BOARD_WIDTH + 20;
export const UI_OFFSET_Y_HORIZONTAL = 20;

// Vertical Layout (Mobile)
// UI will be below the board
export const UI_HEIGHT_VERTICAL = 350; // Enough space for controls
export const TOTAL_WIDTH_VERTICAL = BOARD_WIDTH; // Fit to board width
export const TOTAL_HEIGHT_VERTICAL = BOARD_HEIGHT + UI_HEIGHT_VERTICAL;
export const UI_OFFSET_X_VERTICAL = 20; // Padding left
export const UI_OFFSET_Y_VERTICAL = BOARD_HEIGHT + 20; // Padding top from board bottom

// General
export const BOARD_OFFSET_X = (BOARD_WIDTH - SQUARE_SIZE * 9) / 2;
export const BOARD_OFFSET_Y = (BOARD_HEIGHT - SQUARE_SIZE * 10) / 2;

export const UI_LINE_HEIGHT = 40;
export const FONT_SIZE = 20;

// Piece names mapping to image files
// Piece assets
import rk from "./assets/images/rk.gif";
import ra from "./assets/images/ra.gif";
import rb from "./assets/images/rb.gif";
import rn from "./assets/images/rn.gif";
import rr from "./assets/images/rr.gif";
import rc from "./assets/images/rc.gif";
import rp from "./assets/images/rp.gif";
import bk from "./assets/images/bk.gif";
import ba from "./assets/images/ba.gif";
import bb from "./assets/images/bb.gif";
import bn from "./assets/images/bn.gif";
import br from "./assets/images/br.gif";
import bc from "./assets/images/bc.gif";
import bp from "./assets/images/bp.gif";
import oo from "./assets/images/oo.gif";

// Piece names mapping to image files
export const PIECE_IMAGE_MAP = {
  0: oo, // Empty square
  // Red Pieces (sdPlayer = 0, pc is 8-14)
  8: rk, // Red King
  9: ra, // Red Advisor
  10: rb, // Red Bishop
  11: rn, // Red Knight
  12: rr, // Red Rook
  13: rc, // Red Cannon
  14: rp, // Red Pawn

  // Black Pieces (sdPlayer = 1, pc is 16-22)
  16: bk, // Black King
  17: ba, // Black Advisor
  18: bb, // Black Bishop
  19: bn, // Black Knight
  20: br, // Black Rook
  21: bc, // Black Cannon
  22: bp, // Black Pawn
} as const;

// Engine's internal board representation
export const FILE_LEFT_ENGINE = 3;
export const RANK_TOP_ENGINE = 3;
