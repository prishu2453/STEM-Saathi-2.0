import { markActiveToday } from '../lib/engagement';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Flame, RotateCcw, Sparkles, Trophy, Volume2, X } from 'lucide-react';
import {
  applyRating,
  countDue,
  countMastered,
  isDue,
  levelFromXp,
  loadFlashProgress,
  saveFlashProgress,
  XP_FOR,
  type Flashcard,
  type FlashcardProgress,
  type Rating,
} from '../lib/flashcards';
import { useSpeech } from '../hooks/useSpeech';
import type { Language } from '../types/stem';

type L3 = Record<Language, string>;
const T: Record<string, L3> = {
  title: { en: 'Flashcards', hi: 'फ्लैशकार्ड', kn: 'ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್' },
  due: { en: 'due today', hi: 'आज के लिए', kn: 'ಇಂದಿಗೆ' },
  mastered: { en: 'mastered', hi: 'याद हो गए', kn: 'ಕಲಿತವು' },
  start: { en: 'Start revision', hi: 'दोहराना शुरू करें', kn: 'ಪುನರಾವರ್ತನೆ ಆರಂಭಿಸಿ' },
  nothing: { en: 'No cards are due. Come back tomorrow, or practise all cards anyway.', hi: 'आज कोई कार्ड बाकी नहीं। कल आइए, या फिर भी सभी कार्ड दोहराएँ।', kn: 'ಇಂದು ಯಾವುದೇ ಕಾರ್ಡ್ ಬಾಕಿಯಿಲ್ಲ. ನಾಳೆ ಬನ್ನಿ ಅಥವಾ ಎಲ್ಲ ಕಾರ್ಡ್ ಅಭ್ಯಾಸ ಮಾಡಿ.' },
  all: { en: 'Practise all cards', hi: 'सभी कार्ड दोहराएँ', kn: 'ಎಲ್ಲ ಕಾರ್ಡ್ ಅಭ್ಯಾಸ' },
  tap: { en: 'Tap the card to see the answer', hi: 'उत्तर देखने के लिए कार्ड छुएँ', kn: 'ಉತ್ತರ ನೋಡಲು ಕಾರ್ಡ್ ಒತ್ತಿ' },
  again: { en: 'Again', hi: 'फिर से', kn: 'ಮತ್ತೆ' },
  good: { en: 'Got it', hi: 'याद है', kn: 'ನೆನಪಿದೆ' },
  easy: { en: 'Easy', hi: 'आसान', kn: 'ಸುಲಭ' },
  listen: { en: 'Listen', hi: 'सुनें', kn: 'ಕೇಳಿ' },
  done: { en: 'Session complete!', hi: 'सत्र पूरा!', kn: 'ಅವಧಿ ಪೂರ್ಣ!' },
  xp: { en: 'XP earned', hi: 'XP मिले', kn: 'XP ಗಳಿಸಿದ್ದು' },
  again2: { en: 'Revise again', hi: 'फिर दोहराएँ', kn: 'ಮತ್ತೆ ಪುನರಾವರ್ತಿಸಿ' },
  close: { en: 'Close', hi: 'बंद करें', kn: 'ಮುಚ್ಚಿ' },
  level: { en: 'Level', hi: 'स्तर', kn: 'ಹಂತ' },
  streak: { en: 'day streak', hi: 'दिन लगातार', kn: 'ದಿನ ನಿರಂತರ' },
  empty: { en: 'This chapter has no flashcards yet.', hi: 'इस अध्याय के फ्लैशकार्ड अभी नहीं हैं।', kn: 'ಈ ಅಧ್ಯಾಯಕ್ಕೆ ಇನ್ನೂ ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಇಲ್ಲ.' },
  card: { en: 'Card', hi: 'कार्ड', kn: 'ಕಾರ್ಡ್' },
  kind_definition: { en: 'Definition', hi: 'परिभाषा', kn: 'ವ್ಯಾಖ್ಯಾನ' },
  kind_formula: { en: 'Formula', hi: 'सूत्र', kn: 'ಸೂತ್ರ' },
  kind_concept: { en: 'Concept', hi: 'संकल्पना', kn: 'ಪರಿಕಲ್ಪನೆ' },
  kind_question: { en: 'Question', hi: 'प्रश्न', kn: 'ಪ್ರಶ್ನೆ' },
  kind_quiz: { en: 'Quick quiz', hi: 'त्वरित प्रश्न', kn: 'ತ್ವರಿತ ಪ್ರಶ್ನೆ' },
};
const KIND_COLOR: Record<string, string> = {
  definition: '#6D28D9', formula: '#B4430C', concept: '#3B2C78', question: '#7C3AED', quiz: '#B45309',
};

