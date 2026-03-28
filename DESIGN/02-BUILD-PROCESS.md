# Design Document: Build Process & Code Generation

**Status:** ✅ Implemented (Issue #1, PR #6 merged)
**Priority:** High (Enables other improvements)
**Complexity:** Medium
**Estimated Effort:** 1-2 weeks
**Actual Effort:** ~1 week

---

## Problems Identified

### 1. Manual Build Steps
Users had to remember to run multiple inline Node commands:
```bash
# Step 1: Generate courses.js
node -e "const fs = require('fs'); ..."

# Step 2: Generate outlines.js (in different directory)
cd outlines && node -e "const fs = require('fs'); ..."

# Step 3: Generate HTML syllabi
node convert-syllabi.js
```

**Issues:** easy to forget a step, no error reporting, no validation, different on each machine.

### 2. Duplicate Code
- courses.js and outlines.js generation used similar logic
- convert-syllabi.js duplicated CSS from index.html
- No shared utilities

### 3. No Error Handling
Generation was silent — if `fs.writeFileSync` failed, the user didn't know.

### 4. No Validation Pipeline
Generated files were not validated. Invalid JSON could be written silently, no check that referenced files exist.

---

## What Was Implemented

### build.js — Configuration-Driven Orchestrator

Single entry point with CLI flags:
```bash
node build.js              # Build everything once
node build.js --watch      # Watch for changes and rebuild
node build.js --validate   # Validate data without generating
node build.js --verbose    # Show detailed output
```

Equivalent npm scripts:
```bash
npm run build              # node build.js
npm run build:watch        # node build.js --watch
npm run build:verbose      # node build.js --verbose
npm run validate           # node build.js --validate
```

The build follows a three-stage pipeline:

1. **Load** — reads `courses.json` into memory
2. **Validate** — runs all validators; aborts with clear error messages if any fail
3. **Generate** — writes `courses.js` and `outlines/outlines.js`

```javascript
// BUILD_CONFIG drives the pipeline
const BUILD_CONFIG = {
  rootDir: __dirname,
  source: 'courses.json',
  outlineManifest: 'outlines/manifest.json',

  generators: [
    { name: 'courses-bundle', input: 'courses.json', output: 'courses.js', generate: generateCourseBundle },
    { name: 'outlines-bundle', input: 'outlines/manifest.json', output: 'outlines/outlines.js', generate: generateOutlineBundle }
  ],

  validators: [
    validateSchema,
    validateReferences,
    validateSyllabusFiles,
    validateOutlineFiles
  ]
};
```

### lib/generators.js — Shared Generation Functions

Two generators that produce JS bundles loaded by the dashboard via `<script>` tags:

**`generateCourseBundle(data, config)`** — writes `courses.js`:
```javascript
// Auto-generated from courses.json — do not edit directly
const courseData = [...];
const curriculaData = [...];
const courseStatusMap = {};
courseData.forEach(c => {
  courseStatusMap[c.name] = c;
  if (c.id) courseStatusMap[c.id] = c;
});
```

**`generateOutlineBundle(data, config)`** — reads each outline JSON referenced in `manifest.json`, writes `outlines/outlines.js`:
```javascript
// Auto-generated from outlines — do not edit directly
const courseOutlines = { "Advanced Python": {...}, ... };
```

Both output in-place (same directory as source), not to a separate `build/` directory. This keeps the dashboard's `<script src="courses.js">` references working without path changes.

### lib/validators.js — Validation Pipeline

Four validators, each returning errors (or `{ errors, warnings }`):

| Validator | Checks |
|---|---|
| `validateSchema` | Required fields (`id`, `name`, `status`), ID format (kebab-case), unique IDs, alphabetical sort, curriculum structure |
| `validateReferences` | Curricula course refs match actual courses (warnings for mismatches) |
| `validateSyllabusFiles` | `syllabi/` directory exists |
| `validateOutlineFiles` | Every file in `manifest.json` exists, is valid JSON, has `modules` array, manifest sorted alphabetically |

Errors abort the build. Warnings are printed but don't block.

### Watch Mode

Uses `fs.watch()` on `courses.json` and `outlines/manifest.json`. On change, triggers a full rebuild. Runs an initial build on startup.

### package.json

```json
{
  "name": "curriculum-tracking",
  "version": "1.0.0",
  "description": "RTI Academy curriculum tracking dashboard",
  "private": true,
  "scripts": {
    "build": "node build.js",
    "build:watch": "node build.js --watch",
    "validate": "node build.js --validate",
    "build:verbose": "node build.js --verbose"
  }
}
```

---

## File Organization (Actual)

```
tracking/repo/
├── build.js                    # Main build orchestrator
├── lib/
│   ├── generators.js           # generateCourseBundle, generateOutlineBundle
│   └── validators.js           # validateSchema, validateReferences, validateSyllabusFiles, validateOutlineFiles
├── courses.json                # Source of truth (data)
├── courses.js                  # Generated bundle (in-place, not in build/)
├── data/
│   └── schema.json             # JSON schema definition
├── outlines/
│   ├── manifest.json           # Maps course names → JSON filenames
│   ├── *.json                  # Individual outline files (~51)
│   └── outlines.js             # Generated bundle (in-place)
├── syllabi/
│   └── *.html                  # HTML syllabi
├── index.html                  # Dashboard UI
├── status.html                 # Status page UI
├── css/                        # Extracted stylesheets (Issue #3)
├── js/                         # Extracted scripts (Issue #3)
├── package.json
└── DESIGN/                     # Architecture documentation
```

**Note:** The original design proposed a `build/` output directory and a `src/` source directory, but the actual implementation generates in-place to avoid breaking the existing `<script>` tag references. This is simpler and works well for the current `file://` protocol workflow.

---

## Differences from Original Design

| Proposed | Actual | Reason |
|---|---|---|
| `build/` output directory | In-place generation | Avoids breaking `<script src="courses.js">` paths |
| `lib/utils.js` | Not created | No shared utilities needed beyond generators and validators |
| `require('watch')` package | `fs.watch()` built-in | No external dependencies needed |
| `data/courses.json` path | `courses.json` at repo root | Kept existing layout |
| Syllabi generation in build | Not integrated | `convert-syllabi.js` remains separate |
| CI/CD integration | Not done | Not needed for current workflow |

---

## Results

- **Single command** — `npm run build` replaces 3+ manual steps
- **Validation catches errors** — missing IDs, broken references, unsorted data, invalid outline JSON
- **Build time** — under 500ms for 64 courses + 51 outlines
- **Watch mode** — auto-rebuilds during development
- **Deterministic** — same input always produces same output
- **Zero external dependencies** — uses only Node.js built-ins

---

## Implementation Checklist

- [x] Create build.js with configuration-driven pipeline
- [x] Extract shared generator functions (`lib/generators.js`)
- [x] Create validation library (`lib/validators.js`)
- [x] Update package.json with npm scripts
- [x] Test build process (deterministic output)
- [x] Add error handling and reporting (errors + warnings)
- [x] Document build process in README
- [x] Test with --watch mode
- [ ] Add CI/CD integration (GitHub Actions) — not currently needed
- [ ] Integrate syllabi generation into build pipeline — `convert-syllabi.js` remains separate

---

**Last updated:** March 28, 2026
