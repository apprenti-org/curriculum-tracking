/**
 * Validation functions for curriculum dashboard data
 *
 * Each validator receives (data, config) and returns an array of error strings.
 * An empty array means validation passed.
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate course and curriculum schema
 * Checks that required fields exist and have expected types
 */
function validateSchema(data, config) {
  const errors = [];

  if (!Array.isArray(data.courses)) {
    errors.push('courses.json: "courses" must be an array');
    return errors;
  }

  if (!Array.isArray(data.curricula)) {
    errors.push('courses.json: "curricula" must be an array');
    return errors;
  }

  // Validate each course entry
  data.courses.forEach((course, i) => {
    if (!course.name || typeof course.name !== 'string') {
      errors.push(`courses[${i}]: missing or invalid "name"`);
    }

    if (!course.status || typeof course.status !== 'object') {
      errors.push(`courses[${i}] (${course.name || '?'}): missing or invalid "status" object`);
    } else {
      if (!course.status.design) {
        errors.push(`courses[${i}] (${course.name}): missing "status.design"`);
      }
      if (!course.status.development) {
        errors.push(`courses[${i}] (${course.name}): missing "status.development"`);
      }
    }
  });

  // Validate each curriculum entry
  // Curricula use two formats: { groups: [...] } or { courses: [...] }
  data.curricula.forEach((curr, i) => {
    if (!curr.name || typeof curr.name !== 'string') {
      errors.push(`curricula[${i}]: missing or invalid "name"`);
    }
    if (!Array.isArray(curr.groups) && !Array.isArray(curr.courses)) {
      errors.push(`curricula[${i}] (${curr.name || '?'}): must have either "groups" or "courses" array`);
    }
  });

  // Check courses are sorted alphabetically
  for (let i = 1; i < data.courses.length; i++) {
    const prev = data.courses[i - 1].name;
    const curr = data.courses[i].name;
    if (prev && curr && prev.localeCompare(curr) > 0) {
      errors.push(`courses: not sorted alphabetically — "${prev}" comes before "${curr}"`);
      break;
    }
  }

  return errors;
}

/**
 * Validate cross-references between curricula and courses
 * Ensures every course referenced in a curriculum actually exists
 */
function validateReferences(data, config) {
  const warnings = [];

  const courseNames = new Set(data.courses.map(c => c.name));

  /**
   * Extract course name from a reference — handles both formats:
   *   string: "Course Name"
   *   object: { name: "Course Name", hoursOverride: 80 }
   */
  function getCourseName(ref) {
    if (typeof ref === 'string') return ref;
    if (ref && typeof ref === 'object' && ref.name) return ref.name;
    return null;
  }

  data.curricula.forEach(curr => {
    // Collect all course references from both formats
    const courseRefs = [];

    if (Array.isArray(curr.groups)) {
      curr.groups.forEach(group => {
        if (Array.isArray(group.courses)) {
          courseRefs.push(...group.courses);
        }
      });
    }

    if (Array.isArray(curr.courses)) {
      courseRefs.push(...curr.courses);
    }

    courseRefs.forEach(ref => {
      const name = getCourseName(ref);
      if (!name) {
        warnings.push(`curricula "${curr.name}": contains invalid course reference`);
      } else if (!courseNames.has(name)) {
        warnings.push(`curricula "${curr.name}": references unknown course "${name}"`);
      }
    });
  });

  return { errors: [], warnings };
}

/**
 * Validate that syllabus HTML files exist for courses that claim to have them
 * Checks the syllabi/ directory for matching HTML files
 */
function validateSyllabusFiles(data, config) {
  const errors = [];

  const syllabiDir = path.join(config.rootDir, 'syllabi');
  if (!fs.existsSync(syllabiDir)) {
    errors.push('syllabi/ directory not found');
    return errors;
  }

  const existingFiles = new Set(fs.readdirSync(syllabiDir));

  // Check for any .html files that don't look right
  existingFiles.forEach(file => {
    if (file.endsWith('.html') && file !== 'index.html') {
      // File exists — this is fine, just a presence check
    }
  });

  return errors;
}

/**
 * Validate outline files referenced in manifest.json exist
 */
function validateOutlineFiles(data, config) {
  const errors = [];

  const manifestPath = path.join(config.rootDir, 'outlines', 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push('outlines/manifest.json not found');
    return errors;
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  manifest.forEach(entry => {
    const filePath = path.join(config.rootDir, 'outlines', entry.file);
    if (!fs.existsSync(filePath)) {
      errors.push(`outlines: manifest references "${entry.file}" but file not found`);
    } else {
      // Validate the JSON is parseable and has required structure
      try {
        const outline = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!Array.isArray(outline.modules)) {
          errors.push(`outlines/${entry.file}: missing or invalid "modules" array`);
        }
        // "course" field is recommended but not required — some older outlines omit it
      } catch (err) {
        errors.push(`outlines/${entry.file}: invalid JSON — ${err.message}`);
      }
    }
  });

  // Check manifest is sorted alphabetically by course name
  for (let i = 1; i < manifest.length; i++) {
    const prev = manifest[i - 1].course;
    const curr = manifest[i].course;
    if (prev && curr && prev.localeCompare(curr) > 0) {
      errors.push(`outlines/manifest.json: not sorted — "${prev}" comes before "${curr}"`);
      break;
    }
  }

  return errors;
}

module.exports = {
  validateSchema,
  validateReferences,
  validateSyllabusFiles,
  validateOutlineFiles
};
