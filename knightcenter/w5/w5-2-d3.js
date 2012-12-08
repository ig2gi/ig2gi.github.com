

var width = 900,
    height = 400;

function log(message) {console.log(message);};

function fmt_F(f){return d3.format('+,.1f')(f);};

// lookup table: country code -> country 
var countryByCode = {}

// lookup table: country code -> climate data 
var dataByCode = {}

// lookup table: country code -> economy data 
var economyByCode = {}

// selected country
var currentCode;

//
var currentPercentile = 0;

// 
var incomes = ['Low', 'Lower Middle', 'Upper Middle', 'High'];

//
function getProjection(prefix){
     return parseFloat(dataByCode[currentCode][prefix+currentPercentile]);
}

//
function getCurrentIncomeIndex(){
    var incGroup = countryByCode[currentCode].incomegroup;
    var index = -1;
    incomes.forEach(function(d,i){
        if (incGroup.toLowerCase().indexOf(d.toLowerCase()) == 0)
            index =  i;
    });
    return index;
}

//
var years = function getYears(){
    var years = [];
    for (var i = 1990; i <= 2010; i++) {
        years[i-1990] = d3.time.format("%Y").parse(i + '');
    };
    return years;
}();


// D3 Global variables ---------------------------------

var path = d3.geo.path();

var body = d3.select("body");

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);


/*
  =====================================
    Select Country Component
  

  =====================================
*/
selectCountry = function(){
    
    var x=850, y=20;

    var g =  svg.append("g")
        .attr("class", "select")
        .attr('transform', 'translate(' + x + ',' + y + ')');

    //
    function draw(countries, temparatures){
        
        d3.select("#countries")
            .on("change",change)
            .selectAll("option")
            .data(countries)
            .enter().append("option")
            .attr("value", function(d) { return d.code;})
            .text(function(d) { return d.name;});
         
        g.append("svg:text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class","title")
            .text('');

        g.append("svg:text")
            .attr("x", 0)
            .attr("y", 20)
            .attr("class","subtitle")
            .attr("id", "region")
            .text('');


        g.append("svg:text")
            .attr('class', 'ptemptitle')
            .attr("x", 0)
            .attr("y", 60)
            .attr("id", "cdaytitle")
            .style("fill","darkblue")
            .text(''); 



        g.append("svg:text")
            .attr('class', 'ptemptitle')
            .attr("x", 0)
            .attr("y", 80)
            .attr("id", "hdaytitle")
            .style("fill","red")
            .text(''); 

        g.append("image")
            .attr("xlink:href", "resources/T.jpeg")
            .attr("x", 10)
            .attr("y", 85)
            .attr("width", 20)
            .attr("height", 20);

        g.append("svg:text")
            .attr('class', 'ptemptitle')
            .attr("x", 0)
            .attr("y", 100)
            .attr("id", "ptemptitle")
            .text(''); 

        g.append("image")
            .attr("xlink:href", "resources/P.jpeg")
            .attr("x", 10)
            .attr("y", 105)
            .attr("width", 20)
            .attr("height", 20);

        g.append("svg:text")
            .attr('class', 'ptemptitle')
            .attr("x", 0)
            .attr("y", 120)
            .attr("id", "pppttitle")
            .text(''); 

        

    }

    //
    function change(){
        
        currentCode = this.value;
        refresh();

    }

    // 
    function update(){
       
        g.select(".title").text(countryByCode[currentCode].name);
        g.select("#region").text(countryByCode[currentCode].region);
        //g.select("#incg").text(countryByCode[currentCode].incomegroup);
        g.select("#ptemptitle").text(fmt_F(getProjection('t')) + ' (°C)');
        g.select("#pppttitle").text(fmt_F(getProjection('p')) + ' (mm)');
        g.select("#hdaytitle").text(fmt_F(getProjection('h')) + ' warm days');
        g.select("#cdaytitle").text(fmt_F(getProjection('c')) + ' cold days');
     
    }

    // public
    return {

        draw: draw,
        update: update,
        change: change

    }


}();

/*
  =====================================
    Select Percentile Component
  

  =====================================
*/
selectPercentile = function(){
    
    var x=0, y=40;

    var g =  svg.append("g")
        .attr("class", "select")
        .attr('transform', 'translate(' + x + ',' + y + ')');

    //
    function draw(countries, temparatures){
        
        d3.select("#percentiles")
            .on("change",change)
            .selectAll("option")
            .data({'10th':'10th percentile', '90th':'90th percentile'})
            .enter().append("option")
            .attr("value", function(d) { return d[0];})
            .text(function(d) { return d[1];});

    }

    //
    function change(){
        
        currentPercentile = this.value;
        refresh();

    }

    // 
    function update(){
        
     
    }

    // public
    return {

        draw: draw,
        update: update,
     

    }


}();


