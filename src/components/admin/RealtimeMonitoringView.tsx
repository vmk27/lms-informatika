import React, { useState, useMemo } from 'react';
import {
  Search,
  Radio,
  Download,
  ArrowUpDown,
  Eye,
  Clock,
  CheckCircle2,
  PauseCircle,
  AlertCircle,
  Play,
  Pause,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { StudentProgressDetailModal } from '../common/StudentProgressDetailModal';
import { ExportReportModal } from '../common/ExportReportModal';

export const RealtimeMonitoringView: React.FC = () => {
  const {
    users,
    classes,
    materials,
    readingSessions,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    navFilter,
    isOnline,
    isDemoRealtimeActive,
    setDemoRealtimeActive,
    lastRealtimeSyncAt,
  } = useLms();

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>(navFilter.classId || 'all');
  const [materialFilter, setMaterialFilter] = useState<string>(
    navFilter.materialId || 'mat-fis-termo'
  );
  const [statusFilter, setStatusFilter] = useState<string>(navFilter.status || 'all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'duration' | 'status'>('progress');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const pageSize = 8;

  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);

  const activeMaterial =
    materials.find((m) => m.id === materialFilter) || materials[0];

  const rows = useMemo(() => {
    const students = users.filter((u) => u.role === 'student');
    return students
      .filter((st) => {
        if (classFilter !== 'all' && st.classId !== classFilter) return false;
        if (
          searchQuery.trim() &&
          !st.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(st.nis || '').includes(searchQuery)
        ) {
          return false;
        }
        return true;
      })
      .map((st) => {
        const cls = classes.find((c) => c.id === st.classId);
        const session = readingSessions.find(
          (s) =>
            s.student_id === st.id &&
            (materialFilter === 'all' || s.material_id === materialFilter)
        );
        const mat =
          materials.find((m) => m.id === (session?.material_id || materialFilter)) ||
          activeMaterial;

        const minReadSec = (mat?.minReadMinutes || 15) * 60;
        const activeSec = session?.active_duration_seconds ?? 0;
        const pausedSec = session?.paused_duration_seconds ?? 0;
        const progressPct = Math.min(
          100,
          Math.round((activeSec / Math.max(1, minReadSec)) * 100)
        );
        const status = session?.completion_status || 'not_started';

        // Tugas & Kuis terkait materi
        const relatedAsg = assignments.find((a) => a.materialId === mat?.id);
        const sub = relatedAsg
          ? submissions.find(
              (s) => s.assignmentId === relatedAsg.id && s.studentId === st.id
            )
          : undefined;

        const relatedQuiz = quizzes.find((q) => q.materialId === mat?.id);
        const qzAtt = relatedQuiz
          ? quizAttempts.find(
              (a) => a.quizId === relatedQuiz.id && a.studentId === st.id
            )
          : undefined;

        return {
          student: st,
          className: cls?.name || '-',
          materialTitle: mat?.title || '-',
          minReadMinutes: mat?.minReadMinutes || 15,
          activeSec,
          pausedSec,
          progressPct,
          status,
          lastHeartbeatAt: session?.last_heartbeat_at || st.lastActiveAt,
          syncStatus: session?.sync_status || 'synced',
          assignmentStatus: sub?.status || 'not_submitted',
          assignmentScore: sub?.score ?? null,
          quizStatus: qzAtt?.status || 'not_started',
          quizScore: qzAtt?.score ?? null,
        };
      })
      .filter((r) => {
        if (statusFilter !== 'all' && r.status !== statusFilter) return false;
        if (dateFilter && !r.lastHeartbeatAt.startsWith(dateFilter)) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'name') cmp = a.student.name.localeCompare(b.student.name);
        else if (sortBy === 'progress') cmp = a.progressPct - b.progressPct;
        else if (sortBy === 'duration') cmp = a.activeSec - b.activeSec;
        else cmp = a.status.localeCompare(b.status);
        return sortAsc ? cmp : -cmp;
      });
  }, [
    users,
    classes,
    readingSessions,
    materials,
    activeMaterial,
    classFilter,
    materialFilter,
    statusFilter,
    dateFilter,
    searchQuery,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    sortBy,
    sortAsc,
  ]);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = rows.slice((page - 1) * pageSize, page * pageSize);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else {
      setSortBy(col);
      setSortAsc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner Status Simulasi Demo (Wajib sesuai Bagian I) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900">
                Monitoring Belajar Siswa Real-Time
              </h1>
              <span className="text-xs font-mono font-semibold text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-0.5 rounded-md">
                MODE SIMULASI DEMO — BUKAN REALTIME SERVER
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Memantau akumulasi waktu aktif membaca (Page Visibility API), status jeda tab,
              penyelesaian checkpoint, serta progres tugas dan kuis siswa. Adapter Supabase
              Realtime siap dihubungkan pada Tahap 2.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-slate-600 font-mono bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg flex items-center gap-2">
              <Radio
                className={`w-4 h-4 ${
                  isOnline && isDemoRealtimeActive
                    ? 'text-emerald-600 animate-pulse'
                    : 'text-slate-400'
                }`}
              />
              <div>
                <div className="font-semibold text-slate-800">
                  {isOnline
                    ? isDemoRealtimeActive
                      ? 'Detak Simulasi: Aktif (Tiap 5d)'
                      : 'Detak Simulasi: Dijeda'
                    : 'Koneksi: Terputus (Offline)'}
                </div>
                <div className="text-[11px] text-slate-500">
                  Pembaruan terakhir:{' '}
                  {new Date(lastRealtimeSyncAt).toLocaleTimeString('id-ID')}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDemoRealtimeActive(!isDemoRealtimeActive)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              {isDemoRealtimeActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  <span>Jeda Simulasi</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Lanjutkan Simulasi</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Ekspor Data Filter</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-200">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Cari nama atau NIS siswa..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={materialFilter}
            onChange={(e) => {
              setMaterialFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">Semua Materi</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.subject} — {m.title}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">Semua Status Belajar</option>
            <option value="active">Sedang Membaca (Aktif)</option>
            <option value="paused">Dijeda (Tab Tersembunyi)</option>
            <option value="completed">Telah Selesai</option>
            <option value="not_started">Belum Mulai</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          />
        </div>
      </div>

      {/* Ringkasan Progress per Kelas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classes.map((cls) => {
          const clsStudents = users.filter(
            (u) => u.role === 'student' && u.classId === cls.id
          );
          const doneCount = clsStudents.filter((st) =>
            readingSessions.some(
              (s) =>
                s.student_id === st.id &&
                (materialFilter === 'all' || s.material_id === materialFilter) &&
                s.completion_status === 'completed'
            )
          ).length;
          const activeCount = clsStudents.filter((st) =>
            readingSessions.some(
              (s) =>
                s.student_id === st.id &&
                (materialFilter === 'all' || s.material_id === materialFilter) &&
                s.completion_status === 'active'
            )
          ).length;
          const pct =
            clsStudents.length > 0
              ? Math.round((doneCount / clsStudents.length) * 100)
              : 0;

          return (
            <div
              key={cls.id}
              className="bg-white border border-slate-200 rounded-xl p-4 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-900">{cls.name}</span>
                <span className="font-mono text-slate-500">
                  {doneCount}/{clsStudents.length} Selesai
                </span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-500 flex justify-between">
                <span>Sedang membaca: {activeCount} siswa</span>
                <span className="font-mono font-semibold text-slate-700">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabel Utama Monitoring Real-Time */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[980px]">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-4 w-56">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors font-bold uppercase"
                  >
                    <span>Siswa & Kelas</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 min-w-[180px]">Materi Terbuka</th>
                <th className="py-3 px-4 w-44">
                  <button
                    type="button"
                    onClick={() => toggleSort('progress')}
                    className="inline-flex items-center gap-1.5 hover:text-slate-900 transition-colors font-bold uppercase"
                  >
                    <span>Progress Baca</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 w-36 text-center">
                  <button
                    type="button"
                    onClick={() => toggleSort('duration')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-slate-900 transition-colors font-bold uppercase w-full"
                  >
                    <span>Waktu Aktif</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 w-36 text-center">
                  <button
                    type="button"
                    onClick={() => toggleSort('status')}
                    className="inline-flex items-center justify-center gap-1.5 hover:text-slate-900 transition-colors font-bold uppercase w-full"
                  >
                    <span>Status Sesi</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-4 w-36 text-center">Sinkronisasi</th>
                <th className="py-3 px-4 w-36 text-center">Tugas & Kuis</th>
                <th className="py-3 px-4 w-32 text-right">Aksi & Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    Tidak ada data siswa yang cocok dengan filter aktif.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((row) => (
                  <tr
                    key={row.student.id}
                    className="hover:bg-blue-50/40 transition-colors group"
                  >
                    {/* Kolom 1: Nama & Siswa */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors truncate max-w-[200px]">
                        {row.student.name}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-slate-700">{row.className}</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-mono text-slate-500 tabular-nums">
                          {row.student.nis || '-'}
                        </span>
                      </div>
                    </td>

                    {/* Kolom 2: Materi */}
                    <td className="py-3.5 px-4 align-middle">
                      <div
                        className="font-medium text-slate-800 truncate max-w-[200px]"
                        title={row.materialTitle}
                      >
                        {row.materialTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Target: {row.minReadMinutes} menit</span>
                      </div>
                    </td>

                    {/* Kolom 3: Progress Bar */}
                    <td className="py-3.5 px-4 align-middle">
                      <div className="flex justify-between items-center font-mono text-[11px] mb-1.5 tabular-nums">
                        <span className="font-bold text-slate-800">{row.progressPct}%</span>
                        <span className="text-[10px] text-slate-400">
                          Jeda: {Math.floor(row.pausedSec / 60)}m
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 p-0.5">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            row.status === 'completed'
                              ? 'bg-emerald-500'
                              : row.status === 'paused'
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                          style={{ width: `${row.progressPct}%` }}
                        />
                      </div>
                    </td>

                    {/* Kolom 4: Waktu Aktif */}
                    <td className="py-3.5 px-4 align-middle text-center font-mono tabular-nums">
                      <div className="font-bold text-slate-900 text-xs">
                        {Math.floor(row.activeSec / 60)}m{' '}
                        {String(row.activeSec % 60).padStart(2, '0')}d
                      </div>
                      <div className="text-[10px] text-slate-400">/ {row.minReadMinutes}m target</div>
                    </td>

                    {/* Kolom 5: Status Sesi Badge */}
                    <td className="py-3.5 px-4 align-middle text-center">
                      {row.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Selesai
                        </span>
                      )}
                      {row.status === 'active' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Clock className="w-3.5 h-3.5 text-blue-600 animate-pulse" /> Membaca
                        </span>
                      )}
                      {row.status === 'paused' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <PauseCircle className="w-3.5 h-3.5 text-amber-600" /> Dijeda
                        </span>
                      )}
                      {row.status === 'not_started' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <AlertCircle className="w-3.5 h-3.5 text-slate-400" /> Belum Mulai
                        </span>
                      )}
                    </td>

                    {/* Kolom 6: Sinkronisasi */}
                    <td className="py-3.5 px-4 align-middle text-center font-mono text-[11px] tabular-nums text-slate-600">
                      <div className="font-semibold text-slate-800">
                        {new Date(row.lastHeartbeatAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {row.syncStatus === 'synced' ? 'Tersinkron' : 'Antrean'}
                      </div>
                    </td>

                    {/* Kolom 7: Status Tugas & Kuis */}
                    <td className="py-3.5 px-4 align-middle text-center text-[11px]">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                            row.assignmentStatus === 'graded'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.assignmentStatus === 'submitted'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          Tgs: {row.assignmentScore ?? (row.assignmentStatus === 'submitted' ? '✓' : '-')}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                            row.quizStatus === 'completed'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.quizStatus === 'in_progress'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          Kuis: {row.quizScore ?? '-'}
                        </span>
                      </div>
                    </td>

                    {/* Kolom 8: Aksi */}
                    <td className="py-3.5 px-4 align-middle text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedStudentId(row.student.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/60 rounded-lg transition-colors shadow-2xs"
                        title="Lihat Log & Portofolio Siswa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginasi Presisi */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">
              Menampilkan {paginatedRows.length} dari {rows.length} siswa
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-[11px] text-slate-500">
              Halaman {page} dari {totalPages}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
            >
              Sebelumnya
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
            >
              Berikutnya
            </button>
          </div>
        </div>
      </div>

      <StudentProgressDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        initialReportType="reading_progress"
        initialClassId={classFilter}
      />
    </div>
  );
};
