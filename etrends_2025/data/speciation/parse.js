var csvLib = require('csv');
//This could be used to convert js object to csv
//Q.ninvoke(csvLib, 'stringify', testObj, {})

var fs = require('fs');
var Q =  require('q');
var async =  require('async');

var infile = "site_quarterly_spec_withSiteName_2000-2024_wcompleteness.csv";

var outfilebase = 'concentrations';
var monitorfile = 'monitors.json';

//var infile = "test-site_quarterly_spec_withSiteName_2006-2015.csv";
//var outfilebase = 'test-concentrations';
//var monitorfile = 'test-monitors.json';

var count = null;
var delimiter = '|';
var siteIdField = 'site_id';
var yearField = 'year';
var quarterField = 'quarter';

var monitorFields = [siteIdField,'state_code','county_code','site_code','latitude','longitude','local_site_name','city','state','complete_site'];
var speciesList = ['Sea-salt','Crustal','OrganicCarbon','ElementalCarbon','Nitrate','Sulfate'];

var monitors = {};
var monitorsSiteIDs = [];

var concentrations = {};

var sitesMissingSeasonCount = 0;
//if you don't want monitors that don't have any data to be in monitors.json set this to true
var ExcludeMonitorsWithNoData = true;

run();

function run() {
  Q.ninvoke(fs, 'readFile', infile,'utf8')
    .then(function (text) {
      return Q.ninvoke(csvLib, 'parse', text, {
        //Note: make sure the header doesn't have spaces in names
        columns:function (header) {return header.map(function (field) {return field.replace(/ /g,"")})}
        ,delimiter: delimiter})
    })
    .then(function (rows) {
      var subset = rows;
      if (count) subset = rows.slice(0,count);
//      console.log(subset);
      return subset;
    })
    .then(loopOverTextFileRows)
//This to loop over each site to save concentration files
    .then(loopOverSites)
    .then(function () {
      console.log("rows handled");
      var monitorsSiteIDsExcluded = monitorsSiteIDs;
      if (ExcludeMonitorsWithNoData) monitorsSiteIDsExcluded = filterMonitorWithNoData(monitorsSiteIDs);
      console.log("# ExcludeMonitorsWithNoData = " + monitorsSiteIDsExcluded.length);
      var monitorRows = monitorsSiteIDsExcluded.map(function (siteID) {return monitors[siteID];});
      return Q.ninvoke(fs,'writeFile',monitorfile,JSON.stringify(monitorRows));
    })
    .catch(function (err) {
      console.error('Error converting big json to row json: ' + err.stack );
    })
    .done(function () {
      console.log("sitesMissingSeasonCount: " + sitesMissingSeasonCount);
      process.exit();
    });
}

function loopOverTextFileRows(rows) {
  var defer = Q.defer();

  async.eachSeries(rows,function (row,done) {
//    console.log(i);
    handleTextFileRow(row)
      .then(function () {
        done();
      })
      .catch(function (error) {
        done(error);
      });
  },function (error) {
    if (error) return defer.reject(error);
//    console.log(Object.keys(concentrations).length);
    defer.resolve();
  });

  return defer.promise;
}

function handleTextFileRow(row) {
  //just doing this so it returns a promise
  return Q.fcall(function () {
    row[siteIdField] = row.state_code + '-' + row.county_code + '-' + row.site_code;
    var siteId = row[siteIdField];
    var season = 'Q' + row[quarterField];
    if (! concentrations[siteId]) {
      concentrations[siteId]={};
    }

    if (! concentrations[siteId][season]) {
      concentrations[siteId][season] = [];
    }

    yearlyConcentrations = concentrations[siteId][season];

    yearConcentrations = {Season:season};
	yearConcentrations[yearField] = row[yearField];
	
    //Loop over species and add to concentrations for this year
  //  speciesList.forEach(function (species) {
  //    yearConcentrations[species] = row.species;
  //  });

    speciesList.reduce(function (acc,species) {
      //If value is not numerice like empty string, etc then convert to null
      acc[species]=convertToNumber(row[species]);
      return acc
    },yearConcentrations);


    concentrations[siteId][season].push(yearConcentrations);
  //  yearlyConcentrations.push(yearConcentrations);

    //if monitor NOT in collection then add it
    if (! monitors[siteId]) {
      //just add the monitor fields for each site code
  //    monitors[siteId] = {};
  //    monitorFields.forEach(function (field) {
  //      monitors[siteId][field] = row[field];
  //    });

      monitorsSiteIDs.push(siteId);

      monitors[siteId]= monitorFields.reduce(function (acc,val) {
        acc[val]=row[val];
        return acc;
      },{});
    }

    return true;
  });

}

