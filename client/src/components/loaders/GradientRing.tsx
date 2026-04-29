const MM = {
  purple: '#8B5CF6',
  indigo: '#6366F1',
  purple100: '#EDE9FE',
};

interface GradientRingProps {
  size?: number;
  thickness?: number;
  label?: string;
}

export function GradientRing({ size = 48, thickness = 4, label = 'Loading' }: GradientRingProps) {
  return (
    <div
      role="status"
      aria-label={label}
      style={{ width: size, height: size, display: 'inline-block', position: 'relative', flexShrink: 0 }}
    >
      <svg
        viewBox="0 0 50 50"
        width={size}
        height={size}
        style={{ animation: 'mm-ring-spin 0.9s linear infinite' }}
      >
        <defs>
          <linearGradient id="mm-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={MM.purple} />
            <stop offset="100%" stopColor={MM.indigo} stopOpacity="0" />
          </linearGradient>
        </defs>
        <circle cx="25" cy="25" r="20" fill="none" stroke={MM.purple100} strokeWidth={thickness} />
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="url(#mm-ring-grad)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray="90 150"
        />
      </svg>
    </div>
  );
}
