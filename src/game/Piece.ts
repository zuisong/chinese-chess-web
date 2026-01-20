import Phaser from "phaser";
import { PIECE_IMAGE_MAP } from "../constants";
import type { PieceType } from "../engine/types";
import { CoordinateSystem } from "./CoordinateSystem";

export class Piece extends Phaser.GameObjects.Sprite {
  public sq: number;
  public pieceType: PieceType;
  private _flipped: boolean;

  constructor(scene: Phaser.Scene, sq: number, pieceType: PieceType, flipped: boolean = false) {
    super(scene, 0, 0, PIECE_IMAGE_MAP[pieceType]);
    this.sq = sq;
    this.pieceType = pieceType;
    this._flipped = flipped;

    this.setOrigin(0, 0);

    this.updatePosition();

    scene.add.existing(this);
  }

  updatePosition() {
    const pos = CoordinateSystem.getScreenPosition(this.sq, this._flipped, false);
    this.x = pos.x;
    this.y = pos.y;
  }

  setPiece(type: PieceType) {
    this.pieceType = type;
    const textureKey = PIECE_IMAGE_MAP[type];
    if (textureKey) {
      this.setTexture(textureKey);
      this.setVisible(true);
    } else {
      this.setVisible(false);
    }
  }
}
