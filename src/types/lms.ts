export type UserRole = 'super_admin' | 'school_admin' | 'teacher' | 'student';

export type AccountStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  // Teacher / Admin scope
  assignedClassIds?: string[];
  assignedSubjects?: string[];
  // Student scope
  nis?: string;
  nisn?: string;
  classId?: string;
  lastActiveAt: string;
}

export interface SchoolClass {
  id: string;
  code: string;
  name: string;
  gradeLevel: 'X' | 'XI' | 'XII';
  academicYear: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  studentIds: string[];
  status: 'active' | 'archived';
}

export type MaterialStatus = 'draft' | 'scheduled' | 'published' | 'closed' | 'archived';

export interface MaterialAttachment {
  id: string;
  title: string;
  type: 'pdf' | 'document' | 'image' | 'video_url';
  url: string;
  fileSize?: string;
}

export interface MaterialCheckpoint {
  id: string;
  order: number;
  title: string;
  sectionAnchor: string;
  description: string;
  required: boolean;
}

export interface ComprehensionQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface Material {
  id: string;
  title: string;
  subject: string;
  topic: string;
  classIds: string[];
  order: number;
  status: MaterialStatus;
  publishStartAt: string;
  publishEndAt: string;
  minReadMinutes: number;
  pauseOnWindowBlur: boolean;
  requireAllCheckpoints: boolean;
  requireComprehensionPass: boolean;
  isPrerequisiteForAssignments: boolean;
  isPrerequisiteForQuizzes: boolean;
  summary: string;
  sections: {
    id: string;
    heading: string;
    subheading?: string;
    bodyHtml: string;
    checkpointId?: string;
  }[];
  attachments: MaterialAttachment[];
  checkpoints: MaterialCheckpoint[];
  comprehensionQuestions: ComprehensionQuestion[];
  createdById: string;
  createdByName: string;
  updatedAt: string;
}

/**
 * Kontrak pencatatan sesi membaca materi sesuai Spesifikasi Bagian H
 */
export interface ReadingSession {
  student_id: string;
  material_id: string;
  session_id: string;
  started_at: string;
  last_heartbeat_at: string;
  active_duration_seconds: number;
  paused_duration_seconds: number;
  last_checkpoint: string | null;
  reached_checkpoints: string[];
  answered_questions: Record<string, number>; // questionId -> selectedIndex
  visibility_state: 'visible' | 'hidden';
  window_focused: boolean;
  completion_status: 'not_started' | 'active' | 'paused' | 'completed';
  completed_at: string | null;
  sync_status: 'synced' | 'pending_offline' | 'conflict_resolved';
  last_sequence_number: number;
}

export interface RubricItem {
  id: string;
  criteria: string;
  maxScore: number;
  description: string;
}

export type AssignmentAnswerType = 'text' | 'file' | 'combination';

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  materialId: string;
  requireMaterialCompletion: boolean;
  classIds: string[];
  instructions: string;
  attachments: MaterialAttachment[];
  dueDate: string;
  publishStartAt: string;
  status: 'draft' | 'published' | 'closed' | 'archived';
  answerType: AssignmentAnswerType;
  maxScore: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  maxAttempts: number;
  rubric: RubricItem[];
  createdById: string;
  createdByName: string;
}

export interface GradeRevision {
  id: string;
  previousScore: number | null;
  newScore: number;
  changedByName: string;
  changedAt: string;
  reason: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  status: 'not_submitted' | 'submitted' | 'late' | 'graded';
  submittedAt: string | null;
  attemptCount: number;
  textAnswer: string;
  fileAttachments: { name: string; size: string; uploadedAt: string }[];
  score: number | null;
  rubricScores?: Record<string, number>;
  teacherFeedback: string;
  gradedByName: string | null;
  gradedAt: string | null;
  revisionHistory: GradeRevision[];
}

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  options?: string[]; // For multiple_choice and true_false
  correctAnswer: string; // Index string for MC/TF or exact/keyword text for short_answer
  points: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  materialId: string;
  requireMaterialCompletion: boolean;
  classIds: string[];
  description: string;
  durationMinutes: number;
  publishStartAt: string;
  publishEndAt: string;
  status: 'draft' | 'scheduled' | 'published' | 'closed';
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showResultImmediately: boolean;
  showAnswerKey: boolean;
  questions: QuizQuestion[];
  createdById: string;
  createdByName: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  attemptNumber: number;
  status: 'in_progress' | 'completed';
  startedAt: string;
  submittedAt: string | null;
  lastSavedAt: string;
  remainingSeconds: number;
  answers: Record<string, string>; // questionId -> answer
  score: number | null;
  maxPossibleScore: number;
}

export interface GradeWeightConfig {
  materialCompletionWeight: number; // e.g., 20%
  assignmentWeight: number;         // e.g., 40%
  quizWeight: number;               // e.g., 40%
  passingGrade: number;             // KKM e.g., 75
  updatedAt: string;
  updatedBy: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  category: 'material' | 'schedule' | 'assignment' | 'quiz' | 'grade' | 'student' | 'class' | 'system' | 'reading_session';
  targetName: string;
  details: string;
}

export interface SchoolSettings {
  schoolName: string;
  npsn: string;
  address: string;
  principalName: string;
  principalNip: string;
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  pdfHeaderSubtitle: string;
  defaultMinReadMinutes: number;
  enforcePauseOnBlurDefault: boolean;
  heartbeatIntervalSeconds: number;
}

export type AdminMenuId =
  | 'dashboard'
  | 'monitoring'
  | 'materials'
  | 'material_editor'
  | 'schedules'
  | 'assignments'
  | 'quizzes'
  | 'classes'
  | 'students'
  | 'grades'
  | 'reports'
  | 'users'
  | 'settings';

export type StudentMenuId =
  | 'home'
  | 'materials'
  | 'material_reader'
  | 'assignments'
  | 'assignment_detail'
  | 'quizzes'
  | 'quiz_runner'
  | 'grades'
  | 'activity'
  | 'profile';

export interface NavigationFilterState {
  classId?: string;
  materialId?: string;
  status?: string;
  studentId?: string;
  reportType?: string;
}
