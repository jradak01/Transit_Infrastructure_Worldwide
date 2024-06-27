const sizes = {
    circle: 180,
    verticalBarchart: {width: window.innerWidth*0.46, height: window.innerHeight* 0.8},
    verticalShortBarchart: {width:  window.innerWidth* 0.58, height: 400},
    smallBarchart: {width: window.innerWidth * 0.3, height:  window.innerHeight* 0.4},
    piechart:  window.innerWidth*0.22,
    smallPiechart: window.innerWidth*0.18,
    largePiechart: window.innerHeight* 0.6,
    linechart: {width: window.innerWidth* 0.9, height: 400},
    smallLinechart: {width: window.innerWidth * 0.35, height: window.innerHeight* 0.3},
    bigMap: window.innerHeight* 0.9,
    smallMap:window.innerWidth* 0.35,
    systemMap: 300

}

// charts

async function loadCircles(city) {
    const { stations, lines, tracks, systems, trackLines } = await getData(['stations', 'lines', 'tracks', 'systems', 'trackLines'])
    let linesData = sumData(mapData(lines, tracks, trackLines, 'line_id', 'section_id', 'tracks'), 'length', 'tracks', true)

    const cityStations = filterDataForCity(city.id, stations)
    let cityLines = filterDataForCity(city.id, linesData)
    const cityTracks = filterDataForCity(city.id, tracks)
    const citySystems = filterDataForCity(city.id, systems)

    const uniqueStations = uniqueElements(cityStations, 'id').size
    const uniqueLines = uniqueElements(cityLines, 'id').size
    const uniqueTracks = uniqueElements(cityTracks, 'id').size
    const uniqueSystems = uniqueElements(citySystems, 'id').size

    cityLines = sumData(cityLines, 'length', 'tracks', true)
    const lenOfLines = sumData(cityLines, 'tracks_length')
    const lenOfTracks = sumData(cityTracks, 'length', null, true)

    createCircle("#circle-systems", uniqueSystems, colorPalette.purple,
        textBefore = "Contains", textAfter = "systems", sizes.circle)
    createCircle("#circle-lines", uniqueLines, colorPalette.purple,
        textBefore = "Contains", textAfter = "lines", sizes.circle)
    createCircle("#circle-tracks", uniqueTracks, colorPalette.purple,
        textBefore = "Contains", textAfter = "tracks", sizes.circle)
    createCircle("#circle-stations", uniqueStations, colorPalette.purple,
        textBefore = "Contains", textAfter = "stations", sizes.circle)
    createCircle("#circle-tracksLen", lenOfTracks, colorPalette.purple,
        textBefore = "Contains", textAfter = "km of tracks", sizes.circle)
    createCircle("#circle-linesLen", lenOfLines, colorPalette.purple,
        textBefore = "Contains", textAfter = "km of lines", sizes.circle)
}

async function loadText(city) {
    const { stations, lines, tracks, systems, trackLines } = await getData(['stations', 'lines', 'tracks', 'systems', 'trackLines'])
    let linesData = sumData(mapData(lines, tracks, trackLines, 'line_id', 'section_id', 'tracks'), 'length', 'tracks', true)

    const cityStations = filterDataForCity(city.id, stations)
    let cityLines = filterDataForCity(city.id, linesData)
    const cityTracks = filterDataForCity(city.id, tracks)
    const citySystems = filterDataForCity(city.id, systems)

    const uniqueStations = uniqueElements(cityStations, 'id').size
    const uniqueLines = uniqueElements(cityLines, 'id').size
    const uniqueTracks = uniqueElements(cityTracks, 'id').size
    const uniqueSystems = uniqueElements(citySystems, 'id').size

    cityLines = sumData(cityLines, 'length', 'tracks', true)
    const lenOfLines = sumData(cityLines, 'tracks_length')
    const lenOfTracks = sumData(cityTracks, 'length', null, true)

    createDiv(`${uniqueSystems} systems`, 'smallText1')
    createDiv(`${uniqueLines} lines`, 'smallText2')
    createDiv(`${uniqueTracks} tracks`, 'smallText3')
    createDiv(`${uniqueStations} stations`, 'smallText4')
    createDiv(`${Number.isInteger(lenOfTracks) ? lenOfTracks : d3.format('.2f')(lenOfTracks)} km of tracks`, 'smallText5')
    createDiv(`${Number.isInteger(lenOfLines) ? lenOfLines : d3.format('.2f')(lenOfLines)} km of lines`, 'smallText6')
}

