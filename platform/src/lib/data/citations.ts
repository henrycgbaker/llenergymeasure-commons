const datasetHash: string = (import.meta.env.VITE_DATASET_HASH as string | undefined) ?? 'dev';
const siteUrl: string =
	(import.meta.env.VITE_SITE_URL as string | undefined) ??
	'https://llem-commons.hertie-school.org';

export const PLATFORM_APA =
	`Baker, H. (2026). llem-commons: AI Energy Efficiency Configuration Landscape. ` +
	`Hertie School. ${siteUrl}`;

export const PLATFORM_BIBTEX =
	`@misc{llem_commons_2026,\n` +
	`  author       = {Baker, Henry},\n` +
	`  title        = {llem-commons: AI Energy Efficiency Configuration Landscape},\n` +
	`  year         = {2026},\n` +
	`  institution  = {Hertie School},\n` +
	`  url          = {${siteUrl}}\n` +
	`}`;

export function chartApa(title: string, slug: string): string {
	const url = `${siteUrl}/chart/${slug}`;
	return (
		`Baker, H. (2026). ${title} [Chart, dataset v.${datasetHash}]. ` +
		`In llem-commons. Hertie School. ${url}`
	);
}

export function chartBibtex(title: string, slug: string): string {
	const key = `llem_${slug.replace(/-/g, '_')}_2026`;
	const url = `${siteUrl}/chart/${slug}`;
	return (
		`@misc{${key},\n` +
		`  author       = {Baker, Henry},\n` +
		`  title        = {${title} [Chart, dataset v.${datasetHash}]},\n` +
		`  year         = {2026},\n` +
		`  institution  = {Hertie School},\n` +
		`  url          = {${url}},\n` +
		`  note         = {In llem-commons}\n` +
		`}`
	);
}
