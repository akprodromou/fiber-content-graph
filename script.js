var width = 1080,
  height = 1080;

// Load csv data
d3.csv('food_composition_grouped_cleaned.csv')
  .then(function(data) {
    nodes = data.map((d, index) => { 
      return {
        id: `node_${index}`, // Add a unique ID based on index
        ...d,
        sugar_group_average: +parseFloat(d.sugar_group_average).toFixed(2),
        fibre_group_average: +parseFloat(d.fibre_group_average).toFixed(2)
      };
    });

    // Call any functions dependent on `nodes`
    generateMicrobiota();
    generateXaxis();
    generateYaxis();
  })
  .catch(function(error) {
    console.error(error);
  });

// Set up SVG 
const svg = d3
  .select("body")
  .append("svg")
  .attr("width", width + 70)
  .attr("height", height + 17.5)
  .append("g");

// Set up the background of mucosas
// Define the center of the mucosas group
let cx = width;
let cy = - height * 1.1;

const mucosa = { width : 32, height : 60 }

// Distance of placement from cx and cy
const radius = 1600;

// Number of mucosa on each row
const mucosaNum = 40;
// Create an array of mucosas to iterate over
const mucosaArcs = Array.from({ length: mucosaNum }, () => ({}));

// Create our gradient
// Append a defs (for definition) element to the SVG
var defs = svg.append("defs");

// Set up mucosa gradient
const gradientMucosa = defs
  .append("radialGradient")
  .attr("id", "gradientMucosa")
  .attr("cx", "50%") // Centered horizontally
  .attr("cy", "0%") // Centered vertically
  .attr("r", "150%"); 

  gradientMucosa
  .append("stop")
  .attr("offset", "0%")
  .attr("stop-color", "#ce7f71");
  gradientMucosa
  .append("stop")
  .attr("offset", "100%")
  .attr("stop-color", "#911f14");

// Microbiota generation functions
// Scale factor
const microbiotaScaleFactor = 3;

// Set up microbiota gradient
const gradientMicrobiota = svg
  .append("defs")
  .append("linearGradient")
  .attr("id", "gradientMicrobiota")
  .attr("x1", "0%")
  .attr("y1", "100%")
  .attr("x2", "0%")
  .attr("y2", "0%");

gradientMicrobiota.append("stop").attr("offset", "0%").attr("stop-color", "#294311");
gradientMicrobiota.append("stop").attr("offset", "100%").attr("stop-color", "#98c124");

// Microbiota straight path generation functions
function createStraightLine(x, y) {
  const length = Math.random() * microbiotaScaleFactor + 2;
  return `M${x},${y} l${length},-10`;
}
// Microbiota curved path generation functions
function createCurvedLine(x, y) {
  const controlPointX = x - Math.random() * microbiotaScaleFactor * 2;
  const controlPointY = y - microbiotaScaleFactor * 3 + Math.random() * microbiotaScaleFactor;
  const endPointX = x + Math.random() * microbiotaScaleFactor * 3;
  const endPointY = y - Math.sqrt(1010 - x);
  return `M${x},${y} Q${controlPointX},${controlPointY} ${endPointX},${endPointY}`;
}

// Function to generate random number
function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

// Generate mucosa
// i defines the number of rows
for (let i = 0; i < 15; i++) {
   // Create and append groups (g elements) for paths and text
   svg
    .selectAll(`.mucosa-path-${i}`)
    .data(mucosaArcs)
    .enter()
    .append("g") // Append a group to contain both the path and the text
    .attr("class", `mucosa-path-${i}`)
    .each(function (d, index) {
     // Within each group, append a path
     const g = d3.select(this);
     
     // Append path
     g.append("path")
      .attr("d", () => {
       return `M0,0c0,0-0-${mucosa.height},
       ${randomNumber(mucosa.width - 2, mucosa.width + 2)/2}-${randomNumber(mucosa.height - 3, mucosa.height + 3)}c${mucosa.width/2},0,${mucosa.width/2},
       ${mucosa.height},${mucosa.width/2},${mucosa.height}`;
      })
      .attr("fill", "url(#gradientMucosa)")
      .attr("transform", () => {
       // Calculate angle between 88.5 and (88.5 + 45) degrees
       const angle = ((index * (45 / mucosaNum) + 88.5) * Math.PI) / 180;
       const x = cx + (radius + 1 * i * (mucosa.height * 0.10 * i)) * Math.cos(angle);
       const y = cy + (radius + 1 * i * (mucosa.height * 0.10 * i)) * Math.sin(angle);
       const rotation = (angle * 180 / Math.PI) - 90 + mucosa.width/6; // 

       // Define separate scale factors for width and height
       const scaleFactorWidth = Math.pow(1.09, i); // scaling width
       const scaleFactorHeight = Math.pow(1.10, 2+i); // scaling height

       return `translate(${x}, ${y}) rotate(${rotation}) scale(${scaleFactorWidth}, ${scaleFactorHeight})`;
      });
    });
  }

