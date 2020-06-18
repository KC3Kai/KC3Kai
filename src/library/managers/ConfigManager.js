/* ConfigManager.js

KC3改 Configuration Manager

Stores KC3改 Settings on localStorage for persistence
Retrieves when needed to apply on components
*/
(function(){
	"use strict";
	
	const CONFIG_KEY_NAME = "config";
	
	window.ConfigManager = {
		
		// Default values. As a function to not include on JSON string
		defaults : function(){
			return {
				version              : 8,
				language             : this.detectBrowserLanguage(),
				hqInfoPage           : 1,
				elosFormula          : 2,
				aaFormation          : 1,
				imaginaryEnemyType   : 0,
				imaginaryEnemyArmor  : 0,
				imaginaryEnemySlot   : 96,
				hqExpDetail          : 1,
				rankPtsMode          : 1,
				timerDisplayType     : 1,
				checkLiveQuests      : true,
				devOnlyPages         : false,
				forceDMMLogin        : false,
				apiRecorder          : false,
				updateNotification   : 2,
				dataSyncNotification : false,
				chromeSyncQuests     : false,
				backupReminder       : 0,
				air_formula          : 3,
				air_combined         : false,
				powerCapApplyLevel   : 3,
				powerCritical        : false,

				showCatBombs         : true,
				showApiError         : true,
				repeatApiError       : true,
				detailedApiError     : true,

				PoiDBSubmission_enabled : false,
				KC3DBSubmission_enabled : false,
				OpenDBSubmission_enabled : false,
				TsunDBSubmission_enabled : false,
				TsunDBSubmissionExtra_enabled : false,
				PushAlerts_enabled   : 0,
				PushAlerts_key       : '',

				info_quest_activity  : true,
				info_face            : true,
				info_drop            : true,
				info_craft           : true,
				info_compass         : true,
				info_prevencounters  : true,
				info_battle          : true,
				info_btrank          : true,
				info_btmvp           : true,
				info_btstamp         : false,
				info_fleetstat       : true,
				info_blink_gauge     : false,
				info_boss            : false,
				info_delta           : false,
				info_auto_exped_tab  : true,
				info_auto_fleet_view : true,
				info_pvp_info        : true,
				info_stats_diff      : 3,
				info_eng_stype       : false,
				info_force_ship_lang : "",
				info_ship_class_name : false,
				info_dex_owned_ship  : true,
				info_chuuha_icon     : true,
				info_seasonal_icon   : false,
				info_items_iconset   : 0,
				info_stats_iconset   : 0,
				info_format_numbers  : false,
				info_salt            : false,
				info_troll           : false,

				salt_list : new KC3ShipMasterList(),
				wish_list : new KC3ShipMasterList(),
				lock_list : new KC3ShipRosterList(),
				lock_prep : [],

				ss_mode      : 0,
				ss_type      : 'PNG',
				ss_quality   : 90,
				ss_directory : 'KanColle',
				ss_dppx      : 1,
				ss_smooth    : true,

				alert_diff         : 59,
				alert_morale_notif : true,
				alert_morale_value : 40,
				alert_type         : 1,
				alert_custom       : "",
				alert_type_exped   : 1,
				alert_custom_exped : "",
				alert_type_repair  : 1,
				alert_custom_repair: "",
				alert_type_cship   : 1,
				alert_custom_cship : "",
				alert_volume       : 60,
				alert_desktop      : true,
				alert_focustab     : false,
				alert_supply       : 3,
				alert_supply_exped : true,
				alert_idle_counter : 1,
				alert_idle_start   : 0,
				alert_rsc_cap      : 95,

				alert_taiha          : false,
				alert_taiha_blur     : false,
				alert_taiha_blood    : false,
				alert_taiha_ss       : false,
				alert_taiha_sound    : false,
				alert_taiha_sound_src: "",
				alert_taiha_panel    : true,
				alert_taiha_homeport : false,
				alert_taiha_damecon  : false,
				alert_taiha_unlock   : false,
				alert_taiha_noanim   : false,

				api_translation   : true,
				api_tracking      : true,
				api_mustPanel     : true,
				api_askExit       : true,
				api_directRefresh : false,
				api_margin        : 0,
				api_bg_color      : "#def",
				api_bg_image      : "",
				api_bg_size       : "cover",
				api_bg_position   : "top center",
				api_gameScale     : 100,
				api_subtitles     : true,
				subtitle_font     : '"Trebuchet MS","Lucida Grande","Lucida Sans Unicode","Lucida Sans",Tahoma,sans-serif',
				subtitle_size     : 32,
				subtitle_bold     : false,
				subtitle_display  : "ghost",
				subtitle_speaker  : false,
				subtitle_hourly   : true,
				subtitle_duration : false,
				google_translate  : true,
				map_markers       : true,
				map_letters       : false,
				mute_game_tab     : false,
				focus_game_tab    : false,
				fix_game_code     : false,
				dmm_forcecookies  : false,
				dmm_customize     : false,
				dmm_custom_css    : "",

				pan_theme       : "natsuiro",
				pan_size        : "big",
				pan_gear_holder : "black",
				pan_bg_color    : "#def",
				pan_bg_image    : "",
				pan_bg_size     : "cover",
				pan_bg_position : "top center",
				pan_opacity     : 100,
				pan_box_bcolor  : "rgba(100, 100, 100, 0.618)",
				pan_box_bcolor_moon  : "rgba(25, 50, 100, 0.2)",
				pan_shiplist_bg : "rgba(100, 100, 100, 0)",
				pan_shiplist_bg_moon : "rgba(25, 50, 100, 0.2)",
				pan_misc_bg_moon  : "rgba(25, 50, 100, 0.2)",
				pan_drop_shadow : "rgba(65, 0, 103, 0)",
				pan_drop_shadow_moon : "rgba(24, 45, 85, 1)",
				pan_ship_icon_bg: "rgba(0, 114, 207, 1)",
				pan_ship_icon_bg_moon: "rgba(0, 42, 134, 0)",
				pan_ship_icon_border: "rgba(34, 65, 105, 1)",
				pan_ship_icon_border_moon: "rgba(34, 65, 105, 0)",
				pan_outline_moon: "rgba(0, 130, 130, 0.5)",
				pan_outline_bright_moon: "rgba(0, 190, 190, 0.5)",
				moon_small_font: false,
				moon_lighting_effect: true,
				pan_moon_element_shape: "shape_round",
				pan_moon_bar_style: "fluid",
				pan_moon_bar_shape: "shape_round",
				pan_moon_bar_colors: "clrdim",
				pan_moon_conbut_shape: "shape_round",
				pan_moon_conbut_skew: true,
				pan_custom_css  : "",
				pan_custom_css_moon  : "",

				pan_layout           : 1,
				RotationPage         : 1,
				Rotation2Page        : 4,

				pan_reloadreminder_start  : 120,
				pan_reloadreminder_repeat : 0,
				pan_pvp_friends : "",

				dismissed_hints        : {},
				sr_theme               : "legacy",
				sr_show_non_battle     : true,
				sr_show_new_shipstate  : true,
				sr_custom_css          : "",

				idbSaveSortie          : true,
				idbSaveExcludeMaps     : [],
				idbSavePvP             : true,
				idbSaveLedgers         : true,

				disableConsoleLogHooks : false,
				forwardConsoleOutput   : false,
				hoursToKeepLogs        : 12,
				hoursToKeepErrors      : 168,
			};
		},
		
		keyName : function(){
			return CONFIG_KEY_NAME;
		},
		
		// Reset value of a specific key to the current default value
		resetValueOf : function(key){
			ConfigManager.loadIfNecessary();
			this[key] = this.defaults()[key];
			console.log("Reset config key", key, "to default:", JSON.stringify(this[key]) );
			this.save();
		},
		
		// Reset to default values
		clear : function(){
			$.extend(this, this.defaults());
			console.log("Reset all configs to default");
			this.save();
		},

		// Load previously saved config
		load : function(){
			var self = this;
			// Get old config or create dummy if none
			var oldConfig = JSON.parse(localStorage[CONFIG_KEY_NAME] || "{}");
			
			['salt','wish','lock'].forEach(function(shipListType){
				var k = [shipListType,'list'].join('_');
				oldConfig[k] = self.defaults()[k].concat(oldConfig[k] || []);
			});
			
			// Check if old config has versioning and if its lower version
			if( !oldConfig.version || (oldConfig.version < this.defaults().version) ){
				// Old config is an old version, clear it, set defaults, and save on storage
				localStorage.removeItem(CONFIG_KEY_NAME);
				$.extend(this, this.defaults());
				this.save();
			}else{
				// Merge defaults, then old config values to ConfigManager
				$.extend(this, this.defaults(), oldConfig);
			}
			
			/* Force Revert */
			if(this.language == "troll")
				this.resetValueOf('language');
		},
		
		loadIfNecessary : function(){
			var currentConfig = JSON.stringify(this);
			if(currentConfig !== localStorage[CONFIG_KEY_NAME]){
				this.load();
			}
		},
		
		// Save current config onto localStorage
		save : function(){
			localStorage[CONFIG_KEY_NAME] = JSON.stringify(this);
		},
		
		isNotToSaveSortie : function(world, map){
			const mapId = Number([world, map].join('')) || "ShouldNotMatch";
			return !this.idbSaveSortie ||
				(Array.isArray(this.idbSaveExcludeMaps) &&
				this.idbSaveExcludeMaps.indexOf(mapId) > -1);
		},
		
		// Return the corresponding language code supported by now, see Translation.js#getLocale
		detectBrowserLanguage : function(browserLangTag){
			// Dummy for environment without `navigator` and `chrome.i18n` api
			var i18n = navigator || {};
			// Prefer the topmost language in browser settings
			var lang = browserLangTag || (i18n.languages || [])[0] || i18n.language;
			// Try to detect full tag first (case sensitivity) for these special cases
			var result = ({
				// Perhaps needs to be updated for future browser versions
				"zh-CN": "scn",
				"zh-TW": "tcn",
				"zh-HK": "tcn-yue",
				"uk-UA": "ua", // uk is Ukrainian, UK is United Kingdom, UA is Ukraine
				"uk": "ua",
			})[lang];
			if(!result){
				// Try primary language subtag only
				lang = lang.toLowerCase().split(/-/)[0];
				result = ({
					// our language codes messed up with region codes, compatible with them
					"ja": "jp", "jp": "jp", // jp not exist
					"ko": "kr", // kr is Kanuri, do not map it to Korean
					"ua": "ua", // ua not exist
					"zh": "scn", // scn not exist, even not a region code
					// do remember update this list if new language added
					"de": "de", "es": "es", "fr": "fr", "id": "id",
					"it": "it", "nl": "nl", "pt": "pt", "ru": "ru",
					"th": "th", "vi": "vi",
				})[lang];
			}
			// Fall-back to `en` for unsupported language
			return result || "en";
		},
		
		// Current maximum pages of HQ info
		getMaxHqInfoPage :function(){
			return 4;
		},
		
		// Toggle HQ Info Page
		scrollHqInfoPage :function(){
			this.loadIfNecessary();
			const maxPage = this.getMaxHqInfoPage() + (KC3Meta.isDuringFoodEvent() & 1);
			this.hqInfoPage = (this.hqInfoPage % maxPage) + 1;
			this.save();
		},

		// Toggle top-left boxes in Moonlight
		scrollSpecificPage :function(page){
			this.loadIfNecessary();
			this.RotationPage = page;
			this.save();
		},

		// Toggle top-left boxes in Moonlight
		scrollSpecific2Page :function(page){
			this.loadIfNecessary();
			this.Rotation2Page = page;
			this.save();
		},

		// Toggle layouts in Moonlight
		setLayout :function(layoutType){
			this.loadIfNecessary();
			this.pan_layout = layoutType;
			this.save();
		},

		// Toggle Equipment LoS
		scrollElosMode :function(){
			this.loadIfNecessary();
			this.elosFormula = (this.elosFormula % 4) + 1;
			this.save();
		},

		setElosMode :function(type){
			this.loadIfNecessary();
			this.elosFormula = type;
			this.save();
		},

		// Toggle Fighter Power
		// 1=no proficiency 2=proficiency average 3=proficiency bounds
		scrollFighterPowerMode :function(){
			this.loadIfNecessary();
			this.air_formula = (this.air_formula % 3) + 1;
			this.save();
		},
		
		// Toggle Player Formation Type (former AntiAir Formation)
		// Loop between all formations, according combined fleet state:
		// Line Ahead / Double Line / Diamond / Echelon / Line Abreast, or
		// 1st anti-sub / 2nd forward / 3rd diamond / 4th battle
		scrollAntiAirFormation :function(isCombined){
			this.loadIfNecessary();
			this.aaFormation += 1;
			if(!!isCombined){
				if(this.aaFormation < 11) this.aaFormation = 11;
				if(this.aaFormation > 14) this.aaFormation = 11;
			} else {
				if(this.aaFormation > 6) this.aaFormation = 1;
			}
			this.save();
		},
		
		// Toggle HQ Exp Information
		scrollHQExpInfo :function(){
			this.loadIfNecessary();
			this.hqExpDetail = (this.hqExpDetail % 3) + 1;
			this.save();
		},
		
		// Toggle Rank Title vs Rank Points
		scrollRankPtsMode :function(){
			this.loadIfNecessary();
			this.rankPtsMode = (this.rankPtsMode % 2) + 1;
			this.save();
		},
		
		// Toggle repair timer type
		scrollTimerType :function(){
			this.loadIfNecessary();
			this.timerDisplayType = (this.timerDisplayType % 2) + 1;
			this.save();
		}
		
	};
	
	var
		IntFilterArray = function(filterFun){
			function LocalArray(){}
			LocalArray.prototype = [];
			
			// http://stackoverflow.com/questions/1960473/unique-values-in-an-array
			function arrayUniquefy(x,i,a){ return a.indexOf(x) === i; }
			
			// http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/
			function KC3ShipList(){
				if(this instanceof KC3ShipList){
					if (arguments.length === 1) {
						this.length = arguments[0];
					} else if (arguments.length) {
						this.push.apply(this,arguments);
					}
				}else{
					throw new Error("Cannot invoke constructor without `new` keyword");
				}
			}
			
			KC3ShipList.prototype = new LocalArray();
			KC3ShipList.prototype.constructor = KC3ShipList;
			
			Object.defineProperties(KC3ShipList.prototype,{
				push:{value:function push(){
					var _push,_args,nAry,nLen;
					_args = Array.prototype.slice.apply(arguments);
					_push = Function.prototype.apply.bind(Array.prototype.push,this);
					nAry  = _args.filter(arrayUniquefy).filter(filterFun.bind(this));
					nLen  = nAry.length;
					_push(nAry);
					return nLen;
				}},
				unshift:{value:function unshift(){
					var _ushf, _args, nAry, nLen;
					_args = Array.prototype.slice.apply(arguments);
					_ushf = Function.prototype.apply.bind(Array.prototype.unshift,this);
					nAry  = _args.filter(arrayUniquefy).filter(filterFun.bind(this));
					nLen  = nAry.length;
					_ushf(nAry);
					return nLen;
				}},
				
				concat:{value:function concat(){
					var _slic,_args;
					_slic = Function.prototype.apply.bind(Array.prototype.slice);
					_args = _slic(arguments);
					return new (KC3ShipList.bind.apply(KC3ShipList,[null].concat([].concat.apply([],[this].concat(_args).map(function(shiplist){
						return _slic(shiplist);
					})))))();
				}},
				slice:{value:function slice(){
					var _slic,_args,ary;
					_slic = Function.prototype.apply.bind(Array.prototype.slice);
					_args = _slic(arguments);
					ary   = _slic(this,_args);
					return new (KC3ShipList.bind.apply(KC3ShipList,[null].concat(ary)))();
				}},
				
				exists:{value:function exists(){
					var _slic,_args,self;
					_slic = Function.prototype.apply.bind(Array.prototype.slice);
					_args = _slic(arguments).map(Number);
					self  = this;
					return _args.some(function(requestInt){
						return self.indexOf(requestInt)>=0;
					});
				}},
				
				toJSON:{value:function toJSON(){return [].slice.apply(this);}},
			});
			return KC3ShipList;
		},
		KC3ShipMasterList = IntFilterArray(function(x){
			var ret = !isNaN(x) && isFinite(x) && typeof x === 'number' && !this.exists(x);
			try { ret &= KC3Master.ship(x).kc3_model == 1; } catch (e) {} finally { return ret; }
		}),
		KC3ShipRosterList = IntFilterArray(function(x){
			var ret = !isNaN(x) && isFinite(x) && typeof x === 'number' && !this.exists(x);
			try { ret &= KC3ShipManager.get(x).rosterId == x; } catch (e) {} finally { return ret; }
		});
	
})();
