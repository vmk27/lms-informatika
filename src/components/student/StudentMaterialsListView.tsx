import React, { useState } from 'react';
import { BookOpen, Clock, CheckCircle2, ArrowRight, Search } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { CompactPagination } from '../common/CompactPagination';

export const StudentMaterialsListView: React.FC = () => {
  const {
    currentUser,
    materials,
    readingSessions,
    navigateStudent,
    isMaterialCompletedByStudent,
  } = useLms();

  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  const studentMaterials = materials.filter(
    (m) =>
      (!currentUser?.classId || m.classIds.includes(currentUser.classId)) &&
      m.status === 'published'
  );

  const subjects = Array.from(new Set(studentMaterials.map((m) => m.subject)));

  const filtered = studentMaterials.filter((m) => {
    if (subjectFilter !== 'all' && m.subject !== subjectFilter) return false;
    if (
      searchQuery.trim() &&
      !m.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !m.topic.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedData = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-[#202923] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#276749]" />
            <span>Materi Pembelajaran</span>
          </h1>
          <p className="text-xs text-[#68736B] mt-0.5">
            Pilih materi untuk memulai sesi membaca terstruktur dengan timer otomatis dan checkpoint pemahaman.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#858D86] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari materi pembelajaran..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:outline-none focus:ring-1 focus:ring-[#276749]"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:outline-none focus:ring-1 focus:ring-[#276749]"
        >
          <option value="all">Semua Mata Pelajaran</option>
          {subjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>
      </div>

      {/* Grid Materi */}
      <div className="bg-white border border-[#E5E9E3] rounded-2xl shadow-2xs overflow-hidden space-y-4">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {paginatedData.map((mat) => {
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
                className="cursor-pointer bg-white border border-[#E5E9E3] rounded-xl p-5 hover:border-[#48A878] transition-all flex flex-col justify-between space-y-4 group shadow-2xs"
              >
                {/* Distinct Bordered Card/Column for Material Title */}
                <div className="bg-[#F7F7F2] border-l-4 border-l-[#276749] border border-[#E5E9E3] rounded-xl p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-[#68736B]">
                    <span className="font-bold text-[#276749] px-2 py-0.5 rounded bg-[#E5F3E8] border border-[#48A878]/30 text-[11px]">
                      {mat.subject}
                    </span>
                    <span className="font-mono text-[#276749] font-bold text-xs">Bab #{mat.order}</span>
                  </div>
                  <h2 className="text-base font-bold text-[#202923] group-hover:text-[#276749] transition-colors leading-snug">
                    {mat.title}
                  </h2>
                  {mat.summary && (
                    <p className="text-xs text-[#68736B] line-clamp-2 pt-0.5">{mat.summary}</p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-[#E5E9E3]">
                  <div className="flex items-center justify-between text-xs text-[#68736B]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#276749]" />
                      <span>Target Min: {mat.minReadMinutes} Menit</span>
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#202923]">
                      {pct}% Selesai
                    </span>
                  </div>

                  <div className="w-full h-2 bg-[#F7F7F2] rounded-full overflow-hidden border border-[#E5E9E3]">
                    <div
                      className={`h-full transition-all ${
                        isDone ? 'bg-[#2F855A]' : 'bg-[#276749]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#858D86]">
                      {mat.attachments.length} Lampiran · {mat.checkpoints.length} Checkpoint
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#276749] group-hover:translate-x-0.5 transition-transform">
                      {isDone ? 'Pelajari Ulang' : 'Buka Materi'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {paginatedData.length === 0 && (
            <div className="col-span-2 py-12 text-center text-[#858D86] text-xs">
              Tidak ada materi pembelajaran yang cocok dengan kata kunci pencarian.
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        <CompactPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[6, 12, 24]}
          itemLabel="materi"
        />
      </div>
    </div>
  );
};
