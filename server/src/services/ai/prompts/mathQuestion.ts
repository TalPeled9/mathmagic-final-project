import type { LLMMathQuestionContext } from '@mathmagic/types';

export function buildMathQuestionPrompt(ctx: LLMMathQuestionContext): string {
  const uniquenessBlock =
    ctx.previousProblemTexts && ctx.previousProblemTexts.length > 0
      ? `
UNIQUENESS RULES:
- These problems were already asked in this adventure — do NOT reuse the same combination of numbers:
${ctx.previousProblemTexts.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
- Vary the number combinations even if the operation is the same.
`
      : '';

  return `Generate the next story segment that includes exactly one grade-appropriate math question, woven NATURALLY into the narrative.

CHILD CONTEXT:
- Child's name: ${ctx.childName}
- Child grade level: ${ctx.gradeLevel}
- Math topic: ${ctx.mathTopic}
- Story world / theme: ${ctx.storyWorld}
- Selected story choice: ${ctx.selectedChoice}
- Story summary so far: ${ctx.storySummary ?? 'Not provided'}
- Difficulty level: ${(ctx.currentDifficulty ?? 'easy').toUpperCase()}
- What this means for this topic: ${ctx.difficultyDescription ?? ''}

STORY RULES:
- adventureNarrative MUST continue naturally from the selected choice.
- The math situation must arise ORGANICALLY from the story — the actual numbers or quantities must appear INSIDE adventureNarrative as story elements (e.g. "5 golden keys on the left shelf and 7 on the right").
- problemText then asks the child to solve what was just described in the narrative.
- The math must feel like a natural story moment — NOT a school quiz interruption.
- Do NOT re-introduce the world or restart the story; build directly on what already happened.

DIFFICULTY RULES:
- Generate a problem that exactly matches the difficulty description above.
- Wrong answer options must reflect realistic student mistakes for this level:
  off-by-one errors, wrong operation, misplaced digit, forgetting order of operations.
- Do not make the problem easier or harder than the described level.
${uniquenessBlock}
MATH RULES:
- Include exactly one clear, solvable math problem embedded within adventureNarrative.
- problemText is a short, direct question referencing the story situation (may echo story elements).
- Provide exactly 4 answer options in answerOptions.
- Include exactly 1 correct answer in correctAnswer.
- correctAnswer must match one item in answerOptions exactly.
- Keep wrong options plausible.

ANSWER OPTIONS RULES:
- answerOptions must be short and easy to read.
- Avoid trick wording.
- Keep formatting consistent across options.

FIELD GUIDELINES:
- adventureNarrative: 2-3 sentence story paragraph that continues the adventure and naturally introduces the math situation with the actual numbers woven into the scene
- wizzyDialogue: short, encouraging spoken line from Wizzy that motivates the child to solve the challenge
- problemText: the direct math question (can reference story elements, e.g. "How many keys are there in total?")
- answerOptions: exactly 4 possible answers
- correctAnswer: the one correct option from answerOptions
- imageDescription: visual scene for image generation. MUST include: (1) the child's facial expression matching the story moment (e.g. puzzled, focused, determined), (2) the child's body position or action (e.g. counting on fingers, leaning forward, pointing at objects — never standing still), (3) the setting and math-relevant story elements visible in the scene
`;
}
