/**
 * SCIENCE LAB: The Lost Energy Core
 * Player Controller & Low-Poly 3D Scientist Avatar
 * 
 * THREE.JS VIVA CONCEPTS:
 * - THREE.Group: A container object that holds multiple child meshes together so they can be moved, rotated, and scaled as one unit.
 * - THREE.BoxGeometry, THREE.SphereGeometry, THREE.CylinderGeometry: Standard 3D mathematical primitives.
 * - THREE.MeshStandardMaterial: Physically Based Rendering (PBR) material that realistically reacts to scene lighting, roughness, and metalness.
 * - Custom Physics: Lightweight velocity, acceleration, gravity, and Axis-Aligned Bounding Box (AABB) collision detection without requiring heavy external physics libraries.
 */

import * as THREE from 'three';
import { audio } from './audio.js';

export class Player {
  constructor(scene) {
    this.scene = scene;

    // Root Mesh Group (represents the player entity in 3D world space)
    this.mesh = new THREE.Group();
    this.mesh.position.set(0, 0, 8); // Start near lab entrance
    this.scene.add(this.mesh);

    // Rotation & Look angles (in radians)
    this.rotationY = 0;   // Yaw (turning left/right)
    this.pitch = 0;       // Pitch (looking up/down in 1st person)

    // Physics variables (Custom Lightweight Physics for Viva explanation)
    this.velocity = new THREE.Vector3();
    this.moveSpeed = 6.0;         // Meters per second
    this.jumpForce = 7.0;         // Initial upward velocity
    this.gravity = -18.0;         // Downward gravitational acceleration (m/s^2)
    this.isGrounded = true;
    this.playerHeight = 1.8;
    this.playerRadius = 0.5;

    // Movement input states
    this.keys = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false
    };

    // Mobile joystick input vector (-1 to 1)
    this.joystickInput = new THREE.Vector2(0, 0);

    // Collision colliders array (registered obstacles like tables, walls)
    this.colliders = [];

    // Construct the 3D Scientist Character Model using Three.js Primitives
    this.createScientistAvatar();

    // Walking animation cycle
    this.walkCycleTime = 0;

