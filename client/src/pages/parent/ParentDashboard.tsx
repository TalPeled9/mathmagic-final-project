import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Sparkles, Plus, Users, LogOut, Settings, Clock, Star } from 'lucide-react';
import { ParentLoader } from '@/components/loaders';
import MagicBackground from '@/components/MagicBackground';
import { childService, type ChildWithTopics } from '../../services/childService';
import type { GradeLevel, Gender, IChild } from '@mathmagic/types';
import { useAuth } from '@/hooks/useAuth';
import { ChildSection } from '@/components/parent/ChildSection';
import { ParentSettingsModal } from '@/components/parent/ParentSettingsModal';
import { AddChildForm } from '@/components/parent/AddChildForm';
import { getDefaultAvatar } from '@/lib/avatar';

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
  const [newGender, setNewGender] = useState<Gender>('boy');
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
      const child = await childService.create({ name: newName, gradeLevel: newGrade, gender: newGender });
      const withTopics = child as ChildWithTopics;
      setChildren((prev) => [...prev, withTopics]);
      setSelectedChildId(child._id);
      setShowAddForm(false);
      setNewName('');
      setNewGrade(1);
      setNewGender('boy');
      toast.success(`${child.name}'s profile created!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setIsCreating(false);
    }
  };

  const handleChildUpdate = (updated: IChild) => {
    setChildren((prev) => prev.map((c) => (c._id === updated._id ? { ...c, ...updated } : c)));
  };

  const handleChildDelete = (childId: string) => {
    const remaining = children.filter((c) => c._id !== childId);
    setChildren(remaining);
    setSelectedChildId((prev) => (prev === childId ? (remaining[0]?._id ?? null) : prev));
  };

  const selectedChild = children.find((c) => c._id === selectedChildId) ?? children[0] ?? null;

  const firstName = user?.name?.split(' ')[0] ?? 'there';
  const totalWeeklyMinutes = children.reduce((s, c) => s + c.weeklyLearningMinutes, 0);
  const totalStars = children.reduce((s, c) => s + c.totalStars, 0);
  const activeCount = children.filter((c) => c.weeklyLearningMinutes > 0).length;

  return (
    <>
      <ParentSettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      <div
        className="relative min-h-screen flex flex-col items-center px-4 py-5 overflow-hidden"
        style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #fffbeb 55%, #ede9fe 100%)' }}
      >
        <MagicBackground symbols="stars" count={14} opacity={0.07} />
        <div className="relative z-10 w-full max-w-3xl">
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
            <Sparkles
              size={80}
              className="absolute -bottom-3 -right-3 text-white/5"
              strokeWidth={1}
            />
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
            <div
              className="rounded-2xl p-10 text-center mb-4"
              style={{ background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(139,92,246,0.12)', backdropFilter: 'blur(8px)' }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(139,92,246,0.08)' }}>
                <Users size={28} className="text-purple-wizzy/40" />
              </div>
              <p className="text-gray-700 font-bold">No child profiles yet</p>
              <p className="text-sm text-gray-400 mt-1">Tap "Add Child Profile" below to begin the adventure</p>
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
                      onClick={() => {
                        setSelectedChildId(child._id);
                        setShowAddForm(false);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-purple-wizzy text-white shadow-sm'
                          : 'bg-white text-gray-600 border border-gray-100 shadow-sm hover:border-purple-wizzy/30 hover:text-purple-wizzy'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full overflow-hidden shrink-0 border ${isSelected ? 'border-white/30' : 'border-gray-200'}`}
                      >
                        {av?.imageData ? (
                          <img
                            src={av.imageData}
                            alt={child.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <img
                            src={getDefaultAvatar(child.gender)}
                            alt={child.name}
                            className="w-full h-full object-cover"
                          />
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
                <AddChildForm
                  name={newName}
                  onNameChange={setNewName}
                  gradeLevel={newGrade}
                  onGradeLevelChange={setNewGrade}
                  gender={newGender}
                  onGenderChange={setNewGender}
                  onSubmit={handleCreate}
                  onCancel={() => setShowAddForm(false)}
                  isSubmitting={isCreating}
                />
              ) : (
                selectedChild && (
                  <ChildSection
                    key={selectedChild._id}
                    child={selectedChild}
                    onChildUpdate={handleChildUpdate}
                    onChildDelete={handleChildDelete}
                  />
                )
              )}
            </>
          )}

          {/* No children + add form */}
          {!isLoading && children.length === 0 && showAddForm && (
            <AddChildForm
              name={newName}
              onNameChange={setNewName}
              gradeLevel={newGrade}
              onGradeLevelChange={setNewGrade}
              gender={newGender}
              onGenderChange={setNewGender}
              onSubmit={handleCreate}
              onCancel={() => setShowAddForm(false)}
              isSubmitting={isCreating}
            />
          )}

          {/* First-time add button (no children) */}
          {!isLoading && children.length === 0 && !showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl py-4 text-white font-semibold mt-4 hover:scale-[1.02] transition-all shadow-lg"
              style={{ background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)' }}
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
