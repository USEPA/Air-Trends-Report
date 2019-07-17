if (! etrends) var etrends = {};
if (! etrends.library) etrends.library = {};

etrends.library.MapChartExportMenu = function (host) {
  //host is the map or chart that title is getting added to
  this.host = host;
//This to show the checkbox to change Ydomain to percent for charts. default is to hide it.
  this.allowConvertYdomainToPercent = false;
  //If box checked then show actual values (will have to change convertYdomainToPercentLabel to something like Show Totals)
  this.revertConvertYdomainToPercent=false;
  //Label for the Show Percent checkbox
  this.convertYdomainToPercentLabel = "Show Percent"
//This for hard coding the export columns  
  this.exportColumns = null;
//This to change the margins for exporting/printing  
  this.exportMargin = null;
//  var selectors = [self.title.svg.node(),self.svgBottom.node(),self.legend.svg.node()];
//svgExportElements are DOM elements that will be exported as PNG or printed
  this.svgExportElements = null;
  //This set if you want to hard link to file with no processing
  this.hardcodedDownloadPath = null;
};

etrends.library.MapChartExportMenu.prototype.addMenu = function () {  
    var self = this;

    var menuIconSelector = "#" + self.host.domID + "-container .etrends-chart-menu";
    self.menu = 	d3.select(menuIconSelector);
    //If no menu icon then just return
    if (self.menu.empty()) return;

  //Add the tooltip now
  //Find if there is a custom template if not resort to standard
  var tooltipTemplate = '.' + self.host.domID + '-menu-tooltip-template';
  if ($(tooltipTemplate).length==0) tooltipTemplate = '.etrends-chart-menu-tooltip-template-standard';

  //Force the tooltip host to be header and menu icon not the chart. Firefox didn't like being relative to chart for hovering
  var tooltipHost = {domID:self.host.domID + '-header',relativeSelector:null,useRelativeTooltip:true};
//  var host = {domID:self.host.domID + '-header',relativeSelector:menuIconSelector,useRelativeTooltip:true};

  if (! self.tooltip) self.tooltip = new MapChartTooltip(tooltipHost,".etrends-chart-menu-tooltip",tooltipTemplate);
  self.tooltip.offset = {x:1*($(self.menu.node()).width()/2+0),y:.3*($(self.menu.node()).height()),toLeft:true};

//set up debouncer for hovering over menu
  if (! self.hoverMenuDebouncer) self.hoverMenuDebouncer = new MapChartDebounce(1000);
  if (! self.hoverMenuTooltipDebouncer) self.hoverMenuTooltipDebouncer = new MapChartDebounce(1000);


//Hide the tooltip when cursor leaves
  self.tooltip.div
  .on('mouseleave', function () {
      self.hoverMenuTooltipDebouncer.debounce(function () {
        if (self.tooltip.showing) return;
        self.tooltip.hideToolTip();
      })();
  })

//Don't pass any data to the tooltip. Just use the hardcoded message
  self.menu
      .on('keydown', function () {
          if (d3.event.keyCode === 13) {
            var menIconElement = this;
            onMounseEnter(menIconElement);
          }
          if (d3.event.keyCode === 27) {
            self.hideMenu();
          }
        })
      .on('mouseenter', function () {
        var menIconElement = this;
        self.hoverMenuDebouncer.debounce(function () {
          onMounseEnter(menIconElement);
          },200)(); //Note for mouse entering we don't want much delay but needed some for firefox to work
        })
      .on('mouseleave', function () {
        //Had to delay this so that it works in firefox. Also makes it easier to hover over menu list
        self.hoverMenuDebouncer.debounce(function () {
          self.hideMenu();
          })(); //Note:when leaving have delay a bit longer
        })
      .on('click', function (d) {
          //Arthur doesn't want menu to be clicked on and off now
          return;
//Don't need to do tooltip stuff again since we are hovering it on click (don't want to create duplicate lines)
//Make this a toggle to turn off for now
          if (self.tooltip.showing) {
            self.tooltip.showing= false;
            //if hovered over menu icon and clicked menu on and off. need to turn on when clicked again if this happens            
            self.tooltip.clickedOff= true;
            self.tooltip.hideToolTip();
          }else {
            self.tooltip.showing = true;
            if (self.tooltip.clickedOff) {
              self.menu.on('mouseenter').call(self.menu.node());
            }

          }
        });

    function onMounseEnter(menIconElement) {
            self.tooltip.hovering=true;
            //convertYdomainToPercentChecked will be accessed using <<convertYdomainToPercentChecked>>
            var convertYdomainToPercentChecked = self.host.convertYdomainToPercent ? true : false;
            //Allow checkbox to be reverted so that checked means showing actual values not percents
            if (self.revertConvertYdomainToPercent) convertYdomainToPercentChecked = !convertYdomainToPercentChecked;

            self.tooltip.data.convertYdomainToPercentChecked = convertYdomainToPercentChecked ? 'checked' : '';
            self.tooltip.data.convertYdomainToPercentDisplay = self.allowConvertYdomainToPercent ? '' : 'none';
            self.tooltip.data.convertYdomainToPercentLabel = self.convertYdomainToPercentLabel;            
            self.tooltip.data.fileName = self.fileName;
            //self (this chart) will be accessed like <<dd.self.field>> for deep reference to chart members
            self.tooltip.showToolTip({self:self},menIconElement);

//In safari export PNG not working (I think because downloadJS not working). Don't show it
            if (etrends.library.utilities.BrowserType.safari || (window.isMobile && isMobile.apple.device)) {
                var exportPNG = self.tooltip.div.select(".exportPNG")
                $(exportPNG.node()).hide();
            }
            //chrome on iPhone won't export CSV
            if (etrends.library.utilities.BrowserType.chrome && (window.isMobile && isMobile.apple.device)) {
                var exportCSV = self.tooltip.div.select(".exportCSV")
                $(exportCSV.node()).hide();
            }
    }        
    
//Do some custom stuff here        
    if (self.externalAddMenu) self.externalAddMenu();        
};

