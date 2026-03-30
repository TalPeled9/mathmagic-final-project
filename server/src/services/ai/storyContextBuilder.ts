import type {
  AdventureState,
  LLMEndStoryContext,
  LLMHintContext,
  LLMMathQuestionContext,
  LLMStoryPromptContext,
} from '@mathmagic/types';

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

    // Current challenge context (especially important in hint mode)
    if (state.lastProblemText) {
      const context = `Challenge: "${state.lastProblemText}"`;
      if (state.mode === 'hint') {
        parts.push(
          `${context} Child answered: "${state.lastChildAnswer}". ` +
            `Attempt ${state.attemptCount} of 3.`
        );
      }
    }
  }

  return parts.join(' ');
}

/**
 * Build the complete LLMStoryPromptContext from AdventureState.
 * Used as base context for start_adventure mode.
 */
export function buildStartAdventureContext(state: AdventureState): LLMStoryPromptContext {
  return {
    childName: state.childName,
    gradeLevel: state.gradeLevel,
    mathTopic: state.mathTopic,
    storyWorld: state.storyWorld,
    storySummary: buildStorySummary(state),
  };
}

/**
 * Build the complete LLMMathQuestionContext from AdventureState.
 * Extends base context with math-specific fields.
 */
export function buildMathQuestionContext(state: AdventureState): LLMMathQuestionContext {
  return {
    childName: state.childName,
    gradeLevel: state.gradeLevel,
    mathTopic: state.mathTopic,
    storyWorld: state.storyWorld,
    storySummary: buildStorySummary(state),
    selectedChoice: state.selectedChoices[state.selectedChoices.length - 1] || 'adventure begins',
    previousEvents: state.recentEvents.slice(-3),
  };
}

/**
 * Build the complete LLMHintContext from AdventureState.
 * Extends base context with hint-specific fields.
 */
export function buildHintContext(state: AdventureState): LLMHintContext {
  return {
    childName: state.childName,
    gradeLevel: state.gradeLevel,
    mathTopic: state.mathTopic,
    storyWorld: state.storyWorld,
    storySummary: buildStorySummary(state),
    problemText: state.lastProblemText || '',
    childAnswer: state.lastChildAnswer || '',
    hintLevel: state.attemptCount, // 1st attempt = level 1, etc.
    previousHints: [], // TODO: track hint history in AdventureState if needed
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
    finalOutcome: state.lastChildAnswer ? 'success' : 'completion',
    solvedProblems: state.selectedChoices.length,
    totalProblems: state.totalSteps,
  };
}
