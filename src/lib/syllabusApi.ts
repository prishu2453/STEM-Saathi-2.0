import { apiUrl } from './apiBase';
import {
  getChapterById,
  getSyllabusMeta,
  queryExperiments,
  querySyllabus,
} from '../../shared/syllabus/index';
import type {
  RichChapterData,
  StructuredExperiment,
  SyllabusApiResponse,
  SyllabusMetaResponse,
  SyllabusSubject,
} from '../../shared/syllabus/types';
import type {
  AcademicSession,
  ActivityModeFilter,
  EducationBoard,
  ExperimentRelationType,
  SchoolClass,
} from '../types/stem';

export interface ChapterDetailApiResponse {
  chapter: RichChapterData;
  syllabusMeta: {
    academicYearLabel: string;
    syllabusVersionLabel: string;
    textbookName: string;
    sourceTitle: string;
    sourceUrl: string;
    lastVerified: string;
  };
}

const CACHE_PREFIX = 'stem-saathi-syllabus-cache-v1:';

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, value: T): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export async function fetchSyllabusMeta(): Promise<SyllabusMetaResponse> {
  try {
    const res = await fetch(apiUrl('/api/syllabus/meta'));
    if (res.ok) {
      const data = (await res.json()) as SyllabusMetaResponse;
      writeCache('meta', data);
      return data;
    }
  } catch {
    // offline fallback below
  }
  return readCache<SyllabusMetaResponse>('meta') ?? getSyllabusMeta();
}

export async function fetchSyllabus(params: {
  classLevel: SchoolClass;
  board: EducationBoard;
  stateName?: string;
  session: AcademicSession;
  subject?: SyllabusSubject | 'all';
}): Promise<SyllabusApiResponse> {
  const cacheKey = `syllabus:${params.classLevel}:${params.board}:${params.stateName ?? ''}:${params.session}:${params.subject ?? 'all'}`;
  const query = new URLSearchParams({
    classLevel: String(params.classLevel),
    board: params.board,
    session: params.session,
    subject: params.subject ?? 'all',
  });
  if (params.stateName) {
    query.set('stateName', params.stateName);
  }

  try {
    const res = await fetch(apiUrl(`/api/syllabus?${query.toString()}`));
    if (res.ok) {
      const data = (await res.json()) as SyllabusApiResponse;
      writeCache(cacheKey, data);
      return data;
    }
  } catch {
    // offline fallback below
  }

  return readCache<SyllabusApiResponse>(cacheKey) ?? querySyllabus(params);
}

export async function fetchChapterDetail(
  chapterId: string
): Promise<ChapterDetailApiResponse | null> {
  const cacheKey = `chapter:${chapterId}`;
  try {
    const res = await fetch(apiUrl(`/api/syllabus/chapter/${encodeURIComponent(chapterId)}`));
    if (res.ok) {
      const data = (await res.json()) as ChapterDetailApiResponse;
      writeCache(cacheKey, data);
      return data;
    }
  } catch {
    // offline fallback below
  }

  const cached = readCache<ChapterDetailApiResponse>(cacheKey);
  if (cached) return cached;

  const local = getChapterById(chapterId);
  if (!local) return null;
  return {
    chapter: local.chapter,
    syllabusMeta: {
      academicYearLabel: local.record.academicYearLabel,
      syllabusVersionLabel: local.record.syllabusVersionLabel,
      textbookName: local.record.textbookName,
      sourceTitle: local.record.sourceTitle,
      sourceUrl: local.record.sourceUrl,
      lastVerified: local.record.lastVerified,
    },
  };
}

export async function fetchExperiments(filters: {
  classLevel?: SchoolClass | 'all';
  board?: EducationBoard | 'all';
  stateName?: string;
  subject?: SyllabusSubject | 'all';
  chapterId?: string;
  relationType?: ExperimentRelationType | 'all';
  activityMode?: Exclude<ActivityModeFilter, 'offline-saved'>;
  q?: string;
}): Promise<StructuredExperiment[]> {
  const query = new URLSearchParams();
  if (filters.classLevel && filters.classLevel !== 'all') {
    query.set('classLevel', String(filters.classLevel));
  }
  if (filters.board && filters.board !== 'all') {
    query.set('board', filters.board);
  }
  if (filters.stateName) query.set('stateName', filters.stateName);
  if (filters.subject && filters.subject !== 'all') query.set('subject', filters.subject);
  if (filters.chapterId) query.set('chapterId', filters.chapterId);
  if (filters.relationType && filters.relationType !== 'all') {
    query.set('relationType', filters.relationType);
  }
  if (filters.activityMode && filters.activityMode !== 'all') {
    query.set('activityMode', filters.activityMode);
  }
  if (filters.q) query.set('q', filters.q);

  const cacheKey = `exps:${query.toString()}`;

  try {
    const res = await fetch(apiUrl(`/api/experiments?${query.toString()}`));
    if (res.ok) {
      const data = (await res.json()) as { experiments: StructuredExperiment[] };
      writeCache(cacheKey, data.experiments);
      return data.experiments;
    }
  } catch {
    // offline fallback below
  }

  return readCache<StructuredExperiment[]>(cacheKey) ?? queryExperiments(filters);
}
