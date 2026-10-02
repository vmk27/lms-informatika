import React from 'react';
import { HelpCircle, Clock, CheckCircle2, Lock, ArrowRight, Award } from 'lucide-react';
import { useLms } from '../../context/LmsContext';

export const StudentQuizzesView: React.FC = () => {
  const {
    currentUser,
    quizzes,
    quizAttempts,
    materials,
    navigateStudent,
    isMaterialCompletedByStudent,
  } = useLms();

  const studentQuizzes = quizzes.filter(
    (q) =>
      (!currentUser?.classId || q.classIds.includes(currentUser.classId)) &&
      q.status === 'published'
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h1 className="text-xl font-bold text-slate-900">Evaluasi Kuis Pembelajaran</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Ikuti evaluasi formatif untuk menguji pemahaman konsep materi. Timer kuis akan berjalan otomatis saat Anda memulai.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studentQuizzes.map((qz) => {
          const attempts = quizAttempts.filter(
            (a) => a.quizId === qz.id && a.studentId === currentUser?.id
          );
          const latest = attempts[attempts.length - 1];
          const isDone = latest?.status === 'completed';
          const inProgress = latest?.status === 'in_progress';
          const relMat = materials.find((m) => m.id === qz.materialId);
          const isPrereqMet =
            !qz.requireMaterialCompletion ||
            isMaterialCompletedByStudent(currentUser?.id || '', qz.materialId);

          return (
            <div
              key={qz.id}
              onClick={() => navigateStudent('quiz_runner', { quizId: qz.id })}
              className={`cursor-pointer bg-white border rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-500 transition-colors ${
                !isPrereqMet ? 'opacity-75 bg-slate-50/50' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{qz.subject}</span>
                  <span className="font-mono">
                    {qz.questions.length} Soal · {qz.durationMinutes} Menit
                  </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{qz.title}</h2>
                <p className="text-xs text-slate-600 line-clamp-2">{qz.description}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-500">
                    Percobaan: {attempts.length} / {qz.maxAttempts} kali
                  </span>
                  {isDone && (
                    <span className="font-mono font-bold text-emerald-700">
                      Skor Terakhir: {latest.score} / 100
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-1">
                  {!isPrereqMet ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-700 text-[11px]">
                      <Lock className="w-3.5 h-3.5" /> Prasyarat: Selesaikan &quot;{relMat?.title.slice(0, 20)}...&quot;
                    </span>
                  ) : inProgress ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-blue-700 text-[11px]">
                      <Clock className="w-3.5 h-3.5 animate-pulse" /> Sedang Berlangsung (Lanjutkan)
                    </span>
                  ) : isDone ? (
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Selesai Dievaluasi
                    </span>
                  ) : (
                    <span className="text-slate-500 text-[11px]">Belum Memulai</span>
                  )}

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                    {inProgress ? 'Lanjutkan Kuis' : isDone ? 'Lihat Hasil' : 'Mulai Kuis'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
