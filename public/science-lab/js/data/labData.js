/**
 * SCIENCE LAB: The Lost Energy Core
 * Level & Mission Configuration, Lab Metadata, Badges, and Science Cards
 */

export const LAB_CONFIGS = {
  0: {
    id: 0,
    key: "tutorial",
    title: "Nova Lab: Central Atrium & Scanner",
    subject: "Scientific Fundamentals",
    themeColor: 0x00f0ff,
    cssColor: "var(--neon-cyan)",
    tag: "🧪 ATRIUM: ORIENTATION",
    story: "System Offline. The Central Energy Core has shut down. Calibrate your Science Scanner and learn basic lab navigation.",
    badge: {
      id: "novice_scientist",
      title: "Cadet Scientist",
      icon: "🎖️",
      desc: "Completed Nova Lab orientation and calibrated the Science Scanner."
    },
    card: {
      id: "card_scientific_method",
      title: "The Scientific Method",
      icon: "📋",
      formula: "Observe -> Hypothesize -> Experiment -> Analyze",
      desc: "The systematic empirical method for acquiring knowledge."
    }
  },
  1: {
    id: 1,
    key: "chemistry",
    title: "Chemistry Lab: Matter & Reactions",
    subject: "Chemistry",
    themeColor: 0x3b82f6,
    cssColor: "var(--neon-blue)",
    tag: "⚗️ SECTOR 1: CHEMISTRY",
    story: "Chemical synthesizers are locked. Restore matter phase transition controls and balance reactive substances to stabilize Sector 1.",
    badge: {
      id: "chem_badge",
      title: "Master Alchemist Badge",
      icon: "🧪",
      desc: "Successfully balanced chemical reactions and phase shifts."
    },
    card: {
      id: "card_conservation_mass",
      title: "Conservation of Mass",
      icon: "⚖️",
      formula: "Mass(Reactants) = Mass(Products)",
      desc: "Matter cannot be created or destroyed in any chemical reaction."
    }
  },
  2: {
    id: 2,
    key: "biology",
    title: "Biology Lab: Life Systems & Ecosystems",
    subject: "Biology",
    themeColor: 0x10b981,
    cssColor: "var(--neon-green)",
    tag: "🌿 SECTOR 2: BIOLOGY",
    story: "Hydroponics and greenhouse oxygen synthesis chambers have depleted. Rebalance photosynthesis and biological support units.",
    badge: {
      id: "bio_badge",
      title: "Bio-Synthesizer Badge",
      icon: "🌱",
      desc: "Restored botanical photosynthesis and life-support vital organs."
    },
    card: {
      id: "card_photosynthesis",
      title: "Photosynthesis Formula",
      icon: "☀️",
      formula: "6CO2 + 6H2O + Light -> C6H12O6 + 6O2",
      desc: "The biological engine converting solar light into organic chemical fuel."
    }
  },
  3: {
    id: 3,
    key: "physics",
    title: "Physics Lab: Dynamics, Gravity & Motion",
    subject: "Physics",
    themeColor: 0xf59e0b,
    cssColor: "var(--neon-amber)",
    tag: "⚙️ SECTOR 3: PHYSICS",
    story: "Artificial gravity generators are fluctuating. Calibrate inertia, mass-acceleration vectors, and structural bridge mechanics.",
    badge: {
      id: "phys_badge",
      title: "Quantum Mechanic Badge",
      icon: "⚡",
      desc: "Overcame gravitational perturbations and mastered Newtonian dynamics."
    },
    card: {
      id: "card_newton_second",
      title: "Newton's 2nd Law of Motion",
      icon: "🏎️",
      formula: "F = m × a  (Force = Mass × Acceleration)",
      desc: "The acceleration of an object is directly proportional to net force."
    }
  },
  4: {
    id: 4,
    key: "earth",
    title: "Earth Lab: Ecological Systems & Cycles",
    subject: "Earth & Environment",
    themeColor: 0x059669,
    cssColor: "var(--neon-emerald)",
    tag: "🌍 SECTOR 4: EARTH SCIENCE",
    story: "Atmospheric scrubbers and clean hydrological filters are clogged. Restore the water cycle and neutralize eco-pollutants.",
    badge: {
      id: "earth_badge",
      title: "Earth Guardian Badge",
      icon: "🛡️",
      desc: "Purified planetary water cycles and engineered waste recycling systems."
    },
    card: {
      id: "card_hydrologic_cycle",
      title: "The Hydrologic Cycle",
      icon: "🌧️",
      formula: "Evaporation -> Condensation -> Precipitation -> Collection",
      desc: "Continuous circulation of water throughout Earth's hydrosphere and atmosphere."
    }
  },
  5: {
    id: 5,
    key: "energy",
    title: "Energy Lab: Electricity & Circuitry",
    subject: "Energy & Electricity",
    themeColor: 0xeab308,
    cssColor: "var(--neon-yellow)",
    tag: "💡 SECTOR 5: ELECTRICAL GRID",
    story: "Substation transformers are broken. Connect closed circuits, isolate conductive pathways, and tune electrical resistance.",
    badge: {
      id: "energy_badge",
      title: "Energy Engineer Badge",
      icon: "🔋",
      desc: "Rebuilt substation circuits and tuned high-voltage Ohm power grids."
    },
    card: {
      id: "card_ohms_law",
      title: "Ohm's Law",
      icon: "⚡",
      formula: "V = I × R  (Voltage = Current × Resistance)",
      desc: "Fundamental relationship between voltage, current, and electrical resistance."
    }
  },
  6: {
    id: 6,
    key: "core",
    title: "The Energy Core: Central Reactor",
    subject: "Master Science Integration",
    themeColor: 0xa855f7,
    cssColor: "var(--neon-purple)",
    tag: "⚛️ CENTRAL REACTOR: CORE",
    story: "CRITICAL ALERT: Core meltdown imminent in 3 minutes! Coordinate all 5 science stations to stabilize the central reactor!",
    badge: {
      id: "master_scientist_badge",
      title: "MASTER SCIENTIST OF NOVA LAB",
      icon: "👑",
      desc: "Successfully saved Nova Laboratory and restored the central Energy Core."
    },
    card: {
      id: "card_energy_conservation",
      title: "Conservation of Total Energy",
      icon: "🌌",
      formula: "E_initial = E_final  (Energy is Never Created or Destroyed)",
      desc: "The universal law governing all thermodynamic, electrical, and physical systems."
    }
  }
};
