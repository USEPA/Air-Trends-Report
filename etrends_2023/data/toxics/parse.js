var csvLib = require('csv');
//This could be used to convert js object to csv
//Q.ninvoke(csvLib, 'stringify', testObj, {})

var fs = require('fs');
var Q = require('q');
var async = require('async');
var merge = require('merge');

var infile = "ToxSparkData_v3.csv";
var outfilebase = 'concentrations';

//var infile = "test-site_quarterly_spec_withSiteName_2006-2015.csv";
//var outfilebase = 'test-concentrations';
//var monitorfile = 'test-monitors.json';

var count = null;
var delimiter = ',';
var siteNameField = 'AMA_SITE_CODE';
var toxicNameField = 'AQS_PARAMETER_NAME';
var fieldsToReplace = [];
fieldsToReplace.push({field:'TrendDirection',old:'NA',new:''});
fieldsToReplace.push({field:'TrendDirection',old:'None',new:'No Trend'});
fieldsToReplace.push({field:'MONITOR_LATITUDE',old:'NA',new:''});
fieldsToReplace.push({field:'MONITOR_LONGITUDE',old:'NA',new:''});
fieldsToReplace.push({field:'UsedInNatAgg',old:'TRUE',new:'Yes'});
fieldsToReplace.push({field:'UsedInNatAgg',old:'FALSE',new:'No'});
fieldsToReplace.push({field:'NATTS',old:'TRUE',new:'Yes'});
fieldsToReplace.push({field:'NATTS',old:'FALSE',new:'No'});


var yearField = 'YEAR';
var valueField = 'value';

//Some of the toxic
var toxicNameAliases = {};
toxicNameAliases["Lead Pm10 Lc"] = "Lead";
toxicNameAliases["Benzo(a)pyrene (total tsp & vapor)"] = "BenzoPyrene";
toxicNameAliases["Naphthalene (total tsp & vapor)"] = "Naphthalene";
toxicNameAliases["Vinyl chloride"] = "VinylChloride";
toxicNameAliases["Carbon tetrachloride"] = "CarbonTetrachloride";
toxicNameAliases["Ethylene dichloride"] = "EthyleneDichloride";
toxicNameAliases["Benzene"] = "Benzene";
toxicNameAliases["Chloroform"] = "Chloroform";
toxicNameAliases["Ethylbenzene"] = "Ethylbenzene";
toxicNameAliases["Methylene chloride"] = "MethyleneChloride";
toxicNameAliases["Trichloroethylene"] = "Trichloroethylene";
toxicNameAliases["1,3-Butadiene"] = "Butadiene";
toxicNameAliases["Toluene"] = "Toluene";
toxicNameAliases["Acetaldehyde"] = "Acetaldehyde";
toxicNameAliases["Formaldehyde"] = "Formaldehyde";
toxicNameAliases["Tetrachloroethylene"] = "Tetrachloroethylene";
toxicNameAliases["Nickel Pm10 Lc"] = "Nickel";
toxicNameAliases["Manganese Pm10 Lc"] = "Manganese";
toxicNameAliases["Arsenic Pm10 Lc"] = "Arsenic";
toxicNameAliases["Cadmium Pm10 Lc"] = "Cadmium";
toxicNameAliases["Chromium VI (LC)"] = "Chromium";
toxicNameAliases["Beryllium Pm10 Lc"] = "Beryllium";

var monitors = {};
//store an array with column names in here other than year
var commonColumns = null;
//store array with years for each toxic name in here
var yearColumns = {};

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

      //This was just used to get all of the toxic names to create aliases
      if (1==0) {
        var toxicNames = rows.reduce(function (acc,val) {
          var name = val[toxicNameField];
          acc[name]=1;
          return acc;
        },{});
        Object.keys(toxicNames).forEach(function (name) {
          console.log('toxicNameAliases["' + name + '"] = "' + name + '";');
        });
      }

      return subset;
    })
    .then(loopOverTextFileRows)
