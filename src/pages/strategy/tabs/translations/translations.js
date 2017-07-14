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
		
		showDict: function(jsonData, originalJson) {
			var keys = Object.keys( jsonData );
			keys.sort();

			var language = ConfigManager.language;
			var jsonToggleFunc = function() {
				$(".tr-json", $(this).parent()).toggle();
			};

			$.each( keys, function(i,k) {
				var v = jsonData[k];
				var row = $(".factory .tr-item").clone();
				var nested = function(obj){
					if(Array.isArray(obj)){
						return obj.length === 0 ? {} : nested(obj[0]);
					}
					if(typeof obj === "object"){
						if(!!obj.tag){ return obj; }
						var n = obj[Object.keys(obj)[0]];
						return !n ? {} : !n.tag ? nested(n) : n;
					}
					return obj;
				};
				var tag = v.tag || nested(v).tag || language;

				row.addClass( 
					language === tag ?
						"translation_done" : "translation_missing" );

				$(".tr-key",row).text(k);
				$(".tr-key",row).click(jsonToggleFunc);
				$(".tr-from",row).text(tag);

				if(!v.val && (Array.isArray(v) || typeof v === "object") ){
					$(".tr-content",row).text(JSON.stringify(originalJson[k]));
				} else {
					if($("#html-rendering").is(":checked")){
						$(".tr-content",row).html(v.val);
					} else {
						$(".tr-content",row).text(v.val);
					}
				}
				$(".tr-json",row).text('{0}:{1},'.format(JSON.stringify(k), JSON.stringify(originalJson[k])));

				row.appendTo( "#tr-container" );
			});
		},
		showQuests: function(jsonData, originalJson) {
			var keys = Object.keys( jsonData );
			keys.sort();

			var language = ConfigManager.language;
			var jsonToggleFunc = function() {
				$(".tq-json", $(this).parent()).toggle();
			};

			$.each( keys, function(i,k) {
				var v = jsonData[k];
				var row = $(".factory .tq-item").clone();

				var questWikiCode = (v.code && v.code.val) ? v.code.val : "???";
				var questIdPretty = k + " (" + questWikiCode + ")";

				var questName = v.name.val;
				var questDesc = v.desc.val;
				var questMemo = v.memo ? v.memo.val : false;
				var questTrackTypes = v.trackTypes ? v.trackTypes : false;

				var questNameL = v.name.tag;
				var questDescL = v.desc.tag;

				row.addClass( 
					language === v.name.tag && language === v.desc.tag ?
						"translation_done" : "translation_missing" );

				$(".tq-key",row).text(questIdPretty);
				$(".tq-key",row).click(jsonToggleFunc);
				$(".tq-from",row).text( questNameL + "/" + questDescL);
				$(".tq-name",row).text(questName).addClass(
					language === v.name.tag ?
						"translation_done" : "translation_missing");
				$(".tq-desc",row).text(questDesc).addClass(
					language === v.desc.tag ?
						"translation_done" : "translation_missing");
				if(questMemo){
					if($("#html-rendering").is(":checked")){
						$(".tq-memo",row).html(questMemo.replace(/\n/g,"<br/>")).addClass(
							language === v.memo.tag ?
							"translation_done" : "translation_missing");
					} else {
						$(".tq-memo",row).text(questMemo.replace(/\n/g,"\\n")).addClass(
							language === v.memo.tag ?
							"translation_done" : "translation_missing");
					}
				}
				if(questTrackTypes){
					for(var index = 0; index < questTrackTypes.length; index++){
						var questTrack = $("<div/>").addClass("tq-trackTypes");
						questTrack.text("[" + index + "] " + questTrackTypes[index].val).addClass(
							language === questTrackTypes[index].tag ?
								"translation_done" : "translation_missing");
						questTrack.appendTo(row);
					}
				}

				$(".tq-json",row).text('{0}:{1},'.format(JSON.stringify(k), JSON.stringify(originalJson[k])));

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

			var defs = {
				terms: {
					callback: self.showDict
				},
				items: {
					callback: self.showDict
				},
				equiptype: {
					callback: self.showDict
				},
				useitems: {
					callback: self.showDict
				},
				ships: {
					callback: self.showDict
				},
				ship_affix: {
					callback: self.showDict
				},
				quests: {
					callback: self.showQuests
				},
				battle: {
					callback: self.showDict
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

			$("#html-rendering").click( function() {
				$("#select-json-file").change();
			});

			$("#select-json-file").change( function() {
				$("#tr-container").empty();
				$("#chk-missing-only").attr("checked",false);

				$("#error").empty().hide();
				var repo = "../../data/";
				var translation = KC3Translation.getJSONWithOptions(
					repo, this.value, true,
					ConfigManager.language,
					false,
					false,
					false);
				var translationWithSource = KC3Translation.getJSONWithOptions(
					repo, this.value, true,
					ConfigManager.language,
					false,
					false,
					true);

				var callback = defs[this.value].callback;
				callback.apply(self,[translationWithSource, translation]);
			} );

			$("#select-json-file").val("terms").change();
		}
	};
})();
