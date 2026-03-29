/**
 * Status page data table — filter chips, course rows, status dropdowns
 * Depends on: STATUSES, STATUS_CLASSES, gapAnalysisMap, GAP_ANALYSIS_DRIVE_FOLDER (from shared/constants.js)
 *             contentData, allCurricula, activeFilter, activeDropdown (from status/init.js)
 *             buildMembershipHTML (from shared/formatters.js)
 *
 * Exposes: renderTable(), toggleDropdown(), setStatus(), setFilter()
 */

/**
 * Render a coverage percentage
 */
function renderCoverage(pct) {
    if (pct === null || pct === undefined) return '<span class="cov-na">—</span>';
    var cls = pct >= 75 ? 'cov-high' : pct >= 25 ? 'cov-mid' : pct > 0 ? 'cov-low' : 'cov-zero';
    return '<span class="cov-pct ' + cls + '">' + pct + '%</span>';
}

/**
 * Render an asset count cell with icon
 */
function renderAssetCell(val) {
    if (!val) return '<span class="asset-zero">—</span>';
    return '<span class="asset-count">' + val + '</span>';
}

/**
 * Render document readiness icons (outline, syllabus, source)
 */
function renderDocsIcons(item) {
    var html = '';
    html += '<span class="doc-icon ' + (item.hasOutline ? 'doc-yes' : 'doc-no') + '" title="' + (item.hasOutline ? 'Outline exists' : 'No outline') + '"><i class="fa-solid fa-list-check"></i><span class="doc-label">Outline</span></span>';
    html += '<span class="doc-icon ' + (item.hasSyllabus ? 'doc-yes' : 'doc-no') + '" title="' + (item.hasSyllabus ? 'Syllabus exists' : 'No syllabus') + '"><i class="fa-solid fa-file-lines"></i><span class="doc-label">Syllabus</span></span>';
    html += '<span class="doc-icon ' + (item.hasSource ? 'doc-yes' : 'doc-no') + '" title="' + (item.hasSource ? 'Source content found' : 'No source content') + '"><i class="fa-solid fa-folder-open"></i><span class="doc-label">Source</span></span>';
    return html;
}

/**
 * Render the filtered course table
 */
