// Wait for the DOM to be ready
document.addEventListener("DOMContentLoaded", function () {
    // Initialize your application
    init();
});

function init() {
    fetchData();
}

// function fetchData() {
//     d3.csv("../data/data_2020_to_2022.csv")
//         .then(function(data) {
//         console.log('here!')
//         data.forEach(function(d) {
//             d.Value = +d.Value;
//         });
//         // Store your data in a variable if needed
//         var myData = data;
//         createCharts(myData);
//     })
//     .catch(function(error) {
//         console.error('Error fetching', error);
//     });
// }

function fetchData() {
    d3.csv("../data/data_2020_to_2022.csv")
        .then(function (data) {
            console.log('Data loaded successfully:', data);

            // Call a function to display the data in a table
            createCharts(data);
            // createChart1(data);
            createChart1Sum(data);
            createChart2Sum(data);
        })
        .catch(function (error) {
            console.error('Error fetching or processing data:', error);
        });
    d3.csv("../data/output.csv")
        .then(function (data) {
            console.log('Data loaded successfully:', data);

            // Call a function to display the data in a table
            createTimeSeries(data);
        })
        .catch(function (error) {
            console.error('Error fetching or processing data:', error);
        });

}

function createCharts(data1) {
    var chart_data = [];

    // count the number of purpose
    var purposeCounts = d3.rollup(data1, v => v.length, d => d.Purpose);

    // Convert purposeCounts to an array of objects
    var purposeCountArray = Array.from(purposeCounts, ([Purpose, count]) => ({ Purpose, count }));

    // Sort purposeCountArray from largest to smallest
    purposeCountArray.sort((a, b) => b.count - a.count);

    // configure the SVG dimensions and margins
    var margin = { top: 20, right: 30, bottom: 40, left: 40 };
    var width = 400 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // create svg container
    var svg = d3.select('#chart').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up the scales
    var xScale = d3.scaleLinear()
        .domain([0, d3.max(purposeCountArray, d => d.count)])
        .nice()
        .range([0, width]);

    var yScale = d3.scaleBand()
        .domain(purposeCountArray.map(d => d.Purpose))
        .range([0, height])
        .padding(0.1);

    // Create y-axis with custom tick formatting
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.format('.2s'));

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    // Create the bars and add interactivity
    var bar = svg.selectAll(".bar")
        .data(purposeCountArray)
        .enter().append("g")
        .attr("class", "bar");

    // Add the bars
    bar.append('rect')
        .attr('x', 0)  // Set x to 0
        .attr('y', d => yScale(d.Purpose))  // Use y for the purpose
        .attr('width', d => xScale(d.count))  // Use x for the count
        .attr('height', yScale.bandwidth())  // Use y bandwidth
        .style('fill', 'steelblue')
        .on("mouseenter", function (event, d) {
            d3.select(this).attr("opacity", 0.5);
          })
          .on("mouseleave", function (event, d) {
            d3.select(this).attr("opacity", 1);
          })
          // Make div appear
          .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
          })
          .on("mousemove", function (event, d) {
            return tooltip
              .style("top", event.pageY + 30 + "px")
              .style("left", event.pageX + 20 + "px")
              .html("Count: " + d3.format(",.0f")(d.count));
          })
          // Make div disappear
          .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
          });
        // .on("mouseover", function (event, d) {
        //     var tooltip = d3.select("#tooltip");
        //     tooltip.html("Count: " + d.count)
        //         .style("left", (event.pageX + 10) + "px")
        //         .style("top", (event.pageY - 30) + "px")
        //         .style("opacity", 1);
        // })
        // .on("mouseout", function () {
        //     d3.select("#tooltip")
        //         .style("opacity", 0);
        // });

    // Add data labels
    bar.append('text')
        .attr('x', (d) => xScale(d.count) + 5)
        .attr('y', (d) => yScale(d.Purpose) + yScale.bandwidth() / 2 + 5)
        .attr('text-anchor', 'start')
        .text((d) => d3.format('.2s')(d.count));

    // Add x-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale));

    // Add y-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale))
        .call(xAxis);

}

