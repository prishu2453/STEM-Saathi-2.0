import React, { useState } from 'react';
import { CheckCircle2, HardDriveDownload, Trash2, WifiOff } from 'lucide-react';
import { formatBytes, removeOfflinePack } from '../lib/offlineStore';
import type { Language, OfflinePackMeta } from '../types/stem';

const L = {
  title: { en: 'Saved lessons — work without internet', hi: 'सहेजे गए पाठ — बिना इंटरनेट चलते हैं', kn: 'ಉಳಿಸಿದ ಪಾಠಗಳು — ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆ ಕೆಲಸ ಮಾಡುತ್ತವೆ' },
  empty: { en: 'Nothing saved yet. Open a chapter and press “Save chapter offline”.', hi: 'अभी कुछ सहेजा नहीं गया। कोई अध्याय खोलें और “अध्याय ऑफ़लाइन सहेजें” दबाएँ।', kn: 'ಇನ್ನೂ ಏನೂ ಉಳಿಸಿಲ್ಲ. ಅಧ್ಯಾಯ ತೆರೆದು “ಅಧ್ಯಾಯ ಆಫ್‌ಲೈನ್ ಉಳಿಸಿ” ಒತ್ತಿ.' },
  total: { en: 'Total used', hi: 'कुल उपयोग', kn: 'ಒಟ್ಟು ಬಳಕೆ' },
  open: { en: 'Open lesson', hi: 'पाठ खोलें', kn: 'ಪಾಠ ತೆರೆಯಿರಿ' },
  remove: { en: 'Remove', hi: 'हटाएँ', kn: 'ತೆಗೆಯಿರಿ' },
  saved: { en: 'Saved', hi: 'सहेजा', kn: 'ಉಳಿಸಿದ್ದು' },
  includes: { en: 'Included offline', hi: 'ऑफ़लाइन में शामिल', kn: 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಸೇರಿದೆ' },
  includesText: { en: 'chapter summary, experiment steps, safety notes, observation tables, prediction questions', hi: 'अध्याय सारांश, प्रयोग के चरण, सावधानियाँ, प्रेक्षण सारणी, पूर्वानुमान प्रश्न', kn: 'ಅಧ್ಯಾಯ ಸಾರಾಂಶ, ಪ್ರಯೋಗ ಹಂತ, ಸುರಕ್ಷತೆ, ವೀಕ್ಷಣೆ ಕೋಷ್ಟಕ, ಊಹೆ ಪ್ರಶ್ನೆ' },
  notIncluded: { en: 'Not saved', hi: 'सहेजा नहीं जाता', kn: 'ಉಳಿಸುವುದಿಲ್ಲ' },
  notIncludedText: { en: 'videos (they always need internet) and the AI Teacher. Simulations and flashcards run offline once the app has loaded on this phone.', hi: 'वीडियो (इन्हें हमेशा इंटरनेट चाहिए) और AI शिक्षक। ऐप इस फ़ोन पर एक बार खुलने के बाद सिमुलेशन और फ्लैशकार्ड ऑफ़लाइन चलते हैं।', kn: 'ವೀಡಿಯೊ (ಯಾವಾಗಲೂ ಇಂಟರ್ನೆಟ್ ಬೇಕು) ಮತ್ತು AI ಶಿಕ್ಷಕ. ಈ ಫೋನ್‌ನಲ್ಲಿ ಆ್ಯಪ್ ಒಮ್ಮೆ ಲೋಡ್ ಆದ ನಂತರ ಸಿಮ್ಯುಲೇಶನ್ ಮತ್ತು ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್ ಆಫ್‌ಲೈನ್ ಕೆಲಸ ಮಾಡುತ್ತವೆ.' },
};

interface Props {
  metas: OfflinePackMeta[];
  language: Language;
  onChanged: () => void;
  onOpenChapter: (meta: OfflinePackMeta) => void;
}

export const SavedLessons: React.FC<Props> = ({ metas, language, onChanged, onOpenChapter }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const lessons = metas.filter((m) => m.curriculum);
  const total = lessons.reduce((n, m) => n + m.coreSizeBytes + m.mediaSizeBytes, 0);
  return (
    <section aria-label={L.title[language]} className="mx-auto max-w-6xl px-4 sm:px-6 pt-5">
      <div className="a11y-surface rounded-2xl border border-[#6D28D9]/50 bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <HardDriveDownload className="w-5 h-5 text-[#6D28D9]" aria-hidden="true" />
          <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">{L.title[language]}</h2>
          {lessons.length > 0 && (
            <span className="ml-auto rounded-full bg-[#EFE7FF] dark:bg-[#6D28D9]/25 px-3 py-1 text-xs font-bold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">
              {lessons.length} · {L.total[language]} {formatBytes(total)}
            </span>
          )}
        </div>
        {lessons.length === 0 ? (
          <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">{L.empty[language]}</p>
        ) : (
          <ul className="space-y-2">
            {lessons.map((m) => (
              <li key={m.id} className="rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-[200px] space-y-0.5">
                  <p className="text-sm font-semibold text-[#2E1A6E] dark:text-white">{m.title}</p>
                  <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA] flex flex-wrap items-center gap-x-3 tabular-nums">
                    <span className="inline-flex items-center gap-1 text-[#5B21B6] dark:text-[#C4B5FD] font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                      {L.saved[language]} · {formatBytes(m.coreSizeBytes + m.mediaSizeBytes)}
                    </span>
                    <span>{new Date(m.downloadedAt).toLocaleDateString()}</span>
                    {m.curriculum && <span>{m.curriculum.session}</span>}
                  </p>
                </div>
                <button type="button" onClick={() => onOpenChapter(m)} className="min-h-[44px] rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 text-sm font-semibold text-white cursor-pointer">
                  {L.open[language]}
                </button>
                <button
                  type="button"
                  disabled={busy === m.id}
                  onClick={async () => {
                    setBusy(m.id);
                    await removeOfflinePack(m.id);
                    setBusy(null);
                    onChanged();
                  }}
                  aria-label={`${L.remove[language]}: ${m.title}`}
                  className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-3 text-sm font-semibold text-[#B91C1C] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                  {L.remove[language]}
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-2 sm:grid-cols-2 text-xs text-[#22163F] dark:text-[#E4DDFA]">
          <p className="flex gap-2"><WifiOff className="w-4 h-4 shrink-0 text-[#6D28D9]" aria-hidden="true" /><span><strong>{L.includes[language]}:</strong> {L.includesText[language]}.</span></p>
          <p className="flex gap-2"><WifiOff className="w-4 h-4 shrink-0 text-[#B91C1C]" aria-hidden="true" /><span><strong>{L.notIncluded[language]}:</strong> {L.notIncludedText[language]}</span></p>
        </div>
      </div>
    </section>
  );
};
