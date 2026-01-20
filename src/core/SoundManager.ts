// src/core/SoundManager.ts
// 音效管理器 - 负责所有音效的播放和设置

export class SoundManager {
  private scene: Phaser.Scene;
  private enabled: boolean = true;

  constructor(scene: Phaser.Scene, enabled: boolean = true) {
    this.scene = scene;
    this.enabled = enabled;
  }

  /**
   * 播放音效
   */
  play(key: string): void {
    if (this.enabled && this.scene.sound) {
      this.scene.sound.play(key);
    }
  }

  /**
   * 播放移动音效
   */
  playMove(): void {
    this.play("move");
  }

  /**
   * 播放吃子音效
   */
  playCapture(): void {
    this.play("capture");
  }

  /**
   * 播放将军音效
   */
  playCheck(): void {
    this.play("check");
  }

  /**
   * 播放对方移动音效
   */
  playMove2(): void {
    this.play("move2");
  }

  /**
   * 播放对方吃子音效
   */
  playCapture2(): void {
    this.play("capture2");
  }

  /**
   * 播放对方将军音效
   */
  playCheck2(): void {
    this.play("check2");
  }

  /**
   * 播放非法移动音效
   */
  playIllegal(): void {
    this.play("illegal");
  }

  /**
   * 播放胜利音效
   */
  playWin(): void {
    this.play("win");
  }

  /**
   * 播放失败音效
   */
  playLoss(): void {
    this.play("loss");
  }

  /**
   * 播放和棋音效
   */
  playDraw(): void {
    this.play("draw");
  }

  /**
   * 播放点击音效
   */
  playClick(): void {
    this.play("click");
  }

  /**
   * 设置音效开关
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 获取音效开关状态
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
