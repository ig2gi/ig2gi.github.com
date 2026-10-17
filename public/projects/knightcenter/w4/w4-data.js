
/*
 ====================
  W4 Data Namespace 
 ====================
*/
var w4 = {


  // raw data from csv file
  unemployment_rawdata: {},

  // raw data from csv file
  usrates_rawdata: {},

  // current selected month/year (%B %Y)
  currentdate: 'September 2012',

  // rates (min,mean,max) for the current select date
  rate_mean: 7,
  rate_min: Number.POSITIVE_INFINITY,
  rate_max: Number.NEGATIVE_INFINITY,

  // current selected state
  currentstate: {
      id: -1,
      name: 'US Rate',

  },

  // maximum number of unemployed in sep 2012
  max_unemployed2012: 0,

  // lookup table: state id -> rates in 2009 
  rate2009ById: {},

  // lookup table: state id -> rates in currentdate 
  rateById: {},

  // lookup table: state id -> number of unemployed in sep 2012
  unemployed2012ByState: {},

  // array of U.S. rates [date, state rates]
  usrates: [],

  // the current rates range
  ratesrange: [],

  // lookup table: date -> U.S. rate
  usratesByDate: {},


  // initialze all data needed
  init: function(files){

      this.unemployment_rawdata = files[0];
      this.usrates_rawdata = files[1];

      this.unemployment_rawdata.forEach(
          function(d) { 
              w4.rate2009ById[d.id] = +d['January 2009'];
              w4.rateById[d.id] = +d[this.currentdate];
              w4.unemployed2012ByState[d.id] = d['sep2012N']
              if(d['sep2012N'] > w4.max_unemployed2012){
                  w4.max_unemployed2012 = d['sep2012N'];
              }
          }
      );

      this.usrates_rawdata.forEach(
          function(d){
              var obj = {};
              obj['date'] = parseDate(d.month);
              obj['US Rate'] = parseFloat(d.rate);
              w4.unemployment_rawdata.forEach(function(u,i){
                  obj[u.state] = u[d.month];
              });
              w4.usrates.push(obj);
              w4.usratesByDate[d.month] = parseFloat(d.rate);
          }
      );

      this.selectDate('September 2012');

    }, // end of init

    // select a new couple month/year date
    selectDate: function(date){

        this.currentdate = date;
        this.rate_mean = parseFloat(this.usratesByDate[date]);
        this.unemployment_rawdata.forEach(
            function(d) { 
                w4.rateById[d.id] = +d[w4.currentdate];
              }
        );
        for(r in this.rateById){
            v = this.rateById[r];
            if(v <= this.rate_min) this.rate_min = v;
            if(v >= this.rate_max) this.rate_max = v;
        }
        var k = 0;
        var step = (this.rate_max - this.rate_min) / 17;
        for(var i = this.rate_min; i <= this.rate_max  ; i = i + step){
            var r = parseFloat(i).toFixed(1);
            this.ratesrange[k++] = r;
        }

    }, // end of selectDate

    // select a state (from the map)
    selectState: function(id, state){
        this.currentstate.id = id;
        this.currentstate.name = state;
    },

    // returns the U.S. rate for the current selected date
    usrate: function(){
        return 'U.S. Rate = ' + this.rate_mean + '%';
    },

    // just for debugging
    log: function(property){
        if (property){
          console.log(property +": " + this[property]);
        }
        else {
          console.log(this);
        }
    },



}; // end of w4


