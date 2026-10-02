import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Copy,
  Trash2,
  HelpCircle,
  Clock,
  CheckCircle2,
  Shuffle,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { Quiz, QuizQuestion, QuizQuestionType } from '../../types/lms';
import { ModalShell } from '../common/ModalShell';

export const QuizzesManagementView: React.FC = () => {
  const {
    quizzes,
    quizAttempts,
    materials,
    classes,
    users,
    currentUser,
    saveQuiz,
    duplicateQuiz,
    deleteQuiz,
    requestConfirm,
    closeConfirm,
    addToast,
  } = useLms();

  const [selectedQuizId, setSelectedQuizId] = useState<string>(quizzes[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewQuiz, setIsNewQuiz] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState<Quiz>(() =>
    createEmptyQuiz(currentUser?.id, currentUser?.name, materials[0]?.id)
  );

  const activeQuiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];

  const openCreateQuiz = () => {
    setForm(createEmptyQuiz(currentUser?.id, currentUser?.name, materials[0]?.id));
    setIsNewQuiz(true);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const openEditQuiz = (qz: Quiz) => {
    setForm(JSON.parse(JSON.stringify(qz)));
    setIsNewQuiz(false);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleSaveQuiz = () => {
    if (!form.title.trim() || form.questions.length === 0) {
      addToast({
        type: 'error',
        title: 'Validasi Kuis Gagal',
        description: 'Judul kuis dan minimal 1 butir soal wajib diisi.',
      });
      return;
    }
    saveQuiz(form, isNewQuiz);
    setSelectedQuizId(form.id);
    setIsDirty(false);
    setIsModalOpen(false);
  };

  const addQuestion = (type: QuizQuestionType) => {
    const newQ: QuizQuestion = {
      id: `qq-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      type,
      prompt: '',
      options:
        type === 'multiple_choice'
          ? ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']
          : type === 'true_false'
          ? ['Benar', 'Salah']
          : undefined,
      correctAnswer: type === 'short_answer' ? 'Kata Kunci Jawaban' : '0',
      points: 25,
      explanation: '',
    };
    setForm((prev) => ({ ...prev, questions: [...prev.questions, newQ] }));
    setIsDirty(true);
  };

  const participantStudents = users.filter(
    (u) =>
      u.role === 'student' &&
      (!u.classId || activeQuiz?.classIds.includes(u.classId))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Manajemen Kuis & Editor Bank Soal
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Mendukung soal Pilihan Ganda, Benar/Salah, dan Jawaban Singkat dengan pengacakan soal, durasi, serta batas percobaan.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateQuiz}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Kuis Baru</span>
        </button>
      </div>

      {/* Daftar Paket Kuis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {quizzes.map((qz) => {
          const isSelected = qz.id === activeQuiz?.id;
          const totalPoints = qz.questions.reduce((acc, q) => acc + q.points, 0);
          return (
            <div
              key={qz.id}
              onClick={() => setSelectedQuizId(qz.id)}
              className={`cursor-pointer bg-white border rounded-xl p-5 space-y-3 transition-colors ${
                isSelected
                  ? 'border-blue-600 ring-1 ring-blue-600'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-blue-700">{qz.subject}</span> · Status:{' '}
                    <span className="uppercase font-semibold">{qz.status}</span> · Durasi:{' '}
                    <span className="font-mono font-semibold">{qz.durationMinutes} menit</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900 mt-1">{qz.title}</h2>
                </div>
                <div
                  className="flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => openEditQuiz(qz)}
                    className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                    title="Edit Kuis & Soal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateQuiz(qz.id)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                    title="Duplikasi Kuis"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      requestConfirm({
                        title: `Hapus Kuis "${qz.title}"?`,
                        description: 'Seluruh soal dan riwayat percobaan kuis ini akan dihapus.',
                        confirmLabel: 'Hapus Kuis',
                        variant: 'danger',
                        onConfirm: () => {
                          deleteQuiz(qz.id);
                          closeConfirm();
                        },
                      })
                    }
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Hapus Kuis"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600">{qz.description}</p>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                  <span>
                    <strong className="font-mono text-slate-800">{qz.questions.length}</strong> Soal
                    (Total {totalPoints} Poin)
                  </span>
                </span>
                <span>·</span>
                <span>
                  Maks. Percobaan: <strong className="font-mono">{qz.maxAttempts}x</strong>
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Shuffle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Acak Soal: {qz.shuffleQuestions ? 'Ya' : 'Tidak'}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Daftar Peserta & Riwayat Percobaan Kuis Terpilih */}
      {activeQuiz && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Peserta & Riwayat Percobaan — {activeQuiz.title}
              </h3>
              <p className="text-xs text-slate-500">
                Menampilkan status pengerjaan, sisa waktu simpan berkala, dan skor akhir siswa.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[780px]">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="py-3 px-4 min-w-[200px]">Nama Siswa & NIS</th>
                  <th className="py-3 px-4 w-36">Kelas</th>
                  <th className="py-3 px-4 w-52">Status Pengerjaan</th>
                  <th className="py-3 px-4 w-28 text-center">Percobaan</th>
                  <th className="py-3 px-4 w-44">Terakhir Disimpan</th>
                  <th className="py-3 px-4 w-32 text-right">Skor Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participantStudents.map((std) => {
                  const cls = classes.find((c) => c.id === std.classId);
                  const attempts = quizAttempts.filter(
                    (a) => a.quizId === activeQuiz.id && a.studentId === std.id
                  );
                  const latest = attempts[attempts.length - 1];
                  return (
                    <tr key={std.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {std.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 tabular-nums mt-0.5">
                          NIS: {std.nis || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 align-middle">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px] border border-slate-200">
                          {cls?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        {latest?.status === 'completed' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Telah Selesai
                          </span>
                        )}
                        {latest?.status === 'in_progress' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3.5 h-3.5 text-blue-600" /> Mengerjakan (Sisa{' '}
                            {Math.ceil(latest.remainingSeconds / 60)}m)
                          </span>
                        )}
                        {!latest && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Belum Mulai
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-center tabular-nums align-middle">
                        <span className="font-bold text-slate-800">{attempts.length}</span>
                        <span className="text-slate-400 text-[11px]"> / {activeQuiz.maxAttempts}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 tabular-nums align-middle">
                        {latest?.lastSavedAt
                          ? new Date(latest.lastSavedAt).toLocaleString('id-ID')
                          : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-xs tabular-nums align-middle">
                        {latest?.score !== null && latest?.score !== undefined ? (
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block font-black">
                            {latest.score} / 100
                          </span>
                        ) : (
                          <span className="text-slate-400 font-normal">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Pembuat / Editor Kuis */}
      <ModalShell
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isDirty={isDirty}
        title={isNewQuiz ? 'Buat Paket Kuis Baru' : `Edit Kuis — ${form.title}`}
        description="Atur parameter kuis, prasyarat materi, pengacakan, serta daftar butir soal dan kunci jawaban."
        maxWidthClass="max-w-4xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveQuiz}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Simpan Paket Kuis
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Judul Kuis <span className="text-red-600">*</span>
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
                Mata Pelajaran
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
                Durasi Pengerjaan (Menit)
              </label>
              <input
                type="number"
                min={5}
                max={180}
                value={form.durationMinutes}
                onChange={(e) => {
                  setForm({ ...form, durationMinutes: Math.max(5, Number(e.target.value)) });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Batas Jumlah Percobaan
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={form.maxAttempts}
                onChange={(e) => {
                  setForm({ ...form, maxAttempts: Math.max(1, Number(e.target.value)) });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Materi Prasyarat
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
                    {m.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Opsi Pengacakan & Penampilan Kunci */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label className="inline-flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={form.shuffleQuestions}
                onChange={(e) =>
                  setForm({ ...form, shuffleQuestions: e.target.checked })
                }
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Acak urutan soal untuk setiap siswa</span>
            </label>
            <label className="inline-flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={form.showAnswerKey}
                onChange={(e) => setForm({ ...form, showAnswerKey: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Tampilkan hasil & pembahasan setelah siswa selesai</span>
            </label>
          </div>

          {/* Daftar Soal */}
          <div className="border-t border-slate-200 pt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Daftar Butir Soal ({form.questions.length} Soal)
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => addQuestion('multiple_choice')}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100"
                >
                  + Pilihan Ganda
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('true_false')}
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100"
                >
                  + Benar / Salah
                </button>
                <button
                  type="button"
                  onClick={() => addQuestion('short_answer')}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  + Jawaban Singkat
                </button>
              </div>
            </div>

            {form.questions.map((q, qIdx) => (
              <div
                key={q.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">
                    Soal #{qIdx + 1} · Tipe:{' '}
                    {q.type === 'multiple_choice'
                      ? 'Pilihan Ganda Satu Jawaban'
                      : q.type === 'true_false'
                      ? 'Benar / Salah'
                      : 'Jawaban Singkat'}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span>Bobot Poin:</span>
                      <input
                        type="number"
                        min={1}
                        value={q.points}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            questions: prev.questions.map((item, i) =>
                              i === qIdx
                                ? { ...item, points: Math.max(1, Number(e.target.value)) }
                                : item
                            ),
                          }))
                        }
                        className="w-16 px-2 py-1 font-mono bg-white border border-slate-300 rounded"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          questions: prev.questions.filter((_, i) => i !== qIdx),
                        }))
                      }
                      className="text-red-600 hover:underline"
                    >
                      Hapus Soal
                    </button>
                  </div>
                </div>

                <textarea
                  rows={2}
                  value={q.prompt}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      questions: prev.questions.map((item, i) =>
                        i === qIdx ? { ...item, prompt: e.target.value } : item
                      ),
                    }))
                  }
                  placeholder="Tuliskan pertanyaan soal di sini..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                />

                {q.type !== 'short_answer' && q.options && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <input
                          type="radio"
                          name={`correct-${q.id}`}
                          checked={q.correctAnswer === String(optIdx)}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              questions: prev.questions.map((item, i) =>
                                i === qIdx
                                  ? { ...item, correctAnswer: String(optIdx) }
                                  : item
                              ),
                            }))
                          }
                        />
                        <input
                          type="text"
                          value={opt}
                          disabled={q.type === 'true_false'}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              questions: prev.questions.map((item, i) =>
                                i === qIdx
                                  ? {
                                      ...item,
                                      options: item.options?.map((o, oi) =>
                                        oi === optIdx ? e.target.value : o
                                      ),
                                    }
                                  : item
                              ),
                            }))
                          }
                          className="flex-1 px-2.5 py-1 bg-white border border-slate-300 rounded"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {q.type === 'short_answer' && (
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Kunci Jawaban Singkat (Case-Insensitive)
                    </label>
                    <input
                      type="text"
                      value={q.correctAnswer}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          questions: prev.questions.map((item, i) =>
                            i === qIdx ? { ...item, correctAnswer: e.target.value } : item
                          ),
                        }))
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded font-mono"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </ModalShell>
    </div>
  );
};

function createEmptyQuiz(
  authorId = 'usr-teacher-1',
  authorName = 'Guru',
  defaultMaterialId = 'mat-fis-termo'
): Quiz {
  return {
    id: `qz-${Date.now()}`,
    title: '',
    subject: 'Fisika',
    materialId: defaultMaterialId,
    requireMaterialCompletion: true,
    classIds: ['cls-xi-mipa-1'],
    description: '',
    durationMinutes: 20,
    publishStartAt: '2026-10-01T07:00',
    publishEndAt: '2026-10-25T23:59',
    status: 'published',
    maxAttempts: 2,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResultImmediately: true,
    showAnswerKey: true,
    createdById: authorId,
    createdByName: authorName,
    questions: [
      {
        id: `qq-init-${Date.now()}`,
        type: 'multiple_choice',
        prompt: 'Pertanyaan evaluasi pemahaman konsep utama:',
        options: ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'],
        correctAnswer: '0',
        points: 100,
        explanation: 'Pembahasan jawaban yang tepat.',
      },
    ],
  };
}
