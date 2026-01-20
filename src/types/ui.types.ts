// src/types/ui.types.ts
// 前端 UI 相关类型定义

/**
 * 移动模式
 * 0: 玩家先手
 * 1: 电脑先手
 * 2: 双人对战
 */
export type MoveMode = 0 | 1 | 2;

/**
 * 让子模式
 * 0: 无让子
 * 1: 让左马
 * 2: 让双马
 * 3: 让九子
 */
export type Handicap = 0 | 1 | 2 | 3;

/**
 * 难度等级
 * 0: 简单 (10ms)
 * 1: 普通 (100ms)
 * 2: 困难 (1000ms)
 */
export type Difficulty = 0 | 1 | 2;

/**
 * 游戏状态 (用于保存/加载)
 */
export interface GameState {
  fen: string;
  initialFen: string;
  moves: string[];
  handicap: Handicap;
  moveMode: MoveMode;
  difficulty: Difficulty;
  soundEnabled: boolean;
  animated: boolean;
  showScore: boolean;
}