function renderTable() {
    var filtered = contentData;
    if (activeFilter === 'active') {
        filtered = contentData.filter(function(d) { return d.designStatus !== 'Not Started' || d.devStatus !== 'Not Started'; });
    } else if (activeFilter === 'not-started') {
        filtered = contentData.filter(function(d) { return d.designStatus === 'Not Started' && d.devStatus === 'Not Started'; });
    } else if (activeFilter === 'has-content') {
        filtered = contentData.filter(function(d) { return d.coverage !== null && d.coverage > 0; });
    } else if (activeFilter === 'no-outline') {
        filtered = contentData.filter(function(d) { return !d.hasOutline; });
    } else if (activeFilter !== 'all') {
        filtered = contentData.filter(function(d) { return d.membership.some(function(m) { return m.curriculum === activeFilter; }); });
    }

    var rows = filtered.map(function(item) {
        var realIdx = contentData.indexOf(item);
        var gapLink = gapAnalysisMap[item.name]
            ? ' <a href="' + GAP_ANALYSIS_DRIVE_FOLDER + '" target="_blank" class="gap-icon-link" title="Gap Analysis Report"><i class="fa-solid fa-magnifying-glass-chart"></i></a>'
            : '';
        var assets = item.assets || {};
        return '<tr>' +
            '<td><span class="cell-name">' + item.name + '</span>' + gapLink + '</td>' +
            '<td class="membership-cell">' + buildMembershipHTML(item.membership) + '</td>' +
            '<td class="cell-hours">' + (item.hours || '\u2014') + '</td>' +
            '<td class="docs-cell">' + renderDocsIcons(item) + '</td>' +
            '<td class="status-cell">' +
                '<span class="status-pill status-' + STATUS_CLASSES[item.designStatus] + '" onclick="toggleDropdown(event, ' + realIdx + ', \'design\')"><span class="status-dot dot-' + STATUS_CLASSES[item.designStatus] + '"></span>' + item.designStatus + '</span>' +
                '<div class="status-dropdown" id="dd-design-' + realIdx + '">' + STATUSES.map(function(s) { return '<div class="status-option" onclick="setStatus(' + realIdx + ', \'designStatus\', \'' + s + '\')"><span class="status-dot dot-' + STATUS_CLASSES[s] + '"></span> ' + s + '</div>'; }).join('') + '</div>' +
            '</td>' +
            '<td class="status-cell">' +
                '<span class="status-pill status-' + STATUS_CLASSES[item.devStatus] + '" onclick="toggleDropdown(event, ' + realIdx + ', \'dev\')"><span class="status-dot dot-' + STATUS_CLASSES[item.devStatus] + '"></span>' + item.devStatus + '</span>' +
                '<div class="status-dropdown" id="dd-dev-' + realIdx + '">' + STATUSES.map(function(s) { return '<div class="status-option" onclick="setStatus(' + realIdx + ', \'devStatus\', \'' + s + '\')"><span class="status-dot dot-' + STATUS_CLASSES[s] + '"></span> ' + s + '</div>'; }).join('') + '</div>' +
            '</td>' +
            '<td class="cov-td">' + renderCoverage(item.coverage) + '</td>' +
            '<td class="asset-td">' + renderAssetCell(assets.lessons) + '</td>' +
            '<td class="asset-td">' + renderAssetCell(assets.slides) + '</td>' +
            '<td class="asset-td">' + renderAssetCell(assets.quizzes) + '</td>' +
            '<td class="asset-td">' + renderAssetCell(assets.activities) + '</td>' +
            '<td class="asset-td total-td">' + renderAssetCell(item.totalAssets) + '</td>' +
        '</tr>';
    }).join('');

    document.getElementById('table-section').innerHTML =
        '<h2>All Courses</h2>' +
        '<div class="filter-row">' +
            '<span class="filter-chip ' + (activeFilter === 'all' ? 'active' : '') + '" onclick="setFilter(\'all\')">All</span>' +
            allCurricula.map(function(c) {
                return '<span class="filter-chip ' + (activeFilter === c ? 'active' : '') + '" onclick="setFilter(\'' + c + '\')">' + c + '</span>';
            }).join('') +
            '<span class="filter-chip ' + (activeFilter === 'active' ? 'active' : '') + '" onclick="setFilter(\'active\')">Active</span>' +
            '<span class="filter-chip ' + (activeFilter === 'not-started' ? 'active' : '') + '" onclick="setFilter(\'not-started\')">Not Started</span>' +
            '<span class="filter-chip ' + (activeFilter === 'has-content' ? 'active' : '') + '" onclick="setFilter(\'has-content\')">Has Content</span>' +
            '<span class="filter-chip ' + (activeFilter === 'no-outline' ? 'active' : '') + '" onclick="setFilter(\'no-outline\')">No Outline</span>' +
        '</div>' +
        '<table><thead><tr>' +
            '<th>Course</th>' +
            '<th>Curricula / Groups</th>' +
            '<th>Hours</th>' +
            '<th>Docs</th>' +
            '<th>Design Status</th>' +
            '<th>Dev Status</th>' +
            '<th>Content Coverage</th>' +
            '<th><i class="fa-solid fa-file-alt"></i> Lessons</th>' +
            '<th><i class="fa-solid fa-tv"></i> Slides</th>' +
            '<th><i class="fa-solid fa-circle-question"></i> Quizzes</th>' +
            '<th><i class="fa-solid fa-flask"></i> Activities</th>' +
            '<th><i class="fa-solid fa-box"></i> Total</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table>';
}

/**
 * Toggle a status dropdown open/closed
 */
function toggleDropdown(event, idx, track) {
    event.stopPropagation();
    var el = document.getElementById('dd-' + track + '-' + idx);
    if (activeDropdown && activeDropdown !== el) activeDropdown.classList.remove('open');
    el.classList.toggle('open');
    activeDropdown = el.classList.contains('open') ? el : null;
}

/**
 * Set a course's design or dev status and re-render
 */
function setStatus(idx, field, value) {
    contentData[idx][field] = value;
    if (activeDropdown) activeDropdown.classList.remove('open');
    activeDropdown = null;
    renderAll();
}

/**
 * Set the active filter and re-render the table
 */
function setFilter(f) {
    activeFilter = f;
    renderTable();
}
