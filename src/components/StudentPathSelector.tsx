import React from 'react';
import { GraduationCap } from 'lucide-react';
import {
  ACADEMIC_SESSIONS,
  EDUCATION_BOARDS,
  SCHOOL_CLASSES,
  STATE_BOARD_STATES,
  resolveLocalizedText,
} from '../data/learningPathCore';
import { UI_TEXT } from '../data/i18n';
import type {
  AcademicSession,
  EducationBoard,
  Language,
  LearningPathPreference,
  SchoolClass,
} from '../types/stem';

interface StudentPathSelectorProps {
  language: Language;
  learningPath: LearningPathPreference;
  onChange: (next: LearningPathPreference) => void;
  onDone?: () => void;
  compact?: boolean;
}

export const StudentPathSelector: React.FC<StudentPathSelectorProps> = ({
  language,
  learningPath,
  onChange,
  onDone,
  compact = false,
}) => {
  const t = UI_TEXT[language];

  const handleClassSelect = (classLevel: SchoolClass) => {
    onChange({ ...learningPath, classLevel, configured: true });
  };

  const handleBoardSelect = (board: EducationBoard) => {
    onChange({
      ...learningPath,
      board,
      stateName: board === 'state' ? learningPath.stateName || 'Karnataka' : '',
      configured: true,
    });
  };

  const handleStateSelect = (stateName: string) => {
    onChange({ ...learningPath, stateName, configured: true });
  };

  const handleSessionSelect = (session: AcademicSession) => {
    onChange({ ...learningPath, session, configured: true });
  };

  return (
    <div
      className={`a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] ${
        compact ? 'p-3.5 space-y-3' : 'p-4 sm:p-5 space-y-4'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{t.chooseYourClassLabel}</span>
          </p>
          <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] mt-0.5">
            {t.localPreferenceNote}
          </p>
        </div>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="min-h-[38px] rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {t.savePathBtn}
          </button>
        )}
      </div>

      {/* Step 1: Class */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
          1. {t.classLabel}
        </label>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5" role="group" aria-label={t.classLabel}>
          {SCHOOL_CLASSES.map((cls) => {
            const active = learningPath.classLevel === cls;
            return (
              <button
                key={cls}
                type="button"
                onClick={() => handleClassSelect(cls)}
                aria-pressed={active}
                className={`min-h-[42px] rounded-xl border px-2 py-1.5 text-xs font-semibold tabular-nums transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                    : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]'
                }`}
              >
                {cls}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 2: Board */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
          2. {t.boardLabel}
        </label>
        <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={t.boardLabel}>
          {EDUCATION_BOARDS.map((b) => {
            const active = learningPath.board === b.id;
            const label = resolveLocalizedText(b.label, language).text;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => handleBoardSelect(b.id)}
                aria-pressed={active}
                className={`min-h-[42px] rounded-xl border px-2.5 py-2 text-xs font-semibold transition-colors cursor-pointer text-left truncate ${
                  active
                    ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                    : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3 (Conditional): State when State Board */}
      {learningPath.board === 'state' && (
        <div className="space-y-1.5">
          <label
            htmlFor={compact ? 'state-select-compact' : 'state-select-full'}
            className="block text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]"
          >
            3. {t.stateLabel}
          </label>
          <select
            id={compact ? 'state-select-compact' : 'state-select-full'}
            value={learningPath.stateName || 'Karnataka'}
            onChange={(e) => handleStateSelect(e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs font-medium text-[#2E1A6E] dark:text-[#F5F0FF] focus:outline-none focus:border-[#6D28D9]"
          >
            {STATE_BOARD_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Optional Academic Session */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
          {learningPath.board === 'state' ? '4.' : '3.'} {t.sessionLabel}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5" role="group" aria-label={t.sessionLabel}>
          {ACADEMIC_SESSIONS.map((sess) => {
            const active = learningPath.session === sess.id;
            const label = resolveLocalizedText(sess.label, language).text;
            return (
              <button
                key={sess.id}
                type="button"
                onClick={() => handleSessionSelect(sess.id)}
                aria-pressed={active}
                className={`min-h-[42px] rounded-xl border px-3 py-2 text-xs font-medium transition-colors cursor-pointer text-left ${
                  active
                    ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                    : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <p className="text-[11px] leading-relaxed text-[#4A3F66] dark:text-[#C9BFEA]">
          {t.sessionChangeExplain}
        </p>
      </div>
    </div>
  );
};
