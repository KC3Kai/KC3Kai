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
					'assets/swf/**',
					'assets/js/Chart.min.js',
					'assets/js/Dexie.min.js',
					'assets/js/FileSaver.min.js',
					'assets/js/steganography.js',
					'assets/js/jquery-ui.min.js',
					'assets/js/KanColleHelpers.js',
					'assets/js/twbsPagination.min.js',
					'assets/js/WhoCallsTheFleetShipDb.json',
					'assets/js/jszip.min.js',
					'assets/js/bootstrap-slider.min.js',
					'assets/js/no_ga.js'
				],
				dest: 'build/release/'
			},
			processed: {
				expand: true,
				cwd: 'build/tmp/',
				src: [
					'assets/css/keys.css',
					'assets/css/bootstrap-slider.min.css',
					'library/helpers/*.js',
					'library/injections/*.js',
					'library/modules/*.js',
					'pages/**/*',
					'!pages/strategy/tabs/**/*.js',
					'manifest.json',
					'data/*.json',
					'data/lang/data/**/*.json'
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
			build : {
				options: {
					jshintrc: true
				},
				src: [
					'build/tmp/assets/js/global.js',
					'build/tmp/library/**/*.js',
					'build/tmp/pages/**/*.js'
				]
			},
			src : {
				options: {
					jshintrc: true
				},
				src: [
					'src/assets/js/global.js',
					'src/library/**/*.js',
					'src/pages/**/*.js'
				]
			},
			test : {
				options: {
					jshintrc: true
				},
				src: [
					'tests/library/**/*.js',
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
						'assets/css/bootstrap-slider.min.css',
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
			buildobjects: {
				src: 'build/tmp/manifest.json',
				dest: 'build/tmp/',
				options: {
					replacements: [
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
			build : {
				options: {
					format: true
				},
				src: [
					'build/tmp/manifest.json',
					'build/tmp/data/*.json',
					'build/tmp/data/lang/data/**/*.json'
				]
			},
			src :{
				options: {

				},
				src: [
					'src/manifest.json',
					'src/data/*.json',
					'src/data/lang/data/**/*.json'
				]
			}
		},
		'json-minify': {
			manifest : { files: 'build/tmp/manifest.json' },
			data1 : { files: 'build/tmp/data/*.json' },
			data2 : { files: 'build/tmp/data/lang/data/**/*.json' }
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
		},
		qunit: {
			all: [
				'tests/**/*.html'
			]
		},
		compress: {
			release: {
				options: {
					archive: 'build/release.zip',
					pretty: true
				},
				expand: true,
				cwd: 'build/',
				src: [ 'release/**/*' ],
				dest: './'
			}
		},
		webstore_upload: {
			"accounts": {
				"dragonjet": {
					publish: true,
					client_id: process.env.WEBSTORE_CLIENT_ID,
					client_secret: process.env.WEBSTORE_CLIENT_SECRET,
					refresh_token: process.env.WEBSTORE_REFRESH_TOKEN
				}
			},
			"extensions": {
				"kc3kai": {
					account: "dragonjet",
					publish: true, 
					appID: "hkgmldnainaglpjngpajnnjfhpdjkohh",
					zip: "build/release.zip"      
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
	grunt.loadNpmTasks("grunt-contrib-qunit");
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-webstore-upload');
	
	grunt.registerTask('local', [
		'clean:tmp',
		'clean:release',
		'copy:tmpsrc',
		'copy:statics',
		'jshint:build',
		'cssmin',
		'string-replace:allhtml',
		'htmlmin',
		'string-replace:buildobjects',
		'jsonlint:build',
		'json-minify',
		'copy:processed',
		'concat:global_css',
		'concat:global_js',
		'concat:library',
		'concat:strategy',
		'clean:tmp'
	]);
	
	grunt.registerTask('build', [
		'clean:tmp',
		'clean:release',
		'copy:tmpsrc',
		'copy:statics',
		'removelogging',
		'string-replace:devtooltitle',
		'jshint:build',
		'cssmin',
		'uglify',
		'string-replace:allhtml',
		'htmlmin',
		'string-replace:buildobjects',
		'string-replace:manifest',
		'jsonlint:build',
		'json-minify',
		'copy:processed',
		'concat:global_css',
		'concat:global_js',
		'concat:library',
		'concat:strategy'
	]);
	
	grunt.registerTask('test-src', [
		'jshint:src',
		'jshint:test',
		'jsonlint:src'
	]);
	
	grunt.registerTask('test-unit', [
		'qunit'
	]);
	
	grunt.registerTask('webstore', [
		'compress:release',
		'webstore_upload:kc3kai'
	]);
	
};
