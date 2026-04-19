# Curriculum Tracking Dashboard

A single-page dashboard for managing Apprenti's DOL-registered apprenticeship curriculum content — courses, outlines, syllabi, and progress across multiple programs.

## What it does

The dashboard provides a two-panel interface for tracking curriculum development:

- **Left nav** lists curricula (collapsible, with grouped course subheaders) and a flat list of all courses. Courses show a status dot indicating whether a detailed outline has been loaded. Curricula and Courses sections are visually separated.
- **Right detail panel** displays course metadata, curriculum/group membership tags, document references (syllabus, outline, Google Drive folder), and full course outlines (modules, lessons, topics) when available.
- **Stats bar** at the top summarizes total curricula, courses, hours, and outlines.

All data is loaded from local JavaScript bundles — no backend required. Open `index.html` in a browser via `file://`.

## Curricula (7)

| Curriculum | Courses | Notes |
|---|---|---|
| Client Technical Support Engineer | 2 courses, 2 groups | CompTIA A+, Helpdesk |
| Cloud Operations Specialist | 8 courses | Networking, GitHub, Linux, DB, Security, Python, Cloud, AWS |
| CyberSecurity Analyst | 3 courses | IT Fundamentals, Networking, Security & Cyber |
| IT Business Analyst | 5 courses | Linux, Python, Advanced Python, Agile, Python for Infra |
| IT Support Professional | 8 courses | CompTIA A+/Network+, M365, macOS, Cloud, Troubleshooting, Helpdesk, Compliance |
| Operations Support Specialist — Network | 17 courses, 4 RTI groups | DOL Appendix A-28, 560h minimum |
| Software Development Java | 4 courses | Java, JavaScript, Web Dev with JS & React, SQL for Data |

### OSS-Network RTI Groups

| Group | Hours | Courses |
|---|---|---|
| Core Systems & Networking Fundamentals | 176h | Linux Foundations (80h), CompTIA Network+ (96h) |
| Reliability, Monitoring & Operations | 132h | CompTIA A+ (96h), ITIL Foundations (20h), ITIL Specialist 4 (16h) |
| Programming, Automation & CI/CD | 236h | Python Basics (48h), Python for Infra Automation (32h), Java Language Fundamentals (44h*), Web Dev with JS & React (40h), SQL Fundamentals for Operations (20h), CI/CD Pipeline Concepts (10h), Infrastructure as Code (22h), AI Foundations (20h) |
| Security & Professional Skills | 16h | Compliance & Security Awareness (4h), Technical Documentation (4h), Productivity Tools (4h), Professional Communication (4h) |

*Java Language Fundamentals reduced from 56h to 44h for this deployment only.

### Client Technical Support Engineer Groups

| Group | Hours | Courses |
|---|---|---|
| Foundational IT & Operations | 120h | CompTIA A+ (120h) |
| Foundations of IT Service Management | 42h | Helpdesk Software Fundamentals (13h*); more courses TBD |

*Helpdesk Software Fundamentals reduced from 16h to 13h for this deployment.

## Course Outlines Loaded (45)

Advanced Python, Agile Project Management with Scrum, ASP.NET, Business Analysis Fundamentals, Business and IT Fundamentals, C# Data Access, C# Language Fundamentals, C# OOP, C++ Coding Booster Intensive, CompTIA A+, CompTIA Network+, Data Fundamentals — Data Literacy, Data Fundamentals — Data Visualizations and Power BI, Data Fundamentals — Excel for Data Analysts, Data Fundamentals — SQL for Data, Helpdesk Software Fundamentals, HTTP Services, Instructor Onboarding, Introduction to AWS Cloud Platform, Introduction to Cloud Technology, Introduction to GitHub, Introduction to HTML & CSS, Introduction to Microsoft Teams, IT Fundamentals, Java Coding Booster Intensive, Java Language Fundamentals, JavaScript, JavaScript Coding Booster Intensive, Layers and File I/O for C#, LINQ and Dependency Injection, Linux Foundations, macOS Administration Fundamentals, Networking Fundamentals, Non-Relational Data, Pandas, Python Basics, Python Coding Booster Intensive, React, Security and Cybersecurity Fundamentals, Software Developer Pre-Work, Software Development Lifecycle, SQL Coding Booster Intensive, SQL for C#, Student Onboarding, Web Development with JavaScript and React.

## Data model

