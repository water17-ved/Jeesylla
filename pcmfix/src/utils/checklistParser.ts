import { ChecklistItem, ParsedChecklistResult, SubjectKey } from '../types/checklist';

const NON_PCM_SECTION_RE =
  /^#+\s*(?:PAPER\s*2[AB]?|APTITUDE|DRAWING|PLANNING|GENERAL\s*AWARENESS|SOCIAL\s*SCIENCES|THINKING\s*SKILLS)\b/i;

const NON_PCM_UNIT_RE = /^##\s*(A\d+|D\d+|PL\d+|B\d+|G\d+)\s*:/i;

const PCM_UNIT_RE = /^##\s*([PMC]\d+)\s*:\s*(.+)$/i;

const SUBJECT_HEADER_RE = /^#\s+.*?\b(MATHEMATICS|MATHS|PHYSICS|CHEMISTRY)\b/i;

const CHEM_PART_RE = /^#\s*PART\s*[A-Z]\s*:\s*(.+)$/i;

const SUBSECTION_RE = /^\*\*(.+?)\*\*$/;

const CHECKBOX_RE = /^\s*[-*]\s*\[([ xX])\]\s+(.+)$/;

function inferSubjectFromCode(code: string): SubjectKey | null {
  const prefix = code.charAt(0).toUpperCase();
  if (prefix === 'P') return 'physics';
  if (prefix === 'C') return 'chemistry';
  if (prefix === 'M') return 'maths';
  return null;
}

