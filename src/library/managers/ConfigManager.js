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
				language			: "en",
				elos_mode 			: 3,
				
				tl_overlay 			: false,
				askExit 			: false,
				size 				: 100,
				gambox_margin 		: 0,
				background 			: "#def",
				background_align_h 	: "left",
				background_align_v 	: "top",
				ss_mode 			: 0,
				ss_type 			: 'JPG',
				
				background_panel 	: "#def",
				panelAlpha 			: 100,
				reveal_names 		: true,
				
				time_dev 			: 59,
				timerAlert 			: 1,
				customsound 		: "",
				alert_volume 		: 60,
				desktop_notif 		: true,
				
				showCraft 			: true,
				showCompass 		: true,
				showBattle 			: true,
				predictBattle 		: false,
				
				rsc_interval 		: 3600
			};
		},
		
		// Reset to default values
		clear : function(){
			$.extend(this, this.defaults());
			this.save();
		},
		
		// Load previously saved config
		load : function(){
			$.extend(this, this.defaults(), JSON.parse(localStorage.config || "{}"));
		},
		
		// Save current config onto localStorage
		save : function(){
			// console.log(this);
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
