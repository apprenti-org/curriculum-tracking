/**
 * Dashboard detail panel — renders course header, refs, status, membership
 * Depends on: courseOutlines (from outlines/outlines.js)
 *             courseLookup, membershipMap (from shared/data-store.js)
 *             courseStatusMap (from courses.js)
 *             syllabiMap, gapAnalysisMap, GAP_ANALYSIS_DRIVE_FOLDER (from shared/constants.js)
 *             renderOutline, renderNoOutline (from outline-renderer.js)
 *
 * Exposes: selectCourse()
 */

/**
 * Show course detail for the clicked nav item
 * @param {HTMLElement} el - the .nav-course-item that was clicked
 */
function selectCourse(el) {
    document.querySelectorAll('.nav-course-item.active').forEach(function(e) { e.classList.remove('active'); });
    el.classList.add('active');

    var courseName = el.dataset.courseName;
    var courseId = el.dataset.courseId;
    var course = (courseId && courseLookup[courseId]) || courseLookup[courseName] || {};
    var detail = document.getElementById('detail-panel');
    var outlineData = courseOutlines[courseName];

    var html = '';

    // Header
    html += '<div class="detail-header">';
    html += '<h2>' + courseName + '</h2>';
    html += '<div class="detail-meta">';
    html += renderHoursMeta(course, courseName);
    if (outlineData) {
        html += '<span class="detail-meta-item"><i class="fa-solid fa-cubes" style="opacity:0.6;"></i> ' + outlineData.totalModules + ' modules</span>';
        html += '<span class="detail-meta-item"><i class="fa-solid fa-file-lines" style="opacity:0.6;"></i> ' + outlineData.totalLessons + ' lessons</span>';
    }
    html += '</div>';

    // Curriculum membership tags
    html += renderMembershipTags(courseName);

    // Reference links (syllabus, outline, Drive)
    html += renderRefLinks(course, courseName, outlineData);

    // Status tracks
    html += renderStatusTracks(courseName);

    html += '</div>';

    // Outline section (rendered by outline-renderer.js)
    html += outlineData ? renderOutline(outlineData) : renderNoOutline();

    detail.innerHTML = html;

    // Bind module expand/collapse
    detail.querySelectorAll('.module-header').forEach(function(el) {
        el.addEventListener('click', function() { el.closest('.outline-module').classList.toggle('expanded'); });
    });

}

/** Render curriculum/group membership tags with per-curriculum hours */
function renderMembershipTags(courseName) {
    var course = courseLookup[courseName] || {};
    var key = course.id || courseName;
    var memberships = (typeof membershipMap !== 'undefined' && membershipMap[key]) || [];

    if (!memberships.length) return '';

    var html = '<div class="detail-membership">';
    memberships.forEach(function(m) {
        var hoursForCurriculum = m.hoursOverride || course.hours || null;
        html += '<div class="membership-tag"><i class="fa-solid fa-layer-group" style="font-size:10px;opacity:0.6;"></i> <span class="membership-curriculum">' + m.curriculum + '</span>';
        if (m.group) html += ' <i class="fa-solid fa-chevron-right" style="font-size:8px;opacity:0.4;margin:0 4px;"></i> <span class="membership-group">' + m.group + '</span>';
        if (hoursForCurriculum) html += ' <span class="membership-hours" style="opacity:0.7;font-size:11px;margin-left:6px;"><i class="fa-regular fa-clock" style="font-size:10px;opacity:0.5;margin-right:2px;"></i>' + hoursForCurriculum + 'h</span>';
        html += '</div>';
    });
    html += '</div>';
    return html;
}

/** Render the hours metadata pill — single value, or "min–max hours (varies by curriculum)" */
function renderHoursMeta(course, courseName) {
    if (!course.hours) return '';
    var key = course.id || courseName;
    var memberships = (typeof membershipMap !== 'undefined' && membershipMap[key]) || [];

    var distinct = {};
    distinct[course.hours] = true;
    memberships.forEach(function(m) {
        if (m.hoursOverride) distinct[m.hoursOverride] = true;
    });
    var values = Object.keys(distinct).map(Number).sort(function(a, b) { return a - b; });

    if (values.length <= 1) {
        return '<span class="detail-meta-item"><i class="fa-regular fa-clock" style="opacity:0.6;"></i> <strong>' + course.hours + '</strong>&nbsp;hours</span>';
    }

    return '<span class="detail-meta-item"><i class="fa-regular fa-clock" style="opacity:0.6;"></i> <strong>' + values[0] + '–' + values[values.length - 1] + '</strong>&nbsp;hours <span style="opacity:0.6;font-size:11px;">(varies by curriculum)</span></span>';
}

