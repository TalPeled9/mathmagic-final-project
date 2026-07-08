import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router';
import { toast } from 'sonner';
import { Sparkles, Star, Zap, LogOut, ChevronRight, BookOpen, Trophy, Wand2 } from 'lucide-react';
import { SkeletonCard } from '@/components/loaders';
import MagicBackground from '@/components/MagicBackground';
import defaultAvatar from '@/assets/default_avatar.png';
import { useAuth } from '@/hooks/useAuth';
import { adventureService } from '@/services/adventureService';
import {
  WORLD_EMOJIS,
  type AdventureSummary,
  type CompleteAdventureResponse,
} from '@mathmagic/types';

// ── Static config ─────────────────────────────────────────────────────────────

const LEVEL_THRESHOLDS: readonly number[] = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

const LEVEL_NAMES: readonly string[] = [
  'Beginner',
  'Math Explorer',
  'Number Wizard',
  'Problem Solver',
  'Equation Master',
  'Logic Hero',
  'Calculation Champion',
  'Formula Genius',
  'Math Legend',
  'Grand Wizard',
];

const TOPIC_NAMES: Record<string, string> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
  fractions: 'Fractions',
  patterns: 'Patterns',
  time: 'Time',
  money: 'Money',
  measurement: 'Measurement',
  shapes: 'Shapes',
};

const TOPIC_ICONS: Record<string, string> = {
  addition: '➕',
  subtraction: '➖',
  multiplication: '✖️',
  division: '➗',
  fractions: '½',
  patterns: '🔷',
  time: '⏰',
  money: '💰',
  measurement: '📏',
  shapes: '🔺',
};

const WORLD_NAMES: Record<string, string> = {
  space: 'Space Station',
  fantasy: 'Enchanted Kingdom',
  dinosaur: 'Dino Valley',
  ocean: 'Deep Ocean',
  jungle: 'Jungle Explorer',
  pirates: 'Pirate Seas',
  robots: 'Robot City',
  candy: 'Candy Land',
  'magic-school': 'Magic School',
  'ancient-temple': 'Ancient Temple',
};

const BADGE_EMOJIS: Record<string, string> = {
  'first-adventure': '🌟',
  'perfect-score': '💯',
  '5-day-streak': '🔥',
  'speed-master': '⚡',
  'topic-master': '🎓',
  explorer: '🗺️',
};

const BADGE_COLORS: Record<string, string> = {
  'first-adventure': 'linear-gradient(135deg, #fbbf24, #f59e0b)',
  'perfect-score': 'linear-gradient(135deg, #34d399, #10b981)',
  '5-day-streak': 'linear-gradient(135deg, #f97316, #ef4444)',
  'speed-master': 'linear-gradient(135deg, #60a5fa, #3b82f6)',
  'topic-master': 'linear-gradient(135deg, #a78bfa, #8b5cf6)',
  explorer: 'linear-gradient(135deg, #fb923c, #f59e0b)',
};

const WORLD_GRADIENTS: Record<string, string> = {
  space: 'linear-gradient(135deg, #1e1b4b, #4c1d95)',
  fantasy: 'linear-gradient(135deg, #6d28d9, #be185d)',
  dinosaur: 'linear-gradient(135deg, #065f46, #047857)',
  ocean: 'linear-gradient(135deg, #1e40af, #0891b2)',
  jungle: 'linear-gradient(135deg, #14532d, #15803d)',
  pirates: 'linear-gradient(135deg, #92400e, #b45309)',
  robots: 'linear-gradient(135deg, #1e3a5f, #374151)',
  candy: 'linear-gradient(135deg, #be185d, #e11d48)',
  'magic-school': 'linear-gradient(135deg, #5b21b6, #1d4ed8)',
  'ancient-temple': 'linear-gradient(135deg, #78350f, #d97706)',
};

