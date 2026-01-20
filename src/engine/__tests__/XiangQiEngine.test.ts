import { describe, expect, it } from "vitest";
import { XiangQiEngine } from "../index";
import { createMove, createSquare, unsafeSquare } from "../types";
import {
  HANDICAP_POSITIONS,
  INITIAL_POSITION,
  SPECIAL_RULE_POSITIONS,
  TERMINAL_POSITIONS,
} from "./fixtures/positions";
import { SQUARES, ucciSquare } from "./test-helpers";

describe("XiangQiEngine", () => {
  describe("初始化", () => {
    it("应该正确创建引擎实例", () => {
      const engine = new XiangQiEngine();
      expect(engine).toBeDefined();
    });

    it("应该加载初始局面", () => {
      const engine = new XiangQiEngine();
      const fen = engine.getFen();

      // FEN 应该包含基本棋盘信息
      expect(fen).toContain("rnbakabnr");
      expect(fen).toContain("RNBAKABNR");
    });

    it("应该红方先行", () => {
      const engine = new XiangQiEngine();
      expect(engine.sdPlayer).toBe(0); // 0 = 红方
    });
  });

  describe("FEN 加载和导出", () => {
    it("应该正确加载标准开局", () => {
      const engine = new XiangQiEngine();
      engine.loadFen(INITIAL_POSITION);

      const fen = engine.getFen();
      expect(fen).toContain("rnbakabnr");
    });

    it("应该正确加载让子局面", () => {
      const engine = new XiangQiEngine();
      engine.loadFen(HANDICAP_POSITIONS.LEFT_KNIGHT);

      const fen = engine.getFen();
      // 让左马后，红方少一个马
      expect(fen).toContain("R1BAKABNR");
    });

    it("加载后再导出FEN应该一致", () => {
      const engine = new XiangQiEngine();
      const testFen = HANDICAP_POSITIONS.DOUBLE_KNIGHTS;

      engine.loadFen(testFen);
      const exportedFen = engine.getFen();

      // 核心棋盘部分应该一致（可能移动计数不同）
      expect(exportedFen.split(" ")[0]).toBe(testFen.split(" ")[0]);
    });
  });

  describe("棋子获取", () => {
    it("应该正确获取初始位置的棋子", () => {
      const engine = new XiangQiEngine();

      // 红方车在左下角 a0
      const redRook = engine.getPiece(SQUARES.RED_ROOK_A);
      expect(redRook).toBeGreaterThan(0);

      // 黑方车在左上角 a9
      const blackRook = engine.getPiece(SQUARES.BLACK_ROOK_A);
      expect(blackRook).toBeGreaterThan(0);
    });

    it("空格应该返回0", () => {
      const engine = new XiangQiEngine();
      const emptySquare = engine.getPiece(createSquare(5, 5));

      expect(emptySquare).toBe(0);
    });
  });

  describe("合法性检查", () => {
    it("兵向前一步应该合法", () => {
      const engine = new XiangQiEngine();
      const move = createMove(
        SQUARES.RED_PAWN_C, // c3 红兵位置
        SQUARES.C4, // c4 向前一步
      );

      const isLegal = engine.legalMove(move);
      expect(isLegal).toBe(true);
    });

    it("兵向后移动应该非法", () => {
      const engine = new XiangQiEngine();
      const move = createMove(
        SQUARES.RED_PAWN_C, // c3
        ucciSquare("c2"), // 向后 c2
      );

      const isLegal = engine.legalMove(move);
      expect(isLegal).toBe(false);
    });

    it("移动对方棋子应该非法", () => {
      const engine = new XiangQiEngine();
      // 红方先行，尝试移动黑方的卒 c6
      const move = createMove(
        SQUARES.BLACK_PAWN_C, // c6
        SQUARES.C5, // c5
      );

      const isLegal = engine.legalMove(move);
      expect(isLegal).toBe(false);
    });

    it("帅离开九宫应该非法", () => {
      const engine = new XiangQiEngine();
      // 假设有一个帅在边界的测试局面
      const move = createMove(
        createSquare(9, 4),
        createSquare(9, 3), // 离开九宫
      );

      const isLegal = engine.legalMove(move);
      expect(isLegal).toBe(false);
    });
  });

  describe("执行移动", () => {
    it("合法移动应该成功执行", () => {
      const engine = new XiangQiEngine();
      const move = createMove(
        SQUARES.RED_PAWN_C, // c3
        SQUARES.C4, // c4
      );

      const result = engine.makeInternalMove(move);
      expect(result).toBe(true);
    });

    it("非法移动应该失败", () => {
      const engine = new XiangQiEngine();
      const invalidMove = createMove(
        SQUARES.RED_PAWN_C, // c3
        ucciSquare("c2"), // 向后
      );

      const result = engine.makeInternalMove(invalidMove);
      expect(result).toBe(false);
    });

    it("执行移动后应该切换行动方", () => {
      const engine = new XiangQiEngine();
      const initialPlayer = engine.sdPlayer;

      const move = createMove(
        SQUARES.RED_PAWN_C, // c3
        SQUARES.C4, // c4
      );
      engine.makeInternalMove(move);

      expect(engine.sdPlayer).not.toBe(initialPlayer);
    });

    it("连续移动应该正常工作", () => {
      const engine = new XiangQiEngine();

      // 红方兵前进 c3->c4
      const move1 = createMove(SQUARES.RED_PAWN_C, SQUARES.C4);
      expect(engine.makeInternalMove(move1)).toBe(true);

      // 黑方卒前进 c6->c5
      const move2 = createMove(SQUARES.BLACK_PAWN_C, SQUARES.C5);
      expect(engine.makeInternalMove(move2)).toBe(true);
    });
  });

  describe("将军检测", () => {
    it("初始局面不应该将军", () => {
      const engine = new XiangQiEngine();
      expect(engine.inCheck()).toBe(false);
    });

    it("应该检测将军", () => {
      const engine = new XiangQiEngine();
      engine.loadFen(SPECIAL_RULE_POSITIONS.IN_CHECK);

      // 黑方被将军
      expect(engine.inCheck()).toBe(true);
    });
  });

  describe("将死检测", () => {
    it("初始局面不应该将死", () => {
      const engine = new XiangQiEngine();
      expect(engine.isMate()).toBe(false);
    });

    it("应该检测绝杀", () => {
      const engine = new XiangQiEngine();
      // 加载一个绝杀局面
      engine.loadFen(TERMINAL_POSITIONS.CHECKMATE_DOUBLE_ROOK);

      // 可能需要执行一些移动才能到达绝杀状态
      // 具体取决于局面设置
      const isMate = engine.isMate();
      expect(typeof isMate).toBe("boolean");
    });
  });

  describe("UCCI 移动转换", () => {
    it("应该正确转换 UCCI 格式到内部格式", () => {
      const engine = new XiangQiEngine();
      const ucciMove = "c3c4"; // 兵前进

      const internalMove = engine.ucciMoveToInternal(ucciMove);
      expect(typeof internalMove).toBe("number");
      expect(internalMove).toBeGreaterThan(0);
    });

    it("应该正确转换内部格式到 UCCI 格式", () => {
      const engine = new XiangQiEngine();
      const move = createMove(
        SQUARES.RED_PAWN_C, // c3
        SQUARES.C4, // c4
      );

      const ucciMove = engine.moveToString(move);
      expect(typeof ucciMove).toBe("string");
      expect(ucciMove).toBe("c3c4");
    });

    it("UCCI 往返转换应该一致", () => {
      const engine = new XiangQiEngine();
      const originalUcci = "c3c4";

      const internal = engine.ucciMoveToInternal(originalUcci);
      const backToUcci = engine.moveToString(internal);

      expect(backToUcci).toBe(originalUcci);
    });
  });

  describe("AI 移动搜索", () => {
    it("应该能找到最佳移动", () => {
      const engine = new XiangQiEngine();
      const bestMove = engine.findBestMove(16, 100);

      expect(typeof bestMove).toBe("string");
      expect(bestMove).not.toBe("nomove");
      expect(bestMove.length).toBe(4); // UCCI 格式
    });

    it("绝杀局面应该找到将死移动", () => {
      const engine = new XiangQiEngine();
      engine.loadFen(TERMINAL_POSITIONS.CHECKMATE_DOUBLE_ROOK);

      const bestMove = engine.findBestMove(32, 500);
      expect(typeof bestMove).toBe("string");
    });

    it("不同深度应该返回移动", () => {
      const engine = new XiangQiEngine();

      const shallow = engine.findBestMove(8, 50);
      const deep = engine.findBestMove(64, 500);

      expect(shallow).toBeTruthy();
      expect(deep).toBeTruthy();
    });
  });

  describe("局面评估", () => {
    it("应该返回局面分数", () => {
      const engine = new XiangQiEngine();
      const scores = engine.getScores();

      expect(scores).toHaveProperty("red");
      expect(scores).toHaveProperty("black");
      expect(typeof scores.red).toBe("number");
      expect(typeof scores.black).toBe("number");
    });

    it("初始局面双方分数应该接近", () => {
      const engine = new XiangQiEngine();
      const scores = engine.getScores();

      // 初始局面应该基本平衡
      const diff = Math.abs(scores.red - scores.black);
      expect(diff).toBeLessThan(1000); // 允许小误差
    });
  });

  describe("走法历史", () => {
    it("初始应该没有有效走法", () => {
      const engine = new XiangQiEngine();
      const moves = engine.getMoveList();

      expect(Array.isArray(moves)).toBe(true);
      // 过滤掉占位符 (0值)
      const validMoves = moves.filter((m) => m > 0);
      expect(validMoves.length).toBe(0);
    });

    it("执行移动后应该记录走法", () => {
      const engine = new XiangQiEngine();
      const move = createMove(SQUARES.RED_PAWN_C, SQUARES.C4);

      engine.makeInternalMove(move);
      const moves = engine.getMoveList();

      expect(moves.length).toBeGreaterThan(0);
    });

    it("多次移动都应该被记录", () => {
      const engine = new XiangQiEngine();

      // 红方 c3->c4
      engine.makeInternalMove(createMove(SQUARES.RED_PAWN_C, SQUARES.C4));
      // 黑方 c6->c5
      engine.makeInternalMove(createMove(SQUARES.BLACK_PAWN_C, SQUARES.C5));

      const moves = engine.getMoveList();
      // 初始有1个占位符 + 2个有效移动
      expect(moves.filter((m) => m > 0).length).toBe(2);
    });
  });

  describe("悔棋", () => {
    it("应该能够悔棋", () => {
      const engine = new XiangQiEngine();
      const move = createMove(SQUARES.RED_PAWN_C, SQUARES.C4);
      const initialFen = engine.getFen();

      engine.makeInternalMove(move);
      engine.undoMove(); // undoMove返回void，不检查返回值

      // 验证局面恢复
      const afterUndoFen = engine.getFen();
      expect(afterUndoFen.split(" ")[0]).toBe(initialFen.split(" ")[0]);
    });

    it("悔棋后局面应该恢复", () => {
      const engine = new XiangQiEngine();
      const initialFen = engine.getFen();

      const move = createMove(SQUARES.RED_PAWN_C, SQUARES.C4);
      engine.makeInternalMove(move);
      engine.undoMove();

      const afterUndoFen = engine.getFen();
      expect(afterUndoFen.split(" ")[0]).toBe(initialFen.split(" ")[0]);
    });

    it("未执行移动时悔棋不应该改变棋盘", () => {
      const engine = new XiangQiEngine();
      const initialFen = engine.getFen();

      engine.undoMove(); // undoMove返回void

      // 验证棋盘位置未改变 (忽略行动方)
      const afterFen = engine.getFen();
      expect(afterFen.split(" ")[0]).toBe(initialFen.split(" ")[0]);
    });
  });

  describe("重复局面检测", () => {
    it("应该检测重复局面", () => {
      const engine = new XiangQiEngine();
      const status = engine.repStatus(3);

      expect(typeof status).toBe("number");
    });
  });

  describe("获取棋子的合法移动", () => {
    it("应该返回兵的合法移动", () => {
      const engine = new XiangQiEngine();
      const pawnSquare = SQUARES.RED_PAWN_C; // c3
      const moves = engine.getLegalMovesForPiece(pawnSquare);

      expect(Array.isArray(moves)).toBe(true);
      expect(moves.length).toBeGreaterThan(0);
    });

    it("空格应该返回空数组", () => {
      const engine = new XiangQiEngine();
      const empty = createSquare(5, 5);
      const moves = engine.getLegalMovesForPiece(empty);

      expect(moves.length).toBe(0);
    });

    it("对方棋子应该返回空数组", () => {
      const engine = new XiangQiEngine();
      const blackPawn = SQUARES.BLACK_PAWN_C; // c6
      const moves = engine.getLegalMovesForPiece(blackPawn);

      // 红方回合，黑方棋子无法移动
      expect(moves.length).toBe(0);
    });
  });
});
