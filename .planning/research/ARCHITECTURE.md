# Architecture Research

**Domain:** Narrative-driven data visualisation site with rich interactive charts
**Researched:** 2026-03-20
**Confidence:** HIGH (core patterns verified across multiple authoritative sources)

## Standard Architecture

### System Overview

The established architecture for narrative data viz sites separates three concerns cleanly: data preparation (build time), scroll-driven narrative engine, and visualisation rendering. These layers communicate via reactive props, not shared state.

```
┌──────────────────────────────────────────────────────────────────┐
│  BUILD LAYER (runs once at build time, not in browser)           │
│  ┌──────────────────┐   ┌─────────────────────────────────────┐  │
│  │  Data Source     │   │  Data Loaders / Server Load fns     │  │
│  │  fixture/        │──►│  +page.server.js                    │  │
│  │  results/*.json  │   │  (TypeScript, runs Node.js only)    │  │
│  └──────────────────┘   └──────────────────┬────────────────┘  │
│                                            │ outputs serialised  │
│                                            ▼ data.json per page  │
├──────────────────────────────────────────────────────────────────┤
│  STATIC OUTPUT (shipped to browser as files on CDN/Pages)        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ index.html │  │ data.json    │  │  assets (JS, CSS, fonts)  │  │
│  │ /explore   │  │ (per-route)  │  │  static/*.json (large     │  │
│  │   .html    │  │              │  │  datasets for lazy load)  │  │
│  └────────────┘  └──────────────┘  └──────────────────────────┘  │
├──────────────────────────────────────────────────────────────────┤
│  BROWSER LAYER (client-side JS, fully static hosting)            │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  ScrollController (Scrollama / Svelte Scroller)            │   │
│  │  - tracks scroll position, emits step events               │   │
│  │  - triggers chart state transitions                        │   │
│  └─────────────────────────┬─────────────────────────────────┘   │
│                            │ step index, scroll progress          │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  NarrativeSection (sticky layout manager)                   │  │
│  │  ┌──────────────────────┐  ┌─────────────────────────────┐  │  │
│  │  │  TextPanel           │  │  ChartPanel (sticky)        │  │  │
│  │  │  (scrolls normally)  │  │  - stays fixed in viewport  │  │  │
│  │  │  - step paragraphs   │  │  - swaps chart state on     │  │  │
│  │  │  - policy callouts   │  │    step change              │  │  │
│  │  └──────────────────────┘  └─────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                            │ filtered/transformed data            │
│                            ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │  Visualisation Components (one per chart type)              │  │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────┐ │  │
│  │  │ TopoMap      │ │ Surface3D    │ │ ParallelCoords       │ │  │
│  │  │ (D3/SVG)     │ │ (Plotly.js   │ │ (D3/SVG canvas       │ │  │
│  │  │              │ │  WebGL)      │ │  hybrid)             │ │  │
│  │  └──────────────┘ └──────────────┘ └──────────────────────┘ │  │
│  │  ┌──────────────┐ ┌──────────────┐                           │  │
│  │  │ PowerSeries  │ │ PCAProjection│                           │  │
│  │  │ (D3 animated │ │ (D3/three.js)│                           │  │
│  │  │  line chart) │ │              │                           │  │
│  │  └──────────────┘ └──────────────┘                           │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| Data Loaders (`+page.server.js`) | Read fixture JSON at build time, transform, validate, shape for front end | None (build-time only); outputs via SvelteKit `data` prop |
| `ScrollController` | Track scroll position via IntersectionObserver; emit step index and progress | `NarrativeSection` (upward via callbacks / props) |
| `NarrativeSection` | Sticky two-column layout; orchestrate text-panel and chart-panel sync | `ScrollController` (receives step), `VisualisationRouter` (sends step) |
| `TextPanel` | Render narrative steps (prose, callouts, policy actions) as normal-flow elements | `NarrativeSection` (layout) |
| `ChartPanel` (sticky) | Hold visualisation in fixed viewport position while text scrolls past | `NarrativeSection` (receives current step), `VisualisationRouter` |
| `VisualisationRouter` | Switch which chart is active based on current step; manage chart lifecycle | Each Viz component |
| `TopoMap` | 2D topographic heatmap (D3 + SVG contours); primary policy view | Data layer (ExperimentResult JSON) |
| `Surface3D` | 3D loss-landscape surface (Plotly.js WebGL); the "wow" screenshot chart | Data layer |
| `PCAProjection` | 3D PCA scatter (D3 or Three.js); full dimension reduction view | Data layer |
| `ParallelCoords` | Parallel coordinate plot for high-dimensional config space (D3/canvas) | Data layer |
| `PowerTimeseries` | Animated line charts of power draw during inference (D3 transition) | Parquet timeseries data (pre-parsed at build) |
| `DataAccessLayer` | Policy layer: downloadable datasets, methodology accordion, raw JSON links | Static file URLs |
| `PolicyAction` | "What this means" conclusion section: regulation, deployment, procurement callouts | None (static prose) |

---

## Recommended Project Structure

```
llem-commons/
├── src/
│   ├── routes/
│   │   ├── +layout.svelte          # site-wide shell, fonts, global CSS
│   │   ├── +layout.js              # export prerender = true (static)
│   │   ├── +page.svelte            # narrative home page (the story)
│   │   └── +page.server.js         # build-time data loader: reads fixtures,
│   │                               #   shapes data for all chart components
│   │
│   ├── lib/
│   │   ├── components/
│   │   │   ├── scroll/
│   │   │   │   ├── ScrollController.svelte  # Scrollama/Scroller wrapper
│   │   │   │   ├── NarrativeSection.svelte  # sticky two-column layout
│   │   │   │   ├── TextPanel.svelte         # narrative text steps
│   │   │   │   └── ChartPanel.svelte        # sticky chart viewport
│   │   │   │
│   │   │   ├── charts/
│   │   │   │   ├── TopoMap.svelte           # D3 contour heatmap
│   │   │   │   ├── Surface3D.svelte         # Plotly 3D surface (WebGL)
│   │   │   │   ├── PCAProjection.svelte     # 3D PCA scatter
│   │   │   │   ├── ParallelCoords.svelte    # D3 parallel coordinates
│   │   │   │   └── PowerTimeseries.svelte   # animated D3 line chart
│   │   │   │
│   │   │   ├── ui/
│   │   │   │   ├── PolicyCallout.svelte     # "what this means" card
│   │   │   │   ├── EnergyEquivalence.svelte # kWh → tangible equivalents
│   │   │   │   ├── MethodologyAccordion.svelte
│   │   │   │   └── DownloadPanel.svelte     # raw data access layer
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── SiteHeader.svelte
│   │   │       └── SiteFooter.svelte
│   │   │
│   │   ├── data/
│   │   │   ├── fixtures/                    # fixture ExperimentResult JSON
│   │   │   │   ├── study-llama-sweep.json   # StudyResult shape
│   │   │   │   └── timeseries/              # parquet timeseries (or pre-parsed)
│   │   │   │
│   │   │   ├── transforms/
│   │   │   │   ├── reshape.ts              # ExperimentResult → chart-ready arrays
│   │   │   │   ├── normalise.ts            # tokens/joule, energy equivalences
│   │   │   │   └── pca.ts                  # PCA reduction (runs at build time)
│   │   │   │
│   │   │   └── types.ts                    # TypeScript types matching ExperimentResult
│   │   │
│   │   └── theme/
│   │       ├── colours.ts                  # accessible palette (colourblind-safe)
│   │       └── scales.ts                   # shared D3 scale factories
│   │
│   ├── app.css                             # global styles, CSS custom properties
│   └── app.html                            # HTML shell
│
├── static/
│   └── data/                               # large datasets served as static files
│       └── (populated by build or manually)
│
├── svelte.config.js                        # adapter-static config
└── vite.config.js
```

### Structure Rationale

- **`lib/data/fixtures/`:** Fixture JSON lives here during development. The same `+page.server.js` load path is used for both fixture and real data - the only thing that changes is the source path (or an env variable pointing to a data directory). Swapping fixture for real data is a one-line config change, not a code change.
- **`lib/data/transforms/`:** All data shaping happens at build time in TypeScript modules called from `+page.server.js`. Visualisation components receive clean, pre-computed arrays - they have no knowledge of the ExperimentResult schema.
- **`lib/components/charts/`:** Each chart type is a self-contained Svelte component. It receives `data` (pre-shaped) and `state` (which config highlight is active) as props, and owns its own D3/Plotly lifecycle.
- **`lib/components/scroll/`:** The scroll layer is deliberately separate from charts. `ScrollController` emits step indices; `ChartPanel` translates those to chart state. Neither layer knows the other's internals.

---

## Architectural Patterns

### Pattern 1: Build-Time Data Loading (Observable Framework / SvelteKit Server Load)

**What:** Data transformation runs at build time in Node.js (`+page.server.js`), not in the browser. The build outputs pre-computed, chart-ready JSON embedded in `data.json` per route. The browser receives already-shaped data; no runtime queries, no server round-trips.

**When to use:** Always, for this project. Fixture data is static. Real ExperimentResult data is also static snapshots (append-only). No dynamic per-user data needed.

**Trade-offs:** Fast page load, zero hosting costs, works on GitHub Pages / Netlify free tier. The trade-off is that updated data requires a rebuild and redeploy - acceptable given the research publication cadence.

**Implementation:**
```typescript
// src/routes/+page.server.js
import { readFileSync } from 'fs';
import { reshapeForTopoMap, reshapeForParallelCoords } from '$lib/data/transforms/reshape';

