/*
position.js - Source Code for XiangQi Wizard Light, Part I

XiangQi Wizard Light - a Chinese Chess Program for JavaScript
Designed by Morning Yellow, Version: 1.0, Last Modified: Sep. 2012
Copyright (C) 2004-2012 www.xqbase.com

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import { BOOK_DAT } from "./book.ts";
import type { PieceType } from "./types";

export function binarySearch(vlss: number[][], vl: number) {
  let low = 0;
  let high = vlss.length - 1;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (vlss[mid][0] < vl) {
      low = mid + 1;
    } else if (vlss[mid][0] > vl) {
      high = mid - 1;
    } else {
      return mid;
    }
  }
  return -1;
}

export const MATE_VALUE = 10000;
export const BAN_VALUE = MATE_VALUE - 100;
export const WIN_VALUE = MATE_VALUE - 200;
export const NULL_SAFE_MARGIN = 400;
export const NULL_OKAY_MARGIN = 200;
export const DRAW_VALUE = 20;
export const ADVANCED_VALUE = 3;

export const PIECE_KING = 0; // 帅/将

export const PIECE_ADVISOR = 1; // 仕/士

export const PIECE_BISHOP = 2; // 象

export const PIECE_KNIGHT = 3; // 马

export const PIECE_ROOK = 4; // 车

export const PIECE_CANNON = 5; // 炮

export const PIECE_PAWN = 6; // 兵/卒

export const RANK_TOP = 3; // 棋盘上方边界
export const RANK_BOTTOM = 12; // 棋盘下方边界
export const FILE_LEFT = 3; // 棋盘左侧边界
export const FILE_RIGHT = 11; // 棋盘右侧边界

export const ADD_PIECE = false;
export const DEL_PIECE = true;

const IN_BOARD_: number[] = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0,
  0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1,
  1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1,
  1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const IN_FORT_ = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const LEGAL_SPAN = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 2, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const KNIGHT_PIN_ = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -16, 0, -16, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 16, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
];

const KING_DELTA: number[] = [-16, -1, 1, 16]; // 帅/将的走法增量
const ADVISOR_DELTA: number[] = [-17, -15, 15, 17]; // 仕/士的走法增量
const KNIGHT_DELTA: number[][] = [
  [-33, -31],
  [-18, 14],
  [-14, 18],
  [31, 33],
]; // 马的走法增量
const KNIGHT_CHECK_DELTA: number[][] = [
  [-33, -18],
  [-31, -14],
  [14, 31],
  [18, 33],
]; // 马将军的增量
const MVV_VALUE: number[] = [50, 10, 10, 30, 40, 30, 20, 0]; // 棋子价值,用于排序走法

const PIECE_VALUE: number[][] = [
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 11, 13, 11, 9, 9, 9, 0, 0, 0,
    0, 0, 0, 0, 19, 24, 34, 42, 44, 42, 34, 24, 19, 0, 0, 0, 0, 0, 0, 0, 19, 24, 32, 37, 37, 37, 32,
    24, 19, 0, 0, 0, 0, 0, 0, 0, 19, 23, 27, 29, 30, 29, 27, 23, 19, 0, 0, 0, 0, 0, 0, 0, 14, 18,
    20, 27, 29, 27, 20, 18, 14, 0, 0, 0, 0, 0, 0, 0, 7, 0, 13, 0, 16, 0, 13, 0, 7, 0, 0, 0, 0, 0, 0,
    0, 7, 0, 7, 0, 15, 0, 7, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 15, 11, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 20, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 18, 0, 0, 20, 23, 20, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 20, 20, 0, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 20, 0, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 18, 0, 0, 20, 23, 20, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 20, 20, 0, 20, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 90, 90, 90, 96, 90, 96, 90, 90, 90, 0,
    0, 0, 0, 0, 0, 0, 90, 96, 103, 97, 94, 97, 103, 96, 90, 0, 0, 0, 0, 0, 0, 0, 92, 98, 99, 103,
    99, 103, 99, 98, 92, 0, 0, 0, 0, 0, 0, 0, 93, 108, 100, 107, 100, 107, 100, 108, 93, 0, 0, 0, 0,
    0, 0, 0, 90, 100, 99, 103, 104, 103, 99, 100, 90, 0, 0, 0, 0, 0, 0, 0, 90, 98, 101, 102, 103,
    102, 101, 98, 90, 0, 0, 0, 0, 0, 0, 0, 92, 94, 98, 95, 98, 95, 98, 94, 92, 0, 0, 0, 0, 0, 0, 0,
    93, 92, 94, 95, 92, 95, 94, 92, 93, 0, 0, 0, 0, 0, 0, 0, 85, 90, 92, 93, 78, 93, 92, 90, 85, 0,
    0, 0, 0, 0, 0, 0, 88, 85, 90, 88, 90, 88, 90, 85, 88, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 206, 208, 207, 213, 214, 213, 207, 208,
    206, 0, 0, 0, 0, 0, 0, 0, 206, 212, 209, 216, 233, 216, 209, 212, 206, 0, 0, 0, 0, 0, 0, 0, 206,
    208, 207, 214, 216, 214, 207, 208, 206, 0, 0, 0, 0, 0, 0, 0, 206, 213, 213, 216, 216, 216, 213,
    213, 206, 0, 0, 0, 0, 0, 0, 0, 208, 211, 211, 214, 215, 214, 211, 211, 208, 0, 0, 0, 0, 0, 0, 0,
    208, 212, 212, 214, 215, 214, 212, 212, 208, 0, 0, 0, 0, 0, 0, 0, 204, 209, 204, 212, 214, 212,
    204, 209, 204, 0, 0, 0, 0, 0, 0, 0, 198, 208, 204, 212, 212, 212, 204, 208, 198, 0, 0, 0, 0, 0,
    0, 0, 200, 208, 206, 212, 200, 212, 206, 208, 200, 0, 0, 0, 0, 0, 0, 0, 194, 206, 204, 212, 200,
    212, 204, 206, 194, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 100, 100, 96, 91, 90, 91, 96, 100, 100,
    0, 0, 0, 0, 0, 0, 0, 98, 98, 96, 92, 89, 92, 96, 98, 98, 0, 0, 0, 0, 0, 0, 0, 97, 97, 96, 91,
    92, 91, 96, 97, 97, 0, 0, 0, 0, 0, 0, 0, 96, 99, 99, 98, 100, 98, 99, 99, 96, 0, 0, 0, 0, 0, 0,
    0, 96, 96, 96, 96, 100, 96, 96, 96, 96, 0, 0, 0, 0, 0, 0, 0, 95, 96, 99, 96, 100, 96, 99, 96,
    95, 0, 0, 0, 0, 0, 0, 0, 96, 96, 96, 96, 96, 96, 96, 96, 96, 0, 0, 0, 0, 0, 0, 0, 97, 96, 100,
    99, 101, 99, 100, 96, 97, 0, 0, 0, 0, 0, 0, 0, 96, 97, 98, 98, 98, 98, 98, 97, 96, 0, 0, 0, 0,
    0, 0, 0, 96, 96, 97, 99, 99, 99, 97, 96, 96, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0,
  ],
  [
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 9, 9, 9, 11, 13, 11, 9, 9, 9, 0, 0, 0,
    0, 0, 0, 0, 19, 24, 34, 42, 44, 42, 34, 24, 19, 0, 0, 0, 0, 0, 0, 0, 19, 24, 32, 37, 37, 37, 32,
    24, 19, 0, 0, 0, 0, 0, 0, 0, 19, 23, 27, 29, 30, 29, 27, 23, 19, 0, 0, 0, 0, 0, 0, 0, 14, 18,
    20, 27, 29, 27, 20, 18, 14, 0, 0, 0, 0, 0, 0, 0, 7, 0, 13, 0, 16, 0, 13, 0, 7, 0, 0, 0, 0, 0, 0,
    0, 7, 0, 7, 0, 15, 0, 7, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 15, 11, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
];

export function IN_BOARD(sq: number) {
  return IN_BOARD_[sq] !== 0;
}

export function IN_FORT(sq: number) {
  return IN_FORT_[sq] !== 0;
}

export function RANK_Y(sq: number) {
  return sq >> 4;
}

export function FILE_X(sq: number) {
  return sq & 15;
}

export function COORD_XY(x: number, y: number) {
  return x + (y << 4);
}

export function SQUARE_FLIP(sq: number) {
  return 254 - sq;
}

export function FILE_FLIP(x: number) {
  return 14 - x;
}

export function RANK_FLIP(y: number) {
  return 15 - y;
}

export function MIRROR_SQUARE(sq: number) {
  return COORD_XY(FILE_FLIP(FILE_X(sq)), RANK_Y(sq));
}

export function SQUARE_FORWARD(sq: number, sd: number) {
  return sq - 16 + (sd << 5);
}

export function KING_SPAN(sqSrc: number, sqDst: number) {
  return LEGAL_SPAN[sqDst - sqSrc + 256] === 1;
}

export function ADVISOR_SPAN(sqSrc: number, sqDst: number) {
  return LEGAL_SPAN[sqDst - sqSrc + 256] === 2;
}

export function BISHOP_SPAN(sqSrc: number, sqDst: number) {
  return LEGAL_SPAN[sqDst - sqSrc + 256] === 3;
}

export function BISHOP_PIN(sqSrc: number, sqDst: number) {
  return (sqSrc + sqDst) >> 1;
}

export function KNIGHT_PIN(sqSrc: number, sqDst: number) {
  return sqSrc + KNIGHT_PIN_[sqDst - sqSrc + 256];
}

export function HOME_HALF(sq: number, sd: number) {
  return (sq & 0x80) !== sd << 7;
}

export function AWAY_HALF(sq: number, sd: number) {
  return (sq & 0x80) === sd << 7;
}

export function SAME_HALF(sqSrc: number, sqDst: number) {
  return ((sqSrc ^ sqDst) & 0x80) === 0;
}

export function SAME_RANK(sqSrc: number, sqDst: number) {
  return ((sqSrc ^ sqDst) & 0xf0) === 0;
}

export function SAME_FILE(sqSrc: number, sqDst: number) {
  return ((sqSrc ^ sqDst) & 0x0f) === 0;
}

export function SIDE_TAG(sd: number) {
  return 8 + (sd << 3);
}

export function OPP_SIDE_TAG(sd: number) {
  return 16 - (sd << 3);
}

export function SRC(mv: number) {
  return mv & 255;
}

export function DST(mv: number) {
  return mv >> 8;
}

export function MOVE(sqSrc: number, sqDst: number) {
  return sqSrc + (sqDst << 8);
}

export function MIRROR_MOVE(mv: number) {
  return MOVE(MIRROR_SQUARE(SRC(mv)), MIRROR_SQUARE(DST(mv)));
}

export function MVV_LVA(pc: number, lva: number) {
  return MVV_VALUE[pc & 7] - lva;
}

export function CHR(n: number) {
  return String.fromCharCode(n);
}

export function ASC(c: string) {
  return c.charCodeAt(0);
}

const FEN_PIECE = "        KABNRCP kabnrcp ";

export function CHAR_TO_PIECE(c: string) {
  switch (c) {
    case "K":
      return PIECE_KING;
    case "A":
      return PIECE_ADVISOR;
    case "B":
    case "E":
      return PIECE_BISHOP;
    case "H":
    case "N":
      return PIECE_KNIGHT;
    case "R":
      return PIECE_ROOK;
    case "C":
      return PIECE_CANNON;
    case "P":
      return PIECE_PAWN;
    default:
      return -1;
  }
}

class RC4 {
  x: number;
  y: number;
  state: number[];
  constructor(key: number[]) {
    this.x = this.y = 0;
    this.state = Array.from(Array(256).keys());
    let j = 0;
    for (let i = 0; i < 256; i++) {
      j = (j + this.state[i] + key[i % key.length]) & 0xff;
      this.swap(i, j);
    }
  }

  private swap(i: number, j: number) {
    const t = this.state[i];
    this.state[i] = this.state[j];
    this.state[j] = t;
  }

  nextByte() {
    this.x = (this.x + 1) & 0xff;
    this.y = (this.y + this.state[this.x]) & 0xff;
    this.swap(this.x, this.y);
    const t = (this.state[this.x] + this.state[this.y]) & 0xff;
    return this.state[t];
  }
  nextLong() {
    const n0 = this.nextByte();
    const n1 = this.nextByte();
    const n2 = this.nextByte();
    const n3 = this.nextByte();
    return n0 + (n1 << 8) + (n2 << 16) + ((n3 << 24) & 0xffffffff);
  }
}

const PreGen_zobristKeyTable: number[][] = [];
const PreGen_zobristLockTable: number[][] = [];

const rc4 = new RC4([0]);
const PreGen_zobristKeyPlayer = rc4.nextLong();
rc4.nextLong();
const PreGen_zobristLockPlayer = rc4.nextLong();
for (let i = 0; i < 14; i++) {
  const keys: number[] = [];
  const locks = [];
  for (let j = 0; j < 256; j++) {
    keys.push(rc4.nextLong());
    rc4.nextLong();
    locks.push(rc4.nextLong());
  }
  PreGen_zobristKeyTable.push(keys);
  PreGen_zobristLockTable.push(locks);
}
rc4.nextLong();

export class Position {
  sdPlayer = 0; // 当前走棋方 (0: 红方, 1: 黑方)
  squares: PieceType[] = []; // 棋盘数组，存储每个格子的棋子 (0: 空, >0: 棋子)
  zobristKey = 0; // Zobrist 键值，用于局面哈希 (校验和)
  zobristLock = 0; // Zobrist 锁值，用于解决哈希冲突 (校验和)
  vlWhite = 0; // 红方总价值 (子力评分)
  vlBlack = 0; // 黑方总价值 (子力评分)

  mvList = [0]; // 历史走法列表，用于悔棋和检测长打
  pcList: PieceType[] = [0]; // 历史被吃棋子列表，用于悔棋
  keyList = [0]; // 历史 Zobrist 键值列表，用于检测重复局面
  chkList: boolean[] = [false]; // 历史将军状态列表
  distance = 0; // 距离根节点的步数 (搜索深度)

  // export function Position() {
  // sdPlayer, zobristKey, zobristLock, vlWhite, vlBlack, distance;
  // squares, mvList, pcList, keyList, chkList;
  // }

  // 棋子列表: [side][index] -> square
  // side: 0=红方, 1=黑方
  // index: 0=帅/将, 1-2=仕/士, 3-4=相/象, 5-6=马, 7-8=车, 9-10=炮, 11-15=兵/卒
  // value: 0=死棋, >0=棋子位置坐标
  pieceList: number[][] = [[], []];

  // 清空棋盘
  clearBoard() {
    this.sdPlayer = 0;
    this.squares = Array(256).fill(0);
    this.zobristKey = this.zobristLock = 0;
    this.vlWhite = this.vlBlack = 0;
    // 初始化棋子列表
    this.pieceList = [
      new Array(16).fill(0), // 红方
      new Array(16).fill(0), // 黑方
    ];
  }

  // 初始化不可逆状态 (用于从 FEN 加载后重置历史)
  setIrrev() {
    this.mvList = [0];
    this.pcList = [0];
    this.keyList = [0];
    this.chkList = [this.checked()];
    this.distance = 0;
  }

  // 在棋盘上添加或移除棋子
  // sq: 棋盘坐标
  // pc: 棋子类型
  // bDel: true=移除, false=添加
  addPiece(sq: number, pc: PieceType, bDel = false) {
    let pcAdjust: number;
    this.squares[sq] = bDel ? 0 : pc;

    // Update Piece List
    if (pc > 0) {
      const side = (pc & 16) === 0 ? 0 : 1;
      const type = pc - 8 - (side << 3); // 计算棋子类型索引 0..6
      // We need to find a slot for this piece.
      // Since we don't have a direct mapping from piece instance to index,
      // we use a simple strategy: fill the first available slot for that type.
      // BUT, this is slow for `addPiece` if we have to search.
      // However, `addPiece` is only called during setup and capture/uncapture.
      // During setup (fromFen), we can just fill sequentially.
      // During capture (bDel=true), we need to find the square `sq` in the list and clear it.
      // During uncapture (bDel=false), we need to find an empty slot and fill it.

      // Simplified Piece List for Move Gen:
      // We just need to know where the pieces are.
      // Let's use specific ranges for types to make it faster.
      // King: 0
      // Advisor: 1-2
      // Bishop: 3-4
      // Knight: 5-6
      // Rook: 7-8
      // Cannon: 9-10
      // Pawn: 11-15

      let startIndex = 0;
      let endIndex = 0;
      switch (type) {
        case PIECE_KING:
          startIndex = 0;
          endIndex = 0;
          break;
        case PIECE_ADVISOR:
          startIndex = 1;
          endIndex = 2;
          break;
        case PIECE_BISHOP:
          startIndex = 3;
          endIndex = 4;
          break;
        case PIECE_KNIGHT:
          startIndex = 5;
          endIndex = 6;
          break;
        case PIECE_ROOK:
          startIndex = 7;
          endIndex = 8;
          break;
        case PIECE_CANNON:
          startIndex = 9;
          endIndex = 10;
          break;
        case PIECE_PAWN:
          startIndex = 11;
          endIndex = 15;
          break;
      }

      if (bDel) {
        // Remove piece at sq
        let _found = false;
        for (let i = startIndex; i <= endIndex; i++) {
          if (this.pieceList[side][i] === sq) {
            this.pieceList[side][i] = 0;
            _found = true;
            break;
          }
        }
        // if (!found) console.warn(`Failed to remove piece ${pc} at ${sq} from side ${side}`);
      } else {
        // Add piece at sq
        let _found = false;
        for (let i = startIndex; i <= endIndex; i++) {
          if (this.pieceList[side][i] === 0) {
            this.pieceList[side][i] = sq;
            _found = true;
            break;
          }
        }
        // if (!found) console.warn(`Failed to add piece ${pc} at ${sq} to side ${side}`);
      }
    }

    if (pc < 16) {
      pcAdjust = pc - 8;
      // Safety check for pcAdjust range
      if (pcAdjust >= 0 && pcAdjust < PIECE_VALUE.length) {
        this.vlWhite += bDel ? -PIECE_VALUE[pcAdjust][sq] : PIECE_VALUE[pcAdjust][sq];
      }
    } else {
      pcAdjust = pc - 16;
      // Safety check for pcAdjust range
      if (pcAdjust >= 0 && pcAdjust < PIECE_VALUE.length) {
        this.vlBlack += bDel
          ? -PIECE_VALUE[pcAdjust][SQUARE_FLIP(sq)]
          : PIECE_VALUE[pcAdjust][SQUARE_FLIP(sq)];
      }
      pcAdjust += 7;
    }
    if (pcAdjust >= 0 && pcAdjust < PreGen_zobristKeyTable.length) {
      this.zobristKey ^= PreGen_zobristKeyTable[pcAdjust][sq];
      this.zobristLock ^= PreGen_zobristLockTable[pcAdjust][sq];
    }
  }

  // 移动棋子 (内部方法，不检查合法性)
  movePiece(mv: number) {
    const sqSrc = SRC(mv);
    const sqDst = DST(mv);
    let pc = this.squares[sqDst];
    this.pcList.push(pc);
    if (pc > 0) {
      this.addPiece(sqDst, pc, DEL_PIECE);
    }
    pc = this.squares[sqSrc];
    // Optimization: Direct update for move?
    // For now, rely on addPiece to be correct.
    this.addPiece(sqSrc, pc, DEL_PIECE);
    this.addPiece(sqDst, pc, ADD_PIECE);
    this.mvList.push(mv);
  }

  // 撤销移动棋子
  undoMovePiece() {
    const mv = this.mvList.pop()!;
    const sqSrc = SRC(mv);
    const sqDst = DST(mv);
    let pc = this.squares[sqDst];
    this.addPiece(sqDst, pc, DEL_PIECE);
    this.addPiece(sqSrc, pc, ADD_PIECE);
    pc = this.pcList.pop()!;
    if (pc > 0) {
      this.addPiece(sqDst, pc, ADD_PIECE);
    }
  }

  // 交换走棋方
  changeSide() {
    this.sdPlayer = 1 - this.sdPlayer;
    this.zobristKey ^= PreGen_zobristKeyPlayer;
    this.zobristLock ^= PreGen_zobristLockPlayer;
  }

  // 执行走法
  // mv: 走法
  // 返回值: 是否合法 (是否导致被将军)
  makeMove(mv: number) {
    const zobristKey = this.zobristKey;
    this.movePiece(mv);
    if (this.checked()) {
      this.undoMovePiece();
      return false;
    }
    this.keyList.push(zobristKey);
    this.changeSide();
    this.chkList.push(this.checked());
    this.distance++;
    return true;
  }

  // 撤销走法
  undoMakeMove() {
    this.distance--;
    this.chkList.pop();
    this.changeSide();
    this.keyList.pop();
    this.undoMovePiece();
  }

  // 执行空着 (Null Move)
  nullMove() {
    const zobristKey = this.zobristKey;
    this.changeSide();
    this.pcList.push(0);
    this.mvList.push(0);
    this.keyList.push(zobristKey);
    this.chkList.push(false);
    this.distance++;
  }

  // 撤销空着
  undoNullMove() {
    this.distance--;
    this.chkList.pop();
    this.keyList.pop();
    this.mvList.pop();
    this.pcList.pop();
    this.changeSide();
  }

  // 从 FEN 串加载局面
  fromFen(fen: string) {
    this.clearBoard();
    let y = RANK_TOP;
    let x = FILE_LEFT;
    let index = 0;
    if (index === fen.length) {
      this.setIrrev();
      return;
    }
    let c = fen.charAt(index);
    while (c !== " ") {
      if (c === "/") {
        x = FILE_LEFT;
        y++;
        if (y > RANK_BOTTOM) {
          break;
        }
      } else if (c >= "1" && c <= "9") {
        x += ASC(c) - ASC("0");
      } else if (c >= "A" && c <= "Z") {
        if (x <= FILE_RIGHT) {
          const pt = CHAR_TO_PIECE(c);
          if (pt >= 0) {
            this.addPiece(COORD_XY(x, y), (pt + 8) as PieceType);
          }
          x++;
        }
      } else if (c >= "a" && c <= "z") {
        if (x <= FILE_RIGHT) {
          const pt = CHAR_TO_PIECE(CHR(ASC(c) + ASC("A") - ASC("a")));
          if (pt >= 0) {
            this.addPiece(COORD_XY(x, y), (pt + 16) as PieceType);
          }
          x++;
        }
      }
      index++;
      if (index === fen.length) {
        this.setIrrev();
        return;
      }
      c = fen.charAt(index);
    }
    index++;
    if (index === fen.length) {
      this.setIrrev();
      return;
    }
    if (this.sdPlayer === (fen.charAt(index) === "b" ? 0 : 1)) {
      this.changeSide();
    }
    this.setIrrev();
  }

  // 生成 FEN 串
  toFen() {
    let fen = "";
    for (let y = RANK_TOP; y <= RANK_BOTTOM; y++) {
      let k = 0;
      for (let x = FILE_LEFT; x <= FILE_RIGHT; x++) {
        const pc = this.squares[COORD_XY(x, y)];
        if (pc > 0) {
          if (k > 0) {
            fen += CHR(ASC("0") + k);
            k = 0;
          }
          fen += FEN_PIECE.charAt(pc);
        } else {
          k++;
        }
      }
      if (k > 0) {
        fen += CHR(ASC("0") + k);
      }
      fen += "/";
    }
    return fen.substring(0, fen.length - 1) + (this.sdPlayer === 0 ? " w" : " b");
  }

  // 生成所有伪合法走法 (Pseudo-Legal Moves)
  // vls: 如果不为 null，则只生成吃子走法，并存储价值到 vls
  generateMoves(vls: number[] | null) {
    const mvs = [];
    const pcSelfSide = SIDE_TAG(this.sdPlayer);
    const pcOppSide = OPP_SIDE_TAG(this.sdPlayer);

    const pieces = this.pieceList[this.sdPlayer];

    for (let i = 0; i < 16; i++) {
      const sqSrc = pieces[i];
      if (sqSrc === 0) continue;

      const pcSrc = this.squares[sqSrc];
      // Safety check, though pieceList should be synced
      if (pcSrc === 0) continue;

      switch (pcSrc - pcSelfSide) {
        case PIECE_KING:
          for (let i = 0; i < 4; i++) {
            const sqDst = sqSrc + KING_DELTA[i];
            if (!IN_FORT(sqDst)) {
              continue;
            }
            const pcDst = this.squares[sqDst];
            if (vls == null) {
              if ((pcDst & pcSelfSide) === 0) {
                mvs.push(MOVE(sqSrc, sqDst));
              }
            } else if ((pcDst & pcOppSide) !== 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_LVA(pcDst, 5));
            }
          }
          break;
        case PIECE_ADVISOR:
          for (let i = 0; i < 4; i++) {
            const sqDst = sqSrc + ADVISOR_DELTA[i];
            if (!IN_FORT(sqDst)) {
              continue;
            }
            const pcDst = this.squares[sqDst];
            if (vls == null) {
              if ((pcDst & pcSelfSide) === 0) {
                mvs.push(MOVE(sqSrc, sqDst));
              }
            } else if ((pcDst & pcOppSide) !== 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_LVA(pcDst, 1));
            }
          }
          break;
        case PIECE_BISHOP:
          for (let i = 0; i < 4; i++) {
            let sqDst = sqSrc + ADVISOR_DELTA[i];
            if (
              !(IN_BOARD(sqDst) && HOME_HALF(sqDst, this.sdPlayer) && this.squares[sqDst] === 0)
            ) {
              continue;
            }
            sqDst += ADVISOR_DELTA[i];
            const pcDst = this.squares[sqDst];
            if (vls == null) {
              if ((pcDst & pcSelfSide) === 0) {
                mvs.push(MOVE(sqSrc, sqDst));
              }
            } else if ((pcDst & pcOppSide) !== 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_LVA(pcDst, 1));
            }
          }
          break;
        case PIECE_KNIGHT:
          for (let i = 0; i < 4; i++) {
            let sqDst = sqSrc + KING_DELTA[i];
            if (this.squares[sqDst] > 0) {
              continue;
            }
            for (let j = 0; j < 2; j++) {
              sqDst = sqSrc + KNIGHT_DELTA[i][j];
              if (!IN_BOARD(sqDst)) {
                continue;
              }
              const pcDst = this.squares[sqDst];
              if (vls == null) {
                if ((pcDst & pcSelfSide) === 0) {
                  mvs.push(MOVE(sqSrc, sqDst));
                }
              } else if ((pcDst & pcOppSide) !== 0) {
                mvs.push(MOVE(sqSrc, sqDst));
                vls.push(MVV_LVA(pcDst, 1));
              }
            }
          }
          break;
        case PIECE_ROOK:
          for (let i = 0; i < 4; i++) {
            const delta = KING_DELTA[i];
            let sqDst = sqSrc + delta;
            while (IN_BOARD(sqDst)) {
              const pcDst = this.squares[sqDst];
              if (pcDst === 0) {
                if (vls == null) {
                  mvs.push(MOVE(sqSrc, sqDst));
                }
              } else {
                if ((pcDst & pcOppSide) !== 0) {
                  mvs.push(MOVE(sqSrc, sqDst));
                  if (vls != null) {
                    vls.push(MVV_LVA(pcDst, 4));
                  }
                }
                break;
              }
              sqDst += delta;
            }
          }
          break;
        case PIECE_CANNON:
          for (let i = 0; i < 4; i++) {
            const delta = KING_DELTA[i];
            let sqDst = sqSrc + delta;
            while (IN_BOARD(sqDst)) {
              const pcDst = this.squares[sqDst];
              if (pcDst === 0) {
                if (vls == null) {
                  mvs.push(MOVE(sqSrc, sqDst));
                }
              } else {
                break;
              }
              sqDst += delta;
            }
            sqDst += delta;
            while (IN_BOARD(sqDst)) {
              const pcDst = this.squares[sqDst];
              if (pcDst > 0) {
                if ((pcDst & pcOppSide) !== 0) {
                  mvs.push(MOVE(sqSrc, sqDst));
                  if (vls != null) {
                    vls.push(MVV_LVA(pcDst, 4));
                  }
                }
                break;
              }
              sqDst += delta;
            }
          }
          break;
        case PIECE_PAWN: {
          var sqDst = sqSrc + (this.sdPlayer === 0 ? -16 : 16);
          if (IN_BOARD(sqDst)) {
            var pcDst = this.squares[sqDst];
            if (vls == null) {
              if ((pcDst & pcSelfSide) === 0) {
                mvs.push(MOVE(sqSrc, sqDst));
              }
            } else if ((pcDst & pcOppSide) !== 0) {
              mvs.push(MOVE(sqSrc, sqDst));
              vls.push(MVV_LVA(pcDst, 2));
            }
          }
          if (AWAY_HALF(sqSrc, this.sdPlayer)) {
            for (let delta = -1; delta <= 1; delta += 2) {
              sqDst = sqSrc + delta;
              if (IN_BOARD(sqDst)) {
                var pcDst = this.squares[sqDst];
                if (vls == null) {
                  if ((pcDst & pcSelfSide) === 0) {
                    mvs.push(MOVE(sqSrc, sqDst));
                  }
                } else if ((pcDst & pcOppSide) !== 0) {
                  mvs.push(MOVE(sqSrc, sqDst));
                  vls.push(MVV_LVA(pcDst, 2));
                }
              }
            }
          }
          break;
        }
      }
    }
    return mvs;
  }

  // 判断走法是否合法 (仅检查基本规则，不检查是否被将军)
  legalMove(mv: number) {
    const sqSrc = SRC(mv);
    const pcSrc = this.squares[sqSrc];
    const pcSelfSide = SIDE_TAG(this.sdPlayer);
    if ((pcSrc & pcSelfSide) === 0) {
      return false;
    }

    const sqDst = DST(mv);
    const pcDst = this.squares[sqDst];
    if ((pcDst & pcSelfSide) !== 0) {
      return false;
    }

    switch (pcSrc - pcSelfSide) {
      case PIECE_KING:
        return IN_FORT(sqDst) && KING_SPAN(sqSrc, sqDst);
      case PIECE_ADVISOR:
        return IN_FORT(sqDst) && ADVISOR_SPAN(sqSrc, sqDst);
      case PIECE_BISHOP:
        return (
          SAME_HALF(sqSrc, sqDst) &&
          BISHOP_SPAN(sqSrc, sqDst) &&
          this.squares[BISHOP_PIN(sqSrc, sqDst)] === 0
        );
      case PIECE_KNIGHT: {
        const sqPin = KNIGHT_PIN(sqSrc, sqDst);
        return sqPin !== sqSrc && this.squares[sqPin] === 0;
      }
      case PIECE_ROOK:
      case PIECE_CANNON: {
        let delta: number;
        if (SAME_RANK(sqSrc, sqDst)) {
          delta = sqDst < sqSrc ? -1 : 1;
        } else if (SAME_FILE(sqSrc, sqDst)) {
          delta = sqDst < sqSrc ? -16 : 16;
        } else {
          return false;
        }
        let sqPin = sqSrc + delta;
        while (sqPin !== sqDst && this.squares[sqPin] === 0) {
          sqPin += delta;
        }
        if (sqPin === sqDst) {
          return pcDst === 0 || pcSrc - pcSelfSide !== PIECE_CANNON;
        }
        if (pcDst === 0 || pcSrc - pcSelfSide !== PIECE_CANNON) {
          return false;
        }
        sqPin += delta;
        while (sqPin !== sqDst && this.squares[sqPin] === 0) {
          sqPin += delta;
        }
        return sqPin === sqDst;
      }
      case PIECE_PAWN:
        if (AWAY_HALF(sqDst, this.sdPlayer) && (sqDst === sqSrc - 1 || sqDst === sqSrc + 1)) {
          return true;
        }
        return sqDst === SQUARE_FORWARD(sqSrc, this.sdPlayer);
      default:
        return false;
    }
  }

  // 判断当前方是否被将军
  checked(): boolean {
    const pcSelfSide = SIDE_TAG(this.sdPlayer);
    const pcOppSide = OPP_SIDE_TAG(this.sdPlayer);
    for (let sqSrc = 0; sqSrc < 256; sqSrc++) {
      if (this.squares[sqSrc] !== pcSelfSide + PIECE_KING) {
        continue;
      }
      if (this.squares[SQUARE_FORWARD(sqSrc, this.sdPlayer)] === pcOppSide + PIECE_PAWN) {
        return true;
      }
      for (let delta = -1; delta <= 1; delta += 2) {
        if (this.squares[sqSrc + delta] === pcOppSide + PIECE_PAWN) {
          return true;
        }
      }
      for (let i = 0; i < 4; i++) {
        if (this.squares[sqSrc + ADVISOR_DELTA[i]] !== 0) {
          continue;
        }
        for (let j = 0; j < 2; j++) {
          const pcDst = this.squares[sqSrc + KNIGHT_CHECK_DELTA[i][j]];
          if (pcDst === pcOppSide + PIECE_KNIGHT) {
            return true;
          }
        }
      }
      for (let i = 0; i < 4; i++) {
        const delta = KING_DELTA[i];
        let sqDst = sqSrc + delta;
        while (IN_BOARD(sqDst)) {
          const pcDst = this.squares[sqDst];
          if (pcDst > 0) {
            if (pcDst === pcOppSide + PIECE_ROOK || pcDst === pcOppSide + PIECE_KING) {
              return true;
            }
            break;
          }
          sqDst += delta;
        }
        sqDst += delta;
        while (IN_BOARD(sqDst)) {
          const pcDst = this.squares[sqDst];
          if (pcDst > 0) {
            if (pcDst === pcOppSide + PIECE_CANNON) {
              return true;
            }
            break;
          }
          sqDst += delta;
        }
      }
      return false;
    }
    return false;
  }

  isMate() {
    const mvs = this.generateMoves(null);
    for (let i = 0; i < mvs.length; i++) {
      if (this.makeMove(mvs[i])) {
        this.undoMakeMove();
        return false;
      }
    }
    return true;
  }
  mateValue() {
    return this.distance - MATE_VALUE;
  }

  banValue() {
    return this.distance - BAN_VALUE;
  }

  drawValue() {
    return (this.distance & 1) === 0 ? -DRAW_VALUE : DRAW_VALUE;
  }

  evaluate() {
    const vl =
      (this.sdPlayer === 0 ? this.vlWhite - this.vlBlack : this.vlBlack - this.vlWhite) +
      ADVANCED_VALUE;
    return vl === this.drawValue() ? vl - 1 : vl;
  }

  nullOkay() {
    return (this.sdPlayer === 0 ? this.vlWhite : this.vlBlack) > NULL_OKAY_MARGIN;
  }

  nullSafe() {
    return (this.sdPlayer === 0 ? this.vlWhite : this.vlBlack) > NULL_SAFE_MARGIN;
  }

  inCheck() {
    return this.chkList[this.chkList.length - 1];
  }

  captured() {
    return this.pcList[this.pcList.length - 1] > 0;
  }

  repValue(vlRep: number) {
    const vlReturn =
      ((vlRep & 2) === 0 ? 0 : this.banValue()) + ((vlRep & 4) === 0 ? 0 : -this.banValue());
    return vlReturn === 0 ? this.drawValue() : vlReturn;
  }

  repStatus(recur_: number) {
    let recur = recur_;
    let selfSide = false;
    let perpCheck = true;
    let oppPerpCheck = true;
    let index = this.mvList.length - 1;
    while (this.mvList[index] > 0 && this.pcList[index] === 0) {
      if (selfSide) {
        perpCheck = perpCheck && this.chkList[index];
        if (this.keyList[index] === this.zobristKey) {
          recur--;
          if (recur === 0) {
            return 1 + (perpCheck ? 2 : 0) + (oppPerpCheck ? 4 : 0);
          }
        }
      } else {
        oppPerpCheck = oppPerpCheck && this.chkList[index];
      }
      selfSide = !selfSide;
      index--;
    }
    return 0;
  }

  mirror() {
    const pos = new Position();
    pos.clearBoard();
    for (let sq = 0; sq < 256; sq++) {
      const pc = this.squares[sq];
      if (pc > 0) {
        pos.addPiece(MIRROR_SQUARE(sq), pc);
      }
    }
    if (this.sdPlayer === 1) {
      pos.changeSide();
    }
    return pos;
  }

  bookMove() {
    if (typeof BOOK_DAT !== "object" || BOOK_DAT.length === 0) {
      return 0;
    }
    let mirror = false;
    let lock = this.zobristLock >>> 1; // Convert into Unsigned
    let index = binarySearch(BOOK_DAT, lock);
    if (index < 0) {
      mirror = true;
      lock = this.mirror().zobristLock >>> 1; // Convert into Unsigned
      index = binarySearch(BOOK_DAT, lock);
    }
    if (index < 0) {
      return 0;
    }
    index--;
    while (index >= 0 && BOOK_DAT[index][0] === lock) {
      index--;
    }
    const mvs = [];
    const vls = [];
    let value = 0;
    index++;
    while (index < BOOK_DAT.length && BOOK_DAT[index][0] === lock) {
      let mv = BOOK_DAT[index][1];
      mv = mirror ? MIRROR_MOVE(mv) : mv;
      if (this.legalMove(mv)) {
        mvs.push(mv);
        const vl = BOOK_DAT[index][2];
        vls.push(vl);
        value += vl;
      }
      index++;
    }
    if (value === 0) {
      return 0;
    }
    value = Math.floor(Math.random() * value);
    for (index = 0; index < mvs.length; index++) {
      value -= vls[index];
      if (value < 0) {
        break;
      }
    }
    return mvs[index];
  }

  historyIndex(mv: number) {
    return ((this.squares[SRC(mv)] - 8) << 8) + DST(mv);
  }
}
