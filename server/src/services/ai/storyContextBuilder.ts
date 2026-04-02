import type {
  AdventureState,
  ConversationTurn,
  LLMEndStoryContext,
  LLMHintContext,
  LLMMathQuestionContext,
  LLMStoryPromptContext,
} from '@mathmagic/types';

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
    return `${speaker}: ${t.content}`;
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
    conversationTranscript: buildConversationTranscript(state.conversationTurns),
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
    conversationTranscript: buildConversationTranscript(state.conversationTurns),
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
    conversationTranscript: buildConversationTranscript(state.conversationTurns),
    problemText: state.lastProblemText || '',
    childAnswer: state.lastChildAnswer || '',
    hintLevel: state.attemptCount,
    previousHints: state.previousHints ?? [],
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
