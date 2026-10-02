import React, { useState } from 'react';
import {
  Cloud,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  Sparkles,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

interface ConnectedDevicesIllustrationProps {
  className?: string;
  compact?: boolean;
}

export const ConnectedDevicesIllustration: React.FC<ConnectedDevicesIllustrationProps> = ({
  className = '',
}) => {
  const [activeHovered, setActiveHovered] = useState<string | null>(null);

  return (
    <div className={`relative w-full select-none ${className}`}>
      {/* SVG Connection Network Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 500 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="cloudToLaptop" x1="250" y1="65" x2="250" y2="155" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#48a878" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#276749" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2f855a" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="laptopToMobile" x1="200" y1="210" x2="95" y2="245" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#276749" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#48a878" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="laptopToTablet" x1="300" y1="210" x2="405" y2="245" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2f855a" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#858d86" stopOpacity="0.7" />
          </linearGradient>

          <linearGradient id="cloudToMobile" x1="215" y1="50" x2="90" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#48a878" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#276749" stopOpacity="0.4" />
          </linearGradient>

          <linearGradient id="cloudToTablet" x1="285" y1="50" x2="410" y2="210" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#48a878" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#2f855a" stopOpacity="0.4" />
          </linearGradient>

          <filter id="forestGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Static Connection Lines */}
        <path
          d="M 250 65 L 250 160"
          stroke="url(#cloudToLaptop)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.6"
          filter="url(#forestGlow)"
        />
        <path
          d="M 200 200 C 150 200, 130 240, 95 245"
          stroke="url(#laptopToMobile)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
          filter="url(#forestGlow)"
        />
        <path
          d="M 300 200 C 350 200, 370 240, 405 245"
          stroke="url(#laptopToTablet)"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.5"
          filter="url(#forestGlow)"
        />

        {/* Diagonal sync lines */}
        <path
          d="M 215 50 C 140 80, 100 150, 90 215"
          stroke="url(#cloudToMobile)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0.4"
        />
        <path
          d="M 285 50 C 360 80, 400 150, 410 215"
          stroke="url(#cloudToTablet)"
          strokeWidth="1.5"
          strokeDasharray="4 6"
          opacity="0.4"
        />

        {/* Connection Node Junctions (Static) */}
        <circle cx="250" cy="65" r="4" fill="#48a878" />
        <circle cx="250" cy="160" r="4.5" fill="#276749" />
        <circle cx="200" cy="200" r="3.5" fill="#276749" />
        <circle cx="300" cy="200" r="3.5" fill="#2f855a" />
        <circle cx="95" cy="245" r="4" fill="#48a878" />
        <circle cx="405" cy="245" r="4" fill="#48a878" />
      </svg>

      {/* Static Layout for Device Vector Cards */}
      <div className="relative z-20 w-full h-[320px] sm:h-[360px] flex flex-col justify-between items-center py-2">
        
        {/* 1. TOP CENTER: Cloud Server & Sync Hub */}
        <div className="cursor-default">
          <div className="relative">
            <div className="relative px-3.5 py-1.5 sm:px-4 sm:py-2 bg-[#192A23] border border-[#48A878]/40 rounded-xl shadow-md flex items-center gap-2 sm:gap-2.5 text-white">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#276749] text-emerald-200 flex items-center justify-center shrink-0 shadow-xs">
                <Cloud className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-200" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-tight text-white">
                    Cloud LMS Forest
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#48A878]" />
                </div>
                <div className="text-[9px] text-[#A3B1A8] font-mono">
                  Sinkronisasi Terpadu
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. MIDDLE & BOTTOM: Device Triad */}
        <div className="w-full flex items-end justify-between px-2 sm:px-4 gap-2 relative mt-auto">
          
          {/* A. LEFT DEVICE: Smartphone */}
          <div className="w-[110px] sm:w-[130px] z-30 select-none">
            <div className="bg-[#192A23] border border-[#48A878]/40 rounded-2xl p-2 shadow-lg ring-1 ring-white/10 space-y-1.5">
              <div className="w-8 h-1 bg-[#23382E] rounded-full mx-auto" />
              
              <div className="bg-[#12201A] rounded-xl p-2 border border-[#23382E] space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[9px] text-emerald-200 font-semibold border-b border-[#23382E] pb-1">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-2.5 h-2.5 text-[#48A878]" /> Materi
                  </span>
                  <span className="font-mono text-[8px] text-[#48A878]">Online</span>
                </div>

                <div className="space-y-1">
                  <div className="p-1 rounded bg-[#276749]/40 border border-[#276749]/60 flex items-center justify-between">
                    <span className="text-[8px] text-white font-medium truncate">Fisika: Termo</span>
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#48A878] shrink-0" />
                  </div>
                  <div className="p-1 rounded bg-[#192A23] border border-[#23382E] flex items-center justify-between">
                    <span className="text-[8px] text-[#C5D0C8] truncate">Optik Modern</span>
                    <Clock className="w-2.5 h-2.5 text-[#D99A2B] shrink-0" />
                  </div>
                </div>

                <div className="pt-0.5">
                  <div className="flex items-center justify-between text-[8px] text-[#A3B1A8] font-mono">
                    <span>Baca Aktif</span>
                    <span className="text-emerald-300 font-bold">14m</span>
                  </div>
                  <div className="w-full h-1 bg-[#23382E] rounded-full overflow-hidden mt-0.5">
                    <div className="h-full bg-[#48A878] w-4/5 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="text-[8px] text-center text-[#A3B1A8] font-mono">
                Siswa Mandiri
              </div>
            </div>
          </div>

          {/* B. CENTER PIECE: Main Laptop Dashboard */}
          <div className="w-[170px] sm:w-[210px] md:w-[230px] z-40 select-none">
            <div className="relative">
              <div className="relative bg-[#192A23] border-2 border-[#23382E] rounded-t-2xl p-2 sm:p-2.5 shadow-xl ring-1 ring-white/15">
                <div className="w-1.5 h-1.5 bg-[#23382E] rounded-full mx-auto mb-1.5" />

                <div className="bg-[#12201A] rounded-xl p-2 sm:p-2.5 border border-[#23382E] text-left space-y-2">
                  <div className="flex items-center justify-between border-b border-[#23382E] pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#D9534F]" />
                      <span className="w-2 h-2 rounded-full bg-[#D99A2B]" />
                      <span className="w-2 h-2 rounded-full bg-[#2F855A]" />
                      <span className="text-[9px] font-bold text-white ml-1 truncate">
                        Sinaura Dashboard
                      </span>
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#276749]/50 text-emerald-200 font-mono">
                      v2.5
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-[#192A23] p-1.5 rounded-lg border border-[#23382E]">
                      <div className="text-[8px] text-[#A3B1A8]">Ketuntasan</div>
                      <div className="text-[11px] font-bold font-mono text-emerald-400 mt-0.5 flex items-center gap-1">
                        <span>88%</span>
                        <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                      </div>
                    </div>

                    <div className="bg-[#192A23] p-1.5 rounded-lg border border-[#23382E]">
                      <div className="text-[8px] text-[#A3B1A8]">Rata-rata</div>
                      <div className="text-[11px] font-bold font-mono text-emerald-300 mt-0.5 flex items-center gap-1">
                        <span>94/100</span>
                        <Award className="w-2.5 h-2.5 text-emerald-300" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#276749]/30 border border-[#276749]/50 rounded-lg p-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="inline-flex rounded-full h-2 w-2 bg-[#48A878]" />
                      <span className="text-[8px] text-white font-medium truncate">
                        Sesi Aktif Siswa
                      </span>
                    </div>
                    <span className="text-[8px] font-mono text-emerald-300 font-bold">Live</span>
                  </div>
                </div>
              </div>

              <div className="h-3 bg-gradient-to-b from-[#23382E] to-[#192A23] rounded-b-xl border-t border-[#23382E] flex items-center justify-center px-4 shadow-md">
                <div className="w-12 h-1 bg-[#12201A] rounded-full" />
              </div>
            </div>
          </div>

          {/* C. RIGHT DEVICE: Tablet */}
          <div className="w-[110px] sm:w-[130px] z-30 select-none">
            <div className="bg-[#192A23] border border-[#48A878]/40 rounded-2xl p-2 shadow-lg ring-1 ring-white/10 space-y-1.5">
              <div className="w-6 h-1 bg-[#23382E] rounded-full mx-auto" />

              <div className="bg-[#12201A] rounded-xl p-2 border border-[#23382E] space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[9px] text-emerald-200 font-semibold border-b border-[#23382E] pb-1">
                  <span className="flex items-center gap-1">
                    <Award className="w-2.5 h-2.5 text-[#48A878]" /> Buku Nilai
                  </span>
                  <span className="text-[8px] font-mono text-[#48A878] font-bold">KKM ≥ 75</span>
                </div>

                <div className="p-1.5 bg-[#276749]/30 border border-[#276749]/50 rounded-lg text-center space-y-0.5">
                  <div className="text-[8px] text-emerald-200">Status Kelulusan</div>
                  <div className="text-xs font-mono font-bold text-white flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Tuntas</span>
                  </div>
                  <div className="text-[8px] text-emerald-300/80 font-mono">Predikat A (94%)</div>
                </div>

                <div className="p-1 rounded bg-[#192A23] border border-[#23382E] flex items-center justify-between text-[8px] text-[#C5D0C8]">
                  <span>Tugas</span>
                  <span className="font-mono font-bold text-emerald-300">100%</span>
                </div>
              </div>

              <div className="text-[8px] text-center text-[#A3B1A8] font-mono">
                Evaluasi & Guru
              </div>
            </div>
          </div>

        </div>

        {/* 3. STATIC SATELLITE BADGES */}
        <div className="absolute top-16 left-2 sm:left-4 pointer-events-none hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#192A23] border border-[#48A878]/40 text-emerald-200 text-[9px] shadow-sm">
          <Sparkles className="w-3 h-3 text-[#48A878]" />
          <span>Timer Presisi</span>
        </div>

        <div className="absolute top-16 right-2 sm:right-4 pointer-events-none hidden xs:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#192A23] border border-[#48A878]/40 text-emerald-200 text-[9px] shadow-sm">
          <ShieldCheck className="w-3 h-3 text-[#2F855A]" />
          <span>Privasi Siswa</span>
        </div>
      </div>
    </div>
  );
};
