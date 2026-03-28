/**
 * Shared formatting helpers
 * Depends on: courseLookup (from data-store.js), STATUS_CLASSES (from constants.js)
 */

// Returns { icon, cls, label } for a course's design/dev status
function courseStatusIcon(courseName) {
    var c = courseLookup[courseName];
    var design = (c && c.status && c.status.design) || 'Not Started';
    var dev = (c && c.status && c.status.development) || 'Not Started';
    var label = 'Design: ' + design + ' \u00b7 Development: ' + dev;
    if (design === 'Complete') return { icon: 'fa-circle-check', cls: 'status-complete', label: label };
    if (design === 'Needs Review' || design === 'In Review') return { icon: 'fa-circle-exclamation', cls: 'status-review', label: label };
    if (design === 'In Progress' || design === 'Scoping') return { icon: 'fa-circle-half-stroke', cls: 'status-progress', label: label };
    return { icon: 'fa-circle', cls: 'status-not-started', label: label };
}

// Renders membership tags HTML from an array of { curriculum, group, hoursOverride }
function buildMembershipHTML(membership) {
    return membership.map(function(m) {
        var html = '<span class="membership-tag"><span class="membership-curriculum">' + m.curriculum + '</span>';
        if (m.group) html += '<span class="membership-sep">&rsaquo;</span><span class="membership-group">' + m.group + '</span>';
        if (m.hoursOverride) html += '<span style="color:var(--text-muted);font-size:10px;margin-left:3px;">(' + m.hoursOverride + 'h)</span>';
        html += '</span>';
        return html;
    }).join(' ');
}
