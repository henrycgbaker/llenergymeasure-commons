---
phase: 03-explorer-advanced-visualisations
plan: "03"
subsystem: ui
tags: [sveltekit, svelte5, plotly, webgl, 3d-surface, pca, explorer, visualisation]

requires:
  - phase: 03-01
    provides: SurfaceGrid type, PCAProjection type, toSurfaceGrid transform, surfaceData.ts
  - phase: 03-02
    provides: Explorer page route, tab scaffold, shared filter state, filteredResults derivation

provides:
  - Surface3D component: Plotly.js 3D surface chart with axis selectors, RdBu colorscale, WebGL fallback
  - PCAProjection component: Plotly.js 3D scatter chart with energy colouring, throughput sizing, filter dimming
  - plotly.js-gl3d-dist-min installed as production dependency
  - Ambient type declaration for plotly.js-gl3d-dist-min module
  - Surface and PCA tabs wired in explorer page (replacing placeholders)

affects:
  - 03-04 (parallel coordinates tab is the remaining placeholder)

tech-stack:
  added:
    - plotly.js-gl3d-dist-min@3.4.0
  patterns:
    - Dynamic Plotly import in onMount (SSR-safe; no server-side import)
    - Plotly.purge() in onDestroy to free WebGL contexts on tab switch
    - WebGL availability detection via canvas.getContext('webgl') before mounting
    - $state for plotDiv bind:this (Svelte 5 requirement for reactive DOM refs)
    - unknown type + runtime cast helper (getPlotly()) for untyped Plotly module
    - Plotly.react() in $effect for reactive updates (not newPlot, preserves camera state)

key-files:
  created:
    - platform/src/lib/components/charts/Surface3D.svelte
    - platform/src/lib/components/charts/PCAProjection.svelte
    - platform/src/lib/plotly.d.ts
  modified:
    - platform/src/routes/explorer/+page.svelte
    - platform/package.json

key-decisions:
  - "plotDiv declared as $state<HTMLDivElement | undefined> (not plain let) — Svelte 5 requires $state for reactive bind:this bindings"
  - "Plotly typed as unknown with getPlotly() runtime cast helper — plotly.js-gl3d-dist-min has no @types package; avoids eslint @typescript-eslint/no-explicit-any in Svelte files"
  - "Tab switching uses {#if} (not display:none) so Plotly.purge fires on component destroy — critical for WebGL context limit"
  - "Axis dropdowns prevent selecting the same dimension for X and Y — handled in handleXAxisChange/handleYAxisChange guards"

patterns-established:
  - "WebGL chart pattern: isWebGLAvailable() -> onMount import -> renderChart() -> $effect react() -> onDestroy purge()"
  - "Untyped third-party module: ambient declare module .d.ts + unknown $state + typed cast helper function"

requirements-completed: [VIZ-05, VIZ-06, VIZ-07]

duration: 9min
completed: 2026-03-26
---

# Phase 3 Plan 03: 3D Surface and PCA Projection Charts Summary

**Plotly.js WebGL 3D surface and PCA scatter charts wired into the explorer page tabs with axis selectors, filter dimming, and WebGL fallback**

## Performance

- **Duration:** 9 min
- **Started:** 2026-03-25T23:41:38Z
- **Completed:** 2026-03-26T00:50:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Surface3D: Plotly gl3d surface chart consuming `toSurfaceGrid()` output, with X/Y axis dropdowns, RdBu colorscale, WebGL fallback to ConfigHeatmapInteractive
- PCAProjection: Plotly scatter3d chart with points coloured by energy, sized by throughput, and dimmed (opacity 0.15) when outside current filter
- Both components use the same WebGL lifecycle pattern: dynamic import in onMount, Plotly.react() in $effect for reactive updates, Plotly.purge() in onDestroy
- Surface and PCA tabs wired into the explorer page replacing placeholders; tab switching via `{#if}` ensures WebGL contexts are released on destroy

## Task Commits

1. **Task 1: Surface3D + PCAProjection Plotly components** - `a2c41ba` (feat)
2. **Task 2: Wire Surface3D and PCAProjection into explorer page tabs** - `2e0ec37` (feat, part of concurrent commit)

## Files Created/Modified

