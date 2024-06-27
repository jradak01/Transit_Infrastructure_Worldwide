const sizes = {
    barchart: { width: window.innerWidth * 0.54, height: 400 },
    smallBarchart: { width: window.innerWidth * 0.3, height: 260 },
    groupedBarchart: { width: window.innerWidth * 0.9, height: 460 },
    smallGroupedBarchart: { width: window.innerWidth * 0.32, height: 260 },
    piechart: 260,
    largePiechart: 400,
    smallPiechart: 160,
    circle: 180,
    scatterplot: { width: window.innerWidth * 0.9, height: 460 }

}

// charts

async function loadCircles() {
    const { cities, stations, lines, tracks, systems } = await getData(['cities', 'stations', 'lines', 'tracks', 'systems'])
    const mergedDataCitiesTracks = mergeDataByCity(cities, tracks, 'tracks', true)
    let citiesNew = cities.filter(city => {
        const hasTracks = mergedDataCitiesTracks.some(d => d.id === city.id && d.tracks.length > 0);
        return hasTracks;
    });
    const uniqueCities = uniqueElements(citiesNew, 'id').size
    const uniqueCountries = uniqueElements(citiesNew, 'country').size
    const uniqueStations = uniqueElements(stations, 'id').size
    const uniqueLines = uniqueElements(lines, 'id').size
    const uniqueTracks = uniqueElements(tracks, 'id').size
    const uniqueSystems = uniqueElements(systems, 'id').size
    createCircle("#circle-cities", uniqueCities, colorPalette.purple,
        textBefore = "Contains data from", textAfter = "cities", sizes.circle, sizes.circle)
    createCircle("#circle-countries", uniqueCountries, colorPalette.purple,
        textBefore = "Contains data from", textAfter = "countries", sizes.circle, sizes.circle)
    createCircle("#circle-systems", uniqueSystems, colorPalette.purple,
        textBefore = "Contains", textAfter = "systems", sizes.circle, sizes.circle)
    createCircle("#circle-lines", uniqueLines, colorPalette.purple,
        textBefore = "Contains", textAfter = "lines", sizes.circle, sizes.circle)
    createCircle("#circle-tracks", uniqueTracks, colorPalette.purple,
        textBefore = "Contains", textAfter = "tracks", sizes.circle, sizes.circle)
    createCircle("#circle-stations", uniqueStations, colorPalette.purple,
        textBefore = "Contains", textAfter = "stations", sizes.circle, sizes.circle)
}

async function loadText() {
    const { cities, stations, lines, tracks, systems } = await getData(['cities', 'stations', 'lines', 'tracks', 'systems'])
    const uniqueCities = uniqueElements(cities, 'id').size
    const uniqueCountries = uniqueElements(cities, 'country').size
    const uniqueStations = uniqueElements(stations, 'id').size
    const uniqueLines = uniqueElements(lines, 'id').size
    const uniqueTracks = uniqueElements(tracks, 'id').size
    const uniqueSystems = uniqueElements(systems, 'id').size
    createDiv(`${uniqueCities} cities`, 'smallText1')
    createDiv(`${uniqueCountries} countries`, 'smallText2')
    createDiv(`${uniqueSystems} systems`, 'smallText3')
    createDiv(`${uniqueLines} lines`, 'smallText4')
    createDiv(`${uniqueTracks} tracks`, 'smallText5')
    createDiv(`${uniqueStations} stations`, 'smallText6')
}

async function loadBarcharts() {
    const { cities, systems } = await getData(['cities', 'systems'])
    let mergedDataCitySystems = mergeDataByCity(cities, systems, 'systems', true)
    let mergedDataCountrySystems = mergeDataByCountry(cities, systems, 'systems', true)
    mergedDataCitySystems = sliceData(countDataByGroupedAttribute(mergedDataCitySystems, 'systems'), 15)
    mergedDataCountrySystems = sliceData(countDataByGroupedAttribute(mergedDataCountrySystems, 'systems'), 15)
    const colors = {
        startColor: colorPalette.purple,
        endColor: colorPalette.orange,
    }
    createBarChart(d => d.name, d => d.systems_count, "#smallBar1", mergedDataCitySystems, 'Top 5 cities by number of systems',
        'City', 'Number of systems', sizes.smallBarchart.width, sizes.smallBarchart.height, colors, false, false, 5)
    createBarChart(d => d.country, d => d.systems_count, "#smallBar2", mergedDataCountrySystems, 'Top 5 countries by number of systems',
        'Country', 'Number of systems', sizes.smallBarchart.width, sizes.smallBarchart.height, colors, false, false, 5)

    createBarChart(d => d.name, d => d.systems_count, "#citySystems-barchart", mergedDataCitySystems, 'Top 15 cities by number of systems',
        'City', 'Number of systems', sizes.barchart.width, sizes.barchart.height, colors, false, false, 15)
    createBarChart(d => d.country, d => d.systems_count, "#countrySystems-barchart", mergedDataCountrySystems, 'Top 15 countries by number of systems',
        'Country', 'Number of systems', sizes.barchart.width, sizes.barchart.height, colors, false, false, 15)
}

