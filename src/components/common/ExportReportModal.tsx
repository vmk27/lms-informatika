import React, { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, FileText, CheckSquare, Square } from 'lucide-react';
import { ModalShell } from './ModalShell';
import { useLms } from '../../context/LmsContext';
import { exportToPdf, exportToXlsx, exportToCsv } from '../../services/exportService';

export type ReportTypeId =
  | 'reading_progress'
  | 'student_activity'
  | 'assignment_recap'
  | 'quiz_results'
  | 'grade_recap'
  | 'class_recap'
  | 'individual_history';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReportType?: ReportTypeId;
  initialClassId?: string;
  initialStudentId?: string;
}

const REPORT_TYPES: { id: ReportTypeId; label: string; subtitle: string }[] = [
  {
    id: 'reading_progress',
    label: '1. Laporan Progress Membaca Materi',
    subtitle: 'Rekapitulasi waktu baca aktif, jeda, checkpoint, dan status penyelesaian materi',
  },
  {
    id: 'student_activity',
    label: '2. Laporan Aktivitas Belajar Siswa',
    subtitle: 'Log aktivitas pembelajaran, sinkronisasi sesi, dan interaksi siswa',
  },
  {
    id: 'assignment_recap',
    label: '3. Rekap Pengumpulan & Penilaian Tugas',
    subtitle: 'Status pengumpulan, keterlambatan, nilai tugas, dan umpan balik guru',
  },
  {
    id: 'quiz_results',
    label: '4. Laporan Hasil Evaluasi Kuis',
    subtitle: 'Skor kuis, jumlah percobaan, waktu pengerjaan, dan ketuntasan',
  },
  {
    id: 'grade_recap',
    label: '5. Rekap Buku Nilai Akhir Siswa',
    subtitle: 'Perhitungan nilai materi, tugas, kuis, dan nilai akhir sesuai bobot KKM',
  },
  {
    id: 'class_recap',
    label: '6. Rekapitulasi Capaian per Kelas',
    subtitle: 'Ringkasan rata-rata penyelesaian materi, pengumpulan tugas, dan nilai per kelas',
  },
  {
    id: 'individual_history',
    label: '7. Riwayat Pembelajaran Individual Siswa',
    subtitle: 'Portofolio lengkap capaian materi, tugas, dan kuis per individu siswa',
  },
];

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  initialReportType = 'reading_progress',
  initialClassId = 'all',
  initialStudentId = 'all',
}) => {
  const {
    users,
    classes,
    materials,
    readingSessions,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    gradeWeights,
    auditLogs,
    settings,
    addToast,
  } = useLms();

  const [reportType, setReportType] = useState<ReportTypeId>(initialReportType);
  const [classFilter, setClassFilter] = useState<string>(initialClassId);
  const [studentFilter, setStudentFilter] = useState<string>(initialStudentId);
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('2026-09-01');
  const [dateTo, setDateTo] = useState<string>('2026-10-31');
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');
  const [includeSignature, setIncludeSignature] = useState<boolean>(true);
  const [excludedColIndices, setExcludedColIndices] = useState<number[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const students = useMemo(
    () =>
      users.filter(
        (u) =>
          u.role === 'student' &&
          (classFilter === 'all' || u.classId === classFilter) &&
          (studentFilter === 'all' || u.id === studentFilter)
      ),
    [users, classFilter, studentFilter]
  );

  // Bangun tabel berdasarkan jenis laporan
  const { allHeaders, allRows } = useMemo(() => {
    const getClassName = (cid?: string) =>
      classes.find((c) => c.id === cid)?.name || '-';

    if (reportType === 'reading_progress') {
      const headers = [
        'Nama Siswa',
        'NIS',
        'Kelas',
        'Judul Materi',
        'Mapel',
        'Min. Baca',
        'Waktu Aktif',
        'Progress (%)',
        'Status',
      ];
      const rows: (string | number)[][] = [];
      students.forEach((std) => {
        const targetMats = materials.filter(
          (m) =>
            (materialFilter === 'all' || m.id === materialFilter) &&
            (!std.classId || m.classIds.includes(std.classId))
        );
        targetMats.forEach((mat) => {
          const ses = readingSessions.find(
            (s) => s.student_id === std.id && s.material_id === mat.id
          );
          const activeSec = ses?.active_duration_seconds ?? 0;
          const minSec = mat.minReadMinutes * 60;
          const pct = Math.min(100, Math.round((activeSec / Math.max(1, minSec)) * 100));
          const statusMap: Record<string, string> = {
            completed: 'Selesai',
            active: 'Sedang Membaca',
            paused: 'Dijeda',
            not_started: 'Belum Mulai',
          };
          rows.push([
            std.name,
            std.nis || '-',
            getClassName(std.classId),
            mat.title,
            mat.subject,
            `${mat.minReadMinutes} mnt`,
            `${Math.floor(activeSec / 60)}m ${activeSec % 60}d`,
            `${pct}%`,
            statusMap[ses?.completion_status || 'not_started'],
          ]);
        });
      });
      return { allHeaders: headers, allRows: rows };
    }

    if (reportType === 'assignment_recap') {
      const headers = [
        'Nama Siswa',
        'NIS',
        'Kelas',
        'Judul Tugas',
        'Mapel',
        'Status Pengumpulan',
        'Waktu Kirim',
        'Nilai',
        'Umpan Balik Guru',
      ];
      const rows: (string | number)[][] = [];
      students.forEach((std) => {
        assignments
          .filter((a) => !std.classId || a.classIds.includes(std.classId))
          .forEach((asg) => {
            const sub = submissions.find(
              (s) => s.assignmentId === asg.id && s.studentId === std.id
            );
            rows.push([
              std.name,
              std.nis || '-',
              getClassName(std.classId),
              asg.title,
              asg.subject,
              sub?.status === 'graded'
                ? 'Telah Dinilai'
                : sub?.status === 'submitted'
                ? 'Sudah Mengumpulkan'
                : sub?.status === 'late'
                ? 'Terlambat'
                : 'Belum Mengumpulkan',
              sub?.submittedAt
                ? new Date(sub.submittedAt).toLocaleString('id-ID')
                : '-',
              sub?.score ?? 'Belum Dinilai',
              sub?.teacherFeedback || '-',
            ]);
          });
      });
      return { allHeaders: headers, allRows: rows };
    }

    if (reportType === 'quiz_results') {
      const headers = [
        'Nama Siswa',
        'NIS',
        'Kelas',
        'Judul Kuis',
        'Mapel',
        'Percobaan Ke',
        'Status',
        'Skor Akhir',
        'Waktu Selesai',
      ];
      const rows: (string | number)[][] = [];
      students.forEach((std) => {
        quizzes
          .filter((q) => !std.classId || q.classIds.includes(std.classId))
          .forEach((qz) => {
            const att = quizAttempts.find(
              (a) => a.quizId === qz.id && a.studentId === std.id
            );
            rows.push([
              std.name,
              std.nis || '-',
              getClassName(std.classId),
              qz.title,
              qz.subject,
              att?.attemptNumber ?? 0,
              att?.status === 'completed'
                ? 'Selesai'
                : att?.status === 'in_progress'
                ? 'Sedang Mengerjakan'
                : 'Belum Mulai',
              att?.score ?? '-',
              att?.submittedAt
                ? new Date(att.submittedAt).toLocaleString('id-ID')
                : '-',
            ]);
          });
      });
      return { allHeaders: headers, allRows: rows };
    }

    if (reportType === 'grade_recap') {
      const headers = [
        'Nama Siswa',
        'NIS',
        'Kelas',
        `Skor Materi (${gradeWeights.materialCompletionWeight}%)`,
        `Rata-rata Tugas (${gradeWeights.assignmentWeight}%)`,
        `Rata-rata Kuis (${gradeWeights.quizWeight}%)`,
        'Nilai Akhir',
        `Status KKM (${gradeWeights.passingGrade})`,
      ];
      const rows: (string | number)[][] = [];
      students.forEach((std) => {
        const classMats = materials.filter(
          (m) => !std.classId || m.classIds.includes(std.classId)
        );
        const completedCount = classMats.filter((m) =>
          readingSessions.some(
            (s) =>
              s.student_id === std.id &&
              s.material_id === m.id &&
              s.completion_status === 'completed'
          )
        ).length;
        const matScore =
          classMats.length > 0 ? Math.round((completedCount / classMats.length) * 100) : 100;

        const stdSubs = submissions.filter(
          (s) => s.studentId === std.id && s.score !== null
        );
        const asgScore =
          stdSubs.length > 0
            ? Math.round(
                stdSubs.reduce((a, b) => a + (b.score || 0), 0) / stdSubs.length
              )
            : 0;

        const stdQuizzes = quizAttempts.filter(
          (a) => a.studentId === std.id && a.score !== null
        );
        const qzScore =
          stdQuizzes.length > 0
            ? Math.round(
                stdQuizzes.reduce((a, b) => a + (b.score || 0), 0) / stdQuizzes.length
              )
            : 0;

        const finalScore = Math.round(
          (matScore * gradeWeights.materialCompletionWeight +
            asgScore * gradeWeights.assignmentWeight +
            qzScore * gradeWeights.quizWeight) /
            100
        );

        rows.push([
          std.name,
          std.nis || '-',
          getClassName(std.classId),
          matScore,
          asgScore,
          qzScore,
          finalScore,
          finalScore >= gradeWeights.passingGrade ? 'Tuntas' : 'Perlu Remedial',
        ]);
      });
      return { allHeaders: headers, allRows: rows };
    }

    if (reportType === 'class_recap') {
      const headers = [
        'Kode Kelas',
        'Nama Kelas',
        'Tingkat',
        'Wali Kelas',
        'Jumlah Siswa',
        'Materi Tayang',
        'Rata-rata Penyelesaian Baca',
      ];
      const rows: (string | number)[][] = classes
        .filter((c) => classFilter === 'all' || c.id === classFilter)
        .map((cls) => {
          const clsStudents = users.filter(
            (u) => u.role === 'student' && u.classId === cls.id
          );
          const clsMats = materials.filter((m) => m.classIds.includes(cls.id));
          let totalPairs = clsStudents.length * Math.max(1, clsMats.length);
          let donePairs = 0;
          clsStudents.forEach((st) => {
            clsMats.forEach((mt) => {
              if (
                readingSessions.some(
                  (s) =>
                    s.student_id === st.id &&
                    s.material_id === mt.id &&
                    s.completion_status === 'completed'
                )
              ) {
                donePairs++;
              }
            });
          });
          const pct = Math.round((donePairs / totalPairs) * 100);
          return [
            cls.code,
            cls.name,
            cls.gradeLevel,
            cls.homeroomTeacherName,
            clsStudents.length,
            clsMats.length,
            `${pct}%`,
          ];
        });
      return { allHeaders: headers, allRows: rows };
    }

    if (reportType === 'individual_history') {
      const headers = [
        'Nama Siswa',
        'Kelas',
        'Jenis Aktivitas',
        'Judul Item',
        'Status / Capaian',
        'Waktu Tercatat',
      ];
      const rows: (string | number)[][] = [];
      students.forEach((std) => {
        readingSessions
          .filter((s) => s.student_id === std.id)
          .forEach((s) => {
            const mat = materials.find((m) => m.id === s.material_id);
            rows.push([
              std.name,
              getClassName(std.classId),
              'Sesi Baca Materi',
              mat?.title || s.material_id,
              `${s.completion_status.toUpperCase()} (${Math.floor(
                s.active_duration_seconds / 60
              )}m aktif)`,
              new Date(s.last_heartbeat_at).toLocaleString('id-ID'),
            ]);
          });
        submissions
          .filter((sub) => sub.studentId === std.id)
          .forEach((sub) => {
            const asg = assignments.find((a) => a.id === sub.assignmentId);
            rows.push([
              std.name,
              getClassName(std.classId),
              'Pengumpulan Tugas',
              asg?.title || sub.assignmentId,
              `Nilai: ${sub.score ?? 'Menunggu Penilaian'}`,
              sub.submittedAt
                ? new Date(sub.submittedAt).toLocaleString('id-ID')
                : '-',
            ]);
          });
      });
      return { allHeaders: headers, allRows: rows };
    }

    // Default: student_activity
    const headers = ['Waktu', 'Pelaku', 'Role', 'Tindakan', 'Target', 'Rincian Aktivitas'];
    const rows = auditLogs.map((log) => [
      new Date(log.timestamp).toLocaleString('id-ID'),
      log.actorName,
      log.actorRole,
      log.action,
      log.targetName,
      log.details,
    ]);
    return { allHeaders: headers, allRows: rows };
  }, [
    reportType,
    students,
    classes,
    materials,
    materialFilter,
    readingSessions,
    assignments,
    submissions,
    quizzes,
    quizAttempts,
    gradeWeights,
    classFilter,
    auditLogs,
    users,
  ]);

  const toggleColumn = (idx: number) => {
    setExcludedColIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const activeColIndices = allHeaders
    .map((_, idx) => idx)
    .filter((idx) => !excludedColIndices.includes(idx));

  const finalHeaders = activeColIndices.map((i) => allHeaders[i]);
  const finalRows = allRows.map((r) => activeColIndices.map((i) => r[i]));

  const handleExport = () => {
    if (finalHeaders.length === 0) {
      addToast({
        type: 'error',
        title: 'Pilih Minimal 1 Kolom',
        description: 'Anda harus menyertakan setidaknya satu kolom tabel untuk diekspor.',
      });
      return;
    }

    setIsExporting(true);
    setTimeout(() => {
      const meta = REPORT_TYPES.find((r) => r.id === reportType)!;
      const payload = {
        reportTitle: meta.label.replace(/^\d+\.\s*/, ''),
        reportSubtitle: meta.subtitle,
        periodLabel: `${dateFrom} s/d ${dateTo}`,
        filenameBase: `Laporan_${reportType}_${dateFrom}_${dateTo}`,
        headers: finalHeaders,
        rows: finalRows,
        includeSignatureBlock: includeSignature,
        schoolSettings: settings,
      };

      if (format === 'pdf') exportToPdf(payload);
      else if (format === 'xlsx') exportToXlsx(payload);
      else exportToCsv(payload);

      setIsExporting(false);
      addToast({
        type: 'success',
        title: `Berkas ${format.toUpperCase()} Berhasil Diunduh`,
        description: `${payload.filenameBase}.${format} (${finalRows.length} baris data).`,
      });
      onClose();
    }, 300);
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      title="Ekspor & Cetak Laporan Akademik"
      description="Konfigurasi filter, kolom tabel, pratinjau langsung, dan format unduhan dokumen resmi."
      maxWidthClass="max-w-5xl"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting
                ? 'Menyiapkan Berkas...'
                : `Ekspor ${format.toUpperCase()} (${finalRows.length} Baris)`}
            </span>
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Jenis Laporan */}
        <div className="md:col-span-2">
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Jenis Laporan <span className="text-red-600">*</span>
          </label>
          <select
            value={reportType}
            onChange={(e) => {
              setReportType(e.target.value as ReportTypeId);
              setExcludedColIndices([]);
            }}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            {REPORT_TYPES.map((rt) => (
              <option key={rt.id} value={rt.id}>
                {rt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Format Ekspor */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Format Berkas <span className="text-red-600">*</span>
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-lg">
            {(['pdf', 'xlsx', 'csv'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormat(fmt)}
                className={`py-1.5 px-2 text-xs font-semibold uppercase rounded-md transition-colors flex items-center justify-center gap-1 ${
                  format === fmt
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {fmt === 'pdf' ? (
                  <FileText className="w-3.5 h-3.5" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>{fmt}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Kelas */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Filter Kelas</label>
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setStudentFilter('all');
            }}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Siswa */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Filter Siswa</label>
          <select
            value={studentFilter}
            onChange={(e) => setStudentFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
          >
            <option value="all">Semua Siswa</option>
            {users
              .filter(
                (u) =>
                  u.role === 'student' &&
                  (classFilter === 'all' || u.classId === classFilter)
              )
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.nis})
                </option>
              ))}
          </select>
        </div>

        {/* Filter Materi */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Materi / Mata Pelajaran
          </label>
          <select
            value={materialFilter}
            onChange={(e) => setMaterialFilter(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
          >
            <option value="all">Semua Materi</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.subject} — {m.title}
              </option>
            ))}
          </select>
        </div>

        {/* Rentang Tanggal */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Dari Tanggal</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Sampai Tanggal</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg font-mono"
          />
        </div>

        {/* Opsi Tanda Tangan PDF */}
        <div className="flex items-end pb-2">
          <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeSignature}
              onChange={(e) => setIncludeSignature(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Sertakan Kop Sekolah & Blok Tanda Tangan Kepala Sekolah (PDF)</span>
          </label>
        </div>
      </div>

      {/* Pilihan Kolom */}
      <div className="border-t border-slate-200 pt-3">
        <div className="text-xs font-medium text-slate-700 mb-2">
          Kolom yang Disertakan dalam Berkas Ekspor:
        </div>
        <div className="flex flex-wrap gap-2">
          {allHeaders.map((hdr, idx) => {
            const included = !excludedColIndices.includes(idx);
            return (
              <button
                key={hdr}
                type="button"
                onClick={() => toggleColumn(idx)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  included
                    ? 'bg-blue-50 border-blue-200 text-blue-800 font-medium'
                    : 'bg-white border-slate-200 text-slate-400'
                }`}
              >
                {included ? (
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                <span>{hdr}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pratinjau Dokumen */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="bg-slate-50/90 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="text-xs font-bold text-slate-900">
              Pratinjau Data ({settings.schoolName})
            </span>
            <span className="text-[11px] text-slate-500 ml-2 font-mono">
              · Menampilkan {Math.min(8, finalRows.length)} dari {finalRows.length} baris
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-200">
            Format: {format.toUpperCase()}
          </span>
        </div>
        <div className="overflow-x-auto max-h-60">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider select-none">
                {finalHeaders.map((h) => (
                  <th key={h} className="py-2.5 px-3.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {finalRows.slice(0, 8).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-3.5 text-slate-700 whitespace-nowrap font-medium align-middle">
                      {typeof cell === 'number' ? (
                        <span className="font-mono tabular-nums">{cell}</span>
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
              {finalRows.length === 0 && (
                <tr>
                  <td
                    colSpan={Math.max(1, finalHeaders.length)}
                    className="py-8 text-center text-slate-400"
                  >
                    Tidak ada baris data yang cocok dengan filter saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
};
