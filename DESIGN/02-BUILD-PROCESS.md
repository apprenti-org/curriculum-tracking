# Design Document: Build Process & Code Generation

**Status:** Fragile Manual Process
**Priority:** High (Enables other improvements)
**Complexity:** Medium
**Estimated Effort:** 1-2 weeks

---

## Current Problems

### 1. Manual Build Steps
Users must remember to run:
```bash
# Step 1: Generate courses.js
node -e "const fs = require('fs'); ..."

# Step 2: Generate outlines.js (in different directory)
cd outlines && node -e "const fs = require('fs'); ..."

# Step 3: Generate HTML syllabi
node convert-syllabi.js
```

**Issues:**
- Easy to forget a step
- Hard to know if builds are complete
- No error reporting
- No validation of output
- Different for each team member

### 2. Duplicate Code
- courses.js and outlines.js use similar generation logic
- convert-syllabi.js duplicates CSS from index.html
- No shared utilities

### 3. No Error Handling
```javascript
// Current generation is silent
JSON.stringify(data.courses, null, 2)
fs.writeFileSync('courses.js', js);  // If this fails, user doesn't know
```

### 4. No Validation Pipeline
- Generated files are not validated
- Invalid JSON can be written silently
- No check that referenced files exist
- No check that IDs match across files

---

## Proposed Solution: build.js with Configuration

### 1. Configuration-Driven Build

**build.js**
```javascript
const fs = require('fs');
const path = require('path');

const BUILD_CONFIG = {
  source: 'courses.json',
  sourceDir: '.',
  outputDir: './build',

  generators: [
    {
      name: 'courses-bundle',
      input: 'courses.json',
      output: 'courses.js',
      generate: generateCourseBundle
    },
    {
      name: 'outlines-bundle',
      input: 'outlines/manifest.json',
      output: 'outlines/outlines.js',
      generate: generateOutlineBundle
    },
    {
      name: 'syllabi-html',
      input: '../courses',  // relative to repo
      output: 'syllabi',
      generate: generateSyllabi
    }
  ],

  validators: [
    validateSchema,
    validateReferences,
    validateSyllabusFiles,
    validateOutlineFiles
  ]
};

async function build(options = {}) {
  console.log('🔨 Building curriculum dashboard...\n');

  try {
    // 1. Load data
    console.log('📂 Loading data...');
    const data = JSON.parse(
      fs.readFileSync(path.join(BUILD_CONFIG.sourceDir, BUILD_CONFIG.source))
    );

    // 2. Validate
    console.log('✓ Data loaded\n🔍 Validating...');
    for (const validator of BUILD_CONFIG.validators) {
      const errors = validator(data, BUILD_CONFIG);
      if (errors.length > 0) {
        console.error('❌ Validation failed:\n');
        errors.forEach(err => console.error(`  • ${err}`));
        process.exit(1);
      }
    }
    console.log('✓ All validations passed\n');

    // 3. Generate outputs
    console.log('🏗️  Generating outputs...');
    for (const gen of BUILD_CONFIG.generators) {
      try {
        console.log(`  • ${gen.name}...`);
        gen.generate(data, BUILD_CONFIG);
        console.log(`    ✓ ${gen.output}`);
      } catch (err) {
        console.error(`\n❌ Generator failed: ${gen.name}`);
        console.error(`   ${err.message}`);
        process.exit(1);
      }
    }

    console.log('\n✅ Build complete!');
    console.log(`   Generated ${BUILD_CONFIG.generators.length} artifacts`);

  } catch (err) {
    console.error('❌ Build failed:', err.message);
    process.exit(1);
  }
}

// Support --watch mode
if (process.argv.includes('--watch')) {
  const watch = require('watch');
  watch.watchTree(BUILD_CONFIG.sourceDir, () => {
    console.clear();
    build();
  });
} else {
  build();
}
```

### 2. Shared Generation Utilities

