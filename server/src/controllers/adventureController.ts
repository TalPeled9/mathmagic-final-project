import { Request, Response } from 'express';
import { Adventure } from '../models/Adventure';
import { AdventureImage } from '../models/AdventureImage';
import { LearningSession } from '../models/LearningSession';
import { ApiError } from '../utils/ApiError';
import { MATH_TOPICS, getMathTopicById } from '../config/mathTopics';
import { STORY_WORLDS, getStoryWorldById } from '../config/storyWorlds';
import { llmService } from '../services/ai/llmService';
import {
  verifyChildOwnership,
  verifyAdventureAccess,
  buildAdventureState,
  determineNextMode,
  mapStartAdventureResponse,
  mapMathQuestionResponse,
  mapEndStoryResponse,
  mapHintResponse,
  generateSegmentImage,
  calculateAnswerXP,
  calculateAdventureRewards,
  applyRewardsToChild,
  appendToHistory,
  updateTopicProgress,
} from '../services/adventureService';
import type { StorySegment } from '@mathmagic/types';

// ─── GET /api/adventures/children/:childId/available ────────────────────────

export async function getAvailableAdventures(req: Request, res: Response): Promise<void> {
  const childId = req.params.childId as string;
  const userId = req.user!.userId;

  const child = await verifyChildOwnership(userId, childId);

  const topics = MATH_TOPICS.filter(
    (t) => t.gradeRange.min <= child.gradeLevel && t.gradeRange.max >= child.gradeLevel
  );

  res.json({ topics, worlds: STORY_WORLDS });
}

// ─── POST /api/adventures/children/:childId ──────────────────────────────────

export async function startAdventure(req: Request, res: Response): Promise<void> {
  const childId = req.params.childId as string;
  const userId = req.user!.userId;
  const { mathTopic, storyWorld } = req.body as { mathTopic: string; storyWorld: string };

  const child = await verifyChildOwnership(userId, childId);

  if (!getMathTopicById(mathTopic)) {
    throw ApiError.badRequest(`Unknown math topic: ${mathTopic}`);
  }
  if (!getStoryWorldById(storyWorld)) {
    throw ApiError.badRequest(`Unknown story world: ${storyWorld}`);
  }

  const adventure = await Adventure.create({ childId, mathTopic, storyWorld });
  await LearningSession.create({ childId, adventureId: adventure._id });

  const state = buildAdventureState(adventure, child, 'story_step');
  const llmResponse = await llmService.generateStoryStepFromState(state);
  const segment: StorySegment = mapStartAdventureResponse(llmResponse);

  const generatedImageUrl = await generateSegmentImage(segment.imageDescription, child.avatarUrl ?? '');
  if (generatedImageUrl) {
    segment.imageUrl = generatedImageUrl;
    await AdventureImage.create({
      adventureId: adventure._id,
      stepIndex: adventure.currentStepIndex,
      imageData: generatedImageUrl,
      contentType: 'image/jpeg',
      imageDescription: segment.imageDescription,
    });
  }

  adventure.lastChoices = segment.choices;
  appendToHistory(adventure, 'wizzy', segment.narrative, segment.wizzyDialogue);
  await adventure.save();

  res.status(201).json({ adventureId: adventure._id.toString(), segment });
}

// ─── GET /api/adventures/:adventureId ───────────────────────────────────────

export async function getAdventure(req: Request, res: Response): Promise<void> {
  const adventureId = req.params.adventureId as string;
  const userId = req.user!.userId;

  const { adventure } = await verifyAdventureAccess(userId, adventureId);

  const lastWizzy = [...adventure.conversationHistory].reverse().find((e) => e.role === 'wizzy');

  const adventureImages = await AdventureImage.find({ adventureId: adventure._id }).lean();
  const stepImages: Record<number, string> = Object.fromEntries(
    adventureImages.map((img) => [
      img.stepIndex,
      `/api/adventures/${adventure._id}/images/${img.stepIndex}`,
    ]),
  );

  const challenge = adventure.currentChallenge
    ? {
        problemText: adventure.currentChallenge.problemText,
        options: adventure.currentChallenge.options,
        hintLevel: adventure.currentChallenge.hintLevel,
        attemptsCount: adventure.currentChallenge.attemptsCount,
      }
    : null;

  const currentSegment: StorySegment = {
    narrative: lastWizzy?.content ?? '',
    wizzyDialogue: lastWizzy?.content ?? '',
    choices: adventure.lastChoices,
    challenge,
    imageUrl: stepImages[adventure.currentStepIndex],
    imageDescription: '',
    isLastStep: adventure.currentStepIndex >= adventure.totalSteps - 1,
  };

  res.json({
    adventureId: adventure._id.toString(),
    status: adventure.status,
    mathTopic: adventure.mathTopic,
    storyWorld: adventure.storyWorld,
    currentStepIndex: adventure.currentStepIndex,
    totalSteps: adventure.totalSteps,
    currentSegment,
    xpEarned: adventure.xpEarned,
    starsEarned: adventure.starsEarned,
    // Extra fields used by StoryChat to reconstruct full conversation history
    conversationHistory: adventure.conversationHistory,
    currentChallenge: challenge,
    lastChoices: adventure.lastChoices,
    stepImages,
  });
}

