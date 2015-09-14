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
				version				: 7,
				language			: "en",
				elosFormula 		: 3,
				hqExpDetail 		: 1,
				timerDisplayType	: 1,
				marryLevelFormat	: 0,
				
				info_face 			: true,
				info_drop 			: true,
				info_craft 			: true,
				info_compass 		: true,
				info_battle 		: true,
				info_btstamp 		: false,
				info_boss 			: false,
				info_troll 			: false,
				info_delta 			: false,
				info_fleetstat 		: true,
				
				ss_mode 			: 0,
				ss_type 			: 'JPG',
				
				alert_diff 			: 59,
				alert_morale_notif	: true,
				alert_morale_value	: 40,
				alert_type 			: 1,
				alert_custom 		: "",
				alert_volume 		: 60,
				alert_desktop 		: true,
				alert_supply 		: 3,
				alert_supply_exped 		:true,
				
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
			if(this.language == "troll") // force reverting
				this.language = "en";
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
