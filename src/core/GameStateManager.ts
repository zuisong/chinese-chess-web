// src/core/GameStateManager.ts
// 游戏状态管理器 - 管理游戏核心状态和逻辑

import type { XiangQiEngine } from "../engine/index";
import { SIDE_TAG } from "../engine/position";
import type { Move, Square } from "../engine/types";
import { createMove, unsafeSquare } from "../engine/types";
import type { Handicap, MoveMode } from "../types/ui.types";

export class GameStateManager {
  private engine: XiangQiEngine;
  private _selectedSq: Square = 0 as Square;
  private _busy: boolean = false;

  // Settings
  private _moveMode: MoveMode = 0;
  private _handicap: Handicap = 0;
  private _difficulty: number = 100; // millis

  // Callbacks for UI updates
  private onStateChange?: () => void;
  private onScoreUpdate?: (scores: { red: number; black: number }) => void;
  private onMovesUpdate?: (moves: string[]) => void;

  constructor(engine: XiangQiEngine) {
    this.engine = engine;
  }

  // ============ Getters ============

  get selectedSquare(): Square {
    return this._selectedSq;
  }

  get isBusy(): boolean {
    return this._busy;
  }

  get moveMode(): MoveMode {
    return this._moveMode;
  }

  get handicap(): Handicap {
    return this._handicap;
  }

  get difficulty(): number {
    return this._difficulty;
  }

  // ============ Setters ============

  setBusy(busy: boolean): void {
    this._busy = busy;
    this.notifyStateChange();
  }

  setMoveMode(mode: MoveMode): void {
    this._moveMode = mode;
    this.notifyStateChange();
  }

  setHandicap(handicap: Handicap): void {
    this._handicap = handicap;
    this.notifyStateChange();
  }

  setDifficulty(level: number): void {
    // level: 0=Easy(500ms), 1=Normal(1500ms), 2=Hard(3000ms)
    const difficultyMap = [500, 1500, 3000];
    this._difficulty = difficultyMap[level] ?? 1500;
    this.notifyStateChange();
  }

  setDifficultyMillis(ms: number): void {
    this._difficulty = ms;
    this.notifyStateChange();
  }

  // ============ Callbacks ============

  onStateChangeCallback(callback: () => void): void {
    this.onStateChange = callback;
  }

  onScoreUpdateCallback(callback: (scores: { red: number; black: number }) => void): void {
    this.onScoreUpdate = callback;
  }

  onMovesUpdateCallback(callback: (moves: string[]) => void): void {
    this.onMovesUpdate = callback;
  }

  // ============ Game Logic ============

  /**
   * 选择棋子
   */
  selectPiece(sq: Square): boolean {
    const pc = this.engine.getPiece(sq);
    const selfSide = SIDE_TAG(this.engine.sdPlayer);

    if ((pc & selfSide) !== 0) {
      // 选中己方棋子
      this._selectedSq = sq;
      this.notifyStateChange();
      return true;
    }
    return false;
  }

  /**
   * 清除选择
   */
  clearSelection(): void {
    this._selectedSq = 0 as Square;
    this.notifyStateChange();
  }

  /**
   * 尝试移动棋子
   */
  tryMove(dst: Square): Move | null {
    if ((this._selectedSq as number) === 0) {
      return null;
    }

    const mv = createMove(this._selectedSq, dst);

    if (!this.engine.legalMove(mv)) {
      this.clearSelection();
      return null;
    }

    return mv;
  }

  /**
   * 执行移动
   */
  makeMove(mv: Move): boolean {
    const success = this.engine.makeInternalMove(mv);
    if (success) {
      this.clearSelection();
      this.notifyUpdates();
    }
    return success;
  }

  /**
   * 悔棋
   */
  undo(): void {
    if (this.engine.getHistoryLength() > 1) {
      // Always undo at least one move
      this.engine.undoInternalMove();

      // If HvAI (moveMode != 2), try to undo a second move
      if (this._moveMode !== 2 && this.engine.getHistoryLength() > 1) {
        this.engine.undoInternalMove();
      }

      this.notifyUpdates();
    }
  }

  /**
   * 获取合法移动
   */
  getLegalMoves(sq: Square): Move[] {
    return this.engine.getLegalMovesForPiece(sq);
  }

  /**
   * 检查是否轮到电脑
   */
  isComputerTurn(): boolean {
    let computerSide = 1; // Default Black
    if (this._moveMode === 1) computerSide = 0; // Computer is Red
    if (this._moveMode === 2) return false; // No Computer

    return this.engine.sdPlayer === computerSide;
  }

  /**
   * 查找最佳移动
   */
  findBestMove(): string {
    return this.engine.findBestMove(64, this._difficulty);
  }

  /**
   * 检查游戏状态
   */
  checkGameState(): {
    isMate: boolean;
    inCheck: boolean;
    repStatus: number;
    captured: boolean;
  } {
    return {
      isMate: this.engine.isMate(),
      inCheck: this.engine.inCheck(),
      repStatus: this.engine.repStatus(3),
      captured: this.engine.captured(),
    };
  }

  /**
   * 获取重复状态的值
   */
  getRepValue(vlRep: number): number {
    return this.engine.repValue(vlRep);
  }

  /**
   * 从 UCCI 字符串转换为内部移动
   */
  ucciToMove(ucci: string): Move {
    return this.engine.ucciMoveToInternal(ucci);
  }

  /**
   * 加载 FEN
   */
  loadFen(fen: string): boolean {
    return this.engine.loadFen(fen);
  }

  /**
   * 获取当前 FEN
   */
  getFen(): string {
    return this.engine.getFen();
  }

  /**
   * 获取移动列表
   */
  getMoveList(): Move[] {
    return this.engine.getMoveList();
  }

  /**
   * 获取移动列表的字符串表示
   */
  getMoveListStrings(): string[] {
    return this.engine.getMoveList().map((m) => {
      const ucci = this.engine.moveToString(m);
      return `${ucci.slice(0, 2).toUpperCase()}-${ucci.slice(2, 4).toUpperCase()}`;
    });
  }

  /**
   * 获取分数
   */
  getScores(): { red: number; black: number } {
    return this.engine.getScores();
  }

  // ============ Private Methods ============

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  private notifyUpdates(): void {
    this.notifyStateChange();

    if (this.onScoreUpdate) {
      this.onScoreUpdate(this.getScores());
    }

    if (this.onMovesUpdate) {
      this.onMovesUpdate(this.getMoveListStrings());
    }
  }
}
