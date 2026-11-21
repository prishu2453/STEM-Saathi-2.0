import { InlineSimulation } from './InlineSimulation';
import { ChapterSimulations } from './ChapterSimulations';
import { CoverageNotice } from './CoverageNotice';
import { pendingRoadmap } from '../data/cbseRoadmap';
import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  HardDriveDownload,
  HelpCircle,
  Lightbulb,
  Play,
  Search,
  Trash2,
  Volume2,
} from 'lucide-react';
import {
  ACADEMIC_SESSIONS,
  EDUCATION_BOARDS,
  SCHOOL_CLASSES,
  STATE_BOARD_STATES,
  findSyllabusCatalogue,
  getCurriculumPackId,
  resolveLocalizedList,
  resolveLocalizedText,
  type CurriculumChapter,
  type CurriculumExperiment,
} from '../data/curriculumCatalogue';
import { UI_TEXT } from '../data/i18n';
import type { ExperimentId } from '../data/physicsExperiments';
import { useSpeech } from '../hooks/useSpeech';
import {
  downloadCurriculumChapterPack,
  estimateCurriculumChapterPackBytes,
  formatBytes,
  removeOfflinePack,
} from '../lib/offlineStore';
import type {
  AcademicSession,
  ActivityModeFilter,
  CurriculumSubjectFilter,
  EducationBoard,
  Language,
  LearningPathPreference,
  OfflinePackMeta,
  SchoolClass,
  SupportingWorldId,
} from '../types/stem';

const REQUESTS_STORAGE_KEY = 'stem-saathi-syllabus-requests-v1';

interface CurriculumBrowserProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  learningPath: LearningPathPreference;
  onLearningPathChange: (next: LearningPathPreference) => void;
  offlineMetas: OfflinePackMeta[];
  onOfflinePacksChanged: () => void;
  onOpenPhysicsExperiment: (experiment: ExperimentId) => void;
  onOpenSupportingWorld: (world: SupportingWorldId) => void;
}

