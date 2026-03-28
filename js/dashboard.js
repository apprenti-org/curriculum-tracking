/**
 * Dashboard page logic — index.html
 * Depends on: courseData, curriculaData, courseStatusMap (from courses.js)
 *             courseOutlines (from outlines/outlines.js)
 */

// Syllabi map — course name → HTML filename in syllabi/
// Add entries here as syllabi are rendered to HTML
const syllabiMap = {
    'Advanced Python': 'advanced-python.html',
    'Agile Project Management with Scrum': 'agile-project-management.html',
    'AI Foundations': 'ai-foundations.html',
    'ASP.NET': 'aspnet.html',
    'Business Analysis Fundamentals': 'business-analysis-fundamentals.html',
    'Business and IT Fundamentals': 'business-and-it-fundamentals.html',
    'C# Data Access': 'csharp-data-access.html',
    'C# Language Fundamentals': 'csharp-language-fundamentals.html',
    'C# OOP': 'csharp-oop.html',
    'C++ Coding Booster Intensive': 'cpp-coding-booster.html',
    'CI/CD Pipeline Concepts': 'cicd-pipeline-concepts.html',
    'Compliance and Security Awareness': 'compliance-security-awareness.html',
    'CompTIA A+': 'comptia-a-plus.html',
    'CompTIA Network+': 'comptia-network-plus.html',
    'Data Fundamentals — Data Literacy': 'data-literacy.html',
    'Data Fundamentals — Data Visualizations and Power BI': 'data-viz-power-bi.html',
    'Data Fundamentals — Excel for Data Analysts': 'excel-for-data-analysts.html',
    'Data Fundamentals — SQL for Data': 'sql-for-data.html',
    'Databases in Java': 'databases-in-java.html',
    'Helpdesk Software Fundamentals': 'helpdesk-software-fundamentals.html',
    'HTTP Services': 'http-services.html',
    'Infrastructure as Code Fundamentals': 'infrastructure-as-code.html',
    'Instructor Onboarding': 'instructor-onboarding.html',
    'Introduction to AWS Cloud Platform': 'intro-to-aws.html',
    'Introduction to Cloud Technology': 'intro-to-cloud-technology.html',
    'Introduction to GitHub': 'intro-to-github.html',
    'Introduction to HTML & CSS': 'intro-to-html-css.html',
    'Introduction to Microsoft Teams': 'intro-to-microsoft-teams.html',
    'IT Fundamentals': 'it-fundamentals.html',
    'ITIL Foundations': 'itil-foundations.html',
    'ITIL Specialist 4': 'itil-specialist.html',
    'Java Coding Booster Intensive': 'java-coding-booster.html',
    'Java Language Fundamentals': 'java-language-fundamentals.html',
    'JavaScript': 'javascript.html',
    'JavaScript Coding Booster Intensive': 'javascript-coding-booster.html',
    'JavaScript React for C#': 'javascript-react-for-csharp.html',
    'Layers and File I/O for C#': 'layers-and-file-io-csharp.html',
    'LINQ and Dependency Injection': 'linq-and-dependency-injection.html',
    'Linux Foundations': 'linux-foundations.html',
    'macOS Administration Fundamentals': 'macos-administration.html',
    'Networking Fundamentals': 'networking-fundamentals.html',
    'Non-Relational Data': 'non-relational-data.html',
    'Pandas': 'pandas.html',
    'Productivity Tools for Technical Reporting': 'productivity-tools-reporting.html',
    'Professional Communication': 'professional-communication.html',
    'Python Basics (for Software Dev)': 'python-basics-softdev.html',
    'Python Coding Booster Intensive': 'python-coding-booster.html',
    'Python for Infrastructure Automation': 'python-infrastructure-automation.html',
    'React': 'react.html',
    'Security and Cybersecurity Fundamentals': 'security-cybersecurity-fundamentals.html',
    'Software Developer Pre-Work': 'software-developer-prework.html',
    'Software Development Lifecycle': 'software-development-lifecycle.html',
    'SQL Coding Booster Intensive': 'sql-coding-booster.html',
    'SQL for C#': 'sql-for-csharp.html',
    'SQL Fundamentals for Operations': 'sql-fundamentals-operations.html',
    'Student Onboarding': 'student-onboarding.html',
    'Technical Documentation': 'technical-documentation.html',
    'Web Development with JavaScript and React': 'web-dev-javascript-react.html'
};

// Build a lookup map: course name → course object
const courseLookup = {};
courseData.forEach(c => { courseLookup[c.name] = c; });

// Build curriculum membership map from curriculaData
let curriculumMap = {};

