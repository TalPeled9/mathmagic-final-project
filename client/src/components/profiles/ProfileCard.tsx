import type { IChild } from '@mathmagic/types';
import defaultAvatar from '@/assets/default_avatar.png';

const LEVEL_NAMES: readonly string[] = [
  'Beginner', 'Math Explorer', 'Number Wizard', 'Problem Solver',
  'Equation Master', 'Logic Hero', 'Calculation Champion', 'Formula Genius',
  'Math Legend', 'Grand Wizard',
];

function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? 'Grand Wizard';
}

interface ProfileCardProps {
  child: IChild;
  onSelect: (child: IChild) => void;
}

export default function ProfileCard({ child, onSelect }: ProfileCardProps) {
  const avatarSrc = child.avatars[child.activeAvatarIndex]?.imageData || defaultAvatar;
  const level = child.currentLevel ?? 1;

  return (
    <button
      onClick={() => onSelect(child)}
      className="group relative w-44 h-60 flex flex-col items-center bg-white rounded-2xl shadow-md overflow-hidden border-2 border-transparent hover:border-purple-wizzy/50 hover:scale-105 hover:shadow-xl hover:shadow-purple-300/30 transition-all duration-200"
    >
      {/* Avatar section */}
      <div className="relative w-full h-44 overflow-hidden bg-gradient-to-b from-purple-50 to-violet-100">
        <img
          src={avatarSrc}
          alt={`${child.name}'s avatar`}
          onError={(e) => {
            if (e.currentTarget.src !== defaultAvatar) e.currentTarget.src = defaultAvatar;
          }}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Level badge overlay */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-xs font-bold text-white whitespace-nowrap shadow-lg"
          style={{ background: 'linear-gradient(90deg, #8b5cf6, #f59e0b)' }}
        >
          ⭐ Lvl {level}
        </div>
      </div>

      {/* Name + level name */}
      <div className="flex-1 flex flex-col items-center justify-center px-3 py-2 gap-0.5">
        <p className="font-bold text-gray-800 group-hover:text-purple-wizzy transition-colors text-center text-sm leading-tight">
          {child.name}
        </p>
        <p className="text-xs text-gray-400 font-medium">{getLevelName(level)}</p>
      </div>

      {/* Hover glow ring */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 0 2px rgba(139,92,246,0.3)' }} />
    </button>
  );
}
