/**
* IAS (International AIDS Society). 
*
* @author Gilbert Perrin (gilbert.perrin@gmail.com) 
* @year 2013
*/
var IAS = IAS || {};
IAS.graph = (function(){

        // IAS graph module
        var graph = {};

        // reference to the IAS domain model
        var model = IAS.model; 

        // log wrapper
        var log = log || function(){
            if(console && console.log)
              console.log.apply(console, arguments);
        }

        var projection = d3.geo.equirectangular().scale(180);

        var path = d3.geo.path().projection(projection);

        var color = d3.scale.ordinal()
                    //.domain()
                    .range(colorbrewer['Blues'][9]);

        var maxColors = 7;
        var colorMap = d3.scale.quantile()
                    .domain([0,26])
                    //.range(["orange","red"]);
                    .range(colorbrewer['Reds'][maxColors]);





        // D3 Global variables ---------------------------------

        var body = d3.select("body");

       var width = 1000;

        //
        // MAP PANEL
        //
        var heightmap = 500;
        
        var mapsvg = d3.select("#map").append("svg")
                .attr("width", width)
                .attr("height", heightmap);
                //.call(d3.behavior.zoom().on("zoom", zoom)); // TODO activate zoom
                
            
        //
         function zoom() {
              
            if(d3.event.scale >= 4){
                d3.event.scale = 4;
                return;
            }
              if(d3.event.scale >= 1 && d3.event.scale <= 4){
                    d3.select("#mapcontainer")
                        //.transition().duration(500)
                      .attr("transform",
                  "translate(" + d3.event.translate + ")"
                  + " scale(" + d3.event.scale + ")");

              }
              
        }

        
        //
        // INFO PANEL 
        //
        var infosvg = d3.select("#info").append("svg")
            .attr("width", width)
            .attr("height", 400);


        //
        // LEGEND PANEL
        //
        var legendsvg = d3.select("#legend").append("svg")
            .attr("width", width)
            .attr("height", 80);


        /**
        *
        *
        */
        function Pin(parent, x, y, text, color, size, country, app){

            this.text = text;
            this.color = color;
            this.size = size;
            this.x = x;
            this.y = y;
            this.country = country;
            this.app = app;
         
            var pi = Math.PI;

            var radius = this.size / 2,
                height = 4 * radius;

            var arc = d3.svg.arc()
                .innerRadius(0)
                .outerRadius(radius)
                .startAngle(0)
                .endAngle(2*pi);

            var g = parent.append("g")
                .attr("class", "pin");

            //
            this.draw = function (){
                
                g.append("path")
                    .attr("class","pin")
                    .attr("d", arc);
                
                g.append('path')
                    .attr("class","pin")
                  .attr('d', function(d) { 
                    return 'M ' + (-radius/2) +' 0 l ' + radius + ' 0 l ' + -radius/2 + ' '  + height + ' z';
                  });

                g.append("circle")
                    .attr("cx", 0)
                    .attr("cy", 0)
                    .attr("class", "pin")
                    .style("fill", color)
                    .attr("r", radius - 2);

                g.append("text")
                    .attr("dx", 0)
                    .attr("dy", "0.35em")
                    .attr("class", 'pin')
                    .style("text-anchor", "middle")
                    .text(text);

                g.attr('transform', 'translate(' + this.x + ',' + (this.y - height) + ')');

                g.on('mouseover', function (d) {

                           enterCountry(country.name(), app);
                                  
                            })
                .on('mouseout', function (d) {

                            exitCountry(country.name(), app);

                        });


                return this; // chaining

            }

            //
            this.setVisible = function(visible){

                g.style('display',visible ? 'inline' : 'none');
                return this;

            }


        }; // end of object Pin


        /**
        * 
        *   Component 1
        *   Display World Map  
        */
        graph.map = function (app){
            
            var posx=0,posy=40,centered;

            var g =  mapsvg.append("g")
                .attr("id", "mapcontainer")
                .attr('transform', 'translate(' + posx + ',' + posy + ')');

            // background map layer
            var gmap =  g.append("g")
                .attr("id", "map")
                .attr("class", "map");

            // countries pins layer
            var gpins = g.append("g")
                .attr("id", "pins")
                .attr("class", "pin");

            //
            function draw (){


        
                // draw map
                gmap.selectAll("path")
                        .data(model.worldJson.features)
                    .enter().append("path")
                        .attr("class", "country")
                        .attr("d", path) 
                        .style("fill", function(d) { return getCountryColor(d);})
                        .attr("id", function(d) { return d.properties.name; })
                        .on('mouseover', function (d) {

                           enterCountry(d.properties.name, app);
                                  
                        })
                        .on('mouseout', function (d) {

                            exitCountry(d.properties.name, app);

                        })
                        .on('click', click);
                 

                gmap.select("#Antarctica").remove();


                    
                // draw pins layer
                 model.countries.forEach(function(country){

                        n = country.numberOfCohorts();   
                        if(n > 0){
                            var pin = new Pin(gpins, country.centroidx, country.centroidy, n + '', "white", 12, country, app);
                            pin.draw();
                        }
                     
                });

               
            }

            //
            function getCountryColor(d){

                var country = model.getCountry(d.properties.name);
                var rate = country.hivPrevalenceRate;
                if(rate !== undefined)
                    return colorMap(rate);
                return "gray";

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

                  gmap.selectAll("path")
                      .classed("active", centered && function(d) { return d === centered; });

                  g.transition()
                      .duration(1000)
                      .attr("transform", "scale(" + k + ") translate(" + tx + "," + ty + ")")
                      .style("stroke-width", 1.5 / k + "px");

            }

            // public
            return {

                draw: draw,
                update: update

            }


        };


        /**
        * 
        *   Component Legend
        *   
        */
        graph.legend = function (app){
            
            var posx=0,posy=20;

            var g =  legendsvg.append("g")
                .attr("id", "legend")
                .attr('transform', 'translate(' + posx + ',' + posy + ')');

           
            //
            function draw (){

                var data = colorMap.quantiles();
     
                g.selectAll("rect")
                        .data(data)
                        .enter().append("rect")
                        .attr('class', 'legend')
                        .attr("x", function(d, i) { return i*20 + 10 })
                        .attr("y", 20)
                        .attr("width", 20)
                        .attr("height", 20)
                        .style("stroke","#000")
                        .style("stroke-width",".3px")
                        .style("fill", function(d) { return colorMap(d);})
                        .attr("dx", -3) // padding-right
                        .attr("dy", ".35em"); // vertical-align: middle

                g.append("rect")
                        .attr('class', 'legend')
                        .attr("x", (maxColors-1)*20 + 15)
                        .attr("y", 20)
                        .attr("width", 20)
                        .attr("height", 20)
                        .style("stroke","#000")
                        .style("stroke-width",".3px")
                        .style("fill", 'gray')
                        .attr("dx", -3) // padding-right
                        .attr("dy", ".35em"); // vertical-align: middle
                    
                data.push('n/a');
                g.selectAll("text")
                        .data(data)
                        .enter().append("text")
                        .attr("x", function(d, i) { return i*20 + ((d !== 'n/a') ? 10:15) })
                        .attr("y", 18)
                        .attr("class", "legend")
                        .text(function(d) { return (d !== 'n/a') ? '>' + parseFloat(d).toFixed(1): d;});

                g.append("text")
                        .attr("x", 10)
                        .attr("y", 8)
                        .attr("class", "title legend")
                        .text("HIV Prevalence Rate (%)");

                           
            }

               
        

            // 
            function update(){

              

            }

           
            // public
            return {

                draw: draw,
                update: update

            }


        };




        /**
         * 
         *   Component 2
         *   Network Selector
        */
        graph.networkSelector = function  (){

            var posx=10,posy=20;
 
            var g =  infosvg.append("g")
                .attr("class", "network")
                .attr('transform', 'translate(' + posx + ',' + posy + ')');

            var cluster = d3.layout.cluster()
                .size([200, 200]);

            var diagonal = d3.svg.diagonal()
                .projection(function(d) { return [d.y, d.x]; });


            //
            function draw(){

                var nodes = cluster.nodes(model.networks),
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

           
        };

        /**
        *  
         *   Component 3
          *  Info Titles
        */
        graph.informationPanel = function (){
            
            var posx=10,posy=15;

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
                    .attr("x", 400)
                    .attr("y", 50)
                    .attr("id","country_rate")
                    .attr("class", "info country")
                    .text("");

                g.append("text")
                    .attr("x", 400)
                    .attr("y", 65)
                    .attr("id","country_networks")
                    .attr("class", "info country")
                    .text("");
                
                g.append("text")
                    .attr("x", 400)
                    .attr("y", 80)
                    .attr("id","country_cohorts")
                    .attr("class", "info country")
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
            function onCountry(countryId){

                country = model.getCountry(countryId);
                if(country !== undefined){
                     g.select(".subtitle.country").text(country.name());
                     g.select("#country_rate").text("HIV Prevalence Rate: " + country.hivPrevalenceRate + "%");
                     g.select("#country_networks").text("Networks: " + country.networks.length);
                     g.select("#country_cohorts").text("Cohorts: " + country.cohorts.length);
                }
                else{
                    g.select(".subtitle.country").text('');
                    g.select("#country_rate").text('');
                    g.select("#country_networks").text("");
                    g.select("#country_cohorts").text("");

                }


            }

            //
            function onCohort(cohort){
              g.select(".subtitle.cohort").text(cohort ? cohort.name : '');
            }

            // public
            return {

                draw: draw,
                update: update,
                onCountry: onCountry

            }
           

        };



        graph.init = function(centroids){

            var overloadCentroids = {};
            centroids.forEach(function(c){
                overloadCentroids[c.id] = c.ll;
            });
            // augment IAS domain with graphic behaviors
            model.countries.forEach(function(country){
                // check if centroid is modified
                var coords = [];
                var overcoords = overloadCentroids[country.name()];
                if(overcoords === undefined){
                    // compute country centroid
                    coords = path.centroid(country.feature);
                }else{
                    coords = projection(overcoords);
                }
                country.centroidx = coords[0];
                country.centroidy = coords[1];
                // compute cohorts x,y coordinates
                if(country.cohorts && country.cohorts.length >= 1){
                    var delta = 0;
                    country.cohorts.forEach(function(cohort){
                        cohort.x = coords[0] + delta;
                        cohort.y = coords[1];
                        delta = delta + 5;
                    });
                    
                }

            });

            colorMap.domain(model.hivRatesRange);
        }



        ////////////////////////////
        ////////////////////////////

        function enterCountry(countryId, app){

            d3.select("#" + countryId)
                    .style('stroke', "steelblue")
                    .style('stroke-width', "1px");
            

            app.onCountry(countryId);

        }

        function exitCountry(countryId, app){

           d3.select("#" + countryId)
                    .style('stroke', "#fff")
                    .style('stroke-width', "0px");
                           

            app.onCountry('');

        }




       
        return graph;


})();



