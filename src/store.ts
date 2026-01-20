import { signal } from "@preact/signals";
import type Phaser from "phaser";
import type { Difficulty, Handicap, MoveMode } from "./types";

export const gameInstance = signal<Phaser.Game | null>(null);

// Game State
export const scores = signal({ red: 0, black: 0 });
export const showScore = signal(true);

// Settings
export const soundEnabled = signal(true);
export const animated = signal(true);
export const difficulty = signal<Difficulty>(2); // 0=Easy, 1=Normal, 2=Hard
export const moveMode = signal<MoveMode>(0); // 0=Player, 1=Computer, 2=PvP
export const handicap = signal<Handicap>(0); // 0=None, 1=Left Knight, 2=Two Knights, 3=Nine Pieces
