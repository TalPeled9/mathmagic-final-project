import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { BADGE_DEFINITIONS } from '../config/badges';

const router = Router();

/** Static badge catalogue — used by the client to render locked badges. */
router.get('/', requireAuth, (_req: Request, res: Response): void => {
  res.json({ badges: BADGE_DEFINITIONS });
});

export default router;
