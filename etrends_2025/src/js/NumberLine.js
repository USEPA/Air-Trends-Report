if (! etrends) var etrends = {};
if (! etrends.library) etrends.library = {};

etrends.library.NumberLine = function (args) {
  // args:
  // container
  // margin
  // chartWidth
  // breaks
  // value
  this.container = args.container;
  this.fixedChartWidth = args.chartWidth;
  this.margin = {left:0,right:0}; 
  if (args.margin) this.margin = args.margin;

  this.breaks = args.breaks;
  this.value = args.value;
  this.logScale = args.logScale;

  this.cellWidth = args.cellWidth;
  this.cellHeight = args.cellHeight || 10;
  this.cellSpacingX = etrends.library.utilities.isNumeric(args.cellSpacingX) ? args.cellSpacingX : 3;
  this.cellSpacingY = etrends.library.utilities.isNumeric(args.cellSpacingY) ? args.cellSpacingY : 3;

};

etrends.library.NumberLine.prototype.chartWidth = function () {  
  var D3container = d3.select(this.container);
  return this.fixedChartWidth || D3container.node().getBoundingClientRect().width;
};

etrends.library.NumberLine.prototype.chartOuterWidth = function () {  
  return this.chartWidth() + this.margin.left + this.margin.right;
};

etrends.library.NumberLine.prototype.draw = function () {  
    var self = this;
    
  //Do the legend for emissions
    self.D3container = d3.select(self.container);

    //If not legend container then don't draw 
    if (self.D3container.empty()) return;
      
//    emissionChart_createLegend(this,items,2,legendY);    
    self.drawSingle();

};

etrends.library.NumberLine.prototype.moveText = function(args) {  
  var self = this;

  var textHeight = args.textElement.node().getBBox().height;
  var textWidth = args.textElement.node().getBBox().width;

  //capHeight is percent of text height that is from baseline to ascender line
  var capHeight = +13.15/16;

  args.textElement.attr('x', args.x + (args.center ? -textWidth/2 : 0))
  .attr('y', args.y + capHeight*textHeight )
//  .attr('style', 'fill:red');
}

