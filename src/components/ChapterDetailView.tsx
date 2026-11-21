import { shareText } from '../lib/engagement';
import { Share2 } from 'lucide-react';
import { InlineSimulation } from './InlineSimulation';
import { FlashcardTrainer } from './FlashcardTrainer';
import { ChapterSimulations } from './ChapterSimulations';
import { buildDeck } from '../lib/flashcards';
import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Atom,
  Bookmark,
  BookOpen,
  Calculator,
  CheckCircle2,
  FlaskConical,
  HelpCircle,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { resolveLocalizedList, resolveLocalizedText } from '../data/curriculumCatalogue';
import type { ExperimentId } from '../data/physicsExperiments';
import { useSpeech } from '../hooks/useSpeech';
import type { ChapterDetailApiResponse } from '../lib/syllabusApi';
import type {
  Language,
  StudentProgress,
  SupportingWorldId,
} from '../types/stem';
import { ChapterDiagramViewer } from './ChapterDiagramViewer';
import { StructuredExperimentCard } from './StructuredExperimentCard';

interface ChapterDetailViewProps {
  detail: ChapterDetailApiResponse;
  language: Language;
  lowPowerMode?: boolean;
  progress: StudentProgress;
  onBack: () => void;
  onToggleChapterComplete: (chapterId: string) => void;
  onToggleTopicStudied: (topicId: string) => void;
  onToggleBookmarkTopic: (topicKey: string) => void;
  onToggleExperimentComplete: (expId: string) => void;
  onSaveChapterQuizScore: (chapterId: string, scorePct: number) => void;
  onAddStudySeconds: (seconds: number) => void;
  onLaunchPhysicsSim: (topic: ExperimentId) => void;
  onLaunchSupportingWorld: (world: SupportingWorldId) => void;
  onOpenMentorWithPrompt: (subject: string, prompt: string) => void;
}

type ChapterTab = 'concepts' | 'formulas' | 'experiments' | 'questions' | 'flashcards';

