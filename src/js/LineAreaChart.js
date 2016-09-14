var LineAreaChart = function LineAreaChart(domID,minimumHeight,heightOverwidth,percentSize,toolTipClass) {
  var self = this;
  this.domID=domID;
//this is array of objects
  this.data=null;
  this.standard=null;
  this.defaultWidth = 960;
  this.defaultHeight = 420;

//If no percent size then calculate from outer container 
  this.autoSize = true;
  if (percentSize) {
    this.percentSize = percentSize;
    this.autoSize = false;
  }

  this.margin = { top: 40, right: 20, bottom: 60, left: 80 };  

  this.chartWidth  = this.getChartWidth(this.defaultWidth);
  this.chartHeight = this.getChartHeight(this.defaultHeight);

//Allow aspect ratio to be passed in otherwise just use the default
  this.heightOverwidth = heightOverwidth || this.chartHeight/this.chartWidth;    

//minimumHeight will keep graph from not having usable height on small screens
  this.minimumHeight = minimumHeight || 0;

  this.getAutoSize();
  
//Make the margin scale don't do this for now
//  this.margin.top *= this.width/960;
//  this.margin.bottom *= this.width/960;
//  this.margin.left *= this.height/420;
//  this.margin.right *= this.height/420;

  this.legendWidth = 200,
  this.legendHeight = 90;
  this.title = {};
  this.ytitle = {};  
//These are the x and y field names in which the cross hairs will follow
  this.xField = null;  
  this.yField = null;  
//These are functions that return argument to .domain() call
  this.getXdomain = null;  
  this.getYdomain = null;  
//This sets the step size between tick marks between. If null use default settings
  this.xTickSize = null;
  this.yTickSize = null;
  
//This is the custom function that draws the different areas and lines
  this.drawPaths = null;
//This is the custom function that draws the legend
  this.addLegend = null;
//set the current x value of cross hairs
  this.currentX = null;    
  //this is place to store tooltip data that is constant for all points but changes when layer/attribute changes
  this.tooltipData={};
//reference to slider so moving point will move slider
  this.slider=null;  
  this.useTransitions=false;
//reference to function to call on mouseover
  this.externalMouseOver=null;  
  this.externalMouseOut=null;  

  this.pointSize = 6;
//set up the tooltip
//note: passing optional tooltip class now to differentiate containers with multiple tooltips 
  this.tooltip = new MapChartTooltip(self,toolTipClass);
//show/hide tooltip when hover the wide vertical crosshair
//  this.setTooltipHover(d3.select('#' + this.domID));
     
//set up resopnsiveness when resized
  this.debouncer = new MapChartResize(this, function() {
    self.makeChart();
  }, 200)

};

LineAreaChart.prototype.getChartWidth = function (width) {
  if (! width) width=this.width;
  return width  - this.margin.left - this.margin.right;
};
LineAreaChart.prototype.getChartHeight = function (height) {
  if (! height) height=this.height;
  return height - this.margin.top  - this.margin.bottom;
};

LineAreaChart.prototype.getAutoSize = function () {
//If no percent size then calculate from outer container 
  if (this.autoSize===true)  this.percentSize = parseInt(d3.select("#" + this.domID).style('width'))/this.defaultWidth;    
  
  this.width= this.defaultWidth * this.percentSize;
//Don't let height go under minimum height. Ok to change aspect ratio on a chart  
//note this.minimumHeight is min chart height
  var scaledChartHeight = Math.max(this.minimumHeight,this.getChartWidth(this.width) * this.heightOverwidth);

  this.height= scaledChartHeight + this.margin.top + this.margin.bottom;
};


//More convenient to call this from outside if needing to show tooltip
LineAreaChart.prototype.showToolTip = function () {
    var self=this;
//have to pass pointElement we are hovering equal to self.dragArea.node() but don't pass data it changes with slider
    if (self.tooltip.showToolTip) self.tooltip.showToolTip(null,self.dragArea.node());
    if (self.externalMouseOver) self.externalMouseOver();  
};

//More convenient to call this from outside if needing to hide tooltip
LineAreaChart.prototype.hideToolTip = function () {
    var self=this;
    if (self.tooltip.hideToolTip) self.tooltip.hideToolTip();
    if (self.externalMouseOut) self.externalMouseOut();  
};

LineAreaChart.prototype.setTooltipHover = function (element) {
  var self = this;
//  element.on('mouseover', function (d) {
  element.on('mouseenter', function (d) {
//    console.log("enter");
      if (self.tooltip.disable!==true) self.showToolTip();
    }).on('mouseleave', function () {
//      console.log("leave");
      self.hideToolTip();      
    });
//    .on('mouseout', function () {
};

