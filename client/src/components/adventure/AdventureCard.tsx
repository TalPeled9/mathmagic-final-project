import { useState } from 'react';

export interface AdventureCardProps {
  id: string;
  name: string;
  description: string;
  imageSrc: string;
  fallbackGradient: string;
  isSelected: boolean;
  onClick: () => void;
  animationDelay: number;
}

export function AdventureCard({
  name,
  description,
  imageSrc,
  fallbackGradient,
  isSelected,
  onClick,
  animationDelay,
}: AdventureCardProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className={[
        'group relative overflow-hidden rounded-2xl border-2 cursor-pointer select-none',
        'transition-all duration-300 ease-out',
        'shadow-[0_8px_24px_rgba(0,0,0,0.3)]',
        'animate-slide-up',
        isSelected
          ? 'border-gold-magic -translate-y-1 scale-[1.02] shadow-[0_0_0_3px_rgba(245,158,11,0.3),0_12px_32px_rgba(0,0,0,0.3)]'
          : 'border-transparent hover:border-purple-wizzy/75 hover:-translate-y-2 hover:scale-[1.03] hover:shadow-[0_18px_44px_rgba(139,92,246,0.3),0_8px_24px_rgba(0,0,0,0.3)]',
      ].join(' ')}
      style={{
        aspectRatio: '3 / 4',
        animationDelay: `${animationDelay}ms`,
      }}
    >
      {/* Gradient fallback — always present, image layers on top */}
      <div className="absolute inset-0" style={{ background: fallbackGradient }} />

      {/* Photo — hidden if load fails, gradient shows through */}
      {!imgFailed && (
        <img
          src={imageSrc}
          alt={name}
          onError={() => setImgFailed(true)}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.06]"
        />
      )}

      {/* Shine sweep — CSS class in globals.css handles the hover transition */}
      <div className="adventure-card-shine" />

      {/* Dark gradient overlay with name + description */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          background: 'linear-gradient(transparent 0%, rgba(0,0,0,0.88) 100%)',
          padding: '40px 14px 12px',
        }}
      >
        <p className="font-extrabold text-white text-base leading-normal">{name}</p>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {description}
        </p>
      </div>

      {/* Gold check badge — only when selected */}
      {isSelected && (
        <div className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full bg-gold-magic flex items-center justify-center text-white text-xs font-bold shadow-[0_2px_8px_rgba(245,158,11,0.5)]">
          ✓
        </div>
      )}
    </button>
  );
}
