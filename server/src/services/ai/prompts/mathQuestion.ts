import type { LLMMathQuestionContext } from '@mathmagic/types';

export function buildMathQuestionPrompt(ctx: LLMMathQuestionContext): string {
  const askedQuestions = [
    ...(ctx.previousProblemTexts ?? []),
    ...(ctx.previousScaffoldQuestions ?? []),
  ];
  const uniquenessBlock =
    askedQuestions.length > 0
      ? `
UNIQUENESS RULES:
- These questions were already asked in this adventure (as math problems or hint questions) — do NOT reuse the same combination of numbers:
${askedQuestions.map((p, i) => `  ${i + 1}. ${p}`).join('\n')}
- Vary the number combinations even if the operation is the same.
- Do not reuse more than one number from any previous question in a new problem.
`
      : '';

  const expressionBlock = ctx.requireExpression
    ? `
MATH EXPRESSION RULES:
- Also return mathExpression: the symbolic form of the exact problem described in the narrative.
- Use the exact numbers that appear in adventureNarrative.
- Use "?" for the unknown value (e.g. "3 + 5 = ?", "15 − ? = 7", "6 + ? = 14").
- Use only digits, operator symbols (+ − × ÷ =), fraction/decimal notation, and "?" — no words.
- The expression must NOT reveal the answer — the unknown is always "?".
- The expression and problemText must describe the SAME problem: replacing "?" with correctAnswer makes the expression true.
`
    : '';

  const clockBlock = ctx.clockTime
    ? `
CLOCK RULES (these OVERRIDE any other rule about answer options):
- The app displays a large analog clock beside the question. It shows exactly ${ctx.clockTime}.
- The question asks the child to READ this clock: problemText must ask what time the clock shows, woven into the story (e.g. "The gate opens only for a time-reader — what time does the great clock show?").
- Do NOT state the time ${ctx.clockTime} anywhere in adventureNarrative, problemText, or wizzyDialogue — not in digits and not in words. Reading the clock IS the child's task.
- Do NOT produce answerOptions or correctAnswer — the app supplies them.
- imageDescription must NOT include any clock, watch, or timepiece; describe the scene without one.
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

TOPIC FIDELITY RULES:
- The question TYPE must match the math topic and the difficulty description above exactly.
- NEVER fall back to a generic addition word problem when the topic is about something else
  (number recognition, comparing/ordering, shapes, clocks, measurement, patterns, place value).
- If the difficulty description still offers alternatives, vary the choice between questions.
- Never copy the example numbers from the difficulty description — always invent different numbers.
- Use metric units only (cm, m, km, g, kg, ml, l) — never feet, inches, miles, pounds, or ounces.
- Write mixed numbers with a space between the whole part and the fraction (e.g. "2 3/4") and
  spell them out in words inside adventureNarrative (e.g. "two and three quarters").
- adventureNarrative and problemText must NOT state or reveal the correct answer.
${uniquenessBlock}${expressionBlock}${clockBlock}MATH RULES:
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
- imageDescription: visual scene for image generation. MUST include: (1) the child's facial expression matching the story moment (e.g. puzzled, focused, determined), (2) the child's body position or action (e.g. counting on fingers, leaning forward, pointing at objects — never standing still), (3) the setting and math-relevant story elements visible in the scene, (4) if the child must read information from the image to answer (a clock time, a shape, a fraction diagram, objects to count), describe that object exactly and unambiguously (e.g. "a large analog clock, hour hand pointing at 3, minute hand pointing at 12") and make it the visual centerpiece — the image must never contain the answer written as text or the object labeled with its name
`;
}
