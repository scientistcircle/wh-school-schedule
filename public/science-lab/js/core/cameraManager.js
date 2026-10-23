/**
 * SCIENCE LAB: The Lost Energy Core
 * Camera Manager - First-Person and Third-Person perspective transitions
 * 
 * THREE.JS VIVA CONCEPTS:
 * - THREE.PerspectiveCamera: Simulates human eye perspective where distant objects appear smaller.
 *   Parameters: fov (field of view in degrees), aspect (width/height), near (near clipping plane), far (far clipping plane).
 */

import * as THREE from 'three';
import { saveSystem } from '../state/saveSystem.js';

export class CameraManager {
  constructor(camera) {
    this.camera = camera;
    this.mode = saveSystem.data.settings.cameraMode || "firstPerson"; // "firstPerson" | "thirdPerson"

    // Third person camera offset parameters
    this.thirdPersonOffset = new THREE.Vector3(0, 2.2, 4.0);
    this.lookAtOffset = new THREE.Vector3(0, 1.4, 0);

    // First person eye height
    this.firstPersonEyeHeight = 1.6;

    // Smoothed target positions
    this.currentPosition = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3();
  }

  /**
   * Toggle between First-Person and Third-Person camera modes
   */
  toggleMode() {
    this.mode = (this.mode === "firstPerson") ? "thirdPerson" : "firstPerson";
    saveSystem.setCameraMode(this.mode);
    return this.mode;
  }

  setMode(mode) {
    this.mode = mode;
    saveSystem.setCameraMode(mode);
  }

  /**
   * Update camera position based on player's position and rotation
   * @param {Object} player The player instance
   * @param {number} delta Delta time in seconds
   */
  update(player, delta) {
    if (!player || !player.mesh) return;

    const playerPos = player.mesh.position;
    const playerRotY = player.rotationY;
    const playerPitch = player.pitch || 0;

    if (this.mode === "firstPerson") {
      // First person: Camera is placed right at the player's eye height
      this.camera.position.set(
        playerPos.x,
        playerPos.y + this.firstPersonEyeHeight,
        playerPos.z
      );

      // Calculate look direction from player's yaw (rotationY) and pitch (vertical look)
      const forward = new THREE.Vector3(
        -Math.sin(playerRotY) * Math.cos(playerPitch),
        Math.sin(playerPitch),
        -Math.cos(playerRotY) * Math.cos(playerPitch)
      );

      const targetLook = this.camera.position.clone().add(forward);
      this.camera.lookAt(targetLook);

      // Hide player avatar in first person mode to prevent clipping
      if (player.avatar) {
        player.avatar.visible = false;
      }

    } else {
      // Third person: Camera follows behind the player
      if (player.avatar) {
        player.avatar.visible = true;
      }

      // Calculate camera position offset rotated by player's yaw
      const offset = this.thirdPersonOffset.clone();
      offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), playerRotY);

      const targetCamPos = playerPos.clone().add(offset);
      
      // Smooth camera motion using lerp (Linear Interpolation)
      this.camera.position.lerp(targetCamPos, 0.15);

      // Look at the player's upper chest / head
      const targetLookAt = playerPos.clone().add(this.lookAtOffset);
      this.camera.lookAt(targetLookAt);
    }
  }
}
