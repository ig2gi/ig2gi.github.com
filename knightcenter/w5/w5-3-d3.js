

var width = 900,
    height = 600;

var region_names = []

// root node for treemap
var root = {};

function log(message) {console.log(message);};

var colorScheme = 'Oranges';

var currentDataset = 'emission';

// D3 Global variables ---------------------------------

var path = d3.geo.path();

var body = d3.select("body");

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);


/*
  =====================================
    Treemap Component
  

  =====================================
*/
treemap = function(){
    
    var posx = 50, posy = 80;

    var w = 600,
        h = 400,
        x = d3.scale.linear().range([0, w]),
        y = d3.scale.linear().range([0, h]);


    var g =  svg.append("g")
        .attr("class", "treemap")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    var color = d3.scale.ordinal()
            .domain(region_names)
            .range(colorbrewer[colorScheme][9]);

    var map = d3.layout.treemap()
            .size([w, h])
            .sticky(false)
            .value(function(d) { return d[currentDataset]; });

    var nodes = map.nodes(root)
                        .filter(function(d) { return !d.children; });

    var cell, nodes, node;

    //
    function draw(regions){

        node = root;

        g.append("rect")
            .attr("x", -2)
            .attr("y", -2)
            .attr("width", w+4)
            .attr("height", h+4)
            .attr("class", "treemap");

        nodes = map.nodes(root)
                .filter(function(d) { return !d.children; });

          cell = g.selectAll("g")
              .data(nodes)
              .enter().append("g")
              .attr("class", "cell")
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
              //.on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

          cell.append("rect")
              .attr("width", function(d) { return d.dx - 1; })
              .attr("height", function(d) { return d.dy - 1; })
              .style("fill", function(d) { return color(d.name); });

          cell.append("svg:text")
              .attr("x", function(d) { return d.dx / 2; })
              .attr("y", function(d) { return d.dy / 2; })
              .attr("class", "cell title")
              .attr("dy", ".35em")
              .attr("text-anchor", "middle")
              .text(function(d) { return d.name; });
              

          cell.append("svg:text")
              .attr("x", function(d) { return d.dx / 2; })
              .attr("y", function(d) { return d.dy / 2 + 10; })
              .attr("class", "cell value")
              .attr("dy", ".35em")
              .attr("text-anchor", "middle")
              .text(function(d) { return d3.format(',.0f')(d[currentDataset]) + ' '; });
                      
                              


    }


    // 
    function update(){

        map.value(function(d) { return d[currentDataset]; }).nodes(root);

        cell.transition().duration(750).attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        cell.selectAll("rect").transition()
                .attr("width", function(d) { return d.dx - 1; })
                .attr("height", function(d) { return d.dy - 1; });

        cell.selectAll(".cell.title").transition()
                .attr("x", function(d) { return d.dx / 2; })
                .attr("y", function(d) { return d.dy / 2; });


        cell.selectAll(".cell.value").transition()
                .attr("x", function(d) { return d.dx / 2; })
                .attr("y", function(d) { return d.dy / 2 + 10; })
                .text(function(d) { return d3.format(',.0f')(d[currentDataset]) + ' '; });

    }

    // public
    return {

        draw: draw,
        update: update,

    }


}();


/*
  =====================================
    Select Dataset Component
  

  =====================================
*/
selectDataset = function(){
    
    var x=0, y=40;

    var g =  svg.append("g")
        .attr("class", "select")
        .attr('transform', 'translate(' + x + ',' + y + ')');

    //
    function draw(countries, temparatures){
        
        d3.select("#dataset")
            .on("change",change)
            .selectAll("option")
            .data({'GHG Emissions (KtCO2e)':'emission', 'Energy use per capita':'energy'})
            .enter().append("option")
            .attr("value", function(d) { return d[0];})
            .text(function(d) { return d[1];});

    }

    //
    function change(){
        currentDataset = this.value;
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
	    .defer(d3.csv, "data/regions.csv")
        .defer(d3.json, "data/emissions.json")
	    .await(ready);

/*
  All graphic components.
*/
var components = [selectDataset, treemap];


/*
  Ready:
*/
function ready(error, regions, emissions) {

    //
    root = emissions;
    //
    regions.forEach(function(d){
        region_names.push(d.name);

    });

    // draw D3 components
    components.forEach(function(c){
          c.draw();
    });

   
    //refresh();
     
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
