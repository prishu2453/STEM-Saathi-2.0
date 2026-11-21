import React, { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Atom,
  BookOpen,
  FlaskConical,
  GraduationCap,
  HardDriveDownload,
  Menu,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { OfflineIndicator } from './components/AccessibilityToolbar';
import { ErrorBoundary } from './components/ErrorBoundary';
import { SideDashboardDrawer, type AppWorkspaceView } from './components/SideDashboardDrawer';
import { StudentPathSelector } from './components/StudentPathSelector';

// Big screens load only when the student opens them — the home page stays small for slow connections.
const AIMentorDrawer = lazy(() => import('./components/AIMentorDrawer').then((m) => ({ default: m.AIMentorDrawer })));
const CurriculumBrowser = lazy(() => import('./components/CurriculumBrowser').then((m) => ({ default: m.CurriculumBrowser })));
const StoryLibrary = lazy(() => import('./story/StoryLibrary').then((m) => ({ default: m.StoryLibrary })));
const HomeHero = lazy(() => import('./components/HomeHero').then((m) => ({ default: m.HomeHero })));
const AdaptiveTutor = lazy(() => import('./components/tutor/AdaptiveTutor').then((m) => ({ default: m.AdaptiveTutor })));
const TeacherDashboard = lazy(() => import('./components/tutor/TeacherDashboard').then((m) => ({ default: m.TeacherDashboard })));
const CoverageOverview = lazy(() => import('./components/CoverageOverview').then((m) => ({ default: m.CoverageOverview })));
const DashboardsHub = lazy(() => import('./components/DashboardsHub').then((m) => ({ default: m.DashboardsHub })));
const DemoJourney = lazy(() => import('./components/DemoJourney').then((m) => ({ default: m.DemoJourney })));
const SavedLessons = lazy(() => import('./components/SavedLessons').then((m) => ({ default: m.SavedLessons })));
const ExperimentLibraryView = lazy(() => import('./components/ExperimentLibraryView').then((m) => ({ default: m.ExperimentLibraryView })));
const MyLearningDashboard = lazy(() => import('./components/MyLearningDashboard').then((m) => ({ default: m.MyLearningDashboard })));
const PhysicsLabSuite = lazy(() => import('./components/PhysicsLabSuite').then((m) => ({ default: m.PhysicsLabSuite })));
const SupportingWorlds = lazy(() => import('./components/SupportingWorlds').then((m) => ({ default: m.SupportingWorlds })));
const VideoAnimatorLab = lazy(() => import('./components/VideoAnimatorLab').then((m) => ({ default: m.VideoAnimatorLab })));
const TodayPanel = lazy(() => import('./components/TodayPanel').then((m) => ({ default: m.TodayPanel })));
const HomeLearningHub = lazy(() => import('./components/HomeLearningHub').then((m) => ({ default: m.HomeLearningHub })));
const AccountPage = lazy(() => import('./components/AccountPage').then((m) => ({ default: m.AccountPage })));
const PathBar = lazy(() => import('./components/PathBar').then((m) => ({ default: m.PathBar })));

const PhysicsUniverse3D = lazy(() =>
  import('./components/PhysicsUniverse3D').then((m) => ({ default: m.PhysicsUniverse3D }))
);
import { markActiveToday } from './lib/engagement';
import { isStationId, type StationId } from './sims/stationIds';
import { ACCOUNT_EVENT, getCachedAccount, getToken, startAutoSync } from './lib/account';
import { DEFAULT_LEARNING_PATH, formatLearningPathSummary } from './data/learningPathCore';
import { UI_TEXT } from './data/i18n';
import type { ExperimentId } from './data/physicsExperiments';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  auth,
  loadMyLearningStateFromFirestore,
  onAuthStateChanged,
  saveMyLearningStateToFirestore,
  saveProgressToFirestore,
  signInWithGoogle,
  signOutUser,
  syncUserRecord,
  type User,
} from './lib/firebase';
import {
  clearPendingSyncQueue,
  getDownloadedPackMetas,
  getPendingSyncCount,
  loadOfflineProgressRecord,
  queuePendingSync,
  saveOfflineProgressRecord,
} from './lib/offlineStore';
import type {
  AccessibilityState,
  Language,
  LearningPathPreference,
  MainSection,
  OfflinePackMeta,
  PhysicsTopicId,
  StudentProgress,
  SupportingWorldId,
  SyncStatus,
  UserRole,
} from './types/stem';

const STORAGE_KEY_PROGRESS = 'stem-saathi-progress-v2';
const STORAGE_KEY_PREFS = 'stem-saathi-prefs-v1';
const STORAGE_KEY_LEARNING_PATH = 'stem-saathi-learning-path-v1';

const DEFAULT_PROGRESS: StudentProgress = {
  streakDays: 0,
  completedModules: [],
  quizScores: {},
  savedOfflineIds: [],
  dailyChallengeDone: false,
  labReadingsCount: 0,
  projectileAttempts: 0,
  projectileHits: 0,
  isDemoProfile: false,
  completedChapterIds: [],
  studiedTopicIds: [],
  completedExperimentIds: [],
  bookmarkedTopicIds: [],
  recentChapterIds: [],
  chapterQuizScores: {},
  learningTimeSeconds: 0,
};

const SAMPLE_DEMO_PROGRESS: StudentProgress = {
  streakDays: 7,
  completedModules: ['physics-mechanics'],
  quizScores: { chemistry: 67 },
  savedOfflineIds: [],
  dailyChallengeDone: false,
  labReadingsCount: 2,
  projectileAttempts: 4,
  projectileHits: 2,
  isDemoProfile: true,
};

const DEFAULT_A11Y: AccessibilityState = {
  highContrast: false,
  dyslexiaSpacing: false,
  fontScale: 'base',
  lowPowerMode: false,
  theme: 'light',
};

function getInitialA11y(): AccessibilityState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.a11y) return { ...DEFAULT_A11Y, ...parsed.a11y };
    }
  } catch {
    // ignore storage read errors
  }
  return DEFAULT_A11Y;
}

interface ResolvedRoute {
  view: AppWorkspaceView;
  physicsTopic?: PhysicsTopicId;
  labTab?: 'simulations' | 'practicals' | 'solver';
  supportingWorld?: SupportingWorldId;
  dashboardRole?: UserRole;
  mediaTool?: 'video' | 'audio';
  open3D?: boolean;
  chapterId?: string;
  station?: StationId;
}

