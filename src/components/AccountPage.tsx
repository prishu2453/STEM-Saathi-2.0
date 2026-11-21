import React, { useEffect, useState } from 'react';
import { CheckCircle2, CloudOff, Eye, EyeOff, LogIn, LogOut, RefreshCw, UserPlus, UserRound } from 'lucide-react';
import {
  ACCOUNT_EVENT,
  changePassword,
  getCachedAccount,
  getSyncInfo,
  logIn,
  logOut,
  pushNow,
  refreshAccount,
  signUp,
  startAutoSync,
  updateProfile,
  type PublicAccount,
  type StudentProfile,
} from '../lib/account';
import { EDUCATION_BOARDS, SCHOOL_CLASSES, STATE_BOARD_STATES, resolveLocalizedText } from '../data/learningPathCore';
import type { EducationBoard, Language, LearningPathPreference, SchoolClass } from '../types/stem';

interface AccountPageProps {
  language: Language;
  learningPath: LearningPathPreference;
  onLearningPathChange: (next: LearningPathPreference) => void;
  onResetLocalProgress: () => void;
}

const L = (language: Language, en: string, hi: string, kn: string) =>
  language === 'hi' ? hi : language === 'kn' ? kn : en;

const input =
  'w-full min-h-[48px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#FBF8F0] dark:bg-[#2A1D5C] px-3.5 py-2.5 text-base text-[#2E1A6E] dark:text-[#F5F0FF] placeholder:text-[#6B7A80] focus:outline-none focus:border-[#6D28D9] focus:ring-2 focus:ring-[#6D28D9]/30';
const labelCls = 'block text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] mb-1';
const primaryBtn =
  'inline-flex w-full items-center justify-center gap-2 min-h-[50px] rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-3 text-base font-semibold text-white transition-colors disabled:opacity-60';
const ghostBtn =
  'inline-flex items-center justify-center gap-2 min-h-[44px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-4 py-2 text-sm font-semibold text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] transition-colors disabled:opacity-60';

