import React from 'react';
import { FileText, Clock, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { useLms } from '../../context/LmsContext';

export const StudentAssignmentsView: React.FC = () => {
  const {
    currentUser,
    assignments,
    submissions,
    materials,
    navigateStudent,
    isMaterialCompletedByStudent,
  } = useLms();

  const studentAssignments = assignments.filter(
    (a) =>
      (!currentUser?.classId || a.classIds.includes(currentUser.classId)) &&
      a.status === 'published'
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h1 className="text-xl font-bold text-slate-900">Daftar Tugas Mandiri & Terstruktur</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Periksa instruksi pengerjaan, batas waktu, rubrik penilaian, dan status tugas Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {studentAssignments.map((asg) => {
          const sub = submissions.find(
            (s) => s.assignmentId === asg.id && s.studentId === currentUser?.id
          );
          const relMat = materials.find((m) => m.id === asg.materialId);
          const isPrereqMet =
            !asg.requireMaterialCompletion ||
            isMaterialCompletedByStudent(currentUser?.id || '', asg.materialId);

          return (
            <div
              key={asg.id}
              onClick={() =>
                navigateStudent('assignment_detail', { assignmentId: asg.id })
              }
              className={`cursor-pointer bg-white border rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-blue-500 transition-colors ${
                !isPrereqMet ? 'opacity-75 bg-slate-50/50' : ''
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-semibold text-blue-700">{asg.subject}</span>
                  <span className="font-mono">Maks. {asg.maxScore} Poin</span>
                </div>
                <h2 className="text-base font-bold text-slate-900">{asg.title}</h2>
                <p className="text-xs text-slate-600 line-clamp-2">{asg.instructions}</p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="inline-flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Tenggat: {asg.dueDate.replace('T', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  {!isPrereqMet ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-700 text-[11px]">
                      <Lock className="w-3.5 h-3.5" /> Prasyarat: Selesaikan &quot;{relMat?.title.slice(0, 20)}...&quot;
                    </span>
                  ) : sub?.status === 'graded' ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700 font-mono">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Nilai: {sub.score} / {asg.maxScore}
                    </span>
                  ) : sub ? (
                    <span className="inline-flex items-center gap-1 font-medium text-blue-700 text-[11px]">
                      <Clock className="w-3.5 h-3.5" /> Sudah Terkumpul (Menunggu Penilaian)
                    </span>
                  ) : (
                    <span className="text-red-600 font-semibold text-[11px]">
                      Belum Mengumpulkan
                    </span>
                  )}

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700">
                    Detail Tugas <ArrowRight className="w-3.5 h-3.5" />
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
