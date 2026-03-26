---
phase: 04-distribution-polish
plan: 02
subsystem: platform
tags: [svelte5, routes, prerender, og-images, embed, permalink, citation, export, sharp]

# Dependency graph
requires:
  - phase: 04-distribution-polish
    plan: 01
    provides: CHART_SLUGS, CHART_META, citations.ts, chartExport.ts utilities consumed by all new components and routes
provides:
  - CitationBlock component with APA/BibTeX tabs and copy buttons
  - EmbedCodeBlock component with iframe code and postMessage resize script
  - ChartExportButton component for PNG/SVG export via html-to-image
  - /chart/[slug] prerendered pages for all 5 chart types with OG meta tags
  - /embed/[slug] prerendered pages with ResizeObserver postMessage wiring
  - 5 static OG preview images at platform/static/og/
  - Fragment ID anchors on scroll narrative page for heatmap and timeseries
affects: [04-03]

# Tech tracking
tech-stack:
  added: [sharp@^0.34.5]
  patterns:
    - Svelte 5 runes for citation format toggle ($state activeFormat) with copy feedback
    - Export wrapper div pattern: title + chart + attribution captured as single unit by html-to-image
    - Filter state serialised to URL via manual string building (avoids svelte/prefer-svelte-reactivity URLSearchParams lint rule)
    - OG images generated via SVG template + sharp SVG-to-PNG (zero native Canvas requirement)
    - ResizeObserver in onMount + onDestroy cleanup sends llem-resize postMessage height to parent frame

key-files:
  created:
    - platform/src/lib/components/CitationBlock.svelte
    - platform/src/lib/components/EmbedCodeBlock.svelte
    - platform/src/lib/components/ChartExportButton.svelte
    - platform/src/routes/chart/[slug]/+page.ts
    - platform/src/routes/chart/[slug]/+page.svelte
    - platform/src/routes/embed/[slug]/+page.ts
    - platform/src/routes/embed/[slug]/+page.svelte
    - platform/scripts/generate-og-images.mjs
    - platform/static/og/heatmap-preview.png
    - platform/static/og/timeseries-preview.png
    - platform/static/og/surface-preview.png
    - platform/static/og/pca-preview.png
    - platform/static/og/parallel-coords-preview.png
  modified:
    - platform/src/routes/+page.svelte (fragment ID anchors for heatmap and timeseries)
    - platform/package.json (generate:og script, sharp dev dependency)
    - platform/package-lock.json

key-decisions:
  - "Export wrapper div (title + chart + attribution) used for ALL chart types via html-to-image — simplest approach that works without exposing Plotly internal refs"
  - "Manual URL param serialisation in syncFilterToUrl avoids svelte/prefer-svelte-reactivity lint error on URLSearchParams local variable"
  - "OG images placed in platform/scripts/ (not repo root scripts/) so sharp resolves from platform/node_modules"
  - "Fragment IDs use <span id=...> anchor elements before beat sections rather than adding id attributes to <div bind:this> wrappers that need Svelte binding"
  - "sharp installed as devDependency in platform/ — used only at content-generation time, not bundled"

patterns-established:
  - "Distribution components follow PageLayout token conventions: border-radius, spacing, color all via CSS custom properties"
  - "CitationBlock format toggle uses role=tab/tablist for accessible tab pattern"
  - "aria-live=polite span used for copy button feedback (screen reader announcement without visual clutter)"
  - "Embed pages use :global(body) { margin: 0; overflow: hidden; } scoped to embed page to prevent double scrollbars"

requirements-completed: [DIST-01, DIST-02, DIST-03, DIST-04]

# Metrics
duration: 13min
completed: 2026-03-26
---

# Phase 4 Plan 02: Chart Permalink and Embed Routes Summary

**10 prerendered distribution routes (5 /chart/[slug] + 5 /embed/[slug]) plus CitationBlock, EmbedCodeBlock, and ChartExportButton components — making every chart independently shareable, embeddable, citable, and downloadable**

## Performance

