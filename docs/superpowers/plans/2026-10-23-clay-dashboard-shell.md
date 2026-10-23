# Clay Dashboard + Shell Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle Dashboard + AdminLayout/CardNav/FloatingLines to Clay tokens from `DESIGN-clay.md` without changing business logic.

**Architecture:** Land Clay CSS variables in `base.css`; consume them in layout, nav, and `infoCard` variants; tune `FloatingLines` via warm low-contrast `linesGradient` props from `AdminLayout`.

**Tech Stack:** Vue 3, Vite, CSS variables, existing FloatingLines/CardNav/GSAP.

**Spec:** `docs/superpowers/specs/2026-10-23-clay-dashboard-shell-design.md`

## Global Constraints

- Scope: Dashboard + shell only; do not restyle `/user`
- Keep search filter, card open-in-new-tab, CardNav expand behavior
- No Plain Black font file; Inter is fine
- No heavy neon glows; cream canvas + saturated cards

---

### Task 1: Clay CSS tokens

**Files:**
- Modify: `src/assets/base.css`

- [ ] **Step 1:** Replace Vue theme `:root` semantic colors with Clay tokens (`--clay-canvas`, brands, ink, rounded, spacing). Map `--color-background` / `--color-text` to canvas/ink. Remove or neutralize `prefers-color-scheme: dark` override so shell stays cream.
- [ ] **Step 2:** Visually confirm `body` background is `#fffaf0` in browser.
- [ ] **Step 3:** Commit `style: add Clay design tokens to base.css`

### Task 2: AdminLayout + FloatingLines warm bg

**Files:**
- Modify: `src/layouts/AdminLayout.vue`

- [ ] **Step 1:** Set `.layout` background to `var(--clay-canvas)`. Pass CardNav colors: baseColor canvas, menuColor ink, buttonBg primary, buttonText white. Pass FloatingLines `lines-gradient` as warm pastels (peach/ochre/lavender/mint hex), lower `animation-speed` (~0.4), milder bend.
- [ ] **Step 2:** Confirm cream page + faint warm lines, no purple/cyan dominance.
- [ ] **Step 3:** Commit `style: warm clay shell background and nav props`

### Task 3: CardNav + StartBtn restyle

**Files:**
- Modify: `src/components/CardNav.vue`
- Modify: `src/components/startBtn.vue`

- [ ] **Step 1:** Restyle search to clay text-input (height ~40–44px, radius 12px, hairline border, canvas fill). Soften glass nav border toward hairline on cream. Keep GSAP expand logic.
- [ ] **Step 2:** Restyle StartBtn to primary near-black CTA (radius 12px), remove purple glow hover.
- [ ] **Step 3:** Commit `style: restyle CardNav and StartBtn to Clay`

### Task 4: InfoCard + Dashboard

**Files:**
- Modify: `src/components/infoCard.vue`
- Modify: `src/views/dashboard/index.vue`

- [ ] **Step 1:** Add `colorIndex` prop; map `% 6` to pink/teal/lavender/peach/ochre/cream. Remove neon pseudo-elements. Always-visible on-color jump button. Light hover lift.
- [ ] **Step 2:** Dashboard: pass `:color-index="index"`, gap 28–32px, empty tip `var(--clay-muted)`. Adjust CARD_WIDTH if card grows (~220–240).
- [ ] **Step 3:** Verify search + open link still work; six colors cycle.
- [ ] **Step 4:** Commit `feat: Clay feature cards on dashboard`

## Verification

1. Dashboard cream canvas, warm faint lines
2. Nav expand + search work; near-black primary button
3. Cards six-color, 24px radius, no neon glow
4. `/user` unchanged visually this round
