# Project Research Summary

**Project:** llem-commons policy communication site
**Domain:** Narrative-driven, interactive data visualisation for policy audiences
**Researched:** 2026-03-20
**Confidence:** HIGH

## Executive Summary

llem-commons is a scrollytelling data publication site aimed at policy audiences - researchers, regulators, and procurement officers - who need to understand how LLM energy consumption is driven by implementation choices, not model selection. The established pattern for this class of site (exemplified by The Pudding, Our World in Data, and Reuters Graphics) combines a guided scroll narrative with a progressive disclosure architecture: hook - reveal - exploration - depth - action. The research confirms that SvelteKit with D3 and Plotly is the right stack, static generation is the right deployment model, and the fixture-first data architecture is the right sequencing strategy. The site's core claim ("same model, same GPU, 8x energy difference from configuration alone") must be made viscerally legible through the visualisations, not merely stated.

The primary design risk is framing collapse: building technically correct visualisations that do not land the argument. This risk has three facets - fixture data that does not produce the headline numbers the narrative requires, a story arc that evaporates after the scroll sections, and a credibility gap from absent methodology documentation. All three are foundation-phase problems, not polish problems. The research is unambiguous: the narrative structure, methodology page, and fixture data design must exist as documents before a single visualisation component is built. Getting this order wrong is the single most common failure mode in data journalism projects of this type.

The architecture imposes a clear build order with data transforms as the critical path. The transform layer - which converts raw ExperimentResult JSON into chart-ready arrays - is the contract between the data pipeline and the visualisation layer. If this contract is defined correctly in TypeScript interfaces early, chart components can be built and tested independently. If it drifts, everything downstream breaks at once. The recommended phasing puts foundation (data contract, fixture generation, methodology draft, narrative arc) ahead of any visualisation work. Two subsequent phases build the scroll narrative and the interactive explorer in that order, mirroring the dependency graph.

## Key Findings

### Recommended Stack

SvelteKit with `adapter-static` is the correct framework - it compiles to zero-runtime JavaScript, integrates naturally with D3's imperative DOM model (unlike React), and is demonstrably used by The Pudding and Datawrapper for precisely this use case. Tailwind v4 handles layout and typography; design tokens handle chart colours (never Tailwind utility classes for visualisation colour). GSAP ScrollTrigger replaces Scrollama as the scroll engine given that all GSAP plugins became free in April 2025. Plotly.js handles the 3D surface and parallel coordinates (WebGL-accelerated); D3 handles the topographic heatmap and animated power timeseries (SVG, fully animatable). DuckDB-WASM enables client-side SQL over Parquet for the interactive explorer with zero server costs. Deploy to Cloudflare Pages (unlimited bandwidth, free tier, GitHub integration) not Netlify (credit-based pricing since September 2025).

**Core technologies:**
- SvelteKit 2.55 + Svelte 5: full-stack framework and static site generator - natural D3 integration, adapter-static output, used by The Pudding
- D3 7.9: topographic heatmap and animated power timeseries - SVG-based, fully animatable, modular imports for tree-shaking
- Plotly.js 3.4 (`plotly.js-dist-min`): 3D surface and parallel coordinates - WebGL-accelerated, built-in brushing interaction
- GSAP 3 (now free): scroll-driven narrative transitions - more powerful than Scrollama for complex timeline sequences
- DuckDB-WASM 1.29.x (stable, not dev): client-side SQL over Parquet - zero server costs for interactive filtering
- Tailwind CSS 4 (Vite plugin): layout and typography - do not use for chart colours
- Cloudflare Pages: hosting - unlimited bandwidth, GitHub-integrated, 500 builds/month free

### Expected Features

The policy site benchmarks against OWID, Gapminder, and Climate Action Tracker. Their users arrive with established expectations. Missing table stakes makes the site feel like a dashboard; delivering the differentiators makes it a distinct contribution.

