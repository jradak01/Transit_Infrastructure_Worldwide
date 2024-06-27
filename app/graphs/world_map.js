async function showWorldMap(selector, colorLess10Data = 'blue', 
    colorLess100Data = 'red', colorMoreData = 'green', 
    eventColor = 'orange') {

    // Fetch city and track data
    const { cities, tracks } = await getData(['cities', 'tracks']);
    const worldData = await d3.json("../data/world-geojson.json");

    // Merge city and track data, and count the number of tracks by city
    const mergedData = mergeDataByCity(cities, tracks, 'tracks', true, true); // by city
    let trackCounts = countDataByGroupedAttribute(mergedData, 'tracks'); // count number of tracks by city
    trackCounts = splitCoordinates(trackCounts);

    // Accessor functions
    const cityNameAccessor = d => d.name;
    const trackNumberAccessor = d => d.tracks_count;
    const cityCoordinates = d => d.coordinates;

    // Graph dimensions
    let dimensions = {
        width: window.innerWidth * 0.8,
        margins: {
            top: 80,
            right: 10,
            bottom: 20,
            left: 10,
        },
    };

    // Adjust border dimensions
    dimensions.bordWidth = dimensions.width - dimensions.margins.left - dimensions.margins.right;
    const sphere = { type: "Sphere" };

    // Define map projection and path generator
    const projection = d3.geoEqualEarth()
        .fitWidth(dimensions.bordWidth, sphere);
    const pathGenerator = d3.geoPath(projection);
    const [[x0, y0], [x1, y1]] = pathGenerator.bounds(sphere);

    // Adjust height based on projection bounds
    dimensions.bordHeight = y1;
    dimensions.height = dimensions.bordHeight + dimensions.margins.top + dimensions.margins.bottom;

    // Initialize SVG element
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .call(d3.zoom()
            .scaleExtent([1, 8]) // Set zoom scale limits
            .on("zoom", zoomed)
        );

    // Create group for map borders
    const borders = svg.append("g")
        .attr("transform", `translate(${dimensions.margins.left}, ${dimensions.margins.top})`);

    const path = d3.geoPath().projection(projection);

    // Draw seas and oceans
    borders.append("path")
        .datum({ type: "Sphere" })
        .attr("d", path)
        .attr("class", "sea");

    // Draw land
    borders.selectAll("path")
        .data(worldData.features)
        .enter().append("path")
        .attr("d", path)
        .attr("class", "land");

    // Draw city circles
    const cityCircles = borders.selectAll("circle")
        .data(trackCounts)
        .enter().append("circle")
        .attr("cx", d => projection(cityCoordinates(d))[0])
        .attr("cy", d => projection(cityCoordinates(d))[1])
        .attr("r", d => trackNumberAccessor(d) > 0 ? trackNumberAccessor(d) <= 10 ? 1.5 : trackNumberAccessor(d) <= 100 ? 2 : 3 : 0)
        .attr("fill", d => trackNumberAccessor(d) <= 10 ? colorLess10Data : trackNumberAccessor(d) <= 100 ? colorLess100Data : colorMoreData)
        .attr("pointer-events", "all")
        .on("mouseover", onMouseOver)
        .on("mouseout", onMouseLeave)
        .on("click", onClick);

    // Add title to the map
    svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.margins.top / 2)
        .attr("text-anchor", "middle")
        .attr("class", "title text")
        .text("Available Cities to Explore");

    // Add legend to the map
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${dimensions.margins.left}, ${dimensions.margins.top + 20})`);

    // Legend for "< 10 Tracks"
    legend.append("circle")
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("r", 3)
        .attr("fill", colorLess10Data);
    legend.append("text")
        .attr("x", 10)
        .attr("y", 0)
        .attr("dy", "0.35em")
        .attr("class", "text")
        .text("< 10 Tracks");

    // Legend for "10 - 100 Tracks"
    legend.append("circle")
        .attr("cx", 0)
        .attr("cy", 20)
        .attr("r", 3.5)
        .attr("fill", colorLess100Data);
    legend.append("text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("dy", "0.35em")
        .attr("class", "text")
        .text("10 - 100 Tracks");

    // Legend for "> 100 Tracks"
    legend.append("circle")
        .attr("cx", 0)
        .attr("cy", 40)
        .attr("r", 4)
        .attr("fill", colorMoreData);
    legend.append("text")
        .attr("x", 10)
        .attr("y", 40)
        .attr("dy", "0.35em")
        .attr("class", "text")
        .text("> 100 Tracks");

    // Zoom function to handle zoom interactions
    function zoomed(event) {
        const { transform } = event;
        const scale = transform.k;

        // Calculate new translation boundaries
        const translateX = Math.min(0, Math.max(transform.x, dimensions.width - dimensions.bordWidth * scale));
        const translateY = Math.min(0, Math.max(transform.y, dimensions.height - dimensions.bordHeight * scale));

        // Apply constrained transform
        const constrainedTransform = d3.zoomIdentity.translate(translateX, translateY).scale(scale);

        // Update transform and stroke width
        borders.attr("transform", scale < 2 ? `translate(${dimensions.margins.left}, ${dimensions.margins.top})` : constrainedTransform);
        borders.attr("stroke-width", 1 / scale);

        // Adjust the size of the circles based on the zoom level
        cityCircles.attr("r", d => scale < 2 ? (trackNumberAccessor(d) > 0 ? trackNumberAccessor(d) <= 10 ? 1.5 : trackNumberAccessor(d) <= 100 ? 2 : 3 : 0)
            : scale <= 4 ? (trackNumberAccessor(d) > 0 ? trackNumberAccessor(d) <= 10 ? 1.5 : trackNumberAccessor(d) <= 100 ? 2 : 3 : 0) / scale : (trackNumberAccessor(d) > 0 ? trackNumberAccessor(d) <= 10 ? 1.5 : trackNumberAccessor(d) <= 100 ? 2 : 3 : 0) / scale * 3);
    }

    // Mouseover interaction
    function onMouseOver(e, d) {
        const zoomLevel = d3.zoomTransform(svg.node()).k;
        d3.select(this)
            .attr('r', zoomLevel < 6 ? 4 / zoomLevel : 10 / zoomLevel) // Adjust size for zoom level
            .style("fill", eventColor);

        // Remove any existing tooltips
        svg.select("#city-tooltip").remove();

        // Get coordinates for positioning the tooltip
        const x = +d3.select(this).attr("cx");
        const y = +d3.select(this).attr("cy") - 5;

        // Append group for tooltip
        const tooltipGroup = svg.append("g")
            .attr("id", "city-tooltip");

        // Append rectangle for tooltip background
        tooltipGroup.append("rect")
            .attr("x", x - 100)
            .attr("y", y - 18)
            .attr("width", 220)
            .attr("height", 32)
            .attr("class", "tooltip-bg")
            .attr("rx", 5)
            .attr("ry", 5);

        // Append text for tooltip
        tooltipGroup.append("text")
            .attr("x", x)
            .attr("y", y)
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .attr("class", "city-tooltip text")
            .text(`City: ${cityNameAccessor(d)}, Tracks: ${trackNumberAccessor(d)}`);
    }

    // Mouseout interaction
    function onMouseLeave(e, d) {
        const zoomLevel = d3.zoomTransform(svg.node()).k;
        d3.select(this)
            .attr('r', zoomLevel < 2 ?
                (trackNumberAccessor(d) > 0 ? trackNumberAccessor(d) <= 10 ? 1.5 : trackNumberAccessor(d) <= 100 ? 2 : 3 : 0)
                : zoomLevel <= 4 ?
                    (trackNumberAccessor(d) > 0 ? trackNumberAccessor(d) <= 10 ? 1.5 : trackNumberAccessor(d) <= 100 ? 2 : 3 : 0) / zoomLevel
                    : (trackNumberAccessor(d) > 0 ? trackNumberAccessor(d) <= 10 ? 1.5 : trackNumberAccessor(d) <= 100 ? 2 : 3 : 0) / zoomLevel * 3)  // Adjust size for zoom level
            .style("fill", d => trackNumberAccessor(d) <= 10 ? colorLess10Data :
                trackNumberAccessor(d) <= 100 ? colorLess100Data :
                    colorMoreData)
            .style('stroke', 'none');
        svg.select("#city-tooltip").remove();
    }

    // Click interaction
    function onClick(e, d) {
        const city = cities.filter(city => city.id === d.id);
        chooseCity(city[0]);
    }
}
