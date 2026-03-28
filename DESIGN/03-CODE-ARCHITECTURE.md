# Design Document: Code Architecture & Frontend Modularization

**Status:** Monolithic HTML/JS
**Priority:** High (Maintainability)
**Complexity:** High
**Estimated Effort:** 3-4 weeks

---

## Current Problems

### 1. Single 900+ Line HTML File
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* 300+ lines of CSS embedded */
  </style>
</head>
<body>
  <!-- HTML structure -->

  <script>
    // 1000+ lines of JavaScript
    // - Authentication
    // - Theme management
    // - Dashboard logic
    // - Course selection
    // - Detail panel rendering
    // - Event handling
  </script>
</body>
</html>
```

**Issues:**
- Hard to find code
- No separation of concerns
- All data loading at startup
- No component reuse (index.html vs status.html duplicate code)
- Hard to test
- Hard to refactor
- CSS tightly coupled to markup

### 2. String-Based HTML Generation
```javascript
html += `<div class="course-card">
  <div class="course-header">
    <h2>${courseName}</h2>
    <div class="detail-meta">
      ${course.hours ? `<span>...${course.hours}...</span>` : ''}
      ...
    </div>
  </div>
  ...
</div>`;
```

**Issues:**
- Hard to read
- No syntax highlighting
- Easy to break with quotes/escaping
- No way to test components in isolation
- Duplicated across files

### 3. Global Variable Pollution
```javascript
// Global variables
const courseData = [...];
const curriculaData = [...];
const courseOutlines = {...};
const courseStatusMap = {...};

// Any code can modify these
courseData.push({...});  // Silent data corruption
```

### 4. No Lazy Loading
```javascript
// All outlines loaded at startup, even if user never views them
const courseOutlines = {
  'Advanced Python': {...1000 lines...},
  'Agile Project Management': {...1000 lines...},
  // ... 50+ more courses
};
```

---

## Proposed Solution: Modular ES6 Architecture

### 1. Project Structure

```
src/
├── index.html                        # Main page
├── status.html                       # Status page
├── js/
│  ├── main.js                       # Entry point
│  ├── status-main.js                # Status page entry
│  ├── app/
│  │  ├── Dashboard.js               # Main dashboard component
│  │  ├── StatusPage.js              # Status page component
│  │  └── ThemeManager.js            # Theme handling
│  ├── components/
│  │  ├── CourseCard.js              # Reusable course card
│  │  ├── CourseDetail.js            # Course detail view
│  │  ├── CurriculumNav.js           # Left navigation
│  │  ├── StatusBadge.js             # Status indicator
│  │  └── OutlineView.js             # Course outline display
│  ├── data/
│  │  ├── DataStore.js               # Central data management
│  │  ├── loader.js                  # Load courses.json
│  │  └── outlinesLoader.js          # Lazy load outline JSONs
│  ├── utils/
│  │  ├── formatters.js              # Format hours, status, etc.
│  │  ├── validators.js              # Data validation
│  │  └── dom.js                     # DOM helpers
│  └── auth/
│     └── PasswordAuth.js            # Authentication
├── css/
│  ├── variables.css                 # CSS custom properties
│  ├── base.css                      # Base styles, reset
│  ├── layout.css                    # Grid, flex layouts
│  ├── components.css                # Component styles
│  ├── theme.css                     # Light/dark theme
│  └── responsive.css                # Mobile styles
├── templates/
│  ├── courseCard.html               # Handlebars/template
│  ├── outlineView.html
│  └── ...
└── assets/
   └── (icons, fonts, images)
```

### 2. Entry Point: main.js

```javascript
// src/js/main.js
import { Dashboard } from './app/Dashboard.js';
import { DataStore } from './data/DataStore.js';
import { loadCourses } from './data/loader.js';
import { ThemeManager } from './app/ThemeManager.js';
import { PasswordAuth } from './auth/PasswordAuth.js';

