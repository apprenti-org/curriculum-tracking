/**
 * Curriculum Pipeline page initialization and rendering
 * Depends on: pipeline.js, data-store.js, constants.js, formatters.js
 */

(function() {
    'use strict';

    // Find curricula that have a standard (pipeline-ready)
    var pipelineCurricula = curriculaData.filter(function(c) { return c.standard; });

    // If none have standards yet, show all curricula
    var selectableCurricula = pipelineCurricula.length > 0 ? pipelineCurricula : curriculaData;

    // --- Curriculum Selector ---
    function renderSelector() {
        var container = document.getElementById('curriculum-selector');
        if (selectableCurricula.length === 0) {
            container.innerHTML = '<div class="pipeline-empty"><i class="fa-solid fa-diagram-project"></i><p>No curricula found.</p></div>';
            return;
        }

        var html = '<label for="curr-select">Curriculum</label>';
        html += '<select id="curr-select">';
        selectableCurricula.forEach(function(c, i) {
            var badge = c.standard ? ' [' + c.standard.appendix + ']' : '';
            html += '<option value="' + i + '">' + c.name + badge + '</option>';
        });
        html += '</select>';
        container.innerHTML = html;

        document.getElementById('curr-select').addEventListener('change', function() {
            renderCurriculum(selectableCurricula[parseInt(this.value)]);
        });
    }

    // --- Standard Block ---
    function renderStandard(curriculum) {
        var container = document.getElementById('standard-block');
        var std = curriculum.standard;

        if (!std) {
            container.innerHTML = '<div class="standard-header"><h2>' + curriculum.name + '</h2></div>' +
                '<div class="standard-meta"><span class="meta-item">No DOL standard linked</span></div>';
            return;
        }

        var html = '<div class="standard-header">';
        html += '<span class="appendix-badge">Appendix ' + std.appendix + '</span>';
        html += '<h2>' + (std.title || curriculum.name) + '</h2>';
        html += '</div>';

        html += '<div class="standard-meta">';
        if (std.onetSocCode) html += '<span class="meta-item"><strong>O*NET-SOC:</strong> ' + std.onetSocCode + '</span>';
        if (std.rapidsCode) html += '<span class="meta-item"><strong>RAPIDS:</strong> ' + std.rapidsCode + '</span>';

        // Count hours
        var totalHours = 0;
        var rtiMinHours = 0;
        if (curriculum.groups) {
            curriculum.groups.forEach(function(g) {
                if (g.hours) rtiMinHours += g.hours;
                g.courses.forEach(function(ref) {
                    var resolved = resolveRef(ref);
                    if (resolved.hoursOverride) {
                        totalHours += resolved.hoursOverride;
                    } else if (resolved.course && resolved.course.hours) {
                        totalHours += resolved.course.hours;
                    }
                });
            });
        }
        if (rtiMinHours) html += '<span class="meta-item"><strong>RTI Minimum:</strong> ' + rtiMinHours + 'h</span>';
        if (totalHours) html += '<span class="meta-item"><strong>Curriculum Hours:</strong> ' + totalHours + 'h</span>';
        html += '</div>';

        html += '<div class="standard-links">';
        if (std.sourceUrl) html += '<a href="' + std.sourceUrl + '" target="_blank"><i class="fa-solid fa-file-pdf"></i> Source PDF</a>';
        if (std.markdownReference) html += '<span class="standard-file-ref" title="' + std.markdownReference + '"><i class="fa-solid fa-file-lines"></i> ' + std.markdownReference.split('/').pop() + '</span>';
        html += '</div>';

        container.innerHTML = html;
    }

    // --- Pipeline Summary Bar ---
    function renderSummary(curriculum) {
        var container = document.getElementById('pipeline-summary');
        var summary = computePipelineSummary(curriculum);
        var total = summary.total;

        var html = '<h3>Pipeline Progress</h3>';

        // Stacked bar
        html += '<div class="pipeline-bar">';
        PIPELINE_STAGES.forEach(function(stage) {
            var count = summary.stageCounts[stage];
            if (count === 0) return;
            var pct = (count / total * 100).toFixed(1);
            var css = STAGE_CSS[stage];
            var label = count > 1 || parseFloat(pct) > 8 ? count : '';
            html += '<div class="bar-segment ' + css + '" style="width:' + pct + '%" title="' + stage + ': ' + count + '">' + label + '</div>';
        });
        html += '</div>';

        // Counts row
        html += '<div class="pipeline-counts">';
        PIPELINE_STAGES.forEach(function(stage) {
            var count = summary.stageCounts[stage];
            html += '<div class="count-item">';
            html += '<span class="count-dot ' + STAGE_CSS[stage] + '"></span>';
            html += '<span class="count-num">' + count + '</span> ' + stage;
            html += '</div>';
        });
        html += '</div>';

        container.innerHTML = html;
    }

    // --- Group + Course Cards ---
    function renderGroups(curriculum) {
        var container = document.getElementById('pipeline-groups');

        if (!curriculum.groups) {
            // Flat curriculum — render as single group
            container.innerHTML = renderCourseList(curriculum.courses || [], 'Courses');
            return;
        }

        var html = '';
        curriculum.groups.forEach(function(group, gi) {
            var groupHours = 0;
            var courseCards = '';

            (group.courses || []).forEach(function(ref) {
                var resolved = resolveRef(ref);
                var course = resolved.course;
                var stage = computeStage(course);
                var hours = resolved.hoursOverride || (course && course.hours) || null;
                if (hours) groupHours += hours;

                courseCards += renderCourseCard(resolved, stage, hours);
            });

            var rtiNote = group.note || '';

            html += '<div class="group-card expanded">';
            html += '<div class="group-header" onclick="this.parentElement.classList.toggle(\'expanded\')">';
            html += '<div class="group-header-left">';
            html += '<span class="group-number">' + (gi + 1) + '</span>';
            html += '<h3>' + group.name + '</h3>';
            html += '</div>';
            html += '<div class="group-meta">';
            if (rtiNote) html += '<span class="rti-note">' + rtiNote + '</span>';
            html += '<span>' + (group.courses ? group.courses.length : 0) + ' courses</span>';
            if (group.hours) html += '<span>' + group.hours + 'h RTI min</span>';
            html += '<span>' + groupHours + 'h actual</span>';
            html += '<i class="fa-solid fa-chevron-right chevron"></i>';
            html += '</div>';
            html += '</div>';
            html += '<div class="group-body">' + courseCards + '</div>';
            html += '</div>';
        });

        container.innerHTML = html;
    }

    function renderCourseCard(resolved, stage, hours) {
        var course = resolved.course;
        var courseId = resolved.id;
        var courseName = course ? course.name : (courseId || 'Unknown Course');
        var stageCss = STAGE_CSS[stage];
        var stageIcon = STAGE_ICONS[stage];
        var docs = getDocumentLinks(courseId, course);

        var html = '<div class="course-card">';

        // Header row
        html += '<div class="course-card-header">';
        html += '<h4>' + courseName + '</h4>';
        html += '<div style="display:flex;align-items:center;gap:8px;">';
        if (hours) html += '<span class="hours-badge">' + hours + 'h</span>';
        html += '<span class="stage-badge ' + stageCss + '"><i class="fa-solid ' + stageIcon + '"></i> ' + stage + '</span>';
        html += '</div>';
        html += '</div>';

        // Status chips
        if (course && course.status) {
            html += '<div class="course-status-row">';
            html += '<span class="status-chip">Design: ' + (course.status.design || 'Not Started') + '</span>';
            html += '<span class="status-chip">Dev: ' + (course.status.development || 'Not Started') + '</span>';
            if (resolved.note) html += '<span class="status-chip" style="color:var(--note-text)">' + resolved.note + '</span>';
            html += '</div>';
        }

        // Source documents
        var sourceKeys = Object.keys(docs.source);
        if (sourceKeys.length > 0) {
            html += '<div class="doc-section">';
            html += '<div class="doc-section-label">Source</div>';
            html += '<div class="doc-links">';
            sourceKeys.forEach(function(key) {
                var d = docs.source[key];
                html += '<a class="doc-link" href="' + d.url + '" target="_blank"><i class="' + d.icon + '"></i> ' + d.label + '</a>';
            });
            html += '</div></div>';
        }

        // Working documents
        var workingKeys = Object.keys(docs.working);
        if (workingKeys.length > 0) {
            html += '<div class="doc-section">';
            html += '<div class="doc-section-label">Working</div>';
            html += '<div class="doc-links">';
            workingKeys.forEach(function(key) {
                var d = docs.working[key];
                if (d.url) {
                    html += '<a class="doc-link" href="' + d.url + '" target="_blank"><i class="' + d.icon + '"></i> ' + d.label + '</a>';
                } else {
                    html += '<span class="doc-link"><i class="' + d.icon + '"></i> ' + d.label + '</span>';
                }
            });
            html += '</div></div>';
        }

        // No documents at all
        if (sourceKeys.length === 0 && workingKeys.length === 0) {
            html += '<div class="doc-section"><div class="doc-section-label" style="color:var(--text-muted);font-style:italic;">No documents linked</div></div>';
        }

        html += '</div>';
        return html;
    }

    // --- Render full curriculum ---
    function renderCurriculum(curriculum) {
        renderStandard(curriculum);
        renderSummary(curriculum);
        renderGroups(curriculum);
    }

    // --- Init ---
    renderSelector();
    if (selectableCurricula.length > 0) {
        renderCurriculum(selectableCurricula[0]);
    }
})();
