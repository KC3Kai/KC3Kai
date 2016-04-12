(function(){
	"use strict";
	
	KC3StrategyTabs.translations = new KC3StrategyTab("translations");
	
	KC3StrategyTabs.translations.definition = {
		tabSelf: KC3StrategyTabs.translations,
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init:function(){
		},
		
		showDict: function(jsonData) {
			var keys = Object.keys( jsonData );
			keys.sort();

			var language = ConfigManager.language;

			$.each( keys, function(i,k) {
				var v = jsonData[k];
				var row = $(".factory .tr-item").clone();

				row.addClass( 
					language === v.tag ?
						"translation_done" : "translation_missing" );

				$(".tr-key",row).text(k);
				$(".tr-from",row).text(v.tag);
				$(".tr-content",row).html(v.val);

				row.appendTo( "#tr-container" );
			});
		},
		showQuests: function(jsonData) {
			var keys = Object.keys( jsonData );
			keys.sort();

			var language = ConfigManager.language;

			$.each( keys, function(i,k) {
				var v = jsonData[k];
				var row = $(".factory .tq-item").clone();

				var questWikiCode = (v.code && v.code.val) ? v.code.val : "???";
				var questIdPretty = k + " (" + questWikiCode + ")";

				var questName = v.name.val;
				var questDesc = v.desc.val;

				var questNameL = v.name.tag;
				var questDescL = v.desc.tag;

				row.addClass( 
					language === v.name.tag && language === v.desc.tag ?
						"translation_done" : "translation_missing" );

				$(".tq-key",row).text(questIdPretty);
				$(".tq-from",row).text( questNameL + "/" + questDescL);
				$(".tq-name",row).text(questName).addClass(
					language === v.name.tag ?
						"translation_done" : "translation_missing");
				$(".tq-desc",row).text(questDesc).addClass(
					language === v.desc.tag ?
						"translation_done" : "translation_missing");

				row.appendTo( "#tr-container" );
			});
		},
		showServers: function(jsonData) {
			// re-index objects
			var servers = [];
			$.each(jsonData, function(ip, dat) {
				servers.push( {ip: ip, dat: dat });
			});

			servers.sort( function(a,b) {
				return a.dat.num.val - b.dat.num.val;
			});

			var language = ConfigManager.language;

			$.each(servers, function(i, d) {
				console.log(d);
				var row = $(".factory .tr-item").clone();
				row.addClass( 
					language === d.dat.name.tag ?
						"translation_done" : "translation_missing" );
				$(".tr-key",row).text("(" + d.dat.num.val + ") " + d.ip);
				$(".tr-from",row).text(d.dat.name.tag);
				$(".tr-content",row).html(d.dat.name.val);
				row.appendTo( "#tr-container" );
			});
		},
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute: function() {
			var self = this;

			// TODO: servers
			var defs = {
				terms: {
					callback: self.showDict
				},
				items: {
					callback: self.showDict
				},
				ships: {
					callback: self.showDict
				},
				quests: {
					callback: self.showQuests
				},
				servers: {
					callback: self.showServers
				},
				stype: {
					callback: self.showDict
				},
				ranks: {
					callback: self.showDict
				}
			};

			$.each(defs, function(k,v) {
				$("#select-json-file").append(
					$("<option></option>").val(k).text(k));
			});

			$("#chk-missing-only").click( function() {
				$(".translation_done").toggle( ! this.checked);
			});

			$("#select-json-file").change( function() {
				$("#tr-container").empty();
				$("#chk-missing-only").attr("checked",false);

				var repo = "../../data/";
				var translation = KC3Translation.getJSONWithOptions(
					repo, this.value, true,
					ConfigManager.language,
					false,
					false,
					true);

				var callback = defs[this.value].callback;
				callback.apply(self,[translation]);
			} );

			$("#select-json-file").val("terms").change();
		}
	};
})();
