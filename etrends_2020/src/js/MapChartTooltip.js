
//NOTE: This class requires jQuery for moveTooltip so that tooltip will stay on screen
var MapChartTooltip = function (host,tooltipSelector,template) {
//Host is the map or chart object that the tooltip is attached to  
  this.host = host;
//Pass this tooltip Class when multiple tooltip/class on same host
  this.tooltipSelector = tooltipSelector || ".etrends-tooltip";
//set offset of tooltip
  this.offset = null;
  
  //this is place to store tooltip stuff like data that is constant for all points but changes when layer/attribute changes
//  this.tooltip={};
//this is extra static data for the tooltip other than that passed to it when rendering
  this.data = {};
  this.data["f.showPercent"] = function (value,total) {
    if (isNaN(value) || value==null) return "NaN"; 
    if (isNaN(total) || total==null) return "NaN"; 
    return 100 * value / total;
  }; 
  //Assume this is initially hidden
  this.data.PercentDisplayClass="hidden";
  
//this will be set to the point we are currenlty hovering over so that tooltip can be updated as attribute changes 
  this.currentHoverPoint=null;
  this.currentPointElement=null;

  this.div = d3.select("#" + this.host.domID).select(this.tooltipSelector);

//  this.content = this.div.select(".content");  
//Find 1st level child (not grandchildren + )
  var $content = $(this.div.node()).children(".content")
  if ($content.length>0) {
    this.content = d3.select($content[0]);    
  }else {
    this.content = d3.select(null);        
  }
  
  //Allow us to pass custom template selector now for templates outside of host div
  if (template) {
    this.templateElement = d3.select(template);
  }else {
    this.templateElement = this.div.select(".template");
  }
//check if template is defined before trying to get the text  
  if (! this.templateElement.empty()) this.template = this.templateElement.text();

  //IF there are any ghost div for this tooltip then remove them from dom now
  var ghostID = $(this.div.node()).attr("id") + "-ghost";
  if ($("#" + ghostID).length>0) {
    $("#" + ghostID).remove();
  }

//This used to get the height and width of tooltip without moving the actual tooltip around because it makes transitions bad
  this.ghostDiv = $(this.div.node()).clone(); 
  this.ghostDiv.attr("id",ghostID);
  //change the id of the tooltip to have -ghost at end
  $("body").append(this.ghostDiv);
//This to temporarily disable a tooltip from showing when multiple tool tips over same host
  this.disable=false;  
//This to make sure that tooltip should show when not hovering over. ie. They may click and have tooltip be showing without hover
  this.showing=false;  
//This to know that mouse is currently hovering so that click doesn't have to repeat hover stuff
  this.hovering=false;  
  //this is custom function to render after normal render 
  this.customRender = null;
  //Set this to "maximize" the tooltip
  this.maximize = false;
  //If persistMaximize is true it means when tooltip closed and opened again it is still maxed out
  //Only show tooltip in maximized form ever (on say a phone where only makes sense to show max tooltip and normal tooltip trying to position bogs down)
  this.maximizeOnly = false;
  //Only show tooltip in minimized form ever (if generally set up for both but only want to allow min size on some client)
  this.minimizeOnly = false;
  //height and width of tooltip that is found automatically
  this.width = null;
  this.height = null;
  //with the new "slide" effect tooltip is under the above/below page and therefore can't be above navbar
  //Just make sure tooltip fits inside any header or footer
  this.headerSelector = "#mainNav"
  //in future will be timeline
  this.footerSelector = null
}


