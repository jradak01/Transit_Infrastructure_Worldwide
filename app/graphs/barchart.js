async function createBarChart(xAccessor, yAccessor, selector, data, title, xLabel, yLabel, width, height, colors, horizontal = false, expandable = false, sliceSize = null) {
    // Determine initial data set based on whether the chart is expandable and the slice size
    let initialData = expandable ? data.slice(0, sliceSize) : data;
    let isExpanded = false;

    // Sort the initial data based on the orientation (horizontal or vertical)
    initialData.sort((a, b) => horizontal ? d3.descending(xAccessor(a), xAccessor(b)) : d3.descending(yAccessor(a), yAccessor(b)));

    // Slice the data if a slice size is provided and the chart is not expandable
    if (sliceSize && !expandable) {
        initialData = initialData.slice(0, sliceSize)
    }

    // Function to find the longest word in the data set, used for setting margins
    const findLongestWord = (data, accessor) => {
        let longestWord = "";
        data.forEach(item => {
            const value = accessor(item);
            if (typeof value === 'string') {
                value.split(" ").forEach(word => {
                    if (word.length > longestWord.length) {
                        longestWord = word;
                    }
                });
            }
        });
        return longestWord.length;
    };

    const longestWord = findLongestWord(initialData, horizontal ? yAccessor : xAccessor);
    
    // Define dimensions for the chart including width, height, and margins
    let dimensions = {
        width: width,
        height: height,
        margins: {
            top: 50,
            right: horizontal ? 40 : 20,
            bottom: height < 300 ? longestWord > 20 ? 100 : 50 : horizontal ? 50 : 100,
            left: width < 300 ? 85 : horizontal ? longestWord > 20 ? 300 : 200 : 50,
        }
    };

    // Calculate the width and height of the inner chart area
    dimensions.bordWidth = dimensions.width - dimensions.margins.left - dimensions.margins.right;
    dimensions.bordHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;

    // Select the specified selector and append an SVG element to it with the specified width and height
    const svg = d3.select(selector).append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    // Append a group element for borders with margins applied
    const borders = svg.append("g")
        .style("transform", `translate(${dimensions.margins.left}px, ${dimensions.margins.top}px)`);

    // Define scales based on the orientation
    const xScale = horizontal ? d3.scaleLinear()
        .domain([0, d3.max(initialData, d => xAccessor(d))])
        .range([0, dimensions.bordWidth]) :
        d3.scaleBand()
            .domain(initialData.map(d => xAccessor(d)))
            .range([0, dimensions.bordWidth])
            .padding(0.1);

    const yScale = horizontal ? d3.scaleBand()
        .domain(initialData.map(d => yAccessor(d)))
        .range([0, dimensions.bordHeight])
        .padding(0.1) :
        d3.scaleLinear()
            .domain([0, d3.max(initialData, d => yAccessor(d))])
            .range([dimensions.bordHeight, 0]);

    // Function to update the chart with new data
    function updateChart(newData) {
        // Update the domains of the scales
        xScale.domain(horizontal ? [0, d3.max(newData, d => xAccessor(d))] : newData.map(d => xAccessor(d)));
        yScale.domain(horizontal ? newData.map(d => yAccessor(d)) : [0, d3.max(newData, d => yAccessor(d))]);

        // Bind the new data to the bars
        const bars = borders.selectAll(".bar")
            .data(newData);

        // Update existing bars
        bars.transition()
            .duration(1000)
            .attr(horizontal ? "y" : "x", d => horizontal ? yScale(yAccessor(d)) : xScale(xAccessor(d)))
            .attr(horizontal ? "height" : "width", horizontal ? yScale.bandwidth() : xScale.bandwidth())
            .attr(horizontal ? "width" : "height", d => horizontal ? xScale(xAccessor(d)) : dimensions.bordHeight - yScale(yAccessor(d)));

        // Remove old bars
        bars.exit().remove();

        // Add new bars
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr(horizontal ? "y" : "x", d => horizontal ? yScale(yAccessor(d)) : xScale(xAccessor(d)))
            .attr(horizontal ? "height" : "width", horizontal ? yScale.bandwidth() : xScale.bandwidth())
            .attr(horizontal ? "x" : "y", horizontal ? 0 : dimensions.bordHeight)
            .attr(horizontal ? "width" : "height", 0)
            .attr("fill", "url(#bar-gradient)")
            .transition()
            .duration(1000)
            .attr(horizontal ? "x" : "y", d => horizontal ? 0 : yScale(yAccessor(d)))
            .attr(horizontal ? "width" : "height", d => horizontal ? xScale(xAccessor(d)) : dimensions.bordHeight - yScale(yAccessor(d)))
            .on("end", function () {
                d3.select(this)
                    .on("mouseover", onMouseOver)
                    .on("mouseout", onMouseLeave);
            });

        // Update axes
        const xAxis = horizontal ? d3.axisBottom(xScale) : d3.axisBottom(xScale);
        const yAxis = horizontal ? d3.axisLeft(yScale) : d3.axisLeft(yScale);

        borders.select(".x-axis")
            .transition()
            .duration(1000)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");

        borders.select(".y-axis")
            .transition()
            .duration(1000)
            .call(yAxis);
    }

    // Initial bars rendering
    const bars = borders.selectAll(".bar")
        .data(initialData)
        .enter().append("rect")
        .attr("class", "bar")
        .attr(horizontal ? "y" : "x", d => horizontal ? yScale(yAccessor(d)) : xScale(xAccessor(d)))
        .attr(horizontal ? "height" : "width", horizontal ? yScale.bandwidth() : xScale.bandwidth())
        .attr(horizontal ? "x" : "y", horizontal ? 0 : dimensions.bordHeight)  // Start position
        .attr(horizontal ? "width" : "height", 0)  // Start height
        .attr("fill", colors.startColor)
        .transition()
        .duration(1000)
        .attr(horizontal ? "x" : "y", d => horizontal ? 0 : yScale(yAccessor(d)))  // Final position
        .attr(horizontal ? "width" : "height", d => horizontal ? xScale(xAccessor(d)) : dimensions.bordHeight - yScale(yAccessor(d)))  // Final height
        .on("end", function () {
            d3.select(this)
                .on("mouseover", onMouseOver)
                .on("mouseout", onMouseLeave);
        });

    // Add axes
    const xAxis = horizontal ? d3.axisBottom(xScale) : d3.axisBottom(xScale);
    const yAxis = horizontal ? d3.axisLeft(yScale) : d3.axisLeft(yScale);

    borders.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${dimensions.bordHeight})`)
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(-30)")
        .style("text-anchor", "end");

    borders.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Add title and labels
    const titleElement = svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.margins.top / 2)
        .attr("class", "title text")
        .style("cursor", "pointer")
        .text(title)
        .on("click", onClickTitle);

    const xLabelElement = svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.height - dimensions.margins.bottom / 5)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label text")
        .text(xLabel);

    svg.append("text")
        .attr("transform", `translate(${dimensions.margins.left / 3}, ${dimensions.height / 2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .attr("class", "axis-label text")
        .text(yLabel);

    // Mouseover interaction to change bar color and display value
    function onMouseOver(e, d) {
        d3.select(this)
            .style("fill", colors.endColor);

        borders.append("text")
            .attr("class", "bar-label text")
            .attr("x", horizontal ? xScale(xAccessor(d)) + 22 : xScale(xAccessor(d)) + xScale.bandwidth() / 2)
            .attr("y", horizontal ? yScale(yAccessor(d)) + yScale.bandwidth() / 2 + 5 : yScale(yAccessor(d)) - 5)
            .text(horizontal ? Number.isInteger(xAccessor(d)) ? xAccessor(d) : xAccessor(d).toFixed(2) :
                Number.isInteger(yAccessor(d)) ? yAccessor(d) : yAccessor(d).toFixed(2));
    }

    // Mouseleave interaction to revert bar color and remove value label
    function onMouseLeave(e, d) {
        d3.select(this)
            .style("fill", colors.startColor);

        d3.selectAll(".bar-label").remove();
    }

    // Click interaction on title to expand or collapse the chart
    function onClickTitle(e, d) {
        if (expandable) {
            isExpanded = !isExpanded;
            if (isExpanded) {
                dimensions.height *= data.length > 100 ? 4 : 2;
                dimensions.bordHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;
                svg.attr("height", dimensions.height);
                yScale.range([0, dimensions.bordHeight]);
                borders.select(".x-axis").attr("transform", `translate(0,${dimensions.bordHeight})`);
                xLabelElement.attr("y", dimensions.height - dimensions.margins.bottom / 5);
                updateChart(data.sort((a, b) => horizontal ? d3.descending(xAccessor(a), xAccessor(b)) : d3.descending(yAccessor(a), yAccessor(b))));
            } else {
                dimensions.height /= data.length > 100 ? 4 : 2;
                dimensions.bordHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;
                svg.attr("height", dimensions.height);
                yScale.range([dimensions.bordHeight, 0]);
                borders.select(".x-axis").attr("transform", `translate(0,${dimensions.bordHeight})`);
                xLabelElement.attr("y", dimensions.height - dimensions.margins.bottom / 5);
                const sortedInitialData = data.slice(0, sliceSize).sort((a, b) => horizontal ? d3.ascending(xAccessor(a), xAccessor(b)) : d3.ascending(yAccessor(a), yAccessor(b)));
                updateChart(sortedInitialData);
            }
        }
    }
}
