import { beforeEach, describe, expect, it } from "vitest";
import { MemoryStorageAdapter, StorageManager } from "../StorageManager";

describe("StorageManager", () => {
  let manager: StorageManager;
  let storage: MemoryStorageAdapter;

  beforeEach(() => {
    storage = new MemoryStorageAdapter();
    manager = new StorageManager(storage);
    storage.clear(); // 清理存储
  });

  describe("save", () => {
    it("应该成功保存游戏状态", () => {
      const gameState: any = {
        fen: "test-fen-string",
        moveMode: 0,
        handicap: 1,
        difficulty: 100,
        soundEnabled: true,
        animated: true,
      };

      manager.save(gameState);

      const loaded = manager.load();
      expect(loaded).toEqual(gameState);
    });

    it("应该覆盖之前的保存", () => {
      const state1 = { fen: "state1" } as any;
      const state2 = { fen: "state2" } as any;

      manager.save(state1);
      manager.save(state2);

      const loaded = manager.load();
      expect(loaded?.fen).toBe("state2");
    });

    it("应该处理复杂对象", () => {
      const complexState = {
        fen: "test",
        moves: ["a0a1", "b0b1"],
        nested: { value: 123 },
        array: [1, 2, 3],
      } as any;

      manager.save(complexState);
      const loaded = manager.load();

      expect(loaded).toEqual(complexState);
    });
  });

  describe("load", () => {
    it("没有保存时应该返回null", () => {
      const result = manager.load();
      expect(result).toBeNull();
    });

    it("应该正确加载保存的状态", () => {
      const state = {
        fen: "loaded-fen",
        moveMode: 2,
        score: 500,
      } as any;

      manager.save(state);
      const loaded = manager.load();

      expect(loaded).toEqual(state);
    });

    it("应该处理损坏的JSON数据", () => {
      storage.setItem("xqlightweight_game_state", "invalid-json-{[}");

      const result = manager.load();

      expect(result).toBeNull();
    });

    it("应该处理非对象的JSON", () => {
      storage.setItem("xqlightweight_game_state", '"just a string"');

      const result = manager.load();

      expect(result).toBeNull();
    });

    it("应该处理空字符串", () => {
      storage.setItem("xqlightweight_game_state", "");

      const result = manager.load();

      expect(result).toBeNull();
    });
  });

  describe("clear", () => {
    it("应该清除保存的状态", () => {
      const state = {} as any;
      manager.save(state);
      manager.clear();
      const result = manager.load();
      expect(result).toBeNull();
    });
  });

  describe("边界情况", () => {
    it("应该处理空对象", () => {
      manager.save({} as any);
      const loaded = manager.load();

      expect(loaded).toEqual({});
    });

    it("应该处理包含特殊字符的数据", () => {
      const state = {
        fen: "test",
        name: 'special"chars',
        special: "\\n\\t",
      } as any;

      manager.save(state);
      const loaded = manager.load();

      expect(loaded).toEqual(state);
    });

    it("应该处理undefined值", () => {
      const state = {
        defined: "value",
        undefined: undefined,
      } as any;

      manager.save(state);
      const loaded = manager.load();

      // JSON stringify会移除undefined
      expect(loaded).toEqual({ defined: "value" });
    });

    it("应该处理null值", () => {
      const state = {
        value: null,
      } as any;

      manager.save(state);
      const loaded = manager.load();

      expect(loaded).toEqual(state);
    });
  });

  describe("性能", () => {
    it("应该快速保存和加载大数据", () => {
      const largeState = {
        moves: new Array(100).fill("move"),
        data: new Array(100).fill(1),
      } as any;

      const saveStart = performance.now();
      manager.save(largeState);
      const saveTime = performance.now() - saveStart;

      const loadStart = performance.now();
      manager.load();
      const loadTime = performance.now() - loadStart;

      // 应该在合理时间内完成（< 100ms）
      expect(saveTime).toBeLessThan(100);
      expect(loadTime).toBeLessThan(100);
    });
  });
});
