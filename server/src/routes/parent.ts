import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as parentController from '../controllers/parentController';

const router = Router();

router.get('/profile', requireAuth, parentController.getProfile);

export default router;
