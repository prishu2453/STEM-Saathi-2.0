/**
 * Concept graph for CBSE Class 10 Physics (NCERT Science chapters 9–12, current syllabus).
 *
 * Each concept lists the concepts a student must understand first (`prereqs`).
 * The learner model, the diagnostic test, the practice picker and the teacher
 * dashboard all read this one graph, so a gap in a prerequisite is traced back
 * instead of drilling the student on something they are not ready for.
 */

export type ChapterKey = 'light' | 'eye' | 'electricity' | 'magnetism';

export interface Trio {
  en: string;
  hi: string;
  kn: string;
}

export interface Concept {
  id: string;
  chapter: ChapterKey;
  name: Trio;
  /** One line a student (or an LLM) can use to know exactly what the concept covers. */
  summary: string;
  prereqs: string[];
}

export interface Misconception {
  id: string;
  /** Concepts where this wrong idea shows up. */
  concepts: string[];
  label: string;
  /** What the student wrongly believes, in their words. */
  belief: string;
  /** The correct idea, used for feedback. */
  fix: string;
  /** Lower-case phrases that suggest this belief in a student's written reasoning (offline detector). */
  cues: string[];
}

export const SYLLABUS_ID = 'cbse-10-physics';
export const SYLLABUS_LABEL = 'CBSE Class 10 Physics (NCERT Science Ch. 9–12)';

export const CHAPTERS: { key: ChapterKey; name: Trio; ncert: string }[] = [
  { key: 'light', ncert: 'Ch 9', name: { en: 'Light: Reflection & Refraction', hi: 'प्रकाश: परावर्तन और अपवर्तन', kn: 'ಬೆಳಕು: ಪ್ರತಿಫಲನ ಮತ್ತು ವಕ್ರೀಭವನ' } },
  { key: 'eye', ncert: 'Ch 10', name: { en: 'Human Eye & Colourful World', hi: 'मानव नेत्र और रंगबिरंगा संसार', kn: 'ಮಾನವ ಕಣ್ಣು ಮತ್ತು ವರ್ಣಮಯ ಜಗತ್ತು' } },
  { key: 'electricity', ncert: 'Ch 11', name: { en: 'Electricity', hi: 'विद्युत', kn: 'ವಿದ್ಯುತ್' } },
  { key: 'magnetism', ncert: 'Ch 12', name: { en: 'Magnetic Effects of Current', hi: 'विद्युत धारा के चुंबकीय प्रभाव', kn: 'ವಿದ್ಯುತ್ ಪ್ರವಾಹದ ಕಾಂತೀಯ ಪರಿಣಾಮಗಳು' } },
];

