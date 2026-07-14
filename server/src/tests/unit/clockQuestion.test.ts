import { describe, it, expect } from 'vitest';
import {
  generateClockOptions,
  maskClockTimeLeaks,
  buildClockFallbackResponse,
} from '../../services/ai/clockQuestion';

describe('generateClockOptions', () => {
  it('returns 4 unique valid H:MM options containing the correct time', () => {
    for (const time of ['3:00', '12:30', '1:15', '9:45', '11:00']) {
      const options = generateClockOptions(time);
      expect(options).toHaveLength(4);
      expect(new Set(options).size).toBe(4);
      expect(options).toContain(time);
      for (const opt of options) {
        expect(opt).toMatch(/^(1[0-2]|[1-9]):(00|15|30|45)$/);
      }
    }
  });

  it('builds the three standard misreadings for 3:30', () => {
    const options = generateClockOptions('3:30');
    expect(new Set(options)).toEqual(new Set(['3:30', '4:30', '2:30', '3:00']));
  });

  it('wraps hours at 12 and 1', () => {
    expect(new Set(generateClockOptions('12:00'))).toEqual(
      new Set(['12:00', '1:00', '11:00', '12:30'])
    );
    expect(new Set(generateClockOptions('1:15'))).toEqual(
      new Set(['1:15', '2:15', '12:15', '1:45'])
    );
  });

  it('is deterministic and does not always put the correct answer first', () => {
    expect(generateClockOptions('3:30')).toEqual(generateClockOptions('3:30'));
    const firsts = ['3:00', '4:15', '7:30', '10:45'].map((t) => generateClockOptions(t)[0]);
    expect(firsts.some((first, i) => first !== ['3:00', '4:15', '7:30', '10:45'][i])).toBe(true);
  });

  it('throws on an invalid time', () => {
    expect(() => generateClockOptions('25:99')).toThrow();
  });
});

describe('maskClockTimeLeaks', () => {
  it('masks digital renderings', () => {
    expect(maskClockTimeLeaks('The clock reads 3:30 tonight.', '3:30')).toBe(
      'The clock reads _______ tonight.'
    );
    expect(maskClockTimeLeaks('It shows 03:30 now.', '3:30')).toBe('It shows _______ now.');
  });

  it('does not mask dot form to avoid colliding with decimal measurements', () => {
    expect(maskClockTimeLeaks('At 3.30 sharp.', '3:30')).toBe('At 3.30 sharp.');
    expect(maskClockTimeLeaks('The rope was 3.00 meters long.', '3:00')).toBe(
      'The rope was 3.00 meters long.'
    );
  });

  it('does not mask a different time or embedded digits', () => {
    expect(maskClockTimeLeaks('It is 4:30 already.', '3:30')).toBe('It is 4:30 already.');
    expect(maskClockTimeLeaks('Route 13:30 departs.', '3:30')).toBe('Route 13:30 departs.');
  });

  it('masks word renderings case-insensitively per minute case', () => {
    expect(maskClockTimeLeaks('It is Half Past Three!', '3:30')).toBe('It is _______!');
    expect(maskClockTimeLeaks("It's three o'clock.", '3:00')).toBe("It's _______.");
    expect(maskClockTimeLeaks('quarter past nine', '9:15')).toBe('_______');
    expect(maskClockTimeLeaks('quarter to ten', '9:45')).toBe('_______');
  });

  it('masks curly-apostrophe o’clock variants', () => {
    expect(maskClockTimeLeaks('It’s three o’clock.', '3:00')).toBe('It’s _______.');
  });

  it('wraps the next-hour word for 12:45', () => {
    expect(maskClockTimeLeaks('quarter to one', '12:45')).toBe('_______');
  });

  it('is a no-op on clean text', () => {
    const text = 'Wizzy points at the great clock above the gate.';
    expect(maskClockTimeLeaks(text, '3:30')).toBe(text);
  });
});

describe('buildClockFallbackResponse', () => {
  it('builds a complete, self-consistent clock question', () => {
    const fb = buildClockFallbackResponse('Alice', '7:30');
    expect(fb.correctAnswer).toBe('7:30');
    expect(fb.clockTime).toBe('7:30');
    expect(fb.answerOptions).toContain('7:30');
    expect(fb.adventureNarrative).toContain('Alice');
    expect(fb.problemText.toLowerCase()).toContain('what time');
    expect(fb.adventureNarrative).not.toContain('7:30');
    expect(fb.imageDescription.toLowerCase()).not.toContain('clock face');
  });
});
