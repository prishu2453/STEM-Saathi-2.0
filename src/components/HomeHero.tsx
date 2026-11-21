/**
 * Front page hero for Gyaan Graph: what the app does in one line, a one-tap
 * "misconception of the day", and the student's own graph (or how it works).
 */
import React, { useMemo, useState } from 'react';
import { ArrowRight, Atom, CalendarClock, ClipboardCheck, Clapperboard, Lightbulb, Play, Target, Users } from 'lucide-react';
import { STORIES } from '../story/stories';
import { CONCEPTS, CONCEPT_BY_ID, MISCONCEPTION_BY_ID } from '../../shared/tutor/conceptGraph';
import { conceptStatus, dueConcepts, effectiveMastery, isReady, overallMastery } from '../../shared/tutor/learnerModel';
import { useLearner } from '../lib/learnerStore';
import type { Language } from '../types/stem';

type L3 = { en: string; hi: string; kn: string };
const L = (x: L3, lang: Language) => x[lang] || x.en;

const T = {
  sticker: { en: 'Class 10 Physics · CBSE', hi: 'कक्षा 10 भौतिकी · CBSE', kn: '10ನೇ ತರಗತಿ ಭೌತಶಾಸ್ತ್ರ · CBSE' },
  h1a: { en: 'Find the exact physics', hi: 'भौतिकी का वही हिस्सा खोजें', kn: 'ನಿಮಗೆ ಇನ್ನೂ ಅರ್ಥವಾಗದ' },
  h1b: { en: 'you don’t get yet.', hi: 'जो अभी समझ नहीं आया।', kn: 'ಭೌತಶಾಸ್ತ್ರವನ್ನು ಹುಡುಕಿ.' },
  sub: {
    en: '12 questions map what you know across all 24 concepts. When you get one wrong, Gyaan Graph reads your reasoning to find the idea behind the mistake, then gives you only what you need next.',
    hi: '12 प्रश्न सभी 24 संकल्पनाओं में आपकी समझ का नक्शा बनाते हैं। गलत उत्तर पर ज्ञान ग्राफ़ आपका तर्क पढ़कर गलती की असली वजह खोजता है, फिर सिर्फ़ वही देता है जो आगे चाहिए।',
    kn: '12 ಪ್ರಶ್ನೆಗಳು ಎಲ್ಲಾ 24 ಪರಿಕಲ್ಪನೆಗಳಲ್ಲಿ ನಿಮ್ಮ ತಿಳುವಳಿಕೆಯ ನಕ್ಷೆ ಮಾಡುತ್ತವೆ. ತಪ್ಪಾದಾಗ, ನಿಮ್ಮ ತರ್ಕ ಓದಿ ತಪ್ಪಿನ ಹಿಂದಿನ ಕಲ್ಪನೆಯನ್ನು ಹುಡುಕುತ್ತದೆ, ನಂತರ ಮುಂದೆ ಬೇಕಾದುದನ್ನು ಮಾತ್ರ ನೀಡುತ್ತದೆ.',
  },
  ctaStart: { en: 'Find my gaps · 12 questions', hi: 'मेरी कमियाँ खोजें · 12 प्रश्न', kn: 'ನನ್ನ ಕೊರತೆ ಹುಡುಕಿ · 12 ಪ್ರಶ್ನೆ' },
  ctaContinue: { en: 'Continue practice', hi: 'अभ्यास जारी रखें', kn: 'ಅಭ್ಯಾಸ ಮುಂದುವರಿಸಿ' },
  ctaLab: { en: 'Open the 3D lab', hi: '3D लैब खोलें', kn: '3D ಪ್ರಯೋಗಾಲಯ ತೆರೆಯಿರಿ' },
  ctaTeacher: { en: 'I’m a teacher', hi: 'मैं शिक्षक हूँ', kn: 'ನಾನು ಶಿಕ್ಷಕ' },
  ctaAsk: { en: 'Ask a doubt', hi: 'सवाल पूछें', kn: 'ಸಂದೇಹ ಕೇಳಿ' },
  storiesTitle: { en: 'Learn it as a 3D story', hi: '3D कहानी से सीखिए', kn: '3D ಕಥೆಯಾಗಿ ಕಲಿಯಿರಿ' },
  storiesSub: {
    en: 'Every Class 10 topic as a short narrated 3D story from everyday life, then you do the experiment yourself.',
    hi: 'कक्षा 10 का हर विषय रोज़मर्रा की एक छोटी 3D कहानी के रूप में, फिर आप ख़ुद प्रयोग करते हैं।',
    kn: '10ನೇ ತರಗತಿಯ ಪ್ರತಿ ವಿಷಯ ದೈನಂದಿನ ಜೀವನದ ಸಣ್ಣ 3D ಕಥೆಯಾಗಿ, ನಂತರ ನೀವೇ ಪ್ರಯೋಗ ಮಾಡುತ್ತೀರಿ.',
  },
  allStories: { en: 'All 12 stories', hi: 'सभी 12 कहानियाँ', kn: 'ಎಲ್ಲಾ 12 ಕಥೆಗಳು' },
  motd: { en: 'Misconception of the day', hi: 'आज की गलतफ़हमी', kn: 'ಇಂದಿನ ತಪ್ಪುಕಲ್ಪನೆ' },
  tap: { en: 'Tap your answer', hi: 'अपना उत्तर चुनें', kn: 'ನಿಮ್ಮ ಉತ್ತರ ಒತ್ತಿ' },
  right: { en: 'Right!', hi: 'सही!', kn: 'ಸರಿ!' },
  rightBody: { en: 'Lots of students pick the other answer because they believe:', hi: 'बहुत से छात्र दूसरा उत्तर चुनते हैं क्योंकि वे मानते हैं:', kn: 'ಅನೇಕರು ಇನ್ನೊಂದು ಉತ್ತರ ಆರಿಸುತ್ತಾರೆ, ಏಕೆಂದರೆ ಅವರು ನಂಬುತ್ತಾರೆ:' },
  wrong: { en: 'That’s the classic wrong idea:', hi: 'यह सबसे आम गलत धारणा है:', kn: 'ಇದು ಸಾಮಾನ್ಯ ತಪ್ಪುಕಲ್ಪನೆ:' },
  checkAll: { en: 'Check all 24 concepts', hi: 'सभी 24 संकल्पनाएँ जाँचें', kn: 'ಎಲ್ಲಾ 24 ಪರಿಕಲ್ಪನೆ ಪರಿಶೀಲಿಸಿ' },
  tomorrow: { en: 'A new one tomorrow.', hi: 'कल नया सवाल।', kn: 'ನಾಳೆ ಹೊಸದು.' },
  yourGraph: { en: 'Your Gyaan Graph', hi: 'आपका ज्ञान ग्राफ़', kn: 'ನಿಮ್ಮ ಜ್ಞಾನ ಗ್ರಾಫ್' },
  mastery: { en: 'mastery', hi: 'महारत', kn: 'ಪ್ರಾವೀಣ್ಯ' },
  mastered: { en: 'mastered', hi: 'पक्के', kn: 'ಕಲಿತವು' },
  gaps: { en: 'gaps', hi: 'कमियाँ', kn: 'ಕೊರತೆಗಳು' },
  due: { en: 'due today', hi: 'आज दोहराना', kn: 'ಇಂದು ಪುನರಾವರ್ತನೆ' },
  nextUp: { en: 'Next up for you', hi: 'आपके लिए अगला', kn: 'ನಿಮಗೆ ಮುಂದಿನದು' },
  how: { en: 'How Gyaan Graph works', hi: 'ज्ञान ग्राफ़ कैसे काम करता है', kn: 'ಜ್ಞಾನ ಗ್ರಾಫ್ ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ' },
  s1t: { en: 'Diagnose', hi: 'जाँच', kn: 'ಪರೀಕ್ಷೆ' },
  s1: { en: '12 questions, each picked from your last answer. Get Ohm’s law right and we know you have current and voltage too.', hi: '12 प्रश्न, हर एक पिछले उत्तर से चुना। ओम का नियम सही तो धारा और विभव भी पक्के।', kn: '12 ಪ್ರಶ್ನೆ, ಪ್ರತಿಯೊಂದೂ ಹಿಂದಿನ ಉತ್ತರದಿಂದ ಆಯ್ಕೆ. ಓಮ್ ನಿಯಮ ಸರಿ ಎಂದರೆ ಪ್ರವಾಹ, ವಿಭವ ಕೂಡ ಗೊತ್ತು.' },
  s2t: { en: 'Fix the real mistake', hi: 'असली गलती सुधारें', kn: 'ನಿಜವಾದ ತಪ್ಪು ಸರಿಪಡಿಸಿ' },
  s2: { en: 'Got it wrong? Tell us why in one line. We find the wrong idea (not just the wrong option) and practise exactly that, at your level.', hi: 'गलत हुआ? एक पंक्ति में क्यों बताइए। हम गलत धारणा खोजकर उसी का अभ्यास कराते हैं।', kn: 'ತಪ್ಪಾಯಿತೇ? ಒಂದು ಸಾಲಿನಲ್ಲಿ ಏಕೆ ಹೇಳಿ. ತಪ್ಪುಕಲ್ಪನೆ ಹುಡುಕಿ ಅದನ್ನೇ ಅಭ್ಯಾಸ ಮಾಡಿಸುತ್ತೇವೆ.' },
  s3t: { en: 'Never forget it', hi: 'कभी न भूलें', kn: 'ಎಂದೂ ಮರೆಯಬೇಡಿ' },
  s3: { en: 'Each concept comes back just before you would forget it: after 1 day, then 3, 7, 17…', hi: 'हर संकल्पना भूलने से ठीक पहले लौटती है: 1 दिन, फिर 3, 7, 17…', kn: 'ಪ್ರತಿ ಪರಿಕಲ್ಪನೆ ಮರೆಯುವ ಮುನ್ನ ಮರಳುತ್ತದೆ: 1 ದಿನ, ನಂತರ 3, 7, 17…' },
  s4t: { en: 'Teachers see the class', hi: 'शिक्षक पूरी कक्षा देखें', kn: 'ಶಿಕ್ಷಕರು ತರಗತಿ ನೋಡುತ್ತಾರೆ' },
  s4: { en: 'One class code. A heatmap of who is stuck where, and what to re-teach first.', hi: 'एक कक्षा कोड। कौन कहाँ अटका है और पहले क्या दोबारा पढ़ाएँ।', kn: 'ಒಂದು ತರಗತಿ ಕೋಡ್. ಯಾರು ಎಲ್ಲಿ ಸಿಲುಕಿದ್ದಾರೆ, ಮೊದಲು ಏನು ಮತ್ತೆ ಕಲಿಸಬೇಕು.' },
};

