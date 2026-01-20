import type Phaser from "phaser";
import { PIECE_IMAGE_MAP } from "../constants";

export class Assets {
  static preload(scene: Phaser.Scene) {
    // Board
    scene.load.image("board", "images/board.jpg");
    scene.load.image("oos", "images/oos.gif");
    scene.load.image("thinking", "images/thinking.gif");

    // Pieces
    Object.entries(PIECE_IMAGE_MAP).forEach(([_key, value]) => {
      scene.load.image(value, `images/${value}.gif`);
    });

    // Sounds
    const sounds = [
      "capture",
      "capture2",
      "check",
      "check2",
      "click",
      "draw",
      "illegal",
      "loss",
      "move",
      "move2",
      "newgame",
      "win",
    ];
    sounds.forEach((sound) => {
      scene.load.audio(sound, `sounds/${sound}.wav`);
    });
  }
}
