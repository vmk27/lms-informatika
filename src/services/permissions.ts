import { User, UserRole, AdminMenuId } from '../types/lms';

export type PermissionAction =
  | 'manage_app_settings'
  | 'manage_admin_users'
  | 'manage_classes'
  | 'manage_students'
  | 'reset_student_credentials'
  | 'manage_materials'
  | 'manage_schedules'
  | 'manage_assignments'
  | 'grade_submissions'
  | 'manage_quizzes'
  | 'manage_grade_weights'
  | 'export_reports'
  | 'view_realtime_monitoring'
  | 'student_portal_access';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  super_admin: [
    'manage_app_settings',
    'manage_admin_users',
    'manage_classes',
    'manage_students',
    'reset_student_credentials',
    'manage_materials',
    'manage_schedules',
    'manage_assignments',
    'grade_submissions',
    'manage_quizzes',
    'manage_grade_weights',
    'export_reports',
    'view_realtime_monitoring',
  ],
  school_admin: [
    'manage_classes',
    'manage_students',
    'reset_student_credentials',
    'manage_materials',
    'manage_schedules',
    'manage_assignments',
    'grade_submissions',
    'manage_quizzes',
    'manage_grade_weights',
    'export_reports',
    'view_realtime_monitoring',
  ],
  teacher: [
    'manage_materials',
    'manage_schedules',
    'manage_assignments',
    'grade_submissions',
    'manage_quizzes',
    'manage_grade_weights',
    'export_reports',
    'view_realtime_monitoring',
  ],
  student: [
    'student_portal_access',
  ],
};

export function hasPermission(user: User | null, action: PermissionAction): boolean {
  if (!user || user.status !== 'active') return false;
  return ROLE_PERMISSIONS[user.role]?.includes(action) ?? false;
}

export function canAccessClassScope(user: User | null, classId: string): boolean {
  if (!user) return false;
  if (user.role === 'super_admin' || user.role === 'school_admin') return true;
  if (user.role === 'teacher') {
    if (!user.assignedClassIds || user.assignedClassIds.length === 0) return true;
    return user.assignedClassIds.includes(classId);
  }
  if (user.role === 'student') {
    return user.classId === classId;
  }
  return false;
}

export function canAccessAdminMenu(user: User | null, menuId: AdminMenuId): boolean {
  if (!user || user.role === 'student') return false;
  if (menuId === 'users') return hasPermission(user, 'manage_admin_users') || user.role === 'school_admin';
  if (menuId === 'settings') return hasPermission(user, 'manage_app_settings') || user.role === 'school_admin';
  return true;
}

export function assertPermission(user: User | null, action: PermissionAction, contextLabel?: string): void {
  if (!hasPermission(user, action)) {
    const roleLabel = user ? getRoleDisplayName(user.role) : 'Tamu';
    throw new Error(
      `Akses ditolak: Role "${roleLabel}" tidak memiliki izin untuk melakukan tindakan ${contextLabel || action}.`
    );
  }
}

export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Admin';
    case 'school_admin':
      return 'Admin Sekolah';
    case 'teacher':
      return 'Guru Mata Pelajaran';
    case 'student':
      return 'Siswa';
  }
}

export const PERMISSION_MATRIX_SUMMARY: {
  action: PermissionAction;
  label: string;
  roles: UserRole[];
}[] = [
  { action: 'manage_app_settings', label: 'Konfigurasi Sistem & Kebijakan Default', roles: ['super_admin'] },
  { action: 'manage_admin_users', label: 'Kelola Pengguna Admin & Hak Akses', roles: ['super_admin'] },
  { action: 'manage_classes', label: 'Tambah, Ubah, & Arsip Data Kelas', roles: ['super_admin', 'school_admin'] },
  { action: 'manage_students', label: 'Tambah, Ubah, & Impor CSV/XLSX Data Siswa', roles: ['super_admin', 'school_admin'] },
  { action: 'reset_student_credentials', label: 'Reset Kredensial Akun Siswa', roles: ['super_admin', 'school_admin'] },
  { action: 'manage_materials', label: 'Kelola Materi, Checkpoint, & Timer Baca', roles: ['super_admin', 'school_admin', 'teacher'] },
  { action: 'manage_schedules', label: 'Atur Jadwal Tayang Materi, Tugas, & Kuis', roles: ['super_admin', 'school_admin', 'teacher'] },
  { action: 'manage_assignments', label: 'Kelola Tugas & Prasyarat Materi', roles: ['super_admin', 'school_admin', 'teacher'] },
  { action: 'grade_submissions', label: 'Nilai Tugas, Rubrik, & Revisi Nilai', roles: ['super_admin', 'school_admin', 'teacher'] },
  { action: 'manage_quizzes', label: 'Kelola Kuis, Bank Soal, & Kunci Jawaban', roles: ['super_admin', 'school_admin', 'teacher'] },
  { action: 'view_realtime_monitoring', label: 'Monitoring Progress Belajar Real-Time', roles: ['super_admin', 'school_admin', 'teacher'] },
  { action: 'export_reports', label: 'Ekspor Laporan PDF, XLSX, & CSV', roles: ['super_admin', 'school_admin', 'teacher'] },
];
