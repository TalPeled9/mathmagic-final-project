import { Router } from 'express';
import configRouter from './config';

const router = Router();

router.use('/', configRouter);
// Future: router.use('/auth', authRouter);
// Future: router.use('/parent', parentRouter);
// Future: router.use('/children', childrenRouter);
// Future: router.use('/adventures', adventuresRouter);

export default router;
