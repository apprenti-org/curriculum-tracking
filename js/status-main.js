/**
 * Status page logic — status.html
 * Depends on: courseData, curriculaData, courseStatusMap (from courses.js)
 */

const STATUSES = ['Not Started', 'Scoping', 'In Progress', 'Needs Review', 'In Review', 'Complete'];
const STATUS_CLASSES = { 'Not Started': 'not-started', 'Scoping': 'scoping', 'In Progress': 'in-progress', 'Needs Review': 'needs-review', 'In Review': 'in-review', 'Complete': 'complete' };

// Build membership map from curriculaData (loaded from courses.js)
const membershipMap = {};
curriculaData.forEach(cur => {
    const curName = cur.name;
    if (cur.groups) {
        cur.groups.forEach(g => {
            g.courses.forEach(gc => {
                const key = gc.id || gc.name;
                if (!membershipMap[key]) membershipMap[key] = [];
                membershipMap[key].push({ curriculum: curName, group: g.name, hoursOverride: gc.hoursOverride || undefined });
            });
        });
    } else if (cur.courses) {
        cur.courses.forEach(cc => {
            const key = cc.id || cc.name;
            if (!membershipMap[key]) membershipMap[key] = [];
            membershipMap[key].push({ curriculum: curName, group: undefined, hoursOverride: cc.hoursOverride || undefined });
        });
    }
});

const contentData = courseData.map(c => ({
    id: c.id || '',
    name: c.name,
    type: 'Course',
    hours: c.hours,
    designStatus: c.status.design,
    devStatus: c.status.development,
    note: c.note || '',
    membership: membershipMap[c.id] || membershipMap[c.name] || []
}));

let activeFilter = 'all';
let activeDropdown = null;

function computeSummary() {
    const total = contentData.length;
    return {
        total,
        designComplete: contentData.filter(c => c.designStatus === 'Complete').length,
        designActive: contentData.filter(c => c.designStatus !== 'Not Started' && c.designStatus !== 'Complete').length,
        devComplete: contentData.filter(c => c.devStatus === 'Complete').length,
        devActive: contentData.filter(c => c.devStatus !== 'Not Started' && c.devStatus !== 'Complete').length
    };
}

function renderSummary() {
    const s = computeSummary();
    document.getElementById('summary-bar').innerHTML = `
        <div class="summary-card"><div class="label">Total Courses</div><div class="value">${s.total}</div></div>
        <div class="summary-card"><div class="label">Design Complete</div><div class="value">${s.designComplete}<span style="font-size:16px;color:var(--text-secondary)">/${s.total}</span></div><div class="sub">${s.designActive} in progress</div></div>
        <div class="summary-card"><div class="label">Development Complete</div><div class="value">${s.devComplete}<span style="font-size:16px;color:var(--text-secondary)">/${s.total}</span></div><div class="sub">${s.devActive} in progress</div></div>
        <div class="summary-card"><div class="label">Overall Progress</div><div class="value">${Math.round(((s.designComplete + s.devComplete) / (s.total * 2)) * 100)}%</div><div class="sub">Design + Development combined</div></div>
    `;
}

function renderProgress() {
    const total = contentData.length;
    function countByStatus(field) { const c = {}; STATUSES.forEach(s => c[s] = 0); contentData.forEach(x => c[x[field]]++); return c; }
    const dc = countByStatus('designStatus'), dv = countByStatus('devStatus');
    function barSegments(counts) {
        return STATUSES.map(s => {
            const pct = total > 0 ? (counts[s] / total) * 100 : 0;
            const cls = s === 'Complete' ? 'seg-complete' : s === 'Not Started' ? 'seg-not-started' : 'seg-in-progress';
            return `<div class="progress-segment ${cls}" style="width:${pct}%" title="${s}: ${counts[s]}"></div>`;
        }).join('');
    }
    document.getElementById('progress-section').innerHTML = `
        <div class="progress-row">
            <div class="progress-block"><h3>Design Track</h3><div class="progress-bar-container">${barSegments(dc)}</div>
                <div class="progress-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--seg-complete)"></span> Complete (${dc['Complete']})</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-active)"></span> Active (${dc['Scoping'] + dc['In Progress'] + dc['In Review']})</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-empty);border:1px solid var(--seg-empty-border)"></span> Not Started (${dc['Not Started']})</span></div>
            </div>
            <div class="progress-block"><h3>Development Track</h3><div class="progress-bar-container">${barSegments(dv)}</div>
                <div class="progress-legend"><span class="legend-item"><span class="legend-dot" style="background:var(--seg-complete)"></span> Complete (${dv['Complete']})</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-active)"></span> Active (${dv['Scoping'] + dv['In Progress'] + dv['In Review']})</span><span class="legend-item"><span class="legend-dot" style="background:var(--seg-empty);border:1px solid var(--seg-empty-border)"></span> Not Started (${dv['Not Started']})</span></div>
            </div>
        </div>`;
}

