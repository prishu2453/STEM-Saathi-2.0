import React, { useEffect, useRef, useState } from 'react';
import {
  Accessibility,
  Atom,
  Brain,
  Clapperboard,
  BookOpen,
  Calculator,
  ClipboardList,
  Cpu,
  Eye,
  Flame,
  FlaskConical,
  GraduationCap,
  HardDriveDownload,
  Home,
  Leaf,
  LogIn,
  LogOut,
  Magnet,
  Mic,
  Moon,
  Orbit,
  Sigma,
  Sparkles,
  Sun,
  Type as TypeIcon,
  Waves,
  X,
  Zap,
  UserRound,
  Users,
} from 'lucide-react';
import { formatLearningPathSummary } from '../data/learningPathCore';
import { LANGUAGE_LABELS, UI_TEXT } from '../data/i18n';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { User } from '../lib/firebase';
import type {
  AccessibilityState,
  FontScale,
  Language,
  LearningPathPreference,
  MainSection,
  PhysicsTopicId,
  SupportingWorldId,
  UserRole,
} from '../types/stem';
import { PWAInstallButton } from './AccessibilityToolbar';
import { StudentPathSelector } from './StudentPathSelector';

export type AppWorkspaceView = MainSection | 'video';

interface SideDashboardDrawerProps {
  open: boolean;
  onClose: () => void;
  returnFocusToRef?: React.RefObject<HTMLButtonElement | null>;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  activeView: AppWorkspaceView;
  activePhysicsTopic: PhysicsTopicId;
  activeLabTab: 'simulations' | 'practicals' | 'solver';
  activeSupportingWorld: SupportingWorldId;
  focusMediaTool: 'video' | 'audio' | null;
  show3DObservatory: boolean;
  role: UserRole;
  a11y: AccessibilityState;
  onA11yChange: (next: AccessibilityState) => void;
  user: User | null;
  authLoading: boolean;
  savedOfflineCount: number;
  pendingSyncCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
  onSelectHome: () => void;
  onSelectCurriculum: () => void;
  onSelectMyLearning: () => void;
  onSelectExperimentLibrary: () => void;
  learningPath: LearningPathPreference;
  onLearningPathChange: (next: LearningPathPreference) => void;
  onSelectQuantumLab: () => void;
  onSelectPhysicsTopic: (topic: PhysicsTopicId) => void;
  onSelectPhysicsTab: (tab: 'practicals' | 'solver') => void;
  onSelectSupportingWorld: (world: SupportingWorldId) => void;
  onSelectMediaTool: (tool: 'video' | 'audio') => void;
  onSelectDashboardRole: (role: UserRole) => void;
  onSelectView: (view: AppWorkspaceView) => void;
  onOpenMentor: () => void;
  onOpen3DObservatory: () => void;
}

