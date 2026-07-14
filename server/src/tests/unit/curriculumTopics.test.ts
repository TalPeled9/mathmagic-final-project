import { describe, it, expect } from 'vitest';
import { CURRICULUM_TOPICS, getCurriculumTopicById } from '../../config/curriculumTopics';

const ALL: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard'];
const EASY_MEDIUM: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium'];

// Spec: docs/superpowers/specs/2026-07-08-math-expressions-design.md §1
const EXPECTED_FLAGS: Record<string, Array<'easy' | 'medium' | 'hard'>> = {
  g1_addition: ALL,
  g1_subtraction: ALL,
  g2_addition_subtraction: ALL,
  g2_multiplication_intro: ALL,
  g2_division_intro: ALL,
  g3_addition_subtraction: EASY_MEDIUM,
  g3_multiplication_table: ALL,
  g3_division_remainder: EASY_MEDIUM,
  g3_order_of_operations: EASY_MEDIUM,
  g3_simple_fractions: ['hard'],
  g4_addition_subtraction: EASY_MEDIUM,
  g4_long_multiplication_division: ALL,
  g4_fractions_extended: ['hard'],
  g4_order_of_operations_advanced: EASY_MEDIUM,
  g5_fractions_operations: ALL,
  g5_decimal_numbers: ALL,
  g5_large_number_operations: EASY_MEDIUM,
  g6_fractions_decimals_add_sub: EASY_MEDIUM,
  g6_fractions_mul_div: EASY_MEDIUM,
  g6_decimals_mul_div: EASY_MEDIUM,
};

describe('curriculumTopics — expressionFor flags', () => {
  it('flags exactly the topics from the spec with the exact difficulty lists', () => {
    for (const [id, expected] of Object.entries(EXPECTED_FLAGS)) {
      expect(getCurriculumTopicById(id)?.expressionFor, id).toEqual(expected);
    }
  });

  it('leaves every other topic unflagged', () => {
    for (const topic of CURRICULUM_TOPICS) {
      if (!(topic.id in EXPECTED_FLAGS)) {
        expect(topic.expressionFor, topic.id).toBeUndefined();
      }
    }
  });
});

describe('curriculumTopics — clockFor flags', () => {
  it('marks exactly the clock-reading levels', () => {
    expect(getCurriculumTopicById('g1_time_clock')?.clockFor).toEqual({
      easy: { variants: 'all', minutes: [0] },
      hard: { variants: [0], minutes: [30] },
    });
    expect(getCurriculumTopicById('g2_time_clock')?.clockFor).toEqual({
      easy: { variants: 'all', minutes: [15, 30, 45] },
    });
  });

  it('leaves every other topic without clockFor', () => {
    for (const topic of CURRICULUM_TOPICS) {
      if (topic.id !== 'g1_time_clock' && topic.id !== 'g2_time_clock') {
        expect(topic.clockFor, topic.id).toBeUndefined();
      }
    }
  });
});

describe('curriculumTopics — format-rule sentences', () => {
  const NO_PARENS = 'Do not use any parentheses in the expression or the question.';
  const DIGIT_FRACTIONS =
    'Write all fractions in the question and answer options in digits (e.g., a/b), never spelled out in words.';

  it('every order-of-operations easy variant forbids parentheses', () => {
    for (const id of ['g3_order_of_operations', 'g4_order_of_operations_advanced']) {
      const easy = getCurriculumTopicById(id)?.difficulty.easy;
      expect(Array.isArray(easy), id).toBe(true);
      expect((easy as string[]).length, id).toBe(4);
      for (const variant of easy as string[]) {
        expect(variant.endsWith(NO_PARENS), `${id}: ${variant}`).toBe(true);
      }
    }
  });

  it('order-of-operations medium and hard are untouched (parentheses are the point)', () => {
    for (const id of ['g3_order_of_operations', 'g4_order_of_operations_advanced']) {
      const topic = getCurriculumTopicById(id);
      for (const variant of topic?.difficulty.medium as string[]) {
        expect(variant.includes(NO_PARENS), id).toBe(false);
      }
      expect((topic?.difficulty.hard as string).includes(NO_PARENS), id).toBe(false);
    }
  });

  it('g4 fractions easy variants and medium require digit fractions', () => {
    const topic = getCurriculumTopicById('g4_fractions_extended');
    const easy = topic?.difficulty.easy as string[];
    expect(easy.length).toBe(2);
    for (const variant of easy) {
      expect(variant.endsWith(DIGIT_FRACTIONS), variant).toBe(true);
    }
    expect((topic?.difficulty.medium as string).endsWith(DIGIT_FRACTIONS)).toBe(true);
    expect((topic?.difficulty.hard as string).includes(DIGIT_FRACTIONS)).toBe(false);
  });
});
