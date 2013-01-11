/**
* IAS (International AIDS Society). 
*
* @author Gilbert Perrin (gilbert.perrin@gmail.com)
* @year 2013
*/
var IAS = IAS || {};
IAS.model = (function(){


	// log wrapper
	var log = log || function(){
	    if(console && console.log)
	      console.log.apply(console, arguments);
	}

	var _ias = {};

	 // GEO JSON world countries
	_ias.worldJson = {};

	// Network JSON data
	_ias.networks =  {};

	//
	_ias.countries = [];

	//
	_ias.hivRatesRange = [];

	// Lookup table Country Code <-> Country object
	_ias.countriesByName =  {};

	//
	_ias.cohorts =  [];



	//
	// Country Object Prototype
	//
	Country = {

		feature: {}, // JSON feature object
		networks: [],
		cohorts: [],
		hivPrevalenceRate: undefined,

		id: function(){
			return this.feature.id;
		},

		name: function(){
			return this.feature.properties.name;
		},

		numberOfCohorts: function(){
			return this.cohorts ? this.cohorts.length : 0;
		},


	}; // end of country prototype



	//
	// Cohort Object Prototype
	//
	Cohort = {

		status: "",
		code: "",
		name: "",
		networks: [],
		countries: [],

	}; // end of cohort prototype



	//
	// INIT FUNCTION
	//
	_ias.init = function(world, iasdb, hivrates){

		this.worldJson = world;
		this.networks = iasdb['networks'];
		
		// init countries
		this.worldJson.features.forEach(function (f){
			addCountry(f);
		});
		hivrates.forEach(function(r){
			c = _ias.countriesByName[r.country];
			if (c !== undefined){
				c.hivPrevalenceRate = parseFloat(r.rate);
				_ias.hivRatesRange.push(r.rate);
			}else{
				log('no country found for ' + r.country);
			}
		});

		// init cohorts
		iasdb['cohorts'].forEach(function(d){
			addCohort(d);
		});



		//log(this);

	};

	//
	//
	//
	_ias.getCountry = function(name){

		var c = _ias.countriesByName[name];
		return c;
	
	}




	// PRIVATE:

	//
	// ADD COUNTRY FUNCTION
	//
	addCountry = function(feature){

		var c = Object.create(Country);
		c.feature = feature;
		c.cohorts = [];
		_ias.countries.push(c);
		_ias.countriesByName[c.name()] = c;


	};

	//
	// ADD COHORT FUNCTION
	//
	addCohort = function(cohortJson){

		var c = Object.create(Cohort);
		c.status = cohortJson.status;
		c.code = cohortJson.code;
		c.name = cohortJson.name;
		c.countries = [];
		cohortJson.countries.forEach(function(d){
			var country = _ias.countriesByName[d];
			if(country){
				c.countries.push(country);
				country.cohorts.push(c); // bidirectional link
				country.networks = [];
				country.networks.push(cohortJson.networks);
			}
			else log("no country found for " + d)
		});
		c.networks = cohortJson.networks;
		_ias.cohorts.push(c);

	};



	return _ias;




}());// end of IAS module






