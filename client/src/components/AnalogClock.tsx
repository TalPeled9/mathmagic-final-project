interface AnalogClockProps {
  time: string; // "H:MM", 12-hour
  size?: number;
}

const CENTER = 50;

export function AnalogClock({ time, size = 140 }: AnalogClockProps) {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = parseInt(match[1], 10) % 12;
  const minute = parseInt(match[2], 10);

  const hourAngle = hour * 30 + minute * 0.5;
  const minuteAngle = minute * 6;

  const numerals = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const angle = ((n * 30 - 90) * Math.PI) / 180;
    return { n, x: CENTER + 38 * Math.cos(angle), y: CENTER + 38 * Math.sin(angle) };
  });

  const ticks = Array.from({ length: 12 }, (_, i) => {
    const angle = ((i * 30 - 90) * Math.PI) / 180;
    return {
      x1: CENTER + 43 * Math.cos(angle),
      y1: CENTER + 43 * Math.sin(angle),
      x2: CENTER + 46 * Math.cos(angle),
      y2: CENTER + 46 * Math.sin(angle),
    };
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Analog clock — read the time from the hands"
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={47}
        fill="white"
        stroke="rgba(139,92,246,0.45)"
        strokeWidth={3}
      />
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.x1}
          y1={t.y1}
          x2={t.x2}
          y2={t.y2}
          stroke="#8b5cf6"
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      ))}
      {numerals.map(({ n, x, y }) => (
        <text
          key={n}
          x={x}
          y={y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={9}
          fontWeight={800}
          fill="#4c1d95"
        >
          {n}
        </text>
      ))}
      <line
        x1={CENTER}
        y1={CENTER}
        x2={CENTER}
        y2={CENTER - 20}
        stroke="#4c1d95"
        strokeWidth={4}
        strokeLinecap="round"
        transform={`rotate(${hourAngle} ${CENTER} ${CENTER})`}
      />
      <line
        x1={CENTER}
        y1={CENTER}
        x2={CENTER}
        y2={CENTER - 30}
        stroke="#7c3aed"
        strokeWidth={2.5}
        strokeLinecap="round"
        transform={`rotate(${minuteAngle} ${CENTER} ${CENTER})`}
      />
      <circle cx={CENTER} cy={CENTER} r={2.5} fill="#4c1d95" />
    </svg>
  );
}