async function main() {
  try {
    // 1. Handle authentication
    const auth = new PasswordAuth('46370cc0ad1ce253322c468038a362be0895cedb');
    if (!await auth.authenticate()) {
      return; // User not authenticated
    }

    // 2. Initialize theme
    const theme = new ThemeManager();
    theme.init();

    // 3. Load data
    const courses = await loadCourses('data/courses.json');

    // 4. Initialize data store
    const dataStore = new DataStore();
    dataStore.loadCourses(courses);

    // 5. Create and render dashboard
    const dashboard = new Dashboard(dataStore);
    await dashboard.render('#app');

  } catch (error) {
    console.error('Failed to initialize dashboard:', error);
    showErrorScreen(error);
  }
}

// Handle DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
```

### 3. Data Store Component

```javascript
// src/js/data/DataStore.js
export class DataStore {
  constructor() {
    this.courses = new Map();
    this.curricula = new Map();
    this.outlines = new Map();
    this.listeners = new Set();
  }

  loadCourses(courseData) {
    courseData.forEach(c => {
      this.courses.set(c.id, c);
    });
    this.notifyListeners('courses-loaded');
  }

  loadCurricula(curriculaData) {
    curriculaData.forEach(c => {
      this.curricula.set(c.id, c);
    });
    this.notifyListeners('curricula-loaded');
  }

  getCourse(id) {
    return this.courses.get(id);
  }

  getAllCourses() {
    return Array.from(this.courses.values());
  }

  getCurriculum(id) {
    return this.curricula.get(id);
  }

  async getOutline(courseId) {
    // Lazy load outline
    if (!this.outlines.has(courseId)) {
      const outline = await this.loadOutline(courseId);
      this.outlines.set(courseId, outline);
      this.notifyListeners('outline-loaded', { courseId });
    }
    return this.outlines.get(courseId);
  }

  async loadOutline(courseId) {
    const response = await fetch(`data/outlines/${courseId}.json`);
    if (!response.ok) {
      throw new Error(`Failed to load outline: ${courseId}`);
    }
    return response.json();
  }

  // Observer pattern for reactive updates
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }
}
```

### 4. Reusable Components

```javascript
// src/js/components/CourseCard.js
export class CourseCard {
  constructor(course, outline = null) {
    this.course = course;
    this.outline = outline;
  }

  render() {
    const hasOutline = !!this.outline;
    const statusIcon = this.getStatusIcon();

    return `
      <div class="course-card" data-course-id="${this.course.id}">
        <div class="course-card__header">
          <span class="course-card__status-icon ${statusIcon.class}">${statusIcon.icon}</span>
          <h3 class="course-card__title">${this.course.name}</h3>
        </div>
        <div class="course-card__meta">
          ${this.course.hours ? `<span class="meta-item"><i class="icon-clock"></i> ${this.course.hours}h</span>` : ''}
          ${hasOutline ? `<span class="meta-item"><i class="icon-check"></i> Outline</span>` : ''}
        </div>
      </div>
    `;
  }

  getStatusIcon() {
    const design = this.course.status?.design;
    if (design === 'Complete') {
      return { icon: '✓', class: 'status-complete' };
    } else if (design === 'In Progress') {
      return { icon: '◐', class: 'status-in-progress' };
    }
    return { icon: '○', class: 'status-not-started' };
  }

  // Can be tested independently
  static create(course, outline) {
    return new CourseCard(course, outline);
  }
}
```

```javascript
// src/js/components/OutlineView.js
export class OutlineView {
  constructor(outline) {
    this.outline = outline;
  }

  render() {
    if (!this.outline) {
      return `<div class="outline-empty">No outline loaded</div>`;
    }

    return `
      <div class="outline-view">
        <div class="outline-header">
          <h3>${this.outline.course}</h3>
          <span class="outline-meta">${this.outline.totalModules} modules • ${this.outline.totalLessons} lessons</span>
        </div>
        <div class="modules">
          ${this.outline.modules.map((m, i) => this.renderModule(m, i)).join('')}
        </div>
      </div>
    `;
  }

