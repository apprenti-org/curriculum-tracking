/**
 * Dashboard initialization — wires up event listeners and kicks off rendering
 * Depends on: buildDashboard() (from nav-builder.js)
 *             selectCourse() (from detail-panel.js)
 *
 * This must be the LAST dashboard script loaded.
 */

buildDashboard();

// Event delegation for nav interactions
document.querySelectorAll('.curriculum-header').forEach(function(el) {
    el.addEventListener('click', function() { el.closest('.curriculum-group').classList.toggle('collapsed'); });
});
document.querySelectorAll('.nav-group-header').forEach(function(el) {
    el.addEventListener('click', function() { el.classList.toggle('collapsed'); });
});
document.querySelectorAll('.nav-course-item').forEach(function(el) {
    el.addEventListener('click', function() { selectCourse(el); });
});