/*
  =====================================
    Income Group Component
  

  =====================================
*/
incomeBar = function(){
    
    var x=840, y=200;

    var g =  svg.append("g")
        .attr("class", "incomebar")
        .attr('transform', 'translate(' + x + ',' + y + ')');

    //
    function draw(countries, temparatures){

         g.append("line")
            .attr('class', 'income')
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", -120)
            .attr("y2", 0)
            .attr("transform", "rotate(-90)");

        g.append("svg:text")
            .attr("x", 10)
            .attr("y", -25)
            //.attr('class', 'income')
            .text('Income Group')
            .attr("transform", "rotate(90)"); 
        
        for (var i = 0; i <= 3; i++) {
            g.append("circle")
                .attr('class', 'income'+(3-i) + ' income')
                .attr("cx", 0)
                .attr("cy", i * 40)
                .attr("r", 10);

            g.append("svg:text")
                .attr('class', 'income'+(3-i) + ' income')
                .attr("x", -15)
                .attr("y", i * 40 + 3)
                .text(incomes[3-i]); 

        };
            
    }

     // 
    function update(){
       
        var cssIncome = ".income" + getCurrentIncomeIndex();
        g.selectAll(".income").style("fill","lightgray","font-weight","plain");
        g.selectAll(cssIncome).transition().style("fill","gray","font-weight","bold");
     
    }

    // public
    return {

        draw: draw,
        update: update

    }

}();