//Have to make this exposed so we can hide via escape when menu item focused
etrends.library.MapChartExportMenu.prototype.hideMenu = function () {  
  var self = this;
  self.tooltip.hovering=false;

  if (self.tooltip.showing) return;
  //Also check that mouse is not hovering over tooltip            
  if ($(self.tooltip.div.node()).filter(':hover').length>0) return;
  self.tooltip.hideToolTip();  
};
etrends.library.MapChartExportMenu.prototype.focusMenu = function () {  
  var self = this;
  $(self.menu[0][0]).focus();
};

//Wacky things happening when trying to call download function in <a> onclick attribute in HTML
//Use this wrapper. Easier to test also.
etrends.library.MapChartExportMenu.prototype.downloadFile = function (fileName,options) {  
  return download(fileName);
};

etrends.library.MapChartExportMenu.prototype.exportCSV = function (fileName,options) {  
  var self = this;

  var type = options && options.delimiter && options.delimiter != 'csv' ? 'text/plain' : 'text/csv';

  //If they set hard file for download just used that
  if (this.hardcodedDownloadPath) {
  	download(this.hardcodedDownloadPath);
    return;   
  }

  var data = [];

//This is custom function to getData for each host type (chart vs map)
  if (self.getData) data = self.getData();

  var csv = Papa.unparse(data,options);

  //Now that data was converted to csv format (or whatever delimiter set in options) it can be downloaded
  var formBlob = new Blob([csv], { type:type });

	download(formBlob,fileName || 'ExportedData.csv',type);
  return;

  var link = document.createElement('a');
 
  link.href = window.URL.createObjectURL(formBlob);  
//  link.download = fileName || 'ExportedData.csv';
  $(link).attr('download', fileName || 'ExportedData.csv');

  $(link).text($(link).attr('download'));

  $('body').append($(link));

//  link.click();

//  $(link).remove();

}

etrends.library.MapChartExportMenu.prototype.print = function (title,width) {  
  var self = this;

  var $containerOriginal = $("#" + self.host.domID + '-container');
  var $container = $containerOriginal.clone();

  var printWindow = window.open('', 'PrintLineAreaChart');
  var html = '<html><head>';
  html += '<link rel="stylesheet" type="text/css" href="dist/css/etrends.min.css" />';
  html += '</head><body>';
  html += '<img />';  
  html += '</body><html>';

  printWindow.document.writeln(html);

  printWindow.document.title = title || 'Etrends Object To Print';

  self.export('png',null,width)
    .then(function (canvasdata) {
      //Note have to access the image that was created in the printWindow DOM for IE. Also works in Chrome and FF
      var image = $("img",printWindow.document)[0];
      image.onload = function() {
        console.log('img loaded');
        try {
//          $("body").append($(image));
//          $("body",printWindow.document).append($(image));
        } catch (ex) {
          console.error(ex);
          if (console.trace) console.trace(ex);
        }
        setTimeout(function () {
          printWindow.document.close();
          printWindow.print();
          printWindow.close();
        }, 0);
      };
      image.src = canvasdata;
  });

  return;


};

etrends.library.MapChartExportMenu.prototype.exportPNG = function (filename,width) {  
  if (! filename) filename = 'ExportedImage.png';
  return this.export('png',filename,width);
};