**Must have (table stakes):**
- Scrollytelling narrative structure (5 beats: hook - reveal - exploration - depth - action) - policy audiences primed by NYT/Guardian to consume data this way
- Misconception-first hook ("you're probably wrong about what drives AI energy") - Gapminder established this as the most effective entry for correcting prior beliefs
- Configuration landscape as primary visualisation (2D topographic heatmap) - the claim made visible; nothing comparable exists in this space
- Animated power timeseries (fp32 vs fp16 inference curves) - visceral; makes audiences feel the difference rather than read it
- Relatable energy equivalences on every headline number - kWh is meaningless to policy audiences; equivalences are required for comprehension
- Methodology transparency page, linked from every chart - without this the site cannot be cited; credibility is non-recoverable after launch
- Policy action layer (regulation, deployment, procurement) - turns data into policy-ready conclusions
- Responsive mobile-first design - policy makers read on phones; scrollytelling must work on touch
- Chart download (PNG/SVG) and data download (CSV) - journalists and policy staff need to extract assets
- "About the data" coverage statement - honest about fixture-data status; signals rigour

**Should have (competitive differentiators):**
- 3D surface visualisation ("loss landscape" style) - the screenshot that travels in reports and social media
- Participatory "guess the difference" element - measurably increases engagement and comprehension
- Chart permalink and iframe embed code - OWID's greatest force multiplier; add when first external party asks to embed
- Citation templates (BibTeX/APA) - add when first academic audience engages
- PCA projection view - researcher-depth layer once site structure is stable
- Parallel coordinates plot (desktop-only) - high-dimensional view for research audiences

**Defer (v2+):**
- Real sweep data swap - happens when llenergymeasure sweep completes; architecture is designed for it
- Configuration advisor / recommendation engine - requires real data density
- Data commons / community submission (`llem push` API) - separate product milestone
- Embeddable mini-landscape widget - requires stable methodology and real data
- What-if scenario explorer - requires real data density

### Architecture Approach

The architecture separates three concerns cleanly: a build-time data layer (Node.js transforms that convert ExperimentResult JSON to chart-ready arrays), a scroll-driven narrative engine (ScrollController - NarrativeSection - ChartPanel chain), and visualisation rendering (isolated chart components that receive pre-shaped data as props and own their D3/Plotly lifecycle). These three layers communicate via typed TypeScript interfaces, not shared state. The critical constraint is that all data transformation happens at build time in `+page.server.js` - chart components receive pre-computed arrays and do no data processing themselves. This enables zero-cost static hosting, fast page loads, and a clean fixture-to-real-data swap path (one environment variable).

**Major components:**
1. `lib/data/transforms/` - ExperimentResult to chart-ready arrays; the contract boundary between data and visualisation
2. `ScrollController` / `NarrativeSection` / `ChartPanel` - sticky-graphic scrollytelling infrastructure; emits step index, chart panel translates to chart state
3. `VisualisationRouter` - maps step index to (chart type, highlight config) using a static config object; uses `{#if}` not CSS hiding to manage WebGL context lifecycle
4. Chart components (TopoMap, Surface3D, PowerTimeseries, PCAProjection, ParallelCoords) - each self-contained, receives typed data prop, owns its D3/Plotly lifecycle via `onMount` and `$effect`
5. `lib/theme/` - shared colour palette (colourblind-safe) and D3 scale factories; defined once, used everywhere

**Build order the architecture imposes:**
Data types and transforms → theme/scales → chart components → scroll infrastructure → route assembly → UI layer

### Critical Pitfalls

1. **Fixture data that does not prove the claim** - design fixture data as editorial content, not test scaffolding. Agree on the 5 headline numbers before writing a single data record; reverse-engineer fixture records to hit them. The 8x energy ratio must be embedded deliberately, not discovered accidentally. Treat fixture generation as a first-class deliverable.

2. **Fixture-to-real-data swap breaks the site** - generate fixtures programmatically from the actual llenergymeasure Pydantic models, not by hand. Write a fixture generator that imports `ExperimentResult` and validates records against the real schema. Include an integration test. If schema drifts, the generator breaks loudly.