`courses.json` is the single source of truth for all course and curriculum data. The JavaScript bundles (`courses.js` and `outlines/outlines.js`) are auto-generated from the JSON files and loaded by `index.html` via `<script>` tags (required for `file://` protocol compatibility — `fetch()` doesn't work locally).

The data follows this hierarchy: Curriculum → Group (optional) → Course → Module → Lesson. Courses can belong to multiple curricula with per-deployment hour overrides.

Each course entry in `courses.json` includes name, hours, design/development status, syllabus reference, outline reference, note, and driveFolder (Google Drive source folder URL). The `courseOutlines` object (built from individual JSON files in `outlines/`) holds detailed outline data — modules, lessons, topics, and hours — for courses that have been fully ingested.

## JSON data files

| File | Description |
|---|---|
| `courses.json` | Single source of truth. Contains a `courses` array (61 courses) and a `curricula` array (7 curricula). Each course has `name`, `hours`, `status` (design + development), `syllabus`, `outline`, `note`, and `driveFolder` fields. Each curriculum has `name` and either `groups` (array of groups with courses) or `courses` (flat array). |
| `courses.js` | Auto-generated from `courses.json`. Exports three globals: `courseData` (array of courses), `curriculaData` (array of curricula), and `courseStatusMap` (lookup object keyed by course name). Regenerate with the Node script below — never edit directly. |
| `outlines/manifest.json` | Maps outline JSON filenames to course names. 45 entries. Add new entries here when creating new outline JSON files. |
| `outlines/*.json` | Individual course outline files. Each contains `courseName`, `totalHours`, `totalLessons`, `totalModules`, and a `modules` array. Each module has `name`, `hours`, and a `lessons` array. Each lesson has `title` and optionally `hours`. |
| `outlines/outlines.js` | Auto-generated from `outlines/manifest.json` + individual JSON files. Exports one global: `courseOutlines` (object keyed by course name). Regenerate with the Node script below — never edit directly. |

## Syllabi

58 HTML syllabi are generated from markdown source files in each course folder and stored in `syllabi/`. The `syllabiMap` object in `index.html` maps course names to HTML filenames. The batch converter script `convert-syllabi.js` reads all `syllabus-*.md` files from course folders and generates styled HTML pages matching the dashboard dark theme.

### Build system

The build system validates data and regenerates `courses.js` and `outlines/outlines.js` from the JSON source files. No dependencies required — pure Node.js.

```bash
cd tracking/repo
node build.js            # Build everything
node build.js --validate # Validate only, no file generation
node build.js --watch    # Watch for changes and rebuild
node build.js --verbose  # Show detailed output
```

Or with npm scripts:

```bash
npm run build
npm run validate
npm run build:watch
npm run build:verbose
```

### Regenerating syllabi

Syllabi are generated separately from the main build:

```bash
cd tracking/repo
node convert-syllabi.js
```

## Adding a new course (workflow)

The full 13-step course ingestion process is documented in `SANDBOX/course-ingestion-process.md` and in the root `CLAUDE.md`. The short version:

1. Search Google Drive for source materials and record doc IDs/URLs
2. Create course folder in `courses/` with `manifest.md`, `course-outline-<slug>.md`, and `syllabus-<slug>.md`
3. Create `outlines/<slug>.json` and add entry to `outlines/manifest.json`
4. Add course to `courses.json` (courses array and optionally curricula)
5. Regenerate `courses.js`, `outlines/outlines.js`, and HTML syllabus
6. Update `syllabiMap` in `index.html`
7. Verify dashboard rendering

### Status values

Design and development status fields use these values: "Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete". The dashboard maps these to icons: green check (Complete), amber exclamation (Needs Review / In Review), blue half-circle (In Progress / Scoping), gray circle (Not Started).

## Files

| File | Purpose |
|---|---|
| `index.html` | Main dashboard — two-panel UI with nav sidebar and course detail view |
| `status.html` | Design & dev status — flat course table with membership tags, clickable status pills, progress bars |
| `courses.json` | Single source of truth for all course and curriculum data |
| `courses.js` | Auto-generated JS bundle exporting `courseData`, `curriculaData`, `courseStatusMap` |
| `build.js` | Build system — validates data and regenerates JS bundles from JSON sources |
| `lib/generators.js` | Shared generation functions for courses.js and outlines.js |
| `lib/validators.js` | Data validation — schema checks, cross-references, file existence |
| `package.json` | npm scripts for build, validate, watch |
| `convert-syllabi.js` | Batch converter — reads syllabus markdown files and generates styled HTML pages |
| `outlines/manifest.json` | Maps outline filenames to course names |
| `outlines/*.json` | Individual course outline data files (45 files) |
| `outlines/outlines.js` | Auto-generated JS bundle exporting `courseOutlines` |
| `syllabi/*.html` | Styled HTML syllabus pages (58 files) |
| `README.md` | This file |

## Dashboard features

- Collapsible curriculum accordions with course counts and total hours
- Collapsible group subheaders within curricula
- Course status dots (green check = outline loaded, gray circle = pending)
- Course detail panel with metadata, membership tags, document refs, and full outline
- Expandable module/lesson/topic hierarchy in outline view
- Curriculum/group membership display on course detail
- Syllabus links (HTML pages or Google Docs) with clean labels
- Google Drive folder links to `_COURSES` source material
- Dark/light theme with Apprenti color system

## Status page features

- Flat course-centric table (each course appears once)
- Curriculum/group membership tags (sky-blue curriculum, amber group, hour overrides)
- Filter by curriculum name, active status, or not started
- Clickable status pills with dropdown to change design/dev status
- Summary cards and progress bars for design and development tracks

## Related project files (outside this repo)

These files live in the parent `_COURSES Phase 1 - WORKING` folder, not in this repo directory.

- `courses/` — 58 course folders, each with `course-outline-<slug>.md`, `syllabus-<slug>.md`, and `manifest.md`
- `courses/.template/` — Templates for course outline and syllabus markdown files
- `tracking/Course Content Data - Sheet1.csv` — External CSV mirror
- `SANDBOX/innovation-log.md` — Decision log
- `SANDBOX/course-ingestion-process.md` — Full 13-step ingestion process with code snippets
