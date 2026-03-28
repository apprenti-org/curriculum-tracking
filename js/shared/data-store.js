/**
 * Shared data store — lookup maps built from courseData and curriculaData
 * Depends on: courseData, curriculaData (from courses.js)
 */

// Build a lookup map: course name and id → course object
var courseLookup = {};
courseData.forEach(function(c) {
    courseLookup[c.name] = c;
    if (c.id) courseLookup[c.id] = c;
});

// Build curriculum membership map from curriculaData
// Maps course id/name → array of { curriculum, group, hoursOverride }
var membershipMap = {};
curriculaData.forEach(function(cur) {
    var curName = cur.name;
    if (cur.groups) {
        cur.groups.forEach(function(g) {
            g.courses.forEach(function(gc) {
                var key = gc.id || gc.name;
                if (!membershipMap[key]) membershipMap[key] = [];
                membershipMap[key].push({
                    curriculum: curName,
                    group: g.name,
                    hoursOverride: gc.hoursOverride || undefined
                });
            });
        });
    } else if (cur.courses) {
        cur.courses.forEach(function(cc) {
            var key = cc.id || cc.name;
            if (!membershipMap[key]) membershipMap[key] = [];
            membershipMap[key].push({
                curriculum: curName,
                group: undefined,
                hoursOverride: cc.hoursOverride || undefined
            });
        });
    }
});
