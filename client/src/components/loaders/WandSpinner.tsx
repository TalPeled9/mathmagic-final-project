const MM = {
  gold: '#F59E0B',
  goldLight: '#FBBF24',
  purple100: '#EDE9FE',
};

interface WandSpinnerProps {
  size?: number;
  label?: string;
}

export function WandSpinner({ size = 64, label = 'Loading' }: WandSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}
    >
      {/* faint orbit guide */}
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <circle cx="50" cy="50" r="38" fill="none" stroke={MM.purple100} strokeWidth="2" strokeDasharray="2 4" />
      </svg>
      {/* orbiting wand tip */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: 'mm-wand-orbit 1.6s linear infinite',
          transformOrigin: '50% 50%',
        }}
      >
        {/* trailing sparkle dots */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: '50%',
              top: '12%',
              width: size * 0.08,
              height: size * 0.08,
              marginLeft: -size * 0.04,
              borderRadius: '50%',
              background: i === 0 ? MM.gold : MM.goldLight,
              boxShadow: `0 0 ${size * 0.15}px ${MM.gold}`,
              opacity: 1 - i * 0.22,
              transform: `scale(${1 - i * 0.18}) translateY(${i * size * 0.04}px)`,
              animation: `mm-wand-trail 1.6s linear infinite ${-i * 0.08}s`,
            }}
          />
        ))}
        {/* main tip star */}
        <svg
          viewBox="0 0 20 20"
          width={size * 0.22}
          height={size * 0.22}
          style={{ position: 'absolute', left: '50%', top: '10%', marginLeft: -size * 0.11 }}
        >
          <path d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z" fill={MM.gold} />
        </svg>
      </div>
    </div>
  );
}
