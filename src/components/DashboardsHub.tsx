import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Cloud,
  CloudOff,
  Download,
  Flame,
  HardDriveDownload,
  Info,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Target,
  Trash2,
} from 'lucide-react';
import {
  DAILY_CHALLENGES,

  PHYSICS_MODULES,
  RESOURCE_PACKS,
} from '../data/curriculum';
import { UI_TEXT } from '../data/i18n';
import type { User } from '../lib/firebase';
import {
  PROJECTILE_PACK_ID,
  downloadResourceStudyPack,
  formatBytes,
  removeOfflinePack,
} from '../lib/offlineStore';
import type {
  Language,
  OfflineDownloadStatus,
  OfflinePackMeta,
  PhysicsTopicId,
  StudentProgress,
  SyncStatus,
  UserRole,
} from '../types/stem';

interface DashboardsHubProps {
  language: Language;
  role: UserRole;
  onRoleChange: (role: UserRole) => void;
  progress: StudentProgress;
  user: User | null;
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  offlineMetas: OfflinePackMeta[];
  onClaimDailyChallenge: () => void;
  onOfflinePacksChanged: () => void;
  onOpenPhysicsModule: (topic: PhysicsTopicId) => void;
  onOpenProjectileDownload: () => void;
  onLoadDemoProfile: () => void;
  onResetProgress: () => void;
  resourcesOnly?: boolean;
}

