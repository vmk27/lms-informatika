import React, { useState } from 'react';
import {
  Plus,
  Edit3,
  Copy,
  Eye,
  Archive,
  Trash2,
  Clock,
  Paperclip,
  CheckSquare,
  Calendar,
  BookOpen,
  Search,
  Bookmark,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { Material, MaterialStatus } from '../../types/lms';
import { ModalShell } from '../common/ModalShell';
import { CompactPagination } from '../common/CompactPagination';

export const MaterialsManagementView: React.FC = () => {
  const {
    materials,
    classes,
    saveMaterial,
    duplicateMaterial,
    deleteMaterial,
    requestConfirm,
    closeConfirm,
    navigateAdmin,
  } = useLms();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // State Pratinjau Materi
  const [previewMaterial, setPreviewMaterial] = useState<Material | null>(null);

  const subjects = Array.from(new Set(materials.map((m) => m.subject)));

  const filteredMaterials = materials.filter((m) => {
    if (statusFilter !== 'all' && m.status !== statusFilter) return false;
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

  const totalPages = Math.max(1, Math.ceil(filteredMaterials.length / pageSize));
  const paginatedMaterials = filteredMaterials.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleArchiveToggle = (mat: Material) => {
    const nextStatus: MaterialStatus = mat.status === 'archived' ? 'draft' : 'archived';
    saveMaterial({ ...mat, status: nextStatus, updatedAt: new Date().toISOString() }, false);
  };

  const handleConfirmDelete = (mat: Material) => {
    requestConfirm({
      title: `Hapus Materi "${mat.title}"?`,
      description:
        'Materi yang dihapus tidak dapat dikembalikan dan akan menghapus referensi jadwal tayangnya.',
      confirmLabel: 'Ya, Hapus Materi',
      variant: 'danger',
      onConfirm: () => {
        deleteMaterial(mat.id);
        closeConfirm();
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header & Main Actions */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923] flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#276749]" />
            <span>Manajemen Materi Pembelajaran</span>
          </h1>
          <p className="text-xs text-[#68736B] mt-0.5">
            Kelola modul materi, struktur checkpoint, durasi baca minimum, dan prasyarat evaluasi.
          </p>
        </div>

        {/* Primary Action Button */}
        <button
          type="button"
          onClick={() => navigateAdmin('material_editor')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#276749] hover:bg-[#1F513A] active:bg-[#192A23] rounded-lg shadow-2xs whitespace-nowrap cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Materi Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-2xs">
        <div className="relative">
          <Search className="w-4 h-4 text-[#858D86] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari judul materi atau topik..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#276749]"
          />
        </div>

        <select
          value={subjectFilter}
          onChange={(e) => {
            setSubjectFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:bg-white focus:ring-1 focus:ring-[#276749]"
        >
          <option value="all">Semua Mata Pelajaran</option>
          {subjects.map((sub) => (
            <option key={sub} value={sub}>
              {sub}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3 py-2 text-xs bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg text-[#202923] focus:bg-white focus:ring-1 focus:ring-[#276749]"
        >
          <option value="all">Semua Status Publikasi</option>
          <option value="published">Tayang (Published)</option>
          <option value="scheduled">Terjadwal (Scheduled)</option>
          <option value="draft">Draft</option>
          <option value="closed">Ditutup</option>
          <option value="archived">Diarsipkan</option>
        </select>
      </div>

      {/* Materials List */}
      <div className="space-y-3">
        {filteredMaterials.length === 0 && (
          <div className="bg-white border border-[#E5E9E3] rounded-xl p-8 text-center text-[#858D86] text-xs shadow-2xs space-y-2">
            <BookOpen className="w-8 h-8 text-[#858D86] mx-auto" />
            <div className="font-semibold text-[#202923]">Tidak ada materi yang sesuai filter.</div>
            <p>Silakan sesuaikan kata kunci pencarian atau klik tombol Tambah Materi Baru.</p>
          </div>
        )}

        {paginatedMaterials.map((mat) => {
          const targetClassNames = mat.classIds
            .map((cId) => classes.find((c) => c.id === cId)?.name)
            .filter(Boolean)
            .join(', ');

          return (
            <div
              key={mat.id}
              className="bg-white border border-[#E5E9E3] rounded-xl p-5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-[#48A878] transition-all"
            >
              <div className="space-y-3 min-w-0 flex-1">
                {/* DISTINCT BORDERED HEADER CARD FOR MATERIAL TITLE */}
                <div className="bg-[#F7F7F2] border-l-4 border-l-[#276749] border border-[#E5E9E3] rounded-xl p-3 px-4 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#276749] text-white flex items-center gap-1">
                      <Bookmark className="w-3 h-3 text-emerald-200" />
                      {mat.subject}
                    </span>
                    <span className="text-xs text-[#68736B] font-medium">Topik: {mat.topic}</span>
                    <span className="text-[#858D86]">•</span>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        mat.status === 'published'
                          ? 'bg-[#E5F3E8] text-[#2F855A] border border-[#48A878]/30'
                          : mat.status === 'scheduled'
                          ? 'bg-[#E5F3E8] text-[#276749]'
                          : mat.status === 'draft'
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-[#E5E9E3] text-[#202923]'
                      }`}
                    >
                      {mat.status.toUpperCase()}
                    </span>
                  </div>

                  <h2 className="text-base font-bold text-[#202923]">{mat.title}</h2>
                  {mat.summary && <p className="text-xs text-[#68736B] line-clamp-2">{mat.summary}</p>}
                </div>

                <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-[#68736B] px-1">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#276749]" />
                    <span>
                      Min. Baca: <strong className="font-mono text-[#202923]">{mat.minReadMinutes} menit</strong>
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CheckSquare className="w-3.5 h-3.5 text-[#2F855A]" />
                    <span>
                      {mat.checkpoints.length} Checkpoint · {mat.sections.length} Bab
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Paperclip className="w-3.5 h-3.5 text-[#858D86]" />
                    <span>{mat.attachments.length} Lampiran</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-[#858D86]" />
                    <span>Kelas: {targetClassNames || '-'}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewMaterial(mat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#202923] bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg hover:bg-[#E5F3E8] hover:text-[#276749] transition-colors cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigateAdmin('material_editor', { materialId: mat.id })}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#276749] bg-[#E5F3E8] rounded-lg hover:bg-[#276749] hover:text-white border border-[#48A878]/30 transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Editor</span>
                </button>
                <button
                  type="button"
                  onClick={() => duplicateMaterial(mat.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202923] bg-white border border-[#E5E9E3] rounded-lg hover:bg-[#F7F7F2] transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplikasi</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleArchiveToggle(mat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#202923] bg-white border border-[#E5E9E3] rounded-lg hover:bg-[#F7F7F2] transition-colors cursor-pointer"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>{mat.status === 'archived' ? 'Pulihkan' : 'Arsip'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmDelete(mat)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#D9534F] bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          );
        })}

        {/* Compact Pagination for Materials */}
        <div className="bg-white border border-[#E5E9E3] rounded-xl overflow-hidden shadow-2xs mt-2">
          <CompactPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredMaterials.length}
            pageSize={pageSize}
            onPageChange={(p) => setCurrentPage(p)}
            onPageSizeChange={(sz) => {
              setPageSize(sz);
              setCurrentPage(1);
            }}
            itemLabel="materi"
          />
        </div>
      </div>

      {/* Modal Pratinjau Materi */}
      <ModalShell
        isOpen={Boolean(previewMaterial)}
        onClose={() => setPreviewMaterial(null)}
        title={`Pratinjau Materi — ${previewMaterial?.title || ''}`}
        description={`Mata Pelajaran: ${previewMaterial?.subject} · Waktu Baca Minimum: ${previewMaterial?.minReadMinutes} Menit`}
        maxWidthClass="max-w-3xl"
        footer={
          <button
            type="button"
            onClick={() => setPreviewMaterial(null)}
            className="px-4 py-2 text-xs font-medium text-[#202923] bg-white border border-[#E5E9E3] rounded-lg hover:bg-[#F7F7F2] cursor-pointer"
          >
            Tutup Pratinjau
          </button>
        }
      >
        {previewMaterial && (
          <div className="space-y-5">
            <div className="p-4 bg-[#F7F7F2] border-l-4 border-l-[#276749] border border-[#E5E9E3] rounded-xl text-xs text-[#202923]">
              <strong>Ringkasan:</strong> {previewMaterial.summary}
            </div>
            {previewMaterial.sections.map((sec, idx) => (
              <div key={sec.id} className="space-y-3 border-b border-[#E5E9E3] pb-4">
                <div className="bg-[#E5F3E8]/60 border-l-4 border-l-[#276749] border border-[#48A878]/30 rounded-lg p-3">
                  <h3 className="text-base font-bold text-[#202923]">{sec.heading}</h3>
                  {sec.subheading && (
                    <div className="text-xs font-semibold text-[#276749] mt-0.5">{sec.subheading}</div>
                  )}
                </div>
                <div
                  className="text-sm text-[#202923] space-y-2 leading-relaxed px-1"
                  dangerouslySetInnerHTML={{ __html: sec.bodyHtml }}
                />
              </div>
            ))}
          </div>
        )}
      </ModalShell>
    </div>
  );
};
