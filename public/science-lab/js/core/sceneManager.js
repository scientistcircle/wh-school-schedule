/**
 * SCIENCE LAB: The Lost Energy Core
 * Scene Manager - Handles Three.js Renderer, Lighting, Animation Loop, and Level Transitions
 * 
 * THREE.JS VIVA CONCEPTS:
 * - THREE.Scene: The 3D container that holds all meshes, cameras, and lights.
 * - THREE.WebGLRenderer: The engine that draws the 3D scene onto an HTML5 <canvas> using WebGL shader pipelines.
 * - THREE.AmbientLight: Omnidirectional light that uniformly illuminates all objects in the scene equally.
 * - THREE.DirectionalLight: Simulates parallel sunlight rays that cast shadows across the environment.
 * - THREE.PointLight: Emits light in all directions from a single point (like a glowing lightbulb or plasma core).
 * - THREE.Clock: Calculates the precise time elapsed between frames (delta time) for frame-rate independent physics.
 * - requestAnimationFrame: Browser API that calls the render function before the next screen repaint (typically 60fps).
 */

import * as THREE from 'three';
import { CameraManager } from './cameraManager.js';
import { Player } from './player.js';
import { InteractionManager } from './interaction.js';
import { gameState, GameStates } from '../state/gameState.js';
import { LAB_CONFIGS } from '../data/labData.js';

export class SceneManager {
  constructor() {
    this.container = document.getElementById('canvas-container');

    // 1. Initialize THREE.Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x050811);
    this.scene.fog = new THREE.FogExp2(0x050811, 0.025); // Subtle atmospheric depth fog

    // 2. Initialize THREE.PerspectiveCamera
    const aspect = window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.1, 100);
    this.camera.position.set(0, 2, 8);

    // 3. Initialize THREE.WebGLRenderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // High-DPI support capped at 2 for performance
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    // 4. Initialize Clock for delta timing
    this.clock = new THREE.Clock();

    // 5. Initialize Core Subsystems
    this.cameraManager = new CameraManager(this.camera);
    this.player = new Player(this.scene);
    this.interactionManager = new InteractionManager(this.camera, this.scene);

    // 6. Active Level Instance
    this.currentLevel = null;

    // 7. Setup Dynamic Lighting Rig
    this.setupLighting();

    // 8. Event Listeners
    window.addEventListener('resize', () => this.onWindowResize());

    // 9. Start Game Render Loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
  }

  /**
   * Configures base laboratory lighting rig
   */
  setupLighting() {
    // Ambient Light (Provides base visibility so dark areas aren't pitch black)
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(this.ambientLight);

    // Directional Sun Light (Casts soft directional shadows from ceiling)
    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.dirLight.position.set(10, 20, 10);
    this.dirLight.castShadow = true;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 0.5;
    this.dirLight.shadow.camera.far = 50;
    this.dirLight.shadow.camera.left = -15;
    this.dirLight.shadow.camera.right = 15;
    this.dirLight.shadow.camera.top = 15;
    this.dirLight.shadow.camera.bottom = -15;
    this.scene.add(this.dirLight);

    // Sector Theme Accent Point Light (changes color based on active lab)
    this.themePointLight = new THREE.PointLight(0x00f0ff, 3.5, 25);
    this.themePointLight.position.set(0, 5, 0);
    this.scene.add(this.themePointLight);
  }

  /**
   * Update dynamic lights to match the theme color of the active lab
   */
  updateLabTheme(levelId) {
    const config = LAB_CONFIGS[levelId] || LAB_CONFIGS[0];
    const themeColor = config.themeColor || 0x00f0ff;

    this.themePointLight.color.setHex(themeColor);
    
    // Update ceiling subtle tint
    if (this.ambientLight) {
      this.ambientLight.color.setHex(0xffffff);
    }
  }

  /**
   * Loads a new level and cleans up previous level objects from memory
   */
  loadLevel(levelInstance) {
    // 1. Clean up existing level
    if (this.currentLevel) {
      this.currentLevel.dispose();
      this.scene.remove(this.currentLevel.rootGroup);
    }

    // 2. Set new level
    this.currentLevel = levelInstance;
    this.scene.add(this.currentLevel.rootGroup);

    // 3. Register colliders with player
    this.player.setColliders(this.currentLevel.colliders);

    // 4. Register interactable objects
    this.interactionManager.setInteractables(this.currentLevel.interactables);

    // 5. Reposition player to level spawn point
    const spawn = this.currentLevel.spawnPoint || { x: 0, y: 0, z: 8, rotY: 0 };
    this.player.teleport(spawn.x, spawn.y, spawn.z, spawn.rotY);

    // 6. Update lighting theme
    this.updateLabTheme(this.currentLevel.levelId);
  }

  /**
   * Handle responsive window resizing
   */
  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /**
   * Main 60FPS Game Loop
   */
  animate() {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    // Only update gameplay physics when not in hard paused modal states
    if (gameState.currentState === GameStates.PLAYING || gameState.currentState === GameStates.LOADING) {
      // 1. Update Player Movement & Physics
      this.player.update(delta);

      // 2. Update Camera Tracking
      this.cameraManager.update(this.player, delta);

      // 3. Update Raycasting & Interaction Prompt
      this.interactionManager.update(this.player);

      // 4. Update Level specific animations (bubbling liquids, growing plants, floating core)
      if (this.currentLevel && this.currentLevel.update) {
        this.currentLevel.update(delta);
      }
    }

    // 5. Render Scene through WebGL
    this.renderer.render(this.scene, this.camera);
  }
}
