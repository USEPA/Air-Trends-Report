var LineAreaChart = function LineAreaChart(domID,minimumHeight,heightOverwidth,percentSize,toolTipSelector,toolTipTemplate) {
  var self = this;
  this.domID=domID;
  //Can set this to get the container to use for auto sizing
  this.containerID = null;  
  //This so we know full javascript path to call this chart's member from HTML markup
  this.namespace = null;

//Sometimes the chart is not visible and thus don't want to try to make chart or it will break stuff  
  this.visible = true;

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

  this.margin = { top: 10, right: 20, bottom: 60, left: 400 };  
  //This is what the margin should be after making the chart  
  //Probably could have designed chart better but this should work for now
  //This will be calculated after drawing chart first time but for now copy in case it isn't created
  this.marginCorrected = $.extend({},this.margin);  

  this.chartWidth  = this.getChartWidth(this.defaultWidth);
  this.chartHeight = this.getChartHeight(this.defaultHeight);

//Allow aspect ratio to be passed in otherwise just use the default
  this.heightOverwidth = heightOverwidth || this.chartHeight/this.chartWidth;    

//minimumHeight will keep graph from not having usable height on small screens
  this.minimumHeight = minimumHeight || 0;
//maximumHeight will keep graph from getting tool tall and require scrolling
  this.maximumHeight = null;
//overrideHeight will "force" the chartHeight to be overrideHeight when autosizing
//Not sure the repurcussions of hard coding this.chartHeight to this is softer way 
//Basically could set minimumHeight=maximumHeight to get same effect as overrideHeight
//But when changing way chart behaves responsively as window reiszes don't want to mess with minimumHeight or maximumHeight values we might want to use when not overriding/forcing height
  this.overrideHeight = null;

  this.getAutoSize();

//put legend stuff in here  
//  this.legend = {};
  this.legend = new etrends.library.MapChartLegend(this);
  this.legend.AllowHiddenSeries = true;

  this.title = new etrends.library.MapChartTitle(this);

  this.ytitle = {};  
  this.ysecondarytitle = {};  
//These are the x and y field names in which the cross hairs will follow
  this.xField = null;  
  this.yField = null;  
//These are functions that return argument to .domain() call
  this.getXdomain = null;  
  this.getYdomain = null;  
  //This used if we want another yaxis on right
  this.getYsecondaryDomain = null;  
//This to use percent for getYdomain
  this.convertYdomainToPercent = false;

//This sets the step size between tick marks between. If null use default settings
  this.xTickSize = null;
  this.yTickSize = null;
  //for custom x axis lables other than integers
  this.tickFormat = null;

//This is the custom function that draws the different areas and lines
  this.drawPaths = null;
//This is the custom function that draws the legend
//No longer custom anymore
//  this.addLegend = null;
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
  //This is the width of the bar surounding point that is dragged to move point. initialize default here.
  this.dragAreaWidth = 50;  
//set up the tooltip
//note: passing optional tooltip class now to differentiate containers with multiple tooltips 
//Also can pass the toolTipTemplate selector now in case it is located outside normal path (eg: for chart tooltip inside map tooltip can't have textarea in textarea)
  this.tooltip = new MapChartTooltip(self,toolTipSelector,toolTipTemplate);
//show/hide tooltip when hover the wide vertical crosshair
//  this.setTooltipHover(d3.select('#' + this.domID));

//Need to add a function that tooltip can access that will determine if series is displayed
  this.tooltip.data['f.seriesDisplay'] = function (name) {
    //if self.series not set up then return empty string 
    if (self.series) {
      if (self.series.filter(function (x) {return x.name==name && x.hidden}).length>0) return 'none';
    }
    return '';
  };
  this.tooltip.data['f.seriesDisplayHideMissing'] = function (name,value) {
    //If only 1 argument then get value from data assuming series name is same as data name
    if (arguments.length==1) {
      //note the data being rendered/binded is context/scope of function when called by MapChartTooltip 
      value = this[name];
    }
    //This not only hide hidden series but also hides if value is missing
    if (!value && value!==0) return 'none';
    //reuse seriesDisplay function
    return self.tooltip.data['f.seriesDisplay'](name);
  };
  
//If Missing Value then return string = "hidden" or whatever class will is used for hiding
   this.tooltip.data["f.isHiddenIfMissing"] = function (value,hidden) {if (!hidden) hidden="hidden";return (value || value===0) ? "" : hidden;}; 
//Missing values should say NoData or whatever is passed to this function
   this.tooltip.data["f.isMissing"] = function (value,nodata) {if (!nodata) nodata="No Data"; return (value || value==0) ? value : nodata;}; 

  this.tooltip.data["f.customSymbol"] = function (name) {
    var seriesItem = self.series.filter(function (item) {return item.name==name})[0];
    var symbol = self.getSVGsymbol(seriesItem);

    //create a group to add children element in svg to
    var group = $("<g>");
    group.attr("transform","scale(" + symbol.scale + ")");
    group.attr("class","etrends-chart-point-" + seriesItem.class);

    //add children elements of svg to group    
    var symbolItems = symbol.svg.children();
      symbolItems.each(function (i,item) {
        //convert d3 to jquery to append the svg children dom elements
        group.append($(item).clone());
      })

    //create new svg and add group
    var svg = $("<svg>");
    svg.css("background","none");
    //Note: round up to nearest pixel
    svg.attr("height",Math.ceil(symbol.height*symbol.scale));
    svg.attr("width",Math.ceil(symbol.width*symbol.scale));
    
    svg.append(group);

    var tempDiv = $("<div>");
    tempDiv.append(svg);

    return tempDiv.html();
  };
  //If hovering over tooltip don't hide until off tooltip
  this.tooltip.div
  .on('mouseleave', function () {
    //Only do this if dragging. We know we are dragging if there is a yField
    if (!self.yField) return;
    if (self.tooltip.showing) return;
    //Check if  mouse is hovering over drag area. If yes then don't hide tooltip
    if (self.dragArea && etrends.library.utilities.mouseContainedBy(self.dragArea.node())) return;    
    self.hideToolTip();
  })

    //This is the export menu functionality
  this.export = new etrends.library.MapChartExportMenu(this);
//svgExportElements are DOM elements that will be exported as PNG or printed
//It is a function to make sure the currently rendered elements are used
  this.export.svgExportElements = function () {return [self.title.svg.node(),self.svgBottom.node(),self.legend.svg.node()]};


//This is function that gets data ready for export. Probably needs to be custom for chart vs map
    this.export.getData =  function () {
      //Might as well have self be the host ie. this line area chart
      var self = this.host;
      var visibleSeries = self.series.filter(function (item) {return item.hidden!==true});
    //Note: columns to export can be hardcoded Also
      if (self.export.exportColumns) visibleSeries = self.export.exportColumns;

	//Sometimes want the exported field to be different than plotted eg. Date instead of Index because Date is just a text label and can't be plotted  
      var xExportField = self.xExportField || self.xField;

      var filteredData = self.data;
      if (etrends.library.utilities.isNumeric(self.dragBarMin)) {
        filteredData = self.data.filter(function (d) {
          return d.year>=self.dragBarMin;
        });
      }
	
      var data = filteredData.map(function (row) {
        var obj = {};
        obj[xExportField] = row[xExportField];
        obj = visibleSeries.reduce(function (acc,value) {
          var field = value.name;
          if (self.export.exportColumns) field = value;      
          if (self.convertYdomainToPercent) {
            obj[field] = 100*row[field]/row.SumOfSeries;
          } else {
            obj[field] = row[field];
          }
          return obj;
        },obj);
        return obj;
      });
      return data;
    }

//set up resopnsiveness when resized
  this.resizeDebouncer = new MapChartResize(this, function() {
    //If no data added yet don't try to resize because it will lead to breaks
    if (! self.data) return;
    self.resize(self);
  }, 200)

//create bisector function for interpolating xvalues
  //  this.bisect = d3.bisector(function(d) { return d[self.xField]; }).left;
  this.bisect = d3.bisector(function(d) { return d[self.xField]; }).left;

//Set this to use animations when drawing lines
this.useAnimations = false;
};

//By default this just redraws chart but it can be over ridden
LineAreaChart.prototype.resize = function (self) {
  //easiest to just have self passed to resize function because resize called in some other context typically
  //if not self passed can assume this is self
  if (!self) self = this;
  self.makeChart();
};

LineAreaChart.prototype.getChartWidth = function (width) {
  if (! width) width=this.width;
  return width  - this.margin.left - this.margin.right;
};
LineAreaChart.prototype.getChartHeight = function (height) {
  if (! height) height=this.height;
  return height - this.margin.top  - this.margin.bottom;
};

LineAreaChart.prototype.getContainer = function () {
  var containerID = this.containerID || this.domID + '-container'; 
  //works better to get height with jquery. d3 returns auto when chart not showing
  var $container = $("#" + containerID);
  return $container;
};