// Build all unique curriculum names for filter chips
const allCurricula = [...new Set(contentData.flatMap(d => d.membership.map(m => m.curriculum)))];

function buildMembershipHTML(membership) {
    return membership.map(m => {
        let html = `<span class="membership-tag"><span class="membership-curriculum">${m.curriculum}</span>`;
        if (m.group) html += `<span class="membership-sep">&rsaquo;</span><span class="membership-group">${m.group}</span>`;
        if (m.hoursOverride) html += `<span style="color:var(--text-muted);font-size:10px;margin-left:3px;">(${m.hoursOverride}h)</span>`;
        html += `</span>`;
        return html;
    }).join(' ');
}

function renderTable() {
    let filtered = contentData;
    if (activeFilter === 'active') filtered = contentData.filter(d => d.designStatus !== 'Not Started' || d.devStatus !== 'Not Started');
    else if (activeFilter === 'not-started') filtered = contentData.filter(d => d.designStatus === 'Not Started' && d.devStatus === 'Not Started');
    else if (activeFilter !== 'all') filtered = contentData.filter(d => d.membership.some(m => m.curriculum === activeFilter));

    const rows = filtered.map(item => {
        const realIdx = contentData.indexOf(item);
        return `<tr>
            <td><span class="cell-name">${item.name}</span></td>
            <td class="membership-cell">${buildMembershipHTML(item.membership)}</td>
            <td class="cell-hours">${item.hours || '\u2014'}</td>
            <td class="status-cell">
                <span class="status-pill status-${STATUS_CLASSES[item.designStatus]}" onclick="toggleDropdown(event, ${realIdx}, 'design')"><span class="status-dot dot-${STATUS_CLASSES[item.designStatus]}"></span>${item.designStatus}</span>
                <div class="status-dropdown" id="dd-design-${realIdx}">${STATUSES.map(s => `<div class="status-option" onclick="setStatus(${realIdx}, 'designStatus', '${s}')"><span class="status-dot dot-${STATUS_CLASSES[s]}"></span> ${s}</div>`).join('')}</div>
            </td>
            <td class="status-cell">
                <span class="status-pill status-${STATUS_CLASSES[item.devStatus]}" onclick="toggleDropdown(event, ${realIdx}, 'dev')"><span class="status-dot dot-${STATUS_CLASSES[item.devStatus]}"></span>${item.devStatus}</span>
                <div class="status-dropdown" id="dd-dev-${realIdx}">${STATUSES.map(s => `<div class="status-option" onclick="setStatus(${realIdx}, 'devStatus', '${s}')"><span class="status-dot dot-${STATUS_CLASSES[s]}"></span> ${s}</div>`).join('')}</div>
            </td>
            <td class="note-cell">${item.note || ''}</td>
        </tr>`;
    }).join('');

    document.getElementById('table-section').innerHTML = `
        <h2>All Courses</h2>
        <div class="filter-row">
            <span class="filter-chip ${activeFilter === 'all' ? 'active' : ''}" onclick="setFilter('all')">All</span>
            ${allCurricula.map(c => `<span class="filter-chip ${activeFilter === c ? 'active' : ''}" onclick="setFilter('${c}')">${c}</span>`).join('')}
            <span class="filter-chip ${activeFilter === 'active' ? 'active' : ''}" onclick="setFilter('active')">Active</span>
            <span class="filter-chip ${activeFilter === 'not-started' ? 'active' : ''}" onclick="setFilter('not-started')">Not Started</span>
        </div>
        <table><thead><tr><th>Course</th><th>Curricula / Groups</th><th>Hours</th><th>Design Status</th><th>Dev Status</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function toggleDropdown(event, idx, track) {
    event.stopPropagation();
    const el = document.getElementById(`dd-${track}-${idx}`);
    if (activeDropdown && activeDropdown !== el) activeDropdown.classList.remove('open');
    el.classList.toggle('open');
    activeDropdown = el.classList.contains('open') ? el : null;
}

function setStatus(idx, field, value) {
    contentData[idx][field] = value;
    if (activeDropdown) activeDropdown.classList.remove('open');
    activeDropdown = null;
    renderAll();
}

function setFilter(f) { activeFilter = f; renderTable(); }

document.addEventListener('click', () => { if (activeDropdown) { activeDropdown.classList.remove('open'); activeDropdown = null; } });

function renderAll() { renderSummary(); renderProgress(); renderTable(); }
renderAll();
