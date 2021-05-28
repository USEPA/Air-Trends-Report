var ClassifiedPointsMap = function ClassifiedPointsMap(domID,percentSize) {
  this.domID=domID;

//the container size to use for responsiveness
  this.containerID=domID + "-container";
//Set the latitude and longitude field names
  this.latitudeField = 'latitude';
  this.longitudeField = 'longitude';
  
//set this to make tooltip relative to a div not absolute to page
  this.useRelativeTooltip = false;
//Need to set this if multi tooltip in one host container  
  this.toolTipSelector = null;
  
  this.defaultWidth = 870;
  this.defaultHeight = 550;

//If no percent size then calculate from outer container 
  if (percentSize) {
    this.percentSize = percentSize;
  }else {
    this.percentSize = parseInt(d3.select("#" + this.domID).style('width'))/this.defaultWidth;    
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
  this.hideEmptyActiveAttributes = false;
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
  this.title = new etrends.library.MapChartTitle(this);  
  //This is the export menu functionality
  this.export = new etrends.library.MapChartExportMenu(this);
  //Allow map legend font auto scaling to be disabled
  this.disableMapLegendAutoScaling = false;  
  //place to store the base map data
  this.basemapData = null;
  //place to store county info such as county elements, county geometries by state and whether state counties are loaded into map
  this.countyPolygons = {loaded:{}};
  //mapping of fip codes to state info such as name
  this.stateFipCodes = null;  
  //place to store the zoom to state drop down element
  this.zoomToStateDropDown = {};
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
  this.tooltip = new MapChartTooltip(self,self.toolTipSelector);  
  this.tooltip.offset = {x:this.pointSize,y:this.pointSize};
//If small screen and and tooltip over point, tooltip will persists until leaving tooltip instead of point
  this.tooltip.div
  .on('mouseleave', function () {
    if (self.tooltip.showing) return;
    self.hideToolTip();
  })
      
  this.pointSymbology = function (d) {  
    var type = 'colors';
    if (self.symbology.symbols) type = 'symbols';

    var value = d[self.activeAttribute];
    if (self.symbology.breaks) {
      //If there is just one class then just return color
      if (self.symbology.breaks.length==0) return self.symbologyScale(0);      
      //If using breaks force value to be Float
      value = parseFloat(value);
    }
//    if (d["AQS_Site_ID"]==="01-051-0001") {
//      console.log("alabama point");
//    }

//if value is exactly equal to break point then make it the preceeding class
//because d3 threshold scale uses break 1 <= value < break 2 but we want break 1 < value <= break 2 
    var valueBreakpointIndex=-1;
    //if categories instead of breaks don't need to wory about exact match of breaks being preceeding class
    //Note: if truncating the decimals like <=1 2-4 5-7 >=8 then don't do this
    if (self.symbology.breaks && !self.symbology.truncatedDecimals && self.symbology.truncatedDecimals!==0) valueBreakpointIndex = self.symbology.breaks.indexOf(value);

    if (valueBreakpointIndex >= 0) {
//type allows this to get colors or symbols if using custom symbols      
      return self.symbology[type][valueBreakpointIndex];      
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

//Do this when clicking map now
  this.zoomPanBehavior = d3.behavior.zoom();
//    .on("zoom", function () {return self.zoomPanHandler(self);});
//  this.svg.call(this.zoomPanBehavior).on("dblclick.zoom", null); //don't want the double click zoom

//set up resopnsiveness when resized
  this.resizeDebouncer = new MapChartResize(this, function() {
    self.resize();
  }, 200)
//set up debouncer for hovering over points
  this.hoverDebouncer = new MapChartDebounce(100);

    //Set up the export menu functionality
//svgExportElements are DOM elements that will be exported as PNG or printed
//It is a function to make sure the currently rendered elements are used
  this.export.svgExportElements = function () {
    var elements = [];
    //make sure title and legend exist
    if (self.title.svg) elements.push(self.title.svg.node());
    elements.push(self.svg.node());
    if (self.legendElement) elements.push(self.legendElement.node());

    return elements;
  };
  
  this.title.draw();
  this.export.addMenu();

//get zoom behavior function that is  executed in the setZoomEnabled function to enable zooming
  self.zoomPanBehavior = d3.behavior.zoom();
//enable zooming after clicking map
//this should NOT be manually changed. use setZoomEnabled function
  this._zoomEnabled = null;
//Turning on and off will still allow programatically called zoom behavior stuff to work
//Not sure what is turned on that sticks around after .zoom event handler removed
  this.setZoomEnabled(true);
  this.setZoomEnabled(false);

  var container = d3.select("#" + this.containerID);
  container.on("click",function () {
    self.setZoomEnabled(true);
  });
  container.on("mouseleave",function () {
    self.setZoomEnabled(false);
  });

  //to track whether a states county polygons have been loaded yet
  self.loadedCounties = {};

  //create the zoom to state dropdown select and data set up to do so
  self.createZoomToStateDropDown();


};

ClassifiedPointsMap.prototype.setZoomEnabled = function (zoomEnabled) {
    var self = this;
    //If zoomEnabled hasn't changed don't do anything
    if (self._zoomEnabled === zoomEnabled) return;
    self._zoomEnabled = zoomEnabled;

    if (zoomEnabled) {
      self.svg.call(self.zoomPanBehavior);
      self.zoomPanBehavior.on("zoom", function () {return self.zoomPanHandler(self);});
      self.svg.on("dblclick.zoom", null); //don't want the double click zoom
    } else {
      self.svg.on(".zoom", null);
    }
};

ClassifiedPointsMap.prototype.zoomPanHandler = function (self) {
  self.genericZoomPan(self,d3.event.translate,d3.event.scale);
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
    this.points
//    .transition().duration(750)
    .attr("r", self.scaledPointSize/scale)

    if (self.symbology.symbols) {
       self.points
        .attr("transform",function () {
          var scale = $(this).attr("r")/$(this).attr("r0");
          var translateX = $(this).attr("translateX0")-scale*(2+$(this).attr("width0")/2);
          var translateY = $(this).attr("translateY0")-scale*(2+$(this).attr("height0")/2);
          if (isNaN(scale)) {
            console.log('nan');
          }
          var transform = "translate(" + (translateX) + "," + (translateY) + ")scale(" + scale +")";

          return transform;
        });
//For custom symbols only change/scale stroke width if it has stroke with attribute. don't want to add strokes if not on symbol
//Actually this is unneccesary since scale in surrounding group scales down stroke
//          .each(function () { 
//            $(this).children().each(function (i,item) {
//                if (d3.select(item).attr("stroke-width")) {
//                  d3.select(item).attr("stroke-width",self.scaledPointStroke/scale);
//                }
//              })
//          });
        
    } else {
      this.points.style("stroke-width", self.scaledPointStroke/scale);            
    }

//rescale the state borders when zooming so they don't get giant
this.stateBorders.style("stroke-width", this.scaledStateBorderStroke/scale);      
this.countyPolygons.elements.style("stroke-width", this.scaledCountyBorderStroke/scale);      

//move tooltip since zoom changed point location on screen
    if(self.tooltip.showing) self.tooltip.relocate();
} // end genericZoomPan ()


//function which zooms when double clicked after state zoomed to
ClassifiedPointsMap.prototype.zoomOnDoubleClick = function (stateElement) {
  var self = this;

//self is ClassifiedPointsMap instance and stateElement is the clicked state
  if (self.activeState.node() === stateElement) {
//zoom in 2X
    var scale = self.zoomPanBehavior.scale()*2;

  var mouseRelativeToMapDiv = {};
  var mapDivOffset = $('#' + self.domID).offset();
  mouseRelativeToMapDiv.x = d3.event.pageX - mapDivOffset.left;
  mouseRelativeToMapDiv.y = d3.event.pageY - mapDivOffset.top;

//    var translate = [d3.event.offsetX-scale*d3.mouse(stateElement)[0],d3.event.offsetY-scale*d3.mouse(stateElement)[1]];
// The mouse event is coming through at unscaled SVG size. But we want to translate using scaled SVG size so multiply d3.mouse by percentSize
//    var translate = [d3.event.offsetX-self.percentSize*scale*d3.mouse(stateElement)[0],d3.event.offsetY-self.percentSize*scale*d3.mouse(stateElement)[1]];
//Need to calculate mouseRelativeToMapDiv. Before was using offsetX and offsetY but stateElement was diff in IE vs Chrome.
//In chrome offsetX is distance between mouse and map div but in IE i think it was distance between mouse and scaled svg group which is not what is desired here
    var translate = [mouseRelativeToMapDiv.x-self.percentSize*scale*d3.mouse(stateElement)[0],mouseRelativeToMapDiv.y-self.percentSize*scale*d3.mouse(stateElement)[1]];

//      console.log("d3.event.offsetX " + d3.event.offsetX);
//      console.log("self.percentSize " + self.percentSize);
//      console.log("d3.mouse(stateElement)[0] " + d3.mouse(stateElement)[0]);
//      console.log("scale translate " + scale + ' ' + translate);
      
//don't need the .event() call does this automatically
//    self.genericZoomPan(self,translate,scale,true);  
//since we are manually setting pan and zoom we have to update zoom behavior so it remembers where it is and doesn't chop around
    self.zoomPanBehavior.translate(translate).scale(scale)
  //this fires the zoom pan hanlder so that tooltip moves. Note: uses transition in zooming 
    .event(self.svg.transition().duration(750)); 
  }else {
    self.zoomToState(stateElement);
  }
} // end zoomOnDoubleClick()

//function which zooms to state when state double clicked
ClassifiedPointsMap.prototype.zoomToState = function (stateElement) {
//self is the ClassifiedPointsMap object and state is the clicked state
  //make sure to call this using context of ClassifiedPointsMap instance
  var self = this;

//if string or number passed then stateElement is the id
  if (typeof stateElement == "string" || typeof stateElement == "number") {
    stateElement = self.statePolygons.select("[stateID='" + (+stateElement) + "']").node();
  //If not stateElement then state with this ID doesn't exist (or stateElement not passed)
    if (!stateElement) {
      console.error("stateID=" + stateElement + " does not exist");
      return;
    }  
  } else {
    if (!stateElement) {
      console.error("stateElement is required but was not provided");
      return;
    }  
  }
  //data attached to element with spatial info
  var elementData = d3.select(stateElement).data()[0];

  //will load the county polygons if they are not loaded
  //Was much faster to add them incrementally instead of adding them all at once at beginning
  self.mapCounties(+elementData.id);

//Note: no longer return home on double click, instead zoom in for those without scroll wheel
//Use home button now to get back to normal view  
//if (self.activeState.node() === state) return self.resetZoom();
  
  self.activeState.classed("active", false);
  self.activeState = d3.select(stateElement).classed("active", true);

  var bounds = self.path.bounds(elementData),
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

  //now update the state dropdown if it exists in case state was double clicked
  if (self.zoomToStateDropDown) self.zoomToStateDropDown.val(+elementData.id);
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

  //now clear the state dropdown if it exists
  if (self.zoomToStateDropDown) self.zoomToStateDropDown.val('');
}; //end reset()  

ClassifiedPointsMap.prototype.mapCounties = function (stateID) {
  var self = this;
  
  if (self.countyPolygons.loaded[+stateID]) return;
  self.countyPolygons.loaded[+stateID]=true;

  if (!self.countyPolygons.geometries) {
    self.countyPolygons.geometries = self.basemapData.objects.counties.geometries
    .reduce(
      function (acc,county) {
        var countyStateID = +county.id.toString().replace(/(\d){3}$/,'')
        if (!acc[countyStateID]) acc[countyStateID] = [];
        acc[countyStateID].push(county);
        return acc;
      },{});
  }

  
  var counties = {type:"GeometryCollection"};
  counties.geometries = self.countyPolygons.geometries[+stateID];

	self.countyPolygons.elements.append("g")
    .attr("id",stateID + "-county-polygons")
    .selectAll("path")
     .data(this.topojson.feature(self.basemapData, counties).features)
    .enter().append("path")
     .attr("d", this.path)
//	 .style("fill", function (d) {
//     return "blue";})
	 .attr("countyID", function (d) {
     return d.id;})    
}

//map us.json  
ClassifiedPointsMap.prototype.mapStates = function (baseMapData,stateFipCodes) {
  var self=this;

  self.basemapData = baseMapData;
  //if stateFipCodes passed then save it on object. will use to create dropdown 
  if (stateFipCodes) self.stateFipCodes=stateFipCodes;

	self.countyPolygons.elements = this.g.append("g")
    .attr("id","county-polygons")
	 .attr("class", "county-boundary")
  
  //Uncomment this to test how slow it is to load all county polygons at once 
  if (1==0) {
	this.countyPolygons.elements
  .selectAll("path")
     .data(this.topojson.feature(baseMapData, baseMapData.objects.counties).features)
    .enter().append("path")
     .attr("d", this.path)
//	 .style("fill", function (d) {
//     return "blue";})
	 .attr("countyID", function (d) {
     return d.id;})    
  }
   
	this.statePolygons = this.g.append("g")
    .attr("id","state-polygons");

    this.statePolygons
    .selectAll("path")
     .data(this.topojson.feature(baseMapData, baseMapData.objects.states).features)
    .enter().append("path")
     .attr("d", this.path)
     .attr("class", "feature")
	 .attr("stateID", function (d) {
     return d.id;})    
//When state double clicked need to call function that decides whether to zoom to state and show counties or do 2X zoom if already zoomed to state
//Have to call this function in the context of clicked state (this) and pass it the d3 clicked state (d) and ClassifiedPointsMap instance (self)
     .on("dblclick", function (d) {
       return self.zoomOnDoubleClick(this)
    });

//The mesh just draws a single line for borders between states. 
//This used to create lines for borders via a SINGLE path where the above creates individual polygons for each state that can be doubleclicked to zoom
    this.stateBorders = this.g.append("path")
     .datum(this.topojson.mesh(baseMapData, baseMapData.objects.states, function(a, b) { return a !== b; }))
     .attr("id", "state-borders")
     .attr("class", "mesh")
     .attr("d", this.path);

//Save the state and county border stroke so that we can keep it the same visual size while zooming
    if (! this.stateBorderStroke) this.stateBorderStroke=parseFloat(this.stateBorders.style("stroke-width"));
    if (! this.countyBorderStroke) this.countyBorderStroke=parseFloat(this.countyPolygons.elements.style("stroke-width"));

//note sure if i need this. I think it's needed for iframes
//  d3.select(window.frameElement).style("height", this.height + "px");	 

  //create the zoom to state dropdown select and data set up to do so
  self.createZoomToStateDropDown();  
};
 
 
ClassifiedPointsMap.prototype.createZoomToStateDropDown = function () {
  var self = this;
  var container = $("#" + self.containerID);
  var select = container.find(".etrends-map-select-zoomToState");
  //save on object for later use
  self.zoomToStateDropDown = null;
  if (select.length>0) self.zoomToStateDropDown = select;

  if (!self.zoomToStateDropDown || !self.stateFipCodes) return;
   self.stateFipCodes.forEach(function (item,i) {
      self.zoomToStateDropDown.append("<option value='" + item.fips + "'>" + item.name + "</option>");
   });
   self.zoomToStateDropDown.on("change",function () {
     var id = $(this).val();
     if (id) {
       self.zoomToState(id); 
     }else {
       self.resetZoom(); 
     }
   })
}
 
ClassifiedPointsMap.prototype.plotPointsAndLoad = function (pointFile,symbology) {
  var self = this;

  d3.csv(pointFile, function (data) {
    self.plotPoints(data,symbology);
  });
}

ClassifiedPointsMap.prototype.plotPoints = function (pointData,symbology,key) {
  var self = this;
  self.pointData = pointData;
//set the symbology first so points can use it
  self.setSymbology(symbology);

//for testing speed of no points cache
 //key = null;

  if (key) {
    if (! self.pointsCache) self.pointsCache = {};
    //detach current points group
    if (self.pointsGroup) $(self.pointsGroup.node()).detach();
    //null out pointsGroup so that it will be created again instead of having points removed from it
    self.pointsGroup = null;
  }
  if (key && self.pointsCache[key]) {
    self.points = self.pointsCache[key].points;
    self.pointsGroup = self.pointsCache[key].pointsGroup;
//    $(self.pointsGroup.node()).hide();
    self.hidePointsWithMissingInfo();

    $(self.g.node()).append($(self.pointsGroup.node()));
//    $(self.pointsGroup.node()).show();
  }else {
  //remove any existing points and redraw
    if (self.pointsGroup) {
      self.pointsGroup.selectAll("*").remove();      
    } else {
      self.pointsGroup = self.g.append("g").classed("etrends-map-points",true);
    }

    self.pointDataAdded = pointData;
    //I thought if I only added points for each year at a time it might speed up loading
    //Still was loading/rendering about 800+ points which was still lagging
    //End up with another solution which caches map and preloads map
    //Just keeping code in here for now for reference in case need to go back to it
    //If no active attribute is set then don't try to filter by it
    if (this.hideEmptyActiveAttributes===true && self.activeAttribute && 1==0) {
      //set up which points have been added
      self.pointDataIsAdded = pointData.map(function () {
          return false;
      });
      //filter out NoData
      self.pointDataAdded = pointData.filter(function (item,i) {
        var value = item[self.activeAttribute];    
        self.pointDataIsAdded[i] = (value || (value!=="" && value==0));
        return self.pointDataIsAdded[i];
      });
    }

  //for testing how many points slows things down
  //visibleData = visibleData.slice(0,600);

    self.points = self.addPoints(self.pointDataAdded,self.pointsGroup);

      console.log('points plotted');

    if (! this.pointStroke && this.points.node()) this.pointStroke=parseFloat(self.points.style("stroke-width"));

    //hide before the cache
    self.hidePointsWithMissingInfo();
    //cache the d3 points and the pointsGroup element so we don't have to load again
    if (self.pointsCache) {
      if (! self.pointsCache[key]) self.pointsCache[key] = {};  
      self.pointsCache[key].points = self.points;
      self.pointsCache[key].pointsGroup = self.pointsGroup;          
    }
  }

//This hides points that don't have a value for active attribute (if hiding those)
//And hide points with 0 lat and 0 long
//Note: Have to hide these if getting map from cache or just created
//  self.hidePointsWithMissingInfo();

//Now use resize to set th points to be correct for whatever the SVG is sized at on the screen
    this.resize({caller:"plotPoints"});
};

//This hides points that don't have a value for active attribute (if hiding those)
//And hide points with 0 lat and 0 long
ClassifiedPointsMap.prototype.hidePointsWithMissingInfo = function () {
    var self = this;
    self.points.style("display", function (d,i) {
      var hasLatLong = (d[self.latitudeField] && d[self.longitudeField]) ? true : false;
      var value = d[self.activeAttribute];
      var hasData = (value || (value!=="" && value==0)) ? true : false;
      
      //If not hiding empty then don't filter by hasData and just set to true
      if (!self.hideEmptyActiveAttributes) hasData = true;

      var isPointHidden = !(hasLatLong && hasData);
      //Have to add a attr/marker so that when hiding/showing map layers we don't show something that should be hidden
      d3.select(this).attr("isPointHidden",isPointHidden);

      return isPointHidden ? "none" : "";
    });

//Now have to make sure if layer is hidden it is still hidden
  if (self.legendElement) {
    self.legendElement.selectAll('.cell')
    .each(function (d) {
      self.hidePointsInLayerFromCell(this);
    });    
  }    
};

ClassifiedPointsMap.prototype.hidePointsInLayerFromCell = function (element,toggle) {
//just helper function to hide points in layer using a legend cell element
    var self = this;
    var cell = d3.select(element);
    var d = cell.data()[0];
    var layerSymbology = self.symbology.symbols ? d.id : d.toString();    
    var disabled = cell.classed("disabled");
    if (toggle) {
      disabled = !disabled;
      self.styleLegendItemFromCell(element,disabled);
    }  

    return self.hidePointsInLayer(layerSymbology,disabled);
};

ClassifiedPointsMap.prototype.styleLegendItemFromCell = function (element,disabled) {
    //dim hidden layers on legend. 
    var cell = d3.select(element);
    //if disabled passed then use it to set disabled class. if not passed just get disabled from class to set opacity
    if (disabled===true || disabled===false) {
      cell.classed("disabled",disabled);
    } else {
      disabled = cell.classed("disabled");
    }
    //Note: the d3.legend has a transition on creation which transitions opacity of .cell from 0 to 1
    //Hard to find when .cell is actually done transitioning to 1 so that we can set opacity to disabled setting
    //Have to just set opacity of the children of .cell
    if (disabled) {
      cell.selectAll("*").style("opacity",.33);
    }else {
      cell.selectAll("*").style("opacity",1);
    }
};

ClassifiedPointsMap.prototype.hidePointsInLayer = function (layerSymbology,isLayerHidden) {
    var self = this;
    //do this just incase isLayerHidden is just falsey
    var isLayerHidden = isLayerHidden===true ? true : false;
    self.points.style("display", function (d) {
//      var currentDisplay = d3.select(this).style("display");
//Note sure why D3 .style wasn't working for this when self.points not yet in DOM
      var currentDisplay = $(this).css("display")

      var dataSymbology=self.pointSymbology(d);
      //if not symbology (probably because of NoData) then can't change
      if (!dataSymbology) return currentDisplay;
      if (self.symbology.symbols) {
        dataSymbology=dataSymbology.id;
      } else {
        dataSymbology=dataSymbology.toString();
      }
      //If not this layer then don't change anything
      if (dataSymbology!==layerSymbology) return currentDisplay;

      var isPointHidden = d3.select(this).attr("isPointHidden");
      isPointHidden = isPointHidden===true || isPointHidden==="true"

      //if point already hidden regardless of layer then don't show
      return (isLayerHidden || isPointHidden) ? "none" : "";
    });
};

ClassifiedPointsMap.prototype.addPoints = function (pointData,pointsGroup) {
  var self = this;

//This allows either circle or custom SVG inside group
  var element = "circle";
  var plotFunction = self.plotCircles
  if (self.symbology.symbols) {
    element = "g";
    plotFunction = self.plotSymbols;
  }

//If hiding points with no data then better to filter out before trying to translate
//Would need to then add new points when changing the active attribute
//I don't want to redraw all points during animation though
//maybe concat the added points to self.points with d3 somehow?
//Could just append points to pointsGroup and then get new self.points by selecting all in pointsGroup
//d3.select(self.points.node().parentElement).selectAll("*")
	return plotFunction.call(self,pointsGroup
    .selectAll(element)
     .data(pointData)
    .enter())
            .on('mouseenter', function (d) {
                //Don't want this to do anything for phones which require a click
                //It ended messing things up because it was trying to run showTooltip simultaneously
                if (isMobile.any) return;
                var pointElement = this;
                self.hoverDebouncer.debounce(function () {
                  self.tooltip.hovering=true;
                  if (self.tooltip.showing) return;
                  self.showToolTip(d,pointElement);
                })();
              })
            .on('mouseleave', function () {
                self.hoverDebouncer.debounce(function () {
                  self.tooltip.hovering=false;
                  if (self.tooltip.showing) return;
                  //Also check that mouse is not hovering over tooltip
                  if ($(self.tooltip.div.node()).filter(':hover').length>0) return;
                  self.hideToolTip();
                })();
              })
            .on('click', function (d) {
//Don't need to do tooltip stuff again since we are hovering it on click (don't want to create duplicate lines)
                if (self.tooltip.hovering && !self.tooltip.showing) return self.tooltip.showing=true;
//hide existing tooltip will hide old line and show again to show new line
                self.hideToolTip();
                self.showToolTip(d,this);
              });

};

ClassifiedPointsMap.prototype.plotCircles = function (parent) {
  var self = this;

  return parent.append("circle")
               .attr("transform", function(d, i) {
                  var xy = self.projection([d[self.longitudeField], d[self.latitudeField]]);
//                        xy=[0,0];  
                    //Sometimes the latitude and longitude are zero and thus just hard code xy = 0,0
                    if (! xy) {
                      xy = [0,0];
                    }
                   return "translate(" + xy + ")";
                })
            .attr("r", this.pointSize)
            //This just a class so that we can differentiate the default symbol on map which is circle from custom svg created using circle
            //Needed for styling so that custom svgs don't get the default styling for stuff like stroke set as an svg attribute
            .classed("default",true)
            .style("fill", self.pointSymbology)
            .style("opacity", 1)
};

ClassifiedPointsMap.prototype.plotSymbols = function (parent) {
  var self = this;
  var symbolGroup = parent.append("g");
//  var svgBB = self.svg.node().getBoundingClientRect();
  var svgBB = self.g.node().getBoundingClientRect();
  //Make the symbol width/height be 2xR
  var scale = 1;

//return parent.append("g");

  return symbolGroup
 //This for scaling the size of the icon based on what radius of point would be 
    .attr("r0", this.pointSize)
    .each(function(d) {
          var symbol = self.getSVGsymbol(d,this);
          
          var group = $(this);
          //might as well save the symbol as an attribute
          group.attr("symbol",symbol.id)

          var symbols = symbol.svg.clone().children();
          symbols.each(function (i,symbol) {
            group.append(symbol);     
          });
          //No Data will be transparent to reduce flickering if we aren't showing no Data
          //This is because when changing active attribute there is slight delay and when jumping large time span can see old time no Data flicker off
          //If not showing symbols then make No-Data opaque so we don't get flickering of black points
          if (self.hideEmptyActiveAttributes && symbol.id=='NoData') {
            group.attr("opacity",0);
          }else {
            group.attr("opacity",1);            
          }
    })
		.attr("transform",function (d) {
      var symbol = self.getSVGsymbol(d,this);

      //symbol.r0 is the radius of circle r0 that is bounded by the square which also bounds symbol
      var r0 = symbol.r0 || self.pointSize;      
      scale = self.pointSize/r0;
      $(this).attr("r0",r0);
      $(this).attr("width0",symbol.width);
      $(this).attr("height0",symbol.height);

      //This should handle NoData values. It will be empty group so translate doesn't really matter
      if (! symbol.height || ! symbol.width) {
        //translate0 stuff for later so when resizing don't get errors even though these points not showing
        $(this).attr("translateX0",0);
        $(this).attr("translateY0",0);
        $(this).attr("width0",0);
        $(this).attr("height0",0);
        return "translate(0,0)";
      }
//			return "translate(" + (d.x) + "," + (d.y) + ")scale(" + scale +")";
      var xy = self.projection([d[self.longitudeField], d[self.latitudeField]]);

      //Sometimes the latitude and longitude are zero and thus just hard code xy = 0,0
      if (! xy) {
        xy = [0,0];
      }
      //save translate0 stuff for later when resizing
      $(this).attr("translateX0",xy[0]);
      $(this).attr("translateY0",xy[1]);

      var offsetx = 0;
      var offsety = 0;
      if (symbol) {
        offsetx = symbol.offsetx || 0;
        offsety = symbol.offsety || 0;
      }
			return "translate(" + (xy[0]-scale*(-offsetx+symbol.width/2)) + "," + (xy[1]-scale*(-offsety+symbol.height/2)) + ")scale(" + scale +")";
//			return "translate(" + (xy[0]-scale*(gBBWidth/2+(gBB.left-svgBB.left))) + "," + (xy[1]-scale*(gBBHeight/2+(gBB.top-svgBB.top))) + ")scale(" + scale +")";
		});
//    .attr("stroke-width",0 + "px");
};

 ClassifiedPointsMap.prototype.getSVGsymbol = function (d,element) {
  var self = this;
  var symbol = self.pointSymbology(d);
  //If nothing is returned it means noData/noMatch. Use NoData Symbol          
  if (! symbol) { 
    //only generate new no data symbol info if not created because width,height etc will be stashed on it    
    if (!self.symbology.symbols.NoData) self.symbology.symbols.NoData = {id:'NoData'};
    symbol = self.symbology.symbols.NoData;
  }
  //Just add the jquery element to symbol obect
  symbol.svg = $("#etrends-customSymbols-" + symbol.id);
  //if symbol doesn't exist have to use Missing Symbol icon
  if (symbol.svg.length==0) {
    symbol.id = 'MissingSymbol';
    symbol.svg = $("#etrends-customSymbols-" + symbol.id);
  }  
  //if r0 not set on symbol then try to get as attribute of svg
  //this is needed for noData otherwise r0 gets set to zero because g element below not filled yet
  if (!('r0' in symbol)) {
    symbol.r0 = symbol.svg.attr("r0");
  }
  //if height/width set on svg symbol then use that otherwise try to get from r0 radius
  ['height','width'].forEach(function (item) {
    if (!(item in symbol)) {
      symbol[item] = symbol.svg.attr(item);
      if (!symbol[item]&&symbol[item]!==0&&(symbol.r0||symbol.r0===0)) {
        symbol[item] = 2*symbol.r0;  
      }
    }  
  })
  
    //Save the original height and width stuff if not on the symbol info object then add
  //It is needed later when zooming and resizing
  if (element) {
    if ((!symbol.width && symbol.width !==0) || (!symbol.height && symbol.height !==0)) {
      var gBB = element.getBoundingClientRect();
  
      if (!symbol.width && symbol.width !==0) symbol.width = gBB.width;
      if (!symbol.height && symbol.height !==0) symbol.height = gBB.height;        
    }  
  }
  //Set what the equivalent radius (r0) would be of this symbol ie. r0 is radius of circle that is bounded by the square which also bounds symbol
  //This is just convenience so we can use r/r0 later to scaling symboling so it is same size a circle with r=self.pointSize
  if (! symbol.r0 && symbol.r0 !==0) symbol.r0 = Math.max(symbol.height,symbol.width)/2;

  return symbol;
 };


//These functions just make working with tooltip easier now that different things happen for click vs hover
 ClassifiedPointsMap.prototype.showToolTip = function (d,element) {
  var self = this;

  //Kind of rube goldberg but have to turn off maximize only and then restore and run show tooltip again
  //Otherwise show tooltip was trying to draw charts but data wasn't there yet because it was loaded in externalMouseOver.
  var maximizeOnly = self.tooltip.maximizeOnly;

  if (self.externalMouseOver) {
    self.tooltip.maximizeOnly = false;
  //Putting the mouseover thing into custom Render event which happens before copying to ghost div
    self.tooltip.customRender = function () {
      //wrap self.externalMouseOver(d) in $.when to ensure it returns promise
      return  $.when(self.externalMouseOver(d))
        .then(function () {
          //Now if maximizeOnly is being used have to maximize chart after external mouse stuff called since it wasn't done in showToolTip because data downloaded in external mouse wasn't available then
          if (maximizeOnly) self.tooltip.maximizeWidth(d,element);
          //can restore maximizeOnly only now to actual value
          self.tooltip.maximizeOnly = maximizeOnly;
          self.tooltip.setupMaximizeOnly();            
        });
    };
  }
  return self.tooltip.showToolTip(d,element)
    .then(function () {
    });
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
  var self = this;  
  this.activeAttribute=attribute;
  var newData = self.pointData;
    //I thought if I only added points for each year at a time it might speed up loading
    //Still was loading/rendering about 800+ points which was still lagging
    //End up with another solution which caches map and preloads map
    //Just keeping code in here for now for reference in case need to go back to it
  if (this.hideEmptyActiveAttributes===true && 1==0) {
    //filter out NoData
    newData = self.pointData.filter(function (item,i) {
      var value = item[self.activeAttribute];   
      var hasData = (value || (value!=="" && value==0));
      //If this is not NoData and point hasn't been added already then add
      var addData = (hasData && !(self.pointDataIsAdded[i]));
      //Have to record that this point has been added now. Only set if true.
      if (hasData) self.pointDataIsAdded[i]=true;
      return addData;
    });
    self.pointDataAdded = self.pointDataAdded.concat(newData);

    if (! self.pointsGroup) {
      self.pointsGroup = self.g.append("g");
    }
    var newPointsGroup = self.g.append("g");

    var newPoints = self.addPoints(newData,newPointsGroup);
    //Have to get the points again now because new points have been added
    //Have to join the point added to the map so far
    $(self.pointsGroup.node()).append($(newPointsGroup.node()).children());
    
    self.points = self.pointsGroup.selectAll("*").data(self.pointDataAdded);
  }

  if (self.symbology.symbols) {
    self.points
    .each(function(d) {
      var symbol = self.getSVGsymbol(d,this);
          var group = $(this);
          //if current symbol matches symbol changing to don't redraw it
          if (group.attr("symbol")==symbol.id) {
            return;
          }
          group.attr("symbol",symbol.id)
  
          var symbols = symbol.svg.clone().children();
          //empty out the group
          group.empty();
          symbols.each(function (i,symbol) {
            group.append(symbol);     
          })
          //No Data will be transparent to reduce flickering if we aren't showing no Data
          //This is because when changing active attribute there is slight delay and when jumping large time span can see old time no Data flicker off
          //If not showing symbols then make No-Data opaque so we don't get flickering of black points
          if (self.hideEmptyActiveAttributes && symbol.id=='NoData') {
            group.attr("opacity",0);
          }else {
            group.attr("opacity",1);            
          }

//Have to update the size,translate, scale of this symbol in group attributes since it has changed
      //symbol.r0 is the radius of circle r0 that is bounded by the square which also bounds symbol
          if (symbol.id=="NoData") {
//            console.log("aaaa")
          }
          var r0 = symbol.r0 || self.pointSize;      

          //Just to be safe can get current r in case not an attribute
          //To get current r need scaled point size and zoom factor then scale = r/r0          
          if (!group.attr("r")) {
            var currentZoomFactor = 1;
            if (self.zoomPanBehavior) currentZoomFactor = self.zoomPanBehavior.scale();
            var scaledPointSize = self.scaledPointSize || self.pointSize;
            group.attr("r",scaledPointSize/currentZoomFactor);
          }
          var r = group.attr("r");

          scale = r/r0;
          group.attr("r0",r0);
          group.attr("width0",symbol.width);
          group.attr("height0",symbol.height);

          var offsetx = 0;
          var offsety = 0;
          if (symbol) {
            offsetx = symbol.offsetx || 0;
            offsety = symbol.offsety || 0;
          }
          group.attr("transform","translate(" + (group.attr("translateX0")-scale*(-offsetx+symbol.width/2)) + "," + (group.attr("translateY0")-scale*(-offsety+symbol.height/2)) + ")scale(" + scale +")");
    });
  } else {
    this.points.style("fill", this.pointSymbology);
  }

//This hides points that don't have a value for active attribute (if hiding those)
//And hide points with 0 lat and 0 long
  self.hidePointsWithMissingInfo();

//Also change what is on the tooltip if attribute changed and it is still showing (eg. on playback)
//Have to call the html function of the element
  self.tooltip.renderToolTip(self.tooltip.currentHoverPoint);
//        d3.select('#sliderText').text(value);        
 };


ClassifiedPointsMap.prototype.getLongestLineInRangeLabels = function (labels) {
  var self = this;
  var container = d3.select("#" + self.containerID);
  return labels.map(function (label) {
    var words = label.split("<br/>");
    var widths = etrends.library.utilities.getWordWidths(container.node(),words);
    var maxWord = "";
    var maxWidth = 0;
    widths.forEach(function (width,i) {
      if (width>maxWidth) maxWord = words[i];
    });
    return maxWord;
  })
};

ClassifiedPointsMap.prototype.setSymbology = function (symbology) {
  var self = this;
  this.symbology = symbology;

//Scale for data rendering  
//Note symbols will have different range
  var range = symbology.colors; 
  if (symbology.symbols) range = symbology.symbols;

  if (symbology.categories) {
    var catLookup = {};
    symbology.categories.forEach(function (cat,i) {
      catLookup[cat] = range[i];
    })
    this.symbologyScale = function (cat) {
      return catLookup[cat];
    };

    //kind of hack to get the legend to work
    //Need to make another symbology scale for the legend that uses threshold scale
    //Otherwise only symbol symbology will work and not color symbology
    //var legendHackDomain = symbology.categories.map(function (x,i) {return i});
    //this.symbologyScale.domain = function () {return legendHackDomain};

    var legendbreaks = symbology.categories.map(function (x,i) {return i});
    legendbreaks.pop();

    this.legendSymbologyScale = d3.scale.threshold()
      .domain(legendbreaks)
      .range(range);
    
//range labels for categories are just the categories
    if (symbology.labels) {
      this.rangeLabels = self.getLongestLineInRangeLabels(symbology.labels);
    }else {
      this.rangeLabels = symbology.categories;
    }
  } else {
      //If want breaks like <=1 2-4 5-7 >=8 instead of <=1 1-4 4-7 >7 then need to add one "increment" to bins
      //This is because threshold scale bins like lower <= value < upper
      //Therfore if bins were 1,4,7 then transforming to 2,5,8 will make breaks like <2 2-5 5-8 >=8
      //considering we are truncating values anything less than 2 say 1.5 would truncate to 1 so first label should be <1
      //next bin 2-5 is 2 <= x < 5 so say 4.5 will truncate to 4 so second bin should be relabeled 2-4
    var increment = null;

    if (symbology.truncatedDecimals || symbology.truncatedDecimals===0) increment = Math.pow(10,-symbology.truncatedDecimals);

    var breaks = symbology.breaks;
    if (increment !== null) breaks = symbology.breaks.map(function (d) {return round(d+increment,symbology.truncatedDecimals)});

    this.symbologyScale = d3.scale.threshold()
      .domain(breaks)
      .range(range);
  //get range labels for breaks
    var leftLabel;
    if (increment !== null) {
      //This will allow breaks like <=1 2-4 5-7 >=8 instead of <=1 1-4 4-7 >7
      //It relabels <2 2-5 5-8 >=8 to <=1 2-4 5-7 >=8
      this.rangeLabels = breaks.map(function (d,i) {
        var label;
        if (i==0) {
          label = "<= " + round(d-increment,symbology.truncatedDecimals);      
        }else {
          label = leftLabel + " - " + round(d-increment,symbology.truncatedDecimals);      
        }
        leftLabel=d;
        return label;
      }); 
      this.rangeLabels.push(">= " + leftLabel);
    }else {
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
    }
  }

//This is called in resize function that is called by plot points. Just have this set symbology not draw legend until told to do so
//  this.drawLegend();  

  //Have to round calculations to make sure it has proper precission ie. might be 1.99999999 or 2.0000001 instead of just 2
  function round(value,places) {
      return Number((Math.round(value + "e" + places)  + "e-" + places));
  }
 };
 
ClassifiedPointsMap.prototype.drawLegend = function (width) {
  var self = this;
  //Don't draw legend if there is only one class
  if (self.symbology.breaks && self.symbology.breaks.length==0) return;
  if (self.symbology.categories && self.symbology.categories==0) return;

//Have to save whether legend items/layers are hidden so they can be set again after being redrawn
  var legendElementsDisabled = [];
  if (self.legendElement) {
    self.legendElement.selectAll('.cell')
    .each(function (d,i) {
      legendElementsDisabled[i] = d3.select(this).classed("disabled");
    });    
  }

  if (! width) width = this.width;
  var nCategories;
  if (this.symbology.colors) nCategories = this.symbology.colors.length;
  if (this.symbology.symbols) nCategories = this.symbology.symbols.length;

  //the min shapeWidth has to be the max of 100 vs max label length
  var maxShapeWidth = 100;
  var shapeWidthWasLimited = false;  
  var shapeWidth = .9*width/nCategories;
  //Save this for comparison when scaling font later
  var shapeWidthPreLimit = shapeWidth;
  if (shapeWidth>maxShapeWidth) {
    shapeWidth = 100;
    shapeWidthWasLimited = true;
  }

  var legendObject;
  if (this.symbology.symbols) {
//    legendObject = d3.legend.symbol();
  }else {
//    legendObject = d3.legend.color().shapeWidth(shapeWidth).shapeHeight(15);
  }

legendObject = d3.legend.color();

var legendSymbologyScale = this.symbologyScale;
if (this.symbology.categories) legendSymbologyScale = this.legendSymbologyScale;

  this.legendLinear = legendObject    
    .orient('horizontal')
    .scale(legendSymbologyScale)
    .labels(this.rangeLabels);
     
    //VERY hacky. need to figure out why i made the containerID the map DOM and not the container
    //Must have been for resonsiveness
  var legendSelect = d3.select("#" + this.containerID + " .etrends-map-legend");    
  legendSelect.selectAll("*").remove();

  this.legendElement = legendSelect.append("svg")

//if using symobls get the max shape height
  var shapeHeight = 15;
  var scale = 1;  
  if (this.symbology.symbols) {
    shapeHeight = self.symbology.symbols.reduce(function (acc,symbol) {
      self.legendElement.append("g");
      self.legendElement.select("g")
//      .html(val);
        .each(function(d) {
              var symbolSVG = $("#etrends-customSymbols-" + symbol.id);
    //if symbol doesn't exist have to use black dot
              if (symbolSVG.length==0) symbolSVG = $("#etrends-customSymbols-MissingSymbol");

              var symbols = symbolSVG.clone().children();
              var group = $(this);
              symbols.each(function (i,symbol) {
                group.append(symbol);     
              })
              //Scale the symbol to be size of actual points on map
                var gBB = group[0].getBoundingClientRect();
              //Set what the equivalent radius (r0) would be of this symbol ie. r0 is radius of circle that is bounded by the square which also bounds symbol
                var r0 = Math.max(gBB.height,gBB.width)/2;
                var scale = 1;
                if (r0) scale = self.pointSize/r0;
                group.attr("transform","scale(" + scale + ")");
        });
      var height = self.legendElement.select("g").node().getBoundingClientRect().height;
      if (height>acc) acc = height;
      self.legendElement.selectAll("*").remove();
      return acc;
    },0);
  }

  this.legendElement  
      .attr("class","naaqs-map-legendLinear")
    .call(this.legendLinear.shapeWidth(shapeWidth).shapeHeight(shapeHeight));

  if (this.symbology.symbols) {
  //if symbols have to fix so that actual external svg path is symbol
    this.legendElement.selectAll('.cell')
    .append("g")
//    .html(function (d,i) {
//      return self.symbology.symbols[i] + $(this).html();
//    })
      .each(function(d,i) {
          var symbol = self.symbology.symbols[i];
          var symbolSVG = $("#etrends-customSymbols-" + symbol.id);                    
//if symbol doesn't exist have to use black dot
          if (symbolSVG.length==0) symbolSVG = $("#etrends-customSymbols-MissingSymbol");

          var symbols = symbolSVG.clone().children();
          var group = $(this);
          //Need to loop in reverse becuase we are prepending the symbol children 
          for (i = symbols.length-1; i >= 0; i--) {
            group.prepend(symbols[i]);     
          }
      })
    .attr("transform", function (d,i) {
      var symbol = self.symbology.symbols[i];
      //Scale the symbol to be size of actual points on map
      var gBB = this.getBoundingClientRect();
      //actuall width and height of symbol before scaling
      var fullWidth = symbol.width || gBB.width;
      var fullHeight = symbol.height || gBB.height;
    //Set what the equivalent radius (r0) would be of this symbol ie. r0 is radius of circle that is bounded by the square which also bounds symbol
      var r0 = Math.max(fullHeight,fullWidth)/2;
      var scale0 = 1;
      if (r0) scale0 = self.pointSize/r0;

      var width = scale0*gBB.width;

      if (width>shapeWidth) {
        scale = shapeWidth/width;
        if (scale0) scale = scale0*scale;
        return "translate(0,0)scale(" + scale + ")";
      }else {
        if (scale0) scale = scale0;
        return "translate(" + (shapeWidth-width)/2 + ",0)scale(" + scale + ")";
      }
    });
  }
//Set up legend to hide show layers based on legend item clicked
  this.legendElement.selectAll('.cell')
    .style("cursor","pointer")
    .on("click",function (d) {
      //passing toggle = true it will toggle the hide/show state of layer
      self.hidePointsInLayerFromCell(this,true);
  });    

//reset legend font size to what is in the css
  var legendElements = this.legendElement.selectAll(".legendCells .cell");
  var legendTextElements = this.legendElement.selectAll(".legendCells .cell .label");
  //Sometimes might want to disable font size autoscaling. If so then skip this stuff
  if (this.disableMapLegendAutoScaling!==true) {
    legendTextElements.style("font-size","");
  //Let the font-size cap at what is set in css and shrink down based on shapewidth shrinking
    var maxLegendFontSize = parseInt(legendTextElements.style("font-size"));
  //  this.legendElement.selectAll(".legendCells .cell .label").style("font-size",maxLegendFontSize + "px");

  //Let the font-size cap at 12px and shrink down based on shapewidth shrinking
  //Find the maximum legend label
    var maxLegendLabelWidth=0;
    this.legendElement.selectAll(".legendCells .cell .label")
      .each(function() {
        width=this.getBBox().width;
        if (width>maxLegendLabelWidth) maxLegendLabelWidth=width;
      });

    var legendFontSize ;
    //if shape width was constrained by maximum allowed then don't want to restrain font if it fits in map width space 
    if (shapeWidthWasLimited) {
      //if text is wider than shapewidth can increase  shapewidth to match text
      //This only needed if legend has rectangles instead of symobls. can do later when we need that
      var shapeWdithPreStretch = shapeWidth;
      if (maxLegendLabelWidth>.9*shapeWidth) {
        shapeWidth = maxLegendLabelWidth/.9;
      }
      //if the text is wider than original shapewidth then reduce text font size to fit original shapewidth
      //Have to check width this down here after the legend is drawn. Maybe someday we can draw our own legend so we have more contorls.
      if (maxLegendLabelWidth>.9*shapeWidthPreLimit) {
        shapeWidth = shapeWidthPreLimit;
      }
      //shift the cells over by the shapewidth difference if cells are stretched
      if (shapeWdithPreStretch !== shapeWidth) {
        var deltaShapeWidth = 0;
        legendElements.each(function (d,i) {
          var $cell = $(this);
          var translate = $cell.attr("transform").replace("translate(","").replace(")","").split(",");
          var translateX = +translate[0] + deltaShapeWidth;
          $cell.attr("transform","translate(" + translateX + "," + translate[1] + ")");      
          //now add the difference in originally drawn shapewidth and what we are stretching it out to be
          deltaShapeWidth += (shapeWidth-shapeWdithPreStretch);
        });
      }
    }
    legendFontSize = maxLegendFontSize*Math.min(1,(.9*shapeWidth)/maxLegendLabelWidth); 

  //console.log("shapeWidth " + shapeWidth + " legendFontSize " + legendFontSize);

  //  d3.select("#naaqs-map-mapLegend").style("font-size",legendFontSize + "em")

    legendTextElements.style("font-size",legendFontSize+"px");

  }

//Now add the 2nd + lines of legend text
  var lineHeight = 1.15;
  if (self.symbology.labels && 1==1) {
    legendElements.each(function (d,i) {
      var $cell = $(this);
      //jquery can't select svg elements by class in IE
//      var $labelElement = $cell.find(".label");
      var $labelElement = $(d3.select(this).select(".label").node());

      //hack away to get the transform
      //IE uses space delimited instead of comma
      var translate = $labelElement.attr("transform").replace("translate(","").replace(")","");
      //Total hack here but IE is counting space or something when getting height of text with getBoundingClientRect
      //emprical found to be 1.28 so we can correct for IE so there isn't huge space
      var IElineHeightFactor = 1.28;
      if (/,/.test(translate)) {
        translate = translate.split(",");
        IElineHeightFactor = 1;
      }else {
        translate = translate.split(" ");
      }

      var labelsText = self.symbology.labels[i].split("<br/>");
      var translateX = +translate[0];
      var translateY = +translate[1];
      var deltaY ;
      
      labelsText.forEach(function (text,i) {
        var $newLabel = $labelElement.clone();
        $newLabel.text(text);
        $cell.append($newLabel);
        //first row of text has translate Y right. doesn't need deltaY added
        if (i>0) {
          var bb = $newLabel[0].getBoundingClientRect();
          deltaY = bb.height*lineHeight/IElineHeightFactor;
          translateY += deltaY;          
        }
        $newLabel.attr("transform","translate(" + translateX + "," + translateY + ")");
      })
      $labelElement.remove();
    });    
  }

//Now that possible extra text has been added set the height and width of svg tag
  this.legendElement
      .attr("width", this.legendElement.select(".legendCells").node().getBBox().width)
      .attr("height", this.legendElement.select(".legendCells").node().getBBox().height)    
      .style("padding", 0);      

//At end get rid of the rectangle placeholders so that centering, svg size etc is correct
  if (this.symbology.symbols) this.legendElement.selectAll('.cell rect').remove();

  var svgWidth = $(legendSelect.node()).width();
  this.legendElement
      .attr("width", svgWidth)
//Now center legendCells in svg
      var legendCellsWidth = nCategories * shapeWidth;
      this.legendElement.select(".legendCells")
        .attr("transform","translate(" + (svgWidth-legendCellsWidth)/2 +",0)");

//Make sure that hidden/disabled legend items are dimmed
    self.legendElement.selectAll('.cell')
    .each(function (d,i) {
      self.styleLegendItemFromCell(this,legendElementsDisabled[i]);
    });    
        
    //Note sure why but have to detach and append svg otherwise there is some weird padidng that occurs in div
    etrends.library.utilities.detachAppendElement(self.legendElement.node(),legendSelect.node());
};

ClassifiedPointsMap.prototype.resize = function (args) {
    var self = this;
    //Kind of hacky but used to have width as only function. now want to pass an args object that external resize can use
    //if passing args object then get width as a field
    var width = args;
    if (typeof(args)=="object") width=args.width;
    if (! width) width = d3.select("#" + this.domID).style("width");
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
    this.scaledStateBorderStroke=this.stateBorderStroke/this.percentSize;
    this.scaledCountyBorderStroke=this.countyBorderStroke/this.percentSize;    
    
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
    
    //If no points then this will break
    if (this.points && this.points.node()) {
      this.points.attr("r", this.scaledPointSize/currentZoomFactor);
      if (this.symbology.symbols) {
        this.points
          .attr("transform",function () {
            var scale = $(this).attr("r")/$(this).attr("r0");
            var translateX = $(this).attr("translateX0")-scale*($(this).attr("width0")/2);
            var translateY = $(this).attr("translateY0")-scale*($(this).attr("height0")/2);
            var transform = "translate(" + (translateX) + "," + (translateY) + ")scale(" + scale +")";
            return transform;
          });
//For custom symbols only change/scale stroke width if it has stroke with attribute. don't want to add strokes if not on symbol
//Actually this is unneccesary since scale in surrounding group scales down stroke
//          .each(function () { 
//            $(this).children().each(function (i,item) {
//                if (d3.select(item).attr("stroke-width")) {
//                  d3.select(item).attr("stroke-width",self.scaledPointStroke/currentZoomFactor);
//                }
//              })
//          })
      }else {
        this.points.style("stroke-width", this.scaledPointStroke/currentZoomFactor);      
      }                 
    }

//rescale the state borders when zooming so they don't get giant
this.stateBorders.style("stroke-width", this.scaledStateBorderStroke/currentZoomFactor);      
this.countyPolygons.elements.style("stroke-width", this.scaledCountyBorderStroke/currentZoomFactor);      

//resize the legend also
//  if (!self.symbology.symbols) {
    this.drawLegend(parseInt(width));  
//  }
  
//Move tooltip if it is clicked open
  if (this.tooltip.currentPointElement) this.tooltip.moveToolTip(this.tooltip.currentPointElement);

//Redraw title to resize
  this.title.draw();
//fire off external things  
  if (this.externalResize) this.externalResize(args);              
};
//# sourceURL=ClassifiedPointsMap.js