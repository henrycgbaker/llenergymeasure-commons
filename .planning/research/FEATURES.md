# Feature Research

**Domain:** Narrative-driven, interactive data visualisation site for policy audiences
**Researched:** 2026-03-20
**Confidence:** HIGH (grounded in 12 existing research documents covering 80+ platforms, verified against live platform analysis and web search)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that policy-audience data sites are judged on. Missing any of these makes the site feel incomplete or untrustworthy. Benchmarks: Our World in Data, Gapminder, Climate Action Tracker, Stanford AI Index.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Scrollytelling narrative structure | Policy audiences are primed by NYT, Guardian, FT to consume data via scroll-triggered reveals; absence makes the site feel like a dashboard, not a story | MEDIUM | Sticky graphic + stepping text is the proven pattern (Scrollama or GSAP ScrollTrigger). Five story beats: hook → reveal → exploration → depth → action already defined in PROJECT.md |
| "Choose your depth" architecture | OWID established this as the standard: headline readers, 5-min readers, and researchers all coexist on the same site | LOW-MEDIUM | Implemented as visual hierarchy: hero stat → curated findings → interactive explorer → raw data download. Not separate pages - progressive disclosure within one flow |
| Misconception-first hook | Gapminder proved this is the most effective entry point for correcting prior beliefs; policy audiences arrive with assumptions about AI energy | LOW | "You're probably wrong about what drives AI energy consumption" as the opening frame. Directly matches the PROJECT.md story structure |
| Responsive, mobile-first design | Policy makers read on phones; OWID's responsive charts are the reference implementation; mobile-only visitors will abandon a desktop-first layout | HIGH | Charts must reflow gracefully. Scrollytelling must work on touch devices. Sticky graphics require careful mobile implementation |
| Methodology transparency, linked from every chart | Policy audiences need to know where data comes from before citing it; absence of sourcing destroys credibility. OWID links methodology from every chart | LOW | A persistent "how was this measured?" link on every visualisation. Dedicated methodology page explaining llenergymeasure, RAPL, nvidia-smi, and known limitations |
| Downloadable data (CSV/JSON) | Journalists, researchers, and policy staff will want raw data; every serious policy platform (OWID, IEA, Climate Action Tracker) provides downloads | LOW | Per-chart data downloads plus a full dataset download. Fixture data must be exportable from day one |
| Chart permalink + embed code | OWID's embeddable charts are its greatest force multiplier; journalists copy the embed and the platform spreads | LOW | Every chart needs a stable URL, iframe embed code, and PNG/SVG download. Build this into the charting infrastructure from the start |
| Citation templates (BibTeX/APA) | Academic and policy staff need to cite data; SDG Tracker, OWID both provide citation templates. Absence creates friction that stops policy adoption | LOW | Auto-generated citation snippet for the platform and each individual chart/dataset. String templates, minimal engineering |
| Relatable energy equivalences | Raw kWh are meaningless to a policy audience; climate communication research consistently shows equivalence anchors are required for comprehension | LOW | "Equivalent to charging X smartphones" or "powering a household for Y hours" alongside every energy figure. A shared utility function used throughout the site |
| Accessible colour palettes and alt text | WCAG 2.2 is the baseline expectation; colourblind-safe defaults are table stakes for any government or institutional audience. Datawrapper sets the reference | MEDIUM | No red/green encoding. Use pattern + colour. Alt text on every chart. Keyboard-navigable interactive elements. Applies to all four visualisation types |
| "About the data" coverage statement | SDG Tracker's honest incompleteness builds trust; audiences expect to know what's not covered | LOW | Upfront statement: which models, backends, hardware configurations are in the fixture data. How to contribute more. This is especially important when launching with curated data only |

---

### Differentiators (Competitive Advantage)

