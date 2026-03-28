/**
 * Status page initialization — builds data structures and kicks off rendering
 * Depends on: courseData, curriculaData (from courses.js)
 *             membershipMap (from shared/data-store.js)
 *             renderSummary, renderProgress (from status/summary.js)
 *             renderTable (from status/table.js)
 *
 * This must be the LAST status script loaded.
 */

// Build content data array from courseData + membershipMap
var contentData = courseData.map(function(c) {
    return {
        id: c.id || '',
        name: c.name,
        type: 'Course',
        hours: c.hours,
        designStatus: c.status.design,
        devStatus: c.status.development,
        note: c.note || '',
        membership: membershipMap[c.id] || membershipMap[c.name] || []
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
