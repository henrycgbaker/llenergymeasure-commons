"""Ingest real measurement data into the platform fixture format.

Reads manifest.json + result.json files from a study directory and produces
fixture-results.json with the generalised EffectiveConfig shape (common fields
plus a backend-specific ``dimensions`` map).

Usage:
    python scripts/ingest_results.py [--study-dir data/full-suite-*]

Output:
    platform/static/data/fixture-results.json
"""

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
DEFAULT_STUDY_GLOB = "data/full-suite-*"
OUTPUT_PATH = REPO_ROOT / "platform" / "static" / "data" / "fixture-results.json"

# Backend-specific dimension extraction rules.
# Each entry maps a backend key in effective_config to a list of
# (json_path, dimension_name) pairs.  json_path is dot-separated.
BACKEND_DIMENSIONS: dict[str, list[tuple[str, str]]] = {
    "pytorch": [
        ("pytorch.batch_size", "batch_size"),
        ("pytorch.attn_implementation", "attn_implementation"),
    ],
    "vllm": [
        ("vllm.engine.enforce_eager", "enforce_eager"),
        ("vllm.engine.enable_chunked_prefill", "enable_chunked_prefill"),
        ("vllm.engine.max_num_seqs", "max_num_seqs"),
    ],
    "tensorrt": [
        ("tensorrt.batch_size", "batch_size"),
    ],
}


def resolve_path(obj: dict, dotpath: str):
    """Walk a nested dict using a dot-separated path."""
    parts = dotpath.split(".")
    cur = obj
    for p in parts:
        if not isinstance(cur, dict):
            return None
        cur = cur.get(p)
        if cur is None:
            return None
    return cur


def extract_dimensions(effective_config: dict, backend: str) -> dict:
    """Extract backend-specific dimensions from the nested effective_config."""
    rules = BACKEND_DIMENSIONS.get(backend, [])
    dims: dict = {}
    for dotpath, dim_name in rules:
        val = resolve_path(effective_config, dotpath)
        if val is not None:
            dims[dim_name] = val
    return dims


def flatten_result(raw: dict) -> dict:
    """Convert a raw result.json into the platform fixture format."""
    ec = raw["effective_config"]
    backend = ec["backend"]

    flat_config = {
        "model": ec["model"],
        "backend": backend,
        "precision": ec["precision"],
        "n": ec["n"],
        "max_input_tokens": ec["max_input_tokens"],
        "max_output_tokens": ec["max_output_tokens"],
        "dimensions": extract_dimensions(ec, backend),
    }

    # Copy top-level fields, replacing effective_config with flattened version
    out = dict(raw)
    out["effective_config"] = flat_config
    # Drop fields that reference local paths or large blobs
    out.pop("timeseries", None)
    out.pop("environment_snapshot", None)
    out.pop("installed_packages", None)
    return out


def ingest_study(study_dir: Path) -> list[dict]:
    """Read a study manifest and return flattened results for completed experiments."""
    manifest_path = study_dir / "manifest.json"
    if not manifest_path.exists():
        print(f"  SKIP {study_dir} (no manifest.json)")
        return []

    manifest = json.loads(manifest_path.read_text())
    experiments = manifest.get("experiments", [])

    # De-duplicate: keep cycle 1 per config_hash
    seen_hashes: set[str] = set()
    records: list[dict] = []

    for exp in experiments:
        if exp.get("status") != "completed":
            continue
        config_hash = exp.get("config_hash", "")
        if config_hash in seen_hashes:
            continue
        seen_hashes.add(config_hash)

        result_file = exp.get("result_file")
        if not result_file:
            continue

        result_path = study_dir / result_file
        if not result_path.exists():
            print(f"  WARN missing {result_path}")
            continue

        raw = json.loads(result_path.read_text())
        records.append(flatten_result(raw))

    return records


def main() -> None:
    # Find study directories
    if len(sys.argv) > 1 and sys.argv[1] == "--study-dir":
        study_dirs = [Path(sys.argv[2])]
    else:
        study_dirs = sorted(REPO_ROOT.glob(DEFAULT_STUDY_GLOB))

    if not study_dirs:
        print(f"No study directories found matching {DEFAULT_STUDY_GLOB}")
        sys.exit(1)

    all_records: list[dict] = []
    for sd in study_dirs:
        print(f"Ingesting {sd.name}...")
        records = ingest_study(sd)
        all_records.extend(records)
        print(f"  {len(records)} experiments")

    if not all_records:
        print("No records ingested.")
        sys.exit(1)

    # Write output
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(all_records, indent=2, default=str))

    # Summary
    backends = {}
    for r in all_records:
        b = r["backend"]
        backends[b] = backends.get(b, 0) + 1

    energies = [r["avg_energy_per_token_j"] for r in all_records]
    worst = max(energies)
    best = min(energies)

    print(f"\nTotal records: {len(all_records)}")
    for b, count in sorted(backends.items()):
        print(f"  {b}: {count}")
    print(f"Energy range: {best:.4f} - {worst:.4f} J/token ({worst / best:.1f}x)")
    print(f"Output: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
