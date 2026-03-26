---
phase: 4
slug: distribution-polish
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-26
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit tests) + svelte-check (types) + eslint/prettier + static build verification |
| **Config file** | `platform/svelte.config.js` (prerender entries), `platform/eslint.config.js` |
| **Quick run command** | `cd platform && npm run check` |
| **Full suite command** | `cd platform && npx vitest run && npm run lint && npm run check && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd platform && npm run check`
- **After every plan wave:** Run `cd platform && npm run lint && npm run check && npm run build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 04-01-T1 | 01 (TDD) | 1 | DIST-01, DIST-04, DESG-04 | unit | `npx vitest run src/lib/data/__tests__/chartMeta.test.ts src/lib/data/__tests__/citations.test.ts` | ⬜ pending |
| 04-01-T2 | 01 (TDD) | 1 | DIST-03 | unit | `npx vitest run src/lib/utils/__tests__/chartExport.test.ts` | ⬜ pending |
| 04-02-T1 | 02 | 2 | DIST-01, DIST-03, DIST-04 | type+lint | `npm run check && npm run lint` | ⬜ pending |
| 04-02-T2 | 02 | 2 | DIST-01, DIST-03 | build+count | `npm run build && [ $(ls static/og/*.png 2>/dev/null \| wc -l) -eq 5 ]` | ⬜ pending |
| 04-02-T3 | 02 | 2 | DIST-02 | build | `npm run build` (verifies embed route prerendering) | ⬜ pending |
| 04-03-T1 | 03 | 2 | DESG-03, DESG-04 | type+lint | `npm run check && npm run lint` | ⬜ pending |
| 04-03-T2 | 03 | 2 | DESG-05 | build+type | `npm run check && npm run lint && npm run build` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [x] Test files for chartMeta, citations, and chartExport created by Plan 01 (TDD plan - tests written first)
- [x] `html-to-image` dependency installed by Plan 01 Task 2
- [x] `entries()` pattern for dynamic route prerendering established in existing codebase (explorer/+page.ts)

*Wave 0 is satisfied: Plan 01 is a TDD plan that creates all test scaffolds as its first step.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Chart page renders correctly | DIST-01 | Visual layout, prerendered content | Navigate to `/chart/heatmap`, verify chart + metadata displays |
| Embed iframe resizes | DIST-02 | Cross-frame postMessage | Embed in test HTML, resize, verify height updates |
| Exported image quality | DIST-03 | Visual fidelity, CSS var resolution | Download PNG/SVG, verify colours match, title+attribution present |
| Plotly export compositing | DIST-03 | Canvas drawing fidelity | Download PNG from Surface3D, verify title at top and attribution at bottom |
| Citation correctness | DIST-04 | Academic format accuracy | Copy BibTeX, paste in LaTeX, verify renders; check APA format |
| Colourblind safety | DESG-03 | Perceptual simulation | Run palette hex values through colourblind simulator tool |
| Keyboard navigation | DESG-05 | Interaction flow | Tab through all controls, arrow keys in heatmap, verify announce |
| Query param restore | DIST-01 | Browser interaction | Navigate to `/chart/heatmap?precision=fp16`, verify filter pre-applied |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all test scaffolds (Plan 01 TDD creates them)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
