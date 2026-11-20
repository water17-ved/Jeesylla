import { memo, useMemo, useState } from 'react';
import { Check, ChevronDown, Plus, Trash2 } from 'lucide-react';
import { ChecklistItem, ChecklistUnit, FilterStatus, SubjectKey } from '../types/checklist';

interface UnitAccordionProps {
  unit: ChecklistUnit;
  isExpanded: boolean;
  filterStatus: FilterStatus;
  searchQuery: string;
  onToggleExpand: (unitCode: string) => void;
  onToggleItem: (id: string) => void;
  onToggleUnitAll: (subject: SubjectKey, unitCode: string) => void;
  onAddTopic: (subject: SubjectKey, unitCode: string, title: string) => void;
  onRemoveCustomTopic: (id: string) => void;
}

export const UnitAccordion = memo(function UnitAccordion({
  unit,
  isExpanded,
  filterStatus,
  searchQuery,
  onToggleExpand,
  onToggleItem,
  onToggleUnitAll,
  onAddTopic,
  onRemoveCustomTopic,
}: UnitAccordionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const totalCount = unit.items.length;
  const completedCount = useMemo(
    () => unit.items.filter((i) => i.completed).length,
    [unit.items]
  );
  const unitPct =
    totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const allComplete = totalCount > 0 && completedCount === totalCount;

  const visibleItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return unit.items.filter((item) => {
      if (filterStatus === 'remaining' && item.completed) return false;
      if (filterStatus === 'completed' && !item.completed) return false;
      if (q) {
        const hay = `${item.title} ${item.subsection} ${unit.code} ${unit.title}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [unit.items, unit.code, unit.title, filterStatus, searchQuery]);

  const groupedSubsections = useMemo(() => {
    const groups: { name: string; items: ChecklistItem[] }[] = [];
    const map = new Map<string, ChecklistItem[]>();
    for (const item of visibleItems) {
      let arr = map.get(item.subsection);
      if (!arr) {
        arr = [];
        map.set(item.subsection, arr);
        groups.push({ name: item.subsection, items: arr });
      }
      arr.push(item);
    }
    return groups;
  }, [visibleItems]);

  // If a search or filter yields 0 items inside this unit, hide the unit card
  if (visibleItems.length === 0) {
    return null;
  }

  const handleSubmitTopic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAddTopic(unit.subject, unit.code, trimmed);
    setNewTitle('');
    setIsAdding(false);
  };

  return (
    <article className="bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] rounded-2xl overflow-hidden transition-colors">
      {/* Unit Header */}
      <button
        type="button"
        onClick={() => onToggleExpand(unit.code)}
        aria-expanded={isExpanded}
        className="w-full min-h-[60px] px-4 py-3.5 sm:px-5 flex items-center justify-between gap-3 text-left hover:bg-[#F5EFE6]/60 dark:hover:bg-[#223028]/65 active:bg-[#EAE1D3]/50 dark:active:bg-[#223028] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#556B4F] dark:focus-visible:outline-[#8FA993]"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-semibold text-[#556B4F] dark:text-[#8FA993] shrink-0">
              {unit.code}
            </span>
            <h2 className="font-display text-[15px] sm:text-base font-semibold text-[#23211E] dark:text-[#F5F0E6] leading-snug">
              {unit.title}
            </h2>
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-[#6B645B] dark:text-[#A8B5AA] tabular-nums">
            <span>
              {completedCount} of {totalCount} done
            </span>
            {allComplete && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-[#556B4F] dark:text-[#8FA993]">
                  Complete
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden xs:flex sm:flex items-center gap-2">
            <div className="w-14 h-1.5 rounded-full bg-[#EAE1D3] dark:bg-[#223028] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#556B4F] dark:bg-[#8FA993] transition-all duration-200 ease-out"
                style={{ width: `${unitPct}%` }}
              />
            </div>
            <span className="font-mono text-xs text-[#6B645B] dark:text-[#8FA993] tabular-nums w-8 text-right">
              {unitPct}%
            </span>
          </div>
          <span className="min-w-[32px] min-h-[32px] flex items-center justify-center text-[#6B645B] dark:text-[#A8B5AA]">
            <ChevronDown
              className={`w-4 h-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : 'rotate-0'
              }`}
              aria-hidden="true"
            />
          </span>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-[#DFD5C5] dark:border-[#2B3B32]">
          {/* Unit Actions Row */}
          <div className="px-4 py-2 sm:px-5 bg-[#F5EFE6]/55 dark:bg-[#131B17]/55 flex flex-wrap items-center justify-between gap-2 border-b border-[#EAE1D3] dark:border-[#2B3B32]">
            <button
              type="button"
              onClick={() => onToggleUnitAll(unit.subject, unit.code)}
              className="min-h-[44px] px-2 -ml-2 text-xs font-medium text-[#556B4F] dark:text-[#8FA993] hover:text-[#465941] dark:hover:text-[#A9C2AD] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#556B4F] dark:focus-visible:outline-[#8FA993] rounded-lg"
            >
              {allComplete ? 'Unmark all in unit' : 'Mark unit complete'}
            </button>

            <button
              type="button"
              onClick={() => setIsAdding((prev) => !prev)}
              className="min-h-[44px] px-2.5 -mr-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#556B4F] dark:focus-visible:outline-[#8FA993] rounded-lg"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{isAdding ? 'Close' : 'Add topic'}</span>
            </button>
          </div>

          {/* Inline Add Topic Form */}
          {isAdding && (
            <form
              onSubmit={handleSubmitTopic}
              className="px-4 py-3 sm:px-5 bg-[#F5EFE6]/80 dark:bg-[#131B17]/75 border-b border-[#EAE1D3] dark:border-[#2B3B32] flex items-center gap-2"
            >
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`Add topic to ${unit.code}...`}
                aria-label={`Add topic to ${unit.code} ${unit.title}`}
                className="flex-1 min-w-0 h-11 px-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm text-[#23211E] dark:text-[#F5F0E6] placeholder:text-[#8A8277] dark:placeholder:text-[#78877B] focus:outline-none focus:border-[#556B4F] dark:focus:border-[#8FA993]"
                autoFocus
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="h-11 px-4 rounded-xl bg-[#556B4F] dark:bg-[#8FA993] text-[#FAF6F0] dark:text-[#131B17] text-sm font-medium hover:bg-[#465941] dark:hover:bg-[#A2BA9F] disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0"
              >
                Add
              </button>
            </form>
          )}

          {/* Subsections & Topic Rows */}
          <div>
            {groupedSubsections.map((group, groupIndex) => (
              <div
                key={`${unit.code}-${group.name}`}
                className={
                  groupIndex > 0
                    ? 'border-t border-[#EAE1D3] dark:border-[#2B3B32]'
                    : ''
                }
              >
                <div className="px-4 pt-3.5 pb-1.5 sm:px-5 text-xs font-medium text-[#6B645B] dark:text-[#A8B5AA]">
                  {group.name}
                </div>

                <ul className="divide-y divide-[#EAE1D3]/70 dark:divide-[#2B3B32]/80">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex items-stretch">
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={item.completed}
                        onClick={() => onToggleItem(item.id)}
                        className="flex-1 min-h-[48px] px-4 py-3 sm:px-5 flex items-start gap-3.5 text-left hover:bg-[#F5EFE6]/65 dark:hover:bg-[#223028]/55 active:bg-[#EAE1D3]/60 dark:active:bg-[#223028] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#556B4F] dark:focus-visible:outline-[#8FA993]"
                      >
                        <span
                          aria-hidden="true"
                          className={`w-5 h-5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-colors duration-150 ${
                            item.completed
                              ? 'bg-[#556B4F] dark:bg-[#8FA993] border-[#556B4F] dark:border-[#8FA993] text-[#FAF6F0] dark:text-[#131B17]'
                              : 'bg-[#FAF6F0] dark:bg-[#131B17] border-[#B8AEA0] dark:border-[#415548] text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </span>
                        <span
                          className={`text-[15px] leading-snug transition-colors duration-150 ${
                            item.completed
                              ? 'text-[#6B645B] dark:text-[#78877B] line-through decoration-[#B8AEA0] dark:decoration-[#4B6153]'
                              : 'text-[#23211E] dark:text-[#F5F0E6]'
                          }`}
                        >
                          {item.title}
                        </span>
                      </button>

                      {item.isCustom && (
                        <button
                          type="button"
                          onClick={() => onRemoveCustomTopic(item.id)}
                          aria-label={`Delete custom topic ${item.title}`}
                          className="min-w-[44px] min-h-[44px] px-3 flex items-center justify-center text-[#8A8277] dark:text-[#78877B] hover:text-[#8C3F35] dark:hover:text-[#E59485] transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}, (prev, next) => {
  const a = prev.unit;
  const b = next.unit;
  if (
    a.code !== b.code ||
    a.title !== b.title ||
    a.subject !== b.subject ||
    a.branch !== b.branch ||
    a.items.length !== b.items.length ||
    prev.isExpanded !== next.isExpanded ||
    prev.filterStatus !== next.filterStatus ||
    prev.searchQuery !== next.searchQuery ||
    prev.onToggleExpand !== next.onToggleExpand ||
    prev.onToggleItem !== next.onToggleItem ||
    prev.onToggleUnitAll !== next.onToggleUnitAll ||
    prev.onAddTopic !== next.onAddTopic ||
    prev.onRemoveCustomTopic !== next.onRemoveCustomTopic
  ) return false;

  // Only redraw the accordion whose topic objects actually changed.
  return a.items.every((item, index) => item === b.items[index]);
});
