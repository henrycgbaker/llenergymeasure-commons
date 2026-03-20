"""Fixture data generator for llem-commons.

Produces ~180 ExperimentResult-shaped JSON records with realistic energy values
for Llama 3 8B on A100 80GB. Every record is validated against the live
llenergymeasure ExperimentResult Pydantic schema before writing.

Usage:
    pip install -r scripts/requirements-dev.txt
    python scripts/generate_fixtures.py

Energy model:
    energy_per_token = BASE * precision_factor * batch_factor * backend_factor * attention_factor

Calibrated so that:
    - Worst case (fp32, batch=1, pytorch, eager):    ~0.016 J/token
    - Best case  (int8, batch=128, tensorrt, flash2): ~0.002 J/token
    - Ratio: ~8x
"""

import hashlib
import json
import random
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from llenergymeasure.domain.experiment import ExperimentResult

# ---------------------------------------------------------------------------
# Configuration dimensions
# ---------------------------------------------------------------------------

# Precision strings as stored in effective_config. int8 uses bf16 compute
# but load_in_8bit=True, so we track it separately as a config variant.
PRECISIONS = ["fp32", "fp16", "bf16", "int8"]
BATCH_SIZES = [1, 8, 32, 64, 128]
BACKENDS = ["pytorch", "vllm", "tensorrt"]
ATTENTIONS = ["eager", "sdpa", "flash_attention_2"]

MODEL_ID = "meta-llama/Meta-Llama-3-8B-Instruct"

# ---------------------------------------------------------------------------
# Energy model factors
# ---------------------------------------------------------------------------
# Base energy at bf16/batch=32/vllm/sdpa (mid-range reference point)
BASE_ENERGY_J_PER_TOKEN = 0.0052  # J/token

# Factors are calibrated so that the worst/best combined ratio is ~8x:
#   worst (fp32, batch=1, pytorch, eager):     ~0.0176 J/token
#   best  (int8, batch=128, tensorrt, flash2): ~0.0022 J/token
#   ratio: ~8x
#
# Combined worst factor: 1.6 * 1.6 * 1.2 * 1.1 = 3.38
# Combined best factor:  0.7 * 0.8 * 0.85 * 0.90 = 0.43
# Ratio: 3.38 / 0.43 ≈ 7.9x

# Lower precision = less energy
PRECISION_FACTOR = {
    "fp32": 1.60,
    "fp16": 1.00,
    "bf16": 1.00,
    "int8": 0.70,
}

# Higher batch = lower energy per token (amortised overhead)
BATCH_FACTOR = {
    1: 1.60,
    8: 1.20,
    32: 1.00,
    64: 0.90,
    128: 0.80,
}

# TensorRT < vLLM < PyTorch (kernel efficiency)
BACKEND_FACTOR = {
    "pytorch": 1.20,
    "vllm": 1.00,
    "tensorrt": 0.85,
}

# Attention efficiency: flash_attention_2 < sdpa < eager
ATTENTION_FACTOR = {
    "eager": 1.10,
    "sdpa": 1.00,
    "flash_attention_2": 0.90,
}

# Random seed for reproducibility
random.seed(42)


def deterministic_config_hash(precision: str, batch_size: int, backend: str, attention: str) -> str:
    """Deterministic SHA-256[:16] from config combination."""
    key = f"{precision}:{batch_size}:{backend}:{attention}"
    return hashlib.sha256(key.encode()).hexdigest()[:16]