etrends.library.MapChartExportMenu.prototype.export = function (type,filename,width) {  
  var self = this;
//  var selectors = [self.title.svg.node(),self.svgBottom.node(),self.legend.svg.node()];
  //I no svg elements for export then show error  
  if (! this.svgExportElements) {
    console.error("Export Menu need svgExportElements field set to SVG DOM elements that will be exported/printed");
    return;
  }
  if (! type) type = 'png';

  var selectors = this.svgExportElements;
  //if string passed then make it an array
  if (typeof selectors == 'string') selectors=[selectors];
  //if function passed then execute
  if (typeof selectors == 'function') selectors = selectors();

  //This creates array of imgsrc object like {src:..,width:..,height:..}
  imageSRCs = selectors.map(function (selector) {return self.getSVGimageSRC(selector,width)});

  //Find max width and total height
  var width = imageSRCs.reduce(function (acc,val) {			
    return Math.max(acc,val.width);
  },0);
  var height = imageSRCs.reduce(function (acc,val) {
    acc += val.height;
    return acc;
  },0);
  
  var container = $("#" + this.host.domID + "-container");

  var scale = 1;
  if (width && width>container.width()) scale = width/container.width();
  var margin = 0;
  if (self.host.margin) margin = self.host.margin.top;  
  if (self.exportMargin || self.exportMargin == 0) margin = self.exportMargin;
  margin = margin*scale;
  
  var canvas = $("<canvas/>");
  canvas
  .attr("width", width)
  .attr("height", height+2*margin);

  var context = canvas[0].getContext("2d");

  //Get background color
  var backColor = getComputedStyle(container[0])["background-color"];

  context.fillStyle = backColor;
  context.fillRect(0,0,width,margin);

  var callback = function(item,lastResult){
    console.log("Here is last Result:");
    console.log(lastResult);

    var addToCanvas = self.addImageToCanvas;
    var src = item.src;
//If using IE then need to use the canvg library to drawSVG. Could use canvg for all browsers but would rather use browser to draw SVG if can
    if (item.isIE) {
      addToCanvas = self.addSVGtoCanvas;
      src = item.svgText;
    }
		return addToCanvas(context,src,0,lastResult.y)
//			return self.addSVGtoCanvas(context,item.svgText,0,lastResult.y)
//    return self.addImageToCanvas(context,item.src,0,lastResult.y)
    .then(function () {
      //return this result object so we know where to put next image
      lastResult.y += item.height;
      return lastResult;
    });
  };

  return etrends.library.utilities.loopDeferSeries(imageSRCs,callback,{y:margin})
    .then(function () {
      context.fillStyle = backColor;
      context.fillRect(0,height+margin,width,margin);
      
      var canvasdata = canvas[0].toDataURL("image/" + type);

      //If filename passed then save it. Otherwise return canvasdata as data URL. 
      //for printing don't pass filename because we just want URL to put on print page
      if (filename) {
				download(canvasdata,filename,"image/" + type);
				return;
        var a = document.createElement("a");
        a.download = filename;
        a.href = canvasdata;
        a.click();
      } 

//      $("body").append(canvas);
      
      return canvasdata;
    });
  
};

