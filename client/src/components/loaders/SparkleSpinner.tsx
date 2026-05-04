const MM = {
  gold: '#F59E0B',
  goldLight: '#FBBF24',
};

interface SparkleSpinnerProps {
  size?: number;
  label?: string;
}

export function SparkleSpinner({ size = 56, label = 'Loading' }: SparkleSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        style={{ animation: 'mm-sparkle-spin 3.2s linear infinite' }}
      >
        <defs>
          <radialGradient id="sparkA" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FDE68A" />
            <stop offset="60%" stopColor={MM.gold} />
            <stop offset="100%" stopColor="#D97706" />
          </radialGradient>
        </defs>
        {/* main 4-point star */}
        <g
          style={{
            transformOrigin: '50% 50%',
            animation: 'mm-sparkle-pulse 1.4s ease-in-out infinite',
          }}
        >
          <path d="M50 6 L57 43 L94 50 L57 57 L50 94 L43 57 L6 50 L43 43 Z" fill="url(#sparkA)" />
        </g>
        {/* secondary mini-stars */}
        <g
          style={{
            transformOrigin: '20% 22%',
            animation: 'mm-sparkle-pulse-b 1.4s ease-in-out infinite 0.2s',
          }}
        >
          <path
            d="M20 10 L22 20 L32 22 L22 24 L20 34 L18 24 L8 22 L18 20 Z"
            fill={MM.gold}
            opacity="0.9"
          />
        </g>
        <g
          style={{
            transformOrigin: '82% 78%',
            animation: 'mm-sparkle-pulse-b 1.4s ease-in-out infinite 0.5s',
          }}
        >
          <path
            d="M82 72 L84 79 L91 82 L84 85 L82 92 L80 85 L73 82 L80 79 Z"
            fill={MM.goldLight}
            opacity="0.9"
          />
        </g>
      </svg>
    </div>
  );
}
