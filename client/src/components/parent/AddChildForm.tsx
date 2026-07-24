import { Sparkles, X } from 'lucide-react';
import { GradientRing } from '@/components/loaders';
import type { GradeLevel, Gender } from '@mathmagic/types';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'boy', label: 'Boy' },
  { value: 'girl', label: 'Girl' },
];

function toggleButtonStyle(isSelected: boolean) {
  return isSelected
    ? {
        background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
        color: 'white',
        boxShadow: '0 4px 12px rgba(139,92,246,0.4)',
      }
    : {
        background: 'rgba(139,92,246,0.06)',
        color: '#6b7280',
        border: '1px solid rgba(139,92,246,0.1)',
      };
}

interface AddChildFormProps {
  name: string;
  onNameChange: (value: string) => void;
  gradeLevel: GradeLevel;
  onGradeLevelChange: (value: GradeLevel) => void;
  gender: Gender;
  onGenderChange: (value: Gender) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function AddChildForm({
  name,
  onNameChange,
  gradeLevel,
  onGradeLevelChange,
  gender,
  onGenderChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: AddChildFormProps) {
  return (
    <div
      className="rounded-2xl p-5 space-y-4 shadow-sm border-2 border-purple-wizzy/10"
      style={{ background: 'linear-gradient(150deg, #ffffff 0%, #fdf4ff 100%)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            <Sparkles size={13} />
          </div>
          <h3 className="font-bold text-purple-wizzy">New Child Profile</h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>
      <p className="text-xs text-gray-400 -mt-2">
        Every child gets their own personalized learning adventure, with progress and achievements
        all their own.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Child's Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter child's first name"
            maxLength={50}
            required
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
          <div className="grid grid-cols-2 gap-2">
            {GENDERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => onGenderChange(value)}
                className="py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                style={toggleButtonStyle(gender === value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
          <div className="grid grid-cols-6 gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => onGradeLevelChange(g)}
                className="py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                style={toggleButtonStyle(gradeLevel === g)}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60 transition-all hover:scale-[1.02]"
            style={{ background: 'linear-gradient(90deg, #8b5cf6 0%, #6d28d9 100%)' }}
          >
            {isSubmitting && <GradientRing size={16} thickness={2.5} label="" />}
            {isSubmitting ? 'Creating...' : 'Create Profile'}
          </button>
        </div>
      </form>
    </div>
  );
}
