import { apiUrl } from '../lib/apiBase';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SPEECH_LANG_CODES } from '../data/i18n';
import { getPreferredSpeechVoice, getSavedSpeechVoiceURI, getSpeechVoiceChoices, savePreferredSpeechVoice } from '../lib/speechVoice';
import type { Language } from '../types/stem';

interface RecInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecCtor = new () => RecInstance;
type VoiceMode = 'device' | 'natural';

// v3: natural voice is now the default for everyone
const SPEECH_MODE_KEY = 'stem-saathi-ai-voice-mode-v3';
const NATURAL_VOICE_KEY = 'stem-saathi-natural-voice-v2';
type Engine = 'groq' | 'gemini';
const VOICE_LABELS: Record<Engine, Record<string, string>> = {
  groq: { hannah: 'Hannah · warm', diana: 'Diana · clear', autumn: 'Autumn · gentle', austin: 'Austin · friendly', daniel: 'Daniel · calm', troy: 'Troy · bright' },
  gemini: { Sulafat: 'Sulafat · warm', Aoede: 'Aoede · breezy', Achird: 'Achird · friendly', Kore: 'Kore · clear' },
};
const DEFAULT_VOICE: Record<Engine, string> = { groq: 'hannah', gemini: 'Sulafat' };
interface SpeechStatus {
  engines: Partial<Record<Language, Engine | null>>;
  voices: Record<Engine, string[]>;
  groqNeedsTerms?: boolean;
}

function getStoredValue(key: string, fallback: string): string {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}

