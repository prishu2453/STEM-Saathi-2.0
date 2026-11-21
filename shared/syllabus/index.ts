import { CBSE_OTHER_CLASSES } from './cbseClasses';
import { CBSE_CLASS_8_CURIOSITY } from './cbseCuriosity8';
import { CBSE_EXTRA_PHYSICS } from './cbsePhysicsExtra';
import { ICSE_EXTRA_PHYSICS } from './icsePhysicsExtra';
import { ICSE_CLASSES } from './icseClasses';
import { ACADEMIC_SESSIONS, EDUCATION_BOARDS, SCHOOL_CLASSES, STATE_BOARD_STATES } from './meta';
import { STATE_BOARDS } from './stateBoards';
import type {
  BoardSyllabusRecord,
  RichChapterData,
  StructuredExperiment,
  SyllabusApiResponse,
  SyllabusMetaResponse,
  SyllabusSubject,
} from './types';
import type {
  AcademicSession,
  ActivityModeFilter,
  EducationBoard,
  ExperimentRelationType,
  SchoolClass,
} from '../../src/types/stem';

export const ALL_SYLLABUS_RECORDS: BoardSyllabusRecord[] = [
  CBSE_CLASS_8_CURIOSITY,
  ...CBSE_OTHER_CLASSES,
  ...ICSE_CLASSES,
  ...STATE_BOARDS,
].map((rec) => {
  const extra = CBSE_EXTRA_PHYSICS[rec.id] ?? ICSE_EXTRA_PHYSICS[rec.id];
  if (!extra) return rec;
  const have = new Set(rec.chapters.map((c) => c.id));
  return {
    ...rec,
    chapters: [...rec.chapters, ...extra.filter((c) => !have.has(c.id))].sort((a, b) => a.chapterNumber - b.chapterNumber),
  };
});

export function getSyllabusMeta(): SyllabusMetaResponse {
  return {
    classes: SCHOOL_CLASSES,
    boards: EDUCATION_BOARDS,
    states: STATE_BOARD_STATES,
    sessions: ACADEMIC_SESSIONS,
    verifiedCombinations: ALL_SYLLABUS_RECORDS.map((r) => ({
      id: r.id,
      classLevel: r.classLevel,
      board: r.board,
      stateName: r.stateName,
      session: r.session,
      textbookName: r.textbookName,
      availableSubjects: r.availableSubjects,
      chapterCount: r.chapters.length,
    })),
  };
}

export function findBoardRecord(
  classLevel: SchoolClass,
  board: EducationBoard,
  stateName: string | undefined,
  session: AcademicSession
): BoardSyllabusRecord | undefined {
  const effectiveBoard: EducationBoard = board === 'other' ? 'cbse' : board;
  const normalizedState = (stateName ?? '').trim().toLowerCase();

  // First try exact match including session
  const exact = ALL_SYLLABUS_RECORDS.find((rec) => {
    if (rec.classLevel !== classLevel || rec.board !== effectiveBoard || rec.session !== session) {
      return false;
    }
    if (effectiveBoard === 'state') {
      return (rec.stateName ?? '').trim().toLowerCase() === normalizedState;
    }
    return true;
  });
  if (exact) return exact;

  // Match board + class + state cleanly across academic sessions (2024-25 / 2025-26)
  const matched = ALL_SYLLABUS_RECORDS.find((rec) => {
    if (rec.classLevel !== classLevel || rec.board !== effectiveBoard) {
      return false;
    }
    if (effectiveBoard === 'state') {
      return (rec.stateName ?? '').trim().toLowerCase() === normalizedState;
    }
    return true;
  });
  if (matched) return matched;

  // Final fallback for State Board when custom state name isn't matched
  if (effectiveBoard === 'state') {
    return ALL_SYLLABUS_RECORDS.find(
      (rec) => rec.classLevel === classLevel && rec.board === 'state'
    );
  }

  return undefined;
}

