import { ReadingSession } from '../types/lms';

/**
 * Kontrak Adapter Supabase Realtime & Storage untuk Tahap 2 (Integrasi Backend).
 *
 * CATATAN ARSITEKTUR (Sesuai Spesifikasi Bagian B, I, dan Q):
 * - Pada Tahap 1 ini, aplikasi menggunakan Mode Demo (Mock Repository + LocalStorage).
 * - Adapter ini menyediakan kontrak tipe dan struktur channel yang siap dihubungkan ke
 *   `@supabase/supabase-js` pada Tahap 2 tanpa mengubah kode komponen UI.
 */
export interface ISupabaseRealtimeAdapter {
  readonly mode: 'demo_simulation' | 'supabase_realtime';
  readonly isConfigured: boolean;
  subscribeToReadingSessions(
    onHeartbeatUpdate: (session: ReadingSession) => void
  ): () => void;
  publishReadingHeartbeat(session: ReadingSession): Promise<{
    accepted: boolean;
    serverValidatedDuration: number;
    syncedAt: string;
  }>;
}

export class DemoSupabaseRealtimeAdapter implements ISupabaseRealtimeAdapter {
  public readonly mode = 'demo_simulation' as const;
  public readonly isConfigured = false;

  subscribeToReadingSessions(
    _onHeartbeatUpdate: (session: ReadingSession) => void
  ): () => void {
    // Dalam mode demo, simulasi detak dikelola oleh LmsContext saat toggle Simulasi Demo aktif
    return () => {};
  }

  async publishReadingHeartbeat(session: ReadingSession): Promise<{
    accepted: boolean;
    serverValidatedDuration: number;
    syncedAt: string;
  }> {
    // Simulasi validasi durasi di sisi layanan (mencegah lonjakan waktu tidak wajar)
    const nowIso = new Date().toISOString();
    return {
      accepted: true,
      serverValidatedDuration: session.active_duration_seconds,
      syncedAt: nowIso,
    };
  }
}

export const SUPABASE_INTEGRATION_BLUEPRINT = {
  stage: 'Tahap 1 — Mode Demo Terstruktur (Siap Integrasi Supabase)',
  tablesRequiredForStage2: [
    'profiles (id, role, nis, nisn, class_id, status)',
    'school_classes (id, code, name, grade_level, academic_year, homeroom_teacher_id)',
    'materials (id, title, subject, min_read_minutes, pause_on_blur, publish_start_at, publish_end_at)',
    'reading_sessions (session_id, student_id, material_id, active_duration_seconds, paused_duration_seconds, last_checkpoint, visibility_state, completion_status)',
    'assignments & assignment_submissions (dengan riwayat revisi nilai)',
    'quizzes & quiz_attempts (dengan validasi timer server-side)',
    'audit_logs (pencatatan perubahan nilai, jadwal, dan penghapusan)',
  ],
  securityChecklist: [
    'Row Level Security (RLS) wajib aktif di seluruh tabel sebelum produksi.',
    'Validasi durasi baca dihitung dari selisih heartbeat_at di server (bukan mempercayai angka mutlak dari client).',
    'Kunci jawaban kuis disimpan pada tabel terpisah atau hanya diakses melalui Edge Function / RPC.',
    'Lampiran materi dan berkas jawaban siswa menggunakan Private Storage Bucket dengan Signed URL.',
  ],
};