async function loadBarcharts(city) {
    const { stations, lines, tracks, systems, trackLines, stationLines } = await getData(['stations', 'lines', 'tracks', 'systems', 'trackLines', 'stationLines'])
    let linesData = sumData(mapData(lines, tracks, trackLines, 'line_id', 'section_id', 'tracks'), 'length', 'tracks', true)
    let cityLines = filterDataForCity(city.id, linesData)
    let citySystems = filterDataForCity(city.id, systems)
    cityLines = sortByAttribute(cityLines, 'tracks_length')

    let linesStations = mapData(cityLines, stations, stationLines, 'line_id', 'station_id', 'stations')
    linesStations = countDataByGroupedAttribute(linesStations, 'stations')
    let systemLines = mapData(citySystems, linesStations, linesStations, 'system_id', 'id', 'lines')
    systemLines = countDataByGroupedAttribute(systemLines, 'lines')
    systemLines = sumData(systemLines, 'tracks_length', 'lines', false)
    systemLines = sumData(systemLines, 'stations_count', 'lines', false)
    let numOfBarsLinesCount = systemLines.filter(obj => obj.lines_count > 0).length;
    let numOfBarsLinesTracksLength = systemLines.filter(obj => obj.lines_tracks_length > 0).length;
    let numOfBarsLinesStationsCount = systemLines.filter(obj => obj.lines_stations_count > 0).length;

    const colors = {
        startColor: colorPalette.purple,
        endColor: colorPalette.orange,
    }

    createBarChart(d => d.name, d => d.tracks_length,
        "#smallBar1", cityLines,
        'Length of lines', 'Length (km)', 'Lines', sizes.smallBarchart.width, sizes.smallBarchart.height,
        colors, false, false, 10)
    createBarChart(d => d.name, d => d.stations_count,
        "#smallBar2", linesStations,
        'Number of stations by line', 'Stations count', 'Lines', sizes.smallBarchart.width, sizes.smallBarchart.height,
        colors, false, false, 10)

    createBarChart(d => d.tracks_length, d => d.name,
        "#linesLen-barchart", cityLines,
        'Length of lines', 'Length (km)', 'Lines', 
        sizes.verticalBarchart.width, sizes.verticalBarchart.height,
        colors, true, true, 15)
    createBarChart(d => d.stations_count, d => d.name,
        "#stationsCount-barchart", linesStations,
        'Number of stations by line', 'Stations count', 'Lines', 
        sizes.verticalBarchart.width, sizes.verticalBarchart.height,
        colors, true, true, 15)
    createBarChart(d => d.lines_count, d => d.name, "#linesCount-barchart", systemLines,
        'Number of lines by system', 'Lines count', 'System', 
        sizes.verticalShortBarchart.width, sizes.verticalShortBarchart.height, colors, true,  true, 
        numOfBarsLinesCount < 15 ? numOfBarsLinesCount : 15)
    createBarChart(d => d.lines_tracks_length, d => d.name, "#systemLen-barchart",
         sortByAttribute(systemLines, 'lines_tracks_length'),
        'System length', 'Length (km)', 'System', sizes.verticalShortBarchart.width, sizes.verticalShortBarchart.height, 
        colors, true, true, 
        numOfBarsLinesTracksLength < 15 ? numOfBarsLinesTracksLength: 15)
    createBarChart(d => d.lines_stations_count, d => d.name, "#systemStations-barchart", 
        sortByAttribute(systemLines, 'lines_stations_count'),
        'Number of stations by system', 'Stations count', 'System', 
        sizes.verticalShortBarchart.width, sizes.verticalShortBarchart.height,
        colors, true,  true, numOfBarsLinesStationsCount < 15 ? numOfBarsLinesStationsCount : 15)

}

