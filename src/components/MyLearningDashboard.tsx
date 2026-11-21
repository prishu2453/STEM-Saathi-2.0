import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Atom,
  Bookmark,
  BookOpen,
  Calculator,
  CheckCircle2,
  Clock,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Leaf,
  PlayCircle,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  RichChapterData,
  SyllabusApiResponse,
  SyllabusMetaResponse,
  SyllabusSubject,
} from '../../shared/syllabus/types';
import { formatLearningPathSummary, resolveLocalizedText } from '../data/curriculumCatalogue';
import type { ExperimentId } from '../data/physicsExperiments';
import {
  fetchChapterDetail,
  fetchSyllabus,
  fetchSyllabusMeta,
  type ChapterDetailApiResponse,
} from '../lib/syllabusApi';
import type {
  Language,
  LearningPathPreference,
  StudentProgress,
  SupportingWorldId,
} from '../types/stem';
import { ChapterDetailView } from './ChapterDetailView';
import { FlashcardTrainer } from './FlashcardTrainer';
import { OfflineStudyCard } from './OfflineStudyCard';
import { MyLearningProfileSetup } from './MyLearningProfileSetup';
import { buildDeck, countDue, loadFlashProgress } from '../lib/flashcards';

interface MyLearningDashboardProps {
  language: Language;
  lowPowerMode?: boolean;
  learningPath: LearningPathPreference;
  onLearningPathChange: (next: LearningPathPreference) => void;
  progress: StudentProgress;
  activeChapterId: string | null;
  onSelectChapterId: (chapterId: string | null) => void;
  onToggleChapterComplete: (chapterId: string) => void;
  onToggleTopicStudied: (topicId: string) => void;
  onToggleBookmarkTopic: (topicKey: string) => void;
  onToggleExperimentComplete: (expId: string) => void;
  onSaveChapterQuizScore: (chapterId: string, scorePct: number) => void;
  onAddStudySeconds: (seconds: number) => void;
  onLaunchPhysicsSim: (topic: ExperimentId) => void;
  onLaunchSupportingWorld: (world: SupportingWorldId) => void;
  onOpenExperimentLibrary: () => void;
  onOpenMentorWithPrompt: (subject: string, prompt: string) => void;
}

function formatStudyTime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const mins = Math.floor(totalSeconds / 60);
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hrs === 0) return `${mins}m`;
  return `${hrs}h ${remMins}m`;
}