LineAreaChart.prototype.getAutoSize = function () {
//If no percent size then calculate from outer container
  var containerID = this.containerID || this.domID; 
  var selectDomID = d3.select("#" + containerID);
  var container = this.getContainer();
  if (container.length==0) return;
  if (this.autoSize===true)  {
    this.percentSize = parseInt(container.width())/this.defaultWidth;      
    this.width= this.defaultWidth * this.percentSize;
  }
//Don't let height go under minimum height. Ok to change aspect ratio on a chart  
//note this.minimumHeight is min chart height
  var scaledChartHeight = Math.max(this.minimumHeight,this.getChartWidth(this.width) * this.heightOverwidth);
  if (this.maximumHeight && scaledChartHeight > this.maximumHeight) {
    scaledChartHeight = this.maximumHeight;
    //Actually don't maintain aspcet if capping height. Will look funny to have graph not filling containter
    //can option to do this later if desired
    //this.width = scaledChartHeight/this.heightOverwidth + this.margin.left + this.margin.right;
  }
//Just force the scaledChartHeight to be overrideHeight if it is set.
//Typically is null unless doing fancy stuff like naaqs charts changing height to fit map height  
  if (this.overrideHeight) scaledChartHeight = this.overrideHeight;

  this.height= scaledChartHeight + this.margin.top + this.margin.bottom;
};


//More convenient to call this from outside if needing to show tooltip
LineAreaChart.prototype.showToolTip = function () {
    var self=this;
//have to pass pointElement we are hovering equal to self.dragArea.node() but don't pass data it changes with slider
    if (self.tooltip.showToolTip) self.tooltip.showToolTip(null,self.movingPoint.node());
//    if (self.tooltip.showToolTip) self.tooltip.showToolTip(null,self.dragArea.node());
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

  if (self.yField) {
  
  element.on('mouseenter', function (d) {
//    console.log("enter");
      if (self.tooltip.disable!==true) self.showToolTip();
    }).on('mouseleave', function (evt) {
      //Also check if  mouse is hovering over tooltip. If yes then don't hide tooltip
      //Only do this for the moving point not tooltip over mouse
      if (etrends.library.utilities.mouseContainedBy(self.tooltip.div.node())) return;
      //Also check if  mouse is hovering over drag area. If yes then don't hide tooltip
      //Make sure the element is not the drag node though because if drag node is behind white part it triggers mouse leave but mouse still contained by drag area
      //Not sure if setTooltipHover is put on other elements so don't need this but this will work for futuer
      if (self.dragArea.node() !== element.node() && etrends.library.utilities.mouseContainedBy(self.dragArea.node())) return;

      self.hideToolTip();  
    });
  } else {
//If not using dragging point but using tooltip on hover then set handlers
    self.svgBottom.on("mousemove",function () {
      var xy = d3.mouse(self.svg.node());
      //If chart is in modal on firefox, d3.mouse keeps subtracting 300 from y
      //Get mouse from page event and subtract from jquery offset
      if (self.chartInModalTweak) {
        xy[1] = d3.event.pageY - $(self.svgBottom.node()).offset().top - self.chartInModalTweak;
      }


      var xValue = self.xScale.invert(xy[0]);
      //Note: do not need to worry about secondary axis here because moveLine is relative to primary axis (could allow option to use secondary in move line if needed later)
      var yValue = self.yScale.invert(xy[1]);
//  console.log(xValue);
      var snappedXvalue = xValue;
      if (self.snapToInterval) snappedXvalue = self.snapToInterval(xValue);
      if (snappedXvalue !== xValue) {
        self.moveLine(snappedXvalue,yValue,'mousemove');
      }
      toggleTooltip();
    })
    //have to fire mousemove when over tooltip Also
    self.tooltip.div.on("mousemove",self.svgBottom.on("mousemove"));

    //Don't show the vertical line until hovering
    self.verticalLine.attr("opacity",0);   

    self.svgBottom.on("mouseenter",toggleTooltip);
    self.svgBottom.on("mouseleave",toggleTooltip);
     
    function toggleTooltip() {
      var contained = etrends.library.utilities.mouseContainedBy(self.svgBottom.node(),self.margin,true);
      if (self.tooltip.hovering) {        
        if (!contained) {
          self.hideToolTip();  
          self.tooltip.hovering=false;
          //if using mouse hover for tooltip then hide the vertical line also
          self.verticalLine.attr("opacity",0);
//move this to turn off if not contained because mousemove was firing when on axis which fired moveLine which showed points again          
//          self.toggleMovingSymbols(false);
        }
      }else {
        if (contained) {
          //Set the offset
          var verticalLineWidth = parseInt(self.verticalLine.style("stroke-width"));

          self.tooltip.offset = {x:1.1*verticalLineWidth/2,y:0};
          if (self.tooltip.disable!==true) self.showToolTip();
          self.tooltip.hovering=true;
          //if using mouse hover for tooltip then show the vertical line also
          self.verticalLine.attr("opacity",1)
          //Actually don't turn symbols on here because some might be hidden due to no data
          //let moveLine function show those with data and hide those without data
          //self.toggleMovingSymbols(true);
        }
      }      
      //Have to make sure points are not shown if mouse not contained in chart
      if (!contained) self.toggleMovingSymbols(false);

    }
  }
};

LineAreaChart.prototype.makeChart = function () {
  var self = this;
  //If chart not showing becaues in hidden modal like emissions don't draw chart. it breaks stuff
  if (self.visible===false) return;

  self.margin.left=0;
  self.margin.bottom=0;
  if (self.getYsecondaryDomain) self.margin.right=0;
  self.makeChartSingle(1);
  self.margin.left = self.marginCorrected.left;
  self.margin.bottom = self.marginCorrected.bottom;
//  if (self.getYsecondaryDomain) self.margin.right = self.marginCorrected.right;
//If right margin is corrected then use that
  if (self.marginCorrected.right || self.marginCorrected.right===0) self.margin.right = self.marginCorrected.right;
  self.makeChartSingle(2);
  //extra stuff that can be called when the chart is redrawn
  //helped for emissions stuff that had to fire making chart in etrends_customs and also do some super customized stuff
  if (self.externalMakeChart) self.externalMakeChart();
};

//This is what actually makes chart. But caller will use makeChart which basically makes chart twice so it can get margin size from axes
LineAreaChart.prototype.makeChartSingle = function (drawOrder) {
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
  this.getXdomainDefault =  function (self) {
    return d3.extent(self.data, function (d) { return 1*d[self.xField]; })};
//If they don't set the getXdomain function then use the default
//  if (! this.getXdomain) this.getXdomain =  function (self) {var ex=d3.extent(self.data, function (d) { return 1*d[self.xField]; });ex[1]=2015;return ex};
  if (! this.getXdomain) this.getXdomain =  this.getXdomainDefault;

  this.xDomain = this.getXdomain(this);
  //If there is categorical axis need ordinal scale
  if (this.xDomainType=='ordinal') {
    this.xScale = d3.scale.ordinal().rangePoints([0, this.chartWidth],1)
            .domain(this.xDomain);
  }else {
  //this is function that converts x value to screen value
    this.xScale = d3.scale.linear().range([0, this.chartWidth])
            .domain(this.xDomain);
  }

  var xTickCount = this.chartWidth / (90) + 1;  
  //If ordinal then force a tick for each category
  if (this.xDomainType=='ordinal') {
    xTickCount = this.xDomain.length;
  }

  if (this.xTickSize) {
    xTickCount = (this.xDomain[1]-this.xDomain[0])/this.xTickSize + 1;
  }
  if (this.xTickCount) {
    xTickCount = this.xTickCount;
  }
  
  this.xAxis = d3.svg.axis().scale(this.xScale).orient('bottom');

  if (this.xTickValues) {
    this.xAxis.tickValues(this.xTickValues);
  } else {
    this.xAxis.ticks([xTickCount]);
  } 
  this.xAxis
    .innerTickSize(-this.chartHeight).outerTickSize(0).tickPadding(10);

  if (this.xDomainType!='ordinal') {
    var tickFormat = this.tickFormat || d3.format("d");
    this.xAxis
      .tickFormat(tickFormat);
  }

//This was put in function so it could be called when toggle form percent to absolute
  this.setUpYaxis();

//if chart it already made them remove it and start again
  d3.select('#' + this.domID + " .etrends-chart-svg").selectAll("*").remove();

  if (isNaN(this.width)) {
    console.log('isNan ' + this.domID)
  }
  this.svgBottom = d3.select('#' + this.domID + " .etrends-chart-svg").append('svg')
    .attr('width',  this.width)
    .attr('height', this.height)
    .attr("xmlns","http://www.w3.org/2000/svg")
//  .attr("viewBox", "0 0 " + this.width + " " +   this.height)

  this.svg = this.svgBottom
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

//  this.verticalLineGroup = dum
  this.verticalLineGroup = this.svgBottom
    .append('g')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
  
  this.title.draw();
  this.addAxes();
  if (this.addLegend) this.addLegend();
  //Have to init currentX before drawPaths because sometimes drawPaths will need it
  this.initCurrentX();
  this.drawPaths();
  this.addVerticalLine();
  //if not using draging point don't do the moving symbols (maybe can add those later when dragging)
  if (! this.yField) this.addMovingSymbols();
  this.export.addMenu();

//now that we have point size we can offeset
//only do this if we are dragging the moving point
  this.tooltip.offset = {x:this.pointSize,y:this.pointSize};
//Set Display for Percent in tooltip stuff for sum of series is Showing Percent
  this.tooltip.data.DefaultDisplayClass = this.convertYdomainToPercent ? "hidden" : "";
  this.tooltip.data.PercentDisplayClass = ! this.convertYdomainToPercent ? "hidden" : "";

};

