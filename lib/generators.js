/**
 * Generation functions for curriculum dashboard bundles
 *
 * Generates JS bundles that the dashboard HTML loads via <script> tags:
 * - courses.js — courseData, curriculaData, courseStatusMap
 * - outlines/outlines.js — courseOutlines
 */

const fs = require('fs');
const path = require('path');

/**
 * Generate courses.js bundle
 *
 * Output matches the existing format consumed by index.html:
 *   const courseData = [...];
 *   const curriculaData = [...];
 *   const courseStatusMap = {};
 *   courseData.forEach(c => { courseStatusMap[c.name] = c; });
 */
function generateCourseBundle(data, config) {
  const version = config.version || '0.0.0';

  let js = '// Auto-generated from courses.json — do not edit directly\n';
  js += 'var dashboardVersion = ' + JSON.stringify(version) + ';\n\n';
  js += 'const courseData = ' + JSON.stringify(data.courses, null, 2) + ';\n\n';
  js += 'const curriculaData = ' + JSON.stringify(data.curricula, null, 2) + ';\n\n';
  js += 'const courseStatusMap = {};\n';
  js += 'courseData.forEach(c => {\n';
  js += '  courseStatusMap[c.name] = c;\n';
  js += '  if (c.id) courseStatusMap[c.id] = c;\n';
  js += '});\n';

  const outputPath = path.join(config.rootDir, 'courses.js');
  fs.writeFileSync(outputPath, js, 'utf8');
}

/**
 * Generate outlines/outlines.js bundle
 *
 * Output matches the existing format consumed by index.html:
 *   const courseOutlines = { "Course Name": {...}, ... };
 */
function generateOutlineBundle(data, config) {
  const manifestPath = path.join(config.rootDir, 'outlines', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const outlines = {};
  for (const entry of manifest) {
    const filePath = path.join(config.rootDir, 'outlines', entry.file);
    try {
      outlines[entry.course] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (err) {
      throw new Error(`Failed to load outline: ${entry.file} — ${err.message}`);
    }
  }

  let js = '// Auto-generated from outlines — do not edit directly\n';
  js += 'const courseOutlines = ' + JSON.stringify(outlines, null, 2) + ';\n';

  const outputPath = path.join(config.rootDir, 'outlines', 'outlines.js');
  fs.writeFileSync(outputPath, js, 'utf8');
}

module.exports = {
  generateCourseBundle,
  generateOutlineBundle
};
