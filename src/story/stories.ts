/**
 * 3D story lessons for CBSE Class 10 Physics. Each story is a short narrated scene from
 * everyday Indian life; every beat sets what the 3D stage shows and where the camera looks.
 * Together the 12 stories cover all 24 concepts of the concept graph.
 *
 * Numbers in the narration are checked against physics.ts (see scripts/check-tutor.mts).
 */
import type { ChapterKey } from '../../shared/tutor/conceptGraph';
import type { Cam, KitName, SceneState } from './Story3D';

export type L3 = { en: string; hi: string; kn: string };

export interface Beat {
  say: L3;
  set?: SceneState;
  cam?: Cam;
}

export interface Control {
  key: string;
  label: L3;
  min?: number;
  max?: number;
  step?: number;
  /** Shown value = state value × scale (e.g. scene units → cm). */
  scale?: number;
  unit?: string;
  /** Show the value without its sign (object distance as a positive number of cm). */
  abs?: boolean;
  options?: { value: string | number; label: L3 }[];
  toggle?: boolean;
}

export interface Story {
  id: string;
  chapter: ChapterKey;
  concepts: string[];
  kit: KitName;
  color: string;
  title: L3;
  premise: L3;
  base: SceneState;
  beats: Beat[];
  experiment: { intro: L3; start?: SceneState; cam?: Cam; controls: Control[] };
}

const t = (en: string, hi: string, kn: string): L3 => ({ en, hi, kn });

/* shared controls */
const C = {
  objectDistance: { key: 'u', label: t('Object distance', 'वस्तु की दूरी', 'ವಸ್ತುವಿನ ದೂರ'), min: -7, max: -0.5, step: 0.05, scale: 10, unit: 'cm', abs: true },
  focal: { key: 'f', label: t('Focal length', 'फोकस दूरी', 'ನಾಭಿ ದೂರ'), min: 0.8, max: 2.5, step: 0.05, scale: 10, unit: 'cm' },
  incidence: { key: 'incidence', label: t('Angle of incidence', 'आपतन कोण', 'ಪತನ ಕೋನ'), min: 0, max: 80, step: 1, unit: '°' },
  rays: { key: 'rays', label: t('Show rays', 'किरणें दिखाएँ', 'ಕಿರಣಗಳು ತೋರಿಸಿ'), toggle: true },
  labels: { key: 'labels', label: t('Show labels', 'नाम दिखाएँ', 'ಹೆಸರುಗಳು ತೋರಿಸಿ'), toggle: true },
  voltage: { key: 'V', label: t('Battery voltage', 'बैटरी वोल्टेज', 'ಬ್ಯಾಟರಿ ವೋಲ್ಟೇಜ್'), min: 0, max: 12, step: 0.5, unit: 'V' },
  resistance: { key: 'R', label: t('Resistance', 'प्रतिरोध', 'ರೋಧ'), min: 1, max: 20, step: 0.5, unit: 'Ω' },
  current: { key: 'current', label: t('Current (− reverses it)', 'धारा (− से उल्टी)', 'ಪ್ರವಾಹ (− ತಿರುಗಿಸುತ್ತದೆ)'), min: -4, max: 4, step: 0.25, unit: 'A' },
} satisfies Record<string, Control>;

