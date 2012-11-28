// javascript variables -------------------------

var width = 1300,
    height = 1000;

var currentMonth = 'September 2012';
var currentIndex = 0;
var currentstate;

var body = d3.select("body");


var data_unemployment;
var data_us_rates;
var usrates = new Array(); // TODO

var rateById = {};
var rate2009ById = {};
var rmean=7.8, rmin=0,rmax=15;

var legend_data;

var parseDate = d3.time.format("%B %Y").parse;

var maxunemployment;

var populationByState = {}


// D3 variables ---------------------------------

var path = d3.geo.path();

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var map = svg.append("g")
    .attr("class", "states map")
    .attr('transform', 'translate(260, 280)');

var index_bar = svg.append("g")
    .attr("class", "indexbar")
    .attr('transform', 'translate(0, 100)');
	     
var legend =  svg.append("g")
    .attr("class", "legend")
    .attr('transform', 'translate(350, 100)');

var currentstate_box =  svg.append("g")
    .attr("class", "currentstate")
    .attr('transform', 'translate(370, 150)');

var difference_chart =  svg.append("g")
    .attr("class", "diffchart")
    .attr('transform', 'translate(620, 120)');

var xdc = d3.time.scale()
        .range([0, 500]);

var ydc = d3.scale.linear()
        .range([130, 0]);

var xdcAxis = d3.svg.axis()
        .scale(xdc)
        .orient("bottom");

var ydcAxis = d3.svg.axis()
    .scale(ydc)
    .orient("left");

var areadc = d3.svg.area()
        .interpolate("basis")
        .x(function(d) { return xdc(d.date); })
        .y1(function(d) { return ydc(d["US Rate"]); });


var linedc = d3.svg.area()
    .interpolate("basis")
    .x(function(d) { return xdc(d.date); })
    .y(function(d) { return ydc(d["US Rate"]); });



       
// load resources
queue()
	    .defer(d3.json, "data/us-counties.json")
	    .defer(d3.json, "data/us-states.json")
	    .defer(d3.csv, "data/US_unemployment.csv")
		  .defer(d3.csv, "data/US_unemployment_rate.csv")
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


    	legend.selectAll("rect")
    	      .data(legend_data)
        		.attr("class", function(d, i) { return quantize(d); });
        		
    	legend.selectAll("text")
         		.data(legend_data)
         		.text(function(d, i) { return d});    

      update_differenceChart();  

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
              var rate = rateById[d.id];
              var rate2009 = rate2009ById[d.id];
              onstate(this, 'steelblue', 4, d.properties['name'], rate + '%', d3.format('+,.1f')( rate - rate2009 ) + '%') ;
              s = d3.select("rect.currentstate").style("display");
              if (s == 'none'){
                d3.select("rect.currentstate").style("display","block");
                d3.select("image.currentstatearrow").style("display","block");  
                d3.select(".currentstatedeltainfo").style("display","block"); 
              }
               if(d.id != 0){
                   var rate2009 = rate2009ById[d.id];
                   d3.select('.currentstatedelta')
                      .text();
                }
          })
      .on('mouseout', function (d) {
              onstate(this, 'black', 1, '',  '', '');
              if(currentstate == 'US Rate'){
                d3.select("rect.currentstate").style("display","none");
                d3.select("image.currentstatearrow").style("display","none");
                d3.select(".currentstatedeltainfo").style("display","none"); 
              }

          });

  svg.append('svg:text')
        .attr('class', 'maptitle')
        .attr('transform', 'translate(400, 30)')
        .text("Unemployment state by state across America");




  states.features.forEach(function(d, i) {

        var r = r_populationByStateId(d.id);
        var centroid = path.centroid(d);
        var angle = Math.random()*360;
        centroid.x = centroid[0];
        centroid.y = centroid[1];
        centroid.feature = d;
        map.append("circle")
          .attr("cx", centroid.x)
          .attr("cy", centroid.y)
          .attr("class","population")
          .attr("r", r);
        map.append("line")
          .attr("x1", centroid.x)
          .attr("y1", centroid.y)
          .attr("x2", centroid.x + Math.cos(angle) * r)
          .attr("y2", centroid.y + Math.sin(angle) * r)
          .attr("class","population");

  });

    // legend map for population
   population_scale = [40000, 400000, 1000000];
   population_scale.forEach(function (d, i){
        var r = r_populationByNumber(d);
        svg.append("circle")
          .attr("cx", 0)
          .attr("cy", -r)
          .attr("class","population legend")
          .attr('transform', 'translate(850, 840)')
          .attr("r", r); 
        svg.append("text")
          .attr("x", 0)
          .attr("y", -2*r)
          .attr("class","population legendtext")
          .attr('transform', 'translate(850, 840)')
          .text(d3.format(",")(d) ); 

  });

  svg.append("text")
          .attr("x", 0)
          .attr("y", 10)
          .attr("class","population legendtext2")
          .attr('transform', 'translate(850, 840)')
          .text("September 2012, \n number of unemployed"); 


  
  


}

