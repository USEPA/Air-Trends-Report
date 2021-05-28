//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.visibility) etrends.visibility = {};
 
//This is a function that is called to create the naaqs stuff.
//The execution can be delayed until some setup stuff is done, ie download US map that will be reused
etrends.visibility.init = function (D3QueueCallback) {
  var defaultMinYear = 2000;
	var yearRange = [defaultMinYear,2019];
  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 2;
  var currentType = 'clearest';

//This is place to store downloaded data so we don't have to keep hitting server
  var dataCache = {};
//This is place to store summary stat information once it is calculated
  var summaryStats = {};
    
//Set up the Map parameters for each visibility type  
  var config = {};
  config.symbology = {
    categories:
    [
      'Significantly Improving',
      'Possible Improvement',
      'No Trend',
      'Possible Degradation',
      'Significantly Degrading'
    ],
    labels:
    [
      'Significantly<br/>Improving',
      'Possible<br/>Improvement',
      'No Trend',
      'Possible<br/>Degradation',
      'Significantly<br/>Degrading'
    ],
    colors:[
    d3.rgb(0,0,139), //#00008b dark blue
    d3.rgb(37,116,169), //#2574a9 steel blue
    d3.rgb(64,165,142), //#40a58e light green
    d3.rgb(167,65,101), //#a74165 indian red
    d3.rgb(178,0,253), //#B200FD dark violet
    ],
//Note have to set the width and height since FF adds stroke for width but Chrome doesn't
//Also weird is that size on screen is about 1.25 bigger than what svg says eg. circle with dia=30 has dia=38 when measured on screen.
//But IE doesn't seem to be affected by this 1.25 effect
//I think this is because I have my fonts set to be 1.25 bigger and that affects svg
    symbols:[
      {id:'circle-thin-double-down',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-single-down',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-minus',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-single-up',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-double-up',offsetx:-2,offsety:-2,width:28,height:28}
    ]    
  };

//for now before we can get nominal breaks working
//  config.symbology = {colors:[d3.rgb(0,80,81)],breaks:[]};

  config.types = {};
	config.types.clearest = {file:"clearest_2000-2019.csv",title:"Visibility Trend on Clearest Days",units:"deciview",digits:1,typeLabel:"Clearest",tooltip:"Click to view visibility trends on 20 percent clearest days"}
//Don't show haziest now
//	config.types.haziest = {file:"haziest.csv",title:"Haziest Visibility National Trend",standard:9,units:"indexppm",digits:1,typeLabel:"Haziest",tooltip:""}
	config.types.impaired = {file:"impaired_2000-2019.csv",title:"Visibility Trend on Most Impaired Days",units:"deciview",digits:1,typeLabel:"Most Impaired",tooltip:"Click to view visibility trends on 20 percent most impaired days"}

  makeVisibilityTabs();

  var map = new ClassifiedPointsMap("visibility-map");
  map.pointSize=9;
  map.hideEmptyActiveAttributes = true;
  map.disableMapLegendAutoScaling = true;

  map.toolTipSelector =  "#visibility-map-tooltip";
  //so js in html can find map functions
  map.namespace = "etrends.visibility.map";
  map.topojson = topojson;
//This variation is needed if map div is relative so that tooltip calculation will use relative calculations
  map.useRelativeTooltip=true;

  map.title.text = config.types[currentType].title || "nbsp;";
  map.export.fileName = 'VisibilityMap';
  map.export.hardcodedDownloadPath = "data/visibility/" + config.types[currentType].file;

  map.init();

//Current Type might have a different min Year then normal
  yearRange[0]=config.types[currentType].minYear || defaultMinYear;
    
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
  map.tooltip.sectionSelector = "section#scenic_areas"; 
          
//Note: need to pass the chart custom tooltip class because there are 2 tooltips on chart (another on legend)
   var chart = new LineAreaChart("visibility-chart",125,.5,null,"#visibility-chart-tooltip",".visibility-chart-tooltip-template"); //passing the min height for the chart
   //don't try to draw chart until tooltip comes up
   chart.visible=false;
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

   chart.ytitle.text='Haze index (' + config.types[currentType].units + ')'
   chart.xField = "year";
//no yField gets rid of moving point and adopts highchart tooltip functionality
//   chart.yField = "avg";
//This will get the domain when called using the data
   chart.getXdomain =  null; //use the default x domain which is max min of x field
   //note had to multiply d.p10 and d.p90 by 1 so that it would convert string to number for finding min/max
   //also min/max could possible be national standard 
//Set the step between ticks or tick size
    chart.xTickSize = xTickSize;
   
   chart.getYdomain =  function (self) {
     var min = self.data[0].avg;
     var max = self.data[0].avg;
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

  chart.namespace = "etrends.visibility.chart";

  chart.addSeriesField('name',['percentile','average','selectedSite']);
  chart.addSeriesField('text',['90%ile - 10%ile','National Average','Selected Site']);
  chart.addSeriesField('type',['area','line','line']);
  //In case data has different name for some reason as in this custom stuff
  chart.addSeriesField('data',[null,'avg',null]);
  var chartSymbols = [];
  chartSymbols.push(null);
  chartSymbols.push({id:'MovingPoint'});
  chartSymbols.push(null);
  chart.addSeriesField('symbol',chartSymbols);
//Use this if the columns or column names are different
  chart.export.exportColumns= ['avg','selectedSite','min','max','p10','median','p90'];
  //Could also change menu tooltip data to dynamically change filename
  chart.export.fileName = 'visibility-data';

  chart.legend.ncols = null;
  chart.legend.cellWidth = 20;
  chart.legend.cellHeight = 20;
  chart.legend.cellSpacingX = 10; 
  chart.legend.AllowHiddenSeries = false;

//class that will help calculate stats. Use Sas5 percentiles
  var statsCalculator = new etrends.library.StatsCalculator(yearRange,'','Sas5');
  
d3_queue.queue()
  .defer(makeUSmap,currentType)
  .await(function (error) {
    console.log("visibiliity map loaded");
    if (error) console.error(error);
    if (D3QueueCallback) D3QueueCallback(error);    
  });

function makeVisibilityTabs() {
  var tabs = d3.select("#visibility-tabs ul");
  var types = Object.keys(config.types);
  var html = types.reduce(function (acc,type) {
    acc[type] = config.types[type].typeLabel;
    return acc;
  },{});
  var attrs = types.reduce(function (acc,type) {
    acc[type] = {};
    acc[type].title = config.types[type].tooltip;
    return acc;
  },{});
  etrends.library.utilities.makeTabs(tabs,types,switchType,html,attrs);
}

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
  args.file = "data/visibility/" + config.types[type].file;
  args.done = function (data) {
//testing effect of number of points on rendering speed
//          data = data.slice(0,10);

    map.tooltip.data.type=config.types[type].typeLabel; 
    map.tooltip.data.units=config.types[type].units;
    map.tooltip.data.digits= config.types[type].digits; 

    saveSymbols = config.symbology.symbols;
//    config.symbology.symbols = null;
    map.plotPoints(data,config.symbology,type);    
//    config.symbology.symbols = saveSymbols;
//        map.plotPoints(data,config.symbology);    

    
//Now generate the summary stats for this type if it doesn't exist
    if (! summaryStats[type]) {
      //interpolate the data before generateing the stats
      //Filter to only keep National Trend Sites
      var interpolatedData = statsCalculator.interpolateConcentrations(data,function (row) {return row['used_in_nat_agg']=="Yes";});
      summaryStats[type] = statsCalculator.generateSummaryStats(interpolatedData);
    }      
//    console.log('done with conc layer');

//    console.log(interpolateTimeSeries([null,5,null,7,null]));

    makeVisibilityGraph(currentType);    
  };

//Note: pass cached info so we don't keep hitting server  
  args.cache = dataCache;
  args.key = type;

  etrends.library.utilities.loadMapOrGraph(args,callback);
}

function makeVisibilityGraph(type) {
//    console.log('begin with conc chart');
//summary stats were calculated when concentation layer was read in   
    chart.data = summaryStats[type];
    chart.standard = config.types[type].standard;
    
    chart.title.text = config.types[type].title;
    chart.ytitle.text='Haze index (' + config.types[type].units + ')'
    chart.tooltip.data.digits= config.types[type].digits; 
    chart.tooltip.data.units = config.types[type].units;
    
//Don't actually make the chart until we hover and chart shows in tooltip. it breaks stuff
//Just set stuff up
}

function switchType(type) {
//save this globally so that it can be used later
  currentType = type;

  etrends.visibility.map.title.draw(config.types[currentType].title || "nbsp;");
  etrends.visibility.map.export.hardcodedDownloadPath = "data/visibility/" + config.types[currentType].file;
  etrends.visibility.chart.export.fileName = 'visibility-data_' + currentType;

//hide the open tooltip when the pollutant switches
  etrends.visibility.map.closeToolTip();
  
//Make maps and charts  async  
  d3_queue.queue()
    .defer(makeTrendLayer,type)
    .await(function () {
      console.log("visibility swtiched");
      });
} 


map.externalMouseOver = function (selectedSiteData) {
//this is run in context of visibilityChart which is global chart variable

//Have to turn the resize debouncer back on in case they closed tooltip
    chart.resizeDebouncer.set();

    chart.data.forEach(function (item,index) {
      chart.data[index].selectedSite = selectedSiteData[item.year];
    });
     
    chart.selectedSiteLine = d3.svg.line()
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.selectedSite!==""      
    .defined(function(d) { return (d.selectedSite || (d.selectedSite!=="" && d.selectedSite==0)) ? true : false; })
    .x(function (d) { return chart.xScale(d.year); })
    .y(function (d) { return chart.yScale(d.selectedSite); });    

    chart.title.text =  map.title.text  + "<br/><span class='etrends-chart-title-subtitle'>" + selectedSiteData.location + ", " + selectedSiteData.state + "</span>" || "nbsp;"; //If no site name use nbsp so just empty line at top with menu

      //Have to set chart.visible now when so chart will not try to be drawn when hidden. breaks stuff
    chart.visible = true;
   chart.makeChart();

   chart.export.fileName = 'visibility-data_' + currentType + '_' + selectedSiteData['site_id'];

//refresh the tooltip to show the data for the hovered map location in there
//easiest way to do this is just run the moveline function again for the current x value
    chart.moveLine(chart.currentX);
}

map.externalMouseOut = function (selectedSiteData) {
      //Have to set chart.visible now when so chart will not try to be drawn when hidden. breaks stuff
    chart.visible = false;
}

function drawSelectedSiteLine() {
//this is run in context of visibilityChart
    chart.svg.datum(chart.data);
    
    chart.selectedSiteLineElement = chart.svg.append('path')
      .attr('class', 'etrends-chart-line-selectedSite')
      .attr('d', chart.selectedSiteLine)
      .attr('clip-path', 'url(#rect-clip)');

// add points to line now
//first get the size of the point on small screens
    var minReduction = .25; //this is reduction of point at percentSize=0
    var scaleFactor = Math.min(1,(1-minReduction)*chart.percentSize + minReduction);

//     chart.selectedSiteLinePoints = chart.selectedSiteLineElement.append("g")
    chart.selectedSiteLinePoints = chart.svg.append("g")
    .attr("class", "etrends-chart-point-selectedSite")
    .selectAll(".dot")
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.selectedSite!==""      
    .data(chart.data.filter(function(d) { return (d.selectedSite || (d.selectedSite!=="" && d.selectedSite==0)) ? true : false;}))
    .enter().append("circle")
	.attr('class', 'dot')
    .attr("yval",function(d) { return d.selectedSite; })
    .attr("cx", function(d) { return chart.xScale(d.year); })
    .attr("cy", function(d) { return chart.yScale(d.selectedSite); });  

//reset point size to what is in css and then get css point size    
    chart.selectedSiteLinePoints.style("r",null);
    var pointSize = chart.selectedSiteLinePoints.style("r");
//if browser such as FF does not support radius r to be set with css then fall back to pointSize set on graph object
    if (! pointSize) pointSize=chart.pointSize;    
    var scaledPointSize = parseInt(pointSize)*scaleFactor + "px";
    chart.selectedSiteLinePoints.style("r",scaledPointSize);
//setting r using css doesn't work for some browsers like FF so have to make it an attribute
    if (! chart.selectedSiteLinePoints.style("r")) chart.selectedSiteLinePoints.attr("r",scaledPointSize);
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
      self.averageline = d3.svg.line()
    //    .interpolate('basis')
        .x(function (d) { return self.xScale(d.year); })
        .y(function (d) { return self.yScale(d.avg); });
        
      self.svg.datum(self.data);
    
      self.svg.append('path')
        .attr('class', 'etrends-chart-area etrends-chart-area-percentile')
        .attr('d', self.percentileArea)
        .attr('clip-path', 'url(#rect-clip)');
    
      self.svg.append('path')
        .attr('class', 'etrends-chart-line-average')
        .attr('d', self.averageline)
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
  var legPercentileTip = new MapChartTooltip(self.host,"#visibility-chart-percentile-tooltip");  
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
//this is run in context of visibilityChart

//Don't want to permanently alter the cell resizes
  var factor = 1.25;
  var fields = ['cellWidth','cellHeight','cellSpacingX'];
  //Save a min legend size that we can scale or use minimizing again
  if (! chart.legend.minLegend) {
    chart.legend.minLegend = fields.reduce(function (acc,val) {
      acc[val] = chart.legend[val];
      return acc;
    },{});
  }
  //This multiplies min legend sizes by a factor
  Object.keys(chart.legend.minLegend).forEach(function (val) {
    chart.legend[val] = factor*chart.legend.minLegend[val];
    });  

  chart.makeChart();
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
//this is run in context of visibilityChart

//Reset the legend back to what it should be in case it was earlier maximized
  if (chart.legend.minLegend) {
    Object.keys(chart.legend.minLegend).forEach(function (val) {
      chart.legend[val] = chart.legend.minLegend[val];
      });  
  }

  //Make sure that the override height set onmaximize is emptied out
  chart.overrideHeight = null;
  chart.makeChart();
};

  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  etrends.visibility.switchType = switchType;
  etrends.visibility.map=map;
  etrends.visibility.chart=chart;
};
//# sourceURL=visibility.js