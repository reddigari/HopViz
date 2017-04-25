function setupDocument() {

    var viz = d3.select("#vizId")
        .style("font-family", "sans-serif");
    viz.append("div")
        .attr("id", "optionsId");
    viz.append("div")
        .attr("id", "legendId")
        .style("display", "inline-block")
        .style("vertical-align", "top")
        .style("margin-right", "10px");
    viz.append("div")
        .attr("id", "radarChartId")
        .style("display", "inline-block");
    viz.append("div")
        .attr("id", "barChartId");

    d3.select("#optionsId").html('<fieldset name="Options" style="display: inline-block"><input type="radio" class="senseOption" name="sense" value="aroma" checked> Show average <span class="senseLabel">AROMA</span> ratings<br><input type="radio" class="senseOption" name="sense" value="flavor"> Show average <span class="senseLabel">FLAVOR</span> ratings<br><br><input type="checkbox" id="hideHops">Hide unselected hops</fieldset>')
}

// The basic code for the radar chart was written by Nadieh Bremer (visualcinnamon.com).
// See the Block here: http://bl.ocks.org/nbremer/21746a9668ffdf6d8242
// and Nadieh's blog post here: https://www.visualcinnamon.com/2015/10/different-look-d3-radar-chart.html
// Much of RadarChart has been omitted, and the general use has been modified to
// facilitate this visualization. Config variable names have been added and changed, so re-use with caution.
// (Her design in turn was based on alangrafu's radar-chart-d3: https://github.com/alangrafu/radar-chart-d3)

////////////////////////////////////////////////////////////////
//                RADAR VARIABLES AND CHART                   //
////////////////////////////////////////////////////////////////

var cfg = {
    w: 400, //Width of the circle
    h: 400, //Height of the circle
    margin: {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
    }, //The margins of the SVG
    levels: 3, //How many levels or inner circles should there be drawn
    maxValue: 7, //What is the value that the biggest circle will represent
    labelFactor: 1.11, //How much farther than the radius of the outer circle should the labels be placed
    wrapWidth: 50, //The number of pixels after which a label needs to be given a new line
    opacityArea: 0.35, //The opacity of the area of the blob
    dotRadius: 4, //The size of the colored circles of each blog
    opacityCircles: 0.05, //The opacity of the circles of each blob
    strokeWidth: 1, //The width of the stroke around each blob
    roundStrokes: false, //If true the area and stroke will follow a round path (cardinal-closed)
    // color: d3.scaleOrdinal(d3.schemeCategory20), //Color function
    radarColor: {
        show: {
            flavor: "#002057",
            aroma: "#a61e1e"
        },
        hide: {
            flavor: "none",
            aroma: "none"
        }
    },
    radarOpacity: 0.4
};

var dims = ['CITRUS', 'TROPICAL FRUIT', 'STONE FRUIT', 'APPLE-PEAR',
    'MELON', 'BERRY', 'FLORAL', 'SPICY-HERBAL', 'PINE', 'RESINOUS',
    'GRASSY', 'EARTHY-WOODY', 'ONION-GARLIC', 'DANK-CATTY'
];

var senses = ["aroma", "flavor"];

var maxValue = cfg.maxValue;
var allAxis = dims, //Names of each axis
    total = allAxis.length, //The number of different axes
    radius = Math.min(cfg.w / 2, cfg.h / 2), //Radius of the outermost circle
    angleSlice = Math.PI * 2 / total; //The width in radians of each "slice"

var showOrHide = "show",
    selectedSense,
    vizStatus = {},
    nSel = 0;

var colorList = ["#ebaa19", "#6500f6", "#22f8fa"],
    colorStatus = {};
colorList.forEach(function(c) {
    colorStatus[c] = 0;
});

// add tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("text-align", "center")
    .style("vertical-align", "middle")
    .style("width", "auto")
    .style("height", "auto")
    .style("padding", "8px 5px")
    .style("font", "12px sans-serif")
    .style("color", "white")
    .style("background", "black")
    .style("border", "0px")
    .style("border-radius", "8px")
    .style("pointer-events", "none")
    .style("opacity", 0);

function pickColor() {
    var c;
    for (i = 0; i < colorList.length; i++) {
        c = colorList[i]
        if (!colorStatus[c]) {
            colorStatus[c] = 1;
            return c;
        }
    }
    return;
}

//Scale for the radius
var rScale = d3.scaleLinear()
    .range([0, radius])
    .domain([0, maxValue]);

