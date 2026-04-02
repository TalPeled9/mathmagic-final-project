import { z } from 'zod';

export const startAdventureSchema = z.object({
  mathTopic: z.string().min(1, 'Math topic is required'),
  storyWorld: z.string().min(1, 'Story world is required'),
});

export const continueAdventureSchema = z.object({
  choiceIndex: z.number().int().min(0).max(2),
});

export const answerChallengeSchema = z.object({
  answer: z.string().min(1, 'Answer is required'),
});

export const adventureParamsSchema = z.object({
  adventureId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Adventure ID must be a valid ObjectId'),
});

export const childParamsSchema = z.object({
  childId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Child ID must be a valid ObjectId'),
});
