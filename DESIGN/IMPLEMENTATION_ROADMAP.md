# Implementation Roadmap: Curriculum Tracking Architecture Improvements

**Created:** March 28, 2026
**Last Updated:** March 28, 2026
**Total Design Documents:** 5 (2,063 lines)
**Estimated Total Effort:** 6-9 weeks

---

## Progress Summary

| Phase | Issue | Status | Branch / PR |
|-------|-------|--------|-------------|
| 1 | #1 Build Process | ✅ Complete | PR #6 merged |
| 2 | #2 Data Model & IDs | ✅ Complete | PR #7 merged |
| 3 | #3 CSS/JS Extraction | ✅ Complete | PR #8 merged |
| 1 | #4 Architecture Docs | ✅ Complete | PR #5 merged |
| — | #5 (see GitHub) | 🔲 Open | — |
| 3+ | #10 JS Modularization | 🔲 Open | Deferred from #3 |
| 2+ | #11 Curriculum Refs | 🔲 Open | Deferred from #2 |

---

## Overview

This roadmap provides a concrete timeline and resource allocation for implementing the architecture improvements documented in this folder.

---

## Phase 1: Foundation & Build Automation ✅ COMPLETE

### Issue #1 — Automated Build System (PR #6, merged)

**Delivered:**
- [x] `build.js` with configuration-driven orchestration
- [x] `lib/generators.js` with shared generation functions
- [x] `lib/validators.js` with schema and reference validation
- [x] `package.json` with npm scripts (`build`, `validate`, `build:watch`, `build:verbose`)
- [x] Updated README with build instructions

**Results:**
- Single `npm run build` replaces all manual steps
- Validation catches data errors with clear reporting
- `--watch` mode enables real-time development
- Build output is byte-for-byte identical to manually generated files

---

## Phase 2: Data Integrity ✅ COMPLETE

### Issue #2 — Stable IDs & Schema Validation (PR #7, merged)

**Delivered:**
- [x] `data/schema.json` — formal JSON schema definition
- [x] All 64 courses have stable kebab-case IDs in `courses.json`
- [x] All 51 outline manifest entries have IDs
- [x] Curricula reference courses by ID alongside name
- [x] Dashboard uses ID-first lookups (`data-course-id` attributes)
- [x] Status page uses ID-based membership mapping
- [x] `DESIGN/MIGRATION-GUIDE.md` — ID rules, rename/add workflows
- [x] `courseStatusMap` keys by both name and ID

**Deferred to Issue #11:**
- Curriculum reference restructuring (drop `name` from refs, use ID-only or `{ id, hoursOverride }` format)
- 6 Cloud Ops Specialist cross-reference name mismatches (warnings, not errors)

**Results:**
- IDs are permanent — names can change without breaking references
- Schema validation integrated into build pipeline
- Both name and ID lookups work (backward compatible)

---

## Phase 3: Code Quality & Maintainability (In Progress)

### Issue #3 — CSS/JS Extraction ✅ COMPLETE (PR #8, merged)

**Delivered:**
- [x] `css/variables.css`, `css/base.css`, `css/dashboard.css`, `css/status.css`
- [x] `js/auth.js`, `js/theme.js`, `js/dashboard.js`, `js/status-main.js`
- [x] `index.html` rewritten as thin shell (877 → 57 lines)
- [x] `status.html` rewritten as thin shell (502 → 48 lines)
- [x] All files work over `file://` protocol (plain `<script>` tags, no ES6 modules)

### Issue #10 — JS Component Modularization (Open)

Break `dashboard.js` and `status-main.js` into smaller focused files (~100 lines each): shared data store, formatters, constants, nav builder, detail panel, table renderer, etc. Still plain `<script>` tags for `file://` compatibility.

See Issue #10 in [GITHUB_ISSUES.md](./GITHUB_ISSUES.md) for full spec.

### Issue #11 — Curriculum Reference Restructuring (Open)

Simplify curriculum course refs in `courses.json` to ID-only strings (or `{ id, hoursOverride }` when overrides are needed). Drops redundant `name` field from refs. Resolves the 6 Cloud Ops cross-reference warnings from Issue #2.

See Issue #11 in [GITHUB_ISSUES.md](./GITHUB_ISSUES.md) for full spec.

---

## Timeline

```
Issue #1  Build Process          ✅ Complete (PR #6)
Issue #4  Architecture Docs      ✅ Complete (PR #5)
Issue #2  Data Model & IDs       ✅ Complete (PR #7)
Issue #3  CSS/JS Extraction      ✅ Complete (PR #8)
Issue #5  (see GitHub)           🔲 Open
Issue #10 JS Modularization      🔲 Open — depends on #3
Issue #11 Curriculum Refs        🔲 Open — depends on #2
```

---

## Resource Allocation

### Team Structure
```
Product Owner / Architect (You?)
  ├─ Review designs
  ├─ Make go/no-go decisions
  └─ Handle blockers

Developer 1 (Full-time)
  ├─ Phase 1: Build Process (weeks 1-2)
  ├─ Phase 2: Data model updates (weeks 3-5)
  └─ Phase 3: Component development (weeks 6-9)

Developer 2 (Part-time, weeks 3-9)
  ├─ Phase 2: Data file migrations (weeks 3-5)
  └─ Phase 3: Testing & QA (weeks 6-9)
```

