# Design Document: Data Model

**Status:** ✅ Core implemented (Issue #2, PR #7 merged) — reference restructuring deferred to Issue #11
**Priority:** High (Foundation for all other improvements)
**Complexity:** Medium
**Estimated Effort:** 2-3 weeks for full migration
**Actual Effort:** ~1 week for core implementation

---

## Problems Identified

### 1. No Schema Validation
- No defined structure for course data
- Invalid values were silently accepted
- Status field accepted any string (should be enum)
- Hours field could be null (ambiguous meaning)

### 2. Inconsistent Reference Types
```json
// Problem: Same field, different types
"syllabus": "Syllabus: Advanced Python",      // String literal
"syllabus": "https://docs.google.com/...",    // URL
"syllabus": null,                              // Missing

"outline": "Course Outline: Name",             // String
"outline": true,                               // Boolean
"outline": null                                // Missing
```

### 3. Name-Based Identifiers
- Courses identified by name string
- If name changes, all references break
- No stable course ID
- Name duplication across files (courses.json, manifest.json, HTML)

### 4. Denormalized Course Membership
```json
// Course references only in curricula — no reverse lookup
"curricula": [
  {
    "name": "Software Development Java",
    "courses": ["Java Language Fundamentals", "JavaScript", ...]
  }
]
```

---

## What Was Implemented (Issue #2, PR #7)

### 1. Stable Course IDs ✅

All 64 courses now have a permanent kebab-case `id` field:
```json
{
  "id": "databases-in-java",
  "name": "Databases in Java",
  "hours": 40,
  "status": {
    "design": "Complete",
    "development": "Not Started"
  }
}
```

**Key rules:**
- IDs never change — names can be updated freely
- Pattern: `^[a-z0-9-]+$` (lowercase, numbers, hyphens only)
- Must be unique across all courses
- Convention: lowercase the initial name, replace spaces with hyphens
- Full rules documented in `DESIGN/MIGRATION-GUIDE.md`

### 2. JSON Schema ✅

Formal schema at `data/schema.json` (JSON Schema draft-07) defines:

- **Course required fields:** `id`, `name`, `status`
- **Status enum:** `["Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"]`
- **ID pattern:** `^[a-z0-9-]+$`
- **Hours:** integer or null (null = not yet determined)
- **Curriculum structure:** either `groups` (with nested courseRefs) or flat `courses` array
- **CourseRef:** `name` (required), `id` (recommended), `hoursOverride` (optional)

### 3. ID-Based Lookups ✅

Dashboard and status page use IDs as primary lookup keys with name fallback:

```javascript
// courses.js (generated) — dual-keyed status map
courseStatusMap[c.name] = c;
if (c.id) courseStatusMap[c.id] = c;

// dashboard.js — ID-first lookup
const courseLookup = {};
courseData.forEach(c => {
    courseLookup[c.name] = c;
    if (c.id) courseLookup[c.id] = c;
});

// Nav items carry data-course-id attribute
`<div class="nav-course-item" data-course-id="${course.id}" ...>`

// status-main.js — membership map keyed by ID
const key = gc.id || gc.name;
if (!membershipMap[key]) membershipMap[key] = [];
```

### 4. Curricula Course References — Partially Done

Curricula entries now include `id` alongside `name` in courseRef objects:
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

### 5. Outline Manifest IDs ✅

All 51 entries in `outlines/manifest.json` have `id` fields linking them to courses:
```json
{ "course": "Advanced Python", "file": "advanced-python.json", "id": "advanced-python" }
```

### 6. Build-Integrated Validation ✅

`lib/validators.js` checks on every `node build.js` run:
- All courses have valid kebab-case IDs
- No duplicate IDs
- Required fields present (`id`, `name`, `status`)
- Courses sorted alphabetically
- Curricula have either `groups` or `courses`
- Cross-references between curricula and courses (warnings for mismatches)
- Outline files exist for all manifest entries
- Outline JSON has valid structure

---

## What Was NOT Implemented (Deferred)

### Reference Restructuring → Issue #11

The original design proposed restructuring `syllabus` and `outline` fields into a unified `references` object:
```json
// PROPOSED (not implemented):
"references": {
    "syllabus": { "type": "local-html", "filename": "databases-in-java.html" },
    "outline": { "type": "loaded", "filename": "databases-in-java.json" },
    "driveFolder": "https://drive.google.com/..."
}
```

**Actual format (kept as-is):**
```json
{
  "syllabus": "Syllabus: Advanced Python",
  "outline": true,
  "note": "Has outline, syllabus linked",
  "driveFolder": "https://drive.google.com/..."
}
```

The `references` restructuring was not pursued because:
1. The existing flat fields work and don't block other improvements
2. The dashboard code handles the current format correctly
3. Changing the format would require updating all 64 course entries plus generators and validators

### Curriculum Refs to ID-Only → Issue #11

Curricula still include both `name` and `id` in courseRef objects. Issue #11 will simplify to:
```json
// Plain ID string (common case):
"student-onboarding"

// Object with overrides (when needed):
{ "id": "intro-to-cloud-technology", "hoursOverride": 20 }
```

### Cloud Ops Cross-Reference Mismatches

6 courses referenced in Cloud Operations Specialist don't match any course in the courses array by name. These produce warnings (not errors) during validation. To be resolved in Issue #11.

---

## Current Data Model

### Course Entry
```json
{
  "id": "databases-in-java",
  "name": "Databases in Java",
  "hours": 40,
  "status": {
    "design": "Complete",
    "development": "Not Started"
  },
  "syllabus": "Syllabus: Databases in Java",
  "outline": true,
  "note": "Has outline and syllabus",
  "driveFolder": "https://drive.google.com/..."
}
```

### Curriculum Entry
```json
{
  "name": "Software Development Java",
  "groups": [
    {
      "name": "Foundation",
      "courses": [
        { "name": "Student Onboarding", "id": "student-onboarding" },
        { "name": "Introduction to Cloud Technology", "id": "intro-to-cloud-technology", "hoursOverride": 20 }
      ]
    }
  ]
}
```

### Outline Manifest Entry
```json
{ "course": "Databases in Java", "file": "databases-in-java.json", "id": "databases-in-java" }
```

---

## Implementation Checklist

- [x] Define and publish JSON schema (`data/schema.json`)
- [x] Add schema validation to build.js (`lib/validators.js`)
- [x] Add IDs to all 64 courses in courses.json
- [x] Add IDs to all 51 outline manifest entries
- [x] Update curricula courseRefs to include `id` alongside `name`
- [x] Update dashboard to use ID-first lookups (`data-course-id`, `courseLookup`)
- [x] Update status page to use ID-first lookups (`membershipMap`)
- [x] Update generation scripts to dual-key `courseStatusMap`
- [x] Write migration guide (`DESIGN/MIGRATION-GUIDE.md`)
- [ ] Simplify curriculum refs to ID-only strings (Issue #11)
- [ ] Resolve Cloud Ops cross-reference mismatches (Issue #11)

---

**Last updated:** March 28, 2026