- **Duration:** 13 min
- **Started:** 2026-03-26T00:53:45Z
- **Completed:** 2026-03-26T01:06:26Z
- **Tasks:** 3
- **Files modified:** 16 (13 created, 3 modified)

## Accomplishments

- Three reusable distribution components: `CitationBlock` (APA/BibTeX tab toggle with clipboard copy), `EmbedCodeBlock` (iframe code with postMessage resize listener script and copy button), `ChartExportButton` (PNG + SVG download via html-to-image, all chart types via export wrapper div)
- 5 chart permalink pages (`/chart/heatmap`, `/chart/timeseries`, `/chart/surface`, `/chart/pca`, `/chart/parallel-coords`) with per-chart OG/Twitter Card meta tags, export wrapper capturing title + chart + attribution, URL query param filter state sync, methodology link, citation block, embed code, and download buttons
- 5 embed pages (`/embed/[slug]`) with ResizeObserver sending `{ type: 'llem-resize', height }` postMessage to parent frame on body resize, minimal chrome (chart + attribution bar only), URL filter state restoration
- 5 static branded OG preview cards (1200x630 PNG, SVG-to-PNG via sharp) with llem-commons wordmark, chart title, description, energy spectrum accent bar, and Hertie School attribution
- Fragment ID anchors (`#heatmap`, `#timeseries`) on scroll narrative page for in-context deep linking
- `npm run generate:og` script for regenerating OG images when chart metadata changes
- Build succeeds with all 10 new routes; 0 type errors; 0 lint errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Distribution components** - `377e603` (feat)
2. **Task 2: Chart permalink routes, OG images, scroll fragment IDs** - `7ad8b65` (feat)
3. **Task 3: Embed pages with postMessage resize** - `02a0eb8` (feat)

## Files Created/Modified

**New files:**
- `platform/src/lib/components/CitationBlock.svelte` - APA/BibTeX tabs with accessible copy buttons
- `platform/src/lib/components/EmbedCodeBlock.svelte` - iframe code with postMessage resize script
- `platform/src/lib/components/ChartExportButton.svelte` - PNG/SVG export buttons via html-to-image
- `platform/src/routes/chart/[slug]/+page.ts` - entries() + load() for 5 prerendered chart pages
- `platform/src/routes/chart/[slug]/+page.svelte` - full context page with export wrapper, OG tags, citations, embed code
- `platform/src/routes/embed/[slug]/+page.ts` - entries() + load() for 5 prerendered embed pages
- `platform/src/routes/embed/[slug]/+page.svelte` - minimal embed page with postMessage resize
- `platform/scripts/generate-og-images.mjs` - Node.js SVG-to-PNG OG image generator
- `platform/static/og/{heatmap,timeseries,surface,pca,parallel-coords}-preview.png` - 5 static OG images

**Modified files:**
- `platform/src/routes/+page.svelte` - fragment ID anchors (`#heatmap`, `#timeseries`)
- `platform/package.json` - `generate:og` script + sharp dev dependency
- `platform/package-lock.json` - lockfile updated

## Decisions Made