    // Setup input listeners
    this.setupKeyboardListeners();
    this.setupMouseLook();
  }

  /**
   * Constructs a low-poly 3D Scientist Avatar using clean Three.js geometric primitives
   */
  createScientistAvatar() {
    this.avatar = new THREE.Group();

    // 1. Lab Coat Torso (White Box)
    const coatMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.4,
      metalness: 0.1
    });
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.75, 0.35);
    this.torso = new THREE.Mesh(torsoGeo, coatMat);
    this.torso.position.y = 1.0;
    this.torso.castShadow = true;
    this.avatar.add(this.torso);

    // 2. Scientist ID Badge (Cyan glowing plate on chest)
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6
    });
    const badgeGeo = new THREE.BoxGeometry(0.12, 0.16, 0.02);
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.set(0.18, 1.15, 0.18);
    this.avatar.add(badge);

    // 3. Head (Friendly Skin-tone Sphere)
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Stylized gold/skin tone
      roughness: 0.6
    });
    const headGeo = new THREE.SphereGeometry(0.24, 16, 16);
    this.head = new THREE.Mesh(headGeo, skinMat);
    this.head.position.y = 1.6;
    this.head.castShadow = true;
    this.avatar.add(this.head);

    // 4. Sci-Fi Safety Goggles (Cyan visor over eyes)
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8,
      roughness: 0.2
    });
    const visorGeo = new THREE.BoxGeometry(0.32, 0.1, 0.15);
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.62, 0.16);
    this.avatar.add(visor);

    // 5. Left & Right Arms
    const armGeo = new THREE.BoxGeometry(0.16, 0.6, 0.16);
    this.leftArm = new THREE.Mesh(armGeo, coatMat);
    this.leftArm.position.set(-0.42, 1.0, 0);
    this.leftArm.castShadow = true;
    this.avatar.add(this.leftArm);

    this.rightArm = new THREE.Mesh(armGeo, coatMat);
    this.rightArm.position.set(0.42, 1.0, 0);
    this.rightArm.castShadow = true;
    this.avatar.add(this.rightArm);

    // 6. Left & Right Legs (Dark Blue Trousers)
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.8
    });
    const legGeo = new THREE.BoxGeometry(0.2, 0.65, 0.2);
    
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.18, 0.35, 0);
    this.leftLeg.castShadow = true;
    this.avatar.add(this.leftLeg);

    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.18, 0.35, 0);
    this.rightLeg.castShadow = true;
    this.avatar.add(this.rightLeg);

    this.mesh.add(this.avatar);
  }

  /**
   * Set up keyboard events for WASD, Arrow Keys, and Spacebar Jump
   */
  setupKeyboardListeners() {
    window.addEventListener('keydown', (e) => {
      // Ignore key events when typing inside text inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = true;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = true;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = true;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = true;
          break;
        case 'Space':
          this.jump();
          break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          this.keys.forward = false;
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.keys.backward = false;
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.keys.left = false;
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.keys.right = false;
          break;
      }
    });
  }

  /**
   * Mouse Look controls (Pointer Lock or Mouse Drag)
   */
  setupMouseLook() {
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;

    const canvas = document.getElementById('canvas-container');

    // Drag-to-look (works instantly across all browsers and doesn't trap cursor aggressively)
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) { // Left click
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - prevMouseX;
      const deltaY = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      const sensitivity = 0.0035;
      this.rotationY -= deltaX * sensitivity;
      this.pitch -= deltaY * sensitivity;

      // Clamp pitch so the player cannot flip upside down (-75 to +75 degrees)
      const maxPitch = Math.PI / 2.3;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    });

    // Touch look swipe for mobile on right half of the screen
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouchLooking = false;

    window.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      // If touch is on right half of screen, treat as camera swipe
      if (touch.clientX > window.innerWidth / 2) {
        isTouchLooking = true;
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (!isTouchLooking) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartX;
      const deltaY = touch.clientY - touchStartY;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      const sensitivity = 0.005;
      this.rotationY -= deltaX * sensitivity;
      this.pitch -= deltaY * sensitivity;

      const maxPitch = Math.PI / 2.3;
      this.pitch = Math.max(-maxPitch, Math.min(maxPitch, this.pitch));
    }, { passive: true });

    window.addEventListener('touchend', () => {
      isTouchLooking = false;
    });
  }

  /**
   * Execute jump with sound and vertical impulse
   */
  jump() {
    if (this.isGrounded) {
      this.velocity.y = this.jumpForce;
      this.isGrounded = false;
      audio.playJump();
    }
  }

  /**
   * Register obstacle colliders (lab tables, walls)
   */
  setColliders(collidersArray) {
    this.colliders = collidersArray || [];
  }

  /**
   * Check collision between player circle and box colliders
   */
  checkCollisions(newPos) {
    const radius = this.playerRadius;
    
    // Room boundary clamp (e.g. standard room size -14 to 14 in X and -14 to 14 in Z)
    const roomLimit = 13.5;
    newPos.x = Math.max(-roomLimit, Math.min(roomLimit, newPos.x));
    newPos.z = Math.max(-roomLimit, Math.min(roomLimit, newPos.z));

    // Check custom box colliders
    for (const collider of this.colliders) {
      if (!collider || !collider.geometry) continue;

      const box = new THREE.Box3().setFromObject(collider);
      // Expand box by player radius
      box.expandByScalar(radius * 0.7);

      if (box.containsPoint(new THREE.Vector3(newPos.x, 0.5, newPos.z))) {
        return true; // Collision detected
      }
    }
    return false;
  }

  /**
   * Main per-frame physics & movement update loop
   * @param {number} delta Delta time in seconds
   */
  update(delta) {
    if (delta > 0.1) delta = 0.1; // Clamp large delta lag spikes

    // 1. Calculate Move Direction based on current Rotation (Yaw)
    let moveX = 0;
    let moveZ = 0;

    // Keyboard inputs
    if (this.keys.forward) moveZ -= 1;
    if (this.keys.backward) moveZ += 1;
    if (this.keys.left) moveX -= 1;
    if (this.keys.right) moveX += 1;

    // Mobile Joystick inputs
    if (Math.abs(this.joystickInput.x) > 0.1 || Math.abs(this.joystickInput.y) > 0.1) {
      moveX += this.joystickInput.x;
      moveZ += this.joystickInput.y;
    }

    const isMoving = (moveX !== 0 || moveZ !== 0);

    if (isMoving) {
      // Normalize movement vector so diagonal moving isn't faster
      const inputLength = Math.hypot(moveX, moveZ);
      if (inputLength > 1) {
        moveX /= inputLength;
        moveZ /= inputLength;
      }

      // Transform local movement vector to world space by player's rotation angle
      const forwardX = -Math.sin(this.rotationY);
      const forwardZ = -Math.cos(this.rotationY);
      const rightX = Math.cos(this.rotationY);
      const rightZ = -Math.sin(this.rotationY);

      const dirX = forwardX * (-moveZ) + rightX * moveX;
      const dirZ = forwardZ * (-moveZ) + rightZ * moveX;

      const displacementX = dirX * this.moveSpeed * delta;
      const displacementZ = dirZ * this.moveSpeed * delta;

      // Test X movement collision
      const testPosX = this.mesh.position.clone();
      testPosX.x += displacementX;
      if (!this.checkCollisions(testPosX)) {
        this.mesh.position.x = testPosX.x;
      }

      // Test Z movement collision
      const testPosZ = this.mesh.position.clone();
      testPosZ.z += displacementZ;
      if (!this.checkCollisions(testPosZ)) {
        this.mesh.position.z = testPosZ.z;
      }

      // Walking swing animation for avatar arms and legs
      this.walkCycleTime += delta * 10;
      if (this.leftLeg && this.rightLeg && this.leftArm && this.rightArm) {
        const swing = Math.sin(this.walkCycleTime) * 0.45;
        this.leftLeg.rotation.x = swing;
        this.rightLeg.rotation.x = -swing;
        this.leftArm.rotation.x = -swing;
        this.rightArm.rotation.x = swing;
      }
    } else {
      // Reset limbs to neutral when standing still
      if (this.leftLeg && this.rightLeg && this.leftArm && this.rightArm) {
        this.leftLeg.rotation.x = 0;
        this.rightLeg.rotation.x = 0;
        this.leftArm.rotation.x = 0;
        this.rightArm.rotation.x = 0;
      }
    }

    // 2. Apply Gravity & Vertical Velocity
    this.velocity.y += this.gravity * delta;
    this.mesh.position.y += this.velocity.y * delta;

    // Ground Plane Collision (Floor at y = 0)
    if (this.mesh.position.y <= 0) {
      this.mesh.position.y = 0;
      this.velocity.y = 0;
      this.isGrounded = true;
    }

    // 3. Update Avatar Visual Orientation
    this.avatar.rotation.y = this.rotationY;
  }

  /**
   * Reset player to a specific coordinate and orientation
   */
  teleport(x, y, z, rotationY = 0) {
    this.mesh.position.set(x, y, z);
    this.rotationY = rotationY;
    this.velocity.set(0, 0, 0);
  }
}
