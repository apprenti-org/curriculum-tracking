/**
 * Course outline renderer — renders module/lesson tree in detail panel
 * Depends on: nothing (pure rendering functions)
 *
 * Exposes: renderOutline(), renderNoOutline()
 */

/**
 * Render full course outline (modules, lessons, topics, assessment)
 * @param {Object} outlineData - outline object with modules, totalModules, etc.
 * @returns {string} HTML string
 */
function renderOutline(outlineData) {
    var html = '<div class="outline-section">';
    html += '<div class="outline-section-header"><h3><i class="fa-solid fa-sitemap" style="margin-right:6px;opacity:0.7;"></i>Course Outline</h3>';
    html += '<span class="outline-meta">' + outlineData.totalModules + ' modules &middot; ' + outlineData.totalLessons + ' lessons &middot; ' + outlineData.totalHours + ' hours</span></div>';

    var num = 1;
    outlineData.modules.forEach(function(mod, i) {
        html += '<div class="outline-module"><div class="module-header" data-module="' + i + '">' +
            '<i class="fa-solid fa-chevron-right module-chevron"></i>' +
            '<span class="module-name"><i class="fa-solid fa-cube" style="opacity:0.5;margin-right:4px;font-size:11px;"></i>Module ' + (i + 1) + ': ' + (mod.name || mod.title) + '</span>' +
            '<span class="module-hours">' + mod.hours + 'h &middot; ' + mod.lessons.length + ' lessons</span></div>';
        html += '<div class="module-lessons">';

        if (mod.description) {
            html += '<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-style:italic;">' + mod.description + '</div>';
        }

        mod.lessons.forEach(function(l) {
            html += '<div class="lesson-item"><div class="lesson-title">' +
                '<i class="fa-solid fa-file-lines" style="color:var(--text-muted);font-size:10px;"></i>' +
                '<span style="color:var(--text-muted);font-size:12px;">Lesson ' + num + '.</span> ' + (l.title || l.name) +
                '<span class="lesson-hours">' + (l.hours || '') + (l.hours ? 'h' : '') + '</span></div>';
            if (l.topics && l.topics.length) {
                html += '<div class="lesson-topics">';
                l.topics.forEach(function(t) { html += '<div class="lesson-topic">' + t + '</div>'; });
                html += '</div>';
            }
            html += '</div>';
            num++;
        });
        html += '</div></div>';
    });

    if (outlineData.assessment) {
        html += '<div class="outline-assessment"><div class="assessment-title">' +
            '<i class="fa-solid fa-clipboard-check" style="margin-right:6px;"></i>' +
            outlineData.assessment.title + ' (' + outlineData.assessment.hours + 'h)</div><div class="assessment-items">';
        outlineData.assessment.items.forEach(function(item) { html += '<div class="assessment-item">' + item + '</div>'; });
        html += '</div></div>';
    }
    html += '</div>';
    return html;
}

/**
 * Render empty outline placeholder
 * @returns {string} HTML string
 */
function renderNoOutline() {
    return '<div class="outline-section"><div class="outline-no-data">' +
        '<i class="fa-solid fa-circle-info" style="margin-right:6px;opacity:0.5;"></i>' +
        'Course outline not yet loaded. Ingest the outline to see module and lesson details here.</div></div>';
}
