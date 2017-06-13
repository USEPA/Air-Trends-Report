// Script for SVG pan and zoom - additional js in etrends.js 
	
	//Create object on window for seasonal svg map  
	  var seasonalSVGpm25map = {};
	  seasonalSVGpm25map.svgID = "svgSeasonalPm25map";
	  seasonalSVGpm25map.panZoom;
	  
	//To know when map is initially loaded to set window resize events
	seasonalSVGpm25map.isLoaded=false;
	
	//Handle SVG DropDown Change - updated to a toggle checkbox
	seasonalSVGpm25map.onDropChange = function  (folder,newsvg){
		if (seasonalSVGpm25map.panZoom) seasonalSVGpm25map.panZoom.destroy(); 
		seasonalSVGpm25map.panZoom = null;
			document.getElementById(seasonalSVGpm25map.svgID).data= folder + "/" + newsvg + ".svg";		
	};

	//Custom Event Handler
	seasonalSVGpm25map.eventsHandler = {
        haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel']
        , init: function(options) {
            var instance = options.instance
              , initialScale = 1
              , pannedX = 0
              , pannedY = 0

            // Init Hammer
            // Listen only for pointer and touch events
            this.hammer = Hammer(options.svgElement, {
              inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
            })

            // Enable pinch
            this.hammer.get('pinch').set({enable: true})

            // Handle double tap
            this.hammer.on('doubletap', function(ev){
              instance.zoomIn()
            })

            // Handle pan
            this.hammer.on('panstart panmove', function(ev){
              // On pan start reset panned variables
              if (ev.type === 'panstart') {
                pannedX = 0
                pannedY = 0
              }

              // Pan only the difference
              instance.panBy({x: ev.deltaX - pannedX, y: ev.deltaY - pannedY})
              pannedX = ev.deltaX
              pannedY = ev.deltaY
            })

            // Handle pinch
            this.hammer.on('pinchstart pinchmove', function(ev){
              // On pinch start remember initial zoom
              if (ev.type === 'pinchstart') {
                initialScale = instance.getZoom()
                instance.zoom(initialScale * ev.scale)
              }

              instance.zoom(initialScale * ev.scale)

            })

            // Prevent moving the page on some devices when panning over SVG
            options.svgElement.addEventListener('touchmove', function(e){ e.preventDefault(); });
        }

        , destroy: function(){
            this.hammer.destroy()
          }
    };

	seasonalSVGpm25map.beforePan = function(oldPan, newPan){
		var stopHorizontal = false
			, stopVertical = false
			, gutterWidth = 100
			, gutterHeight = 100
			  // Computed variables
			, sizes = this.getSizes()
			, leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth
			, rightLimit = sizes.width - gutterWidth - (sizes.viewBox.x * sizes.realZoom)
			, topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight
			, bottomLimit = sizes.height - gutterHeight - (sizes.viewBox.y * sizes.realZoom)

		  customPan = {}
		  customPan.x = Math.max(leftLimit, Math.min(rightLimit, newPan.x))
		  customPan.y = Math.max(topLimit, Math.min(bottomLimit, newPan.y))

		  return customPan
	};

	//Use a function to create svgPanZoom instance so it can be called when dropdown changes
	seasonalSVGpm25map.createSVGpanZoom	=	function () {
		if (seasonalSVGpm25map.panZoom) seasonalSVGpm25map.destroy(); 
				
		seasonalSVGpm25map.panZoom = svgPanZoom ('#' + seasonalSVGpm25map.svgID, {
			zoomEnabled: true,
			controlIconsEnabled: true,
			maxZoom: 3,
			fit: 1,
			center: 1,
			customEventsHandler: seasonalSVGpm25map.eventsHandler,
			beforePan: seasonalSVGpm25map.beforePan
		});
	};

	seasonalSVGpm25map.windowResizeHandler = function () {
		$(window).resize(function(){
			seasonalSVGpm25map.panZoom.resize();
			seasonalSVGpm25map.panZoom.fit();
			seasonalSVGpm25map.panZoom.center();
		});
	};    

	//when new svg is loaded create a new svgPanZoom instance
    $('#' + seasonalSVGpm25map.svgID).on('load', function () {
  		seasonalSVGpm25map.createSVGpanZoom();
        if (seasonalSVGpm25map.isLoaded===false) seasonalSVGpm25map.windowResizeHandler();
			seasonalSVGpm25map.isLoaded=true;
  	});

	window.onload = function() {
	//create initial svgPanZoom instance on svg on load handler now
	//  		seasonalSVGpm25map.createSVGpanZoom();
    };

		
// Script for Toxics map DropDown 
	
	function jsDropDown (imgid,folder,newimg){
		document.getElementById(imgid).src= folder + "/" + newimg + ".html";
	}
	
// bootstrap tooltips; used for Share button
	$(function () {
	  $('[data-toggle="tooltip"]').tooltip()
	});
	
// Script for Effect Accordion 
	
	$('.collapse').on('shown.bs.collapse', function(){
		$(this).parent().find(".icon-hand-o-right").removeClass("icon-hand-o-right").addClass("icon-hand-o-down");
	}).on('hidden.bs.collapse', function(){
	$(this).parent().find(".icon-hand-o-down").removeClass("icon-hand-o-down").addClass("icon-hand-o-right");
	});
	
// fullpage initialization
$(function() {
		$('#fullpage').fullpage({
			//Scrolling
			autoScrolling: false,
			fitToSection: true,
			fitToSectionDelay: 1500,
			scrollBar: true,
			lockAnchors: true,
			normalScrollElements: '#report-nav, #naaqsMap, #svgSeasonalPm25map, #naaMap, #ozonesliderMap',
			//Navigation
			anchors: ['home_','welcome_','intro_','highlights_','air_pollution_','sources_','effects_','growth_','econ_growth_cleaner_air_','naaqs_','naaqs_trends_','composition_','unhealthy_aq_days_','nonattainment_','weather_','weather_influences_','visibility_','scenic_areas_','toxics_','toxics_trends_','outlook_','2025_projections_','summary_','resources_','social_media_'],
			navigation: true,
			navigationPosition: 'left',
			navigationTooltips:['Home','Welcome','Intro','Highlights','Air Pollution','Sources','Effects','Growth','Econ. Growth with Cleaner Air','NAAQS','NAAQS Trends','PM<sub>2.5</sub> Composition','Unhealthy AQI Days','Nonattainment','Weather','Weather Influences','Visibility','Scenic Areas','Toxics','Air Toxics','Outlook','2025','Summary','Resources','Social Media'],
			//Design 
			responsiveWidth: 1383,
			responsiveHeight: 900,
			sectionSelector: '.secFP'
		});
	});



