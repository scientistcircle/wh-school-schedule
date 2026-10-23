/**
 * SCIENCE LAB: The Lost Energy Core
 * Level 1: Chemistry Lab (Matter, Phase Changes & Reactions)
 */

import { BaseLevel } from './baseLevel.js';

export class Level1Chemistry extends BaseLevel {
  constructor(uiManager) {
    super(1, "Chemistry Lab: Matter & Reactions", 0x3b82f6);
    this.uiManager = uiManager;
    this.buildLabRoom(28, 28, 6);
  }
}
