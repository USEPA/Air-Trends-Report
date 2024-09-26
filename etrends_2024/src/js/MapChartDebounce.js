var MapChartDebounce = function (delay) {
  this.timeoutID = -1;
  this.delay=delay || 200;
}

MapChartDebounce.prototype.debounce = function(fn, timeout) 
{
  var self = this;
  //if no timeout/delay passed then use default stored on object
  if (!timeout) timeout = self.delay;
  return function() {
//       console.log(self.timeoutID + ' at beginning ');
     if (self.timeoutID > -1) {
//       console.log(self.timeoutID + ' was cleared');
        window.clearTimeout(self.timeoutID);
     }
   self.timeoutID = window.setTimeout(fn, timeout);
//       console.log(self.timeoutID + ' was created with timeout = ' + timeout);
  }
};

//Set that this module is loaded for egam
if (etrends.library.utilities) etrends.library.utilities.setModuleLoadedForEGAM('MapChartDebounce.js');

//# sourceURL=etrends/MapChartDebounce.js
