//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.naaqs) etrends.naaqs = {};
if (! etrends.naaqs.concentrations) etrends.naaqs.concentrations = {};
if (! etrends.naaqs.emissions) etrends.naaqs.emissions = {};

//This is a function that is called to create the naaqs stuff.
//The execution can be delayed until some setup stuff is done, ie download US map that will be reused
etrends.naaqs.init = function (D3QueueCallback) {
  var defaultMinYear = 1990;
	var yearRange = [defaultMinYear,2018];
  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 5;
  var pollutantDropdown = d3.select("#naaqs-pollutant-dropdown").node(); 
  var currentPollutant = pollutantDropdown.options[pollutantDropdown.selectedIndex].value || 'co';
  var showAllSites = false;
  
//   currentPollutant = 'co';
	var autoPlay = false;

//This is place to store downloaded data so we don't have to keep hitting server
  var concentrationCache = {};
  var emissionsCache = {};
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

  pollutantData.co = {file:"euninterp42101MAX2Vmasterfile.csv",title:"CO 8-hour Concentration",standard:9,units:"ppm",digits:1,pollutantLabel:"CO",usedInNatAggRange:[1990,2018]}
  //pollutantData.co = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp42101MAX2V19902016.csv",title:"CO 8-hour Concentration",standard:9,units:"ppm",digits:1,pollutantLabel:"CO"}
  pollutantData.co.breaks = [4.4,9.4,12.4];  
  pollutantData.co.truncatedDecimals = 1;  
  pollutantData.co.emissions = [{file:"co.csv",title:"CO Emissions"}];

//Note used unicode characters to get subscripts for svg in charts  
  pollutantData.pb = {file:"euninterp14129RQMAXmasterfile.csv",title:"Pb 3-month Concentration",standard:.15,units:"\u03BCg/m\u00B3",digits:2,pollutantLabel:"Lead",usedInNatAggRange:[2010,2018]}
  //pollutantData.pb = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp14129RQMAX19902016.csv",title:"Lead 3-month Concentration",standard:.15,units:"\u03BCg/m\u00B3",digits:2,pollutantLabel:"Lead"}
  pollutantData.pb.breaks = [.07,.15,1.0];  
  pollutantData.pb.truncatedDecimals = 2;  
//Old way of showing just text for lead emissions
//  pollutantData.pb.emissions = [{title:"Pb Emissions",altText:"As a result of the permanent phase-out of leaded gasoline, controls on emissions of lead compounds through EPA’s air toxics program, and other national and state regulations, airborne lead concentrations in the U.S. decreased 98 percent between 1980 and 2005.  After 2005, the EPA methodology for estimating lead emissions changed and is not comparable to the 2005 and earlier numbers.  Since 2008, emissions have continued to decrease by 23 percent from 2008 to 2014.  In the 2014 NEI, the highest amounts of Pb emissions are from Piston Engine Aircrafts, and Ferrous and Non-ferrous Metals industrial sources."}];
  pollutantData.pb.emissions = [{title:"Pb Emissions",altDiv:"#naaqs-emissions-lead-chart-container"}];
//Alternative function that will create custom bar chart for lead emissions  
  pollutantData.pb.emissions[0].altFunction = function () {
        //etrends.naaqs.emissions.lead.init was written using D3queue callback stuff instead of promises 
        return etrends.library.utilities.convertD3queueToPromise(function (callback) {
          if (!etrends.naaqs.emissions.lead.chart) {
            etrends.naaqs.emissions.lead.init(callback);
          } else {
            callback(null);
          }
        }).then(function () {
          console.log('After lead init')      
          //Turn off the stock emissions chart so it doesn't break on resizing
          etrends.naaqs.emissions.chart.visible = false;
          //Lead was turned off when not showing because resizing would cause errors. Turn it on here
          etrends.naaqs.emissions.lead.chart.visible=true;
          //Set this so we know what chart to resize later to fit map height
          etrends.naaqs.emissions.currentChart = etrends.naaqs.emissions.lead.chart;
          //Fit the chart to the map height now because it might be different height than line area charts
          fitChartHeightToMapHeight();      
        });
    };     

//Note used unicode characters to get subscripts for svg in charts  
  pollutantData.no2_mean = {file:"euninterp42602AMEANmasterfile.csv",title:"NO\u2082 Annual Concentration",standard:53,units:"ppb",digits:0,pollutantLabel:"NO\u2082 Annual",usedInNatAggRange:[1990,2018]}
  //pollutantData.no2_mean = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp42602AMEAN19902016.csv",title:"NO\u2082 Annual Concentration",standard:53,units:"ppb",digits:0,pollutantLabel:"NO\u2082 Annual"}
  pollutantData.no2_mean.breaks = [26,53,100];  
  pollutantData.no2_mean.truncatedDecimals = 0;  
  pollutantData.no2_mean.emissions = [{file:"nox.csv",title:"NO\u2093 Emissions"}];
  
  pollutantData.no2_98 = {file:"euninterp42602P98Vmasterfile.csv",title:"NO\u2082 1-hour Concentration",standard:100,units:"ppb",digits:0,pollutantLabel:"NO\u2082 1-hour",usedInNatAggRange:[1990,2018]}
  //pollutantData.no2_98 = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp42602P98V19902016.csv",title:"NO\u2082 1-hour Concentration",standard:100,units:"ppb",digits:0,pollutantLabel:"NO\u2082 1-hour"}
//no2 same for both types
  pollutantData.no2_98.breaks = [53,100,360];
  pollutantData.no2_98.truncatedDecimals = 0;  
  pollutantData.no2_98.emissions = [{file:"nox.csv",title:"NO\u2093 Emissions"}];

  pollutantData.ozone = {file:"euninterp44201MAX4Vmasterfile.csv",title:"Ozone 8-hour Concentration",standard:.07,units:"ppm",digits:3,pollutantLabel:"Ozone",usedInNatAggRange:[1990,2018]}
  //pollutantData.ozone = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp44201MAX4V19902016.csv",title:"Ozone 8-hour Concentration",standard:.07,units:"ppm",digits:3,pollutantLabel:"Ozone"}
  pollutantData.ozone.breaks = [.054,.070,.085];  
  pollutantData.ozone.truncatedDecimals = 3;  
  pollutantData.ozone.emissions = [{file:"nox.csv",title:"NO\u2093 Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.pm10 = {file:"euninterp81102MAX2Vmasterfile.csv",title:"PM\u2081\u2080 24-hour Concentration",standard:150,units:"\u03BCg/m\u00B3 ",digits:0,pollutantLabel:"PM\u2081\u2080",usedInNatAggRange:[1990,2018]}
  //pollutantData.pm10 = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp81102MAX2V19902016.csv",title:"PM\u2081\u2080 24-hour Concentration",standard:150,units:"\u03BC g/m\u00B3 ",digits:0,pollutantLabel:"PM\u2081\u2080"}
  pollutantData.pm10.breaks = [54,154,254];  
  pollutantData.pm10.truncatedDecimals = 0;  
  pollutantData.pm10.emissions = [{file:"pm10.csv",title:"Direct PM\u2081\u2080 Emissions"}];

//  pollutantData.pm25_mean = {file:"1999-2015/pm25_mean.csv",title:"PM\u2082.\u2085 Annual Concentration (480 Sites)",standard:12,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 Mean",minYear:1999}
//Once I make the chart titles HTML I can use this so that subscripts work in IE 11 
  pollutantData.pm25_mean = {file:"euninterp88101WTDAMmasterfile.csv",title:"PM\u2082.\u2085 Annual Concentration",standard:12,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 Annual",minYear:2000,usedInNatAggRange:[2000,2018]}
  //pollutantData.pm25_mean = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp88101WTDAM20002016.csv",title:"PM\u2082.\u2085 Annual Concentration",standard:12,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 Annual",minYear:2000}
  pollutantData.pm25_mean.breaks = [6.0,12.0,35.4];  
  pollutantData.pm25_mean.truncatedDecimals = 1;  
  pollutantData.pm25_mean.emissions = [{file:"pm2_5.csv",title:"Direct PM\u2082.\u2085 Emissions"},{file:"so2.csv",title:"SO\u2082 Emissions"},{file:"nox.csv",title:"NO\u2093 Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.pm25_98 = {file:"euninterp88101P98Vmasterfile.csv",title:"PM\u2082.\u2085 24-hour Concentration",standard:35,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 24-hour",minYear:2000,usedInNatAggRange:[2000,2018]}
  //pollutantData.pm25_98 = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp88101P98V20002016.csv",title:"PM\u2082.\u2085 24-hour Concentration",standard:35,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 24-hour",minYear:2000}
//  pollutantData.pm25_98 = {file:"1999-2015/pm25_98.csv",title:"PM PM\u2082.\u2085 24-hour Concentration (480 Sites)",standard:35,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 98th",minYear:1999}

//pm 25 same for both types
  pollutantData.pm25_98.breaks = [12.0,35.4,55.4]
  pollutantData.pm25_98.truncatedDecimals = 1;  
  pollutantData.pm25_98.emissions = [{file:"pm2_5.csv",title:"Direct PM\u2082.\u2085 Emissions"},{file:"so2.csv",title:"SO\u2082 Emissions"},{file:"nox.csv",title:"NO\u2093 Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.so2 = {file:"euninterp42401P99Vmasterfile.csv",title:"SO\u2082 1-hour Concentration",standard:75,units:"ppb",digits:0,pollutantLabel:"SO\u2082",usedInNatAggRange:[1990,2018]}
  //pollutantData.so2 = {file:"https://www3.epa.gov/airtrends/data/concentrations/euninterp42401P99V19902016.csv",title:"SO\u2082 1-hour Concentration",standard:75,units:"ppb",digits:0,pollutantLabel:"SO\u2082"}
  pollutantData.so2.breaks = [35,75,185];  
  pollutantData.so2.truncatedDecimals = 0;  
  pollutantData.so2.emissions = [{file:"so2.csv",title:"SO\u2082 Emissions"}];

  var naaqsMap = new ClassifiedPointsMap("naaqs-map");
  naaqsMap.hideEmptyActiveAttributes = true;
  naaqsMap.disableMapLegendAutoScaling = true;

  naaqsMap.pointSize=9;
  naaqsMap.namespace = "etrends.naaqs.concentrations.map";
  naaqsMap.topojson = topojson;
//This variation is needed if map div is relative so that tooltip calculation will use relative calculations
  naaqsMap.useRelativeTooltip=true;
//Have to set the Lat and Long column names since they changed
  naaqsMap.latitudeField = "latitude";
  naaqsMap.longitudeField = "longitude";
  
  naaqsMap.title.text = pollutantData[currentPollutant].title || "nbsp;";
  naaqsMap.export.hardcodedDownloadPath = "data/naaqs/concentrations/" + pollutantData[currentPollutant].file;

  naaqsMap.init();

//Current Pollutant might have a different min Year then normal like PM 2.5
  yearRange[0]=pollutantData[currentPollutant].minYear || defaultMinYear;
    
  naaqsMap.activeAttribute = "val" + yearRange[0];
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
    if (concentrationChart.data && emissionChart.data && !fromPlotPoints) {
      concentrationChart.makeChart();
      if (pollutantData[currentPollutant].emissions.length>0) emissionChart.makeChart();
      fitChartHeightToMapHeight();
    }
  };

  naaqsMap.export.fileName = 'Naaqs-Map-' + yearRange[0];

//function that draws selectedSite time series on chart when hovering point  
    naaqsMap.externalMouseOver = naaqsMap_externalMouseOver;
    naaqsMap.externalMouseOut = naaqsMap_externalMouseOut;

//Add custom control to map export menu
  naaqsMap.export.tooltip.customRender = function () {
    var templateElement = $("#naaqs-map-menu-tooltip-template-customControls");
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
 
  makeEmissionTabs(currentPollutant);
  
//   var concentrationChart = new ConcentrationLineAreaChart();
//Note: need to pass the chart custom tooltip class because there are 2 tooltips on chart (another on legend)
   var concentrationChart = new LineAreaChart("naaqs-concentrations-chart",125,.25,null,"#naaqs-concentrations-chart-tooltip"); //passing the min height for the chart; 

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
//have the range between min and max +/- some percent of range. Also make sure min is always >= 0
     return [Math.max(0,min - .1*(max-min)), max + .1*(max-min)]
    };

//just for convenience define these monster functions at the bottom   
  concentrationChart.drawPaths = concentrationChart_drawPaths;
 //Let's get the auto legend to work here
//  concentrationChart.addLegend = concentrationChart_addLegend;

  concentrationChart.baseClass = "naaqs-concentrations-chart-";
  concentrationChart.namespace = "etrends.naaqs.concentrations.chart";

  concentrationChart.addSeriesField('name',['percentile','average','selectedSite']);
  concentrationChart.addSeriesField('text',['90%ile - 10%ile','National Average','Selected Site']);
  concentrationChart.addSeriesField('type',['rect','line','line']);
//Use this if the columns or column names are different
  concentrationChart.export.exportColumns= ['avg','selectedSite','min','max','p10','median','p90'];
  //Could also change menu tooltip data to dynamically change filename
  concentrationChart.export.fileName = 'naaqs-concentrations-data_' + currentPollutant;

  concentrationChart.legend.ncols = null;
  concentrationChart.legend.cellWidth = 25;
  concentrationChart.legend.cellHeight = 25;
  concentrationChart.legend.cellSpacingX = 15; 
  concentrationChart.legend.AllowHiddenSeries = false;
  concentrationChart.legend.externalAddLegend = concentrationChart_externalAddLegend;

  //Don't have chart resize automatically. manually triger when map resizes
  concentrationChart.resize = function () {};

//class that will help calculate stats. Use Sas5 percentiles
  var statsCalculator = new etrends.library.StatsCalculator(yearRange,'val','Sas5');
//   var emissionChart = new EmissionsLineAreaChart();

   var emissionChart = new LineAreaChart("naaqs-emissions-chart",125,.25);
   emissionChart.margin.bottom = 35;
   emissionChart.margin.top = 10;
   emissionChart.useTransitions = false;
//   emissionChart.margin.bottom = 0;
   
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   emissionChart.useRelativeTooltip=true;
//   emissionChart.ytitle.text='Thousands of Tons'
   emissionChart.ytitle.text='Million Tons'
   emissionChart.xField = "year";
   emissionChart.yField = "SumOfSeries";
//Note for emission chart it will possibly lag the concentration chart by a year but in order to get the emission max year to be saem as conc max year set domain here
  emissionChart.getXdomain =  function () {return yearRange};
//This will get the domain when called using the data
  emissionChart.getYdomain =  function (self) {
    var yDomain = self.getYdomainForSumOfSeries();
    //Make yDomain min=0 for emissions
    yDomain[0] = 0;
    return yDomain;
   };

//  emissionChart.getYdomain =  function (self) {return [0, 1.1*d3.max(this.data, function (d) { return 1*d.total; })]};

//Set the step between ticks or tick size
  emissionChart.xTickSize = xTickSize;
   
//just for convenience define these monster functions at the bottom   
  emissionChart.drawPaths = emissionChart_drawPaths;
  //instead of running makeChart run custom transition stuff when toggling show Percent
  emissionChart.toggleYdomainToPercentMakeChart = function () {
    this.setUpYaxis();
    this.addAxes();
    this.drawSumLinesPosition(true);
  };
//Let's get the auto legend to work here
//  emissionChart.addLegend = emissionChart_addLegend;
  emissionChart.baseClass = "naaqs-emissions-chart-";
  emissionChart.namespace = "etrends.naaqs.emissions.chart";

  emissionChart.addSeriesField('name',['stationary','industrial','highway','nonroad']);
  emissionChart.addSeriesField('text',['Stationary Fuel<br/>Combustion','Industrial and<br/>Other Processes','Highway<br/>Vehicles','Non-Road<br/>Mobile']);
  //Could also change menu tooltip data to dynamically change filename
  emissionChart.export.fileName = 'naaqs-emissions-data';

  emissionChart.legend.type = 'rect';
  emissionChart.legend.ncols = null;
  emissionChart.legend.cellWidth = 25;
  emissionChart.legend.cellHeight = 25;
  emissionChart.legend.cellSpacingX = 15;

  emissionChart.export.allowConvertYdomainToPercent = true;
  //Don't have chart resize automatically. manually triger when map resizes
  emissionChart.resize = function () {};

//Set up the slider

//  var naaqsSlider = new MapChartSlider("naaqsSlider",yearRange[0],yearRange[1],1,100,1,onSlide);
//Make full steps don't interpolate between values
  var naaqsSlider = new MapChartSlider("naaqsSlider",yearRange[0],yearRange[1],1,1,1,xTickSize,onSlide);
//This will link chart to slider so chart can move slider
  concentrationChart.slider = naaqsSlider;
  emissionChart.slider = naaqsSlider;
  
d3_queue.queue()
  .defer(makeUSmap,currentPollutant)
//for testing loading map only
//  .defer(makeUSmap,null)
  .defer(makeEmissionGraph,currentPollutant,0,yearRange[0])
//for now don't have to filter by min year since doing 1990 to 2015 and have all. still pass null so callback will work
//    .defer(makeConcentrationGraph,currentPollutant,null)
//    .defer(makeEmissionGraph,currentPollutant,0,null)
  .await(function (error) {
    if (error) console.error(error);
    //Have to fit the chart to the map height. This will also be fired upon resize
    fitChartHeightToMapHeight();
    playMap();
    //This will let caller of init know naaqs has loaded
    if (D3QueueCallback) D3QueueCallback(error);
  });

console.log('end of naaqs ');

function onSlide(evt,value) {
//only change map if full year not in between ticks
    if (value==parseInt(value)) {
      naaqsSlider.currentValue = value; //save for playback
      d3.select('#sliderText').text(value);
      naaqsMap.tooltip.data.year = value;
//debounce the changing of acttribute because redrawing map is slow now with symbols
      changeActiveAttributeDebouncer.debounce(function () {
//        console.log(value);
        naaqsMap.changeActiveAttribute("val" + value);
      })();

//Take this out of the debouncer and the symbols will redraw immediately
//But the trade off now is that moving the slider is laggy which looks bad
//Not sure if somebody can really make sense of symbols redrawing immediately anyway when dragging slider fast
//But moving the slider and getting a lag is really annoying
//        naaqsMap.changeActiveAttribute("val" + value);

      naaqsMap.export.fileName = 'Naaqs-Map-' + value;
      
//        console.log("year "  + value);
//console.log("move line -> " + value);
//snap to wherever the slider is now when moving point
      concentrationChart.moveLine(parseInt(value));
      emissionChart.moveLine(parseInt(value));
    }
}

//function for handling emission menu
  function makeEmissionTabs(pollutant) {
    var tabs = d3.select("#naaqs-emissionMenu ul");
    //emissions are identified by array index
    var indices = pollutantData[pollutant].emissions.map(function (emission,i) {
      return i;
    })
    var click = function (i) {
        makeEmissionGraph(pollutant,i,yearRange[0]);
    }
    //HTML comes from the title attribute of the emission object from emissions array at index i
    var html = indices.reduce(function (acc,i) {
      acc[i] = pollutantData[pollutant].emissions[i].title;
      return acc;
    },{});

    etrends.library.utilities.makeTabs(tabs,indices,click,html);    
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
          d3.select("#naaqs-container").style("pointer-events","none");
          d3.select("#naaqs-container").style("opacity",.3);

        //get array of pollutants with current last
        pollutants = Object.keys(pollutantData).filter(function (item) {        
          return (item!=pollutant)
        });
        pollutants.push(pollutant);
        etrends.library.utilities.loopDeferSeries(pollutants,function (item) {
          console.log('defer loop item ' + item);
          //make sure active attribute is correct so year 2000 map draws without bunch of black dots
          naaqsMap.activeAttribute = "val" + (pollutantData[item].minYear || defaultMinYear);
          //don't pass the callback. execute the callback at the end
          return makeConcentrationLayer(item);          
        })
        .fail(function (error) {
          callback(error);
        })
        .then(function () {
          d3.select("#naaqs-container").style("pointer-events","");
          d3.select("#naaqs-container").style("opacity",1);
          preLoadMaps = false;
          callback(null);
        })
      }
    };
  }
  etrends.library.utilities.makeBaseMap(args,callback);
}

function makeConcentrationLayer(pollutant,callback) {
//I think i can  make this return a promise without messing up the d3 queue things
  var defer = $.Deferred();

//  console.log('begin with conc layer');
  var args = {};
  args.file = "data/naaqs/concentrations/" + pollutantData[pollutant].file;
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
      //var startDate = new Date();
      var data = cacheData.filter(function (row) {
        return row['used_in_nat_agg']==="Yes";        
      });
      //var endDate = new Date();
      //console.log("Filter Data Elapsed ms: " + (startDate.getTime()-endDate.getTime()));      
    }
//pass pollutant now so that map layers are cached for each pollutant to speed up rendering
    var startDate = new Date();
    naaqsMap.plotPoints(data,pollutantSymbology,pollutant);    
    var endDate = new Date();
    console.log("Plot Points Elapsed ms: " + (startDate.getTime()-endDate.getTime()));
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
    concentrationChart.ytitle.text='Concentration (' + pollutantData[pollutant].units + ')'
    concentrationChart.tooltip.data.pollutantDigits= pollutantData[pollutant].digits; 
    concentrationChart.tooltip.data.units = pollutantData[currentPollutant].units;
    
    concentrationChart.makeChart();
//    console.log('done with conc chart');
}

function makeEmissionGraph(pollutant,emissionIndex,minYear,callback) {
//If there is no emissions file then hide the div
//If there is an alt div for emission then hide
  var emissionItem = {}; 
  if (pollutantData[pollutant].emissions.length>0) emissionItem = pollutantData[pollutant].emissions[emissionIndex];
 
  d3.select("#naaqs-emissions-chart").style('display', emissionItem.file ? '' : 'none');
  d3.select("#naaqs-emissions-chart-container .etrends-chart-legend").style('display', emissionItem.file ? '' : 'none');  
  d3.select("#naaqs-emissions-chart-header").style('display', emissionItem.file ? '' : 'none');  
  //If an alernative div is specified then show that instead of standard
  //This is helpful when loading custom bar chart for lead
  if (emissionItem.altDiv) {
    d3.select(emissionItem.altDiv).style('display','');
    d3.select("#naaqs-emissions-chart-container").style('display', 'none');
  } else {
    d3.select("#naaqs-emissions-chart-container").style('display', ''); //turn this on when looking at stuff without emissionsAlternateDiv
    if (etrends.naaqs.emissionsAlternativeDiv) d3.select(etrends.naaqs.emissionsAlternativeDiv).style('display', 'none');
  }
  //Place to store the current alternative div so it can be hidden when pollutant changes
  etrends.naaqs.emissionsAlternativeDiv = emissionItem.altDiv;

  //if main emission chart has not been initialized then do not try to fit
  var chartIsInit = etrends.naaqs.emissions.chart ? true : false;

//for things like Lead with no emissions show a message
  d3.select("#naaqs-emission-chart-alternateText").style('display', emissionItem.altText ? '' : 'none');  
  if (emissionItem.altText) {
    d3.select("#naaqs-emission-chart-alternateText").html(emissionItem.altText);
  }

//If doesn't have file or has alt the do alternative stuff
  if (!emissionItem.file || emissionItem.altFunction) {
    var emissionsAlternateFunction; 
    if (emissionItem.altFunction) {
      emissionsAlternateFunction = emissionItem.altFunction;
    } else {
      //Just empty function to return promise and trigger callback
      emissionsAlternateFunction = function () {};
    }
//Execute a custom function to display alternative emission stuff eg. Lead Bar Chart 
//Note if emissionsAlternateFunction is async then needs to return jquery promise
    return $.when(emissionsAlternateFunction())
        .then(function () {
//If not drawing graph then still exec callback to that await function will exec
          if (callback) callback(null);
        })
  }    

//If the emission file exist the following code is executed to draw graph

//Make sure the last chart is invisible now so we don't get errors when resizing 
  if (etrends.naaqs.emissions.currentChart) etrends.naaqs.emissions.currentChart.visible=false;
  //Set this so we know what chart to resize later to fit map height
  etrends.naaqs.emissions.currentChart = etrends.naaqs.emissions.chart;    
  //Make sure curent chart is visible in case we just turned it off
  if (etrends.naaqs.emissions.currentChart) etrends.naaqs.emissions.currentChart.visible = true;

  var args = {};
  args.file = "data/naaqs/emissions/" + pollutantData[pollutant].emissions[emissionIndex].file;  
  args.done = function (cacheData) {
    //Since data is being cached now need to make a copy of it
    //Other option could be to have new args.preCache function used before data saved to cache so we can cache processed data
    data = $.extend(true,[],cacheData);
//filter by year range
//filter by year range
    if (minYear) data = data.filter(function (d) {return d.year >= minYear});
//add the total column to the data
//convert emissions from thousands of tons to millions of tons (could have done in data file also)
    data = data.map(function (d) {
      d.total = 0;
      ['stationary','industrial','highway','nonroad'].forEach(function (cat) {
        d[cat] = d[cat]/1000;        
        d.total += d[cat];
      });
//      d.total=1*d.stationary+1*d.industrial+1*d.highway+1*d.nonroad; 
      return d;
      });  
    emissionChart.data = data;
    emissionChart.title.text = pollutantData[pollutant].emissions[emissionIndex].title;

    emissionChart.makeChart(data);  
//Change the fileName based on the emissions. Kind of hacky but get the input csv file and strip off .csv
    emissionChart.export.fileName = 'naaqs-emissions-data_' + pollutantData[pollutant].emissions[emissionIndex].file.replace(/.csv$/,'');
//Also fit the chart to map height now because different charts might fit to different height eg. changing from normal line area to lead bar charts
    if (chartIsInit) fitChartHeightToMapHeight();
  };
  
//Note: pass cached info so we don't keep hitting server  
  args.cache = emissionsCache;
//Note don't set the key for emissions to key by file name.
//Could look up by file name later if other processes wanted to look in cache
//The way I did emissions there is no name but instead pollutant-index combo which is not unique

  etrends.library.utilities.loadMapOrGraph(args,callback);
}


function playMap(error)  {
    if (error) {
      console.error("Error loading charts: ");
      console.error(error);
      return;
    }      
//set up so that the 2 charts tooltips both come up when hovering over one
//note since nothing is passed it will not render or move just hide/show (tooltip is already rendered and moved and line/point is moved)
    concentrationChart.externalMouseOver = function () {emissionChart.tooltip.showToolTip(null,emissionChart.movingPoint.node())};
    concentrationChart.externalMouseOut = function () {emissionChart.tooltip.hideToolTip()};
    emissionChart.externalMouseOver = function () {concentrationChart.tooltip.showToolTip(null,concentrationChart.movingPoint.node())};
    emissionChart.externalMouseOut = function () {concentrationChart.tooltip.hideToolTip()};
  
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
  etrends.naaqs.concentrations.map.title.draw(pollutantData[currentPollutant].title || "nbsp;");
  etrends.naaqs.concentrations.map.export.hardcodedDownloadPath = "data/naaqs/concentrations/" + pollutantData[currentPollutant].file;
  etrends.naaqs.concentrations.chart.export.fileName = 'naaqs-concentrations-data_' + currentPollutant;
  //Check if we need to add a minium to national stats eg. Lead
    if (pollutantData[currentPollutant].usedInNatAggRange) {
      etrends.naaqs.concentrations.chart.dragBarMin=pollutantData[currentPollutant].usedInNatAggRange[0]; 
    } else {
      etrends.naaqs.concentrations.chart.dragBarMin=null;
    }      

  makeEmissionTabs(pollutant);

  //If changing limit of dragBar eg. Lead then change start of slider
  if (pollutantData[pollutant].usedInNatAggRange && naaqsSlider.currentValue<etrends.naaqs.concentrations.chart.dragBarMin) naaqsSlider.currentValue=etrends.naaqs.concentrations.chart.dragBarMin;
  
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
  etrends.naaqs.concentrations.map.closeToolTip();
  
//Make maps and charts  async  
    var startDate = new Date();

  d3_queue.queue()
    .defer(makeConcentrationLayer,pollutant)
//Don't do this from file anymore. get starts from selectedSite data
//    .defer(makeConcentrationGraphFromFile,currentPollutant,yearRange[0])

    .defer(makeEmissionGraph,currentPollutant,0,yearRange[0])

    .await(function () {
    var endDate = new Date();
    console.log("Switch Pollutants Elapsed ms: " + (startDate.getTime()-endDate.getTime()));
//Wait to move the slider until everything is drawn so that things are in correct places
//Also make sure the currentValue is an integer so we are not starting partway through step
      naaqsSlider.moveSlider(parseInt(naaqsSlider.currentValue));
//      console.log("pollutant swtiched");
      });

  },0)
} 


