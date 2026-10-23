/**
 * SCIENCE LAB: The Lost Energy Core
 * Level 3: Physics Lab (Dynamics, Gravity & Motion)
 */

import { BaseLevel } from './baseLevel.js';

export class Level3Physics extends BaseLevel {
  constructor(uiManager) {
    super(3, "Physics Lab: Dynamics & Motion", 0xf59e0b);
    this.uiManager = uiManager;
    this.buildLabRoom(28, 28, 6);
  }
}
