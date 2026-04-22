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
import { TopicProgress } from '../models/TopicProgress';
import { generateStoryImage } from './ai/imageGenerationService';
import { buildStorySummary } from './ai/storyContextBuilder';
import { llmService } from './ai/llmService';
import { getLevelForXP } from '../config/levelThresholds';
import { BADGE_DEFINITIONS } from '../config/badges';
import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';

// ─── In-process pre-generated image cache ────────────────────────────────────
// Images generated during prefetch are held here keyed by
// `${adventureId}:${stepIndex}:${choiceIndex}` (choice images) or
// `${adventureId}:${stepIndex}:step` (deterministic next-step images).
// Each entry is consumed exactly once and then deleted, so memory stays bounded.
const pregeneratedImageCache = new Map<string, string>();

function imageCacheKey(adventureId: string, stepIndex: number, choiceIndex?: number): string {
  return `${adventureId}:${stepIndex}:${choiceIndex ?? 'step'}`;
}

export function consumePregeneratedImage(
  adventureId: string,
  stepIndex: number,
  choiceIndex?: number,
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
  const conversationTurns = adventure.conversationHistory
    .slice(-10)
    .map((turn) => ({
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
    correctAnswer: adventure.currentChallenge?.correctAnswer,
    lastChildAnswer,
    attemptCount: adventure.currentChallenge?.attemptsCount ?? 0,
    hintLevel: (adventure.currentChallenge?.hintLevel ?? 0) as 0 | 1 | 2 | 3,
    hintUsed: (adventure.currentChallenge?.hintLevel ?? 0) > 0,
    storySummary: '',
  };

  state.storySummary = buildStorySummary(state);
  return state;
}

// ─── Mode Decision (State Machine) ──────────────────────────────────────────

export function determineNextMode(adventure: IAdventureDocument): StoryMode {
  const { currentStepIndex, totalSteps } = adventure;
  if (currentStepIndex >= totalSteps - 1) return 'end_story';
  if (currentStepIndex % 2 !== 0) return 'math_question';
  return 'story_step';
}

// ─── Response Mapping ────────────────────────────────────────────────────────

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
  const rawOptions = llmResponse.answerOptions.slice(0, 4);
  if (rawOptions.length < 4) {
    throw new ApiError(500, `LLM returned ${rawOptions.length} answer options; expected 4`);
  }
  const challenge: ICurrentChallenge = {
    problemText: llmResponse.problemText,
    options: rawOptions as [string, string, string, string],
    hintLevel: 0,
    attemptsCount: 0,
  };
  return {
    narrative: llmResponse.wizzyDialogue,
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
  const sq = llmResponse.scaffoldingQuestion;
  return {
    hintText: llmResponse.hintText,
    hintLevel,
    subQuestion: sq && sq !== 'null' ? sq : undefined,
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

// ─── XP Calculation ──────────────────────────────────────────────────────────

export function calculateAnswerXP(correct: boolean, hintUsed: boolean): number {
  if (!correct) return 2;
  let xp = 10;
  if (!hintUsed) xp += 5;
  return xp;
}

export interface AdventureStats {
  totalChallenges: number;
  correctAnswers: number;
  incorrectAnswers: number;
  hintsUsed: number;
}

export function calculateAdventureRewards(stats: AdventureStats): { starsEarned: number } {
  const { totalChallenges, correctAnswers, hintsUsed } = stats;
  if (totalChallenges === 0) return { starsEarned: 1 };

  const accuracy = correctAnswers / totalChallenges;
  let starsEarned: number;
  if (accuracy > 0.9 && hintsUsed === 0) {
    starsEarned = 3;
  } else if (accuracy > 0.7) {
    starsEarned = 2;
  } else {
    starsEarned = 1;
  }
  return { starsEarned };
}

// ─── Rewards Application ─────────────────────────────────────────────────────

export async function applyRewardsToChild(
  child: IChildDocument,
  xpEarned: number,
  starsEarned: number,
  stats: AdventureStats,
  currentStoryWorld?: string
): Promise<{ newLevel?: number; newBadge?: IBadge }> {
  const previousLevel = child.currentLevel;
  child.totalXP += xpEarned;
  child.totalStars += starsEarned;

  const levelInfo = getLevelForXP(child.totalXP);
  let newLevel: number | undefined;
  if (levelInfo.level > previousLevel) {
    child.currentLevel = levelInfo.level;
    newLevel = levelInfo.level;
  }

  const alreadyHas = (badgeType: string) => child.badges.some((b) => b.badgeType === badgeType);
  let newBadge: IBadge | undefined;

  // first-adventure: check BEFORE this adventure is marked completed
  if (!alreadyHas('first-adventure')) {
    const completedCount = await Adventure.countDocuments({
      childId: child._id,
      status: 'completed',
    });
    if (completedCount === 0) {
      newBadge = pushBadge(child, 'first-adventure');
    }
  }

  // perfect-score: 100% accuracy with 0 hints (retries allowed)
  if (
    !newBadge &&
    !alreadyHas('perfect-score') &&
    stats.totalChallenges > 0 &&
    stats.correctAnswers === stats.totalChallenges &&
    stats.hintsUsed === 0
  ) {
    newBadge = pushBadge(child, 'perfect-score');
  }

  // speed-master: all correct on first attempt (no wrong answers, no hints)
  if (
    !newBadge &&
    !alreadyHas('speed-master') &&
    stats.totalChallenges > 0 &&
    stats.incorrectAnswers === 0 &&
    stats.hintsUsed === 0
  ) {
    newBadge = pushBadge(child, 'speed-master');
  }

  // 5-day-streak: completed adventures on 5 consecutive calendar days
  if (!newBadge && !alreadyHas('5-day-streak')) {
    const completedAdventures = await Adventure.find(
      { childId: child._id, status: 'completed', completedAt: { $exists: true } },
      { completedAt: 1, _id: 0 }
    ).lean();

    const daySet = new Set<string>();
    const todayUTC = new Date().toISOString().slice(0, 10);
    daySet.add(todayUTC);
    for (const a of completedAdventures) {
      if (a.completedAt) daySet.add(new Date(a.completedAt).toISOString().slice(0, 10));
    }
    const sortedDays = Array.from(daySet).sort().reverse(); // descending
    let streak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      const prev = new Date(sortedDays[i - 1]).getTime();
      const curr = new Date(sortedDays[i]).getTime();
      if (prev - curr === 86400000) {
        streak += 1;
        if (streak >= 5) break;
      } else {
        break;
      }
    }
    if (streak >= 5) newBadge = pushBadge(child, '5-day-streak');
  }

  // explorer: completed adventures in 3 different story worlds
  if (!newBadge && !alreadyHas('explorer')) {
    const distinctWorlds = await Adventure.distinct('storyWorld', {
      childId: child._id,
      status: 'completed',
    });
    const worldSet = new Set<string>(distinctWorlds);
    if (currentStoryWorld) worldSet.add(currentStoryWorld);
    if (worldSet.size >= 3) newBadge = pushBadge(child, 'explorer');
  }

  // topic-master: mastery >= 80% on a topic with at least 5 challenges
  if (!newBadge && !alreadyHas('topic-master')) {
    const masteredTopic = await TopicProgress.findOne({
      childId: child._id,
      masteryLevel: { $gte: 80 },
      totalChallenges: { $gte: 5 },
    }).lean();
    if (masteredTopic) newBadge = pushBadge(child, 'topic-master');
  }

  await child.save();
  return { newLevel, newBadge };
}

function pushBadge(child: IChildDocument, badgeType: string): IBadge | undefined {
  const def = BADGE_DEFINITIONS.find((b) => b.badgeType === badgeType);
  if (!def) return undefined;

  const earnedAt = new Date();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (child.badges as any[]).push({
    badgeType: def.badgeType,
    badgeName: def.badgeName,
    description: def.description,
    iconUrl: def.iconUrl,
    earnedAt,
  });

  return {
    badgeType: def.badgeType,
    badgeName: def.badgeName,
    description: def.description,
    iconUrl: def.iconUrl,
    earnedAt: earnedAt.toISOString(),
  };
}

// ─── Conversation History ────────────────────────────────────────────────────

const MAX_HISTORY = 100;

export function appendToHistory(
  adventure: IAdventureDocument,
  role: 'wizzy' | 'child' | 'system',
  content: string,
): void {
  adventure.conversationHistory.push({ role, content, timestamp: new Date() });
  if (adventure.conversationHistory.length > MAX_HISTORY) {
    adventure.conversationHistory.splice(0, adventure.conversationHistory.length - MAX_HISTORY);
  }
}

// ─── Topic Progress ──────────────────────────────────────────────────────────

export async function updateTopicProgress(
  childId: string,
  mathTopic: string,
  correct: boolean,
  hintUsed: boolean
): Promise<void> {
  const inc: Record<string, number> = {
    totalChallenges: 1,
    ...(correct ? { correctAnswers: 1 } : { incorrectAnswers: 1 }),
    ...(hintUsed ? { hintsUsed: 1 } : {}),
  };

  const doc = await TopicProgress.findOneAndUpdate(
    { childId, mathTopic },
    { $inc: inc, $set: { lastPracticedAt: new Date() } },
    { upsert: true, new: true }
  );

  if (doc && doc.totalChallenges > 0) {
    const masteryLevel = Math.round((doc.correctAnswers / doc.totalChallenges) * 100);
    await TopicProgress.updateOne({ _id: doc._id }, { $set: { masteryLevel } });
  }
}

// ─── Pre-generation ──────────────────────────────────────────────────────────

/**
 * Fire-and-forget: pre-generates a math question for EACH story choice in parallel.
 * Called after serving a story_step so both possible next steps are cached.
 * When the user later picks choice 0 or 1, the matching math question is served instantly.
 * Never throws — errors are logged and the adventure continues normally.
 */
export async function prefetchForChoices(
  adventure: IAdventureDocument,
  child: IChildDocument,
): Promise<void> {
  const nextIndex = adventure.currentStepIndex + 1;
  // Next step after a story_step must be math_question; guard against end_story
  if (nextIndex >= adventure.totalSteps - 1) {
    console.log(`[prefetch] SKIP prefetchForChoices: nextIndex=${nextIndex} >= totalSteps-1=${adventure.totalSteps - 1}`);
    return;
  }
  if (nextIndex % 2 === 0) {
    console.log(`[prefetch] SKIP prefetchForChoices: nextIndex=${nextIndex} is even (expected math step)`);
    return;
  }

  const choices = adventure.lastChoices;
  if (choices.length === 0) {
    console.log(`[prefetch] SKIP prefetchForChoices: no lastChoices on adventure=${adventure._id.toString()}`);
    return;
  }

  console.log(`[prefetch] START prefetchForChoices adventure=${adventure._id.toString()} nextIndex=${nextIndex} choices=${choices.length}`);

  const pregeneratedChoiceSteps: (Record<string, unknown> | null)[] = Array(choices.length).fill(null);

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
        const imageUrl = await generateSegmentImage(llmResponse.imageDescription, child.avatarUrl ?? '');
        if (imageUrl) {
          pregeneratedImageCache.set(
            imageCacheKey(adventure._id.toString(), nextIndex, choiceIndex),
            imageUrl,
          );
        }
        pregeneratedChoiceSteps[choiceIndex] = {
          mode: 'math_question',
          llmResponse: llmResponse as unknown as Record<string, unknown>,
          imageUrl: null,
          imageDescription: llmResponse.imageDescription,
        };

        console.log(`[prefetch] OK choice[${choiceIndex}]="${choiceText.slice(0, 30)}" adventure=${adventure._id.toString()}`);
      } catch (err) {
        console.warn(`[prefetch] FAIL choice[${choiceIndex}] adventure=${adventure._id.toString()}`, err);
      }
    }),
  );

  try {
    await Adventure.updateOne(
      { _id: adventure._id },
      { $set: { pregeneratedChoiceSteps } },
    );
    const cached = pregeneratedChoiceSteps.filter(Boolean).length;
    console.log(`[prefetch] SAVED prefetchForChoices adventure=${adventure._id.toString()} cached=${cached}/${choices.length}`);
  } catch (err) {
    console.warn(`[prefetch] DB WRITE FAILED prefetchForChoices adventure=${adventure._id.toString()}`, err);
  }
}

