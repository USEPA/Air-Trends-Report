//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.toxics) etrends.toxics = {};
if (! etrends.toxics.cancerRisk) etrends.toxics.cancerRisk = {};
if (! etrends.toxics.cancerRisk.barChart) etrends.toxics.cancerRisk.barChart = {};

//This is a function that is called to create the naaqs concentration averages chart.
//The execution can be delayed until other stuff is loaded
etrends.toxics.cancerRisk.barChart.init = function (D3QueueCallback) {
    
  var chartFileName = "data/toxics/cancerRisk/barChart.csv";

   var chart = new LineAreaChart("toxics-cancerRisk-barChart-chart",125,.635,null); //passing the min height for the chart
   chart.margin.top = 10;
   chart.useTransitions = false;
   //need ordinal x scale for categorical x axis
    chart.xDomainType='ordinal';

//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   chart.useRelativeTooltip=true;
   chart.tooltip.data.units = '';
   chart.tooltip.data["f.toLocaleString"] = function (value,format) {
      return (+value).toLocaleString(format);
   }; 
    

   chart.title.text = 'Number of People in the U.S. with Estimated Cancer Risks of <br/>100-in-1 Million or More Due to Human-Made Emissions of Air Toxics';
   chart.ytitle.text='Number of People';
   chart.ytitle.units=null

   chart.xField = "Year";
   chart.yField = "Number of People";

//use the getYdomainForLines function on LineAreaChart
   chart.getYdomain =  function (self) {
    return self.getYdomainForLines();
   };
   chart.getXdomain =  function () {
     //Get array with pollutants on x axis
     return chart.data.map(function (row) {
      return row[chart.xField]
     })
   };
   
//hacky way to Disable the vertical line thing by over riding 
  chart.addVerticalLine = function () {};
//just for convenience define these monster functions at the bottom   
  chart.drawPaths = function () {
    chart.drawBars(1);
  }


  chart.namespace = 'etrends.toxics.cancerRisk.barChart.chart';

  chart.addSeriesField('name',['Number of People']);
  chart.addSeriesField('class',['count']);

  //Could also change menu tooltip data to dynamically change filename
  chart.export.fileName = 'toxics-cancerRisk-barChart-data';

    chart.legend.ncols = null;
  chart.legend.cellWidth = 25;
  chart.legend.cellHeight = 25;
  chart.legend.cellSpacingX = 15; 

  //Actually don't allow series to be hidden if showing percent
  //Not until they check show totals do we allow hiding
  chart.legend.AllowHiddenSeries = false;
  chart.legend.type = 'rect';

  //Mabye have this set to width of vertical line later possibly
  chart.tooltip.offset = {x:20,y:20};

  var args = {};
  args.file = chartFileName;
  args.done = function (cacheData) {
    data = $.extend(true,[],cacheData);
    data = data.map(function (d) {
      return d;
    });  

    chart.data = data;
    chart.makeChart();
  }

  chart.externalMakeChart = function () {    
    //Just a hack to remove y-axis lines. Arthur didn't want them
    //Find them in dom and hide them
    //Note: seperated ySecondary from primary for styling later
    tweakYaxis("#" + chart.domID + " .y.etrends-chart-axis")
    function tweakYaxis(yAxis) {
      $(yAxis + " .domain").hide();
    }
  }


  etrends.library.utilities.loadMapOrGraph(args,D3QueueCallback);
  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  etrends.toxics.cancerRisk.barChart.chart=chart;

};
//# sourceURL=toxics-cancerRisk-barChart.js