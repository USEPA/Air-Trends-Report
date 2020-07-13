//stashing stuff in etrends so i don't have to clutter window object
//then stashing speciation stuff in etrends.speciation
if (! etrends) var etrends = {};
if (! etrends.speciation) etrends.speciation = {};
 
//This is a function that is called to create the naaqs stuff.
//The execution can be delayed until some setup stuff is done, ie download US map that will be reused
etrends.speciation.init = function (D3QueueCallback) {
//Just set up the stuff that needs to go into plotting the map  
  var speciationConfig = {};
	  
//	speciationConfig = {file:"data/d3/concentrations/1990-2015/co.csv",title:"Speciation Data"};
  speciationConfig = {file:"data/speciation/monitors.json",title:"PM\u2082.\u2085 Composition Trend"
//concentrations is place to store concentration stuff. data stored in data for caching and files in folder
  ,concentrations:{data:{},folder:"data/speciation/concentrations",units:"\u03BCg/m\u00B3",digits:3}
  }; 

  speciationConfig.series = {};
  speciationConfig.series.name = ['Sea-salt','Crustal','OrganicCarbon','ElementalCarbon','Nitrate','Sulfate'];
  speciationConfig.series.text = ['Sea Salt','Crustal','Organic Carbon','Elemental Carbon','Nitrate','Sulfate'];

//  speciationConfig.symbology = {colors:[d3.rgb(255,0,0),d3.rgb(255,0,0)],breaks:[0]};
  speciationConfig.symbology = {colors:[d3.rgb(0,80,81)],breaks:[]};

  etrends.speciation.map = new ClassifiedPointsMap("speciation-map");
  //Since this map doesn't really have attributes to get symbology from don't hideEmptyActiveAttrbutes
  etrends.speciation.map.hideEmptyActiveAttributes = false;

  etrends.speciation.map.toolTipSelector =  "#speciation-map-tooltip";
  //so js in html can find map functions
  etrends.speciation.map.namespace = "etrends.speciation.map";
  etrends.speciation.map.topojson = topojson;
//This variation is needed if map div is relative so that tooltip calculation will use relative calculations
  etrends.speciation.map.useRelativeTooltip=true;
  etrends.speciation.map.title.useSVG=true;

  etrends.speciation.map.title.text = speciationConfig.title || "nbsp;";
  etrends.speciation.map.init();
    
  etrends.speciation.map.externalResize = function () {
  };
      
  //setMapTitle();
  etrends.speciation.map.export.fileName = 'SpeciationMap';
  etrends.speciation.map.export.hardcodedDownloadPath = 'data/speciation/site_quarterly_spec_withSiteName_2000-2017.csv';

  //try to always have tooltip as max for phones
  if (isMobile.any) {
    etrends.speciation.map.tooltip.maximizeOnly = true;
  }
  etrends.speciation.map.tooltip.sectionSelector = "section#pm2_5_composition"; 

//set concurrency for this simple example so tasks run in series
//If want in parallel don't enter concurrency. I needed to makes series so that map is drawn and then points plotted
d3_queue.queue([1])
//Just use general function passings args object with the map object to map onto
  .defer(etrends.library.utilities.makeBaseMap,{map:etrends.speciation.map})
  .defer(makeSpeciationLayer,speciationConfig)
  .await(function (error) {
    console.log("speciation map loaded");
    if (error) console.error(error);
    if (D3QueueCallback) D3QueueCallback(error);    
  });

//Put chart set up in function because don't want to call it until tooltip is showing
function initChart() {
  //If chart already initialized then don't do it again  
  if (etrends.speciation.chart) return;
//Don't stash chart because it is in template and DOM elements are recreated and old ones get abandoned
//Hopefully garbage collection will remove old charts  
//Note: need to pass the chart custom tooltip class because there are 2 tooltips on chart (another on legend)
   etrends.speciation.chart = new LineAreaChart("speciation-chart",125,.40,null,"#speciation-chart-tooltip",".speciation-chart-tooltip-template"); //passing the min height for the chart
   //to get chart to fit tooltip
   //etrends.speciation.chart.containerID = "speciation-map-tooltip";
    etrends.speciation.chart.namespace = "etrends.speciation.chart";
    
    Object.keys(speciationConfig.series).forEach(function (field) {
      etrends.speciation.chart.addSeriesField(field,speciationConfig.series[field]);
    });

    etrends.speciation.chart.legend.type = 'rect';
    etrends.speciation.chart.legend.ncols = null;
    etrends.speciation.chart.legend.cellWidth = 15;
    etrends.speciation.chart.legend.cellHeight = 15;
    etrends.speciation.chart.legend.cellSpacingX = 8;

   etrends.speciation.chart.useTransitions = false;
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   etrends.speciation.chart.useRelativeTooltip=true;

   etrends.speciation.chart.export.allowConvertYdomainToPercent=true;
   
//Set up some constant data for tooltip
   etrends.speciation.chart.tooltip.data.units=speciationConfig.concentrations.units;
   etrends.speciation.chart.tooltip.data.digits=speciationConfig.concentrations.digits;

//hacky way to Disable the vertical line thing by over riding 
  etrends.speciation.chart.addVerticalLine = function () {};
  
  etrends.speciation.chart.drawPaths = function () {
    //Get the max number of bars do bars are proper width if missing bars (can't use data.length to get bar width if missing bars)
    var xd = this.getXdomain(this);
    var maxBarCount = xd[1] - xd[0] + 1;
    etrends.speciation.chart.drawBars(1,maxBarCount);
  };
  //instead of running makeChart run custom transition stuff when toggling show Percent
  etrends.speciation.chart.toggleYdomainToPercentMakeChart = function () {
    this.setUpYaxis();
    this.addAxes();
    this.drawBarsHeightsAndPosition(true);
  };
  
   etrends.speciation.chart.ytitle.text='Concentration';
   etrends.speciation.chart.ytitle.units='\u03BCg/m\u00B3';
   etrends.speciation.chart.xField = "year";
   etrends.speciation.chart.yField = "SumOfSpecies";
//This will get the domain when called using the data
   etrends.speciation.chart.getXdomain =  null; //use the default x domain which is max min of x field
   etrends.speciation.chart.getXdomain =  function () {
     //Use the default x domain which is min max of data but add some extra on both sides so x ticks aren't against y axis
//     var xd = etrends.speciation.chart.getXdomainDefault(etrends.speciation.chart);
     var xd = this.getXdomainDefault(this);
     xd[0] -= .5;
     xd[1] += .5;
     return xd;
   };
   //note had to multiply d.p10 and d.p90 by 1 so that it would convert string to number for finding min/max
   //also min/max could possible be national standard 
//Set the step between ticks or tick size
    etrends.speciation.chart.xTickSize = 2;
   
//use the getYdomainForSumOfSeries function on LineAreaChart
   etrends.speciation.chart.getYdomain =  function (self) {
    return self.getYdomainForSumOfSeries();
   };

   etrends.speciation.chart.getYdomainBar =  function (self) {
     //if using percent for Y domain/axis then just return [0,1]
//    if (self.convertYdomainToPercent) return [0,1];

    //Get only visible items in series
    var visibleSeries = self.series.filter(function (item) {return item.hidden!==true});
    //Just use whatever domain was last if nothing visible. if not ydomain just use full series
    if (visibleSeries.length<1) {
      if (this.yDomain) return this.yDomain;
      visibleSeries = self.series;
    }
     var firstSeries = firstSeries = visibleSeries[0].name;

      //Have to get update the SumOfSeries in case visibility of series changed
      self.getSumOfSeries(self.data,visibleSeries)

      var min = d3.min(self.data, function (d) {
        var yFirstSeries = d[firstSeries];
//Note only return truthy or zero otherwise it is null and ignored
        if (!(yFirstSeries || yFirstSeries===0)) return null;

        if (self.convertYdomainToPercent) yFirstSeries = 100*yFirstSeries/d.SumOfSeries;
//Note only return truthy or zero otherwise it is null and ignored
        return yFirstSeries;
      });   
//      var max = d3.max(self.data, function (d) { 
//Note only return truthy or zero otherwise it is null and ignored
//        return (d.SumOfSpecies || d.SumOfSpecies===0) ? 1*d.SumOfSpecies : null ; });

      var max = d3.max(self.data, function (d) { 
//if using percent max will always be 1        
        if (self.convertYdomainToPercent) return 100;
//Note only return truthy or zero otherwise it is null and ignored
        return (d.SumOfSeries || d.SumOfSeries===0) ? 1*d.SumOfSeries : null ; 
      });

//have the range between min and max +/- some percent of range. Also make sure min is always >= 0
     if (min==max) {min=0} //this in case only one data point
     return [Math.max(0,min - .1*(max-min)), max + .1*(max-min)]
    };
}

  function makeSeasonTabs(SiteID) {
    var chart = etrends.speciation.chart;
    if (! chart.tabs) chart.tabs = {};
    chart.tabs.tabs = d3.select("#" + chart.domID + "-tabs ul");

    var SiteData = speciationConfig.concentrations.data[SiteID];

    //Get the seasons for this site
    var seasons = Object.keys(SiteData).filter(function (s) {
      return SiteData[s] && SiteData[s].length>0;
    }).sort();

    if (seasons.length==0) return null;

    var click = function (season) {
        chart.data = speciationConfig.concentrations.data[SiteID][season];
        chart.export.fileName = 'speciationData_' + SiteID + '_' + season;
        chart.makeChart(chart.data);      
    };

    etrends.library.utilities.makeTabs(chart.tabs.tabs,seasons,click);

    //Return the current season which is first tab
    return seasons[0];
  }

  function makeSpeciationLayer(config,callback) {
  //  console.log('begin with conc layer');
    var args = {};
    args.file = config.file;
    args.done = function (data) {
//testing effect of number of points on rendering speed
//          data = data.slice(0,10);

      etrends.speciation.map.plotPoints(data,config.symbology);    
    };  
    etrends.library.utilities.loadMapOrGraph(args,callback);
  }
  
  etrends.speciation.map.externalMouseOver = function (locationData) {
  //Make this a deferred function so that positioning tooltip won't occur until after chart loaded
    var defer = $.Deferred();
  //init chart after tooltip is showing other wise chart HTML is not rendered from map tooltip template yet
    initChart();
    
  //  return etrends.speciation.map.externalMouseOverLines(locationData);
  //this is run in context of concentrationChart
    var chart = etrends.speciation.chart;
  //Have to turn the resize debouncer back on in case they closed tooltip
    chart.resizeDebouncer.set();

  //have to persist    
  //Have to load the data from either file or from cache before chart can be made for this location
    var args = {};
    args.file = speciationConfig.concentrations.folder + '/' + locationData.site_id + '.json';
    args.cache = speciationConfig.concentrations.data;
    args.key = locationData.site_id;
    //function to call when data loaded  
    args.done = function () {
  //make the season tabs now. some might be hidden if they have no data
  //if not tooltip showing then don't try to show chart either. errors out
      var currentSeason = makeSeasonTabs(locationData.site_id);
      if (currentSeason && etrends.speciation.map.tooltip.currentHoverPoint ) {      
        $("#speciation-chart-container").show();      
        if (!etrends.speciation.map.tooltip.maximizeOnly && !etrends.speciation.map.tooltip.minimizeOnly) {
           $("#speciation-map-tooltip .etrends-tooltip-maximize").show();      
        } 
      }else {
        $("#speciation-chart-container").hide();
        $("#speciation-map-tooltip .etrends-tooltip-maximize").hide();
        defer.resolve(); 
        return;
      }

  //Now that data is retrieved either from file or cache assign chart.data and make chart
      chart.data = speciationConfig.concentrations.data[locationData.site_id][currentSeason];
      chart.title.text = speciationConfig.title + "<br/><span class='etrends-chart-title-subtitle'>Site ID: " + locationData.site_id + "</span>" || "nbsp;"; //If no site name use nbsp so just empty line at top with menu
      chart.title.autoWrap = true;
      //This to set whether SVG or HTML title. NOTE: Using HTML title will break export PNG and print
      //If you don't want to export you could use HTML is SVG didn't support some formatting you need
      chart.title.useSVG = true;
      chart.title.spacing = 0; //No space between lines in title

      //Have to set chart.visible now when so chart will not try to be drawn when hidden. breaks stuff
      chart.visible = true;
      chart.makeChart(chart.data);

      //Set the name of the csv file in here after the chart (and menu) is created
      chart.export.fileName = 'speciationData_' + locationData.site_id + '_' + currentSeason;
      
      defer.resolve(); 
    };
    
    etrends.library.utilities.loadMapOrGraph(args);

    return defer.promise();
  };


  etrends.speciation.map.externalMouseOut  = function (locationData) {
      //Have to set chart.visible now when so chart will not try to be drawn when hidden. breaks stuff
    if (etrends.speciation.chart) etrends.speciation.chart.visible = false;

  };

  etrends.speciation.map.tooltip.onMaximize  = function () {
  //this is run in context of concentrationChart
    var chart = etrends.speciation.chart;

  //Don't want to permanently alter the cell resizes
    var factor = 2;
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

  etrends.speciation.map.tooltip.onMinimize  = function () {
  //this is run in context of concentrationChart
    var chart = etrends.speciation.chart;

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
  
};
//# sourceURL=speciation.js