if (! etrends) var etrends = {};
if (! etrends.library) etrends.library = {};
if (! etrends.library.utilities) etrends.library.utilities = {};
if (! etrends.usMapCache) etrends.usMapCache = {};

etrends.library.utilities.loopDeferSeries = function (array,callback,init) {
  var results = [];
  var promise = $.when(init);
  $.each(array,function(i,obj){
    promise=promise.then(function (result) {
      if (i>0) results.push(result);
      return callback(obj,result)
    });
  });
  
  return promise.then(function (result) {
    results.push(result);
    return results;
  });
};

etrends.library.utilities.mouseContainedBy = function (element,buffer,reverse) {
  //if buffer passed then expand (contract if negative) bounds of element for determining mouse containment
  //can also pass reverse as boolean to negate current buffer
  if (!buffer) buffer = {top:0,right:0,bottom:0,left:0};
  var sign = 1;
  if (reverse) sign = -1;
  var bb = element.getBoundingClientRect();
  if (d3.event.clientX < bb.left-buffer.left*sign || d3.event.clientX > bb.right+buffer.right*sign) return false;
  if (d3.event.clientY < bb.top-buffer.top*sign || d3.event.clientY > bb.bottom+buffer.bottom*sign) return false;
  return true;
};

//This to deal with way jquery promise errors can't be "caught"
//instead the .fail() just ends the promise chain but sometimes want to just catch the error and move on
etrends.library.utilities.catchPromise = function (promiseFn,errorFn) {  
  return function (arg) {
    var defer = $.Deferred();
    promiseFn(arg)
    .then(function (data) {
      defer.resolve(data);
    })
    .fail(function (error) {
      var errorResult = typeof(errorFn)==='function' ? errorFn(error) : errorFn;
      //allow error function to return promise
      //so we don't move on in chain until error function resolves
      $.when(errorResult)
        .then(function (data) {
          defer.resolve(data);
        })
    });
    return defer.promise();
  }
};

etrends.library.utilities.loadMapOrGraph = function (args,callback) {
//loadMapOrGraph can be used with d3-queue that requires callback to be executed when done
//This callback has error as first argument and results as second argument
//In this loadMapOrGraph if there is an error downloading function then call callback with the error as arg and go no further
//Otherwise just call callback at very end with null argument after args.done function called
//The result of args.done will be passed as results argument to callback
//If not using d3-queue then don't pass callback

//can also pass arg.cache and arg.key to cache this file
  var loadDataFunction = loadDataFromFile;
  //If cache passed but no key then assume file will be the key
  //Sometimes good to pass an identifier as a key if we want to use the data download somewhere else (file not very practical identifier)
  var key = args.key || args.file;
  if (args.cache && args.cache[key]) {
    loadDataFunction = function () {
      return args.cache[key];
    }
  }
  //if not done function assume just reading in data to cache and create empty function
  if (!args.done) args.done = function () {};
  return $.when(loadDataFunction(args.file))
//gets data and passes to done
    .then(args.done)
//pass result of done to the callback that was passed that needs error and data    
    .then(function (result) {
      if (callback) callback(null,result)
    })
//If error then pass to the callback    
    .fail(function (error) {
      console.error(error);
      if (callback) callback(error);
    });
        
  function loadDataFromFile(file) {
    var defer = $.Deferred();
  //for now just support these files until I add more. default to csv I guess.
    var availableExt = ['csv','json'];
    var ext = args.file.split('.').pop();
    if (availableExt.indexOf(ext) < 0) ext = 'csv';
    
    d3[ext](file, function (error, data) {
      if (error) {
        defer.reject(error); 
      } else {
        //cache data if using cache
        if (args.cache) args.cache[key] = data;
        defer.resolve(data);
      }
    });

    return defer.promise();
  }
  
}

