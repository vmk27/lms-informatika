import React from 'react';
import { Clock, CheckCircle2, PauseCircle, AlertCircle, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useLms } from '../../context/LmsContext';

interface StudentProgressDetailModalProps {
  studentId: string | null;
  onClose: () => void;
}

export const StudentProgressDetailModal: React.FC<StudentProgressDetailModalProps> = ({
  studentId,
  onClose,
}) => {
  const {
    users,
    classes,
    materials,
    readingSessions,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
  } = useLms();

  if (!studentId) return null;
  const student = users.find((u) => u.id === studentId);
  if (!student) return null;

  const schoolClass = classes.find((c) => c.id === student.classId);
  const studentMaterials = materials.filter(
    (m) => !student.classId || m.classIds.includes(student.classId)
  );
  const studentAssignments = assignments.filter(
    (a) => !student.classId || a.classIds.includes(student.classId)
  );
  const studentQuizzes = quizzes.filter(
    (q) => !student.classId || q.classIds.includes(student.classId)
  );

  return (
    <ModalShell
      isOpen={Boolean(studentId)}
      onClose={onClose}
      title={`Detail Progress Belajar — ${student.name}`}
      description={`NIS: ${student.nis || '-'} · NISN: ${student.nisn || '-'} · Kelas: ${
        schoolClass?.name || '-'
      } · Terakhir Aktif: ${new Date(student.lastActiveAt).toLocaleString('id-ID')}`}
      maxWidthClass="max-w-4xl"
      footer={
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
        >
          Tutup Detail
        </button>
      }
    >
      {/* Ringkasan Sesi Membaca Materi */}
      <div>
        <h3 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span>Rekaman Sesi Membaca Materi & Validasi Timer</span>
        </h3>
        <div className="space-y-3">
          {studentMaterials.map((mat) => {
            const ses = readingSessions.find(
              (s) => s.student_id === student.id && s.material_id === mat.id
            );
            const activeSec = ses?.active_duration_seconds ?? 0;
            const pausedSec = ses?.paused_duration_seconds ?? 0;
            const targetSec = mat.minReadMinutes * 60;
            const pct = Math.min(100, Math.round((activeSec / Math.max(1, targetSec)) * 100));

            return (
              <div
                key={mat.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{mat.title}</div>
                    <div className="text-xs text-slate-500">
                      {mat.subject} · Target Baca Minimum: {mat.minReadMinutes} menit (
                      {targetSec} detik)
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-medium">
                    {ses?.completion_status === 'completed' && (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <CheckCircle2 className="w-4 h-4" /> Selesai Dipelajari
                      </span>
                    )}
                    {ses?.completion_status === 'active' && (
                      <span className="inline-flex items-center gap-1 text-blue-700">
                        <Clock className="w-4 h-4" /> Sedang Membaca (Aktif)
                      </span>
                    )}
                    {ses?.completion_status === 'paused' && (
                      <span className="inline-flex items-center gap-1 text-amber-700">
                        <PauseCircle className="w-4 h-4" /> Dijeda (Tab Tidak Terlihat)
                      </span>
                    )}
                    {(!ses || ses.completion_status === 'not_started') && (
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <AlertCircle className="w-4 h-4" /> Belum Memulai
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-600 mb-1 font-mono">
                    <span>
                      Waktu Aktif: {Math.floor(activeSec / 60)}m {activeSec % 60}d · Waktu Jeda:{' '}
                      {Math.floor(pausedSec / 60)}m {pausedSec % 60}d
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        ses?.completion_status === 'completed'
                          ? 'bg-emerald-600'
                          : ses?.completion_status === 'paused'
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Kontrak Data Sesi (Bagian H) */}
                {ses && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 text-[11px] font-mono text-slate-600">
                    <div>
                      <span className="text-slate-400 block">session_id:</span>
                      {ses.session_id}
                    </div>
                    <div>
                      <span className="text-slate-400 block">visibility_state:</span>
                      {ses.visibility_state} (fokus: {ses.window_focused ? 'ya' : 'tidak'})
                    </div>
                    <div>
                      <span className="text-slate-400 block">last_checkpoint:</span>
                      {ses.last_checkpoint || '-'} ({ses.reached_checkpoints.length}/
                      {mat.checkpoints.length})
                    </div>
                    <div>
                      <span className="text-slate-400 block">last_heartbeat_at:</span>
                      {new Date(ses.last_heartbeat_at).toLocaleTimeString('id-ID')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Ringkasan Tugas & Kuis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        <div className="border border-slate-200 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Status Tugas Siswa</span>
          </h4>
          <div className="space-y-2">
            {studentAssignments.map((asg) => {
              const sub = submissions.find(
                (s) => s.assignmentId === asg.id && s.studentId === student.id
              );
              return (
                <div
                  key={asg.id}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <div className="font-medium text-slate-800">{asg.title}</div>
                    <div className="text-slate-500">
                      {sub
                        ? `Dikumpulkan: ${new Date(sub.submittedAt || '').toLocaleDateString(
                            'id-ID'
                          )}`
                        : 'Belum mengumpulkan'}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-slate-900">
                    {sub?.score !== null && sub?.score !== undefined
                      ? `${sub.score}/100`
                      : sub
                      ? 'Menunggu Nilai'
                      : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border border-slate-200 rounded-lg p-4">
          <h4 className="text-xs font-semibold text-slate-800 mb-3 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Hasil Evaluasi Kuis</span>
          </h4>
          <div className="space-y-2">
            {studentQuizzes.map((qz) => {
              const att = quizAttempts.find(
                (a) => a.quizId === qz.id && a.studentId === student.id
              );
              return (
                <div
                  key={qz.id}
                  className="flex items-center justify-between text-xs py-2 border-b border-slate-100 last:border-0"
                >
                  <div>
                    <div className="font-medium text-slate-800">{qz.title}</div>
                    <div className="text-slate-500">
                      {att
                        ? `Percobaan #${att.attemptNumber} · ${
                            att.status === 'completed' ? 'Selesai' : 'Sedang Dikerjakan'
                          }`
                        : 'Belum mengikuti'}
                    </div>
                  </div>
                  <div className="font-mono font-semibold text-slate-900">
                    {att?.score !== null && att?.score !== undefined ? `${att.score}/100` : '-'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ModalShell>
  );
};
