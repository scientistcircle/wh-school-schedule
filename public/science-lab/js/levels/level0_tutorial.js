/**
 * SCIENCE LAB: The Lost Energy Core
 * Level 0: Tutorial & Nova Lab Orientation
 * Teaches 3D navigation, raycasting interaction, science instruments, and scanner calibration.
 */

import * as THREE from 'three';
import { BaseLevel } from './baseLevel.js';
import { QUESTION_BANK } from '../data/questions.js';
import { gameState } from '../state/gameState.js';
import { saveSystem } from '../state/saveSystem.js';

export class Level0Tutorial extends BaseLevel {
  constructor(uiManager) {
    super(0, "Nova Lab: Orientation", 0x00f0ff);
    this.uiManager = uiManager;

    // Set player starting spawn point near room entry
    this.spawnPoint = { x: 0, y: 0, z: 9, rotY: 0 };

    this.initLevel();
  }

  initLevel() {
    // 1. Build laboratory room shell (28m x 28m x 6m)
    this.buildLabRoom(28, 28, 6);

    // 2. Set active objective in HUD
    gameState.setObjective("Calibrate the Science Scanner at the Central Laboratory Console.");

    // 3. Build Central Holographic Terminal & Console
    this.createCentralTerminal();

    // 4. Build Science Instrument Table (Beaker, Thermometer, Burner)
    this.createInstrumentTable();

    // 5. Build Lab Entrance Air-lock Door Frame
    this.createAirlockDoor();
  }

  /**
   * Central Hologram Terminal (Teaches Science Scanner calibration)
   */
  createCentralTerminal() {
    const terminalGroup = new THREE.Group();

    // Terminal Base Pedestal (Hexagonal Cylinder)
    const baseGeo = new THREE.CylinderGeometry(1.6, 2.0, 0.9, 6);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.8,
      roughness: 0.2
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.45;
    base.castShadow = true;
    terminalGroup.add(base);

    // Glowing Hologram Emitter Ring
    const ringGeo = new THREE.TorusGeometry(1.2, 0.08, 16, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.9
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.95;
    terminalGroup.add(ring);

    // Floating Holographic Core Crystal (Octahedron)
    const crystalGeo = new THREE.OctahedronGeometry(0.7, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.85,
      wireframe: true
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 2.2;
    terminalGroup.add(crystal);

    // Rotating Core Ring
    const orbitRingGeo = new THREE.TorusGeometry(1.1, 0.04, 16, 32);
    const orbitRing = new THREE.Mesh(orbitRingGeo, ringMat);
    orbitRing.position.y = 2.2;
    terminalGroup.add(orbitRing);

    terminalGroup.position.set(0, 0, 0);
    this.rootGroup.add(terminalGroup);
    this.colliders.push(base);

    // Register Hologram Core Animation
    this.animatedObjects.push({
      tick: (delta) => {
        crystal.rotation.y += delta * 0.8;
        crystal.rotation.x += delta * 0.4;
        orbitRing.rotation.x += delta * 0.6;
        orbitRing.rotation.y += delta * 0.9;
        crystal.position.y = 2.2 + Math.sin(Date.now() * 0.003) * 0.12;
      }
    });

    // Register Interaction
    this.interactables.push({
      mesh: terminalGroup,
      label: "Examine Central Science Terminal",
      maxDistance: 4.0,
      onInteract: () => {
        this.uiManager.showQuizModal({
          title: "CENTRAL LAB AI: DIAGNOSTIC CALIBRATION",
          question: "Welcome Cadet! To calibrate your Science Scanner: Which fundamental metric measures the average kinetic energy of vibrating particles in a substance?",
          options: [
            { text: "Temperature", isCorrect: true },
            { text: "Volume", isCorrect: false },
            { text: "Weight", isCorrect: false },
            { text: "Density", isCorrect: false }
          ],
          explanation: "Temperature is the thermodynamic measure of the average microscopic kinetic energy of atomic and molecular motion.",
          onCorrect: () => {
            gameState.setObjective("Inspect the Science Instruments on the West Laboratory Workbench.");
            this.uiManager.showToast("Scanner Calibrated! Proceed to West Lab Table.", "success");
          }
        });
      }
    });
  }

  /**
   * Workbench containing Laboratory Instruments (Beaker, Thermometer, Bunsen Burner)
   */
  createInstrumentTable() {
    const table = this.createLabWorkbench(-6, 0, Math.PI / 2, 5, 2.0, 1.0);

    // 1. Transparent Glass Beaker with Liquid
    const beakerGroup = new THREE.Group();
    const glassGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.6, 16, 1, true);
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1
    });
    const glass = new THREE.Mesh(glassGeo, glassMat);
    glass.position.y = 0.3;
    beakerGroup.add(glass);