export async function load() {
  // In production: replace with path to real ExperimentResult JSON
  const raw = JSON.parse(readFileSync('src/lib/data/fixtures/study-llama-sweep.json', 'utf8'));

  return {
    topoMap: reshapeForTopoMap(raw.experiments),
    parallelCoords: reshapeForParallelCoords(raw.experiments),
    timeseries: reshapeForTimeseries(raw.experiments),
    summary: computeSummaryStats(raw.experiments),
  };
}
```

### Pattern 2: Sticky Graphic Scrollytelling (The Pudding / Reuters Graphics pattern)

**What:** Two-column layout where text content scrolls normally and the chart panel stays fixed (`position: sticky`) in the viewport. A `ScrollController` (wrapping Scrollama's IntersectionObserver) emits the current "step" index. The sticky chart updates its visual state when the step changes.

**When to use:** The narrative intro and each "revelation" section (precision reveal, backend reveal, full dataset zoom-out). This is the primary interaction pattern for the policy audience.

**Trade-offs:** Maximises chart visibility during the story. Reader never loses context as text scrolls. Requires careful mobile handling - on small screens, the sticky pattern typically degrades to sequential (chart above text, not side-by-side).

**Implementation (layout):**
```svelte
<!-- NarrativeSection.svelte -->
<script>
  import Scrollama from 'svelte-scrollama'; // or native Scroller from svelte
  let currentStep = 0;