MapChartTooltip.prototype.renderToolTip = function (d) {
  var self = this;

//If nothing is passed or not template then don't do anything
  if (! d || ! self.template) return;
  
//Have to pass self because this is in context of the point on map
//add the active attribute to the tooltip so it can be shown
  d.activeAttribute = d[self.host.activeAttribute];
  
//Set the html equal to the template at first and then replace
  var html = self.template;

//Peform looping if any
  html = self.renderLooping(html,d);

  var matchedFields = html.match(/<<[^>]*>>/g);

  if (! matchedFields) matchedFields = [];

  matchedFields.forEach(function (fieldTag) {
      var splitTag = fieldTag.replace(/[<>]/g,"").split(":");
      var field = splitTag[0];
      var value="";
      var isFunction=false;      
//If tag like d.field then this is data on individual point      
      if (/^d\./.test(field)) {
        value = d[field.replace(/^d\./,"")];                
     } else if (/^dd\./.test(field)) {
//If tag like dd.field.member.member this is deep reference to data on individual point       
        value = field.replace(/^dd\./,"").split(".")
        .reduce(function (acc,item) {
          if (acc) {
            return acc[item]
          } else {
            return d[item];
          }
        },null);
        //If tag is like f.function:field then this is a function that is a property on tooltip.data that accepts d.field as arg
      } else if (self.data && /^f\./.test(field)) {
        isFunction=true;
        var arg = null;
        //Allow multiple fields like f.function:d.field1,d.field2,constant1
        if (splitTag.length>1) args = splitTag[1].split(",").map(function (field) {
          //Allow constants to be passed to function
          if (/^d\./.test(field)) {
            return d[field.replace(/^d\./,'')];
          }else {
            return field;
          }
        });
//        if (splitTag.length>1) arg = d[splitTag[1]];
//        if (self.data[field]) value = self.data[field](arg);
//Now allow multiple args
//        if (self.data[field]) value = self.data[field].apply(null,args);
//Now let the scope/context (this) in the function called be the data=d being rendered (might need it)
        if (self.data[field]) value = self.data[field].apply(d,args);
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
  },self);  
  
  self.content.html(html);

  //customRender function might return a promise so have to use when and then
  return $.when()
  .then(function() {
    if (self.customRender) return self.customRender();  
  })
  .then(function() {
//In case something is outside of content div use the entire div for ghost div
    self.ghostDiv.html(self.div.html());
  });
};

MapChartTooltip.prototype.renderLooping = function (html, d) {
  var self = this;  
  //first get rid of any returns in the html. messes up regex.
  html = html.replace(/\n/g,'');

  var re = /<<loop:([^>]*)>>(.*?)<<\/loop>>/g;
  var matches = etrends.library.utilities.getMatchesWithGroups(html, re);
  //loop over matches
  matches.forEach(function (m) {
    var rows;
    //data field id like <<loop:datafield>> where datafield is field where data we are using
    var field = m[1];
    var template = m[2]
    if (/^d\./.test(field)) {
      rows = d[field.replace(/^d\./,'')];
    }else {
      rows = self.data[field];
    }
    template = parseRows(rows,template);
    //now replace the loop tag with the parsed template
    html = html.replace(m[0],template);
  });
  
  return html;

  function parseRows(rows,template) {
    var html = '';
    rows.forEach(function (row) {
      html += parseTemplate(row,template);
    });
    return html;
  }  

  function parseTemplate(data,template) {
    var re = /<<l.([^>]*)>>/g;
    var matches = etrends.library.utilities.getMatchesWithGroups(template, re);
    matches.forEach(function (m) {
      var value = '';
      if (m.length>0) value = data[m[1]];
      //replace the value tag with the binded value
      template = template.replace(m[0],value);
    });
    return template;
  }  
};

//Note this function only rounds off decimals it does not round say 956 to 960
//There is a more comprehensive function for that at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round
MapChartTooltip.prototype.round10 = function (value, decimals) {
    return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

//Have to make this its own function because map show tooltip needs to call it because it does late maximize
MapChartTooltip.prototype.setupMaximizeOnly  = function (d,pointElement) {
  var self = this;
//In case they don't want to show min or max buttons in some clients eg. say phones 
//just make sure buttons are hidden and force the maximize state
//kind of arbitrary but let maximizeOnly be used if both minimizeOnly and maximizeOnly are set
    if (self.minimizeOnly) self.maximize = false; 
    if (self.maximizeOnly) self.maximize = true; 

    if(self.maximizeOnly || self.minimizeOnly) {
      $(self.div.select(".etrends-tooltip-maximize").node()).hide();
      $(self.div.select(".etrends-tooltip-minimize").node()).hide();
    }
};

MapChartTooltip.prototype.showToolTip = function (d,pointElement) {
    var self = this;
    self.setupMaximizeOnly();

    self.div.style("display",null);
//no data passed then just hide/show
    return $.when()
//move the element before rendering AND after redering so it doesn't stall over old location while rendering
    .then(function () {
      if (pointElement) {
        self.currentPointElement = pointElement;
        return self.moveToolTip(pointElement);
      }
    })
    .then(function () {
      if (d) {
        self.currentHoverPoint=d;
        return self.renderToolTip(d);          
      }                
    })
//no point Element passed then just hide/show
    .then(function () {
      if (pointElement) {
        self.currentPointElement = pointElement;
        return self.moveToolTip(pointElement);
      }
    })
};

MapChartTooltip.prototype.hideToolTip = function () {
      //if tooltip is hidden make sure window is minimized for next time tooltip pops up
      //Do this before tooltip is hidden though or things crash when hidden
      //Also don't do this if we are always maximizing tooltip for say phones
      if (this.maximize && !this.maximizeOnly) {
        this.minimizeWidth();
      }
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
  //if in maximize mode then do the fillScreen calcuation if something moved
  if (this.maximize) return this.maximizeWidth(useTransition);
  
//by default offset tooltip to the right and down
//local offset is the offset of the top left corner of the tooltip
//this.offset is the offset of the corner that is nearest to the point
  var offset = {x:0,y:0};
//Make a copy of offset  
  if (this.offset) offset = $.extend(true,{},this.offset);
  var dist = {};
//  $("#naaqsMap .etrends-tooltip");
  
  var tooltip = $(this.div.node());
  //Check if coordinates were passed or a d3 pointElement
  //If $(pointElement).offset() is not defined then assume coordinates passed 
  //This doesn't work in jquery 3. literal object converts to jquery object with offset method that crashes
  //var pointLocation = $(pointElement).offset();

  //Have to check whether pointElement is DOM element or just coordinates
  var $pointElement = $(pointElement);
  var pointLocation;

  if ($pointElement.length>0 && $pointElement[0] instanceof Element ) {
    //Get point location from jquery element
    pointLocation = $pointElement.offset();
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
  } else {
    pointLocation = pointElement;    
  }    
   
  var windowTop;
  var windowLeft;
  //want tooltip to fit in section if provided otherwise tooltip can be cut off by prev/next section
  if (this.sectionSelector) {
    var sectionSelectorOffset = $(this.sectionSelector).offset();
    windowTop = sectionSelectorOffset.top;
    windowLeft = sectionSelectorOffset.left;
  } else {
    windowTop = $(window).scrollTop();
    windowLeft = $(window).scrollLeft();
  }
  //make tooltip fit inside floating header and footers
  if (this.headerSelector) windowTop += $(this.headerSelector).height();

  var windowHeight = $(window).height();
  //make tooltip fit inside floating header and footers
  if (this.headerSelector) windowHeight -= $(this.headerSelector).height();
  if (this.footerSelector) windowHeight -= $(this.footerSelector).height();
  
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
  

//Because css might change for ghostDiv when it is not in same location as tooltip. 
//move ghostDiv to same container as tooltip
//I don't remember why I'm basing things off ghostDiv width though so not sure how this will affect things
  tooltip.parent().append(this.ghostDiv)

  var tooltipWidth = this.ghostDiv.outerWidth(); 
  var tooltipHeight = this.ghostDiv.outerHeight(); 
//move ghostDiv back to end of body
  $("body").append(this.ghostDiv);

  this.ghostDiv.css({"left":windowLeft + "px","top":windowTop + "px"});

//  var tooltipWidth = tooltip.outerWidth(); 
//  var tooltipHeight = tooltip.outerHeight(); 
  
//if tooltip is wider than window than resize to window width
  if (tooltipWidth > windowWidth*.95) {
//    tooltip.outerWidth(windowWidth-200);
//This should be a percent change. I mean if on small screen 200 is a large percent of screen space
    tooltipWidth = windowWidth*.95;
    tooltip.outerWidth(tooltipWidth);
    tooltipHeight = tooltip.outerHeight(); //recalculate the height since changing width could change it  
  }else {
//Now set the width of the tooltip in css so it doesn't wrap later
    tooltip.outerWidth(tooltipWidth);    
  }
  
  adjustTooltip();
  
//If not enough space to the bottom, then check to the top
  if (tooltipHeight > dist.bottom-offset.y) {
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
  
  this.setTopLeftCoordinates(top,left,useTransition);  

//Easy to just put all these complications into function in moveToolTip function scope
  function adjustTooltip() {
    if (offset.toLeft) {
    //prefer to the right but if not enough room put to the left   
    //If not enough space to the left, then check to right
      if (tooltipWidth > dist.left+offset.x) {
    //if right is bigger then put to the right
        if (dist.right > dist.left) {
    //resize tooltip to fit right  distance if it is too big
          offset.x = 1*Math.min(-1*offset.x,dist.right-tooltipWidth-10);
        }else {
          offset.x = -1*dist.left+10;
        }
      } else {
        //This to put tooltip to the left if space to the left (instead of default to the right)
          offset.x = offset.x-tooltipWidth;      
      }
    } else {
    //prefer to the right but if not enough room put to the left   
    //If not enough space to the right, then check to left
      if (tooltipWidth > dist.right-offset.x) {
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
            offset.x = -1*(tooltipWidth-dist.right+10);      
        }  
      }  
    }
  }

}; 


MapChartTooltip.prototype.maximizeWidth = function(useTransition) {
  this.maximize=true;
  //Make sure the tooltip persists on if they maximize in case they click maximize while hovering
  this.showing=true;
  var tooltip = $(this.div.node());

  var windowWidth = $(window).width();
    
//remove height/width attirbute and make it liquid to get full width of tooltip
  tooltip.css({width:"auto",height:"auto"}); 

  this.width = windowWidth*.95; 
  tooltip.outerWidth(this.width);
  this.height = tooltip.outerHeight(); //recalculate the height since changing width could change it  

  this.centerTooltip(useTransition);

  //Hide/Show these maximize/minimize buttons
  //Note: Only do if not hiding these buttons altogher for say phones that have only maxed tooltips
  if(!this.maximizeOnly && !this.minimizeOnly) {
    $(this.div.select(".etrends-tooltip-maximize").node()).hide();
    $(this.div.select(".etrends-tooltip-minimize").node()).show();
  }

  if (this.onMaximize) {
    this.onMaximize();
  }
  this.height = tooltip.outerHeight();
  this.centerTooltip(useTransition);

  //Need to check if tooltip height is within windoer AFTER custom onMaximize called because it might have increased height  
//Maybe don't do this because it wasn't changing contents of tooltiop. Just let them scroll and just center tooltip
//  this.fitToScreenHeight(useTransition);

};

MapChartTooltip.prototype.minimizeWidth = function() {
  this.maximize=false;
  this.moveToolTip(this.currentPointElement);

  //Hide/Show these maximize/minimize buttons
  //Note: Only do if not hiding these buttons altogher for say phones that have only maxed tooltips
  if(!this.maximizeOnly && !this.minimizeOnly) {
    $(this.div.select(".etrends-tooltip-maximize").node()).show();
    $(this.div.select(".etrends-tooltip-minimize").node()).hide();
  }

  if (this.onMinimize) {
    this.onMinimize();
  //If onMinimize not defined then assume it is same as onMaximize
  //If they want onMinimize to not do anything al all make it empty function = function () {}.  
  }else if (this.onMaximize) {
    this.onMaximize();    
  }  
};

MapChartTooltip.prototype.fitToScreenHeight = function(useTransition) {
  var tooltip = $(this.div.node());

  var windowHeight = $(window).height();

  this.height = tooltip.outerHeight();

  if (this.height > windowHeight*.95) {
    this.height = windowHeight*.95;
    tooltip.outerHeight(this.height)
  }

  //Now get the width which might have responded to possible change in height    
  this.width = tooltip.outerWidth();

  this.centerTooltip(useTransition);
};

MapChartTooltip.prototype.setTopLeftCoordinates = function(top,left,useTransition) {

  if (this.host.useRelativeTooltip===true) {
  //This is the location of the tooltip parent in the window
    var $host;
    if (this.host.relativeSelector) {
      $host = $(this.host.relativeSelector);
    } else {  
      $host = $("#" + this.host.domID);
    }
    var hostLocation = $host.offset();         

    top = top - hostLocation.top;
    left = left - hostLocation.left;    
  } 

//top = 0;

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
};

MapChartTooltip.prototype.centerTooltip = function(useTransition) {
  var windowHeight, windowWidth, windowTop, windowLeft;
  //want tooltip to fit in section if provided otherwise tooltip can be cut off by prev/next section
  if (this.sectionSelector) {
    var sectionSelectorOffset = $(this.sectionSelector).offset();
    windowTop = sectionSelectorOffset.top;
    windowLeft = sectionSelectorOffset.left;
    windowHeight = $(this.sectionSelector).height();
    windowWidth = $(this.sectionSelector).width();
  } else {
    windowTop = $(window).scrollTop();
    windowLeft = $(window).scrollLeft();
    windowHeight = $(window).height();
    windowWidth = $(window).width();
  }

  //Since top and left on the tooltipo will be relative to parent need to shift by parent offset so centered in window  
  var top = (windowHeight-this.height)/2 ;
  if (top < 0) top=0;
  var left = (windowWidth-this.width)/2 ;
  if (left  < 0) left=0;

  //Now the top and left should be relative to the document not the currently viewed area on screen
  top += windowTop;
  left += windowLeft;
  this.setTopLeftCoordinates(top,left,useTransition);
};

MapChartTooltip.prototype.maximizeToggle = function() {
//tooltipo is maximized then minimize and vice versa
  if (this.maximize) {
    this.minimizeWidth();    
  } else {
    this.maximizeWidth();        
  }
};

//override this function if you want to do some stuff after tooltip maximized
//eg. redraw contents of tooltip like charts
MapChartTooltip.prototype.onMaximize = null;

//override this function if you want to do some stuff after tooltip maximized
//eg. redraw contents of tooltip like charts
MapChartTooltip.prototype.onMinimize = null;

//Set that this module is loaded for egam
if (etrends.library.utilities) etrends.library.utilities.setModuleLoadedForEGAM('MapChartTooltip.js');

//# sourceURL=etrends/MapChartTooltip.js
