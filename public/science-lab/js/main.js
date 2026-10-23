/**
 * SCIENCE LAB: The Lost Energy Core
 * Main Entrypoint & Architecture Coordinator
 * 
 * College Major Project Architecture:
 * - Pure ES6 Modules with zero external build step requirements
 * - Three.js WebGL Engine (Pinned r160 CDN via importmap)
 * - Decoupled Game Loop & Scene Management
 * - Data-Driven Educational Question Bank (Grades 6-10)
 * - Persistent Save System (LocalStorage with Profile & Star Progression)
 */

import { SceneManager } from './core/sceneManager.js';
import { UIManager } from './ui/uiManager.js';
import { gameState, GameStates } from './state/gameState.js';
import { saveSystem } from './state/saveSystem.js';
import { Level0Tutorial } from './levels/level0_tutorial.js';
import { Level1Chemistry } from './levels/level1_chem.js';
import { Level2Biology } from './levels/level2_bio.js';
import { Level3Physics } from './levels/level3_phys.js';
import { Level4Earth } from './levels/level4_earth.js';
import { Level5Energy } from './levels/level5_energy.js';
import { Level6Core } from './levels/level6_core.js';

class GameApp {
  constructor() {
    console.log("Initializing Science Lab: The Lost Energy Core (v1.0)...");

    // 1. Initialize 3D Engine & Scene Manager
    this.sceneManager = new SceneManager();

    // 2. Initialize UI Manager (HUD, Modals, Virtual Joystick)
    this.uiManager = new UIManager(this.sceneManager);

    // 3. Level Constructors Registry
    this.levelRegistry = {
      0: Level0Tutorial,
      1: Level1Chemistry,
      2: Level2Biology,
      3: Level3Physics,
      4: Level4Earth,
      5: Level5Energy,
      6: Level6Core
    };

    // 4. Run Loading Sequence
    this.simulateInitialLoad();

    // 5. Subscribe to State Changes
    gameState.on('levelChange', ({ levelId }) => {
      this.switchLevel(levelId);
    });

    gameState.on('objectiveChange', () => {
      this.uiManager.updateHUD();
    });
  }

  /**
   * Smoothly load simulation assets and display interactive start button
   */
  simulateInitialLoad() {
    let progress = 10;
    this.uiManager.setLoadingProgress(progress, "Compiling WebGL Shaders & Lab Primitives...");

    const interval = setInterval(() => {
      progress += 25;
      if (progress === 35) {
        this.uiManager.setLoadingProgress(progress, "Loading Grade-Specific Science Databases...");
      } else if (progress === 60) {
        this.uiManager.setLoadingProgress(progress, "Calibrating Physics & Raycasting Sensors...");
      } else if (progress === 85) {
        this.uiManager.setLoadingProgress(progress, "Building Nova Science Laboratory Sector 0...");
        // Pre-build Level 0 Tutorial scene
        this.switchLevel(saveSystem.data.progress.currentLevel || 0);
      } else if (progress >= 100) {
        clearInterval(interval);
        this.uiManager.setLoadingProgress(100, "System Ready! Energy Core Awaiting Reactivation.");
      }
    }, 250);
  }

  /**
   * Switch the active 3D level in the scene manager
   */
  switchLevel(levelId) {
    const LevelClass = this.levelRegistry[levelId] || Level0Tutorial;
    const levelInstance = new LevelClass(this.uiManager);
    this.sceneManager.loadLevel(levelInstance);
    this.uiManager.updateHUD();
  }
}

// Bootstrap game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new GameApp();
});
