(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	var myVersion = parseInt(chrome.runtime.getManifest().version, 10);

	$(document).on("ready", function(){
		// Load previously stored configs
		ConfigManager.load();
		KC3Meta.init("../../data/");
		KC3Translation.execute();
		
		// Show next version
		$(".schedule span.version").text(myVersion+1);
		
		// Show estimated time until next update
		$.ajax({
			dataType: "json",
			url: "https://raw.githubusercontent.com/dragonjet/KC3Kai/master/update?v="+((new Date()).getTime()),
			success: function(data, textStatus, request){
				if(myVersion < parseInt(data.version, 10)){
					version = data.version;
					setupUpdateTime(
						new Date(request.getResponseHeader('Date')),
						new Date(data.time)
					);
				}else{
					$(".schedule").html( KC3Meta.term("MenuOnLatest") );
				}
			}
		});
		
		// Play via API Link
		$("#play_cc").on('click', function(){
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
				window.open("../game/api.html", "kc3kai_game");
			});
		});
		
		// Refresh API Link
		$("#get_api").on('click', function(){
			_gaq.push(['_trackEvent', "Refresh API", 'clicked']);
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
			localStorage.extract_api = false;
			localStorage.dmmplay = true;
			window.open("../game/web.html", "kc3kai_game");
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
		
	});

	// Setup Update Time veriables
	var remaining = false;
	var version = false;
	function setupUpdateTime(timeNow, timeNxt){
		remaining = Math.floor((timeNxt.getTime() - timeNow.getTime())/1000);
		showUpdateTime();
		setInterval(showUpdateTime, 1000);
	}

	// Actually show the update text
	function showUpdateTime(){
		if(remaining===false){ return false; }
		if(remaining > 0){
			remaining--;
			var secs = remaining;
			
			var hrs = Math.floor(secs/3600);
			secs = secs - (hrs * 3600);
			if(hrs < 10){ hrs = "0"+hrs; }
			
			var min = Math.floor(secs/60);
			secs = secs - (min * 60);
			if(min < 10){ min = "0"+min; }
			
			if(secs < 10){ secs = "0"+secs; }
			
			$(".schedule").html("KC3改 Update Warning: v"+version+" in <span class=\"timer\">"+hrs+":"+min+":"+secs+"</span>");
		}else{
			$(".schedule").html("v"+version+" scheduled release now, be alert~!</a>");
		}
	}
	
})();