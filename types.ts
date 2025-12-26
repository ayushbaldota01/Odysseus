
export enum View {
  DASHBOARD = 'DASHBOARD',
  ACADEMICS = 'ACADEMICS',
  BUILDER = 'BUILDER',
  THOUGHTS = 'THOUGHTS',
  BRAIN = 'BRAIN',
  CHAT = 'CHAT'
}

export interface AcademicTask {
  id: string;
  title: string;
  subject: string;
  dueDate: string;
  completed: boolean;
  type: 'EXAM' | 'ASSIGNMENT' | 'STUDY';
  notes?: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface LearningResource {
  id: string;
  title: string;
  content: string;
  summary: string;
  keyConcepts: string[];
  dateAdded: string;
  studyGuide?: string;
  flashcards?: Flashcard[];
}

export interface Project {
  id: string;
  title: string;
  description: string;
  whiteboard: string; // The "Context Book" / Living Spec
  status: 'IDEA' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  notes: ProjectNote[];
}

export interface ProjectNote {
  id: string;
  content: string;
  category?: 'GENERAL' | 'IDEA' | 'PLAN' | 'RESEARCH' | 'LOG';
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: 'HAPPY' | 'NEUTRAL' | 'STRESSED' | 'INSPIRED';
  date: string;
  aiReflection?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

// --- Second Brain / Knowledge Hub Types ---

export type BrainCategory = 'READ' | 'WATCH' | 'TOOL' | 'CONCEPT' | 'OTHER';

export interface BrainItem {
  id: string;
  originalText: string;
  title: string;
  summary: string;
  category: BrainCategory;
  url?: string;
  addedAt: string;
  status: 'NEW' | 'CONSUMED';
}

export interface DailyUpload {
  id: string;
  date: string; // YYYY-MM-DD
  niche: string;
  topic: string;
  content: string; // The "Lesson"
  actionableResource?: string; // Link or search term
  completed: boolean;
}

export interface AppState {
  userProfile: {
    name: string;
    major: string;
  };
  tasks: AcademicTask[];
  projects: Project[];
  journal: JournalEntry[];
  resources: LearningResource[];
  brain: {
    inbox: BrainItem[];
    dailyUploads: DailyUpload[];
  };
}

export interface EmailAnalysisResult {
  importantEmails: {
    subject: string;
    summary: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    actionItem?: {
      title: string;
      type: 'EXAM' | 'ASSIGNMENT' | 'STUDY';
      dueDate: string;
    };
  }[];
}
