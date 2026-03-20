---
phase: 02-scroll-narrative
plan: 01
subsystem: data
tags: [vitest, jsdom, typescript, data-transforms, heatmap, timeseries, energy-equivalence]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: SvelteKit project scaffold with static adapter and fixture data at platform/static/data/fixture-results.json
provides:
  - Vitest test infrastructure configured with jsdom environment
  - TypeScript interfaces for all chart data shapes (ExperimentResult, HeatmapCell, PowerPoint, EffectiveConfig)
  - toHeatmapData transform: filters by backend/attn, computes ratioVsBest, energy-descending sort
  - synthesisePowerCurve: realistic 10/80/10 ramp power curve calibrated to totalEnergyJ
  - smartphoneCharges / formatEquivalence: deployment-scale energy equivalence calculations
  - 18 unit tests covering all transforms; 8x worst/best ratio confirmed against fixture data
affects: [02-heatmap-component, 02-timeseries-component, 02-equivalence-component, all downstream chart plans]

# Tech tracking
tech-stack:
  added: [vitest@4.1, @vitest/coverage-v8@4.1, jsdom@29]
  patterns:
    - Pure data transforms in platform/src/lib/data/transforms/ — no DOM dependencies
    - TDD (RED then GREEN) for all data layer work
    - Chart components receive pre-shaped typed props; no raw JSON parsing at render time
    - Deterministic noise via Math.sin(index) for reproducible test assertions

key-files:
  created:
    - platform/src/lib/data/types.ts
    - platform/src/lib/data/transforms/heatmapData.ts
    - platform/src/lib/data/transforms/timeseriesData.ts
    - platform/src/lib/data/transforms/equivalences.ts
    - platform/src/lib/data/transforms/__tests__/heatmapData.test.ts
    - platform/src/lib/data/transforms/__tests__/timeseriesData.test.ts
    - platform/src/lib/data/transforms/__tests__/equivalences.test.ts
  modified:
    - platform/package.json (added test script and vitest devDependencies)
    - platform/vite.config.ts (added vitest test block with jsdom environment)

key-decisions:
  - "Deterministic noise for synthesisePowerCurve: Math.sin(i * 0.3) avoids random seed issues in tests"
  - "Plateau power calibrated via ramp-fraction formula so trapezoidal integral ≈ totalEnergyJ within 15%"
  - "ratioVsBest computed as energy / min(energy) within backend+attn slice, not globally"
  - "HeatmapCell sorts descending by energy so scroll reveal starts with worst config first"

patterns-established:
  - "Data transforms pattern: pure functions in transforms/, typed interfaces in types.ts, tests in __tests__/"
  - "TDD pattern for data layer: write tests first (RED commit), then implement (GREEN commit)"
  - "Energy equivalence scale: 12 Wh per smartphone = 43,200 J constant"

requirements-completed: [NARR-03, VIZ-01, VIZ-03, DATA-05]

# Metrics
duration: 3min
completed: 2026-03-20
---

# Phase 2 Plan 1: Data Transforms Summary

**Vitest + jsdom test infrastructure with three typed data transform modules (heatmap, power curve synthesis, smartphone equivalence) converting raw ExperimentResult JSON into chart-ready shapes**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-20T19:39:50Z
- **Completed:** 2026-03-20T19:43:07Z
- **Tasks:** 2 (TDD: RED + GREEN)
- **Files modified:** 9

## Accomplishments

- Vitest 4.1 + jsdom configured; `npm run test` runs 18 tests across 3 suites
- Three transform modules with full TypeScript types; all downstream chart components now have a typed data contract
- 8x worst/best energy ratio confirmed by test assertion against real fixture data (NARR-03)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Vitest + types + failing tests (RED)** - `8343243` (test)
2. **Task 2: Implement transforms to pass all tests (GREEN)** - `e2ab8c2` (feat)

_Note: TDD tasks have two commits (RED then GREEN)_

## Files Created/Modified

- `platform/src/lib/data/types.ts` - TypeScript interfaces: ExperimentResult, EffectiveConfig, HeatmapCell, PowerPoint
- `platform/src/lib/data/transforms/heatmapData.ts` - toHeatmapData: filter + ratioVsBest + energy-descending sort
- `platform/src/lib/data/transforms/timeseriesData.ts` - synthesisePowerCurve: calibrated 10/80/10 ramp shape
- `platform/src/lib/data/transforms/equivalences.ts` - smartphoneCharges + formatEquivalence
- `platform/src/lib/data/transforms/__tests__/heatmapData.test.ts` - 5 tests including 8x ratio assertion
- `platform/src/lib/data/transforms/__tests__/equivalences.test.ts` - 4 tests with concrete J/token values
- `platform/src/lib/data/transforms/__tests__/timeseriesData.test.ts` - 6 tests including energy integral check
- `platform/package.json` - Added test script + vitest/jsdom devDependencies
- `platform/vite.config.ts` - Added vitest test configuration block

## Decisions Made

- Deterministic noise for `synthesisePowerCurve` uses `Math.sin(i * 0.3)` so tests can make assertions without seeding a PRNG.
- Plateau power is calibrated via a formula that accounts for ramp phases averaging half the plateau delta, keeping the trapezoidal integral within 15% of `totalEnergyJ`.
- `ratioVsBest` is computed within the backend+attn slice (not globally) because heatmap displays one slice at a time.
- Cells sort descending by energy so the scroll reveal starts at the most wasteful configuration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed implicit `any[]` TypeScript type in heatmapData test**
- **Found during:** Task 2 verification (`npm run check`)
- **Issue:** `allCells` accumulator in the 8x ratio test was implicitly typed as `any[]`
- **Fix:** Added explicit `HeatmapCell[]` type annotation and imported `HeatmapCell` type
- **Files modified:** platform/src/lib/data/transforms/__tests__/heatmapData.test.ts
- **Verification:** `npm run check` passes with 0 errors
- **Committed in:** e2ab8c2 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type annotation bug)
**Impact on plan:** Necessary for TypeScript correctness. No scope creep.

## Issues Encountered

- npm cache owned by root prevented initial install; resolved by using alternate `--cache` path.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All downstream chart plans (heatmap, timeseries, equivalence components) have typed data contracts to build against
- `toHeatmapData` ready to be called in SvelteKit load functions
- `synthesisePowerCurve` ready for use in PowerTimeseries chart component
- No blockers for subsequent plans

---
*Phase: 02-scroll-narrative*
*Completed: 2026-03-20*
