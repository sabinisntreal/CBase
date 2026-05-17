export type Idea = {
  id: string;
  content: string;
  createdAt: number;
};

export type HorizonType = 'today' | 'tomorrow' | 'week' | 'month';

export type Task = {
  id: string;
  content: string;
  horizon: HorizonType;
  completed: boolean;
  createdAt: number;
  subTasks: { id: string; content: string; completed: boolean }[];
};

export type Habit = {
  id: string;
  name: string;
  // Keyed by YYYY-MM-DD
  history: Record<string, boolean>;
};

export type Goal = {
  id: string;
  content: string;
};

export type JournalEntry = {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
};

export type ArchiveNote = {
  id: string;
  title: string;
  content: string;
  parentId?: string; // For nested structure
};

export type AppState = {
  ideas: Idea[];
  tasks: Task[];
  habits: Habit[];
  goals: Goal[];
  journals: JournalEntry[];
  archiveNotes: ArchiveNote[];
};
