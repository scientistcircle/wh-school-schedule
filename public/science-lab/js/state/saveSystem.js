/**
 * SCIENCE LAB: The Lost Energy Core
 * Save System - LocalStorage manager with auto-save, profile management, and progress tracking
 */

const STORAGE_KEY = "NOVA_SCIENCE_LAB_SAVE_V1";

export class SaveSystem {
  constructor() {
    this.data = this.loadDefaultData();
    this.load();
  }

  /**
   * Default state for new players
   */
  loadDefaultData() {
    return {
      version: "1.0.0",
      profile: {
        name: "Cadet Scientist",
        avatar: "🧑‍🔬",
        grade: 8, // Default grade (6-10)
        createdAt: new Date().toISOString()
      },
      progress: {
        currentLevel: 0, // 0 = Tutorial, 1 = Chem, 2 = Bio, 3 = Phys, 4 = Earth, 5 = Energy, 6 = Core
        highestUnlockedLevel: 0,
        xp: 0,
        coins: 50, // Starting research coins
        stars: {
          0: 0,
          1: 0,
          2: 0,
          3: 0,
          4: 0,
          5: 0,
          6: 0
        },
        badges: [], // Array of badge IDs
        cards: [],  // Array of unlocked science card IDs
        completedMissions: {} // e.g. { "0_tut": true, "1_m1": true }
      },
      settings: {
        soundEnabled: true,
        musicVolume: 0.5,
        sfxVolume: 0.8,
        cameraMode: "firstPerson", // "firstPerson" or "thirdPerson"
        touchControls: "auto", // "auto", "always", "off"
        mouseSensitivity: 1.0
      }
    };
  }

  /**
   * Load saved profile and progression from LocalStorage
   */
  load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with default data in case new fields were added
        this.data = {
          ...this.data,
          ...parsed,
          profile: { ...this.data.profile, ...parsed.profile },
          progress: { ...this.data.progress, ...parsed.progress },
          settings: { ...this.data.settings, ...parsed.settings }
        };
      }
    } catch (err) {
      console.warn("Could not load save data from localStorage, using defaults:", err);
      this.data = this.loadDefaultData();
    }
    return this.data;
  }

  /**
   * Save current progression to LocalStorage
   */
  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (err) {
      console.error("Failed to save to localStorage:", err);
    }
  }

  /**
   * Reset save data back to defaults
   */
  reset() {
    this.data = this.loadDefaultData();
    this.save();
  }

  // -------------------------------------------------------------
  // Progression Helpers
  // -------------------------------------------------------------
  addXP(amount) {
    this.data.progress.xp = (this.data.progress.xp || 0) + amount;
    this.save();
    return this.data.progress.xp;
  }

  addCoins(amount) {
    this.data.progress.coins = Math.max(0, (this.data.progress.coins || 0) + amount);
    this.save();
    return this.data.progress.coins;
  }

  setStars(levelId, stars) {
    const current = this.data.progress.stars[levelId] || 0;
    if (stars > current) {
      this.data.progress.stars[levelId] = stars;
      this.save();
    }
  }

  unlockNextLevel(completedLevelId) {
    const nextLevel = completedLevelId + 1;
    if (nextLevel > this.data.progress.highestUnlockedLevel) {
      this.data.progress.highestUnlockedLevel = nextLevel;
      this.save();
    }
  }

  unlockBadge(badgeId) {
    if (!this.data.progress.badges.includes(badgeId)) {
      this.data.progress.badges.push(badgeId);
      this.save();
      return true; // Newly unlocked
    }
    return false;
  }

  unlockCard(cardId) {
    if (!this.data.progress.cards.includes(cardId)) {
      this.data.progress.cards.push(cardId);
      this.save();
      return true; // Newly unlocked
    }
    return false;
  }

  setGrade(gradeNumber) {
    this.data.profile.grade = parseInt(gradeNumber, 10);
    this.save();
  }

  setCameraMode(mode) {
    this.data.settings.cameraMode = mode;
    this.save();
  }
}

export const saveSystem = new SaveSystem();
