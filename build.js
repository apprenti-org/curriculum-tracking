#!/usr/bin/env node

/**
 * Curriculum Tracking Dashboard Build System
 *
 * Orchestrates the generation of all dashboard artifacts:
 * - courses.js (course data bundle)
 * - outlines/outlines.js (course outline bundles)
 *
 * Usage:
 *   node build.js              - Build everything once
 *   node build.js --watch      - Watch for changes and rebuild
 *   node build.js --validate   - Validate data without building
 *   node build.js --verbose    - Show detailed output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { generateCourseBundle, generateOutlineBundle, generateOverviewBundle } = require('./lib/generators');
const { validateSchema, validateReferences, validateSyllabusFiles, validateOutlineFiles } = require('./lib/validators');

// Read version from package.json
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

// Configuration — all paths relative to repo root
const BUILD_CONFIG = {
  rootDir: __dirname,
  version: pkg.version,
  source: 'courses.json',
  outlineManifest: 'outlines/manifest.json',

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
      name: 'overview-bundle',
      input: 'course-overview.json',
      output: 'course-overview.js',
      generate: generateOverviewBundle
    }
  ],

  validators: [
    validateSchema,
    validateReferences,
    validateSyllabusFiles,
    validateOutlineFiles
  ]
};

/**
 * Main build function
 */
async function build(options = {}) {
  const { validateOnly = false, verbose = false } = options;
  const startTime = Date.now();

  console.log('Building curriculum dashboard...\n');

  try {
    // 1. Load source data
    const dataPath = path.join(BUILD_CONFIG.rootDir, BUILD_CONFIG.source);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    console.log(`  Loaded ${data.courses.length} courses, ${data.curricula.length} curricula`);

    // 2. Run validators
    console.log('  Running validations...');
    let allErrors = [];
    let allWarnings = [];

    for (const validator of BUILD_CONFIG.validators) {
      const result = validator(data, BUILD_CONFIG);
      // Validators return { errors: [], warnings: [] } or plain array (treated as errors)
      if (Array.isArray(result)) {
        allErrors = allErrors.concat(result);
      } else {
        if (result.errors) allErrors = allErrors.concat(result.errors);
        if (result.warnings) allWarnings = allWarnings.concat(result.warnings);
      }
    }

    if (allWarnings.length > 0) {
      console.log(`\n  Warnings (${allWarnings.length}):`);
      allWarnings.forEach(w => console.log(`    - ${w}`));
    }

    if (allErrors.length > 0) {
      console.error(`\n  Errors (${allErrors.length}):`);
      allErrors.forEach(err => console.error(`    - ${err}`));
      console.error('\n  Build aborted due to errors.');
      process.exit(1);
    }

    console.log('  Validations passed');

    if (validateOnly) {
      console.log('\nValidation complete (build skipped).\n');
      return;
    }

    // 3. Run generators (output to repo root, in-place)
    console.log('  Generating outputs...');
    for (const gen of BUILD_CONFIG.generators) {
      if (verbose) console.log(`    ${gen.name}...`);
      gen.generate(data, BUILD_CONFIG);
      console.log(`    ${gen.output}`);
    }

    // 4. Run Python generators (course overview + knowledge base)
    //    These scan the workspace filesystem and produce derived data.
    //    They require Python 3 and access to the workspace folder structure.
    //    Skipped gracefully if Python is unavailable or workspace isn't detected.
    const scriptsDir = path.join(BUILD_CONFIG.rootDir, 'scripts');
    const workspaceBase = path.resolve(BUILD_CONFIG.rootDir, '..', '..', '..');

    if (fs.existsSync(path.join(workspaceBase, '_COURSES Phase 1 - WORKING'))) {
      console.log('  Running Python generators...');

      const pythonScripts = [
        { name: 'course-overview', script: 'generate-course-overview.py', output: 'course-overview.json' },
        { name: 'knowledge-base', script: 'generate-knowledge-base.py', output: 'knowledge base markdown' }
      ];

      for (const ps of pythonScripts) {
        const scriptPath = path.join(scriptsDir, ps.script);
        if (!fs.existsSync(scriptPath)) {
          console.log(`    ${ps.script} not found — skipping`);
          continue;
        }
        try {
          execSync(`python3 "${scriptPath}" --base "${workspaceBase}"`, {
            stdio: verbose ? 'inherit' : 'pipe',
            timeout: 120000
          });
          console.log(`    ${ps.output}`);
        } catch (pyErr) {
          console.warn(`    Warning: ${ps.script} failed — ${pyErr.message.split('\n')[0]}`);
        }
      }

      // Re-generate overview bundle now that course-overview.json is fresh
      if (fs.existsSync(path.join(BUILD_CONFIG.rootDir, 'course-overview.json'))) {
        generateOverviewBundle(data, BUILD_CONFIG);
        console.log('    course-overview.js (refreshed)');
      }
    } else {
      console.log('  Workspace not detected — skipping Python generators');
    }

    const elapsed = Date.now() - startTime;
    console.log(`\nBuild complete in ${elapsed}ms.\n`);

  } catch (err) {
    console.error('Build failed:', err.message);
    if (verbose) console.error(err.stack);
    process.exit(1);
  }
}

/**
 * Watch mode — rebuild on file changes
 */
function startWatchMode(options) {
  console.log('Watch mode enabled. Rebuilding on changes...\n');

  const watchFiles = [
    BUILD_CONFIG.source,
    BUILD_CONFIG.outlineManifest,
    'course-overview.json'
  ];

  watchFiles.forEach(file => {
    const filePath = path.join(BUILD_CONFIG.rootDir, file);
    fs.watch(filePath, (eventType) => {
      if (eventType === 'change') {
        console.log(`\n${file} changed. Rebuilding...\n`);
        build(options).catch(err => console.error('Rebuild error:', err.message));
      }
    });
    console.log(`  Watching: ${file}`);
  });

  console.log('\nPress Ctrl+C to stop.\n');

  // Initial build
  build(options).catch(err => console.error('Initial build failed:', err.message));
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);

  const options = {
    validateOnly: args.includes('--validate'),
    verbose: args.includes('--verbose')
  };

  if (args.includes('--watch')) {
    startWatchMode(options);
  } else {
    build(options).catch(err => {
      console.error(err);
      process.exit(1);
    });
  }
}

if (require.main === module) {
  main();
}

module.exports = { build, BUILD_CONFIG };
