var MapChartResize = function (host,fn,delay) {
//Host is the map or chart object that the tooltip is attached to  
  this.host = host;
  this.fn = fn;
  this.dealy = delay;

//The d3 onResize hanlder needs a name space so we can have multiple onReisze handlers 
//Then name will be the class type (function name) of the host and the dom ID of the div containing the host
  d3.select(window).on('resize.' + host.constructor.name + '_' + host.domID, this.debounce(fn, delay)); 
}

MapChartResize.prototype.debounce = function(fn, timeout) 
{
  var timeoutID = -1;
  return function() {
     if (timeoutID > -1) {
        window.clearTimeout(timeoutID);
     }
   timeoutID = window.setTimeout(fn, timeout);
  }
};


