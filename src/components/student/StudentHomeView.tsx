import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  Clock,
  CheckCircle2,
  ArrowRight,
  Flame,
  Target,
  Play,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { StudentProgressDoughnutChart } from './StudentProgressDoughnutChart';
import { CompactPagination } from '../common/CompactPagination';

export const StudentHomeView: React.FC = () => {
  const {
    currentUser,
    classes,
    materials,
    readingSessions,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    gradeWeights,
    navigateStudent,
    isMaterialCompletedByStudent,
  } = useLms();

  const userClass = classes.find((c) => c.id === currentUser?.classId);

  // Filtered lists
  const studentMaterials = materials.filter(
    (m) =>
      (!currentUser?.classId || m.classIds.includes(currentUser.classId)) &&
      m.status === 'published'
  );

  const studentAssignments = assignments.filter(
    (a) =>
      (!currentUser?.classId || a.classIds.includes(currentUser.classId)) &&
      a.status === 'published'
  );

  const studentQuizzes = quizzes.filter(
    (q) =>
      (!currentUser?.classId || q.classIds.includes(currentUser.classId)) &&
      q.status === 'published'
  );

  // Pagination states for student materials list
  const [materialPage, setMaterialPage] = useState<number>(1);
  const [materialPageSize, setMaterialPageSize] = useState<number>(4);

  const totalMaterialPages = Math.ceil(studentMaterials.length / materialPageSize);
  const paginatedMaterials = studentMaterials.slice(
    (materialPage - 1) * materialPageSize,
    materialPage * materialPageSize
  );

  // Status Materi
  const completedMaterials = studentMaterials.filter((m) =>
    isMaterialCompletedByStudent(currentUser?.id || '', m.id)
  );

  // Cari sesi belajar yang paling baru dibuka untuk quick resume
  const lastActiveSession = readingSessions
    .filter((s) => s.student_id === currentUser?.id)
    .sort((a, b) => new Date(b.last_heartbeat_at).getTime() - new Date(a.last_heartbeat_at).getTime())[0];

  const lastActiveMaterial = lastActiveSession
    ? materials.find((m) => m.id === lastActiveSession.material_id)
    : studentMaterials[0];

  // Perhitungan Nilai Rata-rata & Progress
  const overallMatPct =
    studentMaterials.length > 0
      ? Math.round((completedMaterials.length / studentMaterials.length) * 100)
      : 100;

  const mySubs = submissions.filter(
    (s) => s.studentId === currentUser?.id && s.score !== null
  );
  const avgAsgScore =
    mySubs.length > 0
      ? Math.round(mySubs.reduce((acc, item) => acc + (item.score || 0), 0) / mySubs.length)
      : 0;

  const myAttempts = quizAttempts.filter(
    (a) => a.studentId === currentUser?.id && a.score !== null
  );
  const avgQuizScore =
    myAttempts.length > 0
      ? Math.round(myAttempts.reduce((acc, item) => acc + (item.score || 0), 0) / myAttempts.length)
      : 0;

  const myFinalGrade = Math.round(
    (overallMatPct * gradeWeights.materialCompletionWeight +
      avgAsgScore * gradeWeights.assignmentWeight +
      avgQuizScore * gradeWeights.quizWeight) /
      100
  );

  const totalReadingSeconds = readingSessions
    .filter((s) => s.student_id === currentUser?.id)
    .reduce((acc, s) => acc + s.active_duration_seconds, 0);

  const isPassed = myFinalGrade >= gradeWeights.passingGrade;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. HERO BANNER: Forest Edition Greeting */}
      <div className="bg-gradient-to-br from-[#0F1C16] via-[#192A23] to-[#23382E] text-white rounded-2xl p-6 sm:p-8 shadow-2xs border border-[#23382E] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#276749]/40 text-emerald-200 border border-[#48A878]/30 rounded-md text-xs font-semibold">
              {userClass?.name || 'Siswa SMA'}
            </span>
            <span className="text-xs text-[#A3B1A8] font-mono">NIS: {currentUser?.nis || '-'}</span>
            <span className="text-[#A3B1A8]">·</span>
            <span className="inline-flex items-center gap-1 text-xs text-amber-300 font-semibold bg-amber-500/15 px-2 py-0.5 rounded border border-amber-400/30">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Streak Belajar: 5 Hari Aktif</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Selamat Datang Kembali, {currentUser?.name}!
          </h1>

          <p className="text-xs sm:text-sm text-[#C5D0C8] max-w-2xl leading-relaxed">
            Pantau kemajuan membaca materi aktif, periksa tenggat tugas, dan evaluasi hasil belajar mandiri secara terpadu.
          </p>
        </div>

        {/* Kumulatif Nilai Akhir Card */}
        <div className="bg-[#12201A]/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-[#23382E] flex items-center justify-between lg:justify-end gap-5 shrink-0">
          <div className="text-left lg:text-right space-y-0.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#A3B1A8]">
              Estimasi Nilai Akhir
            </div>
            <div className="text-3xl font-bold font-mono text-white">
              {myFinalGrade} <span className="text-lg font-normal text-[#A3B1A8]">/ 100</span>
            </div>
            <div className="text-xs text-[#A3B1A8] flex items-center gap-1.5 lg:justify-end">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPassed ? 'bg-[#2F855A]' : 'bg-[#D99A2B]'
                }`}
              />
              <span>
                KKM {gradeWeights.passingGrade} ({isPassed ? 'Tuntas' : 'Perlu Remedial'})
              </span>
            </div>
          </div>
          <div className="w-14 h-14 bg-[#276749] text-white rounded-2xl flex items-center justify-center font-bold shadow-md shrink-0">
            <Award className="w-7 h-7 text-emerald-200" />
          </div>
        </div>
      </div>

      {/* 2. STAT CARDS: 4 Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Materi */}
        <div
          onClick={() => navigateStudent('materials')}
          className="cursor-pointer bg-white border border-[#E5E9E3] rounded-xl p-4 space-y-2 hover:border-[#48A878] transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs text-[#68736B]">
            <span className="font-semibold">Materi Pembelajaran</span>
            <BookOpen className="w-4 h-4 text-[#276749] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#202923]">
            {completedMaterials.length} / {studentMaterials.length}
          </div>
          <div className="space-y-1">
            <div className="w-full h-2 bg-[#F7F7F2] rounded-full overflow-hidden border border-[#E5E9E3]">
              <div className="h-full bg-[#276749] transition-all" style={{ width: `${overallMatPct}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-[#68736B]">
              <span>{overallMatPct}% Selesai</span>
              <span className="font-mono text-[#276749] font-semibold">
                {Math.floor(totalReadingSeconds / 60)}m Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Tugas */}
        <div
          onClick={() => navigateStudent('assignments')}
          className="cursor-pointer bg-white border border-[#E5E9E3] rounded-xl p-4 space-y-2 hover:border-[#48A878] transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs text-[#68736B]">
            <span className="font-semibold">Tugas Mandiri</span>
            <FileText className="w-4 h-4 text-[#2F855A] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#202923]">
            {mySubs.length} / {studentAssignments.length}
          </div>
          <div className="text-xs text-[#68736B] flex items-center justify-between pt-1 border-t border-[#E5E9E3]">
            <span>Rata-rata Nilai:</span>
            <span className="font-mono font-bold text-[#2F855A]">{avgAsgScore} / 100</span>
          </div>
        </div>

        {/* Card 3: Kuis */}
        <div
          onClick={() => navigateStudent('quizzes')}
          className="cursor-pointer bg-[#ffffff] border border-[#E5E9E3] rounded-xl p-4 space-y-2 hover:border-[#48A878] transition-all group shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs text-[#68736B]">
            <span className="font-semibold">Evaluasi Kuis</span>
            <HelpCircle className="w-4 h-4 text-[#D99A2B] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#202923]">
            {myAttempts.length} / {studentQuizzes.length}
          </div>
          <div className="text-xs text-[#68736B] flex items-center justify-between pt-1 border-t border-[#E5E9E3]">
            <span>Rata-rata Skor:</span>
            <span className="font-mono font-bold text-[#D99A2B]">{avgQuizScore} / 100</span>
          </div>
        </div>

        {/* Card 4: Target Harian */}
        <div className="bg-white border border-[#E5E9E3] rounded-xl p-4 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#68736B]">
            <span className="font-semibold">Target Belajar Harian</span>
            <Target className="w-4 h-4 text-[#276749]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#202923]">
            {Math.floor(totalReadingSeconds / 60)} / 45 <span className="text-xs font-normal text-[#68736B]">Menit</span>
          </div>
          <div className="w-full h-2 bg-[#F7F7F2] rounded-full overflow-hidden border border-[#E5E9E3]">
            <div
              className="h-full bg-[#276749] transition-all"
              style={{ width: `${Math.min(100, Math.round((totalReadingSeconds / (45 * 60)) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. DOUGHNUT CHART: Progres Belajar Materi */}
      <StudentProgressDoughnutChart
        materials={studentMaterials}
        readingSessions={readingSessions}
        studentId={currentUser?.id || ''}
        isMaterialCompletedByStudent={isMaterialCompletedByStudent}
      />

      {/* 4. QUICK RESUME */}
      {lastActiveMaterial && (
        <div className="bg-white border border-[#48A878]/40 rounded-2xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#E5F3E8] text-[#276749] flex items-center justify-center shrink-0">
              <Play className="w-5 h-5 fill-[#276749]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#276749] uppercase tracking-wider">
                Lanjutkan Sesi Membaca Terakhir
              </div>
              <h2 className="text-base font-bold text-[#202923]">{lastActiveMaterial.title}</h2>
              <div className="text-xs text-[#68736B] flex items-center gap-2 mt-0.5">
                <span>{lastActiveMaterial.subject}</span>
                <span>·</span>
                <span>Target: {lastActiveMaterial.minReadMinutes} Menit</span>
                <span>·</span>
                <span className="font-mono text-[#202923]">
                  {Math.floor((lastActiveSession?.active_duration_seconds || 0) / 60)}m telah dibaca
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              navigateStudent('material_reader', { materialId: lastActiveMaterial.id })
            }
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#276749] hover:bg-[#1F513A] rounded-xl transition-colors shadow-2xs whitespace-nowrap cursor-pointer"
          >
            <span>Buka Pembaca Materi</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. PAGINATED MATERI PEMBELAJARAN LIST */}
      <div className="bg-white border border-[#E5E9E3] rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-[#E5E9E3] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#202923]">Materi Pembelajaran Aktif</h3>
            <p className="text-xs text-[#68736B]">Materi wajib untuk kelas {userClass?.name}</p>
          </div>
          <button
            type="button"
            onClick={() => navigateStudent('materials')}
            className="text-xs font-semibold text-[#276749] hover:underline"
          >
            Lihat Semua ({studentMaterials.length})
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          {paginatedMaterials.map((mat) => {
            const isDone = isMaterialCompletedByStudent(currentUser?.id || '', mat.id);
            const ses = readingSessions.find(
              (s) => s.student_id === currentUser?.id && s.material_id === mat.id
            );
            const activeSec = ses?.active_duration_seconds ?? 0;
            const targetSec = mat.minReadMinutes * 60;
            const pct = Math.min(100, Math.round((activeSec / Math.max(1, targetSec)) * 100));

            return (
              <div
                key={mat.id}
                onClick={() => navigateStudent('material_reader', { materialId: mat.id })}
                className="cursor-pointer p-3.5 border border-[#E5E9E3] rounded-xl hover:border-[#48A878] transition-all space-y-2.5 bg-white shadow-2xs"
              >
                {/* Bordered Title Card Column */}
                <div className="bg-[#F7F7F2] border-l-4 border-l-[#276749] border border-[#E5E9E3] rounded-lg p-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-[#276749] uppercase tracking-wider">{mat.subject}</div>
                    <div className="text-xs font-bold text-[#202923] truncate mt-0.5">{mat.title}</div>
                  </div>
                  {isDone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#2F855A] bg-[#E5F3E8] px-2 py-0.5 rounded border border-[#48A878]/30 shrink-0">
                      <CheckCircle2 className="w-3 h-3" /> Selesai
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[#276749] bg-[#E5F3E8] px-2 py-0.5 rounded border border-[#48A878]/30 shrink-0">
                      <Clock className="w-3 h-3" /> {mat.minReadMinutes}m
                    </span>
                  )}
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-mono text-[#68736B] mb-1">
                    <span>
                      {Math.floor(activeSec / 60)}m {activeSec % 60}d aktif
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#F7F7F2] rounded-full overflow-hidden border border-[#E5E9E3]">
                    <div
                      className={`h-full ${isDone ? 'bg-[#2F855A]' : 'bg-[#276749]'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact Pagination for Materials List */}
        <CompactPagination
          currentPage={materialPage}
          totalPages={totalMaterialPages}
          totalItems={studentMaterials.length}
          pageSize={materialPageSize}
          onPageChange={setMaterialPage}
          onPageSizeChange={setMaterialPageSize}
          itemLabel="materi"
        />
      </div>
    </div>
  );
};
