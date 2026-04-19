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

// Post-development state column classes (reuse existing pill colors).
var DEPLOYMENT_CLASSES = {
    'Complete': 'complete',
    'Partial': 'in-progress',
    'Not Packaged': 'scoping',
    'Not Deployed': 'not-started'
};

var LMS_VALUES = ['Not Uploaded', 'Partial', 'Complete'];
var LMS_CLASSES = {
    'Not Uploaded': 'not-started',
    'Partial': 'in-progress',
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
    'Python Basics': 'python-basics.html',
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

// Gap Analysis map — course name → xlsx filename in Google Drive gap-analysis-reports folder
// Drive folder: https://drive.google.com/drive/folders/1gLgJXYYAey5w51De4KXbCdAQnxUmtUvo
var GAP_ANALYSIS_DRIVE_FOLDER = 'https://drive.google.com/drive/folders/1gLgJXYYAey5w51De4KXbCdAQnxUmtUvo';
var gapAnalysisMap = {
    'Advanced Python': 'advanced-python-gap-analysis.xlsx',
    'Agile Project Management with Scrum': 'agile-project-management-gap-analysis.xlsx',
    'AI Foundations': 'ai-foundations-gap-analysis.xlsx',
    'ASP.NET': 'aspnet-gap-analysis.xlsx',
    'Business Analysis Fundamentals': 'business-analysis-fundamentals-gap-analysis.xlsx',
    'Business and IT Fundamentals': 'business-and-it-fundamentals-gap-analysis.xlsx',
    'C# Data Access': 'csharp-data-access-gap-analysis.xlsx',
    'C# Language Fundamentals': 'csharp-language-fundamentals-gap-analysis.xlsx',
    'C# OOP': 'csharp-oop-gap-analysis.xlsx',
    'C++ Coding Booster Intensive': 'cpp-coding-booster-gap-analysis.xlsx',
    'CI/CD Pipeline Concepts': 'cicd-pipeline-concepts-gap-analysis.xlsx',
    'CompTIA A+': 'comptia-a-plus-gap-analysis.xlsx',
    'CompTIA Network+': 'comptia-network-plus-gap-analysis.xlsx',
    'Compliance and Security Awareness': 'compliance-security-awareness-gap-analysis.xlsx',
    'Data Fundamentals — Data Literacy': 'data-literacy-gap-analysis.xlsx',
    'Data Fundamentals — Data Visualizations and Power BI': 'data-viz-power-bi-gap-analysis.xlsx',
    'Data Fundamentals — Excel for Data Analysts': 'excel-for-data-analysts-gap-analysis.xlsx',
    'Data Fundamentals — SQL for Data': 'sql-for-data-gap-analysis.xlsx',
    'Helpdesk Software Fundamentals': 'helpdesk-software-fundamentals-gap-analysis.xlsx',
    'HTTP Services': 'http-services-gap-analysis.xlsx',
    'Infrastructure as Code Fundamentals': 'infrastructure-as-code-gap-analysis.xlsx',
    'Instructor Onboarding': 'instructor-onboarding-gap-analysis.xlsx',
    'Introduction to AWS Cloud Platform': 'intro-to-aws-gap-analysis.xlsx',
    'Introduction to Cloud Technology': 'intro-to-cloud-technology-gap-analysis.xlsx',
    'Introduction to GitHub': 'intro-to-github-gap-analysis.xlsx',
    'Introduction to HTML & CSS': 'intro-to-html-css-gap-analysis.xlsx',
    'Introduction to Microsoft Teams': 'intro-to-microsoft-teams-gap-analysis.xlsx',
    'IT Fundamentals': 'it-fundamentals-gap-analysis.xlsx',
    'ITIL Foundations': 'itil-foundations-gap-analysis.xlsx',
    'ITIL Specialist 4': 'itil-specialist-gap-analysis.xlsx',
    'Java Coding Booster Intensive': 'java-coding-booster-gap-analysis.xlsx',
    'Java Language Fundamentals': 'java-language-fundamentals-gap-analysis.xlsx',
    'JavaScript': 'javascript-gap-analysis.xlsx',
    'JavaScript Coding Booster Intensive': 'javascript-coding-booster-gap-analysis.xlsx',
    'JavaScript React for C#': 'javascript-react-for-csharp-gap-analysis.xlsx',
    'Layers and File I/O for C#': 'layers-and-file-io-csharp-gap-analysis.xlsx',
    'LINQ and Dependency Injection': 'linq-and-dependency-injection-gap-analysis.xlsx',
    'Linux Foundations': 'linux-foundations-gap-analysis.xlsx',
    'macOS Administration Fundamentals': 'macos-administration-gap-analysis.xlsx',
    'Non-Relational Data': 'non-relational-data-gap-analysis.xlsx',
    'Pandas': 'pandas-gap-analysis.xlsx',
    'Productivity Tools for Technical Reporting': 'productivity-tools-reporting-gap-analysis.xlsx',
    'Professional Communication': 'professional-communication-gap-analysis.xlsx',
    'Python Basics': 'python-basics-gap-analysis.xlsx',
    'Python Coding Booster Intensive': 'python-coding-booster-gap-analysis.xlsx',
    'Python for Infrastructure Automation': 'python-infrastructure-automation-gap-analysis.xlsx',
    'SQL Fundamentals for Operations': 'sql-fundamentals-operations-gap-analysis.xlsx',
    'Technical Documentation': 'technical-documentation-gap-analysis.xlsx',
    'Web Development with JavaScript and React': 'web-dev-javascript-react-gap-analysis.xlsx'
};
