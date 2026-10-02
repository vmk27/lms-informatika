import React, { useState } from 'react';
import {
  Home,
  BookOpen,
  FileText,
  HelpCircle,
  Award,
  History,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  TreePine,
} from 'lucide-react';
import { useLms } from '../../context/LmsContext';
import { StudentMenuId } from '../../types/lms';
import { getRoleDisplayName } from '../../services/permissions';
import { NetworkStatusIndicator } from '../common/NetworkStatusIndicator';

interface StudentLayoutProps {
  children: React.ReactNode;
}

export interface StudentMenuCategory {
  categoryTitle: string;
  items: {
    id: StudentMenuId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const CATEGORIZED_STUDENT_MENUS: StudentMenuCategory[] = [
  {
    categoryTitle: 'AKTIVITAS BELAJAR',
    items: [
      { id: 'home', label: 'Beranda', icon: Home },
      { id: 'materials', label: 'Materi', icon: BookOpen },
      { id: 'assignments', label: 'Tugas', icon: FileText },
      { id: 'quizzes', label: 'Kuis', icon: HelpCircle },
    ],
  },
  {
    categoryTitle: 'CAPAIAN & AKUN',
    items: [
      { id: 'grades', label: 'Nilai', icon: Award },
      { id: 'activity', label: 'Aktivitas', icon: History },
      { id: 'profile', label: 'Profil', icon: User },
    ],
  },
];

export const StudentLayout: React.FC<StudentLayoutProps> = ({ children }) => {
  const {
    currentUser,
    activeStudentMenu,
    navigateStudent,
    navigateAdmin,
    logout,
    loginAsUser,
    users,
    settings,
  } = useLms();

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F7F2] flex flex-col font-sans text-[#202923]">
      {/* Top Bar (Header) */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#E5E9E3] px-3 sm:px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3 w-full shadow-2xs">
        {/* Left Cluster: Menu Toggle + School Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <button
            type="button"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="p-1.5 text-[#68736B] hover:bg-[#E5F3E8] hover:text-[#276749] rounded-lg xl:hidden shrink-0 transition-colors"
            aria-label="Buka navigasi menu"
          >
            {isMobileNavOpen ? <X className="w-5 h-5 text-[#276749]" /> : <Menu className="w-5 h-5" />}
          </button>

          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              navigateStudent('home');
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

        {/* Center Navigation Links (Screen >= 1280px) */}
        <nav className="hidden xl:flex items-center gap-2 shrink-0">
          {CATEGORIZED_STUDENT_MENUS.map((cat, catIdx) => (
            <div key={catIdx} className="flex items-center gap-1 bg-[#F7F7F2] p-1 rounded-lg border border-[#E5E9E3]">
              <span className="text-[10px] font-bold text-[#A3B1A8] uppercase px-1.5">
                {cat.categoryTitle}:
              </span>
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeStudentMenu === item.id ||
                  (item.id === 'materials' && activeStudentMenu === 'material_reader') ||
                  (item.id === 'assignments' && activeStudentMenu === 'assignment_detail') ||
                  (item.id === 'quizzes' && activeStudentMenu === 'quiz_runner');

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigateStudent(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#276749] text-white shadow-2xs'
                        : 'text-[#68736B] hover:text-[#202923] hover:bg-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Right Cluster: Network Status, Quick Switcher, Admin Button, Logout */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Network Status Indicator */}
          <NetworkStatusIndicator showToggleHint={true} />

          {/* Quick Demo Switcher */}
          <div className="hidden sm:flex items-center gap-1 bg-[#F7F7F2] border border-[#E5E9E3] p-1 rounded-lg">
            <select
              value={currentUser?.id || ''}
              onChange={(e) => loginAsUser(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 text-[#202923] focus:outline-none cursor-pointer max-w-[120px] md:max-w-[160px] truncate"
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
            onClick={() => navigateAdmin('dashboard')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#202923] bg-[#F7F7F2] hover:bg-[#E5F3E8] hover:text-[#276749] border border-[#E5E9E3] rounded-lg transition-colors whitespace-nowrap shrink-0"
            title="Buka Portal Admin"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Admin</span>
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

      {/* Mobile Nav Drawer (< 1280px) */}
      {isMobileNavOpen && (
        <div className="xl:hidden bg-white border-b border-[#E5E9E3] p-4 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-150">
          {/* Demo User Switcher */}
          <div className="bg-[#F7F7F2] p-2.5 rounded-lg border border-[#E5E9E3] space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#A3B1A8]">
              Ganti Akun Demo (Siswa / Guru / Admin)
            </label>
            <select
              value={currentUser?.id || ''}
              onChange={(e) => {
                loginAsUser(e.target.value);
                setIsMobileNavOpen(false);
              }}
              className="w-full text-xs font-semibold bg-white border border-[#E5E9E3] rounded p-2 text-[#202923] focus:outline-none"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({getRoleDisplayName(u.role)})
                </option>
              ))}
            </select>
          </div>

          {CATEGORIZED_STUDENT_MENUS.map((cat, catIdx) => (
            <div key={catIdx} className="space-y-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#A3B1A8]">
                {cat.categoryTitle}
              </div>
              {cat.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeStudentMenu === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      navigateStudent(item.id);
                      setIsMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive ? 'bg-[#276749] text-white shadow-2xs' : 'text-[#202923] hover:bg-[#E5F3E8]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Quick links */}
          <div className="pt-2 border-t border-[#E5E9E3] space-y-2">
            <button
              type="button"
              onClick={() => {
                navigateAdmin('dashboard');
                setIsMobileNavOpen(false);
              }}
              className="w-full py-2.5 text-xs font-semibold text-[#202923] bg-[#F7F7F2] hover:bg-[#E5F3E8] rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-[#E5E9E3]"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Portal Admin</span>
            </button>
            <button
              type="button"
              onClick={() => {
                logout();
                setIsMobileNavOpen(false);
              }}
              className="w-full py-2.5 text-xs font-semibold text-white bg-[#D9534F] hover:bg-red-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar / Logout</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-y-auto max-w-7xl mx-auto w-full bg-[#F7F7F2]">
        {children}
      </main>
    </div>
  );
};
