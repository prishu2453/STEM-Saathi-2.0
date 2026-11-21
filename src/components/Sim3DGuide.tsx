import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BookOpen, Eye, Home, Lightbulb, Square, Volume2 } from 'lucide-react';
import type { ExperimentId } from '../data/physicsExperiments';
import { GUIDE_HEADINGS, GUIDE_LANGS, SIM3D_GUIDES, type GuideLang } from '../data/sim3dGuides';
import type { Language } from '../types/stem';

const LANG_KEY = 'stem-saathi-3d-guide-lang-v1';

const NO_VOICE: Record<GuideLang, string> = {
  en: 'This device has no voice for this language. Please read the text.',
  hi: 'इस डिवाइस में इस भाषा की आवाज़ नहीं है। कृपया पाठ पढ़ें।',
  kn: 'ಈ ಸಾಧನದಲ್ಲಿ ಈ ಭಾಷೆಯ ಧ್ವನಿ ಇಲ್ಲ. ದಯವಿಟ್ಟು ಪಠ್ಯವನ್ನು ಓದಿ.',
  ta: 'இந்தச் சாதனத்தில் இந்த மொழிக்கான குரல் இல்லை. உரையைப் படியுங்கள்.',
  te: 'ఈ పరికరంలో ఈ భాషకు గొంతు లేదు. దయచేసి వచనాన్ని చదవండి.',
  mr: 'या उपकरणात या भाषेचा आवाज नाही. कृपया मजकूर वाचा.',
};

interface Props {
  experimentId: ExperimentId;
  appLanguage: Language;
}

