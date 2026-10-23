/**
 * SCIENCE LAB: The Lost Energy Core
 * Data-Driven Question Bank organized by Grade (6, 7, 8, 9, 10) and Subject
 * Each question includes educational explanations ("why") for immediate learning feedback.
 */

export const QUESTION_BANK = {
  // -------------------------------------------------------------
  // TUTORIAL & FOUNDATIONAL SCIENCE INSTRUMENTS
  // -------------------------------------------------------------
  tutorial: {
    instrument_measure: {
      id: "tut_thermometer",
      question: "Which laboratory instrument is used to accurately measure temperature?",
      options: [
        { text: "Thermometer", isCorrect: true },
        { text: "Beaker", isCorrect: false },
        { text: "Bunsen Burner", isCorrect: false },
        { text: "Graduated Cylinder", isCorrect: false }
      ],
      explanation: "A thermometer contains a temperature-sensitive fluid (or digital sensor) calibrated in Celsius or Fahrenheit to measure thermal energy."
    }
  },

  // -------------------------------------------------------------
  // GRADE 6 QUESTIONS (Fundamentals)
  // -------------------------------------------------------------
  grade6: {
    chemistry: [
      {
        id: "g6_c1",
        question: "What state of matter has a fixed volume but takes the shape of its container?",
        options: [
          { text: "Liquid", isCorrect: true },
          { text: "Solid", isCorrect: false },
          { text: "Gas", isCorrect: false },
          { text: "Plasma", isCorrect: false }
        ],
        explanation: "Liquids have particles close together with weak bonds, allowing them to flow into any container while keeping a constant volume."
      },
      {
        id: "g6_c2",
        question: "When ice absorbs heat and turns into liquid water, what process occurred?",
        options: [
          { text: "Melting", isCorrect: true },
          { text: "Freezing", isCorrect: false },
          { text: "Condensation", isCorrect: false },
          { text: "Sublimation", isCorrect: false }
        ],
        explanation: "Melting is the phase change from solid to liquid caused by adding thermal energy."
      }
    ],
    biology: [
      {
        id: "g6_b1",
        question: "Which part of a plant cell acts as the 'solar panel' to capture sunlight for photosynthesis?",
        options: [
          { text: "Chloroplast", isCorrect: true },
          { text: "Nucleus", isCorrect: false },
          { text: "Cell Wall", isCorrect: false },
          { text: "Vacuole", isCorrect: false }
        ],
        explanation: "Chloroplasts contain chlorophyll, a green pigment that traps sunlight to synthesize food."
      }
    ],
    physics: [
      {
        id: "g6_p1",
        question: "A push or a pull acting upon an object is scientifically defined as what?",
        options: [
          { text: "Force", isCorrect: true },
          { text: "Energy", isCorrect: false },
          { text: "Speed", isCorrect: false },
          { text: "Weight", isCorrect: false }
        ],
        explanation: "Force is any interaction that, when unopposed, changes the motion or shape of an object."
      }
    ],
    earth: [
      {
        id: "g6_e1",
        question: "What stage of the water cycle turns liquid surface water into airborne water vapor?",
        options: [
          { text: "Evaporation", isCorrect: true },
          { text: "Precipitation", isCorrect: false },
          { text: "Condensation", isCorrect: false },
          { text: "Runoff", isCorrect: false }
        ],
        explanation: "Solar heat warms bodies of water, causing liquid molecules to gain energy and evaporate into vapor."
      }
    ],
    energy: [
      {
        id: "g6_en1",
        question: "Which of the following materials is a good conductor of electrical current?",
        options: [
          { text: "Copper wire", isCorrect: true },
          { text: "Rubber glove", isCorrect: false },
          { text: "Dry wood", isCorrect: false },
          { text: "Plastic ruler", isCorrect: false }
        ],
        explanation: "Metals like copper have free-flowing electrons that easily conduct electrical current."
      }
    ]
  },

  // -------------------------------------------------------------
  // GRADE 7 QUESTIONS (Intermediate Foundations)
  // -------------------------------------------------------------
  grade7: {
    chemistry: [
      {
        id: "g7_c1",
        question: "What happens to the pH value when an acid is neutralized with a base?",
        options: [
          { text: "It moves closer to pH 7 (Neutral)", isCorrect: true },
          { text: "It drops to pH 0", isCorrect: false },
          { text: "It increases to pH 14", isCorrect: false },
          { text: "The pH stays unchanged", isCorrect: false }
        ],
        explanation: "Neutralization between H+ ions and OH- ions produces water and salt, bringing pH towards neutral (7)."
      }
    ],
    biology: [
      {
        id: "g7_b1",
        question: "What are the primary products generated at the end of photosynthesis?",
        options: [
          { text: "Glucose and Oxygen", isCorrect: true },
          { text: "Carbon Dioxide and Water", isCorrect: false },
          { text: "Nitrogen and Sunlight", isCorrect: false },
          { text: "Lactic Acid and ATP", isCorrect: false }
        ],
        explanation: "Plants use 6CO2 + 6H2O + Light Energy to produce C6H12O6 (glucose) + 6O2 (oxygen gas)."
      }
    ],
    physics: [
      {
        id: "g7_p1",
        question: "In a complete vacuum without air resistance, which object falls to the ground faster?",
        options: [
          { text: "Both fall at the exact same rate", isCorrect: true },
          { text: "A heavy iron anvil", isCorrect: false },
          { text: "A light bird feather", isCorrect: false },
          { text: "The object with higher surface area", isCorrect: false }
        ],
        explanation: "Gravitational acceleration (g ≈ 9.8 m/s²) is independent of mass when air resistance is eliminated."
      }
    ],
    earth: [
      {
        id: "g7_e1",
        question: "Which greenhouse gas is primarily emitted by burning fossil fuels and absorbed by forests?",
        options: [
          { text: "Carbon Dioxide (CO2)", isCorrect: true },
          { text: "Oxygen (O2)", isCorrect: false },
          { text: "Argon (Ar)", isCorrect: false },
          { text: "Helium (He)", isCorrect: false }
        ],
        explanation: "Carbon dioxide traps infrared radiation in the atmosphere, driving the greenhouse effect."
      }
    ],
    energy: [
      {
        id: "g7_en1",
        question: "What happens in a series circuit if one bulb burns out or is removed?",
        options: [
          { text: "All other bulbs in the circuit go dark", isCorrect: true },
          { text: "The other bulbs become brighter", isCorrect: false },
          { text: "Only that single bulb is affected", isCorrect: false },
          { text: "The battery explodes", isCorrect: false }
        ],
        explanation: "A series circuit provides only a single path for electric current; opening one point breaks the entire loop."
      }
    ]
  },

  // -------------------------------------------------------------
  // GRADE 8 QUESTIONS (Applied Science & Laws)
  // -------------------------------------------------------------
  grade8: {
    chemistry: [
      {
        id: "g8_c1",
        question: "Which of the following is a clear sign of a chemical reaction rather than a physical change?",
        options: [
          { text: "Formation of gas bubbles or a precipitate", isCorrect: true },
          { text: "Melting an ice cube into liquid water", isCorrect: false },
          { text: "Dissolving sugar grains into warm tea", isCorrect: false },
          { text: "Crushing a soda can into small pieces", isCorrect: false }
        ],
        explanation: "Chemical reactions involve breaking and forming molecular bonds, producing new substances evidenced by gas, color change, or precipitates."
      }
    ],
    biology: [
      {
        id: "g8_b1",
        question: "Which human organ system works directly with the circulatory system to oxygenate blood?",
        options: [
          { text: "Respiratory System (Lungs/Alveoli)", isCorrect: true },
          { text: "Digestive System (Stomach)", isCorrect: false },
          { text: "Skeletal System (Bones)", isCorrect: false },
          { text: "Endocrine System (Glands)", isCorrect: false }
        ],
        explanation: "The respiratory system exchanges oxygen and carbon dioxide through microscopic alveoli membranes into capillaries."
      }
    ],
    physics: [
      {
        id: "g8_p1",
        question: "According to Newton's Second Law of Motion, how is Force (F) related to Mass (m) and Acceleration (a)?",
        options: [
          { text: "F = m × a", isCorrect: true },
          { text: "F = m / a", isCorrect: false },
          { text: "F = m + a", isCorrect: false },
          { text: "F = a / m", isCorrect: false }
        ],
        explanation: "Newton's 2nd law states net force equals mass multiplied by the resulting acceleration."
      }
    ],
    earth: [
      {
        id: "g8_e1",
        question: "Which layer of the atmosphere contains the ozone layer that filters harmful UV radiation?",
        options: [
          { text: "Stratosphere", isCorrect: true },
          { text: "Troposphere", isCorrect: false },
          { text: "Mesosphere", isCorrect: false },
          { text: "Thermosphere", isCorrect: false }
        ],
        explanation: "The stratosphere contains high concentrations of ozone (O3) molecules that absorb solar UV-B rays."
      }
    ],
    energy: [
      {
        id: "g8_en1",
        question: "If a circuit has a voltage of 12V and a resistance of 4 Ohms, what is the electric current (I)?",
        options: [
          { text: "3 Amperes (A)", isCorrect: true },
          { text: "48 Amperes (A)", isCorrect: false },
          { text: "8 Amperes (A)", isCorrect: false },
          { text: "0.33 Amperes (A)", isCorrect: false }
        ],
        explanation: "By Ohm's Law: I = V / R = 12 / 4 = 3 Amperes."
      }
    ]
  },

  // -------------------------------------------------------------
  // GRADE 9 QUESTIONS (Advanced Principles)
  // -------------------------------------------------------------
  grade9: {
    chemistry: [
      {
        id: "g9_c1",
        question: "In the reaction: 2H2 + O2 -> 2H2O, which principle guarantees that total atomic mass is conserved?",
        options: [
          { text: "Law of Conservation of Mass", isCorrect: true },
          { text: "Avogadro's Hypothesis", isCorrect: false },
          { text: "Le Chatelier's Principle", isCorrect: false },
          { text: "Boyle's Law", isCorrect: false }
        ],
        explanation: "Lavoisier's Law of Conservation of Mass states matter cannot be created or destroyed in a closed chemical system."
      }
    ],
    biology: [
      {
        id: "g9_b1",
        question: "Which organelle generates the majority of chemical energy (ATP) through cellular respiration?",
        options: [
          { text: "Mitochondria", isCorrect: true },
          { text: "Ribosome", isCorrect: false },
          { text: "Endoplasmic Reticulum", isCorrect: false },
          { text: "Golgi Apparatus", isCorrect: false }
        ],
        explanation: "Mitochondria are the powerhouse of eukaryotic cells, converting nutrients into ATP via the Krebs cycle and electron transport chain."
      }
    ],
    physics: [
      {
        id: "g9_p1",
        question: "What is the kinetic energy (KE) of a 2 kg laboratory drone moving at 4 m/s? (Formula: KE = 0.5 * m * v²)",
        options: [
          { text: "16 Joules", isCorrect: true },
          { text: "8 Joules", isCorrect: false },
          { text: "32 Joules", isCorrect: false },
          { text: "64 Joules", isCorrect: false }
        ],
        explanation: "KE = 0.5 × 2 kg × (4 m/s)² = 1 × 16 = 16 Joules."
      }
    ],
    earth: [
      {
        id: "g9_e1",
        question: "Excessive nitrate and phosphate runoff entering freshwater lakes causes which harmful ecological phenomenon?",
        options: [
          { text: "Eutrophication (Algal blooms & oxygen depletion)", isCorrect: true },
          { text: "Acid Rain Formation", isCorrect: false },
          { text: "Thermal Inversion", isCorrect: false },
          { text: "Desertification", isCorrect: false }
        ],
        explanation: "Nutrient overload triggers rapid algae growth; decaying algae depletes dissolved oxygen, killing aquatic life."
      }
    ],
    energy: [
      {
        id: "g9_en1",
        question: "What electrical quantity is measured in Watts (W) and equals Voltage multiplied by Current (P = V × I)?",
        options: [
          { text: "Electric Power", isCorrect: true },
          { text: "Electric Charge", isCorrect: false },
          { text: "Resistance", isCorrect: false },
          { text: "Capacitance", isCorrect: false }
        ],
        explanation: "Electrical Power (P) represents the rate at which electrical energy is transferred in an electric circuit."
      }
    ]
  },

  // -------------------------------------------------------------
  // GRADE 10 QUESTIONS (Mastery & Calculations)
  // -------------------------------------------------------------
  grade10: {
    chemistry: [
      {
        id: "g10_c1",
        question: "What type of chemical reaction is represented by: 2Mg + O2 -> 2MgO + Heat & Light?",
        options: [
          { text: "Combination (Synthesis) & Exothermic Reaction", isCorrect: true },
          { text: "Decomposition & Endothermic Reaction", isCorrect: false },
          { text: "Double Displacement Reaction", isCorrect: false },
          { text: "Precipitation Neutralization", isCorrect: false }
        ],
        explanation: "Two elements combine into a single compound while releasing energy, making it a synthesis and exothermic reaction."
      }
    ],
    biology: [
      {
        id: "g10_b1",
        question: "During anaerobic respiration in human muscle cells under oxygen deficit, pyruvate is converted into what?",
        options: [
          { text: "Lactic Acid + ATP", isCorrect: true },
          { text: "Ethanol + CO2", isCorrect: false },
          { text: "Water + Glucose", isCorrect: false },
          { text: "Acetic Acid", isCorrect: false }
        ],
        explanation: "Lactic acid fermentation occurs when oxygen supply is insufficient, generating localized muscle fatigue."
      }
    ],
    physics: [
      {
        id: "g10_p1",
        question: "A beam of light traveling from air (low refractive index) into water (high refractive index) will bend in which direction?",
        options: [
          { text: "Bends towards the normal line", isCorrect: true },
          { text: "Bends away from the normal line", isCorrect: false },
          { text: "Reflects completely at 90 degrees", isCorrect: false },
          { text: "Continues in a straight line without bending", isCorrect: false }
        ],
        explanation: "By Snell's Law (n1 sin θ1 = n2 sin θ2), light slows down in denser optical media and refracts towards the normal."
      }
    ],
    earth: [
      {
        id: "g10_e1",
        question: "Which renewable energy mechanism converts solar photons directly into electricity via semiconductor band gaps?",
        options: [
          { text: "Photovoltaic (PV) Effect", isCorrect: true },
          { text: "Geothermal Thermocouple", isCorrect: false },
          { text: "Piezoelectric Resonance", isCorrect: false },
          { text: "Biomass Gasification", isCorrect: false }
        ],
        explanation: "Photons excite valence electrons in silicon semiconductors across the bandgap, creating electron-hole pairs and direct electric current."
      }
    ],
    energy: [
      {
        id: "g10_en1",
        question: "Two resistors of 6 Ω and 3 Ω are connected in PARALLEL. What is their equivalent resistance (1/Req = 1/R1 + 1/R2)?",
        options: [
          { text: "2.0 Ohms", isCorrect: true },
          { text: "9.0 Ohms", isCorrect: false },
          { text: "4.5 Ohms", isCorrect: false },
          { text: "0.5 Ohms", isCorrect: false }
        ],
        explanation: "1/Req = (1/6) + (1/3) = 1/6 + 2/6 = 3/6 = 1/2, so Req = 2.0 Ohms."
      }
    ]
  }
};

/**
 * Helper to fetch a question tailored to a specific grade and subject
 */
export function getQuestion(gradeNumber, subject, index = 0) {
  const gradeKey = `grade${gradeNumber}`;
  const gradeData = QUESTION_BANK[gradeKey] || QUESTION_BANK.grade8;
  const questionsList = gradeData[subject] || gradeData.chemistry;
  return questionsList[index % questionsList.length];
}