export const CONCEPTS: Concept[] = [
  // ---- Light: reflection & refraction ----
  { id: 'reflection-laws', chapter: 'light', prereqs: [],
    name: { en: 'Laws of reflection', hi: 'परावर्तन के नियम', kn: 'ಪ್ರತಿಫಲನದ ನಿಯಮಗಳು' },
    summary: 'Angle of incidence equals angle of reflection, both measured from the normal; incident ray, reflected ray and normal lie in one plane; plane mirror images.' },
  { id: 'spherical-mirrors', chapter: 'light', prereqs: ['reflection-laws'],
    name: { en: 'Spherical mirror terms', hi: 'गोलीय दर्पण के पद', kn: 'ಗೋಳೀಯ ದರ್ಪಣದ ಪದಗಳು' },
    summary: 'Pole, centre of curvature, radius of curvature, principal axis, principal focus; R = 2f for concave and convex mirrors.' },
  { id: 'mirror-images', chapter: 'light', prereqs: ['spherical-mirrors'],
    name: { en: 'Images by mirrors (ray diagrams)', hi: 'दर्पण द्वारा प्रतिबिंब (किरण आरेख)', kn: 'ದರ್ಪಣಗಳಿಂದ ಪ್ರತಿಬಿಂಬ (ಕಿರಣ ಚಿತ್ರ)' },
    summary: 'Nature, position and size of images formed by concave and convex mirrors for different object positions; uses such as torches, shaving and rear-view mirrors.' },
  { id: 'mirror-formula', chapter: 'light', prereqs: ['mirror-images'],
    name: { en: 'Mirror formula & magnification', hi: 'दर्पण सूत्र और आवर्धन', kn: 'ದರ್ಪಣ ಸೂತ್ರ ಮತ್ತು ವರ್ಧನೆ' },
    summary: 'New Cartesian sign convention, 1/v + 1/u = 1/f, magnification m = h′/h = −v/u.' },
  { id: 'refraction-basics', chapter: 'light', prereqs: ['reflection-laws'],
    name: { en: 'Refraction of light', hi: 'प्रकाश का अपवर्तन', kn: 'ಬೆಳಕಿನ ವಕ್ರೀಭವನ' },
    summary: 'Light changes speed between media and bends towards the normal entering a denser medium (slower) and away from it entering a rarer medium; glass slab lateral shift.' },
  { id: 'refractive-index', chapter: 'light', prereqs: ['refraction-basics'],
    name: { en: 'Refractive index & Snell’s law', hi: 'अपवर्तनांक और स्नेल का नियम', kn: 'ವಕ್ರೀಭವನ ಸೂಚ್ಯಂಕ ಮತ್ತು ಸ್ನೆಲ್ ನಿಯಮ' },
    summary: 'n = c/v, relative refractive index n21 = v1/v2, sin i / sin r = constant; higher n means light travels slower (optically denser).' },
  { id: 'lens-images', chapter: 'light', prereqs: ['refraction-basics', 'spherical-mirrors'],
    name: { en: 'Images by lenses (ray diagrams)', hi: 'लेंस द्वारा प्रतिबिंब (किरण आरेख)', kn: 'ಮಸೂರಗಳಿಂದ ಪ್ರತಿಬಿಂಬ (ಕಿರಣ ಚಿತ್ರ)' },
    summary: 'Convex lens converges, concave lens diverges; nature, position and size of images for different object positions.' },
  { id: 'lens-formula', chapter: 'light', prereqs: ['lens-images', 'mirror-formula'],
    name: { en: 'Lens formula, magnification & power', hi: 'लेंस सूत्र, आवर्धन और क्षमता', kn: 'ಮಸೂರ ಸೂತ್ರ, ವರ್ಧನೆ ಮತ್ತು ಸಾಮರ್ಥ್ಯ' },
    summary: '1/v − 1/u = 1/f, m = v/u, power P = 1/f with f in metres (dioptre); convex lens power positive, concave negative.' },

  // ---- Human eye & colourful world ----
  { id: 'human-eye', chapter: 'eye', prereqs: ['lens-images'],
    name: { en: 'Human eye & accommodation', hi: 'मानव नेत्र और समंजन', kn: 'ಮಾನವ ಕಣ್ಣು ಮತ್ತು ಹೊಂದಾಣಿಕೆ' },
    summary: 'Cornea, iris, pupil, eye lens, retina; ciliary muscles change the focal length of the eye lens (accommodation); near point 25 cm, far point infinity.' },
  { id: 'eye-defects', chapter: 'eye', prereqs: ['human-eye', 'lens-formula'],
    name: { en: 'Defects of vision & correction', hi: 'दृष्टि दोष और उनका संशोधन', kn: 'ದೃಷ್ಟಿ ದೋಷಗಳು ಮತ್ತು ಸರಿಪಡಿಸುವಿಕೆ' },
    summary: 'Myopia corrected with concave lens, hypermetropia with convex lens, presbyopia with bifocals; causes of each.' },
  { id: 'prism-dispersion', chapter: 'eye', prereqs: ['refractive-index'],
    name: { en: 'Prism & dispersion', hi: 'प्रिज्म और विक्षेपण', kn: 'ಪಟ್ಟಕ ಮತ್ತು ವರ್ಣ ವಿಭಜನೆ' },
    summary: 'Refraction through a prism, angle of deviation; white light splits into VIBGYOR because each colour bends by a different amount; red bends least, violet most; rainbow.' },
  { id: 'atmospheric-optics', chapter: 'eye', prereqs: ['prism-dispersion'],
    name: { en: 'Atmospheric refraction & scattering', hi: 'वायुमंडलीय अपवर्तन और प्रकीर्णन', kn: 'ವಾತಾವರಣದ ವಕ್ರೀಭವನ ಮತ್ತು ಚದುರುವಿಕೆ' },
    summary: 'Twinkling of stars, advance sunrise and delayed sunset; Tyndall effect; blue sky because small particles scatter blue more; reddish sun at sunrise and sunset.' },

  // ---- Electricity ----
  { id: 'charge-current', chapter: 'electricity', prereqs: [],
    name: { en: 'Charge & electric current', hi: 'आवेश और विद्युत धारा', kn: 'ಆವೇಶ ಮತ್ತು ವಿದ್ಯುತ್ ಪ್ರವಾಹ' },
    summary: 'I = Q/t, ampere, conventional current direction opposite to electron flow; current is the same at every point of a single loop.' },
  { id: 'potential-difference', chapter: 'electricity', prereqs: ['charge-current'],
    name: { en: 'Potential difference & meters', hi: 'विभवांतर और मीटर', kn: 'ವಿಭವಾಂತರ ಮತ್ತು ಮೀಟರ್‌ಗಳು' },
    summary: 'V = W/Q, volt; ammeter in series, voltmeter in parallel; circuit symbols.' },
  { id: 'ohms-law', chapter: 'electricity', prereqs: ['potential-difference'],
    name: { en: 'Ohm’s law', hi: 'ओम का नियम', kn: 'ಓಮ್‌ನ ನಿಯಮ' },
    summary: 'V = IR at constant temperature, straight-line V–I graph through the origin, slope and resistance; resistance is a property of the conductor.' },
  { id: 'resistivity', chapter: 'electricity', prereqs: ['ohms-law'],
    name: { en: 'Resistance factors & resistivity', hi: 'प्रतिरोध के कारक और प्रतिरोधकता', kn: 'ರೋಧದ ಅಂಶಗಳು ಮತ್ತು ರೋಧಕತೆ' },
    summary: 'R = ρL/A: resistance increases with length, decreases with area; resistivity depends on material and temperature, not on shape.' },
  { id: 'series-resistors', chapter: 'electricity', prereqs: ['ohms-law'],
    name: { en: 'Resistors in series', hi: 'श्रेणीक्रम में प्रतिरोधक', kn: 'ಸರಣಿಯಲ್ಲಿ ರೋಧಕಗಳು' },
    summary: 'Rs = R1 + R2 + …; same current through each; voltage divides in proportion to resistance.' },
  { id: 'parallel-resistors', chapter: 'electricity', prereqs: ['ohms-law', 'series-resistors'],
    name: { en: 'Resistors in parallel', hi: 'पार्श्वक्रम में प्रतिरोधक', kn: 'ಸಮಾಂತರದಲ್ಲಿ ರೋಧಕಗಳು' },
    summary: '1/Rp = 1/R1 + 1/R2 + …; equivalent resistance is less than the smallest; same voltage across each; currents add.' },
  { id: 'heating-effect', chapter: 'electricity', prereqs: ['ohms-law'],
    name: { en: 'Heating effect of current', hi: 'विद्युत धारा का तापीय प्रभाव', kn: 'ವಿದ್ಯುತ್ ಪ್ರವಾಹದ ಉಷ್ಣ ಪರಿಣಾಮ' },
    summary: 'Joule’s law H = I²Rt; heaters, bulbs and fuses; why filaments use tungsten.' },
  { id: 'electric-power', chapter: 'electricity', prereqs: ['heating-effect', 'potential-difference'],
    name: { en: 'Electric power & energy', hi: 'विद्युत शक्ति और ऊर्जा', kn: 'ವಿದ್ಯುತ್ ಶಕ್ತಿ (ಪವರ್) ಮತ್ತು ಶಕ್ತಿ' },
    summary: 'P = VI = I²R = V²/R; watt; energy in kWh (1 kWh = 3.6 × 10⁶ J) and electricity bills.' },

  // ---- Magnetic effects of current ----
  { id: 'field-lines', chapter: 'magnetism', prereqs: [],
    name: { en: 'Magnetic field & field lines', hi: 'चुंबकीय क्षेत्र और क्षेत्र रेखाएँ', kn: 'ಕಾಂತಕ್ಷೇತ್ರ ಮತ್ತು ಕ್ಷೇತ್ರ ರೇಖೆಗಳು' },
    summary: 'Field lines go from N to S outside a magnet and S to N inside, form closed loops, never cross; closer lines mean a stronger field; compass needle.' },
  { id: 'field-of-current', chapter: 'magnetism', prereqs: ['field-lines', 'charge-current'],
    name: { en: 'Field due to a current', hi: 'धारा के कारण चुंबकीय क्षेत्र', kn: 'ಪ್ರವಾಹದಿಂದ ಉಂಟಾಗುವ ಕಾಂತಕ್ಷೇತ್ರ' },
    summary: 'Concentric circles around a straight wire, right-hand thumb rule, circular loop, solenoid field like a bar magnet, electromagnets.' },
  { id: 'force-on-conductor', chapter: 'magnetism', prereqs: ['field-of-current'],
    name: { en: 'Force on a current in a field', hi: 'चुंबकीय क्षेत्र में धारावाही चालक पर बल', kn: 'ಕಾಂತಕ್ಷೇತ್ರದಲ್ಲಿ ಪ್ರವಾಹವಾಹಕದ ಮೇಲಿನ ಬಲ' },
    summary: 'Fleming’s left-hand rule; force is greatest when current is perpendicular to the field and zero when parallel; reversing current or field reverses the force.' },
  { id: 'domestic-circuits', chapter: 'magnetism', prereqs: ['electric-power', 'parallel-resistors'],
    name: { en: 'Domestic electric circuits', hi: 'घरेलू विद्युत परिपथ', kn: 'ಮನೆಯ ವಿದ್ಯುತ್ ಮಂಡಲಗಳು' },
    summary: 'Live, neutral and earth wires; appliances in parallel; fuse in series with the live wire; earthing; overloading and short circuit.' },
];

