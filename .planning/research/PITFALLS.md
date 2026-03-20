# Pitfalls Research

**Domain:** Narrative-driven interactive data visualisation site for policy audiences
**Researched:** 2026-03-20
**Confidence:** HIGH (critical pitfalls verified across multiple sources and project-specific research corpus)

---

## Critical Pitfalls

### Pitfall 1: Fixture Data That Does Not Prove the Claim

**What goes wrong:**
Fixture data is constructed to be convenient rather than to be compelling. The synthetic data looks plausible but fails to demonstrate the core claim viscerally - a reviewer can play with the visualisation and not feel the 8x energy difference that is supposed to land like a sledgehammer. When real data arrives later, the story structure that was built around weak fixture data does not survive contact with reality.

**Why it happens:**
Developers generate fixture data that covers the schema and renders without errors, but do not design the data to tell a story. They focus on shape (correct types, no nulls) rather than on narrative (does this data make the point?). The misconception-first story structure requires specific numerical contrasts - "same model, same GPU, 8x difference" - that must be embedded deliberately into fixture values, not discovered accidentally.

**How to avoid:**
Design fixture data as editorial content, not test scaffolding. Before writing a single data record, draft the exact headline numbers the visualisations need to hit. Then reverse-engineer fixture records that produce those numbers. The configuration sweep data must show: (a) a minimum 6-8x energy ratio between worst and best configurations of the same model, (b) clear monotonic improvement signals on individual axes (fp32 > bf16 > fp16, batch size sweet spots), and (c) a few "surprising" reversals that make the parallel coordinates plot interesting. Treat the fixture dataset as a script that the visualisations perform.

**Warning signs:**
- Fixture data generation is treated as a technical task assigned to a junior slot in the plan
- No specific headline numbers have been agreed before data generation begins
- The 3D surface plot looks like random noise rather than a structured landscape
- The parallel coordinates lines do not cluster into visible patterns

**Phase to address:** Foundation / data modelling phase - fixture data must be designed before any visualisation work begins. Revisit when the first visualisation prototype is connected to real data.

---

### Pitfall 2: 3D Visualisation Becomes an Unresponsive Page on Mid-Range Hardware

**What goes wrong:**
The 3D surface and PCA projection visualisations work beautifully on the developer's laptop with a dedicated GPU and fast CPU. On a policy maker's work-issued Windows laptop or a journalist's mid-range MacBook, the WebGL scene is choppy, the page becomes sluggish, and the browser occasionally crashes. Three.js / Plotly 3D surface renders degrade catastrophically with large point clouds when the device lacks GPU acceleration.

**Why it happens:**
Developers benchmark on their own hardware. The crossover between smooth and broken WebGL performance occurs anywhere between 5,000 and 50,000 data points depending on scene complexity and device GPU. 3D surface meshes for configuration landscapes can easily exceed this threshold when the full sweep data is loaded. Safari on iOS handles WebGL differently from Chrome on Windows, compounding the problem.

**How to avoid:**
Establish a performance budget before building 3D visualisations: target 60fps on a 2019 mid-range laptop (integrated Intel graphics). Use level-of-detail rendering: the full-resolution mesh loads only when the user explicitly requests it; the default view uses a decimated version. Implement a WebGL capability check on page load - if WebGL is unavailable or slow, fall back to a static 2D heatmap with a clear explanation. Test on real target hardware early: a government-issue Windows laptop and an entry-level Chromebook are good proxies for the policy audience.

**Warning signs:**
- No performance benchmarking on integrated-graphics hardware during development
- The 3D scene loads the full fixture dataset without pagination or decimation
- No fallback rendering path exists for devices without WebGL support
- The visualisation bundle is loading Three.js or Plotly without tree-shaking

**Phase to address:** Visualisation prototype phase. Establish the performance budget in the first sprint, test on weak hardware before merging any 3D visualisation component.

---

### Pitfall 3: The Story Disappears After the Scroll

**What goes wrong:**
The scrollytelling sections work as a guided journey - the user is taken through the misconception, the reveal, the configuration landscape. But when the user finishes scrolling and arrives at the interactive explorer, they are dropped into a dashboard with no context. The narrative voice evaporates. Policy readers who need to make sense of the explorer are on their own, and they leave without acting.

**Why it happens:**
Scrollytelling and interactive dashboards are built by different mental models: the scroll sections are written by someone thinking like a storyteller; the explorer is built by someone thinking like an engineer. The handoff between the two is never explicitly designed. The "call to action" section (what this means for regulation, procurement, deployment) is treated as an afterthought, added after all the technical work is done, and ends up being thin.

