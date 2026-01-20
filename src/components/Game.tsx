import Phaser from "phaser";
import { type Component, onCleanup, onMount } from "solid-js";
import MainScene from "../game/MainScene";
import { setGameInstance } from "../store";

const Game: Component = () => {
  let gameRef: HTMLDivElement | undefined;

  onMount(() => {
    if (!gameRef) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 521, // Board Width from constants
      height: 577, // Board Height from constants
      parent: gameRef,
      dom: {
        createContainer: true,
      },
      scene: [MainScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      transparent: true,
      audio: {
        noAudio: false,
      },
      input: {
        keyboard: true,
        mouse: true,
        touch: true,
      },
    };

    const game = new Phaser.Game(config);
    setGameInstance(game);

    onCleanup(() => {
      game.destroy(true);
      setGameInstance(null);
    });
  });

  return <div ref={gameRef} class="w-full h-full max-w-full max-h-full relative" />;
};

export default Game;