// ─── POST /api/adventures/:adventureId/continue ──────────────────────────────

export async function continueAdventure(req: Request, res: Response): Promise<void> {
  const adventureId = req.params.adventureId as string;
  const userId = req.user!.userId;
  const { choiceIndex } = req.body as { choiceIndex: number };

  const { adventure, child } = await verifyAdventureAccess(userId, adventureId);

  if (adventure.status !== 'in-progress') {
    throw ApiError.badRequest('Adventure is already completed');
  }

  if (adventure.currentChallenge) {
    throw ApiError.badRequest('Complete the math challenge before continuing');
  }

  if (adventure.currentStepIndex >= adventure.totalSteps - 1) {
    throw ApiError.badRequest('Adventure has reached its final step; call /complete to finish');
  }

  if (adventure.lastChoices.length === 0) {
    // Auto-continue after a math challenge was resolved (no choices available)
    // — do not append a child history entry, just advance the step
  } else {
    const choiceText = adventure.lastChoices[choiceIndex];
    if (choiceText === undefined) {
      throw ApiError.badRequest(`Invalid choice index: ${choiceIndex}`);
    }
    appendToHistory(adventure, 'child', choiceText);
  }

  adventure.currentStepIndex += 1;

  const mode = determineNextMode(adventure);
  const state = buildAdventureState(adventure, child, mode);

  let segment: StorySegment;

  let mathProblemText: string | undefined;

  if (mode === 'math_question') {
    const llmResponse = await llmService.generateMathQuestionFromState(state);
    segment = mapMathQuestionResponse(llmResponse);
    adventure.currentChallenge = segment.challenge
      ? {
          problemText: llmResponse.problemText,
          correctAnswer: llmResponse.correctAnswer,
          options: segment.challenge.options,
          hintLevel: 0,
          attemptsCount: 0,
        }
      : null;
    adventure.totalChallenges += 1;
    mathProblemText = llmResponse.problemText;
  } else if (mode === 'end_story') {
    const llmResponse = await llmService.generateEndStoryFromState(state);
    segment = mapEndStoryResponse(llmResponse);
  } else {
    const llmResponse = await llmService.generateStoryStepFromState(state);
    segment = mapStartAdventureResponse(llmResponse);
  }

  const generatedImageUrl = await generateSegmentImage(segment.imageDescription, child.avatarUrl ?? '');
  if (generatedImageUrl) {
    segment.imageUrl = generatedImageUrl;
    await AdventureImage.create({
      adventureId: adventure._id,
      stepIndex: adventure.currentStepIndex,
      imageData: generatedImageUrl,
      contentType: 'image/jpeg',
      imageDescription: segment.imageDescription,
    });
  }

  adventure.lastChoices = segment.choices;
  appendToHistory(adventure, 'wizzy', segment.narrative, segment.wizzyDialogue);
  await adventure.save();

  res.json({ segment });
}

// ─── POST /api/adventures/:adventureId/answer ────────────────────────────────

export async function answerChallenge(req: Request, res: Response): Promise<void> {
  const adventureId = req.params.adventureId as string;
  const userId = req.user!.userId;
  const { answer } = req.body as { answer: string };

  const { adventure, child } = await verifyAdventureAccess(userId, adventureId);

  if (!adventure.currentChallenge) {
    throw ApiError.badRequest('No active challenge');
  }
  if (adventure.status !== 'in-progress') {
    throw ApiError.badRequest('Adventure is already completed');
  }

  const isCorrect =
    answer.trim().toLowerCase() === adventure.currentChallenge.correctAnswer.trim().toLowerCase();

  appendToHistory(adventure, 'child', answer);

  if (isCorrect) {
    const hintUsed = adventure.currentChallenge.hintLevel > 0;
    const xpEarned = calculateAnswerXP(true, hintUsed);

    adventure.xpEarned += xpEarned;
    adventure.correctAnswers += 1;
    appendToHistory(adventure, 'system', 'Correct answer!');
    adventure.currentChallenge = null;
    adventure.currentHints = []; // reset hint memory for next challenge
    await adventure.save();

    await updateTopicProgress(child._id.toString(), adventure.mathTopic, true, hintUsed);

    res.json({ correct: true, xpEarned, feedback: 'Great job! ✨' });
    return;
  }

  // Wrong answer
  adventure.currentChallenge.attemptsCount += 1;
  adventure.incorrectAnswers += 1;

  if (adventure.currentChallenge.attemptsCount >= 3) {
    const correctAnswer = adventure.currentChallenge.correctAnswer;
    adventure.xpEarned += 2; // consolation XP
    appendToHistory(adventure, 'system', `The correct answer was ${correctAnswer}. Keep going!`);
    adventure.currentChallenge = null;
    adventure.currentHints = []; // reset hint memory for next challenge
    await adventure.save();

    await updateTopicProgress(child._id.toString(), adventure.mathTopic, false, false);

    res.json({
      correct: false,
      feedback: "Don't give up! The correct answer was revealed.",
      correctAnswer,
    });
    return;
  }

  appendToHistory(adventure, 'system', 'Incorrect, try again');
  await adventure.save();

  res.json({ correct: false, feedback: 'Almost! Try again.' });
}

