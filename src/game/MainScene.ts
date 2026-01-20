import Phaser from 'phaser';
import { BOARD_HEIGHT, BOARD_OFFSET_X, BOARD_OFFSET_Y, BOARD_WIDTH, SQUARE_SIZE } from '../constants';
import { XiangQiEngine } from '../engine/index';
import { DST, IN_BOARD, SIDE_TAG, SRC } from '../engine/position';
import type { Move, Square } from '../engine/types';
import { createMove, unsafeSquare } from '../engine/types';
import type { Handicap, MoveMode } from '../types/ui.types';
import { GameStateManager, StorageManager, SoundManager } from '../core';
import { Assets } from './Assets';
import { CoordinateSystem } from './CoordinateSystem';
import { Piece } from './Piece';
import { EVENTS } from './events';

export default class MainScene extends Phaser.Scene {
    private engine: XiangQiEngine;
    private gameState!: GameStateManager;
    private storageManager!: StorageManager;
    private soundManager!: SoundManager;
    private pieces: Map<number, Piece> = new Map();
    // selectedSq delegated to GameStateManager
    private selectionMarker!: Phaser.GameObjects.Image;
    private isFlipped: boolean = false;
    private thinkingMarker!: Phaser.GameObjects.DOMElement;
    private validMoveMarkers: Phaser.GameObjects.Image[] = [];
    // busy state delegated to GameStateManager

    constructor() {
        super('MainScene');
        this.engine = new XiangQiEngine();

        // Initialize Managers early to allow external access (e.g. from React)
        this.storageManager = new StorageManager();
        this.soundManager = new SoundManager(this, true);
        this.gameState = new GameStateManager(this.engine);
    }

    preload() {
        Assets.preload(this);
    }

    create() {
        this.gameState.onStateChangeCallback(() => this.updateSelection());
        this.gameState.onScoreUpdateCallback((scores) => this.events.emit(EVENTS.UPDATE_SCORE, scores));
        this.gameState.onMovesUpdateCallback((moves) => {
            this.events.emit(EVENTS.UPDATE_MOVES, moves);
            this.saveGame();
        });

        // Add Board
        this.add.image(0, 0, 'board').setOrigin(0, 0);

        // Selection Marker (OOS)
        this.selectionMarker = this.add.image(0, 0, 'oos').setOrigin(0, 0).setVisible(false).setDepth(5);

        // Generate Dot Texture
        const graphics = this.make.graphics({ x: 0, y: 0 });
        graphics.fillStyle(0x0000ff, 0.5);
        graphics.fillCircle(16, 16, 8); // 32x32 texture, circle radius 8 centered at 16,16
        graphics.generateTexture('dot', 32, 32);

        // Valid Move Markers (Pool)
        for (let i = 0; i < 32; i++) {
            const marker = this.add.image(0, 0, 'dot').setOrigin(0.5).setVisible(false).setDepth(4);
            this.validMoveMarkers.push(marker);
        }

        // Initialize Pieces
        this.createPieces();

        // Thinking marker as DOMElement (GIF)
        const img = document.createElement('img');
        img.src = 'images/thinking.gif';
        img.style.width = '32px';
        img.style.height = '32px';
        img.style.pointerEvents = 'none';

        this.thinkingMarker = this.add.dom(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, img)
            .setOrigin(0.5)
            .setDepth(1000)
            .setVisible(false);

        // Input Handling
        this.input.on(Phaser.Input.Events.POINTER_DOWN, this.handlePointerDown, this);

        // Auto-load
        this.loadGame();
    }

    createPieces() {
        // Clear existing if any (though create is called once usually)
        this.pieces.forEach(p => p.destroy());
        this.pieces.clear();

        for (let i = 0; i < 256; i++) {
            if (IN_BOARD(i)) {
                const pieceType = this.engine.getPiece(unsafeSquare(i));
                // Only create sprite if there is a piece? 
                // Excalibur created actors for ALL squares and just hid them/changed type.
                // Let's follow that pattern for simplicity of updates.
                const piece = new Piece(this, i, pieceType, this.isFlipped);
                if (pieceType === 0) piece.setVisible(false);
                this.pieces.set(i, piece);
            }
        }
    }

    handlePointerDown(pointer: Phaser.Input.Pointer) {
        if (this.gameState.isBusy) return;

        const sq = CoordinateSystem.getSquareAt(pointer.x, pointer.y, this.isFlipped);
        if (sq !== null) {
            this.clickSquare(unsafeSquare(sq));
        }
    }

