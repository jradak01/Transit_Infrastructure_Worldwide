function createYearSlider(selector, startYear, endYear, onUpdate, graphWidth = 1200) {
    // Determine slider dimensions based on graph width
    const sliderWidth = graphWidth < 600 ? 320 : 400;
    const sliderHeight = graphWidth < 600 ? 35 : 60;

    // Append an SVG element to the selected container
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", sliderWidth)
        .attr("height", sliderHeight)
        .attr("class", "year-slider");

    // Set margins based on graph width
    const margin = graphWidth < 600 ? { top: 0, right: 10, bottom: 20, left: 5 } : { top: 20, right: 20, bottom: 20, left: 20 };
    const width = sliderWidth - margin.left - margin.right;
    const height = sliderHeight - margin.top - margin.bottom;

    // Initialize the x scale
    const x = d3.scaleLinear()
        .domain([startYear, endYear])
        .range([0, width])
        .clamp(true);

    // Create the brush for selecting a range
    const brush = d3.brushX()
        .extent([[0, 0], [width, height]])
        .on("brush end", brushed);

    // Append a group element for the brush
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Add the x-axis with grid lines
    g.append("g")
        .attr("class", "axis axis--grid")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(10).tickSize(-height))
        .select(".domain")
        .remove();

    // Add the brush selection element
    const brushSelection = g.append("g")
        .attr("class", "brush")
        .call(brush)
        .call(brush.move, [startYear, endYear].map(x));

    // Add custom handles for the brush
    g.selectAll(".handle--custom")
        .data([{ type: "w" }, { type: "e" }])
        .enter().append("path")
        .attr("class", "handle--custom")
        .attr("fill", "#666")
        .attr("fill-opacity", 0.8)
        .attr("stroke", "#000")
        .attr("stroke-width", 1.5)
        .attr("cursor", "ew-resize")
        .attr("d", d3.symbol().type(d3.symbolCircle).size(200))
        .attr("display", "none");

    // Event handler for brush events
    function brushed(event) {
        if (event.sourceEvent && event.sourceEvent.type === "zoom") return; // Ignore brush-by-zoom
        const selection = event.selection || x.range();
        const [newStartYear, newEndYear] = selection.map(x.invert);
        onUpdate(newStartYear, newEndYear); // Call the update function with the new year range
    }
}

