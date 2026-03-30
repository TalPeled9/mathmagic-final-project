import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { aiRateLimit } from '../middleware/rateLimit';
import { validate } from '../middleware/validateRequest';
import {
  startAdventureSchema,
  continueAdventureSchema,
  answerChallengeSchema,
  adventureParamsSchema,
  childParamsSchema,
} from '../validators/adventure.schemas';
import * as adventureController from '../controllers/adventureController';

const router = Router();

// Apply AI rate limits to all adventure endpoints.
router.use(aiRateLimit);

// Child-scoped routes
router.get(
  '/children/:childId/available',
  requireAuth,
  validate({ params: childParamsSchema }),
  adventureController.getAvailableAdventures,
);

router.post(
  '/children/:childId',
  requireAuth,
  validate({ params: childParamsSchema, body: startAdventureSchema }),
  adventureController.startAdventure,
);

// Adventure-scoped routes
router.get(
  '/:adventureId',
  requireAuth,
  validate({ params: adventureParamsSchema }),
  adventureController.getAdventure,
);

router.post(
  '/:adventureId/continue',
  requireAuth,
  validate({ params: adventureParamsSchema, body: continueAdventureSchema }),
  adventureController.continueAdventure,
);

router.post(
  '/:adventureId/answer',
  requireAuth,
  validate({ params: adventureParamsSchema, body: answerChallengeSchema }),
  adventureController.answerChallenge,
);

router.post(
  '/:adventureId/hint',
  requireAuth,
  validate({ params: adventureParamsSchema }),
  adventureController.requestHint,
);

router.post(
  '/:adventureId/complete',
  requireAuth,
  validate({ params: adventureParamsSchema }),
  adventureController.completeAdventure,
);

export default router;
