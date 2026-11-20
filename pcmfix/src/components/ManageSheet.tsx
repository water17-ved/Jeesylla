import { useState } from 'react';
import { Check, Cloud, Download, Moon, RotateCcw, Sun, X } from 'lucide-react';
import { ThemeMode } from '../hooks/useTheme';
import { SubjectKey } from '../types/checklist';

interface ManageSheetProps {
  isOpen: boolean;
  activeSubject: SubjectKey;
  theme: ThemeMode;
  onSetTheme: (theme: ThemeMode) => void;
  linkedEmail?: string | null;
  isDriveConnected?: boolean;
  onOpenDriveSave?: () => void;
  onClose: () => void;
  onExportMarkdown: () => string;
  onResetSubject: (subject: SubjectKey) => void;
  onResetAll: () => void;
  onRestoreDefault: () => void;
}

const SUBJECT_NAMES: Record<SubjectKey, string> = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  maths: 'Maths',
};

export function ManageSheet({
  isOpen,
  activeSubject,
  theme,
  onSetTheme,
  linkedEmail,
  isDriveConnected = false,
  onOpenDriveSave,
  onClose,
  onExportMarkdown,
  onResetSubject,
  onResetAll,
  onRestoreDefault,
}: ManageSheetProps) {
  const [confirmAction, setConfirmAction] = useState<
    'subject' | 'all' | 'restore' | null
  >(null);
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const md = onExportMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pcm-study-checklist.md';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    const md = onExportMarkdown();
    try {
      await navigator.clipboard.writeText(md);
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 2000);
    } catch {
      handleDownload();
    }
  };

  const handleConfirm = () => {
    if (confirmAction === 'subject') {
      onResetSubject(activeSubject);
    } else if (confirmAction === 'all') {
      onResetAll();
    } else if (confirmAction === 'restore') {
      onRestoreDefault();
    }
    setConfirmAction(null);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#23211E]/40 dark:bg-[#0B100D]/70 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="manage-sheet-title"
    >
      <div className="w-full sm:max-w-md bg-[#FAF6F0] dark:bg-[#1A251F] border-t sm:border border-[#DFD5C5] dark:border-[#2B3B32] rounded-t-3xl sm:rounded-2xl overflow-hidden">
        <div className="sm:hidden pt-3 pb-1 flex justify-center">
          <div className="w-10 h-1 rounded-full bg-[#DFD5C5] dark:bg-[#2B3B32]" aria-hidden="true" />
        </div>

        <div className="px-5 py-3.5 sm:py-4 border-b border-[#DFD5C5] dark:border-[#2B3B32] flex items-center justify-between gap-3">
          <div>
            <h2
              id="manage-sheet-title"
              className="font-display text-lg font-semibold text-[#23211E] dark:text-[#F5F0E6]"
            >
              Manage Checklist
            </h2>
            <p className="text-xs text-[#6B645B] dark:text-[#A8B5AA] mt-0.5">
              {isDriveConnected && linkedEmail
                ? `Linked to ${linkedEmail}`
                : 'Saved locally on this device'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setConfirmAction(null);
              onClose();
            }}
            aria-label="Close manage dialog"
            className="min-w-[44px] min-h-[44px] -mr-2 flex items-center justify-center rounded-xl text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] hover:bg-[#EAE1D3]/60 dark:hover:bg-[#223028] transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-3 pb-safe">
          {/* Appearance / Theme Switcher */}
          <div className="rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] p-2 flex items-center justify-between gap-3">
            <span className="pl-2 text-xs font-medium text-[#6B645B] dark:text-[#A8B5AA]">
              Theme
            </span>
            <div
              role="group"
              aria-label="Color theme"
              className="inline-flex items-center p-0.5 rounded-lg bg-[#EAE1D3] dark:bg-[#223028] border border-[#DFD5C5] dark:border-[#2B3B32]"
            >
              <button
                type="button"
                onClick={() => onSetTheme('light')}
                aria-pressed={theme === 'light'}
                className={`min-h-[34px] px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  theme === 'light'
                    ? 'bg-[#FAF6F0] text-[#23211E] shadow-xs'
                    : 'text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6]'
                }`}
              >
                <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Normal</span>
              </button>
              <button
                type="button"
                onClick={() => onSetTheme('dark')}
                aria-pressed={theme === 'dark'}
                className={`min-h-[34px] px-2.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                  theme === 'dark'
                    ? 'bg-[#131B17] text-[#F5F0E6] shadow-xs'
                    : 'text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#8FA993]" aria-hidden="true" />
                <span>Deep Forest Moss</span>
              </button>
            </div>
          </div>

          {onOpenDriveSave && (
            <button
              type="button"
              onClick={() => {
                setConfirmAction(null);
                onClose();
                onOpenDriveSave();
              }}
              className="w-full min-h-[46px] px-4 rounded-xl bg-[#E3EAD9]/75 dark:bg-[#223228] border border-[#C3D0B8] dark:border-[#3A4E40] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#E3EAD9] dark:hover:bg-[#293D31] flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Cloud className="w-4 h-4 text-[#556B4F] dark:text-[#8FA993] shrink-0" aria-hidden="true" />
                <span className="truncate">Google Drive Save File</span>
              </div>
              <span className="text-xs font-medium text-[#556B4F] dark:text-[#8FA993] shrink-0">
                {isDriveConnected ? 'Connected' : 'Link Account'}
              </span>
            </button>
          )}

          {/* Export actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleDownload}
              className="min-h-[44px] px-3.5 rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-[#556B4F] dark:text-[#8FA993]" aria-hidden="true" />
              <span>Export .md</span>
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className="min-h-[44px] px-3.5 rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Check className="w-4 h-4 text-[#556B4F] dark:text-[#8FA993]" aria-hidden="true" />
              <span>{copiedNotice ? 'Copied' : 'Copy Text'}</span>
            </button>
          </div>

          <div className="border-t border-[#EAE1D3] dark:border-[#2B3B32] pt-3 space-y-2">
            {confirmAction === null ? (
              <>
                <button
                  type="button"
                  onClick={() => setConfirmAction('subject')}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] text-left flex items-center justify-between transition-colors"
                >
                  <span>Clear {SUBJECT_NAMES[activeSubject]} checkmarks</span>
                  <RotateCcw className="w-4 h-4 text-[#6B645B] dark:text-[#A8B5AA]" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmAction('all')}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] text-left flex items-center justify-between transition-colors"
                >
                  <span>Clear all PCM checkmarks</span>
                  <RotateCcw className="w-4 h-4 text-[#6B645B] dark:text-[#A8B5AA]" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => setConfirmAction('restore')}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm font-medium text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] text-left flex items-center justify-between transition-colors"
                >
                  <span>Restore default JEE Main PCM syllabus</span>
                  <RotateCcw className="w-4 h-4" aria-hidden="true" />
                </button>
              </>
            ) : (
              <div className="rounded-xl bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] p-4 space-y-3">
                <p className="text-sm text-[#23211E] dark:text-[#F5F0E6]">
                  {confirmAction === 'subject' &&
                    `Uncheck all completed topics in ${SUBJECT_NAMES[activeSubject]}?`}
                  {confirmAction === 'all' &&
                    'Uncheck all completed topics across Physics, Chemistry, and Maths?'}
                  {confirmAction === 'restore' &&
                    'Restore the original JEE Main 2027 PCM syllabus? Custom additions and progress will reset.'}
                </p>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmAction(null)}
                    className="min-h-[44px] px-4 rounded-xl border border-[#DFD5C5] dark:border-[#2B3B32] bg-[#FAF6F0] dark:bg-[#1A251F] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className="min-h-[44px] px-4 rounded-xl bg-[#556B4F] dark:bg-[#8FA993] text-sm font-medium text-[#FAF6F0] dark:text-[#131B17] hover:bg-[#465941] dark:hover:bg-[#A2BA9F] transition-colors"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
