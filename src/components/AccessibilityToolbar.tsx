import React, { useState } from 'react';
import {
  Accessibility,
  Cpu,
  Download,
  Eye,
  LogIn,
  LogOut,
  Moon,
  Sun,
  Type as TypeIcon,
  WifiOff,
  X,
} from 'lucide-react';
import { LANGUAGE_LABELS, UI_TEXT } from '../data/i18n';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { usePWAInstall } from '../hooks/usePWAInstall';
import type { User } from '../lib/firebase';
import type { AccessibilityState, FontScale, Language, UserRole } from '../types/stem';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-2 rounded-lg border border-[#6D28D9]/45 bg-[#6D28D9]/10 px-3 py-1.5 text-xs font-medium text-[#5B21B6] dark:text-[#C4B5FD] hover:bg-[#6D28D9]/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#F5F0FF] hover:bg-[#F5F0FF] dark:hover:bg-[#2A1D5C] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Install Gyaan Graph on iOS"
            className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          >
            <div className="animate-panel-reveal w-full max-w-sm rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
                  Install Gyaan Graph on iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Close install instructions"
                  className="p-1 rounded-lg text-[#4A3F66] hover:text-[#2E1A6E] dark:text-[#C9BFEA] dark:hover:text-[#F5F0FF]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[#22163F] dark:text-[#E4DDFA] list-decimal pl-4">
                <li>Tap the Share button in the Safari toolbar.</li>
                <li>Scroll down and choose Add to Home Screen for offline study.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#6D28D9] py-2 text-sm font-medium text-white hover:bg-[#5B21B6] transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC<{ language: Language; savedOfflineCount: number }> = ({
  language,
  savedOfflineCount,
}) => {
  const isOnline = useOnlineStatus();
  const t = UI_TEXT[language];

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg border border-[#FF9F1C]/60 bg-[#2E1A6E] px-3 py-2 text-xs font-medium text-[#F5F0FF] shadow-lg max-w-[260px]"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#FF9F1C] shrink-0" aria-hidden="true" />
      <span>
        {t.offlineStatus} —{' '}
        {savedOfflineCount > 0
          ? `${savedOfflineCount} ${t.statusAvailableOffline.toLowerCase()}`
          : t.statusNotDownloaded}
      </span>
    </div>
  );
};

