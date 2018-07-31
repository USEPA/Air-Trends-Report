module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    /*babel: {
		options: {
//			sourceMap: true,
			presets: ['es2015']
		},
		dist: {
			files: {
				'src/js/libs/plugins/backgroundVideo.js':'src/js/libs/plugins/backgroundVideo.es6'
			}
		}
	},*/
/* If you need to use babel stuff then add this to package.json and npm install. Not fun having to install that if not being used
    "babel-preset-es2015": "^6.24.1",
    "grunt-babel": "^6.0.0",
*/	
	realFavicon: {
		favicons: {
			src: 'img/epaflower.png',
			dest: 'img/icons',
			options: {
				iconsPath: '/',
				html: [ 'tmp/favicon_markups.html' ],
				design: {
					ios: {
						pictureAspect: 'backgroundAndMargin',
						backgroundColor: '#ffffff',
						margin: '14%',
						assets: {
							ios6AndPriorIcons: false,
							ios7AndLaterIcons: true,
							precomposedIcons: false,
							declareOnlyDefaultIcon: true
						}
					},
					desktopBrowser: {},
					windows: {
						pictureAspect: 'whiteSilhouette',
						backgroundColor: '#2b5797',
						onConflict: 'override',
						assets: {
							windows80Ie10Tile: false,
							windows10Ie11EdgeTiles: {
								small: false,
								medium: true,
								big: false,
								rectangle: false
							}
						}
					},
					androidChrome: {
						pictureAspect: 'noChange',
						themeColor: '#ffffff',
						manifest: {
							name: 'Air Trends',
							display: 'standalone',
							orientation: 'notSet',
							onConflict: 'override',
							declared: true
						},
						assets: {
							legacyIcon: false,
							lowResolutionIcons: false
						}
					},
					safariPinnedTab: {
						pictureAspect: 'silhouette',
						themeColor: '#1e376d'
					}
				},
				settings: {
					scalingAlgorithm: 'Mitchell',
					errorOnImageTooSmall: false
				},
				versioning: {
					paramName: 'v',
					paramValue: 'GvkW242bLb'
				}
			}
		}
	},
	
	concat: {
	  dist: {
		  options: {
			separator: ';\n',
		  },
		  files: {
			'dist/js/d3-libs.js':['src/js/libs/d3/d3.js','src/js/libs/d3/d3.slider.js','src/js/libs/d3/d3-legend.js','src/js/libs/d3/d3-albersUsaPr.js','src/js/libs/d3/topojson.js','src/js/libs/d3/d3-queue.js','src/js/libs/d3/isMobile.js','src/js/libs/d3/papaparse.js','src/js/libs/d3/download.js','src/js/libs/d3/canvg.js'],
			'dist/js/cache/etrends-libs.js':['src/js/libs/plugins/modernizr.js','src/js/libs/plugins/bootstrap.js','src/js/libs/plugins/jquery.fullPage_v2_9_4.js','src/js/libs/plugins/TweenMax.min.js','src/js/libs/plugins/ScrollMagic.js','src/js/libs/plugins/animation.gsap.js','src/js/libs/plugins/ScrollMagic.debug.addIndicators.js'],
			'dist/js/cache/etrends-custom.js':['src/js/etrends_structure.js','src/js/EtrendsUtilities.js','src/js/ClassifiedPointsMap.js','src/js/LineAreaChart.js','src/js/MapChartSlider.js','src/js/MapChartTooltip.js','src/js/MapChartResize.js','src/js/MapChartDebounce.js','src/js/StatsCalculator.js','src/js/MapChartLegend.js','src/js/MapChartTitle.js','src/js/MapChartExportMenu.js','src/js/naaqs-emissions-lead.js','src/js/naaqsMapChart.js','src/js/speciation.js','src/js/weather.js','src/js/visibility.js','src/js/toxics.js','src/js/naaqs-concentrations-averages.js','src/js/naaqs-emissions-totals.js','src/js/naaqs-emissions-categories.js','src/js/babyLegend.js','src/js/growth.js','src/js/etrends-d3-main.js'],
			'dist/js/etrends-chart.js':['src/js/EtrendsUtilities.js','src/js/LineAreaChart.js','src/js/MapChartTooltip.js','src/js/MapChartResize.js','src/js/MapChartDebounce.js','src/js/MapChartLegend.js','src/js/MapChartTitle.js','src/js/MapChartExportMenu.js']
      },
    },
	  distAll: {
        files: {
        'dist/js/etrends.js':['dist/js/cache/etrends-libs.js','dist/js/cache/etrends-custom.js'],
        'dist/js/etrends.min.js':['dist/js/cache/etrends-libs.min.js','dist/js/cache/etrends-custom.min.js']
        },
	  },
	  //distcss: {
        //src: ['src/css/**/*.css'],
        //dest: 'dist/css/<%= pkg.name %>.css'
      //},
	  distcss: {
		  src: ['src/css/bootstrap.css','src/css/A_etrends_structure.css','src/css/B_preloader.css','src/css/C_fullpage.css','src/css/D_video_backgrounds.css','src/css/E_navbar.css','src/css/F_icon-font-style.css','src/css/G_bootstrap_overrides.css','src/css/H_d3.slider.css','src/css/I_naaqsMap.css','src/css/J_naaqsChart.css','src/css/K_accessibility.css','src/css/L_print.css'],
          dest: 'dist/css/<%= pkg.name %>.css'
	  },	
    },
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n'
      },
      distCustom: {
        files: {
		  'dist/js/cache/etrends-custom.min.js':['dist/js/cache/etrends-custom.js'],
		  }
      },
      distLibs: {
        files: {
		  'dist/js/d3-libs.min.js':['dist/js/d3-libs.js'],
		  'dist/js/cache/etrends-libs.min.js':['dist/js/cache/etrends-libs.js'],
		  'dist/js/etrends-chart.min.js':['dist/js/etrends-chart.js'],
		  'dist/js/cache/d3-libs-noncore.min.js':['dist/js/cache/d3-libs-noncore.js'],
		  }
      }
    },
	cssmin: {
	  target: {
		files: [{
		  expand: true,
		  cwd: 'dist/css',
		  src: ['*.css', '!*.min.css'],
		  dest: 'dist/css',
		  ext: '.min.css'
		}]
	  }
	},
	csslint: {
	  options:{
		  csslintrc: '.csslintrc'
	  },
	  strict: {
		src: ['src/css/**/*.css']
	  },
	  lax: {
		src: ['src/css/**/*.css']
	  }
	},
	clean: {
		tempfiles: ['dist/js/cache/etrends-custom.js','dist/js/cache/etrends-custom.min.js'] //The custom will always be recrated whether if they do default or all
	},
  watch: {
    all :
    {
      files: ['src/js/*.js' ,'src/css/*.css'],
      tasks: ['default']
    }
  },  
  file_append: {
    default_options: {
      files: [
        {
          append: '//# sourceURL=d3-libs.js',
          input: 'dist/js/d3-libs.js'
        },
        {
          append: '//# sourceURL=d3-libs.min.js',
          input: 'dist/js/d3-libs.min.js'
        },
        {
          append: '//# sourceURL=etrends.js',
          input: 'dist/js/etrends.js'
        },
        {
          append: '//# sourceURL=etrends.min.js',
          input: 'dist/js/etrends.min.js'
        },
        {
          append: '//# sourceURL=etrends-libs.js',
          input: 'dist/js/cache/etrends-libs.js'
        }
      ]
    }
  }
  
  
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-file-append');
//  grunt.loadNpmTasks('grunt-babel');
//  grunt.loadNpmTasks('babel-preset-es2015');
  grunt.loadNpmTasks('grunt-real-favicon');
  
	
  grunt.registerTask('default', ['concat:dist','uglify:distCustom','concat:distAll','concat:distcss','cssmin','csslint','clean:tempfiles','file_append']);
//This minifieds libs too that you don't want to do all the time when developing custom code
  grunt.registerTask('all', ['concat:dist','uglify','concat:distAll','concat:distcss','cssmin','csslint','clean:tempfiles','file_append']);
//To run babel just do grunt babel. Before I registered like grunt.registerTask('babel',['babel']) and that was causing infinite loop because babel already registered
};