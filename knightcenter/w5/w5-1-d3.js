

var width = 900,
    height = 900;


function log(message) {console.log(message);};

var region_names = []

var colorScheme = 'Spectral';


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

    var color = d3.scale.ordinal()
            .domain(region_names)
            .range(colorbrewer[colorScheme][9]);


    //
    function draw(root){

        var nodes = tree.nodes(root),
            links = tree.links(nodes);

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
            .attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; })

        node.append("circle")
            .attr("r", 4.5)
            .style("fill", function(d) { return getColor(d); });

        node.append("text")
            .attr("dy", ".31em")
            .attr("text-anchor", function(d) { return getTextAnchor(d)})
            .attr("transform", function(d) { return getTextTransform(d); })
            .text(function(d) { return d.name; });

        //d3.select(self.frameElement).style("height", diameter - 150 + "px");
               

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
    function getColorLink(link){
        return getColor(link.source);
    }

    //
    function getTextTransform(node){
        if(node.depth == 1)
            return node.x < 180 ? "translate(8,-10)" : "rotate(180)translate(-8, -10)";
        return node.x < 180 ? "translate(8)" : "rotate(180)translate(-8)"; 
    }

    //
    function getTextAnchor(node){
        if(node.depth == 1)
            return 'middle';
        return node.x < 180 ? "start" : "end"; 
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
        .defer(d3.csv, "data/regions.csv")
	    .await(ready);

/*
  All graphic components.
*/
var components = [dendro];


/*
  Ready:
*/
function ready(error, countries, regions) {

     regions.forEach(function(d){
        region_names.push(d.name);

    });


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
