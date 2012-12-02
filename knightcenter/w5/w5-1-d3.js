

var width = 900,
    height = 900;


var parseDate = d3.time.format("%B %Y").parse;



// D3 Global variables ---------------------------------

var path = d3.geo.path();

var body = d3.select("body");

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);


/*
  =====================================
    Dendrogram Component
  

  =====================================
*/
dendro = function(){
    
    var x=450, y=450;

    var g =  svg.append("g")
        .attr("class", "dendro")
        .attr('transform', 'translate(' + x + ',' + y + ')');

    var diameter = 900;

    var tree = d3.layout.tree()
        .size([360, diameter / 2 - 120])
        .separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

    var diagonal = d3.svg.diagonal.radial()
        .projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });


    //
    function draw(root){

         var nodes = tree.nodes(root),
            links = tree.links(nodes);

        var link = g.selectAll(".link")
            .data(links)
            .enter().append("path")
            .attr("class", "link")
            .attr("d", diagonal);

        var node = g.selectAll(".node")
            .data(nodes)
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

        node.append("circle")
            .attr("r", 4.5);

        node.append("text")
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
            .attr("transform", function(d) { return d.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; })
            .text(function(d) { return d.name; });

        //d3.select(self.frameElement).style("height", diameter - 150 + "px");
               

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
	     

/*
  Load resources.
*/
queue()
	    .defer(d3.json, "data/countries.json")
	    .await(ready);

/*
  All graphic components.
*/
var components = [dendro];


/*
  Ready:
*/
function ready(error, countries) {


    // draw D3 components
    components.forEach(function(c){
          c.draw(countries);
    });

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
