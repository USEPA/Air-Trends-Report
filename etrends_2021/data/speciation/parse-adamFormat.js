//var csvLib = require('csv');
//This could be used to convert js object to csv
//Q.ninvoke(csvLib, 'stringify', testObj, {})

var fs = require('fs');
var Q =  require('q');
var async =  require('async');

var infile = "spec.data.json";
var outfilebase = 'concentrations';
var monitorfile = 'monitors.json';

run();

var count = null;

var monitors = [];
function run() {
  Q.ninvoke(fs, 'readFile', infile,'utf8')
    .then(function (rows) {
      //convert from string to object
      rows = JSON.parse(rows);
      var subset = rows;
      if (count) subset = rows.slice(0,count);
//      console.log(subset);
      return subset;
    })
    .then(loopOverRows)
    .then(function () {
      console.log("rows handled");
      return Q.ninvoke(fs,'writeFile',monitorfile,JSON.stringify(monitors));
    })
    .catch(function (err) {
      console.error('Error converting big json to row json: ' + err);
    })
    .done(function () {
      process.exit();
    });
}

function loopOverRows(rows) {
  var defer = Q.defer();

  async.eachSeries(rows,function (row,done) {
//    console.log(i);
    handleRow(row)
      .then(function () {
        done();
      })
  },function (error) {
    if (error) defer.reject(error);
    defer.resolve();
  });

  return defer.promise;
}

function handleRow(row) {
  //first save data before we remove from monitor
  var data = row.data;
  fixSumOfSpecies(data,row.siteid);
  //remove data (and season didn't make sense) now and add row to monitor
  delete row.data;
  delete row.Season;
  //now change lat to Latitude and lon to Longitude
  row.Latitude = row.lat;
  row.Longitude = row.lon;
  //get rid of lat/lon now
  delete row.lat;
  delete row.lon;
  monitors.push(row);
  return Q.ninvoke(fs,'writeFile',outfilebase + '\\' + row.siteid + '.json',JSON.stringify(data));
}

function fixSumOfSpecies(data,siteid) {
  var speciesList = ['Sea-salt','Crustal','OrganicCarbon','ElementalCarbon','Nitrate','Sulfate'];
  var seasons = Object.keys(data);
  seasons.forEach(function (season) {
    data[season].forEach(function (year) {
      var sum = 0;
      speciesList.forEach(function (species) {
        if (siteid==480612004) {
          console.log('padre');
        }
        if (year[species] && !isNaN(year[species])) sum += year[species];
      });
      year.SumOfSpecies = sum;
    });
  });
}
