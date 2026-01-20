// src/engine/index.ts
import { ASC, DST, Position, SRC } from "./position.ts";
import { Search } from "./search.ts";
import type { GameScores, GameStatus, Move, PieceType, Side, Square } from "./types";
import {
  createMove,
  createSquare,
  getSquareFile,
  getSquareRank,
  unsafeMove,
  unsafeSquare,
} from "./types";

// Re-export types for backward compatibility
export type { PieceType, Square, Move, Side, GameScores, GameStatus };

const HASH_LEVEL = 18;

export class XiangQiEngine {
  private _position: Position;
  private _search: Search;
  private _currentFen: string;

  constructor() {
    this._position = new Position();
    this._search = new Search(this._position, HASH_LEVEL);
    this._currentFen = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"; // Initial FEN
    this._position.fromFen(this._currentFen);
  }

  loadFen(fen: string): boolean {
    try {
      this._position.fromFen(fen);
      this._currentFen = fen;
      // Re-initialize search after changing position
      this._search = new Search(this._position, HASH_LEVEL);
      return true;
    } catch (e) {
      console.error("Invalid FEN:", e);
      return false;
    }
  }

  // UCCI move string to internal move number
  ucciMoveToInternal(ucciMove: string): Move {
    if (ucciMove.length !== 4) {
      return 0 as Move; // Invalid move format
    }
    const srcSquare = this.ucciToSquare(ucciMove.substring(0, 2));
    const dstSquare = this.ucciToSquare(ucciMove.substring(2, 4));
    return createMove(srcSquare, dstSquare);
  }

  // Internal move number to UCCI move string
  moveToString(move: Move): string {
    const sqSrc = unsafeSquare(SRC(move as number));
    const sqDst = unsafeSquare(DST(move as number));
    return `${this.squareToUcci(sqSrc)}${this.squareToUcci(sqDst)}`;
  }

  // Helper to convert internal square (0-255) to UCCI algebraic notation (e.g., 'a0', 'i9')
  private squareToUcci(sq: Square): string {
    const file = getSquareFile(sq) - 3; // Internal file 3-11 maps to 0-8 (a-i)
    const rank = 9 - (getSquareRank(sq) - 3); // Internal rank 3-12 maps to 9-0
    if (file < 0 || file > 8 || rank < 0 || rank > 9) {
      return "invalid"; // Should not happen with valid internal squares
    }
    return `${String.fromCharCode(ASC("a") + file)}${rank}`;
  }

  // Helper to convert UCCI algebraic notation (e.g., 'a0', 'i9') to internal square (0-255)
  private ucciToSquare(ucciCoord: string): Square {
    if (ucciCoord.length !== 2) {
      throw new Error(`Invalid UCCI coordinate format: ${ucciCoord}`);
    }
    const fileChar = ucciCoord.charCodeAt(0);
    const rankChar = ucciCoord.charCodeAt(1);

    const file = fileChar - ASC("a") + 3; // a-i maps to 3-11
    const rank = 9 - (rankChar - ASC("0")) + 3; // 9-0 maps to 3-12

    if (file < 3 || file > 11 || rank < 3 || rank > 12) {
      throw new Error(`UCCI coordinate out of board bounds: ${ucciCoord}`);
    }
    return createSquare(rank, file);
  }

  // Public API for making moves (UCCI string)
  makeMove(ucciMove: string): boolean {
    const internalMove = this.ucciMoveToInternal(ucciMove);
    if ((internalMove as number) === 0) {
      console.error(`Invalid UCCI move string: ${ucciMove}`);
      return false;
    }

    if (!this._position.legalMove(internalMove as number)) {
      console.error(`Illegal move: ${ucciMove}`);
      return false;
    }

    const success = this._position.makeMove(internalMove as number);
    if (success) {
      this._search = new Search(this._position, HASH_LEVEL);
    }
    return success;
  }

  // Public API for making moves (internal number) - for UI to use
  makeInternalMove(mv: Move): boolean {
    if (!this._position.legalMove(mv as number)) {
      return false;
    }
    const success = this._position.makeMove(mv as number);
    if (success) {
      this._search = new Search(this._position, HASH_LEVEL);
    }
    return success;
  }

  // Public API for undoing moves (internal number) - for UI to use
  undoInternalMove(): void {
    this._position.undoMakeMove();
    this._search = new Search(this._position, 18);
  }

  undoMove(): void {
    // This was used by UcciAdapter, keeping it for now
    this._position.undoMakeMove();
    this._search = new Search(this._position, 18);
  }

  findBestMove(depth: number = 6, timeLimitMillis: number = 2000): string {
    const bestMove = this._search.searchMain(depth, timeLimitMillis);
    if (bestMove === 0) {
      return "nomove";
    }
    return this.moveToString(unsafeMove(bestMove));
  }

  // --- Getters for internal state needed by UI ---
  get squares(): number[] {
    return this._position.squares;
  }

  get sdPlayer(): Side {
    return this._position.sdPlayer as Side;
  }

  legalMove(mv: Move): boolean {
    return this._position.legalMove(mv as number);
  }

  isMate(): boolean {
    return this._position.isMate();
  }

  inCheck(): boolean {
    return this._position.inCheck();
  }

  repStatus(recur: number): number {
    return this._position.repStatus(recur);
  }

  repValue(vlRep: number): number {
    return this._position.repValue(vlRep);
  }

  captured(): boolean {
    return this._position.captured();
  }

  getPieceListLength(): number {
    return this._position.pcList.length;
  }

  lastMove(): Move {
    return unsafeMove(this._position.mvList[this._position.mvList.length - 1]);
  }

  getHistoryLength(): number {
    return this._position.mvList.length;
  }

  getPiece(sq: Square): PieceType {
    return this._position.squares[sq as number] as PieceType;
  }

  getMoveList(): Move[] {
    return this._position.mvList.map((m) => unsafeMove(m));
  }

  getLegalMovesForPiece(sq: Square): Move[] {
    const moves = this._position.generateMoves(null);
    return moves
      .filter((mv) => SRC(mv) === (sq as number) && this._position.legalMove(mv))
      .map((m) => unsafeMove(m));
  }

  // Additional methods for UCCI protocol (already there)
  getId(): { name: string; author: string } {
    return {
      name: "XQlightweight Engine",
      author: "Morning Yellow, adapted by Gemini CLI",
    };
  }

  isReady(): boolean {
    return true;
  }

  getFen(): string {
    return this._position.toFen();
  }

  getStatus(): GameStatus {
    return {
      isMate: this._position.isMate(),
      inCheck: this._position.inCheck(),
    };
  }

  getRedScore(): number {
    return this._position.vlWhite - this._position.vlBlack;
  }

  getScores(): GameScores {
    return {
      red: this._position.vlWhite,
      black: this._position.vlBlack,
    };
  }
}
