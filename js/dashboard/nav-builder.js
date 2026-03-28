/**
 * Dashboard navigation panel builder
 * Depends on: courseData, curriculaData (from courses.js)
 *             courseOutlines (from outlines/outlines.js)
 *             courseLookup (from shared/data-store.js)
 *             courseStatusIcon (from shared/formatters.js)
 *
 * Exposes: curriculumMap (global), buildDashboard(), buildCurriculumSummary(), buildNavItemFromCourse()
 */

// Curriculum map — populated by buildDashboard(), consumed by detail-panel.js
var curriculumMap = {};

/**
 * Build the full left-nav: stats bar, curricula accordion, all-courses list
 */
function buildDashboard() {
    var courses = courseData.slice().sort(function(a, b) { return a.name.localeCompare(b.name); });
    var totalHours = courses.reduce(function(sum, c) { return sum + (c.hours || 0); }, 0);

    document.getElementById('stats-bar').innerHTML =
        '<div class="stat"><span class="stat-value">' + curriculaData.length + '</span><span class="stat-label"><i class="fa-solid fa-layer-group"></i> Curricula</span></div>' +
        '<div class="stat"><span class="stat-value">' + courses.length + '</span><span class="stat-label"><i class="fa-solid fa-book"></i> Courses</span></div>' +
        '<div class="stat"><span class="stat-value">' + totalHours + '</span><span class="stat-label"><i class="fa-regular fa-clock"></i> Total Hrs</span></div>' +
        '<div class="stat"><span class="stat-value">' + Object.keys(courseOutlines).length + '</span><span class="stat-label"><i class="fa-solid fa-list-check"></i> Outlines</span></div>';

    // Build curriculum map from curriculaData
    curriculumMap = {};
    curriculaData.forEach(function(cur) {
        var items = [];
        if (cur.groups) {
            cur.groups.forEach(function(g) {
                items.push({ _group: g.name, _hours: g.hours || null });
                g.courses.forEach(function(gc) {
                    var base = courseLookup[gc.id] || courseLookup[gc.name] || {};
                    items.push({
                        _name: gc.name,
                        _id: gc.id || base.id || '',
                        _hours: gc.hoursOverride || base.hours || null,
                        _syllabus: base.syllabus || null,
                        _outline: base.outline || null,
                        _note: gc.note || base.note || null
                    });
                });
            });
        } else if (cur.courses) {
            cur.courses.forEach(function(cc) {
                var base = courseLookup[cc.id] || courseLookup[cc.name] || {};
                items.push({
                    _name: cc.name,
                    _id: cc.id || base.id || '',
                    _hours: cc.hoursOverride || base.hours || null,
                    _syllabus: base.syllabus || null,
                    _outline: base.outline || null,
                    _note: cc.note || base.note || null
                });
            });
        }
        curriculumMap[cur.name] = { items: items, syllabus: cur.syllabus || null };
    });

    var nav = document.getElementById('nav-scroll');
    var html = '';

    // Curricula section
    html += '<div class="nav-section-label"><i class="fa-solid fa-layer-group" style="font-size:10px;"></i> Curricula</div>';
    Object.keys(curriculumMap).forEach(function(name) {
        html += buildCurriculumSummary(name, curriculumMap[name].items, curriculumMap[name].syllabus);
    });

    // Divider
    html += '<div class="nav-section-divider"></div>';

    // All Courses section
    html += '<div class="nav-section-label"><i class="fa-solid fa-book-open" style="font-size:10px;"></i> Courses</div>';
    html += '<div class="standalone-section"><div class="standalone-header"><h2><i class="fa-solid fa-book-open" style="margin-right:6px;opacity:0.7;"></i>All Courses</h2></div><div class="nav-course-list">';
    if (courses.length === 0) {
        html += '<div class="empty-state-nav">No courses loaded yet</div>';
    } else {
        courses.forEach(function(c) { html += buildNavItemFromCourse(c); });
    }
    html += '</div></div>';

    nav.innerHTML = html;
}

/**
 * Build a single curriculum accordion group
 */
function buildCurriculumSummary(name, items, syllabus) {
    var actualCourses = items.filter(function(c) { return !c._group; });
    var totalHours = actualCourses.reduce(function(s, c) { return s + (c._hours || 0); }, 0);
    var syllabusLink = syllabus
        ? '<a href="' + syllabus + '" target="_blank" class="curriculum-syllabus-link"><i class="fa-solid fa-file-alt" style="color:#4caf50;font-size:10px;margin-right:4px;"></i>Syllabus</a>'
        : '';

    var html = '<div class="curriculum-group collapsed"><div class="curriculum-header">' +
        '<i class="fa-solid fa-chevron-down chevron"></i>' +
        '<h2>' + name + '</h2><span class="curriculum-badge">Curriculum</span>' +
        '<span class="curriculum-meta">' + actualCourses.length + ' courses &middot; ' + totalHours + 'h</span>' +
        '</div><div class="nav-course-list">' +
        (syllabusLink ? '<div class="curriculum-syllabus-row">' + syllabusLink + '</div>' : '');

    if (actualCourses.length === 0) {
        html += '<div class="empty-state-nav">No courses loaded yet</div>';
    } else {
        var inGroup = false;
        items.forEach(function(c) {
            if (c._group) {
                if (inGroup) html += '</div>';
                html += '<div class="nav-group-header">' +
                    '<i class="fa-solid fa-chevron-down group-chevron"></i>' +
                    '<span class="nav-group-label">' + c._group + '</span>' +
                    (c._hours ? '<span class="nav-group-hours">' + c._hours + 'h</span>' : '') +
                    '</div><div class="nav-group-courses">';
                inGroup = true;
            } else {
                var si = courseStatusIcon(c._name);
                html += '<div class="nav-course-item" data-course-name="' + c._name + '" data-course-id="' + (c._id || '') + '">' +
                    '<i class="fa-solid ' + si.icon + ' status-dot ' + si.cls + '" style="font-size:10px;" title="' + si.label + '"></i>' +
                    '<span class="nav-course-name">' + c._name + '</span>' +
                    (c._hours ? '<span class="nav-course-hours"><i class="fa-regular fa-clock" style="font-size:9px;opacity:0.6;margin-right:2px;"></i>' + c._hours + 'h</span>' : '') +
                    '</div>';
            }
        });
        if (inGroup) html += '</div>';
    }
    html += '</div></div>';
    return html;
}

/**
 * Build a single nav item for the all-courses list
 */
function buildNavItemFromCourse(course) {
    var name = course.name;
    var id = course.id || '';
    var hours = course.hours;
    var si = courseStatusIcon(name);
    return '<div class="nav-course-item" data-course-name="' + name + '" data-course-id="' + id + '">' +
        '<i class="fa-solid ' + si.icon + ' status-dot ' + si.cls + '" style="font-size:10px;" title="' + si.label + '"></i>' +
        '<span class="nav-course-name">' + name + '</span>' +
        (hours ? '<span class="nav-course-hours"><i class="fa-regular fa-clock" style="font-size:9px;opacity:0.6;margin-right:2px;"></i>' + hours + 'h</span>' : '') +
        '</div>';
}
