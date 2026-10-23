/**
 * SCIENCE LAB: The Lost Energy Core
 * UI Manager - Handles HUD updates, Quiz Modals, Toasts, and Mobile Virtual Joystick
 */

import { saveSystem } from '../state/saveSystem.js';
import { gameState, GameStates } from '../state/gameState.js';
import { audio } from '../core/audio.js';
import { LAB_CONFIGS } from '../data/labData.js';

export class UIManager {
  constructor(sceneManager) {
    this.sceneManager = sceneManager;

    // HUD Elements
    this.labTagEl = document.getElementById('hud-lab-tag');
    this.gradeBadgeEl = document.getElementById('hud-grade-badge');
    this.objectiveTextEl = document.getElementById('hud-objective-text');
    this.xpEl = document.getElementById('hud-xp');
    this.coinsEl = document.getElementById('hud-coins');
    this.cameraBtn = document.getElementById('btn-camera-toggle');
    this.soundBtn = document.getElementById('btn-sound-toggle');
    this.pauseBtn = document.getElementById('btn-pause');

    // Modals & Toasts
    this.modalContainer = document.getElementById('modal-container');
    this.modalCard = document.getElementById('modal-card');
    this.toastContainer = document.getElementById('toast-container');

    // Loading Screen
    this.loadingScreen = document.getElementById('loading-screen');
    this.loadingProgress = document.getElementById('loading-progress');
    this.loadingStatus = document.getElementById('loading-status');
    this.startAdventureBtn = document.getElementById('btn-start-adventure');

    // Stage 2: Main Menu & Sub-Views Elements
    this.mainMenuOverlay = document.getElementById('main-menu-overlay');
    this.viewHome = document.getElementById('view-home');
    this.viewGrades = document.getElementById('view-grades');
    this.viewLevels = document.getElementById('view-levels');
    this.viewBadges = document.getElementById('view-badges');
    this.viewProfile = document.getElementById('view-profile');
    this.viewSettings = document.getElementById('view-settings');

    this.setupEventListeners();
    this.setupMainMenu();
    this.setupMobileJoystick();
    this.updateHUD();
  }

