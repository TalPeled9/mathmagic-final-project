import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { aiRateLimit } from '../middleware/rateLimit';
import { validate } from '../middleware/validateRequest';
import {
  startAdventureSchema,
  continueAdventureSchema,
  answerChallengeSchema,
  adventureParamsSchema,
  imageParamsSchema,
  childParamsSchema,
} from '../validators/adventure.schemas';
import * as adventureController from '../controllers/adventureController';

const router = Router();

// Child-scoped routes
router.get(
  '/children/:childId/available',
  requireAuth,
  validate({ params: childParamsSchema }),
  adventureController.getAvailableAdventures,
);

router.get(
  '/children/:childId',
  requireAuth,
  validate({ params: childParamsSchema }),
  adventureController.getChildAdventures,
);

router.post(
  '/children/:childId',
  requireAuth,
  aiRateLimit,
  validate({ params: childParamsSchema, body: startAdventureSchema }),
  adventureController.startAdventure,
);

// Adventure-scoped routes
router.get(
  '/:adventureId/images/:stepIndex',
  requireAuth,
  validate({ params: imageParamsSchema }),
  adventureController.getAdventureImage,
);

router.get(
  '/:adventureId',
  requireAuth,
  validate({ params: adventureParamsSchema }),
  adventureController.getAdventure,
);

router.post(
  '/:adventureId/continue',
  requireAuth,
  aiRateLimit,
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
  aiRateLimit,
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
