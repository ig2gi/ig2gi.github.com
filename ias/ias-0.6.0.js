//
//
//
var g2g_info = {
		"version": "v0.1"
	};

//
//
//
var g2g = (function (my) {
	"use strict";

	//
    //
    //
    my.GraphComponent = function GraphComponent(parentSvg, x, y, color, classes) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.parent = parentSvg;
        this.g = parentSvg.append("g")
                    .attr('transform', 'translate(' + x + ',' + y + ')');
        if (classes) {
            this.g.attr("class", classes);
        }
    };

    //
    my.GraphComponent.prototype.getXY = function () {
        return {"x": this.x, "y": this.y};
    };

    //
    my.GraphComponent.prototype.setVisible = function (visible) {
        this.g.style('display', visible ? 'inline' : 'none');
        return this; // chaining
    };

    //
    my.GraphComponent.prototype.getNode = function () {
        return this.g;
    };

    //
    my.GraphComponent.prototype.draw = function () {
        return this;
    };

     //
    my.GraphComponent.prototype.select = function (selected) {
        return this;
    };

    //
    my.GraphComponent.prototype.moveOnTop = function () {
        this.parent.appendChild(this);
    };

    //
    //
    //
    //
    my.Link = function Link(parentSvg, interpolation, color, classes) {

        // call super constructor
        my.GraphComponent.call(this, parentSvg, 0, 0, color, classes);

        this.elements   = [];
        this.closed     = false;

        var d3line      = d3.svg.area()
                            .x(function (d) {return d.x; })
                            .y(function (d) {return d.y; })
                            .interpolate(interpolation),
            pathCoords  = [];

        //
        this.path = function () {
            return d3line(pathCoords);
        };

        //
        this.addElement = function (elt) {
            var xy = elt.getXY();
            this.elements.push(elt);
            pathCoords.push(xy);
            pathCoords.sort(function (p1, p2) {
                return p1.y - p2.y;
            });
            // TODO: compute new x y coordinates (centroid)
            return this;
        };

        //
        this.close = function () {
            if (this.closed) {
                return;
            }
            pathCoords.push(this.elements[0].getXY());
            this.closed = true;
            return this;
        };

    };

    // Extend the GraphComponent prototype using Object.create()
    my.Link.prototype = Object.create(my.GraphComponent.prototype);

    //
    my.Link.prototype.select = function (selected) {
        this.setVisible(selected);
        this.elements.forEach(function (e) {
            e.select(selected);
        });
        return this;
    };

    //
    my.Link.prototype.draw = function () {
        this.g.append("path")
            .attr("d", this.path())
            .style("stroke", this.color);
        return this;
    };

    //
    //
    //
    my.Options = function Options(opts) {

        this.listeners = {};
        if (opts) {
            var name;
            for (name in opts) {
                if (opts.hasOwnProperty(name)) {
                    this[name] = opts[name];
                }
            }
        }

    };

    my.Options.prototype.addListener = function addListener(options, callback) {

        var opts = (Array.isArray(options)) ? options : [options],
            that = this;

        opts.forEach(function (o) {
            if (that.listeners.hasOwnProperty(o) === false) {
                that.listeners[o] = [];
            }
            if (callback && typeof callback === "function") {
                that.listeners[o].push(callback);
            }
            // TODO else throw error
        });

    };

    my.Options.prototype.getValue = function getValue(option) {
        if (!this.hasOwnProperty(option)) {
            return undefined;
        }
        return this[option];
    };

    my.Options.prototype.change = function change(option, newValue) {

        var opt = option, path, value, i, listeners;

        if (option.indexOf('.') > 0) {
            path = option.split('.');
            opt = path[0];
            value = this[opt][path[1]];
        } else {
            value = this[opt];
        }
        if (!this.hasOwnProperty(opt)) {
            return;
        }
        if (!this.listeners.hasOwnProperty(opt)) {
            return; // no listener registered for this option
        }
        if (value === newValue) {
            return; // no change!
        }
        // change value
        if (path) {
            this[opt][path[1]] = newValue;
        } else {
            this[opt] = newValue;
        }
        // call listeners
        listeners = this.listeners[opt];
        for (i = 0; i < listeners.length; i += 1) {
            listeners[i].call(this, opt);
        }

    };


	return my;

}(g2g_info));


