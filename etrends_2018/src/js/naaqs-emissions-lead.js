//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.naaqs) etrends.naaqs = {};
if (! etrends.naaqs.emissions) etrends.naaqs.emissions = {};
if (! etrends.naaqs.emissions.lead) etrends.naaqs.emissions.lead = {};

//This is a function that is called to create the naaqs concentration averages chart.
//The execution can be delayed until other stuff is loaded
etrends.naaqs.emissions.lead.init = function (D3QueueCallback) {
    
  var chartFileName = "data/naaqs/emissions/pb.csv";

  var yRangePercent=[0,100,25];
  var yRangeTotals=[0,10,1];

   var chart = new LineAreaChart("naaqs-emissions-lead-chart",125,.25,null); //passing the min height for the chart
   //Actually set visible=true by default because init is not triggered until chart will show first time
   //After chart is not showing visible=fasle will be set so that window resizing doesn't cause  errors
   chart.visible=true;
   chart.margin.top = 10;
   chart.useTransitions = false;
   //need ordinal x scale for categorical x axis
    chart.xDomainType='ordinal';

   chart.export.allowConvertYdomainToPercent=true;
   //Checking box will show actual values instead of percent
   chart.export.revertConvertYdomainToPercent=true;
   chart.export.convertYdomainToPercentLabel="Show Totals";
   
   //by default show in percent when 1st loaded
    chart.convertYdomainToPercent=false;

//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   chart.useRelativeTooltip=true;
   chart.tooltip.data.units = 'thousand tons';

   chart.title.text = 'Pb Emissions';
   chart.ytitle.text='Thousand Tons'
   //chart.ytitle.units='Thousand Tons'   

   chart.xField = "Year";
   chart.yField = "SumOfSeries";

//use the getYdomainForSumOfSeries function on LineAreaChart
   chart.getYdomain =  function (self) {
    return self.getYdomainForSumOfSeries();
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


  chart.namespace = 'etrends.naaqs.emissions.lead.chart';

  chart.addSeriesField('name',['Stationary Fuel Combustion','Industrial and Other Processes','Highway Vehicles','Non-Road Mobile']);
  chart.addSeriesField('class',['stationary','industrial','highway','nonroad']);
  chart.addSeriesField('text',['Stationary Fuel<br/>Combustion','Industrial and<br/>Other Processes','Highway<br/>Vehicles','Non-Road<br/>Mobile']);
  //Could also change menu tooltip data to dynamically change filename
  chart.export.fileName = 'naaqs-emissions-lead-data';

  //Add the series data to tooltip data so it can loop over it
  chart.tooltip.data.series = chart.series;

  chart.legend.ncols = null;
  chart.legend.cellWidth = 25;
  chart.legend.cellHeight = 25;
  chart.legend.cellSpacingX = 15; 

  chart.legend.AllowHiddenSeries = true;
  chart.legend.type = 'rect';

  //Mabye have this set to width of vertical line later possibly
  chart.tooltip.offset = {x:20,y:20};

  var args = {};
  args.file = chartFileName;
  args.done = function (cacheData) {
    data = $.extend(true,[],cacheData);
    //Lead data to be shown in Thousand Tons so don't need to convert
    /*
    data = data.map(function (d) {
      Object.keys(d).forEach(function (key) {
        //every column except x value must be divided by 1000 to get Million Tons
        if (key !== chart.xField) {
          d[key] = d[key]/1000;
        }
      });
      return d;
    });  
    */
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
      //Tack on percent to the tick values
      if (chart.convertYdomainToPercent) {
        d3.selectAll(yAxis + " .tick text").html(function (val) {return val + '%'})
      }
    }
  }

  //Change the intervals of y axis
  chart.preToggleYdomainToPercent = function () {
    if (chart.convertYdomainToPercent) {
      chart.yTickValues = chart.generateTickValues(yRangePercent);
    }else {
      chart.yTickValues = chart.generateTickValues(yRangeTotals);
    }  
  };

  //instead of running makeChart run custom transition stuff when toggling show Percent
  chart.toggleYdomainToPercentMakeChart = function () {
    chart.preToggleYdomainToPercent();
    chart.setUpYaxis();
    chart.addAxes();
    chart.drawBarsHeightsAndPosition(true);
  };

//have to initialize stuff that changes when show percent clicked
  chart.preToggleYdomainToPercent();

      console.log('before lead loadMapOrGraph in init')      

  etrends.library.utilities.loadMapOrGraph(args,D3QueueCallback);
  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  etrends.naaqs.emissions.lead.chart=chart;
};
//# sourceURL=naaqs-emissions-lead.js