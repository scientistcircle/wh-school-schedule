/**
 * SCIENCE LAB: The Lost Energy Core
 * Level 4: Earth & Environment Lab (Ecosystems & Planetary Cycles)
 */

import { BaseLevel } from './baseLevel.js';

export class Level4Earth extends BaseLevel {
  constructor(uiManager) {
    super(4, "Earth Lab: Ecological Systems", 0x059669);
    this.uiManager = uiManager;
    this.buildLabRoom(28, 28, 6);
  }
}
