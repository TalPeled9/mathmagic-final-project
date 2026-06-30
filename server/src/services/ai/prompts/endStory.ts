import type { LLMEndStoryContext } from '@mathmagic/types';

export function buildEndStoryPrompt(ctx: LLMEndStoryContext): string {
  return `Generate the final ending segment of the adventure.

CHILD CONTEXT:
- Child's name: ${ctx.childName}
- Child grade level: ${ctx.gradeLevel}
- Math topic: ${ctx.mathTopic}
- Story world / theme: ${ctx.storyWorld}
- Final outcome: ${ctx.finalOutcome}
- Problems solved: ${ctx.solvedProblems ?? 'Unknown'} / ${ctx.totalProblems ?? 'Unknown'}
- Story summary so far: ${ctx.storySummary}
${
  ctx.conversationTranscript
    ? `
CONVERSATION HISTORY (full session — use to write a personalised, specific recap):
${ctx.conversationTranscript}
`
    : ''
}
ENDING RULES:
- This is the final step. Provide closure.
- Keep tone celebratory and warm.
- Mention growth, effort, or bravery.
- No new challenge should appear.
- No further choices should be offered.

FIELD GUIDELINES:
- wizzyDialogue: celebration line
- recap: 2-3 sentence summary of what the child achieved
- celebration: one sentence of praise
- imageDescription: final celebratory scene visual. MUST include: (1) the child's facial expression (e.g. beaming with pride, laughing, triumphant), (2) the child's body position or action (e.g. arms raised in victory, jumping for joy, holding a trophy — never standing still), (3) the setting and celebratory elements around them
`;
}
