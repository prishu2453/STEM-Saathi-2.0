import React from 'react';
import { AlertCircle, CheckCircle2, Clock, ExternalLink, ShieldCheck } from 'lucide-react';
import { getCoverage, STATUS_EXPLAIN, STATUS_TEXT, type CoverageSubject, type CoverageStatus } from '../lib/coverage';
import type { EducationBoard, Language, SchoolClass } from '../types/stem';

export const STATUS_STYLE: Record<CoverageStatus, { bg: string; fg: string; border: string }> = {
  verified: { bg: '#DCFCE7', fg: '#14532D', border: '#16A34A' },
  'list-covered': { bg: '#EFE7FF', fg: '#5B21B6', border: '#6D28D9' },
  partial: { bg: '#FEF3C7', fg: '#7A4B00', border: '#F07C00' },
  preparing: { bg: '#E5E7EB', fg: '#374151', border: '#9CA3AF' },
};
const ICON: Record<CoverageStatus, React.ReactNode> = {
  verified: <ShieldCheck className="w-4 h-4" aria-hidden="true" />,
  'list-covered': <CheckCircle2 className="w-4 h-4" aria-hidden="true" />,
  partial: <AlertCircle className="w-4 h-4" aria-hidden="true" />,
  preparing: <Clock className="w-4 h-4" aria-hidden="true" />,
};

export const StatusChip: React.FC<{ status: CoverageStatus; language: Language }> = ({ status, language }) => (
  <span
    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold"
    style={{ background: STATUS_STYLE[status].bg, color: STATUS_STYLE[status].fg, borderColor: STATUS_STYLE[status].border }}
  >
    {ICON[status]}
    {STATUS_TEXT[status][language]}
  </span>
);

interface Props {
  classLevel: SchoolClass;
  board: EducationBoard;
  stateName?: string;
  subject: CoverageSubject;
  language: Language;
}

const L = {
  chapters: { en: 'chapters in the app', hi: 'अध्याय ऐप में', kn: 'ಅಧ್ಯಾಯಗಳು ಆ್ಯಪ್‌ನಲ್ಲಿ' },
  of: { en: 'of', hi: 'में से', kn: 'ರಲ್ಲಿ' },
  official: { en: 'in the official list held here', hi: 'यहाँ रखी आधिकारिक सूची में', kn: 'ಇಲ್ಲಿರುವ ಅಧಿಕೃತ ಪಟ್ಟಿಯಲ್ಲಿ' },
  still: { en: 'Still to add', hi: 'जोड़ना बाकी', kn: 'ಸೇರಿಸಲು ಬಾಕಿ' },
  source: { en: 'Source', hi: 'स्रोत', kn: 'ಮೂಲ' },
  session: { en: 'Session', hi: 'सत्र', kn: 'ಅವಧಿ' },
  dataDate: { en: 'Data date in project', hi: 'परियोजना में डेटा की तिथि', kn: 'ಯೋಜನೆಯಲ್ಲಿ ದತ್ತಾಂಶ ದಿನಾಂಕ' },
  checkedBy: { en: 'Checked by', hi: 'जाँचकर्ता', kn: 'ಪರಿಶೀಲಿಸಿದವರು' },
  noList: { en: 'The official chapter count for this selection is not recorded yet, so completeness cannot be judged.', hi: 'इस चयन की आधिकारिक अध्याय संख्या अभी दर्ज नहीं है, इसलिए पूर्णता नहीं आँकी जा सकती।', kn: 'ಈ ಆಯ್ಕೆಯ ಅಧಿಕೃತ ಅಧ್ಯಾಯ ಸಂಖ್ಯೆ ಇನ್ನೂ ದಾಖಲಾಗಿಲ್ಲ, ಆದ್ದರಿಂದ ಪೂರ್ಣತೆ ಅಳೆಯಲಾಗದು.' },
};

/** Honest status of the selected class + board + subject, with source and session. */
export const CoverageNotice: React.FC<Props> = ({ classLevel, board, stateName, subject, language }) => {
  const c = getCoverage(classLevel, board, stateName, subject);
  const st = STATUS_STYLE[c.status];
  return (
    <section
      aria-label={STATUS_TEXT[c.status][language]}
      className="rounded-xl border-l-4 bg-white dark:bg-[#1F1545] border border-[#E7DDFB] dark:border-[#3B2C78] p-3.5 space-y-2"
      style={{ borderLeftColor: st.border }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={c.status} language={language} />
        <span className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
          {c.chaptersCovered} {c.chaptersOfficial ? `${L.of[language]} ${c.chaptersOfficial} ${L.official[language]}` : L.chapters[language]}
        </span>
      </div>
      <p className="text-xs leading-relaxed text-[#22163F] dark:text-[#E4DDFA]">{STATUS_EXPLAIN[c.status][language]}</p>
      {c.chaptersOfficial === undefined && c.status !== 'preparing' && <p className="text-xs text-[#7A4B00] dark:text-[#FF9F1C]">{L.noList[language]}</p>}
      {c.missingTitles.length > 0 && (
        <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
          <strong>{L.still[language]}:</strong> {c.missingTitles.join(' · ')}
        </p>
      )}
      {c.verification && (
        <p className="text-xs text-[#14532D] dark:text-[#86EFAC]">
          <strong>{L.checkedBy[language]}:</strong> {c.verification.by} ({c.verification.role}), {c.verification.on} — {c.verification.checkedAgainst}
        </p>
      )}
      {(c.source || c.session) && (
        <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] flex flex-wrap items-center gap-x-3 gap-y-1">
          {c.session && <span>{L.session[language]}: {c.session}</span>}
          {c.dataDate && <span>{L.dataDate[language]}: {c.dataDate}</span>}
          {c.source && (
            <a href={c.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 min-h-[44px] underline text-[#5B21B6] dark:text-[#C4B5FD]">
              {L.source[language]}: {c.source.title}
              <ExternalLink className="w-3 h-3" aria-hidden="true" />
            </a>
          )}
        </p>
      )}
    </section>
  );
};
