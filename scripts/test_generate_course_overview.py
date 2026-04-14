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


if __name__ == "__main__":
    unittest.main()
