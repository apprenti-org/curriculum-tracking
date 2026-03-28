# Curriculum Tracking Dashboard — Architecture Review & Improvement Suggestions

**Date:** March 28, 2026
**Scope:** Code review of tracking/repo system (JSON data model, JavaScript generation, HTML/CSS, build process)

---

## Executive Summary

The current system is a **working single-page dashboard** with a clean separation between data (JSON) and presentation (HTML/JS). The architecture is functional but shows signs of **tight coupling, manual processes, and scalability constraints** that will become problematic as the curriculum grows.

**Key strengths:** Simple, no backend required, single source of truth (courses.json), responsive UI
**Key weaknesses:** Manual build steps, string-based data generation, monolithic HTML/JS file, limited validation, no versioning of data changes

---

## 1. DATA MODEL & SOURCE OF TRUTH

### Current Architecture
- **Single file source of truth:** `courses.json` contains 64 courses + 7 curricula
- **Validation:** None — no schema enforcement, allows null values, inconsistent status values
- **Data duplication:** Course names repeated across courses.json, courses.js, outlines/manifest.json, index.html syllabiMap
- **Inconsistent references:** Syllabus field sometimes "Syllabus: Name", sometimes Google Doc URL, sometimes null
- **Hardcoded mappings:** syllabiMap object in index.html manually lists each course name → filename

### Issues

**1.1 No Schema Validation**
```json
// Problem: What are valid status values? What fields are required?
"status": {
  "design": "Needs Review",  // Could be "In Progress", "Not Started", "Complete", "Scoping"...
  "development": "Not Started"  // Inconsistent naming
}
```

**1.2 Inconsistent Data Types**
```json
// Syllabus field is sometimes a string, sometimes null
"syllabus": "Syllabus: Advanced Python",      // Literal string
"syllabus": "https://docs.google.com/...",    // URL
"syllabus": null,                              // Missing data

// Outline field is sometimes a string, sometimes boolean
"outline": "Course Outline: C# Data Access",  // String
"outline": true,                               // Boolean
"outline": null,                               // Missing
```

**1.3 No Data Versioning**
- No way to track when courses were added/modified
- No change log
- Difficult to understand why certain statuses were set

**1.4 Denormalization & Duplication**
- Course memberships stored in curricula (forward reference) but courses only link via name
- No stable course ID — relies on course name which can change
- syllabiMap in HTML duplicates what should be in courses.json

### Recommendations

**1. Introduce JSON Schema**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "courses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9-]+$" },
          "name": { "type": "string" },
          "hours": { "type": "number", "minimum": 0 },
          "status": {
            "type": "object",
            "properties": {
              "design": { "enum": ["Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"] },
              "development": { "enum": ["Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"] }
            }
          }
        },
        "required": ["id", "name", "hours", "status"]
      }
    }
  }
}
```
- Validate against this schema on load
- Fail loudly if data doesn't match

**2. Add Stable Course IDs**
```json
{
  "id": "databases-in-java",  // Slug, never changes
  "name": "Databases in Java", // Display name, can change
  "slug": "databases-in-java"  // Redundant but explicit
}
```
- Use IDs for all references (curricula, outlines, syllabi)
- Name becomes metadata, not the primary identifier

**3. Standardize Reference Format**
```json
{
  "syllabusRef": {
    "type": "local-html",  // "local-html", "google-doc", "none"
    "filename": "databases-in-java.html",
    "url": "syllabi/databases-in-java.html"
  },
  "outlineRef": {
    "type": "loaded",  // "loaded", "pending", "missing"
    "filename": "databases-in-java.json"
  }
}
```
- One consistent structure for all references
- Type field makes processing clearer

**4. Extract syllabiMap from HTML to JSON**
```json
{
  "syllabi": [
    { "id": "databases-in-java", "filename": "databases-in-java.html" },
    { "id": "java-oop", "filename": "java-oop.html" }
  ]
}
```
- Let the generation script build this from courses + filesystem
- Eliminates manual HTML editing

---

## 2. BUILD PROCESS & CODE GENERATION

### Current Architecture
- Manual Node.js commands with inline code strings
- No build configuration file
- No error handling
- No watching for changes
- No automated validation

### Issues

**2.1 Fragile Manual Build Steps**
```bash
# Step 1: Regenerate courses.js (documented in README, but must be run manually)
node -e "const fs = require('fs'); ..."

# Step 2: Regenerate outlines/outlines.js (different inline code)
cd tracking/repo/outlines && node -e "const fs = require('fs'); ..."

