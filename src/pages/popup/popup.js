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
		
		// Calculate reset countdowns
		var TimeNow = new Date();
		
		var UTC8PMToday = (new Date());
		UTC8PMToday.setUTCHours(20);
		UTC8PMToday.setUTCMinutes(0);
		UTC8PMToday.setUTCSeconds(0);
		UTC8PMToday.setUTCMilliseconds(0);
		
		var UTC8PMTomorrow = new Date(UTC8PMToday.getTime() + (24*60*60*1000));
		
		var remaining = 0;
		if(TimeNow.getUTCHours() > 20){
			remaining = UTC8PMTomorrow.getTime() - TimeNow.getTime();
		}else{
			remaining = UTC8PMToday.getTime() - TimeNow.getTime();
		}
		$(".timeQuest").text( String(remaining/1000).toHHMMSS() );
		
		// PVP Reset Counter
		var UTC6AMToday = (new Date());
		UTC6AMToday.setUTCHours(6);
		UTC6AMToday.setUTCMinutes(0);
		UTC6AMToday.setUTCSeconds(0);
		UTC6AMToday.setUTCMilliseconds(0);
		
		var UTC6PMToday = (new Date());
		UTC6PMToday.setUTCHours(18);
		UTC6PMToday.setUTCMinutes(0);
		UTC6PMToday.setUTCSeconds(0);
		UTC6PMToday.setUTCMilliseconds(0);
		
		var UTC6AMTomorrow = new Date(UTC6AMToday.getTime() + (24*60*60*1000));
		
		if(TimeNow.getUTCHours() < 6){
			remaining = UTC6AMToday.getTime() - TimeNow.getTime();
		}else if(TimeNow.getUTCHours() < 18){
			remaining = UTC6PMToday.getTime() - TimeNow.getTime();
		}else{
			remaining = UTC6AMTomorrow.getTime() - TimeNow.getTime();
		}
		$(".timePvP").text( String(remaining/1000).toHHMMSS() );
	});
	
})();
