import type { ReactNode } from 'react';

/**
 * Fractions like "3/4" and mixed numbers like "2 3/4" are matched only when
 * not butted against another digit or slash, so "1/2/3" and version-like
 * strings pass through untouched.
 */
const FRACTION_RE = /(?<![\d/])(?:(\d+) )?(\d+)\/(\d+)(?![\d/])/g;

/**
 * Renders a plain string with every fraction shown in proper stacked
 * mathematical notation (numerator over a bar over denominator). All other
 * text passes through unchanged; the fraction inherits the surrounding
 * color and weight so it works inside any bubble, badge, or button.
 */
export default function MathText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(FRACTION_RE)) {
    const [full, whole, numerator, denominator] = match;
    const start = match.index ?? 0;
    if (start > last) parts.push(text.slice(last, start));
    parts.push(
      <span key={start} className="whitespace-nowrap">
        {whole && <span>{whole}&thinsp;</span>}
        <span
          className="inline-flex flex-col items-center leading-tight mx-0.5 align-middle"
          style={{ fontSize: '0.72em' }}
        >
          <span>{numerator}</span>
          <span className="border-t border-current px-0.5">{denominator}</span>
        </span>
      </span>
    );
    last = start + full.length;
  }

  if (parts.length === 0) return <>{text}</>;
  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}
