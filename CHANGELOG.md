# Changelog

All notable changes to the Curriculum Tracking Dashboard are documented here.

Format follows [Semantic Versioning](https://semver.org/): `MAJOR.MINOR.PATCH`
- **MAJOR** — breaking changes to data format or dashboard behavior
- **MINOR** — new features, new pages, structural improvements
- **PATCH** — bug fixes, content updates, cosmetic changes

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

_Changes that have been merged to main but not yet tagged as a release._