LineAreaChart.prototype.setUpYaxis = function () {
  this.yDomain = this.getYdomain(this);
  this.yScale = d3.scale.linear().range([this.chartHeight, 0])
//          .domain([0, 1.1*d3.max(this.data, function (d) { return d.p90; })]);
//          .domain([0.9*d3.min(this.data, function (d) { return d.p10; }), 1.1*d3.max(this.data, function (d) { return d.p90; })]);
          .domain(this.yDomain);

  if (this.getYsecondaryDomain) {
    this.ySecondaryDomain = this.getYsecondaryDomain(this);
    this.ySecondaryScale = d3.scale.linear().range([this.chartHeight, 0])
            .domain(this.ySecondaryDomain);
  }

  var yTickCount = this.chartHeight / (50) + 1;  
  var ySecondaryTickCount = yTickCount;

  if (this.yTickCount) yTickCount = this.yTickCount;
  if (this.ySecondaryTickCount) ySecondaryTickCount = this.ySecondaryTickCount;
  
  if (this.yTickSize) {
    yTickCount = (this.yDomain[1]-this.yDomain[0])/this.yTickSize + 1;
  }

  if (this.ySecondaryTickSize) {
    ySecondaryTickCount = (this.ySecondaryDomain[1]-this.ySecondaryDomain[0])/this.ySecondaryTickSize + 1;
  }
  
  this.yAxis = d3.svg.axis().scale(this.yScale).orient('left');

  if (this.yTickValues) {
    this.yAxis.tickValues(this.yTickValues);
  } else {
    this.yAxis.ticks([yTickCount]);
  } 
  
  this.yAxis.
    innerTickSize(-this.chartWidth).outerTickSize(0).tickPadding(10);

  if (this.ySecondaryScale) {
    this.ySecondaryAxis = d3.svg.axis().scale(this.ySecondaryScale).orient('right')
    if (this.ySecondaryTickValues) {
      this.ySecondaryAxis.tickValues(this.ySecondaryTickValues);
    } else {
      this.ySecondaryAxis.ticks([ySecondaryTickCount]);
    } 
    this.ySecondaryAxis
      .innerTickSize(-this.chartWidth).outerTickSize(0).tickPadding(10);
  }
};

LineAreaChart.prototype.addVerticalLine = function () {
  var self=this;

  //remove vertical line stuff if exists
  this.verticalLineGroup.selectAll("*").remove();
  if (this.horizontalLine) this.horizontalLine.remove();
  
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
                    .attr('class', 'etrends-chart-crosshair-vertical');

//  this.setTooltipHover(this.verticalLine);

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
                    .attr('class', 'etrends-chart-crosshair-horizontal');

  this.movingPoint = this.verticalLineGroup.append("circle")
                    .attr("opacity", 0)
                    .attr('class', 'etrends-chart-movingPoint');
                    
//now get the size of the moving point
  this.movingPoint.style("r",null); //reset to css r value if there is one
  var cssPointSize = parseInt(this.movingPoint.style("r"));
//if there is css point size set then over ride default point size set on LineAreaChart object
  if (cssPointSize) this.pointSize = cssPointSize; //tooltip needs to know the css point size  later so it can offset
  this.movingPoint.style("r",this.pointSize + "px"); //not set r
//setting r using css doesn't work for some browsers like FF so have to make it an attribute
  if (! this.movingPoint.style("r")) this.movingPoint.attr("r",this.pointSize + "px");

  //If getDragAreaWidth function defined get dragwidth using that
  if (this.getDragAreaWidth) this.dragAreaWidth = this.getDragAreaWidth();
//put this below column and allow it to show tolltip whe it races ahead
  this.dragArea = this.verticalLineGroup.append("rect")
                    .attr("opacity", 0)
                    .attr({
                        width: this.dragAreaWidth,
                        height: this.getChartHeight(this.height),
                        x: -this.dragAreaWidth/2, 
                        y: 0
                    })
  this.setTooltipHover(this.dragArea);

//set up a drag event on the moving point that will move the line
//have to call it probably from an area
  this.dragBehavior = d3.behavior.drag()
        .on("drag", function(d,i) {
//          var x = d3.event.x;
//I think use d3.mouse(element) is better way to get x (d3.event.x was giving weird things sometimes)
          var x = d3.mouse(self.svg.node())[0];
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
//Allow an outside function to snap values to interval. Don't move unless is is snapped.
//snapToInterval is function that returns new snapped x value 
            var snappedXvalue = xValue;
            if (self.snapToInterval) snappedXvalue = self.snapToInterval(xValue);
            if (snappedXvalue !== xValue) {
              self.moveLine(snappedXvalue,null,'dragBehavior');
            }
          }
        });        

//  this.verticalLine        
  this.dragArea
  .call(this.dragBehavior);

                            
//move to currentX
  this.moveLine(this.currentX);
  
};

LineAreaChart.prototype.initCurrentX = function (x,yLeft,yRight) {
  var self = this;
  //If currentX is not initialized this will do it
//check that current x is a valid x in the data
  var currentXisValid = false;
  if (this.currentX || this.currentX===0) {
    currentXisValid = this.data.some(function (item) {
      var itemX = parseFloat(item[self.xField]);
      return itemX===self.currentX ;
    });    
  }

  if (! currentXisValid) this.currentX = this.data[0][self.xField];
}

LineAreaChart.prototype.getInterpolatedYvalue = function (x,yLeft,yRight) {
//If y left or right is empty then return empty string
  if (!yLeft && yLeft!==0) return "";
  if (!yRight && yRight!==0) return "";
  
  var decX = x-1*parseInt(x);
  
  //If y is not a number then return whichever side is closer
  if (isNaN(yLeft)) {
	  if (decX<.5) return yLeft;
	  return yRight;
  }
  return 1*yLeft + (1*yRight-1*yLeft)*decX;
}

LineAreaChart.prototype.moveLine = function (value,yValue,from) {
//  console.log("move line from " + from);
//  console.log("move line value " + value + " and yvalue " + yValue);
  var self = this;

if (etrends.library.utilities.isNumeric(self.dragBarMin) && value<self.dragBarMin) value=self.dragBarMin;

//If passing coordinates instead of using yField, but coordinates not passed then don't move line
//Kind of hack but moveLine is being called by dragging
  if (!self.yField && !yValue && yValue!==0) {
    return;
  }
//  console.log('(!self.yField && !yValue && yValue!==0 ' + (!self.yField && !yValue && yValue!==0));
//  console.log('self.yField ' + self.yField);
//  console.log('self.yValue ' + self.yValue);
  
//If value is greater than max then don't even try to move line
  var XminMax = this.getXdomainDefault(this);
//  if (value>XminMax[1]) return; 
  if (value>XminMax[1]) value=XminMax[1]; 
//If value is less than min then don't even try to move line
  if (value<XminMax[0]) value=XminMax[0]; 
//save this for later eg. when refresh map and don't want cross hairs refreshed  
  this.currentX = value;
  
  var itemLeftRight = self.getSurroundingDataItems(value);
  var itemLeft = itemLeftRight[0];
  var itemRight = itemLeftRight[1];

  var translateX = this.xScale(value);

    if (yValue || yValue===0)  {
    }else {
      var yValue = this.getInterpolatedYvalue(value,itemLeft[self.yField],itemRight[self.yField]);
      //Note if using percent instead of absolute values then divide by sum of series
      if (self.convertYdomainToPercent) {
        var sumValue = this.getInterpolatedYvalue(value,itemLeft.SumOfSeries,itemRight.SumOfSeries);
        yValue = 100*yValue/sumValue;
      }
    }

    var translateY = this.yScale(yValue);
  
//Force no transition now. before beginning couldn't have transition or it wasn't starting over right
//Now i set the increment from 1000 to 100 to 10 which seems to look good
  if (value<=this.data[0][self.xField] || this.useTransitions!==true) {
//    console.log("no trans " + value);
    d3.select("#" + this.domID + " .etrends-chart-crosshair-vertical").attr("transform", function() {
        return "translate(" + translateX + ",0)";
    });
    d3.select("#" + this.domID + " .etrends-chart-crosshair-horizontal").attr("transform", function() {
        return "translate(0," + translateY + ")";
    });
    
    this.movingPoint.attr("opacity", 1)
            .attr("cx", translateX)
            .attr("cy", translateY);
            
    this.dragArea
      .attr("x", translateX-this.dragAreaWidth/2);
            
  } else {
    d3.select("#" + this.domID + " .etrends-chart-crosshair-vertical").transition().attr("transform", function() {
        return "translate(" + translateX + ",0)";
    });
    d3.select("#" + this.domID + " .etrends-chart-crosshair-horizontal").transition().attr("transform", function() {
        return "translate(0," + translateY + ")";
    });
    
    this.movingPoint.transition().attr("opacity", 1)
            .attr("cx", translateX)
            .attr("cy", translateY);
//            .each("end",refreshToolTip);      //refresh the tooltip after the transition is done so point is in proper location
            
    this.dragArea
//    .transition()
      .attr("x", translateX-this.dragAreaWidth/2);
  } 

//If no y field we are not showing/dragging moving point. tooltip comes up on hover and follows mouse
    if (!this.yField) {
      this.movingPoint.attr("opacity", 0);
    }

//just refresh the tooltip
    this.refreshToolTip(value);
  
//    console.log(translateX);
//  console.log(translateY);
//Move and rebind the the tooltip
//  this.moveToolTip(translateX,translateY,value,itemLeft,itemRight);
  
};

