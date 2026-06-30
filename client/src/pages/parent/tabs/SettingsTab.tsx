import { useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Save, User, Shield, Volume2 } from 'lucide-react';
import { GradientRing } from '@/components/loaders';
import { childService } from '../../../services/childService';
import type { IChild, GradeLevel } from '@mathmagic/types';
import defaultAvatar from '@/assets/default_avatar.png';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];

const NARRATOR_VOICES = [
  { id: 'UQ15q3Vf9AQQ2owcMKQ0', label: 'David', description: 'Boy narrator (default)' },
  { id: 'O4NKp88bb2JkAnrCbwQt', label: 'Lauren', description: 'Girl narrator' },
] as const;

interface Props {
  child: IChild;
  onChildUpdate: (updated: IChild) => void;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-purple-wizzy" />
      <h3 className="font-semibold text-gray-700">{title}</h3>
    </div>
  );
}

function PlaceholderToggle({ label, description }: { label: string; description?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-700">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-300 bg-gray-100 px-2 py-0.5 rounded-full">
          Coming soon
        </span>
        <button
          disabled
          className="w-10 h-5 bg-gray-100 rounded-full relative cursor-not-allowed opacity-50"
          aria-label={`Toggle ${label}`}
        >
          <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
        </button>
      </div>
    </div>
  );
}

export function SettingsTab({ child, onChildUpdate }: Props) {
  const [name, setName] = useState(child.name);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(child.gradeLevel);
  const [narratorVoice, setNarratorVoice] = useState<string>(
    child.narratorVoice ?? 'UQ15q3Vf9AQQ2owcMKQ0'
  );
  const [isSaving, setIsSaving] = useState(false);

  const avatar = child.avatars[child.activeAvatarIndex];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await childService.update(child._id, { name, gradeLevel, narratorVoice });
      onChildUpdate(updated);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Child profile */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <SectionHeader icon={User} title="Child Profile" />

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-gray-50">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-wizzy/20 shrink-0">
            {avatar?.imageData ? (
              <img src={avatar.imageData} alt={child.name} className="w-full h-full object-cover" />
            ) : (
              <img src={defaultAvatar} alt={child.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">{child.name}'s Avatar</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {child.weeklyGenerationsRemaining} generation
              {child.weeklyGenerationsRemaining !== 1 ? 's' : ''} remaining this week
            </p>
            <Link
              to={`/profiles/avatar/${child._id}`}
              className="text-xs text-purple-wizzy hover:text-purple-wizzy/80 font-medium mt-1 inline-block"
            >
              Manage Avatars →
            </Link>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Child's Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5">Grade Level</label>
            <select
              value={gradeLevel}
              onChange={(e) => setGradeLevel(Number(e.target.value) as GradeLevel)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1.5 flex items-center gap-1.5">
              <Volume2 size={14} className="text-purple-wizzy" />
              Wizzy's Voice
            </label>
            <div className="grid grid-cols-2 gap-2">
              {NARRATOR_VOICES.map((voice) => (
                <button
                  key={voice.id}
                  type="button"
                  onClick={() => setNarratorVoice(voice.id)}
                  className="flex flex-col items-start p-3 rounded-xl border-2 text-left transition-colors"
                  style={{
                    borderColor: narratorVoice === voice.id ? 'rgb(139,92,246)' : 'rgb(229,231,235)',
                    background: narratorVoice === voice.id ? 'rgba(139,92,246,0.06)' : 'white',
                  }}
                >
                  <span className="text-sm font-semibold text-gray-700">{voice.label}</span>
                  <span className="text-xs text-gray-400 mt-0.5">{voice.description}</span>
                </button>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 bg-purple-wizzy text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-purple-wizzy/90 disabled:opacity-60 transition-colors"
          >
            {isSaving ? <GradientRing size={16} thickness={2.5} label="" /> : <Save size={14} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Parental controls */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <SectionHeader icon={Shield} title="Parental Controls" />
        <PlaceholderToggle
          label="Daily Time Limit"
          description="Set a maximum daily learning time for this child"
        />
        <PlaceholderToggle
          label="Topic Restrictions"
          description="Limit which math topics are available"
        />
        <PlaceholderToggle
          label="Difficulty Cap"
          description="Prevent the game from advancing past a certain difficulty"
        />
      </div>
    </div>
  );
}