**How to avoid:**
Map the full narrative arc before building any component. The five-act structure (hook - reveal - exploration - depth - action) must be designed as a single document with prose and wireframes together, not as separate technical and content work streams. The action layer must be drafted before the visualisation work begins - it sets the entire frame. The explorer needs contextual cues that connect it to the story (e.g., "The chart below shows the same data you just scrolled through - now filter it yourself"). Hire the content and the code at the same time.

**Warning signs:**
- The "Policy Action" section is last in the backlog and not yet written when visualisation work begins
- The interactive explorer has no introductory text explaining what it is for
- There is no defined transition from scroll narrative to explorer
- The site can be navigated directly to the explorer without encountering the story

**Phase to address:** Narrative design phase (before any technical work). The full story arc and action layer copy should be drafted and reviewed by a policy-knowledgeable person before implementation begins.

---

### Pitfall 4: Credibility Collapse from Missing Methodology

**What goes wrong:**
The site looks polished and presents compelling numbers. A policy advisor or a sceptical journalist looks for "how was this measured?" and cannot find a clear answer. They do not share the site, cite it, or act on it. For an academic tool aimed at policy influence, a credibility gap is fatal - it is not recoverable after launch.

**Why it happens:**
Methodology documentation is treated as documentation, which is treated as low-priority. The team assumes the methodology is obvious (it is not, to non-technical audiences) or that linking to the llenergymeasure GitHub repo is sufficient (it is not - a policy reader will not parse a Python codebase). The precedent from research - OWID links methodology from every chart, CAT puts its rating methodology front and centre - is ignored because it feels like "not the product."

**How to avoid:**
Every chart and every headline number must have a "How is this measured?" link that leads to a plain-language methodology page. The methodology page must be written before any public-facing content goes live. It must explain in non-technical language: what llenergymeasure measures, how it captures power draw (hardware sensors vs software APIs), what the fixture data represents, what the known limitations are (e.g., "measurements on a single A100 - results may differ on other hardware"), and how to reproduce results. Add institutional trust signals (Hertie School affiliation, any academic citations, contact email). The methodology page should be the most polished non-technical prose on the site.

**Warning signs:**
- No methodology page exists in the site structure at the start of development
- The word "methodology" does not appear in any wireframe or sitemap
- The only link to measurement details is a GitHub URL
- No plain-language explanation of what "energy consumption" means in this context

**Phase to address:** Foundation phase - draft the methodology page before any public-facing content is built. It should exist as a document in the repo from day one, even if it is a draft.

---

### Pitfall 5: Fixture-to-Real-Data Swap Breaks the Site

**What goes wrong:**
Fixture data is structured to make development easy but does not match the real ExperimentResult schema exactly. When real llenergymeasure output is plugged in, field names are slightly different, null handling is inconsistent, computed values that were hardcoded in fixtures do not exist in the real output, and the site breaks in multiple places simultaneously. The "data-ready" promise - easy swap from fixtures to real data - turns out to mean several days of patching.

**Why it happens:**
Fixture data is generated by hand or by a script that approximates the schema. The approximation drifts from the canonical Pydantic models in llenergymeasure. Visualisation components are built against the fixture shape, not the canonical schema. Nobody runs an automated validation of fixtures against the real schema during development.

**How to avoid:**
Generate fixture data programmatically from the actual llenergymeasure Pydantic models - do not hand-write JSON. Write a fixture generator script that imports `ExperimentResult` (or its equivalent) and uses `model.model_json_schema()` to validate generated records. Store the fixture generator in the repo alongside the fixture data. Write at least one integration test that loads fixture data through the full data pipeline and validates it against the real schema. If real ExperimentResult objects change, the fixture generator breaks loudly rather than silently.

**Warning signs:**
- Fixture data is hand-written JSON or CSV, not generated from the schema
- The fixture generator script does not import from llenergymeasure
- No test validates that fixture data conforms to the canonical schema
- Fixtures contain fields or values that are not possible in real output (e.g., negative energy values, missing required fields)

**Phase to address:** Foundation / data modelling phase. The fixture generator is a first-class deliverable, not a throwaway script.

---

### Pitfall 6: Parallel Coordinates Is Illegible Without Careful Axis Design

**What goes wrong:**
The parallel coordinates plot is added to demonstrate multi-dimensional relationships, but without careful axis ordering, normalisation, and interaction design, it looks like a tangle of spaghetti lines to a non-expert. Policy audiences who are not familiar with the visualisation type are confused rather than enlightened. The plot becomes an "impressive-looking chart that nobody understands" - present because it was in the original plan, not because it communicates anything.

