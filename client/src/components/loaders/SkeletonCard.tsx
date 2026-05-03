const MM = {
  purple100: '#EDE9FE',
};

const shimmerStyle: React.CSSProperties = {
  background: `linear-gradient(90deg, ${MM.purple100} 0%, #FAF5FF 50%, ${MM.purple100} 100%)`,
  backgroundSize: '400px 100%',
  animation: 'mm-skel-shimmer 1.4s linear infinite',
  borderRadius: 8,
};

interface SkeletonCardProps {
  kind?: 'adventure' | 'row';
}

export function SkeletonCard({ kind = 'adventure' }: SkeletonCardProps) {
  if (kind === 'adventure') {
    return (
      <div
        style={{
          width: 240,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'white',
          border: `1px solid ${MM.purple100}`,
          boxShadow: '0 2px 8px rgba(139,92,246,.06)',
          flexShrink: 0,
        }}
      >
        <div style={{ ...shimmerStyle, height: 150, borderRadius: 0 }} />
        <div style={{ padding: 14 }}>
          <div style={{ ...shimmerStyle, height: 14, width: '75%', marginBottom: 8 }} />
          <div style={{ ...shimmerStyle, height: 10, width: '50%', marginBottom: 14 }} />
          <div style={{ ...shimmerStyle, height: 8, width: '100%', borderRadius: 999 }} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        padding: 16,
        borderRadius: 20,
        background: 'white',
        border: `1px solid ${MM.purple100}`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ ...shimmerStyle, width: 48, height: 48, borderRadius: '50%', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...shimmerStyle, height: 14, width: '60%', marginBottom: 8 }} />
        <div style={{ ...shimmerStyle, height: 8, width: '90%' }} />
      </div>
    </div>
  );
}
