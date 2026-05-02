---
title: New Course Onboarding — Operator Runbook
created: 2026-05-02
last_updated: 2026-05-02
status: active
audience: curriculum-developer
---

# New Course Onboarding — Operator Runbook

## What this runbook is

- **Audience:** A curriculum developer (with optional AI assistance) bringing a brand-new course into the Apprenti curriculum pipeline.
- **Source of truth:** This runbook **links to** the canonical process specs in `apprenti-org/design-documentation`. It does not duplicate spec content. When a canonical spec changes, follow the spec — not a stale copy here.
- **When to use:** When a course is approved for design and needs to move from "approved" to "Published in Absorb." This is the linear walkthrough; for the meta-issue chain itself, see `apprenti-org/design-documentation/.github/ISSUE_TEMPLATE/issue-template--new-course-onboarding.md`.

## Before you begin

### Tooling and access

- [ ] `gh` CLI authenticated against `apprenti-org`.
- [ ] Access to the workspace Drive (`Curriculum for Training Operations Code Repository`).
- [ ] Access to Absorb LMS (admin) for row 11.
- [ ] Local clones of `apprenti-org/design-documentation` and `apprenti-org/curriculum-tracking`.

### Prerequisites

- [ ] The course's curriculum has passed Curriculum Design Verification (the design→tracking gate). See [`curriculum-design-verification-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/curriculum-design-verification-process.md).
- [ ] No existing meta-issue for the course is open. Search:

  ```bash
  gh issue list --repo apprenti-org/design-documentation \
    --label new-course-onboarding --state all --search "<course-slug>"
  ```

  If a closed meta-issue exists, ask the user whether to reopen or open a new one.

### Open the meta-issue

If no meta-issue exists, open one before any other work:

```bash
gh issue create --repo apprenti-org/design-documentation \
  --template issue-template--new-course-onboarding.md \
  --title "New Course Onboarding: <Course Name>"
```

Template path: `apprenti-org/design-documentation/.github/ISSUE_TEMPLATE/issue-template--new-course-onboarding.md`

The meta-issue tracks the 11-row sub-issue chain below. Each sub-issue must close before the next one opens. The meta-issue closes when row 11 closes, `tracking/repo/courses.json` shows `status.design: "Complete"` and `status.development: "Complete"`, and the course is Published in Absorb.

## The 11-row chain