# Step 3: Regenerate HTML syllabi (separate script)
node convert-syllabi.js
```
- Easy to forget a step
- Easy to run wrong command
- No error reporting

**2.2 Duplicate Code**
- Both courses.js and outlines.js generation use similar logic
- convert-syllabi.js has CSS duplicated from index.html

**2.3 No Validation in Pipeline**
- Generation scripts don't validate input data
- Invalid JSON can be generated silently
- No check that all referenced files exist

### Recommendations

**1. Create build.js Configuration**
```javascript
// build.js
const fs = require('fs');
const path = require('path');

const BUILD_CONFIG = {
  source: 'courses.json',
  outputs: [
    { type: 'courses-js', output: 'courses.js' },
    { type: 'outlines-js', output: 'outlines/outlines.js' },
    { type: 'syllabi-html', output: 'syllabi/' },
    { type: 'validation-report', output: 'build/validation.json' }
  ],
  validators: [
    validateSchema,
    validateReferences,
    validateSyllabusFiles,
    validateOutlineFiles
  ]
};

function build() {
  console.log('🔨 Building curriculum dashboard...');

  // Load data
  const data = JSON.parse(fs.readFileSync(BUILD_CONFIG.source));

  // Validate
  for (const validator of BUILD_CONFIG.validators) {
    const errors = validator(data);
    if (errors.length > 0) {
      console.error('❌ Validation failed:', errors);
      process.exit(1);
    }
  }

  // Generate outputs
  for (const output of BUILD_CONFIG.outputs) {
    generateOutput(output, data);
  }

  console.log('✅ Build complete');
}

build();
```
- Run: `npm run build` instead of multiple inline commands
- Clear error messages when something fails
- Can add `--watch` mode for development

**2. Create Shared Generation Utilities**
```javascript
// lib/generate-bundles.js
function generateCourseBundle(courses) {
  let js = '// Auto-generated from courses.json — do not edit directly\n';
  js += 'const courseData = ' + JSON.stringify(courses, null, 2) + ';\n';
  // ... shared logic
  return js;
}

function generateOutlineBundle(manifest, outlinesDir) {
  // ... shared logic for both courses.js and outlines.js
}
```
- DRY principle for code generation
- Easier to update generation logic

**3. Add Data Validation Layer**
```javascript
// lib/validators.js
function validateSchema(data) {
  const errors = [];
  if (!Array.isArray(data.courses)) errors.push('courses must be an array');
  data.courses.forEach((c, i) => {
    if (!c.id) errors.push(`courses[${i}] missing required field: id`);
    if (!c.name) errors.push(`courses[${i}] missing required field: name`);
    // ... validate all fields
  });
  return errors;
}

function validateReferences(data) {
  const errors = [];
  const courseIds = new Set(data.courses.map(c => c.id));

  // Check curricula reference valid course IDs
  data.curricula.forEach((curr, i) => {
    curr.courses?.forEach((cid, j) => {
      if (!courseIds.has(cid)) {
        errors.push(`curricula[${i}].courses[${j}] references unknown course: ${cid}`);
      }
    });
  });

  return errors;
}
```
- Catches errors before they break the dashboard
- Clear error messages point to exact problem

---

## 3. MONOLITHIC HTML FILE

### Current Architecture
- Single 900+ line `index.html` containing:
  - Password authentication (SHA-1 hash)
  - All CSS (embedded in `<style>`)
  - All JavaScript (1000+ lines)
  - All HTML structure
- status.html is separate but similar monolithic structure

### Issues

**3.1 Not Maintainable**
- Hard to find code sections
- Difficult to reuse components
- CSS is mixed with markup
- Hard to refactor without breaking something

**3.2 No Component Abstraction**
- Course cards, curriculum accordions, status indicators all hand-coded in string literals
- Duplicate logic (e.g., courseStatusIcon called from multiple places)
- No way to test components in isolation

**3.3 Hard-to-Test**
- No way to test selectors, event bindings without running full HTML
- DOM is built entirely by JavaScript, fragile to click handlers
- Password auth is intertwined with dashboard code

**3.4 Poor Performance**
- All JavaScript runs on page load
- No lazy loading of course outlines
- courseOutlines object is fully loaded even if user only views 1 course

### Recommendations

**1. Modularize with ES6 Modules**
```javascript
// js/app.js
import { Dashboard } from './components/Dashboard.js';
import { loadData } from './data/loader.js';

async function main() {
  const data = await loadData();
  const dashboard = new Dashboard(data);
  dashboard.render('#app');
}

main();
```

**2. Extract Components**
```javascript
// js/components/CourseCard.js
export class CourseCard {
  constructor(course, outline) {
    this.course = course;
    this.outline = outline;
  }

  render() {
    return `
      <div class="course-card">
        ${this.renderHeader()}
        ${this.renderMetadata()}
        ${this.renderOutline()}
      </div>
    `;
  }

