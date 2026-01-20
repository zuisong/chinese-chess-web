import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { gameInstance, scores, showScore } from "../../store";
import UI from "../UI";

// Mock child components
vi.mock("../SettingsModal", () => ({
  default: ({ isOpen }: any) => (isOpen ? <div>游戏设置</div> : null),
}));

vi.mock("../RestartModal", () => ({
  default: ({ isOpen }: any) => (isOpen ? <div>确认要重新开始</div> : null),
}));

// Mock Data
const createMockScene = () => ({
  events: {
    on: vi.fn(),
    off: vi.fn(),
  },
  getScores: vi.fn(() => ({ red: 500, black: 500 })),
  showScore: true,
  soundEnabled: true,
  moveMode: 0,
  handicap: 0,
  animated: true,
  difficulty: 100,
  retract: vi.fn(),
  recommend: vi.fn(),
  setSound: vi.fn(),
  setDifficulty: vi.fn(),
  setAnimated: vi.fn(),
  setShowScore: vi.fn(),
  restart: vi.fn(),
});

describe("UI Component", () => {
  let mockScene: any;

  beforeEach(() => {
    mockScene = createMockScene();
    // Setup the signal
    const mockGame = {
      scene: {
        getScene: vi.fn((name: string) => {
          if (name === "MainScene") return mockScene;
          return null;
        }),
      },
    };
    gameInstance.value = mockGame as any;
    scores.value = { red: 500, black: 500 };
    showScore.value = true;
  });

  afterEach(() => {
    cleanup();
    gameInstance.value = null;
  });

  describe("渲染", () => {
    it("应该正确渲染 UI", () => {
      const { container } = render(<UI />);
      expect(container).toBeInTheDocument();
    });

    it("应该显示控制按钮", () => {
      render(<UI />);
      expect(screen.getByText("设置")).toBeInTheDocument();
      expect(screen.getByText("重开")).toBeInTheDocument();
      expect(screen.getByText("悔棋")).toBeInTheDocument();
      expect(screen.getByText("提示")).toBeInTheDocument();
    });
  });

  describe("分数显示", () => {
    it("showScore 为 true 时应该显示分数", async () => {
      const { container } = render(<UI />);

      await waitFor(() => {
        const scoreBar = screen.getByTestId("score-bar-red");
        expect(scoreBar).toBeInTheDocument();
      });
    });

    it("应该显示红黑双方分数占比", async () => {
      render(<UI />);
      // Initial 500/500 is 50%
      const percentages = await screen.findAllByText("50%");
      expect(percentages.length).toBeGreaterThan(0);
    });

    it("分数更新时应该重新渲染", async () => {
      const { findByText } = render(<UI />);

      // Update signal
      act(() => {
        scores.value = { red: 700, black: 300 };
      });

      const percent70 = await findByText("70%");
      const percent30 = await findByText("30%");
      expect(percent70).toBeInTheDocument();
      expect(percent30).toBeInTheDocument();
    });
  });

  describe("按钮交互", () => {
    it("点击设置按钮应该打开设置模态框", async () => {
      render(<UI />);

      const settingsButton = screen.getByText("设置");
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText("游戏设置")).toBeInTheDocument();
      });
    });

    it("点击重开按钮应该打开确认模态框", async () => {
      render(<UI />);

      const restartButton = screen.getByText("重开");
      fireEvent.click(restartButton);

      await waitFor(() => {
        expect(screen.getByText("确认要重新开始")).toBeInTheDocument();
      });
    });

    it("点击悔棋按钮应该调用 scene.retract", () => {
      render(<UI />);
      const retractButton = screen.getByText("悔棋");
      fireEvent.click(retractButton);
      expect(mockScene.retract).toHaveBeenCalled();
    });

    it("点击提示按钮应该调用 scene.recommend", () => {
      render(<UI />);
      const recommendButton = screen.getByText("提示");
      fireEvent.click(recommendButton);
      expect(mockScene.recommend).toHaveBeenCalled();
    });
  });

  describe("边界情况", () => {
    it("scene 为 null 时按钮不应该崩溃", () => {
      gameInstance.value = null; // Set signal to null
      render(<UI />);

      expect(() => {
        fireEvent.click(screen.getByText("悔棋"));
        fireEvent.click(screen.getByText("提示"));
      }).not.toThrow();
    });
  });
});
