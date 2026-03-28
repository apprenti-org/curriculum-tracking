/**
 * Status page — summary cards and progress bars
 * Depends on: STATUSES (constants.js), contentData (init.js — but contentData is
 *             declared before this file runs via script order)
 */

function computeSummary() {
    var total = contentData.length;
    return {
        total: total,
        designComplete: contentData.filter(function(c) { return c.designStatus === 'Complete'; }).length,
        designActive: contentData.filter(function(c) { return c.designStatus !== 'Not Started' && c.designStatus !== 'Complete'; }).length,
        devComplete: contentData.filter(function(c) { return c.devStatus === 'Complete'; }).length,
        devActive: contentData.filter(function(c) { return c.devStatus !== 'Not Started' && c.devStatus !== 'Complete'; }).length
    };
}

function renderSummary() {
    var s = computeSummary();
    document.getElementById('summary-bar').innerHTML =
        '<div class="summary-card"><div class="label">Total Courses</div><div class="value">' + s.total + '</div></div>' +
        '<div class="summary-card"><div class="label">Design Complete</div><div class="value">' + s.designComplete + '<span style="font-size:16px;color:var(--text-secondary)">/' + s.total + '</span></div><div class="sub">' + s.designActive + ' in progress</div></div>' +
        '<div class="summary-card"><div class="label">Development Complete</div><div class="value">' + s.devComplete + '<span style="font-size:16px;color:var(--text-secondary)">/' + s.total + '</span></div><div class="sub">' + s.devActive + ' in progress</div></div>' +
        '<div class="summary-card"><div class="label">Overall Progress</div><div class="value">' + Math.round(((s.designComplete + s.devComplete) / (s.total * 2)) * 100) + '%</div><div class="sub">Design + Development combined</div></div>';
}

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
    document.getElementById('progress-section').innerHTML =
        '<div class="progress-row">' +
            '<div class="progress-block"><h3>Design Track</h3><div class="progress-bar-container">' + barSegments(dc) + '</div>' +
                '<div class="progress-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--seg-complete)"></span> Complete (' + dc['Complete'] + ')</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-active)"></span> Active (' + (dc['Scoping'] + dc['In Progress'] + dc['In Review']) + ')</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-empty);border:1px solid var(--seg-empty-border)"></span> Not Started (' + dc['Not Started'] + ')</span></div>' +
            '</div>' +
            '<div class="progress-block"><h3>Development Track</h3><div class="progress-bar-container">' + barSegments(dv) + '</div>' +
                '<div class="progress-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--seg-complete)"></span> Complete (' + dv['Complete'] + ')</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-active)"></span> Active (' + (dv['Scoping'] + dv['In Progress'] + dv['In Review']) + ')</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-empty);border:1px solid var(--seg-empty-border)"></span> Not Started (' + dv['Not Started'] + ')</span></div>' +
            '</div>' +
        '</div>';
}
