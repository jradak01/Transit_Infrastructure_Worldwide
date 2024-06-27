// Function to find the boundary points of a polygon
function findBoundaryPoints(polygon) {
    let north, south, east, west;

    // Iterate over each ring of coordinates in the polygon
    polygon.coordinates.forEach(ring => {
        // Iterate over each point in the ring
        ring.forEach(point => {
            const [lon, lat] = point;

            // Update the northernmost point
            if (!north || lat > north.lat) north = { lon, lat };
            // Update the southernmost point
            if (!south || lat < south.lat) south = { lon, lat };
            // Update the easternmost point
            if (!east || lon > east.lon) east = { lon, lat };
            // Update the westernmost point
            if (!west || lon < west.lon) west = { lon, lat };
        });
    });

    // Return the boundary points in the order: north, south, east, west
    return [north, south, east, west];
}

// Function to find the boundary points from a list of stations
function findBoundaryStations(stations) {
    let north, south, east, west;

    // Iterate over each station in the list
    stations.forEach(station => {
        const [lon, lat] = station.coordinates;

        // Update the northernmost point
        if (!north || lat > north.lat) north = { lon, lat };
        // Update the southernmost point
        if (!south || lat < south.lat) south = { lon, lat };
        // Update the easternmost point
        if (!east || lon > east.lon) east = { lon, lat };
        // Update the westernmost point
        if (!west || lon < west.lon) west = { lon, lat };
    });

    // Return the boundary points in the order: north, south, east, west
    return [north, south, east, west];
}

// Function to expand a coordinate by a given expansion factor
function expandCoordinates(coordinate, expansionFactor) {
    const [lon, lat] = coordinate;
    // Expand the longitude and latitude by the given factors
    return [lon + expansionFactor[0], lat + expansionFactor[1]];
}

// Function to compare two sets of boundaries and determine the most extreme points
function compareBoundaries(boundaries1, boundaries2) {
    const threshold = 1;

    // Compare northern boundaries and choose the more northern point if within threshold
    const north = Math.abs(boundaries1[0].lat - boundaries2[0].lat) < threshold
        ? boundaries1[0].lat > boundaries2[0].lat ? boundaries1[0] : boundaries2[0]
        : boundaries1[0];

    // Compare southern boundaries and choose the more southern point if within threshold
    const south = Math.abs(boundaries1[1].lat - boundaries2[1].lat) < threshold
        ? boundaries1[1].lat < boundaries2[1].lat ? boundaries1[1] : boundaries2[1]
        : boundaries1[1];

    // Compare eastern boundaries and choose the more eastern point if within threshold
    const east = Math.abs(boundaries1[2].lon - boundaries2[2].lon) < threshold
        ? boundaries1[2].lon > boundaries2[2].lon ? boundaries1[2] : boundaries2[2]
        : boundaries1[2];

    // Compare western boundaries and choose the more western point if within threshold
    const west = Math.abs(boundaries1[3].lon - boundaries2[3].lon) < threshold
        ? boundaries1[3].lon < boundaries2[3].lon ? boundaries1[3] : boundaries2[3]
        : boundaries1[3];

    // Return the most extreme points as a set of boundaries
    return { north, south, east, west };
}

// Function to create a boundary polygon from a set of stations and a selected city
function createBoundaryPolygon(stations, selectedCity) {
    // Find boundary points from the stations
    const boundaryStations = findBoundaryStations(stations);
    // Find boundary points from the selected city's polygon
    const boundaryPolygon = findBoundaryPoints(selectedCity);
    // Compare and determine the most extreme boundary points
    const comparedBoundaries = compareBoundaries(boundaryStations, boundaryPolygon);
    const expansionFactor = [0.01, 0.01];

    // Expand the boundary points by a small expansion factor
    const expandedBoundaryStations = [
        expandCoordinates([comparedBoundaries.north.lon, comparedBoundaries.north.lat], [0, expansionFactor[1]]),
        expandCoordinates([comparedBoundaries.east.lon, comparedBoundaries.east.lat], [expansionFactor[0], 0]),
        expandCoordinates([comparedBoundaries.south.lon, comparedBoundaries.south.lat], [0, -expansionFactor[1]]),
        expandCoordinates([comparedBoundaries.west.lon, comparedBoundaries.west.lat], [-expansionFactor[0], 0]),
    ];

    // Return the expanded boundary points as a closed polygon
    return {
        type: "Polygon",
        coordinates: [[
            ...expandedBoundaryStations,
            expandedBoundaryStations[0]
        ]]
    };
}