- `platform/src/lib/components/charts/Surface3D.svelte` - Plotly 3D surface chart with axis selector dropdowns and WebGL fallback
- `platform/src/lib/components/charts/PCAProjection.svelte` - Plotly scatter3d PCA chart with filter-based opacity dimming
- `platform/src/lib/plotly.d.ts` - Ambient module declaration for plotly.js-gl3d-dist-min
- `platform/src/routes/explorer/+page.svelte` - Surface and PCA tab placeholders replaced with real components
- `platform/package.json` - plotly.js-gl3d-dist-min dependency added

## Decisions Made

- `plotDiv` declared as `$state<HTMLDivElement | undefined>` rather than plain `let` — Svelte 5 requires `$state` for reactive `bind:this` bindings to trigger updates correctly
- Plotly typed as `unknown` with a `getPlotly()` cast helper function — the `plotly.js-gl3d-dist-min` package has no `@types` package, and `@typescript-eslint/no-explicit-any` eslint-disable comments are not valid in `.svelte` files (rule not registered for Svelte config block)
- Tab switching uses `{#if}` (not `display:none`) so Svelte destroys the component on tab change, triggering `onDestroy` → `Plotly.purge()` — critical for staying within the browser's 8-16 WebGL context limit
- `{#each AXIS_OPTIONS as opt (opt.value)}` keyed iteration used in axis selectors to satisfy `svelte/require-each-key` lint rule

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added Svelte 5 $state for bind:this DOM refs**
- **Found during:** Task 1 (Surface3D and PCAProjection creation)
- **Issue:** Svelte 5 requires `$state()` for `bind:this` bindings — plain `let plotDiv: HTMLDivElement` triggers a non-reactive update warning
- **Fix:** Changed `let plotDiv: HTMLDivElement` to `let plotDiv = $state<HTMLDivElement | undefined>(undefined)` in both components
- **Files modified:** Surface3D.svelte, PCAProjection.svelte
- **Verification:** svelte-check reports no non-reactive-update warnings
- **Committed in:** `a2c41ba` (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added ambient type declaration for plotly.js-gl3d-dist-min**
- **Found during:** Task 1 (first type check run)
- **Issue:** `svelte-check` errored: "Could not find a declaration file for module 'plotly.js-gl3d-dist-min'"
- **Fix:** Created `platform/src/lib/plotly.d.ts` with `declare module 'plotly.js-gl3d-dist-min'`
- **Files modified:** platform/src/lib/plotly.d.ts (created)
- **Verification:** svelte-check completes with 0 errors
- **Committed in:** `a2c41ba` (Task 1 commit)

**3. [Rule 1 - Bug] Fixed lint errors: eslint-disable comment for non-existent rule, missing each-block keys**
- **Found during:** Task 1 (lint run)
- **Issue:** `eslint-disable @typescript-eslint/no-explicit-any` caused "Definition for rule not found" error in Svelte files (rule only registered for `.ts` files); `{#each}` blocks missing keys
- **Fix:** Replaced `any` with `unknown` + typed cast helper; added `(opt.value)` keys to `{#each}` loops
- **Files modified:** Surface3D.svelte
- **Verification:** `npm run lint` exits 0
- **Committed in:** `2e0ec37` (Task 2 commit, concurrent executor cleaned up remaining issues)

---

**Total deviations:** 3 auto-fixed (1 missing state pattern, 1 missing type declaration, 1 lint fix)
**Impact on plan:** All auto-fixes required for Svelte 5 correctness and CI lint passing. No scope creep.

## Issues Encountered

- A concurrent executor committed the explorer page wiring (Task 2) alongside the ParallelCoordinates component as part of `2e0ec37`. The surface and PCA tab replacements were included correctly in that commit. Final state verified clean.

## Next Phase Readiness

- Surface and PCA tabs fully functional; both respond to shared filter state
- Plan 03-04 (Parallel Coordinates) has its component stub already committed — needs the brushY filter integration finalised
- WebGL context pattern established and documented for reuse

---
*Phase: 03-explorer-advanced-visualisations*
*Completed: 2026-03-26*

## Self-Check: PASSED

- FOUND: platform/src/lib/components/charts/Surface3D.svelte
- FOUND: platform/src/lib/components/charts/PCAProjection.svelte
- FOUND: platform/src/lib/plotly.d.ts
- FOUND: .planning/phases/03-explorer-advanced-visualisations/03-03-SUMMARY.md
- FOUND: commit a2c41ba (Task 1: Surface3D and PCAProjection components)
- FOUND: commit 2e0ec37 (Task 2: explorer page wiring)
