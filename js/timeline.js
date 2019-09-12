/* globals d3 moment*/
"use strict";

import S from "./skills.js";

/**
 *
 *
 * @class Timeline
 */
class Timeline {


    /**
     *Creates an instance of Timeline.
     * @param {*} events
     * @param {string} [parentId="timeline"]
     * @param {string} [overviewId="timeline-overview"]
     * @memberof Timeline
     */
    constructor(events, parentId = "timeline", overviewId = "overview") {
        this.events = events;
        this.parentId = parentId;
        this.overviewId = overviewId;
        this.dates = [];
        this.events.forEach(d => {
            d.dates = d.dates.map(d => new Date(d));
            this.dates.push(...d.dates);
            d.years = [...new Set(d.dates.map(d => d.getFullYear()))];
            d.duration = duration(d.dates);
        });
        //
        this.computeStatistics();
    }

    /**
     *
     *
     * @memberof Timeline
     */
    computeStatistics() {

        this.statistics = {};
        this.statistics.experience = getStats(this.events, e => e.type !== "formation", ["industry", "category"]);
        this.statistics.education = getStats(this.events, e => e.type === "formation", ["diploma"]);
        const axes = S.getTraits();
        const temp = {};
        axes.forEach(a => {
            let d = {
                "axis": a,
                "count": 0,
                "values": []
            };
            temp[a] = d;
        });
        this.events.forEach(e => {
            let words = e.softSkills ? e.softSkills.split(",") : [];
            words.forEach(w => {
                axes.forEach(a => {
                    if (S.hasFeature(a, w)) {
                        temp[a].count++;
                        temp[a].values.push(w);
                    }
                });
            });
        });
        this.statistics.softskills = Object.values(temp);
    }

    /**
     *
     *
     * @memberof Timeline
     */
    render() {

        // 
        // DRAW TIMELINE
        //
        const testMediaWidth = window.matchMedia("(max-width: 700px)");
        testMediaWidth.addListener(() => {
            d3.select("#" + this.parentId).select("div.timeline-container").remove();
            testMediaWidth.matches ? this.layout(2) : this.layout(1);
        });
        testMediaWidth.matches ? this.layout(2) : this.layout(1);

        // 
        // DRAW OVERVIEW
        //
        const rootOverview = d3.select("#" + this.overviewId);
        // Experience  
        rootOverview.append("h3").html(`Experience`);
        rootOverview.append("h6").html(`~${Math.floor(this.statistics.experience.totaly)} years`);
        const data1 = [];
        this.statistics.experience.category.forEach(c => {
            let d = c;
            if ((c.name === "consultant" || c.name === "freelance")) {
                let elt = data1.find(e => e.name === "consultant" || e.name === "freelance");
                if (elt) {
                    elt.value += c.value;
                    elt.name = "freelance / consultant";
                    elt.duration += c.duration;
                    elt.percent += c.percent;
                } else
                    data1.push(d);
            } else {
                data1.push(d);
            }

        });
        new B4ProgressBars(rootOverview, data1, "category")
            .enter();


        rootOverview.append("p").html(`<i class="fas fa-ellipsis-h"></i>`);

        const data2 = this.statistics.experience.industry.sort((a, b) => a.value < b.value);
        new B4ProgressBars(rootOverview, data2, "industry")
            .enter();



        // Education
        rootOverview.append("br");
        rootOverview.append("h3").html(`Education`);
        rootOverview.append("h6").html(`~${Math.round(this.statistics.education.totaly)} years (after bachelor's degree)`);
        const masters = this.events.filter(e => e.type = "formation" && e.diploma === "master");
        rootOverview.append("h5").classed("text-left", true).html(` 2 Master's degrees`);
        const div = rootOverview.append("div").classed("d-flex flex-column", true);
        masters.forEach(m => {
            div.append("p").classed("text-left", true).html(`<i class="fas fa-certificate small" style="color:#BB8FCE"></i>  ${m.title}`); // FIXME:
        });
        const engineer = this.events.find(e => e.type = "formation" && e.diploma === "engineer");
        rootOverview.append("h5").classed("text-left", true).html(` 1 Engineer's degree`);
        const div2 = rootOverview.append("div").classed("d-flex flex-column", true);
        div2.append("p").classed("text-left", true).html(`<i class="fas fa-certificate small" style="color:#BB8FCE"></i>  ${engineer.title}`); // FIXME:



        // soft skills
        const data3 = this.statistics.softskills.sort((a, b) => a.count > b.count);
        data3.forEach((t, i) => {
            t.angle = i * Math.PI * 2 / data3.length;
        });
        rootOverview.append("br");
        rootOverview.append("h3").html(`Soft Skills`);
        rootOverview.append("p")
            .classed("small", true)
            .html(`Based on <a href="https://resumegenius.com/blog/resume-help/soft-skills" target="_blank">Top 10 soft skills</a>`);

        let size = 300;
        const svg = rootOverview
            .append("div")
            .append("svg")
            .attr("id", "spider")
            .attr("viewBox", "0 0 300 300");

        const rdomain = d3.extent(data3, d => d.count);
        let radialScale = d3.scaleLinear()
            .domain(rdomain)
            .range([15, size / 3]);
        let ticks = [2, 5, 10, 15, rdomain[1]];

        const gGrid = svg.append("g").classed("grid", true);
        gGrid.selectAll("circle")
            .data(ticks)
            .enter()
            .append("circle")
            .attr("cx", size / 2)
            .attr("cy", size / 2)
            .attr("r", t => radialScale(t));

        const axis = gGrid.selectAll("g.axis")
            .data(data3)
            .enter()
            .append("g")
            .attr("class", d => `axis ${(d.angle <= Math.PI / 2 || d.angle > 3 * Math.PI / 2  ) ? "right" : "left"}`);

        axis.append("line")
            .classed("grid", true)
            .attr("x1", size / 2)
            .attr("y1", size / 2)
            .attr("x2", d => size / 2 + radialScale(rdomain[1]) * Math.cos(d.angle))
            .attr("y2", d => size / 2 + radialScale(rdomain[1]) * Math.sin(d.angle));


        const axisTitle = axis.append("g")
            .attr("transform", d => `translate(${size / 2 + radialScale(rdomain[1] + 2) * Math.cos(d.angle)},${size / 2 + radialScale(rdomain[1] + 2) * Math.sin(d.angle)})`)
            .classed("important", d => d.count >= 0.8 * rdomain[1]);

        axisTitle.selectAll("text")
            .data(d => d.axis.split(" "))
            .enter()
            .append("text")
            .attr("dy", (d, i) => i + "em")
            .text(d => d);

        // plot data (line and points)
        const gData = svg.append("g")
            .classed("data", true)
            .attr("transform", `translate(${size/2}, ${size /2})`);

        const radarLine = d3.lineRadial()
            .curve(d3.curveCatmullRomClosed.alpha(0.75))
            .radius(d => radialScale(d.count))
            .angle(d => d.angle + Math.PI / 2);

        gData.append('path')
            .classed("curve", true)
            .attr("d", radarLine(data3));

        gData.selectAll("circle")
            .data(data3)
            .enter()
            .append("circle")
            .attr("cx", d => radialScale(d.count) * Math.cos(d.angle))
            .attr("cy", d => radialScale(d.count) * Math.sin(d.angle))
            .attr("r", "5px");





    }

