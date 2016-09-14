var ClassifiedPointsMap = function ClassifiedPointsMap(domID,percentSize) {
  this.domID=domID;

//the container size to use for responsiveness
  this.containerID=domID + "-container";
  this.containerID=domID;

//set this to make tooltip relative to a div not absolute to page
  this.useRelativeTooltip = false;
//Need to set this if multi tooltip in one host container  
  this.toolTipClass = null;
  
  this.defaultWidth = 870;
  this.defaultHeight = 550;

//If no percent size then calculate from outer container 
  if (percentSize) {
    this.percentSize = percentSize;
  }else {
    this.percentSize = parseInt(d3.select("#" + this.containerID).style('width'))/this.defaultWidth;    
  }

  this.width= this.defaultWidth * this.percentSize;
  this.height=this.defaultHeight * this.percentSize;

//IE 11 needs up to explicity set the height of the div containing the SVG
  d3.select("#" + this.domID).style("height",this.height + "px");
  
  this.pointSize = 6;
//this to keep track of the resized  point size for zooming purposes
  this.scaledPointSize=this.pointSize;
  
  //the current state zoomed in to
  this.activeState = d3.select(null);
  
  //have to pass in topojson object from library
  this.topojson = null;
  
  // Percent Change color categories	 
  //the symbology needs to be passed in
  this.symbology = null;
  //Here is format of symbology
  //symbology = [
  //    {color:d3.rgb(11,39,117),min:0,max:.055},
  //    {color:d3.rgb(34,94,168),min:.055,max:.070},
  //    {color:d3.rgb(196,232,176),min:.070,max:.085},
  //    {color:d3.rgb(255,255,204),min:.085,max:1}
  //]; 
  
  //this will be the mapped attribute in terms of symbology
  this.activeAttribute = null;
  this.hideEmptyActiveAttributes = true;
  //sample activeAttribure
  //var pointVariable="val2000";
  
  //symbology scale changes when new data is loaded
  this.symbologyScale = null;
  //this is place to store tooltip stuff like data that is constant for all points but changes when layer/attribute changes
  this.tooltip={};
//reference to function to call on mouseover to show line on concentration chart
  this.externalMouseOver=null;  
  this.externalMouseOut=null;  
//View Box wasn't working for Mac desktop  
  this.useViewBox = false;
  if (navigator.platform.indexOf('Mac') > -1) {
    this.useViewBox = false;    
  }
  
}

ClassifiedPointsMap.prototype.init = function () {
  var self = this;
  var nudge = 20 * this.width/745;
  this.projection = 
  albersUsaPr()
//  d3.geo.albersUsa()
      .scale(1070*self.percentSize)
      .translate([this.width / 2 + nudge, this.height / 2-0]);
//      .translate([this.width / 2, this.height / 2]);

//console.log(this.width);

  //Albers USA default projection. I think passing null actually means use "no" projection use actual coordinates
  this.path = d3.geo.path()
  //    .projection(null);
      .projection(this.projection);
  
  this.svg = d3.select("#" + this.domID).append("svg")
  
  //If it is apple mobile device then don't use viewBox and set width and height and use translate/scale attribute on resize later
  if (this.useViewBox==false) {
    this.svg
      .attr("width", this.width)
      .attr("height", this.height);    
  } else {
    this.svg.attr("viewBox", "0 0 " + this.width + " " +   this.height);                
  } 

//set up the tooltip
  this.tooltip = new MapChartTooltip(self,self.toolTipClass);  
  this.tooltip.offset = {x:this.pointSize,y:this.pointSize};
      
  this.pointSymbology = function (d) {  
    var value = parseFloat(d[self.activeAttribute]);
//if value is exactly equal to break point then make it the preceeding class
//because d3 threshold scale uses break 1 <= value < break 2 but we want break 1 < value <= break 2 
//    if (d["AQS_Site_ID"]==="01-051-0001") {
//      console.log("alabama point");
//    }
    var valueBreakpointIndex = self.symbology.breaks.indexOf(value);
    if (valueBreakpointIndex >= 0) {
      return self.symbology.colors[valueBreakpointIndex];      
    }else {
      return self.symbologyScale(value);      
    }
  };  

  this.g = this.svg.append("g");

  this.g.append("rect")
      .attr("class", "background")
      .attr("width", this.width)
      .attr("height", this.height)

//Zoom and Pan

  this.zoomPanBehavior = d3.behavior.zoom()
    .on("zoom", function () {return self.zoomPanHandler(self);});
  this.svg.call(this.zoomPanBehavior).on("dblclick.zoom", null); //don't want the double click zoom

//set up resopnsiveness when resized
  this.debouncer = new MapChartResize(this, function() {
    self.resize();
  }, 200)
};

