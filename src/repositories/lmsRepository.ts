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
} from '../types/lms';
import {
  INITIAL_USERS,
  INITIAL_CLASSES,
  INITIAL_MATERIALS,
  INITIAL_READING_SESSIONS,
  INITIAL_ASSIGNMENTS,
  INITIAL_SUBMISSIONS,
  INITIAL_QUIZZES,
  INITIAL_QUIZ_ATTEMPTS,
  INITIAL_GRADE_WEIGHTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_SCHOOL_SETTINGS,
} from '../data/mockData';

const STORAGE_KEY = 'sinaura_lms_sma_state_v1';

export interface LmsPersistedState {
  users: User[];
  classes: SchoolClass[];
  materials: Material[];
  readingSessions: ReadingSession[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  gradeWeights: GradeWeightConfig;
  auditLogs: AuditLogEntry[];
  settings: SchoolSettings;
}

export interface ILmsRepository {
  loadState(): LmsPersistedState;
  saveState(state: LmsPersistedState): void;
  resetToDefaults(): LmsPersistedState;
  upsertReadingSessionHeartbeat(
    session: ReadingSession,
    sequenceNumber: number,
    isOnline: boolean
  ): { session: ReadingSession; deduplicated: boolean };
}

function getDefaultState(): LmsPersistedState {
  return {
    users: INITIAL_USERS,
    classes: INITIAL_CLASSES,
    materials: INITIAL_MATERIALS,
    readingSessions: INITIAL_READING_SESSIONS,
    assignments: INITIAL_ASSIGNMENTS,
    submissions: INITIAL_SUBMISSIONS,
    quizzes: INITIAL_QUIZZES,
    quizAttempts: INITIAL_QUIZ_ATTEMPTS,
    gradeWeights: INITIAL_GRADE_WEIGHTS,
    auditLogs: INITIAL_AUDIT_LOGS,
    settings: INITIAL_SCHOOL_SETTINGS,
  };
}

export class LocalDemoLmsRepository implements ILmsRepository {
  loadState(): LmsPersistedState {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const defaults = getDefaultState();
        this.saveState(defaults);
        return defaults;
      }
      const parsed = JSON.parse(raw) as Partial<LmsPersistedState>;
      const defaults = getDefaultState();
      return {
        users: parsed.users ?? defaults.users,
        classes: parsed.classes ?? defaults.classes,
        materials: parsed.materials ?? defaults.materials,
        readingSessions: parsed.readingSessions ?? defaults.readingSessions,
        assignments: parsed.assignments ?? defaults.assignments,
        submissions: parsed.submissions ?? defaults.submissions,
        quizzes: parsed.quizzes ?? defaults.quizzes,
        quizAttempts: parsed.quizAttempts ?? defaults.quizAttempts,
        gradeWeights: parsed.gradeWeights ?? defaults.gradeWeights,
        auditLogs: parsed.auditLogs ?? defaults.auditLogs,
        settings: parsed.settings ?? defaults.settings,
      };
    } catch {
      return getDefaultState();
    }
  }

  saveState(state: LmsPersistedState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Gagal menyimpan state demo ke localStorage:', e);
    }
  }

  resetToDefaults(): LmsPersistedState {
    const defaults = getDefaultState();
    this.saveState(defaults);
    return defaults;
  }

  /**
   * Mencegah pengiriman berulang yang menggandakan durasi aktif (Bagian H.15)
   * dan menangani sinkronisasi saat koneksi offline/online (Bagian H.10).
   */
  upsertReadingSessionHeartbeat(
    incoming: ReadingSession,
    sequenceNumber: number,
    isOnline: boolean
  ): { session: ReadingSession; deduplicated: boolean } {
    const state = this.loadState();
    const existingIndex = state.readingSessions.findIndex(
      (s) =>
        s.student_id === incoming.student_id &&
        s.material_id === incoming.material_id
    );

    if (existingIndex >= 0) {
      const existing = state.readingSessions[existingIndex];
      // Cegah duplikasi event jika sequenceNumber <= last_sequence_number dan durasi tidak bertambah sah
      if (
        sequenceNumber <= existing.last_sequence_number &&
        incoming.completion_status === existing.completion_status &&
        incoming.reached_checkpoints.length === existing.reached_checkpoints.length &&
        Object.keys(incoming.answered_questions).length ===
          Object.keys(existing.answered_questions).length
      ) {
        return { session: existing, deduplicated: true };
      }

      // Pastikan waktu aktif tidak pernah mundur karena race condition
      const safeActiveSeconds = Math.max(
        existing.active_duration_seconds,
        incoming.active_duration_seconds
      );
      const safePausedSeconds = Math.max(
        existing.paused_duration_seconds,
        incoming.paused_duration_seconds
      );

      // Jangan izinkan status completed jika sedang offline (Bagian H.10)
      const safeCompletionStatus =
        !isOnline && incoming.completion_status === 'completed'
          ? 'active'
          : incoming.completion_status;

      const updated: ReadingSession = {
        ...existing,
        ...incoming,
        active_duration_seconds: safeActiveSeconds,
        paused_duration_seconds: safePausedSeconds,
        completion_status: safeCompletionStatus,
        completed_at:
          safeCompletionStatus === 'completed'
            ? incoming.completed_at || new Date().toISOString()
            : null,
        sync_status: isOnline ? 'synced' : 'pending_offline',
        last_sequence_number: Math.max(existing.last_sequence_number + 1, sequenceNumber),
      };

      state.readingSessions[existingIndex] = updated;
      this.saveState(state);
      return { session: updated, deduplicated: false };
    } else {
      const created: ReadingSession = {
        ...incoming,
        sync_status: isOnline ? 'synced' : 'pending_offline',
        last_sequence_number: sequenceNumber,
      };
      state.readingSessions.push(created);
      this.saveState(state);
      return { session: created, deduplicated: false };
    }
  }
}

export const lmsRepository = new LocalDemoLmsRepository();
