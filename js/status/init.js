/**
 * Status page initialization — builds data structures and kicks off rendering
 * Depends on: courseData, curriculaData (from courses.js)
 *             membershipMap (from shared/data-store.js)
 *             renderSummary, renderProgress (from status/summary.js)
 *             renderTable (from status/table.js)
 *
 * This must be the LAST status script loaded.
 */

// Build content data array from courseData + membershipMap + courseOverviewMap
var contentData = courseData.map(function(c) {
    var ov = (typeof courseOverviewMap !== 'undefined') ? (courseOverviewMap[c.id] || courseOverviewMap[c.name] || null) : null;
    return {
        id: c.id || '',
        name: c.name,
        type: 'Course',
        hours: c.hours,
        designStatus: c.status.design,
        devStatus: c.status.development,
        note: c.note || '',
        membership: membershipMap[c.id] || membershipMap[c.name] || [],
        // Overview data (from course-overview.json)
        coverage: ov ? ov.coverage : null,
        hasOutline: ov ? ov.outline.exists : false,
        hasSyllabus: ov ? ov.syllabus : false,
        hasSource: ov ? ov.source.exists : false,
        outlineModules: ov ? ov.outline.modules : 0,
        outlineLessons: ov ? ov.outline.lessons : 0,
        lessonsWithContent: ov ? ov.lessonsWithContent : 0,
        totalAssets: ov ? ov.totalAssets : 0,
        assets: ov ? ov.assets : null
    };
});

// Build unique curriculum names for filter chips
var allCurricula = [];
(function() {
    var seen = {};
    contentData.forEach(function(d) {
        d.membership.forEach(function(m) {
            if (!seen[m.curriculum]) {
                seen[m.curriculum] = true;
                allCurricula.push(m.curriculum);
            }
        });
    });
})();

// Filter and dropdown state
var activeFilter = 'all';
var activeDropdown = null;

// Close dropdowns on outside click
document.addEventListener('click', function() {
    if (activeDropdown) {
        activeDropdown.classList.remove('open');
        activeDropdown = null;
    }
});

/**
 * Re-render all status page sections
 */
function renderAll() {
    renderSummary();
    renderProgress();
    renderTable();
}

renderAll();
