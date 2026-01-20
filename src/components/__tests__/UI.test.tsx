import { cleanup, fireEvent, render, screen, waitFor } from "@solidjs/testing-library";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setGameInstance, setMainScene, setScores, setShowScore } from "../../store";
import UI from "../UI";

// Mock child components
vi.mock("../SettingsModal", () => ({
  default: (props: any) => <div>{props.isOpen ? "游戏设置" : ""}</div>,
}));

vi.mock("../RestartModal", () => ({
  default: (props: any) => <div>{props.isOpen ? "确认要重新开始" : ""}</div>,
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
    setMainScene(() => mockScene); // Use function updater for object to avoid interpretation as updater
    setScores({ red: 500, black: 500 });
    setShowScore(true);
  });

  afterEach(() => {
    cleanup();
    setMainScene(null);
  });

  it("应该渲染控制按钮", () => {
    render(() => <UI />);
    expect(screen.getByText("设置")).toBeInTheDocument();
    expect(screen.getByText("重开")).toBeInTheDocument();
    expect(screen.getByText("悔棋")).toBeInTheDocument();
    expect(screen.getByText("提示")).toBeInTheDocument();
  });

  it("应该显示分数条", async () => {
    render(() => <UI />);
    // Initial 500/500 is 50%
    const percentages = await screen.findAllByText("50%");
    expect(percentages.length).toBeGreaterThan(0);
  });

  it("点击设置按钮应该打开设置模态框", async () => {
    render(() => <UI />);
    const settingsButton = screen.getByText("设置");
    fireEvent.click(settingsButton);
    await waitFor(() => {
      expect(screen.getByText("游戏设置")).toBeInTheDocument();
    });
  });

  it("点击重开按钮应该打开重开模态框", async () => {
    render(() => <UI />);
    const restartButton = screen.getByText("重开");
    fireEvent.click(restartButton);
    await waitFor(() => {
      expect(screen.getByText("确认要重新开始")).toBeInTheDocument();
    });
  });

  it("点击悔棋按钮应该调用scene.retract", () => {
    render(() => <UI />);
    const retractButton = screen.getByText("悔棋");
    fireEvent.click(retractButton);
    expect(mockScene.retract).toHaveBeenCalled();
  });

  it("点击提示按钮应该调用scene.recommend", () => {
    render(() => <UI />);
    const recommendButton = screen.getByText("提示");
    fireEvent.click(recommendButton);
    expect(mockScene.recommend).toHaveBeenCalled();
  });

  it("分数更新时应该反映变化", async () => {
    render(() => <UI />);
    setScores({ red: 700, black: 300 });
    const percent70 = await screen.findByText("70%");
    const percent30 = await screen.findByText("30%");
    expect(percent70).toBeInTheDocument();
    expect(percent30).toBeInTheDocument();
  });

  it("当showScore为false时不应该显示分数条", async () => {
    setShowScore(false);
    render(() => <UI />);
    await waitFor(() => {
      expect(screen.queryByText("50%")).not.toBeInTheDocument();
    });
  });

  it("当scene为null时按钮应该仍然可以点击", () => {
    setMainScene(null);
    render(() => <UI />);
    const retractButton = screen.getByText("悔棋");
    expect(() => fireEvent.click(retractButton)).not.toThrow();
  });
});
