var svgWidth = 960;
var svgHeight = 500;

var margin = {
  top: 20,
  right: 40,
  bottom: 80,
  left: 100
};

var width = svgWidth - margin.left - margin.right;
var height = svgHeight - margin.top - margin.bottom;

// Create an SVG wrapper, append an SVG group that will hold our chart,
//and shift the latter by left and top margins.
var svg = d3
  .select(".chart")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight)

// Append an SVG group
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);;

// Initial Params
var chosenXAxis = "labor_force"
var chosenYAxis = "uninsured"

// function used for updating x-scale var upon click on axis label
function xScale(emp_uninsured, chosenXAxis) {
  // create scales
  var xLinearScale = d3.scaleLinear()
    .domain([d3.min(emp_uninsured, d => d[chosenXAxis]) * 0.8,
      d3.max(emp_uninsured, d => d[chosenXAxis]) * 1.2
    ])
    .range([0, width])

  return xLinearScale

};

// function used for updating xAxis var upon click on axis label
function renderAxes(newXScale, xAxis) {
  var bottomAxis = d3.axisBottom(newXScale)

  xAxis.transition()
    .duration(1000)
    .call(bottomAxis)

  return xAxis
}

// function used for updating circles group with a transition to
// new circles
function renderCircles(circlesGroup, newXScale, chosenXaxis) {

  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[chosenXAxis]))

  return circlesGroup
};

// function used for updating circles group with new tooltip
function updateToolTip(chosenXAxis, circlesGroup) {

  if (chosenXAxis == "labor_force") {
    var label = "Labor Force:"
  } else if (chosenXAxis == "uninsured"){
    var label = "Percent Uninsured:"
  } else {
    var label = "Percent Employed:"
  }

  var toolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([80, -60])
    .html(function (d) {
      return (`${d.state}<br>${label} ${d[chosenXAxis]}`);
    });

  circlesGroup.call(toolTip);

  circlesGroup.on("mouseover", function (data) {
      toolTip.show(data);
    })
    // onmouseout event
    .on("mouseout", function (data, index) {
      toolTip.hide(data);
    });

  return circlesGroup
}

// Retrieve data from the CSV file and execute everything below
d3.csv("emp_uninsured.csv", function (err, emp_uninsured) {
  if (err) throw err;

  // parse data
  emp_uninsured.forEach(function (data) {
    data.labor_force = +data.labor_force;
    data.uninsured = +data.uninsured;
    data.employed = +data.employed;
  });

  // xLinearScale function above csv import
  var xLinearScale = xScale(emp_uninsured, chosenXAxis)

  // Create y scale function
  var yLinearScale = d3.scaleLinear()
    .domain([0, d3.max(emp_uninsured, d => d.uninsured)])
    .range([height, 0]);

  // Create initial axis functions
  var bottomAxis = d3.axisBottom(xLinearScale);
  var leftAxis = d3.axisLeft(yLinearScale);

  // append x axis
  var xAxis = chartGroup.append("g")
    .classed("x-axis", true)
    .attr("transform", `translate(0, ${height})`)
    .call(bottomAxis)

  // append y axis
  chartGroup.append("g")
    .call(leftAxis)

  // append initial circles
  var circlesGroup = chartGroup.selectAll("circle")
    .data(emp_uninsured)
    .enter()
    .append("circle")
    .attr("cx", d => xLinearScale(d[chosenXAxis]))
    .attr("cy", d => yLinearScale(d.uninsured))
    .attr("r", 20)
    .attr("fill", "pink")
    .attr("opacity", ".5")
    .attr("stroke", "maroon")

  // Create group for  2 x- axis labels
  var labelsGroup = chartGroup.append("g")
    .attr("transform", `translate(${width/2}, ${height + 20})`)

  var laborLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "labor_force") //value to grab for event listener
    .classed("active", true)
    .text("Labor Force by state (in %)");

  var uninsuredLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "uninsured") //value to grab for event listener
    .classed("inactive", true)
    .text("Uninsured by State (in %)");

  var employedLabel = labelsGroup.append("text")
    .attr("x", 0)
    .attr("y", 55)
    .attr("value", "uninsured") //value to grab for event listener
    .classed("inactive", true)
    .text("Percent Employed");

  // append y axis
  chartGroup.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left)
    .attr("x", 0 - (height / 2))
    .attr("dy", "1em")
    .classed("axis-text", true)
    .text("Percent of Population by State");


// var text = svgContainer.selectAll("text")
//     .data(emp_uninsured.state)
//     .enter()
//     .append("text");

// var textLabels = text
//     .attr("cx", d => xLinearScale(d[chosenXAxis]))
//     .attr("cy", d => yLinearScale(d.uninsured))
//     .text( function (d) { return "( " + d.cx + ", " + d.cy +" )"; })
//     .attr("font-family", "sans-serif")
//     .attr("font-size", "20px")
 
  // updateToolTip function above csv import
  var circlesGroup = updateToolTip(chosenXAxis, circlesGroup)

  // x axis labels event listener
  labelsGroup.selectAll("text")
    .on("click", function () {
      // get value of selection
      var value = d3.select(this).attr("value")
      if (value != chosenXAxis) {

        // replaces chosenXAxis with value
        chosenXAxis = value;

        // console.log(chosenXAxis)

        // functions here found above csv import
        // updates x scale for new data
        xLinearScale = xScale(emp_uninsured, chosenXAxis);

        // updates x axis with transition
        xAxis = renderAxes(xLinearScale, xAxis);

        // updates circles with new x & y values
        circlesGroup = renderCircles(circlesGroup, xLinearScale, chosenXAxis);

        // updates tooltips with new info
        circlesGroup = updateToolTip(chosenXAxis, circlesGroup);

        // changes classes to change bold text
        if (chosenXAxis == "uninsured") {
          uninsuredLabel
            .classed("active", true)
            .classed("inactive", false)
          laborLabel
            .classed("active", false)
            .classed("inactive", true)
          employedLabel
            .classed("active", false)
            .classed("inactive", true)
        } else if (chosenXAxis == "labor_force") {
          laborLabel
            .classed("active", true)
            .classed("inactive", false)
          uninsuredLabel
            .classed("active", false)
            .classed("inactive", true)
          employedLabel
            .classed("active", false)
            .classed("inactive", true)
        } else {
          uninsuredLabel
            .classed("active", false)
            .classed("inactive", true)
          laborLabel
            .classed("active", false)
            .classed("inactive", true)
          employedLabel
            .classed("active", true)
            .classed("inactive", false)
        };
      };
    });
});
