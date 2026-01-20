// src/core/StorageManager.ts
// 本地存储管理器 - 负责游戏状态的保存和加载
// 使用依赖注入模式，支持任意存储后端

import type { GameState } from "../types/ui.types";

/**
 * 存储接口 - 定义存储后端需要实现的方法
 */
export interface IStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * LocalStorage 适配器 - 默认实现
 */
export class LocalStorageAdapter implements IStorage {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn("[LocalStorageAdapter] getItem failed:", error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.error("[LocalStorageAdapter] setItem failed:", error);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("[LocalStorageAdapter] removeItem failed:", error);
    }
  }
}

/**
 * 内存存储适配器 - 用于测试或不支持 localStorage 的环境
 */
export class MemoryStorageAdapter implements IStorage {
  private storage = new Map<string, string>();

  getItem(key: string): string | null {
    return this.storage.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.storage.set(key, value);
  }

  removeItem(key: string): void {
    this.storage.delete(key);
  }

  clear(): void {
    this.storage.clear();
  }
}

/**
 * 存储管理器
 * 通过依赖注入支持不同的存储后端
 */
export class StorageManager {
  private readonly STORAGE_KEY = "xqlightweight_game_state";
  private storage: IStorage;

  /**
   * @param storage 存储后端实现，默认使用 LocalStorage
   */
  constructor(storage?: IStorage) {
    this.storage = storage ?? new LocalStorageAdapter();
  }

  /**
   * 保存游戏状态
   */
  save(state: GameState): void {
    try {
      this.storage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("[StorageManager] Failed to save game state:", error);
    }
  }

  /**
   * 加载游戏状态
   */
  load(): GameState | null {
    try {
      const savedData = this.storage.getItem(this.STORAGE_KEY);
      if (!savedData) {
        return null;
      }

      const parsed = JSON.parse(savedData);

      // 验证是否是有效对象（不是字符串、数组或null）
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        console.warn("[StorageManager] Loaded data is not a valid object");
        return null;
      }

      return parsed as GameState;
    } catch (error) {
      console.error("[StorageManager] Failed to load game state:", error);
      return null;
    }
  }

  /**
   * 清除保存的游戏状态
   */
  clear(): void {
    try {
      this.storage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error("[StorageManager] Failed to clear game state:", error);
    }
  }

  /**
   * 检查是否有保存的游戏状态
   */
  hasSavedGame(): boolean {
    return this.storage.getItem(this.STORAGE_KEY) !== null;
  }

  /**
   * 更换存储后端（用于测试或动态切换）
   */
  setStorage(storage: IStorage): void {
    this.storage = storage;
  }
}
