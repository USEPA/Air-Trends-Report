/*!
 * Preloader screen
 */
	$(document).ready(function() {
	//Preloader
		setTimeout(function(){   
			var preloaderFadeOutTime = 500;
			function hidePreloader() {
				var preloader = $('.se-pre-con');
				preloader.fadeOut(preloaderFadeOutTime);
			}
			hidePreloader();
		}, 1500);
	});

(function($) {
  "use strict"; // Start of use strict

  // Closes responsive menu when a scroll trigger link is clicked
  $('.js-scroll-trigger').click(function() {
    $('.navbar-collapse').collapse('hide');
  });

  // Activate scrollspy to add active class to navbar items on scroll
   $('body').scrollspy({
    target: '#mainNav',
    offset: 56
  }); 

    // Collapse Navbar and handle Progress classes
	  var navbarCollapse = function() {
		if ($("#mainNav").offset().top > 100) {
		    $("#mainNav").addClass("navbar-shrink");
		  	//$(".progress-top").addClass("progressContainer");
			//$("#progress_bar").addClass("progress-scroll");
		} else {
		  $("#mainNav").removeClass("navbar-shrink");
		  //$(".progress-top").removeClass("progressContainer");
		  //$("#progress_bar").removeClass("progress-scroll");
		}
	  };
	  // Collapse now if page is not at top
	  navbarCollapse();
	  // Collapse the navbar when page is scrolled
	  $(window).scroll(navbarCollapse);
	  

	// Update Progress width % based on scroll -- NOT WORKING 11/6/18
/* 	function updateProgress(num1, num2){
	  var percent = Math.ceil( num1 / num2 * 100 ) + '%';
	  document.getElementById('progress_bar').style.width = percent;
	}

	window.addEventListener('scroll', function(){
	  var top = window.scrollY;
	  var height = document.body.getBoundingClientRect().height - window.innerHeight;
	  updateProgress(top, height);
	});	  	 */  
  
  
})(jQuery); // End of use strict

/*!
 * Bootstrap tooltips; used for Share button
 */
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	});

