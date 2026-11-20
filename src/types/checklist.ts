export type SubjectKey = 'physics' | 'chemistry' | 'maths';

export type FilterStatus = 'all' | 'remaining' | 'completed';

export interface ChecklistItem {
  id: string;
  subject: SubjectKey;
  unitCode: string;
  unitTitle: string;
  branch?: string;
  subsection: string;
  title: string;
  completed: boolean;
  isCustom?: boolean;
}

export interface ChecklistUnit {
  code: string;
  subject: SubjectKey;
  title: string;
  branch?: string;
  items: ChecklistItem[];
}

export interface SubjectStats {
  completed: number;
  total: number;
  percentage: number;
}

export interface ParsedChecklistResult {
  items: ChecklistItem[];
  keptCounts: Record<SubjectKey, number>;
  strippedSections: string[];
  strippedItemsCount: number;
}