var radarLine = d3.radialLine()
    // .interpolate("linear-closed")
    .radius(function(d) {
        return rScale(d.value);
    })
    .angle(function(d, i) {
        return i * angleSlice;
    })
    .curve(d3.curveLinearClosed); // new version of interpolation I think

function buildRadarChart() {

    //Initiate the radar chart SVG
    var g = d3.select("#radarChartId").append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

    //Wrapper for the grid & axes
    var axisGrid = g.append("g").attr("class", "axisWrapper");

    //Draw the background circles
    axisGrid.selectAll(".levels")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter()
        .append("circle")
        .attr("class", "gridCircle")
        .attr("r", function(d, i) {
            return radius / cfg.levels * d;
        })
        .style("fill", "#CDCDCD")
        .style("stroke", "#CDCDCD")
        .style("fill-opacity", cfg.opacityCircles);

    //Text indicating at what % each level is
    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, (cfg.levels + 1)).reverse())
        .enter().append("text")
        .attr("class", "axisLabel")
        .attr("x", 4)
        .attr("y", function(d) {
            return -d * radius / cfg.levels;
        })
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "#737373")
        .text(function(d, i) {
            return d3.format(".2f")(maxValue * d / cfg.levels);
        });

    //Create the straight lines radiating outward from the center
    var axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");
    //Append the lines
    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", function(d, i) {
            return rScale(maxValue * 1.1) * Math.cos(angleSlice * i - Math.PI / 2);
        })
        .attr("y2", function(d, i) {
            return rScale(maxValue * 1.1) * Math.sin(angleSlice * i - Math.PI / 2);
        })
        .attr("class", "line")
        .style("stroke", "white")
        .style("stroke-width", "2px");

    //Append the labels at each axis
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "9px")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", function(d, i) {
            return rScale(maxValue * cfg.labelFactor) * Math.cos(angleSlice * i - Math.PI / 2);
        })
        .attr("y", function(d, i) {
            return rScale(maxValue * cfg.labelFactor) * Math.sin(angleSlice * i - Math.PI / 2);
        })
        .text(function(d) {
            return d
        })
        .call(wrap, cfg.wrapWidth);
} //buildRadarChart

////////////////////////////////////////////////////////////////
//                BARPLOT VARIABLES AND CHART                 //
////////////////////////////////////////////////////////////////
var barCfg = {
    margin: {
        top: 30,
        right: 20,
        bottom: 50,
        left: 50
    },
    width: 650,
    height: 125,
}

var xDim = d3.scaleBand()
    .domain(dims)
    .rangeRound([0, barCfg.width])
    .paddingInner(0.15);

var xSense = d3.scaleBand()
    .domain(senses)
    .rangeRound([0, xDim.bandwidth()])
    .paddingOuter(0.4);

var dataRadius = xSense.bandwidth() / 5,
    barWidth = dataRadius * 3
barHeight = 4;

var y = d3.scaleLinear()
    .domain([0, 9])
    .range([barCfg.height, 0])

var yAxis = d3.axisLeft(y)
    .ticks(3)
    .tickSizeOuter(0);

var t = d3.transition().duration(200);

function buildBarPlot() {

    d3.select("#barChartId").append("select")
        .attr("id", "barPlotSelector")
        .style("width", "150px")
        .style("position", "absolute")
        .style("left", barCfg.margin.left + "px")
        .on("change", function() {
            plotBars(d3.select(this).property("value"))
        })
        .append("option")
        .attr("value", "")
        .html("CHOOSE A HOP");

    var barPlot = d3.select("#barChartId").append("svg")
        .attr("width", barCfg.width + barCfg.margin.left + barCfg.margin.right)
        .attr("height", barCfg.height + barCfg.margin.top + barCfg.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + barCfg.margin.left + "," + barCfg.margin.top + ")");

    var barLegends = barPlot.append("g")
        .attr("transform", "translate(150," + (5 - barCfg.margin.top) + ")")
        .selectAll(".barLegendLine")
        .data(senses).enter()
        .append("g")
        .attr("transform", function(d, i) {
            return "translate(0," + 10 * i + ")"
        });

    barLegends.append("rect")
        .attr("width", 30)
        .attr("height", 1)
        .style("fill", function(d) {
            return cfg.radarColor["show"][d];
        });
    barLegends.append("text")
        .attr("transform", "translate(35, 3)")
        .style("font-size", "10px")
        .text(function(d) {
            return d;
        })

    barPlot.selectAll(".dimLabel")
        .data(dims)
        .enter()
        .append("text")
        .attr("x", function(d) {
            return xDim(d);
        })
        .attr("y", barCfg.height + barCfg.margin.bottom / 2)
        .text(function(d) {
            return d;
        })
        .attr("text-anchor", "start")
        .attr("font-size", 8)
        .attr("dy", 0)
        .call(wrap, xDim.bandwidth());

    barPlot.append("g")
        .attr("transform", "translate(-10, 0)")
        .call(yAxis);

    barPlot.selectAll(".dimBox")
        .data(dims, function(d) {
            return d;
        })
        .enter()
        .append("g")
        .attr("class", "dimBox")
        .attr("transform", function(d) {
            return "translate(" + xDim(d) + ",0)";
        });
} //buildBarPlot

