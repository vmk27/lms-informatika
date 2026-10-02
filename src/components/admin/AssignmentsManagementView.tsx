import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Copy,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Award,
  History,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { Assignment, AssignmentSubmission, RubricItem } from '../../types/lms';
import { ModalShell } from '../common/ModalShell';

export const AssignmentsManagementView: React.FC = () => {
  const {
    assignments,
    submissions,
    materials,
    classes,
    users,
    currentUser,
    saveAssignment,
    duplicateAssignment,
    deleteAssignment,
    gradeAssignmentSubmission,
    requestConfirm,
    closeConfirm,
    addToast,
  } = useLms();

  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string>(
    assignments[0]?.id || ''
  );
  const [subStatusFilter, setSubStatusFilter] = useState<string>('all');

  // Modal Tambah/Edit Tugas
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewAssignment, setIsNewAssignment] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState<Assignment>(() =>
    createEmptyAssignment(currentUser?.id, currentUser?.name, materials[0]?.id)
  );

  // Modal Penilaian Tugas
  const [gradingTarget, setGradingTarget] = useState<{
    studentId: string;
    assignment: Assignment;
    submission?: AssignmentSubmission;
  } | null>(null);
  const [gradeScore, setGradeScore] = useState<number>(85);
  const [gradeFeedback, setGradeFeedback] = useState<string>('');
  const [revisionReason, setRevisionReason] = useState<string>('');
  const [rubricScores, setRubricScores] = useState<Record<string, number>>({});

  const activeAssignment =
    assignments.find((a) => a.id === selectedAssignmentId) || assignments[0];

  const openCreateAssignment = () => {
    setForm(createEmptyAssignment(currentUser?.id, currentUser?.name, materials[0]?.id));
    setIsNewAssignment(true);
    setIsDirty(false);
    setIsEditModalOpen(true);
  };

  const openEditAssignment = (asg: Assignment) => {
    setForm(JSON.parse(JSON.stringify(asg)));
    setIsNewAssignment(false);
    setIsDirty(false);
    setIsEditModalOpen(true);
  };

  const handleSaveAssignment = () => {
    if (!form.title.trim() || !form.subject.trim() || form.classIds.length === 0) {
      addToast({
        type: 'error',
        title: 'Validasi Gagal',
        description: 'Judul tugas, mata pelajaran, dan kelas tujuan wajib diisi.',
      });
      return;
    }
    saveAssignment(form, isNewAssignment);
    setSelectedAssignmentId(form.id);
    setIsDirty(false);
    setIsEditModalOpen(false);
  };

  const openGradingModal = (studentId: string, asg: Assignment) => {
    const sub = submissions.find(
      (s) => s.assignmentId === asg.id && s.studentId === studentId
    );
    setGradingTarget({ studentId, assignment: asg, submission: sub });
    setGradeScore(sub?.score ?? 85);
    setGradeFeedback(sub?.teacherFeedback ?? '');
    setRevisionReason('');
    setRubricScores(sub?.rubricScores || {});
  };

  const handleSaveGrade = () => {
    if (!gradingTarget) return;
    if (gradeScore < 0 || gradeScore > gradingTarget.assignment.maxScore) {
      addToast({
        type: 'error',
        title: 'Nilai Tidak Valid',
        description: `Nilai harus berada di antara 0 dan ${gradingTarget.assignment.maxScore}.`,
      });
      return;
    }

    if (gradingTarget.submission) {
      gradeAssignmentSubmission(
        gradingTarget.submission.id,
        gradeScore,
        gradeFeedback,
        revisionReason,
        rubricScores
      );
    }
    setGradingTarget(null);
  };

  const targetStudents = users.filter(
    (u) =>
      u.role === 'student' &&
      (!u.classId || activeAssignment?.classIds.includes(u.classId))
  );

  const studentSubmissionRows = targetStudents
    .map((std) => {
      const sub = submissions.find(
        (s) => s.assignmentId === activeAssignment?.id && s.studentId === std.id
      );
      const status = sub?.status || 'not_submitted';
      return { student: std, submission: sub, status };
    })
    .filter((r) => subStatusFilter === 'all' || r.status === subStatusFilter);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Manajemen Tugas & Rubrik Penilaian
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola penugasan siswa, prasyarat penyelesaian materi, tenggat waktu, rubrik, dan riwayat revisi nilai.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateAssignment}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tugas Baru</span>
        </button>
      </div>

      {/* Daftar Tugas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {assignments.map((asg) => {
          const isSelected = asg.id === activeAssignment?.id;
          const relMat = materials.find((m) => m.id === asg.materialId);
          return (
            <div
              key={asg.id}
              onClick={() => setSelectedAssignmentId(asg.id)}
              className={`cursor-pointer bg-white border rounded-xl p-5 transition-colors space-y-3 ${
                isSelected
                  ? 'border-blue-600 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">{asg.subject}</span> · Status:{' '}
                    <span className="uppercase font-semibold text-slate-700">{asg.status}</span> ·
                    Tenggat: <span className="font-mono">{asg.dueDate.replace('T', ' ')}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">{asg.title}</h2>
                </div>
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => openEditAssignment(asg)}
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    title="Edit Tugas"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateAssignment(asg.id)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                    title="Duplikasi Tugas"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: `Hapus Tugas "${asg.title}"?`,
                        description: 'Data tugas yang dihapus tidak dapat dikembalikan.',
                        confirmLabel: 'Hapus Tugas',
                        variant: 'danger',
                        onConfirm: () => {
                          deleteAssignment(asg.id);
                          closeConfirm();
                        },
                      })
                    }
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Hapus Tugas"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 line-clamp-2">{asg.instructions}</p>

              <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex flex-wrap gap-3">
                <span>
                  Prasyarat Materi:{' '}
                  <strong className="text-slate-800">
                    {asg.requireMaterialCompletion
                      ? `Wajib Selesai (${relMat?.title.slice(0, 28) || 'Materi'}...)`
                      : 'Tidak Wajib'}
                  </strong>
                </span>
                <span>·</span>
                <span>
                  Tipe Jawaban: <strong className="uppercase">{asg.answerType}</strong>
                </span>
                <span>·</span>
                <span>
                  Maks. Percobaan: <strong className="font-mono">{asg.maxAttempts}x</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabel Pengumpulan & Penilaian Siswa untuk Tugas Terpilih */}
      {activeAssignment && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Pengumpulan & Penilaian — {activeAssignment.title}
              </h3>
              <p className="text-xs text-slate-500">
                Klik tombol &quot;Nilai / Detail&quot; untuk memeriksa jawaban siswa, memberi skor rubrik, dan melihat riwayat revisi nilai.
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              {(
                [
                  { id: 'all', label: 'Semua' },
                  { id: 'not_submitted', label: 'Belum Kumpul' },
                  { id: 'submitted', label: 'Sudah Kumpul' },
                  { id: 'late', label: 'Terlambat' },
                  { id: 'graded', label: 'Telah Dinilai' },
                ] as const
              ).map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSubStatusFilter(st.id)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                    subStatusFilter === st.id
                      ? 'bg-white text-blue-700 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[820px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="py-3 px-4 min-w-[200px]">Nama Siswa & NIS</th>
                  <th className="py-3 px-4 w-44">Status Pengumpulan</th>
                  <th className="py-3 px-4 w-44">Waktu Pengumpulan</th>
                  <th className="py-3 px-4 w-28 text-center">Percobaan</th>
                  <th className="py-3 px-4 min-w-[180px]">Nilai & Feedback</th>
                  <th className="py-3 px-4 w-36 text-right">Aksi Penilaian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {studentSubmissionRows.map(({ student, submission, status }) => (
                  <tr key={student.id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                        {student.name}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 tabular-nums mt-0.5">
                        NIS: {student.nis || '-'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      {status === 'graded' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Telah Dinilai
                        </span>
                      )}
                      {status === 'submitted' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600" /> Sudah Kumpul
                        </span>
                      )}
                      {status === 'late' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Terlambat
                        </span>
                      )}
                      {status === 'not_submitted' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Belum Kumpul
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 tabular-nums align-middle">
                      {submission?.submittedAt
                        ? new Date(submission.submittedAt).toLocaleString('id-ID')
                        : '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-center tabular-nums align-middle">
                      <span className="font-bold text-slate-800">
                        {submission?.attemptCount ?? 0}
                      </span>
                      <span className="text-slate-400 text-[11px]"> / {activeAssignment.maxAttempts}</span>
                    </td>
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-mono font-bold text-slate-900 text-xs tabular-nums">
                        {submission?.score !== null && submission?.score !== undefined ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {submission.score} / {activeAssignment.maxScore}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </div>
                      {submission?.teacherFeedback && (
                        <div className="text-[11px] text-slate-500 truncate max-w-[200px] mt-1 italic">
                          &ldquo;{submission.teacherFeedback}&rdquo;
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right align-middle">
                      {submission ? (
                        <button
                          type="button"
                          onClick={() => openGradingModal(student.id, activeAssignment)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition-colors shadow-2xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>Nilai / Detail</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-medium">Menunggu Jawaban</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Buat / Edit Tugas */}
      <ModalShell
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        isDirty={isDirty}
        title={isNewAssignment ? 'Buat Tugas Pembelajaran Baru' : `Edit Tugas — ${form.title}`}
        description="Atur instruksi, prasyarat materi, tenggat pengumpulan, aturan keterlambatan, dan rubrik penilaian."
        maxWidthClass="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAssignment}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Simpan Tugas
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Judul Tugas <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Mata Pelajaran <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => {
                setForm({ ...form, subject: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Materi Terkait
            </label>
            <select
              value={form.materialId}
              onChange={(e) => {
                setForm({ ...form, materialId: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.subject} — {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tenggat Pengumpulan <span className="text-red-600">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => {
                setForm({ ...form, dueDate: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Jenis Jawaban Siswa
            </label>
            <select
              value={form.answerType}
              onChange={(e) => {
                setForm({
                  ...form,
                  answerType: e.target.value as Assignment['answerType'],
                });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="combination">Kombinasi Teks & Unggah Berkas</option>
              <option value="text">Hanya Jawaban Teks</option>
              <option value="file">Hanya Unggah Berkas</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Instruksi Pengerjaan Tugas <span className="text-red-600">*</span>
            </label>
            <textarea
              rows={3}
              value={form.instructions}
              onChange={(e) => {
                setForm({ ...form, instructions: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.requireMaterialCompletion}
                onChange={(e) => {
                  setForm({ ...form, requireMaterialCompletion: e.target.checked });
                  setIsDirty(true);
                }}
                className="rounded border-slate-300 text-blue-600"
              />
              <span className="font-semibold">
                Wajibkan siswa menyelesaikan materi terkait sebelum membuka tugas
              </span>
            </label>
          </div>

          <div>
            <label className="inline-flex items-center gap-2 text-xs text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={form.allowLateSubmission}
                onChange={(e) => {
                  setForm({ ...form, allowLateSubmission: e.target.checked });
                  setIsDirty(true);
                }}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>
                Izinkan pengumpulan terlambat (Penalti {form.latePenaltyPercent}%)
              </span>
            </label>
          </div>
        </div>
      </ModalShell>

      {/* Modal Penilaian Tugas & Riwayat Revisi Nilai */}
      <ModalShell
        isOpen={Boolean(gradingTarget)}
        onClose={() => setGradingTarget(null)}
        title="Penilaian Jawaban Tugas Siswa"
        description={`Tugas: ${gradingTarget?.assignment.title || ''}`}
        maxWidthClass="max-w-3xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setGradingTarget(null)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveGrade}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Simpan Nilai & Umpan Balik
            </button>
          </>
        }
      >
        {gradingTarget?.submission && (
          <div className="space-y-4">
            {/* Jawaban Siswa */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-slate-800">Jawaban Teks Siswa:</div>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans bg-white p-3 rounded-lg border border-slate-200">
                {gradingTarget.submission.textAnswer || '(Tidak ada jawaban teks)'}
              </pre>
              {gradingTarget.submission.fileAttachments.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-semibold text-slate-800 mb-1">
                    Berkas Lampiran Siswa:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gradingTarget.submission.fileAttachments.map((f, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-blue-700"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{f.name}</span>
                        <span className="text-slate-400">({f.size})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rubrik Penilaian */}
            {gradingTarget.assignment.rubric.length > 0 && (
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="text-xs font-semibold text-slate-900">
                  Penilaian Berdasarkan Rubrik Kriteria:
                </div>
                {gradingTarget.assignment.rubric.map((rub) => (
                  <div
                    key={rub.id}
                    className="flex items-center justify-between gap-4 text-xs border-b border-slate-100 pb-2 last:border-0"
                  >
                    <div>
                      <div className="font-medium text-slate-800">{rub.criteria}</div>
                      <div className="text-slate-500">{rub.description}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono">
                      <input
                        type="number"
                        min={0}
                        max={rub.maxScore}
                        value={rubricScores[rub.id] ?? rub.maxScore}
                        onChange={(e) => {
                          const val = Math.min(
                            rub.maxScore,
                            Math.max(0, Number(e.target.value))
                          );
                          const next = { ...rubricScores, [rub.id]: val };
                          setRubricScores(next);
                          const total = Object.values(next).reduce((a, b) => a + b, 0);
                          setGradeScore(total);
                        }}
                        className="w-16 px-2 py-1 border border-slate-300 rounded text-right"
                      />
                      <span className="text-slate-500">/ {rub.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Nilai Total & Umpan Balik */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nilai Total (Maks. {gradingTarget.assignment.maxScore}){' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min={0}
                  max={gradingTarget.assignment.maxScore}
                  value={gradeScore}
                  onChange={(e) => setGradeScore(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alasan Revisi Nilai (Wajib diisi jika mengubah nilai yang sudah ada)
                </label>
                <input
                  type="text"
                  value={revisionReason}
                  onChange={(e) => setRevisionReason(e.target.value)}
                  placeholder="Contoh: Penyesuaian poin langkah penyelesaian soal 2"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Komentar / Umpan Balik Guru untuk Siswa
              </label>
              <textarea
                rows={3}
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Tuliskan catatan apresiasi atau perbaikan untuk siswa..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
              />
            </div>

            {/* Riwayat Perubahan Nilai */}
            {gradingTarget.submission.revisionHistory.length > 0 && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>Riwayat Perubahan Nilai:</span>
                </div>
                {gradingTarget.submission.revisionHistory.map((rev) => (
                  <div key={rev.id} className="text-[11px] text-slate-600">
                    <span className="font-mono">
                      {new Date(rev.changedAt).toLocaleString('id-ID')}
                    </span>{' '}
                    — Nilai diubah dari <strong>{rev.previousScore}</strong> ke{' '}
                    <strong>{rev.newScore}</strong> oleh {rev.changedByName} ({rev.reason})
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </ModalShell>
    </div>
  );
};

function createEmptyAssignment(
  authorId = 'usr-teacher-1',
  authorName = 'Guru',
  defaultMaterialId = 'mat-fis-termo'
): Assignment {
  const defaultRubric: RubricItem[] = [
    {
      id: `rub-${Date.now()}-1`,
      criteria: 'Ketepatan Konsep & Rumus',
      maxScore: 50,
      description: 'Kesesuaian penggunaan konsep dengan materi yang dipelajari.',
    },
    {
      id: `rub-${Date.now()}-2`,
      criteria: 'Sistematika Penyelesaian & Kesimpulan',
      maxScore: 50,
      description: 'Kerapian langkah pengerjaan dan ketepatan hasil akhir.',
    },
  ];
  return {
    id: `asg-${Date.now()}`,
    title: '',
    subject: 'Fisika',
    materialId: defaultMaterialId,
    requireMaterialCompletion: true,
    classIds: ['cls-xi-mipa-1'],
    instructions: '',
    attachments: [],
    dueDate: '2026-10-15T23:59',
    publishStartAt: '2026-10-01T07:00',
    status: 'published',
    answerType: 'combination',
    maxScore: 100,
    allowLateSubmission: true,
    latePenaltyPercent: 10,
    maxAttempts: 2,
    rubric: defaultRubric,
    createdById: authorId,
    createdByName: authorName,
  };
}
