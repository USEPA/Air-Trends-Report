if (! etrends) var etrends = {};
if (! etrends.library) etrends.library = {};

etrends.library.MapChartLegend = function (host,series) {
  //host is the map or chart that title is getting added to
  this.host = host;

//Need to set a margin because chart has to translate legend to be under chart
  this.margin = {left:0,right:0}; 
  if (this.host.margin) this.margin = this.host.margin;

  this.series = null;
  //if host like chart it has series so use that
  if (this.host.series) this.series = this.host.series;
  //otherwise if series is passed for say map then use that
  if (series) this.series = series;
};

//Need to get the width of host. allow dynamic calculation because it could change on resize
//Assume chart is host by default but this can be over ridden  
etrends.library.MapChartLegend.prototype.hostWidth = function () {  
  return this.host.chartWidth;
};
etrends.library.MapChartLegend.prototype.hostOuterWidth = function () {  
  return this.hostWidth() + this.margin.left + this.margin.right;
};

etrends.library.MapChartLegend.prototype.draw = function () {  
    var self = this;
    
  //Do the legend for emissions
    self.container = 	d3.select("#" + self.host.domID + "-container .etrends-chart-legend");

    //If not legend container then don't draw legend (no more putting it as SVG in chart)
    if (self.container.empty()) return;
      
//    emissionChart_createLegend(this,items,2,legendY);    
    self.drawSingle(self.ncols);

//  do custom legend stuff after legend is drawn
    if (self.externalAddLegend) self.externalAddLegend();
};
//Have to recursivley draw until we figure out how many columns and rows will fit best
etrends.library.MapChartLegend.prototype.drawSingle = function (ncols) {  
    var self = this;

    if (! ncols) ncols=self.host.series.length;

    var hostWidth = self.hostWidth();
    var hostOuterWidth = self.hostOuterWidth();
    
    var cellWidth = self.cellWidth || 25;
    var cellHeight = self.cellHeight || 25;
    var cellSpacingX = self.cellSpacingX || 15;
    var cellSpacingY = self.cellSpacingY || 10;
    var colWidths = [];
    var colWidth = 0;
    var textHeight;
    var text1Height;
    var text2Height;
    //textLineSpacing distance between text as proportion to height of text. .5  is  1.5 spacing, ie. the spacing is .5 x the font size
    var textLineSpacing = .7; 
    //fontPerLineHeight is the proportion of text's line height that is actual text/font. There is empty space above the text. It is close to 1/2 but turn out aboue 5/9.
    var fontPerLineHeight = +5/9;

//Remove existing legends
      self.container.selectAll("*").remove();
      self.svg = self.container.append('svg')
        .attr('width',  self.host.width)
        .attr('height', 200);
//Need to keep ref to svg and a translated group for centering easier. the legend group itself is group in self.element
      
      self.svgGroup = self.svg  
        .append('g')
             .attr('transform', 'translate(' + self.margin.left + ',' + 0 + ')');

      self.element = self.svgGroup.append('g');

    var legendY = 0;

    var cellCount=0;
    var cellX=0;
    var cellY=0;
    var row=0;
    var column=0;
    //first create legend items and get size
    var legendElements = [];
    var legendElement;
    self.host.series.forEach(function (item,cellCount) {
      legendElements[cellCount] = {}; 
      legendElement = legendElements[cellCount];

      legendElement.type = item.type || self.type;

      //Create a group for this legend items components
      legendElement.group = self.element.append('g');

      //If line still have a rect for vertical spacer but make it transparent
      legendElement.rect = legendElement.group.append('rect')
          .attr('width',  cellWidth)
          .attr('height', cellWidth);

//This is transparent rectangle useful for spacing and clicking etc
      if (legendElement.type=='line') {
        legendElement.rect
//          .attr("fill","#cccccc")
            .style('opacity', 0);
      } else {
        var itemClass = item.class || item.name;
        legendElement.rect
//            .attr('class', self.domID + '-' + item.name);
            .classed('etrends-chart-area',true)
            .classed('etrends-chart-area-' + itemClass,true);
      }     

      var textLines = item.text || item.name;
//      textLines ="Aaron<br/>Evans";
      textLines = textLines.split("<br/>")      
      
      legendElement.text1 = legendElement.group.append('text')
            .text(textLines[0]);

      legendElement.text2 = legendElement.group.append('text')
            .text(textLines[1]);
              
      //if new row reset column (except for first row)
      if (cellCount===0) {
      }else if(cellCount%ncols===0) {
        row += 1;
        column = 0;
      }              

      //Make sure the text fits withing cellHeight
      text1Height = legendElement.text1.node().getBBox().height;
      text2Height = legendElement.text2.node().getBBox().height;

      var text1Width = legendElement.text1.node().getBBox().width + cellSpacingX;
      var text2Width = legendElement.text2.node().getBBox().width + cellSpacingX;

      textHeight = fontPerLineHeight*text1Height;
      //if there is no second line don't want to include the spacing between lines
      if (textLines.length>1) textHeight += (1+textLineSpacing)*fontPerLineHeight*text2Height;

      //Make it fit in .95 of cellheight just to be safe
      var textHeightScale = .95*cellHeight/textHeight;
      if (textHeightScale < 1) {
        //Scale font-size. doing transform messing up translation
        self.scaleFontSize(legendElement.text1,textHeightScale);
        self.scaleFontSize(legendElement.text2,textHeightScale);
        //Scale the height and width accordingly
        text1Height *= textHeightScale;
        text2Height *= textHeightScale;
        text1Width *= textHeightScale;
        text2Width *= textHeightScale;
        textHeight = .95*cellHeight;
      }

      if (row===0) colWidths[column]= 0;
//      colWidth = legendElement.rect.node().getBBox().width + cellSpacingX;
//This should be cellWidth (can't do above if legend type is 'line')
      colWidth = cellWidth + .5*cellSpacingX; //note use 1/2 spacing between symbol and text

      colWidth += d3.max([text1Width,text2Width]);

      if (colWidth > colWidths[column]) colWidths[column] = colWidth;
      column +=1;
    });
//Now move them into position
    row=0;
    column=0;
    self.host.series.forEach(function (item,cellCount) {
      if (cellCount===0) {
      }else if(cellCount%ncols===0) {
        cellY+= cellHeight + cellSpacingY;
        cellX = 0;
        row += 1;
        column = 0;        
      }else{
        cellX += colWidths[column];
        column +=1;
      }
  
      legendElement = legendElements[cellCount];

      //If using line still need the rect background used for spacing to be in correct place so it can be clicked on
      //Therefore this is done for rect and line type
      legendElement.rect
          .attr('x', cellX)
          .attr('y',cellY);
      if (legendElement.type=='line') {
        var itemClass = item.class || item.name;
        legendElement.line = legendElement.group.append('path')
            .classed('etrends-chart-line',true)
            .classed('etrends-chart-line-' + itemClass,true)
          .attr('d', 'M' + parseInt(cellX) + ',' + parseInt(cellY+cellHeight/2) + 'L' + parseInt((cellX+cellWidth)) + ',' + parseInt(cellY+cellHeight/2));
      }     

      //textHeight was calculated above
      var textPadding = (cellHeight - textHeight) /2;

      legendElement.text1
            .attr('x', cellX + cellWidth+0.5*cellSpacingX) //Only half spacing between symbol and text
//            .attr('y', cellY + textPadding + text1Height);
            .attr('y', cellY + textPadding + fontPerLineHeight*text1Height);
        
      legendElement.text2
            .attr('x', cellX + cellWidth+0.5*cellSpacingX)
            .attr('y', cellY + textPadding + textHeight );

//now add hanlder to legend clicking
      legendElement.group.on("click",function () {
        if (self.AllowHiddenSeries) {
          //console.log("click " + cellCount);
          //If it is hidden toggle isHidden to false and vice versa
          self.host.series[cellCount].hidden = self.host.series[cellCount].hidden==true ? false : true;
          self.host.makeChart();
        }
        if (self.ExternalLegendClick) self.ExternalLegendClick(cellCount);
      });

  //change class of legend item if hidden (note do not do in click handler do when drawn)
      legendElement.group.classed("disabled",self.host.series[cellCount].hidden);
    });

//Try to add another row and see if things fit
    var newNcols = Math.ceil(self.host.series.length/(row+2)); //row is 0 based index so add 1 to get number of rows and 1 to add extra row
    //if new ncols same as just done then increment
    if (newNcols==ncols) newNcols -= 1;

//Make this again with 2 cols if it doesn't fit
    if (self.element.node().getBBox().width > hostOuterWidth && ncols>2) {
//    if (self.element.node().getBBox().width > hostOuterWidth && ncols===self.series.length && ncols!=2) {
      return self.drawSingle(newNcols);
    }
    //add a top margin to the legend
    legendY += 5;

  //shrink the legend if it is not fitting on chart width
    
    var scaleLegend = hostWidth/self.element.node().getBBox().width;
    var translate;

    if (scaleLegend < 1) {
//Fit to entire width if shrinking it even after 2 cols      
      scaleLegend = Math.min(1,hostOuterWidth/self.element.node().getBBox().width);
      translate = scaleLegend*legendY;
      self.element.attr("transform", "translate(" + [-self.margin.left + (hostOuterWidth - scaleLegend*self.element.node().getBBox().width)/2,scaleLegend*legendY] + ")scale(" + scaleLegend  + ")");
    }else {
  //center the legend
      translate = legendY;
      self.element.attr('transform', 'translate(' + (hostWidth - self.element.node().getBBox().width)/2 + ', ' + (legendY) + ')');
    }
    if (self.svg) {
      var svgHeight = self.element.node().getBBox().height + translate;
      self.svg.attr('height', svgHeight);
    //Hack to make sure div isn't the same height as the original SVG height
    //This didn't start (or was realized) until around 10/2019
      self.container.style("height",svgHeight + "px");
    }  

//Add legend element stuff in case it is needed
    self.items = {};
    legendElements.forEach(function (item,index) {
      self.items[self.host.series[index].name] = item;
    });
};

etrends.library.MapChartLegend.prototype.scaleFontSize = function(element,scale) {
    var FontSize = parseInt(element.style("font-size"));
    element.style("font-size", FontSize*scale + "px");
}

//Set that this module is loaded for egam
if (etrends.library.utilities) etrends.library.utilities.setModuleLoadedForEGAM('MapChartLegend.js');

//# sourceURL=etrends/MapChartLegend.js