// Asynchronous function to display a city's map with various features based on toggles
async function showCity(selector, size = 600, colors, stations, tracks, lines, systems, administrativeBoundaries, toggles, systemToggles) {

    // Set the dimensions for the SVG element
    let dimensions = {
        width: size,
        height: size
    };
    
    // Create an SVG element and set its dimensions
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    // Determine the boundary polygon to use based on the presence of stations and administrative boundaries
    const boundaryPolygon = stations.length > 0 
        ? administrativeBoundaries === undefined 
            ? findBoundaryStations(stations) 
            : createBoundaryPolygon(stations, administrativeBoundaries.geometry) 
        : administrativeBoundaries.geometry;

    // Set up the Mercator projection and fit it to the boundary polygon
    const projection = d3.geoMercator()
        .fitSize([dimensions.width, dimensions.height], boundaryPolygon);

    // Create a path generator using the projection
    const path = d3.geoPath().projection(projection);

    // Define a clipping path to prevent overflowing elements
    const blockOverflow = svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    // Create tile layout for the map
    const tile = d3.tile()
        .size([dimensions.width, dimensions.height])
        .scale(projection.scale() * 2 * Math.PI)
        .translate(projection([0, 0]));

    const tiles = tile();

    // If no administrative boundaries are available, display a message
    if (administrativeBoundaries === undefined) {
        svg.append("text")
            .attr('class', 'text')
            .style('font-size', '22px')
            .attr('x', dimensions.width / 2)
            .attr('y', dimensions.height / 2)
            .attr('text-anchor', 'middle')
            .text("Sorry, there is no map available for this city. \u{1F615}")
    }

    // Add background if the corresponding toggle is checked
    if (document.getElementById(toggles.background).checked) {
        addBackground(svg, tiles);
    }

    // Add administrative boundaries if the corresponding toggle is checked and boundaries are available
    if (document.getElementById(toggles.boundary).checked) {
        if (administrativeBoundaries !== undefined)
            addAdministrativeBoundaries(svg, administrativeBoundaries, path, colors.adminBoundary, 1.5);
    }

    // Add tracks if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.tracks).checked && !document.getElementById(toggles.systems).checked) {
        addTracks(svg, path, tracks, colors.tracks, 1.5, colors.tracksHover);
    }

    // Add tracks by opening year if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.tracksByOpeningYear).checked && !document.getElementById(toggles.systems).checked) {
        addTracksByYear(svg, dimensions, 'opening', tracks, projection, path, 1.5,
            colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover);
    }

    // Add tracks by build year if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.tracksByBuildYear).checked && !document.getElementById(toggles.systems).checked) {
        addTracksByYear(svg, dimensions, 'buildstart', tracks, projection, path, 1,
            colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover);
    }

    // Add track density if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.trackDensity).checked && !document.getElementById(toggles.systems).checked) {
        const tracksProjected = projectData(projection, tracks, "path");
        addDensity(dimensions, svg, tracksProjected, 10, "tracks-hexagons",
            colors.noData, colors.densityHover, colors.densityStart, colors.densityEnd);
    }

    // Add stations if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.stations).checked && !document.getElementById(toggles.systems).checked) {
        addStations(svg, stations, projection, stations.length > 1000 ? 1.5 : 2, colors.stations, colors.stationsHover);
    }

    // Add stations by opening year if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.stationsByOpeningYear).checked && !document.getElementById(toggles.systems).checked) {
        addStationsByYear(svg, dimensions, 'opening', stations, projection, stations.length > 1000 ? 1.5 : 2,
            colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover);
    }

    // Add stations by build year if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.stationsByBuildYear).checked && !document.getElementById(toggles.systems).checked) {
        addStationsByYear(svg, dimensions, 'buildstart', stations, projection, stations.length > 1000 ? 1.5 : 2,
            colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover);
    }

    // Add station density if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.stationDensity).checked && !document.getElementById(toggles.systems).checked) {
        const stationsProjected = projectData(projection, stations, "point");
        addDensity(dimensions, svg, stationsProjected, 5, "stations-hexagons",
            colors.noData, colors.densityHover, colors.densityStart, colors.densityEnd);
    }

    // Add lines if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.lines).checked && !document.getElementById('toggleSystems').checked) {
        addLines(svg, lines, path, colors.lineHover);
    }

    // Add lines and stations if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.linesStations).checked && !document.getElementById('toggleSystems').checked) {
        addLineStations(svg, lines, projection, 1.5, colors.lineHover);
    }

    // Add line density if the corresponding toggle is checked and systems toggle is not checked
    if (document.getElementById(toggles.lineDensity).checked && !document.getElementById('toggleSystems').checked) {
        const linesProjected = projectData(projection, lines, "nested-path");
        addDensity(dimensions, svg, linesProjected, 10, "lines-hexagons",
            colors.noData, colors.densityHover, colors.densityStart, colors.densityEnd);
    }

    // If the systems toggle is checked, add each system based on its individual toggle
    if (document.getElementById(toggles.systems).checked) {
        systems.forEach(system => {
            if (document.getElementById(`${systemToggles}${system.id}`).checked) {
                addSystems(system, svg, path, projection, dimensions, toggles, colors);
            }
        });
    }

    // Apply zoom functionality to the map
    zoomMap(dimensions, svg, tiles);
}

// Asynchronous function to display a system's map with various features based on toggles
async function showSystems(selector, size = 300, colors, stations, system, administrativeBoundaries, toggles) {
    // Set the dimensions for the SVG element
    let dimensions = {
        width: size,
        height: size
    };

    // Create an SVG element and set its dimensions
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    // Determine the boundary polygon to use based on the presence of stations and administrative boundaries
    const boundaryPolygon = stations.length > 0 
        ? administrativeBoundaries === undefined 
            ? findBoundaryStations(stations) 
            : createBoundaryPolygon(stations, administrativeBoundaries.geometry) 
        : administrativeBoundaries.geometry;

    // Set up the Mercator projection and fit it to the boundary polygon
    const projection = d3.geoMercator()
        .fitSize([dimensions.width, dimensions.height], boundaryPolygon);

    // Create a path generator using the projection
    const path = d3.geoPath().projection(projection);

    // Define a clipping path to prevent overflowing elements
    const blockOverflow = svg.append("defs")
        .append("clipPath")
        .attr("id", "clip")
        .append("rect")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    // Create tile layout for the map
    const tile = d3.tile()
        .size([dimensions.width, dimensions.height])
        .scale(projection.scale() * 2 * Math.PI)
        .translate(projection([0, 0]));

    const tiles = tile();

    // Add background if the corresponding toggle is checked
    if (document.getElementById(toggles.background).checked) {
        addBackground(svg, tiles);
    }

    // Add administrative boundaries if the corresponding toggle is checked
    if (document.getElementById(toggles.boundary).checked) {
        addAdministrativeBoundaries(svg, administrativeBoundaries, path, colors.adminBoundary, 1);
    }

    // Add the system to the map
    addSystems(system, svg, path, projection, dimensions, toggles, colors, false);
}

// Function to add background tiles to the SVG element
function addBackground(svg, tiles) {
    // Append a group element to the SVG to hold the tiles and set a clip path to prevent overflow
    const tileGroup = svg.append("g")
        .attr("class", "tile")
        .attr("clip-path", "url(#clip)");

    // Select all image elements within the tile group, bind the tile data, and append images for each tile
    const background = tileGroup.selectAll("image")
        .data(tiles)
        .enter().append("image")
        .attr("class", "map-tile")
        // Set the source URL for the tile images using the Stadia Maps tile server
        .attr("xlink:href", d => `https://tiles.stadiamaps.com/tiles/alidade_smooth/${d[2]}/${d[0]}/${d[1]}@2x.png`)
        // Alternatively, you can use OpenStreetMap tiles by uncommenting the line below
        // .attr("xlink:href", d => `https://a.tile.openstreetmap.org/${d[2]}/${d[0]}/${d[1]}.png`)
        // Set the x position of the image
        .attr("x", d => (d[0] + tiles.translate[0]) * tiles.scale)
        // Set the y position of the image
        .attr("y", d => (d[1] + tiles.translate[1]) * tiles.scale)
        // Set the width of the image
        .attr("width", tiles.scale)
        // Set the height of the image
        .attr("height", tiles.scale);
}

