# Roadmap: llem-commons Policy Communication Site

## Overview

Four phases follow the dependency graph imposed by the architecture: data contract and fixture
generation must precede chart components; the scroll narrative must exist before the interactive
explorer can contextualise it; the site must be stable before distribution metadata can be
versioned and cited. The core argument - same model, same GPU, 8x energy difference from
configuration alone - is made viscerally legible by Phase 2 and extended by Phase 3. Phase 4
closes the gap between "looks done" and "is citable by a policy team."

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Foundation** - Data contract, fixture data, narrative arc, design system, infrastructure (completed 2026-03-20)
- [ ] **Phase 2: Scroll Narrative** - Five-beat scroll story with primary visualisations (heatmap + timeseries)
- [ ] **Phase 3: Explorer + Advanced Visualisations** - Interactive explorer, 3D surface, PCA projection, parallel coordinates
- [ ] **Phase 4: Distribution + Polish** - Embeds, citations, data downloads, accessibility and performance audit

## Phase Details

### Phase 1: Foundation
**Goal**: The data contract, fixture data, narrative arc, and build infrastructure exist as
first-class deliverables before any visualisation component is built.
**Depends on**: Nothing (first phase)
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-08
**Success Criteria** (what must be TRUE):
  1. A fixture generator script produces valid ExperimentResult JSON that hits five agreed
     headline numbers (including an 8x energy ratio) and can be validated against the
     llenergymeasure Pydantic schema without errors.
  2. The methodology page is live at `/methodology`, explains in plain language what is
     measured, how, and what the limitations are, and discloses the fixture-data status.
  3. An "About the data" coverage statement is visible on the site, accurately describing
     what hardware, models, and configuration dimensions the fixture data covers.
  4. The SvelteKit project builds to a static bundle and deploys successfully to GitHub
     Pages from a push to main.
  5. The five-beat narrative arc and policy action layer copy exist as reviewed documents
     in the repository before any scroll component is built.
**Plans:** 2/2 plans complete

Plans:
- [x] 01-01-PLAN.md -- Fixture data generator (Python script + schema validation)
- [x] 01-02-PLAN.md -- SvelteKit scaffolding, design tokens, methodology page, narrative arc

### Phase 2: Scroll Narrative
**Goal**: A non-technical policy reader can experience the full five-beat scroll story,
see the core claim made visually, and arrive at actionable policy conclusions - on any device.
**Depends on**: Phase 1
**Requirements**: NARR-01, NARR-02, NARR-03, NARR-04, NARR-05, NARR-06, VIZ-01, VIZ-02, VIZ-03, VIZ-04, DATA-04, DATA-05, DESG-01, DESG-02
**Success Criteria** (what must be TRUE):
  1. A user scrolling through the page experiences the five-beat story structure (hook -
     reveal - exploration - depth - action) with each beat's chart transitioning as a
     direct response to scroll position.
  2. The hook section leads with the misconception framing and the reveal section shows
     the 8x energy difference claim with a relatable energy equivalence (e.g., "same
     as charging N smartphones") alongside the headline number.
  3. The 2D topographic heatmap is interactive: a user can hover a cell to see exact
     energy and configuration values, zoom into regions of interest, and select areas.
  4. The animated power timeseries plays side-by-side inference curves (e.g., fp32 vs
     fp16), and the user can play, pause, and scrub the animation.
  5. Every chart has a visible "How was this measured?" link pointing to the methodology
     page, and the narrative works end-to-end on a mobile touch device.
**Plans:** 4/5 plans executed

Plans:
- [ ] 02-01-PLAN.md -- Test infrastructure + TypeScript types + data transform layer (TDD)
- [ ] 02-02-PLAN.md -- GSAP/D3 install + scroll infrastructure + Beat 1 hook + Beat 2 reveal heatmap
- [ ] 02-03-PLAN.md -- Interactive heatmap (Beat 3) with filters, tooltip, detail panel
- [ ] 02-04-PLAN.md -- Power timeseries (Beat 4) + Beat 5 policy sections + full wiring
- [ ] 02-05-PLAN.md -- Responsive polish + cross-cutting requirements + human verification

### Phase 3: Explorer + Advanced Visualisations
**Goal**: A user who wants to go deeper than the scroll narrative can explore the full
configuration space through four complementary visualisation types, filter the data, and
download what they need.
**Depends on**: Phase 2
**Requirements**: VIZ-05, VIZ-06, VIZ-07, VIZ-08, VIZ-09, DATA-06, DATA-07
**Success Criteria** (what must be TRUE):
  1. The 3D surface visualisation renders at 60fps on a 2019 integrated-graphics laptop,
     and a user can rotate and zoom it with mouse or touch; a static 2D heatmap fallback
     displays if WebGL is unavailable.
  2. The PCA-reduced 3D projection is visible and a user can rotate it to see how
     configurations cluster in the reduced space.
  3. The parallel coordinates plot renders on desktop, a user can brush-select ranges on
     any axis to filter the data, and the filtered state is reflected across all charts.
  4. A user can download the data underlying any individual chart as CSV or JSON, and
     can download the complete fixture dataset as a single file.
**Plans:** 4 plans

Plans:
- [ ] 03-01-PLAN.md -- Data transforms, types, PCA build script, download utilities (TDD)
- [ ] 03-02-PLAN.md -- Explorer page scaffold, tabs, filters, downloads, heatmap tab
- [ ] 03-03-PLAN.md -- Surface3D + PCA Projection Plotly WebGL chart components
- [ ] 03-04-PLAN.md -- Parallel coordinates D3 chart, cross-chart filter sync, Beat 5 CTA

### Phase 4: Distribution + Polish
**Goal**: Every chart on the site is independently shareable, citable, and accessible -
so a policy team member or journalist can extract assets, embed charts, and cite the
source in a report without contacting the authors.
**Depends on**: Phase 3
**Requirements**: DIST-01, DIST-02, DIST-03, DIST-04, DESG-03, DESG-04, DESG-05
**Success Criteria** (what must be TRUE):
  1. Every chart has a stable permalink URL that resolves to a page showing that chart
     in isolation, and an iframe embed code a user can copy with one click.
  2. A user can copy a ready-to-paste BibTeX or APA citation for the platform and for
     any individual chart, with versioned dataset references.
  3. A user can download any chart as a PNG or SVG file from a control on the chart itself.
  4. All charts use colourblind-safe palettes, every chart has descriptive alt text, and
     all interactive controls are reachable and operable by keyboard alone.
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 2/2 | Complete   | 2026-03-20 |
| 2. Scroll Narrative | 4/5 | In Progress|  |
| 3. Explorer + Advanced Visualisations | 0/4 | Not started | - |
| 4. Distribution + Polish | 0/TBD | Not started | - |
