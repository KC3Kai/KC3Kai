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
					'assets/snd/**',
					'data/**/*.json',
				],
				dest: 'build/release/'
			}
		},
		concat: {
			global_css: {
				src: [
					'src/assets/css/bootstrap.css',
					'build/tmp/global.css',
				],
				dest: 'build/release/assets/css/global.css'
			},
			global_js: {
				src: [
					'src/assets/js/jquery-2.1.3.min.js',
					'build/tmp/globals.js'
				],
				dest: 'build/release/assets/js/globals.js'
			},
			library: {
				files: {
					'build/tmp/managers.js' : ['src/library/managers/*.js'],
					'build/tmp/objects.js' : ['src/library/objects/*.js']
				}
			}
		},
		cssmin: {
			global_css: {
				src: 'src/assets/css/global.css',
				dest: 'build/tmp/global.css',
			},
			keys_css : {
				src: 'src/assets/css/keys.css',
				dest: 'build/release/assets/css/keys.css'
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
				dest: 'build/tmp/globals.js'
			},
			library1: {
				expand: true,
				cwd: 'src/',
				src: [
					'library/injections/*.js',
					'library/modules/*.js',
					'library/helpers/*.js'
				],
				dest: 'build/release/',
			},
			library2: {
				files: {
					'build/release/library/managers.js' : 'build/tmp/managers.js',
					'build/release/library/objects.js' : 'build/tmp/objects.js'
				}
			},
			pages: {
				expand: true,
				cwd: 'src/',
				src: ['pages/**/*.js'],
				dest: 'build/release/',
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
			manifest: {
				src: 'build/release/manifest.json'
			},
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
		'jshint',
		'clean:build',
		'copy:statics',
		'cssmin:global_css',
		'cssmin:keys_css',
		'concat:global_css',
		'uglify:global_js',
		'concat:global_js',
		'concat:library',
		'uglify:library1',
		'uglify:library2',
		'htmlmin:pages',
		'cssmin:pages',
		'uglify:pages',
		'json-minify:data',
		'jsonlint:data',
		'jsonlint:manifest'
	]);
	
};