etrends.library.MapChartExportMenu.prototype.getSVGimageSRC = function (selector,width) {  
  var self = this;
  var svg = $(selector);
  //check if this is actually an SVG. If not then use convert HTML to SVG
  var parent;
  if (! svg.is('svg')) {
    svg = self.getSVGfromHTML(selector);		
    //parent is parent of the HTML element not the SVG foreign object
    parent = $(selector).parent();
  } else {
    svg
    .attr("version", 1.1);
//In IE 11 OuterHTML doesn't exist for SVG elements
//Have to get OuterHTML by cloning svg and appending to div and getting div innerHTML
//When doing this xmlns automatically gets added to SVG and adds two xmlns attributes if one already exists
//When two xmlns attributes exist IE 11 crashes when trying to add SVG as data: in img tag			
    if (svg[0].outerHTML) svg.attr("xmlns", "http://www.w3.org/2000/svg");							

    parent = svg.parent();
  }

  var svgClone = svg.clone();
  svgClone.attr("id","dumSVGclone");
  parent.append(svgClone);

  var emptySvgDeclarationComputed = getComputedStyle($('<svg version=1.1 xmlns="http://www.w3.org/2000/svg"></svg>')[0]);      
  svgClone.find('*').each(function (i,element) {
      self.explicitlySetStyle(element,emptySvgDeclarationComputed);
  });

//Have to set style for the actual svg element Also
  self.explicitlySetStyle(svgClone[0],emptySvgDeclarationComputed);
//Get rid of the height and width in the style attribute
  svgClone.css("height","");
  svgClone[0].style.removeProperty("height")
  svgClone.css("width","");
  svgClone[0].style.removeProperty("width")

//If width passed then scale SVG to this width
//But don't scale down if window maximized 
  var container = $("#" + self.host.domID + "-container");

  var scale = 1;
  //Not sure why this wants outer width I think stuff was over flowing into padding
  var containerWidth = container.outerWidth();

  if (width && width>containerWidth) {
    scale = width/containerWidth;
    //Have to wrap svg contents in a group and then scale that group
    svgClone.children().wrapAll("<g></g>");
    
    svgClone.children().attr("transform","scale(" + scale + ")");
//    svgClone.children().attr("transform","translate(" + translate + ")scale(" + scale + ")");
    svgClone.attr("width",scale*containerWidth);
    svgClone.attr("height",scale*svgClone.height());

//Sometimes need this so the actual SVG will render after the grouping is added
    svgClone.html(svgClone.html());    
  } else {
    svgClone.attr("width",containerWidth);    
    svgClone.attr("height",svgClone.height());    
  }

//Make sure background color works. wasn't working for IE of course
var isIE = svg[0].outerHTML?false:true;  
var backColor = getComputedStyle(svgClone[0])["background-color"];
var background = $('<rect>')
  .attr("fill",backColor)
//  .attr("fill","red")
  .attr("width",svgClone.attr("width"))
  .attr("height",svgClone.attr("height"));

svgClone.prepend(background);
//In IE 11 OuterHTML doesn't exist for SVG elements
//Have to get OuterHTML by cloning svg and appending to div and getting div innerHTML
  var svgText = svgClone[0].outerHTML;
  if (! svgText) svgText = $('<div>').append(svgClone.clone()).html();			
          
//  var imgsrc = 'data:image/svg+xml;base64,'+ btoa(unescape(encodeURIComponent(svgText)));
//Supposedly don't need base64 for SVG and it will compress better
  var imgsrc = 'data:image/svg+xml,'+ encodeURIComponent(svgText);

  var obj = {src:imgsrc,width:svgClone.width(),height:svgClone.height(),svgText:svgText,isIE:isIE}; 

  //remove the svgClone now that we got it as an image
  svgClone.remove();


  return obj;
};

etrends.library.MapChartExportMenu.prototype.explicitlySetStyle = function (element,emptySvgDeclarationComputed) {  
    var $emptyElement = $("<" + element.tagName + " class='testEmptyElement'></" + element.tagName + ">");
    //have to add the new empty element or it won't get default styles

//    $(element).parent().append($emptyElement);
    $("html").append($emptyElement);

    emptySvgDeclarationComputed = getComputedStyle($emptyElement[0]);

    var cSSStyleDeclarationComputed = getComputedStyle(element);
    var i, len, key, value;
    var computedStyleStr = "";
    for (i=0, len=cSSStyleDeclarationComputed.length; i<len; i++) {
        key=cSSStyleDeclarationComputed[i];
        value=cSSStyleDeclarationComputed.getPropertyValue(key);

        if (! this.StyleFieldLimit && this.StyleFieldLimit != 0) this.StyleFieldLimit= cSSStyleDeclarationComputed.length;

        if (i < this.StyleFieldLimit) {
          if (key=="font-size" ) {
//            console.log('test');
          }
          if (value!==emptySvgDeclarationComputed.getPropertyValue(key)) {
              computedStyleStr+=key+":"+value+";";
          }
        }
    }
    //Now we can safely remove this. 
    $emptyElement.remove();

    if ($(element).attr("class")=="species-chart-Sea-salt") {
      console.log('sea salt');
    }
//    console.log(element);
    element.setAttribute('style', computedStyleStr);
};

etrends.library.MapChartExportMenu.prototype.getSVGfromHTML = function (selector) {  
  var html = $(selector);

  var svgData = '<svg xmlns="http://www.w3.org/2000/svg">' +
          '<foreignObject width="100%" height="100%">' +
          '<div xmlns="http://www.w3.org/1999/xhtml" >' +
          html[0].outerHTML +
          '</div>' +
          '</foreignObject>' +
          '</svg>';

  var svg = $(svgData);

  svg
  .attr("version", 1.1)
  .attr("width", html.width())
  .attr("height", html.height());

  svg.width(html.width());
  svg.height(html.height());

  return svg;
};

etrends.library.MapChartExportMenu.prototype.addImageToCanvas = function (context,src,x,y) {  
  var defer = $.Deferred();

  var image = new Image;
  image.onload = function() {
    context.drawImage(image, x, y);
    defer.resolve();
  };
  try {
    image.src = src;
  } catch(ex) {
    console.error(ex);
  }
//  $("body").append(image);

  return defer.promise();
};

etrends.library.MapChartExportMenu.prototype.addSVGtoCanvas = function (context,svg,x,y) {  
  var defer = $.Deferred();

  context.drawSvg(svg, x, y);

  defer.resolve();
  
  return defer.promise();
};
//# sourceURL=MapChartExportMenu.js