// SCROLLMAGIC
	jQuery( document ).ready( function($) {
		if (isMobile.any) return; // disables scroll magic for all scenes below
		//Also don't use scroll magic if window is narrow width
		if ($(window).width()<768) return;
		
		//var controller = new ScrollMagic.Controller();
		//save controller for other stuff to use
		//etrends.scrollMagicController = controller;
		
		var SM = {
		  controller: new ScrollMagic.Controller()  //addTo(SM.controller)
		};
		etrends.scrollMagicController = SM.controller;

		// loop through all elements with a class of fadein-trigger  https://www.youtube.com/watch?v=c85GjM7vy5A
 		$('.fadein-trigger').each(function(){
			//if (isMobile.any) return; // will disable just for this scene
			
			// Tween
			var fadein_tween = TweenMax.from($(this), .75,{ autoAlpha: 0, ease:Power1.easeIn});
			// Scene
			var fadein_scene = new ScrollMagic.Scene({
			  triggerElement: this, // this refers to the .fadein-trigger class
			  // triggerhook value between 0 and 1; 0 = top, .5 = middle, 1 = bottom
			  triggerHook: 1,  //********* 11/27/2018: If this is set to 1 and line 109 to 0 then each section in Firefox jumps just like IE and Edge, but nav doesn't get unhinged like IE and Edge
			  reverse: true // when false the animation will only play once
			})
			.setTween(fadein_tween) // trigger TweenMax tween
			//.addIndicators()
			.addTo(SM.controller);
		});
		
		
		var wipeType = "";
		//offset for wipes is not working well/didn't fix IE so don't even set pins for IE
		//if (!(etrends.library.utilities.BrowserType.chrome)) wipeType = "offset";
		var setPins = etrends.library.utilities.BrowserType.chrome;
		setupSectionWipes(wipeType,setPins);

		function setupSectionWipes(type,setPins) {
			etrends.sectionWipes = {scenes:{},ids:[],indices:{}};
			etrends.sectionWipes.debouncer = new MapChartDebounce(500);

			//see if I can capture page up/down
			$(window).on("keydown",function (e) {
				if (e.keyCode===33 || e.keyCode===34) {
					e.preventDefault();
					var id = window.location.hash.replace("#","");					
					if (e.keyCode===33) id = etrends.sectionWipes.prev(id);
					if (e.keyCode===34) id = etrends.sectionWipes.next(id);
					SM.controller.scrollTo(id);
					setTimeout(function () {
						window.location.hash =  id;
					});
					console.log(id + " page up/down ");
				}
				//console.log(e.keyCode);
			});
			//get all slides/panels
			var slides = document.querySelectorAll("section.panel");
			//create scene for every slide
			etrends.anchorTags = {current:"#home",map:{}};				
			var sceneOptions = {
							triggerHook: 0,
							reverse: true
					}
			var pinOptions;
			if (type==="offset") {
				pinOptions = {pushFollowers: false};
			} else {
				pinOptions = {};
			}

	//workaround stuff so we can use duration/offset instead of trigger element
			var duration = 0;
			var offset = 0;		
				
			for (var i=0; i<slides.length; i++){
				//console.log(slides[i]);
				//if (isMobile.any) return; // will disable just for this scene
				duration = $(slides[i]).height();
				var id = "#"+$(slides[i]).attr("id");
				console.log(id + " duration = " + duration + " offset = " + offset);

				etrends.sectionWipes.indices[id] = i;
				etrends.sectionWipes.ids.push(id)

				if (type==="offset") {
						sceneOptions.offset = offset;
						sceneOptions.duration = duration;
				}	else {
					sceneOptions.triggerElement = slides[i]
				}			

				etrends.sectionWipes.scenes[id] = new ScrollMagic.Scene(sceneOptions)
					.addTo(SM.controller); // assign the scene to the controller

				//pinning and updating anchor tag while scrolling doesn't work for ie	
				if (setPins) {
					etrends.sectionWipes.scenes[id].setPin(slides[i], pinOptions);
				}
				//after debouncing triggers to update anchor tag on scroll, IE seems to work but it will "snap" to next/prev section
				etrends.sectionWipes.scenes[id].on("enter", etrends.sectionWipes.debouncer.debounce(createOnEnter(i,slides[i])) );
				etrends.sectionWipes.scenes[id].on("leave", etrends.sectionWipes.debouncer.debounce(createOnLeave(i,slides[i])) );
				
				offset += duration;
				//console.log(" duration post = " + $(slides[i]).height());
				//Only add indicators if viewing uncompiled version	
				//sometimes this crashes so just uncomment when really need indiciators
				//if (location.search=="?local") etrends.sectionWipes.scenes[id].addIndicators(); 
			}

			etrends.sectionWipes.prev = function (id) {				
					var index = etrends.sectionWipes.indices["#" + id];
					if (!id) index=0;
					if (index===0) {
						return etrends.sectionWipes.ids[etrends.sectionWipes.ids.length-1];
					} else {
						return etrends.sectionWipes.ids[index-1];						
					}
			}			

			etrends.sectionWipes.next = function (id) {
					var index = etrends.sectionWipes.indices["#" + id];
					if (!id) index=0;
					if (index===etrends.sectionWipes.ids.length-1) {
						return etrends.sectionWipes.ids[0];
					} else {
						return etrends.sectionWipes.ids[index+1];						
					}
			}			

			etrends.sectionWipes.enableAll = function (enabled) {
				var ids = Object.keys(etrends.sectionWipes.scenes);
				ids.forEach(function (id) {
					etrends.sectionWipes.scenes[id].enabled(enabled);
				});
			}			
		}
		
		
		//Use this function to create the handler so that i is new variable for each value
		function createOnEnter(i,slide) {
				return function () {
//					console.log(arguments);
					var id = $(slide).attr("id");
					console.log(id + " enter ");
					//doing this next tick limited jumping
					setTimeout(function() {
						window.location.hash = id;
					},0);
//					var $href = $("a[href='#" + id + "']");
//					if ($href.length>0) $href.get(0).click()
				}
		}

		function createOnLeave(i,slide,type) {
				return function () {
//					console.log(arguments);
					var id = $(slide).attr("id");
					console.log(id + " leave ");
					var prev = etrends.sectionWipes.prev(id);
					console.log(prev + " leave prev");
					window.location.hash = prev.replace("#","");
					//var $href = $("a[href='" + prev + "']");
					//if ($href.length>0) $href.get(0).click()
				}
		}
		
		// change behavior of controller to animate scroll instead of jump
//This scrolling animation isn't setting the anchor tag properly
		SM.controller.scrollTo(function (newpos){
			if (newpos<=0) {
				TweenMax.to(window,0.0,{scrollTo: {y: newpos}});
			} else {
				TweenMax.to(window,1.0,{scrollTo: {y: newpos}});
			}
			console.log("scroll TO after TweenMax ***");
		});


		//bind scroll to anchor links
		$(document).on("click", "a.js-scroll-trigger", function (e) {
			var id = $(this).attr("href");
			//console.log(id + " on click ");
			if ($(id).length > 0 ) {
					e.preventDefault();
					SM.controller.scrollTo(id);
					//Timeout goes in next tick and changes anchor tag after scrolling a bit more
					setTimeout(function() {
							//Kind of quirky but doesn't return to home properly if you reset the but need to rest hash for other clicks
							//if (id!=="#home") window.location.hash = id.replace("#","");
							//if supported by browser update the browser back button history
							if(window.history && window.history.pushState){
								history.pushState("", document.title, id);
							}
					},0);
				
			}			
		});
/*  		//uses on instead of bind, so it works with 1.9.1/2.0+ https://gist.github.com/davidchase/5445485
		$(document).on('scroll',function() {
			$('section').each(function() {
				if ( $(this).offset().top < window.pageYOffset + 10 && $(this).offset().top + $(this).height() > window.pageYOffset + 10 ) {
				  var data = $(this).attr('id');
				  window.location.hash = data;
				}
			});
		});  */
	});	
		
