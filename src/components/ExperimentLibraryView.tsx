import React, { useEffect, useState } from 'react';
import { FlaskConical, RotateCcw, Search, Sparkles } from 'lucide-react';
import { SCHOOL_CLASSES, STATE_BOARD_STATES } from '../../shared/syllabus/meta';
import type { StructuredExperiment, SyllabusSubject } from '../../shared/syllabus/types';
import { fetchExperiments } from '../lib/syllabusApi';
import type { ExperimentId } from '../data/physicsExperiments';
import type {
  ActivityModeFilter,
  EducationBoard,
  ExperimentRelationType,
  Language,
  LearningPathPreference,
  SchoolClass,
  StudentProgress,
  SupportingWorldId,
} from '../types/stem';
import { StructuredExperimentCard } from './StructuredExperimentCard';

interface ExperimentLibraryViewProps {
  language: Language;
  learningPath: LearningPathPreference;
  progress: StudentProgress;
  onToggleExperimentComplete: (expId: string) => void;
  onLaunchPhysicsSim: (topic: ExperimentId) => void;
  onLaunchSupportingWorld: (world: SupportingWorldId) => void;
  onOpenChapter: (chapterId: string) => void;
}

export const ExperimentLibraryView: React.FC<ExperimentLibraryViewProps> = ({
  language,
  learningPath,
  progress,
  onToggleExperimentComplete,
  onLaunchPhysicsSim,
  onLaunchSupportingWorld,
  onOpenChapter,
}) => {
  const [classFilter, setClassFilter] = useState<SchoolClass | 'all'>('all');
  const [boardFilter, setBoardFilter] = useState<EducationBoard | 'all'>('all');
  const [stateFilter, setStateFilter] = useState<string>('Karnataka');
  const [subjectFilter, setSubjectFilter] = useState<SyllabusSubject | 'all'>('all');
  const [relationFilter, setRelationFilter] = useState<ExperimentRelationType | 'all'>('all');
  const [modeFilter, setModeFilter] =
    useState<Exclude<ActivityModeFilter, 'offline-saved'>>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [experiments, setExperiments] = useState<StructuredExperiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void fetchExperiments({
      classLevel: classFilter,
      board: boardFilter,
      stateName: boardFilter === 'state' ? stateFilter : undefined,
      subject: subjectFilter,
      relationType: relationFilter,
      activityMode: modeFilter,
      q: searchQuery,
    }).then((list) => {
      if (active) {
        setExperiments(list);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [
    classFilter,
    boardFilter,
    stateFilter,
    subjectFilter,
    relationFilter,
    modeFilter,
    searchQuery,
  ]);

  const completedSet = new Set(progress.completedExperimentIds ?? []);
  const completedCount = experiments.filter((e) => completedSet.has(e.id)).length;

  const handleMatchMyProfile = () => {
    setClassFilter(learningPath.classLevel);
    setBoardFilter(learningPath.board === 'other' ? 'all' : learningPath.board);
    if (learningPath.board === 'state' && learningPath.stateName) {
      setStateFilter(learningPath.stateName);
    }
  };

  const handleResetFilters = () => {
    setClassFilter('all');
    setBoardFilter('all');
    setSubjectFilter('all');
    setRelationFilter('all');
    setModeFilter('all');
    setSearchQuery('');
  };

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 py-5 sm:py-8 space-y-6">
      {/* Header Card */}
      <header className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD] flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Gyaan Graph · Experiment Library</span>
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#2E1A6E] dark:text-white tracking-tight">
              Structured Experiments &amp; Board Practicals
            </h1>
            <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA] max-w-3xl">
              Explore official prescribed board practicals, safe household science activities, and
              interactive virtual lab guides—complete with materials, observation tables, and
              safety precautions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleMatchMyProfile}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white cursor-pointer"
            >
              <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Match My Class ({learningPath.classLevel})</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Reset Filters</span>
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
          <div className="relative sm:col-span-2 lg:col-span-2">
            <Search
              className="w-4 h-4 text-[#4A3F66] absolute left-3.5 top-1/2 -translate-y-1/2"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search experiment, material, or principle..."
              aria-label="Search experiment library"
              className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] pl-10 pr-3.5 py-2 text-xs sm:text-sm text-[#2E1A6E] dark:text-white focus:outline-none focus:border-[#6D28D9]"
            />
          </div>

          <select
            aria-label="Filter by Class"
            value={classFilter}
            onChange={(e) =>
              setClassFilter(e.target.value === 'all' ? 'all' : (Number(e.target.value) as SchoolClass))
            }
            className="min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]"
          >
            <option value="all">All Classes (6–12)</option>
            {SCHOOL_CLASSES.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by Board"
            value={boardFilter}
            onChange={(e) => setBoardFilter(e.target.value as EducationBoard | 'all')}
            className="min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]"
          >
            <option value="all">All Boards</option>
            <option value="cbse">CBSE</option>
            <option value="cisce">ICSE</option>
            <option value="state">State Board</option>
          </select>

          <select
            aria-label="Filter by Subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value as SyllabusSubject | 'all')}
            className="min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]"
          >
            <option value="all">All Subjects</option>
            <option value="physics">Physics (Primary)</option>
            <option value="chemistry">Chemistry</option>
            <option value="biology">Biology</option>
          </select>
        </div>

        {/* Conditional State + Practical Distinction + Mode Filter Row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {boardFilter === 'state' && (
            <select
              aria-label="Filter by State Board"
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="min-h-[40px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-1.5 text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]"
            >
              {STATE_BOARD_STATES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}

          <div
            role="group"
            aria-label="Filter by Practical Type"
            className="flex flex-wrap gap-1 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-1"
          >
            {(
              [
                { id: 'all', label: 'All Activities' },
                { id: 'official-practical', label: 'Official Prescribed Practicals' },
                { id: 'in-chapter', label: 'In-Chapter Experiments' },
                { id: 'related-activity', label: 'Additional Activities' },
              ] as { id: ExperimentRelationType | 'all'; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setRelationFilter(item.id)}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold cursor-pointer ${
                  relationFilter === item.id
                    ? 'bg-[#6D28D9] text-white'
                    : 'text-[#2E1A6E] dark:text-[#E4DDFA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Filter by Equipment Mode"
            className="flex flex-wrap gap-1 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-1"
          >
            {(
              [
                { id: 'all', label: 'Any Mode' },
                { id: 'home-safe', label: 'Home Safe' },
                { id: 'virtual-sim', label: 'Virtual Sim' },
                { id: 'school-lab', label: 'School Lab' },
              ] as { id: Exclude<ActivityModeFilter, 'offline-saved'>; label: string }[]
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setModeFilter(m.id)}
                className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-semibold cursor-pointer ${
                  modeFilter === m.id
                    ? 'bg-[#2E1A6E] text-white'
                    : 'text-[#2E1A6E] dark:text-[#E4DDFA]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
          Showing <strong className="text-[#2E1A6E] dark:text-white">{experiments.length}</strong>{' '}
          structured experiments · {completedCount} completed in this view
        </p>
      </header>

      {/* Experiment List */}
      {loading ? (
        <div className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-8 text-center text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
          Loading structured experiments...
        </div>
      ) : experiments.length === 0 ? (
        <div className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-6 text-center space-y-3">
          <p className="text-sm font-semibold text-[#2E1A6E] dark:text-white">
            No structured experiments match these exact filters.
          </p>
          <button
            type="button"
            onClick={handleResetFilters}
            className="rounded-xl bg-[#6D28D9] px-4 py-2 min-h-[44px] text-xs font-semibold text-white cursor-pointer"
          >
            Show All Experiments
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp, idx) => (
            <StructuredExperimentCard
              key={exp.id}
              experiment={exp}
              language={language}
              isCompleted={completedSet.has(exp.id)}
              onToggleCompleted={onToggleExperimentComplete}
              onLaunchPhysicsSim={onLaunchPhysicsSim}
              onLaunchSupportingWorld={onLaunchSupportingWorld}
              onOpenChapter={onOpenChapter}
              defaultExpanded={idx === 0}
            />
          ))}
        </div>
      )}
    </section>
  );
};
