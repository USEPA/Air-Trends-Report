//NOTE: This class requires jQuery for moveTooltip so that tooltip will stay on screen
var MapChartTooltip = function (host,tooltipClass) {
//Host is the map or chart object that the tooltip is attached to  
  this.host = host;
//Pass this tooltip Class when multiple tooltip/class on same host
  this.tooltipClass = tooltipClass || "naaqs-tooltip";
//set offset of tooltip
  this.offset = null;
  
  //this is place to store tooltip stuff like data that is constant for all points but changes when layer/attribute changes
//  this.tooltip={};
//this is extra static data for the tooltip other than that passed to it when rendering
  this.data = {};
  
//this will be set to the point we are currenlty hovering over so that tooltip can be updated as attribute changes 
  this.currentHoverPoint=null;
  this.currentPointElement=null;

  this.div = d3.select("#" + this.host.domID).select("." + this.tooltipClass);

  this.content = this.div.select(".content");  
  this.templateElement = this.div.select(".template");
//check if template is defined before trying to get the text  
  if (! this.templateElement.empty()) this.template = this.templateElement.text();

//This used to get the height and width of tooltip without moving the actual tooltip around because it makes transitions bad
  this.ghostDiv = $(this.div.node()).clone(); 
  $("body").append(this.ghostDiv);
//This to temporarily disable a tooltip from showing when multiple tool tips over same host
  this.disable=false;  
//This to make sure that tooltip should show when not hovering over. ie. They may click and have tooltip be showing without hover
  this.showing=false;  
//This to know that mouse is currently hovering so that click doesn't have to repeat hover stuff
  this.hovering=false;  
  //this is custom function to render after normal render 
  this.customRender = null;
}


MapChartTooltip.prototype.renderToolTip = function (d) {
  var self = this;

//If nothing is passed or not template then don't do anything
  if (! d || ! this.template) return;
  
//Have to pass self because this is in context of the point on map
//add the active attribute to the tooltip so it can be shown
  d.activeAttribute = d[self.host.activeAttribute];
  
//Set the html equal to the template at first and then replace
  var html = this.template;
  
  var matchedFields = html.match(/<<[^>]*>>/g);

  matchedFields.forEach(function (fieldTag) {
      var splitTag = fieldTag.replace(/[<>]/g,"").split(":");
      var field = splitTag[0];
      var value="";
      var isFunction=false;      
//If tag like d.field then this is data on individual point      
      if (/^d\./.test(field)) {
        value = d[field.replace(/^d\./,"")];                
//If tag is like f.function:field then this is a function that is a property on tooltip.data that accepts d.field as arg
      } else if (self.data && /^f\./.test(field)) {
        isFunction=true;
        var arg = null;
        if (splitTag.length>1) arg = d[splitTag[1]];
        if (self.data[field]) value = self.data[field](arg);                
      } else  {
//this is constant data that doesn't vary by data point but can change as map is changed
        value = self.data[field];
      }

//If function then third item is nDigits. otherwise second item is nDigits
      var nDigits = null;
      if (isFunction) {
        if (splitTag.length>2) nDigits = splitTag[2];
      } else {
        if (splitTag.length>1) nDigits = splitTag[1];        
      }
      //Check if nDigits was supplied AND the value is actually a number before rounding to nDigits
      if (nDigits!==null && isFinite(parseFloat(value))) {
        try {
          if (typeof value === "string") value=value.replace(",",""); //replace commas if number is string
          //Let the number of digits be saved in the tooltip data so it can be changed dynamically. 
          //if it is a number just use that
          //If nDigits is not integer. If not assume it is a key and get from tooltip data.
          if (!(parseInt(nDigits)==nDigits && isFinite(nDigits))) nDigits = self.data[nDigits]
//Make sure nDigits saved in tooltip is an integer also
//          if (parseInt(nDigits)==nDigits && isFinite(nDigits)) value = parseFloat(value).toFixed(nDigits);          
          //If nDigits is an integer then do the rounding          
          if (parseInt(nDigits)==nDigits && isFinite(nDigits)) {
            //Note have to actually round to say 10 digits first or calculations that should say exactly equal 3.85 were ending up 3.8499999999999996 and rounding to 3.8 instead of 3.9
            //Don't do the rounding to if we actually want to keep more than 10 
            if (nDigits <= 10) value = parseFloat(value).toFixed(10);
            //use round10 it rounds properly eg. 7.55 to 7.6 not 7.5 
            value = self.round10(parseFloat(value),nDigits);
          }            
        }catch (ex){          
        }        
      }  
      html=html.replace(fieldTag,value);
  },this);  
  
  this.content.html(html);
  if (this.customRender) this.customRender();
  this.ghostDiv.html(this.content.html());
};

