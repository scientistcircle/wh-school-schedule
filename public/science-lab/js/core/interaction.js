/**
 * SCIENCE LAB: The Lost Energy Core
 * Interaction & Raycasting System
 * 
 * THREE.JS VIVA CONCEPTS:
 * - THREE.Raycaster: Shoots an invisible mathematical ray from a point (such as camera or player position)
 *   in a given direction and calculates all 3D mesh intersections along its path.
 * - Used for: Object selection, clicking on lab beakers/instruments, detecting proximity for "Press E" prompts.
 */

import * as THREE from 'three';
import { audio } from './audio.js';

export class InteractionManager {
  constructor(camera, scene) {
    this.camera = camera;
    this.scene = scene;

    // Raycaster instance
    this.raycaster = new THREE.Raycaster();
    this.raycaster.far = 4.5; // Maximum interaction range (meters)

    // Center screen coordinates for first-person crosshair raycasting
    this.centerScreen = new THREE.Vector2(0, 0);

    // List of registered interactable 3D objects in the current level
    this.interactables = [];

    // Current focused target
    this.currentTarget = null;

    // DOM Prompt Elements
    this.promptEl = document.getElementById('interaction-prompt');
    this.promptLabelEl = document.getElementById('prompt-label');
    this.crosshairEl = document.getElementById('crosshair');

    // Setup input listener for interaction key ('E')
    this.setupListeners();
  }

  /**
   * Set up keyboard 'E' and touch interaction events
   */
  setupListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyE') {
        this.triggerInteraction();
      }
    });

    // Mobile action button trigger
    const mobileInteractBtn = document.getElementById('btn-mobile-interact');
    if (mobileInteractBtn) {
      mobileInteractBtn.addEventListener('click', () => {
        this.triggerInteraction();
      });
    }

    // Prompt element click handler (allows clicking "Press E to Interact" box directly)
    if (this.promptEl) {
      this.promptEl.addEventListener('click', () => {
        this.triggerInteraction();
      });
    }

    // Direct click/tap on 3D canvas for touch or mouse clicking interactables
    const canvas = document.getElementById('canvas-container');
    canvas.addEventListener('click', (e) => {
      // Calculate normalized device coordinates (-1 to +1)
      const mouse = new THREE.Vector2();
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

      this.raycaster.setFromCamera(mouse, this.camera);
      const interactiveMeshes = this.interactables.map(i => i.mesh || i);
      const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

      if (intersects.length > 0) {
        const hitMesh = intersects[0].object;
        const target = this.findInteractableByMesh(hitMesh);
        if (target) {
          audio.playClick();
          if (target.onInteract) target.onInteract();
        }
      }
    });
  }

  /**
   * Register interactable objects for the active level
   * @param {Array} list Array of interactable definitions: { mesh, label, onInteract, maxDistance }
   */
  setInteractables(list) {
    this.interactables = list || [];
    this.clearCurrentTarget();
  }

  findInteractableByMesh(mesh) {
    for (const item of this.interactables) {
      if (item.mesh === mesh || item.mesh.getObjectById(mesh.id)) {
        return item;
      }
    }
    return null;
  }

  /**
   * Trigger interaction on currently focused target
   */
  triggerInteraction() {
    if (this.currentTarget && this.currentTarget.onInteract) {
      audio.playClick();
      this.currentTarget.onInteract();
    }
  }

  clearCurrentTarget() {
    if (this.currentTarget) {
      // Remove visual highlight
      this.unhighlightMesh(this.currentTarget.mesh);
      this.currentTarget = null;
    }
    if (this.promptEl) this.promptEl.classList.add('hidden');
    if (this.crosshairEl) this.crosshairEl.classList.remove('active');
  }

  /**
   * Apply sci-fi pulsing highlight to focused interactable object
   */
  highlightMesh(mesh) {
    if (!mesh) return;
    mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        if (!child.userData.originalEmissive) {
          child.userData.originalEmissive = child.material.emissive ? child.material.emissive.clone() : new THREE.Color(0, 0, 0);
          child.userData.originalEmissiveIntensity = child.material.emissiveIntensity || 0;
        }
        if (child.material.emissive) {
          child.material.emissive.setHex(0x00f0ff);
          child.material.emissiveIntensity = 0.5;
        }
      }
    });
  }

  unhighlightMesh(mesh) {
    if (!mesh) return;
    mesh.traverse((child) => {
      if (child.isMesh && child.material && child.userData.originalEmissive) {
        child.material.emissive.copy(child.userData.originalEmissive);
        child.material.emissiveIntensity = child.userData.originalEmissiveIntensity;
      }
    });
  }

  /**
   * Update interaction checks per frame (proximity and center crosshair raycasting)
   */
  update(player) {
    if (!player || this.interactables.length === 0) {
      this.clearCurrentTarget();
      return;
    }

    const playerPos = player.mesh.position;
    let closestCandidate = null;
    let minDistance = 3.5; // Max interaction distance

    // Check distance to all interactables
    for (const item of this.interactables) {
      if (!item.mesh) continue;
      const itemWorldPos = new THREE.Vector3();
      item.mesh.getWorldPosition(itemWorldPos);

      const dist = playerPos.distanceTo(itemWorldPos);
      const maxRange = item.maxDistance || 3.5;

      if (dist <= maxRange && dist < minDistance) {
        minDistance = dist;
        closestCandidate = item;
      }
    }

    // Raycast check from camera center
    this.raycaster.setFromCamera(this.centerScreen, this.camera);
    const interactiveMeshes = this.interactables.map(i => i.mesh || i);
    const intersects = this.raycaster.intersectObjects(interactiveMeshes, true);

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const rayTarget = this.findInteractableByMesh(hitMesh);
      if (rayTarget) {
        closestCandidate = rayTarget;
      }
    }

    // Update focused target
    if (closestCandidate !== this.currentTarget) {
      if (this.currentTarget) {
        this.unhighlightMesh(this.currentTarget.mesh);
      }
      this.currentTarget = closestCandidate;

      if (this.currentTarget) {
        this.highlightMesh(this.currentTarget.mesh);
        if (this.promptLabelEl) {
          this.promptLabelEl.textContent = this.currentTarget.label || "Interact";
        }
        if (this.promptEl) this.promptEl.classList.remove('hidden');
        if (this.crosshairEl) this.crosshairEl.classList.add('active');
      } else {
        if (this.promptEl) this.promptEl.classList.add('hidden');
        if (this.crosshairEl) this.crosshairEl.classList.remove('active');
      }
    }
  }
}
