module.exports = function(grunt) {
	
	grunt.initConfig({
		jshint: {
			all: [
				'src/assets/js/global.js',
				'src/library/**/*.js',
				'src/pages/**/*.js'
			]
		},
		clean: {
			build: {
				src: ['build']
			}
		},
		copy: {
			statics: {
				expand: true,
				cwd: 'src/',
				src: [
					'manifest.json',
					'assets/img/**',
					'assets/js/Chart.min.js',
					'assets/js/Dexie.min.js',
				],
				dest: 'build/release/'
			}
		},
		concat: {
			global_css: {
				src: 'src/assets/css/*.css',
				dest: 'build/globals.css'
			},
			global_js: {
				src: ['src/assets/js/jquery-2.1.3.min.js', 'build/globals.js'],
				dest: 'build/release/assets/js/globals.js'
			},
			library: [
				{ src: 'src/library/actors/*.js', dest: 'build/lib_actors.js' },
				{ src: 'src/library/models/*.js', dest: 'build/lib_models.js' },
				{ src: 'src/library/utils/*.js', dest: 'build/lib_utils.js' }
			],
			views: [
				{
					src: [
						'src/library/views/Dashboard.Fleet.js',
						'src/library/views/Dashboard.Info.js',
						'src/library/views/Dashboard.Timers.js',
					],
					dest: 'build/view_dashboard.js'
				}
			],
		},
		cssmin: {
			global_css: {
				src: 'build/globals.css',
				dest: 'build/release/assets/css/globals.css',
			}
		},
		uglify: {
			global_js: {
				src: 'src/assets/js/global.js',
				dest: 'build/globals.js'
			},
			library: [
				{ src: 'build/lib_actors.js', dest: 'build/release/assets/js/actors.js' },
				{ src: 'build/lib_models.js', dest: 'build/release/assets/js/models.js' },
				{ src: 'build/lib_utils.js', dest: 'build/release/assets/js/utils.js' }
			],
			views: [
				{ src: 'build/view_dashboard.js', dest: 'build/release/assets/js/view.dashboard.js' },
			],
		},
		htmlmin: {
			
		}
	});
	
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-json-minify');
	grunt.loadNpmTasks('grunt-jsonlint');
	grunt.loadNpmTasks('grunt-usemin');
	
	grunt.registerTask('default', [
		'jshint',
		'clean:build',
		'copy:statics',
		'concat:global_css',
		'cssmin:global_css',
		'uglify:global_js',
		'concat:global_js',
		'concat:library',
		'uglify:library',
		'concat:views',
		'uglify:views',
	]);
	
};