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
    //resizing after tooltip resizes
    //etrends.species.chart.makeChart();
  };
      
//  d3.select("#mapPollutant").text(pollutantData[currentPollutant].title);
  setMapTitle();
   
//Note: need to pass the chart custom tooltip class because there are 2 tooltips on chart (another on legend)
   etrends.species.chart = new LineAreaChart("naaqs-concentrationGraph",125,.25,null,"naaqs-tooltip-concentration"); //passing the min height for the chart
   etrends.species.chart.margin.top = 10;
   //to get chart to fit tooltip
   //etrends.species.chart.containerID = "species-map-tooltip";
   
   etrends.species.chart.useTransitions = false;
//This variation is needed if chart div is relative so that tooltip calculation will use relative calculations
   etrends.species.chart.useRelativeTooltip=true;

   etrends.species.chart.ytitle.text='Concentration (ppm)'
   etrends.species.chart.xField = "year";
   etrends.species.chart.yField = "concentration";
//This will get the domain when called using the data
   etrends.species.chart.getXdomain =  null; //use the default x domain which is max min of x field
   //note had to multiply d.p10 and d.p90 by 1 so that it would convert string to number for finding min/max
   //also min/max could possible be national standard 
//Set the step between ticks or tick size
    etrends.species.chart.xTickSize = 5;
   
   etrends.species.chart.getYdomain =  function (self) {
      var min = d3.min(self.data, function (d) {          
//Note only return truthy or zero otherwise it is null and ignored
        return (d.concentration || d.concentration===0) ? 1*d.concentration : null ; });
      var max = d3.max(self.data, function (d) { 
//Note only return truthy or zero otherwise it is null and ignored
        return (d.concentration || d.concentration===0) ? 1*d.concentration : null ; });
//have the range between min and max +/- some percent of range. Also make sure min is always >= 0
     return [Math.max(0,min - .1*(max-min)), max + .1*(max-min)]
    };
   
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

  //no legend for now
  etrends.species.chart.addLegend = null;

  etrends.species.chart.drawPaths = function () {
     var self= this;

    self.svg.datum(self.data);
    
    self.concentrationLineElement = self.svg.append('path')
      .attr('class', 'naaqs-chart-line-location')
      .attr('d', self.concentrationLine)
      .attr('clip-path', 'url(#rect-clip)');

// add points to line now
//first get the size of the point on small screens
    var minReduction = .25; //this is reduction of point at percentSize=0
    var scaleFactor = Math.min(1,(1-minReduction)*self.percentSize + minReduction);

    self.concentrationLinePoints = self.svg.append("g")
    .attr("class", "naaqs-chart-point-location")
    .selectAll(".dot")
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.location!==""      
    .data(self.data.filter(function(d) { return (d.concentration || (d.concentration!=="" && d.concentration==0)) ? true : false;}))
    .enter().append("circle")
	.attr('class', 'dot')
    .attr("yval",function(d) { return d.location; })
    .attr("cx", function(d) { return self.xScale(d.year); })
    .attr("cy", function(d) { return self.yScale(d.concentration); });  

//reset point size to what is in css and then get css point size    
    self.concentrationLinePoints.style("r",null);
    var pointSize = self.concentrationLinePoints.style("r");
//if browser such as FF does not support radius r to be set with css then fall back to pointSize set on graph object
    if (! pointSize) pointSize=self.pointSize;    
    var scaledPointSize = parseInt(pointSize)*scaleFactor + "px";
    self.concentrationLinePoints.style("r",scaledPointSize);
//setting r using css doesn't work for some browsers like FF so have to make it an attribute
    if (! self.concentrationLinePoints.style("r")) self.concentrationLinePoints.attr("r",scaledPointSize);
}

etrends.species.map.externalMouseOver = function (locationData) {
//this is run in context of concentrationChart
    var self = etrends.species.chart;

    //this is just a hack because don't have real data structure yet
    if (! self.data) {
      self.data = [];
      Object.keys(locationData).map(function (key) {
        if (/^val\d+/.test(key)) self.data.push({year:key.replace(/^val/,'')});
      });
    }

    self.data.forEach(function (item,index) {
      self.data[index].concentration = locationData["val" + item.year];
    });
     
    self.concentrationLine = d3.svg.line()
//filter out anything that is falsey BUT keep 0,"0.0","0" but NOT "". Note: ""==0 so have to do d.location!==""      
    .defined(function(d) { return (d.concentration || (d.concentration!=="" && d.concentration==0)) ? true : false; })
    .x(function (d) { return self.xScale(d.year); })
    .y(function (d) { 
      return self.yScale(d.concentration); });    

   self.makeChart(self.data);

};

etrends.species.map.externalMouseOut  = function (locationData) {
//This could run things on mouse out
};
  
})()
