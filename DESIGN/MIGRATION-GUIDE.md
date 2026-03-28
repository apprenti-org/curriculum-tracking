# Migration Guide: Stable Course IDs & Curriculum References

## Overview

Every course has a stable `id` field (kebab-case slug) that serves as its permanent identifier. The `name` field remains the human-readable display label and can be changed freely.

Curriculum references now use IDs instead of names. This eliminates data duplication and ensures refs stay valid when courses are renamed.

## Rules

1. **IDs never change.** Once a course has an `id`, that ID is permanent. It doesn't matter if the course is renamed, reorganized, or restructured.

2. **Names can change.** Update the `name` field whenever you want — the dashboard will display the new name, and all references via `id` continue to work.

3. **New courses need an ID.** When adding a course to `courses.json`, generate a kebab-case slug from the initial name. Convention: lowercase, hyphens for spaces, no special characters (e.g., `"Introduction to AWS Cloud Platform"` → `"introduction-to-aws-cloud-platform"`).

4. **IDs must be unique.** The build validator will reject duplicate IDs.

5. **IDs must be kebab-case.** Only lowercase letters, numbers, and hyphens. Pattern: `^[a-z0-9-]+$`

## Where IDs are used

| File | Field | Notes |
|---|---|---|
| `courses.json` → courses[] | `id` | Primary definition |
| `courses.json` → curricula[] → courses/groups | ID-based courseRef | Links curriculum entries to courses |
| `outlines/manifest.json` | `id` on each entry | Links outline files to courses |
| `courses.js` (generated) | `courseStatusMap` keyed by both `name` and `id` | Dual lookup |
| `courses.js` (generated) | `curriculaData` with resolved refs | ID refs expanded to `{ name, id }` at build time |
| `index.html` | `data-course-id` on nav items, `courseLookup` keyed by both | ID-first lookup with name fallback |
| `status.html` | `membershipMap` keyed by `id` with name fallback | |

## Curriculum course reference format

Curriculum entries in `courses.json` reference courses using one of three formats:

### Simple ref (most common)
A plain ID string — used when no per-curriculum overrides are needed:
```json
"courses": ["linux-foundations", "comptia-network-plus"]
```

### Override ref
An object with `id` plus per-curriculum overrides:
```json
"courses": [
  { "id": "comptia-a-plus", "hoursOverride": 96 },
  { "id": "java-language-fundamentals", "hoursOverride": 44, "note": "Reduced from 56h" }
]
```

### Legacy name-only ref (deprecated)
An object with `name` but no `id` — used for unresolved references that haven't been mapped to a course yet. These generate build warnings:
```json
"courses": [
  { "name": "Network Fundamentals", "hoursOverride": 80 }
]
```

### Build-time resolution
The build process (`node build.js`) resolves ID refs into full objects in the generated `courses.js`. Simple string refs like `"linux-foundations"` become `{ "name": "Linux Foundations", "id": "linux-foundations" }`. This means the frontend always receives the same `{ name, id, hoursOverride?, note? }` shape regardless of which format is used in `courses.json`.

## How to rename a course

1. Change the `name` field in `courses.json` (in the courses array)
2. Run `node build.js`
3. The dashboard will show the new name everywhere

You do **not** need to update curriculum refs — they reference by ID, so renames propagate automatically at build time.

## How to add a new course

1. Pick an ID: take the course name, lowercase it, replace spaces/special chars with hyphens
2. Add the course to `courses.json` with the `id` as the first field
3. If adding to a curriculum, add the course ID as a string ref (or `{ "id": "...", "hoursOverride": N }` if overrides are needed)
4. If creating an outline, add an entry to `outlines/manifest.json` with `file`, `course`, and `id`
5. Run `node build.js`

## How to add a course to a curriculum

Use the course's `id` field. For a simple ref with no overrides:
```json
"courses": ["existing-course", "new-course-id"]
```

For a ref with per-curriculum hour override:
```json
"courses": [{ "id": "new-course-id", "hoursOverride": 40 }]
```

## Schema

The formal JSON Schema definition is at `data/schema.json`. It defines:

- Required course fields: `id`, `name`, `status`
- Status enum values: "Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"
- Curriculum structure: either `groups` (with nested courseRefs) or flat `courses` array
- CourseRef formats: plain ID string, `{ id, hoursOverride?, note? }`, or legacy `{ name, hoursOverride?, note? }`

## Known data issues

The Cloud Operations Specialist curriculum has 6 legacy name-only refs that don't match any course in the system ("Network Fundamentals", "Linux Fundamentals", "Database Technologies", "Security Fundamentals", "Python Programming", "Cloud Essentials"). These are pending curriculum review — once the correct courses are identified, they should be migrated to ID-based refs.

---

**Last updated:** March 28, 2026
