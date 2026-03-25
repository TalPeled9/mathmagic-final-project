import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import parentRouter from './parent';

const router = Router();

router.use('/', healthRouter);
router.use('/auth', authRouter);
router.use('/parent', parentRouter);

export default router;
