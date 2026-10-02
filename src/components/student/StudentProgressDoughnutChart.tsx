import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { BookOpen, CheckCircle2, Clock, CircleAlert } from 'lucide-react';
import { Material, ReadingSession } from '../../types/lms';

interface StudentProgressDoughnutChartProps {
  materials: Material[];
  readingSessions: ReadingSession[];
  studentId: string;
  isMaterialCompletedByStudent: (studentId: string, materialId: string) => boolean;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-[#192A23] text-white p-3 rounded-xl shadow-xl border border-[#23382E] text-xs space-y-1 min-w-[170px]">
        <div className="flex items-center gap-1.5 font-bold text-white pb-1 border-b border-[#23382E]">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: data.color }}
          />
          <span>{data.name}</span>
        </div>
        <div className="flex items-center justify-between text-[#C5D0C8] pt-1">
          <span>Jumlah Materi:</span>
          <span className="font-mono font-bold text-white">{data.value} modul</span>
        </div>
        <div className="flex items-center justify-between text-[#C5D0C8]">
          <span>Persentase:</span>
          <span className="font-mono font-bold text-emerald-300">{data.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const StudentProgressDoughnutChart: React.FC<StudentProgressDoughnutChartProps> = ({
  materials,
  readingSessions,
  studentId,
  isMaterialCompletedByStudent,
}) => {
  const chartData = useMemo(() => {
    const totalCount = materials.length;
    if (totalCount === 0) {
      return [
        { name: 'Selesai', value: 0, percentage: 0, color: '#276749', icon: CheckCircle2 },
        { name: 'Sedang Dibaca', value: 0, percentage: 0, color: '#48a878', icon: Clock },
        { name: 'Belum Dimulai', value: 1, percentage: 100, color: '#858d86', icon: CircleAlert },
      ];
    }

    let completedCount = 0;
    let inProgressCount = 0;
    let notStartedCount = 0;

    materials.forEach((m) => {
      const isCompleted = isMaterialCompletedByStudent(studentId, m.id);
      if (isCompleted) {
        completedCount++;
      } else {
        const ses = readingSessions.find(
          (s) => s.student_id === studentId && s.material_id === m.id
        );
        if (ses && ses.active_duration_seconds > 0) {
          inProgressCount++;
        } else {
          notStartedCount++;
        }
      }
    });

    return [
      {
        name: 'Materi Tuntas',
        value: completedCount,
        percentage: Math.round((completedCount / totalCount) * 100),
        color: '#276749', // Forest Green
        icon: CheckCircle2,
      },
      {
        name: 'Sedang Dibaca',
        value: inProgressCount,
        percentage: Math.round((inProgressCount / totalCount) * 100),
        color: '#48a878', // Emerald Accent
        icon: Clock,
      },
      {
        name: 'Belum Dimulai',
        value: notStartedCount,
        percentage: Math.round((notStartedCount / totalCount) * 100),
        color: '#858d86', // Neutral Grayish
        icon: CircleAlert,
      },
    ];
  }, [materials, readingSessions, studentId, isMaterialCompletedByStudent]);

  const totalMaterials = materials.length;
  const completedItem = chartData.find((d) => d.name === 'Materi Tuntas');
  const overallPct = completedItem ? completedItem.percentage : 0;

  return (
    <div className="bg-white border border-[#E5E9E3] rounded-2xl p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[#E5E9E3]">
        <div>
          <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2">
            <BookOpen className="w-4.5 h-4.5 text-[#276749]" />
            <span>Progres Belajar Materi (Doughnut Chart)</span>
          </h3>
          <p className="text-xs text-[#68736B]">
            Distribusi kelulusan dan keaktifan membaca seluruh modul terdaftar
          </p>
        </div>
        <span className="text-xs font-mono font-bold text-[#276749] bg-[#E5F3E8] px-2.5 py-1 rounded-lg border border-[#48A878]/30">
          Total {totalMaterials} Modul
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Doughnut Chart Canvas with Center Text */}
        <div className="md:col-span-5 relative flex items-center justify-center h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Donut Center Overlay Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-bold font-mono text-[#202923] leading-none">
              {overallPct}%
            </span>
            <span className="text-[10px] uppercase font-bold text-[#68736B] tracking-wider mt-1">
              Tuntas
            </span>
          </div>
        </div>

        {/* Legend Cards */}
        <div className="md:col-span-7 space-y-2">
          {chartData.map((item) => {
            const Icon = item.icon || BookOpen;
            return (
              <div
                key={item.name}
                className="p-3 rounded-xl border border-[#E5E9E3] bg-[#F7F7F2] flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <Icon className="w-4 h-4 text-[#68736B] shrink-0" />
                  <span className="font-semibold text-[#202923] truncate">{item.name}</span>
                </div>

                <div className="flex items-center gap-3 font-mono shrink-0">
                  <span className="text-[#68736B]">{item.value} modul</span>
                  <span
                    className="font-bold text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${item.color}20`, color: item.color === '#858d86' ? '#202923' : item.color }}
                  >
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