// Function to add administrative boundaries to the SVG element
function addAdministrativeBoundaries(svg, administrativeBoundaries, path, color = 'black', stroke = 1) {
    // Append a path element to the SVG to represent the administrative boundaries
    const adminBoundary = svg.append("path")
        // Bind the administrative boundaries data to the path element
        .datum(administrativeBoundaries)
        // Use the path generator to create the 'd' attribute for the path, which defines the shape
        .attr("d", path)
        // Set the fill color to 'none' to ensure the path is not filled
        .style("fill", "none")
        // Set the stroke color of the path (boundary line)
        .style("stroke", color)
        // Set the stroke width of the path (boundary line)
        .style("stroke-width", stroke)
        // Apply a clip path to the path element to prevent overflow
        .attr("clip-path", "url(#clip)");
}

// Function to add stations to the SVG element
function addStations(svg, stations, projection, radius = 1.5, color = "red", hoverColor = "orange") {
    // Define a function to access the x-coordinate from station data
    const xAcessor = d => d.coordinates[0];
    // Define a function to access the y-coordinate from station data
    const yAcessor = d => d.coordinates[1];

    // Select all circle elements in the SVG and bind the stations data to them
    const circles = svg.selectAll("circle")
        .data(stations)
        .enter()  // Create placeholders for each station
        .append("circle")  // Append a circle for each station
        // Set the x-coordinate of each circle using the projection function
        .attr("cx", d => projection([xAcessor(d), yAcessor(d)])[0])
        // Set the y-coordinate of each circle using the projection function
        .attr("cy", d => projection([xAcessor(d), yAcessor(d)])[1])
        // Set the radius of each circle
        .attr("r", radius)
        // Set the fill color of each circle
        .style("fill", color)
        // Add an event listener for mouseover to change the circle's appearance
        .on("mouseover", onMouseOver)
        // Add an event listener for mouseout to reset the circle's appearance
        .on("mouseout", onMouseOut);

    // Function to handle mouseover event
    function onMouseOver(e, d) {
        d3.select(this)  // Select the current circle
            .style("fill", hoverColor)  // Change its fill color to the hover color
            .transition()  // Apply a transition
            .attr("r", radius * 1.5);  // Increase the radius

        // Create a tooltip group element in the SVG
        const tooltip = svg.append("g")
            .attr("id", "stations-tooltip")
            .attr("class", "stations-tooltip");

        tooltip.raise();  // Bring the tooltip to the front

        // Append a rectangle to the tooltip for the background
        tooltip.append("rect")
            .attr("class", "tooltip-bg")
            .attr("x", d3.select(this).attr("cx") - 140)  // Position the rectangle
            .attr("y", d3.select(this).attr("cy") - 40)
            .attr("width", 300)  // Set the width of the rectangle
            .attr("height", 30)  // Set the height of the rectangle
            .attr("fill", "white")  // Set the fill color of the rectangle
            .attr("rx", 5)  // Set the x-radius for rounded corners
            .attr("ry", 5)  // Set the y-radius for rounded corners
            .style("box-shadow", "0px 0px 5px #999");  // Add a shadow to the rectangle

        // Append a text element to the tooltip
        tooltip.append("text")
            .attr("x", d3.select(this).attr("cx"))  // Position the text
            .attr("y", d3.select(this).attr("cy") - 20)
            .attr("class", "tooltip-text text")
            // Set the text content to show the station name and opening date
            .text(`Name: ${d.name}, Opening: ${d.opening}`);
    }

    // Function to handle mouseout event
    function onMouseOut(e, d) {
        d3.select(this)  // Select the current circle
            .style("fill", color)  // Reset the fill color
            .transition()  // Apply a transition
            .attr("r", radius);  // Reset the radius

        // Remove the tooltip elements from the SVG
        svg.selectAll(".station-tooltip").remove();
        svg.selectAll(".tooltip-text").remove();
        svg.selectAll(".tooltip-bg").remove();
    }
}

// Function to add tracks to the SVG element
function addTracks(svg, path, tracks, color = 'blue', stroke = 1.5, colorHover = "orange") {
    // Define a function to access the coordinates from track data
    const pathAccessor = d => d.coordinates;

    // Select all path elements with class 'track' in the SVG and bind the tracks data to them
    const trackLines = svg.selectAll("path.track")
        .data(tracks)
        .enter()  // Create placeholders for each track
        .append("path")  // Append a path for each track
        .attr("class", "track")  // Add class 'track' to each path
        // Set the 'd' attribute using the path generator function with track coordinates
        .attr("d", d => path({ type: "LineString", coordinates: pathAccessor(d) }))
        .style("fill", "none")  // Set fill to none
        .style("stroke", color)  // Set the stroke color
        .style("stroke-width", stroke)  // Set the stroke width
        // Add an event listener for mouseover to change the track's appearance
        .on("mouseover", onMouseOver)
        // Add an event listener for mouseout to reset the track's appearance
        .on("mouseout", onMouseOut);

    // Function to handle mouseover event
    function onMouseOver(e, d) {
        d3.select(this)  // Select the current path
            .style("stroke", colorHover)  // Change the stroke color to the hover color
            .transition()  // Apply a transition
            .style("stroke-width", stroke * 1.5);  // Increase the stroke width

        // Calculate the centroid of the track for positioning the tooltip
        const [x, y] = path.centroid({ type: "LineString", coordinates: pathAccessor(d) });

        // Remove any existing tooltip
        svg.select("#track-tooltip").remove();

        // Create a tooltip group element in the SVG
        const tooltip = svg.append("g")
            .attr("id", "track-tooltip")
            .attr("transform", `translate(${x},${y - 40})`);  // Position the tooltip above the track

        // Append a rectangle to the tooltip for the background
        tooltip.append("rect")
            .attr("class", "tooltip-bg")
            .attr("x", -60)  // Center the rectangle
            .attr("y", 0)
            .attr("width", 120)  // Set the width of the rectangle
            .attr("height", 30)  // Set the height of the rectangle
            .attr("fill", "white")  // Set the fill color of the rectangle
            .attr("rx", 5)  // Set the x-radius for rounded corners
            .attr("ry", 5)  // Set the y-radius for rounded corners
            .style("box-shadow", "0px 0px 5px #999");  // Add a shadow to the rectangle

        // Append a text element to the tooltip
        tooltip.append("text")
            .attr("x", 0)  // Center the text
            .attr("y", 20)
            .attr("class", "tooltip-text text")
            .attr("text-anchor", "middle")  // Center the text horizontally
            .text(`Length: ${d.length}m`);  // Set the text content to show the track length
    }

    // Function to handle mouseout event
    function onMouseOut(e, d) {
        d3.select(this)  // Select the current path
            .style("stroke", color)  // Reset the stroke color
            .transition()  // Apply a transition
            .style("stroke-width", stroke);  // Reset the stroke width

        // Remove the tooltip element from the SVG
        svg.select("#track-tooltip").remove();
    }
}

