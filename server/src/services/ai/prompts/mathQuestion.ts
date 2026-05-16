import type { LLMMathQuestionContext } from '@mathmagic/types';

export function buildMathQuestionPrompt(ctx: LLMMathQuestionContext): string {
  return `Generate the next story segment and include exactly one grade-appropriate math question.

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
- Continue naturally from the selected choice.

DIFFICULTY RULES:
- Generate a problem that exactly matches the difficulty description above.
- Wrong answer options must reflect realistic student mistakes for this level:
  off-by-one errors, wrong operation, misplaced digit, forgetting order of operations.
- Do not make the problem easier or harder than the described level.

MATH RULES:
- Include exactly one clear, solvable math problem in problemText.
- Provide exactly 4 answer options in answerOptions.
- Include exactly 1 correct answer in correctAnswer.
- correctAnswer must match one item in answerOptions exactly.
- Keep wrong options plausible.

ANSWER OPTIONS RULES:
- answerOptions must be short and easy to read.
- Avoid trick wording.
- Keep formatting consistent across options.

FIELD GUIDELINES:
- wizzyDialogue: spoken line from Wizzy
- problemText: the challenge question only
- answerOptions: exactly 4 possible answers
- correctAnswer: the one correct option from answerOptions
- imageDescription: visual scene for image generation
`;
}