**Why it happens:**
Parallel coordinates are a powerful technique for expert audiences but require significant design investment to be readable by non-experts. The default implementation (axes in random order, full dataset visible, all lines the same opacity) is not useful. Without highlighting, filtering, and careful axis ordering to minimise line crossings, the pattern is invisible. Plotly's default parallel coordinates render all axes at equal width with no interaction hints.

**How to avoid:**
Design the parallel coordinates plot as an exploratory tool for researchers/depth audience only - do not put it in the public-facing narrative flow. For the policy narrative, use the simpler topographic heatmap and the 3D surface screenshot. On the parallel coordinates, implement: (a) default axis ordering that minimises crossings (use the data to find the optimal ordering, not alphabetical), (b) highlighting of selected configuration bands in a contrasting colour with other lines dimmed, (c) a "which axis am I looking at?" tooltip system, and (d) a plain-language introduction ("Each line is one experiment. Drag the highlighted region on any axis to filter."). Test with someone who has never seen a parallel coordinates plot before accepting the design.

**Warning signs:**
- The parallel coordinates plot is in the main narrative flow before the interactive explorer
- All axes are in alphabetical or schema order rather than optimised order
- No highlighting or brush-selection interaction is implemented
- The plot has not been tested with anyone from the target policy audience

**Phase to address:** Visualisation prototype phase. Treat parallel coordinates as the highest-risk visualisation type - prototype it early and test with a non-technical person before committing to the implementation.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode headline numbers instead of computing them from data | Faster to build the narrative layer | Numbers become wrong when data changes; manual update required every time real data arrives | Never - compute all headline numbers from data, even in prototypes |
| Bundle all fixture data as a single large JSON import | Simple data loading | Large initial bundle size; slow first load on slow connections; blocks the "data-ready" swap | Only for proof-of-concept; replace with lazy-loading by feature, not by phase |
| Use Plotly's default theme without customisation | No design work needed | Site looks like every other Plotly dashboard; policy audience reads it as a tool, not a publication | Never for public-facing content; Plotly defaults are fine for internal prototypes only |
| Skip accessibility on interactive visualisations ("we'll add it later") | Faster first pass | Adding keyboard navigation and screen reader support to D3/Plotly components retrospectively is very expensive; GSAP ScrollTrigger requires specific aria patterns | Never for public-facing content - accessibility must be designed in from the start |
| Inline all chart configuration in the component | Easy to prototype | Charts cannot share configuration; changing a colour palette requires editing every component individually | Acceptable for a single prototype component; must refactor to shared theme before two chart types exist |
| Use DuckDB-WASM for all client-side filtering without data size limits | Works perfectly in development | DuckDB-WASM loads a 2-3 MB WASM binary; on slow connections this adds seconds to first interactive; very large Parquet files will exceed browser memory | Acceptable for researcher-layer exploration; the public narrative layer should pre-compute all displayed values at build time |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| llenergymeasure Pydantic schema | Import and use the Pydantic models directly as the platform's data contract | Define a separate `SharedResult` schema and write an explicit translation layer; the platform must be able to evolve independently of llenergymeasure version upgrades |
| GitHub Pages hosting | Commit large JSON/Parquet fixture files directly to the repo | Keep the repo under 500 MB; store large data files in GitHub Releases or as build artifacts; reference them via URL, not bundled imports; GitHub Pages rejects files over 100 MB |
| Netlify free tier | Assume unlimited build minutes | Netlify free tier caps at 300 build minutes/month; a slow SvelteKit + D3 build with data processing can consume 5-10 minutes per deploy; monitor usage from day one |
| GSAP ScrollTrigger (now free after Webflow acquisition) | Assume it is MIT licensed | GSAP is free for use but not MIT - check licence terms before the project goes beyond personal/open-source use; Scrollama (MIT) is a safe alternative |
| Three.js / Plotly 3D | Import the full library | Tree-shake aggressively; Three.js full bundle is ~600 KB gzipped; only import the renderers and geometries actually used |
| Parquet timeseries files | Serve raw Parquet from a static host | Pre-process Parquet at build time to JSON with DuckDB; raw Parquet requires the WASM DuckDB binary which adds 2-3 MB to the page weight |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| SVG rendering for thousands of data points | Visible frame drops when hovering over charts; the parallel coordinates plot is sluggish | Switch to Canvas rendering (Plotly has a `type: 'scattergl'` option) for datasets over ~2,000 points; use WebGL for 3D surfaces | At ~2,000 SVG elements in D3 / ~5,000 in Plotly SVG mode |
| Unoptimised 3D surface mesh | The 3D surface is smooth in Chrome on a developer machine but choppy on integrated graphics | Decimate the mesh to the minimum resolution that preserves the landscape shape; default to a 20x20 or 30x30 grid, not the full data resolution | On any device without a dedicated GPU |
| Full fixture dataset loaded on every page | Navigation between sections causes re-fetching and re-parsing | Precompute all visualisation-specific data at build time (Observable Framework / Evidence pattern); ship only the data each section needs, not the full dataset | Noticeable on connections below 10 Mbps; severe on mobile |
| Scrollama / IntersectionObserver and heavy D3 transitions | Scroll feels janky; chart transitions skip frames | Run D3 transitions on `requestAnimationFrame`; avoid triggering layout recalculations (reading DOM measurements) inside scroll handlers | On any device under moderate CPU load |
| DuckDB-WASM cold start | The interactive explorer appears to hang for 2-5 seconds after the user first interacts | Preload the DuckDB-WASM binary in the background while the user is reading the scroll narrative (not needed for the static narrative layer) | On any connection below 20 Mbps for the first load |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Leading with the topographic heatmap instead of the sledgehammer stat | Policy readers see a colourful chart before they understand why it matters; they do not know what they are looking at | Open with a large, simple number and a one-sentence explanation ("The same model used 8x more energy under the default configuration than the optimised one"). The heatmap is a second step, not the first. |
| No equivalence anchors on energy numbers | Kilowatt-hours and watts are abstract to non-technical audiences; the numbers fail to land | Every headline energy number must be accompanied by a concrete comparator ("equivalent to charging 400 smartphones" or "enough to power a household for 6 hours"). Build a shared equivalence utility used across all visualisations. |
| Interactive explorer with no default state | Users arrive at the explorer and see all data simultaneously, with no highlighted path through it | Set a deliberate default: the explorer should open showing the most illustrative comparison from the narrative (e.g., fp32 vs bf16 on Llama 3.1-8B), with all other configurations dimmed. Users can clear the default to explore freely. |
| Colour scales that are not colourblind-safe | Roughly 8% of users (disproportionately male) cannot distinguish red/green heatmaps; the configuration landscape becomes unreadable | Use a perceptually uniform sequential scale (viridis, plasma, or cividis) as the default for all heatmaps. Test with a colourblindness simulator (e.g., Coblis) before any public review. |
| No mobile layout for the scroll narrative | Policy makers read on phones; if the scrollytelling breaks on a 390px screen, the site has a fatal usability gap for a large fraction of the target audience | Design the sticky-graphic scrollytelling pattern to stack vertically on mobile: text above, chart below. Test on a real phone, not just a browser resize. |
| "Download data" link that produces a raw JSON dump | A policy maker who wants to use the data in a report cannot open a 50 MB JSON file in Excel | Provide a pre-filtered CSV download that matches the current visualisation view, with human-readable column headers. Raw JSON/Parquet is appropriate only for the researcher depth layer. |

