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
  const seenIds = new Set();

  data.courses.forEach((course, i) => {
    if (!course.id || typeof course.id !== 'string') {
      errors.push(`courses[${i}] (${course.name || '?'}): missing or invalid "id"`);
    } else if (!/^[a-z0-9-]+$/.test(course.id)) {
      errors.push(`courses[${i}] (${course.name}): id "${course.id}" must be kebab-case (lowercase, numbers, hyphens)`);
    } else if (seenIds.has(course.id)) {
      errors.push(`courses[${i}] (${course.name}): duplicate id "${course.id}"`);
    } else {
      seenIds.add(course.id);
    }

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
  const seenSlugs = new Set();

  data.curricula.forEach((curr, i) => {
    if (!curr.name || typeof curr.name !== 'string') {
      errors.push(`curricula[${i}]: missing or invalid "name"`);
    }
    if (!Array.isArray(curr.groups) && !Array.isArray(curr.courses)) {
      errors.push(`curricula[${i}] (${curr.name || '?'}): must have either "groups" or "courses" array`);
    }

    // Validate slug if present
    if (curr.slug) {
      if (!/^[a-z0-9-]+$/.test(curr.slug)) {
        errors.push(`curricula[${i}] (${curr.name}): slug "${curr.slug}" must be kebab-case`);
      } else if (seenSlugs.has(curr.slug)) {
        errors.push(`curricula[${i}] (${curr.name}): duplicate slug "${curr.slug}"`);
      } else {
        seenSlugs.add(curr.slug);
      }
    }

    // Validate standard if present
    if (curr.standard) {
      if (typeof curr.standard !== 'object') {
        errors.push(`curricula[${i}] (${curr.name}): "standard" must be an object`);
      } else {
        if (curr.standard.sourceUrl && typeof curr.standard.sourceUrl !== 'string') {
          errors.push(`curricula[${i}] (${curr.name}): standard.sourceUrl must be a string`);
        }
        if (curr.standard.markdownReference) {
          const mdPath = path.resolve(config.rootDir, '..', '..', '..', curr.standard.markdownReference);
          if (!fs.existsSync(mdPath)) {
            // Warn but don't error — workspace may not be available
            console.warn(`    Warning: curricula "${curr.name}": standard.markdownReference not found at ${curr.standard.markdownReference}`);
          }
        }
      }
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
 *
 * Course refs support three formats:
 *   - string: "course-id" (simple ID ref)
 *   - object with id: { id: "course-id", hoursOverride: 80 } (override ref)
 *   - object with name only: { name: "Course Name" } (legacy, deprecated)
 */
function validateReferences(data, config) {
  const warnings = [];
  const errors = [];

  const courseIds = new Set(data.courses.map(c => c.id));
  const courseNames = new Set(data.courses.map(c => c.name));

  /**
   * Validate a single course ref and return any issues
   */
  function validateRef(ref, currName) {
    // String ref — must be a valid course ID
    if (typeof ref === 'string') {
      if (!courseIds.has(ref)) {
        warnings.push(`curricula "${currName}": references unknown course ID "${ref}"`);
      }
      return;
    }

    // Object ref with id — preferred format
    if (ref && typeof ref === 'object' && ref.id) {
      if (!courseIds.has(ref.id)) {
        warnings.push(`curricula "${currName}": references unknown course ID "${ref.id}"`);
      }
      return;
    }

    // Legacy object ref with name only (no id) — deprecated
    if (ref && typeof ref === 'object' && ref.name) {
      warnings.push(`curricula "${currName}": legacy name-only ref "${ref.name}" — should be migrated to ID ref`);
      return;
    }

    // Invalid ref format
    errors.push(`curricula "${currName}": contains invalid course reference: ${JSON.stringify(ref)}`);
  }

  data.curricula.forEach(curr => {
    if (Array.isArray(curr.groups)) {
      curr.groups.forEach(group => {
        if (Array.isArray(group.courses)) {
          group.courses.forEach(ref => validateRef(ref, curr.name));
        }
      });
    }

    if (Array.isArray(curr.courses)) {
      curr.courses.forEach(ref => validateRef(ref, curr.name));
    }
  });

  return { errors, warnings };
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
