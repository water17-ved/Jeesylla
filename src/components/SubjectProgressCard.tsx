import { SubjectKey, SubjectStats } from '../types/checklist';

interface SubjectProgressCardProps {
  subject: SubjectKey;
  stats: SubjectStats;
  unitCount: number;
  overallStats: SubjectStats;
}

const SUBJECT_LABELS: Record<SubjectKey, string> = {
  physics: 'Physics',
  chemistry: 'Chemistry',
  maths: 'Maths',
};

const SUBJECT_SUBTITLES: Record<SubjectKey, string> = {
  physics: 'Mechanics, Electrodynamics, Optics & Modern Physics',
  chemistry: 'Physical, Inorganic, Organic & Practical Chemistry',
  maths: 'Algebra, Calculus, Coordinate Geometry & Vectors',
};

export function SubjectProgressCard({
  subject,
  stats,
  unitCount,
  overallStats,
}: SubjectProgressCardProps) {
  const remaining = Math.max(0, stats.total - stats.completed);

  return (
    <section
      aria-label={`${SUBJECT_LABELS[subject]} progress overview`}
      className="bg-[#FAF6F0] dark:bg-[#1A251F] border border-[#DFD5C5] dark:border-[#2B3B32] rounded-2xl p-5 sm:p-6 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-[#23211E] dark:text-[#F5F0E6]">
            {SUBJECT_LABELS[subject]}
          </h1>
          <p className="mt-1 text-sm text-[#6B645B] dark:text-[#A8B5AA] leading-relaxed">
            {SUBJECT_SUBTITLES[subject]}
          </p>
        </div>

        <div className="text-right shrink-0">
          <div className="font-mono text-2xl sm:text-[28px] font-semibold text-[#556B4F] dark:text-[#8FA993] tabular-nums leading-none">
            {stats.percentage}%
          </div>
          <div className="mt-1.5 font-mono text-xs text-[#6B645B] dark:text-[#A8B5AA] tabular-nums">
            {stats.completed} / {stats.total}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="mt-4 h-2.5 w-full rounded-full bg-[#EAE1D3] dark:bg-[#223028] overflow-hidden"
        role="progressbar"
        aria-valuenow={stats.percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${SUBJECT_LABELS[subject]} completion progress`}
      >
        <div
          className="h-full rounded-full bg-[#556B4F] dark:bg-[#8FA993] transition-all duration-200 ease-out"
          style={{ width: `${stats.percentage}%` }}
        />
      </div>

      {/* Clean Unboxed Metadata */}
      <div className="mt-3.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#6B645B] dark:text-[#A8B5AA] tabular-nums">
        <span>{unitCount} units</span>
        <span aria-hidden="true">·</span>
        <span>{remaining} remaining</span>
        <span aria-hidden="true">·</span>
        <span>
          Overall PCM {overallStats.completed} / {overallStats.total} ({overallStats.percentage}%)
        </span>
      </div>
    </section>
  );
}