// function to plot radar data the first time
function addData() {

    selectedSense = d3.select("input[name='sense']:checked").property("value");

    d3.json("all_hop_data.json", function(data) {

        data.forEach(function(d) {
            vizStatus[d.hop] = null;
        });

        // var labelSpacing = (cfg.h + cfg.margin.top + cfg.margin.bottom) / (data.length + 1)

        // var blobWrapper = g.selectAll(".radarWrapper")
        var blobWrapper = d3.select("#radarChartId g").selectAll(".radarWrapper")
            .data(data, function(d, i) {
                return d.hop;
            });

        blobWrapper
            .enter().append("g")
            .attr("class", "radarWrapper")
            .append("path")
            .attr("class", "radarStroke")
            .attr("id", function(d) {
                return d.hop + "Radar";
            })
            .attr("d", function(d, i) {
                return radarLine(extractAvgs(d, selectedSense));
            })
            .style("stroke-opacity", cfg.radarOpacity)
            .style("stroke", cfg.radarColor[showOrHide][selectedSense])
            .style("stroke-width", cfg.strokeWidth)
            .style("fill", "none")
            .on("mouseover", function(d) {
                if (!vizStatus[d.hop]) {
                    alterRadar(this.id, "#258000", 4, 1.0);
                }
                tooltip.html(d.hop.toUpperCase())
                    .style("opacity", 1.0)
                    .style("left", (d3.event.pageX + 10) + "px")
                    .style("top", (d3.event.pageY) + "px");
            })
            .on("mouseout", function(d) {
                tooltip.style("opacity", 0);
                if (!vizStatus[d.hop]) {
                    alterRadar(this.id, cfg.radarColor[showOrHide][selectedSense], cfg.strokeWidth, cfg.radarOpacity);
                }
            });

        var legend = d3.select("#legendId");
        legend.append("h4").html("Hops");
        var hopLabels = legend.selectAll(".hopLabel")
            .data(data.map(function(d) {
                return d.hop;
            }), function(d) {
                return d;
            })
            .enter().append("li")
            .attr("class", "hopLabel")
            .style("cursor", "pointer")
            .style("list-style", "none")
            .style("font-size", "12px")
            .style("padding", "2px 10px")
            .style("margin", "4px 0px")
            .style("border", "1px solid grey")
            .style("border-radius", "4px")
            .html(function(d) {
                return d.toUpperCase();
            })
            .on("mouseover", function(d, i) {
                if (!vizStatus[d]) {
                    d3.select(this).style("background-color", "#a4a4a4")
                    alterRadar(d + "Radar", "#258000", 4, 1.0)
                }
            })
            .on("mouseout", function(d, i) {
                d3.select(this).style("background-color", "white")
                if (!vizStatus[d]) {
                    alterRadar(d + "Radar", cfg.radarColor[showOrHide][selectedSense], cfg.strokeWidth, cfg.radarOpacity)
                }
            })
            .on("click", function(d, i) {
                var truth = vizStatus[d]
                var label = d3.select(this);

                if (!truth) {
                    var color = pickColor();
                    if (!color) alert("You can select a max of 3 hops.");
                    else {
                        label.style("background-color", "white")
                            .style("color", color) // if using li elements
                            .style("font-weight", "bold");
                        alterRadar(d + "Radar", color, 4, 1.0);
                        d3.select("#barPlotSelector").property("value", d);
                        plotBars(d);
                        vizStatus[d] = color;
                    }
                } else {
                    colorStatus[truth] = 0;
                    label.style("color", "black") // if using li elements
                    label.style("font-weight", "normal")
                    alterRadar(d + "Radar", cfg.radarColor[showOrHide][selectedSense], cfg.strokeWidth, cfg.radarOpacity)
                    vizStatus[d] = null;
                }
            });

        d3.select("#barPlotSelector").selectAll(".hopOption")
            .data(data)
            .enter()
            .append("option")
            .attr("class", "hopOption")
            .attr("value", function(d) {
                return d.hop;
            })
            .html(function(d) {
                return d.hop.toUpperCase();
            });
    }) //json callback
} // addData