Features that would make this site distinct from Our World in Data, Gapminder, Climate Action Tracker, and AI Energy Score. These map directly to the USP: implementation factors, not model ranking.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Configuration landscape as primary visualisation | Nobody else visualises the multi-dimensional configuration space; most sites show model rankings on fixed hardware. This is the unique claim made visual | HIGH | Topographic/heatmap view (2D axes, colour = energy) is the flagship. Ship all four approaches (topographic, 3D surface, PCA projection, parallel coordinates) and iterate. The "same model, same GPU, 8x difference from config alone" is only legible as a 2D landscape |
| Animated power timeseries (inference curves) | Power draw during inference is viscerally understandable in a way energy totals are not; side-by-side fp32 vs fp16 power curves create the "aha" moment | HIGH | Parquet timeseries sidecars from llenergymeasure are the data source. Animated SVG/canvas line chart, side-by-side comparison mode. Nothing like this exists on comparable policy sites |
| 3D surface visualisation (loss-landscape style) | Creates the "wow" screenshot for reports, papers, and social media; policy makers share screenshots | HIGH | Three.js or deck.gl for WebGL-based 3D. The visual is unique in the policy data space and directly communicates the "it's a landscape, not a ranking" message |
| "Implementation factors" framing throughout | Every comparable site frames AI energy as model selection. This site's consistent framing that config choices are the primary lever is a genuine intellectual USP | LOW | Copy, chart titles, axis labels, and the action layer all use "implementation choices" language, never "model ranking" or "model comparison" as the primary frame |
| Policy action layer as a first-class section | Most data sites stop at "here's the data." The action layer ("what this means for regulation, deployment, and procurement") turns data into policy-ready conclusions | LOW-MEDIUM | Depth 4 in the choose-your-depth architecture. Three sub-sections: regulation (what levers exist in procurement/standards), deployment (what operations teams can do today), procurement (what buyers can specify). Evidence-backed, not generic |
| Participatory "guess the difference" element | The Pudding's quiz-style interactions measurably increase engagement and comprehension; policy audiences are not immune to well-designed participation | MEDIUM | Before the reveal animation, prompt the user: "Guess how much energy difference precision makes on the same model." Show their guess vs reality. Creates emotional investment in the finding |
| Honest incompleteness as a feature | Most platforms hide data gaps; explicitly showing "we have measured X of the N possible configurations" invites contribution and signals rigour | LOW | A small "coverage" indicator or visual on the explorer section. "13 of ~500 possible configurations measured. Submit yours." Turns a limitation into a trust signal |
| Data-ready fixture architecture | The site is explicitly built to swap fixtures for real measurements; this signals to researcher audiences that the methodology is real and reproducible | LOW | Visible data provenance: "built with fixture data, methodology identical to production measurements." A clear swap path when real sweep data is ready |

---

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem desirable but would undermine the site's effectiveness for this milestone.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Single energy "grade" or score per model | Users want a simple answer; Energy Score sites use star ratings; EU energy labels use A-G | Single grades contradict the "it depends on implementation" USP. A model that's A-rated on fp16 may be F-rated on fp32. Grading hides the very variation we're trying to show | Configuration landscape is the answer: the visual shows grades vary by config. For the action layer, use text: "on A100 with fp16, Llama 3 8B is among the most efficient options in its class" |
| Live / real-time data dashboard | Dashboards feel dynamic and up-to-date; policy audiences expect "current" data | Real-time data requires server infrastructure and ongoing sweep compute. The site's core message is about configuration choices, not today's measurements. Live data also creates noise that obscures the clean "8x difference" narrative | Build-time data snapshots (Observable Framework / Evidence pattern). Label data with measurement date. Add "last updated" prominently. The fixture data is intentionally static and clean |
| Model comparison leaderboard | Leaderboards are familiar and scannable; users expect them from benchmarking sites | Model comparison on standardised hardware is what AI Energy Score and ML.ENERGY already do. A leaderboard here would position the site as a worse version of existing products rather than a distinct one | Configuration landscape is the differentiator. If a comparison table is needed, frame it as "same model, different configurations" not "different models on same hardware" |
| User accounts and data submission (this milestone) | Community contribution creates more data; users want to submit their own measurements | Authentication, validation pipelines, and community moderation are a separate product milestone. Adding them to the policy site scope would delay launch by months and distract from the narrative focus | Explicit "Data Commons" roadmap item. The policy site shows what the data looks like; the contributions feature comes later. A simple "interested in contributing?" email/form captures intent without building the system |
| Infinite configurability of charts | Users expect to customise charts; "power users" request more controls | Choice overload in data presentation decreases comprehension for policy audiences. Excessive controls signal that the site doesn't know what matters. Linear's design principle applies: make good defaults, not maximum flexibility | Offer three pre-set views (overview, precision comparison, backend comparison) with a single "explore the full data" link to the interactive layer. Opinionated, not configurable |
| PDF report downloads | Policy staff want to print and circulate; PDFs feel official | PDFs freeze data and become stale. They are disconnected from the live chart infrastructure. The Shift Project's PDF-only model traps evidence | Embeddable charts with permalinks serve the same distribution need. For formal documents, citation templates + chart images are the right pattern |
| Carbon offsetting / neutrality framing | Policy audiences expect sustainability messaging; carbon offsets are familiar | Applying offset logic to AI energy data would replicate the credibility failures of carbon markets (5-10x overestimation, additionality problems). This framing also shifts attention away from the actionable "reduce consumption" message | Frame as "reduce, don't offset." Policy action layer focuses on efficiency choices, not compensatory credits. This is also more credible to technically sophisticated audiences |