### Budget Estimate
- Developer 1: 9 weeks × 40h = 360 hours
- Developer 2: 7 weeks × 20h = 140 hours
- **Total: ~500 hours (~3 months for single developer, ~6 weeks for two)**

---

## Success Metrics

Track these throughout implementation:

### Phase 1 (Build Process) ✅
- [x] `npm run build` executes without errors
- [x] Validation catches invalid data (schema, references, file existence)
- [x] Build time < 2 seconds
- [x] Watch mode works correctly

### Phase 2 (Data Model) ✅
- [x] All 64 courses have stable IDs
- [x] Zero broken references (6 Cloud Ops warnings deferred to #7)
- [x] Schema validation passes 100% of data
- [x] Migration guide written (`DESIGN/MIGRATION-GUIDE.md`)

### Phase 3 (Code Architecture) — In Progress
- [x] index.html < 100 lines (57 lines, was 877)
- [x] status.html < 100 lines (48 lines, was 502)
- [x] CSS extracted to 4 organized files
- [x] JS extracted to 4 organized files
- [x] Shared code reused (auth.js, theme.js)
- [ ] JS further modularized into focused components (Issue #10)
- [ ] Curriculum refs simplified to ID-only (Issue #11)

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| Build.js doesn't catch all errors | Medium | High | Thorough validator testing, examples in tests |
| Data migration breaks references | High | Critical | Phased approach, validation catches issues |
| Component refactoring takes longer | High | Medium | Allocate extra week buffer, phased approach |
| Performance regression | Medium | Medium | Benchmarking before/after, lazy loading |
| Team knowledge gaps | Medium | Low | Code reviews, pair programming, documentation |

---

## Go/No-Go Decision Points

**After Phase 1 (Week 2):**
- Is `npm run build` reliable?
- Is validation catching errors?
- Decision: Continue to Phase 2 or iterate on build system?

**After Phase 2 (Week 5):**
- Are all data IDs stable?
- Are references consistent?
- Decision: Continue to Phase 3 or stabilize Phase 2?

**After Phase 3 (Week 9):**
- Is code quality improved?
- Are components reusable and testable?
- Decision: Merge to production or iterate?

---

## Post-Implementation: Next Steps

### Immediate (Week 10-11)
- [ ] Deploy improved system to production
- [ ] Gather team feedback
- [ ] Document lessons learned
- [ ] Update team on new processes

### Short-term (Months 2-3)
- [ ] Create user-facing course editor
- [ ] Implement LMS integration (Absorb sync)
- [ ] Add search and filtering
- [ ] Performance optimization

### Long-term (Months 4-6)
- [ ] Versioning and change tracking
- [ ] Curriculum templates
- [ ] Advanced analytics
- [ ] API for third-party integrations

---

## Communication Plan

### Stakeholders
- **Development team**: Weekly syncs, design document reviews
- **Curriculum team**: Monthly updates on dashboard improvements
- **Leadership**: Phase completion updates, impact metrics

### Documentation
- Weekly: Update README with progress
- Bi-weekly: Share architecture decisions with team
- Monthly: Publish improvements blog post / internal announcement

---

## Appendix: Completed Work

### Issue #1 — Build Process (PR #6)
- [x] `build.js` — orchestrator with `--validate`, `--watch`, `--verbose` flags
- [x] `lib/generators.js` — `generateCourseBundle()`, `generateOutlineBundle()`
- [x] `lib/validators.js` — schema, references, syllabus files, outline files
- [x] `package.json` — `build`, `validate`, `build:watch`, `build:verbose` scripts

### Issue #2 — Data Model (PR #7)
- [x] `data/schema.json` — formal JSON schema
- [x] 64 stable kebab-case IDs in `courses.json`
- [x] 51 IDs in `outlines/manifest.json`
- [x] Curricula refs include `id` alongside `name`
- [x] Dashboard/status use ID-first lookups
- [x] `DESIGN/MIGRATION-GUIDE.md` — ID rules and workflows

### Issue #3 — CSS/JS Extraction (PR #8)
- [x] 4 CSS files: `variables.css`, `base.css`, `dashboard.css`, `status.css`
- [x] 4 JS files: `auth.js`, `theme.js`, `dashboard.js`, `status-main.js`
- [x] `index.html` → 57 lines, `status.html` → 48 lines

## Remaining Work

### Issue #10 — JS Component Modularization
- [ ] Extract shared data store, formatters, constants
- [ ] Split `dashboard.js` into nav builder, detail panel, init
- [ ] Split `status-main.js` into summary, table, init
- [ ] Target: no single JS file > ~100 lines

### Issue #11 — Curriculum Reference Restructuring
- [ ] Simplify curriculum course refs to ID-only strings
- [ ] Override format: `{ id, hoursOverride?, note? }`
- [ ] Resolve 6 Cloud Ops cross-reference mismatches
- [ ] Update schema, validators, dashboard, status page

---

**Last updated:** March 28, 2026