// Function to add lines to the SVG element
function addLines(svg, lines, path, hoverColor = "orange") {
    // Define a function to access the coordinates from the track data
    const pathAccessor = d => d.track.coordinates;
    // Define a function to create a class-friendly name for each line
    const nameAccessor = d => d.name.replace(/[^a-zA-Z0-9]/g, '_');
    // Initialize an array to keep track of hidden lines
    let hiddenLines = [];
    // Append a group element to the SVG for all the lines
    const lineGroup = svg.append("g")
        .attr("class", "lines");

    // Select all elements with class 'line' in the group and bind the lines data to them
    const linePaths = lineGroup.selectAll(".line")
        .data(lines)
        .enter()  // Create placeholders for each line
        .append("g")  // Append a group for each line
        .attr("class", d => `line-${nameAccessor(d)}`)  // Add a unique class for each line
        // For each line, select all path elements and bind the track data to them
        .selectAll("path")
        .data(d => d.tracks.map(track => ({ line: d, track })))
        .enter()  // Create placeholders for each track
        .append("path")  // Append a path for each track
        .attr("class", d => `line-${nameAccessor(d.line)}`)  // Add a unique class for each track
        // Set the 'd' attribute using the path generator function with track coordinates
        .attr("d", d => path({ type: "LineString", coordinates: pathAccessor(d) }))
        .style("fill", "none")  // Set fill to none
        .style("stroke", d => d.line.color)  // Set the stroke color
        .style("stroke-width", 3)  // Set the stroke width
        .style("stroke-dasharray", "1.5, 1")  // Set the stroke dash array
        // Add an event listener for mouseover to change the track's appearance
        .on("mouseover", onMouseOver)
        // Add an event listener for mouseout to reset the track's appearance
        .on("mouseout", onMouseOut)
        // Add an event listener for click to handle line visibility
        .on("click", onMouseClick)
        // Add an event listener for double-click to reset line visibility
        .on("dblclick", onMouseDBClick);

    // Function to handle mouseover event
    function onMouseOver(e, d) {
        d3.select(this).style("stroke", hoverColor);  // Change the stroke color to the hover color
        // Calculate the centroid of the track for positioning the tooltip
        const [x, y] = path.centroid({ type: "LineString", coordinates: pathAccessor(d) });

        // Create a tooltip group element in the SVG
        const tooltip = svg.append("g")
            .attr("id", "line-tooltip")
            .attr("transform", `translate(${x},${y - 40})`);  // Position the tooltip above the line

        // Append a rectangle to the tooltip for the background
        tooltip.append("rect")
            .attr("class", "tooltip-bg")
            .attr("x", -140)  // Center the rectangle
            .attr("y", 0)
            .attr("width", 280)  // Set the width of the rectangle
            .attr("height", 30)  // Set the height of the rectangle
            .attr("fill", "white")  // Set the fill color of the rectangle
            .attr("rx", 5)  // Set the x-radius for rounded corners
            .attr("ry", 5)  // Set the y-radius for rounded corners
            .style("box-shadow", "0px 0px 5px #999");  // Add a shadow to the rectangle

        // Append a text element to the tooltip
        tooltip.append("text")
            .attr("x", 0)  // Center the text
            .attr("y", 20)
            .attr("class", "tooltip-text text")
            .attr("text-anchor", "middle")  // Center the text horizontally
            // Set the text content to show the line name and total track length
            .text(`Line: ${d.line.name}, Length: ${d.line.tracks_length} km`);
    }

    // Function to handle mouseout event
    function onMouseOut(e, d) {
        d3.select(this).style("stroke", d.line.color);  // Reset the stroke color
        svg.select("#line-tooltip").remove();  // Remove the tooltip
    }

    // Function to handle click event
    function onMouseClick(e, d) {
        // Determine the class name of the clicked line
        const clickedLine = `line-${nameAccessor(d.line)}`;
        if (!hiddenLines.includes(clickedLine)) {
            // Hide all other lines except the clicked one
            hiddenLines = lines.map(line => `line-${nameAccessor(line)}`).filter(name => name !== clickedLine);
            lineGroup.selectAll("path")
                .style("opacity", 0.01);  // Make all lines nearly invisible

            lineGroup.selectAll(`.${clickedLine}`)
                .style("opacity", 1);  // Make the clicked line fully visible
        } else {
            // Reset to show all lines
            hiddenLines = [];
            lineGroup.selectAll("path")
                .style("opacity", 1);  // Make all lines fully visible
        }
    }

    // Function to handle double-click event
    function onMouseDBClick(e, d) {
        // Reset to show all lines
        hiddenLines = [];
        lineGroup.selectAll("path")
            .style("opacity", 1);  // Make all lines fully visible
    }
}

