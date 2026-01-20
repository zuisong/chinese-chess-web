import Phaser from "phaser";
import type { FunctionalComponent } from "preact";
import { useEffect, useRef } from "preact/hooks";
import MainScene from "../game/MainScene";
import { gameInstance } from "../store";

const Game: FunctionalComponent = () => {
  const gameRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gameRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 521, // Total Width Horizontal from constants
      height: 577, // Board Height from constants
      parent: gameRef.current,
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      backgroundColor: "#333333",
      dom: {
        createContainer: true,
      },
    };

    const game = new Phaser.Game(config);
    gameInstance.value = game;

    return () => {
      game.destroy(true);
      gameInstance.value = null;
    };
  }, []);

  return <div ref={gameRef} className="w-full h-full max-w-full max-h-full relative" />;
};

export default Game;
