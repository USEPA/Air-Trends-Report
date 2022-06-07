//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.naaqs) etrends.naaqs = {};
if (! etrends.naaqs.concentrations) etrends.naaqs.concentrations = {};
if (! etrends.naaqs.concentrations.averages) etrends.naaqs.concentrations.averages = {};

//This is a function that is called to create the naaqs concentration averages chart.
//The execution can be delayed until other stuff is loaded
etrends.naaqs.concentrations.averages.init = function (D3QueueCallback) {

  var defaultMinYear = 1990;
	var yearRange = [defaultMinYear,2021];
//Using hardcoded y ranges and interval for this
  var yRange = [-100,100,50];
  var ySecondaryRange = [-400,400,200];
//Temp disable lead comment out when using the secondary axis
  var ySecondaryRange = null;

  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 3;
    
  var chartFileName = "data/naaqs/concentrations/inNAAQSconcentrations19902021.csv";

   var chart = new LineAreaChart("naaqs-concentrations-averages-chart",125,.65,null); //passing the min height for the chart
   chart.margin.top = 10;
   chart.useTransitions = false;

//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   chart.useRelativeTooltip=true;
   chart.tooltip.data.units = '%';
   chart.tooltip.data.digits=0; 

   if (yRange) chart.yTickValues = chart.generateTickValues(yRange);
   if (ySecondaryRange) chart.ySecondaryTickValues = chart.generateTickValues(ySecondaryRange);

   chart.title.text = 'Declining National Air Pollutant Concentration Averages';
   chart.ytitle.text='Percent Above or Below NAAQS'
   chart.ytitle.units='%'
   chart.ysecondarytitle.text='Lead'
   chart.ysecondarytitle.units='%'
   
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
   
   chart.getYdomain =  function (self) {
//Might have to add national standard line for Lead but complicated because when 0 is at same level will it overlap
//Commenting this line out will make the yAxis domain stay fixed when lines are hidden
//      return self.getYdomainForLines();
     //This is different than emissions which uses the nearest surround tick values for range of visible lines
     //This is how it worked in 2016. In 2017 he made negative tick values change and not positive. not sure if that was a bug
     //if y range is forced then use that     
       if (yRange) {
//return hardcoded y domain
         return [yRange[0],yRange[1]]           
       }else {
        return self.getYdomainForLines();
       }
    };

   chart.getYsecondaryDomain =  function (self) {
     //if y range is forced then use that     
       if (ySecondaryRange) {
//return hardcoded y domain
         return [ySecondaryRange[0],ySecondaryRange[1]]           
       }else {
        return self.getYdomainForLines(null,null,true);
       }
    };
//Comment out the below to reenable; uncomment to Temp disable lead
chart.getYsecondaryDomain = null;


//just for convenience define these monster functions at the bottom   
  chart.drawPaths = function () {
    chart.drawLines();
    //Draw standard
    chart.standardLine = d3.svg.line()
      .x(function (d) { return chart.xScale(d[chart.xField]); })
      .y(function (d) { return chart.yScale(chart.standard); });


    //Draw Lead standard
    chart.secondaryStandardLine = d3.svg.line()
      .x(function (d) { return chart.xScale(d[chart.xField]); })
      .y(function (d) { return chart.ySecondaryScale(chart.standard); });

    //Actually draw lead first so that it is on top
    //Not drawing lead standard now. It was confusing and made line bold when both shown on top of each other
//    chart.secondaryStandardLineElement = drawStandardLine(chart.secondaryStandardLine,chart.ySecondaryScale,chart.ySecondaryDomain);
//    chart.secondaryStandardLineElement.classed("secondary",true);

    chart.standardLineElement = drawStandardLine(chart.standardLine,chart.yScale,chart.yDomain);

    function drawStandardLine(standardLine,yScale,yDomain) {
      var group = chart.svg.append('g');
      group.append('path')
        .attr('class', 'etrends-chart-line-standard')
        .attr('d', standardLine)
        .attr('clip-path', 'url(#rect-clip)');
        
    //DraW label for standard
      var label = group.append("text")
            .attr("x", chart.chartWidth - 20*chart.percentSize)
            .attr("y", yScale(chart.standard) - 10 *chart.percentSize )
            .attr("text-anchor", "end")  
              .attr('class', 'etrends-chart-line-standard-label')
            .text("Most Recent National Standard");    
    //If y max is standard then move label underneath line
      if (chart.standard==yDomain[1] ) {         
        label.attr("y", yScale(chart.standard) + label.node().getBBox().height + 0*chart.percentSize )
      }
      return group;
    }    
  }

  
  chart.snapToInterval = function (value) {
//When moving line it must snap to integer year    
    return Math.round(value);
  };
  //Have to set the drag Area bar to be with of interval
  chart.getDragAreaWidth = function (value) {
    return Math.max(50,this.getChartWidth(this.width)/(yearRange[yearRange.length-1]-yearRange[0]));
  };

  chart.namespace = 'etrends.naaqs.concentrations.averages.chart';

  chart.addSeriesField('name',['Pb (3-month)','CO (8-hour)','NO2 (annual)','NO2 (1-hour)','O3 (8-hour)','PM2.5 (annual)','PM2.5 (24-hour)','PM10 (24-hour)','SO2 (1-hour)']);
  chart.addSeriesField('class',['Pb_3-month','CO_8-hour','NO2_annual','NO2_1-hour','O3_8-hour','PM2-5_annual','PM2-5_24-hour','PM10_24-hour','SO2_1-hour']);
  chart.initSeriesField('isSecondary',false);
//Temp disable lead
//  chart.series[0].isSecondary = true;
// Uncomment to reenable lead to secondary axis; comment out to disable
//  chart.series[0].isSecondary = true;

  //could also pass the length but it gets it from series if not passed
  //chart.initSeriesField('isSecondary',false,chart.series.length);
  var chartSymbols = [];
  chartSymbols.push({id:'triangle-down',scale:.78});
  chartSymbols.push({id:'spades',scale:.5});
  chartSymbols.push({id:'square',scale:1});
  chartSymbols.push({id:'heart',offsetx:0,offsety:0,scale:.45});
  chartSymbols.push({id:'circle',scale:1});
  chartSymbols.push({id:'clubs',offsetx:0,offsety:0,scale:.5});
  chartSymbols.push({id:'diamonds',offsetx:0,offsety:0,scale:.475});
  chartSymbols.push({id:'star',offsetx:0,offsety:0,scale:.5});
  chartSymbols.push({id:'triangle-up',scale:.78});

  chart.addSeriesField('symbol',chartSymbols);

  //Add the series data to tooltip data so it can loop over it
  chart.tooltip.data.series = chart.series;

  chart.export.fileName = 'naaqs-concentrations-averages-data';

  chart.legend.ncols = null;
  chart.legend.cellWidth = 20;
  chart.legend.cellHeight = 20;
  chart.legend.cellSpacingX = 10; 
  chart.legend.AllowHiddenSeries = true;
  chart.legend.type = 'line';
  //If lead is hidden then don't show it's standard line
  chart.legend.ExternalLegendClick = function (i) {
    //not drawing lead standard line anymore so don't need to do this
    return;
    if (chart.series[i].name=='Pb (3-month)') {
      if (chart.series[i].hidden) {
        $(chart.secondaryStandardLineElement.node()).hide();
      }else {
        $(chart.secondaryStandardLineElement.node()).show();
      }
    }
  } 

  //Mabye have this set to width of vertical line later possibly
  chart.tooltip.offset = {x:20,y:20};

  var args = {};
  args.file = chartFileName;
  args.done = function (data) {
    chart.data = data;
    chart.makeChart();
//Add a scroll magic trigger to redraw with animation   
	chart.addChartRedrawTrigger();
  }

  chart.externalMakeChart = function () {      
    //Just a hack to remove y-axis lines. Arthur didn't want them
    //Find them in dom and hide them
    //Note: seperated ySecondary from primary for styling later
    tweakYaxis("#" + chart.domID + " .y.etrends-chart-axis")
    tweakYaxis("#" + chart.domID + " .ySecondary.etrends-chart-axis")
    function tweakYaxis(yAxis) {
      $(yAxis + " .domain").hide();
      //Tack on percent to the tick values
      d3.selectAll(yAxis + " .tick text").html(function (val) {return val + '%'})
    }
  }
  
  etrends.library.utilities.loadMapOrGraph(args,D3QueueCallback);
  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  etrends.naaqs.concentrations.averages.chart=chart;
};
//# sourceURL=naaqs-concentrations-averages.js