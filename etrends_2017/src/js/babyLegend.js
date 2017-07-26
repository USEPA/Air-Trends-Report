if (! etrends) var etrends = {};
if (! etrends.growth) etrends.growth = {};

etrends.growth.babyLegend = {};

//This configures the baby chart so that images can be preloaded and svg eventually drawn
etrends.growth.babyLegend.configure = function () {
    var self = etrends.growth.babyLegend;
    //Set constant parameters
    self.imageHeight = 119;
    self.imageWidth = 316;
    self.margin = 16;
    self.marginLeft = 33;
    self.padding = 16;
    //could try to auto gen self later from max text length and getBBox
    self.cellWidth = 673;
    self.cellHeight = self.imageHeight+2*self.padding;
    self.fontSize = 25;
    self.lineHeigt= .45;

    self.cells = [];    
    var cell = {};
    cell.src = "img/images_2017/gdp.png";
    cell.class = "GrossDomesticProduct";
    cell.text = "Gross Domestic Product";
    self.cells.push(cell);

    var cell = {};
    cell.src = "img/images_2017/transportation.png";
    cell.class = "VehicleMilesTraveled";
    cell.text = "Vehicles Miles Traveled";
    self.cells.push(cell);

    var cell = {};
    cell.src = "img/images_2017/population.png";
    cell.class = "Population";
    cell.text = "Population";
    self.cells.push(cell);

    var cell = {};
    cell.src = "img/images_2017/energy.png";
    cell.class = "EnergyConsumption";
    cell.text = "Energy Consumption";
    self.cells.push(cell);

    var cell = {};
    cell.src = "img/images_2017/co2.png";
    cell.class = "CO2Emissions";
    cell.text = "CO\u2082 Emissions";
    self.cells.push(cell);

    var cell = {};
    cell.src = "img/images_2017/emissions.png";
    cell.class = "AggregateEmissions";
    cell.text = "Aggregate Emissions<br/>(Six Common Pollutants)";
    self.cells.push(cell);
};

//preload images by converting to data url that is needed for exporting
etrends.growth.babyLegend.getDataURLs = function (input,callback) {
  //have to excecute callback with null if succesfull or error if error occurs for d3 queue
  var self = etrends.growth.babyLegend;
  if (! self.cells) self.configure();

  var canvas = $("<canvas/>");
  canvas
  .attr("width", self.imageWidth)
  .attr("height", self.imageHeight);

  var context = canvas[0].getContext("2d");

  var loadImage = function (cell) {
    var defer = $.Deferred();

    var image = new Image;
    image.onload = function() {
      context.drawImage(image, 0, 0);
      var type = cell.srcType || 'png';
      cell.dataURL = canvas[0].toDataURL("image/" + type);
      defer.resolve();
    };
    try {
      image.src = cell.src;
    } catch(ex) {
      console.error(ex);
      defer.resolve(ex);
    }
  //  $("body").append(image);

    return defer.promise();
  };
  return etrends.library.utilities.loopDeferSeries(self.cells,loadImage,{})
    .fail(function (err) {
      console.log('baby DataURLs loading failed: ' + err);
      callback(err);
    })
    .then(function () {
      console.log('baby DataURLs loaded');
      callback(null);
    });
  
};

etrends.growth.babyLegend.add = function (container,clickHandlers) {
    var self = etrends.growth.babyLegend;
    //run configure stuff if it hasn't been run but it should have been run when getting dataURLs
    if (! self.cells) self.configure();

    var y = 0;
    self.cells.forEach(function (cell,i) {
      var clickHandler;
      if (clickHandlers) clickHandler = clickHandlers[i]; 
      makeCell(cell,function () {return clickHandler(cell,i)});
      cell.element.attr("transform","translate(0," + y + ")");
      y += self.cellHeight + self.margin;
    })    

    //expose width and height in case it is neeed by consumer
    self.width = self.cellWidth + self.marginLeft;
    self.height = self.cellHeight*self.cells.length + self.margin*(self.cells.length-1);

    function makeCell(cell,clickHandler) {
      var group = container.append("g").attr("class",cell.class)
      group.append("rect")
        .attr("height",self.cellHeight)
        .attr("width",self.cellWidth)
        .attr("x",self.marginLeft).attr("y",0);

      var text = cell.text.split("<br/>");
      var y = (self.cellHeight+(text.length+self.lineHeigt*(text.length-1))*self.fontSize)/2;
      //Add second line of text  
      if (text.length>1) {
        group.append("text")
          .attr("font-size",self.fontSize)
          .attr("x",self.marginLeft+self.imageWidth+self.padding*2)
          .attr("y",y)
          .text(text[1]);
        y -= self.fontSize*(1+self.lineHeigt);
      }

      group.append("text")
        .attr("font-size",self.fontSize)
        .attr("x",self.marginLeft+self.imageWidth+self.padding*2)
        .attr("y",y)
        .text(text[0]);        
        
      group.append("image")
        .attr("xmlns:xlink","http://www.w3.org/1999/xlink")
        .attr("xlink:href",cell.dataURL || cell.src)
        .attr("height",self.imageHeight)
        .attr("width",self.imageWidth)
        .attr("x",self.marginLeft+self.padding)
        .attr("y",self.padding);

//if click handler then have transparent rectangle on top
      if (clickHandler) {
        group.append("rect")
          .attr("height",self.cellHeight)
          .attr("width",self.cellWidth)
          .attr("x",self.marginLeft).attr("y",0)
          .attr("opacity",0)
          .classed("clickRect",true)
          .classed("disabled",cell.disabled)
          .on("click",clickHandler)
      }
      
      cell.element = group;
    }

};
//# sourceURL=babyLegend.js