
// log wrapper
var log = log || function(){
    if(console && console.log)
      console.log.apply(console, arguments);
}

var width = 1000;

// D3 Global variables ---------------------------------

var body = d3.select("body");

var color = d3.scale.ordinal()
            //.domain(region_names)
            .range(colorbrewer['Spectral'][9]);

//
// MAP PANEL
//
var heightmap = 500,
    mapsvg = d3.select("#map").append("svg")
        .attr("width", width)
        .attr("height", heightmap),
    proj = d3.geo.mercator(),
    path = d3.geo.path().projection(proj);

//
// INFO PANEL 
//
var infosvg = d3.select("#info").append("svg")
    .attr("width", width)
    .attr("height", 400);




/*
  =====================================
    Component 1
    Display World Map
  =====================================
*/
worldmap = function(){
    
    var posx=20, posy=90, centered;

    var g =  mapsvg.append("g")
        .attr("class", "map")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    proj.scale(800);

    var equator = d3.select("svg")
            .append("line")
            .attr("x1", "0%")
            .attr("x2", "100%");

    var ye = proj([0, 0])[1];

    //
    function draw(){

         var feature = g.selectAll("path")
            .data(IAS.worldJson.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path)
            .style("fill","gray") 
            .on('mouseover', function (d) {

                d3.select(this)
                    .style('stroke', "tomato")
                    .style('stroke-width', "2px");

                titles.onCountry(d.properties.name);
                      
                })
            .on('mouseout', function (d) {

                d3.select(this)
                    .style('stroke', "#fff")
                    .style('stroke-width', "1px");
                
                titles.onCountry('');

                })
            .on('click', click);

          equator
                .attr("y1", ye)
                .attr("y2", ye)
                .attr("transform","translate(0," + posy + ")");

          // svg tooltip
          feature.append("svg:title")
              .text(function(d) { return d.properties.name; });



    }

    // 
    function update(){

      

    }

    //
    function click(d) {

     
          var x = 0,
              y = 0,
              tx = posx,
              ty = posy,
              k = 1;

          if (d && centered !== d) {
            var centroid = path.centroid(d);
            x = -centroid[0];
            y = -centroid[1];
            k = 2;
            tx = x + width / 2 / k ;
            ty = y + heightmap / 2 / k;
            centered = d;
          } else {
            centered = null;
          }          

          g.selectAll("path")
              .classed("active", centered && function(d) { return d === centered; });

          equator.transition()
              .duration(1000)
              .attr("transform","scale(" + k + ") translate(0," +ty + ")");

          g.transition()
              .duration(1000)
              .attr("transform", "scale(" + k + ") translate(" + tx + "," + ty + ")")
              .style("stroke-width", 1.5 / k + "px");

          cohortmap.scale(k, tx, ty);

    }


    // public
    return {

        draw: draw,
        update: update

    }


}();


