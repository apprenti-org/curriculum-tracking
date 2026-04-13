# Phase 1 Overview Scanner — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend `scripts/generate-course-overview.py` so it can read Phase 1 deploy content (starting with ITIL Foundations) and report accurate `coverage`, `lessonsWithContent`, and `assets` values in `course-overview.json`.

**Architecture:** Add four new functions (`find_phase1_deploy_folder`, `count_phase1_assets`, `scan_phase1_deploy_folder`, `resolve_course_source`) that preserve the existing `source_data` shape. The main loop calls the new dispatcher instead of `find_source_folder()` / `scan_source_folder()` directly. Phase 1 is preferred; `_COURSES/` is the fallback. `compute_coverage()` is unchanged.

**Tech Stack:** Python 3 (stdlib only), `unittest` for tests, `node build.js` to regenerate bundles.

**Reference spec:** `DESIGN/PHASE1-OVERVIEW-SCANNER.md`

**Working branch:** `34-phase1-overview-scanner` (already created)

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `scripts/generate-course-overview.py` | Modify | Add 4 new functions, swap main-loop calls |
| `scripts/test_generate_course_overview.py` | Create | Unit tests for the new functions |
| `course-overview.json` | Regenerate (end) | Verify output for ITIL + regression courses |
| `course-overview.js` | Regenerate (end) | Dashboard bundle |

---

## Task 1: Scaffold the test file

**Files:**
- Create: `scripts/test_generate_course_overview.py`

- [ ] **Step 1: Create the test scaffold**

```python
"""Tests for Phase 1 scanner additions to generate-course-overview.py."""

import os
import sys
import tempfile
import unittest

# Import the generator as a module
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
import importlib.util
spec = importlib.util.spec_from_file_location(
    "gen_overview", os.path.join(SCRIPT_DIR, "generate-course-overview.py")
)
gen_overview = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen_overview)


class TestPhase1Scanner(unittest.TestCase):
    """Placeholder — tests will be added as functions are implemented."""

    def test_placeholder(self):
        self.assertTrue(hasattr(gen_overview, "main"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run it**

```bash
cd "_COURSES Phase 1 - WORKING/tracking/repo"
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: `Ran 1 test in ...s — OK`

- [ ] **Step 3: Commit**

```bash
git add scripts/test_generate_course_overview.py
git commit -m "Add test scaffold for Phase 1 overview scanner

Refs #34"
```

---

## Task 2: `count_phase1_assets` — classify Phase 1 deploy files

**Files:**
- Modify: `scripts/generate-course-overview.py` (append after `count_assets`, around line 160)
- Modify: `scripts/test_generate_course_overview.py`

- [ ] **Step 1: Write the failing tests**

Replace the `test_placeholder` method with:

