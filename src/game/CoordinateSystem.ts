import { BOARD_OFFSET_X, BOARD_OFFSET_Y, SQUARE_SIZE } from "../constants";
import { FILE_X, IN_BOARD, RANK_Y } from "../engine/position";

export class CoordinateSystem {
  /**
   * Convert engine square index to screen coordinates (pixels).
   * @param sq Engine square index (0-255).
   * @param isFlipped Whether the board is flipped (Black at bottom).
   * @param center If true, returns the center of the square. If false, returns top-left corner.
   */
  static getScreenPosition(
    sq: number,
    isFlipped: boolean,
    center: boolean = false,
  ): { x: number; y: number } {
    const displaySq = isFlipped ? 254 - sq : sq;
    const file = FILE_X(displaySq);
    const rank = RANK_Y(displaySq);

    // Engine coordinates: file 3-11, rank 3-12
    // Screen coordinates offset: file - 3, rank - 3
    let x = BOARD_OFFSET_X + (file - 3) * SQUARE_SIZE;
    let y = BOARD_OFFSET_Y + (rank - 3) * SQUARE_SIZE;

    if (center) {
      x += SQUARE_SIZE / 2;
      y += SQUARE_SIZE / 2;
    }

    return { x, y };
  }

  /**
   * Convert screen coordinates (pixels) to engine square index.
   * @param x Screen X.
   * @param y Screen Y.
   * @param isFlipped Whether the board is flipped.
   * @returns Engine square index, or null if out of board.
   */
  static getSquareAt(x: number, y: number, isFlipped: boolean): number | null {
    const col = Math.floor((x - BOARD_OFFSET_X) / SQUARE_SIZE);
    const row = Math.floor((y - BOARD_OFFSET_Y) / SQUARE_SIZE);

    const file = col + 3;
    const rank = row + 3;

    // Basic bounds check
    if (file < 3 || file > 11 || rank < 3 || rank > 12) return null;

    let sq = (rank << 4) + file;

    // Verify valid board square
    if (!IN_BOARD(sq)) return null;

    // Handle Flip
    if (isFlipped) {
      sq = 254 - sq;
    }

    return sq;
  }
}
