import { Router } from 'express';
import express from 'express';
import path from 'path';
import healthRouter from './health';
import authRouter from './auth';
import parentRouter from './parent';
import adventuresRouter from './adventures';
import ttsRouter from './tts';
import emailPreferencesRouter from './emailPreferences';

const router = Router();

router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/parent', parentRouter);
router.use('/adventures', adventuresRouter);
router.use('/tts', ttsRouter);
router.use('/email-preferences', emailPreferencesRouter);
router.use('/assets', express.static(path.join(__dirname, '../assets')));

export default router;
