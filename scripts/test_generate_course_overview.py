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

    def test_count_phase1_assets_empty(self):
        result = gen_overview.count_phase1_assets([])
        self.assertEqual(result['lessons'], 0)
        self.assertEqual(result['quizzes'], 0)
        self.assertEqual(result['activities'], 0)
        self.assertEqual(result['instructor_guides'], 0)
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
        self.assertEqual(result['slides'], 1)  # SCORM counted as slides

    def test_count_phase1_assets_unused_categories_zero(self):
        files = ['lesson-01-foo.pdf', 'scorm-foo-L01.zip']
        result = gen_overview.count_phase1_assets(files)
        self.assertEqual(result['demos'], 0)
        self.assertEqual(result['case_studies'], 0)
        self.assertEqual(result['mod_intro'], 0)
        self.assertEqual(result['mod_recap'], 0)

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
            self.assertEqual(result['total_slides'], 2)  # SCORM zips count as slides
            # Categories Phase 1 does not produce
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
            # No Phase 1 content; legacy folder has a matching name.
            # Use a multi-word name so find_source_folder's overlap filter passes
            # (it requires overlap >= 2 unless max_score == 1.0).
            legacy_folder = os.path.join(courses_source, 'Course: Python Fundamentals')
            os.makedirs(legacy_folder)

            paths = {'courses_dir': courses_dir, 'courses_source': courses_source}
            course = {'id': 'python-fundamentals', 'name': 'Python Fundamentals'}

            source_info, source_data = gen_overview.resolve_course_source(course, paths)
            # Legacy scan returns the folder even if empty (no module_folders)
            self.assertIsNotNone(source_info)
            self.assertEqual(source_info[1], 'Course: Python Fundamentals')

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


class TestFolderJsonMatching(unittest.TestCase):
    """Tests for match_folder_json_ids — the folder↔courses.json id matcher.

    These tests guard against the bug where the fuzzy matcher iterated over
    Python sets (non-deterministic across hash seeds) and took the first
    overlap-≥2 match rather than the best match. See curriculum-tracking#53.
    """

    def test_direct_matches_preserved(self):
        folders = ['itil-foundations', 'data-literacy']
        json_ids = ['itil-foundations', 'data-literacy']
        f2j, j2f = gen_overview.match_folder_json_ids(folders, json_ids)
        self.assertEqual(f2j, {'itil-foundations': 'itil-foundations',
                               'data-literacy': 'data-literacy'})
        self.assertEqual(j2f, {'itil-foundations': 'itil-foundations',
                               'data-literacy': 'data-literacy'})

    def test_coding_booster_family_maps_correctly(self):
        """All 5 Coding Booster folders → their matching -intensive json ids."""
        folders = [
            'cpp-coding-booster',
            'java-coding-booster',
            'javascript-coding-booster',
            'python-coding-booster',
            'sql-coding-booster',
        ]
        json_ids = [
            'c-plus-plus-coding-booster-intensive',
            'java-coding-booster-intensive',
            'javascript-coding-booster-intensive',
            'python-coding-booster-intensive',
            'sql-coding-booster-intensive',
        ]
        f2j, _ = gen_overview.match_folder_json_ids(folders, json_ids)
        self.assertEqual(f2j['cpp-coding-booster'], 'c-plus-plus-coding-booster-intensive')
        self.assertEqual(f2j['java-coding-booster'], 'java-coding-booster-intensive')
        self.assertEqual(f2j['javascript-coding-booster'], 'javascript-coding-booster-intensive')
        self.assertEqual(f2j['python-coding-booster'], 'python-coding-booster-intensive')
        self.assertEqual(f2j['sql-coding-booster'], 'sql-coding-booster-intensive')

    def test_data_fundamentals_family_maps_correctly(self):
        """Collision case: folders sharing 'data', 'sql', or 'for' route correctly."""
        folders = [
            'sql-for-data',
            'excel-for-data-analysts',
            'sql-fundamentals-operations',
        ]
        json_ids = [
            'data-fundamentals-sql-for-data',
            'data-fundamentals-excel-for-data-analysts',
            'sql-fundamentals-for-operations',
        ]
        f2j, _ = gen_overview.match_folder_json_ids(folders, json_ids)
        self.assertEqual(f2j['sql-for-data'], 'data-fundamentals-sql-for-data')
        self.assertEqual(f2j['excel-for-data-analysts'],
                         'data-fundamentals-excel-for-data-analysts')
        self.assertEqual(f2j['sql-fundamentals-operations'],
                         'sql-fundamentals-for-operations')

    def test_unrelated_folders_unmatched(self):
        """Folders with no shared tokens beyond noise don't get force-matched."""
        folders = ['astronomy-basics']
        json_ids = ['cooking-101', 'history-of-rome']
        f2j, _ = gen_overview.match_folder_json_ids(folders, json_ids)
        self.assertNotIn('astronomy-basics', f2j)

    def test_deterministic_under_input_permutation(self):
        """Output must be identical regardless of input list order."""
        folders_a = [
            'cpp-coding-booster', 'java-coding-booster',
            'javascript-coding-booster', 'python-coding-booster',
            'sql-coding-booster',
        ]
        folders_b = list(reversed(folders_a))
        json_ids_a = [
            'c-plus-plus-coding-booster-intensive',
            'java-coding-booster-intensive',
            'javascript-coding-booster-intensive',
            'python-coding-booster-intensive',
            'sql-coding-booster-intensive',
        ]
        json_ids_b = list(reversed(json_ids_a))
        result_a = gen_overview.match_folder_json_ids(folders_a, json_ids_a)
        result_b = gen_overview.match_folder_json_ids(folders_b, json_ids_b)
        self.assertEqual(result_a, result_b)

    def test_prefers_substring_over_lower_overlap(self):
        """A folder id that's a substring of a json id beats a word-overlap peer."""
        # 'java-coding-booster' is a de-hyphenated substring of
        # 'java-coding-booster-intensive' (higher score)
        # but only shares {coding,booster} with 'python-coding-booster-intensive'
        folders = ['java-coding-booster']
        json_ids = ['python-coding-booster-intensive', 'java-coding-booster-intensive']
        f2j, _ = gen_overview.match_folder_json_ids(folders, json_ids)
        self.assertEqual(f2j['java-coding-booster'], 'java-coding-booster-intensive')

    def test_handles_empty_inputs(self):
        self.assertEqual(gen_overview.match_folder_json_ids([], []), ({}, {}))
        self.assertEqual(gen_overview.match_folder_json_ids(['a'], []), ({}, {}))
        self.assertEqual(gen_overview.match_folder_json_ids([], ['a']), ({}, {}))


if __name__ == "__main__":
    unittest.main()