---

## "Looks Done But Isn't" Checklist

- [ ] **Scrollytelling narrative:** The scroll sections render correctly - but verify that the sticky chart stays visible on scroll at the correct viewport height on both desktop and mobile, and that the chart transitions trigger at the right scroll positions (not too early, not too late)
- [ ] **Interactive explorer:** The filters and selections work in isolation - but verify that URL state is preserved (a filtered view can be linked/shared), that the browser back button returns to the expected state, and that the default state matches the narrative
- [ ] **Methodology page:** The page exists and is linked from the footer - but verify it is linked from every individual chart, not just the navigation, and that it explains the fixture-vs-real-data status of the current deployment
- [ ] **Energy equivalence anchors:** Numbers have labels ("kWh") - but verify every headline number has a concrete comparator in plain English, not just a unit
- [ ] **3D surface visualisation:** The 3D surface renders and rotates - but verify it achieves 30+ fps on an integrated-graphics laptop, has a static fallback image for devices without WebGL, and is not blocking the page load
- [ ] **Parallel coordinates plot:** The plot renders all lines - but verify that an axis ordering pass has been done to reduce crossings, that brush selection works and highlights correctly, and that a first-time user can understand it without instructions
- [ ] **Accessibility:** Colours look good visually - but verify the site passes a colourblindness check (Coblis or equivalent), all charts have alt text or aria-label descriptions, and keyboard navigation reaches all interactive elements
- [ ] **Hosting constraint:** The site deploys to Netlify/GitHub Pages - but verify the total uncompressed data size is under 500 MB and no individual file exceeds 100 MB

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fixture data that does not prove the claim | HIGH - requires redesigning data and rebuilding charts | Agree on the 5 headline numbers the site must demonstrate, generate new fixture data to hit them, update all visualisations; plan 1-2 sprints |
| 3D visualisation performance failure | MEDIUM - targeted work, not a rewrite | Decimate the mesh, add the WebGL fallback, test on target hardware; plan 3-5 days |
| Story disappears after the scroll | MEDIUM - content work, not engineering | Write the action layer copy, add contextual bridging text to the explorer, redesign the transition section; plan 3-5 days |
| Credibility collapse from missing methodology | LOW-MEDIUM - content is the main cost | Write the methodology page (2-3 days of work), add "How measured?" links to all charts (1 day); total 3-5 days |
| Fixture-to-real-data swap breaks the site | HIGH if unforeseen, LOW if schema drift was tracked | If the fixture generator was kept in sync with the schema, the swap is a pipeline task; if not, expect 1-2 weeks of debugging and patching |
| Parallel coordinates illegible | MEDIUM | Reorder axes, add highlighting interaction, move plot to researcher depth layer rather than main narrative; plan 3-5 days |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Fixture data that does not prove the claim | Phase 1: Data modelling and fixture generation | Before any visualisation is built, verify the fixture dataset produces the agreed headline numbers in a simple spreadsheet check |
| 3D visualisation performance failure | Phase 2: Visualisation prototype | Test on integrated-graphics hardware within the first week of 3D work; establish fps benchmark as a merge gate |
| Story disappears after the scroll | Phase 1: Narrative design (before any code) | Review the full five-act story structure document with a policy-literate non-technical reader before implementation begins |
| Credibility collapse from missing methodology | Phase 1: Foundation / content architecture | Methodology page draft must exist in the repo before any public-facing component is merged |
| Fixture-to-real-data swap breaks the site | Phase 1: Data modelling | Fixture generator imports from llenergymeasure Pydantic models; integration test validates fixtures against schema |
| Parallel coordinates illegible | Phase 2: Visualisation prototype | Non-technical user test before the component is accepted |
| Missing equivalence anchors | Phase 1: Content design | Equivalence anchor utility must exist and be in use before any headline number is wired into a visualisation |
| Colour palette inaccessibility | Phase 1: Design system | Colourblindness simulation check before the design system is locked |
| Mobile scrollytelling breakage | Phase 2: Visualisation prototype | Test on a real mobile device (not a browser resize) before the scroll narrative is considered done |
| Free hosting file size limits | Phase 1: Infrastructure setup | Measure total data size of fixtures during generation; keep any single asset under 100 MB; if needed, redesign data loading strategy before the build pipeline is established |

