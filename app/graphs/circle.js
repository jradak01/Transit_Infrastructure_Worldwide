function createCircle(selector, numOfData, color, textBefore = "",
    textAfter = "", width = 180, height = 180) {

    // Create an SVG element within the specified div
    const svg = d3.select(selector)
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Set the center of the circle and its radius
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;

    // Create a color gradient for the circle's border
    const gradient = svg.append("defs")
        .append("radialGradient")
        .attr("id", "circleGradient")
        .attr("cx", "50%")
        .attr("cy", "50%")
        .attr("r", "55%");

    // Add color stops to the gradient
    gradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", color)
        .style("stop-opacity", 1); // Initial opacity is 1 (fully opaque)
    gradient.append("stop")
        .attr("offset", "100%")
        .style("stop-color", color)
        .style("stop-opacity", 0.4); // Final opacity is 0.4 (partially transparent)

    // Create a circle with a gradient border
    const circle = svg.append("circle")
        .attr("cx", centerX)
        .attr("cy", centerY)
        .attr("r", 0) // Initial radius is 0
        .style("fill", "none")
        .style("stroke", "url(#circleGradient)") // Border uses the color gradient
        .style("stroke-width", 10) // Border width
        .style("opacity", 0); // Initial opacity is 0

    // Animation for circle appearance
    circle.transition()
        .duration(2000) // Animation duration
        .attr("r", radius) // Final radius
        .style("opacity", 1); // Final opacity

    // Title 1
    const beforeText = svg.append("text")
        .attr("x", centerX)
        .attr("y", centerY - 15)
        .attr("class", "text helper-text")
        .text(textBefore);

    // Display the number of cities within the circle
    const cityCountText = svg.append("text")
        .attr("x", centerX)
        .attr("y", centerY + 10)
        .attr("class", "text title")
        .text(Number.isInteger(numOfData) ? numOfData : numOfData.toFixed(2));

    // Title 2
    const afterText = svg.append("text")
        .attr("x", centerX)
        .attr("y", centerY + 25)
        .attr("class", "text helper-text")
        .text(textAfter);
}
