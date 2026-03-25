---
phase: 03-explorer-advanced-visualisations
plan: 01
subsystem: data
tags: [typescript, vitest, pca, ml-pca, data-transforms, tdd]

# Dependency graph
requires:
  - phase: 02-scroll-narrative
    provides: ExperimentResult type, fixture-results.json, heatmapData pattern

provides:
  - SurfaceGrid/ParallelRecord/ExplorerFilterState/PCAPoint/PCAProjection types in types.ts
  - toSurfaceGrid transform for 3D surface chart data
  - toParallelData transform for parallel coordinates chart
  - applyExplorerFilters for AND-combined multi-dimensional filtering
  - toCSV/toJSON/triggerDownload download utilities
  - generate-pca.mjs PCA build script
  - pca-projection.json (180 points, 3 components)

affects: [03-02, 03-03, 03-04]

# Tech tracking
tech-stack:
  added: [ml-pca (dev, platform)]
  patterns:
    - TDD RED/GREEN cycle matching Phase 2 pattern
    - Build-time PCA computation writing to static/data/
    - Cell-averaging with global-mean fallback for missing cells in surface grids
    - createRequire to resolve platform node_modules from root-level script

key-files:
  created:
    - platform/src/lib/data/transforms/surfaceData.ts
    - platform/src/lib/data/transforms/parallelCoordsData.ts
    - platform/src/lib/data/transforms/explorerFilters.ts
    - platform/src/lib/data/transforms/downloadUtils.ts
    - platform/src/lib/data/transforms/__tests__/surfaceData.test.ts
    - platform/src/lib/data/transforms/__tests__/parallelCoordsData.test.ts
    - platform/src/lib/data/transforms/__tests__/explorerFilters.test.ts
    - platform/src/lib/data/transforms/__tests__/downloadUtils.test.ts
    - scripts/generate-pca.mjs
    - platform/static/data/pca-projection.json
  modified:
    - platform/src/lib/data/types.ts

key-decisions:
  - "ml-pca installed as dev dependency in platform/ (not root); generate-pca.mjs uses createRequire to resolve it from root-level script"
  - "PCA feature matrix: precision numeric, log2(batch_size), backend/attn ordinal encodings, load_in_8bit binary - explains 66.7% variance with 3 components"
  - "Surface grid uses cell averaging for multi-record cells; global mean fill for sparse/missing cells"
  - "CSV column names use underscore_snake_case matching the simplified export schema"

patterns-established:
  - "PCA build scripts live in scripts/ at repo root, resolve platform dependencies via createRequire"
  - "Explorer filter state uses null to mean 'all' (no filter on that dimension)"
  - "Download utilities emit simplified schema (7 cols) not the full ExperimentResult shape"

requirements-completed: [VIZ-05, VIZ-07, VIZ-08, VIZ-09, DATA-06, DATA-07]

# Metrics
duration: 4min
completed: 2026-03-25
---

# Phase 3 Plan 01: Explorer Data Layer Summary

**Four typed transform modules (surface, parallel-coords, filters, download) plus ml-pca build script producing 180-point pca-projection.json with 66.7% cumulative explained variance**

## Performance

- **Duration:** 4 min
- **Started:** 2026-03-25T23:29:00Z
- **Completed:** 2026-03-25T23:33:02Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 11

## Accomplishments

- 27 new tests written in RED, all passing GREEN
- Four transform modules typed end-to-end with ExperimentResult inputs
- PCA script using ml-pca generates deterministic pca-projection.json at build time
- All 45 total tests pass; 0 TypeScript errors

## Task Commits

1. **Task 1: Types + failing tests (RED)** - `68e68e7` (test)
2. **Task 2: Implement transforms + PCA script (GREEN)** - `e192524` (feat)

_TDD tasks have two commits: RED test commit then GREEN implementation commit._

## Files Created/Modified

- `platform/src/lib/data/types.ts` - Added SurfaceGrid, ParallelRecord, ExplorerFilterState, PCAPoint, PCAProjection interfaces
- `platform/src/lib/data/transforms/surfaceData.ts` - toSurfaceGrid: 2D energy grid for any pair of config axes
- `platform/src/lib/data/transforms/parallelCoordsData.ts` - toParallelData: flat ParallelRecord array from ExperimentResult[]
- `platform/src/lib/data/transforms/explorerFilters.ts` - applyExplorerFilters: AND-combined multi-dimensional filter
- `platform/src/lib/data/transforms/downloadUtils.ts` - toCSV, toJSON, triggerDownload utilities
- `platform/src/lib/data/transforms/__tests__/surfaceData.test.ts` - 6 test cases for grid shape, averaging, missing-cell fill
- `platform/src/lib/data/transforms/__tests__/parallelCoordsData.test.ts` - 4 test cases for record count and field types
- `platform/src/lib/data/transforms/__tests__/explorerFilters.test.ts` - 9 test cases for all filter dimensions and AND logic
- `platform/src/lib/data/transforms/__tests__/downloadUtils.test.ts` - 8 test cases for CSV headers, row counts, JSON round-trip
- `scripts/generate-pca.mjs` - PCA build script (run via node from repo root)
- `platform/static/data/pca-projection.json` - 180-point PCA output (generated artifact)

## Decisions Made

- ml-pca installed as dev dependency in `platform/` not at repo root. The script resolves it via `createRequire` from the platform package.json path, avoiding the need to maintain a root package.json.
- PCA feature matrix uses log2(batch_size) to normalise the wide batch size range; precision/backend/attn are ordinal-encoded. The 3-component output explains 26.7% + 20.0% + 20.0% = 66.7% of variance.
- Surface grid fills missing cells with the global mean of non-missing cells (neutral interpolation), keeping the Plotly surface trace visually smooth without distorting the displayed energy scale.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript double-cast for generic axis lookup in surfaceData.ts**
- **Found during:** Task 2 (type check pass)
- **Issue:** `result as Record<string, unknown>` caused svelte-check error (insufficient type overlap)
- **Fix:** Changed to `result as unknown as Record<string, unknown>` (standard TS double-cast pattern)
- **Files modified:** platform/src/lib/data/transforms/surfaceData.ts
- **Verification:** npm run check passes with 0 errors
- **Committed in:** e192524 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 type error)
**Impact on plan:** Single-line fix for TypeScript strictness. No scope changes.

## Issues Encountered

- npm cache was root-owned causing `EPERM` on `npm install`. Resolved by passing `--cache /private/tmp/claude-502/npm-cache` to redirect the cache write.

## User Setup Required

None - no external service configuration required. PCA script is run as part of development workflow (`node scripts/generate-pca.mjs`).

## Next Phase Readiness

- All transform functions typed and tested; plans 02-04 can import directly
- pca-projection.json is committed to static/data/ - available immediately for the scatter3d component in plan 04
- No blockers for 03-02 (surface/parallel-coords chart components)

## Self-Check: PASSED

- All 7 created/modified files exist on disk
- Both task commits (68e68e7, e192524) verified in git log
- All 45 tests pass; 0 TypeScript errors

---
*Phase: 03-explorer-advanced-visualisations*
*Completed: 2026-03-25*
