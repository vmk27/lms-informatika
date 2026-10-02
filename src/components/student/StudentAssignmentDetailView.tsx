import React, { useState } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  FileText,
  Upload,
  Award,
  Lock,
  Paperclip,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';

export const StudentAssignmentDetailView: React.FC = () => {
  const {
    currentUser,
    assignments,
    selectedAssignmentId,
    submissions,
    materials,
    submitStudentAssignment,
    navigateStudent,
    isMaterialCompletedByStudent,
    addToast,
  } = useLms();

  const assignment =
    assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];

  const submission = submissions.find(
    (s) => s.assignmentId === assignment?.id && s.studentId === currentUser?.id
  );

  const relMat = materials.find((m) => m.id === assignment?.materialId);
  const isPrereqMet =
    !assignment?.requireMaterialCompletion ||
    isMaterialCompletedByStudent(currentUser?.id || '', assignment.materialId);

  const [textAnswer, setTextAnswer] = useState<string>(submission?.textAnswer || '');
  const [fileList, setFileList] = useState<{ name: string; size: string; uploadedAt: string }[]>(
    submission?.fileAttachments || []
  );

  const handleSimulateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileList((prev) => [
      ...prev,
      {
        name: file.name,
        size: `${Math.round(file.size / 1024)} KB`,
        uploadedAt: new Date().toISOString(),
      },
    ]);
  };

  const handleSubmit = () => {
    if (!currentUser || !assignment) return;
    if (!textAnswer.trim() && fileList.length === 0) {
      addToast({
        type: 'error',
        title: 'Jawaban Kosong',
        description: 'Tuliskan jawaban teks atau lampirkan berkas sebelum mengumpulkan.',
      });
      return;
    }
    submitStudentAssignment(assignment.id, currentUser.id, textAnswer, fileList);
  };

  const canSubmit =
    isPrereqMet &&
    (!submission || submission.attemptCount < assignment.maxAttempts);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      <button
        type="button"
        onClick={() => navigateStudent('assignments')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 px-3.5 py-2 rounded-lg hover:bg-slate-50"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Daftar Tugas</span>
      </button>

      {/* Detail Tugas Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="font-semibold text-blue-700">{assignment.subject}</span>
          <span>·</span>
          <span>Maks. {assignment.maxScore} Poin</span>
          <span>·</span>
          <span className="font-mono">Tenggat: {assignment.dueDate.replace('T', ' ')}</span>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">{assignment.title}</h1>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
          <div className="font-bold text-slate-900">Instruksi Pengerjaan:</div>
          <p className="whitespace-pre-line leading-relaxed">{assignment.instructions}</p>
        </div>

        {/* Prasyarat Warning jika belum selesai */}
        {!isPrereqMet && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold">Prasyarat Materi Belum Terpenuhi</div>
              <p className="mt-0.5">
                Anda harus menyelesaikan sesi membaca materi &quot;{relMat?.title}&quot; terlebih dahulu sebelum dapat mengirimkan jawaban tugas ini.
              </p>
              <button
                type="button"
                onClick={() =>
                  navigateStudent('material_reader', { materialId: assignment.materialId })
                }
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 underline"
              >
                Buka Materi Prasyarat Sekarang
              </button>
            </div>
          </div>
        )}

        {/* Rubrik Penilaian */}
        {assignment.rubric.length > 0 && (
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900">Rubrik Kriteria Penilaian:</div>
            <div className="space-y-2">
              {assignment.rubric.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 text-xs border-b border-slate-100 pb-2 last:border-0"
                >
                  <div>
                    <div className="font-semibold text-slate-800">{r.criteria}</div>
                    <div className="text-slate-500">{r.description}</div>
                  </div>
                  <div className="font-mono font-bold text-slate-900 shrink-0">
                    {r.maxScore} Poin
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Nilai & Umpan Balik Guru jika sudah dinilai */}
      {submission?.status === 'graded' && (
        <div className="bg-emerald-50/80 border border-emerald-300 rounded-2xl p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-sm">
              <Award className="w-5 h-5 text-emerald-700" />
              <span>Hasil Penilaian Guru</span>
            </div>
            <div className="text-2xl font-mono font-bold text-emerald-900">
              {submission.score} / {assignment.maxScore}
            </div>
          </div>
          {submission.teacherFeedback && (
            <div className="text-xs text-emerald-900 bg-white/70 p-3 rounded-xl border border-emerald-200">
              <strong>Umpan Balik Guru ({submission.gradedByName}):</strong> &ldquo;
              {submission.teacherFeedback}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Form Pengumpulan Jawaban */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-5">
        <h2 className="text-base font-bold text-slate-900">Form Pengumpulan Jawaban</h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Jawaban Teks / Penjelasan:
          </label>
          <textarea
            rows={6}
            disabled={!canSubmit}
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="Tuliskan langkah-langkah penyelesaian tugas Anda di sini..."
            className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
          />
        </div>

        {/* Unggah Berkas */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Lampiran Berkas (PDF / Dokumen / Gambar):
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <label
              className={`px-4 py-2 text-xs font-semibold rounded-xl inline-flex items-center gap-2 cursor-pointer ${
                canSubmit
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                  : 'bg-slate-50 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Unggah Berkas Jawaban</span>
              <input
                type="file"
                disabled={!canSubmit}
                onChange={handleSimulateFileUpload}
                className="hidden"
              />
            </label>
            <span className="text-[11px] text-slate-400">Maks. 10 MB per berkas</span>
          </div>

          {fileList.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {fileList.map((f, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-blue-700"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{f.name}</span>
                  <span className="text-slate-400">({f.size})</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-500 font-mono">
            Percobaan: {submission?.attemptCount ?? 0} / {assignment.maxAttempts} kali
          </div>
          <button
            type="button"
            disabled={!canSubmit}
            onClick={handleSubmit}
            className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submission ? 'Kirim Ulang Jawaban Tugas' : 'Kirim Jawaban Tugas'}
          </button>
        </div>
      </div>
    </div>
  );
};
