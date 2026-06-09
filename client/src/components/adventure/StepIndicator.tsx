// client/src/components/adventure/StepIndicator.tsx

interface StepIndicatorProps {
  step: 'topic' | 'world';
}

export function StepIndicator({ step }: StepIndicatorProps) {
  return (
    <div className="flex items-center mx-auto w-fit rounded-full p-1.5 bg-purple-wizzy/10">
      <div
        className={[
          'px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
          step === 'topic'
            ? 'bg-purple-wizzy text-white shadow-[0_2px_10px_rgba(139,92,246,0.4)]'
            : 'text-purple-wizzy/45',
        ].join(' ')}
      >
        1. Pick a Topic
      </div>
      <span className="text-purple-wizzy/30 text-xs mx-1">›</span>
      <div
        className={[
          'px-5 py-1.5 rounded-full text-xs font-bold transition-all duration-200',
          step === 'world'
            ? 'bg-purple-wizzy text-white shadow-[0_2px_10px_rgba(139,92,246,0.4)]'
            : 'text-purple-wizzy/45',
        ].join(' ')}
      >
        2. Pick a World
      </div>
    </div>
  );
}
