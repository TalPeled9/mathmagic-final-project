import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Save, Star, Zap, Trophy, Clock } from 'lucide-react';
import { ParentLoader, GradientRing } from '@/components/loaders';
import { childService } from '../../services/childService';
import type { IChild, GradeLevel } from '@mathmagic/types';
import defaultAvatar from '@/assets/default_avatar.png';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];

export default function ChildDetailsPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const [child, setChild] = useState<IChild | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(1);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!childId) return;
    childService
      .getOne(childId)
      .then((c) => {
        setChild(c);
        setName(c.name);
        setGradeLevel(c.gradeLevel);
      })
      .catch(() => {
        toast.error('Child profile not found');
        navigate('/parent');
      })
      .finally(() => setIsLoading(false));
  }, [childId, navigate]);

  const handleSave = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!child) return;
    setIsSaving(true);
    try {
      const updated = await childService.update(child._id, { name, gradeLevel });
      setChild(updated);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <ParentLoader message="Loading child profile…" />
      </div>
    );
  }

  if (!child) return null;

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-6">
      <div className="w-full max-w-md">
        {/* Back */}
        <Link
          to="/parent"
          className="inline-flex items-center gap-1 text-sm text-purple-wizzy hover:text-purple-wizzy/80 transition-colors font-medium mb-6"
        >
          <ArrowLeft size={15} />
          Back to Profiles
        </Link>

        <h1 className="text-2xl font-bold text-purple-wizzy mb-6">Edit Profile</h1>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6">
          {/* Avatar section */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-wizzy/20">
              {child.avatars[child.activeAvatarIndex]?.imageData ? (
                <img
                  src={child.avatars[child.activeAvatarIndex].imageData}
                  alt={child.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={defaultAvatar} alt={child.name} className="w-full h-full object-cover" />
              )}
            </div>
            <Link
              to={`/profiles/avatar/${child._id}`}
              className="text-sm text-purple-wizzy hover:text-purple-wizzy/80 transition-colors font-medium"
            >
              Manage Avatars
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-6 py-2 border-y border-gray-100">
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-gold-magic">
                <Zap size={14} />
                <span className="font-bold text-gray-700">{child.totalXP}</span>
              </div>
              <span className="text-xs text-gray-400">XP</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-yellow-400">
                <Star size={14} />
                <span className="font-bold text-gray-700">{child.totalStars}</span>
              </div>
              <span className="text-xs text-gray-400">Stars</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-purple-wizzy">
                <Trophy size={14} />
                <span className="font-bold text-gray-700">{child.currentLevel}</span>
              </div>
              <span className="text-xs text-gray-400">Level</span>
            </div>
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-1 text-blue-400">
                <Clock size={14} />
                <span className="font-bold text-gray-700">{child.weeklyLearningMinutes}</span>
              </div>
              <span className="text-xs text-gray-400">Min this week</span>
            </div>
          </div>

          {/* Edit form */}
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

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-purple-wizzy text-white rounded-xl py-3 font-semibold hover:bg-purple-wizzy/90 disabled:opacity-60 transition-colors"
            >
              {isSaving ? <GradientRing size={18} thickness={2.5} label="" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
