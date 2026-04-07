import { createSignal, createStore } from "solid-js";
import type { Difficulty, Handicap, MoveMode } from "./types";

// Game Controller Interface
export interface GameController {
  retract: () => void;
  recommend: () => void;
  setSound: (enabled: boolean) => void;
  setDifficulty: (level: Difficulty) => void;
  setMoveMode: (mode: MoveMode) => void;
  setHandicap: (val: Handicap) => void;
  setAnimated: (enabled: boolean) => void;
  setShowScore: (show: boolean) => void;
  restart: () => void;
  getScores: () => { red: number; black: number };
  getMoveList: () => string[];
}

// Game Instances
export const [mainScene, setMainScene] = createSignal<GameController | null>(null);

// Game State
export const [scores, setScores] = createStore({ red: 0, black: 0 });
export const [showScore, setShowScore] = createSignal(true);

// Settings
export const [soundEnabled, setSoundEnabled] = createSignal(true);
export const [animated, setAnimated] = createSignal(true);
export const [difficulty, setDifficulty] = createSignal<Difficulty>(2); // 0=Easy, 1=Normal, 2=Hard
export const [moveMode, setMoveMode] = createSignal<MoveMode>(0); // 0=Player, 1=Computer, 2=PvP
export const [handicap, setHandicap] = createSignal<Handicap>(0); // 0=None, 1=Left Knight, 2=Two Knights, 3=Nine Pieces

// UI State
export const [thinking, setThinking] = createSignal(false);