3. **Story disappears after the scroll** - map the full five-act narrative arc as a document before building any component. The policy action layer copy must be drafted and reviewed by a policy-knowledgeable person before implementation begins. The interactive explorer needs contextual bridging text connecting it to the scroll story.

4. **Credibility collapse from missing methodology** - the methodology page must exist in the repo before any public-facing component is merged. Every chart needs a "How is this measured?" link. A GitHub URL to the llenergymeasure codebase is not sufficient - the page must explain in plain language what is measured, how, and what the limitations are.

5. **3D visualisation performance failure on mid-range hardware** - establish a performance budget (60fps on 2019 integrated-graphics laptop) before building any 3D component. Default to a decimated 20x20 or 30x30 mesh, not full data resolution. Implement a WebGL fallback to a static 2D heatmap. Test on a government-issue Windows laptop, not a developer machine.

## Implications for Roadmap

Based on the combined research, a four-phase structure emerges from the dependency graph. The data contract and narrative design are jointly the critical path - neither can wait for the other.

### Phase 1: Foundation (Data Contract, Narrative Design, Infrastructure)

**Rationale:** ARCHITECTURE.md is explicit: data transforms and fixture data are the critical path - chart components cannot be built meaningfully without shaped data. PITFALLS.md identifies the top three pitfalls (fixture data quality, fixture-to-real-data swap, story disappearance) as foundation-phase problems. FEATURES.md's dependency graph shows that scrollytelling requires static data at build time. Everything else depends on what is established here.

**Delivers:**
- TypeScript types matching ExperimentResult schema (`lib/data/types.ts`)
- Fixture generator script (imports from llenergymeasure Pydantic models, generates editorial-quality data hitting the 5 agreed headline numbers)
- `lib/data/transforms/` - reshape, normalise, and PCA modules with integration test
- Methodology page draft (plain-language explanation of llenergymeasure, measurement approach, limitations, and fixture-data status)
- Five-act narrative arc document with policy action layer copy drafted and reviewed
- Design system: colourblind-safe palette, D3 scale factories, energy equivalence utility
- SvelteKit project scaffolded with `adapter-static`, Cloudflare Pages deployment pipeline working

**Addresses:** Table stakes (methodology transparency, "about the data" coverage statement, data download), FEATURES.md data pipeline dependencies

**Avoids:** Pitfalls 1, 2, 4 (fixture quality, schema drift, methodology gap) - all must be prevented here or the entire build is at risk

### Phase 2: Scroll Narrative (Core Story + Primary Visualisations)

**Rationale:** The scroll narrative is the product. It consumes the outputs of Phase 1 directly (shaped data, design system, narrative arc document). Chart components can be built and tested independently using the typed data interfaces. The sticky-graphic scroll infrastructure can be built in parallel with chart components. The 2D topographic heatmap and animated power timeseries are P1 features that carry the core claim.

**Delivers:**
- ScrollController / NarrativeSection / ChartPanel scroll infrastructure
- TopoMap (D3 SVG contour heatmap) - the primary configuration landscape view
- PowerTimeseries (D3 animated line chart) - fp32 vs fp16 inference power curves
- Misconception-first hook section with the "8x difference" reveal beat
- Energy equivalence anchors wired throughout
- Responsive layout (desktop + tablet + mobile), sticky pattern degrades gracefully on mobile
- Methodology page live and linked from every chart

**Uses:** GSAP ScrollTrigger (scroll infrastructure), D3 7.9 (TopoMap, PowerTimeseries), adapter-static build pipeline

**Implements:** ScrollController, NarrativeSection, ChartPanel, VisualisationRouter, TopoMap, PowerTimeseries components

**Avoids:** Pitfall 3 (story disappearance - the action layer copy is already drafted from Phase 1), mobile scrollytelling breakage (test on real device before phase is complete)

**Research flag:** Standard patterns - The Pudding and Reuters Graphics scrollytelling patterns are well-documented. Skip `/gsd:research-phase` here.

### Phase 3: Interactive Explorer + Advanced Visualisations

