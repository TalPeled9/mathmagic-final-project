interface MagicBackgroundProps {
  count?: number;
  symbols?: 'stars' | 'math' | 'mixed';
  opacity?: number;
}

const STAR_SYMBOLS = ['★', '✦', '✧', '⭐', '✨', '💫'];
const MATH_SYMBOLS = ['+', '×', '÷', '−', 'π', '∑', '∞', '%', '='];
const MIXED_SYMBOLS = ['★', '✦', '+', '×', '÷', '✧', 'π', '⭐', '∞', '✨', '−', '%'];

const FLOAT_ANIMS = ['particle-float-a', 'particle-float-b', 'particle-float-c'];

// Deterministic pseudo-random based on index to avoid layout shift
function deterministicValue(index: number, multiplier: number, offset: number = 0): number {
  return ((index * 137.508 + offset) % multiplier);
}

export default function MagicBackground({
  count = 18,
  symbols = 'mixed',
  opacity = 0.1,
}: MagicBackgroundProps) {
  const pool =
    symbols === 'stars' ? STAR_SYMBOLS : symbols === 'math' ? MATH_SYMBOLS : MIXED_SYMBOLS;

  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    symbol: pool[i % pool.length],
    left: deterministicValue(i, 92, 4),
    top: deterministicValue(i * 3, 88, 6),
    size: 12 + deterministicValue(i, 18, 2),
    duration: 6 + deterministicValue(i, 8, 1),
    delay: deterministicValue(i * 7, 5000) / 1000,
    anim: FLOAT_ANIMS[i % FLOAT_ANIMS.length],
  }));

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ pointerEvents: 'none', zIndex: 0 }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${p.top}%`,
            fontSize: `${p.size}px`,
            opacity,
            animation: `${p.anim} ${p.duration}s ease-in-out ${p.delay}s infinite`,
            color: p.id % 3 === 0 ? '#8b5cf6' : p.id % 3 === 1 ? '#f59e0b' : '#a78bfa',
            userSelect: 'none',
          }}
        >
          {p.symbol}
        </span>
      ))}
    </div>
  );
}
