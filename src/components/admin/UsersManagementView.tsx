import React, { useState } from 'react';
import { Plus, Shield, History, Edit3, Trash2 } from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { User, UserRole } from '../../types/lms';
import { ModalShell } from '../common/ModalShell';
import { PERMISSION_MATRIX_SUMMARY, getRoleDisplayName } from '../../services/permissions';
import { CompactPagination } from '../common/CompactPagination';

export const UsersManagementView: React.FC = () => {
  const { users, classes, currentUser, saveUser, deleteUser, auditLogs, requestConfirm, closeConfirm, addToast } =
    useLms();

  const [activeTab, setActiveTab] = useState<'users' | 'permissions' | 'audit'>('users');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewUser, setIsNewUser] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [userPageSize, setUserPageSize] = useState(8);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);
  const [form, setForm] = useState<User>(() => ({
    id: `usr-${Date.now()}`,
    name: '',
    username: '',
    email: '',
    role: 'teacher',
    status: 'active',
    assignedClassIds: ['cls-xi-mipa-1'],
    assignedSubjects: ['Fisika'],
    lastActiveAt: new Date().toISOString(),
  }));

  const staffUsers = users.filter((u) => u.role !== 'student');

  const openCreateUser = () => {
    setForm({
      id: `usr-${Date.now()}`,
      name: '',
      username: '',
      email: '',
      role: 'teacher',
      status: 'active',
      assignedClassIds: ['cls-xi-mipa-1'],
      assignedSubjects: ['Fisika'],
      lastActiveAt: new Date().toISOString(),
    });
    setIsNewUser(true);
    setIsModalOpen(true);
  };

  const openEditUser = (u: User) => {
    setForm({ ...u });
    setIsNewUser(false);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.username.trim()) {
      addToast({
        type: 'error',
        title: 'Validasi Gagal',
        description: 'Nama lengkap dan username login wajib diisi.',
      });
      return;
    }
    saveUser(
      {
        ...form,
        email: form.email || `${form.username}@sman1nusantara.sch.id`,
      },
      isNewUser
    );
    setIsModalOpen(false);
  };

  const totalUserPages = Math.ceil(staffUsers.length / userPageSize);
  const paginatedStaffUsers = staffUsers.slice(
    (userPage - 1) * userPageSize,
    userPage * userPageSize
  );

  const totalAuditPages = Math.ceil(auditLogs.length / auditPageSize);
  const paginatedAuditLogs = auditLogs.slice(
    (auditPage - 1) * auditPageSize,
    auditPage * auditPageSize
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#E5E9E3] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
        <div>
          <h1 className="text-xl font-bold text-[#202923]">Pengguna & Hak Akses (RBAC)</h1>
          <p className="text-xs text-[#68736B] mt-0.5">
            Kelola akun Super Admin, Admin Sekolah, dan Guru serta audit jejak aktivitas sistem.
          </p>
        </div>
        {activeTab === 'users' && (
          <button
            type="button"
            onClick={openCreateUser}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-[#276749] hover:bg-[#1F513A] rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun Pengajar / Admin</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white text-[#276749] shadow-sm border border-[#E5E9E3]'
              : 'text-[#68736B] hover:text-[#202923]'
          }`}
        >
          Daftar Pengguna ({staffUsers.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('permissions')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'permissions'
              ? 'bg-white text-[#276749] shadow-sm border border-[#E5E9E3]'
              : 'text-[#68736B] hover:text-[#202923]'
          }`}
        >
          Matriks Izin Role
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-white text-[#276749] shadow-sm border border-[#E5E9E3]'
              : 'text-[#68736B] hover:text-[#202923]'
          }`}
        >
          Log Jejak Audit
        </button>
      </div>

      {/* TAB 1: DAFTAR PENGGUNA */}
      {activeTab === 'users' && (
        <div className="bg-white border border-[#E5E9E3] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs min-w-[780px]">
              <thead>
                <tr className="bg-[#F7F7F2] border-b border-[#E5E9E3] text-[#68736B] text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="py-3 px-4 min-w-[200px]">Nama Lengkap & Email</th>
                  <th className="py-3 px-4 w-36">Username</th>
                  <th className="py-3 px-4 w-44">Peran / Hak Akses</th>
                  <th className="py-3 px-4 min-w-[220px]">Cakupan Kelas & Mapel</th>
                  <th className="py-3 px-4 w-28 text-center">Status</th>
                  <th className="py-3 px-4 w-28 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9E3]">
                {paginatedStaffUsers.map((u) => {
                  const assignedClasses = classes
                    .filter((c) => u.assignedClassIds?.includes(c.id))
                    .map((c) => c.name)
                    .join(', ');
                  return (
                    <tr key={u.id} className="hover:bg-[#E5F3E8]/40 transition-colors group">
                      <td className="py-3.5 px-4 align-middle">
                        <div className="font-bold text-[#202923] group-hover:text-[#276749] transition-colors">
                          {u.name}
                        </div>
                        <div className="text-[11px] text-[#858D86] font-mono mt-0.5">{u.email}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#276749] font-semibold align-middle">
                        {u.username}
                      </td>
                      <td className="py-3.5 px-4 align-middle">
                        <span className="px-2.5 py-1 bg-[#F7F7F2] rounded-md text-[#202923] font-semibold text-[11px] border border-[#E5E9E3] inline-block">
                          {getRoleDisplayName(u.role)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[#68736B] align-middle text-xs">
                        {u.role === 'teacher' ? (
                          <div className="space-y-0.5">
                            <div>
                              <strong className="text-[#202923]">Kelas:</strong>{' '}
                              {assignedClasses || 'Semua Kelas'}
                            </div>
                            <div className="text-[11px] text-[#858D86]">
                              <strong className="text-[#68736B]">Mapel:</strong>{' '}
                              {u.assignedSubjects?.join(', ') || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[#2F855A] font-semibold">
                            Seluruh Rombel Sekolah (Akses Penuh)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center align-middle">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#E5F3E8] text-[#2F855A] border border-[#48A878]/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#2F855A]" />
                          <span>Aktif</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right align-middle">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditUser(u)}
                            className="p-1.5 text-[#68736B] hover:text-[#276749] hover:bg-[#E5F3E8] border border-transparent hover:border-[#48A878]/30 rounded-lg transition-colors cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              type="button"
                              onClick={() =>
                                requestConfirm({
                                  title: `Hapus Akun "${u.name}"?`,
                                  description: 'Tindakan ini tidak dapat dibatalkan.',
                                  confirmLabel: 'Hapus Pengguna',
                                  variant: 'danger',
                                  onConfirm: () => {
                                    deleteUser(u.id);
                                    closeConfirm();
                                  },
                                })
                              }
                              className="p-1.5 text-[#858D86] hover:text-[#D9534F] hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Compact Pagination for Users */}
          <CompactPagination
            currentPage={userPage}
            totalPages={totalUserPages}
            totalItems={staffUsers.length}
            pageSize={userPageSize}
            onPageChange={(p) => setUserPage(p)}
            onPageSizeChange={(sz) => {
              setUserPageSize(sz);
              setUserPage(1);
            }}
            itemLabel="pengguna"
          />
        </div>
      )}

      {/* TAB 2: MATRIKS IZIN ROLE */}
      {activeTab === 'permissions' && (
        <div className="bg-white border border-[#E5E9E3] rounded-xl shadow-xs overflow-hidden p-5 space-y-4">
          <div>
            <h2 className="text-sm font-bold text-[#202923]">
              Matriks Validasi Otorisasi Berbasis Peran
            </h2>
            <p className="text-xs text-[#68736B] mt-0.5">
              Validasi izin ditegakkan pada tingkat service layer dan dipersiapkan untuk Row Level Security (RLS) Supabase.
            </p>
          </div>

          <div className="overflow-x-auto border border-[#E5E9E3] rounded-lg">
            <table className="w-full text-left border-collapse text-xs min-w-[640px]">
              <thead>
                <tr className="bg-[#F7F7F2] border-b border-[#E5E9E3] text-[#68736B] text-[11px] font-bold uppercase tracking-wider select-none">
                  <th className="py-3 px-4">Tindakan / Hak Akses</th>
                  <th className="py-3 px-4 text-center w-32">Super Admin</th>
                  <th className="py-3 px-4 text-center w-32">Admin Sekolah</th>
                  <th className="py-3 px-4 text-center w-36">Guru Pengampu</th>
                  <th className="py-3 px-4 text-center w-28">Siswa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E9E3]">
                {PERMISSION_MATRIX_SUMMARY.map((row) => (
                  <tr key={row.action} className="hover:bg-[#F7F7F2]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-[#202923]">{row.label}</td>
                    <td className="py-3 px-4 text-center font-bold text-[#2F855A]">
                      <span className="w-5 h-5 rounded-full bg-[#E5F3E8] text-[#2F855A] inline-flex items-center justify-center text-xs">
                        ✓
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {row.roles.includes('school_admin') ? (
                        <span className="w-5 h-5 rounded-full bg-[#E5F3E8] text-[#2F855A] inline-flex items-center justify-center text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[#858D86]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {row.roles.includes('teacher') ? (
                        <span className="w-5 h-5 rounded-full bg-[#E5F3E8] text-[#2F855A] inline-flex items-center justify-center text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[#858D86]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {row.roles.includes('student') ? (
                        <span className="w-5 h-5 rounded-full bg-[#E5F3E8] text-[#2F855A] inline-flex items-center justify-center text-xs">
                          ✓
                        </span>
                      ) : (
                        <span className="text-[#858D86]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LOG JEJAK AUDIT */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-[#E5E9E3] rounded-xl overflow-hidden p-5 space-y-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#202923]">
                Jejak Audit Aktivitas Penting
              </h2>
              <p className="text-xs text-[#68736B]">
                Mencatat perubahan nilai, jadwal tayang, penyelesaian materi, dan penghapusan data.
              </p>
            </div>
            <History className="w-4 h-4 text-[#858D86]" />
          </div>

          <div className="space-y-3">
            {paginatedAuditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 bg-[#F7F7F2] border border-[#E5E9E3] rounded-lg flex items-start justify-between gap-4 text-xs hover:border-[#48A878] transition-colors"
              >
                <div>
                  <div className="font-semibold text-[#202923] flex items-center gap-2">
                    <span>{log.action}</span>
                    <span className="font-normal text-[#68736B]">· {log.targetName}</span>
                  </div>
                  <div className="text-[#68736B] mt-0.5">{log.details}</div>
                  <div className="text-[11px] text-[#858D86] mt-1">
                    Dilakukan oleh <strong className="text-[#202923]">{log.actorName}</strong> ({getRoleDisplayName(log.actorRole)})
                  </div>
                </div>
                <div className="font-mono text-[#858D86] text-[11px] shrink-0">
                  {new Date(log.timestamp).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          {/* Compact Pagination for Audit Logs */}
          <div className="border border-[#E5E9E3] rounded-xl overflow-hidden mt-4">
            <CompactPagination
              currentPage={auditPage}
              totalPages={totalAuditPages}
              totalItems={auditLogs.length}
              pageSize={auditPageSize}
              onPageChange={(p) => setAuditPage(p)}
              onPageSizeChange={(sz) => {
                setAuditPageSize(sz);
                setAuditPage(1);
              }}
              itemLabel="aktivitas"
            />
          </div>
        </div>
      )}

      {/* Modal Tambah / Edit Pengguna */}
      <ModalShell
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isNewUser ? 'Tambah Akun Pengajar / Admin' : `Edit Akun — ${form.name}`}
        description="Atur nama, peran, dan pembagian rombel belajar pengajar."
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
              Simpan Akun
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nama Lengkap & Gelar <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Username Login <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase() })}
                className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Peran Pengguna (Role)
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg"
              >
                <option value="teacher">Guru Mata Pelajaran</option>
                <option value="school_admin">Admin Sekolah</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </div>
          </div>

          {form.role === 'teacher' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Penugasan Rombel Kelas
              </label>
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                {classes.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-xs text-slate-800">
                    <input
                      type="checkbox"
                      checked={form.assignedClassIds?.includes(c.id)}
                      onChange={(e) => {
                        const current = form.assignedClassIds || [];
                        const next = e.target.checked
                          ? [...current, c.id]
                          : current.filter((id) => id !== c.id);
                        setForm({ ...form, assignedClassIds: next });
                      }}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    <span>{c.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      </ModalShell>
    </div>
  );
};