**Rationale:** The explorer depends on the scroll narrative existing to provide context. The 3D surface and parallel coordinates are P2 features that enhance the core claim already established by Phase 2. DuckDB-WASM can be introduced here for the explorer layer without affecting the static narrative. Parallel coordinates is the highest-risk visualisation type and must be prototyped and user-tested before acceptance.

**Delivers:**
- DuckDB-WASM explorer with pre-built Parquet snapshot, filter state in Svelte stores
- Observable Plot for faceted comparisons in the explorer
- Surface3D (Plotly 3D surface, WebGL) with mesh decimation and static PNG fallback
- Parallel coordinates (D3, desktop-only) with optimised axis ordering, brush selection, and non-technical user test gate
- PCA projection view
- "Guess the difference" participatory element within the scroll flow
- Chart download (PNG/SVG) and data download (CSV) on every chart

**Uses:** DuckDB-WASM 1.29.x, Observable Plot 0.6.17, Plotly.js 3.4 (Surface3D, ParallelCoords)

**Implements:** VisualisationRouter WebGL context management (`{#if}` unmounting, not CSS hiding), DataAccessLayer, DecimatedMesh strategy

**Avoids:** Pitfall 2 (3D performance - performance budget established and tested on integrated-graphics hardware before merge), Pitfall 6 (parallel coordinates illegibility - axis ordering pass and non-technical user test required before acceptance)

**Research flag:** DuckDB-WASM integration with SvelteKit may need a targeted spike - the WASM init pattern and Parquet serving approach have known complexity. Parallel coordinates axis ordering optimisation may need a short research spike.

### Phase 4: Distribution Layer (Embeds, Citations, Polish)

**Rationale:** These features are P2 (add after validation) per FEATURES.md. They require the site to be stable and the data schema to be versioned before they can be built correctly. Citation templates require stable data versioning. Chart embeds require stable URLs (guaranteed by `adapter-static`). This phase is low-complexity individually but requires the rest of the site to be settled.

**Delivers:**
- Chart permalink URLs and iframe embed code on every chart
- Citation templates (BibTeX/APA) with versioned dataset references
- Data versioning scheme for fixture snapshots
- Accessibility audit: WCAG 2.2, colourblindness simulation check, keyboard navigation audit, alt text on all charts
- Performance audit: bundle analysis, DuckDB-WASM preload during scroll narrative, Parquet serving strategy
- "Looks done but isn't" checklist from PITFALLS.md cleared

**Avoids:** Hosting file size limit issues (audit before deployment), DuckDB-WASM cold start UX (preload during scroll)

**Research flag:** Standard patterns - embed and citation templates are low-complexity. Skip `/gsd:research-phase`.

### Phase Ordering Rationale

- The dependency graph in FEATURES.md and the build order in ARCHITECTURE.md independently converge on the same sequence: data contract before charts, charts before explorer, explorer before distribution.
- Pitfalls 1, 2, 4 are all foundation-phase problems. Deferring any of them creates disproportionate downstream cost (PITFALLS.md recovery estimates: HIGH cost for pitfalls 1 and 5 if not caught early).
- The narrative arc document and policy action layer copy are placed in Phase 1 not because they are engineering work, but because PITFALLS.md identifies their absence as a structural risk that cannot be recovered cheaply later.
- Anti-features from FEATURES.md (live dashboard, model leaderboard, PDF downloads) are excluded from all phases.

### Research Flags

**Needs targeted research spikes during planning:**
- Phase 3 (DuckDB-WASM): WASM initialisation pattern in SvelteKit `onMount`, Parquet file serving from `static/`, AsyncWebAssembly Vite config - the integration has known complexity and the STACK.md notes a security advisory on dev versions
- Phase 3 (Parallel coordinates): Axis ordering optimisation algorithms and Plotly's default brush interaction limitations - PITFALLS.md rates this as highest-risk visualisation type