LineAreaChart.prototype.makeChart = function () {
//Get the size of the chart using container is auto size=true
    this.getAutoSize();

//if no title then don't have huge margin
  if (! this.title.text) this.margin.top=10;
  
//  this.makeChartDefer = $.Deferred();
  this.chartWidth  = this.getChartWidth();
  this.chartHeight = this.getChartHeight();

//  console.log("this.chartHeight " + this.chartHeight);
//  console.log("this.title.text " + this.title.text);
  
//This works pretty good as a default x domain. just the extent of the x data
  this.getXdomainDefault =  function (self) {return d3.extent(self.data, function (d) { return 1*d[self.xField]; })};
//If they don't set the getXdomain function then use the default
//  if (! this.getXdomain) this.getXdomain =  function (self) {var ex=d3.extent(self.data, function (d) { return 1*d[self.xField]; });ex[1]=2015;return ex};
  if (! this.getXdomain) this.getXdomain =  this.getXdomainDefault;

  var xDomain = this.getXdomain(this);
//this is function that converts x value to screen value
  this.xScale = d3.scale.linear().range([0, this.chartWidth])
//          .domain(d3.extent(this.data, function (d) { return d.year; }));
          .domain(xDomain);

  var yDomain = this.getYdomain(this);
  this.yScale = d3.scale.linear().range([this.chartHeight, 0])
//          .domain([0, 1.1*d3.max(this.data, function (d) { return d.p90; })]);
//          .domain([0.9*d3.min(this.data, function (d) { return d.p10; }), 1.1*d3.max(this.data, function (d) { return d.p90; })]);
          .domain(yDomain);

  var xTickCount = this.chartWidth / (90) + 1;  
  var yTickCount = this.chartHeight / (50) + 1;  

  if (this.xTickSize) {
    xTickCount = (xDomain[1]-xDomain[0])/this.xTickSize + 1;
  }
  if (this.yTickSize) {
    yTickCount = (yDomain[1]-yDomain[0])/this.yTickSize + 1;
  }
  
  this.xAxis = d3.svg.axis().scale(this.xScale).orient('bottom').ticks([xTickCount]).tickFormat(d3.format("d"))
              .innerTickSize(-this.chartHeight).outerTickSize(0).tickPadding(10),
  this.yAxis = d3.svg.axis().scale(this.yScale).orient('left').ticks([yTickCount])
              .innerTickSize(-this.chartWidth).outerTickSize(0).tickPadding(10);

//if chart it already made them remove it and start again
  d3.select('#' + this.domID + " .naaqs-chart-svg").selectAll("*").remove();

  this.svgBottom = d3.select('#' + this.domID + " .naaqs-chart-svg").append('svg')
    .attr('width',  this.width)
    .attr('height', this.height)
//  .attr("viewBox", "0 0 " + this.width + " " +   this.height)
  this.svg = this.svgBottom
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

  this.verticalLineGroup = this.svgBottom
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
  
  this.addTitle();
  this.addAxes();
  this.addLegend();
  this.drawPaths();
  this.addVerticalLine();

//now that we have point size we can offeset
  this.tooltip.offset = {x:this.pointSize,y:this.pointSize};
};



