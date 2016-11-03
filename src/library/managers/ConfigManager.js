/* ConfigManager.js

KC3改 Configuration Manager

Stores KC3改 Settings on localStorage for persistence
Retreives when needed to apply on components
*/
(function(){
	"use strict";
	
	window.ConfigManager = {
		
		// Default values. As a function to not include on JSON string
		defaults : function(){
			return {
				version				: 8,
				language			: "en",
				elosFormula 		: 4,
				hqExpDetail 		: 1,
				timerDisplayType	: 1,
				marryLevelFormat	: 0,
				checkLiveQuests		: true,
				devOnlyPages		: false,
				forceDMMLogin       : false,
				apiRecorder         : false,

				DBSubmission_enabled: 0,
				DBSubmission_key : '',

				PoiDBSubmission_enabled: false,
				
				KC3DBSubmission_enabled: true,
				
				info_face 			: true,
				info_drop 			: true,
				info_craft 			: true,
				info_compass 		: true,
				info_battle 		: true,
				info_btrank			: true,
				info_btstamp 		: false,
				info_fleetstat 		: true,
				info_blink_gauge	: true,
				info_boss 			: false,
				info_delta 			: false,
				info_auto_exped_tab : true,
				info_auto_fleet_view: true,
				info_eng_stype		: false,
				info_force_ship_lang: "",
				info_salt 			: false,
				info_troll 			: false,

				// AIR PROFICIENCY BONUSES (Configurable by user)
				air_formula			: 3, // 1=no veteran 2=veteran average 3=veteran bounds
				air_average			: {
					"6":  [0, 1.35, 3.5, 7.1, 11.4, 16.8, 17, 25],
					"7":  [0,    1,	  1,   1,    2,	   2,  2,  3],
					"8":  [0,    1,	  1,   1,    2,	   2,  2,  3],
					"11": [0,    1,	  1,   3,    3,	   7,  7,  9],
					"45": [0, 1.35, 3.5, 7.1, 11.4, 16.8, 17, 25],
					"47": [0, 1.35, 3.5, 7.1, 11.4, 16.8, 17, 25],
					"48": [0, 1.35, 3.5, 7.1, 11.4, 16.8, 17, 25]
				},
				air_bounds			: {
					"6": [
						[0.026, 0.845], // 0
						[1, 1.715], [3.212, 3.984], [6.845, 7.504], // 3
						[11.205, 11.786], [16.639, 17], [16.999, 17.205], [24.679, 25.411] // 7
					],
					"7": [
						[0,0], // 0
						[0,1], [0,1], [0,1], // 3
						[1,2], [1,2], [1,2], [1,3]	// 7
					],
					"8": [
						[0,0], // 0
						[0,1], [0,1], [0,1], // 3
						[1,2], [1,2], [1,2], [1,3]	// 7
					],
					"11": [
						[0,0], // 0
						[0,1], [0,1], [1,3], // 3
						[1,3], [3,7], [3,7], [7,9]	// 7
					],
					"45": [
						[0.026, 0.845], // 0
						[1, 1.715], [3.212, 3.984], [6.845, 7.504], // 3
						[11.205, 11.786], [16.639, 17], [16.999, 17.205], [24.679, 25.411] // 7
					],
					"47": [
						[0.026, 0.845], // 0
						[1, 1.715], [3.212, 3.984], [6.845, 7.504], // 3
						[11.205, 11.786], [16.639, 17], [16.999, 17.205], [24.679, 25.411] // 7
					],
					"48": [
						[0.026, 0.845], // 0
						[1, 1.715], [3.212, 3.984], [6.845, 7.504], // 3
						[11.205, 11.786], [16.639, 17], [16.999, 17.205], [24.679, 25.411] // 7
					]
				},
				
				salt_list 		: new KC3ShipMasterList(),
				wish_list 		: new KC3ShipMasterList(),
				lock_list 		: new KC3ShipRosterList(),
				lock_prep 		: [],
				dismissed_hints	: {},
				
				ss_mode				: 0,
				ss_type				: 'JPG',
				ss_quality 			: 70,
				ss_directory 		: 'KanColle',
				ss_dppx 			: 1,
				
				alert_diff 			: 59,
				alert_morale_notif	: true,
				alert_morale_value	: 40,
				alert_type 			: 1,
				alert_custom 		: "",
				alert_volume 		: 60,
				alert_desktop 		: true,
				alert_supply 		: 3,
				alert_supply_exped 	:true,
				alert_idle_counter	: 1,
				
				alert_taiha			: false,
				alert_taiha_blur	: false,
				alert_taiha_blood	: true,
				alert_taiha_ss		: false,
				alert_taiha_sound	: false,
				alert_taiha_pvp		: false,
				alert_taiha_panel	: true,
				
				api_translation		: true,
				api_tracking 		: true,
				api_mustPanel 		: false,
				api_askExit			: true,
				api_directRefresh	: false,
				api_margin			: 0,
				api_bg_color		: "#def",
				api_bg_image		: "",
				api_bg_size			: "cover",
				api_bg_position		: "top center",
				api_gameScale		: 100,
				api_subtitles		: true,
				subtitle_font		: "\"Trebuchet MS\",\"Lucida Grande\",\"Lucida Sans Unicode\",\"Lucida Sans\",Tahoma,sans-serif",
				subtitle_size		: 22,
				subtitle_bold		: false,
				subtitle_display	: "ghost",
				google_translate	: true,
				
				dmm_forcecookies	: false,
				dmm_customize		: false,
				dmm_translation		: true,
				dmm_tracking		: true,
				dmm_askExit			: false,
				dmm_margin			: 0,
				dmm_bg_color		: "#def",
				dmm_bg_image		: "",
				dmm_bg_size			: "cover",
				dmm_bg_position		: "top center",
				
				pan_theme			: "natsuiro",
				pan_size			: "big",
				pan_gear_holder		: "black",
				pan_bg_color		: "#def",
				pan_bg_image		: "",
				pan_bg_size			: "cover",
				pan_bg_position		: "top center",
				pan_opacity 		: 100,

				sr_theme			: "legacy"
			};
		},
        
		// Reset value of a specific key to the current default value
		resetValueOf: function(key) {
			this[key] = this.defaults()[key];
			console.log( "key is " + key);
			console.log( "new value is " + JSON.stringify( this[key] ));
			this.save();
		},
		
		// Reset to default values
		clear : function(){
			$.extend(this, this.defaults());
			this.save();
		},

		// Load previously saved config
		load : function(){
			var self = this;
			// Get old config or create dummy if none
			var oldConfig = JSON.parse(localStorage.config || "{}");
			
			['salt','wish','lock'].forEach(function(shipListType){
				var k = [shipListType,'list'].join('_');
				oldConfig[k] = self.defaults()[k].concat(oldConfig[k] || []);
			});
			
			// Check if old config has versioning and if its lower version
			if( !oldConfig.version || (oldConfig.version < this.defaults().version) ){
				// Old config is an old version, clear it, set defaults, and save on storage
				localStorage.removeItem("config");
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
		
		// Save current config onto localStorage
		save : function(){
			// console.log(this);
			localStorage.config = JSON.stringify(this);
		},
		
		// Toggle Equipment LoS
		scrollElosMode :function(){
			this.elosFormula = (this.elosFormula % 4) + 1;
			this.save();
		},
		
		// Toggle Fighter Power
		scrollFighterPowerMode :function(){
			this.air_formula = (this.air_formula % 3) + 1;
			this.save();
		},
		
		// Toggle HQ Exp Information
		scrollHQExpInfo :function(){
			this.hqExpDetail = (this.hqExpDetail % 3) + 1;
			this.save();
		},
		
		// Toggle repair timer type
		scrollTimerType :function(){
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
					var _ushf,_args,nLen;
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