interface Props {
  deck: Flashcard[];
  language: Language;
  /** Shown above the deck, e.g. the chapter or syllabus name */
  heading?: string;
  onClose?: () => void;
}

const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

export const FlashcardTrainer: React.FC<Props> = ({ deck, language, heading, onClose }) => {
  const [progress, setProgress] = useState<FlashcardProgress>(() => loadFlashProgress());
  const [queue, setQueue] = useState<Flashcard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [gained, setGained] = useState(0);
  const [reviewed, setReviewed] = useState(0);
  const [knew, setKnew] = useState(0);
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);
  const flipRef = useRef<HTMLButtonElement | null>(null);

  const t = (k: string) => T[k][language];
  const due = useMemo(() => countDue(progress, deck), [progress, deck]);
  const mastered = useMemo(() => countMastered(progress, deck), [progress, deck]);
  const lvl = levelFromXp(progress.xp);

  const begin = (all: boolean) => {
    const pool = all ? deck : deck.filter((c) => isDue(progress, c.id));
    setQueue(shuffle(pool).slice(0, 12));
    setIndex(0);
    setFlipped(false);
    setGained(0);
    setReviewed(0);
    setKnew(0);
  };

  const card = queue && index < queue.length ? queue[index] : null;

  const rate = useCallback(
    (r: Rating) => {
      if (!card || !queue) return;
      stopSpeaking();
      setProgress((p) => {
        const next = applyRating(p, card.id, r);
        saveFlashProgress(next);
        return next;
      });
      setGained((g) => g + XP_FOR[r]);
      markActiveToday();
      setReviewed((n) => n + 1);
      if (r !== 'again') setKnew((n) => n + 1);
      else setQueue((q) => (q ? [...q, card] : q)); // see it again this session
      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [card, queue, stopSpeaking]
  );

  // Keyboard: 1 / 2 / 3 rate once the answer is showing
  useEffect(() => {
    if (!flipped) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '1') rate('again');
      if (e.key === '2') rate('good');
      if (e.key === '3') rate('easy');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, rate]);

  useEffect(() => {
    if (card) flipRef.current?.focus();
  }, [index, card]);

  const readText = card ? [card.front, ...(card.frontExtra ?? []), card.back, card.backExtra ?? ''].join('. ') : '';
  const color = card ? KIND_COLOR[card.kind] : '#6D28D9';

  const Header = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 rounded-xl bg-[#2E1A6E] text-white px-3 py-1.5 text-sm font-semibold">
        <Trophy className="w-4 h-4 text-[#FF9F1C]" aria-hidden="true" />
        {t('level')} {lvl.level}
      </div>
      <div className="flex-1 min-w-[140px]">
        <div className="flex justify-between text-xs text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
          <span>{progress.xp} XP</span>
          <span>{lvl.into}/{lvl.needed}</span>
        </div>
        <div className="h-2.5 rounded-full bg-[#E7DDFB] dark:bg-[#3B2C78] overflow-hidden" role="progressbar" aria-valuenow={lvl.into} aria-valuemin={0} aria-valuemax={lvl.needed} aria-label="XP to next level">
          <div className="h-full bg-[#6D28D9] transition-all" style={{ width: `${Math.min(100, (lvl.into / lvl.needed) * 100)}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-1 text-sm font-semibold text-[#B4430C] dark:text-[#FF9F1C]">
        <Flame className="w-4 h-4" aria-hidden="true" />
        {progress.streak} {t('streak')}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label={t('close')} className="ml-auto min-h-[44px] min-w-[44px] grid place-items-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] cursor-pointer">
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
    </div>
  );

  if (deck.length === 0) {
    return (
      <div className="space-y-4">
        {Header}
        <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('empty')}</p>
      </div>
    );
  }

  // Start screen
  if (!queue) {
    return (
      <div className="space-y-5">
        {Header}
        <div className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 sm:p-6 space-y-4 text-center">
          <Sparkles className="w-8 h-8 mx-auto text-[#6D28D9]" aria-hidden="true" />
          <h3 className="text-xl font-bold text-[#2E1A6E] dark:text-white">{heading ?? t('title')}</h3>
          <p className="text-3xl font-bold tabular-nums text-[#6D28D9]">{due}<span className="text-base font-semibold text-[#4A3F66] dark:text-[#C9BFEA]"> / {deck.length} {t('due')}</span></p>
          <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{mastered} {t('mastered')}</p>
          {due === 0 && <p className="text-sm">{t('nothing')}</p>}
          <div className="flex flex-wrap justify-center gap-3">
            {due > 0 && (
              <button type="button" onClick={() => begin(false)} className="min-h-[48px] rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-6 text-sm font-semibold text-white cursor-pointer">{t('start')}</button>
            )}
            <button type="button" onClick={() => begin(true)} className="min-h-[48px] rounded-xl border border-[#6D28D9] px-6 text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD] cursor-pointer">{t('all')}</button>
          </div>
        </div>
      </div>
    );
  }

  // Finished
  if (!card) {
    const pct = reviewed ? Math.round((knew / reviewed) * 100) : 0;
    return (
      <div className="space-y-5">
        {Header}
        <div className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-6 text-center space-y-3">
          <Trophy className="w-10 h-10 mx-auto text-[#FF9F1C]" aria-hidden="true" />
          <h3 className="text-xl font-bold text-[#2E1A6E] dark:text-white">{t('done')}</h3>
          <p className="text-lg tabular-nums">+{gained} {t('xp')} · {pct}%</p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button type="button" onClick={() => begin(false)} className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] px-6 text-sm font-semibold text-white cursor-pointer"><RotateCcw className="w-4 h-4" aria-hidden="true" />{t('again2')}</button>
            <button type="button" onClick={() => setQueue(null)} className="min-h-[48px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-6 text-sm font-semibold cursor-pointer">{t('close')}</button>
          </div>
        </div>
      </div>
    );
  }

  const faceBase: React.CSSProperties = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' };
  return (
    <div className="space-y-4">
      {Header}
      <div className="flex justify-between text-xs text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
        <span>{t('card')} {Math.min(index + 1, queue.length)} / {queue.length}</span>
        <span>{card.chapterTitle}</span>
      </div>

      <div style={{ perspective: '1200px' }}>
        <button
          ref={flipRef}
          type="button"
          aria-pressed={flipped}
          aria-label={flipped ? card.back : card.front}
          onClick={() => setFlipped((f) => !f)}
          className="relative block w-full min-h-[300px] sm:min-h-[340px] text-left cursor-pointer focus-visible:outline-4"
          style={{ transformStyle: 'preserve-3d', transition: 'transform 500ms cubic-bezier(0.22,1,0.36,1)', transform: flipped ? 'rotateY(180deg)' : 'none' }}
        >
          <div className="absolute inset-0 rounded-2xl border-2 bg-white dark:bg-[#1F1545] p-5 sm:p-7 flex flex-col justify-between overflow-auto shadow-lg" style={{ ...faceBase, borderColor: color }}>
            <span className="inline-block self-start rounded-full px-3 py-1 text-xs font-bold text-white" style={{ background: color }}>{t(`kind_${card.kind}`)}</span>
            <div className="space-y-3 py-3">
              <p className="text-xl sm:text-2xl font-bold leading-snug text-[#2E1A6E] dark:text-white">{card.front}</p>
              {card.frontExtra && (
                <ul className="space-y-1 text-base text-[#22163F] dark:text-[#E4DDFA]">
                  {card.frontExtra.map((o) => <li key={o}>{o}</li>)}
                </ul>
              )}
            </div>
            <span className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('tap')}</span>
          </div>
          <div className="absolute inset-0 rounded-2xl p-5 sm:p-7 flex flex-col justify-center gap-3 overflow-auto shadow-lg text-white" style={{ ...faceBase, background: color, transform: 'rotateY(180deg)' }}>
            <p className={`text-xl sm:text-2xl font-bold leading-snug ${card.mono ? 'font-mono break-words' : ''}`}>{card.back}</p>
            {card.backExtra && <p className="text-base leading-relaxed opacity-95">{card.backExtra}</p>}
          </div>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => (isSpeaking ? stopSpeaking() : speak(readText))} className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-4 text-sm font-semibold cursor-pointer">
          <Volume2 className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />{t('listen')}
        </button>
      </div>

      <div className={`grid grid-cols-3 gap-3 transition-opacity ${flipped ? 'opacity-100' : 'opacity-40 pointer-events-none'}`} aria-hidden={!flipped}>
        {([['again', '#B91C1C', '1'], ['good', '#6D28D9', '2'], ['easy', '#3B2C78', '3']] as const).map(([r, c, k]) => (
          <button key={r} type="button" disabled={!flipped} onClick={() => rate(r)} className="min-h-[56px] rounded-xl text-white text-base font-semibold cursor-pointer focus-visible:outline-4" style={{ background: c }}>
            {t(r)} <span className="text-xs opacity-80">({k})</span>
          </button>
        ))}
      </div>
    </div>
  );
};
