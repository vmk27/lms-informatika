import React from 'react';
import { Award, BookOpen, FileText, HelpCircle, CheckCircle2 } from 'lucide-react';
import { useLms } from '../../context/LmsContext';

export const StudentGradesView: React.FC = () => {
  const {
    currentUser,
    materials,
    readingSessions,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    gradeWeights,
  } = useLms();

  const studentMaterials = materials.filter(
    (m) => !currentUser?.classId || m.classIds.includes(currentUser.classId)
  );
  const completedMats = studentMaterials.filter((m) =>
    readingSessions.some(
      (s) =>
        s.student_id === currentUser?.id &&
        s.material_id === m.id &&
        s.completion_status === 'completed'
    )
  ).length;

  const matScore =
    studentMaterials.length > 0
      ? Math.round((completedMats / studentMaterials.length) * 100)
      : 100;

  const mySubs = submissions.filter(
    (s) => s.studentId === currentUser?.id && s.score !== null
  );
  const asgScore =
    mySubs.length > 0
      ? Math.round(mySubs.reduce((a, b) => a + (b.score || 0), 0) / mySubs.length)
      : 0;

  const myAttempts = quizAttempts.filter(
    (a) => a.studentId === currentUser?.id && a.score !== null
  );
  const quizScore =
    myAttempts.length > 0
      ? Math.round(myAttempts.reduce((a, b) => a + (b.score || 0), 0) / myAttempts.length)
      : 0;

  const finalScore = Math.round(
    (matScore * gradeWeights.materialCompletionWeight +
      asgScore * gradeWeights.assignmentWeight +
      quizScore * gradeWeights.quizWeight) /
      100
  );

  const isPassed = finalScore >= gradeWeights.passingGrade;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Buku Nilai & Hasil Belajar</h1>
            <p className="text-xs text-slate-500 mt-1">
              Transparansi perhitungan nilai akhir berdasarkan capaian materi, tugas, dan kuis.
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center shrink-0">
            <div className="text-xs text-slate-500">Nilai Akhir Kumulatif</div>
            <div
              className={`text-3xl font-bold font-mono mt-1 ${
                isPassed ? 'text-blue-700' : 'text-red-600'
              }`}
            >
              {finalScore} / 100
            </div>
            <div className="text-[11px] font-semibold text-slate-600 mt-0.5">
              KKM {gradeWeights.passingGrade} ({isPassed ? 'Tuntas' : 'Perlu Remedial'})
            </div>
          </div>
        </div>

        {/* Rumus Transparan */}
        <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-2 text-slate-800">
          <div className="font-bold text-blue-950">Rumus Penilaian Transparan:</div>
          <div className="font-mono text-slate-700">
            Nilai Akhir = (Materi × {gradeWeights.materialCompletionWeight}%) + (Tugas ×{' '}
            {gradeWeights.assignmentWeight}%) + (Kuis × {gradeWeights.quizWeight}%)
          </div>
        </div>
      </div>

      {/* Rincian Komponen Nilai */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">1. Ketercapaian Materi</span>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{matScore}</div>
          <p className="text-xs text-slate-500">
            {completedMats} dari {studentMaterials.length} materi telah dipelajari tuntas (Bobot{' '}
            {gradeWeights.materialCompletionWeight}%).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">2. Rata-rata Tugas</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{asgScore}</div>
          <p className="text-xs text-slate-500">
            {mySubs.length} tugas telah dinilai oleh guru pengampu (Bobot {gradeWeights.assignmentWeight}%).
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">3. Rata-rata Kuis</span>
            <HelpCircle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">{quizScore}</div>
          <p className="text-xs text-slate-500">
            {myAttempts.length} evaluasi kuis telah diselesaikan (Bobot {gradeWeights.quizWeight}%).
          </p>
        </div>
      </div>

      {/* Rincian Tugas & Umpan Balik Guru */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          Rincian Tugas & Umpan Balik Guru
        </h2>
        <div className="divide-y divide-slate-100">
          {assignments.map((asg) => {
            const sub = submissions.find(
              (s) => s.assignmentId === asg.id && s.studentId === currentUser?.id
            );
            return (
              <div key={asg.id} className="py-4 space-y-2 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{asg.title}</div>
                    <div className="text-slate-500">{asg.subject}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-slate-900 text-sm">
                    {sub?.score !== null && sub?.score !== undefined ? `${sub.score} / ${asg.maxScore}` : '-'}
                  </div>
                </div>
                {sub?.teacherFeedback && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                    <strong>Catatan Guru ({sub.gradedByName}):</strong> &ldquo;{sub.teacherFeedback}&rdquo;
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
