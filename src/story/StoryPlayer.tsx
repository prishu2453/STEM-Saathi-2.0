/**
 * Plays a 3D story like a video: each beat animates the 3D scene and is narrated
 * (device voice) with subtitles. After the last beat the same scene becomes a
 * hands-on experiment with live readouts and a quick check that updates mastery.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronLeft, ChevronRight, FlaskConical, Pause, Play, RotateCcw, Target, Volume2, VolumeX, XCircle } from 'lucide-react';
import { CONCEPT_BY_ID, MISCONCEPTION_BY_ID } from '../../shared/tutor/conceptGraph';
import { QUESTION_BANK, type TutorQuestion } from '../../shared/tutor/questionBank';
import { applyAnswer, pickQuestion, shuffledOrder } from '../../shared/tutor/learnerModel';
import { SPEECH_LANG_CODES } from '../data/i18n';
import { splitForSpeech } from '../hooks/useTeacherVoice';
import { markActiveToday } from '../lib/engagement';
import { useLearner } from '../lib/learnerStore';
import { getPreferredSpeechVoice } from '../lib/speechVoice';
import type { Language } from '../types/stem';
import { readouts } from './readouts';
import { camAt, stateAt, type Control, type Story } from './stories';
import { DEFAULT_CAM, Story3D, type SceneState } from './Story3D';

type L3 = { en: string; hi: string; kn: string };
const L = (x: L3, lang: Language) => x[lang] || x.en;
const UI = {
  scene: { en: 'Scene', hi: 'दृश्य', kn: 'ದೃಶ್ಯ' },
  play: { en: 'Play', hi: 'चलाएँ', kn: 'ಪ್ಲೇ' },
  pause: { en: 'Pause', hi: 'रोकें', kn: 'ವಿರಾಮ' },
  prev: { en: 'Previous scene', hi: 'पिछला दृश्य', kn: 'ಹಿಂದಿನ ದೃಶ್ಯ' },
  next: { en: 'Next scene', hi: 'अगला दृश्य', kn: 'ಮುಂದಿನ ದೃಶ್ಯ' },
  voiceOn: { en: 'Voice on', hi: 'आवाज़ चालू', kn: 'ಧ್ವನಿ ಆನ್' },
  voiceOff: { en: 'Voice off', hi: 'आवाज़ बंद', kn: 'ಧ್ವನಿ ಆಫ್' },
  tryIt: { en: 'Do the experiment', hi: 'प्रयोग कीजिए', kn: 'ಪ್ರಯೋಗ ಮಾಡಿ' },
  replay: { en: 'Replay story', hi: 'कहानी फिर से', kn: 'ಕಥೆ ಮತ್ತೆ' },
  back: { en: 'All stories', hi: 'सभी कहानियाँ', kn: 'ಎಲ್ಲಾ ಕಥೆಗಳು' },
  readings: { en: 'Live readings', hi: 'लाइव माप', kn: 'ನೇರ ಮಾಪನ' },
  check: { en: 'Quick check', hi: 'झटपट जाँच', kn: 'ತ್ವರಿತ ಪರಿಶೀಲನೆ' },
  checkBody: { en: 'Answer to update your mastery in Smart Practice.', hi: 'उत्तर दीजिए, स्मार्ट अभ्यास में आपकी महारत अपडेट होगी।', kn: 'ಉತ್ತರಿಸಿ, ಸ್ಮಾರ್ಟ್ ಅಭ್ಯಾಸದಲ್ಲಿ ನಿಮ್ಮ ಪ್ರಾವೀಣ್ಯ ನವೀಕರಿಸಲಾಗುತ್ತದೆ.' },
  correct: { en: 'Correct!', hi: 'सही!', kn: 'ಸರಿ!' },
  wrong: { en: 'Not quite.', hi: 'सही नहीं।', kn: 'ಸರಿಯಿಲ್ಲ.' },
  practise: { en: 'Practise these concepts', hi: 'इन संकल्पनाओं का अभ्यास', kn: 'ಈ ಪರಿಕಲ್ಪನೆಗಳ ಅಭ್ಯಾಸ' },
  nextStory: { en: 'Next story', hi: 'अगली कहानी', kn: 'ಮುಂದಿನ ಕಥೆ' },
  drag: { en: 'Drag to turn the scene, pinch or scroll to zoom.', hi: 'दृश्य घुमाने के लिए खींचें, ज़ूम के लिए पिंच या स्क्रॉल करें।', kn: 'ದೃಶ್ಯ ತಿರುಗಿಸಲು ಎಳೆಯಿರಿ, ಜೂಮ್‌ಗೆ ಪಿಂಚ್ ಅಥವಾ ಸ್ಕ್ರೋಲ್ ಮಾಡಿ.' },
  noVoice: { en: 'No voice for this language on this device, so subtitles only.', hi: 'इस डिवाइस पर इस भाषा की आवाज़ नहीं है, इसलिए केवल उपशीर्षक।', kn: 'ಈ ಸಾಧನದಲ್ಲಿ ಈ ಭಾಷೆಯ ಧ್ವನಿ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಉಪಶೀರ್ಷಿಕೆ ಮಾತ್ರ.' },
  on: { en: 'On', hi: 'चालू', kn: 'ಆನ್' },
  off: { en: 'Off', hi: 'बंद', kn: 'ಆಫ್' },
};

interface Props {
  story: Story;
  language: Language;
  lowPower?: boolean;
  onBack: () => void;
  onPractice?: (conceptId: string) => void;
  onNext?: () => void;
  onWatched?: (id: string) => void;
}

export const StoryPlayer: React.FC<Props> = ({ story, language, lowPower, onBack, onPractice, onNext, onWatched }) => {
  const t = (k: keyof typeof UI) => L(UI[k], language);
  const [beat, setBeat] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [voice, setVoice] = useState(true);
  const [mode, setMode] = useState<'story' | 'lab'>('story');
  const [lab, setLab] = useState<SceneState>(() => ({ ...stateAt(story, story.beats.length - 1), ...(story.experiment.start ?? {}) }));
  const [voiceMissing, setVoiceMissing] = useState(false);
  const tokenRef = useRef(0);
  const timerRef = useRef<number | null>(null);

  // reset when the story changes
  useEffect(() => {
    stopAll();
    setBeat(0);
    setPlaying(false);
    setMode('story');
    setLab({ ...stateAt(story, story.beats.length - 1), ...(story.experiment.start ?? {}) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id]);

  const stopAll = useCallback(() => {
    tokenRef.current += 1;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // no speech support
    }
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  /** Narrate one beat; resolves when done (voice end or reading-time timer). */
  const narrate = useCallback(
    (text: string, onDone: () => void) => {
      const my = ++tokenRef.current;
      const finish = () => {
        if (tokenRef.current !== my) return;
        timerRef.current = window.setTimeout(() => tokenRef.current === my && onDone(), 650);
      };
      const readTime = () => Math.max(3500, text.length * 62);
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
      const v = getPreferredSpeechVoice(language);
      const hasVoice = !!v || (synth?.getVoices() ?? []).some((x) => x.lang?.toLowerCase().startsWith(SPEECH_LANG_CODES[language].slice(0, 2).toLowerCase()));
      setVoiceMissing(voice && !hasVoice && language !== 'en');
      if (!voice || !synth || (!hasVoice && language !== 'en')) {
        timerRef.current = window.setTimeout(() => tokenRef.current === my && finish(), readTime());
        return;
      }
      synth.cancel();
      const parts = splitForSpeech(text);
      let idx = 0;
      const speakNext = () => {
        if (tokenRef.current !== my) return;
        if (idx >= parts.length) return finish();
        const u = new SpeechSynthesisUtterance(parts[idx++]);
        u.lang = SPEECH_LANG_CODES[language];
        if (v) u.voice = v;
        u.rate = 0.95;
        u.onend = speakNext;
        u.onerror = () => {
          // speech failed (no voice, blocked): fall back to reading time for the rest
          if (tokenRef.current !== my) return;
          timerRef.current = window.setTimeout(() => tokenRef.current === my && finish(), readTime() / 2);
        };
        synth.speak(u);
      };
      speakNext();
    },
    [language, voice]
  );

  // play loop
  useEffect(() => {
    if (!playing || mode !== 'story') return;
    narrate(L(story.beats[beat].say, language), () => {
      if (beat < story.beats.length - 1) setBeat((b) => b + 1);
      else {
        setPlaying(false);
        onWatched?.(story.id);
        setMode('lab');
      }
    });
    return () => stopAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, beat, mode, language, voice]);

  const go = (b: number) => {
    stopAll();
    setBeat(Math.max(0, Math.min(story.beats.length - 1, b)));
  };
  const toLab = () => {
    stopAll();
    setPlaying(false);
    onWatched?.(story.id);
    setMode('lab');
  };

  const sceneState = mode === 'story' ? stateAt(story, beat) : lab;
  const cam = mode === 'story' ? camAt(story, beat) ?? DEFAULT_CAM[story.kit] : story.experiment.cam ?? camAt(story, 0) ?? DEFAULT_CAM[story.kit];
  const rows = useMemo(() => readouts(story.kit, sceneState, language), [story.kit, sceneState, language]);

  const chunky = 'border-2 border-[#2E1A6E] dark:border-[#C4B5FD]';
  const btn = `inline-flex items-center justify-center gap-1.5 rounded-xl ${chunky} px-3 py-2 min-h-[44px] text-sm font-extrabold`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button type="button" onClick={() => { stopAll(); onBack(); }} className={`${btn} bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-white`}>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {t('back')}
        </button>
        <div className="flex flex-wrap gap-1.5">
          {story.concepts.map((c) => (
            <span key={c} className="rounded-full bg-[#F5F0FF] dark:bg-[#2A1D5C] px-2.5 py-1 text-xs font-bold text-[#5B21B6] dark:text-[#C4B5FD]">
              {CONCEPT_BY_ID[c].name[language] || CONCEPT_BY_ID[c].name.en}
            </span>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2E1A6E] dark:text-white">{L(story.title, language)}</h2>
        <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{L(story.premise, language)}</p>
      </div>

      <div className={mode === 'lab' ? 'grid lg:grid-cols-[1fr_340px] gap-4 items-start' : ''}>
        <div className={`relative rounded-3xl overflow-hidden ${chunky}`} style={{ boxShadow: `6px 6px 0 ${story.color}` }}>
          <Story3D
            kit={story.kit}
            state={sceneState}
            camera={cam}
            interactive
            lowPower={lowPower}
            className="h-[62vh] min-h-[340px] max-h-[620px] sm:h-auto sm:aspect-video sm:max-h-none"
            ariaLabel={L(story.title, language)}
          />
          {mode === 'story' && (
            <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4 pointer-events-none">
              <p className="mx-auto max-w-3xl rounded-2xl bg-[#140C2E]/85 px-4 py-3 text-center text-[15px] sm:text-lg font-semibold leading-snug text-white" aria-live="polite">
                {L(story.beats[beat].say, language)}
              </p>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/90 dark:bg-[#1F1545]/90 px-2.5 py-1 text-xs font-extrabold text-[#2E1A6E] dark:text-white">
            {mode === 'story' ? `${t('scene')} ${beat + 1} / ${story.beats.length}` : t('tryIt')}
          </span>
        </div>

        {mode === 'lab' && (
          <LabPanel
            story={story}
            language={language}
            state={lab}
            onChange={(k, v) => setLab((s) => ({ ...s, [k]: v }))}
            rows={rows}
            onReplay={() => {
              setMode('story');
              go(0);
              setPlaying(true);
            }}
            onPractice={onPractice}
            onNext={onNext}
          />
        )}
      </div>

      {mode === 'story' && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => go(beat - 1)} disabled={beat === 0} aria-label={t('prev')} className={`${btn} bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-white disabled:opacity-40`}>
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (playing) {
                  stopAll();
                  setPlaying(false);
                } else setPlaying(true);
              }}
              className={`${btn} bg-[#6D28D9] text-white px-5 shadow-[3px_3px_0_#2E1A6E]`}
            >
              {playing ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
              {playing ? t('pause') : t('play')}
            </button>
            <button type="button" onClick={() => go(beat + 1)} disabled={beat >= story.beats.length - 1} aria-label={t('next')} className={`${btn} bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-white disabled:opacity-40`}>
              <ChevronRight className="w-5 h-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => {
                stopAll();
                setVoice((v) => !v);
              }}
              aria-pressed={voice}
              className={`${btn} bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-white`}
            >
              {voice ? <Volume2 className="w-4 h-4" aria-hidden="true" /> : <VolumeX className="w-4 h-4" aria-hidden="true" />}
              <span className="hidden sm:inline">{voice ? t('voiceOn') : t('voiceOff')}</span>
            </button>
            <button type="button" onClick={toLab} className={`${btn} ml-auto bg-[#FF9F1C] text-[#2E1A6E] shadow-[3px_3px_0_#2E1A6E]`}>
              <FlaskConical className="w-4 h-4" aria-hidden="true" /> {t('tryIt')}
            </button>
          </div>
          <div className="flex gap-1.5" role="tablist" aria-label={t('scene')}>
            {story.beats.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === beat}
                aria-label={`${t('scene')} ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2.5 flex-1 rounded-full transition-colors ${i < beat ? 'bg-[#6D28D9]' : i === beat ? 'bg-[#FF9F1C]' : 'bg-[#E7DDFB] dark:bg-[#3B2C78]'}`}
              />
            ))}
          </div>
          {voiceMissing && <p className="text-xs font-semibold text-[#B4430C] dark:text-[#FFB27A]">{t('noVoice')}</p>}
          <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('drag')}</p>
        </div>
      )}
    </div>
  );
};

