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

 
/*!
 * Fullpage initialization
 */
 
  $(document).ready(function() {
		$('#fullpage').fullpage({
			//Scrolling
			css3:true,
			autoScrolling: true,
			//fitToSection: true,
			//fitToSectionDelay: 1500,
			scrollBar: true,
			lockAnchors: false,
			normalScrollElements: '#report-nav, #naaqs-map, #speciation-map, #visibility-map, #toxics-map',
			scrollingSpeed: 2000,
			//easing: 'easeInOutCubic', // easing included in fullpage
			easingcss3: 'ease-out',
			loopBottom: true,
			//Navigation
			//menu: '#fp-navmenu', // unhiding this will cause a conflict with scrollspy
			anchors: ['home','welcome','introduction','highlights','air_pollution','sources','effects','growth','growth_w_cleaner_air','naaqs','naaqs_trends','pm2_5_composition','unhealthy_aq_days','nonattainment_areas','visibility','scenic_areas','toxics','air_toxics_trends','spotlight','nei','summary','resources'],
			navigation: true,
			navigationPosition: 'left',
			navigationTooltips:['Home','Welcome','Intro','Highlights','Air Pollution','Sources','Effects','Growth','Econ. Growth with Cleaner Air','NAAQS','NAAQS Trends','PM<sub>2.5</sub> Composition','Unhealthy AQI Days','Nonattainment','Visibility','Scenic Areas','Toxics','Air Toxics','Spotlight','NEI','Summary','Resources'],
			//Design 
			responsiveWidth: 1367,
			//responsiveWidth: 1383,
			responsiveHeight: 900,
			sectionSelector: '.secFP',
			fixedElements: '.navbar'
		});
	});

/*!
 * Navbar from Start Bootstrap - Grayscale Bootstrap Theme (http://startbootstrap.com)
 */

	// jQuery to collapse the navbar on scroll
	$(window).scroll(function() {
		if ($(".navbar").offset().top > 50) {
			$(".navbar-fixed-top").addClass("top-nav-collapse");
			$(".progress-top").addClass("progressContainer");
			$("#progress").addClass("progress");
		} else {
			$(".navbar-fixed-top").removeClass("top-nav-collapse");
			$(".progress-top").removeClass("progressContainer");
			$("#progress").removeClass("progress");
		}
	});

	// jQuery for page scrolling feature for nav items - requires easing from fullpage.js 
	$(function() {
		$('a.page-scroll').bind('click', function(event) {
			var $anchor = $(this);
			$('html, body').stop().animate({
				scrollTop: $($anchor.attr('href')).offset().top
			}, 2000, 'easeInOutCubic'); //set to easing included with fullpage
			event.preventDefault();
		});
	});

	// Closes the Responsive Menu on Menu Item Click
	$('.navbar-collapse ul li a').click(function() {
		$('.navbar-toggle:visible').click();
	});

/*!
 * Progress toolbar
 */
	function updateProgress(num1, num2){
	  var percent = Math.ceil( num1 / num2 * 100 ) + '%';
	  document.getElementById('progress').style.width = percent;
	}

	window.addEventListener('scroll', function(){
	  var top = window.scrollY;
	  var height = document.body.getBoundingClientRect().height - window.innerHeight;
	  updateProgress(top, height);
	});
	
/*!
 * Bootstrap tooltips; used for Share button
 */
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	});

