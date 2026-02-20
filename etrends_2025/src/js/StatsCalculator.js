if (! etrends) var etrends = {};
if (! etrends.library) etrends.library = {};

etrends.library.StatsCalculator = function (yearRange,yearPrefix,percentileType) {
  this.yearRange = yearRange;
  this.yearPrefix = yearPrefix;
  //Use SAS-5 percentiles by default becuase that is what they have always used
  //Currenlty supported are Inc (Excel Inc), Exc (Excel Exc), Sas3 and Sas5
  this.percentileType = percentileType || 'Sas5';
}

etrends.library.StatsCalculator.prototype.interpolateConcentrations = function(data,filter) {
  var self = this;
  var start = new Date();
  if (! data) return null;
//Have to interpolate over time serie for each location
  var interpolatedData = [];
  var nYears = self.yearRange[1]-self.yearRange[0]+1;
  var timeSeries = new Array(nYears);
  var interpolatedSite;
  
  var gapcount=0;

//Might want to filter by a field such as "trendsite"
  var filterData = data;
  if (filter) filterData = data.filter(filter);

  filterData.forEach(function (site) {
//get time series
    var year;
    var hasGaps=false;
    for (var i=0; i < nYears; i++) {
      year = self.yearRange[0]+i;
      var value = parseFloat(site[self.yearPrefix + year]); 
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
    if (hasGaps)  timeSeries = self.interpolateTimeSeries(timeSeries);

//could possibly copy passed in "site" row also but don't want to write over passed in data so would need clone like jquery.extend
    interpolatedSite={};
    for (var i=0; i < nYears; i++) {
      year = self.yearRange[0]+i;
      interpolatedSite[self.yearPrefix + year] = timeSeries[i];
    }

    interpolatedData.push(interpolatedSite);
  });
//  console.log("interp time " + (new Date()-start));
//  console.log("gap count " + gapcount);

  return interpolatedData;
}

etrends.library.StatsCalculator.prototype.interpolateTimeSeries = function (timeSeries) {
  if (! timeSeries) return null;
//Have to interpolate over time serie for each location
//First use constant extrapolation for missing endpoints
  var left=timeSeries[0];
  var right=null;
  var missing=0;
  var interpolated = new Array(timeSeries.length);
  
  timeSeries.forEach(function (value,i) {
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
      if (i===timeSeries.length-1) d3.range(missing).forEach(function (j) {interpolated[i+j-missing+1]=left;})   
    }
  });
  
//now return interpolated timeSeries
  return interpolated;
}

etrends.library.StatsCalculator.prototype.generateSummaryStats = function(data) {
  var self = this;
//Have to get the stats for each year and add to array
//loop over years
  var stats = [];
  var yearSites; var yearStats;
  for (var year = self.yearRange[0]; year <= self.yearRange[1]; year++) {
//now map data for this year to an array    
    yearSites = data.map(function (site) {
      return parseFloat(site[self.yearPrefix + year]);
    }).filter(function (value) {
      return (value || value===0);
    });
//now get the different stats
    yearStats = {year:year};
    yearStats.count = yearSites.length;
    yearStats.avg = d3.mean(yearSites);
    yearStats.min = d3.min(yearSites);
    yearStats.max = d3.max(yearSites);
//now sort site values. Note need it to sort numerically not alphabetically
    yearSites.sort(function(a, b){return a-b});
//Determine which percentile function to use
    var percentileFunction = self['getPercentile_' + self.percentileType];    
//Now use SAS-5 becuase that is what they have always used
    yearStats.p10 = percentileFunction.call(self,yearSites,.1);
    yearStats.median = percentileFunction.call(self,yearSites,.5);
    yearStats.p90 = percentileFunction.call(self,yearSites,.9);
    
    stats.push(yearStats);
  }  

  return stats;  
}

etrends.library.StatsCalculator.prototype.getPercentile_Inc = function(data,p) {
//the d3.quantile is R7 routine that is equivalent to excel PERCENTILE.INC()
  return d3.quantile(data,p)
}

etrends.library.StatsCalculator.prototype.getPercentile_Exc = function(data,p) {
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

etrends.library.StatsCalculator.prototype.getPercentile_Sas3 = function(data,p) {
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

etrends.library.StatsCalculator.prototype.getPercentile_Sas5 = function(data,p) {
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

  if (this.isInteger(h)) {
//    console.log("n h hInt data[h-1] data[h] " + n + ' ' + h + ' ' + data[h-1] + ' ' + data[h]);
    return (data[h-1] + data[h])/2;    
  } else {
    hInt = Math.ceil(h);
//    console.log("n h hInt data[hInt-1] " + n + ' ' + h + ' ' + hInt + ' ' + data[hInt-1]);
    return data[hInt-1];    
  }
}

etrends.library.StatsCalculator.prototype.isInteger = function(value) {
  var x;
  if (isNaN(value)) {
    return false;
  }
  x = parseFloat(value);
  return (x | 0) === x;
}
//# sourceURL=StatsCalculator.js