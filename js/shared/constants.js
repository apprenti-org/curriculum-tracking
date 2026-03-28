/**
 * Shared constants — used by both dashboard and status pages
 * Depends on: nothing (load first among shared files)
 */

// Status enum values and their CSS class mappings
var STATUSES = ['Not Started', 'Scoping', 'In Progress', 'Needs Review', 'In Review', 'Complete'];
var STATUS_CLASSES = {
    'Not Started': 'not-started',
    'Scoping': 'scoping',
    'In Progress': 'in-progress',
    'Needs Review': 'needs-review',
    'In Review': 'in-review',
    'Complete': 'complete'
};

// Syllabi map — course name → HTML filename in syllabi/
// Add entries here as syllabi are rendered to HTML
var syllabiMap = {
    'Advanced Python': 'advanced-python.html',
    'Agile Project Management with Scrum': 'agile-project-management.html',
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
