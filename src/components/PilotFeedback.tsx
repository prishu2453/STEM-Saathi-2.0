import React, { useState } from 'react';
import { Download, Trash2 } from 'lucide-react';
import { downloadTextFile } from '../lib/studyPack';
import type { Language } from '../types/stem';

const KEY = 'stem-saathi-pilot-feedback-v1';
interface Entry {
  at: string;
  who: 'student' | 'teacher';
  classLevel: string;
  feature: string;
  clarity: number;
  helped: string;
  confusing: string;
}
const load = (): Entry[] => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Entry[];
  } catch {
    return [];
  }
};
const save = (e: Entry[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(e));
  } catch {
    // storage unavailable
  }
};

type L3 = Record<Language, string>;
const T: Record<string, L3> = {
  title: { en: 'Pilot feedback', hi: 'पायलट प्रतिक्रिया', kn: 'ಪೈಲಟ್ ಪ್ರತಿಕ್ರಿಯೆ' },
  note: { en: 'Stays on this device. No name or contact details are collected. Use Download to share it with the project team. Feedback shows opinions — it is not proof that students learned more.', hi: 'यह इसी फ़ोन में रहता है। नाम या संपर्क विवरण नहीं लिया जाता। परियोजना टीम से साझा करने के लिए डाउनलोड करें। प्रतिक्रिया राय दिखाती है — यह सीखने में सुधार का प्रमाण नहीं है।', kn: 'ಇದು ಈ ಫೋನ್‌ನಲ್ಲೇ ಇರುತ್ತದೆ. ಹೆಸರು ಅಥವಾ ಸಂಪರ್ಕ ವಿವರ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ. ಯೋಜನಾ ತಂಡಕ್ಕೆ ಕಳುಹಿಸಲು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ. ಪ್ರತಿಕ್ರಿಯೆ ಅಭಿಪ್ರಾಯ ತೋರಿಸುತ್ತದೆ — ಕಲಿಕೆ ಹೆಚ್ಚಿದೆ ಎಂಬುದಕ್ಕೆ ಪುರಾವೆಯಲ್ಲ.' },
  who: { en: 'I am a', hi: 'मैं हूँ', kn: 'ನಾನು' },
  student: { en: 'Student', hi: 'छात्र', kn: 'ವಿದ್ಯಾರ್ಥಿ' },
  teacher: { en: 'Teacher', hi: 'शिक्षक', kn: 'ಶಿಕ್ಷಕ' },
  cls: { en: 'Class (optional)', hi: 'कक्षा (वैकल्पिक)', kn: 'ತರಗತಿ (ಐಚ್ಛಿಕ)' },
  feature: { en: 'What did you use?', hi: 'आपने क्या उपयोग किया?', kn: 'ನೀವು ಏನು ಬಳಸಿದಿರಿ?' },
  clarity: { en: 'How clear was it? (1 = confusing, 5 = very clear)', hi: 'कितना स्पष्ट था? (1 = उलझा हुआ, 5 = बहुत स्पष्ट)', kn: 'ಎಷ್ಟು ಸ್ಪಷ್ಟವಾಗಿತ್ತು? (1 = ಗೊಂದಲ, 5 = ಬಹಳ ಸ್ಪಷ್ಟ)' },
  helped: { en: 'What helped you understand?', hi: 'समझने में क्या मददगार रहा?', kn: 'ಅರ್ಥಮಾಡಿಕೊಳ್ಳಲು ಏನು ಸಹಾಯ ಮಾಡಿತು?' },
  confusing: { en: 'What was confusing or wrong?', hi: 'क्या उलझाने वाला या गलत था?', kn: 'ಏನು ಗೊಂದಲ ಅಥವಾ ತಪ್ಪಾಗಿತ್ತು?' },
  send: { en: 'Save feedback', hi: 'प्रतिक्रिया सहेजें', kn: 'ಪ್ರತಿಕ್ರಿಯೆ ಉಳಿಸಿ' },
  saved: { en: 'Thank you — saved on this device.', hi: 'धन्यवाद — इस फ़ोन में सहेजा गया।', kn: 'ಧನ್ಯವಾದ — ಈ ಫೋನ್‌ನಲ್ಲಿ ಉಳಿದಿದೆ.' },
  count: { en: 'responses saved here', hi: 'प्रतिक्रियाएँ यहाँ सहेजी गईं', kn: 'ಪ್ರತಿಕ್ರಿಯೆಗಳು ಇಲ್ಲಿ ಉಳಿದಿವೆ' },
  csv: { en: 'Download (CSV)', hi: 'डाउनलोड (CSV)', kn: 'ಡೌನ್‌ಲೋಡ್ (CSV)' },
  clear: { en: 'Delete all', hi: 'सब हटाएँ', kn: 'ಎಲ್ಲಾ ಅಳಿಸಿ' },
};
const FEATURES = ['Chapter notes', 'Simulation', 'Experiment steps', 'Flashcards', 'Quiz question', 'AI Teacher', 'Offline saving', 'Other'];

