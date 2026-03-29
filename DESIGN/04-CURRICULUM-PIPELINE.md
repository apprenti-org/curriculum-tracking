# Design Document: Curriculum Development Pipeline

**Status:** Draft
**Issue:** #23 — Add curriculum development pipeline tracking
**Branch:** `23-curriculum-pipeline`
**Priority:** High
**Depends on:** Data model (01), Build process (02)

---

## Problem

The dashboard tracks **courses** individually with two status fields (`design`, `development`). There is no way to:

1. View a curriculum as a pipeline — from DOL standard through LMS deployment
2. See which stage each course is in within the context of a curriculum's groups
3. Trace the relationship between source documents and working documents for each course
4. Get an aggregate read on how close a curriculum is to being deliverable

The Operations Support Specialist — Network curriculum (Appendix A-28) is the first full curriculum to enter the pipeline and needs to be tracked end-to-end.

---

## Pipeline Stages

A course moves through these stages in order. Each stage has a clear definition and artifact that marks it as complete.

| Stage | Definition | Completion Artifact |
|-------|-----------|-------------------|
| **Source** | Source materials identified and inventoried | `driveFolder` populated, source docs linked |
| **Design** | Outline and syllabus created, hours confirmed | `outline` JSON exists, `syllabus` HTML exists |
| **Development** | Module/lesson content being authored | Course folder populated in `courses/[slug]/modules/` |
| **Review** | Content reviewed for accuracy and completeness | Review sign-off recorded |
| **Deployment** | Content packaged and published to LMS | LMS course ID recorded |

A curriculum-level status is derived by aggregating the stages of its member courses.

### Stage Mapping to Existing Status Fields

The current `status.design` and `status.development` fields map into the new pipeline as follows:

| Current Field | Current Values | Pipeline Stage |
|---|---|---|
| `status.design` = "Not Started" | — | **Source** (or earlier) |
| `status.design` = "Scoping" | — | **Source** |
| `status.design` = "In Progress" | — | **Design** |
| `status.design` = "Needs Review" / "In Review" | — | **Design** |
| `status.design` = "Complete" | — | Design complete → ready for **Development** |
| `status.development` = "In Progress" | — | **Development** |
| `status.development` = "Complete" | — | Development complete → ready for **Review** |

No new status values are needed. The pipeline stage is **computed** from the existing fields plus the presence of artifacts (outline JSON, syllabus HTML, driveFolder, etc.). This means zero migration cost — the pipeline view reads the same data the status page already uses.

### Future Stages: Review and Deployment

The current data model doesn't track review sign-off or LMS deployment. When those stages are needed, add:

```json
"status": {
  "design": "Complete",
  "development": "Complete",
  "review": "Not Started",
  "deployment": "Not Started"
}
```

This is additive — existing validators and UI won't break. Defer until at least one course reaches the review stage.

---

## Document Relationships

Each course has source documents (read-only, in `_COURSES/` or Google Drive) and working documents (in `_COURSES Phase 1 - WORKNG/`). The pipeline view should display these per course.

### Source Documents (read-only)

Tracked in existing fields on each course entry:

| Field | Description | Example |
|---|---|---|
| `driveFolder` | Google Drive source folder URL | `https://drive.google.com/drive/folders/...` |
| `syllabus` | Syllabus document reference (name or URL) | `"Syllabus: Linux Foundations"` |
| `outline` | Outline reference (name or boolean) | `true` or `"Course Outline: Linux Foundations"` |
| `note` | Free-text status/content notes | `"Has outline and syllabus"` |

### Working Documents (generated/authored)

Derived from the filesystem and tracking data:

| Document | Location | Detection |
|---|---|---|
| Outline JSON | `outlines/[id].json` | Check `outlines/manifest.json` |
| Syllabus HTML | `syllabi/[slug].html` | Check `syllabiMap` in constants.js |
| Gap Analysis | Google Drive | Check `gapAnalysisMap` in constants.js |
| Course Manifest | `courses/[slug]/manifest.md` | Check filesystem |
| Course Outline MD | `courses/[slug]/course-outline-*.md` | Check filesystem |
| Syllabus MD | `courses/[slug]/syllabus-*.md` | Check filesystem |

### Curriculum-Level Documents

