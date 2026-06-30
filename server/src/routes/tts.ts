import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { synthesizeSpeech, ALLOWED_VOICE_IDS, DEFAULT_VOICE_ID } from '../services/ttsService';
import { ApiError } from '../utils/ApiError';
import { config } from '../config/index';

const router = Router();

router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { text, voiceId } = req.body as { text?: unknown; voiceId?: unknown };

  if (typeof text !== 'string' || text.trim().length === 0) {
    throw ApiError.badRequest('text must be a non-empty string');
  }
  if (text.length > 5000) {
    throw ApiError.badRequest('text exceeds maximum length of 5000 characters');
  }

  // Paid: use the child's selected voice. Free: pass undefined so ttsService
  // auto-detects the first voice available in the ElevenLabs account.
  const resolvedVoiceId = config.elevenlabs.paid
    ? (typeof voiceId === 'string' && ALLOWED_VOICE_IDS.has(voiceId) ? voiceId : DEFAULT_VOICE_ID)
    : undefined;

  const audioBuffer = await synthesizeSpeech(text.trim(), resolvedVoiceId);
  const audioBase64 = audioBuffer.toString('base64');

  res.json({ audioBase64, contentType: 'audio/mpeg' });
});

export default router;
