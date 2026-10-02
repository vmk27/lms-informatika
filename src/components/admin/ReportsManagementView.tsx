import React, { useState } from 'react';
import { Download, FileText } from 'lucide-react';
import { ExportReportModal, ReportTypeId } from '../common/ExportReportModal';
import { CompactPagination } from '../common/CompactPagination';

export const ReportsManagementView: React.FC = () => {
  const [selectedReportType, setSelectedReportType] = useState<ReportTypeId>('reading_progress');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const reportCards: {
    id: ReportTypeId;
    title: string;
    description: string;
    metrics: string;
  }[] = [
    {
      id: 'reading_progress',
      title: '1. Laporan Progress Membaca Materi',
      description:
        'Rekapitulasi waktu baca aktif (Page Visibility), waktu jeda tab, checkpoint bagian yang tercapai, dan status tuntas per materi.',
      metrics: 'Format PDF, XLSX, CSV · Kop Surat Sekolah',
    },
    {
      id: 'student_activity',
      title: '2. Laporan Aktivitas Belajar Siswa',
      description:
        'Jejak audit sinkronisasi sesi belajar, perubahan jadwal, dan interaksi pembelajaran harian.',
      metrics: 'Filter Rentang Tanggal & Kelas',
    },
    {
      id: 'assignment_recap',
      title: '3. Rekap Pengumpulan & Penilaian Tugas',
      description:
        'Daftar pengumpulan tugas, indikasi keterlambatan, nilai per kriteria rubrik, dan catatan umpan balik guru.',
      metrics: 'Rekapitulasi per Mata Pelajaran',
    },
    {
      id: 'quiz_results',
      title: '4. Laporan Hasil Evaluasi Kuis',
      description:
        'Daftar skor evaluasi formatif/sumatif, durasi pengerjaan, jumlah percobaan, dan analisis butir soal.',
      metrics: 'Nilai Rata-rata & Ketuntasan',
    },
    {
      id: 'grade_recap',
      title: '5. Rekap Buku Nilai Akhir Siswa',
      description:
        'Buku nilai kumulatif transparan menggabungkan bobot materi, tugas, kuis, dan status ketercapaian KKM.',
      metrics: 'Siap Cetak Rapor Tengah/Akhir Semester',
    },
    {
      id: 'class_recap',
      title: '6. Rekapitulasi Capaian per Kelas',
      description:
        'Ringkasan agregat persentase ketuntasan materi dan rata-rata nilai kelas untuk kepala sekolah dan pengawas.',
      metrics: 'Perbandingan Antar-Rombel',
    },
    {
      id: 'individual_history',
      title: '7. Riwayat Pembelajaran Individual Siswa',
      description:
        'Portofolio komprehensif siswa mencakup seluruh log sesi materi, tugas, dan kuis untuk laporan wali murid.',
      metrics: 'Portofolio Lengkap per Siswa',
    },
  ];

  const totalPages = Math.ceil(reportCards.length / pageSize);
  const paginatedReportCards = reportCards.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923]">Manajemen Laporan Akademik</h1>
          <p className="text-xs text-[#68736B] mt-0.5">
            Pusat cetak dan ekspor 7 jenis laporan resmi kurikulum SMA berformat PDF (dengan kop & tanda tangan kepala sekolah), Excel (.xlsx), dan CSV.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedReportType('reading_progress');
            setIsExportOpen(true);
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#276749] hover:bg-[#1F513A] rounded-lg transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Buka Modal Ekspor Dokumen</span>
        </button>
      </div>

      {/* Grid 7 Jenis Laporan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedReportCards.map((rc) => (
          <div
            key={rc.id}
            className="bg-white border border-[#E5E9E3] rounded-xl p-5 flex flex-col justify-between space-y-4 hover:border-[#48A878] transition-all shadow-2xs"
          >
            <div className="space-y-2">
              <div className="w-8 h-8 rounded-lg bg-[#E5F3E8] text-[#276749] flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
              <h2 className="text-sm font-bold text-[#202923]">{rc.title}</h2>
              <p className="text-xs text-[#68736B] leading-relaxed">{rc.description}</p>
            </div>

            <div className="pt-3 border-t border-[#E5E9E3] flex items-center justify-between">
              <span className="text-[11px] font-mono text-[#858D86]">{rc.metrics}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedReportType(rc.id);
                  setIsExportOpen(true);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-[#276749] bg-[#E5F3E8] hover:bg-[#cbe6d2] rounded-lg transition-colors cursor-pointer"
              >
                Konfigurasi & Cetak
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination wrapper card */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl overflow-hidden shadow-2xs">
        <CompactPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={reportCards.length}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="laporan"
        />
      </div>

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        initialReportType={selectedReportType}
      />
    </div>
  );
};
