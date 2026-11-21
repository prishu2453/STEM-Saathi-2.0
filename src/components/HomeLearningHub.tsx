import React from 'react';
import { ArrowRight, Atom, BookOpen, Calculator, FlaskConical, HardDriveDownload, Leaf, Sparkles } from 'lucide-react';
import type { Language, SupportingWorldId } from '../types/stem';
import { STATION_ORDER, type StationId } from '../sims/stationIds';

interface Props {
  language: Language;
  offlineCount: number;
  onOpenStation: (id: StationId) => void;
  onOpenPhysics: () => void;
  onOpenWorld: (world: SupportingWorldId) => void;
  onOpenTutor: () => void;
  onOpenResources: () => void;
  onOpenExperimentLibrary: () => void;
}

const L = (language: Language, en: string, hi: string, kn: string) => (language === 'hi' ? hi : language === 'kn' ? kn : en);

const STATION_TEXT: Record<StationId, { name: [string, string, string]; line: [string, string, string] }> = {
  pendulum: {
    name: ['Simple Pendulum', 'सरल लोलक', 'ಸರಳ ಲೋಲಕ'],
    line: ['Length, gravity and time period', 'लंबाई, गुरुत्व और आवर्तकाल', 'ಉದ್ದ, ಗುರುತ್ವ ಮತ್ತು ಆವರ್ತ ಕಾಲ'],
  },
  torricelli: {
    name: ["Torricelli's Principle", 'टॉरिसेली का सिद्धांत', 'ಟೊರಿಸೆಲ್ಲಿಯ ತತ್ವ'],
    line: ['Water jet speed from a tank', 'टंकी से पानी की धार की चाल', 'ತೊಟ್ಟಿಯಿಂದ ನೀರಿನ ಧಾರೆಯ ವೇಗ'],
  },
  bernoulli: {
    name: ["Bernoulli's Principle", 'बर्नौली का सिद्धांत', 'ಬರ್ನೌಲಿಯ ತತ್ವ'],
    line: ['Fast flow, low pressure', 'तेज़ प्रवाह, कम दाब', 'ವೇಗದ ಹರಿವು, ಕಡಿಮೆ ಒತ್ತಡ'],
  },
  'concave-mirror': {
    name: ['Concave Mirror', 'अवतल दर्पण', 'ನಿಮ್ನ ದರ್ಪಣ'],
    line: ['Real and virtual images', 'वास्तविक और आभासी प्रतिबिंब', 'ನೈಜ ಮತ್ತು ಮಿಥ್ಯ ಪ್ರತಿಬಿಂಬ'],
  },
  'convex-mirror': {
    name: ['Convex Mirror', 'उत्तल दर्पण', 'ಪೀನ ದರ್ಪಣ'],
    line: ['Small, upright, wide view', 'छोटा, सीधा, चौड़ा दृश्य', 'ಚಿಕ್ಕ, ನೇರ, ವಿಶಾಲ ನೋಟ'],
  },
};