function loopOverSites() {
  var defer = Q.defer();

  var siteIDs = Object.keys(concentrations);
//  console.log(Object.keys(concentrations).length);
//  console.log('siteIDs.length ' + siteIDs.length);

  async.eachSeries(siteIDs,function (siteID,done) {
//    console.log(siteID);
    handleSiteRow(concentrations[siteID],siteID)
      .then(function () {
        done();
//        async.setImmediate(function () {done()});
      })
      .catch(function (error) {
//        console.log("caught after handle site row");
        done(error);
        //defer.reject(error);
      });
  },function (error) {
//    console.error('error ' + error);
    if (error) return defer.reject(error);
    defer.resolve();
  });

  return defer.promise;
}

function handleSiteRow(data,siteID) {
//  console.log(' handleSiteRow ' + siteID);
//  console.log(' quarters ' + Object.keys(concentrations[siteID]));
  return Q.fcall(function () {
    //If all species are not in a year for the season then remove that year
    filterSeasonalData(data,siteID);
    addAnnualData(data,siteID);
    addSumOfSpecies(data,siteID);
  }).then(function () {
    return Q.ninvoke(fs,'writeFile',outfilebase + '\\' + siteID + '.json',JSON.stringify(data));
  });
}

function addAnnualData(data,siteID) {
  var quarters = [1,2,3,4].map(function (q) {return "Q" + q;});

  var annual = {};

//  if (Object.keys(data).length<4) {
//    console.log(data);
//    console.log(Object.keys(data));
//    return;
//  }

  speciesList.forEach(function (species) {
    quarters.forEach(function (quarter) {
//      console.log("data[quarter] " + data[quarter]);

      //This was crashing becuase some sites didn't have all quarters
      if (! data[quarter]) {
        return;
      }

      data[quarter].forEach(function (year) {
        if (! annual[year[yearField]]) annual[year[yearField]] = {};
        if (! annual[year[yearField]][species]) annual[year[yearField]][species] = [];

        if ((year[species] || year[species]===0) && !isNaN(year[species])) annual[year[yearField]][species].push(year[species]);
      });
    });
  });
  data.Annual = Object.keys(annual).sort().map(function (year) {
    var yearData = {Season:"Annual"};
	yearData[yearField] = year;
	
    var hasMissingSeason = false;
    speciesList.forEach(function (species) {
      seasonValues = annual[year][species];
      if (seasonValues.length<4) {
        hasMissingSeason = true;
      }
      var avg = seasonValues.reduce(function (acc,val) {
        acc += val;
        return acc;
      },0);
      if (seasonValues.length>0) avg = avg/seasonValues.length;
      yearData[species] = avg;
    });
    //if all 4 seasons are not present then just return null for this year and filter out all null year data later
    if (hasMissingSeason) {
      console.log("site ID: " + siteID + " year: " + year + " has missing season(s)");
      return null;
    }
    return yearData;
  });
  //Filter out the null year data that didn't have all seasons
  var unFilteredYearCount = data.Annual.length;
  data.Annual = data.Annual.filter(function (yearData) {return yearData!=null;});
  //Just counting how many sites had missing season
  if (unFilteredYearCount!=data.Annual.length) {
    sitesMissingSeasonCount += 1;
  }else {
    console.log("site ID: " + siteID + " did NOT have missing season(s)");
  }
}

function addSumOfSpecies(data,siteID) {
  var seasons = Object.keys(data);
  seasons.forEach(function (season) {
    data[season].forEach(function (year) {
      var sum = 0;
      speciesList.forEach(function (species) {
        if (year[species] && !isNaN(year[species])) sum += +year[species];
      });
      year.SumOfSpecies = sum;
    });
  });
}

function filterSeasonalData(data,siteID) {
  var quarters = [1,2,3,4].map(function (q) {return "Q" + q;});

  quarters.forEach(function (quarter) {
    if (! data[quarter]) return;
    data[quarter]= data[quarter].filter(function (yearData) {
      var hasMissingSpecies = false;
      speciesList.every(function (species) {
        //note null would return isNaN=false but null is missing data
        hasMissingSpecies = !isNumeric(yearData[species]);
        //stop loop when hasMissingSpecies = true first time
        return !hasMissingSpecies;
      });
      return !hasMissingSpecies;
    });
  });

}

function filterMonitorWithNoData(siteIDs) {
//This filters out siteIDs where there is no data. Don't need to look at annual because that is aggregate of quarters
  var quarters = [1, 2, 3, 4].map(function (q) {
    return "Q" + q;
  });

  return siteIDs.filter(function (siteID) {
    //If every quarter is empty then every returns true and thus filter out by negating every result.
    //Actually the quarter won't even be in concentrations if empty but will still work to check if non existent or empty
      return !(quarters.every(function (quarter) {
        if (! concentrations[siteID][quarter]) {
//          console.log(concentrations[siteID]);
        }
        return (!concentrations[siteID][quarter] || concentrations[siteID][quarter].length==0);
      }));
  });
}

function isNumeric(n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

function convertToNumber(x) {
  if (isNumeric(x)) {
    return +x;
  }else {
    return null;
  }
}