// Function to add stations for lines to the SVG element
function addLineStations(svg, lines, projection, radius = 1.5, hoverColor = "orange") {
    // Define a function to access the x-coordinate from the station data
    const xAcessor = d => d.station.coordinates[0];
    // Define a function to access the y-coordinate from the station data
    const yAcessor = d => d.station.coordinates[1];
    // Define a function to access the color from the line data
    const colorAccessor = d => d.line.color;
    // Define a function to create a class-friendly name for each line
    const nameAccessor = d => d.name.replace(/[^a-zA-Z0-9]/g, '_');
    // Initialize an array to keep track of hidden line stations
    let hiddenLineStations = [];
    // Append a group element to the SVG for all the line stations
    const lineStationGroup = svg.append("g")
        .attr("class", "lineStations");

    // Select all elements with class 'circle' in the group and bind the lines data to them
    const lineCircles = lineStationGroup.selectAll(".circle")
        .data(lines)
        .enter()  // Create placeholders for each line
        .append("g")  // Append a group for each line
        .attr("class", d => `lineStation-${nameAccessor(d)}`)  // Add a unique class for each line
        // For each line, select all circle elements and bind the station data to them
        .selectAll("circle")
        .data(d => d.stations.map(station => ({ line: d, station })))
        .enter()  // Create placeholders for each station
        .append("circle")  // Append a circle for each station
        .attr("class", d => `lineStation-${nameAccessor(d.line)}`)  // Add a unique class for each station
        // Set the 'cx' attribute using the projection function with station coordinates
        .attr("cx", d => projection([xAcessor(d), yAcessor(d)])[0])
        // Set the 'cy' attribute using the projection function with station coordinates
        .attr("cy", d => projection([xAcessor(d), yAcessor(d)])[1])
        .attr("r", radius)  // Set the radius of the circle
        .style("fill", d => colorAccessor(d))  // Set the fill color of the circle
        // Add an event listener for mouseover to change the station's appearance
        .on("mouseover", onMouseOver)
        // Add an event listener for mouseout to reset the station's appearance
        .on("mouseout", onMouseOut)
        // Add an event listener for click to handle station visibility
        .on("click", onMouseClick)
        // Add an event listener for double-click to reset station visibility
        .on("dblclick", onMouseDBClick);

    // Function to handle mouseover event
    function onMouseOver(e, d) {
        d3.select(this)  // Select the current circle
            .style("fill", hoverColor)  // Change the fill color to the hover color
            .transition().attr("r", radius * 1.5);  // Increase the radius
        // Create a tooltip group element in the SVG
        const tooltip = svg.append("g")
            .attr("id", "lineStation-tooltip")
            .attr("class", "lineStation-tooltip");
        tooltip.raise();  // Bring the tooltip to the front
        // Append a rectangle to the tooltip for the background
        tooltip.append("rect")
            .attr("class", "tooltip-bg")
            .attr("x", d3.select(this).attr("cx") - 140)
            .attr("y", d3.select(this).attr("cy") - 40)
            .attr("width", 300)  // Set the width of the rectangle
            .attr("height", 30)  // Set the height of the rectangle
            .attr("fill", "white")  // Set the fill color of the rectangle
            .attr("rx", 5)  // Set the x-radius for rounded corners
            .attr("ry", 5)  // Set the y-radius for rounded corners
            .style("box-shadow", "0px 0px 5px #999");  // Add a shadow to the rectangle
        // Append a text element to the tooltip
        tooltip.append("text")
            .attr("x", d3.select(this).attr("cx"))  // Center the text
            .attr("y", d3.select(this).attr("cy") - 20)
            .attr("class", "tooltip-text text")
            // Set the text content to show the line name and station name
            .text(`Line: ${d.line.name}, Station: ${d.station.name}`);
    }

    // Function to handle mouseout event
    function onMouseOut(e, d) {
        d3.select(this)  // Select the current circle
            .style("fill", colorAccessor(d))  // Reset the fill color
            .transition().attr("r", radius);  // Reset the radius
        svg.select("#lineStation-tooltip").remove();  // Remove the tooltip
    }

    // Function to handle click event
    function onMouseClick(e, d) {
        // Determine the class name of the clicked line station
        const clickedLine = `lineStation-${nameAccessor(d.line)}`;
        if (!hiddenLineStations.includes(clickedLine)) {
            // Hide all other line stations except the clicked one
            hiddenLineStations = lines.map(line => `lineStation-${nameAccessor(line)}`).filter(name => name !== clickedLine);
            lineStationGroup.selectAll("circle")
                .style("opacity", 0.01);  // Make all line stations nearly invisible

            lineStationGroup.selectAll(`.${clickedLine}`)
                .style("opacity", 1);  // Make the clicked line stations fully visible
        } else {
            // Reset to show all line stations
            hiddenLineStations = [];
            lineStationGroup.selectAll("circle")
                .style("opacity", 1);  // Make all line stations fully visible
        }
    }

    // Function to handle double-click event
    function onMouseDBClick(e, d) {
        // Reset to show all line stations
        hiddenLineStations = [];
        lineStationGroup.selectAll("circle")
            .style("opacity", 1);  // Make all line stations fully visible
    }
}

