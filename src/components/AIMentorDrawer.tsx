import { apiUrl } from '../lib/apiBase';
import React, { useEffect, useRef, useState } from 'react';
import {
  ExternalLink,
  Globe,
  Mic,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Volume2,
  X,
} from 'lucide-react';
import { UI_TEXT } from '../data/i18n';
import { useAudioTranscriber } from '../hooks/useAudioTranscriber';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useTeacherVoice } from '../hooks/useTeacherVoice';
import type { ChatSource, Language, MentorTier } from '../types/stem';

interface AIMentorDrawerProps {
  open: boolean;
  onClose: () => void;
  language: Language;
  initialSubject?: string;
  initialPrompt?: string;
  experimentContext?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  modelLabel?: string;
  sources?: ChatSource[];
}

const TIER_OPTIONS: { id: MentorTier; label: string; hint: string }[] = [
  { id: 'fast', label: 'Fast · Flash Lite', hint: 'Quick answers & definitions' },
  { id: 'general', label: 'Balanced · Hydrogen', hint: 'Everyday STEM tutoring' },
  { id: 'complex', label: 'Complex · Argon', hint: 'Multi-step physics & math' },
  { id: 'deep', label: 'Deep · Carbon', hint: 'Deep scientific reasoning & proofs' },
  { id: 'search', label: 'Google Search · Hydrogen', hint: 'Live web-grounded facts' },
];

const MENTOR_ROLES = [
  'Concept Tutor',
  'Numerical Problem Coach',
  'Virtual Lab Instructor',
  'Science Research Assistant',
];

const STARTER_PROMPTS = [
  {
    text: 'Why is horizontal range maximum at 45 degrees in projectile motion?',
    search: false,
  },
  {
    text: "Explain Faraday's Law of electromagnetic induction with a real-world example.",
    search: false,
  },
  {
    text: 'What are the latest recent discoveries by ISRO or NASA in space physics this year?',
    search: true,
  },
  {
    text: 'Compare nuclear fusion breakthroughs and current tokamak milestones.',
    search: true,
  },
];

const FormattedMessage: React.FC<{ text: string }> = ({ text }) => {
  const lines = text.split('\n');

  const renderInline = (line: string) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-[#2E1A6E] dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="rounded bg-[#F5F0FF] dark:bg-[#2A1D5C] px-1 py-0.5 font-mono text-[11px] text-[#5B21B6] dark:text-[#C4B5FD]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-1.5">
      {lines.map((rawLine, idx) => {
        const line = rawLine.trim();
        if (!line) return <div key={idx} className="h-1" />;
        if (line === '---' || line === '***') {
          return <hr key={idx} className="border-[#E7DDFB] dark:border-[#3B2C78] my-1.5" />;
        }
        if (line.startsWith('### ')) {
          return (
            <h4 key={idx} className="text-xs font-bold text-[#2E1A6E] dark:text-white pt-1">
              {renderInline(line.slice(4))}
            </h4>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h3 key={idx} className="text-sm font-bold text-[#2E1A6E] dark:text-white pt-1">
              {renderInline(line.slice(3))}
            </h3>
          );
        }
        if (line.startsWith('* ') || line.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-1.5 pl-1">
              <span className="text-[#6D28D9] dark:text-[#C4B5FD] mt-0.5">•</span>
              <span>{renderInline(line.replace(/^[-*]\s+/, ''))}</span>
            </div>
          );
        }
        return <p key={idx}>{renderInline(rawLine)}</p>;
      })}
    </div>
  );
};

