# Phase 1 Deploy Content Scanner for Course Overview Generator

**Issue:** apprenti-org/curriculum-tracking#34
**Date:** 2026-04-13

## Problem

`scripts/generate-course-overview.py` scans only `_COURSES/` to compute asset counts, coverage %, and `source.folder` for each course. Courses whose content has moved to the Phase 1 location — `_COURSES Phase 1 - WORKING/courses/<id>/deploy/content/` — have no source folder in `_COURSES/`, so the dashboard reports:

- `coverage: 0`
- `lessonsWithContent: 0`
- All asset counts: 0
- `source.exists: false`

ITIL Foundations is the first fully deployed Phase 1 course and surfaces this bug. More Phase 1 courses will follow.

## Goal

Extend the generator so a course with a Phase 1 `deploy/content/` folder produces correct `assets`, `coverage`, and `lessonsWithContent` values. No change to `course-overview.json` schema. No dashboard changes.

## Non-goals

- Repointing legacy courses that still live in `_COURSES/`
- Supporting merged-source cases (content in both locations)
- Migrating every course to Phase 1

## Approach

Add a Phase 1 scanner that runs **first** for each course. If the course has a Phase 1 deploy folder with content, use it. Otherwise fall back to the existing legacy scan on `_COURSES/`.

### Resolution Order

For each course in `courses.json`:

1. Check `_COURSES Phase 1 - WORKING/courses/<course.id>/deploy/content/` — if it exists and has at least one `module-*` subfolder, use Phase 1 scanner.
2. Otherwise, call existing `find_source_folder()` / `scan_source_folder()` on `_COURSES/`.

Disk presence is the sole signal — no new config in `courses.json`.

## Design

### New Functions

```
find_phase1_deploy_folder(course_id, paths) -> Path | None
scan_phase1_deploy_folder(deploy_path) -> source_data dict
count_phase1_assets(files) -> asset counts dict
resolve_course_source(course, paths) -> (source_info, source_data, asset_scheme)
```

`resolve_course_source()` is the dispatcher. It returns:
- `source_info`: `(path, folder_name)` tuple or `None`
- `source_data`: scan output shaped like the legacy `scan_source_folder()` return
- `asset_scheme`: `'phase1'` or `'legacy'` — tells the main loop which asset counter to use

### Phase 1 Folder Discovery

```
_COURSES Phase 1 - WORKING/courses/<course.id>/deploy/content/
    module-NN-<name>/
        lesson-NN-<name>/
            lesson-NN-<name>.pdf
            lesson-NN-instructor-guide.pdf
            lesson-NN-quiz.pdf
            lesson-NN-quiz-answer-key.pdf
            lesson-NN-exercise-<name>.pdf
            lesson-NN-instructor-guide-exercise-<name>.pdf
            scorm-<slug>-L##.zip
```

`find_phase1_deploy_folder()` returns the `deploy/content/` path if it exists AND contains at least one `module-*` subfolder. Else `None`.

### Phase 1 Scanner

`scan_phase1_deploy_folder(deploy_path)` produces the same `source_data` shape as the legacy scanner:

```python
{
    'module_folders': {
        module_number: {
            'folder': '<module folder name>',
            'files': ['<flat list of all files across lessons in this module>']
        },
        ...
    }
}
```

Module number is parsed from the `module-NN-*` folder name. Files are aggregated across all `lesson-NN-*/` subfolders in that module — the legacy `compute_coverage()` function operates on module-level file lists, so flattening preserves its behavior.

### Phase 1 Asset Classifier

`count_phase1_assets(files)` maps Phase 1 file patterns to the existing asset schema. Each file is classified by the **first matching pattern**; order matters:

