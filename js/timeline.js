/* globals d3 moment*/
"use strict";

/**
 *
 *
 * @class Timeline
 */
class Timeline {

    /**
     * Creates an instance of Timeline.
     * 
     * @param {*} parentId
     * @param {*} events
     * @memberof Timeline
     */
    constructor(parentId, events) {
        this.events = events;
        this.parentId = parentId;
        this.dates = [];
        this.events.forEach(d => {
            d.dates = d.dates.map(d => new Date(d));
            this.dates.push(...d.dates);
            d.years = [...new Set(d.dates.map(d => d.getFullYear()))];
        });
    }

    /**
     *
     *
     * @memberof Timeline
     */
    render() {

        const testMediaWidth = window.matchMedia("(max-width: 700px)");
        testMediaWidth.addListener(() => {
            d3.select("#" + this.parentId).select("div.timeline-container").remove();
            testMediaWidth.matches ? this.layout(2) : this.layout(1);
        });

        testMediaWidth.matches ? this.layout(2) : this.layout(1);

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
            e.softSkills.split(",").forEach(s => {
                sidebar.append("span").text(s);
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
            const ind = `${e.industry.toUpperCase()}`;
            content.append("span").classed("industry info", true)
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

        const duration = diff(e.dates);
        content.append("span")
            .classed("duration", true)
            .html(duration.join(" "));

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
 * @param {*} dates
 * @returns
 */
function diff(dates) {
    const starts = moment(dates[0]);
    const ends = moment(dates.length === 1 ? new Date() : dates[1]);
    const duration = moment.duration(ends.diff(starts));
    let y = duration.years();
    let m = duration.months();
    let d = duration.days();
    if (d > 15)
        m++;
    if (m >= 10) {
        m = 0;
        y++;
    }
    return [y === 0 ? "" : `${y} year${y > 1 ? "s": ""}`, m === 0 ? "" : `${m} month${m > 1 ? "s": ""}`]; // returns only years and months
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

        new Timeline("timeline", data)
            .render();

    };

    // load portfolioprojects items
    d3.json("events.json")
        .then(data => loadEvents(data));


})();