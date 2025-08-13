// Wait until the DOM is fully loaded before running any logic

document.addEventListener("DOMContentLoaded", () => {
    const currency = document.getElementById("currency");
    const amountInput = document.getElementById("amount");

    /**
     * Loads and displays the wallet balances for BTC and ETH.
     * Reads values from localStorage and updates the HTML view.
     */
    function loadWallet() {
        // Retrieve BTC and ETH balances from localStorage
        const BTC = Number(localStorage.getItem("BTC") || 0);
        const ETH = Number(localStorage.getItem("ETH") || 0);

        // Update the HTML view with the current balances
        document.getElementById("wallet-balance").innerHTML =
            `BTC: ${BTC} <br>ETH: ${ETH}`;
    }

    /**
     * Loads and displays the transaction history from localStorage.
     * Populates the #history element with past entries.
     */
    function loadHistory() {
        const list = document.getElementById("history");
        list.innerHTML = "";

        // Retrieve and display each transaction history entry
        const history = dao.getHistory();
        history.forEach((item, index) => {
            const div = document.createElement("div");
            div.className = "history-item";
            div.textContent = item;
            list.appendChild(div);
        });
    }

    /**
     * Loads and displays a D3 line chart showing historical movements
     * of BTC and ETH, including tooltips, legends, and current total value.
     */
    function loadChart() {
        document.getElementById("chart-area").innerHTML = "";

        // Get full transaction history from localStorage
        const history = JSON.parse(localStorage.getItem("transactionHistoryFull")) || [];
        if (history.length === 0) {
            document.getElementById("chart-area").innerHTML = "<p>No data to display.</p>";
            return;
        }

        // Initialize datasets and tracking variables
        const btcData = [{ x: "Start", y: 0 }];
        const ethData = [{ x: "Start", y: 0 }];
        let totalBTC = 0;
        let totalETH = 0;
        let maxBTC = 0;
        let maxETH = 0;
        let maxPointBTC = null;
        let maxPointETH = null;

        // Parse transaction history to build datasets for BTC and ETH
        history.forEach(entry => {
            const label = entry.date; // Use string label for x-axis, representing the date

            // Check if the current entry is for BTC
            if (entry.currency === "BTC") {
                totalBTC = entry.total; // Set the total BTC amount
                const point = { x: label, y: totalBTC, movement: entry.amount }; // Create data point
                btcData.push(point); // Add the BTC data point to the array
                if (totalBTC > maxBTC) {
                    maxBTC = totalBTC; // Update the maximum BTC value
                    maxPointBTC = point; // Store the point with the max BTC value
                }
            }
            // Check if the current entry is for ETH
            else if (entry.currency === "ETH") {
                totalETH = entry.total; // Set the total ETH amount
                const point = { x: label, y: totalETH, movement: entry.amount }; // Create data point
                ethData.push(point); // Add the ETH data point to the array
                if (totalETH > maxETH) {
                    maxETH = totalETH; // Update the maximum ETH value
                    maxPointETH = point; // Store the point with the max ETH value
                }
            }
        });

        // Setup SVG and chart dimensions
        const svgWidth = 300; // Width of the SVG chart
        const svgHeight = 300; // Height of the SVG chart
        const margin = { top: 120, right: 30, bottom: 50, left: 50 }; // Margins for the chart
        const width = svgWidth - margin.left - margin.right; // Calculating the inner width
        const height = svgHeight - margin.top - margin.bottom; // Calculating the inner height

        // Create the SVG element where the chart will be drawn
        const svg = d3.select("#chart-area")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom);

        // Grouping element for the chart, to Create group for margins
        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

        // Combine all data for scale calculation
        const allData = btcData.concat(ethData);

        // Define the X-axis scale (points for each date)
        const x = d3.scalePoint()
            .domain(allData.map(d => d.x)) // Use the x values (dates) from all data points
            .range([0, width]); // Range of x values from 0 to the width of the chart

        // Define the Y-axis scale (linear, based on the total amounts)
        const y = d3.scaleLinear()
            .domain([0, d3.max(allData, d => d.y) * 1.1]) // The maximum Y value is 10% greater than the largest data point
            .range([height, 0]); // Range of y values from the height to 0 (inverted scale for SVG)

        // Add the X-axis to the chart
        g.append("g")
            .attr("transform", `translate(0,${height})`) // Position the X-axis at the bottom of the chart
            .call(d3.axisBottom(x).tickFormat(d => d))
            .selectAll("text")
            .attr("transform", "rotate(-45)") // Rotate X-axis labels to avoid overlap
            .style("text-anchor", "end") // Align labels to the right
            .style("font-size", "10px"); // Reduce font size for better readability

        // Add Y-axis to the left side of the chart
        g.append("g")
            .call(d3.axisLeft(y).ticks(7)); // Display 7 ticks on the Y-axis

        // Define the line function for plotting the data
        const line = d3.line().x(d => x(d.x)).y(d => y(d.y));

        // Draw the lines for BTC and ETH data
        g.append("path").datum(btcData).attr("fill", "none").attr("stroke", "orange").attr("stroke-width", 2).attr("d", line);
        g.append("path").datum(ethData).attr("fill", "none").attr("stroke", "purple").attr("stroke-width", 2).attr("d", line);

        // Add circles (data points) for BTC
        g.selectAll(".dotBTC").data(btcData).enter().append("circle")
            .attr("class", "dotBTC")
            .attr("cx", d => x(d.x)) // Set the x position for each point
            .attr("cy", d => y(d.y)) // Set the y position for each point
            .attr("r", 3) // Set the radius of the circle
            .attr("fill", "orange") // Set the color to orange for BTC
            .append("title").text(d => `BTC\nTotal: ${d.y}\nMovement: ${d.movement ?? 0}`); // Add a tooltip for BTC

        // Add circles (data points) for ETH
        g.selectAll(".dotETH").data(ethData).enter().append("circle")
            .attr("class", "dotETH")
            .attr("cx", d => x(d.x)) // Set the x position for each point
            .attr("cy", d => y(d.y)) // Set the y position for each point
            .attr("r", 3) // Set the radius of the circle
            .attr("fill", "purple") // Set the color to purple for ETH
            .append("title").text(d => `ETH\nTotal: ${d.y}\nMovement: ${d.movement ?? 0}`); // Add a tooltip for ETH

        // Max BTC point annotation
        if (maxPointBTC) {
            g.append("text")
                .attr("x", x(maxPointBTC.x)) // Position the text at the x value of the max BTC point
                .attr("y", y(maxPointBTC.y) - 10) // Position the text slightly above the max BTC point
                .attr("text-anchor", "middle")
                .style("font-size", "10px") //  font size
                .style("fill", "orange") // Set the text color to orange
                .text(`Max: ${maxBTC}`); // Display the max value of BTC
        }

        // Max ETH point annotation
        if (maxPointETH) {
            g.append("text")
                .attr("x", x(maxPointETH.x)) // Position the text at the x value of the max ETH point
                .attr("y", y(maxPointETH.y) - 10) // Position the text slightly above the max ETH point
                .attr("text-anchor", "middle")
                .style("font-size", "10px") // font size
                .style("fill", "purple") // Set the text color to purple
                .text(`Max: ${maxETH}`); // Display the max value of ETH
        }

        // Add a title to the chart
        svg.append("text").attr("x", 10).attr("y", 20).attr("font-size", "16px").attr("font-weight", "bold").text("Virtual Wallet History");

        // Add a legend for BTC (orange color)
        svg.append("circle").attr("cx", 15).attr("cy", 45).attr("r", 6).style("fill", "orange");
        svg.append("text").attr("x", 28).attr("y", 49).text("BTC").style("font-size", "16px").style("font-weight", "bold").attr("alignment-baseline", "middle");

        // Add a legend for ETH (purple color)
        svg.append("circle").attr("cx", 100).attr("cy", 45).attr("r", 6).style("fill", "purple");
        svg.append("text").attr("x", 113).attr("y", 49).text("ETH").style("font-size", "16px").style("font-weight", "bold").attr("alignment-baseline", "middle");

        // Fetch live prices and update chart with current USD values for BTC and ETH
        service.getLastPriceUSD("BTC").then(btcPrice => {
            service.getLastPriceUSD("ETH").then(ethPrice => {
                const btcValue = (totalBTC * btcPrice).toLocaleString("en-US", { style: "currency", currency: "USD" });
                const ethValue = (totalETH * ethPrice).toLocaleString("en-US", { style: "currency", currency: "USD" });

                svg.append("text")
                    .attr("x", 10)
                    .attr("y", 85) // Move up the position slightly
                    .attr("font-size", "12px")
                    .style("font-weight", "bold")

                    // Display BTC and ETH values in USD
                                        .text(`BTC: ${totalBTC} → ${btcValue}\u00A0\u00A0\u00A0 | ETH: ${totalETH} → ${ethValue}`); //  \u00A0 (non-breaking space) to create visible spacing


                // Draw pie chart with slight delay and scroll fix
                setTimeout(() => {
                    drawPieChart(totalBTC, totalETH);
                    document.getElementById("chart-container").scrollTop = 0; // Fix scroll position
                }, 0);
            });
        });
    }

    // === EVENT LISTENERS ===
    /**
     * Event listener for the "Add" button: Updates wallet and logs transaction.
     * @fires loadWallet
     * @fires loadHistory
     */
    document.getElementById("add").addEventListener("click", () => {
        const value = parseFloat(amountInput.value);
        if (isNaN(value) || value <= 0) return alert("Please enter a valid amount.");

        dao.add(currency.value, value);

        loadWallet();
        loadHistory();
    });

    /**
     * Event listener for the "Remove" button: Checks balance, updates wallet, and logs transaction.
     * @fires loadWallet
     * @fires loadHistory
     */
    document.getElementById("remove").addEventListener("click", () => {
        const value = parseFloat(amountInput.value);
        if (isNaN(value) || value <= 0) return alert("Please enter a valid amount.");

        const available = Number(localStorage.getItem(currency.value)) || 0;
        if (value > available) {
            return alert(`You cannot remove more than you have. ${currency.value} Available: ${available}`);
        }

        dao.remove(currency.value, value);

        loadWallet();
        loadHistory();
    });

    /**
     * Event listener for the "Check This Amount (USD)" button: Converts entered amount to USD.
     */
    document.getElementById("check").addEventListener("click", () => {
        const value = parseFloat(amountInput.value);
        if (isNaN(value) || value <= 0) return alert("Please enter a valid amount.");

        service.getLastPriceUSD(currency.value).then(price => {
            const usdValue = (value * price).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 });
            alert(`${value} ${currency.value} → ${usdValue}`);
        });
    });

    /**
     * Event listener for the "Check Wallet Total (USD)" button: Shows total BTC + ETH value in USD.
     */
    document.getElementById("check-total").addEventListener("click", () => {
        const BTC = Number(localStorage.getItem("BTC") || 0);
        const ETH = Number(localStorage.getItem("ETH") || 0);

        service.getLastPriceUSD("BTC").then(btcPrice => {
            service.getLastPriceUSD("ETH").then(ethPrice => {
                const btcValue = BTC * btcPrice;
                const ethValue = ETH * ethPrice;
                const totalUSD = btcValue + ethValue;

                alert(`Wallet Value:
                    BTC: ${BTC} → ${(btcValue).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    ETH: ${ETH} → ${(ethValue).toLocaleString("en-US", { style: "currency", currency: "USD" })}
                    Total: ${(totalUSD).toLocaleString("en-US", { style: "currency", currency: "USD" })}`);
            });
        });
    });



    /**
     * Handles tab switching when a user clicks on the tab buttons.
     * - Activates the selected tab content.
     * - Highlights the active tab button.
     * - Loads the chart when the "Chart" tab is selected.
     */
    document.querySelectorAll(".tab-button").forEach(button => {
        button.addEventListener("click", () => {
            // Deactivate all tab contents
            document.querySelectorAll(".tab-content").forEach(tab => tab.classList.remove("active"));

            // Activate the selected tab content
            document.getElementById(button.dataset.tab).classList.add("active");

            // Deactivate all tab buttons and activate the clicked one
            document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
            button.classList.add("active");

            // If "Chart" tab is selected, load the chart data
            if (button.dataset.tab === "summary-tab") {
                loadChart();
            }
        });
    });



// Initial load of wallet and history
    loadWallet();
    loadHistory();
});
