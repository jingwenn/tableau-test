// Load the CSV data
d3.csv('df_filtered.csv').then(function(data) {
    // Create an object to store node and link data
    const graphData = { nodes: [], links: [] };

    // Process the data and create nodes and links
    data.forEach(function(d) {
        const exporter = d.Exporter;
        const importer = d.Importer;
        const count = +d.Count;

        // Check if exporter and importer nodes exist; if not, create them
        let exporterNode = graphData.nodes.find(node => node.id === exporter);
        let importerNode = graphData.nodes.find(node => node.id === importer);

        if (!exporterNode) {
            exporterNode = { id: exporter, count: 0 };
            graphData.nodes.push(exporterNode);
        }

        if (!importerNode) {
            importerNode = { id: importer, count: 0 };
            graphData.nodes.push(importerNode);
        }

        // Increase the count of the nodes based on data
        exporterNode.count += count;
        importerNode.count += count;

        // Create a link between exporter and importer
        graphData.links.push({
            source: exporterNode.id,
            target: importerNode.id,
            count: count
        });
    });

    // Set initial node positions randomly
    const width = 1920;
    const height = 1080;
    graphData.nodes.forEach(function(node) {
        node.x = Math.random() * width;
        node.y = Math.random() * height;
    });

    // Call the function to create the network graph with graphData
    createNetworkGraph(graphData);
});

// Function to create the network graph
function createNetworkGraph(graphData) {
    // Define dimensions for the SVG container
    const width = 1920;
    const height = 1080;

    // Create an SVG element within the container
    const svg = d3.select('#network-container').append('svg')
        .attr('width', width)
        .attr('height', height);

    // Define color scales for nodes and links based on count
    const nodeColorScale = d3.scaleLinear()
        .domain([0, d3.max(graphData.nodes, d => d.count)])
        .range(['blue']);

    const linkColorScale = d3.scaleLinear()
        .domain([0, d3.max(graphData.links, d => d.count)])
        .range(['gray', 'black']);

    // Create a force simulation
    const simulation = d3.forceSimulation(graphData.nodes)
        .force('link', d3.forceLink(graphData.links).id(d => d.id).strength(0.4))
        .force('charge', d3.forceManyBody().strength(-50));

    // Create links
    const link = svg.selectAll('.link')
        .data(graphData.links)
        .enter().append('line')
        .attr('class', 'link')
        .style('stroke', d => linkColorScale(d.count)); // Set link color

    // Create nodes with drag and click behavior
    const node = svg.selectAll('.node')
        .data(graphData.nodes)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', d => Math.sqrt(d.count) / 10) // Adjust the scaling factor
        .style('fill', d => nodeColorScale(d.count)) // Set node color
        .style('stroke', 'white')
        .style('stroke-width', 1)
        .on('click', clicked) // Add click behavior
        .call(d3.drag() // Add drag behavior
            .on('start', dragStarted)
            .on('drag', dragged)
            .on('end', dragEnded)
        );

    // Add tooltips to nodes
    node.append('title').text(d => `${d.id}\nCount: ${d.count}`);

    // Define drag start function
    function dragStarted(event, d) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    // Define drag function
    function dragged(event, d) {
        d.fx = event.x;
        d.fy = event.y;
    }

    // Define drag end function
    function dragEnded(event, d) {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    // Function to handle node click event
    function clicked(event, d) {
        // Toggle the 'selected' property of the clicked node
        d.selected = !d.selected;

        // Update the class of the clicked node to highlight it
        d3.select(this).classed('selected', d.selected);

        // Filter the links to get only the links connected to the clicked node
        const filteredLinks = graphData.links.filter(link => link.source === d || link.target === d);

        // Filter the nodes to get the connected nodes
        const connectedNodes = [];
        filteredLinks.forEach(link => {
            connectedNodes.push(link.source, link.target);
        });

        // Update the positions of connected nodes based on the links
        connectedNodes.forEach(node => {
            if (node === d) return; // Skip the clicked node
            node.x = d.x + (Math.random() - 0.5) * 20; // You can adjust the displacement here
            node.y = d.y + (Math.random() - 0.5) * 20; // You can adjust the displacement here
        });
    }

    // Define tick function for simulation
    function ticked() {
        link
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);

        node
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }

    // Update the simulation on each tick
    simulation.on('tick', ticked);
}