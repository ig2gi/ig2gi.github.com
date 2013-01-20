//
// ---------------------------------
// IAS (International AIDS Society) 
// ---------------------------------
// This file ties everything together.
//
// @author Gilbert Perrin (gilbert.perrin@gmail.com) 
// @year 2013
//
IAS.app = (function () {
    "use strict";

    var that    = {},
        model   = IAS.model,
        graph   = IAS.graph,
        filter  = IAS.filter,
        log     = IAS.log;


    //
    // Refresh:
    //
    function refresh() {

        // update D3 components
        graph.components.forEach(function (c) {
            c.update();
        });

    }

    //
    // Ready function
    //
    function ready(error, world, centroids, networks, cohorts, hivrates) {

        if (error) {
            log(error);
        }

        // init IAS modules
        filter.init(networks);
        model.init(world, networks, cohorts, hivrates);
        graph.init(centroids);

        // draw D3 components
        graph.components.forEach(function (c) {
            c.draw();
        });

        refresh();

    }



    //
    // Load resources.
    //
    that.load = function () {

        queue().defer(d3.json, "/ias/data/world-countries.json")
            .defer(d3.json, "/ias/data/centroids.json")
            .defer(d3.json, "/ias/data/ias-networks.json")
            .defer(d3.json, "/ias/data/ias-cohorts.json")
            .defer(d3.csv, "/ias/data/hiv-prevalence-rate.csv")
            .await(ready);

    };

    return that;

})();

// launch IAS app
IAS.app.load();