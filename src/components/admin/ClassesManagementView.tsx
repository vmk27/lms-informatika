import React, { useState } from 'react';
import { Plus, Edit3, Trash2, Users, Eye } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { SchoolClass } from '../../types/lms';
import { ModalShell } from '../common/ModalShell';
import { hasPermission } from '../../services/permissions';
import { CompactPagination } from '../common/CompactPagination';

export const ClassesManagementView: React.FC = () => {
  const {
    classes,
    users,
    currentUser,
    saveClass,
    deleteClass,
    navigateAdmin,
    requestConfirm,
    closeConfirm,
    addToast,
  } = useLms();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewClass, setIsNewClass] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [form, setForm] = useState<SchoolClass>(() => ({
    id: `cls-${Date.now()}`,
    code: '',
    name: '',
    gradeLevel: 'X',
    academicYear: '2026/2027',
    homeroomTeacherId: 'usr-teacher-1',
    homeroomTeacherName: 'Drs. Bambang Sutrisno, M.Si.',
    studentIds: [],
    status: 'active',
  }));

  const teachers = users.filter((u) => u.role === 'teacher');
  const canEdit = hasPermission(currentUser, 'manage_classes');

  const openCreateModal = () => {
    setForm({
      id: `cls-${Date.now()}`,
      code: '',
      name: '',
      gradeLevel: 'X',
      academicYear: '2026/2027',
      homeroomTeacherId: teachers[0]?.id || 'usr-teacher-1',
      homeroomTeacherName: teachers[0]?.name || 'Guru Wali',
      studentIds: [],
      status: 'active',
    });
    setIsNewClass(true);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const openEditModal = (cls: SchoolClass) => {
    setForm({ ...cls });
    setIsNewClass(false);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) {
      addToast({
        type: 'error',
        title: 'Validasi Gagal',
        description: 'Kode kelas dan nama kelas wajib diisi.',
      });
      return;
    }
    saveClass(form, isNewClass);
    setIsDirty(false);
    setIsModalOpen(false);
  };

  const totalPages = Math.ceil(classes.length / pageSize);
  const paginatedClasses = classes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923]">Manajemen Data Kelas</h1>
          <p className="text-xs text-[#68736B] mt-0.5">
            Kelola rombongan belajar, tingkat kelas (X, XI, XII), wali kelas, dan daftar anggota siswa.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#276749] hover:bg-[#1F513A] rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kelas Baru</span>
          </button>
        )}
      </div>

      {/* Tabel Data Kelas */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[800px]">
            <thead>
              <tr className="bg-[#F7F7F2] border-b border-[#E5E9E3] text-[#68736B] text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-4 w-32 font-mono">Kode Kelas</th>
                <th className="py-3 px-4 min-w-[180px]">Rombongan Belajar</th>
                <th className="py-3 px-4 w-28 text-center">Tingkat</th>
                <th className="py-3 px-4 w-36">Tahun Ajaran</th>
                <th className="py-3 px-4 min-w-[180px]">Wali Kelas</th>
                <th className="py-3 px-4 w-32 text-center">Jumlah Siswa</th>
                <th className="py-3 px-4 w-28 text-center">Status</th>
                <th className="py-3 px-4 w-44 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9E3]">
              {paginatedClasses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#858D86] text-xs">
                    Belum ada rombongan belajar kelas yang ditambahkan.
                  </td>
                </tr>
              ) : (
                paginatedClasses.map((cls) => {
                  const studentCount = users.filter(
                    (u) => u.role === 'student' && u.classId === cls.id
                  ).length;
                  return (
                    <tr
                      key={cls.id}
                      className="hover:bg-[#E5F3E8]/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#276749] tabular-nums align-middle">
                        {cls.code}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#202923] group-hover:text-[#276749] transition-colors align-middle truncate">
                        {cls.name}
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span className="px-2 py-0.5 rounded-md bg-[#F7F7F2] text-[#202923] font-mono font-semibold text-[11px] border border-[#E5E9E3]">
                          Kelas {cls.gradeLevel}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#68736B] tabular-nums align-middle">
                        {cls.academicYear}
                      </td>
                      <td className="py-3.5 px-4 text-[#202923] font-medium align-middle">
                        {cls.homeroomTeacherName}
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-[#E5F3E8] text-[#276749] font-mono font-semibold text-[11px] border border-[#48A878]/20">
                          <Users className="w-3.5 h-3.5 text-[#276749]" />
                          <span>{studentCount} Siswa</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            cls.status === 'active'
                              ? 'bg-[#E5F3E8] text-[#2F855A] border-[#48A878]/30'
                              : 'bg-[#F7F7F2] text-[#858D86] border-[#E5E9E3]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              cls.status === 'active' ? 'bg-[#2F855A]' : 'bg-[#858D86]'
                            }`}
                          />
                          <span>{cls.status === 'active' ? 'Aktif' : 'Arsip'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigateAdmin('students', { classId: cls.id })}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#276749] bg-[#E5F3E8] hover:bg-[#cbe6d2] border border-[#48A878]/20 rounded-lg transition-colors shadow-2xs cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Siswa</span>
                          </button>
                          {canEdit && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(cls)}
                                className="p-1.5 text-[#68736B] hover:text-[#276749] hover:bg-[#E5F3E8] border border-transparent hover:border-[#48A878]/30 rounded-lg transition-colors cursor-pointer"
                                title="Edit Kelas"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  requestConfirm({
                                    title: `Hapus Kelas "${cls.name}"?`,
                                    description:
                                      'Menghapus kelas akan melepaskan penugasan kelas pada siswa terkait.',
                                    confirmLabel: 'Hapus Kelas',
                                    variant: 'danger',
                                    onConfirm: () => {
                                      deleteClass(cls.id);
                                      closeConfirm();
                                    },
                                  })
                                }
                                className="p-1.5 text-[#858D86] hover:text-[#D9534F] hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Kelas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
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
          totalItems={classes.length}
          pageSize={pageSize}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(sz) => {
            setPageSize(sz);
            setCurrentPage(1);
          }}
          itemLabel="kelas"
        />
      </div>

      {/* Modal Tambah / Edit Kelas */}
      <ModalShell
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isDirty={isDirty}
        title={isNewClass ? 'Tambah Rombongan Kelas Baru' : `Edit Kelas — ${form.name}`}
        description="Lengkapi kode kelas, tingkat, tahun ajaran, dan wali kelas."
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-[#202923] bg-white border border-[#E5E9E3] rounded-lg hover:bg-[#F7F7F2] cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-white bg-[#276749] hover:bg-[#1F513A] rounded-lg transition-colors cursor-pointer"
            >
              Simpan Kelas
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kode Kelas <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => {
                  setForm({ ...form, code: e.target.value.toUpperCase() });
                  setIsDirty(true);
                }}
                placeholder="XI-MIPA-3"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tingkat Kelas
              </label>
              <select
                value={form.gradeLevel}
                onChange={(e) => {
                  setForm({
                    ...form,
                    gradeLevel: e.target.value as SchoolClass['gradeLevel'],
                  });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="X">Kelas X</option>
                <option value="XI">Kelas XI</option>
                <option value="XII">Kelas XII</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Kelas Lengkap <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setIsDirty(true);
              }}
              placeholder="Contoh: XI MIPA 3 (Sains & Teknologi)"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Wali Kelas
            </label>
            <select
              value={form.homeroomTeacherId}
              onChange={(e) => {
                const t = teachers.find((tc) => tc.id === e.target.value);
                setForm({
                  ...form,
                  homeroomTeacherId: e.target.value,
                  homeroomTeacherName: t?.name || 'Guru Wali',
                });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Tahun Ajaran
              </label>
              <input
                type="text"
                value={form.academicYear}
                onChange={(e) => {
                  setForm({ ...form, academicYear: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Status Kelas
              </label>
              <select
                value={form.status}
                onChange={(e) => {
                  setForm({
                    ...form,
                    status: e.target.value as SchoolClass['status'],
                  });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="active">Aktif</option>
                <option value="archived">Diarsipkan</option>
              </select>
            </div>
          </div>
        </div>
      </ModalShell>
    </div>
  );
};
