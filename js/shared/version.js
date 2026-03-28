/**
 * Version badge — populates the version display in the page header
 * Depends on: dashboardVersion (from courses.js, injected at build time)
 *
 * Loaded after courses.js on all pages.
 */
(function() {
    var el = document.getElementById('version-badge');
    if (el && typeof dashboardVersion !== 'undefined') {
        el.textContent = 'v' + dashboardVersion;
        el.title = 'Dashboard version ' + dashboardVersion;
    }
})();
