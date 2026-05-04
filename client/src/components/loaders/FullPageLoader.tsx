import wizzyImg from '../../assets/wizzy.png';
import logoImg from '../../assets/mathmagic-logo.png';
import { SparkleSpinner } from './SparkleSpinner';

const MM = {
  purple: '#8B5CF6',
  purpleDeep: '#2E1065',
  gold: '#F59E0B',
  parchment: '#FFFBEB',
};

interface FullPageLoaderProps {
  message?: string;
}

export function FullPageLoader({ message = 'Preparing magic…' }: FullPageLoaderProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100svh',
        background: `radial-gradient(1200px 600px at 50% 20%, #FFF7D6 0%, ${MM.parchment} 55%, #FDF2F8 100%)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* twinkling background sparkles */}
      {Array.from({ length: 14 }, (_, i) => {
        const x = (i * 83) % 100;
        const y = (i * 47) % 100;
        const d = (i % 4) * 0.3;
        return (
          <svg
            key={i}
            viewBox="0 0 20 20"
            width={10 + (i % 3) * 6}
            height={10 + (i % 3) * 6}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              animation: `mm-bg-twinkle ${1.8 + (i % 3) * 0.4}s ease-in-out infinite`,
              animationDelay: `${d}s`,
              opacity: 0.5,
            }}
          >
            <path
              d="M10 1 L11.5 8.5 L19 10 L11.5 11.5 L10 19 L8.5 11.5 L1 10 L8.5 8.5 Z"
              fill={i % 2 ? MM.gold : MM.purple}
            />
          </svg>
        );
      })}

      {/* Wizzy floating */}
      <div
        style={{
          animation: 'mm-float 2.8s ease-in-out infinite',
          marginBottom: 8,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <img
          src={wizzyImg}
          alt=""
          style={{
            width: 160,
            height: 'auto',
            filter: 'drop-shadow(0 8px 18px rgba(139,92,246,.25))',
          }}
        />
      </div>

      {/* logo wordmark */}
      <img
        src={logoImg}
        alt="MathMagic"
        style={{ height: 38, marginBottom: 18, position: 'relative', zIndex: 1 }}
      />

      {/* message pill */}
      <div
        style={{
          background: 'white',
          borderRadius: 999,
          padding: '10px 22px',
          boxShadow: '0 6px 20px rgba(139,92,246,.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          animation: 'mm-fade-in-up 0.5s ease-out both',
          color: MM.purpleDeep,
          fontWeight: 600,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <SparkleSpinner size={22} label="" />
        <span>{message}</span>
        <span style={{ display: 'inline-flex', gap: 3, marginLeft: 2 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 5,
                height: 5,
                borderRadius: '50%',
                background: MM.purple,
                animation: 'mm-dot-bounce 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.15}s`,
                display: 'inline-block',
              }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}