//Have to recursivley draw until we figure out how many columns and rows will fit best
etrends.library.NumberLine.prototype.drawSingle = function () {  
    var self = this;

    var ncells=self.breaks.length-1;

    var chartWidth = self.chartWidth();
    var chartOuterWidth = self.chartOuterWidth();
    
//Remove existing chart
      self.D3container.selectAll("*").remove();
      self.svg = self.D3container.append('svg')
        .attr('width',  chartWidth)
//        .attr('height', 200);
//Need to keep ref to svg and a translated group for centering easier. the legend group itself is group in self.element
      
      self.element = self.svg.append('g');

      //have to create text first to get size of first and last labels
      var textElements = [];

      self.breaks.forEach(function (item,index) {
        //get the width of text element assuming value is less than lower limit
        //so value text will fit on screen
        //after getting width will switch back
        var textValue = item.text;
        /*
        if (index===0) {
          textValue = '<= ' + textValue;
        } else if (index===ncells) {
          textValue = '>= ' + textValue;
        }
        */
        var textElement = self.element.append('text')
        .text(textValue)
        .classed('scale',true);

        var textElementWidth = textElement.node().getBBox().width;
        var textElementHeight = textElement.node().getBBox().height;
        //Now that we got the extra width we can switch text back to what number line breaks should be
// Actually extreme number line breaks should have <= and >=
//        if (index===0 || index===ncells) {
//          textElement.text(item.text);
//        }
        textElements.push({
          element:textElement,
          width: textElementWidth,
          height: textElementHeight
        });
      });
  
    //Note: if ncells>2 then first and last cell needs extra half space each
    //this is so each cell area had same width since marker at first and last are right at beginning/end of cell
    //middle cells marker is right in middle of cell space

    var triangleInfo = this.triangleInfo();
    //calculate this before y because setValue needs it and y needs value element height
    //note: add a little extra to the text element width to make sure text fits
    self.xMin = Math.max(2*self.cellHeight*triangleInfo.left.width+self.cellSpacingX,1.08*textElements[0].width/2);

    //if cellWidth not hardcode then fill cellWidth to fit chartWidth space
    if (!self.cellWidth && chartWidth) {
      //calculate the space to right of number line so we can get cellWidth
      //note: add a little extra to the text element width to make sure text fits
      var rightMargin = Math.max(2*self.cellHeight*triangleInfo.right.width+self.cellSpacingX,1.08*textElements[ncells].width/2);      
      var extraCellWidthFactor = ncells<=2 ? 1 : 0; 
      self.cellWidth = (chartWidth - self.cellSpacingX*(ncells-extraCellWidthFactor) - (self.xMin+rightMargin))/ncells;
    }
    
    //get x max which is x at end of the cells
    //usally only ncells - 1 x cellSpace but need extra x cellSpacing for 1/2 space extra in first and last cell each
    self.xMax = ncells*(self.cellWidth+self.cellSpacingX) + self.xMin;
    //if less than 3 cells then don't worry about first/last cell being different size from middle
    //subtract one x spacing if only one or two cells
    if (ncells<=2) self.xMax -= self.cellSpacingX;

    //Add value elements. create group for valueElements
    //This needs to be added here to get the height of the value element
    var hasInitialValue = self.value ? true : false;
    self.setValue(self.value || {value:0,text:'No Data'});
    //For now if value is not set then don't show
    if (!hasInitialValue) self.hideValue();

    //the start of cells begins where value arrow stuff ends
    var y = self.valueElement.node().getBBox().height;

    self.breaks.forEach(function (item,index) {
      var x = index*(self.cellWidth+self.cellSpacingX)+self.xMin;      
      //the first and last cell should have 1/2 space extra width
      //that way each cell/space combo is same width for scaling value
      if (ncells>2) {
        if (index>0) x += self.cellSpacingX/2;
        if (index===ncells) x += self.cellSpacingX/2;
      }
      if (index==0) {
        self.addTriangle(
          {
            element:self.element,
            type: 'left',
            size: 2*self.cellHeight,
            x: x - self.cellSpacingX,
            y: y + self.cellHeight/2
          }  
        );      
      } else if (index==ncells) {
        self.addTriangle(
          {
            element:self.element,
            type: 'right',
            size: 2*self.cellHeight,
            x: x,
            y: y + self.cellHeight/2
          }  
        );
      }
//now move text to correct location
//note: text center begins at start of first cell
// but in middle of cell spacing for middle cells
// and at end of cell for last cell
// so have to account for cell spacing subtracted from x being different
    var textOffsetFactor;
      if (index==0) {
        textOffsetFactor = 0;
      } else if (index==ncells) {
        textOffsetFactor = 1;
      } else {
        textOffsetFactor = 1/2;
      }    
      args = {
        textElement: textElements[index].element,
        x: x - textOffsetFactor*self.cellSpacingX,
        y: y + self.cellHeight+self.cellSpacingY,
        center: true
      }
      self.moveText(args);
      if (index==ncells) return;

      //the first and last cell should have 1/2 space extra width
      //that way each cell/space combo is same width for scaling value
      var extraCellWidth = 0;
      if (ncells>2 && (index===0 || index===ncells-1)) {
        extraCellWidth = self.cellSpacingX/2;
      }
//add cell rect
      var rectElement = self.element.append('rect')
      .attr('width',  self.cellWidth + extraCellWidth)
      .attr('height', self.cellHeight)
      .attr('x', x)
      .attr('y', y);
  
    });

    //get the height of svg from y at top of rects to height of text
    // Note: y is at bottom of value pointer arrow 
    self.svg.attr('height', y + self.cellHeight + self.cellSpacingY + textElements[0].height);

    var elementWidth = self.element.node().getBBox().width;
    var elementHeight = self.element.node().getBBox().height;

    var scaleLegend = chartWidth/elementWidth;
    if (scaleLegend < 1) {
//Fit to entire width if shrinking it even after 2 cols      
      scaleLegend = Math.min(1,chartOuterWidth/elementWidth);
      console.log(scaleLegend);
      self.element.attr("transform", "scale(" + scaleLegend  + ")");
    }

//    self.svg.attr('height', elementHeight);
};