// Function to convert fiber to an angle (92.5° to 122.5°)
function fiberToAngle(fiber) {
  const minFiber = d3.min(nodes, d => d.fibre_group_average);
  const maxFiber = d3.max(nodes, d => d.fibre_group_average); 
  return ((fiber - minFiber) / (maxFiber - minFiber)) * 30 + 92.5;
}

// Function to convert sugar to a radius
function sugarToRadius(sugar) {
  const minSugar = d3.min(nodes, d => d.sugar_group_average);
  const maxSugar = d3.max(nodes, d => d.sugar_group_average); 
  const minRadius = radius; // Minimum radial distance from center (cx, cy)
  const maxRadius = radius + radius * 0.4; // Maximum radial distance
  return ((sugar - minSugar) / (maxSugar - minSugar)) * (maxRadius - minRadius) + minRadius;
}

// Define the tooltip
const tooltip = d3.select("body")
  .append("div")
  .attr("id", "tooltip")
  .style("position", "absolute")
  .style("visibility", "hidden")
  .style("padding", "5px")
  .style("background", "white")
  .style("color", "black")
  .style("border-radius", "4px")
  .style("pointer-events", "none");


// Function to generate paths once for each node's initial position
function generateMicrobiota() {
  nodes.forEach((node) => {
    // Create a group for each data point
    const foodgroup = svg.append("g");

    // Convert fiber and sugar to angle and radius
    const angle = (fiberToAngle(node.fibre_group_average) * Math.PI) / 180;
    const radialDistance = sugarToRadius(node.sugar_group_average);

    // Calculate the (x, y) position on the arc
    const x = cx + radialDistance * Math.cos(angle);
    const y = cy + radialDistance * Math.sin(angle);

    // Store `x` and `y` positions in the node for later use
    node.x = x;
    node.y = y;

    // Define variables to track the bounds of the paths
    let minX = x,
      minY = y,
      maxX = x,
      maxY = y;

    // Define color interpolation function with adjusted ranges for x and y
    function interpolateColor(x, y, xMin, xMax, yMin, yMax, color1, color2) {
      // Scale x and y to be within [0, 1] based on their respective ranges
      const factorX = Math.max(0, Math.min(1, (x - xMin) / (xMax - xMin)));
      const factorY = Math.max(0, Math.min(1, (y - yMin) / (yMax - yMin)));
      
      // Calculate the average factor for blending colors
      const factor = factorY; 

      // Interpolate between the colors based on the averaged factor
      return d3.interpolateRgb(color1, color2)(factor);
    } 

    // i controls the density of the microbiota
    for (let i = 0; i < 100; i++) {
      // Create a random position around the central (x, y) point of each node
      const xOffset = Math.random() * 25 - 12.5;
      const yOffset = Math.random() * 25 - 12.5;
      const xPos = x + xOffset;
      const yPos = y + yOffset;

      // Choose path type randomly
      const pathType = Math.floor(Math.random() * 2);
      const microbiotaPathOption = pathType === 0 ? createStraightLine(xPos, yPos) : createCurvedLine(xPos, yPos);

      // Generate a unique gradient ID for each path
      const gradientId = `${node.id}`;  // Include node ID and i for uniqueness
      const gradient = svg
        .append("defs")
        .append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

      // Set gradient colors dynamically based on x and y positions
      // x varies between 199 and 1010
      // y varies between 194 and 1039
      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", interpolateColor(xPos, yPos, 199, 1010, 194, 1039, "#294311", "#763a10"));
    
      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", interpolateColor(xPos, yPos, 199, 1010, 194, 1039, "#92b425", "#e7bd8c"));  

      // Append the path to the SVG
      foodgroup
        .append("path")
        // Bind y data to each path in order to sort it later on in the code
        .datum({ x: xPos, y: yPos, microbiotaScaleFactor: 3, group_full_name: node.group_full_name, fibre_group_average: node.fibre_group_average, sugar_group_average: node.sugar_group_average })
        .attr("d", microbiotaPathOption)
        .attr("class", "microbiota")
        .attr("stroke", `url(#${gradientId})`)
        .attr("fill", "none")
        .attr("opacity", 1)
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 1)
        .on("mouseover", function (event) {
          tooltip
            .style("visibility", "visible")
            .html(`<span style="font-weight: 600;">${node.group_full_name}</span><br>Fiber: ${node.fibre_group_average}g<br>Sugar: ${node.sugar_group_average}g`)
        })        
        .on("mousemove", function (event) {
          tooltip
            .style("top", `${event.pageY - 10}px`)
            .style("left", `${event.pageX + 10}px`);
        })
        .on("mouseout", function () {
          tooltip.style("visibility", "hidden");   
        });
    }

    // Add text above each node with the food group name
    foodgroup
      .append("text")
      .attr("class","microbiota-text")
      .text(node.group_full_name)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .attr("x", minX + (maxX - minX) / 2)
      .attr("y", minY + (maxY - minY) / 2)
      .style("pointer-events", "none"); // Allows hover to pass through
  });

    // Log the x and y ranges
    const xRange = d3.extent(nodes, d => d.x);
    const yRange = d3.extent(nodes, d => d.y);
  
    console.log("X Range:", xRange);
    console.log("Y Range:", yRange);

  // Sort all paths based on the bound y data, so higher y values are appended last
  svg.selectAll("path.microbiota").sort((a, b) => d3.ascending(a.y, b.y)); // Sort paths by their bound y data
}

