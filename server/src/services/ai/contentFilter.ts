const BLOCKED_PATTERNS = [
  /\bviolence\b/i,
  /\bweapon\b/i,
  /\bblood\b/i,
  /\bkill\b/i,
  /\bdeath\b/i,
  /\bscary\b/i,
  /\bhorror\b/i,
];

export function validateAIResponse(text: string): { safe: boolean; reason?: string } {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { safe: false, reason: `Content matched blocked pattern: ${pattern}` };
    }
  }

  return { safe: true };
}

export function sanitizeForChild(text: string): string {
  // Strip simple HTML tags and trim whitespace before showing text to children.
  return text.replace(/<[^>]*>/g, '').trim();
}

function sanitizeAndValidateText(text: string, fieldPath: string): string {
  const sanitized = sanitizeForChild(text);
  const safetyCheck = validateAIResponse(sanitized);

  if (!safetyCheck.safe) {
    throw new Error(
      `Unsafe AI response in ${fieldPath}: ${safetyCheck.reason ?? 'Unknown reason'}`
    );
  }

  return sanitized;
}

export function sanitizeAndValidateAIResponse<T>(value: T): T {
  return sanitizeAndValidateRecursive(value, 'response');
}

function sanitizeAndValidateRecursive<T>(value: T, fieldPath: string): T {
  if (typeof value === 'string') {
    return sanitizeAndValidateText(value, fieldPath) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) =>
      sanitizeAndValidateRecursive(item, `${fieldPath}[${index}]`)
    ) as T;
  }

  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(obj)) {
      result[key] = sanitizeAndValidateRecursive(nestedValue, `${fieldPath}.${key}`);
    }

    return result as T;
  }

  return value;
}