LineAreaChart.prototype.addVerticalLine = function () {
  var self=this;
//  this.bisect = d3.bisector(function(d) { return d[self.xField]; }).left;
  this.bisect = d3.bisector(function(d) { return d[self.xField]; }).left;

  this.verticalLine = this.verticalLineGroup.append('line')
//  this.verticalLine = this.svg.append('line')
// .attr('transform', 'translate(100, 50)')
                    .attr({
                        'x1': 0,
                        'y1': 0,
                        'x2': 0,
                        'y2': this.chartHeight
                    })
                    .attr("stroke", "black")
//do this in the css now
//                    .style("stroke-dasharray", ("5, 5"))
                    .attr('class', 'naaqs-chart-crosshair-vertical');

  this.setTooltipHover(this.verticalLine);

  this.horizontalLine = this.svg.append('line')
// .attr('transform', 'translate(100, 50)')
                    .attr({
                        'x1': 0,
                        'y1': 0,
                        'x2': this.chartWidth,
                        'y2': 0
                    })
                    .attr("stroke", "black")
//do this in the css now
//                    .style("stroke-dasharray", ("5, 5"))
                    .attr('class', 'naaqs-chart-crosshair-horizontal');

  this.movingPoint = this.verticalLineGroup.append("circle")
                    .attr("opacity", 0)
                    .attr('class', 'naaqs-chart-movingPoint');
                    
//now get the size of the moving point
  this.movingPoint.style("r",null); //reset to css r value if there is one
  var cssPointSize = parseInt(this.movingPoint.style("r"));
//if there is css point size set then over ride default point size set on LineAreaChart object
  if (cssPointSize) this.pointSize = cssPointSize; //tooltip needs to know the css point size  later so it can offset
  this.movingPoint.style("r",this.pointSize + "px"); //not set r
//setting r using css doesn't work for some browsers like FF so have to make it an attribute
  if (! this.movingPoint.style("r")) this.movingPoint.attr("r",this.pointSize + "px");
                         
//put this below column and allow it to show tolltip whe it races ahead
  this.dragArea = this.verticalLineGroup.append("circle")
                    .attr("opacity", 0)
                    .attr({
                        r: 50
                    })
  this.setTooltipHover(this.dragArea);

//set up a drag event on the moving point that will move the line
//have to call it probably from an area
  this.dragBehavior = d3.behavior.drag()
        .on("drag", function(d,i) {
//          var x = d3.event.x - self.margin.left;
          var x = d3.event.x;
          var xValue = self.xScale.invert(x);
          if (self.slider )  {
  //keep xValue in range of chart
            xValue = Math.min(Math.max(xValue, self.slider.min), self.slider.max);
//          console.log('d3.event x xValue ' + x + ' ' + xValue);

            self.slider.moveSlider(xValue);
//This will snap the point to where the slider is
//            self.slider.slider.value()
//            self.slider.moveSlider(self.slider.slider.value());       
          }else {
//if no slider linking this chart movement to other then just move itself
            self.moveLine(xValue);            
          }
        });        

//  this.verticalLine        
  this.dragArea
  .call(this.dragBehavior);

                            
//initialize to first data point
  if (! this.currentX) this.currentX = this.data[0][self.xField];
  this.moveLine(this.currentX);
  
};

LineAreaChart.prototype.getInterpolatedYvalue = function (x,yLeft,yRight) {
  return 1*yLeft + (1*yRight-1*yLeft)*(x-1*parseInt(x));
}

LineAreaChart.prototype.moveLine = function (value) {
//  console.log("move line " + value);
  var self = this;
//If value is greater than max then don't even try to move line
  var maxValue = this.getXdomainDefault(this)[1];
  if (value>maxValue) return; 
//save this for later eg. when refresh map and don't want cross hairs refreshed  
  this.currentX = value;
  
  var indexRight = this.bisect(this.data, value);
  var indexLeft = 0;
  if (indexRight>0) indexLeft = indexRight-1
//if right on number then item left is now at number 
  if (value==parseInt(value)) indexLeft = indexRight

  var itemRight = this.data[indexRight];
  var itemLeft = this.data[indexLeft];

  var translateX = this.xScale(value);
  var yValue = this.getInterpolatedYvalue(value,itemLeft[self.yField],itemRight[self.yField]);
  var translateY = this.yScale(yValue);

//Force no transition now. before beginning couldn't have transition or it wasn't starting over right
//Now i set the increment from 1000 to 100 to 10 which seems to look good
  if (value<=this.data[0][self.xField] || this.useTransitions!==true) {
//    console.log("no trans " + value);
    d3.select("#" + this.domID + " .naaqs-chart-crosshair-vertical").attr("transform", function() {
        return "translate(" + translateX + ",0)";
    });
    d3.select("#" + this.domID + " .naaqs-chart-crosshair-horizontal").attr("transform", function() {
        return "translate(0," + translateY + ")";
    });
    
    this.movingPoint.attr("opacity", 1)
            .attr("cx", translateX)
            .attr("cy", translateY);
            
    this.dragArea
            .attr("cx", translateX)
            .attr("cy", translateY)
            .call(refreshToolTip);               
            
  } else {
    d3.select("#" + this.domID + " .naaqs-chart-crosshair-vertical").transition().attr("transform", function() {
        return "translate(" + translateX + ",0)";
    });
    d3.select("#" + this.domID + " .naaqs-chart-crosshair-horizontal").transition().attr("transform", function() {
        return "translate(0," + translateY + ")";
    });
    
    this.movingPoint.transition().attr("opacity", 1)
            .attr("cx", translateX)
            .attr("cy", translateY);
//            .each("end",refreshToolTip);      //refresh the tooltip after the transition is done so point is in proper location
            
    this.dragArea
//    .transition()
            .attr("cx", translateX)
            .attr("cy", translateY)    
            .call(refreshToolTip);  //attach tooltip to dragArea which doesn't follow transition
  } 
  
//    console.log(translateX);
//  console.log(translateY);
//Move and rebind the the tooltip
//  this.moveToolTip(translateX,translateY,value,itemLeft,itemRight);
  

//render and move the point but do NOT actually show the point. keep hidden until somebody hovers
  function refreshToolTip() {
//    console.log("refresh tooltip " + value);
    var interpolatedData = {}
    Object.keys(self.data[0]).forEach(function (key) {
          interpolatedData[key] = self.getInterpolatedYvalue(value,itemLeft[key],itemRight[key]);
    });
    self.tooltip.renderToolTip(interpolatedData);
//    setTimeout(function () {
//    self.tooltip.moveToolTip(self.movingPoint.node());
    self.tooltip.moveToolTip(self.dragArea.node(),this.useTransitions);
//    },1000);
  }
};