export const MyLearningDashboard: React.FC<MyLearningDashboardProps> = ({
  language,
  lowPowerMode = false,
  learningPath,
  onLearningPathChange,
  progress,
  activeChapterId,
  onSelectChapterId,
  onToggleChapterComplete,
  onToggleTopicStudied,
  onToggleBookmarkTopic,
  onToggleExperimentComplete,
  onSaveChapterQuizScore,
  onAddStudySeconds,
  onLaunchPhysicsSim,
  onLaunchSupportingWorld,
  onOpenExperimentLibrary,
  onOpenMentorWithPrompt,
}) => {
  const [meta, setMeta] = useState<SyllabusMetaResponse | null>(null);
  const [syllabusData, setSyllabusData] = useState<SyllabusApiResponse | null>(null);
  const [chapterDetail, setChapterDetail] = useState<ChapterDetailApiResponse | null>(null);
  const [loadingSyllabus, setLoadingSyllabus] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(!learningPath.configured);

  const [subjectFilter, setSubjectFilter] = useState<SyllabusSubject | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [flashOpen, setFlashOpen] = useState(false);

  // Load syllabus metadata once
  useEffect(() => {
    let active = true;
    void fetchSyllabusMeta().then((m) => {
      if (active) setMeta(m);
    });
    return () => {
      active = false;
    };
  }, []);

  // Keep profile setup screen open whenever user hasn't configured their class/board yet
  useEffect(() => {
    if (!learningPath.configured && !activeChapterId) {
      setIsEditingProfile(true);
    }
  }, [learningPath.configured, activeChapterId]);

  // Fetch board-wise syllabus whenever class/board/state/session changes
  useEffect(() => {
    let active = true;
    setLoadingSyllabus(true);
    void fetchSyllabus({
      classLevel: learningPath.classLevel,
      board: learningPath.board,
      stateName: learningPath.stateName,
      session: learningPath.session,
      subject: 'all',
    }).then((res) => {
      if (active) {
        setSyllabusData(res);
        setLoadingSyllabus(false);
      }
    });
    return () => {
      active = false;
    };
  }, [
    learningPath.classLevel,
    learningPath.board,
    learningPath.stateName,
    learningPath.session,
  ]);

  // Fetch active chapter details when a chapter is opened
  useEffect(() => {
    if (!activeChapterId) {
      setChapterDetail(null);
      return;
    }
    let active = true;
    void fetchChapterDetail(activeChapterId).then((detail) => {
      if (active) setChapterDetail(detail);
    });
    return () => {
      active = false;
    };
  }, [activeChapterId]);

  const chapters = syllabusData?.chapters ?? [];

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return chapters.filter((ch) => {
      if (subjectFilter !== 'all' && ch.primarySubject !== subjectFilter) return false;
      if (!q) return true;
      const hay = [
        ch.title.en,
        ch.title.hi || '',
        ch.title.kn || '',
        ch.conceptSummary.en,
        ch.topicTag.en,
        ...ch.topics.map((t) => t.title.en),
        ...ch.experiments.map((e) => e.title.en),
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [chapters, subjectFilter, searchQuery]);

  const physicsChapters = useMemo(
    () => filteredChapters.filter((ch) => ch.primarySubject === 'physics'),
    [filteredChapters]
  );
  const chemistryChapters = useMemo(
    () => filteredChapters.filter((ch) => ch.primarySubject === 'chemistry'),
    [filteredChapters]
  );
  const biologyChapters = useMemo(
    () => filteredChapters.filter((ch) => ch.primarySubject === 'biology'),
    [filteredChapters]
  );

  // Dashboard Progress Calculations scoped to active syllabus
  const stats = useMemo(() => {
    const completedChaptersSet = new Set(progress.completedChapterIds ?? []);
    const studiedTopicsSet = new Set(progress.studiedTopicIds ?? []);
    const completedExpSet = new Set(progress.completedExperimentIds ?? []);

    const syllabusChapterTotal = chapters.length;
    const completedInSyllabus = chapters.filter((ch) => completedChaptersSet.has(ch.id)).length;
    const overallPct =
      syllabusChapterTotal > 0
        ? Math.round((completedInSyllabus / syllabusChapterTotal) * 100)
        : 0;

    const totalTopicsInSyllabus = chapters.reduce((acc, ch) => acc + ch.topics.length, 0);
    const studiedInSyllabus = chapters.reduce(
      (acc, ch) => acc + ch.topics.filter((tp) => studiedTopicsSet.has(tp.id)).length,
      0
    );

    const totalExpsInSyllabus = chapters.reduce((acc, ch) => acc + ch.experiments.length, 0);
    const expsDoneInSyllabus = chapters.reduce(
      (acc, ch) => acc + ch.experiments.filter((ex) => completedExpSet.has(ex.id)).length,
      0
    );

    const quizValues = Object.values(progress.chapterQuizScores ?? {});
    const avgQuizPct =
      quizValues.length > 0
        ? Math.round(quizValues.reduce((s, n) => s + n, 0) / quizValues.length)
        : 0;

    return {
      syllabusChapterTotal,
      completedInSyllabus,
      overallPct,
      totalTopicsInSyllabus,
      studiedInSyllabus,
      totalExpsInSyllabus,
      expsDoneInSyllabus,
      quizCount: quizValues.length,
      avgQuizPct,
      learningTimeSeconds: progress.learningTimeSeconds ?? 0,
    };
  }, [chapters, progress]);

  // Quick resume chapter: most recent chapter in current syllabus OR first incomplete Physics chapter
  const continueChapter: RichChapterData | null = useMemo(() => {
    if (chapters.length === 0) return null;
    const recentIds = progress.recentChapterIds ?? [];
    for (const rid of recentIds) {
      const match = chapters.find((ch) => ch.id === rid);
      if (match) return match;
    }
    const completed = new Set(progress.completedChapterIds ?? []);
    return (
      chapters.find((ch) => ch.primarySubject === 'physics' && !completed.has(ch.id)) ??
      chapters[0]
    );
  }, [chapters, progress.recentChapterIds, progress.completedChapterIds]);

  const recentChaptersList = useMemo(() => {
    const recentIds = progress.recentChapterIds ?? [];
    return recentIds
      .map((id) => chapters.find((c) => c.id === id))
      .filter((c): c is RichChapterData => Boolean(c))
      .slice(0, 4);
  }, [chapters, progress.recentChapterIds]);

  const bookmarkedItems = useMemo(() => {
    const list: { key: string; chapterId: string; chapterTitle: string; topicTitle: string }[] = [];
    for (const key of progress.bookmarkedTopicIds ?? []) {
      const [chapId, topicId] = key.split('::');
      const ch = chapters.find((c) => c.id === chapId);
      const tp = ch?.topics.find((t) => t.id === topicId);
      if (ch && tp) {
        list.push({
          key,
          chapterId: ch.id,
          chapterTitle: resolveLocalizedText(ch.title, language).text,
          topicTitle: resolveLocalizedText(tp.title, language).text,
        });
      }
    }
    return list;
  }, [chapters, progress.bookmarkedTopicIds, language]);

  // Active chapter view takes priority when selected
  if (activeChapterId && chapterDetail) {
    return (
      <ChapterDetailView
        detail={chapterDetail}
        language={language}
        lowPowerMode={lowPowerMode}
        progress={progress}
        onBack={() => onSelectChapterId(null)}
        onToggleChapterComplete={onToggleChapterComplete}
        onToggleTopicStudied={onToggleTopicStudied}
        onToggleBookmarkTopic={onToggleBookmarkTopic}
        onToggleExperimentComplete={onToggleExperimentComplete}
        onSaveChapterQuizScore={onSaveChapterQuizScore}
        onAddStudySeconds={onAddStudySeconds}
        onLaunchPhysicsSim={onLaunchPhysicsSim}
        onLaunchSupportingWorld={onLaunchSupportingWorld}
        onOpenMentorWithPrompt={onOpenMentorWithPrompt}
      />
    );
  }

  // First-time onboarding OR "Change Class / Board" flow
  if (isEditingProfile) {
    return (
      <MyLearningProfileSetup
        language={language}
        initialPath={learningPath}
        meta={meta}
        onApply={(nextPath) => {
          onLearningPathChange(nextPath);
          setIsEditingProfile(false);
        }}
        onCancel={
          learningPath.configured ? () => setIsEditingProfile(false) : undefined
        }
      />
    );
  }

  const renderChapterCard = (chapter: RichChapterData, isPhysicsFeatured = false) => {
    const isCompleted = (progress.completedChapterIds ?? []).includes(chapter.id);
    const studiedCount = chapter.topics.filter((t) =>
      (progress.studiedTopicIds ?? []).includes(t.id)
    ).length;
    const quizScore = progress.chapterQuizScores?.[chapter.id];
    const title = resolveLocalizedText(chapter.title, language).text;
    const summary = resolveLocalizedText(chapter.conceptSummary, language).text;
    const topicTag = resolveLocalizedText(chapter.topicTag, language).text;

    return (
      <article
        key={chapter.id}
        className={`a11y-surface rounded-2xl border bg-white dark:bg-[#1F1545] p-4 sm:p-5 flex flex-col justify-between gap-4 transition-colors ${
          isCompleted
            ? 'border-[#6D28D9]'
            : isPhysicsFeatured
              ? 'border-[#D7CFBA] dark:border-[#2C4E70]'
              : 'border-[#E7DDFB] dark:border-[#3B2C78]'
        }`}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-[#4A3F66] dark:text-[#B3A6DE]">
            <span className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
              Chapter {chapter.chapterNumber} · {topicTag}
            </span>
            {isCompleted && (
              <span className="inline-flex items-center gap-1 font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Completed
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-[#2E1A6E] dark:text-white leading-snug">
            {title}
          </h3>

          <p className="text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA] line-clamp-2 leading-relaxed">
            {summary}
          </p>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#4A3F66] dark:text-[#C9BFEA] pt-1 tabular-nums">
            <span>
              Topics: {studiedCount}/{chapter.topics.length}
            </span>
            <span aria-hidden="true">·</span>
            <span>Experiments: {chapter.experiments.length}</span>
            {chapter.formulas.length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span>Formulas: {chapter.formulas.length}</span>
              </>
            )}
            {quizScore !== undefined && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-[#B4430C] dark:text-[#FF9F1C]">
                  Quiz: {quizScore}%
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
          <button
            type="button"
            onClick={() => onSelectChapterId(chapter.id)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-2 min-h-[44px] text-xs font-semibold text-white transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Study Chapter</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleChapterComplete(chapter.id)}
            aria-pressed={isCompleted}
            aria-label={`Mark ${title} complete`}
            className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border px-3 text-xs font-semibold cursor-pointer ${
              isCompleted
                ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#6D28D9]/25 text-[#5B21B6] dark:text-[#C4B5FD]'
                : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </article>
    );
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-5 sm:py-8 space-y-7">
      {/* Header + Student Board Banner */}
      <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD] flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>My Learning Dashboard</span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2E1A6E] dark:text-white tracking-tight">
              {formatLearningPathSummary(learningPath, language)}
            </h1>
            {syllabusData?.available && syllabusData.textbookName && (
              <p className="text-xs sm:text-sm text-[#4A3F66] dark:text-[#C9BFEA] flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>{syllabusData.textbookName}</span>
                {syllabusData.sourceUrl && (
                  <>
                    <span aria-hidden="true">·</span>
                    <a
                      href={syllabusData.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:underline"
                    >
                      <span>{syllabusData.sourceTitle || 'Official Syllabus'}</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onOpenExperimentLibrary}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] cursor-pointer"
            >
              <FlaskConical className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
              <span>Experiment Library</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2E1A6E] hover:bg-[#112539] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span>Change Class / Board</span>
            </button>
          </div>
        </div>

        {/* Visual Progress Bars & Key Metrics */}
        {syllabusData?.available && (
          <div className="pt-4 border-t border-[#E7DDFB] dark:border-[#3B2C78] space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#2E1A6E] dark:text-[#F5F0FF]">
                  {language === 'hi' ? 'इस ऐप के अध्यायों में प्रगति' : language === 'kn' ? 'ಈ ಆ್ಯಪ್‌ನ ಅಧ್ಯಾಯಗಳಲ್ಲಿ ಪ್ರಗತಿ' : 'Progress through the chapters in this app'} ({stats.completedInSyllabus}/{stats.syllabusChapterTotal}{' '}
                  {language === 'hi' ? 'अध्याय' : language === 'kn' ? 'ಅಧ್ಯಾಯ' : 'chapters'})
                </span>
                <span className="text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">
                  {stats.overallPct}%
                </span>
              </div>
              <div
                className="h-3 w-full overflow-hidden rounded-full bg-[#F5F0FF] dark:bg-[#2A1D5C] border border-[#E7DDFB] dark:border-[#3B2C78]"
                role="progressbar"
                aria-valuenow={stats.overallPct}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full bg-[#6D28D9] transition-all duration-300"
                  style={{ width: `${stats.overallPct}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
                <p className="text-[#4A3F66] dark:text-[#C9BFEA]">Topics Studied</p>
                <p className="mt-0.5 text-base font-bold text-[#2E1A6E] dark:text-white tabular-nums">
                  {stats.studiedInSyllabus} / {stats.totalTopicsInSyllabus}
                </p>
              </div>
              <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
                <p className="text-[#4A3F66] dark:text-[#C9BFEA]">Experiments Done</p>
                <p className="mt-0.5 text-base font-bold text-[#2E1A6E] dark:text-white tabular-nums">
                  {stats.expsDoneInSyllabus} / {stats.totalExpsInSyllabus}
                </p>
              </div>
              <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
                <p className="text-[#4A3F66] dark:text-[#C9BFEA]">Avg Quiz Score</p>
                <p className="mt-0.5 text-base font-bold text-[#B4430C] dark:text-[#FF9F1C] tabular-nums">
                  {stats.quizCount > 0 ? `${stats.avgQuizPct}% (${stats.quizCount})` : 'Not taken'}
                </p>
              </div>
              <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3">
                <p className="text-[#4A3F66] dark:text-[#C9BFEA] flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Learning Time</span>
                </p>
                <p className="mt-0.5 text-base font-bold text-[#2E1A6E] dark:text-white tabular-nums">
                  {formatStudyTime(stats.learningTimeSeconds)}
                </p>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[#4A3F66] dark:text-[#C9BFEA]">
              {language === 'hi'
                ? 'इन आँकड़ों को कैसे पढ़ें: ये केवल वही गिनते हैं जो आपने इस फ़ोन पर किया या चिह्नित किया। प्रगति = ऐप के उपलब्ध अध्यायों में से पूरे किए अध्याय (पूरा आधिकारिक पाठ्यक्रम नहीं — कवरेज देखें)। क्विज़ अंक = आपके दिए क्विज़ में सही उत्तरों का प्रतिशत; यह अभ्यास है, परीक्षा परिणाम या सीखने का प्रमाण नहीं।'
                : language === 'kn'
                  ? 'ಈ ಅಂಕಿಗಳನ್ನು ಹೇಗೆ ಓದುವುದು: ನೀವು ಈ ಫೋನ್‌ನಲ್ಲಿ ಮಾಡಿದ ಅಥವಾ ಗುರುತಿಸಿದ್ದನ್ನು ಮಾತ್ರ ಇವು ಎಣಿಸುತ್ತವೆ. ಪ್ರಗತಿ = ಆ್ಯಪ್‌ನಲ್ಲಿರುವ ಅಧ್ಯಾಯಗಳಲ್ಲಿ ಪೂರ್ಣಗೊಳಿಸಿದವು (ಪೂರ್ಣ ಅಧಿಕೃತ ಪಠ್ಯಕ್ರಮವಲ್ಲ — ವ್ಯಾಪ್ತಿ ನೋಡಿ). ಕ್ವಿಜ್ ಅಂಕ = ನೀವು ಬರೆದ ಕ್ವಿಜ್‌ಗಳಲ್ಲಿ ಸರಿ ಉತ್ತರದ ಶೇಕಡಾ; ಇದು ಅಭ್ಯಾಸ, ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶ ಅಥವಾ ಕಲಿಕೆಯ ಪುರಾವೆ ಅಲ್ಲ.'
                  : 'How to read this: these numbers count only what you did or marked on this phone. Progress = chapters you finished out of the chapters available in the app (not the whole official syllabus — see Coverage). Quiz score = percent of correct answers in the chapter quizzes you took; it is practice, not an exam result or proof of learning.'}
            </p>
          </div>
        )}
      </div>

      {syllabusData?.available && chapters.length > 0 && (
        <OfflineStudyCard
          chapters={chapters}
          language={language}
          syllabusLabel={formatLearningPathSummary(learningPath, language)}
        />
      )}

      {/* Flashcards — spaced revision across the whole selected syllabus */}
      {syllabusData?.available && chapters.length > 0 && (
        <div className="a11y-surface rounded-2xl border border-[#6D28D9]/50 bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-4">
          {!flashOpen ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-bold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD]">
                  {language === 'hi' ? 'फ्लैशकार्ड' : language === 'kn' ? 'ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್' : 'Flashcards'}
                </p>
                <p className="text-sm text-[#22163F] dark:text-[#E4DDFA]">
                  {(() => {
                    const deck = buildDeck(chapters, language);
                    const due = countDue(loadFlashProgress(), deck);
                    return language === 'hi'
                      ? `${deck.length} कार्ड · ${due} आज दोहराने के लिए`
                      : language === 'kn'
                        ? `${deck.length} ಕಾರ್ಡ್ · ${due} ಇಂದು ಪುನರಾವರ್ತನೆಗೆ`
                        : `${deck.length} cards · ${due} due for revision today`;
                  })()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFlashOpen(true)}
                className="min-h-[48px] rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-6 text-sm font-semibold text-white cursor-pointer"
              >
                {language === 'hi' ? 'फ्लैशकार्ड से दोहराएँ' : language === 'kn' ? 'ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಅಭ್ಯಾಸ' : 'Revise with flashcards'}
              </button>
            </div>
          ) : (
            <FlashcardTrainer
              deck={buildDeck(chapters, language)}
              language={language}
              heading={formatLearningPathSummary(learningPath, language)}
              onClose={() => setFlashOpen(false)}
            />
          )}
        </div>
      )}

      {/* Continue Learning + Recents + Bookmarks */}
      {syllabusData?.available && continueChapter && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-6 a11y-surface rounded-2xl border border-[#6D28D9]/50 bg-white dark:bg-[#1F1545] p-5 flex flex-col justify-between gap-4">
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD]">
                Continue Learning
              </p>
              <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
                Chapter {continueChapter.chapterNumber}:{' '}
                {resolveLocalizedText(continueChapter.title, language).text}
              </h2>
              <p className="text-xs sm:text-sm text-[#4A3F66] dark:text-[#C9BFEA] line-clamp-2">
                {resolveLocalizedText(continueChapter.conceptSummary, language).text}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectChapterId(continueChapter.id)}
              className="self-start inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-5 py-2.5 min-h-[46px] text-xs sm:text-sm font-bold text-white cursor-pointer"
            >
              <PlayCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Resume Chapter</span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>
          </div>

          <div className="lg:col-span-6 a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#2E1A6E] dark:text-[#F5F0FF]">
                  Recently Studied
                </p>
                {recentChaptersList.length > 0 ? (
                  <ul className="space-y-1.5">
                    {recentChaptersList.map((rc) => (
                      <li key={rc.id}>
                        <button
                          type="button"
                          onClick={() => onSelectChapterId(rc.id)}
                          className="w-full text-left text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:underline truncate cursor-pointer py-1"
                        >
                          Ch {rc.chapterNumber}: {resolveLocalizedText(rc.title, language).text}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
                    Open any chapter to see your recent study trail here.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wide text-[#2E1A6E] dark:text-[#F5F0FF] flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5 text-[#FF9F1C]" aria-hidden="true" />
                  <span>Bookmarked Topics ({bookmarkedItems.length})</span>
                </p>
                {bookmarkedItems.length > 0 ? (
                  <ul className="space-y-1.5">
                    {bookmarkedItems.slice(0, 4).map((bm) => (
                      <li key={bm.key}>
                        <button
                          type="button"
                          onClick={() => onSelectChapterId(bm.chapterId)}
                          className="w-full text-left text-xs font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] hover:text-[#6D28D9] truncate cursor-pointer py-1"
                        >
                          {bm.topicTitle} · Ch ({bm.chapterTitle})
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
                    Bookmark topics inside a chapter to save them for quick revision.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search & Subject Filter Bar */}
      {syllabusData?.available && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[#4A3F66] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapter, topic, or experiment..."
              aria-label="Search chapter, topic, or experiment"
              className="w-full min-h-[46px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] pl-10 pr-4 py-2 text-sm text-[#2E1A6E] dark:text-white focus:outline-none focus:border-[#6D28D9]"
            />
          </div>

          <div
            role="group"
            aria-label="Filter syllabus by subject"
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-1"
          >
            {(
              [
                { id: 'all', label: 'All Subjects' },
                { id: 'physics', label: 'Physics' },
                { id: 'chemistry', label: 'Chemistry' },
                { id: 'biology', label: 'Biology' },
              ] as { id: SyllabusSubject | 'all'; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubjectFilter(tab.id)}
                aria-pressed={subjectFilter === tab.id}
                className={`px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  subjectFilter === tab.id
                    ? 'bg-[#6D28D9] text-white'
                    : 'text-[#2E1A6E] dark:text-[#E4DDFA] hover:bg-[#F5F0FF] dark:hover:bg-[#2A1D5C]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingSyllabus && (
        <div className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-8 text-center text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
          Loading board-wise syllabus...
        </div>
      )}

      {/* Honest Unavailable Board/Class State */}
      {!loadingSyllabus && syllabusData && !syllabusData.available && (
        <div className="a11y-surface rounded-2xl border border-[#FF9F1C] bg-white dark:bg-[#1F1545] p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#B4430C] dark:text-[#FF9F1C] shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">
                Syllabus Not Yet Verified for This Exact Selection
              </h2>
              <p className="text-sm text-[#22163F] dark:text-[#E4DDFA] leading-relaxed">
                {syllabusData.unavailableReason}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white cursor-pointer"
            >
              Change Class or Board
            </button>
            <button
              type="button"
              onClick={() =>
                onLearningPathChange({
                  ...learningPath,
                  classLevel: 8,
                  board: 'cbse',
                  stateName: '',
                  session: '2025-26',
                  configured: true,
                })
              }
              className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] cursor-pointer"
            >
              Open Verified Class 8 · CBSE (2025–26 Curiosity)
            </button>
          </div>
        </div>
      )}

      {/* 3 Subject Sections: 1. Physics (Primary Featured) 2. Chemistry 3. Biology */}
      {!loadingSyllabus && syllabusData?.available && (
        <div className="space-y-8">
          {/* 1. PHYSICS SECTION (PRIMARY DOMAIN) */}
          {(subjectFilter === 'all' || subjectFilter === 'physics') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD] flex items-center gap-1.5">
                    <Atom className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Primary Science Focus · 1. Physics</span>
                  </p>
                  <h2 className="text-xl font-bold text-[#2E1A6E] dark:text-white">
                    Physics Chapters, Formulas &amp; Virtual Labs ({physicsChapters.length})
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onLaunchPhysicsSim('mechanics')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-white cursor-pointer"
                  >
                    <Atom className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Virtual Physics Lab</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onLaunchPhysicsSim('optics')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
                    <span>Optics &amp; Solver</span>
                  </button>
                </div>
              </div>

              {physicsChapters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {physicsChapters.map((ch) => renderChapterCard(ch, true))}
                </div>
              ) : (
                <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
                  No Physics chapters match your search filter.
                </p>
              )}
            </div>
          )}

          {/* 2. CHEMISTRY SECTION */}
          {(subjectFilter === 'all' || subjectFilter === 'chemistry') && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#B4430C] dark:text-[#FF9F1C] flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>2. Chemistry</span>
                  </p>
                  <h2 className="text-xl font-bold text-[#2E1A6E] dark:text-white">
                    Chemistry Chapters &amp; Chemical Reactions ({chemistryChapters.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchSupportingWorld('chemistry')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                >
                  <FlaskConical className="w-3.5 h-3.5 text-[#B4430C] dark:text-[#FF9F1C]" />
                  <span>Open Chemistry World</span>
                </button>
              </div>

              {chemistryChapters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {chemistryChapters.map((ch) => renderChapterCard(ch))}
                </div>
              ) : (
                <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
                  No Chemistry chapters match your filter.
                </p>
              )}
            </div>
          )}

          {/* 3. BIOLOGY SECTION */}
          {(subjectFilter === 'all' || subjectFilter === 'biology') && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD] flex items-center gap-1.5">
                    <Leaf className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>3. Biology</span>
                  </p>
                  <h2 className="text-xl font-bold text-[#2E1A6E] dark:text-white">
                    Biology Chapters &amp; Life Sciences ({biologyChapters.length})
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onLaunchSupportingWorld('biology')}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
                >
                  <Leaf className="w-3.5 h-3.5 text-[#6D28D9]" />
                  <span>Open Biology World</span>
                </button>
              </div>

              {biologyChapters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {biologyChapters.map((ch) => renderChapterCard(ch))}
                </div>
              ) : (
                <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
                  No Biology chapters match your filter.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