---

## Sources

- Project research corpus: `.product/research/data-storytelling-viz.md` (Observable, Flourish, The Pudding, Scrollama, Evidence patterns)
- Project research corpus: `.product/research/policy-data-communication.md` (OWID, CAT, Gapminder credibility and methodology transparency patterns)
- Project research corpus: `.product/research/vision-gap-analysis.md` (section 2.3 data quality, section 1.6 CDN/performance, section 2.4 schema versioning)
- Plotly.js parallel coordinates known issues: https://github.com/plotly/plotly.js/issues/7016 (hover data missing), https://github.com/plotly/plotly.js/issues/6136 (scrolling accessibility)
- GitHub Pages file size limits (100 MB hard limit, 1 GB repo recommendation): https://www.byteplus.com/en/topic/556907
- WebGL vs Canvas rendering benchmarks: https://www.svggenie.com/blog/svg-vs-canvas-vs-webgl-performance-2025 (crossover threshold 5,000-50,000 elements, device-dependent)
- Storybench on trust in data visualisation: https://www.storybench.org/how-designers-decide-what-makes-data-stories-feel-trustworthy-before-youve-even-read-the-headline/
- Data journalism transparency methodology: https://fiveable.me/data-journalism/unit-12/transparency-methodology-data-sources/study-guide/psdi0cmzgXAXg4hM
- Scrollytelling effectiveness research: https://dl.acm.org/doi/fullHtml/10.1145/3605655.3605683 (sticky graphic pattern with incremental animation most effective)
- EU Data Visualisation Guide on scrollytelling: https://data.europa.eu/apps/data-visualisation-guide/scrollytelling-introduction

---
*Pitfalls research for: Narrative-driven interactive data visualisation site (policy audience, complex visualisations, free/cheap hosting)*
*Researched: 2026-03-20*
