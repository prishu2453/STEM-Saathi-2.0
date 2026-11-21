import type {
  PhysicsModuleMeta,
  QuizQuestion,
  ResourcePack,
  SupportingWorldMeta,
  TeacherAssignment,
} from '../types/stem';

export const PHYSICS_HERO_IMAGE = '/src/assets/images/physics_world_hero_1794896377515.jpg';

export const PHYSICS_MODULES: PhysicsModuleMeta[] = [
  {
    id: 'mechanics',
    title: {
      en: 'Mechanics & Motion',
      hi: 'यांत्रिकी और गति',
      kn: 'ಯಂತ್ರಶಾಸ್ತ್ರ ಮತ್ತು ಚಲನೆ',
    },
    subtitle: {
      en: 'Projectile trajectory, energy conservation & gravitational acceleration',
      hi: 'प्रक्षेप्य गति, ऊर्जा संरक्षण और गुरुत्वीय त्वरण',
      kn: 'ಪ್ರಕ್ಷೇಪಕ ಪಥ, ಶಕ್ತಿ ಸಂರಕ್ಷಣೆ ಮತ್ತು ಗುರುತ್ವ ವೇಗೋತ್ಕರ್ಷ',
    },
    formula: 'R = (v₀² · sin 2θ) / g   |   E = ½mv² + mgh',
    keyConcept: {
      en: 'Horizontal velocity remains constant (v₀ cos θ) while vertical motion accelerates downward at g = 9.81 m/s². Maximum range occurs at 45°.',
      hi: 'क्षैतिज वेग स्थिर (v₀ cos θ) रहता है जबकि ऊर्ध्वाधर गति g = 9.81 m/s² से नीचे त्वरित होती है। अधिकतम परास 45° पर प्राप्त होती है।',
      kn: 'ಸಮತಲ ವೇಗವು ಸ್ಥಿರವಾಗಿರುತ್ತದೆ (v₀ cos θ), ಆದರೆ ಲಂಬ ಚಲನೆಯು g = 9.81 m/s² ನಲ್ಲಿ ವೇಗವರ್ಧನೆಯಾಗುತ್ತದೆ. 45° ಕೋನದಲ್ಲಿ ಗರಿಷ್ಠ ದೂರ ಸಿಗುತ್ತದೆ.',
    },
    experimentTitle: {
      en: 'Practical 01: Projectile Range vs Launch Angle',
      hi: 'प्रयोग 01: प्रक्षेपण कोण बनाम परास',
      kn: 'ಪ್ರಾಯೋಗಿಕ 01: ಉಡಾವಣಾ ಕೋನ ಮತ್ತು ವ್ಯಾಪ್ತಿ',
    },
    experimentSteps: [
      {
        en: 'Fix initial velocity at 24 m/s and gravity at 9.81 m/s².',
        hi: 'प्रारंभिक वेग 24 m/s और गुरुत्व 9.81 m/s² पर स्थिर रखें।',
        kn: 'ಆರಂಭಿಕ ವೇಗವನ್ನು 24 m/s ಮತ್ತು ಗುರುತ್ವವನ್ನು 9.81 m/s² ಗೆ ನಿಗದಿಪಡಿಸಿ.',
      },
      {
        en: 'Record horizontal range at 30°, 45°, and 60° into the lab log.',
        hi: '30°, 45°, और 60° पर क्षैतिज परास को लैब तालिका में दर्ज करें।',
        kn: '30°, 45°, ಮತ್ತು 60° ಕೋನಗಳಲ್ಲಿ ದೂರವನ್ನು ದಾಖಲಿಸಿ.',
      },
      {
        en: 'Verify that complementary angles (30° and 60°) yield identical range.',
        hi: 'सत्यापित करें कि पूरक कोण (30° और 60°) समान परास देते हैं।',
        kn: 'ಪೂರಕ ಕೋನಗಳು (30° ಮತ್ತು 60°) ಒಂದೇ ದೂರವನ್ನು ನೀಡುತ್ತವೆ ಎಂದು ಪರಿಶೀಲಿಸಿ.',
      },
    ],
    sampleNumerical:
      'A cricket ball is thrown at 28 m/s at an angle of 35° above the horizontal (g = 9.8 m/s²). Calculate maximum height, time of flight, and horizontal range.',
  },
  {
    id: 'electricity',
    title: {
      en: 'Electricity & Circuits',
      hi: 'विद्युत और परिपथ',
      kn: 'ವಿದ್ಯುತ್ ಮತ್ತು ಸರ್ಕ್ಯೂಟ್‌ಗಳು',
    },
    subtitle: {
      en: "Ohm's Law, series vs parallel resistance & electron drift current",
      hi: 'ओम का नियम, श्रेणी व समानांतर प्रतिरोध और इलेक्ट्रॉन प्रवाह',
      kn: 'ಓಮ್ ನಿಯಮ, ಸರಣಿ ಮತ್ತು ಸಮಾನಾಂತರ ರೋಧ',
    },
    formula: 'V = I · R_eq   |   P = V · I = I²R',
    keyConcept: {
      en: 'In series circuits, current is identical through every resistor and resistances add (R₁ + R₂). In parallel circuits, voltage is shared equally and total resistance drops below the smallest branch.',
      hi: 'श्रेणी परिपथ में धारा समान रहती है और प्रतिरोध जुड़ते हैं (R₁ + R₂)। समानांतर परिपथ में वोल्टता समान होती है और कुल प्रतिरोध कम हो जाता है।',
      kn: 'ಸರಣಿ ಸರ್ಕ್ಯೂಟ್‌ನಲ್ಲಿ ವಿದ್ಯುತ್ ಪ್ರವಾಹ ಒಂದೇ ಆಗಿರುತ್ತದೆ (R₁ + R₂). ಸಮಾನಾಂತರದಲ್ಲಿ ವೋಲ್ಟೇಜ್ ಒಂದೇ ಆಗಿದ್ದು ಒಟ್ಟು ರೋಧ ಕಡಿಮೆಯಾಗುತ್ತದೆ.',
    },
    experimentTitle: {
      en: "Practical 02: Verifying Ohm's Law (V–I Slope)",
      hi: 'प्रयोग 02: ओम के नियम का सत्यापन',
      kn: 'ಪ್ರಾಯೋಗಿಕ 02: ಓಮ್ ನಿಯಮ ಪರಿಶೀಲನೆ',
    },
    experimentSteps: [
      {
        en: 'Keep R₁ = 10 Ω in Series mode and vary source voltage from 3 V to 12 V.',
        hi: 'श्रेणी क्रम में R₁ = 10 Ω रखकर वोल्टेज को 3 V से 12 V तक बदलें।',
        kn: 'ಸರಣಿ ಕ್ರಮದಲ್ಲಿ R₁ = 10 Ω ಇರಿಸಿ ವೋಲ್ಟೇಜ್ ಅನ್ನು 3 V ನಿಂದ 12 V ವರೆಗೆ ಬದಲಾಯಿಸಿ.',
      },
      {
        en: 'Log current (I) readings and switch to Parallel to compare current draw.',
        hi: 'धारा (I) के मान दर्ज करें और समानांतर क्रम से तुलना करें।',
        kn: 'ವಿದ್ಯುತ್ ಪ್ರವಾಹ (I) ಅನ್ನು ದಾಖಲಿಸಿ ಮತ್ತು ಸಮಾನಾಂತರ ಕ್ರಮದೊಂದಿಗೆ ಹೋಲಿಸಿ.',
      },
    ],
    sampleNumerical:
      'Two resistors of 12 Ω and 24 Ω are connected in parallel across a 12 V battery. Find the equivalent resistance, total current, and power dissipated.',
  },
  {
    id: 'magnetism',
    title: {
      en: 'Magnetism & 3D Induction',
      hi: 'चुंबकत्व और 3D प्रेरण',
      kn: 'ಕಾಂತೀಯತೆ ಮತ್ತು 3D ಪ್ರೇರಣೆ',
    },
    subtitle: {
      en: "3D Faraday's Law solenoid, magnetic flux & Lenz's opposing EMF",
      hi: '3D फैराडे का नियम, चुंबकीय फ्लक्स और लेंज़ का नियम',
      kn: '3D ಫ್ಯಾರಡೆ ನಿಯಮ, ಕಾಂತೀಯ ಫ್ಲಕ್ಸ್ ಮತ್ತು ಲೆಂಜ್ ನಿಯಮ',
    },
    formula: 'ε = -N · (ΔΦ_B / Δt)   |   B_solenoid = μ₀ · n · I',
    keyConcept: {
      en: 'Changing magnetic flux through a coil induces an electromotive force (EMF) proportional to the number of turns N and the speed of the magnet.',
      hi: 'कुंडली से गुजरने वाले चुंबकीय फ्लक्स में परिवर्तन से प्रेरित विद्युत वाहक बल (EMF) उत्पन्न होता है, जो फेरों की संख्या N और वेग के समानुपाती होता है।',
      kn: 'ಕಾಯಿಲ್ ಮೂಲಕ ಕಾಂತೀಯ ಫ್ಲಕ್ಸ್ ಬದಲಾದಾಗ, ತಿರುವುಗಳ ಸಂಖ್ಯೆ N ಮತ್ತು ಆಯಸ್ಕಾಂತದ ವೇಗಕ್ಕೆ ಅನುಗುಣವಾಗಿ ವಿದ್ಯುತ್ ಚಾಲಕ ಬಲ (EMF) ಪ್ರೇರಿತವಾಗುತ್ತದೆ.',
    },
    experimentTitle: {
      en: 'Practical 03: Peak Induced EMF vs Coil Turns',
      hi: 'प्रयोग 03: प्रेरित EMF बनाम कुंडली के फेरे',
      kn: 'ಪ್ರಾಯೋಗಿಕ 03: ಪ್ರೇರಿತ EMF ಮತ್ತು ಕಾಯಿಲ್ ತಿರುವುಗಳು',
    },
    experimentSteps: [
      {
        en: 'Rotate the 3D solenoid bench to inspect the copper windings and moving bar magnet.',
        hi: 'तांबे की कुंडली और गतिमान छड़ चुंबक देखने के लिए 3D बेंच घुमाएँ।',
        kn: 'ತಾಮ್ರದ ಕಾಯಿಲ್ ಮತ್ತು ಚಲಿಸುವ ದಂಡ ಆಯಸ್ಕಾಂತವನ್ನು ವೀಕ್ಷಿಸಲು 3D ದೃಶ್ಯವನ್ನು ತಿರುಗಿಸಿ.',
      },
      {
        en: 'Increase coil turns from 40 to 120 and observe peak EMF double.',
        hi: 'फेरों की संख्या 40 से 120 करें और प्रेरित EMF में वृद्धि देखें।',
        kn: 'ತಿರುವುಗಳನ್ನು 40 ರಿಂದ 120 ಕ್ಕೆ ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಗರಿಷ್ಠ EMF ಬದಲಾವಣೆ ಗಮನಿಸಿ.',
      },
    ],
    sampleNumerical:
      'A 150-turn coil experiences a magnetic flux change from 0.04 Wb to 0.01 Wb in 0.05 seconds. Calculate the magnitude of the induced EMF.',
  },
  {
    id: 'optics',
    title: {
      en: 'Optics & Ray Refraction',
      hi: 'प्रकाशिकी और अपवर्तन',
      kn: 'ದೃಗ್ವಿಜ್ಞಾನ ಮತ್ತು ವಕ್ರೀಭವನ',
    },
    subtitle: {
      en: "Snell's Law, critical angle, total internal reflection & thin lenses",
      hi: 'स्नेल का नियम, क्रांतिक कोण, पूर्ण आंतरिक परावर्तन और लेंस',
      kn: 'ಸ್ನೆಲ್ ನಿಯಮ, ಕ್ರಾಂತಿಕ ಕೋನ ಮತ್ತು ಮಸೂರ ಸಮೀಕರಣ',
    },
    formula: 'n₁ sin θ₁ = n₂ sin θ₂   |   1/f = 1/v - 1/u',
    keyConcept: {
      en: 'Light bends toward the normal when entering a denser medium (n₂ > n₁). When moving from denser to rarer medium beyond the critical angle, total internal reflection occurs.',
      hi: 'सघन माध्यम में प्रवेश करने पर प्रकाश अभिलंब की ओर झुकता है। क्रांतिक कोण से अधिक होने पर पूर्ण आंतरिक परावर्तन होता है।',
      kn: 'ಬೆಳಕು ಸಾಂದ್ರ ಮಾಧ್ಯಮವನ್ನು ಪ್ರವೇಶಿಸಿದಾಗ ಲಂಬದ ಕಡೆಗೆ ಬಾಗುತ್ತದೆ. ಕ್ರಾಂತಿಕ ಕೋನಕ್ಕಿಂತ ಹೆಚ್ಚಾದಾಗ ಸಂಪೂರ್ಣ ಆಂತರಿಕ ಪ್ರತಿಫಲನ ಸಂಭವಿಸುತ್ತದೆ.',
    },
    experimentTitle: {
      en: 'Practical 04: Critical Angle of Glass-Air Interface',
      hi: 'प्रयोग 04: काँच-वायु क्रांतिक कोण मापन',
      kn: 'ಪ್ರಾಯೋಗಿಕ 04: ಗಾಜು-ಗಾಳಿ ಕ್ರಾಂತಿಕ ಕೋನ',
    },
    experimentSteps: [
      {
        en: 'Set Medium 1 to Crown Glass (n₁ = 1.52) and Medium 2 to Air (n₂ = 1.00).',
        hi: 'माध्यम 1 को काँच (n₁ = 1.52) और माध्यम 2 को वायु (n₂ = 1.00) पर सेट करें।',
        kn: 'ಮಾಧ್ಯಮ 1 ಅನ್ನು ಗಾಜು (1.52) ಮತ್ತು ಮಾಧ್ಯಮ 2 ಅನ್ನು ಗಾಳಿ (1.00) ಗೆ ಹೊಂದಿಸಿ.',
      },
      {
        en: 'Slowly increase incidence angle until Total Internal Reflection triggers (~41.1°).',
        hi: 'आपतन कोण बढ़ाएँ जब तक पूर्ण आंतरिक परावर्तन (~41.1°) न शुरू हो जाए।',
        kn: 'ಸಂಪೂರ್ಣ ಆಂತರಿಕ ಪ್ರತಿಫಲನ (~41.1°) ಪ್ರಾರಂಭವಾಗುವವರೆಗೆ ಕೋನವನ್ನು ಹೆಚ್ಚಿಸಿ.',
      },
    ],
    sampleNumerical:
      'A ray of light enters diamond (n = 2.42) from air (n = 1.00) at an incidence angle of 40°. Find the angle of refraction and the critical angle of diamond.',
  },
  {
    id: 'waves',
    title: {
      en: 'Waves & Sound Resonance',
      hi: 'तरंगें और ध्वनि अनुनाद',
      kn: 'ಅಲೆಗಳು ಮತ್ತು ಧ್ವನಿ ಅನುರಣನ',
    },
    subtitle: {
      en: 'Wave superposition, beat frequency & live acoustic tone synthesizer',
      hi: 'तरंग अध्यारोपण, विस्पंद आवृत्ति और ध्वनि संश्लेषक',
      kn: 'ಅಲೆಗಳ ಅಧಿವ್ಯಾಪನ ಮತ್ತು ಶಬ್ದ ತರಂಗಾಂತರ',
    },
    formula: 'v = f · λ   |   f_beat = |f₁ - f₂|',
    keyConcept: {
      en: 'Two waves overlapping in space add algebraically (superposition). Close frequencies produce audible beats whose rate equals |f₁ - f₂|.',
      hi: 'दो तरंगों के मिलने पर उनके विस्थापन जुड़ते हैं। निकट आवृत्तियाँ होने पर विस्पंद (Beats) सुनाई देते हैं।',
      kn: 'ಎರಡು ಅಲೆಗಳು ಸೇರಿದಾಗ ಅವುಗಳ ಸ್ಥಾನಪಲ್ಲಟಗಳು ಕೂಡುತ್ತವೆ. ಹತ್ತಿರದ ಆವರ್ತನಗಳು ಬೀಟ್‌ಗಳನ್ನು ಉಂಟುಮಾಡುತ್ತವೆ.',
    },
    experimentTitle: {
      en: 'Practical 05: Acoustic Beat Frequency & Wavelength',
      hi: 'प्रयोग 05: ध्वनि विस्पंद और तरंगदैर्ध्य',
      kn: 'ಪ್ರಾಯೋಗಿಕ 05: ಧ್ವನಿ ಬೀಟ್ ಆವರ್ತನ ಮತ್ತು ತರಂಗಾಂತರ',
    },
    experimentSteps: [
      {
        en: 'Set Wave 1 to 260 Hz and Wave 2 to 264 Hz and listen with Sound Output enabled.',
        hi: 'तरंग 1 को 260 Hz और तरंग 2 को 264 Hz पर सेट करके ध्वनि सुनें।',
        kn: 'ಅಲೆ 1 ಅನ್ನು 260 Hz ಮತ್ತು ಅಲೆ 2 ಅನ್ನು 264 Hz ಗೆ ಹೊಂದಿಸಿ ಧ್ವನಿ ಆಲಿಸಿ.',
      },
      {
        en: 'Observe the constructive and destructive envelope pulsing 4 times per second.',
        hi: 'प्रति सेकंड 4 बार होने वाले रचनात्मक व विनाशकारी व्यतिकरण को देखें।',
        kn: 'ಪ್ರತಿ ಸೆಕೆಂಡಿಗೆ 4 ಬಾರಿ ಸಂಭವಿಸುವ ಅಲೆಯ ಏರಿಳಿತವನ್ನು ಗಮನಿಸಿ.',
      },
    ],
    sampleNumerical:
      'A sound wave travels at 343 m/s in air with a frequency of 440 Hz. Calculate its wavelength and time period.',
  },
  {
    id: 'thermodynamics',
    title: {
      en: 'Energy & Thermodynamics',
      hi: 'ऊर्जा और ऊष्मागतिकी',
      kn: 'ಶಕ್ತಿ ಮತ್ತು ಉಷ್ಣಗತಿಶಾಸ್ತ್ರ',
    },
    subtitle: {
      en: 'Ideal gas kinetic chamber, piston work & Carnot heat engine efficiency',
      hi: 'आदर्श गैस कक्ष, पिस्टन कार्य और कार्नो इंजन दक्षता',
      kn: 'ಆದರ್ಶ ಅನಿಲ ನಿಯಮ ಮತ್ತು ಕಾರ್ನೋಟ್ ಎಂಜಿನ್ ದಕ್ಷತೆ',
    },
    formula: 'P · V = n · R · T   |   η_max = 1 - (T_c / T_h)',
    keyConcept: {
      en: 'Temperature measures average molecular kinetic energy. Compressing gas volume or raising Kelvin temperature increases collision frequency and wall pressure.',
      hi: 'तापमान अणुओं की औसत गतिज ऊर्जा का माप है। आयतन घटाने या तापमान बढ़ाने से दाब बढ़ता है।',
      kn: 'ತಾಪಮಾನವು ಅಣುಗಳ ಸರಾಸರಿ ಚಲನ ಶಕ್ತಿಯನ್ನು ಅಳೆಯುತ್ತದೆ. ಗಾತ್ರವನ್ನು ಕುಗ್ಗಿಸಿದರೆ ಒತ್ತಡ ಹೆಚ್ಚಾಗುತ್ತದೆ.',
    },
    experimentTitle: {
      en: "Practical 06: Boyle's & Gay-Lussac Pressure Law",
      hi: 'प्रयोग 06: बॉयल व चार्ल्स दाब नियम',
      kn: 'ಪ್ರಾಯೋಗಿಕ 06: ಬಾಯ್ಲ್ ಮತ್ತು ಚಾರ್ಲ್ಸ್ ಒತ್ತಡ ನಿಯಮ',
    },
    experimentSteps: [
      {
        en: 'Fix temperature at 300 K and halve the chamber volume from 4.0 L to 2.0 L.',
        hi: 'तापमान 300 K स्थिर रखकर आयतन 4.0 L से 2.0 L करें।',
        kn: 'ತಾಪಮಾನವನ್ನು 300 K ನಲ್ಲಿ ಸ್ಥಿರವಾಗಿರಿಸಿ ಗಾತ್ರವನ್ನು 4.0 L ನಿಂದ 2.0 L ಗೆ ಇಳಿಸಿ.',
      },
      {
        en: 'Confirm pressure doubles while average particle speed stays unchanged.',
        hi: 'पुष्टि करें कि दाब दोगुना हो जाता है जबकि कणों की औसत चाल स्थिर रहती है।',
        kn: 'ಕಣಗಳ ವೇಗ ಬದಲಾಗದೆ ಒತ್ತಡ ದ್ವಿಗುಣವಾಗುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.',
      },
    ],
    sampleNumerical:
      '2.0 moles of an ideal gas are held in a 10 L cylinder at 350 K (R = 8.314 J/mol·K). Find the pressure in kilopascals.',
  },
];

