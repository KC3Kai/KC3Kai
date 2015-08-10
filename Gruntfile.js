module.exports = function(grunt) {
	
	grunt.initConfig({
		clean: {
			tmp: {
				src: [ 'build/tmp/**/*', 'build/tmp/' ]
			},
			release: {
				src: [ 'build/release/**/*', 'build/release/' ]
			}
		},
		copy: {
			tmpsrc: {
				expand: true,
				cwd: 'src/',
				src: '**/*',
				dest: 'build/tmp/'
			},
			statics: {
				expand: true,
				cwd: 'build/tmp/',
				src: [
					'assets/img/**',
					'assets/snd/**',
					'assets/js/Chart.min.js',
					'assets/js/Dexie.min.js',
					'assets/js/KanColleHelpers.js',
					'assets/js/FileSaver.min.js'
				],
				dest: 'build/release/'
			},
			processed: {
				expand: true,
				cwd: 'build/tmp/',
				src: [
					'assets/css/keys.css',
					'library/helpers/*.js',
					'library/injections/*.js',
					'library/modules/*.js',
					'pages/**/*',
					'!pages/strategy/tabs/**/*.js',
					'manifest.json',
					'data/**/*.json'
				],
				dest: 'build/release/'
			}
		},
		removelogging: {
			'build/tmp': {
				src: "build/tmp/**/*.js"
			}
		},
		jshint: {
			all : {
				options: {
					newcap: false,
					laxbreak: true,
				},
				src: [
					'build/tmp/assets/js/global.js',
					'build/tmp/library/**/*.js',
					'build/tmp/pages/**/*.js'
				]
			}
		},
		cssmin: {
			all : {
				files: [{
					expand: true,
					cwd: 'build/tmp/',
					src: [
						'assets/css/global.css',
						'assets/css/keys.css',
						'pages/**/*.css'
					],
					dest: 'build/tmp/'
				}]
			}
		},
		uglify: {
			all : {
				files: [{
					expand: true,
					cwd: 'build/tmp/',
					src: [
						'assets/js/global.js',
						'library/**/*.js',
						'pages/**/*.js'
					],
					dest: 'build/tmp/'
				}]
			}
		},
		'string-replace': {
			allhtml: {
				src: 'build/tmp/pages/**/*.html',
				dest: 'build/tmp/',
				options: {
					replacements: [
						{
							pattern: /<!-- @buildimportjs (.*?) -->/ig,
							replacement: function (match, p1) {
								return "<script type=\"text/javascript\" src=\""+p1+"\"></script>";
							}
						},
						{
							pattern: /<!-- @buildimportcss (.*?) -->/ig,
							replacement: function (match, p1) {
								return "<link href=\""+p1+"\" rel=\"stylesheet\" type=\"text/css\">";
							}
						},
						{
							pattern: /<!-- @nonbuildstart -->([\s\S]*?)<!-- @nonbuildend -->/ig,
							replacement: function (match, p1) {
								return "";
							}
						}
					]
				}
			},
			devtooltitle: {
				src: 'build/tmp/pages/devtools/init.js',
				dest: 'build/tmp/',
				options: {
					replacements: [
						{
							pattern: /DevKC3Kai/ig,
							replacement: function (match, p1) {
								// return "KC3改";
								return "KanColle";
							}
						}
					]
				}
			},
			manifest: {
				src: 'build/tmp/manifest.json',
				dest: 'build/tmp/',
				options: {
					replacements: [
						{
							pattern: /KC3改 Development/ig,
							replacement: 'KanColle Command Center 改'
						},
						{
							pattern: /assets\/js\/jquery\-2\.1\.3\.min\.js/ig,
							replacement: 'assets/js/global.js'
						},
						{
							pattern: /library\/objects\/Messengers\.js/ig,
							replacement: 'library/objects.js'
						},
						{
							pattern: /library\/managers\/ConfigManager\.js/ig,
							replacement: 'library/managers.js'
						},
						{
							pattern: /assets\/img\/logo\/dev\.png/ig,
							replacement: 'assets/img/logo/19.png'
						}
					]
				}
			}
		},
		htmlmin: {
			all : {
				options: {
					removeComments: true,
					collapseWhitespace: true
				},
				files: [{
					expand: true,
					cwd: 'build/tmp/',
					src: 'pages/**/*.html',
					dest: 'build/tmp/'
				}]
			}
		},
		jsonlint: {
			all : {
				options: {
					
				},
				src: [
					'build/tmp/manifest.json',
					'build/tmp/data/**/*.json'
				]
			}
		},
		'json-minify': {
			manifest : { files: 'build/tmp/manifest.json' },
			data : { files: 'build/tmp/data/**/*.json' }
		},
		concat: {
			global_css: {
				src: [
					'build/tmp/assets/css/bootstrap.css',
					'build/tmp/assets/css/global.css'
				],
				dest: 'build/release/assets/css/global.css'
			},
			global_js: {
				src: [
					'build/tmp/assets/js/jquery-2.1.3.min.js',
					'build/tmp/assets/js/global.js'
				],
				dest: 'build/release/assets/js/global.js'
			},
			library: {
				files: {
					'build/release/library/managers.js' : ['build/tmp/library/managers/*.js'],
					'build/release/library/objects.js' : ['build/tmp/library/objects/*.js']
				}
			},
			strategy: {
				files: {
					'build/release/pages/strategy/allstrategytabs.js' : ['build/tmp/pages/strategy/tabs/*/*.js'],
				}
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
	grunt.loadNpmTasks('grunt-string-replace');
	grunt.loadNpmTasks("grunt-remove-logging");
	
	grunt.registerTask('default', [
		'clean:release',
		'copy:tmpsrc',
		'copy:statics',
		'removelogging',
		'string-replace:devtooltitle',
		'jshint',
		'cssmin',
		'uglify',
		'string-replace:allhtml',
		'htmlmin',
		'string-replace:manifest',
		'jsonlint',
		'json-minify',
		'copy:processed',
		'concat:global_css',
		'concat:global_js',
		'concat:library',
		'concat:strategy',
		'clean:tmp'
	]);
	
};