import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  SchoolClass,
  Material,
  ReadingSession,
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizAttempt,
  GradeWeightConfig,
  AuditLogEntry,
  SchoolSettings,
  AdminMenuId,
  StudentMenuId,
  NavigationFilterState,
} from '../types/lms';
import { lmsRepository, LmsPersistedState } from '../repositories/lmsRepository';
import { assertPermission } from '../services/permissions';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
}

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
  onConfirm: () => void;
}

interface LmsContextValue extends LmsPersistedState {
  currentUser: User | null;
  portalMode: 'admin' | 'student' | 'login';
  activeAdminMenu: AdminMenuId;
  activeStudentMenu: StudentMenuId;
  selectedMaterialId: string | null;
  selectedAssignmentId: string | null;
  selectedQuizId: string | null;
  navFilter: NavigationFilterState;
  isOnline: boolean;
  isDemoRealtimeActive: boolean;
  lastRealtimeSyncAt: string;
  simulatedNow: string;
  toasts: ToastMessage[];
  confirmDialog: ConfirmDialogState | null;

  // Navigation & Auth
  loginAsUser: (userId: string) => void;
  logout: () => void;
  navigateAdmin: (menu: AdminMenuId, filter?: NavigationFilterState) => void;
  navigateStudent: (
    menu: StudentMenuId,
    options?: { materialId?: string; assignmentId?: string; quizId?: string }
  ) => void;
  setSimulatedOnline: (online: boolean) => void;
  setDemoRealtimeActive: (active: boolean) => void;
  setSimulatedNow: (isoDate: string) => void;
  resetDemoDatabase: () => void;

  // UI Helpers
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  requestConfirm: (dialog: Omit<ConfirmDialogState, 'isOpen'>) => void;
  closeConfirm: () => void;

  // Domain Mutations — Materials & Schedules
  saveMaterial: (material: Material, isNew: boolean) => void;
  duplicateMaterial: (materialId: string) => void;
  deleteMaterial: (materialId: string) => void;
  updateMaterialSchedule: (
    materialId: string,
    status: Material['status'],
    publishStartAt: string,
    publishEndAt: string
  ) => void;

  // Domain Mutations — Reading Sessions (Section H)
  recordReadingHeartbeat: (
    session: ReadingSession,
    sequenceNumber: number
  ) => ReadingSession;
  completeReadingMaterial: (
    studentId: string,
    materialId: string
  ) => { ok: boolean; reason?: string };

  // Domain Mutations — Assignments & Grading
  saveAssignment: (assignment: Assignment, isNew: boolean) => void;
  duplicateAssignment: (assignmentId: string) => void;
  deleteAssignment: (assignmentId: string) => void;
  submitStudentAssignment: (
    assignmentId: string,
    studentId: string,
    textAnswer: string,
    files: { name: string; size: string; uploadedAt: string }[]
  ) => void;
  gradeAssignmentSubmission: (
    submissionId: string,
    score: number,
    feedback: string,
    reasonForRevision?: string,
    rubricScores?: Record<string, number>
  ) => void;

  // Domain Mutations — Quizzes
  saveQuiz: (quiz: Quiz, isNew: boolean) => void;
  duplicateQuiz: (quizId: string) => void;
  deleteQuiz: (quizId: string) => void;
  startOrResumeQuizAttempt: (quizId: string, studentId: string) => QuizAttempt;
  saveQuizAttemptProgress: (
    attemptId: string,
    answers: Record<string, string>,
    remainingSeconds: number,
    submitFinal: boolean
  ) => QuizAttempt;

  // Domain Mutations — Classes & Students & Users
  saveClass: (schoolClass: SchoolClass, isNew: boolean) => void;
  deleteClass: (classId: string) => void;
  saveUser: (user: User, isNew: boolean) => void;
  importStudentsBatch: (
    newStudents: Omit<User, 'id' | 'role' | 'lastActiveAt'>[]
  ) => { importedCount: number; skippedCount: number; errors: string[] };
  deleteUser: (userId: string) => void;
  resetStudentCredential: (studentId: string) => string;

  // Domain Mutations — Grades & Settings
  updateGradeWeights: (weights: GradeWeightConfig) => void;
  updateSchoolSettings: (settings: SchoolSettings) => void;
  isMaterialCompletedByStudent: (studentId: string, materialId: string) => boolean;
}

const LmsContext = createContext<LmsContextValue | null>(null);