/*
  =====================================
    Component 2
    Network Selector

  =====================================
*/
networkSelector = function(){
    
    var posx=20, posy=50;

    var g =  infosvg.append("g")
        .attr("class", "network")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    var cluster = d3.layout.cluster()
        .size([200, 200]);

    var diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });


    //
    function draw(){

        var nodes = cluster.nodes(IAS.networksJson),
            links = cluster.links(nodes);

        var link = g.selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            //.style("stroke", function(d) { return getColorLink(d); })
            .attr("d", diagonal);

        var node = g.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", function(d) {return "node depth" + d.depth ;})
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });


        node.append("circle")
            .attr("r", 4.5)
            .style("fill", function(d) { return getColor(d); })
            .on('mouseover', function (d) {
                d3.select(this)
                     .attr("r", 5.5)
                    .style('stroke-width', "2.5px");  
                g.select("#text" + d.code)
                    .style("font-weight", "bold");  
                })
            .on('mouseout', function (d) {
                d3.select(this)
                    .attr("r", 4.5)
                    .style('stroke-width', "1.5px");
                g.select("#text" + d.code)
                    .style("font-weight", "normal"); 
                });

        node.append("text")
            .attr("dx", function(d) { return d.children ? 8 : -8; })
            .attr("dy", 3)
            .attr("id", function(d) { return "text" + d.code; })
            .style("text-anchor", function(d) { return d.children ? "start" : "end"; })
            .text(function(d) { return d.name; });
                     

    }

    function getText(node){
        return node.name;
    }

    //
    function getColor(node){
        var name = '';
        if (node.depth == 1)
            name = node.name;
        if (node.depth == 2)
            name = node.parent.name;
        if (node.depth == 3)
            name = node.parent.parent.name;
        return color(name);
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
    Component 3
    Info Titles

  =====================================
*/
titles = function(){
    
    var posx=20, posy=20;

    var g =  infosvg.append("g")
        .attr("class", "network")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    //
    function draw(){

        g.append("text")
            .attr("x", 0)
            .attr("y", 10)
            .attr("class", "title")
            .text("Networks");

        g.append("text")
            .attr("x", 400)
            .attr("y", 10)
            .attr("class", "title")
            .text("Country");

        g.append("text")
            .attr("x", 400)
            .attr("y", 30)
            .attr("class", "subtitle country")
            .text("");

        g.append("text")
            .attr("x", 800)
            .attr("y", 10)
            .attr("class", "title")
            .text("Cohort");

        g.append("text")
            .attr("x", 980)
            .attr("y", 30)
            .attr("class", "subtitle cohort")
            .text("");



    }

     // 
    function update(){

     
    }

    //
    function onCountry(state){
      g.select(".subtitle.country").text(state);
    }

    //
    function onCohort(cohort){
      g.select(".subtitle.cohort").text(cohort ? cohort.name : '');
    }


    // public
    return {

        draw: draw,
        update: update,
        onCountry: onCountry,
        onCohort: onCohort

    }


}();

/*
  =====================================
    Component 4
    Display Cohorts Map

  =====================================
*/
cohortmap = function(){
    
    var posx=20, posy=90;

    var g =  mapsvg.append("g")
        .attr("class", "cohortmap")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    //
    function draw(){

      IAS.cohorts.forEach(function(c){

        if(c.countries && c.countries.length > 0){

              c.countries.forEach(function(country){

                  var f = IAS.countriesByName[country];

                  if(f) { // cohort country match!

                        var coords = path.centroid(f);
                        var circles = g.append("circle")
                            .attr("class", "cohort" + c.code)
                            .attr("cx", coords[0])
                            .attr("cy", coords[1])
                            .attr("r", 3)
                            .style("fill", color(c.networks[0]))
                            .on('mouseover', function (){onCohort(c, true);})
                            .on('mouseout', function (){onCohort(c, false);});

                    }
                     
              });        

        }
         
      });

    }

    //
    function onCohort(cohort, over){

      log(cohort);

        var w = over ? "12" : "0";

        g.selectAll("circle.cohort" + cohort.code)
          .style("stroke-width", w)
          .style("stroke","steelblue")
          .style("stroke-opacity", 0.6);

        titles.onCohort(over ? cohort : null);

    }


     // 
    function update(){

     
    }

    //
    function scale(k, tx, ty){
       g.transition()
              .duration(1000)
              .attr("transform","scale(" + k + ") translate(" + tx + "," +ty + ")");

    }
   

    // public
    return {

        draw: draw,
        update: update,
        scale: scale
        
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
	     

//
// Load resources.
//
queue()
	    .defer(d3.json, "/data/world-countries.json")
      .defer(d3.json, "/data/networks.json")
      .defer(d3.json, "/data/ias-db.json")
	    .await(ready);

//
// All graphic components.
//
var components = [worldmap, cohortmap, networkSelector, titles];


//
// Ready function
//
function ready(error, world, networks, iasdb) {

    // init domain
    IAS.worldJson = world;
    IAS.networksJson = networks;
    IAS.cohorts = iasdb['cohorts'];
    IAS.countriesByName = {};
    IAS.worldJson.features.forEach(function (c){
        IAS.countriesByName[c.properties.name] = c;
    });

    // draw D3 components
    components.forEach(function(c){
          c.draw();
    });

    refresh();
     
}

//
// Refresh:
//
function refresh(){

      // update D3 components
      components.forEach(function(c){
          c.update();
      });
    
}

