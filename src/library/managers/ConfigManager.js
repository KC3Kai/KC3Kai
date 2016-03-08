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
				elosFormula 		: 3,
				hqExpDetail 		: 1,
				timerDisplayType	: 1,
				marryLevelFormat	: 0,
				checkLiveQuests		: true,
				
				DBSubmission_enabled: 0,
				DBSubmission_key : '',

				PoiDBSubmission_enabled: false,
				
				KC3DBSubmission_enabled: true,
				
				info_face 			: true,
				info_drop 			: true,
				info_craft 			: true,
				info_compass 		: true,
				info_battle 		: true,
				info_btstamp 		: false,
				info_boss 			: false,
				info_salt 			: false,
				info_troll 			: false,
				info_delta 			: false,
				info_fleetstat 		: true,
				info_auto_exped_tab : true,
				info_eng_stype		: false,

				// AIR PROFICIENCY BONUSES (Configurable by user)
				air_formula			: 3, // 1=no veteran 2=veteran average 3=veteran bounds
				air_average			: {
					"6":  [0, 1.35, 3.5, 7.1, 11.4, 16.8, 17, 25],
					"7":  [0,    1,	  1,   1,    2,	   2,  2,  3],
					"8":  [0,    1,	  1,   1,    2,	   2,  2,  3],
					"11": [0,    1,	  1,   3,    3,	   7,  7,  9]
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
					]
				},
				
				salt_list 		: [],

				ss_mode				: 0,
				ss_type				: 'JPG',
				ss_directory 		: 'KanColle',
				
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
				pan_opacity 		: 100
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
			// Get old config or create dummy if none
			var oldConfig = JSON.parse(localStorage.config || "{}");
			
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
			if(!(this.salt_list instanceof Array))
				this.resetValueOf('salt_list');
		},
		
		// Save current config onto localStorage
		save : function(){
			// console.log(this);
			localStorage.config = JSON.stringify(this);
		},
		
		// Toggle Equipment LoS
		scrollElosMode :function(){
			this.elosFormula = (this.elosFormula % 3) + 1;
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
	
})();
