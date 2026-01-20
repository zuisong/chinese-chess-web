/**
 * 测试用 FEN 字符串集合
 * FEN (Forsyth–Edwards Notation) 用于描述棋盘状态
 */

export const INITIAL_POSITION =
  "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1";

export const HANDICAP_POSITIONS = {
  NO_HANDICAP: "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1",
  LEFT_KNIGHT: "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKABNR w - - 0 1",
  DOUBLE_KNIGHTS: "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w - - 0 1",
  NINE_PIECES: "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w - - 0 1",
};

/**
 * 中局测试局面
 */
export const MIDDLE_GAME_POSITIONS = {
  // 标准中局
  STANDARD: "2bakab2/4a4/4b4/2p1p1p2/4r4/9/3R5/2r1B4/4A4/2BAK1B2 w - - 0 1",

  // 红方优势
  RED_ADVANTAGE: "2bakab2/4a4/n2cb4/2p1p1p2/9/4C4/4R4/4B4/4A4/2BAK1B2 w - - 0 1",

  // 黑方优势
  BLACK_ADVANTAGE: "2bakab2/4a4/2ncb4/2p1p1p2/4r4/9/9/4B4/4A4/2BAK1B2 b - - 0 1",
};

/**
 * 残局测试局面
 */
export const ENDGAME_POSITIONS = {
  // 单车杀单士
  ROOK_VS_ADVISOR: "3k5/4a4/9/9/9/9/9/9/9/3RK4 w - - 0 1",

  // 双车错
  DOUBLE_ROOK: "4k4/9/9/9/9/9/9/9/4R4/3RK4 w - - 0 1",

  // 马炮残棋
  HORSE_CANNON: "3k5/9/9/4N4/9/9/9/9/4C4/3K5 w - - 0 1",
};

/**
 * 将死/和棋局面
 */
export const TERMINAL_POSITIONS = {
  // 绝杀局面 - 双车错杀
  CHECKMATE_DOUBLE_ROOK: "4k4/9/9/9/9/9/9/9/4R4/3RK4 w - - 0 1",

  // 白脸将 - 自杀
  SUICIDE_KING: "3k5/9/9/9/9/9/9/9/9/4K4 w - - 0 1",

  // 长将和棋
  PERPETUAL_CHECK: "2bak4/4a4/4b4/9/9/9/9/2r1B4/4A4/2BAK4 w - - 0 1",

  // 困毙（无子可走）
  STALEMATE: "4k4/4a4/4b4/9/9/9/9/9/4A4/4KA3 w - - 0 1",
};

/**
 * 特殊规则测试局面
 */
export const SPECIAL_RULE_POSITIONS = {
  // 白脸将（两王面对面）
  FACING_KINGS: "4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1",

  // 将军测试
  IN_CHECK: "4k4/9/9/9/9/9/9/4R4/9/4K4 b - - 0 1",

  // 炮打中心兵
  CANNON_ATTACK: "4k4/9/9/9/4p4/9/9/9/4C4/4K4 w - - 0 1",
};

/**
 * 测试移动数据
 */
export interface TestMove {
  fen: string;
  legalMoves: string[]; // UCCI format
  illegalMoves: string[];
}

export const TEST_MOVES: TestMove[] = [
  {
    fen: INITIAL_POSITION,
    legalMoves: [
      "b0c2",
      "b0a2", // 马
      "h0g2",
      "h0i2", // 马
      "b2e2",
      "b2d2",
      "b2c2",
      "b2a2", // 炮
      "h2e2",
      "h2f2",
      "h2g2",
      "h2i2", // 炮
      "a3a4",
      "c3c4",
      "e3e4",
      "g3g4",
      "i3i4", // 兵
    ],
    illegalMoves: [
      "e0e1", // 帅不能离开九宫
      "a0a1", // 车前面有子
      "c0c1", // 相不能过河
    ],
  },
];

/**
 * 性能测试局面
 */
export const PERFORMANCE_TEST_POSITIONS = {
  // 复杂中局（大量可能移动）
  COMPLEX: "2ba1ab2/3ka4/n3c1n2/p1p1p1p1p/2r3r2/P3P1P1P/1C5C1/N3B1N2/4A4/2BAK1B2 w - - 0 1",

  // 简单残局（较少可能移动）
  SIMPLE: "4k4/9/9/9/9/9/9/9/9/4K1R2 w - - 0 1",
};

/**
 * 边界情况测试
 */
export const EDGE_CASES = {
  // 空棋盘
  EMPTY: "9/9/9/9/9/9/9/9/9/9 w - - 0 1",

  // 只有双方帅
  KINGS_ONLY: "4k4/9/9/9/9/9/9/9/9/4K4 w - - 0 1",

  // 满棋盘（不可能的局面，但测试解析）
  FULL: "rrrrrrrrr/rrrrrrrrr/rrrrrrrrr/rrrrrrrrr/rrrrrrrrr/rrrrrrrrr/rrrrrrrrr/rrrrrrrrr/rrrrrrrrr/RRRRRRRRR w - - 0 1",
};
