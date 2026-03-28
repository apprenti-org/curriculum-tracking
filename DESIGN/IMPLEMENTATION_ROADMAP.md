# Implementation Roadmap: Curriculum Tracking Architecture Improvements

**Created:** March 28, 2026
**Total Design Documents:** 5 (2,063 lines)
**Estimated Total Effort:** 6-9 weeks

---

## Overview

This roadmap provides a concrete timeline and resource allocation for implementing the three major architecture improvements documented in this folder.

---

## Phase 1: Foundation & Build Automation (Weeks 1-2)

### 02-BUILD-PROCESS.md — Create Automated Build System

**Why Start Here:**
- Lowest effort, immediate payoff
- Enables easier testing of other changes
- Non-breaking, runs alongside manual process
- Improves daily developer experience

**Deliverables:**
- [ ] `build.js` with configuration-driven orchestration
- [ ] `lib/generators.js` with shared generation functions
- [ ] `lib/validators.js` with schema and reference validation
- [ ] `package.json` with npm scripts
- [ ] Updated README with build instructions
- [ ] `.gitignore` for build/ directory

**Resources:**
- 1 developer, 10-14 days
- Node.js knowledge required
- Familiarity with courses.json structure

**Testing:**
```bash
npm run build           # Should generate all artifacts
npm run build:validate # Should catch data errors
npm run build:watch    # Should rebuild on file changes
```

**Success Criteria:**
- Single `npm run build` replaces 3 manual commands
- All validation errors are caught and reported clearly
- Watch mode enables real-time development
- 0 breaking changes to existing workflows

**Risk Factors:**
- Low: Runs alongside existing process, non-breaking
- Could be abandoned if build.js fails, manual steps still work

---

## Phase 2: Data Integrity (Weeks 3-5)

### 01-DATA-MODEL.md — Add Stable IDs & Schema Validation

**Why After Build Process:**
- Build system validates new schema immediately
- Gradual migration possible (IDs added, names still work)
- Enables Phase 3 refactoring

**Deliverables:**
- [ ] JSON schema definition (in repo)
- [ ] Update courses.json with stable IDs (all 64 courses)
- [ ] Update curricula to reference by ID
- [ ] Update outlines/manifest.json to reference by ID
- [ ] Update JavaScript generation to use IDs
- [ ] Update HTML dashboard to use IDs
- [ ] Migration guide for future data changes
- [ ] Documentation of ID naming convention

**Resources:**
- 1-2 developers, 10-15 days
- One person updates data files
- One person updates generation scripts and dashboard

**Implementation Steps:**
1. Define schema in `data/schema.json`
2. Add validation to `lib/validators.js`
3. Add IDs to courses.json (non-breaking, names still work)
4. Gradually update references:
   - Phase 2a: curricula → use IDs
   - Phase 2b: manifest.json → use IDs
   - Phase 2c: JavaScript generation → use IDs
   - Phase 2d: Dashboard → use IDs

**Testing:**
- Validation catches missing IDs
- Dashboard still works during migration
- No broken references
- Name-to-ID lookup works as fallback

**Success Criteria:**
- All 64 courses have stable IDs
- All curricula reference by ID
- Schema validates all data
- No broken references

**Risk Factors:**
- Medium: References could become inconsistent during migration
- Mitigation: Validation catches errors, phased approach

---

## Phase 3: Code Quality & Maintainability (Weeks 6-9)

### 03-CODE-ARCHITECTURE.md — Modularize Frontend

**Why After Data Model:**
- Stable IDs make component props cleaner
- Build process validates data passed to components
- Can create thorough tests

**Deliverables:**
- [ ] Folder structure (src/, js/, css/, components/)
- [ ] Extract CSS to separate files (6 files)
- [ ] Create DataStore module
- [ ] Create loader.js for courses.json
- [ ] Create component classes:
  - [ ] CourseCard
  - [ ] CurriculumNav
  - [ ] CourseDetail
  - [ ] OutlineView
  - [ ] StatusBadge
  - [ ] ThemeManager
- [ ] Create main.js entry point
- [ ] Create status-main.js for status page
- [ ] Update HTML files (minimal, module-based)
- [ ] Add unit tests for components
- [ ] Optional: Add module bundler (Webpack/Vite)

