import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validateRequest';
import * as parentController from '../controllers/parentController';


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

const createChildSchema = z.object({
  name: z.string().min(MIN_CHILD_NAME_LENGTH, 'Name is required').max(MAX_CHILD_NAME_LENGTH),
  gradeLevel: gradeLevelSchema,
  avatarDescription: z.string().max(MAX_AVATAR_DESC_LENGTH).optional(),
});

const updateChildSchema = z.object({
  name: z.string().min(MIN_CHILD_NAME_LENGTH).max(MAX_CHILD_NAME_LENGTH).optional(),
  gradeLevel: gradeLevelSchema.optional(),
});

const childIdSchema = z.object({ childId: z.string().min(1) });

router.get('/profile', requireAuth, parentController.getProfile);
router.get('/children', requireAuth, parentController.getChildren);
router.post('/children', requireAuth, validate({ body: createChildSchema }), parentController.createChild);
router.get('/children/:childId', requireAuth, validate({ params: childIdSchema }), parentController.getChild);
router.put('/children/:childId', requireAuth, validate({ params: childIdSchema, body: updateChildSchema }), parentController.updateChild);
router.post('/children/:childId/avatar', requireAuth, validate({ params: childIdSchema }), parentController.regenerateAvatar);

export default router;