LineAreaChart.prototype.getSurroundingDataItems = function (value) {

  var indexRight = this.bisect(this.data, value);
  var indexLeft = 0;
  if (indexRight>0) indexLeft = indexRight-1
//if right on number then item left is now at number 
  if (value==parseInt(value)) indexLeft = indexRight

  return [this.data[indexLeft],this.data[indexRight]];
}

//render and move the point but do NOT actually show the point. keep hidden until somebody hovers
LineAreaChart.prototype.refreshToolTip = function (value) {  
    var self = this;
    var itemLeftRight = self.getSurroundingDataItems(value);
    var itemLeft = itemLeftRight[0];
    var itemRight = itemLeftRight[1];

    //console.log("refresh tooltip ");
    var interpolatedData = {}
    Object.keys(self.data[0]).forEach(function (key) {
          interpolatedData[key] = self.getInterpolatedYvalue(value,itemLeft[key],itemRight[key]);
    });
    self.tooltip.renderToolTip(interpolatedData);
    if (self.movingPoint) self.tooltip.moveToolTip(self.movingPoint.node(),this.useTransitions);    
    //Move the moving symbols now if not dragging point
    if (!self.yField) self.moveSymbols(value,interpolatedData);
};

LineAreaChart.prototype.addMovingSymbols = function () {
  var self = this;
  //if no group for points then make it 
  self.pointsGroup = self.svg.append("g");
  self.pointsGroup.attr("id","pointsGroup");

  self.movingSymbols = {};

  //If visible series not set up then use series
  var series = self.visibleSeries || self.series;
  //if no series then can't so this
  if (!series) return;

  series.forEach(function (seriesItem,seriesIndex) {
    //if there is moving Symbol then add it (will move later to right place)
    var movingSymbol = self.getSVGsymbol(seriesItem);
    if (! movingSymbol) return;
      movingSymbolGroup = self.pointsGroup.append("g");
      var itemClass = seriesItem.class || seriesItem.name;

     //Don't show these until hovering
      movingSymbolGroup.attr("opacity",0)
          .classed('etrends-chart-point',true)
          .classed('etrends-chart-point-' + itemClass,true);

      var symbolItems = movingSymbol.svg.clone().children();
      symbolItems.each(function (i,item) {
        //convert d3 to jquery to append the svg children dom elements
        $(movingSymbolGroup.node()).append(item);
      })
      //get the width and height of symbol if not already set      
      //First try to get via source symbol SVG attribute
      if (! seriesItem.symbol.height) seriesItem.symbol.height = movingSymbol.svg.attr("height");
      if (! seriesItem.symbol.width) seriesItem.symbol.width = movingSymbol.svg.attr("width");

      if (! seriesItem.symbol.height || ! seriesItem.symbol.width) {                
        var bb = movingSymbolGroup.node().getBoundingClientRect();
        //Note round up to nearest pixel
        if (! seriesItem.symbol.width) seriesItem.symbol.width = Math.ceil(bb.width);
        if (! seriesItem.symbol.height) seriesItem.symbol.height = Math.ceil(bb.height);
      }
     //Save the symbol group for moving, changing attributes etc later
     self.movingSymbols[seriesItem.name] = movingSymbolGroup;
  });
};

 LineAreaChart.prototype.getSVGsymbol = function (item) {
  var self = this;
  var symbol = item.symbol;
  if (!symbol) return null;

  //Just add the jquery element to symbol obect
  symbol.svg = $("#etrends-customSymbols-" + symbol.id);
  //if symbol doesn't exist have to use Missing Symbol icon
  if (symbol.svg.length==0) {
    symbol.id = 'MissingSymbol';
    symbol.svg = $("#etrends-customSymbols-" + symbol.id);
  }  
  
  return symbol;
 };

LineAreaChart.prototype.moveSymbols = function (value,yValues) {
  var self = this;
  var translateX = self.xScale(value);

  //If visible series not set up then use series
  var series = self.visibleSeries || self.series;
  //if no series then can't so this
  if (!series) return;
  
  series.forEach(function (seriesItem,seriesIndex) {
    //Get the yScale because might be using secondary axis
    var yScale = self.yScale;
    if (seriesItem.isSecondary) yScale = self.ySecondaryScale;

    //Get the yValue for this series and value
    var field = seriesItem.data || seriesItem.name;
    var yValue = yValues[field];
    var translateY = yScale(yValue);

    //if there is moving Symbol then move it
    var movingSymbolGroup = self.movingSymbols[seriesItem.name];
    if (movingSymbolGroup)  {

      var offsetx = 0, offsety = 0, width = 0, height = 0, scale = 1;
      var movingSymbol = self.getSVGsymbol(seriesItem);
      if (movingSymbol) {
        scale = movingSymbol.scale || 1;
        offsetx = movingSymbol.offsetx || 0;
        offsety = movingSymbol.offsety || 0;
        width = movingSymbol.width || 0;
        height = movingSymbol.height || 0;
      }
      
      movingSymbolGroup      
      .attr("transform","translate(" + (translateX-scale*(-offsetx+width/2)) + "," + (translateY-scale*(-offsety+height/2)) + ")scale(" + scale +")");
      //hide symbol if no data point
      movingSymbolGroup.attr("opacity",(yValue || yValue===0) ? 1 : 0);
    }
    });
};

LineAreaChart.prototype.toggleMovingSymbols = function (show) {
  var self = this;

  //If visible series not set up then use series
  var series = self.visibleSeries || self.series;
  //if no series then can't so this
  if (!series) return;
  
  series.forEach(function (seriesItem,seriesIndex) {
    var movingSymbolGroup = self.movingSymbols[seriesItem.name];
    if (movingSymbolGroup) movingSymbolGroup.attr("opacity",show ? 1 : 0);
  });
};

LineAreaChart.prototype.addAxes = function () {
  var self=this;

//If axes already exist then remove items for redrawing
    if (this.axes) this.axes.remove();
    this.axes = this.svg.append('g')
      .attr('clip-path', 'url(#axes-clip)');    

    if (this.xAxisElement) this.xAxisElement.remove();
//  this.xAxisElement = this.axes.append('g')
    this.xAxisElement = this.svg.append('g')
      .attr('id', 'etrends-chart-axis-x')
      .attr('class', 'x etrends-chart-axis')
      .attr('transform', 'translate(0,' + this.chartHeight + ')')
      .call(this.xAxis);

  var xaxisHeight = this.xAxisElement.node().getBBox().height - this.chartHeight;
  var xaxisLabelWidth = 0;

//Get what the margin should be for these axes
  this.marginCorrected = {right: this.margin.right, top: this.margin.top };  
  this.marginCorrected.bottom = (xaxisLabelWidth+xaxisHeight);

  this.yAxisElement = this.axes.append('g')
    .attr('class', 'y etrends-chart-axis')
    .call(this.yAxis);

  //Add y axis title with scaling and margin correction etc
  this.yAxisTitle = this.addYaxisTitle(this.yAxisElement,this.ytitle);

  if (this.getYsecondaryDomain) {
    this.ySecondaryAxisElement = this.axes.append('g')
      .attr('class', 'ySecondary etrends-chart-axis')
      .attr('transform', 'translate(' + this.chartWidth + ',0)')
      .call(this.ySecondaryAxis);

    this.ySecondaryAxisTitle = this.addYaxisTitle(this.ySecondaryAxisElement,this.ysecondarytitle,true);
  }
};

