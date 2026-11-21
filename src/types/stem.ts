export type Language = 'en' | 'hi' | 'kn';

export type UserRole = 'student' | 'teacher' | 'admin';

export type MainSection =
  | 'universe'
  | 'physics'
  | 'subjects'
  | 'dashboards'
  | 'resources'
  | 'curriculum'
  | 'my-learning'
  | 'experiment-library'
  | 'demo'
  | 'coverage'
  | 'account'
  | 'tutor'
  | 'teacher'
  | 'stories';

export type PhysicsTopicId =
  | 'mechanics'
  | 'electricity'
  | 'magnetism'
  | 'optics'
  | 'waves'
  | 'thermodynamics';

export type SupportingWorldId = 'chemistry' | 'biology' | 'mathematics';

export type FontScale = 'base' | 'md' | 'lg';

export interface AccessibilityState {
  highContrast: boolean;
  dyslexiaSpacing: boolean;
  fontScale: FontScale;
  lowPowerMode: boolean;
  theme: 'dark' | 'light';
}

export interface LocalizedText {
  en: string;
  hi: string;
  kn: string;
}

export interface PartialLocalizedText {
  en: string;
  hi?: string;
  kn?: string;
}

export interface PartialLocalizedList {
  en: string[];
  hi?: string[];
  kn?: string[];
}

export type SchoolClass = 6 | 7 | 8 | 9 | 10 | 11 | 12;

export type EducationBoard = 'cbse' | 'cisce' | 'state' | 'other';

export type AcademicSession = '2025-26' | '2024-25';

export type CurriculumSubjectFilter = 'physics' | 'chemistry' | 'biology' | 'mathematics';

export type ActivityModeFilter = 'all' | 'home-safe' | 'virtual-sim' | 'school-lab' | 'offline-saved';

export type ExperimentRelationType = 'in-chapter' | 'related-activity' | 'official-practical';

export interface LearningPathPreference {
  classLevel: SchoolClass;
  board: EducationBoard;
  stateName: string;
  session: AcademicSession;
  subject: CurriculumSubjectFilter;
  configured: boolean;
}

export interface QuizQuestion {
  id: string;
  question: LocalizedText;
  options: LocalizedText[];
  correctIndex: number;
  explanation: LocalizedText;
  hint?: LocalizedText;
}

export interface PhysicsModuleMeta {
  id: PhysicsTopicId;
  title: LocalizedText;
  subtitle: LocalizedText;
  formula: string;
  keyConcept: LocalizedText;
  experimentTitle: LocalizedText;
  experimentSteps: LocalizedText[];
  sampleNumerical: string;
}

export interface SupportingLesson {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  formulaOrFact: string;
  durationMin: number;
}

export interface SupportingWorldMeta {
  id: SupportingWorldId;
  title: LocalizedText;
  subtitle: LocalizedText;
  imagePath: string;
  accentHex: string;
  lessons: SupportingLesson[];
  quiz: QuizQuestion[];
}

export type MentorTier = 'fast' | 'general' | 'complex' | 'deep' | 'search';

export interface ChatSource {
  title: string;
  uri: string;
}

export type OfflineDownloadStatus = 'not-downloaded' | 'downloading' | 'available-offline';

export type SyncStatus = 'local-only' | 'waiting-to-sync' | 'synced' | 'sync-error';

export interface OfflinePackCurriculumInfo {
  classLevel: SchoolClass;
  board: EducationBoard;
  stateName?: string;
  session: AcademicSession;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  language: Language;
}

export interface OfflinePackMeta {
  id: string;
  title: string;
  version: string;
  downloadedAt: string;
  coreSizeBytes: number;
  mediaSizeBytes: number;
  includesMedia: boolean;
  cacheUrls: string[];
  curriculum?: OfflinePackCurriculumInfo;
}

export interface ProjectileAttemptRecord {
  id: string;
  missionId: string;
  timestamp: string;
  angle: number;
  velocity: number;
  gravity: number;
  mass: number;
  range: number;
  maxHeight: number;
  tFlight: number;
  targetDistance: number;
  hit: boolean;
  predictionIndex: number | null;
  reflectionNote?: string;
  synced: boolean;
}

export interface StudentProgress {
  streakDays: number;
  completedModules: string[];
  quizScores: Record<string, number>;
  savedOfflineIds: string[];
  dailyChallengeDone: boolean;
  labReadingsCount: number;
  projectileAttempts?: number;
  projectileHits?: number;
  isDemoProfile?: boolean;
  // My Learning detailed tracking
  completedChapterIds?: string[];
  studiedTopicIds?: string[];
  completedExperimentIds?: string[];
  bookmarkedTopicIds?: string[];
  recentChapterIds?: string[];
  chapterQuizScores?: Record<string, number>;
  learningTimeSeconds?: number;
}

export interface TeacherAssignment {
  id: string;
  title: string;
  subject: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';
  dueDate: string;
  completionRate: number;
  targetGrade: string;
}

export interface ResourcePack {
  id: string;
  title: LocalizedText;
  domain: 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';
  sizeKb: number;
  format: string;
  content: string;
}
