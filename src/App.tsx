import { useMemo, useState } from 'react';
import {
  Atom,
  ChevronsDownUp,
  ChevronsUpDown,
  Cloud,
  FlaskConical,
  Moon,
  Search,
  Sigma,
  SlidersHorizontal,
  Sun,
  Upload,
  X,
} from 'lucide-react';
import { DriveSaveSheet } from './components/DriveSaveSheet';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { ImportSheet } from './components/ImportSheet';
import { ManageSheet } from './components/ManageSheet';
import { SubjectProgressCard } from './components/SubjectProgressCard';
import { UnitAccordion } from './components/UnitAccordion';
import { useChecklistStore } from './hooks/useChecklistStore';
import { useGoogleDriveSave } from './hooks/useGoogleDriveSave';
import { useTheme } from './hooks/useTheme';
import { ChecklistUnit, FilterStatus, SubjectKey } from './types/checklist';

interface SubjectTabConfig {
  key: SubjectKey;
  label: string;
  Icon: typeof Atom;
}

const SUBJECT_TABS: SubjectTabConfig[] = [
  { key: 'physics', label: 'Physics', Icon: Atom },
  { key: 'chemistry', label: 'Chemistry', Icon: FlaskConical },
  { key: 'maths', label: 'Maths', Icon: Sigma },
];

const FILTER_OPTIONS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'remaining', label: 'Remaining' },
  { key: 'completed', label: 'Done' },
];

