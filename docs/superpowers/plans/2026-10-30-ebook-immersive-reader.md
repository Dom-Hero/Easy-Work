# Ebook Immersive Reader Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add document vs immersive reading modes; extract immersive book UI into `ImmersiveReader` with CSS page-flip and measured pagination.

**Architecture:** `ReaderView` keeps chapter loading and mode toggle; immersive rendering + flip UX live in `ImmersiveReader.vue`; page slicing lives in `usePagePagination.ts` (DOM measure).

**Tech Stack:** Vue 3 `<script setup>`, CSS 3D transforms, existing clay tokens, no new npm deps.

**Spec:** `docs/superpowers/specs/2026-10-30-ebook-immersive-reader-design.md`

## Global Constraints

- No third-party page-flip libraries
- Desktop dual-page; ≤800px single page
- Mode remembered in `localStorage['ebook-reader-mode']`
- Chapter boundary: auto prev/next chapter; open prev chapter at `startAt='end'`
- Do not change ebook parse / DB / library import

## File map

| File | Responsibility |
|------|----------------|
| `src/composables/usePagePagination.ts` | Measure text into page strings |
| `src/components/ebook/ImmersiveReader.vue` | Book chrome, flip, hotzones, keyboard |
| `src/views/ebook/ReaderView.vue` | Mode toggle + wire immersive props/emits |

---

### Task 1: `usePagePagination`

**Files:**
- Create: `src/composables/usePagePagination.ts`

**Produces:**
- `paginateText(text, options): string[]`
- `options`: `{ width: number; height: number; fontSize?: string; lineHeight?: string; fontFamily?: string; padding?: string }`
- Empty text → `['']` (caller may show empty copy)

- [ ] **Step 1:** Implement offscreen measure node + greedy/binary split at paragraph/`\n` boundaries so each page’s content fits `height`.
- [ ] **Step 2:** Manually sanity-check in console or temporary call: long string → multiple pages; short string → one page.
- [ ] **Step 3:** Commit `feat(ebook): add usePagePagination for immersive pages`

### Task 2: `ImmersiveReader` component

**Files:**
- Create: `src/components/ebook/ImmersiveReader.vue`

**Consumes:** `paginateText` from Task 1

**Props/emits (from spec):**
- props: `text`, `title`, `hasPrevChapter`, `hasNextChapter`, `loading`, `failed`, `startAt?: 'start' | 'end'`
- emits: `prev-chapter`, `next-chapter`

- [ ] **Step 1:** Layout book shell (paper, spine shadow, page footer). Dual page when container ≥800px else single. Left/right 1/3 click zones; keyboard ←/→/PageUp/PageDown.
- [ ] **Step 2:** Wire pagination on mount / text / resize (debounced). Honor `startAt`. Flip animation via CSS `rotateY` (~500ms); respect `prefers-reduced-motion`. Block input while animating. Boundary flips emit chapter events.
- [ ] **Step 3:** Commit `feat(ebook): add ImmersiveReader book flip component`

### Task 3: Wire `ReaderView`

**Files:**
- Modify: `src/views/ebook/ReaderView.vue`

- [ ] **Step 1:** Add mode state from `localStorage`; header segmented control 文档 | 沉浸. Track `immersiveStartAt` for chapter emits.
- [ ] **Step 2:** Conditionally render document article vs `<ImmersiveReader>` with chapter props; on `prev-chapter` / `next-chapter` call existing `goChapter` and set `startAt`.
- [ ] **Step 3:** `npm run type-check` passes. Manual: toggle modes, flip pages, cross chapter, resize to single page.
- [ ] **Step 4:** Commit `feat(ebook): dual reading modes in ReaderView`

## Verification

1. Header toggles document/immersive; preference persists after refresh
2. Document mode unchanged (scroll, chunk load, chapter pager)
3. Immersive: dual on desktop, single on narrow; click/keyboard flip with CSS motion
4. Last page → next chapter (start); first page → prev chapter (end)
5. No new page-flip npm dependency