export const LmsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LmsPersistedState>(() => lmsRepository.loadState());
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    return localStorage.getItem('sinaura_current_user_id') || 'usr-super-admin';
  });
  const [portalMode, setPortalMode] = useState<'admin' | 'student' | 'login'>(() => {
    const saved = localStorage.getItem('sinaura_portal_mode');
    if (saved === 'student' || saved === 'login' || saved === 'admin') return saved;
    return 'admin';
  });

  const [activeAdminMenu, setActiveAdminMenu] = useState<AdminMenuId>('dashboard');
  const [activeStudentMenu, setActiveStudentMenu] = useState<StudentMenuId>('home');
  const [selectedMaterialId, setSelectedMaterialId] = useState<string | null>('mat-fis-termo');
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<string | null>('asg-fis-carnot');
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>('qz-fis-termo-1');
  const [navFilter, setNavFilter] = useState<NavigationFilterState>({});

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [isDemoRealtimeActive, setIsDemoRealtimeActive] = useState<boolean>(true);
  const [lastRealtimeSyncAt, setLastRealtimeSyncAt] = useState<string>(() =>
    new Date().toISOString()
  );
  const [simulatedNow, setSimulatedNow] = useState<string>('2026-10-01T13:00');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const currentUser = state.users.find((u) => u.id === currentUserId) || null;

  const persistAndSet = useCallback(
    (updater: (prev: LmsPersistedState) => LmsPersistedState) => {
      setState((prev) => {
        const next = updater(prev);
        lmsRepository.saveState(next);
        return next;
      });
    },
    []
  );

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `tst-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Dynamic Browser Network Listener (navigator.onLine)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      persistAndSet((prev) => ({
        ...prev,
        readingSessions: prev.readingSessions.map((s) =>
          s.sync_status === 'pending_offline' ? { ...s, sync_status: 'synced' } : s
        ),
      }));
      setLastRealtimeSyncAt(new Date().toISOString());
      addToast({
        type: 'success',
        title: 'Koneksi Terhubung',
        description: 'Jaringan aktif kembali. Sesi belajar dan antrean data berhasil disinkronkan.',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      addToast({
        type: 'warning',
        title: 'Koneksi Terputus (Mode Offline)',
        description: 'Perangkat sedang offline. Aktivitas tetap dicatat di penyimpanan lokal secara aman.',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [persistAndSet, addToast]);

  const requestConfirm = useCallback((dialog: Omit<ConfirmDialogState, 'isOpen'>) => {
    setConfirmDialog({ ...dialog, isOpen: true });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirmDialog(null);
  }, []);

  const appendAuditLog = useCallback(
    (
      prev: LmsPersistedState,
      action: string,
      category: AuditLogEntry['category'],
      targetName: string,
      details: string
    ): AuditLogEntry[] => {
      const entry: AuditLogEntry = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: new Date().toISOString(),
        actorId: currentUser?.id || 'system',
        actorName: currentUser?.name || 'Sistem',
        actorRole: currentUser?.role || 'super_admin',
        action,
        category,
        targetName,
        details,
      };
      return [entry, ...prev.auditLogs];
    },
    [currentUser]
  );

  // Simulasi pembaruan detak jantung siswa di halaman Monitoring Real-Time (Mode DEMO)
  useEffect(() => {
    if (!isDemoRealtimeActive || !isOnline) return;
    const interval = setInterval(() => {
      setState((prev) => {
        const updatedSessions = prev.readingSessions.map((ses) => {
          // Jangan ganggu sesi siswa yang sedang digunakan di portal student oleh currentUser
          if (portalMode === 'student' && ses.student_id === currentUser?.id) {
            return ses;
          }
          if (ses.completion_status === 'active') {
            const mat = prev.materials.find((m) => m.id === ses.material_id);
            const targetSec = (mat?.minReadMinutes || 15) * 60;
            const nextSec = ses.active_duration_seconds + 5;
            return {
              ...ses,
              active_duration_seconds: Math.min(nextSec, targetSec + 120),
              last_heartbeat_at: new Date().toISOString(),
              last_sequence_number: ses.last_sequence_number + 1,
            };
          }
          return ses;
        });
        const nextState = { ...prev, readingSessions: updatedSessions };
        lmsRepository.saveState(nextState);
        return nextState;
      });
      setLastRealtimeSyncAt(new Date().toISOString());
    }, 5000);
    return () => clearInterval(interval);
  }, [isDemoRealtimeActive, isOnline, portalMode, currentUser?.id]);

  // Saat koneksi kembali online, sinkronkan sesi yang pending_offline
  const setSimulatedOnline = useCallback(
    (online: boolean) => {
      setIsOnline(online);
      if (online) {
        persistAndSet((prev) => ({
          ...prev,
          readingSessions: prev.readingSessions.map((s) =>
            s.sync_status === 'pending_offline' ? { ...s, sync_status: 'synced' } : s
          ),
        }));
        setLastRealtimeSyncAt(new Date().toISOString());
        addToast({
          type: 'success',
          title: 'Koneksi Terhubung Kembali',
          description: 'Antrean sesi baca dan jawaban lokal berhasil disinkronkan ke repository.',
        });
      } else {
        addToast({
          type: 'warning',
          title: 'Mode Offline Aktif (Simulasi)',
          description:
            'Data disimpan di penyimpanan lokal. Penyelesaian materi dikunci hingga koneksi kembali online.',
        });
      }
    },
    [persistAndSet, addToast]
  );

  const loginAsUser = useCallback(
    (userId: string) => {
      const target = state.users.find((u) => u.id === userId);
      if (!target) return;
      if (target.status !== 'active') {
        addToast({
          type: 'error',
          title: 'Akun Tidak Aktif',
          description: `Akun ${target.name} sedang dinonaktifkan oleh Admin Sekolah.`,
        });
        return;
      }
      setCurrentUserId(target.id);
      localStorage.setItem('sinaura_current_user_id', target.id);
      const nextMode = target.role === 'student' ? 'student' : 'admin';
      setPortalMode(nextMode);
      localStorage.setItem('sinaura_portal_mode', nextMode);
      addToast({
        type: 'info',
        title: `Masuk sebagai ${target.name}`,
        description:
          nextMode === 'student'
            ? 'Student Learning Portal aktif.'
            : 'Dashboard Admin / Guru aktif.',
      });
    },
    [state.users, addToast]
  );

  const logout = useCallback(() => {
    setPortalMode('login');
    localStorage.setItem('sinaura_portal_mode', 'login');
    addToast({
      type: 'info',
      title: 'Sesi Ditutup',
      description: 'Seluruh progress belajar telah disimpan dengan aman.',
    });
  }, [addToast]);

  const navigateAdmin = useCallback((menu: AdminMenuId, filter?: NavigationFilterState) => {
    setActiveAdminMenu(menu);
    setNavFilter(filter || {});
  }, []);

  const navigateStudent = useCallback(
    (
      menu: StudentMenuId,
      options?: { materialId?: string; assignmentId?: string; quizId?: string }
    ) => {
      if (options?.materialId) setSelectedMaterialId(options.materialId);
      if (options?.assignmentId) setSelectedAssignmentId(options.assignmentId);
      if (options?.quizId) setSelectedQuizId(options.quizId);
      setActiveStudentMenu(menu);
    },
    []
  );

  const resetDemoDatabase = useCallback(() => {
    const fresh = lmsRepository.resetToDefaults();
    setState(fresh);
    addToast({
      type: 'info',
      title: 'Data Demo Direset',
      description: 'Seluruh data contoh berhasil dikembalikan ke kondisi awal.',
    });
  }, [addToast]);

  const isMaterialCompletedByStudent = useCallback(
    (studentId: string, materialId: string): boolean => {
      const ses = state.readingSessions.find(
        (s) => s.student_id === studentId && s.material_id === materialId
      );
      return ses?.completion_status === 'completed';
    },
    [state.readingSessions]
  );

  // --- Materials & Schedules ---
  const saveMaterial = useCallback(
    (material: Material, isNew: boolean) => {
      assertPermission(currentUser, 'manage_materials', 'menyimpan materi');
      persistAndSet((prev) => {
        const materials = isNew
          ? [material, ...prev.materials]
          : prev.materials.map((m) => (m.id === material.id ? material : m));
        return {
          ...prev,
          materials,
          auditLogs: appendAuditLog(
            prev,
            isNew ? 'Menambahkan Materi Baru' : 'Memperbarui Materi',
            'material',
            material.title,
            `Mapel: ${material.subject}, Waktu baca min: ${material.minReadMinutes} menit, Status: ${material.status}.`
          ),
        };
      });
      addToast({
        type: 'success',
        title: isNew ? 'Materi Berhasil Ditambahkan' : 'Materi Diperbarui',
        description: `"${material.title}" telah disimpan.`,
      });
    },
    [currentUser, persistAndSet, appendAuditLog, addToast]
  );

  const duplicateMaterial = useCallback(
    (materialId: string) => {
      assertPermission(currentUser, 'manage_materials', 'menduplikasi materi');
      const source = state.materials.find((m) => m.id === materialId);
      if (!source) return;
      const copy: Material = {
        ...source,
        id: `mat-${Date.now()}`,
        title: `${source.title} (Salinan)`,
        status: 'draft',
        updatedAt: new Date().toISOString(),
      };
      saveMaterial(copy, true);
    },
    [currentUser, state.materials, saveMaterial]
  );

  const deleteMaterial = useCallback(
    (materialId: string) => {
      assertPermission(currentUser, 'manage_materials', 'menghapus materi');
      const target = state.materials.find((m) => m.id === materialId);
      if (!target) return;
      persistAndSet((prev) => ({
        ...prev,
        materials: prev.materials.filter((m) => m.id !== materialId),
        auditLogs: appendAuditLog(
          prev,
          'Menghapus Materi',
          'material',
          target.title,
          `Materi ID ${materialId} dihapus oleh ${currentUser?.name}.`
        ),
      }));
      addToast({
        type: 'info',
        title: 'Materi Dihapus',
        description: `"${target.title}" telah dihapus dari daftar materi.`,
      });
    },
    [currentUser, state.materials, persistAndSet, appendAuditLog, addToast]
  );

  const updateMaterialSchedule = useCallback(
    (
      materialId: string,
      status: Material['status'],
      publishStartAt: string,
      publishEndAt: string
    ) => {
      assertPermission(currentUser, 'manage_schedules', 'mengatur jadwal tayang');
      const target = state.materials.find((m) => m.id === materialId);
      if (!target) return;
      persistAndSet((prev) => ({
        ...prev,
        materials: prev.materials.map((m) =>
          m.id === materialId
            ? { ...m, status, publishStartAt, publishEndAt, updatedAt: new Date().toISOString() }
            : m
        ),
        auditLogs: appendAuditLog(
          prev,
          'Perubahan Jadwal Tayang',
          'schedule',
          target.title,
          `Status diubah ke "${status}" (${publishStartAt} s/d ${publishEndAt}).`
        ),
      }));
      addToast({
        type: 'success',
        title: 'Jadwal Tayang Diperbarui',
        description: `Jadwal untuk "${target.title}" berhasil disimpan.`,
      });
    },
    [currentUser, state.materials, persistAndSet, appendAuditLog, addToast]
  );

  // --- Reading Sessions (Section H) ---
  const recordReadingHeartbeat = useCallback(
    (session: ReadingSession, sequenceNumber: number): ReadingSession => {
      const { session: saved } = lmsRepository.upsertReadingSessionHeartbeat(
        session,
        sequenceNumber,
        isOnline
      );
      setState(lmsRepository.loadState());
      if (isOnline) {
        setLastRealtimeSyncAt(new Date().toISOString());
      }
      return saved;
    },
    [isOnline]
  );

  const completeReadingMaterial = useCallback(
    (studentId: string, materialId: string): { ok: boolean; reason?: string } => {
      if (!isOnline) {
        return {
          ok: false,
          reason:
            'Koneksi sedang offline. Sinkronisasi dan validasi server diperlukan sebelum materi dapat ditandai selesai.',
        };
      }
      const material = state.materials.find((m) => m.id === materialId);
      const session = state.readingSessions.find(
        (s) => s.student_id === studentId && s.material_id === materialId
      );
      if (!material || !session) {
        return { ok: false, reason: 'Sesi belajar belum ditemukan.' };
      }

      const requiredSeconds = material.minReadMinutes * 60;
      if (session.active_duration_seconds < requiredSeconds) {
        const remaining = requiredSeconds - session.active_duration_seconds;
        return {
          ok: false,
          reason: `Durasi membaca aktif belum mencapai batas minimum (${Math.ceil(
            remaining / 60
          )} menit lagi).`,
        };
      }

      if (material.requireAllCheckpoints) {
        const requiredCps = material.checkpoints.filter((c) => c.required);
        const missingCp = requiredCps.find(
          (c) => !session.reached_checkpoints.includes(c.id)
        );
        if (missingCp) {
          return {
            ok: false,
            reason: `Checkpoint wajib belum ditandai: "${missingCp.title}".`,
          };
        }
      }

      if (material.requireComprehensionPass && material.comprehensionQuestions.length > 0) {
        const unansweredOrWrong = material.comprehensionQuestions.find(
          (q) => session.answered_questions[q.id] !== q.correctOptionIndex
        );
        if (unansweredOrWrong) {
          return {
            ok: false,
            reason: 'Seluruh pertanyaan pemahaman wajib dijawab dengan benar.',
          };
        }
      }

      const nowIso = new Date().toISOString();
      persistAndSet((prev) => ({
        ...prev,
        readingSessions: prev.readingSessions.map((s) =>
          s.student_id === studentId && s.material_id === materialId
            ? {
                ...s,
                completion_status: 'completed',
                completed_at: nowIso,
                last_heartbeat_at: nowIso,
                sync_status: 'synced',
              }
            : s
        ),
        auditLogs: appendAuditLog(
          prev,
          'Menyelesaikan Materi',
          'reading_session',
          material.title,
          `Siswa menyelesaikan materi dengan waktu aktif ${Math.floor(
            session.active_duration_seconds / 60
          )}m ${session.active_duration_seconds % 60}d.`
        ),
      }));

      addToast({
        type: 'success',
        title: 'Materi Selesai Dipelajari',
        description: `Selamat! Anda telah menyelesaikan "${material.title}" dan membuka tugas/kuis terkait.`,
      });

      return { ok: true };
    },
    [isOnline, state.materials, state.readingSessions, persistAndSet, appendAuditLog, addToast]
  );

  // --- Assignments ---
  const saveAssignment = useCallback(
    (assignment: Assignment, isNew: boolean) => {
      assertPermission(currentUser, 'manage_assignments', 'menyimpan tugas');
      persistAndSet((prev) => ({
        ...prev,
        assignments: isNew
          ? [assignment, ...prev.assignments]
          : prev.assignments.map((a) => (a.id === assignment.id ? assignment : a)),
        auditLogs: appendAuditLog(
          prev,
          isNew ? 'Membuat Tugas Baru' : 'Memperbarui Tugas',
          'assignment',
          assignment.title,
          `Tenggat: ${assignment.dueDate}, Status: ${assignment.status}.`
        ),
      }));
      addToast({
        type: 'success',
        title: isNew ? 'Tugas Berhasil Dibuat' : 'Tugas Diperbarui',
        description: `"${assignment.title}" telah disimpan.`,
      });
    },
    [currentUser, persistAndSet, appendAuditLog, addToast]
  );

  const duplicateAssignment = useCallback(
    (assignmentId: string) => {
      assertPermission(currentUser, 'manage_assignments', 'menduplikasi tugas');
      const src = state.assignments.find((a) => a.id === assignmentId);
      if (!src) return;
      saveAssignment(
        {
          ...src,
          id: `asg-${Date.now()}`,
          title: `${src.title} (Salinan)`,
          status: 'draft',
        },
        true
      );
    },
    [currentUser, state.assignments, saveAssignment]
  );

  const deleteAssignment = useCallback(
    (assignmentId: string) => {
      assertPermission(currentUser, 'manage_assignments', 'menghapus tugas');
      const target = state.assignments.find((a) => a.id === assignmentId);
      if (!target) return;
      persistAndSet((prev) => ({
        ...prev,
        assignments: prev.assignments.filter((a) => a.id !== assignmentId),
        auditLogs: appendAuditLog(
          prev,
          'Menghapus Tugas',
          'assignment',
          target.title,
          `Tugas dihapus oleh ${currentUser?.name}.`
        ),
      }));
      addToast({
        type: 'info',
        title: 'Tugas Dihapus',
        description: `"${target.title}" telah dihapus.`,
      });
    },
    [currentUser, state.assignments, persistAndSet, appendAuditLog, addToast]
  );

  const submitStudentAssignment = useCallback(
    (
      assignmentId: string,
      studentId: string,
      textAnswer: string,
      files: { name: string; size: string; uploadedAt: string }[]
    ) => {
      const assignment = state.assignments.find((a) => a.id === assignmentId);
      if (!assignment) return;

      const isLate = new Date(simulatedNow) > new Date(assignment.dueDate);
      const nowIso = new Date().toISOString();

      persistAndSet((prev) => {
        const existingIdx = prev.submissions.findIndex(
          (s) => s.assignmentId === assignmentId && s.studentId === studentId
        );
        let nextSubmissions = [...prev.submissions];
        if (existingIdx >= 0) {
          const existing = nextSubmissions[existingIdx];
          nextSubmissions[existingIdx] = {
            ...existing,
            status: isLate ? 'late' : 'submitted',
            submittedAt: nowIso,
            attemptCount: existing.attemptCount + 1,
            textAnswer,
            fileAttachments: files,
          };
        } else {
          nextSubmissions.push({
            id: `sub-${Date.now()}`,
            assignmentId,
            studentId,
            status: isLate ? 'late' : 'submitted',
            submittedAt: nowIso,
            attemptCount: 1,
            textAnswer,
            fileAttachments: files,
            score: null,
            teacherFeedback: '',
            gradedByName: null,
            gradedAt: null,
            revisionHistory: [],
          });
        }
        return {
          ...prev,
          submissions: nextSubmissions,
          auditLogs: appendAuditLog(
            prev,
            'Mengumpulkan Tugas',
            'assignment',
            assignment.title,
            `Pengumpulan ke-${existingIdx >= 0 ? prev.submissions[existingIdx].attemptCount + 1 : 1}${
              isLate ? ' (Terlambat)' : ''
            }.`
          ),
        };
      });

      addToast({
        type: 'success',
        title: 'Jawaban Tugas Terkirim',
        description: `Jawaban untuk "${assignment.title}" berhasil disimpan.`,
      });
    },
    [state.assignments, simulatedNow, persistAndSet, appendAuditLog, addToast]
  );

  const gradeAssignmentSubmission = useCallback(
    (
      submissionId: string,
      score: number,
      feedback: string,
      reasonForRevision?: string,
      rubricScores?: Record<string, number>
    ) => {
      assertPermission(currentUser, 'grade_submissions', 'menilai tugas');
      const nowIso = new Date().toISOString();
      persistAndSet((prev) => {
        const target = prev.submissions.find((s) => s.id === submissionId);
        if (!target) return prev;
        const student = prev.users.find((u) => u.id === target.studentId);
        const assignment = prev.assignments.find((a) => a.id === target.assignmentId);

        const nextHistory = [...target.revisionHistory];
        if (target.score !== null && target.score !== score) {
          nextHistory.push({
            id: `rev-${Date.now()}`,
            previousScore: target.score,
            newScore: score,
            changedByName: currentUser?.name || 'Guru',
            changedAt: nowIso,
            reason: reasonForRevision || 'Pembaruan penilaian guru',
          });
        }

        const updatedSubmissions = prev.submissions.map((s) =>
          s.id === submissionId
            ? {
                ...s,
                status: 'graded' as const,
                score,
                rubricScores: rubricScores ?? s.rubricScores,
                teacherFeedback: feedback,
                gradedByName: currentUser?.name || 'Guru',
                gradedAt: nowIso,
                revisionHistory: nextHistory,
              }
            : s
        );

        return {
          ...prev,
          submissions: updatedSubmissions,
          auditLogs: appendAuditLog(
            prev,
            target.score !== null ? 'Revisi Nilai Tugas' : 'Memberikan Nilai Tugas',
            'grade',
            `${student?.name || 'Siswa'} — ${assignment?.title || 'Tugas'}`,
            `Nilai: ${score} (Sebelumnya: ${target.score ?? 'Belum dinilai'}). ${
              reasonForRevision ? `Alasan: ${reasonForRevision}` : ''
            }`
          ),
        };
      });

      addToast({
        type: 'success',
        title: 'Nilai Tugas Tersimpan',
        description: 'Nilai, rubrik, dan umpan balik guru telah diperbarui.',
      });
    },
    [currentUser, persistAndSet, appendAuditLog, addToast]
  );

  // --- Quizzes ---
  const saveQuiz = useCallback(
    (quiz: Quiz, isNew: boolean) => {
      assertPermission(currentUser, 'manage_quizzes', 'menyimpan kuis');
      persistAndSet((prev) => ({
        ...prev,
        quizzes: isNew
          ? [quiz, ...prev.quizzes]
          : prev.quizzes.map((q) => (q.id === quiz.id ? quiz : q)),
        auditLogs: appendAuditLog(
          prev,
          isNew ? 'Membuat Kuis Baru' : 'Memperbarui Kuis',
          'quiz',
          quiz.title,
          `Jumlah soal: ${quiz.questions.length}, Durasi: ${quiz.durationMinutes} menit.`
        ),
      }));
      addToast({
        type: 'success',
        title: isNew ? 'Kuis Berhasil Dibuat' : 'Kuis Diperbarui',
        description: `"${quiz.title}" telah disimpan.`,
      });
    },
    [currentUser, persistAndSet, appendAuditLog, addToast]
  );

  const duplicateQuiz = useCallback(
    (quizId: string) => {
      assertPermission(currentUser, 'manage_quizzes', 'menduplikasi kuis');
      const src = state.quizzes.find((q) => q.id === quizId);
      if (!src) return;
      saveQuiz(
        {
          ...src,
          id: `qz-${Date.now()}`,
          title: `${src.title} (Salinan)`,
          status: 'draft',
        },
        true
      );
    },
    [currentUser, state.quizzes, saveQuiz]
  );

  const deleteQuiz = useCallback(
    (quizId: string) => {
      assertPermission(currentUser, 'manage_quizzes', 'menghapus kuis');
      const target = state.quizzes.find((q) => q.id === quizId);
      if (!target) return;
      persistAndSet((prev) => ({
        ...prev,
        quizzes: prev.quizzes.filter((q) => q.id !== quizId),
        auditLogs: appendAuditLog(
          prev,
          'Menghapus Kuis',
          'quiz',
          target.title,
          `Kuis dihapus oleh ${currentUser?.name}.`
        ),
      }));
      addToast({
        type: 'info',
        title: 'Kuis Dihapus',
        description: `"${target.title}" telah dihapus.`,
      });
    },
    [currentUser, state.quizzes, persistAndSet, appendAuditLog, addToast]
  );

  const startOrResumeQuizAttempt = useCallback(
    (quizId: string, studentId: string): QuizAttempt => {
      const quiz = state.quizzes.find((q) => q.id === quizId);
      if (!quiz) throw new Error('Kuis tidak ditemukan.');

      const existingInProgress = state.quizAttempts.find(
        (a) => a.quizId === quizId && a.studentId === studentId && a.status === 'in_progress'
      );
      if (existingInProgress) return existingInProgress;

      const completedCount = state.quizAttempts.filter(
        (a) => a.quizId === quizId && a.studentId === studentId && a.status === 'completed'
      ).length;

      const maxPoints = quiz.questions.reduce((acc, q) => acc + q.points, 0) || 100;
      const newAttempt: QuizAttempt = {
        id: `att-qz-${Date.now()}`,
        quizId,
        studentId,
        attemptNumber: completedCount + 1,
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        submittedAt: null,
        lastSavedAt: new Date().toISOString(),
        remainingSeconds: quiz.durationMinutes * 60,
        answers: {},
        score: null,
        maxPossibleScore: maxPoints,
      };

      persistAndSet((prev) => ({
        ...prev,
        quizAttempts: [...prev.quizAttempts, newAttempt],
      }));

      return newAttempt;
    },
    [state.quizzes, state.quizAttempts, persistAndSet]
  );

  const saveQuizAttemptProgress = useCallback(
    (
      attemptId: string,
      answers: Record<string, string>,
      remainingSeconds: number,
      submitFinal: boolean
    ): QuizAttempt => {
      let updatedAttempt!: QuizAttempt;
      persistAndSet((prev) => {
        const target = prev.quizAttempts.find((a) => a.id === attemptId);
        if (!target) return prev;
        const quiz = prev.quizzes.find((q) => q.id === target.quizId);

        let earnedScore: number | null = target.score;
        const maxPoints =
          quiz?.questions.reduce((acc, q) => acc + q.points, 0) || target.maxPossibleScore || 100;

        if (submitFinal && quiz) {
          let rawPoints = 0;
          for (const q of quiz.questions) {
            const studentAns = (answers[q.id] ?? '').trim().toLowerCase();
            const keyAns = q.correctAnswer.trim().toLowerCase();
            if (studentAns && studentAns === keyAns) {
              rawPoints += q.points;
            }
          }
          earnedScore = Math.round((rawPoints / maxPoints) * 100);
        }

        updatedAttempt = {
          ...target,
          answers,
          remainingSeconds: Math.max(0, remainingSeconds),
          lastSavedAt: new Date().toISOString(),
          status: submitFinal ? 'completed' : 'in_progress',
          submittedAt: submitFinal ? new Date().toISOString() : null,
          score: earnedScore,
          maxPossibleScore: maxPoints,
        };

        return {
          ...prev,
          quizAttempts: prev.quizAttempts.map((a) => (a.id === attemptId ? updatedAttempt : a)),
          auditLogs: submitFinal
            ? appendAuditLog(
                prev,
                'Menyelesaikan Kuis',
                'quiz',
                quiz?.title || 'Kuis',
                `Percobaan #${target.attemptNumber} selesai dengan nilai ${earnedScore}/100.`
              )
            : prev.auditLogs,
        };
      });

      if (submitFinal) {
        addToast({
          type: 'success',
          title: 'Kuis Berhasil Dikumpulkan',
          description: `Jawaban Anda telah dinilai. Skor akhir: ${updatedAttempt?.score ?? 0}/100.`,
        });
      }
      return updatedAttempt;
    },
    [persistAndSet, appendAuditLog, addToast]
  );

  // --- Classes, Students, Users ---
  const saveClass = useCallback(
    (schoolClass: SchoolClass, isNew: boolean) => {
      assertPermission(currentUser, 'manage_classes', 'menyimpan data kelas');
      persistAndSet((prev) => ({
        ...prev,
        classes: isNew
          ? [...prev.classes, schoolClass]
          : prev.classes.map((c) => (c.id === schoolClass.id ? schoolClass : c)),
        auditLogs: appendAuditLog(
          prev,
          isNew ? 'Menambahkan Kelas Baru' : 'Memperbarui Kelas',
          'class',
          schoolClass.name,
          `Kode: ${schoolClass.code}, Wali Kelas: ${schoolClass.homeroomTeacherName}.`
        ),
      }));
      addToast({
        type: 'success',
        title: isNew ? 'Kelas Ditambahkan' : 'Data Kelas Diperbarui',
        description: `Kelas ${schoolClass.name} telah disimpan.`,
      });
    },
    [currentUser, persistAndSet, appendAuditLog, addToast]
  );

  const deleteClass = useCallback(
    (classId: string) => {
      assertPermission(currentUser, 'manage_classes', 'menghapus kelas');
      const target = state.classes.find((c) => c.id === classId);
      if (!target) return;
      persistAndSet((prev) => ({
        ...prev,
        classes: prev.classes.filter((c) => c.id !== classId),
        auditLogs: appendAuditLog(
          prev,
          'Menghapus Kelas',
          'class',
          target.name,
          `Kelas ${target.code} dihapus oleh ${currentUser?.name}.`
        ),
      }));
      addToast({
        type: 'info',
        title: 'Kelas Dihapus',
        description: `Kelas ${target.name} telah dihapus.`,
      });
    },
    [currentUser, state.classes, persistAndSet, appendAuditLog, addToast]
  );

  const saveUser = useCallback(
    (user: User, isNew: boolean) => {
      if (user.role === 'student') {
        assertPermission(currentUser, 'manage_students', 'menyimpan data siswa');
      } else {
        assertPermission(currentUser, 'manage_admin_users', 'mengelola pengguna admin/guru');
      }

      persistAndSet((prev) => {
        const users = isNew
          ? [...prev.users, user]
          : prev.users.map((u) => (u.id === user.id ? user : u));

        // Sinkronkan daftar siswa di kelas terkait
        const classes = prev.classes.map((cls) => {
          if (user.role !== 'student') return cls;
          const hasStudent = cls.studentIds.includes(user.id);
          if (cls.id === user.classId && !hasStudent) {
            return { ...cls, studentIds: [...cls.studentIds, user.id] };
          }
          if (cls.id !== user.classId && hasStudent) {
            return { ...cls, studentIds: cls.studentIds.filter((id) => id !== user.id) };
          }
          return cls;
        });

        return {
          ...prev,
          users,
          classes,
          auditLogs: appendAuditLog(
            prev,
            isNew ? 'Menambahkan Pengguna' : 'Memperbarui Pengguna',
            user.role === 'student' ? 'student' : 'system',
            user.name,
            `Role: ${user.role}, Username: ${user.username}, Status: ${user.status}.`
          ),
        };
      });

      addToast({
        type: 'success',
        title: isNew ? 'Data Berhasil Ditambahkan' : 'Data Diperbarui',
        description: `${user.name} telah disimpan.`,
      });
    },
    [currentUser, persistAndSet, appendAuditLog, addToast]
  );

  const importStudentsBatch = useCallback(
    (
      newStudents: Omit<User, 'id' | 'role' | 'lastActiveAt'>[]
    ): { importedCount: number; skippedCount: number; errors: string[] } => {
      assertPermission(currentUser, 'manage_students', 'mengimpor data siswa');
      let importedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      persistAndSet((prev) => {
        const existingNis = new Set(prev.users.map((u) => u.nis).filter(Boolean));
        const existingUsernames = new Set(prev.users.map((u) => u.username.toLowerCase()));
        const addedUsers: User[] = [];
        const updatedClasses = [...prev.classes];

        newStudents.forEach((row, idx) => {
          if (!row.name || !row.nis || !row.username || !row.classId) {
            skippedCount++;
            errors.push(`Baris ${idx + 1}: Kolom wajib (Nama, NIS, Username, Kelas) belum lengkap.`);
            return;
          }
          if (existingNis.has(row.nis) || existingUsernames.has(row.username.toLowerCase())) {
            skippedCount++;
            errors.push(
              `Baris ${idx + 1} (${row.name}): Duplikasi NIS "${row.nis}" atau Username "${row.username}".`
            );
            return;
          }

          const newId = `std-imp-${Date.now()}-${idx}`;
          const created: User = {
            ...row,
            id: newId,
            role: 'student',
            lastActiveAt: new Date().toISOString(),
          };
          addedUsers.push(created);
          existingNis.add(row.nis);
          existingUsernames.add(row.username.toLowerCase());
          importedCount++;

          const clsIdx = updatedClasses.findIndex((c) => c.id === row.classId);
          if (clsIdx >= 0) {
            updatedClasses[clsIdx] = {
              ...updatedClasses[clsIdx],
              studentIds: [...updatedClasses[clsIdx].studentIds, newId],
            };
          }
        });

        return {
          ...prev,
          users: [...prev.users, ...addedUsers],
          classes: updatedClasses,
          auditLogs: appendAuditLog(
            prev,
            'Impor Massal Data Siswa',
            'student',
            `${importedCount} Siswa Baru`,
            `Berhasil: ${importedCount} baris, Dilewati/Gagal: ${skippedCount} baris.`
          ),
        };
      });

      return { importedCount, skippedCount, errors };
    },
    [currentUser, persistAndSet, appendAuditLog]
  );

  const deleteUser = useCallback(
    (userId: string) => {
      const target = state.users.find((u) => u.id === userId);
      if (!target) return;
      if (target.role === 'student') {
        assertPermission(currentUser, 'manage_students', 'menghapus siswa');
      } else {
        assertPermission(currentUser, 'manage_admin_users', 'menghapus pengguna admin');
      }

      persistAndSet((prev) => ({
        ...prev,
        users: prev.users.filter((u) => u.id !== userId),
        classes: prev.classes.map((c) => ({
          ...c,
          studentIds: c.studentIds.filter((id) => id !== userId),
        })),
        auditLogs: appendAuditLog(
          prev,
          'Menghapus Akun Pengguna',
          target.role === 'student' ? 'student' : 'system',
          target.name,
          `Akun ${target.username} dihapus oleh ${currentUser?.name}.`
        ),
      }));

      addToast({
        type: 'info',
        title: 'Data Pengguna Dihapus',
        description: `Akun ${target.name} telah dihapus.`,
      });
    },
    [currentUser, state.users, persistAndSet, appendAuditLog, addToast]
  );

  const resetStudentCredential = useCallback(
    (studentId: string): string => {
      assertPermission(currentUser, 'reset_student_credentials', 'mereset kredensial siswa');
      const target = state.users.find((u) => u.id === studentId);
      if (!target) throw new Error('Siswa tidak ditemukan.');
      const tempToken = `SMA1-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

      persistAndSet((prev) => ({
        ...prev,
        auditLogs: appendAuditLog(
          prev,
          'Reset Kredensial Siswa',
          'student',
          target.name,
          `Token pemulihan satu kali diterbitkan oleh ${currentUser?.name}.`
        ),
      }));

      addToast({
        type: 'success',
        title: 'Kredensial Berhasil Direset',
        description: `Token sementara untuk ${target.name} telah diterbitkan (tidak disimpan sebagai teks biasa di tabel).`,
      });
      return tempToken;
    },
    [currentUser, state.users, persistAndSet, appendAuditLog, addToast]
  );

  const updateGradeWeights = useCallback(
    (weights: GradeWeightConfig) => {
      assertPermission(currentUser, 'manage_grade_weights', 'mengatur rumus bobot nilai');
      persistAndSet((prev) => ({
        ...prev,
        gradeWeights: {
          ...weights,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.name || 'Admin',
        },
        auditLogs: appendAuditLog(
          prev,
          'Perubahan Bobot Rumus Nilai',
          'grade',
          'Konfigurasi Buku Nilai',
          `Materi: ${weights.materialCompletionWeight}%, Tugas: ${weights.assignmentWeight}%, Kuis: ${weights.quizWeight}%, KKM: ${weights.passingGrade}.`
        ),
      }));
      addToast({
        type: 'success',
        title: 'Rumus Nilai Akhir Diperbarui',
        description: 'Seluruh perhitungan nilai akhir siswa telah disesuaikan secara otomatis.',
      });
    },
    [currentUser, persistAndSet, appendAuditLog, addToast]
  );

  const updateSchoolSettings = useCallback(
    (settings: SchoolSettings) => {
      assertPermission(currentUser, 'manage_app_settings', 'mengubah pengaturan aplikasi');
      persistAndSet((prev) => ({
        ...prev,
        settings,
        auditLogs: appendAuditLog(
          prev,
          'Perubahan Pengaturan Sekolah',
          'system',
          settings.schoolName,
          `Tahun Ajaran: ${settings.academicYear} (${settings.semester}), Default Baca Min: ${settings.defaultMinReadMinutes}m.`
        ),
      }));
      addToast({
        type: 'success',
        title: 'Pengaturan Disimpan',
        description: 'Konfigurasi sekolah dan header laporan PDF berhasil diperbarui.',
      });
    },
    [currentUser, persistAndSet, appendAuditLog, addToast]
  );

  return (
    <LmsContext.Provider
      value={{
        ...state,
        currentUser,
        portalMode,
        activeAdminMenu,
        activeStudentMenu,
        selectedMaterialId,
        selectedAssignmentId,
        selectedQuizId,
        navFilter,
        isOnline,
        isDemoRealtimeActive,
        lastRealtimeSyncAt,
        simulatedNow,
        toasts,
        confirmDialog,
        loginAsUser,
        logout,
        navigateAdmin,
        navigateStudent,
        setSimulatedOnline,
        setDemoRealtimeActive: setIsDemoRealtimeActive,
        setSimulatedNow,
        resetDemoDatabase,
        addToast,
        removeToast,
        requestConfirm,
        closeConfirm,
        saveMaterial,
        duplicateMaterial,
        deleteMaterial,
        updateMaterialSchedule,
        recordReadingHeartbeat,
        completeReadingMaterial,
        saveAssignment,
        duplicateAssignment,
        deleteAssignment,
        submitStudentAssignment,
        gradeAssignmentSubmission,
        saveQuiz,
        duplicateQuiz,
        deleteQuiz,
        startOrResumeQuizAttempt,
        saveQuizAttemptProgress,
        saveClass,
        deleteClass,
        saveUser,
        importStudentsBatch,
        deleteUser,
        resetStudentCredential,
        updateGradeWeights,
        updateSchoolSettings,
        isMaterialCompletedByStudent,
      }}
    >
      {children}
    </LmsContext.Provider>
  );
};

export function useLms(): LmsContextValue {
  const ctx = useContext(LmsContext);
  if (!ctx) {
    throw new Error('useLms harus digunakan di dalam LmsProvider');
  }
  return ctx;
}