export const AccountPage: React.FC<AccountPageProps> = ({
  language,
  learningPath,
  onLearningPathChange,
  onResetLocalProgress,
}) => {
  const [account, setAccount] = useState<PublicAccount | null>(getCachedAccount);
  const [sync, setSync] = useState(getSyncInfo);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);

  // login / sign-up fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  // profile fields
  const blankProfile = (): StudentProfile => ({
    fullName: '',
    role: 'student',
    classLevel: String(learningPath.classLevel),
    board: learningPath.board,
    stateName: learningPath.stateName || '',
    school: '',
    district: '',
    language,
  });
  const [profile, setProfile] = useState<StudentProfile>(() => account?.profile ?? blankProfile());

  // change password
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');

  useEffect(() => {
    const on = () => {
      setAccount(getCachedAccount());
      setSync(getSyncInfo());
    };
    window.addEventListener(ACCOUNT_EVENT, on);
    void refreshAccount().then((a) => {
      if (a) {
        setProfile(a.profile);
        startAutoSync();
      }
    });
    return () => window.removeEventListener(ACCOUNT_EVENT, on);
  }, []);

  const setP = (k: keyof StudentProfile, v: string) => setProfile((p) => ({ ...p, [k]: v }));

  /** Keep the app's class/board in step with the profile. */
  const applyPathFromProfile = (p: StudentProfile) => {
    const cls = Number(p.classLevel) as SchoolClass;
    const board = p.board as EducationBoard | undefined;
    if (!SCHOOL_CLASSES.includes(cls) || !board) return;
    onLearningPathChange({
      ...learningPath,
      classLevel: cls,
      board,
      stateName: board === 'state' ? p.stateName || 'Karnataka' : '',
      configured: true,
    });
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await fn();
    } catch (e) {
      setError(
        e instanceof TypeError
          ? L(language, 'No internet. Connect and try again.', 'इंटरनेट नहीं है। जुड़कर फिर कोशिश करें।', 'ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ. ಸಂಪರ್ಕಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.')
          : e instanceof Error
            ? e.message
            : 'Something went wrong.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await logIn(username, password);
      // Reload so every screen reads the restored progress.
      window.location.reload();
    });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== password2) {
      setError(L(language, 'The two passwords do not match.', 'दोनों पासवर्ड एक जैसे नहीं हैं।', 'ಎರಡೂ ಪಾಸ್‌ವರ್ಡ್ ಹೊಂದುತ್ತಿಲ್ಲ.'));
      return;
    }
    void run(async () => {
      const a = await signUp(username, password, profile);
      setAccount(a);
      applyPathFromProfile(profile);
      setPassword('');
      setPassword2('');
      setNotice(L(language, 'Account created. Your progress is now saved.', 'खाता बन गया। आपकी प्रगति अब सेव है।', 'ಖಾತೆ ರಚಿಸಲಾಗಿದೆ. ನಿಮ್ಮ ಪ್ರಗತಿ ಈಗ ಉಳಿದಿದೆ.'));
    });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const a = await updateProfile(profile);
      setAccount(a);
      applyPathFromProfile(profile);
      setNotice(L(language, 'Details saved.', 'जानकारी सेव हो गई।', 'ವಿವರಗಳನ್ನು ಉಳಿಸಲಾಗಿದೆ.'));
    });
  };

  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    void run(async () => {
      await changePassword(oldPw, newPw);
      setOldPw('');
      setNewPw('');
      setNotice(L(language, 'Password changed. Other phones are logged out.', 'पासवर्ड बदल गया। दूसरे फ़ोन लॉग आउट हो गए।', 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಗಿದೆ. ಇತರ ಫೋನ್‌ಗಳು ಲಾಗ್ ಔಟ್ ಆಗಿವೆ.'));
    });
  };

  const handleLogout = (clearPhone: boolean) => {
    void run(async () => {
      await logOut(clearPhone);
      if (clearPhone) {
        onResetLocalProgress();
        window.setTimeout(() => window.location.reload(), 400);
        return;
      }
      setAccount(null);
      setProfile(blankProfile());
      setUsername('');
      setPassword('');
    });
  };

  const card = 'a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 sm:p-6';

  const Message = () => (
    <>
      {error && (
        <p role="alert" className="rounded-xl border border-[#B45309] bg-[#FDF0E1] dark:bg-[#3A2A14] px-3.5 py-2.5 text-sm text-[#7A2E0E] dark:text-[#F5B38A]">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl border border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#2D1B5A] px-3.5 py-2.5 text-sm text-[#5B21B6] dark:text-[#9FE3DA]">
          {notice}
        </p>
      )}
    </>
  );

  const profileFields = (
    <>
      <div>
        <label htmlFor="pf-name" className={labelCls}>
          {L(language, 'Your name', 'आपका नाम', 'ನಿಮ್ಮ ಹೆಸರು')} *
        </label>
        <input id="pf-name" className={input} required maxLength={120} autoComplete="name" value={profile.fullName} onChange={(e) => setP('fullName', e.target.value)} />
      </div>
      <fieldset>
        <legend className={labelCls}>{L(language, 'I am a', 'मैं हूँ', 'ನಾನು')}</legend>
        <div className="grid grid-cols-3 gap-1.5">
          {(
            [
              ['student', L(language, 'Student', 'छात्र', 'ವಿದ್ಯಾರ್ಥಿ')],
              ['teacher', L(language, 'Teacher', 'शिक्षक', 'ಶಿಕ್ಷಕ')],
              ['parent', L(language, 'Parent', 'अभिभावक', 'ಪೋಷಕ')],
            ] as const
          ).map(([id, text]) => (
            <button
              key={id}
              type="button"
              aria-pressed={profile.role === id}
              onClick={() => setP('role', id)}
              className={`min-h-[44px] rounded-xl border text-sm font-semibold ${
                profile.role === id
                  ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#F5F0FF]'
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="pf-class" className={labelCls}>{L(language, 'Class', 'कक्षा', 'ತರಗತಿ')}</label>
          <select id="pf-class" className={input} value={profile.classLevel ?? ''} onChange={(e) => setP('classLevel', e.target.value)}>
            {SCHOOL_CLASSES.map((c) => (
              <option key={c} value={String(c)}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pf-board" className={labelCls}>{L(language, 'Board', 'बोर्ड', 'ಮಂಡಳಿ')}</label>
          <select id="pf-board" className={input} value={profile.board ?? ''} onChange={(e) => setP('board', e.target.value)}>
            {EDUCATION_BOARDS.map((b) => (
              <option key={b.id} value={b.id}>{resolveLocalizedText(b.label, language).text}</option>
            ))}
          </select>
        </div>
      </div>
      {profile.board === 'state' && (
        <div>
          <label htmlFor="pf-state" className={labelCls}>{L(language, 'State', 'राज्य', 'ರಾಜ್ಯ')}</label>
          <select id="pf-state" className={input} value={profile.stateName || 'Karnataka'} onChange={(e) => setP('stateName', e.target.value)}>
            {STATE_BOARD_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="pf-school" className={labelCls}>
            {L(language, 'School (optional)', 'स्कूल (वैकल्पिक)', 'ಶಾಲೆ (ಐಚ್ಛಿಕ)')}
          </label>
          <input id="pf-school" className={input} maxLength={120} value={profile.school ?? ''} onChange={(e) => setP('school', e.target.value)} />
        </div>
        <div>
          <label htmlFor="pf-district" className={labelCls}>
            {L(language, 'Village / district (optional)', 'गाँव / ज़िला (वैकल्पिक)', 'ಗ್ರಾಮ / ಜಿಲ್ಲೆ (ಐಚ್ಛಿಕ)')}
          </label>
          <input id="pf-district" className={input} maxLength={120} value={profile.district ?? ''} onChange={(e) => setP('district', e.target.value)} />
        </div>
      </div>
    </>
  );

  // ------------------------- Logged in -------------------------
  if (account) {
    const saved = sync.lastSavedAt ? new Date(sync.lastSavedAt).toLocaleString() : '—';
    return (
      <div className="mx-auto max-w-2xl px-4 sm:px-6 py-6 space-y-4">
        <section className={`${card} space-y-3`}>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#6D28D9] text-lg font-bold text-white" aria-hidden="true">
              {(account.profile.fullName || account.username).slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-[#2E1A6E] dark:text-white truncate">
                {L(language, 'Hello', 'नमस्ते', 'ನಮಸ್ಕಾರ')}, {account.profile.fullName || account.username}
              </h1>
              <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA] truncate">
                {L(language, 'Username', 'यूज़रनेम', 'ಬಳಕೆದಾರ ಹೆಸರು')}: {account.username}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2.5">
            <p className="text-sm text-[#2E1A6E] dark:text-[#F5F0FF] flex items-center gap-1.5" role="status">
              {sync.state === 'offline' ? (
                <CloudOff className="w-4 h-4 text-[#B45309]" aria-hidden="true" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#6D28D9]" aria-hidden="true" />
              )}
              {sync.state === 'saving'
                ? L(language, 'Saving…', 'सेव हो रहा है…', 'ಉಳಿಸಲಾಗುತ್ತಿದೆ…')
                : sync.state === 'offline'
                  ? L(language, 'Offline — will save when internet returns', 'ऑफ़लाइन — इंटरनेट आने पर सेव होगा', 'ಆಫ್‌ಲೈನ್ — ಇಂಟರ್ನೆಟ್ ಬಂದಾಗ ಉಳಿಸಲಾಗುತ್ತದೆ')
                  : sync.state === 'error'
                    ? L(language, 'Could not save — will retry', 'सेव नहीं हुआ — फिर कोशिश होगी', 'ಉಳಿಸಲಾಗಲಿಲ್ಲ — ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಲಾಗುವುದು')
                    : `${L(language, 'All progress saved', 'सारी प्रगति सेव है', 'ಎಲ್ಲಾ ಪ್ರಗತಿ ಉಳಿದಿದೆ')} · ${saved}`}
            </p>
            <button type="button" className={ghostBtn} disabled={busy} onClick={() => void pushNow()}>
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              {L(language, 'Save now', 'अभी सेव करें', 'ಈಗ ಉಳಿಸಿ')}
            </button>
          </div>
          <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
            {L(
              language,
              'Saved to your account: chapters, experiments, quiz scores, flashcards, streak, badges, class and board. Downloaded offline packs stay on each phone.',
              'खाते में सेव: अध्याय, प्रयोग, क्विज़ अंक, फ्लैशकार्ड, स्ट्रीक, बैज, कक्षा और बोर्ड। डाउनलोड किए ऑफ़लाइन पैक हर फ़ोन में अलग रहते हैं।',
              'ಖಾತೆಯಲ್ಲಿ ಉಳಿಸಲಾಗಿದೆ: ಅಧ್ಯಾಯಗಳು, ಪ್ರಯೋಗಗಳು, ರಸಪ್ರಶ್ನೆ ಅಂಕಗಳು, ಫ್ಲ್ಯಾಶ್‌ಕಾರ್ಡ್, ಸ್ಟ್ರೀಕ್, ಬ್ಯಾಡ್ಜ್, ತರಗತಿ ಮತ್ತು ಮಂಡಳಿ. ಡೌನ್‌ಲೋಡ್ ಮಾಡಿದ ಆಫ್‌ಲೈನ್ ಪ್ಯಾಕ್‌ಗಳು ಪ್ರತಿ ಫೋನ್‌ನಲ್ಲೇ ಇರುತ್ತವೆ.'
            )}
          </p>
        </section>

        <Message />

        <form className={`${card} space-y-3`} onSubmit={handleSaveProfile}>
          <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">{L(language, 'My details', 'मेरी जानकारी', 'ನನ್ನ ವಿವರಗಳು')}</h2>
          {profileFields}
          <button type="submit" className={primaryBtn} disabled={busy}>
            {L(language, 'Save my details', 'मेरी जानकारी सेव करें', 'ನನ್ನ ವಿವರ ಉಳಿಸಿ')}
          </button>
        </form>

        <form className={`${card} space-y-3`} onSubmit={handleChangePw}>
          <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">{L(language, 'Change password', 'पासवर्ड बदलें', 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ')}</h2>
          <div>
            <label htmlFor="pw-old" className={labelCls}>{L(language, 'Current password', 'मौजूदा पासवर्ड', 'ಈಗಿನ ಪಾಸ್‌ವರ್ಡ್')}</label>
            <input id="pw-old" type="password" className={input} autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} required />
          </div>
          <div>
            <label htmlFor="pw-new" className={labelCls}>{L(language, 'New password (6+ characters)', 'नया पासवर्ड (6+ अक्षर)', 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ (6+ ಅಕ್ಷರ)')}</label>
            <input id="pw-new" type="password" className={input} autoComplete="new-password" minLength={6} value={newPw} onChange={(e) => setNewPw(e.target.value)} required />
          </div>
          <button type="submit" className={ghostBtn} disabled={busy}>
            {L(language, 'Change password', 'पासवर्ड बदलें', 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ')}
          </button>
        </form>

        <section className={`${card} space-y-2`}>
          <h2 className="text-lg font-bold text-[#2E1A6E] dark:text-white">{L(language, 'Log out', 'लॉग आउट', 'ಲಾಗ್ ಔಟ್')}</h2>
          <div className="flex flex-col sm:flex-row gap-2">
            <button type="button" className={ghostBtn} disabled={busy} onClick={() => handleLogout(false)}>
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {L(language, 'Log out', 'लॉग आउट', 'ಲಾಗ್ ಔಟ್')}
            </button>
            <button type="button" className={`${ghostBtn} text-[#9A3412] dark:text-[#F5B38A]`} disabled={busy} onClick={() => handleLogout(true)}>
              <LogOut className="w-4 h-4" aria-hidden="true" />
              {L(language, 'Log out and clear this phone', 'लॉग आउट करें और फ़ोन साफ़ करें', 'ಲಾಗ್ ಔಟ್ ಮಾಡಿ ಫೋನ್ ಖಾಲಿ ಮಾಡಿ')}
            </button>
          </div>
          <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
            {L(
              language,
              'Sharing this phone with a brother, sister or friend? Use "clear this phone" — your progress stays safe in your account.',
              'यह फ़ोन भाई-बहन या दोस्त के साथ बाँटते हैं? "फ़ोन साफ़ करें" चुनें — आपकी प्रगति खाते में सुरक्षित रहेगी।',
              'ಈ ಫೋನ್ ಅನ್ನು ಅಣ್ಣ-ತಂಗಿ ಅಥವಾ ಸ್ನೇಹಿತರೊಂದಿಗೆ ಹಂಚಿಕೊಳ್ಳುತ್ತೀರಾ? "ಫೋನ್ ಖಾಲಿ ಮಾಡಿ" ಆರಿಸಿ — ನಿಮ್ಮ ಪ್ರಗತಿ ಖಾತೆಯಲ್ಲಿ ಸುರಕ್ಷಿತ.'
            )}
          </p>
        </section>
      </div>
    );
  }

  // ------------------------- Login / Sign up -------------------------
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6 py-6 space-y-4">
      <div className="text-center space-y-1">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EFE7FF] dark:bg-[#2D1B5A]" aria-hidden="true">
          <UserRound className="w-7 h-7 text-[#6D28D9] dark:text-[#C4B5FD]" />
        </span>
        <h1 className="text-2xl font-bold text-[#2E1A6E] dark:text-white">
          {mode === 'login'
            ? L(language, 'Log in to Gyaan Graph', 'Gyaan Graph में लॉग इन करें', 'Gyaan Graph ಗೆ ಲಾಗ್ ಇನ್ ಮಾಡಿ')
            : L(language, 'Create your account', 'अपना खाता बनाएँ', 'ನಿಮ್ಮ ಖಾತೆ ರಚಿಸಿ')}
        </h1>
        <p className="text-sm text-[#4A3F66] dark:text-[#C9BFEA]">
          {L(
            language,
            'Save your progress and continue on any phone. No email needed.',
            'अपनी प्रगति सेव करें और किसी भी फ़ोन पर जारी रखें। ईमेल की ज़रूरत नहीं।',
            'ನಿಮ್ಮ ಪ್ರಗತಿ ಉಳಿಸಿ, ಯಾವುದೇ ಫೋನ್‌ನಲ್ಲಿ ಮುಂದುವರಿಸಿ. ಇಮೇಲ್ ಬೇಕಿಲ್ಲ.'
          )}
        </p>
      </div>

      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-1">
        {(['login', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`min-h-[44px] rounded-lg text-sm font-semibold ${
              mode === m ? 'bg-[#6D28D9] text-white' : 'text-[#2E1A6E] dark:text-[#F5F0FF]'
            }`}
          >
            {m === 'login' ? L(language, 'Log in', 'लॉग इन', 'ಲಾಗ್ ಇನ್') : L(language, 'New account', 'नया खाता', 'ಹೊಸ ಖಾತೆ')}
          </button>
        ))}
      </div>

      <Message />

      <form className={`${card} space-y-3`} onSubmit={mode === 'login' ? handleLogin : handleSignup}>
        <div>
          <label htmlFor="au-user" className={labelCls}>
            {L(language, 'Username or mobile number', 'यूज़रनेम या मोबाइल नंबर', 'ಬಳಕೆದಾರ ಹೆಸರು ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ')}
          </label>
          <input
            id="au-user"
            className={input}
            required
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={L(language, 'e.g. priya_9 or 9876543210', 'जैसे priya_9 या 9876543210', 'ಉದಾ. priya_9 ಅಥವಾ 9876543210')}
          />
          {mode === 'signup' && (
            <p className="mt-1 text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
              {L(language, '3–30 letters/numbers, or a 10-digit mobile number.', '3–30 अक्षर/अंक, या 10 अंकों का मोबाइल नंबर।', '3–30 ಅಕ್ಷರ/ಅಂಕಿ, ಅಥವಾ 10 ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ.')}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="au-pw" className={labelCls}>
            {L(language, 'Password', 'पासवर्ड', 'ಪಾಸ್‌ವರ್ಡ್')}
            {mode === 'signup' && L(language, ' (6+ characters)', ' (6+ अक्षर)', ' (6+ ಅಕ್ಷರ)')}
          </label>
          <div className="relative">
            <input
              id="au-pw"
              type={showPw ? 'text' : 'password'}
              className={`${input} pr-12`}
              required
              minLength={mode === 'signup' ? 6 : undefined}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-1 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-lg text-[#4A3F66] dark:text-[#C9BFEA]"
              aria-label={showPw ? L(language, 'Hide password', 'पासवर्ड छिपाएँ', 'ಪಾಸ್‌ವರ್ಡ್ ಮರೆಮಾಡಿ') : L(language, 'Show password', 'पासवर्ड दिखाएँ', 'ಪಾಸ್‌ವರ್ಡ್ ತೋರಿಸಿ')}
            >
              {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mode === 'signup' && (
          <>
            <div>
              <label htmlFor="au-pw2" className={labelCls}>{L(language, 'Type password again', 'पासवर्ड फिर से लिखें', 'ಪಾಸ್‌ವರ್ಡ್ ಮತ್ತೆ ಬರೆಯಿರಿ')}</label>
              <input id="au-pw2" type={showPw ? 'text' : 'password'} className={input} required minLength={6} autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
            </div>
            {profileFields}
          </>
        )}

        <button type="submit" className={primaryBtn} disabled={busy}>
          {mode === 'login' ? <LogIn className="w-5 h-5" aria-hidden="true" /> : <UserPlus className="w-5 h-5" aria-hidden="true" />}
          {busy
            ? L(language, 'Please wait…', 'कृपया रुकें…', 'ದಯವಿಟ್ಟು ಕಾಯಿರಿ…')
            : mode === 'login'
              ? L(language, 'Log in', 'लॉग इन', 'ಲಾಗ್ ಇನ್')
              : L(language, 'Create account', 'खाता बनाएँ', 'ಖಾತೆ ರಚಿಸಿ')}
        </button>
        {mode === 'login' && (
          <p className="text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
            {L(
              language,
              'There is no password reset yet, so write your password down somewhere safe.',
              'अभी पासवर्ड रीसेट की सुविधा नहीं है, इसलिए पासवर्ड कहीं सुरक्षित लिख लें।',
              'ಇನ್ನೂ ಪಾಸ್‌ವರ್ಡ್ ಮರುಹೊಂದಿಕೆ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಪಾಸ್‌ವರ್ಡ್ ಅನ್ನು ಸುರಕ್ಷಿತವಾಗಿ ಬರೆದಿಡಿ.'
            )}
          </p>
        )}
      </form>

      <p className="text-center text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
        {L(
          language,
          'You can keep learning without an account — progress then stays only on this phone.',
          'बिना खाते के भी पढ़ सकते हैं — तब प्रगति सिर्फ़ इस फ़ोन में रहती है।',
          'ಖಾತೆ ಇಲ್ಲದೆಯೂ ಕಲಿಯಬಹುದು — ಆಗ ಪ್ರಗತಿ ಈ ಫೋನ್‌ನಲ್ಲೇ ಇರುತ್ತದೆ.'
        )}
      </p>
    </div>
  );
};

export default AccountPage;
