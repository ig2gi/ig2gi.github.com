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
    my.GraphComponent.prototype.id = function (id) {
        this.g.attr("id", id);
        return this;
    };

    //
    my.GraphComponent.prototype.on = function (event, callback) {
        this.g.on(event, callback);
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

    //
    //
    //
    //
    my.Pin = function (svg, x, y, text, color1, color2, size, classes, amount) {

        // call super constructor
        my.GraphComponent.call(this, svg, x, y, color1, classes);

        this.text = text;
        this.color1 = color1;
        this.color2 = color2;
        this.size = size;
        this.x = x;
        this.y = y;
        this.amount = amount;

    };

    // Extend the GraphComponent prototype using Object.create()
    my.Pin.prototype = Object.create(my.GraphComponent.prototype);

    //
    my.Pin.prototype.draw = function () {
        var pi      = Math.PI,
            radius  = this.size / 2,
            height  = 4 * radius;

        var arc = d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(radius)
                    .startAngle(pi / 2)
                    .endAngle(-pi / 2),
            arccoh = d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(radius - 4)
                    .startAngle(0)
                    .endAngle(2 * pi * this.amount);

        this.g.append("path")
            .attr("class", "pin")
            .attr("d", arc)
            .attr("transform", "translate(0, +1)")
            .style("fill", this.color1)
            .style("stroke-width", 0);
                
        this.g.append('path')
            .attr("class", "pin")
            .attr('d', function (d) { 
                return 'M ' + (-radius) + ' 0 l ' + 2 * radius + ' 0 l ' + (-radius) + ' '  + height + ' z';
            })
            .style("fill", this.color1)
            .style("stroke-width", 0);
  
        this.g.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("class", "pin")
            .style("fill", this.color2)
            .attr("r", radius - 3)
            .style("stroke-width", 0)
            .style("opacity", 1);

        this.g.append("path")
                .attr("d", arccoh)
                .style("fill", "steelblue")
                .style("stroke-width", 0);
        
        this.g.append("text")
            .attr("dx", 0)
            .attr("dy", "0.35em")
            .attr("class", 'pin')
            .style("text-anchor", "middle")
            .text(this.text);
        this.g.attr('transform', 'translate(' + this.x + ',' + (this.y + -height) + ')');
        return this; // chaining
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
    function showMap(error, world, centroids, networks, cohorts, unaidsinfo) {
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
                            "unaidsinfo": unaidsinfo
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
            .defer(d3.json, my.config.data[mode + "UnaidsInfo"])
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
        backgroundScale = d3.scale.quantile(),
        networkColors   =  {},
        domainRates     = {};

    //
    that.getNetworkColor = function (code) {
        if (networkColors.hasOwnProperty(code)) {
            return networkColors[code];
        }
        return "white";
    };

    //
    that.getCountryColor = function (id) {
        var country = ias.model.getCountryById(id),
            rate    = country[ias.filter.getBackgroundInfoOption()];
        return that.getBackgroundColor(rate);
    };

    //
    that.getBackgroundColor = function (rate) {
        if (isNaN(rate)) {
            return ias.config.map.background.naColor;
        }
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
        return that.getBackgroundColor(rate);
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
        h += cohort.getCountries().map(function (d) {return d.name; }).join(", ") + "<br><br>";
        h += "<b>Objectives:&nbsp;</b>";
        h += "<span class='tooltip objectives'>" + cohort.objectives + "</span>";
        h += "<br><br><a class='tooltip' target='_blank' href='" + ias.config.map.cohort.fullProfile.replace('$code$', cohort.code) + "'>View Full Profile</a><br><br>";
        h += "<b>Subjects:&nbsp;</b>";
        h += "<br><div id='tooltipsvg'></div>";
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
        var d, codes, nScale;
        // network colors
        codes = params.networks.map(function (n, index) { return n.code; });
        nScale = d3.scale.category20c().domain(codes);
        codes.forEach(function (c) {
            networkColors[c] = nScale(c);
        });
        // background (country) colors
        d = params.unaidsinfo
            .filter(function (d) {return !isNaN(d.hiv); })
            .map(function (d) {return parseFloat(d.hiv); });
        domainRates.hivPrevalenceRate = [d3.min(d), d3.max(d)];

        d = params.unaidsinfo
            .filter(function (d) {return !isNaN(d.arv); })
            .map(function (d) {return parseFloat(d.arv); });
        domainRates.arvCoverageRate = [d3.min(d), d3.max(d)];
        that.initBackgroundColors();
    };

    //
    that.initBackgroundColors = function () {
        var b = ias.config.map.background[ias.filter.getBackgroundInfoOption()];
        backgroundScale.domain(b.bands);
        backgroundScale.range(b.colors);
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

        d3.select("#mapInfo")
                .text("version: " + ias.config.version + " - " +
                    ias.config.timestamp + "  (" + ias.mode + ")"
                );

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
        function click(input, network) {
            var code = network.code;
            options.change(that.NETWORKS + "." + code, input.checked);
        }

        //
        params.networks.sort(function (a, b) {return d3.ascending(a.code, b.code); });
        var i = Math.round(params.networks.length / 2);
        var n = [params.networks.slice(0, i),
                 params.networks.slice(i, params.networks.length)
                 ];

        n.forEach(function (data, index) {

            data.forEach(function (n) {
                options.networks[n.code] = true;
            });

            nodeEnter = d3.select("#net" + (index + 1)).selectAll("div")
                        .data(data)
                        .enter()
                        .append("div")
                        .attr("class", "network");

            nodeEnter.append("input")
                .attr("checked", true)
                .attr("class", "network")
                .attr("type", "checkbox")
                .attr("id", function (v) {return 'n' + v.code; })
                .on("click", function (v) {return click(this, v); });

            nodeEnter.append("span")
                    .text("__")
                    .style("color", function (v) {return ias.util.getNetworkColor(v.code); })
                    .style("background", function (v) {return ias.util.getNetworkColor(v.code); });

            nodeEnter.append("label")
                .attr("class", "network")
                .attr("for", function (v) {return 'n' + v.code; })
                //.style("background", function (v) {return ias.util.getNetworkColor(v.code); })
                .text(function (d) {return " " + d.name; });

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
		params.unaidsinfo.forEach(function (r) {
			var c = that.allcountriesByName[r.name];
			if (c !== undefined) {
				c.hivPrevalenceRate = parseFloat(r.hiv);
				c.arvCoverageRate = parseFloat(r.arv);
			} else {
				ias.log('HIV/ARV Rates: no country found for ' + r.name);
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
// augment model with Cohort object
ias.model = (function (model) {
	"use strict";

	// Constructor
	model.Cohort = function Cohort(cohortJson) {

		this.status = cohortJson.status;
		this.code = cohortJson.code;
		this.name = cohortJson.name;
		this.subjects = cohortJson.subjects;
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

	model.Cohort.prototype.getSubjects = function () {
		if (this.subjects) {
			var result = {
				groups: d3.map(),
				subgroups: d3.map(),
				data: {}
			};
			this.subjects.forEach(function (s) {
				result.subgroups.set(s.subgroup, s.subgroup);
				result.groups.set(s.group, s.group);
				if (s.group in result.data) {
					result.data[s.group].subjects.push({
						name: s.subgroup,
						total: s.male + s.female,
						male: s.male,
						female: s.female
					});
					result.data[s.group].total += s.male + s.female;
				} else {
					result.data[s.group] = {
						group: s.group,
						total: s.male + s.female,
						subjects: [{
								name: s.subgroup,
								total: s.male + s.female,
								male: s.male,
								female: s.female
							}]
						};
				}
			});
			return result;
		}
		return undefined;		
	};

	return model;

}(ias.model || {}));
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
ias.graph = (function () {
    "use strict";
    var that  = {

        components: [],
        tooltip: {
            country: {},
            cohort: {}
        }
    };

    that.projection = d3.geo.miller().precision(0.1).scale(153);
    that.path = d3.geo.path().projection(that.projection);

    //
    // Init Function:
    //
    that.init = function (params) {

        var mapsvg, legendsvg, titlesvg, zoomsvg, overloadCentroids = {};

        mapsvg = d3.select("#map")
                .append("svg")
                .attr("class", "map")
                .attr("width", ias.config.map.width)
                .attr("height", ias.config.map.height);

        legendsvg = d3.select("#legend")
                .append("svg")
                .attr("class", "legend")
                .attr("width", ias.config.legend.width)
                .attr("height", ias.config.legend.height);

        titlesvg = d3.select("#title")
                .append("svg")
                .attr("class", "title")
                .attr("width", 360)
                .attr("height", 50);

        zoomsvg = d3.select("#zoom")
                .append("svg")
                .attr("class", "zoom")
                .attr("width", 180)
                .attr("height", 60);

        that.zoom = ias.graph.zoom(zoomsvg);
        that.components.push(that.zoom);

        that.map = ias.graph.map(mapsvg);
        that.components.push(that.map);

        that.legend = ias.graph.legend(legendsvg);
        that.components.push(that.legend);

        that.components.push(ias.graph.title(titlesvg));

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

    ias.modules.push(that);
    return that;

}());;// augment graph module with pin
ias.graph = (function (graph) {
    "use strict";

    //
    //
    graph.CountryPin = function CountryPin(parent, country) {

        this.country    = country;
        this.cohortPins = [];
        this.pinSize = ias.config.map.cohort.pinSize;
        this.pinScale = d3.scale.threshold()
                .domain(ias.config.map.cohort.pinScale)
                .range([0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.865, 1]);

        // 
        var cssCohortClass = "";
        this.country.cohorts.forEach(function (coh) {
            coh.cssIdClass = "c" + coh.code;
            cssCohortClass += " " + coh.cssIdClass;
        });
        this.classes = "pin country" + cssCohortClass;

        // Call the super constructor.
        g2g.GraphComponent.call(this, parent, 
            this.country.centroidx, 
            this.country.centroidy, 
            ias.util.getCountryColor(this.country.id), 
            this.classes);

    };

    //
    function onCohort(pin, cohort, enter) {
        var opacity = enter ? 0.15 : 0.9;
        pin.parent.selectAll(".pin.cohort:not(." + cohort.cssIdClass +  ")")
            .style("opacity", opacity);
    }

    //
    function mouseover(pin, d) {
        if (!d.cohorts) {
            onCohort(pin, d, true);
        }
    }

    //
    function mouseout(pin, d) {
        if (!d.cohorts) {
            onCohort(pin, d, false);
        }
    }

    //
    function click(pin, d) {
        d3.event.stopPropagation();
        if (!d.cohorts) {
            ias.graph.map.select(d);
            onCohort(pin, d, true);
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
    graph.CountryPin.prototype.zoomAndPan = function (scale, translate) {
        var tt = [translate[0] + this.x * scale, translate[1] + this.y * scale];
        this.g.attr("transform", "translate(" + tt.join(",") + ")");
    };

    //
    graph.CountryPin.prototype.draw = function () {
        var that = this; // keep CountryPin reference context
        var col, 
            n = this.country.cohorts.length, 
            xc = (n + 1) / 2 * this.pinSize, 
            yc, 
            amount;
        this.g.append("path")
            .attr("d", d3.svg.symbol().type("circle"))
            .style("fill", "none")
            .style("stroke-width", 0.5)
            .style("stroke", "gray");
        this.country.cohorts.forEach(function (c) {
            col = ias.util.getNetworkColor(c.getNetwork());
            xc -= that.pinSize;
            yc = 0;
            amount = that.pinScale(c.size / 1000);
            var p = new g2g.Pin(that.g, xc, yc, "", col, "white",  that.pinSize, "pin cohort " + c.cssIdClass, amount)
                .on("mouseover", function (d) { mouseover(that, c); })
                .on("mouseout", function (d) {mouseout(that, c); })
                .on("click", function (d) {click(that, c); })
                .draw();
            p.id(that.country.id + "-" + c.code);
            that.cohortPins.push(p);
        });
        return this; // chaining
    };

    return graph;

}(ias.graph || {}));

;
// augment graph module with legend
ias.graph = (function (graph) {
    "use strict";

    graph.legend = function (svg) {

        var posx            = 10,
            posy            = 20,
            gbackground     = svg.append("g")
                                .attr("id", "blegend")
                                .attr('transform', 'translate(' + posx + ',' + posy + ')'),
            gcohort         = svg.append("g")
                                .attr("id", "clegend")
                                .attr('transform', 'translate(' + (posx + 210) + ',' + posy + ')');

        //
        function legend1() {

            drawLegendBackgound();

            gbackground.append("rect")
                .attr('class', 'legend')
                .attr("x", 6 * 20 + 30)
                .attr("y", 25)
                .attr("width", 20)
                .attr("height", 20)
                .style("stroke", "#000")
                .style("stroke-width", ".3px")
                .style("fill", ias.config.map.background.naColor)
                .attr("dx", -3) // padding-right
                .attr("dy", ".35em"); // vertical-align: middle

            gbackground.append("text")
                .attr("x", 6 * 20 + 35)
                .attr("y", 22)
                .attr("class", "legend background")
                .text('na');

            gbackground.append("text")
                .attr("x", 8)
                .attr("y", 22)
                .attr("class", "legend background")
                .text('<');

            gbackground.append("text")
                .attr("x", 10)
                .attr("y", 0)
                .attr("id", "backgroundInfoTitle")
                .attr("class", "title legend")
                .text(ias.config.legend.hivPrevalenceRate);

            gbackground.append("text")
                .attr("x", 20)
                .attr("y", 65)
                .attr("class", "title legend")
                .style("font-style", "italic")
                .text("Source: AIDSinfo");

        }

        //
        function legend2() {

            var data = ias.config.map.cohort.pinScale,
                n = data.length,
                s = "", d0,
                arc;
       
            data.forEach(function (d, i) {
                if (i === 0) {
                    s += "< " + d;
                } else if (i === n) {
                    s += "> " + d;
                } else {
                    s += d0 + " - " + d;
                }
                gcohort.append("text")
                    .attr("y", 15 + i * 10)
                    .attr("x", 40)
                    .attr("class", "legend")
                    .text(s);
                d0 = d;
                s = "";
                arc = d3.svg.arc()
                    .innerRadius(0)
                    .outerRadius(4)
                    .startAngle(0)
                    .endAngle(2 * Math.PI * (i + 1) * 0.125);
                gcohort.append("path")
                    .attr("d", arc)
                    .attr("transform", "translate(30," + (12 + i * 10) + ")")
                    .style("fill", "steelblue")
                    .style("stroke", "steelblue")
                    .style("stroke-width", 0);
                gcohort.append("circle")
                    .attr("cx", 30)
                    .attr("cy", 12 + i * 10)
                    .attr("r", 4)
                    .style("fill", "none")
                    .style("stroke", "steelblue")
                    .style("stroke-width", 0.5);
            });
            gbackground.append("text")
                .attr("x", 200)
                .attr("y", 0)
                .attr("class", "title legend")
                .text("Cohort Size (K)");
            new g2g.Pin(gcohort, 10, 55, "", "gray", "white", 15, "", 0.25)
                .draw();
        }

        //
        function drawLegendBackgound() {
            var backgroundInfo = ias.filter.getBackgroundInfoOption();
            var backgroundConfig = ias.config.map.background[backgroundInfo];
            var rects = gbackground.selectAll("rect.legend.bckg")
                .data(backgroundConfig.bands);
            var texts = gbackground.selectAll("text.legend.bckg")
                .data(backgroundConfig.bands);

            // enter
            rects.enter()
                .append("rect")
                .attr('class', 'legend bckg')
                .attr("y", 25)
                .attr("x", function (d, i) { return i * 22 + 15; })
                .attr("width", 20)
                .attr("height", 20)
                .style("fill", function (d, i) { return backgroundConfig.colors[i]; })
                .style("opacity", ias.config.map.background.opacity)
                .style("stroke", "#000")
                .style("stroke-width", ".3px");
            texts.enter()
                .append("text")
                .attr("x", function (d, i) { return i * 22 + 25; })
                .attr("y", 22)
                .style("text-anchor", "middle")
                .attr("class", "legend bckg")
                .text(function (d, i) { return d; });

            // update
            rects.attr("x", function (d, i) { return i * 22 + 15; })
                .style("fill", function (d, i) { return backgroundConfig.colors[i]; });
            texts.attr("x", function (d, i) { return i * 22 + 25; })
                .text(function (d, i) { return d; });

            // exit
            rects.exit().remove();
            texts.exit().remove();
        }

        //
        function draw() {
            legend1();
            legend2();
        }

        // 
        function update() {
        }

        //
        function filterUpdate(event) {
            var backgroundInfo = ias.filter.getBackgroundInfoOption();
            gbackground.select("#backgroundInfoTitle").text(ias.config.legend[backgroundInfo]);
            drawLegendBackgound();
        }

        //
        ias.filter.addListener(ias.filter.BACKGROUND_INFO, filterUpdate);

        return {
            draw: draw,
            update: update,
            filterUpdate: filterUpdate
        };
    };

    return graph;

}(ias.graph || {}));
;// augment graph module with tooltip
ias.graph = (function (graph) {
    "use strict";

    graph.map = function (svg) {

        var posx            = -60,
            posy            = 120,
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
            controller      = createController();

        //
        function zoomAndPan(scale, translate) {
            var tt = "translate(" + translate.join(",") + ")";
            var ts = "scale(" + scale + ")";
            gmap.attr("transform", tt + ts);
            gmap.selectAll("path")  
                .attr("d", ias.graph.path.projection(ias.graph.projection)); 
            countryPins.forEach(function (p) {
                p.zoomAndPan(scale, translate);
            });
        }

        //
        function click(d) {
            var centroid;
            d3.event.stopPropagation();
            if (d) {
                centroid = ias.graph.path.centroid(d);
                // TODO: recenter the map (if asked)
                clickOnCountry(d);
            }
        }

        //
        function clickOnCountry(d) {
            var countryId = ias.util.getCountryId(d),
                country = ias.model.allcountriesById[countryId];
            controller.select(country);
        }

        //
        function clickOnOcean() {
            controller.reset();
        }

        //
        function draw() {

            // grid
            svg.append("path")
                .datum(d3.geo.graticule())
                .attr("class", "graticule")
                .attr("d", ias.graph.path);

            // install dragging events on svg map element
            svg.on("mousedown", mousedown)
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
        function mousedown() {
            svg.style("cursor", "move");
        }

        //
        function mouseup() {
            svg.style("cursor", "pointer");
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

        /**
        *
        *
        */
        function createController() {

            var country, cohort; //selected country & cohort

            //
            function select(d) {
                // cohort
                if (d && d.constructor.name === "Cohort") {
                    selectCohort(d);
                    selectCountry(null);
                    return;
                }
                // country
                if (d && d.constructor.name === "Country") {
                    selectCohort(null);
                    selectCountry(d);
                    return;
                }
            }

            //
            function reset() {
                selectCohort(null);
                selectCountry(null);
            }

            //
            function selectCohort(c) {
                if (cohort === c) {
                    return;
                }
                if (cohort) {
                    gpins_country.selectAll("circle.cohort." + cohort.cssIdClass)
                        .classed("selected", false); // remove css class selected
                }
                cohort = c;
                if (cohort) {
                    var newHtml = ias.util.getCohortHtml(cohort);
                    ias.graph.tooltip.cohort.html(newHtml);
                    ias.graph.createSubjectsGraph(cohort.getSubjects());
                    ias.graph.tooltip.cohort.show();
                    gpins_country.selectAll("circle.cohort." + cohort.cssIdClass)
                        .classed("selected", true); // add css class selected
                } else {
                    ias.graph.tooltip.cohort.hide(); 
                }   
            }

            //
            function selectCountry(c) {
                if (country === c) {
                    return;
                }
                if (country) {
                    d3.select("#" + country.id)
                        .style('stroke', "#000")
                        .style('stroke-width', 0.1 + "px");
                }
                country = c;
                if (country) {
                    ias.graph.tooltip.country.html(ias.util.getCountryHtml(country)).show();
                    try {
                        d3.select("#" + country.id)
                            .style('stroke', "darkred")
                            .style('stroke-width', 0.5 + "px");
                    } catch (err) {
                        //log(err); // TODO exotic countries with id = -99!
                    }
                } else {
                    ias.graph.tooltip.country.hide(); 
                }  
            }

            return {
                select: select,
                reset: reset
            };

        }

        // Register Map as Filter Listener
        ias.filter.addListener([
            ias.filter.NETWORKS, 
            ias.filter.YEAR,
            ias.filter.ENROLLMENT_STATUS,
            ias.filter.BACKGROUND_INFO
        ], filterUpdate);

        // Register Map to Zoom Component
        ias.graph.zoom.register(svg, zoomAndPan, [posx, posy]);

        // Public Map Interface
        return {
            draw: draw,
            update: update,
            filterUpdate: filterUpdate,
            select: controller.select
        };

    };

    return graph;

}(ias.graph || {}));;// augment graph module with graph of subjects
ias.graph = (function (graph) {
    "use strict";

    var humanImages = {
        male: "./images/male_adult.png",
        female: "./images/female_adult.png"    
    };

    /**
    *
    *
    */
    graph.createSubjectsGraph = function (subjects) {
		
        var svg = d3.select("#tooltipsvg")
				.append("svg")
				.attr("width", 200)
				.attr("height", subjects ? Object.keys(subjects).length * 200 : 100);
		var color = d3.scale.category10();

        if (subjects) {
			// loop through age groups
            var i = 0;
            var offset = drawLegend(svg, subjects);
			for (var group in subjects.data) {
				if (subjects.data.hasOwnProperty(group)) {
					drawGraph(svg, subjects.data[group], i, offset);
                    i += 1;
				}
			}
		} else {
			svg.append("g")
				.append("text")
				.attr("x", 0)
                .attr("y", 10)
                .attr("class", "tooltip")
				.text("No subject details.");
		}

        //
        function drawLegend(svg, subjects) {
            var data = subjects.subgroups.keys();
            svg.append("g")
                .attr("transform", "translate(10, 10)")
                .selectAll("text")
                .data(data)
                .enter()
                .append("svg:text")
                .attr("class", "label subjects")
                .attr("dy", ".35em")
                .attr("x", 10) 
                .attr("text-anchor", "start")
                .attr("y", function (d, i) {return (1 * i) + "em"; }) 
                .text(function (d, i) { return d; })
                .style("stroke", function (d) { return color(d); });
            return data.length * 12;
        }

        // TODO refactor this code
        function drawGraph(svg, data, i, offset) {

            var innerRadius = 50,
                outerRadius = 70,
                posy = 2.4 * outerRadius * (i) + outerRadius + 30 + offset,
                posx = 30 + outerRadius;

            var categories = data.subjects.map(function (d) {return d.name; });

            var g = svg.append("svg:g")
                .attr("transform", "translate(" + posx + "," + posy + ")");

            var arc = d3.svg.arc()
                .outerRadius(innerRadius - 10)
                .innerRadius(innerRadius - 40);

            var arc2 = d3.svg.arc()
                .outerRadius(innerRadius + 10)
                .innerRadius(innerRadius - 38);

            var arc3 = d3.svg.arc()
                .outerRadius(innerRadius + 4)
                .innerRadius(innerRadius + 2);

            var arc4 = d3.svg.arc()
                .outerRadius(innerRadius + 22)
                .innerRadius(innerRadius + 20);

            var pie = d3.layout.pie()
                .sort(null)
                .value(function (d) { return d.total; });

            var garcs = g.selectAll("g.arc")
                        .data(pie(data.subjects))
                        .enter()
                        .append("g")
                        .attr("class", "arc");

            // draw title + total
            g.append("text")
                .attr("class", "title subjects")
                .attr("transform", "translate(0," + (-outerRadius - 10) + ")")
                .attr("text-anchor", "middle")
                .text(data.group + ": " + data.total);

            // draw arc paths
            garcs.append("path")
                .attr("d", arc)
                .attr("class", "subjects")
                .style("fill", function (d, i) { return color(d.data.name); });

            garcs.append("path")
                .attr("d", arc4)
                .attr("class", "label subjects")
                .attr("id", function (d, i) { return "c" + i; });

            //level2
            var level2 = garcs.append("g").selectAll("path")
                            .data(function (d) {
                                var pp = d3.layout.pie()
                                            .sort(null)
                                            .value(function (o) { return o.total; })
                                            .startAngle(d.startAngle)
                                            .endAngle(d.endAngle);
                                var col = color(d.data.name);
                                return pp([{name: "male", total: d.data.male, color: col},
                                    {name: "female", total: d.data.female, color: col}]);
                            })
                            .enter()
                            .append("g");

            level2.append("path")
                .attr("class", function (d) {return d.data.name + " subjects"; })
                .attr("d", arc2)
                .style("stroke", function (d) { return d.data.color; });

            level2.append("svg:image").attr("xlink:href", function (d) {return humanImages[d.data.name]; })
                .attr("x", function (d) {return arc3.centroid(d)[0] - 7; }) 
                .attr("y", function (d) {return arc3.centroid(d)[1] - 20; }) 
                .attr("width", 14) 
                .attr("height", 30)
                .style("opacity", 0.8);

            level2.append("svg:text")
                .attr("class", "label subjects")
                .attr("dy", ".35em")
                .attr("text-anchor", function (d) {
                    return (d.startAngle + d.endAngle) / 2 > Math.PI ? "end" : "start"; 
                })
                .attr("x", function (d) {return arc4.centroid(d)[0]; }) 
                .attr("y", function (d) {return arc4.centroid(d)[1]; }) 
                 .text(function (d, i) { return d.data.total; })
                .style("stroke", function (d) { return d.data.color; });
                    
        }

    };


	return graph;

}(ias.graph || {}));
;
// augment graph module with zoom commands
ias.graph = (function (graph) {
    "use strict";

    graph.title = function (svg) {

        var posx            = 10,
            posy            = 30,
            g               = svg.append("g")
                                .style("pointer-events", "none")
                                .attr('transform', 'translate(' + posx + ',' + posy + ')');

        //
        function draw() {
            g.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("class", "graphtitle")
                .text(ias.config.title);
        }

        // 
        function update() {
        }

        return {
            draw: draw,
            update: update
        };
    };

    return graph;

}(ias.graph || {}));
;// augment graph module with tooltip
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

}(ias.graph || {}));;
// augment graph module with zoom commands
ias.graph = (function (graph) {
    "use strict";

    graph.zoom = function (parentSvg) {

        var posx            = 50,
            posy            = 0,
            gbuttons        = parentSvg.append("g")
                                .attr("id", "buttons")
                                .style("pointer-events", "none")
                                .attr('transform', 'translate(' + posx + ',' + posy + ')'),
            buttons         = ["zoomin", "zoomout", "moveup", "movedown", "moveleft", "moveright"],
            control;

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
                .on("click", function (d) {control[name](); });
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
                .text("scale:1");
        }

        // 
        function update() {
        }

        // 
        function register(svg, callback, offset) {
            control = controller(svg, callback, offset);
        }

        //
        function zoomed(scale) {
            gbuttons.selectAll("#moveup, #movedown, #moveright, #moveleft, #zoomout")
                .style("opacity", scale === 1 ? "0.2" : "1")
                .style("pointer-events", scale === 1 ? "none" : "all");
            gbuttons.select("#zoomin")
                .style("opacity", scale < 6 ? "1" : "0.2")
                .style("pointer-events", scale < 6 ? "all" : "none");
            gbuttons.select("#zoomFactor").text("scale:" + scale.toFixed(1));
        }

        //
        function controller(svg, callback, offset) {

            var scale       = 1, // current scale
                translate   = [0, 0], // current translation
                width       = ias.config.map.width,
                height      = ias.config.map.height,
                origin      = ias.graph.projection([0, 0]), // center Lat:0 Long:0  
                zoom        = d3.behavior.zoom().scaleExtent([1, 6])
                                .on("zoom", function () {
                                    scale = d3.event.scale;
                                    translate = d3.event.translate;
                                    callback(scale, translate);
                                    zoomed(scale);
                                });
            svg.call(zoom);

             //
            function zoomOut() {
                var s = scale, delta = 1;
                if (s <= 2) {
                    scale = 1;
                } else if (s <= 4) {
                    scale = 2;
                    delta = 2;
                } else if (s <= 6) {
                    scale = 4;
                    delta = 2;
                }
                zoom.scale(scale);
                if (scale === 1) {
                    translate[0] = 0;
                    translate[1] = 0;
                } else {
                    translate[0] += delta * (width / 2 - offset[0]);
                    translate[1] += delta * (height / 2 - offset[1]);
                }
                zoom.translate(translate);
                callback(scale, translate);
                zoomed(scale);
            }

            //
            function zoomIn() {
                var s = scale, delta = 1;
                if (s < 2) {
                    scale = 2;
                } else if (s < 4) {
                    scale = 4;
                    delta = 2;
                } else if (s < 6) {
                    scale = 6;
                    delta = 2;
                }
                zoom.scale(scale);
                translate[0] -= delta * (width / 2 - offset[0]);
                translate[1] -= delta * (height / 2 - offset[1]);
                zoom.translate(translate);
                callback(scale, translate);
                zoomed(scale);
            }

            //
            function moveUp() {
                translate[1] -= 10;
                zoom.translate(translate);
                callback(scale, translate);
            }

            //
            function moveDown() {
                translate[1] += 10;
                zoom.translate(translate);
                callback(scale, translate);
            }

            //
            function moveRight() {
                translate[0] += 10;
                zoom.translate(translate);
                callback(scale, translate);
            }

            //
            function moveLeft() {
                translate[0] -= 10;
                zoom.translate(translate);
                callback(scale, translate);
            }

            return {
                zoomin: zoomIn,
                zoomout: zoomOut,
                moveleft: moveLeft,
                moveright: moveRight,
                moveup: moveUp,
                movedown: moveDown
            };

        }

        return {
            draw: draw,
            update: update,
            register: register
        };
    };

    return graph;

}(ias.graph || {}));
;

// launch IAS app
ias.launchApp();

