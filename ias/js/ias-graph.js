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

    var that        = {},
        model       = IAS.model,
        config      = IAS.config,
        filter      = IAS.filter,
        log         = IAS.log,
        pi          = Math.PI,
        projection  = d3.geo.equirectangular().scale(140),
        path        = d3.geo.path().projection(projection),
        mapsvg      = d3.select("#map")
                        .append("svg")
                        .attr("width", config.width)
                        .attr("height", config.heightmap),
        legendsvg   = d3.select("#legend")
                        .append("svg")
                        .attr("width", config.width)
                        .attr("height", 80),
        cohortPins  =[];

    //.call(d3.behavior.zoom().on("zoom", zoom)); // TODO activate zoom

    that.components = [];

    //
    //
    //
    function enterCountry(countryName) {

        var countryId = countryName.replace(/ /g, '');

        d3.select("#" + countryId)
            .style('stroke', "steelblue")
            .style('stroke-width', "1px");

    }

    //
    //
    //
    function exitCountry(countryName) {

        var countryId = countryName.replace(/ /g, '');

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
    //  Pin Country object.
    //
    function CountryPin(parent, color, size, country) {

        this.country = country;
        this.text = country.numberOfCohorts();
        this.color = color;
        this.size = size;
        this.x = this.country.centroidx;
        this.y = this.country.centroidy;
        this.radius = size / 2;
        this.height = 4 * this.radius;

        var g   = parent.append("g")
                    .attr("class", "pin country")
                    .attr('transform', 'translate(' + this.x + ',' + (this.y - this.height) + ')')
                    .on('mouseover', function (d) {
                        enterCountry(country.name());
                    })
                    .on('mouseout', function (d) {
                        exitCountry(country.name());
                    }),
            arc = d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(this.radius)
                    .startAngle(0)
                    .endAngle(2 * pi);

        //
        this.draw = function () {

            var r = this.radius,
                h = this.height;

            g.append("path")
                .attr("class", "pin")
                .attr("d", arc);

            g.append('path')
                .attr("class", "pin")
                .attr('d', function (d) {
                    return 'M ' + (-r / 2) + ' 0 l ' + r + ' 0 l ' + -r / 2 + ' ' + h + ' z';
                });

            g.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("class", "pin")
                .style("fill", this.color)
                .attr("r", r - 2);

            g.append("text")
                .attr("dx", 0)
                .attr("dy", "0.35em")
                .attr("class", 'pin')
                .style("text-anchor", "middle")
                .text(this.text);

            return this; // chaining
        };

        //
        this.setVisible = function (visible) {

            g.style('display', visible ? 'inline' : 'none');
            return this;

        };


    } // end of object Pin

    //
    // Pin Cohort object.
    //
    function CohortPin(parent, color, cohort, country) {

        this.cohort = cohort;
        this.country = country;
        this.countryData = cohort.getCountryData(country.id());
        this.color = color;
        this.scale = d3.scale.linear()
            .domain([0, 200000])
            .range([5, 30]);
        this.size = this.scale(this.cohort.size);
        this.x = this.countryData.x;
        this.y = this.countryData.y;
        this.radius = this.size / 2;
        this.width = 2 * this.radius;
        this.height = 3 * this.radius;


        var g = parent.append("g")
            .attr("class", "pin cohort")
            .attr('transform', 'translate(' + this.x + ',' + this.y + ')');
        // .on('mouseover', function (d) {enterCountry(country.name());})
        // .on('mouseout', function (d) {exitCountry(country.name());});

        //
        this.getNetworkCode = function () {
            return cohort.networks[0];
        };

        //
        this.draw = function () {

            g.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("class", "pin")
                .style("fill", this.color, "opacity", 1)
                .attr("r", this.radius / 2);

            return this; // chaining
        };

        //
        this.setVisible = function (visible) {
            g.style('display', visible ? 'inline' : 'none');
            return this;
        };


    } // end of object Pin

    //
    //
    //  Graph Component
    //  Display World Map  
    //
    that.map = (function () {

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
                tx = x + config.width / 2 / k;
                ty = y + config.heightmap / 2 / k;
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
                return config.mapColors(rate);
            }
            return "gray";

        }

        //
        function draw() {

            // draw map
            gmap.selectAll("path")
                .data(model.worldJson.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", path).style("fill", function (d) {return getCountryColor(d); })
                .attr("id", function (d) {return d.properties.name.replace(/ /g, ''); })
                .on('mouseover', function (d) {enterCountry(d.properties.name); })
                .on('mouseout', function (d) {exitCountry(d.properties.name); })
                .on('click', click);

            gmap.select("#Antarctica")
                .remove();

            // draw pins layer
            model.countriesWithCohorts.forEach(function (country) {

                var n = country.numberOfCohorts();
                if (n > 0) {
                    var pin = new CountryPin(gpins_country, "white", 12, country);
                    pin.draw();
                    country.cohorts.forEach(function (cohort) {
                        var col = config.networkColors.get(cohort.networks[0]);
                        var pin = new CohortPin(gpins_cohort, col, cohort, country);
                        cohortPins.push(pin);
                        pin.draw();
                    });
                }

            });

        }

        // 
        function update() {

        }

        //
        function filterUpdate() {

            gpins_country.style("display", IAS.filter.viewCountryPins ? 'inline' : 'none');
            gpins_cohort.style("display", IAS.filter.viewCohortPins ? 'inline' : 'none');
            cohortPins.forEach(function(d){
                d.setVisible(filter.networks[d.getNetworkCode()]);
            });

        }

        // public
        return {

            draw: draw,
            update: update,
            filterUpdate: filterUpdate

        };

    }());
    that.components.push(that.map);


    //
    // Graph Component 
    // Map Legend
    //
    that.legend = (function () {

        var posx    = 0,
            posy    = 20,
            g       = legendsvg.append("g")
                        .attr("id", "legend")
                        .attr('transform', 'translate(' + posx + ',' + posy + ')');

        //
        function draw() {

            var data        = config.mapColors.quantiles(),
                maxColors   = config.mapColors.range().length;

            g.selectAll("rect")
                .data(data)
                .enter().append("rect")
                .attr('class', 'legend')
                .attr("x", function (d, i) {return i * 20 + 10; })
                .attr("y", 20)
                .attr("width", 20)
                .attr("height", 20)
                .style("stroke", "#000")
                .style("stroke-width", ".3px")
                .style("fill", function (d) {return config.mapColors(d); })
                .attr("dx", -3) // padding-right
                .attr("dy", ".35em"); // vertical-align: middle

            g.append("rect")
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

            g.selectAll("text")
                .data(data)
                .enter().append("text")
                .attr("x", function (d, i) {return i * 20 + ((d !== 'n/a') ? 10 : 15); })
                .attr("y", 18).attr("class", "legend").text(function (d) {return (d !== 'n/a') ? '>' + parseFloat(d).toFixed(1) : d; });

            g.append("text")
                .attr("x", 10)
                .attr("y", 8)
                .attr("class", "title legend")
                .text("HIV Prevalence Rate (%)");

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


    }());
    that.components.push(that.legend);


    //
    // Init Function:
    //
    that.init = function (centroids) {


        var overloadCentroids = {};
        centroids.forEach(function (c) {
            overloadCentroids[c.id] = c.ll;
        });

        // augment IAS domain with graphic behaviors
        model.countriesWithCohorts.forEach(function (country) {
            // check if centroid is modified
            var coords      = [],
                overcoords  = overloadCentroids[country.name()],
                d,
                scale,
                angle;

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
                scale = d3.scale.linear().domain([0, country.cohorts.length]).range([0, 2 * pi]);
                country.cohorts.forEach(function (cohort, index) {
                    d = cohort.getCountryData(country.id());
                    angle = scale(index);
                    d.x = coords[0] + Math.cos(angle) * 2;
                    d.y = coords[1] + Math.sin(angle) * 2;
                });

            }


        });

        config.mapColors.domain(model.hivRatesRange);
    };

    // register graph components as filter listener
    that.components.forEach(function (c) {
        IAS.filter.addListener(c);
    });

    return that;


})();