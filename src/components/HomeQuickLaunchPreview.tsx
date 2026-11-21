import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Atom,
  Magnet,
  Minus,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { UI_TEXT } from '../data/i18n';
import { useSpeech } from '../hooks/useSpeech';
import type { Language } from '../types/stem';

interface HomeQuickLaunchPreviewProps {
  language: Language;
  lowPowerMode: boolean;
  onStartFullMission: () => void;
}

type DemoMode = 'electromagnet' | 'prism' | 'atom';

const MODE_LABELS: Record<DemoMode, Record<Language, string>> = {
  electromagnet: {
    en: 'Electromagnet',
    hi: 'विद्युतचुंबक',
    kn: 'ವಿದ್ಯುತ್ಕಾಂತ',
  },
  prism: {
    en: 'Prism',
    hi: 'प्रिज्म',
    kn: 'ಪ್ರಿಸ್ಮ್',
  },
  atom: {
    en: 'Atom',
    hi: 'परमाणु',
    kn: 'ಪರಮಾಣು',
  },
};

const MODE_PROMPTS: Record<DemoMode, Record<Language, string>> = {
  electromagnet: {
    en: 'How many iron pins can your coil lift?',
    hi: 'आपकी कुंडली कितनी लोहे की पिन उठा सकती है?',
    kn: 'ನಿಮ್ಮ ಕಾಯಿಲ್ ಎಷ್ಟು ಕಬ್ಬಿಣದ ಪಿನ್‌ಗಳನ್ನು ಎತ್ತಬಲ್ಲದು?',
  },
  prism: {
    en: 'How does a glass prism split white light?',
    hi: 'काँच का प्रिज्म सफेद प्रकाश को कैसे विभाजित करता है?',
    kn: 'ಗಾಜಿನ ಪ್ರಿಸ್ಮ್ ಬಿಳಿ ಬೆಳಕನ್ನು ಹೇಗೆ ವಿಭಜಿಸುತ್ತದೆ?',
  },
  atom: {
    en: 'What happens when an electron jumps orbits?',
    hi: 'जब इलेक्ट्रॉन कक्षा बदलता है तो क्या होता है?',
    kn: 'ಎಲೆಕ್ಟ್ರಾನ್ ಕಕ್ಷೆ ಜಿಗಿದಾಗ ಏನಾಗುತ್ತದೆ?',
  },
};

