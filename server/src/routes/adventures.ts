import { Router } from 'express';
import { aiRateLimit } from '../middleware/rateLimit';

const router = Router();

// Apply AI rate limits to all adventure endpoints.
router.use(aiRateLimit);

export default router;