ClassifiedPointsMap.prototype.zoomPanHandler = function (self) {
  self.genericZoomPan(self,d3.event.translate,d3.event.scale)
};

ClassifiedPointsMap.prototype.genericZoomPan = function (self,translate, scale, useTransition) {
  self.g.style("stroke-width", scale + "px");  //scale county boundaries

//When using ViewBox don't need scale to know about svg being smaller but when not using viewBox it needs to know percent size when resized
  var resizeScale = 1;
  if (this.useViewBox==false) resizeScale = scale*this.percentSize;
  
//  console.log("scale " + resizeScale);
  if (useTransition) {
    self.g.transition()
      .duration(750)
      .attr("transform", "translate(" + translate + ")scale(" + resizeScale + ")")    
  }else {
    self.g
      .attr("transform", "translate(" + translate + ")scale(" + resizeScale + ")")    
  }

//keep points same size when zoooming
    self.g.selectAll("circle")
//    .transition().duration(750)
    .attr("r", self.scaledPointSize/scale)
    .style("stroke-width", self.scaledPointStroke/scale);

//move tooltip since zoom changed point location on screen
    if(self.tooltip.showing) self.tooltip.relocate();
} // end genericZoomPan ()


//function which zooms when double clicked after state zoomed to
ClassifiedPointsMap.prototype.zoomOnDoubleClick = function (d,self) {
//self is ClassifiedPointsMap instance and this is the clicked state
  if (self.activeState.node() === this) {
//zoom in 2X
    var scale = self.zoomPanBehavior.scale()*2;
    var translate = [d3.event.offsetX-scale*d3.mouse(this)[0],d3.event.offsetY-scale*d3.mouse(this)[1]];
//      console.log("d3.mouse(this)[0] " + d3.mouse(this)[0]);
//      console.log("scale translate " + scale + ' ' + translate);
      
//don't need the .event() call does this automatically
//    self.genericZoomPan(self,translate,scale,true);  
//since we are manually setting pan and zoom we have to update zoom behavior so it remembers where it is and doesn't chop around
    self.zoomPanBehavior.translate(translate).scale(scale)
  //this fires the zoom pan hanlder so that tooltip moves. Note: uses transition in zooming 
    .event(self.svg.transition().duration(750)); 
  }else {
    self.zoomToState(this,d,self); //pass this which is the state element
  }
} // end zoomOnDoubleClick()

//function which zooms to state when state double clicked
ClassifiedPointsMap.prototype.zoomToState = function (state, d,self) {
//self is the ClassifiedPointsMap object and state is the clicked state

//Note: no longer return home on double click, instead zoom in for those without scroll wheel
//Use home button now to get back to normal view  
//if (self.activeState.node() === state) return self.resetZoom();
  
  self.activeState.classed("active", false);
  self.activeState = d3.select(state).classed("active", true);

  var bounds = self.path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / self.width, dy / self.height),
      translate = [self.width / 2 - scale * x, self.height / 2 - scale * y];

