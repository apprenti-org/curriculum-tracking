# Design Document: Data Model

**Status:** Current Issues Identified
**Priority:** High (Foundation for all other improvements)
**Complexity:** Medium
**Estimated Effort:** 2-3 weeks for full migration

---

## Current Problems

### 1. No Schema Validation
- No defined structure for course data
- Invalid values are silently accepted
- Status field accepts any string (should be enum)
- Hours field can be null (ambiguous meaning)

### 2. Inconsistent Reference Types
```json
// Problem: Same field, different types
"syllabus": "Syllabus: Advanced Python",      // String literal
"syllabus": "https://docs.google.com/...",    // URL
"syllabus": null,                              // Missing

"outline": "Course Outline: Name",             // String
"outline": true,                               // Boolean
"outline": null                                // Missing
```

### 3. Name-Based Identifiers
- Courses identified by name string
- If name changes, all references break
- No stable course ID
- Name duplication across files (courses.json, manifest.json, HTML)

### 4. Denormalized Course Membership
```json
// Course references are only in curricula
"curricula": [
  {
    "name": "Software Development Java",
    "courses": ["Java Language Fundamentals", "JavaScript", ...]
  }
]

// No way to find which curricula contain a course without iterating
```

---

## Proposed Solution: Improved Data Model

### 1. Add Stable Course IDs
```json
{
  "id": "databases-in-java",           // Stable identifier (slug)
  "name": "Databases in Java",         // Display name (can change)
  "slug": "databases-in-java",         // Explicit slug reference
  "hours": 40,
  "status": {
    "design": "Complete",
    "development": "Not Started"
  }
}
```

**Why:** If "Databases in Java" is renamed to "Database Fundamentals with Java," all references (outlines, syllabi, curricula) still work via ID.

### 2. Standardize Reference Types
```json
{
  "id": "databases-in-java",
  "name": "Databases in Java",

  // Unified reference structure
  "references": {
    "syllabus": {
      "type": "local-html",              // "local-html" | "google-doc" | "none"
      "filename": "databases-in-java.html"
    },
    "outline": {
      "type": "loaded",                  // "loaded" | "pending" | "none"
      "filename": "databases-in-java.json"
    },
    "driveFolder": "https://drive.google.com/..."
  }
}
```

### 3. Enums for Status Values
```json
{
  "status": {
    "design": "Complete",        // enum: ["Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"]
    "development": "Not Started" // enum: ["Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"]
  }
}
```

### 4. Required vs Optional Fields
```json
{
  "required": ["id", "name", "hours", "status"],
  "optional": ["references", "note", "description"]
}
```

---

## JSON Schema Definition

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://rti.academy/schemas/curriculum.json",

  "type": "object",
  "required": ["version", "courses", "curricula"],

  "properties": {
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version of data format"
    },

    "courses": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/course"
      }
    },

    "curricula": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/curriculum"
      }
    }
  },

  "definitions": {
    "course": {
      "type": "object",
      "required": ["id", "name", "hours", "status"],
      "additionalProperties": false,

      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9-]+$",
          "description": "Stable course identifier (kebab-case)"
        },

        "name": {
          "type": "string",
          "minLength": 1,
          "description": "Display name"
        },

        "hours": {
          "type": "integer",
          "minimum": 0,
          "description": "Total course hours"
        },

        "status": {
          "type": "object",
          "required": ["design", "development"],
          "properties": {
            "design": {
              "enum": ["Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"]
            },
            "development": {
              "enum": ["Not Started", "Scoping", "In Progress", "Needs Review", "In Review", "Complete"]
            }
          }
        },

        "references": {
          "type": "object",
          "properties": {
            "syllabus": {
              "$ref": "#/definitions/reference"
            },
            "outline": {
              "$ref": "#/definitions/reference"
            },
            "driveFolder": {
              "type": "string",
              "format": "uri"
            }
          }
        },

        "note": {
          "type": "string"
        },

        "description": {
          "type": "string"
        }
      }
    },

    "reference": {
      "type": "object",
      "required": ["type"],
      "properties": {
        "type": {
          "enum": ["local-html", "google-doc", "none", "loaded", "pending"]
        },
        "filename": {
          "type": "string"
        },
        "url": {
          "type": "string",
          "format": "uri"
        }
      }
    },

    "curriculum": {
      "type": "object",
      "required": ["id", "name"],
      "properties": {
        "id": {
          "type": "string",
          "pattern": "^[a-z0-9-]+$"
        },
        "name": {
          "type": "string"
        },
        "description": {
          "type": "string"
        },
        "groups": {
          "type": "array",
          "items": {
            "$ref": "#/definitions/group"
          }
        },
        "courses": {
          "type": "array",
          "items": {
            "type": "string",
            "description": "Course ID"
          }
        }
      }
    },

    "group": {
      "type": "object",
      "required": ["name"],
      "properties": {
        "name": {
          "type": "string"
        },
        "courses": {
          "type": "array",
          "items": {
            "type": "string",
            "description": "Course ID"
          }
        }
      }
    }
  }
}
```

---

## Migration Path

### Phase 1: Add IDs (Non-Breaking)
```json
// Add ID field while keeping name as secondary key
{
  "id": "databases-in-java",
  "name": "Databases in Java",
  // ... rest of course data
}
```
- Dashboard continues to work
- Outlines/manifest.json continue to reference by name
- Can gradually migrate over time

### Phase 2: Update References
```json
// Update curricula to reference by ID
"curricula": [
  {
    "id": "software-development-java",
    "name": "Software Development Java",
    "courses": [
      "java-language-fundamentals",    // Changed from name string to ID
      "javascript",
      "web-dev-javascript"
    ]
  }
]
```

### Phase 3: Standardize References
```json
// Unify syllabus/outline formats
"references": {
  "syllabus": { "type": "local-html", "filename": "..." },
  "outline": { "type": "loaded", "filename": "..." }
}
```

---

## Benefits

✅ **Schema validation** — Catches invalid data at load time
✅ **Stable IDs** — Renaming courses won't break references
✅ **Clear types** — No more "is it a string or boolean?"
✅ **Scalability** — Works well with hundreds of courses
✅ **Future-proof** — Easier to add new fields/metadata

---

## Implementation Checklist

- [ ] Define and publish JSON schema
- [ ] Add schema validation to build.js
- [ ] Add IDs to all courses in courses.json
- [ ] Update curricula to reference by ID
- [ ] Update outlines/manifest.json to use IDs
- [ ] Update dashboard to reference by ID
- [ ] Update generation scripts to use IDs
- [ ] Update README documentation
- [ ] Write migration guide for future data changes