---

## Feature Dependencies

```
[Scrollytelling structure]
    └──requires──> [Static data at build time]
                       └──requires──> [Fixture data matching ExperimentResult schema]

[Configuration landscape visualisation]
    └──requires──> [Fixture data (2D: precision x batch size)]
    └──enhances──> [Scrollytelling structure] (used as the "exploration" beat)

[3D surface visualisation]
    └──requires──> [Configuration landscape data] (superset of 2D data)
    └──requires──> [WebGL rendering capability] (Three.js or deck.gl)

[Animated power timeseries]
    └──requires──> [Parquet timeseries sidecars from llenergymeasure]
    └──enhances──> [Scrollytelling structure] (used as the "reveal" beat)

[PCA projection]
    └──requires──> [Multi-dimensional fixture data] (3+ axes)
    └──requires──> [PCA computation at build time] (Python data loader)

[Parallel coordinates plot]
    └──requires──> [Multi-dimensional fixture data]
    └──conflicts──> [Mobile-first design] (parallel coords are fundamentally desktop-oriented)

[Chart permalink + embed code]
    └──requires──> [Static site generation] (embedded URLs must be stable)
    └──enhances──> [Policy action layer] (policy staff embed charts in briefs)

[Relatable energy equivalences]
    └──requires──> [Fixture data with energy values in Wh]
    └──enhances──> [Scrollytelling reveal beat] (equivalences make the "8x difference" tangible)

[Citation templates]
    └──requires──> [Stable data versioning] (citations must point to a stable dataset version)

[Participatory "guess the difference" element]
    └──requires──> [Scrollytelling structure] (works as a step within the scroll flow)
    └──requires──> [Known answer in fixture data] (the reveal must be real data)

[Policy action layer]
    └──requires──> [Core visualisations] (conclusions need supporting evidence visible)
    └──requires──> [Methodology transparency] (policy recommendations need sourcing)

[Choose-your-depth architecture]
    └──requires──> [All above sections exist] (depth requires content at each level)
```

### Dependency Notes

- **Scrollytelling requires static data at build time:** The scroll-triggered animations must reference pre-computed data snapshots. This rules out server-side rendering for the narrative layer and means the data pipeline (fixtures → build → static assets) must be established before the narrative can be built.
- **Configuration landscape requires specific fixture data shape:** The 2D heatmap needs at least two continuous axes (e.g., precision as ordinal, batch size as continuous) with energy as the colour dimension. The fixture data must be designed with this in mind.
- **Parallel coordinates conflicts with mobile-first:** Parallel coords with 5+ axes are unreadable on a phone screen. This should either be desktop-only (with a mobile fallback message) or positioned as the "depth" layer that non-mobile users access. Do not make it a key part of the primary narrative.
- **Citation templates require stable data versioning:** If the fixture data is versioned (v0.1-fixture), citations can point to a specific snapshot. Design the data versioning scheme before building citation templates.
- **3D surface requires WebGL:** Confirm WebGL support across target browser/device matrix. The 3D surface is the "wow screenshot" - it should degrade gracefully to a static PNG for non-WebGL environments.

---

## MVP Definition

### Launch With (v1)

The minimum that makes the site credible and compelling to a policy audience. Every item here is load-bearing for the core claim.

