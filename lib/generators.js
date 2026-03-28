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
 *
 * Curricula refs are resolved at build time: ID strings and { id } objects
 * are expanded to { name, id, hoursOverride?, note? } so the frontend
 * doesn't need to perform lookups on raw IDs.
 */
function generateCourseBundle(data, config) {
  // Build ID → course lookup for resolving refs
  const courseById = {};
  data.courses.forEach(c => { courseById[c.id] = c; });

  // Deep-clone curricula and resolve course refs
  const resolvedCurricula = JSON.parse(JSON.stringify(data.curricula));

  resolvedCurricula.forEach(cur => {
    function resolveRefs(refs) {
      return refs.map(ref => {
        // String ref → expand to { name, id }
        if (typeof ref === 'string') {
          const course = courseById[ref];
          if (course) return { name: course.name, id: ref };
          // Unresolved ID — keep as object so frontend can display something
          return { name: ref, id: ref };
        }

        // Object ref with id → expand with name from master course
        if (ref.id) {
          const course = courseById[ref.id];
          const resolved = { name: course ? course.name : ref.id, id: ref.id };
          if (ref.hoursOverride !== undefined) resolved.hoursOverride = ref.hoursOverride;
          if (ref.note !== undefined) resolved.note = ref.note;
          return resolved;
        }

        // Legacy name-only ref — pass through as-is
        return ref;
      });
    }

    if (Array.isArray(cur.groups)) {
      cur.groups.forEach(g => {
        if (Array.isArray(g.courses)) {
          g.courses = resolveRefs(g.courses);
        }
      });
    }
    if (Array.isArray(cur.courses)) {
      cur.courses = resolveRefs(cur.courses);
    }
  });

  let js = '// Auto-generated from courses.json — do not edit directly\n';
  js += 'const courseData = ' + JSON.stringify(data.courses, null, 2) + ';\n\n';
  js += 'const curriculaData = ' + JSON.stringify(resolvedCurricula, null, 2) + ';\n\n';
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