async function loadPiechart(city, patterns) {
    d3.select("#smallPie1").select("svg").remove();
    d3.select("#smallPie2").select("svg").remove();
    d3.select("#smallPie3").select("svg").remove();
    d3.select("#linesLen-piechart").select("svg").remove();
    d3.select("#linesStations-piechart").select("svg").remove();
    d3.select("#linesCount-piechart").select("svg").remove();
    d3.select("#systemLen-piechart").select("svg").remove();
    d3.select("#systemStations-piechart").select("svg").remove();
    const { stations, lines, tracks, systems, trackLines, stationLines } = await getData(['stations', 'lines', 'tracks', 'systems', 'trackLines', 'stationLines'])

    const colors = convertObjectToArray(colorPalette)

    let linesData = sumData(mapData(lines, tracks, trackLines, 'line_id', 'section_id', 'tracks'), 'length', 'tracks', true)
    let cityLines = filterDataForCity(city.id, linesData)
    let citySystems = filterDataForCity(city.id, systems)
    cityLines = sortByAttribute(cityLines, 'tracks_length')

    let linesStations = mapData(cityLines, stations, stationLines, 'line_id', 'station_id', 'stations')
    linesStations = countDataByGroupedAttribute(linesStations, 'stations')

    const totalStationsByLines = sumData(linesStations, 'stations_count')
    const totalLength = sumData(linesStations, 'tracks_length')

    linesStations = countPercentage(linesStations, 'stations_count', totalStationsByLines)
    linesStations = countPercentage(linesStations, 'tracks_length', totalLength)

    let systemLines = mapData(citySystems, linesStations, linesStations, 'system_id', 'id', 'lines')

    systemLines = countDataByGroupedAttribute(systemLines, 'lines')
    systemLines = sumData(systemLines, 'tracks_length', 'lines', false)
    systemLines = sumData(systemLines, 'stations_count', 'lines', false)

    const totalLines = sumData(systemLines, 'lines_count')
    const totalStations = sumData(systemLines, 'lines_stations_count')
    const totalLinesLength = sumData(systemLines, 'lines_tracks_length')

    systemLines = countPercentage(systemLines, 'lines_count', totalLines)
    systemLines = countPercentage(systemLines, 'lines_stations_count', totalStations)
    systemLines = countPercentage(systemLines, 'lines_tracks_length', totalLinesLength)

    createPieChart('#smallPie1', systemLines, 'lines_count_percentage', 'lines_count', 'name', colors,
        totalLines, true, false, 5, 'Systems by number of lines', size = sizes.smallPiechart, false, true)
    createPieChart('#smallPie2', systemLines, 'lines_tracks_length_percentage', 'lines_tracks_length', 'name', colors,
        totalLinesLength, true, false, 5, 'Systems by lengths', size = sizes.smallPiechart, false, true)
    createPieChart('#smallPie3', systemLines, 'lines_stations_count_percentage', 'lines_stations_count', 'name', colors,
        totalStations, true, false, 5, 'Systems by number of stations', size = sizes.smallPiechart, false, true)


    createPieChart('#linesLen-piechart', linesStations, 'tracks_length_percentage', 'tracks_length', 'name', colors,
        totalLength, true, false, 5, 'Lines by length (km)', size = sizes.largePiechart, patterns, true)
    createPieChart('#linesStations-piechart', linesStations, 'stations_count_percentage', 'stations_count', 'name', colors,
        totalStationsByLines, true, false, 5, 'Lines by number of stations', size = sizes.largePiechart, patterns, true)

    createPieChart('#linesCount-piechart', systemLines, 'lines_count_percentage', 'lines_count', 'name', colors,
        totalLines, true, false, 5, 'Systems by number of lines', size = sizes.piechart, patterns, true)
    createPieChart('#systemLen-piechart', systemLines, 'lines_tracks_length_percentage', 'lines_tracks_length', 'name', colors,
        totalLinesLength, true, false, 5, 'Systems by length (km)', size = sizes.piechart, patterns, true)
    createPieChart('#systemStations-piechart', systemLines, 'lines_stations_count_percentage', 'lines_stations_count', 'name', colors,
        totalStations, true, false, 5, 'Systems by number of stations', size = sizes.piechart, patterns, true)
}

