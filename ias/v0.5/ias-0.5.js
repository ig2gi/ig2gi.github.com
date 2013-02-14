//
//
//
var ias_info = {
		"version": "v0.5",
		"mode": "offline",
		"modules": [],
		"config": {}
	};

//
//
//
var ias = (function (my) {
	"use strict";

	// log wrapper
	my.log = function () {
	    if (console && console.log) {
	        console.log.apply(console, arguments);
	    }
	};

    function ready(error, configuration, world, centroids, networks, cohorts, hivrates) {
		var module;
        if (error) {
            my.log(error);
        }
        // setup config
        my.config = configuration;
        // init IAS modules
        my.modules.forEach(function (m) {
            m.init({"world": world, "centroids": centroids, "networks": networks, "cohorts": cohorts, "hivrates": hivrates});
        });
        // run IAS modules (if they are runnable)
        my.modules.forEach(function (m) {
            if (m.hasOwnProperty("run")) {
                m.run();
            }
        });
    }

    my.load = function () {
        queue().defer(d3.json, "/ias-config.json")
            .defer(d3.json, "/data/world-countries.json")
            .defer(d3.json, "/data/centroids.json")
            .defer(d3.json, "/data/ias-networks.json")
            .defer(d3.json, "/data/ias-cohorts.json")
            .defer(d3.csv, "/data/hiv-prevalence-rate.csv")
            .await(ready);
    };

	return my;

}(ias_info));

