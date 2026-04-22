import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Sparkles, Star, Zap, LogOut, ChevronRight, BookOpen, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { adventureService } from '@/services/adventureService';
import { WORLD_EMOJIS, type AdventureSummary, type CompleteAdventureResponse } from '@mathmagic/types';

// ── Static config (mirrors server/src/config/levelThresholds.ts) ─────────────

const LEVEL_THRESHOLDS: readonly number[] = [
  0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000,
];

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

// ── Display name maps ─────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)] ?? 'Grand Wizard';
}

function getXPProgress(totalXP: number, currentLevel: number): { xpInLevel: number; xpNeeded: number } {
  const levelIndex = currentLevel - 1;
  const currentThreshold = LEVEL_THRESHOLDS[levelIndex] ?? 0;
  const nextThreshold = LEVEL_THRESHOLDS[levelIndex + 1] ?? null;
  if (nextThreshold === null) return { xpInLevel: totalXP - currentThreshold, xpNeeded: 0 };
  return {
    xpInLevel: totalXP - currentThreshold,
    xpNeeded: nextThreshold - currentThreshold,
  };
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ChildDashboard() {
  const { activeChild, setActiveChild } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const recentCompletion = (location.state as { completionData?: CompleteAdventureResponse } | null)
    ?.completionData ?? null;

  const [adventures, setAdventures] = useState<AdventureSummary[]>([]);
  const [isLoadingAdventures, setIsLoadingAdventures] = useState(true);
  const [barPercent, setBarPercent] = useState(0);
  const [showReward, setShowReward] = useState(!!recentCompletion);

  // Compute progress before hooks so effects can reference it (null-safe for early render)
  const totalXP = activeChild?.totalXP ?? 0;
  const currentLevel = activeChild?.currentLevel ?? 1;
  const isMaxLevel = currentLevel >= LEVEL_THRESHOLDS.length;
  const { xpInLevel, xpNeeded } = getXPProgress(totalXP, currentLevel);
  const progressPercent = isMaxLevel || xpNeeded === 0 ? 100 : Math.round((xpInLevel / xpNeeded) * 100);

  useEffect(() => {
    if (!activeChild) return;
    adventureService
      .getChildAdventures(activeChild._id)
      .then((data) => setAdventures(data.adventures))
      .catch(() => toast.error('Failed to load adventures'))
      .finally(() => setIsLoadingAdventures(false));
  }, [activeChild]);

  // Animate the XP bar on every mount and whenever the value changes
  useEffect(() => {
    const t = setTimeout(() => setBarPercent(progressPercent), 150);
    return () => clearTimeout(t);
  }, [progressPercent]);

  // Auto-hide the reward banner after 5 s
  useEffect(() => {
    if (!showReward) return;
    const t = setTimeout(() => setShowReward(false), 5000);
    return () => clearTimeout(t);
  }, [showReward]);

  if (!activeChild) return null;

  const inProgressAdventure = adventures.find((a) => a.status === 'in-progress') ?? null;
  const hasInProgress = inProgressAdventure !== null;

  const handleSwitchProfile = () => {
    setActiveChild(null);
    navigate('/profiles');
  };

  return (
    <div className="min-h-screen bg-parchment flex flex-col items-center p-6">
      {/* Header */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Sparkles className="text-gold-magic" size={24} />
          <span className="text-xl font-bold text-purple-wizzy">MathMagic</span>
        </div>
        <button
          onClick={handleSwitchProfile}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-purple-wizzy transition-colors px-3 py-1.5 rounded-lg hover:bg-purple-wizzy/10"
        >
          <LogOut size={15} />
          Switch Profile
        </button>
      </div>

      <div className="w-full max-w-2xl flex flex-col gap-6">
        {/* Adventure completion reward banner */}
        {showReward && recentCompletion && (
          <div
            className="bg-white rounded-2xl shadow-sm px-5 py-4 flex flex-col gap-2"
            style={{ animation: 'slide-up-fade 0.4s ease-out forwards' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                Adventure Reward
              </span>
              <button
                onClick={() => setShowReward(false)}
                className="text-gray-300 hover:text-gray-400 text-lg leading-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-1.5 bg-purple-wizzy/10 rounded-xl px-4 py-2">
                <Zap size={16} className="text-gold-magic fill-gold-magic" />
                <span className="font-bold text-purple-wizzy">+{recentCompletion.xpEarned} XP</span>
              </div>
              <div className="flex items-center gap-1.5 bg-yellow-50 rounded-xl px-4 py-2">
                <Star size={16} className="text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-yellow-600">
                  {recentCompletion.starsEarned} {recentCompletion.starsEarned === 1 ? 'star' : 'stars'}
                </span>
              </div>
              {recentCompletion.newLevel && (
                <div
                  className="flex items-center gap-1.5 bg-gold-magic/10 border border-gold-magic/30 rounded-xl px-4 py-2"
                  style={{ animation: 'glow-pulse 2s ease-in-out infinite' }}
                >
                  <Trophy size={16} className="text-gold-magic" />
                  <span className="font-bold text-amber-700">Level {recentCompletion.newLevel}!</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Child Identity Card */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-wizzy/20 flex-shrink-0">
            {activeChild.avatarUrl ? (
              <img
                src={activeChild.avatarUrl}
                alt={activeChild.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-purple-wizzy/10 flex items-center justify-center">
                <span className="text-3xl font-bold text-purple-wizzy">
                  {activeChild.name[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-gray-800">{activeChild.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">Grade {activeChild.gradeLevel}</p>

            <div className="flex items-center justify-center sm:justify-start gap-1 mt-2">
              <Trophy size={14} className="text-purple-wizzy" />
              <span className="text-sm font-semibold text-purple-wizzy">
                Level {activeChild.currentLevel} — {getLevelName(activeChild.currentLevel)}
              </span>
            </div>

            {/* XP progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span className="flex items-center gap-0.5">
                  <Zap size={11} className="text-gold-magic" />
                  {activeChild.totalXP} XP
                </span>
                {!isMaxLevel && (
                  <span>{xpNeeded - xpInLevel} XP to next level</span>
                )}
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-wizzy rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${barPercent}%` }}
                />
              </div>
            </div>

            {/* Stars */}
            <div className="flex items-center justify-center sm:justify-start gap-1 mt-3 text-sm text-gray-500">
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <span>{activeChild.totalStars} stars earned</span>
            </div>
          </div>
        </div>

        {/* Badges */}
        {activeChild.badges.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Badges
            </h2>
            <div className="flex flex-wrap gap-3">
              {activeChild.badges.map((badge) => (
                <div
                  key={badge.badgeType}
                  className="flex items-center gap-2 bg-purple-wizzy/5 border border-purple-wizzy/10 rounded-xl px-3 py-2 text-sm"
                  title={badge.description}
                >
                  <span className="text-lg">
                    {BADGE_EMOJIS[badge.badgeType] ?? '🏅'}
                  </span>
                  <span className="font-medium text-gray-700">{badge.badgeName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resume card (conditional) */}
        {!isLoadingAdventures && hasInProgress && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Continue Your Adventure
            </h2>
            <button
              onClick={() => navigate(`/child/story/${inProgressAdventure!._id}`)}
              className="w-full flex items-center gap-4 bg-purple-wizzy/5 hover:bg-purple-wizzy/10 border-2 border-purple-wizzy/20 hover:border-purple-wizzy/40 rounded-xl p-4 text-left transition-all group"
            >
              <span className="text-3xl flex-shrink-0">
                {WORLD_EMOJIS[inProgressAdventure!.storyWorld] ?? '✨'}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 group-hover:text-purple-wizzy transition-colors">
                  {WORLD_NAMES[inProgressAdventure!.storyWorld] ?? inProgressAdventure!.storyWorld}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {TOPIC_ICONS[inProgressAdventure!.mathTopic] ?? '📚'}{' '}
                  {TOPIC_NAMES[inProgressAdventure!.mathTopic] ?? inProgressAdventure!.mathTopic}
                  {' · '}
                  Step {inProgressAdventure!.currentStepIndex + 1} of {inProgressAdventure!.totalSteps}
                </p>
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-purple-wizzy rounded-full"
                    style={{
                      width: `${Math.round(((inProgressAdventure!.currentStepIndex + 1) / inProgressAdventure!.totalSteps) * 100)}%`,
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

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Ready to Play?
          </h2>
          <button
            onClick={() => navigate('/child/adventure')}
            className="w-full flex items-center justify-center gap-2 bg-purple-wizzy text-white rounded-xl px-6 py-3 font-bold hover:bg-purple-700 transition-all"
          >
            <BookOpen size={18} />
            Start New Adventure
          </button>
        </div>
      </div>
    </div>
  );
}