async function loadLineChart(city) {
    const { cities, stations, tracks } = await getData(['cities', 'stations', 'tracks'])

    let countryStations = filterDataForCountry(city.country, cities, stations)
    let cityStations = filterDataForCity(city.id, stations)
    let countryTracks = filterDataForCountry(city.country, cities, tracks)
    let cityTracks = filterDataForCity(city.id, tracks)

    let openingsCity = sortByAttribute(countByField(filterByDates(cityStations, 'opening'), 'opening'),
        'name', true)
    let buildStartsCity = sortByAttribute(countByField(filterByDates(cityStations, 'buildstart'), 'buildstart'),
        'name', true)
    let openingsCountry = sortByAttribute(countByField(filterByDates(countryStations, 'opening'), 'opening'),
        'name', true)
    let buildStartsCountry = sortByAttribute(countByField(filterByDates(countryStations, 'buildstart'), 'buildstart'),
        'name', true)

    let openingsCityTracks = sortByAttribute(countByField(filterByDates(cityTracks, 'opening'), 'opening'),
        'id', true)
    let buildStartsCityTracks = sortByAttribute(countByField(filterByDates(cityTracks, 'buildstart'), 'buildstart'),
        'id', true)
    let openingsCountryTracks = sortByAttribute(countByField(filterByDates(countryTracks, 'opening'), 'opening'),
        'id', true)
    let buildStartsCountryTracks = sortByAttribute(countByField(filterByDates(countryTracks, 'buildstart'), 'buildstart'),
        'id', true)
    const minYear = d3.min([openingsCity, buildStartsCity, openingsCountry, buildStartsCountry]
        .flat().map(d => d.name).filter(d => d >= 1600));

    openingsCity = addMissingData(openingsCity, 'name', minYear, 'value')
    buildStartsCity = addMissingData(buildStartsCity, 'name', minYear, 'value')
    openingsCountry = addMissingData(openingsCountry, 'name', minYear, 'value')
    buildStartsCountry = addMissingData(buildStartsCountry, 'name', minYear, 'value')

    openingsCityTracks = addMissingData(openingsCityTracks, 'name', minYear, 'value')
    buildStartsCityTracks = addMissingData(buildStartsCityTracks, 'name', minYear, 'value')
    openingsCountryTracks = addMissingData(openingsCountryTracks, 'name', minYear, 'value')
    buildStartsCountryTracks = addMissingData(buildStartsCountryTracks, 'name', minYear, 'value')


    openingsCity = culmulativeSum(openingsCity, 'value')
    buildStartsCity = culmulativeSum(buildStartsCity, 'value')
    openingsCountry = culmulativeSum(openingsCountry, 'value')
    buildStartsCountry = culmulativeSum(buildStartsCountry, 'value')

    openingsCityTracks = culmulativeSum(openingsCityTracks, 'value')
    buildStartsCityTracks = culmulativeSum(buildStartsCityTracks, 'value')
    openingsCountryTracks = culmulativeSum(openingsCountryTracks, 'value')
    buildStartsCountryTracks = culmulativeSum(buildStartsCountryTracks, 'value')
    const colors = {
        country: colorPalette.purple,
        city: colorPalette.orange,
        buildstartCountry: colorPalette.blue,
        buildstartCity: colorPalette.yellow,
    }

    createLineChart('#smallLine2', openingsCountry, openingsCity, buildStartsCountry, buildStartsCity,
        city.country, city.name, "Stations by years", "Stations by years", "Year", "Stations count", 
        sizes.smallLinechart.width, sizes.smallLinechart.height, radius = 1, colors, d => d.cumulative_value, d => d.value)

    createLineChart('#smallLine1', openingsCountryTracks, openingsCityTracks, buildStartsCountryTracks, buildStartsCityTracks,
        city.country, city.name, "Tracks by years", "Tracks by years", "Year", "Tracks count", 
        sizes.smallLinechart.width, sizes.smallLinechart.height, radius = 1, colors, d => d.cumulative_value, d => d.value)


    createLineChart('#linechart', openingsCountry, openingsCity, buildStartsCountry, buildStartsCity,
        city.country, city.name, "Stations by years", "Stations by years", "Year", "Stations count", 
        sizes.linechart.width, sizes.linechart.height, radius = 2, colors, d => d.cumulative_value, d => d.value)

    createLineChart('#linechart-tracks', openingsCountryTracks, openingsCityTracks, buildStartsCountryTracks, buildStartsCityTracks,
        city.country, city.name, "Tracks by years", "Tracks by years", "Year", "Tracks count", 
        sizes.linechart.width, sizes.linechart.height, radius = 2, colors, d => d.cumulative_value, d => d.value)
}

async function loadMap(city, size, toggles, systemToggles, selector) {
    const { stations, lines, tracks,
        trackLines, stationLines, systems } = await getData(['cities', 'stations', 'lines', 'tracks',
            'trackLines', 'stationLines', 'systems'])
    const citiesShape = await d3.json('../data2/convert_new.json')
    const selectedCity = citiesShape.features
        .find(feature => feature.properties.NAME.toUpperCase() === city.name.toUpperCase());
    let cityStations = filterDataForCity(city.id, stations) 
    cityStations = breakPointCoordinates(cityStations)

    let cityTracks = filterDataForCity(city.id, tracks)
    cityTracks = breakLineCoordinates(cityTracks)

    let cityLines = filterDataForCity(city.id, lines)

    cityLines = mapData(cityLines, cityTracks, trackLines, 'line_id', 'section_id', 'tracks')
    cityLines = mapData(cityLines, cityStations, stationLines, 'line_id', 'station_id', 'stations')
    cityLines = sumData(cityLines, 'length', 'tracks', true)

    let citySystems = filterDataForCity(city.id, systems)
    citySystems = mapData(citySystems, cityLines, cityLines, 'system_id', 'id', 'lines')

    const colors = {
        adminBoundary: colorPalette.grey,
        stations: colorPalette.pink,
        stationsHover: colorPalette.orange,
        tracks: colorPalette.blue,
        tracksHover: colorPalette.orange,
        densityStart: colorPalette.purple,
        densityEnd: colorPalette.yellow,
        densityHover: colorPalette.orange,
        timelapsStart: colorPalette.purple,
        timelapsEnd: colorPalette.yellow,
        timelapsHover: colorPalette.orange,
        lineHover: colorPalette.orange,
        noData: colorPalette.grey
    }
    showCity(selector, size, colors, cityStations, cityTracks, cityLines, citySystems, selectedCity, toggles, systemToggles)
}