/* ---------------- experiment panel ---------------- */

const LabPanel: React.FC<{
  story: Story;
  language: Language;
  state: SceneState;
  onChange: (key: string, value: number | string) => void;
  rows: { label: string; value: string; warn?: boolean }[];
  onReplay: () => void;
  onPractice?: (conceptId: string) => void;
  onNext?: () => void;
}> = ({ story, language, state, onChange, rows, onReplay, onPractice, onNext }) => {
  const t = (k: keyof typeof UI) => L(UI[k], language);
  const card = 'rounded-2xl border-2 border-[#2E1A6E] dark:border-[#C4B5FD] bg-white dark:bg-[#1F1545] p-4';
  return (
    <div className="space-y-4">
      <div className={card}>
        <p className="text-sm font-bold text-[#2E1A6E] dark:text-white">{L(story.experiment.intro, language)}</p>
        <div className="mt-3 space-y-3">
          {story.experiment.controls.map((c) => (
            <ControlView key={c.key} c={c} language={language} value={state[c.key]} onChange={(v) => onChange(c.key, v)} />
          ))}
        </div>
      </div>
      <div className={card}>
        <p className="text-xs font-extrabold uppercase tracking-wide text-[#4A3F66] dark:text-[#C9BFEA]">{t('readings')}</p>
        <dl className="mt-2 space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-baseline justify-between gap-3 text-sm">
              <dt className="text-[#4A3F66] dark:text-[#C9BFEA]">{r.label}</dt>
              <dd className={`font-mono font-bold text-right ${r.warn ? 'text-[#D13438] dark:text-[#FDA4A6]' : 'text-[#2E1A6E] dark:text-white'}`}>{r.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <QuickCheck story={story} language={language} />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onReplay} className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#2E1A6E] dark:border-[#C4B5FD] bg-white dark:bg-[#1F1545] px-3 py-2 min-h-[44px] text-sm font-extrabold text-[#2E1A6E] dark:text-white">
          <RotateCcw className="w-4 h-4" aria-hidden="true" /> {t('replay')}
        </button>
        {onPractice && (
          <button type="button" onClick={() => onPractice(story.concepts[0])} className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#2E1A6E] bg-[#6D28D9] px-3 py-2 min-h-[44px] text-sm font-extrabold text-white">
            <Target className="w-4 h-4" aria-hidden="true" /> {t('practise')}
          </button>
        )}
        {onNext && (
          <button type="button" onClick={onNext} className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[#2E1A6E] bg-[#FF9F1C] px-3 py-2 min-h-[44px] text-sm font-extrabold text-[#2E1A6E]">
            {t('nextStory')} <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

const ControlView: React.FC<{ c: Control; language: Language; value: number | string | undefined; onChange: (v: number | string) => void }> = ({ c, language, value, onChange }) => {
  const label = L(c.label, language);
  if (c.toggle) {
    const on = typeof value === 'number' ? value > 0.5 : false;
    return (
      <label className="flex items-center justify-between gap-3 text-sm font-semibold text-[#2E1A6E] dark:text-white">
        {label}
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => onChange(on ? 0 : 1)}
          className={`relative h-7 w-12 rounded-full border-2 border-[#2E1A6E] dark:border-[#C4B5FD] transition-colors ${on ? 'bg-[#12C26B]' : 'bg-[#E7DDFB] dark:bg-[#3B2C78]'}`}
        >
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white border border-[#2E1A6E] transition-all ${on ? 'left-5' : 'left-0.5'}`} />
        </button>
      </label>
    );
  }
  if (c.options) {
    return (
      <div>
        <p className="text-xs font-bold text-[#4A3F66] dark:text-[#C9BFEA]">{label}</p>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {c.options.map((o) => (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={value === o.value}
              onClick={() => onChange(o.value)}
              className={`rounded-lg border-2 px-2.5 py-1.5 min-h-[38px] text-xs font-bold ${
                value === o.value ? 'border-[#2E1A6E] bg-[#6D28D9] text-white' : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-white'
              }`}
            >
              {L(o.label, language)}
            </button>
          ))}
        </div>
      </div>
    );
  }
  const v = typeof value === 'number' ? value : c.min ?? 0;
  const shown = v * (c.scale ?? 1);
  const stepShown = (c.step ?? 1) * (c.scale ?? 1);
  const decimals = stepShown < 0.1 ? 2 : stepShown < 1 ? 1 : 0;
  const display = (c.abs ? Math.abs(shown) : shown).toFixed(decimals);
  return (
    <label className="block text-sm">
      <span className="flex justify-between font-semibold text-[#2E1A6E] dark:text-white">
        {label}
        <span className="font-mono">
          {display} {c.unit ?? ''}
        </span>
      </span>
      <input type="range" min={c.min} max={c.max} step={c.step} value={v} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-[#6D28D9]" />
    </label>
  );
};

/* ---------------- quick check (updates the learner model) ---------------- */

const QuickCheck: React.FC<{ story: Story; language: Language }> = ({ story, language }) => {
  const t = (k: keyof typeof UI) => L(UI[k], language);
  const [learner, setLearner] = useLearner();
  const [idx, setIdx] = useState(0);
  const questions = useMemo<TutorQuestion[]>(
    () => story.concepts.map((c) => pickQuestion(learner, c, QUESTION_BANK, { target: 0.6 })).filter(Boolean) as TutorQuestion[],
    // pick once per story
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [story.id]
  );
  const [picked, setPicked] = useState<number | null>(null);
  const q = questions[idx];
  const order = useMemo(() => (q ? shuffledOrder(q, story.id.length * 7919) : []), [q, story.id]);
  if (!q) return null;
  const answer = (orig: number) => {
    if (picked !== null) return;
    setPicked(orig);
    const correct = orig === q.correctIndex;
    setLearner((prev) => applyAnswer(prev, { question: q, correct, mode: 'practice', optionMisconception: correct ? undefined : q.distractorMisconceptions[orig] }).state);
    markActiveToday();
  };
  const mis = picked !== null && picked !== q.correctIndex ? MISCONCEPTION_BY_ID[q.distractorMisconceptions[picked] ?? ''] : null;
  void learner;
  return (
    <div className="rounded-2xl border-2 border-[#2E1A6E] dark:border-[#C4B5FD] bg-[#FFF3E6] dark:bg-[#2A1D5C] p-4">
      <p className="text-xs font-extrabold uppercase tracking-wide text-[#B4430C] dark:text-[#FFB27A]">
        {t('check')} {idx + 1}/{questions.length}
      </p>
      <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('checkBody')}</p>
      <p className="mt-2 text-sm font-bold text-[#2E1A6E] dark:text-white">{q.stem}</p>
      <div className="mt-2 grid gap-1.5">
        {order.map((orig, i) => {
          const isRight = orig === q.correctIndex;
          let tone = 'bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-white border-[#E7DDFB] dark:border-[#3B2C78]';
          if (picked !== null && isRight) tone = 'bg-[#12A150] text-white border-[#12A150]';
          else if (picked === orig) tone = 'bg-[#E5484D] text-white border-[#E5484D]';
          return (
            <button key={orig} type="button" disabled={picked !== null} onClick={() => answer(orig)} className={`rounded-xl border-2 px-3 py-2 min-h-[42px] text-left text-sm font-semibold ${tone}`}>
              {String.fromCharCode(65 + i)}. {q.options[orig]}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-2 space-y-1 text-sm text-[#22163F] dark:text-[#E4DDFA]" aria-live="polite">
          <p className="flex items-center gap-1.5 font-extrabold">
            {picked === q.correctIndex ? <CheckCircle2 className="w-4 h-4 text-[#12A150]" aria-hidden="true" /> : <XCircle className="w-4 h-4 text-[#E5484D]" aria-hidden="true" />}
            {picked === q.correctIndex ? t('correct') : t('wrong')}
          </p>
          <p>{q.explanation}</p>
          {mis && <p className="text-xs"><span className="font-bold">{mis.label}:</span> {mis.fix}</p>}
          {idx < questions.length - 1 && (
            <button
              type="button"
              onClick={() => {
                setIdx((i) => i + 1);
                setPicked(null);
              }}
              className="mt-1 inline-flex items-center gap-1 rounded-lg bg-[#2E1A6E] px-3 py-1.5 text-xs font-extrabold text-white"
            >
              {t('next')} <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