// Create the fiber x axis on an arc
function generateXaxis() {
  const xAxisArc = d3.arc()
    .innerRadius(radius - 90)
    .outerRadius(radius - 90)
    .startAngle(Math.PI + 2.5 * Math.PI / 180)  // Starting angle (92.5°)
    .endAngle(Math.PI * 14 / 12 + 2.5 * Math.PI / 180);  // Ending angle (92.5 + 16.7°)

  const arcXScale = d3.scaleLinear()
    .domain(d3.extent(nodes, d => d.fibre_group_average))  // Data domain
    .range([xAxisArc.startAngle(), xAxisArc.endAngle()]);  // Map to the arc angle range

  // Append the arc path as the visual guide for the axis
  svg.append("path")
    .attr("id", "xAxisPath")
    .attr("d", xAxisArc())
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", 1)
    .attr("transform", `translate(${cx}, ${cy})`);

  // Append a group element to hold the tick elements
  const tickGroup = svg.append("g")
    .attr("transform", `translate(${cx}, ${cy})`);

  // Create x-axis title
  // Append text along the path
  svg.append("text")
  .attr("class", "axisTitleText")
  .append("textPath")  // Attach the text to follow the path
  .attr("href", "#xAxisPath")  // Reference the path by its ID 
  .attr("startOffset", "75%")  // Offset along the path
  .append("tspan")
  .attr("dy", "-32.5") // Shift the text downwards
  .attr("text-anchor", "middle")
  .text("Fiber content (g) per 100g");  

  // Define the number of ticks
  const numTicksXaxis = 15;
  const angleStep = (30) / (numTicksXaxis - 1); // Calculate angle step 
  const tickStep = (d3.max(nodes, d => d.fibre_group_average) - d3.min(nodes, d => d.fibre_group_average)) / (numTicksXaxis - 1);

  tickGroup.selectAll("g")
    .data(Array.from({ length: numTicksXaxis }, (_, i) => ({
      angle: 92.5 + i * angleStep,
      text: `${(tickStep * i).toFixed(2)}g` 
    })))
    .enter()
    .append("g")
    .each(function(d) {
      // Convert angle to radians once
      const angle = d.angle * Math.PI / 180;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);

      // Create line element
      d3.select(this)
        .append("line")
        .attr("x1", (radius - 90) * cosAngle)
        .attr("y1", (radius - 90) * sinAngle)
        .attr("x2", (radius - 80 ) * cosAngle)
        .attr("y2", (radius - 80) * sinAngle)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .attr("stroke-linecap", "round");

      // Create text element and position it
      d3.select(this)
        .append("text")
        .text(d.text) // Use the text data from the object
        .attr("class","tickText")
        .attr("x", (radius - 97.5) * cosAngle) 
        .attr("y", (radius - 97.5) * sinAngle) 
        .attr("dx", 0)
        .attr("dy", - 5 * (d.angle * Math.PI / 180))
        .attr("text-anchor", "middle") // Center text horizontally
        .attr("dominant-baseline", "middle") // Center text vertically
        .attr("fill", "white")
        .attr("transform", `rotate(${d.angle - 92.5}, ${(radius - 82.5) * cosAngle}, ${(radius - 112.5) * sinAngle})`); 
    });
}