async function loadSystemMap(city, system, toggles) {
    const { stations, lines, tracks,
        trackLines, stationLines, systems } = await getData(['cities', 'stations', 'lines', 'tracks',
            'trackLines', 'stationLines', 'systems'])
    const citiesShape = await d3.json('../data2/convert_new.json')
    const selectedCity = citiesShape.features
        .find(feature => feature.properties.NAME.toUpperCase() === city.name.toUpperCase());

    let cityStations = filterDataForCity(city.id, stations)
    cityStations = breakPointCoordinates(cityStations)

    let cityTracks = filterDataForCity(city.id, tracks)
    cityTracks = breakLineCoordinates(cityTracks)

    let cityLines = filterDataForCity(city.id, lines)

    cityLines = mapData(cityLines, cityTracks, trackLines, 'line_id', 'section_id', 'tracks')
    cityLines = mapData(cityLines, cityStations, stationLines, 'line_id', 'station_id', 'stations')
    cityLines = sumData(cityLines, 'length', 'tracks', true)

    let citySystems = filterDataForCity(city.id, systems)
    citySystems = mapData(citySystems, cityLines, cityLines, 'system_id', 'id', 'lines')
    const selectedSystem = citySystems.find(d => d.id === system.id)

    const colors = {
        adminBoundary: 'black',
        stations: colorPalette.pink,
        stationsHover: colorPalette.orange,
        tracks: colorPalette.blue,
        tracksHover: colorPalette.orange,
        densityStart: colorPalette.purple,
        densityEnd: colorPalette.yellow,
        densityHover: colorPalette.orange,
        timelapsStart: colorPalette.purple,
        timelapsEnd: colorPalette.yellow,
        timelapsHover: colorPalette.orange,
        lineHover: colorPalette.orange,
        noData: "black"
    }

    const systemsMap = document.getElementById('systems-map');
    let systemDiv = document.createElement('div');
    systemDiv.id = `system-${system.id}`;
    systemDiv.className = 'system-map';
    systemDiv.textContent=system.name;
    systemsMap.appendChild(systemDiv);
    systemDiv.style.display = 'flex';
    systemDiv.style.flexDirection ='column'
    systemDiv.style.justifyContent = 'center';
    systemDiv.style.alignItems = 'center';
    showSystems(`#system-${system.id}`, sizes.systemMap, colors, cityStations, selectedSystem, selectedCity, toggles)
}

// other dynamic elemensts on city page

function toggleDropdown(dropdownId) {
    document.getElementById(dropdownId).classList.toggle("show");
}

function showDashboardElements() {
    hide('city-map')
    hide('zoom-in')
    hide('zoom-out')
    hide('checkboxesStart')
    hide('checkboxesStartSystems')
    hide('checkboxesSystems')
    hide('systems-map')
    hide('linesStations-piechart')
    hide('linesLen-piechart')
    hide('linesCount-piechart')
    hide('systemLen-piechart')
    hide('systemStations-piechart')
    hide('linesLen-barchart')
    hide("stationsCount-barchart")
    hide("linesCount-barchart")
    hide("systemLen-barchart")
    hide("systemStations-barchart")
    hide('linechart')
    hide('linechart-tracks')
    hide("circle-systems")
    hide("circle-lines")
    hide("circle-linesLen")
    hide("circle-stations")
    hide("circle-tracks")
    hide("circle-tracksLen")
    hide("info-data")
    hide("info-project")
    hide("city")
    hide("circles")
    show('dashboard-container')
}

function hideDashboardElements() {
    show('city-map')
    show('zoom-in')
    show('zoom-out')
    show('systems-map')
    show('checkboxesStart')
    show('checkboxesStartSystems')
    show('checkboxesSystems')
    show('linesStations-piechart')
    show('linesLen-piechart')
    show('linesCount-piechart')
    show('systemLen-piechart')
    show('systemStations-piechart')
    show('linesLen-barchart')
    show("stationsCount-barchart")
    show("linesCount-barchart")
    show("systemLen-barchart")
    show("systemStations-barchart")
    show('linechart')
    show('linechart-tracks')
    show("circle-systems")
    show("circle-lines")
    show("circle-linesLen")
    show("circle-stations")
    show("circle-tracks")
    show("circle-tracksLen")
    show("info-data")
    show("info-project")
    show("city")
    show("circles")
    hide('dashboard-container')
}