**Standard patterns (skip research-phase):**
- Phase 1: SvelteKit project setup and adapter-static - official docs, well-documented
- Phase 2: Sticky-graphic scrollytelling with GSAP ScrollTrigger - Reuters Graphics and The Pudding patterns are well-documented in the existing research corpus
- Phase 4: Embed and citation patterns - low-complexity, standard implementation

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core framework (SvelteKit, D3, Plotly, GSAP) verified against official docs and confirmed versions. One caveat: DuckDB-WASM rated MEDIUM due to version pinning complexity and CVE-2025-59037 on dev versions |
| Features | HIGH | Grounded in 12 existing product research documents covering 80+ platforms; verified against live platform analysis. Feature prioritisation is well-supported by competitor analysis |
| Architecture | HIGH | Core patterns (build-time data loading, sticky-graphic scrollytelling, D3 lifecycle in Svelte, WebGL context management) verified across multiple authoritative sources including official SvelteKit docs and Reuters Graphics patterns |
| Pitfalls | HIGH | Pitfalls verified against project-specific research corpus, Plotly community issues, and platform-specific constraints (GitHub Pages file limits confirmed). WebGL performance thresholds have quantified benchmarks |

**Overall confidence:** HIGH

### Gaps to Address

- **DuckDB-WASM stable version pinning:** The research notes CVE-2025-59037 affects dev versions and recommends pinning to 1.29.x stable. Verify the exact stable release tag against github.com/duckdb/duckdb-wasm/releases before Phase 3 begins.
- **GSAP licence for institutional use:** GSAP is free for use but not MIT. The research flags this as a check item. Confirm the GSAP licence is compatible with Hertie School's open-source publishing requirements before finalising the stack.
- **Parquet timeseries sidecar format from llenergymeasure:** The animated power timeseries feature depends on Parquet timeseries sidecars. Confirm the actual output format of llenergymeasure before building PowerTimeseries - if the format differs from assumed, the transform layer needs adjustment.
- **Mobile scrollytelling on iOS Safari:** The research recommends testing on a real device. iOS Safari's `position: sticky` behaviour within scroll containers has known quirks. Validate the sticky-graphic pattern on Safari specifically before Phase 2 is considered done.

## Sources

### Primary (HIGH confidence)
- SvelteKit official docs: https://svelte.dev/docs/kit - adapter-static, prerendering, data loading
- Svelte 5 release: https://svelte.dev/blog/svelte-5-is-alive - runes API, $effect, $props
- Tailwind CSS v4 SvelteKit guide: https://tailwindcss.com/docs/guides/sveltekit - Vite plugin approach
- D3 v7 npm: version 7.9.0, ESM-native
- Plotly.js official docs: https://plotly.com/javascript/3d-surface-plots/ and /parallel-coordinates-plot/
- GSAP free/open-source announcement: https://gsap.com/blog/webflow-GSAP/ (April 2025)
- Cloudflare Pages limits: https://developers.cloudflare.com/pages/platform/limits/
- SvelteKit adapter-static: https://svelte.dev/docs/kit/adapter-static
- Observable Framework data loaders: https://observablehq.com/framework/data-loaders
- Plotly WebGL context limit: https://community.plotly.com/t/too-many-active-webgl-contexts-oldest-context-will-be-lost/79524

### Secondary (MEDIUM confidence)
- Reuters Graphics Svelte graph patterns: https://reuters-graphics.github.io/example_svelte-graph-patterns/
- ONS Digital scrollytelling with Svelte: https://digitalblog.ons.gov.uk/2021/06/02/how-we-build-scrollytelling-articles/
- The Pudding scrollytelling stack (via Storybench): https://www.storybench.org/pudding-structures-stories-visual-essays/
- Datawrapper built on SvelteKit: confirmed in product research corpus
- Scrollama version 3.2.0: npm (stable but 4 years since last update)
- DuckDB-WASM: https://duckdb.org/docs/stable/clients/wasm/overview

### Tertiary (LOW confidence / validate during implementation)
- DuckDB-WASM stable version to pin - check github.com/duckdb/duckdb-wasm/releases at time of implementation
- GSAP licence compatibility with institutional open-source publishing
- llenergymeasure Parquet timeseries sidecar output format - validate against actual tool output

---
*Research completed: 2026-03-20*
*Ready for roadmap: yes*
