import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Lock,
  WifiOff,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { QuizAttempt } from '../../types/lms';

export const StudentQuizRunnerView: React.FC = () => {
  const {
    currentUser,
    quizzes,
    selectedQuizId,
    materials,
    startOrResumeQuizAttempt,
    saveQuizAttemptProgress,
    navigateStudent,
    isMaterialCompletedByStudent,
    isOnline,
    addToast,
  } = useLms();

  const quiz = quizzes.find((q) => q.id === selectedQuizId) || quizzes[0];
  const isPrereqMet =
    !quiz?.requireMaterialCompletion ||
    isMaterialCompletedByStudent(currentUser?.id || '', quiz.materialId);

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(quiz?.durationMinutes * 60);

  // Inisialisasi atau resume attempt
  useEffect(() => {
    if (!currentUser || !quiz || !isPrereqMet) return;
    const att = startOrResumeQuizAttempt(quiz.id, currentUser.id);
    setAttempt(att);
    setAnswers(att.answers || {});
    setRemainingSeconds(att.remainingSeconds);
  }, [currentUser, quiz, isPrereqMet, startOrResumeQuizAttempt]);

  // Countdown timer per detik jika in_progress
  useEffect(() => {
    if (!attempt || attempt.status === 'completed') return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [attempt]);

  // Auto-save jawaban berkala setiap 10 detik
  useEffect(() => {
    if (!attempt || attempt.status === 'completed') return;
    const autoSaveTimer = setInterval(() => {
      saveQuizAttemptProgress(attempt.id, answers, remainingSeconds, false);
    }, 10000);
    return () => clearInterval(autoSaveTimer);
  }, [attempt, answers, remainingSeconds, saveQuizAttemptProgress]);

  const handleSelectAnswer = (qId: string, ansValue: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: ansValue }));
  };

  const handleFinalSubmit = (forcedTimeout = false) => {
    if (!attempt) return;
    const updated = saveQuizAttemptProgress(
      attempt.id,
      answers,
      remainingSeconds,
      true
    );
    setAttempt(updated);
    if (forcedTimeout) {
      addToast({
        type: 'warning',
        title: 'Waktu Kuis Habis',
        description: 'Jawaban Anda telah dikumpulkan dan dinilai secara otomatis.',
      });
    }
  };

  if (!isPrereqMet) {
    const relMat = materials.find((m) => m.id === quiz.materialId);
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900">Kuis Masih Terkunci</h1>
        <p className="text-xs text-slate-600">
          Anda harus menyelesaikan sesi membaca materi &quot;{relMat?.title}&quot; terlebih dahulu sebelum dapat mengakses kuis ini.
        </p>
        <button
          type="button"
          onClick={() =>
            navigateStudent('material_reader', { materialId: quiz.materialId })
          }
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Buka Materi Prasyarat
        </button>
      </div>
    );
  }

  const currentQ = quiz.questions[currentQIndex];
  const isCompleted = attempt?.status === 'completed';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigateStudent('quizzes')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 px-3.5 py-2 rounded-lg hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Kuis</span>
        </button>

        {/* Timer Countdown Bar */}
        {!isCompleted && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm">
            <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Sisa Waktu:</span>
            <span className="text-sm font-mono font-bold text-blue-700">
              {Math.floor(remainingSeconds / 60)}:
              {String(remainingSeconds % 60).padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {/* Offline Alert */}
      {!isOnline && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Koneksi terputus: Jawaban Anda tetap tersimpan di penyimpanan lokal dan akan disinkronkan saat online.
          </span>
        </div>
      )}

      {/* Hasil Kuis jika Selesai */}
      {isCompleted && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-emerald-700 uppercase">
                Evaluasi Selesai
              </div>
              <h1 className="text-2xl font-bold text-slate-900">{quiz.title}</h1>
              <p className="text-xs text-slate-500">
                Percobaan #{attempt?.attemptNumber} · Selesai pada{' '}
                {new Date(attempt?.submittedAt || '').toLocaleString('id-ID')}
              </p>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center shrink-0">
              <div className="text-xs text-emerald-800 font-medium">Skor Akhir Anda</div>
              <div className="text-3xl font-bold font-mono text-emerald-950 mt-1">
                {attempt?.score} / 100
              </div>
            </div>
          </div>

          {/* Pembahasan Kunci Jawaban jika diaktifkan */}
          {quiz.showAnswerKey && (
            <div className="space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Pembahasan Butir Soal:</h2>
              {quiz.questions.map((q, idx) => {
                const userAns = (answers[q.id] ?? '').trim().toLowerCase();
                const correctAns = q.correctAnswer.trim().toLowerCase();
                const isRight = userAns && userAns === correctAns;

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border space-y-2 text-xs ${
                      isRight
                        ? 'bg-emerald-50/60 border-emerald-200'
                        : 'bg-red-50/60 border-red-200'
                    }`}
                  >
                    <div className="font-bold text-slate-900">
                      Soal #{idx + 1}: {q.prompt}
                    </div>
                    <div className="text-slate-700">
                      Jawaban Anda:{' '}
                      <strong className={isRight ? 'text-emerald-800' : 'text-red-800'}>
                        {q.type !== 'short_answer' && q.options
                          ? q.options[Number(answers[q.id])] || '(Tidak dijawab)'
                          : answers[q.id] || '(Tidak dijawab)'}
                      </strong>
                    </div>
                    {!isRight && (
                      <div className="text-slate-700">
                        Kunci Jawaban:{' '}
                        <strong className="text-emerald-800">
                          {q.type !== 'short_answer' && q.options
                            ? q.options[Number(q.correctAnswer)]
                            : q.correctAnswer}
                        </strong>
                      </div>
                    )}
                    {q.explanation && (
                      <div className="text-slate-600 bg-white/70 p-2.5 rounded-lg border border-slate-200 mt-1">
                        <strong>Pembahasan:</strong> {q.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tampilan Pengerjaan Soal (In Progress) */}
      {!isCompleted && currentQ && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-6">
          {/* Question Navigator Numbers */}
          <div className="flex flex-wrap gap-2 pb-4 border-b border-slate-200">
            {quiz.questions.map((_, idx) => {
              const qItem = quiz.questions[idx];
              const isAnswered = answers[qItem.id] !== undefined;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentQIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-mono font-bold transition-all ${
                    currentQIndex === idx
                      ? 'bg-blue-600 text-white shadow-md'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Prompt */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-blue-700 uppercase">
              Soal #{currentQIndex + 1} dari {quiz.questions.length} ({currentQ.points} Poin)
            </div>
            <p className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed">
              {currentQ.prompt}
            </p>
          </div>

          {/* Options */}
          {currentQ.type !== 'short_answer' && currentQ.options && (
            <div className="space-y-3">
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === String(optIdx);
                return (
                  <label
                    key={optIdx}
                    onClick={() => handleSelectAnswer(currentQ.id, String(optIdx))}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 font-semibold text-blue-900'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`runner-${currentQ.id}`}
                      checked={isSelected}
                      onChange={() => {}}
                      className="text-blue-600"
                    />
                    <span className="text-sm">{opt}</span>
                  </label>
                );
              })}
            </div>
          )}

          {currentQ.type === 'short_answer' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ketikkan Jawaban Singkat Anda:
              </label>
              <input
                type="text"
                value={answers[currentQ.id] || ''}
                onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                placeholder="Tuliskan kata atau nilai jawaban..."
                className="w-full px-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          )}

          {/* Bottom Navigation Buttons */}
          <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl disabled:opacity-40"
            >
              ← Soal Sebelumnya
            </button>

            {currentQIndex < quiz.questions.length - 1 ? (
              <button
                type="button"
                onClick={() =>
                  setCurrentQIndex((prev) =>
                    Math.min(quiz.questions.length - 1, prev + 1)
                  )
                }
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800"
              >
                Soal Berikutnya →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                className="px-6 py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md"
              >
                Selesaikan & Kumpulkan Kuis
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