  /**
   * Setup Main Menu Navigation & Sub-views Handlers
   */
  setupMainMenu() {
    // 1. Home Menu Action Buttons
    const btnStart = document.getElementById('btn-menu-start');
    if (btnStart) {
      btnStart.addEventListener('click', () => {
        audio.playClick();
        this.startGameplay();
      });
    }

    const btnGrade = document.getElementById('btn-menu-grade');
    if (btnGrade) {
      btnGrade.addEventListener('click', () => {
        audio.playClick();
        this.showSubView('grades');
      });
    }

    const btnLevels = document.getElementById('btn-menu-levels');
    if (btnLevels) {
      btnLevels.addEventListener('click', () => {
        audio.playClick();
        this.showSubView('levels');
      });
    }

    const btnBadges = document.getElementById('btn-menu-badges');
    if (btnBadges) {
      btnBadges.addEventListener('click', () => {
        audio.playClick();
        this.showSubView('badges');
      });
    }

    const btnProfile = document.getElementById('btn-menu-profile');
    if (btnProfile) {
      btnProfile.addEventListener('click', () => {
        audio.playClick();
        this.showSubView('profile');
      });
    }

    const btnSettings = document.getElementById('btn-menu-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        audio.playClick();
        this.showSubView('settings');
      });
    }

    // 2. Back to Menu Buttons
    ['grades', 'levels', 'badges', 'profile', 'settings'].forEach(view => {
      const backBtn = document.getElementById(`btn-back-from-${view}`);
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          audio.playClick();
          this.showSubView('home');
        });
      }
    });

    // 3. Badges vs Cards Tab Toggle
    const tabBadges = document.getElementById('tab-btn-badges');
    const tabCards = document.getElementById('tab-btn-cards');
    const contentBadges = document.getElementById('gallery-badges-content');
    const contentCards = document.getElementById('gallery-cards-content');

    if (tabBadges && tabCards && contentBadges && contentCards) {
      tabBadges.addEventListener('click', () => {
        audio.playClick();
        tabBadges.classList.add('active');
        tabCards.classList.remove('active');
        contentBadges.classList.remove('hidden');
        contentCards.classList.add('hidden');
      });

      tabCards.addEventListener('click', () => {
        audio.playClick();
        tabCards.classList.add('active');
        tabBadges.classList.remove('active');
        contentCards.classList.remove('hidden');
        contentBadges.classList.add('hidden');
      });
    }

    // 4. Profile Avatar Picker & Name Form
    const avatarOpts = document.querySelectorAll('.avatar-opt');
    const avatarDisplay = document.getElementById('profile-avatar-display');
    avatarOpts.forEach(opt => {
      opt.addEventListener('click', () => {
        audio.playClick();
        const selected = opt.getAttribute('data-avatar');
        saveSystem.data.profile.avatar = selected;
        if (avatarDisplay) avatarDisplay.textContent = selected;
      });
    });

    const btnSaveProfile = document.getElementById('btn-save-profile');
    const inputName = document.getElementById('input-scientist-name');
    if (btnSaveProfile && inputName) {
      btnSaveProfile.addEventListener('click', () => {
        audio.playClick();
        const val = inputName.value.trim() || "Cadet Scientist";
        saveSystem.data.profile.name = val;
        saveSystem.save();
        this.updateProfileUI();
        this.showToast("Profile Updated Successfully!", "success");
        this.showSubView('home');
      });
    }

    // 5. Settings Toggles
    const soundToggle = document.getElementById('setting-sound-toggle');
    if (soundToggle) {
      soundToggle.checked = saveSystem.data.settings.soundEnabled;
      soundToggle.addEventListener('change', (e) => {
        saveSystem.data.settings.soundEnabled = e.target.checked;
        saveSystem.save();
        if (this.soundBtn) this.soundBtn.textContent = e.target.checked ? "🔊" : "🔇";
      });
    }

    const cameraSelect = document.getElementById('setting-camera-select');
    if (cameraSelect) {
      cameraSelect.value = saveSystem.data.settings.cameraMode;
      cameraSelect.addEventListener('change', (e) => {
        audio.playClick();
        this.sceneManager.cameraManager.setMode(e.target.value);
        if (this.cameraBtn) {
          this.cameraBtn.querySelector('.btn-text').textContent = 
            e.target.value === "firstPerson" ? "1st Person" : "3rd Person";
        }
      });
    }

    const btnSettingsReset = document.getElementById('btn-settings-reset');
    if (btnSettingsReset) {
      btnSettingsReset.addEventListener('click', () => {
        if (confirm("Erase all player progress, stars, XP, badges, and reset to Grade 8 default?")) {
          saveSystem.reset();
          this.updateHUD();
          this.updateProfileUI();
          this.populateGradeCards();
          this.populateSectorCards();
          this.populateBadgesAndCards();
          this.showToast("All save data has been reset to defaults.");
        }
      });
    }

    this.updateProfileUI();
    this.populateGradeCards();
    this.populateSectorCards();
    this.populateBadgesAndCards();
  }

  /**
   * Switch between Main Menu sub-views
   */
  showSubView(viewName) {
    const views = {
      home: this.viewHome,
      grades: this.viewGrades,
      levels: this.viewLevels,
      badges: this.viewBadges,
      profile: this.viewProfile,
      settings: this.viewSettings
    };

    Object.values(views).forEach(v => {
      if (v) v.classList.add('hidden');
    });

    if (views[viewName]) {
      views[viewName].classList.remove('hidden');
    }

    // Refresh dynamic data
    this.updateProfileUI();
    if (viewName === 'grades') this.populateGradeCards();
    if (viewName === 'levels') this.populateSectorCards();
    if (viewName === 'badges') this.populateBadgesAndCards();
  }

  /**
   * Populate Grade Selection Cards (Grades 6 to 10)
   */
  populateGradeCards() {
    const container = document.getElementById('grades-container');
    if (!container) return;

    const currentGrade = saveSystem.data.profile.grade;

    const gradeDescriptions = [
      {
        grade: 6,
        title: "Grade 6: Science Fundamentals",
        topics: "States of matter, plant chloroplasts, basic force pushes/pulls, water evaporation, simple conductors."
      },
      {
        grade: 7,
        title: "Grade 7: Intermediate Science",
        topics: "Acid neutralization (pH 7), photosynthesis products, vacuum gravity, greenhouse gases, series circuits."
      },
      {
        grade: 8,
        title: "Grade 8: Applied Science & Laws",
        topics: "Chemical reactions, respiratory gas exchange, Newton's 2nd Law (F=m*a), ozone layer, Ohm's law current."
      },
      {
        grade: 9,
        title: "Grade 9: Advanced Principles",
        topics: "Conservation of mass equations, mitochondrial cellular respiration, kinetic energy, eutrophication, electric power (P=V*I)."
      },
      {
        grade: 10,
        title: "Grade 10: Mastery & Calculations",
        topics: "Exothermic synthesis reactions, anaerobic respiration & lactic acid, Snell's Law optics, photovoltaics, parallel resistor circuits."
      }
    ];

    container.innerHTML = gradeDescriptions.map(g => `
      <div class="grade-card ${g.grade === currentGrade ? 'active' : ''}" data-grade="${g.grade}">
        <div class="grade-card-badge">
          <span>Grade ${g.grade}</span>
          <span>${g.grade === currentGrade ? '✅ ACTIVE' : 'Select'}</span>
        </div>
        <div style="font-weight: 700; color: #fff; font-size: 0.9rem; margin-bottom: 6px;">
          ${g.title}
        </div>
        <div class="grade-card-topics">
          ${g.topics}
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.grade-card').forEach(card => {
      card.addEventListener('click', () => {
        audio.playClick();
        const selectedGrade = parseInt(card.getAttribute('data-grade'), 10);
        saveSystem.setGrade(selectedGrade);
        this.updateProfileUI();
        this.populateGradeCards();
        this.updateHUD();
        this.showToast(`Curriculum updated to Grade ${selectedGrade}!`, "success");
      });
    });
  }

  /**
   * Populate Sector Map Cards
   */
  populateSectorCards() {
    const container = document.getElementById('sectors-container');
    if (!container) return;

    const highestUnlocked = saveSystem.data.progress.highestUnlockedLevel || 0;
    const currentLevel = gameState.currentLevelId;

    let html = '';
    for (let i = 0; i <= 6; i++) {
      const config = LAB_CONFIGS[i];
      const isUnlocked = i <= highestUnlocked;
      const starsEarned = saveSystem.data.progress.stars[i] || 0;
      const starsDisplay = isUnlocked ? "⭐".repeat(starsEarned) + "☆".repeat(3 - starsEarned) : "🔒 LOCKED";

      html += `
        <div class="sector-card ${isUnlocked ? '' : 'locked'} ${i === currentLevel ? 'active' : ''}" data-level="${i}">
          <div class="sector-card-header">
            <span class="sector-card-tag" style="color: ${config.cssColor};">${config.tag}</span>
            <span class="sector-stars">${starsDisplay}</span>
          </div>
          <div class="sector-card-title">${config.title}</div>
          <div class="sector-card-subject">${config.subject}</div>
        </div>
      `;
    }

    container.innerHTML = html;

    container.querySelectorAll('.sector-card:not(.locked)').forEach(card => {
      card.addEventListener('click', () => {
        audio.playClick();
        const levelId = parseInt(card.getAttribute('data-level'), 10);
        gameState.setLevel(levelId);
        this.startGameplay();
        this.showToast(`Entered ${LAB_CONFIGS[levelId].title}`);
      });
    });
  }

  /**
   * Populate Badges & Science Cards Gallery
   */
  populateBadgesAndCards() {
    const badgesContainer = document.getElementById('gallery-badges-content');
    const cardsContainer = document.getElementById('gallery-cards-content');

    if (badgesContainer) {
      let badgesHTML = '';
      for (let i = 0; i <= 6; i++) {
        const config = LAB_CONFIGS[i];
        const isUnlocked = saveSystem.data.progress.badges.includes(config.badge.id);

        badgesHTML += `
          <div class="badge-card ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="badge-icon">${isUnlocked ? config.badge.icon : "🔒"}</div>
            <div class="badge-title">${config.badge.title}</div>
            <div class="badge-desc">${isUnlocked ? config.badge.desc : "Complete Sector " + i + " to earn this badge."}</div>
          </div>
        `;
      }
      badgesContainer.innerHTML = badgesHTML;
    }

    if (cardsContainer) {
      let cardsHTML = '';
      for (let i = 0; i <= 6; i++) {
        const config = LAB_CONFIGS[i];
        const isUnlocked = saveSystem.data.progress.cards.includes(config.card.id);

        cardsHTML += `
          <div class="science-card-item ${isUnlocked ? 'unlocked' : 'locked'}">
            <div class="card-icon">${isUnlocked ? config.card.icon : "🔒"}</div>
            <div class="card-title">${config.card.title}</div>
            <div class="card-formula">${isUnlocked ? config.card.formula : "Locked Scientific Principle"}</div>
            <div class="card-desc">${isUnlocked ? config.card.desc : "Discover and calibrate this in Sector " + i + "."}</div>
          </div>
        `;
      }
      cardsContainer.innerHTML = cardsHTML;
    }
  }

  /**
   * Update Profile header chips and summary labels
   */
  updateProfileUI() {
    const p = saveSystem.data.profile;
    const chipAvatar = document.getElementById('menu-chip-avatar');
    const chipName = document.getElementById('menu-chip-name');
    const chipGrade = document.getElementById('menu-chip-grade');
    const gradeSummary = document.getElementById('menu-grade-summary');
    const badgesSummary = document.getElementById('menu-badges-summary');

    if (chipAvatar) chipAvatar.textContent = p.avatar || "🧑‍🔬";
    if (chipName) chipName.textContent = p.name || "Cadet Scientist";
    if (chipGrade) chipGrade.textContent = `Grade ${p.grade}`;
    if (gradeSummary) gradeSummary.textContent = `Current: Grade ${p.grade} Curriculum`;

    const numBadges = saveSystem.data.progress.badges.length;
    const numCards = saveSystem.data.progress.cards.length;
    if (badgesSummary) badgesSummary.textContent = `${numBadges} Badges • ${numCards} Cards Unlocked`;

    // Profile form fields
    const avatarDisplay = document.getElementById('profile-avatar-display');
    const inputName = document.getElementById('input-scientist-name');
    const statXP = document.getElementById('profile-stat-xp');
    const statCoins = document.getElementById('profile-stat-coins');
    const statStars = document.getElementById('profile-stat-stars');

    if (avatarDisplay) avatarDisplay.textContent = p.avatar || "🧑‍🔬";
    if (inputName) inputName.value = p.name || "Cadet Scientist";
    if (statXP) statXP.textContent = saveSystem.data.progress.xp;
    if (statCoins) statCoins.textContent = saveSystem.data.progress.coins;

    let totalStars = 0;
    Object.values(saveSystem.data.progress.stars).forEach(s => totalStars += s);
    if (statStars) statStars.textContent = `${totalStars} / 21`;
  }

  /**
   * Start 3D Gameplay from Main Menu
   */
  startGameplay() {
    if (this.mainMenuOverlay) {
      this.mainMenuOverlay.classList.add('hidden');
    }
    gameState.setState(GameStates.PLAYING);
    this.updateHUD();
    audio.playEnergyPulse();
  }

  /**
   * Open Main Menu from gameplay
   */
  openMainMenu() {
    if (this.mainMenuOverlay) {
      this.mainMenuOverlay.classList.remove('hidden');
      this.showSubView('home');
    }
    gameState.setState(GameStates.MAIN_MENU);
  }

  /**
   * Bind DOM button events
   */
  setupEventListeners() {
    // Camera toggle button
    if (this.cameraBtn) {
      this.cameraBtn.addEventListener('click', () => {
        audio.playClick();
        const mode = this.sceneManager.cameraManager.toggleMode();
        this.cameraBtn.querySelector('.btn-text').textContent = 
          mode === "firstPerson" ? "1st Person" : "3rd Person";
        this.showToast(`Camera: ${mode === "firstPerson" ? "First-Person" : "Third-Person"} View`);
      });
    }

    // Sound toggle button
    if (this.soundBtn) {
      this.soundBtn.addEventListener('click', () => {
        saveSystem.data.settings.soundEnabled = !saveSystem.data.settings.soundEnabled;
        saveSystem.save();
        this.soundBtn.textContent = saveSystem.data.settings.soundEnabled ? "🔊" : "🔇";
        if (saveSystem.data.settings.soundEnabled) audio.playClick();
        this.showToast(`Audio: ${saveSystem.data.settings.soundEnabled ? "Enabled" : "Muted"}`);
      });
    }

    // Pause button
    if (this.pauseBtn) {
      this.pauseBtn.addEventListener('click', () => {
        audio.playClick();
        this.showPauseMenu();
      });
    }

    // Keyboard ESC for Pause
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Escape') {
        if (this.modalContainer && !this.modalContainer.classList.contains('hidden')) {
          this.closeModal();
        } else {
          this.showPauseMenu();
        }
      } else if (e.code === 'KeyV') {
        // 'V' hotkey for camera toggle
        if (this.cameraBtn) this.cameraBtn.click();
      }
    });

    // Mobile jump button
    const mobileJumpBtn = document.getElementById('btn-mobile-jump');
    if (mobileJumpBtn) {
      mobileJumpBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.sceneManager.player.jump();
      });
    }

    // Start adventure button on loading screen -> Open Main Menu
    if (this.startAdventureBtn) {
      this.startAdventureBtn.addEventListener('click', () => {
        audio.init();
        audio.playSuccess();
        this.hideLoadingScreen();
        this.openMainMenu();
      });
    }
  }

  /**
   * Virtual on-screen joystick implementation for mobile touch devices
   */
  setupMobileJoystick() {
    const base = document.getElementById('joystick-base');
    const thumb = document.getElementById('joystick-thumb');
    if (!base || !thumb) return;

    let touchId = null;
    let baseRect = null;
    let centerX = 0;
    let centerY = 0;
    const maxRadius = 40; // Max thumb travel distance

    const handleTouchStart = (e) => {
      const touch = e.changedTouches[0];
      touchId = touch.identifier;
      baseRect = base.getBoundingClientRect();
      centerX = baseRect.left + baseRect.width / 2;
      centerY = baseRect.top + baseRect.height / 2;
      handleTouchMove(e);
    };

    const handleTouchMove = (e) => {
      if (touchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchId) {
          const dx = touch.clientX - centerX;
          const dy = touch.clientY - centerY;
          const distance = Math.hypot(dx, dy);
          const angle = Math.atan2(dy, dx);

          const clampedDist = Math.min(distance, maxRadius);
          const thumbX = Math.cos(angle) * clampedDist;
          const thumbY = Math.sin(angle) * clampedDist;

          thumb.style.transform = `translate(calc(-50% + ${thumbX}px), calc(-50% + ${thumbY}px))`;

          // Map to normalized input vector (-1 to 1)
          const normX = thumbX / maxRadius;
          const normY = thumbY / maxRadius;
          this.sceneManager.player.joystickInput.set(normX, normY);
          break;
        }
      }
    };

    const handleTouchEnd = (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === touchId) {
          touchId = null;
          thumb.style.transform = 'translate(-50%, -50%)';
          this.sceneManager.player.joystickInput.set(0, 0);
          break;
        }
      }
    };

    base.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: false });
  }

  /**
   * Update top HUD status bar
   */
  updateHUD() {
    const levelId = gameState.currentLevelId;
    const labConfig = LAB_CONFIGS[levelId] || LAB_CONFIGS[0];

    if (this.labTagEl) {
      this.labTagEl.textContent = labConfig.tag;
      this.labTagEl.style.borderColor = labConfig.cssColor;
      this.labTagEl.style.color = labConfig.cssColor;
    }

    if (this.gradeBadgeEl) {
      this.gradeBadgeEl.textContent = `Grade ${saveSystem.data.profile.grade}`;
    }

    if (this.objectiveTextEl) {
      this.objectiveTextEl.textContent = gameState.activeObjective;
    }

    if (this.xpEl) {
      this.xpEl.textContent = `${saveSystem.data.progress.xp} XP`;
    }

    if (this.coinsEl) {
      this.coinsEl.textContent = `${saveSystem.data.progress.coins}`;
    }
  }

  /**
   * Display toast notification
   */
  showToast(message, type = "info") {
    if (!this.toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    this.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.35s ease';
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  }

  /**
   * Display educational Quiz Modal with immediate scientific explanation feedback
   */
  showQuizModal({ title, question, options, explanation, onCorrect, onIncorrect }) {
    gameState.setState(GameStates.MODAL_OPEN);
    audio.playScan();

    let answered = false;

    let optionsHTML = options.map((opt, idx) => `
      <button class="quiz-option-btn" data-correct="${opt.isCorrect}" data-idx="${idx}">
        <span class="opt-letter">${String.fromCharCode(65 + idx)}</span>
        <span class="opt-text">${opt.text}</span>
      </button>
    `).join('');

    this.modalCard.innerHTML = `
      <div class="modal-header">
        <h2 style="font-family: var(--font-display); color: var(--neon-cyan); font-size: 1.25rem; margin-bottom: 6px;">
          🔬 ${title || "SCIENCE CHALLENGE"}
        </h2>
        <p style="font-size: 1rem; font-weight: 600; color: #fff; margin-bottom: 16px;">
          ${question}
        </p>
      </div>

      <div class="modal-body">
        <div class="quiz-options-list" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px;">
          ${optionsHTML}
        </div>

        <div id="quiz-feedback-box" class="hidden" style="background: rgba(0,0,0,0.5); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px; border: 1px solid var(--border-subtle);">
          <div id="quiz-feedback-title" style="font-weight: 700; margin-bottom: 4px;"></div>
          <div id="quiz-feedback-desc" style="color: var(--text-secondary); font-size: 0.9rem;"></div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 10px; padding-top: 10px;">
        <button id="btn-quiz-continue" class="btn-primary hidden">Proceed ➔</button>
      </div>
    `;

    this.modalContainer.classList.remove('hidden');

    // Attach click handlers to choices
    const optionBtns = this.modalCard.querySelectorAll('.quiz-option-btn');
    const feedbackBox = this.modalCard.querySelector('#quiz-feedback-box');
    const feedbackTitle = this.modalCard.querySelector('#quiz-feedback-title');
    const feedbackDesc = this.modalCard.querySelector('#quiz-feedback-desc');
    const continueBtn = this.modalCard.querySelector('#btn-quiz-continue');

    optionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;

        const isCorrect = btn.getAttribute('data-correct') === 'true';

        optionBtns.forEach(b => {
          b.disabled = true;
          if (b.getAttribute('data-correct') === 'true') {
            b.style.borderColor = 'var(--neon-green)';
            b.style.background = 'rgba(16, 185, 129, 0.25)';
          }
        });

        if (isCorrect) {
          audio.playSuccess();
          btn.style.borderColor = 'var(--neon-green)';
          feedbackBox.style.borderColor = 'var(--neon-green)';
          feedbackTitle.style.color = 'var(--neon-green)';
          feedbackTitle.textContent = "✅ EXCELLENT! CORRECT SCIENTIFIC DEDUCTION";
          saveSystem.addXP(50);
          saveSystem.addCoins(10);
          this.updateHUD();
          this.showToast("+50 XP | +10 Research Coins", "success");
        } else {
          audio.playError();
          btn.style.borderColor = 'var(--neon-red)';
          btn.style.background = 'rgba(239, 68, 68, 0.25)';
          feedbackBox.style.borderColor = 'var(--neon-amber)';
          feedbackTitle.style.color = 'var(--neon-amber)';
          feedbackTitle.textContent = "⚠️ ANALYSIS FEEDBACK";
        }

        feedbackDesc.textContent = explanation;
        feedbackBox.classList.remove('hidden');
        continueBtn.classList.remove('hidden');

        continueBtn.addEventListener('click', () => {
          audio.playClick();
          this.closeModal();
          if (isCorrect && onCorrect) onCorrect();
          if (!isCorrect && onIncorrect) onIncorrect();
        });
      });
    });
  }

  /**
   * Display Pause Menu
   */
  showPauseMenu() {
    gameState.setState(GameStates.PAUSED);

    this.modalCard.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="font-family: var(--font-display); color: var(--neon-cyan); font-size: 1.5rem; margin-bottom: 6px;">
          ⏸️ LABORATORY PAUSED
        </h2>
        <p style="color: var(--text-secondary); font-size: 0.9rem;">
          ${saveSystem.data.profile.avatar} ${saveSystem.data.profile.name} • Grade ${saveSystem.data.profile.grade} • ${saveSystem.data.progress.xp} XP • ${saveSystem.data.progress.coins} Coins
        </p>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
        <button id="btn-resume" class="btn-primary">▶️ RESUME MISSION</button>
        <button id="btn-pause-main-menu" class="btn-secondary">🏠 RETURN TO MAIN MENU</button>
        <button id="btn-reset-save" class="btn-secondary" style="color: var(--neon-red); border-color: rgba(239,68,68,0.4);">
          🔄 RESET SAVE DATA
        </button>
      </div>

      <div style="text-align: center; font-size: 0.8rem; color: var(--text-muted);">
        Science Lab: The Lost Energy Core • Major Project Edition
      </div>
    `;

    this.modalContainer.classList.remove('hidden');

    this.modalCard.querySelector('#btn-resume').addEventListener('click', () => {
      audio.playClick();
      this.closeModal();
    });

    this.modalCard.querySelector('#btn-pause-main-menu').addEventListener('click', () => {
      audio.playClick();
      this.closeModal();
      this.openMainMenu();
    });

    this.modalCard.querySelector('#btn-reset-save').addEventListener('click', () => {
      if (confirm("Are you sure you want to reset all progress, XP, and badges?")) {
        saveSystem.reset();
        this.updateHUD();
        this.updateProfileUI();
        this.populateGradeCards();
        this.populateSectorCards();
        this.populateBadgesAndCards();
        this.closeModal();
        this.showToast("Save data has been reset to Cadet defaults.");
      }
    });
  }

  closeModal() {
    if (this.modalContainer) {
      this.modalContainer.classList.add('hidden');
    }
    gameState.setState(GameStates.PLAYING);
  }

  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.style.opacity = '0';
      setTimeout(() => this.loadingScreen.classList.add('hidden'), 600);
    }
  }

  setLoadingProgress(percent, statusText) {
    if (this.loadingProgress) {
      this.loadingProgress.style.width = `${percent}%`;
    }
    if (this.loadingStatus && statusText) {
      this.loadingStatus.textContent = statusText;
    }
    if (percent >= 100 && this.startAdventureBtn) {
      this.startAdventureBtn.classList.remove('hidden');
      if (this.loadingProgress.parentElement) {
        this.loadingProgress.parentElement.classList.add('hidden');
      }
    }
  }
}
