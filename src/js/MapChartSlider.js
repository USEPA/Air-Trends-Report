 var MapChartSlider = function (domID,min,max,step,stepIncrements,stepTime,tickSize,onSlide) {
  var self = this;
  this.domID=domID;

  this.min=min;
  this.max=max;
  this.step=step;
  this.tickSize=tickSize;

  this.stepIncrements = stepIncrements || 1; //this number of increments to complete full step
  this.stepTime = stepTime || 1; //this is number of seconds to complete full step

  this.onSlide=onSlide;

  this.autoPlayInterval = null;
  this.resetSliderTimeout=null;
  this.restartSliderTimeout=null;
  this.currentValue = min;
  this.currentIncrement = 0;
  
  this.slider = null;
  this.refresh(min,max,step,stepIncrements,stepTime,tickSize);
//Play/Stop button will be set for future reference
  this.btnPlay = d3.select('#' + this.domID + ' .btnPlay');
  this.btnStop = d3.select('#' + this.domID + ' .btnStop');  
//need to set up play button click handlers  
  this.setStartStopClickHandlers();
//set up resopnsiveness when resized
  this.debouncer = new MapChartResize(this, function() {
    self.refresh();
  }, 200)

}

MapChartSlider.prototype.refresh = function (min,max,step,stepIncrements,stepTime,tickSize) {
  var self = this;
//console.log("refresh");
  this.min=min || this.min;
  this.max=max || this.max;
  this.step=step || this.step;
  this.tickSize=tickSize || this.tickSize;

  this.stepIncrements = stepIncrements || this.stepIncrements || 1; //this number of increments to complete full step
  this.stepTime = stepTime || this.stepTime || 1; //this is number of seconds to complete full step
  
  this.resize();
//clear out any existing slider stuff first    
  d3.select('#' + self.domID + ' .slider').selectAll("*").remove();  
  
  var axis = d3.svg.axis().orient("bottom").tickFormat(d3.format("d"));
  //If they pass custom tickSize then use it on axis
  if (self.tickSize) {
      var tickCount = (self.max-self.min)/self.tickSize + 1;
      axis.ticks(tickCount);
  }
  self.slider = d3.slider().axis(axis).min(self.min).max(self.max).step(self.step).on("slide", self.onSlide);  

  d3.select('#' + self.domID + ' .slider').call(self.slider);
//set the autoplay stuff to figure when we are at the end
//Total number of increments for each loop
  self.totalIncrements = self.stepIncrements*Math.round((max-min)/step);    
//The size in time slider units of each increment
  self.incrementSize = self.step/self.stepIncrements;    
};



//    moveSlider(currentValue);
MapChartSlider.prototype.moveSlider = function (value) {
//      console.log(value);
      this.slider.value(value);
      this.slider.on("slide")(null,value);		
};

MapChartSlider.prototype.autoIncrement = function (value) {
  var self=this;
//      self.currentValue += self.increment;	
//This was because numbers weren't adding up 
//      self.currentValue=1*(self.currentValue.toFixed(2));	
//      self.currentIncrement += 1;
//      self.currentValue = self.min + self.incrementSize * self.currentIncrement; 

      self.currentValue += self.incrementSize; 
//Assume that we will only ever want say 10 decimal places of precision other wise numbers won't add up to what we want
      self.currentValue=1*(self.currentValue.toFixed(10));	

//      self.currentIncrement = (self.currentValue - self.min)/self.incrementSize;
//if distance to 
//      if (self.currentIncrement > self.totalIncrements ) {
      if (self.currentValue > self.max ) {
//make sure it's moved to the max position while it waits to start over
        self.moveSlider(self.max);                
//        self.currentIncrement = 0;
        self.currentValue=self.min;
        clearInterval(self.autoPlayInterval);
//Have to actual stop incrementing and delay before starting again or graph transitions are wacked out
        self.resetSliderTimeout=setTimeout(function () {
          self.moveSlider(self.currentValue);			          
        },1000*self.stepTime);        
        self.restartSliderTimeout=setTimeout(function () {
          self.autoPlayInterval = setInterval(function () {self.autoIncrement()},1000*self.stepTime/self.stepIncrements);			          
        },1000*self.stepTime+300);//add a little extra after the reset before slider starts moving        
      }else {
         self.moveSlider(self.currentValue);                
      }
      
};

MapChartSlider.prototype.setStartStopClickHandlers = function () {
  var self = this;   
  self.btnStop.on("click",function () {
    self.stop();    
  });      
  self.btnPlay.on("click",function () {
    self.play();    
  });        
};    

MapChartSlider.prototype.stop = function () {
  var self = this;
  clearInterval(self.autoPlayInterval);
  clearTimeout(self.resetSliderTimeout);
  clearTimeout(self.restartSliderTimeout);
  self.autoPlayInterval=null;
  self.resetSliderTimeout=null;
  self.restartSliderTimeout=null;
  self.btnPlay.style("display",null);
  self.btnStop.style("display","none");  
};

MapChartSlider.prototype.play = function () {
  var self = this;
//make sure we are at current value
  self.moveSlider(self.currentValue);
  self.autoPlayInterval = setInterval(function () {self.autoIncrement()},1000*self.stepTime/self.stepIncrements);			

  self.btnPlay.style("display","none");
  self.btnStop.style("display",null);
};

MapChartSlider.prototype.resize = function (width) {
      if (! width) width = d3.select("#" + this.domID).style("width");
      if (! width) return;
      
      d3.select('#' + this.domID + ' .slider').style("width",(parseInt(width)-50) + "px");
};

MapChartSlider.prototype.debounce = function(fn, timeout) 
{
  var timeoutID = -1;
  return function() {
     if (timeoutID > -1) {
        window.clearTimeout(timeoutID);
     }
   timeoutID = window.setTimeout(fn, timeout);
  }
};