async function createPieChart(selector, data, percentage, count, name, colors,
    total, isDonut, showAllData, numberOfItems = 5, title = '', size = 260, withPatterns = false, longWord=false) {
    
    // Accessor functions to extract specific properties from data
    const percentageAccessor = d => d[percentage];
    const countAccessor = d => d[count];
    const nameAccessor = d => d[name];

    // Helper function to find the longest word in a specific attribute of the data
    const findLongestWord = (data, atr) => {
        let longestWord = "";

        data.forEach(item => {
            const value = item[atr];
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

    // Find the length of the longest word in the name attribute
    const longestWord = findLongestWord(data, name);

    // Set the dimensions of the pie chart, adjusting for longer words if necessary
    let dimensions = {
        height: size,
        margins: {
            top: 40,
            right: longWord ? longestWord > 20 ? longestWord * 10 + 16 : longestWord * 10 + 20 : 140,
            bottom: 20,
            left: 0,
        },
    };

    // Calculate the width, height, and radius of the chart
    dimensions.bordHeight = dimensions.height - dimensions.margins.top - dimensions.margins.bottom;
    dimensions.bordWidth = dimensions.bordHeight;
    dimensions.width = dimensions.bordHeight + dimensions.margins.right;
    dimensions.radius = Math.min(dimensions.bordWidth, dimensions.bordHeight) / 2;

    // If not showing all data, group the remaining data into an "Others" category
    if (!showAllData) {
        let others = { [name]: "Others", [percentage]: 0, [count]: 0 };
        let remainingData = data.slice(numberOfItems);
        remainingData.forEach(d => {
            others[percentage] += percentageAccessor(d);
            others[count] += countAccessor(d);
        });
        data = data.slice(0, numberOfItems);
        if (others[percentage] > 0 && others[count] > 0) {
            data.push(others);
        }
    }

    // Create the SVG element for the pie chart
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", dimensions.width)
        .attr("height", dimensions.height);

    // Add patterns if needed
    if (withPatterns) {
        addPatterns(svg, data, colors);
    }

    // Create a group element to hold the pie chart
    const borders = svg.append("g")
        .attr("transform", `translate(
            ${dimensions.margins.left + dimensions.bordWidth / 2}, 
            ${dimensions.margins.top + dimensions.bordHeight / 2})`
        );

    // Define the pie layout
    const pie = d3.pie()
        .value(d => percentageAccessor(d))
        .sort(null);

    // Define the arcs for the pie chart
    const arc = d3.arc()
        .innerRadius(isDonut ? dimensions.radius * 0.5 : 0)
        .outerRadius(dimensions.radius * 0.8);

    // Define the hover effect for the arcs
    const arcHover = d3.arc()
        .innerRadius(isDonut ? dimensions.radius * 0.5 : 0)
        .outerRadius(dimensions.radius * 0.9);

    // Define the color scale
    const color = d3.scaleOrdinal(colors);

    // Create the arcs for the pie chart
    const arcs = borders.selectAll(".arc")
        .data(pie(data))
        .enter().append("g")
        .attr("class", "arc");

    // Draw the arcs with a transition effect
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => withPatterns ? `url(#pattern-${data.indexOf(d.data)})` : color(nameAccessor(d.data)))
        .transition()
        .duration(800)
        .attrTween("d", function (d) {
            const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
            return function (t) {
                return arc(interpolate(t));
            };
        });

    // Add hover effects to the arcs
    arcs.append("path")
        .attr("d", arc)
        .attr("fill", d => withPatterns ? `url(#pattern-${data.indexOf(d.data)})` : color(nameAccessor(d.data)))
        .on("mouseover", onMouseOver)
        .on("mouseout", onMouseLeave);

    // Add the title to the pie chart
    svg.append("text")
        .attr("x", dimensions.width / 2)
        .attr("y", dimensions.margins.top / 2)
        .attr("text-anchor", "middle")
        .attr("class", "title text")
        .text(title);

    // Add the total value to the pie chart
    svg.append("text")
        .attr("x", (dimensions.bordWidth + dimensions.margins.left) / 2)
        .attr("y", dimensions.height - dimensions.margins.bottom / 5)
        .attr("text-anchor", "middle")
        .attr("class", "total text helper-text")
        .text(`Total: ${Number.isInteger(total) ? total : total.toFixed(2)}`);

    // Create the legend for the pie chart
    const legend = svg.append("g")
        .attr("transform", `translate(${dimensions.width - dimensions.margins.right}, ${dimensions.margins.top})`);

    // Add items to the legend
    const legendItem = legend.selectAll(".legend-item")
        .data(data)
        .enter().append("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * (size <= 260 ? 20 : 25)})`);

    // Draw the legend items
    legendItem.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", size <= 260 ? 14 : 20)
        .attr("height", size <= 260 ? 14 : 20)
        .attr("fill", d => withPatterns ? `url(#pattern-${data.indexOf(d)})` : color(nameAccessor(d)));

    // Add text to the legend items
    legendItem.append("text")
        .attr("class", "text")
        .attr("x", size <= 260 ? 20 : 24)
        .attr("y", 9)
        .attr("dy", "0.35em")
        .style("font-size", size <= 260 ? "12px" : "14px")
        .text(d => nameAccessor(d));

    // Event handler for mouseover
    function onMouseOver(e, d) {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("d", arcHover);
        const tooltipText = `${nameAccessor(d.data)}: ${percentageAccessor(d.data).toFixed(2)}% (${Number.isInteger(countAccessor(d.data)) ? countAccessor(d.data) : countAccessor(d.data).toFixed(2)})`
        const tooltipGroup = svg.append("g")
            .attr("id", "city-tooltip")
            .attr("class", "city-tooltip")
        if (isDonut) {
            const donutText = tooltipText.split(':');
            tooltipGroup.append("text")
                .attr("transform", `translate(${dimensions.bordWidth / 2}, ${dimensions.height / 2})`)
                .attr("class", "tooltip-text text")
                .style("font-weight", "bold")
                .style("font-size", size < 330? "10px": '14px')
                .text(donutText[0] + ':');
            tooltipGroup.append("text")
                .attr("transform", `translate(${dimensions.bordWidth / 2}, ${dimensions.height / 2 + 16})`)
                .attr("class", "tooltip-text text")
                .text(donutText[1]);
        } else {
            tooltipGroup.append("rect")
                .attr("class", "tooltip-bg")
                .attr("transform", `translate(${dimensions.width / 2 + arc.centroid(d)[0] - 100}, ${dimensions.height / 3 + arc.centroid(d)[1] - 16})`)
                .attr("width", 200)
                .attr("height", 22)
                .attr("fill", "white")
                .attr("rx", 5)
                .attr("ry", 5)
                .style("box-shadow", "0px 0px 5px #999");
            tooltipGroup.append("text")
                .attr("transform", `translate(${dimensions.width / 2 + arc.centroid(d)[0]}, ${dimensions.height / 3 + arc.centroid(d)[1]})`)
                .attr("class", "tooltip-text text")
                .text(tooltipText);
        }
    }
    
    // Event handler for mouseleave
    function onMouseLeave(e, d) {
        d3.select(this)
            .transition()
            .duration(200)
            .attr("d", arc);

        svg.selectAll(".city-tooltip").remove();
        svg.selectAll(".tooltip-bg").remove();
    }
}

function addPatterns(svg, data, colors) {
    const defs = svg.append("defs");

    data.forEach((d, i) => {
        const pattern = defs.append("pattern")
            .attr("id", `pattern-${i}`)
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 5)  
            .attr("height", 5);  

        if (i % 10 === 0) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("line")
                .attr("x1", 0)
                .attr("y1", 0)
                .attr("x2", 5)
                .attr("y2", 5)
                .attr("stroke", "white")
                .attr("stroke-width", 0.5); 
        } else if (i % 10 === 1) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("circle")
                .attr("cx", 2.5)
                .attr("cy", 2.5)
                .attr("r", 1) 
                .attr("fill", "white");
        } else if (i % 10 === 2) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("line")
                .attr("x1", 0)
                .attr("y1", 5)
                .attr("x2", 5)
                .attr("y2", 0)
                .attr("stroke", "white")
                .attr("stroke-width", 0.5);  
        } else if (i % 10 === 3) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("line")
                .attr("x1", 0)
                .attr("y1", 2.5)
                .attr("x2", 5)
                .attr("y2", 2.5)
                .attr("stroke", "white")
                .attr("stroke-width", 0.5);  
        } else if (i % 10 === 4) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("path")
                .attr("d", "M0 0 L2.5 2.5 L0 5 Z")
                .attr("fill", "white")
                .attr("stroke", "black")
                .attr("stroke-width", 0.5);  
        } else if (i % 10 === 6) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("circle")
                .attr("cx", 1.25)
                .attr("cy", 1.25)
                .attr("r", 0.5) 
                .attr("fill", "white");
            pattern.append("circle")
                .attr("cx", 3.75)
                .attr("cy", 1.25)
                .attr("r", 0.5) 
                .attr("fill", "white");
            pattern.append("circle")
                .attr("cx", 1.25)
                .attr("cy", 3.75)
                .attr("r", 0.5)  
                .attr("fill", "white");
            pattern.append("circle")
                .attr("cx", 3.75)
                .attr("cy", 3.75)
                .attr("r", 0.5)  
                .attr("fill", "white");
        } else if (i % 10 === 5) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("path")
                .attr("d", "M0 0 L5 0 L5 5 L0 5 Z")
                .attr("fill", "white")
                .attr("opacity", 0.5);
        } else if (i % 10 === 8) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("circle")
                .attr("cx", 2.5)
                .attr("cy", 2.5)
                .attr("r", 1)
                .attr("fill", "white");
        } else if (i % 10 === 7) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
            pattern.append("circle")
                .attr("cx", 2.5)
                .attr("cy", 2.5)
                .attr("r", 1)
                .attr("fill", "white");
            pattern.append("circle")
                .attr("cx", 4)
                .attr("cy", 4)
                .attr("r", 1)
                .attr("fill", "white");
        } else if (i % 10 === 9) {
            pattern.append("rect")
                .attr("width", 5)
                .attr("height", 5)
                .attr("fill", colors[i % colors.length]);
        }
    });
}