//Note this function only rounds off decimals it does not round say 956 to 960
//There is a more comprehensive function for that at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
MapChartTooltip.prototype.round10 = function (value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

MapChartTooltip.prototype.showToolTip = function (d,pointElement) {
      this.div.style("display",null);
//no data passed then just hide/show
      if (d) {
        this.currentHoverPoint=d;
        this.renderToolTip(d);        
      }
//no point Element passed then just hide/show
      if (pointElement) {
        this.currentPointElement = pointElement;
        this.moveToolTip(pointElement);
      }   
};

MapChartTooltip.prototype.hideToolTip = function () {
      this.div.style("display","none");
      this.currentHoverPoint=null;
      this.currentPointElement=null;
};

//This to re-render the current tooltip because something has changed
MapChartTooltip.prototype.refresh = function () {
  this.renderToolTip(this.currentHoverPoint);        
};
//When zooming if tooltip is clicked/forced open need to move tooltip
MapChartTooltip.prototype.relocate = function () {
  this.moveToolTip(this.currentPointElement);        
};


MapChartTooltip.prototype.moveToolTip = function(pointElement,useTransition) {
//by default offset tooltip to the right and down
//local offset is the offset of the top left corner of the tooltip
//this.offset is the offset of the corner that is nearest to the point
  var offset = {x:0,y:0};
//Make a copy of offset  
  if (this.offset) offset = {x:this.offset.x,y:this.offset.y};
  var dist = {};
//  $("#naaqsMap .naaqs-tooltip");
  
  var tooltip = $(this.div.node());
  var pointLocation = $(pointElement).offset();


//  var pointWidth = pointElement.getBBox().width*this.host.percentSize;
//  var pointHeight = pointElement.getBBox().height*this.host.percentSize;

//Use getBoundingClientRect that we can can get size on screen not SVG size because tooltip is positioned by screen pixels
//(when stretching SVG as with map the size of point is decreased so it will stay constant in screen coordinates)
//don't want to use percentsize as i did above because say for charts the getBBox value is always screen pixels even if percentSize changes
//because not strecthing SVG (using ViewBox) when resizing but redrawing it when resizing (no ViewBox)
  var pointWidth = pointElement.getBoundingClientRect().width;
  var pointHeight = pointElement.getBoundingClientRect().height;
  
//  var pointWidth = this.host.pointSize*2;
//  var pointHeight = this.host.pointSize*2;

//move location to middle of point
  pointLocation.left += pointWidth/2;
  pointLocation.top += pointHeight/2;
  
  var windowTop = $(window).scrollTop();
  var windowLeft = $(window).scrollLeft();
  var windowHeight = $(window).height();
  var windowWidth = $(window).width();
    
  dist.top = pointLocation.top - windowTop;
  dist.left = pointLocation.left - windowLeft;
  dist.bottom = windowHeight - dist.top;  
  dist.right = windowWidth - dist.left;  

//remove height/width attirbute and make it liquid to get full width of tooltip
  tooltip.css({width:"auto",height:"auto"}); 
//first move tooltip to top left of screen
//  d3Element.style("left",windowLeft + "px");
//  d3Element.style("top",windowTop + "px");

//  tooltip.css("display","none");
//  tooltip.css({"left":windowLeft + "px","top":windowTop + "px"});
//  tooltip.css("display","");
  
  this.ghostDiv.css({"left":windowLeft + "px","top":windowTop + "px"});

  var tooltipWidth = this.ghostDiv.outerWidth(); 
  var tooltipHeight = this.ghostDiv.outerHeight(); 

//  var tooltipWidth = tooltip.outerWidth(); 
//  var tooltipHeight = tooltip.outerHeight(); 
  
//if tooltip is wider than window than resize to window width
  if (tooltipWidth > windowWidth) {
    tooltip.outerWidth(windowWidth-200);
    tooltipHeight = tooltip.outerHeight(); //recalculate the height since changing width could change it  
  }else {
//Now set the width of the tooltip in css so it doesn't wrap later
    tooltip.outerWidth(tooltipWidth);    
  }
  
//prefer to the right but if not enough room put to the left   
//If not enough space to the right, then check to left
  if (tooltipWidth > dist.right) {
//if left is bigger then put to the left
    if (dist.left > dist.right) {
//resize tooltip to fit left distance if it is too big
      offset.x = -1*Math.min(tooltipWidth+offset.x,dist.left-10);
//      if (tooltipWidth+offset.x > dist.left) {
//        offset.x = -1*(dist.left);
//      }else {
//        offset.x = -1*(offset.x+tooltipWidth);        
//      }
    }else{
        offset.x = -1*(tooltipWidth-dist.right);      
    }  
  }

  
//If not enough space to the bottom, then check to the top
  if (tooltipHeight > dist.bottom) {
//if top is bigger then put to the top
    if (dist.top > dist.bottom) {
//don't shift up more than there is space for
      offset.y = -1*Math.min(tooltipHeight+offset.y,dist.top-5);
//      if (tooltipHeight+offset.y > dist.top) {
//        offset.y = -1*(dist.top);
//      }else{
//        offset.y = -1*(offset.y+tooltipHeight);        
//      }
    }else{
//mnore space at bottom but have to shift up a bit so it will fit on screen
        offset.y = -1*(tooltipHeight-dist.bottom);        
    }  
  }
  
//move the element to the newly computed offset location relative to location of element
//  tooltip.css("left",(pointLocation.left+offset.x) + "px");
//  tooltip.css("top",(pointLocation.top+offset.y) + "px");
  var top = pointLocation.top+offset.y
  var left = pointLocation.left+offset.x
  if (this.host.useRelativeTooltip===true) {
    var hostLocation = $("#" + this.host.domID).offset();   
    top = top - hostLocation.top;
    left = left - hostLocation.left;
  }
  if (useTransition) {
    this.div
    .transition()
    .style("left",left + "px")
    .style("top",top + "px");    
  }else {
    this.div
    .style("left",left + "px")
    .style("top",top + "px");    
  }
    
//  tooltip.css({"left":(pointLocation.left) + "px","top":(pointLocation.top) + "px"});
}; 