  renderModule(module, index) {
    return `
      <div class="module" data-module-index="${index}">
        <div class="module__header">
          <i class="icon-chevron"></i>
          <span class="module__title">Module ${index + 1}: ${module.name}</span>
          <span class="module__meta">${module.hours}h</span>
        </div>
        <div class="module__lessons">
          ${module.lessons.map(l => this.renderLesson(l)).join('')}
        </div>
      </div>
    `;
  }

  renderLesson(lesson) {
    return `
      <div class="lesson">
        <span class="lesson__title">${lesson.title}</span>
        ${lesson.hours ? `<span class="lesson__hours">${lesson.hours}h</span>` : ''}
      </div>
    `;
  }
}
```

### 5. Minimal HTML

```html
<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Curriculum Dashboard</title>
  <link rel="stylesheet" href="css/main.css">
</head>
<body>
  <div id="auth-container"></div>
  <div id="app"></div>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

### 6. Separate CSS Files

```css
/* src/css/variables.css */
:root[data-theme="dark"] {
  --bg: #111117;
  --surface: #1A1B23;
  --text-primary: #F0F0EC;
  /* ... */
}

/* src/css/base.css */
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui; ... }

/* src/css/components.css */
.course-card { ... }
.course-card__header { ... }
.outline-view { ... }

/* src/css/responsive.css */
@media (max-width: 768px) { ... }
```

```javascript
// src/css/main.css
@import 'variables.css';
@import 'base.css';
@import 'layout.css';
@import 'components.css';
@import 'theme.css';
@import 'responsive.css';
```

---

## Testing

With this modular structure, components can be tested independently:

```javascript
// test/CourseCard.test.js
import { CourseCard } from '../src/js/components/CourseCard.js';

describe('CourseCard', () => {
  it('should render course name', () => {
    const course = { id: 'test', name: 'Test Course', hours: 40, status: { design: 'Complete' } };
    const card = new CourseCard(course);
    const html = card.render();
    expect(html).toContain('Test Course');
  });

  it('should show status icon', () => {
    const course = { id: 'test', name: 'Test', hours: 40, status: { design: 'Complete' } };
    const card = new CourseCard(course);
    const icon = card.getStatusIcon();
    expect(icon.class).toBe('status-complete');
  });
});
```

---

## Migration Path

### Phase 1: Extract CSS
1. Move `<style>` to `src/css/main.css`
2. Update `<link rel="stylesheet">`
3. Keep everything else the same

### Phase 2: Create Data Module
1. Create DataStore.js
2. Load courses into DataStore instead of globals
3. Update dashboard code to use DataStore
4. Add subscribe() for reactive updates

### Phase 3: Create Components
1. Extract CourseCard rendering to component
2. Extract CurriculumNav rendering to component
3. Gradually replace string concatenation

### Phase 4: Module System
1. Convert to ES6 modules
2. Add module bundler (Webpack/Vite)
3. Split entry points (main.js, status-main.js)

---

## Benefits

✅ **Maintainable** — Code is organized, easy to find
✅ **Testable** — Components can be tested independently
✅ **Reusable** — Components work in multiple pages
✅ **Scalable** — Easy to add new features
✅ **Performant** — Lazy load outlines, tree-shake unused code
✅ **Developer experience** — Syntax highlighting, IDE support, debugging

---

## Implementation Checklist

- [ ] Create project structure
- [ ] Extract CSS to separate files
- [ ] Create DataStore module
- [ ] Create loader functions
- [ ] Implement CourseCard component
- [ ] Implement OutlineView component
- [ ] Implement CurriculumNav component
- [ ] Create main.js entry point
- [ ] Update HTML to use modules
- [ ] Set up module bundler (optional but recommended)
- [ ] Add unit tests
- [ ] Update README with new structure
