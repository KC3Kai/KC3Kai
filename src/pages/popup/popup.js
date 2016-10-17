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
		
		// Show estimated time until next update
		$.ajax({
			dataType: "json",
			async: true,
			url: "https://raw.githubusercontent.com/KC3Kai/KC3Kai/master/update?v="+(Date.now()),
			success: function(data, textStatus, request){
				if (!!data.pr) {
					$(".nextVersion").attr("href", data.pr);
				}
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
				// Next Maintenance time
				if (data.maintenance_start) {
					var nextMtDate = new Date(data.maintenance_start);
					var remaining = nextMtDate - new Date();
					if (remaining >= 0) {
						$(".timeServerMaintenance").text( String(remaining/1000).toHHMMSS() );
					}  else {
						var MtEnd = new Date(data.maintenance_end);
						remaining = MtEnd - new Date();
						if (remaining >= 0) {
							$(".timeServerMaintenance").text( String(remaining/1000).toHHMMSS() );
						} else {
							$(".timeServerMaintenance").text(KC3Meta.term("MaintenanceComplete"));
						}
					}
				} else {
					$(".timeServerMaintenance").text(KC3Meta.term("MenuTimeUnknown"));
				}
				
			}
		});
		
		checkDMMLogin(function(isLoggedIn){
			if (!isLoggedIn) {
				$("#play_cc").hide();
				$("#play_dmm").hide();
				$("#play_dmmf").hide();
				
				$("#login_dmm").show();
				
				$(".wrapper").css("height", "372px");
			}
		});
		
		// Login on DMM
		$("#login_dmm").on('click', function(){
			localStorage.extract_api = false;
			localStorage.dmmplay = false;
			window.open("https://www.dmm.com/my/-/login/=/path=Sg__/", "dmm_login");
		});
		
		// Refresh API Link
		// $("#get_api").on('click', function(){
		$("#play_cc").on('click', function(){
			chrome.cookies.set({
				url: "http://www.dmm.com",
				name: "ckcy",
				value: "1",
				domain: ".dmm.com",
				expirationDate: Math.ceil((new Date("Sun, 09 Feb 2019 09:00:09 GMT")).getTime()/1000),
				path: '/netgame/',
			}, function(cookie){
				localStorage.extract_api = true;
				localStorage.dmmplay = false;
				window.open("http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/", "kc3kai_game");
			});
		});
		
		// Play DMM Website
		$("#play_dmm").on('click', function(){
			chrome.cookies.set({
				url: "http://www.dmm.com",
				name: "ckcy",
				value: "1",
				domain: ".dmm.com",
				expirationDate: Math.ceil((new Date("Sun, 09 Feb 2019 09:00:09 GMT")).getTime()/1000),
				path: '/netgame/',
			}, function(cookie){
				localStorage.extract_api = false;
				localStorage.dmmplay = true;
				window.open("../game/web.html", "kc3kai_game");
			});
		});
		
		// Play via DMM Frame
		$("#play_dmmf").on('click', function(){
			chrome.cookies.set({
				url: "http://www.dmm.com",
				name: "ckcy",
				value: "1",
				domain: ".dmm.com",
				expirationDate: Math.ceil((new Date("Sun, 09 Feb 2019 09:00:09 GMT")).getTime()/1000),
				path: '/netgame/',
			}, function(cookie){
				localStorage.extract_api = false;
				localStorage.dmmplay = false;
				window.open("../game/dmm.html", "kc3kai_game");
			});
		});
		
		// Strategy Room
		$("#strategy").on('click', function(){
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
		
		// About
		$("#facebook").on('click', function(){
			window.open("https://www.facebook.com/kc3kai", "_blank");
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
	
	function checkDMMLogin(callback){
		// should be exactly of value "false",
		// so we can fallback as if it's default value "true"
		if (ConfigManager.forceDMMLogin === false) {
			callback(true);
			return;
		}
		// Check if user is already logged in on DMM
		chrome.cookies.get({
			url: "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/",
			name: "INT_SESID"
		}, function(cookie){
			// Not yet logged in
			if(cookie===null){
				callback(false);
				
			// Already logged in
			}else{
				callback(true);
			}
		});
	}
	
})();
