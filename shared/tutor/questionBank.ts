/**
 * Seed question bank for CBSE Class 10 Physics. Every question is tagged with:
 *  - the concept it tests (ids from conceptGraph.ts),
 *  - a starting difficulty on a logit scale (−1 easy, 0 medium, +1 hard) that the
 *    learner model re-calibrates from real answers,
 *  - for each wrong option, the misconception that choosing it most likely reveals.
 *
 * When a student runs out of bank questions for a concept, the server generates
 * new ones with the same shape (see tutorRoutes.ts).
 */

export interface TutorQuestion {
  id: string;
  conceptId: string;
  /** Starting difficulty: −1 easy, 0 medium, +1 hard (IRT-style logit). */
  difficulty: number;
  stem: string;
  options: string[];
  correctIndex: number;
  /** option index -> misconception id */
  distractorMisconceptions: Record<number, string>;
  explanation: string;
  source: 'bank' | 'ai';
  language?: string;
}

type Raw = [id: string, concept: string, difficulty: number, stem: string, options: string[], correct: number, mis: Record<number, string>, explanation: string];

const RAW: Raw[] = [
  // ---------- reflection-laws ----------
  ['rl1', 'reflection-laws', -1, 'The angle of incidence on a plane mirror is 40°. What is the angle of reflection?', ['40°', '50°', '80°', '20°'], 0, { 1: 'angle-from-surface' }, 'Angle of reflection = angle of incidence = 40°, both measured from the normal.'],
  ['rl2', 'reflection-laws', 0, 'A ray strikes a plane mirror making 30° with the mirror surface. What is the angle of reflection?', ['60°', '30°', '90°', '120°'], 0, { 1: 'angle-from-surface' }, 'Angles are measured from the normal: 90° − 30° = 60° incidence, so reflection is also 60°.'],
  ['rl3', 'reflection-laws', 1, 'You stand 2 m in front of a plane mirror and walk 0.5 m towards it. How far are you from your image now?', ['3 m', '1.5 m', '4 m', '2.5 m'], 0, {}, 'You are now 1.5 m from the mirror and the image is 1.5 m behind it: 1.5 + 1.5 = 3 m.'],

  // ---------- spherical-mirrors ----------
  ['sm1', 'spherical-mirrors', -1, 'The radius of curvature of a concave mirror is 20 cm. Its focal length is', ['10 cm', '20 cm', '40 cm', '5 cm'], 0, { 1: 'focus-at-centre' }, 'f = R/2 = 20/2 = 10 cm.'],
  ['sm2', 'spherical-mirrors', 0, 'Rays parallel to the principal axis fall on a convex mirror. After reflection they', ['appear to diverge from the focus behind the mirror', 'meet at the focus in front of the mirror', 'meet at the centre of curvature', 'retrace their path'], 0, { 2: 'focus-at-centre' }, 'A convex mirror diverges light; the reflected rays appear to come from its principal focus behind the mirror.'],
  ['sm3', 'spherical-mirrors', 1, 'A ray passing through the centre of curvature of a concave mirror, after reflection,', ['retraces its path', 'passes through the focus', 'becomes parallel to the principal axis', 'reflects at an equal angle on the other side of the axis'], 0, { 1: 'focus-at-centre' }, 'A ray through C hits the mirror along the normal (a radius), so it comes straight back.'],

  // ---------- mirror-images ----------
  ['mi1', 'mirror-images', -1, 'Which mirror is used as a rear-view mirror in vehicles?', ['Convex mirror', 'Concave mirror', 'Plane mirror', 'Any mirror works the same'], 0, {}, 'A convex mirror always gives an erect, diminished image and a wider field of view.'],
  ['mi2', 'mirror-images', 0, 'An object is placed between F and C of a concave mirror. The image is', ['beyond C, real, inverted and enlarged', 'behind the mirror, virtual and enlarged', 'at F, point-sized', 'between F and C, same size'], 0, { 1: 'mirror-always-virtual' }, 'Between F and C, a concave mirror forms a real, inverted, enlarged image beyond C.'],
  ['mi3', 'mirror-images', 1, 'A concave mirror forms an erect image three times the size of the object. The object must be', ['between the pole and the focus', 'at the focus', 'between F and C', 'beyond C'], 0, { 2: 'mirror-always-virtual' }, 'A concave mirror gives an erect (virtual) enlarged image only when the object is between P and F.'],

  // ---------- mirror-formula ----------
  ['mf1', 'mirror-formula', -1, 'The magnification produced by a plane mirror is', ['+1', '−1', '0', 'infinite'], 0, { 1: 'sign-convention' }, 'The image is the same size and erect, so m = +1.'],
  ['mf2', 'mirror-formula', 0, 'With the New Cartesian sign convention, the focal length of a concave mirror is', ['negative', 'positive', 'zero', 'positive or negative depending on the object'], 0, { 1: 'sign-convention', 3: 'sign-convention' }, 'The focus of a concave mirror is in front of it, against the incident light, so f is negative.'],
  ['mf3', 'mirror-formula', 0.5, 'An object is 30 cm in front of a concave mirror of focal length 15 cm. The image distance v is', ['−30 cm', '+30 cm', '−10 cm', '−15 cm'], 0, { 1: 'sign-convention', 2: 'formula-rearranged' }, '1/v = 1/f − 1/u = 1/(−15) − 1/(−30) = −1/30, so v = −30 cm (real image in front of the mirror).'],
  ['mf4', 'mirror-formula', 1, 'An object is 20 cm in front of a convex mirror of focal length 20 cm. The magnification is', ['+0.5', '−0.5', '+2', '−1'], 0, { 1: 'sign-convention' }, 'f = +20, u = −20: 1/v = 1/20 + 1/20, v = +10 cm. m = −v/u = −10/(−20) = +0.5.'],

  // ---------- refraction-basics ----------
  ['rb1', 'refraction-basics', -1, 'A ray of light enters glass from air at an angle. It bends', ['towards the normal', 'away from the normal', 'not at all', 'along the surface'], 0, {}, 'Glass is optically denser, so light slows down and bends towards the normal.'],
  ['rb2', 'refraction-basics', 0, 'Light bends towards the normal when it enters water from air because', ['it slows down in water', 'it speeds up in water', 'water reflects part of it', 'its frequency increases in water'], 0, { 1: 'refraction-speeds-up' }, 'Light travels slower in water than in air; the change in speed causes the bending.'],
  ['rb3', 'refraction-basics', 1, 'A ray passes obliquely through a rectangular glass slab. Compared with the incident ray, the emergent ray is', ['parallel to it but shifted sideways', 'along the same straight line', 'bent towards the normal', 'perpendicular to the slab'], 0, {}, 'The bending at the two parallel faces is equal and opposite, so the ray comes out parallel with a lateral shift.'],

  // ---------- refractive-index ----------
  ['ri1', 'refractive-index', -0.5, 'The refractive index of glass is 1.5. The speed of light in glass is (c = 3 × 10⁸ m/s)', ['2 × 10⁸ m/s', '4.5 × 10⁸ m/s', '1.5 × 10⁸ m/s', '3 × 10⁸ m/s'], 0, { 1: 'higher-n-faster' }, 'v = c/n = 3 × 10⁸ / 1.5 = 2 × 10⁸ m/s.'],
  ['ri2', 'refractive-index', 0, 'Medium A has refractive index 1.33 and medium B has 1.65. Light travels faster in', ['A', 'B', 'both at the same speed', 'cannot be decided'], 0, { 1: 'higher-n-faster' }, 'v = c/n: the smaller refractive index (A) gives the larger speed.'],
  ['ri3', 'refractive-index', 1, 'Refractive index of water w.r.t. air is 4/3 and of glass w.r.t. air is 3/2. The refractive index of glass with respect to water is', ['9/8', '8/9', '2', '17/6'], 0, { 1: 'formula-rearranged' }, 'n(glass, water) = n(glass)/n(water) = (3/2)/(4/3) = 9/8.'],

  // ---------- lens-images ----------
  ['li1', 'lens-images', -1, 'A lens that is thicker in the middle than at the edges is a', ['convex (converging) lens', 'concave (diverging) lens', 'plane lens', 'it cannot focus light'], 0, { 1: 'concave-converges' }, 'Thicker in the middle = convex = converging.'],
  ['li2', 'lens-images', 0, 'A concave lens, for any position of a real object, forms an image that is', ['virtual, erect and diminished', 'real, inverted and diminished', 'virtual, erect and enlarged', 'real, inverted and enlarged'], 0, { 1: 'concave-converges', 3: 'concave-converges' }, 'A diverging lens always forms a virtual, erect, diminished image between F and the optical centre.'],
  ['li3', 'lens-images', 1, 'An object is placed at 2F₁ of a convex lens. The image is', ['at 2F₂, real, inverted, same size', 'at F₂, point-sized', 'beyond 2F₂, enlarged', 'on the same side, virtual and enlarged'], 0, { 3: 'mirror-always-virtual' }, 'At 2F₁ the image is at 2F₂: real, inverted and the same size.'],

  // ---------- lens-formula ----------
  ['lf1', 'lens-formula', -1, 'A convex lens has a focal length of 50 cm. Its power is', ['+2 D', '+0.02 D', '−2 D', '+50 D'], 0, { 1: 'power-in-cm', 2: 'sign-convention' }, 'P = 1/f(in m) = 1/0.5 = +2 D.'],
  ['lf2', 'lens-formula', 0, 'A concave lens has a power of −2.5 D. Its focal length is', ['−40 cm', '+40 cm', '−0.4 cm', '−25 cm'], 0, { 1: 'sign-convention', 2: 'power-in-cm' }, 'f = 1/P = 1/(−2.5) = −0.4 m = −40 cm.'],
  ['lf3', 'lens-formula', 1, 'An object is 15 cm from a convex lens of focal length 10 cm. The image distance is', ['+30 cm', '−30 cm', '+6 cm', '+25 cm'], 0, { 1: 'sign-convention', 2: 'sign-convention' }, '1/v = 1/f + 1/u = 1/10 + 1/(−15) = 1/30, so v = +30 cm (real image on the other side).'],

  // ---------- human-eye ----------
  ['he1', 'human-eye', -1, 'The image formed by the eye lens falls on the', ['retina', 'cornea', 'iris', 'pupil'], 0, {}, 'The retina is the light-sensitive screen of the eye.'],
  ['he2', 'human-eye', 0, 'The eye can focus on both near and distant objects because', ['ciliary muscles change the focal length of the eye lens', 'the eye lens moves towards or away from the retina', 'the pupil changes its size', 'the retina moves forward and back'], 0, { 1: 'lens-moves', 3: 'lens-moves' }, 'Accommodation: ciliary muscles change the curvature (focal length) of the lens; it does not move.'],
  ['he3', 'human-eye', 1, 'When you look at a distant object, the ciliary muscles are ___ and the eye lens is ___.', ['relaxed; thin (longest focal length)', 'contracted; thick', 'relaxed; thick', 'contracted; thin'], 0, { 1: 'lens-moves' }, 'For distant objects the muscles relax and the lens becomes thin, giving its largest focal length.'],

  // ---------- eye-defects ----------
  ['ed1', 'eye-defects', -1, 'Myopia (short-sightedness) is corrected using a', ['concave lens', 'convex lens', 'plane glass', 'prism'], 0, { 1: 'concave-converges' }, 'A myopic eye focuses distant objects in front of the retina; a diverging (concave) lens fixes it.'],
  ['ed2', 'eye-defects', 0, 'In a hypermetropic (long-sighted) eye, the image of a nearby object is formed', ['behind the retina', 'in front of the retina', 'exactly on the retina', 'on the cornea'], 0, { 1: 'concave-converges' }, 'The eye cannot converge enough, so the image would form behind the retina; a convex lens corrects it.'],
  ['ed3', 'eye-defects', 1, 'The far point of a myopic person is 80 cm. The power of the lens needed is', ['−1.25 D', '+1.25 D', '−0.0125 D', '−80 D'], 0, { 1: 'concave-converges', 2: 'power-in-cm', 3: 'power-in-cm' }, 'Use a concave lens with f = −80 cm = −0.8 m: P = 1/(−0.8) = −1.25 D.'],

  // ---------- prism-dispersion ----------
  ['pd1', 'prism-dispersion', -1, 'When white light passes through a glass prism, the colour that bends the least is', ['red', 'violet', 'green', 'blue'], 0, {}, 'Red has the smallest refractive index in glass, so it deviates least; violet deviates most.'],
  ['pd2', 'prism-dispersion', 0, 'A glass prism splits white light into colours because', ['each colour travels at a different speed in glass, so bends by a different amount', 'the glass adds colours to the light', 'the prism absorbs some colours', 'light reflects many times inside the prism'], 0, { 1: 'prism-adds-colour' }, 'White light already contains the colours; different refractive indices separate them (dispersion).'],
  ['pd3', 'prism-dispersion', 1, 'Violet light bends more than red light in glass. So, in glass, violet light', ['travels slower than red light', 'travels faster than red light', 'travels at the same speed as red light', 'has a longer wavelength than red light'], 0, { 1: 'higher-n-faster' }, 'More bending means a higher refractive index, and n = c/v means a lower speed.'],

  // ---------- atmospheric-optics ----------
  ['ao1', 'atmospheric-optics', -1, 'Stars twinkle because', ['atmospheric refraction keeps changing as air layers move', 'stars switch on and off', 'clouds reflect starlight', 'stars move very fast'], 0, {}, 'Changing refraction in moving layers of air makes the apparent position and brightness flicker.'],
  ['ao2', 'atmospheric-optics', 0, 'The clear sky appears blue because', ['air molecules scatter blue light much more than red light', 'the sky reflects the blue sea', 'air is blue in colour', 'air absorbs blue light'], 0, { 1: 'sky-reflects-sea', 2: 'sky-reflects-sea' }, 'Very small particles scatter shorter wavelengths (blue) more strongly.'],
  ['ao3', 'atmospheric-optics', 1, 'The Sun looks reddish at sunrise and sunset because', ['its light crosses more air, so most blue light is scattered away', 'the Sun is cooler in the morning', 'red light is scattered the most', 'refraction bends red light the most'], 0, { 2: 'sky-reflects-sea' }, 'Near the horizon light passes through a thicker layer of air; blue is scattered out, red reaches us.'],

  // ---------- charge-current ----------
  ['cc1', 'charge-current', -1, 'A charge of 10 C flows through a wire in 5 s. The current is', ['2 A', '50 A', '0.5 A', '15 A'], 0, { 1: 'formula-rearranged', 2: 'formula-rearranged' }, 'I = Q/t = 10/5 = 2 A.'],
  ['cc2', 'charge-current', 0, 'In a single-loop circuit, 0.5 A flows into a bulb. The current flowing out of the bulb is', ['0.5 A', 'less than 0.5 A', 'zero', 'more than 0.5 A'], 0, { 1: 'current-used-up', 2: 'current-used-up' }, 'Charge is conserved: the same current flows everywhere in a series loop. The bulb transfers energy, not current.'],
  ['cc3', 'charge-current', 1, 'How many electrons pass a point each second in a wire carrying 1 A? (e = 1.6 × 10⁻¹⁹ C)', ['6.25 × 10¹⁸', '1.6 × 10¹⁹', '1.6 × 10⁻¹⁹', '6.25 × 10⁻¹⁸'], 0, { 1: 'formula-rearranged', 2: 'formula-rearranged' }, 'n = Q/e = 1 C / 1.6 × 10⁻¹⁹ C = 6.25 × 10¹⁸ electrons.'],

  // ---------- potential-difference ----------
  ['pv1', 'potential-difference', -1, 'To measure the potential difference across a resistor, the voltmeter is connected', ['in parallel across the resistor', 'in series with the resistor', 'anywhere in the circuit', 'between the battery and the switch'], 0, { 1: 'voltmeter-series' }, 'A voltmeter compares two points, so it goes across (in parallel with) the component.'],
  ['pv2', 'potential-difference', 0, '12 J of work is done moving 3 C of charge between two points. The potential difference is', ['4 V', '36 V', '0.25 V', '15 V'], 0, { 1: 'formula-rearranged', 2: 'formula-rearranged' }, 'V = W/Q = 12/3 = 4 V.'],
  ['pv3', 'potential-difference', 1, 'A student connects an ammeter and a voltmeter both in series with a bulb. What happens?', ['The bulb barely glows because the voltmeter’s very high resistance blocks the current', 'Both meters read correctly', 'The ammeter burns out', 'The voltmeter reads zero'], 0, { 1: 'voltmeter-series' }, 'A voltmeter has very high resistance; in series it lets almost no current through.'],

  // ---------- ohms-law ----------
  ['oh1', 'ohms-law', -1, 'A 6 V battery is connected across a 3 Ω resistor. The current is', ['2 A', '18 A', '0.5 A', '9 A'], 0, { 1: 'formula-rearranged', 2: 'formula-rearranged' }, 'I = V/R = 6/3 = 2 A.'],
  ['oh2', 'ohms-law', 0, 'The voltage across a fixed resistor is doubled at constant temperature. Its resistance', ['stays the same', 'doubles', 'halves', 'becomes four times'], 0, { 1: 'r-depends-on-v', 3: 'r-depends-on-v' }, 'Resistance is a property of the conductor; doubling V doubles I and R = V/I stays the same.'],
  ['oh3', 'ohms-law', 1, 'On a graph with V on the y-axis and I on the x-axis, conductor A’s line is steeper than conductor B’s. Then', ['A has greater resistance', 'B has greater resistance', 'they have equal resistance', 'neither obeys Ohm’s law'], 0, { 1: 'formula-rearranged' }, 'Slope of V–I = V/I = R, so the steeper line has the greater resistance.'],

  // ---------- resistivity ----------
  ['rs1', 'resistivity', -1, 'The length of a wire is doubled, keeping its thickness the same. Its resistance', ['doubles', 'halves', 'stays the same', 'becomes four times'], 0, { 1: 'length-area-swapped' }, 'R = ρL/A, so R is proportional to length.'],
  ['rs2', 'resistivity', 0, 'A wire is replaced with one of the same material and length but twice the cross-section area. The resistance', ['halves', 'doubles', 'stays the same', 'becomes a quarter'], 0, { 1: 'length-area-swapped' }, 'R = ρL/A: doubling A halves R.'],
  ['rs3', 'resistivity', 1, 'A wire of resistance R is stretched to twice its length (its volume stays the same). Its new resistance and resistivity are', ['4R; resistivity unchanged', '2R; resistivity unchanged', '4R; resistivity doubled', 'R/2; resistivity unchanged'], 0, { 2: 'resistivity-shape', 3: 'length-area-swapped' }, 'Length doubles and area halves, so R × 2 × 2 = 4R. Resistivity depends only on the material.'],

  // ---------- series-resistors ----------
  ['sr1', 'series-resistors', -1, 'Resistors of 2 Ω, 3 Ω and 5 Ω are connected in series. The equivalent resistance is', ['10 Ω', '0.97 Ω', '30 Ω', '5 Ω'], 0, {}, 'In series, add them: 2 + 3 + 5 = 10 Ω.'],
  ['sr2', 'series-resistors', 0, 'A 4 Ω and an 8 Ω resistor are in series across 12 V. The voltage across the 8 Ω resistor is', ['8 V', '12 V', '6 V', '4 V'], 0, { 1: 'series-voltage-equal', 2: 'series-voltage-equal' }, 'I = 12/(4 + 8) = 1 A; V = IR = 1 × 8 = 8 V.'],
  ['sr3', 'series-resistors', 1, 'Two identical bulbs are in series with a battery. A student says the second bulb is dimmer because the first uses up some current. This is', ['wrong: both carry the same current and glow equally', 'right: the first bulb uses up current', 'right, but only for a DC battery', 'wrong: the second bulb gets more current'], 0, { 1: 'current-used-up', 2: 'current-used-up' }, 'In series the current is the same through both, so identical bulbs glow equally.'],

  // ---------- parallel-resistors ----------
  ['pr1', 'parallel-resistors', -1, 'Two 6 Ω resistors are connected in parallel. The equivalent resistance is', ['3 Ω', '12 Ω', '6 Ω', '36 Ω'], 0, { 1: 'parallel-adds' }, '1/Rp = 1/6 + 1/6 = 1/3, so Rp = 3 Ω.'],
  ['pr2', 'parallel-resistors', 0, 'Resistors of 2 Ω and 3 Ω are connected in parallel. The equivalent resistance is', ['1.2 Ω', '5 Ω', '6 Ω', '2.5 Ω'], 0, { 1: 'parallel-adds' }, 'Rp = (2 × 3)/(2 + 3) = 6/5 = 1.2 Ω, less than the smaller resistor.'],
  ['pr3', 'parallel-resistors', 1, 'Resistors of 3 Ω, 6 Ω and 2 Ω are connected in parallel across 6 V. The total current from the supply is', ['6 A', '0.55 A', '1 A', '3 A'], 0, { 1: 'parallel-adds' }, '1/Rp = 1/3 + 1/6 + 1/2 = 1, so Rp = 1 Ω and I = 6/1 = 6 A.'],

  // ---------- heating-effect ----------
  ['hf1', 'heating-effect', -1, 'The heating element of an electric heater is made of a material with', ['high resistivity and a high melting point', 'low resistivity', 'a low melting point', 'zero resistance'], 0, {}, 'High resistivity produces more heat (H = I²Rt) and a high melting point keeps it from melting.'],
  ['hf2', 'heating-effect', 0, 'The current through a resistor is doubled for the same time. The heat produced becomes', ['4 times', '2 times', 'the same', 'half'], 0, { 1: 'heat-linear-in-i' }, 'H = I²Rt, so doubling I makes H four times.'],
  ['hf3', 'heating-effect', 1, 'A current of 2 A flows through a 10 Ω resistor for 30 s. The heat produced is', ['1200 J', '600 J', '20 J', '72000 J'], 0, { 1: 'heat-linear-in-i', 3: 'unit-slip' }, 'H = I²Rt = 2² × 10 × 30 = 1200 J.'],

  // ---------- electric-power ----------
  ['ep1', 'electric-power', -1, 'The unit of electrical energy used in electricity bills is', ['kilowatt-hour (kWh)', 'kilowatt (kW)', 'watt (W)', 'volt (V)'], 0, { 1: 'kwh-is-power', 2: 'kwh-is-power' }, 'Energy = power × time, so the bill counts kWh (1 kWh = 3.6 × 10⁶ J).'],
  ['ep2', 'electric-power', 0, 'A bulb is rated 220 V, 100 W. The current it draws is about', ['0.45 A', '22000 A', '2.2 A', '484 A'], 0, { 1: 'formula-rearranged', 2: 'formula-rearranged' }, 'I = P/V = 100/220 ≈ 0.45 A.'],
  ['ep3', 'electric-power', 1, 'A 2 kW heater is used for 3 hours a day for 30 days. The energy used is', ['180 kWh', '6 kWh', '180 kW', '60 kWh'], 0, { 2: 'kwh-is-power' }, 'E = P × t = 2 kW × (3 × 30) h = 180 kWh.'],

  // ---------- field-lines ----------
  ['fl1', 'field-lines', -1, 'Outside a bar magnet, magnetic field lines go from', ['the north pole to the south pole', 'the south pole to the north pole', 'north pole to north pole', 'they have no direction'], 0, {}, 'Outside the magnet lines run N → S; inside they run S → N, making closed loops.'],
  ['fl2', 'field-lines', 0, 'Two magnetic field lines never cross because', ['the field would have two directions at the crossing point', 'the lines repel each other', 'they are too far apart', 'actually they can cross near the poles'], 0, { 3: 'field-lines-cross' }, 'At any point the field has one direction; a crossing would mean two directions there.'],
  ['fl3', 'field-lines', 1, 'Inside a bar magnet, the magnetic field lines', ['run from S to N, completing closed loops', 'run from N to S', 'do not exist', 'start at N and end at S'], 0, { 2: 'field-lines-cross', 3: 'field-lines-cross' }, 'Field lines are closed loops: N → S outside and S → N inside the magnet.'],

  // ---------- field-of-current ----------
  ['fc1', 'field-of-current', -1, 'The magnetic field lines around a straight current-carrying wire are', ['concentric circles centred on the wire', 'straight lines parallel to the wire', 'straight lines going out from the wire', 'there is no magnetic field'], 0, {}, 'They form concentric circles in planes perpendicular to the wire.'],
  ['fc2', 'field-of-current', 0, 'The direction of the magnetic field around a straight current-carrying wire is found by', ['the right-hand thumb rule', 'Fleming’s left-hand rule', 'Snell’s law', 'the laws of reflection'], 0, { 1: 'hand-rule-mixup' }, 'Point the right thumb along the current; the curled fingers give the field direction.'],
  ['fc3', 'field-of-current', 1, 'The magnetic field inside a long current-carrying solenoid is', ['uniform, with parallel lines along the axis', 'zero', 'circles around each turn only', 'strongest at the ends'], 0, {}, 'Inside a long solenoid the field is nearly uniform, like inside a bar magnet.'],

  // ---------- force-on-conductor ----------
  ['fo1', 'force-on-conductor', -1, 'The direction of the force on a current-carrying conductor in a magnetic field is given by', ['Fleming’s left-hand rule', 'the right-hand thumb rule', 'Ohm’s law', 'Snell’s law'], 0, { 1: 'hand-rule-mixup' }, 'Fleming’s left-hand rule: First finger = Field, seCond finger = Current, thuMb = Motion (force).'],
  ['fo2', 'force-on-conductor', 0, 'The force on a current-carrying wire in a magnetic field is largest when the wire is', ['perpendicular to the field', 'parallel to the field', 'at 30° to the field', 'the force is the same at every angle'], 0, { 1: 'force-parallel-max' }, 'Force is maximum at 90° to the field and zero when the current is parallel to it.'],
  ['fo3', 'force-on-conductor', 1, 'Both the current direction and the magnetic field direction are reversed. The force on the conductor', ['stays in the same direction', 'reverses', 'becomes zero', 'doubles'], 0, { 1: 'hand-rule-mixup' }, 'Reversing one reverses the force; reversing both reverses it twice, so it is unchanged.'],

  // ---------- domestic-circuits ----------
  ['dc1', 'domestic-circuits', -1, 'In a household circuit, the fuse is connected', ['in series with the live wire', 'in the neutral wire', 'in parallel with the appliance', 'in the earth wire'], 0, { 1: 'fuse-placement', 2: 'fuse-placement', 3: 'fuse-placement' }, 'A fuse in series with the live wire cuts the supply when it melts.'],
  ['dc2', 'domestic-circuits', 0, 'Household appliances are connected in parallel because', ['each gets the full 220 V and can be switched on or off on its own', 'it reduces the electricity bill', 'they are actually connected in series', 'parallel wiring uses less wire'], 0, { 2: 'appliances-series' }, 'In parallel every appliance gets the same voltage and works independently.'],
  ['dc3', 'domestic-circuits', 1, 'A 220 V circuit has a 5 A fuse. Which set of appliances can run together without blowing the fuse?', ['a 500 W TV and a 500 W iron', 'a 1000 W heater and a 200 W fan', 'two 1000 W heaters', 'a 1500 W geyser'], 0, {}, 'I = P/V: 1000 W / 220 V ≈ 4.5 A is under 5 A; 1200 W needs about 5.5 A.'],
];

export const QUESTION_BANK: TutorQuestion[] = RAW.map(([id, conceptId, difficulty, stem, options, correctIndex, distractorMisconceptions, explanation]) => ({
  id: `bank-${id}`,
  conceptId,
  difficulty,
  stem,
  options,
  correctIndex,
  distractorMisconceptions,
  explanation,
  source: 'bank',
}));

export const QUESTIONS_BY_CONCEPT: Record<string, TutorQuestion[]> = QUESTION_BANK.reduce<Record<string, TutorQuestion[]>>((acc, q) => {
  (acc[q.conceptId] ??= []).push(q);
  return acc;
}, {});