export const HomeQuickLaunchPreview: React.FC<HomeQuickLaunchPreviewProps> = ({
  language,
  lowPowerMode,
  onStartFullMission,
}) => {
  const t = UI_TEXT[language];
  const { isSpeaking, speak, stopSpeaking } = useSpeech(language);

  const [mode, setMode] = useState<DemoMode>('electromagnet');

  // Electromagnet state (coil turns 10..60)
  const [coilTurns, setCoilTurns] = useState(30);
  // Prism state (incidence angle 20..60 deg)
  const [prismAngle, setPrismAngle] = useState(36);
  // Atom state (upper orbit n = 2..4)
  const [atomLevel, setAtomLevel] = useState(3);

  const [triedCount, setTriedCount] = useState(0);
  const [animPhase, setAnimPhase] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [spokenCaption, setSpokenCaption] = useState<string | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const triggerTry = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setTriedCount((c) => c + 1);

    if (lowPowerMode) {
      setAnimPhase(1);
      setIsAnimating(false);
      return;
    }

    setIsAnimating(true);
    setAnimPhase(0);
    const start = performance.now();
    const durationMs = 700;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setAnimPhase(p);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setIsAnimating(false);
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const handleModeSwitch = (next: DemoMode) => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setMode(next);
    setTriedCount(0);
    setAnimPhase(0);
    setIsAnimating(false);
    setSpokenCaption(null);
  };

  const handleReset = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setTriedCount(0);
    setAnimPhase(0);
    setIsAnimating(false);
    setSpokenCaption(null);
  };

  // Derived demo values
  const pinsLifted = useMemo(() => Math.min(5, Math.max(1, Math.round(coilTurns / 12))), [coilTurns]);
  const prismSpreadDeg = useMemo(() => (prismAngle * 0.28).toFixed(1), [prismAngle]);
  const atomDeltaEv = useMemo(() => (13.6 * (1 - 1 / (atomLevel * atomLevel))).toFixed(2), [atomLevel]);

  const explanationText = useMemo(() => {
    if (triedCount === 0) {
      if (language === 'hi') {
        return mode === 'electromagnet'
          ? 'फेरे (N) बदलें और "आज़माएँ" दबाएँ — देखें कि चुंबक कितनी पिन उठाता है!'
          : mode === 'prism'
            ? 'आपतन कोण बदलें और "आज़माएँ" दबाएँ — देखें कि प्रिज्म इंद्रधनुष कैसे बनाता है!'
            : 'कक्षा स्तर (n) बदलें और "आज़माएँ" दबाएँ — देखें कि फोटॉन कैसे निकलता है!';
      }
      if (language === 'kn') {
        return mode === 'electromagnet'
          ? 'ಕಾಯಿಲ್ ಸುತ್ತುಗಳನ್ನು ಬದಲಿಸಿ "ಪ್ರಯತ್ನಿಸಿ" ಒತ್ತಿ — ಎಷ್ಟು ಪಿನ್‌ಗಳು ಆಕರ್ಷಿತವಾಗುತ್ತವೆ ನೋಡಿ!'
          : mode === 'prism'
            ? 'ಕೋನವನ್ನು ಬದಲಿಸಿ "ಪ್ರಯತ್ನಿಸಿ" ಒತ್ತಿ — ಪ್ರಿಸ್ಮ್ ಕಾಮನಬಿಲ್ಲು ಹೇಗೆ ಮಾಡುತ್ತದೆ ನೋಡಿ!'
            : 'ಕಕ್ಷೆ ಮಟ್ಟ (n) ಬದಲಿಸಿ "ಪ್ರಯತ್ನಿಸಿ" ಒತ್ತಿ — ಫೋಟಾನ್ ಹೊರಸೂಸುವಿಕೆಯನ್ನು ನೋಡಿ!';
      }
      return mode === 'electromagnet'
        ? 'Adjust coil turns and tap Try to see how electrical loops turn iron into a magnet.'
        : mode === 'prism'
          ? 'Adjust the light angle and tap Try to see why glass bends violet light more than red.'
          : 'Pick an outer electron orbit and tap Try to watch a photon appear when it jumps down.';
    }

    if (language === 'hi') {
      if (mode === 'electromagnet') {
        return `${coilTurns} तांबे के फेरों ने चुंबकीय क्षेत्र मजबूत किया और ${pinsLifted} लोहे की पिनें ऊपर खिंच गईं।`;
      }
      if (mode === 'prism') {
        return `${prismAngle}° पर सफेद रोशनी काँच में मुड़कर ${prismSpreadDeg}° फैलाव वाले 6 रंगों में बंट गई।`;
      }
      return `इलेक्ट्रॉन कक्षा n=${atomLevel} से n=1 में कूदा और ${atomDeltaEv} eV ऊर्जा का फोटॉन निकला।`;
    }

    if (language === 'kn') {
      if (mode === 'electromagnet') {
        return `${coilTurns} ತಾಮ್ರದ ಸುತ್ತುಗಳು ಕಾಂತೀಯ ಕ್ಷೇತ್ರವನ್ನು ಹೆಚ್ಚಿಸಿ ${pinsLifted} ಕಬ್ಬಿಣದ ಪಿನ್‌ಗಳನ್ನು ಎತ್ತಿದವು.`;
      }
      if (mode === 'prism') {
        return `${prismAngle}° ಕೋನದಲ್ಲಿ ಬಿಳಿ ಬೆಳಕು ಗಾಜಿನಲ್ಲಿ ವಕ್ರೀಭವನಗೊಂಡು ${prismSpreadDeg}° ವಿಸ್ತಾರದ ಕಾಮನಬಿಲ್ಲು ನೀಡಿತು.`;
      }
      return `ಎಲೆಕ್ಟ್ರಾನ್ ಕಕ್ಷೆ n=${atomLevel} ನಿಂದ n=1 ಕ್ಕೆ ಜಿಗಿದು ${atomDeltaEv} eV ಶಕ್ತಿಯ ಫೋಟಾನ್ ಬಿಡುಗಡೆಯಾಯಿತು.`;
    }

    if (mode === 'electromagnet') {
      return `With ${coilTurns} copper coil turns carrying current, the iron core strengthened and lifted ${pinsLifted} iron pins!`;
    }
    if (mode === 'prism') {
      return `At ${prismAngle}° incidence, shorter violet wavelengths slowed more in glass, spreading the rainbow by ${prismSpreadDeg}°!`;
    }
    return `Dropping from orbit n = ${atomLevel} to n = 1 released a ${atomDeltaEv} eV photon wave packet!`;
  }, [triedCount, language, mode, coilTurns, pinsLifted, prismAngle, prismSpreadDeg, atomLevel, atomDeltaEv]);

  const tryButtonLabel =
    language === 'hi' ? 'आज़माएँ' : language === 'kn' ? 'ಪ್ರಯತ್ನಿಸಿ' : 'Try';

  const sliderConfig =
    mode === 'electromagnet'
      ? {
          label: language === 'hi' ? 'कुंडली फेरे (N)' : language === 'kn' ? 'ಕಾಯಿಲ್ ಸುತ್ತುಗಳು (N)' : 'Coil Turns (N)',
          valueText: `${coilTurns}`,
          min: 10,
          max: 60,
          step: 5,
          value: coilTurns,
          onChange: setCoilTurns,
        }
      : mode === 'prism'
        ? {
            label: language === 'hi' ? 'प्रकाश कोण' : language === 'kn' ? 'ಬೆಳಕಿನ ಕೋನ' : 'Light Angle',
            valueText: `${prismAngle}°`,
            min: 20,
            max: 60,
            step: 4,
            value: prismAngle,
            onChange: setPrismAngle,
          }
        : {
            label: language === 'hi' ? 'इलेक्ट्रॉन कक्षा (n)' : language === 'kn' ? 'ಎಲೆಕ್ಟ್ರಾನ್ ಕಕ್ಷೆ (n)' : 'Electron Orbit (n)',
            valueText: `n = ${atomLevel}`,
            min: 2,
            max: 4,
            step: 1,
            value: atomLevel,
            onChange: setAtomLevel,
          };

  const toggleReadAloud = () => {
    if (isSpeaking) {
      stopSpeaking();
      setSpokenCaption(null);
      return;
    }
    const textToSpeak = `${MODE_LABELS[mode][language]}. ${MODE_PROMPTS[mode][language]} ${explanationText}`;
    setSpokenCaption(textToSpeak);
    speak(textToSpeak);
  };

  const liftFactor = triedCount > 0 ? Math.min(1, animPhase || (lowPowerMode ? 1 : 0.95)) : 0;

  return (
    <div className="a11y-surface rounded-2xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-white dark:bg-[#1F1545] p-5 sm:p-6 shadow-sm space-y-4">
      {/* Header + Audio Button */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">
            2D Science Demo
          </p>
          <h2 className="text-base sm:text-lg font-semibold text-[#2E1A6E] dark:text-[#F3EFFF] mt-0.5">
            {MODE_PROMPTS[mode][language]}
          </h2>
        </div>

        <button
          type="button"
          onClick={toggleReadAloud}
          aria-label={isSpeaking ? t.stopReading : t.readAloud}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] px-3 py-2 min-h-[44px] text-xs font-semibold text-[#2E1A6E] dark:text-[#E4DDFA] hover:border-[#6D28D9] shrink-0 cursor-pointer"
        >
          {isSpeaking ? (
            <VolumeX className="w-4 h-4 text-[#F07C00] dark:text-[#FF9F1C]" aria-hidden="true" />
          ) : (
            <Volume2 className="w-4 h-4 text-[#6D28D9] dark:text-[#C4B5FD]" aria-hidden="true" />
          )}
          <span className="hidden sm:inline">{isSpeaking ? t.stopReading : t.readAloud}</span>
        </button>
      </div>

      {/* 3-Mode Demo Switcher: Electromagnet · Prism · Atom */}
      <div
        role="tablist"
        aria-label="Interactive physics demo modes"
        className="grid grid-cols-3 gap-1.5 rounded-xl bg-[#F5F0FF] dark:bg-[#2A1D5C] p-1 border border-[#E7DDFB] dark:border-[#3B2C78]"
      >
        {(
          [
            { id: 'electromagnet', icon: <Magnet className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> },
            { id: 'prism', icon: <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> },
            { id: 'atom', icon: <Atom className="w-3.5 h-3.5 shrink-0" aria-hidden="true" /> },
          ] as { id: DemoMode; icon: React.ReactNode }[]
        ).map((item) => {
          const active = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleModeSwitch(item.id)}
              className={`inline-flex items-center justify-center gap-1.5 py-2 px-2 min-h-[44px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                active
                  ? 'bg-[#6D28D9] text-white shadow-xs'
                  : 'text-[#2E1A6E] dark:text-[#E4DDFA] hover:text-[#5B21B6] dark:hover:text-white'
              }`}
            >
              {item.icon}
              <span className="truncate">{MODE_LABELS[item.id][language]}</span>
            </button>
          );
        })}
      </div>

      {spokenCaption && (
        <p className="rounded-xl border border-[#6D28D9]/35 bg-[#6D28D9]/10 px-3 py-2 text-xs text-[#2E1A6E] dark:text-[#F3EFFF]">
          <span className="font-semibold text-[#5B21B6] dark:text-[#C4B5FD]">{t.captionPrefix}: </span>
          {spokenCaption}
        </p>
      )}

      {/* Lightweight 2D SVG Stage */}
      <div className="rounded-xl border border-[#2E1A6E]/40 dark:border-[#3B2C78] bg-[#0D1B2A] p-2.5">
        {mode === 'electromagnet' && (
          <svg
            viewBox="0 0 360 170"
            role="img"
            aria-label={`Electromagnet with ${coilTurns} coil turns`}
            className="w-full h-40 sm:h-44 select-none"
          >
            {/* Magnetic flux loops */}
            {triedCount > 0 &&
              [1, 2, 3].map((ring) => (
                <ellipse
                  key={ring}
                  cx="185"
                  cy="64"
                  rx={68 + ring * 20}
                  ry={18 + ring * 11}
                  fill="none"
                  stroke="#2DD4BF"
                  strokeOpacity={(0.18 + coilTurns / 140) * liftFactor}
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              ))}

            {/* Battery */}
            <rect x="28" y="42" width="44" height="44" rx="6" fill="#132522" stroke="#F59E0B" strokeWidth="2" />
            <text x="50" y="68" textAnchor="middle" fill="#FCD34D" fontSize="11" fontWeight="700" fontFamily="monospace">
              6V
            </text>

            {/* Connecting wires */}
            <path d="M 72 52 L 118 52 M 72 76 L 118 76" stroke="#94A3B8" strokeWidth="2.5" />

            {/* Iron Core Nail */}
            <rect x="112" y="54" width="148" height="20" rx="5" fill="#475569" stroke="#94A3B8" strokeWidth="1.5" />
            <polygon points="260,57 278,64 260,71" fill="#64748B" />

            {/* Copper Coil Loops proportional to turns */}
            {Array.from({ length: Math.round(coilTurns / 4) }).map((_, i) => {
              const cx = 122 + i * (128 / Math.max(1, Math.round(coilTurns / 4)));
              return (
                <rect
                  key={i}
                  x={cx}
                  y="49"
                  width="5.5"
                  height="30"
                  rx="2.5"
                  fill={triedCount > 0 ? '#F59E0B' : '#B45309'}
                  stroke="#FDE68A"
                  strokeWidth="0.6"
                />
              );
            })}

            {/* Iron pins on table / lifted */}
            <line x1="90" y1="146" x2="290" y2="146" stroke="#334155" strokeWidth="2" />
            {[0, 1, 2, 3, 4].map((idx) => {
              const attracted = idx < pinsLifted && triedCount > 0;
              const px = 140 + idx * 24;
              const py = attracted ? 140 - liftFactor * 52 : 140;
              return (
                <g key={idx} transform={`translate(${px}, ${py})`}>
                  <line x1="-6" y1="0" x2="6" y2="0" stroke={attracted ? '#34D399' : '#94A3B8'} strokeWidth="3.5" strokeLinecap="round" />
                </g>
              );
            })}

            <text x="16" y="20" fill="#CBE0DA" fontSize="11" fontFamily="monospace">
              N = {coilTurns} turns · {triedCount > 0 ? `${pinsLifted} pins lifted` : 'Ready'}
            </text>
          </svg>
        )}

        {mode === 'prism' && (
          <svg
            viewBox="0 0 360 170"
            role="img"
            aria-label={`Optical prism refracting light at ${prismAngle} degrees`}
            className="w-full h-40 sm:h-44 select-none"
          >
            {/* Emitter */}
            <rect x="20" y="92" width="28" height="16" rx="4" fill="#1E293B" stroke="#2DD4BF" strokeWidth="1.5" />

            {/* Incident White Ray */}
            {(() => {
              const startY = 100 + (prismAngle - 36) * 0.65;
              const hitX = 148;
              const hitY = 86;
              const active = triedCount > 0;
              const spread = (prismAngle - 16) * 0.72;
              const spectrumColors = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#A855F7'];
              return (
                <>
                  <line
                    x1="48"
                    y1={startY}
                    x2={hitX}
                    y2={hitY}
                    stroke="#F8FAFC"
                    strokeWidth={active ? 3 : 2}
                    strokeOpacity={active ? 0.95 : 0.45}
                    strokeDasharray={active ? undefined : '4 4'}
                  />
                  {/* Internal refracted rays */}
                  {active &&
                    spectrumColors.map((col, idx) => {
                      const exitY = 74 + idx * 5.2 + (prismAngle - 36) * 0.14;
                      const endY = exitY + (idx - 2) * (4.5 + spread * 0.28) * liftFactor;
                      return (
                        <g key={col}>
                          <line
                            x1={hitX}
                            y1={hitY}
                            x2={204}
                            y2={exitY}
                            stroke={col}
                            strokeOpacity="0.7"
                            strokeWidth="2"
                          />
                          <line
                            x1={204}
                            y1={exitY}
                            x2={330}
                            y2={endY}
                            stroke={col}
                            strokeWidth="2.8"
                            strokeOpacity={liftFactor}
                          />
                        </g>
                      );
                    })}
                </>
              );
            })()}

            {/* Equilateral Glass Prism */}
            <polygon
              points="180,28 124,132 236,132"
              fill="#2DD4BF"
              fillOpacity="0.18"
              stroke="#5EEAD4"
              strokeWidth="2"
            />

            {/* Screen */}
            <line x1="332" y1="24" x2="332" y2="148" stroke="#64748B" strokeWidth="3" />

            <text x="16" y="20" fill="#CBE0DA" fontSize="11" fontFamily="monospace">
              θ = {prismAngle}° · Δ = {prismSpreadDeg}° spread
            </text>
          </svg>
        )}

        {mode === 'atom' && (
          <svg
            viewBox="0 0 360 170"
            role="img"
            aria-label={`Bohr atom electron transition from orbit ${atomLevel} to 1`}
            className="w-full h-40 sm:h-44 select-none"
          >
            {/* Concentric Orbit Rings */}
            {[1, 2, 3, 4].map((n) => {
              const r = 16 + n * 14;
              const isSelected = n === atomLevel;
              return (
                <circle
                  key={n}
                  cx="160"
                  cy="88"
                  r={r}
                  fill="none"
                  stroke={isSelected ? '#2DD4BF' : '#334155'}
                  strokeWidth={isSelected ? 2 : 1.2}
                  strokeDasharray={n === 1 ? undefined : '3 3'}
                />
              );
            })}

            {/* Nucleus */}
            <circle cx="160" cy="88" r="8" fill="#F59E0B" />
            <circle cx="157" cy="85" r="3" fill="#FEF3C7" />

            {/* Electron Transitioning */}
            {(() => {
              const rStart = 16 + atomLevel * 14;
              const rEnd = 30;
              const rCur = triedCount > 0 ? rStart - (rStart - rEnd) * liftFactor : rStart;
              const angle = -Math.PI / 5 + liftFactor * Math.PI * 0.45;
              const ex = 160 + rCur * Math.cos(angle);
              const ey = 88 + rCur * Math.sin(angle);
              const photonColors: Record<number, string> = { 2: '#EC4899', 3: '#2DD4BF', 4: '#A855F7' };
              const pCol = photonColors[atomLevel] ?? '#2DD4BF';
              return (
                <>
                  <circle cx={ex} cy={ey} r="5.5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
                  {triedCount > 0 && (
                    <g transform={`translate(${225 + liftFactor * 70}, 62)`}>
                      <path
                        d="M 0 0 Q 8 -10 16 0 T 32 0 T 48 0"
                        fill="none"
                        stroke={pCol}
                        strokeWidth="2.8"
                      />
                      <polygon points="48,-4 56,0 48,4" fill={pCol} />
                      <text x="16" y="-12" fill={pCol} fontSize="10" fontWeight="700" fontFamily="monospace">
                        {atomDeltaEv} eV
                      </text>
                    </g>
                  )}
                </>
              );
            })()}

            <text x="16" y="20" fill="#CBE0DA" fontSize="11" fontFamily="monospace">
              n = {atomLevel} → n = 1 · ΔE = {atomDeltaEv} eV
            </text>
          </svg>
        )}
      </div>

      {/* Touch-Friendly Parameter Control + Try Action */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 text-xs">
          <label htmlFor="home-demo-slider" className="font-semibold text-[#2E1A6E] dark:text-[#E4DDFA]">
            {sliderConfig.label}
          </label>
          <span className="font-mono font-semibold text-[#5B21B6] dark:text-[#C4B5FD] tabular-nums">
            {sliderConfig.valueText}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => sliderConfig.onChange(Math.max(sliderConfig.min, sliderConfig.value - sliderConfig.step))}
            aria-label={`Decrease ${sliderConfig.label}`}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer shrink-0"
          >
            <Minus className="w-4 h-4" aria-hidden="true" />
          </button>

          <input
            id="home-demo-slider"
            type="range"
            min={sliderConfig.min}
            max={sliderConfig.max}
            step={sliderConfig.step}
            value={sliderConfig.value}
            onChange={(e) => sliderConfig.onChange(Number(e.target.value))}
            className="w-full accent-[#6D28D9] h-3 cursor-pointer"
          />

          <button
            type="button"
            onClick={() => sliderConfig.onChange(Math.min(sliderConfig.max, sliderConfig.value + sliderConfig.step))}
            aria-label={`Increase ${sliderConfig.label}`}
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#F3EFFF] hover:border-[#6D28D9] cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isAnimating}
            onClick={triggerTry}
            className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] px-4 py-2.5 text-sm font-semibold text-white transition-colors cursor-pointer disabled:opacity-75"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            <span>{tryButtonLabel}</span>
          </button>

          {triedCount > 0 && (
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset preview"
              className="min-h-[48px] min-w-[48px] inline-flex items-center justify-center rounded-xl border border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#2E1A6E] dark:text-[#E4DDFA] hover:border-[#6D28D9] cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Kind Explanation + Full Workbench Shortcut */}
      <div
        className={`rounded-xl border p-3.5 text-xs leading-relaxed ${
          triedCount > 0
            ? 'border-[#6D28D9]/45 bg-[#6D28D9]/10 text-[#2E1A6E] dark:text-[#9BECE4]'
            : 'border-[#E7DDFB] dark:border-[#3B2C78] bg-[#F5F0FF] dark:bg-[#2A1D5C] text-[#22163F] dark:text-[#C9BFEA]'
        }`}
      >
        <p>{explanationText}</p>
        <button
          type="button"
          onClick={onStartFullMission}
          className="inline-flex items-center gap-1 pt-2 font-semibold text-[#5B21B6] dark:text-[#C4B5FD] hover:underline cursor-pointer"
        >
          <span>{t.startMissionCta}</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
