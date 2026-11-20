import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { ChecklistItem } from '../types/checklist';
import { parseChecklistMarkdown } from '../utils/checklistParser';

interface ImportSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: ChecklistItem[], mode: 'replace' | 'merge') => void;
}

export function ImportSheet({ isOpen, onClose, onImport }: ImportSheetProps) {
  const [rawText, setRawText] = useState('');

  const preview = useMemo(() => {
    if (!rawText.trim()) return null;
    return parseChecklistMarkdown(rawText);
  }, [rawText]);

  if (!isOpen) return null;

  const totalKept = preview ? preview.items.length : 0;

  const handleApply = (mode: 'replace' | 'merge') => {
    if (!preview || preview.items.length === 0) return;
    onImport(preview.items, mode);
    setRawText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#23211E]/40 dark:bg-[#0B100D]/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-sheet-title"
    >
      <div className="w-full sm:max-w-xl bg-[#FAF6F0] dark:bg-[#1A251F] border-t sm:border border-[#DFD5C5] dark:border-[#2B3B32] rounded-t-3xl sm:rounded-2xl max-h-[88dvh] flex flex-col overflow-hidden">
        {/* Mobile grab handle */}
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[#DFD5C5] dark:bg-[#2B3B32]" aria-hidden="true" />
        </div>

        <div className="px-5 py-3.5 sm:py-4 border-b border-[#DFD5C5] dark:border-[#2B3B32] flex items-center justify-between gap-3">
          <div>
            <h2
              id="import-sheet-title"
              className="font-display text-lg font-semibold text-[#23211E] dark:text-[#F5F0E6]"
            >
              Import Checklist
            </h2>
            <p className="text-xs text-[#6B645B] dark:text-[#A8B5AA] mt-0.5">
              Non-PCM sections like A1, A2, D1, and PL1–PL3 are removed automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close import dialog"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] hover:bg-[#EAE1D3]/60 dark:hover:bg-[#223028] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <label className="block">
            <span className="block text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] mb-2">
              Paste Markdown Checklist
            </span>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={7}
              placeholder={`# PAPER 1 – PHYSICS\n## P1: Units and Measurements\n- [ ] SI units\n\n# PAPER 1 – CHEMISTRY\n## C1: Some Basic Concepts\n- [ ] Mole concept\n\n# PAPER 1 – MATHEMATICS\n## M1: Sets, Relations and Functions\n- [ ] Power set`}
              className="w-full rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] p-3.5 text-sm font-mono text-[#23211E] dark:text-[#F5F0E6] placeholder:text-[#8A8277] dark:placeholder:text-[#78877B] focus:outline-none focus:border-[#556B4F] dark:focus:border-[#8FA993]"
            />
          </label>

          {preview && (
            <div className="rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] p-4 space-y-2 text-xs">
              <div className="font-medium text-[#23211E] dark:text-[#F5F0E6]">
                Sanitization Preview
              </div>
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[#6B645B] dark:text-[#A8B5AA] tabular-nums">
                <span>Physics: {preview.keptCounts.physics}</span>
                <span aria-hidden="true">·</span>
                <span>Chemistry: {preview.keptCounts.chemistry}</span>
                <span aria-hidden="true">·</span>
                <span>Maths: {preview.keptCounts.maths}</span>
              </div>
              {(preview.strippedItemsCount > 0 ||
                preview.strippedSections.length > 0) && (
                <div className="pt-1 border-t border-[#DFD5C5] dark:border-[#2B3B32] text-[#6B645B] dark:text-[#A8B5AA] tabular-nums">
                  Excluded {preview.strippedItemsCount} non-PCM items
                  {preview.strippedSections.length > 0
                    ? ` (${preview.strippedSections.slice(0, 4).join(', ')}${
                        preview.strippedSections.length > 4 ? '…' : ''
                      })`
                    : ''}
                </div>
              )}
              {totalKept === 0 && (
                <div className="text-[#8C3F35] dark:text-[#E59485]">
                  No Physics, Chemistry, or Maths checkbox items detected yet. Include headings like Physics / Chemistry / Mathematics or unit codes P1 / C1 / M1.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-[#DFD5C5] dark:border-[#2B3B32] bg-[#FAF6F0] dark:bg-[#1A251F] flex flex-wrap items-center justify-end gap-2.5 pb-safe">
          <button
            type="button"
            onClick={() => handleApply('merge')}
            disabled={totalKept === 0}
            className="min-h-[44px] px-4 rounded-xl border border-[#DFD5C5] dark:border-[#2B3B32] bg-[#F5EFE6] dark:bg-[#131B17] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap"
          >
            Merge New Items
          </button>
          <button
            type="button"
            onClick={() => handleApply('replace')}
            disabled={totalKept === 0}
            className="min-h-[44px] px-4 rounded-xl bg-[#556B4F] dark:bg-[#8FA993] text-sm font-medium text-[#FAF6F0] dark:text-[#131B17] hover:bg-[#465941] dark:hover:bg-[#A2BA9F] disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap"
          >
            Replace Checklist
          </button>
        </div>
      </div>
    </div>
  );
}
