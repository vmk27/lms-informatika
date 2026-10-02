import React from 'react';
import { User, Shield, BookOpen, FileText, CheckCircle2 } from 'lucide-react';
import { useLms } from '../../context/LmsContext';

export const StudentProfileView: React.FC = () => {
  const { currentUser, classes, readingSessions, submissions, quizAttempts } = useLms();
  const schoolClass = classes.find((c) => c.id === currentUser?.classId);

  const completedSessions = readingSessions.filter(
    (s) => s.student_id === currentUser?.id && s.completion_status === 'completed'
  );
  const totalActiveSeconds = readingSessions
    .filter((s) => s.student_id === currentUser?.id)
    .reduce((acc, s) => acc + s.active_duration_seconds, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-6 border-b border-slate-200">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shrink-0">
            {currentUser?.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{currentUser?.name}</h1>
            <div className="text-xs text-slate-500 font-mono mt-1">
              Username: <span className="text-blue-700">{currentUser?.username}</span> · NIS:{' '}
              {currentUser?.nis || '-'} · NISN: {currentUser?.nisn || '-'}
            </div>
            <div className="text-xs text-slate-600 font-medium mt-0.5">
              Rombel: {schoolClass?.name || '-'} (Tahun Ajaran {schoolClass?.academicYear})
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-xs text-slate-500">Materi Tuntas</div>
            <div className="text-2xl font-bold font-mono text-slate-900">
              {completedSessions.length}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-xs text-slate-500">Total Waktu Belajar Aktif</div>
            <div className="text-2xl font-bold font-mono text-blue-700">
              {Math.floor(totalActiveSeconds / 60)} Menit
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="text-xs text-slate-500">Status Akun Siswa</div>
            <div className="text-2xl font-bold text-emerald-700">Aktif Terverifikasi</div>
          </div>
        </div>

        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-950">
          <div className="font-bold flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-700" />
            <span>Keamanan Sesi & Autentikasi</span>
          </div>
          <p className="leading-relaxed text-slate-700">
            Akun siswa diautentikasi dengan token sesi aman. Pada integrasi Tahap 2, autentikasi akan ditangani langsung oleh Supabase Auth dengan Row Level Security (RLS).
          </p>
        </div>
      </div>
    </div>
  );
};
