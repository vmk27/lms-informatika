import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { Award } from 'lucide-react';
import { AssignmentSubmission, QuizAttempt } from '../../../types/lms';

interface GradeDistributionChartProps {
  submissions: AssignmentSubmission[];
  quizAttempts: QuizAttempt[];
  selectedClassId?: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#192A23] text-white p-3 rounded-xl shadow-xl border border-[#23382E] text-xs space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#23382E]">
          <span className="font-bold text-white">{label}</span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
              data.isPassing ? 'bg-[#2F855A]/30 text-emerald-300 border border-[#2F855A]/50' : 'bg-red-950 text-red-300 border border-red-800'
            }`}
          >
            {data.isPassing ? 'Tuntas (≥ KKM)' : 'Perlu Remedial'}
          </span>
        </div>
        <div className="space-y-1 text-xs text-[#C5D0C8] pt-0.5">
          <div className="flex items-center justify-between">
            <span>Total Siswa/Nilai:</span>
            <span className="font-mono font-bold text-white">{data.count} ({data.percentage}%)</span>
          </div>
          <div className="flex items-center justify-between text-[#A3B1A8]">
            <span>Dari Tugas:</span>
            <span className="font-mono text-white">{data.taskCount} berkas</span>
          </div>
          <div className="flex items-center justify-between text-[#A3B1A8]">
            <span>Dari Kuis:</span>
            <span className="font-mono text-white">{data.quizCount} pengerjaan</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const GradeDistributionChart: React.FC<GradeDistributionChartProps> = ({
  submissions,
  quizAttempts,
}) => {
  const [filterSource, setFilterSource] = useState<'all' | 'assignments' | 'quizzes'>('all');

  const chartData = useMemo(() => {
    const taskScores: number[] = [];
    const quizScores: number[] = [];

    if (filterSource === 'all' || filterSource === 'assignments') {
      submissions.forEach((s) => {
        if (s.score !== null) taskScores.push(s.score);
      });
    }

    if (filterSource === 'all' || filterSource === 'quizzes') {
      quizAttempts.forEach((q) => {
        if (q.score !== null) quizScores.push(q.score);
      });
    }

    const totalScoresCount = Math.max(1, taskScores.length + quizScores.length);

    const buckets = [
      {
        range: '90 – 100',
        label: '90 – 100 (Sangat Baik)',
        shortLabel: '90-100',
        min: 90,
        max: 100,
        color: '#276749', // Forest Green
        isPassing: true,
      },
      {
        range: '80 – 89',
        label: '80 – 89 (Baik)',
        shortLabel: '80-89',
        min: 80,
        max: 89.9,
        color: '#48a878', // Emerald
        isPassing: true,
      },
      {
        range: '75 – 79',
        label: '75 – 79 (Cukup / KKM)',
        shortLabel: '75-79 (KKM)',
        min: 75,
        max: 79.9,
        color: '#d99a2b', // Amber
        isPassing: true,
      },
      {
        range: '< 75',
        label: '< 75 (Perlu Remedial)',
        shortLabel: '< 75',
        min: 0,
        max: 74.9,
        color: '#d9534f', // Red
        isPassing: false,
      },
    ];

    return buckets.map((b) => {
      const tasksInBucket = taskScores.filter((s) => s >= b.min && s <= b.max).length;
      const quizzesInBucket = quizScores.filter((s) => s >= b.min && s <= b.max).length;
      const count = tasksInBucket + quizzesInBucket;
      const percentage = Math.round((count / totalScoresCount) * 100);

      return {
        ...b,
        count,
        taskCount: tasksInBucket,
        quizCount: quizzesInBucket,
        percentage,
      };
    });
  }, [submissions, quizAttempts, filterSource]);

  const totalEvaluated = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const passingCount = useMemo(() => {
    return chartData.filter((b) => b.isPassing).reduce((acc, curr) => acc + curr.count, 0);
  }, [chartData]);

  const passingRate = totalEvaluated > 0 ? Math.round((passingCount / totalEvaluated) * 100) : 100;

  return (
    <div className="space-y-4">
      {/* Chart Control & Source Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#E5F3E8] text-[#276749] border border-[#48A878]/30 text-xs font-semibold">
          <Award className="w-3.5 h-3.5 text-[#276749]" />
          <span>{passingRate}% Siswa Memenuhi KKM (≥75)</span>
        </div>

        {/* Source Toggle */}
        <div className="flex items-center bg-[#F7F7F2] p-0.5 rounded-lg border border-[#E5E9E3] text-xs">
          <button
            type="button"
            onClick={() => setFilterSource('all')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              filterSource === 'all'
                ? 'bg-white text-[#276749] shadow-2xs'
                : 'text-[#68736B] hover:text-[#202923]'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setFilterSource('assignments')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              filterSource === 'assignments'
                ? 'bg-white text-[#276749] shadow-2xs'
                : 'text-[#68736B] hover:text-[#202923]'
            }`}
          >
            Tugas
          </button>
          <button
            type="button"
            onClick={() => setFilterSource('quizzes')}
            className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
              filterSource === 'quizzes'
                ? 'bg-white text-[#276749] shadow-2xs'
                : 'text-[#68736B] hover:text-[#202923]'
            }`}
          >
            Kuis
          </button>
        </div>
      </div>

      {/* Interactive Recharts Bar Chart */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e9e3" vertical={false} />
            <XAxis
              dataKey="shortLabel"
              tick={{ fontSize: 11, fill: '#68736b' }}
              axisLine={{ stroke: '#e5e9e3' }}
              tickLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: '#68736b' }}
              axisLine={{ stroke: '#e5e9e3' }}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" name="Jumlah Nilai" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Legend Footers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#E5E9E3] text-xs">
        {chartData.map((b) => (
          <div key={b.range} className="p-2 rounded-lg border border-[#E5E9E3] bg-[#F7F7F2]">
            <div className="flex items-center gap-1.5 text-[11px] text-[#68736B]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: b.color }}
              />
              <span className="truncate">{b.range}</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between font-mono">
              <span className="font-bold text-[#202923] text-sm">{b.count}</span>
              <span className="text-[11px] text-[#68736B]">{b.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
