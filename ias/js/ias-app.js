/**
* IAS (International AIDS Society). 
*
* @author Gilbert Perrin (gilbert.perrin@gmail.com) 
* @year 2013
*/

// this file ties everything together

var IAS = IAS || {};
IAS.app = (function(){

        // IAS app module
        var app = {};

        // reference to the IAS domain model
        var model = IAS.model; 

        // reference to the IAS graph model
		var graph = IAS.graph; 

        // log wrapper
        var log = log || function(){
            if(console && console.log)
              console.log.apply(console, arguments);
        }

        




        //
        // All graphic components.
        //
        var worldmap = graph.map(app);

        var legend = graph.legend();
        
        var networkSelector = graph.networkSelector();

        var titles = graph.informationPanel();
        
        var components = [worldmap, legend, networkSelector, titles];



        //
        // Load resources.
        //
        app.load = function(){
            queue()
                .defer(d3.json, "/ias/data/world-countries.json")
                .defer(d3.json, "/ias/data/centroids.json")
                .defer(d3.json, "/ias/data/ias-db.json")
                .defer(d3.csv, "/ias/data/hiv-prevalence-rate.csv")
                .await(ready);
        };

        


        //
        // Ready function
        //
        function ready(error, world, centroids, iasdb, hivrates) {

            if(error) log(error);

            // init IAS domain
            model.init(world, iasdb, hivrates);

            // init IAS graph model
   			graph.init(centroids);

            

            log(IAS);

            // draw D3 components
            components.forEach(function(c){
                  c.draw();
            });

            refresh();

           
             
        }


        //
        //
        //
        app.onCountry = function(country){
        	titles.onCountry(country);
        }

        //
        //
        //
        function onCohort(cohort){

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

        return app;


})();


//////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

// launch IAS app
IAS.app.load();





