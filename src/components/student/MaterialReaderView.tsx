import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Clock,
  CheckCircle2,
  PauseCircle,
  ArrowLeft,
  BookOpen,
  CheckSquare,
  HelpCircle,
  Paperclip,
  WifiOff,
  Sparkles,
  Layers,
  Bookmark,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { ReadingSession } from '../../types/lms';

export const MaterialReaderView: React.FC = () => {
  const {
    currentUser,
    materials,
    selectedMaterialId,
    readingSessions,
    isOnline,
    recordReadingHeartbeat,
    completeReadingMaterial,
    navigateStudent,
    addToast,
  } = useLms();

  const material =
    materials.find((m) => m.id === selectedMaterialId) || materials[0];

  const existingSession = readingSessions.find(
    (s) => s.student_id === currentUser?.id && s.material_id === material?.id
  );

  const [activeSeconds, setActiveSeconds] = useState<number>(
    existingSession?.active_duration_seconds ?? 0
  );
  const [pausedSeconds, setPausedSeconds] = useState<number>(
    existingSession?.paused_duration_seconds ?? 0
  );
  const [isTabVisible, setIsTabVisible] = useState<boolean>(true);
  const [isWindowFocused, setIsWindowFocused] = useState<boolean>(true);
  const [reachedCheckpoints, setReachedCheckpoints] = useState<string[]>(
    existingSession?.reached_checkpoints ?? []
  );
  const [answers, setAnswers] = useState<Record<string, number>>(
    existingSession?.answered_questions ?? {}
  );
  const [isCompleted, setIsCompleted] = useState<boolean>(
    existingSession?.completion_status === 'completed'
  );
  const [showTelemetry, setShowTelemetry] = useState<boolean>(false);

  const seqRef = useRef<number>(existingSession?.last_sequence_number ?? 0);
  const sessionIdRef = useRef<string>(
    existingSession?.session_id || `ses-${currentUser?.id || 'guest'}-${Date.now()}`
  );

  const targetSeconds = (material?.minReadMinutes || 15) * 60;
  const isTimerEffectivelyActive =
    !isCompleted &&
    isTabVisible &&
    (material?.pauseOnWindowBlur ? isWindowFocused : true);

  // 1. Page Visibility API & Window Focus Listener
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsTabVisible(visible);
    };

    const handleFocus = () => setIsWindowFocused(true);
    const handleBlur = () => setIsWindowFocused(false);

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  // 2. Timer
  useEffect(() => {
    if (isCompleted) return;

    const timer = setInterval(() => {
      if (isTimerEffectivelyActive) {
        setActiveSeconds((prev) => prev + 1);
      } else {
        setPausedSeconds((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isCompleted, isTimerEffectivelyActive]);

  // 3. Heartbeat berkala ke Repository
  const syncSessionToRepo = useCallback(() => {
    if (!currentUser || !material) return;
    seqRef.current += 1;
    const sessionPayload: ReadingSession = {
      student_id: currentUser.id,
      material_id: material.id,
      session_id: sessionIdRef.current,
      started_at: existingSession?.started_at || new Date().toISOString(),
      last_heartbeat_at: new Date().toISOString(),
      active_duration_seconds: activeSeconds,
      paused_duration_seconds: pausedSeconds,
      last_checkpoint: reachedCheckpoints[reachedCheckpoints.length - 1] || null,
      reached_checkpoints: reachedCheckpoints,
      answered_questions: answers,
      visibility_state: isTabVisible ? 'visible' : 'hidden',
      window_focused: isWindowFocused,
      completion_status: isCompleted
        ? 'completed'
        : isTimerEffectivelyActive
        ? 'active'
        : 'paused',
      completed_at: isCompleted ? existingSession?.completed_at || new Date().toISOString() : null,
      sync_status: isOnline ? 'synced' : 'pending_offline',
      last_sequence_number: seqRef.current,
    };

    recordReadingHeartbeat(sessionPayload, seqRef.current);
  }, [
    currentUser,
    material,
    existingSession,
    activeSeconds,
    pausedSeconds,
    reachedCheckpoints,
    answers,
    isCompleted,
    isTabVisible,
    isWindowFocused,
    isTimerEffectivelyActive,
    isOnline,
    recordReadingHeartbeat,
  ]);

  useEffect(() => {
    const heartbeatInterval = setInterval(() => {
      syncSessionToRepo();
    }, 5000);
    return () => clearInterval(heartbeatInterval);
  }, [syncSessionToRepo]);

  const toggleCheckpoint = (cpId: string) => {
    if (reachedCheckpoints.includes(cpId)) {
      setReachedCheckpoints((prev) => prev.filter((id) => id !== cpId));
    } else {
      setReachedCheckpoints((prev) => [...prev, cpId]);
      addToast({
        type: 'info',
        title: 'Checkpoint Ditandai',
        description: 'Kemajuan bagian materi berhasil dicatat.',
      });
    }
  };

  const handleAnswerQuestion = (qId: string, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: optIdx }));
  };

  const isTimeMet = activeSeconds >= targetSeconds;
  const isCheckpointsMet =
    !material?.requireAllCheckpoints ||
    material.checkpoints
      .filter((c) => c.required)
      .every((c) => reachedCheckpoints.includes(c.id));

  const isQuestionsMet =
    !material?.requireComprehensionPass ||
    material.comprehensionQuestions.length === 0 ||
    material.comprehensionQuestions.every(
      (q) => answers[q.id] === q.correctOptionIndex
    );

  const canComplete = isTimeMet && isCheckpointsMet && isQuestionsMet && isOnline;

  const handleComplete = () => {
    if (!currentUser || !material) return;
    const res = completeReadingMaterial(currentUser.id, material.id);
    if (res.ok) {
      setIsCompleted(true);
      syncSessionToRepo();
    } else {
      addToast({
        type: 'error',
        title: 'Materi Belum Dapat Diselesaikan',
        description: res.reason || 'Periksa seluruh prasyarat yang belum terpenuhi.',
      });
    }
  };

  const addDemoActiveMinute = () => {
    setActiveSeconds((prev) => prev + 60);
    addToast({
      type: 'info',
      title: 'Demo Test: +60 Detik Waktu Aktif',
      description: 'Durasi aktif dipercepat untuk pengujian.',
    });
  };

  const progressPct = Math.min(100, Math.round((activeSeconds / Math.max(1, targetSeconds)) * 100));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => navigateStudent('materials')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#202923] bg-white border border-[#E5E9E3] px-3.5 py-2 rounded-lg hover:bg-[#F7F7F2] transition-colors shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#276749]" />
          <span>Kembali ke Daftar Materi</span>
        </button>

        <button
          type="button"
          onClick={() => setShowTelemetry(!showTelemetry)}
          className="text-xs text-[#68736B] hover:text-[#202923] underline"
        >
          {showTelemetry ? 'Sembunyikan Telemetri Sesi' : 'Inspektur Sesi'}
        </button>
      </div>

      {/* Sticky Floating Timer Bar */}
      <div className="sticky top-14 z-30 bg-white/95 backdrop-blur-md border border-[#E5E9E3] rounded-xl p-4 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                isCompleted
                  ? 'bg-[#E5F3E8] text-[#2F855A]'
                  : isTimerEffectivelyActive
                  ? 'bg-[#E5F3E8] text-[#276749] animate-pulse'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-[#2F855A]" />
              ) : isTimerEffectivelyActive ? (
                <Clock className="w-5 h-5 text-[#276749]" />
              ) : (
                <PauseCircle className="w-5 h-5 text-amber-700" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#202923]">
                  {isCompleted
                    ? 'Materi Selesai Dipelajari'
                    : isTimerEffectivelyActive
                    ? 'Timer Membaca: Aktif'
                    : 'Timer Membaca: Dijeda'}
                </span>
                <span className="text-xs font-mono font-bold text-[#276749]">
                  {Math.floor(activeSeconds / 60)}m {String(activeSeconds % 60).padStart(2, '0')}d
                </span>
                <span className="text-xs text-[#68736B]">
                  / Target {material.minReadMinutes} menit
                </span>
              </div>
              <div className="text-[11px] text-[#68736B]">
                {!isTabVisible && '● Dijeda: Tab peramban sedang tidak aktif / tersembunyi'}
                {isTabVisible && !isWindowFocused && material.pauseOnWindowBlur && '● Dijeda: Jendela kehilangan fokus'}
                {isTimerEffectivelyActive && '● Menghitung durasi baca aktif'}
                {isCompleted && '● Seluruh prasyarat telah tuntas divalidasi'}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isCompleted && (
              <button
                type="button"
                onClick={addDemoActiveMinute}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-mono font-semibold text-[#276749] bg-[#E5F3E8] border border-[#48A878]/30 rounded-lg hover:bg-[#cbe6d2] transition-colors cursor-pointer"
                title="Tambah 1 menit waktu baca untuk pengujian"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>[DEMO: +1 Menit]</span>
              </button>
            )}

            <button
              type="button"
              disabled={!canComplete || isCompleted}
              onClick={handleComplete}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                isCompleted
                  ? 'bg-[#2F855A] text-white cursor-default'
                  : canComplete
                  ? 'bg-[#276749] hover:bg-[#1F513A] text-white shadow-2xs cursor-pointer'
                  : 'bg-[#F7F7F2] text-[#858D86] border border-[#E5E9E3] cursor-not-allowed'
              }`}
            >
              {isCompleted ? '✓ Materi Selesai' : 'Selesaikan Materi'}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-[11px] text-[#68736B] font-mono mb-1">
            <span>
              Waktu Aktif: {Math.floor(activeSeconds / 60)}m {activeSeconds % 60}d · Waktu Jeda:{' '}
              {Math.floor(pausedSeconds / 60)}m {pausedSeconds % 60}d
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="w-full h-2 bg-[#F7F7F2] rounded-full overflow-hidden border border-[#E5E9E3]">
            <div
              className={`h-full transition-all ${
                isCompleted
                  ? 'bg-[#2F855A]'
                  : isTimerEffectivelyActive
                  ? 'bg-[#276749]'
                  : 'bg-[#D99A2B]'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {!isOnline && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-xs text-amber-900">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Koneksi offline: Waktu tetap dicatat di penyimpanan lokal. Tombol selesaikan materi akan aktif setelah tersambung kembali.
            </span>
          </div>
        )}
      </div>

      {/* Telemetry Debug Panel */}
      {showTelemetry && (
        <div className="bg-[#192A23] text-white p-4 rounded-xl text-xs space-y-2 font-mono border border-[#23382E]">
          <div className="font-bold text-[#48A878] flex items-center justify-between border-b border-[#23382E] pb-2">
            <span>Inspektur Sesi Membaca (Real-time Repository Tracker)</span>
            <span className="text-[10px] text-[#A3B1A8]">Seq #{seqRef.current}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div>Sesi ID: {sessionIdRef.current.slice(0, 16)}...</div>
            <div>Siswa: {currentUser?.name}</div>
            <div>Status: {isTimerEffectivelyActive ? 'ACTIVE' : 'PAUSED'}</div>
            <div>Visibilitas: {isTabVisible ? 'Visible' : 'Hidden'}</div>
            <div>Waktu Aktif: {activeSeconds}s</div>
            <div>Waktu Jeda: {pausedSeconds}s</div>
            <div>Checkpoint: {reachedCheckpoints.length} tuntas</div>
            <div>Sync State: {isOnline ? 'ONLINE' : 'OFFLINE'}</div>
          </div>
        </div>
      )}

      {/* Main Material Display Article */}
      <article className="bg-white border border-[#E5E9E3] rounded-2xl p-6 sm:p-10 shadow-2xs space-y-8">
        
        {/* DISTINCT BORDERED HEADER CARD FOR MAIN TITLE */}
        <header className="bg-[#F7F7F2] border-l-4 border-l-[#276749] border border-[#E5E9E3] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-[#276749] text-white text-xs font-bold shadow-2xs flex items-center gap-1.5">
                <Bookmark className="w-3.5 h-3.5 text-emerald-200" />
                <span>{material.subject}</span>
              </span>
              <span className="text-xs text-[#68736B] font-mono bg-white px-2.5 py-1 rounded-md border border-[#E5E9E3]">
                Topik: {material.topic || 'Umum'}
              </span>
            </div>

            <span className="text-xs font-mono text-[#276749] font-bold bg-[#E5F3E8] px-2.5 py-1 rounded-md border border-[#48A878]/30">
              Bab #{material.order}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#202923] pt-1">
            {material.title}
          </h1>

          {material.summary && (
            <p className="text-xs sm:text-sm text-[#202923] italic leading-relaxed bg-white p-3.5 rounded-xl border border-[#E5E9E3]">
              "{material.summary}"
            </p>
          )}
        </header>

        {/* Sections Content */}
        <div className="space-y-8">
          {material.sections.map((sec, idx) => {
            const relatedCp = material.checkpoints.find((c) => c.sectionAnchor === sec.id);
            const isCpReached = relatedCp ? reachedCheckpoints.includes(relatedCp.id) : false;

            return (
              <section key={sec.id} className="space-y-4 pb-6 border-b border-[#E5E9E3] last:border-0 last:pb-0">
                
                {/* DISTINCT BORDERED TITLE CARD FOR SECTION HEADINGS */}
                <div className="bg-[#E5F3E8]/50 border-l-4 border-l-[#276749] border border-[#48A878]/30 rounded-xl p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <h2 className="text-lg font-bold text-[#202923] flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-[#276749] shrink-0" />
                      <span className="truncate">{sec.heading}</span>
                    </h2>
                    {sec.subheading && (
                      <p className="text-xs text-[#68736B] pl-7">{sec.subheading}</p>
                    )}
                  </div>

                  <span className="text-[11px] font-mono font-bold text-[#276749] bg-white px-2.5 py-1 rounded-md border border-[#E5E9E3] shrink-0 self-start sm:self-auto">
                    Sub-Bab #{idx + 1}
                  </span>
                </div>

                {/* Content body */}
                <div
                  className="prose prose-slate max-w-none text-sm text-[#202923] leading-relaxed font-sans px-1 sm:px-2"
                  dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
                />

                {/* Checkpoint Box */}
                {relatedCp && (
                  <div className="p-4 bg-[#F7F7F2] border border-[#E5E9E3] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-[#202923] flex items-center gap-1.5">
                        <CheckSquare className="w-4 h-4 text-[#276749]" />
                        <span>{relatedCp.title}</span>
                      </div>
                      <p className="text-[11px] text-[#68736B]">{relatedCp.description}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleCheckpoint(relatedCp.id)}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all shrink-0 cursor-pointer ${
                        isCpReached
                          ? 'bg-[#2F855A] text-white shadow-2xs'
                          : 'bg-[#E5F3E8] hover:bg-[#276749] hover:text-white text-[#276749] border border-[#48A878]/30'
                      }`}
                    >
                      {isCpReached ? '✓ Checkpoint Selesai' : 'Tandai Selesai Dibaca'}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {/* Attachments Section */}
        {material.attachments.length > 0 && (
          <div className="pt-4 border-t border-[#E5E9E3] space-y-3">
            <div className="bg-[#F7F7F2] border-l-4 border-l-[#276749] border border-[#E5E9E3] rounded-xl p-3 px-4 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#202923] flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-[#276749]" />
                <span>Berkas Lampiran & Referensi Belajar</span>
              </h3>
              <span className="text-[11px] font-mono font-semibold text-[#68736B]">
                {material.attachments.length} Berkas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {material.attachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-3 bg-[#F7F7F2] border border-[#E5E9E3] rounded-xl hover:border-[#48A878] transition-all flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-4 h-4 text-[#276749] shrink-0" />
                    <span className="font-semibold text-[#202923] truncate">{att.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#276749] font-bold group-hover:underline shrink-0">
                    Buka Berkas ↗
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Comprehension Questions */}
        {material.comprehensionQuestions.length > 0 && (
          <div className="pt-6 border-t border-[#E5E9E3] space-y-4">
            <div className="bg-[#E5F3E8] border-l-4 border-l-[#276749] border border-[#48A878]/30 rounded-xl p-3 px-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#202923] flex items-center gap-2">
                <HelpCircle className="w-4.5 h-4.5 text-[#276749]" />
                <span>Kuis Singkat Pemahaman Materi</span>
              </h3>
              <span className="text-xs font-mono font-bold text-[#276749]">
                {material.comprehensionQuestions.length} Soal
              </span>
            </div>

            <div className="space-y-4">
              {material.comprehensionQuestions.map((q, qIdx) => {
                const userAns = answers[q.id];
                return (
                  <div key={q.id} className="p-4 bg-[#F7F7F2] border border-[#E5E9E3] rounded-xl space-y-2 text-xs">
                    <div className="font-bold text-[#202923]">
                      {qIdx + 1}. {q.question}
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {q.options.map((opt, optIdx) => (
                        <label
                          key={optIdx}
                          className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-all ${
                            userAns === optIdx
                              ? 'bg-[#E5F3E8] border-[#48A878] text-[#276749] font-semibold'
                              : 'bg-white border-[#E5E9E3] text-[#202923] hover:bg-[#F7F7F2]'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={userAns === optIdx}
                            onChange={() => handleAnswerQuestion(q.id, optIdx)}
                            className="text-[#276749] focus:ring-[#276749]"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
