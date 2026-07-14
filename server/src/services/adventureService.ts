import type {
  AdventureState,
  StoryMode,
  StorySegment,
  HintResponse,
  ICurrentChallenge,
  LLMStoryStepResponse,
  LLMMathQuestionResponse,
  LLMHintResponse,
  LLMEndStoryResponse,
  IBadge,
} from '@mathmagic/types';
import { Adventure, type IAdventureDocument } from '../models/Adventure';
import { AdventureImage } from '../models/AdventureImage';
import { Child, type IChildDocument } from '../models/Child';
import { generateStoryImage } from './ai/imageGenerationService';
import { buildStorySummary, hashStringToSeed } from './ai/storyContextBuilder';
import { llmService } from './ai/llmService';
import { getLevelForXP } from '../config/levelThresholds';
import {
  calculateChallengeXP,
  calculateCompletionXP,
  type XPResult,
  type AdventureStats,
} from './gamification/xpService';
import { updateTopicMastery } from './gamification/masteryService';
import { checkAndAwardBadges, type BadgeContext } from './gamification/badgeService';
import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';

// ─── In-process pre-generated image cache ────────────────────────────────────
// Images generated during prefetch are held here keyed by
// `${adventureId}:${stepIndex}:${choiceIndex}` (choice images) or
// `${adventureId}:${stepIndex}:step` (deterministic next-step images).
// Each entry is consumed exactly once and then deleted, so memory stays bounded.
const pregeneratedImageCache = new Map<string, string>();

// ─── In-process pending prefetch tracker ─────────────────────────────────────
// Tracks in-flight prefetch promises so continueAdventure can await them on a
// fast click (cache miss while prefetch is still running) rather than starting
// a duplicate LLM call.
// Keys: `${adventureId}:${stepIndex}:choices` | `${adventureId}:${stepIndex}:step`
const pendingPrefetches = new Map<string, Promise<void>>();

export function getPendingPrefetch(
  adventureId: string,
  stepIndex: number,
  type: 'choices' | 'step'
): Promise<void> | undefined {
  return pendingPrefetches.get(`${adventureId}:${stepIndex}:${type}`);
}

function imageCacheKey(adventureId: string, stepIndex: number, choiceIndex?: number): string {
  return `${adventureId}:${stepIndex}:${choiceIndex ?? 'step'}`;
}

export function consumePregeneratedImage(
  adventureId: string,
  stepIndex: number,
  choiceIndex?: number
): string | null {
  const key = imageCacheKey(adventureId, stepIndex, choiceIndex);
  const image = pregeneratedImageCache.get(key) ?? null;
  if (image) pregeneratedImageCache.delete(key);
  return image;
}

// ─── Ownership & Access Verification ────────────────────────────────────────

export async function verifyChildOwnership(
  userId: string,
  childId: string
): Promise<IChildDocument> {
  const child = await Child.findById(childId);
  if (!child) throw ApiError.notFound('Child not found');
  if (child.parentId.toString() !== userId) throw ApiError.forbidden('Access denied');
  return child;
}

export async function verifyAdventureAccess(
  userId: string,
  adventureId: string
): Promise<{ adventure: IAdventureDocument; child: IChildDocument }> {
  const adventure = await Adventure.findById(adventureId);
  if (!adventure) throw ApiError.notFound('Adventure not found');
  const child = await verifyChildOwnership(userId, adventure.childId.toString());
  return { adventure, child };
}

// ─── Adventure State Construction ───────────────────────────────────────────

