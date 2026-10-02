/**
 * SECURITY & BACKEND CONFIGURATION LOCK
 * 
 * Sesuai Kebijakan Keamanan Frontend LMS:
 * - BACKEND_MODE dikunci secara permanen pada level build ke 'mock'.
 * - Tidak ada inisialisasi client Supabase aktif atau request jaringan eksternal.
 * - Seluruh interaksi data menggunakan MockRepository terisolasi.
 * - Tidak ada URL, anon key, service role key, atau secret database di dalam bundle frontend.
 */

export const BACKEND_MODE = 'mock' as const;
export const IS_MOCK_MODE = true as const;
export const BACKEND_STATUS = 'LOCKED_MOCK_DEVELOPMENT' as const;
export const BACKEND_SECURITY_VERSION = 'v1.0.0-mock-hardened';

export const BACKEND_CONFIG = {
  mode: BACKEND_MODE,
  isMock: IS_MOCK_MODE,
  status: BACKEND_STATUS,
  networkCallsEnabled: false,
  persistedStorage: 'local_demo_isolated',
  demoNotice: 'DEMO — Penyimpanan Mock Lokal (Tanpa Koneksi Eksternal)',
} as const;

export function assertMockMode(): void {
  if (BACKEND_MODE !== 'mock') {
    throw new Error('SECURITY VIOLATION: Backend mode must remain locked to mock during frontend development.');
  }
}
