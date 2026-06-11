const path = require('path');

/**
 * Resolve the input (courses) and output (syllabi) directories for
 * convert-syllabi.js without any hardcoded machine/sandbox paths.
 *
 * - `syllabiDir` lives inside this tracking repo, so it is derived from the
 *   script's own directory (repo-relative).
 * - `coursesDir` lives in the workspace (the Drive folder, separate from this
 *   repo), so it must come from `--workspace=<path>` or the SYLLABI_WORKSPACE
 *   env var. When neither is given it is `null` and the caller must error with a
 *   clear usage message — never fall back to a stale absolute path.
 *
 * @param {object} options
 * @param {string[]} options.argv - process.argv (or any arg array)
 * @param {object} options.env - process.env (or any env-like object)
 * @param {string} options.scriptDir - directory of convert-syllabi.js (__dirname)
 * @returns {{ coursesDir: string|null, syllabiDir: string, workspace: string|null }}
 */
function resolveSyllabiDirs({ argv = [], env = {}, scriptDir }) {
  const syllabiDir = path.join(scriptDir, 'syllabi');

  let workspace = null;
  const wsArg = argv.find((a) => typeof a === 'string' && a.startsWith('--workspace='));
  if (wsArg) {
    workspace = wsArg.slice('--workspace='.length);
  } else if (env.SYLLABI_WORKSPACE) {
    workspace = env.SYLLABI_WORKSPACE;
  }

  const coursesDir = workspace
    ? path.join(workspace, '_COURSES Phase 1 - WORKING', 'courses')
    : null;

  return { coursesDir, syllabiDir, workspace };
}

module.exports = { resolveSyllabiDirs };