export const MISCONCEPTIONS: Misconception[] = [
  { id: 'angle-from-surface', concepts: ['reflection-laws', 'refraction-basics'],
    label: 'Measures angles from the surface',
    belief: 'Angles of incidence and reflection are measured from the mirror surface.',
    fix: 'Both angles are measured from the normal, the line perpendicular to the surface.',
    cues: ['from the surface', 'from the mirror', 'with the mirror', 'from the glass', 'angle with surface'] },
  { id: 'focus-at-centre', concepts: ['spherical-mirrors', 'mirror-formula'],
    label: 'Puts the focus at the centre of curvature',
    belief: 'The focal length equals the radius of curvature (f = R).',
    fix: 'The focus is midway between the pole and the centre of curvature, so f = R/2.',
    cues: ['f = r', 'f=r', 'same as radius', 'focus is at c', 'equal to radius'] },
  { id: 'mirror-always-virtual', concepts: ['mirror-images', 'lens-images'],
    label: 'Thinks mirrors and lenses always make the same kind of image',
    belief: 'A concave mirror (or convex lens) always gives an enlarged virtual image, or a mirror image is always virtual.',
    fix: 'The image depends on where the object is: beyond F a concave mirror or convex lens gives a real, inverted image.',
    cues: ['always virtual', 'always magnified', 'always erect', 'always enlarged', 'mirror images are virtual'] },
  { id: 'sign-convention', concepts: ['mirror-formula', 'lens-formula'],
    label: 'Sign convention errors',
    belief: 'All distances are positive, or the focal length of a concave mirror is positive.',
    fix: 'Measure from the pole/optical centre: distances against the incident light are negative, so u is negative and a concave mirror has negative f.',
    cues: ['all positive', 'u is positive', 'no sign', 'ignore sign', 'f is positive for concave', 'distance cannot be negative'] },
  { id: 'refraction-speeds-up', concepts: ['refraction-basics', 'refractive-index'],
    label: 'Thinks light speeds up in a denser medium',
    belief: 'Light bends towards the normal because it speeds up in glass or water.',
    fix: 'Light slows down in an optically denser medium, and that is why it bends towards the normal.',
    cues: ['speeds up', 'faster in glass', 'faster in water', 'gains speed', 'denser so faster'] },
  { id: 'higher-n-faster', concepts: ['refractive-index', 'prism-dispersion'],
    label: 'Higher refractive index means faster light',
    belief: 'A medium with a larger refractive index lets light travel faster.',
    fix: 'n = c/v, so a larger refractive index means a smaller speed of light in that medium.',
    cues: ['higher index faster', 'more refractive index more speed', 'n is speed', 'greater n faster'] },
  { id: 'power-in-cm', concepts: ['lens-formula', 'eye-defects'],
    label: 'Uses focal length in cm for lens power',
    belief: 'Power P = 1/f can use f in centimetres.',
    fix: 'Power in dioptres needs f in metres: P = 1/f(m), so f = 50 cm gives P = 2 D.',
    cues: ['1/50', '1 / 50', 'in cm', '0.02', 'centimetre'] },
  { id: 'concave-converges', concepts: ['lens-images', 'eye-defects'],
    label: 'Swaps converging and diverging lenses',
    belief: 'A concave lens converges light, so myopia is corrected with a convex lens.',
    fix: 'A concave lens diverges light; a myopic eye focuses in front of the retina and needs a diverging (concave) lens.',
    cues: ['concave converges', 'convex for myopia', 'convex lens for short sight', 'concave lens converges', 'myopia convex'] },
  { id: 'lens-moves', concepts: ['human-eye'],
    label: 'Thinks the eye lens moves to focus',
    belief: 'The eye focuses on near and far objects by moving the lens forward and back, like a camera.',
    fix: 'Ciliary muscles change the curvature, and so the focal length, of the eye lens; its position does not change.',
    cues: ['lens moves', 'moves forward', 'moves back', 'like a camera', 'distance between lens and retina changes'] },
  { id: 'prism-adds-colour', concepts: ['prism-dispersion'],
    label: 'Thinks the prism creates the colours',
    belief: 'The glass of a prism adds or creates colours in light.',
    fix: 'White light already contains all colours; the prism separates them because each colour refracts by a different amount.',
    cues: ['adds colour', 'creates colour', 'prism colours the light', 'glass makes colours', 'gives colour'] },
  { id: 'sky-reflects-sea', concepts: ['atmospheric-optics'],
    label: 'Blue sky from reflection',
    belief: 'The sky is blue because it reflects the sea, or because the air is blue.',
    fix: 'Tiny air molecules scatter short wavelengths (blue) much more than long wavelengths (red).',
    cues: ['reflects the sea', 'reflection of ocean', 'reflects water', 'air is blue', 'colour of air'] },
  { id: 'current-used-up', concepts: ['charge-current', 'series-resistors'],
    label: 'Current gets used up',
    belief: 'Current is used up by a bulb or resistor, so less current flows after it.',
    fix: 'Charge is conserved: the current is the same at every point in a series loop. Energy is transferred, not current.',
    cues: ['used up', 'uses up', 'use up', 'gets consumed', 'consumes current', 'less current after', 'current decreases after', 'absorbs current', 'uses current'] },
  { id: 'voltmeter-series', concepts: ['potential-difference'],
    label: 'Connects the voltmeter in series',
    belief: 'A voltmeter is connected in series, like an ammeter.',
    fix: 'A voltmeter measures the difference between two points, so it goes in parallel across the component.',
    cues: ['voltmeter in series', 'series with the voltmeter', 'both in series', 'same as ammeter'] },
  { id: 'r-depends-on-v', concepts: ['ohms-law'],
    label: 'Resistance changes with voltage',
    belief: 'Because R = V/I, doubling the voltage doubles the resistance.',
    fix: 'For an ohmic conductor at constant temperature R is fixed; doubling V doubles I and R stays the same.',
    cues: ['resistance doubles', 'resistance increases with voltage', 'r increases', 'more voltage more resistance', 'r = v/i so r'] },
  { id: 'length-area-swapped', concepts: ['resistivity'],
    label: 'Gets length and thickness backwards',
    belief: 'A longer wire has less resistance, or a thicker wire has more resistance.',
    fix: 'R = ρL/A: resistance grows with length and falls as the cross-section area grows.',
    cues: ['longer less', 'thicker more resistance', 'thick wire more', 'longer wire less', 'more area more resistance'] },
  { id: 'resistivity-shape', concepts: ['resistivity'],
    label: 'Thinks resistivity depends on shape',
    belief: 'Stretching or cutting a wire changes its resistivity.',
    fix: 'Resistivity depends only on the material and temperature; shape changes resistance, not resistivity.',
    cues: ['resistivity changes', 'resistivity doubles', 'resistivity halves', 'resistivity depends on length'] },
  { id: 'parallel-adds', concepts: ['parallel-resistors'],
    label: 'Adds resistances in parallel',
    belief: 'Resistors in parallel add up like in series, so the total is larger.',
    fix: 'In parallel the reciprocals add; the equivalent resistance is smaller than the smallest resistor.',
    cues: ['add them', 'r1 + r2', 'sum of resistance', 'total is more', 'adds up', 'greater than'] },
  { id: 'series-voltage-equal', concepts: ['series-resistors'],
    label: 'Equal voltage in series',
    belief: 'Every resistor in series gets the full supply voltage.',
    fix: 'In series the supply voltage divides, with the larger resistor getting the larger share (V = IR, same I).',
    cues: ['same voltage', 'full voltage', 'equal voltage', 'voltage is same in series'] },
  { id: 'heat-linear-in-i', concepts: ['heating-effect', 'electric-power'],
    label: 'Heat or power linear in current',
    belief: 'Doubling the current doubles the heat produced in a resistor.',
    fix: 'H = I²Rt, so doubling the current makes four times the heat.',
    cues: ['doubles the heat', 'twice the heat', 'two times', 'heat doubles', 'directly proportional to current'] },
  { id: 'kwh-is-power', concepts: ['electric-power'],
    label: 'Mixes up kW and kWh',
    belief: 'kWh is a unit of power, or watt is a unit of energy.',
    fix: 'kW measures power (rate); kWh = power × time is energy. 1 kWh = 3.6 × 10⁶ J.',
    cues: ['kwh is power', 'unit of power is kwh', 'watt is energy', 'kw is energy'] },
  { id: 'field-lines-cross', concepts: ['field-lines'],
    label: 'Field lines can cross or end',
    belief: 'Magnetic field lines can cross each other or start and stop in space.',
    fix: 'Field lines never cross (the field has one direction at a point) and form closed loops.',
    cues: ['lines cross', 'can intersect', 'they meet', 'lines end', 'open lines', 'start at north and end'] },
  { id: 'hand-rule-mixup', concepts: ['field-of-current', 'force-on-conductor'],
    label: 'Mixes up the hand rules',
    belief: 'Uses Fleming’s left-hand rule for the field around a wire, or the right-hand thumb rule for the force.',
    fix: 'Right-hand thumb rule: direction of the field around a current. Fleming’s left-hand rule: direction of the force on a current in a field.',
    cues: ['left hand rule for field', 'thumb rule for force', 'fleming right', 'right hand for force'] },
  { id: 'force-parallel-max', concepts: ['force-on-conductor'],
    label: 'Largest force when current is along the field',
    belief: 'The force on a wire is largest when the current runs along the field lines.',
    fix: 'The force is largest when current is perpendicular to the field and zero when parallel.',
    cues: ['parallel maximum', 'along the field', 'same direction as field', 'parallel gives more'] },
  { id: 'fuse-placement', concepts: ['domestic-circuits'],
    label: 'Fuse and earthing confusion',
    belief: 'The fuse goes in the neutral wire or in parallel, or the earth wire carries current all the time.',
    fix: 'The fuse is in series with the live wire; the earth wire carries current only when there is a fault.',
    cues: ['fuse in neutral', 'fuse in parallel', 'earth carries current', 'earth wire always', 'neutral wire fuse'] },
  { id: 'appliances-series', concepts: ['domestic-circuits', 'parallel-resistors'],
    label: 'Appliances wired in series',
    belief: 'Household appliances are connected in series.',
    fix: 'They are in parallel so each gets the full 220 V and can be switched on or off independently.',
    cues: ['in series at home', 'appliances in series', 'connected in series', 'series connection at home'] },
  // Procedural slips that cut across concepts.
  { id: 'formula-rearranged', concepts: ['*'],
    label: 'Rearranges the formula wrongly',
    belief: 'Multiplies where the formula needs dividing (for example R = V × I).',
    fix: 'Write the formula, then isolate the unknown step by step before putting in numbers.',
    cues: ['multiply', 'v × i', 'v*i', 'times', 'product'] },
  { id: 'unit-slip', concepts: ['*'],
    label: 'Unit conversion slip',
    belief: 'Mixes units (cm with m, mA with A, minutes with seconds).',
    fix: 'Convert every quantity to SI units before calculating.',
    cues: ['minutes', 'cm', 'milli', 'did not convert'] },
];

