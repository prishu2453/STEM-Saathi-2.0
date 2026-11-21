import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, FlaskConical, HelpCircle, HardDriveDownload, ListChecks, XCircle } from 'lucide-react';
import { findBoardRecord, getChapterById } from '../../shared/syllabus/index';
import type { RichChapterData } from '../../shared/syllabus/types';
import { findSyllabusCatalogue, resolveLocalizedList, resolveLocalizedText } from '../data/curriculumCatalogue';
import { downloadCurriculumChapterPack, estimateCurriculumChapterPackBytes, formatBytes } from '../lib/offlineStore';
import { useSpeech } from '../hooks/useSpeech';
import { ChapterSimulations } from './ChapterSimulations';
import { CoverageNotice } from './CoverageNotice';
import { ExperimentVideo } from './ExperimentVideo';
import type { EducationBoard, Language, LearningPathPreference, OfflinePackMeta, SchoolClass } from '../types/stem';

type L3 = Record<Language, string>;
const T: Record<string, L3> = {
  title: { en: 'Learning journey (3-minute demo)', hi: 'सीखने की यात्रा (3 मिनट का डेमो)', kn: 'ಕಲಿಕೆಯ ಪ್ರಯಾಣ (3 ನಿಮಿಷದ ಡೆಮೊ)' },
  intro: { en: 'Follow six steps with real lessons from this project. Every step uses the chapter you choose.', hi: 'इस परियोजना के असली पाठों के साथ छह चरण। हर चरण आपके चुने अध्याय का उपयोग करता है।', kn: 'ಈ ಯೋಜನೆಯ ನಿಜ ಪಾಠಗಳೊಂದಿಗೆ ಆರು ಹಂತ. ಪ್ರತಿ ಹಂತ ನೀವು ಆರಿಸಿದ ಅಧ್ಯಾಯ ಬಳಸುತ್ತದೆ.' },
  s1: { en: 'Class and board', hi: 'कक्षा और बोर्ड', kn: 'ತರಗತಿ ಮತ್ತು ಮಂಡಳಿ' },
  s2: { en: 'Topic', hi: 'विषय', kn: 'ವಿಷಯ' },
  s3: { en: 'Learn', hi: 'सीखें', kn: 'ಕಲಿಯಿರಿ' },
  s4: { en: 'Try it', hi: 'करके देखें', kn: 'ಪ್ರಯತ್ನಿಸಿ' },
  s5: { en: 'Check', hi: 'जाँचें', kn: 'ಪರೀಕ್ಷಿಸಿ' },
  s6: { en: 'Save offline', hi: 'ऑफ़लाइन सहेजें', kn: 'ಆಫ್‌ಲೈನ್ ಉಳಿಸಿ' },
  cls: { en: 'Class', hi: 'कक्षा', kn: 'ತರಗತಿ' },
  board: { en: 'Board', hi: 'बोर्ड', kn: 'ಮಂಡಳಿ' },
  state: { en: 'State', hi: 'राज्य', kn: 'ರಾಜ್ಯ' },
  physics: { en: 'Subject: Physics (the most complete subject so far)', hi: 'विषय: भौतिकी (अब तक सबसे पूर्ण)', kn: 'ವಿಷಯ: ಭೌತಶಾಸ್ತ್ರ (ಇಲ್ಲಿಯವರೆಗೆ ಅತ್ಯಂತ ಪೂರ್ಣ)' },
  quick: { en: 'Quick start: Class 9 · CBSE · Force and Laws of Motion', hi: 'त्वरित शुरुआत: कक्षा 9 · CBSE · बल तथा गति के नियम', kn: 'ತ್ವರಿತ ಆರಂಭ: ತರಗತಿ 9 · CBSE · ಬಲ ಮತ್ತು ಚಲನೆಯ ನಿಯಮಗಳು' },
  pick: { en: 'Choose a chapter', hi: 'अध्याय चुनें', kn: 'ಅಧ್ಯಾಯ ಆರಿಸಿ' },
  noChapters: { en: 'No Physics lessons for this class and board yet. Choose another.', hi: 'इस कक्षा और बोर्ड के लिए अभी भौतिकी के पाठ नहीं। दूसरा चुनें।', kn: 'ಈ ತರಗತಿ ಮತ್ತು ಮಂಡಳಿಗೆ ಇನ್ನೂ ಭೌತಶಾಸ್ತ್ರ ಪಾಠವಿಲ್ಲ. ಇನ್ನೊಂದು ಆರಿಸಿ.' },
  idea: { en: 'The big idea', hi: 'मुख्य विचार', kn: 'ಮುಖ್ಯ ಕಲ್ಪನೆ' },
  words: { en: 'Key words', hi: 'मुख्य शब्द', kn: 'ಮುಖ್ಯ ಪದಗಳು' },
  formula: { en: 'Formula', hi: 'सूत्र', kn: 'ಸೂತ್ರ' },
  listen: { en: 'Listen', hi: 'सुनें', kn: 'ಕೇಳಿ' },
  exp: { en: 'Experiment', hi: 'प्रयोग', kn: 'ಪ್ರಯೋಗ' },
  need: { en: 'You need', hi: 'सामग्री', kn: 'ಬೇಕಾದದ್ದು' },
  steps: { en: 'Steps', hi: 'चरण', kn: 'ಹಂತಗಳು' },
  safety: { en: 'Safety', hi: 'सावधानी', kn: 'ಸುರಕ್ಷತೆ' },
  noExp: { en: 'This chapter has no experiment recorded yet.', hi: 'इस अध्याय का प्रयोग अभी दर्ज नहीं।', kn: 'ಈ ಅಧ್ಯಾಯದ ಪ್ರಯೋಗ ಇನ್ನೂ ದಾಖಲಾಗಿಲ್ಲ.' },
  q: { en: 'One question', hi: 'एक प्रश्न', kn: 'ಒಂದು ಪ್ರಶ್ನೆ' },
  right: { en: 'Correct!', hi: 'सही!', kn: 'ಸರಿ!' },
  wrong: { en: 'Not quite. The answer is', hi: 'ठीक नहीं। उत्तर है', kn: 'ಸರಿಯಲ್ಲ. ಉತ್ತರ' },
  noQ: { en: 'This chapter has no quiz question recorded yet.', hi: 'इस अध्याय का प्रश्न अभी दर्ज नहीं।', kn: 'ಈ ಅಧ್ಯಾಯದ ಪ್ರಶ್ನೆ ಇನ್ನೂ ದಾಖಲಾಗಿಲ್ಲ.' },
  save: { en: 'Save this lesson for offline study', hi: 'इस पाठ को ऑफ़लाइन अध्ययन के लिए सहेजें', kn: 'ಈ ಪಾಠವನ್ನು ಆಫ್‌ಲೈನ್ ಅಧ್ಯಯನಕ್ಕೆ ಉಳಿಸಿ' },
  size: { en: 'Download size', hi: 'डाउनलोड आकार', kn: 'ಡೌನ್‌ಲೋಡ್ ಗಾತ್ರ' },
  saving: { en: 'Saving…', hi: 'सहेज रहे हैं…', kn: 'ಉಳಿಸುತ್ತಿದೆ…' },
  savedOk: { en: 'Saved on this device. It now opens without internet.', hi: 'इस फ़ोन में सहेजा गया। अब यह बिना इंटरनेट खुलता है।', kn: 'ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿದಿದೆ. ಈಗ ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ ತೆರೆಯುತ್ತದೆ.' },
  failed: { en: 'Could not save. Storage may be full or blocked.', hi: 'सहेज नहीं सके। स्टोरेज भरा या बंद हो सकता है।', kn: 'ಉಳಿಸಲಾಗಲಿಲ್ಲ. ಸಂಗ್ರಹಣೆ ತುಂಬಿರಬಹುದು ಅಥವಾ ನಿರ್ಬಂಧಿತ.' },
  seeSaved: { en: 'See saved lessons', hi: 'सहेजे पाठ देखें', kn: 'ಉಳಿಸಿದ ಪಾಠ ನೋಡಿ' },
  fullChapter: { en: 'Open the full chapter', hi: 'पूरा अध्याय खोलें', kn: 'ಪೂರ್ಣ ಅಧ್ಯಾಯ ತೆರೆಯಿರಿ' },
  back: { en: 'Back', hi: 'पीछे', kn: 'ಹಿಂದೆ' },
  next: { en: 'Next', hi: 'आगे', kn: 'ಮುಂದೆ' },
  draft: { en: 'Draft content: lessons are not yet checked by a teacher.', hi: 'प्रारूप सामग्री: पाठों की शिक्षक द्वारा जाँच बाकी है।', kn: 'ಕರಡು ವಿಷಯ: ಪಾಠಗಳನ್ನು ಶಿಕ್ಷಕರು ಇನ್ನೂ ಪರಿಶೀಲಿಸಿಲ್ಲ.' },
};
const STEP_ICONS = [ListChecks, BookOpen, BookOpen, FlaskConical, HelpCircle, HardDriveDownload];