function setMapTitle() {
    var mapTitle = d3.select("#naaqs-map-title-label");
    mapTitle.html(pollutantData[currentPollutant].title);
    mapTitle.style("font-size","");
    var maxFontSize = parseInt(mapTitle.style("font-size"));
    var available = $("#naaqs-map-title").width() - 3.5 * $("#naaqs-map-home").width();
    var scale = Math.max(1,$("#naaqs-map-title-label").width() / available);
    mapTitle.style("font-size",maxFontSize/scale + "px");
}

function naaqsMap_externalMouseOver(selectedSiteData) {  
//this is run in context of concentrationChart
    var self = concentrationChart;
  //Try to use a timeOut so that the tooltip is actually hidden while chart is redrawing. slow on iPhone.
  setTimeout(function () {

    self.data.forEach(function (item,index) {
      self.data[index].selectedSite = selectedSiteData["val" + item.year];
    });
     
    self.selectedSiteLine = d3.svg.line()
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.selectedSite!==""      
    .defined(function(d) { return (d.selectedSite || (d.selectedSite!=="" && d.selectedSite==0)) ? true : false; })
    .x(function (d) { return self.xScale(d.year); })
    .y(function (d) { return self.yScale(d.selectedSite); });    

   self.makeChart();

    self.export.fileName = 'naaqs-concentrations-data_' + currentPollutant + '_' + selectedSiteData['site_id'];

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
      self.export.fileName = 'naaqs-concentrations-data_' + currentPollutant;
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
      
    
      self.svg.datum(self.data);
    
      self.nationalStatsPaths = self.svg.append('g');
      //If wanting to minimize the national stats it will be triggered by self.dragBarMin
      if (etrends.library.utilities.isNumeric(self.dragBarMin)) {
        self.nationalStatsPaths.datum(self.data.filter(function (d) {return d.year>=self.dragBarMin}));
      } else {
        self.nationalStatsPaths.datum(self.data);
      }

      self.nationalStatsPaths.append('path')
        .attr('class', 'etrends-chart-area etrends-chart-area-percentile')
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
  var legPercentileTip = new MapChartTooltip(self.host,"#naaqs-concentrations-chart-percentile-tooltip");  
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

  function emissionChart_drawPaths() {
    var self=this;

//Draw the "sum lines" and then draw the total line because total line class passed
    self.drawSumLines('naaqs-emissions-chart-line-total');
    return;
};
 
  function fitChartHeightToMapHeight() {
    //The emission chart could be an alternative chart like Lead Bar Chart
    var currentEmissionChart = etrends.naaqs.emissions.currentChart || emissionChart;
    //if phone don't ever entertain this becuase won't have 2 columns
    if (isMobile.any) return;
    //Note this is only done if there is 2 column bootstrap layout otherwise set overrideHeight to null to go back to normal
    if ($(window).width()<975) {
      concentrationChart.overrideHeight = null;
      currentEmissionChart.overrideHeight = null;      
    } else {
      //f = currentEmissionChart/concentrationChart after fitting to map height
      //If you want both charts equal height then f=1

      //f = currentEmissionChart/(currentEmissionChart+concentrationChart) after fitting to map height
      //If you want both charts equal then f=1/2
      //Could also use p = currentEmissionChart/concentrationChart after fitting to map height
      //If you want both charts equal height then p=1      
      // p = f/(1-f) and f = p/(1+p)
      var f = .45;

      //Get the amount of extra height between charts and map. Note use outerHeight because it includes padding
      var extra = $("#naaqs-charts-container").outerHeight() - $("#" + naaqsMap.containerID).outerHeight();
      //Not split the extra amount amongst concentrations and emissions
      //force a height by setting min height = max height Note: min and max height refer to chartHeight
      concentrationChart.overrideHeight = (1-f)*(concentrationChart.chartHeight + currentEmissionChart.chartHeight - extra);
      currentEmissionChart.overrideHeight = f/(1-f)*concentrationChart.overrideHeight;

      concentrationChart.makeChart();
      //Can only draw emissions chart if there are emissions or it is custom chart like Lead
      if (pollutantData[currentPollutant].emissions.length>0 || etrends.naaqs.emissions.currentChart!==emissionChart) currentEmissionChart.makeChart();
    }
  }  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  etrends.naaqs.concentrations.switchPollutant=switchPollutant;
  etrends.naaqs.concentrations.fitChartHeightToMapHeight=fitChartHeightToMapHeight;
  etrends.naaqs.concentrations.toggleAllSites=toggleAllSites;
  etrends.naaqs.concentrations.map=naaqsMap;
  etrends.naaqs.concentrations.chart=concentrationChart;
  etrends.naaqs.emissions.chart=emissionChart;
};
//# sourceURL=naaqsMapChart.js