function getCheckboxes(checkbox_id) {
    const checkboxes = [
        { class: 'toggle', id: `${checkbox_id}Boundary`, label: "<div class='full-line'></div>Administrative boundaries", checked: false },
        { class: 'toggle', id: `${checkbox_id}Background`, label: "<div class='full-line' style='background-color: transparent;'></div>Background", checked: true },
        { class: 'toggle', id: `${checkbox_id}Systems`, label: "<div class='full-line' style='background-color: transparent;'></div>Systems", checked: false },
        { class: 'toggle', id: `${checkbox_id}Stations`, label: "<div class='point'></div>Stations", checked: true },
        { class: 'toggle', id: `${checkbox_id}StationDensity`, label: "<div class='hexagon'></div>Stations density", checked: false },
        { class: 'toggle', id: `${checkbox_id}StationsByOpeningYear`, label: "<div class='point'></div>Stations by opening year", checked: false },
        { class: 'toggle', id: `${checkbox_id}StationsByBuildYear`, label: "<div class='point'></div>Stations by build year", checked: false },
        { class: 'toggle', id: `${checkbox_id}Tracks`, label: "<div class='full-line'></div>Tracks", checked: true },
        { class: 'toggle', id: `${checkbox_id}TrackDensity`, label: "<div class='hexagon'></div>Track density", checked: false },
        { class: 'toggle', id: `${checkbox_id}TracksByOpeningYear`, label: "<div class='full-line'></div>Tracks by opening year", checked: false },
        { class: 'toggle', id: `${checkbox_id}TracksByBuildYear`, label: "<div class='full-line'></div>Tracks by build year", checked: false },
        { class: 'toggle', id: `${checkbox_id}Lines`, label: "<div class='dashed-line'></div>Lines", checked: false },
        { class: 'toggle', id: `${checkbox_id}LinesStations`, label: "<div class='point'></div>Stations for line", checked: false },
        { class: 'toggle', id: `${checkbox_id}LineDensity`, label: "<div class='hexagon'></div>Line density", checked: false },
    ];
    return checkboxes;
}

function getDynamicCheckboxes(data, checkbox_id) {
    const additional = data.map(d => {
        return {
            id: `${checkbox_id}${d.id}`,
            class: 'toggle',
            label: `<div class='point' style='background-color: transparent;'></div>${d.name !== '' ? d.name : d.id}`,
            checked: false
        };
    });
    return additional;
}

function getCheckboxesId(toggles, id) {
    const result = {};
    toggles.forEach(toggle => {
        const index = toggle.id.indexOf(id);
        let modifiedId = toggle.id;
        if (index !== -1) {
            const extractedPart = toggle.id.substring(index + id.length);
            if (extractedPart.length > 0) {
                modifiedId = extractedPart[0].toLowerCase() + extractedPart.slice(1);
            }
        }
        result[modifiedId] = toggle.id;
    });
    return result;
}

function createCheckboxSection(checkboxes, container, direction = null, maxNumElements = null, width = '300px', 
    widthExt='250px', margin='10px', dropdown=false) {
    const numCols = Math.ceil(checkboxes.length / maxNumElements);
    const parentElement = document.getElementById(container);
    parentElement.style.marginLeft = margin;
    const newWidth = parseInt(width) + (numCols - 1) * parseInt(widthExt) + parseInt(margin);
    if (dropdown) {
        const dropdownContainer = document.getElementById(dropdown);
        dropdownContainer.style.width = `${newWidth}px`;
    }
    parentElement.style.width = `${newWidth}px` 
    if (direction) {
        const directionText = document.createElement('div')
        directionText.classList.add('directions-text');
        directionText.textContent = direction;
        parentElement.appendChild(directionText);
    }
    const checkboxesContainer = document.createElement('div');
    checkboxesContainer.id = `${container}checkboxes`;
    checkboxesContainer.className = 'checkboxes';
    let col = document.createElement('div');
    col.className = 'col';
    col.style.width = width;
    checkboxesContainer.appendChild(col);

    checkboxes.forEach((element, index) => {
        if (index > 0 && index % maxNumElements === 0) {
            col = document.createElement('div');
            col.className = 'col';
            col.style.width = widthExt;
            checkboxesContainer.appendChild(col);
        }

        const formCheck = document.createElement('div');
        formCheck.className = 'form-check form-check ' + element.class;
        const input = document.createElement('input');
        input.className = 'form-check-input';
        input.type = 'checkbox';
        input.id = element.id;
        if (element.checked) input.checked = true;
        const label = document.createElement('label');
        label.className = 'form-check-label';
        label.htmlFor = element.id;
        label.innerHTML = element.label;

        formCheck.appendChild(input);
        formCheck.appendChild(label);
        col.appendChild(formCheck);
    });
    parentElement.appendChild(checkboxesContainer);
}

function toggleElements(checkboxes, city, size, toggles, systemToggles, selector) {
    checkboxes.forEach(checkbox => {
        document.getElementById(checkbox.id).addEventListener('change', () => {
            d3.select(selector).select("svg").remove();
            loadMap(city, size, toggles, systemToggles, selector);
        });
    });
}

