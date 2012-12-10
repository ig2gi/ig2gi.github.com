

var width = 900,
    height = 700;

var region_names = []

// root node for treemap
var root = {};

function log(message) {console.log(message);};

var colorScheme = 'Spectral';

var currentDataset = 'emission';

var units = {'emission':'KtCO2e', 'energy':'kOe'};

function currentUnit(){
  return units[currentDataset];
}

// D3 Global variables ---------------------------------

var path = d3.geo.path();

var body = d3.select("body");

var svg = d3.select("#map").append("svg")
    .attr("width", width)
    .attr("height", height);

var color = d3.scale.ordinal()
            .domain(region_names)
            .range(colorbrewer[colorScheme][9]);


/*
  =====================================
    Treemap Component
  

  =====================================
*/
treemap = function(){
    
    var posx = 20, posy = 60;

    var w = 850,
        h = 600,
        x = d3.scale.linear().range([0, w]),
        y = d3.scale.linear().range([0, h]);


    var g =  svg.append("g")
        .attr("class", "treemap")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

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

        g.append("text")
            .attr("x", 850)
            .attr("y", -50 )
            .attr("class", "subtitle")
            .attr("dy", ".35em")
            .attr("text-anchor", "end")
            .text('');

        nodes = map.nodes(root)
                .filter(function(d) { return !d.children; });

          cell = g.selectAll("g")
              .data(nodes)
              .enter().append("g")
              .attr("class", "cell")
              .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; })
              .on("mouseover", function(d) { 

                  g.select(".subtitle").text(d.name + ": " + d3.format(',.0f')(d[currentDataset]) 
                    + ' ' + currentUnit()
                    + ' (' + d['y' + currentDataset] +')' );

              })
               .on("mouseout", function(d) { 

                  g.select(".subtitle").text('');

              });
             

          cell.append("rect")
              .attr("width", function(d) { return d.dx > 1 ? d.dx - 1 : 0; })
              .attr("height", function(d) { return d.dy > 1 ? d.dy - 1 : 0; })
              .style("fill", function(d) { return color(d.parent.name); });



          cell.append("svg:text")
              .attr("x", function(d) { return d.dx / 2; })
              .attr("y", function(d) { return d.dy / 2 -5; })
              .attr("class", "cell title")
              .attr("dy", ".35em")
              .attr("text-anchor", "middle")
              .attr("transform", function(d) { return rotate(d)})
              .text(function(d) { return d.name; })
              .style("opacity", function(d) { return opacity(this, d, 0)});

              
        
          cell.append("svg:text")
              .attr("x", function(d) { return d.dx / 2; })
              .attr("y", function(d) { return d.dy / 2 + 5; })
              .attr("class", "cell value")
              .attr("dy", ".35em")
              .attr("text-anchor", "middle")
              .attr("transform", function(d) { return rotate(d)})
              .text(function(d) { return d3.format(',.0f')(d[currentDataset]); })
              .style("opacity", function(d) { return opacity(this, d, 1) });;
                      
                              


    }

    //
    function rotate(d){
       
        return "rotate(" + ((d.dy / d.dx) > 1.5 ? 90 : 0 ) +" "+ d.dx/2 + " " +   d.dy/2 + ")";

    }

    function opacity(c, d, val){

        vertical = (d.dy / d.dx) > 1.5;
        d.tw = c.getBBox().width; 
        d.th = c.getBBox().height; 
        var delta = 12;
        if(val == 1 && currentDataset == 'emission' && d.emission < 250000)
          return "0";
        else if(vertical && d.dy < d.tw - delta) return "0";
        else if(vertical && d.dx < d.th - delta) return "0";
        else if(!vertical && d.dx < d.tw  - delta) return "0";
        else if(!vertical && d.dy < d.th - delta) return "0";
        else return  "1"; 

    }


    // 
    function update(){

        map.value(function(d) { return d[currentDataset]; }).nodes(root);

        cell.transition().duration(750).attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        cell.selectAll("rect").transition()
                .attr("width", function(d) { return d.dx > 1 ? d.dx - 1 : 0; })
                .attr("height", function(d) { return d.dy > 1 ? d.dy - 1 : 0; });

        cell.selectAll(".cell.title").transition()
                .attr("x", function(d) { return d.dx / 2; })
                .attr("y", function(d) { return d.dy / 2 -5; })
                .attr("transform", function(d) { return rotate(d);})
                .style("opacity", function(d) { return opacity(this, d, 0)});


        cell.selectAll(".cell.value").transition()
                .attr("x", function(d) { return d.dx / 2; })
                .attr("y", function(d) { return d.dy / 2 + 5; })
                .text(function(d) { return d3.format(',.0f')(d[currentDataset]) + ' '; })
                .attr("transform", function(d) { return rotate(d)})
                .style("opacity", function(d) { return opacity(this, d, 1)});

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
            .data({'GHG Emissions (KtCO2e)':'emission', 'Energy use per capita (kOe)':'energy'})
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


/*
  =====================================
    Treemap Legend Component
  

  =====================================
*/
legend = function(){
    
    var posx=20, posy=35;

    var g =  svg.append("g")
        .attr("class", "legend")
        .attr('transform', 'translate(' + posx + ',' + posy + ')');

    //
    function draw(countries, temparatures){

        var tw = 0;
        
        region_names.forEach(function(r, i){
           
            g.append("rect")
                .attr("x", tw)
                .attr("y", 0)
                .attr("width", 15)
                .attr("height", 15)
                .style("fill", color(r));

            g.append("svg:text")
                .attr("x", tw + 16)
                .attr("y", 10)
                .attr("class", "legend legend" + i)
                .text(r);

            tw = tw + g.select(".legend.legend" + i)[0][0].getComputedTextLength() + 20;


        });

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
      .defer(d3.json, "data/emissions2.json")
	    .await(ready);

/*
  All graphic components.
*/
var components = [selectDataset, treemap, legend];


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
