var MapChartResize = function (host,fn,delay) {
//Host is the map or chart object that the tooltip is attached to  
  this.host = host;
  this.fn = fn;
  this.delay = delay;
//set the resize event handler. It is a function now so we can turn resize on/off for charts in tooltips
  this.set();
}

MapChartResize.prototype.set = function() 
{
  //Don't even try to set this stuff for phones
  if (isMobile.any) return;
  
//The d3 onResize hanlder needs a name space so we can have multiple onReisze handlers 
//Then name will be the class type (function name) of the host and the dom ID of the div containing the host
  d3.select(window).on('resize.' + this.host.constructor.name + '_' + this.host.domID, this.debounce(this.fn, this.delay)); 
};

MapChartResize.prototype.clear = function()
{
//clear the handler out so that we don't handle resize events in situations such as chart in tooltip with tooltip closed 
  d3.select(window).on('resize.' + this.host.constructor.name + '_' + this.host.domID, null); 
};

MapChartResize.prototype.debounce = function(fn, delay) 
{
  var timeoutID = -1;
  return function() {
     if (timeoutID > -1) {
        window.clearTimeout(timeoutID);
     }
   timeoutID = window.setTimeout(fn, delay);
  }
};
//# sourceURL=MapChartResize.js