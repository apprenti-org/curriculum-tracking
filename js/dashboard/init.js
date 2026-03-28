/**
 * Dashboard initialization — must be loaded last
 * Depends on: buildDashboard (nav-builder.js), selectCourse (detail-panel.js)
 */

buildDashboard();

// Event listeners for curriculum headers, group headers, and course items
document.querySelectorAll('.curriculum-header').forEach(function(el) {
    el.addEventListener('click', function() {
        el.closest('.curriculum-group').classList.toggle('collapsed');
    });
});

document.querySelectorAll('.nav-group-header').forEach(function(el) {
    el.addEventListener('click', function() {
        el.classList.toggle('collapsed');
    });
});

document.querySelectorAll('.nav-course-item').forEach(function(el) {
    el.addEventListener('click', function() {
        selectCourse(el);
    });
});