async function loadGroupedBarchart() {
    const { cities, lines, tracks, stations, trackLines } = await getData(['cities', 'lines', 'tracks', 'stations', 'trackLines'])
    let linesData = sumData(mapData(lines, tracks, trackLines, 'line_id', 'section_id', 'tracks'), 'length', 'tracks', true)
    const mergedDataCitiesLines = mergeDataByCity(cities, linesData, 'lines', true)
    const mergedDataCitiesTracks = mergeDataByCity(cities, tracks, 'tracks', true)
    const mergedDataCitiesStations = mergeDataByCity(cities, stations, 'stations', true)
    let concatenatedCityData = concatenateData([mergedDataCitiesLines, mergedDataCitiesTracks,
        mergedDataCitiesStations], ['tracks', 'stations'], 'id')
    concatenatedCityData = countDataByGroupedAttribute(concatenatedCityData, 'lines')
    concatenatedCityData = countDataByGroupedAttribute(concatenatedCityData, 'stations')
    concatenatedCityData = countDataByGroupedAttribute(concatenatedCityData, 'tracks')
    concatenatedCityData = sumValues(concatenatedCityData, ['lines_count', 'stations_count', 'tracks_count'])
    concatenatedCityData = sortByAttribute(concatenatedCityData, 'sum')
    concatenatedCityData = removeEmptyData(concatenatedCityData, 'sum')
    // count data for countries
    const mergedDataCountriesLines = mergeDataByCountry(cities, linesData, 'lines', true)
    const mergedDataCountriesTracks = mergeDataByCountry(cities, tracks, 'tracks', true)
    const mergedDataCountriesStations = mergeDataByCountry(cities, stations, 'stations', true)
    let concatenatedCountryData = concatenateData([mergedDataCountriesLines, mergedDataCountriesTracks,
        mergedDataCountriesStations], ['tracks', 'stations'], 'country');
    concatenatedCountryData = countDataByGroupedAttribute(concatenatedCountryData, 'lines')
    concatenatedCountryData = countDataByGroupedAttribute(concatenatedCountryData, 'stations')
    concatenatedCountryData = countDataByGroupedAttribute(concatenatedCountryData, 'tracks')
    concatenatedCountryData = sumValues(concatenatedCountryData, ['lines_count', 'stations_count', 'tracks_count'])
    concatenatedCountryData = sortByAttribute(concatenatedCountryData, 'sum')
    concatenatedCountryData = removeEmptyData(concatenatedCountryData, 'lines_count')
    concatenatedCountryData = removeEmptyData(concatenatedCountryData, 'stations_count')
    concatenatedCountryData = removeEmptyData(concatenatedCountryData, 'tracks_count')
    concatenatedCityData = sumData(concatenatedCityData, 'length', 'tracks', true)
    concatenatedCityData = sumData(concatenatedCityData, 'tracks_length', 'lines')
    concatenatedCountryData = sumData(concatenatedCountryData, 'length', 'tracks', true)
    concatenatedCountryData = sumData(concatenatedCountryData, 'tracks_length', 'lines')

    const colors = {
        start: [colorPalette.purple, colorPalette.blue, colorPalette.yellow],
        hover: colorPalette.orange
    }
    const subGroups = ["stations_count", "tracks_count", "lines_count"];
    const subGroupsLength = ["lines_tracks_length", "tracks_length"];
    
    createGroupedBarChart("#city-groupedBarChart", concatenatedCityData,
        "Top 15 cities by number of stations, lines and tracks", "City", "Count",
        sizes.groupedBarchart.width, sizes.groupedBarchart.height, colors, subGroups, 'name', false, 15);
    createGroupedBarChart("#country-groupedBarChart", concatenatedCountryData,
        "Top 15 countries by number of stations, lines and tracks", "Country", "Count",
        sizes.groupedBarchart.width, sizes.groupedBarchart.height, colors, subGroups, 'country', false, 15);
 
    createGroupedBarChart("#smallGBar1", sortByAttribute(concatenatedCityData, subGroupsLength[0]).slice(0, 5),
        "Top 5 cities by length of tracks and lines", "City", "Length (km)",
        sizes.smallGroupedBarchart.width, sizes.smallGroupedBarchart.height, colors, subGroupsLength, 'name', false, 5);
    createGroupedBarChart("#smallGBar2",  sortByAttribute(concatenatedCountryData, subGroupsLength[0]).slice(0, 5),
        "Top 5 countries by length of tracks and lines", "Country", "Length (km)",
        sizes.smallGroupedBarchart.width, sizes.smallGroupedBarchart.height, colors, subGroupsLength, 'country', false, 5);

    createGroupedBarChart("#cityLength-groupedBarChart", sortByAttribute(concatenatedCityData, subGroupsLength[0]),
        "Top 15 cities by length of tracks and lines", "City", "Length (km)",
        sizes.groupedBarchart.width, sizes.groupedBarchart.height, colors, subGroupsLength, 'name', false, 15);
    createGroupedBarChart("#countryLength-groupedBarChart", sortByAttribute(concatenatedCountryData, subGroupsLength[0]),
        "Top 15 countries by length of tracks and lines", "Country", "Length (km)",
        sizes.groupedBarchart.width, sizes.groupedBarchart.height, colors, subGroupsLength, 'country', false, 15);
    // add sum of lines and tracks
}

