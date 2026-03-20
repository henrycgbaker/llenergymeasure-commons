# Requirements: llem-commons Policy Communication Site

**Defined:** 2026-03-20
**Core Value:** Demonstrate convincingly to a policy audience that implementation factors - not model selection - are the primary lever for AI energy efficiency

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Narrative

- [ ] **NARR-01**: User experiences a scroll-driven 5-beat story (hook → reveal → exploration → depth → action)
- [ ] **NARR-02**: User sees misconception-first hook ("You're probably wrong about what drives AI energy consumption")
- [x] **NARR-03**: User sees the core reveal: same model, same GPU, 8x energy difference from config alone
- [ ] **NARR-04**: User can explore the configuration landscape interactively after the reveal
- [ ] **NARR-05**: User can access policy action section with regulation, deployment, and procurement sub-sections
- [ ] **NARR-06**: User can choose depth at each stage (headline → curated findings → explorer → raw data)

### Visualisation

- [x] **VIZ-01**: User sees a 2D topographic heatmap of the configuration landscape (axes = config params, colour = energy)
- [ ] **VIZ-02**: User can interact with heatmap (hover for details, zoom, select regions)
- [x] **VIZ-03**: User sees animated power timeseries comparing configurations side-by-side (e.g. fp32 vs fp16)
- [ ] **VIZ-04**: User can trigger and control timeseries animation (play/pause, scrub)
- [ ] **VIZ-05**: User sees a 3D surface visualisation (loss-landscape style) of the configuration space
- [ ] **VIZ-06**: User can rotate and zoom the 3D surface with mouse/touch
- [ ] **VIZ-07**: User sees a PCA-reduced 3D projection of all configuration dimensions
- [ ] **VIZ-08**: User sees a parallel coordinates plot showing high-dimensional relationships
- [ ] **VIZ-09**: User can brush-select ranges on parallel coordinates axes to filter data

### Data & Methodology

- [x] **DATA-01**: Site uses realistic fixture data matching the llenergymeasure ExperimentResult schema
- [x] **DATA-02**: Fixture data covers Llama models across 3 backends (PyTorch, vLLM, TensorRT) with configuration sweeps on A100
- [x] **DATA-03**: User can access a methodology page explaining how measurements are taken
- [ ] **DATA-04**: Every chart links to the methodology page via "How was this measured?"
- [x] **DATA-05**: User sees relatable energy equivalences alongside every energy figure
- [ ] **DATA-06**: User can download data per chart (CSV/JSON)
- [ ] **DATA-07**: User can download the full dataset
- [x] **DATA-08**: User sees an "About the data" coverage statement (what's measured, what's not, fixture data disclosure)

### Distribution

- [ ] **DIST-01**: Every chart has a stable permalink URL
- [ ] **DIST-02**: User can copy iframe embed code for any chart
- [ ] **DIST-03**: User can download any chart as PNG or SVG
- [ ] **DIST-04**: User can copy a BibTeX or APA citation for the platform and individual charts

### Design & Accessibility

- [ ] **DESG-01**: Site is responsive across desktop, tablet, and mobile
- [ ] **DESG-02**: Scrollytelling narrative works on touch devices
- [ ] **DESG-03**: All charts use colourblind-safe palettes (no red/green encoding)
- [ ] **DESG-04**: Every chart has descriptive alt text
- [ ] **DESG-05**: Interactive elements are keyboard-navigable

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
| NARR-01 | Phase 2 | Pending |
| NARR-02 | Phase 2 | Pending |
| NARR-03 | Phase 2 | Complete |
| NARR-04 | Phase 2 | Pending |
| NARR-05 | Phase 2 | Pending |
| NARR-06 | Phase 2 | Pending |
| VIZ-01 | Phase 2 | Complete |
| VIZ-02 | Phase 2 | Pending |
| VIZ-03 | Phase 2 | Complete |
| VIZ-04 | Phase 2 | Pending |
| VIZ-05 | Phase 3 | Pending |
| VIZ-06 | Phase 3 | Pending |
| VIZ-07 | Phase 3 | Pending |
| VIZ-08 | Phase 3 | Pending |
| VIZ-09 | Phase 3 | Pending |
| DATA-01 | Phase 1 | Pending |
| DATA-02 | Phase 1 | Pending |
| DATA-03 | Phase 1 | Complete |
| DATA-04 | Phase 2 | Pending |
| DATA-05 | Phase 2 | Complete |
| DATA-06 | Phase 3 | Pending |
| DATA-07 | Phase 3 | Pending |
| DATA-08 | Phase 1 | Complete |
| DIST-01 | Phase 4 | Pending |
| DIST-02 | Phase 4 | Pending |
| DIST-03 | Phase 4 | Pending |
| DIST-04 | Phase 4 | Pending |
| DESG-01 | Phase 2 | Pending |
| DESG-02 | Phase 2 | Pending |
| DESG-03 | Phase 4 | Pending |
| DESG-04 | Phase 4 | Pending |
| DESG-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32
- Unmapped: 0

---
*Requirements defined: 2026-03-20*
*Last updated: 2026-03-20 after roadmap creation*
