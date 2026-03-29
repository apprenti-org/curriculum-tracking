/**
 * Status page summary and progress bars
 * Depends on: STATUSES (from shared/constants.js)
 *             contentData (from status/init.js — loaded before this runs via renderAll)
 *
 * Exposes: computeSummary(), renderSummary(), renderProgress()
 */

/**
 * Compute summary counts from contentData
 */
function computeSummary() {
    var total = contentData.length;
    var withOutline = contentData.filter(function(c) { return c.hasOutline; }).length;
    var withSyllabus = contentData.filter(function(c) { return c.hasSyllabus; }).length;
    var withSource = contentData.filter(function(c) { return c.hasSource; }).length;
    var withCoverage = contentData.filter(function(c) { return c.coverage !== null && c.coverage > 0; }).length;

    // Compute average coverage across courses that have outlines
    var covCourses = contentData.filter(function(c) { return c.coverage !== null; });
    var avgCoverage = covCourses.length > 0
        ? Math.round(covCourses.reduce(function(sum, c) { return sum + c.coverage; }, 0) / covCourses.length)
        : 0;

    // Total assets across all courses
    var totalAssets = contentData.reduce(function(sum, c) { return sum + (c.totalAssets || 0); }, 0);

    return {
        total: total,
        designComplete: contentData.filter(function(c) { return c.designStatus === 'Complete'; }).length,
        designActive: contentData.filter(function(c) { return c.designStatus !== 'Not Started' && c.designStatus !== 'Complete'; }).length,
        devComplete: contentData.filter(function(c) { return c.devStatus === 'Complete'; }).length,
        devActive: contentData.filter(function(c) { return c.devStatus !== 'Not Started' && c.devStatus !== 'Complete'; }).length,
        withOutline: withOutline,
        withSyllabus: withSyllabus,
        withSource: withSource,
        withCoverage: withCoverage,
        avgCoverage: avgCoverage,
        totalAssets: totalAssets
    };
}

/**
 * Render the summary cards bar
 */
function renderSummary() {
    var s = computeSummary();
    document.getElementById('summary-bar').innerHTML =
        '<div class="summary-card"><div class="label">Total Courses</div><div class="value">' + s.total + '</div>' +
            '<div class="sub">' + s.withOutline + ' with outlines</div></div>' +
        '<div class="summary-card"><div class="label">Design Complete</div><div class="value">' + s.designComplete + '<span style="font-size:16px;color:var(--text-secondary)">/' + s.total + '</span></div><div class="sub">' + s.designActive + ' in progress</div></div>' +
        '<div class="summary-card"><div class="label">Development Complete</div><div class="value">' + s.devComplete + '<span style="font-size:16px;color:var(--text-secondary)">/' + s.total + '</span></div><div class="sub">' + s.devActive + ' in progress</div></div>' +
        '<div class="summary-card"><div class="label">Avg Content Coverage</div><div class="value">' + s.avgCoverage + '%</div><div class="sub">' + s.withCoverage + ' courses with content</div></div>' +
        '<div class="summary-card"><div class="label">Source Assets</div><div class="value">' + s.totalAssets.toLocaleString() + '</div><div class="sub">' + s.withSource + ' courses with source</div></div>' +
        '<div class="summary-card"><div class="label">Overall Progress</div><div class="value">' + Math.round(((s.designComplete + s.devComplete) / (s.total * 2)) * 100) + '%</div><div class="sub">Design + Development combined</div></div>';
}

/**
 * Render the design/development progress bar section
 */
function renderProgress() {
    var total = contentData.length;

    function countByStatus(field) {
        var c = {};
        STATUSES.forEach(function(s) { c[s] = 0; });
        contentData.forEach(function(x) { c[x[field]]++; });
        return c;
    }

    var dc = countByStatus('designStatus');
    var dv = countByStatus('devStatus');

    function barSegments(counts) {
        return STATUSES.map(function(s) {
            var pct = total > 0 ? (counts[s] / total) * 100 : 0;
            var cls = s === 'Complete' ? 'seg-complete' : s === 'Not Started' ? 'seg-not-started' : 'seg-in-progress';
            return '<div class="progress-segment ' + cls + '" style="width:' + pct + '%" title="' + s + ': ' + counts[s] + '"></div>';
        }).join('');
    }

    // Content coverage distribution
    var covBuckets = { high: 0, mid: 0, low: 0, none: 0, noOutline: 0 };
    contentData.forEach(function(c) {
        if (c.coverage === null) covBuckets.noOutline++;
        else if (c.coverage >= 75) covBuckets.high++;
        else if (c.coverage >= 25) covBuckets.mid++;
        else if (c.coverage > 0) covBuckets.low++;
        else covBuckets.none++;
    });

    function covSegments() {
        var segs = [
            { count: covBuckets.high, cls: 'seg-complete', label: '75%+' },
            { count: covBuckets.mid, cls: 'seg-cov-mid', label: '25-74%' },
            { count: covBuckets.low, cls: 'seg-cov-low', label: '1-24%' },
            { count: covBuckets.none + covBuckets.noOutline, cls: 'seg-not-started', label: '0% / No outline' }
        ];
        return segs.map(function(s) {
            var pct = total > 0 ? (s.count / total) * 100 : 0;
            return '<div class="progress-segment ' + s.cls + '" style="width:' + pct + '%" title="' + s.label + ': ' + s.count + '"></div>';
        }).join('');
    }

    document.getElementById('progress-section').innerHTML =
        '<div class="progress-row">' +
            '<div class="progress-block"><h3>Design Track</h3><div class="progress-bar-container">' + barSegments(dc) + '</div>' +
                '<div class="progress-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--seg-complete)"></span> Complete (' + dc['Complete'] + ')</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-active)"></span> Active (' + (dc['Scoping'] + dc['In Progress'] + dc['In Review']) + ')</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-empty);border:1px solid var(--seg-empty-border)"></span> Not Started (' + dc['Not Started'] + ')</span></div>' +
            '</div>' +
            '<div class="progress-block"><h3>Development Track</h3><div class="progress-bar-container">' + barSegments(dv) + '</div>' +
                '<div class="progress-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--seg-complete)"></span> Complete (' + dv['Complete'] + ')</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-active)"></span> Active (' + (dv['Scoping'] + dv['In Progress'] + dv['In Review']) + ')</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-empty);border:1px solid var(--seg-empty-border)"></span> Not Started (' + dv['Not Started'] + ')</span></div>' +
            '</div>' +
        '</div>' +
        '<div class="progress-row">' +
            '<div class="progress-block"><h3>Content Coverage</h3><div class="progress-bar-container">' + covSegments() + '</div>' +
                '<div class="progress-legend">' +
                    '<span class="legend-item"><span class="legend-dot" style="background:var(--seg-complete)"></span> 75%+ (' + covBuckets.high + ')</span>' +
                    '<span class="legend-item"><span class="legend-dot" style="background:var(--seg-cov-mid)"></span> 25-74% (' + covBuckets.mid + ')</span>' +
                    '<span class="legend-item"><span class="legend-dot" style="background:var(--seg-cov-low)"></span> 1-24% (' + covBuckets.low + ')</span>' +
                    '<span class="legend-item"><span class="legend-dot" style="background:var(--seg-empty);border:1px solid var(--seg-empty-border)"></span> None (' + (covBuckets.none + covBuckets.noOutline) + ')</span>' +
                '</div>' +
            '</div>' +
        '</div>';
}