interface Props {
  language: Language;
  path: LearningPathPreference;
  onPathChange: (p: LearningPathPreference) => void;
  onPacksChanged: () => void;
  onOpenSaved: () => void;
  onOpenChapter: (chapterId: string) => void;
}

const BOARDS: { id: EducationBoard; label: string }[] = [
  { id: 'cbse', label: 'CBSE (NCERT)' },
  { id: 'cisce', label: 'ICSE / ISC' },
  { id: 'state', label: 'State board' },
];
const STATES = ['Karnataka', 'Maharashtra', 'Bihar', 'Telangana', 'Andhra Pradesh', 'Tamil Nadu', 'Kerala', 'Uttar Pradesh', 'West Bengal', 'Madhya Pradesh'];

export const DemoJourney: React.FC<Props> = ({ language, path, onPathChange, onPacksChanged, onOpenSaved, onOpenChapter }) => {
  const [step, setStep] = useState(0);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [answer, setAnswer] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'ok' | 'fail'>('idle');
  const [savedMeta, setSavedMeta] = useState<OfflinePackMeta | null>(null);
  const t = (k: string) => T[k][language];
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);

  const record = useMemo(() => findBoardRecord(path.classLevel, path.board, path.stateName, path.session), [path]);
  const physics = useMemo(() => (record ? record.chapters.filter((c) => c.primarySubject === 'physics') : []), [record]);
  const chapter: RichChapterData | null = useMemo(() => (chapterId ? getChapterById(chapterId)?.chapter ?? null : null), [chapterId]);

  const update = (patch: Partial<LearningPathPreference>) => {
    onPathChange({ ...path, subject: 'physics', configured: true, ...patch });
    setChapterId(null);
    setAnswer(null);
    setSaveState('idle');
    setSavedMeta(null);
  };

  const quick = () => {
    onPathChange({ ...path, classLevel: 9, board: 'cbse', stateName: '', session: '2025-26', subject: 'physics', configured: true });
    setChapterId('cbse9-phy-force');
    setAnswer(null);
    setSaveState('idle');
    setSavedMeta(null);
    setStep(2);
  };

  const chooseChapter = (id: string) => {
    setChapterId(id);
    setAnswer(null);
    setSaveState('idle');
    setSavedMeta(null);
    setStep(2);
  };

  const catalogueChapter = useMemo(() => {
    if (!chapter) return null;
    const cat = findSyllabusCatalogue({ ...path, subject: 'physics' });
    return cat ? { cat, ch: cat.chapters.find((c) => c.id === chapter.id) ?? null } : null;
  }, [chapter, path]);

  const packParams = catalogueChapter?.ch
    ? {
        chapter: catalogueChapter.ch,
        classLevel: path.classLevel,
        board: path.board,
        stateName: path.stateName,
        session: path.session,
        language,
        sourceTitle: catalogueChapter.cat.sourceTitle,
        sourceUrl: catalogueChapter.cat.sourceUrl,
      }
    : null;
  const sizeBytes = packParams ? estimateCurriculumChapterPackBytes(packParams) : 0;

  const doSave = async () => {
    if (!packParams) return;
    setSaveState('saving');
    try {
      const meta = await downloadCurriculumChapterPack(packParams);
      setSavedMeta(meta);
      setSaveState('ok');
      onPacksChanged();
    } catch {
      setSaveState('fail');
    }
  };

  const titleOf = (c: RichChapterData) => resolveLocalizedText(c.title, language).text;
  const steps = [t('s1'), t('s2'), t('s3'), t('s4'), t('s5'), t('s6')];
  const canNext = step === 0 ? physics.length > 0 : step === 1 ? Boolean(chapter) : true;
  const btn = 'min-h-[48px] rounded-xl border px-4 text-sm font-semibold cursor-pointer';
  const exp = chapter?.experiments[0];
  const mcq = chapter?.mcqs[0];
  const mcqOpts = mcq ? resolveLocalizedList(mcq.options, language).items : [];

  return (
    <section className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5" aria-labelledby="demo-title">
      <div>
        <h1 id="demo-title" className="text-2xl sm:text-3xl font-bold text-[#2E1A6E] dark:text-white">{t('title')}</h1>
        <p className="mt-1 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('intro')}</p>
        <button type="button" onClick={quick} className={`${btn} mt-3 bg-[#2E1A6E] text-white border-transparent`}>{t('quick')}</button>
      </div>

      <nav aria-label="Steps">
        <ol className="grid grid-cols-6 gap-1.5">
          {steps.map((s, i) => {
            const Icon = STEP_ICONS[i];
            const active = i === step;
            return (
              <li key={s}>
                <button
                  type="button"
                  onClick={() => (i <= 1 || chapter) && setStep(i)}
                  aria-current={active ? 'step' : undefined}
                  className={`w-full min-h-[56px] rounded-xl border px-1 py-1.5 text-[11px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                    active ? 'bg-[#6D28D9] text-white border-[#6D28D9]' : i < step ? 'bg-[#EFE7FF] dark:bg-[#6D28D9]/25 text-[#5B21B6] dark:text-[#C4B5FD] border-[#6D28D9]/40' : 'bg-white dark:bg-[#1F1545] text-[#4A3F66] dark:text-[#C9BFEA] border-[#E7DDFB] dark:border-[#3B2C78]'
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{i + 1}. {s}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-6 space-y-4" aria-live="polite">
        {step === 0 && (
          <>
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">1. {t('s1')}</h2>
            <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{t('physics')}</p>
            <fieldset>
              <legend className="text-sm font-semibold mb-2">{t('cls')}</legend>
              <div className="flex flex-wrap gap-2">
                {([6, 7, 8, 9, 10, 11, 12] as SchoolClass[]).map((c) => (
                  <button key={c} type="button" aria-pressed={path.classLevel === c} onClick={() => update({ classLevel: c })} className={`min-w-[52px] ${btn} ${path.classLevel === c ? 'bg-[#6D28D9] text-white border-[#6D28D9]' : 'border-[#B6A6E0] text-[#2E1A6E] dark:text-white'}`}>{c}</button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-semibold mb-2">{t('board')}</legend>
              <div className="flex flex-wrap gap-2">
                {BOARDS.map((b) => (
                  <button key={b.id} type="button" aria-pressed={path.board === b.id} onClick={() => update({ board: b.id, stateName: b.id === 'state' ? path.stateName || 'Karnataka' : '' })} className={`${btn} ${path.board === b.id ? 'bg-[#6D28D9] text-white border-[#6D28D9]' : 'border-[#B6A6E0] text-[#2E1A6E] dark:text-white'}`}>{b.label}</button>
                ))}
              </div>
            </fieldset>
            {path.board === 'state' && (
              <label className="block text-sm font-semibold">
                {t('state')}
                <select value={path.stateName} onChange={(e) => update({ stateName: e.target.value })} className="mt-1 block w-full min-h-[48px] rounded-xl border border-[#B6A6E0] bg-white dark:bg-[#2A1D5C] px-3">
                  {STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </label>
            )}
            <CoverageNotice classLevel={path.classLevel} board={path.board} stateName={path.stateName} subject="physics" language={language} />
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">2. {t('pick')}</h2>
            {physics.length === 0 ? (
              <p className="text-sm">{t('noChapters')}</p>
            ) : (
              <ul className="space-y-2">
                {physics.map((c) => (
                  <li key={c.id}>
                    <button type="button" onClick={() => chooseChapter(c.id)} aria-pressed={chapterId === c.id} className={`w-full text-left min-h-[52px] rounded-xl border px-4 py-2 text-sm font-semibold cursor-pointer ${chapterId === c.id ? 'bg-[#6D28D9] text-white border-[#6D28D9]' : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-white'}`}>
                      Ch {c.chapterNumber}: {titleOf(c)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {step === 2 && chapter && (
          <>
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">3. {titleOf(chapter)}</h2>
            <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">Class {path.classLevel} · {path.board.toUpperCase()}{path.board === 'state' ? ` · ${path.stateName}` : ''} · {chapter.textbookName}</p>
            <p className="text-xs text-[#7A4B00] dark:text-[#FF9F1C]">{t('draft')}</p>
            <h3 className="font-semibold">{t('idea')}</h3>
            <p className="text-base leading-relaxed">{resolveLocalizedText(chapter.conceptSummary, language).text}</p>
            {chapter.definitions.length > 0 && (
              <>
                <h3 className="font-semibold">{t('words')}</h3>
                <ul className="space-y-1 text-sm">
                  {chapter.definitions.slice(0, 2).map((d) => (
                    <li key={d.id}><strong>{resolveLocalizedText(d.term, language).text}</strong> — {resolveLocalizedText(d.definition, language).text}</li>
                  ))}
                </ul>
              </>
            )}
            {chapter.formulas[0] && (
              <p className="text-sm"><strong>{t('formula')}:</strong> <code className="rounded bg-[#F5F0FF] dark:bg-[#2A1D5C] px-2 py-0.5">{chapter.formulas[0].formula}</code></p>
            )}
            <button type="button" onClick={() => (isSpeaking ? stopSpeaking() : speak(`${titleOf(chapter)}. ${resolveLocalizedText(chapter.conceptSummary, language).text}`))} className={`${btn} border-[#6D28D9] text-[#5B21B6] dark:text-[#C4B5FD]`}>{t('listen')}</button>
          </>
        )}

        {step === 3 && chapter && (
          <>
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">4. {t('s4')}</h2>
            {exp ? (
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">{t('exp')}: {resolveLocalizedText(exp.title, language).text}</h3>
                <p>{resolveLocalizedText(exp.objective, language).text}</p>
                <p><strong>{t('need')}:</strong> {resolveLocalizedList(exp.materials, language).items.join(', ')}</p>
                <p><strong>{t('steps')}:</strong></p>
                <ol className="list-decimal pl-5 space-y-1">{resolveLocalizedList(exp.steps, language).items.map((s, i) => (<li key={i}>{s}</li>))}</ol>
                <p><strong>{t('safety')}:</strong> {resolveLocalizedText(exp.safetyNote, language).text}</p>
                <ExperimentVideo experimentId={exp.id} />
              </div>
            ) : (
              <p className="text-sm">{t('noExp')}</p>
            )}
            <ChapterSimulations chapterId={chapter.id} titleEn={chapter.title.en} subject="physics" language={language} />
          </>
        )}

        {step === 4 && chapter && (
          <>
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">5. {t('q')}</h2>
            {mcq ? (
              <div className="space-y-3">
                <p className="text-base font-semibold">{resolveLocalizedText(mcq.question, language).text}</p>
                <ul className="space-y-2">
                  {mcqOpts.map((o, i) => (
                    <li key={i}>
                      <button type="button" disabled={answer !== null} onClick={() => setAnswer(i)} className={`w-full text-left min-h-[48px] rounded-xl border px-4 py-2 text-sm cursor-pointer ${answer === null ? 'border-[#B6A6E0]' : i === mcq.correctIndex ? 'border-[#16A34A] bg-[#DCFCE7] text-[#14532D]' : i === answer ? 'border-[#B91C1C] bg-[#FEE2E2] text-[#7F1D1D]' : 'border-[#E7DDFB] opacity-70'}`}>
                        {String.fromCharCode(65 + i)}. {o}
                      </button>
                    </li>
                  ))}
                </ul>
                {answer !== null && (
                  <p className="flex items-start gap-2 text-sm" role="status">
                    {answer === mcq.correctIndex ? <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0" aria-hidden="true" /> : <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0" aria-hidden="true" />}
                    <span><strong>{answer === mcq.correctIndex ? t('right') : `${t('wrong')} ${String.fromCharCode(65 + mcq.correctIndex)}.`}</strong> {resolveLocalizedText(mcq.explanation, language).text}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm">{t('noQ')}</p>
            )}
          </>
        )}

        {step === 5 && chapter && (
          <>
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">6. {t('save')}</h2>
            <p className="text-sm">{titleOf(chapter)} — Class {path.classLevel} · {path.board.toUpperCase()}</p>
            {packParams ? (
              <>
                <p className="text-sm tabular-nums"><strong>{t('size')}:</strong> {formatBytes(sizeBytes)}</p>
                <div className="flex flex-wrap gap-3">
                  <button type="button" disabled={saveState === 'saving'} onClick={() => void doSave()} className={`${btn} bg-[#6D28D9] text-white border-transparent`}>{saveState === 'saving' ? t('saving') : t('save')}</button>
                  <button type="button" onClick={() => onOpenChapter(chapter.id)} className={`${btn} border-[#6D28D9] text-[#5B21B6] dark:text-[#C4B5FD]`}>{t('fullChapter')}</button>
                </div>
              </>
            ) : (
              <p className="text-sm">{t('failed')}</p>
            )}
            {saveState === 'ok' && savedMeta && (
              <div className="rounded-xl bg-[#EFE7FF] dark:bg-[#6D28D9]/25 p-3 text-sm" role="status">
                <p className="flex items-center gap-2 font-semibold text-[#5B21B6] dark:text-[#C4B5FD]"><CheckCircle2 className="w-4 h-4" aria-hidden="true" />{t('savedOk')} ({formatBytes(savedMeta.coreSizeBytes)})</p>
                <button type="button" onClick={onOpenSaved} className="mt-2 underline font-semibold">{t('seeSaved')}</button>
              </div>
            )}
            {saveState === 'fail' && <p className="text-sm text-[#B91C1C]" role="alert">{t('failed')}</p>}
          </>
        )}
      </div>

      <div className="flex justify-between gap-3">
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))} className={`${btn} border-[#B6A6E0] inline-flex items-center gap-2 disabled:opacity-40`}><ArrowLeft className="w-4 h-4" aria-hidden="true" />{t('back')}</button>
        <button type="button" disabled={step === 5 || !canNext} onClick={() => setStep((s) => Math.min(5, s + 1))} className={`${btn} bg-[#2E1A6E] text-white border-transparent inline-flex items-center gap-2 disabled:opacity-40`}>{t('next')}<ArrowRight className="w-4 h-4" aria-hidden="true" /></button>
      </div>
    </section>
  );
};
