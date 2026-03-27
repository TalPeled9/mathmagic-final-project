import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { toast } from 'sonner';
import {
  Sparkles, Plus, ArrowLeft, Star, Zap, Trophy, Edit2, RefreshCw, X, Users,
} from 'lucide-react';
import { childService } from '../../services/childService';
import type { IChild, GradeLevel } from '@mathmagic/types';
import { useAuth } from '@/hooks/useAuth';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];

export default function ParentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState<IChild[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  // Add-child form state
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState<GradeLevel>(1);
  const [newAvatarDesc, setNewAvatarDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Regenerating state per child
  const [regenerating, setRegenerating] = useState<string | null>(null);

  useEffect(() => {
    childService
      .getAll()
      .then(setChildren)
      .catch(() => toast.error('Failed to load profiles'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const child = await childService.create({
        name: newName,
        gradeLevel: newGrade,
        avatarDescription: newAvatarDesc.trim() || undefined,
      });
      setChildren((prev) => [...prev, child]);
      setShowAddForm(false);
      setNewName('');
      setNewGrade(1);
      setNewAvatarDesc('');
      toast.success(`${child.name}'s profile created!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRegenerate = async (child: IChild) => {
    setRegenerating(child._id);
    try {
      const updated = await childService.regenerateAvatar(child._id);
      setChildren((prev) => prev.map((c) => (c._id === updated._id ? updated : c)));
      toast.success(`${child.name}'s avatar updated!`);
    } catch {
      toast.error('Failed to regenerate avatar');
    } finally {
      setRegenerating(null);
    }
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/profiles"
            className="inline-flex items-center gap-1 text-sm text-purple-wizzy hover:text-purple-wizzy/80 transition-colors font-medium"
          >
            <ArrowLeft size={15} />
            Back to Profiles
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="text-gold-magic" size={20} />
            <span className="text-lg font-bold text-purple-wizzy">MathMagic</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-purple-wizzy">Manage Profiles</h1>
          {user?.name && (
            <p className="text-gray-500 text-sm mt-0.5">{user.name}'s family account</p>
          )}
        </div>

        {/* Children list */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-gray-400 py-12 justify-center">
            <Sparkles size={18} className="animate-pulse" />
            <span>Loading profiles...</span>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {children.length === 0 && !showAddForm && (
              <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                <Users size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No profiles yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first child profile to get started</p>
              </div>
            )}

            {children.map((child) => (
              <div
                key={child._id}
                className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-4"
              >
                {/* Avatar */}
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-wizzy/20 shrink-0">
                  {child.avatarUrl ? (
                    <img src={child.avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-purple-wizzy/10 flex items-center justify-center">
                      <span className="text-xl font-bold text-purple-wizzy">
                        {child.name[0].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">{child.name}</p>
                  <p className="text-xs text-gray-400">Grade {child.gradeLevel}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span className="flex items-center gap-0.5">
                      <Zap size={11} className="text-gold-magic" />
                      {child.totalXP} XP
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Star size={11} className="text-yellow-400" />
                      {child.totalStars}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Trophy size={11} className="text-purple-wizzy" />
                      Lv {child.currentLevel}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleRegenerate(child)}
                    disabled={regenerating === child._id}
                    title="Regenerate avatar"
                    className="p-2 rounded-lg text-gray-400 hover:text-purple-wizzy hover:bg-purple-wizzy/10 transition-colors disabled:opacity-40"
                  >
                    <RefreshCw size={15} className={regenerating === child._id ? 'animate-spin' : ''} />
                  </button>
                  <button
                    onClick={() => navigate(`/parent/child/${child._id}`)}
                    title="Edit profile"
                    className="p-2 rounded-lg text-gray-400 hover:text-purple-wizzy hover:bg-purple-wizzy/10 transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add child form */}
        {showAddForm ? (
          <div className="bg-violet-50 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-purple-wizzy">New Child Profile</h3>
              <button
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Child's Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter child's first name"
                  maxLength={50}
                  required
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">Grade Level</label>
                <select
                  value={newGrade}
                  onChange={(e) => setNewGrade(Number(e.target.value) as GradeLevel)}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy"
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Avatar Description <span className="text-gray-400">(Optional)</span>
                </label>
                <textarea
                  value={newAvatarDesc}
                  onChange={(e) => setNewAvatarDesc(e.target.value)}
                  placeholder="Describe the avatar look..."
                  maxLength={200}
                  rows={2}
                  className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-wizzy/30 focus:border-purple-wizzy"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-2.5 rounded-xl bg-purple-wizzy text-white text-sm font-semibold hover:bg-purple-wizzy/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles size={14} />
                  {isCreating ? 'Creating...' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            disabled={children.length >= 10}
            className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-wizzy/30 rounded-2xl py-4 text-purple-wizzy hover:bg-purple-wizzy/5 hover:border-purple-wizzy/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm"
          >
            <Plus size={18} />
            Add Child Profile
          </button>
        )}
      </div>
    </div>
  );
}