/** Small line drawings so each experiment is recognisable at a glance. */
const StationIcon: React.FC<{ id: StationId }> = ({ id }) => {
  const common = { width: 56, height: 56, viewBox: '0 0 56 56', fill: 'none', stroke: 'currentColor', strokeWidth: 2, 'aria-hidden': true } as const;
  switch (id) {
    case 'pendulum':
      return (
        <svg {...common}>
          <line x1="14" y1="8" x2="42" y2="8" />
          <line x1="28" y1="8" x2="38" y2="38" />
          <circle cx="39" cy="42" r="5" fill="#F07C00" stroke="none" />
          <path d="M18 40 A 30 30 0 0 0 38 44" strokeDasharray="3 3" opacity="0.6" />
        </svg>
      );
    case 'torricelli':
      return (
        <svg {...common}>
          <rect x="8" y="10" width="18" height="38" rx="2" />
          <rect x="9" y="20" width="16" height="27" fill="#3B8BD4" stroke="none" opacity="0.5" />
          <path d="M26 36 Q 40 36 48 50" stroke="#2B7BD0" strokeWidth="2.5" />
        </svg>
      );
    case 'bernoulli':
      return (
        <svg {...common}>
          <path d="M4 18 H18 L24 24 H32 L38 18 H52" />
          <path d="M4 38 H18 L24 32 H32 L38 38 H52" />
          <path d="M8 28 H16 M26 28 H34 M42 28 H50" stroke="#6D28D9" strokeWidth="2.5" />
        </svg>
      );
    case 'concave-mirror':
      return (
        <svg {...common}>
          <path d="M40 8 Q 30 28 40 48" strokeWidth="3" stroke="#2C5F8A" />
          <line x1="4" y1="28" x2="52" y2="28" opacity="0.4" />
          <path d="M8 18 H36 L16 34" stroke="#D97706" />
        </svg>
      );
    case 'convex-mirror':
      return (
        <svg {...common}>
          <path d="M32 8 Q 42 28 32 48" strokeWidth="3" stroke="#2C5F8A" />
          <line x1="4" y1="28" x2="52" y2="28" opacity="0.4" />
          <path d="M6 18 H35 L10 8" stroke="#D97706" />
          <path d="M35 18 L48 28" stroke="#D97706" strokeDasharray="3 3" />
        </svg>
      );
  }
};

const card =
  'a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] transition-colors hover:border-[#6D28D9] text-left cursor-pointer';

