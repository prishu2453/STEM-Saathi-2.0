import React, { useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { ALL_SYLLABUS_RECORDS } from '../../shared/syllabus/index';
import { COVERAGE_CLASSES, COVERAGE_SUBJECTS, coverageSummary, getCoverage, STATUS_EXPLAIN, STATUS_TEXT, type CoverageStatus, type CoverageSubject } from '../lib/coverage';
import { EXPERIMENT_VIDEOS } from '../data/experimentVideos';
import { videoStats } from '../lib/videoCheck';
import { StatusChip, STATUS_STYLE } from './CoverageNotice';
import { PilotFeedback } from './PilotFeedback';
import type { EducationBoard, Language } from '../types/stem';

const L = {
  title: { en: 'Syllabus coverage and trust', hi: 'पाठ्यक्रम कवरेज और विश्वसनीयता', kn: 'ಪಠ್ಯಕ್ರಮ ವ್ಯಾಪ್ತಿ ಮತ್ತು ವಿಶ್ವಾಸಾರ್ಹತೆ' },
  intro: { en: 'What this app covers today, class by class. Nothing here is marked “verified” until a named teacher has checked it against the official syllabus.', hi: 'आज यह ऐप कक्षा-दर-कक्षा क्या कवर करता है। कोई भी चीज़ तब तक “सत्यापित” नहीं जब तक नामित शिक्षक उसे आधिकारिक पाठ्यक्रम से न मिलाए।', kn: 'ಈ ಆ್ಯಪ್ ಇಂದು ತರಗತಿಯಾರು ಏನು ಒಳಗೊಂಡಿದೆ. ಹೆಸರಿಸಿದ ಶಿಕ್ಷಕರು ಅಧಿಕೃತ ಪಠ್ಯಕ್ರಮದೊಂದಿಗೆ ಹೋಲಿಸುವವರೆಗೆ ಇಲ್ಲಿ ಯಾವುದೂ “ಪರಿಶೀಲಿತ” ಅಲ್ಲ.' },
  board: { en: 'Board', hi: 'बोर्ड', kn: 'ಮಂಡಳಿ' },
  cls: { en: 'Class', hi: 'कक्षा', kn: 'ತರಗತಿ' },
  chapters: { en: 'chapters', hi: 'अध्याय', kn: 'ಅಧ್ಯಾಯ' },
  videosTitle: { en: 'Experiment videos', hi: 'प्रयोग के वीडियो', kn: 'ಪ್ರಯೋಗ ವೀಡಿಯೊ' },
  videosText: { en: 'verified videos registered out of', hi: 'सत्यापित वीडियो दर्ज, कुल', kn: 'ಪರಿಶೀಲಿತ ವೀಡಿಯೊ ದಾಖಲು, ಒಟ್ಟು' },
  videosHow: { en: 'A video is shown only if a person has watched it, named themselves, and matched it to the experiment, class and board. Add entries in src/data/experimentVideos.ts, then run “npm run check:videos”.', hi: 'वीडियो तभी दिखता है जब किसी व्यक्ति ने उसे देखा, अपना नाम दिया और उसे प्रयोग, कक्षा व बोर्ड से मिलाया। src/data/experimentVideos.ts में प्रविष्टि जोड़ें, फिर “npm run check:videos” चलाएँ।', kn: 'ವ್ಯಕ್ತಿಯೊಬ್ಬರು ವೀಡಿಯೊ ನೋಡಿ, ಹೆಸರು ನೀಡಿ, ಪ್ರಯೋಗ, ತರಗತಿ ಮತ್ತು ಮಂಡಳಿಗೆ ಹೋಲಿಸಿದರೆ ಮಾತ್ರ ಅದು ಕಾಣಿಸುತ್ತದೆ. src/data/experimentVideos.ts ನಲ್ಲಿ ಸೇರಿಸಿ, ನಂತರ “npm run check:videos” ಓಡಿಸಿ.' },
};
const SUBJ: Record<CoverageSubject, Record<Language, string>> = {
  physics: { en: 'Physics', hi: 'भौतिकी', kn: 'ಭೌತಶಾಸ್ತ್ರ' },
  chemistry: { en: 'Chemistry', hi: 'रसायन', kn: 'ರಸಾಯನಶಾಸ್ತ್ರ' },
  biology: { en: 'Biology', hi: 'जीव विज्ञान', kn: 'ಜೀವಶಾಸ್ತ್ರ' },
  mathematics: { en: 'Mathematics', hi: 'गणित', kn: 'ಗಣಿತ' },
};

export const CoverageOverview: React.FC<{ language: Language }> = ({ language }) => {
  const states = useMemo(() => Array.from(new Set(ALL_SYLLABUS_RECORDS.filter((r) => r.board === 'state').map((r) => r.stateName!))), []);
  const options = [{ key: 'cbse', board: 'cbse' as EducationBoard, label: 'CBSE (NCERT)' }, { key: 'cisce', board: 'cisce' as EducationBoard, label: 'ICSE / ISC' }, ...states.map((s) => ({ key: `state:${s}`, board: 'state' as EducationBoard, state: s, label: `${s} State Board` }))];
  const [sel, setSel] = useState(options[0].key);
  const [subject, setSubject] = useState<CoverageSubject>('physics');
  const opt = options.find((o) => o.key === sel)!;
  const summary = useMemo(() => coverageSummary(), []);
  const vs = videoStats(EXPERIMENT_VIDEOS);
  const field = 'mt-1 block w-full min-h-[44px] rounded-xl border border-[#B6A6E0] bg-white dark:bg-[#2A1D5C] px-3 text-sm';

  return (
    <section className="mx-auto max-w-5xl px-4 sm:px-6 py-6 space-y-6" aria-labelledby="cov-title">
      <div>
        <h1 id="cov-title" className="text-2xl sm:text-3xl font-bold text-[#2E1A6E] dark:text-white">{L.title[language]}</h1>
        <p className="mt-1 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{L.intro[language]}</p>
      </div>

      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-label="Totals across all boards, classes and subjects">
        {(['verified', 'list-covered', 'partial', 'preparing'] as CoverageStatus[]).map((s) => (
          <li key={s} className="rounded-xl border p-3" style={{ background: STATUS_STYLE[s].bg, color: STATUS_STYLE[s].fg, borderColor: STATUS_STYLE[s].border }}>
            <div className="text-2xl font-bold tabular-nums">{summary[s]}</div>
            <div className="text-xs font-semibold">{STATUS_TEXT[s][language]}</div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{STATUS_EXPLAIN['list-covered'][language]}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">{L.board[language]}
          <select value={sel} onChange={(e) => setSel(e.target.value)} className={field}>{options.map((o) => (<option key={o.key} value={o.key}>{o.label}</option>))}</select>
        </label>
        <label className="text-sm font-semibold">Subject
          <select value={subject} onChange={(e) => setSubject(e.target.value as CoverageSubject)} className={field}>{COVERAGE_SUBJECTS.map((s) => (<option key={s} value={s}>{SUBJ[s][language]}</option>))}</select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545]">
        <table className="w-full text-sm">
          <caption className="sr-only">{opt.label} — {SUBJ[subject][language]}</caption>
          <thead>
            <tr className="text-left text-xs text-[#4A3F66] dark:text-[#C9BFEA] border-b border-[#E7DDFB] dark:border-[#3B2C78]">
              <th scope="col" className="p-3">{L.cls[language]}</th>
              <th scope="col" className="p-3">Status</th>
              <th scope="col" className="p-3">{L.chapters[language]}</th>
              <th scope="col" className="p-3">Session · source</th>
            </tr>
          </thead>
          <tbody>
            {COVERAGE_CLASSES.map((c) => {
              const cov = getCoverage(c, opt.board, (opt as { state?: string }).state, subject);
              return (
                <tr key={c} className="border-b last:border-0 border-[#E7DDFB] dark:border-[#3B2C78] align-top">
                  <th scope="row" className="p-3 font-semibold">{c}</th>
                  <td className="p-3"><StatusChip status={cov.status} language={language} /></td>
                  <td className="p-3 tabular-nums">
                    {cov.chaptersCovered}{cov.chaptersOfficial ? ` / ${cov.chaptersOfficial}` : ''}
                    {cov.missingTitles.length > 0 && <div className="mt-1 text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{cov.missingTitles.slice(0, 4).join(' · ')}{cov.missingTitles.length > 4 ? ' …' : ''}</div>}
                  </td>
                  <td className="p-3 text-xs">
                    {cov.session ?? '—'}
                    {cov.source && (<><br /><a href={cov.source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline text-[#5B21B6] dark:text-[#C4B5FD]">{cov.source.title}<ExternalLink className="w-3 h-3" aria-hidden="true" /></a></>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <section aria-labelledby="vid-title" className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-2">
        <h2 id="vid-title" className="text-lg font-bold text-[#2E1A6E] dark:text-white">{L.videosTitle[language]}</h2>
        <p className="text-3xl font-bold tabular-nums text-[#2E1A6E] dark:text-white">{vs.verifiedVideos}<span className="text-base font-semibold text-[#4A3F66] dark:text-[#C9BFEA]"> {L.videosText[language]} {vs.totalExperiments}</span></p>
        <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{L.videosHow[language]}</p>
      </section>

      <PilotFeedback language={language} />
    </section>
  );
};