function toggleSystemElements(data, systemToggles, selector, city, size, toggles, addSystems = false) {
    data.forEach(d => {
        document.getElementById(`${systemToggles}${d.id}`).addEventListener('change', (event) => {
            d3.select(selector).select("svg").remove();
            loadMap(city, size, toggles, systemToggles, selector);
            if (addSystems) {
                if (event.target.checked) {
                    loadSystemMap(city, d, toggles);
                } else {
                    removeSystemDiv(d);
                }
            }
        });
    });
}

function removeSystemDiv(system) {
    let systemDiv = document.getElementById(`system-${system.id}`);
    if (systemDiv) {
        systemDiv.parentNode.removeChild(systemDiv);
    }
}

// load 

async function loadCity() {
    const city = JSON.parse(sessionStorage.getItem('selectedCity'));

    if (city) {
        let { systems } = await getData(['systems']);
        systems = systems.filter(system => system.city_id === city.id);
        document.getElementById('main-title').textContent = `${city.name}, ${city.country}`;

        const systemCheckboxes = getDynamicCheckboxes(systems, 'toggle')
        const checkboxes = getCheckboxes('toggle');
        const systemCheckboxesSmall = getDynamicCheckboxes(systems, 'toggleSmall')
        const checkboxesSmall = getCheckboxes('toggleSmall');
        createCheckboxSection(checkboxes, 'checkboxesStart', 'Filter: ', 11 ,'250px', '160px')
        createCheckboxSection(systemCheckboxes, systemCheckboxes.length > 10 ? 'checkboxesSystems' : 'checkboxesStartSystems',
            'Systems: ', 10, '230px', '230px', '0px')
        createCheckboxSection(checkboxesSmall, 'checkboxesDashboard', 'Filters:', 7, '300px', '300px', '10px',
            'dropdown-content')
        createCheckboxSection(systemCheckboxesSmall, 'checkboxesDashboardSystems', 'Systems:', systemCheckboxesSmall.length>  24 ? 17 : 7,  '300px', '300px', '10px',
            'systems-dropdown-content')
        loadCircles(city);
        loadText(city);
        loadBarcharts(city);
        loadLineChart(city);
        loadMap(city, sizes.bigMap, getCheckboxesId(checkboxes, 'toggle'), 'toggle', "#city-map")
        loadMap(city, sizes.smallMap, getCheckboxesId(checkboxesSmall, 'toggleSmall'), 'toggleSmall', "#smallMap")

        toggleElements(checkboxes, city, sizes.bigMap, getCheckboxesId(checkboxes, 'toggle'), 'toggle', '#city-map')
        toggleElements(checkboxesSmall, city, sizes.smallMap, getCheckboxesId(checkboxesSmall, 'toggleSmall'), 'toggleSmall', '#smallMap')
        toggleSystemElements(systems, 'toggle', "#city-map", city, sizes.bigMap, getCheckboxesId(checkboxes, 'toggle'), true)
        toggleSystemElements(systems, 'toggleSmall', "#smallMap", city, sizes.smallMap, getCheckboxesId(checkboxesSmall, 'toggleSmall'))
    }
}

function loadToggles() {
    const dashboardToggle = document.getElementById('dashboardToggle');

    if (localStorage.getItem('dashboardToggle') === 'enabled') {
        dashboardToggle.checked = true;
        enableDashboard();
    } else {
        dashboardToggle.checked = false;
        disableDashboard();

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
        showDashboardElements();
    }

    function disableDashboard() {
        document.body.classList.remove('dashboard');
        localStorage.setItem('dashboardToggle', 'disabled');
        hideDashboardElements();
    }
}

function togglePatterns() {
    const city = JSON.parse(sessionStorage.getItem('selectedCity'));
    const patternsToggle = document.getElementById('patternToggle');
    if (localStorage.getItem('patternToggle') === 'enabled') {
        patternsToggle.checked = true;
        localStorage.setItem('patternToggle', 'enabled');
        loadPiechart(city, true)
    } else {
        patternsToggle.checked = false;
        localStorage.setItem('patternToggle', 'disabled');
        loadPiechart(city, false)
    }
    patternsToggle.addEventListener('change', function () {
        if (patternsToggle.checked) {
            localStorage.setItem('patternToggle', 'enabled');
            loadPiechart(city, true)
        } else {
            localStorage.setItem('patternToggle', 'disabled');
            loadPiechart(city, false)
        }
    })
    
}

document.addEventListener('DOMContentLoaded', loadCity);
document.addEventListener('DOMContentLoaded', togglePatterns);
document.addEventListener('DOMContentLoaded', loadToggles);

