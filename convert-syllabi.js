const fs = require('fs');
const path = require('path');

const coursesDir = '/sessions/busy-relaxed-dirac/mnt/Curriculum for Training Operations/_COURSES Phase 1 - WORKNG/courses';
const syllabiDir = '/sessions/busy-relaxed-dirac/mnt/Curriculum for Training Operations/_COURSES Phase 1 - WORKNG/tracking/repo/syllabi';

// CSS from the existing template
const CSS = `
:root[data-theme="dark"] {
    --bg: #111117;
    --surface: #1A1B23;
    --surface-raised: #22232D;
    --border: #2E2F3A;
    --border-subtle: #23242E;
    --text-primary: #F0F0EC;
    --text-secondary: #C8C9CE;
    --text-muted: #8B8D98;
    --sky-blue: #8ECAE6;
    --blue-green: #219EBC;
    --deep-space: #023047;
    --amber: #FFB703;
    --tiger: #FB8500;
    --link: #219EBC;
    --link-hover: #8ECAE6;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text-primary);
    line-height: 1.6;
}
.page {
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 32px 120px;
}
.back-link {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: var(--link);
    text-decoration: none;
    font-size: 13px;
    margin-bottom: 24px;
}
.back-link:hover { color: var(--link-hover); }
.header {
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
}
.header h1 {
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
}
.header-meta {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    font-size: 13px;
    color: var(--text-secondary);
}
.header-meta span {
    display: flex;
    align-items: center;
    gap: 5px;
}
.badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background: rgba(255, 183, 3, 0.12);
    color: var(--amber);
}
section { margin-bottom: 32px; }
section h2 {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 8px;
}
section h2 i { opacity: 0.6; font-size: 15px; }
p {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 12px;
}
.divider {
    border: none;
    border-top: 1px solid var(--border-subtle);
    margin: 28px 0;
}
.outcomes {
    list-style: none;
    counter-reset: outcome;
}
.outcomes li {
    counter-increment: outcome;
    font-size: 14px;
    color: var(--text-secondary);
    padding: 6px 0;
    display: flex;
    gap: 10px;
}
.outcomes li::before {
    content: counter(outcome) ".";
    color: var(--text-muted);
    font-weight: 600;
    min-width: 24px;
    text-align: right;
}
.module {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    margin-bottom: 12px;
    overflow: hidden;
}
.module-head {
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 10px;
}
.module-num {
    font-size: 11px;
    color: var(--text-muted);
    font-weight: 600;
    min-width: 20px;
}
.module-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    flex: 1;
}
.module-hours {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
}
.module-body {
    padding: 0 16px 14px;
    border-top: 1px solid var(--border-subtle);
}
.lesson-heading {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 12px 0 6px;
}
.topic-list {
    list-style: none;
    padding-left: 12px;
}
.topic-list li {
    font-size: 13px;
    color: var(--text-secondary);
    padding: 2px 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
}
.topic-list li::before {
    content: "\\2022";
    color: var(--text-muted);
    flex-shrink: 0;
}
.activities {
    margin-top: 10px;
    padding: 10px 12px;
    background: var(--surface-raised);
    border-radius: 6px;
}
.activities-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
}
.activities ul {
    list-style: none;
    padding: 0;
}
.activities li {
    font-size: 13px;
    color: var(--text-secondary);
    padding: 2px 0;
    display: flex;
    align-items: baseline;
    gap: 6px;
}
.activities li::before {
    content: "\\f0eb";
    font-family: "Font Awesome 6 Free";
    font-weight: 400;
    font-size: 10px;
    color: var(--amber);
    flex-shrink: 0;
}
.assessment-box {
    background: var(--surface);
    border: 1px solid var(--border-subtle);
    border-radius: 8px;
    padding: 16px;
}
.assessment-box p {
    font-size: 14px;
    color: var(--text-secondary);
    margin-bottom: 8px;
}
.assessment-box ul {
    list-style: none;
    padding: 0;
    margin-top: 8px;
}
.assessment-box li {
    font-size: 13px;
    color: var(--text-secondary);
    padding: 3px 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
}
.assessment-box li::before {
    content: "\\f00c";
    font-family: "Font Awesome 6 Free";
    font-weight: 900;
    font-size: 10px;
    color: #3fb950;
}
.software-list {
    list-style: none;
    padding: 0;
}
.software-list li {
    font-size: 13px;
    color: var(--text-secondary);
    padding: 3px 0;
    display: flex;
    align-items: center;
    gap: 8px;
}
.software-list li::before {
    content: "\\f019";
    font-family: "Font Awesome 6 Free";
    font-weight: 900;
    font-size: 10px;
    color: var(--text-muted);
}
.labs-list {
    list-style: none;
    padding: 0;
}
.labs-list li {
    font-size: 13px;
    color: var(--text-secondary);
    padding: 3px 0;
    display: flex;
    align-items: baseline;
    gap: 8px;
}
.labs-list li::before {
    content: "\\f120";
    font-family: "Font Awesome 6 Free";
    font-weight: 900;
    font-size: 10px;
    color: var(--sky-blue);
}
code {
    background: var(--surface-raised);
    padding: 1px 5px;
    border-radius: 3px;
    font-size: 13px;
    color: var(--sky-blue);
}
`;