    layout(type) {

        // draw timeline
        const timeline = d3.select("#" + this.parentId)
            .append("div")
            .classed(`timeline-container layout${type}`, true);
        timeline.append("div").classed(`line`, true);
        if (type === 1)
            timeline.append("div")
            .classed("timeline-column-left", true);
        timeline.append("div")
            .classed("timeline-column-right", true);


        // draw children events
        let side = type === 1 ? "left" : "right";
        this.events.forEach(d => {
            new TimelineEvent(timeline, d).render(side);
            if (type === 1)
                side = side === "right" ? "left" : "right";
        });
    }


}

const TF = d3.timeFormat("%b %Y");
const MAX_DESCRIPTION_LENGTH = 150;

/**
 *
 *
 * @class TimelineEvent
 */
class TimelineEvent {

    constructor(parent, event) {
        this.event = event;
        this.parent = parent;
        this.root = undefined;
    }

    /**
     *
     *
     * @param {string} side
     * @memberof TimelineEvent
     */
    render(side) {
        const e = this.event;
        this.side = side;
        this.root = this.parent.select(`.timeline-column-${side}`)
            .append("div")
            .classed(`timeline-event ${side}`, true);

        //
        // SOFT SKILLS & ROOT CONTENT
        //
        const hasSkills = e.softSkills && e.softSkills !== "";

        let sidebar;
        if (side === "left" && hasSkills)
            sidebar = this.root.append("div")
            .classed(`timeline-event-sidebar`, true);

        // add content root
        const content = this.root.append("div")
            .classed(`timeline-event-content ${e.type}`, true);

        if (side === "right" && hasSkills)
            sidebar = this.root.append("div")
            .classed(`timeline-event-sidebar`, true);

        if (hasSkills) {
            //sidebar.append("span").html(`<i class="fas fa-level-down-alt"></i>`);
            e.softSkills.split(",").forEach((s, i) => {
                if (i < 8)
                    sidebar.append("span")
                    .style("white-space", "pre")
                    .text(s.trim());
            });

        }


        //
        // CATEGORY
        //

        content.append("span")
            .classed(`tag ${e.category}`, true)
            .text(e.category);

        //
        // PERIOD
        //

        const period = `${TF(e.dates[0])} <i class="fas fa-caret-right"></i> ${e.dates.length > 1 ? TF(e.dates[1]) : "now"} `;
        content.append("time")
            .html(period);

        //
        // INDUSTRY
        //

        if (e.industry) {
            let ind = e.industry.toUpperCase();
            ind += e.subIndustry ? " / " + e.subIndustry.toUpperCase() : "";
            content.append("span")
                .classed("industry info", true)
                .html(ind);
        }

        //
        // TITLE
        //

        content.append("p")
            .classed("title", true)
            .text(e.title);
        let isTruncated = e.description.length > MAX_DESCRIPTION_LENGTH;
        const desc = content.append("p")
            .classed(`description ${isTruncated ? "withtooltip": ""}`, true)
            .text(truncate(e.description));
        if (isTruncated) {
            desc.append("span")
                .classed("tooltiptext", true)
                .html(tooltipText(e.description));
        }

        //
        // LINKS
        //

        if (e.links && e.links.length > 0) {
            const links = content.append("div")
                .classed("links", true);
            e.links.forEach(l => {
                links.append("a")
                    .attr("href", l.url)
                    .attr("target", "_blank")
                    .attr("rel", "noopener noreferrer")
                    .text(l.name);
            });
        }

        //
        // PIN
        //

        content.append("span")
            .classed(`pin ${e.category}`, true);


        //
        // LOGO
        //
        if (e.company.logo) {
            content.append("img")
                .classed("logo", true)
                .attr("src", `./images/${e.company.logo}`);
        }


        //
        // DURATION
        //

        content.append("span")
            .classed("duration", true)
            .html(diff(e.duration).join(" "));

        //
        // INFO YEARS
        //

        content.append("span")
            .classed("info", true)
            .text(e.years.join("-"));



    }


}

