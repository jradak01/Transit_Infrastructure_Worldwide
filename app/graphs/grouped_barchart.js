async function createGroupedBarChart(selector, data, title, xLabel, yLabel, width, height, colors, fields, xField, showAll = false, numToShow = 15, hiddenFields = []) {
    // Accessor function for x-axis field
    const xAccessor = d => d[xField];

    // Determine data to show based on the 'showAll' flag
    let dataToShow = showAll ? data : data.slice(0, numToShow);

    // Calculate sums of specified fields for sorting the data
    dataToShow.forEach(d => {
        d.sum = fields.reduce((acc, field) => {
            if (!hiddenFields.includes(field)) {
                return acc + parseFloat(d[field]) || 0;
            }
            return acc;
        }, 0);
    });

    // Sort data based on the calculated sum
    dataToShow.sort((a, b) => b.sum - a.sum);

    // Define dimensions for the chart, including margins
    const dimensions = {
        width: width,
        height: height,
        margins: {
            top: 50,
            right: width > 700 ? 180 : 160,
            bottom: 80,
            left: 60
        }
    };
    dimensions.bordWidth = dimensions.width - dimensions.margins.left - dimensions.margins.right;
    dimensions.bordHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

    // Initialize the SVG element
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    // Create a group element for the chart area with margins applied
    const borders = svg.append("g")
        .style("transform", `translate(${dimensions.margins.left}px, ${dimensions.margins.top}px)`);

    // Initialize the scales for the x and y axes
    const x0Scale = d3.scaleBand()
        .domain(dataToShow.map(d => xAccessor(d)))
        .range([0, dimensions.bordWidth])
        .padding(0.1);

    const x1Scale = d3.scaleBand()
        .domain(fields.filter(field => !hiddenFields.includes(field)))
        .range([0, x0Scale.bandwidth()])
        .padding(0.05);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(dataToShow, d => d3.max(fields, field => hiddenFields.includes(field) ? 0 : parseFloat(d[field])))])
        .range([dimensions.bordHeight, 0]);

    // Initialize the color scale
    const colorScale = d3.scaleOrdinal()
        .domain(fields)
        .range(Object.values(colors.start).slice(0, fields.length));

    // Draw the grouped bars
    const bars = borders.selectAll(".bar")
        .data(dataToShow)
        .enter().append("g")
        .attr("transform", d => `translate(${x0Scale(xAccessor(d))},0)`);

    bars.selectAll("rect")
        .data(d => fields.filter(field => !hiddenFields.includes(field)).map(field => ({ field: field, value: d[field], xField: xAccessor(d) })))
        .enter().append("rect")
        .attr("x", d => x1Scale(d.field))
        .attr("width", x1Scale.bandwidth())
        .attr("fill", d => colorScale(d.field))
        .attr("y", dimensions.bordHeight) // Start at the bottom of the chart
        .attr("height", 0) // Start with a height of 0
        .on("mouseover", onMouseOver)
        .on("mouseout", onMouseOut)
        .transition() // Add a transition
        .duration(800) // Duration of the transition in milliseconds
        .attr("y", d => yScale(d.value)) // Transition to the correct y position
        .attr("height", d => dimensions.bordHeight - yScale(d.value));

    // Draw the x-axis
    const xAxis = d3.axisBottom(x0Scale);
    borders.append("g")
        .attr("transform", `translate(0,${dimensions.bordHeight})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .attr("class", "x-axis text")
        .style("text-anchor", "end");

    // Draw the y-axis
    const yAxis = d3.axisLeft(yScale);
    borders.append("g")
        .call(yAxis)
        .selectAll("text")
        .attr("class", "y-axis text");

    // Add y-axis label
    svg.append("text")
        .attr("transform", `translate(${dimensions.margins.left / 5}, ${dimensions.height / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label text")
        .text(yLabel);

    // Add x-axis label
    svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height - dimensions.margins.bottom / 5)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label text")
        .text(xLabel);

    // Add chart title
    svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.margins.top / 2)
        .attr("class", "title text")
        .style("cursor", "pointer")
        .text(title)
        .on("click", onClickTitle);

    // Add legend
    const legend = svg.append("g")
        .attr("transform", `translate(${dimensions.width - dimensions.margins.right + 20}, ${dimensions.margins.top})`);

    const legendItems = legend.selectAll(".legend-item")
        .data(fields)
        .enter().append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20})`)
        .on("click", onClickLegend);

    // Add colored rectangles to legend
    legendItems.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 18)
        .attr("height", 18)
        .attr("fill", d => hiddenFields.includes(d) ? 'lightgrey' : colorScale(d));

    // Add text labels to legend
    legendItems.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("class", "text legend-text")
        .attr("dy", "0.35em")
        .text(d => formatText(d));

    // Interaction functions
    function onMouseOver(e, d) {
        // Change bar color on hover
        d3.select(this).attr("fill", colors.hover);

        // Add value label on hover
        borders.append("text")
            .attr("class", "bar-label")
            .attr("x", parseFloat(d3.select(this).attr("x")) + x1Scale.bandwidth() / 2 + x0Scale(d.xField))
            .attr("y", yScale(d.value) - 5)
            .attr("text-anchor", "middle")
            .attr("fill", "darkgrey")
            .style("font-size", "12px")
            .text(Number.isInteger(d.value) ? d.value : d.value.toFixed(2));
    }

    function onMouseOut(e, d) {
        // Revert bar color on mouse out
        d3.select(this).attr("fill", colorScale(d.field));

        // Remove value label
        d3.selectAll(".bar-label").remove();
    }

    function onClickTitle(e) {
        // Toggle showing all data on title click
        showAll = !showAll;

        // Re-render the chart with updated data
        d3.select(selector).selectAll("svg").remove();
        createGroupedBarChart(selector, data, title, xLabel, yLabel, width, height, colors, fields, xField, showAll, numToShow, hiddenFields);
    }

    function onClickLegend(e, field) {
        // Toggle visibility of fields in the legend
        const isActive = hiddenFields.includes(field);
        const newHiddenFields = isActive ? hiddenFields.filter(f => f !== field) : [...hiddenFields, field];

        // Re-render the chart with updated hidden fields
        d3.select(selector).selectAll("svg").remove();
        createGroupedBarChart(selector, data, title, xLabel, yLabel, width, height, colors, fields, xField, showAll, numToShow, newHiddenFields);
    }
}
