import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Sparkles, Plus, X, Users, LogOut, Settings, Clock, Star } from 'lucide-react';
import { ParentLoader, GradientRing } from '@/components/loaders';
import { childService, type ChildWithTopics } from '../../services/childService';
import type { GradeLevel } from '@mathmagic/types';
import { useAuth } from '@/hooks/useAuth';
import { ChildSection } from '@/components/parent/ChildSection';
import { ParentSettingsModal } from '@/components/parent/ParentSettingsModal';
import defaultAvatar from '@/assets/default_avatar.png';

const GRADES: GradeLevel[] = [1, 2, 3, 4, 5, 6];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Hello';
}

export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<ChildWithTopics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState<GradeLevel>(1);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    childService
      .getAll()
      .then((list) => {
        setChildren(list);
        if (list.length > 0) setSelectedChildId((prev) => prev ?? list[0]._id);
      })
      .catch(() => toast.error('Failed to load profiles'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const child = await childService.create({ name: newName, gradeLevel: newGrade });
      const withTopics = child as ChildWithTopics;
      setChildren((prev) => [...prev, withTopics]);
      setSelectedChildId(child._id);
      setShowAddForm(false);
      setNewName('');
      setNewGrade(1);
      toast.success(`${child.name}'s profile created!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedChild =
    children.find((c) => c._id === selectedChildId) ?? children[0] ?? null;

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const totalWeeklyMinutes = children.reduce((s, c) => s + c.weeklyLearningMinutes, 0);
  const totalStars = children.reduce((s, c) => s + c.totalStars, 0);
  const activeCount = children.filter((c) => c.weeklyLearningMinutes > 0).length;

  return (
    <>
      <ParentSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div className="min-h-screen bg-parchment flex flex-col items-center px-4 py-5">
        <div className="w-full max-w-3xl">

          {/* ── Top bar ── */}
          <div className="flex items-center justify-between mb-5">
            <Link to="/" className="flex items-center gap-2">
              <Sparkles className="text-gold-magic" size={20} />
              <span className="text-lg font-bold text-purple-wizzy">MathMagic</span>
            </Link>
            <div className="flex items-center gap-1">
              {children.length > 0 && (
                <Link
                  to="/profiles"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-wizzy/10 font-medium"
                >
                  <Users size={15} />
                  <span className="hidden sm:inline">Child View</span>
                </Link>
              )}
              <button
                onClick={() => setSettingsOpen(true)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-wizzy/10 font-medium"
              >
                <Settings size={15} />
                <span className="hidden sm:inline">Settings</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-wizzy/10"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {/* ── Hero greeting card ── */}
          <div className="bg-gradient-to-br from-purple-wizzy to-violet-700 rounded-2xl p-6 mb-5 shadow-lg relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/8 rounded-full" />
            <div className="absolute -bottom-4 left-12 w-16 h-16 bg-white/8 rounded-full" />
            <Sparkles size={80} className="absolute -bottom-3 -right-3 text-white/5" strokeWidth={1} />
            <div className="relative">
              <p className="text-purple-200 text-sm font-medium">
                {getGreeting()}, {firstName}! ✨
              </p>
              <h1 className="text-2xl font-bold text-white mt-0.5">
                {isLoading
                  ? 'Loading your dashboard…'
                  : children.length === 0
                  ? 'Welcome to MathMagic!'
                  : activeCount > 0
                  ? `${activeCount === children.length ? 'All' : activeCount} wizard${activeCount !== 1 ? 's are' : ' is'} learning this week`
                  : 'Your wizards are ready to learn'}
              </h1>
              <p className="text-purple-200 text-sm mt-1">
                {children.length === 0
                  ? 'Add your first child profile to get started'
                  : totalWeeklyMinutes > 0
                  ? `${totalWeeklyMinutes} minutes of learning magic this week`
                  : 'No activity recorded yet this week'}
              </p>
              {children.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-2">
                    <Users size={13} className="text-white/80" />
                    <span className="text-sm font-semibold text-white">
                      {children.length} Wizard{children.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-2">
                    <Clock size={13} className="text-white/80" />
                    <span className="text-sm font-semibold text-white">
                      {totalWeeklyMinutes} min this week
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/15 rounded-xl px-3 py-2">
                    <Star size={13} className="text-white/80 fill-white/80" />
                    <span className="text-sm font-semibold text-white">{totalStars} stars</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Loading ── */}
          {isLoading && <ParentLoader message="Loading profiles…" />}

          {/* ── No children yet ── */}
          {!isLoading && children.length === 0 && !showAddForm && (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm mb-4">
              <Users size={44} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-600 font-semibold">No child profiles yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Tap "Add Child Profile" below to get started
              </p>
            </div>
          )}

          {/* ── Child selector + dashboard ── */}
          {!isLoading && children.length > 0 && (
            <>
              {/* Child pill switcher */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-0.5">
                {children.map((child) => {
                  const av = child.avatars[child.activeAvatarIndex];
                  const isSelected = !showAddForm && selectedChildId === child._id;
                  return (
                    <button
                      key={child._id}
                      onClick={() => { setSelectedChildId(child._id); setShowAddForm(false); }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-purple-wizzy text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-100 shadow-sm hover:border-purple-wizzy/30 hover:text-purple-wizzy'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full overflow-hidden shrink-0 border ${isSelected ? 'border-white/30' : 'border-gray-200'}`}>
                        {av?.imageData ? (
                          <img src={av.imageData} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          <img src={defaultAvatar} alt={child.name} className="w-full h-full object-cover" />
                        )}
                      </div>
                      {child.name}
                    </button>
                  );
                })}

                {/* Add child pill */}
                {children.length < 10 && (
                  <button
                    onClick={() => setShowAddForm((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                      showAddForm
                        ? 'bg-purple-wizzy/10 text-purple-wizzy border border-purple-wizzy/30'
                        : 'text-gray-400 border border-dashed border-gray-200 hover:text-purple-wizzy hover:border-purple-wizzy/40'
                    }`}
                  >
                    <Plus size={13} />
                    Add
                  </button>
                )}
              </div>

              {/* Add form or child section */}
              {showAddForm ? (
                <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm border-2 border-purple-wizzy/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-purple-wizzy">New Child Profile</h3>
                    <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                        {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                      </select>
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
                        {isCreating && <GradientRing size={16} thickness={2.5} label="" />}
                        {isCreating ? 'Creating...' : 'Create Profile'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                selectedChild && (
                  <ChildSection key={selectedChild._id} child={selectedChild} />
                )
              )}
            </>
          )}

          {/* No children + add form */}
          {!isLoading && children.length === 0 && showAddForm && (
            <div className="bg-white rounded-2xl p-5 space-y-4 shadow-sm border-2 border-purple-wizzy/10">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-purple-wizzy">New Child Profile</h3>
                <button onClick={() => setShowAddForm(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                    {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                  </select>
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
                    {isCreating && <GradientRing size={16} thickness={2.5} label="" />}
                    {isCreating ? 'Creating...' : 'Create Profile'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* First-time add button (no children) */}
          {!isLoading && children.length === 0 && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-purple-wizzy/30 rounded-2xl py-4 text-purple-wizzy hover:bg-purple-wizzy/5 hover:border-purple-wizzy/50 transition-all font-medium text-sm mt-4"
            >
              <Plus size={18} />
              Add Child Profile
            </button>
          )}


        </div>
      </div>
    </>
  );
}
