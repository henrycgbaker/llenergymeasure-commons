# Web Platform Vision - Product Research

Status: ACTIVE (2026-03-19)
Repo strategy decided: Layer 1 stays in llenergymeasure, Layers 2-3 live here (llem-commons).

## Three-Layer Architecture

### Layer 1: Local Dashboard (researcher tool)

- Ships with the llenergymeasure package as optional extra
- Runs locally after experiments: `llem dashboard ./results/`
- Explore your own results interactively (charts, comparisons, drill-down)
- Tech: Gradio or Streamlit (TBD)
- Installs via: `pip install llenergymeasure[dashboard]`
- Precedents: TensorBoard, MLflow UI

### Layer 2: Shared Data Platform (open science)

- Hosted service with a shared database
- Researchers push local results to a shared pool (opt-in)
- Crowdsourced energy efficiency data across hardware, models, configs, backends
- Upload mechanism: CLI integration (`llem push`?) or opt-in after experiments
- Includes a UI to explore/filter/query the raw shared data
- Precedents: OpenML, Hugging Face Hub, Papers With Code

### Layer 3: Public Insights Website (policy / public)

- Curated views and narrative analysis over the shared data (Layer 2)
- Designed for non-technical audience (policy makers, journalists, public)
- Core narrative: implementation decisions (precision, backend, batch size) matter
  for energy efficiency, not just model selection
- Mix of automated views over Layer 2 data AND editorial curation / analysis pages
- Interactive visualisations designed for accessibility and impact
- Precedents: AI Energy Score website, Our World in Data, Climate TRACE

## Relationship Between Layers

```
Researcher                         Policy Maker / Public
    |                                       |
    v                                       v
[Layer 1: Local Dashboard]     [Layer 3: Public Insights Website]
    |                                       |
    | llem push (opt-in)                    | reads from
    v                                       v
            [Layer 2: Shared Database]
            crowdsourced experiment results
```

- Layers 2 and 3 share a database but serve different audiences with different UIs
- Researchers see tables, filters, raw data
- Policy makers see narratives, comparisons, headline figures

## Open Questions

### Data model (Layer 2)
- What subset of `StudyResult` / `ExperimentResult` is shared?
- Privacy: model names, hardware details, org-identifying info - scrubbing or opt-in?
- Schema versioning: how to handle result format changes across llenergymeasure versions?
- Data quality: any validation or minimum requirements for contributed results?

### Curation vs automation (Layer 3)
- Confirmed: both automated views AND editorial curation
- Who writes the narrative / analysis content?
- How often are insights updated vs manually curated?

### Hosting and governance
- Initial: personally hosted by Henry
- Potential: move under data science lab at Hertie School once there's something to show
- Trust matters for policy audience - institutional backing adds credibility

### Repo strategy - DECIDED (2026-03-19)
- **Layer 1** (local dashboard): stays in `llenergymeasure` repo as optional extra (`pip install llenergymeasure[dashboard]`)
- **Layers 2-3** (shared platform + public insights): this repo (`llem-commons`)
- Imports `llenergymeasure` as a dependency for Pydantic models / result schemas
- `llem push` client code lives in `llenergymeasure`; the API receiving pushes lives here

### Timeline
- Layer 1: could ship in next 1-2 milestones alongside CLI work
- Layers 2-3: substantially bigger project, timeline TBD
- Layer 1 is useful independently and validates whether interactive results viewing is wanted

## Technical Notes

- Library-first architecture already supports this: ExperimentResult and StudyResult are
  Pydantic models that serialise to JSON trivially
- Results are already persisted as structured data (Parquet/JSON)
- Any dashboard layer is a rendering layer over existing schemas
- The hard part (measurement, reproducibility, result persistence) is already done

## Peer Tool Research

See: `.product/research/web-platform-peer-review.md`
