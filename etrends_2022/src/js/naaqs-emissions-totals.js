//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.naaqs) etrends.naaqs = {};
if (! etrends.naaqs.emissions) etrends.naaqs.emissions = {};
if (! etrends.naaqs.emissions.totals) etrends.naaqs.emissions.totals = {};

//This is a function that is called to create the naaqs emission totals chart.
//The execution can be delayed until the modal pops up
etrends.naaqs.emissions.totals.init = function (D3QueueCallback) {
  var self = this;
//move chart to modal Element once it is drawn
  var modalElement = $("#naaqs-emissions-totals-chart-modal");

  var defaultMinYear = 1990;
	var yearRange = [defaultMinYear,2021];
//Using hardcoded y ranges and interval for this
  var yRange = [0,30,5];
  var ySecondaryRange = [0,200,50];

  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 3;
    
  var chartFileName = "data/naaqs/emissions/national_tier1_caps_emissTrends_lineChart_noWildfires.csv";

   var chart = new LineAreaChart("naaqs-emissions-totals-chart",125,.65,null); //passing the min height for the chart
   //don't try to draw chart until tooltip comes up
   //Now we are drawing this on page in a tab with concetration averages line chart
//   chart.visible=false;

   chart.margin.top = 10;
   //Just a tweak to use diff tooltip positioning so they work in FF in modals
   chart.chartInModalTweak = 10;
   chart.useTransitions = false;
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   chart.useRelativeTooltip=true;
   chart.tooltip.data.units = ' million tons';
   chart.tooltip.data.digits=1; 

   chart.title.text = 'Declining National Air Pollutant Emissions';
   chart.ytitle.text='Emissions Excluding CO'
   chart.ytitle.units='Million Tons'
   chart.ysecondarytitle.text='CO Emissions'
   chart.ysecondarytitle.units='Million Tons'
   
   //Categories changed to year
   chart.xField = "year";
   chart.yField = null;
   chart.standard = 0;
//This will get the domain when called using the data
   chart.getXdomain =  null; //use the default x domain which is max min of x field
   //note had to multiply d.p10 and d.p90 by 1 so that it would convert string to number for finding min/max
   //also min/max could possible be national standard 
//Set the step between ticks or tick size
  chart.xTickSize = xTickSize;

   if (yRange) chart.yTickValues = chart.generateTickValues(yRange);
   if (ySecondaryRange) chart.ySecondaryTickValues = chart.generateTickValues(ySecondaryRange);
   
   chart.getYdomain =  function (self) {
     //pass 0 for padding because doesn't need padding since tickValues are set
     return self.getYdomainForLines();     
    };

   chart.getYsecondaryDomain =  function (self) {
     //Even though range is between 50 and 150 they want to show 0 to 200
     //So don't automatically snap CO range to surrounding tick values because that would be 50,150
       if (ySecondaryRange) {
//return hardcoded y domain
         return [ySecondaryRange[0],ySecondaryRange[1]]           
       }else {
        return self.getYdomainForLines(null,null,true);
       }
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

  chart.namespace = 'etrends.naaqs.emissions.totals.chart';
  //For this chart select the title based on it's ID and have custom styling because media query styling was breaking things in phones
  chart.title.selector = '#naaqs-emissions-totals-chart-title';

  chart.addSeriesField('name',['CO','NH3','NOx','Direct PM2.5','Direct PM10','SO2','VOC']);
  chart.addSeriesField('class',['CO_8-hour','NO2_annual','NO2_1-hour','PM2-5_24-hour','PM10_24-hour','SO2_1-hour','O3_8-hour']);
  chart.initSeriesField('isSecondary',false);
  chart.series[0].isSecondary = true;
  //could also pass the length but it gets it from series if not passed
  //chart.initSeriesField('isSecondary',false.chart.series.length);
  var chartSymbols = [];
  chartSymbols.push({id:'spades',scale:.5});
  chartSymbols.push({id:'square',scale:1});
  chartSymbols.push({id:'heart',offsetx:0,offsety:0,scale:.45});
  chartSymbols.push({id:'diamonds',offsetx:0,offsety:0,scale:.475});
  chartSymbols.push({id:'star',offsetx:0,offsety:0,scale:.5});
  chartSymbols.push({id:'triangle-up',scale:.78});
  chartSymbols.push({id:'circle',scale:1});

  chart.addSeriesField('symbol',chartSymbols);

  //Add the series data to tooltip data so it can loop over it
  chart.tooltip.data.series = chart.series;

  chart.export.fileName = 'naaqs-emissions-totals-data';

  chart.legend.ncols = null;
  chart.legend.cellWidth = 20;
  chart.legend.cellHeight = 20;
  chart.legend.cellSpacingX = 10; 
  chart.legend.AllowHiddenSeries = true;
  chart.legend.type = 'line';

  //Mabye have this set to width of vertical line later possibly
  chart.tooltip.offset = {x:20,y:20};

  var args = {};
  args.file = chartFileName;
  args.done = function (cacheData) {
    //Since data is being cached now need to make a copy of it
    //Other option could be to have new args.preCache function used before data saved to cache so we can cache processed data
    data = $.extend(true,[],cacheData);
    data = data.map(function (d) {
      Object.keys(d).forEach(function (key) {
        //every column except x value must be divided by 1000 to get Million Tons
        if (key !== chart.xField) {
          d[key] = d[key]/1000;
        }
      });
      return d;
    });  

    chart.data = data;
//    chart.visible=true;
    chart.makeChart();
//    chart.visible=false;

//create the tab menu
    self.makeTabs();

    //Now move the chart to the modal once it is drawn
    //var containerElement = $("#" + chart.domID + "-container").detach()
    //modalElement.prepend(containerElement);
  }

  chart.externalMakeChart = function () {   
      //Just a hack to remove y-axis lines. Arthur didn't want them
      //Find them in dom and hide them
      $("#" + this.domID + " .y.etrends-chart-axis .domain").hide()
      $("#" + this.domID + " .ySecondary.etrends-chart-axis .domain").hide()    
      //Now resize the height of the chart so that modal fits on screen
      //now that width is correct can find aspect ratio for that width that will fit screen
      //Not putting on modal anymore so don't need to fitChartToScreen
      //self.fitChartToScreenModal(etrends.naaqs.concentrations.averages.chart);      
  }

  this.fitChartToScreenModal = function() {
    //If on mobile don't try to resize chart so mobile fits screen. Was crashing
    if (isMobile.any) return;

    //modalElement is defined at top.
    //Find diff between modal size and avail screen space
    var modalExtra = modalElement.outerHeight() - .65*screen.availHeight;
    //Get modal to fit on screen by reducing the aspect ratio of chart    
    if (modalExtra > 0) {
      //Note only try to fit the modal if the chart will be at least minimum height. Otherwise user will have to scroll.
      //On some screens even the text will not fit all the way on screen. That would result in negative height.
      var overrideHeight = chart.getChartHeight(chart.height)-modalExtra;
      if (overrideHeight > chart.minimumHeight) {
        chart.overrideHeight = overrideHeight;
          chart.makeChart(); 
      }
    }
  }

//This tab stuff for concentations averages and emissions totals would make sense in sep
//I ended up just putting it in here and calling it from here because it needs to be called after all charts drawn
  this.makeTabs = function() {
    var initial = 'averages';
    var tabs = d3.select("#naaqs-concentrations-averages-charts-tabs ul");
    var types = ['averages','totals'];
    var html = {
      averages:'Concentration Averages',
      totals:'Emission Totals'
    };
    var textSelectors = {
      averages:'#naaqs-concentrations-averages-text',
      totals:'#naaqs-emissions-totals-text'
    };
    //mixing jquery and d3 here for elements so i can just use jquery hide/show
    var charts = {
      averages: etrends.naaqs.concentrations.averages.chart,
      totals: etrends.naaqs.emissions.totals.chart
    }
    var switchType = function (type) {
//      setTimeout(function () {
        Object.keys(charts).forEach(function (chartType,i) {
          var chart = charts[chartType];
          var container = chart.getContainer();
          var textElement = $(textSelectors[chartType]);
          if (chartType!==type) {
            //setting chart that is not showing to false means it will not redraw on resizing which causes errors
            chart.visible=false;
            container.hide();
            textElement.hide();            
          }else {
            chart.visible=true;
            container.show();        
            textElement.show();
          }
        });
 //     },0)
      //if switching to anything bug initial chart then resize chart to fit initial chart
      //Have to resize chart after it is showing or else it wasn't drawing correctly
      //might cause a bit of a flicker...
      if (type!==initial) {
        etrends.library.utilities.fitChartToChart(charts[initial],charts[type]);
      }
    };    
    etrends.library.utilities.makeTabs(tabs,types,switchType,html);
    //set the initial tab showing
    switchType(initial);    
  }  
  
  etrends.library.utilities.loadMapOrGraph(args,D3QueueCallback);
  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  this.chart=chart;
};

/*
//Need to redraw the emission totals chart when the modal comes up so that it is correct size
//Also need to set visible=false when modal closed so there aren't errors when trying to draw chart on hidden modal when browser resizes
$(document).ready(function(){
	$('#modal-1').on('shown.bs.modal', function() {
	//use the new D3 framework now to draw chart now
	//makeChart will resize the chart to fit the modal
	//					setTimeout(function () {
			var totals = etrends.naaqs.emissions.totals;
			//make sure the chart is visible now so that it will draw. Have to hide when modal closes or breaks stuff when makeChart
			totals.chart.visible = true;
	//Resize the chart each time now because they might have resized the browser window in meantime so need to start owver
	//						if (!totals.chartResized) {
				//First have to make chart to get width to fit in modal
				totals.chart.makeChart();
	//						}
			//Save this info so we don't have to resize again
			totals.chartResized=true;
	}); 
	$('#modal-1').on('hidden.bs.modal', function() {
		//make sure the chart is invisible now so that it doesn't try to makeChart and break stuff
		etrends.naaqs.emissions.totals.chart.visible = false;
	});
});		
*/
//# sourceURL=naaqs-emissions-totals.js