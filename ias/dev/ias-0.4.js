
var ias = {"version": "v0.4", "mode": "offline"};

ias.app = {};
ias.util = {};
ias.model = {};
ias.filter = {};
ias.graph = {};

(function () {
	"use strict";


	var	config,
		log;

	// log wrapper
	log = function () {
	    if (console && console.log) {
	        console.log.apply(console, arguments);
	    }
	};


    // util
    ias.util = (function () {

        var that            = {},
            backgroundScale = d3.scale.linear().domain([0, 26]),
            networkColors   = {},
            networkSchemes;

        //
        that.getNetworkColor = function (code) {
            if (networkColors.hasOwnProperty(code)) {
                return networkColors[code];
            }
            log("network color for" + code + " not found");
            return "white";
        };

        //
        that.getBackgroundColor = function (rate) {
            return backgroundScale(rate);
        };

        //
        that.getBackgroundColorSteps = function (rate) {
            return config.map.background.steps;
        };

        //
        that.getCountryId = function (feature) {
            var i = feature.id;
            if (i === "-99") { // exotic countries!
                return "9" + feature.properties.name.substring(0, 2);
            }
            return feature.id;
        };

        //
        // Init Function
        //
        that.init = function (networks, hivrates) {

            var domainRates = [];

            networkSchemes = config.network.colorSchemes;
            var colorScale;
            networks.children.forEach(function (n, index) {
                colorScale = d3.scale.ordinal().range(colorbrewer[networkSchemes[index]][6]);
                n.children.forEach(function (d) {
                    networkColors[d.code] = colorScale(d.code);
                });
            });

            hivrates.forEach(function (r) {
                domainRates.push(r.rate);
            });

            backgroundScale.domain(domainRates);

            backgroundScale
                .range(colorbrewer[config.map.background.scheme][config.map.background.steps.length]);


        };


        return that;

    }());


    ias.filter = (function () {


        var that        = {},
            listeners   = [],
            years       = [],
            y;

        that.backgroundInfo     = "";
        that.year               = 1980;
        that.viewCountryPins    = false;
        that.viewCohortPins     = true;
        that.networks           = {};
        that.enrollmentStatus   = "All";

        for (y = 1980; y <= 2013; y++) {
            years.push(y);
        }


        that.addListener = function (listener) {

            // TODO test for filterUpdate function
            listeners.push(listener);

        };

        function dispatchFilterEvent() {

            listeners.forEach(function (l) {
                l.filterUpdate();
            });

        }


        //
        // Background Information Option
        //
        d3.select("#backgroundInfo").on("change", function (d) {
            var v = this.options[this.selectedIndex].value;
            that.backgroundInfo = v;
            dispatchFilterEvent();
        });

        //
        // Filtering Options
        //
        d3.select("#year")
            .on("change", function (y) {
                that.year = parseInt(this.options[this.selectedIndex].value);
                dispatchFilterEvent();
            })
            .selectAll("option")
            .data(years).enter()
            .append("option")
            .attr("value", function (d) {return d; })
            .text(function (d) {return d; });

        //
        // INIT FUNCTION
        //
        that.init = function (networksJson) {

            var data,
                nodeEnter;

            d3.select("#status")
                .on("change", function (y) {
                    that.enrollmentStatus = this.options[this.selectedIndex].value;
                    dispatchFilterEvent();
                })
                .selectAll("option")
                .data(config.filter.status)
                .enter()
                .append("option")
                .attr("value", function (d) {return d; })
                .text(function (d) {return d; });


             //
            function getClass(network, networkParent) {
                var code = network.code;
                if (code === "EuroCoord" || code === "IeDEA" || code === "Other") {
                    return "network";
                }
                return "network " + networkParent;
            }

            //
            function color(code) {
                if (code === "EuroCoord" || code === "IeDEA" || code === "Other") {
                    return "white";
                }
                return ias.util.getNetworkColor(code);
            }

            //
            function click(input, network) {
                var code = network.code;
                if (code === "EuroCoord" || code === "IeDEA" || code === "Other") {
                    d3.selectAll("input.network." + code).each(function (n) {
                        d3.select(this).property("checked", input.checked);
                        that.networks[n.code] = input.checked;
                    });
                } else {
                    that.networks[code] = input.checked;
                }
                dispatchFilterEvent();
            }

            //
            networksJson.children.forEach(function (d, index) {

                data = d.children;
                data.forEach(function (d) {
                    that.networks[d.code] = true;
                });

                data.unshift({code: d.code, name: d.name});

                nodeEnter = d3.select("#" + d.code).selectAll("div")
                            .data(data)
                            .enter()
                            .append("div")
                            .attr("class", function (v) {return d.code !== v.code ? "subnetwork" : "network"; });

                nodeEnter.append("input")
                    .attr("checked", true)
                    .attr("class", function (v) {return getClass(v, d.code); })
                    .attr("type", "checkbox")
                    .attr("id", function (v) {return 'n' + v.code; })
                    .on("click", function (v) {return click(this, v); });

                nodeEnter.append("span")
                    .attr("class", "network")
                    .style("background", function (v) {return color(v.code); })
                    .style("color", function (v) {return color(v.code); })
                    .text('\u0020.\u0020');

                nodeEnter.append("label")
                    .attr("class", function (v) {return d.code === v.code ? "network title" : "network"; })
                    .attr("for", function (v) {return 'n' + v.code; })
                    .text(function (d) {return d.name; });

                if (d !== "Other") {
                    nodeEnter.append("br");
                }

            });

        };

        return that;

    }());


	ias.model = (function () {


		var that    = {

			worldJson: {}, // GEO JSON world countries
			networks: {}, // Network JSON data
			allcountries: [], // all countries references
			allcountriesByName: {}, // lookup table Country Code <-> Country object
			allcountriesById: {}, // lookup table Country Id <-> Country object
			countriesWithCohorts: [], // country references with cohorts only
			cohorts: [] // all cohort references
		};


		function addCountry(feature) {

			var c = Object.create(ias.model.Country);
			c.feature = feature;
			c.cohorts = [];
			that.allcountries.push(c);
			that.allcountriesByName[c.name()] = c;
			that.allcountriesById[c.id()] = c;

		}


		function addCohort(cohortJson) {

			var c = Object.create(ias.model.Cohort);
			c.status = cohortJson.status;
			c.code = cohortJson.code;
			c.name = cohortJson.name;
			c.objectives = cohortJson.objectives;
			c.year = cohortJson.year;
			c.size = cohortJson.size;
			c.countryData = {};
			cohortJson.countries.forEach(function (d) {
				var country = that.allcountriesByName[d];
				if (country) {
					c.addCountryData(country.id(), 10);
					country.cohorts.push(c); // bidirectional link
					country.networks = [];
					country.networks.push(cohortJson.networks);
				} else {
					log("no country found for " + d);
				}
			});
			c.networks = cohortJson.networks;
			that.cohorts.push(c);

		}


		that.getCountry = function (name) {
			var c = that.allcountriesByName[name];
			return c;
		};


		that.init = function (world, networksJson, cohortsJson, hivrates) {

			that.worldJson = world;
			that.networks = networksJson.children;

			// init countries
			that.worldJson.features.forEach(function (f) {
				addCountry(f);
			});
			hivrates.forEach(function (r) {
				var c = that.allcountriesByName[r.country];
				if (c !== undefined) {
					c.hivPrevalenceRate = parseFloat(r.rate);
				} else {
					log('HIV Rates: no country found for ' + r.country);
				}
			});

			// init cohorts
			cohortsJson.cohorts.forEach(function (d) {
				addCohort(d);
			});

			//
			that.allcountries.forEach(function (c) {
				if (c.numberOfCohorts() > 0) {
					that.countriesWithCohorts.push(c);
				}
			});

		};

		return that;

	}());


	ias.model.Country = {

		feature: {},
		networks: [],
		cohorts: [],
		hivPrevalenceRate: undefined,
		arvCoverageRate: undefined,

		id: function () {
			return ias.util.getCountryId(this.feature);
		},

		name: function () {
			return this.feature.properties.name;
		},

		numberOfCohorts: function () {
			return this.cohorts ? this.cohorts.length : 0;
		},

		html: function () {
			var h 		= "<span class='tooltip title'>Country</span><h1 class='tooltip'>" + this.name() + "</h1><table>",
				color 	= "white";

			h += "<tr><td class='firstcol'>HIV Prevalence Rate</td><td class='secondcol'>" + (this.hivPrevalenceRate || 'na') + " %</td></tr>";
			h += "<tr><td>ARV Coverage Rate</td><td class='secondcol'>" + (this.arvCoverageRate || 'na')  + " %</td></tr>";
			if (this.cohorts && this.cohorts.length > 0) {
				h += "<tr><td colspane='2'><br><b>COHORTS:</b></td></tr>";
				this.cohorts.forEach(function (c) {
					color = ias.util.getNetworkColor(c.networks[0]);
					h += "<tr><td class='firstcol'><span style='background:" + color + ";'>&nbsp;&nbsp;&nbsp;</span>&nbsp;" + c.name + "</td><td class='secondcol'>" + c.size + "</td></tr>";
				});
			}
			h += "</table>";
			return h;
		}

	};

	ias.model.CountryData = {

		countryId: "",
		size: 0

	};

	ias.model.Cohort = {

		status: "",
		code: "",
		name: "",
		year: 1980,
		objectives: "",
		size: 0,
		networks: [],
		countryData: {},
		numberOfCountries: 0,

		getCountryData: function (countryId) {
			return this.countryData[countryId];
		},

		addCountryData: function (id, size) {
			var d = Object.create(ias.model.CountryData);
			d.countryId = id;
			d.size = size;
			this.countryData[id] = d;
			this.numberOfCountries += 1;
		},

		html: function () {
			var h 		= "<span class='tooltip title'>Cohort</span><h1 class='tooltip'>" + this.name + ":</h1>",
				color 	= "white",
				country,
				rate,
				k;
			h += "<div id='ctooltippin'></div>&nbsp;" + this.size + " subjects ";
			h += "&nbsp;<span style='background:" + ias.util.getNetworkColor(this.networks[0]) + ";'>&nbsp;&nbsp;&nbsp;</span>&nbsp" + this.networks[0];
			h += "<br><br><b>Status:</b>&nbsp;" + this.status + "<br>";
			h += "<br><b>Objectives:</b><br>";
			h += "<span class='tooltip objectives'>" + this.objectives + "</span>";
			h += "<br><br><b>Countries:</b><br><table>";
			for (k in this.countryData) {
				country = ias.model.allcountriesById[k];
				rate = country.hivPrevalenceRate;
				color = ias.util.getBackgroundColor(rate);
				h += "<tr><td class='firstcol'><span style='background:" + color + ";'>&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;" + country.name() + "</td></tr>";
			}
			h += "</table>";
			h += "<br><br><a class='tooltip' target='_blank' href='" + config.map.cohort.fullProfile.replace('$code$', this.code) + "'>View Full Profile</a>";

			return h;
		}

	};

    ias.graph = (function () {


        var that  = {

            components: [],
            selectedCohort: undefined,
            tooltip: {
                country: {},
                cohort: {}
            }

        };

        that.projection = d3.geo.equirectangular().scale(140);
        that.path = d3.geo.path().projection(that.projection);

        //
        //
        //
        that.enterCountry = function (countryId) {
            var country = ias.model.allcountriesById[countryId];
            that.tooltip.country.html(country.html()).show();
            try {
                d3.select("#" + countryId)
                    .style('stroke', "steelblue")
                    .style('stroke-width', "1px");
            } catch (err) {
                log(err); // TODO exotic countries with id = -99!
            }
        };

        //
        //
        //
        that.exitCountry = function (countryId) {
            that.tooltip.country.hide();
            try {
                d3.select("#" + countryId)
                    .style('stroke', "white")
                    .style('stroke-width', "0px;");
            } catch (err) {
                log(err); // TODO exotic countries with id = -99!
            }

        };

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
        // Init Function:
        //
        that.init = function (centroids) {

            var mapsvg, legendsvg;

            mapsvg = d3.select("#map")
                    .append("svg")
                    .attr("width", config.map.width)
                    .attr("height", config.map.height);

            legendsvg = d3.select("#legend")
                    .append("svg")
                    .attr("width", config.legend.width)
                    .attr("height", config.legend.height);

            that.map = ias.graph.map(mapsvg);
            that.components.push(that.map);

            that.legend = ias.graph.legend(legendsvg);
            that.components.push(that.legend);

            var overloadCentroids = {};
            centroids.forEach(function (c) {
                overloadCentroids[c.id] = c.ll;
            });

            that.tooltip.country = ias.graph.tooltip("tooltipCountry", config.map.tooltip.country, "", "country");
            that.tooltip.cohort = ias.graph.tooltip("tooltipCohort", config.map.tooltip.cohort, "", "cohort");

            // augment IAS domain with graphic behaviors
            ias.model.countriesWithCohorts.forEach(function (country) {
                // check if centroid is modified
                var coords      = [],
                    overcoords  = overloadCentroids[country.name()],
                    d,
                    scale,
                    delta,
                    n;

                if (overcoords === undefined) {
                    // compute country centroid
                    coords = that.path.centroid(country.feature);
                } else {
                    coords = that.projection(overcoords);
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
                ias.filter.addListener(c);
            });

        };


        return that;


    }());


    ias.graph.tooltip = function (id, xy, innerHtml, classes) {

        var that        = {},
            tooltip     = d3.select("body").append("div")
                            .attr("class", "tooltip " + (classes || ""))
                            .attr("id", id)
                            .style("left", xy[0] + "px")
                            .style("top", xy[1] + "px")
                            .style("opacity", 0)
                            .html(innerHtml);

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

    ias.graph.link = function (parent, color) {

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

    ias.graph.pin = function (parent, cohort, country) {

        var that            = {"cohort": cohort, "country": country},
            countryData     = cohort.getCountryData(country.id()),
            color           = ias.util.getNetworkColor(cohort.networks[0]),
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
                                .endAngle((cohort.size / config.map.cohort.limit) * 2 * Math.PI),
            arct            = d3.svg.arc()
                                .innerRadius(0)
                                .outerRadius(6)
                                .startAngle(0)
                                .endAngle((cohort.size / config.map.cohort.limit) * 2 * Math.PI),
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
        function tooltip() {

            ias.graph.tooltip.cohort.html(that.cohort.html()).show();

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
        function enter() {

            if (ias.graph.selectedCohort !== undefined && ias.graph.selectedCohort !== that) {
                ias.graph.selectedCohort.exit(true);
                ias.graph.selectedCohort = undefined;
            }
            if (ias.graph.selectedCohort === undefined || ias.graph.selectedCohort !== that) {
                if (link) {
                    link.select(true);
                } else {
                    that.select(true);
                }
                ias.graph.enterCountry(that.country.id());
                tooltip();
            }

        }

        //
        that.exit = function (force) {

            if (force || ias.graph.selectedCohort === undefined || ias.graph.selectedCohort !== that) {
                if (link) {
                    link.select(false);
                } else {
                    that.select(false);
                }
                ias.graph.exitCountry(that.country.id());
                ias.graph.tooltip.cohort.hide();
            }

        };

        //
        that.filter = function () {
            var show = ias.filter.networks[cohort.networks[0]];
            show = show && isSameStatus(ias.filter.enrollmentStatus);
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
                if (ias.graph.selectedCohort === that) {
                    return;
                }
                ias.graph.selectedCohort = that;
            });

            return that; // chaining

        };


        return that;

    };

    ias.graph.map = function (svg) {

        var posx            = -100,
            posy            = -20,
            centered,
            g               = svg.append("g")
                                .attr("id", "mapcontainer")
                                .attr('transform', 'translate(' + posx + ',' + posy + ')'),
            gmap            = g.append("g")
                                .attr("id", "map")
                                .attr("class", "map"),
            gpins_country   = g.append("g")
                                .attr("id", "pins_country")
                                .attr("class", "pin country")
                                .style("display", ias.filter.viewCountryPins ? 'inline' : 'none'),
            glinks_cohort   = g.append("g")
                                .attr("id", "links_cohort")
                                .attr("class", "link cohort"),
            gpins_cohort    = g.append("g")
                                .attr("id", "pins_cohort")
                                .attr("class", "pin cohort"),
            cohortPins      = [],
            zoomIn          = false;


        //
        function click(d) {

            var x   = 0,
                y   = 0,
                tx  = posx,
                ty  = posy,
                k   = 1,
                centroid;

            if (d && centered !== d) { // zoom in + move by click
                centroid = ias.graph.path.centroid(d);
                x = -centroid[0];
                y = -centroid[1];
                k = 3;
                tx = x + config.map.width / 2 / k;
                ty = y + config.map.height / 2 / k;
                centered = d;
            } else { // zoom out
                centered = null;

            }

            zoomIn = (k !== 1);
            log("click " + k);
            ias.graph.legend.zoom(k);

            // gmap.selectAll("path")
            //     .classed("active", centered && function(d) { return d === centered; });
            g.transition().duration(1000)
                .attr("transform", "scale(" + k + ") translate(" + tx + "," + ty + ")").style("stroke-width", 1.5 / k + "px");

        }

          //
        function zoomOut() {
            click(null);
            log("zoomout");
        }

        //
        function getCountryColor(d) {

            var country = ias.model.getCountry(d.properties.name),
                rate    = country.hivPrevalenceRate;
            if (rate !== undefined) {
                return ias.util.getBackgroundColor(rate);
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
                .data(ias.model.worldJson.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", ias.graph.path)
                .style("fill", function (d) {return getCountryColor(d); })
                .attr("id", function (d) {return ias.util.getCountryId(d); })
                .on('mouseover', function (d) {ias.graph.enterCountry(ias.util.getCountryId(d)); })
                .on('mouseout', function (d) {ias.graph.exitCountry(ias.util.getCountryId(d)); })
                .style("opacity", config.map.background.opacity)
                .on('click', click);

            gmap.select("#ATA").remove(); // remove Antartic

            // draw pins layer
            ias.model.countriesWithCohorts.forEach(function (country) {

                var n       = country.numberOfCohorts(),
                    pin     = {};

                if (n > 0) {

                    // make and draw cohort pins
                    country.cohorts.forEach(function (cohort) {
                        pin = ias.graph.pin(gpins_cohort, cohort, country).draw();
                        if (gCohortPins[cohort.code] === undefined) {
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
                    lnk = ias.graph.link(glinks_cohort, gCohortPins[key][0].getColor());
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
        function getCountryId(feature) {

        }

        //
        function filterUpdate() {

            gpins_country.style("display", ias.filter.viewCountryPins ? 'inline' : 'none');
            gpins_cohort.style("display", ias.filter.viewCohortPins ? 'inline' : 'none');
            cohortPins.forEach(function (d) {
                d.filter();
            });

        }

        // public
        return {

            draw: draw,
            update: update,
            filterUpdate: filterUpdate,
            zoomOut: zoomOut

        };

    };

    ias.graph.legend = function (svg) {

        var posx            = 0,
            posy            = 20,
            gbackground     = svg.append("g")
                                .attr("id", "blegend")
                                .attr('transform', 'translate(' + posx + ',' + posy + ')'),
            gcohort         = svg.append("g")
                                .attr("id", "clegend")
                                .attr('transform', 'translate(' + (posx + 200) + ',' + posy + ')'),
            arc             = d3.svg.arc()
                                .innerRadius(0)
                                .outerRadius(8)
                                .startAngle(0),
            zoomOut         = svg.append("g").append("image")
                                .attr("xlink:href", "images/zoomout.png")
                                .attr("width", 22)
                                .attr("height", 22)
                                .attr("x", config.legend.width - 50)
                                .attr("y", 20)
                                .style("display", "none")
                                .style("cursor", "pointer");

        //
        function draw() {

            var data        = ias.util.getBackgroundColorSteps(),
                maxColors   = data.length;

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
                .style("fill", function (d) {return ias.util.getBackgroundColor(d); })
                .style("opacity", config.map.background.opacity)
                .attr("dx", -3) // padding-right
                .attr("dy", ".35em"); // vertical-align: middle

            gbackground.append("rect")
                .attr('class', 'legend')
                .attr("x", maxColors * 20 + 15)
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
                .attr("d", arc.endAngle(function (d) { return (d / config.map.cohort.limit) * 2 * Math.PI; }));

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

            svg.append("g")
                .append("text")
                .attr("x", config.legend.width)
                .attr("y", config.legend.height)
                .style("text-anchor", "end")
                .style("font-size", "0.7em")
                .style("fill", "gray")
                .text("status: " + ias.version + " - " + ias.mode);

            zoomOut.on("click", function (d) {ias.graph.map.zoomOut(); });

        }

        // 
        function update() {

        }

        //
        function zoom(factor) {
            zoomOut.transition(1000).style("display", factor === 1 ? "none" : "inline");
        }

        //
        function filterUpdate() {

        }

        // public
        return {

            draw: draw,
            update: update,
            filterUpdate: filterUpdate,
            zoom: zoom

        };


    };

    ias.app = (function () {

        var that    = {};


        function refresh() {

            // update D3 components
            ias.graph.components.forEach(function (c) {
                c.update();
            });

        }


        function ready(error, configuration, world, centroids, networks, cohorts, hivrates) {

            if (error) {
                log(error);
            }

            // setup config variable
            config = configuration;

            // init IAS modules
            ias.util.init(networks, hivrates);
            ias.filter.init(networks);
            ias.model.init(world, networks, cohorts, hivrates);
            ias.graph.init(centroids);
            //ias.dev.init(cohorts, hivrates);

            // draw D3 components
            ias.graph.components.forEach(function (c) {
                c.draw();
            });

            refresh();

        }


        that.load = function () {

            queue().defer(d3.json, "/ias/dev/ias-config.json")
                .defer(d3.json, "/ias/dev//data/world-countries.json")
                .defer(d3.json, "/ias/dev//data/centroids.json")
                .defer(d3.json, "/ias/dev//data/ias-networks.json")
                .defer(d3.json, "/ias/dev//data/ias-cohorts.json")
                .defer(d3.csv, "/ias/dev//data/hiv-prevalence-rate.csv")
                .await(ready);

        };

        return that;


    }());


	// launch IAS app
	ias.app.load();

}());