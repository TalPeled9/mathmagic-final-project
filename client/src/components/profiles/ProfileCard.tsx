import type { IChild } from '@mathmagic/types';
import defaultAvatar from '@/assets/wizzy.png';

interface ProfileCardProps {
  child: IChild;
  onSelect: (child: IChild) => void;
}

export default function ProfileCard({ child, onSelect }: ProfileCardProps) {
  return (
    <button
      onClick={() => onSelect(child)}
      className="group w-40 h-52 flex flex-col items-center bg-white rounded-2xl shadow-sm overflow-hidden border-2 border-transparent hover:border-purple-wizzy/40 hover:scale-105 hover:shadow-lg hover:shadow-purple-300/40 transition-all duration-200"
    >
      <div className="w-full h-40 overflow-hidden bg-purple-wizzy/5">
        <img
          src={child.avatarUrl || defaultAvatar}
          alt={`${child.name}'s avatar`}
          onError={(e) => {
            if (e.currentTarget.src !== defaultAvatar) {
              e.currentTarget.src = defaultAvatar;
            }
          }}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 flex items-center justify-center px-3 py-3">
        <p className="font-bold text-gray-800 group-hover:text-purple-wizzy transition-colors text-center text-sm leading-tight">
          {child.name}
        </p>
      </div>
    </button>
  );
}
