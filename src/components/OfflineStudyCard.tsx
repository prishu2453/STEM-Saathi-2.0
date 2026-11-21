import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Download, Loader2, WifiOff } from 'lucide-react';
import type { RichChapterData } from '../../shared/syllabus/types';
import { buildStudyPackHtml, downloadTextFile, getOfflineStatus, warmSimulationChunks, type OfflineStatus } from '../lib/studyPack';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import type { Language } from '../types/stem';

type L3 = Record<Language, string>;
const T: Record<string, L3> = {
  title: { en: 'Offline learning', hi: 'ऑफ़लाइन पढ़ाई', kn: 'ಆಫ್‌ಲೈನ್ ಕಲಿಕೆ' },
  intro: {
    en: 'Notes, formulas, quizzes and flashcards are built into the app and work without internet once the app has loaded here.',
    hi: 'नोट्स, सूत्र, क्विज़ और फ्लैशकार्ड ऐप में ही हैं और एक बार यहाँ खुलने के बाद बिना इंटरनेट चलते हैं।',
    kn: 'ನೋಟ್ಸ್, ಸೂತ್ರ, ಕ್ವಿಜ್ ಮತ್ತು ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಆ್ಯಪ್‌ನಲ್ಲೇ ಇವೆ; ಇಲ್ಲಿ ಒಮ್ಮೆ ತೆರೆದ ನಂತರ ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ ಕೆಲಸ ಮಾಡುತ್ತವೆ.',
  },
  prepare: { en: 'Prepare this phone for offline use', hi: 'इस फ़ोन को ऑफ़लाइन के लिए तैयार करें', kn: 'ಈ ಫೋನ್ ಆಫ್‌ಲೈನ್‌ಗೆ ಸಿದ್ಧಪಡಿಸಿ' },
  preparing: { en: 'Preparing…', hi: 'तैयार हो रहा है…', kn: 'ಸಿದ್ಧವಾಗುತ್ತಿದೆ…' },
  prepared: { en: 'Simulations and flashcards saved for offline use.', hi: 'सिमुलेशन और फ्लैशकार्ड ऑफ़लाइन के लिए सहेज लिए गए।', kn: 'ಸಿಮ್ಯುಲೇಶನ್ ಮತ್ತು ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಆಫ್‌ಲೈನ್‌ಗಾಗಿ ಉಳಿಸಲಾಗಿದೆ.' },
  download: { en: 'Download study pack (one file)', hi: 'अध्ययन पैक डाउनलोड करें (एक फ़ाइल)', kn: 'ಅಧ್ಯಯನ ಪ್ಯಾಕ್ ಡೌನ್‌ಲೋಡ್ (ಒಂದು ಫೈಲ್)' },
  dlHint: {
    en: 'A single file with notes, formulas, solved problems, questions, quiz answers and experiments. Open it on any phone, print it, or share it by chat.',
    hi: 'एक ही फ़ाइल में नोट्स, सूत्र, हल प्रश्न, प्रश्न-उत्तर, क्विज़ और प्रयोग। किसी भी फ़ोन पर खोलें, प्रिंट करें या चैट से भेजें।',
    kn: 'ಒಂದೇ ಫೈಲ್‌ನಲ್ಲಿ ನೋಟ್ಸ್, ಸೂತ್ರ, ಬಿಡಿಸಿದ ಲೆಕ್ಕ, ಪ್ರಶ್ನೋತ್ತರ, ಕ್ವಿಜ್ ಮತ್ತು ಪ್ರಯೋಗ. ಯಾವುದೇ ಫೋನ್‌ನಲ್ಲಿ ತೆರೆಯಿರಿ, ಪ್ರಿಂಟ್ ಮಾಡಿ ಅಥವಾ ಚಾಟ್‌ನಲ್ಲಿ ಕಳುಹಿಸಿ.',
  },
  needsNet: { en: 'AI Teacher needs internet. Spoken captions and flashcards do not.', hi: 'AI शिक्षक को इंटरनेट चाहिए। फ्लैशकार्ड को नहीं।', kn: 'AI ಶಿಕ್ಷಕರಿಗೆ ಇಂಟರ್ನೆಟ್ ಬೇಕು. ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್‌ಗೆ ಬೇಡ.' },
  offlineNow: { en: 'You are offline right now.', hi: 'अभी आप ऑफ़लाइन हैं।', kn: 'ನೀವು ಈಗ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ.' },
  appSaved: { en: 'App saved on this device', hi: 'ऐप इस फ़ोन में सहेजा गया', kn: 'ಆ್ಯಪ್ ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿದಿದೆ' },
  appNotYet: {
    en: 'App is not saved yet — keep this page open while connected for a minute.',
    hi: 'ऐप अभी सहेजा नहीं गया — इंटरनेट के साथ यह पेज एक मिनट खुला रखें।',
    kn: 'ಆ್ಯಪ್ ಇನ್ನೂ ಉಳಿದಿಲ್ಲ — ಇಂಟರ್ನೆಟ್ ಇರುವಾಗ ಈ ಪುಟವನ್ನು ಒಂದು ನಿಮಿಷ ತೆರೆದಿಡಿ.',
  },
  files: { en: 'files saved', hi: 'फ़ाइलें सहेजी गईं', kn: 'ಫೈಲ್‌ಗಳು ಉಳಿದಿವೆ' },
};

