(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	var myVersion = Number(chrome.runtime.getManifest().version);
	
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
			url: "https://raw.githubusercontent.com/dragonjet/KC3Kai/master/update?v="+((new Date()).getTime()),
			success: function(data, textStatus, request){
				// If current installed version less than latest
				if( myVersion < Number(data.version) ){
					var UpdateDiff = (new Date(data.time)).getTime() - (new Date()).getTime();
					if(UpdateDiff > 0){
						$(".nextVersion").html( "v"+data.version+" in <span class=\"timer\">"+String(UpdateDiff/1000).toHHMMSS()+"</span>");
					}else{
						$(".nextVersion").html( "v"+data.version+" "+KC3Meta.term("MenuScheduledNow"));
					}
				// Installed version is the same or greater than latest
				}else{
					$(".nextVersion").html( KC3Meta.term("MenuOnLatest") );
				}
			}
		});
		
		// Play via API Link
		/*$("#play_cc").on('click', function(){
			localStorage.extract_api = false;
			localStorage.dmmplay = false;
			window.open("../game/api.html", "kc3kai_game");
		});*/
		
		// Refresh API Link
		// $("#get_api").on('click', function(){
		$("#play_cc").on('click', function(){
			_gaq.push(['_trackEvent', "Play via API", 'clicked']);
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
			_gaq.push(['_trackEvent', "Play via DMM Frame", 'clicked']);
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
	
})();