    clickSquare(sq: Square) {
        // Try to select piece
        if (this.gameState.selectPiece(sq)) {
            this.soundManager.playClick();
            return;
        }

        // Try to move
        const move = this.gameState.tryMove(sq);
        if (move) {
            const src = SRC(move);
            const dst = DST(move);
            this.makeMove(unsafeSquare(src), unsafeSquare(dst));
        }
    }

    updateSelection() {
        // Hide all valid move markers
        this.validMoveMarkers.forEach(m => m.setVisible(false));

        const selectedSq = this.gameState.selectedSquare;

        if ((selectedSq as number) === 0) {
            this.selectionMarker.setVisible(false);
            return;
        }

        const displaySq = this.isFlipped ? 254 - (selectedSq as number) : selectedSq;
        // Re-use logic from Piece or just calculate
        // We can just ask the piece at that square for its position?
        // But the piece might be hidden (if we selected an empty square? No, we only select own pieces).
        // Wait, we only select own pieces.

        const piece = this.pieces.get(selectedSq as number);
        if (piece) {
            this.selectionMarker.setPosition(piece.x, piece.y);
            this.selectionMarker.setVisible(true);

            // Show valid moves
            const moves = this.gameState.getLegalMoves(selectedSq);
            moves.forEach((mv, index) => {
                if (index < this.validMoveMarkers.length) {
                    const dst = DST(mv as number);
                    const pos = CoordinateSystem.getScreenPosition(dst, this.isFlipped, true);
                    this.validMoveMarkers[index].setPosition(pos.x, pos.y).setVisible(true);
                }
            });
        }
    }

    async makeMove(src: Square, dst: Square) {
        const mv = createMove(src, dst);

        if (!this.engine.legalMove(mv)) {
            this.gameState.clearSelection();
            return;
        }

        if (!this.engine.makeInternalMove(mv)) {
            this.soundManager.playIllegal();
            return;
        }

        // Move successful in engine. Animate it.
        this.gameState.setBusy(true);
        await this.animateMove(src as number, dst as number);

        // Update Board State (Sync all pieces)
        this.flushBoard();

        this.soundManager.playMove(); // Simplified sound logic for now

        this.gameState.clearSelection();

        // Check Game Over / Response
        this.checkGameState();
        this.saveGame();
    }

    async animateMove(src: number, dst: number) {
        const piece = this.pieces.get(src);
        const targetPiece = this.pieces.get(dst); // Might be captured

        if (!piece) return;

        // Calculate target position
        // We can use the target piece's position if it exists (even if empty/hidden)
        // Or calculate manually.
        // Since we created pieces for all squares, targetPiece should exist.

        const targetX = targetPiece!.x;
        const targetY = targetPiece!.y;

        piece.setDepth(100); // Bring to top

        if (!this.animated) {
            piece.setPosition(targetX, targetY);
            piece.setDepth(10);
            return Promise.resolve();
        }

        return new Promise<void>(resolve => {
            this.tweens.add({
                targets: piece,
                x: targetX,
                y: targetY,
                duration: 200,
                onComplete: () => {
                    piece.setDepth(10);
                    resolve();
                }
            });
        });
    }

    flushBoard() {
        // Sync all sprites with engine state
        for (let i = 0; i < 256; i++) {
            if (IN_BOARD(i)) {
                const pc = this.engine.getPiece(unsafeSquare(i));
                const sprite = this.pieces.get(i);
                if (sprite) {
                    sprite.setPiece(pc);
                    // Also update position in case of undo/reset (though animateMove handles x/y)
                    // But animateMove only moved the source sprite.
                    // After move, the piece is logically at dst.
                    // But our `pieces` map is keyed by SQUARE INDEX.
                    // So `pieces.get(src)` should now show EMPTY.
                    // And `pieces.get(dst)` should now show the PIECE.
                    // Wait, my `pieces` map is static: index -> Sprite.
                    // So I just need to update the texture/visibility of each sprite based on the engine content at that index.
                    // AND reset their positions to their "home" squares (because animateMove moved the sprite physically).

                    sprite.updatePosition();
                }
            }
        }
    }

