

var width = 1300,
    height = 800;

var currentMonth = 'September 2012';
var currentIndex = 0;

var body = d3.select("body");


var data_unemployment;
var data_us_rates;

var rateById = {};
var rmean=7.8, rmin=0,rmax=15;
    
function quantize(r){
  var clazz;
  if(r <= rmean){
    l = 'q';
    quantz = d3.scale.quantize()
        .domain([rmin, rmean])
        .range(d3.range(9));
    clazz = 'q' + quantz(r) + "-9";
  }else{
     quantz = d3.scale.quantize()
         .domain([rmean, rmax])
         .range(d3.range(9));
     clazz = 'p' + quantz(r) + "-9";
  }
  //console.log("r=" + r +" rmean=" + rmean + " :" + clazz);
  return clazz;
}

var path = d3.geo.path();

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);
   // .attr("class", "Blues");


var map = svg.append("g")
      .attr("class", "states map")
     .attr('transform', 'translate(350, 200)');

var index_bar = svg.append("g")
	      .attr("class", "indexbar")
	     .attr('transform', 'translate(10, 100)');
	     
var legend =  svg.append("g")
       	      .attr("class", "legend")
       	     .attr('transform', 'translate(700, 120)');

svg.append("g").attr('transform', 'translate(0, 100)').append("rect")
           		.attr("x", 0)
           		.attr("y", 0)
           		.attr("width", 280)
           		.attr("height", 700)
           		.attr("class","frame");



var legend_data;
             


queue()
	    .defer(d3.json, "us-counties.json")
	    .defer(d3.json, "us-states.json")
	    .defer(d3.csv, "US_unemployment.csv")
		.defer(d3.csv,"US_unemployment_rate.csv")
	    .await(ready);
	
function us_rate(){
	return 'US Rate (mean) = ' + rmean + '%';
}
	
function refresh(){
  data_unemployment.forEach(function(d) { rateById[d.id] = +d[currentMonth];});
	rmin = Number.POSITIVE_INFINITY;
  rmax = Number.NEGATIVE_INFINITY;
  for(k in rateById){
    v = rateById[k];
    if(v <= rmin) rmin = v;
    if(v >= rmax) rmax = v;
  }
  
  //console.log(rmin +"/" + rmax);
	d3.select('.title').text(currentMonth);
	d3.select('.usrate').text(us_rate());
	map.selectAll("path")
	      .attr("class", function(d) { return quantize(rateById[d.id]); })
	k = 0;
	legend_data = new Array();
	step = (rmax - rmin) / 17;
  for(var i = rmin; i <= rmax ; i = i + step){
      legend_data[k++] = parseFloat(i).toFixed(1);
  }
  //console.log(legend_data);

	legend.selectAll("rect")
	      .data(legend_data)
    		.attr("class", function(d, i) { return quantize(d); });
    		
	legend.selectAll("text")
           		.data(legend_data)
           		.text(function(d, i) { return d});      
}

/**
*
*/
function ready(error, counties, states, unemployment, rates) {
  
  data_unemployment  = unemployment;
  data_us_rates = rates;
  legend_data = new Array();
  k = 0;
  for(var i = 1; i <= 18 ; i++){
      legend_data[k++] = i;
  }
  rmean = parseFloat(data_us_rates[0]['rate']);
  

  unemployment.forEach(function(d) { rateById[d.id] = +parseFloat(d[currentMonth]);});

 

 

    // ---------------------------- 
    //  MAP
    // ----------------------------
  	map.selectAll("path")
      .data(states.features)
    	.enter().append("path")
      .attr("class", function(d) { return quantize(rateById[d.id]); })
      .attr("d", path);

	svg.append('svg:text')
		.attr('class', 'title')
		.attr('transform', 'translate(700, 100)')
		.text(currentMonth);
	
	svg.append('svg:text')
			.attr('class', 'usrate')
			.attr('transform', 'translate(700, 120)')
			.text(us_rate());
			
// ---------------------------- 
//  LEGEND
// ----------------------------
	legend.selectAll("rect")
    		.data(legend_data)
    		.enter().append("rect")
    		.attr("x", function(d, i) { return i*20 })
    		.attr("y", 30)
    		.attr("width", 20)
    		.attr("height", 20)
    		.attr("class", function(d, i) { return quantize(d) + " legendbar"; })
    		.attr("dx", -3) // padding-right
    		.attr("dy", ".35em"); // vertical-align: middle
    		
    		
  legend.selectAll("text")
          		.data(legend_data)
          		.enter().append("text")
          		.attr("x", function(d, i) { return i*20 + 2 })
          		.attr("y", 28)
          		.attr("class", "legend")
          		.text(function(d, i) { return d});
    		
	
	// ---------------------------- 
	//  BAR CHART
	// ----------------------------
	

  var x = d3.scale.linear().range([20, 200], .1);

	x.domain([7,10]);


	
	
	index_bar.selectAll("rect")
		.data(data_us_rates)
		.enter().append("rect")
		.attr("x", 10)
		.attr("y", function(d, i) { return i*15 })
		.attr("width", function(d, i) { return x(d.rate) })
		.attr("height", 15)
		.on("click", function(d, i){
		            index_bar.selectAll("rect").style("fill","steelblue");
                d3.select(this)
                    .style("fill","lightcoral");
                currentMonth = d.month;
                rmean = parseFloat(d.rate);
                refresh();
            });
		
		 svg.append("g").attr('transform', 'translate(10, 100)')
		 .selectAll("text")            
                  .data(data_us_rates)
                  .enter().append("text")
                  .attr("x", function(d, i) { return x(d.rate)+ 12 })
                  .attr("y", function(d, i) { return i*15 + 8})
                  .attr("class", "barvalue")
                  .text(function(d, i) { return d.rate + '%'});
                  
                                
                  
    index_bar.selectAll("text")
                                    		.data(data_us_rates)
                                    		.enter().append("text")
                                    		.attr("x", 12)
                                    		.attr("y", function(d, i) { return i*15  + 8})
                                    		.attr("class", "barlabel")
                                    		.text(function(d, i) { return d.label});
                                    		
    svg.append('svg:text')
                                      			.attr('class', 'bartitle')
                                      			.attr('transform', 'translate(10, 90)')
                                      			.text("US Rate % (mean) from 2009:");
		


   refresh();
   index_bar.select("rect").style("fill","lightcoral");
 
}

