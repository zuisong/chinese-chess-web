import move from "../assets/sounds/move.wav";
import capture from "../assets/sounds/capture.wav";
import check from "../assets/sounds/check.wav";
import move2 from "../assets/sounds/move2.wav";
import capture2 from "../assets/sounds/capture2.wav";
import check2 from "../assets/sounds/check2.wav";
import illegal from "../assets/sounds/illegal.wav";
import win from "../assets/sounds/win.wav";
import loss from "../assets/sounds/loss.wav";
import draw from "../assets/sounds/draw.wav";
import click from "../assets/sounds/click.wav";

const sounds = {
  move,
  capture,
  check,
  move2,
  capture2,
  check2,
  illegal,
  win,
  loss,
  draw,
  click,
} as const;

export type SoundKey = keyof typeof sounds;

export class SoundManager {
  private enabled: boolean = true;
  private audioCache: Map<SoundKey, HTMLAudioElement> = new Map();

  constructor(enabled: boolean) {
    this.enabled = enabled;
    // Preload all sounds
    for (const [key, url] of Object.entries(sounds)) {
      const audio = new Audio(url);
      audio.preload = "auto";
      this.audioCache.set(key as SoundKey, audio);
    }
  }

  /**
   * 播放音效
   */
  play(key: SoundKey): void {
    if (this.enabled) {
      const audio = this.audioCache.get(key);
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(() => {
          // Ignore autoplay restrictions
        });
      }
    }
  }

  playMove(): void {
    this.play("move");
  }
  playCapture(): void {
    this.play("capture");
  }
  playCheck(): void {
    this.play("check");
  }
  playMove2(): void {
    this.play("move2");
  }
  playCapture2(): void {
    this.play("capture2");
  }
  playCheck2(): void {
    this.play("check2");
  }
  playIllegal(): void {
    this.play("illegal");
  }
  playWin(): void {
    this.play("win");
  }
  playLoss(): void {
    this.play("loss");
  }
  playDraw(): void {
    this.play("draw");
  }
  playClick(): void {
    this.play("click");
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }
}