- [ ] **Scrollytelling narrative structure (5 beats)** - the entire site is this; without it there is no product. Hook → reveal → exploration → depth → action
- [ ] **Configuration landscape (topographic heatmap)** - the central visualisation that makes the "implementation factors" argument visible. The 2D heatmap (e.g., precision vs batch size, colour = energy) is the clearest form
- [ ] **Animated power timeseries** - the "visceral" companion to the landscape. Side-by-side fp32 vs fp16 power curves during inference. This is what makes audiences feel the difference rather than just read it
- [ ] **Relatable energy equivalences** - every energy figure shown alongside a tangible equivalent. Required for the policy audience to understand the numbers
- [ ] **Misconception-first hook + reveal beat** - the opening "you're probably wrong" framing and the "8x difference, same model, same GPU" reveal. These are the anchor of the story
- [ ] **Methodology transparency page + per-chart links** - without this, the site cannot be cited. Must exist at launch
- [ ] **Policy action layer** - the "so what" section. Regulation, deployment, procurement sub-sections with evidence-backed conclusions
- [ ] **Responsive design (desktop + tablet + mobile)** - policy audiences use phones. Scrollytelling must function on touch
- [ ] **Chart download (PNG/SVG) + data download (CSV)** - journalists and policy staff need to extract assets
- [ ] **"About the data" coverage statement** - honest about being fixture data, with methodology identical to production

### Add After Validation (v1.x)

- [ ] **Chart permalink + iframe embed code** - needed for distribution, but not day-one if launch is for direct viewing. Add when the first external party asks to embed a chart
- [ ] **Citation templates (BibTeX/APA)** - needed when researchers want to cite the data formally. Add when the first academic audience engages
- [ ] **Participatory "guess the difference" element** - increases engagement but requires UX refinement. Add after validating the core narrative structure works
- [ ] **3D surface visualisation** - the "wow screenshot" is valuable for media and reports but is a supplementary view. Add once the 2D landscape is validated
- [ ] **PCA projection** - useful for the researcher-depth layer but complex to explain. Add as the "depth" layer once the site structure is stable
- [ ] **Parallel coordinates plot** - high-dimensional view for the research-depth audience. Add with a desktop-only flag; defer mobile support

### Future Consideration (v2+)

- [ ] **Real sweep data swap** - the whole point of the fixture architecture; happens when llenergymeasure sweep data is available (separate milestone)
- [ ] **Configuration advisor / recommendation layer** - turns passive data into actionable recommendations. Requires real data and a knowledge base (separate milestone: recommendation engine)
- [ ] **Data commons / community submission** - `llem push` API, authentication, validation pipeline (explicitly out of scope for this milestone)
- [ ] **Embeddable mini-landscape widget** - the "Option E" labelling concept from product direction. Requires real data and stable methodology (separate milestone: labelling/embeddables)
- [ ] **What-if scenario explorer** - requires real data density across the parameter space to be meaningful (separate milestone: recommendation engine)
- [ ] **Smart alerts / watchlists** - requires user accounts and data commons (separate milestone)

---

## Feature Prioritisation Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Scrollytelling narrative structure | HIGH | MEDIUM | P1 |
| Configuration landscape (2D heatmap) | HIGH | HIGH | P1 |
| Animated power timeseries | HIGH | HIGH | P1 |
| Relatable energy equivalences | HIGH | LOW | P1 |
| Misconception-first hook + reveal | HIGH | LOW | P1 |
| Methodology transparency page | HIGH | LOW | P1 |
| Policy action layer | HIGH | MEDIUM | P1 |
| Responsive design | HIGH | HIGH | P1 |
| Chart download (PNG/SVG/CSV) | HIGH | LOW | P1 |
| "About the data" coverage statement | MEDIUM | LOW | P1 |
| Chart permalink + embed code | HIGH | LOW | P2 |
| Citation templates | MEDIUM | LOW | P2 |
| Participatory "guess" element | MEDIUM | MEDIUM | P2 |
| 3D surface visualisation | MEDIUM | HIGH | P2 |
| PCA projection | MEDIUM | HIGH | P2 |
| Parallel coordinates | LOW | MEDIUM | P2 |
| Configuration advisor | HIGH | HIGH | P3 |
| What-if scenario explorer | HIGH | HIGH | P3 |
| Real data swap | HIGH | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration (or different milestone)

---

## Competitor Feature Analysis

The three closest reference points for this site, mapped against planned features.