    checkGameState() {
        if (this.engine.isMate()) {
            const computerMove = this.computerMove();
            computerMove ? this.soundManager.playWin() : this.soundManager.playLoss();
            // Alert or UI update for game over
            alert(computerMove ? "你赢了！" : "你输了！");
            this.gameState.setBusy(false);
            return;
        }

        let vlRep = this.engine.repStatus(3);
        if (vlRep > 0) {
            vlRep = this.engine.repValue(vlRep);
            const WIN_VALUE_THRESHOLD = 9000;
            if (vlRep > -WIN_VALUE_THRESHOLD && vlRep < WIN_VALUE_THRESHOLD) {
                this.soundManager.playDraw();
                alert("双方不变作和");
            } else if (this.computerMove() === (vlRep < 0)) {
                this.soundManager.playLoss();
                alert("长打作负");
            } else {
                this.soundManager.playWin();
                alert("长打作负"); // Opponent loses
            }
            this.gameState.setBusy(false);
            return;
        }

        if (this.engine.inCheck()) {
            this.computerMove() ? this.soundManager.playCheck2() : this.soundManager.playCheck();
        } else if (this.engine.captured()) {
            this.computerMove() ? this.soundManager.playCapture2() : this.soundManager.playCapture();
        } else {
            this.computerMove() ? this.soundManager.playMove2() : this.soundManager.playMove();
        }

        this.events.emit(EVENTS.UPDATE_SCORE, this.engine.getScores());
        this.events.emit(EVENTS.UPDATE_MOVES, this.getMoveList());

        this.response();
    }



    response() {
        if (!this.computerMove()) {
            this.gameState.setBusy(false);
            return;
        }

        this.thinkingMarker.setVisible(true);
        this.gameState.setBusy(true);

        // Use setTimeout to allow UI to update and show thinking marker
        setTimeout(() => {
            const ucciMove = this.engine.findBestMove(64, 1000); // 1s thinking time
            this.thinkingMarker.setVisible(false);

            if (ucciMove === "nomove") {
                this.gameState.setBusy(false);
                return;
            }

            const internalMove = this.engine.ucciMoveToInternal(ucciMove);
            this.addMove(internalMove);
        }, 250);
    }

    async addMove(mv: Move) {
        if (!this.engine.legalMove(mv)) return;
        if (!this.engine.makeInternalMove(mv)) return;

        this.gameState.setBusy(true);
        await this.animateMove(SRC(mv as number), DST(mv as number));
        this.flushBoard();
        this.checkGameState();
    }

    // --- Public API for UI ---

    // --- Public API for UI ---

    public retract() {
        if (this.engine.getHistoryLength() > 1) {
            // Always undo at least one move
            this.engine.undoInternalMove();

            // If HvAI (moveMode != 2), try to undo a second move to get back to player's turn
            // But only if there is enough history (history length > 1 means at least 1 move made, 
            // but we just undid one. We need at least one more move to undo.)
            // Actually getHistoryLength counts moves. Start is 0? No, mvList init with [0].
            // So length 1 = start. Length 2 = 1 move made.
            // If we undid one, length decreased by 1.
            // If length > 1, we can undo again.
            if (this.moveMode !== 2 && this.engine.getHistoryLength() > 1) {
                this.engine.undoInternalMove();
            }

            this.flushBoard();
            this.events.emit(EVENTS.UPDATE_SCORE, this.engine.getScores());
            this.events.emit(EVENTS.UPDATE_MOVES, this.getMoveList());
        }
    }

    public animated: boolean = true;

    public setAnimated(enabled: boolean) {
        this.animated = enabled;
        this.saveGame();
    }

    public recommend() {
        if (this.gameState.isBusy) return;

        // Don't recommend if game over
        if (this.engine.isMate() || this.engine.repStatus(3) > 0) return;

        // Clear selection and valid move markers before executing the recommended move
        this.gameState.clearSelection();

        this.thinkingMarker.setVisible(true);
        this.gameState.setBusy(true);

        setTimeout(() => {
            const ucciMove = this.engine.findBestMove(64, 1000); // 1s thinking time
            this.thinkingMarker.setVisible(false);
            this.gameState.setBusy(false);

            if (ucciMove !== "nomove") {
                const internalMove = this.engine.ucciMoveToInternal(ucciMove);
                // Execute the move directly
                this.addMove(internalMove);
            }
        }, 100);
    }

    public getScores() {
        return this.engine.getScores();
    }

    public getMoveList() {
        return this.engine.getMoveList().map(m => {
            const ucci = this.engine.moveToString(m);
            // Format: a0i9 -> A0-I9
            return `${ucci.slice(0, 2).toUpperCase()} -${ucci.slice(2, 4).toUpperCase()} `;
        });
    }



    // --- Settings & State ---
    // Delegated to GameStateManager

    get difficulty(): number { return this.gameState.difficulty; }
    set difficulty(val: number) { this.gameState.setDifficultyMillis(val); }

    get moveMode(): MoveMode { return this.gameState.moveMode; }
    set moveMode(val: MoveMode) { this.gameState.setMoveMode(val); }