// Function to add line, station and track density to the SVG element
function addDensity(dimensions, svg, data, radius = 5, classAtr = "hexagon",
    colorStart = "black", colorHover = "orange", startInterpolate = "blue", endInterpolate = "red") {

    // Create a hexbin generator with the specified radius and extent
    const hexbin = d3.hexbin()
        .radius(radius) 
        .extent([[0, 0], [dimensions.width, dimensions.height]]);

    // Generate hexbin data from the input data
    const hexbinData = hexbin(data);

    // Create a color scale using a sequential color interpolation from startInterpolate to endInterpolate
    const color = d3.scaleSequential(d3.interpolateRgb(startInterpolate, endInterpolate))
        .domain([0, d3.max(hexbinData, d => d.length)]);  // Set the domain based on the maximum hexbin count

    // Append a group element to the SVG for the hexagons
    const hexbins = svg.append("g")
        .attr("class", classAtr)
        // Bind the hexbin data to path elements
        .selectAll("path")
        .data(hexbinData)
        .enter().append("path")  // Create a path for each hexbin
        .attr("class", "hexagon")
        // Set the path data using the hexbin hexagon shape
        .attr("d", hexbin.hexagon())
        // Position each hexagon using the transform attribute
        .attr("transform", d => `translate(${d.x},${d.y})`)
        // Set the fill color based on the hexbin count
        .attr("fill", d => color(d.length))
        .attr("fill-opacity", 0.8)  // Set fill opacity
        .attr("stroke", colorStart)  // Set the stroke color
        .attr("stroke-opacity", 1)  // Set stroke opacity
        // Add an event listener for mouseover to change the hexagon's appearance
        .on("mouseover", onMouseOver)
        // Add an event listener for mouseout to reset the hexagon's appearance
        .on("mouseout", onMouseOut);

    // Function to handle mouseover event
    function onMouseOver(e, d) {
        d3.select(this).style("stroke", colorHover);  // Change the stroke color to the hover color

        // Create a tooltip group element in the SVG
        const tooltip = svg.append("g")
            .attr("id", "hexbin-tooltip")
            .attr("transform", `translate(${d.x},${d.y - 40})`); // Move the tooltip above the hexagon

        // Append a rectangle to the tooltip for the background
        tooltip.append("rect")
            .attr("class", "tooltip-bg")
            .attr("x", -50) // Center the rectangle
            .attr("y", 0)
            .attr("width", 100)  // Set the width of the rectangle
            .attr("height", 30)  // Set the height of the rectangle
            .attr("fill", "white")  // Set the fill color of the rectangle
            .attr("rx", 5)  // Set the x-radius for rounded corners
            .attr("ry", 5)  // Set the y-radius for rounded corners
            .style("box-shadow", "0px 0px 5px #999");  // Add a shadow to the rectangle

        // Append a text element to the tooltip
        tooltip.append("text")
            .attr("x", 0) // Center the text
            .attr("y", 20)
            .attr("class", "tooltip-text text")
            .attr("text-anchor", "middle")
            // Set the text content to show the count of points in the hexagon
            .text(`Count: ${d.length}`);
    }

    // Function to handle mouseout event
    function onMouseOut(e, d) {
        d3.select(this).style("stroke", colorStart);  // Reset the stroke color
        svg.select("#hexbin-tooltip").remove();  // Remove the tooltip
    }

    // Define the width and height of the legend
    const legendWidth = 300;
    const legendHeight = 10;

    // Append a group element to the SVG for the legend
    const legendSvg = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${dimensions.width - legendWidth - 20}, ${dimensions.height - 30})`);

    // Append a linear gradient definition to the legend
    const gradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "gradient")
        .attr("x1", "0%")
        .attr("x2", "100%")
        .attr("y1", "0%")
        .attr("y2", "0%");

    // Define the start color of the gradient
    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", startInterpolate);

    // Define the end color of the gradient
    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", endInterpolate);

    // Append a rectangle to the legend and fill it with the gradient
    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#gradient)");

    // Create a linear scale for the legend axis
    const legendScale = d3.scaleLinear()
        .domain([0, d3.max(hexbinData, d => d.length)])  // Set the domain based on the maximum hexbin count
        .range([0, legendWidth]);  // Set the range to match the width of the legend

    // Create an axis for the legend using the scale
    const legendAxis = d3.axisBottom(legendScale)
        .ticks(5)  // Set the number of ticks on the axis
        .tickSize(-legendHeight);  // Extend the ticks across the height of the legend

    // Append the legend axis to the legend group
    legendSvg.append("g")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);
}

function projectData(projection, data, type = "point") {
    // Check the type of projection needed
    if (type === "point") {
        // Project each point's coordinates using the projection function
        const projected = data.map(d => projection(d.coordinates));
        return projected; // Return the array of projected points
    } else if (type === "path") {
        // Flatten the array of paths and project each path's coordinates
        const projected = data.flatMap(d => d.coordinates.map(coords => projection(coords)));
        return projected; // Return the array of projected path points
    } else if (type === "nested-path") {
        // Flatten the nested structure of paths and tracks, then project each track's coordinates
        const projected = data.flatMap(line => {
            return line.tracks.flatMap(track => {
                return track.coordinates.map(coords => projection(coords))
            })
        });
        return projected; // Return the array of projected nested path points
    }
}

// Function to add stations by year to the SVG element
function addStationsByYear(svg, dimensions, filter, stations, projection, radius = 1.5,
    unknownDataColor = "black", startInterpolate = "blue", endInterpolate = "red", hoverColor = "orange") {

    // Get the current year
    const d = new Date();
    let maxYear = d.getFullYear();
    
    // Get the years from the station data using the filter
    let stationYears = stations.map(station => station[filter]);
    // Sort the years in ascending order
    stationYears.sort((a, b) => a - b);
    // Filter out any years that are less than 1600
    stationYears = stationYears.filter(year => year > 1600);

    // Get the minimum year from the filtered station years
    const minYear = stationYears[0];

    // Accessor functions for the station coordinates
    const xAcessor = d => d.coordinates[0];
    const yAcessor = d => d.coordinates[1];

    // Create a sequential color scale for the years
    const colorScale = d3.scaleSequential()
        .domain([minYear, maxYear])  // Set the domain from the minimum to maximum year
        .interpolator(d3.interpolateRgb(startInterpolate, endInterpolate));  // Use RGB interpolation between start and end colors

    // Bind station data to circle elements in the SVG
    const stationSelection = svg.selectAll("circle")
        .data(stations, d => d.id);

    // Append new circles and update existing ones
    const circles = stationSelection
        .enter()
        .append("circle")
        .merge(stationSelection)
        .attr("cx", d => projection([xAcessor(d), yAcessor(d)])[0])
        .attr("cy", d => projection([xAcessor(d), yAcessor(d)])[1])
        .attr("r", radius)
        .style("fill", d => {
            // Set the fill color based on the year or use the unknown data color
            if (d[filter] >= minYear && d[filter] <= maxYear) {
                return colorScale(d[filter]);
            } else {
                return unknownDataColor;
            }
        })
        // Add event listeners for mouseover and mouseout events
        .on("mouseover", onMouseOver)
        .on("mouseout", onMouseOut);

    // Remove any circles that are no longer needed
    circles.exit().remove();

    // Legend settings
    const legendWidth = 300;
    const legendHeight = 10;

    // Append a group element to the SVG for the legend
    const legendSvg = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${dimensions.width - legendWidth - 10}, ${dimensions.height - legendHeight - 30})`);

    // Define a linear gradient for the legend
    const legendGradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient");

    // Add gradient stops to the linear gradient
    legendGradient.selectAll("stop")
        .data(colorScale.ticks().map((t, i, n) => ({
            offset: `${100 * i / (n.length - 1)}%`,
            color: colorScale(t)
        })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    // Append a rectangle to the legend and fill it with the gradient
    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    // Add a title to the legend
    legendSvg.append("text")
        .attr("class", "legend-title text")
        .attr("x", legendWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(`Station ${filter.charAt(0).toUpperCase() + filter.slice(1)} Year`);

    // Create a linear scale for the legend axis
    const legendScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, legendWidth]);

    // Create an axis for the legend using the scale
    const legendAxis = d3.axisBottom(legendScale)
        .tickValues(colorScale.ticks(6))  // Set the tick values based on the color scale ticks
        .tickFormat(d3.format("d"));  // Format the ticks as integers

    // Append the legend axis to the legend group
    legendSvg.append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);

    // Function to handle mouseover event
    function onMouseOver(e, d) {
        d3.select(this)
            .transition().attr("r", radius * 1.5)  // Increase the radius
            .style("fill", hoverColor);  // Change the fill color to hover color

        // Create a tooltip group element in the SVG
        const tooltip = svg.append("g")
            .attr("id", "stations-tooltip")
            .attr("class", "stations-tooltip");
        
        tooltip.raise();  // Bring the tooltip to the front
        
        // Append a rectangle to the tooltip for the background
        tooltip.append("rect")
            .attr("class", "tooltip-bg")
            .attr("x", d3.select(this).attr("cx") - 140)
            .attr("y", d3.select(this).attr("cy") - 40)
            .attr("width", 300)
            .attr("height", 30)
            .attr("fill", "white")
            .attr("rx", 5)
            .attr("ry", 5)
            .style("box-shadow", "0px 0px 5px #999");
        
        // Append a text element to the tooltip
        tooltip.append("text")
            .attr("x", d3.select(this).attr("cx"))
            .attr("y", d3.select(this).attr("cy") - 20)
            .attr("class", "tooltip-text text")
            .text(`Name: ${d.name}, ${filter === 'buildstart' ? 'Building start: ' : filter.charAt(0).toUpperCase() + filter.slice(1)} ${d[filter]}`);
    }

    // Function to handle mouseout event
    function onMouseOut(e, d) {
        if (d[filter] >= minYear && d[filter] <= maxYear) {
            d3.select(this)
                .transition().attr("r", radius)  // Reset the radius
                .style("fill", colorScale(d[filter]));  // Reset the fill color
        } else {
            d3.select(this)
                .transition().attr("r", radius)  // Reset the radius
                .style("fill", unknownDataColor);  // Reset the fill color to unknown data color
        }
        svg.select("#stations-tooltip").remove();  // Remove the tooltip
    }
}

