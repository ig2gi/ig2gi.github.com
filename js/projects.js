/* globals d3 */
"use strict";

(function () {


    //
    //
    //
    const loadPortfolio = (data) => {

        let card = d3.select("#portfolio-items")
            .selectAll("div.card")
            .data(data)
            .enter()
            .append("div")
            .classed("card mb-4 shadow-sm", true);

        let body = card.append("div")
            .classed("card-body text-center", true);

        body.append("h5")
            .classed("card-title", true)
            .style("color", "#5D6D7E")
            .html(d => `${d.title} <span class="small" style="color:#7FB3D5;">${d.date}</span>`);

        body.append("p")
            .classed("card-text small text-justify text-muted", true)
            
            .html(d => {
                if (!d.company)
                    return d.description;
                return `${d.description}<br><span class="text-muted">${d.company}</span>`;
            });

        card.append("a")
            .attr("href", d => d.url)
            .append("img")
            .classed("card-img-bottom rounded", true)
            .attr("src", d => d.image);

        card.append("div")
            .classed("card-footer text-muted", true)
            .append("small")
            .text(d => d.technology);


    };

    // load portfolioprojects items
    d3.json("projects.json")
        .then(data => loadPortfolio(data));


})();