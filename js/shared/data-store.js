/**
 * Shared data store builders — used by both dashboard and status pages
 * Depends on: courseData, curriculaData (from courses.js)
 *
 * Builds lookup maps that other scripts consume:
 *   courseLookup  — course name/id → course object
 *   membershipMap — course id/name → array of { curriculum, group, hoursOverride }
 */

// Course lookup: keyed by both name and id for flexible access
var courseLookup = {};
courseData.forEach(function(c) {
    courseLookup[c.name] = c;
    if (c.id) courseLookup[c.id] = c;
});

// Membership map: which curricula contain each course
var membershipMap = {};
curriculaData.forEach(function(cur) {
    var curName = cur.name;

    function addRef(ref, groupName) {
        var key = ref.id || ref.name;
        if (!membershipMap[key]) membershipMap[key] = [];
        membershipMap[key].push({
            curriculum: curName,
            group: groupName || undefined,
            hoursOverride: ref.hoursOverride || undefined
        });
    }

    if (cur.groups) {
        cur.groups.forEach(function(g) {
            g.courses.forEach(function(gc) { addRef(gc, g.name); });
        });
    } else if (cur.courses) {
        cur.courses.forEach(function(cc) { addRef(cc, undefined); });
    }
});