//If not using ViewBox then need to reduce the translate by percentSize in case they shrunk the screen before zooming to State
    if (this.useViewBox==false) translate = translate.map(function (x) {return self.percentSize*x});
      
//Don't need to do this since .event() fires zoom
//  self.genericZoomPan(self,translate,scale,true);  
//since we are manually setting pan and zoom we have to update zoom behavior so it remembers where it is and doesn't chop around
  self.zoomPanBehavior.translate(translate).scale(scale)
  //this fires the zoom pan hanlder so that tooltip moves. Note: uses transition in zooming 
    .event(self.svg.transition().duration(750)); 


} // end zoomToState()  
  

//function which zooms when double clicked after state zoomed to
  
//function to reset zoom
ClassifiedPointsMap.prototype.resetZoom = function () {
  var self=this;
  this.activeState.classed("active", false);
  this.activeState = d3.select(null);

//Don't need to do this since .event() fires zoom
//  self.genericZoomPan(self,[0,0],1,true);  

//since we are manually setting pan and zoom we have to update zoom behavior so it remembers where it is and doesn't chop around
  this.zoomPanBehavior.translate([0,0]).scale(1)
  //this fires the zoom pan hanlder so that tooltip moves. Note: uses transition in zooming 
    .event(self.svg.transition().duration(750)); 

}; //end reset()  

//map us.json  
ClassifiedPointsMap.prototype.mapStates = function (us) {
  var self=this;
  
	this.g.append("g")
     //.attr("id", "counties")
    .selectAll("path")
     .data(this.topojson.feature(us, us.objects.counties).features)
    .enter().append("path")
     .attr("d", this.path)
	 .attr("class", "county-boundary")
			
	this.g.append("g")
     //.attr("id", "states")
    .selectAll("path")
     .data(this.topojson.feature(us, us.objects.states).features)
    .enter().append("path")
     .attr("d", this.path)
     .attr("class", "feature")
//When state double clicked need to call function that decides whether to zoom to state and show counties or do 2X zoom if already zoomed to state
//Have to call this function in the context of clicked state (this) and pass it the d3 clicked state (d) and ClassifiedPointsMap instance (self)
     .on("dblclick", function (d) {
//       return self.zoomToState.call(this,this,d,self)});
       return self.zoomOnDoubleClick.call(this,d,self)
       });

    this.g.append("path")
     .datum(this.topojson.mesh(us, us.objects.states, function(a, b) { return a !== b; }))
     .attr("id", "state-borders")
     .attr("class", "mesh")
     .attr("d", this.path);

//note sure if i need this. I think it's needed for iframes
//  d3.select(window.frameElement).style("height", this.height + "px");	 
  
};
 
ClassifiedPointsMap.prototype.plotPointsAndLoad = function (pointFile,symbology) {
  var self = this;

  d3.csv(pointFile, function (data) {
    self.plotPoints(data,symbology);
  });
}

ClassifiedPointsMap.prototype.plotPoints = function (pointData,symbology) {
  var self = this;
//set the symbology first so points can use it
  self.setSymbology(symbology);

//remove any existing points and redrea
  self.g.selectAll("circle").remove();      

	self.points = self.g.append("g")
     //.attr("id", "counties")
    .selectAll("circle")
     .data(pointData)
    .enter().append("circle")
               .attr("transform", function(d, i) {
                  var xy = self.projection([d.Longitude, d.Latitude]);
                   return "translate(" + xy + ")";
                })
            .attr("r", this.pointSize)
            .attr("class", "naaq-map-points")
            .style("fill", self.pointSymbology)
            .style("opacity", 1)
            .on('mouseenter', function (d) {
                self.tooltip.hovering=true;
                if (self.tooltip.showing) return;
                self.showToolTip(d,this);
              })
            .on('mouseleave', function () {
                self.tooltip.hovering=false;
                if (self.tooltip.showing) return;
                self.hideToolTip();
              })
            .on('click', function (d) {
//Don't need to do tooltip stuff again since we are hovering it on click (don't want to create duplicate lines)
                if (self.tooltip.hovering && !self.tooltip.showing) return self.tooltip.showing=true;
//hide existing tooltip will hide old line and show again to show new line
                self.hideToolTip();
                self.showToolTip(d,this);
              });
              
//            .on('mouseover', self.pointToolTip.show)
//            .on('mouseout', self.pointToolTip.hide);

//Need tooltip offset to be related to point size for now so just hardcode the point size for now
//  if (! this.pointSize) this.pointSize=parseInt(self.points.attr("r"));

  if (! this.pointStroke) this.pointStroke=parseFloat(self.points.style("stroke-width"));

//Now use resize to set th points to be correct for whatever the SVG is sized at on the screen
    this.resize();

//console.log("percentSize  = " + this.percentSize);
//console.log("re = " + this.pointSize/this.percentSize);
}

