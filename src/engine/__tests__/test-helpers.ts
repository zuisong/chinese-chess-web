// 测试辅助函数

import { createSquare, type Square } from "../types";

/**
 * 从UCCI格式创建Square
 * @param ucci UCCI格式坐标，如 'c3', 'e0'
 * @example
 * ucciSquare('c3') // 红方兵位置
 * ucciSquare('c6') // 黑方卒位置
 * ucciSquare('e0') // 红帅位置
 */
export function ucciSquare(ucci: string): Square {
  if (ucci.length !== 2) {
    throw new Error(`Invalid UCCI coordinate: ${ucci}`);
  }

  const fileChar = ucci.charCodeAt(0);
  const rankChar = ucci.charCodeAt(1);

  const file = fileChar - "a".charCodeAt(0) + 3; // a-i maps to 3-11
  const rank = 9 - (rankChar - "0".charCodeAt(0)) + 3; // 9-0 maps to 3-12

  return createSquare(rank, file);
}

/**
 * 常用棋子位置常量 (UCCI格式)
 */
export const SQUARES = {
  // 红方兵
  RED_PAWN_A: ucciSquare("a3"),
  RED_PAWN_C: ucciSquare("c3"),
  RED_PAWN_E: ucciSquare("e3"),
  RED_PAWN_G: ucciSquare("g3"),
  RED_PAWN_I: ucciSquare("i3"),

  // 黑方卒
  BLACK_PAWN_A: ucciSquare("a6"),
  BLACK_PAWN_C: ucciSquare("c6"),
  BLACK_PAWN_E: ucciSquare("e6"),
  BLACK_PAWN_G: ucciSquare("g6"),
  BLACK_PAWN_I: ucciSquare("i6"),

  // 红方车
  RED_ROOK_A: ucciSquare("a0"),
  RED_ROOK_I: ucciSquare("i0"),

  // 黑方车
  BLACK_ROOK_A: ucciSquare("a9"),
  BLACK_ROOK_I: ucciSquare("i9"),

  // 红帅
  RED_KING: ucciSquare("e0"),

  // 黑将
  BLACK_KING: ucciSquare("e9"),

  // 常用移动目标
  C4: ucciSquare("c4"), // c3兵前进一格
  C5: ucciSquare("c5"), //c6卒前进一格
} as const;
