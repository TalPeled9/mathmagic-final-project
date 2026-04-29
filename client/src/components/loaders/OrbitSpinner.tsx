const MM = {
  purple: '#8B5CF6',
  indigo: '#6366F1',
  gold: '#F59E0B',
};

interface OrbitSpinnerProps {
  size?: number;
  label?: string;
  symbols?: string[];
}

export function OrbitSpinner({
  size = 64,
  label = 'Loading',
  symbols = ['+', '−', '×', '÷'],
}: OrbitSpinnerProps) {
  const r = size * 0.38;
  const colors = [MM.purple, MM.indigo, '#EC4899', MM.gold];

  return (
    <div
      role="status"
      aria-label={label}
      style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}
    >
      {/* glowing core */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: size * 0.32,
          height: size * 0.32,
          marginLeft: -size * 0.16,
          marginTop: -size * 0.16,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #FEF3C7, #F59E0B 70%)',
          animation: 'mm-core-pulse 1.6s ease-in-out infinite',
        }}
      />
      {/* orbit ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          animation: 'mm-orbit-rot 2.4s linear infinite',
          transformOrigin: '50% 50%',
        }}
      >
        {symbols.map((sym, i) => {
          const angle = (i / symbols.length) * Math.PI * 2;
          const x = size / 2 + Math.cos(angle) * r - size * 0.12;
          const y = size / 2 + Math.sin(angle) * r - size * 0.12;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: size * 0.24,
                height: size * 0.24,
                borderRadius: '50%',
                background: colors[i % colors.length],
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: size * 0.16,
                boxShadow: '0 2px 6px rgba(0,0,0,.15)',
                animation: 'mm-orbit-counter 2.4s linear infinite',
                transformOrigin: '50% 50%',
              }}
            >
              {sym}
            </div>
          );
        })}
      </div>
    </div>
  );
}
