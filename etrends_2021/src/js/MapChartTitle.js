if (! etrends) var etrends = {};
if (! etrends.library) etrends.library = {};

etrends.library.MapChartTitle = function (host,selector) {
  //host is the map or chart that title is getting added to
  this.host = host;
  this.text = '';
  //Title is SVG by default. If set to false then uses HTML and print/export PNG is broken
  this.useSVG = true;
  this.autoWrap = true;
  //By default no spacing  between the lines. 1 would mean 1 line height between lines
  this.spacing = 0;
  //optionally can pass class name in case it must be different (eg: for emissions totals needed differnt class name with no media queries)
  this.selector = selector || ".etrends-chart-title";
  //hack for mac Safari subscript vertical space to be counted in height calculation
  this.macSafariSubscriptHackSpacing = .35;
};

etrends.library.MapChartTitle.prototype.draw = function (text) {  
  var self = this;
  self.container = d3.select("#" + self.host.domID + "-header " + self.selector);
  
  //if pass text then reset it
  if (text) self.text = text;
  
  //If title is SVG then need to remove inline margin get back the stylesheet margin
  //I think need to do this before we autowrap
  if (self.useSVG)  {
      self.container.style("margin-left","");
      self.container.style("margin-right","");
  }
  if (self.autoWrap) self.autoWrapTitle();

  //If they put span in title div assume they are using html title otherwise it is SVG title
  if (self.useSVG) {
    addTitleSVG(self.lines);
  }else {
    addTitleHTML(self.lines);
  }

  function addTitleSVG(lines) {
//if using svg then need to clear the margins because we want SVG to be full avgWidth
      self.container.style("margin-left","0px");
      self.container.style("margin-right","0px");

    var outerWidth = $(self.container.node()).outerWidth(true);

    if (! self.svg) {
      self.svg = self.container.append('svg')
    } else {
      //try to detach and append so that maybe title center correctly because it gets stuck redrawing
      etrends.library.utilities.detachAppendElement(self.svg.node(),self.container.node());
    }  
    self.svg    
        .attr('width',  outerWidth)
        .attr('height', 1000);

    if (self.group) self.group.remove();
     self.group = self.svg.append('g');

    var containerWidth = $(self.container.node()).width();
    var maxScale = 0;
    var textElements = [];
    lines.forEach(function (text,i) {
      //let there be a span around a line with a class to support things like subtitles
      //test if HTML is passed so we can get class if it is 
      var htmlElement = null;
      //This will crash if section isn't really HTML
      try {
        htmlElement = $(text);
      } catch(err) {
        htmlElement = null;
      }

      var textClass = null;
      if (htmlElement && htmlElement.prop("tagName")=="SPAN") {
        textClass = htmlElement.attr("class");
        text = htmlElement.html();
      }
      var element = self.group.append('text')
          .attr("text-anchor", "middle")
          .attr("x", outerWidth/2)
          .text(text);

      textElements.push(element);

      if (textClass) element.classed(textClass,true);

      //Get rid of nbsp; and just make space (had to do this by setting opacity to 0 or space was being trimmed)
      if (text == 'nbsp;') element.style('opacity',0);      

      //Scale the width of the text line to fit container.
      var scale = element.node().getBBox().width / containerWidth;
      if (scale > maxScale) maxScale = scale;


    });

    //Now loop over elements to get y positions
    var y = 0;
    var spacing = self.spacing || 0;
    var firstDescent;
    
    textElements.forEach(function (element,i) {
    //reset size to what is in style sheet
      element.style("font-size","");
      if (maxScale > 1) {
        var maxFontSize = parseInt(element.style("font-size"));
        element.style("font-size", maxFontSize/maxScale + "px");           
      }

      var textHeight = element.node().getBBox().height;

      y += element.node().getBBox().height;
      if (i>0) {
        y += spacing*textHeight;
      } else {
        var isMacSafariOrMacMobile = false;
        if (etrends.library.utilities.BrowserType.mac && etrends.library.utilities.BrowserType.safari) isMacSafariOrMacMobile=true;
		//Check to see if isMobile library is being used otherwise don't cause break if consumer doesn't care about mobile
        if (window.isMobile && isMobile.phone) isMacSafariOrMacMobile=true;
        
        //If this is Mac Safari then multiply height by cluge factor to account for possible subscript. kinda hacky but works for now
        if (isMacSafariOrMacMobile) {
          y += self.macSafariSubscriptHackSpacing*textHeight;
        }
      }
  //      element.attr("alignment-baseline","after-edge");


      element.attr("y", y);

    });
    var totalHeight = y;

    //Not sure why but looks like there is some space at top of group between text and svg
    //lets move text back up to be at top of svg
    var topSpace = self.group.node().getBBox().y;
    //correct each element by topSpace
    textElements.forEach(function (element,i) {
      var y = element.attr("y");
      element.attr("y", y-topSpace);
    });

    //now get the total height of text
    //Note: Safari doesn't have the wierd space at top that I am correcting for. 
    //Don't add for Safari or it will cut off subscripts
    if (!(etrends.library.utilities.BrowserType.mac && etrends.library.utilities.BrowserType.safari)) {
      totalHeight = totalHeight - topSpace;			
		}
    //to ensure there is not cutoff check group height and use that for totalHeight if bigger
    totalHeight = Math.max(totalHeight,self.group.node().getBBox().height);
    totalHeight = Math.ceil(totalHeight);

    //get the height after removing the descender
//    var height = self.group.node().getBBox().height;// - firstDescent; // added the *1.35 to deal with safari rendering of subscript x
    //Actually the total height should be the final y value
    //Note sure what I was doing before but this is more solid    
    self.svg.attr('height', totalHeight); //round up
    $(self.container.node()).height(totalHeight);

  }
  function addTitleHTML(lines) {
  //create span to put title in if not exists
    if (! self.html) self.html = self.container.append("span");   
//reset max font size to come from CSS  
    self.html.style("font-size","");
    var maxFontSize = parseInt(self.html.style("font-size"));
    self.html.html(self.text);
    var available = $(self.container.node()).width();
//    var available = .9 * $("#" + this.domID + "-container").width();
    var scale = $(self.html.node()).width() / available;

    //reset size to what is in style sheet
    self.html.style("font-size","");
    if (scale > 1) {
      var maxFontSize = parseInt(self.html.style("font-size"));
      self.html.container.style("font-size", maxFontSize/scale + "px");           
    }
  }
};