</script>

<div class="narrative-container">
  <!-- Text scrolls; chart is sticky -->
  <div class="text-panel">
    <Scrollama on:step={e => currentStep = e.detail.index}>
      {#each steps as step, i}
        <div class="step" data-step={i}>{step.prose}</div>
      {/each}
    </Scrollama>
  </div>

  <div class="chart-panel sticky">
    <VisualisationRouter step={currentStep} {data} />
  </div>
</div>
```

### Pattern 3: Visualisation Component Isolation (D3 lifecycle in Svelte)

**What:** Each chart component manages its own D3 (or Plotly) DOM lifecycle via `onMount` and reactive `$effect` / `$derived`. The component receives `data` and `highlightConfig` as props - it never reaches outside itself to update other components.

**When to use:** All five chart components (TopoMap, Surface3D, PCAProjection, ParallelCoords, PowerTimeseries).

**Trade-offs:** Clean separation between scroll logic and rendering logic. D3's imperative DOM manipulation is contained inside a single `<svg>` or `<canvas>` element owned by the component. Svelte's reactivity handles prop changes and triggers D3 transitions.

**Implementation:**
```svelte
<!-- TopoMap.svelte -->
<script>
  import { onMount } from 'svelte';
  import * as d3 from 'd3';

  let { data, highlightConfig } = $props();
  let svgEl;

  onMount(() => {
    // Initial D3 render
    drawChart(svgEl, data);
  });

  $effect(() => {
    // Re-render or transition when highlightConfig changes
    if (svgEl) updateHighlight(svgEl, highlightConfig);
  });
</script>

<svg bind:this={svgEl} />
```

### Pattern 4: Fixture/Real Data Swap via Environment Variable

**What:** A single environment variable (`DATA_SOURCE`) switches between fixture JSON (development) and the real ExperimentResult files (production). The data shape is identical - transforms always produce the same output shape regardless of source.

**When to use:** At every rebuild. Fixture data ships with the repo. Real data is placed in a gitignored directory or pulled from lab storage before build.

**Trade-offs:** Zero code changes to swap data. The `reshapeForX()` transforms act as a contract boundary - if ExperimentResult schema changes, only the transforms need updating, not the chart components.

**Implementation:**
```typescript
// src/lib/data/loader.ts
const DATA_DIR = process.env.DATA_SOURCE ?? 'src/lib/data/fixtures';
export const loadStudy = () =>
  JSON.parse(readFileSync(`${DATA_DIR}/study-llama-sweep.json`, 'utf8'));
```

---

## Data Flow

### Build-Time Flow (runs during `vite build`)

```
Fixture JSON / Real ExperimentResult files
    │
    ▼ (Node.js, +page.server.js)
reshapeForTopoMap()        → { gridX, gridY, energyValues, contourLevels }
reshapeForParallelCoords() → { dimensions: [{key, range, values}], lines }
reshapeForPCA()            → { points: [{x, y, z, config, energy}] }
reshapeForTimeseries()     → { series: [{label, timestamps, watts}] }
computeSummaryStats()      → { maxRatio: 8.3, minEnergy, maxEnergy }
    │
    ▼ (SvelteKit serialises as data.json per route)
Browser receives fully-shaped chart-ready data
    │
    ▼ (Svelte components bind to data prop)
D3 / Plotly renders directly from arrays — no in-browser data transformation
```

### Scroll-Driven State Flow (runs in browser)

```
User scrolls
    │
    ▼ (IntersectionObserver in ScrollController)
step = 3  (e.g. "backend reveal")
    │
    ▼ (prop passed to NarrativeSection)
ChartPanel receives step = 3
    │
    ▼ (prop passed to VisualisationRouter)
VisualisationRouter resolves: step 3 → show TopoMap, highlight backend axis
    │
    ▼ ($effect in TopoMap.svelte)
D3 transition: axis highlights animate over 400ms
```

### Data Shape Contract (transform output → chart input)

The transform layer is the sole mediator between ExperimentResult schema and chart components. Chart components must never parse `ExperimentResult` fields directly.

```typescript
// Contract: TopoMap expects this shape (not ExperimentResult)
interface TopoMapData {
  xAxis: { key: string; label: string; values: number[] };
  yAxis: { key: string; label: string; values: number[] };
  grid: number[][];           // energy values at each (x,y) cell
  contourLevels: number[];    // pre-computed breakpoints for isoline rendering
  highlight?: { x: number; y: number };  // current scroll step focus point
}
```

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| Prototype (fixture data, ~50 experiments) | Current design: all data in a single `+page.server.js` load. Data serialised inline per route. |
| Real sweep data (~500-5000 experiments) | Move large datasets to `static/data/*.json`. Lazy-load on chart mount via `fetch()`. PCA computation moves to a pre-build script, not inline. |
| Full llem-commons platform (10K+ experiments) | Introduce a separate API or DuckDB-WASM in-browser query layer. The policy site remains static; an "explorer" page fetches from the API. This is the product direction already agreed. |

### Scaling Priorities

1. **First bottleneck:** Data embedded in `data.json` per route becomes large. Fix: move datasets to `static/data/` and fetch lazily on chart mount, not at page load.
2. **Second bottleneck:** WebGL context limit (8-16 per page). Fix: only one 3D chart (Surface3D / PCAProjection) in the browser viewport at a time - use `VisualisationRouter` to unmount inactive 3D charts, not just hide them. Visibility-based lazy mounting solves this.

---

## Anti-Patterns

### Anti-Pattern 1: Parsing ExperimentResult Inside Chart Components

**What people do:** Pass raw `ExperimentResult[]` to each chart component and let the component extract the fields it needs (`result.total_energy_j`, `result.effective_config.precision`, etc.).

**Why it's wrong:** Couples chart components to the ExperimentResult schema. When the llenergymeasure schema evolves (and it will - it's already at v2.0 with legacy v1.x data in the wild), every chart component breaks. Also makes charts impossible to test with mock data.

**Do this instead:** All ExperimentResult parsing happens in `lib/data/transforms/`. Chart components receive simple arrays and never import ExperimentResult types.

---

### Anti-Pattern 2: Multiple Simultaneous 3D WebGL Charts

**What people do:** Render all five chart types simultaneously on the page (all mounted in the DOM at once), hiding inactive ones with `display: none` or `visibility: hidden`.

**Why it's wrong:** WebGL contexts persist even when elements are hidden. Browsers cap contexts at 8-16 per page. With Surface3D and PCAProjection both mounted, plus any other WebGL on the page, you will hit the limit. The browser silently loses the oldest context ("Too many active WebGL contexts" warning in console), causing random chart failures.

**Do this instead:** Use `VisualisationRouter` with `{#if active}` blocks (not CSS hiding) to actually unmount inactive 3D charts. Only one WebGL chart should be mounted at any given time.

---

### Anti-Pattern 3: Scrollytelling with Scroll Event Listeners

**What people do:** Add a `window.addEventListener('scroll', handler)` and compute chart state from `window.scrollY`.

**Why it's wrong:** Scroll event listeners fire synchronously on the main thread and cannot be throttled below ~60fps without introducing jank. On mobile, passive event listener warnings appear. IntersectionObserver is the browser-native solution: step-based, off-main-thread, and automatically throttled.

**Do this instead:** Use Scrollama (built on IntersectionObserver) or SvelteKit's built-in `<Scroller>` component (same approach). Both are step-based, not position-based, which also makes the narrative logic simpler.

---

### Anti-Pattern 4: Putting Data Transformation in the Browser

**What people do:** Ship raw ExperimentResult JSON to the browser and run PCA, reshape operations, and contour computation client-side on page load.

**Why it's wrong:** PCA on 500+ high-dimensional points blocks the main thread for 100-500ms. Contour computation for the topographic map is similarly expensive. Every visitor pays this cost on every page load.

**Do this instead:** Run all compute-heavy transforms in `+page.server.js` at build time. The browser receives pre-computed arrays. DuckDB-WASM is an option for interactive filtering later, but the static snapshot model is correct for the MVP.

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Pages / Netlify free | `adapter-static` output, deploy via GitHub Actions | Zero cost, works without server. SvelteKit base path config required for GitHub Pages (repo subfolder) |
| Lab GPU server (self-hosted) | `adapter-node` or `adapter-static` behind nginx | Static output preferred: no Node.js process to manage |
| llenergymeasure CLI (data source) | File system: `result.json` + `timeseries.parquet` written to `DATA_SOURCE` dir; build reads from there | No API call, no network dependency; pure file I/O at build time |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Data transforms ↔ chart components | TypeScript interfaces (defined in `lib/data/types.ts`); transforms output, components consume | Chart components must not import from `transforms/` |
| ScrollController ↔ NarrativeSection | Svelte props / event dispatcher (`step: number`, `progress: number`) | Decouples scroll detection from chart state logic |
| NarrativeSection ↔ VisualisationRouter | `step` prop only | Router maps step index to (chartType, highlightConfig) using a static config object, not conditional logic |
| VisualisationRouter ↔ chart components | `{#if}` conditional mounting + typed data prop per chart | Guarantees only one WebGL context at a time; each chart receives only its shaped data |

---

## Build Order Implications

Dependencies between components impose a natural build sequence:

1. **Data layer first** (`lib/data/types.ts`, `lib/data/transforms/`, fixtures) — everything depends on the data contract being defined and fixture data existing.
2. **Theme and scales** (`lib/theme/`) — shared by all chart components.
3. **Chart components** (`lib/components/charts/`) — independently testable with mock data once data types are defined.
4. **Scroll infrastructure** (`lib/components/scroll/`) — can be built and tested with placeholder charts.
5. **Route assembly** (`src/routes/+page.svelte`, `+page.server.js`) — wires everything together once components exist.
6. **UI layer** (`lib/components/ui/`) — policy callouts, download panel; can be developed in parallel with scroll/chart work.

The implication for phase planning: **data transforms and fixture data are the critical path**. Chart components cannot be built meaningfully without shaped data. Getting the TypeScript interface for each chart's expected input correct early prevents rework.

---

## Sources

- Reuters Graphics Svelte Graph Patterns: [https://reuters-graphics.github.io/example_svelte-graph-patterns/](https://reuters-graphics.github.io/example_svelte-graph-patterns/) - MEDIUM confidence (live patterns but not formal docs)
- SvelteKit adapter-static official docs: [https://svelte.dev/docs/kit/adapter-static](https://svelte.dev/docs/kit/adapter-static) - HIGH confidence
- Observable Framework data loaders (architectural reference): [https://observablehq.com/framework/data-loaders](https://observablehq.com/framework/data-loaders) - HIGH confidence
- The Pudding scrollytelling stack (Svelte + Scrollama): documented in `.product/research/data-storytelling-viz.md` - HIGH confidence (multiple corroborating sources)
- Plotly.js WebGL context limit (8-16 per page): [https://community.plotly.com/t/too-many-active-webgl-contexts-oldest-context-will-be-lost/79524](https://community.plotly.com/t/too-many-active-webgl-contexts-oldest-context-will-be-lost/79524) - HIGH confidence (confirmed across multiple Plotly community threads)
- ONS Digital scrollytelling with Svelte: [https://digitalblog.ons.gov.uk/2021/06/02/how-we-build-scrollytelling-articles/](https://digitalblog.ons.gov.uk/2021/06/02/how-we-build-scrollytelling-articles/) - MEDIUM confidence (pattern stable, article from 2021)
- GitHub: `jtrim-ons/sveltekit-scrolly` - Scrollytelling Template: [https://github.com/jtrim-ons/sveltekit-scrolly](https://github.com/jtrim-ons/sveltekit-scrolly) - MEDIUM confidence (working reference, not official)

---
*Architecture research for: narrative data visualisation site (llem-commons policy site)*
*Researched: 2026-03-20*
