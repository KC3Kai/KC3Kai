(function(){
	"use strict";
	var source = 'https://raw.githubusercontent.com/KC3Kai/kc3-translations/dev-autotl/data';
	localStorage.extract_api = false;
	localStorage.dmmplay = true;
	
	function getInfExpirationDate(){
		var infinityExpire = new Date();
		infinityExpire.setYear(infinityExpire.getUTCFullYear()+1);
		return Math.ceil(infinityExpire.getTime() / 1000);
	}
	
	// Redirect to DMM play page when activated
	function ActivateGame(){
		chrome.cookies.set({
			url: "http://www.dmm.com",
			name: "ckcy",
			value: "1",
			domain: ".dmm.com",
			expirationDate: getInfExpirationDate(),
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
		KC3Database.init();
		
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
		
		// Toggle-able settings
		toggleSetting("dmm_customize", "#background");
		toggleSetting("api_subtitles", "#subtitles");
		toggleSetting("map_markers", "#mapmarkers");
		toggleSetting("api_translation", "#questtl");
		toggleSetting("api_tracking", "#questtrack");
		toggleSetting("info_quest_activity", "#questtab");
		toggleSetting("api_askExit", "#exitconfirm");
		toggleSetting("mute_game_tab", "#mutegametab");
		toggleSetting("alert_taiha", "#taihaalert");
		toggleSetting("focus_game_tab", "#focusgame");
		toggleSetting("TsunDBSubmission_enabled", "#tsundbsubmission");
		toggleSetting("PoiDBSubmission_enabled", "#poidbsubmission");
		//toggleSetting("OpenDBSubmission_enabled", "#opendbsubmission");
		//toggleSetting("checkLiveQuests", "#tl_autocheck_switch");
		
		$("#background").on("change", customizationConsequence);
		customizationConsequence();
		
		// Init jquery-ui tooltips
		$("div[title]").tooltip({
			position: { my: "left top+5" },
			content: function(){
				return ($(this).attr("title") || "")
					.replace(/\n/g, "<br/>")
					.replace(/\t/g, "&emsp;&emsp;");
			}
		});
		
		// Game modes
		$(".altGameModes .modePlay").on("click", function(){
			switch ($(this).data("mode")) {
				case "frame":
					localStorage.extract_api = false;
					localStorage.dmmplay = false;
					applyCookiesAndRedirect("dmm.html");
					break;
				case "api":
					localStorage.extract_api = true;
					localStorage.dmmplay = false;
					applyCookiesAndRedirect("http://www.dmm.com/netgame/social/-/gadgets/=/app_id=854854/");
					break;
			}
		});
		
		// Auto-check live translations
		$(".tl_checknow").on("click", function(){
			$(".tl_checknow").hide();
			$(".tl_checklive_status").show();
			tl_loadLanguageVersion();
		});
		if (ConfigManager.checkLiveQuests) {
			$(".tl_checknow").trigger("click");
		}
	});
	
	// Toggle-able setting
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
	
	// Online TL: Check language version
	function tl_loadLanguageVersion(){
		var lang = ConfigManager.language;
		
		$(document).ajaxError(function(event, request, settings){
			console.debug(event, request, settings);
			$(".tl_checklive_status").text("Unable to load online translations for this language");
			$(".tl_checklive_status").css({ color:'#f00' });
		});

		$.ajax({
			url: source+'/'+lang+'/custom.json',
			dataType: 'JSON',
			success: function(response){
				$(".tl_checklive_status").text("Loading files...");
				tl_loadLanguageFile("quests.json", response.version.quests, $("#tlfile_item_quests"));
				tl_loadLanguageFile("quotes.json", response.version.quotes, $("#tlfile_item_quotes"));
				tl_loadLanguageFile("ships.json", response.version.ships, $("#tlfile_item_ships"));
				tl_loadLanguageFile("items.json", response.version.items, $("#tlfile_item_items"));
			}
		});
	}
	
	// Online TL: Load language file
	function  tl_loadLanguageFile(filename, filever, element){
		var lang = ConfigManager.language;
		$(".tlfile_status_icon", element).hide();
		$(".loader", element).show();
		
		$.ajax({
			url: source+'/'+lang+'/'+filename,
			dataType: 'JSON',
			success: function(response){
				KC3Translation.updateTranslations(lang, filename, filever, response, function(){
					$(".tlfile_status_icon", element).hide();
					$(".done", element).show();
					loadFileComplete();
				});
			}
		});
	}
	
	var filesLoaded = 0;
	function loadFileComplete(){
		filesLoaded++;
		if (filesLoaded >= 4) {
			$(".tl_checklive_status").text("Done.");
		}
	}
	
	function applyCookiesAndRedirect(htmlLink){
		chrome.cookies.set({
			url: "http://www.dmm.com",
			name: "ckcy",
			value: "1",
			domain: ".dmm.com",
			expirationDate: getInfExpirationDate(),
			path: '/netgame/',
		}, function(cookie){
			window.location.href = htmlLink;
		});
	}
	
	// Extension Interaction
	chrome.runtime.onMessage.addListener(function(request, sender, response) {
		if (request.identifier != "kc3_gamescreen") return true;
		if (request.action != "activateGame") return true;
		ActivateGame();
	});
	
})();