/* Highcharts Dark Theme customized and charts */	
	
		$(function () {
			// Load the fonts
			

			Highcharts.theme = {
			   global: {
					canvasToolsURL: 'https://code.highcharts.com/4.2.5/modules/canvas-tools.js'
					},
				lang: {
					decimalPoint: '.',
					thousandsSep: ',',
					contextButtonTitle: "Print / Download",
					viewData: ''
					
				},
			   colors: ["#ff0066", "#7798BF", "#FFFF00", "#90ee7e", "#f45b5b", "#aaeeee", "#3366CC", "#eeaaee",
				  "#55BF3B", "#2b908f", "#996600", "#E0E0E3", "#DF5353", "#7798BF", "#aaeeee"],
			   chart: {
				  backgroundColor: '#2a2a2b',
				  style: {
					 fontFamily: "'Varela Round','Montserrat', 'Open Sans', sans-serif",
					 fontSize:'1em'
				  },
				  plotBorderColor: '#606063',
				  borderColor: '#707073',
				  borderWidth: 1,
				  borderRadius: 4,
			   },
			   title: {
				  style: {
					 color: '#E0E0E3',
					 textTransform: 'uppercase',
					 fontSize: '1.5em'
				  }
			   },
			   subtitle: {
				  style: {
					 color: '#E0E0E3',
					 textTransform: 'uppercase',
					 fontSize:'1.2em'
				  }
			   },
			   xAxis: {
				  gridLineColor: '#707073',
				  labels: {
					 style: {
						color: '#E0E0E3',
						fontSize: '.917em'
					 }
				  },
				  lineColor: '#707073',
				  minorGridLineColor: '#505053',
				  tickColor: '#707073',
				  title: {
					 style: {
						color: '#A0A0A3'
					 }
				  }
			   },
			   yAxis: {
				  gridLineColor: '#707073',
				  labels: {
					 style: {
						color: '#E0E0E3',
						fontSize:'.917em'
					 }
				  },
				  lineColor: '#707073',
				  minorGridLineColor: '#505053',
				  tickColor: '#707073',
				  tickWidth: 1,
				  title: {
					 style: {
						color: '#E0E0E3'
					 }
				  }
			   },
			   tooltip: {
				  headerFormat:'<span style="font-size: 1em">{point.key}</span><br>',
				  backgroundColor: 'rgba(42, 42, 43, 0.98)',
				  style: {
					 color: '#F0F0F0',
					 fontSize:'1em'
				  }
			   },
			   plotOptions: {
				  series: {
					 dataLabels: {
						color: '#B0B0B3'
					 },
					 marker: {
						lineColor: '#333'
					 }
				  },
				  boxplot: {
					 fillColor: '#505053'
				  },
				  candlestick: {
					 lineColor: 'white'
				  },
				  errorbar: {
					 color: 'white'
				  }
			   },
			   legend: {
				  itemStyle: {
					 color: '#E0E0E3',
					 fontSize: '.85em',
					 fontWeight: 'normal'
				  },
				  itemHoverStyle: {
					 color: '#FFF'
				  },
				  itemHiddenStyle: {
					 color: '#606063'
				  }
			   },
			   credits: {
				  style: {
					 color: '#666'
				  }
			   },
			   labels: {
				  style: {
					 color: '#707073'
				  }
			   },

			   drilldown: {
				  activeAxisLabelStyle: {
					 color: '#F0F0F3'
				  },
				  activeDataLabelStyle: {
					 color: '#F0F0F3'
				  }
			   },

			   navigation: {
				  buttonOptions: {
					 symbolStroke: '#42dca3',
					 theme: {
						fill: '#505053'
					 }
				  },
				  menuItemStyle:{
					  color: '#42dca3'
				  },
				  menuStyle: {
					  background: '#07261a',
					  border: '1px solid #42dca3',
				  }
			   },

			   // scroll charts
			   rangeSelector: {
				  buttonTheme: {
					 fill: '#505053',
					 stroke: '#000000',
					 style: {
						color: '#CCC'
					 },
					 states: {
						hover: {
						   fill: '#707073',
						   stroke: '#000000',
						   style: {
							  color: 'white'
						   }
						},
						select: {
						   fill: '#000003',
						   stroke: '#000000',
						   style: {
							  color: 'white'
						   }
						}
					 }
				  },
				  inputBoxBorderColor: '#505053',
				  inputStyle: {
					 backgroundColor: '#333',
					 color: 'silver'
				  },
				  labelStyle: {
					 color: 'silver'
				  }
			   },

			   navigator: {
				  handles: {
					 backgroundColor: '#666',
					 borderColor: '#AAA'
				  },
				  outlineColor: '#CCC',
				  maskFill: 'rgba(255,255,255,0.1)',
				  series: {
					 color: '#7798BF',
					 lineColor: '#A6C7ED'
				  },
				  xAxis: {
					 gridLineColor: '#505053'
				  }
			   },

			   scrollbar: {
				  barBackgroundColor: '#808083',
				  barBorderColor: '#808083',
				  buttonArrowColor: '#CCC',
				  buttonBackgroundColor: '#606063',
				  buttonBorderColor: '#606063',
				  rifleColor: '#FFF',
				  trackBackgroundColor: '#404043',
				  trackBorderColor: '#404043'
			   },

			   // special colors for some of the
			   legendBackgroundColor: 'rgba(0, 0, 0, 0.5)',
			   background2: '#505053',
			   dataLabelsColor: '#B0B0B3',
			   textColor: '#C0C0C0',
			   contrastTextColor: '#F0F0F3',
			   maskColor: 'rgba(255,255,255,0.3)'
			};

			// Apply the theme
			Highcharts.setOptions(Highcharts.theme);
			
			
			(function(H) {
				H.wrap(H.Tooltip.prototype, "refresh", function(c, p, e) {
					if(this.options.reversed && this.options.shared) {
						p.reverse();
					}
					c.call(this, p, e);
				});
			})(Highcharts);
			
		// Fix for chrome exporting issue http://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
		var isChrome = !!window.chrome && !!window.chrome.webstore;
		var isSafari = Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
		var isFirefox = typeof InstallTrigger !== 'undefined';
		var isIE = /*@cc_on!@*/false || !!document.documentMode;

		Highcharts.Chart.prototype.downloadServerSide = function(content, extension, mime) {
		  var options = (this.options.exporting || {}).csv || {};
		  Highcharts.post(options.url || 'http://www.highcharts.com/studies/csv-export/download.php', {
			data: content,
			type: mime,
			extension: extension
		  });
		};

		Highcharts.wrap(Highcharts.Chart.prototype, 'downloadXLS', function(proceed) {
		  var argList = Array.prototype.slice.call(arguments, 1);

		  if (isChrome) {
			// Handle XLS download on server side
			this.downloadServerSide('<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">' +
			  '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>' +
			  '<x:Name>Ark1</x:Name>' +
			  '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->' +
			  '<style>td{border:none;font-family: Calibri, sans-serif;} .number{mso-number-format:"0.00";}</style>' +
			  '<meta name=ProgId content=Excel.Sheet>' +
			  '<meta charset=UTF-8>' +
			  '</head><body>' +
			  this.getTable(true) +
			  '</body></html>', 'xls', 'application/vnd.ms-excel');
		  } else {
			// Continue to call original function
			proceed.apply(this, argList);
		  }
		});


		/* Wrap the client side image export function - going to comment this out - to omuch browser detect IE won't render text after a - with offline-exporting.js removing from grunt library
		Highcharts.wrap(Highcharts.Chart.prototype, 'exportChartLocal', function(proceed) {
		  var argList = Array.prototype.slice.call(arguments, 1);

		  if (isChrome || isFirefox || isSafari || isIE) {
			// Call server side exportChart function instead
			this.exportChart.apply(this, argList);
		  } else {
			// Continue to call client side exportChartLocal function
			proceed.apply(this, argList);
		  }
		});*/


		// Wrap the download CSV function
		Highcharts.wrap(Highcharts.Chart.prototype, 'downloadCSV', function(proceed) {
		  var argList = Array.prototype.slice.call(arguments, 1);

		  if (isChrome) {
			// Handle CSV download on server side
			this.downloadServerSide(this.getCSV(true), 'csv', 'text/csv');
		  } else {
			// Continue to call original function
			proceed.apply(this, argList);
		  }
		});
			
			// Concentration Chart
			$.get('./data/highcharts/inNAAQSconcentrations19902015.csv', function(csv) {
			$('#concentrationChartHS').highcharts({
					data: {
							csv: csv
						},
					chart: {
						zoomType: 'x',
						alignTicks: false
					},
					title: {
						text: 'National Air Quality Concentration Averages'
					},
					/*subtitle: {
						text: document.ontouchstart === undefined ?
									'Click and drag in the chart area to zoom in' : 'Pinch in the chart area to zoom in'
					},*/
					legend: {
						/*itemDistance: 10,*/
						itemMarginBottom: 8,
						itemWidth: 145,
					},
					xAxis: [{
						type: 'category',
						tickInterval: 5,
						crosshair: true
					}],
					yAxis: [{ // Primary yAxis
						labels: {
							format: '{value}%'
						},
						title: {
							text: 'Percentage Above or Below NAAQS (Excluding Lead)'
						},
						max: 100,
						tickInterval: 25,
						tickColor: 'transparent',
						/*plotBands: [
							{ // Above Most Recent Standard
							from: 0,
							to: 100,
							//color: 'rgba(68, 170, 213, 0.25)',
							label: {
								//text: 'Above Most Recent Standard',
								style: {
									color: '#939393'
									}
								}
							}, 
							{ // Below Most Recent Standard
							from: 0,
							to: -100,
							//color: 'rgba(68, 170, 213, .1)',
							label: {
								//text: 'Below Most Recent Standard',
								style: {
									color: '#939393'
									}
								}
							}],*/
						plotLines: [{
							value: 0,
							width: 2,
							dashStyle: 'dash',
							color: '#c9c9cf',
							label: {
								text: 'Most Recent National Standard',
								align: 'left',
								style: {
									color: '#c9c9cf',
									fontSize: '.833em'
									}
								}
							}]
					}, { // Secondary yAxis
						title: {
							text: 'Lead (Pb)',
							style: {
								color: Highcharts.getOptions().colors[0]
							}
						},
						labels: {
							format: '{value}%',
							style: {
								color: Highcharts.getOptions().colors[0]
							}
						},
						ceiling: 1300,
						tickInterval: 325,
						min: -1300,
						tickColor: 'transparent',
						gridLineColor: 'transparent',
						opposite: true,
						plotLines: [{
							value: 0,
							width: 2,
							dashStyle: 'dash',
							color: '#c9c9cf',
							label: {
								text: 'Most Recent National Standard',
								align: 'left',
								style: {
									color: '#c9c9cf',
									fontSize: '.833em'
									}
								}
							}]
					}],
					tooltip: {
						shared: true, 
						pointFormatter: function () {
							var symbol = '';
						
							if ( this.graphic && this.graphic.symbolName ) {
								switch ( this.graphic.symbolName ) {
									case 'circle':
										symbol = '&#x25CF';
										break;
									case 'diamond':
										symbol = '&#x25c6';
										break;
									case 'square':
										symbol = '&#x25a0';
										break;
									case 'triangle':
										symbol = '&#x25b2';
										break;
									case 'triangle-down':
										symbol = '&#x25bc';
										break;
								}
							}
							else if ( this.marker && this.marker.symbol ) {
								var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
								symbol = '<img src="' + url + '" alt="Marker" />';
							}
							
							return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name +  ': ' + '</span>' + this.y + '%' + '<br/>';
						},
						useHTML: true
					},
					credits: {
								enabled: false
							},
					plotOptions: {
						series: {
							marker: {
								enabled: true,
								radius: .2,
								states: {
									hover: {
										radius: 6
										}
									}
							}
						}
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 600,
						filename: "ConcentrationTrends",
						allowHTML: true
					},
					series: [
					{
						yAxis: 1 //*name: 'Pb (3-month)'
					}, 
					{
						yAxis: 0 //*name: 'CO (8-hour)'
					},
					{
						yAxis: 0 //*name: 'NO2 (annual)'
					},
					{
						yAxis: 0 //*name: 'NO2 (1-hour)'
					},
					{
						yAxis: 0 //*name: 'O3 (8-hour)'
					},
					{
						yAxis: 0 //*name: 'PM2.5 (annual)'
					},
					{
						yAxis: 0 //*name: 'PM2.5 (24-hour)'
					},
					{
						yAxis: 0 //*name: 'PM10 (24-hour)'
					},
					{
						yAxis: 0 //*name: 'SO2 (1-hour)'
					}]
				});
			});

			
			// Emission Trends Chart
			$.get('./data/highcharts/national_tier1_caps_totals_noWildfires.csv', function(csv) {
				$('#emissionTrends').highcharts({
					data: {
							csv: csv
						},
					chart: {
						zoomType: 'x',
						alignTicks: false
					},
					title: {
						text: 'National Air Emission Trends'
					},
					/*subtitle: {
						text: document.ontouchstart === undefined ?
									'Click and drag in the chart area to zoom in' : 'Pinch in the chart area to zoom in'
					},*/
					legend: {
						itemMarginBottom: 8,
						itemWidth: 118,
						style: {
							fontSize: '.7em'
						}
					},
					xAxis: [{
						type: 'category',
						tickInterval: 5,
						crosshair: true,
					}],
					yAxis: [{ // Primary yAxis
						labels: {
							formatter: function() {
							  if ( this.value > 1000 ) return Highcharts.numberFormat( this.value/1000, 0) ;  // may be only switched if > 1000
							  return Highcharts.numberFormat(this.value,0);
							}                
						},
						title: {
							text: 'Emissions (Excluding CO), Million Tons'
						},
						
						tickColor: 'transparent',
						
					}, { // Secondary yAxis
						title: {
							text: 'CO Emissions, Million Tons',
							style: {
								color: Highcharts.getOptions().colors[1]
							}
						},
						labels: {
							formatter: function() {
							  if ( this.value > 1000 ) return Highcharts.numberFormat( this.value/1000, 0) ;  // may be only switched if > 1000
							  return Highcharts.numberFormat(this.value,0);
							},
							style: {
									color: Highcharts.getOptions().colors[1]
								}
						},
						min: 0,
						tickColor: 'transparent',
						gridLineColor: 'transparent',
						opposite: true
					}],
					tooltip: {
							shared: true, 
							pointFormatter: function () {
								var symbol = '';
								
								if ( this.graphic && this.graphic.symbolName ) {
									switch ( this.graphic.symbolName ) {
										case 'circle':
										symbol = '&#x25CF';
										break;
										case 'diamond':
											symbol = '&#x25c6';
											break;
										case 'square':
											symbol = '&#x25a0';
											break;
										case 'triangle':
											symbol = '&#x25b2';
											break;
										case 'triangle-down':
											symbol = '&#x25bc';
											break;
									}
								}
								
								else if ( this.marker && this.marker.symbol ) {
									var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
									symbol = '<img src="' + url + '" alt="Marker" />';
								}
								
								return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y/1000,'1', '.') + ' million tons' + ' ' + '<br/>';
								
							},
							useHTML: true
						},
					credits: {
								enabled: false
							},
					plotOptions: {
							series: {
								marker: {
									enabled: true,
									radius: .2,
									states: {
										hover: {
											radius: 6
											}
										}
								}
							}
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 550,
						filename: "EmissionTrends",
						allowHTML: true
					},
					series: [
					{
						yAxis: 1, //*name: 'CO'
						color: Highcharts.getOptions().colors[1]
					}, 
					{
						yAxis: 0, //*name: 'NH3'
						color: Highcharts.getOptions().colors[10]
					},
					{
						yAxis: 0, //*name: 'NOx'
						id: 'NOxSeries',
						color: Highcharts.getOptions().colors[2]
					},
					{
						yAxis: 0, //*name: 'Direct PM2.5'
						color: Highcharts.getOptions().colors[5]
					},
					{
						yAxis: 0, //*name: 'Direct PM10'
						color: Highcharts.getOptions().colors[7]
					},
					{
						yAxis: 0, //*name: 'SO2'
						color: Highcharts.getOptions().colors[8]
					},
					{
						yAxis: 0, //*name: 'VOC'
						color: Highcharts.getOptions().colors[9]
					},
					{
						type: 'flags',
						showInLegend: false,
						tooltip: {
							pointFormatter: function(){
								return 'The National Emissions Inventory (NEI) <br>is compiled every three years with 2014 <br>being the most recent inventory.' ;
							}
						},
						data: [{
							x: 24,
							name: '2014',
							}],
						shape: 'squarepin',
						title: 'NEI 2014',
						y: -120,
						zIndex: 1,
						color: "#a4a4a7",
						lineWidth: .8,
						fillColor: "#646468",
						style: {
							color: "#00ff00"
						}
					},
					{
						type: 'flags',
						showInLegend: false,
						tooltip: {
							pointFormatter: function(){
								return 'State compliance begins for the EPA<br>issued regulation commonly referred<br>to as the NOx SIP Call. This rule<br>required states to reduce ozone season<br>NOx emissions that contribute to ozone<br>nonattainment in other states.' ;
							}
						},
						data: [{
							x: 13,
							name: '2003',
							}],
						shape: 'squarepin',
						title: 'NOx SIP Call',			
						onSeries: 'NOxSeries',
						y: -45,
						zIndex: -1,
						color: "#a4a4a7",
						lineWidth: .8,
						fillColor: "#646468",
						style: {
							color: "#00ff00"
						}
					}]
				});
			
				
				
				var chart = $('#emissionTrends').highcharts();
				$('#modal-1').on('show.bs.modal', function() {
					$('#emissionTrends').css('visibility', 'visible');
				});
				$('#modal-1').on('shown.bs.modal', function() {
					$('#emissionTrends').css('visibility', 'initial');
					chart.reflow();
				}); 
			});
			
			//Emission Sources Stacked Column Chart
			$.get('./data/highcharts/national_tier1_caps_sourceCat_noWildfires.csv', function(csv) {
				$('#emissionsources').highcharts({
					data: {
							csv: csv
						},
					chart: {
						type: 'column',
						inverted: true,
						marginRight: 15,
						spacingLeft: 15
					},
					title: {
						text: 'Emissions by Source Category',
					},
					xAxis: {
						type: 'category'
					},
					yAxis: {
						min: 0,
						tickInterval: 10,
						labels: {
							format: '{value}%'
						},	
						title: {
							text: 'Percentage'
						}
					},
					legend: {
						itemDistance: 45,
						reversed: true,
						itemMarginBottom: 8,
						margin: 12
					},
					tooltip: {
						useHTML: true,
						pointFormatter: function (){
							return '<span style="color:' + this.series.color + '">' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y/1000,'1', '.') + ' million tons ' + '(' + Highcharts.numberFormat(this.percentage,'0','%') + '%)' + '<br/>';
						} ,
						shared: true,
						reversed: true,
					},
					plotOptions: {
						column: {
							stacking: 'percent',
							events: {
								legendItemClick: function(){
									return false;
								}
							}
						}
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 550,
						filename: "EmissionSources",
						allowHTML: true
					},
					credits: {
						enabled: false
					}
				});
			});
				
			//Growth Chart - manual data entry (not csv load); custom markers
				$('#growthChart').highcharts({
					chart: {
							zoomType: 'x',
							backgroundColor: '#2a2a2b'
					},
					title: {
						text: 'Comparison of Growth Areas and Emissions',
						x: -20 //center
					},
					subtitle: {
						text: '1970-2015',
					},
					xAxis: {
						/*tickInterval: 6,*/
						crosshair: true,
						categories: ['1970','1980', '1990','1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005',
							'2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015'],
						tickPositions: [0,3,8,13,18,23],
						tickmarkPlacement: 'on'
						
					},
					yAxis: {
						title: {
						text: 'Percent Growth / Reduction',
						},
						labels: {
							format: '{value}%'
						},
						tickInterval:50,
						max: 300,
						tickColor: 'transparent',
						plotLines: [{
								value: 0,
								width: 2,
								dashStyle: 'dash',
								color: 'white',
						}]
					},
					tooltip: {
						shared: true,
						backgroundColor: '#2a2a2b',
						pointFormatter: function () {
							var symbol = '',
								symbolName;

							function setSymbol(symbolName) {
								switch (symbolName) {
									case 'circle':
										symbol = '&#x25CF';
										break;
									case 'diamond':
										symbol = '&#x25c6';
										break;
									case 'square':
										symbol = '&#x25a0';
										break;
									case 'triangle':
										symbol = '&#x25b2';
										break;
									case 'triangle-down':
										symbol = '&#x25bc';
										break;
								}
							}
							if (this.graphic && this.graphic.symbolName) {
								console.log('1');
								// when marker is enabled
								setSymbol(this.graphic.symbolName);
							} else if (this.marker && this.marker.symbol) {
								console.log('2');
								var url = this.marker.symbol.replace(/^url\(|\)$/g, '');
								symbol = '<img src="' + url + '" alt="Marker" />';
							} else if (this.series.symbol) {
								console.log(this.series);
								// when marker is disabled
								if (/url\(/.test(this.series.symbol)) {
									// and set as graphic
									var url = this.series.symbol.replace(/^url\(|\)$/g, '');
									symbol = '<img src="' + url + '" alt="Marker" />';
								} else {
									// or set as symbol name
									setSymbol(this.series.symbol);
								}
							}
							
							return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y,'0') + '%' + '<br/>';
						},
						useHTML: true
					},
					plotOptions: {
							series: {
								marker: {
									enabled: false,
								}
							}
					},
					credits: {
						enabled: false
					},
					legend: {
						itemMarginBottom: 8,
						itemDistance: 40,
						symbolWidth: 0,
						symbolPadding: 12,
						padding: 0
					},
					exporting: {
						filename: "GrowthAndEmissions",
						
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 550,
						chartOptions: {
							plotOptions: {
								series: {
									marker: {
										enabled: false
									}
								}
							}	
						}
					},
					series: [{
						data:[],
						includeInCSVExport: false,
						name:'Gross Domestic Product',
						id:'id-1',
						color: Highcharts.getOptions().colors[3],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjOTBlZTdlIiBkPSJNMTIgMmM1LjUxNCAwIDEwIDQuNDg2IDEwIDEwcy00LjQ4NiAxMC0xMCAxMC0xMC00LjQ4Ni0xMC0xMCA0LjQ4Ni0xMCAxMC0xMHptMC0yYy02LjYyNyAwLTEyIDUuMzczLTEyIDEyczUuMzczIDEyIDEyIDEyIDEyLTUuMzczIDEyLTEyLTUuMzczLTEyLTEyLTEyem00IDE0LjA4M2MwLTIuMTQ1LTIuMjMyLTIuNzQyLTMuOTQzLTMuNTQ2LTEuMDM5LS41NC0uOTA4LTEuODI5LjU4MS0xLjkxNi44MjYtLjA1IDEuNjc1LjE5NSAyLjQ0My40NjVsLjM2Mi0xLjY0N2MtLjkwNy0uMjc2LTEuNzE5LS40MDItMi40NDMtLjQyMXYtMS4wMThoLTF2MS4wNjdjLTEuOTQ1LjI2Ny0yLjk4NCAxLjQ4Ny0yLjk4NCAyLjg1IDAgMi40MzggMi44NDcgMi44MSAzLjc3OCAzLjI0MyAxLjI3LjU2OCAxLjAzNSAxLjc1LS4xMTQgMi4wMTEtLjk5Ny4yMjYtMi4yNjktLjE2OC0zLjIyNS0uNTRsLS40NTUgMS42NDRjLjg5NC40NjIgMS45NjUuNzA4IDMgLjcyN3YuOTk4aDF2LTEuMDUzYzEuNjU3LS4yMzIgMy4wMDItMS4xNDYgMy0yLjg2NHoiLz48L3N2Zz4=)'
						}
					},
					{
						name: 'Gross Domestic Product',
						linkedTo: 'id-1',
						color: Highcharts.getOptions().colors[3],
						data: [0, 36.6, 89.6, 115.5, 123.7, 133.7, 144.1, 155.5, 166, 168.6, 173.4, 181, 191.7, 201.4, 209.5, 215, 214.1, 205.4, 213.1, 218.1, 225.2, 230, 238, 
								{ 
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjOTBlZTdlIiBkPSJNMTIgMmM1LjUxNCAwIDEwIDQuNDg2IDEwIDEwcy00LjQ4NiAxMC0xMCAxMC0xMC00LjQ4Ni0xMC0xMCA0LjQ4Ni0xMCAxMC0xMHptMC0yYy02LjYyNyAwLTEyIDUuMzczLTEyIDEyczUuMzczIDEyIDEyIDEyIDEyLTUuMzczIDEyLTEyLTUuMzczLTEyLTEyLTEyem00IDE0LjA4M2MwLTIuMTQ1LTIuMjMyLTIuNzQyLTMuOTQzLTMuNTQ2LTEuMDM5LS41NC0uOTA4LTEuODI5LjU4MS0xLjkxNi44MjYtLjA1IDEuNjc1LjE5NSAyLjQ0My40NjVsLjM2Mi0xLjY0N2MtLjkwNy0uMjc2LTEuNzE5LS40MDItMi40NDMtLjQyMXYtMS4wMThoLTF2MS4wNjdjLTEuOTQ1LjI2Ny0yLjk4NCAxLjQ4Ny0yLjk4NCAyLjg1IDAgMi40MzggMi44NDcgMi44MSAzLjc3OCAzLjI0MyAxLjI3LjU2OCAxLjAzNSAxLjc1LS4xMTQgMi4wMTEtLjk5Ny4yMjYtMi4yNjktLjE2OC0zLjIyNS0uNTRsLS40NTUgMS42NDRjLjg5NC40NjIgMS45NjUuNzA4IDMgLjcyN3YuOTk4aDF2LTEuMDUzYzEuNjU3LS4yMzIgMy4wMDItMS4xNDYgMy0yLjg2NHoiLz48L3N2Zz4=)',
										enabled: true
								   },
								   y: 246.2
								}],
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjOTBlZTdlIiBkPSJNMTIgMmM1LjUxNCAwIDEwIDQuNDg2IDEwIDEwcy00LjQ4NiAxMC0xMCAxMC0xMC00LjQ4Ni0xMC0xMCA0LjQ4Ni0xMCAxMC0xMHptMC0yYy02LjYyNyAwLTEyIDUuMzczLTEyIDEyczUuMzczIDEyIDEyIDEyIDEyLTUuMzczIDEyLTEyLTUuMzczLTEyLTEyLTEyem00IDE0LjA4M2MwLTIuMTQ1LTIuMjMyLTIuNzQyLTMuOTQzLTMuNTQ2LTEuMDM5LS41NC0uOTA4LTEuODI5LjU4MS0xLjkxNi44MjYtLjA1IDEuNjc1LjE5NSAyLjQ0My40NjVsLjM2Mi0xLjY0N2MtLjkwNy0uMjc2LTEuNzE5LS40MDItMi40NDMtLjQyMXYtMS4wMThoLTF2MS4wNjdjLTEuOTQ1LjI2Ny0yLjk4NCAxLjQ4Ny0yLjk4NCAyLjg1IDAgMi40MzggMi44NDcgMi44MSAzLjc3OCAzLjI0MyAxLjI3LjU2OCAxLjAzNSAxLjc1LS4xMTQgMi4wMTEtLjk5Ny4yMjYtMi4yNjktLjE2OC0zLjIyNS0uNTRsLS40NTUgMS42NDRjLjg5NC40NjIgMS45NjUuNzA4IDMgLjcyN3YuOTk4aDF2LTEuMDUzYzEuNjU3LS4yMzIgMy4wMDItMS4xNDYgMy0yLjg2NHoiLz48L3N2Zz4=)'
									}
					}, 
					{
						data:[],
						includeInCSVExport: false,
						name:'Vehicle Miles Traveled',
						id:'id-2',
						color: Highcharts.getOptions().colors[1],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNyAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM3IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iIzc3OThiZiIgZD0iTTguNTcxIDE5LjQyOXEwLTEuMTc5LTAuODM5LTIuMDE4dC0yLjAxOC0wLjgzOS0yLjAxOCAwLjgzOS0wLjgzOSAyLjAxOCAwLjgzOSAyLjAxOCAyLjAxOCAwLjgzOSAyLjAxOC0wLjgzOSAwLjgzOS0yLjAxOHpNOS4yMTQgMTMuNzE0aDE4LjE0M2wtMS41ODktNi4zNzVxLTAuMDM2LTAuMTQzLTAuMjUtMC4zMTN0LTAuMzc1LTAuMTdoLTEzLjcxNHEtMC4xNjEgMC0wLjM3NSAwLjE3dC0wLjI1IDAuMzEzek0zMy43MTQgMTkuNDI5cTAtMS4xNzktMC44MzktMi4wMTh0LTIuMDE4LTAuODM5LTIuMDE4IDAuODM5LTAuODM5IDIuMDE4IDAuODM5IDIuMDE4IDIuMDE4IDAuODM5IDIuMDE4LTAuODM5IDAuODM5LTIuMDE4ek0zNi41NzEgMTcuNzE0djYuODU3cTAgMC4yNS0wLjE2MSAwLjQxMXQtMC40MTEgMC4xNjFoLTEuNzE0djIuMjg2cTAgMS40MjktMSAyLjQyOXQtMi40MjkgMS0yLjQyOS0xLTEtMi40Mjl2LTIuMjg2aC0xOC4yODZ2Mi4yODZxMCAxLjQyOS0xIDIuNDI5dC0yLjQyOSAxLTIuNDI5LTEtMS0yLjQyOXYtMi4yODZoLTEuNzE0cS0wLjI1IDAtMC40MTEtMC4xNjF0LTAuMTYxLTAuNDExdi02Ljg1N3EwLTEuNjYxIDEuMTctMi44M3QyLjgzLTEuMTdoMC41bDEuODc1LTcuNDgycTAuNDExLTEuNjc5IDEuODU3LTIuODEzdDMuMTk2LTEuMTM0aDEzLjcxNHExLjc1IDAgMy4xOTYgMS4xMzR0MS44NTcgMi44MTNsMS44NzUgNy40ODJoMC41cTEuNjYxIDAgMi44MyAxLjE3dDEuMTcgMi44M3oiPjwvcGF0aD48L3N2Zz4=)'
						}
					},
					{
						name: 'Vehicle Miles Traveled',
						linkedTo: 'id-2',
						color: Highcharts.getOptions().colors[1],
						data: [0, 37.6, 93.2, 118.3, 123.8, 129.9, 136.8, 142.3, 147.5, 151.9, 157.3, 160.4, 167.1, 169.3, 171.5, 173.1, 168.2, 166.4, 167.3, 165.4, 167.5, 169.2, 174,  
								{ 
								   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNyAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM3IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iIzc3OThiZiIgZD0iTTguNTcxIDE5LjQyOXEwLTEuMTc5LTAuODM5LTIuMDE4dC0yLjAxOC0wLjgzOS0yLjAxOCAwLjgzOS0wLjgzOSAyLjAxOCAwLjgzOSAyLjAxOCAyLjAxOCAwLjgzOSAyLjAxOC0wLjgzOSAwLjgzOS0yLjAxOHpNOS4yMTQgMTMuNzE0aDE4LjE0M2wtMS41ODktNi4zNzVxLTAuMDM2LTAuMTQzLTAuMjUtMC4zMTN0LTAuMzc1LTAuMTdoLTEzLjcxNHEtMC4xNjEgMC0wLjM3NSAwLjE3dC0wLjI1IDAuMzEzek0zMy43MTQgMTkuNDI5cTAtMS4xNzktMC44MzktMi4wMTh0LTIuMDE4LTAuODM5LTIuMDE4IDAuODM5LTAuODM5IDIuMDE4IDAuODM5IDIuMDE4IDIuMDE4IDAuODM5IDIuMDE4LTAuODM5IDAuODM5LTIuMDE4ek0zNi41NzEgMTcuNzE0djYuODU3cTAgMC4yNS0wLjE2MSAwLjQxMXQtMC40MTEgMC4xNjFoLTEuNzE0djIuMjg2cTAgMS40MjktMSAyLjQyOXQtMi40MjkgMS0yLjQyOS0xLTEtMi40Mjl2LTIuMjg2aC0xOC4yODZ2Mi4yODZxMCAxLjQyOS0xIDIuNDI5dC0yLjQyOSAxLTIuNDI5LTEtMS0yLjQyOXYtMi4yODZoLTEuNzE0cS0wLjI1IDAtMC40MTEtMC4xNjF0LTAuMTYxLTAuNDExdi02Ljg1N3EwLTEuNjYxIDEuMTctMi44M3QyLjgzLTEuMTdoMC41bDEuODc1LTcuNDgycTAuNDExLTEuNjc5IDEuODU3LTIuODEzdDMuMTk2LTEuMTM0aDEzLjcxNHExLjc1IDAgMy4xOTYgMS4xMzR0MS44NTcgMi44MTNsMS44NzUgNy40ODJoMC41cTEuNjYxIDAgMi44MyAxLjE3dDEuMTcgMi44M3oiPjwvcGF0aD48L3N2Zz4=)',
										enabled: true
								   },
								   y: 183.6
							   }],
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTYiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNyAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM3IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iIzc3OThiZiIgZD0iTTguNTcxIDE5LjQyOXEwLTEuMTc5LTAuODM5LTIuMDE4dC0yLjAxOC0wLjgzOS0yLjAxOCAwLjgzOS0wLjgzOSAyLjAxOCAwLjgzOSAyLjAxOCAyLjAxOCAwLjgzOSAyLjAxOC0wLjgzOSAwLjgzOS0yLjAxOHpNOS4yMTQgMTMuNzE0aDE4LjE0M2wtMS41ODktNi4zNzVxLTAuMDM2LTAuMTQzLTAuMjUtMC4zMTN0LTAuMzc1LTAuMTdoLTEzLjcxNHEtMC4xNjEgMC0wLjM3NSAwLjE3dC0wLjI1IDAuMzEzek0zMy43MTQgMTkuNDI5cTAtMS4xNzktMC44MzktMi4wMTh0LTIuMDE4LTAuODM5LTIuMDE4IDAuODM5LTAuODM5IDIuMDE4IDAuODM5IDIuMDE4IDIuMDE4IDAuODM5IDIuMDE4LTAuODM5IDAuODM5LTIuMDE4ek0zNi41NzEgMTcuNzE0djYuODU3cTAgMC4yNS0wLjE2MSAwLjQxMXQtMC40MTEgMC4xNjFoLTEuNzE0djIuMjg2cTAgMS40MjktMSAyLjQyOXQtMi40MjkgMS0yLjQyOS0xLTEtMi40Mjl2LTIuMjg2aC0xOC4yODZ2Mi4yODZxMCAxLjQyOS0xIDIuNDI5dC0yLjQyOSAxLTIuNDI5LTEtMS0yLjQyOXYtMi4yODZoLTEuNzE0cS0wLjI1IDAtMC40MTEtMC4xNjF0LTAuMTYxLTAuNDExdi02Ljg1N3EwLTEuNjYxIDEuMTctMi44M3QyLjgzLTEuMTdoMC41bDEuODc1LTcuNDgycTAuNDExLTEuNjc5IDEuODU3LTIuODEzdDMuMTk2LTEuMTM0aDEzLjcxNHExLjc1IDAgMy4xOTYgMS4xMzR0MS44NTcgMi44MTNsMS44NzUgNy40ODJoMC41cTEuNjYxIDAgMi44MyAxLjE3dDEuMTcgMi44M3oiPjwvcGF0aD48L3N2Zz4=)'
									}
					}, 
					{
						data:[],
						includeInCSVExport: false,
						name:'Population',
						id:'id-3',
						color: Highcharts.getOptions().colors[2],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTUiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2ZmMCIgZD0iTTEwLjU4OSAxNnEtMi44OTMgMC4wODktNC43MzIgMi4yODZoLTIuMzkzcS0xLjQ2NCAwLTIuNDY0LTAuNzIzdC0xLTIuMTE2cTAtNi4zMDQgMi4yMTQtNi4zMDQgMC4xMDcgMCAwLjc3NyAwLjM3NXQxLjc0MSAwLjc1OSAyLjEyNSAwLjM4NHExLjE5NiAwIDIuMzc1LTAuNDExLTAuMDg5IDAuNjYxLTAuMDg5IDEuMTc5IDAgMi40ODIgMS40NDYgNC41NzF6TTI5LjcxNCAyNy4zNzVxMCAyLjE0My0xLjMwNCAzLjM4NHQtMy40NjQgMS4yNDFoLTE1LjYwN3EtMi4xNjEgMC0zLjQ2NC0xLjI0MXQtMS4zMDQtMy4zODRxMC0wLjk0NiAwLjA2My0xLjg0OHQwLjI1LTEuOTQ2IDAuNDczLTEuOTM4IDAuNzY4LTEuNzQxIDEuMTA3LTEuNDQ2IDEuNTI3LTAuOTU1IDEuOTkxLTAuMzU3cTAuMTc5IDAgMC43NjggMC4zODR0MS4zMDQgMC44NTcgMS45MTEgMC44NTcgMi40MTEgMC4zODQgMi40MTEtMC4zODQgMS45MTEtMC44NTcgMS4zMDQtMC44NTcgMC43NjgtMC4zODRxMS4wODkgMCAxLjk5MSAwLjM1N3QxLjUyNyAwLjk1NSAxLjEwNyAxLjQ0NiAwLjc2OCAxLjc0MSAwLjQ3MyAxLjkzOCAwLjI1IDEuOTQ2IDAuMDYzIDEuODQ4ek0xMS40MjkgNC41NzFxMCAxLjg5My0xLjMzOSAzLjIzMnQtMy4yMzIgMS4zMzktMy4yMzItMS4zMzktMS4zMzktMy4yMzIgMS4zMzktMy4yMzIgMy4yMzItMS4zMzkgMy4yMzIgMS4zMzkgMS4zMzkgMy4yMzJ6TTI0IDExLjQyOXEwIDIuODM5LTIuMDA5IDQuODQ4dC00Ljg0OCAyLjAwOS00Ljg0OC0yLjAwOS0yLjAwOS00Ljg0OCAyLjAwOS00Ljg0OCA0Ljg0OC0yLjAwOSA0Ljg0OCAyLjAwOSAyLjAwOSA0Ljg0OHpNMzQuMjg2IDE1LjQ0NnEwIDEuMzkzLTEgMi4xMTZ0LTIuNDY0IDAuNzIzaC0yLjM5M3EtMS44MzktMi4xOTYtNC43MzItMi4yODYgMS40NDYtMi4wODkgMS40NDYtNC41NzEgMC0wLjUxOC0wLjA4OS0xLjE3OSAxLjE3OSAwLjQxMSAyLjM3NSAwLjQxMSAxLjA1NCAwIDIuMTI1LTAuMzg0dDEuNzQxLTAuNzU5IDAuNzc3LTAuMzc1cTIuMjE0IDAgMi4yMTQgNi4zMDR6TTMyIDQuNTcxcTAgMS44OTMtMS4zMzkgMy4yMzJ0LTMuMjMyIDEuMzM5LTMuMjMyLTEuMzM5LTEuMzM5LTMuMjMyIDEuMzM5LTMuMjMyIDMuMjMyLTEuMzM5IDMuMjMyIDEuMzM5IDEuMzM5IDMuMjMyeiI+PC9wYXRoPjwvc3ZnPg==)'
						}
					},
					{
						name: 'Population',
						linkedTo: 'id-3',
						color: Highcharts.getOptions().colors[2],
						data: [0, 10.7, 21.5, 29.3, 30.7, 32.2, 34.1, 35.6, 37.6, 39, 40.5, 41.5, 42.9, 44.4, 45.4, 46.8, 48.3, 49.8, 50.7, 52.2, 53.2, 54.1, 55.6,  
								{ 
								   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTUiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2ZmMCIgZD0iTTEwLjU4OSAxNnEtMi44OTMgMC4wODktNC43MzIgMi4yODZoLTIuMzkzcS0xLjQ2NCAwLTIuNDY0LTAuNzIzdC0xLTIuMTE2cTAtNi4zMDQgMi4yMTQtNi4zMDQgMC4xMDcgMCAwLjc3NyAwLjM3NXQxLjc0MSAwLjc1OSAyLjEyNSAwLjM4NHExLjE5NiAwIDIuMzc1LTAuNDExLTAuMDg5IDAuNjYxLTAuMDg5IDEuMTc5IDAgMi40ODIgMS40NDYgNC41NzF6TTI5LjcxNCAyNy4zNzVxMCAyLjE0My0xLjMwNCAzLjM4NHQtMy40NjQgMS4yNDFoLTE1LjYwN3EtMi4xNjEgMC0zLjQ2NC0xLjI0MXQtMS4zMDQtMy4zODRxMC0wLjk0NiAwLjA2My0xLjg0OHQwLjI1LTEuOTQ2IDAuNDczLTEuOTM4IDAuNzY4LTEuNzQxIDEuMTA3LTEuNDQ2IDEuNTI3LTAuOTU1IDEuOTkxLTAuMzU3cTAuMTc5IDAgMC43NjggMC4zODR0MS4zMDQgMC44NTcgMS45MTEgMC44NTcgMi40MTEgMC4zODQgMi40MTEtMC4zODQgMS45MTEtMC44NTcgMS4zMDQtMC44NTcgMC43NjgtMC4zODRxMS4wODkgMCAxLjk5MSAwLjM1N3QxLjUyNyAwLjk1NSAxLjEwNyAxLjQ0NiAwLjc2OCAxLjc0MSAwLjQ3MyAxLjkzOCAwLjI1IDEuOTQ2IDAuMDYzIDEuODQ4ek0xMS40MjkgNC41NzFxMCAxLjg5My0xLjMzOSAzLjIzMnQtMy4yMzIgMS4zMzktMy4yMzItMS4zMzktMS4zMzktMy4yMzIgMS4zMzktMy4yMzIgMy4yMzItMS4zMzkgMy4yMzIgMS4zMzkgMS4zMzkgMy4yMzJ6TTI0IDExLjQyOXEwIDIuODM5LTIuMDA5IDQuODQ4dC00Ljg0OCAyLjAwOS00Ljg0OC0yLjAwOS0yLjAwOS00Ljg0OCAyLjAwOS00Ljg0OCA0Ljg0OC0yLjAwOSA0Ljg0OCAyLjAwOSAyLjAwOSA0Ljg0OHpNMzQuMjg2IDE1LjQ0NnEwIDEuMzkzLTEgMi4xMTZ0LTIuNDY0IDAuNzIzaC0yLjM5M3EtMS44MzktMi4xOTYtNC43MzItMi4yODYgMS40NDYtMi4wODkgMS40NDYtNC41NzEgMC0wLjUxOC0wLjA4OS0xLjE3OSAxLjE3OSAwLjQxMSAyLjM3NSAwLjQxMSAxLjA1NCAwIDIuMTI1LTAuMzg0dDEuNzQxLTAuNzU5IDAuNzc3LTAuMzc1cTIuMjE0IDAgMi4yMTQgNi4zMDR6TTMyIDQuNTcxcTAgMS44OTMtMS4zMzkgMy4yMzJ0LTMuMjMyIDEuMzM5LTMuMjMyLTEuMzM5LTEuMzM5LTMuMjMyIDEuMzM5LTMuMjMyIDMuMjMyLTEuMzM5IDMuMjMyIDEuMzM5IDEuMzM5IDMuMjMyeiI+PC9wYXRoPjwvc3ZnPg==)',
									   enabled: true
								   },
								   y: 56.6
							   }],
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTUiIGhlaWdodD0iMTQiIHZpZXdCb3g9IjAgMCAzNCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjM0IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2ZmMCIgZD0iTTEwLjU4OSAxNnEtMi44OTMgMC4wODktNC43MzIgMi4yODZoLTIuMzkzcS0xLjQ2NCAwLTIuNDY0LTAuNzIzdC0xLTIuMTE2cTAtNi4zMDQgMi4yMTQtNi4zMDQgMC4xMDcgMCAwLjc3NyAwLjM3NXQxLjc0MSAwLjc1OSAyLjEyNSAwLjM4NHExLjE5NiAwIDIuMzc1LTAuNDExLTAuMDg5IDAuNjYxLTAuMDg5IDEuMTc5IDAgMi40ODIgMS40NDYgNC41NzF6TTI5LjcxNCAyNy4zNzVxMCAyLjE0My0xLjMwNCAzLjM4NHQtMy40NjQgMS4yNDFoLTE1LjYwN3EtMi4xNjEgMC0zLjQ2NC0xLjI0MXQtMS4zMDQtMy4zODRxMC0wLjk0NiAwLjA2My0xLjg0OHQwLjI1LTEuOTQ2IDAuNDczLTEuOTM4IDAuNzY4LTEuNzQxIDEuMTA3LTEuNDQ2IDEuNTI3LTAuOTU1IDEuOTkxLTAuMzU3cTAuMTc5IDAgMC43NjggMC4zODR0MS4zMDQgMC44NTcgMS45MTEgMC44NTcgMi40MTEgMC4zODQgMi40MTEtMC4zODQgMS45MTEtMC44NTcgMS4zMDQtMC44NTcgMC43NjgtMC4zODRxMS4wODkgMCAxLjk5MSAwLjM1N3QxLjUyNyAwLjk1NSAxLjEwNyAxLjQ0NiAwLjc2OCAxLjc0MSAwLjQ3MyAxLjkzOCAwLjI1IDEuOTQ2IDAuMDYzIDEuODQ4ek0xMS40MjkgNC41NzFxMCAxLjg5My0xLjMzOSAzLjIzMnQtMy4yMzIgMS4zMzktMy4yMzItMS4zMzktMS4zMzktMy4yMzIgMS4zMzktMy4yMzIgMy4yMzItMS4zMzkgMy4yMzIgMS4zMzkgMS4zMzkgMy4yMzJ6TTI0IDExLjQyOXEwIDIuODM5LTIuMDA5IDQuODQ4dC00Ljg0OCAyLjAwOS00Ljg0OC0yLjAwOS0yLjAwOS00Ljg0OCAyLjAwOS00Ljg0OCA0Ljg0OC0yLjAwOSA0Ljg0OCAyLjAwOSAyLjAwOSA0Ljg0OHpNMzQuMjg2IDE1LjQ0NnEwIDEuMzkzLTEgMi4xMTZ0LTIuNDY0IDAuNzIzaC0yLjM5M3EtMS44MzktMi4xOTYtNC43MzItMi4yODYgMS40NDYtMi4wODkgMS40NDYtNC41NzEgMC0wLjUxOC0wLjA4OS0xLjE3OSAxLjE3OSAwLjQxMSAyLjM3NSAwLjQxMSAxLjA1NCAwIDIuMTI1LTAuMzg0dDEuNzQxLTAuNzU5IDAuNzc3LTAuMzc1cTIuMjE0IDAgMi4yMTQgNi4zMDR6TTMyIDQuNTcxcTAgMS44OTMtMS4zMzkgMy4yMzJ0LTMuMjMyIDEuMzM5LTMuMjMyLTEuMzM5LTEuMzM5LTMuMjMyIDEuMzM5LTMuMjMyIDMuMjMyLTEuMzM5IDMuMjMyIDEuMzM5IDEuMzM5IDMuMjMyeiI+PC9wYXRoPjwvc3ZnPg==)'
									}
					}, 
					{
						data:[],
						includeInCSVExport: false,
						name:'Energy Consumption',
						id:'id-4',
						color: Highcharts.getOptions().colors[4],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTEiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCAxOCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2Y0NWI1YiIgZD0iTTEzLjE0MyAxMC4yODZxMCAwLjIzMi0wLjE3IDAuNDAydC0wLjQwMiAwLjE3LTAuNDAyLTAuMTctMC4xNy0wLjQwMnEwLTAuODIxLTAuOTY0LTEuMjY4dC0xLjg5My0wLjQ0NnEtMC4yMzIgMC0wLjQwMi0wLjE3dC0wLjE3LTAuNDAyIDAuMTctMC40MDIgMC40MDItMC4xN3EwLjg5MyAwIDEuNzc3IDAuMjg2dDEuNTU0IDAuOTY0IDAuNjcgMS42MDd6TTE2IDEwLjI4NnEwLTEuMjg2LTAuNjE2LTIuMzkzdC0xLjYwNy0xLjgxMy0yLjE5Ni0xLjEwNy0yLjQzOC0wLjQwMi0yLjQzOCAwLjQwMi0yLjE5NiAxLjEwNy0xLjYwNyAxLjgxMy0wLjYxNiAyLjM5M3EwIDEuODA0IDEuMjE0IDMuMjE0IDAuMTc5IDAuMTk2IDAuNTQ1IDAuNTg5dDAuNTQ1IDAuNTg5cTIuMjg2IDIuNzMyIDIuNTE4IDUuMzIxaDQuMDcxcTAuMjMyLTIuNTg5IDIuNTE4LTUuMzIxIDAuMTc5LTAuMTk2IDAuNTQ1LTAuNTg5dDAuNTQ1LTAuNTg5cTEuMjE0LTEuNDExIDEuMjE0LTMuMjE0ek0xOC4yODYgMTAuMjg2cTAgMi43NjgtMS44MzkgNC43ODYtMC44MDQgMC44NzUtMS4zMyAxLjU1NHQtMS4wNjMgMS43MDUtMC42MDcgMS45MnEwLjgzOSAwLjUgMC44MzkgMS40NjQgMCAwLjY2MS0wLjQ0NiAxLjE0MyAwLjQ0NiAwLjQ4MiAwLjQ0NiAxLjE0MyAwIDAuOTI5LTAuODA0IDEuNDQ2IDAuMjMyIDAuNDExIDAuMjMyIDAuODM5IDAgMC44MjEtMC41NjMgMS4yNjh0LTEuMzg0IDAuNDQ2cS0wLjM1NyAwLjc4Ni0xLjA3MSAxLjI1dC0xLjU1NCAwLjQ2NC0xLjU1NC0wLjQ2NC0xLjA3MS0xLjI1cS0wLjgyMSAwLTEuMzg0LTAuNDQ2dC0wLjU2My0xLjI2OHEwLTAuNDI5IDAuMjMyLTAuODM5LTAuODA0LTAuNTE4LTAuODA0LTEuNDQ2IDAtMC42NjEgMC40NDYtMS4xNDMtMC40NDYtMC40ODItMC40NDYtMS4xNDMgMC0wLjk2NCAwLjgzOS0xLjQ2NC0wLjA3MS0wLjg5My0wLjYwNy0xLjkydC0xLjA2My0xLjcwNS0xLjMzLTEuNTU0cS0xLjgzOS0yLjAxOC0xLjgzOS00Ljc4NiAwLTEuNzY4IDAuNzk1LTMuMjk1dDIuMDg5LTIuNTM2IDIuOTI5LTEuNTg5IDMuMzMtMC41OCAzLjMzIDAuNTggMi45MjkgMS41ODkgMi4wODkgMi41MzYgMC43OTUgMy4yOTV6Ij48L3BhdGg+PC9zdmc+)'
						}
					},
					{
						name: 'Energy Consumption',
						linkedTo: 'id-4',
						color: Highcharts.getOptions().colors[4],
						data: [0, 15.1, 24.5, 34.2, 38.6, 39.5, 40.1, 42.5, 45.7, 41.8, 43.9, 44.3, 47.5, 47.7, 46.7, 48.9, 45.8, 38.8, 43.7, 42.8, 39.3, 43.3, 45.2,  
								{ 
								   marker: {
									    symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTEiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCAxOCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2Y0NWI1YiIgZD0iTTEzLjE0MyAxMC4yODZxMCAwLjIzMi0wLjE3IDAuNDAydC0wLjQwMiAwLjE3LTAuNDAyLTAuMTctMC4xNy0wLjQwMnEwLTAuODIxLTAuOTY0LTEuMjY4dC0xLjg5My0wLjQ0NnEtMC4yMzIgMC0wLjQwMi0wLjE3dC0wLjE3LTAuNDAyIDAuMTctMC40MDIgMC40MDItMC4xN3EwLjg5MyAwIDEuNzc3IDAuMjg2dDEuNTU0IDAuOTY0IDAuNjcgMS42MDd6TTE2IDEwLjI4NnEwLTEuMjg2LTAuNjE2LTIuMzkzdC0xLjYwNy0xLjgxMy0yLjE5Ni0xLjEwNy0yLjQzOC0wLjQwMi0yLjQzOCAwLjQwMi0yLjE5NiAxLjEwNy0xLjYwNyAxLjgxMy0wLjYxNiAyLjM5M3EwIDEuODA0IDEuMjE0IDMuMjE0IDAuMTc5IDAuMTk2IDAuNTQ1IDAuNTg5dDAuNTQ1IDAuNTg5cTIuMjg2IDIuNzMyIDIuNTE4IDUuMzIxaDQuMDcxcTAuMjMyLTIuNTg5IDIuNTE4LTUuMzIxIDAuMTc5LTAuMTk2IDAuNTQ1LTAuNTg5dDAuNTQ1LTAuNTg5cTEuMjE0LTEuNDExIDEuMjE0LTMuMjE0ek0xOC4yODYgMTAuMjg2cTAgMi43NjgtMS44MzkgNC43ODYtMC44MDQgMC44NzUtMS4zMyAxLjU1NHQtMS4wNjMgMS43MDUtMC42MDcgMS45MnEwLjgzOSAwLjUgMC44MzkgMS40NjQgMCAwLjY2MS0wLjQ0NiAxLjE0MyAwLjQ0NiAwLjQ4MiAwLjQ0NiAxLjE0MyAwIDAuOTI5LTAuODA0IDEuNDQ2IDAuMjMyIDAuNDExIDAuMjMyIDAuODM5IDAgMC44MjEtMC41NjMgMS4yNjh0LTEuMzg0IDAuNDQ2cS0wLjM1NyAwLjc4Ni0xLjA3MSAxLjI1dC0xLjU1NCAwLjQ2NC0xLjU1NC0wLjQ2NC0xLjA3MS0xLjI1cS0wLjgyMSAwLTEuMzg0LTAuNDQ2dC0wLjU2My0xLjI2OHEwLTAuNDI5IDAuMjMyLTAuODM5LTAuODA0LTAuNTE4LTAuODA0LTEuNDQ2IDAtMC42NjEgMC40NDYtMS4xNDMtMC40NDYtMC40ODItMC40NDYtMS4xNDMgMC0wLjk2NCAwLjgzOS0xLjQ2NC0wLjA3MS0wLjg5My0wLjYwNy0xLjkydC0xLjA2My0xLjcwNS0xLjMzLTEuNTU0cS0xLjgzOS0yLjAxOC0xLjgzOS00Ljc4NiAwLTEuNzY4IDAuNzk1LTMuMjk1dDIuMDg5LTIuNTM2IDIuOTI5LTEuNTg5IDMuMzMtMC41OCAzLjMzIDAuNTggMi45MjkgMS41ODkgMi4wODkgMi41MzYgMC43OTUgMy4yOTV6Ij48L3BhdGg+PC9zdmc+)',
										enabled: true
								   },
								   y: 43.9
							   }],
								   marker: {
										symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTEiIGhlaWdodD0iMTkiIHZpZXdCb3g9IjAgMCAxOCAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2Y0NWI1YiIgZD0iTTEzLjE0MyAxMC4yODZxMCAwLjIzMi0wLjE3IDAuNDAydC0wLjQwMiAwLjE3LTAuNDAyLTAuMTctMC4xNy0wLjQwMnEwLTAuODIxLTAuOTY0LTEuMjY4dC0xLjg5My0wLjQ0NnEtMC4yMzIgMC0wLjQwMi0wLjE3dC0wLjE3LTAuNDAyIDAuMTctMC40MDIgMC40MDItMC4xN3EwLjg5MyAwIDEuNzc3IDAuMjg2dDEuNTU0IDAuOTY0IDAuNjcgMS42MDd6TTE2IDEwLjI4NnEwLTEuMjg2LTAuNjE2LTIuMzkzdC0xLjYwNy0xLjgxMy0yLjE5Ni0xLjEwNy0yLjQzOC0wLjQwMi0yLjQzOCAwLjQwMi0yLjE5NiAxLjEwNy0xLjYwNyAxLjgxMy0wLjYxNiAyLjM5M3EwIDEuODA0IDEuMjE0IDMuMjE0IDAuMTc5IDAuMTk2IDAuNTQ1IDAuNTg5dDAuNTQ1IDAuNTg5cTIuMjg2IDIuNzMyIDIuNTE4IDUuMzIxaDQuMDcxcTAuMjMyLTIuNTg5IDIuNTE4LTUuMzIxIDAuMTc5LTAuMTk2IDAuNTQ1LTAuNTg5dDAuNTQ1LTAuNTg5cTEuMjE0LTEuNDExIDEuMjE0LTMuMjE0ek0xOC4yODYgMTAuMjg2cTAgMi43NjgtMS44MzkgNC43ODYtMC44MDQgMC44NzUtMS4zMyAxLjU1NHQtMS4wNjMgMS43MDUtMC42MDcgMS45MnEwLjgzOSAwLjUgMC44MzkgMS40NjQgMCAwLjY2MS0wLjQ0NiAxLjE0MyAwLjQ0NiAwLjQ4MiAwLjQ0NiAxLjE0MyAwIDAuOTI5LTAuODA0IDEuNDQ2IDAuMjMyIDAuNDExIDAuMjMyIDAuODM5IDAgMC44MjEtMC41NjMgMS4yNjh0LTEuMzg0IDAuNDQ2cS0wLjM1NyAwLjc4Ni0xLjA3MSAxLjI1dC0xLjU1NCAwLjQ2NC0xLjU1NC0wLjQ2NC0xLjA3MS0xLjI1cS0wLjgyMSAwLTEuMzg0LTAuNDQ2dC0wLjU2My0xLjI2OHEwLTAuNDI5IDAuMjMyLTAuODM5LTAuODA0LTAuNTE4LTAuODA0LTEuNDQ2IDAtMC42NjEgMC40NDYtMS4xNDMtMC40NDYtMC40ODItMC40NDYtMS4xNDMgMC0wLjk2NCAwLjgzOS0xLjQ2NC0wLjA3MS0wLjg5My0wLjYwNy0xLjkydC0xLjA2My0xLjcwNS0xLjMzLTEuNTU0cS0xLjgzOS0yLjAxOC0xLjgzOS00Ljc4NiAwLTEuNzY4IDAuNzk1LTMuMjk1dDIuMDg5LTIuNTM2IDIuOTI5LTEuNTg5IDMuMzMtMC41OCAzLjMzIDAuNTggMi45MjkgMS41ODkgMi4wODkgMi41MzYgMC43OTUgMy4yOTV6Ij48L3BhdGg+PC9zdmc+)'
									}
					},
					{
						data:[],
						includeInCSVExport: false,
						name:'CO2 Emissions',
						id:'id-5',
						color: Highcharts.getOptions().colors[0],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2YwNiIgZD0iTTggMHEwLjQ2NCAwIDAuODA0IDAuMzM5dDAuMzM5IDAuODA0djE1LjkxMWw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHY2Ljc2OGw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHYyMC41NzFxMCAwLjQ2NC0wLjMzOSAwLjgwNHQtMC44MDQgMC4zMzloLTI5LjcxNHEtMC40NjQgMC0wLjgwNC0wLjMzOXQtMC4zMzktMC44MDR2LTI5LjcxNHEwLTAuNDY0IDAuMzM5LTAuODA0dDAuODA0LTAuMzM5aDYuODU3eiI+PC9wYXRoPjwvc3ZnPg==)'
						}
					},
					{
						name: 'CO2 Emissions',
						linkedTo: 'id-5',
						color: Highcharts.getOptions().colors[0],
						data: [0, 9.1, 18.2, 25.7, 30.1, 31.8, 32.7, 34.4, 38.5, 36.2, 37.1, 38.2, 40.9, 41.5, 39.6, 41.4, 36.9, 26.8, 31.4, 28.5, 23.6, 27.1,  
								{ 
								   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2YwNiIgZD0iTTggMHEwLjQ2NCAwIDAuODA0IDAuMzM5dDAuMzM5IDAuODA0djE1LjkxMWw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHY2Ljc2OGw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHYyMC41NzFxMCAwLjQ2NC0wLjMzOSAwLjgwNHQtMC44MDQgMC4zMzloLTI5LjcxNHEtMC40NjQgMC0wLjgwNC0wLjMzOXQtMC4zMzktMC44MDR2LTI5LjcxNHEwLTAuNDY0IDAuMzM5LTAuODA0dDAuODA0LTAuMzM5aDYuODU3eiI+PC9wYXRoPjwvc3ZnPg==)',
										enabled: true
								   },
								   y: 28.4
							   }],
									marker: {
									   symbol: 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz48IURPQ1RZUEUgc3ZnIFBVQkxJQyAiLS8vVzNDLy9EVEQgU1ZHIDEuMS8vRU4iICJodHRwOi8vd3d3LnczLm9yZy9HcmFwaGljcy9TVkcvMS4xL0RURC9zdmcxMS5kdGQiPjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iMTIiIGhlaWdodD0iMTIiIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHJlY3QgZmlsbD0iIzJhMmEyYiIgeD0iMCIgeT0iMCIgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIj48L3JlY3Q+PHBhdGggZmlsbD0iI2YwNiIgZD0iTTggMHEwLjQ2NCAwIDAuODA0IDAuMzM5dDAuMzM5IDAuODA0djE1LjkxMWw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHY2Ljc2OGw5LjU3MS03LjY2MXEwLjMwNC0wLjI1IDAuNzE0LTAuMjUgMC40NjQgMCAwLjgwNCAwLjMzOXQwLjMzOSAwLjgwNHYyMC41NzFxMCAwLjQ2NC0wLjMzOSAwLjgwNHQtMC44MDQgMC4zMzloLTI5LjcxNHEtMC40NjQgMC0wLjgwNC0wLjMzOXQtMC4zMzktMC44MDR2LTI5LjcxNHEwLTAuNDY0IDAuMzM5LTAuODA0dDAuODA0LTAuMzM5aDYuODU3eiI+PC9wYXRoPjwvc3ZnPg==)'
								   }
					}, 
					{
						data:[],
						includeInCSVExport: false,
						name:'Aggregate Emissions (Six Common Pollutants)',
						id:'id-6',
						color: Highcharts.getOptions().colors[5],
						marker:{
							enabled: true,
							symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjYWFlZWVlIiBkPSJNMjIuOCAxMS44MTlsLTEuNjY3IDEuNjYtNi43ODEtNi43NjItMi45OTIgMi45OTMtNS45MjItNS44MzUtMS40MSAxLjQxOCA3LjMzNiA3LjI0MiAzLjAwMS0zLjAwMiA1LjM1MSA1LjM1OC0xLjcxNiAxLjcwOCA2IDEuMjIxLTEuMi02LjAwMXptMS4yIDguMTgxdjJoLTI0di0yMGgydjE4aDIyeiIvPjwvc3ZnPg==)'
						}
					},
					{
						name: 'Aggregate Emissions (Six Common Pollutants)',
						linkedTo:'id-6',
						color: Highcharts.getOptions().colors[5],
						data: [0, -17.3, -33, -39.7, -42.9, -42.9, -43.9, -45.8, -47.5, -48.9, -47.6, -49.2, -50.8, -52.1, -54.3, -56.5, -60.2, -62.9, -64.5, -65.6, -66.5, -67.5,-69.5, 
								{ 
								   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjYWFlZWVlIiBkPSJNMjIuOCAxMS44MTlsLTEuNjY3IDEuNjYtNi43ODEtNi43NjItMi45OTIgMi45OTMtNS45MjItNS44MzUtMS40MSAxLjQxOCA3LjMzNiA3LjI0MiAzLjAwMS0zLjAwMiA1LjM1MSA1LjM1OC0xLjcxNiAxLjcwOCA2IDEuMjIxLTEuMi02LjAwMXptMS4yIDguMTgxdjJoLTI0di0yMGgydjE4aDIyeiIvPjwvc3ZnPg==)',
										enabled:true
								   },
								   y: -71.4
							   }],
							   marker: {
									   symbol: 'url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0Ij48cmVjdCBmaWxsPSIjMmEyYTJiIiB4PSIwIiB5PSIwIiB3aWR0aD0iMjQiIGhlaWdodD0iMjQiPjwvcmVjdD48cGF0aCBmaWxsPSIjYWFlZWVlIiBkPSJNMjIuOCAxMS44MTlsLTEuNjY3IDEuNjYtNi43ODEtNi43NjItMi45OTIgMi45OTMtNS45MjItNS44MzUtMS40MSAxLjQxOCA3LjMzNiA3LjI0MiAzLjAwMS0zLjAwMiA1LjM1MSA1LjM1OC0xLjcxNiAxLjcwOCA2IDEuMjIxLTEuMi02LjAwMXptMS4yIDguMTgxdjJoLTI0di0yMGgydjE4aDIyeiIvPjwvc3ZnPg==)'
								   }
					}]
				});
			
			
			//Weather Chart1 - Urban Ozone
			$.get('./data/highcharts/mettrends_2000_2015_urban.csv', function(csv) {
				$('#weatherChart1').highcharts({
					data: {
							csv: csv
					},
					title: {
						text: 'National Urban Ozone Trend',
						x: -20 //center
					},
					subtitle: {
						text: '111 Locations',
						x: -20
					},
					xAxis: {
						type: 'category',
						tickInterval: 5,
						crosshair: true
					},
					yAxis: {
						tickInterval: 5,
						max: 60,
						min: 45,
						title: {
							text: 'May - September Average Ozone (ppb)'
						},
					},
					tooltip: {
						shared: true, 
						pointFormatter: function () {
							var symbol = '';
						
							if ( this.graphic && this.graphic.symbolName ) {
								switch ( this.graphic.symbolName ) {
									case 'circle':
										symbol = '&#x25CF';
										break;
									case 'diamond':
										symbol = '&#x25c6';
										break;
									case 'square':
										symbol = '&#x25a0';
										break;
									case 'triangle':
										symbol = '&#x25b2';
										break;
									case 'triangle-down':
										symbol = '&#x25bc';
										break;
								}
							}
							else if ( this.marker && this.marker.symbol ) {
								var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
								symbol = '<img src="' + url + '" alt="Marker" />';
							}
							
							return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y,'1', '.') + ' ppb' + '<br/>';
						},
						useHTML: true
					},
					legend: {
						itemDistance: 40
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 400,
						filename: "UrbanOzone",
						allowHTML: true
					},
					credits: {
						enabled: false
					}
				});
			});
			
			//Weather Chart2 - Rural Ozone
			$.get('./data/highcharts/mettrends_2000_2015_rural.csv', function(csv) {
				$('#weatherChart2').highcharts({
					data: {
								csv: csv
							},
					title: {
						text: 'National Rural Ozone Trend',
						x: -20 //center
					},
					subtitle: {
						text: '50 Locations',
						x: -20
					},
					xAxis: {
						type: 'category',
						tickInterval: 5,
						crosshair: true
					},
					yAxis: {
						tickInterval: 5,
						max: 60,
						min: 40,
						title: {
							text: 'May - September Average Ozone (ppb)'
						},
					},
					tooltip: {
						shared: true, 
						pointFormatter: function () {
							var symbol = '';
						
							if ( this.graphic && this.graphic.symbolName ) {
								switch ( this.graphic.symbolName ) {
									case 'circle':
										symbol = '&#x25CF';
										break;
									case 'diamond':
										symbol = '&#x25c6';
										break;
									case 'square':
										symbol = '&#x25a0';
										break;
									case 'triangle':
										symbol = '&#x25b2';
										break;
									case 'triangle-down':
										symbol = '&#x25bc';
										break;
								}
							}
							else if ( this.marker && this.marker.symbol ) {
								var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
								symbol = '<img src="' + url + '" alt="Marker" />';
							}
							
							return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y,'1', '.') + ' ppb' + '<br/>';
						},
						useHTML: true
					},
					legend: {
						itemDistance: 40
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 400,
						filename: "RuralOzone",
						allowHTML: true
					},
					credits: {
						enabled: false
					}
				});
			});
		});

		/*
JS Modified from a tutorial found here: 
http://www.inwebson.com/html5/custom-html5-video-controls-with-jquery/

I really wanted to learn how to skin html5 video.
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
		$('.current').text(timeFormat(0));
		$('.duration').text(timeFormat(video[0].duration));
		updateVolume(0, 0.7);
			
		//start to get video buffering data 
		setTimeout(startBuffer, 150);
			
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
	
	//display video buffering bar
	var startBuffer = function() {
		var currentBuffer = video[0].buffered.end(0);
		var maxduration = video[0].duration;
		var perc = 100 * currentBuffer / maxduration;
		$('.bufferBar').css('width',perc+'%');
			
		if(currentBuffer < maxduration) {
			setTimeout(startBuffer, 500);
		}
	};	
	
	//display current video play time
	video.on('timeupdate', function() {
		var currentPos = video[0].currentTime;
		var maxduration = video[0].duration;
		var perc = 100 * currentPos / maxduration;
		$('.timeBar').css('width',perc+'%');	
		$('.current').text(timeFormat(currentPos));	
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
	
	//sound button clicked
	$('.sound').click(function() {
		video[0].muted = !video[0].muted;
		$(this).toggleClass('muted');
		if(video[0].muted) {
			$('.volumeBar').css('width',0);
		}
		else{
			$('.volumeBar').css('width', video[0].volume*100+'%');
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
	
	//VIDEO PROGRESS BAR
	//when video timebar clicked
	var timeDrag = false;	/* check for drag event */
	$('.progress').on('mousedown', function(e) {
		timeDrag = true;
		updatebar(e.pageX);
	});
	$(document).on('mouseup', function(e) {
		if(timeDrag) {
			timeDrag = false;
			updatebar(e.pageX);
		}
	});
	$(document).on('mousemove', function(e) {
		if(timeDrag) {
			updatebar(e.pageX);
		}
	});
	var updatebar = function(x) {
		var progress = $('.progress');
		
		//calculate drag position
		//and update video currenttime
		//as well as progress bar
		var maxduration = video[0].duration;
		var position = x - progress.offset().left;
		var percentage = 100 * position / progress.width();
		if(percentage > 100) {
			percentage = 100;
		}
		if(percentage < 0) {
			percentage = 0;
		}
		$('.timeBar').css('width',percentage+'%');	
		video[0].currentTime = maxduration * percentage / 100;
	};

	//VOLUME BAR
	//volume bar event
	var volumeDrag = false;
	$('.volume').on('mousedown', function(e) {
		volumeDrag = true;
		video[0].muted = false;
		$('.sound').removeClass('muted');
		updateVolume(e.pageX);
	});
	$(document).on('mouseup', function(e) {
		if(volumeDrag) {
			volumeDrag = false;
			updateVolume(e.pageX);
		}
	});
	$(document).on('mousemove', function(e) {
		if(volumeDrag) {
			updateVolume(e.pageX);
		}
	});
	var updateVolume = function(x, vol) {
		var volume = $('.volume');
		var percentage;
		//if only volume have specificed
		//then direct update volume
		if(vol) {
			percentage = vol * 100;
		}
		else {
			var position = x - volume.offset().left;
			percentage = 100 * position / volume.width();
		}
		
		if(percentage > 100) {
			percentage = 100;
		}
		if(percentage < 0) {
			percentage = 0;
		}
		
		//update volume bar and video volume
		$('.volumeBar').css('width',percentage+'%');	
		video[0].volume = percentage / 100;
		
		//change sound icon based on volume
		if(video[0].volume == 0){
			$('.sound').removeClass('sound2').addClass('muted');
		}
		else if(video[0].volume > 0.5){
			$('.sound').removeClass('muted').addClass('sound2');
		}
		else{
			$('.sound').removeClass('muted').removeClass('sound2');
		}
		
	};

	//Time format converter - 00:00
	var timeFormat = function(seconds){
		var m = Math.floor(seconds/60)<10 ? "0"+Math.floor(seconds/60) : Math.floor(seconds/60);
		var s = Math.floor(seconds-(m*60))<10 ? "0"+Math.floor(seconds-(m*60)) : Math.floor(seconds-(m*60));
		return m+":"+s;
	};
});

//For tab navigation
		// Remove focus outlines
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
		 this.style.border = "1px solid #42dca3";
	});
	$(".btnPly, .btnFS").mousedown(function() {
		 this.blur();
		 this.hideFocus = true;
		 this.style.border = "1px solid rgba(0,0,0,0.7)";
	});
	


//For preloader screen
	$(window).load(function() {
		// Animate loader off screen
		$(".se-pre-con").fadeOut("slow");;
	});