/*!
 * Insert dynamic AQI forecast image with date stamp
 */
  
	$(document).ready(function () {
		function ConvertJSdateToAQIdateFormat (myDate) {
			//If month/day is single digit value add perfix as 0
			function AddZero(obj) {
				obj = obj + '';
				if (obj.length == 1) {
				obj = "0" + obj;
				}
				return obj;
			}

			var output = "";
			output += myDate.getFullYear();
			output += AddZero(myDate.getMonth()+1);
			output += AddZero(myDate.getDate());

            return output; 
		};
		
		var link = document.getElementById("aqi-forecast-link");

		link.setAttribute("src","https://files.airnowtech.org/airnow/today/forecast_aqi_"+ ConvertJSdateToAQIdateFormat(new Date())+"_usa.jpg");
	
	});	
	
/*!
 * NASA video responsiveness JS Modified from a tutorial found here: http://www.inwebson.com/html5/custom-html5-video-controls-with-jquery/
 */ 
	$(document).ready(function(){
		//INITIALIZE
		var video = $('#nasa-video');
		
		//remove default control when JS loaded
		
		video[0].removeAttribute("controls"); //commented this line out for now since not using video right now and it creates a conflict with scrollmagic 
		
		//CONTROLS EVENTS
		//video screen and play button clicked
		video.on('click', function() { playpause(); } );
		$('.btnPly').on('click', function() { playpause(), change_nasa_button(); } );
		var playpause = function() {
			if(video[0].paused || video[0].ended) {
				$('.btnPly').addClass('paused');
				//$('.btnPly').find('.icon-play-circle').addClass('icon-pause-circle').removeClass('icon-play-circle');
				video[0].play();
			}
			else {
				$('.btnPly').removeClass('paused');
				//$('.btnPly').find('.icon-pause-circle').removeClass('icon-pause-circle').addClass('icon-play-circle');
				video[0].pause();
			}
		};
		
		//https://stackoverflow.com/questions/30262050/jquery-toggle-button-text-and-icon
		function change_nasa_button() {
			$('.btnPly').find('span').text(function(i, text){
				return text === " Pause background video" ? " Play background video" : " Pause background video";
			  });                                
			$('.btnPly').find('i').toggleClass('icon-pause-circle icon-play-circle'); 
			//$('.btnPly').find('i').toggleClass('nasa-pause-btn nasa-play-btn'); 
		};
		
	});	