/** Plain-language guide shown under each 3D simulation, in six Indian languages, with read-aloud. */
export const Sim3DGuide: React.FC<Props> = ({ experimentId, appLanguage }) => {
  const [lang, setLang] = useState<GuideLang>(() => {
    try {
      const saved = localStorage.getItem(LANG_KEY) as GuideLang | null;
      if (saved && GUIDE_LANGS.some((l) => l.id === saved)) return saved;
    } catch {
      // storage unavailable
    }
    return appLanguage;
  });
  const [speaking, setSpeaking] = useState(false);
  const [voiceMissing, setVoiceMissing] = useState(false);

  // follow the app language when the student switches it in the header (not on first load,
  // so a language chosen here last time — e.g. Tamil — is kept)
  const prevApp = useRef(appLanguage);
  useEffect(() => {
    if (prevApp.current !== appLanguage) {
      prevApp.current = appLanguage;
      setLang(appLanguage);
    }
  }, [appLanguage]);

  const choose = (l: GuideLang) => {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      // ignore
    }
  };

  const guide = SIM3D_GUIDES[experimentId]?.[lang];
  const h = GUIDE_HEADINGS[lang];
  const speechCode = GUIDE_LANGS.find((l) => l.id === lang)!.speech;
  const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const stop = () => {
    if (canSpeak) window.speechSynthesis.cancel();
    setSpeaking(false);
  };
  // stop talking when the experiment or language changes, or on unmount
  useEffect(() => {
    setVoiceMissing(false);
    return () => {
      if (canSpeak) window.speechSynthesis.cancel();
      setSpeaking(false);
    };
  }, [experimentId, lang, canSpeak]);

  const fullText = useMemo(
    () => (guide ? [guide.see, guide.why, ...guide.tryThis, guide.life].join(' ') : ''),
    [guide]
  );

  /** Browsers load their voice list in the background; wait briefly for it on the first use. */
  const voicesReady = () =>
    new Promise<SpeechSynthesisVoice[]>((resolve) => {
      const now = window.speechSynthesis.getVoices();
      if (now.length) return resolve(now);
      const done = () => resolve(window.speechSynthesis.getVoices());
      window.speechSynthesis.addEventListener?.('voiceschanged', done, { once: true });
      window.setTimeout(done, 1500);
    });

  const listen = async () => {
    if (!canSpeak || !guide) return;
    if (speaking) return stop();
    const prefix = speechCode.slice(0, 2);
    const voices = await voicesReady();
    // Marathi voices are rare on phones; Marathi uses Devanagari, so a Hindi voice can read it.
    const voice =
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) ??
      (lang === 'mr' ? voices.find((v) => v.lang.toLowerCase().startsWith('hi')) : undefined);
    // only say "no voice" when we actually know the list and it has none for this language
    if (!voice && lang !== 'en' && voices.length > 0) {
      setVoiceMissing(true);
      return;
    }
    setVoiceMissing(false);
    window.speechSynthesis.cancel();
    // speak sentence by sentence: long single utterances get cut off on many phones
    const parts = fullText.split(/(?<=[.!?।])\s+/).filter(Boolean);
    let i = 0;
    const next = () => {
      if (i >= parts.length) return setSpeaking(false);
      const u = new SpeechSynthesisUtterance(parts[i++]);
      u.lang = speechCode;
      if (voice) u.voice = voice;
      u.rate = 0.92;
      u.onend = next;
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    };
    setSpeaking(true);
    next();
  };

  if (!guide) return null;

  const section = 'rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3 space-y-1';
  const heading = 'flex items-center gap-1.5 text-sm font-bold text-[#2E1A6E] dark:text-white';
  const body = 'text-sm leading-relaxed text-[#22163F] dark:text-[#E4DDFA]';

  return (
    <section
      aria-labelledby="sim3d-guide-title"
      lang={speechCode}
      className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-3 sm:p-4 space-y-3"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id="sim3d-guide-title" className="flex items-center gap-1.5 text-base font-bold text-[#5B21B6] dark:text-[#C4B5FD]">
          <BookOpen className="w-4 h-4" aria-hidden="true" />
          {h.title}
        </h4>
        {canSpeak && (
          <button
            type="button"
            onClick={() => void listen()}
            aria-pressed={speaking}
            className="inline-flex items-center gap-1.5 min-h-[40px] rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] px-3 py-1.5 text-sm font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9]"
          >
            {speaking ? <Square className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
            {speaking ? h.stop : h.listen}
          </button>
        )}
      </div>

      <div role="group" aria-label="Language" className="flex flex-wrap gap-1.5">
        {GUIDE_LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            lang={l.speech}
            aria-pressed={lang === l.id}
            onClick={() => choose(l.id)}
            className={`min-h-[40px] rounded-lg border px-3 py-1 text-sm font-semibold ${
              lang === l.id
                ? 'border-[#6D28D9] bg-[#6D28D9] text-white'
                : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9]'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {voiceMissing && (
        <p role="status" className="text-xs text-[#7A4A00] dark:text-[#FF9F1C]">
          {NO_VOICE[lang]}
        </p>
      )}

      <div className="grid gap-2 md:grid-cols-2">
        <div className={section}>
          <p className={heading}>
            <Eye className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
            {h.see}
          </p>
          <p className={body}>{guide.see}</p>
        </div>
        <div className={section}>
          <p className={heading}>
            <Lightbulb className="w-4 h-4 text-[#B7791F]" aria-hidden="true" />
            {h.why}
          </p>
          <p className={body}>{guide.why}</p>
        </div>
        <div className={section}>
          <p className={heading}>
            <span aria-hidden="true">👉</span>
            {h.tryThis}
          </p>
          <ul className={`${body} list-disc pl-5 space-y-1`}>
            {guide.tryThis.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
        <div className={section}>
          <p className={heading}>
            <Home className="w-4 h-4 text-[#7C3AED] dark:text-[#C4B5FD]" aria-hidden="true" />
            {h.life}
          </p>
          <p className={body}>{guide.life}</p>
        </div>
      </div>
      {lang !== 'en' && <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">{h.note}</p>}
    </section>
  );
};

export default Sim3DGuide;