const PLACEHOLDER_BADGES = [
  { type: 'first-adventure', label: 'First Adventure', hint: 'Complete your first adventure' },
  {
    type: 'perfect-score',
    label: 'Perfect Score',
    hint: 'Get all questions right in an adventure',
  },
  { type: '5-day-streak', label: '5-Day Streak', hint: 'Play 5 days in a row' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? 'Grand Wizard';
}

function getXPProgress(
  totalXP: number,
  currentLevel: number
): { xpInLevel: number; xpNeeded: number } {
  const levelIndex = currentLevel - 1;
  const currentThreshold = LEVEL_THRESHOLDS[levelIndex] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] ?? null;
  if (nextThreshold === null) return { xpInLevel: totalXP - currentThreshold, xpNeeded: 0 };
  return { xpInLevel: totalXP - currentThreshold, xpNeeded: nextThreshold - currentThreshold };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChildDashboard() {
  const { activeChild, setActiveChild } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recentCompletion =
    (location.state as { completionData?: CompleteAdventureResponse } | null)?.completionData ??
    null;

  const [adventures, setAdventures] = useState<AdventureSummary[]>([]);
  const [isLoadingAdventures, setIsLoadingAdventures] = useState(true);
  const [barPercent, setBarPercent] = useState(0);
  const [showReward, setShowReward] = useState(!!recentCompletion);

  const totalXP = activeChild?.totalXP ?? 0;
  const currentLevel = activeChild?.currentLevel ?? 1;
  const isMaxLevel = currentLevel >= LEVEL_THRESHOLDS.length;
  const { xpInLevel, xpNeeded } = getXPProgress(totalXP, currentLevel);
  const progressPercent =
    isMaxLevel || xpNeeded === 0 ? 100 : Math.round((xpInLevel / xpNeeded) * 100);

  useEffect(() => {
    if (!activeChild) return;
    adventureService
      .getChildAdventures(activeChild._id)
      .then((data) => setAdventures(data.adventures))
      .catch(() => toast.error('Failed to load adventures'))
      .finally(() => setIsLoadingAdventures(false));
  }, [activeChild]);

  useEffect(() => {
    const t = setTimeout(() => setBarPercent(progressPercent), 150);
    return () => clearTimeout(t);
  }, [progressPercent]);

  useEffect(() => {
    if (!showReward) return;
    const t = setTimeout(() => setShowReward(false), 5000);
    return () => clearTimeout(t);
  }, [showReward]);

  if (!activeChild) return null;

  const inProgressAdventure = adventures.find((a) => a.status === 'in-progress') ?? null;
  const completedAdventures = adventures.filter((a) => a.status === 'completed');
  const completedCount = completedAdventures.length;

  const handleSwitchProfile = () => {
    setActiveChild(null);
    navigate('/profiles');
  };

  return (
    <div
      className="relative min-h-screen flex flex-col items-center p-5 overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #f5f3ff 0%, #fffbeb 50%, #ede9fe 100%)' }}
    >
      <MagicBackground symbols="mixed" count={20} opacity={0.08} />

      <div className="relative z-10 w-full max-w-2xl lg:max-w-6xl flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="text-gold-magic" size={22} />
            <span className="text-lg font-bold text-purple-wizzy">MathMagic</span>
          </Link>
          <button
            onClick={handleSwitchProfile}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-wizzy/10"
          >
            <LogOut size={14} />
            Switch Profile
          </button>
        </div>

        {/* Adventure completion reward banner */}
        {showReward && recentCompletion && (
          <div
            className="rounded-2xl shadow-md px-5 py-4 flex flex-col gap-2"
            style={{
              animation: 'slide-up-fade 0.4s ease-out forwards',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(245,158,11,0.08))',
              border: '1px solid rgba(139,92,246,0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-purple-wizzy uppercase tracking-wide flex items-center gap-1.5">
                🎉 Adventure Reward
              </span>
              <button
                onClick={() => setShowReward(false)}
                className="text-gray-300 hover:text-gray-400 text-lg leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 bg-purple-wizzy/10 rounded-xl px-4 py-2">
                <Zap size={15} className="text-gold-magic fill-gold-magic" />
                <span className="font-bold text-purple-wizzy">+{recentCompletion.xpEarned} XP</span>
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-50 rounded-xl px-4 py-2">
                <Star size={15} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-yellow-600">
                  {recentCompletion.starsEarned}{' '}
                  {recentCompletion.starsEarned === 1 ? 'star' : 'stars'}
                </span>
              </div>
              {recentCompletion.newLevel && (
                <div
                  className="flex items-center gap-1.5 bg-gold-magic/10 border border-gold-magic/30 rounded-xl px-4 py-2"
                  style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
                >
                  <Trophy size={15} className="text-gold-magic" />
                  <span className="font-bold text-amber-700">
                    Level {recentCompletion.newLevel}!
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Hero Identity Card ── */}
        <div
          className="rounded-3xl overflow-hidden shadow-xl"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 60%, #4c1d95 100%)' }}
        >
          {/* Decorative dots pattern */}
          <div className="relative px-6 pt-6 pb-5">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 opacity-10 select-none pointer-events-none text-7xl">
              ✦
            </div>
            <div className="absolute bottom-2 left-4 opacity-10 select-none pointer-events-none text-4xl">
              ★
            </div>

            <div className="flex items-center gap-5">
              {/* Avatar with glow ring */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-24 h-24 rounded-full overflow-hidden"
                  style={{
                    boxShadow:
                      '0 0 0 3px rgba(255,255,255,0.3), 0 0 0 6px rgba(255,255,255,0.1), 0 0 24px rgba(139,92,246,0.6)',
                  }}
                >
                  {activeChild.avatars[activeChild.activeAvatarIndex]?.imageData ? (
                    <img
                      src={activeChild.avatars[activeChild.activeAvatarIndex].imageData}
                      alt={activeChild.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={defaultAvatar}
                      alt={activeChild.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-black text-white truncate">{activeChild.name}</h1>
                <p className="text-white/60 text-xs mt-0.5">Grade {activeChild.gradeLevel}</p>

                {/* Level badge */}
                <div
                  className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: 'rgba(245,158,11,0.25)',
                    border: '1px solid rgba(245,158,11,0.4)',
                    color: '#fbbf24',
                  }}
                >
                  <Trophy size={11} />
                  Level {activeChild.currentLevel} — {getLevelName(activeChild.currentLevel)}
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-xs text-white/60 mb-2">
                <span className="flex items-center gap-1">
                  <Zap size={11} className="text-gold-magic" />
                  {activeChild.totalXP.toLocaleString()} XP
                </span>
                {!isMaxLevel && (
                  <span>{(xpNeeded - xpInLevel).toLocaleString()} XP to next level</span>
                )}
                {isMaxLevel && <span className="text-gold-magic font-semibold">MAX LEVEL 🎓</span>}
              </div>
              <div
                className="w-full h-3 rounded-full overflow-visible relative"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000 ease-out relative"
                  style={{
                    width: `${barPercent}%`,
                    background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    boxShadow: '0 0 10px rgba(245,158,11,0.7)',
                  }}
                />
                {/* Milestone dots */}
                {[25, 50, 75].map((pct) => (
                  <div
                    key={pct}
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{
                      left: `${pct}%`,
                      background:
                        barPercent >= pct ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                      boxShadow: barPercent >= pct ? '0 0 4px rgba(255,255,255,0.8)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Stars count */}
            <div className="flex items-center gap-1.5 mt-3 text-xs text-white/70">
              <Star size={13} className="text-yellow-300 fill-yellow-300" />
              <span>{activeChild.totalStars} stars earned</span>
            </div>
          </div>
        </div>

        {/* ── Wide-screen content grid: stats/badges/resume left, library right ── */}
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:gap-5 lg:items-stretch">
          <div className="flex flex-col gap-5 lg:col-span-1">
            {/* ── Stats Strip ── */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Total XP',
                  value: activeChild.totalXP.toLocaleString(),
                  icon: '⚡',
                  gradient: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(109,40,217,0.08))',
                  border: 'rgba(139,92,246,0.2)',
                  color: '#8b5cf6',
                },
                {
                  label: 'Stars',
                  value: activeChild.totalStars.toString(),
                  icon: '⭐',
                  gradient: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08))',
                  border: 'rgba(245,158,11,0.25)',
                  color: '#d97706',
                },
                {
                  label: 'Adventures',
                  value: isLoadingAdventures ? '…' : completedCount.toString(),
                  icon: '📖',
                  gradient: 'linear-gradient(135deg, rgba(52,211,153,0.15), rgba(16,185,129,0.08))',
                  border: 'rgba(52,211,153,0.25)',
                  color: '#059669',
                },
              ].map(({ label, value, icon, gradient, border, color }) => (
                <div
                  key={label}
                  className="flex flex-col items-center justify-center py-4 px-2 rounded-2xl text-center"
                  style={{ background: gradient, border: `1px solid ${border}` }}
                >
                  <span className="text-2xl mb-1">{icon}</span>
                  <span className="text-xl font-black animate-stat" style={{ color }}>
                    {value}
                  </span>
                  <span className="text-xs text-gray-500 font-medium mt-0.5">{label}</span>
                </div>
              ))}
            </div>

            {/* ── Badges ── */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(139,92,246,0.1)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>🏅</span> Badges
              </h2>

              {activeChild.badges.length > 0 ? (
                <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
                  {activeChild.badges.map((badge, i) => (
                    <div
                      key={badge.badgeType}
                      className="flex flex-col items-center justify-center py-4 px-3 rounded-2xl text-center"
                      style={{
                        background:
                          BADGE_COLORS[badge.badgeType] ??
                          'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                        animation: `badge-pop 0.55s cubic-bezier(0.175,0.885,0.32,1.275) ${i * 80}ms both`,
                      }}
                      title={badge.description}
                    >
                      <span className="text-3xl mb-2">{BADGE_EMOJIS[badge.badgeType] ?? '🏅'}</span>
                      <span className="text-xs font-bold text-white text-center leading-tight">
                        {badge.badgeName}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 lg:grid-cols-2">
                  {PLACEHOLDER_BADGES.map(({ type, label, hint }) => (
                    <div
                      key={type}
                      className="flex flex-col items-center justify-center py-4 px-3 rounded-2xl text-center border-2 border-dashed border-gray-200"
                      title={hint}
                    >
                      <span className="text-3xl mb-2 opacity-30">{BADGE_EMOJIS[type] ?? '🏅'}</span>
                      <span className="text-xs text-gray-300 font-medium text-center leading-tight">
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Resume card ── */}
            {isLoadingAdventures && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(139,92,246,0.1)',
                }}
              >
                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3">
                  Continue Your Adventure
                </h2>
                <div className="flex flex-col gap-3">
                  {[0, 1].map((i) => (
                    <SkeletonCard key={i} kind="row" />
                  ))}
                </div>
              </div>
            )}
            {!isLoadingAdventures && inProgressAdventure && (
              <div
                className="rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.75)',
                  border: '1px solid rgba(139,92,246,0.15)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>🗺️</span> Continue Your Adventure
                </h2>
                <button
                  onClick={() => navigate(`/child/story/${inProgressAdventure._id}`)}
                  className="w-full flex items-center gap-4 rounded-xl p-4 text-left transition-all group hover:scale-[1.01]"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(139,92,246,0.07), rgba(109,40,217,0.04))',
                    border: '2px solid rgba(139,92,246,0.2)',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(139,92,246,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'rgba(139,92,246,0.2)';
                  }}
                >
                  <span className="text-4xl flex-shrink-0">
                    {WORLD_EMOJIS[inProgressAdventure.storyWorld] ?? '✨'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800 group-hover:text-purple-wizzy transition-colors">
                      {WORLD_NAMES[inProgressAdventure.storyWorld] ??
                        inProgressAdventure.storyWorld}
                    </p>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {TOPIC_ICONS[inProgressAdventure.mathTopic] ?? '📚'}{' '}
                      {TOPIC_NAMES[inProgressAdventure.mathTopic] ?? inProgressAdventure.mathTopic}
                      {' · '}Step {inProgressAdventure.currentStepIndex + 1} of{' '}
                      {inProgressAdventure.totalSteps}
                    </p>
                    <div
                      className="w-full h-1.5 rounded-full overflow-hidden mt-2"
                      style={{ background: 'rgba(139,92,246,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.round(((inProgressAdventure.currentStepIndex + 1) / inProgressAdventure.totalSteps) * 100)}%`,
                          background: 'linear-gradient(90deg, #8b5cf6, #f59e0b)',
                        }}
                      />
                    </div>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-300 group-hover:text-purple-wizzy transition-colors flex-shrink-0"
                  />
                </button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 lg:h-full">
            {/* ── Adventure Library ── */}
            <div
              className="rounded-2xl p-5 lg:h-full lg:flex lg:flex-col"
              style={{
                background:
                  !isLoadingAdventures && completedAdventures.length === 0
                    ? 'linear-gradient(135deg, rgba(139,92,246,0.10), rgba(245,158,11,0.14))'
                    : 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(139,92,246,0.1)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span>📚</span> My Adventure Library
              </h2>

              {isLoadingAdventures ? (
                <div className="flex flex-col gap-3">
                  {[0, 1, 2].map((i) => (
                    <SkeletonCard key={i} kind="row" />
                  ))}
                </div>
              ) : completedAdventures.length === 0 ? (
                <div
                  className="flex gap-3 overflow-x-auto pb-2 lg:flex-1 lg:items-center lg:justify-center"
                  style={{ scrollbarWidth: 'none' }}
                >
                  <div
                    className="shrink-0 flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-200 text-center px-3"
                    style={{ width: 140, height: 160 }}
                  >
                    <span className="text-3xl opacity-40">🔮</span>
                    <p className="text-xs text-gray-300 font-medium leading-tight">
                      Complete adventures to fill your library!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <style>{`.adventure-library::-webkit-scrollbar{display:none}`}</style>
                  <div
                    className="adventure-library flex gap-3 overflow-x-auto py-3 px-1 lg:flex-wrap lg:overflow-x-visible"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {completedAdventures.map((adventure) => (
                      <div
                        key={adventure._id}
                        className="shrink-0 flex flex-col items-center justify-center gap-1.5 rounded-2xl p-3 text-center transition-all hover:scale-105 cursor-default select-none"
                        style={{
                          width: 140,
                          height: 160,
                          background:
                            WORLD_GRADIENTS[adventure.storyWorld] ??
                            'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow =
                            '0 8px 24px rgba(0,0,0,0.25)';
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLDivElement).style.boxShadow =
                            '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                      >
                        <span className="text-4xl">
                          {WORLD_EMOJIS[adventure.storyWorld] ?? '✨'}
                        </span>
                        <p className="font-bold text-sm text-white truncate w-full text-center px-1">
                          {WORLD_NAMES[adventure.storyWorld] ?? adventure.storyWorld}
                        </p>
                        <p className="text-xs text-white/70 truncate w-full text-center">
                          {TOPIC_ICONS[adventure.mathTopic] ?? '📚'}{' '}
                          {TOPIC_NAMES[adventure.mathTopic] ?? adventure.mathTopic}
                        </p>
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {[1, 2, 3].map((star) => (
                            <Star
                              key={star}
                              size={14}
                              className={
                                star <= adventure.starsEarned ? 'text-yellow-300' : 'text-white/20'
                              }
                              fill={star <= adventure.starsEarned ? '#fde047' : 'transparent'}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── Start New Adventure CTA ── */}
        <div
          className="relative rounded-3xl p-6 overflow-hidden flex flex-col items-center text-center"
          style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}
        >
          {/* Decorative glowing gold stars scattered across the whole card */}
          {Array.from({ length: 18 }, (_, i) => {
            const left = (i * 137.508 + 4) % 96;
            const top = (i * 3 * 137.508 + 6) % 90;
            const size = ['text-sm', 'text-base', 'text-lg', 'text-xl'][i % 4];
            const symbol = ['★', '✦', '✧', '✨'][i % 4];
            return (
              <span
                key={i}
                className={`absolute select-none pointer-events-none ${size}`}
                style={{
                  left: `${left}%`,
                  top: `${top}%`,
                  color: '#fde68a',
                  textShadow: '0 0 6px rgba(251,191,36,0.9), 0 0 14px rgba(245,158,11,0.7)',
                  animation: `sparkle ${2 + (i % 3)}s ease-in-out ${(i * 0.3) % 3}s infinite`,
                }}
              >
                {symbol}
              </span>
            );
          })}
          <p className="text-white/70 text-sm mb-1">Ready for a new quest?</p>
          <h3 className="text-white text-xl font-black mb-4">Start New Adventure</h3>
          <button
            onClick={() => navigate('/child/adventure')}
            className="flex items-center gap-2 text-purple-wizzy font-bold rounded-xl px-6 py-3 transition-all hover:scale-105 hover:shadow-lg active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              boxShadow: '0 4px 14px rgba(245,158,11,0.45)',
            }}
          >
            <Wand2 size={18} />
            Choose Your Quest
            <BookOpen size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
