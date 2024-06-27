async function createScatterPlot(selector, data, xData, yData, rData, colorData = false, rSizes = [3, 20],
    colors, scale = 'linear',
    xLabel = '', yLabel = '', titleText = '', colorLabel = '', dotLabel = '',
    width = 600, height = 400) {

    // Accessor functions to extract data values for x, y, radius, and color
    const xAccessor = d => d[xData];
    const yAccessor = d => d[yData];
    const rAccessor = d => d[rData];
    const colorAccessor = colorData ? d => d[colorData] : null;

    // Formatting function for integer values
    const formatInteger = d3.format(".0f");

    // Set dimensions and margins for the scatter plot
    const dimensions = {
        width: width,
        height: height,
        margins: {
            top: 100,
            right: 160,
            bottom: 50,
            left: 50
        }
    };
    dimensions.bordWidth = dimensions.width - dimensions.margins.left - dimensions.margins.right;
    dimensions.bordHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

    // Initialize SVG element
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    // Create group for plot borders
    const borders = svg.append("g")
        .style("transform", `translate(${dimensions.margins.left}px, ${dimensions.margins.top}px)`);

    // Define scales for the plot
    const defineScales = () => {
        // X scale
        const xScale = scale === 'linear' ?
            d3.scaleLinear()
                .domain(d3.extent(data, xAccessor))
                .range([0, dimensions.bordWidth]) :
            d3.scaleLog()
                .domain(d3.extent(data, xAccessor))
                .range([0, dimensions.bordWidth])
                .nice();

        // Y scale
        const yScale = scale === 'linear' ?
            d3.scaleLinear()
                .domain(d3.extent(data, yAccessor))
                .range([dimensions.bordHeight, 0]) :
            d3.scaleLog()
                .domain(d3.extent(data, yAccessor))
                .range([dimensions.bordHeight, 0])
                .nice();

        // Radius scale
        const rScale = d3.scaleSqrt()
            .domain(d3.extent(data, rAccessor))
            .range(rSizes);

        // Color scale
        const colorScale = colorData ? d3.scaleSequential()
            .domain(d3.extent(data, colorAccessor))
            .interpolator(d3.interpolateRgb(colors.startInterpolate, colors.endInterpolate)) : null;

        return { xScale, yScale, rScale, colorScale };
    };

    // Initialize scales
    let { xScale, yScale, rScale, colorScale } = defineScales();

    // Add X axis
    const xAxisGen = d3.axisBottom().scale(xScale);
    const xAxis = borders.append("g")
        .call(xAxisGen)
        .style("transform",
            `translateY(${dimensions.bordHeight}px)`);

    // Add Y axis
    const yAxisGen = d3.axisLeft()
        .scale(yScale);
    const yAxis = borders.append("g")
        .call(yAxisGen);

    // Add X axis label
    const xAxisLabel = svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height - dimensions.margins.bottom / 5)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label text")
        .text(xLabel);

    // Add Y axis label
    const yAxisLabel = svg.append("text")
        .attr("transform", `translate(${dimensions.margins.left / 5}, ${dimensions.height / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label text")
        .text(yLabel);

    // Add plot title
    const title = svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.margins.top / 2)
        .attr("class", "title text")
        .text(titleText)
        .on('click', function(){
            // Toggle between linear and log scales on title click
            scale = scale === 'linear' ? 'log' : 'linear';
            ({ xScale, yScale, rScale, colorScale } = defineScales());
            renderPlot();
        });

    // Function to draw dots on the plot
    const drawDots = (data, colors) => {
        const dots = borders.selectAll("circle").data(data);

        dots.join("circle")
            .attr("cx", d => xScale(xAccessor(d)))
            .attr("cy", d => yScale(yAccessor(d)))
            .attr("r", d => rScale(rAccessor(d)))
            .attr("fill", colorData ? d => colorScale(colorAccessor(d)) : colors.dot)
            .on("mouseover", onMouseOver)
            .on("mouseout", onMouseOut);
    };

    // Mouseover interaction
    function onMouseOver(e, d) {
        // Enlarge dot on hover and change color
        d3.select(e.target).transition().attr("r", rScale(rAccessor(d)) * 1.5)
            .style("fill", colors.hover);

        // Calculate tooltip position
        const x = +d3.select(e.target).attr("cx") + dimensions.margins.left;
        const y = +d3.select(e.target).attr("cy") + dimensions.margins.top;

        // Tooltip text content
        const tooltipTextName = `${d.name}`;
        const tooltipText1 = `${formatText(yData)}: ${formatInteger(yAccessor(d))}`;
        const tooltipText2 = `${formatText(xData)}: ${formatInteger(xAccessor(d))}`;
        const tooltipText3 = `${formatText(rData)}: ${formatInteger(rAccessor(d))}`;
        const tooltipText4 = colorData ? `${formatText(colorData)}: ${formatInteger(colorAccessor(d))}` : '';

        // Append tooltip group
        const tooltipGroup = svg.append("g")
            .attr("id", "city-tooltip")
            .attr("class", "city-tooltip");

        const tooltipWidth = 200;
        const tooltipHeight = 120;

        let tooltipX = x;
        let tooltipY = y - tooltipHeight - 10;

        // Adjust tooltip position if it goes out of bounds
        if (tooltipX + tooltipWidth > dimensions.width) {
            tooltipX -= tooltipWidth;
        }
        if (tooltipY < 0) {
            tooltipY = y + 10;
        }

        // Draw tooltip background
        tooltipGroup.append("rect")
            .attr("x", tooltipX)
            .attr("y", tooltipY)
            .attr("width", tooltipWidth)
            .attr("height", tooltipHeight)
            .attr("class", "tooltip-bg")
            .attr("rx", 5)
            .attr("ry", 5);

        // Append tooltip text
        const lineHeight = 18;

        tooltipGroup.append("text")
            .attr("x", tooltipX + 10)
            .attr("y", tooltipY + 20)
            .attr("text-anchor", "start")
            .attr("class", "tooltip-main-text text")
            .text(tooltipTextName);

        tooltipGroup.append("text")
            .attr("x", tooltipX + 10)
            .attr("y", tooltipY + 20 + lineHeight + 3)
            .attr("text-anchor", "start")
            .attr("class", "city-tooltip text")
            .text(tooltipText1);

        tooltipGroup.append("text")
            .attr("x", tooltipX + 10)
            .attr("y", tooltipY + 20 + lineHeight * 2 + 3)
            .attr("text-anchor", "start")
            .attr("class", "city-tooltip text")
            .text(tooltipText2);

        tooltipGroup.append("text")
            .attr("x", tooltipX + 10)
            .attr("y", tooltipY + 20 + lineHeight * 3 + 3)
            .attr("text-anchor", "start")
            .attr("class", "city-tooltip text")
            .text(tooltipText3);

        if (tooltipText4) {
            tooltipGroup.append("text")
                .attr("x", tooltipX + 10)
                .attr("y", tooltipY + 20 + lineHeight * 4 + 3)
                .attr("text-anchor", "start")
                .attr("class", "city-tooltip text")
                .text(tooltipText4);
        }
    }

    // Mouseout interaction
    function onMouseOut(e, d) {
        // Reset dot size and color on mouseout
        d3.select(e.target).transition().attr("r", rScale(rAccessor(d)))
            .style("fill", colorData ? d => colorScale(colorAccessor(d)) : colors.dot);
        // Remove tooltip
        svg.select("#city-tooltip").remove();
    }

    // Render the plot
    const renderPlot = () => {
        // Clear existing axes and dots
        xAxis.call(xAxisGen.scale(xScale));
        yAxis.call(yAxisGen.scale(yScale));
        drawDots(data, colors);
    };

    renderPlot();

    // Add color legend if color data is provided
    if (colorData) {
        const colorLegend = svg.append("g")
            .attr("class", "legend-color")
            .attr("transform", `translate(${dimensions.width - dimensions.margins.right + 10}, ${dimensions.margins.top})`);

        // Legend title
        colorLegend.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("class", "legend-title text")
            .text(colorLabel);

        const colorLegendData = d3.range(0, 1, 0.1).map(d => d3.interpolate(d3.min(data, colorAccessor), d3.max(data, colorAccessor))(d));

        const legendItemHeight = 20;
        const titleHeight = 20;

        // Append color rectangles to the legend
        colorLegend.selectAll("rect")
            .data(colorLegendData)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * legendItemHeight + titleHeight)
            .attr("width", 20)
            .attr("height", 20)
            .attr("fill", d => colorScale(d));

        // Append labels to the legend
        colorLegend.selectAll("text.legend-label")
            .data(colorLegendData)
            .enter().append("text")
            .attr("class", "legend-label text")
            .attr("x", 30)
            .attr("y", (d, i) => i * legendItemHeight + titleHeight + 15)
            .text(d => d3.format(".0f")(d));
    }

    // Add size legend
    const sizeLegend = svg.append("g")
        .attr("class", "legend-size")
        .attr("transform", `translate(${dimensions.width - dimensions.margins.right + 10}, ${dimensions.margins.top + 150})`);

    const legendItemHeight = 25;
    const titleHeight = 20;

    // Size legend title
    sizeLegend.append("text")
        .attr("x", 0)
        .attr("y", legendItemHeight + titleHeight + 50)
        .attr("class", "legend-title text")
        .text(dotLabel);

    const sizeLegendData = [d3.min(data, rAccessor), d3.max(data, rAccessor)];

    // Append circles to the size legend
    sizeLegend.selectAll("circle")
        .data(sizeLegendData)
        .enter().append("circle")
        .attr("cx", 10)
        .attr("cy", (d, i) => i * legendItemHeight + titleHeight + 100)
        .attr("r", d => rScale(d))
        .attr("class", "empty-circle");

    // Append labels to the size legend
    sizeLegend.selectAll("text.legend-label")
        .data(sizeLegendData)
        .enter().append("text")
        .attr("class", "legend-label text")
        .attr("x", 30)
        .attr("y", (d, i) => i * legendItemHeight + titleHeight + 105)
        .text(d => formatInteger(d));
}
