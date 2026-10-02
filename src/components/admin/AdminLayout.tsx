import React, { useState } from 'react';
import {
  LayoutDashboard,
  Radio,
  BookOpen,
  Calendar,
  FileText,
  HelpCircle,
  GraduationCap,
  Users,
  Award,
  FileSpreadsheet,
  Shield,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  TreePine,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { AdminMenuId } from '../../types/lms';
import { getRoleDisplayName } from '../../services/permissions';
import { NetworkStatusIndicator } from '../common/NetworkStatusIndicator';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export interface AdminMenuCategory {
  categoryTitle: string;
  items: {
    id: AdminMenuId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const CATEGORIZED_ADMIN_MENUS: AdminMenuCategory[] = [
  {
    categoryTitle: 'PEMANTAUAN & UTAMA',
    items: [
      { id: 'dashboard', label: 'Dashboard Eksekutif', icon: LayoutDashboard },
      { id: 'monitoring', label: 'Monitoring Real-time', icon: Radio },
    ],
  },
  {
    categoryTitle: 'MANAJEMEN PEMBELAJARAN',
    items: [
      { id: 'materials', label: 'Manajemen Materi', icon: BookOpen },
      { id: 'schedules', label: 'Jadwal Tayang', icon: Calendar },
      { id: 'assignments', label: 'Manajemen Tugas', icon: FileText },
      { id: 'quizzes', label: 'Manajemen Kuis', icon: HelpCircle },
    ],
  },
  {
    categoryTitle: 'DATA & KESISWAAN',
    items: [
      { id: 'classes', label: 'Data Kelas', icon: GraduationCap },
      { id: 'students', label: 'Data Siswa', icon: Users },
      { id: 'grades', label: 'Manajemen Nilai', icon: Award },
    ],
  },
  {
    categoryTitle: 'SISTEM & PELAPORAN',
    items: [
      { id: 'reports', label: 'Manajemen Laporan', icon: FileSpreadsheet },
      { id: 'users', label: 'Pengguna & Hak Akses', icon: Shield },
      { id: 'settings', label: 'Pengaturan Aplikasi', icon: Settings },
    ],
  },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const {
    currentUser,
    activeAdminMenu,
    navigateAdmin,
    navigateStudent,
    logout,
    loginAsUser,
    users,
    settings,
  } = useLms();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col font-sans text-[#202923]">
      {/* Topbar Navbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E9E3] px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3 w-full shadow-2xs">
        {/* Left Cluster: Menu Toggle + School Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1.5 text-[#68736B] hover:bg-[#E5F3E8] hover:text-[#276749] rounded-lg lg:hidden shrink-0 transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              navigateAdmin('dashboard');
            }}
            className="text-sm sm:text-base font-bold tracking-tight text-[#202923] flex items-center gap-2 min-w-0 truncate group"
          >
            <span className="w-8 h-8 bg-[#276749] text-white rounded-lg flex items-center justify-center font-bold text-sm shrink-0 shadow-xs group-hover:bg-[#1F513A] transition-colors">
              <TreePine className="w-4 h-4 text-emerald-200" />
            </span>
            <span className="truncate max-w-[120px] xs:max-w-[170px] sm:max-w-xs md:max-w-sm text-[#202923]">
              {settings.schoolName}
            </span>
          </a>
        </div>

        {/* Right Cluster: Network Status, System Badges, Demo Switcher, Portal Button, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Network Status Indicator */}
          <NetworkStatusIndicator showToggleHint={true} />

          {/* Academic Year Info (Tablet & Desktop) */}
          <span className="hidden md:inline-block text-[11px] font-mono text-[#68736B] bg-[#F7F7F2] px-2 py-1 rounded border border-[#E5E9E3] shrink-0">
            TA {settings.academicYear} ({settings.semester})
          </span>

          {/* Privacy Badge (Desktop only) */}
          <span className="hidden xl:inline-flex items-center gap-1 text-[11px] text-[#2F855A] bg-[#E5F3E8] px-2.5 py-1 rounded-full border border-[#48A878]/30 font-medium shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-[#2F855A]" /> Privasi Aman
          </span>

          {/* Quick Demo Switcher */}
          <div className="hidden sm:flex items-center gap-1.5 bg-[#F7F7F2] border border-[#E5E9E3] px-2 py-1 rounded-lg shrink-0">
            <span className="text-[11px] text-[#68736B] hidden xl:inline font-medium">Ganti Demo:</span>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => loginAsUser(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 text-[#202923] focus:outline-none cursor-pointer max-w-[120px] md:max-w-[150px] truncate"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({getRoleDisplayName(u.role)})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => navigateStudent('home')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#276749] bg-[#E5F3E8] hover:bg-[#276749] hover:text-white rounded-lg transition-colors whitespace-nowrap shrink-0 border border-[#48A878]/20"
            title="Buka Portal Siswa"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal Siswa</span>
          </button>

          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-[#68736B] hover:text-[#D9534F] hover:bg-red-50 rounded-lg shrink-0 transition-colors"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Sidebar (Charcoal Green #192A23) */}
        <aside
          className={`hidden lg:flex flex-col bg-[#192A23] border-r border-[#23382E] transition-all duration-200 shrink-0 text-white ${
            isSidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* User Profile Summary */}
          <div className="p-4 border-b border-[#23382E] flex items-center justify-between gap-3 bg-[#12201A]">
            {!isSidebarCollapsed && (
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser?.name || 'Admin'}
                </div>
                <div className="text-[11px] text-[#48A878] font-medium truncate">
                  {currentUser ? getRoleDisplayName(currentUser.role) : 'Pengguna'}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 text-[#68736B] hover:text-white hover:bg-[#23382E] rounded-md ml-auto transition-colors"
              aria-label={isSidebarCollapsed ? 'Buka Sidebar' : 'Ciutkan Sidebar'}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Categorized Navigation Links */}
          <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto custom-scrollbar">
            {CATEGORIZED_ADMIN_MENUS.map((cat, catIdx) => (
              <div key={catIdx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-[#A3B1A8]">
                    {cat.categoryTitle}
                  </div>
                )}
                {cat.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeAdminMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigateAdmin(item.id)}
                      title={item.label}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-[#276749] text-white font-semibold shadow-xs border-l-4 border-[#48A878]'
                          : 'text-[#C5D0C8] hover:text-white hover:bg-[#23382E]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#48A878]' : 'text-[#A3B1A8]'}`} />
                      {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Footer Sidebar */}
          {!isSidebarCollapsed && (
            <div className="p-3 border-t border-[#23382E] text-[11px] text-[#A3B1A8] text-center flex items-center justify-center gap-1.5 bg-[#12201A]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#48A878]" />
              <span>Sinaura LMS · Forest Edition</span>
            </div>
          )}
        </aside>

        {/* Mobile Navigation Drawer (Charcoal Green) */}
        {isMobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden bg-[#12201A]/70 backdrop-blur-xs">
            <div className="w-72 bg-[#192A23] text-white h-full flex flex-col p-4 shadow-2xl border-r border-[#23382E]">
              <div className="flex items-center justify-between pb-4 border-b border-[#23382E]">
                <div>
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-[#48A878]" /> Navigasi Admin
                  </div>
                  <div className="text-[11px] text-[#A3B1A8]">
                    {currentUser?.name} ({currentUser ? getRoleDisplayName(currentUser.role) : ''})
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="p-1.5 text-[#A3B1A8] hover:text-white hover:bg-[#23382E] rounded-md"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 py-4 space-y-4 overflow-y-auto">
                {CATEGORIZED_ADMIN_MENUS.map((cat, catIdx) => (
                  <div key={catIdx} className="space-y-1">
                    <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#A3B1A8]">
                      {cat.categoryTitle}
                    </div>
                    {cat.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeAdminMenu === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            navigateAdmin(item.id);
                            setIsMobileDrawerOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                            isActive
                              ? 'bg-[#276749] text-white font-semibold border-l-4 border-[#48A878]'
                              : 'text-[#C5D0C8] hover:bg-[#23382E] hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-[#48A878]' : 'text-[#A3B1A8]'}`} />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </nav>

              <div className="pt-3 border-t border-[#23382E] space-y-2">
                <div className="bg-[#12201A] p-2.5 rounded-lg border border-[#23382E]">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3B1A8] mb-1">
                    Ganti Akun Demo
                  </label>
                  <select
                    value={currentUser?.id || ''}
                    onChange={(e) => {
                      loginAsUser(e.target.value);
                      setIsMobileDrawerOpen(false);
                    }}
                    className="w-full text-xs font-semibold bg-[#192A23] border border-[#23382E] rounded p-2 text-white focus:outline-none"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({getRoleDisplayName(u.role)})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigateStudent('home');
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-[#276749] bg-[#E5F3E8] hover:bg-[#276749] hover:text-white rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Portal Siswa</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setIsMobileDrawerOpen(false);
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-white bg-[#D9534F] hover:bg-red-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar / Logout</span>
                </button>
              </div>
            </div>
            <div className="flex-1" onClick={() => setIsMobileDrawerOpen(false)} />
          </div>
        )}

        {/* Content Viewport */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full bg-[#F7F7F2]">
          {children}
        </main>
      </div>
    </div>
  );
};
