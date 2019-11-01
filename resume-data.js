const fs = require('fs');
const mt = require('moment');

//
//
// ================================================
//
// Useful Constants
//
// ================================================
//
//
const defaultDiffFormatter = (y, m) => [y === 0 ? "" : `${y} year${y > 1 ? "s": ""}`, m === 0 ? "" : `${m} month${m > 1 ? "s": ""}`]; // returns only years and months
const shortFormatter = (y, m) => {
    if (y === 0)
        return `${m}m`;
    if (m === 0)
        return `${y}y`;
    return `${y}y ${m}m`;
};

//
//
// ================================================
//
// Utility Functions
//
// ================================================
//
//
const loadResume = (file) => {
    const resume = JSON.parse(fs.readFileSync(file));
    resume.events.forEach(d => {
        d.dates = d.dates.map(d => new Date(d));
        fillDateInfos(d);
        let group = resume.eventGroups.filter(g => g.events.indexOf(d.id) >= 0);
        d.groupId = group && group.length > 0 ? group[0].id : undefined;
        d.isGrouped = d.groupId !== undefined;
        d.isSingle = !d.isGrouped;
    });
    resume.getCertificates = () => resume.events.filter(d => d.type === "formation" && d.diploma === "certificate");
    resume.getExperiences = () => getExperiences(resume, true);
    resume.getEducations = () => resume.events.filter(d => d.type === "formation" && d.diploma !== "certificate");
    return resume;
};

function getExperiences(resume, useGroups) {
    let experiences = resume.events.filter(d => d.type === "experience");
    if (!useGroups)
        return experiences;
    // remove experiences in groups
    experiences = experiences.filter(e => e.isSingle);
    //
    resume.eventGroups.forEach(g => {
        let events = resume.events.filter(e => g.events.indexOf(e.id) >= 0).sort((a, b) => b.to - a.to);
        let e = {
            "dates": [events.slice(-1)[0].from, events[0].to],
            "isGrouped": true,
            "isSingle": false,
            "company": events[0].company,
            "type": events[0].type,
            "category": events[0].category,
            "industry": events[0].industry,
            "subIndustry": events[0].subIndustry,
            "events": events,
            "links": events[0].links
        };
        fillDateInfos(e);
        experiences.push(e);
    });
    experiences.sort((a, b) => b.to - a.to);
    return experiences;
}

function fillDateInfos(event) {
    event.from = event.dates[0];
    event.to = event.dates[1];
    event.years = [...new Set(event.dates.map(d => d.getFullYear()))];
    event.period = event.dates.length === 2;
    event.duration = duration(event.dates);
    event.periodAsString = getPeriod(event);
    event.durationAsString = diff(event.duration, shortFormatter);
}

function getPeriod(event) {
    const dates = event.dates;
    const d1 = mt(dates[0]);
    // one date event
    if (event.period === false)
        return `${d1.format("MMM YYYY")}`;
    const sameYear = event.years.length === 1;
    const d2 = mt(dates[1]);
    // event on several years
    if (sameYear === false)
        return `${d1.format("MMM YYYY")} - ${d2.format("MMM YYYY")}`;
    // event within one year
    return `${d1.format("MMM")} - ${d2.format("MMM YYYY")}`;
}

function diff(time, formatter = defaultDiffFormatter, approx = true) {
    let y = time[0];
    let m = time[1];
    let d = time[2];
    // day
    let dm = Math.floor(d / 30);
    if (dm > 0) {
        d = d - dm * 30;
        m += dm;
    }
    if (approx && d > 20) {
        d = 0;
        m++;
    }
    // month
    let my = Math.floor(m / 12);
    if (my > 0) {
        m = m - my * 12;
        y += my;
    }
    if (approx && m > 10) {
        m = 0;
        y++;
    }
    return formatter(y, m, d);
}


function duration(dates) {
    const starts = mt(dates[0]);
    const ends = mt(dates.length === 1 ? new Date() : dates[1]);
    const duration = mt.duration(ends.diff(starts));
    let y = duration.years();
    let m = duration.months();
    let d = duration.days();
    return [y, m, d];
}

module.exports = loadResume;

if (require.main === module) {
    let resume = loadResume('./timeline/events.json');
    const exps = getExperiences(resume, true);
    console.log(exps[0]);
} 