// Create the sugar Y-axis on a radial scale
function generateYaxis() {
  // Define the radial scale for the Y-axis based on sugar_group_average
  const yAxisRadiusScale = d3.scaleLinear()
    .domain(d3.extent(nodes, d => d.sugar_group_average)) // Use the extent of sugar data
    .range([radius, radius +  radius * 0.4]); 

  // Define the number of ticks for the Y-axis
  const numTicksYaxis = 20;
  const tickStepYaxis = (d3.max(nodes, d => d.sugar_group_average) * 1 - d3.min(nodes, d => d.sugar_group_average)) / (numTicksYaxis - 1);

  // Append a group element to hold the tick elements
  const yAxisGroup = svg.append("g")
    .attr("transform", `translate(${cx}, ${cy})`);

  // Generate tick data for Y-axis, along with positions
  yAxisGroup.selectAll("g")
    .data(Array.from({ length: numTicksYaxis }, (_, i) => ({
      radius: yAxisRadiusScale(i * tickStepYaxis),
      text: `${(tickStepYaxis * i).toFixed(2)}g`
    })))
    .enter()
    .append("g")
    .each(function(d) {
      // Create line element for each tick, extending radially outward
      d3.select(this)
        .append("line")
        .attr("x1", - 10)
        .attr("y1", d.radius)
        // sugarToRadius(node.sugar_group_average) * Math.sin(angle);
        .attr("x2", - 20) // Length of tick line
        .attr("y2", d.radius)
        .attr("stroke", "white")
        .attr("stroke-width", 1);

      // Create text element and position it next to the tick
      d3.select(this)
        .append("text")
        .text(d.text) // Display tick value
        .attr("class","tickText")
        .attr("x", 0) // Offset text from tick
        .attr("y", d.radius + tickStepYaxis)
        .attr("text-anchor", "start") // Align text to the start
        .attr("fill", "white");
    });
  // Append the Y-axis title
  yAxisGroup.append("text")
    .attr("class", "axisTitleText")
    .attr("href", "#yAxisPath")
    .attr("x", radius / 5)   // Center horizontally at the radial origin
    .attr("y", radius)   // Position above the radial axis
    .attr("transform", `rotate(90, ${0}, ${radius})`)
    .append("tspan")
    .attr("dy", "-45") // Shift the title to the right
    .attr("text-anchor", "middle")   // Center the text horizontally
    .attr("fill", "white")
    .text("Sugar Content (g) per 100g"); // Add the title text

    yAxisGroup.append("line")    
    .attr("x1", - 10)
    .attr("y1", radius)
    // sugarToRadius(node.sugar_group_average) * Math.sin(angle);
    .attr("x2", - 10) // Length of tick line
    .attr("y2", sugarToRadius(d3.max(nodes, d => d.sugar_group_average)))
    .attr("stroke", "white")
    .attr("stroke-width", 1);
}

// Create a title element and append it to the SVG
svg
  .append("text")
  .text("Oh My Gut!")
  .attr("class","title")
  .attr("text-anchor", "start") 
  .attr("x", `${width - 282.5}`) // Set horizontal position
  .attr("y", 65) // Set vertical position
  .attr("fill", "white");

// Create a subtitle element and append it to the SVG
// svg
//   .append("text")
//   .text("Balancing fiber and sugar for better health")
//   .attr("class","subtitle")
//   .attr("text-anchor", "end") 
//   .attr("x", `${width + 37.5}`) // Set horizontal position
//   .attr("y", 100) // Set vertical position
//   .attr("fill", "white");
 