    // Blue liquid inside beaker
    const liquidGeo = new THREE.CylinderGeometry(0.23, 0.23, 0.4, 16);
    const liquidMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      emissive: 0x1d4ed8,
      emissiveIntensity: 0.3,
      transparent: true,
      opacity: 0.8
    });
    const liquid = new THREE.Mesh(liquidGeo, liquidMat);
    liquid.position.y = 0.2;
    beakerGroup.add(liquid);

    beakerGroup.position.set(-6, 1.08, -1.2);
    this.rootGroup.add(beakerGroup);

    // 2. Bunsen Burner with Animated Flame
    const burnerGroup = new THREE.Group();
    const burnerBaseGeo = new THREE.CylinderGeometry(0.28, 0.32, 0.1, 16);
    const burnerMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.2 });
    const burnerBase = new THREE.Mesh(burnerBaseGeo, burnerMat);
    burnerBase.position.y = 0.05;
    burnerGroup.add(burnerBase);

    const pipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.5, 12);
    const pipe = new THREE.Mesh(pipeGeo, burnerMat);
    pipe.position.y = 0.35;
    burnerGroup.add(pipe);

    // Glowing Orange/Blue Flame (Cone)
    const flameGeo = new THREE.ConeGeometry(0.08, 0.25, 12);
    const flameMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xff4500,
      emissiveIntensity: 1.2,
      transparent: true,
      opacity: 0.9
    });
    const flame = new THREE.Mesh(flameGeo, flameMat);
    flame.position.y = 0.72;
    burnerGroup.add(flame);

    burnerGroup.position.set(-6, 1.08, 0);
    this.rootGroup.add(burnerGroup);

    // Animated flame flicker
    this.animatedObjects.push({
      tick: (delta) => {
        const flicker = 1 + Math.sin(Date.now() * 0.02) * 0.2;
        flame.scale.set(flicker, 1 + Math.cos(Date.now() * 0.03) * 0.15, flicker);
      }
    });

    // 3. Laboratory Thermometer
    const thermometerGroup = new THREE.Group();
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.7, 12);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.35;
    thermometerGroup.add(stem);

    // Red Bulb at bottom
    const bulbGeo = new THREE.SphereGeometry(0.07, 12, 12);
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xdc2626,
      emissiveIntensity: 0.5
    });
    const bulb = new THREE.Mesh(bulbGeo, redMat);
    bulb.position.y = 0.07;
    thermometerGroup.add(bulb);

    // Red mercury column inside stem
    const mercuryGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8);
    const mercury = new THREE.Mesh(mercuryGeo, redMat);
    mercury.position.y = 0.3;
    thermometerGroup.add(mercury);

    thermometerGroup.position.set(-6, 1.08, 1.2);
    this.rootGroup.add(thermometerGroup);

    // Register Instrument Table Interaction (Tutorial Instrument Mission)
    this.interactables.push({
      mesh: table,
      label: "Inspect Laboratory Instruments",
      maxDistance: 3.5,
      onInteract: () => {
        const qData = QUESTION_BANK.tutorial.instrument_measure;
        this.uiManager.showQuizModal({
          title: "TUTORIAL MISSION: LAB INSTRUMENTS",
          question: qData.question,
          options: qData.options,
          explanation: qData.explanation,
          onCorrect: () => {
            gameState.setObjective("Tutorial Complete! Nova Science Laboratory is ready for exploration.");
            saveSystem.unlockBadge("novice_scientist");
            saveSystem.unlockCard("card_scientific_method");
            saveSystem.unlockNextLevel(0);
            this.uiManager.updateHUD();
            this.uiManager.showToast("🎖️ NEW BADGE UNLOCKED: Cadet Scientist!", "success");
            setTimeout(() => {
              this.uiManager.showToast("📋 NEW SCIENCE CARD: The Scientific Method", "success");
            }, 1200);
          }
        });
      }
    });
  }

  /**
   * Airlock Door at South Entrance
   */
  createAirlockDoor() {
    const doorFrameGroup = new THREE.Group();

    // Outer Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5, 0.8), frameMat);
    leftPost.position.set(-2.5, 2.5, 0);
    doorFrameGroup.add(leftPost);

    const rightPost = new THREE.Mesh(new THREE.BoxGeometry(0.6, 5, 0.8), frameMat);
    rightPost.position.set(2.5, 2.5, 0);
    doorFrameGroup.add(rightPost);

    const topHeader = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.8, 0.8), frameMat);
    topHeader.position.set(0, 4.6, 0);
    doorFrameGroup.add(topHeader);

    // Glowing Neon Portal Sign
    const signMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.8
    });
    const sign = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.35, 0.1), signMat);
    sign.position.set(0, 4.0, 0.42);
    doorFrameGroup.add(sign);

    doorFrameGroup.position.set(0, 0, 13.5);
    this.rootGroup.add(doorFrameGroup);
  }
}
