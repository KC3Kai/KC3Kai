(function(){
	"use strict";
	_gaq.push(['_trackPageview']);
	
	// Redirect to DMM play page when activated
	function ActivateGame(){
		var infinityExpire = new Date();
		infinityExpire.setYear(infinityExpire.getUTCFullYear()+1);
		chrome.cookies.set({
			url: "http://www.dmm.com",
			name: "ckcy",
			value: "1",
			domain: ".dmm.com",
			expirationDate: Math.ceil(infinityExpire.getTime()/1000),
			path: '/netgame/',
		}, function(cookie){
			window.location = "http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/";
		});
	}
	
	$(document).on("ready", function(){
		// Load previously stored configs
		ConfigManager.load();
		KC3Meta.init("../../data/");
		KC3Translation.execute();
		
		// Quick Play
		$("#startAnyway").on('click', ActivateGame);
		
		// Show instructions by OS
		chrome.runtime.getPlatformInfo(function(platformInfo){
			if ($(".instructF12."+platformInfo.os).length > 0) {
				$(".instructF12."+platformInfo.os).show();
			} else {
				$(".instructF12").show();
			}
		});
		
		// Toggleable settings
		toggleSetting("dmm_customize", "#background");
		toggleSetting("api_subtitles", "#subtitles");
		toggleSetting("api_translation", "#questtl");
		toggleSetting("map_markers", "#mapmarkers");
		toggleSetting("api_askExit", "#exitconfirm");
		
		$("#background").on("change", customizationConsequence);
		customizationConsequence();
	});
	
	// Toggleable setting
	function toggleSetting(configName, elementName){
		if (ConfigManager[configName]) {
			$(elementName).prop("checked", true);
		}
		$(elementName).on("change", function(){
			ConfigManager[configName] = $(this).prop("checked");
			ConfigManager.save();
		});
	}
	
	// Applying toggle consequence
	function customizationConsequence(){
		if ($("#background").prop("checked")) {
			$(".dependsOnCustomization").removeClass("notApplicable");
		} else {
			$(".dependsOnCustomization").addClass("notApplicable");
		}
	}
	
	// Extension Interaction
	chrome.runtime.onMessage.addListener(function(request, sender, response) {
		if (request.identifier != "kc3_gamescreen") return true;
		if (request.action != "activateGame") return true;
		ActivateGame();
	});
	
})();