// Append description below the title
svg.append("foreignObject")
  .attr("width", 320) 
  .attr("height", 200) 
  .attr("x", `${width - 280}`) // Set horizontal position
  .attr("y", 80)
  .attr("class","description")
  .append("xhtml:div")
  .style("text-align", "left") 
  .style("color", "white")
  .html(`
    <span style="background-color: white; color:black;">Did you know that the gut is the body’s largest immune organ, housing 70-80% of our immune cells?</span>
    <br>And its health is largely influenced by our diet, with diverse foods supporting a healthy flora inside it (called the "microbiome").
    <br>Dietary fiber provides nutrients for beneficial bacteria and strengthens its surrounding barrier; the recommended daily intake is 28-35g. 
    <br>High sugar intake, however, promotes harmful bacteria and weakening defenses, so it should be limited to 24-36g.
  `);

// Create an annotation
const annotationGroup = svg.append("g")
.attr("class", "annotation-group");

// Define the text content
const annotationText = `The mucosa depicted in the background is the innermost layer of the gut, and it serves several key functions:
<li>Limiting the entry of harmful pathogens while allowing the passage of essential nutrients.</li>
<li>Providing a habitat for diverse microorganisms, which play a crucial role in digestion, immune regulation, and overall gut health.</li>
<li>Absorbing nutrients and releasing substances like mucus and digestive enzymes, aiding in digestion and nutrient uptake.</li>
<li>Strengthening our immune defense by monitoring and responding to microbial and dietary antigens, maintaining a balance between tolerance and immune response.</li>`;

// Set position and dimensions for the foreignObject
const annotationBoxX = 30;
const annotationBoxY = 1080 - 360;
const foreignObjectWidth = 250; // Width of the text box
const foreignObjectHeight = 150; // Height of the text box

// Coordinates for the target part of the graph
const arrowTailX = annotationBoxX + foreignObjectWidth; // X coordinate of the target
const arrowTailY = annotationBoxY + foreignObjectHeight * 1.25; // Y coordinate of the target

// Position for the annotation text
const arrowHeadX = arrowTailX + 50; // Offset the text to the right of the target
const arrowHeadY = arrowTailY; // Offset the text slightly above the target

// Draw a line from the text to the target
annotationGroup.append("line")
.attr("x1", arrowTailX)
.attr("y1", arrowTailY)
.attr("x2", arrowHeadX)
.attr("y2", arrowHeadY)
.attr("stroke", "rgba(255, 255, 255, 0.6)")
.attr("stroke-width", 1)

// Append a circle to the annotationGroup at the arrow head position
annotationGroup.append('circle')
  .attr('cx', arrowHeadX + 4)
  .attr('cy', arrowHeadY)
  .attr('r', 4)
  .attr('stroke', 'none')
  .attr('fill', 'rgba(255, 255, 255, .6)');

// Add the foreignObject for wrapped text
annotationGroup.append("foreignObject")
  .attr("width", foreignObjectWidth)
  .attr("height", foreignObjectHeight)
  .attr("x", annotationBoxX)
  .attr("y", annotationBoxY)
  .attr("class", "annotation-foreignObject")
  .style("overflow", "visible")
  .append("xhtml:div") // XHTML namespace is required here
  .style("background", "rgba(255, 255, 255, 0.6)") // Semi-transparent background
  .style("padding", "15px")
  .style("border-radius", "4px")
  .style("color", "black")
  .html(annotationText); // Use HTML to set text and allow wrapping


// Add the data reference
svg
  .append("text")
  .text("Data Source: USDA National Nutrient Database, October 2024")
  .attr("class","referenceText")
  .attr("text-anchor", "end") 
  .attr("x", width + 55) // Set horizontal position
  .attr("y", height + 5) // Set vertical position
  .attr("fill", "white");

d3.xml("gutGraphic.svg").then(data => {
  const importedSVG = data.documentElement;

  // Create a group to wrap the imported SVG for scaling
  const group = svg.append("g")
  .attr("transform", `translate(${annotationBoxX + foreignObjectWidth - 20.5}, ${annotationBoxY + 93.5}) scale(0.2)`)
  .attr("stroke-width", 0.5)
  .attr('stroke', 'rgba(255, 255, 255, 0.6)');

  // Append the imported SVG content to the group
  group.node().appendChild(importedSVG);

}).catch(error => console.error("Error loading SVG:", error));
  
  