export const SideDashboardDrawer: React.FC<SideDashboardDrawerProps> = ({
  open,
  onClose,
  returnFocusToRef,
  language,
  onLanguageChange,
  activeView,
  activePhysicsTopic,
  activeLabTab,
  activeSupportingWorld,
  focusMediaTool,
  show3DObservatory,
  role,
  a11y,
  onA11yChange,
  user,
  authLoading,
  savedOfflineCount,
  pendingSyncCount,
  onSignIn,
  onSignOut,
  onSelectHome,
  onSelectCurriculum,
  onSelectMyLearning,
  onSelectExperimentLibrary,
  learningPath,
  onLearningPathChange,
  onSelectQuantumLab,
  onSelectPhysicsTopic,
  onSelectPhysicsTab,
  onSelectSupportingWorld,
  onSelectMediaTool,
  onSelectDashboardRole,
  onSelectView,
  onOpenMentor,
  onOpen3DObservatory,
}) => {
  const isOnline = useOnlineStatus();
  const t = UI_TEXT[language];
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(false);
  const [pathEditorOpen, setPathEditorOpen] = useState(false);

  // Move focus into the drawer when opened; restore focus to the menu button when closed
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      const frame = requestAnimationFrame(() => {
        closeBtnRef.current?.focus();
      });
      return () => cancelAnimationFrame(frame);
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      returnFocusToRef?.current?.focus();
    }
  }, [open, returnFocusToRef]);

  // Escape key closes drawer
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const cycleFontScale = () => {
    const order: FontScale[] = ['base', 'md', 'lg'];
    const idx = order.indexOf(a11y.fontScale);
    onA11yChange({ ...a11y, fontScale: order[(idx + 1) % order.length] });
  };

  const physicsTopics: { id: PhysicsTopicId; label: string; icon: React.ReactNode }[] = [
    { id: 'mechanics', label: t.menuPhysicsMechanics, icon: <Atom className="w-4 h-4" aria-hidden="true" /> },
    { id: 'electricity', label: t.menuPhysicsElectricity, icon: <Zap className="w-4 h-4" aria-hidden="true" /> },
    { id: 'magnetism', label: t.menuPhysicsMagnetism, icon: <Magnet className="w-4 h-4" aria-hidden="true" /> },
    { id: 'optics', label: t.menuPhysicsOptics, icon: <Sparkles className="w-4 h-4" aria-hidden="true" /> },
    { id: 'waves', label: t.menuPhysicsWaves, icon: <Waves className="w-4 h-4" aria-hidden="true" /> },
    { id: 'thermodynamics', label: t.menuPhysicsEnergy, icon: <Flame className="w-4 h-4" aria-hidden="true" /> },
  ];

  const subjects: { id: SupportingWorldId; label: string; icon: React.ReactNode }[] = [
    {
      id: 'chemistry',
      label: t.subjChemistry,
      icon: <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />,
    },
    {
      id: 'biology',
      label: t.subjBiology,
      icon: <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />,
    },
    {
      id: 'mathematics',
      label: t.subjMathematics,
      icon: <Sigma className="w-4 h-4 text-teal-600 dark:text-teal-400" aria-hidden="true" />,
    },
  ];

  const itemClass = (isActive: boolean) =>
    `w-full flex items-center gap-3 rounded-xl px-3 py-2.5 min-h-[44px] text-left text-sm font-medium transition-colors cursor-pointer ${
      isActive
        ? 'bg-[#6D28D9] text-white shadow-xs'
        : 'text-[#2E1A6E] dark:text-[#F3EFFF] hover:bg-[#F5F0FF] dark:hover:bg-[#2A1D5C]'
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label={t.sideMenuLabel}
    >
      {/* Darkened Backdrop */}
      <div
        className="animate-fade-in fixed inset-0 bg-[#2E1A6E]/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Left Side Drawer */}
      <aside className="animate-drawer-in relative z-10 w-[86vw] max-w-[340px] h-full bg-white dark:bg-[#1F1545] border-r border-[#E7DDFB] dark:border-[#3B2C78] flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="px-4 py-3.5 border-b border-[#E7DDFB] dark:border-[#3B2C78] flex items-center justify-between gap-2 bg-[#F5F0FF] dark:bg-[#122538]">
          <div>
            <p className="font-display text-lg font-bold tracking-tight text-[#2E1A6E] dark:text-white">
              Gyaan Graph
            </p>
            <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
              {isOnline ? t.onlineStatus : t.offlineStatus} ·{' '}
              {savedOfflineCount > 0 ? `${savedOfflineCount} ${t.savedOffline}` : t.statusNotDownloaded}
            </p>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label={t.closeMenuLabel}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Feature Directory */}
        <nav aria-label={t.openMenuCta} className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          {/* 1. Home & Chapters Browser */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                onSelectHome();
                onClose();
              }}
              aria-current={activeView === 'universe' && !show3DObservatory ? 'page' : undefined}
              className={itemClass(activeView === 'universe' && !show3DObservatory)}
            >
              <Home className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.navUniverse}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectView('tutor');
                onClose();
              }}
              aria-current={activeView === 'tutor' ? 'page' : undefined}
              className={itemClass(activeView === 'tutor')}
            >
              <Brain className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{language === 'hi' ? 'स्मार्ट अभ्यास (AI ट्यूटर)' : language === 'kn' ? 'ಸ್ಮಾರ್ಟ್ ಅಭ್ಯಾಸ (AI ಶಿಕ್ಷಕ)' : 'Smart Practice (AI tutor)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectView('stories');
                onClose();
              }}
              aria-current={activeView === 'stories' ? 'page' : undefined}
              className={itemClass(activeView === 'stories')}
            >
              <Clapperboard className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{language === 'hi' ? '3D कहानी पाठ (कक्षा 10)' : language === 'kn' ? '3D ಕಥಾ ಪಾಠಗಳು (10ನೇ ತರಗತಿ)' : '3D story lessons (Class 10)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectView('teacher');
                onClose();
              }}
              aria-current={activeView === 'teacher' ? 'page' : undefined}
              className={itemClass(activeView === 'teacher')}
            >
              <Users className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{language === 'hi' ? 'शिक्षक डैशबोर्ड' : language === 'kn' ? 'ಶಿಕ್ಷಕರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Teacher dashboard'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectExperimentLibrary();
                onClose();
              }}
              aria-current={activeView === 'experiment-library' ? 'page' : undefined}
              className={itemClass(activeView === 'experiment-library')}
            >
              <FlaskConical className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.menuExperimentLibrary}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectCurriculum();
                onClose();
              }}
              aria-current={activeView === 'curriculum' ? 'page' : undefined}
              className={itemClass(activeView === 'curriculum')}
            >
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.chaptersExperimentsTitle}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectView('demo');
                onClose();
              }}
              aria-current={activeView === 'demo' ? 'page' : undefined}
              className={itemClass(activeView === 'demo')}
            >
              <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{language === 'hi' ? 'सीखने की यात्रा (डेमो)' : language === 'kn' ? 'ಕಲಿಕೆಯ ಪ್ರಯಾಣ (ಡೆಮೊ)' : 'Learning journey (demo)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectView('account');
                onClose();
              }}
              aria-current={activeView === 'account' ? 'page' : undefined}
              className={itemClass(activeView === 'account')}
            >
              <UserRound className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{language === 'hi' ? 'लॉग इन / मेरा खाता' : language === 'kn' ? 'ಲಾಗ್ ಇನ್ / ನನ್ನ ಖಾತೆ' : 'Log in / My account'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectView('coverage');
                onClose();
              }}
              aria-current={activeView === 'coverage' ? 'page' : undefined}
              className={itemClass(activeView === 'coverage')}
            >
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{language === 'hi' ? 'कवरेज और विश्वसनीयता' : language === 'kn' ? 'ವ್ಯಾಪ್ತಿ ಮತ್ತು ವಿಶ್ವಾಸ' : 'Coverage & trust'}</span>
            </button>
          </div>

          {/* 2. Physics */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-[#4A3F66] dark:text-[#B3A6DE]">
              {t.menuSectionPhysics}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectQuantumLab();
                onClose();
              }}
              className={itemClass(false)}
            >
              <Waves className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD] shrink-0" aria-hidden="true" />
              <span>Double-Slit &amp; Quantum Labs</span>
            </button>
            {physicsTopics.map((topic) => {
              const isCurrent =
                activeView === 'physics' && activeLabTab === 'simulations' && activePhysicsTopic === topic.id;
              return (
                <button
                  key={topic.id}
                  type="button"
                  onClick={() => {
                    onSelectPhysicsTopic(topic.id);
                    onClose();
                  }}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={itemClass(isCurrent)}
                >
                  <span className="shrink-0">{topic.icon}</span>
                  <span>{topic.label}</span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                onSelectPhysicsTab('practicals');
                onClose();
              }}
              aria-current={activeView === 'physics' && activeLabTab === 'practicals' ? 'page' : undefined}
              className={itemClass(activeView === 'physics' && activeLabTab === 'practicals')}
            >
              <ClipboardList className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.menuPhysicsPracticals}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onSelectPhysicsTab('solver');
                onClose();
              }}
              aria-current={activeView === 'physics' && activeLabTab === 'solver' ? 'page' : undefined}
              className={itemClass(activeView === 'physics' && activeLabTab === 'solver')}
            >
              <Calculator className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.menuPhysicsSolver}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onOpen3DObservatory();
                onClose();
              }}
              aria-current={show3DObservatory ? 'page' : undefined}
              className={itemClass(show3DObservatory)}
            >
              <Orbit className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.menuPhysics3D}</span>
            </button>
          </div>

          {/* 3. Other subjects */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-[#4A3F66] dark:text-[#B3A6DE]">
              {t.menuSectionSubjects}
            </p>
            {subjects.map((subj) => {
              const isCurrent = activeView === 'subjects' && activeSupportingWorld === subj.id;
              return (
                <button
                  key={subj.id}
                  type="button"
                  onClick={() => {
                    onSelectSupportingWorld(subj.id);
                    onClose();
                  }}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={itemClass(isCurrent)}
                >
                  <span className="shrink-0">{subj.icon}</span>
                  <span>{subj.label}</span>
                </button>
              );
            })}
          </div>

          {/* 4. Learning tools */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-[#4A3F66] dark:text-[#B3A6DE]">
              {t.menuSectionTools}
            </p>

            <button
              type="button"
              onClick={() => {
                onOpenMentor();
                onClose();
              }}
              className={itemClass(false)}
            >
              <Sparkles className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD] shrink-0" aria-hidden="true" />
              <span>{t.askMentor}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSelectMediaTool('audio');
                onClose();
              }}
              aria-current={activeView === 'video' && focusMediaTool === 'audio' ? 'page' : undefined}
              className={itemClass(activeView === 'video' && focusMediaTool === 'audio')}
            >
              <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.toolAudioTranscriber}</span>
            </button>
          </div>

          {/* 5. My learning (Class / Board preference + Dashboards) */}
          <div className="space-y-2">
            <p className="px-3 text-xs font-semibold text-[#4A3F66] dark:text-[#B3A6DE]">
              {t.menuSectionMyLearning}
            </p>

            <div className="mx-1 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[11px] font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
                    {t.chooseYourClassLabel}
                  </p>
                  <p className="text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mt-0.5 tabular-nums">
                    {formatLearningPathSummary(learningPath, language)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPathEditorOpen((v) => !v)}
                  className="shrink-0 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2.5 py-1.5 min-h-[34px] text-[11px] font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:border-[#6D28D9] cursor-pointer"
                >
                  {pathEditorOpen ? t.savePathBtn : t.changeClassBoardBtn}
                </button>
              </div>
              {pathEditorOpen && (
                <StudentPathSelector
                  language={language}
                  learningPath={learningPath}
                  onChange={onLearningPathChange}
                  compact
                />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                onSelectMyLearning();
                onClose();
              }}
              aria-current={activeView === 'my-learning' ? 'page' : undefined}
              className={itemClass(activeView === 'my-learning')}
            >
              <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{t.menuMyLearning}</span>
            </button>

            {(
              [
                {
                  id: 'student',
                  label: t.menuStudentDashboard,
                  icon: <GraduationCap className="w-4 h-4 shrink-0" aria-hidden="true" />,
                },
              ] as { id: UserRole; label: string; icon: React.ReactNode }[]
            ).map((item) => {
              const isCurrent = activeView === 'dashboards' && role === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectDashboardRole(item.id);
                    onClose();
                  }}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={itemClass(isCurrent)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* 6. Offline */}
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-[#4A3F66] dark:text-[#B3A6DE]">
              {t.menuSectionOffline}
            </p>
            <button
              type="button"
              onClick={() => {
                onSelectView('resources');
                onClose();
              }}
              aria-current={activeView === 'resources' ? 'page' : undefined}
              className={itemClass(activeView === 'resources')}
            >
              <HardDriveDownload className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="flex-1">{t.menuDownloadedLessons}</span>
              {savedOfflineCount > 0 && (
                <span className="text-xs font-mono opacity-85 tabular-nums">{savedOfflineCount}</span>
              )}
            </button>
          </div>

          {/* 7. Settings */}
          <div className="space-y-3 pt-3 border-t border-[#E7DDFB] dark:border-[#3B2C78]">
            <p className="px-3 text-xs font-semibold text-[#4A3F66] dark:text-[#B3A6DE] flex items-center gap-1.5">
              <Accessibility className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.menuSectionSettings}</span>
            </p>

            {/* Languages: English, हिन्दी, ಕನ್ನಡ */}
            <div className="px-1">
              <div
                role="group"
                aria-label={t.actionChooseLanguage}
                className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-1 border border-[#E7DDFB] dark:border-[#3B2C78]"
              >
                {(['en', 'hi', 'kn'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onLanguageChange(lang)}
                    className={`py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      language === lang
                        ? 'bg-[#6D28D9] text-white'
                        : 'text-[#2E1A6E] dark:text-[#E4DDFA] hover:text-[#6D28D9] dark:hover:text-white'
                    }`}
                  >
                    {LANGUAGE_LABELS[lang]}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme + Accessibility & Lite Mode */}
            <div className="grid grid-cols-2 gap-1.5 px-1">
              <button
                type="button"
                onClick={() =>
                  onA11yChange({ ...a11y, theme: a11y.theme === 'dark' ? 'light' : 'dark' })
                }
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-2.5 py-2 min-h-[42px] text-xs font-medium text-[#2E1A6E] dark:text-[#F5F0FF] cursor-pointer"
              >
                {a11y.theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#FF9F1C]" aria-hidden="true" />
                    <span>{t.lightTheme}</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#2E1A6E]" aria-hidden="true" />
                    <span>{t.darkTheme}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={cycleFontScale}
                className="inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-2.5 py-2 min-h-[42px] text-xs font-medium text-[#2E1A6E] dark:text-[#F5F0FF] cursor-pointer"
              >
                {t.textSizeLabel}:{' '}
                {a11y.fontScale === 'base' ? '100%' : a11y.fontScale === 'md' ? '112%' : '125%'}
              </button>

              <button
                type="button"
                onClick={() => onA11yChange({ ...a11y, highContrast: !a11y.highContrast })}
                aria-pressed={a11y.highContrast}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 min-h-[42px] text-xs font-medium cursor-pointer ${
                  a11y.highContrast
                    ? 'border-[#FF9F1C] bg-[#FF9F1C]/20 text-[#2E1A6E] dark:text-[#F5F0FF]'
                    : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#E4DDFA]'
                }`}
              >
                <Eye className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.highContrast}</span>
              </button>

              <button
                type="button"
                onClick={() => onA11yChange({ ...a11y, lowPowerMode: !a11y.lowPowerMode })}
                aria-pressed={a11y.lowPowerMode}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 min-h-[42px] text-xs font-medium cursor-pointer ${
                  a11y.lowPowerMode
                    ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#6D28D9]/25 text-[#5B21B6] dark:text-[#C4B5FD]'
                    : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#E4DDFA]'
                }`}
              >
                <Cpu className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.liteModeShort}</span>
              </button>

              <button
                type="button"
                onClick={() => onA11yChange({ ...a11y, dyslexiaSpacing: !a11y.dyslexiaSpacing })}
                aria-pressed={a11y.dyslexiaSpacing}
                className={`col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border px-2.5 py-2 min-h-[42px] text-xs font-medium cursor-pointer ${
                  a11y.dyslexiaSpacing
                    ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#6D28D9]/25 text-[#5B21B6] dark:text-[#C4B5FD]'
                    : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#E4DDFA]'
                }`}
              >
                <TypeIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{t.dyslexiaFont}</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Drawer Footer: Optional Sign In / Sync + Offline Save Info + PWA Install */}
        <div className="p-3.5 border-t border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#122538] space-y-2">
          <div className="flex items-center justify-between gap-2">
            {user ? (
              <button
                type="button"
                onClick={onSignOut}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#6D28D9]/50 bg-[#EFE7FF] dark:bg-[#6D28D9]/20 px-3 py-2 min-h-[42px] text-xs font-medium text-[#5B21B6] dark:text-[#C4B5FD] cursor-pointer"
              >
                <span>{(user.displayName || 'Synced').split(' ')[0]}</span>
                <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                disabled={authLoading || !isOnline}
                onClick={onSignIn}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#2A1D5C] px-3 py-2 min-h-[42px] text-xs font-medium text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
                <span>
                  {authLoading
                    ? t.signingInLabel
                    : isOnline
                      ? t.signInToSync
                      : t.savedOnDeviceLabel}
                </span>
              </button>
            )}
            <PWAInstallButton />
          </div>
          <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">
            {pendingSyncCount > 0
              ? `${pendingSyncCount} ${t.queuedSyncSuffix}`
              : t.deviceSyncExplain}
          </p>
        </div>
      </aside>
    </div>
  );
};