def make_experiment(precision: str, batch_size: int, backend: str, attention: str) -> dict:
    """Build a single ExperimentResult-shaped dict, validate against schema, return as dict."""
    # Compute energy with small random jitter (+/- 5%)
    jitter = 1.0 + random.uniform(-0.05, 0.05)
    energy_per_token = (
        BASE_ENERGY_J_PER_TOKEN
        * PRECISION_FACTOR[precision]
        * BATCH_FACTOR[batch_size]
        * BACKEND_FACTOR[backend]
        * ATTENTION_FACTOR[attention]
        * jitter
    )

    # Simulate 100 prompts at 128 output tokens each
    n_prompts = 100
    output_tokens_per_prompt = 128
    input_tokens_per_prompt = 512
    total_output_tokens = n_prompts * output_tokens_per_prompt * batch_size
    total_input_tokens = n_prompts * input_tokens_per_prompt
    total_tokens = total_output_tokens + total_input_tokens

    total_energy_j = energy_per_token * total_tokens

    # Approximate throughput: higher batch = better tokens/sec
    # Base throughput at batch=1 pytorch fp16: ~50 tok/s; scales with batch
    base_throughput = 50.0  # tokens/sec at batch=1, fp16, pytorch
    throughput_jitter = 1.0 + random.uniform(-0.03, 0.03)
    throughput_scale = (batch_size ** 0.6) * (1.0 / PRECISION_FACTOR[precision]) * (
        1.0 / BACKEND_FACTOR[backend]
    )
    avg_tokens_per_second = base_throughput * throughput_scale * throughput_jitter

    total_inference_time_sec = total_tokens / avg_tokens_per_second

    # Timestamps (fictional but valid datetimes)
    start_time = datetime(2025, 11, 1, 12, 0, 0, tzinfo=timezone.utc)
    end_time = start_time + timedelta(seconds=total_inference_time_sec)

    # Build effective_config dict (mirrors ExperimentConfig fields used by site)
    effective_config: dict = {
        "model": MODEL_ID,
        "backend": backend,
        "precision": "bf16" if precision == "int8" else precision,  # compute dtype
        "batch_size": batch_size,
        "attn_implementation": attention,
        "load_in_8bit": precision == "int8",
        "n": n_prompts,
        "max_input_tokens": input_tokens_per_prompt,
        "max_output_tokens": output_tokens_per_prompt,
    }

    data = {
        "schema_version": "2.0",
        "experiment_id": str(uuid.uuid4()),
        "measurement_config_hash": deterministic_config_hash(precision, batch_size, backend, attention),
        "backend": backend,
        "backend_version": None,
        "measurement_methodology": "total",
        "steady_state_window": None,
        "total_tokens": total_tokens,
        "total_energy_j": total_energy_j,
        "total_inference_time_sec": total_inference_time_sec,
        "avg_tokens_per_second": avg_tokens_per_second,
        "avg_energy_per_token_j": energy_per_token,
        "total_flops": 0.0,
        "flops_per_output_token": None,
        "flops_per_input_token": None,
        "flops_per_second": None,
        "baseline_power_w": None,
        "energy_adjusted_j": None,
        "energy_per_device_j": None,
        "energy_breakdown": None,
        "multi_gpu": None,
        "environment_snapshot": None,
        "measurement_warnings": [],
        "warmup_excluded_samples": None,
        "reproducibility_notes": "Fixture data - not from real measurements",
        "timeseries": None,
        "start_time": start_time,
        "end_time": end_time,
        "effective_config": effective_config,
        "process_results": [],
        "aggregation": None,
        "thermal_throttle": None,
        "warmup_result": None,
        "latency_stats": None,
        "extended_metrics": None,
    }

    # Validate against live schema - raises ValidationError if wrong shape
    ExperimentResult.model_validate(data)

    # Serialise datetimes to strings for JSON output
    data["start_time"] = start_time.isoformat()
    data["end_time"] = end_time.isoformat()
    return data


def main() -> None:
    records = []
    for precision in PRECISIONS:
        for batch_size in BATCH_SIZES:
            for backend in BACKENDS:
                for attention in ATTENTIONS:
                    records.append(make_experiment(precision, batch_size, backend, attention))

    # Verify ratio
    energies = [r["avg_energy_per_token_j"] for r in records]
    worst = max(energies)
    best = min(energies)
    ratio = worst / best

    # Write output
    out_dir = Path(__file__).parent.parent / "platform" / "static" / "data"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "fixture-results.json"
    out_path.write_text(json.dumps(records, indent=2, default=str))

    print(f"Records written: {len(records)}")
    print(f"Output path:     {out_path}")
    print(f"Worst config:    {worst:.5f} J/token")
    print(f"Best config:     {best:.5f} J/token")
    print(f"Ratio:           {ratio:.1f}x")
    print()

    # Verify directional trends by inspection
    print("Directional checks:")
    for prec in PRECISIONS:
        avg = sum(
            r["avg_energy_per_token_j"] for r in records if r["effective_config"]["load_in_8bit"] == (prec == "int8") and
            (r["effective_config"]["precision"] == prec or prec == "int8")
        ) / (len(BATCH_SIZES) * len(BACKENDS) * len(ATTENTIONS))
        print(f"  precision={prec:4s}: avg {avg:.5f} J/token")
    for b in BATCH_SIZES:
        avg = sum(r["avg_energy_per_token_j"] for r in records if r["effective_config"]["batch_size"] == b) / (
            len(PRECISIONS) * len(BACKENDS) * len(ATTENTIONS)
        )
        print(f"  batch={b:3d}:       avg {avg:.5f} J/token")
    for bk in BACKENDS:
        avg = sum(r["avg_energy_per_token_j"] for r in records if r["backend"] == bk) / (
            len(PRECISIONS) * len(BATCH_SIZES) * len(ATTENTIONS)
        )
        print(f"  backend={bk:9s}: avg {avg:.5f} J/token")


if __name__ == "__main__":
    main()
