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
        util    = IAS.util,
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
    function ready(error, configuration, world, centroids, networks, cohorts, hivrates) {

        if (error) {
            log(error);
        }

        // init IAS modules
        util.init(configuration);
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

        queue().defer(d3.json, "/ias/v0.3/ias-config.json")
            .defer(d3.json, "/ias/v0.3/data/world-countries.json")
            .defer(d3.json, "/ias/v0.3/data/centroids.json")
            .defer(d3.json, "/ias/v0.3/data/ias-networks.json")
            .defer(d3.json, "/ias/v0.3/data/ias-cohorts.json")
            .defer(d3.csv, "/ias/v0.3/data/hiv-prevalence-rate.csv")
            .await(ready);

    };

    return that;

})();

// launch IAS app
IAS.app.load();