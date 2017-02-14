//stashing stuff in etrends so i don't have to clutter window object
//then stashing species stuff in etrends.species
if (! etrends) var etrends = {};
if (! etrends.species) etrends.species = {};
 
(function () {
    
//Just set up the stuff that needs to go into plotting the map  
  var speciesConfig = {};
	  
	speciesConfig = {file:"data/d3/concentrations/1990-2015/co.csv",title:"Species Data"}
//  speciesConfig.symbology = {colors:[d3.rgb(255,0,0),d3.rgb(255,0,0)],breaks:[0]};
  speciesConfig.symbology = {colors:[d3.rgb(255,0,0)],breaks:[]};

  etrends.species.map = new ClassifiedPointsMap("species-map");
  etrends.species.map.topojson = topojson;
//This variation is needed if map div is relative so that tooltip calculation will use relative calculations
  etrends.species.map.useRelativeTooltip=true;

  etrends.species.map.init();
    
  etrends.species.map.externalResize = function () {
    setMapTitle();
  };
      
//  d3.select("#mapPollutant").text(pollutantData[currentPollutant].title);
  setMapTitle();
   
   
//set concurrency for this simple example so tasks run in series
//If want in parallel don't enter concurrency. I needed to makes series so that map is drawn and then points plotted
d3_queue.queue([1])
  .defer(makeUSmap)
  .defer(makeSpeciesLayer,speciesConfig)
  .await(function () {"map loaded"});

function makeUSmap(callback) {
  //Use the general makeMapOrGraph to basically just call .mapStates once data is loaded
  var args = {};
  args.file = "data/d3/us.json";
  args.actions = function (data) {
//This actually creates state map
    etrends.species.map.mapStates(data);
  }; 
   makeMapOrGraph(args,callback);  
}

function makeSpeciesLayer(config,callback) {
//  console.log('begin with conc layer');
  var args = {};
  args.file = config.file;
  args.actions = function (data) {
    etrends.species.map.plotPoints(data,config.symbology);    
  };  
   makeMapOrGraph(args,callback);
}

function makeMapOrGraph(args,callback) {
//The callback passed to this is necessary for the queue/deferred stuff to work
  //for now just support these until I add more. default to csv I guess.
  var availableExt = ['csv','json'];
  var ext = args.file.split('.').pop();
  if (availableExt.indexOf(ext) < 0) ext = 'csv';
  
  d3[ext](args.file, function (error, data) {
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

function setMapTitle() {
    var mapTitle = d3.select("#species-map-title-label");
    mapTitle.html(speciesConfig.title);
    mapTitle.style("font-size","");
    var maxFontSize = parseInt(mapTitle.style("font-size"));
    var available = $("#species-map-title").width() - 3.5 * $("#species-map-home").width();
    var scale = Math.max(1,$(mapTitle.node()).width() / available);
    mapTitle.style("font-size",maxFontSize/scale + "px");
}

etrends.species.externalMouseOver = function (locationData) {
//This could run things like redrawing graph
}

etrends.species.externalMouseOut  = function (locationData) {
//This could run things on mouse out
}
  
})()
