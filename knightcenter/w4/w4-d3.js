

var width = 1150,
    height = 960;


var parseDate = d3.time.format("%B %Y").parse;

// states json paths
var states = {}

// D3 Global variables ---------------------------------

var path = d3.geo.path();

var body = d3.select("body");

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

// title
svg.append('svg:text')
    .attr('class', 'maptitle')
    .attr('transform', 'translate(400, 30)')
    .text("Unemployment state by state across America");

txt = ['Unemployment','in America','is back to','pre-recession','levels!'];
txt.forEach(function(t,i){
    svg.append('svg:text')
        .attr('class', 'info')
        .attr('x', 200)
        .attr('y', 170 + (20 * i))
        .text(t);
});

svg.append('rect')
    //.attr('class', 'maptitle')
    .attr('x', 195)
    .attr('y', 155)
    .attr('width', 1)
    .attr('height', 100);
  

/*
  =====================================
    Info Box 1 Component
    Display Selected Month/Year.
    Display U.S. rate

  =====================================
*/
infoBox1 = function(){
    
    var x=300, y=100;

    var g =  svg.append("g")
        .attr("class", "legendtitle")
        .attr('transform', 'translate(' + x + ',' + y + ')');

    //
    function draw(){

        g.append('svg:text')
            .attr('class', 'maplegendtitle')
            .attr('transform', 'translate(0, 0)')
            .text(w4.currentdate);
  
        g.append('svg:text')
            .attr('class', 'usrate')
            .attr('transform', 'translate(0, 20)')
            .text(w4.usrate());

        g.append("image")
            .attr("xlink:href", "arrow-right.png")
            .attr("x", -40)
            .attr("y", -20)
            .attr("width", 30)
            .attr("height", 30);

    }

    // 
    function update(){

      g.select('.maplegendtitle').text(w4.currentdate);
      g.select('.usrate').text(w4.usrate());

    }

    // public
    return {

        draw: draw,
        update: update

    }


}();


/*
  =====================================
    Info Box 2 Component
    Display Selected State.
    Display State rate and other informations.

  =====================================
*/
infoBox2 = function(){
    
    var posx=380, posy=140;

    var g =  svg.append("g")
        .attr("class", "currentstate")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    //
    function draw(){

          g.append('rect')
              .attr('class', 'currentstate')
              .attr('rx', 5)
              .attr('ry', 5)
              .attr('width', 180)
              .attr('height', 100)
              .attr('transform', 'translate(0, 0)');
              
          g.append('svg:text')
              .attr('class', 'currentstatename')
              .attr('transform', 'translate(80, 20)')
              .text('');
                  
          g.append('svg:text')
              .attr('class', 'currentstaterate')
              .attr('transform', 'translate(135, 60)')
              .text('');

          g.append('svg:text')
              .attr('class', 'currentstatedelta')
              .attr('transform', 'translate(50, 60)')
              .text('');

          g.append('svg:text')
              .attr('class', 'currentstatedeltainfo')
              .attr('transform', 'translate(50, 80)')
              .style("display","none")
              .text('Since Jan 2009');

          g.append("image")
              .attr("xlink:href", "arrow-right.png")
              .attr("class","currentstatearrow")
              .style("display","none")
              .attr("x", 170)
              .attr("y", 30)
              .attr("width", 30)
              .attr("height", 30);     

    }

    // 
    function update(){


    }

    // public
    return {

        draw: draw,
        update: update

    }


}();


/*
  =====================================
    Map Legend Compoent
    Display legend map.

  =====================================
*/
mapLegend = function(){
    
    var posx=350, posy=330;

    var g =  svg.append("g")
        .attr("class", "legend")
        .attr('transform', 'translate(' + posx + ',' + posy+ ')');

    //
    function draw(){

        g.selectAll("rect")
            .data(w4.ratesrange)
            .enter().append("rect")
            .attr('class', 'legendbar')
            .attr("x", function(d, i) { return i*15 -250 })
            .attr("y", -25)
            .attr("width", 15)
            .attr("height", 15)
            .attr('transform', 'rotate(-90)')
            .style("stroke","#000")
            .style("stroke-width",".3px")
            .attr("class", function(d, i) { return css_color(d) + " legendbar"; })
            .attr("dx", -3) // padding-right
            .attr("dy", ".35em"); // vertical-align: middle
        
              
        g.selectAll("text")
            .data(w4.ratesrange)
            .enter().append("text")
            .attr("x", -30)
            .attr("y", function(d, i) { return 245 - i*15})
            .attr("class", "legend")
            .text(function(d, i) { return d});

        g.append('svg:text')
            .attr('class', 'legend')
            .attr('x', 0)
            .attr('y', -30)
            //.attr('transform', 'rotate(90)')      
            .style("font-size", "0.9em")
            .text('Rate (%)');

    }

    // 
    function update(){

        g.selectAll("rect")
            .data(w4.ratesrange)
            .attr("class", function(d, i) { return css_color(d); });
                  
        g.selectAll("text")
            .data(w4.ratesrange)
            .text(function(d, i) { return d});    

    }

    // public
    return {

        draw: draw,
        update: update

    }


}();


