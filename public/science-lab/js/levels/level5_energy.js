/**
 * SCIENCE LAB: The Lost Energy Core
 * Level 5: Energy & Electricity Lab (Circuits, Ohm's Law & Grid)
 */

import { BaseLevel } from './baseLevel.js';

export class Level5Energy extends BaseLevel {
  constructor(uiManager) {
    super(5, "Energy Lab: Electricity & Circuits", 0xeab308);
    this.uiManager = uiManager;
    this.buildLabRoom(28, 28, 6);
  }
}