export const ChapterDetailView: React.FC<ChapterDetailViewProps> = ({
  detail,
  language,
  lowPowerMode = false,
  progress,
  onBack,
  onToggleChapterComplete,
  onToggleTopicStudied,
  onToggleBookmarkTopic,
  onToggleExperimentComplete,
  onSaveChapterQuizScore,
  onAddStudySeconds,
  onLaunchPhysicsSim,
  onLaunchSupportingWorld,
  onOpenMentorWithPrompt,
}) => {
  const { chapter, syllabusMeta } = detail;
  const { textbookName, sourceTitle, sourceUrl } = syllabusMeta;
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);

  const [tab, setTab] = useState<ChapterTab>('concepts');
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

  // Track active study time every 15 seconds while viewing a chapter
  useEffect(() => {
    const id = window.setInterval(() => {
      onAddStudySeconds(15);
    }, 15000);
    return () => window.clearInterval(id);
  }, [onAddStudySeconds, chapter.id]);

  const title = resolveLocalizedText(chapter.title, language).text;
  const summary = resolveLocalizedText(chapter.conceptSummary, language).text;
  const diagramCaption = resolveLocalizedText(chapter.diagramCaption, language).text;
  const keyConcepts = resolveLocalizedList(chapter.keyConcepts, language).items;
  const applications = resolveLocalizedList(chapter.realLifeApplications, language).items;
  const revisionNotes = resolveLocalizedList(chapter.revisionNotes, language).items;

  const isCompleted = (progress.completedChapterIds ?? []).includes(chapter.id);
  const studiedSet = new Set(progress.studiedTopicIds ?? []);
  const bookmarkSet = new Set(progress.bookmarkedTopicIds ?? []);
  const completedExpSet = new Set(progress.completedExperimentIds ?? []);

  const linkedSims = Array.from(
    new Set(
      chapter.experiments
        .map((e) => e.linkedSimExperiment)
        .filter((s): s is ExperimentId => Boolean(s))
    )
  );

  const handleMcqSelect = (mcqId: string, idx: number) => {
    const next = { ...mcqAnswers, [mcqId]: idx };
    setMcqAnswers(next);
    if (chapter.mcqs.length > 0 && Object.keys(next).length >= chapter.mcqs.length) {
      const correct = chapter.mcqs.filter((m) => next[m.id] === m.correctIndex).length;
      const pct = Math.round((correct / chapter.mcqs.length) * 100);
      onSaveChapterQuizScore(chapter.id, pct);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* Chapter Header Card */}
      <header className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
            <span>Back to My Syllabus</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => (isSpeaking ? stopSpeaking() : speak(`${title}. ${summary}`))}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] cursor-pointer"
            >
              <Volume2 className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
              <span>{isSpeaking ? 'Stop Reading' : 'Listen'}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onOpenMentorWithPrompt(
                  chapter.primarySubject === 'chemistry'
                    ? 'Chemistry'
                    : chapter.primarySubject === 'biology'
                      ? 'Biology'
                      : 'Physics',
                  `Explain Class ${chapter.classLevel} chapter "${title}" clearly with an example.`
                )
              }
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:border-[#6D28D9] cursor-pointer"
            >
              <Sparkles className="w-4 h-4" aria-hidden="true" />
              <span>Ask AI Mentor</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleChapterComplete(chapter.id)}
              aria-pressed={isCompleted}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 min-h-[42px] text-xs font-semibold cursor-pointer transition-colors ${
                isCompleted
                  ? 'bg-[#6D28D9] text-white'
                  : 'border border-[#6D28D9] text-[#5B21B6] dark:text-[#C4B5FD] hover:bg-[#EFE7FF] dark:hover:bg-[#6D28D9]/20'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
              <span>{isCompleted ? 'Chapter Completed' : 'Mark Chapter Complete'}</span>
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-[#4A3F66] dark:text-[#C9BFEA]">
            Class {chapter.classLevel} · Chapter {chapter.chapterNumber} · {textbookName}
            {sourceUrl && (
              <>
                {' '}
                ·{' '}
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#5B21B6] dark:text-[#C4B5FD] underline"
                >
                  {sourceTitle || 'Official Source'}
                </a>
              </>
            )}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2E1A6E] dark:text-white tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-[#22163F] dark:text-[#E4DDFA] leading-relaxed max-w-3xl">
            {summary}
          </p>
          <button
            type="button"
            onClick={() =>
              void shareText(
                `📘 ${title}\n${summary}\n— Gyaan Graph ${window.location.origin}/#chapter/${chapter.id}`
              )
            }
            className="inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-4 py-2 text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]"
          >
            <Share2 className="w-4 h-4" aria-hidden="true" />
            {language === 'hi' ? 'दोस्तों को भेजें (WhatsApp)' : language === 'kn' ? 'ಸ್ನೇಹಿತರಿಗೆ ಕಳುಹಿಸಿ (WhatsApp)' : 'Send to friends (WhatsApp)'}
          </button>
        </div>

        {linkedSims.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
            {linkedSims.map((simId) => (
              <InlineSimulation key={simId} experimentId={simId} language={language} lowPowerMode={lowPowerMode} />
            ))}
          </div>
        )}

        {/* Section Tabs */}
        <div
          role="tablist"
          aria-label="Chapter learning sections"
          className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E7DDFB] dark:border-[#3B2C78]"
        >
          {(
            [
              { id: 'concepts', label: 'Topics, Diagrams & Notes', icon: <BookOpen className="w-3.5 h-3.5" /> },
              { id: 'formulas', label: 'Formulas & Solved Numericals', icon: <Calculator className="w-3.5 h-3.5" /> },
              { id: 'experiments', label: `Experiments & Simulations (${chapter.experiments.length})`, icon: <FlaskConical className="w-3.5 h-3.5" /> },
              { id: 'questions', label: `Q&A and MCQ Quiz (${chapter.mcqs.length})`, icon: <HelpCircle className="w-3.5 h-3.5" /> },
              { id: 'flashcards', label: language === 'hi' ? 'फ्लैशकार्ड' : language === 'kn' ? 'ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್' : 'Flashcards', icon: <Sparkles className="w-3.5 h-3.5" /> },
            ] as { id: ChapterTab; label: string; icon: React.ReactNode }[]
          ).map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 min-h-[42px] text-xs font-semibold cursor-pointer transition-colors ${
                tab === item.id
                  ? 'bg-[#2E1A6E] text-white'
                  : 'bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] border border-[#E7DDFB] dark:border-[#3B2C78] hover:border-[#6D28D9]'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* TAB 1: Topics, Definitions, Interactive Diagram, Applications, Revision Notes */}
      {tab === 'concepts' && (
        <div className="space-y-6">
          {/* Interactive Concept Diagram */}
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
              Interactive Visual Diagram
            </h2>
            <ChapterDiagramViewer
              kind={chapter.diagramKind}
              caption={diagramCaption}
              lowPowerMode={lowPowerMode}
            />
          </div>

          <ChapterSimulations chapterId={chapter.id} titleEn={chapter.title.en} subject={chapter.primarySubject} language={language} />

          {/* Topics & Subtopics */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
              Topics &amp; Subtopics
            </h2>
            {chapter.topics.map((tp) => {
              const tTitle = resolveLocalizedText(tp.title, language).text;
              const tExpl = resolveLocalizedText(tp.explanation, language).text;
              const subs = resolveLocalizedList(tp.subtopics, language).items;
              const studied = studiedSet.has(tp.id);
              const bmKey = `${chapter.id}::${tp.id}`;
              const bookmarked = bookmarkSet.has(bmKey);
              return (
                <div
                  key={tp.id}
                  className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-[#2E1A6E] dark:text-white">{tTitle}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggleBookmarkTopic(bmKey)}
                        aria-pressed={bookmarked}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 min-h-[36px] text-xs font-semibold cursor-pointer ${
                          bookmarked
                            ? 'border-[#FF9F1C] bg-[#FFF1DE] dark:bg-[#FF9F1C]/20 text-[#B4430C] dark:text-[#FF9F1C]'
                            : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#4A3F66] dark:text-[#C9BFEA]'
                        }`}
                      >
                        <Bookmark className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{bookmarked ? 'Saved' : 'Bookmark'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleTopicStudied(tp.id)}
                        aria-pressed={studied}
                        className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 min-h-[36px] text-xs font-semibold cursor-pointer ${
                          studied
                            ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#6D28D9]/25 text-[#5B21B6] dark:text-[#C4B5FD]'
                            : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#F3EFFF]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{studied ? 'Studied' : 'Mark Studied'}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-[#22163F] dark:text-[#E4DDFA] leading-relaxed">{tExpl}</p>
                  {subs.length > 0 && (
                    <ul className="list-disc pl-5 text-xs sm:text-sm text-[#4A3F66] dark:text-[#C9BFEA] space-y-1">
                      {subs.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Definitions & Key Concepts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
              <h2 className="text-base font-bold text-[#2E1A6E] dark:text-white">
                Important Definitions
              </h2>
              <dl className="space-y-3">
                {chapter.definitions.map((d) => (
                  <div key={d.id} className="border-b last:border-b-0 border-[#E7DDFB]/70 dark:border-[#3B2C78]/70 pb-2.5 last:pb-0">
                    <dt className="text-sm font-bold text-[#5B21B6] dark:text-[#C4B5FD]">
                      {resolveLocalizedText(d.term, language).text}
                    </dt>
                    <dd className="text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA] mt-0.5 leading-relaxed">
                      {resolveLocalizedText(d.definition, language).text}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
              <h2 className="text-base font-bold text-[#2E1A6E] dark:text-white">
                Key Concepts &amp; Revision Notes
              </h2>
              <ul className="list-disc pl-5 text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA] space-y-1.5">
                {keyConcepts.map((kc) => (
                  <li key={kc}>{kc}</li>
                ))}
                {revisionNotes.map((rn) => (
                  <li key={rn}>{rn}</li>
                ))}
              </ul>
              {applications.length > 0 && (
                <div className="pt-2 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
                  <p className="text-xs font-bold uppercase tracking-wide text-[#B4430C] dark:text-[#FF9F1C] mb-1">
                    Real-Life Applications
                  </p>
                  <ul className="list-disc pl-5 text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA] space-y-1">
                    {applications.map((app) => (
                      <li key={app}>{app}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Formulas, Solved Numericals, Chemical Equations, Biological Processes */}
      {tab === 'formulas' && (
        <div className="space-y-5">
          {chapter.formulas.length > 0 && (
            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
              <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">Formula Sheet</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {chapter.formulas.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-1"
                  >
                    <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
                      {resolveLocalizedText(f.name, language).text}
                    </p>
                    <p className="font-mono text-base font-bold text-[#2E1A6E] dark:text-white">
                      {f.formula}
                    </p>
                    <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
                      {resolveLocalizedText(f.variables, language).text} · Unit: {f.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {chapter.solvedNumericals.length > 0 && (
            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-4">
              <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
                Solved Numerical Examples
              </h2>
              {chapter.solvedNumericals.map((n) => (
                <div
                  key={n.id}
                  className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-2"
                >
                  <p className="text-sm font-semibold text-[#2E1A6E] dark:text-white">
                    {resolveLocalizedText(n.problem, language).text}
                  </p>
                  <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] font-mono">
                    Given: {n.given.join(' | ')} · Formula: {n.formulaUsed}
                  </p>
                  <ol className="list-decimal pl-5 text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA] space-y-1">
                    {n.solutionSteps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  <p className="text-xs sm:text-sm font-bold text-[#5B21B6] dark:text-[#C4B5FD]">
                    Answer: {n.finalAnswer}
                  </p>
                </div>
              ))}
            </div>
          )}

          {chapter.chemicalEquations && chapter.chemicalEquations.length > 0 && (
            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
              <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
                Balanced Chemical Equations
              </h2>
              {chapter.chemicalEquations.map((eq) => (
                <div
                  key={eq.id}
                  className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-1"
                >
                  <p className="text-xs font-semibold text-[#B4430C] dark:text-[#FF9F1C]">
                    {resolveLocalizedText(eq.title, language).text} · {eq.reactionType}
                  </p>
                  <p className="font-mono text-sm font-bold text-[#2E1A6E] dark:text-white">
                    {eq.equation}
                  </p>
                  <p className="text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA]">
                    {resolveLocalizedText(eq.explanation, language).text}
                  </p>
                </div>
              ))}
            </div>
          )}

          {chapter.biologyProcesses && chapter.biologyProcesses.length > 0 && (
            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
              <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
                Biological Processes &amp; Microscopy
              </h2>
              {chapter.biologyProcesses.map((bp) => (
                <div
                  key={bp.id}
                  className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-2"
                >
                  <p className="text-sm font-bold text-[#5B21B6] dark:text-[#C4B5FD]">
                    {resolveLocalizedText(bp.title, language).text}
                  </p>
                  <ol className="list-decimal pl-5 text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA] space-y-1">
                    {resolveLocalizedList(bp.steps, language).items.map((st) => (
                      <li key={st}>{st}</li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}

          {chapter.formulas.length === 0 &&
            chapter.solvedNumericals.length === 0 &&
            !(chapter.chemicalEquations && chapter.chemicalEquations.length > 0) &&
            !(chapter.biologyProcesses && chapter.biologyProcesses.length > 0) && (
              <div className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-6 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
                This chapter focuses on conceptual observations and experiments. Switch to Topics or Experiments above to explore further.
              </div>
            )}
        </div>
      )}

      {/* TAB 3: Experiments & Linked Simulations */}
      {tab === 'experiments' && (
        <div className="space-y-4">
          {chapter.experiments.map((exp, idx) => (
            <StructuredExperimentCard
              key={exp.id}
              experiment={exp}
              language={language}
              isCompleted={completedExpSet.has(exp.id)}
              onToggleCompleted={onToggleExperimentComplete}
              onLaunchPhysicsSim={onLaunchPhysicsSim}
              onLaunchSupportingWorld={onLaunchSupportingWorld}
              defaultExpanded={idx === 0}
            />
          ))}
        </div>
      )}

      {/* TAB 4: Chapter Questions & Interactive MCQ Quiz */}
      {tab === 'questions' && (
        <div className="space-y-6">
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
            <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
              Chapter-Wise Questions
            </h2>
            <div className="space-y-3">
              {chapter.chapterQuestions.map((q) => {
                const isOpen = openQuestionId === q.id;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-2"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenQuestionId(isOpen ? null : q.id)}
                      className="w-full text-left flex items-center justify-between gap-2 text-sm font-semibold text-[#2E1A6E] dark:text-white cursor-pointer"
                    >
                      <span>{resolveLocalizedText(q.question, language).text}</span>
                      <span className="text-xs text-[#5B21B6] dark:text-[#C4B5FD] shrink-0">
                        {isOpen ? 'Hide Answer' : 'View Answer'}
                      </span>
                    </button>
                    {isOpen && (
                      <p className="text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA] pt-2 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
                        {resolveLocalizedText(q.answer, language).text}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
                Practice MCQ Quiz
              </h2>
              {progress.chapterQuizScores?.[chapter.id] !== undefined && (
                <span className="text-xs font-bold text-[#B4430C] dark:text-[#FF9F1C] tabular-nums">
                  Best Score: {progress.chapterQuizScores[chapter.id]}%
                </span>
              )}
            </div>

            {chapter.mcqs.map((m, idx) => {
              const picked = mcqAnswers[m.id];
              const options = resolveLocalizedList(m.options, language).items;
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-2.5"
                >
                  <p className="text-sm font-semibold text-[#2E1A6E] dark:text-white">
                    {idx + 1}. {resolveLocalizedText(m.question, language).text}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {options.map((opt, optIdx) => {
                      const active = picked === optIdx;
                      const correct = optIdx === m.correctIndex;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleMcqSelect(m.id, optIdx)}
                          className={`text-left rounded-xl border px-3 py-2.5 min-h-[42px] text-xs font-medium cursor-pointer transition-colors ${
                            active
                              ? correct
                                ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#6D28D9]/25 text-[#5B21B6] dark:text-[#C4B5FD]'
                                : 'border-[#FF9F1C] bg-[#FFF1DE] dark:bg-[#FF9F1C]/20 text-[#B4430C] dark:text-[#FF9F1C]'
                              : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#22163F] dark:text-[#E4DDFA] hover:border-[#6D28D9]'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {picked !== undefined && (
                    <p className="text-xs text-[#5B21B6] dark:text-[#C4B5FD]">
                      {picked === m.correctIndex ? 'Correct! ' : 'Check concept: '}
                      {resolveLocalizedText(m.explanation, language).text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'flashcards' && (
        <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-6">
          <FlashcardTrainer
            key={`${chapter.id}-${language}`}
            deck={buildDeck([chapter], language)}
            language={language}
            heading={title}
          />
        </div>
      )}
    </section>
  );
};
