/**
 * ---------------------------------
 * IAS (International AIDS Society)
 * ---------------------------------
 *
 *
 * @author Gilbert Perrin (gilbert.perrin@gmail.com)
 * @year 2013
 */
var IAS = IAS || {};
IAS.graph = (function () {
    "use strict";

    var that            = {},
        model           = IAS.model,
        util            = IAS.util,
        config          = IAS.util.config,
        filter          = IAS.filter,
        log             = IAS.log,
        pi              = Math.PI,
        projection      = d3.geo.equirectangular().scale(140),
        path            = d3.geo.path().projection(projection),
        mapsvg          = {},
        legendsvg       = {},
        cohortPins      = [],
        tooltipCountry  = {},
        tooltipCohort   = {},
        selectedCohort  = undefined; // cohort pin object clicked

    //.call(d3.behavior.zoom().on("zoom", zoom)); // TODO activate zoom

    that.components = [];

    //
    //
    //
    function enterCountry(countryId) {

        var country = model.allcountriesById[countryId];

        tooltipCountry.html(country.html()).show();

        d3.select("#" + countryId)
            .style('stroke', "steelblue")
            .style('stroke-width', "1px");

    }

    //
    //
    //
    function exitCountry(countryId) {

        tooltipCountry.hide();

        d3.select("#" + countryId)
            .style('stroke', "#fff")
            .style('stroke-width', "0px");

    }

    //
    //
    //
    function zoom() {

        if (d3.event.scale >= 4) {
            d3.event.scale = 4;
            return;
        }
        if (d3.event.scale >= 1 && d3.event.scale <= 4) {
            d3.select("#mapcontainer")
                //.transition().duration(500)
                .attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
        }

    }

    //
    // Tooltip Object Maker
    //
    var tooltip = function (id, xy, innerHtml, classes) {

        var that        = {},
            tooltip     = d3.select("body").append("div")
                            .attr("class", "tooltip " + (classes || ""))
                            .attr("id", id)
                            .style("left", xy[0] + "px")
                            .style("top", xy[1] + "px")
                            .style("opacity", 0);

        tooltip.html(innerHtml);

        //
        that.show = function () {
            tooltip.transition()
                .duration(100)
                .style("opacity", 1);
            return that;
        };

        //
        that.hide = function () {
            tooltip.transition()
                .duration(200)
                .style("opacity", 0);
            return that;
        };

        //
        that.html = function (newHtml) {
            tooltip.html(newHtml);
            return that;
        };

        //
        that.style = function (attr, value) {
            tooltip.style(attr, value);
            return that;
        };

        //
        that.move = function (xy) {
            tooltip.style("left", xy[0] + "px")
                .style("top", xy[1] + "px");
            return that;
        };

        return that;

    };

    //
    // Pin Cohort Object Maker.
    //
    var cohortPin = function (parent, cohort, country) {

        var that            = {"cohort": cohort, "country": country},
            countryData     = cohort.getCountryData(country.id()),
            color           = util.networkColor.get(cohort.networks[0]),
            scale           = d3.scale.linear()
                                .domain([0, 200000])
                                .range([5, 30]),
            size            = scale(cohort.size),
            x               = countryData.x,
            y               = countryData.y,
            radius          = config.map.cohort.pinsize,
            width           = 2 * radius,
            height          = 3 * radius,
            g               = parent.append("g")
                                .attr("class", "pin cohort")
                                .attr('transform', 'translate(' + x + ',' + y + ')'),
            arc             = d3.svg.arc()
                                .innerRadius(0)
                                .outerRadius(radius / 2)
                                .startAngle(0)
                                .endAngle((cohort.size / config.map.cohort.limit) * 2 * pi),
            arct            = d3.svg.arc()
                                .innerRadius(0)
                                .outerRadius(6)
                                .startAngle(0)
                                .endAngle((cohort.size / config.map.cohort.limit) * 2 * pi),
            symbol          = d3.svg.symbol()
                                .type(config.map.cohort.pinsymbol)
                                .size(4),
            gselect         = g.append("circle")
                                .attr("cx", 0)
                                .attr("cy", 0)
                                .style("fill", color)
                                .style("display", "none")
                                .style("opacity", "0.7")
                                .attr("r", radius),
            link;

        //
        function isSameStatus(status) {
            return (status === "All") || (cohort.status === status);
        }

        //
        function enter() {

            if (typeof selectedCohort !== "undefined" && selectedCohort !== that) {
                selectedCohort.exit(true);
                selectedCohort = undefined;
            }
            if (typeof selectedCohort === "undefined" || selectedCohort !== that) {
                if (link) {
                    link.select(true);
                } else {
                    that.select(true);
                }
                enterCountry(that.country.id());
                tooltip();
            }

        }

        //
        that.exit = function (force) {

            if (force || typeof selectedCohort === "undefined" || selectedCohort !== that) {
                if (link) {
                    link.select(false);
                } else {
                    that.select(false);
                }
                exitCountry(that.country.id());
                tooltipCohort.hide();
            }

        };

        //
        function tooltip() {

            tooltipCohort.html(that.cohort.html()).show();

            d3.select("#ctooltippin")
                .append("svg")
                .attr("class", "tooltip")
                .append("g")
                .attr("transform", "translate(6, 6)")
                .append("path")
                .attr("class", "")
                .style("fill", config.map.cohort.pincolor, "opacity", 1)
                .attr("d", arct);

        }

        //
        that.filter = function () {
            var show = filter.networks[cohort.networks[0]];
            show = show && isSameStatus(filter.enrollmentStatus);
            that.setVisible(show);
            return that;
        };

        that.getXY = function () {
            return {"x": x, "y": y};
        };

        that.addLink = function (l) {
            link = l;
        };

        //
        that.setVisible = function (visible) {
            g.style('display', visible ? 'inline' : 'none');
            return that;
        };

        //
        that.getNode = function () {
            return g;
        };

        //
        that.getColor = function () {
            return color;
        };

        //
        that.select = function (selected) {
            gselect.style("display", selected ? "inline" : "none");
        };

        //
        that.draw = function () {

            g.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("class", "pin")
                .style("fill", "white", "opacity", 0.7)
                .attr("r", radius / 2);

            g.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .style("fill", "none", "opacity", 1)
                .style('stroke', config.map.cohort.pincolor)
                .style('stroke-width', "1px")
                .attr("r", radius / 2);

            g.append("path")
                .attr("class", "")
                .style("fill", config.map.cohort.pincolor, "opacity", 1)
                .attr("d", arc);

            g.append("path")
                .style("fill", color, "opacity", 1)
                .attr('transform', 'translate(0,-4)')
                .attr("d", symbol);

            g.on('mouseover', function (d) {
                enter();
            });

            g.on('mouseout', function (d) {
                that.exit(false);
            });

            g.on('click', function (d) {
                if (selectedCohort === that) {
                    return;
                }
                selectedCohort = that;
            });

            return that; // chaining

        };


        return that;

    };

    //
    // Link Object Maker.
    //
    var link = function (parent, color) {

        var that        = {"elements": [], "color": color, "closed": false},
            pathInfo    = [],
            d3line      = d3.svg.area()
                            .x(function (d) {return d.x; })
                            .y(function (d) {return d.y; })
                            .interpolate(config.map.cohort.link.interpolate),
            g           = parent.append("g")
                            .attr("class", "link cohort")
                            .style("display", "none");

        // 
        that.add = function (elt) {
            var xy = elt.getXY();
            //xy.y += config.map.cohort.pinsize;
            that.elements.push(elt);
            pathInfo.push(xy);
            pathInfo.sort(function (p1, p2) {
                return p1.y - p2.y;
            });
        };

        //
        that.select = function (selected) {
            that.setVisible(selected);
            that.elements.forEach(function (e) {
                e.select(selected);
            });
        };

        //
        that.setVisible = function (visible) {
            g.style('display', visible ? 'inline' : 'none');
            return that;
        };

        //
        that.close = function () {
            if (that.closed) {
                return;
            }
            pathInfo.push(that.elements[0].getXY());
            that.closed = true;
            return that;
        };

        //
        that.draw = function () {
            g.append("path")
                .attr("d", d3line(pathInfo))
                .style("stroke-width", 0.5)
                .style("stroke", config.map.cohort.pincolor)
                .style("fill", "none");
            return that;
        };

        return that;

    };


    //
    //
    //  Graph Component
    //  Display World Map  
    //
    var makeMap = function () {

        var posx            = -100,
            posy            = -20,
            centered,
            g               = mapsvg.append("g")
                                .attr("id", "mapcontainer")
                                .attr('transform', 'translate(' + posx + ',' + posy + ')'),
            gmap            = g.append("g")
                                .attr("id", "map")
                                .attr("class", "map"),
            gpins_country   = g.append("g")
                                .attr("id", "pins_country")
                                .attr("class", "pin country")
                                .style("display", IAS.filter.viewCountryPins ? 'inline' : 'none'),
            glinks_cohort   = g.append("g")
                                .attr("id", "links_cohort")
                                .attr("class", "link cohort"),
            gpins_cohort    = g.append("g")
                                .attr("id", "pins_cohort")
                                .attr("class", "pin cohort");

        //
        function click(d) {

            var x   = 0,
                y   = 0,
                tx  = posx,
                ty  = posy,
                k   = 1,
                centroid;

            if (d && centered !== d) {
                centroid = path.centroid(d);
                x = -centroid[0];
                y = -centroid[1];
                k = 3;
                tx = x + config.map.width / 2 / k;
                ty = y + config.map.height / 2 / k;
                centered = d;
            } else {
                centered = null;
            }

            // gmap.selectAll("path")
            //     .classed("active", centered && function(d) { return d === centered; });
            g.transition().duration(1000)
                .attr("transform", "scale(" + k + ") translate(" + tx + "," + ty + ")").style("stroke-width", 1.5 / k + "px");

        }

        //
        function getCountryColor(d) {

            var country = model.getCountry(d.properties.name),
                rate    = country.hivPrevalenceRate;
            if (rate !== undefined) {
                return util.mapColors(rate);
            }
            return "gray";

        }

        //
        function draw() {

            var gCohortPins = {},
                lnk         = {},
                key;

            // draw map
            gmap.selectAll("path")
                .data(model.worldJson.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", path).style("fill", function (d) {return getCountryColor(d); })
                .attr("id", function (d) {return d.id; })
                .on('mouseover', function (d) {enterCountry(d.id); })
                .on('mouseout', function (d) {exitCountry(d.id); })
                .style("opacity", config.map.background.opacity)
                .on('click', click);

            gmap.select("#ATA").remove(); // remove Antartic

            // draw pins layer
            model.countriesWithCohorts.forEach(function (country) {

                var n       = country.numberOfCohorts(),
                    pin     = {};

                if (n > 0) {

                    // make and draw cohort pins
                    country.cohorts.forEach(function (cohort) {
                        pin = cohortPin(gpins_cohort, cohort, country).draw();
                        if (typeof gCohortPins[cohort.code] === "undefined") {
                            gCohortPins[cohort.code] = [pin];
                        } else {
                            gCohortPins[cohort.code].push(pin);
                        }
                        cohortPins.push(pin);
                    });

                }

            });

            // make and draw cohort links
            for (key in gCohortPins) {

                if (gCohortPins[key].length > 1) {
                    lnk = link(glinks_cohort, gCohortPins[key][0].getColor());
                    gCohortPins[key].forEach(function (p) {
                        lnk.add(p);
                        p.addLink(lnk);
                    });
                    lnk.draw();
                }

            }

        }

        // 
        function update() {

        }

        //
        function filterUpdate() {

            gpins_country.style("display", IAS.filter.viewCountryPins ? 'inline' : 'none');
            gpins_cohort.style("display", IAS.filter.viewCohortPins ? 'inline' : 'none');
            cohortPins.forEach(function (d) {
                d.filter();
            });

        }

        // public
        return {

            draw: draw,
            update: update,
            filterUpdate: filterUpdate

        };

    };

    //
    // Graph Component 
    // Map Legend
    //
    var makeLegend = function () {

        var posx            = 0,
            posy            = 20,
            gbackground     = legendsvg.append("g")
                                .attr("id", "blegend")
                                .attr('transform', 'translate(' + posx + ',' + posy + ')'),
            gcohort         = legendsvg.append("g")
                                .attr("id", "clegend")
                                .attr('transform', 'translate(' + (posx + 200) + ',' + posy + ')'),
            arc             = d3.svg.arc()
                                .innerRadius(0)
                                .outerRadius(8)
                                .startAngle(0);

        //
        function draw() {

            var data        = util.mapColors.quantiles(),
                maxColors   = util.mapColors.range().length;

            gbackground.selectAll("rect")
                .data(data)
                .enter().append("rect")
                .attr('class', 'legend')
                .attr("x", function (d, i) {return i * 20 + 10; })
                .attr("y", 20)
                .attr("width", 20)
                .attr("height", 20)
                .style("stroke", "#000")
                .style("stroke-width", ".3px")
                .style("fill", function (d) {return util.mapColors(d); })
                .style("opacity", config.map.background.opacity)
                .attr("dx", -3) // padding-right
                .attr("dy", ".35em"); // vertical-align: middle

            gbackground.append("rect")
                .attr('class', 'legend')
                .attr("x", (maxColors - 1) * 20 + 15)
                .attr("y", 20).attr("width", 20)
                .attr("height", 20)
                .style("stroke", "#000")
                .style("stroke-width", ".3px")
                .style("fill", 'gray')
                .attr("dx", -3) // padding-right
                .attr("dy", ".35em"); // vertical-align: middle

            data.push('n/a');

            gbackground.selectAll("text")
                .data(data)
                .enter().append("text")
                .attr("x", function (d, i) {return i * 20 + ((d !== 'n/a') ? 10 : 15); })
                .attr("y", 18).attr("class", "legend").text(function (d) {return (d !== 'n/a') ? '>' + parseFloat(d).toFixed(1) : d; });

            gbackground.append("text")
                .attr("x", 10)
                .attr("y", 8)
                .attr("class", "title legend")
                .text("HIV Prevalence Rate (%)");


            var data2 = [config.map.cohort.limit / 6], i = 0;
            for (i = 1; i <= 4; i++) {
                data2[i] = config.map.cohort.limit * i / 4;
            }

            gcohort.selectAll("circle")
                .data(data2).enter()
                .append("circle")
                .attr("cx", function (d, index) { return index * 26 + 17; })
                .attr("cy", 30)
                .style("fill", "none", "opacity", 1)
                .style('stroke', config.map.cohort.pincolor)
                .style('stroke-width', "4px")
                .attr("r", 9);

            gcohort.selectAll("path")
                .data(data2).enter()
                .append("path")
                .attr("class", "")
                .attr("transform", function (d, index) { return "translate(" + (index * 26 + 17) + ",30)"; })
                .style("fill", config.map.cohort.pincolor, "opacity", 1)
                .attr("d", arc.endAngle(function (d) { return (d / config.map.cohort.limit) * 2 * pi; }));

            gcohort.selectAll("text")
                .data(data2)
                .enter().append("text")
                .attr("x", function (d, i) {return i * 26 + 4; })
                .attr("y", 18).attr("class", "legend")
                .text(function (d, i) {return (i === 4) ? '>' + d : d; });

            gbackground.append("text")
                .attr("x", 200)
                .attr("y", 8)
                .attr("class", "title legend")
                .text("Cohort Size");

        }

        // 
        function update() {

        }

        //
        function filterUpdate() {

        }

        // public
        return {

            draw: draw,
            update: update,
            filterUpdate: filterUpdate

        };


    };

    //
    // Init Function:
    //
    that.init = function (centroids) {

        config = IAS.util.config;

        mapsvg = d3.select("#map")
                .append("svg")
                .attr("width", config.map.width)
                .attr("height", config.map.height);

        legendsvg = d3.select("#legend")
                .append("svg")
                .attr("width", config.legend.width)
                .attr("height", config.legend.height);

        that.map = makeMap();
        that.components.push(that.map);

        that.legend = makeLegend();
        that.components.push(that.legend);

        var overloadCentroids = {};
        centroids.forEach(function (c) {
            overloadCentroids[c.id] = c.ll;
        });

        tooltipCountry = tooltip("tooltipCountry", config.map.tooltip.country, "", "country");
        tooltipCohort = tooltip("tooltipCohort", config.map.tooltip.cohort, "", "cohort");

        // augment IAS domain with graphic behaviors
        model.countriesWithCohorts.forEach(function (country) {
            // check if centroid is modified
            var coords      = [],
                overcoords  = overloadCentroids[country.name()],
                d,
                scale,
                delta,
                n;

            if (overcoords === undefined) {
                // compute country centroid
                coords = path.centroid(country.feature);
            } else {
                coords = projection(overcoords);
            }
            country.centroidx = coords[0];
            country.centroidy = coords[1];
            // compute cohorts x,y coordinates
            if (country.cohorts.length === 1) {
                d = country.cohorts[0].getCountryData(country.id());
                d.x = coords[0];
                d.y = coords[1];
            } else {
                n = country.cohorts.length;
                scale = d3.scale.linear().domain([0, n]).range([-n / 2, n / 2]);
                country.cohorts.forEach(function (cohort, index) {
                    d = cohort.getCountryData(country.id());
                    delta = scale(index) * (config.map.cohort.pinsize + 1);
                    d.x = coords[0] + delta;
                    d.y = coords[1];
                });

            }


        });

        // register graph components as filter listener
        that.components.forEach(function (c) {
            IAS.filter.addListener(c);
        });

    };


    return that;


})();