// util
ias.util = (function () {
    "use strict";

    var that            = {},
        backgroundScale = d3.scale.linear().domain([0, 23]),
        networkColors   = {},
        networkSchemes;

    //
    that.getNetworkColor = function (code) {
        if (networkColors.hasOwnProperty(code)) {
            return networkColors[code];
        }
        ias.log("network color for" + code + " not found");
        return "white";
    };

    //
    that.getCountryColor = function (id) {
        var country = ias.model.getCountryById(id),
            rate    = country.hivPrevalenceRate;
        if (rate !== undefined) {
            return that.getBackgroundColor(rate);
        }
        return "gray";
    };

    //
    that.getBackgroundColor = function (rate) {
        return backgroundScale(rate);
    };

    //
    that.getBackgroundColorSteps = function (rate) {
        return ias.config.map.background.steps;
    };

    //
    that.getCountryColorByFeature = function (feature) {
        var country = ias.model.getCountry(feature.properties.name),
            rate    = country.hivPrevalenceRate;
        if (rate !== undefined) {
            return that.getBackgroundColor(rate);
        }
        return "gray";
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
    that.init = function (params) {

        var domainRates = [],
            colorScale;

        networkSchemes = ias.config.network.colorSchemes;
        params.networks.children.forEach(function (n, index) {
            colorScale = d3.scale.ordinal().range(colorbrewer[networkSchemes[index]][6]);
            n.children.forEach(function (d) {
                networkColors[d.code] = colorScale(d.code);
            });
        });

        params.hivrates.forEach(function (r) {
            domainRates.push(r.rate);
        });

        backgroundScale.domain(domainRates);

        backgroundScale
            .range(colorbrewer[ias.config.map.background.scheme][ias.config.map.background.steps.length]);


    };

    ias.modules.push(that);
    return that;

}());


ias.filter = (function () {
    "use strict";

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

    for (y = 1980; y <= 2013; y += 1) {
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
            that.year = parseInt(this.options[this.selectedIndex].value, 10);
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
    that.init = function (params) {

        var data,
            nodeEnter;

        d3.select("#status")
            .on("change", function (y) {
                that.enrollmentStatus = this.options[this.selectedIndex].value;
                dispatchFilterEvent();
            })
            .selectAll("option")
            .data(ias.config.filter.status)
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
        params.networks.children.forEach(function (d, index) {

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

    ias.modules.push(that);
    return that;

}());


ias.model = (function () {
	"use strict";

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
		c.networks = [];
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
				country.addNetwork(cohortJson.networks[0]);
			} else {
				ias.log("no country found for " + d);
			}
		});
		c.networks = cohortJson.networks;
		that.cohorts.push(c);

	}


	that.getCountry = function (name) {
		var c = that.allcountriesByName[name];
		return c;
	};

	that.getCountryById = function (id) {
		var c = that.allcountriesById[id];
		return c;
	};

	function vertex(id, code, name, type, size) {
		return {
			"id": id,
			"code": code,
			"name": name,
			"type": type,
			"size": size,
			"children": [],
			addChild: function (child) {
				this.children.push(child);
			},
			total: function () {
				var total = size;
				if (this.children.length > 0) {
					this.children.forEach(function (c) {
						total += c.total();
					});
				}
				return total;
			}
		};
	}

	that.getCountryGraph = function (graph, countryId, filter) {

		var c 	= that.getCountryById(countryId),
			v 	= vertex(countryId, countryId, c.name(), 'country', 0),
			coh = {},
			net = {};
		if (filter.hasOwnProperty(countryId) === false) {
			graph.vertices.push(v);
			filter[countryId] = v;
		}

		c.getNetworks().forEach(function (n) {
			net = vertex(n + "-" + countryId, n, n, 'network', 0);
			v.addChild(net);
			filter[n + "-" + countryId] = net;
		});

		c.cohorts.forEach(function (cohort) {

			coh = vertex(cohort.code + '-' + v.id, cohort.code, cohort.name, 'cohort', cohort.size);
			filter[coh.id] = coh;
			filter[cohort.getNetwork() + "-" + countryId].addChild(coh);

			cohort.getCountryIds().forEach(function (cid) {
				if (cid !== countryId && filter.hasOwnProperty(cid) === false) {
					that.getCountryGraph(graph, cid, filter);
				}
			});

		});

	};


	that.init = function (params) {

		that.worldJson = params.world;
		that.networks = params.networks.children;

		// init countries
		that.worldJson.features.forEach(function (f) {
			addCountry(f);
		});
		params.hivrates.forEach(function (r) {
			var c = that.allcountriesByName[r.country];
			if (c !== undefined) {
				c.hivPrevalenceRate = parseFloat(r.rate);
			} else {
				ias.log('HIV Rates: no country found for ' + r.country);
			}
		});

		// init cohorts
		params.cohorts.cohorts.forEach(function (d) {
			addCohort(d);
		});

		//
		that.allcountries.forEach(function (c) {
			if (c.numberOfCohorts() > 0) {
				that.countriesWithCohorts.push(c);
			}
		});

	};


	ias.modules.push(that);
	return that;

}());


// augment model with Country object
ias.model = (function (model) {
	"use strict";

	model.Country = {

		feature: {},
		networks: {},
		cohorts: [],
		hivPrevalenceRate: undefined,
		arvCoverageRate: undefined,

		id: function () {
			return ias.util.getCountryId(this.feature);
		},

		addNetwork: function (network) {
			if (this.networks.hasOwnProperty(network) === false) {
				this.networks[network] = network;
			}
		},

		getNetworks: function () {
			return Object.keys(this.networks);
		},

		name: function () {
			return this.feature.properties.name;
		},

		numberOfCohorts: function () {
			return this.cohorts ? this.cohorts.length : 0;
		},

		html: function () {
			var h 		= "<span class='tooltip title'>Country " + "  " + this.id() + "</span><h1 class='tooltip'>" + this.name() +  "</h1><table>",
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

	return model;

}(ias.model || {}));

// augment model with CountryData object
ias.model = (function (model) {
	"use strict";

	model.CountryData = {
		countryId: "",
		size: 0
	};

	return model;

}(ias.model || {}));

// augment model with Cohort object
ias.model = (function (model) {
	"use strict";

	model.Cohort = {
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

		getCountryIds: function () {
			return Object.keys(this.countryData);
		},

		addCountryData: function (id, size) {
			var d = Object.create(ias.model.CountryData);
			d.countryId = id;
			d.size = size;
			this.countryData[id] = d;
			this.numberOfCountries += 1;
		},

		getNetwork: function () {
			return this.networks[0];
		},

		html: function () {
			var h 		= "<span class='tooltip title'>Cohort</span><h1 class='tooltip'>"
							+ this.name
							+ ":</h1>",
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
				if (this.countryData.hasOwnProperty(k)) {
					country = ias.model.allcountriesById[k];
					rate = country.hivPrevalenceRate;
					color = ias.util.getBackgroundColor(rate);
					h += "<tr><td class='firstcol'><span style='background:"
						+ color + ";'>&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;"
						+ country.name()
						+ "</td></tr>";
				}
			}
			h += "</table>";
			h += "<br><br><a class='tooltip' target='_blank' href='" + ias.config.map.cohort.fullProfile.replace('$code$', this.code) + "'>View Full Profile</a>";

			return h;
		}
	};

	return model;

}(ias.model || {}));

ias.graph = (function () {
    "use strict";

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
                .style('stroke', "darkgray")
                .style('stroke-width', "1px");
        } catch (err) {
            //log(err); // TODO exotic countries with id = -99!
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
            //log(err); // TODO exotic countries with id = -99!
        }

    };

    //
    // Init Function:
    //
    that.init = function (params) {

        var mapsvg, legendsvg, cohortssvg,
            overloadCentroids = {};

        mapsvg = d3.select("#map")
                .append("svg")
                .attr("width", ias.config.map.width)
                .attr("height", ias.config.map.height);

        legendsvg = d3.select("#legend")
                .append("svg")
                .attr("width", ias.config.legend.width)
                .attr("height", ias.config.legend.height);

        cohortssvg = d3.select("#cohorts")
                .append("svg")
                .attr("class", "cohorts")
                .attr("width", 220)
                .attr("height", 800)
                .style("overflow-y", "scroll")
                .attr("viewBox", "0 0 220 780");

        that.map = ias.graph.map(mapsvg);
        that.components.push(that.map);

        that.legend = ias.graph.legend(legendsvg);
        that.components.push(that.legend);

        that.cohortsTable = ias.graph.cohortsTable(cohortssvg);
        that.components.push(that.cohortsTable);

        params.centroids.forEach(function (c) {
            overloadCentroids[c.id] = c.ll;
        });

        that.tooltip.country = ias.graph.tooltip("tooltipCountry", ias.config.map.tooltip.country, "", "country");
        that.tooltip.cohort = ias.graph.tooltip("tooltipCohort", ias.config.map.tooltip.cohort, "", "cohort");

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
                    delta = scale(index) * (ias.config.map.cohort.pinsize + 1);
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

    that.run = function () {
        that.components.forEach(function (c) {
            c.draw();
        });
    };


    ias.modules.push(that);
    return that;

}());
// augment graph module with tooltip
ias.graph = (function (graph) {
    "use strict";

    graph.tooltip = function (id, xy, innerHtml, classes) {

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

    return graph;

}(ias.graph || {}));
// augment graph module with link
ias.graph = (function (graph) {
    "use strict";

    graph.link = function (parent, color) {

        var that        = {"elements": [], "color": color, "closed": false},
            pathInfo    = [],
            d3line      = d3.svg.area()
                            .x(function (d) {return d.x; })
                            .y(function (d) {return d.y; })
                            .interpolate(ias.config.map.cohort.link.interpolate),
            g           = parent.append("g")
                            .attr("class", "link cohort")
                            .style("display", "none");

        // 
        that.add = function (elt) {
            var xy = elt.getXY();
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
                .style("stroke-width", "1px")
                .style("stroke", ias.config.map.cohort.pincolor)
                .style("fill", "none");
            return that;
        };

        return that;

    };

    return graph;

}(ias.graph || {}));
// augment graph module with pin
ias.graph = (function (graph) {
    "use strict";

    graph.pin = function (parent, cohort, country) {

        var that            = {"cohort": cohort, "country": country},
            countryData     = cohort.getCountryData(country.id()),
            color           = ias.util.getNetworkColor(cohort.networks[0]),
            pincolor        = ias.config.map.cohort.pincolor,
            maxRadius       = 15,
            minRadius       = 2,
            scale           = d3.scale.linear()
                                .domain([0, 300000])
                                .range([minRadius, maxRadius]),
            size            = scale(cohort.size),
            x               = countryData.x,
            y               = countryData.y,
            radius          = ias.config.map.cohort.pinsize,
            width           = 2 * radius,
            height          = 3 * radius,
            g               = parent.append("g")
                                .attr("class", "pin cohort")
                                .attr("code", cohort.code)
                                .attr('transform', 'translate(' + x + ',' + y + ')'),
            arc             = d3.svg.arc()
                                .innerRadius(0)
                                .outerRadius(radius / 2)
                                .startAngle(0)
                                .endAngle((cohort.size / ias.config.map.cohort.limit) * 2 * Math.PI),
            arct            = d3.svg.arc()
                                .innerRadius(0)
                                .outerRadius(6)
                                .startAngle(0)
                                .endAngle((cohort.size / ias.config.map.cohort.limit) * 2 * Math.PI),
            symbol          = d3.svg.symbol()
                                .type(ias.config.map.cohort.pinsymbol)
                                .size(4),
            arcSelect       = d3.svg.arc()
                                .innerRadius(radius / 2 + 0.5)
                                .outerRadius(radius / 2 + 2)
                                .startAngle(0)
                                .endAngle(2 * Math.PI),
            gselect,
            link,
            pin;

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
                .style("fill", pincolor, "opacity", 1)
                .attr("d", arct);

        }

        function moveOnTop() {
            this.parentNode.appendChild(this);
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

            parent.selectAll("g:not([code='" + cohort.code + "'])")
                    .style("opacity", 0.5);
            parent.selectAll("g[code='" + cohort.code + "']")
                    .each(function (d) {this.parentNode.appendChild(this)});

            pin.style("opacity", 1);
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

            parent.selectAll("g:not([code='" + cohort.code + "'])")
                    .style("opacity", 1);

            pin.style("opacity", 0.8);

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
            if (gselect) {
                gselect.style("display", selected ? "inline" : "none");
            }
            pin.style("opacity", selected ? 1 : 0.8);
        };

        //
        function pin1() {

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
                .style('stroke', pincolor)
                .style('stroke-width', "1px")
                .attr("r", radius / 2);

            g.append("path")
                .attr("class", "")
                .style("fill", pincolor, "opacity", 1)
                .attr("d", arc);

            g.append("path")
                .style("fill", color, "opacity", 1)
                .style("stroke-width", "1px", "stroke", pincolor)
                .attr('transform', 'translate(0,-4)')
                .attr("d", symbol);

            gselect = g.append("path")
                        .attr("class", "")
                        .style("fill", color)
                        .style("opacity", 0.8)
                        .style("display", "none")
                        .attr("d", arcSelect);
        }

        function pin2() {

            pin = g.append("circle")
                .attr("cx", 0)
                .attr("cy", 0)
                .attr("class", "pin")
                .style("fill", color)
                .style("opacity", 0.8)
                .style('stroke', pincolor)
                .style('stroke-width', "0.5px")
                .attr("r", size);

        }

        //
        that.draw = function () {

            pin2();

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

    return graph;

}(ias.graph || {}));

// augment graph module with tooltip
ias.graph = (function (graph) {
    "use strict";

    graph.map = function (svg) {

        var posx            = -100,
            posy            = -20,
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
            zoomFactor      = 1,
            draging         = false,
            centeredCountry,
            center,
            m0;

        //
        function recenter(dur) {
            var tx = -center[0] + ias.config.map.width / 2 / zoomFactor,
                ty = -center[1] + ias.config.map.height / 2 / zoomFactor;
            g.transition().duration(dur)
                .attr("transform", "scale(" + zoomFactor + ") translate(" + tx + "," + ty + ")");
        }

        //
        function move(xy, duration) {
            center[0] += xy[0];
            center[1] += xy[1];
            recenter(duration);
        }

        //
        function click(d) {

            var centroid;
            if (d && centeredCountry !== d) { // zoom in + move by click
                centroid = ias.graph.path.centroid(d);
                center = [centroid[0], centroid[1]];
                zoomFactor = 3;
                centeredCountry = d;
            } else { // zoom out
                centeredCountry = null;
                zoomFactor = 1;
                center = ias.graph.projection([0, 0]);
                center[1] += posy;
                svg.style("cursor", "default");
            }
            ias.graph.legend.zoom(zoomFactor);
            recenter(1000);

        }

        //
        function zoomOut() {
            click(null);
        }

        //
        function moveUp() {
            move([0, -10], 500);
        }

        //
        function moveDown() {
            move([0, +10], 500);
        }

        //
        function moveRight() {
            move([+10, 0], 500);
        }

        //
        function moveLeft() {
            move([-10, 0], 500);
        }

        //
        function mousemove() {
            var delta;
            if (draging) {
                delta = [-(d3.event.x - m0[0]), -(d3.event.y - m0[1])];
                m0 = [d3.event.x, d3.event.y];
                move(delta, 0);
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        //
        function mousedown() {
            if (zoomFactor > 1) {
                d3.event.preventDefault();
                d3.event.stopPropagation();
                svg.style("cursor", "move");
                draging = true;
                m0 = [d3.event.x, d3.event.y];
            }
        }

        //
        function mouseup() {
            draging = false;
            svg.style("cursor", "pointer");
        }



        //
        function draw() {

            var gCohortPins = {},
                lnk         = {},
                key;

            svg.on("mousemove", mousemove)
                .on("mousedown", mousedown)
                .on("mouseup", mouseup);

            // draw map
            gmap.selectAll("path")
                .data(ias.model.worldJson.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", ias.graph.path)
                .style("fill", function (d) {return ias.util.getCountryColorByFeature(d); })
                .attr("id", function (d) {return ias.util.getCountryId(d); })
                .on('mouseover', function (d) {ias.graph.enterCountry(ias.util.getCountryId(d)); })
                .on('mouseout', function (d) {ias.graph.exitCountry(ias.util.getCountryId(d)); })
                .style("opacity", ias.config.map.background.opacity)
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

                if (gCohortPins.hasOwnProperty(key) && gCohortPins[key].length > 1) {
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
            zoomout: zoomOut,
            moveup: moveUp,
            movedown: moveDown,
            moveright: moveRight,
            moveleft: moveLeft

        };

    };

    return graph;

}(ias.graph || {}));

// augment graph module with legend
ias.graph = (function (graph) {
    "use strict";

    graph.legend = function (svg) {

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
                                .attr("x", ias.config.legend.width - 50)
                                .attr("y", 20)
                                .style("display", "none")
                                .style("cursor", "pointer"),
            gbuttons        = svg.append("g")
                                .attr("id", "buttons")
                                .style("pointer-events", "none")
                                .style("opacity", "0.2")
                                .attr('transform', 'translate(' + (posx + 720) + ',' + 5 + ')');


        //
        function addButton(name, x, y) {
            gbuttons.append("image")
                                .attr("xlink:href", "images/" + name + ".png")
                                .attr("width", 20)
                                .attr("height", 20)
                                .attr("x", x)
                                .attr("y", y)
                                .style("cursor", "pointer")
                                .on("click", ias.graph.map[name]);
        }

        //
        function draw() {

            var data        = ias.util.getBackgroundColorSteps(),
                maxColors   = data.length,
                data2       = [ias.config.map.cohort.limit / 6],
                i           = 0;

            for (i = 1; i <= 4; i += 1) {
                data2[i] = ias.config.map.cohort.limit * i / 4;
            }

            addButton("zoomout", 25, 20);
            addButton("moveup", -20, 10);
            addButton("movedown", -20, 30);
            addButton("moveleft", -35, 20);
            addButton("moveright", -5, 20);

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
                .style("opacity", ias.config.map.background.opacity)
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

            gcohort.selectAll("circle")
                .data(data2).enter()
                .append("circle")
                .attr("cx", function (d, index) { return index * 26 + 17; })
                .attr("cy", 30)
                .style("fill", "none", "opacity", 1)
                .style('stroke', ias.config.map.cohort.pincolor)
                .style('stroke-width', "4px")
                .attr("r", 9);

            gcohort.selectAll("path")
                .data(data2).enter()
                .append("path")
                .attr("class", "")
                .attr("transform", function (d, index) { return "translate(" + (index * 26 + 17) + ",30)"; })
                .style("fill", ias.config.map.cohort.pincolor, "opacity", 1)
                .attr("d", arc.endAngle(function (d) { return (d / ias.config.map.cohort.limit) * 2 * Math.PI; }));

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
                .attr("x", ias.config.legend.width)
                .attr("y", ias.config.legend.height)
                .style("text-anchor", "end")
                .style("font-size", "0.7em")
                .style("fill", "gray")
                .text("status: " + ias.version + " - " + ias.mode);
        }

        // 
        function update() {

        }

        //
        function zoom(factor) {
            gbuttons.transition().duration(1000)
                .style("opacity", factor === 1 ? "0.2" : "1")
                .style("pointer-events", factor === 1 ? "none" : "all");
        }

        //
        function filterUpdate() {

        }

        return {
            draw: draw,
            update: update,
            filterUpdate: filterUpdate,
            zoom: zoom
        };
    };

    return graph;

}(ias.graph || {}));


// augment graph module with cohorts table
ias.graph = (function (graph) {
    "use strict";

    graph.cohortsTable = function (svg) {

        var posx            = 0,
            posy            = 20,
            g               = svg.append("g")
                                .attr('transform', 'translate(' + posx + ',' + posy + ')')
                                .attr("width", 120),
            bars            = g.append("g"),
            scale           = d3.scale.linear()
                                .domain([0, 300000])
                                .range([4, 50]);


    

        //
        function draw() {

            svg.append("defs")
                .append("clipPath")
                .attr("id", "clip")
                .append("rect")
                .attr("width", 150)
                .attr("height", 900);
 
            var data  = ias.model.cohorts;
            data.sort(function (a, b) {return a.name > b.name ? 1 : -1; });


            g.selectAll("text")
                .data(data)
                .enter()
                .append("text")
                .attr("class", "cohort table")
                .attr("clip-path", "url(#clip)")
                .attr("y", function (d,i) {return i * 15; })
                .text(function (d) {
                    var w = this.getComputedTextLength();
                    return d.name; 
                });

            bars.selectAll("rect")
                .data(data)
                .enter()
                .append("rect")
                .attr("y", function (d,i) {return i * 15 + 5; })
                .attr("x", 154)
                .attr("height", 8)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", 50)
                .style("fill", "lightgray")
                .style("opacity", 0.7);

            g.append("g").selectAll("rect")
                .data(data)
                .enter()
                .append("rect")
                .attr("y", function (d,i) {return i * 15 + 5; })
                .attr("x", 154)
                .attr("height", 8)
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", function (d,i) {return scale(d.size); })
                .style("fill", function (d,i) {return ias.util.getNetworkColor(d.getNetwork()); });






           
        }

        // 
        function update() {

        }

        //
        function filterUpdate() {

        }

        return {
            draw: draw,
            update: update,
            filterUpdate: filterUpdate
        };
    };

    return graph;

}(ias.graph || {}));


$(function () {
    $("#tabs").tabs();
});

// launch IAS app
ias.load();