async function laodPieCharts(dashboard, patterns = false) {
    d3.select("#smallPie1").select("svg").remove();
    d3.select("#smallPie2").select("svg").remove();
    d3.select("#smallPie3").select("svg").remove();
    d3.select("#smallPie4").select("svg").remove();
    d3.select("#smallPie5").select("svg").remove();
    d3.select("#smallPie6").select("svg").remove();
    d3.select("#cityLines-pieChart").select("svg").remove();
    d3.select("#cityTracks-pieChart").select("svg").remove();
    d3.select("#cityStations-pieChart").select("svg").remove();
    d3.select("#countryLines-pieChart").select("svg").remove();
    d3.select("#countryTracks-pieChart").select("svg").remove();
    d3.select("#countryStations-pieChart").select("svg").remove();
    d3.select("#countrySystems-pieChart").select("svg").remove();
    d3.select("#citySystems-pieChart").select("svg").remove();
    const { cities, systems, lines, tracks, stations } = await getData(['cities', 'systems', 'lines', 'tracks', 'stations'])
    const colors = convertObjectToArray(colorPalette)

    let mergedDataCitiesLines = mergeDataByCity(cities, lines, 'lines', true)
    let mergedDataCitiesTracks = mergeDataByCity(cities, tracks, 'tracks', true)
    let mergedDataCitiesStations = mergeDataByCity(cities, stations, 'stations', true)
    let mergedDataCitySystems = mergeDataByCity(cities, systems, 'systems', true)

    mergedDataCitiesLines = countDataByGroupedAttribute(mergedDataCitiesLines, 'lines')
    mergedDataCitiesTracks = countDataByGroupedAttribute(mergedDataCitiesTracks, 'tracks')
    mergedDataCitiesStations = countDataByGroupedAttribute(mergedDataCitiesStations, 'stations')
    mergedDataCitySystems = countDataByGroupedAttribute(mergedDataCitySystems, 'systems')

    const totalLines = uniqueElements(lines, 'id').size
    mergedDataCitiesLines = countPercentage(mergedDataCitiesLines, 'lines_count', totalLines)

    const totalTracks = uniqueElements(tracks, 'id').size
    mergedDataCitiesTracks = countPercentage(mergedDataCitiesTracks, 'tracks_count', totalTracks)

    const totalStations = uniqueElements(stations, 'id').size
    mergedDataCitiesStations = countPercentage(mergedDataCitiesStations, 'stations_count', totalStations)

    const totalSystems = uniqueElements(systems, 'id').size
    mergedDataCitySystems = countPercentage(mergedDataCitySystems, 'systems_count', totalSystems)

    createPieChart(dashboard ? "#smallPie1" : '#cityLines-pieChart', mergedDataCitiesLines, 'lines_count_percentage', 'lines_count', 'name', colors,
        totalLines, false, false, dashboard ? 4 : 5, 'Cities by number of lines', dashboard ? sizes.smallPiechart : sizes.piechart,  dashboard? false : patterns)
    createPieChart(dashboard ? "#smallPie3" : '#cityTracks-pieChart', mergedDataCitiesTracks, 'tracks_count_percentage', 'tracks_count', 'name', colors,
        totalTracks, false, false, dashboard ? 4 : 5, 'Cities by number of tracks', dashboard ? sizes.smallPiechart : sizes.piechart,  dashboard? false : patterns)
    createPieChart(dashboard ? "#smallPie5" : '#cityStations-pieChart', mergedDataCitiesStations, 'stations_count_percentage', 'stations_count', 'name', colors,
        totalStations, false, false, dashboard ? 4 : 5, 'Cities by number of stations', dashboard ? sizes.smallPiechart : sizes.piechart,  dashboard? false : patterns)

    let mergedDataCountriesLines = mergeDataByCountry(cities, lines, 'lines', true)
    let mergedDataCountriesTracks = mergeDataByCountry(cities, tracks, 'tracks', true)
    let mergedDataCountriesStations = mergeDataByCountry(cities, stations, 'stations', true)
    let mergedDataCountrySystems = mergeDataByCountry(cities, systems, 'systems', true)

    mergedDataCountriesLines = countDataByGroupedAttribute(mergedDataCountriesLines, 'lines')
    mergedDataCountriesTracks = countDataByGroupedAttribute(mergedDataCountriesTracks, 'tracks')
    mergedDataCountriesStations = countDataByGroupedAttribute(mergedDataCountriesStations, 'stations')
    mergedDataCountrySystems = countDataByGroupedAttribute(mergedDataCountrySystems, 'systems')

    const totalLinesCountries = uniqueElements(lines, 'id').size
    mergedDataCountriesLines = countPercentage(mergedDataCountriesLines, 'lines_count', totalLinesCountries)

    const totalTracksCountries = uniqueElements(tracks, 'id').size
    mergedDataCountriesTracks = countPercentage(mergedDataCountriesTracks, 'tracks_count', totalTracksCountries)

    const totalStationsCountries = uniqueElements(stations, 'id').size
    mergedDataCountriesStations = countPercentage(mergedDataCountriesStations, 'stations_count', totalStationsCountries)

    const totalSystemsCountries = uniqueElements(systems, 'id').size
    mergedDataCountrySystems = countPercentage(mergedDataCountrySystems, 'systems_count', totalSystemsCountries)

    createPieChart(dashboard ? "#smallPie2" : '#countryLines-pieChart', mergedDataCountriesLines, 'lines_count_percentage', 'lines_count', 'country', colors,
        totalLinesCountries, false, false, dashboard ? 4 : 5, 'Countries by number of lines', dashboard ? sizes.smallPiechart : sizes.piechart, dashboard? false : patterns)
    createPieChart(dashboard ? "#smallPie4" : '#countryTracks-pieChart', mergedDataCountriesTracks, 'tracks_count_percentage', 'tracks_count', 'country', colors,
        totalTracksCountries, false, false, dashboard ? 4 : 5, 'Countries by number of tracks', dashboard ? sizes.smallPiechart : sizes.piechart, dashboard? false : patterns)
    createPieChart(dashboard ? "#smallPie6" : '#countryStations-pieChart', mergedDataCountriesStations, 'stations_count_percentage', 'stations_count', 'country', colors,
        totalStationsCountries, false, false, dashboard ? 4 : 5, 'Countries by number of stations', dashboard ? sizes.smallPiechart : sizes.piechart, dashboard? false : patterns)
    if (!dashboard) {
        createPieChart('#countrySystems-pieChart', mergedDataCountrySystems, 'systems_count_percentage', 'systems_count', 'country', colors,
            totalSystemsCountries, true, false, 5, 'Countries by number of systems', sizes.largePiechart, patterns)
        createPieChart('#citySystems-pieChart', mergedDataCitySystems, 'systems_count_percentage', 'systems_count', 'name', colors,
            totalSystems, true, false, 5, 'Cities by number of systems', sizes.largePiechart, patterns)

    }
}

