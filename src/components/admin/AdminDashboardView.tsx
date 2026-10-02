import React, { useState, useMemo } from 'react';
import {
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Download,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { StudentProgressDetailModal } from '../common/StudentProgressDetailModal';
import { ExportReportModal } from '../common/ExportReportModal';
import { MaterialCompletionTrendChart } from './charts/MaterialCompletionTrendChart';
import { GradeDistributionChart } from './charts/GradeDistributionChart';

export const AdminDashboardView: React.FC = () => {
  const {
    users,
    classes,
    materials,
    readingSessions,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    auditLogs,
    navigateAdmin,
  } = useLms();

  const [periodFilter, setPeriodFilter] = useState<string>('30d');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [activityFilter, setActivityFilter] = useState<string>('all');

  const [detailStudentId, setDetailStudentId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const teachers = useMemo(
    () => users.filter((u) => u.role === 'teacher'),
    [users]
  );

  const filteredStudents = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === 'student' &&
          (classFilter === 'all' || u.classId === classFilter)
      ),
    [users, classFilter]
  );

  const filteredMaterials = useMemo(
    () =>
      materials.filter(
        (m) =>
          (classFilter === 'all' || m.classIds.includes(classFilter)) &&
          (teacherFilter === 'all' || m.createdById === teacherFilter) &&
          (materialFilter === 'all' || m.id === materialFilter)
      ),
    [materials, classFilter, teacherFilter, materialFilter]
  );

  const filteredSessions = useMemo(
    () =>
      readingSessions.filter(
        (s) =>
          filteredStudents.some((st) => st.id === s.student_id) &&
          filteredMaterials.some((m) => m.id === s.material_id)
      ),
    [readingSessions, filteredStudents, filteredMaterials]
  );

  // Metrik Utama
  const activeReadingCount = filteredSessions.filter(
    (s) => s.completion_status === 'active'
  ).length;
  const pausedReadingCount = filteredSessions.filter(
    (s) => s.completion_status === 'paused'
  ).length;
  const completedReadingCount = filteredSessions.filter(
    (s) => s.completion_status === 'completed'
  ).length;

  const studentsWithAnySession = new Set(filteredSessions.map((s) => s.student_id));
  const notStartedStudentCount = filteredStudents.filter(
    (st) => !studentsWithAnySession.has(st.id)
  ).length;

  // Tugas
  const filteredSubmissions = submissions.filter((sub) =>
    filteredStudents.some((st) => st.id === sub.studentId)
  );
  const gradedSubCount = filteredSubmissions.filter((s) => s.status === 'graded').length;
  const submittedPendingCount = filteredSubmissions.filter(
    (s) => s.status === 'submitted' || s.status === 'late'
  ).length;
  const totalExpectedSubmissions =
    filteredStudents.length * Math.max(1, assignments.length);
  const unsubmittedCount = Math.max(
    0,
    totalExpectedSubmissions - gradedSubCount - submittedPendingCount
  );

  // Kuis
  const filteredQuizAttempts = quizAttempts.filter((att) =>
    filteredStudents.some((st) => st.id === att.studentId)
  );
  const inProgressQuizCount = filteredQuizAttempts.filter(
    (a) => a.status === 'in_progress'
  ).length;
  const completedQuizCount = filteredQuizAttempts.filter(
    (a) => a.status === 'completed'
  ).length;

  // Daftar Siswa yang Membutuhkan Tindak Lanjut
  const followUpStudents = useMemo(() => {
    return filteredStudents
      .map((std) => {
        const cls = classes.find((c) => c.id === std.classId);
        const stdSessions = readingSessions.filter((s) => s.student_id === std.id);
        const hasPausedLong = stdSessions.some(
          (s) => s.completion_status === 'paused' && s.paused_duration_seconds > 180
        );
        const hasNoActivity = stdSessions.length === 0;
        const stdSubs = submissions.filter((s) => s.studentId === std.id);
        const missingAssignment = assignments.some(
          (a) =>
            (!std.classId || a.classIds.includes(std.classId)) &&
            !stdSubs.some((s) => s.assignmentId === a.id)
        );

        let issue = '';
        let severity: 'high' | 'medium' = 'medium';
        if (hasNoActivity) {
          issue = 'Belum memulai sesi baca materi sama sekali';
          severity = 'high';
        } else if (hasPausedLong) {
          issue = 'Sesi baca materi terjeda > 3 menit & belum selesai';
          severity = 'medium';
        } else if (missingAssignment) {
          issue = 'Belum mengumpulkan tugas aktif sesuai jadwal';
          severity = 'medium';
        }

        return {
          student: std,
          className: cls?.name || '-',
          issue,
          severity,
        };
      })
      .filter((item) => item.issue !== '');
  }, [filteredStudents, classes, readingSessions, submissions, assignments]);

  const filteredLogs = useMemo(() => {
    if (activityFilter === 'all') return auditLogs.slice(0, 7);
    return auditLogs.filter((l) => l.category === activityFilter).slice(0, 7);
  }, [auditLogs, activityFilter]);

  return (
    <div className="space-y-6">
      {/* Header & Filter Bar */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E5E9E3]">
          <div>
            <h1 className="text-xl font-bold text-[#202923]">
              Ringkasan Eksekutif & Pemantauan Akademik
            </h1>
            <p className="text-xs text-[#68736B] mt-0.5">
              Klik kartu statistik di bawah untuk membuka halaman detail dengan filter yang sesuai.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigateAdmin('monitoring')}
              className="px-3.5 py-2 text-xs font-semibold text-[#276749] bg-[#E5F3E8] border border-[#48A878]/30 rounded-lg hover:bg-[#cbe6d2] transition-colors whitespace-nowrap"
            >
              Buka Monitoring Real-Time
            </button>
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#276749] hover:bg-[#1F513A] rounded-lg transition-colors whitespace-nowrap shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Laporan</span>
            </button>
          </div>
        </div>

        {/* 5 Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-4">
          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Periode Evaluasi
            </label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-medium"
            >
              <option value="today">Hari Ini (1 Okt 2026)</option>
              <option value="7d">7 Hari Terakhir</option>
              <option value="30d">Semester Ganjil (30 Hari)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Filter Kelas
            </label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-medium"
            >
              <option value="all">Semua Kelas ({classes.length})</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Guru Pengampu
            </label>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-medium"
            >
              <option value="all">Semua Guru ({teachers.length})</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Materi Pembelajaran
            </label>
            <select
              value={materialFilter}
              onChange={(e) => setMaterialFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-medium"
            >
              <option value="all">Semua Materi ({materials.length})</option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.subject} — {m.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-[#68736B] mb-1">
              Kategori Log Aktivitas
            </label>
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] font-medium"
            >
              <option value="all">Semua Aktivitas</option>
              <option value="reading_session">Sesi Membaca Materi</option>
              <option value="grade">Penilaian & Revisi Nilai</option>
              <option value="schedule">Perubahan Jadwal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Baris 1: Kartu Statistik Utama (Forest Styled Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigateAdmin('students', { classId: classFilter })}
          className="text-left bg-white border border-[#E5E9E3] rounded-xl p-4 hover:border-[#48A878] hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#68736B]">
            <span>Total Siswa & Kelas</span>
            <Users className="w-4 h-4 text-[#276749] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#202923]">
              {filteredStudents.length}
            </span>
            <span className="text-xs text-[#68736B]">
              Siswa · {classes.length} Kelas
            </span>
          </div>
          <div className="mt-2 text-xs text-[#68736B] flex items-center justify-between pt-2 border-t border-[#E5E9E3]">
            <span>
              Aktif: <strong className="font-mono text-[#276749]">{studentsWithAnySession.size}</strong> ·
              Belum: <strong className="font-mono text-[#D99A2B]">{notStartedStudentCount}</strong>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#858D86]" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateAdmin('monitoring', { classId: classFilter, status: 'active' })}
          className="text-left bg-white border border-[#E5E9E3] rounded-xl p-4 hover:border-[#48A878] hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#68736B]">
            <span>Status Sesi Membaca Materi</span>
            <BookOpen className="w-4 h-4 text-[#2F855A] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#202923]">
              {filteredMaterials.length}
            </span>
            <span className="text-xs text-[#68736B]">Materi Terdaftar</span>
          </div>
          <div className="mt-2 text-xs text-[#68736B] flex items-center justify-between pt-2 border-t border-[#E5E9E3]">
            <span>
              Membaca: <strong className="font-mono text-[#276749]">{activeReadingCount}</strong> ·
              Dijeda: <strong className="font-mono text-[#D99A2B]">{pausedReadingCount}</strong> ·
              Tuntas: <strong className="font-mono text-[#2F855A]">{completedReadingCount}</strong>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#858D86]" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateAdmin('assignments', { classId: classFilter })}
          className="text-left bg-white border border-[#E5E9E3] rounded-xl p-4 hover:border-[#48A878] hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#68736B]">
            <span>Pengumpulan & Penilaian Tugas</span>
            <FileText className="w-4 h-4 text-[#276749] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#202923]">
              {assignments.length}
            </span>
            <span className="text-xs text-[#68736B]">Tugas Aktif</span>
          </div>
          <div className="mt-2 text-xs text-[#68736B] flex items-center justify-between pt-2 border-t border-[#E5E9E3]">
            <span>
              Dinilai: <strong className="font-mono text-[#2F855A]">{gradedSubCount}</strong> ·
              Dikumpul: <strong className="font-mono text-[#276749]">{submittedPendingCount}</strong> ·
              Belum: <strong className="font-mono text-[#D99A2B]">{unsubmittedCount}</strong>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#858D86]" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => navigateAdmin('quizzes', { classId: classFilter })}
          className="text-left bg-white border border-[#E5E9E3] rounded-xl p-4 hover:border-[#48A878] hover:shadow-xs transition-all group cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-[#68736B]">
            <span>Evaluasi Kuis Terjadwal</span>
            <HelpCircle className="w-4 h-4 text-[#276749] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-[#202923]">
              {quizzes.length}
            </span>
            <span className="text-xs text-[#68736B]">Paket Kuis</span>
          </div>
          <div className="mt-2 text-xs text-[#68736B] flex items-center justify-between pt-2 border-t border-[#E5E9E3]">
            <span>
              Berjalan:{' '}
              <strong className="font-mono text-[#276749]">{inProgressQuizCount}</strong> · Selesai:{' '}
              <strong className="font-mono text-[#2F855A]">{completedQuizCount}</strong>
            </span>
            <ArrowUpRight className="w-3.5 h-3.5 text-[#858D86]" />
          </div>
        </button>
      </div>

      {/* Baris 2: Grafik Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202923]">
                Tren Penyelesaian & Aktivitas Materi
              </h2>
              <p className="text-xs text-[#68736B] mt-0.5">
                Pemantauan tren tuntas materi dan keterlibatan aktif siswa
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateAdmin('monitoring')}
              className="text-xs font-semibold text-[#276749] hover:underline shrink-0"
            >
              Lihat Monitoring
            </button>
          </div>
          
          <MaterialCompletionTrendChart
            readingSessions={filteredSessions}
            classes={classes}
            materials={filteredMaterials}
            selectedClassId={classFilter}
            periodFilter={periodFilter}
          />
        </div>

        <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-[#202923]">
                Distribusi Capaian Nilai (Tugas & Kuis)
              </h2>
              <p className="text-xs text-[#68736B] mt-0.5">
                Sebaran capaian nilai terhadap Kriteria Ketuntasan Minimal (KKM 75)
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigateAdmin('grades')}
              className="text-xs font-semibold text-[#276749] hover:underline shrink-0"
            >
              Buka Buku Nilai
            </button>
          </div>

          <GradeDistributionChart
            submissions={filteredSubmissions}
            quizAttempts={filteredQuizAttempts}
            selectedClassId={classFilter}
          />
        </div>
      </div>

      {/* Baris 3: Siswa Membutuhkan Tindak Lanjut & Timeline Aktivitas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E5E9E3] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#202923] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#D99A2B]" />
                <span>Daftar Siswa yang Membutuhkan Tindak Lanjut ({followUpStudents.length})</span>
              </h2>
              <p className="text-xs text-[#68736B]">
                Siswa yang belum memulai belajar, menjeda materi terlalu lama, atau belum mengumpulkan tugas
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#E5E9E3] text-[#68736B] bg-[#F7F7F2]">
                  <th className="py-2.5 px-3 font-semibold">Nama Siswa</th>
                  <th className="py-2.5 px-3 font-semibold">Kelas</th>
                  <th className="py-2.5 px-3 font-semibold">Indikasi / Catatan</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9E3]">
                {followUpStudents.slice(0, 6).map(({ student, className, issue, severity }) => (
                  <tr key={student.id} className="hover:bg-[#E5F3E8]/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-[#202923]">
                      {student.name}
                      <div className="text-[11px] font-mono text-[#68736B]">
                        NIS: {student.nis}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-[#68736B]">{className}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={
                          severity === 'high'
                            ? 'text-[#D9534F] font-semibold'
                            : 'text-[#D99A2B] font-semibold'
                        }
                      >
                        {severity === 'high' ? '▲ Prioritas: ' : '● Perhatian: '}
                        {issue}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setDetailStudentId(student.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-[#276749] bg-[#E5F3E8] hover:bg-[#cbe6d2] rounded-md transition-colors"
                      >
                        Periksa Sesi
                      </button>
                    </td>
                  </tr>
                ))}
                {followUpStudents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#858D86]">
                      Seluruh siswa dalam filter ini telah mengikuti pembelajaran sesuai jadwal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Timeline Aktivitas Terbaru */}
        <div className="lg:col-span-5 bg-white border border-[#E5E9E3] rounded-xl p-5 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#202923]">
                Timeline Aktivitas Terbaru
              </h2>
              <p className="text-xs text-[#68736B]">
                Jejak audit sesi baca, penilaian, dan perubahan jadwal
              </p>
            </div>
            <Filter className="w-4 h-4 text-[#858D86]" />
          </div>

          <div className="space-y-3">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-start gap-3 pb-3 border-b border-[#E5E9E3] last:border-0 last:pb-0"
              >
                <div className="w-2 h-2 rounded-full bg-[#276749] mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#202923] truncate">
                      {log.action}
                    </span>
                    <span className="text-[11px] font-mono text-[#68736B] shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-[#202923] font-medium truncate">
                    {log.targetName}
                  </div>
                  <div className="text-[11px] text-[#68736B] mt-0.5">{log.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Detail Siswa & Ekspor */}
      <StudentProgressDetailModal
        studentId={detailStudentId}
        onClose={() => setDetailStudentId(null)}
      />
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        initialClassId={classFilter}
      />
    </div>
  );
};
