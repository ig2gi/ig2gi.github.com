/*jshint globalstrict: true*/
/**
 * @author gilbert perrin
 * @email gilbert.perrin@gmail.com
 * @create date 2019-07-27 16:22:16
 * @modify date 2019-07-27 16:22:51
 * @desc [description]
 */

/* global d3, mapboxgl*/

'use strict';

import * as tmdata from './tm-data.js';
import transports from "./transports.js";


(function () {

	const color = d3.scaleOrdinal()
		.range(['#d53e4f', '#fc8d59', '#fee08b', '#e6f598', '#99d594', '#3288bd'])
		.domain([3, 1, 9, 6, 2, 7]);

	mapboxgl.accessToken = 'pk.eyJ1IjoiaWcyZ2kiLCJhIjoiY2p4ZWV1c3k1MDBzZTNvbWswY2lqaGN1MiJ9.H9hZekY1m60zUcta8_-gKw';

	const newMap = (style) => {
		return new mapboxgl.Map({
			container: 'map',
			minZoom: 1,
			maxZoom: 20,
			zoom: 2,
			center: [-74.50, 40], // starting position [lng, lat]
			style: 'mapbox://styles/' + style
		});
	};

	let map = newMap("mapbox/light-v9");


	const onData = (spots) => {

		// spot features
		const spotFeatures = tmdata.spotsToFeatures(spots);
		const sourceSpots = {
			type: "geojson",
			data: {
				type: "FeatureCollection",
				features: spotFeatures
			}
		};
		const layerSpots = {
			id: "point",
			source: sourceSpots,
			type: "circle",
			paint: {
				'circle-radius': {
					'base': 8,
					'stops': [
						[3, 6],
						[9, 4]
					]
				},
				'circle-color': ['get', 'color'],
				"circle-stroke-width": 1,
				"circle-stroke-color": "#000"
			}

		};

		const routes = tmdata.getRoutes(spots);
		const routeLayers = tmdata.routesToFeatures(routes);

		const addLayers = () => {
			// routes
			routeLayers.forEach(r => map.addLayer(r));
			// spots
			map.addLayer(layerSpots);
		};

		map.on('load', addLayers);

		d3.select("#style").on("change", () => {

			const newStyle = d3.select('select').property('value');
			// TODO: keep zoom & center to re-apply on the new map 
			map = newMap(newStyle);
			map.on('load', addLayers);
		});

		const arc2 = d3.arc()
			.innerRadius(0)
			.outerRadius(6)
			.startAngle(0)
			.endAngle(Math.PI);

		const arc1 = d3.arc()
			.innerRadius(0)
			.outerRadius(6)
			.startAngle(Math.PI)
			.endAngle(2 * Math.PI);


		const container = map.getCanvasContainer();
		const height = 190;

		const width = document.getElementById("map").clientWidth;
		const svg = d3
			.select(container)
			.append("div")
			.classed("svg-container", true)
			.append("svg")
			.classed("svg-content", true)
			.attr("id", "visu")
			.attr("preserveAspectRatio", "xMinYMax meet")
			.attr("viewBox", `0 0 ${width} ${height}`)
			.style("z-index", 2);



		const legend = d3.select("#legend");
		legend.selectAll("img")
			.data(Object.values(transports).sort((a, b) => a.order - b.order))
			.enter()
			.append("img")
			.classed("transport", true)
			.attr("src", d => `images/transport-${d.id}.svg`)
			.attr("height", 25);


		const timeline = svg.append("g")
			.attr("transform", `translate(${20}, ${height - 80})`)
			.classed("timeline", true);

		const dates = d3.extent(spots.map(d => d.date));
		const x = d3.scaleTime().range([0, width - 40]).domain(dates);
		const xAxis = d3.axisBottom(x).tickFormat(d3.timeFormat("%b %Y")); //.tickValues(lineData.map(d=>d.date));


		timeline.append("g")
			.attr("class", "x axis")
			.call(xAxis);

		const yTransport = (d) => {
			switch (d.id_transport) {
				case 3:
					return -50;
				case 7:
					return -35;
			}
			return -20;
		};

		const gSpot = timeline.selectAll("g.spot")
			.data(spots)
			.enter()
			.append("g")
			.classed("spot", true)
			.attr("id", (d, i) => "spot" + i)
			.classed("fixed", (d, i) => i % 7 === 0)
			.attr("transform", d => `translate(${x(d.date)}, ${yTransport(d)})`);

		gSpot.append("line")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", d => -yTransport(d))
			.classed("pin", true);

		gSpot.append("line")
			.attr("x1", 0)
			.attr("y1", 0)
			.attr("x2", 0)
			.attr("y2", d => -100 - yTransport(d))
			.classed("spotline", true);


		gSpot.append("circle")
			.attr("cx", 0)
			.attr("cy", 0)
			.attr("r", 6);

		gSpot.append("path")
			.style("fill", d => d.color2)
			.attr("d", arc2);

		gSpot.append("path")
			.style("fill", d => d.color1)
			.attr("d", arc1);


		gSpot.append("text")
			.attr("y", d => -70 - yTransport(d))
			.style("text-anchor", (d, i) => i === 0 ? "start" : "end") // TODO: handle more properly the display of kms on the right
			.classed("day", true)
			.text(d => d.day);

		gSpot.append("text")
			.attr("y", d => -70 - yTransport(d))
			.attr("dy", "-1em")
			.style("text-anchor", (d, i) => i === 0 ? "start" : "end") // TODO: handle more properly the display of kms on the right
			.classed("km", true)
			.text(d => d.km + "km");

		gSpot.append("text")
			.attr("y", d => -70 - yTransport(d))
			.attr("dy", "-2em")
			.style("text-anchor", (d, i) => i === 0 ? "start" : "end") // TODO: handle more properly the display of kms on the right
			.text(d => d.city);




		gSpot.on("click", (d) => {
			map.flyTo({
				center: [d.lon, d.lat],
				zoom: 5
			});
		});

		const gRoute = timeline.selectAll("g.route")
			.data(routes)
			.enter()
			.append("g")
			.classed("route", true);

		gRoute.append("line")
			.attr("x1", d => x(d.dates[0]))
			.attr("y1", 25)
			.attr("x2", d => x(d.dates[1]))
			.attr("y2", 25)
			.style("stroke", d => d.color);

		const countries = tmdata.getCountries(spots);
		const gCountry = timeline.selectAll("g.country")
			.data(countries)
			.enter()
			.append("g")
			.classed("country", true);

		gCountry.append("line")
			.attr("x1", d => x(d.dates[0]))
			.attr("y1", 0)
			.attr("x2", d => x(d.dates[0]))
			.attr("y2", 60);


		gCountry.append("image")
			.attr("x", d => x(d.dates[0]) - 10)
			.attr("y", 40)
			.attr("width", 20)
			.attr("xlink:href", d => d.image);

		gCountry.append("text")
			.attr("x", d => x(d.dates[0]))
			.attr("y", 60)
			.attr("dy", "1em")
			.attr("dx", (d, i) => i === countries.length - 1 ? "1em" : "-1em")
			.style("text-anchor", (d, i) => i === countries.length - 1 ? "end" : "start") // TODO: handle more properly the display of kms on the right
			.text(d => d.name);



		const lastSpot = spots.slice(-1)[0];
		d3.select("#totalkm").html(lastSpot.km + " kms in " + lastSpot.day + " days");

	};

	tmdata.getData("./data/spots.json", color)
		.then(onData);



})();