async function LaodScatterPlot() {
    const { cities, systems, lines, tracks, stations, trackLines } = await getData(['cities', 'systems', 'lines', 'tracks', 'stations', 'trackLines'])
    let linesData = sumData(mapData(lines, tracks, trackLines, 'line_id', 'section_id', 'tracks'), 'length', 'tracks', true)
    
    const mergedDataCitiesLines = mergeDataByCity(cities, linesData, 'lines', true)
    const mergedDataCitiesTracks = mergeDataByCity(cities, tracks, 'tracks', true)
    const mergedDataCitiesStations = mergeDataByCity(cities, stations, 'stations', true)
    const mergeDataCitiesSystems = mergeDataByCity(cities, systems, 'systems', true)

    let concatenatedCityData = concatenateData([mergedDataCitiesLines, mergedDataCitiesTracks,
        mergedDataCitiesStations, mergeDataCitiesSystems], ['tracks', 'stations', 'systems'], 'id')

    concatenatedCityData = countDataByGroupedAttribute(concatenatedCityData, 'lines')
    concatenatedCityData = countDataByGroupedAttribute(concatenatedCityData, 'stations')
    concatenatedCityData = countDataByGroupedAttribute(concatenatedCityData, 'tracks')
    concatenatedCityData = countDataByGroupedAttribute(concatenatedCityData, 'systems')
    concatenatedCityData = sumData(concatenatedCityData, 'tracks_length', 'lines')
    concatenatedCityData = sumData(concatenatedCityData, 'tracks_length', 'lines')
    concatenatedCityData = removeEmptyData(concatenatedCityData, 'lines_count')
    concatenatedCityData = removeEmptyData(concatenatedCityData, 'stations_count')
    concatenatedCityData = removeEmptyData(concatenatedCityData, 'tracks_count')
    concatenatedCityData = removeEmptyData(concatenatedCityData, 'systems_count')
    const colors = {
        dot: colorPalette.purple,
        startInterpolate: colorPalette.purple,
        endInterpolate: colorPalette.blue,
        hover: colorPalette.orange
    }
    createScatterPlot('#scatterplot', concatenatedCityData, 'lines_count', 'lines_tracks_length',
        'stations_count', 'systems_count', [2, 12], colors, 'log', 'Number of lines', 'Lines lenght (km)',
        'Scatterplot of number of lines vs line lengths by city', 'Number of systems', 'Number of stations',
        sizes.scatterplot.width, sizes.scatterplot.height)
}

