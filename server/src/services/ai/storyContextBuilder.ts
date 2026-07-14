import type {
  AdventureState,
  ConversationTurn,
  LLMEndStoryContext,
  LLMHintContext,
  LLMMathQuestionContext,
  LLMStoryPromptContext,
  MathTopicConfig,
} from '@mathmagic/types';
import { getCurriculumTopicById } from '../../config/curriculumTopics';

/**
 * Formats the rolling conversation window into a readable transcript for
 * injection into LLM prompts.  Each line is prefixed with the speaker role
 * so Gemini can follow the narrative thread precisely.
 *
 * Example output:
 *   Wizzy: The enchanted map glows as you enter the forest…
 *   Child: Follow the glowing trail
 *   Wizzy: A riddle appears on the bark of the oldest oak…
 *   System: Correct answer!
 */
export function buildConversationTranscript(turns: ConversationTurn[]): string {
  if (!turns || turns.length === 0) return '';
  const lines = turns.map((t) => {
    const speaker = t.role.charAt(0).toUpperCase() + t.role.slice(1);
    const text = t.role === 'wizzy' && t.dialogue ? t.dialogue : t.content;
    return `${speaker}: ${text}`;
  });
  return lines.join('\n');
}

/**
 * Builds a concise, narrative story summary from the adventure state.
 * This provides Gemini with accurate context of what's happened so far,
 * organized for fluent story continuation.
 *
 * Key principles:
 * - Keep concise (~200-300 chars) to focus Gemini's attention
 * - Prioritize recent events (last 2-3)
 * - Chain events with connectives for narrative flow
 * - Include character/choice context for continuity
 */
export function buildStorySummary(state: AdventureState): string {
  const parts: string[] = [];

  // Opening context: if no events yet, just set the scene
  if (state.recentEvents.length === 0) {
    parts.push(
      `The adventure is starting fresh in ${state.storyWorld}. ` +
        `We're exploring a ${state.mathTopic} challenge.`
    );
  } else {
    // Recent story events (focus on last 2-3 to avoid token bloat)
    const recentEvents = state.recentEvents.slice(-3);
    parts.push(`Story so far: ${recentEvents.join(' Then, ')}.`);

    // Narrative choices made
    if (state.selectedChoices.length > 0) {
      const recentChoices = state.selectedChoices.slice(-2);
      parts.push(`The child chose to ${recentChoices.join(', then ')}.`);
    }
  }

  return parts.join(' ');
}

/**
 * Build the complete LLMStoryPromptContext from AdventureState.
 * Used as base context for story_step mode.
 */
export function buildStoryStepContext(state: AdventureState): LLMStoryPromptContext {
  return {
    childName: state.childName,
    gradeLevel: state.gradeLevel,
    mathTopic: state.mathTopic,
    storyWorld: state.storyWorld,
    storySummary: buildStorySummary(state),
    conversationTranscript: buildConversationTranscript(state.conversationTurns),
  };
}

/** Index into a variant array for (seed, stepIndex) — shared by variant and clock gating. */
export function pickVariantIndex(length: number, seed: number, stepIndex: number): number {
  return (seed + stepIndex) % length;
}

/**
 * Deterministically picks one difficulty-description variant.
 * Plain strings pass through; arrays rotate by (seed + stepIndex) % length.
 * MUST stay deterministic from (description, seed, stepIndex): the same variant is
 * resolved at pre-generation time, serve time, and hint time (currentStepIndex is
 * stable across all three for a given question).
 */
export function pickVariant(
  description: string | string[],
  seed: number,
  stepIndex: number
): string {
  if (!Array.isArray(description)) return description;
  if (description.length === 0) return '';
  return description[pickVariantIndex(description.length, seed, stepIndex)];
}

/**
 * Deterministically picks the "H:MM" a clock-reading question displays, or undefined when
 * no clock applies (no clockFor entry, or the rotation picked a non-clock variant).
 * Same (seed, stepIndex) inputs as pickVariant — the prefetch/serve/hint invariant holds.
 */
