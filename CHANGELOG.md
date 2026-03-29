# Changelog

All notable changes to the Curriculum Tracking Dashboard are documented here.

Format follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- **MAJOR** — breaking changes to data format or dashboard behavior
- **MINOR** — new features, new pages, structural improvements
- **PATCH** — bug fixes, content updates, cosmetic changes

---

## [0.2.0] — 2026-03-29

### Added
- **Course overview data pipeline** — `course-overview.json` compiles gap analysis coverage %, source asset counts, outline/syllabus stats, and document readiness for all 64 courses
- `course-overview.js` bundle auto-generated via `build.js` from the JSON source
- `generate-course-overview.py` script scans outlines and source folders to produce the overview
- Status page: **6 new table columns** — Docs (linked icons), Content Coverage (%), Lessons, Slides, Quizzes, Activities, Total Assets
- Status page: **2 new summary cards** — Avg Content Coverage, Source Assets
- Status page: **Content Coverage progress bar** in the progress section
- Status page: **2 new filter chips** — "Has Content" and "No Outline"
- Docs column icons link to resources: outline → dashboard, syllabus → HTML syllabus, source → Google Drive
- Gap analysis links on dashboard and status page pointing to Google Drive folder
- AI Foundations added to gap analysis map
- Version badge now links to changelog

### Infrastructure
- `lib/generators.js` — added `generateOverviewBundle` for course-overview.js
- `build.js` — overview bundle added to three-stage pipeline
- `course-overview.json` added to tracking repo as a data source

---

## [0.1.0] — 2026-03-28

Initial versioned release. Captures the cumulative work from Issues #1–#5.

### Added
- Versioning system with semver, changelog, and version badge in site header (#5)
- Automated build system with three-stage pipeline: Load → Validate → Generate (#1)
- Stable course IDs (kebab-case) across all 64 courses (#2)
- JSON schema validation for courses.json (`data/schema.json`) (#2)
- ID-based lookups in dashboard and status page (#2)
- CSS and JS extracted into separate files from inline HTML (#3)
- Architecture design docs (`DESIGN/`) updated to reflect implementation (#4)
- Course outline rendering in dashboard detail panel
- Curriculum accordion navigation with group support
- Status page with summary cards, progress bars, and filter chips
- Dark/light theme toggle with persistence
- Password-gated authentication
- 64 courses across 7 curricula loaded and tracked

### Infrastructure
- `build.js` orchestrates validation and generation
- `lib/validators.js` — schema, cross-reference, syllabus, and outline validation
- `lib/generators.js` — courses.js and outlines.js bundle generation
- Watch mode (`--watch`) for development
- Migration guide (`DESIGN/MIGRATION-GUIDE.md`)

---

## [Unreleased]

_Changes merged to main but not yet tagged._
