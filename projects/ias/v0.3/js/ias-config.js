//
// ---------------------------------
// IAS (International AIDS Society) 
// ---------------------------------
//
//
// @author Gilbert Perrin (gilbert.perrin@gmail.com) 
// @year 2013
var IAS = {};

// log wrapper
IAS.log = function () {
    if (console && console.log) {
        console.log.apply(console, arguments);
    }
};

// config
IAS.config = (function () {
    "use strict";

    var that        = {"static": {}};

    that.init = function (config) {

        that.static = config;
        IAS.log(that);

    };

    //
    // Network Color Schemes
    //
    that.networkColors = {};
    that.networkColors = function () {

        var colors = {},
            scheme1 = d3.scale.ordinal()
                .range(colorbrewer.Greens[6]),
            scheme2 = d3.scale.ordinal()
                .range(colorbrewer.Purples[6]),
            scheme3 = d3.scale.ordinal()
                .range(colorbrewer.Blues[6]);

        //
        function getColor(code, parent) {
            if (colors.hasOwnProperty(code)) {
                return colors[code];
            }
            var s;
            if (parent === "EuroCoord") {
                s = scheme1;
            } else if (parent === "IeDEA") {
                s = scheme2;
            } else {
                s = scheme3;
            }
            colors[code] = s(code);
            return colors[code];
        }

        //
        function get(code) {
            if (colors.hasOwnProperty(code)) {
                return colors[code];
            }
            colors[code] = scheme3(code);
            return colors[code];
        }

        return {
            getColor: getColor,
            get: get
        };

    };

    //
    // Background Color Scheme
    //
    that.mapColors = function () {
        return d3.scale.quantile()
                    .domain([0, 26])
                    .range(colorbrewer[that.map.background.scheme][that.map.background.maxColors]);
    };

    return that;

})();

