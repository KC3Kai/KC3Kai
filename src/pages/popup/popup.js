(function(){
	"use strict";
	
	var myVersion = chrome.runtime.getManifest().version;
	
	/*
	Starting v20, time indicators do not count down (kc3 update, pvp, quest resets).
	No user keeps the popup menu open for a long time to even make use of a countdown.
	Them knowing how many hours and minutes left at a glance is good enough.
	*/

	$(document).on("ready", function(){
		// Load previously stored configs
		ConfigManager.load();
		KC3Meta.init("../../data/");
		KC3Translation.execute();
		
		$(".myVersion").text(myVersion);
		$(".gameVersion").text(localStorage.gameVersion || KC3Meta.term("Unknown"));
		
		// Show estimated time until next update
		$.ajax({
			dataType: "json",
			async: true,
			url: "https://raw.githubusercontent.com/KC3Kai/KC3Kai/develop/update?v="+(Date.now()),
			success: function(data, textStatus, request){
				// Check for available extension updates
				if (typeof localStorage.updateAvailable != "undefined" && localStorage.updateAvailable != myVersion) {
					// Update available, as notified by chrome itself
					$(".nextVersion").html( localStorage.updateAvailable+" "+KC3Meta.term("UpdateAvailableNow"));
					
				} else {
					// Check the GitHub JSON
					if( myVersion != data.version ){
						// If unknown time
						if (data.time === "") {
							$(".nextVersion").html( data.version+" "+KC3Meta.term("MenuScheduledSoon"));
						
						// If there is a fixed scheduled time
						} else {
							// If current installed version less than latest
							var UpdateDiff = (new Date(data.time)).getTime() - Date.now();
							
							if(UpdateDiff > 0){
								$(".nextVersion").html( data.version+" in <span class=\"timer\">"+String(UpdateDiff/1000).toHHMMSS()+"</span>");
							}else{
								$(".nextVersion").html( data.version+" "+KC3Meta.term("MenuScheduledNow"));
							}
						}
					}else{
						// Installed version is the same or greater than latest
						$(".nextVersion").html( KC3Meta.term("MenuOnLatest") );
					}
				}
				
				// Next Maintenance time
				if (data.maintenance_start) {
					var nextMtDate = new Date(data.maintenance_start);
					var remaining = nextMtDate - new Date();
					$(".timeServerMaintenance").removeClass("maintTime");
					if (remaining >= 0) {
						$(".timeServerMaintenance").text(String(remaining/1000).toHHMMSS(true));
					}  else {
						var MtEnd = new Date(data.maintenance_end);
						remaining = MtEnd - new Date();
						if (remaining >= 0) {
							$(".timeServerMaintenance").addClass("maintTime").text(String(remaining/1000).toHHMMSS());
						} else {
							$(".timeServerMaintenance").text(KC3Meta.term("MaintenanceComplete"));
						}
					}
				} else {
					$(".timeServerMaintenance").text(KC3Meta.term("MenuTimeUnknown"));
				}
				
			}
		});
		
		// Play DMM Website
		$("#play_dmm").on('click', function(){
			window.open("../game/direct.html", "kc3kai_game");
		});
		
		// Strategy Room
		$("#strategy").on('click', function(){
			// To unify Strategy Room open method (always 1 tab), maybe a setting for it
			//(new RMsg("service", "strategyRoomPage", { tabPath: "profile" })).execute();
			//window.close();
			// To allow multi Strategy Room tabs
			window.open("../strategy/strategy.html", "kc3kai_strategy");
		});
		
		// Settings
		$("#settings").on('click', function(){
			window.open("../settings/settings.html", "kc3kai_settings");
		});
		
		// About
		$("#about").on('click', function(){
			window.open("../about/about.html", "kc3kai_about");
		});
		
		// Calculate reset countdowns
		var now = Date.now();
		
		var UTC8PM = new Date();
		UTC8PM.setUTCHours(20, 0, 0, 0);
		
		while (UTC8PM.getTime() < now) {
			UTC8PM.setUTCDate(UTC8PM.getUTCDate() + 1);
		}
		var remaining = UTC8PM.getTime() - now;

		$(".timeQuest").text( String(remaining/1000).toHHMMSS() );
		
		// PVP Reset Counter
		var UTC6AM = new Date();
		UTC6AM.setUTCHours(6, 0, 0, 0);

		var UTC6PM = new Date();
		UTC6PM.setUTCHours(18, 0, 0, 0);

		while (UTC6AM.getTime() < now) {
			UTC6AM.setUTCDate(UTC6AM.getUTCDate() + 1);
		}
		while (UTC6PM.getTime() < now) {
			UTC6PM.setUTCDate(UTC6PM.getUTCDate() + 1);
		}
		remaining = Math.min(
			UTC6AM.getTime() - now,
			UTC6PM.getTime() - now);
		$(".timePvP").text( String(remaining/1000).toHHMMSS() );
	});
	
})();
