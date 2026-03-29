/**
 * Pipeline stage computation and document link resolution
 * Depends on: courseData, curriculaData, courseLookup (from data-store.js)
 *             syllabiMap, gapAnalysisMap, GAP_ANALYSIS_DRIVE_FOLDER (from constants.js)
 *             courseOutlines (from outlines.js)
 */

var PIPELINE_STAGES = ['Not Started', 'Source', 'Design', 'Development', 'Review', 'Deployed'];

var STAGE_CSS = {
    'Not Started': 'stage-not-started',
    'Source': 'stage-source',
    'Design': 'stage-design',
    'Development': 'stage-development',
    'Review': 'stage-review',
    'Deployed': 'stage-deployed'
};

var STAGE_ICONS = {
    'Not Started': 'fa-circle-minus',
    'Source': 'fa-folder-open',
    'Design': 'fa-drafting-compass',
    'Development': 'fa-code',
    'Review': 'fa-magnifying-glass',
    'Deployed': 'fa-rocket'
};

/**
 * Compute pipeline stage from existing course status fields + artifact presence
 */
function computeStage(course) {
    if (!course) return 'Not Started';

    var design = (course.status && course.status.design) || 'Not Started';
    var development = (course.status && course.status.development) || 'Not Started';
    var review = course.status && course.status.review;
    var deployment = course.status && course.status.deployment;

    if (deployment === 'Complete') return 'Deployed';
    if (deployment && deployment !== 'Not Started') return 'Deployed';
    if (review === 'Complete') return 'Review';
    if (review && review !== 'Not Started') return 'Review';
    if (development === 'Complete') return 'Development';
    if (development !== 'Not Started') return 'Development';
    if (design === 'Complete') return 'Design';
    if (design !== 'Not Started') return 'Design';
    if (course.driveFolder) return 'Source';
    return 'Not Started';
}

/**
 * Get the numeric index of a stage for comparison
 */
function stageIndex(stage) {
    return PIPELINE_STAGES.indexOf(stage);
}

/**
 * Resolve document links for a course
 * Returns { source: {...}, working: {...} } with URLs where available
 */
function getDocumentLinks(courseId, course) {
    var docs = {
        source: {},
        working: {}
    };

    if (!course) return docs;

    // Source documents
    if (course.driveFolder) {
        docs.source.driveFolder = { url: course.driveFolder, label: 'Drive Folder', icon: 'fa-brands fa-google-drive' };
    }

    // Working documents — outline JSON
    if (typeof courseOutlines !== 'undefined' && courseOutlines[course.name]) {
        docs.working.outlineJson = { url: null, label: 'Outline', icon: 'fa-solid fa-sitemap', exists: true };
    }

    // Working documents — syllabus HTML
    if (syllabiMap && syllabiMap[course.name]) {
        docs.working.syllabusHtml = { url: 'syllabi/' + syllabiMap[course.name], label: 'Syllabus', icon: 'fa-solid fa-file-lines', exists: true };
    }

    // Working documents — gap analysis
    if (gapAnalysisMap && gapAnalysisMap[course.name]) {
        docs.working.gapAnalysis = { url: GAP_ANALYSIS_DRIVE_FOLDER, label: 'Gap Analysis', icon: 'fa-solid fa-chart-bar', exists: true };
    }

    return docs;
}

/**
 * Resolve a course ref to a course object
 * Handles string IDs, { id: ... } objects, and { name: ... } legacy objects
 */
function resolveRef(ref) {
    if (typeof ref === 'string') {
        return { id: ref, course: courseLookup[ref], hoursOverride: null, note: null };
    }
    if (ref && ref.id) {
        return { id: ref.id, course: courseLookup[ref.id], hoursOverride: ref.hoursOverride || null, note: ref.note || null };
    }
    if (ref && ref.name) {
        return { id: null, course: courseLookup[ref.name], hoursOverride: ref.hoursOverride || null, note: ref.note || null };
    }
    return { id: null, course: null, hoursOverride: null, note: null };
}

/**
 * Compute pipeline summary counts for a set of courses
 * Returns { stageCounts: { 'Not Started': N, ... }, total: N }
 */
function computePipelineSummary(curriculum) {
    var counts = {};
    PIPELINE_STAGES.forEach(function(s) { counts[s] = 0; });
    var total = 0;

    function processCourses(refs) {
        refs.forEach(function(ref) {
            var resolved = resolveRef(ref);
            var stage = computeStage(resolved.course);
            counts[stage]++;
            total++;
        });
    }

    if (curriculum.groups) {
        curriculum.groups.forEach(function(g) {
            if (g.courses) processCourses(g.courses);
        });
    } else if (curriculum.courses) {
        processCourses(curriculum.courses);
    }

    return { stageCounts: counts, total: total };
}
