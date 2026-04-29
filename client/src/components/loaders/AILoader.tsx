import { useState, useEffect } from 'react';
import wizzyImg from '../../assets/wizzy.png';
import { OrbitSpinner } from './OrbitSpinner';
import { GradientRing } from './GradientRing';

const MM = {
  purple: '#8B5CF6',
  purpleDeep: '#2E1065',
  purple50: '#F5F3FF',
  purple100: '#EDE9FE',
};

const AI_MESSAGES = [
  'Wizzy is mixing the magic potion…',
  'Summoning brave characters…',
  'Painting your scene with starlight…',
  'Sprinkling numbers across the sky…',
  'Almost ready for adventure!',
];

const STEPS = ['Writing story', 'Drawing scene', 'Adding sparkle'];

interface AILoaderProps {
  autoAdvance?: boolean;
}

export function AILoader({ autoAdvance = true }: AILoaderProps) {
  const [step, setStep] = useState(0);
  const [msg, setMsg] = useState(0);

  useEffect(() => {
    if (!autoAdvance) return;
    const t1 = setInterval(() => setStep((s) => (s + 1) % STEPS.length), 2400);
    const t2 = setInterval(() => setMsg((m) => (m + 1) % AI_MESSAGES.length), 1800);
    return () => {
      clearInterval(t1);
      clearInterval(t2);
    };
  }, [autoAdvance]);

  return (
    <div
      style={{
        width: '100%',
        padding: 28,
        borderRadius: 24,
        background: MM.purple50,
        border: `1px solid ${MM.purple100}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      {/* Wizzy + orbit */}
      <div style={{ position: 'relative', width: 140, height: 140 }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <OrbitSpinner size={140} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 90,
            height: 90,
            marginLeft: -45,
            marginTop: -45,
            borderRadius: '50%',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(139,92,246,.2)',
            animation: 'mm-wizzy-bob 2.4s ease-in-out infinite',
            overflow: 'hidden',
          }}
        >
          <img src={wizzyImg} alt="" style={{ width: 90, height: 'auto', marginTop: 4 }} />
        </div>
      </div>

      {/* rotating message */}
      <div style={{ minHeight: 28, textAlign: 'center' }}>
        <div
          key={msg}
          style={{
            color: MM.purpleDeep,
            fontWeight: 700,
            fontSize: 18,
            animation: 'mm-msg-swap 0.4s ease-out both',
          }}
        >
          {AI_MESSAGES[msg]}
        </div>
      </div>

      {/* progress steps */}
      <div style={{ width: '100%', maxWidth: 420 }}>
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 14,
                marginBottom: 8,
                background: active ? 'white' : 'transparent',
                border: active ? `1px solid ${MM.purple100}` : '1px solid transparent',
                boxShadow: active ? '0 2px 8px rgba(139,92,246,.08)' : 'none',
                color: done ? '#6B7280' : active ? MM.purpleDeep : '#9CA3AF',
              }}
            >
              {/* step indicator */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: done ? '#10B981' : active ? MM.purple : '#E5E7EB',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {done ? '✓' : active ? <GradientRing size={14} thickness={2.5} label="" /> : i + 1}
              </div>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
              {/* shimmer bar on active step */}
              {active && (
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    borderRadius: 3,
                    marginLeft: 8,
                    background: `linear-gradient(90deg, ${MM.purple100} 0%, ${MM.purple} 50%, ${MM.purple100} 100%)`,
                    backgroundSize: '400px 100%',
                    animation: 'mm-ai-shimmer 1.4s linear infinite',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
