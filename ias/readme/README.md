# Overview

Project for IAS (Internation AIDS Society).

Implement a web interactive map that could be a quick way of viewing where the different cohorts are located around the world.

The project is hosted by [github](github.com) in a private repository. ([email me](mailto:gilbert.perrin@gmail.com) for a read/write access to the repository.)

# Technical Presentation

Project is built with [Grunt](http://gruntjs.com/).

todo ...

# Data
- Geographic Map: 
 - format: GeoJson 
 - country code: [ISO 3166-1 Alpha-3](http://countrycodes.co/country-codes/iso-3166-1-alpha-3/)

# Browser Support

todo ...

# Distribution

**dist** directory contains all releases.

    dist
    |--+ 0.9.1    // latest release version
       |-- index.html       // <--- html development page
       |-- style.css
       |--+ readme
       |--+ test
       |--+ iasapp          // <--- IAS app
          |-- ias-0.9.1.js      // ias javascript file 
          |-- ias-0.9.1.min.js  // ias minified javascript file 
          |-- map.css               // css for html elements
          |-- mapsvg.css            // css for svg elements
          |-- map.html              // ias graph html page (svg map + html filter panel)
          |-- ias-config.json       // ias configuration file
          |--+ images               // image resources
          |--+ lib                  // javascript dependency files
          |--+ data                 // data files
             |-- centroids.json           // GeoJson modified state centroids
             |-- hiv-prevalence-rate.csv  // to be replaced by an AJAX call
             |-- arv-coverage-rate.csv  // to be replaced by an AJAX call
             |-- ias-cohorts.json         // to be replaced by an AJAX call
             |-- ias-networks.json        // to be replaced by an AJAX call
             |-- world-countries.json     // GeoJSON worl map
      
           
# Links


* Internationl AIDS Society: [www.iasociety.org](www.iasociety.org)
* D3.js [www.d3js.org](www.d3js.org)
* D3 - Queue.js [https://github.com/mbostock/queue](https://github.com/mbostock/queue)
* Colorbrewer [www.colorbrewer2.org/](www.colorbrewer2.org/)
* Grunt [http://gruntjs.com/](http://gruntjs.com/)

# Specifications v1 (by Carina Sorensen)

CIPHER Interactive Map of Cohorts (by carina.sorensen@iasociety.org)

The interactive map should be a quick way of viewing where the different cohorts are located around the world. The map will consist of the following elements:

### 1. A static map displaying HIV prevalence rate by country

  (the intensity of a colour demonstrates the range of HIV prevalence). An example is available at http://www.unaids.org/en/dataanalysis/datatools/aidsinfo/. If possible, it should be possible to filter for an additional layer displaying ARV treatment coverage rate. Example: http://www.who.int/hiv/facts/ARVcov05web.jpg

### 2. A mouse-over effect over each country will display a text-box containing the following information:

  * Name of country
  * HIV prevalence rate
  * ARV treatment coverage rate
  * Names of cohorts that exist in that country (clicking on the cohort title will display another text-box with brief information about that cohort – see below).
  
Clicking on the country will zoom in on that country.

### 3. Each cohort is represented by a pin, where the size of the pin depends on the size of the cohort. 
  The cohort is placed in the center of the country it represents. Since some cohorts have subjects in different countries, each cohort will be represented by a unique colour. In the case of where a cohort spans across multiple countries, identical pins are placed in the respective countries and a mouse-over effect will make all pins that belong to the same cohort ‘light up’ with visible links tying them together.
  There should be filtering options (you can select multiple criteria), as listed below:
  
* Age group of subjects
  * Children (0 to 10 years old)
  * Adolescents (10 to 19 years old)
  * Adults (19+)
* Status of subjects
  * perinatally infected
  * behaviourally infected
  * HIV-exposed and uninfected
  * infected through other routes.
* Enrollment status
  * Ongoing
  * Closed
* Network (the name and the number of networks may change! We may also want a filter for sub-networks.)
  * EuroCoord
  * IeDEA
  * PHACS

Once having zoomed in a country, both a mouse-over effect or clicking on the cohort will display a text-box with brief information, including:

* Cohort title
* Country(ies) the cohort is located in
* Size of cohort
* A hyperlinked option to ‘View full profile’ of the cohort (clicking on the hyperlink will lead to profile page of the cohort).
* A separate graph displaying both the age groups included in the cohort as well as the HIV status of subjects (if this information is available for that particular cohort).
