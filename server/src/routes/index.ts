import { Router } from 'express';
import healthRouter from './health';

const router = Router();

router.use('/', healthRouter);
// Future: router.use('/auth', authRouter);
// Future: router.use('/parent', parentRouter);
// Future: router.use('/children', childrenRouter);
// Future: router.use('/adventures', adventuresRouter);

export default router;