export function buildAdventureState(
  adventure: IAdventureDocument,
  child: IChildDocument,
  mode: StoryMode
): AdventureState {
  // Cap to last 4 story choices — earlier ones are low-signal noise
  const selectedChoices = adventure.conversationHistory
    .filter((turn) => turn.role === 'child')
    .slice(-4)
    .map((turn) => turn.content);

  const recentEvents = adventure.conversationHistory
    .filter((turn) => turn.role === 'wizzy')
    .slice(-3)
    .map((turn) => turn.content);

  // Rolling window of last 10 turns for full transcript
  const conversationTurns = adventure.conversationHistory.slice(-10).map((turn) => ({
    role: turn.role as 'wizzy' | 'child' | 'system',
    content: turn.content,
    dialogue: turn.dialogue,
  }));

  // Most recent child answer — fixes hint context bug where childAnswer was always ''
  const lastChildAnswer = [...adventure.conversationHistory]
    .reverse()
    .find((turn) => turn.role === 'child')?.content;

  const state: AdventureState = {
    childName: child.name,
    gradeLevel: child.gradeLevel,
    mathTopic: adventure.mathTopic,
    storyWorld: adventure.storyWorld,
    mode,
    currentStepIndex: adventure.currentStepIndex,
    totalSteps: adventure.totalSteps,
    selectedChoices,
    recentEvents,
    conversationTurns,
    previousHints: adventure.currentHints ?? [],
    lastProblemText: adventure.currentChallenge?.problemText,
    lastMathExpression: adventure.currentChallenge?.mathExpression,
    correctAnswer: adventure.currentChallenge?.correctAnswer,
    lastChildAnswer,
    attemptCount: adventure.currentChallenge?.attemptsCount ?? 0,
    hintLevel: (adventure.currentChallenge?.hintLevel ?? 0) as 0 | 1 | 2 | 3,
    hintUsed: (adventure.currentChallenge?.hintLevel ?? 0) > 0,
    currentDifficulty: (adventure.currentDifficulty ?? 'easy') as 'easy' | 'medium' | 'hard',
    variantSeed: hashStringToSeed(adventure._id.toString()),
    recentPerformanceScores: adventure.recentPerformanceScores ?? [],
    previousProblemTexts: adventure.previousProblemTexts ?? [],
    storySummary: '',
  };

  state.storySummary = buildStorySummary(state);
  return state;
}

// ─── Mode Decision (State Machine) ──────────────────────────────────────────

export function determineNextMode(adventure: IAdventureDocument): StoryMode {
  const { currentStepIndex, totalSteps } = adventure;
  if (currentStepIndex >= totalSteps - 1) return 'end_story';
  if (currentStepIndex % 3 === 0) return 'story_step';
  return 'math_question';
}

// ─── Response Mapping ────────────────────────────────────────────────────────

// LLMs tend to place the correct answer first, so options are shuffled before
// reaching the child. Safe because answers are checked by value, not position.
function shuffleOptions<T>(options: readonly T[]): T[] {
  const shuffled = [...options];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function mapStartAdventureResponse(
  llmResponse: LLMStoryStepResponse,
  imageUrl?: string
): StorySegment {
  return {
    narrative: llmResponse.adventureNarrative,
    wizzyDialogue: llmResponse.wizzyDialogue,
    choices: llmResponse.storyChoices,
    challenge: null,
    imageDescription: llmResponse.imageDescription,
    imageUrl,
    isLastStep: false,
  };
}

export function mapMathQuestionResponse(
  llmResponse: LLMMathQuestionResponse,
  imageUrl?: string
): StorySegment {
  const rawOptions = shuffleOptions(llmResponse.answerOptions.slice(0, 4));
  if (rawOptions.length < 4) {
    throw new ApiError(500, `LLM returned ${rawOptions.length} answer options; expected 4`);
  }
  const challenge: ICurrentChallenge = {
    problemText: llmResponse.problemText,
    mathExpression: llmResponse.mathExpression,
    clockTime: llmResponse.clockTime,
    options: rawOptions as [string, string, string, string],
    hintLevel: 0,
    attemptsCount: 0,
  };
  return {
    narrative: llmResponse.adventureNarrative,
    wizzyDialogue: llmResponse.wizzyDialogue,
    choices: [],
    challenge,
    imageDescription: llmResponse.imageDescription,
    imageUrl,
    isLastStep: false,
  };
}

export function mapEndStoryResponse(
  llmResponse: LLMEndStoryResponse,
  imageUrl?: string
): StorySegment {
  return {
    narrative: llmResponse.recap,
    wizzyDialogue: llmResponse.celebration,
    choices: [],
    challenge: null,
    imageDescription: llmResponse.imageDescription,
    imageUrl,
    isLastStep: true,
  };
}

export function mapHintResponse(llmResponse: LLMHintResponse, hintLevel: number): HintResponse {
  return {
    hintText: llmResponse.hintText,
    hintLevel,
    subQuestion: llmResponse.scaffoldingQuestion,
    subQuestionOptions: shuffleOptions(llmResponse.answerOptions),
    subQuestionAnswer: llmResponse.correctAnswer,
    encouragement: llmResponse.encouragement,
  };
}

// ─── Image Generation Wrapper ────────────────────────────────────────────────

export async function generateSegmentImage(
  imageDescription: string,
  avatarUrl: string
): Promise<string | null> {
  try {
    return await generateStoryImage(imageDescription, avatarUrl);
  } catch (err) {
    logger.warn({ err }, 'Image generation failed, continuing without image');
    return null;
  }
}

// ─── Weekly Reset Helper ─────────────────────────────────────────────────────

export function getWeekStart(date: Date): Date {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - (day === 0 ? 6 : day - 1));
  return d;
}