etrends.library.NumberLine.prototype.scaleFontSize = function(element,scale) {
    var FontSize = parseInt(element.style("font-size"));
    element.style("font-size", FontSize*scale + "px");
};

etrends.library.NumberLine.prototype.triangleInfo = function(type) {  
  //anchor point is always 0,0

  var info = {
    left : {
      points: [[-1,0],[0,1/2],[0,-1/2]],
      width: 1,
      height: 1
    },
    right : {
      points: [[1,0],[0,1/2],[0,-1/2]],
      width: 1,
      height: 1
    },
    down : {
      points: [[0,1],[1/4,0],[-1/4,0]],
      width: 1/2,
      height: 1
    },
  };

  return type ? info[type] : info;
};

etrends.library.NumberLine.prototype.addTriangle = function(args) {  
  var self = this;

  var pointsByType = this.triangleInfo(args.type).points;

//  M 100 100 L 300 100 L 200 300 z
  var d = '';
  pointsByType.forEach(function (point,index) {
    d += index==0 ? 'M ' : ' L ';
    var x = +args.x + args.size*point[0];
    var y = +args.y + args.size*point[1];
    d += x + ' ' + y;
  });
  d += ' z';

  var triangleElement = args.element.append('path')
  .classed(args.type,true)
  .classed('arrow',true)
  .attr('d', d);

/* createElement didn't work
  var triangleElement = d3.select(document.createElement('path'));
  triangleElement
  .classed(args.type,true)
  .classed('arrow',true)
  .attr('d', d)
  if (args.element) args.element.append(triangleElement);
*/
  return triangleElement;
};

etrends.library.NumberLine.prototype.hideValue = function(hide) {  
  this.valueElement.classed('hidden',hide===false ? false: true);
};

etrends.library.NumberLine.prototype.setValue = function(valueObj) {  
  var self = this;
  self.value = valueObj;
  if (self.valueElement) {
    self.valueElement.selectAll("*").remove();
  } else {
    self.valueElement = self.element.append('g')
    .classed('value',true);  
  }
  self.hideValue(false);

  //now calculate x
  var ncells=self.breaks.length-1;

  function toLog(value) {
    return self.logScale ? Math.log(value) : value;
  }

  var value = toLog(valueObj.value);
  var valueMin = toLog(self.breaks[0].value);
  var valueMax = toLog(self.breaks[ncells].value);

  var text = valueObj.text;
  var scale = (value-valueMin)/(valueMax-valueMin);
  //if value not defined don't want the text to be first break value but do want scale to be zero
  if (valueObj.value===undefined || valueObj.value===null) {
    scale = 0;
  } else {
    if (scale<0) {
      scale = 0;
      text = self.breaks[0].text;
    } else if (scale>1) {
      scale = 1;
      text = self.breaks[ncells].text;
    }  
  }
  var x = scale*(self.xMax-self.xMin)+self.xMin;

  var textElement = self.valueElement.append('text')
  .text(text);
  var textHeight = textElement.node().getBBox().height;

  self.moveText({
      textElement: textElement,
      x: x,
      y: 0,
      center: true
    });
    self.addTriangle(
      {
        element:self.valueElement,
        type: 'down',
        size: 2*self.cellHeight,
        x: x,
        y: 0 + textHeight + self.cellSpacingY
      }
    )

};

//Set that this module is loaded for egam
if (etrends.library.utilities) etrends.library.utilities.setModuleLoadedForEGAM('NumberLine.js');

//# sourceURL=etrends/NumberLine.js
