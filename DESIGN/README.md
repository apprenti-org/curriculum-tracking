# Design & Architecture Documentation

This folder contains comprehensive design documents for improving the curriculum tracking dashboard.

## Documents

### 01-DATA-MODEL.md
**Priority:** 🔴 High | **Effort:** 2-3 weeks

Addresses foundational issues with the curriculum data model:
- No schema validation (accepts invalid data)
- Inconsistent reference types (string vs boolean vs null)
- Name-based identifiers (breaks if names change)
- Denormalized course membership

**Key recommendations:**
- Add stable course IDs (kebab-case slugs)
- Standardize reference format (type + filename)
- Define JSON schema for validation
- Migrate to ID-based references

**Impact:** Foundation for all other improvements. Without this, data integrity issues will persist.

---

### 02-BUILD-PROCESS.md
**Priority:** 🔴 High | **Effort:** 1-2 weeks

Modernizes the fragile manual build process:
- Multiple manual steps (users must remember 3+ commands)
- Duplicate code in generators
- No validation of generated output
- No error reporting

**Key recommendations:**
- Create build.js with configuration
- Extract shared generator functions
- Add comprehensive validation
- Support --watch mode for development
- Add npm scripts for common tasks

**Impact:** Enables easier course additions, catches errors early, improves developer experience.

---

### 03-CODE-ARCHITECTURE.md
**Priority:** 🔴 High | **Status:** Phase 1 (CSS/JS extraction) ✅ Complete

Original design called for full ES6 modularization. Actual implementation was scoped to work with `file://` protocol constraints:

**Completed (Issue #3):**
- Extracted CSS into 4 organized files (`css/`)
- Extracted JS into 4 organized files (`js/`)
- Both HTML files reduced to ~50-line thin shells
- Shared code reused across pages (auth, theme)

**Remaining (Issues #10, #11):**
- Further JS modularization into focused components
- Curriculum reference restructuring to ID-only format

---

### ARCHITECTURE_REVIEW.md
Comprehensive review of the entire system with:
- Detailed analysis of 8 major areas
- Current problems and proposed solutions
- Priority roadmap (immediate, short-term, medium-term)
- Summary scorecard

---

## Quick Start: Pick Your First Improvement

### If you want **immediate, high-impact results:**
→ Start with **02-BUILD-PROCESS.md**
- Takes 1-2 weeks
- Immediately improves developer experience
- Enables easier course additions
- Doesn't break existing functionality

### If you want **long-term scalability:**
→ Start with **01-DATA-MODEL.md**
- Takes 2-3 weeks
- Foundation for everything else
- Prevents data integrity issues as catalog grows
- Required before modularizing frontend

### If you want **better code quality:**
→ Start with **03-CODE-ARCHITECTURE.md**
- Takes 3-4 weeks
- Makes code maintainable and testable
- Enables reuse across pages
- Improves performance (lazy loading)

---

## Implementation Status

**Phase 1: Foundation ✅ Complete**
1. **Issue #1** — Build Process (PR #6 merged)
2. **Issue #2** — Data Model & Stable IDs (PR #7 merged)
3. **Issue #4** — Architecture Documentation (PR #5 merged)

**Phase 2: Code Quality — In Progress**
4. **Issue #3** — CSS/JS Extraction ✅ (PR #8 merged)
5. **Issue #5** — (see GitHub)
6. **Issue #10** — JS Component Modularization (open)
7. **Issue #11** — Curriculum Reference Restructuring (open)

**Phase 3: Advanced Features (Future)**
8. User-facing course editor
9. LMS integration (sync with Absorb)
10. Versioning and change tracking
11. Search and filtering

---

## Key Metrics to Track

As you implement these improvements, measure:

### Data Quality
- [ ] % of courses with valid schema
- [ ] % of courses with stable IDs
- [ ] % of broken references in database

### Build Process
- [ ] Build time (seconds)
- [ ] Build failure rate
- [ ] Manual steps required (goal: 1)

### Code Quality
- [ ] Test coverage %
- [ ] Lines of code in main file
- [ ] Cyclomatic complexity
- [ ] Number of reusable components

### Performance
- [ ] Initial page load time
- [ ] Time to interactive
- [ ] Memory usage
- [ ] Bundle size

---

## Questions & Decisions

### "Should we do all three at once?"
No. Start with one (02-BUILD-PROCESS recommended). Once that's stable, move to the next.

### "Can we migrate gradually?"
Yes. All three improvements are designed for phased rollouts:
- **Data Model**: Add IDs while keeping names, migrate references gradually
- **Build Process**: Create new build.js alongside manual steps, then deprecate manual
- **Code Architecture**: Extract components one-by-one, gradually replace string generation

### "What if we find new problems?"
Add new documents to this folder. Keep this README updated with the complete picture.

### "How do we decide priority between improvements?"
Use the Priority/Effort matrix:
- High Priority + Low Effort = Do First (Build Process)
- High Priority + High Effort = Do Second (Data Model)
- Medium Priority + High Effort = Do Later (Code Architecture for new features)

---

## Glossary

- **Schema validation**: Checking that data matches expected structure
- **Stable ID**: An identifier that doesn't change when other properties change
- **Idempotent build**: Running build multiple times produces same result
- **Lazy loading**: Loading data only when needed, not at startup
- **Component**: Reusable UI building block
- **DataStore**: Central location for managing application state
- **Observer pattern**: Notifying subscribers when data changes

---

## Contact

Questions about these designs? Check the detailed documents first — most answers are there.

For questions not covered, add a new document or update this README.

---

**Last updated:** March 28, 2026

See [GITHUB_ISSUES.md](./GITHUB_ISSUES.md) for full issue descriptions and [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md) for the detailed roadmap.
