//
// ---------------------------------
// IAS (International AIDS Society) 
// ---------------------------------
//
//
// @author Gilbert Perrin (gilbert.perrin@gmail.com) 
// @year 2013
var IAS = IAS || {};
IAS.filter = (function () {
    "use strict";

    var that        = {},
        listeners   = [],
        years       = [],
        log         = IAS.log,
        config      = IAS.config,
        y;

    that.backgroundInfo     = "";
    that.year               = 1980;
    that.viewCountryPins    = false;
    that.viewCohortPins     = true;
    that.networks           = {};

    for (y = 1980; y <= 2013; y++) {
        years.push(y);
    }


    //
    //
    //
    that.addListener = function (listener) {

        // TODO test for filterUpdate function
        listeners.push(listener);

    };

    //
    //
    //
    function dispatchFilterEvent() {

        //log(IAS);

        listeners.forEach(function (l) {
            l.filterUpdate();
        });

    }


    //
    // Background Information Option
    //
    d3.select("#backgroundInfo").on("change", function (d) {
        var v = this.options[this.selectedIndex].value;
        that.backgroundInfo = v;
        dispatchFilterEvent();
    });

    //
    // Filtering Options
    //
    d3.select("#year")
        .on("change", function (y) {
            that.year = parseInt(this.options[this.selectedIndex].value);
            dispatchFilterEvent();
        })
        .selectAll("option")
        .data(years).enter()
        .append("option")
        .attr("value", function (d) {return d; })
        .text(function (d) {return d; });

    //
    // View Options
    //
    d3.select("#viewCountryPins")
        .on("click", function (d) {
            that.viewCountryPins = this.checked;
            dispatchFilterEvent();
        });

    d3.select("#viewCohortPins")
        .attr("checked", true)
        .on("click", function (d) {
            that.viewCohortPins = this.checked;
            dispatchFilterEvent();
        });

    //
    // INIT FUNCTION
    //
    that.init = function (networksJson) {

        var n = networksJson.networks,
                data, nodeEnter;

         //
        function getClass(network, networkParent) {
            var code = network.code;
            if (code === "EuroCoord" || code === "IeDEA" || code === "Other") {
                return "network";
            }
            return "network " + networkParent;
        }

        //
        function color(code, parentNetwork) {
            if (code === "EuroCoord" || code === "IeDEA" || code === "Other") {
                return "white";
            }
            return config.networkColors.getColor(code, parentNetwork);
        }

        //
        function click(input, network) {
            var code = network.code;
            if (code === "EuroCoord" || code === "IeDEA" || code === "Other") {
                d3.selectAll("input.network." + code).each(function(n) {
                    d3.select(this).property("checked", input.checked);
                    that.networks[n.code] = input.checked;
                });
            } else {
                that.networks[code] = input.checked;
            }
            dispatchFilterEvent();
        }

        //
        ["EuroCoord", "IeDEA", "Other"].forEach(function (d, index) {

            data = n[index].children;
            data.forEach(function(d) {
                that.networks[d.code] = true;
            });
            data.unshift({code: d, name: d});
            nodeEnter = d3.select("#" + d).selectAll("div")
                            .data(data)
                            .enter().append("div");

            nodeEnter.append("input")
                .attr("checked", true)
                .attr("class", function (v) {return getClass(v, d); })
                .attr("type", "checkbox")
                .attr("id", function (d) {return 'n' + d.code; })
                .on("click", function (v) {return click(this, v); });

            nodeEnter.append("span")
                .attr("class", "network")
                .style("background", function (v) {return color(v.code, d); })
                .text("  ");

            nodeEnter.append("label")
                .attr("class", function (v) {return d === v.code ? "network title" : "network"; })
                .attr("for", function (d) {return 'n' + d.code; })
                .text(function (d) {return d.name; });

            if (d !== "Other"){
                nodeEnter.append("br");
            }

        });

    };

    return that;

})();