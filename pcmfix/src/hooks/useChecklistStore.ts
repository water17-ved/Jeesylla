import { useCallback, useEffect, useMemo, useState } from 'react';
import { createDefaultChecklistItems } from '../data/defaultSyllabus';
import {
  ChecklistItem,
  ChecklistUnit,
  SubjectKey,
  SubjectStats,
} from '../types/checklist';

const STORAGE_KEY_ITEMS = 'pcm-study-checklist.items.v1';
const STORAGE_KEY_TAB = 'pcm-study-checklist.activeSubject.v1';
const STORAGE_KEY_EXPANDED = 'pcm-study-checklist.expandedUnits.v1';

const SUBJECT_ORDER: SubjectKey[] = ['physics', 'chemistry', 'maths'];

function isValidChecklistItem(item: unknown): item is ChecklistItem {
  if (!item || typeof item !== 'object') return false;
  const value = item as Partial<ChecklistItem>;
  return (
    (value.subject === 'physics' || value.subject === 'chemistry' || value.subject === 'maths') &&
    typeof value.id === 'string' &&
    typeof value.unitCode === 'string' &&
    typeof value.unitTitle === 'string' &&
    typeof value.subsection === 'string' &&
    typeof value.title === 'string' &&
    typeof value.completed === 'boolean'
  );
}

function loadInitialItems(): ChecklistItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_ITEMS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const validItems = parsed.filter(isValidChecklistItem);
        if (validItems.length > 0) return validItems;
      }
    }
  } catch {
    // Fallback to clean default syllabus if storage is unavailable or corrupted
  }
  return createDefaultChecklistItems();
}

function loadInitialSubject(): SubjectKey {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_TAB);
    if (raw === 'physics' || raw === 'chemistry' || raw === 'maths') {
      return raw;
    }
  } catch {
    // Ignore storage read errors
  }
  return 'physics';
}

function loadInitialExpanded(): Record<string, boolean> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_EXPANDED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return Object.fromEntries(
          Object.entries(parsed).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
        );
      }
    }
  } catch {
    // Ignore storage read errors
  }
  return { P1: true, C1: true, M1: true };
}

function computeStats(items: ChecklistItem[]): SubjectStats {
  const total = items.length;
  const completed = items.filter((item) => item.completed).length;
  const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percentage };
}

