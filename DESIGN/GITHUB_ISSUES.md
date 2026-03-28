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

## Issue #3: Extract CSS and JS into Separate Files

**Title:** Architecture: Extract CSS and JS into Separate Files

**Labels:** `architecture`, `enhancement`, `refactoring`

**Milestone:** Phase 3: Code Quality & Maintainability

**Assignee:** (TBD)

**Status:** ✅ Completed (merged via PR #8)

**Body:**

### Priority
🔴 High - Foundation for further modularization

### Effort
1 week (single developer)

### Description
Extract all inline CSS and JavaScript from the monolithic HTML files into separate, organized files loaded via `<link>` and `<script>` tags. Both HTML files become thin shells (~50 lines each). All files remain plain `<script>` tags — no ES6 modules — to preserve `file://` protocol compatibility.

### What Was Delivered

**Phase 1 — CSS extraction (4 files):**
- `css/variables.css` — shared color system / theme variables
- `css/base.css` — shared reset, header, footer, auth gate, membership tags
- `css/dashboard.css` — dashboard-specific: two-column layout, nav panel, curriculum groups, detail panel, outline display
- `css/status.css` — status page-specific: summary bar, progress bars, filter chips, data table, status pills/dropdowns

**Phase 2 — JS extraction (4 files):**
- `js/auth.js` — shared SHA-1 password gate with session persistence
- `js/theme.js` — shared light/dark toggle with localStorage sync
- `js/dashboard.js` — syllabiMap, courseLookup, curriculumMap, all dashboard build/render/select functions
- `js/status-main.js` — membershipMap, contentData, summary/progress/table rendering, dropdown/filter logic

**HTML shells rewritten:**
- `index.html` — 877 lines → 57 lines
- `status.html` — 502 lines → 48 lines

### Project Structure After This Issue
```
tracking/repo/
├── index.html          # Thin shell (~57 lines)
├── status.html         # Thin shell (~48 lines)
├── css/
│   ├── variables.css   # Shared theme variables
│   ├── base.css        # Shared base styles
│   ├── dashboard.css   # Dashboard-specific styles
│   └── status.css      # Status page-specific styles
├── js/
│   ├── auth.js         # Shared auth gate
│   ├── theme.js        # Shared theme toggle
│   ├── dashboard.js    # Dashboard page logic
│   └── status-main.js  # Status page logic
├── courses.js          # Auto-generated data bundle
├── outlines/
│   └── outlines.js     # Auto-generated outline bundle
└── ...
```

### Deferred to Future Issues
- **JS component modularization** → Issue #10
- **Curriculum reference restructuring** → Issue #11

### Related Issues
Depends on: #1 (Build Process), #2 (Data Model)
Enables: #10 (JS Modularization), #11 (Curriculum Refs)

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

## Issue #5: (User-created — see GitHub)

> Issue #5 was created manually on GitHub. Check https://github.com/apprenti-org/curriculum-tracking/issues/5 for details.

---

## Issue #10: JS Component Modularization

**Title:** Architecture: JS Component Modularization

**Labels:** `architecture`, `enhancement`, `refactoring`

**Milestone:** Phase 3: Code Quality & Maintainability

**Assignee:** (TBD)

**Body:**

### Priority
🟡 Medium - Improves maintainability, not blocking other work

### Effort
2-3 weeks (single developer)

### Description
Break the monolithic `dashboard.js` (~330 lines) and `status-main.js` (~155 lines) into smaller, focused script files. Each file handles one responsibility (nav builder, detail panel renderer, outline renderer, shared utilities). All files remain plain `<script>` tags for `file://` compatibility — no ES6 modules.

This was deferred from Issue #3, which completed the CSS/JS extraction but kept each page's logic in a single JS file.

### Current State (after Issue #3)
- `js/dashboard.js` — contains syllabiMap, courseLookup, curriculumMap, courseStatusIcon(), buildDashboard(), buildCurriculumSummary(), buildNavItemFromCourse(), selectCourse(), and initialization
- `js/status-main.js` — contains STATUSES, membershipMap, contentData, computeSummary(), renderSummary(), renderProgress(), renderTable(), toggleDropdown(), setStatus(), setFilter(), and initialization

### Proposed Structure
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

### Acceptance Criteria
- [ ] No single JS file exceeds ~100 lines
- [ ] Shared utilities reused across both pages
- [ ] All functionality preserved (zero regressions)
- [ ] Works over `file://` protocol (no ES6 modules)
- [ ] Script load order documented in HTML comments

### Related Issues
Depends on: #3 (CSS/JS Extraction)
Deferred from: #3

---

## Issue #11: Curriculum Reference Restructuring

**Title:** Data Model: Curriculum Reference Restructuring

**Labels:** `architecture`, `data-model`, `enhancement`

**Milestone:** Phase 2: Data Integrity

**Assignee:** (TBD)

**Body:**

### Priority
🟡 Medium - Reduces data duplication, completes ID migration

### Effort
1-2 weeks (single developer)

### Description
Curricula in `courses.json` currently embed course objects with `name`, `hoursOverride`, and `note` fields. Now that stable IDs exist (Issue #2), restructure these to reference courses by ID only, with overrides kept minimal. Update the dashboard and status page lookups to resolve course data from the ID.

This was deferred from Issue #2, which added IDs but kept the existing reference format to avoid breaking changes.

### Current Format (courses.json curricula)
```json
{
  "name": "Cloud Operations Specialist",
  "groups": [
    {
      "name": "Foundation",
      "courses": [
        { "name": "Student Onboarding", "id": "student-onboarding" },
        { "name": "Professional Communication", "id": "professional-communication" },
        { "name": "Introduction to Cloud Technology", "id": "intro-to-cloud-technology", "hoursOverride": 20 }
      ]
    }
  ]
}
```

### Proposed Format
```json
{
  "name": "Cloud Operations Specialist",
  "groups": [
    {
      "name": "Foundation",
      "courses": [
        "student-onboarding",
        "professional-communication",
        { "id": "intro-to-cloud-technology", "hoursOverride": 20 }
      ]
    }
  ]
}
```

Course refs become either a plain ID string (common case) or an object with `id` + overrides (when needed). The `name` field is dropped from refs since it can be resolved from the course's master entry.

### Deliverables
- [ ] Update curricula format in `courses.json`
- [ ] Update `lib/validators.js` to validate new format
- [ ] Update `lib/generators.js` to resolve refs
- [ ] Update `js/dashboard.js` curriculum map builder
- [ ] Update `js/status-main.js` membership map builder
- [ ] Update `data/schema.json` with new ref format
- [ ] Update `DESIGN/MIGRATION-GUIDE.md`
- [ ] Run `node build.js` — zero errors

### Acceptance Criteria
- [ ] All curriculum course refs use IDs (no `name` field in refs)
- [ ] Simple refs are plain strings, override refs are `{ id, hoursOverride?, note? }`
- [ ] Dashboard and status page render identically
- [ ] Build validation passes with zero errors
- [ ] Cross-reference warnings for Cloud Ops resolved (6 mismatched names from Issue #2)

### Related Issues
Depends on: #2 (Data Model), #3 (CSS/JS Extraction)
Deferred from: #2

---

## Issue Status Summary

| Issue | Title | Status |
|-------|-------|--------|
| #1 | Build Process | ✅ Merged |
| #2 | Data Model & Stable IDs | ✅ Merged |
| #3 | CSS/JS Extraction | ✅ Merged |
| #4 | Architecture Documentation | ✅ Merged |
| #5 | (See GitHub) | Open |
| #10 | JS Component Modularization | Open |
| #11 | Curriculum Reference Restructuring | Open |

---

## Links to Design Documents

All detailed specifications are in the `tracking/DESIGN/` folder:
- [ARCHITECTURE_REVIEW.md](./ARCHITECTURE_REVIEW.md) - Complete system analysis
- [01-DATA-MODEL.md](./01-DATA-MODEL.md) - Data model design
- [02-BUILD-PROCESS.md](./02-BUILD-PROCESS.md) - Build system design
- [03-CODE-ARCHITECTURE.md](./03-CODE-ARCHITECTURE.md) - Frontend modularization
- [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) - Implementation timeline
- [README.md](./README.md) - Navigation guide

---

**Last updated:** March 28, 2026
