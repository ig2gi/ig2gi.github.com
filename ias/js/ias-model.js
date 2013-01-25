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
IAS.model = (function () {
	"use strict";

	var that    = {},
		log 	= IAS.log,
		util 	= IAS.util,
		config;

	// GEO JSON world countries
	that.worldJson = {};

	// Network JSON data
	that.networks = {};

	// all countries references
	that.allcountries = [];

	// lookup table Country Code <-> Country object
	that.allcountriesByName = {};

	// lookup table Country Id <-> Country object
	that.allcountriesById = {};

	// country references with cohorts only
	that.countriesWithCohorts = [];

	// all cohort references
	that.cohorts = [];

	// 
	that.hivRatesRange = [];

	//
	// Country Object Prototype
	//
	var Country = {

			feature: {},
			networks: [],
			cohorts: [],
			hivPrevalenceRate: undefined,
			arvCoverageRate: undefined,

			id: function () {
				return this.feature.id;
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
						color = util.networkColor.get(c.networks[0]);
						h += "<tr><td class='firstcol'><span style='background:" + color + ";'>&nbsp;&nbsp;&nbsp;</span>&nbsp;" + c.name + "</td><td class='secondcol'>" + c.size + "</td></tr>";
					});
				}
				h += "</table>";
				return h;
			}

		};

	var CountryData = {

			countryId: "",
			size: 0

		};

	//
	// Cohort Object Prototype
	//
	var Cohort = {

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
				var d = Object.create(CountryData);
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
				h += "&nbsp;<span style='background:" + util.networkColor.get(this.networks[0]) + ";'>&nbsp;&nbsp;&nbsp;</span>&nbsp" + this.networks[0];
				h += "<br><br><b>Status:</b>&nbsp;" + this.status + "<br>";
				h += "<br><b>Objectives:</b><br>";
				h += "<span class='tooltip objectives'>" + this.objectives + "</span>";
				h += "<br><br><b>Countries:</b><br><table>";
				for (k in this.countryData) {
					country = that.allcountriesById[k];
					rate = country.hivPrevalenceRate;
					color = util.mapColors(rate);
					h += "<tr><td class='firstcol'><span style='background:" + color + ";'>&nbsp;&nbsp;&nbsp;&nbsp;</span>&nbsp;" + country.name() + "</td></tr>";
				}
				h += "</table>";
				h += "<br><br><a class='tooltip' target='_blank' href='" + config.map.cohort.fullProfile.replace('$code$', this.code) + "'>View Full Profile</a>";

				return h;
			}

		};


	//
	// ADD COUNTRY FUNCTION
	//
	function addCountry(feature) {

		var c = Object.create(Country);
		c.feature = feature;
		c.cohorts = [];
		that.allcountries.push(c);
		that.allcountriesByName[c.name()] = c;
		that.allcountriesById[c.id()] = c;

	}

	//
	// ADD COHORT FUNCTION
	//
	function addCohort(cohortJson) {

		var c = Object.create(Cohort);
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

	//
	// INIT FUNCTION
	//
	that.init = function (world, networksJson, cohortsJson, hivrates) {

		that.worldJson = world;
		that.networks = networksJson.networks;

		config = IAS.util.config;

		// init countries
		that.worldJson.features.forEach(function (f) {
			addCountry(f);
		});
		hivrates.forEach(function (r) {
			var c = that.allcountriesByName[r.country];
			if (c !== undefined) {
				c.hivPrevalenceRate = parseFloat(r.rate);
				that.hivRatesRange.push(r.rate);
			} else {
				log('no country found for ' + r.country);
			}
		});
		util.mapColors.domain(that.hivRatesRange);

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

	//
	// Returns Country object from the given country name.
	//
	that.getCountry = function (name) {

		var c = that.allcountriesByName[name];
		return c;

	};


	return that;

}()); // end of IAS module