// other dynamic elemensts on index page

function showDashboardElements() {
    hide('world-map')
    hide('citySystems-pieChart')
    hide('countrySystems-pieChart')
    hide("cityLines-pieChart")
    hide("cityStations-pieChart")
    hide("countryLines-pieChart")
    hide("countryStations-pieChart")
    hide("cityTracks-pieChart")
    hide("countryTracks-pieChart")
    hide('city-groupedBarChart')
    hide('country-groupedBarChart')
    hide('scatterplot')
    hide("circle-countries")
    hide("circle-cities")
    hide("circle-systems")
    hide("circle-lines")
    hide("circle-stations")
    hide("circle-tracks")
    hide("info-data")
    hide("info-project")
    hide("citySystems-barchart")
    hide("countrySystems-barchart")
    hide("cityLength-groupedBarChart")
    hide("countryLength-groupedBarChart")
    hide("circles")
    show('dashboard-container')
}

function hideDashboardElements() {
    show('world-map')
    show('citySystems-pieChart')
    show('countrySystems-pieChart')
    show("cityLines-pieChart")
    show("cityStations-pieChart")
    show("countryLines-pieChart")
    show("countryStations-pieChart")
    show("cityTracks-pieChart")
    show("countryTracks-pieChart")
    show('city-groupedBarChart')
    show('country-groupedBarChart')
    show('scatterplot')
    show("citySystems-barchart")
    show("countrySystems-barchart")
    show("circle-countries")
    show("circle-cities")
    show("circle-systems")
    show("circle-lines")
    show("circle-stations")
    show("circle-tracks")
    show("info-data")
    show("info-project")
    show("cityLength-groupedBarChart")
    show("countryLength-groupedBarChart")
    show("circles")
    hide('dashboard-container')
}

