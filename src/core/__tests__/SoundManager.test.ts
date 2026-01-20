import { beforeEach, describe, expect, it, vi } from "vitest";
import { SoundManager } from "../SoundManager";

// Mock Phaser Scene
class MockScene {
  public sound = {
    play: vi.fn((key: string) => {}),
    add: vi.fn((key: string) => ({ play: vi.fn(() => {}) })),
  };
}

describe("SoundManager", () => {
  let mockScene: MockScene;
  let manager: SoundManager;

  beforeEach(() => {
    mockScene = new MockScene();
    manager = new SoundManager(mockScene as any, true);
  });

  describe("初始化", () => {
    it("默认应该启用音效", () => {
      const mgr = new SoundManager(mockScene as any, true);
      expect(mgr.isEnabled()).toBe(true);
    });

    it("可以初始化为禁用状态", () => {
      const mgr = new SoundManager(mockScene as any, false);
      expect(mgr.isEnabled()).toBe(false);
    });

    it("应该持有scene引用", () => {
      expect(manager["scene"]).toBe(mockScene);
    });
  });

  describe("启用/禁用音效", () => {
    it("setEnabled(true) 应该启用音效", () => {
      manager.setEnabled(false);
      manager.setEnabled(true);

      expect(manager.isEnabled()).toBe(true);
    });

    it("setEnabled(false) 应该禁用音效", () => {
      manager.setEnabled(true);
      manager.setEnabled(false);

      expect(manager.isEnabled()).toBe(false);
    });

    it("重复设置相同状态应该正常工作", () => {
      manager.setEnabled(true);
      manager.setEnabled(true);

      expect(manager.isEnabled()).toBe(true);
    });
  });

  describe("播放音效 - 启用时", () => {
    beforeEach(() => {
      manager.setEnabled(true);
      mockScene.sound.play.mockClear();
    });

    it("playClick 应该播放点击音效", () => {
      manager.playClick();
      expect(mockScene.sound.play).toHaveBeenCalledWith("click");
    });

    it("playMove 应该播放移动音效", () => {
      manager.playMove();
      expect(mockScene.sound.play).toHaveBeenCalledWith("move");
    });

    it("playMove2 应该播放对手移动音效", () => {
      manager.playMove2();
      expect(mockScene.sound.play).toHaveBeenCalledWith("move2");
    });

    it("playCapture 应该播放吃子音效", () => {
      manager.playCapture();
      expect(mockScene.sound.play).toHaveBeenCalledWith("capture");
    });

    it("playCapture2 应该播放对手吃子音效", () => {
      manager.playCapture2();
      expect(mockScene.sound.play).toHaveBeenCalledWith("capture2");
    });

    it("playCheck 应该播放将军音效", () => {
      manager.playCheck();
      expect(mockScene.sound.play).toHaveBeenCalledWith("check");
    });

    it("playCheck2 应该播放对手将军音效", () => {
      manager.playCheck2();
      expect(mockScene.sound.play).toHaveBeenCalledWith("check2");
    });

    it("playWin 应该播放胜利音效", () => {
      manager.playWin();
      expect(mockScene.sound.play).toHaveBeenCalledWith("win");
    });

    it("playLoss 应该播放失败音效", () => {
      manager.playLoss();
      expect(mockScene.sound.play).toHaveBeenCalledWith("loss");
    });

    it("playDraw 应该播放和棋音效", () => {
      manager.playDraw();
      expect(mockScene.sound.play).toHaveBeenCalledWith("draw");
    });

    it("playIllegal 应该播放非法移动音效", () => {
      manager.playIllegal();
      expect(mockScene.sound.play).toHaveBeenCalledWith("illegal");
    });
  });

  describe("播放音效 - 禁用时", () => {
    beforeEach(() => {
      manager.setEnabled(false);
      mockScene.sound.play.mockClear();
    });

    it("禁用时 playClick 不应该播放", () => {
      manager.playClick();
      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });

    it("禁用时 playMove 不应该播放", () => {
      manager.playMove();
      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });

    it("禁用时 playCapture 不应该播放", () => {
      manager.playCapture();
      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });

    it("禁用时 playCheck 不应该播放", () => {
      manager.playCheck();
      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });

    it("禁用时 playWin 不应该播放", () => {
      manager.playWin();
      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });

    it("禁用时任何音效都不应该播放", () => {
      manager.playClick();
      manager.playMove();
      manager.playCapture();
      manager.playCheck();
      manager.playWin();
      manager.playLoss();
      manager.playDraw();
      manager.playIllegal();

      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });
  });

  describe("动态启用/禁用", () => {
    it("启用后应该能播放音效", () => {
      manager.setEnabled(false);
      mockScene.sound.play.mockClear();

      manager.setEnabled(true);
      manager.playClick();

      expect(mockScene.sound.play).toHaveBeenCalled();
    });

    it("禁用后应该停止播放音效", () => {
      manager.setEnabled(true);
      manager.setEnabled(false);
      mockScene.sound.play.mockClear();

      manager.playClick();

      expect(mockScene.sound.play).not.toHaveBeenCalled();
    });

    it("应该支持多次切换", () => {
      manager.setEnabled(false);
      manager.setEnabled(true);
      manager.setEnabled(false);
      manager.setEnabled(true);

      mockScene.sound.play.mockClear();
      manager.playClick();

      expect(mockScene.sound.play).toHaveBeenCalled();
    });
  });

  describe("Scene.sound 不可用时", () => {
    it("应该优雅处理 scene.sound 为 null", () => {
      const sceneWithoutSound = { sound: null };
      const mgr = new SoundManager(sceneWithoutSound as any, true);

      // 不应该抛出错误
      expect(() => mgr.playClick()).not.toThrow();
    });

    it("应该优雅处理 scene.sound 为 undefined", () => {
      const sceneWithoutSound = {};
      const mgr = new SoundManager(sceneWithoutSound as any, true);

      // 不应该抛出错误
      expect(() => mgr.playClick()).not.toThrow();
    });
  });

  describe("边界情况", () => {
    it("快速连续播放相同音效应该正常工作", () => {
      mockScene.sound.play.mockClear();

      manager.playClick();
      manager.playClick();
      manager.playClick();

      expect(mockScene.sound.play).toHaveBeenCalledTimes(3);
    });

    it("同时播放不同音效应该正常工作", () => {
      mockScene.sound.play.mockClear();

      manager.playClick();
      manager.playMove();
      manager.playCapture();

      expect(mockScene.sound.play).toHaveBeenCalledTimes(3);
      expect(mockScene.sound.play).toHaveBeenCalledWith("click");
      expect(mockScene.sound.play).toHaveBeenCalledWith("move");
      expect(mockScene.sound.play).toHaveBeenCalledWith("capture");
    });

    it("在音效播放中切换启用状态应该正常", () => {
      manager.playClick();
      manager.setEnabled(false);
      manager.playMove(); // 不应该播放
      manager.setEnabled(true);
      manager.playCapture(); // 应该播放

      const calls = mockScene.sound.play.mock.calls;
      expect(calls.length).toBe(2);
      expect(calls[0][0]).toBe("click");
      expect(calls[1][0]).toBe("capture");
    });
  });

  describe("音效键值", () => {
    it("所有音效应该使用正确的键名", () => {
      const expectedKeys = [
        "click",
        "move",
        "move2",
        "capture",
        "capture2",
        "check",
        "check2",
        "win",
        "loss",
        "draw",
        "illegal",
      ];

      mockScene.sound.play.mockClear();

      manager.playClick();
      manager.playMove();
      manager.playMove2();
      manager.playCapture();
      manager.playCapture2();
      manager.playCheck();
      manager.playCheck2();
      manager.playWin();
      manager.playLoss();
      manager.playDraw();
      manager.playIllegal();

      const calls = mockScene.sound.play.mock.calls;
      const calledKeys = calls.map((call: any) => call[0]);

      expect(calledKeys).toEqual(expectedKeys);
    });
  });
});