```python
    def test_count_phase1_assets_empty(self):
        result = gen_overview.count_phase1_assets([])
        self.assertEqual(result['lessons'], 0)
        self.assertEqual(result['quizzes'], 0)
        self.assertEqual(result['activities'], 0)
        self.assertEqual(result['instructor_guides'], 0)
        self.assertEqual(result['interactives'], 0)
        self.assertEqual(result['slides'], 0)

    def test_count_phase1_assets_itil_lesson(self):
        files = [
            'lesson-01-what-is-itsm.pdf',
            'lesson-01-instructor-guide.pdf',
            'lesson-01-quiz.pdf',
            'lesson-01-quiz-answer-key.pdf',
            'lesson-01-exercise-identify-services-in-your-daily-life.pdf',
            'lesson-01-instructor-guide-exercise-identify-services-in-your-daily-life.pdf',
            'lesson-01-exercise-map-the-service-relationship.pdf',
            'lesson-01-instructor-guide-exercise-map-the-service-relationship.pdf',
            'scorm-itil-foundations-L01.zip',
        ]
        result = gen_overview.count_phase1_assets(files)
        self.assertEqual(result['lessons'], 1)
        self.assertEqual(result['instructor_guides'], 1)
        self.assertEqual(result['quizzes'], 1)  # answer-key not double-counted
        self.assertEqual(result['activities'], 2)  # 2 exercises, instructor copies skipped
        self.assertEqual(result['interactives'], 1)

    def test_count_phase1_assets_unused_categories_zero(self):
        files = ['lesson-01-foo.pdf', 'scorm-foo-L01.zip']
        result = gen_overview.count_phase1_assets(files)
        self.assertEqual(result['slides'], 0)
        self.assertEqual(result['demos'], 0)
        self.assertEqual(result['case_studies'], 0)
        self.assertEqual(result['mod_intro'], 0)
        self.assertEqual(result['mod_recap'], 0)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: 3 failures with `AttributeError: module 'gen_overview' has no attribute 'count_phase1_assets'`.

- [ ] **Step 3: Implement `count_phase1_assets`**

Add this function to `scripts/generate-course-overview.py` immediately after the `count_assets` function (after line 160, before `def scan_source_folder`):

```python
def count_phase1_assets(files):
    """Classify Phase 1 deploy-content files into the legacy asset schema.

    Phase 1 produces lesson/instructor-guide/quiz/exercise PDFs and SCORM zips.
    Categories not produced in Phase 1 (slides, demos, case_studies, mod_intro,
    mod_recap) stay at 0.

    Pattern priority (first match wins):
      1. scorm-*.zip                             -> interactives
      2. *-quiz-answer-key.pdf                   -> skipped (paired with quiz)
      3. *-quiz.pdf                              -> quizzes
      4. *-instructor-guide-exercise-*.pdf       -> skipped (instructor copy)
      5. *-exercise-*.pdf                        -> activities
      6. *-instructor-guide.pdf                  -> instructor_guides
      7. lesson-NN-*.pdf (any other)             -> lessons
    """
    counts = {'lessons': 0, 'slides': 0, 'quizzes': 0, 'activities': 0,
              'demos': 0, 'case_studies': 0, 'instructor_guides': 0,
              'interactives': 0, 'mod_intro': 0, 'mod_recap': 0}
    for f in files:
        fl = f.lower()
        if fl.startswith('scorm-') and fl.endswith('.zip'):
            counts['interactives'] += 1
        elif fl.endswith('-quiz-answer-key.pdf'):
            continue  # paired with the quiz pdf
        elif fl.endswith('-quiz.pdf'):
            counts['quizzes'] += 1
        elif '-instructor-guide-exercise-' in fl and fl.endswith('.pdf'):
            continue  # instructor copy of an activity
        elif '-exercise-' in fl and fl.endswith('.pdf'):
            counts['activities'] += 1
        elif fl.endswith('-instructor-guide.pdf'):
            counts['instructor_guides'] += 1
        elif re.match(r'lesson-\d+', fl) and fl.endswith('.pdf'):
            counts['lessons'] += 1
    return counts
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-course-overview.py scripts/test_generate_course_overview.py
git commit -m "Add count_phase1_assets for Phase 1 deploy-content file classification

Refs #34"
```

---

## Task 3: `find_phase1_deploy_folder` — locate Phase 1 content by course id

**Files:**
- Modify: `scripts/generate-course-overview.py` (append after `count_phase1_assets`)
- Modify: `scripts/test_generate_course_overview.py`

- [ ] **Step 1: Write the failing tests**

Add this new test method to the `TestPhase1Scanner` class:

```python
    def test_find_phase1_deploy_folder_found(self):
        with tempfile.TemporaryDirectory() as tmp:
            courses_dir = os.path.join(tmp, 'courses')
            content_dir = os.path.join(courses_dir, 'itil-foundations', 'deploy', 'content')
            os.makedirs(os.path.join(content_dir, 'module-01-intro'))
            paths = {'courses_dir': courses_dir}
            result = gen_overview.find_phase1_deploy_folder('itil-foundations', paths)
            self.assertEqual(result, content_dir)

    def test_find_phase1_deploy_folder_missing(self):
        with tempfile.TemporaryDirectory() as tmp:
            paths = {'courses_dir': os.path.join(tmp, 'courses')}
            result = gen_overview.find_phase1_deploy_folder('nonexistent', paths)
            self.assertIsNone(result)

    def test_find_phase1_deploy_folder_no_modules(self):
        with tempfile.TemporaryDirectory() as tmp:
            courses_dir = os.path.join(tmp, 'courses')
            content_dir = os.path.join(courses_dir, 'foo', 'deploy', 'content')
            os.makedirs(content_dir)  # empty — no module-* folder
            paths = {'courses_dir': courses_dir}
            result = gen_overview.find_phase1_deploy_folder('foo', paths)
            self.assertIsNone(result)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: 3 new failures — `AttributeError: ... 'find_phase1_deploy_folder'`.

