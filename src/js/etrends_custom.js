// Script for SVG pan and zoom - additional js in etrends.js 
	
	//Create object on window for seasonal svg map  
	  var seasonalSVGpm25map = {};
	  seasonalSVGpm25map.svgID = "svgSeasonalPm25map";
	  seasonalSVGpm25map.panZoom;
	  
	//To know when map is initially loaded to set window resize events
	seasonalSVGpm25map.isLoaded=false;
	
	//Handle SVG DropDown Change
	seasonalSVGpm25map.onDropChange = function  (folder,newsvg){
		if (seasonalSVGpm25map.panZoom) seasonalSVGpm25map.panZoom.destroy();
		seasonalSVGpm25map.panZoom = null;
			document.getElementById(seasonalSVGpm25map.svgID).data= folder + "/" + newsvg + ".svg";		
	}

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
	}

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
		$(this).parent().find(".fa-hand-o-right").removeClass("fa-hand-o-right").addClass("fa-hand-o-down");
	}).on('hidden.bs.collapse', function(){
	$(this).parent().find(".fa-hand-o-down").removeClass("fa-hand-o-down").addClass("fa-hand-o-right");
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
			anchors: ['sec1','sec2','sec3','sec4','sec5','sec6','sec7','sec8','sec9','sec10','sec11','sec12','sec13','sec14','sec15','sec16','sec17','sec18','sec19','sec20','sec21','sec22','sec23','sec24','sec25'],
			navigation: true,
			navigationPosition: 'left',
			navigationTooltips:['Home','Welcome','Intro','Highlights','Air Pollution','Sources','Effects','Growth','Econ. Growth with Cleaner Air','NAAQS','NAAQS Trends','PM<sub>2.5</sub> Composition','Unhealthy AQ Days','Nonattainment','Weather','Weather Influences','Visibility','Scenic Areas','Toxics','Toxic Air Pollutants','Outlook','2025','Summary','Resources','Social Media'],
			//Design 
			responsiveWidth: 1383,
			responsiveHeight: 700,
			sectionSelector: '.secFP'
		});
	});



