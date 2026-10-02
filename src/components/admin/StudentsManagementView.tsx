import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  Plus,
  Upload,
  Download,
  Edit3,
  Trash2,
  KeyRound,
  Search,
  CheckCircle2,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { User } from '../../types/lms';
import { ModalShell } from '../common/ModalShell';
import { hasPermission } from '../../services/permissions';
import { ExportReportModal } from '../common/ExportReportModal';
import { MobileDataCard } from '../common/MobileDataCard';
import { ResponsiveFilterDrawer } from '../common/ResponsiveFilterDrawer';
import { CompactPagination } from '../common/CompactPagination';
import { ActionMenuItem } from '../common/RowActionMenu';

interface ImportPreviewRow {
  name: string;
  nis: string;
  nisn: string;
  username: string;
  classCode: string;
  classId: string;
  isValid: boolean;
  validationNote: string;
}

export const StudentsManagementView: React.FC = () => {
  const {
    users,
    classes,
    currentUser,
    navFilter,
    saveUser,
    importStudentsBatch,
    deleteUser,
    resetStudentCredential,
    requestConfirm,
    closeConfirm,
    addToast,
  } = useLms();

  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>(navFilter.classId || 'all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  // Modal Tambah/Edit Siswa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewStudent, setIsNewStudent] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const [form, setForm] = useState<User>(() => ({
    id: `std-${Date.now()}`,
    name: '',
    username: '',
    email: '',
    role: 'student',
    status: 'active',
    nis: '',
    nisn: '',
    classId: classes[0]?.id || 'cls-xi-mipa-1',
    lastActiveAt: new Date().toISOString(),
  }));

  // Modal Impor CSV/XLSX
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreviewRows, setImportPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [importSummary, setImportSummary] = useState<{
    importedCount: number;
    skippedCount: number;
    errors: string[];
  } | null>(null);

  // Modal Token Reset Kredensial Satu Kali
  const [resetTokenInfo, setResetTokenInfo] = useState<{
    studentName: string;
    token: string;
  } | null>(null);

  const [isExportOpen, setIsExportOpen] = useState(false);

  const canManage = hasPermission(currentUser, 'manage_students');
  const canResetCred = hasPermission(currentUser, 'reset_student_credentials');

  const students = useMemo(() => {
    return users
      .filter((u) => u.role === 'student')
      .filter((u) => {
        if (classFilter !== 'all' && u.classId !== classFilter) return false;
        if (statusFilter !== 'all' && u.status !== statusFilter) return false;
        if (
          searchQuery.trim() &&
          !u.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(u.nis || '').includes(searchQuery) &&
          !u.username.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      });
  }, [users, classFilter, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const paginatedStudents = students.slice((page - 1) * pageSize, page * pageSize);

  const openCreateStudent = () => {
    setForm({
      id: `std-${Date.now()}`,
      name: '',
      username: '',
      email: '',
      role: 'student',
      status: 'active',
      nis: '',
      nisn: '',
      classId: classes[0]?.id || 'cls-xi-mipa-1',
      lastActiveAt: new Date().toISOString(),
    });
    setIsNewStudent(true);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const openEditStudent = (std: User) => {
    setForm({ ...std });
    setIsNewStudent(false);
    setIsDirty(false);
    setIsModalOpen(true);
  };

  const handleSaveStudent = () => {
    if (!form.name.trim() || !form.nis?.trim() || !form.username.trim() || !form.classId) {
      addToast({
        type: 'error',
        title: 'Validasi Gagal',
        description: 'Nama lengkap, NIS, Username, dan Kelas wajib diisi.',
      });
      return;
    }

    // Cek duplikasi NIS atau Username
    const duplicate = users.find(
      (u) =>
        u.id !== form.id &&
        (u.nis === form.nis || u.username.toLowerCase() === form.username.toLowerCase())
    );
    if (duplicate) {
      addToast({
        type: 'error',
        title: 'Duplikasi Data Terdeteksi',
        description: `NIS atau Username sudah digunakan oleh ${duplicate.name}.`,
      });
      return;
    }

    // Jika memindahkan kelas siswa lama, minta konfirmasi terlebih dahulu
    const existingUser = users.find((u) => u.id === form.id);
    if (!isNewStudent && existingUser && existingUser.classId !== form.classId) {
      requestConfirm({
        title: `Pindahkan Kelas ${form.name}?`,
        description:
          'Memindahkan siswa ke kelas baru akan memperbarui daftar akses materi dan tugas sesuai kelas tujuan.',
        confirmLabel: 'Ya, Pindahkan Siswa',
        onConfirm: () => {
          saveUser(
            {
              ...form,
              email: form.email || `${form.username}@siswa.sman1nusantara.sch.id`,
            },
            false
          );
          setIsDirty(false);
          setIsModalOpen(false);
          closeConfirm();
        },
      });
      return;
    }

    saveUser(
      {
        ...form,
        email: form.email || `${form.username}@siswa.sman1nusantara.sch.id`,
      },
      isNewStudent
    );
    setIsDirty(false);
    setIsModalOpen(false);
  };

  // Validasi baris impor CSV/XLSX
  const validateAndBuildPreview = (
    rawRows: {
      Nama?: string;
      NIS?: string;
      NISN?: string;
      Username?: string;
      KodeKelas?: string;
    }[]
  ) => {
    const existingNis = new Set(users.map((u) => u.nis).filter(Boolean));
    const existingUsernames = new Set(users.map((u) => u.username.toLowerCase()));
    const seenBatchNis = new Set<string>();

    const preview: ImportPreviewRow[] = rawRows.map((r) => {
      const name = String(r.Nama || '').trim();
      const nis = String(r.NIS || '').trim();
      const nisn = String(r.NISN || '').trim();
      const username = String(r.Username || '').trim();
      const classCode = String(r.KodeKelas || '').trim();
      const matchedClass =
        classes.find((c) => c.code.toLowerCase() === classCode.toLowerCase()) ||
        classes[0];

      const issues: string[] = [];
      if (!name || !nis || !username) {
        issues.push('Kolom wajib (Nama/NIS/Username) kosong');
      }
      if (existingNis.has(nis) || seenBatchNis.has(nis)) {
        issues.push(`Duplikasi NIS (${nis})`);
      }
      if (existingUsernames.has(username.toLowerCase())) {
        issues.push(`Duplikasi Username (${username})`);
      }
      if (nis) seenBatchNis.add(nis);

      return {
        name,
        nis,
        nisn,
        username,
        classCode: matchedClass?.code || classCode,
        classId: matchedClass?.id || 'cls-xi-mipa-1',
        isValid: issues.length === 0,
        validationNote: issues.length === 0 ? 'Siap Diimpor (Valid)' : issues.join(', '),
      };
    });

    setImportPreviewRows(preview);
    setImportSummary(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<{
        Nama?: string;
        NIS?: string;
        NISN?: string;
        Username?: string;
        KodeKelas?: string;
      }>(sheet);
      validateAndBuildPreview(json);
    };
    reader.readAsArrayBuffer(file);
  };

  const loadSampleImportPreview = () => {
    validateAndBuildPreview([
      {
        Nama: 'Satria Wibowo Kusuma',
        NIS: '24251088',
        NISN: '0084192088',
        Username: 'satria.wibowo',
        KodeKelas: 'XI-MIPA-1',
      },
      {
        Nama: 'Keisya Maharani Putri',
        NIS: '24251089',
        NISN: '0084192089',
        Username: 'keisya.putri',
        KodeKelas: 'XI-MIPA-2',
      },
      {
        // Sengaja duplikasi NIS std-01 untuk mendemonstrasikan deteksi duplikasi
        Nama: 'Nadia Putri Duplikat',
        NIS: '24251001',
        NISN: '0084192011',
        Username: 'nadia.putri',
        KodeKelas: 'XI-MIPA-1',
      },
    ]);
  };

  const downloadTemplateXlsx = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nama', 'NIS', 'NISN', 'Username', 'KodeKelas'],
      ['Satria Wibowo Kusuma', '24251088', '0084192088', 'satria.wibowo', 'XI-MIPA-1'],
      ['Keisya Maharani Putri', '24251089', '0084192089', 'keisya.putri', 'XI-MIPA-2'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Impor_Siswa');
    XLSX.writeFile(wb, 'Template_Impor_Siswa_SMA.xlsx');
  };

  const executeBatchImport = () => {
    const result = importStudentsBatch(
      importPreviewRows.map((r) => ({
        name: r.name,
        nis: r.nis,
        nisn: r.nisn,
        username: r.username,
        email: `${r.username}@siswa.sman1nusantara.sch.id`,
        classId: r.classId,
        status: 'active',
      }))
    );
    setImportSummary(result);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#202923]">Manajemen Data Siswa</h1>
          <p className="text-xs text-[#68736B] mt-0.5">
            Kelola akun siswa, NIS/NISN, penempatan kelas, impor CSV/XLSX dengan deteksi duplikasi, dan reset kredensial aman.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-[#202923] bg-white border border-[#E5E9E3] rounded-lg hover:bg-[#F7F7F2] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Daftar Siswa</span>
          </button>
          {canManage && (
            <>
              <button
                type="button"
                onClick={() => {
                  setImportPreviewRows([]);
                  setImportSummary(null);
                  setIsImportModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#276749] bg-[#E5F3E8] border border-[#48A878]/30 rounded-lg hover:bg-[#cbe6d2] cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Impor CSV / XLSX</span>
              </button>
              <button
                type="button"
                onClick={openCreateStudent}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#276749] rounded-lg hover:bg-[#1F513A] cursor-pointer transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter Bar with Responsive Drawer */}
      <ResponsiveFilterDrawer
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setPage(1);
        }}
        searchPlaceholder="Cari nama, NIS, atau username siswa..."
        activeFilterCount={(classFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0)}
        onResetFilters={() => {
          setClassFilter('all');
          setStatusFilter('all');
          setSearchQuery('');
          setPage(1);
        }}
      >
        <div className="w-full md:w-52">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 md:hidden">
            Pilih Kelas:
          </label>
          <select
            value={classFilter}
            onChange={(e) => {
              setClassFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 md:bg-white border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-48">
          <label className="block text-[11px] font-semibold text-slate-600 mb-1 md:hidden">
            Status Akun:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 text-xs bg-slate-50 md:bg-white border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="all">Semua Status Akun</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
            <option value="suspended">Ditangguhkan</option>
          </select>
        </div>
      </ResponsiveFilterDrawer>

      {/* 1. MOBILE SMARTPHONE VIEW (<768px): Compact Data Cards */}
      <div className="block md:hidden space-y-3">
        {paginatedStudents.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs shadow-2xs">
            <AlertTriangle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            Tidak ada data siswa ditemukan untuk kriteria pencarian ini.
          </div>
        ) : (
          paginatedStudents.map((std) => {
            const cls = classes.find((c) => c.id === std.classId);
            const menuActions: ActionMenuItem[] = [
              ...(canResetCred
                ? [
                    {
                      id: 'reset',
                      label: 'Reset Kredensial',
                      icon: KeyRound,
                      onClick: () => {
                        const token = resetStudentCredential(std.id);
                        setResetTokenInfo({ studentName: std.name, token });
                      },
                    },
                  ]
                : []),
              ...(canManage
                ? [
                    {
                      id: 'edit',
                      label: 'Edit Siswa',
                      icon: Edit3,
                      onClick: () => openEditStudent(std),
                    },
                    {
                      id: 'delete',
                      label: 'Hapus Siswa',
                      icon: Trash2,
                      variant: 'danger' as const,
                      onClick: () =>
                        requestConfirm({
                          title: `Hapus Data Siswa "${std.name}"?`,
                          description:
                            'Konfirmasi penghapusan: Akun siswa akan dihapus beserta keanggotaan kelasnya.',
                          confirmLabel: 'Ya, Hapus Siswa',
                          variant: 'danger',
                          onConfirm: () => {
                            deleteUser(std.id);
                            closeConfirm();
                          },
                        }),
                    },
                  ]
                : []),
            ];

            return (
              <MobileDataCard
                key={std.id}
                title={std.name}
                subtitle={`${cls?.name || '-'} · NIS: ${std.nis || '-'}`}
                badge={
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      std.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        std.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                      }`}
                    />
                    <span>{std.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                  </span>
                }
                primaryAction={
                  canManage
                    ? {
                        label: 'Edit',
                        icon: Edit3,
                        onClick: () => openEditStudent(std),
                      }
                    : undefined
                }
                menuItems={menuActions}
              />
            );
          })
        )}
      </div>

      {/* 2. TABLET & DESKTOP VIEW (>=768px): Full Structured Table */}
      <div className="hidden md:block bg-white border border-[#E5E9E3] rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[860px]">
            <thead>
              <tr className="bg-[#F7F7F2] border-b border-[#E5E9E3] text-[#68736B] text-[11px] font-bold uppercase tracking-wider select-none">
                <th className="py-3 px-4 w-28 font-mono">ID Internal</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Lengkap Siswa</th>
                <th className="py-3 px-4 w-40">NIS / NISN</th>
                <th className="py-3 px-4 w-36">Username</th>
                <th className="py-3 px-4 w-36">Kelas</th>
                <th className="py-3 px-4 w-32 text-center">Status Akun</th>
                <th className="py-3 px-4 w-48 text-right">Aksi & Kredensial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E9E3]">
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#858D86] text-xs">
                    <AlertTriangle className="w-8 h-8 text-[#858D86] mx-auto mb-2" />
                    Tidak ada data siswa ditemukan untuk kriteria pencarian ini.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((std) => {
                  const cls = classes.find((c) => c.id === std.classId);
                  return (
                    <tr
                      key={std.id}
                      className="hover:bg-[#E5F3E8]/40 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono text-[#858D86] tabular-nums align-middle">
                        {std.id}
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-[#202923] group-hover:text-[#276749] transition-colors truncate max-w-[240px]">
                          {std.name}
                        </div>
                        <div className="text-[11px] text-[#858D86] font-mono mt-0.5 truncate">
                          {std.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#68736B] tabular-nums align-middle">
                        <span className="font-semibold text-[#202923]">{std.nis || '-'}</span>
                        <span className="text-[#858D86] text-[11px] block">
                          NISN: {std.nisn || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#276749] font-semibold align-middle">
                        {std.username}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 align-middle">
                        <span className="px-2 py-0.5 rounded-md bg-[#F7F7F2] text-[#202923] font-semibold text-[11px] border border-[#E5E9E3]">
                          {cls?.name || '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-middle text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            std.status === 'active'
                              ? 'bg-[#E5F3E8] text-[#2F855A] border-[#48A878]/30'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              std.status === 'active' ? 'bg-[#2F855A]' : 'bg-amber-500'
                            }`}
                          />
                          <span>{std.status === 'active' ? 'Aktif' : 'Nonaktif'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 align-middle text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canResetCred && (
                            <button
                              type="button"
                              onClick={() => {
                                const token = resetStudentCredential(std.id);
                                setResetTokenInfo({ studentName: std.name, token });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-lg transition-colors shadow-2xs cursor-pointer"
                              title="Reset Kredensial Siswa"
                            >
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Reset Token</span>
                            </button>
                          )}
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditStudent(std)}
                                className="p-1.5 text-[#68736B] hover:text-[#276749] hover:bg-[#E5F3E8] border border-transparent hover:border-[#48A878]/30 rounded-lg transition-colors cursor-pointer"
                                title="Edit Siswa"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  requestConfirm({
                                    title: `Hapus Data Siswa "${std.name}"?`,
                                    description:
                                      'Konfirmasi penghapusan: Akun siswa akan dihapus beserta keanggotaan kelasnya.',
                                    confirmLabel: 'Ya, Hapus Siswa',
                                    variant: 'danger',
                                    onConfirm: () => {
                                      deleteUser(std.id);
                                      closeConfirm();
                                    },
                                  })
                                }
                                className="p-1.5 text-[#858D86] hover:text-[#D9534F] hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Siswa"
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
      </div>

      {/* Paginasi Ringkas & Adaptif */}
      <CompactPagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={students.length}
        pageSize={pageSize}
        onPageChange={setPage}
        itemLabel="siswa"
      />

      {/* Modal Tambah / Edit Siswa */}
      <ModalShell
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isDirty={isDirty}
        title={isNewStudent ? 'Tambah Data Siswa Baru' : `Edit Data Siswa — ${form.name}`}
        description="Kata sandi tidak ditampilkan dalam tabel; akun baru menggunakan mekanisme token aktivasi aman."
        maxWidthClass="max-w-lg"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveStudent}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Simpan Data Siswa
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Lengkap Siswa <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                NIS (Nomor Induk Siswa) <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.nis || ''}
                onChange={(e) => {
                  setForm({ ...form, nis: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                NISN
              </label>
              <input
                type="text"
                value={form.nisn || ''}
                onChange={(e) => {
                  setForm({ ...form, nisn: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Username Login <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => {
                  setForm({ ...form, username: e.target.value.toLowerCase() });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kelas <span className="text-red-600">*</span>
              </label>
              <select
                value={form.classId || ''}
                onChange={(e) => {
                  setForm({ ...form, classId: e.target.value });
                  setIsDirty(true);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Status Akun
            </label>
            <select
              value={form.status}
              onChange={(e) => {
                setForm({ ...form, status: e.target.value as User['status'] });
                setIsDirty(true);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="suspended">Ditangguhkan</option>
            </select>
          </div>
        </div>
      </ModalShell>

      {/* Modal Impor CSV/XLSX dengan Pratinjau, Deteksi Duplikasi, dan Laporan Hasil */}
      <ModalShell
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        title="Impor Massal Data Siswa (CSV / XLSX)"
        description="Unggah berkas spreadsheet, periksa validasi kolom wajib dan duplikasi NIS/Username sebelum mengimpor."
        maxWidthClass="max-w-4xl"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsImportModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg"
            >
              Tutup
            </button>
            <button
              type="button"
              disabled={importPreviewRows.length === 0 || Boolean(importSummary)}
              onClick={executeBatchImport}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Proses Impor Sekarang
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-slate-800">
                Pilih Berkas CSV atau Excel (.xlsx)
              </div>
              <div className="text-[11px] text-slate-500">
                Kolom wajib: <span className="font-mono">Nama, NIS, NISN, Username, KodeKelas</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={downloadTemplateXlsx}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Unduh Template XLSX
              </button>
              <button
                type="button"
                onClick={loadSampleImportPreview}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
              >
                Muat Contoh Data Uji (2 Valid + 1 Duplikat)
              </button>
              <label className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer hover:bg-slate-800">
                <span>Pilih Berkas...</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Pratinjau Sebelum Impor */}
          {importPreviewRows.length > 0 && (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-800">
                Pratinjau Validasi Baris ({importPreviewRows.length} Baris)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <th className="py-2 px-3">Nama Lengkap</th>
                      <th className="py-2 px-3">NIS</th>
                      <th className="py-2 px-3">Username</th>
                      <th className="py-2 px-3">Kode Kelas</th>
                      <th className="py-2 px-3">Status Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {importPreviewRows.map((row, i) => (
                      <tr key={i}>
                        <td className="py-2 px-3 font-medium">{row.name}</td>
                        <td className="py-2 px-3 font-mono">{row.nis}</td>
                        <td className="py-2 px-3 font-mono">{row.username}</td>
                        <td className="py-2 px-3 font-mono">{row.classCode}</td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> {row.validationNote}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-700 font-medium">
                              <AlertTriangle className="w-3.5 h-3.5" /> {row.validationNote}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Laporan Baris Berhasil dan Gagal */}
          {importSummary && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-emerald-900">
                Laporan Hasil Impor Selesai: {importSummary.importedCount} Berhasil ·{' '}
                {importSummary.skippedCount} Gagal/Dilewati
              </div>
              {importSummary.errors.length > 0 && (
                <ul className="list-disc pl-5 text-amber-900 space-y-1">
                  {importSummary.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </ModalShell>

      {/* Modal Informasi Token Reset Kredensial */}
      <ModalShell
        isOpen={Boolean(resetTokenInfo)}
        onClose={() => setResetTokenInfo(null)}
        title="Token Pemulihan Kredensial Siswa"
        description="Sesuai kebijakan keamanan, kata sandi tidak pernah ditampilkan di tabel. Berikan token satu-kali ini kepada siswa."
        maxWidthClass="max-w-md"
        footer={
          <button
            type="button"
            onClick={() => setResetTokenInfo(null)}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
          >
            Selesai
          </button>
        }
      >
        {resetTokenInfo && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-2">
            <div className="text-xs text-slate-600">
              Token Pemulihan untuk <strong>{resetTokenInfo.studentName}</strong>:
            </div>
            <div className="text-xl font-mono font-bold text-blue-700 tracking-wider py-2 bg-white border border-slate-200 rounded-lg">
              {resetTokenInfo.token}
            </div>
            <div className="text-[11px] text-slate-500">
              Token ini berlaku selama 24 jam untuk mengatur ulang kata sandi melalui Supabase Auth pada Tahap 2.
            </div>
          </div>
        )}
      </ModalShell>

      <ExportReportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        initialReportType="grade_recap"
        initialClassId={classFilter}
      />
    </div>
  );
};