// Function to add tracks by year to the SVG element
function addTracksByYear(svg, dimensions, filter, tracks, projection, path, stroke = 1.5,
    unknownDataColor = "black", startInterpolate = "blue", endInterpolate = "red", hoverColor = "orange") {

    // Get the current year
    const d = new Date();
    let maxYear = d.getFullYear();
    
    // Get the years from the track data using the filter
    let trackYears = tracks.map(track => track[filter]);
    // Sort the years in ascending order
    trackYears.sort((a, b) => a - b);
    // Filter out any years that are less than 1600
    trackYears = trackYears.filter(year => year > 1600);

    // Get the minimum year from the filtered track years
    const minYear = trackYears[0];

    // Create a sequential color scale for the years
    const colorScale = d3.scaleSequential()
        .domain([minYear, maxYear])  // Set the domain from the minimum to maximum year
        .interpolator(d3.interpolateRgb(startInterpolate, endInterpolate));  // Use RGB interpolation between start and end colors

    // Bind track data to path elements in the SVG
    const trackSelection = svg.selectAll("path.track")
        .data(tracks, d => d.id);

    // Append new paths and update existing ones
    const paths = trackSelection
        .enter()
        .append("path")
        .attr("class", "track")
        .merge(trackSelection)
        .attr("d", d => path({ type: "LineString", coordinates: d.coordinates }))  // Use the projection path to draw the lines
        .style("fill", "none")
        .style("stroke-width", stroke)
        .style("stroke", d => {
            // Set the stroke color based on the year or use the unknown data color
            if (d[filter] >= minYear && d[filter] <= maxYear) {
                return colorScale(d[filter]);
            } else {
                return unknownDataColor;
            }
        })
        // Add event listeners for mouseover and mouseout events
        .on("mouseover", onMouseOver)
        .on("mouseout", onMouseOut);

    // Remove any paths that are no longer needed
    paths.exit().remove();

    // Legend settings
    const legendWidth = 300;
    const legendHeight = 10;

    // Append a group element to the SVG for the legend
    const legendSvg = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${dimensions.width - legendWidth - 10}, ${dimensions.height - legendHeight - 30})`);

    // Define a linear gradient for the legend
    const legendGradient = legendSvg.append("defs")
        .append("linearGradient")
        .attr("id", "legend-gradient");

    // Add gradient stops to the linear gradient
    legendGradient.selectAll("stop")
        .data(colorScale.ticks().map((t, i, n) => ({
            offset: `${100 * i / (n.length - 1)}%`,
            color: colorScale(t)
        })))
        .enter().append("stop")
        .attr("offset", d => d.offset)
        .attr("stop-color", d => d.color);

    // Append a rectangle to the legend and fill it with the gradient
    legendSvg.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#legend-gradient)");

    // Add a title to the legend
    legendSvg.append("text")
        .attr("class", "legend-title text")
        .attr("x", legendWidth / 2)
        .attr("y", -10)
        .attr("text-anchor", "middle")
        .text(`Track ${filter.charAt(0).toUpperCase() + filter.slice(1)} Year`);

    // Create a linear scale for the legend axis
    const legendScale = d3.scaleLinear()
        .domain([minYear, maxYear])
        .range([0, legendWidth]);

    // Create an axis for the legend using the scale
    const legendAxis = d3.axisBottom(legendScale)
        .tickValues(colorScale.ticks(6))  // Set the tick values based on the color scale ticks
        .tickFormat(d3.format("d"));  // Format the ticks as integers

    // Append the legend axis to the legend group
    legendSvg.append("g")
        .attr("class", "legend-axis")
        .attr("transform", `translate(0, ${legendHeight})`)
        .call(legendAxis);

    // Function to handle mouseover event
    function onMouseOver(e, d) {
        d3.select(this)
            .transition().style("stroke-width", stroke * 1.5)  // Increase the stroke width
            .style("stroke", hoverColor);  // Change the stroke color to hover color

        // Get the centroid of the path for the tooltip
        const [x, y] = path.centroid({ type: "LineString", coordinates: d.coordinates });

        // Create a tooltip group element in the SVG
        const tooltip = svg.append("g")
            .attr("id", "tracks-tooltip")
            .attr("class", "tracks-tooltip")
            .attr("transform", `translate(${x}, ${y - 40})`);

        // Append a rectangle to the tooltip for the background
        tooltip.append("rect")
            .attr("class", "tooltip-bg")
            .attr("x", -80)
            .attr("y", 0)
            .attr("width", 180)
            .attr("height", 30)
            .attr("fill", "white")
            .attr("rx", 5)
            .attr("ry", 5)
            .style("box-shadow", "0px 0px 5px #999");

        // Append a text element to the tooltip
        tooltip.append("text")
            .attr("x", 0)
            .attr("y", 20)
            .attr("class", "tooltip-text")
            .attr("text-anchor", "middle")
            .text(filter === 'buildstart' ? `Building start year: ${d[filter]}` : `Year: ${d[filter]}`);
    }

    // Function to handle mouseout event
    function onMouseOut(e, d) {
        if (d[filter] >= minYear && d[filter] <= maxYear) {
            d3.select(this)
                .transition().style("stroke-width", stroke)  // Reset the stroke width
                .style("stroke", colorScale(d[filter]));  // Reset the stroke color
        } else {
            d3.select(this)
                .transition().style("stroke-width", stroke)  // Reset the stroke width
                .style("stroke", unknownDataColor);  // Reset the stroke color to unknown data color
        }
        svg.select("#tracks-tooltip").remove();  // Remove the tooltip
    }
}

// Function to add systems to the SVG element
function addSystems(system, svg, path, projection, dimensions, toggles, colors, needToBeChecked = true) {
    // Get tracks that belong to specific system
    const tracks = system.lines.flatMap(line => line.tracks);
    // Get stations that belong to specific system
    const stations = system.lines.flatMap(line => line.stations);
    // Get lines that belong to specific system
    const lines = system.lines
    // If filter is checked and systems checkbox needs to be checked to display and it's checked 
    if (document.getElementById(toggles.tracks).checked) {
        if (needToBeChecked && document.getElementById(toggles.systems).checked) {
            addTracks(svg, path, tracks, colors.tracks, 1, colors.tracksHover);
        } else if (!needToBeChecked) {
            addTracks(svg, path, tracks, colors.tracks, 1, colors.tracksHover);
        }
    }
    if (document.getElementById(toggles.stations).checked) {
        if (needToBeChecked && document.getElementById(toggles.systems).checked) {
            addStations(svg, stations, projection, 1.5, colors.stations, colors.stationsHover);
        } else if (!needToBeChecked) {
            addStations(svg, stations, projection, 1.5, colors.stations, colors.stationsHover);
        }
    }
    if (document.getElementById(toggles.lines).checked) {
        if (needToBeChecked && document.getElementById(toggles.systems).checked) {
            addLines(svg, lines, path)
        } else if (!needToBeChecked) {
            addLines(svg, lines, path)
        }
    }
    if (document.getElementById(toggles.linesStations).checked) {
        if (needToBeChecked && document.getElementById(toggles.systems).checked) {
            addLineStations(svg, lines, projection)
        } else if (!needToBeChecked) {
            addLineStations(svg, lines, projection)
        }
    }
    if (document.getElementById(toggles.stationsByOpeningYear).checked) {
        if (needToBeChecked && document.getElementById(toggles.systems).checked) {
            addStationsByYear(svg, dimensions, 'opening', stations, projection, 1.5,
                colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover)
        } else if (!needToBeChecked) {
            addStationsByYear(svg, dimensions, 'opening', stations, projection, 1.5,
                colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover)
        }
    }
    if (document.getElementById(toggles.stationsByBuildYear).checked) {
        if (needToBeChecked && document.getElementById(toggles.systems).checked) {
            addStationsByYear(svg, dimensions, 'buildstart', stations, projection, 1.5,
                colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover)
        } else if (!needToBeChecked) {
            addStationsByYear(svg, dimensions, 'buildstart', stations, projection, 1.5,
                colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover)
        }
    }
    if (document.getElementById(toggles.tracksByOpeningYear).checked) {
        if (needToBeChecked && document.getElementById(toggles.systems).checked) {
            addTracksByYear(svg, dimensions, 'opening', tracks, projection, path, 1,
                colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover)
        } else if (!needToBeChecked) {
            addTracksByYear(svg, dimensions, 'opening', tracks, projection, path, 1,
                colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover)
        }
    }
    if (document.getElementById(toggles.tracksByBuildYear).checked) {
        if (needToBeChecked && document.getElementById(toggles.systems).checked) {
            addTracksByYear(svg, dimensions, 'buildstart', tracks, projection, path, 1,
                colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover)
        } else if (!needToBeChecked) {
            addTracksByYear(svg, dimensions, 'buildstart', tracks, projection, path, 1,
                colors.noData, colors.timelapsStart, colors.timelapsEnd, colors.timelapsHover)
        }
    }
}

// function to add zoom 
function zoomMap(dimensions, svg, tiles) {
    // Create D3 zoom behavior
    const zoom = d3.zoom()
        .scaleExtent([1, 8]) // Define the minimum and maximum zoom levels
        .translateExtent([[0, 0], [dimensions.width, dimensions.height]]) // Define the boundaries for panning
        .on("zoom", zoomed); // Add an event listener for the 'zoom' event

    // Function to be called when zooming
    function zoomed(event) {
        const { transform } = event; // Extract the transform object from the event

        // Calculate the maximum and minimum translation values based on the current zoom scale
        const maxTranslateX = Math.min(0, dimensions.width - dimensions.width * transform.k);
        const maxTranslateY = Math.min(0, dimensions.height - dimensions.height * transform.k);
        const minTranslateX = Math.max(0, dimensions.width * (1 - transform.k));
        const minTranslateY = Math.max(0, dimensions.height * (1 - transform.k));

        // Constrain the translation values
        const constrainedX = Math.min(minTranslateX, Math.max(maxTranslateX, transform.x));
        const constrainedY = Math.min(minTranslateY, Math.max(maxTranslateY, transform.y));

        // Apply the constrained transform
        const constrainedTransform = d3.zoomIdentity.translate(constrainedX, constrainedY).scale(transform.k);

        // Update the position and size of the tile images
        svg.selectAll("g.tile image:not(.legend-axis):not(.legend)")
            .attr("x", d => (d[0] + tiles.translate[0]) * tiles.scale * constrainedTransform.k + constrainedTransform.x)
            .attr("y", d => (d[1] + tiles.translate[1]) * tiles.scale * constrainedTransform.k + constrainedTransform.y)
            .attr("width", tiles.scale * constrainedTransform.k)
            .attr("height", tiles.scale * constrainedTransform.k);

        // Update the transform for all paths except for the legend and axes
        svg.selectAll("path:not(.legend-axis):not(.legend):not(.domain)")
            .attr("transform", constrainedTransform);

        // Update the transform for all circles
        svg.selectAll("circle")
            .attr("transform", constrainedTransform);

        // Update the transform for hexagons to scale with zoom
        svg.selectAll("path.hexagon")
            .attr("transform", d => `translate(${transform.apply([d.x, d.y])}) scale(${transform.k})`);
    }

    // Apply the zoom behavior to the SVG element
    svg.call(zoom);
    // Initially set the zoom transform to the identity transform (no scaling or translation)
    svg.call(zoom.transform, d3.zoomIdentity);

    // Add event listeners for zoom in and zoom out buttons
    d3.select("#zoom-in").on("click", function () {
        svg.transition().duration(500).call(zoom.scaleBy, 1.2); // Zoom in by a factor of 1.2
    });

    d3.select("#zoom-out").on("click", function () {
        svg.transition().duration(500).call(zoom.scaleBy, 0.8); // Zoom out by a factor of 0.8
    });
}