/* Highcharts Dark Theme customized and charts */	
	
		$(function () {
			// Load the fonts
			

			Highcharts.theme = {
			   global: {
					canvasToolsURL: 'https://code.highcharts.com/4.2.3/modules/canvas-tools.js'
					},
				lang: {
					decimalPoint: '.',
					thousandsSep: ',',
					contextButtonTitle: "Print / Download",
					viewData: '',
				},
			   colors: ["#ff0066", "#7798BF", "#FFFF00", "#90ee7e", "#f45b5b", "#aaeeee", "#3366CC", "#eeaaee",
				  "#55BF3B", "#2b908f", "#996600", "#E0E0E3", "#DF5353", "#7798BF", "#aaeeee"],
			   chart: {
				  backgroundColor: {
					 linearGradient: { x1: 0, y1: 0, x2: 1, y2: 1 },
					 stops: [
						[0, '#2a2a2b'],
						[1, '#3e3e40']
					 ]
				  },
				  style: {
					 fontFamily: "'Montserrat', 'Open Sans', sans-serif",
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
				  backgroundColor: 'rgba(62, 62, 64, 0.98)',
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
					 fontSize: '.917em'
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
			
			// Concentration Chart
			$.get('./data/highcharts/inNAAQSconcentrations19902014.csv', function(csv) {
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
						itemDistance: 10
					},
					xAxis: [{
						type: 'category',
						tickInterval: 2,
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
							color: 'white',
							label: {
								text: 'Most Recent National Standard',
								align: 'left',
								style: {
									color: '#939393',
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
						ceiling: 1200,
						tickInterval: 400,
						min: -1200,
						tickColor: 'transparent',
						gridLineColor: 'transparent',
						opposite: true,
						plotLines: [{
							value: 0,
							width: 2,
							dashStyle: 'dash',
							color: 'white',
							label: {
								text: 'Most Recent National Standard',
								align: 'left',
								style: {
									color: '#939393',
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
										symbol = '●';
										break;
									case 'diamond':
										symbol = '♦';
										break;
									case 'square':
										symbol = '■';
										break;
									case 'triangle':
										symbol = '▲';
										break;
									case 'triangle-down':
										symbol = '▼';
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
					legend: {
						itemMarginBottom: 8
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 600
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
						text: 'National Criteria Air Pollutant (CAP) Emissions'
					},
					subtitle: {
						text: document.ontouchstart === undefined ?
									'Click and drag in the chart area to zoom in' : 'Pinch in the chart area to zoom in'
					},
					legend: {

					},
					xAxis: [{
						type: 'category',
						tickInterval: 2,
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
							text: 'CAP Emissions (Excluding CO), Million Tons'
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
											symbol = '●';
											break;
										case 'diamond':
											symbol = '♦';
											break;
										case 'square':
											symbol = '■';
											break;
										case 'triangle':
											symbol = '▲';
											break;
										case 'triangle-down':
											symbol = '▼';
											break;
									}
								}
								
								else if ( this.marker && this.marker.symbol ) {
									var url = this.marker.symbol.replace(/^url\(|\)$/g, '')
									symbol = '<img src="' + url + '" alt="Marker" />';
								}
								
								return '<span style="color:' + this.series.color + '">' + symbol + ' ' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y/1000,'1', '.') + ' Ton x 10<sup>6</sup>' + ' ' + '<br/>';
								
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
					/*exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 600
					},*/
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
								return 'The National Emissions Inventory (NEI) <br>is compiled every three years with 2011 <br>being the most recent inventory at time <br>of publication. The 2014 NEI is anticipated <br>to be released in the latter part of 2016.' ;
							}
						},
						data: [{
							x: 21,
							name: '2011',
							title: 'NEI 2011',
							}],
							shape: 'squarepin',
							y: -175,
							zIndex: -1,
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
							title: '  NOx SIP Call',
							}],
							shape: 'squarepin',
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
						inverted: true
					},
					title: {
						text: '2014 Emissions by Source Category',
					},
					xAxis: {
						type: 'category'
					},
					yAxis: {
						min: 0,
						labels: {
							format: '{value}%'
						},	
						title: {
							text: 'Percentage'
						}
					},
					legend: {
  					itemDistance: 40,
						reversed: true,
						itemMarginBottom: 8,
					},
					tooltip: {
						useHTML: true,
						pointFormatter: function (){
							return '<span style="color:' + this.series.color + '">' + this.series.name + ': ' + '</span>' + Highcharts.numberFormat(this.y/1000,'1', '.') + ' Ton x 10<sup>6</sup> ' + '(' + Highcharts.numberFormat(this.percentage,'0','%') + '%)' + '<br/>';
						} ,
						shared: true,
						reversed: true,
					},
					plotOptions: {
						column: {
							stacking: 'percent'
						}
					},
					exporting: {
						scale: 2,
						sourceWidth: 800,
						sourceHeight: 500
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
					},
					title: {
						text: 'Comparison of Growth Areas and Emissions',
						x: -20 //center
					},
					subtitle: {
						text: '1970-2014',
					},
					xAxis: {
						tickInterval: 2,
						crosshair: true,
						categories: ['1970','1980', '1990','1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005',
							'2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014']
					},
					yAxis: {
						title: {
							text: 'Percent Growth / Reduction',
						},
						labels: {
							format: '{value}%'
						},
						tickInterval:50,
						max: 250,
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
						pointFormatter: function () {
							var symbol = '',
								symbolName;

							function setSymbol(symbolName) {
								switch (symbolName) {
									case 'circle':
										symbol = '●';
										break;
									case 'diamond':
										symbol = '♦';
										break;
									case 'square':
										symbol = '■';
										break;
									case 'triangle':
										symbol = '▲';
										break;
									case 'triangle-down':
										symbol = '▼';
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
							itemDistance: 30,
					},
					exporting: {
						allowHTML: true,
						scale: 1,
						sourceWidth: 800,
						sourceHeight: 550,
						chartOptions: {
							plotOptions: {
								series: {
									marker: {
										enabled: true
									}
								}
							}	
						}
					},
					series: [{
						name: 'Gross Domestic Product',
						color: Highcharts.getOptions().colors[3],
						data: [0, 36.6, 89.6, 115.5, 123.7, 133.7, 144.1, 155.5, 166, 168.6, 173.4, 181, 191.7, 201.4, 209.5, 215, 214.1, 205.4, 213.1, 218.1, 225.2, 230,
								{ 
								   marker: {
										symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAA2UExURQAAAI/rfZDufkVORmudYoDLcj4+QHi7bIXWdm2gZGKLW43ne3rAbXCqZW2jZFNsUEpZSVp5VUwvsIoAAAAKdFJOUwD///9a8f/Y/RSwhCN9AAAAg0lEQVQY02VP2xLFQATDtuiyt///2WPt9OU0DwaTRAAELlFElQsOHkHz3t1QnpxvaoUDpdG9N0I1pjGiVJLQY4t2utagNbxALJppaBScYgLqyW2cPq6AfTsQ6XbijmfBwzG9Y5GSMnmRH0maVrJkbNM8W6rq4nP2DbbeYN/on+f+3v8BVjIGQ6/QyB0AAAAASUVORK5CYII=)',
										enabled: true
								   },
								   y: 238
								}],
								   marker: {
										symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAA2UExURQAAAI/rfZDufkVORmudYoDLcj4+QHi7bIXWdm2gZGKLW43ne3rAbXCqZW2jZFNsUEpZSVp5VUwvsIoAAAAKdFJOUwD///9a8f/Y/RSwhCN9AAAAg0lEQVQY02VP2xLFQATDtuiyt///2WPt9OU0DwaTRAAELlFElQsOHkHz3t1QnpxvaoUDpdG9N0I1pjGiVJLQY4t2utagNbxALJppaBScYgLqyW2cPq6AfTsQ6XbijmfBwzG9Y5GSMnmRH0maVrJkbNM8W6rq4nP2DbbeYN/on+f+3v8BVjIGQ6/QyB0AAAAASUVORK5CYII=)' 
									}
					}, {
						name: 'Vehicle Miles Traveled',
						color: Highcharts.getOptions().colors[1],
						data: [0, 37.6, 93.2, 118.3, 123.8, 129.9, 136.8, 142.3, 147.5, 151.9, 157.3, 160.4, 167.1, 169.3, 171.5, 173.1, 168.2, 166.4, 167.3, 165.4, 167.5, 169.2, 
								{ 
								   marker: {
									   symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAAR8Wy4AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAYUExURXeYvz4+QFVjdUVKUXCOsmiBn0xUYGN5lLUIuP8AAABSSURBVAjXZY4BDsAgCANLQf3/j0chLJm7hFjOJgq7QA4DRbCF48VLEKfbByxRp6ibFKGmcEQK4kOua6/ZOm7bIzr+GjemmW9rzVdjhCLM6SMUH4CQARnCg1PMAAAAAElFTkSuQmCC)',
										enabled: true
								   },
								   y: 171.6
							   }],
								   marker: {
										symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAOCAMAAAAR8Wy4AAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAYUExURXeYvz4+QFVjdUVKUXCOsmiBn0xUYGN5lLUIuP8AAABSSURBVAjXZY4BDsAgCANLQf3/j0chLJm7hFjOJgq7QA4DRbCF48VLEKfbByxRp6ibFKGmcEQK4kOua6/ZOm7bIzr+GjemmW9rzVdjhCLM6SMUH4CQARnCg1PMAAAAAElFTkSuQmCC)' 
									}
					}, {
						name: 'Population',
						color: Highcharts.getOptions().colors[2],
						data: [0, 10.7, 21.5, 29.3, 30.7, 32.2, 34.1, 35.6, 37.6, 39, 40.5, 41.5, 42.9, 44.4, 45.4, 46.8, 48.3, 49.8, 50.7, 52.2, 53.2, 54.1, 
								{ 
								   marker: {
									   symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAOCAMAAADHVLbdAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAnUExURf//AD4+QPPzBG5uMIaGKJ+fIN3dC5KSJLq6F2JiNKurHM/PEHp6LAuZHQcAAABkSURBVAjXXYxbDgMxCANtQsir9z9vibPZSvUHmgELsJgV7ghAA0wuOD4CMR7PmifCPurP5d6w09zXRCRV+Z5xSP3T6gm1BFapzdLIkbdZZ3YG8z87brrcXg85fvm7m9zvwpz8AsxZAZcg+vPaAAAAAElFTkSuQmCC)',
									   enabled: true
								   },
								   y: 55.6
							   }],
								   marker: {
										symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAOCAMAAADHVLbdAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAnUExURf//AD4+QPPzBG5uMIaGKJ+fIN3dC5KSJLq6F2JiNKurHM/PEHp6LAuZHQcAAABkSURBVAjXXYxbDgMxCANtQsir9z9vibPZSvUHmgELsJgV7ghAA0wuOD4CMR7PmifCPurP5d6w09zXRCRV+Z5xSP3T6gm1BFapzdLIkbdZZ3YG8z87brrcXg85fvm7m9zvwpz8AsxZAZcg+vPaAAAAAElFTkSuQmCC)' 
									}
					}, {
						name: 'Energy Consumption',
						color: Highcharts.getOptions().colors[4],
						data: [0, 15.1, 24.5, 34.2, 38.6, 39.5, 40.1, 42.5, 45.7, 41.8, 43.9, 44.3, 47.5, 47.7, 46.7, 48.9, 45.8, 38.8, 43.7, 42.8, 39.3, 43.4, 
								{ 
								   marker: {
									   symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAATCAMAAABx9wfiAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAkUExURT4+QPRbW05AQnJFR4hJS9dVVqVOT5lMTehYWcZTVLJQUWBDRaBiGOsAAABmSURBVAjXZY/bEsAwBESXuIT8//82pH1oa4Y5Yy0DeMfw9NW0lDSUggGeyqXpZKRuctk9B/lmFoMFphx/ccZZxppYZM25vRAaeCqiNs2jDuJOtFzRI/Bm+fFoPvNsRPf1Umx9XsIF8NcByPrmD0MAAAAASUVORK5CYII=)',
										enabled: true
								   },
								   y: 45.1
							   }],
								   marker: {
										symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAATCAMAAABx9wfiAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAkUExURT4+QPRbW05AQnJFR4hJS9dVVqVOT5lMTehYWcZTVLJQUWBDRaBiGOsAAABmSURBVAjXZY/bEsAwBESXuIT8//82pH1oa4Y5Yy0DeMfw9NW0lDSUggGeyqXpZKRuctk9B/lmFoMFphx/ccZZxppYZM25vRAaeCqiNs2jDuJOtFzRI/Bm+fFoPvNsRPf1Umx9XsIF8NcByPrmD0MAAAAASUVORK5CYII=)' 
									}
					}, {
						name: 'CO2 Emissions',
						color: Highcharts.getOptions().colors[0],
						data: [0, 9.1, 18.4, 25.9, 30.3, 32, 33, 34.7, 38.7, 36.5, 37.4, 38.5, 41.1, 41.7, 39.9, 41.8, 37.2, 27.1, 31.8, 28.7, 23.8, 
								{ 
								   marker: {
									   symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAYUExURf8AZj4+QPMDY58fU48jUNMNXW4uSVY2RddSRskAAAAySURBVAjXY2BiYGBhhAIGIGDGx2EHKWWBcNiYWBnZWRnAHKAQKxsTmM3ABMXkASSdTAAwuQB2BI7DUwAAAABJRU5ErkJggg==)',
										enabled: true
								   },
								   y: 27.2
							   }],
									marker: {
									   symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAMAAABhq6zVAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAYUExURf8AZj4+QPMDY58fU48jUNMNXW4uSVY2RddSRskAAAAySURBVAjXY2BiYGBhhAIGIGDGx2EHKWWBcNiYWBnZWRnAHKAQKxsTmM3ABMXkASSdTAAwuQB2BI7DUwAAAABJRU5ErkJggg==)' 
								   }
					}, {
						name: 'Aggregate Emissions (Six Common Pollutants)',
						color: Highcharts.getOptions().colors[5],
						data: [0, -17.3, -33, -39.7, -42.9, -42.9, -43.9, -45.8, -47.5, -48.9, -47.6, -49.2, -50.8, -52.1, -54.3, -56.5, -60.2, -62.9, -64.5, -65.6, -67.5, -68.5, 
								{ 
								   marker: {
									   symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAtUExURT4+QKru7kRHSXOVlqjq6nqfoGF3eGmEhaLg4EJFR0hOUFZkZpPHx4Gqq4Ourx8XzFUAAABWSURBVBjTbY5REoAgCERBCRCt+x83K2YSxv18w7IPSoMYPDbAEmDiCIRW8lReIrw8neRCP/tWhFC96LOinYmk/h7TjwlHEDNFDaB1OW2jPmoIYAqUlBvtVAH1qbOrxwAAAABJRU5ErkJggg==)',
										enabled:true
								   },
								   y: -69.5
							   }],
							   marker: {
									   symbol: 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAABGdBTUEAALGPC/xhBQAAAAFzUkdCAK7OHOkAAAAtUExURT4+QKru7kRHSXOVlqjq6nqfoGF3eGmEhaLg4EJFR0hOUFZkZpPHx4Gqq4Ourx8XzFUAAABWSURBVBjTbY5REoAgCERBCRCt+x83K2YSxv18w7IPSoMYPDbAEmDiCIRW8lReIrw8neRCP/tWhFC96LOinYmk/h7TjwlHEDNFDaB1OW2jPmoIYAqUlBvtVAH1qbOrxwAAAABJRU5ErkJggg==)' 
								   }
					}]
				});
			
			
			//Weather Chart1 - Urban Ozone
			$.get('./data/highcharts/mettrends_2000_2014_urban.csv', function(csv) {
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
						tickInterval: 2,
						crosshair: true
					},
					yAxis: {
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
										symbol = '●';
										break;
									case 'diamond':
										symbol = '♦';
										break;
									case 'square':
										symbol = '■';
										break;
									case 'triangle':
										symbol = '▲';
										break;
									case 'triangle-down':
										symbol = '▼';
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
						sourceHeight: 400
					},
					credits: {
						enabled: false
					}
				});
			});
			
			//Weather Chart2 - Rural Ozone
			$.get('./data/highcharts/mettrends_2000_2014_rural.csv', function(csv) {
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
						tickInterval: 2,
						crosshair: true
					},
					yAxis: {
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
										symbol = '●';
										break;
									case 'diamond':
										symbol = '♦';
										break;
									case 'square':
										symbol = '■';
										break;
									case 'triangle':
										symbol = '▲';
										break;
									case 'triangle-down':
										symbol = '▼';
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
						sourceHeight: 400
					},
					credits: {
						enabled: false
					}
				});
			});
		});
	