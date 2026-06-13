import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { ChildStatistics } from '../../../services/childService';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return DAY_LABELS[d.getDay()] ?? dateStr;
}

interface Props {
  stats: ChildStatistics;
}

export function LearningTimeTab({ stats }: Props) {
  const { learningTime } = stats;
  const { thisWeekMinutes, lastWeekMinutes, dailyBreakdown } = learningTime;

  // dailyBreakdown: indices 0-6 = last week, 7-13 = this week
  const chartData = dailyBreakdown.map((d, i) => ({
    day: getDayLabel(d.date),
    minutes: d.minutes,
    week: i < 7 ? 'Last Week' : 'This Week',
  }));

  const lastWeekData = chartData.slice(0, 7);
  const thisWeekData = chartData.slice(7);

  // Interleave for grouped display — show two separate charts instead
  const weekData = thisWeekData.map((d, i) => ({
    day: d.day,
    'This Week': d.minutes,
    'Last Week': lastWeekData[i]?.minutes ?? 0,
  }));

  const diff = thisWeekMinutes - lastWeekMinutes;
  const diffPercent =
    lastWeekMinutes > 0 ? Math.round((Math.abs(diff) / lastWeekMinutes) * 100) : null;

  const TrendIcon = diff > 0 ? TrendingUp : diff < 0 ? TrendingDown : Minus;
  const trendColor = diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-red-400' : 'text-gray-400';

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-purple-wizzy" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              This Week
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{thisWeekMinutes}</p>
          <p className="text-xs text-gray-400 mt-0.5">minutes</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-gray-300" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Last Week
            </span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{lastWeekMinutes}</p>
          <p className="text-xs text-gray-400 mt-0.5">minutes</p>
        </div>
      </div>

      {/* Trend summary */}
      {(diff !== 0 || lastWeekMinutes > 0) && (
        <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3">
          <TrendIcon size={20} className={trendColor} />
          <p className="text-sm text-gray-600">
            {diff === 0
              ? 'Same learning time as last week'
              : diff > 0
                ? `${diff} more minutes than last week${diffPercent !== null ? ` (+${diffPercent}%)` : ''}`
                : `${Math.abs(diff)} fewer minutes than last week${diffPercent !== null ? ` (-${diffPercent}%)` : ''}`}
          </p>
        </div>
      )}

      {/* 14-day chart */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
          Daily Learning (Last 14 Days)
        </h3>
        {thisWeekMinutes === 0 && lastWeekMinutes === 0 ? (
          <div className="text-center py-8">
            <Clock size={36} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No learning sessions recorded yet</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={weekData}
              margin={{ top: 0, right: 8, left: -20, bottom: 0 }}
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}m`}
              />
              <Tooltip
                formatter={(value, name) => [`${value ?? 0} min`, name]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                iconType="square"
                iconSize={10}
              />
              <Bar dataKey="Last Week" fill="#c4b5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="This Week" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