  renderHeader() { /* ... */ }
  renderMetadata() { /* ... */ }
  renderOutline() { /* ... */ }
}
```
- Easier to understand each piece
- Can test components independently
- Can reuse across pages (index.html and status.html)

**3. Extract CSS to Separate Files**
```css
/* css/variables.css */
:root[data-theme="dark"] {
  --bg: #111117;
  --surface: #1A1B23;
  /* ... */
}

/* css/layout.css */
.dashboard-layout { display: grid; ... }

/* css/components.css */
.course-card { ... }
.curriculum-group { ... }
```
- Easier to maintain
- Can version CSS separately
- Can use CSS preprocessor (Sass)

**4. Implement Lazy Loading**
```javascript
// Only load outline data when course is selected
async selectCourse(el) {
  const courseId = el.dataset.courseId;
  const course = this.courseMap[courseId];

  // Load outline on demand
  if (!courseOutlines[courseId]) {
    const outline = await fetch(`outlines/${courseId}.json`).then(r => r.json());
    courseOutlines[courseId] = outline;
  }

  this.showDetail(course, courseOutlines[courseId]);
}
```
- Only load data user actually needs
- Faster initial load time
- Better for large course catalogs

---

## 4. DATA LOADING & RUNTIME

### Current Architecture
- Global variables: `courseData`, `curriculaData`, `courseOutlines`, `courseStatusMap`
- Data is loaded via `<script>` tags (courses.js and outlines/outlines.js)
- All data is in memory at once

### Issues

**4.1 Global Namespace Pollution**
- Any code can modify courseData, curriculaData directly
- No isolation between different features
- Difficult to test

**4.2 Single Large Bundle**
- courseOutlines object grows as more courses are added
- No tree-shaking possible
- outlines.js is already large and will grow

**4.3 No Error Handling**
- If courses.js fails to load, dashboard breaks silently
- No fallback for missing data

### Recommendations

**1. Create Data Module**
```javascript
// js/data/DataStore.js
export class DataStore {
  constructor() {
    this.courses = new Map();
    this.curricula = new Map();
    this.outlines = new Map();
  }

  getCourse(id) { return this.courses.get(id); }
  setCourse(id, course) { this.courses.set(id, course); }
  getOutline(id) { return this.outlines.get(id); }

  loadCourses(courseData) {
    courseData.forEach(c => this.setCourse(c.id, c));
  }
}

