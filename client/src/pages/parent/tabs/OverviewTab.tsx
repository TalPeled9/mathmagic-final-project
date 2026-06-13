import { useState, useEffect } from 'react';
import { Zap, Star, Trophy, Clock, Compass, CheckCircle } from 'lucide-react';
import type { IChild } from '@mathmagic/types';
import type { ChildStatistics } from '../../../services/childService';
import { TOPIC_NAMES } from '../../../utils/topicNames';

const BADGE_EMOJIS: Record<string, string> = {
  'first-adventure': '🌟',
  'perfect-score': '💯',
  '5-day-streak': '🔥',
  'speed-master': '⚡',
  'topic-master': '🎓',
  explorer: '🗺️',
};

const WORLD_EMOJIS: Record<string, string> = {
  space: '🚀',
  fantasy: '🏰',
  dinosaur: '🦕',
  ocean: '🌊',
  jungle: '🌿',
  pirates: '☠️',
  robots: '🤖',
  candy: '🍬',
  'magic-school': '🧙',
  'ancient-temple': '🏛️',
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

function StarRating({ count }: { count: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= count ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </span>
  );
}

interface Props {
  child: IChild;
  stats: ChildStatistics;
}

export function OverviewTab({ child, stats }: Props) {
  const [barPercent, setBarPercent] = useState(0);

  const { levelProgress, currentDayStreak, totalAdventuresCompleted, recentAdventures, badges } =
    stats;
  const { currentLevel, levelName, currentXP, currentLevelThresholdXP, xpToNextLevel, isMaxLevel } =
    levelProgress;

  const xpInLevel = currentXP - currentLevelThresholdXP;
  const progressPercent =
    isMaxLevel || !xpToNextLevel ? 100 : Math.round((xpInLevel / xpToNextLevel) * 100);

  useEffect(() => {
    const t = setTimeout(() => setBarPercent(progressPercent), 150);
    return () => clearTimeout(t);
  }, [progressPercent]);

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-1 bg-purple-wizzy/10 text-purple-wizzy text-xs font-semibold px-2.5 py-1 rounded-full">
                <Trophy size={11} />
                Level {currentLevel} — {levelName}
              </span>
              {currentDayStreak > 0 && (
                <span className="flex items-center gap-1 bg-orange-50 text-orange-500 text-xs font-semibold px-2.5 py-1 rounded-full">
                  🔥 {currentDayStreak} day streak
                </span>
              )}
            </div>

            {/* XP bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
                <span className="flex items-center gap-0.5">
                  <Zap size={11} className="text-gold-magic" />
                  {currentXP} XP
                </span>
                {!isMaxLevel && xpToNextLevel && (
                  <span>{xpToNextLevel - xpInLevel} XP to next level</span>
                )}
                {isMaxLevel && (
                  <span className="text-purple-wizzy font-semibold">Max level reached! 🎉</span>
                )}
              </div>
              <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-wizzy to-purple-400 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${barPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1.5">
          <Zap size={20} className="text-gold-magic" />
          <span className="text-xl font-bold text-gray-800">{currentXP}</span>
          <span className="text-xs text-gray-400">Total XP</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1.5">
          <Star size={20} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xl font-bold text-gray-800">{child.totalStars}</span>
          <span className="text-xs text-gray-400">Stars</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1.5">
          <Compass size={20} className="text-blue-400" />
          <span className="text-xl font-bold text-gray-800">{totalAdventuresCompleted}</span>
          <span className="text-xs text-gray-400">Adventures</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-1.5">
          <Clock size={20} className="text-emerald-400" />
          <span className="text-xl font-bold text-gray-800">{child.weeklyLearningMinutes}</span>
          <span className="text-xs text-gray-400">Min this week</span>
        </div>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Earned Badges
          </h3>
          <div className="flex flex-wrap gap-2.5">
            {badges.map((badge) => (
              <div
                key={badge.badgeType}
                title={badge.description}
                className="flex items-center gap-2 bg-purple-wizzy/5 border border-purple-wizzy/10 rounded-xl px-3 py-2 text-sm"
              >
                <span className="text-lg">{BADGE_EMOJIS[badge.badgeType] ?? '🏅'}</span>
                <span className="font-medium text-gray-700">{badge.badgeName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent adventures */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Recent Adventures
        </h3>
        {recentAdventures.length === 0 ? (
          <div className="text-center py-6">
            <Compass size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No adventures completed yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentAdventures.map((a) => (
              <div
                key={String(a.adventureId)}
                className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-purple-wizzy/5 transition-colors"
              >
                <span className="text-xl shrink-0">{WORLD_EMOJIS[a.storyWorld] ?? '✨'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {WORLD_NAMES[a.storyWorld] ?? a.storyWorld}
                  </p>
                  <p className="text-xs text-gray-400">
                    {TOPIC_NAMES[a.mathTopic] ?? a.mathTopic} · {a.accuracyPercent}% accuracy
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StarRating count={a.starsEarned} />
                  <div className="flex items-center gap-0.5 text-xs text-gold-magic font-semibold">
                    <Zap size={11} />
                    {a.xpEarned}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Overall accuracy summary */}
      {totalAdventuresCompleted > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-5 flex items-center gap-4">
          <CheckCircle size={24} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-gray-700">
              {totalAdventuresCompleted} adventure{totalAdventuresCompleted !== 1 ? 's' : ''}{' '}
              completed
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Keep up the great work!</p>
          </div>
        </div>
      )}
    </div>
  );
}
