
// log wrapper
var log = log || function(){
    if(console && console.log)
      console.log.apply(console, arguments);
}


var width = 1000,
    height = 700;


// D3 Global variables ---------------------------------


var body = d3.select("body");

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);


/*
  =====================================
    Component 1
    Display World Map
  =====================================
*/
worldmap = function(){
    
    var posx=20, posy=120;

    var g =  svg.append("g")
        .attr("class", "map")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    var proj = d3.geo.mercator(),
        path = d3.geo.path().projection(proj);

    proj.scale(900);

    var equator = d3.select("svg")
            .append("line")
            .attr("x1", "0%")
            .attr("x2", "100%");


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
                      
                })
            .on('mouseout', function (d) {

                  d3.select(this)
                    .style('stroke', "#fff")
                    .style('stroke-width', "1px");
    

                })
            .on('click', function (d) {
                
            });

          equator
                .attr("y1", proj([0, 0])[1])
                .attr("y2", proj([0, 0])[1])
                .attr("transform","translate(0," + posy + ")");

          // svg tooltip
          feature.append("svg:title")
              .text(function(d) { return d.properties.name; });



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
	    .defer(d3.json, "../data/world-countries.json")
	    .await(ready);

//
// All graphic components.
//
var components = [worldmap];


//
// Ready function
//
function ready(error, world) {

    // init domain
    IAS.worldJson = world;


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

      log(IAS);

      // update D3 components
      components.forEach(function(c){
          c.update();
      });
    
}

