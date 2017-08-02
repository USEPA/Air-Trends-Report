//This fires off all of the different maps and charts
//First it does stuff needed like get BaseMap once

//setTimeout(function () {
  (function () {
  d3_queue.queue([1])
    //Just use general function passings args object with the map object to map onto
    .defer(setup)
    .defer(function (callback) {
      etrends.naaqs.concentrations.averages.init();
//Need to do this once modal comes up
      etrends.naaqs.emissions.totals.init();
      etrends.naaqs.emissions.categories.init();
	  etrends.growth.init();
	  etrends.naaqs.init();
      etrends.speciation.init();
      etrends.visibility.init();
      etrends.toxics.init();
      callback(null);
    })
    .await(function (error) {
      if (error) console.error(error);
      console.log("all etrends-d3-main maps/charts loaded")
    });
  
    function setup(callback) {
      d3_queue.queue()
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
//},3000);
//# sourceURL=etrends-d3-main.js