/** Turn markdown-ish tutor text into something a speech engine reads sensibly. */
export function cleanForSpeech(text: string): string {
  const lines = text
    .replace(/```[\s\S]*?```/g, ' ')
    .split('\n')
    .filter((l) => !/^[\s|:\-–—]+$/.test(l)) // table rules and dividers
    .map((l) =>
      l.includes('|')
        ? l
            .split('|')
            .map((c) => c.trim())
            .filter(Boolean)
            .join(', ') + '.'
        : l.trim() && !/[.!?।:]\s*$/.test(l.trim())
          ? l.trim() + '.'
          : l
    );
  return lines
    .join('\n')
    .replace(/[`*_#>]+/g, ' ')
    .replace(/\\\[|\\\]|\\\(|\\\)/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, ' ')
    .replace(/\.\s*\.(\s*\.)*/g, '.')
    .replace(/([?!।])\./g, '$1')
    .trim();
}

/** Split into short chunks: engines cut off long utterances, and captions read better in small pieces. */
export function splitForSpeech(text: string, max = 180): string[] {
  const out: string[] = [];
  for (const sentence of cleanForSpeech(text).split(/(?<=[.!?।])\s+/)) {
    let s = sentence.trim();
    while (s.length > max) {
      const cut = s.lastIndexOf(',', max) > 40 ? s.lastIndexOf(',', max) + 1 : s.lastIndexOf(' ', max);
      out.push(s.slice(0, cut > 0 ? cut : max).trim());
      s = s.slice(cut > 0 ? cut : max).trim();
    }
    if (s && /[\p{L}\p{N}]/u.test(s)) out.push(s);
  }
  return out;
}

/**
 * Spoken answers with live captions, plus hands-free voice input. Natural AI voice is the default
 * (Groq Orpheus for English, Gemini for Hindi/Kannada when configured); any failure falls back to
 * the phone's own voice.
 */
export function useTeacherVoice(language: Language) {
  const [speaking, setSpeaking] = useState(false);
  const [chunks, setChunks] = useState<string[]>([]);
  const [active, setActive] = useState(-1);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [hasVoice, setHasVoice] = useState(true);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceSelections, setVoiceSelections] = useState<Partial<Record<Language, string>>>({});
  const [voiceMode, setVoiceModeState] = useState<VoiceMode>(() =>
    getStoredValue(SPEECH_MODE_KEY, 'natural') === 'device' ? 'device' : 'natural'
  );
  const [naturalVoiceName, setNaturalVoiceNameState] = useState(() => getStoredValue(NATURAL_VOICE_KEY, ''));
  const [speechStatus, setSpeechStatus] = useState<SpeechStatus | null>(null);
  const naturalOkRef = useRef(true); // turned off for this page after a hard failure (e.g. terms not accepted)

  // Which natural voice engine (if any) the server offers for each language
  useEffect(() => {
    let alive = true;
    fetch(apiUrl('/api/mentor/speech/status'))
      .then((r) => (r.ok ? (r.json() as Promise<SpeechStatus>) : null))
      .then((st) => alive && st && setSpeechStatus(st))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  const engine: Engine | null = speechStatus?.engines[language] ?? null;
  const naturalVoices = engine
    ? (speechStatus?.voices[engine] ?? []).map((id) => ({ id, label: VOICE_LABELS[engine][id] ?? id }))
    : [];
  const naturalVoice = engine
    ? naturalVoices.some((v) => v.id === naturalVoiceName)
      ? naturalVoiceName
      : DEFAULT_VOICE[engine]
    : '';
  const token = useRef(0);
  const recRef = useRef<RecInstance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const RecClass: RecCtor | undefined =
    typeof window === 'undefined'
      ? undefined
      : ((window as unknown as { SpeechRecognition?: RecCtor; webkitSpeechRecognition?: RecCtor }).SpeechRecognition ??
        (window as unknown as { webkitSpeechRecognition?: RecCtor }).webkitSpeechRecognition);
  const sttSupported = Boolean(RecClass);

  const pickVoice = useCallback(() => {
    if (!ttsSupported) return undefined;
    const voices = window.speechSynthesis.getVoices();
    const choices = getSpeechVoiceChoices(language, voices);
    return choices.find((voice) => voice.voiceURI === voiceSelections[language]) ?? getPreferredSpeechVoice(language, voices);
  }, [language, ttsSupported, voiceSelections]);

  // Voices load asynchronously on many browsers
  useEffect(() => {
    if (!ttsSupported) return;
    const update = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(getSpeechVoiceChoices(language, voices));
      setHasVoice(voices.length === 0 ? true : Boolean(getSpeechVoiceChoices(language, voices).length));
    };
    update();
    window.speechSynthesis.addEventListener?.('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener?.('voiceschanged', update);
  }, [ttsSupported, language]);

  const setPreferredVoice = useCallback((voiceURI: string) => {
    savePreferredSpeechVoice(language, voiceURI);
    setVoiceSelections((previous) => ({ ...previous, [language]: voiceURI }));
  }, [language]);

  const setVoiceMode = useCallback((mode: VoiceMode) => {
    setVoiceModeState(mode);
    try { localStorage.setItem(SPEECH_MODE_KEY, mode); } catch { /* Keep the current-page preference. */ }
  }, []);

  const setNaturalVoiceName = useCallback((name: string) => {
    setNaturalVoiceNameState(name);
    try { localStorage.setItem(NATURAL_VOICE_KEY, name); } catch { /* Keep the current-page preference. */ }
  }, []);

  const releaseAiAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    token.current += 1;
    if (ttsSupported) window.speechSynthesis.cancel();
    releaseAiAudio();
    setSpeaking(false);
    setActive(-1);
  }, [releaseAiAudio, ttsSupported]);

  const speak = useCallback(
    (text: string) => {
      const parts = splitForSpeech(text);
      if (parts.length === 0) return;
      const my = ++token.current;
      if (ttsSupported) window.speechSynthesis.cancel();
      releaseAiAudio();
      setChunks(parts);
      setSpeaking(true);
      setVoiceError(null);
      const voice = pickVoice();
      const playFrom = (i: number) => {
        if (token.current !== my) return;
        if (!ttsSupported) {
          setVoiceError('Device voice is not supported in this browser. Captions are still shown on screen.');
          setSpeaking(false);
          setActive(-1);
          return;
        }
        if (i >= parts.length) {
          setSpeaking(false);
          setActive(-1);
          return;
        }
        setActive(i);
        const u = new SpeechSynthesisUtterance(parts[i]);
        u.lang = SPEECH_LANG_CODES[language];
        if (voice) u.voice = voice;
        u.rate = 0.95;
        u.onend = () => playFrom(i + 1);
        u.onerror = () => {
          if (token.current === my) {
            setSpeaking(false);
            setActive(-1);
          }
        };
        window.speechSynthesis.speak(u);
      };
      if (voiceMode === 'device' || !engine || !naturalOkRef.current) {
        if (voiceMode === 'natural' && !engine && speechStatus && language !== 'en') {
          setVoiceError(
            language === 'hi'
              ? 'हिंदी के लिए प्राकृतिक आवाज़ उपलब्ध नहीं है — फ़ोन की आवाज़ उपयोग हो रही है।'
              : 'ಕನ್ನಡಕ್ಕೆ ಸಹಜ ಧ್ವನಿ ಲಭ್ಯವಿಲ್ಲ — ಫೋನ್ ಧ್ವನಿ ಬಳಸಲಾಗುತ್ತಿದೆ.'
          );
        }
        playFrom(0);
        return;
      }

      // Natural voice: one sentence per request (the English model takes ≤200 characters),
      // fetching the next sentence while the current one plays so speech flows without gaps.
      const fetchPart = (i: number): Promise<string> =>
        fetch(apiUrl('/api/mentor/speech'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: parts[i], language, voiceName: naturalVoice }),
        }).then(async (response) => {
          const data = (await response.json().catch(() => ({}))) as { audioBase64?: string; mimeType?: string; error?: string };
          if (!response.ok || !data.audioBase64) {
            const err = new Error(data.error || 'Natural voice is unavailable.') as Error & { hard?: boolean };
            err.hard = response.status === 502 || response.status === 503 || /console|set up|needs/i.test(data.error ?? '');
            throw err;
          }
          const binary = atob(data.audioBase64);
          const bytes = new Uint8Array(binary.length);
          for (let k = 0; k < binary.length; k++) bytes[k] = binary.charCodeAt(k);
          return URL.createObjectURL(new Blob([bytes.buffer as ArrayBuffer], { type: data.mimeType || 'audio/wav' }));
        });
      const pending = new Map<number, Promise<string>>();
      const get = (i: number) => {
        if (!pending.has(i)) {
          const pr = fetchPart(i);
          pr.catch(() => undefined); // handled when played
          pending.set(i, pr);
        }
        return pending.get(i)!;
      };
      const cleanupPending = () => {
        pending.forEach((pr) => pr.then((u) => URL.revokeObjectURL(u)).catch(() => undefined));
        pending.clear();
      };
      const playNatural = async (i: number) => {
        if (token.current !== my) return cleanupPending();
        if (i >= parts.length) {
          releaseAiAudio();
          setSpeaking(false);
          setActive(-1);
          return;
        }
        let url: string;
        try {
          url = await get(i);
          if (i + 1 < parts.length) get(i + 1);
        } catch (error) {
          if (token.current !== my) return;
          if ((error as { hard?: boolean }).hard) naturalOkRef.current = false;
          setVoiceError(`${error instanceof Error ? error.message : 'Natural voice is unavailable.'} Using the device voice.`);
          cleanupPending();
          playFrom(i);
          return;
        }
        if (token.current !== my) return URL.revokeObjectURL(url);
        releaseAiAudio();
        pending.delete(i);
        const audio = new Audio(url);
        audioRef.current = audio;
        audioUrlRef.current = url;
        setActive(i);
        audio.onended = () => void playNatural(i + 1);
        audio.onerror = () => {
          if (token.current !== my) return;
          setVoiceError('Natural voice playback failed. Using the device voice.');
          cleanupPending();
          playFrom(i);
        };
        try {
          await audio.play();
        } catch {
          if (token.current !== my) return;
          cleanupPending();
          playFrom(i);
        }
      };
      get(0);
      if (parts.length > 1) get(1);
      void playNatural(0);
    },
    [engine, language, naturalVoice, pickVoice, releaseAiAudio, speechStatus, ttsSupported, voiceMode]
  );

  const stopListening = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  /** onInterim fires while the student talks; onFinal fires once with the finished sentence. */
  const listen = useCallback(
    (onInterim: (t: string) => void, onFinal: (t: string) => void) => {
      setVoiceError(null);
      if (!RecClass) {
        setVoiceError('Voice input is not supported in this browser (try Chrome on Android or desktop).');
        return;
      }
      stop();
      try {
        const rec = new RecClass();
        rec.lang = SPEECH_LANG_CODES[language];
        rec.interimResults = true;
        rec.continuous = false;
        rec.maxAlternatives = 1;
        let finalText = '';
        rec.onresult = (e) => {
          let interim = '';
          for (let i = 0; i < e.results.length; i++) {
            const r = e.results[i];
            const txt = r[0]?.transcript ?? '';
            if (r.isFinal) finalText += txt;
            else interim += txt;
          }
          onInterim((finalText + interim).trim());
        };
        rec.onerror = (e) => {
          setVoiceError(
            e.error === 'not-allowed'
              ? 'Microphone permission was denied. Allow the microphone in the browser settings.'
              : e.error === 'no-speech'
                ? 'No speech heard. Tap the microphone and try again.'
                : `Voice input problem (${e.error}).`
          );
          setListening(false);
        };
        rec.onend = () => {
          setListening(false);
          if (finalText.trim()) onFinal(finalText.trim());
        };
        recRef.current = rec;
        setListening(true);
        rec.start();
      } catch {
        setVoiceError('Could not start the microphone.');
        setListening(false);
      }
    },
    [RecClass, language, stop]
  );

  useEffect(
    () => () => {
      token.current += 1;
      if (ttsSupported) window.speechSynthesis.cancel();
      releaseAiAudio();
      recRef.current?.stop();
    },
    [releaseAiAudio, ttsSupported]
  );

  return {
    speaking,
    chunks,
    active,
    caption: active >= 0 ? chunks[active] : '',
    listening,
    voiceError,
    hasVoice,
    availableVoices,
    voiceMode,
    setVoiceMode,
    naturalVoiceName: naturalVoice,
    setNaturalVoiceName,
    naturalVoices,
    naturalEngine: engine,
    naturalNeedsSetup: Boolean(speechStatus?.groqNeedsTerms),
    selectedVoiceURI: availableVoices.some(
      (voice) => voice.voiceURI === (voiceSelections[language] ?? getSavedSpeechVoiceURI(language))
    )
      ? voiceSelections[language] ?? getSavedSpeechVoiceURI(language)
      : getPreferredSpeechVoice(language, availableVoices)?.voiceURI ?? '',
    setPreferredVoice,
    ttsSupported,
    sttSupported,
    speak,
    stop,
    listen,
    stopListening,
  };
}