export function pickClockTime(
  topic: MathTopicConfig | undefined,
  difficulty: 'easy' | 'medium' | 'hard',
  seed: number,
  stepIndex: number
): string | undefined {
  if (!topic) return undefined;
  const clockCfg = topic.clockFor?.[difficulty];
  if (!clockCfg || clockCfg.minutes.length === 0) return undefined;

  if (clockCfg.variants !== 'all') {
    const description = topic.difficulty[difficulty];
    const variantIndex = Array.isArray(description)
      ? pickVariantIndex(description.length, seed, stepIndex)
      : 0;
    if (!clockCfg.variants.includes(variantIndex)) return undefined;
  }

  const hour = ((seed + stepIndex * 5) % 12) + 1;
  const minute = clockCfg.minutes[(seed + stepIndex) % clockCfg.minutes.length];
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

/** Cheap deterministic string hash → non-negative int, for per-adventure variant rotation. */
export function hashStringToSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Build the complete LLMMathQuestionContext from AdventureState.
 * Extends base context with math-specific fields.
 */
export function buildMathQuestionContext(state: AdventureState): LLMMathQuestionContext {
  const topic = getCurriculumTopicById(state.mathTopic);
  const difficultyDescription = pickVariant(
    topic?.difficulty[state.currentDifficulty] ?? '',
    state.variantSeed ?? 0,
    state.currentStepIndex
  );
  const requireExpression = topic?.expressionFor?.includes(state.currentDifficulty) ?? false;
  return {
    childName: state.childName,
    gradeLevel: state.gradeLevel,
    mathTopic: state.mathTopic,
    storyWorld: state.storyWorld,
    storySummary: buildStorySummary(state),
    selectedChoice: state.selectedChoices[state.selectedChoices.length - 1] || 'adventure begins',
    currentDifficulty: state.currentDifficulty,
    difficultyDescription,
    requireExpression,
    previousProblemTexts: state.previousProblemTexts ?? [],
    previousScaffoldQuestions: state.previousScaffoldQuestions ?? [],
    clockTime: pickClockTime(
      topic,
      state.currentDifficulty,
      state.variantSeed ?? 0,
      state.currentStepIndex
    ),
  };
}

/**
 * Build the complete LLMHintContext from AdventureState.
 * Extends base context with hint-specific fields.
 */
export function buildHintContext(state: AdventureState): LLMHintContext {
  const topic = getCurriculumTopicById(state.mathTopic);
  const difficultyDescription = pickVariant(
    topic?.difficulty[state.currentDifficulty] ?? '',
    state.variantSeed ?? 0,
    state.currentStepIndex
  );
  return {
    childName: state.childName,
    gradeLevel: state.gradeLevel,
    mathTopic: state.mathTopic,
    storyWorld: state.storyWorld,
    storySummary: buildStorySummary(state),
    conversationTranscript: buildConversationTranscript(state.conversationTurns),
    problemText: state.lastProblemText || '',
    mathExpression: state.lastMathExpression,
    childAnswer: state.lastChildAnswer || '',
    hintLevel: state.hintLevel,
    previousHints: state.previousHints ?? [],
    previousProblemTexts: state.previousProblemTexts ?? [],
    previousScaffoldQuestions: state.previousScaffoldQuestions ?? [],
    currentDifficulty: state.currentDifficulty,
    difficultyDescription,
  };
}

/**
 * Build the complete LLMEndStoryContext from AdventureState.
 * Extends base context with end-story-specific fields.
 */
export function buildEndStoryContext(state: AdventureState): LLMEndStoryContext {
  return {
    childName: state.childName,
    gradeLevel: state.gradeLevel,
    mathTopic: state.mathTopic,
    storyWorld: state.storyWorld,
    storySummary: buildStorySummary(state),
    conversationTranscript: buildConversationTranscript(state.conversationTurns),
    finalOutcome: state.lastChildAnswer ? 'success' : 'completion',
    solvedProblems: state.selectedChoices.length,
    totalProblems: state.totalSteps,
  };
}