- [ ] **Step 3: Implement `find_phase1_deploy_folder`**

Append to `scripts/generate-course-overview.py` after `count_phase1_assets`:

```python
def find_phase1_deploy_folder(course_id, paths):
    """Return the Phase 1 deploy/content folder for a course, or None.

    The folder counts as present only if it exists AND contains at least one
    `module-*` subdirectory (otherwise there's nothing to scan).
    """
    if not course_id:
        return None
    deploy_path = os.path.join(paths['courses_dir'], course_id, 'deploy', 'content')
    if not os.path.isdir(deploy_path):
        return None
    try:
        entries = os.listdir(deploy_path)
    except OSError:
        return None
    has_module = any(
        e.lower().startswith('module-') and os.path.isdir(os.path.join(deploy_path, e))
        for e in entries
    )
    return deploy_path if has_module else None
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-course-overview.py scripts/test_generate_course_overview.py
git commit -m "Add find_phase1_deploy_folder for Phase 1 course location

Refs #34"
```

---

## Task 4: `scan_phase1_deploy_folder` — build source_data dict from Phase 1 layout

**Files:**
- Modify: `scripts/generate-course-overview.py` (append after `find_phase1_deploy_folder`)
- Modify: `scripts/test_generate_course_overview.py`

- [ ] **Step 1: Write the failing tests**

Add to `TestPhase1Scanner`:

```python
    def _make_phase1_fixture(self, tmp):
        """Create a minimal Phase 1 deploy tree: 2 modules, 1 lesson each."""
        deploy = os.path.join(tmp, 'deploy', 'content')
        # Module 1, Lesson 1 — full set of artifacts
        m1l1 = os.path.join(deploy, 'module-01-intro', 'lesson-01-what-is-itsm')
        os.makedirs(m1l1)
        for f in [
            'lesson-01-what-is-itsm.pdf',
            'lesson-01-instructor-guide.pdf',
            'lesson-01-quiz.pdf',
            'lesson-01-quiz-answer-key.pdf',
            'lesson-01-exercise-sample.pdf',
            'lesson-01-instructor-guide-exercise-sample.pdf',
            'scorm-itil-foundations-L01.zip',
        ]:
            open(os.path.join(m1l1, f), 'w').close()
        # Module 2, Lesson 2 — lesson PDF + SCORM only
        m2l2 = os.path.join(deploy, 'module-02-svs', 'lesson-02-value-system')
        os.makedirs(m2l2)
        for f in ['lesson-02-value-system.pdf', 'scorm-itil-foundations-L02.zip']:
            open(os.path.join(m2l2, f), 'w').close()
        return deploy

    def test_scan_phase1_deploy_folder_shape(self):
        with tempfile.TemporaryDirectory() as tmp:
            deploy = self._make_phase1_fixture(tmp)
            result = gen_overview.scan_phase1_deploy_folder(deploy)
            self.assertIn(1, result['module_folders'])
            self.assertIn(2, result['module_folders'])
            self.assertEqual(len(result['module_folders']), 2)

    def test_scan_phase1_deploy_folder_totals(self):
        with tempfile.TemporaryDirectory() as tmp:
            deploy = self._make_phase1_fixture(tmp)
            result = gen_overview.scan_phase1_deploy_folder(deploy)
            self.assertEqual(result['total_lessons'], 2)
            self.assertEqual(result['total_instructor_guides'], 1)
            self.assertEqual(result['total_quizzes'], 1)
            self.assertEqual(result['total_activities'], 1)
            self.assertEqual(result['total_interactives'], 2)
            # Categories Phase 1 does not produce
            self.assertEqual(result['total_slides'], 0)
            self.assertEqual(result['total_demos'], 0)
            self.assertEqual(result['total_mod_intro'], 0)
            self.assertEqual(result['total_mod_recap'], 0)
            self.assertEqual(result['total_case_studies'], 0)

    def test_scan_phase1_deploy_folder_files_flattened_per_module(self):
        with tempfile.TemporaryDirectory() as tmp:
            deploy = self._make_phase1_fixture(tmp)
            result = gen_overview.scan_phase1_deploy_folder(deploy)
            m1_files = result['module_folders'][1]['files']
            self.assertIn('lesson-01-what-is-itsm.pdf', m1_files)
            self.assertIn('scorm-itil-foundations-L01.zip', m1_files)

    def test_scan_phase1_deploy_folder_empty_path(self):
        result = gen_overview.scan_phase1_deploy_folder(None)
        self.assertEqual(result['module_folders'], {})
        self.assertEqual(result['total_lessons'], 0)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: 4 new failures — `AttributeError: ... 'scan_phase1_deploy_folder'`.

- [ ] **Step 3: Implement `scan_phase1_deploy_folder`**

Append to `scripts/generate-course-overview.py` after `find_phase1_deploy_folder`:

```python
def scan_phase1_deploy_folder(deploy_path):
    """Scan a Phase 1 deploy/content folder and return a source_data dict.

    Shape matches scan_source_folder() output so the main loop can consume
    it uniformly. For each `module-NN-*/lesson-NN-*/` folder, all files are
    flattened into the module's `files` list (compute_coverage expects this).
    """
    result = {
        'module_folders': {},
        'root_files': [],
        'total_lessons': 0, 'total_slides': 0, 'total_quizzes': 0,
        'total_activities': 0, 'total_demos': 0, 'total_case_studies': 0,
        'total_instructor_guides': 0, 'total_interactives': 0,
        'total_mod_intro': 0, 'total_mod_recap': 0,
    }

    if not deploy_path or not os.path.isdir(deploy_path):
        return result

    try:
        entries = sorted(os.listdir(deploy_path))
    except OSError:
        return result

    for entry in entries:
        entry_path = os.path.join(deploy_path, entry)
        if not os.path.isdir(entry_path):
            continue
        m = re.match(r'module-(\d+)', entry, re.IGNORECASE)
        if not m:
            continue
        mod_num = int(m.group(1))

        # Flatten files from each lesson-NN-*/ subfolder
        all_files = []
        try:
            lesson_entries = os.listdir(entry_path)
        except OSError:
            lesson_entries = []
        for lesson_entry in lesson_entries:
            lesson_path = os.path.join(entry_path, lesson_entry)
            if os.path.isdir(lesson_path) and re.match(r'lesson-\d+', lesson_entry, re.IGNORECASE):
                try:
                    all_files.extend(os.listdir(lesson_path))
                except OSError:
                    pass

        result['module_folders'][mod_num] = {
            'path': entry_path,
            'name': entry,
            'files': all_files,
        }

    # Compute totals per module using the Phase 1 classifier
    for mod_num, mod_data in result['module_folders'].items():
        counts = count_phase1_assets(mod_data['files'])
        for key in counts:
            result[f'total_{key}'] += counts[key]

    return result
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: all 10 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-course-overview.py scripts/test_generate_course_overview.py
git commit -m "Add scan_phase1_deploy_folder for Phase 1 course scanning

