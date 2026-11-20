# PCM Study Checklist — Mobile Application Development Plan

A minimalist, touch-first study checklist application organized strictly around **Physics**, **Chemistry**, and **Maths**, styled in a cohesive **Sandstone Beige and Sage Olive** aesthetic with one-tap completion tracking, progress bars, and automatic filtering of non-PCM codes.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Ready for Your Checklist**: You mentioned you will share your checklist once ready. Whenever you paste or send it (either with your approval or in a follow-up message), we will automatically strip out all non-PCM parts (such as `A1`, `D1`, or unrelated modules) and populate the clean Physics, Chemistry, and Maths tabs directly. We will also build an in-app checklist importer so you can paste updated lists anytime.

Confirmed decisions from your Phase 1 preferences:
- **Primary Navigation Structure**: Strictly 3 primary tabs—**Physics**, **Chemistry**, and **Maths**—with consistent visual styling across all three sections.
- **Checklist Filtering Rule**: Automatic exclusion of all non-PCM sections, codes, and items (e.g., `A1`, `D1`, or non-subject categories) so only Physics, Chemistry, and Maths topics remain.
- **Progress Tracking**: Simple one-tap completion checkboxes paired with a clear subject progress bar and overall completion readout.
- **Data Persistence**: Instant, offline-ready local device storage (`localStorage`) with zero login friction.
- **Visual Aesthetic**: **Sandstone Beige and Sage Olive**—warm neutral sandstone surfaces paired with calm sage olive accents and crisp ink typography.

---

## 1. Overview & Core Concept

- **What It Does**: Transforms a raw, potentially cluttered study syllabus or checklist into a serene, distraction-free mobile study companion. Users switch effortlessly between Physics, Chemistry, and Maths, check off completed topics with a single tap, track chapter and overall progress via clean linear progress bars, and optionally add, search, filter, or import filtered PCM items.
- **Target Audience / Persona**: Students preparing for Physics, Chemistry, and Mathematics exams who want a calm, focused daily tracker on their phone (and desktop) without visual clutter, login walls, or irrelevant syllabus codes.
- **Key Value**: Eliminates noise—both visually (minimalist sandstone palette) and structurally (removing non-PCM items like `A1`, `D1`, etc.)—while making daily progress immediately rewarding and accessible offline.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Immediate Entry (Zero-State to Active Study)**: Opens directly onto the **Physics** tab (or the last active subject tab) with no onboarding wall. If no checklist has been loaded yet, a quiet empty state invites the user to paste/import their raw checklist or add topics manually.
2. **3-Tab Subject Switching**: On mobile (`375px–430px`), a compact bottom navigation bar anchors **Physics**, **Chemistry**, and **Maths** in the natural thumb-reach zone. On wider tablet/desktop viewports (`≥1024px`), the layout expands cleanly into a multi-column responsive workspace with a compact top navigation switch so the app never floats as a narrow strip in empty space.
3. **One-Tap Completion & Progress Feedback**: Tapping anywhere on a topic row (minimum `56px` row height, `44×44px` checkbox hitbox) toggles completion smoothly (`≤200ms` settle curve). The subject progress bar and tabular percentage (`42% · 14/33 completed`) update immediately.
4. **Checklist Sanitization & Import Sheet**: Opening the **Import Checklist** bottom sheet lets the user paste any raw checklist text. A live preview shows exactly which items were kept under Physics, Chemistry, and Maths and which non-PCM entries (such as `A1`, `D1`, etc.) were stripped out before confirming.
5. **Quick Topic Management & Filtering**: Within any active tab, users can filter by `All` / `Remaining` / `Completed`, search by topic title, add a custom topic inline, or reset/clear completed items with a gentle confirmation drawer.

### Visual Identity & Theme
- **Aesthetic Direction**: Calm editorial stationery—minimalist, tactile, and paper-like, engineered for long study sessions without eye strain.
- **Color Palette & Mood (60-30-10 Distribution, Consistent Across All 3 Tabs)**:
  - *60% Dominant Neutral Canvas (`--background`)*: Warm Sandstone Beige (`#F5EFE6`) as the primary page surface.
  - *30% Structural Surfaces (`--surface`, `--border`)*: Soft Cream Linen (`#FAF6F0`) for topic cards/lists, Muted Sandstone (`#EAE1D3`) for recessed tracks and segmented controls, and warm hairline dividers (`#DFD5C5`).
  - *10% Accent Budget (`--primary`, `--accent`)*: Sage Olive (`#556B4F` for primary actions, active tabs, and completed checkboxes; `#6D8465` hover; `#E4EAE0` soft sage wash for active progress tracks) paired with Deep Espresso Charcoal (`#23211E`) for primary text and Warm Taupe (`#6E675E`) for secondary metadata.
  - *Cross-Tab Consistency*: Physics, Chemistry, and Maths share the exact same Sandstone Beige & Sage Olive theme tokens—differentiating only through clean typography and subject iconography rather than jarring color shifts.
- **Typography & Hierarchy**:
  - *Display / Headings*: `Plus Jakarta Sans` (SemiBold 600, `text-wrap: balance`, crisp title case without all-caps shouting).
  - *Body / Topic Rows*: `DM Sans` (Regular 400 & Medium 500, comfortable `15px–16px` sizing for effortless scanning).
  - *Numeric Progress & Counts*: `JetBrains Mono` or `tabular-nums` styling so counters (`12 / 28`, `43%`) align cleanly without layout jitter.
