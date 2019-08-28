/* globals d3 */
"use strict";

/**
 *
 *
 * @class TimelineEvent
 */
class TimelineEvent {

    constructor(event) {
        this.event = event;
    }

    render(parentId, side) {
        const e = this.event;
        const content = d3.select(`#${parentId}`).select(`.timeline-column-${side}`).append("div")
            .classed(`timeline-item ${side}`, true)
            .append("div")
            .classed(`timeline-item-content ${side}`, true);

        content.append("span").classed(`tag ${e.category}`, true).text(e.category);

        const period = e.dates.map(d => d3.timeFormat("%b %Y")(d)).join(" - ");
        content.append("time").text(period);

        content.append("p").classed("title", true).text(e.title);
        content.append("p").classed("description", true).text(e.description);

        if (e.link && e.link.url) {
            content.append("a")
                .attr("href", e.link.url)
                .attr("target", "_blank")
                .attr("rel", "noopener noreferrer")
                .text(e.link.name);
        }

        content.append("span")
            .classed(`circle ${e.category}`, true);


        if (e.company.logo) {
            content.append("img")
                .classed("logo", true)
                .attr("src", `./images/${e.company.logo}`);
        }

        content.append("span")
            .classed("info", true)
            .text(e.years.join("-"));



    }

}

(function () {


    //
    //
    //
    const loadEvents = (data) => {

        const parentId = "timeline";
        let side = "right";
        data.forEach(d => {
            d.dates = d.dates.map(d => new Date(d));
            d.years = [...new Set(d.dates.map(d => d.getFullYear()))];
            new TimelineEvent(d).render(parentId, side);
            side = side === "right" ? "left" : "right";
        });

    };

    // load portfolioprojects items
    d3.json("events.json")
        .then(data => loadEvents(data));


})();