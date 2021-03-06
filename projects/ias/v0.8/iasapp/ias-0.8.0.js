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
        return this;
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
        if (value === newValue) {
            return; // no change!
        }
        // change value
        if (path) {
            this[opt][path[1]] = newValue;
        } else {
            this[opt] = newValue;
        }

        if (this.listeners.hasOwnProperty(opt)) {   
            // call listeners
            listeners = this.listeners[opt];
            for (i = 0; i < listeners.length; i += 1) {
                listeners[i].call(this, opt);
            }
        }

    };


	return my;

}(g2g_info));


;//
//
//
var ias_info = {
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

    //
    //
    //
    my.showError = function () {
        d3.select("#error").text(arguments ? arguments[0] : "");
    };

    //
    //
    //
    function showMap(error, world, centroids, networks, cohorts, hivrates, arvrates) {
		var module, mess;
        if (error) {
            mess = "Error while loading data: " + error.message;
            my.showError(mess);
            throw mess;
        } else {
            try {
                // init IAS modules
                my.modules.forEach(function (m) {
                    m.init(
                        {   
                            "world": world, 
                            "centroids": centroids, 
                            "networks": networks, 
                            "cohorts": cohorts, 
                            "hivrates": hivrates,
                            "arvrates": arvrates
                        });
                });
                // run IAS modules (if they are runnable)
                my.modules.forEach(function (m) {
                    if (m.hasOwnProperty("run")) {
                        m.run();
                    }
                });
                my.showError();
            } catch (e) {
                my.showError("Error while initializing IAS modules: " + e);
                throw e;
            }
        }
    }

    //
    //
    //
    function updateMap(error, networks, cohorts) {
        var module, mess;
        if (error) {
            mess = "Error while loading data: " + error.message;
            my.showError(mess);
            throw mess;
        } else {
            try {
                // update IAS modules with new data
                my.modules.forEach(function (m) {
                    m.update(
                        {    
                            "networks": networks, 
                            "cohorts": cohorts
                        });
                });
                my.showError();
            } catch (e) {
                my.showError("Error while updating IAS modules: " + e);
                throw e;
            }
        }
    }

    //
    //
    //
    my.launchApp = function () {
        d3.json("./ias-config.json", function (error, configuration) {
            if (error) {
                throw "Error while loading configuration file: " + error.message;
            }
            // setup config
            my.config = configuration;
            // setupt mode options
            var modeParameter = window.top.location.search.replace("?", "").split("=");
            if (modeParameter.length === 2 && modeParameter[0] === "mode") {
                my.mode = modeParameter[1].replace("/", "");
            } else {
                my.mode = "offline"; // default mode
            }
            d3.select("#mode").text(my.mode + " mode");
            // ok, load all data and show map!
            my.loadData(my.mode);
        });
        return my;
    };

    //
    //
    //
    my.loadData = function (mode) { 
        queue()
            .defer(d3.json, my.config.data.mapGeoJson)
            .defer(d3.json, my.config.data.mapCentroids)
            .defer(d3.json, my.config.data[mode + "Networks"])
            .defer(d3.json, my.config.data[mode + "Cohorts"])
            .defer(d3.csv, my.config.data.hivPrevalenceRate)
            .defer(d3.csv, my.config.data.arvCoverageRate)
            .await(showMap);
        return my;
    };

    //
    //
    //
    my.reloadData = function (mode) { 
        queue()
            .defer(d3.json, my.config.data[mode + "Networks"])
            .defer(d3.json, my.config.data[mode + "Cohorts"])
            .await(updateMap);
        return my;
    };

	return my;

}(ias_info));

;