/*!
 * Share button show on hover
 */
	$('#singleShare').on('mouseenter mouseleave click tap', function() {
	  $(this).toggleClass("open");
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
		
		//video[0].removeAttribute("controls"); commented this line out for now since not using video right now and it creates a conflict with scrollmagic 
		
		$('.vid-control').fadeIn(500);
		$('.caption').fadeIn(500);
	 
		//before everything get started
		video.on('loadedmetadata', function() {
				
			//set video properties
			/*$('.current').text(timeFormat(0));
			$('.duration').text(timeFormat(video[0].duration));
			updateVolume(0, 0.7);*/
				
			//start to get video buffering data 
			/*setTimeout(startBuffer, 150);*/
				
			//bind video events
			$('.video-viewport')
			.hover(function() {
				$('.vid-control').stop().fadeIn();
				$('.caption').stop().fadeIn();
			}, function() {
				if(!volumeDrag && !timeDrag){
					$('.vid-control').stop().fadeOut();
					$('.caption').stop().fadeOut();
				}
			})
			.on('click', function() {
				$('.btnPly').find('.icon-play').addClass('icon-pause').removeClass('icon-play');
				$(this).unbind('click');
				video[0].play();
			});
		});
		
		//CONTROLS EVENTS
		//video screen and play button clicked
		video.on('click', function() { playpause(); } );
		$('.btnPly').on('click', function() { playpause(); } );
		var playpause = function() {
			if(video[0].paused || video[0].ended) {
				$('.btnPly').addClass('paused');
				$('.btnPly').find('.icon-play').addClass('icon-pause').removeClass('icon-play');
				video[0].play();
			}
			else {
				$('.btnPly').removeClass('paused');
				$('.btnPly').find('.icon-pause').removeClass('icon-pause').addClass('icon-play');
				video[0].pause();
			}
		};
		
		//fullscreen button clicked
		$('.btnFS').on('click', function() {
			if($.isFunction(video[0].msRequestFullscreen)) {
				video[0].msRequestFullscreen();
			}	
			else if ($.isFunction(video[0].webkitRequestFullScreen)) {
				video[0].webkitRequestFullScreen();
			}
			else if ($.isFunction(video[0].mozRequestFullScreen)) {
				video[0].mozRequestFullScreen();
			}
			else {
				alert('Fullscreen not available');
			}
		});
		
		//VIDEO EVENTS
		//video canplay event
		video.on('canplay', function() {
			$('.loading').fadeOut(100);
		});
		
		//video canplaythrough event
		//solve Chrome cache issue
		var completeloaded = false;
		video.on('canplaythrough', function() {
			completeloaded = true;
		});
		
		//video ended event
		video.on('ended', function() {
			$('.btnPly').removeClass('paused');
			video[0].pause();
		});

		//video seeking event
		video.on('seeking', function() {
			//if video fully loaded, ignore loading screen
			if(!completeloaded) { 
				$('.loading').fadeIn(200);
			}	
		});
		
		//video seeked event
		video.on('seeked', function() { });
		
		//video waiting for more data event
		video.on('waiting', function() {
			$('.loading').fadeIn(200);
		});
	});

/*!
 * Keyboard tab navigation
 */
 
	// Remove focus outlines when clicking (the below), otherwise fall back to css file when tabbing
	$("a").keypress(function() {
		 this.blur();
		 this.hideFocus = false;
		 this.style.outline = null;
	});
	$("a").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.outline = 'none';
	});
	$(".hvr-sweep-to-right").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.border = "1px solid #0071bc";
	});
	$(".button--rayen").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.border = "2px solid #3F93CC";
	});
	$(".btnPly, .btnFS").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.border = "1px solid #bfbfbf";
	});
	$(".btn-mobile-share").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.border = "1px solid transparent";
	});

	
