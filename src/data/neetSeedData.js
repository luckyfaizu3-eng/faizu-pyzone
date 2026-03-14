// src/data/neetSeedData.js
export const neetSeedData = [
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 1,
    "chapterName": "Some Basic Concepts of Chemistry",
    "topic": "Mole Concept & Stoichiometry",
    "question": "A sample of CaCO₃ (80% pure) is heated strongly. The mass of CO₂ liberated from 25 g of this sample is: (Molar mass: CaCO₃ = 100, CO₂ = 44)",
    "options": [
      "8.8 g",
      "11.0 g",
      "4.4 g",
      "22.0 g"
    ],
    "correct": 0,
    "explanation": "Pure CaCO₃ in 25 g sample = 25 × 0.80 = 20 g. Moles of CaCO₃ = 20/100 = 0.2 mol. CaCO₃ → CaO + CO₂ (1:1 ratio). Moles of CO₂ = 0.2 mol. Mass of CO₂ = 0.2 × 44 = 8.8 g."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 1,
    "chapterName": "Some Basic Concepts of Chemistry",
    "topic": "Empirical & Molecular Formula",
    "question": "A compound contains 40% C, 6.67% H and 53.33% O by mass. If its vapour density is 30, its molecular formula is:",
    "options": [
      "CH₂O",
      "C₂H₄O₂",
      "C₃H₆O₃",
      "CH₄O"
    ],
    "correct": 1,
    "explanation": "Mole ratio: C = 40/12 = 3.33, H = 6.67/1 = 6.67, O = 53.33/16 = 3.33. Simplest ratio C:H:O = 1:2:1. Empirical formula = CH₂O. Empirical formula mass = 30. Molecular mass = 2 × VD = 2 × 30 = 60. n = 60/30 = 2. Molecular formula = C₂H₄O₂ (acetic acid)."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 2,
    "chapterName": "Structure of Atom",
    "topic": "Quantum Numbers & Electronic Configuration",
    "question": "The set of quantum numbers NOT possible for an electron in an atom is:",
    "options": [
      "n=3, l=2, m=−2, s=+½",
      "n=2, l=1, m=0, s=−½",
      "n=4, l=3, m=+4, s=+½",
      "n=1, l=0, m=0, s=−½"
    ],
    "correct": 2,
    "explanation": "For l=3, m can range from −3 to +3. m=+4 is not allowed when l=3. The maximum value of m = l = 3. Therefore n=4, l=3, m=+4, s=+½ is NOT a possible set of quantum numbers."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 2,
    "chapterName": "Structure of Atom",
    "topic": "Photoelectric Effect & Bohr Model",
    "question": "The energy of an electron in the second Bohr orbit of hydrogen atom is −3.4 eV. The energy of the electron in the Bohr orbit with n=4 is:",
    "options": [
      "−13.6 eV",
      "−0.85 eV",
      "−1.70 eV",
      "−6.8 eV"
    ],
    "correct": 1,
    "explanation": "Energy in nth orbit of H: Eₙ = E₁/n². E₂ = −3.4 eV, so E₁ = −3.4 × 4 = −13.6 eV. E₄ = E₁/16 = −13.6/16 = −0.85 eV."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 3,
    "chapterName": "Classification of Elements and Periodicity in Properties",
    "topic": "Periodic Trends — Ionization Enthalpy",
    "question": "Which of the following has the highest second ionization enthalpy?",
    "options": [
      "Na",
      "Mg",
      "Al",
      "Si"
    ],
    "correct": 0,
    "explanation": "Na (1s²2s²2p⁶3s¹) has electronic configuration of noble gas after losing one electron. The second ionization requires removing an electron from a completely filled noble gas configuration (2p⁶), which needs very high energy. Hence Na has the highest second ionization enthalpy among these elements."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 3,
    "chapterName": "Classification of Elements and Periodicity in Properties",
    "topic": "Periodic Trends — Electronegativity & Atomic Radius",
    "question": "Arrange F, Cl, Br, I in increasing order of electron gain enthalpy (most negative last):",
    "options": [
      "I < Br < F < Cl",
      "F < I < Br < Cl",
      "I < F < Br < Cl",
      "Br < I < F < Cl"
    ],
    "correct": 0,
    "explanation": "Electron gain enthalpy generally increases up the group, but F is anomalous — its small size causes high electron-electron repulsion in the compact 2p subshell, making its electron gain enthalpy less negative than Cl. Correct order (least to most negative): I < Br < F < Cl."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Chemical Bonding and Molecular Structure",
    "topic": "VSEPR Theory & Molecular Geometry",
    "question": "Which pair of molecules has the SAME molecular geometry (shape)?",
    "options": [
      "NH₃ and BF₃",
      "H₂O and SO₂",
      "CO₂ and H₂O",
      "CH₄ and NH₃"
    ],
    "correct": 1,
    "explanation": "H₂O is bent/V-shaped (sp³, 2 bond pairs + 2 lone pairs, bond angle ~104.5°). SO₂ is also bent/V-shaped (sp³ effective, 2 bond pairs + 1 lone pair on S, bond angle ~119°). Both have angular/bent molecular geometry. NH₃ is trigonal pyramidal ≠ BF₃ (trigonal planar). CO₂ is linear ≠ H₂O (bent). CH₄ is tetrahedral ≠ NH₃ (trigonal pyramidal). Correct pair: H₂O and SO₂ — both bent."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Chemical Bonding and Molecular Structure",
    "topic": "Bond Order & Magnetic Properties (MOT)",
    "question": "According to Molecular Orbital Theory, which of the following species is paramagnetic and has the highest bond order?",
    "options": [
      "O₂²⁻",
      "O₂⁻",
      "O₂",
      "O₂⁺"
    ],
    "correct": 3,
    "explanation": "Bond orders: O₂²⁻ = 1 (diamagnetic), O₂⁻ = 1.5 (paramagnetic), O₂ = 2 (paramagnetic), O₂⁺ = 2.5 (paramagnetic). O₂⁺ has the highest bond order (2.5) and is paramagnetic due to one unpaired electron in a π* orbital."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Chemical Bonding and Molecular Structure",
    "topic": "Hydrogen Bonding & Intermolecular Forces",
    "question": "The correct order of boiling points of NH₃, H₂O, HF and CH₄ is:",
    "options": [
      "H₂O > HF > NH₃ > CH₄",
      "HF > H₂O > NH₃ > CH₄",
      "H₂O > NH₃ > HF > CH₄",
      "NH₃ > HF > H₂O > CH₄"
    ],
    "correct": 0,
    "explanation": "H₂O forms the strongest intermolecular hydrogen bonds (two O–H···O bonds per molecule due to two lone pairs and two O-H bonds). HF has strong H-bonding but only one H per molecule limits network. NH₃ has weaker H-bonds (N less electronegative than O/F). CH₄ has only weak van der Waals forces. Order: H₂O (100°C) > HF (19.5°C) > NH₃ (−33°C) > CH₄ (−161°C)."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 5,
    "chapterName": "States of Matter",
    "topic": "Real Gases & van der Waals Equation",
    "question": "For a real gas, the van der Waals constant 'a' represents:",
    "options": [
      "The actual volume of gas molecules",
      "The intermolecular attractive forces",
      "The compressibility factor",
      "The mean free path of molecules"
    ],
    "correct": 1,
    "explanation": "In the van der Waals equation (P + an²/V²)(V − nb) = nRT, the term 'a' accounts for intermolecular attractive forces that reduce the observed pressure. Constant 'b' accounts for the excluded volume (actual volume of molecules). Higher the value of 'a', stronger the intermolecular attraction."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Thermodynamics",
    "topic": "Hess's Law & Enthalpy Calculations",
    "question": "Given: C(s) + O₂(g) → CO₂(g), ΔH = −393 kJ/mol; H₂(g) + ½O₂(g) → H₂O(l), ΔH = −286 kJ/mol; C₂H₅OH(l) + 3O₂(g) → 2CO₂(g) + 3H₂O(l), ΔH = −1368 kJ/mol. The enthalpy of formation of C₂H₅OH(l) is:",
    "options": [
      "−277 kJ/mol",
      "+277 kJ/mol",
      "−689 kJ/mol",
      "−1368 kJ/mol"
    ],
    "correct": 0,
    "explanation": "Formation reaction: 2C(s) + 3H₂(g) + ½O₂(g) → C₂H₅OH(l). Using Hess's law: ΔHf = 2×(−393) + 3×(−286) − (−1368) = −786 − 858 + 1368 = −276 ≈ −277 kJ/mol."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Thermodynamics",
    "topic": "Entropy & Gibbs Free Energy",
    "question": "A reaction has ΔH = +40 kJ/mol and ΔS = +100 J/mol·K. The reaction will be spontaneous at:",
    "options": [
      "All temperatures",
      "Below 400 K",
      "Above 400 K",
      "No temperature"
    ],
    "correct": 2,
    "explanation": "ΔG = ΔH − TΔS. For spontaneity, ΔG < 0. Since ΔH > 0 and ΔS > 0, ΔG becomes negative when TΔS > ΔH, i.e., T > ΔH/ΔS = 40000/100 = 400 K. So the reaction is spontaneous above 400 K."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 7,
    "chapterName": "Equilibrium",
    "topic": "Le Chatelier's Principle & Kc/Kp",
    "question": "For the reaction N₂(g) + 3H₂(g) ⇌ 2NH₃(g), if the pressure is doubled at constant temperature, the equilibrium will:",
    "options": [
      "Shift to the right and Kp will change",
      "Shift to the right and Kp will remain same",
      "Shift to the left and Kp will change",
      "Not shift and Kp will change"
    ],
    "correct": 1,
    "explanation": "Increasing pressure shifts equilibrium toward the side with fewer moles of gas. Left side: 1+3=4 moles; right side: 2 moles. Equilibrium shifts right (toward NH₃). However, Kp (equilibrium constant) depends only on temperature — it remains unchanged. At constant temperature, only Q changes and system readjusts to restore Kp."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 7,
    "chapterName": "Equilibrium",
    "topic": "Ionic Equilibrium — Buffer & Hydrolysis",
    "question": "The pH of a buffer solution containing 0.1 M CH₃COOH and 0.1 M CH₃COONa (pKa of CH₃COOH = 4.74) is:",
    "options": [
      "9.26",
      "4.74",
      "7.00",
      "2.87"
    ],
    "correct": 1,
    "explanation": "Using Henderson–Hasselbalch equation: pH = pKa + log([A⁻]/[HA]) = 4.74 + log(0.1/0.1) = 4.74 + log(1) = 4.74 + 0 = 4.74. When [salt] = [acid], pH = pKa."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 8,
    "chapterName": "Redox Reactions",
    "topic": "Oxidation State & Balancing Redox",
    "question": "The oxidation state of Cr in K₂Cr₂O₇ and CrO₅ respectively are:",
    "options": [
      "+6 and +6",
      "+6 and +10",
      "+3 and +6",
      "+6 and +4"
    ],
    "correct": 0,
    "explanation": "In K₂Cr₂O₇: 2(+1) + 2x + 7(−2) = 0 → 2x = +12 → x = +6. In CrO₅: the structure has one Cr=O (normal) and two peroxo O–O groups (each O in peroxo = −1). So: x + 1(−2) + 2×2(−1) = 0 → x − 2 − 4 = 0 → x = +6. Both are +6."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 9,
    "chapterName": "Hydrogen",
    "topic": "Hydrogen Peroxide — Properties & Structure",
    "question": "Hydrogen peroxide acts as both oxidizing and reducing agent. In its reaction with acidified KMnO₄, H₂O₂ acts as a:",
    "options": [
      "Reducing agent and MnO₄⁻ is reduced to Mn²⁺",
      "Oxidizing agent and MnO₄⁻ is oxidized to MnO₄",
      "Reducing agent and MnO₄⁻ is oxidized",
      "Neither oxidizing nor reducing agent"
    ],
    "correct": 0,
    "explanation": "In the reaction with acidified KMnO₄: 2KMnO₄ + 5H₂O₂ + 3H₂SO₄ → 2MnSO₄ + K₂SO₄ + 5O₂ + 8H₂O. MnO₄⁻ (Mn = +7) is reduced to Mn²⁺ (+2), so KMnO₄ is the oxidizing agent. H₂O₂ (O = −1) is oxidized to O₂ (O = 0), so H₂O₂ acts as the reducing agent."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 10,
    "chapterName": "The s-Block Elements",
    "topic": "Anomalous Properties of Li & Be",
    "question": "Which of the following statements about lithium is INCORRECT?",
    "options": [
      "Li forms Li₂O₂ (peroxide) on burning in excess oxygen, like sodium",
      "Li has the highest hydration enthalpy among alkali metals",
      "LiCl is more covalent than NaCl",
      "Li shows a diagonal relationship with Mg"
    ],
    "correct": 0,
    "explanation": "Option A is INCORRECT: Unlike Na (which forms Na₂O₂ peroxide) and K/Rb/Cs (which form superoxides MO₂), lithium burns in excess oxygen to form only the normal oxide Li₂O — NOT the peroxide Li₂O₂. This is the anomalous behavior of Li. Options B, C, D are correct: Li⁺ has the highest charge density → highest hydration enthalpy (520 kJ/mol); LiCl is predominantly covalent due to high polarizing power of Li⁺; Li resembles Mg in solubility of carbonates, bicarbonates, hydroxides (diagonal relationship)."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 11,
    "chapterName": "The p-Block Elements (Groups 13 and 14)",
    "topic": "Allotropes of Carbon & Boron Hydrides",
    "question": "In diborane (B₂H₆), the number of 3-centre 2-electron (3c-2e) bonds and normal 2-centre 2-electron (2c-2e) bonds are respectively:",
    "options": [
      "2 and 4",
      "4 and 2",
      "2 and 2",
      "3 and 2"
    ],
    "correct": 0,
    "explanation": "In B₂H₆, there are two bridging H atoms, each forming a 3-centre 2-electron bond (banana bond) involving B–H–B. There are 4 terminal B–H bonds that are normal 2c-2e bonds (each B has 2 terminal H atoms). Total: 2 three-centre bonds and 4 two-centre bonds."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 12,
    "chapterName": "Organic Chemistry — Some Basic Principles and Techniques",
    "topic": "Inductive Effect & Hyperconjugation",
    "question": "The correct order of stability of carbocations is:",
    "options": [
      "(CH₃)₃C⁺ > (CH₃)₂CH⁺ > CH₃CH₂⁺ > CH₃⁺",
      "CH₃⁺ > CH₃CH₂⁺ > (CH₃)₂CH⁺ > (CH₃)₃C⁺",
      "(CH₃)₃C⁺ > CH₃CH₂⁺ > (CH₃)₂CH⁺ > CH₃⁺",
      "(CH₃)₂CH⁺ > (CH₃)₃C⁺ > CH₃CH₂⁺ > CH₃⁺"
    ],
    "correct": 0,
    "explanation": "Carbocation stability increases with increasing alkyl substitution due to +I (inductive) effect and hyperconjugation (more α-H atoms stabilize via hyperconjugation). Tertiary (3°) > Secondary (2°) > Primary (1°) > Methyl: (CH₃)₃C⁺ > (CH₃)₂CH⁺ > CH₃CH₂⁺ > CH₃⁺."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 12,
    "chapterName": "Organic Chemistry — Some Basic Principles and Techniques",
    "topic": "Isomerism — Structural & Stereoisomerism",
    "question": "Which of the following compounds shows geometrical isomerism?",
    "options": [
      "2-butyne",
      "2-butene",
      "Propene",
      "But-1-ene"
    ],
    "correct": 1,
    "explanation": "Geometrical isomerism (cis-trans) requires a C=C double bond where each carbon has two different substituents. 2-butene (CH₃–CH=CH–CH₃) has each sp² carbon bearing CH₃ and H — different groups on each carbon, so cis and trans isomers exist. 2-butyne has a triple bond (no GI). Propene (CH₃–CH=CH₂) has CH₂ (=CH₂) end with two H atoms, so no GI. But-1-ene (CH₂=CHCH₂CH₃) has =CH₂ with two H — no GI."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 13,
    "chapterName": "Hydrocarbons",
    "topic": "Reactions of Alkenes & Alkynes",
    "question": "When propene reacts with HBr in the presence of peroxide, the major product is:",
    "options": [
      "1-bromopropane",
      "2-bromopropane",
      "Allyl bromide (3-bromopropene)",
      "Propyl bromide"
    ],
    "correct": 0,
    "explanation": "In the presence of peroxide (anti-Markovnikov addition — free radical mechanism), HBr adds to propene such that Br adds to the less substituted carbon (terminal carbon). This is anti-Markovnikov: Br goes to C1, giving 1-bromopropane (CH₃CH₂CH₂Br). Without peroxide (ionic mechanism, Markovnikov), Br would add to C2 giving 2-bromopropane."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 13,
    "chapterName": "Hydrocarbons",
    "topic": "Aromaticity & Electrophilic Aromatic Substitution",
    "question": "Which of the following is NOT an aromatic compound?",
    "options": [
      "Benzene",
      "Pyridine",
      "Cyclopentadiene",
      "Azulene"
    ],
    "correct": 2,
    "explanation": "Hückel's rule: aromatic compounds have (4n+2) π electrons in a planar cyclic conjugated system. Benzene: 6π ✓; Pyridine: 6π ✓; Azulene (fused 7+5 ring): 10π ✓. Cyclopentadiene has 4π electrons (sp³ carbon interrupts conjugation — it's NOT fully conjugated/aromatic). Cyclopentadienyl anion (6π) is aromatic, but cyclopentadiene itself is not."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 14,
    "chapterName": "Environmental Chemistry",
    "topic": "Air & Water Pollution",
    "question": "BOD (Biochemical Oxygen Demand) of a water sample is a measure of:",
    "options": [
      "Total dissolved oxygen in water",
      "Amount of oxygen required by microorganisms to decompose organic matter",
      "Oxygen required to oxidize inorganic pollutants",
      "Dissolved CO₂ in water"
    ],
    "correct": 1,
    "explanation": "BOD is the amount of oxygen (in mg/L) consumed by biological activity (primarily aerobic decomposition of organic matter by microorganisms) when a sample is incubated at 20°C for 5 days. Higher BOD indicates greater organic pollution. Clean water has BOD < 5 mg/L; heavily polluted water > 17 mg/L."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 1,
    "chapterName": "The Solid State",
    "topic": "Unit Cell & Packing Efficiency",
    "question": "A metal crystallizes in FCC lattice. The edge length of the unit cell is 4.07 Å. The radius of the metal atom is approximately:",
    "options": [
      "1.44 Å",
      "2.03 Å",
      "1.17 Å",
      "2.88 Å"
    ],
    "correct": 0,
    "explanation": "In FCC, atoms touch along the face diagonal: 4r = √2 × a. Therefore r = (√2 × a)/4 = (1.414 × 4.07)/4 = 5.755/4 ≈ 1.44 Å. This is approximately the atomic radius of gold (1.44 Å)."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 1,
    "chapterName": "The Solid State",
    "topic": "Defects in Solids",
    "question": "AgCl doped with CdCl₂ creates which type of defect and what happens to the density?",
    "options": [
      "Interstitial defect; density increases",
      "Schottky defect; density decreases",
      "Frenkel defect; density unchanged",
      "Impurity defect (substitutional); density decreases"
    ],
    "correct": 3,
    "explanation": "When CdCl₂ is doped into AgCl, each Cd²⁺ replaces two Ag⁺ ions to maintain electrical neutrality. One Cd²⁺ occupies one Ag⁺ site and one Ag⁺ vacancy is created. This is an impurity (substitutional) defect. Since one Cd²⁺ replaces two Ag⁺ (net loss of one cation per doped unit), the density decreases."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Solutions",
    "topic": "Colligative Properties — Osmotic Pressure",
    "question": "The osmotic pressure of 0.1 M solution of glucose at 27°C is: (R = 0.082 L·atm/mol·K)",
    "options": [
      "0.82 atm",
      "2.46 atm",
      "0.27 atm",
      "8.2 atm"
    ],
    "correct": 1,
    "explanation": "Osmotic pressure: π = CRT. C = 0.1 mol/L, R = 0.082 L·atm/mol·K, T = 27 + 273 = 300 K. π = 0.1 × 0.082 × 300 = 2.46 atm. Common mistake: forgetting to convert °C to K (using T=27 gives 0.221 atm). Glucose is a non-electrolyte (i=1), so no van't Hoff factor needed."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Solutions",
    "topic": "Raoult's Law & Vapour Pressure Lowering",
    "question": "18 g of glucose (M = 180 g/mol) is dissolved in 18 g of water (M = 18 g/mol). The relative lowering of vapour pressure of water is:",
    "options": [
      "1/100",
      "1/10",
      "1/11",
      "1/9"
    ],
    "correct": 2,
    "explanation": "Moles of glucose = 18/180 = 0.1 mol. Moles of water = 18/18 = 1.0 mol. By Raoult's law: ΔP/P° = χ_solute = n_solute/(n_solute + n_solvent) = 0.1/(0.1 + 1.0) = 0.1/1.1 = 1/11. This is the exact mole fraction of glucose (solute), which equals the relative lowering of vapour pressure. Answer: 1/11."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Electrochemistry",
    "topic": "Nernst Equation & Cell EMF",
    "question": "For the cell Zn|Zn²⁺(0.001M)||Cu²⁺(0.1M)|Cu, the cell potential at 25°C is: [E°cell = 1.10 V]",
    "options": [
      "1.10 V",
      "1.16 V",
      "1.04 V",
      "0.98 V"
    ],
    "correct": 1,
    "explanation": "Nernst equation: Ecell = E°cell − (0.0591/n) × log[Zn²⁺]/[Cu²⁺]. n = 2. Ecell = 1.10 − (0.0591/2) × log(0.001/0.1) = 1.10 − 0.02955 × log(0.01) = 1.10 − 0.02955 × (−2) = 1.10 + 0.0591 = 1.16 V."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Chemical Kinetics",
    "topic": "First Order Reactions & Half-life",
    "question": "A radioactive substance has a half-life of 10 years. The fraction remaining after 40 years is:",
    "options": [
      "1/16",
      "1/8",
      "1/4",
      "1/32"
    ],
    "correct": 0,
    "explanation": "Number of half-lives = 40/10 = 4. Fraction remaining = (1/2)⁴ = 1/16. After each half-life, half the remaining substance decays, so after 4 half-lives: 1→½→¼→⅛→1/16."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Chemical Kinetics",
    "topic": "Activation Energy & Arrhenius Equation",
    "question": "For a reaction, rate constants at 300 K and 400 K are k₁ and k₂ respectively, with k₂/k₁ = e¹⁰. The activation energy of the reaction is approximately: (R = 8.314 J/mol·K)",
    "options": [
      "24.9 kJ/mol",
      "99.8 kJ/mol",
      "8.314 kJ/mol",
      "199.6 kJ/mol"
    ],
    "correct": 1,
    "explanation": "Arrhenius equation: ln(k₂/k₁) = (Ea/R) × (1/T₁ − 1/T₂). ln(e¹⁰) = 10. 1/T₁ − 1/T₂ = 1/300 − 1/400 = (4−3)/1200 = 1/1200. So: 10 = (Ea/8.314) × (1/1200). Ea = 10 × 8.314 × 1200 = 99,768 J/mol ≈ 99.8 kJ/mol ≈ 100 kJ/mol. Common trap: students forget to calculate (1/T₁−1/T₂) correctly and just use 1/T₁ alone, getting 24.9 kJ/mol — that is WRONG."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Surface Chemistry",
    "topic": "Adsorption & Catalysis",
    "question": "Freundlich adsorption isotherm is given by x/m = kP^(1/n). At very high pressure, the adsorption becomes:",
    "options": [
      "Proportional to P (linear)",
      "Independent of P (constant)",
      "Proportional to P^(1/2)",
      "Inversely proportional to P"
    ],
    "correct": 1,
    "explanation": "In Freundlich isotherm, x/m = kP^(1/n) where 1/n ranges from 0 to 1. At very high pressures, the surface becomes saturated with adsorbate — all available sites are occupied. Further increase in pressure does not increase adsorption. This is the Langmuir saturation behavior, so adsorption becomes independent of pressure at very high pressures."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "General Principles and Processes of Isolation of Elements",
    "topic": "Thermodynamics of Metallurgy — Ellingham Diagram",
    "question": "In the Ellingham diagram, the curve for C + O₂ → CO₂ is nearly horizontal while C + ½O₂ → CO has a negative slope. This is because:",
    "options": [
      "CO₂ formation is exothermic, CO is endothermic",
      "CO₂ formation involves equal moles of gases; CO formation increases entropy",
      "CO has higher bond energy than CO₂",
      "CO is thermodynamically less stable than CO₂"
    ],
    "correct": 1,
    "explanation": "In C + O₂ → CO₂: Δn(gas) = 0 (1 mol gas → 1 mol gas), so ΔS ≈ 0, and ΔG° = ΔH − TΔS doesn't change much with T (nearly horizontal). In 2C + O₂ → 2CO: Δn(gas) = +1 (1 mol → 2 mol), ΔS > 0, so ΔG° = ΔH − TΔS becomes more negative as T increases (negative slope). This makes C a better reducing agent at high temperatures."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 7,
    "chapterName": "The p-Block Elements (Groups 15 to 18)",
    "topic": "Oxoacids of Phosphorus & Nitrogen",
    "question": "H₃PO₃ (phosphorous acid) is a diprotic acid because:",
    "options": [
      "It has three OH groups",
      "One H is directly bonded to P (non-ionizable) and two are bonded as P–OH",
      "It forms two types of phosphate salts",
      "It has two lone pairs on P"
    ],
    "correct": 1,
    "explanation": "In H₃PO₃, the structure has one P=O, one P–H (direct bond, non-ionizable), and two P–OH groups. Only P–OH hydrogens are acidic. The P–H bond is not broken in acidic dissociation. Therefore H₃PO₃ is a diprotic (dibasic) acid, providing only 2 H⁺ ions, despite the molecular formula suggesting triprotic."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 8,
    "chapterName": "The d- and f-Block Elements",
    "topic": "Transition Elements — Magnetic Properties",
    "question": "Which of the following transition metal ions has the highest number of unpaired electrons?",
    "options": [
      "Fe²⁺ (Z=26)",
      "Mn²⁺ (Z=25)",
      "Cr³⁺ (Z=24)",
      "Cu²⁺ (Z=29)"
    ],
    "correct": 1,
    "explanation": "Electronic configurations: Fe²⁺: [Ar]3d⁶ → 4 unpaired e⁻ (t₂g⁴ eg²); Mn²⁺: [Ar]3d⁵ → 5 unpaired e⁻ (all singly occupied); Cr³⁺: [Ar]3d³ → 3 unpaired e⁻; Cu²⁺: [Ar]3d⁹ → 1 unpaired e⁻. Mn²⁺ has 5 unpaired electrons (half-filled d-subshell), which is the maximum."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 9,
    "chapterName": "Coordination Compounds",
    "topic": "IUPAC Nomenclature & Isomerism",
    "question": "The complex [Co(en)₂Cl₂]⁺ (where en = ethylenediamine) shows which type of isomerism?",
    "options": [
      "Ionisation isomerism only",
      "Optical isomerism only",
      "Both geometrical and optical isomerism",
      "Linkage isomerism only"
    ],
    "correct": 2,
    "explanation": "[Co(en)₂Cl₂]⁺ is an octahedral complex with two bidentate en ligands and two Cl⁻. The two Cl⁻ can be cis (same side) or trans (opposite sides) — giving geometric isomers. The cis form has no plane of symmetry and exists as d- and l- (optical) isomers. The trans form is superimposable on its mirror image (has a plane of symmetry), so it is optically inactive. Therefore both geometric and optical isomerism are shown."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 10,
    "chapterName": "Haloalkanes and Haloarenes",
    "topic": "SN1 vs SN2 Mechanisms",
    "question": "Which of the following will undergo SN1 reaction most readily?",
    "options": [
      "(CH₃)₃CBr",
      "CH₃Br",
      "(CH₃)₂CHBr",
      "CH₃CH₂Br"
    ],
    "correct": 0,
    "explanation": "SN1 rate depends on stability of the carbocation intermediate. Tertiary carbocations are most stable (3° > 2° > 1° > methyl) due to inductive and hyperconjugative stabilization by alkyl groups. (CH₃)₃CBr forms a stable tertiary carbocation (CH₃)₃C⁺ → fastest SN1. CH₃Br would form an unstable methyl carbocation → very slow/no SN1."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 11,
    "chapterName": "Alcohols, Phenols and Ethers",
    "topic": "Acidity of Alcohols & Phenols",
    "question": "The correct order of acidity is:",
    "options": [
      "Phenol > Ethanol > Water > tert-Butanol",
      "Water > Phenol > Ethanol > tert-Butanol",
      "Phenol > Water > Ethanol > tert-Butanol",
      "tert-Butanol > Ethanol > Water > Phenol"
    ],
    "correct": 2,
    "explanation": "Phenol is more acidic than water because the phenoxide ion (C₆H₅O⁻) is stabilized by resonance delocalization into the aromatic ring. Water is more acidic than alcohols because alkyl groups (electron-donating +I effect) destabilize the alkoxide ion. Among alcohols, more alkyl groups = less acidic: tert-butanol < isopropanol < ethanol. Order: Phenol > Water > Ethanol > tert-Butanol."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 12,
    "chapterName": "Aldehydes, Ketones and Carboxylic Acids",
    "topic": "Nucleophilic Addition & Aldol Condensation",
    "question": "Which of the following compounds does NOT give aldol condensation?",
    "options": [
      "CH₃CHO",
      "CH₃COCH₃",
      "HCHO",
      "C₆H₅CHO"
    ],
    "correct": 2,
    "explanation": "Aldol condensation requires α-hydrogen atoms (H atoms on the carbon adjacent to C=O). HCHO (formaldehyde) has no α-carbon (no carbon adjacent to the carbonyl carbon other than the carbonyl carbon itself) — it has no α-H. Hence HCHO cannot undergo aldol condensation. CH₃CHO, CH₃COCH₃ have α-H atoms; C₆H₅CHO has no α-H but can undergo crossed aldol (Claisen-Schmidt). HCHO is the answer."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 13,
    "chapterName": "Amines",
    "topic": "Basicity of Amines & Diazonium Salts",
    "question": "The correct order of basicity of methylamine, dimethylamine, trimethylamine, and ammonia in aqueous solution is:",
    "options": [
      "Me₃N > Me₂NH > MeNH₂ > NH₃",
      "Me₂NH > MeNH₂ > Me₃N > NH₃",
      "MeNH₂ > Me₂NH > Me₃N > NH₃",
      "NH₃ > MeNH₂ > Me₂NH > Me₃N"
    ],
    "correct": 1,
    "explanation": "In aqueous solution, basicity depends on: (1) +I effect of methyl groups increasing electron density on N, and (2) solvation of the conjugate acid. Dimethylammonium ion (Me₂NH₂⁺) is better solvated than trimethylammonium (Me₃NH⁺) which has less H available for H-bonding. In water: Me₂NH > MeNH₂ > Me₃N > NH₃. Trimethylamine has all methyl groups blocking solvation despite highest +I effect."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 13,
    "chapterName": "Amines",
    "topic": "Gabriel Synthesis & Hofmann Degradation",
    "question": "Hofmann bromamide reaction of an amide (RCONH₂) with Br₂ and KOH gives:",
    "options": [
      "RNH₂ (primary amine with one less C than RCONH₂)",
      "R−CO−NH−Br (N-bromo amide)",
      "RCOOH and NH₃",
      "RNH₂ with same number of carbons"
    ],
    "correct": 0,
    "explanation": "Hofmann bromamide (degradation) reaction: RCONH₂ + Br₂ + 4KOH → RNH₂ + K₂CO₃ + 2KBr + 2H₂O. The amide loses the carbonyl carbon as CO₂/carbonate — the product RNH₂ has one less carbon than the original amide RCONH₂. This reaction is used to prepare primary amines with fewer carbon atoms and is a reliable method to determine structure."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 14,
    "chapterName": "Biomolecules",
    "topic": "Carbohydrates — Structure & Reactions",
    "question": "Which of the following sugars is a non-reducing sugar?",
    "options": [
      "Glucose",
      "Maltose",
      "Sucrose",
      "Lactose"
    ],
    "correct": 2,
    "explanation": "Reducing sugars have a free anomeric OH group (hemiacetal) that can be oxidized. Sucrose (table sugar) is a disaccharide where glucose and fructose are linked through BOTH their anomeric carbons (C1 of glucose and C2 of fructose), leaving no free anomeric OH. Hence sucrose is a non-reducing sugar. Maltose, lactose have free anomeric OH and are reducing sugars."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 14,
    "chapterName": "Biomolecules",
    "topic": "Proteins — Structure & Enzymes",
    "question": "The secondary structure of proteins involves:",
    "options": [
      "Sequence of amino acids in the polypeptide chain",
      "α-helix and β-pleated sheet formed by hydrogen bonds",
      "Three-dimensional folding of the polypeptide chain",
      "Quaternary arrangement of multiple subunits"
    ],
    "correct": 1,
    "explanation": "Protein structural levels: Primary — amino acid sequence (peptide bonds). Secondary — local regular structures (α-helix, β-pleated sheet) maintained by H-bonds between C=O and N–H groups of the backbone. Tertiary — overall 3D folding of single polypeptide (disulfide bonds, ionic interactions, hydrophobic interactions). Quaternary — assembly of multiple polypeptide subunits."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 15,
    "chapterName": "Polymers",
    "topic": "Addition & Condensation Polymers",
    "question": "Nylon-6,6 is formed by the condensation polymerization of:",
    "options": [
      "Hexamethylenediamine and adipic acid",
      "Caprolactam (6-aminohexanoic acid lactam)",
      "Hexamethylenediamine only",
      "Ethylene glycol and terephthalic acid"
    ],
    "correct": 0,
    "explanation": "Nylon-6,6 is a polyamide formed by condensation of hexamethylenediamine [H₂N(CH₂)₆NH₂] and adipic acid [HOOC(CH₂)₄COOH]. The name '6,6' indicates 6 carbons in each monomer. Nylon-6 (different) is made from caprolactam (ring-opening polymerization). Polyester (Dacron/Terylene) is made from ethylene glycol + terephthalic acid."
  },
  {
    "subject": "Chemistry",
    "neetClass": "12",
    "chapterNo": 16,
    "chapterName": "Chemistry in Everyday Life",
    "topic": "Drugs — Analgesics, Antibiotics & Antacids",
    "question": "Milk of magnesia [Mg(OH)₂] is used as an antacid. Antacids provide relief from acidity because they:",
    "options": [
      "Kill H. pylori bacteria that produce excess acid",
      "Inhibit the proton pump (H⁺/K⁺-ATPase) enzyme in stomach lining",
      "Neutralize excess hydrochloric acid in the stomach directly",
      "Absorb HCl by acting as an adsorbent like activated charcoal"
    ],
    "correct": 2,
    "explanation": "Antacids are mild bases that directly neutralize excess HCl in the stomach: Mg(OH)₂ + 2HCl → MgCl₂ + 2H₂O. Other antacids: Al(OH)₃, NaHCO₃, CaCO₃ (chalk). They provide quick, symptomatic relief. Proton pump inhibitors (PPIs) like omeprazole/pantoprazole work differently (option B) — they block the enzyme responsible for acid secretion. Antibiotics (option A) target H. pylori. Antacids (option D) do not adsorb — they react chemically."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 2,
    "chapterName": "Units and Measurement",
    "topic": "Dimensional Analysis",
    "question": "The dimensional formula of coefficient of viscosity η (from F = ηA(dv/dx)) is:",
    "options": [
      "[ML⁻¹T⁻¹]",
      "[MLT⁻²]",
      "[ML⁻¹T⁻²]",
      "[M⁰L²T⁻¹]"
    ],
    "correct": 0,
    "explanation": "From Newton's law of viscosity: F = η·A·(dv/dx). η = F·dx/(A·dv) = [MLT⁻²·L]/[L²·LT⁻¹] = [ML²T⁻²]/[L³T⁻¹] = [ML⁻¹T⁻¹]. SI unit of viscosity is Pa·s = kg/(m·s) = [ML⁻¹T⁻¹]."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 3,
    "chapterName": "Motion in a Straight Line",
    "topic": "Kinematics — Equations of Motion",
    "question": "A ball is thrown vertically upward with a velocity of 20 m/s. The maximum height reached and the total time of flight are respectively: (g = 10 m/s²)",
    "options": [
      "20 m, 4 s",
      "40 m, 4 s",
      "20 m, 2 s",
      "10 m, 2 s"
    ],
    "correct": 0,
    "explanation": "Maximum height: H = v²/(2g) = (20)²/(2×10) = 400/20 = 20 m. Time to reach max height: t = v/g = 20/10 = 2 s. Total time of flight = 2t = 4 s (by symmetry for vertical throw, neglecting air resistance). Answer: 20 m, 4 s."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Motion in a Plane",
    "topic": "Projectile Motion",
    "question": "A projectile is fired with initial velocity 40 m/s at 45° above horizontal on level ground. The horizontal range is: (g = 10 m/s²)",
    "options": [
      "80 m",
      "160 m",
      "40√3 m",
      "120 m"
    ],
    "correct": 1,
    "explanation": "Range R = u²sin(2θ)/g. At θ = 45°: sin(2×45°) = sin(90°) = 1. R = (40)²×1/10 = 1600/10 = 160 m. Note: Range is maximum when θ = 45°. Common trap: students may incorrectly use R = u²sinθ/g (missing the factor of 2 in the angle), getting R = 40²×sin45°/10 = 1600×0.707/10 ≈ 113 m — which is wrong. Always use sin(2θ) in the range formula."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 5,
    "chapterName": "Laws of Motion",
    "topic": "Newton's Laws & Friction",
    "question": "A block of mass 10 kg is placed on a rough horizontal surface (μ = 0.3). The minimum force required to move the block is: (g = 10 m/s²)",
    "options": [
      "30 N",
      "100 N",
      "3 N",
      "300 N"
    ],
    "correct": 0,
    "explanation": "The minimum force to just initiate motion equals the maximum static friction. For a horizontal surface: f = μₛ × N = μₛ × mg = 0.3 × 10 × 10 = 30 N. The normal force N = mg for a horizontal surface with no vertical applied force component."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 5,
    "chapterName": "Laws of Motion",
    "topic": "Pseudo Force & Non-inertial Frames",
    "question": "A man of mass 60 kg stands on a weighing scale inside an elevator. The scale reads 480 N. What is the acceleration of the elevator? (g = 10 m/s²)",
    "options": [
      "2 m/s² upward",
      "2 m/s² downward (or equivalently, decelerating upward at 2 m/s²)",
      "10 m/s² downward",
      "Zero (constant velocity)"
    ],
    "correct": 1,
    "explanation": "True weight = mg = 60×10 = 600 N. Apparent weight (scale reading) = 480 N < 600 N. Since N < mg, the net force on the man is downward: mg − N = ma → 600 − 480 = 60a → a = 2 m/s² directed downward. This means the elevator accelerates downward at 2 m/s² OR decelerates while moving upward at 2 m/s² — both give the same result. If scale read > 600 N, the elevator would be accelerating upward."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Work, Energy and Power",
    "topic": "Conservation of Energy & Power",
    "question": "A body of mass 2 kg is thrown vertically up with kinetic energy of 490 J. The height at which its kinetic energy equals its potential energy is: (g = 9.8 m/s²)",
    "options": [
      "12.5 m",
      "25 m",
      "6.25 m",
      "50 m"
    ],
    "correct": 0,
    "explanation": "Initial KE = 490 J. Total energy = 490 J (PE = 0 at ground). At height h, KE = PE: KE + PE = 490, so 2KE = 490, KE = 245 J. PE = mgh = 245 J → h = 245/(2×9.8) = 245/19.6 = 12.5 m."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 7,
    "chapterName": "System of Particles and Rotational Motion",
    "topic": "Moment of Inertia & Angular Momentum",
    "question": "A solid cylinder of mass M and radius R rolls without slipping on a horizontal surface. The ratio of its rotational KE to translational KE is:",
    "options": [
      "1:2",
      "1:1",
      "2:1",
      "1:3"
    ],
    "correct": 0,
    "explanation": "For rolling without slipping: translational KE = ½Mv², rotational KE = ½Iω² = ½(½MR²)(v/R)² = ¼Mv². Ratio = (¼Mv²):(½Mv²) = ¼:½ = 1:2."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 8,
    "chapterName": "Gravitation",
    "topic": "Gravitational Potential Energy & Escape Velocity",
    "question": "The escape velocity from Earth's surface is 11.2 km/s. The escape velocity from a planet with same density as Earth but twice the radius is:",
    "options": [
      "22.4 km/s",
      "11.2 km/s",
      "5.6 km/s",
      "44.8 km/s"
    ],
    "correct": 0,
    "explanation": "Escape velocity: ve = √(2GM/R). For same density ρ: M = (4/3)πR³ρ. So ve = √(2G·(4/3)πR³ρ/R) = √(8πGρR²/3) ∝ R. If radius doubles (density same), ve doubles: ve = 2 × 11.2 = 22.4 km/s."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 9,
    "chapterName": "Mechanical Properties of Solids",
    "topic": "Young's Modulus & Elastic Properties",
    "question": "A wire of length 2 m and cross-sectional area 2×10⁻⁶ m² is stretched by 1 mm under a force of 8000 N. Young's modulus of the material is:",
    "options": [
      "8×10¹² Pa",
      "8×10¹⁰ Pa",
      "4×10¹⁰ Pa",
      "2×10¹² Pa"
    ],
    "correct": 0,
    "explanation": "Young's modulus Y = (F/A)/(ΔL/L) = (F×L)/(A×ΔL). F = 8000 N, L = 2 m, A = 2×10⁻⁶ m², ΔL = 1 mm = 10⁻³ m. Y = (8000×2)/(2×10⁻⁶×10⁻³) = 16000/(2×10⁻⁹) = 8000/(10⁻⁹) = 8×10¹² Pa. Note: Standard Young's modulus of steel ≈ 2×10¹¹ Pa, so these numbers represent a fictitious material chosen for calculation practice — a common NEET numerical format."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 10,
    "chapterName": "Mechanical Properties of Fluids",
    "topic": "Bernoulli's Theorem & Surface Tension",
    "question": "Water rises to a height of 5 cm in a capillary tube. When the radius of the capillary tube is doubled, the height to which water rises is:",
    "options": [
      "2.5 cm",
      "10 cm",
      "5 cm",
      "1.25 cm"
    ],
    "correct": 0,
    "explanation": "By the capillary rise formula: h = 2T cosθ/(ρgr). Height h is inversely proportional to radius r: h ∝ 1/r. If r doubles (r → 2r), h halves: h = 5/2 = 2.5 cm."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 11,
    "chapterName": "Thermal Properties of Matter",
    "topic": "Newton's Law of Cooling & Specific Heat",
    "question": "A body cools from 80°C to 60°C in 5 minutes. How much time will it take to cool from 60°C to 40°C if the surrounding temperature is 20°C?",
    "options": [
      "8.33 min",
      "5 min",
      "10 min",
      "6.25 min"
    ],
    "correct": 0,
    "explanation": "By Newton's law of cooling: dT/dt ∝ (T − T₀). Rate₁ = (80−60)/5 = 4°C/min, average temp = 70°C, excess = 70−20 = 50°C. Rate₂: average temp = 50°C, excess = 50−20 = 30°C. Rate ∝ excess temp: t₂ = 20 × (50/30) / 4 = 20 × 5/(3×4) = 100/12 = 8.33 min."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 12,
    "chapterName": "Thermodynamics",
    "topic": "Laws of Thermodynamics & Heat Engines",
    "question": "A Carnot engine operates between 500 K and 300 K. Its efficiency is 40%. If the engine absorbs 500 J of heat from the hot reservoir, the work done is:",
    "options": [
      "200 J",
      "300 J",
      "500 J",
      "100 J"
    ],
    "correct": 0,
    "explanation": "Efficiency η = 1 − T₂/T₁ = 1 − 300/500 = 1 − 0.6 = 0.4 = 40%. (This matches given efficiency.) Work done W = η × Q_H = 0.4 × 500 = 200 J. Heat rejected to cold reservoir = 500 − 200 = 300 J."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 13,
    "chapterName": "Kinetic Theory",
    "topic": "RMS Speed & Degrees of Freedom",
    "question": "The RMS speed of oxygen molecules at 0°C is approximately 460 m/s. The RMS speed of hydrogen molecules at 0°C is approximately: (M_O₂ = 32, M_H₂ = 2)",
    "options": [
      "1840 m/s",
      "920 m/s",
      "3680 m/s",
      "460 m/s"
    ],
    "correct": 0,
    "explanation": "Vrms = √(3RT/M). At same temperature, Vrms ∝ 1/√M. Vrms(H₂)/Vrms(O₂) = √(M_O₂/M_H₂) = √(32/2) = √16 = 4. Vrms(H₂) = 4 × 460 = 1840 m/s."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 14,
    "chapterName": "Oscillations",
    "topic": "Simple Harmonic Motion — Time Period & Energy",
    "question": "A spring of spring constant 10 N/m is attached to a block of mass 0.1 kg. The time period of oscillation is:",
    "options": [
      "π/5 s",
      "2π/10 s",
      "0.2π s",
      "All of the above are equivalent expressions"
    ],
    "correct": 3,
    "explanation": "T = 2π√(m/k) = 2π√(0.1/10) = 2π√(0.01) = 2π × 0.1 = 0.2π s. Verify: π/5 = 0.2π ✓; 2π/10 = 0.2π ✓; 0.2π = 0.2π ✓. All three options (A, B, C) are mathematically identical expressions for the same value 0.2π ≈ 0.628 s. This question tests whether students can recognize equivalent mathematical forms. Answer D: all are equivalent."
  },
  {
    "subject": "Physics",
    "neetClass": "11",
    "chapterNo": 15,
    "chapterName": "Waves",
    "topic": "Sound Waves — Doppler Effect",
    "question": "A train moving at 20 m/s towards a stationary observer blows a horn of frequency 400 Hz. The frequency heard by the observer is: (Speed of sound = 340 m/s)",
    "options": [
      "425 Hz",
      "376 Hz",
      "400 Hz",
      "450 Hz"
    ],
    "correct": 0,
    "explanation": "Doppler formula (source approaching, observer stationary): f' = f × v/(v − vs) = 400 × 340/(340 − 20) = 400 × 340/320 = 400 × 1.0625 = 425 Hz. When source moves toward observer, observed frequency increases."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 1,
    "chapterName": "Electric Charges and Fields",
    "topic": "Coulomb's Law & Electric Field",
    "question": "Two point charges +Q and −Q are placed at distance d apart. The electric field is zero at:",
    "options": [
      "Midpoint between the charges",
      "A point on the perpendicular bisector",
      "No point (field is never zero for unlike charges)",
      "A point beyond +Q on the line joining charges"
    ],
    "correct": 2,
    "explanation": "For two unlike charges (+Q and −Q), the fields due to each charge point in the same direction along the line joining the charges (between them and beyond them on both sides). The fields never cancel for unlike charges — there is no null point. For like charges (+Q and +Q), the null point is at the midpoint. Answer: For unlike charges, no point has zero field on the line; E=0 only exists for like charges."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 1,
    "chapterName": "Electric Charges and Fields",
    "topic": "Gauss's Law",
    "question": "A spherical shell of radius R carries charge Q distributed uniformly. The electric field inside the shell at distance r < R from center is:",
    "options": [
      "Q/(4πε₀r²)",
      "Q/(4πε₀R²)",
      "Zero",
      "Qr/(4πε₀R³)"
    ],
    "correct": 2,
    "explanation": "By Gauss's law, for a spherical Gaussian surface of radius r < R inside the shell: the enclosed charge = 0 (all charge Q is on the surface at R). Therefore Φ = E × 4πr² = Q_enclosed/ε₀ = 0, so E = 0. The electric field inside a uniformly charged spherical shell is zero everywhere inside."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Electrostatic Potential and Capacitance",
    "topic": "Capacitors — Series & Parallel Combinations",
    "question": "Three capacitors of capacitance 2μF, 3μF, and 6μF are connected in series. The equivalent capacitance is:",
    "options": [
      "1 μF",
      "11 μF",
      "0.5 μF",
      "3 μF"
    ],
    "correct": 0,
    "explanation": "For capacitors in series: 1/C_eq = 1/C₁ + 1/C₂ + 1/C₃ = 1/2 + 1/3 + 1/6 = 3/6 + 2/6 + 1/6 = 6/6 = 1. Therefore C_eq = 1 μF."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Electrostatic Potential and Capacitance",
    "topic": "Energy Stored in Capacitor",
    "question": "A parallel plate capacitor of capacitance C is charged to potential V. When a dielectric slab of dielectric constant K is inserted (battery disconnected), the energy stored becomes:",
    "options": [
      "CV²/2",
      "KCV²/2",
      "CV²/(2K)",
      "K²CV²/2"
    ],
    "correct": 2,
    "explanation": "Battery disconnected → charge Q is constant (Q = CV). New capacitance = KC. New voltage V' = Q/(KC) = CV/(KC) = V/K. New energy = Q²/(2×KC) = (CV)²/(2KC) = CV²/(2K). Energy decreases by factor K — the extra energy goes into the mechanical work of pulling the dielectric in (or is released as heat if dielectric slides in on its own)."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Current Electricity",
    "topic": "Kirchhoff's Laws & Wheatstone Bridge",
    "question": "In a Wheatstone bridge, P=10Ω, Q=10Ω, R=10Ω and S=10Ω. If the bridge is balanced, the reading of galvanometer is:",
    "options": [
      "Zero",
      "Depends on EMF",
      "Maximum",
      "1 A"
    ],
    "correct": 0,
    "explanation": "Wheatstone bridge is balanced when P/Q = R/S. Here 10/10 = 10/10 = 1. Since the bridge is balanced, no current flows through the galvanometer — its reading is zero. In a balanced bridge, potential at junctions B and D are equal, so no potential difference across galvanometer."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Current Electricity",
    "topic": "Drift Velocity & Ohm's Law",
    "question": "A copper wire of length 2 m and cross-sectional area 2×10⁻⁶ m² has resistivity 1.7×10⁻⁸ Ω·m. Its resistance is:",
    "options": [
      "0.017 Ω",
      "0.17 Ω",
      "1.7 Ω",
      "0.0017 Ω"
    ],
    "correct": 0,
    "explanation": "R = ρL/A = (1.7×10⁻⁸ × 2)/(2×10⁻⁶) = 3.4×10⁻⁸/2×10⁻⁶ = 1.7×10⁻² = 0.017 Ω."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Moving Charges and Magnetism",
    "topic": "Lorentz Force & Cyclotron",
    "question": "A proton moves with velocity v in a magnetic field B perpendicular to it. The radius of circular orbit of the proton is:",
    "options": [
      "mv/qB",
      "qB/mv",
      "mv/(2qB)",
      "2mv/qB"
    ],
    "correct": 0,
    "explanation": "For circular motion in a magnetic field: magnetic force = centripetal force. qvB = mv²/r → r = mv/(qB). The radius of the circular orbit is r = mv/(qB), where m is the proton mass, v is the velocity, q is the charge, and B is the magnetic field."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Moving Charges and Magnetism",
    "topic": "Biot-Savart Law & Ampere's Law",
    "question": "Magnetic field at the center of a circular loop of radius R carrying current I is B₀. The magnetic field at a distance R on the axis from the center is:",
    "options": [
      "B₀/(2√2)",
      "B₀/2",
      "B₀/8",
      "B₀/√2"
    ],
    "correct": 0,
    "explanation": "At center: B₀ = μ₀I/(2R). On axis at distance x = R: B = μ₀IR²/(2(R²+x²)^(3/2)) = μ₀IR²/(2(R²+R²)^(3/2)) = μ₀IR²/(2(2R²)^(3/2)) = μ₀IR²/(2 × 2√2 × R³) = μ₀I/(4√2R) = B₀/(2√2)."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Magnetism and Matter",
    "topic": "Dia, Para & Ferromagnetic Materials",
    "question": "A diamagnetic material placed in an external magnetic field is:",
    "options": [
      "Strongly attracted along the field direction",
      "Weakly repelled from regions of stronger field",
      "Weakly attracted along the field direction",
      "Not affected by the external field"
    ],
    "correct": 1,
    "explanation": "Diamagnetic materials (e.g., Bi, Cu, gold, water) have no unpaired electrons and acquire magnetization opposite to the applied field (susceptibility χ is small and negative). They are feebly repelled from regions of stronger magnetic field. Paramagnetic materials are weakly attracted; ferromagnetic materials are strongly attracted."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Magnetism and Matter",
    "topic": "Earth's Magnetism & Magnetic Declination",
    "question": "At a place, the horizontal component of Earth's magnetic field is H and the angle of dip is 60°. The total magnetic field intensity at that place is:",
    "options": [
      "2H",
      "H/2",
      "H√3",
      "H/√3"
    ],
    "correct": 0,
    "explanation": "Horizontal component H = B cos δ where δ is the angle of dip and B is the total field. H = B cos 60° = B/2. Therefore B = 2H."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Electromagnetic Induction",
    "topic": "Faraday's Laws & Lenz's Law",
    "question": "A coil of 200 turns and area 0.04 m² is placed in a uniform magnetic field. When the field changes from 0.5 T to 0.1 T in 0.04 s, the induced EMF is:",
    "options": [
      "80 V",
      "8 V",
      "800 V",
      "0.8 V"
    ],
    "correct": 0,
    "explanation": "Induced EMF = −N × dΦ/dt = N × A × ΔB/Δt = 200 × 0.04 × (0.5−0.1)/0.04 = 200 × 0.04 × 0.4/0.04 = 200 × 0.4 = 80 V."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Electromagnetic Induction",
    "topic": "Self-Inductance & Mutual Inductance",
    "question": "The self-inductance of a solenoid with 500 turns, length 0.5 m and cross-sectional area 4×10⁻⁴ m² is: (μ₀ = 4π×10⁻⁷ H/m)",
    "options": [
      "0.08π mH",
      "0.8π mH",
      "0.4π mH",
      "0.04π mH"
    ],
    "correct": 0,
    "explanation": "L = μ₀N²A/l = (4π×10⁻⁷) × (500)² × (4×10⁻⁴) / 0.5. Step by step: N² = 250,000; N²×A = 250,000 × 4×10⁻⁴ = 100; divide by l=0.5: 100/0.5 = 200; multiply by μ₀: 4π×10⁻⁷ × 200 = 800π×10⁻⁷ H = 8π×10⁻⁵ H = 0.08π mH ≈ 0.251 mH. Common trap: forgetting to square N or misplacing a power of 10."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 7,
    "chapterName": "Alternating Current",
    "topic": "RLC Circuit & Resonance",
    "question": "In an AC circuit, the RMS current is 5 A and the RMS voltage is 100 V. If the circuit contains only a capacitor, the power consumed is:",
    "options": [
      "500 W",
      "0 W",
      "250 W",
      "1000 W"
    ],
    "correct": 1,
    "explanation": "Power consumed in AC circuits: P = Vrms × Irms × cosφ. For a purely capacitive circuit, voltage and current are 90° out of phase (φ = 90°). Power factor cosφ = cos90° = 0. Therefore P = 100 × 5 × 0 = 0 W. A pure capacitor (or pure inductor) consumes no average power — it stores and releases energy alternately."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 7,
    "chapterName": "Alternating Current",
    "topic": "Transformers & Power Transmission",
    "question": "A step-up transformer with primary to secondary turn ratio of 1:10 has primary voltage 220 V. If the primary current is 5 A, the secondary current is: (Assume ideal transformer)",
    "options": [
      "0.5 A",
      "50 A",
      "5 A",
      "500 A"
    ],
    "correct": 0,
    "explanation": "For an ideal transformer: Vs/Vp = Ns/Np → Vs = 220 × 10 = 2200 V. Power conservation: Pp = Ps → Vp×Ip = Vs×Is → Is = (Vp×Ip)/Vs = (220×5)/2200 = 1100/2200 = 0.5 A. When voltage steps up, current steps down in proportion."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 8,
    "chapterName": "Electromagnetic Waves",
    "topic": "EM Spectrum & Properties of EM Waves",
    "question": "The correct order of frequency (increasing) of electromagnetic waves is:",
    "options": [
      "Radio < Microwave < Infrared < Visible < UV < X-ray < γ-ray",
      "γ-ray < X-ray < UV < Visible < Infrared < Microwave < Radio",
      "Radio < UV < Infrared < Visible < Microwave < X-ray < γ-ray",
      "Infrared < Radio < Microwave < Visible < UV < X-ray < γ-ray"
    ],
    "correct": 0,
    "explanation": "The electromagnetic spectrum in order of increasing frequency (decreasing wavelength): Radio waves < Microwaves < Infrared < Visible light < Ultraviolet < X-rays < Gamma rays. Equivalently, wavelength decreases: Radio (km) > Micro (cm) > IR (μm) > Visible (400-700nm) > UV (nm) > X-ray (Å) > γ-ray (pm)."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 8,
    "chapterName": "Electromagnetic Waves",
    "topic": "Speed & Properties of EM Waves",
    "question": "Which of the following electromagnetic waves has the highest penetrating power?",
    "options": [
      "X-rays",
      "Ultraviolet rays",
      "Gamma rays",
      "Infrared rays"
    ],
    "correct": 2,
    "explanation": "Gamma rays have the highest frequency and shortest wavelength in the EM spectrum, giving them the highest energy photons (E = hf). Higher energy means greater penetrating power. Gamma rays can penetrate several centimeters of lead or meters of concrete. X-rays have less penetrating power than gamma rays, though both are ionizing radiation."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 9,
    "chapterName": "Ray Optics and Optical Instruments",
    "topic": "Refraction — Lenses & Prisms",
    "question": "A convex lens of focal length 20 cm forms an image twice the size of the object. The object distance is:",
    "options": [
      "10 cm",
      "30 cm",
      "60 cm",
      "40 cm"
    ],
    "correct": 1,
    "explanation": "Magnification m = v/u = −2 (real inverted image) or m = +2 (virtual erect). For real image: v = −2u (taking sign convention, v is positive for real image in standard convention). Using lens formula 1/v − 1/u = 1/f: 1/(2|u|) − 1/(−|u|) = 1/20 → for virtual magnified: m=+2, v = 2u (both positive). 1/2u − 1/u = 1/20 → (1−2)/(2u) = 1/20 → u = −10 cm. For real inverted image: m = −2, v = −2u (with u negative). 1/(2|u|) + 1/|u| = 1/f = 1/20: using u = −|u|, v = 2|u|: 1/(2|u|) − 1/(−|u|) = 1/20. For m=−2 (real): v/u = −2 → v = −2u. Lens formula: 1/v − 1/u = 1/f → 1/(−2u) − 1/u = 1/20 → −1/(2u) − 1/u = 1/20 → −3/(2u) = 1/20 → u = −30 cm. |u| = 30 cm."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 9,
    "chapterName": "Ray Optics and Optical Instruments",
    "topic": "Total Internal Reflection & Optical Fibres",
    "question": "The critical angle for a glass-air interface where refractive index of glass is 1.5 is: [sin⁻¹(2/3) ≈ 42°]",
    "options": [
      "42°",
      "48°",
      "35°",
      "60°"
    ],
    "correct": 0,
    "explanation": "Critical angle θc satisfies sin(θc) = n_air/n_glass = 1/1.5 = 2/3. Therefore θc = sin⁻¹(2/3) ≈ 41.8° ≈ 42°. At angles of incidence greater than θc (within glass), total internal reflection occurs — no refracted ray escapes into air."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 10,
    "chapterName": "Wave Optics",
    "topic": "Young's Double Slit Experiment",
    "question": "In YDSE, the fringe width is β. If the wavelength of light is doubled and the distance between slits is halved (screen distance unchanged), the new fringe width is:",
    "options": [
      "4β",
      "β/4",
      "2β",
      "β"
    ],
    "correct": 0,
    "explanation": "Fringe width β = λD/d. New β' = (2λ)D/(d/2) = 2λ × 2/d × D = 4λD/d = 4β. When wavelength doubles and slit separation halves, fringe width becomes 4 times the original."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 10,
    "chapterName": "Wave Optics",
    "topic": "Diffraction & Polarization",
    "question": "When unpolarized light passes through two Polaroid sheets at 60° to each other, the intensity of transmitted light compared to incident intensity is:",
    "options": [
      "I₀/4",
      "I₀/2",
      "I₀/8",
      "3I₀/8"
    ],
    "correct": 2,
    "explanation": "After first Polaroid: intensity = I₀/2 (unpolarized to polarized — half intensity). After second Polaroid (Malus's law): I = (I₀/2)cos²(60°) = (I₀/2)(1/2)² = (I₀/2)(1/4) = I₀/8."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 11,
    "chapterName": "Dual Nature of Radiation and Matter",
    "topic": "Photoelectric Effect",
    "question": "In a photoelectric experiment, radiation of frequency 10×10¹⁴ Hz is incident on a metal surface and the stopping potential is found to be 2 V. The work function of the metal is: (h = 6.6×10⁻³⁴ J·s, e = 1.6×10⁻¹⁹ C)",
    "options": [
      "2.13 eV",
      "5.28 eV",
      "3.28 eV",
      "0.48 eV"
    ],
    "correct": 0,
    "explanation": "Einstein's photoelectric equation: eV₀ = hf − φ. Energy of photon: hf = 6.6×10⁻³⁴ × 10×10¹⁴ = 6.6×10⁻¹⁹ J. In eV: hf = 6.6×10⁻¹⁹/(1.6×10⁻¹⁹) = 4.125 eV. Stopping potential V₀ = 2 V → eV₀ = 2 eV. Work function: φ = hf − eV₀ = 4.125 − 2 = 2.125 eV ≈ 2.13 eV. This represents the minimum energy needed to eject an electron from the metal surface."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 11,
    "chapterName": "Dual Nature of Radiation and Matter",
    "topic": "de Broglie Wavelength",
    "question": "An electron (mass m) accelerated through potential V has de Broglie wavelength λ. If the accelerating potential is increased to 4V, the new wavelength is:",
    "options": [
      "λ/2",
      "2λ",
      "λ/4",
      "4λ"
    ],
    "correct": 0,
    "explanation": "de Broglie wavelength of electron: λ = h/p = h/√(2meV). λ ∝ 1/√V. New λ' = h/√(2me×4V) = h/(2√(2meV)) = λ/2. When accelerating potential quadruples, wavelength halves."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 12,
    "chapterName": "Atoms",
    "topic": "Bohr's Model & Spectral Series",
    "question": "The spectral line observed at 656 nm in the hydrogen spectrum belongs to which series and which transition?",
    "options": [
      "Lyman series, n=2 to n=1",
      "Balmer series, n=3 to n=2",
      "Paschen series, n=4 to n=3",
      "Balmer series, n=4 to n=2"
    ],
    "correct": 1,
    "explanation": "The 656 nm line is H-alpha — the first line of the Balmer series, corresponding to the transition from n=3 to n=2. The Balmer series involves transitions to n=2 ground state of visible range: 656 nm (n=3→2, red), 486 nm (n=4→2, blue-green), 434 nm (n=5→2, violet)."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 12,
    "chapterName": "Atoms",
    "topic": "Rutherford's Atomic Model",
    "question": "In Rutherford's alpha particle scattering experiment, the distance of closest approach r₀ is related to kinetic energy KE of the alpha particle as:",
    "options": [
      "r₀ ∝ 1/KE",
      "r₀ ∝ KE",
      "r₀ ∝ √KE",
      "r₀ ∝ 1/√KE"
    ],
    "correct": 0,
    "explanation": "At distance of closest approach, all kinetic energy converts to electrostatic potential energy: KE = kq₁q₂/r₀. Therefore r₀ = kq₁q₂/KE ∝ 1/KE. Faster (higher KE) alpha particles penetrate closer to the nucleus, giving a smaller distance of closest approach."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 13,
    "chapterName": "Nuclei",
    "topic": "Nuclear Binding Energy & Radioactive Decay",
    "question": "The binding energy per nucleon is maximum for:",
    "options": [
      "Hydrogen (A=1)",
      "Iron (A≈56)",
      "Uranium (A=238)",
      "Helium (A=4)"
    ],
    "correct": 1,
    "explanation": "The binding energy per nucleon (BE/A) peaks around iron-56 (Fe-56) and nickel-62 at approximately 8.8 MeV/nucleon — these are the most stable nuclei. Elements lighter than Fe (like H, He) can release energy by fusion; elements heavier than Fe (like U) can release energy by fission. Fe-56 is at the valley of the nuclear stability curve."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 13,
    "chapterName": "Nuclei",
    "topic": "Radioactive Decay — Activity & Half-life",
    "question": "The half-life of a radioactive isotope is 5 years. The fraction that remains after 20 years is:",
    "options": [
      "1/16",
      "1/8",
      "1/4",
      "1/32"
    ],
    "correct": 0,
    "explanation": "Number of half-lives = 20/5 = 4. Fraction remaining = (1/2)⁴ = 1/16. After each half-life, half the remaining nuclei decay, so after 4 half-lives: N/N₀ = 1/16."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 14,
    "chapterName": "Semiconductor Electronics",
    "topic": "p-n Junction & Diode Characteristics",
    "question": "In a forward-biased p-n junction, the depletion region:",
    "options": [
      "Widens and barrier potential increases",
      "Narrows and barrier potential decreases",
      "Widens and barrier potential decreases",
      "Remains unchanged"
    ],
    "correct": 1,
    "explanation": "In forward bias: external battery opposes the built-in potential barrier. The majority carriers (holes in p-type, electrons in n-type) are pushed toward the junction, narrowing the depletion region and reducing the potential barrier (from ~0.7 V for Si to nearly zero at strong forward bias). Current flows easily once the barrier is overcome."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 14,
    "chapterName": "Semiconductor Electronics",
    "topic": "Logic Gates",
    "question": "The output of a NAND gate for inputs A=1, B=0 is:",
    "options": [
      "0",
      "1",
      "Undefined",
      "Depends on implementation"
    ],
    "correct": 1,
    "explanation": "NAND gate: output = NOT(A AND B). A=1, B=0: A AND B = 0. NOT(0) = 1. Output = 1. Truth table of NAND: (0,0)→1, (0,1)→1, (1,0)→1, (1,1)→0. Only when both inputs are 1 does NAND give output 0."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 14,
    "chapterName": "Semiconductor Electronics",
    "topic": "Transistor as Amplifier & Switch",
    "question": "In a common emitter transistor amplifier, if base current IB = 40 μA and collector current IC = 4 mA, the current gain β and emitter current IE are:",
    "options": [
      "β=100, IE=4.04 mA",
      "β=100, IE=3.96 mA",
      "β=0.01, IE=4.04 mA",
      "β=100, IE=40 mA"
    ],
    "correct": 0,
    "explanation": "Current gain β = IC/IB = 4×10⁻³/40×10⁻⁶ = 4000/40 = 100. Emitter current IE = IB + IC = 40×10⁻⁶ + 4×10⁻³ = 0.04×10⁻³ + 4×10⁻³ = 4.04×10⁻³ A = 4.04 mA."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 1,
    "chapterName": "The Living World",
    "topic": "Characteristics of Living Organisms",
    "question": "Which of the following is NOT a characteristic unique to living organisms?",
    "options": [
      "Cellular organization",
      "Metabolism",
      "Growth",
      "Response to stimuli"
    ],
    "correct": 2,
    "explanation": "Growth occurs in both living and non-living things (e.g., crystals grow, mountains erode). Cellular organization, metabolism (sum of chemical reactions in the body), and response to stimuli are characteristics more specifically associated with living organisms. However, the most reliable defining feature is metabolism — all living organisms carry out metabolic reactions. Growth in living organisms is from inside (intrinsic), while in non-living it's from outside (extrinsic)."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 2,
    "chapterName": "Biological Classification",
    "topic": "Five Kingdom Classification",
    "question": "Organisms that are prokaryotic, lack cell wall, and are the smallest known living cells that can live independently are placed in kingdom:",
    "options": [
      "Monera",
      "Protista",
      "Fungi",
      "Mycoplasma (Monera)"
    ],
    "correct": 3,
    "explanation": "Mycoplasmas (also called PPLO — Pleuropneumonia-like organisms) are the smallest known living cells (0.1-0.3 μm), prokaryotic, and uniquely lack a cell wall (making them resistant to penicillin which targets cell wall synthesis). They are placed in Kingdom Monera. They can cause diseases in plants (e.g., little leaf of brinjal) and animals."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 3,
    "chapterName": "Plant Kingdom",
    "topic": "Algae — Classification & Economic Importance",
    "question": "Reserve food material in Rhodophyceae (red algae) is:",
    "options": [
      "Starch",
      "Floridean starch",
      "Laminarin",
      "Mannitol"
    ],
    "correct": 1,
    "explanation": "Rhodophyceae (red algae): reserve food = floridean starch (resembles amylopectin). Chlorophyceae (green algae): starch. Phaeophyceae (brown algae): laminarin and mannitol. Chrysophyceae (diatoms): chrysolaminarin. This is a frequently asked NEET question on distinguishing algae groups."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 3,
    "chapterName": "Plant Kingdom",
    "topic": "Gymnosperms & Pteridophytes",
    "question": "In Cycas, which of the following is found that makes it unique among gymnosperms?",
    "options": [
      "Naked seeds",
      "Motile sperms (flagellated male gametes)",
      "Absence of vascular tissue",
      "Underground stem"
    ],
    "correct": 1,
    "explanation": "Cycas is unique among most gymnosperms (and seed plants) because it retains motile flagellated sperms — an ancestral feature linking it to pteridophytes. Most other gymnosperms and all angiosperms have non-motile sperms delivered via pollen tube. Ginkgo also has motile sperms. This represents an evolutionary intermediate character."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Morphology of Flowering Plants",
    "topic": "Root & Stem Modifications",
    "question": "Pneumatophores are found in:",
    "options": [
      "Desert plants for water storage",
      "Mangrove plants for aerating roots in waterlogged soil",
      "Climbing plants for support",
      "Parasitic plants for absorbing nutrients"
    ],
    "correct": 1,
    "explanation": "Pneumatophores (also called breathing roots) are specialized negatively geotropic (grow upward) roots found in mangrove plants (e.g., Rhizophora, Avicennia) growing in waterlogged/tidal habitats. They project above the waterlogged soil or water surface and have tiny pores (lenticels) for gaseous exchange, supplying oxygen to the submerged root system."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Morphology of Flowering Plants",
    "topic": "Inflorescence Types",
    "question": "In which of the following plants is the inflorescence a cyathium?",
    "options": [
      "Sunflower",
      "Euphorbia",
      "Ficus",
      "Banana"
    ],
    "correct": 1,
    "explanation": "Cyathium is a specialized inflorescence found in Euphorbia (spurge family). It consists of a cup-shaped involucre with: several male flowers (each just a single stamen) surrounding one central female flower (single pistil on a stalk). The whole structure mimics a single bisexual flower. Sunflower has capitulum; Ficus has hypanthodium (syconus); Banana has spadix."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 5,
    "chapterName": "Anatomy of Flowering Plants",
    "topic": "Secondary Growth in Dicots",
    "question": "In secondary growth, the vascular cambium forms secondary phloem on the:",
    "options": [
      "Inner side (toward pith)",
      "Outer side (toward bark)",
      "Both inner and outer sides equally",
      "Only toward the xylem"
    ],
    "correct": 1,
    "explanation": "The vascular cambium is bifacial — it adds secondary xylem (wood) toward the inner side (toward pith) and secondary phloem toward the outer side (toward bark/cortex). The cork cambium (phellogen) forms separately in the cortex to produce the bark. Secondary xylem accumulates and forms the bulk of the stem (wood), while secondary phloem is pushed outward."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Cell — The Unit of Life",
    "topic": "Cell Organelles — Structure & Function",
    "question": "The enzyme responsible for carbon fixation in chloroplasts (RuBisCO) is located in the:",
    "options": [
      "Thylakoid membrane",
      "Stroma",
      "Intermembrane space",
      "Outer chloroplast membrane"
    ],
    "correct": 1,
    "explanation": "RuBisCO (Ribulose-1,5-bisphosphate carboxylase/oxygenase) is the most abundant enzyme on Earth and catalyzes CO₂ fixation in the Calvin cycle. It is located in the stroma of the chloroplast (the fluid-filled region surrounding the thylakoids). The thylakoid membrane houses the light reactions (photosystems, electron carriers, ATP synthase)."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Cell — The Unit of Life",
    "topic": "Cell Membrane & Fluid Mosaic Model",
    "question": "The Singer-Nicolson fluid mosaic model of cell membrane proposes that:",
    "options": [
      "Proteins form a bilayer with lipids on the outside",
      "Lipids form a bilayer with proteins floating/embedded in it",
      "Carbohydrates form the structural backbone",
      "Proteins are covalently bonded to lipids"
    ],
    "correct": 1,
    "explanation": "The fluid mosaic model (Singer and Nicolson, 1972) proposes: the membrane is a fluid phospholipid bilayer (with hydrophilic heads facing outside, hydrophobic tails inside) in which proteins are embedded (integral) or attached peripherally (peripheral). The lipid bilayer is fluid at physiological temperatures, allowing lateral movement of proteins. Carbohydrates are attached to proteins/lipids on the outer surface as glycoproteins/glycolipids."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 7,
    "chapterName": "Biomolecules",
    "topic": "Enzymes — Mechanism & Inhibition",
    "question": "A competitive inhibitor reduces enzyme activity by:",
    "options": [
      "Permanently binding to the active site",
      "Competing with substrate for the active site (reversibly)",
      "Binding to an allosteric site and changing the active site shape",
      "Destroying the enzyme's tertiary structure"
    ],
    "correct": 1,
    "explanation": "Competitive inhibitors are structural analogs of the substrate that reversibly compete for the same active site. They can be overcome by increasing substrate concentration (outcompeting the inhibitor). Example: Malonate is a competitive inhibitor of succinate dehydrogenase (resembles succinate). Non-competitive (allosteric) inhibitors bind elsewhere, changing the active site conformation permanently or semi-permanently."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 8,
    "chapterName": "Cell Cycle and Cell Division",
    "topic": "Mitosis — Stages & Significance",
    "question": "Which stage of mitosis is characterized by chromosomes appearing as distinct V-shaped or J-shaped structures at the equatorial plate?",
    "options": [
      "Prophase",
      "Metaphase",
      "Anaphase",
      "Telophase"
    ],
    "correct": 1,
    "explanation": "Metaphase: chromosomes are maximally condensed and align at the metaphase plate (cell equator) — this is the best stage to count chromosomes and study karyotype. Each chromosome consists of two chromatids joined at centromere, appearing V-shaped (metacentric), J-shaped (submetacentric), or I-shaped (acrocentric/telocentric) depending on centromere position. Spindle fibers attach to kinetochores."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 8,
    "chapterName": "Cell Cycle and Cell Division",
    "topic": "Meiosis — Significance & Differences from Mitosis",
    "question": "Crossing over (genetic recombination) occurs during which substage of meiotic prophase I?",
    "options": [
      "Leptotene",
      "Zygotene",
      "Pachytene",
      "Diplotene"
    ],
    "correct": 2,
    "explanation": "Meiotic Prophase I substages: Leptotene (chromosomes condense), Zygotene (homologs pair — synapsis begins, forming bivalents via synaptonemal complex), Pachytene (crossing over occurs — exchange of segments between non-sister chromatids at chiasmata, catalyzed by recombinase enzymes), Diplotene (synaptonemal complex dissolves, chiasmata visible), Diakinesis (terminalization of chiasmata, bivalents migrate to periphery)."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 9,
    "chapterName": "Transport in Plants",
    "topic": "Ascent of Sap — Cohesion-Tension Theory",
    "question": "The cohesion-tension theory of ascent of sap in tall trees was proposed by:",
    "options": [
      "Dixon and Joly",
      "Strasburger",
      "Godlewski",
      "Stephen Hales"
    ],
    "correct": 0,
    "explanation": "The cohesion-tension theory (transpiration-pull theory) was proposed by Dixon and Joly (1894) and developed further by Dixon (1914). It explains ascent of sap through: (1) transpiration creating a pull (tension), (2) cohesion of water molecules due to H-bonding, (3) adhesion to xylem walls. The theory is currently most accepted for explaining water transport in tall trees."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 10,
    "chapterName": "Mineral Nutrition",
    "topic": "Essential Elements & Deficiency Symptoms",
    "question": "Nitrogen fixation in legumes is carried out by Rhizobium. The enzyme responsible for N₂ → NH₃ is:",
    "options": [
      "Nitrogenase",
      "Nitrate reductase",
      "Nitrite reductase",
      "Glutamine synthetase"
    ],
    "correct": 0,
    "explanation": "Nitrogenase is the enzyme complex (consisting of dinitrogenase reductase and dinitrogenase) that catalyzes the fixation of atmospheric N₂ to NH₃: N₂ + 8H⁺ + 8e⁻ + 16 ATP → 2NH₃ + H₂ + 16 ADP + 16 Pi. It is highly sensitive to oxygen (irreversibly inactivated by O₂), which is why leghaemoglobin is produced in root nodules to maintain low O₂ levels."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 11,
    "chapterName": "Photosynthesis in Higher Plants",
    "topic": "Light Reactions — Photosystems & ATP Synthesis",
    "question": "In non-cyclic photophosphorylation, the electrons released by PS II ultimately reduce:",
    "options": [
      "CO₂",
      "NADP⁺",
      "O₂",
      "Ferredoxin to NADPH, then NADP⁺"
    ],
    "correct": 1,
    "explanation": "In non-cyclic photophosphorylation (Z-scheme): PS II absorbs light → excited electrons pass through electron transport chain (plastoquinone → Cyt b6f → plastocyanin) → PS I absorbs light → excited electrons passed to ferredoxin → NADP reductase reduces NADP⁺ to NADPH. The electrons from PS II ultimately reach NADP⁺ (via PS I). The electron deficit in PS II is filled by water splitting (O₂ evolution)."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 11,
    "chapterName": "Photosynthesis in Higher Plants",
    "topic": "C4 Pathway & CAM Plants",
    "question": "In C4 plants, the first stable product of CO₂ fixation in mesophyll cells is:",
    "options": [
      "3-Phosphoglycerate (3-PGA)",
      "Oxaloacetate (OAA)",
      "Malate",
      "Ribulose bisphosphate (RuBP)"
    ],
    "correct": 1,
    "explanation": "In C4 plants (e.g., maize, sugarcane), CO₂ is initially fixed in mesophyll cells by PEP carboxylase (PEPC) onto phosphoenolpyruvate (PEP, a 3C compound) to form oxaloacetate (OAA, 4C) — the first stable product (hence C4 plant). OAA is then converted to malate or aspartate and transported to bundle sheath cells where decarboxylation releases CO₂ for the Calvin cycle. In C3 plants, the first product is 3-PGA."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 12,
    "chapterName": "Respiration in Plants",
    "topic": "Glycolysis & Krebs Cycle",
    "question": "In the Krebs cycle, the substrate-level phosphorylation (direct ATP synthesis) occurs during the conversion of:",
    "options": [
      "Isocitrate to α-ketoglutarate",
      "Succinyl-CoA to succinate",
      "Malate to oxaloacetate",
      "Citrate to isocitrate"
    ],
    "correct": 1,
    "explanation": "Substrate-level phosphorylation in the Krebs cycle occurs when succinyl-CoA is converted to succinate by succinyl-CoA synthetase. The energy released from the high-energy thioester bond of succinyl-CoA is used to phosphorylate GDP to GTP (in animals) or ADP to ATP (in plants). This is the only direct ATP/GTP synthesis step in the Krebs cycle; all other steps produce NADH or FADH₂."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 12,
    "chapterName": "Respiration in Plants",
    "topic": "Oxidative Phosphorylation & Chemiosmosis",
    "question": "The net gain of ATP molecules per glucose molecule in complete aerobic respiration (in plants using both mitochondria and the KREB pathway, with each NADH giving 2.5 ATP and FADH₂ giving 1.5 ATP) is:",
    "options": [
      "36-38 ATP",
      "30-32 ATP",
      "38 ATP exactly",
      "2 ATP"
    ],
    "correct": 1,
    "explanation": "Updated calculation (P/O ratios): Glycolysis: 2 ATP + 2 NADH (cytoplasmic). Pyruvate decarboxylation: 2 NADH (mitochondrial). Krebs cycle: 2 ATP + 6 NADH + 2 FADH₂. Total NADH (mitochondrial): 8. Total FADH₂: 2. Cytoplasmic NADH: 2 (×1.5 for transport cost = 2×1.5=3 ATP or ×2.5=5 ATP depending on shuttle). ATP = 4 + 8×2.5 + 2×1.5 + 2×1.5 (cytoplasmic NADH via malate-aspartate shuttle at 2.5) = 4 + 20 + 3 + 5 = 30-32 ATP. Modern estimate is 30-32 ATP, not the older 36-38."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 13,
    "chapterName": "Plant Growth and Development",
    "topic": "Plant Hormones — Auxins, Gibberellins, Cytokinins",
    "question": "Which hormone is responsible for breaking dormancy in seeds and promoting seed germination?",
    "options": [
      "Abscisic acid (ABA)",
      "Gibberellin (GA)",
      "Ethylene",
      "Cytokinin"
    ],
    "correct": 1,
    "explanation": "Gibberellins (especially GA₃) break dormancy in seeds and buds, promoting germination. They activate α-amylase production in aleurone cells of cereal seeds (e.g., barley), which digests starch to sugars needed for germination. ABA (abscisic acid) promotes and maintains dormancy — it is the 'stress hormone.' Gibberellins also cause stem elongation, fruit development without fertilization (parthenocarpy)."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 13,
    "chapterName": "Plant Growth and Development",
    "topic": "Photoperiodism & Vernalization",
    "question": "A plant requires a dark period of more than 14 hours for flowering. This plant is a:",
    "options": [
      "Long-day plant (LDP)",
      "Short-day plant (SDP)",
      "Day-neutral plant",
      "Intermediate day plant"
    ],
    "correct": 1,
    "explanation": "Photoperiodism: Plants require specific night length (not day length, contrary to old naming) for flowering. Short-day plants (SDPs, correctly 'long-night plants') require a continuous dark period exceeding a critical length (typically > 12-14 hours). Long-day plants (LDPs, 'short-night plants') flower when dark period is shorter than the critical length. SDPs: Chrysanthemum, Xanthium (cocklebur), rice, tobacco. This plant needing >14 hrs dark = SDP."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 1,
    "chapterName": "Reproduction in Organisms",
    "topic": "Modes of Asexual Reproduction",
    "question": "Vegetative propagation through leaves is seen in:",
    "options": [
      "Bryophyllum",
      "Potato",
      "Ginger",
      "Mint"
    ],
    "correct": 0,
    "explanation": "Bryophyllum (Kalanchoe/Sprout-leaf plant) shows vegetative propagation through leaves — the notches/margins of its leaves bear small plantlets (adventitious buds) that fall off and establish as new plants. Potato propagates via stem tubers. Ginger propagates via rhizomes (underground stem). Mint propagates via stolons/runners. Bryophyllum is the classic NCERT example of leaf propagation."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 1,
    "chapterName": "Reproduction in Organisms",
    "topic": "Senescence & Juvenile Phase",
    "question": "The bamboo plant flowers only once in its lifetime after many years of vegetative growth. This type of flowering is called:",
    "options": [
      "Perennial flowering",
      "Monocarpy",
      "Polycarpy",
      "Vivipary"
    ],
    "correct": 1,
    "explanation": "Monocarpy (or hapaxanthic flowering) is the phenomenon where a plant flowers only once in its lifetime, sets fruit and seeds, then dies. Bamboo species flower after 50-100 years, produce massive amounts of seeds, then die. Other monocarpic plants: Agave (century plant), some palms. Polycarpic plants flower repeatedly. Vivipary is germination of seeds while still on the parent plant (e.g., mangroves, Rhizophora)."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Sexual Reproduction in Flowering Plants",
    "topic": "Male Gametophyte & Pollen",
    "question": "The pollen grain wall has two layers. The outer tough layer (exine) is made up of:",
    "options": [
      "Cellulose",
      "Sporopollenin",
      "Lignin",
      "Suberin"
    ],
    "correct": 1,
    "explanation": "The pollen grain wall has: (1) Exine — outer layer, made of sporopollenin (one of the most resistant biological materials known), which is resistant to high temperatures, acid, alkali, and most organic solvents. This is why pollen grains are well-preserved as fossils. (2) Intine — inner layer, made of cellulose and pectin. Sporopollenin is a polymer of carotenoids and carotenoid esters."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Sexual Reproduction in Flowering Plants",
    "topic": "Double Fertilization & Triple Fusion",
    "question": "In angiosperms, double fertilization involves fusion of one male gamete with the egg cell and another male gamete with:",
    "options": [
      "The antipodal cells",
      "The secondary nucleus (definitive nucleus, 2n)",
      "The synergids",
      "The integuments"
    ],
    "correct": 1,
    "explanation": "Double fertilization in angiosperms: (1) Syngamy: one male gamete (n) + egg cell (n) → zygote (2n) → develops into embryo. (2) Triple fusion: other male gamete (n) + two polar nuclei/secondary nucleus (2n) → primary endosperm nucleus (3n, triploid) → endosperm. The secondary nucleus (formed by fusion of two polar nuclei) is diploid (2n). Triple fusion is unique to angiosperms and is the basis of double fertilization."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Sexual Reproduction in Flowering Plants",
    "topic": "Seed Development & Germination",
    "question": "The part of the embryo that develops into the shoot system in dicot seeds is the:",
    "options": [
      "Radicle",
      "Plumule",
      "Cotyledon",
      "Hypocotyl"
    ],
    "correct": 1,
    "explanation": "In a typical dicot embryo: Radicle → primary root (root system); Plumule → shoot system (first leaves, stem above cotyledons); Cotyledons → seed leaves that may store food (hypogeal germination) or emerge above ground (epigeal germination); Hypocotyl → stem between cotyledons and root; Epicotyl → stem above cotyledonary node."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Organisms and Populations",
    "topic": "Population Interactions & Competition",
    "question": "The relationship between a fig tree and a fig wasp is an example of:",
    "options": [
      "Commensalism",
      "Mutualism",
      "Parasitism",
      "Amensalism"
    ],
    "correct": 1,
    "explanation": "Fig trees and fig wasps show obligate mutualism (+/+): The fig wasp (Blastophaga species) is the exclusive pollinator of the fig tree — it enters the syconium (fig inflorescence) to lay eggs. The tree provides a protected site for wasp reproduction. Both benefit: tree achieves pollination (seeds); wasp reproduces. This is a classic NCERT example of mutualism involving one of the most specialized plant-animal interactions."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Organisms and Populations",
    "topic": "Population Growth Models",
    "question": "In the logistic growth model, population growth rate (dN/dt) is maximum when:",
    "options": [
      "N = K",
      "N = K/2",
      "N → 0",
      "N > K"
    ],
    "correct": 1,
    "explanation": "Logistic growth: dN/dt = rN(1 − N/K). The term (1 − N/K) is the environmental resistance. To find maximum growth rate, differentiate with respect to N and set to zero: d/dN [rN(K−N)/K] = r(K−2N)/K = 0 → N = K/2. At N = K/2, the population growth rate is maximum. This is the inflection point of the sigmoidal (S-shaped) logistic growth curve."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Ecosystem",
    "topic": "Energy Flow & Ecological Pyramids",
    "question": "In an ecosystem, Gross Primary Productivity (GPP) and Net Primary Productivity (NPP) are related as:",
    "options": [
      "NPP = GPP + Respiration",
      "NPP = GPP − Respiration",
      "GPP = NPP − Respiration",
      "NPP = GPP × Respiration"
    ],
    "correct": 1,
    "explanation": "GPP = total rate of photosynthesis (total organic matter produced by plants). Some of this is used by plants for their own respiration (R). The remaining is available for storage and other organisms: NPP = GPP − Respiration. NPP is the biomass available for consumption by herbivores. In an average ecosystem, plants use about 20% of GPP in respiration, so NPP ≈ 80% of GPP."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Ecosystem",
    "topic": "Nutrient Cycling — Carbon & Nitrogen Cycles",
    "question": "Which step in the nitrogen cycle requires anaerobic conditions and converts NO₃⁻ back to N₂?",
    "options": [
      "Nitrification",
      "Denitrification",
      "Ammonification",
      "Nitrogen fixation"
    ],
    "correct": 1,
    "explanation": "Denitrification: anaerobic bacteria (Pseudomonas, Thiobacillus denitrificans) convert nitrates (NO₃⁻) → nitrites (NO₂⁻) → N₂ (or N₂O) under anaerobic conditions (waterlogged soils). This returns nitrogen to the atmosphere. Nitrification (aerobic): NH₄⁺ → NO₂⁻ → NO₃⁻ by Nitrosomonas and Nitrobacter. Ammonification: organic N → NH₄⁺ by decomposers."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Ecosystem",
    "topic": "Decomposition & Humification",
    "question": "The correct sequence of decomposition is:",
    "options": [
      "Fragmentation → Leaching → Catabolism → Humification → Mineralisation",
      "Leaching → Fragmentation → Humification → Catabolism → Mineralisation",
      "Catabolism → Fragmentation → Leaching → Humification → Mineralisation",
      "Fragmentation → Catabolism → Leaching → Humification → Mineralisation"
    ],
    "correct": 0,
    "explanation": "Decomposition proceeds as: (1) Fragmentation — detritivores (earthworms, millipedes) break down detritus into smaller particles. (2) Leaching — water-soluble nutrients percolate into soil. (3) Catabolism — microbes enzymatically degrade polymers into simpler monomers. (4) Humification — microbes convert organic matter to dark, amorphous, resistant humus. (5) Mineralisation — humus further broken down to release inorganic minerals."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Biodiversity and Conservation",
    "topic": "Types of Biodiversity & Hotspots",
    "question": "The term 'biodiversity hotspot' was coined by:",
    "options": [
      "E.O. Wilson",
      "Norman Myers",
      "Robert May",
      "Paul Ehrlich"
    ],
    "correct": 1,
    "explanation": "Norman Myers coined the term 'biodiversity hotspot' in 1988. A biodiversity hotspot is a biogeographic region with significant levels of biodiversity that is threatened by human habitation. Criteria: must have ≥1500 endemic vascular plant species AND must have lost ≥70% of original habitat. India has two hotspots: Western Ghats-Sri Lanka and Eastern Himalayas. Globally, 34 hotspots recognized."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Biodiversity and Conservation",
    "topic": "In situ & Ex situ Conservation",
    "question": "Cryopreservation of seeds and gametes in seed banks is an example of:",
    "options": [
      "In situ conservation",
      "Ex situ conservation",
      "Biosphere reserve",
      "Sacred grove protection"
    ],
    "correct": 1,
    "explanation": "Ex situ conservation involves protecting species outside their natural habitat: seed banks (e.g., Svalbard Global Seed Vault), botanical gardens, zoological parks, cryopreservation (at −196°C in liquid nitrogen). In situ conservation protects species in their natural habitat: national parks, wildlife sanctuaries, biosphere reserves, sacred groves. Cryopreservation = ex situ because the organisms are removed from natural habitat for preservation."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Biodiversity and Conservation",
    "topic": "IUCN Categories & Extinction",
    "question": "Species that are at very high risk of extinction in the wild due to rapid decline or very small population are categorized by IUCN as:",
    "options": [
      "Vulnerable (VU)",
      "Endangered (EN)",
      "Critically Endangered (CR)",
      "Extinct in Wild (EW)"
    ],
    "correct": 2,
    "explanation": "IUCN Red List categories (increasing threat): Least Concern (LC) → Near Threatened (NT) → Vulnerable (VU) → Endangered (EN) → Critically Endangered (CR) → Extinct in the Wild (EW) → Extinct (EX). Critically Endangered (CR) species face an extremely high risk of extinction — population decline > 80% in 10 years, or population < 250 mature individuals. Examples: Amur leopard, Sumatran orangutan, Snow leopard."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Environmental Issues",
    "topic": "Air Pollution & Ozone Depletion",
    "question": "CFCs (chlorofluorocarbons) deplete the ozone layer. In the stratosphere, what is the primary agent released from CFCs that destroys ozone?",
    "options": [
      "Fluorine radical",
      "Chlorine radical (Cl•)",
      "Carbon monoxide",
      "Carbon dioxide"
    ],
    "correct": 1,
    "explanation": "In the stratosphere, UV radiation breaks C–Cl bond in CFCs (e.g., CCl₂F₂) to release chlorine radicals (Cl•). The chain reaction: Cl• + O₃ → ClO• + O₂; ClO• + O• → Cl• + O₂. One Cl• atom can catalytically destroy ~100,000 ozone molecules before being removed. The ozone hole is most pronounced over Antarctica (polar stratospheric clouds accelerate the process)."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Environmental Issues",
    "topic": "Water Pollution & Eutrophication",
    "question": "Eutrophication of water bodies occurs due to:",
    "options": [
      "Excess dissolved oxygen from photosynthesis",
      "Enrichment with nutrients (N, P) causing excessive algal growth",
      "Industrial heavy metal discharge",
      "Depletion of dissolved CO₂"
    ],
    "correct": 1,
    "explanation": "Eutrophication: nutrient enrichment (primarily phosphates and nitrates from agricultural runoff, sewage, and detergents) causes explosive growth of algae and cyanobacteria (algal bloom). When these die, their decomposition by aerobic bacteria depletes dissolved oxygen — creating hypoxic/anoxic dead zones, killing fish and other aquatic life. Cultural (accelerated) eutrophication is caused by human activities."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Environmental Issues",
    "topic": "Biomagnification & Greenhouse Effect",
    "question": "DDT is an example of biomagnification because:",
    "options": [
      "It decomposes rapidly in higher organisms",
      "Its concentration increases at each successive trophic level",
      "It is excreted efficiently by predators",
      "It is only toxic to producers"
    ],
    "correct": 1,
    "explanation": "Biomagnification (bioaccumulation): fat-soluble, non-biodegradable compounds like DDT, PCBs, mercury accumulate in fatty tissues and are not excreted. At each trophic level, predators consume many prey organisms, concentrating the toxin further. DDT concentration in water: 0.003 ppb → zooplankton: 0.04 ppm → small fish: 0.5 ppm → large fish: 2 ppm → fish-eating birds: 25 ppm — 10-million-fold increase from water to top predator."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 1,
    "chapterName": "Animal Kingdom",
    "topic": "Classification — Basis & Criteria",
    "question": "Bilateral symmetry, triploblastic organization, acoelomate body plan, and flame cells (protonephridia) for excretion are characteristics of phylum:",
    "options": [
      "Platyhelminthes",
      "Nematoda",
      "Annelida",
      "Echinodermata"
    ],
    "correct": 0,
    "explanation": "Phylum Platyhelminthes (flatworms — tapeworm, Planaria, liver fluke): bilateral symmetry, triploblastic (3 germ layers), acoelomate (no true body cavity — mesoderm fills space), flame cells (protonephridia) for osmoregulation/excretion. Nematoda: pseudocoelomate. Annelida: coelomate with nephridia. Echinodermata: deuterostomes with pentaradial symmetry as adults."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 1,
    "chapterName": "Animal Kingdom",
    "topic": "Non-chordates — Unique Features",
    "question": "Water vascular system is the unique feature of:",
    "options": [
      "Porifera",
      "Echinodermata",
      "Arthropoda",
      "Hemichordata"
    ],
    "correct": 1,
    "explanation": "The water vascular system (hydrovascular system) is the unique hydraulic system of Echinodermata (starfish, sea urchin, sea cucumber, brittle star, feather star). It functions in locomotion (tube feet), feeding, respiration, and sensory reception. Water enters through the madreporite → stone canal → ring canal → radial canals → ampullae → tube feet. This system is found ONLY in echinoderms."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 2,
    "chapterName": "Structural Organisation in Animals",
    "topic": "Cockroach — Morphology & Anatomy",
    "question": "In cockroach, Malpighian tubules are the organs of excretion. They arise from:",
    "options": [
      "The junction of midgut and hindgut",
      "The foregut",
      "The body wall (coelom)",
      "The salivary glands"
    ],
    "correct": 0,
    "explanation": "Malpighian tubules in insects (cockroach, locust) are slender, yellowish tubes that arise from the junction of the midgut (mesenteron) and hindgut (proctodeum). They absorb uric acid and ions from the haemolymph (body fluid), and empty their contents into the hindgut for elimination. They are the excretory organs of insects (analogous to kidneys in vertebrates)."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 3,
    "chapterName": "Digestion and Absorption",
    "topic": "Enzymes of Digestion",
    "question": "The enzyme that converts inactive trypsinogen to active trypsin in the small intestine is:",
    "options": [
      "Pepsin",
      "Enterokinase",
      "Lipase",
      "Amylase"
    ],
    "correct": 1,
    "explanation": "Enterokinase (enteropeptidase) is an enzyme secreted by the duodenal mucosa that activates trypsinogen → trypsin by cleavage of a short peptide from N-terminus. Trypsin then autocatalytically activates more trypsinogen and also activates chymotrypsinogen → chymotrypsin, proelastase → elastase, etc. This cascade ensures proteolytic enzymes are only active in the intestinal lumen, preventing autodigestion."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 3,
    "chapterName": "Digestion and Absorption",
    "topic": "Absorption — Small Intestine & Villi",
    "question": "Which of the following is absorbed through lacteals (lymphatic capillaries) in the villi of the small intestine?",
    "options": [
      "Glucose",
      "Amino acids",
      "Chylomicrons (fatty acids and glycerol as micelles/chylomicrons)",
      "Mineral ions"
    ],
    "correct": 2,
    "explanation": "Short-chain fatty acids and glycerol can directly enter blood capillaries. However, long-chain fatty acids and monoglycerides are reassembled into triglycerides within enterocytes and packaged into chylomicrons (lipoprotein particles), which are too large to enter blood capillaries. They enter lacteals (lymph capillaries) in the villi and reach the blood via the lymphatic system (thoracic duct). Glucose and amino acids are absorbed into blood capillaries."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Breathing and Exchange of Gases",
    "topic": "Oxygen Transport & Hemoglobin",
    "question": "The Bohr effect refers to:",
    "options": [
      "Increased O₂ affinity of Hb at high CO₂ and low pH",
      "Decreased O₂ affinity of Hb at high CO₂ and low pH (rightward shift of O₂ dissociation curve)",
      "Increased CO₂ transport as bicarbonate",
      "Effect of temperature on lung capacity"
    ],
    "correct": 1,
    "explanation": "The Bohr effect: elevated CO₂ and lowered pH (acidosis) decrease hemoglobin's affinity for O₂ — right-shifting the oxygen dissociation curve (Hb releases O₂ more readily at tissues where CO₂ is high). Conversely, lower CO₂ and higher pH (in lungs) increase Hb's O₂ affinity — favoring O₂ loading. This is physiologically perfect: tissues producing CO₂ receive more O₂; lungs with low CO₂ absorb more O₂."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Breathing and Exchange of Gases",
    "topic": "Respiratory Volumes & Lung Capacity",
    "question": "Vital capacity of the lung is equal to:",
    "options": [
      "Tidal volume + Inspiratory reserve volume",
      "Tidal volume + Inspiratory reserve + Expiratory reserve volume",
      "Total lung capacity − Residual volume",
      "Both B and C are correct"
    ],
    "correct": 3,
    "explanation": "Vital capacity (VC) = maximum amount of air exhaled after maximum inhalation. VC = Tidal Volume (TV) + Inspiratory Reserve Volume (IRV) + Expiratory Reserve Volume (ERV). Also, Total Lung Capacity (TLC) = VC + Residual Volume (RV). Therefore VC = TLC − RV. Both equations B and C are correct definitions of vital capacity. Normal VC ≈ 4600 mL in adults."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 5,
    "chapterName": "Body Fluids and Circulation",
    "topic": "Cardiac Cycle & ECG",
    "question": "In an ECG, the P-wave represents:",
    "options": [
      "Ventricular depolarization",
      "Atrial depolarization (atrial contraction)",
      "Ventricular repolarization",
      "Atrial repolarization"
    ],
    "correct": 1,
    "explanation": "ECG waves: P-wave = atrial depolarization (SA node fires → atria contract). PR interval = AV node delay. QRS complex = ventricular depolarization (ventricles contract — systole). T-wave = ventricular repolarization (ventricles relax — diastole). Atrial repolarization is hidden within the QRS complex. The PR interval represents the time for the impulse to travel from the SA node through the AV node to the ventricles."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 5,
    "chapterName": "Body Fluids and Circulation",
    "topic": "Blood — Components & Functions",
    "question": "The blood group system is based on the presence of antigens on RBCs. A person with blood group O has:",
    "options": [
      "Antigens A and B on RBCs; no antibodies in plasma",
      "No A or B antigens on RBCs; both anti-A and anti-B antibodies in plasma",
      "Antigen O on RBCs; anti-O antibodies in plasma",
      "Antigens A and B on RBCs; anti-A and anti-B antibodies in plasma"
    ],
    "correct": 1,
    "explanation": "ABO blood group: Group O — no A or B antigens on RBC surface; plasma contains both anti-A (α) and anti-B (β) antibodies. Group A — antigen A; anti-B. Group B — antigen B; anti-A. Group AB — antigens A and B; no antibodies. Group O is the universal donor (no antigens to react with recipient's antibodies), while AB is the universal recipient (no antibodies to react)."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Excretory Products and their Elimination",
    "topic": "Nephron Structure & Urine Formation",
    "question": "The countercurrent mechanism in the loop of Henle helps to:",
    "options": [
      "Filter blood at high pressure",
      "Concentrate urine by creating an osmotic gradient in the medulla",
      "Secrete uric acid into the tubule",
      "Reabsorb glucose by active transport"
    ],
    "correct": 1,
    "explanation": "The hairpin loop of Henle acts as a countercurrent multiplier — the descending limb is permeable to water (but not solutes), while the ascending limb actively transports NaCl out (but is impermeable to water). This creates a high osmolality gradient in the medullary interstitium (up to 1200 mOsm/kg at the papilla). This gradient drives water reabsorption from the collecting duct (in presence of ADH), concentrating urine significantly above plasma osmolality."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Excretory Products and their Elimination",
    "topic": "Role of Kidney in Homeostasis & JGA",
    "question": "Renin is secreted by the juxtaglomerular cells (JG cells) of the kidney when:",
    "options": [
      "Blood pressure increases and blood Na⁺ increases",
      "Blood pressure decreases or blood volume decreases",
      "ADH levels are high",
      "Atrial natriuretic peptide (ANP) levels are high"
    ],
    "correct": 1,
    "explanation": "Renin is released by JG cells of afferent arterioles in response to: (1) decreased blood pressure/volume (detected by baroreceptors in JG cells), (2) decreased Na⁺ delivery to macula densa, (3) sympathetic nervous stimulation. Renin initiates the RAAS: Renin → Angiotensin I → ACE → Angiotensin II → aldosterone secretion → Na⁺ retention → increased blood volume/pressure. ANP opposes this (released when BP is too high)."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 7,
    "chapterName": "Locomotion and Movement",
    "topic": "Sliding Filament Theory of Muscle Contraction",
    "question": "During muscle contraction, which of the following statements is CORRECT regarding the sarcomere?",
    "options": [
      "A-band shortens; I-band shortens",
      "A-band remains constant; I-band and H-zone shorten",
      "Both A-band and I-band remain constant; only Z-lines move",
      "Actin and myosin filaments shorten"
    ],
    "correct": 1,
    "explanation": "Sliding filament theory (Huxley and Hanson, 1954): During contraction, thin filaments (actin) slide over thick filaments (myosin) — neither filament shortens. In the sarcomere: A-band (contains myosin, constant length) remains same; I-band (only actin, between A-bands of adjacent sarcomeres) shortens; H-zone (only myosin in center of A-band) shortens; Z-lines move closer together. Sarcomere length decreases."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 8,
    "chapterName": "Neural Control and Coordination",
    "topic": "Action Potential & Nerve Impulse Transmission",
    "question": "During the generation of an action potential, the initial rapid depolarization phase is due to:",
    "options": [
      "Rapid influx of K⁺ ions",
      "Rapid influx of Na⁺ ions through voltage-gated Na⁺ channels",
      "Active transport of Na⁺ by Na⁺/K⁺-ATPase",
      "Outflux of Cl⁻ ions"
    ],
    "correct": 1,
    "explanation": "Action potential phases: (1) Resting potential: −70 mV (maintained by Na⁺/K⁺-ATPase). (2) Depolarization: membrane threshold reached → voltage-gated Na⁺ channels open rapidly → massive Na⁺ influx → membrane potential reverses to +30 mV (overshoot). (3) Repolarization: voltage-gated Na⁺ channels inactivate → voltage-gated K⁺ channels open → K⁺ efflux → membrane repolarizes. (4) Hyperpolarization: brief overshoot of K⁺ efflux takes potential below −70 mV. The initial rapid rise is entirely due to Na⁺ influx."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 8,
    "chapterName": "Neural Control and Coordination",
    "topic": "Reflex Action & Synapse",
    "question": "At a chemical synapse, the neurotransmitter acetylcholine (ACh) is released from:",
    "options": [
      "Postsynaptic membrane into the synaptic cleft",
      "Presynaptic terminal (axon terminal) synaptic vesicles",
      "Schwann cells",
      "Nodes of Ranvier"
    ],
    "correct": 1,
    "explanation": "At a chemical synapse: action potential reaches the presynaptic terminal (axon bulb/bouton) → Ca²⁺ enters through voltage-gated Ca²⁺ channels → synaptic vesicles fuse with presynaptic membrane → ACh (or other neurotransmitter) is released by exocytosis into the synaptic cleft → diffuses to postsynaptic membrane → binds receptors → opens ion channels → new action potential generated (excitatory synapse) or hyperpolarization (inhibitory synapse). ACh is broken down by acetylcholinesterase."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 9,
    "chapterName": "Chemical Coordination and Integration",
    "topic": "Endocrine Glands & Hormones",
    "question": "The hormone that regulates blood calcium levels by promoting calcium deposition in bones and decreasing blood Ca²⁺ is:",
    "options": [
      "Parathyroid hormone (PTH)",
      "Calcitonin",
      "Calcitriol (Vitamin D₃)",
      "Thyroxine"
    ],
    "correct": 1,
    "explanation": "Calcitonin is secreted by parafollicular C-cells of the thyroid gland when blood Ca²⁺ is HIGH. It lowers blood calcium by: inhibiting osteoclast activity (reduces bone resorption), promoting calcium deposition in bones, and increasing renal calcium excretion. PTH (from parathyroid glands) has the opposite effect — raises blood Ca²⁺ by activating osteoclasts (bone resorption), increasing intestinal absorption, and reducing renal excretion."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 9,
    "chapterName": "Chemical Coordination and Integration",
    "topic": "Diabetes — Types & Insulin Mechanism",
    "question": "Insulin, discovered by Banting and Best (1921), lowers blood glucose by which PRIMARY mechanism?",
    "options": [
      "Stimulating glycogenolysis (breakdown of glycogen) in the liver",
      "Promoting glucose uptake by muscle and adipose cells and stimulating glycogenesis",
      "Inhibiting glucagon secretion from alpha cells only",
      "Increasing renal glucose excretion"
    ],
    "correct": 1,
    "explanation": "Insulin (from β-cells of islets of Langerhans) lowers blood glucose primarily by: (1) Promoting glucose uptake into muscle and adipose tissue via GLUT4 transporter translocation to the cell surface. (2) Stimulating glycogenesis (glucose → glycogen) in liver and muscle. (3) Inhibiting gluconeogenesis and glycogenolysis. Banting and Best (1921, University of Toronto) isolated insulin — it was the first protein hormone to be purified and used clinically to treat diabetes mellitus."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 1,
    "chapterName": "Human Reproduction",
    "topic": "Male Reproductive System & Spermatogenesis",
    "question": "Sertoli cells in the seminiferous tubules of the testis:",
    "options": [
      "Produce testosterone",
      "Provide nutrition to developing sperm cells and produce inhibin",
      "Undergo meiosis to produce spermatids",
      "Store mature spermatozoa"
    ],
    "correct": 1,
    "explanation": "Sertoli cells (sustentacular cells) are somatic cells lining the seminiferous tubules that: (1) Provide structural support and nutrition to developing spermatogenic cells. (2) Form the blood-testis barrier (tight junctions). (3) Secrete inhibin (inhibits FSH) and androgen-binding protein (ABP). (4) Secrete MIF (Müllerian inhibiting factor) during fetal development. Testosterone is produced by Leydig cells (interstitial cells) between tubules in response to LH."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 1,
    "chapterName": "Human Reproduction",
    "topic": "Menstrual Cycle & Female Reproductive System",
    "question": "The LH surge that causes ovulation occurs approximately on which day of a 28-day menstrual cycle?",
    "options": [
      "Day 1",
      "Day 14",
      "Day 21",
      "Day 28"
    ],
    "correct": 1,
    "explanation": "In a 28-day cycle: Days 1-5: menstruation. Days 6-13: follicular phase (FSH stimulates follicle growth, estrogen rises). Day 13-14: LH surge (high estrogen triggers LH surge from anterior pituitary). Day 14: ovulation (Graafian follicle ruptures, releasing secondary oocyte). Days 15-28: luteal phase (ruptured follicle → corpus luteum → secretes progesterone + estrogen → prepares endometrium for implantation)."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Reproductive Health",
    "topic": "Contraceptive Methods & Sexually Transmitted Infections",
    "question": "The contraceptive pill (combined oral contraceptive) prevents pregnancy primarily by:",
    "options": [
      "Killing sperm in the vagina",
      "Preventing ovulation through negative feedback on FSH and LH",
      "Preventing implantation of the fertilized egg",
      "Thickening cervical mucus only"
    ],
    "correct": 1,
    "explanation": "Combined oral contraceptives contain synthetic estrogen and progesterone. They prevent pregnancy primarily by: (1) Suppressing FSH and LH via negative feedback on the hypothalamus/pituitary → no follicle development → no ovulation (main mechanism, ~primary). Secondary mechanisms: (2) thickening cervical mucus (impedes sperm), (3) thinning endometrium (reduces implantation). The primary mechanism is inhibition of the midcycle LH surge, preventing ovulation."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Principles of Inheritance and Variation",
    "topic": "Mendelian Genetics — Dihybrid Cross",
    "question": "In a dihybrid cross between AABB × aabb, the F2 generation ratio (phenotypic) is 9:3:3:1. This assumes:",
    "options": [
      "Linkage between the two genes",
      "Independent assortment of genes on different chromosomes",
      "Incomplete dominance of both genes",
      "Codominance of both alleles"
    ],
    "correct": 1,
    "explanation": "The 9:3:3:1 ratio in F2 of a dihybrid cross occurs ONLY when both gene pairs assort independently (Mendel's Law of Independent Assortment) — i.e., the genes are on different (non-homologous) chromosomes. If genes are linked (same chromosome), the ratio deviates from 9:3:3:1. The AaBb × AaBb cross gives 9 A_B_ : 3 A_bb : 3 aaB_ : 1 aabb if genes are unlinked."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Principles of Inheritance and Variation",
    "topic": "Sex-Linked Inheritance & Chromosomal Disorders",
    "question": "A colour-blind woman (X^c X^c) marries a normal-visioned man (X^N Y). What percentage of their sons will be colour blind?",
    "options": [
      "0%",
      "50%",
      "100%",
      "25%"
    ],
    "correct": 2,
    "explanation": "Mother: X^c X^c (colour blind, all eggs carry X^c). Father: X^N Y (normal, sons get Y from father). Sons: X^c (from mother) + Y (from father) = X^c Y (colour blind). All sons will be colour blind (100%). Daughters: X^c (from mother) + X^N (from father) = X^c X^N (carriers, phenotypically normal)."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Molecular Basis of Inheritance",
    "topic": "DNA Replication & Transcription",
    "question": "In prokaryotic DNA replication (e.g., E. coli), the enzyme that removes RNA primers and fills the resulting gaps with DNA nucleotides is:",
    "options": [
      "DNA Polymerase I (Pol I)",
      "DNA Polymerase III (Pol III)",
      "DNA Ligase",
      "Primase"
    ],
    "correct": 0,
    "explanation": "In E. coli: DNA Pol III is the main replicative polymerase (high processivity, synthesizes new strand). DNA Pol I has two key activities: (1) 5'→3' exonuclease removes RNA primers; (2) 5'→3' polymerase fills the gap with DNA. DNA Ligase then seals the nick between Okazaki fragments. Primase synthesizes the short RNA primers. DNA Pol I is the primer-removal enzyme — its absence causes accumulation of unjoined Okazaki fragments."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Molecular Basis of Inheritance",
    "topic": "Genetic Code & Translation",
    "question": "The genetic code is described as 'degenerate.' This means:",
    "options": [
      "Some codons code for no amino acid (nonsense codons)",
      "One codon can code for more than one amino acid",
      "More than one codon can code for the same amino acid",
      "The code has evolved over time"
    ],
    "correct": 2,
    "explanation": "Degeneracy of the genetic code: multiple codons (synonymous codons) can encode the same amino acid. E.g., Leucine has 6 codons (UUA, UUG, CUU, CUC, CUA, CUG). Serine also has 6 codons. Most amino acids have at least 2 codons. Only Met (AUG) and Trp (UGG) have single codons. 64 codons total: 61 sense + 3 stop (UAA, UAG, UGA). Degeneracy is NOT the same as ambiguity (one codon = one AA is unambiguous)."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Evolution",
    "topic": "Natural Selection & Darwinism",
    "question": "Industrial melanism in peppered moth (Biston betularia) is an example of:",
    "options": [
      "Disruptive selection",
      "Directional selection",
      "Stabilizing selection",
      "Sexual selection"
    ],
    "correct": 1,
    "explanation": "Industrial melanism: before industrialization, light-colored moths survived (camouflaged on lichen-covered trees); after soot from factories darkened trees, dark (melanic) moths had survival advantage. The population shifted from predominantly light to predominantly dark forms — a shift in the mean phenotype in one direction. This is directional selection (natural selection favoring one extreme phenotype)."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Evolution",
    "topic": "Hardy-Weinberg Principle",
    "question": "In a population at Hardy-Weinberg equilibrium, if the frequency of the recessive allele 'a' is 0.3, the frequency of homozygous dominant individuals (AA) is:",
    "options": [
      "0.09",
      "0.49",
      "0.42",
      "0.70"
    ],
    "correct": 1,
    "explanation": "If q (frequency of 'a') = 0.3, then p (frequency of 'A') = 1 − 0.3 = 0.7. Frequency of AA = p² = (0.7)² = 0.49. Frequency of Aa = 2pq = 2 × 0.7 × 0.3 = 0.42. Frequency of aa = q² = 0.09. Check: 0.49 + 0.42 + 0.09 = 1.00 ✓"
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Human Health and Disease",
    "topic": "Immunity — Active & Passive",
    "question": "Secondary immune response is more rapid and of higher magnitude than the primary response because of:",
    "options": [
      "Higher dose of antigen in second exposure",
      "Memory B and T cells that persist after the primary response",
      "Faster non-specific inflammatory response",
      "Increased production of complement proteins"
    ],
    "correct": 1,
    "explanation": "After a primary immune response, a subset of B and T lymphocytes differentiate into long-lived memory cells. These cells: (1) are present in greater numbers than naïve cells, (2) have already undergone V(D)J recombination and affinity maturation (B cells), (3) respond faster (hours vs days) and more vigorously on re-exposure to the same antigen. Memory cells are the immunological basis of vaccination, immunity, and immunological memory."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Human Health and Disease",
    "topic": "Diseases — Bacterial, Viral & Cancer",
    "question": "The characteristic recurring fever and chills in malaria are caused by:",
    "options": [
      "Sporozoites entering liver cells from the bloodstream",
      "Synchronous rupture of RBCs releasing merozoites and toxic haemozoin into the blood",
      "Gametocytes multiplying rapidly in the mosquito midgut",
      "The initial bite of infected female Anopheles mosquito"
    ],
    "correct": 1,
    "explanation": "The hallmark of malaria — periodic chills and fever — occurs when RBCs undergo synchronous rupture (erythrocytic schizogony): the infected RBCs burst simultaneously, releasing merozoites and toxic haemozoin (malarial pigment, a breakdown product of haemoglobin) into the bloodstream. This triggers the immune system → high fever. The fever cycle differs by species: P. vivax/ovale = 48h (tertian), P. malariae = 72h (quartan), P. falciparum = irregular but often 36-48h. All four Plasmodium species cause fever by this mechanism."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 7,
    "chapterName": "Strategies for Enhancement in Food Production",
    "topic": "Animal Husbandry & Breeding",
    "question": "MOET (Multiple Ovulation Embryo Transfer Technology) is used in animal husbandry to:",
    "options": [
      "Produce transgenic animals",
      "Increase herd size of genetically superior animals rapidly",
      "Clone animals by somatic cell nuclear transfer",
      "Produce animals resistant to diseases"
    ],
    "correct": 1,
    "explanation": "MOET (Multiple Ovulation Embryo Transfer): A high-quality donor female is injected with gonadotropins → superovulation (6-8 eggs instead of 1). She is mated with a superior bull (or artificially inseminated). Fertilized embryos (8-32 cell stage) are collected and transferred to surrogate mothers. This allows one genetically superior cow to produce many offspring per year (instead of 1), rapidly multiplying superior genetics in the herd."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 8,
    "chapterName": "Microbes in Human Welfare",
    "topic": "Industrial Microbiology & Biogas",
    "question": "The gas produced during secondary sewage treatment (activated sludge process) in large digesters that can be used as fuel is:",
    "options": [
      "Hydrogen",
      "Biogas (methane CH₄)",
      "Carbon dioxide",
      "Nitrogen"
    ],
    "correct": 1,
    "explanation": "In sewage treatment: Primary treatment removes solid particles (sedimentation). Secondary (biological) treatment: aerobic activated sludge process reduces BOD using aerobic microbes. The flocs (sludge) are then anaerobically digested in large tanks by methanogenic bacteria (Methanobacterium, Methanococcus). These produce biogas: mainly methane (CH₄, ~60%), CO₂ (~40%), and traces of H₂S. Biogas is used as fuel in rural India (gobar gas plants)."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 9,
    "chapterName": "Biotechnology: Principles and Processes",
    "topic": "Recombinant DNA Technology",
    "question": "Restriction enzymes (endonucleases) that cut DNA at specific sequences generate sticky ends. The advantage of sticky ends in recombinant DNA technology is:",
    "options": [
      "They allow DNA fragments to be separated by gel electrophoresis",
      "They allow easy joining of compatible fragments by complementary base pairing before ligation",
      "They prevent DNA degradation by DNases",
      "They allow direct protein expression from the cut site"
    ],
    "correct": 1,
    "explanation": "Restriction endonucleases that create staggered cuts (e.g., EcoRI, HindIII) generate single-stranded overhanging ends (sticky ends or cohesive ends) that are complementary to each other. When a vector and insert are cut with the same enzyme, their complementary sticky ends can hydrogen-bond (anneal) to each other, holding them in position for DNA ligase to covalently seal the nicks. This greatly facilitates efficient ligation and directional cloning."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 9,
    "chapterName": "Biotechnology: Principles and Processes",
    "topic": "PCR — Polymerase Chain Reaction",
    "question": "In PCR, the annealing step involves:",
    "options": [
      "Denaturation of double-stranded DNA at ~95°C",
      "Primers binding to complementary single-stranded DNA templates (~50-65°C)",
      "DNA synthesis by Taq polymerase at ~72°C",
      "Gel electrophoresis of amplified products"
    ],
    "correct": 1,
    "explanation": "PCR has three temperature cycles: (1) Denaturation (~94-96°C): double-stranded DNA is denatured into single strands. (2) Annealing (~50-65°C): specific short primers (oligonucleotides) bind to complementary sequences on each template strand. Temperature depends on primer melting temperature (Tm). (3) Extension (~72°C): Taq DNA polymerase (thermostable, from Thermus aquaticus) extends from primers, synthesizing new complementary DNA strands. ~30-40 cycles → exponential amplification."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 10,
    "chapterName": "Biotechnology and Its Applications",
    "topic": "Transgenic Organisms & Bt Cotton",
    "question": "Bt toxin from Bacillus thuringiensis kills insects because:",
    "options": [
      "It binds to and blocks neuroreceptors in the insect brain",
      "The protoxin is activated by alkaline gut pH of insects, forming pores in midgut epithelial cells, causing death",
      "It inhibits chitin synthesis in the insect exoskeleton",
      "It interferes with insect hormone signaling"
    ],
    "correct": 1,
    "explanation": "Bacillus thuringiensis produces crystal (Cry) proteins (protoxins). When ingested by insect larvae: the alkaline conditions of the insect gut (pH 9-11) activate the protoxin → active Bt toxin binds to specific receptors (cadherin) on midgut epithelial cells → inserts into membrane → creates pores → osmotic imbalance → cell lysis → larval death. The toxin is specific to certain insect orders (Lepidoptera, Diptera, etc.) and non-toxic to vertebrates (acidic stomach pH inactivates it)."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 10,
    "chapterName": "Biotechnology and Its Applications",
    "topic": "Gene Therapy & Molecular Diagnostics",
    "question": "The first human disease treated by gene therapy (1990) involved introducing a functional gene for the enzyme:",
    "options": [
      "Phenylalanine hydroxylase (PKU)",
      "Adenosine deaminase (ADA) — for SCID",
      "Dystrophin (Duchenne muscular dystrophy)",
      "Insulin (Type 1 diabetes)"
    ],
    "correct": 1,
    "explanation": "The first approved gene therapy (1990, W. French Anderson, NIH) treated a 4-year-old girl with Severe Combined Immunodeficiency (SCID) caused by adenosine deaminase (ADA) deficiency. Functional ADA gene was introduced into her T-lymphocytes using a retroviral vector. Accumulated deoxyadenosine (due to ADA deficiency) is toxic to T and B lymphocytes. The treatment restored immune function. This landmark event opened the era of human gene therapy."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 3,
    "chapterName": "Digestion and Absorption",
    "topic": "Liver Functions & Bile",
    "question": "Which of the following is NOT a function of the liver?",
    "options": [
      "Synthesis of plasma proteins (albumin, globulin, fibrinogen)",
      "Detoxification of harmful substances",
      "Production of digestive enzymes (lipase, amylase)",
      "Glycogen storage and gluconeogenesis"
    ],
    "correct": 2,
    "explanation": "The liver does NOT produce digestive enzymes like lipase or amylase. Digestive enzymes are secreted by the pancreas (pancreatic juice) and intestinal glands. The liver produces bile (for fat emulsification, not enzymatic digestion). Liver functions include: synthesis of plasma proteins (albumin, globulin, clotting factors), detoxification (drugs, alcohol), glycogen storage, gluconeogenesis, bile production, cholesterol synthesis, vitamin storage (A, D, B12)."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 4,
    "chapterName": "Breathing and Exchange of Gases",
    "topic": "CO₂ Transport in Blood",
    "question": "The majority (~70%) of CO₂ is transported in blood as:",
    "options": [
      "Dissolved in plasma",
      "Carbaminohemoglobin",
      "Bicarbonate ions (HCO₃⁻) in plasma",
      "Carbonic acid (H₂CO₃)"
    ],
    "correct": 2,
    "explanation": "CO₂ transport in blood: ~70% as HCO₃⁻ (bicarbonate ions) in plasma — formed by CO₂ + H₂O → H₂CO₃ (catalyzed by carbonic anhydrase in RBCs) → H⁺ + HCO₃⁻ (HCO₃⁻ exits into plasma via chloride shift). ~20-25% as carbaminohemoglobin (CO₂ bound to amino groups of Hb). ~7-10% dissolved in plasma. The bicarbonate mechanism is the dominant CO₂ transport route."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 5,
    "chapterName": "Body Fluids and Circulation",
    "topic": "Lymphatic System",
    "question": "Lymph is similar to plasma but has lower protein concentration. The function of lymph includes:",
    "options": [
      "Direct O₂ transport to tissues",
      "Transporting fats from intestine, immune surveillance, and returning interstitial fluid to circulation",
      "Clotting of blood at wound sites",
      "Maintaining blood pressure by direct vasoconstriction"
    ],
    "correct": 1,
    "explanation": "Lymph (tissue fluid that has entered lymphatic capillaries) functions: (1) Transports dietary fats/fat-soluble vitamins from intestinal lacteals → thoracic duct → blood. (2) Returns excess interstitial fluid (and proteins) to circulation, preventing edema. (3) Immune surveillance — lymph nodes along lymphatic vessels filter lymph; immune cells (lymphocytes, macrophages) monitor for pathogens/antigens. (4) Lymph nodes house lymphocytes that are activated by antigens."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 8,
    "chapterName": "Neural Control and Coordination",
    "topic": "Brain Structure & Functions",
    "question": "The part of the brain that coordinates voluntary movements, maintains posture and balance, and ensures precision of muscular activity is the:",
    "options": [
      "Cerebrum (cerebral cortex)",
      "Cerebellum",
      "Medulla oblongata",
      "Hypothalamus"
    ],
    "correct": 1,
    "explanation": "Cerebellum (hindbrain): coordinates voluntary movements (smoothing and precision), maintains posture and equilibrium (using input from proprioceptors, semicircular canals, visual cortex). Damage → ataxia (uncoordinated movements), intention tremor, loss of balance. Cerebrum: voluntary actions, intelligence, memory, speech. Medulla oblongata: controls vital reflexes (breathing, heart rate, swallowing). Hypothalamus: thermoregulation, hunger, thirst, sleep, neuroendocrine control."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Excretory Products and their Elimination",
    "topic": "Kidney Disorders & Dialysis",
    "question": "In haemodialysis, the principle used to remove metabolic wastes from blood is:",
    "options": [
      "Osmosis across a semipermeable membrane",
      "Diffusion of solutes across a dialysis membrane (cellophane) down concentration gradients",
      "Active transport by artificial kidney cells",
      "Ultrafiltration under very high pressure"
    ],
    "correct": 1,
    "explanation": "Haemodialysis (artificial kidney): blood is passed through a dialysis machine where it flows on one side of a semipermeable membrane (dialysis tubing/cellophane), and dialysate (buffer solution similar to normal plasma without waste products) flows on the other side. Waste products (urea, creatinine, K⁺, H⁺) diffuse down their concentration gradients from blood to dialysate. The dialysate is formulated to prevent loss of essential nutrients like glucose. The process is purely physical — diffusion across concentration gradient."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 9,
    "chapterName": "Chemical Coordination and Integration",
    "topic": "Pituitary Gland — Anterior & Posterior",
    "question": "ADH (antidiuretic hormone/vasopressin) is synthesized in the hypothalamus but released from the:",
    "options": [
      "Anterior pituitary (adenohypophysis)",
      "Posterior pituitary (neurohypophysis)",
      "Adrenal medulla",
      "Thyroid gland"
    ],
    "correct": 1,
    "explanation": "ADH and oxytocin are unique: they are synthesized in hypothalamic neurons (supraoptic and paraventricular nuclei) but transported down axons to the posterior pituitary (neurohypophysis) for storage and release. The posterior pituitary does not synthesize these hormones — it merely stores and releases them. ADH targets: collecting duct of nephron (increases water permeability → more water reabsorption → concentrated urine), blood vessels (vasoconstriction). Deficiency → diabetes insipidus."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Reproductive Health",
    "topic": "Assisted Reproductive Technologies (ART)",
    "question": "In IVF-ET (In Vitro Fertilization and Embryo Transfer), the embryo is transferred to the uterus at which stage?",
    "options": [
      "Zygote stage (1-cell)",
      "8-cell stage",
      "Blastocyst stage",
      "Gastrula stage"
    ],
    "correct": 1,
    "explanation": "In IVF-ET (test-tube baby technique): eggs and sperm are allowed to fertilize in vitro (in a culture dish). The embryo is cultured for 2-3 days until it reaches the 8-cell stage (morula/early cleavage), then transferred to the uterus of the woman (ET = embryo transfer) for implantation and development. Transferring at 8-cell stage allows time to assess development while still at an optimal stage for implantation. Blastocyst transfer is also used in modern practice for higher success rates."
  },
  {
    "subject": "Physics",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Electrostatic Potential and Capacitance",
    "topic": "Electric Potential — Point Charge & Equipotential Surfaces",
    "question": "Two equipotential surfaces can never intersect each other because:",
    "options": [
      "They have different charge densities",
      "At any point, the electric field would have two directions simultaneously, which is impossible",
      "They are always concentric spheres",
      "The potential difference between them is always constant"
    ],
    "correct": 1,
    "explanation": "At any point in space, the electric field is uniquely defined — it has one specific direction (perpendicular to the equipotential surface at that point). If two equipotential surfaces intersected, the point of intersection would have two different equipotential values simultaneously (since each surface has a unique potential), which is impossible (a point cannot have two potentials). Also, E would need to be perpendicular to both surfaces simultaneously, requiring two directions — impossible."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 5,
    "chapterName": "Anatomy of Flowering Plants",
    "topic": "Types of Tissue — Sclerenchyma & Collenchyma",
    "question": "Collenchyma provides mechanical support especially to growing parts of the plant. It differs from sclerenchyma because:",
    "options": [
      "Collenchyma cells are dead; sclerenchyma cells are living",
      "Collenchyma has living cells with unevenly thickened primary walls (no lignin); sclerenchyma has dead cells with uniformly thick lignified walls",
      "Collenchyma is found only in roots; sclerenchyma only in leaves",
      "Both are identical in structure"
    ],
    "correct": 1,
    "explanation": "Collenchyma: living cells, unevenly thickened primary cell walls (thickenings at corners — angular collenchyma, or along tangential walls), no lignin. Found beneath epidermis in herbaceous dicot stems (e.g., celery ribs). Provides flexibility + support. Sclerenchyma: dead cells at maturity, uniformly thick lignified secondary walls (fibers and sclereids). Provides rigid mechanical support. Found in fibres (flax, hemp) and stone cells (in coconut shell, pear grit)."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 6,
    "chapterName": "Cell — The Unit of Life",
    "topic": "Nucleus — Structure & Function",
    "question": "The nuclear pore complex (NPC) is responsible for:",
    "options": [
      "DNA replication inside the nucleus",
      "Selective transport of molecules between nucleus and cytoplasm",
      "Synthesis of rRNA in the nucleolus",
      "Maintaining the shape of the nucleus"
    ],
    "correct": 1,
    "explanation": "Nuclear pore complexes (NPCs) are large protein complexes (~120 MDa) embedded in the nuclear envelope at sites where inner and outer membranes fuse. They regulate selective transport: small molecules (<40 kDa) pass freely by diffusion; larger molecules (proteins with NLS — nuclear localization signal, and RNA export) require active, energy-dependent transport through the NPC. mRNA exits nucleus through NPCs; ribosomal proteins enter."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 2,
    "chapterName": "Sexual Reproduction in Flowering Plants",
    "topic": "Pollination — Types & Agents",
    "question": "Cleistogamous flowers ensure self-pollination because they:",
    "options": [
      "Have both stamens and carpels on different plants",
      "Never open — pollination and fertilization occur within the closed bud",
      "Have sticky pollen that adheres to the same flower",
      "Release pollen only at night when insects are not active"
    ],
    "correct": 1,
    "explanation": "Cleistogamous flowers (e.g., Viola, Oxalis, Commelina) never open (remain closed) — they are permanently closed buds. Anthers dehisce inside the closed flower and pollen directly contacts the stigma, ensuring self-pollination (autogamy). This guarantees seed production even when pollinators are absent (e.g., in adverse conditions). Chasmogamous flowers (normal open flowers) can be cross-pollinated. Many plants produce both types."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Organisms and Populations",
    "topic": "Ecotypes & Adaptations",
    "question": "Allen's rule states that animals in colder climates tend to have:",
    "options": [
      "Larger body size to minimize surface area to volume ratio",
      "Shorter and smaller extremities (ears, limbs, tails) to reduce heat loss",
      "More body hair for insulation",
      "Higher metabolic rate only"
    ],
    "correct": 1,
    "explanation": "Allen's rule (1877): homeothermic (warm-blooded) animals in colder climates have shorter, smaller appendages (ears, limbs, tails, beaks) to minimize surface area/volume ratio, reducing heat loss to the cold environment. Examples: Arctic fox has small ears vs. desert fennec fox's huge ears. Bergmann's rule (companion rule) states body size is larger in colder climates (larger body = lower SA/V ratio = less heat loss per unit mass)."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 4,
    "chapterName": "Ecosystem",
    "topic": "Food Chains & Trophic Levels",
    "question": "The 10% energy law (Lindeman's efficiency) states that energy available at each successive trophic level is approximately:",
    "options": [
      "Equal to the previous trophic level",
      "10% of the energy at the previous trophic level",
      "90% of the energy at the previous trophic level",
      "Double the previous trophic level"
    ],
    "correct": 1,
    "explanation": "Lindeman's 10% law (1942): only about 10% of energy fixed at one trophic level is transferred to and available at the next trophic level. The remaining 90% is lost as: heat (respiration), undigested material, excretion. Example: 1000 J at producers → 100 J at primary consumers → 10 J at secondary consumers → 1 J at tertiary consumers. This limits food chains to typically 4-5 levels. This is called ecological efficiency or Lindeman's efficiency."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Biodiversity and Conservation",
    "topic": "Species Diversity Indices",
    "question": "The relationship between species richness and area (Species-Area relationship) is expressed as:",
    "options": [
      "S = C × A^z (log S = log C + z log A)",
      "S = C + log A",
      "S = C/A",
      "S = C × e^A"
    ],
    "correct": 0,
    "explanation": "The Species-Area relationship (Arrhenius, 1921): S = C × A^z, or in linear form: log S = log C + z log A (gives a straight line on log-log plot). S = species richness, A = area, C = y-intercept (measure of species richness), z = slope (species-area regression coefficient). z values typically 0.1-0.2 for small islands/same continent, but 0.6-1.2 for large areas/different continents. Doubling the area increases species richness by ~20-25%."
  },
  {
    "subject": "Botany",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Environmental Issues",
    "topic": "Solid Waste Management & E-waste",
    "question": "The 'Montreal Protocol' (1987) was signed to address:",
    "options": [
      "Carbon dioxide emissions and climate change",
      "Ozone depleting substances (ODS) — CFCs, HCFCs, halons",
      "River pollution by industrial effluents",
      "International biodiversity conservation"
    ],
    "correct": 1,
    "explanation": "The Montreal Protocol on Substances that Deplete the Ozone Layer (1987, Montreal, Canada) is an international treaty that regulates the production and use of ozone-depleting substances (ODS): CFCs, HCFCs (hydrochlorofluorocarbons), halons, carbon tetrachloride, methyl bromide. It has been universally ratified (197 countries) and is considered the most successful environmental treaty. The Kyoto Protocol (1997) deals with greenhouse gas emissions (climate change)."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 9,
    "chapterName": "Transport in Plants",
    "topic": "Osmosis & Plasmolysis",
    "question": "When a plant cell is placed in a hypertonic solution, the cell undergoes plasmolysis. The point at which the plasma membrane just begins to pull away from the cell wall is called:",
    "options": [
      "Full turgor",
      "Incipient plasmolysis",
      "Flaccidity",
      "Permanent wilting"
    ],
    "correct": 1,
    "explanation": "When cells are placed in progressively more concentrated (hypertonic) solutions: (1) Turgor decreases. (2) Incipient plasmolysis: the point at which the plasma membrane just starts to pull away from the cell wall — water potential of cell = water potential of external solution (osmotic potential = water potential, since pressure potential = 0). At this point ψp = 0 and ψs = ψ (external). Beyond this, the protoplast shrinks away from the wall (plasmolysis)."
  },
  {
    "subject": "Zoology",
    "neetClass": "11",
    "chapterNo": 7,
    "chapterName": "Locomotion and Movement",
    "topic": "Types of Joints & Bones",
    "question": "The joint between the atlas (C1) and axis (C2) vertebrae that allows rotational movement of the head is:",
    "options": [
      "Ball and socket joint",
      "Pivot joint",
      "Hinge joint",
      "Gliding joint"
    ],
    "correct": 1,
    "explanation": "The atlanto-axial joint (between atlas/C1 and axis/C2) is a pivot joint — the odontoid process (dens) of the axis acts as a pivot, and the atlas rotates around it, allowing the head to turn left and right (saying 'no'). Ball-and-socket joints (shoulder, hip) allow multiaxial movement. Hinge joints (elbow, knee) allow uniaxial flexion/extension. Gliding (plane) joints allow limited sliding movement."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 3,
    "chapterName": "Principles of Inheritance and Variation",
    "topic": "Chromosomal Abnormalities",
    "question": "Down syndrome (Trisomy 21) is caused by non-disjunction. The risk of non-disjunction increases with:",
    "options": [
      "Father's age only",
      "Mother's age (especially >35 years), as oocytes are arrested in meiosis I since fetal development",
      "Number of pregnancies only",
      "Father's exposure to radiation"
    ],
    "correct": 1,
    "explanation": "Down syndrome (47, +21 chromosomes) is caused by non-disjunction of chromosome 21 during meiosis (usually meiosis I) in the egg. The risk increases significantly with maternal age (>35 years risk is 1/365; >45 years risk is ~1/30) because all primary oocytes are arrested in prophase I since fetal development and resume meiosis only at ovulation — older oocytes have had more time for spindle damage/failure. The mother contributes the extra chromosome in ~95% of cases."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 5,
    "chapterName": "Evolution",
    "topic": "Origin of Life & Chemical Evolution",
    "question": "The Miller-Urey experiment (1953) demonstrated that:",
    "options": [
      "Life can arise spontaneously from inorganic matter under any conditions",
      "Organic molecules (amino acids) can be synthesized abiotically from inorganic gases under simulated early Earth conditions",
      "DNA was the first genetic material on primitive Earth",
      "Photosynthesis evolved before life began"
    ],
    "correct": 1,
    "explanation": "Stanley Miller and Harold Urey (1953) created a simulated early Earth atmosphere (CH₄, NH₃, H₂, H₂O vapor) in a closed apparatus with electrical sparks (simulating lightning). After one week, they found various organic compounds including amino acids (glycine, alanine), urea, lactic acid. This experimentally supported the Oparin-Haldane hypothesis of abiotic synthesis of organic compounds and chemical evolution as a precursor to life. It showed amino acids can form without living organisms."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 6,
    "chapterName": "Human Health and Disease",
    "topic": "Cancer — Types & Oncogenes",
    "question": "Proto-oncogenes are normal cellular genes. They cause cancer when they:",
    "options": [
      "Are expressed at normal levels in dividing cells",
      "Mutate to become oncogenes — causing uncontrolled cell proliferation",
      "Are silenced by tumor suppressor genes",
      "Are expressed only in germ cells"
    ],
    "correct": 1,
    "explanation": "Proto-oncogenes (e.g., ras, myc, src) are normal genes encoding proteins involved in cell growth and division (growth factors, receptors, signal transducers). When mutated (point mutation, amplification, translocation), they become oncogenes that produce overactive or constitutively active proteins → uncontrolled cell division → cancer. Classic example: ras mutation (found in ~30% of human cancers). Tumor suppressor genes (e.g., p53, Rb) normally inhibit growth; their loss also leads to cancer."
  },
  {
    "subject": "Zoology",
    "neetClass": "12",
    "chapterNo": 8,
    "chapterName": "Microbes in Human Welfare",
    "topic": "Antibiotics & Fermentation",
    "question": "Penicillin was discovered by Alexander Fleming in 1928 from the mold:",
    "options": [
      "Aspergillus niger",
      "Penicillium notatum",
      "Streptomyces griseus",
      "Rhizopus stolonifer"
    ],
    "correct": 1,
    "explanation": "Alexander Fleming (1928) noticed that colonies of Staphylococcus bacteria were being lysed in the zone around a contaminant mold, Penicillium notatum (later reclassified as P. chrysogenum). He identified the antimicrobial substance as penicillin. Florey and Chain (1940s) purified it for therapeutic use. Penicillin inhibits bacterial cell wall synthesis (transpeptidase/PBP enzyme). Streptomycin comes from Streptomyces griseus. Aspergillus niger is used to produce citric acid."
  },
  {
    "subject": "Chemistry",
    "neetClass": "11",
    "chapterNo": 7,
    "chapterName": "Equilibrium",
    "topic": "Solubility Product (Ksp)",
    "question": "The solubility product of AgCl is 1.8×10⁻¹⁰ at 25°C. The molar solubility of AgCl in pure water is:",
    "options": [
      "1.34×10⁻⁵ M",
      "1.8×10⁻¹⁰ M",
      "9×10⁻¹¹ M",
      "3.6×10⁻¹⁰ M"
    ],
    "correct": 0,
    "explanation": "AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq). If molar solubility = s, then [Ag⁺] = s and [Cl⁻] = s. Ksp = [Ag⁺][Cl⁻] = s × s = s². s = √(1.8×10⁻¹⁰) = √(18×10⁻¹¹) = √18 × 10⁻⁵·⁵ ≈ 4.24×10⁻⁵·⁵... = √(1.8) × 10⁻⁵ = 1.342×10⁻⁵ M ≈ 1.34×10⁻⁵ M."
  },
  {
    "subject": "Botany",
    "neetClass": "11",
    "chapterNo": 10,
    "chapterName": "Mineral Nutrition",
    "topic": "Hydroponics & Deficiency Symptoms",
    "question": "Yellowing of leaves (chlorosis) starting from older/lower leaves and progressing upward is characteristic of deficiency of:",
    "options": [
      "Iron (Fe)",
      "Nitrogen (N)",
      "Calcium (Ca)",
      "Sulfur (S)"
    ],
    "correct": 1,
    "explanation": "Nitrogen is a mobile nutrient — when deficient, the plant remobilizes N from older (lower) leaves to newer (upper) growing tissues. Therefore, nitrogen deficiency shows chlorosis first in older/lower leaves. Iron and calcium deficiencies show symptoms in young/upper leaves first because Fe²⁺ and Ca²⁺ are immobile and cannot be remobilized. Sulfur deficiency shows in young leaves. Mobility of nutrient determines which leaves show symptoms first."
  }
];