document.addEventListener('DOMContentLoaded', function() {
    createDynamicModal(`<strong>About map of the city</strong>\n\nOn this city map, multiple values can be displayed simultaneously depending on the filters. The filters include: background (city map), administrative boundaries (shown as continuous lines), stations (marked with dots), tracks (shown as lines), lines (shown as dashed lines), stations, tracks, and lines by the year construction began and the year they were completed (color gradient for differentiation), and density (hexagons with gradient).\n\nAdditionally, if systems are selected, data will be displayed by systems depending on which one is selected. There will also be smaller maps of these same systems for easier comparison. When displaying systems, it is necessary to select what to display in the system (stations, tracks, lines, etc.).\n\nThe map can be zoomed as needed. Also, depending on the selected filter, auxiliary graphics can be displayed. When hovering over any element, basic information about that element is displayed.`, 'city');
    createDynamicModal(`<strong>About circles</strong>\n\nThese circles display general information about the city, namely the total number of tracks, stations, lines, systems, line lenghts and track lengths.`, 'circles')
    createDynamicModal(`<strong>About length of lines barchart</strong>\n\nThis barchart shows the line lengths (km) of selected city. It displays maximum of top 15 lines with the highest length.\n\nHovering over a bar displays the exact line length (km). By clicking on title all avaliable data will be displayed.`, 'linesLen-barchart')
    createDynamicModal(`<strong>About number of stations by line barchart</strong>\n\nThis barchart shows the number of stations by line of selected city. It displays maximum of top 15 lines with the highest number of stations.\n\nHovering over a bar displays the exact number of statitions. By clicking on title all avaliable data will be displayed.`, 'stationsCount-barchart')
    createDynamicModal(`<strong>About number of lines by system barchart</strong>\n\nThis barchart shows the number of lines by system of selected city. It displays maximum of top 15 systems with the highest number of lines.\n\nHovering over a bar displays the exact number of lines. By clicking on title all avaliable data will be displayed.`, 'linesCount-barchart')
    createDynamicModal(`<strong>About system length barchart</strong>\n\nThis barchart shows the system lengths (km) of selected city. It displays maximum of top 15 systems with the highest length.\n\nHovering over a bar displays the exact system length (km). By clicking on title all avaliable data will be displayed.`, 'systemLen-barchart')
    createDynamicModal(`<strong>About number of stations by system barchart</strong>\n\nThis barchart shows the number of stations by system of selected city. It displays maximum of top 15 systems with the highest number of stations.\n\nHovering over a bar displays the exact number of lines. By clicking on title all avaliable data will be displayed.`, 'systemStations-barchart')    
    createDynamicModal(`<strong>About "Lines by number of stations" piechart</strong>\n\n This pie chart shows the share of the number of stations by line out of the total number of stations for the city. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the line. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the bar chart displayed before.`, 'linesStations-piechart')
    createDynamicModal(`<strong>About "Lines by length (km)" piechart</strong>\n\n This pie chart shows the share of the lines length out of the total lines length for the city. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the line. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the bar chart displayed before.`, 'linesLen-piechart')
    createDynamicModal(`<strong>About "Systems by number of lines" piechart</strong>\n\n This pie chart shows the share of the number of lines by system out of the total number of lines for the city. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the system. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the bar chart displayed on the left.`, 'linesCount-piechart')
    createDynamicModal(`<strong>About "Systems by number of stations" piechart</strong>\n\n This pie chart shows the share of the number of stations by system out of the total number of stations for the city. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the system. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the bar chart displayed on the left.`, 'systemStations-piechart')
    createDynamicModal(`<strong>About "Systems by length (km)" piechart</strong>\n\n This pie chart shows the share of the systems length out of the total systems length for the city. It displays the 5 largest shares in the overall total, which is indicated at the bottom of the chart.\n\nHovering over a specific segment displays the exact number, percentage, and name of the system. Additionally, the legend helps with a quicker overview of the pie chart.\n\nThis pie chart serves as a supplementary chart to the bar chart displayed before.`, 'systemLen-piechart')    
    createDynamicModal(`<strong>About "Stations by years for Country and City" linechart</strong>\n\nThis line chart shows the number of stations per year of construction start and completion for the city and the country in which the city is located.\n\nEach year's value is represented by a dot and hovering over a dot displays the exact values for that year. By clicking on the square in the legend, you can toggle the display of specific categories. Additionally, using the slider below the line chart, you can select the desired range of years for display.\n\nInitially, cumulative values are shown for each category, and by clicking on the title, original values will be displayed.`, 'linechart') 
    createDynamicModal(`<strong>About "Stations by years for Country and City" linechart</strong>\n\n This line chart shows the number of tracks per year of construction start and completion for the city and the country in which the city is located.\n\nEach year's value is represented by a dot and hovering over a dot displays the exact values for that year. By clicking on the square in the legend, you can toggle the display of specific categories. Additionally, using the slider below the line chart, you can select the desired range of years for display.\n\nInitially, cumulative values are shown for each category, and by clicking on the title, original values will be displayed.`, 'linechart-tracks') 
});
  