export const HomeLearningHub: React.FC<Props> = ({
  language,
  offlineCount,
  onOpenStation,
  onOpenPhysics,
  onOpenWorld,
  onOpenTutor,
  onOpenResources,
  onOpenExperimentLibrary,
}) => {
  const i = language === 'hi' ? 1 : language === 'kn' ? 2 : 0;
  return (
    <div className="space-y-6">
      {/* 1. Physics World + experiments */}
      <section aria-labelledby="home-physics-lab" className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD]">
              {L(language, 'Physics World', 'भौतिकी जगत', 'ಭೌತಶಾಸ್ತ್ರ ಜಗತ್ತು')}
            </p>
            <h2 id="home-physics-lab" className="text-xl sm:text-2xl font-bold text-[#2E1A6E] dark:text-white">
              {L(language, 'Interactive Physics experiments', 'इंटरैक्टिव भौतिकी प्रयोग', 'ಸಂವಾದಾತ್ಮಕ ಭೌತಶಾಸ್ತ್ರ ಪ್ರಯೋಗಗಳು')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onOpenPhysics}
            className="inline-flex items-center gap-1.5 min-h-[44px] rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-2 text-sm font-semibold text-white"
          >
            <Atom className="w-4 h-4" aria-hidden="true" />
            {L(language, 'Open the full 3D lab', 'पूरी 3D लैब खोलें', 'ಪೂರ್ಣ 3D ಪ್ರಯೋಗಾಲಯ ತೆರೆಯಿರಿ')}
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {STATION_ORDER.map((sid) => (
            <li key={sid}>
              <button type="button" onClick={() => onOpenStation(sid)} className={`${card} w-full h-full p-3 flex flex-col gap-2`}>
                <span className="text-[#2E1A6E] dark:text-[#E4DDFA]">
                  <StationIcon id={sid} />
                </span>
                <span className="text-sm font-bold text-[#2E1A6E] dark:text-white leading-tight">{STATION_TEXT[sid].name[i]}</span>
                <span className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{STATION_TEXT[sid].line[i]}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* 2–6. Chemistry, Biology, Mathematics, AI Tutor, Resources */}
      <section aria-labelledby="home-more" className="space-y-3">
        <h2 id="home-more" className="text-lg font-bold text-[#2E1A6E] dark:text-white">
          {L(language, 'More to explore', 'और भी सीखें', 'ಇನ್ನಷ್ಟು ಅನ್ವೇಷಿಸಿ')}
        </h2>
        <ul className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {(
            [
              {
                key: 'chemistry',
                icon: <FlaskConical className="w-6 h-6 text-[#B45309]" aria-hidden="true" />,
                title: L(language, 'Chemistry', 'रसायन विज्ञान', 'ರಸಾಯನಶಾಸ್ತ್ರ'),
                line: L(language, 'Atoms, reactions and labs', 'परमाणु, अभिक्रियाएँ और प्रयोग', 'ಪರಮಾಣು, ಕ್ರಿಯೆಗಳು ಮತ್ತು ಪ್ರಯೋಗ'),
                go: () => onOpenWorld('chemistry'),
              },
              {
                key: 'biology',
                icon: <Leaf className="w-6 h-6 text-[#15803D]" aria-hidden="true" />,
                title: L(language, 'Biology', 'जीव विज्ञान', 'ಜೀವಶಾಸ್ತ್ರ'),
                line: L(language, 'Cells, plants and the body', 'कोशिका, पौधे और शरीर', 'ಕೋಶ, ಸಸ್ಯ ಮತ್ತು ದೇಹ'),
                go: () => onOpenWorld('biology'),
              },
              {
                key: 'mathematics',
                icon: <Calculator className="w-6 h-6 text-[#7C3AED]" aria-hidden="true" />,
                title: L(language, 'Mathematics', 'गणित', 'ಗಣಿತ'),
                line: L(language, 'Graphs, geometry and practice', 'ग्राफ़, ज्यामिति और अभ्यास', 'ಗ್ರಾಫ್, ರೇಖಾಗಣಿತ ಮತ್ತು ಅಭ್ಯಾಸ'),
                go: () => onOpenWorld('mathematics'),
              },
              {
                key: 'tutor',
                icon: <Sparkles className="w-6 h-6 text-[#6D28D9]" aria-hidden="true" />,
                title: L(language, 'AI Tutor', 'AI ट्यूटर', 'AI ಬೋಧಕ'),
                line: L(language, 'Ask any science doubt, by voice too', 'कोई भी शंका पूछें, आवाज़ से भी', 'ಯಾವುದೇ ಸಂದೇಹ ಕೇಳಿ, ಧ್ವನಿಯಲ್ಲೂ'),
                go: onOpenTutor,
              },
              {
                key: 'resources',
                icon: <HardDriveDownload className="w-6 h-6 text-[#2563EB]" aria-hidden="true" />,
                title: L(language, 'Learning resources', 'अध्ययन संसाधन', 'ಕಲಿಕಾ ಸಂಪನ್ಮೂಲಗಳು'),
                line: L(
                  language,
                  offlineCount > 0 ? `Offline packs (${offlineCount} saved), saved lessons` : 'Offline packs and saved lessons',
                  offlineCount > 0 ? `ऑफ़लाइन पैक (${offlineCount} सेव), सेव पाठ` : 'ऑफ़लाइन पैक और सेव पाठ',
                  offlineCount > 0 ? `ಆಫ್‌ಲೈನ್ ಪ್ಯಾಕ್ (${offlineCount} ಉಳಿಸಲಾಗಿದೆ), ಉಳಿಸಿದ ಪಾಠ` : 'ಆಫ್‌ಲೈನ್ ಪ್ಯಾಕ್ ಮತ್ತು ಉಳಿಸಿದ ಪಾಠ'
                ),
                go: onOpenResources,
              },
            ] as const
          ).map((c) => (
            <li key={c.key} className={c.key === 'resources' ? 'col-span-2 lg:col-span-1' : ''}>
              <button type="button" onClick={c.go} className={`${card} w-full h-full p-3.5 flex flex-col gap-1.5`}>
                {c.icon}
                <span className="text-sm font-bold text-[#2E1A6E] dark:text-white">{c.title}</span>
                <span className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{c.line}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={onOpenExperimentLibrary}
          className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD] underline"
        >
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          {L(
            language,
            'Experiment library — every chapter experiment in one place',
            'प्रयोग पुस्तकालय — हर अध्याय का प्रयोग एक जगह',
            'ಪ್ರಯೋಗ ಗ್ರಂಥಾಲಯ — ಪ್ರತಿ ಅಧ್ಯಾಯದ ಪ್ರಯೋಗ ಒಂದೇ ಕಡೆ'
          )}
        </button>
      </section>
    </div>
  );
};

export default HomeLearningHub;
