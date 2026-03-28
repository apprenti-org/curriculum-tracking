# GitHub Issues Template

Use these formatted issues to create tasks on GitHub. Copy the content and create issues in https://github.com/apprenti-org/curriculum-tracking/issues

---

## Issue #1: Implement Automated Build System (build.js)

**Title:** Architecture: Implement Automated Build System (build.js)

**Labels:** `architecture`, `enhancement`, `high-priority`

**Milestone:** Phase 1: Foundation & Build Automation

**Assignee:** (TBD)

**Body:**

### Priority
🔴 High - Enables other improvements, immediate developer productivity gain

### Effort
1-2 weeks (single developer)

### Description
Modernize the fragile manual build process by creating a configuration-driven build system that replaces multiple manual commands with a single `npm run build`.

### Current Problems
- Multiple manual commands required (users must remember 3+ separate steps)
- Duplicate code in generation scripts (courses.js and outlines.js generators are similar)
- No validation of generated output
- No error reporting when builds fail
- Manual steps are different on each machine

### Solution
Create `build.js` with:
- Configuration-driven orchestration (`BUILD_CONFIG` object)
- Shared generator functions (`lib/generators.js`)
- Comprehensive validation pipeline (`lib/validators.js`)
- Clear error reporting and recovery
- `--watch` mode for development (`npm run build:watch`)
- npm scripts for common tasks

### Files
See detailed specification: [`DESIGN/02-BUILD-PROCESS.md`](./02-BUILD-PROCESS.md)

### Deliverables
- [ ] `build.js` - main build orchestrator
- [ ] `lib/generators.js` - shared generation functions
- [ ] `lib/validators.js` - schema and reference validation
- [ ] `lib/utils.js` - helper utilities
- [ ] `package.json` updated with scripts
- [ ] `.gitignore` for build/ output directory
- [ ] Updated README with build instructions
- [ ] All existing functionality preserved

### Acceptance Criteria
- [ ] Single `npm run build` command replaces all manual steps
- [ ] `npm run build:validate` validates data without generating
- [ ] `npm run build:watch` rebuilds on file changes
- [ ] All validation errors caught and reported clearly with helpful messages
- [ ] Build time < 2 seconds for normal case
- [ ] All existing tests pass
- [ ] Zero breaking changes to existing workflows
- [ ] Developer can build without reading 3+ commands

### Testing
```bash
npm run build           # Should generate all artifacts without errors
npm run build:validate # Should catch invalid data and report clearly
npm run build:watch    # Should auto-rebuild when files change
npm run clean          # Should remove build/ directory
```

### Success Metrics
- Build process is deterministic (same output every run)
- Validation catches 100% of invalid data
- Developers prefer `npm run build` to manual commands
- No more "I forgot which command to run" issues

### Related Issues
Depends on: (none)
Enables: #2 (Data Model), #3 (Code Architecture)

---

## Issue #2: Implement JSON Schema Validation & Stable Course IDs

**Title:** Architecture: Implement JSON Schema Validation & Stable Course IDs

**Labels:** `architecture`, `enhancement`, `high-priority`

**Milestone:** Phase 2: Data Integrity

**Assignee:** (TBD)

**Body:**

### Priority
🔴 High - Foundation for all other improvements

### Effort
2-3 weeks (1-2 developers)

### Description
Add data integrity to the curriculum system by implementing JSON schema validation and stable, ID-based course identifiers.

### Current Problems
- No schema validation - accepts invalid data silently
- Inconsistent data types (syllabus field: string, URL, or null?)
- Name-based identifiers (breaks if course names change)
- Denormalized course membership (only in curricula, not in courses)
- Data duplication across files (course names repeated)

### Solution
Implement:
1. **JSON Schema** - formal definition of data structure
2. **Stable Course IDs** - kebab-case slugs (e.g., `databases-in-java`)
3. **Reference Standardization** - unified format for syllabus/outline
4. **Validation Pipeline** - schema + reference + file existence checks

### Files
See detailed specification: [`DESIGN/01-DATA-MODEL.md`](./01-DATA-MODEL.md)

### Deliverables
- [ ] `data/schema.json` - JSON schema definition
- [ ] Add IDs to all 64 courses in `courses.json`
- [ ] Update `curricula` array to reference by ID
- [ ] Update `outlines/manifest.json` to reference by ID
- [ ] Add schema validation to build.js
- [ ] Update generation scripts to use IDs
- [ ] Update index.html dashboard to use IDs
- [ ] Update status.html to use IDs
- [ ] Migration guide for future data changes
- [ ] All tests passing with new schema

### Implementation Phases
**Phase 2a (non-breaking):** Add IDs to courses.json, keep names as secondary key
**Phase 2b:** Update curricula to reference by ID
**Phase 2c:** Update manifest.json to reference by ID
**Phase 2d:** Update generation scripts to use IDs
**Phase 2e:** Update dashboard to use IDs

### Acceptance Criteria
- [ ] All 64 courses have stable IDs (kebab-case)
- [ ] All curricula reference courses by ID
- [ ] All outline references use IDs
- [ ] Schema validation passes 100% of data
- [ ] Zero broken references detected by validator
- [ ] Dashboard still works during migration
- [ ] Renaming course doesn't break references
- [ ] Migration guide clear for future changes

### Testing
```bash
npm run build:validate # Should validate against schema
# Each phase has automated tests for reference consistency
```

### Success Metrics
- Data integrity: 0 broken references
- All courses have stable IDs that don't change
- Can rename courses without breaking anything
- Validation catches 100% of invalid data

### Related Issues
Depends on: #1 (Build Process)
Enables: #3 (Code Architecture)

---

## Issue #3: Modularize Frontend Code Architecture

**Title:** Architecture: Modularize Frontend Code Architecture (ES6 Modules)

