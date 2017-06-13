module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
	  dist: {
		  options: {
			separator: ';\n',
		  },
		  files: {
			'dist/js/cache/d3-libs-noncore.js':['src/js/libs/d3/d3.slider.js','src/js/libs/d3/d3-legend.js','src/js/libs/d3/d3-albersUsaPr.js','src/js/libs/d3/topojson.js','src/js/libs/d3/d3-queue.js','src/js/libs/d3/isMobile.js'],
			'dist/js/cache/etrends-libs.js':['src/js/libs/plugins/jquery.fullPage.js','src/js/libs/plugins/jquery.easing.js','src/js/libs/plugins/grayscale.js','src/js/libs/plugins/wow.min.js','src/js/svg-pan-zoom_az.js','src/js/libs/plugins/hammer.js','src/js/libs/plugins/highstock.js','src/js/libs/plugins/data.js','src/js/libs/plugins/exporting.js','src/js/libs/plugins/export-csv.js'],
			'dist/js/cache/etrends-custom.js':['src/js/etrends_custom.js','src/js/ClassifiedPointsMap.js','src/js/LineAreaChart.js','src/js/MapChartSlider.js','src/js/MapChartTooltip.js','src/js/MapChartResize.js','src/js/naaqsMapChart.js']
      },		
    },
	  distAll: {
        files: {
        'dist/js/d3-libs.js':['src/js/libs/d3/d3.min.js','dist/js/cache/d3-libs-noncore.js'],
        'dist/js/d3-libs.min.js':['src/js/libs/d3/d3.min.js','dist/js/cache/d3-libs-noncore.min.js'],
        'dist/js/etrends.js':['dist/js/cache/etrends-libs.js','dist/js/cache/etrends-custom.js'],
        'dist/js/etrends.min.js':['dist/js/cache/etrends-libs.min.js','dist/js/cache/etrends-custom.min.js']
        },
	  },
	  distcss: {
        src: ['src/css/**/*.css'],
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
		  'dist/js/cache/etrends-libs.min.js':['dist/js/cache/etrends-libs.js'],
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
  }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-csslint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
	
  grunt.registerTask('default', ['concat:dist','uglify:distCustom','concat:distAll','concat:distcss','cssmin','csslint','clean:tempfiles']);
//This minifieds libs too that you don't want to do all the time when developing custom code
  grunt.registerTask('all', ['concat:dist','uglify','concat:distAll','concat:distcss','cssmin','csslint','clean:tempfiles']);

};