export function useChecklistStore() {
  const [items, setItems] = useState<ChecklistItem[]>(loadInitialItems);
  const [activeSubject, setActiveSubject] = useState<SubjectKey>(loadInitialSubject);
  const [expandedUnits, setExpandedUnits] =
    useState<Record<string, boolean>>(loadInitialExpanded);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }, [items]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY_TAB, activeSubject);
    } catch {
      // Ignore storage errors
    }
  }, [activeSubject]);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY_EXPANDED,
        JSON.stringify(expandedUnits)
      );
    } catch {
      // Ignore storage errors
    }
  }, [expandedUnits]);

  const subjectStats = useMemo<Record<SubjectKey, SubjectStats>>(() => {
    return {
      physics: computeStats(items.filter((i) => i.subject === 'physics')),
      chemistry: computeStats(items.filter((i) => i.subject === 'chemistry')),
      maths: computeStats(items.filter((i) => i.subject === 'maths')),
    };
  }, [items]);

  const overallStats = useMemo<SubjectStats>(() => computeStats(items), [items]);

  const unitsBySubject = useMemo<Record<SubjectKey, ChecklistUnit[]>>(() => {
    const grouped: Record<SubjectKey, ChecklistUnit[]> = {
      physics: [],
      chemistry: [],
      maths: [],
    };

    for (const subject of SUBJECT_ORDER) {
      const unitMap = new Map<string, ChecklistUnit>();
      for (const item of items) {
        if (item.subject !== subject) continue;
        let unit = unitMap.get(item.unitCode);
        if (!unit) {
          unit = {
            code: item.unitCode,
            subject,
            title: item.unitTitle,
            branch: item.branch,
            items: [],
          };
          unitMap.set(item.unitCode, unit);
          grouped[subject].push(unit);
        }
        unit.items.push(item);
      }
    }

    return grouped;
  }, [items]);

  const toggleItem = useCallback((id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const toggleUnitCompletion = useCallback(
    (subject: SubjectKey, unitCode: string) => {
      setItems((prev) => {
        const unitItems = prev.filter(
          (item) => item.subject === subject && item.unitCode === unitCode
        );
        const allDone =
          unitItems.length > 0 && unitItems.every((item) => item.completed);
        return prev.map((item) =>
          item.subject === subject && item.unitCode === unitCode
            ? { ...item, completed: !allDone }
            : item
        );
      });
    },
    []
  );

  const addCustomTopic = useCallback(
    (subject: SubjectKey, unitCode: string, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;

      setItems((prev) => {
        const existingUnit = prev.find(
          (i) => i.subject === subject && i.unitCode === unitCode
        );
        const unitTitle = existingUnit ? existingUnit.unitTitle : 'Custom Topics';
        const branch = existingUnit?.branch;

        const newItem: ChecklistItem = {
          id: `custom-${subject}-${unitCode}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2, 7)}`,
          subject,
          unitCode,
          unitTitle,
          branch,
          subsection: 'Personal Topics',
          title: trimmed,
          completed: false,
          isCustom: true,
        };

        // Insert before Practice & Revision items of that unit if present
        const lastUnitIdx = prev.reduce((acc, item, idx) => {
          if (item.subject === subject && item.unitCode === unitCode) {
            return idx;
          }
          return acc;
        }, -1);

        if (lastUnitIdx === -1) {
          return [...prev, newItem];
        }

        const next = [...prev];
        next.splice(lastUnitIdx + 1, 0, newItem);
        return next;
      });
    },
    []
  );

  const removeCustomTopic = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toggleUnitExpanded = useCallback((unitCode: string) => {
    setExpandedUnits((prev) => ({
      ...prev,
      [unitCode]: !prev[unitCode],
    }));
  }, []);

  const setAllUnitsExpanded = useCallback(
    (subject: SubjectKey, expanded: boolean) => {
      const codes = unitsBySubject[subject].map((u) => u.code);
      setExpandedUnits((prev) => {
        const next = { ...prev };
        for (const code of codes) {
          next[code] = expanded;
        }
        return next;
      });
    },
    [unitsBySubject]
  );

  const importItems = useCallback(
    (newItems: ChecklistItem[], mode: 'replace' | 'merge') => {
      if (mode === 'replace') {
        setItems(newItems);
        const firstBySubject: Record<string, boolean> = {};
        for (const s of SUBJECT_ORDER) {
          const first = newItems.find((i) => i.subject === s);
          if (first) firstBySubject[first.unitCode] = true;
        }
        setExpandedUnits(firstBySubject);
        return;
      }

      setItems((prev) => {
        const existingKeys = new Set(
          prev.map(
            (i) =>
              `${i.subject}::${i.unitCode}::${i.title.trim().toLowerCase()}`
          )
        );
        const toAppend = newItems.filter(
          (i) =>
            !existingKeys.has(
              `${i.subject}::${i.unitCode}::${i.title.trim().toLowerCase()}`
            )
        );
        return [...prev, ...toAppend];
      });
    },
    []
  );

  const resetSubjectProgress = useCallback((subject: SubjectKey) => {
    setItems((prev) =>
      prev.map((item) =>
        item.subject === subject ? { ...item, completed: false } : item
      )
    );
  }, []);

  const resetAllProgress = useCallback(() => {
    setItems((prev) => prev.map((item) => ({ ...item, completed: false })));
  }, []);

  const restoreDefaultSyllabus = useCallback(() => {
    setItems(createDefaultChecklistItems());
    setExpandedUnits({ P1: true, C1: true, M1: true });
  }, []);

  const applySavePayload = useCallback(
    (payload: {
      items: ChecklistItem[];
      activeSubject?: SubjectKey;
      expandedUnits?: Record<string, boolean>;
    }) => {
      const validItems = payload.items.filter(isValidChecklistItem);
      if (validItems.length > 0) {
        setItems(validItems);
      }
      if (
        payload.activeSubject === 'physics' ||
        payload.activeSubject === 'chemistry' ||
        payload.activeSubject === 'maths'
      ) {
        setActiveSubject(payload.activeSubject);
      }
      if (payload.expandedUnits && typeof payload.expandedUnits === 'object' && !Array.isArray(payload.expandedUnits)) {
        setExpandedUnits(
          Object.fromEntries(
            Object.entries(payload.expandedUnits).filter((entry): entry is [string, boolean] => typeof entry[1] === 'boolean')
          )
        );
      }
    },
    []
  );

  const exportMarkdown = useCallback((): string => {
    const lines: string[] = ['# PCM Study Checklist', ''];
    const labels: Record<SubjectKey, string> = {
      physics: 'PHYSICS',
      chemistry: 'CHEMISTRY',
      maths: 'MATHEMATICS',
    };

    for (const subject of SUBJECT_ORDER) {
      const units = unitsBySubject[subject];
      if (units.length === 0) continue;
      lines.push(`# ${labels[subject]}`, '');
      for (const unit of units) {
        lines.push(`## ${unit.code}: ${unit.title}`, '');
        let lastSub = '';
        for (const item of unit.items) {
          if (item.subsection !== lastSub) {
            lastSub = item.subsection;
            lines.push(`**${lastSub}**`);
          }
          lines.push(`  - [${item.completed ? 'x' : ' '}] ${item.title}`);
        }
        lines.push('');
      }
    }
    return lines.join('\n');
  }, [unitsBySubject]);

  return {
    items,
    activeSubject,
    setActiveSubject,
    expandedUnits,
    subjectStats,
    overallStats,
    unitsBySubject,
    toggleItem,
    toggleUnitCompletion,
    addCustomTopic,
    removeCustomTopic,
    toggleUnitExpanded,
    setAllUnitsExpanded,
    importItems,
    resetSubjectProgress,
    resetAllProgress,
    restoreDefaultSyllabus,
    applySavePayload,
    exportMarkdown,
  };
}
