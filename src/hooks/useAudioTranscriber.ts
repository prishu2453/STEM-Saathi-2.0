import { apiUrl } from '../lib/apiBase';
import { useCallback, useRef, useState } from 'react';
import type { Language } from '../types/stem';

interface UseAudioTranscriberReturn {
  isRecording: boolean;
  isTranscribing: boolean;
  transcribeError: string | null;
  startRecording: (onTranscript: (text: string) => void) => Promise<void>;
  stopRecording: () => void;
  transcribeAudioFile: (file: File, onTranscript: (text: string) => void) => Promise<void>;
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Failed to read audio buffer.'));
        return;
      }
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Unable to read recorded audio.'));
    reader.readAsDataURL(blob);
  });
}

export function useAudioTranscriber(language: Language): UseAudioTranscriberReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const sendToTranscribeApi = useCallback(
    async (base64: string, mimeType: string, onTranscript: (text: string) => void) => {
      setIsTranscribing(true);
      setTranscribeError(null);
      try {
        const res = await fetch(apiUrl('/api/audio/transcribe'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: mimeType || 'audio/webm',
            language,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Audio transcription failed.');
        }
        if (typeof data.transcript === 'string' && data.transcript.trim()) {
          onTranscript(data.transcript.trim());
        }
      } catch (err) {
        setTranscribeError(
          err instanceof Error ? err.message : 'Unable to transcribe audio recording.'
        );
      } finally {
        setIsTranscribing(false);
      }
    },
    [language]
  );

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(
    async (onTranscript: (text: string) => void) => {
      setTranscribeError(null);
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
        setTranscribeError('Microphone recording is not supported in this browser.');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        chunksRef.current = [];

        const preferredMime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : '';

        const recorder = preferredMime
          ? new MediaRecorder(stream, { mimeType: preferredMime })
          : new MediaRecorder(stream);

        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) {
            chunksRef.current.push(ev.data);
          }
        };

        recorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
          setIsRecording(false);

          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || 'audio/webm',
          });
          if (blob.size < 256) {
            setTranscribeError('Recording was too short. Hold and speak for at least 1 second.');
            return;
          }
          try {
            const base64 = await blobToBase64(blob);
            await sendToTranscribeApi(
              base64,
              (recorder.mimeType || 'audio/webm').split(';')[0],
              onTranscript
            );
          } catch (err) {
            setTranscribeError(
              err instanceof Error ? err.message : 'Unable to process audio recording.'
            );
          }
        };

        recorder.start();
        setIsRecording(true);
      } catch {
        setTranscribeError('Microphone permission denied or unavailable.');
        setIsRecording(false);
      }
    },
    [sendToTranscribeApi]
  );

  const transcribeAudioFile = useCallback(
    async (file: File, onTranscript: (text: string) => void) => {
      setTranscribeError(null);
      try {
        const base64 = await blobToBase64(file);
        await sendToTranscribeApi(base64, file.type || 'audio/mp3', onTranscript);
      } catch (err) {
        setTranscribeError(
          err instanceof Error ? err.message : 'Unable to transcribe uploaded audio file.'
        );
      }
    },
    [sendToTranscribeApi]
  );

  return {
    isRecording,
    isTranscribing,
    transcribeError,
    startRecording,
    stopRecording,
    transcribeAudioFile,
  };
}