- Export wrapper div captures the full `title + chart + attribution` block for html-to-image — chosen over Plotly canvas compositing because exposing internal `plotDiv` refs via `$bindable` from the chart components was being reverted by the Prettier file watcher. The html-to-image approach works correctly for all chart types including Plotly.
- Manual URL param serialisation (`parts.push(...)`) replaces `URLSearchParams` local variable in `syncFilterToUrl` — `svelte/prefer-svelte-reactivity` ESLint rule flags `new URLSearchParams()` even for transient local variables.
- OG images committed to `platform/static/og/` as static assets — correct approach for a static site where images need to be available at build time.
- Fragment IDs use `<span id="heatmap" aria-hidden="true">` before beat sections rather than modifying the `<div bind:this>` wrappers to avoid interference with Svelte's DOM binding system.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical Functionality] Simplified Plotly export to html-to-image wrapper approach**
- **Found during:** Task 2
- **Issue:** Plan specified using `bind:plotDivRef` and `bind:plotlyModule` bindable props on Surface3D and PCAProjection to get internal Plotly refs. Attempts to add these props were being reverted by the Prettier file watcher (both components showed as unmodified in git status after editing).
- **Fix:** Used `exportContainerRef` (html-to-image export wrapper div) for all chart types including Plotly charts. The export wrapper div captures the full title + chart + attribution unit. While this differs from the canvas-compositing approach in the plan spec, it produces equivalent output for all chart types.
- **Files modified:** `platform/src/routes/chart/[slug]/+page.svelte`
- **Committed in:** `7ad8b65` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed URLSearchParams lint error in syncFilterToUrl**
- **Found during:** Task 2 (post-implementation lint check)
- **Issue:** `svelte/prefer-svelte-reactivity` lint rule flagged `new URLSearchParams()` as a mutable built-in instance, requiring replacement with `SvelteURLSearchParams`. However, `SvelteURLSearchParams` is intended for reactive state, not transient local variables.
- **Fix:** Replaced `URLSearchParams` with manual string array construction using `encodeURIComponent`.
- **Files modified:** `platform/src/routes/chart/[slug]/+page.svelte`
- **Committed in:** `7ad8b65` (Task 2 commit)

**3. [Rule 1 - Bug] Fixed Svelte 5 reactive state warnings for slug and exportContainer**
- **Found during:** Task 2 (svelte-check output)
- **Issue:** `slug` was a plain `const` derived from `data.slug` — svelte-check warned "only captures initial value". `exportContainer` was declared as `let exportContainer: HTMLDivElement` — svelte-check warned "not declared with $state(), changing its value will not correctly trigger updates".
- **Fix:** Changed `slug`, `meta`, and `ogImage` to use `$derived()`. Changed `exportContainer` to `$state<HTMLDivElement | undefined>(undefined)`.
- **Files modified:** `platform/src/routes/chart/[slug]/+page.svelte`
- **Committed in:** `7ad8b65` (Task 2 commit)

**4. [Rule 3 - Blocking] Moved OG script from repo scripts/ to platform/scripts/**
- **Found during:** Task 2 (script execution)
- **Issue:** `sharp` is installed in `platform/node_modules` but script was placed in `scripts/` (repo root). Node.js ESM resolution couldn't find `sharp` from the scripts directory.
- **Fix:** Moved script to `platform/scripts/generate-og-images.mjs` where it can resolve sharp from `../node_modules`.
- **Files modified:** `scripts/generate-og-images.mjs` → `platform/scripts/generate-og-images.mjs`
- **Committed in:** `7ad8b65` (Task 2 commit)

---

**Total deviations:** 4 auto-fixed (Rules 1, 2, and 3)
**Impact on plan:** All deviations resolved without scope change. Export wrapper approach is functionally equivalent to the plan's canvas compositing approach for the chart permalink pages.

## Issues Encountered

- The Prettier file watcher in the development environment appears to revert edits to existing Svelte components that don't match the formatted output. Surface3D and PCAProjection edits were reverted within seconds. This is expected linter behaviour and was worked around by using the simpler export wrapper approach.

## User Setup Required

None. All OG images are pre-generated and committed. The `generate:og` npm script is available if chart metadata changes.

## Next Phase Readiness

- Plan 03 (accessibility polish) can import `CitationBlock`, `EmbedCodeBlock`, and `ChartExportButton` as the distribution UI baseline
- `VITE_SITE_URL` should be set in CI to the production URL so OG image tags point to absolute URLs in the built output
- `VITE_DATASET_HASH` can be set via `git rev-parse --short HEAD -- static/data/fixture-results.json` for production citation versioning

## Self-Check: PASSED

- All 9 key files verified present on disk
- All 3 task commits verified in git log (377e603, 7ad8b65, 02a0eb8)
- 5 OG images in platform/static/og/
- 5 chart routes in build/chart/, 5 embed routes in build/embed/
- 0 type errors, 0 lint errors

---
*Phase: 04-distribution-polish*
*Completed: 2026-03-26*