LineAreaChart.prototype.addYaxisTitle = function (yAxisElement,config,isSecondary) {
  var units = '';
  if (config.units) units = '(' + config.units + ')';
  if (this.convertYdomainToPercent) units = '(%)';

  var spacing = [.5,1.5];
  var yAxisTitle = this.addLines(yAxisElement,config.text + ' ' + units,spacing,isSecondary);
  
  yAxisTitle
  //.selectAll('*')
//  var yAxisTitle =yAxisElement.append('text')
        .attr('transform', 'rotate(-90)')
      .attr('class', 'etrends-chart-yaxis-title');

  yAxisTitle
  .selectAll('*')
      .style('text-anchor', 'middle');
  
  var yAxisFontSize = parseInt(yAxisTitle.style("font-size"));

//shrink the title if it is not fitting on chart
  var scaleYaxisTitle = yAxisTitle.node().getBBox().width / this.chartHeight;
  if (scaleYaxisTitle > 1) {
    yAxisTitle.style("font-size", (yAxisFontSize / scaleYaxisTitle) + "px");
//      this.yAxisTitle.attr("transform", "translate(" + [(this.chartWidth - scaleLegend*this.legend.node().getBBox().width)/2,this.chartHeight + 35] + ")scale(" + scaleYaxisTitle  + ")");
  }

  var yaxisLabelWidth = yAxisTitle.node().getBBox().height;
  var yaxisWidth = yAxisElement.node().getBBox().width - this.chartWidth;

  var yaxisLabelOffset = (yaxisLabelWidth+yaxisWidth);

  var yAxisOffset = -yaxisLabelOffset;
  if (isSecondary) yAxisOffset = +yaxisWidth;
  yAxisTitle
//      .attr('y', yAxisOffset)
//      .attr('x', -this.chartHeight/2);
  .attr("transform","rotate(-90)translate(" + (-this.chartHeight/2) + "," + yAxisOffset + ")");

//correct the margin now that we have yaxis
  var marginToCorrect = 'left';
  if (isSecondary) marginToCorrect = 'right';

  //marging is space between y axis title and edge of chart  
  var margin = +yAxisTitle.attr("maxTextHeight")*spacing[1] || 10;
  this.marginCorrected[marginToCorrect] = yaxisLabelOffset + margin;
;// + yaxisWidth;
  return yAxisTitle;
}

LineAreaChart.prototype.addLines = function (container,text,spacing,isSecondary) {
    var y = 0;
    var firstDescent;
    var lineSpacing = spacing[0];
    var labelAxisSpacing = spacing[1];
    var group = container.append('g');
    var lines = text.split("<br/>");

    if (isSecondary) {
      group.append('text')
            .attr("opacity",0)
            .attr("y",0)
            .text("a");
    }
    var maxTextHeight=0;    
    lines.forEach(function (text,i) {
      var element = group.append('text')
          .text(text);

      var textHeight = element.node().getBBox().height;
      if (textHeight>maxTextHeight) maxTextHeight=textHeight;


      if (i>0) {
        y += lineSpacing*textHeight;
      }
      y += textHeight;

      element.attr("y", y);
    });

    if (isSecondary) {      
      //for secondary have to add the spacing between axis and label first so correct once max height found
      group.selectAll('*').each(function () {
        var line = d3.select(this);
        var y = +line.attr("y")+maxTextHeight*labelAxisSpacing;
        line.attr("y",y);
      });
    } else {
      y += maxTextHeight*labelAxisSpacing;
      group.append('text')
            .attr("opacity",0)
            .attr("y",y)
            .text("a");
    }

    group.attr("maxTextHeight",maxTextHeight);

    return group;
  }

//funtion that can be called to draw Line chart
//
LineAreaChart.prototype.drawLines = function() {
    //If they don't pass totalLineClass then don't draw total line
    //self is the chart
     var self= this;

    self.svg.datum(self.data);

   if (! self.series) console.error('Series info required to draw Lines Chart');

   //Get the group of bars first and attach data to it
    self.linesGroup = self.svg.append("g").datum(self.data);
  
    //loop over each species to plot
    //Get only visible items in series
    self.visibleSeries = self.series.filter(function (item) {return item.hidden!==true});
    if (self.visibleSeries.length<1) return;

    self.visibleSeries.forEach(function (seriesItem,seriesIndex) {
        var xvalue = function (d) {return d[self.xField]};
        var yvalue = function (d) {return d[seriesItem.name]};
        //Get the yScale because might be using secondary axis
        var yScale = self.yScale;
        if (seriesItem.isSecondary) yScale = self.ySecondaryScale;
        
      //Draw line
        seriesItem.line = d3.svg.line()
    //filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.selectedSite!==""      
        .defined(function(d) { return (yvalue(d) || (yvalue(d)!=="" && yvalue(d)==0)) ? true : false; })
          .x(function (d) { 
//            console.log('xvalue(d) ' + xvalue(d));
//            console.log('self.xScale(xvalue(d)) ' + self.xScale(xvalue(d)))
            return self.xScale(xvalue(d)); })
          .y(function (d) { 
//            console.log('yvalue(d) ' + yvalue(d));
//            console.log('self.yScale(yvalue(d)) ' + self.yScale(yvalue(d)))
            return yScale(yvalue(d)); 
          });
      
//      seriesItem.path = self.svg.append("path")
      var itemClass = seriesItem.class || seriesItem.name;
      seriesItem.path = self.linesGroup
        .append("path")
        .classed('etrends-chart-line',true)
        .classed('etrends-chart-line-' + itemClass,true)
        .attr('d', seriesItem.line);
        
      
      if (self.useAnimations) seriesItem.path.call(self.drawingLineAnimation);
    });
};

LineAreaChart.prototype.drawingLineAnimation = function(path) {
  path.transition()
      .duration(2000)
      .attrTween("stroke-dasharray", tweenDash);

  function tweenDash() {
    var l = this.getTotalLength(),
    i = d3.interpolateString("0," + l, l + "," + l);
    return function (t) { return i(t); };
  }
}

LineAreaChart.prototype.removeSeriesPaths = function() {
  this.series.forEach(function (seriesItem,seriesIndex) {  
    seriesItem.path.remove();
  });
};

//funtion that can be called to draw Bar Chart
//
LineAreaChart.prototype.drawBars = function(spacing,maxBarCount) {
    //self is the chart    
     var self= this;
    //pass maxBarCount if there are missing bars otherwise they won't be sized properly
    if (! maxBarCount) maxBarCount = self.data.length;

    self.svg.datum(self.data);
    //spacing in percent of bar width
    spacing = spacing || 1;
    var barWidth = self.chartWidth/maxBarCount/(1+spacing);

   if (! self.series) console.error('Series info required to draw Bar Chart');

   //Get the group of bars first and attach data to it
    if (! self.barsGroup) self.barsGroup = {};
    self.barsGroup.root = self.svg.append("g").data(self.data);
    self.barsGroup.series = self.barsGroup.root.append("g");
    self.barsGroup.hover = self.barsGroup.root.append("g");
  
    //loop over each species to plot
    var yAtZero = self.chartHeight;
    //Get only visible items in series
    var visibleSeries = self.series.filter(function (item) {return item.hidden!==true});
    if (visibleSeries.length<1) return;

    visibleSeries.forEach(function (seriesItem,i) {
    //if 1st in series don't use yAtZero use chart height so that bar chart not under x axis
    //After that actually use y at zero
      if (i==1) yAtZero = self.yScale(0);
      
      var seriesName = seriesItem.name;
      var seriesClass = seriesItem.class || seriesItem.name;

      seriesItem.path = self.barsGroup.series.append("g")
      .attr("class", 'etrends-chart-area-' + seriesClass)
//      .attr("style","fill: rgba(0, 128, 0, 0.8);height2:auto")
      .selectAll(".bar")
      .data(self.data)
      .enter()
      .append("rect")
      .attr('class', 'bar series' + i)
      .attr('seriesIndex', i)
      .attr('seriesName', seriesName)
      .attr("width", barWidth)
      .attr("x", function(d) {
        return self.xScale(d[self.xField])-barWidth/2; });
    })

//Now add a full transparent bar to use for hovering tooltip
    self.barsGroup.hover
      .selectAll(".bar")
      .data(self.data)
      .enter()
      .append("rect")
    .attr('class', 'bar')
    .style('opacity',0)
      .attr("width", barWidth)
      .attr("x", function(d) { 
        return self.xScale(d[self.xField])-barWidth/2; 
      })
      .on('mouseenter', function (d) {
          self.tooltip.hovering=true;
          if (self.tooltip.showing) return;
          //offset by width of bar and position off of center
          var barLocation = $(this).offset();
          var barWidth = this.getBoundingClientRect().width;
          self.tooltip.offset={x:10+barWidth*.5,y:0}
          self.tooltip.showToolTip(d,{left:barLocation.left+barWidth/2,top:d3.event.pageY});
        })
      .on('mouseleave', function () {
          self.tooltip.hovering=false;
          if (self.tooltip.showing) return;
          self.tooltip.hideToolTip();
        });

    self.drawBarsHeightsAndPosition();
        
};