function createTimeSeries(data) {

    // count the number of records per importer
    var counts = d3.rollup(data, v => v.length, d => d.Year, d => d.Importer_d3c);

    // prepare the data to convert it to year, country, count format
    var countPerImporterByYear = [];

    counts.forEach((value, year) => {
        value.forEach((count, country) => {
            countPerImporterByYear.push({ Year: year, Country: country, Count: count });
        });
    });

    // Replace missing or empty country values with "unknown"
    countPerImporterByYear.forEach(d => {
        if (d.Country === '') {
            d.Country = 'unknown';
        }
    });

    // parse date string to data object
    countPerImporterByYear.forEach(d => {
        d.Year = new Date(d.Year);
    })


    console.log('result', countPerImporterByYear)

    // Group the data by year and calculate the sum of counts for each year
    const yearlySumData = d3.rollup(
        countPerImporterByYear,
        v => d3.sum(v, d => d.Count),
        d => d.Year
    );

    // Convert the aggregated data to an array for easier charting
    const yearlySumArray = Array.from(yearlySumData, ([Year, Count]) => ({ Year, Count }));

    // Sort the data by year (optional)
    yearlySumArray.sort((a, b) => d3.ascending(a.Year, b.Year));

    console.log('yearlysumarray', yearlySumArray)

    // configure the SVG dimensions and margins
    var margin = { top: 20, right: 30, bottom: 40, left: 40 };
    var width = 400 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // create SVG container
    var svgTimeSeries = d3.select('#timeseries').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // find unique years
    const uniqueYears = Array.from(d3.rollup(yearlySumArray, v => v.length, d => d.Year).keys());

    // define scale for x and y axis
    const xScale = d3.scaleTime()
        .domain([d3.min(uniqueYears), d3.max(uniqueYears)])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(yearlySumArray, d => d.Count)])
        .nice()
        .range([height, 0]);

    // Create a time format function for the x-axis labels
    const timeFormat = d3.timeFormat("%Y");

    // Create a line generator
    const line = d3.line()
        .x(d => xScale(d.Year))
        .y(d => yScale(d.Count));

    // Create and style the line chart
    svgTimeSeries.append("path")
        .datum(yearlySumArray)
        .attr("class", "line")
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2);

    // Create x and y axes
    const xAxis = d3.axisBottom(xScale)
        .tickValues(uniqueYears)
        // .ticks(uniqueYears.length)
        .tickFormat(timeFormat);

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format('.2s'));

    svgTimeSeries.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis);


    svgTimeSeries.append("g")
        .attr("class", "y-axis")
        .call(yAxis);
}

function createChart1Sum(data) {


    // count the total quantity of each country
    var exporterSum = d3.rollup(data, v => d3.sum(v, d => d.Quantity), d => d.Exporter);

    // Convert exporterSum to an array of objects
    var exporterSumArray = Array.from(exporterSum, ([Exporter, sum]) => ({ Exporter, sum }));


    // configure the SVG dimensions and margins
    var margin = { top: 20, right: 30, bottom: 40, left: 40 };
    var width = 1000 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // create svg container
    var svg = d3.select('#chart1sum').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up the scales
    var xScale = d3.scaleBand()
        .domain(exporterSumArray.map(d => d.Exporter))
        .range([0, width])
        .padding(0.1);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(exporterSumArray, d => d.sum)])
        .nice()
        .range([height, 0]);

    // add tooltip
    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    // Create the bars
    svg.selectAll(".bar")
        .data(exporterSumArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.Exporter))
        .attr("y", d => yScale(d.sum))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.sum))
        .style("fill", "steelblue") // Set the fill color here
        .on("mouseenter", function (event, d) {
            d3.select(this).attr("opacity", 0.5);
          })
          .on("mouseleave", function (event, d) {
            d3.select(this).attr("opacity", 1);
          })
          // Make div appear
          .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
          })
          .on("mousemove", function (event, d) {
            return tooltip
              .style("top", event.pageY + 30 + "px")
              .style("left", event.pageX + 20 + "px")
              .html("Country: " + d.Exporter + ", " + "Sum: " + d3.format(",.0f")(d.sum));
          })
          // Make div disappear
          .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
          });

    

    const xAxis = d3.axisBottom(xScale);

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format('.2s'));

    // Add x-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);


}

function createChart2Sum(data) {


    // count the sum of quantity of importers
    var importerSum = d3.rollup(data, v => d3.sum(v, d => d.Quantity), d => d.Importer);

    // Convert importerSum to an array of objects
    var importerSumArray = Array.from(importerSum, ([Importer, sum]) => ({ Importer, sum }));


    // configure the SVG dimensions and margins
    var margin = { top: 20, right: 30, bottom: 40, left: 40 };
    var width = 1000 - margin.left - margin.right;
    var height = 300 - margin.top - margin.bottom;

    // create svg container
    var svg = d3.select('#chart2sum').append('svg')
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Set up the scales
    var xScale = d3.scaleBand()
        .domain(importerSumArray.map(d => d.Importer))
        .range([0, width])
        .padding(0.1);

    var yScale = d3.scaleLinear()
        .domain([0, d3.max(importerSumArray, d => d.sum)])
        .nice()
        .range([height, 0]);

    const tooltip = d3.select("body").append("div").attr("class", "tooltip");

    // Create the bars
    svg.selectAll(".bar")
        .data(importerSumArray)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.Importer))
        .attr("y", d => yScale(d.sum))
        .attr("width", xScale.bandwidth())
        .attr("height", d => height - yScale(d.sum))
        .style("fill", "steelblue") // Set the fill color here
        .on("mouseenter", function (event, d) {
            d3.select(this).attr("opacity", 0.5);
          })
          .on("mouseleave", function (event, d) {
            d3.select(this).attr("opacity", 1);
          })
          // Make div appear
          .on("mouseover", function () {
            return tooltip.style("visibility", "visible");
          })
          .on("mousemove", function (event, d) {
            return tooltip
              .style("top", event.pageY + 30 + "px")
              .style("left", event.pageX + 20 + "px")
              .html("Country: " + d.Importer + ", " + "Sum: " + d3.format(",.0f")(d.sum));
          })
          // Make div disappear
          .on("mouseout", function () {
            return tooltip.style("visibility", "hidden");
          });
      

    const xAxis = d3.axisBottom(xScale);

    const yAxis = d3.axisLeft(yScale)
        .tickFormat(d3.format('.2s'));

    // Add x-axis
    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Add y-axis
    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis);


}