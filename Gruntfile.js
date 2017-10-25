module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		clean: {
			tmp: {
				src: [ 'build/tmp/**/*', 'build/tmp/' ]
			},
			battlePrediction: {
				src: ['build/release/library/modules/BattlePrediction/']
			},
			release: {
				src: [ 'build/release/**/*', 'build/release/' ]
			},
			testenv: {
				src: [ 'build/testenv/**/*', 'build/testenv/' ]
			}
		},
		copy: {
			tmpsrc: {
				expand: true,
				cwd: 'src/',
				src: '**/*',
				dest: 'build/tmp/'
			},
			testenv: {
				expand: true,
				src: [
					// some tests would load from the following 2 paths:
					'node_modules/babel-polyfill/dist/polyfill.min.js',
					'node_modules/qunitjs/**/*',
					'node_modules/jquery/**/*',

					'src/**/*',
					'!src/data/lang/node_modules/**/*',
					'tests/**/*'
				],
				dest: 'build/testenv/'
			},
			statics: {
				expand: true,
				cwd: 'build/tmp/',
				src: [
					'assets/img/**',
					'!assets/img/useitems/pay*',
					'!assets/img/shipseasonal/**',
					'assets/snd/**',
					'assets/swf/**',
					'assets/js/Chart.min.js',
					'assets/js/Dexie.min.js',
					'assets/js/FileSaver.min.js',
					'assets/js/steganography.js',
					'assets/js/jquery-ui.min.js',
					'assets/js/KanColleHelpers.js',
					'assets/js/twbsPagination.min.js',
					'assets/js/jszip.min.js',
					'assets/js/bootstrap-slider.min.js',
					'assets/js/no_ga.js',
					'assets/js/markdown.min.js'
				],
				dest: 'build/release/'
			},
			seasonal: {
				expand: true,
				cwd: 'build/tmp/assets/img/shipseasonal/',
				src: '*.png',
				dest: 'build/release/assets/img/shipseasonal/',
				filter: function(file) {
					var id = file.match(/^.*\/(\d+).png$/);
					if(!id || !id[1]) return false;
					id = Number(id[1]);
					var idArr = grunt.file.readJSON('src/data/seasonal_icons.json') || [];
					return idArr.indexOf(id) > -1;
				}
			},
			processed: {
				expand: true,
				cwd: 'build/tmp/',
				src: [
					'assets/css/keys.css',
					'assets/css/jquery-ui.min.css',
					'assets/css/bootstrap-slider.min.css',
					'library/helpers/*.js',
					'library/injections/*.js',
					'library/injections/*.css',
					'library/modules/**/*.js',
					'library/workers/*.js',
					'pages/**/*',
					'!pages/devtools/themes/default/**',
					'!pages/strategy/tabs/**/*.js',
					'!pages/strategy/tabs/_tpl/**',
					'manifest.json',
					'data/*.json',
					'data/*.nedb',
					'data/lang/data/**/*.json'
				],
				dest: 'build/release/'
			}
		},
		removelogging: {
			console: {
				expand: true,
				cwd: 'build/tmp',
				src: [
					'**/*.js',
					'!data/lang/**',
					'!assets/js/*',
					'!library/helpers/KanColleHelpers.js',
					'assets/js/global.js'
				],
				options: {
					// keep all 'warn' and 'error' by default
					methods: [
						'log', 'info', 'assert', 'count', 'clear',
						'group', 'groupEnd', 'groupCollapsed', 'trace',
						'debug', 'dir', 'dirxml', 'profile', 'profileEnd',
						'time', 'timeEnd', 'timeStamp', 'table', 'exception'
					]
				}
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
				options: {
					mangle: {
						except: ['window', 'this']
					}
				},
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
			seasonalicons: {
				src: 'build/tmp/data/seasonal_icons.json',
				dest: 'build/tmp/',
				options: {
					replacements: [
						{
							pattern: /^.*$/g,
							replacement: '[]'
						}
					]
				}
			}
		},
		modify_json: {
			manifest_info: {
				options: {
					fields: {
						"name": "KanColle Command Center 改",
						"browser_action": {
							"default_icon": "assets/img/logo/19.png",
							"default_popup": "pages/popup/popup.html"
						}
					}
				},
				files: {
					'build/tmp/manifest.json': ['build/tmp/manifest.json'],
				}
			},
			manifest_scripts: {
				options: {
					fields: {
						"background": {
							"scripts": [
								"assets/js/global.js",
								"assets/js/Dexie.min.js",
								"library/objects.js",
								"library/managers.js",
								"library/modules/ChromeSync.js",
								"library/modules/QuestSync/Sync.js",
								"library/modules/QuestSync/Background.js",
								"library/modules/Database.js",
								"library/modules/Log/Log.js",
								"library/modules/Log/Background.js",
								"library/modules/ImageExport.js",
								"library/modules/Master.js",
								"library/modules/RemodelDb.js",
								"library/modules/Meta.js",
								"library/modules/Translation.js",
								"library/modules/Service.js"
							]
						},
						"content_scripts": [
							{
								"matches": ["*://*.dmm.com/*"],
								"js": ["library/injections/cookie.js"],
								"run_at": "document_end",
								"all_frames": true
							},
							{
								"matches": ["*://www.dmm.com/netgame/*/app_id=854854*"],
								"css": [
									"library/injections/dmm.css"
								],
								"js": [
									"assets/js/global.js",
									"library/objects.js",
									"library/managers.js",
									"library/modules/Log/Log.js",
									"library/modules/Log/Messaging.js",
									"library/modules/Log/ContentScript.js",
									"library/modules/ChromeSync.js",
									"library/modules/QuestSync/Sync.js",
									"library/modules/QuestSync/ContentScript.js",
									"library/modules/Master.js",
									"library/modules/Meta.js",
									"library/modules/RemodelDb.js",
									"library/modules/Translation.js",
									"library/injections/dmm_takeover.js",
									"library/injections/dmm.js"
								],
								"run_at": "document_end",
								"all_frames": true
							},
							{
								"matches": ["*://osapi.dmm.com/gadgets/*aid=854854*"],
								"js": [
									"assets/js/global.js",
									"library/objects.js",
									"library/injections/osapi.js"
								],
								"run_at": "document_end",
								"all_frames": true
							}
						],
					}
				},
				files: {
					'build/tmp/manifest.json': ['build/tmp/manifest.json'],
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
					'build/tmp/assets/js/jquery.min.js',
					'build/tmp/assets/js/global.js'
				],
				dest: 'build/release/assets/js/global.js'
			},
			battlePrediction: {
				src: [
					'build/tmp/library/modules/BattlePrediction/BattlePrediction.js',
					'build/tmp/library/modules/BattlePrediction/**/*.js'
				],
				dest: 'build/release/library/modules/BattlePrediction.js',
			},
			battlePredictionDev: {
				src: [
					'src/library/modules/BattlePrediction/BattlePrediction.js',
					'src/library/modules/BattlePrediction/**/*.js',
				],
				dest: 'src/library/modules/BattlePrediction.js',
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
			},
		},
		qunit: {
			all: [
				'build/testenv/tests/**/*.html'
			]
		},
		compress: {
			release: {
				options: {
					archive: 'build/release.zip',
					pretty: true
				},
				expand: true,
				cwd: 'build/release/',
				src: [ '**/*' ],
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
		},
		// currently use just for running tests
		babel: {
			options: {
				sourceMap: true,
				presets: ['babel-preset-es2015']
			},
			testenv: {
				files: [
					{  
						expand: true,
						cwd: 'build/testenv/',
						// for now only transpile code in "library" & "pages" (whitelist)
						// avoiding stepping into "assets" and "data".
						// same reason for "tests/library".
						src: [ "src/library/**/*.js",
							   "src/pages/**/*.js",
							   "tests/library/**/*.js",
							   "tests/pages/**/*.js"
							 ],
						dest: 'build/testenv/'
					}
				]
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
	grunt.loadNpmTasks('grunt-modify-json');
	
	grunt.registerTask('local', [
		'clean:tmp',
		'clean:release',
		'copy:tmpsrc',
		'copy:statics',
		'jshint:build',
		'cssmin',
		'string-replace:allhtml',
		'htmlmin',
		'modify_json:manifest_scripts',
		'jsonlint:build',
		'json-minify',
		'copy:processed',
		'concat:global_css',
		'concat:global_js',
		'concat:battlePrediction',
		'concat:library',
		'concat:strategy',
		'clean:tmp',
		'clean:battlePrediction',
	]);
	
	grunt.registerTask('build', [
		'clean:tmp',
		'clean:release',
		'copy:tmpsrc',
		'copy:statics',
		'copy:seasonal',
		'removelogging',
		'string-replace:devtooltitle',
		'jshint:build',
		'cssmin',
		'uglify',
		'string-replace:allhtml',
		'htmlmin',
		'modify_json:manifest_scripts',
		'modify_json:manifest_info',
		'jsonlint:build',
		'json-minify',
		'copy:processed',
		'concat:global_css',
		'concat:global_js',
		'concat:battlePrediction',
		'concat:library',
		'concat:strategy',
		'clean:battlePrediction'
	]);
	
	grunt.registerTask('test-src', [
		'jshint:src',
		'jshint:test',
		'jsonlint:src'
	]);
	
	grunt.registerTask('test-unit', [
		'clean:testenv',
		'copy:testenv',
		'babel:testenv',
		'qunit'
	]);
	
	grunt.registerTask('webstore', [
		'compress:release',
		'webstore_upload:kc3kai'
	]);
	
};