//This to set the height and position of bars
//Useful so that we can transition from percent to absolute and vice versa
LineAreaChart.prototype.drawBarsHeightsAndPosition   = function(useTransitions) {
  var self = this;

  var sum = {};

  var visibleSeries = self.series.filter(function (item) {return item.hidden!==true});

  //need to get the sum to find percent as we go
  if (self.convertYdomainToPercent) {
    self.getSumOfSeries(self.data,visibleSeries);
    //This is sum of series for all not just visible
    self.getSumOfSeries(self.data,self.series,"SumOfSeriesAll");
  }

  var rects = self.barsGroup.series.selectAll("rect");

  var height = {};
  var y = {};
  
  rects.each(function (item) {
        var d = d3.select(this).data()[0];
        var xvalue = d[self.xField];
        var seriesIndex = parseInt(d3.select(this).attr("seriesIndex"));
        var seriesName = d3.select(this).attr("seriesName");

        if (!height[seriesName]) height[seriesName]={};
        if (!height[seriesName][xvalue]) height[seriesName][xvalue]={};
        if (!y[seriesName]) y[seriesName]={};
        if (!y[seriesName][xvalue]) y[seriesName][xvalue]={};

        //If nothing bad value then make it  zero height
        var ySeries = d[seriesName];
        if (! ySeries || isNaN(ySeries)) {
          height[seriesName][xvalue] = 0;
          ySeries = 0;
        } else {
          ySeries = +ySeries;
          //divide by SumOfSeries that was calculated above
          if (self.convertYdomainToPercent) ySeries = 100*ySeries/d.SumOfSeries;

          var yAtZero = seriesIndex===0 ? self.chartHeight : self.yScale(0);
          height[seriesName][xvalue] = yAtZero - self.yScale(ySeries);           
        }

//now get the position
        //sum the species for each x value
        if (! sum.hasOwnProperty(xvalue)) sum[xvalue] = 0;
        sum[xvalue] += ySeries;

        y[seriesName][xvalue] = self.yScale(sum[xvalue]);

  });

var heightFunction = function(d) {
        var xvalue = d[self.xField];
        var seriesName = d3.select(this).attr("seriesName");

        return height[seriesName][xvalue];
      };
var yFinalFunction = function(d) {
        var xvalue = d[self.xField];
        var seriesName = d3.select(this).attr("seriesName");

        return y[seriesName][xvalue];
      };
var yInitialFunction = function(d) {
        var xvalue = d[self.xField];
        var seriesName = d3.select(this).attr("seriesName");

        return this.getBBox().y + this.getBBox().height - height[seriesName][xvalue];
      };


var transOne = rects;
var transTwo = rects;

if (useTransitions) {
  var transOne = rects.transition().duration(250);
  var transTwo = transOne.transition().delay(350).duration(350).ease("bounce");  
}

if (self.convertYdomainToPercent) {
  transOne
  .attr("y",yFinalFunction)
  .attr("height",heightFunction)
} else {
  transOne
  .attr("y",yInitialFunction)
  .attr("height",heightFunction)
  transTwo
  .attr("y",yFinalFunction)    
}     

//transparent full bar will change height if not percent
  self.barsGroup.hover.selectAll("rect")
      .attr("height", function(d) { 
        var xvalue = d[self.xField];
        if (self.convertYdomainToPercent) return self.chartHeight;
        return self.chartHeight-self.yScale(sum[xvalue]); 
      })  
  //    .attr("height", function(d) { return 30; })  
      .attr("y", function(d) { 
        //sum the species for each x value
        var xvalue = d[self.xField];
        if (self.convertYdomainToPercent) return 0;
        return self.yScale(sum[xvalue]); 
      })
      
};

//funtion that can be called to draw Sum Line Chart
//
LineAreaChart.prototype.drawSumLines = function(totalLineClass) {
    //If they don't pass totalLineClass then don't draw total line
    //self is the chart
     var self= this;

    self.svg.datum(self.data);

   if (! self.series) console.error('Series info required to draw Sum Lines Chart');

   //Get the group of bars first and attach data to it
    self.sumLinesGroup = self.svg.append("g").datum(self.data);
  
    //loop over each species to plot
    //Get only visible items in series
    var visibleSeries = self.series.filter(function (item) {return item.hidden!==true});
    if (visibleSeries.length<1) return;

    visibleSeries.forEach(function (seriesItem,seriesIndex) {     
      seriesItem.path = self.sumLinesGroup
        .append("path")
        .classed('etrends-chart-area',true)
        .classed('etrends-chart-area-' + seriesItem.name,true);     
    });

    //Draw total line if class passed
    if (totalLineClass) {
      if (! self.totalLine) self.totalLine = {};

      self.totalLine.path = self.svg
        .append('path')
        .attr('class', totalLineClass);
    }     

    self.drawSumLinesPosition();
};

LineAreaChart.prototype.drawSumLinesPosition = function(useTransitions) {
  var self = this;

    var sum = {};
    //Get only visible items in series
    var visibleSeries = self.series.filter(function (item) {return item.hidden!==true});

    //need to get the sum to find percent as we go
    if (self.convertYdomainToPercent) {
      self.getSumOfSeries(self.data,visibleSeries);
      //This is sum of series for all not just visible
      self.getSumOfSeries(self.data,self.series,"SumOfSeriesAll");
    }

    visibleSeries.forEach(function (seriesItem,seriesIndex) {

      seriesItem.area = d3.svg.area()
      .x (function (d) { 
        return self.xScale(d[self.xField]); })
      .y0(function (d) { 
        var xvalue = d[self.xField];
        if (seriesIndex==0) sum[xvalue] = 0;

        var ySeriesSum = sum[xvalue]; 
        //divide by SumOfSeries that was calculated above
        if (self.convertYdomainToPercent) ySeriesSum = 100*ySeriesSum/d.SumOfSeries;

        if (seriesIndex==0) {
          //The y bottom of the first series should be at chartHeight so it doesn't bleed into x axis
          return self.chartHeight;
        }else {
          return self.yScale(ySeriesSum); 
        }
      })
      .y1(function (d) { 
        //sum the series for each data point
        var xvalue = d[self.xField];
        if (d[seriesItem.name] && !isNaN(d[seriesItem.name])) sum[xvalue] += d[seriesItem.name];

        var ySeriesSum = sum[xvalue]; 
        //divide by SumOfSeries that was calculated above
        if (self.convertYdomainToPercent) ySeriesSum = 100*ySeriesSum/d.SumOfSeries;
        return self.yScale(ySeriesSum); 
      });

      var transArea = seriesItem.path;
      if (useTransitions) transArea = transArea.transition().duration(250);
      
      transArea.attr('d', seriesItem.area)
      
    });

  if (self.totalLine.path) {
      self.totalLine.line = d3.svg.line()
        .x(function (d) { 
          return self.xScale(d[self.xField]); 
        })
        .y(function (d) { 
          if (self.convertYdomainToPercent) return self.yScale(100);
          return self.yScale(sum[d[self.xField]]); 
        });

    var transLine = self.totalLine.path;
    if (useTransitions) transLine = transLine.transition().duration(250);

    transLine.attr('d',self.totalLine.line);
  }  

//make sure the moving point moves also
  if (self.movingPoint) {
    var transPoint = self.movingPoint;
    if (useTransitions) transPoint  = transPoint.transition().duration(250);

    var cy = this.yScale(self.convertYdomainToPercent ? 100 : sum[this.currentX]);
    if (isNaN(cy)) {
      console.log("cy is Nan");
    }
    transPoint
      .attr("cx", this.xScale(this.currentX))
      .attr("cy", cy);
  }          
//refresh tooltip
  if (this.currentX || this.currentX==0) self.refreshToolTip(this.currentX);

};

