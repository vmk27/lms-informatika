import React from 'react';
import { LmsProvider, useLms } from './context/LmsContext';
import { AdminLayout } from './components/admin/AdminLayout';
import { StudentLayout } from './components/student/StudentLayout';
import { LoginView } from './components/auth/LoginView';

// Admin Views
import { AdminDashboardView } from './components/admin/AdminDashboardView';
import { RealtimeMonitoringView } from './components/admin/RealtimeMonitoringView';
import { MaterialsManagementView } from './components/admin/MaterialsManagementView';
import { MaterialEditorView } from './components/admin/MaterialEditorView';
import { ScheduleManagementView } from './components/admin/ScheduleManagementView';
import { AssignmentsManagementView } from './components/admin/AssignmentsManagementView';
import { QuizzesManagementView } from './components/admin/QuizzesManagementView';
import { ClassesManagementView } from './components/admin/ClassesManagementView';
import { StudentsManagementView } from './components/admin/StudentsManagementView';
import { GradesManagementView } from './components/admin/GradesManagementView';
import { ReportsManagementView } from './components/admin/ReportsManagementView';
import { UsersManagementView } from './components/admin/UsersManagementView';
import { SettingsManagementView } from './components/admin/SettingsManagementView';

// Student Views
import { StudentHomeView } from './components/student/StudentHomeView';
import { StudentMaterialsListView } from './components/student/StudentMaterialsListView';
import { MaterialReaderView } from './components/student/MaterialReaderView';
import { StudentAssignmentsView } from './components/student/StudentAssignmentsView';
import { StudentAssignmentDetailView } from './components/student/StudentAssignmentDetailView';
import { StudentQuizzesView } from './components/student/StudentQuizzesView';
import { StudentQuizRunnerView } from './components/student/StudentQuizRunnerView';
import { StudentGradesView } from './components/student/StudentGradesView';
import { StudentActivityView } from './components/student/StudentActivityView';
import { StudentProfileView } from './components/student/StudentProfileView';

// Toast and Confirm Dialog
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useLms();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto p-4 rounded-xl border shadow-lg flex items-start justify-between gap-3 text-xs animate-in fade-in slide-in-from-bottom-2 ${
            t.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-800'
              : t.type === 'error'
              ? 'bg-red-900 text-white border-red-800'
              : t.type === 'warning'
              ? 'bg-amber-900 text-white border-amber-800'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {t.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
            {t.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
            {t.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
            {t.type === 'info' && <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />}
            <div>
              <div className="font-bold">{t.title}</div>
              {t.description && <div className="text-[11px] opacity-90 mt-0.5">{t.description}</div>}
            </div>
          </div>
          <button
            type="button"
            onClick={() => removeToast(t.id)}
            className="p-1 opacity-70 hover:opacity-100 rounded"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};

const ConfirmationModal: React.FC = () => {
  const { confirmDialog, closeConfirm } = useLms();

  if (!confirmDialog?.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              confirmDialog.variant === 'danger'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">{confirmDialog.title}</h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {confirmDialog.description}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={confirmDialog.onConfirm}
            className={`px-4 py-2 text-xs font-semibold text-white rounded-lg ${
              confirmDialog.variant === 'danger'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmDialog.confirmLabel || 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  );
};

const MainRouter: React.FC = () => {
  const { portalMode, activeAdminMenu, activeStudentMenu } = useLms();

  if (portalMode === 'login') {
    return <LoginView />;
  }

  if (portalMode === 'student') {
    return (
      <StudentLayout>
        {activeStudentMenu === 'home' && <StudentHomeView />}
        {activeStudentMenu === 'materials' && <StudentMaterialsListView />}
        {activeStudentMenu === 'material_reader' && <MaterialReaderView />}
        {activeStudentMenu === 'assignments' && <StudentAssignmentsView />}
        {activeStudentMenu === 'assignment_detail' && <StudentAssignmentDetailView />}
        {activeStudentMenu === 'quizzes' && <StudentQuizzesView />}
        {activeStudentMenu === 'quiz_runner' && <StudentQuizRunnerView />}
        {activeStudentMenu === 'grades' && <StudentGradesView />}
        {activeStudentMenu === 'activity' && <StudentActivityView />}
        {activeStudentMenu === 'profile' && <StudentProfileView />}
      </StudentLayout>
    );
  }

  return (
    <AdminLayout>
      {activeAdminMenu === 'dashboard' && <AdminDashboardView />}
      {activeAdminMenu === 'monitoring' && <RealtimeMonitoringView />}
      {activeAdminMenu === 'materials' && <MaterialsManagementView />}
      {activeAdminMenu === 'material_editor' && <MaterialEditorView />}
      {activeAdminMenu === 'schedules' && <ScheduleManagementView />}
      {activeAdminMenu === 'assignments' && <AssignmentsManagementView />}
      {activeAdminMenu === 'quizzes' && <QuizzesManagementView />}
      {activeAdminMenu === 'classes' && <ClassesManagementView />}
      {activeAdminMenu === 'students' && <StudentsManagementView />}
      {activeAdminMenu === 'grades' && <GradesManagementView />}
      {activeAdminMenu === 'reports' && <ReportsManagementView />}
      {activeAdminMenu === 'users' && <UsersManagementView />}
      {activeAdminMenu === 'settings' && <SettingsManagementView />}
    </AdminLayout>
  );
};

export default function App() {
  return (
    <LmsProvider>
      <MainRouter />
      <ToastContainer />
      <ConfirmationModal />
    </LmsProvider>
  );
}
