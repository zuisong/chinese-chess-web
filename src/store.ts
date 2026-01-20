import type Phaser from "phaser";
import { createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import type MainScene from "./game/MainScene";
import type { Difficulty, Handicap, MoveMode } from "./types";

// Game Instances
export const [gameInstance, setGameInstance] = createSignal<Phaser.Game | null>(null);
export const [mainScene, setMainScene] = createSignal<MainScene | null>(null);

// Game State
export const [scores, setScores] = createStore({ red: 0, black: 0 });
export const [showScore, setShowScore] = createSignal(true);

// Settings
export const [soundEnabled, setSoundEnabled] = createSignal(true);
export const [animated, setAnimated] = createSignal(true);
export const [difficulty, setDifficulty] = createSignal<Difficulty>(2); // 0=Easy, 1=Normal, 2=Hard
export const [moveMode, setMoveMode] = createSignal<MoveMode>(0); // 0=Player, 1=Computer, 2=PvP
export const [handicap, setHandicap] = createSignal<Handicap>(0); // 0=None, 1=Left Knight, 2=Two Knights, 3=Nine Pieces
