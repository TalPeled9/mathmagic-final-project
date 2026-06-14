interface StepIndicatorProps {
  step: 'topic' | 'world';
}

export function StepIndicator({ step }: StepIndicatorProps) {
  const isStep2 = step === 'world';

  return (
    <div className="flex items-center gap-0 mx-auto w-fit">
      {/* Step 1 */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300"
          style={{
            background: !isStep2 ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)' : 'rgba(139,92,246,0.12)',
            color: !isStep2 ? 'white' : 'rgba(139,92,246,0.5)',
            boxShadow: !isStep2 ? '0 4px 14px rgba(139,92,246,0.4)' : 'none',
            transform: !isStep2 ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {isStep2 ? '✓' : '1'}
        </div>
        <span
          className="text-xs font-bold transition-colors duration-300 whitespace-nowrap"
          style={{ color: !isStep2 ? '#8b5cf6' : 'rgba(139,92,246,0.45)' }}
        >
          Pick a Topic
        </span>
      </div>

      {/* Connector */}
      <div className="flex items-center mx-2 mb-5">
        <div className="w-10 h-0.5 relative overflow-hidden rounded-full" style={{ background: 'rgba(139,92,246,0.15)' }}>
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
            style={{
              width: isStep2 ? '100%' : '0%',
              background: 'linear-gradient(90deg, #8b5cf6, #f59e0b)',
            }}
          />
        </div>
        <div
          className="w-2 h-2 rounded-full transition-all duration-300 ml-0.5"
          style={{
            background: isStep2 ? '#f59e0b' : 'rgba(139,92,246,0.2)',
            boxShadow: isStep2 ? '0 0 6px rgba(245,158,11,0.6)' : 'none',
          }}
        />
      </div>

      {/* Step 2 */}
      <div className="flex flex-col items-center gap-1.5">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300"
          style={{
            background: isStep2 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(139,92,246,0.12)',
            color: isStep2 ? 'white' : 'rgba(139,92,246,0.4)',
            boxShadow: isStep2 ? '0 4px 14px rgba(245,158,11,0.4)' : 'none',
            transform: isStep2 ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          2
        </div>
        <span
          className="text-xs font-bold transition-colors duration-300 whitespace-nowrap"
          style={{ color: isStep2 ? '#d97706' : 'rgba(139,92,246,0.35)' }}
        >
          Pick a World
        </span>
      </div>
    </div>
  );
}
