import { BookOpen } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import type { ChildStatistics } from '../../../services/childService';
import { TOPIC_NAMES } from '../../../utils/topicNames';

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-emerald-50 text-emerald-600',
  medium: 'bg-amber-50 text-amber-600',
  hard: 'bg-red-50 text-red-600',
};

function masteryColor(mastery: number): string {
  if (mastery >= 70) return '#8b5cf6'; // purple-wizzy
  if (mastery >= 40) return '#3b82f6'; // blue
  return '#f59e0b'; // gold-magic
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface Props {
  stats: ChildStatistics;
}

export function TopicsTab({ stats }: Props) {
  const { topics } = stats;

  if (topics.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-10 text-center">
        <BookOpen size={40} className="text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No topics practiced yet</p>
        <p className="text-sm text-gray-400 mt-1">
          Complete an adventure to see topic statistics here
        </p>
      </div>
    );
  }

  const chartData = topics.map((t) => ({
    name: TOPIC_NAMES[t.mathTopic] ?? t.mathTopic,
    accuracy: t.accuracyPercent,
    mastery: t.masteryLevel,
    raw: t,
  }));

  return (
    <div className="space-y-5">
      {/* Accuracy chart */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Accuracy by Topic
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} margin={{ top: 0, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              formatter={(value) => [`${value ?? 0}%`, 'Accuracy']}
              contentStyle={{
                borderRadius: '12px',
                border: '1px solid #e5e7eb',
                fontSize: 12,
              }}
            />
            <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={index} fill={masteryColor(entry.mastery)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-sm bg-amber-400 inline-block" /> Low mastery
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Medium
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-3 h-3 rounded-sm bg-purple-wizzy inline-block" /> High mastery
          </div>
        </div>
      </div>

      {/* Topic cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topics.map((t) => (
          <div key={t.mathTopic} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-gray-800">
                {TOPIC_NAMES[t.mathTopic] ?? t.mathTopic}
              </p>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFFICULTY_STYLES[t.currentDifficulty] ?? 'bg-gray-100 text-gray-500'}`}
              >
                {t.currentDifficulty}
              </span>
            </div>

            {/* Mastery bar */}
            <div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>Mastery</span>
                <span className="font-semibold text-gray-600">{t.masteryLevel}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${t.masteryLevel}%`,
                    backgroundColor: masteryColor(t.masteryLevel),
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t.totalChallenges} challenges · {t.accuracyPercent}% accuracy</span>
              <span className="text-gray-400">Last: {formatDate(t.lastPracticedAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