/*
  =====================================
    Difference Chart Component
    Display ..

  =====================================
*/
diffChart = function(){
    
    var posx=620, posy=120;

    var g =  svg.append("g")
        .attr("class", "diffchart")
        .attr('transform', 'translate(' + posx + ',' + posy+ ')');

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



    // 
    function draw(){

          xdc.domain(d3.extent(w4.usrates, function(d) { return d.date; }));
          g.datum(w4.usrates);

          this.update();

          g.append("g")
              .attr("class", "x axis dc")
              .attr("transform", "translate(0,140)")
              .call(xdcAxis);

          g.append('svg:text')
              .attr('class', 'legenddc')
              .attr('transform', 'translate(420, -30)')
              .text('US Rate');

          g.append('rect')
              .style("fill","steelblue")
              .attr("width", 15)
              .attr("height", 2)
              .attr('transform', 'translate(400, -35)');

          g.append('svg:text')
              .attr('class', 'maptitle2')
              .attr('transform', 'translate(0, -20)')
              .text('US unemployment');

          g.append('svg:text')
              .attr('class', 'monthstitle')
              .attr('transform', 'translate(90, 135)')
              .text('Months since Obama became president');
          

    }

    //
    function update(){

          if(w4.currentstate.name == '')
              w4.currentstate.name = 'US Rate';

            ydc.domain([
                d3.min(w4.usrates, function(d) { return  Math.min(d[w4.currentstate.name], d["US Rate"]); }),
                d3.max(w4.usrates, function(d) { return Math.max(d[w4.currentstate.name], d["US Rate"]); })
              ]);

            g.selectAll("clipPath").remove();
            g.selectAll(".area.above").remove();
            g.selectAll(".area.below").remove();
            g.selectAll(".dcpointer").remove();
            g.select(".y.axis.dc").remove();
            g.selectAll(".line").remove();
            g.selectAll(".line2").remove();
            g.selectAll(".legenddc.state").remove();

          var dd = parseDate(w4.currentdate);
           g.append("rect")
                      .attr("x",  xdc(dd) - 3)
                      .attr("y", -10)
                      .attr("width", 6)
                      .attr("height", 140)
                      .attr("class","dcpointer")
                      .attr('transform', 'translate(0, 10)')
                      .style("fill","lightgray");

  
            if(w4.currentstate.name != 'US Rate'){

                      g.append("clipPath")
                          .attr("id", "clip-below")
                          .append("path")
                          .attr("d", areadc.y0(130));

                      g.append("clipPath")
                          .attr("id", "clip-above")
                          .append("path")
                          .attr("d", areadc.y0(0));

                      g.append("path")
                          .attr("class", "area above")
                          .attr("clip-path", "url(#clip-above)")
                          .attr("d", areadc.y0(function(d) { return ydc(d[w4.currentstate.name]); }));

                      g.append("path")
                          .attr("class", "area below")
                          .attr("clip-path", "url(#clip-below)")
                          .attr("d", areadc);

                      var linedc2 = d3.svg.area()
                          .interpolate("basis")
                          .x(function(d) { return xdc(d.date); })
                          .y(function(d) { return ydc(d[w4.currentstate.name]); });

                      g.append("path")
                          .attr("class", "line2")
                          .attr("d", linedc2);

                      g.append('svg:text')
                          .attr('class', 'legenddc state')
                          .attr('transform', 'translate(420, -10)')
                          .text(w4.currentstate.name);

                      g.append('rect')
                          .attr('class', 'legenddc state')
                          .attr("width", 15)
                          .attr("height", 2)
                          .style("fill","gray")
                          .attr('transform', 'translate(400, -15)');
                      
                      if(w4.rateById[w4.currentstate.id] != undefined){

                          g.append("circle")
                               .attr("cx", xdc(dd))
                               .attr("cy", ydc(w4.rateById[w4.currentstate.id]) )
                               .attr("class","legenddc state")
                               .attr("r", 6)
                               .style("fill", "gray");

                      }
         
              }

              if(w4.currentstate.name != 'US Rate'){
                  g.select(".maptitle2").text('US vs ' + w4.currentstate.name);
              }else{
                  g.select(".maptitle2").text('US unemployment');
              }

              g.append("path")
                      .attr("class", "line")
                      .attr("data-legend",'US Rate')
                      .attr("d", linedc);

              g.append("circle")
                     .attr("cx", xdc(dd) )
                     .attr("cy", ydc(w4.rate_mean))
                     .attr("class","dcpointer")
                     .attr("r", 6)
                     .style("fill", "steelblue");

              g.append("g")
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

    // public
    return {

        draw: draw,
        update: update

    }


}();


/*
  =====================================
    Left Bar Chart Component
    Display Evolution of U.S. Rate
    since 2009.
  =====================================
*/
leftBarChart = function(){
    
    var posx=0, posy=100;
    
    var g = svg.append("g")
        .attr("class", "indexbar")
        .attr('transform', 'translate(' + posx + ',' + posy+ ')');

    // 
    function draw(){

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
          y.domain(d3.extent(w4.usrates_rawdata, function(d) { return parseDate(d.date); }));

          g.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(20,-2)")
              .call(xAxis);

          g.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(20,610)")
              .call(xAxis2);

          g.append("path")
              .datum(w4.usrates_rawdata)
              .attr("class", "line")
              .attr('transform', 'translate(20, 0)')
              .attr("d", line);

          g.selectAll("circle")
               .data(w4.usrates_rawdata)
               .enter().append("circle")
               .attr("cx", function(d) { return x(parseFloat(d.rate)); })
               .attr("cy", function(d) { return y(parseDate(d.date)); })
               .attr('transform', 'translate(20, 0)')
               .attr("r", 5)
               .attr("class", function(d) { return d.date.replace(' ',''); } )
               .on("click", function(d, i){
                       select(d);
                    });
          
          g.selectAll(".barlabel")
              .data(w4.usrates_rawdata)
              .enter().append("text")
              //.attr("x", function(d) { return x(parseFloat(d.rate)); })
              .attr("x", 22)
              .attr("y", function(d) { return y(parseDate(d.date)); })
              .attr("class", function(d) { return "barlabel " + d.date.replace(' ',''); } )
              .text(function(d,i) { return d.date});

          g.selectAll("rect")
              .data(w4.usrates_rawdata)
              .enter().append("rect")
              .attr("x", 20)
              .attr("y", function(d) { return y(parseDate(d.date)) - 5; })
              .attr("class", "bar")
              .attr("width", function(d) { return x(parseFloat(d.rate)); })
              .attr("height", 12)
              .on("click", function(d, i){
                      select(d);
              });
              
          g.selectAll(".barvalue")            
              .data(w4.usrates_rawdata)
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
  
                           
          g.select("circle").style("fill","lightcoral");
          g.select(".barlabel").style("fill","lightcoral");
          g.select(".barvalue").style("fill","lightcoral");
    }

    // select a new couple month/year
    function select(d){

          g.selectAll("circle").style("fill","steelblue");
          g.selectAll("text.barlabel").style("fill","#aaa").style("font-weight","100");
          g.selectAll("text.barvalue").style("fill","#aaa").style("font-weight","100");
          d3.selectAll('.' + d.date.replace(' ',''))
              .style("fill","lightcoral")
              .style("font-weight","bold");
          w4.selectDate(d.month);
          refresh();

    }
    

    // 
    function update(){
    }


    // public
    return {

        draw: draw,
        update: update

    }


}();


/*
  =====================================
    US Map Component
    Display Map of United States
  =====================================
*/
mapChart = function(){
    
    var posx=270, posy=300;

    var bubble_rmax = 20; // max radius of bubbles

    var g = svg.append("g")
        .attr("class", "states map")
        .attr('transform', 'translate(' + posx + ',' + posy+ ')');

    // 
    function draw(){

        g.selectAll("path")
            .data(states.features)
            .enter().append("path")
            .attr("class", function(d) { return css_color(w4.rateById[d.id]); })
            .attr("d", path)
            .on('mouseover', function (d) {
                    var rate = w4.rateById[d.id];
                    var rate2009 = w4.rate2009ById[d.id];
                    onstate(this, 'steelblue', 4, d.properties['name'], d.id, rate + '%', d3.format('+,.1f')( rate - rate2009 ) + '%') ;
                    s = d3.select("rect.currentstate").style("display");
                    if (s == 'none'){
                      d3.select("rect.currentstate").style("display","block");
                      d3.select("image.currentstatearrow").style("display","block");  
                      d3.select(".currentstatedeltainfo").style("display","block"); 
                    }
                     if(d.id != 0){
                         var rate2009 = w4.rate2009ById[d.id];
                         d3.select('.currentstatedelta')
                            .text();
                      }
                })
            .on('mouseout', function (d) {
                    onstate(this, 'black', 1, '', d.id, '',  '', '');
                    
                    if(w4.currentstate.name == 'US Rate'){
                      d3.select("rect.currentstate").style("display","none");
                      d3.select("image.currentstatearrow").style("display","none");
                      d3.select(".currentstatedeltainfo").style("display","none"); 
                    }

                });

          states.features.forEach(function(d, i) {

                var radius = 0;
                if(d.id != 51 && d.id in w4.unemployed2012ByState){
                    
                    radius =  bubble_radius(w4.unemployed2012ByState[d.id]); 
                    var centroid = path.centroid(d);
                    var angle = Math.random()*360;
                    centroid.x = centroid[0];
                    centroid.y = centroid[1];
                    centroid.feature = d;
                    g.append("circle")
                      .attr("cx", centroid.x)
                      .attr("cy", centroid.y)
                      .attr("class","population")
                      .attr("r", radius);
                    g.append("line")
                      .attr("x1", centroid.x)
                      .attr("y1", centroid.y)
                      .attr("x2", centroid.x + Math.cos(angle) * radius)
                      .attr("y2", centroid.y + Math.sin(angle) * radius)
                      .attr("class","population");

                }

          });

          svg.append('svg:text')
                  .attr('class', 'maptitle2')
                  .attr('transform', 'translate(820, 330)')
                  .text("Where are the jobs?");

            // legend map for population
           population_scale = [40000, 400000, 1000000];
           population_scale.forEach(function (n, i){

                r = bubble_radius(n);
                svg.append("circle")
                  .attr("cx", 0)
                  .attr("cy", -r)
                  .attr("class","population legend")
                  .attr('transform', 'translate(850, 860)')
                  .attr("r", r); 

                svg.append("text")
                  .attr("x", 0)
                  .attr("y", -2*r)
                  .attr("class","population legendtext")
                  .attr('transform', 'translate(850, 860)')
                  .text(d3.format(",")(n) ); 

            });

          svg.append("text")
                  .attr("x", 0)
                  .attr("y", 10)
                  .attr("class","population legendtext2")
                  .attr('transform', 'translate(850, 860)')
                  .text("September 2012, \n number of unemployed"); 


  
    }

    //
    function bubble_radius(n){
        return Math.sqrt(n / w4.max_unemployed2012) * bubble_rmax; 
    }

    //
    function onstate(element, strokecolor, strokewidth, state, stateId,  rate, delta){

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
            
            w4.selectState(stateId, state);
            diffChart.update();  

    }

    // 
    function update(){
        
        g.selectAll("path")
            .attr("class", function(d) { return css_color(w4.rateById[d.id]); })

    }

    // public
    return {

        draw: draw,
        update: update

    }


}();



//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
	     

/*
  Load resources.
*/
queue()
	    //.defer(d3.json, "data/us-counties.json")
	    .defer(d3.json, "data/us-states.json")
	    .defer(d3.csv, "data/US_unemployment.csv")
		  .defer(d3.csv, "data/US_unemployment_rate.csv")
	    .await(ready);

/*
  All graphic components.
*/
var components = [mapLegend, infoBox1, infoBox2, diffChart, leftBarChart, mapChart];


/*
  Ready:
*/
function ready(error, statesjson, unemployment, rates) {

    // init data
    w4.init([unemployment, rates]);

    //
    states = statesjson

    // draw D3 components
    components.forEach(function(c){
          c.draw();
    });

    refresh();
     
}

/*
  Refresh:
*/
function refresh(){

      //w4.log();

      // update D3 components
      components.forEach(function(c){
          c.update();
      });
    
}

/*
  Returns the CSS class (with fill color information)
  name corresponding to the given rate (in %).
*/
function css_color(rate){

        var css;
        if(rate <= w4.rate_mean){
          l = 'q';
          quantz = d3.scale.quantize()
              .domain([w4.rate_min, w4.rate_mean])
              .range(d3.range(9));
          css = 'q' + quantz(rate) + "-9";
        }else{
           quantz = d3.scale.quantize()
               .domain([w4.rate_mean, w4.rate_max])
               .range(d3.range(9));
           css = 'p' + quantz(rate) + "-9";
        }
        //console.log("r=" + rate +" rmean=" + rmean + " :" + clazz);
        return css;
    
}