//These functions just make working with tooltip easier now that different things happen for click vs hover
 ClassifiedPointsMap.prototype.showToolTip = function (d,element) {
  var self = this;
  self.tooltip.showToolTip(d,element);
  if (self.externalMouseOver) self.externalMouseOver(d);
 };

 ClassifiedPointsMap.prototype.hideToolTip = function () {
  var self = this;
  self.tooltip.hideToolTip();                
  if (self.externalMouseOut) self.externalMouseOut();
 };

 ClassifiedPointsMap.prototype.closeToolTip = function () {
  var self = this;
  self.tooltip.showing = false;
  self.hideToolTip();
 };

 ClassifiedPointsMap.prototype.changeActiveAttribute = function (attribute) {
  this.activeAttribute=attribute;
  this.g.selectAll("circle").style("fill", this.pointSymbology);
//hide points that don't have a value for active attribute
  if (this.hideEmptyActiveAttributes===true) this.g.selectAll("circle").style("display", function (d) {    
    return (d[attribute] || (d[attribute]!=="" && d[attribute]==0)) ? "" : "none";
    });

//Also change what is on the tooltip if attribute changed and it is still showing (eg. on playback)
//Have to call the html function of the element
        this.tooltip.renderToolTip(this.tooltip.currentHoverPoint);
//        d3.select('#sliderText').text(value);        
 };

ClassifiedPointsMap.prototype.setSymbology = function (symbology) {
  var self = this;
  this.symbology = symbology;
//Scale for data rendering  
  this.symbologyScale = d3.scale.threshold()
    .domain(symbology.breaks)
    .range(symbology.colors);

//get category range labels
  var leftLabel;
  this.rangeLabels = symbology.breaks.map(function (d,i) {
    var label;
    if (i==0) {
      label = "<= " + d;      
    }else {
      label = leftLabel + " - " + d;      
    }
    leftLabel=d;
    return label;
  }); 
  this.rangeLabels.push("> " + leftLabel);

  this.drawLegend();  
 };
 