    get handicap(): Handicap { return this.gameState.handicap; }
    set handicap(val: Handicap) { this.gameState.setHandicap(val); }

    public showScore: boolean = true;

    // STARTUP_FEN remains here for now as UI configuration
    private readonly STARTUP_FEN = [
        "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR w - - 0 1", // No Handicap
        "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKABNR w - - 0 1", // Left Knight
        "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/R1BAKAB1R w - - 0 1", // Double Knights
        "rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/9/1C5C1/9/RN2K2NR w - - 0 1",           // Nine Pieces
    ];

    public setSound(enabled: boolean) {
        this.soundManager.setEnabled(enabled);
        this.saveGame();
    }

    public setDifficulty(level: number) {
        // level: 0=Easy(10ms), 1=Normal(100ms), 2=Hard(1000ms)
        this.gameState.setDifficulty(level);
        this.saveGame();
    }

    public setMoveMode(mode: MoveMode) {
        this.gameState.setMoveMode(mode);
        this.saveGame();
    }

    public setHandicap(handicap: Handicap) {
        this.gameState.setHandicap(handicap);
        this.saveGame();
    }

    // --- Added for SettingsModal compatibility ---

    get soundEnabled(): boolean {
        return this.soundManager.isEnabled();
    }



    public setShowScore(show: boolean) {
        this.showScore = show;
        this.saveGame();
        this.events.emit(EVENTS.UPDATE_SETTINGS);
    }

    private initialFen: string = "";

    public restart() {
        // this.engine = new XiangQiEngine(); // Do NOT create new engine, it breaks GameStateManager reference
        // Just load FEN to reset state

        // Apply Handicap
        const fen = this.STARTUP_FEN[this.handicap] || this.STARTUP_FEN[0];
        this.initialFen = fen;
        this.engine.loadFen(fen);

        this.createPieces(); // Reset pieces
        this.gameState.clearSelection();
        this.gameState.setBusy(false);

        // Handle Move Mode (Computer First)
        if (this.moveMode === 1) {
            this.response();
        } else {
            this.checkGameState();
        }

        this.events.emit(EVENTS.UPDATE_SCORE, this.engine.getScores());
        this.events.emit(EVENTS.UPDATE_MOVES, this.getMoveList());
        this.saveGame();
    }

    computerMove() {
        let computerSide = 1; // Default Black
        if (this.moveMode === 1) computerSide = 0; // Computer is Red
        if (this.moveMode === 2) return false; // No Computer

        return this.engine.sdPlayer === computerSide;
    }

    public loadGame() {
        const gameState = this.storageManager.load();
        if (gameState) {
            // Restore settings
            if (gameState.handicap !== undefined) this.handicap = gameState.handicap;
            if (gameState.moveMode !== undefined) this.moveMode = gameState.moveMode;
            if (gameState.difficulty !== undefined) this.difficulty = gameState.difficulty;
            if (gameState.soundEnabled !== undefined) this.soundManager.setEnabled(gameState.soundEnabled);
            if (gameState.animated !== undefined) this.animated = gameState.animated;
            if (gameState.showScore !== undefined) this.showScore = gameState.showScore;

            // Restore Game
            if (gameState.initialFen && gameState.moves) {
                this.initialFen = gameState.initialFen;
                this.engine.loadFen(this.initialFen);

                // Replay moves
                for (const ucci of gameState.moves) {
                    const mv = this.engine.ucciMoveToInternal(ucci);
                    this.engine.makeInternalMove(mv);
                }
            } else if (gameState.fen) {
                // Legacy or simple FEN
                this.engine.loadFen(gameState.fen);
                this.initialFen = gameState.fen; // Assume current is initial if no history
            }

            this.createPieces();
            this.flushBoard();
            this.checkGameState();
            this.events.emit(EVENTS.UPDATE_SCORE, this.engine.getScores());
            this.events.emit(EVENTS.UPDATE_MOVES, this.getMoveList());
        } else {
            // No save, start fresh
            this.restart();
        }
    }

    public saveGame() {
        const moves = this.engine.getMoveList()
            .filter(m => (m as number) > 0) // Filter out dummy move 0
            .map(m => this.engine.moveToString(m));

        const gameState = {
            fen: this.engine.getFen(),
            initialFen: this.initialFen || this.engine.getFen(),
            moves: moves,
            handicap: this.handicap,
            moveMode: this.moveMode,
            difficulty: this.difficulty,
            soundEnabled: this.soundManager.isEnabled(),
            animated: this.animated,
            showScore: this.showScore
        };
        this.storageManager.save(gameState);
    }
}