/*!
 * Health Effects Accordion 
 */
 
	$('.collapse').on('shown.bs.collapse', function(){
		$(this).parent().find(".icon-hand-o-right").removeClass("icon-hand-o-right").addClass("icon-hand-o-down");
	}).on('hidden.bs.collapse', function(){
	$(this).parent().find(".icon-hand-o-down").removeClass("icon-hand-o-down").addClass("icon-hand-o-right");
	});	

/*!
 * Remove fade class on modals when printing
 */
	
	$(document).ready(function() {	
		(function($) {

		   var beforePrint = function() {
			   $('div').removeClass('fade');
		   };
		   var afterPrint = function() {
			   //window.location.reload(true);
			   $('.modal').addClass('fade');
		   };

		   if (window.matchMedia) {
			  var mediaQueryList = window.matchMedia('print');
			  mediaQueryList.addListener(function(mql) {
				 if (mql.matches) {
					beforePrint();
				 } else {
					afterPrint();
				 }
			  });
		   }

		   window.onbeforeprint = beforePrint;
		   window.onafterprint = afterPrint;

		})(jQuery);
		
	});

/*!
 * Remove emissions tab tip text when lead is selected and show weather tip when ozone selected
 */
 
	$(document).ready(function(){
		$('#naaqs-pollutant-dropdown').ready(function() {
			$(".emissions-tab-tip").hide();
			$(".lead-tip").hide();
			$(".weather-tip").hide();
		});
		$('#naaqs-pollutant-dropdown').on('change', function() {
		  if ( this.value == 'pb')
		  {
			$(".emissions-tab-tip").hide();
			$(".lead-tip").show();
		  }
		  else if ( this.value == 'co')
		  {
			$(".emissions-tab-tip").hide();
			$(".lead-tip").hide();
		  }
		  else if ( this.value == 'no2_mean')
		  {
			$(".emissions-tab-tip").hide();
			$(".lead-tip").hide();
		  }
		  else if ( this.value == 'no2_98')
		  {
			$(".emissions-tab-tip").hide();
			$(".lead-tip").hide();
		  }
		  else if ( this.value == 'so2')
		  {
			$(".emissions-tab-tip").hide();
			$(".lead-tip").hide();
		  }
		  else
		  {
			$(".emissions-tab-tip").show();
			$(".lead-tip").hide();
		  }
		  
		  if ( this.value == 'ozone')
		  {
			$(".weather-tip").show();
		  }
		  else
		  {
			$(".weather-tip").hide();
		  }
		});
	});
	


	
