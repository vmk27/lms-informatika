import React from 'react';
import { History, Clock, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { useLms } from '../../context/LmsContext';

export const StudentActivityView: React.FC = () => {
  const { currentUser, readingSessions, materials, submissions, assignments, quizAttempts, quizzes } =
    useLms();

  const mySessions = readingSessions.filter((s) => s.student_id === currentUser?.id);
  const mySubmissions = submissions.filter((s) => s.studentId === currentUser?.id);
  const myQuizAttempts = quizAttempts.filter((a) => a.studentId === currentUser?.id);

  // Gabungkan seluruh aktivitas menjadi timeline
  const activities = [
    ...mySessions.map((s) => {
      const mat = materials.find((m) => m.id === s.material_id);
      return {
        id: s.session_id,
        type: 'material',
        title: `Membaca Materi: ${mat?.title || s.material_id}`,
        details: `Waktu aktif: ${Math.floor(s.active_duration_seconds / 60)}m ${
          s.active_duration_seconds % 60
        }d · Status: ${s.completion_status.toUpperCase()}`,
        timestamp: s.last_heartbeat_at,
      };
    }),
    ...mySubmissions.map((sub) => {
      const asg = assignments.find((a) => a.id === sub.assignmentId);
      return {
        id: sub.id,
        type: 'assignment',
        title: `Pengumpulan Tugas: ${asg?.title || sub.assignmentId}`,
        details: `Percobaan ke-${sub.attemptCount} · ${
          sub.score !== null ? `Nilai: ${sub.score}/100` : 'Menunggu Penilaian'
        }`,
        timestamp: sub.submittedAt || '',
      };
    }),
    ...myQuizAttempts.map((att) => {
      const qz = quizzes.find((q) => q.id === att.quizId);
      return {
        id: att.id,
        type: 'quiz',
        title: `Evaluasi Kuis: ${qz?.title || att.quizId}`,
        details: `Percobaan #${att.attemptNumber} · ${
          att.score !== null ? `Skor: ${att.score}/100` : 'Sedang Berlangsung'
        }`,
        timestamp: att.lastSavedAt,
      };
    }),
  ]
    .filter((a) => Boolean(a.timestamp))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h1 className="text-xl font-bold text-slate-900">Riwayat Aktivitas Belajar</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Jejak rekaman sesi belajar, pengumpulan tugas, dan penyelesaian kuis Anda.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0 text-xs"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              {act.type === 'material' ? (
                <BookOpen className="w-4 h-4" />
              ) : act.type === 'assignment' ? (
                <FileText className="w-4 h-4" />
              ) : (
                <HelpCircle className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="font-bold text-slate-900 text-sm">{act.title}</div>
                <div className="font-mono text-[11px] text-slate-400 shrink-0">
                  {new Date(act.timestamp).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="text-slate-600 mt-0.5">{act.details}</div>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada catatan aktivitas pembelajaran.
          </div>
        )}
      </div>
    </div>
  );
};