/** Two-choice daily questions, each tied to a misconception in the concept graph. */
const DAILY: { mis: string; q: L3; a: [L3, L3]; correct: 0 | 1 }[] = [
  { mis: 'current-used-up', correct: 1,
    q: { en: 'A bulb glows in a simple circuit. Is the current coming out of the bulb less than the current going in?', hi: 'एक बल्ब जल रहा है। क्या बल्ब से निकलने वाली धारा, अंदर जाने वाली धारा से कम है?', kn: 'ಬಲ್ಬ್ ಉರಿಯುತ್ತಿದೆ. ಬಲ್ಬ್‌ನಿಂದ ಹೊರಬರುವ ಪ್ರವಾಹ ಒಳಹೋಗುವುದಕ್ಕಿಂತ ಕಡಿಮೆಯೇ?' },
    a: [{ en: 'Yes, the bulb uses some up', hi: 'हाँ, बल्ब कुछ खर्च कर लेता है', kn: 'ಹೌದು, ಬಲ್ಬ್ ಸ್ವಲ್ಪ ಬಳಸುತ್ತದೆ' }, { en: 'No, it is exactly the same', hi: 'नहीं, बिल्कुल बराबर है', kn: 'ಇಲ್ಲ, ಸಮವಾಗಿದೆ' }] },
  { mis: 'refraction-speeds-up', correct: 0,
    q: { en: 'Light bends towards the normal when it enters glass from air. In glass, light…', hi: 'हवा से काँच में जाते समय प्रकाश अभिलंब की ओर मुड़ता है। काँच में प्रकाश…', kn: 'ಗಾಳಿಯಿಂದ ಗಾಜಿಗೆ ಹೋಗುವಾಗ ಬೆಳಕು ಲಂಬದ ಕಡೆ ಬಾಗುತ್ತದೆ. ಗಾಜಿನಲ್ಲಿ ಬೆಳಕು…' },
    a: [{ en: 'slows down', hi: 'धीमा हो जाता है', kn: 'ನಿಧಾನವಾಗುತ್ತದೆ' }, { en: 'speeds up', hi: 'तेज़ हो जाता है', kn: 'ವೇಗವಾಗುತ್ತದೆ' }] },
  { mis: 'parallel-adds', correct: 1,
    q: { en: 'Two 6 Ω resistors are connected side by side (in parallel). The total resistance is…', hi: 'दो 6 Ω प्रतिरोधक पार्श्वक्रम में जुड़े हैं। कुल प्रतिरोध…', kn: 'ಎರಡು 6 Ω ರೋಧಕಗಳು ಸಮಾಂತರದಲ್ಲಿವೆ. ಒಟ್ಟು ರೋಧ…' },
    a: [{ en: '12 Ω, they add up', hi: '12 Ω, जुड़ जाते हैं', kn: '12 Ω, ಕೂಡುತ್ತವೆ' }, { en: '3 Ω, less than either', hi: '3 Ω, दोनों से कम', kn: '3 Ω, ಎರಡಕ್ಕಿಂತ ಕಡಿಮೆ' }] },
  { mis: 'lens-moves', correct: 0,
    q: { en: 'You look up from your phone to a far-away tree. To focus, your eye…', hi: 'फ़ोन से नज़र हटाकर दूर पेड़ देखते हैं। फोकस के लिए आँख…', kn: 'ಫೋನ್‌ನಿಂದ ದೂರದ ಮರ ನೋಡುತ್ತೀರಿ. ಕೇಂದ್ರೀಕರಿಸಲು ಕಣ್ಣು…' },
    a: [{ en: 'makes its lens thinner', hi: 'लेंस पतला करती है', kn: 'ಮಸೂರವನ್ನು ತೆಳುವಾಗಿಸುತ್ತದೆ' }, { en: 'moves its lens backwards', hi: 'लेंस पीछे खिसकाती है', kn: 'ಮಸೂರವನ್ನು ಹಿಂದೆ ಸರಿಸುತ್ತದೆ' }] },
  { mis: 'sky-reflects-sea', correct: 1,
    q: { en: 'Why is a clear sky blue, even over a desert?', hi: 'साफ़ आसमान नीला क्यों होता है, रेगिस्तान के ऊपर भी?', kn: 'ಮರುಭೂಮಿಯ ಮೇಲೂ ಸ್ವಚ್ಛ ಆಕಾಶ ನೀಲಿ ಏಕೆ?' },
    a: [{ en: 'It reflects the colour of the sea', hi: 'यह समुद्र का रंग दिखाता है', kn: 'ಸಮುದ್ರದ ಬಣ್ಣ ಪ್ರತಿಫಲಿಸುತ್ತದೆ' }, { en: 'Air scatters blue light the most', hi: 'हवा नीले प्रकाश को सबसे ज़्यादा बिखेरती है', kn: 'ಗಾಳಿ ನೀಲಿ ಬೆಳಕನ್ನು ಹೆಚ್ಚು ಚದುರಿಸುತ್ತದೆ' }] },
  { mis: 'heat-linear-in-i', correct: 0,
    q: { en: 'You double the current through a heater coil. The heat it makes becomes…', hi: 'हीटर कॉइल में धारा दोगुनी करते हैं। ऊष्मा हो जाती है…', kn: 'ಹೀಟರ್ ಸುರುಳಿಯಲ್ಲಿ ಪ್ರವಾಹ ದ್ವಿಗುಣ. ಉಷ್ಣ ಆಗುತ್ತದೆ…' },
    a: [{ en: '4 times', hi: '4 गुना', kn: '4 ಪಟ್ಟು' }, { en: '2 times', hi: '2 गुना', kn: '2 ಪಟ್ಟು' }] },
  { mis: 'kwh-is-power', correct: 1,
    q: { en: 'Your electricity bill counts “units”, and 1 unit = 1 kWh. Is a kWh a unit of power or of energy?', hi: 'बिजली बिल “यूनिट” गिनता है, 1 यूनिट = 1 kWh। kWh शक्ति की इकाई है या ऊर्जा की?', kn: 'ವಿದ್ಯುತ್ ಬಿಲ್ “ಯೂನಿಟ್” ಎಣಿಸುತ್ತದೆ, 1 ಯೂನಿಟ್ = 1 kWh. kWh ಶಕ್ತಿಯ (ಪವರ್) ಘಟಕವೇ ಅಥವಾ ಶಕ್ತಿಯದೇ (ಎನರ್ಜಿ)?' },
    a: [{ en: 'Power', hi: 'शक्ति (पावर)', kn: 'ಪವರ್' }, { en: 'Energy', hi: 'ऊर्जा (एनर्जी)', kn: 'ಎನರ್ಜಿ' }] },
];

