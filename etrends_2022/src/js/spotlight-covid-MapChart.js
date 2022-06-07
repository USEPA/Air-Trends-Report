//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.spotlight.covid
if (! etrends) var etrends = {};
if (! etrends.spotlight) etrends.spotlight = {};
if (! etrends.spotlight.covid) etrends.spotlight.covid = {};
if (! etrends.spotlight.covid.concentrations) etrends.spotlight.covid.concentrations = {};

//This is a function that is called to create the naaqs stuff.
//The execution can be delayed until some setup stuff is done, ie download US map that will be reused
etrends.spotlight.covid.init = function (D3QueueCallback) {
  var defaultMinYear = 0;
	var yearRange = [defaultMinYear,91];
  var startDate = '3/1/2020';
  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 20;
  var pollutantDropdown = d3.select("#spotlight-covid-pollutant-dropdown").node(); 
  var currentPollutant = pollutantDropdown.options[pollutantDropdown.selectedIndex].value || 'ozone';
  var showAllSites = false;
  
//   currentPollutant = 'co';
	var autoPlay = false;

//This is place to store downloaded data so we don't have to keep hitting server
  var concentrationCache = {};
  //store the decadal stuff that varies with date but not site
  var concentrationDecadeStore;
//This is place to store summary stat information once it is calculated
  var summaryStats = {};

//Indicates whether the map needs to be preloaded
  var preLoadMaps = false;

//Place to stash symboloy info    
  pollutantSymbology = {
    colors:[
    //d3.rgb(13,47,140), //#0D2F8C midnight blue
	//d3.rgb(39,107,191), //#276BBF steel blue
	//d3.rgb(196,232,176), //#C4E8B0 pale goldenrod
	//d3.rgb(255,255,204) //#FFFFCC lemon chiffonFFF   
    d3.rgb(0,0,139), //#00008b dark blue
    d3.rgb(37,116,169), //#2574a9 steel blue
    d3.rgb(167,65,101), //#a74165 indian red
    d3.rgb(178,0,253) //#B200FD dark violet
    ]
//Note have to set the width and height since FF adds stroke for width but Chrome doesn't
//Also weird is that size on screen is about 1.25 bigger than what svg says eg. circle with dia=30 has dia=38 when measured on screen.
//But IE doesn't seem to be affected by this 1.25 effect
//I think this is because I have my fonts set to be 1.25 bigger and that affects svg
    ,symbols:[
      {id:'circle-thin-double-left',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-single-left',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-single-right',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'circle-thin-double-right',offsetx:-2,offsety:-2,width:28,height:28}
    ]    
//Mabye can try out simpler symbols to go faster. Didn't seem to work though
//Makes me think it is the way we are drawing symbols (cloning from dom and adding to group)
//Maybe need to explicity draw symbol with d3?
    ,symbolsTest:[
      {id:'2circle-thin-double-left',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'2circle-thin-single-left',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'2circle-thin-single-right',offsetx:-2,offsety:-2,width:28,height:28},
      {id:'2circle-thin-double-right',offsetx:-2,offsety:-2,width:28,height:28}
    ]    
  };

//Set up the Map parameters for each pollutant  
  var pollutantData = {};

//Note used unicode characters to get subscripts for svg in charts  
  pollutantData.ozone = {file:"spotlight_ozone.csv",fileDecade:"spotlight_ozone_10yrstats.csv",title:"Ozone 8-hour Concentration",standard:.07,units:"ppm",digits:3,pollutantLabel:"Ozone",usedInNatAggRange:[0,91]}
  pollutantData.ozone.breaks = [.04,.054,.070];
  pollutantData.ozone.truncatedDecimals = 3;  

  pollutantData.no2 = {file:"spotlight_no2.csv",fileDecade:"spotlight_no2_10yrstats.csv",title:"NO\u2082 1-hour Concentration",standard:100,units:"ppb",digits:0,pollutantLabel:"NO\u2082 Annual",usedInNatAggRange:[0,91]}
  pollutantData.no2.breaks = [20,53,100];  
  pollutantData.no2.truncatedDecimals = 0;  

  var naaqsMap = new ClassifiedPointsMap("spotlight-covid-map");
  naaqsMap.hideEmptyActiveAttributes = true;
  naaqsMap.disableMapLegendAutoScaling = true;

  naaqsMap.pointSize=9;
  naaqsMap.namespace = "etrends.spotlight.covid.concentrations.map";
  naaqsMap.topojson = topojson;
//This variation is needed if map div is relative so that tooltip calculation will use relative calculations
  naaqsMap.useRelativeTooltip=true;
//Have to set the Lat and Long column names since they changed
  naaqsMap.latitudeField = "latitude";
  naaqsMap.longitudeField = "longitude";
  
  naaqsMap.title.text = pollutantData[currentPollutant].title || "nbsp;";
  naaqsMap.export.hardcodedDownloadPath = "data/spotlight/concentrations/" + pollutantData[currentPollutant].file;

  naaqsMap.init();

//Current Pollutant might have a different min Year then normal like PM 2.5
  yearRange[0]=pollutantData[currentPollutant].minYear || defaultMinYear;
    
  naaqsMap.activeAttribute = "day" + yearRange[0];
  naaqsMap.tooltip.data = {year: yearRange[0],
    pollutant: pollutantData[currentPollutant].pollutantLabel,
    units: pollutantData[currentPollutant].units,
    pollutantDigits: pollutantData[currentPollutant].digits}; 
  naaqsMap.tooltip.data["f.isHidden"] = function (value) {return value ? "" : "hidden"}; 
//Missing values should say NoData not NaN
   naaqsMap.tooltip.data["f.isMissing"] = function (value) {
     return (value || (value!=="" && value==0)) ? value : "No Data / Incomplete";}; 

//resize charts after map resizes so that we can fit chart heights to map height
  naaqsMap.externalResize = function (args) {
    var fromPlotPoints = false;
    if (args && args.caller=="plotPoints") fromPlotPoints = true;
    //kind of hacky but if there is no data in charts then it means chart hasn't been created yet
    //This will happen on initial load of map because map is resized in plotPoints function and chart isn't created until after map loaded
    //When actually resize the chart data should be in there
    //Hacky but have to actual pass that caller is plotPoints because when switching pollutants chart drawn and data is there and don't want to draw chart twice
    if (concentrationChart.data && !fromPlotPoints) {
      concentrationChart.makeChart();
      fitChartHeightToMapHeight();
    }
  };

  naaqsMap.export.fileName = 'Spotlight-Covid-Map-' + yearRange[0];

//function that draws selectedSite time series on chart when hovering point  
    naaqsMap.externalMouseOver = naaqsMap_externalMouseOver;
    naaqsMap.externalMouseOut = naaqsMap_externalMouseOut;

//Add custom control to map export menu
  naaqsMap.export.tooltip.customRender = function () {
    var templateElement = $("#spotlight-covid-map-menu-tooltip-template-customControls");
    var template = "";
    if (templateElement.length>0) template = templateElement.text();
    naaqsMap.export.tooltip.div.select(".customControls").html(template)
    $(".naaqs-map-menu-tooltip-showAllSites").attr("checked",showAllSites);
  };

  //try to always have tooltip as max for phones. Might not hang them
  if (isMobile.any) {
    naaqsMap.tooltip.maximizeOnly = true;
  }

 //set up debouncer for active attribute change. drawing map is slow now with svg symbols
  var changeActiveAttributeDebouncer = new MapChartDebounce(0);
 
//   var concentrationChart = new ConcentrationLineAreaChart();
//Note: need to pass the chart custom tooltip class because there are 2 tooltips on chart (another on legend)
   var concentrationChart = new LineAreaChart("spotlight-covid-concentrations-chart",125,.25,null,"#spotlight-covid-concentrations-chart-tooltip"); //passing the min height for the chart; 

   concentrationChart.margin.top = 10;
   concentrationChart.useTransitions = false;
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   concentrationChart.useRelativeTooltip=true;
   concentrationChart.tooltip.data = {units: pollutantData[currentPollutant].units};
   concentrationChart.tooltip.data["f.isHidden"] = function (value) {return value ? "" : "hidden";}; 
//Missing values should say NoData not NaN
   concentrationChart.tooltip.data["f.isMissing"] = function (value) {return (value || (value!=="" && value==0)) ? value : "No Data / Incomplete";}; 


   concentrationChart.ytitle.text='Concentration (' + pollutantData[currentPollutant].units + ')'
   concentrationChart.xField = "year";
   concentrationChart.yField = "avg";
//This will get the domain when called using the data
   concentrationChart.getXdomain =  null; //use the default x domain which is max min of x field
   //note had to multiply d.p10 and d.p90 by 1 so that it would convert string to number for finding min/max
   //also min/max could possible be national standard 
//Set the step between ticks or tick size
    concentrationChart.xTickSize = xTickSize;
    concentrationChart.tickFormat = function (days) {
      return etrends.library.utilities.addDays(startDate,days).toLocaleDateString();
    };
//convert integer day to date
    concentrationChart.tooltip.data["f.getDate"] = concentrationChart.tickFormat; 
    concentrationChart.tooltip.data["f.getDecadeField"] = function (day,field) {
      if (!concentrationDecadeStore) return;
      return concentrationDecadeStore[day][field];
    }; 
    

   concentrationChart.getYdomain =  function (self) {
     var min = self.standard;
     var max = self.standard;
     if (self.data.length > 0 && "selectedSite" in self.data[0]) {
       min = Math.min(min,d3.min(self.data, function (d) {          
//Note only return truthy or zero otherwise it is null and ignored
         return (d.selectedSite || d.selectedSite===0) ? 1*d.selectedSite : null ; }));
       max = Math.max(max,d3.max(self.data, function (d) { 
//Note only return truthy or zero otherwise it is null and ignored
         return (d.selectedSite || d.selectedSite===0) ? 1*d.selectedSite : null ; }));
     }
     //If using non default range in nat agg then get max min from that range
     var data = self.data;

     if (etrends.library.utilities.isNumeric(self.dragBarMin)) {
      data = self.data.filter(function (d) {
        return d.year>=self.dragBarMin;
      });
     }
    
    min = Math.min(min,d3.min(data, function (d) { return 1*d.p10; }));
    max = Math.max(max,d3.max(data, function (d) { return 1*d.p90; }))

     //also check max min of decadal high low
     if (concentrationDecadeStore) {
      min = Math.min(min,d3.min(data, function (d) { 
        return 1*concentrationDecadeStore[d.year].low; }));
      max = Math.max(max,d3.max(data, function (d) { 
        return 1*concentrationDecadeStore[d.year].high; }));
     }
//have the range between min and max +/- some percent of range. Also make sure min is always >= 0
     return [Math.max(0,min - .1*(max-min)), max + .1*(max-min)]
    };

//just for convenience define these monster functions at the bottom   
  concentrationChart.drawPaths = concentrationChart_drawPaths;
 //Let's get the auto legend to work here
//  concentrationChart.addLegend = concentrationChart_addLegend;

  concentrationChart.baseClass = "naaqs-concentrations-chart-";
  concentrationChart.namespace = "etrends.spotlight.covid.concentrations.chart";

  concentrationChart.addSeriesField('name',['decadeHighLow','decadeAverage','percentile','average','selectedSite']);
  concentrationChart.addSeriesField('text',['2010-2019 High Low','2010-2019 Average','90%ile - 10%ile','National Average','Selected Site']);
  concentrationChart.addSeriesField('type',['rect','line','rect','line','line']);
//Use this if the columns or column names are different
  concentrationChart.export.exportColumns= ['avg','selectedSite','min','max','p10','median','p90'];
  //Could also change menu tooltip data to dynamically change filename
  concentrationChart.export.fileName = 'spotlight-covid-concentrations-data_' + currentPollutant;

  concentrationChart.legend.ncols = null;
  concentrationChart.legend.cellWidth = 25;
  concentrationChart.legend.cellHeight = 25;
  concentrationChart.legend.cellSpacingX = 15; 
  concentrationChart.legend.AllowHiddenSeries = false;
  concentrationChart.legend.externalAddLegend = concentrationChart_externalAddLegend;

  //Don't have chart resize automatically. manually triger when map resizes
  concentrationChart.resize = function () {};

//class that will help calculate stats. Use Sas5 percentiles
  var statsCalculator = new etrends.library.StatsCalculator(yearRange,'day','Sas5');


//Set up the slider

//  var naaqsSlider = new MapChartSlider("naaqsSlider",yearRange[0],yearRange[1],1,100,1,onSlide);
//Make full steps don't interpolate between values
  
  var naaqsSlider = new MapChartSlider("spotlight-covid-Slider",yearRange[0],yearRange[1],1,1,1,xTickSize,onSlide,concentrationChart.tickFormat);
//This will link chart to slider so chart can move slider
  concentrationChart.slider = naaqsSlider;
  
d3_queue.queue()
  .defer(makeUSmap,currentPollutant)
//for testing loading map only
//  .defer(makeUSmap,null)
  .await(function (error) {
    if (error) console.error(error);
    //Have to fit the chart to the map height. This will also be fired upon resize
    fitChartHeightToMapHeight();
    playMap();
    //This will let caller of init know naaqs has loaded
    if (D3QueueCallback) D3QueueCallback(error);
  });

console.log('end of spotlight covid ');

function onSlide(evt,value) {
//only change map if full year not in between ticks
    if (value==parseInt(value)) {
      naaqsSlider.currentValue = value; //save for playback
      var day = concentrationChart.tickFormat(value);
      d3.select('#spotlight-covid-Slider #sliderText').text(day);
      naaqsMap.tooltip.data.day = day;
//debounce the changing of acttribute because redrawing map is slow now with symbols
      changeActiveAttributeDebouncer.debounce(function () {
//        console.log(value);
        naaqsMap.changeActiveAttribute("day" + value);
      })();

//Take this out of the debouncer and the symbols will redraw immediately
//But the trade off now is that moving the slider is laggy which looks bad
//Not sure if somebody can really make sense of symbols redrawing immediately anyway when dragging slider fast
//But moving the slider and getting a lag is really annoying
//        naaqsMap.changeActiveAttribute("day" + value);

      naaqsMap.export.fileName = 'Spotlight-Covid-Map-' + value;
      
//        console.log("year "  + value);
//console.log("move line -> " + value);
//snap to wherever the slider is now when moving point
      concentrationChart.moveLine(parseInt(value));
    }
}

function makeUSmap(pollutant,callback) {
  var args = {};
  args.map = naaqsMap;
  //If they pass a pollutant then create makeLayers function to plot points  
  if (pollutant) {
    args.makeLayers = function (callback) {

      //actually plot points for all pollutants now so they are cached and fast when somebody goes in there
      if (!preLoadMaps) {
        makeConcentrationLayer(pollutant,callback);
      }else {
          d3.select("#spotlight-covid-container").style("pointer-events","none");
          d3.select("#spotlight-covid-container").style("opacity",.3);

        //get array of pollutants with current last
        pollutants = Object.keys(pollutantData).filter(function (item) {        
          return (item!=pollutant)
        });
        pollutants.push(pollutant);
        etrends.library.utilities.loopDeferSeries(pollutants,function (item) {
          console.log('defer loop item ' + item);
          //make sure active attribute is correct so year 2000 map draws without bunch of black dots
          naaqsMap.activeAttribute = "day" + (pollutantData[item].minYear || defaultMinYear);
          //don't pass the callback. execute the callback at the end
          return makeConcentrationLayer(item);          
        })
        .fail(function (error) {
          callback(error);
        })
        .then(function () {
          d3.select("#spotlight-covid-container").style("pointer-events","");
          d3.select("#spotlight-covid-container").style("opacity",1);
          preLoadMaps = false;
          callback(null);
        })
      }
    };
  }
  etrends.library.utilities.makeBaseMap(args,callback);
}

function makeConcentrationLayer(pollutant,callback) {
  //clear out decade stash
  concentrationDecadeStore = null;
  return etrends.library.utilities.catchPromise(getDecadeConcentrations)(pollutant)
    .then(function () {
        return  makeConcentrationLayerInner(pollutant,callback);
    });
}

function getDecadeConcentrations(pollutant) {
  //  console.log('begin with conc layer');
    var args = {};
    args.file = "data/spotlight/concentrations/" + pollutantData[pollutant].fileDecade;
    args.done = function (cacheData) {
      //only need to copy cached data if manipulating    
      var data = cacheData;
      //clear out decade stash
      concentrationDecadeStore = {};
      cacheData.forEach(function (row) {
        concentrationDecadeStore[row.day]  = row;
      });
    };
    
  //Note: pass cached info so we don't keep hitting server  
    args.cache = concentrationCache;
    args.key = pollutant + '_decade';
  
    //Just load the decade file for this pollutant
    return etrends.library.utilities.loadMapOrGraph(args);
  }
  
//This does the original stuff of makeConcentrationLayer
//But we wrapped it now so we can download the extra file
function makeConcentrationLayerInner(pollutant,callback) {
//I think i can  make this return a promise without messing up the d3 queue things
  var defer = $.Deferred();

//  console.log('begin with conc layer');
  var args = {};
  args.file = "data/spotlight/concentrations/" + pollutantData[pollutant].file;
  args.done = function (cacheData) {
    //only need to copy cached data if manipulating    
    var data = cacheData;
    var usedInNatAggRange = pollutantData[pollutant].usedInNatAggRange;    
    if (usedInNatAggRange) {
    //make copy of data and add trend and used_in_nat_agg
    //  data = $.extend(true,[],cacheData);
    //Not using copy of cached data anymore since other stuff like toggle all sites needs columns also and uses cached data
    //Just adding columns so should be ok
      var usedInNatAggRangeJoin = usedInNatAggRange.join('_');
      cacheData.forEach(function (row) {
        row.used_in_nat_agg = row['used_in_nat_agg_' + usedInNatAggRangeJoin] || 'No';
        row.trend = row['trend_' + usedInNatAggRangeJoin] || 'Undetermined/Insufficient Data';
      });
    }

//testing effect of number of points on rendering speed
//          cacheData = cacheData.slice(0,10);
    
    naaqsMap.tooltip.data.pollutant=pollutantData[pollutant].pollutantLabel; 
    naaqsMap.tooltip.data.units=pollutantData[pollutant].units;
    naaqsMap.tooltip.data.pollutantDigits= pollutantData[pollutant].digits; 

//Use the breaks for this pollutant
    pollutantSymbology.breaks = pollutantData[pollutant].breaks;
    pollutantSymbology.truncatedDecimals = pollutantData[pollutant].truncatedDecimals;

    //plot the points after filtering out non stats sites if not showing all
    filterAndPlotPoints(data,pollutant);
    
//Now generate the summary stats for this pollutant if it doesn't exist
    if (! summaryStats[pollutant]) {
      //interpolate the data before generateing the stats
      //make sure the year range is correct. It might have changed
        statsCalculator.yearRange[0]=pollutantData[pollutant].minYear || defaultMinYear;

      var interpolatedData = statsCalculator.interpolateConcentrations(data,function (row) {return row['used_in_nat_agg']==="Yes";});
      summaryStats[pollutant] = statsCalculator.generateSummaryStats(interpolatedData);
    }
//    console.log(interpolateTimeSeries([null,5,null,7,null]));

    makeConcentrationGraph(pollutant);
    defer.resolve();
  };

//Note: pass cached info so we don't keep hitting server  
  args.cache = concentrationCache;
  args.key = pollutant;

  //Have to create new deferCallback so that errors passed to this callback from  loadMapOrGraph will be passed defer.reject
  var deferCallback = function (error,result) {
    if (error) {
      if (callback) callback(error);
      return defer.reject(error);
    } 
    //Now we can execute the original callback that was passed
    if (callback) callback(null,result);
    //probably don't need this since it will be resolved in done function
    defer.resolve();
  }
  //pass this the deferCallback created above so that errors passed to this callback will be passed defer.reject
  etrends.library.utilities.loadMapOrGraph(args,deferCallback);
  return defer.promise();
}

function filterAndPlotPoints(cacheData,pollutant) {
//If showAllSites is not true then fiilter out sites that aren't used in national stats
    if (showAllSites) {
      var data = cacheData;
    } else {
      //var startDateDebug = new Date();
      var data = cacheData.filter(function (row) {
        return row['used_in_nat_agg']==="Yes";        
      });
      //var endDateDebug = new Date();
      //console.log("Filter Data Elapsed ms: " + (startDateDebug.getTime()-endDateDebug.getTime()));      
    }
//pass pollutant now so that map layers are cached for each pollutant to speed up rendering
    var startDateDebug = new Date();
    naaqsMap.plotPoints(data,pollutantSymbology,pollutant);
    var endDate = new Date();
    console.log("Plot Points Elapsed ms: " + (startDateDebug.getTime()-endDate.getTime()));
    console.log('done with conc layer ' + pollutant);
}
//A way to toggle 
function toggleAllSites(showAll) {
  //wrap this in timeout so it doesn't hang the caller
  setTimeout(function () {
    //set the global variable in here for future 
    showAllSites = showAll
    //reset the points cache so we can draw new set of points
    naaqsMap.pointsCache = {};
    var cacheData = concentrationCache[currentPollutant];

    //plot the points after filtering out non stats sites if not showing all
    filterAndPlotPoints(cacheData,currentPollutant);
  },0);
}
function makeConcentrationGraph(pollutant) {
//    console.log('begin with conc chart');
//summary stats were calculated when concentation layer was read in   
    concentrationChart.data = summaryStats[pollutant];
    concentrationChart.standard = pollutantData[pollutant].standard;
    
    concentrationChart.title.text = pollutantData[pollutant].title;
    concentrationChart.ytitle.text='Concentration (' + pollutantData[pollutant].units + ')';
    concentrationChart.tooltip.data.pollutantDigits= pollutantData[pollutant].digits;
    concentrationChart.tooltip.data.units = pollutantData[currentPollutant].units;
    
    concentrationChart.makeChart();
//    console.log('done with conc chart');
}

function playMap(error)  {
    if (error) {
      console.error("Error loading charts: ");
      console.error(error);
      return;
    }      
  
    naaqsSlider.moveSlider(naaqsSlider.currentValue);

    if (autoPlay===true) naaqsSlider.play();
} 

function switchPollutant(pollutant) {
  //By setting a timeout with zero delay it keeps dropdopwn from hanging
  //Seems to speed things up a bit too but might be coincidence or psychological
  setTimeout(function () {
//save this globally so that it can be used later
  currentPollutant = pollutant;
//  setMapTitle(pollutant);
  etrends.spotlight.covid.concentrations.map.title.draw(pollutantData[currentPollutant].title || "nbsp;");
  etrends.spotlight.covid.concentrations.map.export.hardcodedDownloadPath = "data/spotlight/concentrations/" + pollutantData[currentPollutant].file;
  etrends.spotlight.covid.concentrations.chart.export.fileName = 'spotlight-covid-concentrations-data_' + currentPollutant;
  //Check if we need to add a minium to national stats eg. Lead
    if (pollutantData[currentPollutant].usedInNatAggRange) {
      etrends.spotlight.covid.concentrations.chart.dragBarMin=pollutantData[currentPollutant].usedInNatAggRange[0]; 
    } else {
      etrends.spotlight.covid.concentrations.chart.dragBarMin=null;
    }      

  //If changing limit of dragBar eg. Lead then change start of slider
  if (pollutantData[pollutant].usedInNatAggRange && naaqsSlider.currentValue<etrends.spotlight.covid.concentrations.chart.dragBarMin) naaqsSlider.currentValue=etrends.spotlight.covid.concentrations.chart.dragBarMin;
  
//minYear must be passed to make charts if it is on pollutant
  var minYear=pollutantData[pollutant].minYear || defaultMinYear;
    
//if minYear set on pollutant and it changed then redraw slider 
  if (yearRange[0] !== minYear) {
    yearRange[0]=minYear;
    
    naaqsSlider.refresh(yearRange[0],yearRange[1],1,1,1);
//if currentValue is less then make it minYear and move slider to currentValue after re draw of slider    
    if (naaqsSlider.currentValue<minYear) naaqsSlider.currentValue=minYear;
  }

//hide the open tooltip when the pollutant switches
  etrends.spotlight.covid.concentrations.map.closeToolTip();
  
//Make maps and charts  async  
    var startDateDebug = new Date();

  d3_queue.queue()
    .defer(makeConcentrationLayer,pollutant)
    .await(function () {
    var endDate = new Date();
    console.log("Switch Pollutants Elapsed ms: " + (startDateDebug.getTime()-endDate.getTime()));
//Wait to move the slider until everything is drawn so that things are in correct places
//Also make sure the currentValue is an integer so we are not starting partway through step
      naaqsSlider.moveSlider(parseInt(naaqsSlider.currentValue));
//      console.log("pollutant swtiched");
      });

  },0)
} 


function setMapTitle() {
    var mapTitle = d3.select("#spotlight-covid-map-title-label");
    mapTitle.html(pollutantData[currentPollutant].title);
    mapTitle.style("font-size","");
    var maxFontSize = parseInt(mapTitle.style("font-size"));
    var available = $("#spotlight-covid-map-title").width() - 3.5 * $("#spotlight-covid-map-home").width();
    var scale = Math.max(1,$("#spotlight-covid-map-title-label").width() / available);
    mapTitle.style("font-size",maxFontSize/scale + "px");
}

function naaqsMap_externalMouseOver(selectedSiteData) {  
//this is run in context of concentrationChart
    var self = concentrationChart;
  //Try to use a timeOut so that the tooltip is actually hidden while chart is redrawing. slow on iPhone.
  setTimeout(function () {

    self.data.forEach(function (item,index) {
      self.data[index].selectedSite = selectedSiteData["day" + item.year];
    });
     
    self.selectedSiteLine = d3.svg.line()
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.selectedSite!==""      
    .defined(function(d) { return (d.selectedSite || (d.selectedSite!=="" && d.selectedSite==0)) ? true : false; })
    .x(function (d) { return self.xScale(d.year); })
    .y(function (d) { return self.yScale(d.selectedSite); });    

   self.makeChart();

    self.export.fileName = 'spotlight-covid-concentrations-data_' + currentPollutant + '_' + selectedSiteData['site_id'];

//refresh the tooltip to show the data for the hovered map location in there
//easiest way to do this is just run the moveline function again for the current x value
    self.moveLine(self.currentX);
  },0);
}

function concentrationChart_drawSelectedSiteLine() {
//this is run in context of concentrationChart
    var self = concentrationChart;

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

function naaqsMap_externalMouseOut(d) {
  var self = concentrationChart;
  //Try to use a timeOut so that the tooltip is actually hidden while chart is redrawing. slow on iPhone.
  setTimeout(function () {
    self.selectedSiteLine = null;
    if (self.selectedSiteLineElement) self.selectedSiteLineElement.remove();
    if (self.selectedSiteLinePoints) self.selectedSiteLinePoints.remove();
  //remove selected site data so it won't be on tooltip
    self.data.forEach(function (item,index) {
  //    self.data[index].selectedSite = null;
  //delete actual attribute so that null is not suse to min y min/max
      delete self.data[index].selectedSite;
    });
    self.svg.datum(self.data);
    
    self.makeChart(self.data);
    
  //refresh the tooltip to NOT show the data for the hovered map location in there
  //easiest way to do this is just run the moveline function again for the current x value
    self.moveLine(self.currentX);
  //Clear out site ID now that site is not on chart
      self.export.fileName = 'spotlight-covid-concentrations-data_' + currentPollutant;
  },0);
}

  function concentrationChart_drawPaths() {
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
    
      //Draw standard
      self.standardLine = d3.svg.line()
    //    .interpolate('basis')
        .x(function (d) { return self.xScale(d.year); })
        .y(function (d) { return self.yScale(self.standard); });
      
    //Draw 2010-2019 average
    if (concentrationDecadeStore) {
      self.decadeAverageLine = d3.svg.line()
          .x(function (d) { return self.xScale(d.year); })
          .y(function (d) { return self.yScale(concentrationDecadeStore[d.year].average); });

      self.decadeHighLowArea = d3.svg.area()
      //    .interpolate('basis')
          .x (function (d) { 
            return self.xScale(d.year); })
          .y0(function (d) { 
            return self.yScale(concentrationDecadeStore[d.year].high); })
          .y1(function (d) { 
            return self.yScale(concentrationDecadeStore[d.year].low); });
      
    }


      self.svg.datum(self.data);

      if (concentrationDecadeStore) {
        self.svg.append('path')
        .attr('class', 'etrends-chart-area etrends-chart-area-decadeHighLow')
        .attr('d', self.decadeHighLowArea)
        .attr('clip-path', 'url(#rect-clip)');  
      }

      self.nationalStatsPaths = self.svg.append('g');
      //If wanting to minimize the national stats it will be triggered by self.dragBarMin
      if (etrends.library.utilities.isNumeric(self.dragBarMin)) {
        self.nationalStatsPaths.datum(self.data.filter(function (d) {return d.year>=self.dragBarMin}));
      } else {
        self.nationalStatsPaths.datum(self.data);
      }

      self.nationalStatsPaths.append('path')
        .attr('class', 'etrends-chart-area etrends-chart-area-percentile-overlay')
        .attr('d', self.percentileArea)
        .attr('clip-path', 'url(#rect-clip)');
    
      self.nationalStatsPaths.append('path')
        .attr('class', 'etrends-chart-line-average')
        .attr('d', self.averageline)
        .attr('clip-path', 'url(#rect-clip)');
    
      self.svg.append('path')
        .attr('class', 'etrends-chart-line-standard')
        .attr('d', self.standardLine)
        .attr('clip-path', 'url(#rect-clip)');

      if (concentrationDecadeStore) {
          self.svg.append('path')
        .attr('class', 'etrends-chart-line-decadeAverage')
        .attr('d', self.decadeAverageLine)
        .attr('clip-path', 'url(#rect-clip)');
      }
        

    //DraW label for standard
      self.svg.append("text")
    //        .attr("x", this.chartWidth/2) 
    //self.chartWidth
            .attr("x", self.chartWidth - 20*self.percentSize)
            .attr("y", self.yScale(self.standard) - 10 *self.percentSize )
            .attr("text-anchor", "end")  
            .style('font-weight','600')
            .style("font-size", ".75em") 
            .attr('class', 'etrends-chart-line-standard-label')
            .text("Most Recent National Standard");    
            
//Now draw the selectedSite line if it is showing
      if (self.selectedSiteLine)  concentrationChart_drawSelectedSiteLine();            
    };

function concentrationChart_externalAddLegend() {
  var self = this;
  //Now do some custom stuff ie. add percentile tooltip
  var legPercentileTip = new MapChartTooltip(self.host,"#spotlight-covid-concentrations-chart-percentile-tooltip");  
  legPercentileTip.offset = {x:15,y:-10};

  //Percentile box is first in series. Maybe should key items by series name
  var legPercentileBox = self.items.percentile.rect;

//Don't pass any data to the tooltip. Just use the hardcoded message
  legPercentileBox.on('mouseenter', function () {
                concentrationChart.tooltip.disable=true; //disable the normal tooltiop until we mouse out of legend 
                legPercentileTip.showToolTip(null,this);
                concentrationChart.hideToolTip(); //when legend tooltip shows up hide graph tooltipo and vice versa
              }).on('mouseleave', function () {
                concentrationChart.tooltip.disable=false; //enable the normal tooltip since we moused out of legend 
                legPercentileTip.hideToolTip();
//Don't need to do this anymore since percentile hover doesn't coinicide with vertical bar hover
//                concentrationChart.showToolTip();
              });
}
 
  function fitChartHeightToMapHeight() {
    //if phone don't ever entertain this becuase won't have 2 columns
    if (isMobile.any) return;
    //Note this is only done if there is 2 column bootstrap layout otherwise set overrideHeight to null to go back to normal
    if ($(window).width()<975) {
      concentrationChart.overrideHeight = null;
    } else {

      //Get the amount of extra height between charts and map. Note use outerHeight because it includes padding
      var extra = $("#spotlight-covid-charts-container").outerHeight() - $("#" + naaqsMap.containerID).outerHeight();
      //Just add  the extra amount to concentrations since we don't have emissions
      concentrationChart.overrideHeight = concentrationChart.chartHeight - extra;

      concentrationChart.makeChart();
    }
  }  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.spotlight.covid  object if neccesary but this should work for now.
//But turns out made re using naaqs for the spotlight stuff a bit easier!
  etrends.spotlight.covid.concentrations.switchPollutant=switchPollutant;
  etrends.spotlight.covid.concentrations.fitChartHeightToMapHeight=fitChartHeightToMapHeight;
  etrends.spotlight.covid.concentrations.toggleAllSites=toggleAllSites;
  etrends.spotlight.covid.concentrations.map=naaqsMap;
  etrends.spotlight.covid.concentrations.chart=concentrationChart;
};
//# sourceURL=spotlight-covid-MapChart.js