;//
//
//
var ias_info = {
		"version": "v0.6",
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
        my.version = configuration.version;
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
        queue().defer(d3.json, "/ias/ias-config.json")
            .defer(d3.json, "/ias/data/world-countries.json")
            .defer(d3.json, "/ias/data/centroids.json")
            .defer(d3.json, "/ias/data/ias-networks.json")
            .defer(d3.json, "/ias/data/ias-cohorts.json")
            .defer(d3.csv, "/ias/data/hiv-prevalence-rate.csv")
            .await(ready);
    };

	return my;

}(ias_info));;
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
;
ias.filter = (function () {
    "use strict";

    var that        = {},
        config      = {},
        years       = [],
        y,
        options,
        baseOptions = {};

    for (y = 1980; y <= 2013; y += 1) {
        years.push(y);
    }

    that.BACKGROUND_INFO = "backgroundInfo";
    that.YEAR = "year";
    that.NETWORKS = "networks";
    that.ENROLLMENT_STATUS = "enrollmentStatus";
    that.AGE_GROUP = "ageGroup";

    baseOptions[that.BACKGROUND_INFO] = "HIV";
    baseOptions[that.YEAR] = "1980";
    baseOptions[that.NETWORKS] = {};
    baseOptions[that.ENROLLMENT_STATUS] = "All";
    baseOptions[that.AGE_GROUP] = "All";

    //
    options = new g2g.Options(baseOptions);

    //
    //
    //
    that.getValue = function (option) {
        return options.getValue(option);
    };

    that.addListener = function (names, callback) {
        options.addListener(names, callback);
    };

    //
    function createCheckBoxes(node, data) {

        var nodeEnter = d3.select("#" + node)
                            .selectAll("input")
                            .data(data)
                            .enter()
                            .append("div");
        nodeEnter.append("input")
            .attr("checked", true)
            .attr("type", "checkbox")
            .attr("id", function (v) {return node + v; })
            .attr("value", function (d) {return d; })
            .attr("selected", "selected");
        nodeEnter.append("label")
                .attr("for", function (v) {return node + v; })
                .attr("class", node)
                .text(function (d) {return d; });

    }

    //
    // Background Information Option
    //
    d3.select("#backgroundInfo").on("change", function (d) {
        var v = this.options[this.selectedIndex].value;
        options.change(that.BACKGROUND_INFO, v);
    });

    //
    // Filtering Options
    //
    d3.select("#year")
        .on("change", function (y) {
            var newYear = parseInt(this.options[this.selectedIndex].value, 10);
            options.change(that.YEAR, newYear);
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

        config = ias.config.filter;

        d3.select("#status")
            .on("change", function (y) {
                var newEnrollmentStatus = this.options[this.selectedIndex].value;
                options.change(that.ENROLLMENT_STATUS, newEnrollmentStatus);
            })
            .selectAll("option")
            .data(config.enrollmentStatus)
            .enter()
            .append("option")
            .attr("value", function (d) {return d; })
            .text(function (d) {return d; });

        createCheckBoxes("ageGroup", config.ageGroup);
        createCheckBoxes("subjectStatus", config.subjectStatus);


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
                    options.change(that.NETWORKS + "." + n.code, input.checked);
                });
            } else {
                options.change(that.NETWORKS + "." + code, input.checked);
            }
        }

        //
        params.networks.children.forEach(function (d, index) {

            data = d.children;
            data.forEach(function (d) {
                options.networks[d.code] = true;
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
;
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

	that.getCountry = function (name) {
		var c = that.allcountriesByName[name];
		return c;
	};

	that.getCountryById = function (id) {
		var c = that.allcountriesById[id];
		return c;
	};

	that.init = function (params) {

		that.worldJson = params.world;
		that.networks = params.networks.children;

		// init countries
		that.worldJson.features.forEach(function (f) {
			var c = new ias.model.Country(f);
			that.allcountries.push(c);
			that.allcountriesByName[c.name] = c;
			that.allcountriesById[c.id] = c;
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
			that.cohorts.push(new ias.model.Cohort(d));
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
;
// augment model with Country object
ias.model = (function (model) {
	"use strict";

	// Constructor
	model.Country = function Country(feature) {
		this.feature = feature;
		this.networks = {};
		this.cohorts = [];
		this.hivPrevalenceRate = undefined;
		this.arvCoverageRate = undefined;
		this.id = feature.id;
        if (this.id === "-99") { // exotic countries!
            this.id = "9" + feature.properties.name.substring(0, 2);
        }
        this.name = this.feature.properties.name;
    };

	model.Country.prototype.addNetwork = function (network) {
		if (this.networks.hasOwnProperty(network) === false) {
			this.networks[network] = network;
		}
	};

	model.Country.prototype.getNetworks = function () {
		return Object.keys(this.networks);
	};

	model.Country.prototype.numberOfCohorts = function () {
		return this.cohorts ? this.cohorts.length : 0;
	};

	model.Country.prototype.html = function () {
		var h 		= "<span class='tooltip title'>Country " + "  " + this.id + "</span><h1 class='tooltip'>" + this.name +  "</h1><table>",
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
	};

	return model;

}(ias.model || {}));
;
// augment model with CountryData object
ias.model = (function (model) {
	"use strict";

	model.CountryData = {
		countryId: "",
		size: 0
	};

	return model;

}(ias.model || {}));;
// augment model with Cohort object
ias.model = (function (model) {
	"use strict";

	// Constructor
	model.Cohort = function Cohort(cohortJson) {

		this.status = cohortJson.status;
		this.code = cohortJson.code;
		this.name = cohortJson.name;
		this.objectives = cohortJson.objectives;
		this.year = cohortJson.year;
		this.size = cohortJson.size;
		this.networks = cohortJson.networks;
		this.countryData = {};

		var that = this;

		cohortJson.countries.forEach(function (d) {
			var country = model.allcountriesByName[d];
			if (country) {
				that.addCountryData(country.id, 10);
				country.cohorts.push(that); // bidirectional link
				country.addNetwork(cohortJson.networks[0]);
			} else {
				ias.log("no country found for " + d);
			}
		});

	};

	model.Cohort.prototype.getCountryData = function (countryId) {
		return this.countryData[countryId];
	};

	model.Cohort.prototype.getCountryIds = function () {
		return Object.keys(this.countryData);
	};

	model.Cohort.prototype.addCountryData = function (id, size) {
		var d = Object.create(ias.model.CountryData);
		d.countryId = id;
		d.size = size;
		this.countryData[id] = d;
		this.numberOfCountries += 1;
	};

	model.Cohort.prototype.getNetwork = function () {
		return this.networks[0];
	};

	model.Cohort.prototype.html = function () {
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
					+ country.name
					+ "</td></tr>";
			}
		}
		h += "</table>";
		h += "<br><br><a class='tooltip' target='_blank' href='" + ias.config.map.cohort.fullProfile.replace('$code$', this.code) + "'>View Full Profile</a>";

		return h;
	};

	return model;

}(ias.model || {}));
;
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

        that.map = ias.graph.map(mapsvg);
        that.components.push(that.map);

        that.legend = ias.graph.legend(legendsvg);
        that.components.push(that.legend);

        params.centroids.forEach(function (c) {
            overloadCentroids[c.id] = c.ll;
        });

        that.tooltip.country = ias.graph.tooltip("tooltipCountry", ias.config.map.tooltip.country, "", "country");
        that.tooltip.cohort = ias.graph.tooltip("tooltipCohort", ias.config.map.tooltip.cohort, "", "cohort");

        // augment IAS domain with graphic behaviors
        ias.model.countriesWithCohorts.forEach(function (country) {
            // check if centroid is modified
            var coords      = [],
                overcoords  = overloadCentroids[country.name],
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
                d = country.cohorts[0].getCountryData(country.id);
                d.x = coords[0];
                d.y = coords[1];
            } else {
                n = country.cohorts.length;
                scale = d3.scale.linear().domain([0, n]).range([-n / 2, n / 2]);
                country.cohorts.forEach(function (cohort, index) {
                    d = cohort.getCountryData(country.id);
                    delta = scale(index) * (6);
                    d.x = coords[0] + delta;
                    d.y = coords[1];
                });

            }


        });


    };

    that.run = function () {
        that.components.forEach(function (c) {
            c.draw();
        });
    };


    ias.modules.push(that);
    return that;

}());;// augment graph module with tooltip
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

}(ias.graph || {}));;// augment graph module with pin
ias.graph = (function (graph) {
    "use strict";

    //
    //
    //
    graph.Pin = function Pin(parent, cohort, country) {

        this.cohort         = cohort;
        this.country        = country;
        this.countryData    = cohort.getCountryData(country.id);
        this.maxRadius      = 15;
        this.minRadius      = 2;
        this.scale          = d3.scale.linear()
                                .domain([0, 300000])
                                .range([this.minRadius, this.maxRadius]);
        this.size           = this.scale(this.cohort.size);
        this.gselect        = null;
        this.link           = null;
        this.pin            = null;

        // Call the super constructor.
        g2g.GraphComponent.call(this, parent, this.countryData.x, this.countryData.y, ias.util.getNetworkColor(cohort.getNetwork()), "pin cohort");

    };

    // Extend the GraphComponent prototype using Object.create()
    graph.Pin.prototype = Object.create(g2g.GraphComponent.prototype);

    //
    graph.Pin.prototype.isSameStatus = function (status) {
        return (status === "All") || (this.cohort.status === status);
    };

    //
    graph.Pin.prototype.tooltip = function () {
        ias.graph.tooltip.cohort.html(this.cohort.html()).show();
    };

    //
    graph.Pin.prototype.enter = function () {

        if (ias.graph.selectedCohort !== undefined && ias.graph.selectedCohort !== this) {
            ias.graph.selectedCohort.exit(true);
            ias.graph.selectedCohort = undefined;
        }
        if (ias.graph.selectedCohort === undefined || ias.graph.selectedCohort !== this) {
            if (this.link) {
                this.link.select(true);
            } else {
                this.select(true);
            }
            ias.graph.enterCountry(this.country.id);
            this.tooltip();
        }

        this.parent.selectAll("g:not([code='" + this.cohort.code + "'])")
                .style("opacity", 0.4);
        this.parent.selectAll("g[code='" + this.cohort.code + "']")
                .each(function (d) {this.parentNode.appendChild(this); });

        this.pin.style("opacity", 1);
    };

    //
    graph.Pin.prototype.exit = function (force) {

        if (force || ias.graph.selectedCohort === undefined || ias.graph.selectedCohort !== this) {
            if (this.link) {
                this.link.select(false);
            } else {
                this.select(false);
            }
            ias.graph.exitCountry(this.country.id);
            ias.graph.tooltip.cohort.hide();
        }

        this.parent.selectAll("g:not([code='" + this.cohort.code + "'])")
                .style("opacity", 1);

        this.pin.style("opacity", 0.8);

    };

    //
    graph.Pin.prototype.filter = function () {
        var show = ias.filter.getValue(ias.filter.NETWORKS)[this.cohort.getNetwork()];
        show = show && this.isSameStatus(ias.filter.getValue(ias.filter.ENROLLMENT_STATUS));
        this.setVisible(show);
        return this;
    };

    //
    graph.Pin.prototype.addLink = function (l) {
        this.link = l;
    };

    //
    graph.Pin.prototype.select = function (selected) {
        if (this.gselect) {
            this.gselect.style("display", selected ? "inline" : "none");
        }
        this.pin.style("opacity", selected ? 1 : 0.8);
    };

    //
    graph.Pin.prototype.draw = function () {

        this.g.attr("code", this.cohort.code);

        this.g.append("line")
            .attr("x1", 0)
            .attr("y1", -8)
            .attr("x2", 0)
            .attr("y2", 0)
            .style("stroke", ias.config.map.cohort.linkcolor)
            .style("stroke-width", "0.5px");

        this.pin = this.g.append("circle")
            .attr("cx", 0)
            .attr("cy", -8 - this.size)
            .attr("class", "pin")
            .style("fill", this.color)
            .style("opacity", 0.8)
            .style('stroke', ias.config.map.cohort.linkcolor)
            .style('stroke-width', "0.5px")
            .attr("r", this.size);

        var that = this;
        this.g.on('mouseover', function (d) {
            that.enter();
        });

        this.g.on('mouseout', function (d) {
            that.exit(false);
        });

        this.g.on('click', function (d) {
            if (ias.graph.selectedCohort === that) {
                return;
            }
            ias.graph.selectedCohort = that;
        });

        return this; // chaining
    };


    return graph;

}(ias.graph || {}));

