//stashing stuff in etrends so i don't have to clutter window object
//then stashing naaqs stuff in etrends.naaqs
if (! etrends) var etrends = {};
if (! etrends.growth) etrends.growth = {};

//This is a function that is called to create the naaqs concentration averages chart.
//The execution can be delayed until other stuff is loaded
etrends.growth.init = function (D3QueueCallback) {

  var defaultMinYear = 1990;
	var yearRange = [defaultMinYear,2024];
//Using hardcoded y ranges and interval for this
  var yRange = [-100,300,100];
  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 5;
  //This will be determined using xTickLabels later
  var xTickValues = null;

  xTickLabels = ["1970","2000","2010","2020"];
  xTickLabelsField = "year";

  var chartFileName = "data/naaqs/emissions/growth_chart_data.csv";

   var chart = new LineAreaChart("growth-chart",125,1.2,null); //passing the min height for the chart
   chart.margin.top = 10;
   chart.useTransitions = false;
   
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   chart.useRelativeTooltip=true;
   chart.tooltip.data.units = '%';
   chart.tooltip.data.digits=0; 

   if (yRange) chart.yTickValues = chart.generateTickValues(yRange);
   if (xTickValues) chart.xTickValues = xTickValues;

   chart.title.text = 'Comparison of Growth Areas and Declining Emissions<br/><span class="etrends-chart-title-subtitle">1970-2024</span>';
   chart.ytitle.text='Percent Change'
   chart.ytitle.units=''
   
   //Really? They call year Categories? Huh?
   chart.xField = "Index";
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

//just for convenience define these monster functions at the bottom   
  chart.drawPaths = function () {
    chart.drawLines();
	//Draw standard
    chart.standardLine = d3.svg.line()
      .x(function (d) { return chart.xScale(d[chart.xField]); })
      .y(function (d) { return chart.yScale(chart.standard); });

    drawStandardLine(chart.standardLine,chart.yScale,chart.yDomain)

    function drawStandardLine(standardLine,yScale,yDomain) {
      chart.svg.append('path')
        .attr('class', 'etrends-chart-line-standard')
        .attr('d', standardLine)
        .attr('clip-path', 'url(#rect-clip)');
        
    //If y max is standard then move label underneath line
      if (chart.standard==yDomain[1] ) {         
        label.attr("y", yScale(chart.standard) + label.node().getBBox().height + 0*chart.percentSize )
      }
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

  chart.namespace = 'etrends.growth.chart';

  chart.addSeriesField('name',['Gross Domestic Product','Vehicle Miles Traveled','Population','Energy Consumption','CO2 Emissions','Aggregate Emissions (Six Common Pollutants)']);
  chart.addSeriesField('class',['GrossDomesticProduct','VehicleMilesTraveled','Population','EnergyConsumption','CO2Emissions','AggregateEmissions']);
  //could also pass the length but it gets it from series if not passed
  //chart.initSeriesField('isSecondary',false.chart.series.length);
  var chartSymbols = [];
  chartSymbols.push({id:'growth-GDP',scale:.75});
  chartSymbols.push({id:'growth-VehicleMilesTraveled',scale:.75});
  chartSymbols.push({id:'growth-Population',scale:.75});
  chartSymbols.push({id:'growth-EnergyConsumption',offsetx:0,offsety:0,scale:.75});
  chartSymbols.push({id:'growth-CO2',scale:.75});
  chartSymbols.push({id:'growth-AggregateEmissions',offsetx:0,offsety:0,scale:.76});

  chart.addSeriesField('symbol',chartSymbols);

  //Add the series data to tooltip data so it can loop over it
  chart.tooltip.data.series = chart.series;

  chart.export.fileName = 'growth-data';

  chart.legend.ncols = null;
  chart.legend.cellWidth = 20;
  chart.legend.cellHeight = 20;
  chart.legend.cellSpacingX = 10; 
  chart.legend.AllowHiddenSeries = true;
  chart.legend.type = 'line';

  //Mabye have this set to width of vertical line later possibly
  chart.tooltip.offset = {x:20,y:20};

  //Have to customize the SVG export elements because we don't want the standard legend at bottom to be included
  chart.export.svgExportElements = function () {return [chart.title.svg.node(),chart.svgBottom.node()]};

  //try to delay chart redraw because it window sizes taking too long to refresh and chart not ready for chart to draw
  chart.resize = function () {
    var $chartContainer = $("#" + chart.domID + "-container");
//    $chartContainer.hide();
    chart.makeChart();
    setTimeout(function () {
//      $chartContainer.show();
//      chart.makeChart();
    },0)
  }

  var args = {};
  args.file = chartFileName;
  args.done = function (cacheData) {
    //in case we start caching this sometime won't accidentally override cache each time
    data = $.extend(true,[],cacheData);
    xTickValues = xTickLabels.map(function () {return null});

    data = data.map(function (d,i) {
      Object.keys(d).forEach(function (key,i) {
        //every column except x value must be multiplied by 100 to get Percent
        if (key !== chart.xField && key !== xTickLabelsField) {
          d[key] = d[key]*100;
        }
      });
      //Also add a new column which is index or rownumber - 1
      d.Index = i;
      var xTickLabelIndex = xTickLabels.indexOf(d[xTickLabelsField]);
      if (xTickLabelIndex>=0) xTickValues[xTickLabelIndex] = d.Index;
      return d;
    });  

    chart.xTickValues = xTickValues;
    chart.data = data;
//convert data to 100%    
    chart.makeChart();
//Add a scroll magic trigger to redraw with animation. Note: have to do this after chart drawn first time because trigger clears old chart stuff.
	chart.addChartRedrawTrigger();
  }

  chart.externalMakeChart = function () {      
    //Just a hack to remove y-axis lines. Arthur didn't want them
    //Find them in dom and hide them
    tweakYaxis("#" + chart.domID + " .y.etrends-chart-axis")
    function tweakYaxis(yAxis) {
      $(yAxis + " .domain").hide();
      //Tack on percent to the tick values
      d3.selectAll(yAxis + " .tick text").html(function (val,i) {
        return val + '%'
      })
    }
    //Give the x axis proper labels since it is skewed    
    d3.selectAll("#" + chart.domID + " .x.etrends-chart-axis .tick text").text(function (val,i) {
//    d3.selectAll("#" + chart.domID + " .x.etrends-chart-axis .tick text").html(function (val,i) {
      return xTickLabels[i];
    })
    //Also just expport hard coded imiage for IE instead of generating from what on screen
    if (etrends.library.utilities.BrowserType.ie || etrends.library.utilities.BrowserType.edge) {
      chart.export.tooltip.customRender = function () {
        var exportPNG = chart.export.tooltip.div.select(".exportPNG")
        exportPNG.attr("onclick","etrends.growth.chart.export.downloadFile('img/growth-data.png')");        
      };
    }
    
  }

  chart.makeChart = function () {
    //Total hack but need to call the base makeChart twice
    //Can figure out why it isn't drawing right the first time later 
    LineAreaChart.prototype.makeChart.apply(chart,arguments);
    //Call again so baby legend fits
    LineAreaChart.prototype.makeChart.apply(chart,arguments);
  };

  //add extra stuff after makeChartSingle for drawing baby graphics
  chart.makeChartSingle = function (drawOrder) {
    //Kind of hack but have to have chart legend showing before hiding after it is drawn
    //It was breaking stuff in FireFox
    var $legendContainer = $("#" + chart.domID + "-container .etrends-chart-legend");
    $legendContainer.show();

    //Call the base makeChartSingle that is being overridden
    LineAreaChart.prototype.makeChartSingle.apply(chart,arguments);

    $legendContainer.hide();

    //Add the baby stuff after chart is drwan
    var babyLegendGroup = chart.svg.append("g").attr("class","etrends-growth-babyLegend");
    //save this for second draw
    etrends.growth.babyLegend.element = babyLegendGroup;

    //generate clickHandlers
    var clickHandlers = chart.series.map(function (seriesItem,i) {
      var legendItem = chart.legend.items[seriesItem.name];
      //use standard legend click handler. assumes baby legend in same order as standard chart legend.
      return function (cell,i) {
        cell.disabled = ! cell.disabled;
        legendItem.group.on("click")();
      }
    });

    etrends.growth.babyLegend.add(babyLegendGroup,clickHandlers);
    
    var babyWidthOverHeight = etrends.growth.babyLegend.width/etrends.growth.babyLegend.height;
    var chartWidthOverHeight = 1/chart.heightOverwidth;
    var chartHeightAfterBaby = (chart.width-chart.marginCorrected.left)/(chartWidthOverHeight+babyWidthOverHeight);

    var scale = chartHeightAfterBaby / etrends.growth.babyLegend.height;
    //save this for second draw
    etrends.growth.babyLegend.scale = scale;
//    scale = 1;
    //get the right most location of the x axis
    //but scale down by how chart height is changing after baby added
    //couldn't get this to work
    var xAxisBCR = etrends.growth.chart.xAxisElement.node().getBoundingClientRect()
    var chartBCR = etrends.growth.chart.svg.node().getBoundingClientRect()    
    var translateX =  (xAxisBCR.right - chartBCR.left) * chartHeightAfterBaby/chart.chartHeight ;
    //above didn't really work. just translate by chart width + baby legend margin scaled
    translateX = chart.chartWidth;

    babyLegendGroup.attr("transform","translate(" + translateX + ",0)scale(" + scale + ")");
    //update the marginCorrected for the right margin
    
    chart.marginCorrected.right = scale*etrends.growth.babyLegend.width;        
  }

  etrends.library.utilities.loadMapOrGraph(args,D3QueueCallback);
  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to etrends.naaqs  object if neccesary but this should work for now.
  etrends.growth.chart=chart;
};
//# sourceURL=growth.js