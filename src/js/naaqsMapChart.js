var naaqsMapChart = {};
(function () {
  var defaultMinYear = 1990;
	var yearRange = [defaultMinYear,2015];
  //Set the number of years between each tick. If set to null then it will be automatically calculated
  //Note when 2016 report comes out tick size of 2 will only have perfect endpoints for 1990-2016 but 4 would work for 2000-2016
  var xTickSize = 5;
  var pollutantDropdown = d3.select("#naaqs-pollutant-dropdown").node(); 
  var currentPollutant = pollutantDropdown.options[pollutantDropdown.selectedIndex].value || 'co';
//   currentPollutant = 'co';
	var autoPlay = false;

//This is place to store summary stat information once it is calculated
  var summaryStats = {};
    
//Set up the Map parameters for each pollutant  
  var pollutantData = {};
  pollutantData.symbology = {colors:[
    d3.rgb(13,47,140), 
	d3.rgb(39,107,191),
	d3.rgb(196,232,176),
	d3.rgb(255,255,204)
    
    
       
  ]};
	  
	pollutantData.co = {file:"1990-2015/co.csv",title:"CO 8-hour Concentration",standard:9,units:"ppm",digits:1,pollutantLabel:"CO"}
  pollutantData.co.breaks = [4.4,9.4,12.4];  
  pollutantData.co.emissions = [{file:"co.csv",title:"CO Emissions"}];

//Note used unicode characters to get subscripts for svg in charts  
  pollutantData.pb = {file:"1990-2015/pb.csv",title:"Lead 3-month Concentration",standard:.15,units:"\u03BCg/m\u00B3",digits:2,pollutantLabel:"Lead"}
  pollutantData.pb.breaks = [.07,.15,1.0];  
  pollutantData.pb.emissions = [];
  pollutantData.pb.emissionsAlternateText = "As a result of the permanent phase-out of leaded gasoline, controls on emissions of lead compounds through EPA’s air toxics program, and other national and state regulations, airborne lead concentrations in the U.S. decreased 94 percent between 1980 and 2007. Since 1996, national Pb emissions have not changed significantly. In EPA’s most recent national inventory, the 2011 NEI, the highest amounts of Pb emissions are from Piston Engine Aircrafts, and Ferrous and Non-ferrous Metals industrial sources."

//Note used unicode characters to get subscripts for svg in charts  
  pollutantData.no2_mean = {file:"1990-2015/no2_mean.csv",title:"NO<sub>2</sub> Annual Concentration",standard:53,units:"ppb",digits:0,pollutantLabel:"NO<sub>2</sub> Annual"}
	pollutantData.no2_mean.breaks = [26,53,100];  
  pollutantData.no2_mean.emissions = [{file:"nox.csv",title:"NO<sub>x</sub> Emissions"}];
  
  pollutantData.no2_98 = {file:"1990-2015/no2_98.csv",title:"NO<sub>2</sub> 1-hour Concentration",standard:100,units:"ppb",digits:0,pollutantLabel:"NO<sub>2</sub> 1-hour"}
//no2 same for both types
	pollutantData.no2_98.breaks = [53,100,360];
  pollutantData.no2_98.emissions = [{file:"nox.csv",title:"NO<sub>x</sub> Emissions"}];

  pollutantData.ozone = {file:"1990-2015/ozone.csv",title:"Ozone 8-hour Concentration",standard:.07,units:"ppm",digits:3,pollutantLabel:"Ozone"}
  pollutantData.ozone.breaks = [.055,.07,.085];  
  pollutantData.ozone.emissions = [{file:"nox.csv",title:"NO<sub>x</sub> Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.pm10 = {file:"1990-2015/pm10.csv",title:"PM<sub>10</sub> 24-hour Concentration",standard:150,units:"\u03BCg/m\u00B3",digits:0,pollutantLabel:"PM<sub>10</sub>"}
  pollutantData.pm10.breaks = [54,154,254];  
  pollutantData.pm10.emissions = [{file:"pm10.csv",title:"Direct PM<sub>10</sub> Emissions"}];

//  pollutantData.pm25_mean = {file:"1999-2015/pm25_mean.csv",title:"PM\u2082.\u2085 Annual Concentration (480 Sites)",standard:12,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 Mean",minYear:1999}
//Once I make the chart titles HTML I can use this so that subscripts work in IE 11 
  pollutantData.pm25_mean = {file:"2000-2015/pm25_mean.csv",title:"PM<sub>2.5</sub> Annual Concentration",standard:12,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM<sub>2.5</sub> Annual",minYear:2000}
	pollutantData.pm25_mean.breaks = [6.0,12.0,35.5];  
  pollutantData.pm25_mean.emissions = [{file:"pm2_5.csv",title:"Direct PM<sub>2.5</sub> Emissions"},{file:"so2.csv",title:"SO<sub>2</sub> Emissions"},{file:"nox.csv",title:"NO<sub>x</sub> Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.pm25_98 = {file:"2000-2015/pm25_98.csv",title:"PM<sub>2.5</sub> 24-hour Concentration",standard:35,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM<sub>2.5</sub> 24-hour",minYear:2000}
//  pollutantData.pm25_98 = {file:"1999-2015/pm25_98.csv",title:"PM PM\u2082.\u2085 24-hour Concentration (480 Sites)",standard:35,units:"\u03BCg/m\u00B3",digits:1,pollutantLabel:"PM\u2082.\u2085 98th",minYear:1999}

//pm 25 same for both types
	pollutantData.pm25_98.breaks = [12.0,35.4,55.4]
  pollutantData.pm25_98.emissions = [{file:"pm2_5.csv",title:"Direct PM<sub>2.5</sub> Emissions"},{file:"so2.csv",title:"SO<sub>2</sub> Emissions"},{file:"nox.csv",title:"NO<sub>x</sub> Emissions"},{file:"voc.csv",title:"VOC Emissions"}];

  pollutantData.so2 = {file:"1990-2015/so2.csv",title:"SO<sub>2</sub> 1-hour Concentration",standard:75,units:"ppb",digits:0,pollutantLabel:"SO<sub>2</sub>"}
  pollutantData.so2.breaks = [35,75,185];  
  pollutantData.so2.emissions = [{file:"so2.csv",title:"SO<sub>2</sub> Emissions"}];

  var naaqsMap = new ClassifiedPointsMap("naaqsMap");
  naaqsMap.topojson = topojson;
//This variation is needed if map div is relative so that tooltip calculation will use relative calculations
  naaqsMap.useRelativeTooltip=true;

  naaqsMap.init();

//Current Pollutant might have a different min Year then normal like PM 2.5
  yearRange[0]=pollutantData[currentPollutant].minYear || defaultMinYear;
    
  naaqsMap.activeAttribute = "val" + yearRange[0] 
  naaqsMap.tooltip.data = {year: yearRange[0],
    pollutant: pollutantData[currentPollutant].pollutantLabel,
    units: pollutantData[currentPollutant].units,
    pollutantDigits: pollutantData[currentPollutant].digits}; 
  naaqsMap.tooltip.data["f.isHidden"] = function (value) {return value ? "" : "hidden"}; 
//Missing values should say NoData not NaN
   naaqsMap.tooltip.data["f.isMissing"] = function (value) {
     return (value || (value!=="" && value==0)) ? value : "No Data / Incomplete";}; 

  naaqsMap.externalResize = function () {
    setMapTitle();
  };
      
//function that draws location time series on chart when hovering point  
    naaqsMap.externalMouseOver = naaqsMap_externalMouseOver;
    naaqsMap.externalMouseOut = naaqsMap_externalMouseOut;
  
//  d3.select("#mapPollutant").text(pollutantData[currentPollutant].title);
  setMapTitle();
    
  makeEmissionMenu(currentPollutant);
  
//   var concentrationChart = new ConcentrationLineAreaChart();
//Note: need to pass the chart custom tooltip class because there are 2 tooltips on chart (another on legend)
   var concentrationChart = new LineAreaChart("naaqs-concentrationGraph",125,.25,null,"naaqs-tooltip-concentration"); //passing the min height for the chart
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
     if (self.data.length > 0 && "location" in self.data[0]) {
       min = Math.min(min,d3.min(self.data, function (d) {          
//Note only return truthy or zero otherwise it is null and ignored
         return (d.location || d.location===0) ? 1*d.location : null ; }));
       max = Math.max(max,d3.max(self.data, function (d) { 
//Note only return truthy or zero otherwise it is null and ignored
         return (d.location || d.location===0) ? 1*d.location : null ; }));
     }
     min = Math.min(min,d3.min(self.data, function (d) { return 1*d.p10; }));
     max = Math.max(max,d3.max(self.data, function (d) { return 1*d.p90; }))
//have the range between min and max +/- some percent of range. Also make sure min is always >= 0
     return [Math.max(0,min - .1*(max-min)), max + .1*(max-min)]
    };

//just for convenience define these monster functions at the bottom   
  concentrationChart.drawPaths = concentrationChart_drawPaths;
  concentrationChart.addLegend = concentrationChart_addLegend;
   

//   var emissionChart = new EmissionsLineAreaChart();

   var emissionChart = new LineAreaChart("naaqs-emissionGraph",125,.25);
   emissionChart.margin.bottom = 35;
   emissionChart.margin.top = 10;
   emissionChart.useTransitions = false;
//   emissionChart.margin.bottom = 0;
   
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   emissionChart.useRelativeTooltip=true;
//   emissionChart.ytitle.text='Thousands of Tons'
   emissionChart.ytitle.text='Million Tons'
   emissionChart.xField = "year";
   emissionChart.yField = "total";
//Note for emission chart it will possibly lag the concentration chart by a year but in order to get the emission max year to be saem as conc max year set domain here
  emissionChart.getXdomain =  function () {return yearRange};
//This will get the domain when called using the data
  emissionChart.getYdomain =  function (self) {return [0, 1.1*d3.max(this.data, function (d) { return 1*d.total; })]};
//Set the step between ticks or tick size
  emissionChart.xTickSize = xTickSize;
   
//just for convenience define these monster functions at the bottom   
  emissionChart.drawPaths = emissionChart_drawPaths;
  emissionChart.addLegend = emissionChart_addLegend;

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
//Don't do this from file anymore. get starts from location data
//  .defer(makeConcentrationGraphFromFile,currentPollutant,yearRange[0])
  .defer(makeEmissionGraph,currentPollutant,0,yearRange[0])
//for now don't have to filter by min year since doing 1990 to 2015 and have all. still pass null so callback will work
//    .defer(makeConcentrationGraph,currentPollutant,null)
//    .defer(makeEmissionGraph,currentPollutant,0,null)
  .await(playMap);



function onSlide(evt,value) {
//only change map if full year not in between ticks
    if (value==parseInt(value)) {
      naaqsSlider.currentValue = value; //save for playback
      d3.select('#sliderText').text(value);
      naaqsMap.tooltip.data.year = value;
      naaqsMap.changeActiveAttribute("val" + value);
//        console.log("year "  + value);
//snap to wherever the slider is now when moving point
//      concentrationChart.moveLine(value,false);
//      emissionChart.moveLine(value,false);
      concentrationChart.moveLine(parseInt(value),true);
      emissionChart.moveLine(parseInt(value),true);
    }
//console.log("move line -> " + value);
//snap to wherever the slider is now when moving point
//      concentrationChart.moveLine(value,false);
//      emissionChart.moveLine(value,false);
}


//function for handling emission menu
  function makeEmissionMenu(pollutant) {
    var emissionMenu = d3.select("#naaqs-emissionMenu ul");
//clear out menu    
    emissionMenu.selectAll("*").remove();
//loop over the emissions for this pollutant
    pollutantData[pollutant].emissions.forEach(function (emission,i) {
//first item is active by default
      var active=false;
      if (i===0) active=true;        
      emissionMenu.append("li").html(emission.title).classed("active",active).on("click",function () {
        makeEmissionGraph(pollutant,i,yearRange[0]);        
//make all not active and then active to only clicked
        d3.select(this.parentNode).selectAll("li").classed("active",false);        
        d3.select(this).classed("active",true);        
      })
    })
  }

function makeUSmap(pollutant,callback) {
//pass non null pollutant if you want to map pollutant after map is created (on first map)
  d3.json("data/d3/us.json", function (error,us) {
    if (error) {
      if (callback) callback(error);
      return;
    }
//This actually creates state map
    naaqsMap.mapStates(us);
    if (pollutant) {
      makeConcentrationLayer(pollutant,callback)
    }else {
      if (callback) callback(null);      
    }
  });
}

function makeMapOrGraph(args,callback) {
//The callback passed to this is necessary for the queue/deferred stuff to work
  d3.csv(args.csv, function (error, data) {
    if (error) {
      if (callback) callback(error);
      return;
    }

//call the custom actions now
    args.actions(data);      
//if you passed something to call back it will go to await function after defer in order of defer
    if (callback) callback(null);
  });
  
}

function makeConcentrationLayer(pollutant,callback) {
//  console.log('begin with conc layer');
  var args = {};
  args.csv = "data/d3/concentrations/" + pollutantData[pollutant].file;
  args.actions = function (data) {
    naaqsMap.tooltip.data.pollutant=pollutantData[pollutant].pollutantLabel; 
    naaqsMap.tooltip.data.units=pollutantData[pollutant].units;
    naaqsMap.tooltip.data.pollutantDigits= pollutantData[pollutant].digits; 
//Use the breaks for this pollutant
    pollutantData.symbology.breaks = pollutantData[pollutant].breaks;  
    naaqsMap.plotPoints(data,pollutantData.symbology);    
//interpolate the data before generateing the stats
    var interpolatedData = interpolateConcentrations(data);
    
//Now generate the summary stats for this pollutant if it doesn't exist
    if (! summaryStats[pollutant]) summaryStats[pollutant] = generateSummaryStats(interpolatedData);
//    console.log('done with conc layer');


//    console.log(interpolateTimeSeries([null,5,null,7,null]));

    makeConcentrationGraph(currentPollutant);    
  };
  
   makeMapOrGraph(args,callback);
}

function interpolateConcentrations(data) {
  var start = new Date();
  if (! data) return null;
//Have to interpolate over time serie for each location
  var interpolatedData = [];
  var nYears = yearRange[1]-yearRange[0]+1;
  var timeSeries = new Array(nYears);
  var interpolatedSite;
  
  var gapcount=0;

  data.forEach(function (site) {
//get time series
    var year;
    var hasGaps=false;
    for (var i=0; i < nYears; i++) {
      year = yearRange[0]+i;
      var value = parseFloat(site["val"+year]); 
//if value is truthy or zero then assign it to time series value
      if (value || value===0) {
        timeSeries[i] = value;
      }else{
//if value is missing (ie. falsey but not zero) then set it to null
        timeSeries[i] = null;      
        hasGaps=true;
      }     
    }

//get interpolated time series    
    if (hasGaps)  gapcount+=1;

//incredibly strange but this is incredibly slow like 4380 ms vs 446 ms for 458 records with 120 having gaps. crazy.
//I think it was just a chrome thing
//    if (hasGaps) { timeSeries = interpolateTimeSeries(timeSeries);}
    if (hasGaps)  timeSeries = interpolateTimeSeries(timeSeries);

//could possibly copy passed in "site" row also but don't want to write over passed in data so would need clone like jquery.extend
    interpolatedSite={};
    for (var i=0; i < nYears; i++) {
      year = yearRange[0]+i;
      interpolatedSite["val"+year] = timeSeries[i];
    }

    interpolatedData.push(interpolatedSite);
  });
//  console.log("interp time " + (new Date()-start));
//  console.log("gap count " + gapcount);

  return interpolatedData;
}

function interpolateTimeSeries(series) {
  if (! series) return null;
//Have to interpolate over time serie for each location
//First use constant extrapolation for missing endpoints
  var left=series[0];
  var right=null;
  var missing=0;
  var interpolated = new Array(series.length);
  
  series.forEach(function (value,i) {
    interpolated[i]=value;
    if (value===null) missing+=1;
//if not first point and value is not null it will be the right value
//once right value is found we can do stuff and make it the next left value
    if (i>0 && value!==null) {
      right=value;
//first check if left is null. if so then do the constant extrapolation to beginning      
      if (left===null) {
        d3.range(missing).forEach(function (j) {interpolated[j]=right;})   
      }else {
//otherwise interpolate between left and right        
        d3.range(missing).forEach(function (j) {interpolated[i+j-missing]= (j+1)/(missing+1)*(right-left) + left ;})   
      }
//now reset missing and make left = right 
      left=right;
      missing=0;
    }else{
//if this is the end and right is null then extrapolate constant value out to right endpoint
      if (i===series.length-1) d3.range(missing).forEach(function (j) {interpolated[i+j-missing+1]=left;})   
    }
  });
  
//now return interpolated series
  return interpolated;
}

function generateSummaryStats(data) {
//Have to get the stats for each year and add to array
//loop over years
  var stats = [];
  var yearSites; var yearStats;
  for (var year = yearRange[0]; year <= yearRange[1]; year++) {
//now map data for this year to an array    
    yearSites = data.map(function (site) {
      return parseFloat(site["val"+year]);
    }).filter(function (value) {
      return (value || value===0);
    });
//now get the different stats
    yearStats = {year:year};
    yearStats.avg = d3.mean(yearSites);
    yearStats.min = d3.min(yearSites);
    yearStats.max = d3.max(yearSites);
//now sort site values. Note need it to sort numerically not alphabetically
    yearSites.sort(function(a, b){return a-b});
//the d3.quantile is R7 routine that is equivalent to excel PERCENTILE.INC()
//    yearStats.p10 = d3.quantile(yearSites,.1);
//    yearStats.p50 = d3.quantile(yearSites,.5);
//    yearStats.p90 = d3.quantile(yearSites,.9);
//    console.log('year ' + year);
//Now use SAS-5 becuase that is what they have always used
    yearStats.p10 = getPercentile_Sas5(yearSites,.1);
    yearStats.p50 = getPercentile_Sas5(yearSites,.5);
    yearStats.p90 = getPercentile_Sas5(yearSites,.9);
    
    stats.push(yearStats);
  }  

  return stats;  
}

function getPercentile_Exc(data,p) {
//Get percentile using the excel getPercentile.exc routine or R6
  var n = data.length;
  var h = (n + 1)*p

//from p = 0 to 1/(n+1) then return min(data)
  if (h < 1) return data[0];
//from p = n/(n+1) then return max(data)
  if (h > n) return data[n-1];

  var hInt = parseInt(h);
//  console.log("n h hInt data[hInt-1] data[hInt] " + n + ' ' + h + ' ' + hInt + ' ' + data[hInt-1] + ' ' + data[hInt])
//hInt is row starting at 1. need to substract 1 from hInt to get index of data array
  return data[hInt-1] + (h-hInt)*(data[hInt]-data[hInt-1]);
}

function getPercentile_Sas3(data,p) {
//Get percentile using SAS-3 routine
//basically just invert the empirical distribution stair step function.
//ie. Take n*p and round up to nearest integer to get  1-based index. Value at this index is the percentile value. 
  var n = data.length;
  var h = n*p

//now just round UP h and if h < use h=1
//for p = 0 return min(data)
  if (h < 1) return data[0];
  if (h >= n) return data[n-1];

  var hInt = Math.ceil(h);
//  console.log("n h hInt data[hInt-1] " + n + ' ' + h + ' ' + hInt + ' ' + data[hInt-1])

  return data[hInt-1];
}

function getPercentile_Sas5(data,p) {
//Get percentile using SAS-5 routine
//basically just invert the empirical distribution stair step function BUT when h is exact integer then average with neighbor at index+1
//ie. Take n*p and round up to nearest integer if NOT integer to get  1-based index. Value at this index is the percentile value. 
//IF n*p IS an integer then use average of index at that integer and index + 1
  var n = data.length;
  var h = n*p

//now just round UP h and if h < use h=1
//for p = 0 return min(data)
  if (h < 1) return data[0];
  if (h >= n) return data[n-1]; //Note: if h=n there is not h+1 neighbor to average with

  var hInt;

  if (isInteger(h)) {
//    console.log("n h hInt data[h-1] data[h] " + n + ' ' + h + ' ' + data[h-1] + ' ' + data[h]);
    return (data[h-1] + data[h])/2;    
  } else {
    hInt = Math.ceil(h);
//    console.log("n h hInt data[hInt-1] " + n + ' ' + h + ' ' + hInt + ' ' + data[hInt-1]);
    return data[hInt-1];    
  }
}

function isInteger(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
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

function makeConcentrationGraphFromFile(pollutant,minYear,callback) {
  var args = {};
  args.csv = "data/d3/concentrations/summarystats/" + pollutantData[pollutant].file;
  args.actions = function (data) {
//filter by year range
    if (minYear) data = data.filter(function (d) {return d.year >= minYear});

    concentrationChart.data = data;
    concentrationChart.standard = pollutantData[pollutant].standard;
    
    concentrationChart.title.text = pollutantData[pollutant].title;
    concentrationChart.ytitle.text='Concentration (' + pollutantData[pollutant].units + ')'
    concentrationChart.tooltip.data.pollutantDigits= pollutantData[pollutant].digits; 
    concentrationChart.tooltip.data.units = pollutantData[currentPollutant].units;
    
    concentrationChart.makeChart(data);

  };
  
   makeMapOrGraph(args,callback);
}

function makeEmissionGraph(pollutant,emissionIndex,minYear,callback) {
//If not emissions then hide this div and exit
  var hasEmissions = pollutantData[pollutant].emissions.length>0; 
  d3.select("#naaqs-emissionGraph").style('display', hasEmissions ? '' : 'none');
  d3.select("#naaqs-emissionGraph-container #naaqs-chart-legend").style('display', hasEmissions ? '' : 'none');  
  d3.select("#naaqs-emissionGraph-container .naaqs-chart-title").style('display', hasEmissions ? '' : 'none');  
  d3.select("#naaqs-emissionGraph-container #naaqs-emission-alternateText").style('display', 'none');
  if (! hasEmissions) {
//for things like Lead with no emissions show a message
    if (pollutantData[pollutant].emissionsAlternateText) {
      d3.select("#naaqs-emission-alternateText").style('display', '');
      d3.select("#naaqs-emission-alternateText").html(pollutantData[pollutant].emissionsAlternateText);
    } 
//If not drawing graph then still exec callback to that await function will exec
    if (callback) callback(null);
    return;
  }  
  var args = {};
  args.csv = "data/d3/emissions/" + pollutantData[pollutant].emissions[emissionIndex].file;  
  args.actions = function (data) {
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

  };
  
   makeMapOrGraph(args,callback);
}


function playMap(error)  {
    if (error) {
      console.error("Error loading charts: ");
      console.error(error);
      return;
    }      
//set up so that the 2 charts tooltips both come up when hovering over one
//note since nothing is passed it will not render or move just hide/show (tooltip is already rendered and moved and line/point is moved)
    concentrationChart.externalMouseOver = function () {emissionChart.tooltip.showToolTip(null,emissionChart.dragArea.node())};
    concentrationChart.externalMouseOut = function () {emissionChart.tooltip.hideToolTip()};
    emissionChart.externalMouseOver = function () {concentrationChart.tooltip.showToolTip(null,concentrationChart.dragArea.node())};
    emissionChart.externalMouseOut = function () {concentrationChart.tooltip.hideToolTip()};
  
    naaqsSlider.moveSlider(naaqsSlider.currentValue);

    if (autoPlay===true) naaqsSlider.play();
} 

function switchPollutant(pollutant) {
//save this globally so that it can be used later
  currentPollutant = pollutant;
  //d3.select("#mapPollutant").text(pollutantData[pollutant].title);  
  setMapTitle(pollutant);

  makeEmissionMenu(pollutant);
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
  naaqsMapChart.naaqsMap.closeToolTip();
  
//Make maps and charts  async  
  d3_queue.queue()
    .defer(makeConcentrationLayer,pollutant)
//Don't do this from file anymore. get starts from location data
//    .defer(makeConcentrationGraphFromFile,currentPollutant,yearRange[0])
    .defer(makeEmissionGraph,currentPollutant,0,yearRange[0])
    .await(function () {
//Wait to move the slider until everything is drawn so that things are in correct places
//Also make sure the currentValue is an integer so we are not starting partway through step
      naaqsSlider.moveSlider(parseInt(naaqsSlider.currentValue));
//      console.log("pollutant swtiched");
      });
} 

function setMapTitle() {
    var mapTitle = d3.select("#mapPollutant");
    mapTitle.html(pollutantData[currentPollutant].title);
    mapTitle.style("font-size","");
    var maxFontSize = parseInt(mapTitle.style("font-size"));
    var available = $("#naaqs-map-title").width() - 3.5 * $("#naaqs-map-home").width();
    var scale = Math.max(1,$("#mapPollutant").width() / available);
    mapTitle.style("font-size",maxFontSize/scale + "px");
}

function naaqsMap_externalMouseOver(locationData) {
//this is run in context of concentrationChart
    var self = concentrationChart;

    self.data.forEach(function (item,index) {
      self.data[index].location = locationData["val" + item.year];
    });
     
    self.locationLine = d3.svg.line()
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.location!==""      
    .defined(function(d) { return (d.location || (d.location!=="" && d.location==0)) ? true : false; })
    .x(function (d) { return self.xScale(d.year); })
    .y(function (d) { return self.yScale(d.location); });    

   self.makeChart(self.data);
   
//put this in it's own function so it can be redrawn on resize  
    concentrationChart_drawSelectedLocationLline(locationData);                
    
//refresh the tooltip to show the data for the hovered map location in there
//easiest way to do this is just run the moveline function again for the current x value
    self.moveLine(self.currentX);
}

function concentrationChart_drawSelectedLocationLline() {
//this is run in context of concentrationChart
    var self = concentrationChart;

    self.svg.datum(self.data);
    
    self.locationLineElement = self.svg.append('path')
      .attr('class', 'naaqs-chart-line-location')
      .attr('d', self.locationLine)
      .attr('clip-path', 'url(#rect-clip)');

// add points to line now
//first get the size of the point on small screens
    var minReduction = .25; //this is reduction of point at percentSize=0
    var scaleFactor = Math.min(1,(1-minReduction)*self.percentSize + minReduction);

//     self.locationLinePoints = self.locationLineElement.append("g")
    self.locationLinePoints = self.svg.append("g")
    .attr("class", "naaqs-chart-point-location")
    .selectAll(".dot")
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.location!==""      
    .data(self.data.filter(function(d) { return (d.location || (d.location!=="" && d.location==0)) ? true : false;}))
    .enter().append("circle")
	.attr('class', 'dot')
    .attr("yval",function(d) { return d.location; })
    .attr("cx", function(d) { return self.xScale(d.year); })
    .attr("cy", function(d) { return self.yScale(d.location); });  

//reset point size to what is in css and then get css point size    
    self.locationLinePoints.style("r",null);
    var pointSize = self.locationLinePoints.style("r");
//if browser such as FF does not support radius r to be set with css then fall back to pointSize set on graph object
    if (! pointSize) pointSize=self.pointSize;    
    var scaledPointSize = parseInt(pointSize)*scaleFactor + "px";
    self.locationLinePoints.style("r",scaledPointSize);
//setting r using css doesn't work for some browsers like FF so have to make it an attribute
    if (! self.locationLinePoints.style("r")) self.locationLinePoints.attr("r",scaledPointSize);
}

function naaqsMap_externalMouseOut(d) {
  var self = concentrationChart;
  
  self.locationLine = null;
  if (self.locationLineElement) self.locationLineElement.remove();
  if (self.locationLinePoints) self.locationLinePoints.remove();
//remove selected location data so it won't be on tooltip
  self.data.forEach(function (item,index) {
//    self.data[index].location = null;
//delete actual attribute so that null is not suse to min y min/max
    delete self.data[index].location;
  });
  self.svg.datum(self.data);
  
   self.makeChart(self.data);
  
//refresh the tooltip to NOT show the data for the hovered map location in there
//easiest way to do this is just run the moveline function again for the current x value
  self.moveLine(self.currentX);
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
    
      self.svg.append('path')
        .attr('class', 'naaqs-chart-area naaqs-chart-percentile')
        .attr('d', self.percentileArea)
        .attr('clip-path', 'url(#rect-clip)');
    
      self.svg.append('path')
        .attr('class', 'naaqs-chart-line-average')
        .attr('d', self.averageline)
        .attr('clip-path', 'url(#rect-clip)');
    
      self.svg.append('path')
        .attr('class', 'naaqs-chart-line-standard')
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
            
//Now draw the location line if it is showing
      if (self.locationLine)  concentrationChart_drawSelectedLocationLline();            
    };

function concentrationChart_addLegend() {

//try the legend on bottom
  this.legend = this.svg.append('g')
    .attr('class', 'naaqs-chart-legend');

  var legPercentileBox = this.legend.append('rect')
    .attr('class', 'naaqs-chart-percentile')
    .attr('width',  20)
    .attr('height', 20)
    .attr('x', 0)
    .attr('y',0);

//Set the id of tooltip div for the legend since the default "naaqs-tooltip" is for the chart 
  var legPercentileTip = new MapChartTooltip(this,"naaqs-tooltip-legend");  
  legPercentileTip.offset = {x:15,y:-10};

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

  this.legend.append('text')
    .attr('x', 25)
    .attr('y', 15)
    .text('90%ile - 10%ile');

  this.legend.append('path')
    .attr('class', 'naaqs-chart-line-average')
    .attr('d', 'M125,10L145,10');

  this.legend.append('text')
    .attr('x', 150)
    .attr('y', 15)
    .text('National Average');

  this.legend.append('path')
    .attr('class', 'naaqs-chart-line-location')
    .attr('d', 'M270,10L290,10');

  this.legend.append('text')
    .attr('x', 295)
    .attr('y', 15)
    .text('Selected Site');

//center the legend
//  this.legend.attr('transform', 'translate(' + (this.chartWidth - this.legend.node().getBBox().width)/2 + ', ' + (this.chartHeight+2*this.legend.node().getBBox().height) + ')');


  //shrink the legend if it is not fitting on chart width
    var scaleLegend = this.chartWidth/this.legend.node().getBBox().width;
    if (scaleLegend < 1) {
//Fit to entire width if shrinking it even after 2 cols      
      scaleLegend = Math.min(1,this.width/this.legend.node().getBBox().width);
//Shrink even more just to assure it fits space       
      scaleLegend = .9 * scaleLegend;
      this.legend.attr("transform", "translate(" + [-this.margin.left + (this.width - scaleLegend*this.legend.node().getBBox().width)/2,this.chartHeight+2*this.legend.node().getBBox().height] + ")scale(" + scaleLegend  + ")")
    }else {
  //center the legend
      this.legend.attr('transform', 'translate(' + (this.chartWidth - this.legend.node().getBBox().width)/2 + ', ' + (this.chartHeight+2*this.legend.node().getBBox().height) + ')');    
    }
}


  function emissionChart_drawPaths() {
  var self=this;
//Draw area
  this.stationaryArea = d3.svg.area()
//    .interpolate('basis')
    .x (function (d) { 
      return self.xScale(d.year); })
    .y0(function (d) { 
      return self.yScale(0); })
    .y1(function (d) { return self.yScale(1*d.stationary); });

  this.industrialArea = d3.svg.area()
//    .interpolate('basis')
    .x (function (d) { 
      return self.xScale(d.year); })
    .y0(function (d) { 
      return self.yScale(1*d.stationary); })
    .y1(function (d) { return self.yScale(1*d.stationary+1*d.industrial); });

  this.highwayArea = d3.svg.area()
//    .interpolate('basis')
    .x (function (d) { 
      return self.xScale(d.year); })
    .y0(function (d) { 
      return self.yScale(1*d.stationary+1*d.industrial); })
    .y1(function (d) { return self.yScale(1*d.stationary+1*d.industrial+1*d.highway); });

  this.nonroadArea = d3.svg.area()
//    .interpolate('basis')
    .x (function (d) { 
      return self.xScale(d.year); })
    .y0(function (d) { 
      return self.yScale(1*d.stationary+1*d.industrial+1*d.highway); })
    .y1(function (d) { return self.yScale(1*d.stationary+1*d.industrial+1*d.highway+1*d.nonroad); });

//Draw line
  this.totalLine = d3.svg.line()
//    .interpolate('basis')
    .x(function (d) { return self.xScale(d.year); })
    .y(function (d) { return self.yScale(1*d.total); });


  this.svg.datum(this.data);

  this.svg.append('path')
    .attr('class', 'naaqs-chart-area naaqs-chart-stationary')
    .attr('d', this.stationaryArea)

  this.svg.append('path')
    .attr('class', 'naaqs-chart-area naaqs-chart-industrial')
    .attr('d', this.industrialArea)

  this.svg.append('path')
    .attr('class', 'naaqs-chart-area naaqs-chart-highway')
    .attr('d', this.highwayArea)

  this.svg.append('path')
    .attr('class', 'naaqs-chart-area naaqs-chart-nonroad')
    .attr('d', this.nonroadArea)

  this.svg.append('path')
    .attr('class', 'naaqs-chart-line-total')
    .attr('d', this.totalLine)
};



  function emissionChart_addLegend() {
  //Do the legend for emissions
    this.legendContainer = 	d3.select("#" + this.domID + "-container #naaqs-chart-legend");
    var legendY;

    if (this.legendContainer.empty()) {
      if (this.legend) {
        this.legend.selectAll("*").remove();
      }else{
        this.legend = this.svg.append('g')      
          .attr('class', 'naaqs-chart-legend naaqs-chart-emissions');              
      }  
    }
  
    var items = [];
    items.push({class:'naaqs-chart-stationary',
                text1:'Stationary Fuel',
                text2:'Combustion'
                });

    items.push({class:'naaqs-chart-industrial',
                text1:'Industrial and',
                text2: 'Other Processes'
                });

    items.push({class: 'naaqs-chart-highway',
                text1: 'Highway',
                text2: 'Vehicles'
                });

    items.push({class: 'naaqs-chart-nonroad',
                text1: 'Non-Road',
                text2: 'Mobile'
                });
    
//    emissionChart_createLegend(this,items,2,legendY);    
    emissionChart_createLegend(this,items,null,legendY);    
  }
  
  function emissionChart_createLegend(self,items,ncols,legendY) {
    if (! ncols) ncols=items.length;
    
    var cellWidth = 25;
    var cellSpacing = 15;
    var collWidths = [];

//Remove existing legends
    if (self.legendContainer.empty()) {
      if (self.legend) self.legend.selectAll("*").remove();
      legendY = self.chartHeight + 35;
    }else{
      self.legendContainer.selectAll("*").remove();
      self.legendSvg = self.legendContainer.append('svg')
        .attr('width',  self.width)
        .attr('height', 200);
//Need to keep ref to svg and a translated group for centering easier. the legend group itself is group in self.legend
      self.legendSvgGroup = self.legendSvg  
        .append('g')
             .attr('transform', 'translate(' + self.margin.left + ',' + 0 + ')');

      self.legend = self.legendSvgGroup.append('g');

      legendY = 0;
    }

    var cellCount=0;
    var cellX=0;
    var cellY=0;
    var row=0;
    var column=0;
    items.forEach(function (item) {
      if (cellCount===0) {
      }else if(cellCount%ncols===0) {
        cellY+= cellWidth + 10;
        cellX = 0;
        row += 1;
        column = 0;        
      }else{
        if (row===0) collWidths[column]= self.legend.node().getBBox().width + cellSpacing;
        cellX = collWidths[column];        
        column +=1;
      }              
  
      this.rect = self.legend.append('rect')
          .attr('class', item.class)
          .attr('width',  cellWidth)
          .attr('height', cellWidth)
          .attr('x', cellX)
          .attr('y',cellY);
  
      this.text1 = self.legend.append('text')
            .attr('x', cellX + cellWidth+cellSpacing)
            .attr('y', cellY + 10)
            .text(item.text1);
        
      this.text2 = self.legend.append('text')
            .attr('x', cellX + cellWidth+cellSpacing)
            .attr('y', cellY + 25)
            .text(item.text2);
          
      cellCount +=1;
    });
  
//Make this again with 2 cols if it doesn't fit
    if (self.legend.node().getBBox().width > self.width && ncols===items.length) {
      return emissionChart_createLegend(self,items,2,legendY);
    }
    
  //shrink the legend if it is not fitting on chart width
    var scaleLegend = self.chartWidth/self.legend.node().getBBox().width;
    if (scaleLegend < 1) {
//Fit to entire width if shrinking it even after 2 cols      
      scaleLegend = Math.min(1,self.width/self.legend.node().getBBox().width);
      self.legend.attr("transform", "translate(" + [-self.margin.left + (self.width - scaleLegend*self.legend.node().getBBox().width)/2,legendY] + ")scale(" + scaleLegend  + ")")
    }else {
  //center the legend
      self.legend.attr('transform', 'translate(' + (self.chartWidth - self.legend.node().getBBox().width)/2 + ', ' + (legendY) + ')');    
    }
    if (self.legendSvg) self.legendSvg.attr('height', self.legend.node().getBBox().height);    
    
  }  
  
//Here I'll expose some stuff to the outside. probably could have attahced everything in here to naaqsMapChart object if neccesary but this should work for now.
  naaqsMapChart.switchPollutant=switchPollutant;
  naaqsMapChart.naaqsMap=naaqsMap;
  naaqsMapChart.concentrationChart=concentrationChart;
  naaqsMapChart.emissionChart=emissionChart;
})()