| Order | File pattern | Category |
|---|---|---|
| 1 | `scorm-*.zip` | slides (SCORM packages are pedagogically equivalent to slide decks) |
| 2 | `*-quiz-answer-key.pdf` | _skipped_ (paired with the quiz PDF) |
| 3 | `*-quiz.pdf` | quizzes |
| 4 | `*-instructor-guide-exercise-*.pdf` | _skipped_ (instructor copy of activity) |
| 5 | `*-exercise-*.pdf` | activities |
| 6 | `*-instructor-guide.pdf` | instructorGuides |
| 7 | `lesson-NN-*.pdf` (any other lesson-prefixed PDF) | lessons |

Categories not produced in Phase 1 stay at 0: `demos`, `caseStudies`, `modIntros`, `modRecaps`.

The `interactives` category was dropped — SCORMs are counted as slides.

Dedup rules:
- Quiz + answer-key count as 1 quiz (the answer key is paired material, not a second quiz).
- Student exercise + instructor-guide-for-exercise count as 1 activity (same pairing rule).

### Coverage Calculation

`compute_coverage()` is unchanged. It already operates on the `source_data` shape. For Phase 1, the aggregated lesson files per module let it detect "this module has content" correctly, and lessons with a matching `lesson-NN-*.pdf` count as covered.

### Main Loop Integration

Current main loop:
```python
source_info = find_source_folder(name, paths['courses_source'])
source_data = scan_source_folder(source_info[0] if source_info else None)
has_source = source_info is not None and bool(source_data['module_folders'])
if has_source:
    coverage_pct, _, lessons_with_content = compute_coverage(modules, source_data)
    ...
# count assets
counts = count_assets(source_data['all_files'])
```

New main loop:
```python
source_info, source_data, asset_scheme = resolve_course_source(course, paths)
has_source = source_info is not None and bool(source_data['module_folders'])
if has_source:
    coverage_pct, _, lessons_with_content = compute_coverage(modules, source_data)
    ...
counts = (count_phase1_assets if asset_scheme == 'phase1' else count_assets)(
    source_data['all_files']
)
```

`source.folder` reported in `course-overview.json` becomes the Phase 1 deploy folder path (e.g., `itil-foundations/deploy/content`) for Phase 1 courses, or the legacy folder name for `_COURSES/` courses.

## Data Flow

```
courses.json
    │
    ▼
for each course:
    resolve_course_source(course, paths)
        │
        ├── Phase 1 path exists with modules? → scan_phase1_deploy_folder()
        │                                       → count_phase1_assets()
        │
        └── else → find_source_folder() + scan_source_folder()
                   → count_assets()
    │
    ▼
compute_coverage(modules, source_data)  [unchanged]
    │
    ▼
course-overview.json entry
```

## Testing

Run `python3 scripts/generate-course-overview.py` (or `node build.js`) and verify:

### ITIL Foundations (Phase 1 — primary target)
- `source.exists`: true
- `source.folder`: points to `itil-foundations/deploy/content`
- `coverage`: > 0 (expect near 100 — 19 lessons with PDFs)
- `lessonsWithContent`: 19
- `assets.lessons`: 19
- `assets.instructorGuides`: 19
- `assets.quizzes`: 19
- `assets.activities`: > 0 (per-lesson exercise PDFs)
- `assets.interactives`: 19 (SCORM zips)
- `assets.slides`, `assets.demos`, `assets.caseStudies`, `assets.modIntros`, `assets.modRecaps`: 0
- `totalAssets`: sum of the above

### Regression: CompTIA A+ (legacy)
- Values unchanged vs current `course-overview.json`

### Regression: course with no source anywhere
- `source.exists`: false
- `coverage`: null
- All assets: 0

## Rollout

1. Write code changes and unit-test key functions (`find_phase1_deploy_folder`, `count_phase1_assets`).
2. Run generator locally, eyeball ITIL Foundations entry in `course-overview.json`.
3. Spot-check a legacy course (unchanged).
4. Regenerate `course-overview.js`, preview dashboard locally.
5. PR, merge.

## Open Questions

None.
