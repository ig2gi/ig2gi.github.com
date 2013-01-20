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
		log 	= IAS.log;

	// GEO JSON world countries
	that.worldJson = {};

	// Network JSON data
	that.networks = {};

	// all countries references
	that.allcountries = [];

	// lookup table Country Code <-> Country object
	that.allcountriesByName = {};

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
			// JSON feature object
			networks: [],
			cohorts: [],
			hivPrevalenceRate: undefined,

			id: function () {
				return this.feature.id;
			},

			name: function () {
				return this.feature.properties.name;
			},

			numberOfCohorts: function () {
				return this.cohorts ? this.cohorts.length : 0;
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

			getCountryData: function (countryId) {
				return this.countryData[countryId];
			},

			addCountryData: function (id, size) {
				var d = Object.create(CountryData);
				d.countryId = id;
				d.size = size;
				this.countryData[id] = d;
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
		that.allcountries.push(c);
		that.allcountriesByName[c.name()] = c;

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