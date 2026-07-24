import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import * as parentController from '../controllers/parentController';
import * as statisticsController from '../controllers/statisticsController';
import reportsRouter from './reports';

const MIN_CHILD_NAME_LENGTH = 1;
const MAX_CHILD_NAME_LENGTH = 50;
const MAX_AVATAR_DESC_LENGTH = 200;
const router = Router();

const gradeLevelSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

const genderSchema = z.enum(['boy', 'girl']);

const createChildSchema = z.object({
  name: z.string().min(MIN_CHILD_NAME_LENGTH, 'Name is required').max(MAX_CHILD_NAME_LENGTH),
  gradeLevel: gradeLevelSchema,
  gender: genderSchema,
});

const updateChildSchema = z.object({
  name: z.string().min(MIN_CHILD_NAME_LENGTH).max(MAX_CHILD_NAME_LENGTH).optional(),
  gradeLevel: gradeLevelSchema.optional(),
  gender: genderSchema.optional(),
  narratorVoice: z.string().optional(),
});

const childIdSchema = z.object({ childId: z.string().min(1) });

const generateAvatarSchema = z.object({
  description: z.string().min(1).max(MAX_AVATAR_DESC_LENGTH),
  replaceIndex: z.number().int().min(0).max(2).optional(),
});

const setActiveAvatarSchema = z.object({
  avatarIndex: z.number().int().min(0).max(2),
});

const notificationPreferencesSchema = z.object({
  weeklyReportOptIn: z.boolean(),
});

router.get('/profile', requireAuth, parentController.getProfile);
router.get(
  '/notification-preferences',
  requireAuth,
  parentController.getNotificationPreferences
);
router.patch(
  '/notification-preferences',
  requireAuth,
  validate({ body: notificationPreferencesSchema }),
  parentController.updateNotificationPreferences
);
router.use('/reports', reportsRouter);
router.get('/children', requireAuth, parentController.getChildren);
router.post(
  '/children',
  requireAuth,
  validate({ body: createChildSchema }),
  parentController.createChild
);
router.get(
  '/children/:childId',
  requireAuth,
  validate({ params: childIdSchema }),
  parentController.getChild
);
router.get(
  '/children/:childId/statistics',
  requireAuth,
  validate({ params: childIdSchema }),
  statisticsController.getChildStatistics
);
router.put(
  '/children/:childId',
  requireAuth,
  validate({ params: childIdSchema, body: updateChildSchema }),
  parentController.updateChild
);
router.delete(
  '/children/:childId',
  requireAuth,
  validate({ params: childIdSchema }),
  parentController.deleteChild
);
router.post(
  '/children/:childId/avatar',
  requireAuth,
  validate({ params: childIdSchema, body: generateAvatarSchema }),
  parentController.generateChildAvatar
);
router.patch(
  '/children/:childId/avatar/active',
  requireAuth,
  validate({ params: childIdSchema, body: setActiveAvatarSchema }),
  parentController.setActiveAvatar
);

export default router;