interface WorkspaceControlsProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  a11y: AccessibilityState;
  onA11yChange: (next: AccessibilityState) => void;
  user: User | null;
  authLoading: boolean;
  savedOfflineCount: number;
  pendingSyncCount: number;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const WorkspaceToolbar: React.FC<WorkspaceControlsProps> = ({
  language,
  onLanguageChange,
  role,
  onRoleChange,
  a11y,
  onA11yChange,
  user,
  authLoading,
  savedOfflineCount,
  pendingSyncCount,
  onSignIn,
  onSignOut,
}) => {
  const [openA11y, setOpenA11y] = useState(false);
  const isOnline = useOnlineStatus();
  const t = UI_TEXT[language];

  const cycleFontScale = () => {
    const order: FontScale[] = ['base', 'md', 'lg'];
    const idx = order.indexOf(a11y.fontScale);
    onA11yChange({ ...a11y, fontScale: order[(idx + 1) % order.length] });
  };

  return (
    <div className="border-b border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF]/90 dark:bg-[#120A28]/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Language + Role Switchers */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Language selection"
            className="inline-flex items-center rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FFF3E6] dark:bg-[#1F1545] p-0.5"
          >
            {(['en', 'hi', 'kn'] as Language[]).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  language === lang
                    ? 'bg-[#6D28D9] text-white'
                    : 'text-[#22163F] dark:text-[#E4DDFA] hover:text-[#2E1A6E] dark:hover:text-[#F5F0FF]'
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>

          <div
            role="group"
            aria-label="Dashboard role selection"
            className="inline-flex items-center rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FFF3E6] dark:bg-[#1F1545] p-0.5"
          >
            {(
              [
                { id: 'student', label: t.roleStudent },
                { id: 'teacher', label: t.roleTeacher },
                { id: 'admin', label: t.roleAdmin },
              ] as { id: UserRole; label: string }[]
            ).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onRoleChange(item.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  role === item.id
                    ? 'bg-white dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F5F0FF] shadow-sm'
                    : 'text-[#4A3F66] dark:text-[#C9BFEA] hover:text-[#2E1A6E] dark:hover:text-[#F5F0FF]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Cloud Sync Auth, Honest Offline Status, PWA install, Theme & Accessibility */}
        <div className="flex items-center gap-2 flex-wrap">
          {user ? (
            <button
              type="button"
              onClick={onSignOut}
              title={`Signed in as ${user.email || user.displayName || 'Learner'}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600/40 bg-emerald-600/10 px-2.5 py-1.5 text-xs font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-600/20 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>{(user.displayName || 'Synced').split(' ')[0]}</span>
              <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={authLoading || !isOnline}
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2.5 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#E4DDFA] hover:border-[#6D28D9] whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              <LogIn className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
              <span>{authLoading ? 'Signing in...' : 'Sign in (Sync)'}</span>
            </button>
          )}

          <span className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] whitespace-nowrap tabular-nums">
            {isOnline ? t.onlineStatus : t.offlineStatus}
            {' · '}
            {savedOfflineCount > 0 ? `${savedOfflineCount} ${t.savedOffline}` : t.statusNotDownloaded}
            {pendingSyncCount > 0 ? ` · ${t.statusWaitingSync}` : ''}
          </span>

          <PWAInstallButton />

          <button
            type="button"
            onClick={() =>
              onA11yChange({ ...a11y, theme: a11y.theme === 'dark' ? 'light' : 'dark' })
            }
            aria-label={a11y.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2.5 py-1.5 text-xs font-medium text-[#2E1A6E] dark:text-[#E4DDFA] hover:border-[#6D28D9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {a11y.theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-[#FF9F1C]" aria-hidden="true" />
                <span>{t.lightTheme}</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-[#6D28D9]" aria-hidden="true" />
                <span>{t.darkTheme}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setOpenA11y((v) => !v)}
            aria-expanded={openA11y}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              openA11y || a11y.highContrast || a11y.dyslexiaSpacing || a11y.lowPowerMode
                ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] text-[#2E1A6E] dark:text-[#E4DDFA] hover:border-[#6D28D9]'
            }`}
          >
            <Accessibility className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.accessibilityLabel}</span>
          </button>
        </div>
      </div>

      {openA11y && (
        <div className="border-t border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FFF3E6] dark:bg-[#1F1545]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onA11yChange({ ...a11y, highContrast: !a11y.highContrast })}
              aria-pressed={a11y.highContrast}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                a11y.highContrast
                  ? 'border-[#FF9F1C] bg-[#FF9F1C]/20 text-[#B4430C] dark:text-[#FF9F1C]'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#22163F] dark:text-[#E4DDFA]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.highContrast}</span>
            </button>

            <button
              type="button"
              onClick={() => onA11yChange({ ...a11y, dyslexiaSpacing: !a11y.dyslexiaSpacing })}
              aria-pressed={a11y.dyslexiaSpacing}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                a11y.dyslexiaSpacing
                  ? 'border-[#6D28D9] bg-[#6D28D9]/15 text-[#5B21B6] dark:text-[#C4B5FD]'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#22163F] dark:text-[#E4DDFA]'
              }`}
            >
              <TypeIcon className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.dyslexiaFont}</span>
            </button>

            <button
              type="button"
              onClick={cycleFontScale}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-1.5 text-xs font-medium text-[#22163F] dark:text-[#E4DDFA] cursor-pointer hover:border-[#6D28D9]"
            >
              <span>Text Size: {a11y.fontScale === 'base' ? '100%' : a11y.fontScale === 'md' ? '112%' : '125%'}</span>
            </button>

            <button
              type="button"
              onClick={() => onA11yChange({ ...a11y, lowPowerMode: !a11y.lowPowerMode })}
              aria-pressed={a11y.lowPowerMode}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors ${
                a11y.lowPowerMode
                  ? 'border-emerald-500 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#22163F] dark:text-[#E4DDFA]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.lowPowerMode}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