function resolveRouteFromLocation(): ResolvedRoute {
  if (typeof window === 'undefined') return { view: 'universe' };
  const params = new URLSearchParams(window.location.search);
  const rawParam = params.get('view') || params.get('section') || '';
  const rawHash = window.location.hash.replace(/^#/, '');
  const token = (rawParam || rawHash).trim().toLowerCase();
  if (isStationId(token)) {
    return { view: 'physics', labTab: 'simulations', station: token };
  }

  if (!token || token === 'home' || token === 'universe' || token === 'universe-section') {
    return { view: 'universe' };
  }
  if (token === 'my-learning' || token === 'learning' || token === 'syllabus') {
    return { view: 'my-learning' };
  }
  if (token.startsWith('chapter/')) {
    const chId = (rawParam || rawHash).trim().slice('chapter/'.length);
    return { view: 'my-learning', chapterId: chId || undefined };
  }
  if (token === 'tutor' || token === 'practice' || token === 'smart-practice' || token === 'diagnostic') {
    return { view: 'tutor' };
  }
  if (token === 'stories' || token === 'story' || token === '3d-stories' || token.startsWith('story/')) {
    return { view: 'stories' };
  }
  if (token === 'teacher' || token === 'teacher-dashboard' || token === 'class') {
    return { view: 'teacher' };
  }
  if (token === 'demo' || token === 'journey') {
    return { view: 'demo' };
  }
  if (token === 'login' || token === 'account' || token === 'signup') {
    return { view: 'account' };
  }
  if (token === 'coverage' || token === 'trust') {
    return { view: 'coverage' };
  }
  if (token === 'experiment-library' || token === 'experiments') {
    return { view: 'experiment-library' };
  }
  if (token === 'chapters' || token === 'curriculum' || token === 'chapters-experiments') {
    return { view: 'curriculum' };
  }
  if (token === 'physics' || token === 'physics-section' || token === 'double-slit' || token === 'quantum') {
    return { view: 'physics', labTab: 'simulations' };
  }
  if (token === 'mechanics' || token === 'physics-mechanics') {
    return { view: 'physics', physicsTopic: 'mechanics', labTab: 'simulations' };
  }
  if (token === 'electricity' || token === 'physics-electricity') {
    return { view: 'physics', physicsTopic: 'electricity', labTab: 'simulations' };
  }
  if (token === 'magnetism' || token === 'physics-magnetism') {
    return { view: 'physics', physicsTopic: 'magnetism', labTab: 'simulations' };
  }
  if (token === 'optics' || token === 'physics-optics') {
    return { view: 'physics', physicsTopic: 'optics', labTab: 'simulations' };
  }
  if (token === 'waves' || token === 'physics-waves') {
    return { view: 'physics', physicsTopic: 'waves', labTab: 'simulations' };
  }
  if (token === 'energy' || token === 'thermodynamics' || token === 'physics-thermodynamics') {
    return { view: 'physics', physicsTopic: 'thermodynamics', labTab: 'simulations' };
  }
  if (token === 'practicals' || token === 'physics-practicals') {
    return { view: 'physics', labTab: 'practicals' };
  }
  if (token === 'solver' || token === 'physics-solver') {
    return { view: 'physics', labTab: 'solver' };
  }
  if (token === '3d-observatory' || token === 'observatory') {
    return { view: 'universe', open3D: true };
  }
  if (token === 'chemistry' || token === 'subjects') {
    return { view: 'subjects', supportingWorld: 'chemistry' };
  }
  if (token === 'biology') {
    return { view: 'subjects', supportingWorld: 'biology' };
  }
  if (token === 'mathematics' || token === 'math') {
    return { view: 'subjects', supportingWorld: 'mathematics' };
  }
  if (token === 'offline' || token === 'resources' || token === 'offline-lessons') {
    return { view: 'resources' };
  }
  if (token === 'dashboards' || token === 'student-dashboard') {
    return { view: 'dashboards', dashboardRole: 'student' };
  }
  // The old School Admin link opens the student dashboard; teachers use ?view=teacher (class-wide gaps).
  if (token === 'admin-dashboard') {
    return { view: 'dashboards', dashboardRole: 'student' };
  }
  if (token === 'video' || token === 'video-animator') {
    return { view: 'video', mediaTool: 'audio' };
  }
  if (token === 'audio' || token === 'audio-transcriber') {
    return { view: 'video', mediaTool: 'audio' };
  }
  return { view: 'universe' };
}

function StemSaathiApp() {
  const isOnline = useOnlineStatus();
  const initialRoute = resolveRouteFromLocation();

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PREFS);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.language === 'en' || parsed.language === 'hi' || parsed.language === 'kn') {
          return parsed.language;
        }
      }
    } catch {
      // ignore storage read errors
    }
    return 'en';
  });

  // Only the student experience is exposed; Teacher and School Admin views are no longer reachable.
  const [role, setRole] = useState<UserRole>('student');
  const [activeStation, setActiveStation] = useState<StationId | null>(initialRoute.station ?? null);
  const [a11y, setA11y] = useState<AccessibilityState>(getInitialA11y);

  const [progress, setProgress] = useState<StudentProgress>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (raw) return { ...DEFAULT_PROGRESS, ...JSON.parse(raw) };
    } catch {
      // ignore storage read errors
    }
    return DEFAULT_PROGRESS;
  });

  const [studentAccount, setStudentAccount] = useState(getCachedAccount);
  useEffect(() => {
    if (getToken()) startAutoSync();
    const on = () => setStudentAccount(getCachedAccount());
    window.addEventListener(ACCOUNT_EVENT, on);
    return () => window.removeEventListener(ACCOUNT_EVENT, on);
  }, []);

  const [offlineMetas, setOfflineMetas] = useState<OfflinePackMeta[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local-only');

  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activeView, setActiveView] = useState<AppWorkspaceView>(initialRoute.view);
  // concept to practise when Smart Practice is opened from a story or elsewhere
  const [tutorFocus, setTutorFocus] = useState<string | undefined>(undefined);
  const [activePhysicsTopic, setActivePhysicsTopic] = useState<PhysicsTopicId>(
    initialRoute.physicsTopic ?? 'mechanics'
  );
  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentId>(
    initialRoute.physicsTopic ?? 'double-slit'
  );
  const [activeLabTab, setActiveLabTab] = useState<'simulations' | 'practicals' | 'solver'>(
    initialRoute.labTab ?? 'simulations'
  );
  const [activeSupportingWorld, setActiveSupportingWorld] = useState<SupportingWorldId>(
    initialRoute.supportingWorld ?? 'chemistry'
  );
  const [focusMediaTool, setFocusMediaTool] = useState<'video' | 'audio' | null>(
    initialRoute.mediaTool ?? null
  );
  const [projectileFocusSection, setProjectileFocusSection] = useState<'mission' | 'download' | null>(null);
  const [show3DObservatory, setShow3DObservatory] = useState(Boolean(initialRoute.open3D));
  const [sideMenuOpen, setSideMenuOpen] = useState(false);

  const [learningPath, setLearningPath] = useState<LearningPathPreference>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_LEARNING_PATH);
      if (raw) {
        return { ...DEFAULT_LEARNING_PATH, ...JSON.parse(raw) };
      }
    } catch {
      // ignore storage read errors
    }
    return DEFAULT_LEARNING_PATH;
  });
  const [pathEditorOpen, setPathEditorOpen] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(
    initialRoute.chapterId ?? null
  );

  const [mentorOpen, setMentorOpen] = useState(false);
  const [mentorLoaded, setMentorLoaded] = useState(false); // load the tutor code only after first use, then keep it mounted
  useEffect(() => {
    if (mentorOpen) setMentorLoaded(true);
  }, [mentorOpen]);
  const [mentorSubject, setMentorSubject] = useState('Physics');
  const [mentorPrompt, setMentorPrompt] = useState('');
  const [labContext, setLabContext] = useState('');

  const t = UI_TEXT[language];
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const progressRef = useRef(progress);
  const learningPathRef = useRef(learningPath);
  const langRef = useRef(language);
  const roleRef = useRef(role);
  const syncedUserRef = useRef<string | null>(null);
  const hydratedRef = useRef(false);

  // Ensure initial plain load sits cleanly at top of Home and listen to hash deep links
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });

    const handleHashChange = () => {
      const next = resolveRouteFromLocation();
      setSideMenuOpen(false);
      setShow3DObservatory(Boolean(next.open3D));
      setActiveView(next.view);
      setActiveChapterId(next.chapterId ?? null);
      if (next.physicsTopic) setActivePhysicsTopic(next.physicsTopic);
      if (next.labTab) setActiveLabTab(next.labTab);
      if (next.supportingWorld) setActiveSupportingWorld(next.supportingWorld);
      if (next.dashboardRole) setRole('student');
      setActiveStation(next.station ?? null);
      if (next.mediaTool) setFocusMediaTool(next.mediaTool);
      window.scrollTo({ top: 0, behavior: 'auto' });
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    learningPathRef.current = learningPath;
  }, [learningPath]);

  useEffect(() => {
    langRef.current = language;
  }, [language]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const refreshOfflinePacks = useCallback(async () => {
    const metas = await getDownloadedPackMetas();
    setOfflineMetas(metas);
    const verifiedIds = metas.map((m) => m.id);
    setProgress((prev) => {
      const same =
        prev.savedOfflineIds.length === verifiedIds.length &&
        prev.savedOfflineIds.every((id, idx) => id === verifiedIds[idx]);
      if (same) return prev;
      return { ...prev, savedOfflineIds: verifiedIds };
    });
  }, []);

  // Hydrate IndexedDB progress, verified offline packs, and pending sync queue on mount
  useEffect(() => {
    let active = true;
    void (async () => {
      const [idbProgress, metas, pending] = await Promise.all([
        loadOfflineProgressRecord(),
        getDownloadedPackMetas(),
        getPendingSyncCount(),
      ]);
      if (!active) return;

      const verifiedIds = metas.map((m) => m.id);
      setOfflineMetas(metas);
      setPendingSyncCount(pending);
      if (pending > 0) {
        setSyncStatus('waiting-to-sync');
      }

      setProgress((prev) => {
        const hasMoreIdbProgress =
          Boolean(idbProgress) &&
          (idbProgress!.completedModules.length > prev.completedModules.length ||
            (idbProgress!.labReadingsCount ?? 0) > prev.labReadingsCount ||
            (idbProgress!.projectileAttempts ?? 0) > (prev.projectileAttempts ?? 0));
        const base = hasMoreIdbProgress && idbProgress ? { ...prev, ...idbProgress } : prev;
        return { ...base, savedOfflineIds: verifiedIds };
      });
      hydratedRef.current = true;
    })();
    return () => {
      active = false;
    };
  }, []);

  // Listen to Firebase Auth state & sync cloud records
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        syncedUserRef.current = null;
        setSyncStatus((prev) => (prev === 'synced' ? 'local-only' : prev));
        return;
      }
      try {
        syncedUserRef.current = nextUser.uid;
        const [cloudProgress, cloudMyLearning, metas] = await Promise.all([
          syncUserRecord(nextUser, langRef.current, roleRef.current, progressRef.current),
          loadMyLearningStateFromFirestore(nextUser).catch(() => null),
          getDownloadedPackMetas(),
        ]);

        if (cloudMyLearning?.learningPath?.configured && !learningPathRef.current.configured) {
          setLearningPath((prev) => ({
            ...prev,
            ...cloudMyLearning.learningPath,
          }));
        }

        setProgress((prev) => {
          const mergedChapters = Array.from(
            new Set([...(prev.completedChapterIds ?? []), ...(cloudMyLearning?.completedChapterIds ?? [])])
          );
          const mergedTopics = Array.from(
            new Set([...(prev.studiedTopicIds ?? []), ...(cloudMyLearning?.studiedTopicIds ?? [])])
          );
          const mergedExps = Array.from(
            new Set([
              ...(prev.completedExperimentIds ?? []),
              ...(cloudMyLearning?.completedExperimentIds ?? []),
            ])
          );
          const mergedBookmarks = Array.from(
            new Set([...(prev.bookmarkedTopicIds ?? []), ...(cloudMyLearning?.bookmarkedTopicIds ?? [])])
          );
          const mergedRecents = Array.from(
            new Set([...(prev.recentChapterIds ?? []), ...(cloudMyLearning?.recentChapterIds ?? [])])
          ).slice(0, 20);
          const mergedChapterQuizzes: Record<string, number> = {
            ...(cloudMyLearning?.chapterQuizScores ?? {}),
          };
          for (const [k, v] of Object.entries(prev.chapterQuizScores ?? {})) {
            mergedChapterQuizzes[k] = Math.max(mergedChapterQuizzes[k] ?? 0, v);
          }

          return {
            ...prev,
            ...cloudProgress,
            savedOfflineIds: metas.map((m) => m.id),
            completedChapterIds: mergedChapters,
            studiedTopicIds: mergedTopics,
            completedExperimentIds: mergedExps,
            bookmarkedTopicIds: mergedBookmarks,
            recentChapterIds: mergedRecents,
            chapterQuizScores: mergedChapterQuizzes,
            learningTimeSeconds: Math.max(
              prev.learningTimeSeconds ?? 0,
              cloudMyLearning?.learningTimeSeconds ?? 0
            ),
          };
        });
        await clearPendingSyncQueue();
        setPendingSyncCount(0);
        setSyncStatus('synced');
      } catch (err) {
        setAuthError(err instanceof Error ? err.message : 'Unable to sync cloud profile.');
      }
    });
    return () => unsub();
  }, []);

  // Sync theme & accessibility classes onto <html>
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', a11y.theme === 'dark');
    root.classList.toggle('a11y-high-contrast', a11y.highContrast);
    root.classList.toggle('a11y-dyslexia', a11y.dyslexiaSpacing);
    root.classList.toggle('a11y-lite-motion', a11y.lowPowerMode);
    root.classList.remove('a11y-scale-md', 'a11y-scale-lg');
    if (a11y.fontScale === 'md') root.classList.add('a11y-scale-md');
    if (a11y.fontScale === 'lg') root.classList.add('a11y-scale-lg');

    try {
      localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify({ language, a11y }));
    } catch {
      // ignore storage write errors
    }
  }, [language, a11y]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEARNING_PATH, JSON.stringify(learningPath));
    } catch {
      // ignore storage write errors
    }
  }, [learningPath]);

  // Persist progress locally (localStorage + IndexedDB) and sync or queue when offline
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress));
    } catch {
      // ignore storage write errors
    }
    void saveOfflineProgressRecord(progress);

    if (!hydratedRef.current) return;

    if (!isOnline) {
      void (async () => {
        const count = await queuePendingSync('progress');
        setPendingSyncCount(count);
        setSyncStatus('waiting-to-sync');
      })();
      return;
    }

    if (!user || syncedUserRef.current !== user.uid) {
      setSyncStatus((prev) => (pendingSyncCount > 0 ? prev : 'local-only'));
      return;
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          await Promise.all([
            saveProgressToFirestore(user, progress),
            saveMyLearningStateToFirestore(user, learningPathRef.current, progress),
          ]);
          await clearPendingSyncQueue();
          setPendingSyncCount(0);
          setSyncStatus('synced');
        } catch {
          setSyncStatus('waiting-to-sync');
        }
      })();
    }, 650);

    return () => window.clearTimeout(timer);
  }, [progress, learningPath, user, isOnline, pendingSyncCount]);

  // Auto-flush queued offline changes as soon as network returns while signed in
  useEffect(() => {
    if (!isOnline || !user || syncedUserRef.current !== user.uid) return;
    if (pendingSyncCount === 0 && syncStatus === 'synced') return;

    let active = true;
    void (async () => {
      try {
        await Promise.all([
          saveProgressToFirestore(user, progressRef.current),
          saveMyLearningStateToFirestore(user, learningPathRef.current, progressRef.current),
        ]);
        await clearPendingSyncQueue();
        if (!active) return;
        setPendingSyncCount(0);
        setSyncStatus('synced');
      } catch {
        // Keep waiting-to-sync if request fails
      }
    })();

    return () => {
      active = false;
    };
  }, [isOnline, user, pendingSyncCount, syncStatus]);

  const handleSignIn = async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Google sign-in cancelled or failed.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError(null);
    await signOutUser();
  };



  const updateLocationHash = (hash: string) => {
    if (typeof window === 'undefined') return;
    const clean = hash ? `#${hash}` : window.location.pathname + window.location.search;
    window.history.replaceState(null, '', clean);
  };

  const scrollToSection = (section: AppWorkspaceView, hashOverride?: string) => {
    setSideMenuOpen(false);
    setShow3DObservatory(false);
    setActiveView(section);
    if (section === 'universe') {
      updateLocationHash('');
    } else if (hashOverride !== undefined) {
      updateLocationHash(hashOverride);
    } else {
      updateLocationHash(section === 'resources' ? 'offline' : section);
    }
    window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
  };

  const openStation = (id: StationId) => {
    setSideMenuOpen(false);
    setShow3DObservatory(false);
    setActiveStation(id);
    setActiveLabTab('simulations');
    setActiveView('physics');
    updateLocationHash(id);
    window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
  };

  const openPhysicsWorkbench = (experiment: ExperimentId = 'double-slit') => {
    setSideMenuOpen(false);
    setShow3DObservatory(false);
    setActiveStation(null);
    setSelectedExperiment(experiment);
    setActiveLabTab('simulations');
    setProjectileFocusSection(null);
    setActiveView('physics');
    updateLocationHash('physics');
    window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
  };

  const openProjectileFocus = (mode: 'mission' | 'download') => {
    setSideMenuOpen(false);
    setShow3DObservatory(false);
    setActivePhysicsTopic('mechanics');
    setSelectedExperiment('mechanics');
    setActiveLabTab('simulations');
    setProjectileFocusSection(mode);
    setActiveView('physics');
    updateLocationHash('physics');
    window.setTimeout(() => {
      if (mode === 'download') {
        const el = document.getElementById('projectile-offline-box');
        el?.scrollIntoView({ behavior: a11y.lowPowerMode ? 'auto' : 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
      }
    }, 60);
  };

  const handleCompleteModule = (moduleId: string) => {
    setProgress((prev) => {
      if (prev.completedModules.includes(moduleId)) return prev;
      return {
        ...prev,
        completedModules: [...prev.completedModules, moduleId],
      };
    });
  };

  const handleLogReading = () => {
    setProgress((prev) => ({
      ...prev,
      labReadingsCount: prev.labReadingsCount + 1,
    }));
  };

  const handleAttemptRecorded = useCallback(
    (hit: boolean) => {
      setProgress((prev) => ({
        ...prev,
        projectileAttempts: (prev.projectileAttempts ?? 0) + 1,
        projectileHits: (prev.projectileHits ?? 0) + (hit ? 1 : 0),
        streakDays: markActiveToday(),
      }));
      if (!isOnline) {
        void getPendingSyncCount().then((c) => {
          setPendingSyncCount(c);
          if (c > 0) setSyncStatus('waiting-to-sync');
        });
      }
    },
    [isOnline]
  );

  const handleSaveProjectileQuiz = useCallback((scorePct: number) => {
    setProgress((prev) => ({
      ...prev,
      quizScores: {
        ...prev.quizScores,
        mechanics: Math.max(prev.quizScores.mechanics ?? 0, scorePct),
      },
    }));
  }, []);

  const handleSaveQuizScore = (worldId: SupportingWorldId, scorePct: number) => {
    setProgress((prev) => ({
      ...prev,
      quizScores: {
        ...prev.quizScores,
        [worldId]: Math.max(prev.quizScores[worldId] ?? 0, scorePct),
      },
    }));
  };

  const handleClaimDailyChallenge = () => {
    setProgress((prev) => {
      if (prev.dailyChallengeDone) return prev;
      return {
        ...prev,
        dailyChallengeDone: true,
        streakDays: markActiveToday(),
      };
    });
  };

  const handleLoadDemoProfile = () => {
    setProgress((prev) => ({
      ...SAMPLE_DEMO_PROGRESS,
      savedOfflineIds: prev.savedOfflineIds,
    }));
  };

  const handleResetProgress = () => {
    setProgress((prev) => ({
      ...DEFAULT_PROGRESS,
      savedOfflineIds: prev.savedOfflineIds,
    }));
  };

  const handleOpenMyLearning = useCallback(
    (chapterId: string | null = null) => {
      setSideMenuOpen(false);
      setShow3DObservatory(false);
      setActiveChapterId(chapterId);
      setActiveView('my-learning');
      updateLocationHash(chapterId ? `chapter/${chapterId}` : 'my-learning');
      if (chapterId) {
        setProgress((prev) => {
          const filtered = (prev.recentChapterIds ?? []).filter((id) => id !== chapterId);
          return { ...prev, recentChapterIds: [chapterId, ...filtered].slice(0, 20) };
        });
      }
      window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
    },
    [a11y.lowPowerMode]
  );

  const handleToggleChapterComplete = useCallback((chapterId: string) => {
    setProgress((prev) => {
      const list = prev.completedChapterIds ?? [];
      const exists = list.includes(chapterId);
      return {
        ...prev,
        streakDays: markActiveToday(),
        completedChapterIds: exists ? list.filter((id) => id !== chapterId) : [...list, chapterId],
      };
    });
  }, []);

  const handleToggleTopicStudied = useCallback((topicId: string) => {
    setProgress((prev) => {
      const list = prev.studiedTopicIds ?? [];
      const exists = list.includes(topicId);
      return {
        ...prev,
        studiedTopicIds: exists ? list.filter((id) => id !== topicId) : [...list, topicId],
      };
    });
  }, []);

  const handleToggleBookmarkTopic = useCallback((topicKey: string) => {
    setProgress((prev) => {
      const list = prev.bookmarkedTopicIds ?? [];
      const exists = list.includes(topicKey);
      return {
        ...prev,
        bookmarkedTopicIds: exists ? list.filter((id) => id !== topicKey) : [...list, topicKey],
      };
    });
  }, []);

  const handleToggleExperimentComplete = useCallback((expId: string) => {
    setProgress((prev) => {
      const list = prev.completedExperimentIds ?? [];
      const exists = list.includes(expId);
      return {
        ...prev,
        streakDays: markActiveToday(),
        completedExperimentIds: exists ? list.filter((id) => id !== expId) : [...list, expId],
      };
    });
  }, []);

  const handleSaveChapterQuizScore = useCallback((chapterId: string, scorePct: number) => {
    setProgress((prev) => ({
      ...prev,
      streakDays: markActiveToday(),
      chapterQuizScores: {
        ...(prev.chapterQuizScores ?? {}),
        [chapterId]: Math.max(prev.chapterQuizScores?.[chapterId] ?? 0, scorePct),
      },
    }));
  }, []);

  const handleAddStudySeconds = useCallback((seconds: number) => {
    setProgress((prev) => ({
      ...prev,
      learningTimeSeconds: (prev.learningTimeSeconds ?? 0) + seconds,
    }));
  }, []);

  const handleOpenMentorWithPrompt = (subject: string, prompt: string) => {
    setMentorSubject(subject);
    setMentorPrompt(prompt);
    setMentorOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F0FF] text-[#22163F] dark:bg-[#140C2E] dark:text-[#F3EFFF]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-xl focus:bg-[#2E1A6E] focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
      >
        {language === 'hi' ? 'मुख्य सामग्री पर जाएँ' : language === 'kn' ? 'ಮುಖ್ಯ ವಿಷಯಕ್ಕೆ ಹೋಗಿ' : 'Skip to main content'}
      </a>
      {/* Minimal Top Bar: 3-Line Side Dashboard Trigger + Brand Name + Quick Language + Primary CTA */}
      <header className="sticky top-0 z-40 border-b border-[#E7DDFB] dark:border-[#3B2C78] bg-white/95 dark:bg-[#1F1545]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 h-15 flex items-center justify-between gap-2 sm:gap-8">
          {/* Zone 1: 3-Line Side Menu Button + Website Name */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              ref={menuTriggerRef}
              type="button"
              onClick={() => setSideMenuOpen(true)}
              aria-label={t.sideMenuLabel}
              aria-expanded={sideMenuOpen}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-white hover:border-[#6D28D9] transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>

            <a
              href="#home"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('universe');
              }}
              className="font-display text-xl font-bold tracking-tight text-[#2E1A6E] dark:text-white whitespace-nowrap shrink-0 inline-flex items-center min-h-[44px]"
            >
              Gyaan Graph
            </a>
          </div>

          {/* Zone 2: Minimal Single-Line Language Switch */}
          <div
            role="group"
            aria-label={t.actionChooseLanguage}
            className="hidden sm:inline-flex items-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-1"
          >
            {(
              [
                { id: 'en', label: 'EN' },
                { id: 'hi', label: 'हिन्दी' },
                { id: 'kn', label: 'ಕನ್ನಡ' },
              ] as { id: Language; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLanguage(item.id)}
                className={`px-3 py-1.5 min-h-[36px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  language === item.id
                    ? 'bg-[#6D28D9] text-white shadow-xs'
                    : 'text-[#2E1A6E] dark:text-[#E4DDFA] hover:text-[#6D28D9] dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Zone 3: Account + Primary Action */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => scrollToSection('account', 'login')}
            aria-current={activeView === 'account' ? 'page' : undefined}
            aria-label={studentAccount ? (language === 'hi' ? 'मेरा खाता' : language === 'kn' ? 'ನನ್ನ ಖಾತೆ' : 'My account') : (language === 'hi' ? 'लॉग इन' : language === 'kn' ? 'ಲಾಗ್ ಇನ್' : 'Log in')}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2.5 sm:px-3 py-2 min-h-[44px] min-w-[44px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] transition-colors whitespace-nowrap cursor-pointer"
          >
            <UserRound className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
            <span className="hidden sm:inline max-w-[90px] truncate">
              {studentAccount
                ? (studentAccount.profile.fullName || studentAccount.username).split(' ')[0]
                : language === 'hi' ? 'लॉग इन' : language === 'kn' ? 'ಲಾಗ್ ಇನ್' : 'Log in'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMentorSubject('Physics');
              setMentorPrompt('');
              setMentorOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#6D28D9] px-3 sm:px-4 py-2 min-h-[44px] text-xs font-semibold text-white hover:bg-[#5B21B6] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.askMentor}</span>
          </button>
          </div>
        </div>
      </header>

      {learningPath.configured && ['curriculum', 'my-learning', 'experiment-library', 'demo'].includes(activeView) && (
        <Suspense fallback={null}>
          <PathBar
            path={learningPath}
            language={language}
            onChange={() => scrollToSection('curriculum', 'curriculum')}
            onCoverage={() => scrollToSection('coverage', 'coverage')}
          />
        </Suspense>
      )}

      {/* Slide-out 3-Line Side Menu Drawer */}
      <SideDashboardDrawer
        open={sideMenuOpen}
        onClose={() => setSideMenuOpen(false)}
        returnFocusToRef={menuTriggerRef}
        language={language}
        onLanguageChange={setLanguage}
        activeView={activeView}
        activePhysicsTopic={activePhysicsTopic}
        activeLabTab={activeLabTab}
        activeSupportingWorld={activeSupportingWorld}
        focusMediaTool={focusMediaTool}
        show3DObservatory={show3DObservatory}
        role={role}
        a11y={a11y}
        onA11yChange={setA11y}
        user={user}
        authLoading={authLoading}
        savedOfflineCount={offlineMetas.length}
        pendingSyncCount={pendingSyncCount}
        onSignIn={() => void handleSignIn()}
        onSignOut={() => void handleSignOut()}
        onSelectHome={() => scrollToSection('universe')}
        onSelectCurriculum={() => scrollToSection('curriculum', 'chapters')}
        onSelectMyLearning={() => handleOpenMyLearning(null)}
        onSelectExperimentLibrary={() =>
          scrollToSection('experiment-library', 'experiment-library')
        }
        learningPath={learningPath}
        onLearningPathChange={setLearningPath}
        onSelectQuantumLab={() => openPhysicsWorkbench('double-slit')}
        onSelectPhysicsTopic={(topic) => {
          setShow3DObservatory(false);
          setActivePhysicsTopic(topic);
          setSelectedExperiment(topic);
          setActiveLabTab('simulations');
          setActiveView('physics');
          updateLocationHash(topic === 'thermodynamics' ? 'energy' : topic);
          window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
        }}
        onSelectPhysicsTab={(tab) => {
          setShow3DObservatory(false);
          setActiveLabTab(tab);
          setActiveView('physics');
          updateLocationHash(tab);
          window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
        }}
        onSelectSupportingWorld={(world) => {
          setShow3DObservatory(false);
          setActiveSupportingWorld(world);
          setActiveView('subjects');
          updateLocationHash(world);
          window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
        }}
        onSelectMediaTool={(tool) => {
          setShow3DObservatory(false);
          setFocusMediaTool(tool);
          setActiveView('video');
          updateLocationHash(tool);
          window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
        }}
        onSelectDashboardRole={(nextRole) => {
          setShow3DObservatory(false);
          setRole(nextRole);
          setActiveView('dashboards');
          updateLocationHash(`${nextRole}-dashboard`);
          window.scrollTo({ top: 0, behavior: a11y.lowPowerMode ? 'auto' : 'smooth' });
        }}
        onSelectView={(view) => scrollToSection(view)}
        onOpenMentor={() => {
          setMentorSubject('Physics');
          setMentorPrompt('');
          setMentorOpen(true);
        }}
        onOpen3DObservatory={() => {
          if (a11y.lowPowerMode) {
            setA11y((prev) => ({ ...prev, lowPowerMode: false }));
          }
          setActiveView('universe');
          setShow3DObservatory(true);
          updateLocationHash('3d-observatory');
          window.scrollTo({ top: 0, behavior: 'auto' });
        }}
      />

      {authError && (
        <div className="mx-auto max-w-6xl w-full px-4 sm:px-6 pt-3">
          <div className="rounded-xl border border-[#FF9F1C] bg-[#FFF1DE] dark:bg-[#FF9F1C]/15 px-3.5 py-2.5 text-xs text-[#2E1A6E] dark:text-[#F5F0FF] flex items-center justify-between gap-2">
            <span>{authError}</span>
            <button
              type="button"
              onClick={() => setAuthError(null)}
              className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD] underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        <Suspense fallback={<div role="status" className="mx-auto max-w-6xl px-4 py-16 text-center text-sm text-[#4A3F66] dark:text-[#C9BFEA]">Loading…</div>}>
        <div key={activeView} className="animate-view-enter">
        {activeView === 'universe' ? (
          /* FRONT PAGE: what Gyaan Graph does, misconception of the day, the student's graph, then the live 3D lab */
          <section
            id="universe-section"
            className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12"
          >
            <HomeHero
              language={language}
              onStartDiagnostic={() => scrollToSection('tutor', 'diagnostic')}
              onOpenTutor={() => scrollToSection('tutor')}
              onOpenLab={() => openPhysicsWorkbench('double-slit')}
              onOpenTeacher={() => scrollToSection('teacher')}
              onOpenStory={(id) => scrollToSection('stories', id ? `story/${id}` : 'stories')}
              onAskDoubt={() => {
                setMentorSubject('Physics');
                setMentorPrompt('');
                setMentorOpen(true);
              }}
            >
                {/* Student Learning Path ("Choose your class / My learning") — saved locally, works offline */}
                <div className="space-y-2.5 pt-1">
                  <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <BookOpen className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD] shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold text-[#4A3F66] dark:text-[#C9BFEA]">
                          {language === 'hi' ? 'आपकी कक्षा और बोर्ड' : language === 'kn' ? 'ನಿಮ್ಮ ತರಗತಿ ಮತ್ತು ಮಂಡಳಿ' : 'Your class & board'}
                        </p>
                        <p className="text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] truncate tabular-nums">
                          {formatLearningPathSummary(learningPath, language)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPathEditorOpen((v) => !v)}
                      aria-expanded={pathEditorOpen}
                      className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2 min-h-[42px] text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:border-[#6D28D9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {pathEditorOpen ? t.savePathBtn : t.changeClassBoardBtn}
                    </button>
                  </div>

                  {pathEditorOpen && (
                    <div className="animate-panel-reveal">
                      <StudentPathSelector
                        language={language}
                        learningPath={learningPath}
                        onChange={setLearningPath}
                        onDone={() => setPathEditorOpen(false)}
                        compact
                      />
                    </div>
                  )}
                </div>

                {/* Mobile inline language selector + guest/offline note */}
                <div className="space-y-3 pt-1">
                  <div className="flex sm:hidden items-center gap-2" role="group" aria-label={t.actionChooseLanguage}>
                    {(
                      [
                        { id: 'en', label: 'English' },
                        { id: 'hi', label: 'हिन्दी' },
                        { id: 'kn', label: 'ಕನ್ನಡ' },
                      ] as { id: Language; label: string }[]
                    ).map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setLanguage(item.id)}
                        className={`flex-1 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                          language === item.id
                            ? 'bg-[#6D28D9] border-[#6D28D9] text-white'
                            : 'bg-white dark:bg-[#1F1545] border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#E4DDFA]'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
                    {isOnline ? t.guestAccessNote : t.offlineSyncNote}
                  </p>
                </div>
            </HomeHero>

            {/* Physics, live: the 3D observatory with every apparatus clickable */}
            <div className="mt-12 sm:mt-14">
              <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
                <div>
                  <span className="inline-block rotate-1 rounded-lg bg-[#12C26B] px-2.5 py-0.5 text-xs font-extrabold text-white border-2 border-[#2E1A6E]">3D</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-[#2E1A6E] dark:text-white mt-1">
                    {language === 'hi' ? 'भौतिकी, जीवंत' : language === 'kn' ? 'ಭೌತಶಾಸ್ತ್ರ, ಜೀವಂತ' : 'Physics, live'}
                  </h2>
                  <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA] max-w-xl">
                    {language === 'hi'
                      ? 'घुमाइए, ज़ूम कीजिए, किसी भी उपकरण को छूकर उसका प्रयोग खोलिए।'
                      : language === 'kn'
                        ? 'ತಿರುಗಿಸಿ, ಜೂಮ್ ಮಾಡಿ, ಯಾವುದೇ ಉಪಕರಣ ಒತ್ತಿ ಅದರ ಪ್ರಯೋಗ ತೆರೆಯಿರಿ.'
                        : 'Spin it, zoom in, and tap any apparatus to open its experiment.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => scrollToSection('experiment-library', 'experiment-library')}
                  className="inline-flex items-center gap-2 rounded-2xl border-2 border-[#2E1A6E] dark:border-[#C4B5FD] bg-white dark:bg-[#1F1545] px-4 py-2.5 min-h-[46px] text-sm font-extrabold text-[#2E1A6E] dark:text-white"
                >
                  <FlaskConical className="w-4 h-4" aria-hidden="true" /> {t.menuExperimentLibrary}
                </button>
              </div>
              <div className="rounded-3xl overflow-hidden border-2 border-[#2E1A6E] dark:border-[#C4B5FD] shadow-[6px_6px_0_#6D28D9]">
                <Suspense
                  fallback={
                    <div className="h-[380px] sm:h-[470px] bg-[#1F1545] flex items-center justify-center text-xs text-[#F5F0FF]">
                      Loading 3D Physics Observatory...
                    </div>
                  }
                >
                  <PhysicsUniverse3D
                    lowPowerMode={a11y.lowPowerMode}
                    onSelectPhysicsTopic={(topic) => {
                      setActivePhysicsTopic(topic);
                      setSelectedExperiment(topic);
                      setActiveLabTab('simulations');
                      scrollToSection('physics');
                    }}
                  />
                </Suspense>
              </div>
            </div>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-6 mt-12">
              <Suspense fallback={null}>
                <HomeLearningHub
                  language={language}
                  offlineCount={offlineMetas.length}
                  onOpenStation={openStation}
                  onOpenPhysics={() => openPhysicsWorkbench('double-slit')}
                  onOpenWorld={(world) => {
                    setActiveSupportingWorld(world);
                    scrollToSection('subjects', world);
                  }}
                  onOpenTutor={() => {
                    setMentorSubject('Physics');
                    setMentorPrompt('');
                    setMentorOpen(true);
                  }}
                  onOpenResources={() => scrollToSection('resources', 'offline')}
                  onOpenExperimentLibrary={() => scrollToSection('experiment-library', 'experiment-library')}
                />
              </Suspense>
            </div>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-8">
              <Suspense fallback={null}>
                <TodayPanel
                  language={language}
                  learningPath={learningPath}
                  progress={progress}
                  offlinePackCount={offlineMetas.length}
                  onOpenChapter={(id) => handleOpenMyLearning(id)}
                  onToggleExperimentComplete={handleToggleExperimentComplete}
                />
              </Suspense>
            </div>
          </section>
        ) : (
          /* FOCUSED FEATURE VIEWS OPENED FROM THE 3-LINE SIDE DASHBOARD */
          <>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => scrollToSection('universe')}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-4 py-2 min-h-[44px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
                <span>{t.backToHome}</span>
              </button>

              <button
                type="button"
                onClick={() => setSideMenuOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-4 py-2 min-h-[44px] text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] transition-colors cursor-pointer"
              >
                <Menu className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
                <span>{t.openMenuCta}</span>
              </button>
            </div>

            {activeView === 'my-learning' && (
              <div id="my-learning-section">
                <MyLearningDashboard
                  language={language}
                  lowPowerMode={a11y.lowPowerMode}
                  learningPath={learningPath}
                  onLearningPathChange={setLearningPath}
                  progress={progress}
                  activeChapterId={activeChapterId}
                  onSelectChapterId={(chapId) => handleOpenMyLearning(chapId)}
                  onToggleChapterComplete={handleToggleChapterComplete}
                  onToggleTopicStudied={handleToggleTopicStudied}
                  onToggleBookmarkTopic={handleToggleBookmarkTopic}
                  onToggleExperimentComplete={handleToggleExperimentComplete}
                  onSaveChapterQuizScore={handleSaveChapterQuizScore}
                  onAddStudySeconds={handleAddStudySeconds}
                  onLaunchPhysicsSim={(topic) => {
                    if (
                      topic === 'mechanics' ||
                      topic === 'electricity' ||
                      topic === 'magnetism' ||
                      topic === 'optics' ||
                      topic === 'waves' ||
                      topic === 'thermodynamics'
                    ) {
                      setActivePhysicsTopic(topic);
                    }
                    openPhysicsWorkbench(topic);
                  }}
                  onLaunchSupportingWorld={(world) => {
                    setShow3DObservatory(false);
                    setActiveSupportingWorld(world);
                    scrollToSection('subjects', world);
                  }}
                  onOpenExperimentLibrary={() =>
                    scrollToSection('experiment-library', 'experiment-library')
                  }
                  onOpenMentorWithPrompt={handleOpenMentorWithPrompt}
                />
              </div>
            )}

            {activeView === 'experiment-library' && (
              <div id="experiment-library-section">
                <ExperimentLibraryView
                  language={language}
                  learningPath={learningPath}
                  progress={progress}
                  onToggleExperimentComplete={handleToggleExperimentComplete}
                  onLaunchPhysicsSim={(topic) => {
                    if (
                      topic === 'mechanics' ||
                      topic === 'electricity' ||
                      topic === 'magnetism' ||
                      topic === 'optics' ||
                      topic === 'waves' ||
                      topic === 'thermodynamics'
                    ) {
                      setActivePhysicsTopic(topic);
                    }
                    openPhysicsWorkbench(topic);
                  }}
                  onLaunchSupportingWorld={(world) => {
                    setShow3DObservatory(false);
                    setActiveSupportingWorld(world);
                    scrollToSection('subjects', world);
                  }}
                  onOpenChapter={(chapId) => handleOpenMyLearning(chapId)}
                />
              </div>
            )}

            {activeView === 'curriculum' && (
              <div id="curriculum-section">
                <CurriculumBrowser
                  language={language}
                  onLanguageChange={setLanguage}
                  learningPath={learningPath}
                  onLearningPathChange={setLearningPath}
                  offlineMetas={offlineMetas}
                  onOfflinePacksChanged={() => void refreshOfflinePacks()}
                  onOpenPhysicsExperiment={(exp) => openPhysicsWorkbench(exp)}
                  onOpenSupportingWorld={(world) => {
                    setShow3DObservatory(false);
                    setActiveSupportingWorld(world);
                    scrollToSection('subjects', world);
                  }}
                />
              </div>
            )}

            {activeView === 'physics' && (
              <div id="physics-section">
                <PhysicsLabSuite
                  onContextChange={setLabContext}
                  language={language}
                  activeTopic={activePhysicsTopic}
                  onSelectTopic={(topic) => {
                    setActivePhysicsTopic(topic);
                    setSelectedExperiment(topic);
                    setActiveLabTab('simulations');
                  }}
                  selectedExperiment={selectedExperiment}
                  onSelectExperiment={setSelectedExperiment}
                  activeLabTab={activeLabTab}
                  onSelectLabTab={setActiveLabTab}
                  lowPowerMode={a11y.lowPowerMode}
                  completedModules={progress.completedModules}
                  syncStatus={syncStatus}
                  pendingSyncCount={pendingSyncCount}
                  projectileFocusSection={projectileFocusSection}
                  onAttemptRecorded={handleAttemptRecorded}
                  onSaveProjectileQuiz={handleSaveProjectileQuiz}
                  onOfflinePacksChanged={() => void refreshOfflinePacks()}
                  onCompleteModule={handleCompleteModule}
                  onLogReading={handleLogReading}
                  onOpenMentorWithPrompt={handleOpenMentorWithPrompt}
                  station={activeStation}
                  onSelectStation={(id) => {
                    setActiveStation(id);
                    updateLocationHash(id ?? 'physics');
                  }}
                />
              </div>
            )}

            {activeView === 'subjects' && (
              <div id="subjects-section">
                <SupportingWorlds
                  language={language}
                  activeWorld={activeSupportingWorld}
                  onSelectWorld={setActiveSupportingWorld}
                  completedModules={progress.completedModules}
                  quizScores={progress.quizScores}
                  onCompleteModule={handleCompleteModule}
                  onSaveQuizScore={handleSaveQuizScore}
                  onOpenMentorWithPrompt={handleOpenMentorWithPrompt}
                  onReturnToPhysics={() => openProjectileFocus('mission')}
                />
              </div>
            )}

            {activeView === 'demo' && (
              <DemoJourney
                language={language}
                path={learningPath}
                onPathChange={setLearningPath}
                onPacksChanged={() => void refreshOfflinePacks()}
                onOpenSaved={() => scrollToSection('resources')}
                onOpenChapter={(id) => handleOpenMyLearning(id)}
              />
            )}

            {activeView === 'coverage' && <CoverageOverview language={language} />}
            {activeView === 'tutor' && (
              <AdaptiveTutor
                language={language}
                initialFocus={tutorFocus}
                onFocusConsumed={() => setTutorFocus(undefined)}
                onOpenStory={(id) => scrollToSection('stories', `story/${id}`)}
                initialTab={/diagnostic/i.test(window.location.search + window.location.hash) ? 'diagnostic' : undefined}
                onOpenAccount={() => scrollToSection('account')}
                onOpenTeacher={() => scrollToSection('teacher')}
              />
            )}
            {activeView === 'stories' && (
              <StoryLibrary
                language={language}
                lowPower={a11y.lowPowerMode}
                onPractice={(conceptId) => {
                  setTutorFocus(conceptId);
                  scrollToSection('tutor');
                }}
              />
            )}
            {activeView === 'teacher' && <TeacherDashboard language={language} onOpenAccount={() => scrollToSection('account')} />}
            {activeView === 'account' && (
              <AccountPage
                language={language}
                learningPath={learningPath}
                onLearningPathChange={setLearningPath}
                onResetLocalProgress={handleResetProgress}
              />
            )}

            {activeView === 'resources' && (
              <SavedLessons
                metas={offlineMetas}
                language={language}
                onChanged={() => void refreshOfflinePacks()}
                onOpenChapter={(m) => {
                  if (!m.curriculum) return;
                  setLearningPath({
                    ...learningPath,
                    classLevel: m.curriculum.classLevel,
                    board: m.curriculum.board,
                    stateName: m.curriculum.stateName ?? '',
                    session: m.curriculum.session,
                    configured: true,
                  });
                  handleOpenMyLearning(m.curriculum.chapterId);
                }}
              />
            )}

            {activeView === 'resources' && (
              <div id="dashboards-section">
                <DashboardsHub
                  language={language}
                  role="student"
                  onRoleChange={() => setRole('student')}
                  progress={progress}
                  user={user}
                  isOnline={isOnline}
                  syncStatus={syncStatus}
                  pendingSyncCount={pendingSyncCount}
                  offlineMetas={offlineMetas}
                  onClaimDailyChallenge={handleClaimDailyChallenge}
                  onOfflinePacksChanged={() => void refreshOfflinePacks()}
                  onOpenPhysicsModule={(topic) => {
                    setActivePhysicsTopic(topic);
                    scrollToSection('physics');
                  }}
                  onOpenProjectileDownload={() => openProjectileFocus('download')}
                  onLoadDemoProfile={handleLoadDemoProfile}
                  onResetProgress={handleResetProgress}
                  resourcesOnly
                />
              </div>
            )}

            {activeView === 'dashboards' && (
              <div id="dashboards-section">
                <DashboardsHub
                  language={language}
                  role={role}
                  onRoleChange={setRole}
                  progress={progress}
                  user={user}
                  isOnline={isOnline}
                  syncStatus={syncStatus}
                  pendingSyncCount={pendingSyncCount}
                  offlineMetas={offlineMetas}
                  onClaimDailyChallenge={handleClaimDailyChallenge}
                  onOfflinePacksChanged={() => void refreshOfflinePacks()}
                  onOpenPhysicsModule={(topic) => {
                    setActivePhysicsTopic(topic);
                    scrollToSection('physics');
                  }}
                  onOpenProjectileDownload={() => openProjectileFocus('download')}
                  onLoadDemoProfile={handleLoadDemoProfile}
                  onResetProgress={handleResetProgress}
                />
              </div>
            )}

            {activeView === 'video' && (
              <VideoAnimatorLab language={language} focusTool={focusMediaTool} />
            )}
          </>
        )}
        </div>
        </Suspense>
      </main>

      <footer className="border-t border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] py-5">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
          <div>
            <span className="font-semibold text-[#2E1A6E] dark:text-white">Gyaan Graph</span>
            <span className="mx-2">·</span>
            <span>Interactive Physics &amp; Multilingual STEM Learning</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => scrollToSection('experiment-library', 'experiment-library')}
              className="min-h-[44px] inline-flex items-center text-[#5B21B6] dark:text-[#C4B5FD] font-medium hover:text-[#2E1A6E] dark:hover:text-white transition-colors cursor-pointer"
            >
              {t.menuExperimentLibrary}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('curriculum', 'chapters')}
              className="min-h-[44px] inline-flex items-center text-[#5B21B6] dark:text-[#C4B5FD] font-medium hover:text-[#2E1A6E] dark:hover:text-white transition-colors cursor-pointer"
            >
              {t.chaptersExperimentsTitle}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('physics')}
              className="min-h-[44px] inline-flex items-center text-[#5B21B6] dark:text-[#C4B5FD] font-medium hover:text-[#2E1A6E] dark:hover:text-white transition-colors cursor-pointer"
            >
              {t.navPhysics}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('subjects')}
              className="min-h-[44px] inline-flex items-center text-[#5B21B6] dark:text-[#C4B5FD] font-medium hover:text-[#2E1A6E] dark:hover:text-white transition-colors cursor-pointer"
            >
              {t.navSubjects}
            </button>
            <button
              type="button"
              onClick={() => scrollToSection('resources')}
              className="min-h-[44px] inline-flex items-center text-[#5B21B6] dark:text-[#C4B5FD] font-medium hover:text-[#2E1A6E] dark:hover:text-white transition-colors cursor-pointer"
            >
              {t.navResources}
            </button>
          </div>
        </div>
      </footer>

      {mentorLoaded && (
        <Suspense fallback={null}>
        <AIMentorDrawer
          open={mentorOpen}
          onClose={() => setMentorOpen(false)}
          language={language}
          initialSubject={mentorSubject}
          initialPrompt={mentorPrompt}
          experimentContext={activeView === 'physics' ? labContext : ''}
        />
        </Suspense>
      )}

      <OfflineIndicator language={language} savedOfflineCount={offlineMetas.length} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <StemSaathiApp />
    </ErrorBoundary>
  );
}