function r_populationByStateId(stateId){

  if(stateId in populationByState){
      return r_populationByNumber(populationByState[stateId]); 
  }
  return 0;

}

function r_populationByNumber(n){

    var rm = 20; // max radius
    return Math.sqrt(n / maxunemployment) * rm; 

}


/**
*
*/
function onstate(element, strokecolor, strokewidth, state, rate, delta){

        d3.select(element)
                .style('stroke', strokecolor)
                .style('stroke-width', strokewidth);
        d3.select('.currentstatename')
                .text(state);
        d3.select('.currentstatedelta')
                .text(delta);
        var col = d3.select(element).style("fill");
        d3.select('.currentstaterate')
                .text(rate)
                .style("fill", col);
                
        currentstate = state;
        update_differenceChart(); 

       

        

        
}



/**
*
*/
function draw_maplegend(){

  svg.append('svg:text')
      .attr('class', 'maplegendtitle')
      .attr('transform', 'translate(350, 100)')
      .text(currentMonth);
  
  svg.append('svg:text')
      .attr('class', 'usrate')
      .attr('transform', 'translate(350, 120)')
      .text(us_rate());


  legend.selectAll("rect")
      .data(legend_data)
      .enter().append("rect")
      .attr('class', 'legendbar')
      .attr("x", function(d, i) { return i*15 -250 })
      .attr("y", -25)
      .attr("width", 15)
      .attr("height", 15)
      .attr('transform', 'rotate(-90)')
      .style("stroke","#000")
      .style("stroke-width",".3px")
      .attr("class", function(d, i) { return quantize(d) + " legendbar"; })
      .attr("dx", -3) // padding-right
      .attr("dy", ".35em"); // vertical-align: middle
  
        
  legend.selectAll("text")
      .data(legend_data)
      .enter().append("text")
      .attr("x", -30)
      .attr("y", function(d, i) { return 245 - i*15})
      .attr("class", "legend")
      .text(function(d, i) { return d})


}

/**
*
*/
function draw_currentstate_box(){


  currentstate_box.append('rect')
      .attr('class', 'currentstate')
      .attr('rx', 5)
      .attr('ry', 5)
      .attr('width', 180)
      .attr('height', 100)
      .attr('transform', 'translate(0, 0)');

      
  currentstate_box.append('svg:text')
      .attr('class', 'currentstatename')
      .attr('transform', 'translate(80, 20)')
      .text('');
          
  currentstate_box.append('svg:text')
      .attr('class', 'currentstaterate')
      .attr('transform', 'translate(135, 60)')
      .text('');

  currentstate_box.append('svg:text')
      .attr('class', 'currentstatedelta')
      .attr('transform', 'translate(50, 60)')
      .text('');

  currentstate_box.append('svg:text')
      .attr('class', 'currentstatedeltainfo')
      .attr('transform', 'translate(50, 80)')
      .style("display","none")
      .text('Since Jan 2009');

  currentstate_box.append("image")
      .attr("xlink:href", "arrow-up.png")
      .attr("class","currentstatearrow")
      .style("display","none")
      .attr("x", 30)
      .attr("y", -210)
      .attr("transform","rotate(90)")
      .attr("width", 40)
      .attr("height", 40);
     
      


      

}

/**
*
*/
function draw_differenceChart(){

    xdc.domain(d3.extent(usrates, function(d) { return d.date; }));
    difference_chart.datum(usrates);

    update_differenceChart();

    difference_chart.append("g")
        .attr("class", "x axis dc")
        .attr("transform", "translate(0,140)")
        .call(xdcAxis);

    difference_chart.append('svg:text')
        .attr('class', 'legenddc')
        .attr('transform', 'translate(360, 5)')
        .text('US Rate');

    difference_chart.append('circle')
        .attr('class', 'legenddc')
        .attr("r", 6)
        .style("fill","steelblue")
        .attr('transform', 'translate(350, 0)');
     

}


