// javascript variables -------------------------

var width = 1300,
    height = 800;

var currentMonth = 'September 2012';
var currentIndex = 0;

var body = d3.select("body");


var data_unemployment;
var data_us_rates;

var rateById = {};
var rmean=7.8, rmin=0,rmax=15;

var legend_data;


// D3 variables ---------------------------------

var path = d3.geo.path();

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var map = svg.append("g")
      .attr("class", "states map")
     .attr('transform', 'translate(350, 200)');

var index_bar = svg.append("g")
	      .attr("class", "indexbar")
	     .attr('transform', 'translate(20, 130)');
	     
var legend =  svg.append("g")
       	      .attr("class", "legend")
       	     .attr('transform', 'translate(350, 140)');
 
           
// load resources
queue()
	    .defer(d3.json, "us-counties.json")
	    .defer(d3.json, "us-states.json")
	    .defer(d3.csv, "US_unemployment.csv")
		  .defer(d3.csv,"US_unemployment_rate.csv")
	    .await(ready);


/**
*
*/
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

/**
*
*/
function us_rate(){
	return 'U.S. Rate (mean) = ' + rmean + '%';
}

/**
*
*/
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
	d3.select('.maplegendtitle').text(currentMonth);
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
function draw_map(states){

  map.selectAll("path")
      .data(states.features)
      .enter().append("path")
      .attr("class", function(d) { return quantize(rateById[d.id]); })
      .attr("d", path)
      .on('mouseover', function (d) {
              d3.select(this)
                .style('stroke', 'steelblue')
                .style('stroke-width', 4);
              d3.select('.currentstate').text(d.properties['name']);
              d3.select('.currentstaterate').text('Rate = ' + rateById[d.id] + ' %');
          })
      .on('mouseout', function (d) {
              d3.select(this)
                 .style('stroke', 'black')
                 .style('stroke-width', 1);
              d3.select('.currentstate').text('');
              d3.select('.currentstaterate').text('');
          });

  svg.append('svg:text')
        .attr('class', 'maptitle')
        .attr('transform', 'translate(500, 80)')
        .text("Unemployment state by state across America");

  svg.append("g").attr('transform', 'translate(0, 100)')
        .append("rect")
        .attr("x", 300)
        .attr("y", 0)
        .attr("width", 980)
        .attr("height", 675)
        .attr("class","frame");



}


/**
*
*/
function draw_maplegend(){

  svg.append('svg:text')
      .attr('class', 'maplegendtitle')
      .attr('transform', 'translate(350, 140)')
      .text(currentMonth);
  
  svg.append('svg:text')
      .attr('class', 'usrate')
      .attr('transform', 'translate(350, 160)')
      .text(us_rate());
      
  svg.append('svg:text')
      .attr('class', 'currentstate')
      .attr('transform', 'translate(350, 190)')
      .text('');
          
  svg.append('svg:text')
      .attr('class', 'currentstaterate')
      .attr('transform', 'translate(350, 210)')
      .text('');

  legend.selectAll("rect")
      .data(legend_data)
      .enter().append("rect")
      .attr('class', 'legendbar')
      .attr("x", function(d, i) { return i*15 -20 })
      .attr("y", 10)
      .attr("width", 15)
      .attr("height", 15)
      .attr('transform', 'rotate(90)')
      .style("stroke","#000")
      .style("stroke-width",".3px")
      .attr("class", function(d, i) { return quantize(d) + " legendbar"; })
      .attr("dx", -3) // padding-right
      .attr("dy", ".35em"); // vertical-align: middle
        
        
  legend.selectAll("text")
      .data(legend_data)
      .enter().append("text")
      .attr("x", -30)
      .attr("y", function(d, i) { return i*15 - 10 })
      .attr("class", "legend")
      .text(function(d, i) { return d});




}

/**
*
*/
function draw_leftgraph(){


  var parseDate = d3.time.format("%b %Y").parse;
  
  var y = d3.time.scale().range([600, 10]);
  
  var x = d3.scale.linear().range([0, 200]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("top").ticks(5);

  var xAxis2 = d3.svg.axis()
      .scale(x)
      .orient("bottom").ticks(5);

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("right").ticks(d3.time.months,1);

  var line = d3.svg.line()
      .x(function(d) { return x(parseFloat(d.rate)); })
      .y(function(d) { return y(parseDate(d.date)); });


  x.domain([6,11]);
  y.domain(d3.extent(data_us_rates, function(d) { return parseDate(d.date); }));

  index_bar.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(20,-2)")
      .call(xAxis);

  index_bar.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(20,610)")
      .call(xAxis2);


  index_bar.append("path")
      .datum(data_us_rates)
      .attr("class", "line")
      .attr('transform', 'translate(20, 0)')
      .attr("d", line);

  index_bar.selectAll("circle")
       .data(data_us_rates)
       .enter().append("circle")
       .attr("cx", function(d) { return x(parseFloat(d.rate)); })
       .attr("cy", function(d) { return y(parseDate(d.date)); })
       .attr('transform', 'translate(20, 0)')
       .attr("r", 5)
       .on("click", function(d, i){
                index_bar.selectAll("circle").style("fill","steelblue");
                index_bar.selectAll(".barlabel").style("fill","#bbb");
                index_bar.selectAll(".barvalue").style("fill","#ccc");
                d3.selectAll('.' + d.date.replace(' ','')).style("fill","lightcoral");
                d3.select(this).style("fill","lightcoral");
                currentMonth = d.month;
                rmean = parseFloat(d.rate);
                refresh();
            });

  
  index_bar.selectAll(".barlabel")
      .data(data_us_rates)
      .enter().append("text")
      .attr("x", function(d) { return x(parseFloat(d.rate)); })
      .attr("y", function(d) { return y(parseDate(d.date)); })
      .attr("class", function(d) { return "barlabel " + d.date.replace(' ',''); } )
      .text(function(d,i) { return d.month});

 
  index_bar.selectAll(".barvalue")            
      .data(data_us_rates)
      .enter().append("text")
      .attr("x", function(d, i) { return x(parseFloat(d.rate))+ 32 ;})
      .attr("y", function(d, i) { return y(parseDate(d.date));} )
      .attr("class", function(d) { return "barvalue " + d.date.replace(' ',''); } )
      .text(function(d, i) { return d.rate + '%'});


  text = ['Evolution of the ', 'U.S. unemployment rate (%)' , 'since 2009:'];
  text.forEach(function(value,index) { 
    svg.append('svg:text')
        .attr('class', 'bartitle')
        .attr('x', 20)
        .attr('y', 60 + (15 * index))
        .text(value);
  });
  

                                    
  index_bar.select("circle").style("fill","lightcoral");
  index_bar.select(".barlabel").style("fill","lightcoral");
  index_bar.select(".barvalue").style("fill","lightcoral");

  
  svg.append("g").attr('transform', 'translate(10, 100)')
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 260)
        .attr("height", 675)
        .attr("class","frame");


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
  
  draw_maplegend();
  draw_map(states);
  draw_leftgraph();
  

  refresh();
   
}

