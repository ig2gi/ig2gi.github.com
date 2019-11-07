const fs = require('fs');
const mt = require('moment');


/**
 *
 *
 * @class Resume
 */
class Resume {

    constructor(data) {
        this.data = data;
    }


    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get languages() {
        return this.data.languages;
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get header() {
        return this.data.header;
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get skills() {
        return this.data.skills;
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get profile() {
        return this.data.profile;
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get personalInfo() {
        return this.data.personalInfo;
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get aptitudes() {
        return this.data.aptitudes;
    }


    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get hobbies() {
        return this.data.hobbies;
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get contactInfo() {
        return this.data.contactInfo;
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    get socialNetworks() {
        return this.data.socialNetworks;
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    getEvents(filter = undefined) {
        if (filter === undefined)
            return this.data.events;
        return this.data.events.filter(d => filter(d));
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    getCertificates() {
        return this.getEvents(d => d.type === "formation" && d.diploma === "certificate");
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    getEducation() {
        return this.getEvents(d => d.type === "formation" && d.diploma !== "certificate");
    }

    /**
     *
     *
     * @readonly
     * @memberof Resume
     */
    getExperience(grouped = true) {
        let exps = this.getEvents(d => d.type === "experience");
        if (grouped === false)
            return exps;

        // remove experiences in groups
        exps = exps.filter(e => e.isSingle);

        //
        this.data.eventGroups.forEach(g => {
            let events = this.data.events.filter(e => g.events.indexOf(e.id) >= 0).sort((a, b) => b.to - a.to);
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
            exps.push(e);
        });
        exps.sort((a, b) => b.to - a.to);
        return exps;
    }


    /**
     * Factory for Resume instances.
     *
     * @static
     * @param {*} file
     * @returns
     * @memberof Resume
     */
    static load(file) {
        // get data
        const data = JSON.parse(fs.readFileSync(file));
        // data augmentation
        augment(data);
        // return resume object
        return new Resume(data);
    }

}

module.exports = Resume;

//
//
// ================================================
//
// Useful Constants & Utility Functions
// Mainly used during Data Augmentation
//
// ================================================
//
//
const defaultDiffFormatter = (y, m) => {
    if (y === 0)
        return `${m} month${m >1 ? "s" : ""}`;
    if (m === 0)
        return `${y} year${y >1 ? "s" : ""}`;
    return `${y} year${y >1 ? "s" : ""}, ${m} month${m >1 ? "s" : ""}`;
};

const shortFormatter = (y, m) => {
    if (y === 0)
        return `${m}m`;
    if (m === 0)
        return `${y}y`;
    return `${y}y ${m}m`;
};

function augment(resume) {
    resume.events.forEach(d => {
        d.dates = d.dates.map(d => new Date(d));
        fillDateInfos(d);
        let group = resume.eventGroups.filter(g => g.events.indexOf(d.id) >= 0);
        d.groupId = group && group.length > 0 ? group[0].id : undefined;
        d.isGrouped = d.groupId !== undefined;
        d.isSingle = !d.isGrouped;
    });
}


function fillDateInfos(event) {
    event.from = event.dates[0];
    event.to = event.dates[1];
    event.years = [...new Set(event.dates.map(d => d.getFullYear()))];
    event.period = event.dates.length === 2;
    event.duration = duration(event.dates);
    event.periodAsString = getPeriod(event);
    event.periodAsStringShort = getPeriod(event, false);
    event.durationAsString = diff(event.duration);
}

function getPeriod(event, full = true) {
    const dates = event.dates;
    const d1 = mt(dates[0]);
    // one date event
    if (event.period === false)
        return [d1.format("MMM YYYY")];
    const sameYear = event.years.length === 1;
    const d2 = mt(dates[1]);
    // event on several years
    if (sameYear === false)
        return [d1.format("MMM YYYY"), d2.format(full ? "MMM YYYY" : "MMM")];
    // event within one year
    return [d1.format("MMM"), d2.format(full ? "MMM YYYY" : "MMM")];
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

//
//
// ================================================
//
// Main Standalone
//
// ================================================
//
//

if (require.main === module) {
    let resume = Resume.load('./timeline/events.json');
    const exps = resume.getExperience();
    console.log(exps[0]);
}