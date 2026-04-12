#!/usr/bin/env python3
"""
RTI Academy Curriculum Knowledge Base Generator

Generates a single comprehensive markdown document for use with NotebookLM.
Combines: course catalog with full topic detail, curriculum architecture,
content readiness data, and source asset inventory.

Usage:
  python3 generate-knowledge-base.py --base /path/to/workspace
  python3 generate-knowledge-base.py  # auto-detects from script location
"""

import os, json, re, sys, argparse
from datetime import datetime


def resolve_paths(base_path):
    """Resolve all workspace paths from a base directory."""
    working = os.path.join(base_path, '_COURSES Phase 1 - WORKING')
    repo = os.path.join(working, 'tracking', 'repo')
    return {
        'base': base_path,
        'courses_working': working,
        'courses_json': os.path.join(repo, 'courses.json'),
        'overview_json': os.path.join(repo, 'course-overview.json'),
        'courses_dir': os.path.join(working, 'courses'),
        'output': os.path.join(working, 'SANDBOX', 'rti-curriculum-knowledge-base.md'),
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

def load_data(paths):
    with open(paths['courses_json']) as f:
        courses_data = json.load(f)
    with open(paths['overview_json']) as f:
        overview_data = json.load(f)

    # Build lookups — by id AND by name for legacy refs
    overview_map = {c['id']: c for c in overview_data['courses']}
    course_map = {}
    for c in courses_data['courses']:
        course_map[c['id']] = c
        course_map[c['name']] = c

    return courses_data, overview_data, overview_map, course_map


def build_membership_map(courses_data):
    """Build course_id → list of {curriculum, group} memberships."""
    mem = {}
    for cur in courses_data.get('curricula', []):
        cur_name = cur['name']
        if cur.get('groups'):
            for g in cur['groups']:
                for ref in g.get('courses', []):
                    cid = ref if isinstance(ref, str) else (ref.get('id') or ref.get('name', ''))
                    if cid not in mem:
                        mem[cid] = []
                    mem[cid].append({'curriculum': cur_name, 'group': g['name']})
        if cur.get('courses'):
            for ref in cur['courses']:
                cid = ref if isinstance(ref, str) else (ref.get('id') or ref.get('name', ''))
                if cid not in mem:
                    mem[cid] = []
                mem[cid].append({'curriculum': cur_name, 'group': None})
    return mem


def read_outline_raw(course_id, courses_dir):
    """Read the raw outline markdown for a course, return content after the header block."""
    # Try direct folder match first, then scan for folder
    outline_path = os.path.join(courses_dir, course_id, f'course-outline-{course_id}.md')
    if not os.path.exists(outline_path):
        # Try scanning folders
        for d in os.listdir(courses_dir):
            candidate = os.path.join(courses_dir, d, f'course-outline-{d}.md')
            if os.path.exists(candidate):
                # Check if this folder maps to our course_id
                if d.replace('-', '') in course_id.replace('-', '') or course_id.replace('-', '') in d.replace('-', ''):
                    outline_path = candidate
                    break
    if not os.path.exists(outline_path):
        return None
    with open(outline_path, 'r', encoding='utf-8') as f:
        return f.read()


def extract_outline_body(content):
    """Extract the module/lesson content from an outline, skipping the metadata header."""
    lines = content.split('\n')
    body_lines = []
    in_body = False

    for line in lines:
        # Start capturing at first ## Module or ## heading that isn't metadata
        if not in_body:
            if line.startswith('## '):
                header_text = line[3:].strip().lower()
                skip_headers = {'course information', 'course description', 'course learning outcomes',
                               'learning outcomes', 'prerequisites', 'software required'}
                if not any(header_text.startswith(s) for s in skip_headers):
                    in_body = True
                    body_lines.append(line)
            elif line.startswith('---') and body_lines:
                # horizontal rule before modules — skip it
                continue
        else:
            body_lines.append(line)

    return '\n'.join(body_lines).strip()


def format_hours(hours):
    if not hours:
        return "TBD"
    if isinstance(hours, (int, float)):
        return f"{int(hours)}h" if hours == int(hours) else f"{hours}h"
    return str(hours)


def format_memberships(memberships):
    if not memberships:
        return "Not assigned to any curriculum"
    parts = []
    for m in memberships:
        if m.get('group'):
            parts.append(f"{m['curriculum']} → {m['group']}")
        else:
            parts.append(m['curriculum'])
    return ', '.join(sorted(set(parts)))


def format_asset_summary(ov):
    """Format a concise asset summary from overview data."""
    if not ov or not ov.get('assets'):
        return "No source content inventory available."

    a = ov['assets']
    total = ov.get('totalAssets', 0)
    if total == 0:
        return "No source content assets found."

    parts = []
    if a.get('lessons'): parts.append(f"{a['lessons']} lesson docs")
    if a.get('slides'): parts.append(f"{a['slides']} slide decks")
    if a.get('quizzes'): parts.append(f"{a['quizzes']} quizzes")
    if a.get('activities'): parts.append(f"{a['activities']} activities/labs")
    if a.get('demos'): parts.append(f"{a['demos']} demos")
    if a.get('caseStudies'): parts.append(f"{a['caseStudies']} case studies")
    if a.get('instructorGuides'): parts.append(f"{a['instructorGuides']} instructor guides")
    if a.get('modIntros'): parts.append(f"{a['modIntros']} module intros")
    if a.get('modRecaps'): parts.append(f"{a['modRecaps']} module recaps")
    if a.get('interactives'): parts.append(f"{a['interactives']} interactives/SCORM")

    return f"{total} total assets: {', '.join(parts)}."


def readiness_tier(coverage):
    if coverage is None:
        return "No Outline"
    if coverage >= 75:
        return "High (75%+)"
    if coverage >= 25:
        return "Moderate (25–74%)"
    if coverage > 0:
        return "Low (1–24%)"
    return "None (0%)"


def generate(paths):
    courses_data, overview_data, overview_map, course_map = load_data(paths)
    membership_map = build_membership_map(courses_data)

    lines = []
    w = lines.append  # shorthand

    # ═══════════════════════════════════════════
    # PART 0: HEADER
    # ═══════════════════════════════════════════
    w("# RTI Academy — Curriculum Knowledge Base")
    w("")
    w(f"**Generated:** {datetime.now().strftime('%B %d, %Y')}")
    w(f"**Courses:** {len(courses_data['courses'])}")
    w(f"**Curricula:** {len(courses_data['curricula'])}")
    w("")
    w("This document is a comprehensive reference for the RTI Academy curriculum. It contains the full course catalog with module/lesson detail, curriculum architecture showing how courses are organized into programs, and content readiness data showing what source materials exist for each course.")
    w("")
    w("Use this document to answer questions like:")
    w("- What courses and topics does RTI Academy offer?")
    w("- What content exists for a specific subject area (e.g., Python, cybersecurity, cloud)?")
    w("- How are courses organized into curriculum tracks?")
    w("- Which courses share content across multiple programs?")
    w("- What is the content readiness status of each course?")
    w("- Where are the gaps — what needs to be created?")
    w("- If a new occupation standard requires competency X, do we already teach it?")
    w("")
    w("---")
    w("")

    # ═══════════════════════════════════════════
    # PART 1: CURRICULUM ARCHITECTURE
    # ═══════════════════════════════════════════
    w("# Part 1: Curriculum Architecture")
    w("")
    w("RTI Academy organizes courses into **curriculum tracks** — each track is a complete program preparing students for a specific career. Some tracks use **groups** to organize courses into phases or focus areas. Individual courses can appear in multiple curriculum tracks.")
    w("")

    for cur in courses_data['curricula']:
        w(f"## {cur['name']}")
        w("")

        def resolve_ref(ref):
            if isinstance(ref, str):
                c = course_map.get(ref)
                return c['name'] if c else ref, format_hours(c.get('hours') if c else None)
            cid = ref.get('id', '')
            c = course_map.get(cid)
            name = ref.get('name') or (c['name'] if c else cid)
            hours = format_hours(ref.get('hoursOverride') or (c.get('hours') if c else None))
            return name, hours

        if cur.get('groups'):
            for g in cur['groups']:
                w(f"### {g['name']}")
                w("")
                for ref in g.get('courses', []):
                    name, hours = resolve_ref(ref)
                    w(f"- **{name}** ({hours})")
                w("")
        elif cur.get('courses'):
            for ref in cur['courses']:
                name, hours = resolve_ref(ref)
                w(f"- **{name}** ({hours})")
            w("")

    # Cross-reference: shared courses
    w("## Cross-Curriculum Course Sharing")
    w("")
    w("The following courses appear in more than one curriculum track:")
    w("")
    multi = {}
    for cid, mems in membership_map.items():
        curricula = sorted(set(m['curriculum'] for m in mems))
        if len(curricula) > 1:
            c = course_map.get(cid)
            name = c['name'] if c else cid
            multi[name] = curricula
    if multi:
        for name in sorted(multi.keys()):
            w(f"- **{name}** — {', '.join(multi[name])}")
        w("")
    else:
        w("No courses are currently shared across multiple curricula.")
        w("")

    w("---")
    w("")

    # ═══════════════════════════════════════════
    # PART 2: COURSE CATALOG
    # ═══════════════════════════════════════════
    w("# Part 2: Course Catalog")
    w("")
    w("Each course entry below includes: metadata (hours, curricula, status), content readiness (coverage %, source asset inventory), and the full module/lesson outline with topic detail where available.")
    w("")

    for course in courses_data['courses']:
        cid = course['id']
        name = course['name']
        hours = course.get('hours')
        design = course.get('status', {}).get('design', 'Not Started')
        dev = course.get('status', {}).get('development', 'Not Started')
        note = course.get('note', '')
        ov = overview_map.get(cid)
        mems = membership_map.get(cid, [])

        w(f"## {name}")
        w("")

        # Metadata block
        w(f"- **Hours:** {format_hours(hours)}")
        w(f"- **Curricula:** {format_memberships(mems)}")
        w(f"- **Design Status:** {design}")
        w(f"- **Development Status:** {dev}")

        if ov:
            w(f"- **Outline:** {'Yes' if ov['outline']['exists'] else 'No'}" +
              (f" ({ov['outline']['modules']} modules, {ov['outline']['lessons']} lessons)" if ov['outline']['exists'] else ""))
            w(f"- **Syllabus:** {'Yes' if ov['syllabus'] else 'No'}")
            w(f"- **Source Content:** {'Yes' if ov['source']['exists'] else 'No'}" +
              (f" ({ov['source']['modules']} source modules)" if ov['source']['exists'] else ""))
            if ov.get('coverage') is not None:
                w(f"- **Content Coverage:** {ov['coverage']}% ({ov['lessonsWithContent']}/{ov['outline']['lessons']} lessons with source content)")
                w(f"- **Readiness Tier:** {readiness_tier(ov['coverage'])}")
            else:
                w(f"- **Content Coverage:** N/A (no outline)")
                w(f"- **Readiness Tier:** No Outline")
            w(f"- **Source Assets:** {format_asset_summary(ov)}")
        else:
            w("- **Content Coverage:** Data not available")

        if note:
            w(f"- **Notes:** {note}")
        w("")

        # Full outline content
        outline_raw = read_outline_raw(cid, paths['courses_dir'])
        if outline_raw:
            outline_body = extract_outline_body(outline_raw)
            if outline_body:
                w("### Course Content")
                w("")
                # Indent module headers to ### and lessons to #### for hierarchy under the course ##
                adjusted = []
                for line in outline_body.split('\n'):
                    if line.startswith('## '):
                        adjusted.append('#### ' + line[3:])  # Module → h4
                    elif line.startswith('### '):
                        adjusted.append('##### ' + line[4:])  # Lesson → h5
                    else:
                        adjusted.append(line)
                w('\n'.join(adjusted))
                w("")
        else:
            w("*No course outline available.*")
            w("")

        w("---")
        w("")

    # ═══════════════════════════════════════════
    # PART 3: CONTENT READINESS SUMMARY
    # ═══════════════════════════════════════════
    w("# Part 3: Content Readiness Summary")
    w("")

    # Aggregate stats
    all_ov = overview_data['courses']
    with_outline = [c for c in all_ov if c['outline']['exists']]
    with_source = [c for c in all_ov if c['source']['exists']]
    with_coverage = [c for c in all_ov if c.get('coverage') is not None and c['coverage'] > 0]
    total_assets = sum(c.get('totalAssets', 0) for c in all_ov)
    cov_courses = [c for c in all_ov if c.get('coverage') is not None]
    avg_cov = round(sum(c['coverage'] for c in cov_courses) / len(cov_courses)) if cov_courses else 0

    w(f"**Total Courses:** {len(all_ov)}")
    w(f"**Courses with Outlines:** {len(with_outline)}")
    w(f"**Courses with Source Content:** {len(with_source)}")
    w(f"**Courses with Content Coverage > 0%:** {len(with_coverage)}")
    w(f"**Average Content Coverage:** {avg_cov}% (across {len(cov_courses)} courses with outlines)")
    w(f"**Total Source Assets:** {total_assets:,}")
    w("")

    # Readiness tiers
    tiers = {}
    for c in all_ov:
        tier = readiness_tier(c.get('coverage'))
        if tier not in tiers:
            tiers[tier] = []
        tiers[tier].append(c)

    tier_order = ["High (75%+)", "Moderate (25–74%)", "Low (1–24%)", "None (0%)", "No Outline"]

    w("## Readiness by Tier")
    w("")

    for tier in tier_order:
        courses_in_tier = tiers.get(tier, [])
        if not courses_in_tier:
            continue
        w(f"### {tier} — {len(courses_in_tier)} courses")
        w("")
        for c in sorted(courses_in_tier, key=lambda x: x['name']):
            cov_str = f"{c['coverage']}%" if c.get('coverage') is not None else "—"
            assets = c.get('totalAssets', 0)
            w(f"- **{c['name']}** — Coverage: {cov_str}, Assets: {assets}")
        w("")

    # Asset totals by type
    w("## Aggregate Asset Inventory")
    w("")
    asset_types = {
        'lessons': 'Lesson content docs',
        'slides': 'Slide decks',
        'quizzes': 'Quizzes',
        'activities': 'Activities / Labs',
        'demos': 'Demos',
        'caseStudies': 'Case studies',
        'instructorGuides': 'Instructor guides',
        'modIntros': 'Module intros',
        'modRecaps': 'Module recaps',
        'interactives': 'Interactives / SCORM'
    }
    for key, label in asset_types.items():
        total = sum(c.get('assets', {}).get(key, 0) for c in all_ov)
        if total > 0:
            w(f"- **{label}:** {total:,}")
    w(f"- **Total:** {total_assets:,}")
    w("")

    # Courses needing attention
    w("## Courses Needing Attention")
    w("")
    w("### No Outline (cannot generate gap analysis)")
    w("")
    no_outline = [c for c in all_ov if not c['outline']['exists']]
    for c in sorted(no_outline, key=lambda x: x['name']):
        assets = c.get('totalAssets', 0)
        source = "has source content" if c['source']['exists'] else "no source content"
        w(f"- **{c['name']}** — {source}, {assets} assets")
    w("")

    w("### Have Outline but 0% Coverage (no matching source content)")
    w("")
    zero_cov = [c for c in all_ov if c['outline']['exists'] and c.get('coverage') == 0]
    for c in sorted(zero_cov, key=lambda x: x['name']):
        assets = c.get('totalAssets', 0)
        w(f"- **{c['name']}** — {c['outline']['modules']} modules, {c['outline']['lessons']} lessons, {assets} source assets")
    w("")

    w("---")
    w("")
    w(f"*End of document. Generated {datetime.now().strftime('%Y-%m-%d %H:%M')} by generate-knowledge-base.py.*")

    # Write output
    doc = '\n'.join(lines)
    os.makedirs(os.path.dirname(paths['output']), exist_ok=True)
    with open(paths['output'], 'w', encoding='utf-8') as f:
        f.write(doc)

    word_count = len(doc.split())
    print(f"Generated: {paths['output']}")
    print(f"Word count: {word_count:,}")
    print(f"Line count: {len(lines):,}")
    print(f"File size: {len(doc.encode('utf-8')):,} bytes")



def main():
    parser = argparse.ArgumentParser(description='Generate RTI Academy knowledge base markdown')
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

    if not os.path.exists(paths['overview_json']):
        print(f"Error: course-overview.json not found at {paths['overview_json']}", file=sys.stderr)
        print("Run generate-course-overview.py first.", file=sys.stderr)
        sys.exit(1)

    generate(paths)


if __name__ == '__main__':
    main()