LineAreaChart.prototype.correctYdomain =  function (yDomain,minDomain,padding,isSecondary) {
  var self = this;

  //minDomain is [minCieling,maxFloor]
  //minCieling is highest min can go
  //maxFloor is the lowest max can go
  //isSecondary = true looks at secondary axis lines to get domain
  var minCeiling = null;
  var maxFloor = null;
  if (Array.isArray(minDomain)) {
    minCeiling = minDomain[0];
    maxFloor = minDomain[1];
  }
  //padding is % multiplied by min max to get domain
  //for no padding padding=0 must be passed
  if (padding ||  padding===0) {
    if (!Array.isArray(padding)) {
      padding = [-padding,padding];
    }
  }else {
    padding=[-.1,.1];
  }

  var yTickValues = self.yTickValues;
  if (isSecondary) yTickValues = self.ySecondaryTickValues;
//Note if yTickValues are hardcoded then don't need to worry about any padding
//Just want the exact range of the data
  if (yTickValues) padding = [0,0];

  var min = yDomain[0];
  var max = yDomain[1];

    if (min==max) {min=0} //this in case only one data point
  //have the range between min and max +/- some percent of range.
    var range = max-min;
    min = min + padding[0]*range;
    max = max + padding[1]*range;
  //if limit passed in, don't let max get below limit or min get above limit
    if (minCeiling || minCeiling===0) {
      if (min>minCeiling) min=minCeiling;
    }
    if (maxFloor || maxFloor===0) {
      if (max<maxFloor) max=maxFloor;
    }

//if y tick values are hard coded snap the domain just found to the surrounding tick value
    if (yTickValues) {
      //The is domain based on data that snaps to nearest yRange tick
      var snappedYdomain = [null,null]
//return hardcoded y domain
      yTickValues.forEach(function (value,i) {
        //y range value found where y domain min between i-1 and i
        if(snappedYdomain[0]===null && value>min) {
          if (i>0) snappedYdomain[0]=yTickValues[i-1];
        }
        //y range value found where y domain max between i-1 and i
        if(snappedYdomain[1]===null && value>max) {
          if (i>0) snappedYdomain[1]=yTickValues[i];
        }
      })
      if (snappedYdomain[0]===null) snappedYdomain[0]=min;
      if (snappedYdomain[1]===null) snappedYdomain[1]=max;
      return snappedYdomain;
    }else {
      return [min,max];
    }

};  

LineAreaChart.prototype.getYdomainForLines =  function (minDomain,padding,isSecondary) {
  var self = this;
  var yDomain;
  if (isSecondary) {
    isSecondary = true;
    yDomain = self.ySecondaryDomain;
  } else {
    isSecondary = false;
    yDomain = self.yDomain;
  }
  
  //Get only visible items in series
  //Also only get right axis series if isSecondary=true is passed
  var visibleSeries = self.series.filter(function (item) {
    if (! item.isSecondary) item.isSecondary=false;
    return item.hidden!==true && item.isSecondary===isSecondary
  });
  //Just use whatever domain was last if nothing visible. if not ydomain just use full series
  if (visibleSeries.length<1) {
    if (yDomain) return yDomain;
    visibleSeries = self.series;
  }

  var min = d3.min(self.data, function (d) {
    //get min of all the series
    var seriesMin = visibleSeries.reduce(function (acc,item) {
      var value = +d[item.name];      
//Note only return truthy or zero otherwise it is null and ignored
      if (value || value===0) {
        if (acc===null) {
          acc=value;
        }else {
          if (value<acc) acc=value;
        }
      }
      return acc;
    },null);
//Note only return truthy or zero otherwise it is null and ignored
    if (!(seriesMin || seriesMin===0)) return null;
//Note only return truthy or zero otherwise it is null and ignored
    return +seriesMin;
  });   

  var max = d3.max(self.data, function (d) {
    //get min of all the series
    var seriesMax = visibleSeries.reduce(function (acc,item) {
      var value = +d[item.name];      
//Note only return truthy or zero otherwise it is null and ignored
      if (value || value===0) {
        if (acc===null) {
          acc=value;
        }else {
          if (value>acc) acc=value;
        }
      }
      return acc;
    },null);
//Note only return truthy or zero otherwise it is null and ignored
    if (!(seriesMax || seriesMax===0)) return null;
//Note only return truthy or zero otherwise it is null and ignored
    return seriesMax;
  });   

  return self.correctYdomain([min,max],minDomain,padding,isSecondary);
};  

//This usefult for getting Y domain of Bar Charts or Line Area Charts
LineAreaChart.prototype.getYdomainForSumOfSeries =  function (minDomain,padding) {
  var self = this;
  
  //Get only visible items in series
  //Also only get right axis series if isSecondary=true is passed
  var visibleSeries = self.series.filter(function (item) {
    return item.hidden!==true;
  });
  //Just use whatever domain was last if nothing visible. if not ydomain just use full series
  if (visibleSeries.length<1) {
    if (self.yDomain) return self.yDomain;
    visibleSeries = self.series;
  }
  
  //Have to get update the SumOfSeries in case visibility of series changed
  self.getSumOfSeries(self.data,visibleSeries);

  var min = d3.min(self.data, function (d) {
    var yFirstSeries = d[visibleSeries[0].name];
//Note only return truthy or zero otherwise it is null and ignored
    if (!(yFirstSeries || yFirstSeries===0)) return null;

    if (self.convertYdomainToPercent) yFirstSeries = 100*yFirstSeries/d.SumOfSeries;
//Note only return truthy or zero otherwise it is null and ignored
    return yFirstSeries;
  });   

  var max = d3.max(self.data, function (d) { 
//if using percent max will always be 1        
    if (self.convertYdomainToPercent) return 100;
//Note only return truthy or zero otherwise it is null and ignored
    return (d.SumOfSeries || d.SumOfSeries===0) ? 1*d.SumOfSeries : null ; 
  });

  //set up possible padding passed in so we can correct 
  if (!padding) {
   padding = [.1,.1];
  } else {
    if (!Array.isArray(padding)) padding = [-padding,padding];
  }
  //don't want min tick value to end up less than zero due to padding
  padding[0] = 0;

//yDomain for sum of series should always start at zero for comparison of series
//Don't really have to calculate min above but keep in in case we want to add that option later
    min = 0;
//If using percent cap it at 100
    if (self.convertYdomainToPercent) {
      max = 100;
  //don't want max tick value to end up more than 100 due to padding
      padding[1] = 0;
    }

  return self.correctYdomain([min,max],minDomain,padding);
};  

//This usefult for getting Y domain of Line  Charts
LineAreaChart.prototype.getYdomainForLinesOld =  function (minDomain,padding,isSecondary) {
  var self = this;
  //minDomain is [minCieling,maxFloor]
  //minCieling is highest min can go
  //maxFloor is the lowest max can go
  //isSecondary = true looks at secondary axis lines to get domain
  var minCeiling = null;
  var maxFloor = null;
  if (Array.isArray(minDomain)) {
    minCeiling = minDomain[0];
    maxFloor = minDomain[1];
  }
  //padding is % multiplied by min max to get domain
  //for no padding padding=0 must be passed
  if (padding ||  padding===0) {
    if (!Array.isArray(padding)) {
      padding = [-padding,padding];
    }
  }else {
    padding=[-.1,.1];
  }

  var yTickValues = self.yTickValues;
  if (isSecondary) yTickValues = self.ySecondaryTickValues;
//Note if yTickValues are hardcoded then don't need to worry about any padding
//Just want the exact range of the data
  if (yTickValues) padding = [0,0];

  var yDomain;
  if (isSecondary) {
    isSecondary = true;
    yDomain = this.ySecondaryDomain;
  } else {
    isSecondary = false;
    yDomain = this.yDomain;
  }
  
  //Get only visible items in series
  //Also only get right axis series if isSecondary=true is passed
  var visibleSeries = self.series.filter(function (item) {
    if (! item.isSecondary) item.isSecondary=false;
    return item.hidden!==true && item.isSecondary===isSecondary
  });
  //Just use whatever domain was last if nothing visible. if not ydomain just use full series
  if (visibleSeries.length<1) {
    if (yDomain) return yDomain;
    visibleSeries = self.series;
  }

  var min = d3.min(self.data, function (d) {
    //get min of all the series
    var seriesMin = visibleSeries.reduce(function (acc,item) {
      var value = +d[item.name];      
//Note only return truthy or zero otherwise it is null and ignored
      if (value || value===0) {
        if (acc===null) {
          acc=value;
        }else {
          if (value<acc) acc=value;
        }
      }
      return acc;
    },null);
//Note only return truthy or zero otherwise it is null and ignored
    if (!(seriesMin || seriesMin===0)) return null;
//Note only return truthy or zero otherwise it is null and ignored
    return +seriesMin;
  });   

  var max = d3.max(self.data, function (d) {
    //get min of all the series
    var seriesMax = visibleSeries.reduce(function (acc,item) {
      var value = +d[item.name];      
//Note only return truthy or zero otherwise it is null and ignored
      if (value || value===0) {
        if (acc===null) {
          acc=value;
        }else {
          if (value>acc) acc=value;
        }
      }
      return acc;
    },null);
//Note only return truthy or zero otherwise it is null and ignored
    if (!(seriesMax || seriesMax===0)) return null;
//Note only return truthy or zero otherwise it is null and ignored
    return seriesMax;
  });   

    if (min==max) {min=0} //this in case only one data point
  //have the range between min and max +/- some percent of range.
    var range = max-min;
    min = min + padding[0]*range;
    max = max + padding[1]*range;
  //if limit passed in, don't let max get below limit or min get above limit
    if (minCeiling || minCeiling===0) {
      if (min>minCeiling) min=minCeiling;
    }
    if (maxFloor || maxFloor===0) {
      if (max<maxFloor) max=maxFloor;
    }

    yDomain = [min, max];

//if y tick values are hard coded snap the domain just found to the surrounding tick value
    if (yTickValues) {
      //The is domain based on data that snaps to nearest yRange tick
      var snappedYdomain = [null,null]
//return hardcoded y domain
      yTickValues.forEach(function (value,i) {
        //y range value found where y domain min between i-1 and i
        if(snappedYdomain[0]===null && value>yDomain[0]) {
          if (i>0) snappedYdomain[0]=yTickValues[i-1];
        }
        //y range value found where y domain max between i-1 and i
        if(snappedYdomain[1]===null && value>yDomain[1]) {
          if (i>0) snappedYdomain[1]=yTickValues[i];
        }
      })
      if (snappedYdomain[0]===null) snappedYdomain[0]=yDomain[0];
      if (snappedYdomain[1]===null) snappedYdomain[1]=yDomain[1];
      return snappedYdomain;
    }else {
      return yDomain;
    }

};  