ClassifiedPointsMap.prototype.drawLegend = function (width) {
  if (! width) width = this.width;
  var shapeWidth= Math.min(100,.9*width/this.symbology.colors.length);
     
  this.legendLinear = d3.legend.color()
    .shapeWidth(shapeWidth)
    .shapeHeight(15)
    .orient('horizontal')
    .scale(this.symbologyScale)
    .labels(this.rangeLabels);
    
  d3.select("#naaqs-map-mapLegend").selectAll("*").remove();

  this.legendElement = d3.select("#naaqs-map-mapLegend").append("svg")
      .attr("class","naaqs-map-legendLinear")
    .call(this.legendLinear);
      
  this.legendElement
      .attr("width", this.legendElement.select(".legendCells").node().getBBox().width)
      .attr("height", this.legendElement.select(".legendCells").node().getBBox().height)    
      .style("padding", 0);      

//reset legend font size to what is in the css
  this.legendElement.selectAll(".legendCells .cell .label").style("font-size","");
//Let the font-size cap at what is set in css and shrink down based on shapewidth shrinking
  var maxLegendFontSize = parseInt(this.legendElement.selectAll(".legendCells .cell .label").style("font-size"));
//  this.legendElement.selectAll(".legendCells .cell .label").style("font-size",maxLegendFontSize + "px");

//Let the font-size cap at 12px and shrink down based on shapewidth shrinking
//Find the maximum legend label
  var maxLegendLabelWidth=0;
  this.legendElement.selectAll(".legendCells .cell .label")
    .each(function() {
      width=this.getBBox().width;
      if (width>maxLegendLabelWidth) maxLegendLabelWidth=width;
    })

  var legendFontSize = maxLegendFontSize*Math.min(1,(.8*shapeWidth)/maxLegendLabelWidth);

//console.log("shapeWidth " + shapeWidth + " legendFontSize " + legendFontSize);

//  d3.select("#naaqs-map-mapLegend").style("font-size",legendFontSize + "em")

  this.legendElement.selectAll(".legendCells .cell .label").style("font-size",legendFontSize+"px");
      
};


ClassifiedPointsMap.prototype.resize = function (width) {
    var self = this;
//      console.log('resize');
    if (! width) width = d3.select("#" + this.containerID).style("width");
    if (! width) return;

//note need to divide by wdith which is the SVG view Box size because point size is relative to that
    var oldPercentSize = this.percentSize; //Save the old percent size so we know how much the translation is for 100% size
    this.percentSize = parseInt(width)/this.width;    
 
   //If it is apple mobile device then don't use viewBox and have to use transform on resize event
//    if (isMobile.apple.device) {
    if (this.useViewBox==false) {
      this.svg
          .attr("width", this.width*this.percentSize)
          .attr("height", this.height*this.percentSize);
//Have to take into account zoom/pan -> scale/translate values when resizing
      var scale = this.percentSize*this.zoomPanBehavior.scale();
      //Note: dividing by the oldPercentSize to get translation releative to percentSize=100%
      var translate = this.zoomPanBehavior.translate().map(function (x) {return self.percentSize/oldPercentSize*x});
      this.zoomPanBehavior.translate(translate);
      this.g.attr("transform", "translate(" + translate + ")scale(" + scale + ")");    
    }

//IE 11 needs  to explicity set the height of the div containing the SVG
//need to calculate percent size relative to the default width though
    d3.select("#" + this.domID).style("height",this.defaultHeight*parseInt(width)/this.defaultWidth + "px");

//    console.log(this.defaultHeight*width/this.defaultWidth);
    
    this.scaledPointSize=this.pointSize/this.percentSize;
    this.scaledPointStroke=this.pointStroke/this.percentSize;
    
//adjust these for smaller screens to actually have smaller points but not proportionately
    var minReduction = .25; //this is reduction of point at percentSize=0
    minReduction = 1; //Don't even make points smalle for now so tha they are clickable on mobile for big fingers
    var scaleFactor = Math.min(1,(1-minReduction)*parseInt(width)/this.defaultWidth + minReduction);
    this.scaledPointSize *= scaleFactor;
    this.scaledPointStroke *= scaleFactor;

//If zoom behavior not yet assigned then current zoom factor must be 1
    var currentZoomFactor = 1;
//Get current zoom factor from zoom behavior    
    if (this.zoomPanBehavior) currentZoomFactor = this.zoomPanBehavior.scale();
    
    this.points
            .attr("r", this.scaledPointSize/currentZoomFactor)
            .style("stroke-width", this.scaledPointStroke/currentZoomFactor);
              
//resize the legend also
  this.drawLegend(parseInt(width));  
//Move tooltip if it is clicked open
  if (this.tooltip.currentPointElement) this.tooltip.moveToolTip(this.tooltip.currentPointElement);

  if (this.externalResize) this.externalResize();              
};
