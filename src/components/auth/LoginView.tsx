import React, { useState } from 'react';
import {
  ShieldCheck,
  User,
  Lock,
  ArrowRight,
  Clock,
  Award,
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  TreePine,
  KeyRound,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { ConnectedDevicesIllustration } from './ConnectedDevicesIllustration';

export const LoginView: React.FC = () => {
  const { users, loginAsUser, settings, addToast } = useLms();
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'staff'>('student');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      addToast({
        type: 'error',
        title: 'Username Wajib Diisi',
        description: 'Silakan masukkan username atau pilih salah satu akun uji coba cepat di bawah.',
      });
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const matched = users.find(
        (u) => u.username.toLowerCase() === username.trim().toLowerCase()
      );
      setIsLoading(false);
      if (matched) {
        loginAsUser(matched.id);
      } else {
        addToast({
          type: 'error',
          title: 'Akun Tidak Ditemukan',
          description: `Username "${username}" tidak terdaftar. Silakan gunakan kartu demo 1-klik.`,
        });
      }
    }, 350);
  };

  const studentDemoCards = [
    {
      id: 'std-01',
      name: 'Nadia Putri Maharani',
      nis: '24251001',
      classTitle: 'XI MIPA 1 (Unggulan)',
      statusText: 'Materi Fisika Selesai · Skor 94/100',
    },
    {
      id: 'std-02',
      name: 'Rizky Ramadhan Pratama',
      nis: '24251002',
      classTitle: 'XI MIPA 1',
      statusText: 'Sesi Aktif Membaca (10 Menit)',
    },
    {
      id: 'std-03',
      name: 'Alya Zahra Kamila',
      nis: '24251003',
      classTitle: 'XI MIPA 1',
      statusText: 'Sesi Dijeda (Tab Tersembunyi)',
    },
  ];

  const staffDemoCards = [
    {
      id: 'usr-super-admin',
      name: 'Ir. Aditya Pratama, M.Kom.',
      nis: 'NIP 19800312',
      classTitle: 'Super Administrator',
      statusText: 'Akses Konfigurasi, RBAC & Audit Log',
    },
    {
      id: 'usr-school-admin',
      name: 'Ratna Sari Dewi, S.Pd.',
      nis: 'NIP 19850620',
      classTitle: 'Admin Sekolah / Kurikulum',
      statusText: 'Kelola Kelas, Siswa & Impor XLSX',
    },
    {
      id: 'usr-teacher-1',
      name: 'Drs. Bambang Sutrisno, M.Si.',
      nis: 'NIP 19750415',
      classTitle: 'Guru Fisika & Matematika',
      statusText: 'Modul Termodinamika & Penilaian',
    },
  ];

  const activeDemoCards = activeRoleTab === 'student' ? studentDemoCards : staffDemoCards;

  return (
    <div className="min-h-screen bg-[#12201A] flex flex-col lg:flex-row font-sans text-[#202923] selection:bg-[#276749] selection:text-white">
      {/* 1. LEFT PANE: Forest Hero Banner (Static) */}
      <div className="relative flex-1 bg-gradient-to-br from-[#0F1C16] via-[#192A23] to-[#23382E] text-white p-6 sm:p-10 lg:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#23382E]">
        {/* Top Header & School Identity */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#276749] text-white flex items-center justify-center font-bold text-lg shadow-md ring-1 ring-white/20">
              <TreePine className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white leading-tight">
                {settings.schoolName}
              </h2>
              <div className="text-[11px] text-[#A3B1A8] font-mono">
                Sistem Pembelajaran Terpadu SMA
              </div>
            </div>
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#276749]/30 border border-[#48A878]/30 text-emerald-200 text-xs font-mono">
            <span>TA {settings.academicYear} ({settings.semester})</span>
          </span>
        </div>

        {/* Center Welcoming Message & Static Vector Illustration */}
        <div className="relative z-10 my-6 lg:my-auto space-y-6 max-w-xl">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#276749]/40 border border-[#48A878]/30 text-emerald-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-[#48A878]" />
              <span>Portal Pembelajaran Digital Forest Edition</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.15]">
                Belajar Lebih Mudah, Raih Masa Depan Cerah.
              </h1>
              <p className="text-xs sm:text-sm text-[#C5D0C8] leading-relaxed">
                Platform pembelajaran digital terpadu yang menghubungkan materi, tugas, kuis, dan evaluasi hasil belajar dalam satu ekosistem yang tenang dan terorganisasi.
              </p>
            </div>
          </div>

          {/* Connected Device Vector Illustration (Static) */}
          <div className="pt-2">
            <ConnectedDevicesIllustration />
          </div>

          {/* Key Capabilities List */}
          <div className="space-y-2 pt-2 border-t border-[#23382E]">
            <div className="flex items-start gap-3 text-xs text-[#C5D0C8]">
              <div className="w-5 h-5 rounded-md bg-[#276749]/50 text-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white font-semibold">Sistem Timer Membaca Presisi:</strong> Menghitung durasi baca aktif secara akurat dan otomatis menjeda saat tab tidak terlihat.
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs text-[#C5D0C8]">
              <div className="w-5 h-5 rounded-md bg-[#2F855A]/50 text-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                <Award className="w-3.5 h-3.5" />
              </div>
              <div>
                <strong className="text-white font-semibold">Evaluasi & Buku Nilai Transparan:</strong> Penilaian berbasis rubrik dengan perhitungan KKM dan rekonsiliasi nilai otomatis.
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 pt-4 border-t border-[#23382E] flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#A3B1A8]">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-[#48A878] shrink-0" />
            <span>Standar Kurikulum Merdeka Kemendikbudristek</span>
          </div>
          <div className="font-mono text-[#A3B1A8]">NPSN {settings.npsn}</div>
        </div>
      </div>

      {/* 2. RIGHT PANE: Structured Login Panel Card with Header */}
      <div className="w-full lg:w-[500px] xl:w-[560px] bg-[#12201A] text-white flex flex-col justify-center p-4 sm:p-8 lg:p-10 shrink-0 border-l border-[#23382E]">
        
        {/* Structured Login Card Container with Forest Green Card Header */}
        <div className="w-full max-w-md mx-auto bg-[#192A23] border border-[#23382E] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          
          {/* STRUCTURED CARD HEADER */}
          <div className="bg-[#0F1C16] border-b border-[#23382E] border-t-4 border-t-[#276749] p-5 sm:p-6 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#276749] to-[#1F513A] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md ring-1 ring-[#48A878]/30">
                <KeyRound className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#48A878] mb-0.5">
                  Portal Autentikasi
                </div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                  Masuk ke Akun LMS
                </h2>
                <p className="text-[11px] text-[#A3B1A8] mt-0.5">
                  Akses Terpadu Siswa, Guru & Administrator
                </p>
              </div>
            </div>

            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-[#276749]/30 px-2.5 py-1 rounded-lg border border-[#48A878]/30 shrink-0 hidden xs:inline-flex">
              Sinaura LMS
            </span>
          </div>

          {/* CARD BODY */}
          <div className="p-5 sm:p-6 space-y-5 bg-[#192A23]">
            {/* Role Tab Segmented Control */}
            <div className="grid grid-cols-2 p-1 bg-[#12201A] border border-[#23382E] rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setActiveRoleTab('student');
                  setUsername('');
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  activeRoleTab === 'student'
                    ? 'bg-[#276749] text-white shadow-xs border border-[#48A878]/30'
                    : 'text-[#A3B1A8] hover:text-white'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Portal Siswa</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveRoleTab('staff');
                  setUsername('');
                }}
                className={`py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                  activeRoleTab === 'staff'
                    ? 'bg-[#276749] text-white shadow-xs border border-[#48A878]/30'
                    : 'text-[#A3B1A8] hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Guru & Admin</span>
              </button>
            </div>

            {/* 1-Click Fast Demo Login Selector */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#A3B1A8]">
                <span className="font-semibold uppercase tracking-wider text-[#A3B1A8]">
                  Pilih Akun Demo ({activeRoleTab === 'student' ? 'Siswa' : 'Guru / Admin'}):
                </span>
                <span className="font-mono text-emerald-300 text-[10px] bg-[#276749]/30 px-2 py-0.5 rounded border border-[#48A878]/30">
                  1-Klik Masuk
                </span>
              </div>

              <div className="space-y-2">
                {activeDemoCards.map((card) => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => loginAsUser(card.id)}
                    className="w-full text-left p-3 rounded-xl bg-[#12201A] border border-[#23382E] hover:border-[#48A878] hover:bg-[#23382E] transition-all group flex items-center justify-between gap-3 shadow-xs cursor-pointer"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white group-hover:text-emerald-200 transition-colors truncate">
                          {card.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#276749]/40 text-emerald-200 font-mono shrink-0">
                          {card.classTitle}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#A3B1A8] truncate">
                        <span className="font-mono">{card.nis}</span> · {card.statusText}
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg bg-[#23382E] group-hover:bg-[#276749] text-[#A3B1A8] group-hover:text-white flex items-center justify-center shrink-0 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="border-t border-[#23382E] w-full" />
              <span className="bg-[#192A23] px-3 text-[11px] font-mono text-[#A3B1A8] shrink-0">
                ATAU MASUK MANUAL
              </span>
            </div>

            {/* Manual Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#C5D0C8] mb-1.5">
                  Username Akun
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#A3B1A8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={
                      activeRoleTab === 'student'
                        ? 'nadia.putri / rizky.ramadhan'
                        : 'superadmin / bambang.fisika'
                    }
                    className="w-full pl-10 pr-3 py-2.5 text-xs bg-[#12201A] border border-[#23382E] rounded-xl text-white placeholder-[#A3B1A8]/50 focus:outline-none focus:ring-2 focus:ring-[#276749] focus:border-transparent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#C5D0C8] mb-1.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#A3B1A8] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-xs bg-[#12201A] border border-[#23382E] rounded-xl text-white placeholder-[#A3B1A8]/50 focus:outline-none focus:ring-2 focus:ring-[#276749] focus:border-transparent font-sans"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A3B1A8] hover:text-white cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 text-xs font-bold text-white bg-[#276749] hover:bg-[#1F513A] active:bg-[#192A23] rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer border border-[#48A878]/20"
              >
                <span>{isLoading ? 'Memverifikasi...' : 'Masuk ke Aplikasi'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* CARD FOOTER */}
          <div className="p-3.5 bg-[#12201A] border-t border-[#23382E] flex items-center gap-2 text-[11px] text-[#A3B1A8]">
            <ShieldCheck className="w-4 h-4 text-[#48A878] shrink-0" />
            <span>
              Privasi data dan kredensial terjamin dengan autentikasi token aman.
            </span>
          </div>

        </div>
      </div>
    </div>
  );
};
