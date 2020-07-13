//This fires off all of the different maps and charts
//First it does stuff needed like get BaseMap once
if (! etrends) var etrends = {};
if (! etrends.usMapCache) etrends.usMapCache = {};

//setTimeout(function () {
  (function () {
  d3_queue.queue([1])
    //Just use general function passings args object with the map object to map onto
    .defer(setup)
    .defer(function (cb) {setTimeout(etrends.naaqs.concentrations.averages.init.bind(etrends.naaqs.concentrations.averages,cb),0)})
//Need to do this once modal comes up
//Comment this out for now since Arthur moved it out of the modal so it's crashing page
    .defer(function (cb) {setTimeout(etrends.naaqs.emissions.totals.init.bind(etrends.naaqs.emissions.totals,cb),0)})
    .defer(function (cb) {setTimeout(etrends.naaqs.emissions.categories.init.bind(etrends.naaqs.emissions.categories,cb),0)})
    .defer(function (cb) {setTimeout(etrends.growth.init.bind(etrends.growth,cb),0)})
    .defer(function (cb) {setTimeout(etrends.naaqs.init.bind(etrends.naaqs,cb),0)})
    .defer(function (cb) {setTimeout(etrends.speciation.init.bind(etrends.speciation,cb),0)})
//    .defer(etrends.weather.init.bind(etrends.weather))    
    .defer(function (cb) {setTimeout(etrends.visibility.init.bind(etrends.visibility,cb),0)})
    .defer(function (cb) {setTimeout(etrends.toxics.init.bind(etrends.toxics,cb),0)})
/*
    .defer(etrends.naaqs.concentrations.averages.init.bind(etrends.naaqs.concentrations.averages))
//Need to do this once modal comes up
    .defer(etrends.naaqs.emissions.totals.init.bind(etrends.naaqs.emissions.totals))
    .defer(etrends.naaqs.emissions.categories.init.bind(etrends.naaqs.emissions.categories))
    .defer(etrends.growth.init.bind(etrends.growth))
    .defer(etrends.naaqs.init.bind(etrends.naaqs))
    .defer(etrends.speciation.init.bind(etrends.speciation))
//    .defer(etrends.weather.init.bind(etrends.weather))    
    .defer(etrends.visibility.init.bind(etrends.visibility))
    .defer(etrends.toxics.init.bind(etrends.toxics))
*/    
//    .defer(function (callback) {
//      callback(null);
//    })
    .await(function (error) {
      if (error) console.error(error);
      console.log("all etrends-d3-main maps/charts loaded")
    });
  
    function setup(callback) {
      var getStateFipCodes = function (callback) {
        var args = {cache:etrends.usMapCache,
                  file:'data/state_fip_codes.csv'};
        args.done = function (cacheData) {            
            if (!etrends.usMapCache.state_fip_codes) {
              //make copy so we don't mess up the cache 
              etrends.usMapCache.state_fip_codes = $.extend(true,[],cacheData);;
            }
        }          
        return etrends.library.utilities.loadMapOrGraph(args,callback);
      }
      /*
      var getCountyStateFipCodes = function (callback) {
        var args = {cache:etrends.usMapCache,
                  file:'data/county_state_fip_codes.csv'};
        args.done = function (data) {
            if (!etrends.usMapCache.county_state_fip_codes) {
              etrends.usMapCache.county_state_fip_codes = data.reduce(function (acc,item) {
                acc[+(item.statefp + item.countyfp)] = item;
                return acc;
              },{});
            }
        }          
        return etrends.library.utilities.loadMapOrGraph(args,callback);
      }

      d3_queue.queue()
      */
      d3_queue.queue()
  //get state fip codes
    .defer(getStateFipCodes)      

  //get county/state fip codes
//    .defer(getCountyStateFipCodes)      
  //have to pass the empty args other wise d3_queue passes callback as args
    .defer(etrends.library.utilities.makeBaseMap,{})
  //Had to convert images in baby legend to dataURLs for exporting. It didn't understand external resources.
  //Easiest to do this before growth chart is drawn because getDataURLs is async
    .defer(etrends.growth.babyLegend.getDataURLs,{})
      .await(function () {
        console.log("etrends-d3-main setup loaded");
        callback(null);
      });
    }
  })();
//},10000);
//# sourceURL=etrends-d3-main.js