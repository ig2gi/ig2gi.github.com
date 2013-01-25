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
        util        = IAS.util,
        config      = {},
        y;

    that.backgroundInfo     = "";
    that.year               = 1980;
    that.viewCountryPins    = false;
    that.viewCohortPins     = true;
    that.networks           = {};
    that.enrollmentStatus   = "All";

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
    // INIT FUNCTION
    //
    that.init = function (networksJson) {

        config = IAS.util.config;

        var n = networksJson.networks,
            data,
            nodeEnter;

        d3.select("#status")
            .on("change", function (y) {
                that.enrollmentStatus = this.options[this.selectedIndex].value;
                dispatchFilterEvent();
            })
            .selectAll("option")
            .data(config.filter.status)
            .enter()
            .append("option")
            .attr("value", function (d) {return d; })
            .text(function (d) {return d; });


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
            return util.networkColor.getColor(code, parentNetwork);
        }

        //
        function click(input, network) {
            var code = network.code;
            if (code === "EuroCoord" || code === "IeDEA" || code === "Other") {
                d3.selectAll("input.network." + code).each(function (n) {
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
            data.forEach(function (d) {
                that.networks[d.code] = true;
            });
            data.unshift({code: d, name: d});
            nodeEnter = d3.select("#" + d).selectAll("div")
                        .data(data)
                        .enter()
                        .append("div")
                        .attr("class", function (v) {return d !== v.code ? "subnetwork" : "network"; });

            nodeEnter.append("input")
                .attr("checked", true)
                .attr("class", function (v) {return getClass(v, d); })
                .attr("type", "checkbox")
                .attr("id", function (d) {return 'n' + d.code; })
                .on("click", function (v) {return click(this, v); });

            nodeEnter.append("span")
                .attr("class", "network")
                .style("background", function (v) {return color(v.code, d); })
                .style("color", function (v) {return color(v.code, d); })
                .text('\u0020.\u0020');

            nodeEnter.append("label")
                .attr("class", function (v) {return d === v.code ? "network title" : "network"; })
                .attr("for", function (d) {return 'n' + d.code; })
                .text(function (d) {return d.name; });

            if (d !== "Other") {
                nodeEnter.append("br");
            }

        });

    };

    return that;

})();