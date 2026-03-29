import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import { ArrowLeft, Sparkles, RefreshCw, Save, Star, Zap, Trophy } from 'lucide-react';
import { childService } from '../../services/childService';
import type { IChild, GradeLevel } from '@mathmagic/types';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];

export default function ChildDetailsPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();

  const [child, setChild] = useState<IChild | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState<GradeLevel>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [avatarDescription, setAvatarDescription] = useState('');

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

  const handleRegenerate = async () => {
    if (!child) return;
    setIsRegenerating(true);
    try {
      const updated = await childService.regenerateAvatar(child._id, avatarDescription.trim() || undefined);
      setChild(updated);
      toast.success('Avatar regenerated!');
    } catch {
      toast.error('Failed to regenerate avatar');
    } finally {
      setIsRegenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center">
        <div className="flex items-center gap-2 text-gray-400">
          <Sparkles size={20} className="animate-pulse" />
          <span>Loading...</span>
        </div>
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
              {child.avatarUrl ? (
                <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-purple-wizzy/10 flex items-center justify-center">
                  <span className="text-3xl font-bold text-purple-wizzy">
                    {child.name[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="w-full space-y-2">
              <textarea
                value={avatarDescription}
                onChange={(e) => setAvatarDescription(e.target.value)}
                placeholder="Describe the avatar (e.g. 'a brave knight with a blue cape')…"
                maxLength={200}
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy"
              />
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center justify-center gap-1.5 w-full text-sm text-purple-wizzy hover:text-purple-wizzy/80 disabled:opacity-50 transition-colors"
              >
                <RefreshCw size={13} className={isRegenerating ? 'animate-spin' : ''} />
                {isRegenerating ? 'Regenerating...' : 'Regenerate Avatar'}
              </button>
            </div>
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
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-purple-wizzy text-white rounded-xl py-3 font-semibold hover:bg-purple-wizzy/90 disabled:opacity-60 transition-colors"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