function courseStatusIcon(courseName) {
    const c = courseLookup[courseName];
    const design = c?.status?.design || 'Not Started';
    const dev = c?.status?.development || 'Not Started';
    const label = `Design: ${design} · Development: ${dev}`;
    if (design === 'Complete') return { icon: 'fa-circle-check', cls: 'status-complete', label };
    if (design === 'Needs Review' || design === 'In Review') return { icon: 'fa-circle-exclamation', cls: 'status-review', label };
    if (design === 'In Progress' || design === 'Scoping') return { icon: 'fa-circle-half-stroke', cls: 'status-progress', label };
    return { icon: 'fa-circle', cls: 'status-not-started', label };
}

function buildDashboard() {
    const courses = [...courseData].sort((a, b) => a.name.localeCompare(b.name));
    const totalHours = courses.reduce((sum, c) => sum + (c.hours || 0), 0);

    document.getElementById('stats-bar').innerHTML = `
        <div class="stat"><span class="stat-value">${curriculaData.length}</span><span class="stat-label"><i class="fa-solid fa-layer-group"></i> Curricula</span></div>
        <div class="stat"><span class="stat-value">${courses.length}</span><span class="stat-label"><i class="fa-solid fa-book"></i> Courses</span></div>
        <div class="stat"><span class="stat-value">${totalHours}</span><span class="stat-label"><i class="fa-regular fa-clock"></i> Total Hrs</span></div>
        <div class="stat"><span class="stat-value">${Object.keys(courseOutlines).length}</span><span class="stat-label"><i class="fa-solid fa-list-check"></i> Outlines</span></div>
    `;

    // Build curriculum membership map from curriculaData
    curriculumMap = {};
    curriculaData.forEach(cur => {
        const items = [];
        if (cur.groups) {
            cur.groups.forEach(g => {
                items.push({ _group: g.name, _hours: g.hours || null });
                g.courses.forEach(gc => {
                    const base = courseLookup[gc.name] || {};
                    items.push({
                        _name: gc.name,
                        _hours: gc.hoursOverride || base.hours || null,
                        _syllabus: base.syllabus || null,
                        _outline: base.outline || null,
                        _note: gc.note || base.note || null
                    });
                });
            });
        } else if (cur.courses) {
            cur.courses.forEach(cc => {
                const base = courseLookup[cc.name] || {};
                items.push({
                    _name: cc.name,
                    _hours: cc.hoursOverride || base.hours || null,
                    _syllabus: base.syllabus || null,
                    _outline: base.outline || null,
                    _note: cc.note || base.note || null
                });
            });
        }
        curriculumMap[cur.name] = { items, syllabus: cur.syllabus || null };
    });

    const nav = document.getElementById('nav-scroll');
    let html = '';

    // Curricula section
    html += `<div class="nav-section-label"><i class="fa-solid fa-layer-group" style="font-size:10px;"></i> Curricula</div>`;
    Object.keys(curriculumMap).forEach(name => {
        html += buildCurriculumSummary(name, curriculumMap[name].items, curriculumMap[name].syllabus);
    });

    // Divider
    html += `<div class="nav-section-divider"></div>`;

    // All Courses section
    html += `<div class="nav-section-label"><i class="fa-solid fa-book-open" style="font-size:10px;"></i> Courses</div>`;
    html += `<div class="standalone-section"><div class="standalone-header"><h2><i class="fa-solid fa-book-open" style="margin-right:6px;opacity:0.7;"></i>All Courses</h2></div><div class="nav-course-list">`;
    if (courses.length === 0) html += `<div class="empty-state-nav">No courses loaded yet</div>`;
    else courses.forEach(c => { html += buildNavItemFromCourse(c); });
    html += `</div></div>`;

    nav.innerHTML = html;

    // Event listeners
    document.querySelectorAll('.curriculum-header').forEach(el => {
        el.addEventListener('click', () => el.closest('.curriculum-group').classList.toggle('collapsed'));
    });
    document.querySelectorAll('.nav-group-header').forEach(el => {
        el.addEventListener('click', () => el.classList.toggle('collapsed'));
    });
    document.querySelectorAll('.nav-course-item').forEach(el => {
        el.addEventListener('click', () => selectCourse(el));
    });
}