// ─── XP Calculation ──────────────────────────────────────────────────────────
// Delegates to gamification/xpService — re-exported for controller use

export { calculateChallengeXP, calculateCompletionXP, type XPResult, type AdventureStats };

export function calculateAdventureRewards(stats: AdventureStats): { starsEarned: number } {
  const { totalChallenges, correctAnswers, hintsUsed } = stats;
  if (totalChallenges === 0) return { starsEarned: 1 };

  const accuracy = correctAnswers / totalChallenges;
  let starsEarned: number;
  if (accuracy >= 0.9 && hintsUsed === 0) {
    starsEarned = 3;
  } else if (accuracy >= 0.7) {
    starsEarned = 2;
  } else {
    starsEarned = 1;
  }
  return { starsEarned };
}

// ─── Rewards Application ─────────────────────────────────────────────────────

export interface RewardsContext {
  currentStoryWorld: string;
  adventureDurationMinutes: number;
  totalCompletedAdventures: number;
}

export async function applyRewardsToChild(
  child: IChildDocument,
  xpEarned: number,
  starsEarned: number,
  stats: AdventureStats,
  context: RewardsContext
): Promise<{ newLevel?: number; newBadges: IBadge[] }> {
  const previousLevel = child.currentLevel;
  child.totalXP += xpEarned;
  child.totalStars += starsEarned;

  const levelInfo = getLevelForXP(child.totalXP);
  let newLevel: number | undefined;
  if (levelInfo.level > previousLevel) {
    child.currentLevel = levelInfo.level;
    newLevel = levelInfo.level;
  }

  // Update hint-free streak counter BEFORE badge check so badge service sees the new value
  if (stats.hintsUsed === 0) {
    child.consecutiveHintFreeAdventures = (child.consecutiveHintFreeAdventures ?? 0) + 1;
  } else {
    child.consecutiveHintFreeAdventures = 0;
  }

  const badgeContext: BadgeContext = {
    currentStoryWorld: context.currentStoryWorld,
    adventureDurationMinutes: context.adventureDurationMinutes,
    totalCompletedAdventures: context.totalCompletedAdventures,
    consecutiveHintFreeAdventures: child.consecutiveHintFreeAdventures,
  };

  const newBadges = await checkAndAwardBadges(child, stats, badgeContext);

  const currentWeekStart = getWeekStart(new Date());
  if (!child.weekStart || child.weekStart < currentWeekStart) {
    child.weeklyLearningMinutes = 0;
    child.weekStart = currentWeekStart;
  }
  child.weeklyLearningMinutes += context.adventureDurationMinutes;

  await child.save();
  return { newLevel, newBadges };
}

// ─── Conversation History ────────────────────────────────────────────────────

const MAX_HISTORY = 100;

export function appendToHistory(
  adventure: IAdventureDocument,
  role: 'wizzy' | 'child' | 'system',
  content: string
): void {
  adventure.conversationHistory.push({ role, content, timestamp: new Date() });
  if (adventure.conversationHistory.length > MAX_HISTORY) {
    adventure.conversationHistory.splice(0, adventure.conversationHistory.length - MAX_HISTORY);
  }
}

