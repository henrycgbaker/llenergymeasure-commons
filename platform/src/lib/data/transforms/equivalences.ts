/** A100 GPU at ~12 Wh per full smartphone charge */
const SMARTPHONE_FULL_CHARGE_J = 12 * 3600; // 43,200 J

/**
 * Converts J/token energy efficiency to smartphone charges
 * at deployment scale.
 *
 * @param energyJPerToken - Average energy in joules per token
 * @param tokensPerQuery - Average output tokens per query (default 128)
 * @param queriesPerMonth - Monthly query volume (default 10,000,000)
 * @returns Number of smartphone full charges equivalent to that monthly energy
 */
export function smartphoneCharges(
	energyJPerToken: number,
	tokensPerQuery: number = 128,
	queriesPerMonth: number = 10_000_000
): number {
	const totalEnergyJ = energyJPerToken * tokensPerQuery * queriesPerMonth;
	return Math.round(totalEnergyJ / SMARTPHONE_FULL_CHARGE_J);
}

/**
 * Formats a smartphone charge count as a human-readable equivalence string.
 *
 * @param charges - Number of smartphone charges
 * @returns Human-readable string, e.g. "charging 528 smartphones"
 */
export function formatEquivalence(charges: number): string {
	return `charging ${charges.toLocaleString()} smartphones`;
}
