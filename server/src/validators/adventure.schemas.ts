import { z } from 'zod';

export const startAdventureSchema = z.object({
  mathTopic: z.string().min(1, 'Math topic is required'),
  storyWorld: z.string().min(1, 'Story world is required'),
});

export const continueAdventureSchema = z.object({
  choiceIndex: z.number().int().min(0).max(3),
});

export const answerChallengeSchema = z.object({
  answer: z.string().min(1, 'Answer is required'),
});

export const adventureParamsSchema = z.object({
  adventureId: z.string().min(1, 'Adventure ID is required'),
});

export const childParamsSchema = z.object({
  childId: z.string().min(1, 'Child ID is required'),
});