// ─── Topic Progress (delegates to masteryService) ───────────────────────────

export { updateTopicMastery as updateTopicProgress };

// ─── Pre-generation ──────────────────────────────────────────────────────────

/**
 * Fire-and-forget: pre-generates a math question for EACH story choice in parallel.
 * Called after serving a story_step so both possible next steps are cached.
 * When the user later picks choice 0 or 1, the matching math question is served instantly.
 * Never throws — errors are logged and the adventure continues normally.
 *
 * Registers the in-flight promise in `pendingPrefetches` so continueAdventure can
 * await it on a fast click instead of starting a duplicate LLM call.
 */
export function prefetchForChoices(adventure: IAdventureDocument, child: IChildDocument): void {
  const nextIndex = adventure.currentStepIndex + 1;
  // When the next step is end_story, there are no per-choice branches to pre-generate.
  // Delegate to prefetchNextStep which handles the single end_story response.
  if (nextIndex >= adventure.totalSteps - 1) {
    prefetchNextStep(adventure, child);
    return;
  }
  if (nextIndex % 3 !== 1) {
    console.log(
      `[prefetch] SKIP prefetchForChoices: nextIndex=${nextIndex} is not first-math-in-cycle (expected story step)`
    );
    return;
  }

  const choices = adventure.lastChoices;
  if (choices.length === 0) {
    console.log(
      `[prefetch] SKIP prefetchForChoices: no lastChoices on adventure=${adventure._id.toString()}`
    );
    return;
  }

  const key = `${adventure._id.toString()}:${nextIndex}:choices`;
  if (pendingPrefetches.has(key)) {
    console.log(
      `[prefetch] DEDUP prefetchForChoices already in flight adventure=${adventure._id.toString()} nextIndex=${nextIndex}`
    );
    return;
  }

  console.log(
    `[prefetch] START prefetchForChoices adventure=${adventure._id.toString()} nextIndex=${nextIndex} choices=${choices.length}`
  );

  const promise = _doPrefetchForChoices(adventure, child, nextIndex, choices).finally(() =>
    pendingPrefetches.delete(key)
  );
  pendingPrefetches.set(key, promise);
}

async function _doPrefetchForChoices(
  adventure: IAdventureDocument,
  child: IChildDocument,
  nextIndex: number,
  choices: string[]
): Promise<void> {
  const pregeneratedChoiceSteps: (Record<string, unknown> | null)[] = Array(choices.length).fill(
    null
  );

  await Promise.all(
    choices.map(async (choiceText, choiceIndex) => {
      try {
        const state = buildAdventureState(adventure, child, 'math_question');
        state.currentStepIndex = nextIndex;
        // Add the hypothetical choice so the LLM sees the story direction
        state.selectedChoices = [...state.selectedChoices, choiceText];

        // strict=true: if Gemini fails, throw — don't cache a fallback response
        const llmResponse = await llmService.generateMathQuestionFromState(state, true);
        // Generate image now (while user is on the previous step) and hold in
        // the in-process cache so cache-hit serves are instant.
        const imageUrl = await generateSegmentImage(
          llmResponse.imageDescription,
          child.avatars[child.activeAvatarIndex]?.imageData ?? ''
        );
        if (imageUrl) {
          pregeneratedImageCache.set(
            imageCacheKey(adventure._id.toString(), nextIndex, choiceIndex),
            imageUrl
          );
        }
        pregeneratedChoiceSteps[choiceIndex] = {
          mode: 'math_question',
          llmResponse: llmResponse as unknown as Record<string, unknown>,
          imageUrl: null,
          imageDescription: llmResponse.imageDescription,
        };

        console.log(
          `[prefetch] OK choice[${choiceIndex}]="${choiceText.slice(0, 30)}" adventure=${adventure._id.toString()}`
        );
      } catch (err) {
        console.warn(
          `[prefetch] FAIL choice[${choiceIndex}] adventure=${adventure._id.toString()}`,
          err
        );
      }
    })
  );

  // Wrap DB write separately — a write failure must not reject the tracked promise
  // (which would surface as a 500 to the user via `await pending` in the controller).
  try {
    await Adventure.updateOne({ _id: adventure._id }, { $set: { pregeneratedChoiceSteps } });
    const cached = pregeneratedChoiceSteps.filter(Boolean).length;
    console.log(
      `[prefetch] SAVED prefetchForChoices adventure=${adventure._id.toString()} cached=${cached}/${choices.length}`
    );
  } catch (err) {
    console.warn(
      `[prefetch] DB WRITE FAILED prefetchForChoices adventure=${adventure._id.toString()}`,
      err
    );
  }
}