function buildCurriculumSummary(name, items, syllabus) {
    const actualCourses = items.filter(c => !c._group);
    const totalHours = actualCourses.reduce((s, c) => s + (c._hours || 0), 0);
    const syllabusLink = syllabus ? `<a href="${syllabus}" target="_blank" class="curriculum-syllabus-link"><i class="fa-solid fa-file-alt" style="color:#4caf50;font-size:10px;margin-right:4px;"></i>Syllabus</a>` : '';
    let html = `<div class="curriculum-group collapsed"><div class="curriculum-header">
        <i class="fa-solid fa-chevron-down chevron"></i>
        <h2>${name}</h2><span class="curriculum-badge">Curriculum</span>
        <span class="curriculum-meta">${actualCourses.length} courses &middot; ${totalHours}h</span>
    </div><div class="nav-course-list">${syllabusLink ? `<div class="curriculum-syllabus-row">${syllabusLink}</div>` : ''}`;
    if (actualCourses.length === 0) html += `<div class="empty-state-nav">No courses loaded yet</div>`;
    else {
        let inGroup = false;
        items.forEach(c => {
            if (c._group) {
                if (inGroup) html += `</div>`;
                html += `<div class="nav-group-header">
                    <i class="fa-solid fa-chevron-down group-chevron"></i>
                    <span class="nav-group-label">${c._group}</span>
                    ${c._hours ? `<span class="nav-group-hours">${c._hours}h</span>` : ''}
                </div><div class="nav-group-courses">`;
                inGroup = true;
            } else {
                const cName = c._name;
                const hours = c._hours;
                const si = courseStatusIcon(cName);
                html += `<div class="nav-course-item" data-course-name="${cName}">
                    <i class="fa-solid ${si.icon} status-dot ${si.cls}" style="font-size:10px;" title="${si.label}"></i>
                    <span class="nav-course-name">${cName}</span>
                    ${hours ? `<span class="nav-course-hours"><i class="fa-regular fa-clock" style="font-size:9px;opacity:0.6;margin-right:2px;"></i>${hours}h</span>` : ''}
                </div>`;
            }
        });
        if (inGroup) html += `</div>`;
    }
    html += `</div></div>`;
    return html;
}

function buildNavItemFromCourse(course) {
    const name = course.name;
    const hours = course.hours;
    const si = courseStatusIcon(name);
    return `<div class="nav-course-item" data-course-name="${name}">
        <i class="fa-solid ${si.icon} status-dot ${si.cls}" style="font-size:10px;" title="${si.label}"></i>
        <span class="nav-course-name">${name}</span>
        ${hours ? `<span class="nav-course-hours"><i class="fa-regular fa-clock" style="font-size:9px;opacity:0.6;margin-right:2px;"></i>${hours}h</span>` : ''}
    </div>`;
}

