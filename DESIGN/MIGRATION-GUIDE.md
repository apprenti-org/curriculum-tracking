# Migration Guide: Stable Course IDs

## Overview

Every course now has a stable `id` field (kebab-case slug) that serves as its permanent identifier. The `name` field remains the human-readable display label and can be changed freely.

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
| `courses.json` → curricula[] → courses/groups | `id` on each courseRef | Links curriculum entries to courses |
| `outlines/manifest.json` | `id` on each entry | Links outline files to courses |
| `courses.js` (generated) | `courseStatusMap` keyed by both `name` and `id` | Dual lookup |
| `index.html` | `data-course-id` on nav items, `courseLookup` keyed by both | ID-first lookup with name fallback |
| `status.html` | `membershipMap` keyed by `id` with name fallback | |

## How to rename a course

1. Change the `name` field in `courses.json` (in the courses array)
2. Update the `name` in any curricula courseRef entries (the `id` stays the same)
3. Run `node build.js`
4. The dashboard will show the new name everywhere

You do **not** need to touch `outlines/manifest.json`, outline JSON files, or syllabus HTML files — they all reference by `id` or filename, not by display name.

## How to add a new course

1. Pick an ID: take the course name, lowercase it, replace spaces/special chars with hyphens
2. Add the course to `courses.json` with the `id` as the first field
3. If adding to a curriculum, include both `name` and `id` in the courseRef
4. If creating an outline, add an entry to `outlines/manifest.json` with `file`, `course`, and `id`
5. Run `node build.js`

## Schema

The formal JSON Schema definition is at `data/schema.json`. It defines:

- Required course fields: `id`, `name`, `status`
- Status enum values: "Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"
- Curriculum structure: either `groups` (with nested courseRefs) or flat `courses` array
- CourseRef: `name` (required), `id` (recommended), `hoursOverride` (optional)

## Known data issues

The Cloud Operations Specialist curriculum references 6 courses by names that don't match any course in the courses array ("Network Fundamentals", "Linux Fundamentals", etc.). These entries don't have IDs because there's no matching course to link to. This should be resolved by either adding those courses or correcting the names.

---

**Last updated:** March 28, 2026