export const CurriculumBrowser: React.FC<CurriculumBrowserProps> = ({
  language,
  onLanguageChange,
  learningPath,
  onLearningPathChange,
  offlineMetas,
  onOfflinePacksChanged,
  onOpenPhysicsExperiment,
  onOpenSupportingWorld,
}) => {
  const t = UI_TEXT[language];
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);

  const [searchQuery, setSearchQuery] = useState('');
  const [activityFilter, setActivityFilter] = useState<ActivityModeFilter>('all');
  const [topicFilter, setTopicFilter] = useState<string>('all');
  const [selectedChapterId, setSelectedChapterId] = useState<string>('curiosity-ch04');
  const [selectedExperimentId, setSelectedExperimentId] = useState<string | null>(null);

  // Interactive learning state inside an experiment
  const [predictionChoiceMap, setPredictionChoiceMap] = useState<Record<string, number>>({});
  const [revealedHintsMap, setRevealedHintsMap] = useState<Record<string, number>>({});
  const [showWhyMap, setShowWhyMap] = useState<Record<string, boolean>>({});
  const [captionText, setCaptionText] = useState<string | null>(null);

  // Offline download state
  const [downloadingPackId, setDownloadingPackId] = useState<string | null>(null);
  const [packError, setPackError] = useState<string | null>(null);

  // Local syllabus request tracker for unverified boards/classes
  const [savedRequests, setSavedRequests] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(REQUESTS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [justRequestedKey, setJustRequestedKey] = useState<string | null>(null);

  const catalogue = useMemo(() => findSyllabusCatalogue(learningPath), [learningPath]);

  const offlineMetaById = useMemo(() => {
    const map = new Map<string, OfflinePackMeta>();
    for (const meta of offlineMetas) {
      map.set(meta.id, meta);
    }
    return map;
  }, [offlineMetas]);

  const isChapterSavedOffline = (chapterId: string, lang: Language = language): OfflinePackMeta | null => {
    const id = getCurriculumPackId({
      board: learningPath.board,
      stateName: learningPath.stateName,
      classLevel: learningPath.classLevel,
      session: learningPath.session,
      chapterId,
      language: lang,
    });
    return offlineMetaById.get(id) ?? null;
  };

  const anySavedForChapter = (chapterId: string): OfflinePackMeta | null => {
    const exact = isChapterSavedOffline(chapterId, language);
    if (exact) return exact;
    return (
      offlineMetas.find(
        (m) =>
          m.curriculum?.chapterId === chapterId &&
          m.curriculum?.classLevel === learningPath.classLevel &&
          m.curriculum?.board === learningPath.board
      ) ?? null
    );
  };

  // Chapters matching Subject + Search + Topic + Activity-type filter
  const subjectChapters = useMemo(() => {
    if (!catalogue) return [];
    return catalogue.chapters.filter((ch) => ch.primarySubject === learningPath.subject);
  }, [catalogue, learningPath.subject]);

  const topicOptions = useMemo(() => {
    return subjectChapters.map((ch) => ({
      id: ch.id,
      label: resolveLocalizedText(ch.topicTag, language).text,
    }));
  }, [subjectChapters, language]);

  const filteredChapters = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return subjectChapters.filter((ch) => {
      if (topicFilter !== 'all' && ch.id !== topicFilter) return false;

      if (activityFilter === 'offline-saved') {
        if (!anySavedForChapter(ch.id)) return false;
      } else if (activityFilter !== 'all') {
        if (!ch.experiments.some((exp) => exp.activityMode === activityFilter)) return false;
      }

      if (!q) return true;
      const chTitleEn = ch.title.en.toLowerCase();
      const chTitleLoc = resolveLocalizedText(ch.title, language).text.toLowerCase();
      const topicEn = ch.topicTag.en.toLowerCase();
      const expMatches = ch.experiments.some((exp) => {
        const expEn = exp.title.en.toLowerCase();
        const expLoc = resolveLocalizedText(exp.title, language).text.toLowerCase();
        return expEn.includes(q) || expLoc.includes(q);
      });
      return chTitleEn.includes(q) || chTitleLoc.includes(q) || topicEn.includes(q) || expMatches;
    });
  }, [subjectChapters, topicFilter, activityFilter, searchQuery, language, offlineMetas, learningPath]);

  const roadmap = useMemo(() => {
    if (learningPath.board !== 'cbse') return [];
    return pendingRoadmap(
      learningPath.classLevel,
      learningPath.subject,
      subjectChapters.map((ch) => resolveLocalizedText(ch.title, 'en').text)
    );
  }, [learningPath.board, learningPath.classLevel, learningPath.subject, subjectChapters]);

  // Keep selectedChapterId valid when switching subject/filters without losing selection unnecessarily
  useEffect(() => {
    if (filteredChapters.length === 0) return;
    const stillVisible = filteredChapters.some((ch) => ch.id === selectedChapterId);
    if (!stillVisible) {
      setSelectedChapterId(filteredChapters[0].id);
      setSelectedExperimentId(null);
    }
  }, [filteredChapters, selectedChapterId]);

  const activeChapter: CurriculumChapter | null = useMemo(() => {
    return (
      filteredChapters.find((ch) => ch.id === selectedChapterId) ??
      filteredChapters[0] ??
      null
    );
  }, [filteredChapters, selectedChapterId]);

  const visibleExperiments: CurriculumExperiment[] = useMemo(() => {
    if (!activeChapter) return [];
    if (activityFilter === 'all' || activityFilter === 'offline-saved') {
      return activeChapter.experiments;
    }
    return activeChapter.experiments.filter((exp) => exp.activityMode === activityFilter);
  }, [activeChapter, activityFilter]);

  useEffect(() => {
    if (visibleExperiments.length === 0) {
      setSelectedExperimentId(null);
      return;
    }
    if (!selectedExperimentId || !visibleExperiments.some((e) => e.id === selectedExperimentId)) {
      setSelectedExperimentId(visibleExperiments[0].id);
    }
  }, [visibleExperiments, selectedExperimentId]);

  const activeExperiment: CurriculumExperiment | null = useMemo(() => {
    return (
      visibleExperiments.find((e) => e.id === selectedExperimentId) ??
      visibleExperiments[0] ??
      null
    );
  }, [visibleExperiments, selectedExperimentId]);

  const currentChapterPackId = activeChapter
    ? getCurriculumPackId({
        board: learningPath.board,
        stateName: learningPath.stateName,
        classLevel: learningPath.classLevel,
        session: learningPath.session,
        chapterId: activeChapter.id,
        language,
      })
    : '';

  const currentSavedMeta = activeChapter ? isChapterSavedOffline(activeChapter.id, language) : null;

  const estimatedBytes = useMemo(() => {
    if (!activeChapter || !catalogue) return 0;
    return estimateCurriculumChapterPackBytes({
      chapter: activeChapter,
      classLevel: learningPath.classLevel,
      board: learningPath.board,
      stateName: learningPath.stateName,
      session: learningPath.session,
      language,
      sourceTitle: catalogue.sourceTitle,
      sourceUrl: catalogue.sourceUrl,
    });
  }, [activeChapter, catalogue, learningPath, language]);

  const handleToggleChapterOffline = async () => {
    if (!activeChapter || !catalogue) return;
    setPackError(null);
    if (currentSavedMeta) {
      setDownloadingPackId(currentChapterPackId);
      try {
        await removeOfflinePack(currentChapterPackId);
        onOfflinePacksChanged();
      } catch (err) {
        setPackError(err instanceof Error ? err.message : 'Unable to remove saved chapter.');
      } finally {
        setDownloadingPackId(null);
      }
      return;
    }

    setDownloadingPackId(currentChapterPackId);
    try {
      await downloadCurriculumChapterPack({
        chapter: activeChapter,
        classLevel: learningPath.classLevel,
        board: learningPath.board,
        stateName: learningPath.stateName,
        session: learningPath.session,
        language,
        sourceTitle: catalogue.sourceTitle,
        sourceUrl: catalogue.sourceUrl,
      });
      onOfflinePacksChanged();
    } catch (err) {
      setPackError(err instanceof Error ? err.message : 'Unable to save chapter offline.');
    } finally {
      setDownloadingPackId(null);
    }
  };

  const handleRequestCurrentBoard = () => {
    const reqKey = `Class ${learningPath.classLevel} · ${learningPath.board.toUpperCase()}${
      learningPath.board === 'state' && learningPath.stateName ? ` (${learningPath.stateName})` : ''
    } · ${learningPath.session} · ${learningPath.subject}`;
    const updated = savedRequests.includes(reqKey) ? savedRequests : [reqKey, ...savedRequests];
    setSavedRequests(updated);
    setJustRequestedKey(reqKey);
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore storage write errors
    }
  };

  const relationLabel = (rel: CurriculumExperiment['relationType']) => {
    if (rel === 'in-chapter') return t.relationInChapter;
    if (rel === 'official-practical') return t.relationOfficialPractical;
    return t.relationRelatedActivity;
  };

  const activityModeLabel = (mode: CurriculumExperiment['activityMode']) => {
    if (mode === 'home-safe') return t.filterHomeSafe;
    if (mode === 'school-lab') return t.filterSchoolLab;
    return t.filterVirtualSim;
  };

  const handleLaunchSimulation = (exp: CurriculumExperiment) => {
    if (exp.linkedSimExperiment) {
      onOpenPhysicsExperiment(exp.linkedSimExperiment);
      return;
    }
    if (exp.linkedSupportingWorld) {
      onOpenSupportingWorld(exp.linkedSupportingWorld);
    }
  };

  const isMathsUnderVerifiedSample =
    catalogue?.verificationStatus === 'verified-sample' && learningPath.subject === 'mathematics';

  // Compute resolved localized content for the active chapter & experiment
  const chapterTitleResolved = activeChapter ? resolveLocalizedText(activeChapter.title, language) : null;
  const chapterSummaryResolved = activeChapter
    ? resolveLocalizedText(activeChapter.conceptSummary, language)
    : null;

  const expTitleResolved = activeExperiment ? resolveLocalizedText(activeExperiment.title, language) : null;
  const expObjectiveResolved = activeExperiment
    ? resolveLocalizedText(activeExperiment.objective, language)
    : null;
  const expMaterialsResolved = activeExperiment
    ? resolveLocalizedList(activeExperiment.materials, language)
    : null;
  const expSafetyResolved = activeExperiment
    ? resolveLocalizedText(activeExperiment.safetyNote, language)
    : null;
  const expStepsResolved = activeExperiment ? resolveLocalizedList(activeExperiment.steps, language) : null;
  const expColsResolved = activeExperiment
    ? resolveLocalizedList(activeExperiment.observationTable.columns, language)
    : null;
  const expPredQResolved = activeExperiment
    ? resolveLocalizedText(activeExperiment.predictionQuestion, language)
    : null;
  const expPredOptsResolved = activeExperiment
    ? resolveLocalizedList(activeExperiment.predictionOptions, language)
    : null;
  const expHintsResolved = activeExperiment ? resolveLocalizedList(activeExperiment.hints, language) : null;
  const expWhyResolved = activeExperiment
    ? resolveLocalizedText(activeExperiment.whyItHappens, language)
    : null;

  const anyTranslationFallback =
    chapterTitleResolved?.isFallbackEnglish ||
    chapterSummaryResolved?.isFallbackEnglish ||
    expTitleResolved?.isFallbackEnglish ||
    expObjectiveResolved?.isFallbackEnglish ||
    expMaterialsResolved?.isFallbackEnglish ||
    expSafetyResolved?.isFallbackEnglish ||
    expStepsResolved?.isFallbackEnglish ||
    expColsResolved?.isFallbackEnglish ||
    expPredQResolved?.isFallbackEnglish ||
    expPredOptsResolved?.isFallbackEnglish ||
    expHintsResolved?.isFallbackEnglish ||
    expWhyResolved?.isFallbackEnglish;

  return (
    <section
      aria-labelledby="curriculum-browser-heading"
      className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6"
    >
      {/* Header */}
      <div className="pb-4 border-b border-[#E7DDFB] dark:border-[#3B2C78]">
        <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
          {t.myLearningPathLabel} · {t.localPreferenceNote}
        </p>
        <h1
          id="curriculum-browser-heading"
          className="text-2xl sm:text-3xl font-bold text-[#2E1A6E] dark:text-[#F5F0FF] mt-1 text-balance"
        >
          {t.chaptersExperimentsTitle}
        </h1>
        <p className="text-sm text-[#22163F] dark:text-[#E4DDFA] mt-1 max-w-3xl">
          {t.chaptersExperimentsDesc}
        </p>
      </div>

      {/* Step-by-Step Filter Row: Class -> Board -> State (only if State Board) -> Subject -> Language */}
      <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Class */}
          <div>
            <label
              htmlFor="curr-class-select"
              className="block text-xs font-semibold text-[#22163F] dark:text-[#C9BFEA] mb-1"
            >
              1. {t.classLabel}
            </label>
            <select
              id="curr-class-select"
              value={learningPath.classLevel}
              onChange={(e) =>
                onLearningPathChange({
                  ...learningPath,
                  classLevel: Number(e.target.value) as SchoolClass,
                  configured: true,
                })
              }
              className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs sm:text-sm font-medium text-[#2E1A6E] dark:text-[#F5F0FF]"
            >
              {SCHOOL_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  {t.classLabel} {cls}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Board */}
          <div>
            <label
              htmlFor="curr-board-select"
              className="block text-xs font-semibold text-[#22163F] dark:text-[#C9BFEA] mb-1"
            >
              2. {t.boardLabel}
            </label>
            <select
              id="curr-board-select"
              value={learningPath.board}
              onChange={(e) => {
                const nextBoard = e.target.value as EducationBoard;
                onLearningPathChange({
                  ...learningPath,
                  board: nextBoard,
                  stateName: nextBoard === 'state' ? learningPath.stateName || 'Karnataka' : '',
                  configured: true,
                });
              }}
              className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs sm:text-sm font-medium text-[#2E1A6E] dark:text-[#F5F0FF]"
            >
              {EDUCATION_BOARDS.map((b) => (
                <option key={b.id} value={b.id}>
                  {resolveLocalizedText(b.label, language).text}
                </option>
              ))}
            </select>
          </div>

          {/* 3. State (only when State Board) */}
          {learningPath.board === 'state' && (
            <div>
              <label
                htmlFor="curr-state-select"
                className="block text-xs font-semibold text-[#22163F] dark:text-[#C9BFEA] mb-1"
              >
                3. {t.stateLabel}
              </label>
              <select
                id="curr-state-select"
                value={learningPath.stateName || 'Karnataka'}
                onChange={(e) =>
                  onLearningPathChange({
                    ...learningPath,
                    stateName: e.target.value,
                    configured: true,
                  })
                }
                className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs sm:text-sm font-medium text-[#2E1A6E] dark:text-[#F5F0FF]"
              >
                {STATE_BOARD_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Session (optional) */}
          <div>
            <label
              htmlFor="curr-session-select"
              className="block text-xs font-semibold text-[#22163F] dark:text-[#C9BFEA] mb-1"
            >
              {learningPath.board === 'state' ? '4.' : '3.'} {t.sessionLabel}
            </label>
            <select
              id="curr-session-select"
              value={learningPath.session}
              onChange={(e) =>
                onLearningPathChange({
                  ...learningPath,
                  session: e.target.value as AcademicSession,
                  configured: true,
                })
              }
              className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs sm:text-sm font-medium text-[#2E1A6E] dark:text-[#F5F0FF]"
            >
              {ACADEMIC_SESSIONS.map((sess) => (
                <option key={sess.id} value={sess.id}>
                  {resolveLocalizedText(sess.label, language).text}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Subject (defaults to Physics) */}
          <div>
            <label
              htmlFor="curr-subject-select"
              className="block text-xs font-semibold text-[#22163F] dark:text-[#C9BFEA] mb-1"
            >
              {learningPath.board === 'state' ? '5.' : '4.'} {t.subjectFilterLabel}
            </label>
            <select
              id="curr-subject-select"
              value={learningPath.subject}
              onChange={(e) => {
                setTopicFilter('all');
                onLearningPathChange({
                  ...learningPath,
                  subject: e.target.value as CurriculumSubjectFilter,
                  configured: true,
                });
              }}
              className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs sm:text-sm font-medium text-[#2E1A6E] dark:text-[#F5F0FF]"
            >
              <option value="physics">{t.menuSectionPhysics} (Science)</option>
              <option value="chemistry">{t.subjChemistry} (Science)</option>
              <option value="biology">{t.subjBiology} (Science)</option>
              <option value="mathematics">{t.subjMathematics}</option>
            </select>
          </div>

          {/* 5. Language */}
          <div>
            <label
              htmlFor="curr-lang-select"
              className="block text-xs font-semibold text-[#22163F] dark:text-[#C9BFEA] mb-1"
            >
              {learningPath.board === 'state' ? '6.' : '5.'} {t.actionChooseLanguage}
            </label>
            <select
              id="curr-lang-select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as Language)}
              className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs sm:text-sm font-medium text-[#2E1A6E] dark:text-[#F5F0FF]"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="kn">ಕನ್ನಡ</option>
            </select>
          </div>
        </div>

        <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">{t.sessionChangeExplain}</p>
      </div>

      {/* UNVERIFIED BOARD/CLASS/SESSION OR MATHEMATICS PLACEHOLDER STATE */}
      {!catalogue || isMathsUnderVerifiedSample ? (
        <div className="animate-panel-reveal a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#B4430C] dark:text-[#FF9F1C] shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5">
              <h2 className="text-lg font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
                {t.contentBeingAddedTitle}
              </h2>
              <p className="text-sm text-[#22163F] dark:text-[#E4DDFA] max-w-2xl">
                {isMathsUnderVerifiedSample
                  ? `${t.contentBeingAddedDesc} (${catalogue.bookTitle} Science chapters are available; Mathematics chapters can be explored in the Mathematics playground below.)`
                  : t.contentBeingAddedDesc}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => {
                setTopicFilter('all');
                onLearningPathChange({
                  classLevel: 8,
                  board: 'cbse',
                  stateName: '',
                  session: '2025-26',
                  subject: 'physics',
                  configured: true,
                });
              }}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.tryClass8CbseBtn}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                learningPath.subject === 'physics'
                  ? onOpenPhysicsExperiment('mechanics')
                  : onOpenSupportingWorld(
                      learningPath.subject === 'chemistry' ||
                        learningPath.subject === 'biology' ||
                        learningPath.subject === 'mathematics'
                        ? learningPath.subject
                        : 'chemistry'
                    )
              }
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] hover:border-[#6D28D9] px-4 py-2 text-xs sm:text-sm font-medium text-[#2E1A6E] dark:text-[#F5F0FF] cursor-pointer"
            >
              <span>
                {learningPath.subject === 'physics'
                  ? t.openGeneralPhysicsBtn
                  : `${t.openWorld}: ${learningPath.subject}`}
              </span>
              <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleRequestCurrentBoard}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-4 py-2 text-xs font-medium text-[#22163F] dark:text-[#E4DDFA] hover:border-[#6D28D9] cursor-pointer"
            >
              <span>{t.requestBoardNoteLabel}</span>
            </button>
          </div>

          {justRequestedKey && (
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              {t.requestedBoardSavedMsg} ({justRequestedKey})
            </p>
          )}
        </div>
      ) : (
        /* VERIFIED CATALOGUE: SEARCH, FILTERS, CHAPTER LIST & CHAPTER/EXPERIMENT READER */
        <>
          {/* Search + Topic + Activity-Type Filters */}
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              <div className="md:col-span-7 relative">
                <Search
                  className="w-4 h-4 text-[#4A3F66] dark:text-[#C9BFEA] absolute left-3.5 top-1/2 -translate-y-1/2"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchChaptersPlaceholder}
                  aria-label={t.searchChaptersPlaceholder}
                  className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] pl-10 pr-3 py-2 text-xs sm:text-sm text-[#2E1A6E] dark:text-[#F5F0FF] placeholder:text-[#4A3F66]"
                />
              </div>

              <div className="md:col-span-5">
                <select
                  aria-label="Filter by chapter topic"
                  value={topicFilter}
                  onChange={(e) => setTopicFilter(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs sm:text-sm text-[#2E1A6E] dark:text-[#F5F0FF]"
                >
                  <option value="all">All topics ({subjectChapters.length})</option>
                  {topicOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Activity-type segmented filters */}
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Experiment activity filters">
              {(
                [
                  { id: 'all', label: t.filterAll },
                  { id: 'home-safe', label: t.filterHomeSafe },
                  { id: 'virtual-sim', label: t.filterVirtualSim },
                  { id: 'school-lab', label: t.filterSchoolLab },
                  { id: 'offline-saved', label: t.filterOfflineSaved },
                ] as { id: ActivityModeFilter; label: string }[]
              ).map((f) => {
                const active = activityFilter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActivityFilter(f.id)}
                    aria-pressed={active}
                    className={`min-h-[40px] rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-[#6D28D9] text-white'
                        : 'bg-[#FFF3E6] dark:bg-[#2A1D5C] text-[#22163F] dark:text-[#E4DDFA] hover:text-[#2E1A6E] dark:hover:text-white'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2-Column Split: Chapter List (left 4 cols) + Active Chapter & Experiment View (right 8 cols) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Chapter List */}
            <aside
              aria-label="Chapter list"
              className="lg:col-span-4 a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-3"
            >
              <div className="mb-3">
                <CoverageNotice
                  classLevel={learningPath.classLevel}
                  board={learningPath.board}
                  stateName={learningPath.stateName}
                  subject={learningPath.subject as never}
                  language={language}
                />
              </div>
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#E7DDFB] dark:border-[#3B2C78]">
                <div>
                  <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
                    {catalogue.bookTitle}
                  </p>
                  <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
                    {filteredChapters.length} chapters shown · {learningPath.board === 'state' && learningPath.stateName ? `${learningPath.stateName} Board` : learningPath.board.toUpperCase()} Class {learningPath.classLevel}
                  </p>
                </div>
              </div>

              {filteredChapters.length === 0 ? (
                <div className="py-6 text-center space-y-2">
                  <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
                    No chapters match your current search or filter.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setTopicFilter('all');
                      setActivityFilter('all');
                    }}
                    className="min-h-[38px] rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-1.5 text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] cursor-pointer"
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredChapters.map((ch) => {
                    const active = activeChapter?.id === ch.id;
                    const chTitle = resolveLocalizedText(ch.title, language).text;
                    const chTopic = resolveLocalizedText(ch.topicTag, language).text;
                    const savedMeta = anySavedForChapter(ch.id);
                    return (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setSelectedChapterId(ch.id);
                          setSelectedExperimentId(ch.experiments[0]?.id ?? null);
                        }}
                        aria-current={active ? 'true' : undefined}
                        className={`w-full text-left rounded-xl border p-3.5 min-h-[54px] transition-colors cursor-pointer space-y-1 ${
                          active
                            ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                            : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs sm:text-sm font-semibold leading-snug">
                            Ch {ch.chapterNumber}: {chTitle}
                          </span>
                          <ChevronRight
                            className={`w-4 h-4 shrink-0 mt-0.5 ${active ? 'text-white' : 'text-[#4A3F66] dark:text-[#C9BFEA]'}`}
                            aria-hidden="true"
                          />
                        </div>
                        <div
                          className={`text-[11px] flex flex-wrap items-center gap-x-1.5 gap-y-0.5 tabular-nums ${
                            active ? 'text-[#E6F6F4]' : 'text-[#4A3F66] dark:text-[#C9BFEA]'
                          }`}
                        >
                          <span>{chTopic}</span>
                          <span aria-hidden="true">·</span>
                          <span>{ch.experiments.length} activities</span>
                          {savedMeta && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className={active ? 'text-white font-semibold' : 'text-emerald-700 dark:text-emerald-400 font-semibold'}>
                                Offline ({savedMeta.curriculum?.language.toUpperCase()})
                              </span>
                            </>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              {roadmap.length > 0 && (
                <div className="mt-4 rounded-xl border border-dashed border-[#B6A6E0] dark:border-[#3B2C78] p-3">
                  <p className="text-sm font-semibold text-[#2E1A6E] dark:text-white">
                    Also in the NCERT book — lessons coming soon
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
                    {roadmap.map((r) => (
                      <li key={r.no + r.title}>
                        Ch {r.no}: {r.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            {/* Active Chapter + Experiment Detail View */}
            <div className="lg:col-span-8 space-y-5">
              {activeChapter && chapterTitleResolved && chapterSummaryResolved && (
                <div
                  key={activeChapter.id}
                  className="animate-panel-reveal a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-6 space-y-5"
                >
                  {/* Prominent Separate Experiment Language Selector (Does not lose selected chapter/experiment) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E7DDFB] dark:border-[#3B2C78]">
                    <div>
                      <p className="text-xs font-medium text-[#4A3F66] dark:text-[#C9BFEA]">
                        {activeChapter.textbookName} · Chapter {activeChapter.chapterNumber}
                      </p>
                      <h2 className="text-xl sm:text-2xl font-bold text-[#2E1A6E] dark:text-[#F5F0FF] mt-0.5">
                        {chapterTitleResolved.text}
                      </h2>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-1 shrink-0">
                      <span className="text-[11px] font-semibold text-[#4A3F66] dark:text-[#C9BFEA]">
                        {t.experimentLanguageLabel}
                      </span>
                      <div
                        role="group"
                        aria-label={t.experimentLanguageLabel}
                        className="inline-flex items-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FFF3E6] dark:bg-[#2A1D5C] p-1"
                      >
                        {(
                          [
                            { id: 'en', label: 'English' },
                            { id: 'hi', label: 'हिन्दी' },
                            { id: 'kn', label: 'ಕನ್ನಡ' },
                          ] as { id: Language; label: string }[]
                        ).map((langOpt) => (
                          <button
                            key={langOpt.id}
                            type="button"
                            onClick={() => onLanguageChange(langOpt.id)}
                            className={`min-h-[36px] px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              language === langOpt.id
                                ? 'bg-[#6D28D9] text-white'
                                : 'text-[#22163F] dark:text-[#E4DDFA] hover:text-[#2E1A6E] dark:hover:text-white'
                            }`}
                          >
                            {langOpt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Honest Translation Fallback Banner if any string fell back to English */}
                  {anyTranslationFallback && language !== 'en' && (
                    <div className="rounded-xl border border-[#FF9F1C]/50 bg-[#FF9F1C]/15 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-[#2E1A6E] dark:text-[#F5F0FF]">
                      <span>{t.translationMissingNotice}</span>
                      <button
                        type="button"
                        onClick={() => onLanguageChange('en')}
                        className="rounded-lg border border-[#FF9F1C]/60 bg-white dark:bg-[#2A1D5C] px-3 py-1.5 font-semibold cursor-pointer"
                      >
                        {t.switchEnglishFallback}
                      </button>
                    </div>
                  )}

                  {/* Chapter Concept Summary */}
                  <p className="text-sm leading-relaxed text-[#22163F] dark:text-[#E4DDFA]">
                    {chapterSummaryResolved.text}
                  </p>

                  <ChapterSimulations
                    key={`sims-${activeChapter.id}`}
                    chapterId={activeChapter.id}
                    titleEn={activeChapter.title.en}
                    subject={activeChapter.primarySubject}
                    language={language}
                  />

                  {/* Chapter Offline Pack Download Bar (Class + Board + Chapter + Language + Size + Honest Saved State) */}
                  <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] flex items-center gap-1.5">
                        {currentSavedMeta ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
                            <span>
                              {t.savedOfflineChapterLabel} ({formatBytes(currentSavedMeta.coreSizeBytes)})
                            </span>
                          </>
                        ) : (
                          <>
                            <HardDriveDownload className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD] shrink-0" aria-hidden="true" />
                            <span>
                              {t.downloadChapterOfflineBtn} · {formatBytes(estimatedBytes)}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">
                        Class {learningPath.classLevel} ·{' '}
                        {learningPath.board === 'state' && learningPath.stateName
                          ? `${learningPath.stateName} State Board`
                          : learningPath.board.toUpperCase()}{' '}
                        · Ch {activeChapter.chapterNumber} · {language.toUpperCase()}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={downloadingPackId === currentChapterPackId}
                      onClick={() => void handleToggleChapterOffline()}
                      className={`min-h-[42px] inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        currentSavedMeta
                          ? 'border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#22163F] dark:text-[#E4DDFA] hover:border-red-500'
                          : 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white'
                      }`}
                    >
                      {currentSavedMeta ? (
                        <>
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>{t.removeOfflineBtn}</span>
                        </>
                      ) : (
                        <>
                          <HardDriveDownload className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>
                            {downloadingPackId === currentChapterPackId
                              ? t.statusDownloading
                              : `${t.downloadChapterOfflineBtn} (${formatBytes(estimatedBytes)})`}
                          </span>
                        </>
                      )}
                    </button>
                  </div>

                  {packError && (
                    <p className="text-xs text-red-600 dark:text-red-400">{packError}</p>
                  )}

                  {/* Experiment Switcher if chapter has multiple activities */}
                  {visibleExperiments.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chapter experiments">
                        {visibleExperiments.map((exp) => {
                          const isSel = activeExperiment?.id === exp.id;
                          const expTitle = resolveLocalizedText(exp.title, language).text;
                          return (
                            <button
                              key={exp.id}
                              type="button"
                              role="tab"
                              aria-selected={isSel}
                              onClick={() => setSelectedExperimentId(exp.id)}
                              className={`min-h-[42px] rounded-xl border px-3.5 py-2 text-xs font-semibold text-left transition-colors cursor-pointer ${
                                isSel
                                  ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                                  : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]'
                              }`}
                            >
                              {expTitle}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Active Experiment Full Offline Guide */}
                  {activeExperiment &&
                    expTitleResolved &&
                    expObjectiveResolved &&
                    expMaterialsResolved &&
                    expSafetyResolved &&
                    expStepsResolved &&
                    expColsResolved &&
                    expPredQResolved &&
                    expPredOptsResolved &&
                    expHintsResolved &&
                    expWhyResolved && (
                      <div
                        key={activeExperiment.id}
                        className="animate-panel-reveal pt-4 border-t border-[#E7DDFB] dark:border-[#3B2C78] space-y-5"
                      >
                        {/* Experiment Title + Honest Relationship Metadata + Read Aloud + Simulation CTA */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
                              <span>{relationLabel(activeExperiment.relationType)}</span>
                              <span aria-hidden="true"> · </span>
                              <span>{activityModeLabel(activeExperiment.activityMode)}</span>
                            </p>
                            <h3 className="text-lg sm:text-xl font-bold text-[#2E1A6E] dark:text-[#F5F0FF]">
                              {expTitleResolved.text}
                            </h3>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (isSpeaking) {
                                  stopSpeaking();
                                  setCaptionText(null);
                                } else {
                                  const spoken = `${expTitleResolved.text}. ${t.objectiveLabel}: ${expObjectiveResolved.text}. ${t.safetyNoteLabel}: ${expSafetyResolved.text}. ${t.stepsLabel}: ${expStepsResolved.items.join(' ')} ${t.whyDidThisHappenLabel}: ${expWhyResolved.text}`;
                                  setCaptionText(spoken);
                                  speak(spoken);
                                }
                              }}
                              className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-3.5 py-2 text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] cursor-pointer"
                            >
                              <Volume2 className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD]" aria-hidden="true" />
                              <span>{isSpeaking ? t.stopReading : t.readAloud}</span>
                            </button>

                            {activeExperiment.linkedSupportingWorld && !activeExperiment.linkedSimExperiment && (
                              <button
                                type="button"
                                onClick={() => handleLaunchSimulation(activeExperiment)}
                                className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-2 text-xs font-semibold text-white transition-colors cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{t.openSimulationBtn}</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {activeExperiment.linkedSimExperiment && (
                          <InlineSimulation
                            key={activeExperiment.id}
                            experimentId={activeExperiment.linkedSimExperiment}
                            language={language}
                          />
                        )}

                        {captionText && (
                          <div className="rounded-xl border border-[#6D28D9]/35 bg-[#6D28D9]/10 p-3 text-xs text-[#2E1A6E] dark:text-[#F5F0FF]">
                            <span className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
                              {t.captionPrefix}:{' '}
                            </span>
                            <span>{captionText}</span>
                          </div>
                        )}

                        {/* Objective & Materials */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-1.5">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD]">
                              {t.objectiveLabel}
                            </h4>
                            <p className="text-xs sm:text-sm leading-relaxed text-[#22163F] dark:text-[#E4DDFA]">
                              {expObjectiveResolved.text}
                            </p>
                          </div>

                          <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-1.5">
                            <h4 className="text-xs font-semibold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD]">
                              {t.materialsLabel}
                            </h4>
                            <ul className="list-disc pl-4 space-y-1 text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA]">
                              {expMaterialsResolved.items.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Safety Note */}
                        <div className="rounded-xl border border-[#FF9F1C]/50 bg-[#FF9F1C]/15 p-3.5 flex items-start gap-2.5 text-xs sm:text-sm text-[#2E1A6E] dark:text-[#F5F0FF]">
                          <AlertTriangle className="w-4 h-4 text-[#B4430C] dark:text-[#FF9F1C] shrink-0 mt-0.5" aria-hidden="true" />
                          <div>
                            <span className="font-semibold">{t.safetyNoteLabel}: </span>
                            <span>{expSafetyResolved.text}</span>
                          </div>
                        </div>

                        {/* Steps */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#4A3F66] dark:text-[#C9BFEA]">
                            {t.stepsLabel}
                          </h4>
                          <ol className="space-y-2">
                            {expStepsResolved.items.map((step, idx) => (
                              <li
                                key={idx}
                                className="flex items-start gap-3 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 text-xs sm:text-sm text-[#2E1A6E] dark:text-[#F5F0FF]"
                              >
                                <span className="w-6 h-6 rounded-lg bg-[#6D28D9] text-white text-xs font-mono font-semibold flex items-center justify-center shrink-0 tabular-nums">
                                  {idx + 1}
                                </span>
                                <span className="leading-relaxed">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Observation Table */}
                        <div className="space-y-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wide text-[#4A3F66] dark:text-[#C9BFEA]">
                            {t.observationTableLabel}
                          </h4>
                          <div className="overflow-x-auto rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78]">
                            <table className="w-full text-left text-xs tabular-nums">
                              <thead className="bg-[#FFF3E6] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F5F0FF]">
                                <tr>
                                  {expColsResolved.items.map((col, idx) => (
                                    <th key={idx} className="px-3 py-2.5 font-semibold">
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#E7DDFB] dark:divide-[#3B2C78]">
                                {activeExperiment.observationTable.sampleRows.map((row, rIdx) => (
                                  <tr key={rIdx} className="bg-white dark:bg-[#1F1545]">
                                    {row.map((cell, cIdx) => (
                                      <td key={cIdx} className="px-3 py-2 text-[#22163F] dark:text-[#E4DDFA]">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* "What should happen?" Prediction + Hints + "Why did this happen?" */}
                        <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD] shrink-0" aria-hidden="true" />
                            <h4 className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
                              {t.whatShouldHappenLabel}
                            </h4>
                          </div>

                          <p className="text-xs sm:text-sm text-[#22163F] dark:text-[#E4DDFA]">
                            {expPredQResolved.text}
                          </p>

                          <div className="space-y-1.5">
                            {expPredOptsResolved.items.map((opt, idx) => {
                              const picked = predictionChoiceMap[activeExperiment.id];
                              const isPicked = picked === idx;
                              const hasAnswered = picked !== undefined;
                              const isCorrect = idx === activeExperiment.predictionCorrectIndex;
                              let cls =
                                'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]';
                              if (hasAnswered) {
                                if (isCorrect) {
                                  cls =
                                    'border-emerald-600 bg-emerald-500/15 text-emerald-900 dark:text-emerald-200';
                                } else if (isPicked) {
                                  cls =
                                    'border-[#FF9F1C] bg-[#FF9F1C]/15 text-[#2E1A6E] dark:text-[#F5F0FF]';
                                }
                              }
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() =>
                                    setPredictionChoiceMap((prev) => ({
                                      ...prev,
                                      [activeExperiment.id]: idx,
                                    }))
                                  }
                                  className={`w-full min-h-[42px] text-left rounded-xl border px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors cursor-pointer ${cls}`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            {expHintsResolved.items.length > 0 && (
                              <button
                                type="button"
                                onClick={() =>
                                  setRevealedHintsMap((prev) => {
                                    const current = prev[activeExperiment.id] ?? 0;
                                    const next =
                                      current >= expHintsResolved.items.length ? 0 : current + 1;
                                    return { ...prev, [activeExperiment.id]: next };
                                  })
                                }
                                className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-3 py-1.5 text-xs font-medium text-[#22163F] dark:text-[#E4DDFA] hover:border-[#6D28D9] cursor-pointer"
                              >
                                <Lightbulb className="w-3.5 h-3.5 text-[#B4430C] dark:text-[#FF9F1C]" aria-hidden="true" />
                                <span>{t.showHintLabel}</span>
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                setShowWhyMap((prev) => ({
                                  ...prev,
                                  [activeExperiment.id]: !prev[activeExperiment.id],
                                }))
                              }
                              className="min-h-[38px] inline-flex items-center gap-1.5 rounded-lg border border-[#6D28D9]/40 bg-[#6D28D9]/10 px-3 py-1.5 text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] cursor-pointer"
                            >
                              <span>{t.whyDidThisHappenLabel}</span>
                            </button>
                          </div>

                          {(revealedHintsMap[activeExperiment.id] ?? 0) > 0 && (
                            <div className="space-y-1 text-xs text-[#2E1A6E] dark:text-[#F5F0FF] bg-[#FF9F1C]/15 rounded-lg p-3">
                              {expHintsResolved.items
                                .slice(0, revealedHintsMap[activeExperiment.id])
                                .map((hint, hIdx) => (
                                  <p key={hIdx}>
                                    <span className="font-semibold">Hint {hIdx + 1}: </span>
                                    {hint}
                                  </p>
                                ))}
                            </div>
                          )}

                          {(showWhyMap[activeExperiment.id] ||
                            predictionChoiceMap[activeExperiment.id] !== undefined) && (
                            <div className="rounded-lg border border-[#6D28D9]/30 bg-white dark:bg-[#1F1545] p-3 text-xs sm:text-sm leading-relaxed text-[#22163F] dark:text-[#E4DDFA]">
                              <p className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD] mb-1">
                                {t.whyDidThisHappenLabel}
                              </p>
                              <p>{expWhyResolved.text}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>

          {/* Honest Coverage Note & Curriculum Source Attribution */}
          <footer className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 space-y-1.5 text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
            <p>{resolveLocalizedText(catalogue.coverageNote, language).text}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
                {t.curriculumSourceLabel}:
              </span>
              <a
                href={catalogue.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#5B21B6] dark:text-[#C4B5FD] hover:underline"
              >
                <span>{catalogue.sourceTitle}</span>
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
              {catalogue.secondarySourceUrl && catalogue.secondarySourceTitle && (
                <>
                  <span aria-hidden="true">·</span>
                  <a
                    href={catalogue.secondarySourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#5B21B6] dark:text-[#C4B5FD] hover:underline"
                  >
                    <span>{catalogue.secondarySourceTitle}</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span>Verified: {catalogue.lastVerified}</span>
            </div>
          </footer>
        </>
      )}
    </section>
  );
};