export const PilotFeedback: React.FC<{ language: Language }> = ({ language }) => {
  const t = (k: string) => T[k][language];
  const [list, setList] = useState<Entry[]>(() => load());
  const [who, setWho] = useState<'student' | 'teacher'>('student');
  const [cls, setCls] = useState('');
  const [feature, setFeature] = useState(FEATURES[0]);
  const [clarity, setClarity] = useState(4);
  const [helped, setHelped] = useState('');
  const [confusing, setConfusing] = useState('');
  const [done, setDone] = useState(false);
  const field = 'mt-1 block w-full min-h-[44px] rounded-xl border border-[#B6A6E0] bg-white dark:bg-[#2A1D5C] px-3 py-2 text-sm';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = [...list, { at: new Date().toISOString(), who, classLevel: cls, feature, clarity, helped: helped.trim(), confusing: confusing.trim() }];
    setList(next);
    save(next);
    setHelped('');
    setConfusing('');
    setDone(true);
  };
  const csv = () => {
    const q = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const rows = [['time', 'role', 'class', 'feature', 'clarity_1_to_5', 'what_helped', 'what_was_confusing'], ...list.map((x) => [x.at, x.who, x.classLevel, x.feature, String(x.clarity), x.helped, x.confusing])];
    downloadTextFile('stem-saathi-pilot-feedback.csv', rows.map((r) => r.map(q).join(',')).join('\n'), 'text/csv');
  };

  return (
    <section aria-labelledby="fb-title" className="rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-4 sm:p-5 space-y-4">
      <h2 id="fb-title" className="text-lg font-bold text-[#2E1A6E] dark:text-white">{t('title')}</h2>
      <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">{t('note')}</p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">{t('who')}
          <select value={who} onChange={(e) => setWho(e.target.value as 'student' | 'teacher')} className={field}>
            <option value="student">{t('student')}</option>
            <option value="teacher">{t('teacher')}</option>
          </select>
        </label>
        <label className="text-sm font-semibold">{t('cls')}
          <input value={cls} onChange={(e) => setCls(e.target.value.slice(0, 20))} className={field} inputMode="numeric" />
        </label>
        <label className="text-sm font-semibold">{t('feature')}
          <select value={feature} onChange={(e) => setFeature(e.target.value)} className={field}>{FEATURES.map((f) => (<option key={f}>{f}</option>))}</select>
        </label>
        <label className="text-sm font-semibold">{t('clarity')}: {clarity}
          <input type="range" min={1} max={5} step={1} value={clarity} onChange={(e) => setClarity(Number(e.target.value))} className="mt-1 block w-full h-8 accent-[#6D28D9]" />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">{t('helped')}
          <textarea value={helped} onChange={(e) => setHelped(e.target.value.slice(0, 400))} rows={2} className={field} />
        </label>
        <label className="text-sm font-semibold sm:col-span-2">{t('confusing')}
          <textarea value={confusing} onChange={(e) => setConfusing(e.target.value.slice(0, 400))} rows={2} className={field} />
        </label>
        <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
          <button type="submit" className="min-h-[48px] rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-5 text-sm font-semibold text-white cursor-pointer">{t('send')}</button>
          {done && <span role="status" className="text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{t('saved')}</span>}
        </div>
      </form>
      <div className="flex flex-wrap items-center gap-3 border-t border-[#E7DDFB] dark:border-[#3B2C78] pt-3">
        <span className="text-sm tabular-nums">{list.length} {t('count')}</span>
        <button type="button" disabled={!list.length} onClick={csv} className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#6D28D9] px-4 text-sm font-semibold text-[#5B21B6] dark:text-[#C4B5FD] disabled:opacity-40 cursor-pointer"><Download className="w-4 h-4" aria-hidden="true" />{t('csv')}</button>
        <button type="button" disabled={!list.length} onClick={() => { setList([]); save([]); setDone(false); }} className="min-h-[44px] inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-4 text-sm font-semibold text-[#B91C1C] disabled:opacity-40 cursor-pointer"><Trash2 className="w-4 h-4" aria-hidden="true" />{t('clear')}</button>
      </div>
    </section>
  );
};
