/*!
 * Preloader screen
 */

	$(document).ready(function() {
	//Preloader
		setTimeout(function(){   
			preloaderFadeOutTime = 3000;
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
			anchors: ['home','welcome','introduction','highlights','air_pollution','sources','effects','growth','growth_w_cleaner_air','naaqs','naaqs_trends','pm2_5_composition','unhealthy_aq_days','nonattainment_areas','weather','weather_influences','visibility','scenic_areas','toxics','air_toxics_trends','spotlight','flags_program','summary','resources','social_media'],
			navigation: true,
			navigationPosition: 'left',
			navigationTooltips:['Home','Welcome','Intro','Highlights','Air Pollution','Sources','Effects','Growth','Econ. Growth with Cleaner Air','NAAQS','NAAQS Trends','PM<sub>2.5</sub> Composition','Unhealthy AQI Days','Nonattainment','Weather','Weather Influences','Visibility','Scenic Areas','Toxics','Air Toxics','Spotlight','Flags Program','Summary','Resources','Social Media'],
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
		} else {
			$(".navbar-fixed-top").removeClass("top-nav-collapse");
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
		video[0].removeAttribute("controls");
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
 * Scroll magic - turning off on mobile - but when resizing, the browser must be refreshed
 */
	/*
	// Turn off for mobile devices https://github.com/janpaepke/ScrollMagic/issues/15
	jQuery( document ).ready( function($) {

		var tooSmall = false;
		var controller = null;
		var maxWidth = 768; // sizes above maxWidth will turn on scroll magic

		if( $(window).width() < maxWidth ) {
			tooSmall = true;
		}
		var controller = new ScrollMagic.Controller();
		function initScrollMagic() {
			$('body').scrollTop( 0 );
			controller = new ScrollMagic.Controller();
			// add your ScrollMagic scene goodness here
			
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
				.addTo(controller);
			});
			
			var download_scene = new ScrollMagic.Scene({
				triggerElement: '.summary_scrollmagic',
				triggerHook: 0,
				duration: 500
			})
			.setClassToggle("#scrollmagic-class", "active")
			//.addIndicators()  for debugging
			.addTo(controller);
		}

		if( !tooSmall ) {
			initScrollMagic();
		}

		// part of the problem is that window resizes can trigger multiple times as the events fire rapidly
		// this solution prevents the controller from being initialized/destroyed more than once
		$(window).resize( function() {
			var wWidth = $(window).width();
			if( wWidth < maxWidth ) {
				if( controller !== null && controller !== undefined ) {
					// completely destroy the controller
					controller = controller.destroy( true );
					// if needed, use jQuery to manually remove styles added to DOM elements by GSAP etc. here
				}
			} else if( wWidth >= maxWidth ) {
				if( controller === null || controller === undefined ) {
					// reinitialize ScrollMagic only if it is not already initialized
					initScrollMagic();
				}
			}
		});
	});*/
	
	
	
/*!
 * Scroll Magic for all devices including mobile - doesn't have issue on window resize
*/
	jQuery( document ).ready( function($) {
		if (isMobile.any) return;
		
		var controller = new ScrollMagic.Controller();

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
			.addTo(controller);
		});
		
		var download_scene = new ScrollMagic.Scene({
			triggerElement: '.summary_scrollmagic',
			triggerHook: 0,
			duration: 500
		})
		.setClassToggle("#scrollmagic-class", "active")
		//.addIndicators()  for debugging
		.addTo(controller);
		
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
		
 
//# sourceURL=etrends_structure.js