**lib/generators.js**
```javascript
function generateCourseBundle(data, config) {
  const fs = require('fs');
  const path = require('path');

  let js = '// Auto-generated from courses.json — do not edit directly\n';
  js += 'const courseData = ' + JSON.stringify(data.courses, null, 2) + ';\n\n';
  js += 'const curriculaData = ' + JSON.stringify(data.curricula, null, 2) + ';\n\n';
  js += 'const courseStatusMap = {};\n';
  js += 'courseData.forEach(c => { courseStatusMap[c.id] = c; });\n';

  const output = path.join(config.outputDir, 'courses.js');
  fs.writeFileSync(output, js);
}

function generateOutlineBundle(data, config) {
  const fs = require('fs');
  const path = require('path');

  const manifest = JSON.parse(
    fs.readFileSync(path.join(config.sourceDir, 'outlines/manifest.json'))
  );

  const outlines = {};
  for (const entry of manifest) {
    const filePath = path.join(config.sourceDir, 'outlines', entry.file);
    outlines[entry.course] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }

  let js = '// Auto-generated from outlines — do not edit directly\n';
  js += 'const courseOutlines = ' + JSON.stringify(outlines, null, 2) + ';\n';

  const output = path.join(config.outputDir, 'outlines', 'outlines.js');
  fs.writeFileSync(output, js);
}

// ... more generators
```

### 3. Validation Utilities

**lib/validators.js**
```javascript
function validateSchema(data, config) {
  const errors = [];

  if (!Array.isArray(data.courses)) {
    errors.push('courses must be an array');
  }

  if (!Array.isArray(data.curricula)) {
    errors.push('curricula must be an array');
  }

  // Validate each course
  data.courses?.forEach((course, i) => {
    if (!course.id) {
      errors.push(`courses[${i}]: missing required field 'id'`);
    }
    if (!course.name) {
      errors.push(`courses[${i}]: missing required field 'name'`);
    }
    if (typeof course.hours !== 'number' || course.hours < 0) {
      errors.push(`courses[${i}] (${course.name}): hours must be positive number`);
    }
    if (!course.status?.design || !course.status?.development) {
      errors.push(`courses[${i}] (${course.name}): missing status fields`);
    }
  });

  return errors;
}

function validateReferences(data, config) {
  const errors = [];
  const courseIds = new Set(data.courses.map(c => c.id));

  // Check curricula reference valid course IDs
  data.curricula?.forEach((curr, i) => {
    const courses = curr.courses || [];
    courses.forEach((courseId, j) => {
      if (!courseIds.has(courseId)) {
        errors.push(`curricula[${i}] (${curr.name}): references unknown course '${courseId}'`);
      }
    });
  });

  return errors;
}

function validateSyllabusFiles(data, config) {
  const fs = require('fs');
  const path = require('path');

  const errors = [];
  const syllabusDir = path.join(config.sourceDir, 'syllabi');

  data.courses?.forEach(course => {
    if (course.references?.syllabus?.filename) {
      const file = path.join(syllabusDir, course.references.syllabus.filename);
      if (!fs.existsSync(file)) {
        errors.push(`${course.name}: syllabus file not found: ${course.references.syllabus.filename}`);
      }
    }
  });

  return errors;
}

// ... more validators
```

### 4. Package.json Scripts

```json
{
  "scripts": {
    "build": "node build.js",
    "build:watch": "node build.js --watch",
    "build:validate": "node build.js --validate-only",
    "clean": "rm -rf build/",
    "dev": "npm run clean && npm run build:watch"
  }
}
```

**Usage:**
```bash
npm run build           # Build once
npm run build:watch    # Rebuild on changes (development)
npm run build:validate # Just validate, don't generate
```

---

## File Organization

```
tracking/repo/
├── build.js                    # Main build orchestrator
├── lib/
│  ├── generators.js           # Generation functions
│  ├── validators.js           # Validation functions
│  └── utils.js                # Shared utilities
├── data/
│  ├── courses.json            # Source of truth
│  └── outlines/
│     ├── manifest.json
│     └── *.json
├── build/                     # Build outputs (git-ignored)
│  ├── courses.js
│  ├── outlines/outlines.js
│  ├── syllabi/
│  └── validation-report.json
├── src/
│  ├── index.html
│  └── ...
└── package.json
```

---

## Benefits

✅ **Single command** — `npm run build` instead of remembering 3 steps
✅ **Error reporting** — Clear messages when something fails
✅ **Validation** — Catches bad data before generating files
✅ **Watch mode** — Auto-rebuild during development
✅ **Reusable** — Generator/validator functions can be tested independently
✅ **Scalable** — Easy to add new generators
✅ **Portable** — Works on any machine with Node.js

---

## Implementation Checklist

- [ ] Create build.js with configuration
- [ ] Extract shared generator functions
- [ ] Create validation library
- [ ] Update package.json with scripts
- [ ] Test build process
- [ ] Add error handling and reporting
- [ ] Document build process in README
- [ ] Add CI/CD integration (GitHub Actions)
- [ ] Test with --watch mode