Refs #34"
```

---

## Task 5: `resolve_course_source` — dispatcher (Phase 1 first, legacy fallback)

**Files:**
- Modify: `scripts/generate-course-overview.py` (append after `scan_phase1_deploy_folder`)
- Modify: `scripts/test_generate_course_overview.py`

- [ ] **Step 1: Write the failing tests**

Add to `TestPhase1Scanner`:

```python
    def test_resolve_course_source_prefers_phase1(self):
        with tempfile.TemporaryDirectory() as tmp:
            courses_dir = os.path.join(tmp, 'courses')
            courses_source = os.path.join(tmp, 'legacy')
            os.makedirs(courses_source)
            # Phase 1 deploy folder with a module
            m1 = os.path.join(courses_dir, 'itil-foundations', 'deploy', 'content',
                              'module-01-intro', 'lesson-01-x')
            os.makedirs(m1)
            open(os.path.join(m1, 'lesson-01-x.pdf'), 'w').close()

            paths = {'courses_dir': courses_dir, 'courses_source': courses_source}
            course = {'id': 'itil-foundations', 'name': 'ITIL Foundations'}

            source_info, source_data = gen_overview.resolve_course_source(course, paths)
            self.assertIsNotNone(source_info)
            self.assertEqual(source_info[1], 'itil-foundations/deploy/content')
            self.assertEqual(source_data['total_lessons'], 1)

    def test_resolve_course_source_legacy_fallback(self):
        with tempfile.TemporaryDirectory() as tmp:
            courses_dir = os.path.join(tmp, 'courses')
            courses_source = os.path.join(tmp, 'legacy')
            os.makedirs(courses_dir)
            # No Phase 1 content; legacy folder has a matching name
            legacy_folder = os.path.join(courses_source, 'Course: Some Course')
            os.makedirs(legacy_folder)

            paths = {'courses_dir': courses_dir, 'courses_source': courses_source}
            course = {'id': 'some-course', 'name': 'Some Course'}

            source_info, source_data = gen_overview.resolve_course_source(course, paths)
            # Legacy scan returns the folder even if empty (no module_folders)
            self.assertIsNotNone(source_info)
            self.assertEqual(source_info[1], 'Course: Some Course')

    def test_resolve_course_source_none(self):
        with tempfile.TemporaryDirectory() as tmp:
            courses_dir = os.path.join(tmp, 'courses')
            courses_source = os.path.join(tmp, 'legacy')
            os.makedirs(courses_dir)
            os.makedirs(courses_source)
            paths = {'courses_dir': courses_dir, 'courses_source': courses_source}
            course = {'id': 'ghost-course', 'name': 'Ghost Course'}

            source_info, source_data = gen_overview.resolve_course_source(course, paths)
            self.assertIsNone(source_info)
            self.assertEqual(source_data['module_folders'], {})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: 3 new failures — `AttributeError: ... 'resolve_course_source'`.