function createLineChart(selector, countryData, cityData, countryDataBuild, cityDataBuild,
    country, city, titleBefore, titleAfter, xLabel, yLabel, width, height, radius = 3, colors, ySelectorBefore, ySelectorAfter) {

    // Accessor for the x-axis data
    const xAccessorYear = d => d.name;
    let currentYSelector = ySelectorBefore;
    let currentTitle = titleBefore;

    // Set chart dimensions and margins
    let dimensions = {
        width: width,
        height: height,
        margins: {
            top: 50,
            right: width <= 600 ? 100 : 180,
            bottom: width <= 600 ? 20 : 50,
            left: 50,
        },
    };

    dimensions.bordWidth = dimensions.width - dimensions.margins.left - dimensions.margins.right;
    dimensions.bordHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

    // Append an SVG element to the selected container
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height)
        .attr("class", "line-chart");

    // Append a group element for chart borders
    const borders = svg.append("g")
        .style("transform", `translate(${dimensions.margins.left}px, ${dimensions.margins.top}px)`);

    // Initialize the x scale for years
    const xScaleYear = d3.scaleLinear()
        .domain(d3.extent(countryData.concat(cityData, countryDataBuild, cityDataBuild), xAccessorYear))
        .range([0, dimensions.bordWidth]);

    // Function to get the y scale based on data and accessor
    function getYScale(data, accessor) {
        return d3.scaleLinear()
            .domain([0, Math.max(
                d3.max(countryData, accessor),
                d3.max(cityData, accessor),
                d3.max(countryDataBuild, accessor),
                d3.max(cityDataBuild, accessor)
            )])
            .range([dimensions.bordHeight, 0]);
    }

    // Initialize the y scale
    let yScale = getYScale(countryData.concat(cityData, countryDataBuild, cityDataBuild), currentYSelector);

    // Initialize the line generator
    const line = d3.line()
        .x(d => xScaleYear(xAccessorYear(d)))
        .y(d => yScale(currentYSelector(d)));

    // Function to draw the chart
    function drawChart() {
        borders.selectAll(".line, .point").remove();

        // Draw lines for different data sets
        drawLine(borders, countryData, line, colors.country, "country-year-line");
        drawLine(borders, cityData, line, colors.city, "city-year-line");
        drawLine(borders, countryDataBuild, line, colors.buildstartCountry, "country-buildstart-line");
        drawLine(borders, cityDataBuild, line, colors.buildstartCity, "city-buildstart-line");

        // Draw points for different data sets
        drawPoints(borders, countryData, xScaleYear, yScale, xAccessorYear, currentYSelector, colors.country, "point country-year");
        drawPoints(borders, cityData, xScaleYear, yScale, xAccessorYear, currentYSelector, colors.city, "point city-year");
        drawPoints(borders, countryDataBuild, xScaleYear, yScale, xAccessorYear, currentYSelector, colors.buildstartCountry, "point country-buildstart");
        drawPoints(borders, cityDataBuild, xScaleYear, yScale, xAccessorYear, currentYSelector, colors.buildstartCity, "point city-buildstart");
    }

    // Draw the initial chart
    drawChart();

    // Add the x-axis
    const xAxis = d3.axisBottom(xScaleYear).ticks(5).tickSizeOuter(0);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickSizeOuter(0);

    borders.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${dimensions.bordHeight})`)
        .call(xAxis);

    borders.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Add x-axis label
    svg.append("text")
        .attr("x", dimensions.width / 2 - dimensions.margins.right / 2)
        .attr("y", dimensions.width <= 600 ? dimensions.height : dimensions.height - 10)
        .attr("class", "axis-label text")
        .text(xLabel);

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -dimensions.height / 2)
        .attr("y", 15)
        .attr("class", "axis-label text")
        .text(yLabel);

    // Add the chart title with interaction to toggle between views
    const titleText = svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.margins.top / 2)
        .attr("class", "title text")
        .style("cursor", "pointer")
        .text(`${currentTitle} for ${country} and ${city}`)
        .on("click", () => {
            currentYSelector = currentYSelector === ySelectorBefore ? ySelectorAfter : ySelectorBefore;
            currentTitle = currentTitle === titleBefore ? titleAfter : titleBefore;
            yScale = getYScale(countryData.concat(cityData, countryDataBuild, cityDataBuild), currentYSelector);
            borders.select(".y-axis").call(yAxis.scale(yScale));
            drawChart();
            titleText.text(`${currentTitle} for ${country} and ${city}`);
        });

    // Add a legend to the chart
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${dimensions.width - dimensions.margins.right}, ${dimensions.margins.top})`);

    // Add legend items
    addLegendItem(legend, 0, colors.country, `Year ${country}`, "country-year-line", "country-year");
    addLegendItem(legend, 20, colors.city, `Year ${city}`, "city-year-line", "city-year");
    addLegendItem(legend, 40, colors.buildstartCountry, `Building start ${country}`, "country-buildstart-line", "country-buildstart");
    addLegendItem(legend, 60, colors.buildstartCity, `Building start ${city}`, "city-buildstart-line", "city-buildstart");

    // Create a tooltip for point interaction
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("padding", "5px")
        .style("border-radius", "5px")
        .style("pointer-events", "none");

    // Function to draw a line
    function drawLine(borders, data, line, color, className) {
        borders.append("path")
            .datum(data)
            .attr("class", `line ${className}`)
            .attr("stroke", color)
            .attr("fill", "none")
            .attr("d", line)
            .attr("stroke-dasharray", function () { return this.getTotalLength(); })
            .attr("stroke-dashoffset", function () { return this.getTotalLength(); })
            .transition()
            .duration(2000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0);
    }

    // Function to draw points
    function drawPoints(borders, data, xScale, yScale, xAccessor, yAccessor, color, className) {
        borders.selectAll(`.${className}`)
            .data(data)
            .enter().append("circle")
            .attr("class", className)
            .attr("cx", d => xScale(xAccessor(d)))
            .attr("cy", d => yScale(yAccessor(d)))
            .attr("r", d => yAccessor(d) === 0 ? 1 : radius)
            .attr("fill", color)
            .on("mouseover", onMouseOver)
            .on("mouseout", onMouseOut);
    }

    // Event handler for mouseover on points
    function onMouseOver(e, d) {
        d3.select(this).transition().attr("r", 6);
        tooltip.transition().style("opacity", 1);
        tooltip.html(`Year: ${xAccessorYear(d)}<br>Stations: ${currentYSelector(d)}`)
            .style("left", (e.pageX + 5) + "px")
            .style("top", (e.pageY - 28) + "px");
    }

    // Event handler for mouseout on points
    function onMouseOut(e, d) {
        d3.select(this).transition().attr("r", d => currentYSelector(d) === 0 ? 1 : radius);
        tooltip.transition().style("opacity", 0);
    }

    // Function to add a legend item
    function addLegendItem(legend, y, color, text, lineClass, pointClass) {
        const rect = legend.append("rect")
            .attr("x", 0)
            .attr("y", y)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", color)
            .on("click", function () {
                toggleVisibility(borders, `.${lineClass}`, `.${pointClass}`, rect, color);
            });

        legend.append("text")
            .attr("class", "legend-text text")
            .attr("x", 15)
            .attr("y", y + 10)
            .attr("text-anchor", "start")
            .text(text)
            .on("click", function () {
                toggleVisibility(borders, `.${lineClass}`, `.${pointClass}`, rect, color);
            });
    }

    // Function to toggle the visibility of lines and points
    function toggleVisibility(borders, lineClass, pointClass, rect, color) {
        const lines = borders.selectAll(lineClass);
        const points = borders.selectAll(pointClass);
        const isVisible = lines.style("display") !== "none";
        lines.style("display", isVisible ? "none" : null);
        points.style("display", isVisible ? "none" : null);

        rect.attr("fill", isVisible ? "grey" : color);
    }

    // Add unique ID for range sliders
    const chartId = Math.random().toString(36).substring(2, 9);

    // Add range slider for year range
    const startYear = d3.min(countryData.concat(cityData, countryDataBuild, cityDataBuild), xAccessorYear);
    const endYear = d3.max(countryData.concat(cityData, countryDataBuild, cityDataBuild), xAccessorYear);

    // Function to update chart with new year range
    function updateChart(newStartYear, newEndYear) {
        d3.select(selector).select(".year-display").text(`Year range: ${Math.round(newStartYear)} - ${Math.round(newEndYear)}`);

        const filteredCountryData = countryData.filter(d => xAccessorYear(d) >= newStartYear && xAccessorYear(d) <= newEndYear);
        const filteredCityData = cityData.filter(d => xAccessorYear(d) >= newStartYear && xAccessorYear(d) <= newEndYear);
        const filteredCountryDataBuild = countryDataBuild.filter(d => xAccessorYear(d) >= newStartYear && xAccessorYear(d) <= newEndYear);
        const filteredCityDataBuild = cityDataBuild.filter(d => xAccessorYear(d) >= newStartYear && xAccessorYear(d) <= newEndYear);

        xScaleYear.domain([newStartYear, newEndYear]);

        borders.selectAll(".line").remove();
        borders.selectAll(".point").remove();

        drawLine(borders, filteredCountryData, line, colors.country, "country-year-line");
        drawLine(borders, filteredCityData, line, colors.city, "city-year-line");
        drawLine(borders, filteredCountryDataBuild, line, colors.buildstartCountry, "country-buildstart-line");
        drawLine(borders, filteredCityDataBuild, line, colors.buildstartCity, "city-buildstart-line");

        drawPoints(borders, filteredCountryData, xScaleYear, yScale, xAccessorYear, currentYSelector, colors.country, "point country-year");
        drawPoints(borders, filteredCityData, xScaleYear, yScale, xAccessorYear, currentYSelector, colors.city, "point city-year");
        drawPoints(borders, filteredCountryDataBuild, xScaleYear, yScale, xAccessorYear, currentYSelector, colors.buildstartCountry, "point country-buildstart");
        drawPoints(borders, filteredCityDataBuild, xScaleYear, yScale, xAccessorYear, currentYSelector, colors.buildstartCity, "point city-buildstart");

        borders.select(".x-axis").call(xAxis.scale(xScaleYear));
        borders.select(".y-axis").call(yAxis);
    }

    // Create the year slider
    createYearSlider(selector, startYear, endYear, updateChart, dimensions.width);

    // Add a container for the slider
    d3.select(selector)
        .append("div")
        .attr("class", "year-slider-container")
        .append(() => d3.select(selector).select("svg.year-slider").node());
}
