# Design Document: Code Architecture & Frontend Modularization

**Status:** Phase 1 (CSS/JS extraction) ✅ Complete (Issue #3, PR #8) — further modularization in Issues #10, #11
**Priority:** High (Maintainability)
**Complexity:** High
**Estimated Effort:** 3-4 weeks total (1 week for extraction, 2-3 weeks for modularization)
**Actual Effort (Phase 1):** ~1 week

---

## Problems Identified

### 1. Monolithic HTML Files
- `index.html` was 877 lines — embedded CSS, JavaScript, and markup in a single file
- `status.html` was 502 lines — similar monolithic structure
- Hard to find code, no separation of concerns, hard to refactor

### 2. String-Based HTML Generation
```javascript
html += `<div class="course-card">
  <div class="course-header"><h2>${courseName}</h2>...</div>
</div>`;
```
No syntax highlighting in context, easy to break with quotes/escaping.

### 3. Duplicated Code Across Pages
- Authentication logic duplicated in both pages
- Theme toggle duplicated in both pages
- No shared utilities

### 4. No Lazy Loading
All outlines loaded at startup even if user never views them.

---

## Design Decision: Plain `<script>` Tags vs ES6 Modules

The original design proposed full ES6 module architecture with `import`/`export`, class-based components (DataStore, CourseCard, OutlineView), and optionally a module bundler (Webpack/Vite).

**This was not implemented.** The dashboard must work over `file://` protocol (opened directly from the filesystem, no web server). ES6 modules require CORS headers that browsers block for `file://` URLs. Instead, the implementation uses plain `<script>` tags with global variables — the same pattern as the original code, but organized into separate files.

This is the right trade-off for a `file://`-based dashboard. If the project later moves to a web server, ES6 modules could be adopted, but for now the extraction into separate files achieves the core maintainability goals without breaking the deployment model.

---

## What Was Implemented (Issue #3, PR #8)

### Phase 1: CSS Extraction — 4 Files

| File | Purpose | Scope |
|---|---|---|
| `css/variables.css` | CSS custom properties for dark/light themes | Shared |
| `css/base.css` | Reset, body, header, footer, auth gate, construction banner, membership tags, theme toggle | Shared |
| `css/dashboard.css` | Two-column layout, nav panel, stats bar, curriculum groups, detail panel, outline display | Dashboard only |
| `css/status.css` | Summary bar, progress bars, filter chips, data table, status pills/dropdowns | Status only |

**Key design choices:**
- `variables.css` defines the color system; both page-specific CSS files can override variables (e.g., `status.css` overrides `--text-secondary` and `--text-muted` for dark mode)
- `base.css` scopes shared styles that appear on both pages
- Page-specific CSS uses body class selectors (`.dashboard-page`, `.status-page`) to avoid conflicts (e.g., `.status-page .status-dot` overrides `base.css`'s `.status-dot`)

### Phase 2: JS Extraction — 4 Files

| File | Purpose | Lines | Scope |
|---|---|---|---|
| `js/auth.js` | SHA-1 password gate IIFE with sessionStorage persistence | ~38 | Shared |
| `js/theme.js` | `initTheme()`, `toggleTheme()`, `updateToggleIcon()` with localStorage | ~27 | Shared |
| `js/dashboard.js` | syllabiMap, courseLookup, curriculumMap, buildDashboard(), selectCourse(), all rendering | ~335 | Dashboard only |
| `js/status-main.js` | STATUSES, membershipMap, contentData, summary/progress/table rendering, filters, dropdowns | ~155 | Status only |

**Key design choices:**
- `auth.js` is an IIFE that runs immediately — blocks page until authenticated
- `theme.js` exposes global `initTheme()` and `toggleTheme()` functions
- Page JS files depend on data bundles (`courses.js`, `outlines/outlines.js`) being loaded first
- All files use global scope — no modules, no bundler

### HTML Shells Rewritten

**`index.html`** (877 → 57 lines):
```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <title>Curriculum Dashboard</title>
    <link rel="stylesheet" href="css/variables.css">
    <link rel="stylesheet" href="css/base.css">
    <link rel="stylesheet" href="css/dashboard.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
</head>
<body class="dashboard-page">
    <!-- Header, nav container, detail container -->
    <script src="js/auth.js"></script>
    <script src="outlines/outlines.js"></script>
    <script src="courses.js"></script>
    <script src="js/theme.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
```

**`status.html`** (502 → 48 lines): same pattern with `css/status.css` and `js/status-main.js`.

**Script load order matters:**
1. `auth.js` — blocks until authenticated
2. `outlines/outlines.js` — loads `courseOutlines` (dashboard only)
3. `courses.js` — loads `courseData`, `curriculaData`, `courseStatusMap`
4. `theme.js` — initializes theme
5. Page JS — uses globals from steps 2-4

---

## Project Structure (Current)

```
tracking/repo/
├── index.html              # Thin shell (~57 lines)
├── status.html             # Thin shell (~48 lines)
├── css/
│   ├── variables.css       # Shared theme variables (~68 lines)
│   ├── base.css            # Shared base styles (~108 lines)
│   ├── dashboard.css       # Dashboard-specific (~285 lines)
│   └── status.css          # Status page-specific (~176 lines)
├── js/
│   ├── auth.js             # Shared auth gate (~38 lines)
│   ├── theme.js            # Shared theme toggle (~27 lines)
│   ├── dashboard.js        # Dashboard page logic (~335 lines)
│   └── status-main.js      # Status page logic (~155 lines)
├── courses.js              # Auto-generated data bundle
├── outlines/
│   └── outlines.js         # Auto-generated outline bundle
└── ...
```

---

## Remaining Work

### Issue #10: JS Component Modularization

`dashboard.js` (~335 lines) and `status-main.js` (~155 lines) are still monolithic. Issue #10 will break them into focused files (~100 lines each):

```
js/
├── auth.js              # (exists) Shared auth gate
├── theme.js             # (exists) Shared theme toggle
├── shared/
│   ├── data-store.js    # courseLookup, membershipMap, curriculumMap builders
│   ├── formatters.js    # Status icons, membership HTML builders
│   └── constants.js     # STATUSES, STATUS_CLASSES, syllabiMap
├── dashboard/
│   ├── nav-builder.js   # buildDashboard(), buildCurriculumSummary(), buildNavItemFromCourse()
│   ├── detail-panel.js  # selectCourse(), outline rendering
│   └── init.js          # Dashboard initialization
└── status/
    ├── summary.js       # computeSummary(), renderSummary(), renderProgress()
    ├── table.js         # renderTable(), filter logic, dropdown logic
    └── init.js          # Status page initialization
```

Still plain `<script>` tags. No ES6 modules.

### Issue #11: Curriculum Reference Restructuring

Simplify curriculum course refs from `{ name, id, hoursOverride }` objects to plain ID strings (or `{ id, hoursOverride }` when overrides are needed). This affects both `courses.json` data and the JS code that resolves references.

---

## Original ES6 Design (Not Implemented)

For reference, the original design proposed:
- ES6 modules with `import`/`export`
- Class-based components (`Dashboard`, `CourseCard`, `OutlineView`, `DataStore`)
- Observer pattern for reactive updates
- Lazy-loading outlines via `fetch()`
- Optional module bundler (Webpack/Vite)
- Unit testing with component isolation

This architecture would be appropriate if the dashboard moves to server-hosted deployment. The current `file://` constraint makes this infeasible without a build step that bundles everything into a single file.

---

## Benefits Achieved

✅ **Separation of concerns** — CSS, JS, and HTML in separate files
✅ **Shared code** — auth and theme logic written once, used by both pages
✅ **Maintainable** — 57-line HTML vs 877-line monolith; styles easy to find
✅ **IDE support** — syntax highlighting, auto-complete, linting work in separate files
✅ **Scoped styles** — page-specific CSS doesn't leak across pages
✅ **No breaking changes** — dashboard works identically before and after extraction
✅ **file:// compatible** — no modules, no bundler, no server required

---

## Implementation Checklist

- [x] Extract CSS into separate files (variables, base, dashboard, status)
- [x] Extract JS into separate files (auth, theme, dashboard, status-main)
- [x] Rewrite index.html as thin shell
- [x] Rewrite status.html as thin shell
- [x] Shared code reused across pages (auth.js, theme.js, variables.css, base.css)
- [x] Dark/light theme works on both pages
- [x] All functionality preserved (zero regressions)
- [x] Works over `file://` protocol
- [ ] JS further modularized into focused components (Issue #10)
- [ ] Curriculum refs simplified to ID-only (Issue #11)

---

**Last updated:** March 28, 2026