//This to loop over each site to save Toxic files
    .then(loopOverToxicNames)
    .catch(function (err) {
      console.error('Error converting big json to row json: ' + err.stack );
    })
    .done(function () {
      console.log("Done");
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
    var toxicName = row[toxicNameField];
    //If there is an alias (simplified name that will work better in code) then use it
    //Full Toxcic parameter will still be on the row
    var hasAlias = false;
    if (toxicNameAliases[toxicName]) {
      hasAlias = true;
      toxicName = toxicNameAliases[toxicName];
    }

    if (! monitors[toxicName]) {
      monitors[toxicName] = {};
    }

    var sites = monitors[toxicName];

    var siteID = row[siteNameField];
    
    var site = sites[siteID];

    if (! site) {
      sites[siteID] = {};
      site = sites[siteID];
      //copy the rowdata to monitor
      merge.recursive(site, row);
      //If there is an alias (simplified name that will work better in code) then add it
      if (hasAlias) site.ToxicNameAlias = toxicName;

      //get the year and value
      var year = site[yearField];
      var value = site[valueField];

      //now remove year and value because each year's value will be a column
      delete site[yearField];
      delete site[valueField];
      //need to get the columns for this toxic name because might have different years
      if (! commonColumns) {
        commonColumns = Object.keys(site);
      }

    } else {
      //get the year and value off the row. All the other info is redundant
      var year = row[yearField];
      var value = row[valueField];
    }

    //let year be number not string. will need to sort, etc later
    year =convertToNumber(year);

    //Now add this year to site object
    //if value is not numeric (like NA) just make empty string
    if (!isNumeric(value)) value = '';
    site[year] = value;

    //For some columns Replace NA with empty string
    fieldsToReplace.forEach(function (ftr) {
      if (site[ftr.field]===ftr.old) site[ftr.field] = ftr.new;
    });
    //If TrendDirection is empty (NA already replace with empty string) then make TrendDirection=Non-NATTS if has at least one year
    if (!site.TrendDirection && site[year]) site.TrendDirection = 'Non-NATTS';

    //If a column doesn't exist for this year then add it
    if (!yearColumns[toxicName]) yearColumns[toxicName] = [];
    if (yearColumns[toxicName].indexOf(year)<0) yearColumns[toxicName].push(year);

    return true;
  });

}

function loopOverToxicNames() {
  var defer = Q.defer();

  var toxicNames = Object.keys(monitors);

  async.eachSeries(toxicNames,function (toxicName,done) {
    handleSiteRow(monitors[toxicName],toxicName)
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

function handleSiteRow(data,toxicName) {
//  console.log(' handleSiteRow ' + siteID);
//  console.log(' quarters ' + Object.keys(concentrations[siteID]));
  return Q.fcall(function () {
    //convert the object keyed by siteID to array
    var rows = Object.keys(data).map(function (siteID) {
      return data[siteID];
    });
    var columns = commonColumns.concat(yearColumns[toxicName].sort());
    //log config stuff to paste into client side JS code
    //Need to get the fullName because we are doing every thing by the shortened alias name
    //basically doing a reverse mapping here
    var fullName = toxicName;
    Object.keys(toxicNameAliases).every(function (name) {
        if (toxicNameAliases[name]==toxicName) {
          fullName = name;
          return false;
        }
        return true;
    });
    var minYear = Math.min.apply(null, yearColumns[toxicName]);
    var maxYear = Math.max.apply(null, yearColumns[toxicName]);

    console.log('config.types.' + toxicName + ' = {fullName:"' + fullName + '",minYear:' + minYear + ',maxYear:' + maxYear + '};');

    //sort the rows in the file so that NATTS sites are first
    rows.sort(function (a, b) {
      //Want NATTS = Yes to sort last so they the points are on top in map
      var aInt = a.NATTS=="Yes" ? 1 : 0;
      var bInt = b.NATTS=="Yes" ? 1 : 0;

      return aInt - bInt;
    });

    return Q.ninvoke(csvLib, 'stringify', rows, {header:true,columns:columns});
  }).then(function (rows) {
    return Q.ninvoke(fs,'writeFile',outfilebase + '\\' + toxicName + '.csv',rows);
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