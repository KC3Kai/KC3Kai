module.exports = function(grunt) {
	
	grunt.initConfig({
		jshint: {
			options: {
				newcap: false,
				laxbreak: true,
			},
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
					'data/**/*.json',
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
			library: {
				files: {
					'build/lib_actors.js' : ['src/library/actors/*.js'],
					'build/lib_models.js' : ['src/library/models/*.js'],
					'build/lib_utils.js' : ['src/library/utils/*.js']
				}
			},
			views: {
				files: {
					'build/view_dashboard.js' : [
						'src/library/views/Dashboard.Fleet.js',
						'src/library/views/Dashboard.Info.js',
						'src/library/views/Dashboard.Timers.js',
					]
				}
			},
		},
		cssmin: {
			global_css: {
				src: 'build/globals.css',
				dest: 'build/release/assets/css/globals.css',
			},
			pages: {
				expand: true,
				cwd: 'src/',
				src: ['pages/**/*.css'],
				dest: 'build/release/',
			}
		},
		uglify: {
			global_js: {
				src: 'src/assets/js/global.js',
				dest: 'build/globals.js'
			},
			library: {
				files: {
					'build/release/library/background.js' : 'src/library/background.js',
					'build/release/library/cookie.js' : 'src/library/cookie.js',
					'build/release/library/osapi.js' : 'src/library/osapi.js',
					'build/release/library/actors.js' : 'build/lib_actors.js',
					'build/release/library/models.js' : 'build/lib_models.js',
					'build/release/library/utils.js' : 'build/lib_utils.js',
				}
			},
			views: {
				files: {
					'build/release/assets/js/view.dashboard.js' : 'build/view_dashboard.js',
				}
			},
			pages: {
				expand: true,
				cwd: 'src/',
				src: ['pages/**/*.js'],
				dest: 'build/release/',
			}
		},
		useminPrepare: {
			html: 'src/pages/popup/popup.html',
			options: {
				flow: { steps: { js: [], css: [] }, post: {} }
			}
		},
		usemin: {
			html: 'src/pages/popup/popup.html',
			options: {
				dest: 'build/release'
			}
		},
		htmlmin: {
			pages: {
				expand: true,
				cwd: 'src/',
				src: ['pages/**/*.html'],
				dest: 'build/release/',
				options: {
					removeComments: true,
					collapseWhitespace: true
				},
			}
		},
		'json-minify': {
			data: {
				files: 'build/release/data/*.json'
			}
		},
		jsonlint: {
			data: {
				src: 'build/release/data/**/*.json'
			}
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
		// 'useminPrepare',
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
		'htmlmin:pages',
		'cssmin:pages',
		'uglify:pages',
		'json-minify:data',
		'jsonlint:data',
		// 'usemin'
	]);
	
};