function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseSyllabusMd(text) {
    const result = {
        title: '',
        curriculum: '',
        hours: '',
        status: 'DRAFT',
        description: [],
        assessment: { title: '', paragraphs: [] },
        outcomes: [],
        modules: [],
        labs: [],
        software: []
    };

    const lines = text.split('\n');
    let section = '';
    let currentModule = null;
    let currentLesson = null;
    let inActivities = false;
    let moduleNum = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Title
        if (trimmed.startsWith('# Syllabus:') || trimmed.startsWith('# **Syllabus:')) {
            result.title = trimmed.replace(/^#\s*\*?\*?Syllabus:\s*\*?\*?\s*/, '').replace(/\*+/g, '').trim();
            continue;
        }

        // Metadata
        if (trimmed.startsWith('**Part of the Curriculum:**')) {
            result.curriculum = trimmed.replace('**Part of the Curriculum:**', '').trim();
            continue;
        }
        if (trimmed.startsWith('**Course Length:**')) {
            result.hours = trimmed.match(/(\d+)/)?.[1] || '';
            continue;
        }
        if (trimmed.startsWith('**Document Status:**')) {
            result.status = trimmed.replace('**Document Status:**', '').trim();
            continue;
        }

        // Section headers
        if (trimmed.startsWith('## Course Description')) { section = 'description'; continue; }
        if (trimmed.startsWith('## Summative Assessment')) {
            section = 'assessment';
            result.assessment.title = trimmed.replace(/^##\s*Summative Assessment:?\s*/, '').replace(/\*+/g, '').trim();
            continue;
        }
        if (trimmed.startsWith('## Learning Outcomes')) { section = 'outcomes'; continue; }
        if (trimmed.startsWith('## Course Outline')) { section = 'outline'; continue; }
        if (trimmed.startsWith('## Labs') || trimmed.startsWith('## **Labs')) { section = 'labs'; continue; }
        if (trimmed.startsWith('## Software')) { section = 'software'; continue; }

        // Skip dividers and empty
        if (trimmed === '---' || trimmed === '') continue;
        if (trimmed.startsWith('<!--')) continue;
        if (trimmed === 'By the end of this course, learners will be able to:') continue;

        // Description
        if (section === 'description') {
            if (trimmed) result.description.push(trimmed.replace(/\*+/g, ''));
        }

        // Assessment
        if (section === 'assessment') {
            if (trimmed) result.assessment.paragraphs.push(trimmed.replace(/\*+/g, ''));
        }

        // Outcomes
        if (section === 'outcomes') {
            const m = trimmed.match(/^\d+\.\s*(.*)/);
            if (m) result.outcomes.push(m[1].replace(/\*+/g, ''));
        }

        // Outline
        if (section === 'outline') {
            // Module header
            const modMatch = trimmed.match(/^###\s*\*?\*?Module\s*\d*:?\s*(.*?)(?:\((\d+)\s*[Hh]ours?\))?(?:\*?\*?)?\s*$/);
            if (modMatch) {
                if (currentModule) result.modules.push(currentModule);
                moduleNum++;
                currentModule = {
                    num: moduleNum,
                    title: modMatch[1].replace(/\*+/g, '').replace(/\(\d+\s*[Hh]ours?\)/, '').trim(),
                    hours: modMatch[2] || '',
                    lessons: []
                };
                currentLesson = null;
                inActivities = false;
                continue;
            }

            // Lesson header
            const lesMatch = trimmed.match(/^\*?\*?Lesson:?\s*(.*?)\*?\*?\s*$/);
            if (lesMatch && currentModule) {
                currentLesson = {
                    title: lesMatch[1].replace(/\*+/g, '').trim(),
                    topics: [],
                    activities: []
                };
                currentModule.lessons.push(currentLesson);
                inActivities = false;
                continue;
            }

            // Activities marker
            if (trimmed === '*Activities*' || trimmed === '**Activities**' || trimmed === '**Activities:**' || trimmed === '*Activities:*') {
                inActivities = true;
                continue;
            }

            // Bullet items
            const bulletMatch = trimmed.match(/^[-*]\s+(.*)/);
            if (bulletMatch && currentModule) {
                const content = bulletMatch[1].replace(/\*+/g, '').trim();
                if (!content) continue;
                if (inActivities && currentLesson) {
                    currentLesson.activities.push(content.replace(/^Activity:\s*/, ''));
                } else if (currentLesson) {
                    currentLesson.topics.push(content);
                } else {
                    // No lesson yet, create an implicit one
                    if (!currentModule.lessons.length) {
                        currentLesson = { title: '', topics: [], activities: [] };
                        currentModule.lessons.push(currentLesson);
                    }
                    currentModule.lessons[currentModule.lessons.length - 1].topics.push(content);
                }
            }
        }

        // Labs
        if (section === 'labs') {
            const bm = trimmed.match(/^[-*]\s+(.*)/);
            if (bm) result.labs.push(bm[1].replace(/\*+/g, '').trim());
        }

        // Software
        if (section === 'software') {
            const bm = trimmed.match(/^[-*]\s+(.*)/);
            if (bm) result.software.push(bm[1].replace(/\*+/g, '').trim());
        }
    }

    if (currentModule) result.modules.push(currentModule);
    return result;
}

function buildHtml(data) {
    let html = `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Syllabus: ${escHtml(data.title)}</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    <style>${CSS}    </style>
</head>
<body>
    <div class="page">
        <a href="../index.html" class="back-link"><i class="fa-solid fa-arrow-left"></i> Back to Dashboard</a>

        <div class="header">
            <h1>Syllabus: ${escHtml(data.title)}</h1>
            <div class="header-meta">
                ${data.curriculum ? `<span><i class="fa-solid fa-layer-group"></i> ${escHtml(data.curriculum)}</span>` : ''}
                ${data.hours ? `<span><i class="fa-regular fa-clock"></i> ${data.hours} hours</span>` : ''}
                <span class="badge">${escHtml(data.status)}</span>
            </div>
        </div>
`;

    // Description
    if (data.description.length) {
        html += `        <section>\n            <h2><i class="fa-solid fa-book-open"></i> Course Description</h2>\n`;
        data.description.forEach(p => { html += `            <p>${escHtml(p)}</p>\n`; });
        html += `        </section>\n\n        <hr class="divider">\n\n`;
    }

    // Assessment
    if (data.assessment.paragraphs.length) {
        html += `        <section>\n            <h2><i class="fa-solid fa-trophy"></i> Summative Assessment${data.assessment.title ? ': ' + escHtml(data.assessment.title) : ''}</h2>\n`;
        html += `            <div class="assessment-box">\n`;
        data.assessment.paragraphs.forEach(p => { html += `                <p>${escHtml(p)}</p>\n`; });
        html += `            </div>\n`;
        html += `        </section>\n\n        <hr class="divider">\n\n`;
    }

    // Learning Outcomes
    if (data.outcomes.length) {
        html += `        <section>\n            <h2><i class="fa-solid fa-bullseye"></i> Learning Outcomes</h2>\n            <ol class="outcomes">\n`;
        data.outcomes.forEach(o => { html += `                <li>${escHtml(o)}</li>\n`; });
        html += `            </ol>\n        </section>\n\n        <hr class="divider">\n\n`;
    }

    // Course Outline
    if (data.modules.length) {
        html += `        <section>\n            <h2><i class="fa-solid fa-sitemap"></i> Course Outline</h2>\n\n`;
        data.modules.forEach(mod => {
            html += `            <div class="module">\n                <div class="module-head">\n`;
            html += `                    <span class="module-num">${mod.num}</span>\n`;
            html += `                    <span class="module-title">${escHtml(mod.title)}</span>\n`;
            if (mod.hours) html += `                    <span class="module-hours">${mod.hours} hours</span>\n`;
            html += `                </div>\n`;
            if (mod.lessons.length) {
                html += `                <div class="module-body">\n`;
                mod.lessons.forEach(les => {
                    if (les.title) html += `                    <div class="lesson-heading">Lesson: ${escHtml(les.title)}</div>\n`;
                    if (les.topics.length) {
                        html += `                    <ul class="topic-list">\n`;
                        les.topics.forEach(t => { html += `                        <li>${escHtml(t)}</li>\n`; });
                        html += `                    </ul>\n`;
                    }
                    if (les.activities.length) {
                        html += `                    <div class="activities">\n                        <div class="activities-label">Activities</div>\n                        <ul>\n`;
                        les.activities.forEach(a => { html += `                            <li>${escHtml(a)}</li>\n`; });
                        html += `                        </ul>\n                    </div>\n`;
                    }
                });
                html += `                </div>\n`;
            }
            html += `            </div>\n\n`;
        });
        html += `        </section>\n\n`;
    }

    // Labs
    if (data.labs.length) {
        html += `        <hr class="divider">\n\n        <section>\n            <h2><i class="fa-solid fa-laptop-code"></i> Labs &amp; Practical Exercises</h2>\n            <ul class="labs-list">\n`;
        data.labs.forEach(l => { html += `                <li>${escHtml(l)}</li>\n`; });
        html += `            </ul>\n        </section>\n\n`;
    }

    // Software
    if (data.software.length) {
        html += `        <hr class="divider">\n\n        <section>\n            <h2><i class="fa-solid fa-laptop-code"></i> Software Requirements</h2>\n            <ul class="software-list">\n`;
        data.software.forEach(s => { html += `                <li>${escHtml(s)}</li>\n`; });
        html += `            </ul>\n        </section>\n\n`;
    }

    html += `    </div>\n</body>\n</html>\n`;
    return html;
}

// Main
const folders = fs.readdirSync(coursesDir).filter(d => {
    const stat = fs.statSync(path.join(coursesDir, d));
    return stat.isDirectory() && d !== '.template' && d !== '.scorm-template';
});

const syllabiMap = {};
let converted = 0;
let errors = [];

folders.forEach(folder => {
    const folderPath = path.join(coursesDir, folder);
    const files = fs.readdirSync(folderPath);
    const syllabusFile = files.find(f => f.startsWith('syllabus-') && f.endsWith('.md'));

    if (!syllabusFile) {
        errors.push(`${folder}: no syllabus .md found`);
        return;
    }

    const mdContent = fs.readFileSync(path.join(folderPath, syllabusFile), 'utf8');
    const data = parseSyllabusMd(mdContent);

    if (!data.title) {
        // Try to derive title from filename
        data.title = folder.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    const htmlFilename = folder + '.html';
    const html = buildHtml(data);
    fs.writeFileSync(path.join(syllabiDir, htmlFilename), html);

    // We need to map course names. Read from courses.json
    converted++;
});

// Build syllabiMap from courses.json
const coursesJson = JSON.parse(fs.readFileSync(path.join(syllabiDir, '..', 'courses.json'), 'utf8'));
const folderMap = {};
folders.forEach(folder => {
    const htmlFile = folder + '.html';
    if (fs.existsSync(path.join(syllabiDir, htmlFile))) {
        folderMap[folder] = htmlFile;
    }
});

// Try to match course names to folder names
const nameToFolder = {};
coursesJson.courses.forEach(c => {
    // Normalize course name to match folder
    const slug = c.name.toLowerCase()
        .replace(/[—–]/g, '-')
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    // Try various matches
    for (const folder of folders) {
        if (folder === slug ||
            folder === slug.replace(/-for-software-dev$/, '-softdev') ||
            slug.includes(folder) ||
            folder.includes(slug.split('-').slice(0, 3).join('-'))) {
            if (folderMap[folder]) {
                nameToFolder[c.name] = folderMap[folder];
            }
            break;
        }
    }
});

// Manual mappings for tricky ones
const manualMap = {
    'Advanced Python': 'advanced-python.html',
    'Agile Project Management with Scrum': 'agile-project-management.html',
    'ASP.NET': 'aspnet.html',
    'Business Analysis Fundamentals': 'business-analysis-fundamentals.html',
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

// Output the syllabiMap JS
const finalMap = {};
Object.entries(manualMap).forEach(([name, file]) => {
    if (fs.existsSync(path.join(syllabiDir, file))) {
        finalMap[name] = file;
    }
});

console.log(`Converted: ${converted} syllabi`);
if (errors.length) console.log(`Errors: ${errors.join(', ')}`);
console.log(`\nSyllabiMap entries: ${Object.keys(finalMap).length}`);
console.log('\n// Paste this into index.html:');
console.log('const syllabiMap = ' + JSON.stringify(finalMap, null, 4) + ';');