/**
 * Fire-and-forget: pre-generates the next story_step after a math challenge resolves.
 * The next step (auto-continue) is always a story_step — pre-generate it now.
 * Never throws — errors are logged and the adventure continues normally.
 */
export async function prefetchNextStep(
  adventure: IAdventureDocument,
  child: IChildDocument,
): Promise<void> {
  const nextIndex = adventure.currentStepIndex + 1;
  // Skip pre-generation for end_story — its recap depends on final stats
  if (nextIndex >= adventure.totalSteps - 1) {
    console.log(`[prefetch] SKIP prefetchNextStep: nextIndex=${nextIndex} >= totalSteps-1=${adventure.totalSteps - 1}`);
    return;
  }

  const nextMode: StoryMode = nextIndex % 2 !== 0 ? 'math_question' : 'story_step';
  console.log(`[prefetch] START prefetchNextStep adventure=${adventure._id.toString()} nextIndex=${nextIndex} mode=${nextMode}`);

  try {
    const state = buildAdventureState(adventure, child, nextMode);
    state.currentStepIndex = nextIndex;

    let llmResponse: LLMStoryStepResponse | LLMMathQuestionResponse;
    // strict=true: if Gemini fails, throw — don't cache a fallback response
    if (nextMode === 'math_question') {
      llmResponse = await llmService.generateMathQuestionFromState(state, true);
    } else {
      llmResponse = await llmService.generateStoryStepFromState(state, true);
    }
    // Generate image now (while user is solving math) and hold in the in-process
    // cache so cache-hit serves are instant.
    const imageUrl = await generateSegmentImage(llmResponse.imageDescription, child.avatarUrl ?? '');
    if (imageUrl) {
      pregeneratedImageCache.set(
        imageCacheKey(adventure._id.toString(), nextIndex),
        imageUrl,
      );
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
      },
    );
    console.log(`[prefetch] SAVED prefetchNextStep adventure=${adventure._id.toString()} mode=${nextMode}`);
  } catch (err) {
    console.warn(`[prefetch] FAIL prefetchNextStep adventure=${adventure._id.toString()}`, err);
  }
}
