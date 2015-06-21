/* ConfigManager.js

KC3改 Configuration Manager

Stores KC3改 Settings on localStorage for persistence
Retreives when needed to apply on components
*/
(function(){
	"use strict";
	
	window.ConfigManager = {
		
		// Default values. As a fucntion to not include on JSON string
		defaults : function(){
			return {
				version 			: 5,
				timerAlert 			: 1,
				gambox_margin 		: 0,
				background 			: "#def",
				background_panel 	: "#def",
				background_align_h 	: "left",
				background_align_v 	: "top",
				tl_overlay 			: false,
				size 				: 100,
				time_dev 			: 59,
				rsc_interval 		: 3600,
				reveal_names 		: true,
				elos_mode 			: 3,
				alert_volume 		: 60,
				desktop_notif 		: true,
				ss_mode 			: 0,
				ss_type 			: 'JPG',
				customsound 		: "",
				showCraft 			: true,
				showCompass 		: false,
				predictBattle 		: false,
				panelAlpha 			: 100,
				askExit 			: 1,
				language			: "en"
			};
		},
		
		// Interface values to be shown on settings page
		meta : function(){
			return [
				{
					category: "Screen",
					name: "Quest Translations and Tracking",
					type: "check",
					options: {},
					help: ""
				},
			];
		},
		
		// Reset to default values
		clear : function(){
			$.extend(this, this.defaults());
			this.save();
		},
		
		// Load previously saved config
		load : function(){
			$.extend(this, this.defaults(), JSON.parse(localStorage.config || {}));
		},
		
		// Save current config onto localStorage
		save : function(){
			localStorage.config = JSON.stringify(this);
		},
		
		// Toggle Equipment LoS
		scrollElosMode :function(){
			this.elos_mode++;
			if(this.elos_mode > 3){ this.elos_mode=1; }
			this.save();
		}
		
	};
	
})();
