import React, { useState } from 'react';
import { Atom, ChevronDown, ChevronUp } from 'lucide-react';
import { getLabSim, simsForChapter } from '../sims/registry';
import { LabSimulation } from '../sims/LabSimulation';
import { SIM_EXPLANATIONS } from '../data/simExplanations';
import { EXPERIMENT_DEFINITIONS } from '../data/physicsExperiments';
import { InlineSimulation } from './InlineSimulation';
import type { Language } from '../types/stem';

const T = {
  heading: { en: 'Simulations for this chapter', hi: 'इस अध्याय के सिमुलेशन', kn: 'ಈ ಅಧ್ಯಾಯದ ಸಿಮ್ಯುಲೇಶನ್' },
  open: { en: 'Open', hi: 'खोलें', kn: 'ತೆರೆಯಿರಿ' },
  hide: { en: 'Hide', hi: 'छिपाएँ', kn: 'ಮರೆಮಾಡಿ' },
  none: { en: 'No simulation is available for this topic yet.', hi: 'इस विषय के लिए अभी कोई सिमुलेशन उपलब्ध नहीं है।', kn: 'ಈ ವಿಷಯಕ್ಕೆ ಇನ್ನೂ ಸಿಮ್ಯುಲೇಶನ್ ಲಭ್ಯವಿಲ್ಲ.' },
  note: { en: 'Interactive — change the settings, pause and reset.', hi: 'इंटरैक्टिव — सेटिंग बदलें, रोकें और रीसेट करें।', kn: 'ಸಂವಾದಾತ್ಮಕ — ಸೆಟ್ಟಿಂಗ್ ಬದಲಿಸಿ, ನಿಲ್ಲಿಸಿ, ರೀಸೆಟ್ ಮಾಡಿ.' },
};

interface Props {
  chapterId: string;
  titleEn: string;
  subject: string;
  language: Language;
}

export const ChapterSimulations: React.FC<Props> = ({ chapterId, titleEn, subject, language }) => {
  const [openKey, setOpenKey] = useState<string | null>(null);
  if (subject !== 'physics') return null;
  const refs = simsForChapter(titleEn, chapterId);

  return (
    <section aria-label={T.heading[language]} className="rounded-2xl border border-[#6D28D9]/40 bg-white dark:bg-[#1F1545] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Atom className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" />
        <h3 className="text-base font-bold text-[#2E1A6E] dark:text-white">{T.heading[language]}</h3>
      </div>
      {refs.length === 0 ? (
        <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{T.none[language]}</p>
      ) : (
        <>
          <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{T.note[language]}</p>
          <ul className="space-y-3">
            {refs.map((r) => {
              const key = `${r.kind}:${r.id}`;
              const lab = r.kind === 'lab' ? getLabSim(r.id) : undefined;
              const title =
                lab?.title[language] ?? EXPERIMENT_DEFINITIONS.find((d) => d.id === r.id)?.title[language] ?? r.id;
              if (r.kind === 'lab' && !lab) return null;
              if (r.kind === 'legacy' && !SIM_EXPLANATIONS[r.id]) return null;
              const isOpen = openKey === key;
              return (
                <li key={key} className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78]">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenKey(isOpen ? null : key)}
                    className="w-full min-h-[52px] flex items-center justify-between gap-3 px-4 text-left text-sm font-semibold text-[#2E1A6E] dark:text-white cursor-pointer"
                  >
                    <span>{title}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-[#5B21B6] dark:text-[#C4B5FD]">
                      {isOpen ? T.hide[language] : T.open[language]}
                      {isOpen ? <ChevronUp className="w-4 h-4" aria-hidden="true" /> : <ChevronDown className="w-4 h-4" aria-hidden="true" />}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4">
                      {lab ? <LabSimulation key={lab.id} def={lab} language={language} /> : <InlineSimulation experimentId={r.id as never} language={language} />}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
};