export function querySyllabus(params: {
  classLevel: SchoolClass;
  board: EducationBoard;
  stateName?: string;
  session: AcademicSession;
  subject?: SyllabusSubject | 'all';
}): SyllabusApiResponse {
  const subject = params.subject ?? 'all';
  const record = findBoardRecord(
    params.classLevel,
    params.board,
    params.stateName,
    params.session
  );

  if (!record) {
    const boardDisplay =
      params.board === 'state'
        ? `${params.stateName || 'State'} State Board`
        : params.board === 'cisce'
          ? 'ICSE (CISCE)'
          : 'CBSE';

    const verifiedList = ALL_SYLLABUS_RECORDS.map((r) =>
      r.board === 'state'
        ? `Class ${r.classLevel} ${r.stateName}`
        : `Class ${r.classLevel} ${r.board.toUpperCase()} (${r.session})`
    ).join(', ');

    return {
      available: false,
      classLevel: params.classLevel,
      board: params.board,
      stateName: params.stateName,
      session: params.session,
      subject,
      chapters: [],
      unavailableReason: `Official textbook-verified chapters for Class ${params.classLevel} · ${boardDisplay} (${params.session}) are not yet loaded in this offline/API dataset. Gyaan Graph never guesses or copies CBSE chapters into another board. Currently verified: ${verifiedList}.`,
    };
  }

  const chapters =
    subject === 'all'
      ? record.chapters
      : record.chapters.filter((ch) => ch.primarySubject === subject);

  return {
    available: true,
    classLevel: record.classLevel,
    board: record.board,
    stateName: record.stateName,
    session: params.session,
    subject,
    academicYearLabel:
      params.session === '2024-25' && record.session !== '2024-25'
        ? `${params.session} (Rationalised NCERT / Board Edition)`
        : record.academicYearLabel,
    syllabusVersionLabel: record.syllabusVersionLabel,
    textbookName: record.textbookName,
    sourceTitle: record.sourceTitle,
    sourceUrl: record.sourceUrl,
    secondarySourceTitle: record.secondarySourceTitle,
    secondarySourceUrl: record.secondarySourceUrl,
    lastVerified: record.lastVerified,
    coverageNote: record.coverageNote,
    availableSubjects: record.availableSubjects,
    chapters,
  };
}

export function getChapterById(chapterId: string): {
  chapter: RichChapterData;
  record: BoardSyllabusRecord;
} | null {
  for (const record of ALL_SYLLABUS_RECORDS) {
    const chapter = record.chapters.find((c) => c.id === chapterId);
    if (chapter) {
      return { chapter, record };
    }
  }
  return null;
}

export function getAllStructuredExperiments(): StructuredExperiment[] {
  const list: StructuredExperiment[] = [];
  for (const rec of ALL_SYLLABUS_RECORDS) {
    for (const ch of rec.chapters) {
      list.push(...ch.experiments);
    }
  }
  return list;
}

export function queryExperiments(filters: {
  classLevel?: SchoolClass | 'all';
  board?: EducationBoard | 'all';
  stateName?: string;
  subject?: SyllabusSubject | 'all';
  chapterId?: string;
  relationType?: ExperimentRelationType | 'all';
  activityMode?: Exclude<ActivityModeFilter, 'offline-saved'>;
  q?: string;
}): StructuredExperiment[] {
  const all = getAllStructuredExperiments();
  const qLower = (filters.q ?? '').trim().toLowerCase();
  const stateLower = (filters.stateName ?? '').trim().toLowerCase();

  return all.filter((exp) => {
    if (filters.classLevel && filters.classLevel !== 'all' && exp.classLevel !== filters.classLevel) {
      return false;
    }
    if (filters.board && filters.board !== 'all' && exp.board !== filters.board) {
      return false;
    }
    if (
      filters.board === 'state' &&
      stateLower &&
      (exp.stateName ?? '').trim().toLowerCase() !== stateLower
    ) {
      return false;
    }
    if (filters.subject && filters.subject !== 'all' && exp.subject !== filters.subject) {
      return false;
    }
    if (filters.chapterId && exp.chapterId !== filters.chapterId) {
      return false;
    }
    if (
      filters.relationType &&
      filters.relationType !== 'all' &&
      exp.relationType !== filters.relationType
    ) {
      return false;
    }
    if (
      filters.activityMode &&
      filters.activityMode !== 'all' &&
      exp.activityMode !== filters.activityMode
    ) {
      return false;
    }
    if (qLower) {
      const haystack = [
        exp.title.en,
        exp.title.hi ?? '',
        exp.title.kn ?? '',
        exp.objective.en,
        exp.scientificPrinciple.en,
        exp.chapterTitle.en,
        ...(exp.materials.en ?? []),
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(qLower)) return false;
    }
    return true;
  });
}

export * from './meta';
export * from './types';
