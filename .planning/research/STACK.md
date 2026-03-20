# Stack Research

**Domain:** Narrative-driven, interactive data visualisation site for policy audiences
**Researched:** 2026-03-20
**Confidence:** HIGH (core framework), MEDIUM (visualisation libraries), HIGH (hosting)

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| SvelteKit | 2.55.0 | Full-stack framework + static site generator | Proven by The Pudding (world's best data storytelling). Compiles to zero-runtime vanilla JS. Built-in transitions and animations pair naturally with scroll-driven narratives. D3 integration is idiomatic - Svelte's imperative-friendly DOM model doesn't fight D3 like React does. adapter-static for GitHub Pages/Cloudflare Pages. |
| Svelte | 5.54.0 | UI component language | Runes-based reactivity (Svelte 5) is simpler for complex visualisation state than class components. Built-in `{#each}`, `{#if}`, reactive declarations, and `svelte/transition` reduce boilerplate for animated charts. |
| Vite | 6.x (via SvelteKit) | Build tool | Bundled with SvelteKit. HMR makes development with complex visualisations fast. Tree-shaking keeps bundle sizes small. |
| TypeScript | 5.x (via SvelteKit) | Type safety | Enforces data shapes from ExperimentResult schema. Prevents runtime errors when wiring JSON fixtures to chart components. Include from day one - retrofitting is painful. |
| Tailwind CSS | 4.x | Styling | v4 installs as a Vite plugin - no PostCSS config required. `@tailwindcss/vite` plugin. Svelte CLI now scaffolds it by default. Use for layout, typography, spacing. Do NOT use for chart colours - define those in a separate design token file. |

### Visualisation Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| D3.js | 7.9.0 | Topographic/contour maps, animated timeseries, custom layouts | Use D3 for: (a) the topographic heatmap (d3-contour + d3-color for continuous colour scales), (b) animated power timeseries (d3-scale, d3-axis, d3-transition), (c) any bespoke layout that Plotly/Plot cannot express. D3's `d3-contour` module handles the configuration landscape's contour lines natively. |
| Observable Plot | 0.6.17 | Exploratory charts, parallel coordinates (2D projections), quick faceted views | Use Plot for: charts that need to be stood up quickly with good defaults, small multiples, faceted comparisons. Plot's `contour` mark works for 2D topographic views. NOT suitable for 3D surfaces - use Plotly for that. |
| Plotly.js | 3.4.0 (use `plotly.js-dist-min`) | 3D surface plots, parallel coordinates | Use Plotly for: (a) the 3D surface visualisation ("loss landscape" style) - `surface` trace type handles this natively with x/y/z arrays, (b) parallel coordinates (`parcoords` trace) - interactive brushing built in. Plotly's 3D is WebGL-accelerated via WebGL. SvelteKit wrapper available (`@a.../svelte-plotly-d`). |
| GSAP | 3.x (now fully free) | Scroll-driven narrative transitions, chart morphing animations | Use GSAP ScrollTrigger for the scrollytelling narrative layer. Webflow acquired GSAP and made ALL plugins (including ScrollTrigger, previously paid) free as of April 2025. Use for: sticky graphic panels, chart transitions between scroll steps, animated reveals. More powerful than Scrollama for complex timeline sequences. |
| Scrollama | 3.2.0 | Simple step-based scroll triggers | Alternative to GSAP for simpler scroll step detection. Lightweight (~2KB). Good if you only need "trigger on scroll step X" without complex animation timelines. Pick ONE: GSAP ScrollTrigger if animations are complex; Scrollama if you just need step callbacks wired to manual Svelte transitions. |

### Data Layer

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @duckdb/duckdb-wasm | ~1.29.x (use latest stable, not dev) | Client-side SQL over Parquet/JSON data | Load pre-built Parquet snapshots of ExperimentResult fixture data at page start; run SQL aggregations in the browser for interactive filtering (batch size vs energy comparisons, etc.) with zero server costs. Essential for the interactive explorer section. |
| Apache Arrow (via DuckDB-WASM) | bundled | Columnar data transfer | DuckDB-WASM speaks Arrow fluently; no separate install needed. Use Arrow result sets for fast chart updates. |
| papaparse | 5.x | CSV parsing | If you ship data as CSV instead of/alongside Parquet. Lightweight fallback if DuckDB-WASM is overkill for simple fixture data. Only use if the data access patterns don't need SQL. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `sv create` (Svelte CLI) | Project scaffolding | Use this to create the SvelteKit project - it now scaffolds Svelte 5 + Tailwind v4 by default. Run `npx sv create llem-site`. |
| adapter-static | SvelteKit static output | `@sveltejs/adapter-static` prebuilds all pages to HTML/JS/CSS. Required for GitHub Pages / Cloudflare Pages deployment. Set `prerender = true` in `+layout.ts`. |
| Vite Preview | Local static preview | `vite preview` serves the static build locally before deploying. Essential for catching routing issues. |
| shadcn-svelte | UI component primitives | Optional but recommended for non-chart UI (navigation, modals, tooltips). Has Tailwind v4 migration guide. Version: follow shadcn-svelte docs, uses component copy pattern not npm install. |

---

## Installation

```bash
# Scaffold project (choose TypeScript, Tailwind, ESLint, Prettier when prompted)
npx sv create llem-site
cd llem-site

# Visualisation libraries
npm install d3 @observablehq/plot plotly.js-dist-min gsap scrollama

# Data layer
npm install @duckdb/duckdb-wasm

# Types (Tailwind v4 and SvelteKit include types by default via sv create)
npm install -D @types/d3 @types/scrollama

# Verify static adapter is installed (sv create includes it)
# Check svelte.config.js uses adapter-static
```

```js
// svelte.config.js — ensure static adapter
import adapter from '@sveltejs/adapter-static';
export default {
  kit: {
    adapter: adapter({
      fallback: '404.html'  // GitHub Pages 404 handling
    }),
    prerender: { handleHttpError: 'warn' }
  }
};
```

```ts
// src/routes/+layout.ts — enable prerendering everywhere
export const prerender = true;
```

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| SvelteKit | Astro | If the site were >80% static narrative content with minimal interactivity. Astro's islands architecture is superior for content sites, but llem-commons needs rich interactive charts as first-class citizens, not islands. SvelteKit's compile-time approach produces smaller bundles for interactive-heavy pages. |
| SvelteKit | Next.js | If the team were React-first. Next.js is a fine framework but React fights D3's imperative DOM model. Svelte's approach is more natural for custom visualisations. |
| SvelteKit | Observable Framework | Observable Framework (from the D3 team) is a compelling SSG for data-heavy sites with Python data loaders. Consider it if the data exploration layer grows complex - it was explicitly designed for this use case. The policy narrative site is better served by SvelteKit's full layout control. |
| GSAP ScrollTrigger | Scrollama | If animations are simple step triggers only (show/hide content, no timeline scrubbing). Scrollama is 2KB vs GSAP's ~60KB. GSAP is now free so the cost argument for Scrollama is gone. |
| Plotly.js | Three.js / React Three Fiber | If the 3D surface required custom shaders, real-time animation, or full 3D scene control. Plotly.js's `surface` trace is sufficient for a static loss-landscape-style 3D surface over a grid of ExperimentResult data. Three.js adds 600KB+ and requires significant WebGL expertise. |
| Observable Plot | Vega-Lite | Both are grammar-of-graphics libraries. Plot's API is more concise and its Svelte integration is more natural. Vega-Lite requires a JSON spec which creates friction when data is dynamic. |
| D3.js | ECharts | ECharts (Apache, Canvas-based) has excellent parallel coordinates and is 10x faster than D3 on very large datasets. Prefer ECharts IF you need parallel coordinates over 100K+ rows. For the fixture data scale (<10K experiments), D3's SVG-based rendering is sufficient and allows more visual customisation. |
| Cloudflare Pages | Netlify | Netlify switched to opaque credit-based pricing in September 2025 with unpredictable overages. Cloudflare Pages offers unlimited bandwidth and unlimited sites on the free tier. Use Netlify only if you need Netlify-specific features (form handling, edge functions beyond Cloudflare Workers). |
| Cloudflare Pages | GitHub Pages | GitHub Pages is simpler but has a 1GB repository size limit and no build pipeline flexibility. Cloudflare Pages integrates with GitHub, has no bandwidth limit, and supports SvelteKit builds natively. Prefer Cloudflare Pages unless the simplicity of `gh-pages` branch matters more. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Streamlit / Dash / Gradio | These are Python app frameworks that re-execute on every interaction and produce generic, corporate-looking UIs. They lack scrollytelling, custom chart transitions, and layout control. The policy audience needs to be *impressed*, not just served data. | SvelteKit + D3/Plotly |
| React + recharts / Victory | recharts and Victory are React-first charting libs with limited scientific chart types (no 3D surface, no parallel coordinates). React's virtual DOM fights D3's imperative model, creating awkward integration patterns. | SvelteKit + D3/Plotly |
| Flourish / Datawrapper | These are excellent no-code tools for newsrooms but are fundamentally inappropriate here: no version control, no programmatic data integration, locked into GUI workflows, and storytelling features are paywalled. You'd be locked out of the fixture data pipeline entirely. | SvelteKit + custom Svelte components |
| Highcharts | Commercial license required for any commercial use. Equivalent open-source options (Plotly.js, ECharts) exist. | Plotly.js or ECharts |
| `plotly.js` (full bundle) | 6MB+ bundle size. Use `plotly.js-dist-min` (~3.3MB gzipped ~1MB) or partial bundles. Better: import only the traces you need via `plotly.js/lib/core` + registered traces. | `plotly.js-dist-min` or partial build |
| Netlify (new accounts) | September 2025 credit-based pricing creates unpredictable costs for static sites. 20 production deploys/month on free tier. | Cloudflare Pages (unlimited bandwidth free) or GitHub Pages |
| `@duckdb/duckdb-wasm@1.33.1-dev*` | Development versions are unstable. A malware incident in CVE-2025-59037 affected dev versions 1.3.3 and 1.29.2. Pin to a verified stable release. | `@duckdb/duckdb-wasm@1.29.x` (stable) - check github.com/duckdb/duckdb-wasm/releases |

---

## Stack Patterns by Variant

**For the scrollytelling narrative layer (the "story"):**
- Use GSAP ScrollTrigger + sticky layout pattern
- Svelte components hold the chart state; GSAP triggers state changes on scroll
- D3 handles the topographic/contour and timeseries charts (SVG, animatable)
- Plotly handles 3D surface (WebGL, not animatable via GSAP - trigger discrete state swaps instead)
- One sticky container per "chapter" with text scrolling alongside

**For the interactive explorer layer (user-driven):**
- DuckDB-WASM loaded once at page start with pre-built Parquet snapshot
- Svelte stores hold filter state (selected models, backends, precision)
- Observable Plot renders faceted comparisons reactively from query results
- Plotly renders the parallel coordinates plot (brushable, interactive by default)

**For the data pipeline (build-time):**
- JSON/Parquet fixture files live in `static/data/` (committed to repo)
- No server needed - all data ships with the static build
- When real sweep data arrives: replace fixtures, rebuild, redeploy
- DuckDB-WASM reads Parquet directly from URL - no conversion step

**For self-hosting on the lab GPU server:**
- Build with `npm run build` → `adapter-static` emits `/build` directory
- Serve with any static file server: `python -m http.server`, nginx, or Caddy
- No Node.js required at runtime - it's just HTML/JS/CSS/data files
- Caddy recommended for automatic HTTPS if the server is internet-facing

**If the 3D surface visualisation feels too heavy (bundle size concern):**
- Ship the 3D surface as a pre-rendered image (SVG or PNG from a Python matplotlib/plotly script)
- Use D3's 2D contour view as the primary interactive visualisation
- Reserve Plotly.js load for the explicit "3D view" tab/toggle (dynamic import)

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| svelte@5.54.0 | @sveltejs/kit@2.55.0 | Stable pairing. SvelteKit 2.12+ includes $app/state based on Svelte 5 runes. |
| @sveltejs/kit@2.55.0 | @sveltejs/adapter-static@3.x | Adapter-static 3.x required for SvelteKit 2.x. |
| tailwindcss@4.x | @tailwindcss/vite@4.x | Must use the Vite plugin approach. PostCSS config is NOT used in v4. `@tailwind` directives removed - use `@import "tailwindcss"` instead. |
| d3@7.9.0 | SvelteKit | D3 v7 is ESM-native. Works cleanly with Vite/SvelteKit. Import individual modules: `import { scaleLinear } from 'd3-scale'` for tree-shaking. |
| plotly.js@3.x | SvelteKit | Requires `import { browser } from '$app/environment'` guard - Plotly uses browser APIs and cannot SSR. Wrap in `{#if browser}` or `onMount`. |
| @duckdb/duckdb-wasm | SvelteKit | Requires `browser` guard and async init in `onMount`. WASM files must be served from the static directory or CDN. Set `asyncWebAssembly: true` in Vite config. |
| gsap@3.x | SvelteKit | Import in `onMount` only. Use `browser` guard. ScrollTrigger should be registered once: `gsap.registerPlugin(ScrollTrigger)`. |

---

## Hosting Decision

**Primary recommendation: Cloudflare Pages**

- Unlimited bandwidth (critical for data-heavy static sites with Parquet files)
- Unlimited sites on free tier
- 500 builds/month (well within project needs)
- Integrates directly with GitHub - push to main triggers deploy
- Global CDN with ~200 edge locations
- Supports SvelteKit adapter-static builds natively

**Secondary: GitHub Pages**

- Zero additional setup if code is already on GitHub
- Free, no bandwidth worries for reasonable traffic
- Limitation: 1GB repo size limit (could be an issue if Parquet data files grow large)
- Use if Cloudflare Pages is overkill for the prototype stage

**Self-hosted lab server:**

- Build with `adapter-static`, serve the `/build` directory with Caddy or nginx
- Caddy: automatic HTTPS, zero config - `caddy file-server --root ./build`
- Useful for demo during paper review / conference where internet access is limited

**Avoid Netlify (new accounts):** September 2025 credit-based pricing makes costs unpredictable. 20 production deploys/month on free tier is inadequate during active development.

---

## Sources

- SvelteKit official docs: https://svelte.dev/docs/kit — version 2.55.0 confirmed via npm. HIGH confidence.
- Svelte 5 release: https://svelte.dev/blog/svelte-5-is-alive — confirmed stable. HIGH confidence.
- Tailwind v4 + SvelteKit: https://tailwindcss.com/docs/guides/sveltekit — official guide. HIGH confidence.
- D3.js version: d3 npm — version 7.9.0 stable. HIGH confidence.
- Observable Plot: @observablehq/plot npm — version 0.6.17, contour mark verified https://observablehq.com/plot/marks/contour. HIGH confidence.
- Observable Plot 3D limitation: no 3D surface support in Plot documented — MEDIUM confidence (absence of feature vs confirmed gap).
- Plotly.js 3D surface: https://plotly.com/javascript/3d-surface-plots/ — official docs confirm surface trace. HIGH confidence.
- Plotly.js parallel coordinates: https://plotly.com/javascript/parallel-coordinates-plot/ — official docs. HIGH confidence.
- Plotly.js version 3.4.0: npm. HIGH confidence.
- GSAP free/open source: https://gsap.com/blog/webflow-GSAP/ + https://webflow.com/blog/gsap-becomes-free — confirmed free as of April 2025 including ScrollTrigger. HIGH confidence.
- Scrollama version 3.2.0: npm. MEDIUM confidence (4 years since last update, but stable and widely used).
- DuckDB-WASM: https://duckdb.org/docs/stable/clients/wasm/overview — stable client. MEDIUM confidence on exact version to pin (dev versions exist alongside stable). Security advisory CVE-2025-59037 noted — pin to stable release. MEDIUM confidence.
- Cloudflare Pages free tier: https://developers.cloudflare.com/pages/platform/limits/ — unlimited bandwidth confirmed. HIGH confidence.
- Netlify credit pricing: https://www.netlify.com/changelog/netlify-pricing-update-introducing-credit-based-plans/ — confirmed September 2025 change. HIGH confidence.
- The Pudding Svelte + D3 stack: https://pudding.cool (methodology notes, Russell Goldenberg public writing) — MEDIUM confidence (secondary source, but well-documented public choice).
- Datawrapper built on SvelteKit: mentioned in data-storytelling-viz.md research. MEDIUM confidence.

---

*Stack research for: llem-commons policy communication site*
*Researched: 2026-03-20*
