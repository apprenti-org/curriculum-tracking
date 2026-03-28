# Curriculum Tracking Dashboard — Architecture Review & Improvement Suggestions

**Date:** March 28, 2026
**Scope:** Code review of tracking/repo system (JSON data model, JavaScript generation, HTML/CSS, build process)
**Last Updated:** March 28, 2026

---

## Executive Summary

The system is a **working single-page dashboard** with a clean separation between data (JSON) and presentation (HTML/JS). After three rounds of architecture improvements (Issues #1–#3), the foundation is solid: an automated build pipeline with validation, stable course IDs with schema enforcement, and modular CSS/JS extracted from the monolithic HTML files.

**Key strengths:** Simple (no backend), single source of truth (courses.json), automated build with validation, stable IDs, modular file organization, responsive UI, works over `file://` protocol
**Remaining weaknesses:** Large monolithic JS files per page, curriculum refs still include redundant `name` field, no lazy loading, client-side-only auth

---

## 1. DATA MODEL & SOURCE OF TRUTH

### Status: ✅ Improved (Issue #2, PR #7)

**What was fixed:**
- **JSON Schema** — formal `data/schema.json` defines all field types, required fields, and status enums. Validated on every build.
- **Stable course IDs** — all 64 courses have permanent kebab-case `id` fields. Names can change without breaking references.
- **ID-based lookups** — dashboard and status page use `data-course-id` attributes and ID-first lookups with name fallback.
- **Build-integrated validation** — `node build.js` catches missing IDs, duplicates, broken references, unsorted data.

**What remains:**
- Inconsistent reference types for `syllabus` and `outline` fields (string/boolean/null mix) — functional but not ideal
- Curriculum courseRefs include both `name` and `id` — `name` is redundant now that IDs exist (Issue #11)
- 6 Cloud Ops cross-reference mismatches produce warnings (Issue #11)
- `syllabiMap` still hardcoded in `js/dashboard.js` — could be generated from data
- No data versioning or change tracking

---

## 2. BUILD PROCESS & CODE GENERATION

### Status: ✅ Solved (Issue #1, PR #6)

**What was fixed:**
- **Single command** — `npm run build` (or `node build.js`) replaces 3+ manual steps
- **Configuration-driven** — `BUILD_CONFIG` object defines generators and validators
- **Validation pipeline** — schema, references, file existence, sort order checks
- **Watch mode** — `npm run build:watch` auto-rebuilds on file changes
- **Clear error reporting** — errors abort build, warnings are printed
- **Shared generation functions** — `lib/generators.js` eliminates duplicate code

**What remains:**
- Syllabi generation (`convert-syllabi.js`) not integrated into main build pipeline
- No CI/CD (GitHub Actions) — not currently needed for `file://` workflow
- Hardcoded paths in `convert-syllabi.js`

---

## 3. CODE ORGANIZATION

### Status: ✅ Improved (Issue #3, PR #8) — further modularization pending

**What was fixed:**
- **CSS extracted** to 4 organized files (`css/variables.css`, `base.css`, `dashboard.css`, `status.css`)
- **JS extracted** to 4 organized files (`js/auth.js`, `theme.js`, `dashboard.js`, `status-main.js`)
- **HTML thin shells** — `index.html` reduced from 877 → 57 lines, `status.html` from 502 → 48 lines
- **Shared code reused** — auth and theme logic written once, loaded by both pages
- **Scoped styles** — page-specific CSS uses body class selectors to prevent leakage

**What remains:**
- `dashboard.js` is still ~335 lines — multiple responsibilities (data loading, nav building, detail rendering, outline display)
- `status-main.js` is ~155 lines — summary, progress, table, filters, dropdowns all in one file
- Further modularization into focused ~100-line files planned in Issue #10

---

## 4. DATA LOADING & RUNTIME

### Status: ⚠️ Partially addressed

**What was fixed:**
- Data bundles (`courses.js`, `outlines/outlines.js`) are auto-generated with `node build.js`
- `courseStatusMap` is dual-keyed by both name and ID for backward compatibility
- Script load order is well-defined and documented in HTML comments

**What remains:**
- Global namespace pollution — `courseData`, `curriculaData`, `courseOutlines`, `courseStatusMap` are all globals
- No lazy loading — all outlines loaded at startup even if user views only one course
- No error handling if `<script>` tags fail to load
- These are acceptable trade-offs for a `file://`-based dashboard but would need addressing for server deployment

---

## 5. AUTHENTICATION & SECURITY

### Status: ⚠️ Unchanged (by design)

The SHA-1 password gate in `js/auth.js` is security theater — the hash is visible in source, SHA-1 is broken, and sessionStorage is readable in dev tools. However, this is **intentional** for the current use case: a lightweight gate to prevent casual access to an internal tool opened over `file://`.

**If the dashboard moves to server hosting**, authentication should be replaced with:
- HTTP Basic Auth, OAuth, or SAML at the server level
- Or removed entirely if the dashboard should be public

No changes were made to auth as part of Issues #1–#3, and none are planned.

---

## 6. SYLLABUS GENERATION PIPELINE

### Status: ⚠️ Not yet addressed

`convert-syllabi.js` still:
- Has CSS duplicated from the main stylesheet (now in `css/` files)
- Uses hardcoded absolute paths
- Is not integrated into the main build pipeline

This is a lower-priority item. The syllabi HTML files work correctly and rarely need regeneration.

---

## 7. DATA FILE ORGANIZATION

### Status: ✅ Partially improved

The file structure is now cleaner with CSS and JS in their own directories:

```
tracking/repo/
├── index.html              # Thin shell (57 lines)
├── status.html             # Thin shell (48 lines)
├── css/                    # Extracted stylesheets
│   ├── variables.css       # Shared theme variables
│   ├── base.css            # Shared base styles
│   ├── dashboard.css       # Dashboard-specific
│   └── status.css          # Status page-specific
├── js/                     # Extracted scripts
│   ├── auth.js             # Shared auth
│   ├── theme.js            # Shared theme
│   ├── dashboard.js        # Dashboard logic
│   └── status-main.js      # Status logic
├── build.js                # Build orchestrator
├── lib/                    # Build utilities
│   ├── generators.js
│   └── validators.js
├── data/
│   └── schema.json         # JSON schema
├── courses.json            # Source of truth
├── courses.js              # Generated bundle
├── outlines/               # Outline data + generated bundle
├── syllabi/                # HTML syllabi
├── DESIGN/                 # Architecture docs
├── package.json
└── README.md
```

The original review proposed moving `courses.json` to `data/` and HTML to `src/`, but the current flat layout works well for the `file://` use case and avoids breaking existing references.

---

## 8. MISSING FEATURES & GAPS

### Addressed
- ✅ Schema validation (Issue #2)
- ✅ Automated build (Issue #1)
- ✅ CSS/JS separation (Issue #3)
- ✅ Stable identifiers (Issue #2)
- ✅ Migration guide (Issue #2)

### Still Missing
- No curriculum-level metadata (description, learning outcomes, duration, prerequisites)
- No version control for outline content (git history covers this partially)
- No export/import for LMS migration
- No deployment pipeline (not needed for `file://`)
- No performance monitoring (dashboard is fast at current scale)
- No search or filtering on dashboard (status page has filter chips)

---

## 9. PRIORITY ROADMAP (Updated)

### Completed ✅
1. **JSON Schema validation** — `data/schema.json` + `lib/validators.js` (Issue #2)
2. **Automated build** — `build.js` with config, generators, validators (Issue #1)
3. **Stable course IDs** — 64 IDs, dual-keyed lookups, migration guide (Issue #2)
4. **CSS/JS extraction** — 4 CSS + 4 JS files, thin HTML shells (Issue #3)
5. **Architecture documentation** — this folder (Issue #4)

### Open
6. **JS component modularization** — break large files into ~100-line focused modules (Issue #10)
7. **Curriculum ref restructuring** — simplify to ID-only strings (Issue #11)

### Future
8. **Integrate syllabi generation** into build pipeline
9. **User-facing course editor** — remove manual JSON editing
10. **LMS integration** — sync with Absorb
11. **Versioning and change tracking**
12. **Search and filtering** on dashboard

---

## 10. SUMMARY SCORECARD

| Aspect | Before | After | Notes |
|--------|--------|-------|-------|
| **Data Model** | ⚠️ Poor | ✅ Good | Schema, stable IDs, validation. Refs still need cleanup (Issue #11) |
| **Build Process** | ⚠️ Poor | ✅ Good | Single command, validation, watch mode |
| **Code Organization** | ⚠️ Poor | ✅ Improved | Separate files, shared code. Large JS files remain (Issue #10) |
| **Error Handling** | ❌ Missing | ✅ Good | Build validates and reports clearly. Runtime still limited |
| **Performance** | ✅ Good | ✅ Good | Fast at current scale. No lazy loading yet |
| **Maintainability** | ⚠️ Poor | ✅ Improved | Much easier to find and edit code. Further modularization pending |
| **Scalability** | ⚠️ Poor | ⚠️ Adequate | Better data model scales well. UI will need work for 200+ courses |
| **Security** | ❌ Poor | ❌ Poor | Unchanged — acceptable for internal `file://` tool |

---

## Conclusion

Three rounds of improvements have transformed the system from a fragile manual process with monolithic files into a validated, automated, modular dashboard. The foundation is solid for continued development. The highest-impact remaining work is JS modularization (Issue #10) for maintainability and curriculum ref restructuring (Issue #11) to complete the ID migration.

---

**Last updated:** March 28, 2026
