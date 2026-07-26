import { useState, useRef } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Save, User, Volume2, AlertTriangle, Trash2 } from 'lucide-react';
import { GradientRing } from '@/components/loaders';
import { childService } from '../../../services/childService';
import { api } from '@/lib/api';
import type { IChild, GradeLevel, Gender } from '@mathmagic/types';
import { getDefaultAvatar } from '@/lib/avatar';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];
const GENDERS: { value: Gender; label: string }[] = [
  { value: 'boy', label: 'Boy' },
  { value: 'girl', label: 'Girl' },
];

const NARRATOR_VOICES = [
  {
    id: 'UQ15q3Vf9AQQ2owcMKQ0',
    label: 'David',
    description: 'Boy narrator (default)',
    sample: "Hi there! I'm David, and I can't wait to take you on an adventure!",
  },
  {
    id: 'O4NKp88bb2JkAnrCbwQt',
    label: 'Lauren',
    description: 'Girl narrator',
    sample: "Hi there! I'm Lauren, and I can't wait to take you on an adventure!",
  },
] as const;

interface Props {
  child: IChild;
  onChildUpdate: (updated: IChild) => void;
  onChildDelete: (childId: string) => void;
}

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon size={16} className="text-purple-wizzy" />
      <h3 className="font-semibold text-gray-700">{title}</h3>
    </div>
  );
}

export function SettingsTab({ child, onChildUpdate, onChildDelete }: Props) {
  const [name, setName] = useState(child.name);
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(child.gradeLevel);
  const [gender, setGender] = useState<Gender>(child.gender ?? 'boy');
  const [narratorVoice, setNarratorVoice] = useState<string>(
    child.narratorVoice ?? 'UQ15q3Vf9AQQ2owcMKQ0'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const avatar = child.avatars[child.activeAvatarIndex];
  const defaultAvatar = getDefaultAvatar(child.gender);

  const selectNarratorVoice = async (voiceId: string, sampleText: string) => {
    setNarratorVoice(voiceId);
    if (voiceId === narratorVoice) return;

    previewAudioRef.current?.pause();
    try {
      const data = await api.post<{ audioBase64: string; contentType: string }>('/tts', {
        text: sampleText,
        voiceId,
      });
      const audio = new Audio(`data:${data.contentType};base64,${data.audioBase64}`);
      previewAudioRef.current = audio;
      await audio.play();
    } catch {
      /* voice sample is a nice-to-have; ignore playback failures */
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await childService.update(child._id, {
        name,
        gradeLevel,
        gender,
        narratorVoice,
      });
      onChildUpdate(updated);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await childService.remove(child._id);
      toast.success(`${child.name}'s profile was deleted`);
      onChildDelete(child._id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete profile');
      setIsDeleting(false);
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
            <label className="block text-sm text-gray-600 mb-1.5">Gender</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy"
            >
              {GENDERS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
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
                  onClick={() => selectNarratorVoice(voice.id, voice.sample)}
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

      {/* Danger zone */}
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-red-100">
        <SectionHeader icon={AlertTriangle} title="Danger Zone" />
        {!confirmingDelete ? (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 rounded-xl py-2.5 text-sm font-semibold hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete Profile
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete {child.name}'s profile? This will permanently
              remove their progress, badges, and adventure history. This can't be undone.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {isDeleting && <GradientRing size={16} thickness={2.5} label="" />}
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