/** Render syllabus / outline / Drive links */
function renderRefLinks(course, courseName, outlineData) {
    var syllabus = course.syllabus || '';
    var outline = course.outline || '';
    var syllabusFile = syllabiMap[courseName];
    var hasOutlineData = !!outlineData;

    var html = '<div class="detail-refs">';
    if (syllabusFile) {
        html += '<a href="syllabi/' + syllabusFile + '" target="_blank" class="ref-link"><i class="fa-solid fa-file-alt" style="color:#4caf50;"></i> Syllabus</a>';
    } else if (syllabus && typeof syllabus === 'string' && syllabus.startsWith('http')) {
        html += '<a href="' + syllabus + '" target="_blank" class="ref-link"><i class="fa-solid fa-file-alt" style="color:#4caf50;"></i> Syllabus</a>';
    } else if (syllabus) {
        html += '<span><i class="fa-solid fa-file-alt" style="opacity:0.5;"></i> Syllabus</span>';
    }

    if (outline) {
        var iconColor = hasOutlineData ? 'color:#4caf50;' : 'opacity:0.5;';
        if (course.sourceRepo) {
            var outlineUrl = course.sourceRepo + '/blob/main/course-design/' + (course.id || '') + '/course-outline-' + (course.id || '') + '.md';
            html += '<a href="' + outlineUrl + '" target="_blank" class="ref-link"><i class="fa-solid fa-list-ul" style="' + iconColor + '"></i> Outline</a>';
        } else {
            html += '<span><i class="fa-solid fa-list-ul" style="' + iconColor + '"></i> Outline</span>';
        }
    }

    if (gapAnalysisMap[courseName]) {
        html += '<a href="' + GAP_ANALYSIS_DRIVE_FOLDER + '" target="_blank" class="ref-link gap-link"><i class="fa-solid fa-magnifying-glass-chart" style="color:#ff9800;"></i> Gap Analysis</a>';
    }

    if (course.driveFolder) {
        html += '<a href="' + course.driveFolder + '" target="_blank" class="ref-link drive-link"><i class="fa-brands fa-google-drive" style="color:#4caf50;"></i> Google Drive</a>';
    }

    if (course.deployRepo) {
        html += '<a href="' + course.deployRepo + '" target="_blank" class="ref-link"><i class="fa-brands fa-github" style="color:#6e5494;"></i> Deploy</a>';
    }

    if (course.sourceRepo) {
        html += '<a href="' + course.sourceRepo + '" target="_blank" class="ref-link"><i class="fa-brands fa-github" style="color:#6e5494;"></i> Source</a>';
    }
    html += '</div>';
    return html;
}

/** Render design/development status tracks */
function renderStatusTracks(courseName) {
    var courseStatus = courseStatusMap[courseName] || {};
    var designStatus = (courseStatus.status && courseStatus.status.design) || 'Not Started';
    var devStatus = (courseStatus.status && courseStatus.status.development) || 'Not Started';

    function statusClass(s) {
        if (s === 'Complete') return 'complete';
        if (s === 'In Progress') return 'in-progress';
        if (s === 'Needs Review') return 'needs-review';
        return 'not-started';
    }

    return '<div class="status-tracks">' +
        '<div class="track"><span class="track-label"><i class="fa-solid fa-compass-drafting" style="margin-right:3px;"></i>Design:</span><span class="track-status ' + statusClass(designStatus) + '">' + designStatus + '</span></div>' +
        '<div class="track"><span class="track-label"><i class="fa-solid fa-code" style="margin-right:3px;"></i>Dev:</span><span class="track-status ' + statusClass(devStatus) + '">' + devStatus + '</span></div>' +
        unverifiedStatusBadge(courseName) +
        '</div>';
}