- [ ] **Step 3: Implement `resolve_course_source`**

Append to `scripts/generate-course-overview.py` after `scan_phase1_deploy_folder`:

```python
def resolve_course_source(course, paths):
    """Return (source_info, source_data) for a course.

    Prefers Phase 1 deploy content; falls back to the legacy _COURSES/ scan.

    source_info is (absolute_path, display_folder_name) or None.
    source_data matches the shape returned by scan_source_folder()/
    scan_phase1_deploy_folder().
    """
    course_id = course.get('id', '')
    name = course.get('name', course_id)

    # Try Phase 1 first
    phase1_path = find_phase1_deploy_folder(course_id, paths)
    if phase1_path:
        display = f"{course_id}/deploy/content"
        source_data = scan_phase1_deploy_folder(phase1_path)
        if source_data['module_folders']:
            return (phase1_path, display), source_data

    # Fall back to legacy _COURSES/ scan
    legacy_info = find_source_folder(name, paths['courses_source'])
    legacy_data = scan_source_folder(legacy_info[0] if legacy_info else None)
    return legacy_info, legacy_data
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: all 13 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-course-overview.py scripts/test_generate_course_overview.py
git commit -m "Add resolve_course_source dispatcher (Phase 1 first, legacy fallback)

Refs #34"
```

---

## Task 6: Wire the dispatcher into the main loop

**Files:**
- Modify: `scripts/generate-course-overview.py` (lines ~726-728)

- [ ] **Step 1: Read the existing main loop**

Locate this block around line 726:

```python
        source_info = find_source_folder(name, paths['courses_source'])
        source_data = scan_source_folder(source_info[0] if source_info else None)
        has_source = source_info is not None and bool(source_data['module_folders'])
```

- [ ] **Step 2: Replace with the dispatcher call**

Change those three lines to:

```python
        source_info, source_data = resolve_course_source(course, paths)
        has_source = source_info is not None and bool(source_data['module_folders'])
```

No other changes needed in the main loop — the existing code already reads `source_data['total_*']` values uniformly, and `compute_coverage()` works with the same `source_data` shape.

- [ ] **Step 3: Run existing tests to confirm no regression**

```bash
python3 -m unittest scripts.test_generate_course_overview -v
```

Expected: all 13 tests still pass.

- [ ] **Step 4: Run the generator end-to-end**

```bash
python3 scripts/generate-course-overview.py
```

Expected: prints a per-course line for every course; ITIL Foundations should now show nonzero coverage and assets (e.g., `itil-foundations: 7m/19l, ~70 assets, coverage=100%`). No Python errors.

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-course-overview.py
git commit -m "Wire resolve_course_source into the main overview loop

Refs #34"
```

---

## Task 7: Verify ITIL Foundations output and regressions

**Files:**
- Read: `course-overview.json` (after running the generator in Task 6)

- [ ] **Step 1: Inspect ITIL Foundations entry**

```bash
python3 -c "
import json
d = json.load(open('course-overview.json'))
for c in d['courses']:
    if c['id'] == 'itil-foundations':
        import pprint; pprint.pprint(c)
        break
