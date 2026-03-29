/**
 * Version badge — populates the version display in the page header
 * Depends on: dashboardVersion (from courses.js, injected at build time)
 *
 * Loaded after courses.js on all pages.
 * Wraps the badge in a link to the changelog.
 */
(function() {
    var el = document.getElementById('version-badge');
    if (el && typeof dashboardVersion !== 'undefined') {
        var link = document.createElement('a');
        link.href = 'CHANGELOG.md';
        link.target = '_blank';
        link.className = 'version-badge-link';
        link.textContent = 'v' + dashboardVersion;
        link.title = 'View changelog — v' + dashboardVersion;
        el.textContent = '';
        el.appendChild(link);
    }
})();
