//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.weather) etrends.weather = {};
//if (! etrends.naaqs.concentrations) etrends.naaqs.concentrations = {};
//if (! etrends.naaqs.concentrations.averages) etrends.naaqs.concentrations.averages = {};

//This is a function that is called to create the naaqs concentration averages chart.
//The execution can be delayed until other stuff is loaded
etrends.weather.init = function () {
  var config = {types:{}};
	config.types.urban = {file:"data/weather/urban.csv",title:"National Urban Ozone Trend<br/>112 Locations",units:"ppb",digits:1,typeLabel:"Urban",tooltip:"Click to view urban ozone trend"}
//Don't show haziest now
	config.types.rural = {file:"data/weather/rural.csv",title:"National Rural Ozone Trend<br/>49 Locations",units:"ppb",digits:1,typeLabel:"Rural",tooltip:"Click to view rural ozone trend"}

  makeTabs();

  var currentType = 'urban';
  
  //This is place to store downloaded data so we don't have to keep hitting server
  var dataCache = {};

  var defaultMinYear = 2000;
	var yearRange = [defaultMinYear,2015];
//Using hardcoded y ranges and interval for this
  var yRange = [0,60,5];
 // var ySecondaryRange = [0,60,5];
  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 5;
    
   var chart = new LineAreaChart("weather-chart",125,.63,null); //passing the min height for the chart
   chart.margin.top = 10;
   chart.useTransitions = false;
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   chart.useRelativeTooltip=true;
   chart.tooltip.data.units = ' ppb';
   chart.tooltip.data.digits=1; 

   if (yRange) chart.yTickValues = chart.generateTickValues(yRange);
   //if (ySecondaryRange) chart.ySecondaryTickValues = chart.generateTickValues(ySecondaryRange);

   chart.ytitle.text='May - September Average Ozone'
   chart.ytitle.units='ppb'
   
   //Really? They call year Categories? Huh?
   chart.xField = "Categories";
   chart.yField = null;
   chart.standard = 0;
//This will get the domain when called using the data
   chart.getXdomain =  null; //use the default x domain which is max min of x field
   //note had to multiply d.p10 and d.p90 by 1 so that it would convert string to number for finding min/max
   //also min/max could possible be national standard 
//Set the step between ticks or tick size
    chart.xTickSize = xTickSize;
   
   chart.getYdomain =  function (self) {
//Might have to add national standard line for Lead but complicated because when 0 is at same level will it overlap
      return self.getYdomainForLines();
    };

//just for convenience define these monster functions at the bottom   
  chart.drawPaths = function () {
    chart.drawLines();
  }

  
  chart.snapToInterval = function (value) {
//When moving line it must snap to integer year    
    return Math.round(value);
  };
  //Have to set the drag Area bar to be with of interval
  chart.getDragAreaWidth = function (value) {
    return Math.max(50,this.getChartWidth(this.width)/(yearRange[yearRange.length-1]-yearRange[0]));
  };

  chart.namespace = 'etrends.weather.chart';

  chart.addSeriesField('name',['Unadjusted for Weather','Adjusted for Weather']);
  chart.addSeriesField('class',['Unadjusted_for_Weather','Adjusted_for_Weather']);
  chart.initSeriesField('isSecondary',false);
  chart.series[0].isSecondary = false;
  var chartSymbols = [];
  chartSymbols.push({id:'circle',scale:1});
  chartSymbols.push({id:'diamonds',offsetx:0,offsety:0,scale:.475});

  chart.addSeriesField('symbol',chartSymbols);

  //Add the series data to tooltip data so it can loop over it
  chart.tooltip.data.series = chart.series;

  chart.legend.ncols = null;
  chart.legend.cellWidth = 20;
  chart.legend.cellHeight = 20;
  chart.legend.cellSpacingX = 10; 
  chart.legend.AllowHiddenSeries = true;
  chart.legend.type = 'line';

  //Mabye have this set to width of vertical line later possibly
  chart.tooltip.offset = {x:20,y:20};

  //Start out with urban showing  
  switchType(currentType);

  function makeTabs() {
    var tabs = d3.select("#weather-tabs ul");
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

  function switchType(type) {
    var args = {};
    args.file = config.types[type].file;
    args.done = function (cacheData) {
      chart.data = cacheData;
      chart.title.text = config.types[type].title;

      chart.makeChart();
//Change the fileName based on the type. Kind of hacky but get the input csv file and strip off .csv
      chart.export.fileName = 'mettrends-data_' + type;
    }

    chart.externalMakeChart = function () {      
      //Just a hack to remove y-axis lines. Arthur didn't want them
      //Find them in dom and hide them
      $("#" + chart.domID + " .y.etrends-chart-axis .domain").hide();
    }

    args.cache = dataCache;

    etrends.library.utilities.loadMapOrGraph(args);    
  }
  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  etrends.weather.chart=chart;
};
//# sourceURL=weather.js