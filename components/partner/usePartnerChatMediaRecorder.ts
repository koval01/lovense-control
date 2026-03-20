'use client';

import { useCallback, useRef, useState } from 'react';

const VOICE_MAX_DURATION_MS = 59_000;

export function usePartnerChatMediaRecorder(
  sendChatVoice: (blob: Blob, mime: string, durationMs?: number) => Promise<void> | void
) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);

  const handleStartRecording = useCallback(async () => {
    if (isRecording) return;
    if (typeof window === 'undefined') return;
    if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) recordingChunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        setIsRecording(false);
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        const chunks = recordingChunksRef.current;
        recordingChunksRef.current = [];
        const mime = recorder.mimeType || 'audio/webm';
        const blob = new Blob(chunks, { type: mime });
        const startedAt = recordingStartRef.current;
        recordingStartRef.current = null;
        const durationMs = startedAt != null ? Date.now() - startedAt : undefined;
        if (micStreamRef.current) {
          micStreamRef.current.getTracks().forEach((track) => track.stop());
          micStreamRef.current = null;
        }
        if (blob.size > 0) await sendChatVoice(blob, mime, durationMs);
      };
      recordingStartRef.current = Date.now();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      recorder.start();
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      }, VOICE_MAX_DURATION_MS + 500);
    } catch {
      /* mic denied / unsupported */
    }
  }, [isRecording, sendChatVoice]);

  const handleStopRecording = useCallback(() => {
    if (!isRecording) return;
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;
    if (recorder.state === 'recording') recorder.stop();
  }, [isRecording]);

  return { isRecording, handleStartRecording, handleStopRecording };
}