LineAreaChart.prototype.addTitle = function () {
  this.htmlTitle = d3.select("#" + this.domID + "-container .naaqs-chart-title span");
  this.svgTitle = null;

  var maxFontSize=20;
  var FontSize=20;
  var scale = 1;
  if (! this.htmlTitle.empty()) {
//reset max font size to come from CSS  
    this.htmlTitle.style("font-size","");
    maxFontSize = parseInt(this.htmlTitle.style("font-size"));
    this.htmlTitle.html(this.title.text);
    var available = .9 * $("#" + this.domID + "-container").width();
    scale = $(this.htmlTitle.node()).width() / available;
    FontSize = Math.min(maxFontSize,maxFontSize/scale);
    this.htmlTitle.style("font-size", FontSize + "px");
  }else {
    this.svgTitle = this.svg.append("text")
          .attr("y", 0 - (this.margin.top / 2))
          .attr("text-anchor", "middle")  
          .text(this.title.text);
          
    maxFontSize = parseInt(this.svgTitle.style("font-size"));          
  //shrink the title if it is not fitting on chart
    scale = this.svgTitle.node().getBBox().width / this.chartWidth;
//fit not just chartwidth but full width if over chart width
    if (scale > 1) scale = Math.min(1,this.svgTitle.node().getBBox().width / this.width);
    FontSize = Math.min(maxFontSize,maxFontSize/scale);
    this.svgTitle.style("font-size", FontSize + "px");     

    //center vector title
    this.svgTitle
  //        .attr("x", this.margin.left + (this.chartWidth - this.svgTitle.node().getBBox().width)/2);             
  //        .attr("x", this.chartWidth/2);             
          .attr("x", this.width/2 - this.margin.left);                 
  }
};


LineAreaChart.prototype.addAxes = function () {
  var self=this;

  this.axes = this.svg.append('g')
    .attr('clip-path', 'url(#axes-clip)');

//  this.xAxisElement = this.axes.append('g')
  this.xAxisElement = this.svg.append('g')
    .attr('id', 'naaqs-chart-axis-x')
    .attr('class', 'x naaqs-chart-axis')
    .attr('transform', 'translate(0,' + this.chartHeight + ')')
    .call(this.xAxis);

  this.yAxisElement = this.axes.append('g')
    .attr('class', 'y naaqs-chart-axis')
    .call(this.yAxis);
    
  this.yAxisTitle=this.yAxisElement.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('dy', '.71em')
      .attr('class', 'naaqs-chart-yaxis-title')
      .style('text-anchor', 'middle')
      .text(this.ytitle.text);

  var yAxisFontSize = parseInt(this.yAxisTitle.style("font-size"));

//shrink the title if it is not fitting on chart
  var scaleYaxisTitle = this.yAxisTitle.node().getBBox().width / this.chartHeight;
  if (scaleYaxisTitle > 1) {
    this.yAxisTitle.style("font-size", (yAxisFontSize / scaleYaxisTitle) + "px");     
//      this.yAxisTitle.attr("transform", "translate(" + [(this.chartWidth - scaleLegend*this.legend.node().getBBox().width)/2,this.chartHeight + 35] + ")scale(" + scaleYaxisTitle  + ")");
    
  }

  var yaxisLabelWidth = this.yAxisTitle.node().getBBox().height;
  var yaxisWidth = this.yAxisElement.node().getBBox().width - this.chartWidth;
  this.yAxisTitle
//      .attr('y', 0-this.margin.left)
      .attr('y', 0-1.5*yaxisLabelWidth-yaxisWidth)
      .attr('x', -this.chartHeight/2)

};