etrends.library.MapChartTitle.prototype.autoWrapTitle = function () {
  var self = this;
//  var availableWidth = $("#" + self.domID + "-container").width();
  var availableWidth = $(self.container.node()).width()

//now allow to force breaks so loop over each section between breaks
var lines = [];
self.text.split(/<br\/>/g).forEach(function (section) {
//If there is span wrapping this section then need to remove for wrapping and add later
  var sectionElement = null;
  //This will crash if section isn't really HTML
  try {
    sectionElement = $(section);
  } catch(err) {
    sectionElement = null;
  }
  var sectionHasSpan = false;
  var sectionClass = null;
  if (sectionElement && sectionElement.prop("tagName")=="SPAN") {
    sectionHasSpan = true;
    section = sectionElement.html();
    sectionClass = sectionElement.attr("class");
  }

  var words = section
  .replace(/<\/div><div>/g," ")
  .replace(/<div>/g,"")
  .replace(/<\/div>/g,"")
  .split(" ");

  var sectionlines = evenWrapLines(words,availableWidth,sectionClass);
  //This will put the span wrapping section on each line produced by auto wrapping
  if (sectionHasSpan) {
    //Trick because some browser don't like outerHTML
    //var outerHTMLdiv = $("<div>");
    //outerHTMLdiv.append(sectionElement);
    sectionlines.forEach(function (line,i) {
      sectionElement.html(line);
//      lines[i] = outerHTMLdiv.html()
      sectionlines[i] = sectionElement[0].outerHTML;
    });
  }

  lines = lines.concat(sectionlines);
});

  self.lines = lines;

//reset the text to be the autowrapped version
  self.text = self.lines.join("<br/>");
//  self.text = self.lines.reduce(function (acc,val) {
//    acc += "<div>" + val + "</div>";
//    return acc;
//  },"");

  return self.lines;

  function evenWrapLines(words,maxWidth,wordsClass) {
    //get a temporary span for adding words
    var tempSpan = $("<span></span>");
    if (wordsClass) tempSpan.attr("class",wordsClass);
    $(self.container.node()).append(tempSpan);
    var wordWidths = words.map(function (word) {
      //note add space between words. These can add up (note: had to use non breaking space for space to be recoginzed in width)
      tempSpan.html(word + "&nbsp;");
      return tempSpan.width();
    });
    tempSpan.remove();
    var wordWidthTotal = wordWidths.reduce(function (acc,val) {
      return acc+val;
    },0)
    
    var nLines = Math.ceil(wordWidthTotal/maxWidth)
    //Avg width characters would fit in
    var avgWidth = wordWidthTotal/nLines;

    var lines = [""];
    var usedWidth = 0;
    var lineIndex = 0;
    var lineWordIndex = 0;
    //If it is last word that fits inside max width this set to 1 so that word is on current line not next line
    var lastWordFits = 0;
    words.forEach(function (word,wordIndex) {

      usedWidth += wordWidths[wordIndex];
      if (usedWidth>avgWidth) {
        //If usedWidth is outside maxWidth put on next line unless it is first in row
        if (usedWidth>maxWidth && lineWordIndex>0) {
          //Have to add this word to usedWidth for next line to start with
          usedWidth = wordWidths[wordIndex];
          lineWordIndex = 1;
        }else {
          //Everything fits on current line
          lastWordFits = 1;
          usedWidth = 0;
          lineWordIndex = 0;
        }
        //Don't push another line if this is last word unless last word is going on next line
        if (!(lastWordFits && wordIndex==words.length-1)) lines.push("");
        lineIndex +=1;
      } else {
        lineWordIndex += 1;        
      }
      //if lastWordFits then include on current line by subtracting one from LineIndex that was incremented above
      if (lines[lineIndex-lastWordFits]) word = " " + word;
      lines[lineIndex-lastWordFits] += word;

      lastWordFits = 0;
    });

    return lines;    
  }
};

//Set that this module is loaded for egam
if (etrends.library.utilities) etrends.library.utilities.setModuleLoadedForEGAM('MapChartTitle.js');

//# sourceURL=etrends/MapChartTitle.js
