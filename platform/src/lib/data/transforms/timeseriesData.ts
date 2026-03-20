import type { PowerPoint } from '../types.js';

/**
 * Synthesises a realistic power curve from summary energy fields.
 *
 * Shape: 10% ramp up, 80% plateau (with deterministic noise), 10% ramp down.
 * The plateau power is calibrated so the area under the curve approximates totalEnergyJ.
 *
 * @param totalEnergyJ - Total energy consumed during inference (J)
 * @param totalTimeSec - Total wall-clock duration (s)
 * @param idlePowerW - GPU idle power in watts (default 60W for A100)
 * @param sampleHz - Samples per second (default 10)
 * @returns Array of { t: seconds, w: watts } data points
 */
export function synthesisePowerCurve(
	totalEnergyJ: number,
	totalTimeSec: number,
	idlePowerW: number = 60,
	sampleHz: number = 10
): PowerPoint[] {
	const totalSamples = Math.round(totalTimeSec * sampleHz);
	const dt = 1 / sampleHz;

	// Average power needed to account for totalEnergyJ over totalTimeSec
	const avgPowerW = totalEnergyJ / totalTimeSec;

	// Plateau power is calibrated to make the trapezoidal integral ≈ totalEnergyJ.
	// Since ramp phases average to ~half the plateau delta, we solve:
	//   (rampFraction * plateauDelta * 0.5 + (1 - rampFraction) * plateauDelta + idlePowerW) * totalTimeSec = totalEnergyJ
	// Simplifying: plateauDelta = (avgPowerW - idlePowerW) / (1 - rampFraction * 0.5)
	const rampFraction = 0.2; // 10% up + 10% down
	const plateauDelta = (avgPowerW - idlePowerW) / (1 - rampFraction * 0.5);
	const plateauPowerW = idlePowerW + plateauDelta;

	const rampUpEnd = Math.floor(totalSamples * 0.1);
	const rampDownStart = Math.floor(totalSamples * 0.9);

	const points: PowerPoint[] = [];

	for (let i = 0; i <= totalSamples; i++) {
		const t = i * dt;
		let w: number;

		if (i <= rampUpEnd) {
			// Ramp up: linear from idle to plateau
			const progress = rampUpEnd > 0 ? i / rampUpEnd : 1;
			w = idlePowerW + progress * (plateauPowerW - idlePowerW);
		} else if (i >= rampDownStart) {
			// Ramp down: linear from plateau back to idle
			const stepsLeft = totalSamples - rampDownStart;
			const progress = stepsLeft > 0 ? (i - rampDownStart) / stepsLeft : 1;
			w = plateauPowerW - progress * (plateauPowerW - idlePowerW);
		} else {
			// Plateau with deterministic noise (±5%)
			const noiseAmplitude = plateauPowerW * 0.05;
			// Deterministic: use sine wave at 0.3 Hz relative to sample index
			const noise = noiseAmplitude * Math.sin(i * 0.3);
			w = plateauPowerW + noise;
		}

		points.push({ t, w });
	}

	return points;
}