// ─── POST /api/adventures/:adventureId/hint ──────────────────────────────────

export async function requestHint(req: Request, res: Response): Promise<void> {
  const adventureId = req.params.adventureId as string;
  const userId = req.user!.userId;

  const { adventure, child } = await verifyAdventureAccess(userId, adventureId);

  if (adventure.status !== 'in-progress') {
    throw ApiError.badRequest('Adventure is already completed');
  }
  if (!adventure.currentChallenge) {
    throw ApiError.badRequest('No active challenge');
  }
  if (adventure.currentChallenge.hintLevel >= 3) {
    throw ApiError.badRequest('Maximum hints reached');
  }

  adventure.currentChallenge.hintLevel += 1;
  adventure.hintsUsed += 1;

  const state = buildAdventureState(adventure, child, 'hint');
  const llmResponse = await llmService.generateHintFromState(state);
  const hintResponse = mapHintResponse(llmResponse, adventure.currentChallenge.hintLevel);

  // Persist hint text so next hint call can see what was already given
  adventure.currentHints.push(hintResponse.hintText);
  await adventure.save();

  res.json(hintResponse);
}

// ─── POST /api/adventures/:adventureId/complete ──────────────────────────────

export async function completeAdventure(req: Request, res: Response): Promise<void> {
  const adventureId = req.params.adventureId as string;
  const userId = req.user!.userId;

  const { adventure, child } = await verifyAdventureAccess(userId, adventureId);

  if (adventure.status !== 'in-progress') {
    throw ApiError.badRequest('Adventure is already completed');
  }

  adventure.status = 'completed';
  adventure.completedAt = new Date();

  const stats = {
    totalChallenges: adventure.totalChallenges,
    correctAnswers: adventure.correctAnswers,
    incorrectAnswers: adventure.incorrectAnswers,
    hintsUsed: adventure.hintsUsed,
  };

  const { starsEarned } = calculateAdventureRewards(stats);
  adventure.starsEarned = starsEarned;

  await adventure.save();

  const { newLevel, newBadge } = await applyRewardsToChild(
    child,
    adventure.xpEarned,
    starsEarned,
    stats,
    adventure.storyWorld
  );

  const durationMinutes = Math.round(
    (adventure.completedAt.getTime() - adventure.startedAt.getTime()) / 60000
  );
  await LearningSession.findOneAndUpdate(
    { adventureId: adventure._id },
    { endTime: adventure.completedAt, duration: durationMinutes }
  );

  res.json({
    xpEarned: adventure.xpEarned,
    starsEarned,
    newLevel,
    newBadge,
    totalXP: child.totalXP,
    totalStars: child.totalStars,
  });
}

// ─── GET /api/adventures/:adventureId/images/:stepIndex ─────────────────────

export async function getAdventureImage(req: Request, res: Response): Promise<void> {
  const { adventureId, stepIndex } = req.params as { adventureId: string; stepIndex: string };
  const userId = req.user!.userId;

  await verifyAdventureAccess(userId, adventureId);

  const img = await AdventureImage.findOne({
    adventureId,
    stepIndex: parseInt(stepIndex, 10),
  }).lean();

  if (!img) {
    throw ApiError.notFound('Image not found');
  }

  res.json({ imageUrl: img.imageData });
}

// ─── GET /api/adventures/children/:childId ──────────────────────────────────

export async function getChildAdventures(req: Request, res: Response): Promise<void> {
  const childId = req.params.childId as string;
  const userId = req.user!.userId;

  await verifyChildOwnership(userId, childId);

  const adventures = await Adventure.find({ childId })
    .sort({ startedAt: -1 })
    .select(
      'mathTopic storyWorld status currentStepIndex totalSteps xpEarned starsEarned startedAt completedAt'
    )
    .lean();

  res.json({
    adventures: adventures.map((a) => ({
      _id: a._id.toString(),
      mathTopic: a.mathTopic,
      storyWorld: a.storyWorld,
      status: a.status,
      currentStepIndex: a.currentStepIndex,
      totalSteps: a.totalSteps,
      xpEarned: a.xpEarned,
      starsEarned: a.starsEarned,
      startedAt: a.startedAt,
      completedAt: a.completedAt,
    })),
  });
}