export const SUPPORTING_WORLDS: SupportingWorldMeta[] = [
  {
    id: 'chemistry',
    title: {
      en: 'Chemistry World',
      hi: 'रसायन विज्ञान जगत',
      kn: 'ರಸಾಯನಶಾಸ್ತ್ರ ಲೋಕ',
    },
    subtitle: {
      en: 'Acid-base pH titration, atomic bonding & stoichiometry',
      hi: 'अम्ल-क्षार pH अनुमापन, रासायनिक बंध और स्टॉइकियोमेट्री',
      kn: 'ಆಮ್ಲ-ಕ್ಷಾರ pH ಟೈಟ್ರೇಶನ್ ಮತ್ತು ಪರಮಾಣು ಬಂಧ',
    },
    imagePath: '/src/assets/images/chemistry_world_card_1794896376832.jpg',
    accentHex: '#F59E0B',
    lessons: [
      {
        id: 'chem-ph',
        title: {
          en: 'pH Scale & Neutralization',
          hi: 'pH स्केल और उदासीनीकरण',
          kn: 'pH ಮಾಪಕ ಮತ್ತು ತಟಸ್ಥೀಕರಣ',
        },
        summary: {
          en: 'pH = -log₁₀[H⁺]. Mixing strong acid (HCl) and strong base (NaOH) yields salt + water at pH 7.0 when molar equivalents match.',
          hi: 'pH = -log₁₀[H⁺]। प्रबल अम्ल (HCl) और प्रबल क्षार (NaOH) समान मोल पर मिलने से pH 7.0 का लवण व जल बनाते हैं।',
          kn: 'pH = -log₁₀[H⁺]. ಬಲವಾದ ಆಮ್ಲ ಮತ್ತು ಕ್ಷಾರ ಸಮಪ್ರಮಾಣದಲ್ಲಿ ಸೇರಿದಾಗ pH 7.0 ತಟಸ್ಥ ದ್ರಾವಣವಾಗುತ್ತದೆ.',
        },
        formulaOrFact: 'HCl + NaOH → NaCl + H₂O   |   pH + pOH = 14',
        durationMin: 12,
      },
      {
        id: 'chem-bonding',
        title: {
          en: 'Ionic vs Covalent Crystal Lattices',
          hi: 'आयनिक बनाम सहसंयोजक क्रिस्टल',
          kn: 'ಅಯಾನಿಕ್ ಮತ್ತು ಸಹವೇಲೆನ್ಸಿಯ ಬಂಧ',
        },
        summary: {
          en: 'Electronegativity difference > 1.7 favors electron transfer (ionic lattice), while smaller differences form shared covalent electron pairs.',
          hi: 'विद्युतऋणात्मकता अंतर > 1.7 होने पर आयनिक बंध बनता है, जबकि साझा इलेक्ट्रॉनों से सहसंयोजक बंध बनता है।',
          kn: 'ಎಲೆಕ್ಟ್ರಾನ್ ಹಂಚಿಕೆಯಿಂದ ಸಹವೇಲೆನ್ಸಿಯ ಬಂಧ ಮತ್ತು ಎಲೆಕ್ಟ್ರಾನ್ ವರ್ಗಾವಣೆಯಿಂದ ಅಯಾನಿಕ್ ಬಂಧ ರೂಪುಗೊಳ್ಳುತ್ತದೆ.',
        },
        formulaOrFact: 'ΔEN > 1.7 → Ionic   |   ΔEN < 1.7 → Covalent',
        durationMin: 15,
      },
    ],
    quiz: [
      {
        id: 'cq1',
        question: {
          en: 'What is the pH of a neutral aqueous solution at 25°C?',
          hi: '25°C पर उदासीन जलीय विलयन का pH क्या होता है?',
          kn: '25°C ನಲ್ಲಿ ತಟಸ್ಥ ದ್ರಾವಣದ pH ಮೌಲ್ಯ ಎಷ್ಟು?',
        },
        options: [
          { en: '0.0', hi: '0.0', kn: '0.0' },
          { en: '7.0', hi: '7.0', kn: '7.0' },
          { en: '10.5', hi: '10.5', kn: '10.5' },
          { en: '14.0', hi: '14.0', kn: '14.0' },
        ],
        correctIndex: 1,
        explanation: {
          en: 'At 25°C, [H⁺] = [OH⁻] = 10⁻⁷ M, giving pH = 7.0.',
          hi: '25°C पर [H⁺] = 10⁻⁷ M होने से pH = 7.0 होता है।',
          kn: '25°C ನಲ್ಲಿ [H⁺] = 10⁻⁷ M ಆಗಿರುವುದರಿಂದ pH = 7.0 ಆಗಿದೆ.',
        },
      },
      {
        id: 'cq2',
        question: {
          en: 'Which indicator turns pink/magenta in basic solutions (pH > 8.2)?',
          hi: 'क्षारीय विलयन (pH > 8.2) में कौन-सा सूचक गुलाबी हो जाता है?',
          kn: 'ಕ್ಷಾರೀಯ ದ್ರಾವಣದಲ್ಲಿ (pH > 8.2) ಗುಲಾಬಿ ಬಣ್ಣಕ್ಕೆ ತಿರುಗುವ ಸೂಚಕ ಯಾವುದು?',
        },
        options: [
          { en: 'Methyl orange', hi: 'मेथिल ऑरेंज', kn: 'ಮೆಥಿಲ್ ಆರೆಂಜ್' },
          { en: 'Phenolphthalein', hi: 'फिनॉल्फ्थेलिन', kn: 'ಫಿನಾಲ್ಫ್‌ಥಲೀನ್' },
          { en: 'Bromothymol blue', hi: 'ब्रोमोथाइमॉल ब्लू', kn: 'ಬ್ರೋಮೋಥೈಮಾಲ್ ಬ್ಲೂ' },
          { en: 'Starch iodine', hi: 'स्टार्च आयोडीन', kn: 'ಪಿಷ್ಟ ಅಯೋಡಿನ್' },
        ],
        correctIndex: 1,
        explanation: {
          en: 'Phenolphthalein is colorless in acidic/neutral solutions and bright pink above pH 8.2.',
          hi: 'फिनॉल्फ्थेलिन अम्ल में रंगहीन और क्षार (pH > 8.2) में गुलाबी होता है।',
          kn: 'ಫಿನಾಲ್ಫ್‌ಥಲೀನ್ ಆಮ್ಲದಲ್ಲಿ ಬಣ್ಣರಹಿತವಾಗಿದ್ದು ಕ್ಷಾರದಲ್ಲಿ ಗುಲಾಬಿ ಬಣ್ಣ ನೀಡುತ್ತದೆ.',
        },
      },
      {
        id: 'cq3',
        question: {
          en: 'How many valence electrons does a neutral Carbon atom (Z = 6) have?',
          hi: 'उदासीन कार्बन परमाणु (Z = 6) में कितने संयोजकता इलेक्ट्रॉन होते हैं?',
          kn: 'ತಟಸ್ಥ ಇಂಗಾಲದ ಪರಮಾಣು (Z = 6) ಎಷ್ಟು ವೇಲೆನ್ಸ್ ಎಲೆಕ್ಟ್ರಾನ್‌ಗಳನ್ನು ಹೊಂದಿದೆ?',
        },
        options: [
          { en: '2', hi: '2', kn: '2' },
          { en: '4', hi: '4', kn: '4' },
          { en: '6', hi: '6', kn: '6' },
          { en: '8', hi: '8', kn: '8' },
        ],
        correctIndex: 1,
        explanation: {
          en: 'Carbon has electron configuration 1s² 2s² 2p², giving 4 valence electrons.',
          hi: 'कार्बन का विन्यास 2, 4 है, इसलिए 4 संयोजकता इलेक्ट्रॉन होते हैं।',
          kn: 'ಇಂಗಾಲದ ಎಲೆಕ್ಟ್ರಾನ್ ವಿನ್ಯಾಸ 2, 4 ಆಗಿರುವುದರಿಂದ 4 ವೇಲೆನ್ಸ್ ಎಲೆಕ್ಟ್ರಾನ್‌ಗಳಿವೆ.',
        },
      },
    ],
  },
  {
    id: 'biology',
    title: {
      en: 'Biology World',
      hi: 'जीव विज्ञान जगत',
      kn: 'ಜೀವಶಾಸ್ತ್ರ ಲೋಕ',
    },
    subtitle: {
      en: 'Plant xylem-phloem transport, photosynthesis & cell membranes',
      hi: 'जाइलम-फ्लोएम परिवहन, प्रकाश संश्लेषण और कोशिका झिल्ली',
      kn: 'ಸಸ್ಯ ನಾಳೀಯ ವ್ಯವಸ್ಥೆ, ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ ಮತ್ತು ಜೀವಕೋಶ',
    },
    imagePath: '/src/assets/images/biology_world_card_1794896378726.jpg',
    accentHex: '#10B981',
    lessons: [
      {
        id: 'bio-xylem',
        title: {
          en: 'Xylem & Phloem Vascular Flow',
          hi: 'जाइलम और फ्लोएम संवहन तंत्र',
          kn: 'ಕ್ಸೈಲಂ ಮತ್ತು ಫ್ಲೋಯಂ ಸಾಗಣೆ',
        },
        summary: {
          en: 'Xylem pulls water & dissolved minerals upward via transpirational pull, whereas Phloem transports photosynthetic sucrose bi-directionally to sinks.',
          hi: 'जाइलम वाष्पोत्सर्जन खिंचाव से जल व खनिज ऊपर ले जाता है, जबकि फ्लोएम शर्करा को दोनों दिशाओं में पहुँचाता है।',
          kn: 'ಕ್ಸೈಲಂ ನೀರು ಮತ್ತು ಖನಿಜಗಳನ್ನು ಮೇಲಕ್ಕೆ ಸಾಗಿಸುತ್ತದೆ; ಫ್ಲೋಯಂ ಆಹಾರವನ್ನು ಸಸ್ಯದ ಎಲ್ಲಾ ಭಾಗಗಳಿಗೆ ತಲುಪಿಸುತ್ತದೆ.',
        },
        formulaOrFact: '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂',
        durationMin: 14,
      },
      {
        id: 'bio-osmosis',
        title: {
          en: 'Cellular Osmosis & Turgor Pressure',
          hi: 'परासरण और स्फीति दाब',
          kn: 'ಆಸ್ಮೋಸಿಸ್ ಮತ್ತು ಟರ್ಗರ್ ಒತ್ತಡ',
        },
        summary: {
          en: 'Water crosses semi-permeable phospholipid bilayers from higher water potential (hypotonic) to lower water potential (hypertonic).',
          hi: 'जल अर्धपारगम्य झिल्ली से उच्च जल विभव से निम्न जल विभव की ओर प्रवाहित होता है।',
          kn: 'ನೀರು ಅರೆಪಾರಗಮ್ಯ ಪೊರೆಯ ಮೂಲಕ ಹೆಚ್ಚಿನ ನೀರಿನ ಸಾಮರ್ಥ್ಯದಿಂದ ಕಡಿಮೆ ಸಾಮರ್ಥ್ಯದ ಕಡೆಗೆ ಚಲಿಸುತ್ತದೆ.',
        },
        formulaOrFact: 'Ψ_cell = Ψ_s + Ψ_p',
        durationMin: 10,
      },
    ],
    quiz: [
      {
        id: 'bq1',
        question: {
          en: 'Which vascular tissue transports water and minerals from roots to leaves?',
          hi: 'जड़ों से पत्तियों तक जल और खनिज कौन-सा ऊतक ले जाता है?',
          kn: 'ಬೇರುಗಳಿಂದ ಎಲೆಗಳಿಗೆ ನೀರು ಮತ್ತು ಖನಿಜಗಳನ್ನು ಸಾಗಿಸುವ ಅಂಗಾಂಶ ಯಾವುದು?',
        },
        options: [
          { en: 'Phloem', hi: 'फ्लोएम', kn: 'ಫ್ಲೋಯಂ' },
          { en: 'Xylem', hi: 'जाइलम', kn: 'ಕ್ಸೈಲಂ' },
          { en: 'Cambium', hi: 'कैम्बियम', kn: 'ಕ್ಯಾಂಬಿಯಂ' },
          { en: 'Epidermis', hi: 'अधिचर्म', kn: 'ಎಪಿಡರ್ಮಿಸ್' },
        ],
        correctIndex: 1,
        explanation: {
          en: 'Xylem vessels and tracheids form continuous upward conduits for water and mineral ions.',
          hi: 'जाइलम वाहिकाएँ जल व खनिजों को ऊपर की ओर ले जाती हैं।',
          kn: 'ಕ್ಸೈಲಂ ನಾಳಗಳು ನೀರು ಮತ್ತು ಖನಿಜಗಳನ್ನು ಮೇಲ್ಮುಖವಾಗಿ ಸಾಗಿಸುತ್ತವೆ.',
        },
      },
      {
        id: 'bq2',
        question: {
          en: 'Guard cells open plant stomata primarily when they:',
          hi: 'रक्षक कोशिकाएँ स्टोमेटा को कब खोलती हैं?',
          kn: 'ಗಾರ್ಡ್ ಜೀವಕೋಶಗಳು ಸ್ಟೊಮಾಟಾವನ್ನು ಯಾವಾಗ ತೆರೆಯುತ್ತವೆ?',
        },
        options: [
          { en: 'Lose water and shrink', hi: 'जल खोकर सिकुड़ती हैं', kn: 'ನೀರು ಕಳೆದುಕೊಂಡು ಕುಗ್ಗಿದಾಗ' },
          { en: 'Absorb water and become turgid', hi: 'जल सोखकर स्फीत होती हैं', kn: 'ನೀರು ಹೀರಿ ಉಬ್ಬಿದಾಗ' },
          { en: 'Stop cellular respiration', hi: 'श्वसन रोक देती हैं', kn: 'ಉಸಿರಾಟ ನಿಲ್ಲಿಸಿದಾಗ' },
          { en: 'Lose chlorophyll', hi: 'क्लोरोफिल खोती हैं', kn: 'ಕ್ಲೋರೋಫಿಲ್ ಕಳೆದುಕೊಂಡಾಗ' },
        ],
        correctIndex: 1,
        explanation: {
          en: 'Potassium ion uptake draws water in by osmosis, making guard cells turgid and opening the pore.',
          hi: 'परासरण से जल अंदर आने पर रक्षक कोशिकाएँ फूल जाती हैं और रंध्र खुलते हैं।',
          kn: 'ನೀರು ಒಳಗೆ ಪ್ರವೇಶಿಸಿದಾಗ ಗಾರ್ಡ್ ಕೋಶಗಳು ಉಬ್ಬಿ ರಂಧ್ರ ತೆರೆಯುತ್ತದೆ.',
        },
      },
      {
        id: 'bq3',
        question: {
          en: 'What gas is released as a byproduct during the light-dependent reactions of photosynthesis?',
          hi: 'प्रकाश संश्लेषण के दौरान कौन-सी गैस उप-उत्पाद के रूप में निकलती है?',
          kn: 'ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆಯ ಸಮಯದಲ್ಲಿ ಯಾವ ಅನಿಲವು ಬಿಡುಗಡೆಯಾಗುತ್ತದೆ?',
        },
        options: [
          { en: 'Nitrogen (N₂)', hi: 'नाइट्रोजन (N₂)', kn: 'ನೈಟ್ರೋಜನ್ (N₂)' },
          { en: 'Carbon monoxide (CO)', hi: 'कार्बन मोनोऑक्साइड', kn: 'ಕಾರ್ಬನ್ ಮಾನಾಕ್ಸೈಡ್' },
          { en: 'Oxygen (O₂)', hi: 'ऑक्सीजन (O₂)', kn: 'ಆಮ್ಲಜನಕ (O₂)' },
          { en: 'Methane (CH₄)', hi: 'मीथेन (CH₄)', kn: 'ಮೀಥೇನ್ (CH₄)' },
        ],
        correctIndex: 2,
        explanation: {
          en: 'Photolysis of water splits H₂O molecules, releasing O₂ gas.',
          hi: 'जल के प्रकाश-अपघटन से O₂ गैस मुक्त होती है।',
          kn: 'ನೀರಿನ ಅಣು ವಿಭಜನೆಯಿಂದ ಆಮ್ಲಜನಕ (O₂) ಬಿಡುಗಡೆಯಾಗುತ್ತದೆ.',
        },
      },
    ],
  },
  {
    id: 'mathematics',
    title: {
      en: 'Mathematics World',
      hi: 'गणित जगत',
      kn: 'ಗಣಿತ ಲೋಕ',
    },
    subtitle: {
      en: 'Unit circle trigonometry, quadratic curves & spatial geometry',
      hi: 'इकाई वृत्त त्रिकोणमिति, द्विघात वक्र और ज्यामिति',
      kn: 'ತ್ರಿಕೋನಮಿತಿ, ವರ್ಗ ಸಮೀಕರಣ ಮತ್ತು ರೇಖಾಗಣಿತ',
    },
    imagePath: '/src/assets/images/mathematics_world_card_1794896376908.jpg',
    accentHex: '#818CF8',
    lessons: [
      {
        id: 'math-trig',
        title: {
          en: 'Unit Circle & Harmonic Identities',
          hi: 'इकाई वृत्त और त्रिकोणमितीय सर्वसमिकाएँ',
          kn: 'ಏಕಮಾನ ವೃತ್ತ ಮತ್ತು ತ್ರಿಕೋನಮಿತಿ',
        },
        summary: {
          en: 'Any point on the unit circle has coordinates (cos θ, sin θ). By Pythagoras, sin²θ + cos²θ = 1 for all real angles θ.',
          hi: 'इकाई वृत्त के किसी बिंदु के निर्देशांक (cos θ, sin θ) होते हैं और sin²θ + cos²θ = 1 सदैव सत्य है।',
          kn: 'ಏಕಮಾನ ವೃತ್ತದ ಮೇಲಿನ ಬಿಂದುವಿನ ನಿರ್ದೇಶಾಂಕಗಳು (cos θ, sin θ). sin²θ + cos²θ = 1 ಯಾವಾಗಲೂ ಸತ್ಯವಾಗಿದೆ.',
        },
        formulaOrFact: 'sin²θ + cos²θ = 1   |   tan θ = sin θ / cos θ',
        durationMin: 12,
      },
      {
        id: 'math-quad',
        title: {
          en: 'Quadratic Discriminant & Parabolas',
          hi: 'द्विघात विविक्तकर और परवलय',
          kn: 'ವರ್ಗ ಸಮೀಕರಣ ಮತ್ತು ಪರವಲಯ',
        },
        summary: {
          en: 'For ax² + bx + c = 0, the discriminant Δ = b² - 4ac governs whether the parabola crosses the x-axis twice (Δ > 0), once (Δ = 0), or never (Δ < 0).',
          hi: 'ax² + bx + c = 0 के लिए Δ = b² - 4ac मूलों की प्रकृति तय करता है।',
          kn: 'ax² + bx + c = 0 ಗೆ Δ = b² - 4ac ಮೂಲಗಳ ಸ್ವಭಾವವನ್ನು ನಿರ್ಧರಿಸುತ್ತದೆ.',
        },
        formulaOrFact: 'x = (-b ± √(b² - 4ac)) / 2a',
        durationMin: 14,
      },
    ],
    quiz: [
      {
        id: 'mq1',
        question: {
          en: 'What is the exact value of sin(30°) + cos(60°)?',
          hi: 'sin(30°) + cos(60°) का मान क्या है?',
          kn: 'sin(30°) + cos(60°) ರ ನಿಖರ ಮೌಲ್ಯ ಎಷ್ಟು?',
        },
        options: [
          { en: '0.5', hi: '0.5', kn: '0.5' },
          { en: '1.0', hi: '1.0', kn: '1.0' },
          { en: '√3 / 2', hi: '√3 / 2', kn: '√3 / 2' },
          { en: '2.0', hi: '2.0', kn: '2.0' },
        ],
        correctIndex: 1,
        explanation: {
          en: 'sin(30°) = 0.5 and cos(60°) = 0.5, so their sum is 1.0.',
          hi: 'sin(30°) = 0.5 और cos(60°) = 0.5, अतः योग 1.0 है।',
          kn: 'sin(30°) = 0.5 ಮತ್ತು cos(60°) = 0.5, ಆದ್ದರಿಂದ ಮೊತ್ತ 1.0.',
        },
      },
      {
        id: 'mq2',
        question: {
          en: 'If the discriminant b² - 4ac = 0, the quadratic equation has:',
          hi: 'यदि b² - 4ac = 0 हो, तो द्विघात समीकरण के मूल कैसे होंगे?',
          kn: 'ವಿವಿಕ್ತಕರ b² - 4ac = 0 ಆಗಿದ್ದರೆ, ವರ್ಗ ಸಮೀಕರಣವು ಏನನ್ನು ಹೊಂದಿರುತ್ತದೆ?',
        },
        options: [
          { en: 'Two distinct complex roots', hi: 'दो काल्पनिक मूल', kn: 'ಎರಡು ಕಾಲ್ಪನಿಕ ಮೂಲಗಳು' },
          { en: 'One repeated real root', hi: 'दो समान वास्तविक मूल', kn: 'ಒಂದು ಪುನರಾವರ್ತಿತ ನೈಜ ಮೂಲ' },
          { en: 'No solution', hi: 'कोई हल नहीं', kn: 'ಯಾವುದೇ ಪರಿಹಾರವಿಲ್ಲ' },
          { en: 'Infinite roots', hi: 'अनंत मूल', kn: 'ಅನಂತ ಮೂಲಗಳು' },
        ],
        correctIndex: 1,
        explanation: {
          en: 'When Δ = 0, the parabola vertex touches the x-axis at a single point x = -b/(2a).',
          hi: 'जब Δ = 0, तो परवलय का शीर्ष x-अक्ष को एक ही बिंदु पर स्पर्श करता है।',
          kn: 'Δ = 0 ಆದಾಗ, ಪರವಲಯವು x-ಅಕ್ಷವನ್ನು ಒಂದೇ ಬಿಂದುವಿನಲ್ಲಿ ಸ್ಪರ್ಶಿಸುತ್ತದೆ.',
        },
      },
      {
        id: 'mq3',
        question: {
          en: "According to Euler's polyhedron formula for convex Platonic solids, V - E + F equals:",
          hi: 'उत्तल बहुफलकों के लिए यूलर का सूत्र V - E + F किसके बराबर है?',
          kn: 'ಪ್ಲಾಟೋನಿಕ್ ಘನಗಳಿಗೆ ಯೂಲರ್ ಸೂತ್ರ V - E + F ಎಷ್ಟಕ್ಕೆ ಸಮನಾಗಿರುತ್ತದೆ?',
        },
        options: [
          { en: '0', hi: '0', kn: '0' },
          { en: '1', hi: '1', kn: '1' },
          { en: '2', hi: '2', kn: '2' },
          { en: '4', hi: '4', kn: '4' },
        ],
        correctIndex: 2,
        explanation: {
          en: 'For every convex polyhedron (such as an icosahedron or cube), Vertices - Edges + Faces = 2.',
          hi: 'प्रत्येक उत्तल बहुफलक के लिए V - E + F = 2 होता है।',
          kn: 'ಪ್ರತಿ ಪೀನ ಬಹುಮುಖಿ ಘನಕ್ಕೆ V - E + F = 2 ಆಗಿರುತ್ತದೆ.',
        },
      },
    ],
  },
];

