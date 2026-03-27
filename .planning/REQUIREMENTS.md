# Requirements: llem-commons Policy Communication Site

**Defined:** 2026-03-20
**Core Value:** Demonstrate convincingly to a policy audience that implementation factors - not model selection - are the primary lever for AI energy efficiency

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Narrative

- [ ] **NARR-01**: User experiences a scroll-driven 5-beat story (hook → reveal → exploration → depth → action)
- [x] **NARR-02**: User sees misconception-first hook ("You're probably wrong about what drives AI energy consumption")
- [ ] **NARR-03**: User sees the core reveal: same model, same GPU, 8x energy difference from config alone
- [x] **NARR-04**: User can explore the configuration landscape interactively after the reveal
- [ ] **NARR-05**: User can access policy action section with regulation, deployment, and procurement sub-sections
- [x] **NARR-06**: User can choose depth at each stage (headline → curated findings → explorer → raw data)

### Visualisation

- [x] **VIZ-01**: User sees a 2D topographic heatmap of the configuration landscape (axes = config params, colour = energy)
- [x] **VIZ-02**: User can interact with heatmap (hover for details, zoom, select regions)
- [x] **VIZ-03**: User sees animated power timeseries comparing configurations side-by-side (e.g. fp32 vs fp16)
- [x] **VIZ-04**: User can trigger and control timeseries animation (play/pause, scrub)
- [x] **VIZ-05**: User sees a 3D surface visualisation (loss-landscape style) of the configuration space
- [x] **VIZ-06**: User can rotate and zoom the 3D surface with mouse/touch
- [x] **VIZ-07**: User sees a PCA-reduced 3D projection of all configuration dimensions
- [x] **VIZ-08**: User sees a parallel coordinates plot showing high-dimensional relationships
- [x] **VIZ-09**: User can brush-select ranges on parallel coordinates axes to filter data

### Data & Methodology

- [ ] **DATA-01**: Site uses realistic fixture data matching the llenergymeasure ExperimentResult schema
- [ ] **DATA-02**: Fixture data covers Qwen/Qwen2.5-0.5B across 2 backends (PyTorch, vLLM) with configuration sweeps on A100-PCIE-40GB
- [x] **DATA-03**: User can access a methodology page explaining how measurements are taken
- [x] **DATA-04**: Every chart links to the methodology page via "How was this measured?"
- [x] **DATA-05**: User sees relatable energy equivalences alongside every energy figure
- [x] **DATA-06**: User can download data per chart (CSV/JSON)
- [x] **DATA-07**: User can download the full dataset
- [ ] **DATA-08**: User sees an "About the data" coverage statement (what's measured, what's not, fixture data disclosure)

### Distribution

- [x] **DIST-01**: Every chart has a stable permalink URL
- [x] **DIST-02**: User can copy iframe embed code for any chart
- [x] **DIST-03**: User can download any chart as PNG or SVG
- [x] **DIST-04**: User can copy a BibTeX or APA citation for the platform and individual charts

### Design & Accessibility

- [x] **DESG-01**: Site is responsive across desktop, tablet, and mobile
- [x] **DESG-02**: Scrollytelling narrative works on touch devices
- [x] **DESG-03**: All charts use colourblind-safe palettes (no red/green encoding)
- [x] **DESG-04**: Every chart has descriptive alt text
- [x] **DESG-05**: Interactive elements are keyboard-navigable

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Engagement

- **ENGR-01**: User can participate in "guess the difference" element before the reveal

### Data Commons

- **DCOM-01**: Researchers can submit measurements via `llem push`
- **DCOM-02**: Submissions go through a validation pipeline

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Single energy grade/score per model | Contradicts the "it depends on implementation" USP |
| Live data dashboard | Requires server infrastructure; static narrative is the product |
| Model comparison leaderboard | AI Energy Score and ML.ENERGY already do this |
| User accounts / authentication | Not needed until data commons milestone |
| Real sweep data generation | Separate Phase 0 effort |
| Configuration advisor / recommendations | Requires real data density |
| Embeddable mini-landscape widget | Future labelling/embeddables milestone |
| Carbon offsetting framing | Shifts focus from "reduce consumption" message |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| NARR-01 | Phase 5 | Pending |
| NARR-02 | Phase 2 | Complete |
| NARR-03 | Phase 5 | Pending |
| NARR-04 | Phase 2 | Complete |
| NARR-05 | Phase 5 | Pending |
| NARR-06 | Phase 2 | Complete |
| VIZ-01 | Phase 2 | Complete |
| VIZ-02 | Phase 2 | Complete |
| VIZ-03 | Phase 2 | Complete |
| VIZ-04 | Phase 6 | Complete |
| VIZ-05 | Phase 3 | Complete |
| VIZ-06 | Phase 3 | Complete |
| VIZ-07 | Phase 3 | Complete |
| VIZ-08 | Phase 3 | Complete |
| VIZ-09 | Phase 3 | Complete |
| DATA-01 | Phase 5 | Pending |
| DATA-02 | Phase 5 | Pending |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 2 | Complete |
| DATA-05 | Phase 2 | Complete |
| DATA-06 | Phase 3 | Complete |
| DATA-07 | Phase 3 | Complete |
| DATA-08 | Phase 5 | Pending |
| DIST-01 | Phase 4 | Complete |
| DIST-02 | Phase 4 | Complete |
| DIST-03 | Phase 6 | Complete |
| DIST-04 | Phase 4 | Complete |
| DESG-01 | Phase 2 | Complete |
| DESG-02 | Phase 2 | Complete |
| DESG-03 | Phase 4 | Complete |
| DESG-04 | Phase 4 | Complete |
| DESG-05 | Phase 4 | Complete |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0
- Pending (gap closure): 8

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-27 after milestone audit gap closure*