Tracked on the curriculum entry:

| Document | Description | Field |
|---|---|---|
| DOL Standard (source) | Appendix PDF — the governing document | `standard.sourceUrl` |
| Standard Markdown | Extracted reference copy | `standard.markdownReference` |
| Curriculum Mapping | Narrative design doc | Linked from curriculum folder |
| Curriculum JSON | Formal group/course definition | `curricula/[slug]/curriculum.json` |

---

## Data Model Changes

### Curriculum Entry — Add `standard` and `slug`

```json
{
  "name": "Operations Support Specialist — Network",
  "slug": "operations-support-specialist",
  "standard": {
    "appendix": "A-28",
    "sourceUrl": "https://drive.google.com/file/d/1isKeFCUGEJw1lwbsFOGY59WXBYI1dLp0/view",
    "markdownReference": "_STANDARDS/A-28 Operations Support Specialist - Network.md"
  },
  "groups": [ ... ]
}
```

**New fields on curriculum:**

| Field | Type | Required | Description |
|---|---|---|---|
| `slug` | string | Yes (new curricula) | Kebab-case identifier, matches `curricula/[slug]/` folder |
| `standard` | object | No | Governing DOL standard reference |
| `standard.appendix` | string | — | Appendix number (e.g. "A-28") |
| `standard.sourceUrl` | string | — | URL to authoritative source PDF |
| `standard.markdownReference` | string | — | Path to extracted markdown in `_STANDARDS/` |

**No changes to course entries.** Pipeline stage is computed from existing fields.

### Schema Update

Add to `data/schema.json` under curriculum definition:

```json
"slug": {
  "type": "string",
  "pattern": "^[a-z0-9-]+$"
},
"standard": {
  "type": "object",
  "properties": {
    "appendix": { "type": "string" },
    "sourceUrl": { "type": "string", "format": "uri" },
    "markdownReference": { "type": "string" }
  }
}
```

---

## Dashboard: Curriculum Pipeline Page

### New Page: `curriculum.html`

