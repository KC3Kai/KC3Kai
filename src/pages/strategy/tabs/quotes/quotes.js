(function(){
	"use strict";
	
	KC3StrategyTabs.quotes = new KC3StrategyTab("quotes");
	
	KC3StrategyTabs.quotes.definition = {
		tabSelf: KC3StrategyTabs.quotes,
		audio: false,
		server_ip: "",
		/* INIT
		   Prepares all data needed
		   ---------------------------------*/
		init :function(){
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
		},

		showVoiceDetail: function(masterId,shipData,voiceNums) {
			var self = this;
			var repo = "../../data/";
			var quotes = KC3Translation.getQuotes(repo, true);
			var shipLines = quotes[masterId];
			var language = ConfigManager.language;
			$(".voice_list").empty();
			$(".part_right .ship_name").text("[" + masterId + "] " + shipData.api_name);

			var allVoiceNums = KC3Translation.getShipVoiceNums(masterId);
			$.each(allVoiceNums,function(i,voiceNum) {
				var elm = $(".factory .voice_entity").clone();

				var state;
				var src;
				if (shipLines && shipLines[voiceNum]) {
					src = shipLines[voiceNum];
					if (src && typeof src.tag === "number") {
						state = (src.tag === masterId) ? "direct" : "inherit";
					} else if (src && language === "en" && src.tag === "en") {
						state = "direct";
					}
				} else {
					state = "missing";
				}
				elm.addClass(state);

				$(".voice",elm).text(KC3Translation.voiceNumToDesc(voiceNum));

				$(".voice",elm).on("click", function() {
					var currentGraph = KC3Master.graph(masterId).api_filename;
					if(self.audio){ self.audio.pause(); }
					var voiceFile = KC3Meta.getFilenameByVoiceLine(masterId ,voiceNum, 10);
					console.log(voiceFile);
					var voiceSrc = "http://"+self.server_ip
						+ "/kcs/sound/kc"+currentGraph+"/"+voiceFile+".mp3";
					self.audio = new Audio(voiceSrc);
						self.audio.play();
				});

				var sourceText;
				if (src) {
					sourceText = typeof src.tag === "number"
						? (state === "direct"
						   ? "Available" : "From " + KC3Master.ship(src.tag).api_name ) 
					    : src.tag;
				} else {
					sourceText = "missing";
				}
				$(".source",elm).text( sourceText  );
				$(".subtitle",elm).text( (state === "missing") ? "missing"
										 :src.val );
				$(".voice_list").append(elm);
			});
		},
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute: function() {
			var self = this;
			var allShips = KC3Master.all_ships();
			var masterIds = Object
				  .keys( allShips )
				  .map( function(x) { return parseInt(x,10); })
				  .filter( function(x) { return x < 500; } )
				  .sort( function(a,b) { return a-b; });

			var shipList = $(".ship_list");

			var repo = "../../data/";
			var quotes = KC3Translation.getQuotes(repo, true);

			$.each(masterIds, function(i, masterId) {
				var shipEntity = $(".factory .ship_entity").clone();
				var shipData = allShips[masterId];

				$(".ship_icon img",shipEntity).attr("src", KC3Meta.shipIcon(masterId));
				$(".ship_name",shipEntity).text("[" + masterId + "] " + shipData.api_name);

				var shipLines = quotes[masterId];
				var availableVoiceNums = KC3Translation.getShipVoiceNums(masterId);

				var language = ConfigManager.language;
				var directCount = 0;
				var inheritedCount = 0;
				if (shipLines) {
					$.each(availableVoiceNums, function(i,num) {
						var src = shipLines[num];
						if (src && typeof src.tag === "number") {
							if (src.tag === masterId) {
								directCount = directCount + 1;
							} else {
								inheritedCount = inheritedCount + 1;
							}
						} else if (src && language === "en" && src.tag === "en") {
							directCount = directCount + 1;
						}
					});
				}
				var total = availableVoiceNums.length;
				$(".ship_pg_val1", shipEntity)
					.css("width", Math.floor(150 * directCount / total	) +"px");
				$(".ship_pg_val2", shipEntity)
					.css("width", Math.floor(150 * inheritedCount / total  ) +"px");

				shipEntity.on("click", function() {
					self.showVoiceDetail(masterId,shipData,availableVoiceNums);
				});
				shipEntity.attr("id",masterId);
				shipList.append( shipEntity );
			});

			$(".ship_list #318").trigger("click");

		}
	};
})();