/*!
 * Scroll Magic for all devices including mobile - doesn't have issue on window resize
*/
	jQuery( document ).ready( function($) {
		if (isMobile.any) return;
		
		var controller = new ScrollMagic.Controller();
		//save controller for other stuff to use
		etrends.scrollMagicController = controller;
		
		// loop through all elements with a class of fadein-trigger  https://www.youtube.com/watch?v=c85GjM7vy5A
		$('.fadein-trigger').each(function(){
			// Tween
			var fadein_tween = TweenMax.from($(this), 1.5,{ autoAlpha: 0, ease:Power1.easeIn});
			// Scene
			var fadein_scene = new ScrollMagic.Scene({
			  triggerElement: this, // this refers to the .fadein-trigger class
			  triggerHook: 1, // or use a value between 0 and 1; 0 = top, .5 = middle, 1 = bottom
			  reverse: false // when false the animation will only play once
			})
			.setTween(fadein_tween) // trigger TweenMax tween
			//.addIndicators()
			.addTo(controller);
		});
		
		/*var download_scene = new ScrollMagic.Scene({
			triggerElement: '.summary_scrollmagic',
			triggerHook: 0, // Trigger 1
			duration: 500
		})
		.setClassToggle("#scrollmagic-class", "active")
		//.addIndicators()  //for debugging
		.addTo(controller);*/
			
		/****** Aaron this is a scrollmagic scene and callback event *****/
		// Setting up a demo scene for the line chart drawing animation
		/*
		var draw_line_chart_scene = new ScrollMagic.Scene({
			triggerElement: '.line_chart_scene', // The green "Start" marker
			triggerHook: .5, // The blue "trigger" marker / 0 = top of browser, .5 = middle, 1 = bottom 
			duration: 450, // 450px tall
			reverse: false // when set to false it will only run the scene once when scrolling down the page
		})
		//.addIndicators() // for debugging; adds start, end and trigger indicators on right side of window
		.addTo(controller);
		
		function callback (event) {
			alert("Scroll magic callback event triggered!"); // The blue trigger passed the green "Start" marker aka the line_chart_scene class
		}
		// add listeners
		draw_line_chart_scene.on("enter", callback); // On entering the scene duration area fire the callback
		// remove listeners
		draw_line_chart_scene.on("leave", function(){
			console.log("Trigger is now outside duration area."); // The blue trigger passed the red "End" marker
		});
		*/
		/********* End of scrollmagic line_chart_scene and callback event *******/

		//****NOTE:*****  The logic for triggers for redrawing charts was added to LineAreaChart.js
		//Just add the trigger using  chart.addChartRedrawTrigger(); in script where chart created eg. line 31 src\js\naaqs-concentrations-averages.js
 
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

/*!
 * Title typing https://codepen.io/hi-im-si/pen/DHoup and https://css-tricks.com/snippets/css/typewriter-effect/
 * Looping effect
 */
 /*$(document).ready(function() {
	function callback (event) {
			var TxtType = function(el, toRotate, period) {
				this.toRotate = toRotate;
				this.el = el;
				this.loopNum = 0;
				this.period = parseInt(period, 1) || 2000;
				this.txt = '';
				this.tick();
				this.isDeleting = false;
			}

			TxtType.prototype.tick = function() {
				var i = this.loopNum % this.toRotate.length;
				var fullTxt = this.toRotate[i];

				if (this.isDeleting) {
				this.txt = fullTxt.substring(0, this.txt.length - 2); // how many letters to delete at one time
				} else {
				this.txt = fullTxt.substring(0, this.txt.length + 1);
				}

				this.el.innerHTML = '<span class="wrap">'+this.txt+'</span>';

				var that = this;
				var delta = 150 - Math.random() * 100;

				if (this.isDeleting) { delta /= 2; }

				if (!this.isDeleting && this.txt === fullTxt) {
				delta = this.period;
				this.isDeleting = true;
				} else if (this.isDeleting && this.txt === '') {
				this.isDeleting = false;
				this.loopNum++;
				delta = 500;
				}

				setTimeout(function() {
				that.tick();
				}, delta);
			}

			//window.onload = function() {
			
				var elements = document.getElementsByClassName('typewrite');
				for (var i=0; i<elements.length; i++) {
					var toRotate = elements[i].getAttribute('data-type');
					var period = elements[i].getAttribute('data-period');
					if (toRotate) {
					  new TxtType(elements[i], JSON.parse(toRotate), period);
					}
				};
				// INJECT CSS
				var css = document.createElement("style");
				css.type = "text/css";
				css.innerHTML = ".typewrite > .wrap { border-right: 0.08em solid white}"; // transparent cursor keeps from changing the line height 
				document.body.appendChild(css);
			//};	
		}
		// add listeners
		typewriter_scene.on("enter", callback);
		// remove listeners
		typewriter_scene.on("leave", function(){
			console.log("Trigger is now outside duration area.");
		});

 });*/
 
/*!
 * Title typing https://codepen.io/hi-im-si/pen/DHoup and https://css-tricks.com/snippets/css/typewriter-effect/
 * Non-looping effect
 */ 
  /*$(document).ready(function() {
	
	function setupTypewriter(t) {
	    var HTML = t.innerHTML;

	    t.innerHTML = "";

	    var cursorPosition = 0,
	        tag = "",
	        writingTag = false,
	        tagOpen = false,
	        typeSpeed = 100,
			tempTypeSpeed = 0;

	    var type = function() {
        
	        if (writingTag === true) {
	            tag += HTML[cursorPosition];
	        }

	        if (HTML[cursorPosition] === "<") {
	            tempTypeSpeed = 0;
	            if (tagOpen) {
	                tagOpen = false;
	                writingTag = true;
	            } else {
	                tag = "";
	                tagOpen = true;
	                writingTag = true;
	                tag += HTML[cursorPosition];
	            }
	        }
	        if (!writingTag && tagOpen) {
	            tag.innerHTML += HTML[cursorPosition];
	        }
	        if (!writingTag && !tagOpen) {
	            if (HTML[cursorPosition] === " ") {
	                tempTypeSpeed = 0;
	            }
	            else {
	                tempTypeSpeed = (Math.random() * typeSpeed) + 50;
	            }
	            t.innerHTML += HTML[cursorPosition];
	        }
	        if (writingTag === true && HTML[cursorPosition] === ">") {
	            tempTypeSpeed = (Math.random() * typeSpeed) + 50;
	            writingTag = false;
	            if (tagOpen) {
	                var newSpan = document.createElement("span");
	                t.appendChild(newSpan);
	                newSpan.innerHTML = tag;
	                tag = newSpan.firstChild;
	            }
	        }

	        cursorPosition += 1;
	        if (cursorPosition < HTML.length - 1) {
	            setTimeout(type, tempTypeSpeed);
	        }
	    };

	    return {
	        type: type
	    };
	}

	var typer = document.getElementById('typewriter');

	typewriter = setupTypewriter(typewriter);

	typewriter.type();
    
  });*/

//# sourceURL=etrends_structure.js
 
	