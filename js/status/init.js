/**
 * Status page initialization — must be loaded last among status scripts
 * Depends on: courseData (courses.js), membershipMap (data-store.js),
 *             renderSummary, renderProgress (summary.js), renderTable (table.js)
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

// Build all unique curriculum names for filter chips
var allCurricula = [];
var _seen = {};
contentData.forEach(function(d) {
    d.membership.forEach(function(m) {
        if (!_seen[m.curriculum]) {
            _seen[m.curriculum] = true;
            allCurricula.push(m.curriculum);
        }
    });
});

// Page state
var activeFilter = 'all';
var activeDropdown = null;

// Close dropdown on outside click
document.addEventListener('click', function() {
    if (activeDropdown) {
        activeDropdown.classList.remove('open');
        activeDropdown = null;
    }
});

function renderAll() {
    renderSummary();
    renderProgress();
    renderTable();
}

renderAll();