**Labels:** `architecture`, `enhancement`, `refactoring`, `high-priority`

**Milestone:** Phase 3: Code Quality & Maintainability

**Assignee:** (TBD)

**Body:**

### Priority
🔴 High - Long-term maintainability and scalability

### Effort
3-4 weeks (2 developers recommended)

### Description
Break up the monolithic 900+ line HTML/JS file into a modular ES6 architecture with reusable components, proper separation of concerns, and lazy-loaded data.

### Current Problems
- Single 900+ line index.html with everything (HTML, CSS, JS)
- String-based component generation (hard to read, maintain)
- Global variables (data corruption risk)
- No code reuse between index.html and status.html
- No lazy loading (all 50+ outlines loaded at startup)
- No way to test components independently
- CSS duplicated in multiple files

### Solution
Implement:
1. **Modular Structure** - separate files for each component
2. **Reusable Components** - classes for CourseCard, OutlineView, etc.
3. **Central DataStore** - single source for application state
4. **Lazy Loading** - load outlines on demand
5. **Separation of Concerns** - data, components, UI, styling in separate files
6. **CSS Modules** - organized, maintainable stylesheets

### Files
See detailed specification: [`DESIGN/03-CODE-ARCHITECTURE.md`](./03-CODE-ARCHITECTURE.md)

### New Project Structure
```
src/
├── index.html
├── status.html
├── js/
│  ├── main.js                    # Entry point
│  ├── app/Dashboard.js
│  ├── components/
│  │  ├── CourseCard.js
│  │  ├── OutlineView.js
│  │  ├── CurriculumNav.js
│  │  └── ...
│  ├── data/DataStore.js
│  └── utils/
│     ├── formatters.js
│     └── validators.js
└── css/
   ├── variables.css
   ├── base.css
   ├── components.css
   └── ...
```

### Deliverables
- [ ] Create src/ folder structure
- [ ] Extract CSS to separate files (6+ files)
- [ ] Create DataStore module
- [ ] Create component classes (CourseCard, OutlineView, CurriculumNav, etc.)
- [ ] Create main.js entry point
- [ ] Update HTML files (minimal, module-based)
- [ ] Add unit tests for components (test coverage > 80%)
- [ ] Optional: Add module bundler (Webpack/Vite)
- [ ] Updated README with new architecture

### Implementation Timeline
**Week 6:** Extract CSS, create DataStore, update entry point
**Week 7:** Create 2-3 major components and tests
**Week 8:** Create remaining components, refactor HTML
**Week 9:** Optimize, final testing, prepare deployment

### Acceptance Criteria
- [ ] index.html < 100 lines (was 900+)
- [ ] All logic in reusable components
- [ ] 6+ reusable component classes created
- [ ] Each component testable independently
- [ ] Test coverage > 80%
- [ ] No performance regression
- [ ] Dashboard functionality unchanged
- [ ] Page load time < 2 seconds
- [ ] Outlines lazy-loaded on demand

### Testing
```bash
npm test                    # Run all component tests
npm run build               # Build still works
npm run build:watch        # Watch mode still works
# Manual testing: verify dashboard works same as before
```

### Success Metrics
- Code quality improved (maintainability, testability)
- Components are reusable across pages
- No performance regression
- Developer can add new features without touching giant file
- Codebase is scalable to hundreds of courses

### Related Issues
Depends on: #1 (Build Process), #2 (Data Model)
Enables: Future features (course editor, LMS integration)

---

## Issue #4: Comprehensive Architecture Documentation

**Title:** Documentation: Create Architecture Design Documentation

**Labels:** `documentation`, `architecture`, `design`

**Milestone:** Phase 1: Foundation & Build Automation

**Assignee:** (TBD)

**Body:**

### Description
Create comprehensive design documentation for proposed architecture improvements, including detailed specifications, migration paths, and implementation roadmaps.

### Deliverables
- [x] `DESIGN/01-DATA-MODEL.md` - Data model specification
- [x] `DESIGN/02-BUILD-PROCESS.md` - Build process specification
- [x] `DESIGN/03-CODE-ARCHITECTURE.md` - Frontend architecture specification
- [x] `DESIGN/ARCHITECTURE_REVIEW.md` - Complete system review
- [x] `DESIGN/IMPLEMENTATION_ROADMAP.md` - 9-week implementation timeline
- [x] `DESIGN/README.md` - Navigation guide
- [x] `DESIGN/GITHUB_ISSUES.md` - Issue templates

### Location
All documents in: `tracking/DESIGN/` folder (2,443 lines total)

### Success Criteria
- [ ] All design documents clear and actionable
- [ ] Implementation roadmap is realistic
- [ ] Team understands proposed improvements
- [ ] Go/no-go decision points defined

---

## How to Create These Issues

1. Go to https://github.com/apprenti-org/curriculum-tracking/issues/new
2. Copy the content from the issue above
3. Paste into the GitHub issue form
4. Add labels, milestone, and assignee
5. Click "Create issue"

**Recommended Order:**
1. Create Issue #1 (Build Process)
2. Create Issue #2 (Data Model)
3. Create Issue #3 (Code Architecture)
4. Create Issue #4 (Documentation)

---

## Links to Design Documents

All detailed specifications are in the `tracking/DESIGN/` folder:
- [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md) - Complete system analysis
- [01-DATA-MODEL.md](./01-DATA-MODEL.md) - Data model design
- [02-BUILD-PROCESS.md](./02-BUILD-PROCESS.md) - Build system design
- [03-CODE-ARCHITECTURE.md](./03-CODE-ARCHITECTURE.md) - Frontend modularization
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - 9-week timeline
- [README.md](./README.md) - Navigation guide

---

**Generated:** March 28, 2026