/**
 * Fire-and-forget: pre-generates the next story_step after a math challenge resolves.
 * The next step (auto-continue) is always a story_step — pre-generate it now.
 * Never throws — errors are logged and the adventure continues normally.
 *
 * Registers the in-flight promise in `pendingPrefetches` so continueAdventure can
 * await it on a fast click instead of starting a duplicate LLM call.
 */
export function prefetchNextStep(adventure: IAdventureDocument, child: IChildDocument): void {
  const nextIndex = adventure.currentStepIndex + 1;
  // Only skip if nextIndex is completely out of bounds (should never happen in practice).
  // end_story IS prefetchable — by the time we reach the last story_step, all math
  // challenges are resolved and the stats used by buildEndStoryContext are final.
  if (nextIndex > adventure.totalSteps - 1) {
    console.log(`[prefetch] SKIP prefetchNextStep: nextIndex=${nextIndex} out of bounds`);
    return;
  }

  const key = `${adventure._id.toString()}:${nextIndex}:step`;
  if (pendingPrefetches.has(key)) {
    console.log(
      `[prefetch] DEDUP prefetchNextStep already in flight adventure=${adventure._id.toString()} nextIndex=${nextIndex}`
    );
    return;
  }

  const nextMode: StoryMode =
    nextIndex >= adventure.totalSteps - 1
      ? 'end_story'
      : nextIndex % 3 === 0
        ? 'story_step'
        : 'math_question';
  console.log(
    `[prefetch] START prefetchNextStep adventure=${adventure._id.toString()} nextIndex=${nextIndex} mode=${nextMode}`
  );

  const promise = _doPrefetchNextStep(adventure, child, nextIndex, nextMode).finally(() =>
    pendingPrefetches.delete(key)
  );
  pendingPrefetches.set(key, promise);
}

async function _doPrefetchNextStep(
  adventure: IAdventureDocument,
  child: IChildDocument,
  nextIndex: number,
  nextMode: StoryMode
): Promise<void> {
  try {
    const state = buildAdventureState(adventure, child, nextMode);
    state.currentStepIndex = nextIndex;

    let llmResponse: LLMStoryStepResponse | LLMMathQuestionResponse | LLMEndStoryResponse;
    // strict=true: if Gemini fails, throw — don't cache a fallback response
    if (nextMode === 'math_question') {
      llmResponse = await llmService.generateMathQuestionFromState(state, true);
    } else if (nextMode === 'end_story') {
      // end_story doesn't use strict mode — no fallback schema for it
      llmResponse = await llmService.generateEndStoryFromState(state);
    } else {
      llmResponse = await llmService.generateStoryStepFromState(state, true);
    }
    // Generate image now (while user is solving math) and hold in the in-process
    // cache so cache-hit serves are instant.
    const imageUrl = await generateSegmentImage(
      llmResponse.imageDescription,
      child.avatars[child.activeAvatarIndex]?.imageData ?? ''
    );
    if (imageUrl) {
      pregeneratedImageCache.set(imageCacheKey(adventure._id.toString(), nextIndex), imageUrl);
    }

    await Adventure.updateOne(
      { _id: adventure._id },
      {
        $set: {
          pregeneratedStep: {
            mode: nextMode,
            llmResponse: llmResponse as unknown as Record<string, unknown>,
            imageUrl: null,
            imageDescription: llmResponse.imageDescription,
          },
        },
      }
    );
    console.log(
      `[prefetch] SAVED prefetchNextStep adventure=${adventure._id.toString()} mode=${nextMode}`
    );
  } catch (err) {
    console.warn(`[prefetch] FAIL prefetchNextStep adventure=${adventure._id.toString()}`, err);
  }
}
