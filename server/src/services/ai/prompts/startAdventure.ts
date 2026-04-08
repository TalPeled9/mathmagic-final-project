import type { LLMStoryPromptContext } from '@mathmagic/types';

export function buildStartAdventurePrompt(ctx: LLMStoryPromptContext): string {
  const isFirstStep = !ctx.storySummary || ctx.storySummary.includes('starting fresh');

  const goalSection = isFirstStep
    ? `GOAL:
Create the opening of the story. Introduce the setting, the mission, or the first interesting situation.
Do NOT include any math challenge or math-related content.
The child should be given story choices that determine how the adventure continues.`
    : `GOAL:
Continue the ongoing story from where it left off. Build on what has already happened.
Do NOT start a new story or re-introduce the setting. Pick up naturally from the previous events.
Do NOT include any math challenge or math-related content.
The child should be given story choices that determine how the adventure continues.

STORY SO FAR:
${ctx.storySummary}

${
  ctx.conversationTranscript
    ? `CONVERSATION HISTORY (most recent turns):
${ctx.conversationTranscript}`
    : ''
}`;

  const storyReqs = isFirstStep
    ? null
    : `- Continue the existing narrative naturally — do NOT re-introduce the world or start over.\n- Build on the previous events and the child's choices.`;

  return `${isFirstStep ? "Generate the first step of a children's interactive math story adventure." : 'Generate the next story step, continuing the adventure already in progress.'}

${goalSection}

CHILD CONTEXT:
- Child grade level: ${ctx.gradeLevel}
- Math topic: ${ctx.mathTopic}
- Story world / theme: ${ctx.storyWorld}
- Child's name: ${ctx.childName}

STORY REQUIREMENTS:
${storyReqs ? `${storyReqs}\n` : ''}- Use the child's name naturally at most once.
- The scene should fit the given story world.
- Create curiosity and a sense of adventure.
- Do not include any math, numbers, or problem-solving in this step.
- Do not reveal future events beyond the current step.

CHOICES REQUIREMENTS:
- Provide exactly 3 story choices.
- Each choice must be short (max 1 sentence).
- Each choice must lead to a clearly different story direction.
- Choices must not include math or answers.
- Choices must be simple and easy for a child to understand.

OUTPUT REQUIREMENTS:
- storyChoices must contain exactly 3 items

FIELD GUIDELINES:
- adventureNarrative: describe the current scene clearly
- wizzyDialogue: spoken line from Wizzy
- storyChoices: array of short strings
- imageDescription: a clear, visual, child-friendly description of the exact scene (characters, setting, mood, key elements)
`;
}