/*
  =====================================
    Graph Component
  

  =====================================
*/
graphClimate = function(){
    
    var posx=70, posy=100;

    var g =  svg.append("g")
        .attr("class", "select")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    var data = {};

    var x = d3.scale.ordinal()
            .rangeBands([0, 100], 0.1);

    var x2 = d3.scale.ordinal()
            .rangeBands([105, 205], 0.1);

    var y = d3.scale.linear()
        .range([200, 30]);

    var y2 = d3.scale.linear()
        .range([200, 30]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var xAxis2 = d3.svg.axis()
        .scale(x2)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

     var yAxis2 = d3.svg.axis()
        .scale(y2)
        .orient("right");

    x.domain(['2000','2045']);
    x2.domain(['2000','2045']);

    //
    function draw(countries, temparatures){

        g.append("g")
              .append("text")
              .attr("class", "graphtitle")
              .attr("y", -40)
              .attr("x", 110)
              .attr("dy", ".71em")
              .style("text-anchor", "middle")
              .text("Temperature (min/max) and precipitation projections.");


        g.append("g")
              .attr("class", "x axis")
              .attr("transform", "translate(0,200)")
              .call(xAxis)
              .append("text")
              //.attr("transform", "rotate(-90)")
              .attr("y", 25)
              .attr("x", 50)
              .attr("dy", ".71em")
              .style("text-anchor", "middle")
              .text("Tmin/max");

        g.append("g")
              .attr("class", "x2 axis")
              .attr("transform", "translate(0,200)")
              .call(xAxis2)
              .append("text")
              //.attr("transform", "rotate(-90)")
              .attr("y", 25)
              .attr("x", 150)
              .attr("dy", ".71em")
              .style("text-anchor", "middle")
              .text("Precipitation");;


        g.append("g")
              .append("rect")
              .attr("class", "graph")
              .attr("y", -20)
              .attr("x", -50)
              .attr("width", 320)
              .attr("height", 260);
              

        g.append("g")
              .attr("class", "y axis")
              .attr("transform", "translate(-10, 0)")
              .call(yAxis)
              .append("text")
              //.attr("transform", "rotate(-90)")
              .attr("y", 0)
              .attr("x", 0)
              .attr("dy", ".71em")
              .style("text-anchor", "middle")
              .text("T (°C)");

        g.append("g")
              .attr("class", "y2 axis")
              .attr("transform", "translate(215, 0)")
              .call(yAxis2)
              .append("text")
              //.attr("transform", "rotate(-90)")
              .attr("y", 0)
              .attr("x", 10)
              .attr("dy", ".71em")
              .style("text-anchor", "middle")
              .text("P (mm)");

    

    }

    function temperatures(){

        var temp = dataByCode[currentCode];
        var  o1 = {};
        var o2 = {};
        o1.period = '1960-2000';
        o1.tmin = parseFloat(temp.tmin);
        o1.tmax = parseFloat(temp.tmax);
        o1.ppt = parseFloat(temp.ppt);
        o2.period = '2045-2060';
        o2.tmin = o1.tmin + getProjection('t');
        o2.tmax = o1.tmax + getProjection('t');
        o2.ppt = o1.ppt + getProjection('p');
        return [o1,o2];

    }


    // 
    function update(){

        data = temperatures();
        min = d3.min(data, function(d) { return d.tmin; }) - 2;
        max = d3.max(data, function(d) { return d.tmax; }) + 2;

        y.domain([min, max]);
        y2.domain([0, 3000]);

        g.selectAll(".tmin").remove();
        g.selectAll(".tmax").remove();
        g.selectAll(".pmax").remove();
        g.selectAll(".pmin").remove();
        g.selectAll(".ppt").remove();
        
        g.select(".y.axis").call(yAxis);
        g.select(".y2.axis").call(yAxis2);

        g.selectAll("circle.tmin")
            .data(data)
            .enter().append("circle")
            .attr('class', 'tmin')
            .attr("cx", function(d) { return x(d.period) + 25})
            .attr("cy", function(d) { return y(d.tmin)})
            .attr("r", 6);

        g.selectAll("circle.tmax")
            .data(data)
            .enter().append("circle")
            .attr('class', 'tmax')
            .attr("cx", function(d) { return x(d.period) + 25})
            .attr("cy", function(d) { return y(d.tmax)})
            .attr("r", 6);

        g.selectAll("rect.ppt")
            .data(data)
            .enter().append("rect")
            .attr('class', 'ppt')
            .attr("x", function(d) { return x2(d.period) + 7})
            .attr("y", function(d) { return y2(d.ppt)})
            .attr("width", 30)
            .attr("height", function(d) { return 200 - y2(d.ppt)});


        
        draw_delta('pmax', 'tmax', data);
        draw_delta('pmin', 'tmin', data);

        data.forEach(function(d,i){

            g.append("svg:text")
                .attr('class', 'tmin')
                .attr("x", x(d.period) + 30)
                .attr("y", y(d.tmin) - 6)
                .text(d3.format('+,.1f')(d.tmin)); 
            g.append("svg:text")
                .attr('class', 'tmax')
                .attr("x", x(d.period) + 30)
                .attr("y", y(d.tmax) - 6)
                .text(d3.format('+,.1f')(d.tmax)); 
             g.append("svg:text")
                .attr('class', 'tmax')
                .attr("x", x2(d.period) + 20)
                .attr("y", y2(d.ppt) - 6)
                .text(d3.format(',.0f')(d.ppt)); 


        });

    }

    // 
    function draw_delta(css, col, data){

        var xmax1 = x(data[0].period) + 25;
        var xmax2 = x(data[1].period) + 25;
        var ymax1 = y(data[0][col]);
        var ymax2 = y(data[1][col]);
        var hpmax = ymax1 - ymax2;

        g.append("line")
            .attr('class', css)
            .attr("x1", xmax1)
            .attr("y1", ymax1)
            .attr("x2", xmax2)
            .attr("y2", ymax2);

    } 
        


    // public
    return {

        draw: draw,
        update: update

    }


}();


/*
  =====================================
    Graph Population Component
  

  =====================================
*/
graphPopulation = function(){
    
    var posx=500, posy=220;

    var g =  svg.append("g")
        .attr("class", "select")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    var data = {};

    var x = d3.time.scale()
            .range([0,8]);

    var y = d3.scale.linear()
            .range([100, 30]);

    x.domain(years);

    var line = d3.svg.line()
            .x(function(d,i) { 
                return x(years[i]) + 10; 
            })
            .y(function(d) { 
                return y(d); 
            });

    //
    function draw(){

        g.append("g")
              .append("text")
              .attr("class", "graphtitle")
              .attr("y", 100)
              .attr("x", 110)
              .attr("dy", ".71em")
              .style("text-anchor", "middle")
              .text("Population .....");

        g.append("image")
            .attr("xlink:href", "resources/human.png")
            .attr("x", 160)
            .attr("y", 70)
            .attr("width", 20)
            .attr("height", 40);

         g.append("g")
              .append("rect")
              .attr("class", "graph")
              .attr("y", 0)
              .attr("x", -10)
              .attr("width", 220)
              .attr("height", 120);
            

    }

    // 
    function update(){

       var obj = economyByCode[currentCode]; 
       var data = []

       g.selectAll(".population").remove();

       years.forEach(function(d, i){
            data[i] = parseFloat(obj[d.getFullYear()]) / 1000000.0;
            //log(data[i]);
       });
        min = d3.min(data, function(d) { return d; });
        max = d3.max(data, function(d) { return d; });
        y.domain([min,max]);

      
        g.append("path")
            .attr("class","population")
            .attr("d", line(data));

        data.forEach(function(d, i){
            var xx = x(years[i]);
            var yy = y(d) ;
            if(i%10 == 0){
                g.append("circle")
                    .attr("class","population")
                    .attr("cx", xx + 13)
                    .attr("cy", yy -3)
                    .attr("r",6);
                g.append("g")
                    .append("text")
                    .attr("class", "population year")
                    .attr("y", yy + 14)
                    .attr("x", xx + 3)
                    .text(d3.time.format('%Y')(years[i]));
                g.append("g")
                    .append("text")
                    .attr("class", "population M")
                    .attr("y", yy - 12)
                    .attr("x", xx + 3)
                    .text(d3.format(',.2f')(d) + 'M');
            }

        });


    }

   

    // public
    return {

        draw: draw,
        update: update

    }


}();

/*
  =====================================
    Graph Ocean Level Component
  

  =====================================
*/
graphOcean = function(){
    
    var posx=460, posy=90;

    var H = 50, W = 50, A = H * W;

    var g =  svg.append("g")
        .attr("class", "select")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    var garea = g.append("g")
            .attr("class", "area5m");

    //
    function draw(){



        g.append("g")
              .append("text")
              .attr("class", "graphtitle")
              .attr("y", 100)
              .attr("x", 110)
              .attr("dy", ".71em")
              .style("text-anchor", "middle")
              .text("Land Area below 5m");


        g.append("image")
            .attr("xlink:href", "resources/waves.png")
            .attr("x", 60)
            .attr("y", 71)
            .attr("width", 90)
            .attr("height", 30);

        g.append("line")
            .attr("x1", 65)
            .attr("y1", 30)
            .attr("x2", 150)
            .attr("y2", 30)
            .style("stroke","black","stroke-width","0.2px");

        g.append("text")
              .attr("class", "tmin")
              .attr("y", 25)
              .attr("x", 60)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text("5m");

        g.append("text")
              .attr("class", "tmin")
              .attr("y", 25)
              .attr("x", 170)
              .attr("dy", ".71em")
              .style("text-anchor", "end")
              .text("5m");

        

        garea.append("rect")
                .attr("class", "area5m")
                .attr("x", 80)
                .attr("y", 31)
                .attr("width", W)
                .attr("height", H);
        garea.append("text")
                .attr("class", "area5m")
                .attr("y", H + 34)
                .attr("x", 125)
                .attr("dy", ".71em")
                .style("text-anchor", "end")
                .text('');

        g.append("g")
              .append("rect")
              .attr("class", "graph")
              .attr("y", -30)
              .attr("x", 30)
              .attr("width", 160)
              .attr("height", 150);


            



    }

    //
    function area(){
        return dataByCode[currentCode]['area5m'] / 100.0;
    }

    // 
    function update(){

        var a = area();
        var ty = a * A / W  - H;
        log(ty);
        garea.transition().attr("transform", "translate(0," + ty + ")" );
        garea.select("text.area5m").text(d3.format(',.1f')(a * 100) + "%");
        

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
	    .defer(d3.csv, "data/countries.csv")
        .defer(d3.csv, "data/climate.csv")
        .defer(d3.csv, "data/economy.csv")
	    .await(ready);

/*
  All graphic components.
*/
var components = [selectCountry, selectPercentile, incomeBar, graphClimate, graphPopulation, graphOcean];


/*
  Ready:
*/
function ready(error, countries, temperatures, economy) {

    //
    economy.forEach(function(d){
        economyByCode[d.code] = d;
    });
    //
    temperatures.forEach(function(d){
        dataByCode[d.code] = d;
    });
    var tmp = []
    countries.forEach(function(d){
        if (dataByCode[d.code] != undefined){
            countryByCode[d.code] = d;
            tmp.push(d);
        }
    });
    countries = tmp;

    // draw D3 components
    components.forEach(function(c){
          c.draw(countries, temperatures);
    });

    currentCode = 'USA';
    currentPercentile = '10th';
    d3.select("#countries")[0][0].value = currentCode;
    refresh();
     
}

/*
  Refresh:
*/
function refresh(){

      // update D3 components
      components.forEach(function(c){
          c.update();
      });
    
}