//This usefult for getting Y domain of Bar Charts or Line Area Charts
LineAreaChart.prototype.getYdomainForSumOfSeriesOld =  function (minDomain,padding) {
  var self = this;
  //minDomain is [minCieling,maxFloor]
  //minCieling is highest min can go
  //maxFloor is the lowest max can go
  //isSecondary = true looks at secondary axis lines to get domain
  var minCeiling = null;
  var maxFloor = null;
  if (Array.isArray(minDomain)) {
    minCeiling = minDomain[0];
    maxFloor = minDomain[1];
  }
  //padding is % multiplied by min max to get domain
  //for no padding padding=0 must be passed
  if (padding ||  padding===0) {
    if (!Array.isArray(padding)) {
      padding = [-padding,padding];
    }
  }else {
    padding=[-.1,.1];
  }
  
  var isSecondary = false;
  //Get only visible items in series
  //Also only get right axis series if isSecondary=true is passed
  var visibleSeries = self.series.filter(function (item) {
    if (! item.isSecondary) item.isSecondary=false;
    return item.hidden!==true && item.isSecondary===isSecondary
  });
  //Just use whatever domain was last if nothing visible. if not ydomain just use full series
  if (visibleSeries.length<1) {
    if (self.yDomain) return self.yDomain;
    visibleSeries = self.series;
  }
  
  //Have to get update the SumOfSeries in case visibility of series changed
  self.getSumOfSeries(self.data,visibleSeries);

  var min = d3.min(self.data, function (d) {
    var yFirstSeries = d[visibleSeries[0].name];
//Note only return truthy or zero otherwise it is null and ignored
    if (!(yFirstSeries || yFirstSeries===0)) return null;

    if (self.convertYdomainToPercent) yFirstSeries = 100*yFirstSeries/d.SumOfSeries;
//Note only return truthy or zero otherwise it is null and ignored
    return yFirstSeries;
  });   

  var max = d3.max(self.data, function (d) { 
//if using percent max will always be 1        
    if (self.convertYdomainToPercent) return 100;
//Note only return truthy or zero otherwise it is null and ignored
    return (d.SumOfSeries || d.SumOfSeries===0) ? 1*d.SumOfSeries : null ; 
  });

  //have the range between min and max +/- some percent of range. Also make sure min is always >= 0
    if (min==max || visibleSeries.length==1) {min=0} //this in case only one data point

    if (min==max) {min=0} //this in case only one data point
  //have the range between min and max +/- some percent of range.
    var range = max-min;
    min = min + padding[0]*range;
    max = max + padding[1]*range;
  //if limit passed in, don't let max get below limit or min get above limit
    if (minCeiling || minCeiling===0) {
      if (min>minCeiling) min=minCeiling;
    }
    if (maxFloor || maxFloor===0) {
      if (max<maxFloor) max=maxFloor;
    }

//yDomain for sum of series should always start at zero for comparison of series
    var yDomain = [0, max];
//    var yDomain = [Math.max(0,min), max];
  //If using percent cap it at 100
    if (self.convertYdomainToPercent) yDomain = [0,100];    

    if (self.yTickValues) {
      //The is domain based on data that snaps to nearest yRange tick
      var snappedYdomain = [null,null]
//return hardcoded y domain
      self.yTickValues.forEach(function (value,i) {
        //y range value found where y domain min between i-1 and i
        if(snappedYdomain[0]===null && value>yDomain[0]) {
          if (i>0) snappedYdomain[0]=self.yTickValues[i-1];
        }
        //y range value found where y domain max between i-1 and i
        if(snappedYdomain[1]===null && value>yDomain[1]) {
          if (i>0) snappedYdomain[1]=self.yTickValues[i];
        }
      })
      if (snappedYdomain[0]===null) snappedYdomain[0]=yDomain[0];
      if (snappedYdomain[1]===null) snappedYdomain[1]=yDomain[1];
      return snappedYdomain;
    }else {
      return yDomain;
    }


};  

LineAreaChart.prototype.getSumOfSeries = function (data,series,sumName) {
    //different series can have different names. use SumOfSeries as default
    if (! sumName) sumName = "SumOfSeries";
    //loop over each data point
    data.forEach(function (dataItem) {
      //sum over series
      dataItem[sumName] = series.reduce(function(acc, seriesItem) {
        var value = +dataItem[seriesItem.name];
        if (value && !isNaN(value)) return acc + value;
        return acc;
      }, 0);
    });   
};

LineAreaChart.prototype.toggleYdomainToPercent = function (convertYdomainToPercent) {
    var self = this;
    if (typeof convertYdomainToPercent == "boolean") {
      self.convertYdomainToPercent = convertYdomainToPercent;
    } else {
      self.convertYdomainToPercent = ! self.convertYdomainToPercent;
    }

    //This so tooltip will show percent or aboslute
    self.tooltip.data.DefaultDisplayClass = this.convertYdomainToPercent ? "hidden" : "";
    self.tooltip.data.PercentDisplayClass = ! this.convertYdomainToPercent ? "hidden" : "";

    if (self.toggleYdomainToPercentMakeChart) {
      self.toggleYdomainToPercentMakeChart();
    } else {
      self.makeChartSingle();
    }  
};

//Could always over ride this for totally custom legend
//But this is standard legend control
LineAreaChart.prototype.addLegend = function() {
  this.legend.draw();
};

LineAreaChart.prototype.addSeriesField = function(name,values) {
  var self = this;
  if (self.series) {
    self.series.forEach(function (item,index) {
      item[name] = values[index];
    });
  } else {
    self.series = values.map(function (value) {
      var item = {};
      item[name] = value;
      return item;
    });
  }
};

LineAreaChart.prototype.initSeriesField = function(name,value,length) {
  var self = this;
  var values = [];
  if (!length) length=self.series.length;
  for (i=0;i<length;i+=1) {
    values.push(value);
  }
  return self.addSeriesField(name,values);
};

LineAreaChart.prototype.generateTickValues = function(start,end,interval) {
  //can pass array with [start,end,interval]
  if (Array.isArray(start)) {
    interval = start[2];
    end = start[1];
    start = start[0];
  }
  var tickValues = [];
  for (value=start;value<=end;value+=interval) {
    tickValues.push(value);
  }
  return tickValues;
};

LineAreaChart.prototype.addChartRedrawTrigger =  function () {
  var chart = this;
  //If there is no scroll magic controller on etrends then can't add trigger
  if (!etrends.scrollMagicController) {
	  if (!isMobile.any) console.error('Scroll Magic trigger can not be added to chart because "etrends.scrollMagicController" does not exist');
	  return;
  }	
  //Triger redraw of charts to show animation when chart scrolled to
  var addChartRedrawTriggerArgs = {controller:etrends.scrollMagicController};
  
  addChartRedrawTriggerArgs.scene = {
    triggerElement:'#' + chart.domID,
    triggerHook: 1
  }
  addChartRedrawTriggerArgs.onenter = function () {
    console.log('#' + chart.domID + ' entered for clear');
    chart.removeSeriesPaths();
  };

  //This to remove currently drawn chart (want to initially still draw so I don't have to rely on scroll magic triggering necessarily if isn't working)
  var clearScene = etrends.library.utilities.addScrollMagicTrigger(addChartRedrawTriggerArgs);

  //This actually redraws the charts with the animation		
  addChartRedrawTriggerArgs.scene.triggerHook = .5;
  addChartRedrawTriggerArgs.onenter = function () {
    console.log('#' + chart.domID + ' entered for redraw');
    //Had to run this next tick or it was flashing
    setTimeout(function () {
      var oldUseAnimations = chart.useAnimations
      chart.useAnimations = true;
      chart.makeChart();
      chart.useAnimations = oldUseAnimations;
    },0)
  };
  var redrawScene = etrends.library.utilities.addScrollMagicTrigger(addChartRedrawTriggerArgs);

  console.log(clearScene);
  console.log(redrawScene);
}		

//Set that this module is loaded for egam
if (etrends.library.utilities) etrends.library.utilities.setModuleLoadedForEGAM('LineAreaChart.js');

//# sourceURL=etrends/LineAreaChart.js