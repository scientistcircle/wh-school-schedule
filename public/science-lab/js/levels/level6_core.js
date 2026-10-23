/**
 * SCIENCE LAB: The Lost Energy Core
 * Level 6: The Energy Core (Reactor Boss & Stability Challenge)
 */

import { BaseLevel } from './baseLevel.js';

export class Level6Core extends BaseLevel {
  constructor(uiManager) {
    super(6, "The Energy Core: Central Reactor", 0xa855f7);
    this.uiManager = uiManager;
    this.buildLabRoom(28, 28, 6);
  }
}
