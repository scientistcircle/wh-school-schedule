/**
 * SCIENCE LAB: The Lost Energy Core
 * Game State Manager - Controls current session state, level flow, active objectives, and events
 */

import { saveSystem } from './saveSystem.js';

export const GameStates = {
  LOADING: "LOADING",
  MAIN_MENU: "MAIN_MENU",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  MODAL_OPEN: "MODAL_OPEN",
  VICTORY: "VICTORY",
  GAME_OVER: "GAME_OVER"
};

class GameStateManager {
  constructor() {
    this.currentState = GameStates.LOADING;
    this.currentLevelId = 0;
    this.activeObjective = "Initialize lab navigation systems.";
    this.isPaused = false;
    this.listeners = new Map();
  }

  /**
   * Set global state and notify all subscribed listeners
   */
  setState(newState) {
    if (this.currentState === newState) return;
    const oldState = this.currentState;
    this.currentState = newState;
    this.emit("stateChange", { newState, oldState });
  }

  /**
   * Set active level index (0 to 6)
   */
  setLevel(levelId) {
    this.currentLevelId = levelId;
    saveSystem.data.progress.currentLevel = levelId;
    saveSystem.save();
    this.emit("levelChange", { levelId });
  }

  /**
   * Update active mission objective text displayed in the HUD
   */
  setObjective(text) {
    this.activeObjective = text;
    this.emit("objectiveChange", { text });
  }

  /**
   * Simple event emitter system for decoupled game architecture
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)) {
        callback(data);
      }
    }
  }
}

export const gameState = new GameStateManager();