ias.util = (function () {
    "use strict";

    var that            = {},
        backgroundScale = d3.scale.linear(),
        networkColors   = {},
        networkSchemes,
        domainRates     = {};

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
            rate    = country[ias.filter.getBackgroundInfoOption()];
        if (rate !== undefined && rate !== 'na') {
            return that.getBackgroundColor(rate);
        }
        return ias.config.map.background.naColor;
    };

    //
    that.getBackgroundColor = function (rate) {
        return backgroundScale(rate);
    };

    //
    that.getSelectedDomainRates = function () {
        return domainRates[ias.filter.getBackgroundInfoOption()];
    };

    //
    that.getCountryColorByFeature = function (feature) {
        var country = ias.model.getCountry(feature.properties.name),
            rate    = country[ias.filter.getBackgroundInfoOption()];
        if (rate !== undefined && rate !== 'na') {
            return that.getBackgroundColor(rate);
        }
        return ias.config.map.background.naColor;
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
    that.getCohortHtml = function (cohort) {
        var h       = "<span class='tooltip title'>Cohort</span><h1 class='tooltip'>" + cohort.name + ":</h1>",
            color   = "white",
            country,
            rate,
            k;
        h += "<b>Number of subjects:</b>&nbsp;" + cohort.size + "<br>";
        h += "<b>Network:&nbsp;</b>" + cohort.getNetwork() + "<br>";
        h += "<b>Status:</b>&nbsp;" + cohort.status + "<br>";
        h += "<b>Countries:</b>&nbsp;";
        h += cohort.getCountries().map(function (d) {return d.name; }).join(", ") + "<br>";
        h += "<b>Objectives:&nbsp;</b>";
        h += "<span class='tooltip objectives'>" + cohort.objectives + "</span>";
        h += "<br><br><a class='tooltip' target='_blank' href='" + ias.config.map.cohort.fullProfile.replace('$code$', cohort.code) + "'>View Full Profile</a>";

        return h;
    };

    //
    that.getCountryHtml = function (country) {
        var h       = "<span class='tooltip title'>Country " + "  " + country.id + "</span><h1 class='tooltip'>" + country.name +  "</h1><table>",
            color   = "white";

        h += "<tr><td class='firstcol'>HIV Prevalence Rate</td><td class='secondcol'>";
        h += (country.hivPrevalenceRate || 'na') + " %</td></tr>";
        h += "<tr><td>ARV Coverage Rate</td><td class='secondcol'>";
        h += (country.arvCoverageRate || 'na')  + " %</td></tr>";
        if (country.cohorts && country.cohorts.length > 0) {
            h += "<tr><td colspane='2'><br><b>COHORTS:</b></td></tr>";
            country.cohorts.forEach(function (c) {
                color = ias.util.getNetworkColor(c.networks[0]);
                h += "<tr><td class='firstcol'><span style='background:";
                h += color + ";'>&nbsp;&nbsp;&nbsp;</span>&nbsp;";
                h += c.name + "</td><td class='secondcol'>";
                h += c.size + "</td></tr>";
            });
            h += "<tr><td class='firstcol' style='text-align:right;'><b>Total</b></td><td class='secondcol'><b>";
            h += country.size + "</b></td></tr>";
        }
        h += "</table>";
        return h;
    };

    //
    that.init = function (params) {
        // network colors
        var colorScale, d;
        networkSchemes = ias.config.network.colorSchemes;
        params.networks.children.forEach(function (n, index) {
            colorScale = d3.scale.ordinal().range(colorbrewer[networkSchemes[index]][6]);
            n.children.forEach(function (d) {
                networkColors[d.code] = colorScale(d.code);
            });
        });
        // background (country) colors
        d = params.hivrates
            .filter(function (d) {return !isNaN(d.rate); })
            .map(function (d) {return parseFloat(d.rate); });
        domainRates.hivPrevalenceRate = [d3.min(d), d3.max(d)];

        d = params.arvrates
            .filter(function (d) {return !isNaN(d.rate); })
            .map(function (d) {return parseFloat(d.rate); });
        domainRates.arvCoverageRate = [d3.min(d), d3.max(d)];
        that.initBackgroundColors();
    };

    //
    that.initBackgroundColors = function () {
        backgroundScale.domain(that.getSelectedDomainRates());
        backgroundScale.range([ias.config.map.background.startColor, ias.config.map.background.endColor]);
    };

    //
    that.update = function (params) {

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

    baseOptions[that.BACKGROUND_INFO] = "hivPrevalenceRate";
    baseOptions[that.YEAR] = "1980";
    baseOptions[that.NETWORKS] = {};
    baseOptions[that.ENROLLMENT_STATUS] = "All";
    baseOptions[that.AGE_GROUP] = "All";

    //
    options = new g2g.Options(baseOptions);

    //
    that.getValue = function (option) {
        return options.getValue(option);
    };

    //
    that.getBackgroundInfoOption = function () {
        return that.getValue(that.BACKGROUND_INFO);
    };

    //
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
                return "rgb(255,255,255)";
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
        function luminance(color) {
            var rgb = color.replace(/^rgb?\(|\s+|\)$/g, '').split(','),
                lum = 0.3 * rgb[0] + 0.59 * rgb[1] + 0.11 * rgb[2];
            return lum;
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

            nodeEnter.append("label")
                .attr("class", function (v) {return d.code === v.code ? "network title" : "network"; })
                .attr("for", function (v) {return 'n' + v.code; })
                .style("background", function (v) {luminance(color(v.code)); return color(v.code); })
                .style("color", function (v) {
                    var c = color(v.code),
                        l = luminance(c); 
                    if (l < 130) {return "lightgray"; }
                    return "#666";
                })
                .text(function (d) {return d.name; });

            if (d !== "Other") {
                nodeEnter.append("br");
            }

        });

    };

    that.update = function (params) {

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
		params.arvrates.forEach(function (r) {
			var c = that.allcountriesByName[r.country],
				rate = parseFloat(r.rate);
			if (c !== undefined) {
				c.arvCoverageRate = isNaN(rate) ? 'na' : rate;
			} else {
				ias.log('ARV Rates: no country found for ' + r.country);
			}
		});

		// init cohorts
		params.cohorts.forEach(function (d) {
			var coh = new ias.model.Cohort(d);
			that.cohorts.push(coh);
		});

		//
		that.allcountries.forEach(function (c) {
			if (c.numberOfCohorts() > 0) {
				that.countriesWithCohorts.push(c);
			}
		});

	};

	that.update = function (params) {

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
		this.hivPrevalenceRate = 'na';
		this.arvCoverageRate = 'na';
		this.size = 0; // number of subjects in that country
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

	model.Country.prototype.addCohort = function (cohort) {
		this.cohorts.push(cohort);
		this.size += cohort.size;
		return this;
	};

	model.Country.prototype.getCohortIds = function () {
		var result = [];
		if (this.cohorts && this.cohorts.length > 0) {
			this.cohorts.forEach(function (c) {
				result.push(c.code);
			});
		}
		return result;
	};

	return model;

}(ias.model || {}));
;
// augment model with CountryData object
ias.model = (function (model) {
	"use strict";

	model.CountryData = {
		countryId: "",
		size: 0,
		country: null
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
			var country = model.allcountriesById[d.trim()];
			if (country) {
				that.addCountryData(country.id, 10, country);
				country.addCohort(that); // bidirectional link
				country.addNetwork(cohortJson.networks[0]);
			} else {
				ias.log("Cohort country not found for " + d);
			}
		});

	};

	model.Cohort.prototype.getCountryData = function (countryId) {
		return this.countryData[countryId];
	};

	model.Cohort.prototype.getCountries = function () {
		var vals = [];
		for (var key in this.countryData) {
			if (this.countryData.hasOwnProperty(key)) {
				vals.push(this.countryData[key].country);
			}
		}
		return vals;
	};

	model.Cohort.prototype.getCountryIds = function () {
		return Object.keys(this.countryData);
	};

	model.Cohort.prototype.addCountryData = function (id, size, country) {
		var d = Object.create(ias.model.CountryData);
		d.countryId = id;
		d.size = size;
		d.country = country;
		this.countryData[id] = d;
		this.numberOfCountries += 1;
	};

	model.Cohort.prototype.getNetwork = function () {
		return this.networks[0];
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

            if (typeof overcoords === "undefined") {
                // compute country centroid
                coords = that.path.centroid(country.feature);
            } else {
                coords = that.projection(overcoords);
            }
            country.centroidx = coords[0];
            country.centroidy = coords[1];
        });


    };

    //
    that.update = function (params) {

    };

    //
    that.run = function () {
        that.components.forEach(function (c) {
            c.draw();
        });
    };

    //
    that.selectCohort = function (cohort) {
        if (that.selectedCohort === cohort) {
            return;
        }
        if (typeof that.selectedCohort !== "undefined") {
            that.map.deselect(that.selectedCohort);
        }
        that.selectedCohort = cohort;
        if (typeof cohort !== "undefined") {
            that.map.select(that.selectedCohort);
        }
    };

    //
    that.ZoomFactor = function ZoomFactor(values) {
        this.scales = values ? values : [1, 3, 6];
        this.current = 0;
        this.scale = function () {
            return this.scales[this.current];
        };
        this.factor = function () {
            return this.current + "x";
        };
        this.in = function () {
            if (this.current === (this.scales.length - 1)) {
                return false;
            }
            this.current += 1;
            return true;
        };
        this.out = function () {
            if (this.current === 0) {
                return false;
            }
            this.current -= 1;
            return true;
        };
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
    graph.CountryPin = function CountryPin(parent, country) {

        this.country        = country;
        this.maxRadius      = 20;
        this.minRadius      = 5;
        this.scale          = d3.scale.sqrt()
                                .domain([0, 300000])
                                .range([this.minRadius, this.maxRadius]);
        this.link           = null;
        this.radius         = this.scale(this.country.size);
        this.pack           = d3.layout.pack()
                                .size([this.radius, this.radius])
                                .value(function (d) { return d.size; })
                                .children(function (d) { return d.cohorts; });
        this.nodes          = this.pack.nodes(this.country);
        // 
        var cssCohortClass = "";
        this.country.cohorts.forEach(function (coh) {
            coh.cssIdClass = "c" + coh.code;
            cssCohortClass += " " + coh.cssIdClass;
        });
        this.classes = "pin country" + cssCohortClass;

        // Call the super constructor.
        g2g.GraphComponent.call(this, parent, 
            this.country.centroidx - this.radius / 2, 
            this.country.centroidy - this.radius / 2, 
            ias.util.getCountryColor(this.country.id), 
            this.classes);

    };

    //
    function onCohort(pin, cohort, enter) {
        var opacity = enter ? 0.15 : 0.9,
            color   = enter ? "black" : "#333",
            font    = enter ? "bold" : "normal";
        pin.parent.selectAll("circle.cohort:not(." + cohort.cssIdClass +  ")")
            .style("opacity", opacity);
        pin.parent.selectAll("g.country.pin:not(." + cohort.cssIdClass +  ")")
            .style("opacity", opacity);
        pin.parent.selectAll("circle.country.pin." + cohort.cssIdClass)
            .style("stroke", color);
        pin.parent.selectAll("text.country.pin." + cohort.cssIdClass)
            .style("fill", color)
            .style("font-weight", font);
        pin.parent.selectAll("text.country.pin.subjects." + cohort.cssIdClass)
            .style("display", enter ? "none" : "inline");
    }

    //
    function mouseover(pin, d) {
        if (!d.cohorts) {
            onCohort(pin, d, true);
            if (ias.graph.selectedCohort) {
                ias.graph.tooltip.cohort.hide();
            }
        }
    }

    //
    function mouseout(pin, d) {
        if (!d.cohorts) {
            onCohort(pin, d, false);
            if (ias.graph.selectedCohort) {
                ias.graph.tooltip.cohort.show();
            }
        }
    }

    //
    function click(pin, d) {
        d3.event.stopPropagation();
        if (!d.cohorts) {
            ias.graph.selectCohort(d);
        }
    }

    // Extend the GraphComponent prototype using Object.create()
    graph.CountryPin.prototype = Object.create(g2g.GraphComponent.prototype);


    //
    graph.CountryPin.prototype.filter = function () {
        var networksFilter  = ias.filter.getValue(ias.filter.NETWORKS),
            statusFilter    = ias.filter.getValue(ias.filter.ENROLLMENT_STATUS),
            that            = this;
        this.country.cohorts.forEach(function (c) {
            var show = networksFilter[c.getNetwork()];
            show &= ((statusFilter === "All") || (c.status === statusFilter));
            that.g.select("#" + that.country.id + "-" + c.code)
                    .style("display", show ? "inline" : "none");

        });
        return this;
    };

    //
    graph.CountryPin.prototype.draw = function () {
        var node    = this.g.selectAll("circle")
                        .data(this.nodes).enter(),
            that    = this; // keep CountryPin reference context
        
        // add pins: country and its cohorts
        node.append("svg:circle")
            .attr("class", function (d) { return d.cohorts ? that.classes : "cohort " + d.getNetwork() + " " + d.cssIdClass; })
            .attr("cx", function (d) { return d.x; })
            .attr("cy", function (d) { return d.y; })
            .attr("r", function (d) { return d.r; })
            .attr("id", function (d) { return that.country.id + "-" + d.code; })
            .style("fill", function (d) { return d.cohorts ? "gray" : ias.util.getNetworkColor(d.getNetwork()); })
            .on("mouseover", function (d) { mouseover(that, d); })
            .on("mouseout", function (d) {mouseout(that, d); })
            .on("click", function (d) {click(that, d); });

        // add text for country name
        this.g.append("svg:text")
            .attr("x", this.country.x)
            .attr("y", this.country.y - 1 * this.radius / 2)
            .attr("dy", "-.3em")
            .attr("text-anchor", "middle")
            .attr("class", this.classes)
            .text(this.country.name);

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
                                .attr("class", "pin country"),
            countryPins     = [],
            zoomFactor      = new ias.graph.ZoomFactor(),
            draging         = false,
            selectedCountry,
            center          = ias.graph.projection([0, 0]),
            m0;

        //
        function moveAndZoom(xy, delay) {
            center[0] += xy[0];
            center[1] += xy[1];
            var scale   = zoomFactor.scale(),
                tx      = -center[0] + ias.config.map.width / 2 / scale,
                ty      = -center[1] + ias.config.map.height / 2 / scale;
            g.transition().duration(delay)
                .attr("transform", "scale(" + scale + ") translate(" + tx + "," + ty + ")");
        }

        //
        function click(d) {
            var centroid;
            d3.event.stopPropagation();
            if (d) {
                center = ias.graph.path.centroid(d);
                if (zoomFactor.scale() > 1) {
                    moveAndZoom([0, 0], 1000);
                }
                clickOnCountry(d);
            }
        }

        //
        function clickOnCountry(d) {
            var countryId = ias.util.getCountryId(d),
                country = ias.model.allcountriesById[countryId];
            if (selectedCountry) {
                selectCountry(false);
            }
            selectedCountry = country;
            ias.graph.tooltip.country.html(ias.util.getCountryHtml(country)).show();
            selectCountry(true);
        }

        //
        function clickOnOcean(d) {
            selectCountry(false);
            ias.graph.tooltip.country.hide();
            selectedCountry = null;
            ias.graph.selectCohort();
        }

        //
        function selectCountry(selected) {
            var color   = selected ? "darkred" : "#fff",
                w       = selected ? 0.5 : 0.1;
            try {
                d3.select("#" + selectedCountry.id)
                    .style('stroke', color)
                    .style('stroke-width', w + "px");
            } catch (err) {
                //log(err); // TODO exotic countries with id = -99!
            }
        }

        //
        function zoomOut() {
            var zoomed = zoomFactor.out();
            if (zoomed) {
                if (zoomFactor.scale() === 1) {
                    center = ias.graph.projection([0, 0]);
                    center[1] += posy;
                }
                moveAndZoom([0, 0], 1000);
                ias.graph.legend.zoomed(zoomFactor);
            }
        }

        //
        function zoomIn() {
            var zoomed = zoomFactor.in();
            if (zoomed) {
                moveAndZoom([0, 0], 1000);
                ias.graph.legend.zoomed(zoomFactor);
            }
        }

        //
        function moveUp() {
            moveAndZoom([0, -10], 500);
        }

        //
        function moveDown() {
            moveAndZoom([0, +10], 500);
        }

        //
        function moveRight() {
            moveAndZoom([+10, 0], 500);
        }

        //
        function moveLeft() {
            moveAndZoom([-10, 0], 500);
        }

        //
        function mousemove() {
            var delta;
            if (draging) {
                delta = [-(d3.event.x - m0[0]), -(d3.event.y - m0[1])];
                m0 = [d3.event.x, d3.event.y];
                moveAndZoom(delta, 0);
                d3.event.preventDefault();
                d3.event.stopPropagation();
            }
        }

        //
        function mousedown() {
            if (zoomFactor.scale() > 1) {
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

            // install dragging events on svg map element
            svg.on("mousemove", mousemove)
                .on("mousedown", mousedown)
                .on("mouseup", mouseup)
                .on("click", clickOnOcean);
            // draw map (countries)
            gmap.selectAll("path")
                .data(ias.model.worldJson.features)
                .enter()
                .append("path")
                .attr("class", "country")
                .attr("d", ias.graph.path)
                .attr("pointer-events", "fill")
                .style("fill", function (d) {return ias.util.getCountryColorByFeature(d); })
                .attr("id", function (d) {return ias.util.getCountryId(d); })
                .style("opacity", ias.config.map.background.opacity)
                .on('click', click);
            gmap.select("#ATA").remove(); // remove Antartic
            // draw pins layer
            ias.model.countriesWithCohorts.forEach(function (country) {
                var pin = new ias.graph.CountryPin(gpins_country, country).draw();
                countryPins.push(pin);
            });

        }

        // 
        function update() {
        }

        //
        function filterUpdate(event) {
            if (event === ias.filter.BACKGROUND_INFO) {
                ias.util.initBackgroundColors(); // TODO: refactor this
                gmap.selectAll("path")
                    .style("fill", function (d) {return ias.util.getCountryColorByFeature(d); });
                return;
            }
            countryPins.forEach(function (d) {
                d.filter();
            });
        }

        //
        function select(d) {
            ias.log("select " + (d ? d.code : ""));
            // cohorts
            if (d.constructor.name === "Cohort") {
                ias.graph.tooltip.cohort.html(ias.util.getCohortHtml(d)).show();
                gpins_country.selectAll("circle.cohort." + d.cssIdClass)
                    .classed("selected", true); // add css class selected
            }
        }

        //
        function deselect(d) {
            ias.log("deselect " + (d ? d.code : ""));
            // cohorts
            if (d.constructor.name === "Cohort") {
                ias.graph.tooltip.cohort.hide();
                gpins_country.selectAll("circle.cohort." + d.cssIdClass)
                    .classed("selected", false); // remove css class selected
            }
        }

        //
        ias.filter.addListener([
            ias.filter.NETWORKS, 
            ias.filter.YEAR,
            ias.filter.ENROLLMENT_STATUS,
            ias.filter.BACKGROUND_INFO
        ], filterUpdate);

        // public
        return {
            draw: draw,
            update: update,
            filterUpdate: filterUpdate,
            zoomout: zoomOut,
            zoomin: zoomIn,
            moveup: moveUp,
            movedown: moveDown,
            moveright: moveRight,
            moveleft: moveLeft,
            select: select,
            deselect: deselect
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
            gbuttons        = svg.append("g")
                                .attr("id", "buttons")
                                .style("pointer-events", "none")
                                .attr('transform', 'translate(' + (posx + 680) + ',' + 5 + ')'),
            gradient        = svg.append("svg:defs")
                                .append("svg:linearGradient")
                                .attr("id", "gradient")
                                .attr("x1", "0%")
                                .attr("y1", "0%")
                                .attr("x2", "100%")
                                .attr("y2", "0%")
                                .attr("spreadMethod", "pad"),
            data            = [],
            xScale          = d3.scale.linear().domain([0, 100]).range([0, 120]),
            xAxis           = d3.svg.axis().scale(xScale).orient("top").ticks(5),
            xSelAxis        = d3.svg.axis().scale(xScale).orient("bottom");

        for (var i = 0; i < 100; i++) {
            data[i] = i;
        }

        //
        function addButton(name, x, y, opacity) {
            gbuttons.append("image")
                .attr("xlink:href", "images/" + name + ".png")
                .attr("width", 20)
                .attr("height", 20)
                .attr("x", x)
                .attr("y", y)
                .attr("id", name)
                .style("cursor", "pointer")
                .style("opacity", function (d) {return opacity ? opacity : 0.2; })
                .style("pointer-events", function (d) {return opacity ? "all" : "none"; })
                .on("click", ias.graph.map[name]);
        }

        //
        function legend1() {

            var domain = ias.util.getSelectedDomainRates();

            xSelAxis.tickValues(domain);

            gradient.selectAll("stop")
                .data(data)
                .enter()
                .append("svg:stop")
                .attr("offset", function (d) {return d + "%"; })
                .attr("stop-color", function (d) {return (d < domain[0] || d > domain[1]) ? "white" : ias.util.getBackgroundColor(d); })
                .attr("stop-opacity", 1);

            gbackground.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(10, 25)")
                .call(xAxis);

            gbackground.append("g")
                .attr("class", "x axis selected")
                .attr("transform", "translate(10, 45)")
                .call(xSelAxis);

            gbackground.append("svg:rect")
                .attr('class', 'legend')
                .attr("y", 25)
                .attr("x", 10)
                .attr("width", 120)
                .attr("height", 20)
                .style("fill", "url(#gradient)")
                .style("stroke", "#000")
                .style("stroke-width", ".3px");

            gbackground.append("rect")
                .attr('class', 'legend')
                .attr("x", 6 * 20 + 25)
                .attr("y", 25)
                .attr("width", 20)
                .attr("height", 20)
                .style("stroke", "#000")
                .style("stroke-width", ".3px")
                .style("fill", ias.config.map.background.naColor)
                .attr("dx", -3) // padding-right
                .attr("dy", ".35em"); // vertical-align: middle

            gbackground.append("text")
                .attr("x", 6 * 20 + 30)
                .attr("y", 15)
                .attr("class", "legend background")
                .text('n/a');

            gbackground.append("text")
                .attr("x", 10)
                .attr("y", 0)
                .attr("id", "backgroundInfoTitle")
                .attr("class", "title legend")
                .text(ias.config.legend.hivPrevalenceRate);
        }

        //
        function legend2() {

            var data        = ias.config.legend.cohorts,
                i           = 0,
                scale       = d3.scale.sqrt()
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

            addButton("zoomin", 50, 20, 1);
            addButton("zoomout", 25, 20);
            addButton("moveup", -20, 10);
            addButton("movedown", -20, 30);
            addButton("moveleft", -35, 20);
            addButton("moveright", -5, 20);

            gbuttons.append("text")
                .attr("x", 80)
                .attr("y", 32)
                .attr("id", "zoomFactor")
                .text("0x");

            legend1();
            legend2();

            svg.append("g")
                .append("text")
                .attr("x", ias.config.legend.width)
                .attr("y", ias.config.legend.height)
                .style("text-anchor", "end")
                .style("font-size", "0.7em")
                .style("fill", "gray")
                .text("version: " + ias.config.version + " - " + ias.config.timestamp);
        }

        // 
        function update() {
        }

        //
        function zoomed(zoomFactor) {
            var scale = zoomFactor.scale();
            gbuttons.selectAll("#moveup, #movedown, #moveright, #moveleft, #zoomout")
                .transition().duration(1000)
                .style("opacity", scale === 1 ? "0.2" : "1")
                .style("pointer-events", scale === 1 ? "none" : "all");
            gbuttons.select("#zoomin")
                .transition().duration(1000)
                .style("opacity", scale <= 3 ? "1" : "0.2")
                .style("pointer-events", scale <= 3 ? "all" : "none");
            gbuttons.select("#zoomFactor").text(zoomFactor.factor());
        }

        //
        function filterUpdate(event) {
            var backgroundInfo = ias.filter.getBackgroundInfoOption();
            gbackground.select("#backgroundInfoTitle").text(ias.config.legend[backgroundInfo]);
            var domain = ias.util.getSelectedDomainRates();
            xSelAxis.tickValues(domain);
            gbackground.select(".x.axis.selected")
                .call(xSelAxis);
            gradient.selectAll("stop")
                .attr("offset", function (d) {return d + "%"; })
                .attr("stop-color", function (d) {return (d < domain[0] || d > domain[1]) ? "white" : ias.util.getBackgroundColor(d); })
                .attr("stop-opacity", 1);
        }

        //
        ias.filter.addListener(ias.filter.BACKGROUND_INFO, filterUpdate);

        return {
            draw: draw,
            update: update,
            filterUpdate: filterUpdate,
            zoomed: zoomed
        };
    };

    return graph;

}(ias.graph || {}));
;

// launch IAS app
ias.launchApp();

