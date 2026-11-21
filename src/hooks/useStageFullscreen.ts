import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fullscreen for a simulation "stage" element.
 * Uses the browser Fullscreen API when available; otherwise (e.g. iPhone Safari) falls back to an
 * in-page fixed overlay ('css'). Esc leaves either mode. Exits fullscreen on unmount.
 */
export function useStageFullscreen<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const [mode, setMode] = useState<'off' | 'native' | 'css'>('off');

  useEffect(() => {
    const onChange = () => {
      if (document.fullscreenElement && document.fullscreenElement === ref.current) setMode('native');
      else setMode((prev) => (prev === 'native' ? 'off' : prev));
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMode((prev) => (prev === 'css' ? 'off' : prev));
    };
    document.addEventListener('fullscreenchange', onChange);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      window.removeEventListener('keydown', onKey);
      if (document.fullscreenElement && document.fullscreenElement === ref.current) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    };
  }, []);

  // stop the page behind the in-page overlay from scrolling
  useEffect(() => {
    if (mode !== 'css') return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mode]);

  const toggle = useCallback(async () => {
    if (mode === 'native') {
      await document.exitFullscreen?.().catch(() => undefined);
      return;
    }
    if (mode === 'css') {
      setMode('off');
      return;
    }
    const el = ref.current;
    if (el?.requestFullscreen) {
      try {
        await el.requestFullscreen();
        setMode('native');
        return;
      } catch {
        // fall through to the in-page overlay
      }
    }
    setMode('css');
  }, [mode]);

  const stageClass =
    mode === 'css'
      ? 'fixed inset-0 z-[60] p-2 sm:p-3 bg-[#FFF9F2] dark:bg-[#0B1826] overflow-auto'
      : mode === 'native'
        ? 'p-2 sm:p-3 bg-[#FFF9F2] dark:bg-[#0B1826] overflow-auto'
        : '';

  return { ref, mode, isFullscreen: mode !== 'off', toggle, stageClass };
}