export const dataStore = new DataStore();
```
- Encapsulates data access
- Can add logging, validation, caching
- Testable

**2. Lazy-Load Outlines**
```javascript
// Instead of outlines/outlines.js
// Load individual JSON files on demand
async function loadOutline(courseId) {
  const response = await fetch(`outlines/${courseId}.json`);
  if (!response.ok) throw new Error(`Failed to load outline: ${courseId}`);
  return response.json();
}
```
- No large outlines.js bundle
- Only load what's needed
- Better for hundreds of courses

**3. Add Error Boundaries**
```javascript
// Graceful degradation if data fails to load
try {
  const data = await loadData();
  dashboard.render(data);
} catch (error) {
  document.body.innerHTML = `
    <div class="error">
      <h1>Failed to load curriculum data</h1>
      <p>${error.message}</p>
      <button onclick="location.reload()">Retry</button>
    </div>
  `;
}
```

---

## 5. AUTHENTICATION & SECURITY

### Current Architecture
- SHA-1 hash in sessionStorage
- Password check on every page load
- Hard-coded in HTML

### Issues

**5.1 Weak Security**
- SHA-1 is broken, rainbow tables exist
- Hash visible in page source
- Password visible in developer tools (sessionStorage)
- No HTTPS enforcement mentioned

**5.2 Poor UX**
- Must enter password on each tab/session
- No way to log out
- No password reset mechanism

**5.3 Not Suitable for Public Dashboard**
- If dashboard is internal-only, auth makes sense
- If it should be public, auth is unnecessary
- Current approach is middle ground (not good for either)

### Recommendations

**1. If Dashboard Should Be Internal Only:**
```javascript
// Move authentication to server/API layer
// Use HTTP Basic Auth, OAuth, or SAML
// Client-side auth is security theater
```

**2. If Dashboard Should Be Public:**
```javascript
// Remove authentication entirely
// Use robots.txt to prevent indexing if needed
// Publish as-is
```

**3. If You Need Client-Side Protection:**
```javascript
// Use bcrypt or Argon2 (not SHA-1)
// Store hash server-side, not visible to user
// Implement actual session management
```

---

## 6. SYLLABUS GENERATION PIPELINE

### Current Architecture
- convert-syllabi.js reads markdown files from course folders
- Generates static HTML files in syllabi/
- References HTML files from index.html

### Issues

**6.1 CSS Duplication**
- CSS is duplicated in both convert-syllabi.js and index.html

**6.2 Hard-coded Paths**
- Paths are absolute in convert-syllabi.js:
```javascript
const coursesDir = '/sessions/quirky-wonderful-davinci/mnt/Curriculum for Training Operations/_COURSES Phase 1 - WORKNG/courses';
```
- Won't work on different machines

**6.3 No Integration with Main Build**
- Must be run separately
- Easy to forget to regenerate after updating markdown

### Recommendations

**1. Extract CSS to Shared File**
```css
/* css/syllabus.css */
/* Used by both convert-syllabi.js and index.html */
```

**2. Use Relative Paths**
```javascript
const coursesDir = path.resolve(__dirname, '../courses');
```

**3. Integrate with Main Build**
```javascript
// In build.js
{
  type: 'syllabi-html',
  source: 'courses',
  output: 'syllabi',
  processor: convertMarkdownToHtml
}
```

---

## 7. DATA FILE ORGANIZATION

### Current Issues

**7.1 Mixed Concerns**
```
tracking/repo/
├── courses.json          # Data
├── courses.js            # Generated
├── outlines/
│  ├── manifest.json      # Metadata about outlines
│  ├── *.json             # Data files (45 of them)
│  └── outlines.js        # Generated
├── syllabi/
│  └── *.html             # Generated HTML
├── index.html            # UI
├── status.html           # UI
├── convert-syllabi.js    # Script
└── README.md             # Docs
```

**7.2 Poor Scalability**
- 45 individual outline JSON files at top level of outlines/
- Hard to find anything with that many files
- No organization by curriculum or track

### Recommendations

**1. Organize by Data/Code Separation**
```
tracking/repo/
├── data/
│  ├── courses.json           # Source of truth
│  └── outlines/
│     ├── manifest.json
│     └── [45 outline files]
├── build/                    # Build outputs (git-ignored)
│  ├── courses.js
│  ├── outlines/outlines.js
│  └── syllabi/
├── src/
│  ├── index.html
│  ├── status.html
│  ├── js/
│  ├── css/
│  └── assets/
├── scripts/
│  ├── build.js
│  └── convert-syllabi.js
└── README.md
```

**2. Organize Outlines by Curriculum**
```
data/outlines/
├── java/
│  ├── databases-in-java.json
│  ├── java-oop.json
│  └── intro-advanced-concepts-java.json
├── cloud/
│  ├── intro-to-aws.json
│  └── ...
└── manifest.json
```

---

## 8. MISSING FEATURES & GAPS

### 8.1 No Curriculum-Level Metadata
- No way to set curriculum description, learning outcomes, duration
- No way to set prerequisites

### 8.2 No Version Control for Outlines
- When outline changes, old version is lost
- No way to see what changed

### 8.3 No Export/Import
- Hard to migrate data to LMS
- No bulk export options

### 8.4 No Deployment Pipeline
- No clear "deploy to production" step
- No staging environment
- Manual push to GitHub

### 8.5 No Performance Monitoring
- No way to measure dashboard performance
- No error tracking

---

## 9. PRIORITY ROADMAP

### Immediate (High Impact, Low Effort)
1. **Add JSON Schema validation** — Catches bad data early
2. **Create build.js script** — Simplifies build process
3. **Fix hardcoded paths** — Makes build portable
4. **Extract CSS to separate files** — Easier maintenance

### Short Term (Medium Impact, Medium Effort)
1. **Modularize JavaScript** — Makes code maintainable
2. **Add error handling** — Improves reliability
3. **Lazy-load outlines** — Improves performance
4. **Organize file structure** — Scales better

### Medium Term (Low Effort, Long Impact)
1. **Implement actual backend** — Enables versioning, search, export
2. **Add LMS integration** — Sync with Absorb
3. **User-facing course editor** — Remove manual JSON editing
4. **Curriculum templates** — Reduce boilerplate

---

## 10. SUMMARY SCORECARD

| Aspect | Rating | Notes |
|--------|--------|-------|
| **Data Model** | ⚠️ Poor | No schema, inconsistent types, name-based IDs |
| **Build Process** | ⚠️ Poor | Manual steps, no validation, fragile |
| **Code Organization** | ⚠️ Poor | Monolithic HTML, no modules, CSS duplicated |
| **Error Handling** | ❌ Missing | Fails silently, no recovery |
| **Performance** | ✅ Good | Loads quickly for current size |
| **Maintainability** | ⚠️ Poor | Hard to understand, easy to break |
| **Scalability** | ⚠️ Poor | Will struggle with hundreds of courses |
| **Security** | ❌ Poor | Weak authentication, exposed in source |

---

## Conclusion

The dashboard works well **today** but will become a maintenance burden as the curriculum grows. The good news: improvements don't require rewriting everything. A phased approach starting with validation and build automation will provide immediate returns.

**Next step:** Start with #9.1 (JSON Schema) + #9.2 (build.js) to establish a stronger foundation.
