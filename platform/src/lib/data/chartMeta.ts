export const CHART_SLUGS = [
	'heatmap',
	'timeseries',
	'surface',
	'pca',
	'parallel-coords'
] as const;

export type ChartSlug = (typeof CHART_SLUGS)[number];

export const CHART_META: Record<ChartSlug, { title: string; description: string; altText: string }> =
	{
		heatmap: {
			title: 'Configuration Energy Heatmap',
			description:
				'A heatmap showing energy consumption per token across all model configurations, coloured by efficiency ratio relative to the optimal configuration.',
			altText:
				'A grid of cells coloured on a blue-to-red diverging scale where deep blue cells are the most energy-efficient configurations and deep red cells are the most energy-wasteful. Each row represents a precision setting (fp32, bf16, int8) and each column represents a batch size (1, 4, 8, 32). The ratio shown in each cell compares that configuration\'s energy use to the optimal configuration, so a value of 8.3x in red means it consumes 8.3 times more energy per token than the best option.'
		},
		timeseries: {
			title: 'Power Draw Over Time',
			description:
				'Two overlapping line charts showing instantaneous power draw in watts over a 60-second inference window, comparing an efficient configuration against a wasteful one.',
			altText:
				'Two overlapping line charts plotted on a time axis from 0 to 60 seconds. The horizontal axis shows elapsed time in seconds and the vertical axis shows power draw in watts. A blue line traces the efficient configuration, which stabilises at a lower wattage plateau. A red line traces the wasteful configuration, which spikes higher during the same window. The area between the two lines illustrates the cumulative energy difference over a typical inference run.'
		},
		surface: {
			title: '3D Energy Surface',
			description:
				'A three-dimensional surface plot showing how energy per token varies across the joint space of precision settings and batch sizes.',
			altText:
				'A three-dimensional surface plot rendered in perspective view. The horizontal floor axes represent precision setting (fp32, bf16, int8) and batch size (1 through 32). The vertical axis shows energy consumption in joules per token. The surface is coloured with the same blue-to-red scale as the heatmap: valleys coloured blue mark low-energy configurations and peaks coloured red mark high-energy configurations. The shape reveals that small batch sizes and lower-precision settings form the deepest valley, confirming the efficiency advantage of batching and quantisation.'
		},
		pca: {
			title: 'PCA Configuration Projection',
			description:
				'A scatter plot projecting all model configurations into a two-dimensional principal component space, with point colour encoding energy efficiency.',
			altText:
				'A scatter plot showing each of the 24 model configurations as a dot projected onto the first two principal components (PC1 and PC2) derived from all configuration parameters. The horizontal axis is PC1, which captures the largest source of variance, and the vertical axis is PC2. Dot colour encodes energy per token on the same blue-to-red scale used across the platform, so blue dots are efficient configurations and red dots are wasteful ones. Spatial proximity indicates similar configuration profiles; clusters reveal that precision level dominates the separation along PC1 while batch size separates configurations along PC2.'
		},
		'parallel-coords': {
			title: 'Parallel Coordinates Explorer',
			description:
				'An interactive parallel coordinates chart showing all configuration dimensions simultaneously, allowing brushing to filter configurations by any combination of parameters.',
			altText:
				'A parallel coordinates chart with five vertical axes arranged left to right, representing: precision setting, batch size, attention implementation, energy per token in joules, and throughput in tokens per second. Each of the 24 model configurations is drawn as a polyline connecting its value on each axis. Lines are coloured on a blue-to-red scale by energy per token. Efficient configurations appear as blue lines that cross the energy axis low and the throughput axis high. Brushing any axis filters the visible lines to only configurations matching the selected range, enabling exploration of how configuration choices jointly affect efficiency.'
		}
	};