| Feature | Our World in Data | Gapminder | Climate Action Tracker | llem-commons approach |
|---------|------------------|-----------|------------------------|----------------------|
| Narrative structure | Layered topic pages, no scrollytelling | Misconception-first quiz, bubble chart | Report-style with thermometer metaphor | Scrollytelling (5 beats); combines Gapminder's misconception hook with OWID's choose-your-depth |
| Primary visualisation | Line charts, choropleth maps | Animated bubble chart (5 vars) | CAT thermometer + country pages | Configuration landscape (2D heatmap + 3D surface); novel in this space |
| Policy action layer | Implicit in editorial | Implicit in worldview framing | Country recommendations | Explicit section: regulation, deployment, procurement |
| Data download | Per-chart CSV, bulk dataset | Tool-based downloads | PDF-primary | Per-chart CSV/PNG/SVG, full dataset download |
| Embed | iframe embed code on every chart | Limited | None visible | iframe embed + permalink on every chart |
| Methodology | Linked from every chart | FAQ only | Methodology section | Linked from every chart + dedicated page explaining llenergymeasure |
| Citation support | CC BY, no templates | None | None | BibTeX + APA templates (v1.x) |
| Mobile | Fully responsive | Responsive | Limited | Mobile-first scrollytelling |
| Accessibility | Good (keyboard, alt text) | Limited | Limited | WCAG 2.2 baseline, colourblind-safe palettes, keyboard navigation |
| Timeseries power curves | Not applicable | Not applicable | Not applicable | Novel: animated inference power curves during scroll |
| Interactive equivalences | Yes (OWID does energy equivalences) | Dollar Street (photo-based) | Temperature framing | Inline equivalences on every energy figure |

---

## Sources

**Existing product research corpus** (all in `.product/research/`):
- `data-storytelling-viz.md` - Observable, Flourish, Datawrapper, The Pudding, Scrollama patterns
- `policy-data-communication.md` - OWID, Gapminder, CAT, IEA, Stanford AI Index, SDG Tracker
- `novel-product-patterns.md` - Calculators, Lighthouse, rtings.com, PCPartPicker, novel wild ideas
- `vision-gap-analysis.md` - 50 gaps across UX, architecture, data, governance

**Web search verification** (2026-03-20):
- GIJN Editor's Picks 2025 data journalism: [https://gijn.org/stories/2025-editors-picks-data-journalism/](https://gijn.org/stories/2025-editors-picks-data-journalism/)
- Reuters Institute Trends and Predictions 2026: [https://reutersinstitute.politics.ox.ac.uk/journalism-media-and-technology-trends-and-predictions-2026](https://reutersinstitute.politics.ox.ac.uk/journalism-media-and-technology-trends-and-predictions-2026)
- A11Y Collective accessible charts checklist: [https://www.a11y-collective.com/blog/accessible-charts/](https://www.a11y-collective.com/blog/accessible-charts/)
- WCAG 2.2 best practices 2025: [https://www.thewcag.com/best-practices](https://www.thewcag.com/best-practices)
- Harvard Digital Accessibility data viz guide: [https://accessibility.huit.harvard.edu/data-viz-charts-graphs](https://accessibility.huit.harvard.edu/data-viz-charts-graphs)
- Complete Scrollytelling Guide 2025: [https://ui-deploy.com/blog/complete-scrollytelling-guide-how-to-create-interactive-web-narratives-2025](https://ui-deploy.com/blog/complete-scrollytelling-guide-how-to-create-interactive-web-narratives-2025)
- The Pudding visual essay structure: [https://www.storybench.org/pudding-structures-stories-visual-essays/](https://www.storybench.org/pudding-structures-stories-visual-essays/)
- Our World in Data 2025 reach and features: [https://ourworldindata.org/top-of-the-charts-2025](https://ourworldindata.org/top-of-the-charts-2025)

**Reference platforms** (direct analysis):
- Our World in Data: https://ourworldindata.org
- Gapminder: https://www.gapminder.org
- Climate Action Tracker: https://climateactiontracker.org
- The Pudding: https://pudding.cool
- Stanford AI Index: https://hai.stanford.edu/ai-index

---
*Feature research for: narrative-driven policy data visualisation site (llem-commons policy layer)*
*Researched: 2026-03-20*