A third page alongside `index.html` (course dashboard) and `status.html` (design & dev status). Linked from both via the header nav.

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  Curriculum Development Pipeline         [← Dashboard]  │
│  Track curricula from source through deployment         │
├─────────────────────────────────────────────────────────┤
│  ┌─ Curriculum Selector ──────────────────────────────┐ │
│  │  [Operations Support Specialist — Network ▼]       │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Standard ─────────────────────────────────────────┐ │
│  │  Appendix A-28 · 560h RTI min · 2,000h OJT        │ │
│  │  [Source PDF]  [Markdown Reference]                │ │
│  └────────────────────────────────────────────────────┘ │
│                                                         │
│  ┌─ Pipeline Summary ────────────────────────────────┐  │
│  │  ████████████░░░░░░░░  12/18 courses designed     │  │
│  │  Source: 18  Design: 12  Dev: 3  Review: 0  LMS: 0│  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Group 1: Core Systems & Networking (176h) ──────┐  │
│  │  RTI Area 1 · 2 courses · 176h                    │  │
│  │                                                    │  │
│  │  ┌─ Linux Foundations (80h) ── DESIGN ──────────┐ │  │
│  │  │  Source: [Drive Folder]                      │ │  │
│  │  │  Working: [Outline JSON] [Syllabus HTML]     │ │  │
│  │  │           [Gap Analysis] [Course Manifest]   │ │  │
│  │  │  Design: Needs Review · Dev: Not Started     │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  │                                                    │  │
│  │  ┌─ CompTIA Network+ (96h) ── DESIGN ──────────┐ │  │
│  │  │  Source: [Drive Folder]                      │ │  │
│  │  │  Working: [Outline JSON] [Syllabus HTML]     │ │  │
│  │  │  Design: Needs Review · Dev: Not Started     │ │  │
│  │  └─────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─ Group 2: Reliability, Monitoring & Ops (132h) ──┐  │
│  │  ...                                              │  │
│  └───────────────────────────────────────────────────┘  │
│  ...                                                    │
└─────────────────────────────────────────────────────────┘
```

### Pipeline Stage Computation

```javascript
function computeStage(course) {
  const design = course.status?.design || 'Not Started';
  const development = course.status?.development || 'Not Started';
  const review = course.status?.review;
  const deployment = course.status?.deployment;

  if (deployment === 'Complete') return 'Deployed';
  if (deployment === 'In Progress') return 'Deploying';
  if (review === 'Complete') return 'Reviewed';
  if (review && review !== 'Not Started') return 'Review';
  if (development === 'Complete') return 'Developed';
  if (development !== 'Not Started') return 'Development';
  if (design === 'Complete') return 'Designed';
  if (design !== 'Not Started') return 'Design';
  if (course.driveFolder) return 'Source';
  return 'Not Started';
}
```

### Document Link Resolution

```javascript
function getDocumentLinks(courseId, course) {
  const docs = { source: {}, working: {} };

  // Source
  if (course.driveFolder) docs.source.driveFolder = course.driveFolder;

  // Working — check lookup maps
  const outlineEntry = outlineManifest.find(e => e.id === courseId);
  if (outlineEntry) docs.working.outlineJson = 'outlines/' + outlineEntry.file;

  if (syllabiMap[course.name]) docs.working.syllabusHtml = 'syllabi/' + syllabiMap[course.name];

  if (gapAnalysisMap[course.name]) {
    docs.working.gapAnalysis = GAP_ANALYSIS_DRIVE_FOLDER;
  }

  return docs;
}
```

---

## Build System Changes

### 1. Curricula Bundle

Currently curricula data is embedded in `courses.js`. No separate bundle needed — the pipeline page loads `courses.js` like the other pages do.

### 2. Validation Additions

Add to `lib/validators.js`:

- Warn if a curriculum has a `slug` that doesn't match a `curricula/[slug]/` folder
- Warn if a curriculum has a `standard.markdownReference` that doesn't exist on disk
- Validate `slug` follows kebab-case pattern

### 3. Watch Files

Add `curricula/*/curriculum.json` to the watch list in build.js (for `--watch` mode).

---

## File Changes Summary

| File | Change |
|---|---|
| `courses.json` | Add `slug` and `standard` to OSS curriculum entry |
| `data/schema.json` | Add `slug` and `standard` to curriculum schema |
| `curriculum.html` | New page — pipeline view |
| `css/curriculum.css` | New stylesheet — pipeline-specific styles |
| `js/curriculum/init.js` | New — page initialization |
| `js/curriculum/pipeline.js` | New — stage computation and rendering |
| `js/curriculum/documents.js` | New — document link resolution |
| `js/shared/constants.js` | No change (already has syllabiMap, gapAnalysisMap) |
| `lib/validators.js` | Add curriculum slug and standard validation |
| `index.html` | Add nav link to curriculum.html |
| `status.html` | Add nav link to curriculum.html |

---

## Implementation Order

1. **Data:** Add `slug` and `standard` to OSS entry in `courses.json`
2. **Schema:** Update `data/schema.json`
3. **Validation:** Add new checks to `lib/validators.js`
4. **Page scaffold:** Create `curriculum.html` with shared CSS/JS loading
5. **Pipeline logic:** `js/curriculum/pipeline.js` — stage computation
6. **Document resolver:** `js/curriculum/documents.js` — link assembly
7. **Renderer:** `js/curriculum/init.js` — DOM rendering
8. **Styles:** `css/curriculum.css`
9. **Navigation:** Link from index.html and status.html
10. **Build & verify**

---

## Out of Scope

- **LMS integration** — No Absorb API connection; deployment status is manually tracked
- **Apprenticeship completion tracking** — OJT progress, competency checklists, wage steps are employer-side
- **Automated stage advancement** — Stages are derived from existing data, not workflow automation
- **Reference restructuring** — The deferred Issue #11 work; this design works with existing field formats

---

## Decisions

1. **Start with OSS Network only.** Build the pipeline for Operations Support Specialist — Network first. This establishes the pattern. Other curricula adopt the same structure once proven.
2. **5-stage model confirmed:** Source → Design → Development → Review → Deployment.
3. **Defer `review` and `deployment` fields** until at least one course reaches those stages.
4. **Document types:** Source (Drive folder) + Working (outline JSON, syllabus HTML, gap analysis, course manifest) covers current needs.

---

**Last updated:** 2026-03-29
