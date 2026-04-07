/*
search.js - Source Code for XiangQi Wizard Light, Part II

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

import { BAN_VALUE, DST, HOME_HALF, MATE_VALUE, type Position, WIN_VALUE } from "./position.ts";

const SHELL_STEP = [0, 1, 4, 13, 40, 121, 364, 1093];

export function shellSort(mvs: number[], vls: number[]) {
  let stepLevel = 1;
  while (SHELL_STEP[stepLevel] < mvs.length) {
    stepLevel++;
  }
  stepLevel--;
  while (stepLevel > 0) {
    const step = SHELL_STEP[stepLevel];
    for (let i = step; i < mvs.length; i++) {
      const mvBest = mvs[i];
      const vlBest = vls[i];
      let j = i - step;
      while (j >= 0 && vlBest > vls[j]) {
        mvs[j + step] = mvs[j];
        vls[j + step] = vls[j];
        j -= step;
      }
      mvs[j + step] = mvBest;
      vls[j + step] = vlBest;
    }
    stepLevel--;
  }
}

const PHASE_HASH = 0;
const PHASE_KILLER_1 = 1;
const PHASE_KILLER_2 = 2;
const PHASE_GEN_MOVES = 3;
const PHASE_REST = 4;
const MAX_MOVES = 128;
const MAX_DEPTH = 64;
const MOVE_STACK_SIZE = MAX_MOVES * MAX_DEPTH;
const GLOBAL_MOVE_STACK = new Int32Array(MOVE_STACK_SIZE);
const GLOBAL_VALUE_STACK = new Int32Array(MOVE_STACK_SIZE);

// 走法排序类
class MoveSort {
  mvHash: number; // 置换表中的最佳走法 (Hash Move)
  pos: Position; // 当前局面引用
  mvKiller1: number; // 第一杀手走法
  mvKiller2: number; // 第二杀手走法
  historyTable: number[]; // 历史表引用
  phase: number; // 当前排序阶段
  singleReply: boolean; // 是否只有唯一应着 (用于优化)
  index: number; // 当前走法索引

  // 栈指针 (用于全局走法栈)
  start: number;
  end: number;

  constructor(mvHash: number, pos: Position, killerTable: number[][], historyTable: number[]) {
    this.mvHash = this.mvKiller1 = this.mvKiller2 = 0;
    this.pos = pos;
    this.historyTable = historyTable;
    this.phase = PHASE_HASH;
    this.index = 0;
    this.singleReply = false;

    // 根据当前搜索深度计算在全局栈中的起始位置
    this.start = pos.distance * MAX_MOVES;
    this.end = this.start;

    if (pos.inCheck()) {
      // 如果被将军，只生成解将走法
      this.phase = PHASE_REST;
      const mvsAll = pos.generateMoves(null);
      for (let i = 0; i < mvsAll.length; i++) {
        const mv = mvsAll[i];
        if (!pos.makeMove(mv)) {
          continue;
        }
        pos.undoMakeMove();

        // 存入全局栈
        GLOBAL_MOVE_STACK[this.end] = mv;
        GLOBAL_VALUE_STACK[this.end] =
          mv === mvHash ? 0x7fffffff : historyTable[pos.historyIndex(mv)];
        this.end++;
      }
      this.shellSortStack();
      this.singleReply = this.end - this.start === 1;
    } else {
      // 否则，初始化杀手走法
      this.mvHash = mvHash;
      this.mvKiller1 = killerTable[pos.distance][0];
      this.mvKiller2 = killerTable[pos.distance][1];
    }
  }

  // 对栈中的走法进行希尔排序
  shellSortStack() {
    const count = this.end - this.start;
    if (count <= 1) return;

    let stepLevel = 1;
    while (SHELL_STEP[stepLevel] < count) {
      stepLevel++;
    }
    stepLevel--;
    while (stepLevel > 0) {
      const step = SHELL_STEP[stepLevel];
      for (let i = step; i < count; i++) {
        const mvBest = GLOBAL_MOVE_STACK[this.start + i];
        const vlBest = GLOBAL_VALUE_STACK[this.start + i];
        let j = i - step;
        while (j >= 0 && vlBest > GLOBAL_VALUE_STACK[this.start + j]) {
          GLOBAL_MOVE_STACK[this.start + j + step] = GLOBAL_MOVE_STACK[this.start + j];
          GLOBAL_VALUE_STACK[this.start + j + step] = GLOBAL_VALUE_STACK[this.start + j];
          j -= step;
        }
        GLOBAL_MOVE_STACK[this.start + j + step] = mvBest;
        GLOBAL_VALUE_STACK[this.start + j + step] = vlBest;
      }
      stepLevel--;
    }
  }

  // 获取下一个走法
  next() {
    switch (this.phase) {
      // @ts-ignore falls through
      case PHASE_HASH:
        this.phase = PHASE_KILLER_1;
        if (this.mvHash > 0) {
          return this.mvHash;
        }
      // @ts-ignore falls through
      case PHASE_KILLER_1:
        this.phase = PHASE_KILLER_2;
        if (
          this.mvKiller1 !== this.mvHash &&
          this.mvKiller1 > 0 &&
          this.pos.legalMove(this.mvKiller1)
        ) {
          return this.mvKiller1;
        }
      // @ts-ignore falls through
      case PHASE_KILLER_2:
        this.phase = PHASE_GEN_MOVES;
        if (
          this.mvKiller2 !== this.mvHash &&
          this.mvKiller2 > 0 &&
          this.pos.legalMove(this.mvKiller2)
        ) {
          return this.mvKiller2;
        }
      // @ts-ignore falls through
      case PHASE_GEN_MOVES: {
        this.phase = PHASE_REST;
        // Generate moves directly into stack?
        // generateMoves returns array currently.
        // To fully optimize, generateMoves should write to stack.
        // For now, copy from array to stack.
        // 生成所有走法并存入栈
        const mvs = this.pos.generateMoves(null);

        this.start = this.pos.distance * MAX_MOVES;
        this.end = this.start;

        for (let i = 0; i < mvs.length; i++) {
          GLOBAL_MOVE_STACK[this.end] = mvs[i];
          GLOBAL_VALUE_STACK[this.end] = this.historyTable[this.pos.historyIndex(mvs[i])];
          this.end++;
        }
        this.shellSortStack();
        this.index = 0;
      }
      default:
        while (this.index < this.end - this.start) {
          const mv = GLOBAL_MOVE_STACK[this.start + this.index];
          this.index++;
          if (mv !== this.mvHash && mv !== this.mvKiller1 && mv !== this.mvKiller2) {
            return mv;
          }
        }
    }

    return 0;
  }
}
export const LIMIT_DEPTH = 64;
const NULL_DEPTH = 2;
const RANDOMNESS = 8;

const HASH_ALPHA = 1;
const HASH_BETA = 2;
const HASH_PV = 3;

export class Search {
  hashMask: number;
  mvResult = 0;
  pos: Position;
  allMillis = 0;
  hashTable: { depth: number; flag: number; vl: number; mv: number; zobristLock: number }[] = [];
  historyTable: number[] = [];
  allNodes = 0;
  killerTable: number[][] = [];

  constructor(pos: Position, hashLevel: number) {
    this.hashMask = (1 << hashLevel) - 1;
    this.pos = pos;
  }

  getHashItem() {
    return this.hashTable[this.pos.zobristKey & this.hashMask];
  }

  probeHash(vlAlpha: number, vlBeta: number, depth: number, mv: number[]) {
    const hash = this.getHashItem();
    if (hash.zobristLock !== this.pos.zobristLock) {
      mv[0] = 0;
      return -MATE_VALUE;
    }
    mv[0] = hash.mv;
    let mate = false;
    if (hash.vl > WIN_VALUE) {
      if (hash.vl <= BAN_VALUE) {
        return -MATE_VALUE;
      }
      hash.vl -= this.pos.distance;
      mate = true;
    } else if (hash.vl < -WIN_VALUE) {
      if (hash.vl >= -BAN_VALUE) {
        return -MATE_VALUE;
      }
      hash.vl += this.pos.distance;
      mate = true;
    } else if (hash.vl === this.pos.drawValue()) {
      return -MATE_VALUE;
    }
    if (hash.depth < depth && !mate) {
      return -MATE_VALUE;
    }
    if (hash.flag === HASH_BETA) {
      return hash.vl >= vlBeta ? hash.vl : -MATE_VALUE;
    }
    if (hash.flag === HASH_ALPHA) {
      return hash.vl <= vlAlpha ? hash.vl : -MATE_VALUE;
    }
    return hash.vl;
  }

  recordHash(flag: number, vl: number, depth: number, mv: number) {
    const hash = this.getHashItem();
    if (hash.depth > depth) {
      return;
    }
    hash.flag = flag;
    hash.depth = depth;
    if (vl > WIN_VALUE) {
      if (mv === 0 && vl <= BAN_VALUE) {
        return;
      }
      hash.vl = vl + this.pos.distance;
    } else if (vl < -WIN_VALUE) {
      if (mv === 0 && vl >= -BAN_VALUE) {
        return;
      }
      hash.vl = vl - this.pos.distance;
    } else if (vl === this.pos.drawValue() && mv === 0) {
      return;
    } else {
      hash.vl = vl;
    }
    hash.mv = mv;
    hash.zobristLock = this.pos.zobristLock;
  }

  setBestMove(mv: number, depth: number) {
    this.historyTable[this.pos.historyIndex(mv)] += depth * depth;
    const mvsKiller = this.killerTable[this.pos.distance];
    if (mvsKiller[0] !== mv) {
      mvsKiller[1] = mvsKiller[0];
      mvsKiller[0] = mv;
    }
  }

  searchQuiesc(vlAlpha_: number, vlBeta: number) {
    let vlAlpha = vlAlpha_;
    this.allNodes++;
    let vl = this.pos.mateValue();
    if (vl >= vlBeta) {
      return vl;
    }
    const vlRep = this.pos.repStatus(1);
    if (vlRep > 0) {
      return this.pos.repValue(vlRep);
    }
    if (this.pos.distance === LIMIT_DEPTH) {
      return this.pos.evaluate();
    }
    let vlBest = -MATE_VALUE;
    let mvs = [];
    const vls: number[] = [];
    if (this.pos.inCheck()) {
      mvs = this.pos.generateMoves(null);
      for (let i = 0; i < mvs.length; i++) {
        vls.push(this.historyTable[this.pos.historyIndex(mvs[i])]);
      }
      shellSort(mvs, vls);
    } else {
      vl = this.pos.evaluate();
      if (vl > vlBest) {
        if (vl >= vlBeta) {
          return vl;
        }
        vlBest = vl;
        vlAlpha = Math.max(vl, vlAlpha);
      }
      mvs = this.pos.generateMoves(vls);
      shellSort(mvs, vls);
      for (let i = 0; i < mvs.length; i++) {
        if (vls[i] < 10 || (vls[i] < 20 && HOME_HALF(DST(mvs[i]), this.pos.sdPlayer))) {
          mvs.length = i;
          break;
        }
      }
    }
    for (let i = 0; i < mvs.length; i++) {
      if (!this.pos.makeMove(mvs[i])) {
        continue;
      }
      vl = -this.searchQuiesc(-vlBeta, -vlAlpha);
      this.pos.undoMakeMove();
      if (vl > vlBest) {
        if (vl >= vlBeta) {
          return vl;
        }
        vlBest = vl;
        vlAlpha = Math.max(vl, vlAlpha);
      }
    }
    return vlBest === -MATE_VALUE ? this.pos.mateValue() : vlBest;
  }

  searchFull(vlAlpha_: number, vlBeta: number, depth: number, noNull: boolean) {
    let vlAlpha = vlAlpha_;
    if (depth <= 0) {
      return this.searchQuiesc(vlAlpha, vlBeta);
    }
    this.allNodes++;
    let vl = this.pos.mateValue();
    if (vl >= vlBeta) {
      return vl;
    }
    const vlRep = this.pos.repStatus(1);
    if (vlRep > 0) {
      return this.pos.repValue(vlRep);
    }
    const mvHash = [0];
    vl = this.probeHash(vlAlpha, vlBeta, depth, mvHash);
    if (vl > -MATE_VALUE) {
      return vl;
    }
    if (this.pos.distance === LIMIT_DEPTH) {
      return this.pos.evaluate();
    }
    if (!noNull && !this.pos.inCheck() && this.pos.nullOkay()) {
      this.pos.nullMove();
      vl = -this.searchFull(-vlBeta, 1 - vlBeta, depth - NULL_DEPTH - 1, true);
      this.pos.undoNullMove();
      if (
        vl >= vlBeta &&
        (this.pos.nullSafe() ||
          this.searchFull(vlAlpha, vlBeta, depth - NULL_DEPTH, true) >= vlBeta)
      ) {
        return vl;
      }
    }
    let hashFlag = HASH_ALPHA;
    let vlBest = -MATE_VALUE;
    let mvBest = 0;
    const sort = new MoveSort(mvHash[0], this.pos, this.killerTable, this.historyTable);
    while (true) {
      const mv = sort.next();
      if (mv <= 0) {
        break;
      }

      if (!this.pos.makeMove(mv)) {
        continue;
      }
      const newDepth = this.pos.inCheck() || sort.singleReply ? depth : depth - 1;
      if (vlBest === -MATE_VALUE) {
        vl = -this.searchFull(-vlBeta, -vlAlpha, newDepth, false);
      } else {
        vl = -this.searchFull(-vlAlpha - 1, -vlAlpha, newDepth, false);
        if (vl > vlAlpha && vl < vlBeta) {
          vl = -this.searchFull(-vlBeta, -vlAlpha, newDepth, false);
        }
      }
      this.pos.undoMakeMove();
      if (vl > vlBest) {
        vlBest = vl;
        if (vl >= vlBeta) {
          hashFlag = HASH_BETA;
          mvBest = mv;
          break;
        }
        if (vl > vlAlpha) {
          vlAlpha = vl;
          hashFlag = HASH_PV;
          mvBest = mv;
        }
      }
    }
    if (vlBest === -MATE_VALUE) {
      return this.pos.mateValue();
    }
    this.recordHash(hashFlag, vlBest, depth, mvBest);
    if (mvBest > 0) {
      this.setBestMove(mvBest, depth);
    }
    return vlBest;
  }

  searchRoot(depth: number) {
    let vlBest = -MATE_VALUE;
    const sort = new MoveSort(this.mvResult, this.pos, this.killerTable, this.historyTable);

    while (true) {
      const mv = sort.next();
      if (mv <= 0) {
        break;
      }
      if (!this.pos.makeMove(mv)) {
        continue;
      }
      const newDepth = this.pos.inCheck() ? depth : depth - 1;
      let vl: number;
      if (vlBest === -MATE_VALUE) {
        vl = -this.searchFull(-MATE_VALUE, MATE_VALUE, newDepth, true);
      } else {
        vl = -this.searchFull(-vlBest - 1, -vlBest, newDepth, false);
        if (vl > vlBest) {
          vl = -this.searchFull(-MATE_VALUE, -vlBest, newDepth, true);
        }
      }
      this.pos.undoMakeMove();
      if (vl > vlBest) {
        vlBest = vl;
        this.mvResult = mv;
        if (vlBest > -WIN_VALUE && vlBest < WIN_VALUE) {
          vlBest += Math.floor(Math.random() * RANDOMNESS) - Math.floor(Math.random() * RANDOMNESS);
          vlBest = vlBest === this.pos.drawValue() ? vlBest - 1 : vlBest;
        }
      }
    }
    this.setBestMove(this.mvResult, depth);
    return vlBest;
  }

  searchUnique(vlBeta: number, depth: number) {
    const sort = new MoveSort(this.mvResult, this.pos, this.killerTable, this.historyTable);
    sort.next();
    while (true) {
      const mv = sort.next();
      if (mv <= 0) {
        break;
      }
      if (!this.pos.makeMove(mv)) {
        continue;
      }
      const vl = -this.searchFull(
        -vlBeta,
        1 - vlBeta,
        this.pos.inCheck() ? depth : depth - 1,
        false,
      );
      this.pos.undoMakeMove();
      if (vl >= vlBeta) {
        return false;
      }
    }
    return true;
  }

  searchMain(depth: number, millis: number): number {
    this.mvResult = this.pos.bookMove();
    if (this.mvResult > 0) {
      this.pos.makeMove(this.mvResult);
      if (this.pos.repStatus(3) === 0) {
        this.pos.undoMakeMove();
        return this.mvResult;
      }
      this.pos.undoMakeMove();
    }
    this.hashTable = [];
    for (let i = 0; i <= this.hashMask; i++) {
      this.hashTable.push({ depth: 0, flag: 0, vl: 0, mv: 0, zobristLock: 0 });
    }
    this.killerTable = [];
    for (let i = 0; i < LIMIT_DEPTH; i++) {
      this.killerTable.push([0, 0]);
    }
    this.historyTable = [];
    for (let i = 0; i < 4096; i++) {
      this.historyTable.push(0);
    }
    this.mvResult = 0;
    this.allNodes = 0;
    this.pos.distance = 0;
    const t = Date.now();
    for (let i = 1; i <= depth; i++) {
      const vl = this.searchRoot(i);
      this.allMillis = Date.now() - t;
      if (this.allMillis > millis) {
        break;
      }
      if (vl > WIN_VALUE || vl < -WIN_VALUE) {
        break;
      }
      if (this.searchUnique(1 - WIN_VALUE, i)) {
        break;
      }
    }
    return this.mvResult;
  }

  getKNPS() {
    return this.allNodes / this.allMillis;
  }
}
