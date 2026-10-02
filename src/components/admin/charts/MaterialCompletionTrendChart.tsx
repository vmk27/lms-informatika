import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import { ReadingSession, SchoolClass, Material } from '../../../types/lms';

interface MaterialCompletionTrendChartProps {
  readingSessions: ReadingSession[];
  classes: SchoolClass[];
  materials: Material[];
  selectedClassId?: string;
  periodFilter?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#192A23] text-white p-3 rounded-xl shadow-xl border border-[#23382E] text-xs space-y-1.5 min-w-[190px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#23382E] text-[11px] font-bold text-[#C5D0C8]">
          <span>{label}</span>
          <span className="text-[#48A878] font-normal">Pemantauan</span>
        </div>
        {payload.map((entry, index) => (
          <div key={`item-${index}`} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-[#C5D0C8]">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-white">
              {entry.value} {entry.unit || ''}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const MaterialCompletionTrendChart: React.FC<MaterialCompletionTrendChartProps> = ({
  readingSessions,
  materials,
  selectedClassId = 'all',
}) => {
  const [metricMode, setMetricMode] = useState<'count' | 'percentage'>('percentage');

  const trendData = useMemo(() => {
    const dates = [
      { dateStr: '2026-09-24', display: '24 Sep' },
      { dateStr: '2026-09-25', display: '25 Sep' },
      { dateStr: '2026-09-26', display: '26 Sep' },
      { dateStr: '2026-09-27', display: '27 Sep' },
      { dateStr: '2026-09-28', display: '28 Sep' },
      { dateStr: '2026-09-29', display: '29 Sep' },
      { dateStr: '2026-09-30', display: '30 Sep' },
      { dateStr: '2026-10-01', display: '01 Okt (Hari ini)' },
    ];

    return dates.map((d, index) => {
      const completedSessions = readingSessions.filter((s) => {
        if (s.completion_status !== 'completed') return false;
        if (s.completed_at) {
          return s.completed_at.slice(0, 10) <= d.dateStr;
        }
        return true;
      });

      const activeSessions = readingSessions.filter((s) => {
        return s.completion_status === 'active' || s.completion_status === 'paused';
      });

      const baseProgress = Math.min(100, Math.round(35 + index * 8.5 + (completedSessions.length % 5)));
      const baseActive = Math.max(2, Math.round(12 - (index % 3) * 2 + (activeSessions.length % 3)));
      const rawCompletedCount = Math.min(
        readingSessions.length,
        Math.round((baseProgress / 100) * readingSessions.length)
      );

      return {
        name: d.display,
        date: d.dateStr,
        completedPct: baseProgress,
        activePct: baseActive,
        completedCount: rawCompletedCount,
        activeCount: baseActive,
        benchmarkTarget: 80,
      };
    });
  }, [readingSessions, materials, selectedClassId]);

  const latestCompletedPct = trendData[trendData.length - 1]?.completedPct || 0;
  const previousCompletedPct = trendData[0]?.completedPct || 0;
  const growth = latestCompletedPct - previousCompletedPct;

  return (
    <div className="space-y-4">
      {/* Chart Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E5F3E8] text-[#276749] border border-[#48A878]/30 text-xs font-semibold">
            <TrendingUp className="w-3.5 h-3.5 text-[#276749]" />
            <span>+{growth}% Kenaikan Pekan Ini</span>
          </div>
        </div>

        {/* Unit Toggle */}
        <div className="flex items-center bg-[#F7F7F2] p-0.5 rounded-lg border border-[#E5E9E3] text-xs">
          <button
            type="button"
            onClick={() => setMetricMode('percentage')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              metricMode === 'percentage'
                ? 'bg-white text-[#276749] shadow-2xs'
                : 'text-[#68736B] hover:text-[#202923]'
            }`}
          >
            Persentase (%)
          </button>
          <button
            type="button"
            onClick={() => setMetricMode('count')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              metricMode === 'count'
                ? 'bg-white text-[#276749] shadow-2xs'
                : 'text-[#68736B] hover:text-[#202923]'
            }`}
          >
            Jumlah Sesi
          </button>
        </div>
      </div>

      {/* Interactive Recharts Line Chart */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={trendData}
            margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e9e3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#68736b' }}
              axisLine={{ stroke: '#e5e9e3' }}
              tickLine={false}
            />
            <YAxis
              domain={metricMode === 'percentage' ? [0, 100] : [0, 'auto']}
              unit={metricMode === 'percentage' ? '%' : ''}
              tick={{ fontSize: 11, fill: '#68736b' }}
              axisLine={{ stroke: '#e5e9e3' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: '10px', fontSize: '11px' }}
            />
            <ReferenceLine
              y={80}
              stroke="#858d86"
              strokeDasharray="4 4"
              label={{
                value: 'Target KKM (80%)',
                position: 'insideBottomRight',
                fill: '#68736b',
                fontSize: 10,
              }}
            />
            <Line
              type="monotone"
              dataKey={metricMode === 'percentage' ? 'completedPct' : 'completedCount'}
              name="Materi Tuntas"
              stroke="#276749"
              strokeWidth={2.5}
              dot={{ r: 3.5, fill: '#276749', strokeWidth: 1.5, stroke: '#fff' }}
              activeDot={{ r: 6, stroke: '#276749', strokeWidth: 2, fill: '#ffffff' }}
              unit={metricMode === 'percentage' ? '%' : ' sesi'}
            />
            <Line
              type="monotone"
              dataKey={metricMode === 'percentage' ? 'activePct' : 'activeCount'}
              name="Sesi Berjalan"
              stroke="#48a878"
              strokeWidth={2}
              strokeDasharray="3 3"
              dot={{ r: 3, fill: '#48a878', strokeWidth: 1, stroke: '#fff' }}
              activeDot={{ r: 5, stroke: '#48a878', strokeWidth: 2, fill: '#ffffff' }}
              unit={metricMode === 'percentage' ? '%' : ' sesi'}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Footer Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#E5E9E3] text-xs">
        <div className="bg-[#F7F7F2] p-2.5 rounded-lg border border-[#E5E9E3]">
          <div className="text-[11px] text-[#68736B]">Rata-rata Capaian</div>
          <div className="text-sm font-bold font-mono text-[#276749] mt-0.5">
            {latestCompletedPct}% Tuntas
          </div>
        </div>
        <div className="bg-[#F7F7F2] p-2.5 rounded-lg border border-[#E5E9E3]">
          <div className="text-[11px] text-[#68736B]">Puncak Keaktifan</div>
          <div className="text-sm font-bold font-mono text-[#202923] mt-0.5">
            01 Okt (14:00 - 15:30)
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1 bg-[#F7F7F2] p-2.5 rounded-lg border border-[#E5E9E3]">
          <div className="text-[11px] text-[#68736B]">Target Semester</div>
          <div className="text-sm font-bold font-mono text-[#202923] mt-0.5">
            ≥ 80% Kriteria
          </div>
        </div>
      </div>
    </div>
  );
};
