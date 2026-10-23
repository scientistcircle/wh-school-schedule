/**
 * SCIENCE LAB: The Lost Energy Core
 * Level 2: Biology Lab (Photosynthesis, Cells & Human Organs)
 */

import { BaseLevel } from './baseLevel.js';

export class Level2Biology extends BaseLevel {
  constructor(uiManager) {
    super(2, "Biology Lab: Life Systems", 0x10b981);
    this.uiManager = uiManager;
    this.buildLabRoom(28, 28, 6);
  }
}
