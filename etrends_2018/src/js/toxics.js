//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.toxics) etrends.toxics = {};
 
//This is a function that is called to create the naaqs stuff.
//The execution can be delayed until some setup stuff is done, ie download US map that will be reused
etrends.toxics.init = function (D3QueueCallback) {
  var defaultMinYear = 2003;
  var defaultMaxYear = 2016;

	var yearRange = [defaultMinYear,defaultMaxYear];
  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 2;
  var currentType = 'Acetaldehyde';

//This is place to store downloaded data so we don't have to keep hitting server
  var dataCache = {};
//This is place to store summary stat information once it is calculated
  var summaryStats = {};
    
//Set up the Map parameters for each toxics type  
  var config = {};
  config.symbology = {
    categories:
    [
      'Decreasing',
      'No Trend',
      'Increasing',
  	  'Undetermined'
    ],
    labels:
    [
      'Decreasing',
      'No Trend',
      'Increasing',
  	  'Undetermined'
    ],
    colors:[
    d3.rgb(37,116,169), //#2574a9 steel blue
    d3.rgb(64,165,142), //#40a58e light green
    d3.rgb(167,65,101), //#a74165 indian red
    d3.rgb(153,153,153) //#999999 gray    
    ],
//Note have to set the width and height since FF adds stroke for width but Chrome doesn't
//Also weird is that size on screen is about 1.25 bigger than what svg says eg. circle with dia=30 has dia=38 when measured on screen.
//But IE doesn't seem to be affected by this 1.25 effect
//I think this is because I have my fonts set to be 1.25 bigger and that affects svg
    symbols:[
      {id:'circle-thin-single-down',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-minus',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-single-up',offsetx:-2,offsety:-2,width:28,height:28},
	  {id:'Undetermined',offsetx:0,offsety:0,width:30,height:30}
    ]    
  };

//for now before we can get nominal breaks working
//  config.symbology = {colors:[d3.rgb(0,80,81)],breaks:[]};

  config.types = {};
  config.types.Lead = {fullName:"Lead PM10 LC",minYear:2003,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.BenzoPyrene = {fullName:"Benzo(a)pyrene (Total TSP & Vapor)",minYear:2008,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.Naphthalene = {fullName:"Naphthalene (Total TSP & Vapor)",minYear:2008,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.VinylChloride = {fullName:"Vinyl Chloride",minYear:2003,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.CarbonTetrachloride = {fullName:"Carbon Tetrachloride",minYear:2003,maxYear:2016};
  config.types.EthyleneDichloride = {fullName:"Ethylene Dichloride",minYear:2004,maxYear:2016};
  config.types.Benzene = {fullName:"Benzene",minYear:2003,maxYear:2016};
  config.types.Chloroform = {fullName:"Chloroform",minYear:2003,maxYear:2016};
  config.types.Ethylbenzene = {fullName:"Ethylbenzene",minYear:2003,maxYear:2016};
  config.types.MethyleneChloride = {fullName:"Methylene Chloride",minYear:2003,maxYear:2016};
  config.types.Trichloroethylene = {fullName:"Trichloroethylene",minYear:2003,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.Butadiene = {fullName:"1,3-Butadiene",minYear:2003,maxYear:2016};
  config.types.Toluene = {fullName:"Toluene",minYear:2003,maxYear:2016};
  config.types.Acetaldehyde = {fullName:"Acetaldehyde",minYear:2003,maxYear:2016};
  config.types.Formaldehyde = {fullName:"Formaldehyde",minYear:2003,maxYear:2016};
  config.types.Tetrachloroethylene = {fullName:"Tetrachloroethylene",minYear:2003,maxYear:2016};
  config.types.Nickel = {fullName:"Nickel PM10 LC",minYear:2003,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.Manganese = {fullName:"Manganese PM10 LC",minYear:2003,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.Arsenic = {fullName:"Arsenic PM10 LC",minYear:2003,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.Cadmium = {fullName:"Cadmium PM10 LC",minYear:2003,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};
  config.types.Chromium = {fullName:"Chromium VI LC",minYear:2005,maxYear:2012,multiplier:1000,units:"ng/m\u00B3"};
  config.types.Beryllium = {fullName:"Beryllium PM10 LC",minYear:2004,maxYear:2016,multiplier:1000,units:"ng/m\u00B3"};

  //add other fields for all of these toxic types in a loop
  Object.keys(config.types).sort().forEach(function (name) {
    var item = config.types[name];
    item.file = "concentrations/" + name + ".csv";
    item.title = item.fullName + " Concentration Trend";
    if (!item.units) item.units = "\u03BCg/m\u00B3";
    if (!item.digits && item.digits!=0) {
      if (item.units=="ng/m\u00B3") {
        item.digits = 3;
      }else {
        item.digits = 2;
      }
    }
    item.typeLabel = item.fullName;
    item.tooltip = "Click to view toxics trends for " + item.fullName;
  //Add item to pollutant drop down
    $("#toxics-pollutant-dropdown").append('<option value="' + name + '">' + item.fullName + '</option>');
  })
  
  var map = new ClassifiedPointsMap("toxics-map");
  map.pointSize=9;
  map.hideEmptyActiveAttributes = true;
  map.disableMapLegendAutoScaling = true;

  map.toolTipSelector =  "#toxics-map-tooltip";
  //so js in html can find map functions
  map.namespace = "etrends.toxics.map";
  map.topojson = topojson;
  map.latitudeField = 'latitude';
  map.longitudeField = 'longitude';
  
//This variation is needed if map div is relative so that tooltip calculation will use relative calculations
  map.useRelativeTooltip=true;

  map.title.text = config.types[currentType].title || "nbsp;";
  map.export.fileName = 'ToxicsMap';
  map.export.hardcodedDownloadPath = "data/toxics/" + config.types[currentType].file;

  map.init();

//Current Type might have a different min Year then normal
  yearRange[0]=config.types[currentType].minYear || defaultMinYear;
  yearRange[1]=config.types[currentType].maxYear || defaultMaxYear;
    
  map.activeAttribute = "trend"; 
  map.tooltip.data = {year: yearRange[0],
    type: config.types[currentType].typeLabel,
    units: config.types[currentType].units,
    digits: config.types[currentType].digits}; 
  map.tooltip.data["f.isHidden"] = function (value) {return value ? "" : "hidden"}; 
//Missing values should say NoData not NaN
   map.tooltip.data["f.isMissing"] = function (value) {
     return (value || (value!=="" && value==0)) ? value : "No Data / Incomplete";}; 

  map.externalResize = function () {
  };

  //try to always have tooltip as max for phones. Might not hang them
  if (isMobile.any) {
    map.tooltip.maximizeOnly = true;
  }
          
//   var chart = new ConcentrationLineAreaChart();
//Note: need to pass the chart custom tooltip class because there are 2 tooltips on chart (another on legend)
   var chart = new LineAreaChart("toxics-chart",125,.5,null,"#toxics-chart-tooltip",".toxics-chart-tooltip-template"); //passing the min height for the chart
   //Don't want to draw chart until it is actually showing
   chart.visible = false;
   chart.margin.top = 10;
   chart.useTransitions = false;
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   chart.useRelativeTooltip=true;
   chart.tooltip.data = {units: config.types[currentType].units};
   chart.tooltip.data["f.isHidden"] = function (value) {
     return value ? "" : "hidden";}; 
//Missing values should say NoData not NaN
   chart.tooltip.data["f.isMissing"] = function (value) {
     return (value || (value!=="" && value==0)) ? value : "No Data / Incomplete";}; 

   chart.ytitle.text='Concentration';
   chart.ytitle.units=config.types[currentType].units;
   chart.xField = "year";
//no yField gets rid of moving point and adopts highchart tooltip functionality
//   chart.yField = "median";
//This will get the domain when called using the data
   chart.getXdomain =  null; //use the default x domain which is max min of x field
   //note had to multiply d.p10 and d.p90 by 1 so that it would convert string to number for finding min/max
   //also min/max could possible be national standard 
//Set the step between ticks or tick size
    chart.xTickSize = xTickSize;
   
   chart.getYdomain =  function (self) {
     var min = self.data[0].median;
     var max = self.data[0].median;
     if (self.data.length > 0 && "selectedSite" in self.data[0]) {
       min = Math.min(min,d3.min(self.data, function (d) {          
//Note only return truthy or zero otherwise it is null and ignored
         return (d.selectedSite || d.selectedSite===0) ? 1*d.selectedSite : null ; }));
       max = Math.max(max,d3.max(self.data, function (d) { 
//Note only return truthy or zero otherwise it is null and ignored
         return (d.selectedSite || d.selectedSite===0) ? 1*d.selectedSite : null ; }));
     }
     min = Math.min(min,d3.min(self.data, function (d) { return 1*d.p10; }));
     max = Math.max(max,d3.max(self.data, function (d) { return 1*d.p90; }))
//have the range between min and max +/- some percent of range. Also make sure min is always >= 0
     return [Math.max(0,min - .1*(max-min)), max + .1*(max-min)]
    };

  chart.snapToInterval = function (value) {
//When moving line it must snap to integer year    
    return Math.round(value);
  };
  //Have to set the drag Area bar to be with of interval
  chart.getDragAreaWidth = function (value) {
    return Math.max(50,this.getChartWidth(this.width)/(yearRange[yearRange.length-1]-yearRange[0]));
  };

  chart.namespace = "etrends.toxics.chart";

  chart.addSeriesField('name',['percentile','median','selectedSite']);
  chart.addSeriesField('text',['90%ile - 10%ile','National Median','Selected Site']);
  chart.addSeriesField('type',['area','line','line']);
  //In case data has different name for some reason as in this custom stuff
  chart.addSeriesField('data',[null,'median',null]);
  var chartSymbols = [];
  chartSymbols.push(null);
  chartSymbols.push({id:'MovingPoint'});
  chartSymbols.push(null);
  chart.addSeriesField('symbol',chartSymbols);
//Use this if the columns or column names are different
  chart.export.exportColumns= ['median','selectedSite','avg','min','max','p10','p90'];
  //Could also change menu tooltip data to dynamically change filename
  chart.export.fileName = 'toxics-data';

  chart.legend.ncols = null;
  chart.legend.cellWidth = 20;
  chart.legend.cellHeight = 20;
  chart.legend.cellSpacingX = 10; 
  chart.legend.AllowHiddenSeries = false;

//class that will help calculate stats. Use Sas5 percentiles
  var statsCalculator = new etrends.library.StatsCalculator(yearRange,'','Sas5');
  //statsCalculator.percentileType = 'Exc';
  
d3_queue.queue()
  .defer(makeUSmap,currentType)
  .await(function (error) {
    console.log("toxics map loaded");
    if (error) console.error(error);
    if (D3QueueCallback) D3QueueCallback(error);    
  });


function makeUSmap(type,callback) {
  var args = {};
  args.map = map;
  //If they pass a pollutant then create makeLayers function to plot points  
  if (type) {
    args.makeLayers = function () {
      makeTrendLayer(type,callback);
    };
  }
  etrends.library.utilities.makeBaseMap(args,callback);
}

function makeTrendLayer(type,callback) {
//  console.log('begin with conc layer');
  var args = {};
  args.file = "data/toxics/" + config.types[type].file;
  args.done = function (cacheData) {
//testing effect of number of points on rendering speed
//          cacheData = cacheData.slice(0,10);

    map.tooltip.data.type=config.types[type].typeLabel; 
    map.tooltip.data.units=config.types[type].units;
    map.tooltip.data.digits= config.types[type].digits; 

    //Since data is being cached now need to make a copy of it
    //Other option could be to have new args.preCache function used before data saved to cache so we can cache processed data
    data = $.extend(true,[],cacheData);
    
//Convert some pollutants from ug to nano grams using multiplier
    data = data.map(function (d) {
      //Make active attribute (eg .trend) empty if there is no data for any years
      var hasData = false;
      for (year=yearRange[0];year<=yearRange[1];year++) {
        if (d[year] || d[year]===0) hasData = true;
        if (config.types[type].multiplier && etrends.library.utilities.isNumeric(d[year])) d[year] *= config.types[type].multiplier;
      }
      if (!hasData) d[map.activeAttribute]='';
      return d;
      });  

    map.plotPoints(data,config.symbology,type);    
    
//Now generate the summary stats for this type if it doesn't exist
    if (! summaryStats[type]) {
      //interpolate the data before generateing the stats
      //Filter to only keep National Trend Sites
      var interpolatedData = statsCalculator.interpolateConcentrations(data,function (row) {
        return row['used_in_nat_agg']=="Yes";});
      summaryStats[type] = statsCalculator.generateSummaryStats(interpolatedData);
    }      
//    console.log('done with conc layer');

//    console.log(interpolateTimeSeries([null,5,null,7,null]));

    makeToxicsGraph(currentType);    
  };

//Note: pass cached info so we don't keep hitting server  
  args.cache = dataCache;
  args.key = type;

  etrends.library.utilities.loadMapOrGraph(args,callback);
}

function makeToxicsGraph(type) {
//    console.log('begin with conc chart');
//summary stats were calculated when concentation layer was read in   
    chart.data = summaryStats[type];
    chart.standard = config.types[type].standard;
    
    chart.title.text = config.types[type].title;
    //chart.title.text = config.types[type].fullName;
    chart.ytitle.text='Concentration';
    chart.ytitle.units=config.types[type].units;
    chart.tooltip.data.digits= config.types[type].digits; 
    chart.tooltip.data.units = config.types[type].units;
    
//Don't actually make the chart until we hover and chart shows in tooltip. it breaks stuff
//Just set stuff up
}

function switchType(type) {
//save this globally so that it can be used later
  currentType = type;

//set the new minYear based on this type
  yearRange[0]=config.types[currentType].minYear || defaultMinYear;
  yearRange[1]=config.types[currentType].maxYear || defaultMaxYear;

  etrends.toxics.map.title.draw(config.types[currentType].title || "nbsp;");
  etrends.toxics.map.export.hardcodedDownloadPath = "data/toxics/" + config.types[currentType].file;
  etrends.toxics.chart.export.fileName = 'toxics-data_' + currentType;

//hide the open tooltip when the pollutant switches
  etrends.toxics.map.closeToolTip();
  
//Make maps and charts  async  
  d3_queue.queue()
    .defer(makeTrendLayer,type)
    .await(function () {
      console.log("toxics swtiched");
      });
} 


map.externalMouseOver = function (selectedSiteData) {
//this is run in context of toxicsChart
    var self = chart;
    chart.visible = true;

//Have to turn the resize debouncer back on in case they closed tooltip
    self.resizeDebouncer.set();

    self.data.forEach(function (item,index) {
      self.data[index].selectedSite = selectedSiteData[item.year];
    });
     
    self.selectedSiteLine = d3.svg.line()
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.selectedSite!==""      
    .defined(function(d) { return (d.selectedSite || (d.selectedSite!=="" && d.selectedSite==0)) ? true : false; })
    .x(function (d) { return self.xScale(d.year); })
    .y(function (d) { return self.yScale(d.selectedSite); });    

    self.title.text =  config.types[currentType].fullName + "<br/><span class='etrends-chart-title-subtitle'>Site ID: " + selectedSiteData.site_id + "</span>" || "nbsp;"; //If no site name use nbsp so just empty line at top with menu

   self.makeChart();

   self.export.fileName = 'toxics-data_' + selectedSiteData['site_id'];

//refresh the tooltip to show the data for the hovered map location in there
//easiest way to do this is just run the moveline function again for the current x value
    self.moveLine(self.currentX);
}

map.externalMouseOut = function (selectedSiteData) {
   chart.visible = false;
}

function drawSelectedSiteLine() {
//this is run in context of toxicsChart
    var self = chart;

    self.svg.datum(self.data);
    
    self.selectedSiteLineElement = self.svg.append('path')
      .attr('class', 'etrends-chart-line-selectedSite')
      .attr('d', self.selectedSiteLine)
      .attr('clip-path', 'url(#rect-clip)');

// add points to line now
//first get the size of the point on small screens
    var minReduction = .25; //this is reduction of point at percentSize=0
    var scaleFactor = Math.min(1,(1-minReduction)*self.percentSize + minReduction);

//     self.selectedSiteLinePoints = self.selectedSiteLineElement.append("g")
    self.selectedSiteLinePoints = self.svg.append("g")
    .attr("class", "etrends-chart-point-selectedSite")
    .selectAll(".dot")
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.selectedSite!==""      
    .data(self.data.filter(function(d) { return (d.selectedSite || (d.selectedSite!=="" && d.selectedSite==0)) ? true : false;}))
    .enter().append("circle")
	.attr('class', 'dot')
    .attr("yval",function(d) { return d.selectedSite; })
    .attr("cx", function(d) { return self.xScale(d.year); })
    .attr("cy", function(d) { return self.yScale(d.selectedSite); });  

//reset point size to what is in css and then get css point size    
    self.selectedSiteLinePoints.style("r",null);
    var pointSize = self.selectedSiteLinePoints.style("r");
//if browser such as FF does not support radius r to be set with css then fall back to pointSize set on graph object
    if (! pointSize) pointSize=self.pointSize;    
    var scaledPointSize = parseInt(pointSize)*scaleFactor + "px";
    self.selectedSiteLinePoints.style("r",scaledPointSize);
//setting r using css doesn't work for some browsers like FF so have to make it an attribute
    if (! self.selectedSiteLinePoints.style("r")) self.selectedSiteLinePoints.attr("r",scaledPointSize);
}


  chart.drawPaths = function () {
//        console.log('draw paths');

     var self= this;
    //Draw area
      self.percentileArea = d3.svg.area()
    //    .interpolate('basis')
        .x (function (d) { 
          return self.xScale(d.year); })
        .y0(function (d) { 
          return self.yScale(d.p90); })
        .y1(function (d) { return self.yScale(d.p10); });
    
    //Draw line
      self.medianline = d3.svg.line()
    //    .interpolate('basis')
        .x(function (d) { return self.xScale(d.year); })
        .y(function (d) { return self.yScale(d.median); });
        
      self.svg.datum(self.data);
    
      self.svg.append('path')
        .attr('class', 'etrends-chart-area etrends-chart-area-percentile')
        .attr('d', self.percentileArea)
        .attr('clip-path', 'url(#rect-clip)');
    
      self.svg.append('path')
        .attr('class', 'etrends-chart-line-average')
        .attr('d', self.medianline)
        .attr('clip-path', 'url(#rect-clip)');

      if (self.standardLine || self.standardLine===0) {
    //Draw standard
        self.standardLine = d3.svg.line()
      //    .interpolate('basis')
          .x(function (d) { return self.xScale(d.year); })
          .y(function (d) { return self.yScale(self.standard); });

        self.svg.append('path')
          .attr('class', 'etrends-chart-line-standard')
          .attr('d', self.standardLine)
          .attr('clip-path', 'url(#rect-clip)');
        
    //DraW label for standard
        self.svg.append("text")
      //        .attr("x", this.chartWidth/2) 
      //self.chartWidth
              .attr("x", self.chartWidth - 20*self.percentSize)
              .attr("y", self.yScale(self.standard) - 10 *self.percentSize )
              .attr("text-anchor", "end")  
              //.style('font-weight','bold')
              .style("font-size", ".75em") 
              .text("Most Recent National Standard");    
      }

//Now draw the selectedSite line if it is showing
      if (self.selectedSiteLine)  drawSelectedSiteLine();            
    };

chart.legend.externalAddLegend = function () {
  var self = this;
  //Now do some custom stuff ie. add percentile tooltip
  var legPercentileTip = new MapChartTooltip(self.host,"#toxics-chart-percentile-tooltip");  
  legPercentileTip.offset = {x:15,y:-10};

  //Percentile box is first in series. Maybe should key items by series name
  var legPercentileBox = self.items.percentile.rect;

//Don't pass any data to the tooltip. Just use the hardcoded message
  legPercentileBox.on('mouseenter', function () {
                chart.tooltip.disable=true; //disable the normal tooltiop until we mouse out of legend 
                legPercentileTip.showToolTip(null,this);
                chart.hideToolTip(); //when legend tooltip shows up hide graph tooltipo and vice versa
              }).on('mouseleave', function () {
                chart.tooltip.disable=false; //enable the normal tooltip since we moused out of legend 
                legPercentileTip.hideToolTip();
//Don't need to do this anymore since percentile hover doesn't coinicide with vertical bar hover
//                chart.showToolTip();
              });
}

map.tooltip.onMaximize  = function () {
//this is run in context of toxicsChart
  var self = etrends.toxics.chart;

//Don't want to permanently alter the cell resizes
  var factor = 1.25;
  var fields = ['cellWidth','cellHeight','cellSpacingX'];
  //Save a min legend size that we can scale or use minimizing again
  if (! self.legend.minLegend) {
    self.legend.minLegend = fields.reduce(function (acc,val) {
      acc[val] = self.legend[val];
      return acc;
    },{});
  }
  //This multiplies min legend sizes by a factor
  Object.keys(self.legend.minLegend).forEach(function (val) {
    self.legend[val] = factor*self.legend.minLegend[val];
    });  

  self.makeChart();
//If chart not letting tooltip fit in window then reduce chartheight  
  var windowHeight = $(window).height();
  //Note this represents the map object because this function fired in that context
  var mapToolTipElement = $(this.div.node());
  var toolTipExtra = mapToolTipElement.outerHeight() - .85*$(window).height();

//Do this by reducing the aspect ratio of chart
  if (toolTipExtra > 0) {
    //Note only try to fit the modal if the chart will be at least minimum height. Otherwise user will have to scroll.
    //On some screens even the text will not fit all the way on screen. That would result in negative height.
    var overrideHeight = chart.getChartHeight(chart.height)-toolTipExtra;
    if (overrideHeight > chart.minimumHeight) {
      chart.overrideHeight = overrideHeight;
      chart.makeChart(); 
    }
  }
  
};
map.tooltip.onMinimize  = function () {
//this is run in context of toxicsChart
  var self = etrends.toxics.chart;

//Reset the legend back to what it should be in case it was earlier maximized
  if (self.legend.minLegend) {
    Object.keys(self.legend.minLegend).forEach(function (val) {
      self.legend[val] = self.legend.minLegend[val];
      });  
  }

  //Make sure that the override height set onmaximize is emptied out
  chart.overrideHeight = null;
  self.makeChart();
};

  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  etrends.toxics.switchType = switchType;
  etrends.toxics.map=map;
  etrends.toxics.chart=chart;
};
//# sourceURL=toxics.js