/* 	SCROLL MAGIC JITTER FIX? //https://github.com/janpaepke/ScrollMagic/issues/660

	var SM = {
	  sceneHeights: [], // has to be initialized with the scene heights
	  scenePinLengths: [], // has to be initilized with "0"s
	  mainPinEl: "#main-pin",
	  sceneSelector: ".scene",
	  smController: new ScrollMagic.Controller()
	};

	$(document).ready(function ($) {
	  initScrollMagic();
	});

	function initScrollMagic() {
	  var scenes = $(SM.sceneSelector); // expecting scene wrapper elements with the class 'scene'

	  for (var i = 0; i < scenes.length; i++) {
		SM.sceneHeights.push($(scenes[i]).height()); // init scene heights
		SM.scenePinLengths.push(0); // init scene pin duration array
	  }

	  console.log("Scene Heights are", SM.sceneHeights);

	  // seperate functions for each scene makes sense, cause of individual TweenMax animations. Could maybe be improved by an factory function, that gets the TweenMax/TimelineMax object.
	  initPinScene1(0); // give sceneIndex as argument. sceneIndex starting with 0.
	  initPinScene2(1);
	  initPinScene3(2);
	  initPinScene4(3);
	}


	// Helper Function
	function _sceneOffset(sceneIndex) {
	  var total = 0;
	  var sceneHeightsForOffset = SM.sceneHeights.slice(0, sceneIndex);
	  var scenePinsForOffset = SM.scenePinLengths.slice(0, sceneIndex);

	  for (var i = 0; i < sceneHeightsForOffset.length; i++) {
		total += sceneHeightsForOffset[i] + scenePinsForOffset[i];
	  }

	  return total;
	}

	// Scene 1
	function initPinScene1(sceneIndex) {
	  console.log("Scene Offset for sceneIndex "+ sceneIndex +" is: "+ _sceneOffset(sceneIndex));
	  var pinLength = 400;
	  var newSMScene = new ScrollMagic.Scene({
		triggerHook: 0,
		duration: pinLength,
		offset: _sceneOffset(sceneIndex)
	  }).setPin(SM.mainPinEl, {pushFollowers: false})
		  .setTween(new TimelineMax())
		  //.addIndicators({name: "pin scene 1"})
		  .addTo(SM.smController); // assign the scene to the controller

	  SM.scenePinLengths[sceneIndex] = pinLength; // updating the scene pinning length
	}

	// Scene 2
	function initPinScene2(sceneIndex) {
	  console.log("Scene Offset for sceneIndex "+ sceneIndex +" is: "+ _sceneOffset(sceneIndex));
	  var pinLength = 600;
	  var newSMScene = new ScrollMagic.Scene({
		triggerHook: 0,
		duration: pinLength,
		offset: _sceneOffset(sceneIndex)
	  }).setPin(SM.mainPinEl, {pushFollowers: false})
		  .setTween(new TimelineMax())
		  //.addIndicators({name: "pin scene 2"})
		  .addTo(SM.smController); // assign the scene to the controller

	  SM.scenePinLengths[sceneIndex] = pinLength; // updating the scene pinning length
	}

	// Scene 3
	function initPinScene3(sceneIndex) {
	  console.log("Scene Offset for sceneIndex "+ sceneIndex +" is: "+ _sceneOffset(sceneIndex));
	  var pinLength = 800;
	  var newSMScene = new ScrollMagic.Scene({
		triggerHook: 0,
		duration: pinLength,
		offset: _sceneOffset(sceneIndex)
	  }).setPin(SM.mainPinEl, {pushFollowers: false})
		  .setTween(new TimelineMax())
		  //.addIndicators({name: "pin scene 3"})
		  .addTo(SM.smController); // assign the scene to the controller

	  SM.scenePinLengths[sceneIndex] = pinLength; // updating the scene pinning length
	}

	// Scene 4
	function initPinScene4(sceneIndex) {
	  console.log("Scene Offset for sceneIndex "+ sceneIndex +" is: "+ _sceneOffset(sceneIndex));
	  var pinLength = 1000;
	  var newSMScene = new ScrollMagic.Scene({
		triggerHook: 0,
		duration: pinLength,
		offset: _sceneOffset(sceneIndex)
	  }).setPin(SM.mainPinEl, {pushFollowers: false})
		  .setTween(new TimelineMax())
		  //.addIndicators({name: "pin scene 4"})
		  .addTo(SM.smController); // assign the scene to the controller

	  SM.scenePinLengths[sceneIndex] = pinLength; // updating the scene pinning length
	} */	


//# sourceURL=etrends_structure.js