"
```

Expected:
- `source.exists`: `True`
- `source.folder`: `itil-foundations/deploy/content`
- `coverage`: `100` (or close — 19 lessons all have a PDF)
- `lessonsWithContent`: `19`
- `assets.lessons`: `19`
- `assets.instructorGuides`: `19`
- `assets.quizzes`: `19`
- `assets.interactives`: `19`
- `assets.activities`: `> 0` (multiple exercises per lesson)
- `assets.slides`, `assets.demos`, `assets.caseStudies`, `assets.modIntros`, `assets.modRecaps`: all `0`

- [ ] **Step 2: Regression — pick a legacy course and confirm it is unchanged**

```bash
python3 -c "
import json
d = json.load(open('course-overview.json'))
for c in d['courses']:
    if c['id'] == 'comptia-a-plus':
        import pprint; pprint.pprint(c)
        break
"
```

Expected: `source.exists` and asset counts consistent with the pre-change snapshot (non-zero if the legacy `_COURSES/` folder has content). Compare against `git show HEAD~N:course-overview.json` if in doubt.

- [ ] **Step 3: Regression — confirm a course with no source anywhere stays empty**

```bash
python3 -c "
import json
d = json.load(open('course-overview.json'))
empties = [c for c in d['courses'] if not c['source']['exists']]
for c in empties[:3]:
    print(c['id'], c['source'], c['coverage'], c['totalAssets'])
"
```

Expected: `source.exists: False`, `coverage: None` (or `null` in JSON), `totalAssets: 0`.

- [ ] **Step 4: Regenerate the JS bundles via `build.js`**

```bash
node build.js
```

Expected: `Build complete in Xms.` with no errors.

- [ ] **Step 5: Preview dashboard locally**

```bash
python3 -m http.server 8765 &
SERVER_PID=$!
sleep 1
open http://localhost:8765/index.html
# verify ITIL Foundations detail panel now shows real coverage/assets
# when done:
kill $SERVER_PID
```

Expected: ITIL Foundations detail panel shows non-zero coverage, lessons, and asset counts.

- [ ] **Step 6: Commit regenerated bundles**

```bash
git add course-overview.json course-overview.js
git commit -m "Regenerate course-overview bundles with Phase 1 scanner

ITIL Foundations now shows correct coverage and asset counts.

Refs #34"
```

---

## Task 8: PR and merge

- [ ] **Step 1: Push branch and open PR**

```bash
git push -u origin 34-phase1-overview-scanner

gh pr create --title "Add Phase 1 deploy-content scanner to overview generator" --body "$(cat <<'EOF'
## Summary
- Adds four new functions in `scripts/generate-course-overview.py` to scan Phase 1 deploy content
- Prefers Phase 1 when present; falls back to `_COURSES/` scan otherwise
- No schema change to `course-overview.json`
- ITIL Foundations now reports accurate coverage and asset counts

## Test plan
- [ ] Unit tests for all four new functions pass (`python3 -m unittest scripts.test_generate_course_overview`)
- [ ] ITIL Foundations entry in `course-overview.json` shows nonzero coverage, 19 lessons, 19 quizzes, 19 instructor guides, 19 interactives (SCORM)
- [ ] A legacy course (e.g., CompTIA A+) is unchanged
- [ ] A course with no source folder still shows `coverage: null, totalAssets: 0`
- [ ] Dashboard detail panel previews correctly in localhost

Closes #34
EOF
)"
```

- [ ] **Step 2: Verify mergeability**

```bash
gh pr view --json mergeable,mergeStateStatus
```

Expected: `MERGEABLE` and `CLEAN`.

- [ ] **Step 3: Merge**

```bash
gh pr merge --merge --delete-branch
```

Expected: PR merged, branch deleted locally and remotely.

---

## Self-Review Notes

- Spec coverage: every spec section has at least one task (find/scan/count/dispatch/main-loop/testing).
- No placeholders: all code blocks are concrete; no "add error handling" stubs.
- Type consistency: `source_data` dict has the same keys in Phase 1 and legacy paths; `count_phase1_assets` returns the same keys as `count_assets`; `resolve_course_source` returns the `(source_info, source_data)` tuple shape used throughout the main loop.
- Scope: single file modified, one test file added, eight tasks — appropriate for a single plan.