// adds interactive features (and formatting) to options
function addBehavior() {
    // show/hide unselected hops based on checkbox
    d3.select("#hideHops")
        .property("checked", false)
        .on("change", function() {
            checked = d3.select(this).property("checked");
            showOrHide = checked ? "hide" : "show";
            d3.selectAll(".radarStroke").each(function(d) {
                if (!vizStatus[d.hop]) d3.select(this).style("stroke", cfg.radarColor[showOrHide][selectedSense]);
            });
        });

    // plot radars based on sense/aroma option
    d3.selectAll(".senseOption")
        .on("change", function() {
            selectedSense = d3.select("input[name='sense']:checked").property("value");
            plotRadars(selectedSense);
        });

    d3.selectAll(".senseLabel")
        .style("font-weight", "bold")
        .style("color", function() {
            return cfg.radarColor["show"][d3.select(this).html().toLowerCase()]
        });
    d3.select("fieldset").style("border-radius", "10px");
} //addBehavior

// returns formatted aroma/flavor data
function extractAvgs(hopData, sense) {
    return hopData.data.map(function(d) {
        return {
            axis: d.dimension,
            value: d3.mean(d[sense])
        }
    })
}

// function to plot sense or aroma data and appropriate color
function plotRadars(sense) {
    d3.selectAll(".radarStroke")
        .attr("d", function(d) {
            return radarLine(extractAvgs(d, sense));
        })
        // .style("stroke", cfg.radarColor[showOrHide][sense])
        .style("stroke", function(d) {
            return vizStatus[d.hop] ? d3.select(this).style("stroke") : cfg.radarColor[showOrHide][sense]
        })
}

// function to modify look of radar based on selection/hovering
function alterRadar(hopId, color, thickness, opacity) {
    d3.select("#" + hopId)
        .style("stroke-width", thickness)
        .style("stroke", color)
        .style("stroke-opacity", opacity);
}

// function to plot bar data
function plotBars(hop) {

    if (!hop) {
        d3.selectAll(".senseData").selectAll("*").remove();
        return;
    }

    var hopData = d3.select("#" + hop + "Radar").datum();
    var dimBoxes = d3.selectAll(".dimBox")
        // .data(hopData.data, function(d) { return d.dimension; });
        .data(hopData.data);

    var senseGroups = dimBoxes.selectAll(".senseData")
        .data(function(d) {
            return senses.map(function(s) {
                return {
                    sense: s,
                    values: d[s]
                };
            })
        });

    senseGroups.enter()
        .append("g")
        .attr("class", function(d) {
            return "senseData " + d.sense + "Data";
        })
        .attr("transform", function(d) {
            return "translate(" + xSense(d.sense) + ",0)";
        });

    senseGroups = d3.selectAll(".senseData");

    var meanBars = senseGroups.selectAll(".meanBar")
        .data(function(d) {
            return [{
                sense: d.sense,
                avg: d3.mean(d.values)
            }];
        });

    meanBars.enter()
        .append("rect")
        .classed("meanBar", 1)
        .attr("x", -barWidth / 2)
        .attr("width", barWidth)
        .style("fill", "white")
        .style("stroke", function(d) {
            return cfg.radarColor["show"][d.sense]
        })
        .on("mouseover", function(d) {
            tooltip.html(d3.format("0.2f")(d.avg))
                .style("opacity", 1.0)
                .style("left", (d3.event.pageX + 10) + "px")
                .style("top", (d3.event.pageY) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("opacity", 0);
        })
        .merge(meanBars)
        .transition(t)
        .attr("y", function(d) {
            return y(d.avg)
        })
        .attr("height", function(d) {
            return y(0) - y(d.avg)
        });

    var dataPoints = senseGroups.selectAll(".dataPoint")
        .data(function(d) {
            return d.values;
        });
    dataPoints.exit().transition(t).remove();

    dataPoints.enter()
        .append("circle")
        .classed("dataPoint", 1)
        .attr("r", dataRadius)
        .attr("fill", "black")
        .attr("fill-opacity", 0.1)
        .merge(dataPoints)
        .transition(t)
        .attr("cy", function(d) {
            return y(d);
        });
} //plotBars

// build all the stuff!
setupDocument();
buildRadarChart();
buildBarPlot();
addBehavior();
addData();

//Modified from http://bl.ocks.org/mbostock/7555321
//Wraps SVG text
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/[\s\-]/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.4, // ems
            y = text.attr("y"),
            x = text.attr("x"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                // second condition in previous line was needed to avoid empty lines when first word is too long
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}
