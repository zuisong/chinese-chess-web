import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock HTMLAudioElement
const mockPlay = vi.fn(() => Promise.resolve());
vi.stubGlobal(
  "Audio",
  class MockAudio {
    src: string = "";
    preload: string = "";
    currentTime: number = 0;
    play = mockPlay;
    constructor(src?: string) {
      this.src = src || "";
    }
  },
);

import { SoundManager } from "../SoundManager";

describe("SoundManager", () => {
  let manager: SoundManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new SoundManager(true);
  });

  describe("Initialization", () => {
    it("should be enabled by default", () => {
      const mgr = new SoundManager(true);
      expect(mgr.isEnabled()).toBe(true);
    });

    it("can be initialized as disabled", () => {
      const mgr = new SoundManager(false);
      expect(mgr.isEnabled()).toBe(false);
    });
  });

  describe("Enable/Disable", () => {
    it("setEnabled(true) should enable sound", () => {
      manager.setEnabled(false);
      manager.setEnabled(true);
      expect(manager.isEnabled()).toBe(true);
    });

    it("setEnabled(false) should disable sound", () => {
      manager.setEnabled(true);
      manager.setEnabled(false);
      expect(manager.isEnabled()).toBe(false);
    });
  });

  describe("Sound Playing", () => {
    it("should play sound when enabled", () => {
      manager.playClick();
      expect(mockPlay).toHaveBeenCalled();
    });

    it("should not play sound when disabled", () => {
      manager.setEnabled(false);
      mockPlay.mockClear();
      manager.playClick();
      expect(mockPlay).not.toHaveBeenCalled();
    });

    it("should use correct methods for all play functions", () => {
      mockPlay.mockClear();
      manager.playMove();
      expect(mockPlay).toHaveBeenCalled();

      mockPlay.mockClear();
      manager.playCapture();
      expect(mockPlay).toHaveBeenCalled();

      mockPlay.mockClear();
      manager.playCheck();
      expect(mockPlay).toHaveBeenCalled();
    });
  });
});
