export interface GeminiNoteAnalysisInput {
  content: string;
  fallbackProjectId: string;
  recentProjectNotes: string[];
}

export interface GeminiTodoItem {
  title: string;
  details: string;
}

export interface GeminiNoteAnalysisResult {
  suggestedProjectId: string;
  tags: string[];
  todoItems: GeminiTodoItem[];
  completedSignals: string[];
  prompt: string;
}
