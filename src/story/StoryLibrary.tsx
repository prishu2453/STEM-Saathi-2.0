/** Library of 3D story lessons grouped by chapter; opens the player. */
import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clapperboard, Play } from 'lucide-react';
import { CHAPTERS, CONCEPT_BY_ID } from '../../shared/tutor/conceptGraph';
import { effectiveMastery } from '../../shared/tutor/learnerModel';
import { useLearner } from '../lib/learnerStore';
import type { Language } from '../types/stem';
import { STORIES, STORY_BY_ID } from './stories';
import { StoryPlayer } from './StoryPlayer';

const WATCHED_KEY = 'stem-saathi-stories-watched-v1';
const readWatched = (): string[] => {
  try {
    const v = JSON.parse(localStorage.getItem(WATCHED_KEY) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};

const T = {
  title: { en: '3D story lessons', hi: '3D कहानी पाठ', kn: '3D ಕಥಾ ಪಾಠಗಳು' },
  sub: {
    en: 'Every Class 10 Physics topic as a short 3D story from everyday life, narrated with subtitles. After each story, do the experiment yourself in the same 3D scene.',
    hi: 'कक्षा 10 भौतिकी का हर विषय रोज़मर्रा की ज़िंदगी की एक छोटी 3D कहानी के रूप में, आवाज़ और उपशीर्षक के साथ। हर कहानी के बाद उसी 3D दृश्य में ख़ुद प्रयोग कीजिए।',
    kn: '10ನೇ ತರಗತಿ ಭೌತಶಾಸ್ತ್ರದ ಪ್ರತಿ ವಿಷಯ ದೈನಂದಿನ ಜೀವನದ ಸಣ್ಣ 3D ಕಥೆಯಾಗಿ, ಧ್ವನಿ ಮತ್ತು ಉಪಶೀರ್ಷಿಕೆಯೊಂದಿಗೆ. ಪ್ರತಿ ಕಥೆಯ ನಂತರ ಅದೇ 3D ದೃಶ್ಯದಲ್ಲಿ ನೀವೇ ಪ್ರಯೋಗ ಮಾಡಿ.',
  },
  scenes: { en: 'scenes', hi: 'दृश्य', kn: 'ದೃಶ್ಯಗಳು' },
  watched: { en: 'Watched', hi: 'देखी', kn: 'ನೋಡಲಾಗಿದೆ' },
  mastery: { en: 'your mastery', hi: 'आपकी महारत', kn: 'ನಿಮ್ಮ ಪ್ರಾವೀಣ್ಯ' },
  watch: { en: 'Watch', hi: 'देखें', kn: 'ನೋಡಿ' },
};

interface Props {
  language: Language;
  lowPower?: boolean;
  onPractice?: (conceptId: string) => void;
}

export const StoryLibrary: React.FC<Props> = ({ language, lowPower, onPractice }) => {
  const L = (x: { en: string; hi: string; kn: string }) => x[language] || x.en;
  const [learner] = useLearner();
  const [watched, setWatched] = useState<string[]>(readWatched);
  const [openId, setOpenId] = useState<string | null>(() => {
    const m = window.location.hash.match(/^#story\/([\w-]+)/);
    return m && STORY_BY_ID[m[1]] ? m[1] : null;
  });

  useEffect(() => {
    const hash = openId ? `#story/${openId}` : '#stories';
    if (window.location.hash !== hash) window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
    window.scrollTo({ top: 0 });
  }, [openId]);

  const markWatched = (id: string) => {
    setWatched((w) => {
      if (w.includes(id)) return w;
      const next = [...w, id];
      try {
        localStorage.setItem(WATCHED_KEY, JSON.stringify(next));
      } catch {
        // storage blocked
      }
      return next;
    });
  };

  const mastery = useMemo(() => {
    const out: Record<string, number | null> = {};
    for (const s of STORIES) {
      const seen = s.concepts.filter((c) => learner.concepts[c]?.attempts > 0);
      out[s.id] = seen.length ? s.concepts.reduce((a, c) => a + effectiveMastery(learner.concepts[c]), 0) / s.concepts.length : null;
    }
    return out;
  }, [learner]);

  const open = openId ? STORY_BY_ID[openId] : null;
  if (open) {
    const i = STORIES.findIndex((s) => s.id === open.id);
    return (
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
        <StoryPlayer
          story={open}
          language={language}
          lowPower={lowPower}
          onBack={() => setOpenId(null)}
          onPractice={onPractice}
          onNext={i < STORIES.length - 1 ? () => setOpenId(STORIES[i + 1].id) : undefined}
          onWatched={markWatched}
        />
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-8" aria-labelledby="stories-title">
      <header className="space-y-2">
        <span className="inline-block -rotate-2 rounded-lg bg-[#FF5DA2] px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-white border-2 border-[#2E1A6E]">CBSE Class 10</span>
        <h2 id="stories-title" className="flex items-center gap-2 font-display text-3xl sm:text-4xl font-extrabold text-[#2E1A6E] dark:text-white">
          <Clapperboard className="w-8 h-8 text-[#6D28D9]" aria-hidden="true" /> {L(T.title)}
        </h2>
        <p className="max-w-3xl text-[#4A3F66] dark:text-[#E4DDFA]">{L(T.sub)}</p>
      </header>

      {CHAPTERS.map((ch) => (
        <div key={ch.key} className="space-y-3">
          <h3 className="font-display text-xl font-extrabold text-[#2E1A6E] dark:text-white">
            <span className="mr-2 rounded-md bg-[#2E1A6E] dark:bg-[#C4B5FD] px-2 py-0.5 text-sm text-white dark:text-[#140C2E]">{ch.ncert}</span>
            {L(ch.name)}
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            {STORIES.filter((s) => s.chapter === ch.key).map((s) => {
              const m = mastery[s.id];
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setOpenId(s.id)}
                  className="group text-left rounded-3xl border-2 border-[#2E1A6E] dark:border-[#C4B5FD] bg-white dark:bg-[#1F1545] overflow-hidden transition-transform hover:-translate-y-1"
                  style={{ boxShadow: `5px 5px 0 ${s.color}` }}
                >
                  <div className="flex items-center justify-between gap-3 px-5 py-3" style={{ background: s.color }}>
                    <span className="text-xs font-extrabold text-[#2E1A6E] bg-white/85 rounded-full px-2.5 py-0.5">
                      {s.beats.length} {L(T.scenes)} · 3D
                    </span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white border-2 border-[#2E1A6E] group-hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 text-[#2E1A6E] ml-0.5" aria-hidden="true" />
                    </span>
                  </div>
                  <div className="p-5 space-y-2">
                    <p className="font-display text-xl font-extrabold leading-tight text-[#2E1A6E] dark:text-white">{L(s.title)}</p>
                    <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{L(s.premise)}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {s.concepts.map((c) => (
                        <span key={c} className="rounded-full bg-[#F5F0FF] dark:bg-[#2A1D5C] px-2 py-0.5 text-[11px] font-bold text-[#5B21B6] dark:text-[#C4B5FD]">
                          {CONCEPT_BY_ID[c].name[language] || CONCEPT_BY_ID[c].name.en}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-1 text-xs font-bold">
                      {watched.includes(s.id) && (
                        <span className="inline-flex items-center gap-1 text-[#0E8A43] dark:text-[#6EE7A0]">
                          <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> {L(T.watched)}
                        </span>
                      )}
                      {m !== null && (
                        <span className="text-[#4A3F66] dark:text-[#C9BFEA]">
                          {Math.round(m * 100)}% {L(T.mastery)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
};
