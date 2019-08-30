/* globals d3 moment*/
"use strict";

/**
 *
 *
 * @class Timeline
 */
class Timeline {

    constructor(parentId, events) {
        this.events = events;
        this.parentId = parentId;
    }

    /**
     *
     *
     * @memberof Timeline
     */
    render() {

        // draw timeline

        const timeline = d3.select("#" + this.parentId)
            .append("div")
            .classed("timeline-container", true);

        timeline.append("div")
            .classed("timeline-column-left", true);

        timeline.append("div")
            .classed("timeline-column-right", true);

        // draw children events
        let side = "right";
        const dates = [];
        this.events.forEach(d => {
            d.dates = d.dates.map(d => new Date(d));
            dates.push(...d.dates);
            d.years = [...new Set(d.dates.map(d => d.getFullYear()))];
            new TimelineEvent(timeline, d)
                .render(side);
            side = side === "right" ? "left" : "right";
        });

        // draw timeline bar
        const width = document.getElementById("timeline-bar").clientWidth;
        const svg = d3
            .select("#timeline-bar")
            .append("div")
            .classed("svg-container", true)
            .append("svg")
            .classed("svg-content", true)
            .attr("preserveAspectRatio", "xMinYMax meet")
            .attr("viewBox", `0 0 ${width} ${80}`)
            .style("z-index", 2);

        //svg.

        const period = d3.extent(dates);

        const x = d3.scaleTime().range([10, width - 10]).domain(period);
        const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")); //.tickValues(lineData.map(d=>d.date));

        // x axis (dates)
        svg.append("g")
            .attr("class", "x axis")
            .call(xAxis);

        const gbar = svg.append("g")
            .classed("bars", true)
            .selectAll("g.bar")
            .data(this.events)
            .enter()
            .append("g")
            .classed("bar", true)
            .attr("transform", d => `translate(${x(d.dates[0]) },${40})`);

        gbar.filter(d => d.dates.length === 2)
            .append("rect")
            .attr("class", d => d.category)
            .attr("width", d => x(d.dates[1]) - x(d.dates[0]))
            .attr("height", 10);

    }


}

/**
 *
 *
 * @class TimelineEvent
 */
class TimelineEvent {

    constructor(parent, event) {
        this.event = event;
        this.parent = parent;
    }

    /**
     *
     *
     * @param {string} side
     * @memberof TimelineEvent
     */
    render(side) {
        const e = this.event;
        const content = this.parent.select(`.timeline-column-${side}`)
            .append("div")
            .classed(`timeline-event ${side}`, true)
            .append("div")
            .classed(`timeline-event-content ${side} ${e.type}`, true);

        content.append("span")
            .classed(`tag ${e.category}`, true)
            .text(e.category);

        const period = e.dates.map(d => d3.timeFormat("%b %Y")(d)).join(" - ");
        content.append("time")
            .text(e.type === "certificate" ? period + " - " + e.title.toUpperCase() : period);

        if (e.type !== "certificate") {
            content.append("p")
                .classed("title", true)
                .text(e.title);

        }
        content.append("p")
            .classed("description", true)
            .text(e.description);



        if (e.link && e.link.url) {
            content.append("a")
                .attr("href", e.link.url)
                .attr("target", "_blank")
                .attr("rel", "noopener noreferrer")
                .text(e.link.name);
        }


        content.append("span")
            .classed(`pin ${e.category}`, true);

        if (e.type === "certificate") {
            content.append("i").classed("fa fa-certificate", true);
        }


        if (e.company.logo) {
            content.append("img")
                .classed("logo", true)
                .attr("src", `./images/${e.company.logo}`);
        }


        const duration = diff(e.dates);
        // TODO: show duration
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
    const ends = moment(dates[1]);
    const duration = moment.duration(ends.diff(starts));
    return duration;
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