/** Hand-drawn underline (deliberately a little wobbly). */
const Squiggle: React.FC = () => (
  <svg viewBox="0 0 300 18" preserveAspectRatio="none" className="absolute -bottom-2 left-0 w-full h-3.5" aria-hidden="true">
    <path d="M3 12 C 40 4, 70 15, 108 8 S 175 3, 210 10 S 268 14, 297 6" fill="none" stroke="#FF9F1C" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

interface Props {
  language: Language;
  onStartDiagnostic: () => void;
  onOpenTutor: () => void;
  onOpenLab: () => void;
  onOpenTeacher: () => void;
  onAskDoubt: () => void;
  /** Open a 3D story (no id: the story library). */
  onOpenStory?: (storyId?: string) => void;
  /** Class/board picker, language buttons and notes from the app shell. */
  children?: React.ReactNode;
}

export const HomeHero: React.FC<Props> = ({ language, onStartDiagnostic, onOpenTutor, onOpenLab, onOpenTeacher, onAskDoubt, onOpenStory, children }) => {
  const [learner] = useLearner();
  const day = Math.floor(Date.now() / 86_400_000);
  const item = DAILY[day % DAILY.length];
  const mis = MISCONCEPTION_BY_ID[item.mis];
  const [picked, setPicked] = useState<number | null>(null);
  const started = learner.history.length > 0;

  const summary = useMemo(() => {
    const now = Date.now();
    const statuses = CONCEPTS.map((c) => conceptStatus(learner.concepts[c.id], now));
    const next = CONCEPTS.filter((c) => isReady(learner, c.id, now))
      .map((c) => ({ id: c.id, m: effectiveMastery(learner.concepts[c.id], now) }))
      .filter((x) => x.m < 0.85)
      .sort((a, b) => a.m - b.m)
      .slice(0, 3);
    return {
      overall: overallMastery(learner, now),
      mastered: statuses.filter((s) => s === 'mastered').length,
      gaps: statuses.filter((s) => s === 'gap').length,
      due: dueConcepts(learner, now).length,
      next,
    };
  }, [learner]);

  const chunky = 'border-2 border-[#2E1A6E] dark:border-[#C4B5FD] shadow-[4px_4px_0_#2E1A6E] dark:shadow-[4px_4px_0_#C4B5FD]';
  const press = 'transition-transform active:translate-x-[3px] active:translate-y-[3px] active:shadow-none hover:-translate-y-0.5';

  return (
    <div className="space-y-8 sm:space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
        {/* Left: the promise */}
        <div className="lg:col-span-7 space-y-5">
          <span className="inline-block -rotate-2 rounded-lg bg-[#FF9F1C] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-[#2E1A6E] border-2 border-[#2E1A6E]">
            {L(T.sticker, language)}
          </span>
          <h1 className="font-display text-[2.4rem] leading-[1.05] sm:text-6xl font-extrabold tracking-tight text-[#2E1A6E] dark:text-white">
            {L(T.h1a, language)}{' '}
            <span className="relative inline-block text-[#6D28D9] dark:text-[#C4B5FD]">
              {L(T.h1b, language)}
              <Squiggle />
            </span>
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-[#4A3F66] dark:text-[#E4DDFA] max-w-xl">{L(T.sub, language)}</p>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
            <button
              type="button"
              onClick={started ? onOpenTutor : onStartDiagnostic}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#6D28D9] text-white px-6 py-3.5 min-h-[54px] text-base font-extrabold ${chunky} ${press}`}
            >
              <ClipboardCheck className="w-5 h-5" aria-hidden="true" />
              {started ? L(T.ctaContinue, language) : L(T.ctaStart, language)}
              <ArrowRight className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={onOpenLab}
              className={`inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF9F1C] text-[#2E1A6E] px-5 py-3.5 min-h-[54px] text-base font-extrabold ${chunky} ${press}`}
            >
              <Atom className="w-5 h-5" aria-hidden="true" /> {L(T.ctaLab, language)}
            </button>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
            <button type="button" onClick={onOpenTeacher} className="inline-flex items-center gap-1.5 text-[#2E1A6E] dark:text-[#E4DDFA] underline decoration-[#FF5DA2] decoration-[3px] underline-offset-4">
              <Users className="w-4 h-4" aria-hidden="true" /> {L(T.ctaTeacher, language)}
            </button>
            <button type="button" onClick={onAskDoubt} className="inline-flex items-center gap-1.5 text-[#2E1A6E] dark:text-[#E4DDFA] underline decoration-[#12C26B] decoration-[3px] underline-offset-4">
              <Lightbulb className="w-4 h-4" aria-hidden="true" /> {L(T.ctaAsk, language)}
            </button>
          </div>
          {children}
        </div>

        {/* Right: misconception of the day */}
        <div className="lg:col-span-5">
          <div className={`relative rounded-3xl bg-[#FFF3E6] dark:bg-[#2A1D5C] p-5 sm:p-6 lg:rotate-1 ${chunky}`}>
            <span className="absolute -top-3.5 left-5 -rotate-3 rounded-full bg-[#FF5DA2] px-3 py-1 text-xs font-extrabold text-white border-2 border-[#2E1A6E]">
              {L(T.motd, language)}
            </span>
            <p className="mt-2 font-display text-xl sm:text-2xl font-bold leading-snug text-[#2E1A6E] dark:text-white">{L(item.q, language)}</p>
            {picked === null && <p className="mt-1 text-xs font-semibold text-[#4A3F66] dark:text-[#C9BFEA]">{L(T.tap, language)}</p>}
            <div className="mt-4 grid gap-2.5">
              {item.a.map((opt, i) => {
                const chosen = picked === i;
                const isRight = i === item.correct;
                let tone = 'bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-white';
                if (picked !== null && isRight) tone = 'bg-[#12C26B] text-white';
                else if (chosen) tone = 'bg-[#E5484D] text-white';
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={picked !== null}
                    onClick={() => setPicked(i)}
                    className={`rounded-2xl border-2 border-[#2E1A6E] dark:border-[#C4B5FD] px-4 py-3 min-h-[52px] text-left text-sm sm:text-base font-bold ${tone} ${picked === null ? 'hover:-translate-y-0.5 transition-transform' : ''}`}
                  >
                    {L(opt, language)}
                  </button>
                );
              })}
            </div>
            {picked !== null && (
              <div className="mt-4 space-y-2 text-sm text-[#22163F] dark:text-[#E4DDFA]" aria-live="polite">
                <p className="font-extrabold text-[#2E1A6E] dark:text-white">
                  {picked === item.correct ? `${L(T.right, language)} ${L(T.rightBody, language)}` : L(T.wrong, language)}
                </p>
                <p className="italic">“{mis.belief}”</p>
                <p>{mis.fix}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <button type="button" onClick={onStartDiagnostic} className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E1A6E] text-white px-4 py-2.5 min-h-[44px] text-sm font-extrabold">
                    {L(T.checkAll, language)} <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <span className="text-xs font-semibold text-[#4A3F66] dark:text-[#C9BFEA]">{L(T.tomorrow, language)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3D story lessons */}
      {onOpenStory && (
        <div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-display text-2xl sm:text-3xl font-extrabold text-[#2E1A6E] dark:text-white">
                <Clapperboard className="w-7 h-7 text-[#FF5DA2]" aria-hidden="true" /> {L(T.storiesTitle, language)}
              </h2>
              <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA] max-w-xl">{L(T.storiesSub, language)}</p>
            </div>
            <button type="button" onClick={() => onOpenStory()} className="inline-flex items-center gap-1.5 rounded-2xl border-2 border-[#2E1A6E] dark:border-[#C4B5FD] bg-white dark:bg-[#1F1545] px-4 py-2.5 min-h-[46px] text-sm font-extrabold text-[#2E1A6E] dark:text-white">
              {L(T.allStories, language)} <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {['bus-mirror', 'ravi-eyes', 'diwali-lights', 'jumping-wire'].map((id) => {
              const s = STORIES.find((x) => x.id === id)!;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onOpenStory(id)}
                  className="group text-left rounded-2xl border-2 border-[#2E1A6E] dark:border-[#C4B5FD] bg-white dark:bg-[#1F1545] overflow-hidden hover:-translate-y-1 transition-transform"
                  style={{ boxShadow: `4px 4px 0 ${s.color}` }}
                >
                  <div className="flex items-center justify-between px-3 py-2" style={{ background: s.color }}>
                    <span className="text-[11px] font-extrabold text-[#2E1A6E] bg-white/85 rounded-full px-2 py-0.5">{s.beats.length} scenes · 3D</span>
                    <Play className="w-5 h-5 text-white group-hover:scale-125 transition-transform" aria-hidden="true" />
                  </div>
                  <p className="p-3 font-display text-base sm:text-lg font-extrabold leading-tight text-[#2E1A6E] dark:text-white">{L(s.title, language)}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Your graph, or how it works */}
      {started ? (
        <div className={`rounded-3xl bg-white dark:bg-[#1F1545] p-5 sm:p-6 ${chunky}`}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-extrabold text-[#2E1A6E] dark:text-white">{L(T.yourGraph, language)}</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-sm font-bold">
                <span className="rounded-full bg-[#6D28D9] text-white px-3 py-1">{Math.round(summary.overall * 100)}% {L(T.mastery, language)}</span>
                <span className="rounded-full bg-[#12C26B] text-white px-3 py-1">{summary.mastered} {L(T.mastered, language)}</span>
                <span className="rounded-full bg-[#E5484D] text-white px-3 py-1">{summary.gaps} {L(T.gaps, language)}</span>
                <span className="rounded-full bg-[#FF9F1C] text-[#2E1A6E] px-3 py-1 inline-flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" /> {summary.due} {L(T.due, language)}
                </span>
              </div>
            </div>
            <button type="button" onClick={onOpenTutor} className={`inline-flex items-center gap-2 rounded-2xl bg-[#6D28D9] text-white px-5 py-3 min-h-[48px] font-extrabold ${chunky} ${press}`}>
              <Target className="w-5 h-5" aria-hidden="true" /> {L(T.ctaContinue, language)}
            </button>
          </div>
          {summary.next.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-extrabold uppercase tracking-wide text-[#4A3F66] dark:text-[#C9BFEA]">{L(T.nextUp, language)}</p>
              <div className="mt-2 grid sm:grid-cols-3 gap-2.5">
                {summary.next.map((n) => (
                  <div key={n.id} className="rounded-2xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
                    <p className="text-sm font-bold text-[#2E1A6E] dark:text-white">{CONCEPT_BY_ID[n.id].name[language] || CONCEPT_BY_ID[n.id].name.en}</p>
                    <div className="mt-2 h-2 rounded-full bg-white dark:bg-[#140C2E] overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(4, n.m * 100)}%`, background: n.m < 0.5 ? '#E5484D' : '#F59E0B' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2E1A6E] dark:text-white">{L(T.how, language)}</h2>
          <ol className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { t: T.s1t, b: T.s1, bg: 'bg-[#EFE7FF] dark:bg-[#2A1D5C]', dot: 'bg-[#6D28D9] text-white' },
              { t: T.s2t, b: T.s2, bg: 'bg-[#FFE4F0] dark:bg-[#3A1A3E]', dot: 'bg-[#FF5DA2] text-white' },
              { t: T.s3t, b: T.s3, bg: 'bg-[#FFF1DE] dark:bg-[#3A2A14]', dot: 'bg-[#FF9F1C] text-[#2E1A6E]' },
              { t: T.s4t, b: T.s4, bg: 'bg-[#E3F9EE] dark:bg-[#123B27]', dot: 'bg-[#12C26B] text-white' },
            ].map((s, i) => (
              <li key={i} className={`rounded-3xl p-5 border-2 border-[#2E1A6E] dark:border-[#C4B5FD] ${s.bg} ${i % 2 ? 'sm:translate-y-3' : ''}`}>
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full font-display text-lg font-extrabold border-2 border-[#2E1A6E] ${s.dot}`}>{i + 1}</span>
                <p className="mt-3 font-display text-xl font-extrabold text-[#2E1A6E] dark:text-white">{L(s.t, language)}</p>
                <p className="mt-1 text-sm leading-relaxed text-[#4A3F66] dark:text-[#E4DDFA]">{L(s.b, language)}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
};