export const STORIES: Story[] = [
  /* ============ LIGHT ============ */
  {
    id: 'sunny-mirror',
    chapter: 'light',
    concepts: ['reflection-laws', 'spherical-mirrors'],
    kit: 'optics',
    color: '#FF9F1C',
    title: t('Meera and the sunny mirror', 'मीरा और धूप वाला दर्पण', 'ಮೀರಾ ಮತ್ತು ಬಿಸಿಲಿನ ಕನ್ನಡಿ'),
    premise: t('Where does light go when it bounces?', 'टकराकर प्रकाश कहाँ जाता है?', 'ಬೆಳಕು ಪುಟಿದಾಗ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತದೆ?'),
    base: { mode: 'reflection', incidence: 30, rays: 1, labels: 1, f: 1.5, beam: 0 },
    beats: [
      {
        set: { rays: 0 },
        cam: [-3, 1.5, 10, -1.5, 0, 0],
        say: t(
          'Meera is playing with a small mirror on a sunny afternoon. She wants to flash sunlight onto her brother’s wall. But where exactly will the light go?',
          'धूप भरी दोपहर में मीरा एक छोटे दर्पण से खेल रही है। वह भाई की दीवार पर धूप चमकाना चाहती है। पर प्रकाश ठीक-ठीक जाएगा कहाँ?',
          'ಬಿಸಿಲಿನ ಮಧ್ಯಾಹ್ನ ಮೀರಾ ಸಣ್ಣ ಕನ್ನಡಿಯಿಂದ ಆಟವಾಡುತ್ತಿದ್ದಾಳೆ. ತಮ್ಮನ ಗೋಡೆಯ ಮೇಲೆ ಬಿಸಿಲು ಹೊಳೆಸಬೇಕೆಂದಿದ್ದಾಳೆ. ಆದರೆ ಬೆಳಕು ನಿಖರವಾಗಿ ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತದೆ?'
        ),
      },
      {
        set: { rays: 1, incidence: 30 },
        say: t(
          'She shines a torch at the mirror and the light bounces back. The dotted line coming straight out of the mirror is called the normal. We measure every angle from the normal.',
          'वह टॉर्च से दर्पण पर प्रकाश डालती है और प्रकाश लौट आता है। दर्पण से सीधी बाहर निकलती बिंदुदार रेखा को अभिलंब कहते हैं। हर कोण हम अभिलंब से ही नापते हैं।',
          'ಅವಳು ಕನ್ನಡಿಯ ಮೇಲೆ ಟಾರ್ಚ್ ಬೆಳಕು ಬಿಡುತ್ತಾಳೆ, ಬೆಳಕು ಹಿಂದಿರುಗುತ್ತದೆ. ಕನ್ನಡಿಯಿಂದ ನೇರವಾಗಿ ಹೊರಬರುವ ಚುಕ್ಕೆ ರೇಖೆಯನ್ನು ಲಂಬ (ನಾರ್ಮಲ್) ಎನ್ನುತ್ತಾರೆ. ಎಲ್ಲಾ ಕೋನಗಳನ್ನು ಲಂಬದಿಂದಲೇ ಅಳೆಯುತ್ತೇವೆ.'
        ),
      },
      {
        cam: [-2, 0.5, 7, -1.2, 0, 0],
        say: t(
          'The torch ray makes 30 degrees with the normal: that is the angle of incidence, i. The bounced ray also makes 30 degrees: the angle of reflection, r. Always, i equals r.',
          'टॉर्च की किरण अभिलंब से 30 डिग्री बनाती है: यह आपतन कोण i है। लौटी किरण भी 30 डिग्री बनाती है: यह परावर्तन कोण r है। हमेशा i बराबर r होता है।',
          'ಟಾರ್ಚ್ ಕಿರಣ ಲಂಬದೊಂದಿಗೆ 30 ಡಿಗ್ರಿ ಮಾಡುತ್ತದೆ: ಇದು ಪತನ ಕೋನ i. ಪುಟಿದ ಕಿರಣವೂ 30 ಡಿಗ್ರಿ ಮಾಡುತ್ತದೆ: ಇದು ಪ್ರತಿಫಲನ ಕೋನ r. ಯಾವಾಗಲೂ i ಮತ್ತು r ಸಮ.'
        ),
      },
      {
        set: { incidence: 60 },
        say: t(
          'She tilts the torch to 60 degrees, and the reflected ray swings to 60 degrees on the other side. Careful: if a ray makes 30 degrees with the mirror surface, it makes 60 degrees with the normal.',
          'वह टॉर्च 60 डिग्री पर झुकाती है, और परावर्तित किरण दूसरी ओर 60 डिग्री पर चली जाती है। ध्यान दें: जो किरण दर्पण की सतह से 30 डिग्री बनाती है, वह अभिलंब से 60 डिग्री बनाती है।',
          'ಅವಳು ಟಾರ್ಚನ್ನು 60 ಡಿಗ್ರಿಗೆ ಬಾಗಿಸುತ್ತಾಳೆ, ಪ್ರತಿಫಲಿತ ಕಿರಣ ಇನ್ನೊಂದು ಕಡೆ 60 ಡಿಗ್ರಿಗೆ ಹೋಗುತ್ತದೆ. ಎಚ್ಚರ: ಕನ್ನಡಿಯ ಮೇಲ್ಮೈಯೊಂದಿಗೆ 30 ಡಿಗ್ರಿ ಮಾಡುವ ಕಿರಣ ಲಂಬದೊಂದಿಗೆ 60 ಡಿಗ್ರಿ ಮಾಡುತ್ತದೆ.'
        ),
      },
      {
        set: { mode: 'concave-mirror', beam: 1, f: 1.5 },
        cam: [-3, 2.5, 10, -1, 0, 0],
        say: t(
          'Now Meera picks up Papa’s shaving mirror. It curves inwards, like the inside of a steel spoon. This is a concave mirror.',
          'अब मीरा पापा का शेविंग दर्पण उठाती है। यह स्टील की चम्मच के अंदर जैसा भीतर की ओर मुड़ा है। यह अवतल दर्पण है।',
          'ಈಗ ಮೀರಾ ಅಪ್ಪನ ಶೇವಿಂಗ್ ಕನ್ನಡಿ ಎತ್ತುತ್ತಾಳೆ. ಇದು ಸ್ಟೀಲ್ ಚಮಚದ ಒಳಭಾಗದಂತೆ ಒಳಕ್ಕೆ ಬಾಗಿದೆ. ಇದು ನಿಮ್ನ (ಕಾನ್ಕೇವ್) ಕನ್ನಡಿ.'
        ),
      },
      {
        cam: [0, 0.6, 10, -1, 0, 0],
        say: t(
          'Parallel sunlight hits it and every ray bounces to one single point, the principal focus F. That is why a concave mirror can burn paper in sunlight! The centre of the mirror is the pole, P.',
          'समानांतर धूप इस पर पड़ती है और हर किरण एक ही बिंदु पर पहुँचती है, मुख्य फोकस F पर। इसीलिए अवतल दर्पण धूप में कागज़ जला सकता है! दर्पण का बीच का बिंदु ध्रुव P है।',
          'ಸಮಾಂತರ ಬಿಸಿಲು ಇದರ ಮೇಲೆ ಬಿದ್ದು ಪ್ರತಿ ಕಿರಣವೂ ಒಂದೇ ಬಿಂದುವಿಗೆ, ಮುಖ್ಯ ನಾಭಿ F ಗೆ ಪುಟಿಯುತ್ತದೆ. ಅದಕ್ಕೇ ನಿಮ್ನ ಕನ್ನಡಿ ಬಿಸಿಲಿನಲ್ಲಿ ಕಾಗದ ಸುಡಬಲ್ಲದು! ಕನ್ನಡಿಯ ಮಧ್ಯಬಿಂದು ಧ್ರುವ P.'
        ),
      },
      {
        say: t(
          'The mirror is a slice of a big sphere, and the centre of that sphere is C, the centre of curvature. Look: F sits exactly halfway between P and C. So the focal length is half the radius: f equals R by 2.',
          'यह दर्पण एक बड़े गोले का टुकड़ा है, और उस गोले का केंद्र C है, वक्रता केंद्र। देखिए: F ठीक P और C के बीच में है। इसलिए फोकस दूरी त्रिज्या की आधी होती है: f बराबर R बटा 2।',
          'ಈ ಕನ್ನಡಿ ಒಂದು ದೊಡ್ಡ ಗೋಳದ ತುಂಡು, ಆ ಗೋಳದ ಕೇಂದ್ರ C, ವಕ್ರತಾ ಕೇಂದ್ರ. ನೋಡಿ: F ನಿಖರವಾಗಿ P ಮತ್ತು C ಮಧ್ಯೆ ಇದೆ. ಆದ್ದರಿಂದ ನಾಭಿ ದೂರ ತ್ರಿಜ್ಯದ ಅರ್ಧ: f ಸಮ R ಭಾಗಿಸು 2.'
        ),
      },
      {
        set: { mode: 'convex-mirror', beam: 1 },
        say: t(
          'A convex mirror bulges outwards. Parallel rays spread apart after bouncing, as if they came from a focus behind the mirror. Remember P, F and C: next we use them to find images.',
          'उत्तल दर्पण बाहर की ओर उभरा होता है। समानांतर किरणें टकराकर फैल जाती हैं, मानो दर्पण के पीछे के फोकस से आ रही हों। P, F और C याद रखिए: आगे इन्हीं से प्रतिबिंब खोजेंगे।',
          'ಉಬ್ಬು (ಕಾನ್ವೆಕ್ಸ್) ಕನ್ನಡಿ ಹೊರಕ್ಕೆ ಉಬ್ಬಿರುತ್ತದೆ. ಸಮಾಂತರ ಕಿರಣಗಳು ಪುಟಿದ ನಂತರ ಹರಡುತ್ತವೆ, ಕನ್ನಡಿಯ ಹಿಂದಿನ ನಾಭಿಯಿಂದ ಬಂದಂತೆ. P, F, C ನೆನಪಿಡಿ: ಮುಂದೆ ಇವುಗಳಿಂದ ಪ್ರತಿಬಿಂಬ ಹುಡುಕುತ್ತೇವೆ.'
        ),
      },
    ],
    experiment: {
      intro: t('Change the angle and the mirror. Does i always equal r?', 'कोण और दर्पण बदलिए। क्या i हमेशा r के बराबर है?', 'ಕೋನ ಮತ್ತು ಕನ್ನಡಿ ಬದಲಿಸಿ. i ಯಾವಾಗಲೂ r ಗೆ ಸಮವೇ?'),
      start: { mode: 'reflection', incidence: 40 },
      controls: [
        { key: 'mode', label: t('Mirror', 'दर्पण', 'ಕನ್ನಡಿ'), options: [
          { value: 'reflection', label: t('Plane mirror + torch', 'समतल दर्पण + टॉर्च', 'ಸಮತಲ ಕನ್ನಡಿ + ಟಾರ್ಚ್') },
          { value: 'concave-mirror', label: t('Concave mirror', 'अवतल दर्पण', 'ನಿಮ್ನ ಕನ್ನಡಿ') },
          { value: 'convex-mirror', label: t('Convex mirror', 'उत्तल दर्पण', 'ಉಬ್ಬು ಕನ್ನಡಿ') },
        ] },
        C.incidence,
        C.focal,
      ],
    },
  },
  {
    id: 'bus-mirror',
    chapter: 'light',
    concepts: ['mirror-images', 'mirror-formula'],
    kit: 'optics',
    color: '#FF5DA2',
    title: t('The bus mirror and the dentist’s mirror', 'बस का दर्पण और डेंटिस्ट का दर्पण', 'ಬಸ್ ಕನ್ನಡಿ ಮತ್ತು ದಂತ ವೈದ್ಯರ ಕನ್ನಡಿ'),
    premise: t('Why does one mirror shrink and another magnify?', 'एक दर्पण छोटा और दूसरा बड़ा क्यों दिखाता है?', 'ಒಂದು ಕನ್ನಡಿ ಕುಗ್ಗಿಸಿ ಇನ್ನೊಂದು ಏಕೆ ದೊಡ್ಡದು ಮಾಡುತ್ತದೆ?'),
    base: { mode: 'concave-mirror', f: 1.5, u: -6, h: 1, beam: 0, rays: 1, labels: 1, image: 1 },
    beats: [
      {
        cam: [-3, 2, 11, -2, 0, 0],
        say: t(
          'Arjun rides the bus to school. The driver’s side mirror shows the whole road, small and upright. At the dentist, a little mirror shows his tooth big. Same light, different mirrors. Let’s find out why.',
          'अर्जुन बस से स्कूल जाता है। ड्राइवर का साइड मिरर पूरी सड़क छोटी और सीधी दिखाता है। डेंटिस्ट का छोटा दर्पण उसका दाँत बड़ा दिखाता है। प्रकाश वही, दर्पण अलग। चलिए कारण खोजें।',
          'ಅರ್ಜುನ್ ಬಸ್‌ನಲ್ಲಿ ಶಾಲೆಗೆ ಹೋಗುತ್ತಾನೆ. ಚಾಲಕನ ಪಕ್ಕದ ಕನ್ನಡಿ ಇಡೀ ರಸ್ತೆಯನ್ನು ಚಿಕ್ಕದಾಗಿ ನೇರವಾಗಿ ತೋರಿಸುತ್ತದೆ. ದಂತ ವೈದ್ಯರ ಕನ್ನಡಿ ಅವನ ಹಲ್ಲನ್ನು ದೊಡ್ಡದಾಗಿ ತೋರಿಸುತ್ತದೆ. ಬೆಳಕು ಅದೇ, ಕನ್ನಡಿ ಬೇರೆ. ಕಾರಣ ನೋಡೋಣ.'
        ),
      },
      {
        say: t(
          'Here is a concave mirror with a candle far away, beyond C. Follow rays from the flame: the one parallel to the axis bounces through F, the one hitting the pole bounces back at the same angle. Where they meet, the image forms: small and upside down.',
          'यह अवतल दर्पण है और मोमबत्ती दूर, C से आगे है। लौ से किरणें देखिए: अक्ष के समानांतर किरण टकराकर F से गुज़रती है, ध्रुव पर पड़ने वाली किरण उसी कोण पर लौटती है। जहाँ ये मिलती हैं, वहीं प्रतिबिंब बनता है: छोटा और उल्टा।',
          'ಇದು ನಿಮ್ನ ಕನ್ನಡಿ, ಮೇಣದಬತ್ತಿ ದೂರದಲ್ಲಿ C ಆಚೆ ಇದೆ. ಜ್ವಾಲೆಯಿಂದ ಕಿರಣಗಳನ್ನು ನೋಡಿ: ಅಕ್ಷಕ್ಕೆ ಸಮಾಂತರ ಕಿರಣ F ಮೂಲಕ ಪುಟಿಯುತ್ತದೆ, ಧ್ರುವಕ್ಕೆ ಬಿದ್ದ ಕಿರಣ ಅದೇ ಕೋನದಲ್ಲಿ ಹಿಂದಿರುಗುತ್ತದೆ. ಅವು ಸೇರುವಲ್ಲಿ ಪ್ರತಿಬಿಂಬ: ಚಿಕ್ಕದು ಮತ್ತು ತಲೆಕೆಳಗು.'
        ),
      },
      {
        set: { u: -3 },
        say: t(
          'Move the candle to C. The image also forms at C: real, upside down and the same size. Real means light truly reaches there, so you could catch it on a paper screen.',
          'मोमबत्ती को C पर लाइए। प्रतिबिंब भी C पर बनता है: वास्तविक, उल्टा और उतना ही बड़ा। वास्तविक का मतलब है प्रकाश सचमुच वहाँ पहुँचता है, इसलिए इसे कागज़ के पर्दे पर पकड़ सकते हैं।',
          'ಮೇಣದಬತ್ತಿಯನ್ನು C ಗೆ ತನ್ನಿ. ಪ್ರತಿಬಿಂಬವೂ C ಯಲ್ಲೇ: ನೈಜ, ತಲೆಕೆಳಗು, ಅದೇ ಗಾತ್ರ. ನೈಜ ಎಂದರೆ ಬೆಳಕು ನಿಜವಾಗಿ ಅಲ್ಲಿ ತಲುಪುತ್ತದೆ, ಆದ್ದರಿಂದ ಕಾಗದದ ಪರದೆಯ ಮೇಲೆ ಹಿಡಿಯಬಹುದು.'
        ),
      },
      {
        set: { u: -2.2 },
        say: t(
          'Between F and C, the image moves beyond C and grows bigger, still upside down. This is how a projector throws a big picture on the wall.',
          'F और C के बीच, प्रतिबिंब C से आगे चला जाता है और बड़ा हो जाता है, अब भी उल्टा। प्रोजेक्टर इसी तरह दीवार पर बड़ी तस्वीर बनाता है।',
          'F ಮತ್ತು C ನಡುವೆ, ಪ್ರತಿಬಿಂಬ C ಆಚೆ ಹೋಗಿ ದೊಡ್ಡದಾಗುತ್ತದೆ, ಇನ್ನೂ ತಲೆಕೆಳಗು. ಪ್ರೊಜೆಕ್ಟರ್ ಹೀಗೇ ಗೋಡೆಯ ಮೇಲೆ ದೊಡ್ಡ ಚಿತ್ರ ಮೂಡಿಸುತ್ತದೆ.'
        ),
      },
      {
        set: { u: -1.5 },
        say: t(
          'At F, the reflected rays come out parallel and never meet: the image is at infinity. A torch keeps its bulb exactly here to make a straight beam.',
          'F पर, परावर्तित किरणें समानांतर निकलती हैं और कभी नहीं मिलतीं: प्रतिबिंब अनंत पर है। टॉर्च सीधी रोशनी के लिए बल्ब ठीक यहीं रखती है।',
          'F ನಲ್ಲಿ, ಪ್ರತಿಫಲಿತ ಕಿರಣಗಳು ಸಮಾಂತರವಾಗಿ ಹೊರಬಂದು ಎಂದೂ ಸೇರುವುದಿಲ್ಲ: ಪ್ರತಿಬಿಂಬ ಅನಂತದಲ್ಲಿ. ಟಾರ್ಚ್ ನೇರ ಬೆಳಕಿಗಾಗಿ ಬಲ್ಬನ್ನು ನಿಖರವಾಗಿ ಇಲ್ಲೇ ಇಡುತ್ತದೆ.'
        ),
      },
      {
        set: { u: -0.9 },
        cam: [1.5, 1.5, 9, 0.5, 0.5, 0],
        say: t(
          'Closer than F, the bounced rays spread apart. Trace them back behind the mirror, and they seem to come from a big, upright image. It is virtual: no light is really there. This is the dentist’s mirror!',
          'F से पास, टकराई किरणें फैल जाती हैं। इन्हें दर्पण के पीछे की ओर बढ़ाइए: ये एक बड़े, सीधे प्रतिबिंब से आती लगती हैं। यह आभासी है: वहाँ सचमुच प्रकाश नहीं है। यही डेंटिस्ट का दर्पण है!',
          'F ಗಿಂತ ಹತ್ತಿರ, ಪುಟಿದ ಕಿರಣಗಳು ಹರಡುತ್ತವೆ. ಅವನ್ನು ಕನ್ನಡಿಯ ಹಿಂದೆ ವಿಸ್ತರಿಸಿ: ದೊಡ್ಡ, ನೇರ ಪ್ರತಿಬಿಂಬದಿಂದ ಬಂದಂತೆ ಕಾಣುತ್ತವೆ. ಇದು ಮಿಥ್ಯಾ (ವರ್ಚುವಲ್): ಅಲ್ಲಿ ನಿಜವಾಗಿ ಬೆಳಕಿಲ್ಲ. ಇದೇ ದಂತ ವೈದ್ಯರ ಕನ್ನಡಿ!'
        ),
      },
      {
        set: { mode: 'convex-mirror', u: -3 },
        cam: [0, 1, 11, 0, 0, 0],
        say: t(
          'Now the bus mirror: a convex mirror. Wherever the object is, its image is small, upright and virtual, behind the mirror. Small images let the driver see a wide stretch of road.',
          'अब बस का दर्पण: उत्तल दर्पण। वस्तु कहीं भी हो, प्रतिबिंब छोटा, सीधा और आभासी, दर्पण के पीछे बनता है। छोटे प्रतिबिंब से ड्राइवर सड़क का बड़ा हिस्सा देख पाता है।',
          'ಈಗ ಬಸ್ ಕನ್ನಡಿ: ಉಬ್ಬು ಕನ್ನಡಿ. ವಸ್ತು ಎಲ್ಲೇ ಇರಲಿ, ಪ್ರತಿಬಿಂಬ ಚಿಕ್ಕದು, ನೇರ, ಮಿಥ್ಯಾ, ಕನ್ನಡಿಯ ಹಿಂದೆ. ಚಿಕ್ಕ ಪ್ರತಿಬಿಂಬಗಳಿಂದ ಚಾಲಕ ರಸ್ತೆಯ ವಿಶಾಲ ಭಾಗ ನೋಡಬಲ್ಲ.'
        ),
      },
      {
        set: { mode: 'concave-mirror', u: -4.5 },
        say: t(
          'To find the image without drawing, use the mirror formula: 1 by v plus 1 by u equals 1 by f. Measure from the pole; distances in front of the mirror are negative. Object at minus 45 centimetres, f minus 15 gives v minus 22.5 centimetres, and m equals minus v by u, minus 0.5: upside down and half the size.',
          'बिना चित्र बनाए प्रतिबिंब खोजने के लिए दर्पण सूत्र: 1 बटा v जमा 1 बटा u बराबर 1 बटा f। दूरी ध्रुव से नापें; दर्पण के सामने की दूरियाँ ऋणात्मक। वस्तु माइनस 45 सेंटीमीटर, f माइनस 15 से v माइनस 22.5 सेंटीमीटर आता है, और m बराबर माइनस v बटा u, यानी माइनस 0.5: उल्टा और आधा।',
          'ಚಿತ್ರ ಬಿಡಿಸದೆ ಪ್ರತಿಬಿಂಬ ಹುಡುಕಲು ಕನ್ನಡಿ ಸೂತ್ರ: 1 ಭಾಗಿಸು v ಕೂಡಿಸು 1 ಭಾಗಿಸು u ಸಮ 1 ಭಾಗಿಸು f. ದೂರವನ್ನು ಧ್ರುವದಿಂದ ಅಳೆಯಿರಿ; ಕನ್ನಡಿಯ ಮುಂದಿನ ದೂರಗಳು ಋಣ. ವಸ್ತು ಮೈನಸ್ 45 ಸೆಂ.ಮೀ, f ಮೈನಸ್ 15 ಆದರೆ v ಮೈನಸ್ 22.5 ಸೆಂ.ಮೀ, m ಸಮ ಮೈನಸ್ v ಭಾಗಿಸು u, ಮೈನಸ್ 0.5: ತಲೆಕೆಳಗು, ಅರ್ಧ ಗಾತ್ರ.'
        ),
      },
    ],
    experiment: {
      intro: t('Slide the candle. Watch where the image goes and how big it gets.', 'मोमबत्ती खिसकाइए। देखिए प्रतिबिंब कहाँ जाता है और कितना बड़ा होता है।', 'ಮೇಣದಬತ್ತಿ ಸರಿಸಿ. ಪ್ರತಿಬಿಂಬ ಎಲ್ಲಿ ಹೋಗುತ್ತದೆ, ಎಷ್ಟು ದೊಡ್ಡದಾಗುತ್ತದೆ ನೋಡಿ.'),
      start: { mode: 'concave-mirror', u: -4, beam: 0 },
      controls: [
        { key: 'mode', label: t('Mirror', 'दर्पण', 'ಕನ್ನಡಿ'), options: [
          { value: 'concave-mirror', label: t('Concave', 'अवतल', 'ನಿಮ್ನ') },
          { value: 'convex-mirror', label: t('Convex', 'उत्तल', 'ಉಬ್ಬು') },
          { value: 'plane-mirror', label: t('Plane', 'समतल', 'ಸಮತಲ') },
        ] },
        C.objectDistance,
        C.focal,
        C.rays,
      ],
    },
  },
  {
    id: 'broken-pencil',
    chapter: 'light',
    concepts: ['refraction-basics', 'refractive-index'],
    kit: 'optics',
    color: '#2EC4B6',
    title: t('The broken pencil in Dadi’s glass', 'दादी के गिलास में टूटी पेंसिल', 'ಅಜ್ಜಿಯ ಲೋಟದಲ್ಲಿ ಮುರಿದ ಪೆನ್ಸಿಲ್'),
    premise: t('Why does light bend when it enters water?', 'पानी में जाकर प्रकाश क्यों मुड़ता है?', 'ನೀರಿಗೆ ಹೋದಾಗ ಬೆಳಕು ಏಕೆ ಬಾಗುತ್ತದೆ?'),
    base: { mode: 'slab', incidence: 40, n: 1.33, speed: 0, ghost: 0, rays: 1, labels: 1 },
    beats: [
      {
        say: t(
          'At lunch, Meera drops a pencil into Dadi’s glass of water. It looks broken at the surface! The pencil is perfectly fine. It is the light coming from it that bends.',
          'खाने के समय मीरा दादी के पानी के गिलास में पेंसिल डालती है। सतह पर पेंसिल टूटी दिखती है! पेंसिल बिल्कुल ठीक है। उससे आने वाला प्रकाश मुड़ता है।',
          'ಊಟದ ಹೊತ್ತಿನಲ್ಲಿ ಮೀರಾ ಅಜ್ಜಿಯ ನೀರಿನ ಲೋಟಕ್ಕೆ ಪೆನ್ಸಿಲ್ ಹಾಕುತ್ತಾಳೆ. ಮೇಲ್ಮೈಯಲ್ಲಿ ಪೆನ್ಸಿಲ್ ಮುರಿದಂತೆ ಕಾಣುತ್ತದೆ! ಪೆನ್ಸಿಲ್ ಸರಿಯಾಗಿಯೇ ಇದೆ. ಅದರಿಂದ ಬರುವ ಬೆಳಕು ಬಾಗುತ್ತದೆ.'
        ),
      },
      {
        set: { speed: 1 },
        cam: [-1, 1, 9, -0.5, 0, 0],
        say: t(
          'Watch the light pulses. In air they rush along. When they enter water they slow down, and that change of speed makes the light change direction. This bending is called refraction.',
          'प्रकाश की चमकती बूँदें देखिए। हवा में वे तेज़ चलती हैं। पानी में घुसते ही धीमी हो जाती हैं, और गति बदलने से प्रकाश की दिशा बदल जाती है। इस मुड़ने को अपवर्तन कहते हैं।',
          'ಬೆಳಕಿನ ಮಿಂಚುಗಳನ್ನು ನೋಡಿ. ಗಾಳಿಯಲ್ಲಿ ವೇಗವಾಗಿ ಓಡುತ್ತವೆ. ನೀರಿಗೆ ಪ್ರವೇಶಿಸಿದಾಗ ನಿಧಾನವಾಗುತ್ತವೆ, ವೇಗದ ಬದಲಾವಣೆ ಬೆಳಕಿನ ದಿಕ್ಕನ್ನು ಬದಲಿಸುತ್ತದೆ. ಈ ಬಾಗುವಿಕೆಯೇ ವಕ್ರೀಭವನ.'
        ),
      },
      {
        set: { ghost: 1 },
        say: t(
          'Light entering a denser medium like water or glass slows down and bends towards the normal. The dotted line shows where it would have gone with no water at all.',
          'पानी या काँच जैसे सघन माध्यम में जाता प्रकाश धीमा होकर अभिलंब की ओर मुड़ता है। बिंदुदार रेखा दिखाती है कि पानी न होता तो प्रकाश कहाँ जाता।',
          'ನೀರು ಅಥವಾ ಗಾಜಿನಂತಹ ಸಾಂದ್ರ ಮಾಧ್ಯಮಕ್ಕೆ ಹೋಗುವ ಬೆಳಕು ನಿಧಾನವಾಗಿ ಲಂಬದ ಕಡೆಗೆ ಬಾಗುತ್ತದೆ. ನೀರೇ ಇಲ್ಲದಿದ್ದರೆ ಬೆಳಕು ಎಲ್ಲಿ ಹೋಗುತ್ತಿತ್ತು ಎಂದು ಚುಕ್ಕೆ ರೇಖೆ ತೋರಿಸುತ್ತದೆ.'
        ),
      },
      {
        set: { n: 1.5, ghost: 0 },
        say: t(
          'Now a glass block. On the way out, light speeds up again and bends away from the normal. It leaves parallel to the way it came in, only shifted sideways. That shift is called lateral displacement.',
          'अब काँच का गुटका। बाहर निकलते समय प्रकाश फिर तेज़ होकर अभिलंब से दूर मुड़ता है। वह आने की दिशा के समानांतर निकलता है, बस थोड़ा खिसककर। इस खिसकाव को पार्श्व विस्थापन कहते हैं।',
          'ಈಗ ಗಾಜಿನ ತುಂಡು. ಹೊರಬರುವಾಗ ಬೆಳಕು ಮತ್ತೆ ವೇಗ ಪಡೆದು ಲಂಬದಿಂದ ದೂರ ಬಾಗುತ್ತದೆ. ಬಂದ ದಿಕ್ಕಿಗೆ ಸಮಾಂತರವಾಗಿ, ಸ್ವಲ್ಪ ಪಕ್ಕಕ್ಕೆ ಸರಿದು ಹೊರಬರುತ್ತದೆ. ಈ ಸರಿತವೇ ಪಾರ್ಶ್ವ ಸ್ಥಳಾಂತರ.'
        ),
      },
      {
        cam: [-1.5, 0.8, 7, -1, 0.3, 0],
        say: t(
          'Snell’s law: sin i divided by sin r is always the same number for a pair of media. Here i is 40 degrees and r is 25 degrees, and sin 40 divided by sin 25 is 1.5.',
          'स्नेल का नियम: किसी दो माध्यमों के लिए sin i बटा sin r हमेशा एक ही संख्या होती है। यहाँ i 40 डिग्री और r 25 डिग्री है, और sin 40 बटा sin 25 बराबर 1.5 है।',
          'ಸ್ನೆಲ್ ನಿಯಮ: ಎರಡು ಮಾಧ್ಯಮಗಳಿಗೆ sin i ಭಾಗಿಸು sin r ಯಾವಾಗಲೂ ಒಂದೇ ಸಂಖ್ಯೆ. ಇಲ್ಲಿ i 40 ಡಿಗ್ರಿ, r 25 ಡಿಗ್ರಿ, sin 40 ಭಾಗಿಸು sin 25 ಸಮ 1.5.'
        ),
      },
      {
        set: { n: 2.42 },
        cam: [-1, 1, 9, -0.5, 0, 0],
        say: t(
          'That number is the refractive index, n: the speed of light in air divided by its speed in the medium. Glass, n 1.5: light moves at 2 lakh kilometres per second. Diamond, n 2.42: slower still, so it bends even more.',
          'वही संख्या अपवर्तनांक n है: हवा में प्रकाश की चाल बटा माध्यम में चाल। काँच, n 1.5: प्रकाश 2 लाख किलोमीटर प्रति सेकंड चलता है। हीरा, n 2.42: और भी धीमा, इसलिए और अधिक मुड़ता है।',
          'ಆ ಸಂಖ್ಯೆಯೇ ವಕ್ರೀಭವನ ಸೂಚ್ಯಂಕ n: ಗಾಳಿಯಲ್ಲಿ ಬೆಳಕಿನ ವೇಗ ಭಾಗಿಸು ಮಾಧ್ಯಮದಲ್ಲಿನ ವೇಗ. ಗಾಜು, n 1.5: ಬೆಳಕು ಸೆಕೆಂಡಿಗೆ 2 ಲಕ್ಷ ಕಿ.ಮೀ. ವಜ್ರ, n 2.42: ಇನ್ನೂ ನಿಧಾನ, ಆದ್ದರಿಂದ ಇನ್ನೂ ಹೆಚ್ಚು ಬಾಗುತ್ತದೆ.'
        ),
      },
      {
        set: { n: 1.33 },
        say: t(
          'So remember: a bigger refractive index means slower light, not faster. Water 1.33, glass 1.5, diamond 2.42. Light is fastest in air and slowest in diamond.',
          'तो याद रखिए: बड़ा अपवर्तनांक मतलब धीमा प्रकाश, तेज़ नहीं। पानी 1.33, काँच 1.5, हीरा 2.42। प्रकाश हवा में सबसे तेज़ और हीरे में सबसे धीमा।',
          'ನೆನಪಿಡಿ: ದೊಡ್ಡ ವಕ್ರೀಭವನ ಸೂಚ್ಯಂಕ ಎಂದರೆ ನಿಧಾನ ಬೆಳಕು, ವೇಗವಲ್ಲ. ನೀರು 1.33, ಗಾಜು 1.5, ವಜ್ರ 2.42. ಬೆಳಕು ಗಾಳಿಯಲ್ಲಿ ಅತಿ ವೇಗ, ವಜ್ರದಲ್ಲಿ ಅತಿ ನಿಧಾನ.'
        ),
      },
    ],
    experiment: {
      intro: t('Change the material and the angle. When does light bend the most?', 'पदार्थ और कोण बदलिए। प्रकाश सबसे ज़्यादा कब मुड़ता है?', 'ವಸ್ತು ಮತ್ತು ಕೋನ ಬದಲಿಸಿ. ಬೆಳಕು ಯಾವಾಗ ಅತಿ ಹೆಚ್ಚು ಬಾಗುತ್ತದೆ?'),
      start: { n: 1.5, speed: 1, ghost: 1 },
      controls: [
        { key: 'n', label: t('Refractive index n', 'अपवर्तनांक n', 'ವಕ್ರೀಭವನ ಸೂಚ್ಯಂಕ n'), min: 1, max: 2.5, step: 0.01 },
        C.incidence,
        { key: 'speed', label: t('Show light pulses', 'प्रकाश की बूँदें', 'ಬೆಳಕಿನ ಮಿಂಚುಗಳು'), toggle: true },
        { key: 'ghost', label: t('Path without glass', 'काँच के बिना रास्ता', 'ಗಾಜಿಲ್ಲದ ದಾರಿ'), toggle: true },
      ],
    },
  },
  {
    id: 'magnifying-glass',
    chapter: 'light',
    concepts: ['lens-images', 'lens-formula'],
    kit: 'optics',
    color: '#7C3AED',
    title: t('Dadaji’s magnifying glass', 'दादाजी का आवर्धक लेंस', 'ಅಜ್ಜನ ಭೂತಗನ್ನಡಿ'),
    premise: t('How can one glass make letters look huge?', 'एक काँच अक्षरों को बड़ा कैसे दिखाता है?', 'ಒಂದು ಗಾಜು ಅಕ್ಷರಗಳನ್ನು ಹೇಗೆ ದೊಡ್ಡದು ಮಾಡುತ್ತದೆ?'),
    base: { mode: 'convex-lens', f: 1.5, u: -6, h: 1, beam: 1, rays: 1, labels: 1, image: 1 },
    beats: [
      {
        cam: [0, 1.5, 11, 0.5, 0, 0],
        say: t(
          'Dadaji reads the newspaper with a magnifying glass. It is a convex lens, thicker in the middle. Parallel light passing through it comes together at the focus, F2.',
          'दादाजी आवर्धक लेंस से अख़बार पढ़ते हैं। यह उत्तल लेंस है, बीच में मोटा। इससे गुज़रता समानांतर प्रकाश फोकस F2 पर इकट्ठा होता है।',
          'ಅಜ್ಜ ಭೂತಗನ್ನಡಿಯಿಂದ ಪತ್ರಿಕೆ ಓದುತ್ತಾರೆ. ಇದು ಪೀನ (ಕಾನ್ವೆಕ್ಸ್) ಮಸೂರ, ಮಧ್ಯದಲ್ಲಿ ದಪ್ಪ. ಇದರ ಮೂಲಕ ಹೋಗುವ ಸಮಾಂತರ ಬೆಳಕು ನಾಭಿ F2 ನಲ್ಲಿ ಸೇರುತ್ತದೆ.'
        ),
      },
      {
        set: { mode: 'concave-lens' },
        say: t(
          'A concave lens is thinner in the middle. It spreads light out, as if the rays came from a focus F1 on the same side. Convex lenses converge light; concave lenses diverge it.',
          'अवतल लेंस बीच में पतला होता है। यह प्रकाश फैलाता है, मानो किरणें उसी ओर के फोकस F1 से आ रही हों। उत्तल लेंस प्रकाश समेटता है, अवतल लेंस फैलाता है।',
          'ನಿಮ್ನ (ಕಾನ್ಕೇವ್) ಮಸೂರ ಮಧ್ಯದಲ್ಲಿ ತೆಳು. ಇದು ಬೆಳಕನ್ನು ಹರಡುತ್ತದೆ, ಕಿರಣಗಳು ಅದೇ ಬದಿಯ ನಾಭಿ F1 ನಿಂದ ಬಂದಂತೆ. ಪೀನ ಮಸೂರ ಬೆಳಕನ್ನು ಒಟ್ಟುಗೂಡಿಸುತ್ತದೆ, ನಿಮ್ನ ಮಸೂರ ಹರಡುತ್ತದೆ.'
        ),
      },
      {
        set: { mode: 'convex-lens', beam: 0, u: -6 },
        say: t(
          'Put a candle far from a convex lens, beyond 2F1. A ray parallel to the axis bends through F2; a ray through the optical centre O goes straight. The image is real, upside down and small. Cameras and our own eyes work like this.',
          'उत्तल लेंस से दूर, 2F1 के पार मोमबत्ती रखिए। अक्ष के समानांतर किरण मुड़कर F2 से गुज़रती है; प्रकाश केंद्र O से जाने वाली किरण सीधी जाती है। प्रतिबिंब वास्तविक, उल्टा और छोटा है। कैमरा और हमारी आँख ऐसे ही काम करते हैं।',
          'ಪೀನ ಮಸೂರದಿಂದ ದೂರ, 2F1 ಆಚೆ ಮೇಣದಬತ್ತಿ ಇಡಿ. ಅಕ್ಷಕ್ಕೆ ಸಮಾಂತರ ಕಿರಣ ಬಾಗಿ F2 ಮೂಲಕ ಹೋಗುತ್ತದೆ; ದೃಕ್ ಕೇಂದ್ರ O ಮೂಲಕ ಹೋಗುವ ಕಿರಣ ನೇರವಾಗಿ ಹೋಗುತ್ತದೆ. ಪ್ರತಿಬಿಂಬ ನೈಜ, ತಲೆಕೆಳಗು, ಚಿಕ್ಕದು. ಕ್ಯಾಮೆರಾ ಮತ್ತು ನಮ್ಮ ಕಣ್ಣು ಹೀಗೇ ಕೆಲಸ ಮಾಡುತ್ತವೆ.'
        ),
      },
      {
        set: { u: -3 },
        say: t(
          'At 2F1, the image forms at 2F2: the same size and upside down.',
          '2F1 पर, प्रतिबिंब 2F2 पर बनता है: उतना ही बड़ा और उल्टा।',
          '2F1 ನಲ್ಲಿ, ಪ್ರತಿಬಿಂಬ 2F2 ನಲ್ಲಿ: ಅದೇ ಗಾತ್ರ, ತಲೆಕೆಳಗು.'
        ),
      },
      {
        set: { u: -2 },
        say: t(
          'Between F1 and 2F1, the image goes beyond 2F2: bigger and still upside down. Film projectors use this.',
          'F1 और 2F1 के बीच, प्रतिबिंब 2F2 के पार बनता है: बड़ा और अब भी उल्टा। फ़िल्म प्रोजेक्टर इसी का उपयोग करते हैं।',
          'F1 ಮತ್ತು 2F1 ನಡುವೆ, ಪ್ರತಿಬಿಂಬ 2F2 ಆಚೆ: ದೊಡ್ಡದು, ಇನ್ನೂ ತಲೆಕೆಳಗು. ಚಲನಚಿತ್ರ ಪ್ರೊಜೆಕ್ಟರ್‌ಗಳು ಇದನ್ನು ಬಳಸುತ್ತವೆ.'
        ),
      },
      {
        set: { u: -0.9 },
        cam: [-1, 1.5, 9, -1, 0.5, 0],
        say: t(
          'Now Dadaji’s trick: the newspaper is closer than F1. The rays leaving the lens spread apart, and our eye traces them back to a big, upright, virtual image on the same side. That is magnification!',
          'अब दादाजी की तरकीब: अख़बार F1 से पास है। लेंस से निकलती किरणें फैल जाती हैं, और हमारी आँख उन्हें पीछे की ओर बढ़ाकर उसी ओर एक बड़ा, सीधा, आभासी प्रतिबिंब देखती है। यही आवर्धन है!',
          'ಈಗ ಅಜ್ಜನ ಉಪಾಯ: ಪತ್ರಿಕೆ F1 ಗಿಂತ ಹತ್ತಿರ. ಮಸೂರದಿಂದ ಹೊರಬರುವ ಕಿರಣಗಳು ಹರಡುತ್ತವೆ, ನಮ್ಮ ಕಣ್ಣು ಅವನ್ನು ಹಿಂದಕ್ಕೆ ವಿಸ್ತರಿಸಿ ಅದೇ ಬದಿಯಲ್ಲಿ ದೊಡ್ಡ, ನೇರ, ಮಿಥ್ಯಾ ಪ್ರತಿಬಿಂಬ ಕಾಣುತ್ತದೆ. ಇದೇ ವರ್ಧನೆ!'
        ),
      },
      {
        set: { mode: 'concave-lens', u: -3 },
        cam: [0, 1, 11, 0, 0, 0],
        say: t(
          'A concave lens always gives a small, upright, virtual image, at any distance. That is why it can never work as a magnifying glass.',
          'अवतल लेंस हर दूरी पर छोटा, सीधा, आभासी प्रतिबिंब ही देता है। इसीलिए यह कभी आवर्धक लेंस नहीं बन सकता।',
          'ನಿಮ್ನ ಮಸೂರ ಯಾವ ದೂರದಲ್ಲೂ ಚಿಕ್ಕ, ನೇರ, ಮಿಥ್ಯಾ ಪ್ರತಿಬಿಂಬವನ್ನೇ ಕೊಡುತ್ತದೆ. ಅದಕ್ಕೇ ಅದು ಎಂದೂ ಭೂತಗನ್ನಡಿ ಆಗದು.'
        ),
      },
      {
        set: { mode: 'convex-lens', u: -2.25 },
        say: t(
          'The lens formula: 1 by v minus 1 by u equals 1 by f. With f plus 15 centimetres and the object at minus 22.5, v is plus 45 centimetres and m equals v by u, minus 2: real, upside down, twice as big. Power P equals 1 by f in metres: 1 by 0.15 is about 6.7 dioptres. Always convert to metres first!',
          'लेंस सूत्र: 1 बटा v घटा 1 बटा u बराबर 1 बटा f। f प्लस 15 सेंटीमीटर और वस्तु माइनस 22.5 पर, v प्लस 45 सेंटीमीटर और m बराबर v बटा u, माइनस 2: वास्तविक, उल्टा, दोगुना। क्षमता P बराबर 1 बटा f मीटर में: 1 बटा 0.15 लगभग 6.7 डायोप्टर। पहले मीटर में बदलना न भूलें!',
          'ಮಸೂರ ಸೂತ್ರ: 1 ಭಾಗಿಸು v ಕಳೆ 1 ಭಾಗಿಸು u ಸಮ 1 ಭಾಗಿಸು f. f ಪ್ಲಸ್ 15 ಸೆಂ.ಮೀ, ವಸ್ತು ಮೈನಸ್ 22.5 ಆದರೆ v ಪ್ಲಸ್ 45 ಸೆಂ.ಮೀ, m ಸಮ v ಭಾಗಿಸು u, ಮೈನಸ್ 2: ನೈಜ, ತಲೆಕೆಳಗು, ಎರಡು ಪಟ್ಟು. ಸಾಮರ್ಥ್ಯ P ಸಮ 1 ಭಾಗಿಸು f ಮೀಟರ್‌ನಲ್ಲಿ: 1 ಭಾಗಿಸು 0.15 ಸುಮಾರು 6.7 ಡಯಾಪ್ಟರ್. ಮೊದಲು ಮೀಟರ್‌ಗೆ ಬದಲಿಸಿ!'
        ),
      },
    ],
    experiment: {
      intro: t('Move the candle and change the lens. Can you make a magnified, upright image?', 'मोमबत्ती खिसकाइए, लेंस बदलिए। क्या आप बड़ा, सीधा प्रतिबिंब बना सकते हैं?', 'ಮೇಣದಬತ್ತಿ ಸರಿಸಿ, ಮಸೂರ ಬದಲಿಸಿ. ದೊಡ್ಡ, ನೇರ ಪ್ರತಿಬಿಂಬ ಮಾಡಬಲ್ಲಿರಾ?'),
      start: { mode: 'convex-lens', u: -4, beam: 0 },
      controls: [
        { key: 'mode', label: t('Lens', 'लेंस', 'ಮಸೂರ'), options: [
          { value: 'convex-lens', label: t('Convex', 'उत्तल', 'ಪೀನ') },
          { value: 'concave-lens', label: t('Concave', 'अवतल', 'ನಿಮ್ನ') },
        ] },
        C.objectDistance,
        C.focal,
        C.rays,
      ],
    },
  },
  /* ============ HUMAN EYE ============ */
  {
    id: 'ravi-eyes',
    chapter: 'eye',
    concepts: ['human-eye', 'eye-defects'],
    kit: 'optics',
    color: '#12C26B',
    title: t('Why Ravi can’t read the board', 'रवि बोर्ड क्यों नहीं पढ़ पाता', 'ರವಿಗೆ ಬೋರ್ಡ್ ಏಕೆ ಓದಲಾಗುವುದಿಲ್ಲ'),
    premise: t('What goes wrong inside an eye, and how glasses fix it.', 'आँख के अंदर क्या गड़बड़ होती है, और चश्मा कैसे ठीक करता है।', 'ಕಣ್ಣಿನೊಳಗೆ ಏನು ತಪ್ಪುತ್ತದೆ, ಕನ್ನಡಕ ಹೇಗೆ ಸರಿಪಡಿಸುತ್ತದೆ.'),
    base: { mode: 'eye', defect: 'none', object: 'far', correction: 0, rays: 1, labels: 1 },
    beats: [
      {
        cam: [-1.5, 1.2, 9.5, -1, 0, 0],
        say: t(
          'Ravi sits on the last bench and squints at the blackboard. To help him, let’s look inside an eye. Light enters through the cornea and the pupil, and the eye lens focuses it on the retina at the back, like a screen.',
          'रवि आख़िरी बेंच पर बैठकर आँखें सिकोड़कर बोर्ड देखता है। उसकी मदद के लिए आँख के अंदर झाँकें। प्रकाश कॉर्निया और पुतली से अंदर आता है, और नेत्र लेंस उसे पीछे रेटिना पर फोकस करता है, जैसे पर्दे पर।',
          'ರವಿ ಕೊನೆಯ ಬೆಂಚಿನಲ್ಲಿ ಕುಳಿತು ಕಣ್ಣು ಕಿರಿದಾಗಿಸಿ ಬೋರ್ಡ್ ನೋಡುತ್ತಾನೆ. ಅವನಿಗೆ ಸಹಾಯ ಮಾಡಲು ಕಣ್ಣಿನೊಳಗೆ ನೋಡೋಣ. ಬೆಳಕು ಕಾರ್ನಿಯಾ ಮತ್ತು ಪಾಪೆಯ ಮೂಲಕ ಒಳಬರುತ್ತದೆ, ಕಣ್ಣಿನ ಮಸೂರ ಅದನ್ನು ಹಿಂದಿನ ರೆಟಿನಾದ ಮೇಲೆ ಕೇಂದ್ರೀಕರಿಸುತ್ತದೆ, ಪರದೆಯಂತೆ.'
        ),
      },
      {
        set: { object: 'near' },
        say: t(
          'Ravi looks down at his book. Tiny ciliary muscles squeeze the lens and make it fatter, so its focal length gets shorter and the book stays sharp. This power to adjust is called accommodation. The lens does not move; it changes shape.',
          'रवि अपनी किताब देखता है। छोटी सिलियरी मांसपेशियाँ लेंस को दबाकर मोटा कर देती हैं, जिससे फोकस दूरी घटती है और किताब साफ़ दिखती है। इस समायोजन क्षमता को समंजन कहते हैं। लेंस खिसकता नहीं, उसका आकार बदलता है।',
          'ರವಿ ತನ್ನ ಪುಸ್ತಕ ನೋಡುತ್ತಾನೆ. ಸಣ್ಣ ಸಿಲಿಯರಿ ಸ್ನಾಯುಗಳು ಮಸೂರವನ್ನು ಒತ್ತಿ ದಪ್ಪ ಮಾಡುತ್ತವೆ, ನಾಭಿ ದೂರ ಕಡಿಮೆಯಾಗಿ ಪುಸ್ತಕ ಸ್ಪಷ್ಟವಾಗಿರುತ್ತದೆ. ಈ ಹೊಂದಾಣಿಕೆ ಸಾಮರ್ಥ್ಯವೇ ಸಮಂಜನ. ಮಸೂರ ಚಲಿಸುವುದಿಲ್ಲ; ಆಕಾರ ಬದಲಿಸುತ್ತದೆ.'
        ),
      },
      {
        set: { object: 'far' },
        say: t(
          'Looking far away, the muscles relax and the lens becomes thin. A healthy eye sees clearly from 25 centimetres, the near point, all the way to infinity, the far point.',
          'दूर देखते समय मांसपेशियाँ ढीली होती हैं और लेंस पतला हो जाता है। स्वस्थ आँख 25 सेंटीमीटर, निकट बिंदु, से लेकर अनंत, दूर बिंदु, तक साफ़ देखती है।',
          'ದೂರ ನೋಡುವಾಗ ಸ್ನಾಯುಗಳು ಸಡಿಲವಾಗಿ ಮಸೂರ ತೆಳುವಾಗುತ್ತದೆ. ಆರೋಗ್ಯಕರ ಕಣ್ಣು 25 ಸೆಂ.ಮೀ, ಸಮೀಪ ಬಿಂದು, ಇಂದ ಅನಂತ, ದೂರ ಬಿಂದು, ವರೆಗೆ ಸ್ಪಷ್ಟವಾಗಿ ನೋಡುತ್ತದೆ.'
        ),
      },
      {
        set: { defect: 'myopia' },
        cam: [1, 1, 7.5, 1.2, 0, 0],
        say: t(
          'Ravi’s eyeball is a little too long. Light from the board meets in front of the retina, and by the time it reaches the retina it has spread into a blur. This is myopia, short-sightedness.',
          'रवि की आँख का गोला थोड़ा लंबा है। बोर्ड से आता प्रकाश रेटिना के आगे मिल जाता है, और रेटिना तक पहुँचते-पहुँचते धुंधला फैल जाता है। यह निकट दृष्टि दोष, मायोपिया है।',
          'ರವಿಯ ಕಣ್ಣುಗುಡ್ಡೆ ಸ್ವಲ್ಪ ಉದ್ದ. ಬೋರ್ಡಿನಿಂದ ಬರುವ ಬೆಳಕು ರೆಟಿನಾದ ಮುಂದೆಯೇ ಸೇರುತ್ತದೆ, ರೆಟಿನಾ ತಲುಪುವಾಗ ಮಸುಕಾಗಿ ಹರಡಿರುತ್ತದೆ. ಇದು ಸಮೀಪ ದೃಷ್ಟಿ ದೋಷ, ಮಯೋಪಿಯಾ.'
        ),
      },
      {
        set: { correction: 1 },
        cam: [-1.5, 1.2, 9.5, -0.8, 0, 0],
        say: t(
          'The fix is a concave lens. It spreads the light out a little before it enters the eye, so the focus moves back exactly onto the retina. The board is sharp again!',
          'इलाज है अवतल लेंस। यह आँख में घुसने से पहले प्रकाश को थोड़ा फैला देता है, जिससे फोकस ठीक रेटिना पर आ जाता है। बोर्ड फिर साफ़!',
          'ಪರಿಹಾರ ನಿಮ್ನ ಮಸೂರ. ಕಣ್ಣಿಗೆ ಪ್ರವೇಶಿಸುವ ಮೊದಲು ಬೆಳಕನ್ನು ಸ್ವಲ್ಪ ಹರಡುತ್ತದೆ, ನಾಭಿ ನಿಖರವಾಗಿ ರೆಟಿನಾದ ಮೇಲೆ ಬರುತ್ತದೆ. ಬೋರ್ಡ್ ಮತ್ತೆ ಸ್ಪಷ್ಟ!'
        ),
      },
      {
        set: { defect: 'hypermetropia', object: 'near', correction: 0 },
        say: t(
          'Ravi’s grandmother has the opposite problem. Her book would focus behind the retina. This is hypermetropia, long-sightedness: far things look clear, near things blur.',
          'रवि की दादी को उल्टी समस्या है। उनकी किताब का प्रतिबिंब रेटिना के पीछे बनता है। यह दूर दृष्टि दोष, हाइपरमेट्रोपिया है: दूर की चीज़ें साफ़, पास की धुंधली।',
          'ರವಿಯ ಅಜ್ಜಿಗೆ ವಿರುದ್ಧ ಸಮಸ್ಯೆ. ಅವರ ಪುಸ್ತಕದ ಪ್ರತಿಬಿಂಬ ರೆಟಿನಾದ ಹಿಂದೆ ಮೂಡುತ್ತದೆ. ಇದು ದೂರ ದೃಷ್ಟಿ ದೋಷ, ಹೈಪರ್‌ಮೆಟ್ರೋಪಿಯಾ: ದೂರದವು ಸ್ಪಷ್ಟ, ಹತ್ತಿರದವು ಮಸುಕು.'
        ),
      },
      {
        set: { correction: 1 },
        say: t(
          'A convex lens adds the extra bending, so the rays meet on the retina. With age the eye lens also stiffens: that is presbyopia, and bifocal glasses have both kinds of lens in one.',
          'उत्तल लेंस अतिरिक्त मोड़ देता है, जिससे किरणें रेटिना पर मिलती हैं। उम्र के साथ नेत्र लेंस कड़ा भी हो जाता है: यह जरा-दूरदृष्टिता है, और बाइफ़ोकल चश्मे में दोनों तरह के लेंस होते हैं।',
          'ಪೀನ ಮಸೂರ ಹೆಚ್ಚುವರಿ ಬಾಗುವಿಕೆ ಕೊಡುತ್ತದೆ, ಕಿರಣಗಳು ರೆಟಿನಾದ ಮೇಲೆ ಸೇರುತ್ತವೆ. ವಯಸ್ಸಾದಂತೆ ಕಣ್ಣಿನ ಮಸೂರ ಗಟ್ಟಿಯಾಗುತ್ತದೆ: ಇದು ಪ್ರೆಸ್ಬಯೋಪಿಯಾ, ಬೈಫೋಕಲ್ ಕನ್ನಡಕದಲ್ಲಿ ಎರಡೂ ಬಗೆಯ ಮಸೂರಗಳಿರುತ್ತವೆ.'
        ),
      },
    ],
    experiment: {
      intro: t('Pick an eye, look near or far, and put on glasses.', 'आँख चुनिए, पास या दूर देखिए, और चश्मा लगाइए।', 'ಕಣ್ಣು ಆರಿಸಿ, ಹತ್ತಿರ ಅಥವಾ ದೂರ ನೋಡಿ, ಕನ್ನಡಕ ಹಾಕಿ.'),
      start: { defect: 'myopia', object: 'far', correction: 0 },
      controls: [
        { key: 'defect', label: t('Eye', 'आँख', 'ಕಣ್ಣು'), options: [
          { value: 'none', label: t('Healthy', 'स्वस्थ', 'ಆರೋಗ್ಯಕರ') },
          { value: 'myopia', label: t('Myopia', 'निकट दृष्टि दोष', 'ಸಮೀಪ ದೃಷ್ಟಿ ದೋಷ') },
          { value: 'hypermetropia', label: t('Hypermetropia', 'दूर दृष्टि दोष', 'ದೂರ ದೃಷ್ಟಿ ದೋಷ') },
        ] },
        { key: 'object', label: t('Looking at', 'क्या देख रहे हैं', 'ನೋಡುತ್ತಿರುವುದು'), options: [
          { value: 'far', label: t('Far (board)', 'दूर (बोर्ड)', 'ದೂರ (ಬೋರ್ಡ್)') },
          { value: 'near', label: t('Near (book)', 'पास (किताब)', 'ಹತ್ತಿರ (ಪುಸ್ತಕ)') },
        ] },
        { key: 'correction', label: t('Wear glasses', 'चश्मा लगाएँ', 'ಕನ್ನಡಕ ಹಾಕಿ'), toggle: true },
      ],
    },
  },
  {
    id: 'monsoon-rainbow',
    chapter: 'eye',
    concepts: ['prism-dispersion', 'atmospheric-optics'],
    kit: 'optics',
    color: '#FF5DA2',
    title: t('The monsoon rainbow', 'मानसून का इंद्रधनुष', 'ಮುಂಗಾರಿನ ಕಾಮನಬಿಲ್ಲು'),
    premise: t('Where do the colours of a rainbow, a blue sky and a red sunset come from?', 'इंद्रधनुष, नीले आसमान और लाल सूर्यास्त के रंग कहाँ से आते हैं?', 'ಕಾಮನಬಿಲ್ಲು, ನೀಲಿ ಆಕಾಶ, ಕೆಂಪು ಸೂರ್ಯಾಸ್ತದ ಬಣ್ಣಗಳು ಎಲ್ಲಿಂದ ಬರುತ್ತವೆ?'),
    base: { mode: 'prism', incidence: 45, spread: 6, rays: 1, labels: 1, sun: 60, scatter: 0, twinkle: 0 },
    beats: [
      {
        set: { rays: 0 },
        cam: [-2, 1.5, 11, 0.5, -0.3, 0],
        say: t(
          'After the first monsoon shower, Meera spots a rainbow over the fields. Next day, Ms. Rao brings a glass prism to class to show where its colours come from.',
          'मानसून की पहली बारिश के बाद मीरा खेतों पर इंद्रधनुष देखती है। अगले दिन राव मैडम कक्षा में काँच का प्रिज़्म लाती हैं, यह दिखाने कि रंग कहाँ से आते हैं।',
          'ಮುಂಗಾರಿನ ಮೊದಲ ಮಳೆಯ ನಂತರ ಮೀರಾ ಹೊಲಗಳ ಮೇಲೆ ಕಾಮನಬಿಲ್ಲು ಕಾಣುತ್ತಾಳೆ. ಮರುದಿನ ರಾವ್ ಮೇಡಂ ಬಣ್ಣಗಳು ಎಲ್ಲಿಂದ ಬರುತ್ತವೆ ಎಂದು ತೋರಿಸಲು ಗಾಜಿನ ಪಟ್ಟಕ ತರುತ್ತಾರೆ.'
        ),
      },
      {
        set: { rays: 1 },
        say: t(
          'White sunlight goes in, and a band of colours comes out: violet, indigo, blue, green, yellow, orange, red. VIBGYOR. This splitting of light is called dispersion.',
          'सफ़ेद धूप अंदर जाती है और रंगों की पट्टी बाहर आती है: बैंगनी, जामुनी, नीला, हरा, पीला, नारंगी, लाल। बैजनीहपीनाला। प्रकाश के इस बिखरने को विक्षेपण कहते हैं।',
          'ಬಿಳಿ ಬಿಸಿಲು ಒಳಹೋಗಿ ಬಣ್ಣಗಳ ಪಟ್ಟಿ ಹೊರಬರುತ್ತದೆ: ನೇರಳೆ, ಊದಾ, ನೀಲಿ, ಹಸಿರು, ಹಳದಿ, ಕಿತ್ತಳೆ, ಕೆಂಪು. VIBGYOR. ಬೆಳಕಿನ ಈ ವಿಭಜನೆಯೇ ವರ್ಣ ವಿಭಜನೆ (ಡಿಸ್ಪರ್ಷನ್).'
        ),
      },
      {
        cam: [1.5, 0.5, 8, 2.5, -1, 0],
        say: t(
          'The prism does not paint the light. White light already contains all these colours. Each colour travels at a slightly different speed in glass, so each bends by a different amount: red the least, violet the most. We have spread the colours a little more than real so you can see them.',
          'प्रिज़्म प्रकाश को रंगता नहीं। सफ़ेद प्रकाश में ये सब रंग पहले से हैं। काँच में हर रंग की चाल थोड़ी अलग है, इसलिए हर रंग अलग मुड़ता है: लाल सबसे कम, बैंगनी सबसे ज़्यादा। देखने में आसानी के लिए रंगों को असली से थोड़ा ज़्यादा फैलाया है।',
          'ಪಟ್ಟಕ ಬೆಳಕಿಗೆ ಬಣ್ಣ ಬಳಿಯುವುದಿಲ್ಲ. ಬಿಳಿ ಬೆಳಕಿನಲ್ಲಿ ಈ ಎಲ್ಲಾ ಬಣ್ಣಗಳು ಮೊದಲೇ ಇವೆ. ಗಾಜಿನಲ್ಲಿ ಪ್ರತಿ ಬಣ್ಣದ ವೇಗ ಸ್ವಲ್ಪ ಬೇರೆ, ಆದ್ದರಿಂದ ಪ್ರತಿಯೊಂದೂ ಬೇರೆ ಬೇರೆ ಬಾಗುತ್ತದೆ: ಕೆಂಪು ಕಡಿಮೆ, ನೇರಳೆ ಹೆಚ್ಚು. ನೋಡಲು ಅನುಕೂಲವಾಗಲು ಬಣ್ಣಗಳನ್ನು ನಿಜಕ್ಕಿಂತ ಸ್ವಲ್ಪ ಹೆಚ್ಚು ಹರಡಿದ್ದೇವೆ.'
        ),
      },
      {
        say: t(
          'Raindrops act like millions of tiny prisms. Sunlight enters each drop, splits into colours, reflects inside and comes back out. That is why you always see a rainbow with the Sun behind you.',
          'बारिश की बूँदें लाखों छोटे प्रिज़्म जैसी हैं। धूप हर बूँद में जाती है, रंगों में बँटती है, अंदर परावर्तित होकर बाहर आती है। इसीलिए इंद्रधनुष हमेशा तब दिखता है जब सूरज आपकी पीठ पीछे हो।',
          'ಮಳೆಹನಿಗಳು ಲಕ್ಷಾಂತರ ಸಣ್ಣ ಪಟ್ಟಕಗಳಂತೆ. ಬಿಸಿಲು ಪ್ರತಿ ಹನಿಗೆ ಹೋಗಿ ಬಣ್ಣಗಳಾಗಿ ವಿಭಜನೆಯಾಗಿ ಒಳಗೆ ಪ್ರತಿಫಲಿಸಿ ಹೊರಬರುತ್ತದೆ. ಅದಕ್ಕೇ ಸೂರ್ಯ ನಿಮ್ಮ ಬೆನ್ನ ಹಿಂದೆ ಇದ್ದಾಗ ಮಾತ್ರ ಕಾಮನಬಿಲ್ಲು ಕಾಣುತ್ತದೆ.'
        ),
      },
      {
        set: { mode: 'atmosphere', sun: 60, scatter: 1 },
        cam: [0, 1.5, 11, -1, 1.5, 0],
        say: t(
          'Now look up. Why is the sky blue? Air molecules are tiny, and tiny particles scatter blue light much more than red. That scattered blue reaches your eyes from every direction.',
          'अब ऊपर देखिए। आसमान नीला क्यों है? हवा के अणु बहुत छोटे हैं, और छोटे कण नीले प्रकाश को लाल से कहीं ज़्यादा बिखेरते हैं। वही बिखरा नीला प्रकाश हर दिशा से आपकी आँखों तक आता है।',
          'ಈಗ ಮೇಲೆ ನೋಡಿ. ಆಕಾಶ ಏಕೆ ನೀಲಿ? ಗಾಳಿಯ ಅಣುಗಳು ಬಹಳ ಸಣ್ಣವು, ಸಣ್ಣ ಕಣಗಳು ನೀಲಿ ಬೆಳಕನ್ನು ಕೆಂಪಿಗಿಂತ ಬಹಳ ಹೆಚ್ಚು ಚದುರಿಸುತ್ತವೆ. ಆ ಚದುರಿದ ನೀಲಿ ಪ್ರತಿ ದಿಕ್ಕಿನಿಂದ ನಿಮ್ಮ ಕಣ್ಣಿಗೆ ತಲುಪುತ್ತದೆ.'
        ),
      },
      {
        set: { sun: 5 },
        say: t(
          'At sunset, sunlight crosses a much thicker layer of air to reach you. Most of the blue is scattered away on that long trip, so mostly red and orange arrives. The Sun looks red!',
          'सूर्यास्त के समय धूप को आप तक पहुँचने के लिए हवा की बहुत मोटी परत पार करनी पड़ती है। उस लंबे सफ़र में ज़्यादातर नीला बिखर जाता है, इसलिए लाल और नारंगी ही पहुँचता है। सूरज लाल दिखता है!',
          'ಸೂರ್ಯಾಸ್ತದಲ್ಲಿ ಬಿಸಿಲು ನಿಮ್ಮನ್ನು ತಲುಪಲು ಬಹಳ ದಪ್ಪ ಗಾಳಿಯ ಪದರ ದಾಟಬೇಕು. ಆ ದೀರ್ಘ ಪ್ರಯಾಣದಲ್ಲಿ ಹೆಚ್ಚಿನ ನೀಲಿ ಚದುರಿಹೋಗುತ್ತದೆ, ಕೆಂಪು ಮತ್ತು ಕಿತ್ತಳೆಯೇ ತಲುಪುತ್ತದೆ. ಸೂರ್ಯ ಕೆಂಪಾಗಿ ಕಾಣುತ್ತಾನೆ!'
        ),
      },
      {
        set: { sun: 40, scatter: 0, twinkle: 1 },
        cam: [2, 2, 11, 2, 2.5, -1],
        say: t(
          'And at night, stars twinkle. Their light passes through moving layers of air that keep bending it a little differently. Planets are much closer and look bigger, so they hardly twinkle.',
          'और रात में तारे टिमटिमाते हैं। उनका प्रकाश हवा की हिलती परतों से गुज़रता है जो उसे बार-बार थोड़ा अलग मोड़ती हैं। ग्रह बहुत पास हैं और बड़े दिखते हैं, इसलिए वे लगभग नहीं टिमटिमाते।',
          'ರಾತ್ರಿ ನಕ್ಷತ್ರಗಳು ಮಿನುಗುತ್ತವೆ. ಅವುಗಳ ಬೆಳಕು ಚಲಿಸುವ ಗಾಳಿಯ ಪದರಗಳ ಮೂಲಕ ಹಾದು ಪ್ರತಿ ಕ್ಷಣ ಸ್ವಲ್ಪ ಬೇರೆಯಾಗಿ ಬಾಗುತ್ತದೆ. ಗ್ರಹಗಳು ಬಹಳ ಹತ್ತಿರ, ದೊಡ್ಡದಾಗಿ ಕಾಣುತ್ತವೆ, ಆದ್ದರಿಂದ ಅವು ಬಹುತೇಕ ಮಿನುಗುವುದಿಲ್ಲ.'
        ),
      },
    ],
    experiment: {
      intro: t('Turn the prism, or move the Sun across the sky.', 'प्रिज़्म घुमाइए, या सूरज को आसमान में खिसकाइए।', 'ಪಟ್ಟಕ ತಿರುಗಿಸಿ, ಅಥವಾ ಸೂರ್ಯನನ್ನು ಆಕಾಶದಲ್ಲಿ ಸರಿಸಿ.'),
      start: { mode: 'prism' },
      controls: [
        { key: 'mode', label: t('Scene', 'दृश्य', 'ದೃಶ್ಯ'), options: [
          { value: 'prism', label: t('Prism', 'प्रिज़्म', 'ಪಟ್ಟಕ') },
          { value: 'atmosphere', label: t('Sky and Sun', 'आसमान और सूरज', 'ಆಕಾಶ ಮತ್ತು ಸೂರ್ಯ') },
        ] },
        { key: 'incidence', label: t('Angle into prism', 'प्रिज़्म पर कोण', 'ಪಟ್ಟಕದ ಮೇಲಿನ ಕೋನ'), min: 30, max: 70, step: 1, unit: '°' },
        { key: 'spread', label: t('Colour spread (zoom)', 'रंगों का फैलाव (ज़ूम)', 'ಬಣ್ಣಗಳ ಹರಡುವಿಕೆ (ಜೂಮ್)'), min: 1, max: 8, step: 0.5, unit: '×' },
        { key: 'sun', label: t('Sun height', 'सूरज की ऊँचाई', 'ಸೂರ್ಯನ ಎತ್ತರ'), min: 2, max: 80, step: 1, unit: '°' },
        { key: 'scatter', label: t('Show scattering', 'बिखराव दिखाएँ', 'ಚದುರುವಿಕೆ ತೋರಿಸಿ'), toggle: true },
      ],
    },
  },
  /* ============ ELECTRICITY ============ */
  {
    id: 'marching-charges',
    chapter: 'electricity',
    concepts: ['charge-current', 'potential-difference'],
    kit: 'circuit',
    color: '#FF9F1C',
    title: t('The marching charges', 'चलते हुए आवेश', 'ಸಾಗುತ್ತಿರುವ ಆವೇಶಗಳು'),
    premise: t('What really moves in a wire, and is it used up?', 'तार में असल में क्या चलता है, और क्या वह खर्च होता है?', 'ತಂತಿಯಲ್ಲಿ ನಿಜವಾಗಿ ಏನು ಚಲಿಸುತ್ತದೆ, ಅದು ಖರ್ಚಾಗುತ್ತದೆಯೇ?'),
    base: { layout: 'series', count: 1, load: 'bulb', V: 6, R: 6, charges: 1, ammeters: 1, voltmeter: 'none', switch: 1, pMax: 6 },
    beats: [
      {
        set: { switch: 0 },
        cam: [-1, 6, 7, 0, 0, 0],
        say: t(
          'Meera switches on her study lamp. Click! The light comes on instantly. But what actually moves inside the wires? Let’s zoom into a simple circuit: a battery, a switch and a bulb.',
          'मीरा अपना टेबल लैंप जलाती है। क्लिक! रोशनी तुरंत आ जाती है। पर तारों के अंदर असल में क्या चलता है? एक सरल परिपथ में झाँकें: बैटरी, स्विच और बल्ब।',
          'ಮೀರಾ ತನ್ನ ಓದುವ ದೀಪ ಹಚ್ಚುತ್ತಾಳೆ. ಕ್ಲಿಕ್! ಬೆಳಕು ತಕ್ಷಣ ಬರುತ್ತದೆ. ಆದರೆ ತಂತಿಗಳೊಳಗೆ ನಿಜವಾಗಿ ಏನು ಚಲಿಸುತ್ತದೆ? ಸರಳ ಮಂಡಲದೊಳಗೆ ನೋಡೋಣ: ಬ್ಯಾಟರಿ, ಸ್ವಿಚ್, ಬಲ್ಬ್.'
        ),
      },
      {
        set: { switch: 1 },
        say: t(
          'Close the switch. Charges start flowing around the loop. The flow of charge is the electric current: I equals Q by t. If one coulomb passes a point every second, the current is one ampere.',
          'स्विच बंद कीजिए। आवेश लूप में बहने लगते हैं। आवेश का यह बहाव विद्युत धारा है: I बराबर Q बटा t। अगर हर सेकंड एक कूलॉम किसी बिंदु से गुज़रे, तो धारा एक एम्पियर है।',
          'ಸ್ವಿಚ್ ಮುಚ್ಚಿ. ಆವೇಶಗಳು ಸುತ್ತಿನಲ್ಲಿ ಹರಿಯಲು ಶುರುವಾಗುತ್ತವೆ. ಆವೇಶದ ಈ ಹರಿವೇ ವಿದ್ಯುತ್ ಪ್ರವಾಹ: I ಸಮ Q ಭಾಗಿಸು t. ಪ್ರತಿ ಸೆಕೆಂಡಿಗೆ ಒಂದು ಕೂಲಂಬ್ ಒಂದು ಬಿಂದುವನ್ನು ದಾಟಿದರೆ ಪ್ರವಾಹ ಒಂದು ಆಂಪಿಯರ್.'
        ),
      },
      {
        set: { ammeters: 2 },
        cam: [0, 4.5, 5.5, 0.5, 0, -1],
        say: t(
          'Now the big question: does the bulb use up current? Put one ammeter before the bulb and one after it. Both show exactly the same reading! The bulb uses energy, not current. Charge is never used up.',
          'अब बड़ा सवाल: क्या बल्ब धारा खर्च करता है? एक एमीटर बल्ब से पहले और एक बाद में लगाइए। दोनों बिल्कुल एक जैसा पढ़ते हैं! बल्ब ऊर्जा लेता है, धारा नहीं। आवेश कभी खर्च नहीं होता।',
          'ಈಗ ದೊಡ್ಡ ಪ್ರಶ್ನೆ: ಬಲ್ಬ್ ಪ್ರವಾಹವನ್ನು ಖರ್ಚು ಮಾಡುತ್ತದೆಯೇ? ಬಲ್ಬಿನ ಮೊದಲು ಒಂದು, ನಂತರ ಒಂದು ಅಮ್ಮೀಟರ್ ಇಡಿ. ಎರಡೂ ಒಂದೇ ಓದು ತೋರಿಸುತ್ತವೆ! ಬಲ್ಬ್ ಶಕ್ತಿಯನ್ನು ಬಳಸುತ್ತದೆ, ಪ್ರವಾಹವನ್ನಲ್ಲ. ಆವೇಶ ಎಂದೂ ಖರ್ಚಾಗುವುದಿಲ್ಲ.'
        ),
      },
      {
        set: { V: 12, ammeters: 1, pMax: 12 },
        cam: [-1, 6, 7, 0, 0, 0],
        say: t(
          'The battery is like a water pump: it gives every coulomb of charge some energy. The energy per coulomb is the potential difference, in volts: V equals W by Q. A 12 volt battery gives each coulomb 12 joules.',
          'बैटरी पानी के पंप जैसी है: यह हर कूलॉम आवेश को कुछ ऊर्जा देती है। प्रति कूलॉम ऊर्जा विभवांतर है, वोल्ट में: V बराबर W बटा Q। 12 वोल्ट की बैटरी हर कूलॉम को 12 जूल देती है।',
          'ಬ್ಯಾಟರಿ ನೀರಿನ ಪಂಪಿನಂತೆ: ಪ್ರತಿ ಕೂಲಂಬ್ ಆವೇಶಕ್ಕೆ ಸ್ವಲ್ಪ ಶಕ್ತಿ ಕೊಡುತ್ತದೆ. ಪ್ರತಿ ಕೂಲಂಬ್‌ಗೆ ಶಕ್ತಿಯೇ ವಿಭವಾಂತರ, ವೋಲ್ಟ್‌ಗಳಲ್ಲಿ: V ಸಮ W ಭಾಗಿಸು Q. 12 ವೋಲ್ಟ್ ಬ್ಯಾಟರಿ ಪ್ರತಿ ಕೂಲಂಬ್‌ಗೆ 12 ಜೂಲ್ ಕೊಡುತ್ತದೆ.'
        ),
      },
      {
        set: { voltmeter: 'parallel' },
        say: t(
          'To measure the potential difference across the bulb, connect a voltmeter in parallel, across it. The ammeter always goes in series, in the path of the current.',
          'बल्ब के सिरों का विभवांतर नापने के लिए वोल्टमीटर को उसके समांतर, यानी उसके आर-पार जोड़िए। एमीटर हमेशा श्रेणी में, धारा के रास्ते में लगता है।',
          'ಬಲ್ಬಿನ ಅಡ್ಡಲಾಗಿ ವಿಭವಾಂತರ ಅಳೆಯಲು ವೋಲ್ಟ್‌ಮೀಟರನ್ನು ಸಮಾಂತರವಾಗಿ, ಅದರ ಅಡ್ಡಲಾಗಿ ಜೋಡಿಸಿ. ಅಮ್ಮೀಟರ್ ಯಾವಾಗಲೂ ಸರಣಿಯಲ್ಲಿ, ಪ್ರವಾಹದ ದಾರಿಯಲ್ಲಿ.'
        ),
      },
      {
        set: { voltmeter: 'series' },
        say: t(
          'What if we put the voltmeter in series by mistake? It has a huge resistance, so almost no current flows and the bulb goes dark. Voltmeter across, ammeter along!',
          'अगर ग़लती से वोल्टमीटर श्रेणी में लगा दें तो? इसका प्रतिरोध बहुत बड़ा है, इसलिए लगभग कोई धारा नहीं बहती और बल्ब बुझ जाता है। वोल्टमीटर आर-पार, एमीटर साथ-साथ!',
          'ತಪ್ಪಾಗಿ ವೋಲ್ಟ್‌ಮೀಟರನ್ನು ಸರಣಿಯಲ್ಲಿ ಇಟ್ಟರೆ? ಅದರ ರೋಧ ಬಹಳ ದೊಡ್ಡದು, ಬಹುತೇಕ ಪ್ರವಾಹ ಹರಿಯದೆ ಬಲ್ಬ್ ಆರುತ್ತದೆ. ವೋಲ್ಟ್‌ಮೀಟರ್ ಅಡ್ಡಲಾಗಿ, ಅಮ್ಮೀಟರ್ ದಾರಿಯಲ್ಲಿ!'
        ),
      },
    ],
    experiment: {
      intro: t('Change the battery and see the charges speed up. Try the voltmeter both ways.', 'बैटरी बदलकर आवेशों की चाल देखिए। वोल्टमीटर दोनों तरह लगाकर देखिए।', 'ಬ್ಯಾಟರಿ ಬದಲಿಸಿ ಆವೇಶಗಳ ವೇಗ ನೋಡಿ. ವೋಲ್ಟ್‌ಮೀಟರನ್ನು ಎರಡೂ ರೀತಿ ಇಟ್ಟು ನೋಡಿ.'),
      start: { voltmeter: 'parallel', V: 6, ammeters: 2, pMax: 6 },
      controls: [
        C.voltage,
        C.resistance,
        { key: 'switch', label: t('Switch on', 'स्विच चालू', 'ಸ್ವಿಚ್ ಆನ್'), toggle: true },
        { key: 'voltmeter', label: t('Voltmeter', 'वोल्टमीटर', 'ವೋಲ್ಟ್‌ಮೀಟರ್'), options: [
          { value: 'none', label: t('None', 'नहीं', 'ಇಲ್ಲ') },
          { value: 'parallel', label: t('Across the bulb', 'बल्ब के आर-पार', 'ಬಲ್ಬಿನ ಅಡ್ಡಲಾಗಿ') },
          { value: 'series', label: t('In series (wrong)', 'श्रेणी में (ग़लत)', 'ಸರಣಿಯಲ್ಲಿ (ತಪ್ಪು)') },
        ] },
      ],
    },
  },
  {
    id: 'repair-shop',
    chapter: 'electricity',
    concepts: ['ohms-law', 'resistivity'],
    kit: 'circuit',
    color: '#2EC4B6',
    title: t('Raju bhaiya’s repair shop', 'राजू भैया की रिपेयर दुकान', 'ರಾಜು ಅಣ್ಣನ ರಿಪೇರಿ ಅಂಗಡಿ'),
    premise: t('Why does doubling the voltage double the current, but not the resistance?', 'वोल्टेज दोगुना करने पर धारा दोगुनी क्यों होती है, प्रतिरोध नहीं?', 'ವೋಲ್ಟೇಜ್ ಎರಡು ಪಟ್ಟು ಮಾಡಿದರೆ ಪ್ರವಾಹ ಎರಡು ಪಟ್ಟು, ರೋಧ ಏಕೆ ಅಲ್ಲ?'),
    base: { layout: 'series', count: 1, load: 'resistor', V: 2, R: 4, charges: 1, voltmeter: 'parallel', ammeters: 1, switch: 1, pMax: 6, wireL: 1, wireA: 1 },
    beats: [
      {
        cam: [-0.5, 5.5, 6.5, 0.2, 0, -0.6],
        say: t(
          'Raju bhaiya repairs radios in the market. He connects a 4 ohm resistor to a battery. The voltmeter shows 2 volts and the ammeter shows 0.5 amperes.',
          'राजू भैया बाज़ार में रेडियो ठीक करते हैं। वे 4 ओम के प्रतिरोधक को बैटरी से जोड़ते हैं। वोल्टमीटर 2 वोल्ट और एमीटर 0.5 एम्पियर दिखाता है।',
          'ರಾಜು ಅಣ್ಣ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ ರೇಡಿಯೋ ರಿಪೇರಿ ಮಾಡುತ್ತಾರೆ. ಅವರು 4 ಓಮ್ ರೋಧಕವನ್ನು ಬ್ಯಾಟರಿಗೆ ಜೋಡಿಸುತ್ತಾರೆ. ವೋಲ್ಟ್‌ಮೀಟರ್ 2 ವೋಲ್ಟ್, ಅಮ್ಮೀಟರ್ 0.5 ಆಂಪಿಯರ್ ತೋರಿಸುತ್ತವೆ.'
        ),
      },
      {
        set: { V: 4 },
        say: t(
          'He doubles the voltage to 4 volts, and the current doubles to 1 ampere. Current is directly proportional to voltage. This is Ohm’s law: V equals I times R.',
          'वे वोल्टेज दोगुना करके 4 वोल्ट करते हैं, और धारा दोगुनी होकर 1 एम्पियर हो जाती है। धारा वोल्टेज के सीधे अनुपात में है। यही ओम का नियम है: V बराबर I गुणा R।',
          'ಅವರು ವೋಲ್ಟೇಜನ್ನು 4 ವೋಲ್ಟ್‌ಗೆ ಎರಡು ಪಟ್ಟು ಮಾಡುತ್ತಾರೆ, ಪ್ರವಾಹವೂ 1 ಆಂಪಿಯರ್‌ಗೆ ಎರಡು ಪಟ್ಟಾಗುತ್ತದೆ. ಪ್ರವಾಹ ವೋಲ್ಟೇಜಿಗೆ ನೇರ ಅನುಪಾತದಲ್ಲಿದೆ. ಇದೇ ಓಮ್ ನಿಯಮ: V ಸಮ I ಗುಣಿಸು R.'
        ),
      },
      {
        set: { V: 8, pMax: 16 },
        say: t(
          'At 8 volts the current is 2 amperes. Divide V by I each time: 2 by 0.5, 4 by 1, 8 by 2. Always 4 ohms! The resistance did not change, because it belongs to the resistor itself. A graph of V against I is a straight line through zero.',
          '8 वोल्ट पर धारा 2 एम्पियर है। हर बार V को I से भाग दीजिए: 2 बटा 0.5, 4 बटा 1, 8 बटा 2। हमेशा 4 ओम! प्रतिरोध नहीं बदला, क्योंकि यह प्रतिरोधक का अपना गुण है। V और I का ग्राफ़ शून्य से गुज़रती सीधी रेखा है।',
          '8 ವೋಲ್ಟ್‌ನಲ್ಲಿ ಪ್ರವಾಹ 2 ಆಂಪಿಯರ್. ಪ್ರತಿ ಬಾರಿ V ಅನ್ನು I ನಿಂದ ಭಾಗಿಸಿ: 2 ಭಾಗಿಸು 0.5, 4 ಭಾಗಿಸು 1, 8 ಭಾಗಿಸು 2. ಯಾವಾಗಲೂ 4 ಓಮ್! ರೋಧ ಬದಲಾಗಲಿಲ್ಲ, ಏಕೆಂದರೆ ಅದು ರೋಧಕದ ಸ್ವಂತ ಗುಣ. V ಮತ್ತು I ನ ಗ್ರಾಫ್ ಸೊನ್ನೆಯ ಮೂಲಕ ಹೋಗುವ ನೇರ ರೇಖೆ.'
        ),
      },
      {
        set: { load: 'wire', V: 2, wireL: 1, wireA: 1, pMax: 6 },
        say: t(
          'Now he tests a nichrome wire, one metre long. Why does a wire resist current at all? Moving charges keep bumping into the atoms of the metal.',
          'अब वे एक मीटर लंबे नाइक्रोम के तार की जाँच करते हैं। तार धारा का विरोध करता ही क्यों है? चलते आवेश धातु के परमाणुओं से टकराते रहते हैं।',
          'ಈಗ ಅವರು ಒಂದು ಮೀಟರ್ ಉದ್ದದ ನೈಕ್ರೋಮ್ ತಂತಿ ಪರೀಕ್ಷಿಸುತ್ತಾರೆ. ತಂತಿ ಪ್ರವಾಹವನ್ನು ಏಕೆ ತಡೆಯುತ್ತದೆ? ಚಲಿಸುವ ಆವೇಶಗಳು ಲೋಹದ ಪರಮಾಣುಗಳಿಗೆ ಡಿಕ್ಕಿ ಹೊಡೆಯುತ್ತಲೇ ಇರುತ್ತವೆ.'
        ),
      },
      {
        set: { wireL: 2 },
        say: t(
          'Double the length and there are twice as many bumps: the resistance doubles and the current halves.',
          'लंबाई दोगुनी कीजिए तो टक्करें भी दोगुनी: प्रतिरोध दोगुना और धारा आधी।',
          'ಉದ್ದ ಎರಡು ಪಟ್ಟು ಮಾಡಿದರೆ ಡಿಕ್ಕಿಗಳೂ ಎರಡು ಪಟ್ಟು: ರೋಧ ಎರಡು ಪಟ್ಟು, ಪ್ರವಾಹ ಅರ್ಧ.'
        ),
      },
      {
        set: { wireA: 2 },
        say: t(
          'Now a wire twice as thick: more room for the charges, so the resistance halves. R equals rho L by A. A longer wire has more resistance; a thicker wire has less.',
          'अब दोगुना मोटा तार: आवेशों के लिए ज़्यादा जगह, इसलिए प्रतिरोध आधा। R बराबर रो L बटा A। लंबे तार का प्रतिरोध ज़्यादा, मोटे तार का कम।',
          'ಈಗ ಎರಡು ಪಟ್ಟು ದಪ್ಪದ ತಂತಿ: ಆವೇಶಗಳಿಗೆ ಹೆಚ್ಚು ಜಾಗ, ರೋಧ ಅರ್ಧ. R ಸಮ ರೋ L ಭಾಗಿಸು A. ಉದ್ದದ ತಂತಿಗೆ ಹೆಚ್ಚು ರೋಧ, ದಪ್ಪ ತಂತಿಗೆ ಕಡಿಮೆ.'
        ),
      },
      {
        set: { wireL: 1, wireA: 1 },
        say: t(
          'Rho, the resistivity, depends only on the material and its temperature, not on the shape. Copper has a tiny resistivity, so house wires are copper. Nichrome has a large one, so heaters use nichrome.',
          'रो यानी प्रतिरोधकता केवल पदार्थ और ताप पर निर्भर है, आकार पर नहीं। ताँबे की प्रतिरोधकता बहुत कम है, इसलिए घर के तार ताँबे के होते हैं। नाइक्रोम की ज़्यादा है, इसलिए हीटर में नाइक्रोम लगता है।',
          'ರೋ, ಅಂದರೆ ರೋಧಕತೆ, ವಸ್ತು ಮತ್ತು ತಾಪಮಾನವನ್ನು ಮಾತ್ರ ಅವಲಂಬಿಸಿದೆ, ಆಕಾರವನ್ನಲ್ಲ. ತಾಮ್ರದ ರೋಧಕತೆ ಬಹಳ ಕಡಿಮೆ, ಆದ್ದರಿಂದ ಮನೆಯ ತಂತಿಗಳು ತಾಮ್ರದವು. ನೈಕ್ರೋಮ್‌ನದು ಹೆಚ್ಚು, ಆದ್ದರಿಂದ ಹೀಟರ್‌ಗಳಲ್ಲಿ ನೈಕ್ರೋಮ್.'
        ),
      },
    ],
    experiment: {
      intro: t('Change V and check V ÷ I. Then stretch and thicken the wire.', 'V बदलिए और V ÷ I जाँचिए। फिर तार लंबा और मोटा कीजिए।', 'V ಬದಲಿಸಿ V ÷ I ಪರಿಶೀಲಿಸಿ. ನಂತರ ತಂತಿಯನ್ನು ಉದ್ದ ಮತ್ತು ದಪ್ಪ ಮಾಡಿ.'),
      start: { load: 'resistor', V: 4, R: 4, pMax: 16 },
      controls: [
        C.voltage,
        { key: 'load', label: t('Component', 'घटक', 'ಘಟಕ'), options: [
          { value: 'resistor', label: t('Resistor', 'प्रतिरोधक', 'ರೋಧಕ') },
          { value: 'wire', label: t('Nichrome wire', 'नाइक्रोम तार', 'ನೈಕ್ರೋಮ್ ತಂತಿ') },
        ] },
        C.resistance,
        { key: 'wireL', label: t('Wire length', 'तार की लंबाई', 'ತಂತಿಯ ಉದ್ದ'), min: 0.5, max: 3, step: 0.1, unit: 'm' },
        { key: 'wireA', label: t('Wire thickness (area)', 'तार की मोटाई (क्षेत्रफल)', 'ತಂತಿ ದಪ್ಪ (ವಿಸ್ತೀರ್ಣ)'), min: 0.5, max: 3, step: 0.1, scale: 0.5, unit: 'mm²' },
      ],
    },
  },
  {
    id: 'diwali-lights',
    chapter: 'electricity',
    concepts: ['series-resistors', 'parallel-resistors'],
    kit: 'circuit',
    color: '#FF5DA2',
    title: t('Diwali lights: series or parallel?', 'दिवाली की लड़ी: श्रेणी या समांतर?', 'ದೀಪಾವಳಿ ದೀಪಗಳು: ಸರಣಿ ಅಥವಾ ಸಮಾಂತರ?'),
    premise: t('Why does one fused bulb switch off the whole string?', 'एक बल्ब फ्यूज़ होने से पूरी लड़ी क्यों बुझ जाती है?', 'ಒಂದು ಬಲ್ಬ್ ಫ್ಯೂಸ್ ಆದರೆ ಇಡೀ ಸರ ಏಕೆ ಆರುತ್ತದೆ?'),
    base: { layout: 'series', count: 1, load: 'bulb', V: 6, R: 6, charges: 1, ammeters: 1, voltmeter: 'none', switch: 1, blown: 0, pMax: 6 },
    beats: [
      {
        cam: [-1, 6.5, 7, 0, 0, 0],
        say: t(
          'It’s Diwali! Arjun connects one 6 ohm bulb to a 6 volt battery. One ampere flows and it glows brightly.',
          'दिवाली है! अर्जुन 6 ओम का एक बल्ब 6 वोल्ट की बैटरी से जोड़ता है। एक एम्पियर धारा बहती है और बल्ब चमक उठता है।',
          'ದೀಪಾವಳಿ! ಅರ್ಜುನ್ 6 ಓಮ್ ಬಲ್ಬನ್ನು 6 ವೋಲ್ಟ್ ಬ್ಯಾಟರಿಗೆ ಜೋಡಿಸುತ್ತಾನೆ. ಒಂದು ಆಂಪಿಯರ್ ಹರಿದು ಬಲ್ಬ್ ಪ್ರಕಾಶಮಾನವಾಗಿ ಉರಿಯುತ್ತದೆ.'
        ),
      },
      {
        set: { count: 3 },
        say: t(
          'He adds two more bulbs in one line: a series circuit. All three glow, but dimly. Resistances in series add up: 6 plus 6 plus 6 is 18 ohms, so the current falls to 6 by 18, just 0.33 amperes.',
          'वह एक ही लाइन में दो और बल्ब जोड़ता है: श्रेणी परिपथ। तीनों जलते हैं, पर मंद। श्रेणी में प्रतिरोध जुड़ते हैं: 6 जमा 6 जमा 6 बराबर 18 ओम, इसलिए धारा घटकर 6 बटा 18, सिर्फ़ 0.33 एम्पियर रह जाती है।',
          'ಅವನು ಒಂದೇ ಸಾಲಿನಲ್ಲಿ ಇನ್ನೆರಡು ಬಲ್ಬ್ ಸೇರಿಸುತ್ತಾನೆ: ಸರಣಿ ಮಂಡಲ. ಮೂರೂ ಉರಿಯುತ್ತವೆ, ಆದರೆ ಮಂದವಾಗಿ. ಸರಣಿಯಲ್ಲಿ ರೋಧಗಳು ಕೂಡುತ್ತವೆ: 6 ಕೂಡಿಸು 6 ಕೂಡಿಸು 6 ಸಮ 18 ಓಮ್, ಪ್ರವಾಹ 6 ಭಾಗಿಸು 18, ಕೇವಲ 0.33 ಆಂಪಿಯರ್‌ಗೆ ಇಳಿಯುತ್ತದೆ.'
        ),
      },
      {
        say: t(
          'The same current flows through every bulb, and the 6 volts is shared: 2 volts each. A bigger resistor would take a bigger share of the voltage.',
          'हर बल्ब में एक ही धारा बहती है, और 6 वोल्ट बँट जाते हैं: हर एक को 2 वोल्ट। बड़ा प्रतिरोधक वोल्टेज का बड़ा हिस्सा लेता।',
          'ಪ್ರತಿ ಬಲ್ಬಿನಲ್ಲೂ ಒಂದೇ ಪ್ರವಾಹ, 6 ವೋಲ್ಟ್ ಹಂಚಿಕೆಯಾಗುತ್ತದೆ: ಪ್ರತಿಯೊಂದಕ್ಕೆ 2 ವೋಲ್ಟ್. ದೊಡ್ಡ ರೋಧಕ ವೋಲ್ಟೇಜಿನ ದೊಡ್ಡ ಪಾಲು ಪಡೆಯುತ್ತಿತ್ತು.'
        ),
      },
      {
        set: { blown: 2 },
        say: t(
          'Oh no! One bulb fuses. The path is broken, so every bulb goes dark. That is the trouble with series lights.',
          'अरे! एक बल्ब फ्यूज़ हो गया। रास्ता टूट गया, इसलिए सारे बल्ब बुझ गए। श्रेणी वाली लड़ी की यही परेशानी है।',
          'ಅಯ್ಯೋ! ಒಂದು ಬಲ್ಬ್ ಫ್ಯೂಸ್ ಆಯಿತು. ದಾರಿ ಮುರಿಯಿತು, ಎಲ್ಲಾ ಬಲ್ಬ್‌ಗಳು ಆರಿದವು. ಸರಣಿ ದೀಪಗಳ ತೊಂದರೆ ಇದೇ.'
        ),
      },
      {
        set: { layout: 'parallel', blown: 0, pMax: 6 },
        say: t(
          'His sister rewires them side by side: a parallel circuit. Each bulb gets the full 6 volts, so each glows as brightly as a single bulb alone.',
          'उसकी बहन उन्हें अगल-बगल जोड़ती है: समांतर परिपथ। हर बल्ब को पूरे 6 वोल्ट मिलते हैं, इसलिए हर एक अकेले बल्ब जितना चमकता है।',
          'ಅವನ ಅಕ್ಕ ಅವನ್ನು ಪಕ್ಕಪಕ್ಕದಲ್ಲಿ ಜೋಡಿಸುತ್ತಾಳೆ: ಸಮಾಂತರ ಮಂಡಲ. ಪ್ರತಿ ಬಲ್ಬಿಗೂ ಪೂರ್ತಿ 6 ವೋಲ್ಟ್, ಆದ್ದರಿಂದ ಪ್ರತಿಯೊಂದೂ ಒಂಟಿ ಬಲ್ಬಿನಷ್ಟೇ ಪ್ರಕಾಶಮಾನ.'
        ),
      },
      {
        cam: [-2, 5, 5.5, -1, 0, 0],
        say: t(
          'The current splits into the branches and joins again: 1 plus 1 plus 1, so 3 amperes leave the battery. In parallel, 1 by R equals 1 by 6 plus 1 by 6 plus 1 by 6, so R is just 2 ohms: less than any single bulb!',
          'धारा शाखाओं में बँटती है और फिर मिलती है: 1 जमा 1 जमा 1, यानी बैटरी से 3 एम्पियर निकलते हैं। समांतर में 1 बटा R बराबर 1 बटा 6 जमा 1 बटा 6 जमा 1 बटा 6, तो R सिर्फ़ 2 ओम: किसी भी अकेले बल्ब से कम!',
          'ಪ್ರವಾಹ ಶಾಖೆಗಳಲ್ಲಿ ಹಂಚಿ ಮತ್ತೆ ಸೇರುತ್ತದೆ: 1 ಕೂಡಿಸು 1 ಕೂಡಿಸು 1, ಬ್ಯಾಟರಿಯಿಂದ 3 ಆಂಪಿಯರ್. ಸಮಾಂತರದಲ್ಲಿ 1 ಭಾಗಿಸು R ಸಮ 1/6 ಕೂಡಿಸು 1/6 ಕೂಡಿಸು 1/6, ಆದ್ದರಿಂದ R ಕೇವಲ 2 ಓಮ್: ಯಾವುದೇ ಒಂಟಿ ಬಲ್ಬಿಗಿಂತ ಕಡಿಮೆ!'
        ),
      },
      {
        set: { blown: 2 },
        cam: [-1, 6.5, 7, 0, 0, 0],
        say: t(
          'Now if one bulb fuses, the others keep glowing. That is why the lights and fans in your home are all connected in parallel.',
          'अब एक बल्ब फ्यूज़ हो, तो बाक़ी जलते रहते हैं। इसीलिए आपके घर की बत्तियाँ और पंखे सब समांतर में जुड़े होते हैं।',
          'ಈಗ ಒಂದು ಬಲ್ಬ್ ಫ್ಯೂಸ್ ಆದರೂ ಉಳಿದವು ಉರಿಯುತ್ತಲೇ ಇರುತ್ತವೆ. ಅದಕ್ಕೇ ನಿಮ್ಮ ಮನೆಯ ದೀಪಗಳು ಮತ್ತು ಫ್ಯಾನ್‌ಗಳೆಲ್ಲ ಸಮಾಂತರದಲ್ಲಿ ಜೋಡಣೆಯಾಗಿವೆ.'
        ),
      },
    ],
    experiment: {
      intro: t('Build your own string of lights. Fuse a bulb and see what happens.', 'अपनी लड़ी बनाइए। एक बल्ब फ्यूज़ करके देखिए क्या होता है।', 'ನಿಮ್ಮದೇ ದೀಪದ ಸರ ಮಾಡಿ. ಒಂದು ಬಲ್ಬ್ ಫ್ಯೂಸ್ ಮಾಡಿ ಏನಾಗುತ್ತದೆ ನೋಡಿ.'),
      start: { layout: 'series', count: 3, blown: 0 },
      controls: [
        { key: 'layout', label: t('Connection', 'जोड़', 'ಜೋಡಣೆ'), options: [
          { value: 'series', label: t('Series', 'श्रेणी', 'ಸರಣಿ') },
          { value: 'parallel', label: t('Parallel', 'समांतर', 'ಸಮಾಂತರ') },
        ] },
        { key: 'count', label: t('Bulbs', 'बल्ब', 'ಬಲ್ಬ್‌ಗಳು'), min: 1, max: 3, step: 1 },
        C.voltage,
        { key: 'blown', label: t('Fused bulb', 'फ्यूज़ बल्ब', 'ಫ್ಯೂಸ್ ಬಲ್ಬ್'), options: [
          { value: 0, label: t('None', 'कोई नहीं', 'ಯಾವುದೂ ಇಲ್ಲ') },
          { value: 1, label: t('Bulb 1', 'बल्ब 1', 'ಬಲ್ಬ್ 1') },
          { value: 2, label: t('Bulb 2', 'बल्ब 2', 'ಬಲ್ಬ್ 2') },
          { value: 3, label: t('Bulb 3', 'बल्ब 3', 'ಬಲ್ಬ್ 3') },
        ] },
      ],
    },
  },
  {
    id: 'heater-bill',
    chapter: 'electricity',
    concepts: ['heating-effect', 'electric-power'],
    kit: 'circuit',
    color: '#E5484D',
    title: t('The heater and the electricity bill', 'हीटर और बिजली का बिल', 'ಹೀಟರ್ ಮತ್ತು ವಿದ್ಯುತ್ ಬಿಲ್'),
    premise: t('Why does a coil glow, and what is a “unit” on the bill?', 'कॉइल क्यों दहकती है, और बिल का “यूनिट” क्या है?', 'ಸುರುಳಿ ಏಕೆ ಕೆಂಪಾಗುತ್ತದೆ, ಬಿಲ್‌ನ “ಯೂನಿಟ್” ಏನು?'),
    base: { layout: 'series', count: 1, load: 'heater', V: 6, R: 3, charges: 1, ammeters: 1, voltmeter: 'none', switch: 1, pMax: 48 },
    beats: [
      {
        cam: [0, 3.5, 4.5, 0.6, 0, -1.6],
        say: t(
          'Winter in Shimla. Meera’s family switches on the room heater. Why does its coil glow red? Let’s look closely at a small heater coil on a 6 volt battery.',
          'शिमला की सर्दी। मीरा का परिवार रूम हीटर चलाता है। उसकी कॉइल लाल क्यों दहकती है? 6 वोल्ट की बैटरी से जुड़ी एक छोटी हीटर कॉइल को पास से देखें।',
          'ಶಿಮ್ಲಾದ ಚಳಿ. ಮೀರಾ ಕುಟುಂಬ ರೂಮ್ ಹೀಟರ್ ಹಚ್ಚುತ್ತದೆ. ಅದರ ಸುರುಳಿ ಏಕೆ ಕೆಂಪಾಗುತ್ತದೆ? 6 ವೋಲ್ಟ್ ಬ್ಯಾಟರಿಗೆ ಜೋಡಿಸಿದ ಸಣ್ಣ ಹೀಟರ್ ಸುರುಳಿಯನ್ನು ಹತ್ತಿರದಿಂದ ನೋಡೋಣ.'
        ),
      },
      {
        say: t(
          'Moving charges keep colliding with the atoms of the coil and hand them energy, so the coil heats up. This is the heating effect of current. Joule’s law gives the heat: H equals I squared R t.',
          'चलते आवेश कॉइल के परमाणुओं से टकराकर उन्हें ऊर्जा देते हैं, इसलिए कॉइल गरम होती है। यह धारा का तापीय प्रभाव है। जूल का नियम ऊष्मा बताता है: H बराबर I का वर्ग गुणा R गुणा t।',
          'ಚಲಿಸುವ ಆವೇಶಗಳು ಸುರುಳಿಯ ಪರಮಾಣುಗಳಿಗೆ ಡಿಕ್ಕಿ ಹೊಡೆದು ಶಕ್ತಿ ಕೊಡುತ್ತವೆ, ಸುರುಳಿ ಬಿಸಿಯಾಗುತ್ತದೆ. ಇದು ಪ್ರವಾಹದ ಉಷ್ಣ ಪರಿಣಾಮ. ಜೂಲ್ ನಿಯಮ ಉಷ್ಣ ಹೇಳುತ್ತದೆ: H ಸಮ I ವರ್ಗ ಗುಣಿಸು R ಗುಣಿಸು t.'
        ),
      },
      {
        set: { V: 12 },
        say: t(
          'Double the current, from 2 to 4 amperes. The heat does not double: it becomes four times, because current is squared. That is why a small rise in current can make a wire dangerously hot.',
          'धारा दोगुनी कीजिए, 2 से 4 एम्पियर। ऊष्मा दोगुनी नहीं होती: चार गुना हो जाती है, क्योंकि धारा का वर्ग होता है। इसीलिए धारा थोड़ी बढ़ने पर भी तार ख़तरनाक रूप से गरम हो सकता है।',
          'ಪ್ರವಾಹ ಎರಡು ಪಟ್ಟು ಮಾಡಿ, 2 ರಿಂದ 4 ಆಂಪಿಯರ್. ಉಷ್ಣ ಎರಡು ಪಟ್ಟಲ್ಲ: ನಾಲ್ಕು ಪಟ್ಟಾಗುತ್ತದೆ, ಏಕೆಂದರೆ ಪ್ರವಾಹದ ವರ್ಗ. ಅದಕ್ಕೇ ಪ್ರವಾಹ ಸ್ವಲ್ಪ ಹೆಚ್ಚಿದರೂ ತಂತಿ ಅಪಾಯಕಾರಿಯಾಗಿ ಬಿಸಿಯಾಗಬಹುದು.'
        ),
      },
      {
        set: { load: 'bulb', V: 6, R: 6, pMax: 6 },
        cam: [0, 4, 5, 0.6, 0.3, -1.6],
        say: t(
          'A bulb filament is made of tungsten, which can glow white-hot at about 2500 degrees without melting. A fuse uses the same heating effect the other way: its thin wire melts if the current gets too big.',
          'बल्ब का फ़िलामेंट टंगस्टन का होता है, जो लगभग 2500 डिग्री पर बिना पिघले सफ़ेद चमक सकता है। फ़्यूज़ इसी तापीय प्रभाव का उल्टा उपयोग करता है: धारा ज़्यादा होने पर उसका पतला तार पिघल जाता है।',
          'ಬಲ್ಬಿನ ತಂತು ಟಂಗ್‌ಸ್ಟನ್‌ನದು, ಸುಮಾರು 2500 ಡಿಗ್ರಿಯಲ್ಲಿ ಕರಗದೆ ಬಿಳಿಯಾಗಿ ಹೊಳೆಯಬಲ್ಲದು. ಫ್ಯೂಸ್ ಇದೇ ಉಷ್ಣ ಪರಿಣಾಮವನ್ನು ವಿರುದ್ಧವಾಗಿ ಬಳಸುತ್ತದೆ: ಪ್ರವಾಹ ಹೆಚ್ಚಾದರೆ ಅದರ ತೆಳು ತಂತಿ ಕರಗುತ್ತದೆ.'
        ),
      },
      {
        set: { load: 'heater', V: 12, R: 3, pMax: 48 },
        cam: [-1, 6, 7, 0, 0, 0],
        say: t(
          'Power is how fast energy is used: P equals V times I. Our little coil uses 12 volts times 4 amperes, 48 watts. A real room heater on 220 volts draws about 9 amperes: roughly 2000 watts, or 2 kilowatts.',
          'शक्ति यानी ऊर्जा कितनी तेज़ी से ख़र्च होती है: P बराबर V गुणा I। हमारी छोटी कॉइल 12 वोल्ट गुणा 4 एम्पियर, यानी 48 वाट लेती है। 220 वोल्ट का असली रूम हीटर लगभग 9 एम्पियर लेता है: क़रीब 2000 वाट, यानी 2 किलोवाट।',
          'ಶಕ್ತಿ (ಪವರ್) ಎಂದರೆ ಶಕ್ತಿ ಎಷ್ಟು ವೇಗವಾಗಿ ಬಳಕೆಯಾಗುತ್ತದೆ: P ಸಮ V ಗುಣಿಸು I. ನಮ್ಮ ಸಣ್ಣ ಸುರುಳಿ 12 ವೋಲ್ಟ್ ಗುಣಿಸು 4 ಆಂಪಿಯರ್, 48 ವ್ಯಾಟ್. 220 ವೋಲ್ಟ್‌ನ ನಿಜವಾದ ರೂಮ್ ಹೀಟರ್ ಸುಮಾರು 9 ಆಂಪಿಯರ್: ಸುಮಾರು 2000 ವ್ಯಾಟ್, ಅಂದರೆ 2 ಕಿಲೋವ್ಯಾಟ್.'
        ),
      },
      {
        say: t(
          'Your electricity bill counts energy, not power. Energy is power times time, measured in kilowatt-hours, called units. A 2 kilowatt heater running 3 hours uses 6 units a day. For 30 days, 180 units!',
          'बिजली का बिल ऊर्जा गिनता है, शक्ति नहीं। ऊर्जा बराबर शक्ति गुणा समय, किलोवाट-घंटे में, जिसे यूनिट कहते हैं। 2 किलोवाट का हीटर 3 घंटे चले तो रोज़ 6 यूनिट। 30 दिन में 180 यूनिट!',
          'ವಿದ್ಯುತ್ ಬಿಲ್ ಶಕ್ತಿಯನ್ನು (ಎನರ್ಜಿ) ಎಣಿಸುತ್ತದೆ, ಪವರ್ ಅಲ್ಲ. ಎನರ್ಜಿ ಸಮ ಪವರ್ ಗುಣಿಸು ಸಮಯ, ಕಿಲೋವ್ಯಾಟ್-ಗಂಟೆಗಳಲ್ಲಿ, ಇದನ್ನೇ ಯೂನಿಟ್ ಎನ್ನುತ್ತಾರೆ. 2 ಕಿಲೋವ್ಯಾಟ್ ಹೀಟರ್ 3 ಗಂಟೆ ಓಡಿದರೆ ದಿನಕ್ಕೆ 6 ಯೂನಿಟ್. 30 ದಿನಕ್ಕೆ 180 ಯೂನಿಟ್!'
        ),
      },
    ],
    experiment: {
      intro: t('Raise the voltage and watch the glow. P = V × I, H = I²Rt.', 'वोल्टेज बढ़ाइए और दहक देखिए। P = V × I, H = I²Rt.', 'ವೋಲ್ಟೇಜ್ ಹೆಚ್ಚಿಸಿ ಹೊಳಪು ನೋಡಿ. P = V × I, H = I²Rt.'),
      start: { load: 'heater', V: 6, R: 3, pMax: 48 },
      controls: [
        C.voltage,
        C.resistance,
        { key: 'load', label: t('Component', 'घटक', 'ಘಟಕ'), options: [
          { value: 'heater', label: t('Heater coil', 'हीटर कॉइल', 'ಹೀಟರ್ ಸುರುಳಿ') },
          { value: 'bulb', label: t('Bulb', 'बल्ब', 'ಬಲ್ಬ್') },
        ] },
      ],
    },
  },
  /* ============ MAGNETISM ============ */
  {
    id: 'crazy-compass',
    chapter: 'magnetism',
    concepts: ['field-lines', 'field-of-current'],
    kit: 'magnet',
    color: '#2563EB',
    title: t('The compass that went crazy', 'जो कम्पास पागल हो गया', 'ಹುಚ್ಚಾದ ದಿಕ್ಸೂಚಿ'),
    premise: t('Invisible magnetic fields, and how a current makes one.', 'अदृश्य चुंबकीय क्षेत्र, और धारा उसे कैसे बनाती है।', 'ಕಾಣದ ಕಾಂತಕ್ಷೇತ್ರ, ಮತ್ತು ಪ್ರವಾಹ ಅದನ್ನು ಹೇಗೆ ಸೃಷ್ಟಿಸುತ್ತದೆ.'),
    base: { mode: 'bar', lines: 0, filings: 1, compass: 0, current: 0, labels: 1 },
    beats: [
      {
        cam: [0, 7.5, 4, 0, 0, 0],
        say: t(
          'Arjun sprinkles iron filings around a bar magnet and taps the paper. The filings line up in beautiful curved patterns. They are drawing the magnetic field for us!',
          'अर्जुन छड़ चुंबक के चारों ओर लोहे का बुरादा छिड़ककर कागज़ थपथपाता है। बुरादा सुंदर घुमावदार आकारों में सज जाता है। यह हमारे लिए चुंबकीय क्षेत्र बना रहा है!',
          'ಅರ್ಜುನ್ ದಂಡ ಕಾಂತದ ಸುತ್ತ ಕಬ್ಬಿಣದ ಪುಡಿ ಚೆಲ್ಲಿ ಕಾಗದ ತಟ್ಟುತ್ತಾನೆ. ಪುಡಿ ಸುಂದರ ಬಾಗಿದ ವಿನ್ಯಾಸಗಳಲ್ಲಿ ಜೋಡಣೆಯಾಗುತ್ತದೆ. ಅದು ನಮಗಾಗಿ ಕಾಂತಕ್ಷೇತ್ರ ಚಿತ್ರಿಸುತ್ತಿದೆ!'
        ),
      },
      {
        set: { lines: 1, filings: 0 },
        cam: [0, 6, 6, 0, 0, 0],
        say: t(
          'We draw these patterns as field lines. Outside the magnet they run from the north pole to the south pole, and inside from south to north, so every line is a closed loop. Where the lines crowd together, near the poles, the field is strongest.',
          'इन आकारों को हम क्षेत्र रेखाओं से दिखाते हैं। चुंबक के बाहर वे उत्तर ध्रुव से दक्षिण ध्रुव की ओर, और अंदर दक्षिण से उत्तर की ओर चलती हैं, इसलिए हर रेखा एक बंद लूप है। जहाँ रेखाएँ घनी हैं, ध्रुवों के पास, वहाँ क्षेत्र सबसे प्रबल है।',
          'ಈ ವಿನ್ಯಾಸಗಳನ್ನು ಕ್ಷೇತ್ರ ರೇಖೆಗಳಾಗಿ ಚಿತ್ರಿಸುತ್ತೇವೆ. ಕಾಂತದ ಹೊರಗೆ ಉತ್ತರ ಧ್ರುವದಿಂದ ದಕ್ಷಿಣ ಧ್ರುವಕ್ಕೆ, ಒಳಗೆ ದಕ್ಷಿಣದಿಂದ ಉತ್ತರಕ್ಕೆ ಸಾಗುತ್ತವೆ, ಪ್ರತಿ ರೇಖೆಯೂ ಮುಚ್ಚಿದ ಸುತ್ತು. ರೇಖೆಗಳು ದಟ್ಟವಾಗಿರುವಲ್ಲಿ, ಧ್ರುವಗಳ ಬಳಿ, ಕ್ಷೇತ್ರ ಅತಿ ಪ್ರಬಲ.'
        ),
      },
      {
        set: { compass: 1 },
        say: t(
          'Small compasses point along the field lines. And two field lines never cross: if they did, a compass at the crossing would have to point two ways at once!',
          'छोटे कम्पास क्षेत्र रेखाओं की दिशा में इशारा करते हैं। और दो क्षेत्र रेखाएँ कभी नहीं काटतीं: अगर काटतीं, तो काटने वाले बिंदु पर कम्पास को एक साथ दो दिशाएँ दिखानी पड़तीं!',
          'ಸಣ್ಣ ದಿಕ್ಸೂಚಿಗಳು ಕ್ಷೇತ್ರ ರೇಖೆಗಳ ದಿಕ್ಕಿನಲ್ಲಿ ತೋರಿಸುತ್ತವೆ. ಎರಡು ಕ್ಷೇತ್ರ ರೇಖೆಗಳು ಎಂದೂ ಛೇದಿಸುವುದಿಲ್ಲ: ಛೇದಿಸಿದರೆ ಆ ಬಿಂದುವಿನ ದಿಕ್ಸೂಚಿ ಒಮ್ಮೆಗೇ ಎರಡು ದಿಕ್ಕು ತೋರಿಸಬೇಕಾಗುತ್ತಿತ್ತು!'
        ),
      },
      {
        set: { mode: 'wire', current: 0, compass: 1, lines: 1 },
        cam: [3, 5, 6, 0, 0.5, 0],
        say: t(
          'In 1820, Hans Christian Oersted noticed something strange: a compass near a wire carrying current moved! Here is a wire passing through a card, with compasses around it. No current yet: they all point north.',
          '1820 में हान्स क्रिश्चियन ओर्स्टेड ने कुछ अजीब देखा: धारा वाले तार के पास रखा कम्पास हिल गया! यहाँ एक तार कार्ड से गुज़र रहा है, चारों ओर कम्पास हैं। अभी धारा नहीं: सब उत्तर की ओर हैं।',
          '1820 ರಲ್ಲಿ ಹಾನ್ಸ್ ಕ್ರಿಶ್ಚಿಯನ್ ಓರ್‌ಸ್ಟೆಡ್ ವಿಚಿತ್ರ ಗಮನಿಸಿದರು: ಪ್ರವಾಹವಿರುವ ತಂತಿಯ ಬಳಿಯ ದಿಕ್ಸೂಚಿ ಚಲಿಸಿತು! ಇಲ್ಲಿ ತಂತಿ ಕಾರ್ಡಿನ ಮೂಲಕ ಹೋಗುತ್ತದೆ, ಸುತ್ತ ದಿಕ್ಸೂಚಿಗಳಿವೆ. ಇನ್ನೂ ಪ್ರವಾಹವಿಲ್ಲ: ಎಲ್ಲವೂ ಉತ್ತರಕ್ಕೆ.'
        ),
      },
      {
        set: { current: 3 },
        say: t(
          'Switch the current on. The compasses swing round into a circle! An electric current makes a magnetic field: circles around the wire.',
          'धारा चालू कीजिए। कम्पास घूमकर गोले में सज जाते हैं! विद्युत धारा चुंबकीय क्षेत्र बनाती है: तार के चारों ओर गोले।',
          'ಪ್ರವಾಹ ಆನ್ ಮಾಡಿ. ದಿಕ್ಸೂಚಿಗಳು ತಿರುಗಿ ವೃತ್ತವಾಗುತ್ತವೆ! ವಿದ್ಯುತ್ ಪ್ರವಾಹ ಕಾಂತಕ್ಷೇತ್ರ ಸೃಷ್ಟಿಸುತ್ತದೆ: ತಂತಿಯ ಸುತ್ತ ವೃತ್ತಗಳು.'
        ),
      },
      {
        set: { current: -3 },
        say: t(
          'Reverse the current and the circles reverse too. To find the direction, use the right-hand thumb rule: hold the wire in your right hand with the thumb along the current. Your curled fingers show the field.',
          'धारा उल्टी कीजिए तो गोले भी उल्टे घूमते हैं। दिशा जानने के लिए दाएँ हाथ के अंगूठे का नियम: तार को दाएँ हाथ में ऐसे पकड़िए कि अंगूठा धारा की दिशा में हो। मुड़ी उँगलियाँ क्षेत्र की दिशा बताती हैं।',
          'ಪ್ರವಾಹ ತಿರುಗಿಸಿದರೆ ವೃತ್ತಗಳೂ ತಿರುಗುತ್ತವೆ. ದಿಕ್ಕು ತಿಳಿಯಲು ಬಲಗೈ ಹೆಬ್ಬೆರಳಿನ ನಿಯಮ: ತಂತಿಯನ್ನು ಬಲಗೈಯಲ್ಲಿ ಹೆಬ್ಬೆರಳು ಪ್ರವಾಹದ ದಿಕ್ಕಿನಲ್ಲಿರುವಂತೆ ಹಿಡಿಯಿರಿ. ಮಡಚಿದ ಬೆರಳುಗಳು ಕ್ಷೇತ್ರದ ದಿಕ್ಕು ತೋರಿಸುತ್ತವೆ.'
        ),
      },
      {
        set: { mode: 'solenoid', current: 3 },
        cam: [0, 4.5, 7.5, 0, 0.8, 0],
        say: t(
          'Wind the wire into a coil, called a solenoid. The circles from every turn add up. Inside, the field is strong and straight; outside, it looks just like a bar magnet’s, with a north end and a south end. Put soft iron inside and you have an electromagnet.',
          'तार को कुंडली में लपेटिए, इसे परिनालिका कहते हैं। हर फेरे के गोले जुड़ जाते हैं। अंदर क्षेत्र प्रबल और सीधा है; बाहर बिल्कुल छड़ चुंबक जैसा, एक उत्तर और एक दक्षिण सिरा। अंदर नरम लोहा रखिए और विद्युत चुंबक तैयार।',
          'ತಂತಿಯನ್ನು ಸುರುಳಿಯಾಗಿ ಸುತ್ತಿ, ಇದನ್ನು ಸೊಲೆನಾಯ್ಡ್ ಎನ್ನುತ್ತಾರೆ. ಪ್ರತಿ ಸುತ್ತಿನ ವೃತ್ತಗಳು ಕೂಡುತ್ತವೆ. ಒಳಗೆ ಕ್ಷೇತ್ರ ಪ್ರಬಲ ಮತ್ತು ನೇರ; ಹೊರಗೆ ದಂಡ ಕಾಂತದಂತೆಯೇ, ಉತ್ತರ ಮತ್ತು ದಕ್ಷಿಣ ತುದಿಗಳೊಂದಿಗೆ. ಒಳಗೆ ಮೃದು ಕಬ್ಬಿಣ ಇಟ್ಟರೆ ವಿದ್ಯುತ್ಕಾಂತ ಸಿದ್ಧ.'
        ),
      },
    ],
    experiment: {
      intro: t('Switch between the magnet, the wire and the coil. Reverse the current.', 'चुंबक, तार और कुंडली में बदलिए। धारा उल्टी कीजिए।', 'ಕಾಂತ, ತಂತಿ ಮತ್ತು ಸುರುಳಿಯ ನಡುವೆ ಬದಲಿಸಿ. ಪ್ರವಾಹ ತಿರುಗಿಸಿ.'),
      start: { mode: 'wire', current: 2, compass: 1 },
      controls: [
        { key: 'mode', label: t('Scene', 'दृश्य', 'ದೃಶ್ಯ'), options: [
          { value: 'bar', label: t('Bar magnet', 'छड़ चुंबक', 'ದಂಡ ಕಾಂತ') },
          { value: 'wire', label: t('Straight wire', 'सीधा तार', 'ನೇರ ತಂತಿ') },
          { value: 'solenoid', label: t('Solenoid', 'परिनालिका', 'ಸೊಲೆನಾಯ್ಡ್') },
        ] },
        C.current,
        { key: 'filings', label: t('Iron filings', 'लोहे का बुरादा', 'ಕಬ್ಬಿಣದ ಪುಡಿ'), toggle: true },
        { key: 'compass', label: t('Compasses', 'कम्पास', 'ದಿಕ್ಸೂಚಿಗಳು'), toggle: true },
        { key: 'lines', label: t('Field lines', 'क्षेत्र रेखाएँ', 'ಕ್ಷೇತ್ರ ರೇಖೆಗಳು'), toggle: true },
      ],
    },
  },
  {
    id: 'jumping-wire',
    chapter: 'magnetism',
    concepts: ['force-on-conductor', 'domestic-circuits'],
    kit: 'magnet',
    color: '#12C26B',
    title: t('The jumping wire and the safe house', 'उछलता तार और सुरक्षित घर', 'ಜಿಗಿಯುವ ತಂತಿ ಮತ್ತು ಸುರಕ್ಷಿತ ಮನೆ'),
    premise: t('How motors push, and how fuses and earthing keep a home safe.', 'मोटर कैसे धकेलती है, और फ़्यूज़ व अर्थिंग घर को कैसे बचाते हैं।', 'ಮೋಟಾರ್ ಹೇಗೆ ತಳ್ಳುತ್ತದೆ, ಫ್ಯೂಸ್ ಮತ್ತು ಅರ್ಥಿಂಗ್ ಮನೆಯನ್ನು ಹೇಗೆ ಸುರಕ್ಷಿತವಾಗಿಡುತ್ತವೆ.'),
    base: { mode: 'force', current: 0, fieldDir: 1, tilt: 0, lines: 1, labels: 1, bulb: 1, fan: 1, heater: 0, iron: 0, fuse: 5, fault: 'none', earthing: 1 },
    beats: [
      {
        cam: [5, 3.5, 6, 0, 1.5, 0],
        say: t(
          'A copper rod hangs between the poles of a horseshoe magnet. The magnetic field points straight down, from N to S. Nothing happens yet.',
          'एक ताँबे की छड़ घोड़े की नाल वाले चुंबक के ध्रुवों के बीच लटकी है। चुंबकीय क्षेत्र N से S की ओर सीधा नीचे है। अभी कुछ नहीं होता।',
          'ಒಂದು ತಾಮ್ರದ ಸರಳು ಕುದುರೆ ಲಾಳ ಕಾಂತದ ಧ್ರುವಗಳ ನಡುವೆ ತೂಗುತ್ತಿದೆ. ಕಾಂತಕ್ಷೇತ್ರ N ನಿಂದ S ಗೆ ನೇರವಾಗಿ ಕೆಳಕ್ಕೆ. ಇನ್ನೂ ಏನೂ ಆಗುವುದಿಲ್ಲ.'
        ),
      },
      {
        set: { current: 3 },
        say: t(
          'Switch on a current along the rod. The rod jumps sideways! A wire carrying current in a magnetic field feels a force. This is the idea behind every electric motor: in fans, mixers and water pumps.',
          'छड़ में धारा चालू कीजिए। छड़ बगल में उछल जाती है! चुंबकीय क्षेत्र में धारा वाले तार पर बल लगता है। हर विद्युत मोटर इसी पर चलती है: पंखे, मिक्सर और पानी के पंप में।',
          'ಸರಳಿನಲ್ಲಿ ಪ್ರವಾಹ ಆನ್ ಮಾಡಿ. ಸರಳು ಪಕ್ಕಕ್ಕೆ ಜಿಗಿಯುತ್ತದೆ! ಕಾಂತಕ್ಷೇತ್ರದಲ್ಲಿ ಪ್ರವಾಹವಿರುವ ತಂತಿಯ ಮೇಲೆ ಬಲ ಬೀಳುತ್ತದೆ. ಪ್ರತಿ ವಿದ್ಯುತ್ ಮೋಟಾರ್ ಇದರ ಮೇಲೆ ನಡೆಯುತ್ತದೆ: ಫ್ಯಾನ್, ಮಿಕ್ಸರ್, ನೀರಿನ ಪಂಪ್.'
        ),
      },
      {
        set: { current: -3 },
        say: t(
          'Reverse the current and the rod jumps the other way. Reversing the magnetic field does the same.',
          'धारा उल्टी कीजिए तो छड़ दूसरी ओर उछलती है। चुंबकीय क्षेत्र उल्टा करने से भी यही होता है।',
          'ಪ್ರವಾಹ ತಿರುಗಿಸಿದರೆ ಸರಳು ಇನ್ನೊಂದು ಕಡೆ ಜಿಗಿಯುತ್ತದೆ. ಕಾಂತಕ್ಷೇತ್ರ ತಿರುಗಿಸಿದರೂ ಹಾಗೇ.'
        ),
      },
      {
        set: { current: 3 },
        say: t(
          'Fleming’s left-hand rule gives the direction. Stretch the thumb, first finger and middle finger of your left hand at right angles. First finger along the Field, middle finger along the Current: the thumb shows the Motion, the force.',
          'फ़्लेमिंग का बाएँ हाथ का नियम दिशा बताता है। बाएँ हाथ का अंगूठा, तर्जनी और मध्यमा आपस में समकोण पर फैलाइए। तर्जनी क्षेत्र की दिशा में, मध्यमा धारा की दिशा में: अंगूठा गति, यानी बल, की दिशा बताता है।',
          'ಫ್ಲೆಮಿಂಗ್‌ನ ಎಡಗೈ ನಿಯಮ ದಿಕ್ಕು ತಿಳಿಸುತ್ತದೆ. ಎಡಗೈಯ ಹೆಬ್ಬೆರಳು, ತೋರುಬೆರಳು, ಮಧ್ಯದ ಬೆರಳನ್ನು ಪರಸ್ಪರ ಲಂಬವಾಗಿ ಚಾಚಿ. ತೋರುಬೆರಳು ಕ್ಷೇತ್ರದ ದಿಕ್ಕಿನಲ್ಲಿ, ಮಧ್ಯದ ಬೆರಳು ಪ್ರವಾಹದ ದಿಕ್ಕಿನಲ್ಲಿ: ಹೆಬ್ಬೆರಳು ಚಲನೆ, ಅಂದರೆ ಬಲದ ದಿಕ್ಕು.'
        ),
      },
      {
        set: { tilt: 90 },
        say: t(
          'Turn the magnet until its field runs along the rod. Now the force is zero! The force is largest when the current is at right angles to the field, and zero when they are parallel.',
          'चुंबक को घुमाइए ताकि क्षेत्र छड़ की लंबाई के साथ हो। अब बल शून्य है! धारा क्षेत्र के लंबवत हो तो बल सबसे ज़्यादा, और समानांतर हो तो शून्य।',
          'ಕ್ಷೇತ್ರ ಸರಳಿನ ಉದ್ದಕ್ಕೆ ಬರುವವರೆಗೆ ಕಾಂತ ತಿರುಗಿಸಿ. ಈಗ ಬಲ ಸೊನ್ನೆ! ಪ್ರವಾಹ ಕ್ಷೇತ್ರಕ್ಕೆ ಲಂಬವಾಗಿದ್ದಾಗ ಬಲ ಅತಿ ಹೆಚ್ಚು, ಸಮಾಂತರವಾಗಿದ್ದಾಗ ಸೊನ್ನೆ.'
        ),
      },
      {
        set: { mode: 'house', tilt: 0, bulb: 1, fan: 1, heater: 0, iron: 0, fuse: 5, fault: 'none' },
        cam: [1, 4, 9, 0, 1.6, -1],
        say: t(
          'Now let’s see how electricity reaches your home safely. Three wires come in: live, red, at 220 volts; neutral, black; and earth, green. Every appliance is connected in parallel, so each gets the full 220 volts and has its own switch.',
          'अब देखें कि बिजली घर तक सुरक्षित कैसे पहुँचती है। तीन तार आते हैं: लाइव, लाल, 220 वोल्ट पर; न्यूट्रल, काला; और अर्थ, हरा। हर उपकरण समांतर में जुड़ा है, इसलिए हर एक को पूरे 220 वोल्ट मिलते हैं और उसका अपना स्विच होता है।',
          'ಈಗ ವಿದ್ಯುತ್ ಮನೆಗೆ ಸುರಕ್ಷಿತವಾಗಿ ಹೇಗೆ ತಲುಪುತ್ತದೆ ನೋಡೋಣ. ಮೂರು ತಂತಿಗಳು ಬರುತ್ತವೆ: ಲೈವ್, ಕೆಂಪು, 220 ವೋಲ್ಟ್; ನ್ಯೂಟ್ರಲ್, ಕಪ್ಪು; ಅರ್ಥ್, ಹಸಿರು. ಪ್ರತಿ ಉಪಕರಣ ಸಮಾಂತರದಲ್ಲಿದೆ, ಪ್ರತಿಯೊಂದಕ್ಕೂ ಪೂರ್ತಿ 220 ವೋಲ್ಟ್ ಮತ್ತು ತನ್ನದೇ ಸ್ವಿಚ್.'
        ),
      },
      {
        set: { heater: 1, iron: 1 },
        say: t(
          'Meera switches on the heater and the iron together. 3175 watts divided by 220 volts is about 14 amperes, far more than the 5 ampere fuse allows. The fuse wire heats up and melts, cutting the supply before the house wires can overheat and catch fire. This is overloading.',
          'मीरा हीटर और इस्त्री एक साथ चला देती है। 3175 वाट बटा 220 वोल्ट लगभग 14 एम्पियर, जो 5 एम्पियर के फ़्यूज़ की सीमा से बहुत ज़्यादा है। फ़्यूज़ का तार गरम होकर पिघल जाता है और घर के तार ज़्यादा गरम होकर आग पकड़ें, उससे पहले बिजली कट जाती है। यह अतिभारण है।',
          'ಮೀರಾ ಹೀಟರ್ ಮತ್ತು ಇಸ್ತ್ರಿ ಎರಡನ್ನೂ ಒಟ್ಟಿಗೆ ಹಚ್ಚುತ್ತಾಳೆ. 3175 ವ್ಯಾಟ್ ಭಾಗಿಸು 220 ವೋಲ್ಟ್ ಸುಮಾರು 14 ಆಂಪಿಯರ್, 5 ಆಂಪಿಯರ್ ಫ್ಯೂಸ್ ಮಿತಿಗಿಂತ ಬಹಳ ಹೆಚ್ಚು. ಫ್ಯೂಸ್ ತಂತಿ ಬಿಸಿಯಾಗಿ ಕರಗುತ್ತದೆ, ಮನೆಯ ತಂತಿಗಳು ಅತಿಯಾಗಿ ಬಿಸಿಯಾಗಿ ಬೆಂಕಿ ಹಿಡಿಯುವ ಮೊದಲೇ ಸರಬರಾಜು ಕಡಿಯುತ್ತದೆ. ಇದು ಅತಿಭಾರ.'
        ),
      },
      {
        set: { iron: 0, fuse: 15, fault: 'earth', earthing: 0 },
        say: t(
          'Now a fault: the heater’s metal body touches the live wire. With no earth wire, anyone who touches the heater gets a shock, because the current flows through their body into the ground.',
          'अब एक ख़राबी: हीटर की धातु की बॉडी लाइव तार से छू जाती है। अर्थ तार न हो, तो हीटर छूने वाले को झटका लगता है, क्योंकि धारा उसके शरीर से होकर ज़मीन में जाती है।',
          'ಈಗ ಒಂದು ದೋಷ: ಹೀಟರಿನ ಲೋಹದ ದೇಹ ಲೈವ್ ತಂತಿಗೆ ತಾಗುತ್ತದೆ. ಅರ್ಥ್ ತಂತಿ ಇಲ್ಲದಿದ್ದರೆ ಹೀಟರ್ ಮುಟ್ಟಿದವರಿಗೆ ಶಾಕ್ ಹೊಡೆಯುತ್ತದೆ, ಏಕೆಂದರೆ ಪ್ರವಾಹ ಅವರ ದೇಹದ ಮೂಲಕ ನೆಲಕ್ಕೆ ಹರಿಯುತ್ತದೆ.'
        ),
      },
      {
        set: { earthing: 1 },
        say: t(
          'With an earth wire, the fault current rushes safely into the ground through the green wire instead. That big current also blows the fuse. That is why metal appliances like irons and heaters must always be earthed.',
          'अर्थ तार हो, तो ख़राबी की धारा हरे तार से सुरक्षित ज़मीन में चली जाती है। वह बड़ी धारा फ़्यूज़ भी उड़ा देती है। इसीलिए इस्त्री और हीटर जैसे धातु के उपकरणों की अर्थिंग हमेशा ज़रूरी है।',
          'ಅರ್ಥ್ ತಂತಿ ಇದ್ದರೆ ದೋಷದ ಪ್ರವಾಹ ಹಸಿರು ತಂತಿಯ ಮೂಲಕ ಸುರಕ್ಷಿತವಾಗಿ ನೆಲಕ್ಕೆ ಹರಿಯುತ್ತದೆ. ಆ ದೊಡ್ಡ ಪ್ರವಾಹ ಫ್ಯೂಸನ್ನೂ ಸುಡುತ್ತದೆ. ಅದಕ್ಕೇ ಇಸ್ತ್ರಿ, ಹೀಟರ್‌ನಂತಹ ಲೋಹದ ಉಪಕರಣಗಳಿಗೆ ಅರ್ಥಿಂಗ್ ಯಾವಾಗಲೂ ಬೇಕು.'
        ),
      },
    ],
    experiment: {
      intro: t('Push the rod with current, then run the house and try to blow the fuse.', 'धारा से छड़ धकेलिए, फिर घर चलाकर फ़्यूज़ उड़ाकर देखिए।', 'ಪ್ರವಾಹದಿಂದ ಸರಳು ತಳ್ಳಿ, ನಂತರ ಮನೆ ನಡೆಸಿ ಫ್ಯೂಸ್ ಸುಡಲು ಪ್ರಯತ್ನಿಸಿ.'),
      start: { mode: 'force', current: 2, tilt: 0, fault: 'none' },
      controls: [
        { key: 'mode', label: t('Scene', 'दृश्य', 'ದೃಶ್ಯ'), options: [
          { value: 'force', label: t('Rod in a magnet', 'चुंबक में छड़', 'ಕಾಂತದಲ್ಲಿ ಸರಳು') },
          { value: 'house', label: t('House wiring', 'घर की वायरिंग', 'ಮನೆಯ ವೈರಿಂಗ್') },
        ] },
        C.current,
        { key: 'tilt', label: t('Turn the magnet', 'चुंबक घुमाएँ', 'ಕಾಂತ ತಿರುಗಿಸಿ'), min: 0, max: 90, step: 5, unit: '°' },
        { key: 'heater', label: t('Heater 2000 W', 'हीटर 2000 W', 'ಹೀಟರ್ 2000 W'), toggle: true },
        { key: 'iron', label: t('Iron 1000 W', 'इस्त्री 1000 W', 'ಇಸ್ತ್ರಿ 1000 W'), toggle: true },
        { key: 'fuse', label: t('Fuse', 'फ़्यूज़', 'ಫ್ಯೂಸ್'), options: [
          { value: 5, label: t('5 A', '5 A', '5 A') },
          { value: 15, label: t('15 A', '15 A', '15 A') },
        ] },
        { key: 'fault', label: t('Fault', 'ख़राबी', 'ದೋಷ'), options: [
          { value: 'none', label: t('None', 'नहीं', 'ಇಲ್ಲ') },
          { value: 'earth', label: t('Live touches metal body', 'लाइव धातु से छुआ', 'ಲೈವ್ ಲೋಹಕ್ಕೆ ತಾಗಿದೆ') },
          { value: 'short', label: t('Short circuit', 'शॉर्ट सर्किट', 'ಶಾರ್ಟ್ ಸರ್ಕ್ಯೂಟ್') },
        ] },
        { key: 'earthing', label: t('Earth wire connected', 'अर्थ तार जुड़ा', 'ಅರ್ಥ್ ತಂತಿ ಜೋಡಿಸಲಾಗಿದೆ'), toggle: true },
      ],
    },
  },
];

export const STORY_BY_ID: Record<string, Story> = Object.fromEntries(STORIES.map((s) => [s.id, s]));
/** concept id → story that teaches it */
export const STORY_FOR_CONCEPT: Record<string, Story> = Object.fromEntries(STORIES.flatMap((s) => s.concepts.map((c) => [c, s])));

/** Scene state at a beat: the base plus every `set` up to and including that beat. */
export function stateAt(story: Story, beat: number): SceneState {
  const s: SceneState = { ...story.base };
  for (let i = 0; i <= beat && i < story.beats.length; i++) Object.assign(s, story.beats[i].set ?? {});
  return s;
}
export function camAt(story: Story, beat: number): Cam | undefined {
  for (let i = Math.min(beat, story.beats.length - 1); i >= 0; i--) if (story.beats[i].cam) return story.beats[i].cam;
  return undefined;
}
