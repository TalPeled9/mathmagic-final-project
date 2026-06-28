import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import parentRouter from './parent';
import adventuresRouter from './adventures';
import ttsRouter from './tts';

const router = Router();

router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/parent', parentRouter);
router.use('/adventures', adventuresRouter);
router.use('/tts', ttsRouter);

export default router;