| # | Process | Canonical spec | Issue template |
|---|---|---|---|
| 1 | Source Migration | [`source-migration-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/source-migration-process.md) | [`issue-template--source-migration.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--source-migration.md) |
| 2 | Course Outline Creation | [`curriculum-design-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/curriculum-design-process.md) | [`issue-template--course-outline-creation.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--course-outline-creation.md) |
| 3 | Lesson Outline Creation | [`lesson-design-guide.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/lesson-design-guide.md) | [`issue-template--lesson-outline-creation.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--lesson-outline-creation.md) |
| 4 | Lesson Source Content Creation | [`lesson-design-guide.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/lesson-design-guide.md) | [`issue-template--lesson-source-content-creation.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--lesson-source-content-creation.md) |
| 5 | Content Scaffolding (Phase 0+1) | [`content-development-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/content-development-process.md) | [`issue-template--content-scaffolding.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--content-scaffolding.md) |
| 6 | Code Migration | [`code-migration-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/code-migration-process.md) | [`issue-template--code-migration.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--code-migration.md) |
| 7 | Content Production (Phase 3) | [`content-development-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/content-development-process.md) | [`issue-template--content-production.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--content-production.md) |
| 8 | SCORM Packaging | [`scorm-packaging-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/scorm-packaging-process.md) | [`issue-template--scorm-packaging.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--scorm-packaging.md) |
| 9 | Deployment | [`deployment-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/deployment-process.md) | [`issue-template--deployment.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--deployment.md) |
| 10 | Starter Asset Audit | [`starter-asset-audit-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/starter-asset-audit-process.md) | [`issue-template--starter-asset-audit.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--starter-asset-audit.md) |
| 11 | LMS Upload | *Manual; no canonical spec* | [`issue-template--lms-upload.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--lms-upload.md) |

---

## Per-row template

Every row section below uses the same shape:

- **When applicable / when to skip** — situations where the row is N/A.
- **Inputs** — what must exist before this row starts.
- **Outputs** — artifacts produced.
- **Operator checklist** — concrete steps a curriculum developer follows.
- **AI-assisted path** — paste-ready prompt for driving Claude Code (or another LLM). Until verified during a real run, this reads "Prompt TBD."
- **Verification** — how to know the row is done.
- **Common pitfalls** — known failure modes from prior runs.
- **Canonical spec** + **Issue template** — links.

---

## Row 1 — Source Migration

**When applicable / when to skip:** Skip for net-new courses with no upstream source materials. Run when a course already has materials in `_COURSES/Course: <name>/` on Drive.

**Inputs:**
- Course slug.
- Drive folder URL for `_COURSES/Course: <name>/`.

**Outputs:**
- Verbatim source mirror at `course-design/<slug>/source/` in `apprenti-org/design-documentation`.
- `course-design/<slug>/source/_extraction-report-YYYY-MM-DD.md`.

**Operator checklist:**

- [ ] Open the source-migration sub-issue from `issue-template--source-migration.md`.
- [ ] Branch in design-documentation: `<issue#>-source-migration-<slug>`.
- [ ] Walk the source tree. Extract gdocs/gsheets/gslides to markdown with frontmatter; copy code/images verbatim with sidecar JSON; skip PDFs and `_DEPRECATED/`.
- [ ] Write the extraction report.
- [ ] Open PR; merge.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`source-migration-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/source-migration-process.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- Source mirror is read-only and matches Drive content.
- Extraction report lists every file with status (extracted / copied / skipped).
- Re-running the migration produces zero diff except `extracted_date`.

**Common pitfalls:** Drive PDFs may slip past the skip filter; verify the extraction report explicitly lists them as skipped.

**Canonical spec:** [`source-migration-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/source-migration-process.md)
**Issue template:** [`issue-template--source-migration.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--source-migration.md)

---

## Row 2 — Course Outline Creation

**When applicable / when to skip:** Always required for net-new courses. May be partial for courses that came in via Source Migration with an existing outline draft.

**Inputs:**
- DOL standard (`apprenti-org/design-documentation/standards/<appendix> <occupation>.md`).
- Curriculum design folder (`apprenti-org/design-documentation/curricula-design/<curriculum-slug>/`).

**Outputs:**
- `course-design/<slug>/course-outline-<slug>.md` with module structure, lesson titles, and hours.
- Standard alignment confirmed against the curriculum's outline.

**Operator checklist:**

- [ ] Open the course-outline-creation sub-issue from `issue-template--course-outline-creation.md`.
- [ ] Read the DOL standard for the topic-area + RTI-topic that this course covers.
- [ ] Draft the course outline following the curriculum-design-process spec.
- [ ] Confirm hours allocation matches the curriculum's per-course assignment.
- [ ] Open PR; merge.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`curriculum-design-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/curriculum-design-process.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- Course outline file exists at the canonical path.
- Hours sum to the curriculum's per-course assignment.
- Every standard topic relevant to this course appears in at least one module.

**Common pitfalls:** Hours drift between the curriculum outline and the course outline. Run the curriculum-design verification before promoting to tracking.

**Canonical spec:** [`curriculum-design-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/curriculum-design-process.md) *(filename predates the row label; contents cover Course Outline Creation)*
**Issue template:** [`issue-template--course-outline-creation.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--course-outline-creation.md)

---

## Row 3 — Lesson Outline Creation

**When applicable / when to skip:** Always required, after the course outline is approved.

**Inputs:**
- Approved course outline (row 2 output).
- Standard alignment report.

**Outputs:**
- One lesson outline per lesson at `course-design/<slug>/lessons/outlines/lesson-outline-NN-<slug>.md`.

**Operator checklist:**

- [ ] Open the lesson-outline-creation sub-issue from `issue-template--lesson-outline-creation.md`.
- [ ] Confirm prerequisites per `lesson-design-guide.md` ("Prerequisites for Writing a Lesson"): verified course outline, Standard Alignment Report, RTI/OJL assignment per module.
- [ ] Draft each lesson outline following the lesson-design-guide spec. Lessons are 0.5–2h; combine lessons under 30min, split lessons over 2h.
- [ ] Open PR; merge.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`lesson-design-guide.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/lesson-design-guide.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- Every course-outline lesson has a matching outline file.
- Hours per lesson sum to module hours; module hours sum to course hours.
- Each outline includes objectives, instructional flow, and assessment per the guide.

**Common pitfalls:** Inventing content not in the course outline. The course outline is the source of truth for module/lesson titles and hours.

**Canonical spec:** [`lesson-design-guide.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/lesson-design-guide.md) *(covers rows 3 and 4)*
**Issue template:** [`issue-template--lesson-outline-creation.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--lesson-outline-creation.md)

---

## Row 4 — Lesson Source Content Creation

**When applicable / when to skip:** Always required, after lesson outlines are approved.

**Inputs:**
- Approved lesson outlines (row 3 output).

**Outputs:**
- One lesson source file per lesson at `course-design/<slug>/lessons/content/lesson-source-NN-<slug>.md`.

**Operator checklist:**

- [ ] Open the lesson-source-content-creation sub-issue from `issue-template--lesson-source-content-creation.md`.
- [ ] For each lesson, author the full source content following `lesson-design-guide.md` ("Lessons as Source Material"). The lesson source must be complete enough to produce slides, SCORM, quizzes, lab instructions, and instructor guides without inventing content downstream.
- [ ] Open PR; merge.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`lesson-design-guide.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/lesson-design-guide.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- Every lesson outline has a matching source file.
- Each source file includes narrative, definitions, examples, activity instructions, instructor notes, and learning objectives — every artifact downstream can be built without further authoring decisions.

**Common pitfalls:** Lesson source that is too thin — downstream asset creators (slides, SCORM, etc.) end up making instructional design decisions.

**Canonical spec:** [`lesson-design-guide.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/lesson-design-guide.md) *(covers rows 3 and 4)*
**Issue template:** [`issue-template--lesson-source-content-creation.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--lesson-source-content-creation.md)

---

## Row 5 — Content Scaffolding (Phase 0 + Phase 1)

**When applicable / when to skip:** Always required, after lesson source content is approved.

**Inputs:**
- Approved lesson source content (row 4 output).
- Course-root reconciliation inputs per Phase 0 of the content-development spec.

**Outputs:**
- Course-root reconciliation: course folder synced with design folder.
- Lesson scaffolding: full module/lesson folder tree with stubbed artifacts (`content.md`, `instructor-guide.md`, `quiz.md`, activity pairs).

**Operator checklist:**

- [ ] Open the content-scaffolding sub-issue from `issue-template--content-scaffolding.md`.
- [ ] Run Phase 0 (reconciliation): standard alignment check, syllabus regeneration, manifest update, tracking JSON creation.
- [ ] Run Phase 1 (lesson scaffolding): use the extractor at `design-documentation/tools/content-dev/extract.js` to create the lesson folder tree.
- [ ] Verify scaffold per the content-development spec.
- [ ] Open PR; merge.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`content-development-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/content-development-process.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- Phase 0 reconciliation report shows all-pass.
- Phase 1 extractor produces the full lesson tree with no errors.
- Each lesson folder has the canonical artifact set per `template-manifest.md`.

**Common pitfalls:** Skipping Phase 0 reconciliation. Misalignment is a hard-stop; never proceed to Phase 1 with reconciliation findings open.

**Canonical spec:** [`content-development-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/content-development-process.md) *(covers rows 5 and 7)*
**Issue template:** [`issue-template--content-scaffolding.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--content-scaffolding.md)

---

## Row 6 — Code Migration

**When applicable / when to skip:** Skip for code-empty courses (e.g., ITIL Foundations). Run for any course with starter and/or solution code.

**Inputs:**
- Course slug.
- Course outline + lesson outlines.
- Source location(s) for upstream code (GitHub repo + subpath, or Drive folder URL).
- Pairing convention.

**Outputs:**
- `_COURSES Phase 1 - WORKING/courses/<slug>/deploy/repo-student-<slug>/` (starter staging tree).
- `_COURSES Phase 1 - WORKING/courses/<slug>/deploy/repo-instructor-<slug>/` (solution staging tree).
- `course-design/<slug>/code-manifest.md`.
- `course-design/<slug>/code-migration-reports/YYYY-MM-DD.md`.

**Operator checklist:**

- [ ] Open the code-migration sub-issue from `issue-template--code-migration.md`.
- [ ] Branch: `<issue#>-code-migration-<slug>` in design-documentation; parallel branch in workspace.
- [ ] Phase A (Design): inventory upstream sources, decide layout mode (flat or hierarchical), map projects → lessons, draft `code-manifest.md`. Open PR in **draft state**.
- [ ] Review gate: reviewer approves the manifest before any code is copied.
- [ ] Phase B (Execute): copy starters/solutions verbatim per the approved manifest. Generate per-tree READMEs. Finalize manifest. Write migration report.
- [ ] Run V1–V8 verification per spec §7.
- [ ] Un-draft PR; merge (two-repo split).

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`code-migration-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/code-migration-process.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- V1–V8 checks per the spec all pass.
- Re-running with unchanged inputs produces zero diff.
- Layout mode in `code-manifest.md` matches the staging-tree shape.

**Common pitfalls:** Skipping the review gate between Phase A and Phase B. Project-to-lesson assignment errors when neither explicit `code activity` refs nor case-insensitive substring match resolves.

**Canonical spec:** [`code-migration-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/code-migration-process.md)
**Issue template:** [`issue-template--code-migration.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--code-migration.md)

---

## Row 7 — Content Production (Phase 3)

**When applicable / when to skip:** Always required, after Content Scaffolding (row 5) and Code Migration (row 6, if applicable).

**Inputs:**
- Scaffolded lesson tree (row 5 output).
- Locked canonical templates from `template-manifest.md`.

**Outputs:**
- Production content for every lesson: `content.md`, `instructor-guide.md`, `quiz.md`, activity pairs filled in module by module.

**Operator checklist:**

- [ ] Open the content-production sub-issue from `issue-template--content-production.md`.
- [ ] For each module, author every lesson's artifacts to production quality.
- [ ] Run the alignment checker (`design-documentation/tools/content-dev/check.js`) on each artifact: structural, stylistic, completeness checks.
- [ ] Module review gate between modules.
- [ ] Open PR(s); merge.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`content-development-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/content-development-process.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- Every artifact passes the three-way alignment check.
- Per-lesson `target_questions` (quiz frontmatter) = `ceil(5 × hours)`.
- Module review gate sign-off recorded in the sub-issue.

**Common pitfalls:** Skipping the alignment checker. Quiz `target_questions` not matching `ceil(5 × hours)` will fail the alignment tool.

**Canonical spec:** [`content-development-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/content-development-process.md) *(covers rows 5 and 7)*
**Issue template:** [`issue-template--content-production.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--content-production.md)

---

## Row 8 — SCORM Packaging

**When applicable / when to skip:** Always required.

**Inputs:**
- Production lesson content (row 7 output).

**Outputs:**
- SCORM zips per lesson at `_COURSES Phase 1 - WORKING/courses/<slug>/deploy/scorm-<course>-<lesson-slug>.zip`.

**Operator checklist:**

- [ ] Open the scorm-packaging sub-issue from `issue-template--scorm-packaging.md`.
- [ ] Run the SCORM build per the spec.
- [ ] Rename outputs from `scorm-<course>-LNN.zip` to `scorm-<course>-<lesson-slug>.zip` per `naming-conventions.md`.
- [ ] Verify each zip opens cleanly and runs in a SCORM preview.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`scorm-packaging-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/scorm-packaging-process.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- One SCORM zip per lesson.
- Filenames follow `scorm-<course>-<lesson-slug>.zip`.
- SCORM preview runs end-to-end.

**Common pitfalls:** Forgetting the post-rename. The auto-generated `LNN` filenames will not match Absorb's expected naming.

**Canonical spec:** [`scorm-packaging-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/scorm-packaging-process.md)
**Issue template:** [`issue-template--scorm-packaging.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--scorm-packaging.md)

---

## Row 9 — Deployment

**When applicable / when to skip:** Always required.

**Inputs:**
- SCORM zips (row 8 output).
- `deploy/repo-student-<slug>/` and `deploy/repo-instructor-<slug>/` (row 6 output, if applicable).

**Outputs:**
- Lesson PDFs alongside SCORM zips in the deploy tree.
- Published `apprenti-org/<slug>-student` and `apprenti-org/<slug>-instructor` repos (or empty placeholders for code-empty courses).

**Operator checklist:**

- [ ] Open the deployment sub-issue from `issue-template--deployment.md`.
- [ ] Generate lesson PDFs per `lesson-pdf-generation-process.md` (pandoc + Chrome headless).
- [ ] Organize PDFs and SCORM zips in the deploy tree per the deployment spec.
- [ ] Push the staging trees to `apprenti-org/<slug>-student` and `apprenti-org/<slug>-instructor`.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`deployment-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/deployment-process.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- Deploy tree has all expected PDFs and SCORM zips.
- Both `apprenti-org/<slug>-student` and `apprenti-org/<slug>-instructor` exist on GitHub with expected contents.

**Common pitfalls:** Pandoc PDF generation can silently swallow images. Spot-check at least one PDF per module.

**Canonical spec:** [`deployment-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/deployment-process.md)
**Issue template:** [`issue-template--deployment.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--deployment.md)

---

## Row 10 — Starter Asset Audit

**When applicable / when to skip:** Run for any course whose lessons reference external assets (sample repos for forking, datasets, configs). Re-run after a major activity revision.

**Inputs:**
- Final production student-activity files (`courses/<slug>/modules/NN-*/lessons/NN-*/activities/*.md`, excluding `*-instructor.md`).

**Outputs:**
- A META issue in `apprenti-org/design-documentation` titled `META: Starter assets for <course-slug> (sample repos)`, with each asset's name, visibility, bootstrap contents, per-lesson dependency map, and acceptance criteria.

**Operator checklist:**

- [ ] Open the starter-asset-audit sub-issue from `issue-template--starter-asset-audit.md`.
- [ ] Scope the audit per spec §"Run procedure" Step 1.
- [ ] Walk every student-activity file and extract every external asset reference.
- [ ] Cross-check against instructor guides and lesson content.
- [ ] Open the META issue per the spec.

**AI-assisted path:**

> *Prompt TBD — see canonical spec at [`starter-asset-audit-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/starter-asset-audit-process.md). This prompt will be filled in after Spec 2's IaC course onboarding dogfoods this row.*

**Verification:**
- META issue body lists every asset referenced in any student-activity file.
- Per-lesson dependency map is complete.
- Audit is idempotent on unchanged content.

**Common pitfalls:** Missing assets referenced only in `*-instructor.md` files (out of scope — instructor-only refs do not block learners).

**Canonical spec:** [`starter-asset-audit-process.md`](https://github.com/apprenti-org/design-documentation/blob/main/curricula-design/design-process-documentation/starter-asset-audit-process.md)
**Issue template:** [`issue-template--starter-asset-audit.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--starter-asset-audit.md)

---

## Row 11 — LMS Upload

**Note:** This row is **manual** and has **no canonical process spec**. Drive the work from the issue template alone.

**When applicable / when to skip:** Always required as the final row.

**Inputs:**
- All deploy-tree artifacts (PDFs, SCORM zips) per row 9.
- Provisioned starter assets per row 10.
- Absorb LMS admin access.

**Outputs:**
- Course Published in Absorb.

**Operator checklist:**

- [ ] Open the lms-upload sub-issue from `issue-template--lms-upload.md`.
- [ ] Follow the issue template's step-by-step. Upload SCORM zips, configure quiz settings, link starter-asset URLs, set learner enrollment rules.
- [ ] Smoke-test the course as a learner: enroll, complete one lesson, take one quiz, confirm completion records.
- [ ] Publish.
- [ ] Update `tracking/repo/courses.json`: `status.development: "Complete"`, run `node build.js` to regenerate `courses.js`.

**AI-assisted path:**

> *Prompt TBD — no canonical spec exists for this row; an AI-assisted path will be developed during Spec 2's IaC dogfood and added here. Until then, the issue template at [`issue-template--lms-upload.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--lms-upload.md) is the source of truth.*

**Verification:**
- Course visible to learners in Absorb.
- Smoke-test learner completed at least one lesson and one quiz successfully.
- `tracking/repo/courses.json` shows `status.development: "Complete"`.

**Common pitfalls:** SCORM filenames not matching Absorb's expected pattern (per row 8 post-rename). Quiz settings drift from the per-lesson `target_questions` value.

**Canonical spec:** *None — this row is manual.*
**Issue template:** [`issue-template--lms-upload.md`](https://github.com/apprenti-org/design-documentation/blob/main/.github/ISSUE_TEMPLATE/issue-template--lms-upload.md)

---

## Closing the meta-issue

The meta-issue closes when **all** of these are true:

- [ ] Row 11 sub-issue is closed.
- [ ] `tracking/repo/courses.json` shows `status.design: "Complete"` and `status.development: "Complete"` for the course.
- [ ] Course is Published in Absorb.

### Post-close cleanup

- [ ] Confirm `tracking/repo/courses.json` has `statusConfirmed: true`.
- [ ] If a workspace `CLAUDE.md` change-log entry is warranted (e.g., new course landed, process spec touched), add it to the top of the change log.

---

## Change log

| Date | Issue | Description |
|---|---|---|
| 2026-05-02 | apprenti-org/curriculum-tracking#106 | Runbook v1 initial publication. All 11 rows present; AI-assisted path subsections are "Prompt TBD" placeholders, to be filled during the IaC course dogfood (Spec 2). |