export const AIMentorDrawer: React.FC<AIMentorDrawerProps> = ({
  open,
  onClose,
  language,
  initialSubject = 'Physics',
  initialPrompt = '',
  experimentContext,
}) => {
  const t = UI_TEXT[language];
  const isOnline = useOnlineStatus();
  const voice = useTeacherVoice(language);
  const isSpeaking = voice.speaking;
  const speak = voice.speak;
  const stopSpeaking = voice.stop;
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    try {
      return localStorage.getItem('stem-saathi-mentor-autospeak') === '1';
    } catch {
      return false;
    }
  });
  const toggleAutoSpeak = () => {
    const next = !autoSpeak;
    setAutoSpeak(next);
    if (!next) voice.stop();
    try {
      localStorage.setItem('stem-saathi-mentor-autospeak', next ? '1' : '0');
    } catch {
      // storage unavailable
    }
  };
  const {
    isRecording,
    isTranscribing,
    transcribeError,
    startRecording,
    stopRecording,
  } = useAudioTranscriber(language);

  const [subject, setSubject] = useState(initialSubject);
  const [level, setLevel] = useState('Secondary (Grades 9-12)');
  const [mentorRole, setMentorRole] = useState(MENTOR_ROLES[0]);
  const [tier, setTier] = useState<MentorTier>('fast');
  const [useSearch, setUseSearch] = useState(false);
  const [input, setInput] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const feedEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialSubject) setSubject(initialSubject);
    if (initialPrompt) setInput(initialPrompt);
  }, [initialSubject, initialPrompt]);

  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (!open) return null;

  const sendMessage = async (
    textToSend?: string,
    forceSearch?: boolean,
    overrideTier?: MentorTier
  ) => {
    const query = (textToSend ?? input).trim();
    if (!query || loading) return;

    const effectiveTier = overrideTier ?? tier;
    const searchActive = forceSearch ?? (effectiveTier === 'search' || (overrideTier ? false : useSearch));
    const priorHistory = messages.slice(-14).map((m) => ({
      role: m.role,
      text: m.text,
    }));

    const shouldAppendUser = !lastFailedQuery || lastFailedQuery !== query;
    if (shouldAppendUser) {
      const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: query };
      setMessages((prev) => [...prev, userMsg]);
    }
    if (!textToSend) setInput('');

    setLoading(true);
    setError(null);
    setLastFailedQuery(null);

    try {
      const res = await fetch(apiUrl('/api/mentor/ask'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          subject,
          language,
          level,
          tier: effectiveTier,
          mentorRole,
          useSearch: searchActive,
          history: priorHistory,
          experimentContext: experimentContext || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to connect to AI Mentor.');
      }

      const activeTierLabel = data.provider
        ? `${data.provider} · ${data.model}`
        : searchActive
          ? 'Google Search · gemini-4-hydrogen'
          : TIER_OPTIONS.find((opt) => opt.id === effectiveTier)?.label;

      const replyMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        modelLabel: activeTierLabel,
        sources: Array.isArray(data.sources) ? (data.sources as ChatSource[]) : [],
      };
      setMessages((prev) => [...prev, replyMsg]);
      if (autoSpeak) voice.speak(data.reply);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach AI Mentor.');
      setLastFailedQuery(query);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gyaan Graph AI Chatbot"
      className="animate-fade-in fixed inset-0 z-50 flex justify-end bg-[#2E1A6E]/50"
    >
      <div className="animate-panel-reveal w-full max-w-lg h-full bg-white dark:bg-[#1F1545] border-l border-[#E7DDFB] dark:border-[#3B2C78] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E7DDFB] dark:border-[#3B2C78] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-[#2E1A6E] dark:text-white">
                AI {subject} Mentor
              </h2>
              <p className="text-[11px] text-[#4A3F66] dark:text-[#C9BFEA]">
                {isOnline
                  ? 'AI chat with voice · answers can be spoken and captioned'
                  : `${t.offlineStatus} · ${t.requiresInternetNotice}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setMessages([]);
                  setError(null);
                  setLastFailedQuery(null);
                }}
                title="Start new conversation"
                className="inline-flex items-center gap-1 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] px-2 py-1 text-[11px] text-[#2E1A6E] dark:text-[#E4DDFA] hover:bg-[#F5F0FF] dark:hover:bg-[#2A1D5C] cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>New Chat</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close AI Mentor"
              className="rounded-lg p-1.5 text-[#4A3F66] hover:text-[#2E1A6E] dark:hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Subject, Role, Level & Model Selectors */}
        <div className="px-5 py-3 border-b border-[#E7DDFB] dark:border-[#3B2C78] space-y-2.5 bg-[#F5F0FF] dark:bg-[#2A1D5C]/70">
          <div className="grid grid-cols-2 gap-2.5">
            <label className="text-xs space-y-1">
              <span className="text-[#4A3F66] dark:text-[#C9BFEA]">Subject</span>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2.5 py-1.5 text-xs text-[#2E1A6E] dark:text-white"
              >
                <option value="Physics">Physics (Primary)</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Mathematics">Mathematics</option>
              </select>
            </label>
            <label className="text-xs space-y-1">
              <span className="text-[#4A3F66] dark:text-[#C9BFEA]">Chatbot Role</span>
              <select
                value={mentorRole}
                onChange={(e) => setMentorRole(e.target.value)}
                className="w-full rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2.5 py-1.5 text-xs text-[#2E1A6E] dark:text-white"
              >
                {MENTOR_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <label className="text-xs space-y-1">
              <span className="text-[#4A3F66] dark:text-[#C9BFEA]">Gemini Mode</span>
              <select
                value={tier}
                onChange={(e) => {
                  const next = e.target.value as MentorTier;
                  setTier(next);
                  setUseSearch(next === 'search');
                }}
                className="w-full rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2.5 py-1.5 text-xs text-[#2E1A6E] dark:text-white"
              >
                {TIER_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-xs space-y-1">
              <span className="text-[#4A3F66] dark:text-[#C9BFEA]">Grade Level</span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2.5 py-1.5 text-xs text-[#2E1A6E] dark:text-white"
              >
                <option>Middle School (Grades 6-8)</option>
                <option>Secondary (Grades 9-12)</option>
                <option>Undergraduate Foundation</option>
              </select>
            </label>
          </div>
        </div>

        {/* Scrollable Multi-Turn Conversation Feed */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!isOnline && (
            <div className="rounded-xl border border-[#FF9F1C] bg-[#FFF1DE] dark:bg-[#FF9F1C]/15 p-3 text-xs text-[#2E1A6E] dark:text-[#F5F0FF]">
              {t.offlineStatus}: {t.requiresInternetNotice}. Offline projectile hints, formula sheets, and local quizzes remain available inside Physics World.
            </div>
          )}

          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-xs text-[#4A3F66] dark:text-[#E4DDFA]">
                Ask any concept, numerical problem, or current science question in English, Hindi, or Kannada.
              </p>
              <div className="space-y-2">
                {STARTER_PROMPTS.map((item) => (
                  <button
                    key={item.text}
                    type="button"
                    onClick={() => {
                      if (item.search) setUseSearch(true);
                      void sendMessage(item.text, item.search);
                    }}
                    className="w-full text-left rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3.5 py-2.5 text-xs text-[#2E1A6E] dark:text-[#F5F0FF] hover:border-[#6D28D9] transition-colors cursor-pointer flex items-start justify-between gap-2"
                  >
                    <span>{item.text}</span>
                    {item.search && (
                      <Globe className="w-3.5 h-3.5 text-[#6D28D9] dark:text-[#C4B5FD] shrink-0 mt-0.5" aria-label="Uses Google Search" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-3.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'ml-8 bg-[#6D28D9] text-white whitespace-pre-wrap'
                  : 'mr-4 border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#22163F] dark:text-[#F5F0FF]'
              }`}
            >
              {msg.modelLabel && (
                <p className="text-[10px] font-medium text-[#5B21B6] dark:text-[#C4B5FD] mb-1.5">
                  {msg.modelLabel}
                </p>
              )}
              {msg.role === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <FormattedMessage text={msg.text} />
              )}

              {/* Google Search Grounding Sources */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-[#E7DDFB] dark:border-[#3B2C78] space-y-1.5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#4A3F66] dark:text-[#C9BFEA] flex items-center gap-1">
                    <Globe className="w-3 h-3 text-[#6D28D9] dark:text-[#C4B5FD]" />
                    <span>Google Search Sources</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src) => (
                      <a
                        key={src.uri}
                        href={src.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] px-2 py-1 text-[11px] text-[#5B21B6] dark:text-[#C4B5FD] hover:border-[#6D28D9]"
                      >
                        <span className="max-w-[180px] truncate">{src.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {msg.role === 'assistant' && (
                <button
                  type="button"
                  onClick={() => (isSpeaking ? stopSpeaking() : speak(msg.text))}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#5B21B6] dark:text-[#C4B5FD] hover:underline cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{isSpeaking ? t.stopReading : t.readAloud}</span>
                </button>
              )}
            </div>
          ))}

          {loading && (
            <div className="mr-8 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] p-3.5 text-xs text-[#4A3F66] dark:text-[#C9BFEA]">
              {useSearch || tier === 'search'
                ? 'Searching live web sources and preparing explanation...'
                : 'Thinking through the concept...'}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300 space-y-2">
              <p>{error}</p>
              {lastFailedQuery && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void sendMessage(lastFailedQuery)}
                    className="rounded-md border border-red-400/50 px-2.5 py-1 text-[11px] font-semibold hover:bg-red-500/20 cursor-pointer"
                  >
                    Retry
                  </button>
                  {tier !== 'fast' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTier('fast');
                        setUseSearch(false);
                        void sendMessage(lastFailedQuery, false, 'fast');
                      }}
                      className="rounded-md bg-[#6D28D9] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#5B21B6] cursor-pointer"
                    >
                      Try Fast Mode (Flash Lite)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <div ref={feedEndRef} />
        </div>

        {/* Input Bar with Search Toggle + Audio Recording */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage();
          }}
          className="p-4 border-t border-[#E7DDFB] dark:border-[#3B2C78] space-y-2"
        >
          {voice.speaking && (
            <div role="status" aria-live="polite" className="rounded-xl border border-[#6D28D9]/50 bg-[#EFE7FF] dark:bg-[#6D28D9]/20 p-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wide text-[#5B21B6] dark:text-[#C4B5FD]">
                  {language === 'hi' ? 'बोल रहा है — कैप्शन' : language === 'kn' ? 'ಮಾತನಾಡುತ್ತಿದೆ — ಕ್ಯಾಪ್ಷನ್' : 'Speaking — captions'}
                </span>
                <button type="button" onClick={voice.stop} className="min-h-[36px] rounded-lg border border-[#6D28D9] px-3 text-[11px] font-semibold text-[#5B21B6] dark:text-[#C4B5FD] cursor-pointer">
                  {language === 'hi' ? 'रोकें' : language === 'kn' ? 'ನಿಲ್ಲಿಸಿ' : 'Stop'}
                </button>
              </div>
              <p className="text-base font-medium leading-snug text-[#2E1A6E] dark:text-white">{voice.caption}</p>
            </div>
          )}
          {voice.ttsSupported && !voice.hasVoice && (
            <p className="text-[11px] text-amber-700 dark:text-amber-400">
              {language === 'hi'
                ? 'इस फ़ोन में हिन्दी आवाज़ नहीं मिली — उत्तर कैप्शन में दिखेंगे। फ़ोन की सेटिंग में हिन्दी वॉइस डाउनलोड करें।'
                : language === 'kn'
                  ? 'ಈ ಫೋನ್‌ನಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಸಿಗಲಿಲ್ಲ — ಉತ್ತರ ಕ್ಯಾಪ್ಷನ್‌ನಲ್ಲಿ ತೋರುತ್ತದೆ. ಫೋನ್ ಸೆಟ್ಟಿಂಗ್‌ನಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.'
                  : 'No English-India voice found on this device — answers will still show as captions.'}
            </p>
          )}
          {voice.voiceError && <p className="text-[11px] text-amber-700 dark:text-amber-400">{voice.voiceError}</p>}

          {voice.ttsSupported && (
            <div className="rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] p-2.5 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-medium text-[#4A3F66] dark:text-[#C9BFEA]">
                  {language === 'hi' ? 'बोलने की आवाज़' : language === 'kn' ? 'ಮಾತಿನ ಧ್ವನಿ' : 'Spoken voice'}
                </span>
                <button
                  type="button"
                  aria-pressed={voice.voiceMode === 'natural'}
                  onClick={() => { voice.stop(); voice.setVoiceMode('natural'); }}
                  className={`min-h-[36px] rounded-lg border px-2.5 text-[11px] font-semibold cursor-pointer ${voice.voiceMode === 'natural' ? 'border-[#6D28D9] bg-[#EFE7FF] text-[#5B21B6] dark:bg-[#6D28D9]/20 dark:text-[#C4B5FD]' : 'border-[#D8D0BB] dark:border-[#35516B]'}`}
                >
                  {language === 'hi' ? 'प्राकृतिक आवाज़' : language === 'kn' ? 'ಸಹಜ ಧ್ವನಿ' : 'Natural voice'}
                </button>
                <button
                  type="button"
                  aria-pressed={voice.voiceMode === 'device'}
                  onClick={() => { voice.stop(); voice.setVoiceMode('device'); }}
                  className={`min-h-[36px] rounded-lg border px-2.5 text-[11px] font-semibold cursor-pointer ${voice.voiceMode === 'device' ? 'border-[#6D28D9] bg-[#EFE7FF] text-[#5B21B6] dark:bg-[#6D28D9]/20 dark:text-[#C4B5FD]' : 'border-[#D8D0BB] dark:border-[#35516B]'}`}
                >
                  {language === 'hi' ? 'डिवाइस आवाज़' : language === 'kn' ? 'ಸಾಧನದ ಧ್ವನಿ' : 'Device voice'}
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex min-w-0 flex-1 items-center gap-2 text-[11px] font-medium text-[#4A3F66] dark:text-[#C9BFEA]">
                  <span className="shrink-0">{language === 'hi' ? 'आवाज़' : language === 'kn' ? 'ಧ್ವನಿ' : 'Voice'}</span>
                  <select
                    aria-label={language === 'hi' ? 'उत्तर की आवाज़ चुनें' : language === 'kn' ? 'ಉತ್ತರದ ಧ್ವನಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ' : 'Choose answer voice'}
                    value={voice.voiceMode === 'natural' ? voice.naturalVoiceName : voice.selectedVoiceURI}
                    onChange={(event) => {
                      voice.stop();
                      if (voice.voiceMode === 'natural') voice.setNaturalVoiceName(event.target.value);
                      else voice.setPreferredVoice(event.target.value);
                    }}
                    className="min-h-[36px] min-w-0 flex-1 rounded-lg border border-[#D8D0BB] dark:border-[#35516B] bg-white dark:bg-[#1F1545] px-2 py-1 text-[11px] text-[#2E1A6E] dark:text-[#F5F0FF]"
                  >
                    {voice.voiceMode === 'natural' ? (
                      voice.naturalVoices.length > 0
                        ? voice.naturalVoices.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)
                        : <option value="">{language === 'hi' ? 'फ़ोन की आवाज़ (प्राकृतिक उपलब्ध नहीं)' : language === 'kn' ? 'ಫೋನ್ ಧ್ವನಿ (ಸಹಜ ಲಭ್ಯವಿಲ್ಲ)' : 'Phone voice (natural not available)'}</option>
                    ) : (
                      <>
                        <option value="">Best available voice</option>
                        {voice.availableVoices.map((option) => (
                          <option key={option.voiceURI} value={option.voiceURI}>
                            {option.name} · {option.lang}{option.localService ? ' · on device' : ''}
                          </option>
                        ))}
                      </>
                    )}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => voice.speak(
                    language === 'hi'
                      ? 'नमस्ते! मैं आपका विज्ञान साथी हूँ। आज आप क्या सीखना चाहेंगे?'
                      : language === 'kn'
                        ? 'ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ವಿಜ್ಞಾನ ಗೆಳೆಯ. ಇಂದು ನೀವು ಏನು ಕಲಿಯಲು ಬಯಸುತ್ತೀರಿ?'
                        : 'Hello! I’m your science learning companion. What would you like to explore today?'
                  )}
                  aria-label={language === 'hi' ? 'आवाज़ का नमूना सुनें' : language === 'kn' ? 'ಧ್ವನಿ ಮಾದರಿಯನ್ನು ಕೇಳಿ' : 'Preview selected voice'}
                  className="min-h-[36px] shrink-0 rounded-lg border border-[#D8D0BB] dark:border-[#35516B] px-2 text-[11px] text-[#2E1A6E] dark:text-[#F5F0FF] hover:bg-[#F5F0FF] dark:hover:bg-[#2A1D5C] cursor-pointer"
                >
                  {language === 'hi' ? 'सुनें' : language === 'kn' ? 'ಕೇಳಿ' : 'Preview'}
                </button>
              </div>
              {voice.voiceMode === 'natural' && (
                <p className="text-[10px] leading-relaxed text-[#53636A] dark:text-[#C9BFEA]">
                  {voice.naturalNeedsSetup
                    ? 'The natural English voice is not switched on yet: the Groq account owner must accept the Orpheus model terms once in the Groq console. Using the phone voice until then.'
                    : voice.naturalEngine === 'groq'
                      ? 'AI voice (Groq Orpheus), spoken sentence by sentence. Needs internet; the phone voice is used when offline.'
                      : voice.naturalEngine === 'gemini'
                        ? (language === 'hi' ? 'AI आवाज़ (Gemini)। इंटरनेट चाहिए; ऑफ़लाइन होने पर फ़ोन की आवाज़ चलेगी।' : language === 'kn' ? 'AI ಧ್ವನಿ (Gemini). ಇಂಟರ್ನೆಟ್ ಬೇಕು; ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ಫೋನ್ ಧ್ವನಿ.' : 'AI voice (Gemini). Needs internet; the phone voice is used when offline.')
                        : (language === 'hi' ? 'इस भाषा के लिए AI आवाज़ सेट नहीं है, इसलिए फ़ोन की सबसे अच्छी आवाज़ उपयोग होगी।' : language === 'kn' ? 'ಈ ಭಾಷೆಗೆ AI ಧ್ವನಿ ಸಿದ್ಧವಿಲ್ಲ, ಆದ್ದರಿಂದ ಫೋನ್‌ನ ಉತ್ತಮ ಧ್ವನಿ ಬಳಸಲಾಗುತ್ತದೆ.' : 'AI voice is not set up for this language, so the best phone voice is used.')}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleAutoSpeak}
              aria-pressed={autoSpeak}
              className={`min-h-[40px] inline-flex items-center gap-1.5 rounded-lg border px-3 text-[11px] font-semibold cursor-pointer ${
                autoSpeak
                  ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#6D28D9]/20 text-[#5B21B6] dark:text-[#C4B5FD]'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#4A3F66] dark:text-[#C9BFEA]'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              {language === 'hi' ? 'उत्तर बोलकर सुनाएँ' : language === 'kn' ? 'ಉತ್ತರ ಮಾತಿನಲ್ಲಿ' : 'Spoken answers'}: {autoSpeak ? 'ON' : 'OFF'}
            </button>
            {experimentContext && (
              <button
                type="button"
                disabled={loading}
                onClick={() =>
                  void sendMessage(
                    language === 'hi'
                      ? 'मेरे सिमुलेशन में जो मान दिख रहे हैं उनके आधार पर समझाइए कि अभी क्या हो रहा है और क्यों।'
                      : language === 'kn'
                        ? 'ನನ್ನ ಸಿಮ್ಯುಲೇಶನ್‌ನಲ್ಲಿ ತೋರುವ ಮೌಲ್ಯಗಳ ಆಧಾರದ ಮೇಲೆ ಈಗ ಏನು ನಡೆಯುತ್ತಿದೆ ಮತ್ತು ಏಕೆ ಎಂದು ವಿವರಿಸಿ.'
                        : 'Using the exact values shown in my simulation, explain what is happening now and why.'
                  )
                }
                className="min-h-[40px] inline-flex items-center gap-1.5 rounded-lg bg-[#2E1A6E] px-3 text-[11px] font-semibold text-white disabled:opacity-50 cursor-pointer"
              >
                {language === 'hi' ? 'मेरा सिमुलेशन समझाएँ' : language === 'kn' ? 'ನನ್ನ ಸಿಮ್ಯುಲೇಶನ್ ವಿವರಿಸಿ' : 'Explain my simulation'}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                const next = !(useSearch || tier === 'search');
                setUseSearch(next);
                if (!next && tier === 'search') setTier('fast');
              }}
              aria-pressed={useSearch || tier === 'search'}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                useSearch || tier === 'search'
                  ? 'border-[#6D28D9] bg-[#EFE7FF] dark:bg-[#6D28D9]/20 text-[#5B21B6] dark:text-[#C4B5FD]'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#4A3F66] dark:text-[#C9BFEA] hover:border-[#6D28D9]'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>
                {useSearch || tier === 'search'
                  ? 'Google Search Grounding: ON'
                  : 'Enable Google Search Grounding'}
              </span>
            </button>

            {isTranscribing && (
              <span className="text-[11px] text-[#5B21B6] dark:text-[#C4B5FD]">Transcribing audio...</span>
            )}
          </div>

          {transcribeError && <p className="text-[11px] text-amber-600">{transcribeError}</p>}

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isTranscribing}
              onClick={() => {
                if (voice.sttSupported) {
                  if (voice.listening) {
                    voice.stopListening();
                    return;
                  }
                  voice.listen(
                    (txt) => setInput(txt),
                    (txt) => {
                      setInput('');
                      void sendMessage(txt);
                    }
                  );
                  return;
                }
                if (isRecording) stopRecording();
                else void startRecording((txt) => setInput((prev) => (prev ? `${prev} ${txt}` : txt)));
              }}
              aria-label={voice.listening || isRecording ? 'Stop listening' : 'Ask by voice'}
              title={voice.listening || isRecording ? 'Stop listening' : 'Ask by voice'}
              className={`min-h-[44px] min-w-[44px] rounded-lg border p-2.5 cursor-pointer ${
                voice.listening || isRecording
                  ? 'border-red-500 bg-red-500/15 text-red-500'
                  : 'border-[#E7DDFB] dark:border-[#3B2C78] text-[#4A3F66] dark:text-[#C9BFEA] hover:bg-[#F5F0FF] dark:hover:bg-[#2A1D5C]'
              }`}
            >
              {voice.listening || isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your Physics or STEM question..."
              className="flex-1 rounded-lg border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 text-xs text-[#2E1A6E] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send question"
              className="rounded-lg bg-[#6D28D9] p-2.5 text-white hover:bg-[#5B21B6] disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