/* ---------- graph helpers ---------- */

export const CONCEPT_BY_ID: Record<string, Concept> = Object.fromEntries(CONCEPTS.map((c) => [c.id, c]));
export const MISCONCEPTION_BY_ID: Record<string, Misconception> = Object.fromEntries(MISCONCEPTIONS.map((m) => [m.id, m]));

/** Concepts that list `id` as a prerequisite. */
export const DEPENDENTS: Record<string, string[]> = (() => {
  const out: Record<string, string[]> = Object.fromEntries(CONCEPTS.map((c) => [c.id, []]));
  for (const c of CONCEPTS) for (const p of c.prereqs) out[p].push(c.id);
  return out;
})();

function closure(start: string, next: (id: string) => string[]): string[] {
  const seen = new Set<string>();
  const stack = [...next(start)];
  while (stack.length) {
    const id = stack.pop()!;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...next(id));
  }
  return [...seen];
}

export const ancestorsOf = (id: string) => closure(id, (x) => CONCEPT_BY_ID[x]?.prereqs ?? []);
export const descendantsOf = (id: string) => closure(id, (x) => DEPENDENTS[x] ?? []);

/** Misconceptions relevant to these concepts (including the cross-cutting procedural ones). */
export function misconceptionsFor(conceptIds: string[]): Misconception[] {
  return MISCONCEPTIONS.filter((m) => m.concepts.includes('*') || m.concepts.some((c) => conceptIds.includes(c)));
}

/** Longest prerequisite chain length below a concept (roots are depth 0). */
export const DEPTH: Record<string, number> = (() => {
  const memo: Record<string, number> = {};
  const depth = (id: string): number => {
    if (memo[id] !== undefined) return memo[id];
    const ps = CONCEPT_BY_ID[id].prereqs;
    memo[id] = ps.length ? 1 + Math.max(...ps.map(depth)) : 0;
    return memo[id];
  };
  CONCEPTS.forEach((c) => depth(c.id));
  return memo;
})();
