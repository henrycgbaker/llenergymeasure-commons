import { describe, it, expect } from 'vitest';
import { synthesisePowerCurve } from '../timeseriesData.js';

describe('synthesisePowerCurve', () => {
	const totalEnergyJ = 500;
	const totalTimeSec = 10;

	it('returns PowerPoint[] with t and w fields', () => {
		const points = synthesisePowerCurve(totalEnergyJ, totalTimeSec);
		expect(points.length).toBeGreaterThan(0);
		for (const point of points) {
			expect(point).toHaveProperty('t');
			expect(point).toHaveProperty('w');
			expect(typeof point.t).toBe('number');
			expect(typeof point.w).toBe('number');
		}
	});

	it('first point starts near idle power (~60W)', () => {
		const idlePowerW = 60;
		const points = synthesisePowerCurve(totalEnergyJ, totalTimeSec, idlePowerW);
		// First point should be at or near idle
		expect(points[0].w).toBeCloseTo(idlePowerW, 0);
	});

	it('middle points are near plateau power', () => {
		const points = synthesisePowerCurve(totalEnergyJ, totalTimeSec);
		const midIndex = Math.floor(points.length / 2);
		const plateauPower = totalEnergyJ / totalTimeSec; // average power
		// Middle point should be in a reasonable range around plateau
		expect(points[midIndex].w).toBeGreaterThan(plateauPower * 0.8);
		expect(points[midIndex].w).toBeLessThan(plateauPower * 1.3);
	});

	it('last point returns near idle power', () => {
		const idlePowerW = 60;
		const points = synthesisePowerCurve(totalEnergyJ, totalTimeSec, idlePowerW);
		const lastPoint = points[points.length - 1];
		expect(lastPoint.w).toBeCloseTo(idlePowerW, 0);
	});

	it('total energy under curve approximately equals input totalEnergyJ (within 15% tolerance)', () => {
		const points = synthesisePowerCurve(totalEnergyJ, totalTimeSec);
		// Approximate integration using trapezoidal rule
		let areaUnderCurve = 0;
		for (let i = 1; i < points.length; i++) {
			const dt = points[i].t - points[i - 1].t;
			const avgW = (points[i].w + points[i - 1].w) / 2;
			areaUnderCurve += avgW * dt;
		}
		const tolerance = 0.15;
		expect(areaUnderCurve).toBeGreaterThan(totalEnergyJ * (1 - tolerance));
		expect(areaUnderCurve).toBeLessThan(totalEnergyJ * (1 + tolerance));
	});

	it('t values are monotonically increasing from 0', () => {
		const points = synthesisePowerCurve(totalEnergyJ, totalTimeSec);
		expect(points[0].t).toBe(0);
		for (let i = 1; i < points.length; i++) {
			expect(points[i].t).toBeGreaterThan(points[i - 1].t);
		}
	});

	it('respects custom sampleHz to control number of points', () => {
		const sampleHz = 5;
		const points = synthesisePowerCurve(totalEnergyJ, totalTimeSec, 60, sampleHz);
		// totalTimeSec * sampleHz = 50 intervals, so 51 points
		expect(points.length).toBe(totalTimeSec * sampleHz + 1);
	});
});
