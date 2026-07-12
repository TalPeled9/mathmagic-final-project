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
  g3_multiplication_table: EASY_MEDIUM,
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
  g6_percentages: ['easy'],
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