export const DAILY_CHALLENGES: QuizQuestion[] = [
  {
    id: 'dc-physics-1',
    question: {
      en: 'A 2 kg block slides down a frictionless ramp of vertical height 5 m (g = 9.8 m/s²). What is its speed at the bottom?',
      hi: '2 kg का एक गुटका 5 m ऊँचे घर्षणरहित ढलान से फिसलता है (g = 9.8 m/s²)। तल पर उसकी चाल क्या होगी?',
      kn: '2 kg ತೂಕದ ವಸ್ತುವು 5 m ಎತ್ತರದ ಘರ್ಷಣೆಯಿಲ್ಲದ ಇಳಿಜಾರಿನಿಂದ ಜಾರುತ್ತದೆ (g = 9.8 m/s²). ಕೆಳಭಾಗದಲ್ಲಿ ಅದರ ವೇಗ ಎಷ್ಟು?',
    },
    options: [
      { en: '4.9 m/s', hi: '4.9 m/s', kn: '4.9 m/s' },
      { en: '9.9 m/s', hi: '9.9 m/s', kn: '9.9 m/s' },
      { en: '14.0 m/s', hi: '14.0 m/s', kn: '14.0 m/s' },
      { en: '98.0 m/s', hi: '98.0 m/s', kn: '98.0 m/s' },
    ],
    correctIndex: 1,
    explanation: {
      en: 'By energy conservation, v = √(2gh) = √(2 × 9.8 × 5) = √98 ≈ 9.9 m/s.',
      hi: 'ऊर्जा संरक्षण से v = √(2gh) = √(2 × 9.8 × 5) ≈ 9.9 m/s।',
      kn: 'ಶಕ್ತಿ ಸಂರಕ್ಷಣೆಯಿಂದ v = √(2gh) = √(2 × 9.8 × 5) ≈ 9.9 m/s.',
    },
  },
];

