// src/engine/ucci-adapter.ts

import process from "node:process";
import * as readline from "node:readline";
import { XiangQiEngine } from "./index.ts";

export class UcciAdapter {
  private engine: XiangQiEngine;
  private running: boolean;
  private thinkingPromise: Promise<string> | null = null;
  private thinkingResolve: ((move: string) => void) | null = null;
  private thinkingReject: ((error: Error) => void) | null = null;

  constructor() {
    this.engine = new XiangQiEngine();
    this.running = true;
  }

  async start(): Promise<void> {
    // Initial handshake
    this.sendLine(`id name ${this.engine.getId().name}`);
    this.sendLine(`id author ${this.engine.getId().author}`);
    this.sendLine("ucciok");

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    for await (const line of rl) {
      if (!this.running) {
        rl.close();
        break;
      }
      this.handleCommand(line.trim());
    }
  }

  private sendLine(message: string): void {
    console.log(message);
  }

  private handleCommand(command: string): void {
    const parts = command.split(" ");
    const cmd = parts[0];

    switch (cmd) {
      case "ucci":
        this.sendLine(`id name ${this.engine.getId().name}`);
        this.sendLine(`id author ${this.engine.getId().author}`);
        this.sendLine("ucciok");
        break;
      case "isready":
        this.sendLine("readyok");
        break;
      case "position":
        this.handlePositionCommand(parts.slice(1));
        break;
      case "go":
        this.handleGoCommand(parts.slice(1));
        break;
      case "quit":
        this.running = false;
        break;
      case "ucinewgame": // UCCI equivalent of UCI "ucinewgame" is implicitly handled by position startpos
        this.engine = new XiangQiEngine(); // Reset engine state for a new game
        break;
      default:
        // Optionally log unknown commands
        // this.sendLine(`info unknown command: ${command}`);
        break;
    }
  }

  private handlePositionCommand(args: string[]): void {
    let fen = "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1"; // Default startpos
    let movesStartIndex = args.length;

    if (args[0] === "startpos") {
      this.engine.loadFen(fen);
      movesStartIndex = 1;
    } else if (args[0] === "fen") {
      const fenParts = [];
      let i = 1;
      while (i < args.length && args[i] !== "moves") {
        fenParts.push(args[i]);
        i++;
      }
      fen = fenParts.join(" ");
      if (!this.engine.loadFen(fen)) {
        this.sendLine(`info error: Invalid FEN provided: ${fen}`);
        return;
      }
      movesStartIndex = i + 1;
    }

    if (args[movesStartIndex - 1] === "moves") {
      for (let i = movesStartIndex; i < args.length; i++) {
        const move = args[i];
        if (!this.engine.makeMove(move)) {
          this.sendLine(`info error: Illegal move in position command: ${move}`);
          return;
        }
      }
    }
  }

  private handleGoCommand(args: string[]): void {
    if (this.thinkingPromise) {
      this.sendLine("info error: already thinking");
      return;
    }

    let depth = 6;
    let timeLimitMillis = 2000;

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      switch (arg) {
        case "depth":
          depth = parseInt(args[++i], 10);
          break;
        case "movetime":
          timeLimitMillis = parseInt(args[++i], 10);
          break;
      }
    }

    this.thinkingPromise = new Promise((resolve, reject) => {
      this.thinkingResolve = resolve;
      this.thinkingReject = reject;
    });

    // Use setTimeout to allow the current command handler to finish and
    // not block the UCCI input stream while the engine is searching.
    setTimeout(() => {
      try {
        const bestMove = this.engine.findBestMove(depth, timeLimitMillis);
        this.sendLine(`bestmove ${bestMove}`);
        this.thinkingResolve?.(bestMove);
      } catch (error) {
        this.sendLine(`info error: ${error instanceof Error ? error.message : String(error)}`);
        this.thinkingReject?.(error as Error);
      } finally {
        this.thinkingPromise = null;
        this.thinkingResolve = null;
        this.thinkingReject = null;
      }
    }, 0);
  }
}

// Main function to start the adapter
async function main() {
  const adapter = new UcciAdapter();
  await adapter.start();
}

main();
