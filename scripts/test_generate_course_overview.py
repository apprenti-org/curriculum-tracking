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


if __name__ == "__main__":
    unittest.main()
