/* Panel.js
KC3改 DevTools Panel

Must only be imported on devtools pages!
May contain multiple dashboards of different theme/layouts.
Manages multiple instances of \library\modules\Dashboard.js
*/
(function(){
	"use strict";
	
	window.KC3Panel = {
		state: "waiting",
		currentLayout: "",
		horizontal: {},
		vertical: {},
		
		init :function( options ){
			this.horizontal = options.horizontal;
			this.vertical = options.vertical;
			
			// Apply interface configs
			if(ConfigManager.pan_bg_image == ""){
				options.backgroundElement.css("background", ConfigManager.pan_bg_color);
			}else{
				options.backgroundElement.css("background-image", "url("+ConfigManager.pan_bg_image+")");
				options.backgroundElement.css("background-color", ConfigManager.pan_bg_color);
				options.backgroundElement.css("background-size", ConfigManager.pan_bg_size);
				options.backgroundElement.css("background-position", ConfigManager.pan_bg_position);
				options.backgroundElement.css("background-repeat", "no-repeat");
			}
		},
		
		// Hide waiting message, and show the appropriate dashboard
		activateDashboard :function(){
			this.state = "running";
			this.detectOrientation();
		},
		
		// Detect layout based on window width
		detectOrientation :function(){
			if(this.state != "running"){ return false; }
			
			// Wide interface, switch to vertical if not yet
			if( $(window).width() >= 800 && this.currentLayout != "vertical" ){
				if(this.currentLayout!=""){ this.layout().hide(); }
				this.currentLayout = "vertical";
				this.layout().show();
				
			// Narrow interface, switch to horizontal if not yet
			}else if( $(window).width() < 800 && this.currentLayout != "horizontal" ){
				if(this.currentLayout!=""){ this.layout().hide(); }
				this.currentLayout = "horizontal";
				this.layout().show();
			}
		},
		
		// Get the currently used layout
		layout :function(){
			return this[ this.currentLayout ];
		}
		
	};
	
})();