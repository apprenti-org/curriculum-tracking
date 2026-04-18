#!/usr/bin/env python3
"""
Course Overview Generator

Generates course-overview.json with gap analysis data, source asset counts,
and outline stats for every course. Used by the tracking dashboard status page
and as input for the knowledge base generator.

Usage:
  python3 generate-course-overview.py --base /path/to/workspace
  python3 generate-course-overview.py  # auto-detects from script location
"""

import os, json, re, sys, argparse
from pathlib import Path


def resolve_paths(base_path):
    """Resolve all workspace paths from a base directory."""
    return {
        'base': base_path,
        'courses_working': os.path.join(base_path, '_COURSES Phase 1 - WORKING'),
        'courses_source': os.path.join(base_path, '_COURSES'),
        'courses_json': os.path.join(base_path, '_COURSES Phase 1 - WORKING', 'tracking', 'repo', 'courses.json'),
        'courses_dir': os.path.join(base_path, '_COURSES Phase 1 - WORKING', 'courses'),
        'output': os.path.join(base_path, '_COURSES Phase 1 - WORKING', 'tracking', 'repo', 'course-overview.json'),
    }


def auto_detect_base():
    """Auto-detect workspace base from script location."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    candidate = os.path.normpath(os.path.join(script_dir, '..', '..', '..', '..'))
    if os.path.isdir(os.path.join(candidate, '_COURSES Phase 1 - WORKING')):
        return candidate
    candidate = os.path.normpath(os.path.join(script_dir, '..', '..', '..'))
    if os.path.isdir(os.path.join(candidate, '_COURSES Phase 1 - WORKING')):
        return candidate
    return None

def is_doc(f):
    return f.endswith('.gdoc') or f.endswith('.docx') or f.endswith('.doc') or f.endswith('.md') or f.endswith('.pdf')

def is_slides(f):
    return f.endswith('.pptx') or f.endswith('.gslides')

def is_quiz(f):
    fl = f.lower()
    return ('quiz' in fl or fl.startswith('knowledge-check') or fl.startswith('knowledge check')) and (is_doc(f) or f.endswith('.gsheet') or f.endswith('.xlsx'))

def normalize_name(text):
    t = text.lower().replace('&', 'and').replace('+', 'plus').replace(':', '')
    t = re.sub(r'(\w)\.(\w)', r'\1\2', t)
    return t

def dedup_slides(files):
    pptx_bases = set()
    for f in files:
        if f.endswith('.pptx'):
            pptx_bases.add(os.path.splitext(f)[0].lower())
    deduped = []
    for f in files:
        if f.endswith('.gslides'):
            base = os.path.splitext(f)[0].lower()
            if base in pptx_bases:
                continue
        deduped.append(f)
    return deduped

def find_source_folder(course_name, courses_source):
    if not os.path.isdir(courses_source):
        return None
    try:
        folders = os.listdir(courses_source)
    except:
        return None

    name_norm = normalize_name(course_name)
    name_words = set(re.findall(r'\w+', name_norm))

    best_match = None
    best_score = 0

    for folder in folders:
        full_path = os.path.join(courses_source, folder)
        if not os.path.isdir(full_path):
            continue

        folder_norm = normalize_name(folder)
        folder_words = set(re.findall(r'\w+', folder_norm))
        folder_words.discard('course')
        folder_words.discard('curriculum')

        if not folder_words or not name_words:
            continue

        overlap = len(name_words & folder_words)

        if overlap == 0:
            name_joined = ''.join(name_words)
            for fw in folder_words:
                if fw == name_joined:
                    overlap = len(name_words)
                    break
            if overlap == 0:
                folder_joined = ''.join(folder_words)
                if folder_joined == name_joined:
                    overlap = len(folder_words)

        min_score = overlap / min(len(name_words), len(folder_words))
        max_score = overlap / max(len(name_words), len(folder_words))

        if overlap < 2 and max_score < 1.0:
            continue

        score = (min_score * 0.6 + max_score * 0.4)

        if score > best_score and score >= 0.5:
            best_score = score
            best_match = (full_path, folder)

    return best_match

def count_assets(files):
    counts = {'lessons': 0, 'slides': 0, 'quizzes': 0, 'activities': 0,
              'demos': 0, 'case_studies': 0, 'instructor_guides': 0,
              'mod_intro': 0, 'mod_recap': 0}
    for f in files:
        fl = f.lower()
        if is_quiz(f):
            counts['quizzes'] += 1
        elif 'demo' in fl and (is_doc(f) or is_slides(f)):
            counts['demos'] += 1
        elif 'case' in fl and 'study' in fl and is_doc(f):
            counts['case_studies'] += 1
        elif fl.startswith('instructor') and is_doc(f):
            counts['instructor_guides'] += 1
        elif ('intro' in fl and 'module' in fl) or fl.startswith('module introduction') or fl.startswith('module intro'):
            counts['mod_intro'] += 1
        elif ('recap' in fl or 'review' in fl or 'summary' in fl) and 'module' in fl:
            counts['mod_recap'] += 1
        elif 'scorm' in fl or 'interactive' in fl or f.endswith('.zip'):
            counts['slides'] += 1
        elif ('exercise' in fl or 'activity' in fl or 'lab' in fl or 'practice' in fl or 'hands' in fl or 'code-along' in fl or 'codealong' in fl) and (is_doc(f) or f.endswith('.pdf')):
            counts['activities'] += 1
        elif re.match(r'\d{2}e-', fl) and is_doc(f):
            counts['activities'] += 1
        elif (fl.startswith('capstone') or fl.startswith('summative')) and is_doc(f):
            counts['lessons'] += 1
        elif re.match(r'm\d+-', fl) and ('assessment' in fl or 'rubric' in fl) and is_doc(f):
            counts['lessons'] += 1
        elif re.match(r'\d{2}-[a-z]', fl) and is_doc(f) and not re.match(r'\d{2}e-', fl):
            counts['lessons'] += 1
        elif re.match(r'm\d+-l\d+', fl) and is_slides(f):
            counts['slides'] += 1
        elif is_slides(f) and not fl.startswith('for '):
            counts['slides'] += 1
        elif 'lesson' in fl and is_doc(f):
            counts['lessons'] += 1
    return counts

def count_phase1_assets(files):
    """Classify Phase 1 deploy-content files into the legacy asset schema.

    Phase 1 produces lesson/instructor-guide/quiz/exercise PDFs and SCORM zips.
    Categories not produced in Phase 1 (slides, demos, case_studies, mod_intro,
    mod_recap) stay at 0.

    Pattern priority (first match wins):
      1. scorm-*.zip                             -> interactives
      2. *-quiz-answer-key.pdf                   -> skipped (paired with quiz)
      3. *-quiz.pdf                              -> quizzes
      4. *-instructor-guide-exercise-*.pdf       -> skipped (instructor copy)
      5. *-exercise-*.pdf                        -> activities
      6. *-instructor-guide.pdf                  -> instructor_guides
      7. lesson-NN-*.pdf (any other)             -> lessons
    """
    counts = {'lessons': 0, 'slides': 0, 'quizzes': 0, 'activities': 0,
              'demos': 0, 'case_studies': 0, 'instructor_guides': 0,
              'mod_intro': 0, 'mod_recap': 0}
    for f in files:
        fl = f.lower()
        if fl.startswith('scorm-') and fl.endswith('.zip'):
            counts['slides'] += 1
        elif fl.endswith('-quiz-answer-key.pdf'):
            continue  # paired with the quiz pdf
        elif fl.endswith('-quiz.pdf'):
            counts['quizzes'] += 1
        elif '-instructor-guide-exercise-' in fl and fl.endswith('.pdf'):
            continue  # instructor copy of an activity
        elif '-exercise-' in fl and fl.endswith('.pdf'):
            counts['activities'] += 1
        elif fl.endswith('-instructor-guide.pdf'):
            counts['instructor_guides'] += 1
        elif re.match(r'lesson-\d+', fl) and fl.endswith('.pdf'):
            counts['lessons'] += 1
    return counts


def find_phase1_deploy_folder(course_id, paths):
    """Return the Phase 1 deploy/content folder for a course, or None.

    The folder counts as present only if it exists AND contains at least one
    `module-*` subdirectory (otherwise there's nothing to scan).
    """
    if not course_id:
        return None
    deploy_path = os.path.join(paths['courses_dir'], course_id, 'deploy', 'content')
    if not os.path.isdir(deploy_path):
        return None
    try:
        entries = os.listdir(deploy_path)
    except OSError:
        return None
    has_module = any(
        e.lower().startswith('module-') and os.path.isdir(os.path.join(deploy_path, e))
        for e in entries
    )
    return deploy_path if has_module else None


def scan_phase1_deploy_folder(deploy_path):
    """Scan a Phase 1 deploy/content folder and return a source_data dict.

    Shape matches scan_source_folder() output so the main loop can consume
    it uniformly. For each `module-NN-*/lesson-NN-*/` folder, all files are
    flattened into the module's `files` list (compute_coverage expects this).
    """
    result = {
        'module_folders': {},
        'root_files': [],
        'total_lessons': 0, 'total_slides': 0, 'total_quizzes': 0,
        'total_activities': 0, 'total_demos': 0, 'total_case_studies': 0,
        'total_instructor_guides': 0,
        'total_mod_intro': 0, 'total_mod_recap': 0,
    }

    if not deploy_path or not os.path.isdir(deploy_path):
        return result

    try:
        entries = sorted(os.listdir(deploy_path))
    except OSError:
        return result

    for entry in entries:
        entry_path = os.path.join(deploy_path, entry)
        if not os.path.isdir(entry_path):
            continue
        m = re.match(r'module-(\d+)', entry, re.IGNORECASE)
        if not m:
            continue
        mod_num = int(m.group(1))

        # Flatten files from each lesson-NN-*/ subfolder
        all_files = []
        try:
            lesson_entries = os.listdir(entry_path)
        except OSError:
            lesson_entries = []
        for lesson_entry in lesson_entries:
            lesson_path = os.path.join(entry_path, lesson_entry)
            if os.path.isdir(lesson_path) and re.match(r'lesson-\d+', lesson_entry, re.IGNORECASE):
                try:
                    all_files.extend(os.listdir(lesson_path))
                except OSError:
                    pass

        result['module_folders'][mod_num] = {
            'path': entry_path,
            'name': entry,
            'files': all_files,
        }

    # Compute totals per module using the Phase 1 classifier
    for mod_num, mod_data in result['module_folders'].items():
        counts = count_phase1_assets(mod_data['files'])
        for key in counts:
            result[f'total_{key}'] += counts[key]

    return result


def resolve_course_source(course, paths):
    """Return (source_info, source_data) for a course.

    Prefers Phase 1 deploy content; falls back to the legacy _COURSES/ scan.

    source_info is (absolute_path, display_folder_name) or None.
    source_data matches the shape returned by scan_source_folder()/
    scan_phase1_deploy_folder().
    """
    course_id = course.get('id', '')
    name = course.get('name', course_id)

    # Try Phase 1 first
    phase1_path = find_phase1_deploy_folder(course_id, paths)
    if phase1_path:
        display = f"{course_id}/deploy/content"
        source_data = scan_phase1_deploy_folder(phase1_path)
        if source_data['module_folders']:
            return (phase1_path, display), source_data

    # Fall back to legacy _COURSES/ scan
    legacy_info = find_source_folder(name, paths['courses_source'])
    legacy_data = scan_source_folder(legacy_info[0] if legacy_info else None)
    return legacy_info, legacy_data


def scan_source_folder(source_path):
    result = {
        'module_folders': {},
        'root_files': [],
        'total_lessons': 0, 'total_slides': 0, 'total_quizzes': 0,
        'total_activities': 0, 'total_demos': 0, 'total_case_studies': 0,
        'total_instructor_guides': 0,
        'total_mod_intro': 0, 'total_mod_recap': 0,
    }

    if not source_path or not os.path.isdir(source_path):
        return result

    try:
        items = os.listdir(source_path)
    except:
        return result

    scan_dir = source_path
    scan_items = items
    slides_dir = None

    for item in items:
        if 'SOURCE' in item.upper() and os.path.isdir(os.path.join(source_path, item)):
            container_path = os.path.join(source_path, item)
            try:
                container_items = os.listdir(container_path)
                has_numbered = any(re.match(r'\d{2}\.', i) for i in container_items)
                has_modules = any(re.match(r'Module\s+\d+', i, re.IGNORECASE) for i in container_items)
                if has_numbered or has_modules:
                    scan_dir = container_path
                    scan_items = container_items
                    slides_candidate = os.path.join(container_path, '_SLIDES')
                    if os.path.isdir(slides_candidate):
                        slides_dir = slides_candidate
                    break
            except:
                pass

    if not slides_dir:
        for candidate in ['_SLIDES', 'SLIDES']:
            sp = os.path.join(source_path, candidate)
            if os.path.isdir(sp):
                slides_dir = sp
                break

    for item in sorted(scan_items):
        item_path = os.path.join(scan_dir, item)
        if not os.path.isdir(item_path):
            continue

        mod_num = None
        m = re.match(r'Module\s+(\d+)', item, re.IGNORECASE)
        if m:
            mod_num = int(m.group(1))

        if mod_num is None:
            m = re.match(r'(\d{1,2})\.\s*', item)
            if m:
                mod_num = int(m.group(1))

        if mod_num is None:
            item_lower = item.lower()
            capstone_kws = ['capstone', 'summative', 'assessment']
            if any(kw in item_lower for kw in capstone_kws):
                existing_capstones = [k for k in result['module_folders'] if k >= 100]
                mod_num = 100 + len(existing_capstones)

        if mod_num is not None:
            try:
                files = os.listdir(item_path)
            except:
                files = []

            all_files = list(files)
            for sub in files:
                sub_path = os.path.join(item_path, sub)
                if os.path.isdir(sub_path):
                    try:
                        all_files.extend(os.listdir(sub_path))
                    except:
                        pass

            result['module_folders'][mod_num] = {
                'path': item_path,
                'name': item,
                'files': all_files
            }

    # Flat file fallback
    if not result['module_folders']:
        flat_dir = scan_dir
        flat_items = scan_items
        for item in sorted(scan_items):
            item_path = os.path.join(scan_dir, item)
            if not os.path.isdir(item_path):
                continue
            try:
                sub_items = os.listdir(item_path)
            except:
                sub_items = []
            has_numbered_files = any(re.match(r'\d{2}[-.]', si) for si in sub_items)
            if has_numbered_files:
                all_files = []
                for fi in flat_items:
                    fi_path = os.path.join(flat_dir, fi)
                    if os.path.isdir(fi_path):
                        try:
                            all_files.extend(os.listdir(fi_path))
                        except:
                            pass
                    else:
                        all_files.append(fi)
                result['module_folders'][1] = {'path': flat_dir, 'name': os.path.basename(flat_dir), 'files': all_files}
                break

    # Scan separate _SLIDES folder
    if slides_dir:
        try:
            slide_subs = os.listdir(slides_dir)
        except:
            slide_subs = []
        for ss in slide_subs:
            ss_path = os.path.join(slides_dir, ss)
            m = re.match(r'M(\d{2})', ss)
            if m and os.path.isdir(ss_path):
                mod_num = int(m.group(1))
                if mod_num in result['module_folders']:
                    try:
                        slide_files = os.listdir(ss_path)
                        result['module_folders'][mod_num]['files'].extend(slide_files)
                    except:
                        pass

    # Deduplicate slides
    for mod_num, mod_data in result['module_folders'].items():
        mod_data['files'] = dedup_slides(mod_data['files'])

    # Compute totals
    for mod_num, mod_data in result['module_folders'].items():
        counts = count_assets(mod_data['files'])
        for key in counts:
            result[f'total_{key}'] += counts[key]

    return result

def parse_hours(text):
    if not text:
        return 0
    text = text.strip()
    if text.upper() == 'TBD':
        return 0
    m = re.search(r'([\d.]+)\s*(?:h(?:ours?)?)?', text, re.IGNORECASE)
    if m:
        try:
            return float(m.group(1))
        except:
            pass
    return 0

def match_folder_json_ids(folders, json_ids):
    """Pair course-folder names with courses.json ids.

    Deterministic: result depends only on input values, never on set-iteration
    order or PYTHONHASHSEED. Addresses curriculum-tracking#53, where the prior
    set-iteration + first-match approach produced different mappings across
    runs for name families like the Coding Booster courses.

    Scoring (higher = better):
      1000  exact match (folder_id == json_id)
       500  de-hyphenated substring match in either direction
       100 * word_overlap_count  (only counted when overlap >= 2)
         0  otherwise (treated as no match)

    Assignment is greedy by descending score, with alphabetical tiebreakers;
    each folder and each json_id is claimed at most once.

    Returns (folder_to_json, json_to_folder) dicts.
    """
    json_set = set(json_ids)
    candidates = []

    for fid in folders:
        f_words = set(fid.split('-'))
        f_norm = fid.replace('-', '')
        for jid in json_ids:
            if fid == jid:
                score = 1000
            else:
                j_norm = jid.replace('-', '')
                if f_norm in j_norm or j_norm in f_norm:
                    score = 500
                else:
                    j_words = set(jid.split('-'))
                    overlap = len(f_words & j_words)
                    score = 100 * overlap if overlap >= 2 else 0
            if score > 0:
                candidates.append((score, fid, jid))

    # Highest score first; then alphabetical for deterministic tiebreaking.
    candidates.sort(key=lambda c: (-c[0], c[1], c[2]))

    folder_to_json = {}
    json_to_folder = {}
    for _score, fid, jid in candidates:
        if fid in folder_to_json or jid in json_to_folder:
            continue
        folder_to_json[fid] = jid
        json_to_folder[jid] = fid

    return folder_to_json, json_to_folder


def parse_outline(outline_path):
    """Simplified outline parser — returns module/lesson counts."""
    try:
        with open(outline_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except:
        return []

    modules = []
    current_module = None
    global_lesson_num = 0

    mod_patterns = [
        r'^##\s+Module\s+(\d+)\s*:\s*(.+?)\s*\(([^)]+)\)\s*$',
        r'^##\s+Module\s+(\d+)\s*:\s*(.+?)\s*[—–-]\s*([\d.]+\s*hours?)\s*$',
        r'^##\s+Module\s+(\d+)\s*:\s*(.+?)\s*$',
    ]

    lesson_patterns = [
        r'^###\s+Lesson\s+(\d+)\s*:\s*(.+?)\s*\(([^)]+)\)\s*$',
        r'^###\s+Lesson\s+(\d+)\s*:\s*(.+?)\s*$',
    ]

    alt_module_pattern = r'^##\s+(.+?)\s*(?:\(([^)]+)\))?\s*$'

    skip_headers = {'course information', 'course description', 'course learning outcomes',
                    'learning outcomes', 'prerequisites', 'software required',
                    'related course', 'related source', 'course introduction', 'scenario:'}

    lines = content.split('\n')

    for line in lines:
        line = line.rstrip()

        matched_module = False
        for i, pat in enumerate(mod_patterns):
            m = re.match(pat, line)
            if m:
                groups = m.groups()
                mod_num = int(groups[0])
                mod_name = groups[1].strip()
                mod_hours = parse_hours(groups[2]) if len(groups) > 2 else 0
                current_module = {'number': mod_num, 'name': mod_name, 'hours': mod_hours, 'lessons': []}
                modules.append(current_module)
                matched_module = True
                break

        if matched_module:
            continue

        matched_lesson = False
        for pat in lesson_patterns:
            m = re.match(pat, line)
            if m:
                groups = m.groups()
                l_num = int(groups[0])
                l_title = groups[1].strip()
                l_hours = parse_hours(groups[2]) if len(groups) > 2 else 0

                if not current_module:
                    current_module = {'number': 1, 'name': 'Course Content', 'hours': 0, 'lessons': []}
                    modules.append(current_module)

                global_lesson_num += 1
                current_module['lessons'].append({
                    'number': l_num,
                    'global_number': global_lesson_num,
                    'title': l_title,
                    'hours': l_hours,
                })
                matched_lesson = True
                break

        if matched_lesson:
            continue

        if line.startswith('## ') and not line.startswith('### '):
            header_text = line[3:].strip()
            header_lower = header_text.lower()

            is_skip = False
            for skip in skip_headers:
                if header_lower.startswith(skip):
                    is_skip = True
                    break

            if not is_skip and not header_lower.startswith('module'):
                m = re.match(r'(.+?)\s*(?:\(([^)]+)\))?\s*$', header_text)
                if m:
                    name = m.group(1).strip()
                    paren = (m.group(2) or '').strip().lower()
                    hours = parse_hours(m.group(2)) if m.group(2) else 0
                    # Preserve integration markers so capstone handling can skip them
                    if paren in {'integrated', 'embedded', 'baked in', 'woven in'}:
                        name = f"{name} ({paren})"
                    mod_num = len(modules) + 1
                    current_module = {'number': mod_num, 'name': name, 'hours': hours, 'lessons': []}
                    modules.append(current_module)

    # Pass 2: ### headings as lessons if all modules empty
    if modules and all(len(m['lessons']) == 0 for m in modules):
        current_module = None
        global_lesson_num = 0
        for mod in modules:
            mod['lessons'] = []
        mod_idx = -1
        for line in lines:
            line = line.rstrip()
            if line.startswith('## ') and not line.startswith('### '):
                mod_idx += 1
                if mod_idx < len(modules):
                    current_module = modules[mod_idx]
            elif line.startswith('### ') and current_module is not None:
                title = line[4:].strip()
                m = re.match(r'(.+?)\s*\(([^)]+)\)\s*$', title)
                if m:
                    title = m.group(1).strip()
                    hours = parse_hours(m.group(2))
                else:
                    hours = 0
                if title.lower() not in ('lessons', 'activities', 'resources'):
                    global_lesson_num += 1
                    current_module['lessons'].append({
                        'number': global_lesson_num,
                        'global_number': global_lesson_num,
                        'title': title,
                        'hours': hours,
                    })

    # Pass 3: bullet-list under ### Lessons
    if modules and all(len(m['lessons']) == 0 for m in modules):
        current_module = None
        global_lesson_num = 0
        in_lessons_section = False
        mod_idx = -1
        for line in lines:
            line = line.rstrip()
            if line.startswith('## ') and not line.startswith('### '):
                mod_idx += 1
                in_lessons_section = False
                if mod_idx < len(modules):
                    current_module = modules[mod_idx]
            elif line.startswith('### '):
                title = line[4:].strip().lower()
                in_lessons_section = title == 'lessons'
            elif in_lessons_section and line.startswith('- ') and current_module is not None:
                lesson_title = line[2:].strip()
                if lesson_title:
                    global_lesson_num += 1
                    current_module['lessons'].append({
                        'number': global_lesson_num,
                        'global_number': global_lesson_num,
                        'title': lesson_title,
                        'hours': 0,
                    })
            elif not line.startswith(' ') and not line.startswith('-') and line.strip() and in_lessons_section:
                if not line.startswith('#'):
                    in_lessons_section = False

    # Pass 4: bullet-list "- Lesson N:" directly under ## Module
    if modules and all(len(m['lessons']) == 0 for m in modules):
        current_module = None
        global_lesson_num = 0
        mod_idx = -1
        for line in lines:
            line = line.rstrip()
            if line.startswith('## ') and not line.startswith('### '):
                mod_idx += 1
                if mod_idx < len(modules):
                    current_module = modules[mod_idx]
            elif line.startswith('- ') and current_module is not None:
                item = line[2:].strip()
                m = re.match(r'(?:Lesson|Step)\s+(\d+)\s*:\s*(.+)', item)
                if m:
                    l_num = int(m.group(1))
                    l_title = m.group(2).strip()
                    global_lesson_num += 1
                    current_module['lessons'].append({
                        'number': l_num,
                        'global_number': global_lesson_num,
                        'title': l_title,
                        'hours': 0,
                    })

    # Capstone handling
    capstone_keywords = {'capstone', 'summative', 'assessment', 'final assessment', 'final exam'}
    # Markers that indicate the capstone content is baked into existing
    # lessons, not a separate deliverable — skip synthesis in that case.
    integrated_markers = ('(integrated', '(embedded', '(baked', '(woven')
    final_modules = []
    for m in modules:
        if m.get('lessons'):
            final_modules.append(m)
        else:
            name_lower = m['name'].lower()
            is_capstone = any(kw in name_lower for kw in capstone_keywords)
            is_integrated = any(marker in name_lower for marker in integrated_markers)
            if is_capstone and not is_integrated:
                max_global = max((l['global_number'] for mod in final_modules for l in mod['lessons']), default=0)
                m['lessons'] = [{'number': 1, 'global_number': max_global + 1,
                                 'title': m['name'], 'hours': m['hours']}]
                final_modules.append(m)

    return final_modules


def normalize_match_words(words):
    result = set()
    for w in words:
        if w == 'intro':
            result.add('introduction'); result.add('intro')
        elif w == 'introduction':
            result.add('introduction'); result.add('intro')
        else:
            result.add(w)
    return result

def words_match(title_words, file_words):
    tw = normalize_match_words(title_words)
    fw = normalize_match_words(file_words)
    overlap = len(tw & fw)
    if overlap >= min(len(title_words), len(file_words), 2) or \
       (len(title_words) == 1 and title_words <= fw) or \
       (len(file_words) == 1 and file_words <= tw):
        return True
    tw_list = list(title_words)
    for fw_word in file_words:
        for i in range(len(tw_list)):
            for j in range(len(tw_list)):
                if i != j:
                    if tw_list[i] + tw_list[j] == fw_word:
                        compound_overlap = overlap + 2
                        if compound_overlap >= min(len(title_words), len(file_words), 2):
                            return True
    fw_list = list(file_words)
    for tw_word in title_words:
        for i in range(len(fw_list)):
            for j in range(len(fw_list)):
                if i != j:
                    if fw_list[i] + fw_list[j] == tw_word:
                        compound_overlap = overlap + 2
                        if compound_overlap >= min(len(title_words), len(file_words), 2):
                            return True
    return False

def check_lesson_exists(mod_files, lesson_number, position_in_module=None):
    for f in mod_files:
        fl = f.lower()
        if re.match(r'Lesson\s+' + str(lesson_number) + r'\b', f, re.IGNORECASE) and is_doc(f):
            return True
    # Phase 1 naming: lesson-NN-<name>.pdf (excluding instructor guides,
    # quizzes, and exercises which are counted separately)
    for num in set(filter(None, [lesson_number, position_in_module])):
        phase1_prefix = f"lesson-{num:02d}-"
        for f in mod_files:
            fl = f.lower()
            if (fl.startswith(phase1_prefix) and is_doc(f)
                and 'instructor-guide' not in fl
                and 'quiz' not in fl
                and 'exercise' not in fl):
                return True
    for num in set(filter(None, [lesson_number, position_in_module])):
        target_flat = f"{num:02d}-"
        for f in mod_files:
            fl = f.lower()
            if fl.startswith(target_flat) and is_doc(f) and not re.match(r'\d{2}e-', fl):
                return True
    if position_in_module == 1 or lesson_number == 1:
        for f in mod_files:
            fl = f.lower()
            if fl.startswith('00-') and is_doc(f) and not re.match(r'\d{2}e-', fl):
                return True
    return False

def check_lesson_by_name(mod_files, lesson_title):
    title_lower = lesson_title.lower()
    title_words = set(w for w in re.findall(r'\w+', title_lower) if len(w) > 2)
    if not title_words:
        return False

    for f in mod_files:
        fl = f.lower()
        if not is_doc(f):
            continue
        if 'lesson' in fl:
            name_part = re.sub(r'^Lesson\s+\d+\s*[-:]\s*', '', f, flags=re.IGNORECASE)
            name_part = os.path.splitext(name_part)[0]
            file_words = set(w for w in re.findall(r'\w+', name_part.lower()) if len(w) > 2)
            if file_words and words_match(title_words, file_words):
                return True
        elif re.match(r'\d{2}-[a-z]', fl) and not re.match(r'\d{2}e-', fl):
            name_part = re.sub(r'^\d{2}-', '', fl)
            name_part = re.sub(r'\.\w+$', '', name_part)
            file_words = set(w for w in re.findall(r'\w+', name_part) if len(w) > 2)
            if file_words and title_words and words_match(title_words, file_words):
                return True
        elif (fl.startswith('capstone') or fl.startswith('summative')) and is_doc(f):
            if any(kw in title_lower for kw in ['capstone', 'summative', 'assessment']):
                return True
        elif re.match(r'm\d+-', fl) and 'assessment' in fl and is_doc(f):
            if any(kw in title_lower for kw in ['capstone', 'summative', 'assessment']):
                return True

    return False


def compute_coverage(modules, source_data):
    """Compute lesson-level content coverage for a course."""
    total_lessons = sum(len(m['lessons']) for m in modules)
    if total_lessons == 0:
        return 0, total_lessons, 0

    lessons_with_content = 0

    for module in modules:
        mod_source = source_data['module_folders'].get(module['number'])
        if not mod_source:
            mod_name_lower = module['name'].lower()
            capstone_kws = ['capstone', 'summative', 'assessment']
            if any(kw in mod_name_lower for kw in capstone_kws):
                for src_num, src_data in source_data['module_folders'].items():
                    if src_num >= 100:
                        src_name_lower = src_data.get('name', '').lower()
                        if any(kw in src_name_lower for kw in capstone_kws):
                            mod_source = src_data
                            break

        mod_files = mod_source['files'] if mod_source else []
        has_numbered_lessons = any(re.match(r'Lesson\s+\d+', f) for f in mod_files if is_doc(f))

        for lesson_idx, lesson in enumerate(module['lessons']):
            position_in_module = lesson_idx + 1
            if not mod_source:
                has_content = False
            elif has_numbered_lessons:
                has_content = check_lesson_exists(mod_files, lesson['number'], position_in_module)
            else:
                has_content = check_lesson_by_name(mod_files, lesson['title'])

            if has_content:
                lessons_with_content += 1

    coverage_pct = round((lessons_with_content / total_lessons) * 100) if total_lessons > 0 else 0
    return coverage_pct, total_lessons, lessons_with_content


def main():
    parser = argparse.ArgumentParser(description='Generate course-overview.json')
    parser.add_argument('--base', help='Workspace base directory (auto-detected if omitted)')
    args = parser.parse_args()

    base = args.base or auto_detect_base()
    if not base:
        print('Error: Could not detect workspace base directory. Use --base to specify.', file=sys.stderr)
        sys.exit(1)

    paths = resolve_paths(base)

    if not os.path.exists(paths['courses_json']):
        print(f"Error: courses.json not found at {paths['courses_json']}", file=sys.stderr)
        sys.exit(1)

    with open(paths['courses_json'], 'r') as f:
        data = json.load(f)

    courses_dir = paths['courses_dir']
    json_courses = {c['id']: c for c in data.get('courses', []) if c.get('id')}

    folders = set()
    if os.path.isdir(courses_dir):
        for d in os.listdir(courses_dir):
            p = os.path.join(courses_dir, d)
            if os.path.isdir(p) and d not in ('.template', '.scorm-template'):
                folders.add(d)

    folder_to_json, json_to_folder = match_folder_json_ids(
        list(folders), list(json_courses.keys())
    )

    overview = []

    for course in data['courses']:
        cid = course.get('id', '')
        name = course.get('name', cid)
        hours = course.get('hours')

        folder_id = json_to_folder.get(cid, cid)
        outline_path = os.path.join(courses_dir, folder_id, f'course-outline-{folder_id}.md')
        has_outline = os.path.exists(outline_path)

        syllabus_path = os.path.join(courses_dir, folder_id, f'syllabus-{folder_id}.md')
        has_syllabus = os.path.exists(syllabus_path)

        modules = parse_outline(outline_path) if has_outline else []
        total_modules = len(modules)
        total_lessons = sum(len(m['lessons']) for m in modules)

        source_info, source_data = resolve_course_source(course, paths)
        has_source = source_info is not None and bool(source_data['module_folders'])

        if has_outline and modules:
            coverage_pct, _, lessons_with_content = compute_coverage(modules, source_data)
        else:
            coverage_pct = None
            lessons_with_content = 0

        assets = {
            'lessons': source_data['total_lessons'],
            'slides': source_data['total_slides'],
            'quizzes': source_data['total_quizzes'],
            'activities': source_data['total_activities'],
            'demos': source_data['total_demos'],
            'caseStudies': source_data['total_case_studies'],
            'instructorGuides': source_data['total_instructor_guides'],
            'modIntros': source_data['total_mod_intro'],
            'modRecaps': source_data['total_mod_recap'],
        }
        total_assets = sum(assets.values())
        source_modules = len([k for k in source_data['module_folders'] if k < 100])

        entry = {
            'id': cid,
            'name': name,
            'hours': hours,
            'outline': {'exists': has_outline, 'modules': total_modules, 'lessons': total_lessons},
            'syllabus': has_syllabus,
            'source': {'exists': has_source, 'folder': source_info[1] if source_info else None, 'modules': source_modules},
            'coverage': coverage_pct,
            'lessonsWithContent': lessons_with_content,
            'assets': assets,
            'totalAssets': total_assets,
        }

        overview.append(entry)
        status_str = f"coverage={coverage_pct}%" if coverage_pct is not None else "no outline"
        print(f"  {cid}: {total_modules}m/{total_lessons}l, {total_assets} assets, {status_str}")

    output = {
        'generated': __import__('datetime').datetime.now().isoformat(timespec='seconds'),
        'courseCount': len(overview),
        'courses': overview
    }

    with open(paths['output'], 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nGenerated course-overview.json: {len(overview)} courses -> {paths['output']}")


if __name__ == '__main__':
    main()
