(function(){
	"use strict";
	
	KC3StrategyTabs.presets = new KC3StrategyTab("presets");
	
	KC3StrategyTabs.presets.definition = {
		tabSelf: KC3StrategyTabs.presets,
		
		presets: {},
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			if(typeof localStorage.presets != "undefined"){
				this.presets = JSON.parse(localStorage.presets);
			}
			
			console.log(this.presets);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var presetBox, thisShip, shipBox;
			
			$(".tab_presets .presets").html("");
			
			$.each(this.presets, function(presetIndex, preset){
				presetBox = $(".tab_presets .factory .preset").clone();
				$(".num", presetBox).text( preset.api_preset_no );
				$(".name", presetBox).text( preset.api_name );
				$(".name_id", presetBox).text( preset.api_name_id );
				
				$.each(preset.api_ship, function(shipIndex, shipRoster){
					if(shipRoster > -1){
						thisShip = KC3ShipManager.get(shipRoster);
						if(thisShip){
							shipBox = $(".tab_presets .factory .ship").clone();
							$("img", shipBox).attr("src", KC3Meta.shipIcon(thisShip.masterId));
							$(".shipName", shipBox).text( thisShip.name() );
							$(".shipLv", shipBox).text( "Lv."+thisShip.level );
							
							$(".ships", presetBox).append( shipBox );
						}
					}
				});
				
				$(".tab_presets .presets").append( presetBox );
			});
		}
		
	};
	
})();
