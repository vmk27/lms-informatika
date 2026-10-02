import React, { useState } from 'react';
import { Award, Settings2, Download, Search } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { ModalShell } from '../common/ModalShell';
import { GradeWeightConfig } from '../../types/lms';
import { ExportReportModal } from '../common/ExportReportModal';
import { StudentProgressDetailModal } from '../common/StudentProgressDetailModal';
import { CompactPagination } from '../common/CompactPagination';

export const GradesManagementView: React.FC = () => {
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
    updateGradeWeights,
  } = useLms();

  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  // Form Bobot Nilai Transparan
  const [weightForm, setWeightForm] = useState<GradeWeightConfig>({ ...gradeWeights });

  const students = users
    .filter((u) => u.role === 'student')
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
    });

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleSaveWeights = () => {
    const total =
      Number(weightForm.materialCompletionWeight) +
      Number(weightForm.assignmentWeight) +
      Number(weightForm.quizWeight);
    if (total !== 100) {
      alert(`Total bobot harus tepat 100% (saat ini ${total}%).`);
      return;
    }
    updateGradeWeights(weightForm);
    setIsWeightModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923]">Buku Nilai & Rekapitulasi Akhir</h1>
          <p className="text-xs text-[#68736B] mt-0.5">
            Perhitungan nilai akhir transparan berdasarkan bobot ketercapaian materi ({gradeWeights.materialCompletionWeight}%), tugas ({gradeWeights.assignmentWeight}%), dan kuis ({gradeWeights.quizWeight}%). KKM: {gradeWeights.passingGrade}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setWeightForm({ ...gradeWeights });
              setIsWeightModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#202923] bg-white border border-[#E5E9E3] rounded-lg hover:bg-[#F7F7F2] cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-[#276749]" />
            <span>Atur Bobot & KKM</span>
          </button>
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#276749] hover:bg-[#1F513A] rounded-lg cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Rekap Nilai</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-[#858D86] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari nama siswa atau NIS..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#276749]"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:outline-none focus:ring-1 focus:ring-[#276749]"
        >
          <option value="all">Semua Kelas ({classes.length})</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tabel Buku Nilai */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[920px]">
            <thead>
              <tr className="bg-[#F7F7F2] border-b border-[#E5E9E3] text-[#68736B] text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-4 min-w-[200px]">Nama Siswa & NIS</th>
                <th className="py-3 px-4 w-36">Kelas</th>
                <th className="py-3 px-4 w-40 text-center">
                  Capaian Materi ({gradeWeights.materialCompletionWeight}%)
                </th>
                <th className="py-3 px-4 w-40 text-center">
                  Rata-rata Tugas ({gradeWeights.assignmentWeight}%)
                </th>
                <th className="py-3 px-4 w-40 text-center">
                  Rata-rata Kuis ({gradeWeights.quizWeight}%)
                </th>
                <th className="py-3 px-4 w-32 text-center">Nilai Akhir</th>
                <th className="py-3 px-4 w-36 text-center">Status KKM</th>
                <th className="py-3 px-4 w-32 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9E3]">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#858D86] text-xs">
                    Tidak ada siswa yang sesuai dengan filter kelas atau pencarian.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => {
                  const cls = classes.find((c) => c.id === std.classId);
                  const classMats = materials.filter(
                    (m) => !std.classId || m.classIds.includes(std.classId)
                  );
                  const completedMats = classMats.filter((m) =>
                    readingSessions.some(
                      (s) =>
                        s.student_id === std.id &&
                        s.material_id === m.id &&
                        s.completion_status === 'completed'
                    )
                  ).length;
                  const matScore =
                    classMats.length > 0
                      ? Math.round((completedMats / classMats.length) * 100)
                      : 100;

                  const stdSubs = submissions.filter(
                    (s) => s.studentId === std.id && s.score !== null
                  );
                  const asgScore =
                    stdSubs.length > 0
                      ? Math.round(
                          stdSubs.reduce((a, b) => a + (b.score || 0), 0) / stdSubs.length
                        )
                      : 0;

                  const stdAttempts = quizAttempts.filter(
                    (a) => a.studentId === std.id && a.score !== null
                  );
                  const qzScore =
                    stdAttempts.length > 0
                      ? Math.round(
                          stdAttempts.reduce((a, b) => a + (b.score || 0), 0) / stdAttempts.length
                        )
                      : 0;

                  const finalScore = Math.round(
                    (matScore * gradeWeights.materialCompletionWeight +
                      asgScore * gradeWeights.assignmentWeight +
                      qzScore * gradeWeights.quizWeight) /
                      100
                  );
                  const isPassed = finalScore >= gradeWeights.passingGrade;

                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-[#E5F3E8]/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-[#202923] group-hover:text-[#276749] transition-colors truncate max-w-[220px]">
                          {std.name}
                        </div>
                        <div className="font-mono text-[11px] text-[#858D86] tabular-nums mt-0.5">
                          NIS: {std.nis || '-'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 align-middle">
                        <span className="px-2 py-0.5 rounded-md bg-[#F7F7F2] text-[#202923] font-semibold text-[11px] border border-[#E5E9E3]">
                          {cls?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums align-middle">
                        <span className="font-bold text-[#202923] text-xs">{matScore}</span>
                        <span className="text-[10px] text-[#858D86] block mt-0.5">
                          ({completedMats}/{classMats.length} materi)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums align-middle">
                        <span className="font-bold text-[#202923] text-xs">{asgScore}</span>
                        <span className="text-[10px] text-[#858D86] block mt-0.5">
                          ({stdSubs.length} tugas)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums align-middle">
                        <span className="font-bold text-[#202923] text-xs">{qzScore}</span>
                        <span className="text-[10px] text-[#858D86] block mt-0.5">
                          ({stdAttempts.length} kuis)
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono tabular-nums align-middle">
                        <span
                          className={`text-sm font-black px-2.5 py-1 rounded-lg border ${
                            isPassed
                              ? 'bg-[#E5F3E8] text-[#2F855A] border-[#48A878]/30'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {finalScore}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                            isPassed
                              ? 'bg-[#E5F3E8] text-[#2F855A] border-[#48A878]/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isPassed ? 'bg-[#2F855A]' : 'bg-amber-500'
                            }`}
                          />
                          <span>{isPassed ? 'Tuntas' : 'Remedial'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => setSelectedStudentId(std.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#276749] bg-[#E5F3E8] hover:bg-[#cbe6d2] border border-[#48A878]/20 rounded-lg transition-colors shadow-2xs cursor-pointer"
                        >
                          <span>Portofolio</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Compact Pagination */}
        <CompactPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={students.length}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="siswa"
        />
      </div>

      {/* Modal Pengaturan Bobot Nilai & KKM */}
      <ModalShell
        isOpen={isWeightModalOpen}
        onClose={() => setIsWeightModalOpen(false)}
        title="Pengaturan Bobot Rumus Nilai Akhir & KKM"
        description="Rumus transparan yang digunakan untuk menghitung nilai rapor siswa secara otomatis."
        maxWidthClass="max-w-md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsWeightModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveWeights}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Simpan Rumus Bobot
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Bobot Partisipasi & Penyelesaian Materi (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={weightForm.materialCompletionWeight}
              onChange={(e) =>
                setWeightForm({
                  ...weightForm,
                  materialCompletionWeight: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Bobot Tugas & Portofolio (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={weightForm.assignmentWeight}
              onChange={(e) =>
                setWeightForm({
                  ...weightForm,
                  assignmentWeight: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Bobot Evaluasi Kuis (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={weightForm.quizWeight}
              onChange={(e) =>
                setWeightForm({
                  ...weightForm,
                  quizWeight: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
            />
          </div>

          <div className="pt-2 border-t border-slate-200">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Kriteria Ketuntasan Minimal (KKM)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={weightForm.passingGrade}
              onChange={(e) =>
                setWeightForm({
                  ...weightForm,
                  passingGrade: Number(e.target.value),
                })
              }
              className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg font-bold text-blue-700"
            />
          </div>
        </div>
      </ModalShell>

      <StudentProgressDetailModal
        studentId={selectedStudentId}
        onClose={() => setSelectedStudentId(null)}
      />
      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        initialReportType="grade_recap"
        initialClassId={classFilter}
      />
    </div>
  );
};
