import React, { useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useLms } from '../../context/LmsContext';

interface NetworkStatusIndicatorProps {
  compact?: boolean;
  className?: string;
  showToggleHint?: boolean;
}

export const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  compact = false,
  className = '',
  showToggleHint = false,
}) => {
  const { isOnline, setSimulatedOnline, readingSessions } = useLms();
  const [isHovered, setIsHovered] = useState(false);

  const pendingCount = readingSessions.filter(
    (s) => s.sync_status === 'pending_offline'
  ).length;

  return (
    <button
      type="button"
      onClick={() => setSimulatedOnline(!isOnline)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="status"
      aria-live="polite"
      aria-label={`Status Jaringan: ${isOnline ? 'Online (Tersambung)' : 'Offline (Simulasi)'}`}
      title={
        isOnline
          ? 'Koneksi aktif (navigator.onLine = true). Klik untuk simulasi mode offline.'
          : `Koneksi terputus. ${pendingCount > 0 ? `${pendingCount} antrean offline.` : ''} Klik untuk sambungkan kembali.`
      }
      className={`relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-[#276749] select-none shrink-0 whitespace-nowrap ${
        isOnline
          ? 'bg-[#E5F3E8] hover:bg-[#cbe6d2] text-[#276749] border border-[#48A878]/30 shadow-2xs'
          : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse'
      } ${className}`}
    >
      {/* Live status pulsing dot */}
      <span className="relative flex h-2 w-2 shrink-0">
        {isOnline && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#48A878] opacity-75" />
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isOnline ? 'bg-[#2F855A]' : 'bg-[#D99A2B]'
          }`}
        />
      </span>

      {/* Network Icon */}
      {isOnline ? (
        <Wifi className="w-3.5 h-3.5 text-[#276749] shrink-0" />
      ) : (
        <WifiOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
      )}

      {/* Label Text */}
      {!compact && (
        <span className="text-[11px] font-bold tracking-tight">
          {isOnline ? (
            'Online'
          ) : (
            <span className="flex items-center gap-1">
              <span>Offline</span>
              {pendingCount > 0 && (
                <span className="font-mono text-[10px] px-1 bg-amber-200 rounded text-amber-950 font-bold">
                  {pendingCount}
                </span>
              )}
            </span>
          )}
        </span>
      )}

      {/* Micro Hover Tag */}
      {showToggleHint && isHovered && (
        <span className="hidden xl:inline text-[9px] font-mono opacity-70 ml-0.5">
          (klik tes)
        </span>
      )}
    </button>
  );
};
