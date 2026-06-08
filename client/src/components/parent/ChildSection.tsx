import { useEffect, useState } from 'react';
import { LayoutDashboard, BookOpen, Clock, Settings, Trophy, Star, Zap } from 'lucide-react';
import { ParentLoader } from '@/components/loaders';
import { childService, type ChildStatistics, type ChildWithTopics } from '@/services/childService';
import type { IChild } from '@mathmagic/types';
import defaultAvatar from '@/assets/default_avatar.png';
import { OverviewTab } from '@/pages/parent/tabs/OverviewTab';
import { TopicsTab } from '@/pages/parent/tabs/TopicsTab';
import { LearningTimeTab } from '@/pages/parent/tabs/LearningTimeTab';
import { SettingsTab } from '@/pages/parent/tabs/SettingsTab';

type Tab = 'overview' | 'topics' | 'time' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'topics', label: 'Topics', icon: BookOpen },
  { id: 'time', label: 'Time', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const LEVEL_THRESHOLDS: readonly number[] = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7500, 10000];

function xpPercent(totalXP: number, currentLevel: number): number {
  const idx = currentLevel - 1;
  const curr = LEVEL_THRESHOLDS[idx] ?? 0;
  const next = LEVEL_THRESHOLDS[idx + 1] ?? null;
  if (next === null) return 100;
  return Math.round(((totalXP - curr) / (next - curr)) * 100);
}

interface Props {
  child: ChildWithTopics;
}

export function ChildSection({ child: initialChild }: Props) {
  const [childData, setChildData] = useState<IChild>(initialChild);
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<ChildStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    childService
      .getStatistics(childData._id)
      .then(setStats)
      .finally(() => setStatsLoading(false));
  }, [childData._id]);

  const avatar = childData.avatars[childData.activeAvatarIndex];
  const percent = xpPercent(childData.totalXP, childData.currentLevel);
  const isActive = childData.weeklyLearningMinutes > 0;
  const streak = stats?.currentDayStreak ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* ── Child identity header ── */}
      <div className="px-5 py-4 bg-gradient-to-r from-purple-wizzy/5 to-transparent border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-purple-wizzy/20 shrink-0">
            {avatar?.imageData ? (
              <img src={avatar.imageData} alt={childData.name} className="w-full h-full object-cover" />
            ) : (
              <img src={defaultAvatar} alt={childData.name} className="w-full h-full object-cover" />
            )}
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-gray-800 text-base leading-tight">{childData.name}</span>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                Grade {childData.gradeLevel}
              </span>
              <span className="flex items-center gap-0.5 text-xs bg-purple-wizzy/10 text-purple-wizzy px-2 py-0.5 rounded-full font-medium">
                <Trophy size={10} />
                Lv {childData.currentLevel}
              </span>
              {streak > 0 && (
                <span className="text-xs font-semibold text-orange-500">🔥 {streak}d streak</span>
              )}
              <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isActive ? 'text-emerald-600 bg-emerald-50' : 'text-gray-400 bg-gray-50'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {/* Mini XP bar */}
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-wizzy to-violet-500 rounded-full transition-all duration-700"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-0.5">
                <Zap size={9} className="text-gold-magic" />
                {childData.totalXP} XP
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-3 shrink-0 ml-2">
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-0.5 text-xs font-bold text-gray-700">
                <Star size={11} className="text-yellow-400 fill-yellow-400" />
                {childData.totalStars}
              </span>
              <span className="text-[10px] text-gray-400">stars</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-gray-700">{childData.weeklyLearningMinutes}</span>
              <span className="text-[10px] text-gray-400">min/wk</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar (underline style) ── */}
      <div className="flex border-b border-gray-100 px-2 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActiveTab = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActiveTab
                  ? 'border-purple-wizzy text-purple-wizzy'
                  : 'border-transparent text-gray-400 hover:text-purple-wizzy hover:border-purple-wizzy/30'
              }`}
            >
              <Icon size={13} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Tab content ── */}
      <div className="p-4 sm:p-5">
        {statsLoading ? (
          <div className="py-6">
            <ParentLoader message="Loading stats…" />
          </div>
        ) : !stats ? (
          <p className="text-center text-sm text-gray-400 py-8">
            Could not load statistics. Please refresh.
          </p>
        ) : (
          <div key={activeTab} style={{ animation: 'slide-up-fade 0.25s ease-out forwards' }}>
            {activeTab === 'overview' && <OverviewTab child={childData} stats={stats} />}
            {activeTab === 'topics' && <TopicsTab stats={stats} />}
            {activeTab === 'time' && <LearningTimeTab stats={stats} />}
            {activeTab === 'settings' && (
              <SettingsTab child={childData} onChildUpdate={setChildData} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