function selectCourse(el) {
    document.querySelectorAll('.nav-course-item.active').forEach(e => e.classList.remove('active'));
    el.classList.add('active');

    const courseName = el.dataset.courseName;
    const course = courseLookup[courseName] || {};
    const detail = document.getElementById('detail-panel');

    let html = '';

    // Detail header
    html += `<div class="detail-header">`;
    html += `<h2>${courseName}</h2>`;
    html += `<div class="detail-meta">`;
    if (course.hours) html += `<span class="detail-meta-item"><i class="fa-regular fa-clock" style="opacity:0.6;"></i> <strong>${course.hours}</strong>&nbsp;hours</span>`;
    const outlineData = courseOutlines[courseName];
    if (outlineData) {
        html += `<span class="detail-meta-item"><i class="fa-solid fa-cubes" style="opacity:0.6;"></i> ${outlineData.totalModules} modules</span>`;
        html += `<span class="detail-meta-item"><i class="fa-solid fa-file-lines" style="opacity:0.6;"></i> ${outlineData.totalLessons} lessons</span>`;
    }
    html += `</div>`;

    // Curriculum & group membership
    const memberships = [];
    Object.keys(curriculumMap).forEach(curName => {
        let currentGroup = null;
        curriculumMap[curName].items.forEach(item => {
            if (item._group) { currentGroup = item._group; }
            else if (item._name === courseName) {
                memberships.push({ curriculum: curName, group: currentGroup });
            }
        });
    });
    if (memberships.length) {
        html += `<div class="detail-membership">`;
        memberships.forEach(m => {
            html += `<div class="membership-tag"><i class="fa-solid fa-layer-group" style="font-size:10px;opacity:0.6;"></i> <span class="membership-curriculum">${m.curriculum}</span>`;
            if (m.group) html += ` <i class="fa-solid fa-chevron-right" style="font-size:8px;opacity:0.4;margin:0 4px;"></i> <span class="membership-group">${m.group}</span>`;
            html += `</div>`;
        });
        html += `</div>`;
    }

    // Refs
    const syllabus = course.syllabus || '';
    const outline = course.outline || '';
    const syllabusFile = syllabiMap[courseName];
    const hasOutlineData = !!courseOutlines[courseName];
    const hasDrive = !!course.driveFolder;
    {
        html += `<div class="detail-refs">`;
        if (syllabusFile) {
            html += `<a href="syllabi/${syllabusFile}" target="_blank" class="ref-link"><i class="fa-solid fa-file-alt" style="color:#4caf50;"></i> Syllabus</a>`;
        } else if (syllabus && typeof syllabus === 'string' && syllabus.startsWith('http')) {
            html += `<a href="${syllabus}" target="_blank" class="ref-link"><i class="fa-solid fa-file-alt" style="color:#4caf50;"></i> Syllabus</a>`;
        } else if (syllabus) {
            html += `<span><i class="fa-solid fa-file-alt" style="opacity:0.5;"></i> Syllabus</span>`;
        }
        if (outline) {
            const iconColor = hasOutlineData ? 'color:#4caf50;' : 'opacity:0.5;';
            html += `<span><i class="fa-solid fa-list-ul" style="${iconColor}"></i> Outline</span>`;
        }
        if (course.driveFolder) {
            html += `<a href="${course.driveFolder}" target="_blank" class="ref-link drive-link"><i class="fa-brands fa-google-drive" style="color:#4caf50;"></i> Google Drive</a>`;
        }
        html += `</div>`;
    }

    // Status tracks — pull from courseStatusMap (loaded from courses.js)
    const courseStatus = courseStatusMap[courseName] || {};
    const designStatus = courseStatus.status?.design || 'Not Started';
    const devStatus = courseStatus.status?.development || 'Not Started';
    function statusClass(s) { return s === 'Complete' ? 'complete' : s === 'In Progress' ? 'in-progress' : s === 'Needs Review' ? 'needs-review' : 'not-started'; }
    html += `<div class="status-tracks"><div class="track"><span class="track-label"><i class="fa-solid fa-compass-drafting" style="margin-right:3px;"></i>Design:</span><span class="track-status ${statusClass(designStatus)}">${designStatus}</span></div><div class="track"><span class="track-label"><i class="fa-solid fa-code" style="margin-right:3px;"></i>Dev:</span><span class="track-status ${statusClass(devStatus)}">${devStatus}</span></div></div>`;
    html += `</div>`;

    // Outline section
    if (outlineData) {
        html += `<div class="outline-section">`;
        html += `<div class="outline-section-header"><h3><i class="fa-solid fa-sitemap" style="margin-right:6px;opacity:0.7;"></i>Course Outline</h3><span class="outline-meta">${outlineData.totalModules} modules &middot; ${outlineData.totalLessons} lessons &middot; ${outlineData.totalHours} hours</span></div>`;
        let num = 1;
        outlineData.modules.forEach((mod, i) => {
            html += `<div class="outline-module"><div class="module-header" data-module="${i}"><i class="fa-solid fa-chevron-right module-chevron"></i><span class="module-name"><i class="fa-solid fa-cube" style="opacity:0.5;margin-right:4px;font-size:11px;"></i>Module ${i+1}: ${mod.name || mod.title}</span><span class="module-hours">${mod.hours}h &middot; ${mod.lessons.length} lessons</span></div>`;
            html += `<div class="module-lessons">`;
            if (mod.description) html += `<div style="font-size:12px;color:var(--text-secondary);margin-bottom:8px;font-style:italic;">${mod.description}</div>`;
            mod.lessons.forEach(l => {
                html += `<div class="lesson-item"><div class="lesson-title"><i class="fa-solid fa-file-lines" style="color:var(--text-muted);font-size:10px;"></i><span style="color:var(--text-muted);font-size:12px;">Lesson ${num}.</span> ${l.title || l.name}<span class="lesson-hours">${l.hours || ''}${l.hours ? 'h' : ''}</span></div>`;
                if (l.topics?.length) { html += `<div class="lesson-topics">`; l.topics.forEach(t => { html += `<div class="lesson-topic">${t}</div>`; }); html += `</div>`; }
                html += `</div>`; num++;
            });
            html += `</div></div>`;
        });
        if (outlineData.assessment) {
            html += `<div class="outline-assessment"><div class="assessment-title"><i class="fa-solid fa-clipboard-check" style="margin-right:6px;"></i>${outlineData.assessment.title} (${outlineData.assessment.hours}h)</div><div class="assessment-items">`;
            outlineData.assessment.items.forEach(item => { html += `<div class="assessment-item">${item}</div>`; });
            html += `</div></div>`;
        }
        html += `</div>`;
    } else {
        html += `<div class="outline-section"><div class="outline-no-data"><i class="fa-solid fa-circle-info" style="margin-right:6px;opacity:0.5;"></i>Course outline not yet loaded. Ingest the outline to see module and lesson details here.</div></div>`;
    }

    detail.innerHTML = html;

    // Re-bind module expand/collapse
    detail.querySelectorAll('.module-header').forEach(el => {
        el.addEventListener('click', () => el.closest('.outline-module').classList.toggle('expanded'));
    });
}

buildDashboard();
