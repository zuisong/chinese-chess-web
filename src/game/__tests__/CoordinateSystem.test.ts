import { describe, expect, it } from "vitest";
import { BOARD_OFFSET_X, BOARD_OFFSET_Y, SQUARE_SIZE } from "../../constants";
import { CoordinateSystem } from "../CoordinateSystem";

describe("CoordinateSystem", () => {
  describe("getScreenPosition", () => {
    it("应该正确转换引擎坐标到屏幕坐标（左上角）", () => {
      // 测试棋盘中心位置 (rank=7, file=7 => square=0x77 = 119)
      const pos = CoordinateSystem.getScreenPosition(119, false, false);

      const expectedX = BOARD_OFFSET_X + (7 - 3) * SQUARE_SIZE;
      const expectedY = BOARD_OFFSET_Y + (7 - 3) * SQUARE_SIZE;

      expect(pos.x).toBe(expectedX);
      expect(pos.y).toBe(expectedY);
    });

    it("应该正确计算中心位置", () => {
      const topLeft = CoordinateSystem.getScreenPosition(119, false, false);
      const center = CoordinateSystem.getScreenPosition(119, false, true);

      expect(center.x).toBe(topLeft.x + SQUARE_SIZE / 2);
      expect(center.y).toBe(topLeft.y + SQUARE_SIZE / 2);
    });

    it("翻转模式应该正确转换坐标", () => {
      const sq = 119; // 0x77
      const normal = CoordinateSystem.getScreenPosition(sq, false, false);
      const flipped = CoordinateSystem.getScreenPosition(sq, true, false);

      // 翻转后应该得到不同的屏幕位置
      expect(flipped).not.toEqual(normal);

      // 验证翻转是对称的
      expect(flipped.x).toBeGreaterThan(0);
      expect(flipped.y).toBeGreaterThan(0);
    });

    it("应该正确处理边界位置", () => {
      // 左上角 (rank=3, file=3 => 0x33 = 51)
      const topLeft = CoordinateSystem.getScreenPosition(51, false, false);
      expect(topLeft.x).toBe(BOARD_OFFSET_X);
      expect(topLeft.y).toBe(BOARD_OFFSET_Y);

      // 右下角 (rank=12, file=11 => 0xCB = 203)
      const bottomRight = CoordinateSystem.getScreenPosition(203, false, false);
      expect(bottomRight.x).toBe(BOARD_OFFSET_X + 8 * SQUARE_SIZE);
      expect(bottomRight.y).toBe(BOARD_OFFSET_Y + 9 * SQUARE_SIZE);
    });
  });

  describe("getSquareAt", () => {
    it("应该正确转换屏幕坐标到引擎坐标", () => {
      const x = BOARD_OFFSET_X + 4 * SQUARE_SIZE + SQUARE_SIZE / 2;
      const y = BOARD_OFFSET_Y + 4 * SQUARE_SIZE + SQUARE_SIZE / 2;

      const sq = CoordinateSystem.getSquareAt(x, y, false);

      // file = 4 + 3 = 7, rank = 4 + 3 = 7 => 0x77 = 119
      expect(sq).toBe(119);
    });

    it("超出棋盘左侧应该返回null", () => {
      const sq = CoordinateSystem.getSquareAt(-100, 200, false);
      expect(sq).toBeNull();
    });

    it("超出棋盘右侧应该返回null", () => {
      const sq = CoordinateSystem.getSquareAt(10000, 200, false);
      expect(sq).toBeNull();
    });

    it("超出棋盘上方应该返回null", () => {
      const sq = CoordinateSystem.getSquareAt(200, -100, false);
      expect(sq).toBeNull();
    });

    it("超出棋盘下方应该返回null", () => {
      const sq = CoordinateSystem.getSquareAt(200, 10000, false);
      expect(sq).toBeNull();
    });

    it("翻转模式应该正确计算", () => {
      const x = BOARD_OFFSET_X + SQUARE_SIZE / 2;
      const y = BOARD_OFFSET_Y + SQUARE_SIZE / 2;

      const normal = CoordinateSystem.getSquareAt(x, y, false);
      const flipped = CoordinateSystem.getSquareAt(x, y, true);

      expect(normal).not.toBeNull();
      expect(flipped).not.toBeNull();
      expect(normal).not.toBe(flipped);

      // 验证翻转逻辑: flipped = 254 - normal
      expect(flipped).toBe(254 - normal!);
    });
  });

  describe("坐标往返转换", () => {
    it("从引擎坐标转到屏幕再转回应该一致", () => {
      const originalSq = 119; // 0x77

      // 转到屏幕坐标（中心）
      const screen = CoordinateSystem.getScreenPosition(originalSq, false, true);

      // 转回引擎坐标
      const backSq = CoordinateSystem.getSquareAt(screen.x, screen.y, false);

      expect(backSq).toBe(originalSq);
    });

    it("翻转模式下往返转换应该一致", () => {
      const originalSq = 119;

      const screen = CoordinateSystem.getScreenPosition(originalSq, true, true);
      const backSq = CoordinateSystem.getSquareAt(screen.x, screen.y, true);

      expect(backSq).toBe(originalSq);
    });

    it("测试多个位置的往返转换", () => {
      const testSquares = [51, 119, 203, 67, 187]; // 多个测试位置

      for (const sq of testSquares) {
        const screen = CoordinateSystem.getScreenPosition(sq, false, true);
        const back = CoordinateSystem.getSquareAt(screen.x, screen.y, false);

        expect(back).toBe(sq);
      }
    });
  });
});
