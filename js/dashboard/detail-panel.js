/**
 * Detail panel — renders course detail view when a course is selected
 * Depends on: courseOutlines (outlines.js), courseLookup (data-store.js),
 *             curriculumMap (nav-builder.js), courseStatusMap (courses.js),
 *             syllabiMap (constants.js), renderOutline, renderNoOutline (outline-renderer.js)
 */

function selectCourse(el) {
    document.querySelectorAll('.nav-course-item.active').forEach(function(e) { e.classList.remove('active'); });
    el.classList.add('active');

    var courseName = el.dataset.courseName;
    var courseId = el.dataset.courseId;
    var course = (courseId && courseLookup[courseId]) || courseLookup[courseName] || {};
    var detail = document.getElementById('detail-panel');

    var html = '';

    // Detail header
    html += '<div class="detail-header">';
    html += '<h2>' + courseName + '</h2>';
    html += '<div class="detail-meta">';
    if (course.hours) html += '<span class="detail-meta-item"><i class="fa-regular fa-clock" style="opacity:0.6;"></i> <strong>' + course.hours + '</strong>&nbsp;hours</span>';
    var outlineData = courseOutlines[courseName];
    if (outlineData) {
        html += '<span class="detail-meta-item"><i class="fa-solid fa-cubes" style="opacity:0.6;"></i> ' + outlineData.totalModules + ' modules</span>';
        html += '<span class="detail-meta-item"><i class="fa-solid fa-file-lines" style="opacity:0.6;"></i> ' + outlineData.totalLessons + ' lessons</span>';
    }
    html += '</div>';

    // Curriculum & group membership
    html += renderMembershipTags(courseName);

    // Reference links
    html += renderRefLinks(course, courseName, outlineData);

    // Status tracks
    html += renderStatusTracks(courseName);

    html += '</div>';

    // Outline section
    if (outlineData) {
        html += renderOutline(outlineData);
    } else {
        html += renderNoOutline();
    }

    detail.innerHTML = html;

    // Re-bind module expand/collapse
    detail.querySelectorAll('.module-header').forEach(function(el) {
        el.addEventListener('click', function() { el.closest('.outline-module').classList.toggle('expanded'); });
    });
}

function renderMembershipTags(courseName) {
    var memberships = [];
    Object.keys(curriculumMap).forEach(function(curName) {
        var currentGroup = null;
        curriculumMap[curName].items.forEach(function(item) {
            if (item._group) { currentGroup = item._group; }
            else if (item._name === courseName) {
                memberships.push({ curriculum: curName, group: currentGroup });
            }
        });
    });
    if (!memberships.length) return '';
    var html = '<div class="detail-membership">';
    memberships.forEach(function(m) {
        html += '<div class="membership-tag"><i class="fa-solid fa-layer-group" style="font-size:10px;opacity:0.6;"></i> <span class="membership-curriculum">' + m.curriculum + '</span>';
        if (m.group) html += ' <i class="fa-solid fa-chevron-right" style="font-size:8px;opacity:0.4;margin:0 4px;"></i> <span class="membership-group">' + m.group + '</span>';
        html += '</div>';
    });
    html += '</div>';
    return html;
}

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
        html += '<span><i class="fa-solid fa-list-ul" style="' + iconColor + '"></i> Outline</span>';
    }
    if (course.driveFolder) {
        html += '<a href="' + course.driveFolder + '" target="_blank" class="ref-link drive-link"><i class="fa-brands fa-google-drive" style="color:#4caf50;"></i> Google Drive</a>';
    }
    html += '</div>';
    return html;
}

function renderStatusTracks(courseName) {
    var courseStatus = courseStatusMap[courseName] || {};
    var designStatus = (courseStatus.status && courseStatus.status.design) || 'Not Started';
    var devStatus = (courseStatus.status && courseStatus.status.development) || 'Not Started';
    function statusClass(s) {
        return s === 'Complete' ? 'complete' : s === 'In Progress' ? 'in-progress' : s === 'Needs Review' ? 'needs-review' : 'not-started';
    }
    return '<div class="status-tracks">' +
        '<div class="track"><span class="track-label"><i class="fa-solid fa-compass-drafting" style="margin-right:3px;"></i>Design:</span><span class="track-status ' + statusClass(designStatus) + '">' + designStatus + '</span></div>' +
        '<div class="track"><span class="track-label"><i class="fa-solid fa-code" style="margin-right:3px;"></i>Dev:</span><span class="track-status ' + statusClass(devStatus) + '">' + devStatus + '</span></div>' +
        '</div>';
}