export const DashboardsHub: React.FC<DashboardsHubProps> = ({
  language,
  role,
  onRoleChange,
  progress,
  user,
  isOnline,
  syncStatus,
  pendingSyncCount,
  offlineMetas,


  onClaimDailyChallenge,
  onOfflinePacksChanged,
  onOpenPhysicsModule,
  onOpenProjectileDownload,
  onLoadDemoProfile,
  onResetProgress,
  resourcesOnly = false,
}) => {
  const t = UI_TEXT[language];
  const [challengeChoice, setChallengeChoice] = useState<number | null>(null);
  const [challengeSubmitted, setChallengeSubmitted] = useState(progress.dailyChallengeDone);
  const [packStatusMap, setPackStatusMap] = useState<Record<string, OfflineDownloadStatus>>({});
  const [packError, setPackError] = useState<string | null>(null);

  const physicsCompletedCount = useMemo(
    () => PHYSICS_MODULES.filter((m) => progress.completedModules.includes(`physics-${m.id}`)).length,
    [progress.completedModules]
  );

  const offlineMetaById = useMemo(() => {
    const map = new Map<string, OfflinePackMeta>();
    for (const meta of offlineMetas) {
      map.set(meta.id, meta);
    }
    return map;
  }, [offlineMetas]);

  const projectilePackMeta = offlineMetaById.get(PROJECTILE_PACK_ID) ?? null;

  const syncLabel = useMemo(() => {
    if (syncStatus === 'synced' && user) return t.statusSyncedCloud;
    if (syncStatus === 'waiting-to-sync' || pendingSyncCount > 0) {
      return `${t.statusWaitingSync} (${pendingSyncCount})`;
    }
    return t.statusSavedLocally;
  }, [syncStatus, user, pendingSyncCount, t]);

  const recommendedNext = useMemo(() => {
    const nextPhysics = PHYSICS_MODULES.find(
      (m) => !progress.completedModules.includes(`physics-${m.id}`)
    );
    if (nextPhysics) {
      return {
        domain: t.primaryDomainLabel,
        title: nextPhysics.title[language],
        reason: nextPhysics.subtitle[language],
        actionLabel: t.openLab,
        topicId: nextPhysics.id,
      };
    }
    return {
      domain: t.primaryDomainLabel,
      title: PHYSICS_MODULES[0].title[language],
      reason: PHYSICS_MODULES[0].subtitle[language],
      actionLabel: t.openLab,
      topicId: 'mechanics' as PhysicsTopicId,
    };
  }, [progress.completedModules, language, t]);

  const achievements = useMemo(
    () => [
      {
        id: 'ach-1',
        title: "Newton's Apprentice",
        desc: 'Complete at least 1 Physics simulation lab',
        unlocked: physicsCompletedCount >= 1,
      },
      {
        id: 'ach-2',
        title: 'Lab Recorder',
        desc: 'Log 3+ readings or projectile trials',
        unlocked: progress.labReadingsCount + (progress.projectileAttempts ?? 0) >= 3,
      },
      {
        id: 'ach-3',
        title: 'Offline Scholar',
        desc: 'Download 1+ study pack to browser storage',
        unlocked: offlineMetas.length >= 1,
      },
      {
        id: 'ach-4',
        title: 'Target Hit!',
        desc: 'Land a projectile directly on a mission target',
        unlocked: (progress.projectileHits ?? 0) >= 1,
      },
    ],
    [
      physicsCompletedCount,
      progress.labReadingsCount,
      progress.projectileAttempts,
      progress.projectileHits,
      offlineMetas.length,
    ]
  );

  const dailyQ = DAILY_CHALLENGES[0];

  const handleToggleRealOfflinePack = async (packId: string) => {
    const pack = RESOURCE_PACKS.find((p) => p.id === packId);
    if (!pack) return;
    setPackError(null);
    const alreadySaved = offlineMetaById.has(packId);

    if (alreadySaved) {
      setPackStatusMap((prev) => ({ ...prev, [packId]: 'downloading' }));
      try {
        await removeOfflinePack(packId);
        setPackStatusMap((prev) => ({ ...prev, [packId]: 'not-downloaded' }));
        onOfflinePacksChanged();
      } catch (err) {
        setPackStatusMap((prev) => ({ ...prev, [packId]: 'not-downloaded' }));
        setPackError(err instanceof Error ? err.message : 'Unable to remove offline pack.');
      }
      return;
    }

    setPackStatusMap((prev) => ({ ...prev, [packId]: 'downloading' }));
    try {
      await downloadResourceStudyPack(pack);
      setPackStatusMap((prev) => ({ ...prev, [packId]: 'available-offline' }));
      onOfflinePacksChanged();
    } catch (err) {
      setPackStatusMap((prev) => ({ ...prev, [packId]: 'not-downloaded' }));
      setPackError(err instanceof Error ? err.message : 'Unable to cache pack offline.');
    }
  };

  const handleDownloadPackSheet = (packId: string, content: string) => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${packId}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <section
      aria-labelledby={resourcesOnly ? 'resources-heading' : 'dashboards-heading'}
      className="mx-auto max-w-7xl px-4 sm:px-6 py-8 space-y-8"
    >
      {!resourcesOnly && (
        <>
          {/* Header + Role Segmented Switch */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#4A3F66] dark:text-[#C9BFEA]">
                {progress.isDemoProfile ? t.demoDataBanner : t.earnedProgressTag}
              </p>
              <h2
                id="dashboards-heading"
                className="text-2xl sm:text-3xl font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mt-1"
              >
                {t.studentDashboardTitle}
              </h2>
            </div>
          </div>

          {/* STUDENT DASHBOARD */}
          {role === 'student' && (
        <div key="student" className="animate-panel-reveal space-y-6">
          {/* Honest Progress & Sync Status Bar */}
          <div className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              <span
                className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 font-medium ${
                  progress.isDemoProfile
                    ? 'border-[#FF9F1C]/50 bg-[#FF9F1C]/15 text-[#B4430C] dark:text-[#FF9F1C]'
                    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <Info className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{progress.isDemoProfile ? t.demoDataBanner : t.earnedProgressTag}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-2.5 py-1 text-[#2E1A6E] dark:text-[#F5F0FF]">
                {isOnline && user && syncStatus === 'synced' ? (
                  <Cloud className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                ) : (
                  <CloudOff className="w-3.5 h-3.5 text-[#B4430C] dark:text-[#FF9F1C]" aria-hidden="true" />
                )}
                <span>{syncLabel}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!progress.isDemoProfile ? (
                <button
                  type="button"
                  onClick={onLoadDemoProfile}
                  className="rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-1.5 min-h-[38px] text-xs font-medium text-[#2E1A6E] dark:text-[#F5F0FF] hover:bg-[#FFF3E6] dark:hover:bg-[#2A1D5C] cursor-pointer"
                >
                  Load Sample Demo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onResetProgress}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#FF9F1C]/50 bg-[#FF9F1C]/15 px-3 py-1.5 min-h-[38px] text-xs font-medium text-[#B4430C] dark:text-[#FF9F1C] hover:bg-[#FF9F1C]/25 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Reset to 0 (Real Progress)</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 KPI Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4">
              <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">Completed Lessons &amp; Labs</p>
              <p className="text-2xl font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums mt-1">
                {progress.completedModules.length}
              </p>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] mt-1">
                {progress.streakDays}d {t.streakLabel}
              </p>
            </div>

            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4">
              <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t.primaryDomainLabel}</p>
              <p className="text-2xl font-mono font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] tabular-nums mt-1">
                {physicsCompletedCount} / {PHYSICS_MODULES.length} Labs
              </p>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] mt-1 tabular-nums">
                {progress.labReadingsCount} practical readings logged
              </p>
            </div>

            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4">
              <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">Projectile Mission</p>
              <p className="text-2xl font-mono font-semibold text-[#B4430C] dark:text-[#FF9F1C] tabular-nums mt-1 flex items-center gap-1.5">
                <Target className="w-5 h-5" aria-hidden="true" />
                <span>{progress.projectileHits ?? 0} Hits</span>
              </p>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] mt-1 tabular-nums">
                {progress.projectileAttempts ?? 0} launches saved on device
              </p>
            </div>

            <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4">
              <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">Offline Packs Cached</p>
              <p className="text-2xl font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                {offlineMetas.length} / {RESOURCE_PACKS.length + 1}
              </p>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] mt-1">
                {offlineMetas.length > 0 ? t.statusAvailableOffline : t.statusNotDownloaded}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Personalized Recommendations (6 cols) */}
            <div className="lg:col-span-6 a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-[#5B21B6] dark:text-[#C4B5FD]">{t.recommendedNext}</p>
                  <Sparkles className="w-4 h-4 text-[#5B21B6] dark:text-[#C4B5FD]" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mt-1.5">
                  {recommendedNext.title}
                </h3>
                <p className="text-xs text-[#22163F] dark:text-[#E4DDFA] mt-1">
                  {recommendedNext.domain} · {recommendedNext.reason}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenPhysicsModule(recommendedNext.topicId)}
                className="mt-4 self-start rounded-lg bg-[#6D28D9] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white hover:bg-[#5B21B6] cursor-pointer"
              >
                {recommendedNext.actionLabel}
              </button>
            </div>

            {/* Daily Challenge (6 cols) */}
            <div className="lg:col-span-6 a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5">
              <div className="flex items-center justify-between gap-2 mb-3">
                <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-[#B4430C] dark:text-[#FF9F1C]" aria-hidden="true" />
                  <span>{t.dailyChallenge}</span>
                </h3>
                {progress.dailyChallengeDone && (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Completed</span>
                )}
              </div>
              <p className="text-xs text-[#22163F] dark:text-[#E4DDFA] mb-3">{dailyQ.question[language]}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {dailyQ.options.map((opt, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setChallengeChoice(idx)}
                    className={`rounded-lg border px-3 py-2.5 min-h-[44px] text-xs text-left cursor-pointer ${
                      challengeSubmitted && idx === dailyQ.correctIndex
                        ? 'border-emerald-500 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : challengeChoice === idx
                        ? 'border-[#6D28D9] bg-[#6D28D9]/15 text-[#2E1A6E] dark:text-[#C4B5FD]'
                        : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#22163F] dark:text-[#E4DDFA]'
                    }`}
                  >
                    {opt[language]}
                  </button>
                ))}
              </div>
              {challengeSubmitted ? (
                <p className="text-xs text-[#22163F] dark:text-[#E4DDFA] mt-3">
                  {dailyQ.explanation[language]}
                </p>
              ) : (
                <button
                  type="button"
                  disabled={challengeChoice === null}
                  onClick={() => {
                    setChallengeSubmitted(true);
                    if (challengeChoice === dailyQ.correctIndex) {
                      onClaimDailyChallenge();
                    }
                  }}
                  className="mt-3 rounded-lg bg-[#6D28D9] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white hover:bg-[#5B21B6] disabled:opacity-50 cursor-pointer"
                >
                  {t.submitQuizLabel}
                </button>
              )}
            </div>
          </div>

          {/* Achievements Row */}
          <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5">
            <h3 className="text-base font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-[#B4430C] dark:text-[#FF9F1C]" aria-hidden="true" />
              <span>{t.achievements}</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`rounded-xl border p-3 ${
                    ach.unlocked
                      ? 'border-emerald-500/40 bg-emerald-500/10'
                      : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">{ach.title}</p>
                    {ach.unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </div>
                  <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] mt-1">{ach.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        </>
      )}

      {/* REAL OFFLINE LESSON PACKS & STUDY SHEETS */}
      <div
        id="resources-section"
        className={`${resourcesOnly ? '' : 'pt-4 border-t border-[#E7DDFB] dark:border-[#3B2C78]'} space-y-4`}
      >
        <div>
          <h3 id="resources-heading" className="text-lg font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
            {t.navResources} — IndexedDB &amp; Cache Storage
          </h3>
          <p className="text-xs text-[#22163F] dark:text-[#C9BFEA] mt-0.5">
            Download lesson bundles directly to browser storage (IndexedDB + Cache API). Zero-byte fake states are never shown.
          </p>
        </div>

        {packError && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
            {packError}
          </div>
        )}

        {/* Featured Projectile Interactive Lesson Pack Card */}
        <div className="rounded-xl border border-[#6D28D9]/35 bg-[#6D28D9]/8 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-[#5B21B6] dark:text-[#C4B5FD]">
              Primary Physics Pack · Interactive Mission + Simulator + Quiz + Notes
            </p>
            <p className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mt-0.5">
              Projectile Motion Interactive Lesson Pack
            </p>
            <p className="text-xs text-[#22163F] dark:text-[#E4DDFA] mt-1">
              {projectilePackMeta
                ? `${t.statusAvailableOffline} (${formatBytes(projectilePackMeta.coreSizeBytes + projectilePackMeta.mediaSizeBytes)}${projectilePackMeta.includesMedia ? ' + diagram' : ''})`
                : `${t.statusNotDownloaded} · Core bundle ~18 KB`}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenProjectileDownload}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#6D28D9] px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white hover:bg-[#5B21B6] shrink-0 cursor-pointer"
          >
            <HardDriveDownload className="w-4 h-4" aria-hidden="true" />
            <span>{projectilePackMeta ? 'Manage Projectile Pack' : t.actionDownloadLesson}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {RESOURCE_PACKS.map((pack) => {
            const meta = offlineMetaById.get(pack.id);
            const transientStatus = packStatusMap[pack.id];
            const isDownloading = transientStatus === 'downloading';
            const isSaved = Boolean(meta);

            return (
              <div
                key={pack.id}
                className="a11y-surface rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-xs font-medium text-[#5B21B6] dark:text-[#C4B5FD]">
                    {pack.domain} · {meta ? formatBytes(meta.coreSizeBytes) : `~${pack.sizeKb} KB`} · {pack.format}
                  </p>
                  <p className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mt-0.5">
                    {pack.title[language]}
                  </p>
                  <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] mt-0.5">
                    {isDownloading
                      ? t.statusDownloading
                      : isSaved
                      ? t.statusAvailableOffline
                      : t.statusNotDownloaded}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={isDownloading}
                    onClick={() => void handleToggleRealOfflinePack(pack.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 min-h-[40px] text-xs font-medium cursor-pointer disabled:opacity-60 ${
                      isSaved
                        ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#F5F0FF] hover:bg-[#FFF3E6] dark:hover:bg-[#2A1D5C]'
                    }`}
                  >
                    {isDownloading ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : isSaved ? (
                      <Trash2 className="w-3.5 h-3.5" />
                    ) : (
                      <HardDriveDownload className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isDownloading
                        ? t.statusDownloading
                        : isSaved
                        ? `${t.statusAvailableOffline} (Remove)`
                        : t.saveOffline}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDownloadPackSheet(pack.id, pack.content)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#6D28D9] px-3 py-2 min-h-[40px] text-xs font-medium text-white hover:bg-[#5B21B6] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{t.downloadSheet}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {offlineMetas.some((m) => m.curriculum) && (
          <div className="pt-4 border-t border-[#E7DDFB] dark:border-[#3B2C78] space-y-3">
            <h4 className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF]">
              {t.chaptersExperimentsTitle} — {t.savedOffline}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {offlineMetas
                .filter((m) => Boolean(m.curriculum))
                .map((meta) => {
                  const curr = meta.curriculum!;
                  return (
                    <div
                      key={meta.id}
                      className="a11y-surface rounded-xl border border-emerald-500/35 bg-emerald-500/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300 tabular-nums">
                          {t.classLabel} {curr.classLevel} · {curr.board.toUpperCase()}
                          {curr.stateName ? ` (${curr.stateName})` : ''} · {curr.session} ·{' '}
                          {curr.language.toUpperCase()} · {formatBytes(meta.coreSizeBytes)}
                        </p>
                        <p className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mt-0.5">
                          {meta.title}
                        </p>
                        <p className="text-[11px] text-[#22163F] dark:text-[#C9BFEA] mt-0.5">
                          {t.statusAvailableOffline}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          void (async () => {
                            await removeOfflinePack(meta.id);
                            onOfflinePacksChanged();
                          })();
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-white dark:bg-[#2A1D5C] px-3 py-2 min-h-[40px] text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:border-rose-500 hover:text-rose-600 shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t.removeOfflineBtn}</span>
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