;// augment graph module with tooltip
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
                        pin = new ias.graph.Pin(gpins_cohort, cohort, country).draw();
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
                    lnk = new g2g.Link(glinks_cohort, ias.config.map.cohort.linkinterpolate, ias.config.map.cohort.linkcolor, "link cohort").setVisible(false);
                    gCohortPins[key].forEach(function (p) {
                        lnk.addElement(p);
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
        function filterUpdate(event) {

            cohortPins.forEach(function (d) {
                d.filter();
            });

        }

        ias.filter.addListener([ias.filter.NETWORKS, ias.filter.YEAR, ias.filter.ENROLLMENT_STATUS], filterUpdate);

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

}(ias.graph || {}));;
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
        function legend1() {

            var data        = ias.util.getBackgroundColorSteps(),
                maxColors   = data.length;

            gbackground.selectAll("rect")
                .data(data)
                .enter().append("rect")
                .attr('class', 'legend')
                .attr("x", function (d, i) {return i * 20 + 10; })
                .attr("y", 30)
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
                .attr("y", 30)
                .attr("width", 20)
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
                .attr("y", 28).attr("class", "legend").text(function (d) {return (d !== 'n/a') ? '>' + parseFloat(d).toFixed(1) : d; });

            gbackground.append("text")
                .attr("x", 10)
                .attr("y", 0)
                .attr("class", "title legend")
                .text("HIV Prevalence Rate (%)");
        }

        //
        function legend2() {

            var data        = ias.config.legend.cohorts,
                i           = 0,
                scale       = d3.scale.linear()
                                .domain([0, 300000])
                                .range([2, 15]);

            gcohort.selectAll("circle")
                .data(data).enter()
                .append("circle")
                .attr("cx", 20)
                .attr("cy", function (d) {return 50 - scale(d); })
                .style("fill", "none", "opacity", 1)
                .style('stroke', ias.config.map.cohort.linkcolor)
                .style('stroke-width', "1px")
                .attr("r", function (d) {return scale(d); });

            gcohort.selectAll("text")
                .data(data)
                .enter().append("text")
                .attr("y", function (d, i) {return 50 - 2 * scale(d) + 4; })
                .attr("x", 40)
                .attr("class", "legend")
                .text(function (d, i) {return (i === 4) ? '>' + d : d; });

            gbackground.append("text")
                .attr("x", 200)
                .attr("y", 0)
                .attr("class", "title legend")
                .text("Cohort Size");

        }

        //
        function draw() {

            addButton("zoomout", 25, 20);
            addButton("moveup", -20, 10);
            addButton("movedown", -20, 30);
            addButton("moveleft", -35, 20);
            addButton("moveright", -5, 20);

            legend1();
            legend2();

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
        function filterUpdate(event) {
        }

        //
        ias.filter.addListener(ias.filter.BACKGROUND_INFO, filterUpdate);

        return {
            draw: draw,
            update: update,
            filterUpdate: filterUpdate,
            zoom: zoom
        };
    };

    return graph;

}(ias.graph || {}));
;

// launch IAS app
ias.load();

