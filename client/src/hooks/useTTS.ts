import { useState, useRef, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';

export const DEFAULT_TTS_VOICE_ID = 'UQ15q3Vf9AQQ2owcMKQ0';

interface TTSResponse {
  audioBase64: string;
  contentType: string;
}

export function useTTS(voiceId: string = DEFAULT_TTS_VOICE_ID) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const epochRef = useRef(0);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  // text+voiceId → decoded AudioBuffer (replay is instant, no re-decoding)
  const audioCacheRef = useRef<Map<string, AudioBuffer>>(new Map());

  useEffect(() => {
    return () => {
      try { sourceRef.current?.stop(); } catch { /* already stopped */ }
      audioCtxRef.current?.close();
    };
  }, []);

  function getCtx(): AudioContext {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }

  const stopCurrent = useCallback(() => {
    epochRef.current++;
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    sourceRef.current = null;
    setIsSpeaking(false);
  }, []);

  const speakOne = useCallback(
    async (text: string, epoch: number): Promise<void> => {
      if (!text.trim() || epochRef.current !== epoch) return;

      const cacheKey = `${voiceId}:${text}`;
      let audioBuffer = audioCacheRef.current.get(cacheKey);

      if (!audioBuffer) {
        try {
          const data = await api.post<TTSResponse>('/tts', { text, voiceId });
          if (epochRef.current !== epoch) return;

          // Decode the full audio before playing — eliminates start clipping
          const bytes = Uint8Array.from(atob(data.audioBase64), (c) => c.charCodeAt(0));
          const ctx = getCtx();
          if (ctx.state === 'suspended') await ctx.resume();
          audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));
          audioCacheRef.current.set(cacheKey, audioBuffer);
        } catch {
          return;
        }
      }

      if (epochRef.current !== epoch) return;

      const ctx = getCtx();
      if (ctx.state === 'suspended') await ctx.resume();

      await new Promise<void>((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer!;
        source.connect(ctx.destination);
        sourceRef.current = source;
        setIsSpeaking(true);
        // onended fires both on natural completion and after stop()
        source.onended = () => { setIsSpeaking(false); resolve(); };
        source.start(0);
      });
    },
    [voiceId]
  );

  const speakQueue = useCallback(
    async (texts: string[]): Promise<void> => {
      if (isMuted) return;
      stopCurrent();
      const myEpoch = epochRef.current;
      for (const text of texts) {
        if (epochRef.current !== myEpoch) break;
        await speakOne(text, myEpoch);
      }
    },
    [isMuted, speakOne, stopCurrent]
  );

  const stopAndSpeak = useCallback(
    (text: string): void => {
      if (isMuted) return;
      stopCurrent();
      const myEpoch = epochRef.current;
      speakOne(text, myEpoch).catch(() => {});
    },
    [isMuted, speakOne, stopCurrent]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      if (!prev) stopCurrent();
      return !prev;
    });
  }, [stopCurrent]);

  return { speakQueue, stopAndSpeak, toggleMute, isSpeaking, isMuted };
}