export const INITIAL_ASSIGNMENTS: TeacherAssignment[] = [
  {
    id: 'a1',
    title: 'Projectile Range & Energy Conservation Log',
    subject: 'Physics',
    dueDate: '2026-11-20',
    completionRate: 84,
    targetGrade: 'Grade 11-A',
  },
  {
    id: 'a2',
    title: "Faraday's Induction 3D Coil Practical",
    subject: 'Physics',
    dueDate: '2026-11-22',
    completionRate: 67,
    targetGrade: 'Grade 12-B',
  },
  {
    id: 'a3',
    title: 'Acid-Base Neutralization pH Quiz',
    subject: 'Chemistry',
    dueDate: '2026-11-24',
    completionRate: 76,
    targetGrade: 'Grade 10-A',
  },
  {
    id: 'a4',
    title: 'Xylem & Phloem Transpiration Activity',
    subject: 'Biology',
    dueDate: '2026-11-25',
    completionRate: 71,
    targetGrade: 'Grade 10-A',
  },
];

export const RESOURCE_PACKS: ResourcePack[] = [
  {
    id: 'pack-physics-formulas',
    title: {
      en: 'Physics Master Formula & SI Units Compendium',
      hi: 'भौतिकी मुख्य सूत्र एवं SI मात्रक संकलन',
      kn: 'ಭೌತಶಾಸ್ತ್ರ ಪ್ರಮುಖ ಸೂತ್ರಗಳು ಮತ್ತು SI ಘಟಕಗಳು',
    },
    domain: 'Physics',
    sizeKb: 148,
    format: 'Markdown / Offline Pack',
    content: `# Gyaan Graph — Physics Master Formula Compendium

## 1. Mechanics
- Kinematics: v = u + at | s = ut + 1/2 at^2 | v^2 = u^2 + 2as
- Projectile Range: R = (v0^2 * sin(2*theta)) / g
- Mechanical Energy: E = 1/2 m v^2 + m g h

## 2. Electricity
- Ohm's Law: V = I * R
- Series Resistance: R_eq = R1 + R2
- Parallel Resistance: 1/R_eq = 1/R1 + 1/R2
- Electrical Power: P = V * I = I^2 * R

## 3. Magnetism
- Solenoid Field: B = mu0 * n * I
- Faraday's Law: EMF = -N * (dPhi_B / dt)

## 4. Optics
- Snell's Law: n1 * sin(theta1) = n2 * sin(theta2)
- Critical Angle: sin(theta_c) = n2 / n1
- Lens Equation: 1/f = 1/v - 1/u

## 5. Waves & Sound
- Wave Equation: v = f * lambda
- Beat Frequency: f_beat = |f1 - f2|

## 6. Thermodynamics
- Ideal Gas Law: P * V = n * R * T (R = 8.314 J/mol*K)
- Carnot Efficiency: eta = 1 - (T_cold / T_hot)
`,
  },
  {
    id: 'pack-physics-practicals',
    title: {
      en: 'Virtual Physics Lab Practical Manual (6 Experiments)',
      hi: 'वर्चुअल भौतिकी प्रायोगिक पुस्तिका (6 प्रयोग)',
      kn: 'ವರ್ಚುವಲ್ ಭೌತಶಾಸ್ತ್ರ ಪ್ರಾಯೋಗಿಕ ಕೈಪಿಡಿ (6 ಪ್ರಯೋಗಗಳು)',
    },
    domain: 'Physics',
    sizeKb: 210,
    format: 'Markdown / Offline Pack',
    content: `# Gyaan Graph — Virtual Physics Practical Manual

1. Projectile Range Verification: Vary launch angle (30, 45, 60 deg) at fixed velocity 24 m/s.
2. Ohm's Law V-I Characteristic: Measure current I for 3V, 6V, 9V, 12V across 10 Ohm resistor.
3. Electromagnetic Induction: Compare induced peak EMF for N = 40, 80, 120 turns.
4. Critical Angle in Crown Glass: Verify sin(theta_c) = 1.00 / 1.52 -> 41.1 degrees.
5. Acoustic Beat Observation: Compare 260 Hz and 264 Hz -> 4 Hz beats.
6. Boyle's Law Isothermal Compression: Halve volume from 4L to 2L at 300 K -> double pressure.
`,
  },
  {
    id: 'pack-chemistry-guide',
    title: {
      en: 'Chemistry pH, Titration & Bonding Study Pack',
      hi: 'रसायन विज्ञान pH और रासायनिक बंध गाइड',
      kn: 'ರಸಾಯನಶಾಸ್ತ್ರ pH ಮತ್ತು ರಾಸಾಯನಿಕ ಬಂಧ ಮಾರ್ಗದರ್ಶಿ',
    },
    domain: 'Chemistry',
    sizeKb: 112,
    format: 'Markdown / Offline Pack',
    content: `# Gyaan Graph — Chemistry Study Guide
- pH = -log10[H+], Neutral at 25C: pH = 7.0
- Strong acid + strong base neutralization: HCl + NaOH -> NaCl + H2O
- Ionic vs Covalent bonding threshold: Delta Electronegativity ~ 1.7
`,
  },
  {
    id: 'pack-bio-math-pack',
    title: {
      en: 'Biology Vascular & Math Unit Circle Summary',
      hi: 'जीव विज्ञान संवहन एवं गणित त्रिकोणमिति सारांश',
      kn: 'ಜೀವಶಾಸ್ತ್ರ ಸಾಗಣೆ ಮತ್ತು ಗಣಿತ ತ್ರಿಕೋನಮಿತಿ ಸಾರಾಂಶ',
    },
    domain: 'Mathematics',
    sizeKb: 124,
    format: 'Markdown / Offline Pack',
    content: `# Gyaan Graph — Biology & Mathematics Reference
- Biology: Xylem transports water/minerals upward; Phloem transports sucrose bi-directionally.
- Photosynthesis: 6CO2 + 6H2O + Light -> C6H12O6 + 6O2
- Trigonometry: sin^2(theta) + cos^2(theta) = 1
- Quadratic Formula: x = (-b +/- sqrt(b^2 - 4ac)) / (2a)
`,
  },
];
