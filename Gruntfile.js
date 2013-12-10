module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    
    less: {
    	options: {
	        banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
	      },
	  production: {
	    options: {
	      paths: ["public/css"],
	      yuicompress: true
	    },
	    files: {
	       "public/css/core.css": "public/less/core.less"
	    }
	  }
	},
	watch: {
		scripts: {
			files: ['**/*.less'],
			tasks: ['less'],
			options: {
				spawn: false,
			},
		},
	},
	
	
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-less');

  //keep an eye on stuff to change
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['less']);

};