export default function App() {
  const {
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
  } = useChecklistStore();

  const driveSave = useGoogleDriveSave({
    items,
    activeSubject,
    expandedUnits,
    onApplySavePayload: applySavePayload,
  });

  const { theme, setTheme, toggleTheme } = useTheme();

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isDriveOpen, setIsDriveOpen] = useState(false);

  const activeUnits = unitsBySubject[activeSubject];
  const activeStats = subjectStats[activeSubject];

  const areAnyExpanded = useMemo(
    () => activeUnits.some((u) => Boolean(expandedUnits[u.code])),
    [activeUnits, expandedUnits]
  );

  // Check if current filter + search matches at least one item
  const hasVisibleMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeUnits.some((unit) =>
      unit.items.some((item) => {
        if (filterStatus === 'remaining' && item.completed) return false;
        if (filterStatus === 'completed' && !item.completed) return false;
        if (q) {
          const hay = `${item.title} ${item.subsection} ${unit.code} ${unit.title}`.toLowerCase();
          return hay.includes(q);
        }
        return true;
      })
    );
  }, [activeUnits, filterStatus, searchQuery]);

  // Group Chemistry units into clean editorial branch blocks while keeping P and M flat
  const unitBlocks = useMemo(() => {
    const blocks: { branch?: string; units: ChecklistUnit[] }[] = [];
    for (const unit of activeUnits) {
      const branchLabel = activeSubject === 'chemistry' ? unit.branch : undefined;
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock && lastBlock.branch === branchLabel) {
        lastBlock.units.push(unit);
      } else {
        blocks.push({ branch: branchLabel, units: [unit] });
      }
    }
    return blocks;
  }, [activeUnits, activeSubject]);

  const handleSelectSubject = (subject: SubjectKey) => {
    setActiveSubject(subject);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-dvh bg-[#F5EFE6] dark:bg-[#131B17] text-[#23211E] dark:text-[#F5F0E6] transition-colors">
      {/* Mobile Top Header (scrolls naturally so sticky height stays strictly <= 15% via bottom bar alone) */}
      <header className="lg:hidden border-b border-[#DFD5C5] dark:border-[#2B3B32] bg-[#FAF6F0]/85 dark:bg-[#1A251F]/90 px-4 py-3 transition-colors">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-2">
          <span className="font-display text-[15px] sm:text-lg font-semibold tracking-tight text-[#23211E] dark:text-[#F5F0E6] whitespace-nowrap shrink-0">
            PCM Checklist
          </span>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={
                theme === 'dark'
                  ? 'Switch to Normal light mode'
                  : 'Switch to Deep Forest Moss dark mode'
              }
              title={
                theme === 'dark'
                  ? 'Switch to Normal light mode'
                  : 'Switch to Deep Forest Moss dark mode'
              }
              className="min-w-[44px] min-h-[44px] sm:px-2.5 rounded-xl text-xs font-medium text-[#23211E] dark:text-[#F5F0E6] bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#8FA993]" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 text-[#556B4F]" aria-hidden="true" />
              )}
              <span className="hidden sm:inline">
                {theme === 'dark' ? 'Normal' : 'Forest Moss'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsDriveOpen(true)}
              aria-label="Google Drive save file"
              className={`min-h-[44px] px-2 sm:px-3 rounded-xl text-xs font-medium border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                !driveSave.needsAuth
                  ? 'bg-[#E3EAD9]/80 dark:bg-[#223228] border-[#C3D0B8] dark:border-[#3A4E40] text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#E3EAD9] dark:hover:bg-[#293D31]'
                  : 'bg-[#F5EFE6] dark:bg-[#131B17] border-[#DFD5C5] dark:border-[#2B3B32] text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028]'
              }`}
            >
              <Cloud className="w-3.5 h-3.5 text-[#556B4F] dark:text-[#8FA993]" aria-hidden="true" />
              <span>{!driveSave.needsAuth ? 'Synced' : 'Drive'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              aria-label="Import checklist"
              className="min-h-[44px] px-2 sm:px-3 rounded-xl text-xs font-medium text-[#23211E] dark:text-[#F5F0E6] bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-[#556B4F] dark:text-[#8FA993]" aria-hidden="true" />
              <span>Import</span>
            </button>
            <button
              type="button"
              onClick={() => setIsManageOpen(true)}
              aria-label="Manage checklist"
              className="min-w-[44px] min-h-[44px] rounded-xl text-[#23211E] dark:text-[#F5F0E6] bg-[#F5EFE6] dark:bg-[#131B17] border border-[#DFD5C5] dark:border-[#2B3B32] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] inline-flex items-center justify-center transition-colors shrink-0"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#6B645B] dark:text-[#A8B5AA]" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Responsive Layout */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-24 sm:px-6 lg:px-8 lg:py-8 lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        {/* Desktop Navigation Rail */}
        <aside className="hidden lg:flex lg:flex-col lg:gap-5 lg:sticky lg:top-8 lg:self-start">
          <div className="px-1 space-y-3">
            <div>
              <div className="font-display text-xl font-semibold tracking-tight text-[#23211E] dark:text-[#F5F0E6]">
                PCM Checklist
              </div>
              <p className="mt-1 text-xs text-[#6B645B] dark:text-[#A8B5AA]">
                Physics, Chemistry &amp; Maths Tracker
              </p>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-pressed={theme === 'dark'}
              className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] text-xs font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3]/70 dark:hover:bg-[#223028] flex items-center justify-between gap-2.5 transition-colors"
            >
              <span className="inline-flex items-center gap-2 min-w-0">
                {theme === 'dark' ? (
                  <Moon className="w-4 h-4 text-[#8FA993] shrink-0" aria-hidden="true" />
                ) : (
                  <Sun className="w-4 h-4 text-[#556B4F] shrink-0" aria-hidden="true" />
                )}
                <span className="truncate">
                  {theme === 'dark' ? 'Deep Forest Moss' : 'Normal Mode'}
                </span>
              </span>
              <span className="text-[11px] font-medium text-[#556B4F] dark:text-[#8FA993] shrink-0">
                {theme === 'dark' ? 'Switch to Normal' : 'Dark Mode'}
              </span>
            </button>
          </div>

          {/* 3-Tab Vertical Navigation */}
          <nav
            aria-label="Subject sections"
            className="bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] rounded-2xl p-2 space-y-1 transition-colors"
          >
            {SUBJECT_TABS.map(({ key, label, Icon }) => {
              const stats = subjectStats[key];
              const isActive = activeSubject === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelectSubject(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full min-h-[52px] px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#556B4F] dark:focus-visible:outline-[#8FA993] ${
                    isActive
                      ? 'bg-[#E3EAD9] dark:bg-[#223228] text-[#23211E] dark:text-[#F5F0E6]'
                      : 'text-[#6B645B] dark:text-[#A8B5AA] hover:bg-[#F5EFE6] dark:hover:bg-[#223028]/60 hover:text-[#23211E] dark:hover:text-[#F5F0E6]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-[18px] h-[18px] shrink-0 ${
                        isActive
                          ? 'text-[#556B4F] dark:text-[#8FA993]'
                          : 'text-[#6B645B] dark:text-[#A8B5AA]'
                      }`}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium whitespace-nowrap">
                      {label}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-xs tabular-nums shrink-0 ${
                      isActive
                        ? 'font-semibold text-[#556B4F] dark:text-[#8FA993]'
                        : 'text-[#6B645B] dark:text-[#A8B5AA]'
                    }`}
                  >
                    {stats.percentage}%
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Overall PCM Progress Summary */}
          <div className="bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] rounded-2xl p-4 space-y-3 transition-colors">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-[#6B645B] dark:text-[#A8B5AA]">
                Overall PCM
              </span>
              <span className="font-mono text-sm font-semibold text-[#556B4F] dark:text-[#8FA993] tabular-nums">
                {overallStats.percentage}%
              </span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#EAE1D3] dark:bg-[#223028] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#556B4F] dark:bg-[#8FA993] transition-all duration-200 ease-out"
                style={{ width: `${overallStats.percentage}%` }}
              />
            </div>
            <div className="font-mono text-xs text-[#6B645B] dark:text-[#A8B5AA] tabular-nums">
              {overallStats.completed} / {overallStats.total} topics done
            </div>
          </div>

          {/* Google Account Save File Card */}
          <div className="bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] rounded-2xl p-4 space-y-3 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Cloud className="w-4 h-4 text-[#556B4F] dark:text-[#8FA993] shrink-0" aria-hidden="true" />
                <span className="text-xs font-medium text-[#23211E] dark:text-[#F5F0E6] truncate">
                  Google Drive Save
                </span>
              </div>
              {!driveSave.needsAuth && (
                <span className="text-[11px] font-medium text-[#556B4F] dark:text-[#8FA993] shrink-0">
                  {driveSave.hasUnsavedChanges
                    ? 'Unsaved'
                    : driveSave.driveFile
                    ? 'Linked'
                    : 'Ready'}
                </span>
              )}
            </div>

            {driveSave.needsAuth ? (
              <div className="space-y-2.5">
                <p className="text-xs text-[#6B645B] dark:text-[#A8B5AA] leading-relaxed">
                  {driveSave.user
                    ? `Reconnect ${driveSave.user.email ?? 'your account'} to sync your Drive save file.`
                    : 'Link your Google account to save and restore your checklist in Drive.'}
                </p>
                <GoogleSignInButton
                  onClick={driveSave.signIn}
                  disabled={driveSave.isLoggingIn}
                  label={
                    driveSave.isLoggingIn
                      ? 'Connecting...'
                      : driveSave.user
                      ? 'Reconnect Google'
                      : 'Sign in with Google'
                  }
                />
                {driveSave.errorMessage && (
                  <p className="text-[11px] text-[#7D3C2E] dark:text-[#E59485] leading-snug">
                    {driveSave.errorMessage}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                <p className="text-xs text-[#6B645B] dark:text-[#A8B5AA] truncate">
                  {driveSave.user?.email}
                </p>
                <button
                  type="button"
                  onClick={() => setIsDriveOpen(true)}
                  className="w-full min-h-[44px] px-3 rounded-xl bg-[#E3EAD9] dark:bg-[#223228] border border-[#C3D0B8] dark:border-[#3A4E40] text-xs font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#D7E2C9] dark:hover:bg-[#293D31] inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Cloud className="w-3.5 h-3.5 text-[#556B4F] dark:text-[#8FA993]" aria-hidden="true" />
                  <span>
                    {driveSave.driveFile ? 'Sync Drive Save File' : 'Create Drive Save File'}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Utility Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setIsImportOpen(true)}
              className="min-h-[44px] px-3 rounded-xl bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] text-xs font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3]/70 dark:hover:bg-[#223028] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5 text-[#556B4F] dark:text-[#8FA993]" aria-hidden="true" />
              <span>Import</span>
            </button>
            <button
              type="button"
              onClick={() => setIsManageOpen(true)}
              className="min-h-[44px] px-3 rounded-xl bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] text-xs font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3]/70 dark:hover:bg-[#223028] inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#6B645B] dark:text-[#A8B5AA]" aria-hidden="true" />
              <span>Manage</span>
            </button>
          </div>
        </aside>

        {/* Main Checklist Workspace */}
        <main className="space-y-4 sm:space-y-5 min-w-0">
          <SubjectProgressCard
            subject={activeSubject}
            stats={activeStats}
            unitCount={activeUnits.length}
            overallStats={overallStats}
          />

          {/* Search, Filter & Expand Controls */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
              {/* Search Box */}
              <div className="relative flex-1 min-w-0">
                <Search
                  className="w-4 h-4 text-[#6B645B] dark:text-[#A8B5AA] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search ${activeSubject} units or topics...`}
                  aria-label={`Search ${activeSubject} units or topics`}
                  className="w-full h-11 pl-10 pr-10 rounded-xl bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] text-sm text-[#23211E] dark:text-[#F5F0E6] placeholder:text-[#8A8277] dark:placeholder:text-[#78877B] focus:outline-none focus:border-[#556B4F] dark:focus:border-[#8FA993]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    aria-label="Clear search"
                    className="min-w-[40px] min-h-[40px] absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6]"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </div>

              {/* Filter Segmented Control + Expand/Collapse */}
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <div
                  role="group"
                  aria-label="Filter topics by status"
                  className="inline-flex items-center p-1 rounded-xl bg-[#EAE1D3] dark:bg-[#223028] border border-[#DFD5C5] dark:border-[#2B3B32]"
                >
                  {FILTER_OPTIONS.map((opt) => {
                    const selected = filterStatus === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setFilterStatus(opt.key)}
                        aria-pressed={selected}
                        className={`min-h-[36px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                          selected
                            ? 'bg-[#FAF6F0] dark:bg-[#131B17] text-[#23211E] dark:text-[#F5F0E6] shadow-xs'
                            : 'text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setAllUnitsExpanded(activeSubject, !areAnyExpanded)
                  }
                  className="min-h-[44px] px-3 rounded-xl bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] text-xs font-medium text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6] hover:bg-[#EAE1D3]/60 dark:hover:bg-[#223028] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  {areAnyExpanded ? (
                    <>
                      <ChevronsDownUp className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Collapse all</span>
                    </>
                  ) : (
                    <>
                      <ChevronsUpDown className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Expand all</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Unit List */}
          {activeUnits.length === 0 ? (
            <div className="bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] rounded-2xl p-8 text-center space-y-3">
              <p className="text-sm text-[#6B645B] dark:text-[#A8B5AA]">
                No topics are currently loaded for {activeSubject}.
              </p>
              <button
                type="button"
                onClick={() => setIsImportOpen(true)}
                className="min-h-[44px] px-5 rounded-xl bg-[#556B4F] dark:bg-[#8FA993] text-sm font-medium text-[#FAF6F0] dark:text-[#131B17] hover:bg-[#465941] dark:hover:bg-[#A2BA9F] transition-colors"
              >
                Import Checklist
              </button>
            </div>
          ) : !hasVisibleMatches ? (
            <div className="bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] rounded-2xl p-8 text-center space-y-3">
              <p className="text-sm text-[#6B645B] dark:text-[#A8B5AA]">
                No topics match your current filter or search query.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilterStatus('all');
                  setSearchQuery('');
                }}
                className="min-h-[44px] px-4 rounded-xl border border-[#DFD5C5] dark:border-[#2B3B32] bg-[#F5EFE6] dark:bg-[#131B17] text-sm font-medium text-[#23211E] dark:text-[#F5F0E6] hover:bg-[#EAE1D3] dark:hover:bg-[#223028] transition-colors"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {unitBlocks.map((block, idx) => (
                <section key={block.branch ?? `block-${idx}`} className="space-y-3">
                  {block.branch && (
                    <h2 className="px-1 text-xs font-medium text-[#6B645B] dark:text-[#A8B5AA]">
                      {block.branch}
                    </h2>
                  )}
                  <div className="space-y-3">
                    {block.units.map((unit) => (
                      <UnitAccordion
                        key={unit.code}
                        unit={unit}
                        isExpanded={
                          Boolean(expandedUnits[unit.code]) ||
                          Boolean(searchQuery.trim())
                        }
                        filterStatus={filterStatus}
                        searchQuery={searchQuery}
                        onToggleExpand={toggleUnitExpanded}
                        onToggleItem={toggleItem}
                        onToggleUnitAll={toggleUnitCompletion}
                        onAddTopic={addCustomTopic}
                        onRemoveCustomTopic={removeCustomTopic}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Fixed 3-Tab Bottom Navigation Bar */}
      <nav
        aria-label="Primary subject navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF6F0]/95 dark:bg-[#1A251F]/95 backdrop-blur-md border-t border-[#DFD5C5] dark:border-[#2B3B32] pb-safe transition-colors"
      >
        <div className="grid grid-cols-3 h-16 max-w-lg mx-auto">
          {SUBJECT_TABS.map(({ key, label, Icon }) => {
            const isActive = activeSubject === key;
            const stats = subjectStats[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectSubject(key)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#556B4F] dark:focus-visible:outline-[#8FA993] ${
                  isActive
                    ? 'text-[#556B4F] dark:text-[#8FA993]'
                    : 'text-[#6B645B] dark:text-[#A8B5AA] hover:text-[#23211E] dark:hover:text-[#F5F0E6]'
                }`}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full bg-[#556B4F] dark:bg-[#8FA993]"
                  />
                )}
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'stroke-[2.25]' : 'stroke-[1.75]'
                  }`}
                  aria-hidden="true"
                />
                <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                  {label}
                </span>
                <span className="sr-only">({stats.percentage}% completed)</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Modals / Bottom Sheets */}
      <ImportSheet
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={importItems}
      />

      <ManageSheet
        isOpen={isManageOpen}
        activeSubject={activeSubject}
        theme={theme}
        onSetTheme={setTheme}
        linkedEmail={driveSave.user?.email ?? null}
        isDriveConnected={!driveSave.needsAuth}
        onOpenDriveSave={() => setIsDriveOpen(true)}
        onClose={() => setIsManageOpen(false)}
        onExportMarkdown={exportMarkdown}
        onResetSubject={resetSubjectProgress}
        onResetAll={resetAllProgress}
        onRestoreDefault={restoreDefaultSyllabus}
      />

      <DriveSaveSheet
        isOpen={isDriveOpen}
        onClose={() => setIsDriveOpen(false)}
        user={driveSave.user}
        needsAuth={driveSave.needsAuth}
        isLoggingIn={driveSave.isLoggingIn}
        isSyncing={driveSave.isSyncing}
        driveFile={driveSave.driveFile}
        drivePreview={driveSave.drivePreview}
        hasUnsavedChanges={driveSave.hasUnsavedChanges}
        localStats={overallStats}
        errorMessage={driveSave.errorMessage}
        statusMessage={driveSave.statusMessage}
        onSignIn={driveSave.signIn}
        onSignOut={driveSave.signOut}
        onRefresh={driveSave.refreshDriveFile}
        onCreateSave={driveSave.createNewSave}
        onOverwriteSave={driveSave.overwriteSave}
        onLoadSave={driveSave.loadSave}
        onDeleteSave={driveSave.deleteSave}
        onClearFeedback={driveSave.clearFeedback}
      />
    </div>
  );
}
