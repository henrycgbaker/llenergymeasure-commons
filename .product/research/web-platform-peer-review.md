# Web Platform / Dashboard - Peer Review

Research into how peer tools handle web UI / visualisation components.
Conducted 2026-03-12.

## Peer Tool Analysis

| Tool | Web UI Location | Role | Tech Stack |
|------|----------------|------|------------|
| **MLflow** | Same repo (`mlflow/server/js/`) | Viewer - browse logged experiments | FastAPI + React/TS, ships in same pip package |
| **CodeCarbon** | Same repo, 3 separate deployables | Viewer - emissions dashboard | FastAPI backend + Next.js/React frontend |
| **Zeus** | No web UI | Library only, separate leaderboard repo | Leaderboard is a Gradio app on HF Spaces |
| **TensorBoard** | Separate repo from TensorFlow | Viewer - reads event files | Angular + TS, own pip package |
| **W&B** | Closed-source SaaS | Viewer - open SDK logs to proprietary dashboard | Client: Python + Go |
| **lm-eval-harness** | No web UI | Pure CLI/library | External tools visualise results |
| **Locust** | Same repo (`locust/webui/`) | Viewer + control | Flask + React/TS, bundled in pip package |
| **pytest-html** | Separate repo from pytest | Static HTML report generator | Jinja2 + JS |
| **Allure** | Multi-repo (adapters + generator) | Static HTML reports | Java generator + per-language adapters |

## Universal Pattern

**No tool uses the web UI to drive experiments.** The CLI/library runs things; the web UI views results.

The spectrum is:
1. **Pure viewer** (read-only): MLflow UI, TensorBoard, W&B dashboard
2. **Interactive viewer** (read + some control): Gradio/Streamlit apps
3. **No UI**: Zeus, lm-eval-harness

## Common Architectural Patterns

### Pattern A - Bundled in same package
- Examples: MLflow, Locust
- Web UI ships inside same pip package (optional extra)
- Launched via CLI subcommand (`mlflow ui`, `llem dashboard`)
- Frontend assets pre-built and included in Python distribution
- Backend: FastAPI or Flask serving static frontend + REST API

### Pattern B - Lightweight framework app
- Examples: ML.ENERGY Leaderboard (Gradio), many HF Spaces demos
- Small app using Gradio or Streamlit (10-200 lines)
- Ships as script or small module, not core package
- Lowest engineering effort for functional web UI
- Well-suited for "results viewer" use cases

### Pattern C - Separate package / repo
- Examples: TensorBoard (from TensorFlow), pytest-html (from pytest)
- Own pip package, independent versioning
- Communicates via files, APIs, or shared state
- Makes sense when dashboard is complex enough for own release cycle

### Pattern D - Hosted SaaS
- Examples: W&B, Neptune.ai
- Open-source client SDK, proprietary dashboard
- Not applicable for open-source self-contained tools

## Key Findings

1. **Viewer, not client** - every peer tool follows this pattern
2. **Same repo is normal** - MLflow, CodeCarbon, Locust all bundle the web UI
3. **Separate repo is for complex/independent products** - TensorBoard is its own project with its own team
4. **Gradio/Streamlit is the rapid path** - functional dashboard in days, not months
5. **FastAPI is the dominant modern backend** for bundled dashboards
6. **Pre-built static frontends** (React, Svelte) bundled into pip package are standard for production quality

## Relevance to llenergymeasure

- Results are already Pydantic models (`ExperimentResult`, `StudyResult`) that serialise to JSON
- Library-first architecture means the web component is a thin viewer layer
- "Separate repo, separate product" (original v4.0 plan) is likely over-engineered
- A bundled viewer (Pattern A) or Gradio/Streamlit app (Pattern B) fits better
- These aren't mutually exclusive - start with B, grow into A if needed
- A hosted public platform (Pattern C/D) could be extracted later if required
