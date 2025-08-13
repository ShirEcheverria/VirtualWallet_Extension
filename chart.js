/**
 * === Color Constants for BTC and ETH ===
 * These constants define the colors used for Bitcoin and Ethereum in the charts.
 */
const COLOR_BTC = "#F7931A";  // Orange for Bitcoin
const COLOR_ETH = "#800080";  // Purple for Ethereum

/**
 * Draws a line chart of total USD value over time using D3.js.
 * Assumes that the `history` array contains date and totalUSD fields.
 *
 * @param {Array<Object>} history - List of transaction summaries with `date` and `totalUSD`.
 *                               Each object in the array should have:
 *                               - `date`: a string representing the date (format: "%Y-%m-%d")
 *                               - `totalUSD`: a number representing the total value in USD
 *                               - `currency`: a string with the currency type, either "BTC" or "ETH"
 */
function drawLineChart(history) {
    const svgWidth = 320;  // Width of the SVG chart
    const svgHeight = 250;  // Height of the SVG chart
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };  // Margins for chart
    const width = svgWidth - margin.left - margin.right;  // Chart width (with margin)
    const height = svgHeight - margin.top - margin.bottom;  // Chart height (with margin)

    // Clear previous chart content before drawing a new one
    d3.select("#chart-area").selectAll("*").remove();

    // Create SVG container and group element for axis and content
    const svg = d3.select("#chart-area")
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Parse date from string format to Date object
    const parseDate = d3.timeParse("%Y-%m-%d");

    // Map the history data to include parsed date and total USD
    const data = history.map(d => ({
        date: parseDate(d.date),  // Parse the date string into Date object
        totalUSD: d.totalUSD,  // Total USD value for this transaction
        currency: d.currency  // Currency type ("BTC" or "ETH")
    }));

    // Create time-based x-axis scale
    const x = d3.scaleTime()
        .domain(d3.extent(data, d => d.date))  // Set the domain to the full date range
        .range([0, width]);  // Map to the width of the chart

    // Create y-axis scale for USD values
    const y = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.totalUSD)])  // Set the domain to the max totalUSD
        .nice()  // Makes the axis "nice" (rounds to nearest nice value)
        .range([height, 0]);  // Map to the height of the chart (invert the scale)

    // Draw bottom x-axis with formatted date ticks
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat("%b %d, %Y")))  // Format dates
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("font-size", "11px");

    // Append Y axis to the chart
    svg.append("g")
        .call(d3.axisLeft(y).ticks(5));

    // Split data by currency (BTC and ETH)
    const btcData = data.filter(d => d.currency === "BTC");
    const ethData = data.filter(d => d.currency === "ETH");

    // Line generator function to plot the data
    const line = d3.line()
        .x(d => x(d.date))  // X value mapped to the date
        .y(d => y(d.totalUSD));  // Y value mapped to the totalUSD

    // Draw the line for BTC data
    svg.append("path")
        .datum(btcData)  // Data specific to BTC
        .attr("fill", "none")
        .attr("stroke", COLOR_BTC)  // Use the defined color for BTC
        .attr("stroke-width", 2)
        .attr("d", line);  // Use the line generator to draw the path

    // Draw the line for ETH data
    svg.append("path")
        .datum(ethData)  // Data specific to ETH
        .attr("fill", "none")
        .attr("stroke", COLOR_ETH)  // Use the defined color for ETH
        .attr("stroke-width", 2)
        .attr("d", line);  // Use the line generator to draw the path
}

/**
 * Draws a pie chart representing the BTC and ETH distribution.
 *
 * @param {number} btc - Total amount of Bitcoin in the wallet.
 * @param {number} eth - Total amount of Ethereum in the wallet.
 */
function drawPieChart(btc, eth) {
    const canvas = document.getElementById("pieChart");
    if (!canvas) return;  // Exit if canvas is not found

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);  // Clear previous chart

    const total = btc + eth;  // Total value of BTC and ETH
    if (total === 0) return;  // Skip drawing if both values are zero

    const centerX = 120, centerY = 120, radius = 100;  // Center and size of the pie chart

    // Define the slices and their respective colors (BTC and ETH)
    const parts = [
        { label: "BTC", value: btc, color: COLOR_BTC },  // BTC slice
        { label: "ETH", value: eth, color: COLOR_ETH }  // ETH slice
    ];

    // Loop through each part to draw its corresponding slice
    let startAngle = 0;  // Starting angle for the first slice
    for (const part of parts) {
        const sliceAngle = (part.value / total) * 2 * Math.PI;  // Calculate slice angle based on value
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);  // Start drawing from the center
        ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);  // Draw arc
        ctx.closePath();
        ctx.fillStyle = part.color;  // Set slice color
        ctx.fill();  // Fill the slice with color
        startAngle += sliceAngle;  // Update the start angle for the next slice
    }

    /**
     * Handles hover tooltips inside the pie chart using canvas.title.
     * Displays the label and value when hovering over each slice.
     */
    canvas.onmousemove = function (e) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left - centerX;  // Calculate X position relative to the center
        const y = e.clientY - rect.top - centerY;  // Calculate Y position relative to the center
        const angle = Math.atan2(y, x);  // Calculate angle for hover position
        let pos = angle >= 0 ? angle : (2 * Math.PI + angle);  // Normalize angle to [0, 2π]
        let current = 0;

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const slice = (part.value / total) * 2 * Math.PI;  // Calculate the slice angle
            if (pos >= current && pos <= current + slice) {
                canvas.title = `${part.label}: ${part.value}`;  // Show tooltip with label and value
                return;
            }
            current += slice;  // Move to the next slice
        }
        canvas.title = "";  // No slice under cursor
    };
}

// === Make drawPieChart available for other scripts (e.g., popup.js) ===
window.drawPieChart = drawPieChart;