function normalizeBranch(raw: string, unitCode: string): string | undefined {
  if (unitCode.toUpperCase() === 'C20') {
    return 'Practical Chemistry';
  }
  const clean = raw.trim();
  if (!clean) return undefined;
  if (/physical/i.test(clean)) return 'Physical Chemistry';
  if (/inorganic/i.test(clean)) return 'Inorganic Chemistry';
  if (/organic/i.test(clean)) return 'Organic Chemistry';
  if (/practical/i.test(clean)) return 'Practical Chemistry';
  return clean
    .toLowerCase()
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

function slugifyId(parts: string[]): string {
  return parts
    .join('__')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function parseChecklistMarkdown(
  markdown: string,
  options?: { markCustom?: boolean }
): ParsedChecklistResult {
  const lines = markdown.split(/\r?\n/);
  const items: ChecklistItem[] = [];
  const keptCounts: Record<SubjectKey, number> = {
    physics: 0,
    chemistry: 0,
    maths: 0,
  };
  const strippedSectionsSet = new Set<string>();
  let strippedItemsCount = 0;

  let currentSubject: SubjectKey | null = null;
  let currentBranch: string | undefined = undefined;
  let currentUnitCode = '';
  let currentUnitTitle = '';
  let currentSubsection = 'Topics';
  let inExcludedBlock = false;
  let inTableOrIntro = false;

  const seenIds = new Map<string, number>();

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    // Skip markdown tables and horizontal rules
    if (line.startsWith('|') || /^---+$/.test(line)) {
      inTableOrIntro = true;
      continue;
    }

    // Top-level tracker header
    if (/^##\s*Master Progress Tracker/i.test(line)) {
      inTableOrIntro = true;
      continue;
    }

    // Skip italic helper notes
    if (line.startsWith('*(') && line.endsWith(')*')) {
      continue;
    }

    // Check Chemistry Part headers (# PART A: PHYSICAL CHEMISTRY)
    const chemPartMatch = line.match(CHEM_PART_RE);
    if (chemPartMatch) {
      currentSubject = 'chemistry';
      currentBranch = normalizeBranch(chemPartMatch[1], '');
      inExcludedBlock = false;
      inTableOrIntro = false;
      continue;
    }

    // Check Non-PCM top-level sections (# PAPER 2A ...)
    if (NON_PCM_SECTION_RE.test(line)) {
      inExcludedBlock = true;
      inTableOrIntro = false;
      currentSubject = null;
      currentUnitCode = '';
      currentUnitTitle = '';
      strippedSectionsSet.add(line.replace(/^#+\s*/, '').trim());
      continue;
    }

    // Check Non-PCM unit codes (## A1: ..., ## D1: ..., ## PL1: ...)
    const nonPcmUnitMatch = line.match(NON_PCM_UNIT_RE);
    if (nonPcmUnitMatch) {
      inExcludedBlock = true;
      inTableOrIntro = false;
      currentUnitCode = nonPcmUnitMatch[1].toUpperCase();
      strippedSectionsSet.add(line.replace(/^#+\s*/, '').trim());
      continue;
    }

    // Check PCM top-level subject headers (# PAPER 1 – PHYSICS, etc.)
    const subjectHeaderMatch = line.match(SUBJECT_HEADER_RE);
    if (subjectHeaderMatch) {
      const token = subjectHeaderMatch[1].toUpperCase();
      currentSubject =
        token === 'PHYSICS'
          ? 'physics'
          : token === 'CHEMISTRY'
            ? 'chemistry'
            : 'maths';
      if (currentSubject !== 'chemistry') {
        currentBranch = undefined;
      }
      inExcludedBlock = false;
      inTableOrIntro = false;
      currentUnitCode = '';
      currentUnitTitle = '';
      currentSubsection = 'Topics';
      continue;
    }

    // Check PCM Unit headers (## P1: ..., ## C1: ..., ## M1: ...)
    const pcmUnitMatch = line.match(PCM_UNIT_RE);
    if (pcmUnitMatch) {
      const code = pcmUnitMatch[1].toUpperCase();
      const title = pcmUnitMatch[2].trim();
      const inferred = inferSubjectFromCode(code);
      if (inferred) {
        currentSubject = inferred;
        currentUnitCode = code;
        currentUnitTitle = title;
        currentSubsection = 'Core Topics';
        inExcludedBlock = false;
        inTableOrIntro = false;
        if (currentSubject === 'chemistry' && code === 'C20') {
          currentBranch = 'Practical Chemistry';
        }
        continue;
      }
    }

    // Generic ## header inside an active subject (for custom pasted checklists)
    if (line.startsWith('## ') && !inTableOrIntro) {
      const headingText = line.replace(/^##\s*/, '').trim();
      const lower = headingText.toLowerCase();
      if (lower === 'physics') {
        currentSubject = 'physics';
        currentUnitCode = 'P1';
        currentUnitTitle = 'General Physics';
        currentSubsection = 'Topics';
        inExcludedBlock = false;
        continue;
      }
      if (lower === 'chemistry') {
        currentSubject = 'chemistry';
        currentUnitCode = 'C1';
        currentUnitTitle = 'General Chemistry';
        currentSubsection = 'Topics';
        inExcludedBlock = false;
        continue;
      }
      if (lower === 'maths' || lower === 'mathematics') {
        currentSubject = 'maths';
        currentUnitCode = 'M1';
        currentUnitTitle = 'General Mathematics';
        currentSubsection = 'Topics';
        inExcludedBlock = false;
        continue;
      }
      if (currentSubject && !inExcludedBlock) {
        const prefix =
          currentSubject === 'physics' ? 'P' : currentSubject === 'chemistry' ? 'C' : 'M';
        currentUnitCode = `${prefix}-CUSTOM`;
        currentUnitTitle = headingText;
        currentSubsection = 'Topics';
        continue;
      }
    }

    // Check Subsection headings (**Sets**, **Newton's Laws**, etc.)
    const subsectionMatch = line.match(SUBSECTION_RE);
    if (subsectionMatch && !line.includes('|')) {
      if (!inExcludedBlock && currentSubject && currentUnitCode) {
        currentSubsection = subsectionMatch[1].trim();
      }
      continue;
    }

    // Check Checkbox items (- [ ] ... or - [x] ...)
    const checkboxMatch = rawLine.match(CHECKBOX_RE);
    if (checkboxMatch) {
      if (inExcludedBlock || !currentSubject || !currentUnitCode) {
        strippedItemsCount += 1;
        continue;
      }

      const isChecked = checkboxMatch[1].toLowerCase() === 'x';
      const title = checkboxMatch[2].trim();
      const isUnitWrapUp =
        title === 'Practice Questions / Past Papers' || title === 'Unit Revision';
      const subsection = isUnitWrapUp ? 'Practice & Revision' : currentSubsection;

      const baseId = slugifyId([currentSubject, currentUnitCode, subsection, title]);
      const count = (seenIds.get(baseId) ?? 0) + 1;
      seenIds.set(baseId, count);
      const id = count === 1 ? baseId : `${baseId}-${count}`;

      items.push({
        id,
        subject: currentSubject,
        unitCode: currentUnitCode,
        unitTitle: currentUnitTitle,
        branch: currentSubject === 'chemistry' ? currentBranch : undefined,
        subsection,
        title,
        completed: isChecked,
        isCustom: options?.markCustom,
      });

      keptCounts[currentSubject] += 1;
    }
  }

  return {
    items,
    keptCounts,
    strippedSections: Array.from(strippedSectionsSet),
    strippedItemsCount,
  };
}