- **Component Styling & Ergonomics**:
  - Single-elevation flat cards (`rounded-2xl` with subtle `1px` hairline borders, zero nested cards-within-cards, zero pill badge clutter—metadata uses quiet unboxed text separated by `·`).
  - **15% Mobile Sticky Cap**: Top compact header (`52px`) + bottom 3-tab navigation bar (`64px`) remain strictly under 15% of mobile viewport height, preserving ≥85% scrollable reading space.
  - **Minimum `44×44px` Touch Targets**: Every checkbox, tab button, filter toggle, and row tap zone satisfies mobile touch ergonomics.

### Interactive Feedback & Motion
- **Micro-Interactions (`≤200ms`)**: Crisp spring-free cubic-bezier settling on checkbox checkmarks, smooth GPU-composited (`transform`/`opacity`) tab transitions, and animated progress bar fills.
- **Accessible States**: High-contrast WCAG AA text, visible keyboard focus rings, explicit text labels alongside Sage Olive completion indicators (never color-only signaling), and full `prefers-reduced-motion` support.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Strict 3-Tab PCM Architecture & Automatic Non-PCM Filtering**
  - *Chosen Approach*: Lock primary navigation exclusively to Physics, Chemistry, and Maths, and run a deterministic parser/sanitizer on any imported checklist that drops non-PCM headers and item codes (`A1`, `D1`, etc.) before storing items.
  - *Why*: Directly fulfills the requirement to keep the interface minimalist, focused strictly on PCM, and completely free of stray administrative or non-subject codes.
  - *Alternatives Considered*: Allowing dynamic arbitrary tabs for `A1`/`D1` and hiding them via toggle—rejected because it introduces unwanted clutter and violates the strict 3-tab structure.

- **Decision 2: Local Device Storage (`localStorage`) Over Cloud Accounts**
  - *Chosen Approach*: Persist all checklist items, completion states, and active tab preference locally in the browser with safe JSON serialization and instant hydration, plus optional JSON/text export-import backup.
  - *Why*: Guarantees zero-latency loading, full offline reliability, and immediate usability without sign-in friction.
  - *Alternatives Considered*: Backend database or Firebase auth—unnecessary overhead for a personal single-device study checklist.

- **Decision 3: Unified Sage Olive Theme Across All Subjects**
  - *Chosen Approach*: Keep Sandstone Beige surfaces and Sage Olive accents identical across Physics, Chemistry, and Maths rather than assigning three separate subject colors.
  - *Why*: Preserves a cohesive, serene minimalist aesthetic and avoids visual fatigue when switching tabs rapidly.
  - *Alternatives Considered*: Distinct neon/pastel per-subject color themes—rejected because it breaks theme consistency.

---

## 4. Technical Architecture & Data Strategy

### System & Component Architecture
```
┌────────────────────────────────────────────────────────────────────┐
│                        Local Device Storage                        │
│     (Persisted PCM Checklist Store · Completion State · Active Tab)│
└─────────────────────────────────┬──────────────────────────────────┘
                                  │ Hydrate / Auto-save on every tap
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                       Application Shell                            │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Compact Top Bar (App Title · Overall PCM Summary · Import)   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Active Subject Workspace (Physics | Chemistry | Maths)       │  │
│  │  ├─ Subject Progress Header (Title · Linear Bar · Count %)   │  │
│  │  ├─ Filter & Search Strip (All / Remaining / Done + Add)     │  │
│  │  └─ Topic Checklist List (Section Groups · 1-Tap Rows)       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Bottom 3-Tab Navigation Bar (Mobile) / Top Switch (Desktop)  │  │
│  │       [ Physics ]        [ Chemistry ]        [ Maths ]      │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬──────────────────────────────────┘
                                  │ User triggers Import / Manage
                                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                 Checklist Sanitizer & Import Sheet                 │
│   Raw Text Input ─▶ Strip Non-PCM (A1, D1, etc.) ─▶ Preview & Save │
└────────────────────────────────────────────────────────────────────┘
```

### Data Model & State
- **Subject Key**: Strictly typed union `'physics' | 'chemistry' | 'maths'`.
- **Checklist Item**: `{ id: string, subject: SubjectKey, section?: string, title: string, completed: boolean, createdAt: number }`.
- **Checklist Sanitizer Rules**: Normalizes incoming lines, detects Physics / Chemistry / Maths section headers, explicitly discards any section or standalone code outside PCM (including patterns like `A1`, `D1`, `B2`, etc. or non-PCM headings), and outputs clean, deduplicated `ChecklistItem` records.
- **Derived Progress Metrics**: Computed reactively per subject (`completedCount`, `totalCount`, `percentage`) and across all three PCM tabs combined.

### Interactive Component & State Mapping
- **3-Tab Navigation Bar**: Clicking **Physics**, **Chemistry**, or **Maths** updates `activeSubject` and persists it to local storage; active tab highlights cleanly in Sage Olive with accessible `aria-selected` state.
- **Topic Row & Checkbox**: Clicking any row toggles `item.completed` by ID, updates the subject and overall progress bars immediately, and persists to `localStorage`.
- **Filter Segmented Control & Search Input**: Filters the visible list for the active subject (`all` | `remaining` | `completed` + case-insensitive title match) with a clean empty-filter recovery button.
- **Inline Add Topic Form**: Validates non-empty input, creates a new topic directly under the active subject tab, and clears the input on submit.
- **Import / Paste Checklist Drawer**: Accepts pasted checklist text, runs the PCM sanitizer live to display kept vs. removed items (explicitly excluding `A1`, `D1`, etc.), and merges or replaces items on confirmation.
- **Reset / Clear Action**: Provides a safe bottom-sheet confirmation to uncheck completed topics or remove custom items without accidental data loss.