etrends.library.utilities.requestEndpoint = function(endpoint,options) {
  var self = this;
  var defer = $.Deferred();

  if (!options) options = {};

  if (!options.dataType) options.dataType = 'text';

    //merge the options into the request object
  var request =  $.extend({
        url: endpoint,
        success: function(data, textStatus, jqXHR) {
          var hasErrors = false;
          if (Array.isArray(data.errors)) {
              hasErrors = data.errors.length > 0;
          } else {
              if (data.errors) hasErrors = true;
          }
          if (hasErrors) {
              defer.reject(data.errors);
          }
          defer.resolve(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            defer.reject('Error requesting endpoint with status ' +
                textStatus + ': ' + errorThrown);
        }
  },options);

  //sometimes when debugging in dev tools, running requests were crashing
  //When i ran this on next tick it seemed to make it not crash
  setTimeout(function () {
    $.ajax(request);
  },0);

  return defer.promise();
};

etrends.library.utilities.makeTabs = function (tabs,names,click,html,attrs) {
//attrs is object with key for each menu item name and value is object of attributes for that menu item
  tabs.selectAll("*").remove();

//loop over the emissions for this pollutant
  names.forEach(function (name, i) {
//first item is active by default
    var active=false;
    if (i===0) active=true;
    var itemHTML = name;
    //the html for each tab can be passed in. By default the name identifying tab is same as html
    //name is passed to click function to identify which tab was clicked
    if (html && html[name]) itemHTML = html[name];
    var tab = tabs.append("li")
      .html(itemHTML)
      .classed("active",active)
	  .attr("role","button") //added for accessbility
	  .attr("tabindex","0") //added for accessbility
	  .attr("aria-selected",active) //added for accessbility https://simplyaccessible.com/article/danger-aria-tabs/
      .on("click",function () {
        //execute the click function passed in supplying name as arg
        click(name);
		//make all not active and then active to only clicked
        d3.select(this.parentNode).selectAll("li").classed("active",false).attr("aria-selected",false);        
        d3.select(this).classed("active",true).attr("aria-selected",true);        
      })
	  //added this block for accessbility
	  .on("keydown",function(){
		// 13 = Return, 32 = Space
		if (d3.event.keyCode === 13) {
			//execute the click function passed in supplying name as arg
			click(name);
			//make all not active and then active to only clicked
			d3.select(this.parentNode).selectAll("li").classed("active",false);        
			d3.select(this).classed("active",true);
		}			
	  })
//if no attrs at all then exit
    if (! attrs) return;    
//if no attrs for this item then exit
    var itemAttrs = attrs[name];
    if (! itemAttrs) return;
//Now add the attrs that were passed    
    Object.keys(itemAttrs).forEach(function (attr) {
      tab.attr(attr,itemAttrs[attr])      
    })
  })
}

//More convenient to use this to make USmaps
etrends.library.utilities.makeBaseMap = function (argsBase,callback) {
  if (!argsBase) argsBase={};
  //argsUS.map is classifiedPointsMap instance that will map States using file downloaded
  //argsUS.makeLayers is function that makes layers such as points if provided
  //Note: if neither passed then this will just get the map data for caching
  var args = {};
  //By default use the US map
  args.file = argsBase.file || "data/us.json";
  args.key = 'basemap';
  args.done = function (data) {
//This actually creates state map. Note pass state fip code to make dropdowns
    if (argsBase.map) argsBase.map.mapStates(data,etrends.usMapCache.state_fip_codes);
    if (argsBase.makeLayers) argsBase.makeLayers(callback);
  };

//Note: pass cached info so we don't keep hitting server  
//This is a global cache so we don't have to hit server for every map on page
  args.cache = etrends.usMapCache;

//If not mapping points then need to pass a callback to loadMapOrGraph otherwise don't because makeConcentrationLayer gets callback 
  if (argsBase.makeLayers) {
    return etrends.library.utilities.loadMapOrGraph(args);
  }else {
    return etrends.library.utilities.loadMapOrGraph(args,callback);
  }
}

//Given a regex with groups and /g multiple matching. returns array of each match containing matched groups
//eg: re = /<<loop:([^>]*)>>(.*?)<<\/loop>>/g; and text = 'begin<<loop:rows>>name:<<d.name>>age:<<d.age>><</loop>>other stuff <<loop:rows2>>name2:<<d.name2>>age2:<<d.age2>><</loop>>end';
//would return [[<<loop:rows>>name:<<d.name>>age:<<d.age>><</loop>>,rows,name:<<d.name>>age:<<d.age>>],[<<loop:rows2>>name2:<<d.name2>>age2:<<d.age2>><</loop>>,rows2,name2:<<d.name2>>age2:<<d.age2>>]]
etrends.library.utilities.getMatchesWithGroups = function (text, re) {
  var matches = [];
  var match;
  while (match = re.exec(text)) {
    var groups = match.map(function (m) {return m})    
    matches.push(groups);
  }
  return matches;
};

etrends.library.utilities.isNumeric = function (n) {
  return !isNaN(parseFloat(n)) && isFinite(n);
}

etrends.library.utilities.round = function(value,places) {
  //make sure value is not string
  value = +value;
  //defaults to just math.round
  if (!places) return Math.round(value);
  var mult = Math.pow(10,places);
//note this only works in newer es6 js. won't minify
//  var mult = 10**places;
//not sure why I only allowed mult=10 for egam code I borrowed this from
// will allow more than one place here for now  
//  var mult = 10;
  return Math.round((value + Number.EPSILON) * mult) / mult;
};

etrends.library.utilities.addDays  = function (date,days) {
  if (typeof(date)==='string') date = new Date(date);
  var currentDay = date.getDate();
  date.setDate(currentDay+days);
  return date;
}

etrends.library.utilities.getWordWidths = function (container,words,wordsClass) {
    //container is element to temporarily add to
    var tempSpan = $("<span></span>");
    if (wordsClass) tempSpan.attr("class",wordsClass);
    $(container).append(tempSpan);
    var wordWidths = words.map(function (word) {
      //note add space between words. These can add up (note: had to use non breaking space for space to be recoginzed in width)
      tempSpan.html(word + "&nbsp;");
      return tempSpan.width();
    });
    tempSpan.remove();
    return wordWidths;    
};

//Kind of hacky workaround because alot of functions here are based on D3 queue but would be easier to use promises
//Takes a series of function that expect to receive callback that they execute when done
etrends.library.utilities.convertD3queueToPromise =  function (series) {
  var defer = $.Deferred();
  if (typeof series=='function') series = [series];
  if (! series || series.length==0) defer.reject(new Error('Need to pass at least one function to convertD3queueToPromise'));

  var q = d3_queue.queue([1]);
  //Add each function as a defer
  for (var i=0;i<series.length;i++) {
    q.defer(series[i]);
  }
  //Add await function that triggers when series is done
  q.await(function (error) {
    if (error) defer.reject(error);
    defer.resolve();
  });
  
  return defer.promise();
};

etrends.library.utilities.addScrollMagicTrigger =  function (args) {
  if (!('triggerElement' in args.scene)) return console.error('Scroll Magic Trigger Not Added because "triggerElement" not field on passed args');
  var sceneDefaults = {
    triggerHook: 1, // The blue "trigger" marker / 0 = top of browser, .5 = middle, 1 = bottom 
    duration: 450, // 450px tall
    reverse: false // when set to false it will only run the scene once when scrolling down the page
  }
  for (var sceneField in sceneDefaults) {
    if (!(sceneField in args.scene)) args.scene[sceneField] = sceneDefaults[sceneField];				
  }

  var scene = new ScrollMagic.Scene(args.scene)
  //.addIndicators() // for debugging; adds start, end and trigger indicators on right side of window
  .addTo(args.controller);
  
  // add listeners
  if (args.onenter) scene.on("enter", args.onenter); // On entering the scene duration area fire the callback
  // remove listeners
  if (args.onleave) scene.on("leave", args.onleave);
  return scene;
};

etrends.library.utilities.fitChartToChart = function(sourceChart,targetChart) {
  //If on mobile don't try to resize chart so mobile fits screen. Was crashing
  if (isMobile.any) return;
  if(!sourceChart || !targetChart) return;

  var tol = 5;
  var sourceContainerHeight =  sourceChart.getContainer().height();
  var targetContainerHeight =  targetChart.getContainer().height();

  if(Math.abs(sourceContainerHeight-targetContainerHeight)<tol) return;

  //try to fit to height of concentrations averages
  //get size of extra stuff on totals chart like title and legend (other than actual chart=height)
  var targetExtra = targetContainerHeight - targetChart.height;
  //the new height + extra needs to be height of baseChart container
  var newTargetHeight = sourceContainerHeight - targetExtra;
  //override height is not full height of chart but size without margins so use getChartHeigh
  var overrideHeight = targetChart.getChartHeight(newTargetHeight);
  if (overrideHeight > targetChart.minimumHeight) {
    targetChart.overrideHeight = overrideHeight;
        //Make sure the chart is visible when making chart or it won't redraw
        var saveVisible = targetChart.visible;
        targetChart.visible = true;
        targetChart.makeChart();
        targetChart.visible = saveVisible;
  }
};

etrends.library.utilities.detachAppendElement = function(element,container) {
    var $svg = $(element);
    var $detachedSVG = $svg.detach();
    var $container = $(container);
    $container.append($detachedSVG);  
};

//This just sets the anchor tag but doesn't jump the page to that section like setting window.location.hash
etrends.library.utilities.pushAnchorTag = function (anchorTag) {
    anchorTag = anchorTag.replace(/^#/,'');

    var location = window.location.pathname + window.location.search;
    location += "#" + anchorTag;

    window.history.pushState({}, null, location);
};

etrends.library.utilities.downloadURL = function (args) {
  //if string passed that is url otherwise args is object like {url,fileName}
  //if fileName not set then use url as fileName
  if (typeof(args)==="string") args = {url:args};

  var url = args.url;
  //IE has to use download lib, newer browers can use native download code
  if (etrends.library.utilities.BrowserType.ie) {
    //if blob passed then use that instead of url
    if (args.blob) url = args.blob; 
  
    //if type not set have to assume 'application/octet-stream'
    //not best default but is can't really guess the type very easily
    download(url,args.fileName,args.type || 'application/octet-stream');
  } else {
    //if blob passed then need to create url from blob
    if (args.blob) url = window.URL.createObjectURL(args.blob);
  
    var link = document.createElement('a');
 
    link.href = url;  
    link.download = args.fileName || url;
    link.click();  
  }

};



(function () {
  var type = {};

  var ua = window.navigator.userAgent;
  type.mac=false;
  if (navigator.appVersion.indexOf("Mac")!=-1) type.mac=true;

  type.ios=false;
  if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) type.ios=true;

  type.opera = !!window.opera || /Opera/.test(ua);
      // Opera 8.0+ (UA detection to detect Blink/v8-powered Opera)
  type.firefox = typeof InstallTrigger !== 'undefined';   // Firefox 1.0+
  type.safari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
      // At least Safari 3+: "[object HTMLElementConstructor]"
  type.chrome = !!window.chrome || /CriOS/.test(ua);// Chrome 1+
  type.ie = /Trident\/|MSIE /.test(ua);
  type.edge = /Edge/.test(ua);
  //Kind of buggy bug edge has window.chrome so if edge is true set chrome to false
  //Probably not the best idea to have boolean value for each browser instead of just one type field which is string=browser
  //I think maybe did it this way to be consisted with isMobile object? 
  if (type.edge) type.chrome = false;
 
   etrends.library.utilities.BrowserType = type;
})();

//Function to set that module it loaded for EGAM
etrends.library.utilities.setModuleLoadedForEGAM = function(file) {
  var self = this;
  if (window.egam && egam.moduleLoader) {
    //This is just sample of what would be needed if etrends had used the egam model
    //Say utilities was object in IIFE being saved to etrends.modules.root.utilities
    //Need to pass the root etrends
    //egam.moduleLoader.saveModule("root.utilities",utilities,etrends);
    //These saveModule on remote module will set loadState to true so .use() will resolve
    //We could have got away with just use setLoaded(),
    //But saveModule was used for testing module being returned by moduleLoader.use()
    //which turned out to be pattern that didn't really fit the system
    //
    //egam.moduleLoader.saveModule(":=http://localhost/etrends_2019/src/js/EtrendsUtilities.js",etrends.library.utilities);
    //Actually should be ok to save references to both places that caller will look for the module
    //egam.moduleLoader.saveModule(":=https://raisz.aa.ad.epa.gov/etrends_2019/src/js/EtrendsUtilities.js",etrends.library.utilities);

    //Note the := "Punisher" prefix  means module is full url to be downloaded from egam
    var version = "2022";
    egam.moduleLoader.setLoaded(":=http://localhost/etrends_" + version + "/src/js/" + file,true);
    egam.moduleLoader.setLoaded(":=https://raisz.epa.gov/etrends_" + version + "/src/js/" + file,true);
    egam.moduleLoader.setLoaded(":=https://gispub.epa.gov/air/trendsreport/" + version + "/src/js/" + file,true);
  }    
};

//Set that this module is loaded for egam
etrends.library.utilities.setModuleLoadedForEGAM('EtrendsUtilities.js');

//# sourceURL=etrends/EtrendsUtilities.js