/*jshint globalstrict: true*/
/**
 * @author gilbert perrin
 * @email gilbert.perrin@gmail.com
 * @create date 2019-07-27 16:36:02
 * @modify date 2019-07-27 16:36:02
 * @desc [description]
 */

/* global polyline, d3 , moment */
"use strict";


import countries from "./countries.js";
import transports from "./transports.js";



export const spotsToFeatures = (spots) => {
    const features = [];
    spots.forEach(s => {
        const f = {
            type: "Feature",
            properties: {
                description: s.comment,
                city: s.city,
                date: s.date,
                countryId: s.id_country,
                transport: s.id_transport,
                km: s.km,
                posts: s.posts,
                color: s.color1
            },
            geometry: {
                type: "Point",
                coordinates: [s.lon, s.lat]
            }
        };
        features.push(f);
    });
    return features;
};

const getCoordinates = (trace) => {
    if (!trace)
        return [];
    const arr = polyline.decode(trace);
    return arr.map(a => a.reverse());
};

// travel map spots date format
const parseTime = d3.timeParse("%Y-%m-%d %H:%M:%S");

/**
 *
 *
 * @returns spots Promise
 */

export const getData = (location, colorScale) => {
    return d3.json(location).then(data => {
        // 
        data.sort((a, b) => parseTime(a.date) < parseTime(b.date));
        let startDate = parseTime(data[0].date);
        data.forEach((s, i) => {
            s.dateStr = s.date;
            s.date = parseTime(s.date);
            if (colorScale) {
                s.color2 = i < (data.length - 1) ? colorScale(data[i + 1].id_transport) : "dimgray";
                s.color1 = colorScale(s.id_transport);
            }
            let a = moment(startDate);
            let b = moment(s.date);
            s.day = b.diff(a, 'days'); // 1
        });
        //
        return data;
    });
};


const newRouteFeature = (route) => {
    return {
        id: route.id,
        type: "line",
        source: {
            type: "geojson",
            data: {
                type: "Feature",
                properties: {
                    transport: route.id_transport,
                    name: route.name
                },
                geometry: {
                    type: "LineString",
                    coordinates: route.coordinates
                }
            }
        },
        layout: {
            "line-join": "round",
            "line-cap": "round"
        },
        paint: {
            "line-color": route.color,
            "line-width": 4,
            "line-dasharray": route.id_transport === 3 || route.id_transport === 7 ? [0.25, 2] : [1]
        }
    };
};

/**
 *
 *
 * @param {*} spots
 * @returns
 */
export const getCountries = (spots) => {
    const result = [];
    const newCountry = (spot) => {
        let c = {
            dates: [spot.date]
        };
        c = Object.assign(c, findCountry(spot.id_country));
        c.spot0 = spot;
        let countryName = c.name.toLowerCase().replace(/ /g , "-");
        c.image = `images/countries/${countryName}.svg`;
        result.push(c);
        return c;
    };
    let country = newCountry(spots[0]);
    for (let i = 1; i < spots.length; i++) {
        if (!country || country.id !== spots[i].id_country) {
            country.dates.push(spots[i - 1].date);
            country = newCountry(spots[i]);
        }
    }
    let last = result.slice(-1)[0];
    last.dates.push(last.dates[0]);
    return result;
};

const findCountry = (countryCode) => {
    return countries.filter(d => d.id === countryCode)[0];
};


/**
 *
 *
 * @param {*} spots
 * @returns
 */
export const getRoutes = (spots) => {
    const routes = [];
    let r; // current route
    let km = 0; // total km
    spots[0].km = km; // initialize km0 for the first spot
    for (let i = 1; i < spots.length; i++) {
        let from = spots[i - 1];
        let to = spots[i];
        // create new route if necessary
        if (!r || to.id_transport !== r.id_transport) {
            if (r) {
                r.dates.push(from.date);
            }
            r = {
                id: "route" + i,
                id_transport: to.id_transport,
                coordinates: [],
                color: to.color1,
                name: transports[to.id_transport].name,
                dates: [from.date]
            };
            routes.push(r);
        }
        if (to.trace) {
            r.coordinates = r.coordinates.concat(getCoordinates(to.trace));
        } else {
            r.coordinates.push([from.lon, from.lat]);
            r.coordinates.push([to.lon, to.lat]);
        }
        //
        km += distance2([from.lon, from.lat], [to.lon, to.lat]);
        to.km = km;
        if (i === spots.length - 1) {
            r.dates[1] = to.date;
        }
    }
    return routes;

};
/**
 *
 *
 * @param {*} routes
 * @returns
 */
export const routesToFeatures = (routes) => {
    return routes.map(r => newRouteFeature(r));
};

/**
 * Returns the distance (in km) between 2 points.
 *
 * @param {*} lat1
 * @param {*} lon1
 * @param {*} lat2
 * @param {*} lon2
 * @returns
 */
function distance(lat1, lon1, lat2, lon2) {
    const R = 6371; // km (change this constant to get miles)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;
    return Math.round(d);
}
/**
 * coord: Array [longitude, latitude]
 *
 * @param {*} coord1
 * @param {*} coord2
 * @returns
 */
function distance2(coord1, coord2) {
    return distance(coord1[1], coord1[0], coord2[1], coord2[0]);
}