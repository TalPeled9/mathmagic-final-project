import { useState, useEffect, useCallback } from 'react';

interface Sparkle {
  id: number;
  angle: number;
}

let sparkleCounter = 0;

function StarIcon({ glowing, clicking }: { glowing: boolean; clicking: boolean }) {
  const points = Array.from({ length: 5 }, (_, i) => {
    const outerR = 6;
    const innerR = 2.8;
    const outerAngle = (i * 72 - 90) * (Math.PI / 180);
    const innerAngle = (i * 72 - 90 + 36) * (Math.PI / 180);
    return [
      `${7 + outerR * Math.cos(outerAngle)},${7 + outerR * Math.sin(outerAngle)}`,
      `${7 + innerR * Math.cos(innerAngle)},${7 + innerR * Math.sin(innerAngle)}`,
    ];
  }).flat().join(' ');

  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 32 32"
      style={{
        filter: glowing
          ? 'drop-shadow(0 0 4px #f59e0b) drop-shadow(0 0 8px #f59e0b)'
          : 'drop-shadow(0 0 2px rgba(245,158,11,0.4))',
        transition: 'filter 0.15s ease',
      }}
    >
      {/* Wand body */}
      <line
        x1="26" y1="26" x2="9" y2="9"
        stroke={glowing ? '#7c3aed' : '#6d28d9'}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Grip band */}
      <line
        x1="20" y1="20" x2="22.5" y2="22.5"
        stroke="#c4b5fd"
        strokeWidth="5"
        strokeLinecap="round"
      />
      {/* Star tip */}
      <polygon
        points={points}
        fill={clicking ? '#fbbf24' : '#f59e0b'}
        style={{
          transformOrigin: '7px 7px',
          transform: clicking ? 'scale(1.35) rotate(20deg)' : glowing ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 0.1s ease',
          animation: glowing && !clicking ? 'cursor-wand-glow 1.4s ease-in-out infinite' : undefined,
        }}
      />
      {/* Small accent dot on wand */}
      <circle cx="17" cy="17" r="1.5" fill="#e9d5ff" opacity="0.7" />
    </svg>
  );
}

export function CustomCursor() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  const [isPointer, setIsPointer] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const [sparkles, setSparkles] = useState<Sparkle[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  const spawnSparkles = useCallback(() => {
    const count = 6;
    const newSparkles: Sparkle[] = Array.from({ length: count }, (_, i) => ({
      id: ++sparkleCounter,
      angle: (i * 360) / count + Math.random() * 30,
    }));
    setSparkles(prev => [...prev, ...newSparkles]);
    setTimeout(() => {
      setSparkles(prev => prev.filter(s => !newSparkles.find(n => n.id === s.id)));
    }, 520);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (el) {
        const style = window.getComputedStyle(el);
        const isClickable =
          style.cursor === 'pointer' ||
          el.closest('button, a, [role="button"], input, select, textarea, label, [tabindex]') !== null;
        setIsPointer(!!isClickable);
      }
    };

    const onDown = () => {
      setIsClicking(true);
      spawnSparkles();
    };
    const onUp = () => setIsClicking(false);
    const onLeave = () => setIsVisible(false);
    const onEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      document.documentElement.removeEventListener('mouseenter', onEnter);
    };
  }, [spawnSparkles]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x,
        top: pos.y,
        pointerEvents: 'none',
        zIndex: 99999,
        transform: 'translate(-7px, -7px)',
      }}
    >
      <StarIcon glowing={isPointer} clicking={isClicking} />

      {sparkles.map(sparkle => {
        const rad = sparkle.angle * (Math.PI / 180);
        const dist = 28 + Math.random() * 14;
        const tx = Math.cos(rad) * dist;
        const ty = Math.sin(rad) * dist;
        const colors = ['#f59e0b', '#fbbf24', '#8b5cf6', '#c4b5fd'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        return (
          <div
            key={sparkle.id}
            style={{
              position: 'absolute',
              left: 7,
              top: 7,
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: color,
              animation: `cursor-sparkle-fade 0.5s ease-out forwards`,
              // @ts-expect-error CSS custom properties
              '--tx': `${tx}px`,
              '--ty': `${ty}px`,
              boxShadow: `0 0 4px ${color}`,
            }}
          />
        );
      })}
    </div>
  );
}