/**
 *
 *
 * @class B4ProgressBars
 */
class B4ProgressBars {

    /**
     * 
     * @param {*} root 
     * @param {*} data 
     * @param {*} className 
     */
    constructor(root, data, className) {
        this.root = root;
        this.data = data;
        this.className = className;
    }

    /**
     *
     *
     * @memberof B4ProgressBars
     */
    enter() {
        const div = this.root.append("div").classed("d-flex flex-column", true);
        const elt = div.selectAll(`div.${this.className}`)
            .data(this.data)
            .enter()
            .append("div")
            .classed(this.className, true);

        elt.append("p")
            .html(d => `${d.name.toLowerCase()}  (${Math.round(d.value)} year${Math.round(d.value) == 1 ? "": "s"}) `);

        elt.append("div")
            .classed("progress", true)
            .style("height", "3px")
            .append("div")
            .attr("class", d => `progress-bar ${d.name.toLowerCase() === "industry" ? "" : d.name.toLowerCase()}`) // FIXME:
            .attr("role", "progressbar")
            .style("width", d => d.percent + "%")
            .attr("aria-valuenow", d => d.percent)
            .attr("aria-valuemin", "0")
            .attr("aria-valuemax", "100");
    }
}

/**
 *
 *
 * @param {*} events
 * @param {*} filter
 * @param {*} attrs
 * @returns
 */
function getStats(events, filter, attrs) {
    const result = {
        "total": [0, 0, 0],
        "totaly": 0
    };
    const reducer = (acc, cur) => {
        acc[0] += cur[0];
        acc[1] += cur[1];
        acc[2] += cur[2];
        return acc;
    };
    let filteredEvents = events.filter(e => filter(e));
    result.total = filteredEvents.map(e => [...e.duration]).reduce(reducer);
    result.totaly = result.total[0] + result.total[1] / 12 + +result.total[2] / 360;
    attrs.forEach(attr => {
        result[attr] = [];
        let attrValues = [...new Set(filteredEvents.map(e => e[attr]))];
        attrValues.forEach(a => {
            let dur = filteredEvents.filter(e => e[attr] === a).map(e => [...e.duration]).reduce(reducer);
            let val = dur[0] + dur[1] / 12 + dur[2] / 360;
            result[attr].push({
                "name": a,
                "duration": dur,
                "value": val,
                "percent": 100.0 * val / result.totaly
            });
        });
    });
    return result;
}


const defaultDiffFormatter = (y, m, d) => [y === 0 ? "" : `${y} year${y > 1 ? "s": ""}`, m === 0 ? "" : `${m} month${m > 1 ? "s": ""}`]; // returns only years and months

/**
 *
 *
 * @param {*} dates
 * @returns
 */
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


/**
 *
 *
 * @param {*} dates
 * @returns
 */
function duration(dates) {
    const starts = moment(dates[0]);
    const ends = moment(dates.length === 1 ? new Date() : dates[1]);
    const duration = moment.duration(ends.diff(starts));
    let y = duration.years();
    let m = duration.months();
    let d = duration.days();
    return [y, m, d];
}


/**
 *
 *
 * @param {*} txt
 * @returns
 */
function truncate(txt) {
    return txt.length > MAX_DESCRIPTION_LENGTH ? txt.substring(0, MAX_DESCRIPTION_LENGTH - 1) + " ..." : txt;
}

const BULLET = `<i class="fas fa-caret-right" style="margin-top:5px;opacity:0.5;"></i>`;
/**
 *
 *
 * @param {*} txt
 * @returns
 */
function tooltipText(txt) {
    return BULLET + " " + txt.replace(/\. /g, ` <br>${BULLET} `);
}


(function () {


    //
    //
    //
    const loadEvents = (data) => {

        new Timeline(data)
            .render();

    };

    // load portfolioprojects items
    d3.json("events.json")
        .then(data => loadEvents(data));


})();