import { config } from '../config/index';

const ELEVENLABS_BASE_URL = 'https://api.elevenlabs.io/v1';

export const ALLOWED_VOICE_IDS = new Set([
  'UQ15q3Vf9AQQ2owcMKQ0', // David (default)
  'O4NKp88bb2JkAnrCbwQt', // Lauren
]);

export const DEFAULT_VOICE_ID = 'UQ15q3Vf9AQQ2owcMKQ0';

// Cached voice_id for free-tier path — fetched once from the account's available voices
let _freeVoiceId: string | null = null;

async function resolveFreeVoiceId(): Promise<string> {
  if (_freeVoiceId) return _freeVoiceId;

  const res = await fetch(`${ELEVENLABS_BASE_URL}/voices`, {
    headers: { 'xi-api-key': config.elevenlabs.apiKey },
  });
  if (!res.ok) throw new Error(`ElevenLabs voices fetch failed (${res.status})`);

  const data = await res.json() as { voices?: Array<{ voice_id: string; name: string }> };
  const first = data.voices?.[0];
  if (!first) throw new Error('No voices found in ElevenLabs account');

  _freeVoiceId = first.voice_id;
  return _freeVoiceId;
}

// voiceId is undefined on the free path — the account's first available voice is used instead.
export async function synthesizeSpeech(text: string, voiceId?: string): Promise<Buffer> {
  const resolvedId = voiceId ?? await resolveFreeVoiceId();

  const response = await fetch(`${ELEVENLABS_BASE_URL}/text-to-speech/${resolvedId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': config.elevenlabs.apiKey,
      'Content-Type': 'application/json',
      Accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2_5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`ElevenLabs TTS failed (${response.status}): ${body}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