// load

loadCircles()
LaodScatterPlot()
loadBarcharts()
loadGroupedBarchart()
loadText()
showWorldMap("#world-map", colorPalette.orange, colorPalette.purple, colorPalette.yellow, colorPalette.blue);

function togglePatterns() {
    const patternsToggle = document.getElementById('patternToggle');
    if (localStorage.getItem('patternToggle') === 'enabled') {
        patternsToggle.checked = true;
        localStorage.setItem('patternToggle', 'enabled');
        laodPieCharts(false, true)
        laodPieCharts(true, true)
    } else {
        patternsToggle.checked = false;
        localStorage.setItem('patternToggle', 'disabled');
        laodPieCharts(false, false)
        laodPieCharts(true, false)
    }
    patternsToggle.addEventListener('change', function () {
        if (patternsToggle.checked) {
            localStorage.setItem('patternToggle', 'enabled');
            laodPieCharts(false, true)
            laodPieCharts(true, true)
        } else {
            localStorage.setItem('patternToggle', 'disabled');
            laodPieCharts(false, false)
            laodPieCharts(true, false)
        }
    })
    
}

document.addEventListener('DOMContentLoaded', togglePatterns);

document.addEventListener('DOMContentLoaded', function() {
    createDynamicModal(`<strong>About World map</strong>\n\nOn this world map, all cities for which data is available are marked with dots.\n\n The cities are divided into three groups. <strong>The first group</strong> includes cities with fewer than 10 tracks to display on the map, they are marked with orange color and have smallest dot diameter. <strong>The second group</strong> has 10 to 100 tracks to display, they are marked with purple color and have medium dot diameter. <strong>The third group</strong> have more than 100 tracks, they are marked with yellow color and they have the largest dot diameter.\n\nHovering over any dot displays the city name and the number of tracks for that city. Clicking on an individual city opens a detailed view for that city.\n The map can also be zoomed in.`, 'world-map');
    createDynamicModal(`<strong>About circles</strong>\n\nThese circles display general information about the dataset, namely the total number of cities to be displayed, the countries where these cities are located, stations, lines, systems, and tracks.`, 'circles')
    createDynamicModal(`<strong>About number of systems by city barchart</strong>\n\nThis barchart shows the number of systems per city. It displays the top 15 cities with the highest number of available systems. Systems are sets of lines, stations, and tracks that constitute a single transportation unit.\n\nHovering over a bar displays the exact number of systems in that city.`, 'citySystems-barchart')
    createDynamicModal(`<strong>About number of systems by country barchart</strong>\n\nThis barchart shows the number of systems per country. It displays the top 15 countries with the highest number of available systems. Systems are sets of lines, stations, and tracks that constitute a single transportation unit.\n\nHovering over a bar displays the exact number of systems in that country.`, 'countrySystems-barchart')
    createDynamicModal(`<strong>About "Top 15 cities by number of stations, lines and tracks" grouped barchart</strong>\n\nThis grouped barchart shows the top 15 cities by the number of stations, tracks, and lines. The data is sorted by the total sum of all three values.\n\nHovering over one of the bars displays the exact values for that city and category. By clicking on the square next to the legend description, that category (stations, tracks, or lines) becomes grey, showing the other bars with the highest total sum for those categories. By clicking on the title of the chart itself, it expands to display data for all available cities in this dataset.`, 'city-groupedBarChart')
    createDynamicModal(`<strong>About "Top 15 countries by number of stations, lines and tracks" grouped barchart</strong>\n\nThis grouped barchart shows the top 15 countries by the number of stations, tracks, and lines. The data is sorted by the total sum of all three values.\n\nHovering over one of the bars displays the exact values for that country and category. By clicking on the square next to the legend description, that category (stations, tracks, or lines) becomes grey, showing the other bars with the highest total sum for those categories. By clicking on the title of the chart itself, it expands to display data for all available countries in this dataset.`, 'country-groupedBarChart')
    createDynamicModal(`<strong>About "Top 15 cities by length of tracks and lines" grouped barchart</strong>\n\n This grouped barchart shows the top 15 cities by the length of tracks and lines. The data is sorted by the total sum of both values. \n\nHovering over one of the bars displays the exact values for that city and category.  By clicking on the square next to the legend description, that category (track lengths, or line length) becomes grey, showing the other category with the highest value. By clicking on the title of the chart itself, it expands to display data for all available cities in this dataset.`, 'cityLength-groupedBarChart')
    createDynamicModal(`<strong>About "Top 15 countries by length of tracks and lines" grouped barchart</strong>\n\n This grouped barchart shows the top 15 countries by the length of tracks and lines. The data is sorted by the total sum of both values. \n\nHovering over one of the bars displays the exact values for that country and category.  By clicking on the square next to the legend description, that category (track lengths, or line length) becomes grey, showing the other category with the highest value. By clicking on the title of the chart itself, it expands to display data for all available countries in this dataset.`, 'countryLength-groupedBarChart')
    createDynamicModal(`<strong>About "Number of lines vs line lengths by city" scatterplot</strong>\n\nThis scatter plot shows the relationship between the number of lines and their lengths in kilometers for each city on a logarithmic scale. The points representing the cities also have different colors (gradient) depending on the number of systems they have. If a city has more systems, it is colored blue, and if it has fewer systems, it is colored purple. Additionally, the size of the point depends on the number of stations. The more stations a city has, the larger the diameter of the point. \n\nHovering over a point displays the name of the city, the exact length of the lines for that city, the number of lines, the number of stations, and the number of systems. Clicking on the title changes the scale to a linear scale.`, 'scatterplot')
    createDynamicModal(`<strong>About "Cities by number of systems" piechart</strong>\n\n This pie chart shows the share of the number of systems for a specific city out of the total number of systems. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the city. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the bar chart displayed on the left.`, 'citySystems-pieChart')
    createDynamicModal(`<strong>About "countries by number of systems" piechart</strong>\n\n This pie chart shows the share of the number of systems for a specific country out of the total number of systems. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the country. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the bar chart displayed on the left.`, 'countrySystems-pieChart')
    createDynamicModal(`<strong>About "Cities by number of lines" piechart</strong>\n\n This pie chart shows the share of the number of lines for a specific city out of the total number of lines. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the city. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the barchart displayed before this piechart.`, 'cityLines-pieChart')
    createDynamicModal(`<strong>About "Cities by number of stations" piechart</strong>\n\n This pie chart shows the share of the number of stations for a specific city out of the total number of stations. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the city. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the barchart displayed before this piechart.`, 'cityStations-pieChart')
    createDynamicModal(`<strong>About "Cities by number of tracks" piechart</strong>\n\n This pie chart shows the share of the number of tracks for a specific city out of the total number of tracks. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the city. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the barchart displayed before this piechart.`, 'cityTracks-pieChart')
    createDynamicModal(`<strong>About "Countries by number of lines" piechart</strong>\n\n This pie chart shows the share of the number of lines for a specific country out of the total number of lines. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the country. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the barchart displayed before this piechart.`, 'countryLines-pieChart')
    createDynamicModal(`<strong>About "Countries by number of stations" piechart</strong>\n\n This pie chart shows the share of the number of stations for a specific country out of the total number of stations. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the country. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the barchart displayed before this piechart.`, 'countryStations-pieChart')
    createDynamicModal(`<strong>About "Countries by number of tracks" piechart</strong>\n\n This pie chart shows the share of the number of tracks for a specific country out of the total number of tracks. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the country. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the barchart displayed before this piechart.`, 'countryTracks-pieChart')

});
  
document.addEventListener('DOMContentLoaded', function () {
    const dashboardToggle = document.getElementById('dashboardToggle');
    if (localStorage.getItem('dashboardToggle') === 'enabled') {
        enableDashboard()
        dashboardToggle.checked = true;

    } else {
        disableDashboard()
        dashboardToggle.checked = false;
    }

    dashboardToggle.addEventListener('change', function () {
        if (dashboardToggle.checked) {
            enableDashboard();
        } else {
            disableDashboard();
        }
    });

    function enableDashboard() {
        document.body.classList.add('dashboard');
        localStorage.setItem('dashboardToggle', 'enabled');
        showDashboardElements()
    }
    function disableDashboard() {
        document.body.classList.remove('dashboard');
        localStorage.setItem('dashboardToggle', 'disabled');
        hideDashboardElements()
    }

});

