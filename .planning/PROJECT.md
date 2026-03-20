# llem-commons: Policy Communication Site

## What This Is

A visually compelling, narrative-driven web platform presenting evidence that AI energy consumption varies dramatically based on implementation choices - not model choice. The site tells the story that the same model on the same hardware can draw 2-10x different energy depending on precision, batch size, backend, attention implementation, and quantisation. Built as a working prototype with realistic fixture data, aimed at policy audiences, ready to swap in real measurement data from llenergymeasure sweeps.

## Core Value

Demonstrate convincingly to a policy audience that implementation factors - not model selection - are the primary lever for AI energy efficiency, and that this has direct implications for regulation, deployment guidance, and procurement.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

(None yet - ship to validate)

### Active

<!-- Current scope. Building toward these. -->

- [ ] Narrative story structure (misconception-first, choose-your-depth: hook, reveal, exploration, depth, action)
- [ ] Configuration landscape visualisation (topographic/heatmap view - 2D axes, colour = energy, contour lines)
- [ ] 3D surface visualisation (loss landscape style - the "wow" screenshot for reports/media)
- [ ] PCA-reduced 3D projection (all configuration dimensions visualised)
- [ ] Parallel coordinates plot (high-dimensional relationships)
- [ ] Interactive power timeseries (animated power curves during inference, side-by-side comparisons)
- [ ] Realistic fixture data matching the llenergymeasure ExperimentResult schema (Llama models, 3 backends, configuration sweeps on A100)
- [ ] Policy action layer ("what this means for regulation, deployment, procurement")
- [ ] Raw data/methodology access layer (downloadable datasets for researcher depth)
- [ ] Responsive, polished visual design suitable for non-technical policy audience
- [ ] Deployable to free/cheap hosting or self-hosted on lab GPU server

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Real sweep data generation (Phase 0) - separate from site build, data plugged in later
- Data commons / community contributions / `llem push` API - future milestone
- Authentication / API keys / ORCID - not needed until community contributions
- CI/CD integration / GitHub Action - separate project/milestone
- Embeddable widgets / badges / Shields.io - future milestone
- Recommendation engine / configuration advisor - future milestone
- Carbon intensity integration (Electricity Maps) - future milestone
- "State of Green AI" report / pledge / certification - future milestone
- Mobile app - web-first

## Context

**llenergymeasure** (CLI: `llem`) is an existing Python tool that measures LLM inference energy consumption across PyTorch, vLLM, and TensorRT-LLM backends. It produces structured JSON results (`ExperimentResult`) with optional Parquet power timeseries sidecars. The data model is rich: energy metrics, performance metrics, compute metrics, environment snapshots, thermal data, and full configuration capture. Every experiment has a `measurement_config_hash` for deduplication and a consistent schema with null-safe fields.

The platform (llem-commons) is the companion to this CLI - it answers "how green is YOUR specific deployment, and how could it be greener?" This is complementary to AI Energy Score (model ranking on standardised hardware) and ML.ENERGY (research-grade Pareto frontiers). Nobody else owns the full pipeline from `pip install` to measurement to visualisation to policy insights.

The fixture data for the prototype should be shaped like real `ExperimentResult` objects: Llama models across all 3 backends with configuration sweeps varying precision (fp32/fp16/bf16), batch size, attention implementation, quantisation, and backend-specific parameters. The data should demonstrate the core claim convincingly - same model, same GPU, 8x energy difference from config alone.

**Existing research**: 12 research documents in `.product/research/` covering energy/climate platforms, policy data communication, crowdsourced science, developer hubs, leaderboards, badges/embeddables, CI/CD workflows, data storytelling, and novel product patterns (~465KB, 80+ platforms analysed). Product direction agreed in `.product/PRODUCT-DIRECTION.md`.

**Architecture direction**: API-centred design where the policy site is one consumer. Two audiences (researcher / policy) will likely become two separate frontends sharing one API. For this milestone, only the policy-facing site is in scope.

**Visualisation approach**: Ship all four visualisation types (topographic, 3D surface, PCA projection, parallel coordinates), see what works with real data, edit later. The interactive power timeseries is separately compelling - animated power curves are viscerally understandable.

## Constraints

- **Hosting**: Free/cheap hosting (GitHub Pages, Netlify free tier) or self-hosted on lab GPU server. No paid cloud services.
- **Data**: No real sweep data exists yet. Build with realistic fixture data matching the ExperimentResult schema. Site must be data-ready - easy to swap fixtures for real measurements.
- **Audience**: Policy people see this first. Must feel polished and self-explanatory even at prototype stage. Non-technical users must understand the story without guidance.
- **Tech stack**: Open - research should inform. Options include static generation (Astro, SvelteKit, Next.js) vs server-rendered, and potentially a split between static narrative + interactive explorer. Python-based options (Streamlit/Dash) not excluded but may limit polish.
- **Scope**: Working prototype. Rough engineering edges OK, but the user-facing experience must feel professional.

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Implementation factors as USP (not model ranking) | Complementary to AI Energy Score / ML.ENERGY, more actionable for deployment | - Pending |
| Backend treated as implementation detail | Simplifies framing: "one model, one GPU, many choices, massive differences" | - Pending |
| Launch with curated fixture data | Our World in Data playbook: editorial authority first, data density second | - Pending |
| Ship all 4 viz approaches | Design in the browser, not in the abstract - see what works with data | - Pending |
| Policy site first (not researcher explorer) | High impact, establishes credibility, tells the story | - Pending |
| Mini landscape as future embeddable (not letter grade) | Single grade contradicts the "it depends" USP | - Pending |
| Narrative + interactive split (one site vs two) | Open - let research inform | - Pending |
| Tech stack | Open - let research inform | - Pending |

---
*Last updated: 2026-03-20 after initialization*