/**
*
*/
function update_differenceChart(){


if(currentstate == '')
    currentstate = 'US Rate';

  ydc.domain([
      d3.min(usrates, function(d) { return  Math.min(d[currentstate], d["US Rate"]); }),
      d3.max(usrates, function(d) { return Math.max(d[currentstate], d["US Rate"]); })
    ]);

  difference_chart.selectAll("clipPath").remove();
  difference_chart.selectAll(".area.above").remove();
  difference_chart.selectAll(".area.below").remove();
  difference_chart.selectAll(".dcpointer").remove();
  difference_chart.select(".y.axis.dc").remove();
  //difference_chart.select(".x.axis.dc").remove();
  difference_chart.selectAll(".line").remove();
  difference_chart.selectAll(".line2").remove();
  difference_chart.selectAll(".legenddc.state").remove();
  //difference_chart.selectAll('*').remove();

  
if(currentstate != 'US Rate'){

          difference_chart.append("clipPath")
              .attr("id", "clip-below")
              .append("path")
              .attr("d", areadc.y0(130));

          difference_chart.append("clipPath")
              .attr("id", "clip-above")
              .append("path")
              .attr("d", areadc.y0(0));

          difference_chart.append("path")
              .attr("class", "area above")
              .attr("clip-path", "url(#clip-above)")
              .attr("d", areadc.y0(function(d) { return ydc(d[currentstate]); }));

          difference_chart.append("path")
              .attr("class", "area below")
              .attr("clip-path", "url(#clip-below)")
              .attr("d", areadc);

          var linedc2 = d3.svg.area()
              .interpolate("basis")
              .x(function(d) { return xdc(d.date); })
              .y(function(d) { return ydc(d[currentstate]); });

          difference_chart.append("path")
              .attr("class", "line2")
              .attr("d", linedc2);

          difference_chart.append('svg:text')
              .attr('class', 'legenddc state')
              .attr('transform', 'translate(430, 5)')
              .text(currentstate);

          difference_chart.append('circle')
              .attr('class', 'legenddc state')
              .attr("r", 4)
              .style("fill","gray")
              .attr('transform', 'translate(420, 0)');

  }

var dd = parseDate(currentMonth);
difference_chart.append("rect")
        .attr("x",  xdc(dd) - 6)
        .attr("y", 0)
        .attr("width", 6)
        .attr("height", 130)
        .attr("class","dcpointer")
        .attr('transform', 'translate(0, 10)')
        .style("fill","lightgray");




difference_chart.append("path")
        .attr("class", "line")
        .attr("data-legend",'US Rate')
        .attr("d", linedc);



 difference_chart.append("g")
        .attr("class", "y axis dc")
        .attr("transform", "translate(-10,0)")
        .call(ydcAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text(" Rate (%)");

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
       .attr("class", function(d) { return d.date.replace(' ',''); } )
       .on("click", function(d, i){
               indexbar_select(d);
            });

  
  index_bar.selectAll(".barlabel")
      .data(data_us_rates)
      .enter().append("text")
      //.attr("x", function(d) { return x(parseFloat(d.rate)); })
      .attr("x", 22)
      .attr("y", function(d) { return y(parseDate(d.date)); })
      .attr("class", function(d) { return "barlabel " + d.date.replace(' ',''); } )
      .text(function(d,i) { return d.date});

  index_bar.selectAll("rect")
      .data(data_us_rates)
      .enter().append("rect")
      .attr("x", 20)
      .attr("y", function(d) { return y(parseDate(d.date)) - 5; })
      .attr("class", "bar")
      .attr("width", function(d) { return x(parseFloat(d.rate)); })
      .attr("height", 12)
      .on("click", function(d, i){
              indexbar_select(d);
      });
      

 
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
        .attr('y', 30 + (15 * index))
        .text(value);
  });
  
                             
  index_bar.select("circle").style("fill","lightcoral");
  index_bar.select(".barlabel").style("fill","lightcoral");
  index_bar.select(".barvalue").style("fill","lightcoral");



}

/**
*
*/
function indexbar_select(d){

    index_bar.selectAll("circle").style("fill","steelblue");
    index_bar.selectAll("text.barlabel").style("fill","#aaa").style("font-weight","100");
    index_bar.selectAll("text.barvalue").style("fill","#aaa").style("font-weight","100");
    d3.selectAll('.' + d.date.replace(' ',''))
        .style("fill","lightcoral")
        .style("font-weight","bold");
    currentMonth = d.month;
    rmean = parseFloat(d.rate);
    refresh();

}

/**
*
*/
function ready(error, counties, states, unemployment, rates) {

    data_unemployment  = unemployment;
    data_us_rates = rates;

    data_unemployment.forEach(function(d) { rate2009ById[d.id] = +d['January 2009'];});
    

    data_us_rates.forEach(function(d){

      var obj = {};
      obj['date'] = parseDate(d.month);
      obj['US Rate'] = parseFloat(d.rate);
      data_unemployment.forEach(function(u,i){
        obj[u.state] = u[d.month];
      });
      usrates.push(obj);

    });

    maxunemployment = 0;
    data_unemployment.forEach(function(d) { 

      populationByState[d.id] = d['sep2012N']
      if(d['sep2012N'] > maxunemployment){
          maxunemployment = d['sep2012N'];
      }

    });
  



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
    draw_currentstate_box();

    
    currentstate = 'US Rate';
    draw_differenceChart();
    refresh();
    

     
}

