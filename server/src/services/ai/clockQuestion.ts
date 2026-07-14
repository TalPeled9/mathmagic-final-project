/**
 * Server-authored content for clock-reading questions. The server picks the time
 * (storyContextBuilder.pickClockTime); this module builds everything derived from it:
 * the four answer options, leak masking, and the all-providers-failed fallback.
 * The LLM never chooses times or answers for clock questions.
 */

const HOUR_WORDS = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
];

const CLOCK_TIME_PATTERN = /^(1[0-2]|[1-9]):(00|15|30|45)$/;

function parseClockTime(clockTime: string): { hour: number; minute: number } {
  const match = clockTime.match(CLOCK_TIME_PATTERN);
  if (!match) throw new Error(`Invalid clock time: ${clockTime}`);
  return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) };
}

function formatClockTime(hour: number, minute: number): string {
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

/** Minute-hand misreading: :00 ↔ :30, :15 ↔ :45. */
function flipMinute(minute: number): number {
  switch (minute) {
    case 0:
      return 30;
    case 30:
      return 0;
    case 15:
      return 45;
    default:
      return 15;
  }
}

/**
 * 4 unique "H:MM" options containing clockTime — the standard kid misreadings:
 * hour hand one ahead, one behind, and the flipped minute hand. Deterministically
 * rotated by (hour + minute) % 4 so the correct answer's position varies across times.
 */
export function generateClockOptions(clockTime: string): [string, string, string, string] {
  const { hour, minute } = parseClockTime(clockTime);
  const options = [
    clockTime,
    formatClockTime((hour % 12) + 1, minute),
    formatClockTime(((hour + 10) % 12) + 1, minute),
    formatClockTime(hour, flipMinute(minute)),
  ];
  const rotation = (hour + minute) % 4;
  return [...options.slice(rotation), ...options.slice(0, rotation)] as [
    string,
    string,
    string,
    string,
  ];
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replaces every rendering of clockTime (digital and English word forms) with "_______".
 * Safety net behind the prompt's no-leak rule — reading the clock is the child's task,
 * so the time must never appear in the story text.
 */
export function maskClockTimeLeaks(text: string, clockTime: string): string {
  const match = clockTime.match(CLOCK_TIME_PATTERN);
  if (!match) return text;
  const hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const mm = String(minute).padStart(2, '0');
  const hourWord = HOUR_WORDS[hour - 1];
  const nextHour = (hour % 12) + 1;
  const nextHourWord = HOUR_WORDS[nextHour - 1];

  // Digital forms (deliberately no "H.MM" form — it collides with decimal measurements in story text)
  const phrases = [`${hour}:${mm}`, `0${hour}:${mm}`];
  // Word forms (enumeration is deliberately non-exhaustive; prompt rule is the primary defense)
  if (minute === 0) {
    // Both straight (') and curly (’ U+2019) apostrophes — Gemini often emits curly in prose.
    phrases.push(
      `${hourWord} o'clock`,
      `${hour} o'clock`,
      `${hourWord} o’clock`,
      `${hour} o’clock`
    );
  } else if (minute === 30) {
    phrases.push(`half past ${hourWord}`, `half past ${hour}`, `${hourWord} thirty`);
  } else if (minute === 15) {
    phrases.push(`quarter past ${hourWord}`, `quarter past ${hour}`, `${hourWord} fifteen`);
  } else {
    phrases.push(
      `quarter to ${nextHourWord}`,
      `quarter to ${nextHour}`,
      `${hourWord} forty-five`,
      `${hourWord} forty five`
    );
  }

  let result = text;
  for (const phrase of phrases) {
    const pattern = new RegExp(`(?<![\\w:])${escapeRegExp(phrase)}(?![\\w:])`, 'gi');
    result = result.replace(pattern, '_______');
  }
  return result;
}

/**
 * Fully server-built math_question response for clock questions when all LLM
 * providers fail — a clock question cannot fail to render.
 */
export function buildClockFallbackResponse(childName: string, clockTime: string) {
  return {
    adventureNarrative: `${childName} and Wizzy arrive at a grand tower where a giant clock guards the way forward. "Only a clever time-reader can open this gate!" Wizzy whispers, pointing up at it.`,
    wizzyDialogue: `Look closely, ${childName} — you can read it!`,
    problemText: 'What time does the clock show?',
    answerOptions: generateClockOptions(clockTime),
    correctAnswer: clockTime,
    clockTime,
    imageDescription:
      'A cheerful cartoon scene of a child avatar and Wizzy standing before a tall magical tower gate, the child pointing upward with a curious, determined expression. No clock or watch is visible in the scene.',
  };
}
