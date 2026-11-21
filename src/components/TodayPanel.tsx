import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Flame, Home, Lightbulb, Share2, ShieldAlert } from 'lucide-react';
import type { StructuredExperiment } from '../../shared/syllabus/types';
import { fetchExperiments } from '../lib/syllabusApi';
import { resolveLocalizedList, resolveLocalizedText } from '../data/learningPathCore';
import { loadFlashProgress } from '../lib/flashcards';
import {
  ACTIVITY_EVENT,
  computeBadges,
  computeStreak,
  loadActivityDays,
  markActiveToday,
  pickForToday,
  shareText,
} from '../lib/engagement';
import type { Language, LearningPathPreference, StudentProgress } from '../types/stem';

interface TodayPanelProps {
  language: Language;
  learningPath: LearningPathPreference;
  progress: StudentProgress;
  offlinePackCount: number;
  onOpenChapter: (chapterId: string) => void;
  onToggleExperimentComplete: (expId: string) => void;
}

const L = (language: Language, en: string, hi: string, kn: string) =>
  language === 'hi' ? hi : language === 'kn' ? kn : en;

export const TodayPanel: React.FC<TodayPanelProps> = ({
  language,
  learningPath,
  progress,
  offlinePackCount,
  onOpenChapter,
  onToggleExperimentComplete,
}) => {
  const [pool, setPool] = useState<StructuredExperiment[]>([]);
  const [fromOtherClass, setFromOtherClass] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const [tick, setTick] = useState(0);
  const [prediction, setPrediction] = useState<number | null>(null);

  // Home-safe activities for the student's own class and board; other classes only if none exist.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const own = await fetchExperiments({
        classLevel: learningPath.classLevel,
        board: learningPath.board,
        stateName: learningPath.board === 'state' ? learningPath.stateName : undefined,
        activityMode: 'home-safe',
      });
      if (!alive) return;
      if (own.length > 0) {
        setPool(own);
        setFromOtherClass(false);
        return;
      }
      const any = await fetchExperiments({ activityMode: 'home-safe' });
      if (!alive) return;
      setPool(any);
      setFromOtherClass(any.length > 0);
    })();
    return () => {
      alive = false;
    };
  }, [learningPath.classLevel, learningPath.board, learningPath.stateName]);

  // Re-read streak / flashcard XP when the student does something anywhere in the app.
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(ACTIVITY_EVENT, bump);
    window.addEventListener('focus', bump);
    document.addEventListener('visibilitychange', bump);
    return () => {
      window.removeEventListener(ACTIVITY_EVENT, bump);
      window.removeEventListener('focus', bump);
      document.removeEventListener('visibilitychange', bump);
    };
  }, []);

  const task = useMemo(() => pickForToday(pool), [pool]);
  useEffect(() => {
    setPrediction(null);
    setShowSteps(false);
  }, [task?.id]);

  const streak = useMemo(() => computeStreak(loadActivityDays()), [tick, progress]); // eslint-disable-line react-hooks/exhaustive-deps
  const flash = useMemo(() => loadFlashProgress(), [tick, progress]); // eslint-disable-line react-hooks/exhaustive-deps
  const badges = useMemo(
    () => computeBadges(progress, flash, streak, offlinePackCount),
    [progress, flash, streak, offlinePackCount]
  );
  const earned = badges.filter((b) => b.current >= b.target).length;

  const done = task ? (progress.completedExperimentIds ?? []).includes(task.id) : false;

  const tx = (v: Parameters<typeof resolveLocalizedText>[0]) => resolveLocalizedText(v, language).text;
  const tl = (v: Parameters<typeof resolveLocalizedList>[0]) => resolveLocalizedList(v, language).items;

  const handleDone = () => {
    if (!task) return;
    if (!done) onToggleExperimentComplete(task.id);
    markActiveToday();
    setTick((t) => t + 1);
  };

  const handleShare = async () => {
    if (!task) return;
    const lines = [
      `🔬 ${L(language, "Today's science activity", 'आज की विज्ञान गतिविधि', 'ಇಂದಿನ ವಿಜ್ಞಾನ ಚಟುವಟಿಕೆ')}: ${tx(task.title)}`,
      `${L(language, 'Need', 'सामान', 'ಸಾಮಗ್ರಿ')}: ${tl(task.materials).join(', ')}`,
      ...tl(task.steps).map((s, i) => `${i + 1}. ${s}`),
      `⚠️ ${tx(task.safetyNote)}`,
      `❓ ${tx(task.predictionQuestion)}`,
      `— Gyaan Graph ${window.location.origin}`,
    ];
    await shareText(lines.join('\n'));
  };

  const card =
    'a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5';

  return (
    <div className="grid gap-4 lg:grid-cols-12" aria-label={L(language, 'Today', 'आज', 'ಇಂದು')}>
      {/* Today's home-safe science task */}
      <section className={`${card} lg:col-span-7 space-y-3`} aria-labelledby="today-task-title">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD] flex items-center gap-1.5">
            <Home className="w-4 h-4" aria-hidden="true" />
            {L(language, "Today's science task — try it at home", 'आज का विज्ञान काम — घर पर करें', 'ಇಂದಿನ ವಿಜ್ಞಾನ ಕಾರ್ಯ — ಮನೆಯಲ್ಲೇ ಮಾಡಿ')}
          </p>
          {task && (
            <span className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums">
              {L(language, 'Class', 'कक्षा', 'ತರಗತಿ')} {task.classLevel} · {L(language, 'Ch.', 'अध्याय', 'ಅಧ್ಯಾಯ')} {task.chapterNumber}
            </span>
          )}
        </div>

        {!task ? (
          <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]" role="status">
            {L(language, 'Loading today’s activity…', 'आज की गतिविधि लोड हो रही है…', 'ಇಂದಿನ ಚಟುವಟಿಕೆ ಲೋಡ್ ಆಗುತ್ತಿದೆ…')}
          </p>
        ) : (
          <>
            <h2 id="today-task-title" className="text-lg font-bold text-[#2E1A6E] dark:text-white leading-snug">
              {tx(task.title)}
            </h2>
            {fromOtherClass && (
              <p className="text-[11px] text-[#7A4A00] dark:text-[#FF9F1C]">
                {L(
                  language,
                  'No home activity is listed for your class yet, so this one is from another class.',
                  'आपकी कक्षा के लिए अभी घर की गतिविधि नहीं है, इसलिए यह दूसरी कक्षा से है।',
                  'ನಿಮ್ಮ ತರಗತಿಗೆ ಇನ್ನೂ ಮನೆ ಚಟುವಟಿಕೆ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಇದು ಬೇರೆ ತರಗತಿಯದು.'
                )}
              </p>
            )}
            <p className="text-sm text-[#22163F] dark:text-[#E4DDFA]">
              <span className="font-semibold">{L(language, 'You need: ', 'चाहिए: ', 'ಬೇಕಾದದ್ದು: ')}</span>
              {tl(task.materials).join(', ')}
            </p>

            {/* Predict first — curiosity before the answer */}
            {tl(task.predictionOptions).length > 0 && (
              <div className="rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 space-y-2">
                <p className="text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] flex gap-1.5">
                  <Lightbulb className="w-4 h-4 shrink-0 mt-0.5 text-[#B7791F]" aria-hidden="true" />
                  {L(language, 'Guess first: ', 'पहले अनुमान लगाएँ: ', 'ಮೊದಲು ಊಹಿಸಿ: ')}
                  {tx(task.predictionQuestion)}
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {tl(task.predictionOptions).map((opt, i) => {
                    const chosen = prediction === i;
                    const right = i === task.predictionCorrectIndex;
                    const style =
                      prediction === null
                        ? 'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] hover:border-[#6D28D9]'
                        : right
                          ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#2D1B5A]'
                          : chosen
                            ? 'border-[#B45309] bg-[#FDF0E1] dark:bg-[#3A2A14]'
                            : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] opacity-70';
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={prediction !== null}
                        onClick={() => setPrediction(i)}
                        className={`min-h-[44px] rounded-xl border px-3 py-2 text-left text-sm text-[#2E1A6E] dark:text-[#F5F0FF] ${style} cursor-pointer disabled:cursor-default`}
                      >
                        {opt}
                        {prediction !== null && right && ' ✓'}
                      </button>
                    );
                  })}
                </div>
                {prediction !== null && (
                  <p className="text-sm text-[#22163F] dark:text-[#E4DDFA]" role="status">
                    {prediction === task.predictionCorrectIndex
                      ? L(language, 'Great guess! Now do it and check. ', 'बढ़िया अनुमान! अब करके देखें। ', 'ಒಳ್ಳೆಯ ಊಹೆ! ಈಗ ಮಾಡಿ ನೋಡಿ. ')
                      : L(language, 'Good try — do it and see what really happens. ', 'अच्छी कोशिश — करके देखें असल में क्या होता है। ', 'ಒಳ್ಳೆಯ ಪ್ರಯತ್ನ — ಮಾಡಿ ನಿಜವಾಗಿ ಏನಾಗುತ್ತದೆ ನೋಡಿ. ')}
                    {tx(task.whyItHappens)}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowSteps((v) => !v)}
              aria-expanded={showSteps}
              className="text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD] underline min-h-[44px]"
            >
              {showSteps
                ? L(language, 'Hide steps', 'चरण छिपाएँ', 'ಹಂತಗಳನ್ನು ಮರೆಮಾಡಿ')
                : L(language, 'Show steps', 'चरण दिखाएँ', 'ಹಂತಗಳನ್ನು ತೋರಿಸಿ')}
            </button>
            {showSteps && (
              <ol className="list-decimal pl-5 space-y-1 text-sm text-[#22163F] dark:text-[#E4DDFA]">
                {tl(task.steps).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            )}

            <p className="text-xs text-[#7A2E0E] dark:text-[#F5B38A] flex gap-1.5">
              <ShieldAlert className="w-4 h-4 shrink-0" aria-hidden="true" />
              {tx(task.safetyNote)}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleDone}
                aria-pressed={done}
                className={`inline-flex items-center gap-1.5 min-h-[44px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                  done ? 'bg-[#EFE7FF] text-[#5B21B6] border border-[#6D28D9]' : 'bg-[#6D28D9] hover:bg-[#5B21B6] text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                {done ? L(language, 'Done today!', 'आज पूरा!', 'ಇಂದು ಮುಗಿದಿದೆ!') : L(language, 'I did it', 'मैंने कर लिया', 'ನಾನು ಮಾಡಿದೆ')}
              </button>
              <button
                type="button"
                onClick={() => onOpenChapter(task.chapterId)}
                className="min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-4 py-2 text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]"
              >
                {L(language, 'Open the chapter', 'अध्याय खोलें', 'ಅಧ್ಯಾಯ ತೆರೆಯಿರಿ')}
              </button>
              <button
                type="button"
                onClick={() => void handleShare()}
                className="inline-flex items-center gap-1.5 min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-4 py-2 text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9]"
              >
                <Share2 className="w-4 h-4" aria-hidden="true" />
                {L(language, 'Share on WhatsApp', 'WhatsApp पर भेजें', 'WhatsApp ನಲ್ಲಿ ಹಂಚಿ')}
              </button>
            </div>
          </>
        )}
      </section>

      {/* Streak + badges, all from real activity on this device */}
      <section className={`${card} lg:col-span-5 space-y-3`} aria-labelledby="badges-title">
        <div className="flex items-center justify-between gap-2">
          <h2 id="badges-title" className="text-sm font-bold text-[#2E1A6E] dark:text-white">
            {L(language, 'My badges', 'मेरे बैज', 'ನನ್ನ ಬ್ಯಾಡ್ಜ್‌ಗಳು')}{' '}
            <span className="tabular-nums font-semibold text-[#4A3F66] dark:text-[#C9BFEA]">
              {earned}/{badges.length}
            </span>
          </h2>
          <p className="inline-flex items-center gap-1 rounded-lg bg-[#FDF0E1] dark:bg-[#3A2A14] px-2.5 py-1 text-sm font-bold text-[#7A4A00] dark:text-[#FF9F1C] tabular-nums">
            <Flame className="w-4 h-4" aria-hidden="true" />
            {streak} {L(language, streak === 1 ? 'day' : 'days', 'दिन', 'ದಿನ')}
          </p>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-2">
          {badges.map((b) => {
            const got = b.current >= b.target;
            const title = L(language, b.title.en, b.title.hi, b.title.kn);
            const how = L(language, b.how.en, b.how.hi, b.how.kn);
            return (
              <li
                key={b.id}
                className={`rounded-xl border p-2 text-center ${
                  got
                    ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#2D1B5A]'
                    : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C]'
                }`}
                aria-label={`${title}: ${got ? L(language, 'earned', 'मिल गया', 'ಗಳಿಸಲಾಗಿದೆ') : how}`}
              >
                <span className={`block text-2xl ${got ? '' : 'grayscale opacity-50'}`} aria-hidden="true">
                  {b.icon}
                </span>
                <span className="block text-[11px] font-semibold leading-tight text-[#2E1A6E] dark:text-[#F5F0FF]">{title}</span>
                <span className="block text-[10px] leading-tight text-[#4A3F66] dark:text-[#C9BFEA] tabular-nums mt-0.5">
                  {got ? '✓' : `${Math.min(b.current, b.target)}/${b.target}`}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">
          {L(
            language,
            'Saved only on this phone. A study day counts when you finish an experiment, quiz, chapter or flashcard review.',
            'केवल इस फ़ोन में सेव। प्रयोग, क्विज़, अध्याय या फ्लैशकार्ड पूरा करने पर दिन गिना जाता है।',
            'ಈ ಫೋನ್‌ನಲ್ಲಿ ಮಾತ್ರ ಉಳಿಸಲಾಗಿದೆ. ಪ್ರಯೋಗ, ರಸಪ್ರಶ್ನೆ, ಅಧ್ಯಾಯ ಅಥವಾ ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಮುಗಿಸಿದಾಗ ದಿನ ಎಣಿಕೆಯಾಗುತ್ತದೆ.'
          )}
        </p>
      </section>
    </div>
  );
};

export default TodayPanel;