**Resources:**
- 2 developers, 15-20 days
- Frontend experience required
- ES6 modules knowledge
- Optional: CSS-in-JS or module bundler experience

**Implementation Approach:**
- **Week 6**: Extract CSS, create DataStore, update main.js
- **Week 7**: Create 2-3 major components, test them
- **Week 8**: Create remaining components, refactor HTML
- **Week 9**: Polish, optimize, add bundler if desired

**Testing:**
- Each component tested independently
- Overall integration tests
- Performance benchmarks (load time, memory)
- Regression testing (dashboard still works)

**Success Criteria:**
- index.html < 100 lines (was 900+)
- All logic in reusable components
- Components can be tested independently
- Test coverage > 80%
- No performance regression

**Risk Factors:**
- High: Large refactoring, many moving parts
- Mitigation: Gradual component extraction, keep old code until new works
- Could take longer if issues discovered

---

## Timeline Gantt Chart

```
Week 1  |████|     Build Process Foundation
        |  ████|   Build Process Testing
Week 2  |    ████| Build Process Polish
        |       |
Week 3  |       ████| Data Model: Schema
        |         ████| Data Model: Add IDs to courses
Week 4  |           ████| Data Model: Update curricula
        |             ████| Data Model: Update generation
Week 5  |               ████| Data Model: Update dashboard
        |                 |
Week 6  |                 ████| Code: Extract CSS
        |                   ████| Code: Create DataStore
Week 7  |                     ████| Code: Create components
        |                       ████| Code: Component tests
Week 8  |                         ████| Code: Refactor HTML
        |                           ████| Code: Integration tests
Week 9  |                             ████| Code: Optimization
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

### Phase 1 (Build Process)
- [ ] `npm run build` executes without errors
- [ ] Validation catches all invalid data
- [ ] Build time < 2 seconds
- [ ] Watch mode works correctly

### Phase 2 (Data Model)
- [ ] All 64 courses have stable IDs
- [ ] Zero broken references detected
- [ ] Schema validation passes 100% of data
- [ ] Migration guide is clear and followable

### Phase 3 (Code Architecture)
- [ ] Main HTML file < 100 lines
- [ ] 6+ reusable components created
- [ ] Component test coverage > 80%
- [ ] Page load time < 2 seconds
- [ ] Dashboard functionality unchanged

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

## Appendix: Detailed Task Breakdown

### Phase 1 Tasks (Weeks 1-2)

**Week 1:**
- [ ] Create build.js skeleton
- [ ] Implement courses.js generator
- [ ] Implement outlines.js generator
- [ ] Create initial validators
- [ ] Test with current courses.json

**Week 2:**
- [ ] Add syllabi HTML generator
- [ ] Add comprehensive validators
- [ ] Implement error reporting
- [ ] Add --watch mode
- [ ] Write documentation
- [ ] Test entire pipeline

### Phase 2 Tasks (Weeks 3-5)

**Week 3:**
- [ ] Define JSON schema
- [ ] Add schema validator to build.js
- [ ] Add IDs to all 64 courses in courses.json
- [ ] Test schema validation

**Week 4:**
- [ ] Update curricula array to use course IDs
- [ ] Update outlines/manifest.json to use course IDs
- [ ] Update generation scripts to use IDs
- [ ] Test all references resolve correctly

**Week 5:**
- [ ] Update index.html dashboard to use IDs
- [ ] Update status.html to use IDs
- [ ] Remove name-based lookups
- [ ] Write migration guide for future changes

### Phase 3 Tasks (Weeks 6-9)

**Week 6:**
- [ ] Create src/ folder structure
- [ ] Extract CSS to separate files
- [ ] Create DataStore module
- [ ] Create loader.js
- [ ] Create ThemeManager component

**Week 7:**
- [ ] Create CourseCard component
- [ ] Create CurriculumNav component
- [ ] Create OutlineView component
- [ ] Write unit tests
- [ ] Document component API

**Week 8:**
- [ ] Create CourseDetail component
- [ ] Create StatusBadge component
- [ ] Refactor main.js
- [ ] Integration testing
- [ ] Performance benchmarking

**Week 9:**
- [ ] Optimize bundle size
- [ ] Final testing and QA
- [ ] Update documentation
- [ ] Prepare for production deployment

---

**Next Step:** Present this roadmap to stakeholders for approval, assign developers, and begin Phase 1.