interface Props {
  chapters: RichChapterData[];
  language: Language;
  syllabusLabel: string;
}

export const OfflineStudyCard: React.FC<Props> = ({ chapters, language, syllabusLabel }) => {
  const online = useOnlineStatus();
  const [status, setStatus] = useState<OfflineStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const t = (k: string) => T[k][language];

  const refresh = useCallback(() => void getOfflineStatus().then(setStatus), []);
  useEffect(refresh, [refresh]);

  const prepare = async () => {
    setBusy(true);
    try {
      await warmSimulationChunks();
      if ('serviceWorker' in navigator) await navigator.serviceWorker.ready;
      setPrepared(true);
    } finally {
      setBusy(false);
      refresh();
    }
  };

  const download = () => {
    const html = buildStudyPackHtml(chapters, language, syllabusLabel);
    const safe = syllabusLabel.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 60) || 'study-pack';
    downloadTextFile(`Gyaan-Graph-${safe}-${language}.html`, html);
  };

  const saved = status?.serviceWorker === 'active';

  return (
    <div className="a11y-surface rounded-2xl border border-[#6D28D9]/50 bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <WifiOff className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" />
        <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">{t('title')}</h2>
        {!online && <span className="ml-auto rounded-full bg-[#FF9F1C] px-3 py-1 text-xs font-bold text-[#2E1A6E]">{t('offlineNow')}</span>}
      </div>
      <p className="text-sm text-[#22163F] dark:text-[#E4DDFA]">{t('intro')}</p>

      <p className="flex items-start gap-2 text-sm" role="status">
        <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${saved ? 'text-[#6D28D9]' : 'text-[#B4430C]'}`} aria-hidden="true" />
        <span>
          {saved ? t('appSaved') : t('appNotYet')}
          {saved && status ? ` · ${status.cachedFiles} ${t('files')}${status.storageMb != null ? ` · ${status.storageMb} MB` : ''}` : ''}
        </span>
      </p>

      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy || !online} onClick={() => void prepare()} className="min-h-[48px] inline-flex items-center gap-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
          {busy ? t('preparing') : t('prepare')}
        </button>
        <button type="button" onClick={download} className="min-h-[48px] inline-flex items-center gap-2 rounded-xl border border-[#6D28D9] px-5 text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD] cursor-pointer">
          <Download className="w-4 h-4" aria-hidden="true" />
          {t('download')}
        </button>
      </div>
      {prepared && <p className="text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD]" role="status">{t('prepared')}</p>}
      <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('dlHint')}</p>
      <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('needsNet')}</p>
    </div>
  );
};
