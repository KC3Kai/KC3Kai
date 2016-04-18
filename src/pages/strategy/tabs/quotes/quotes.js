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
		buildShipName: function(masterId, shipData) {
			return "[{0}] {1}".format(masterId, KC3Meta.shipName((shipData||KC3Master.ship(masterId)).api_name) );
		},
		showVoiceDetail: function(masterId, shipData, voiceNums) {
			var self = this;
			var repo = "../../data/";
			var quotes = KC3Translation.getQuotes(repo, true);
			masterId = Number(masterId) || 318;
			var shipLines = quotes[masterId];
			var language = ConfigManager.language;
			shipData = shipData || KC3Master.ship(masterId);
			voiceNums = voiceNums || KC3Translation.getShipVoiceNums(masterId);
			$(".voice_list").empty();
			$(".ship_info .ship_name").text( this.buildShipName(masterId, shipData) );
			$(".ship_info .ship_name").data("id", masterId);
			$(".ship_info .reload").click(function(){
				self.showVoiceDetail( $(".ship_info .ship_name").data("id") );
			});

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

				$(".voice",elm).text( "{0} [{1}]".format(KC3Translation.voiceNumToDesc(voiceNum), voiceNum) );

				$(".voice",elm).on("click", function() {
					var currentGraph = KC3Master.graph(masterId).api_filename;
					if(self.audio){ self.audio.pause(); }
					var voiceFile = KC3Meta.getFilenameByVoiceLine(masterId ,voiceNum, 10);
					console.debug("VOICE: shipId, voiceNum, voiceFile", masterId, voiceNum, voiceFile);
					var voiceSrc = "http://"+self.server_ip
						+ "/kcs/sound/kc"+currentGraph+"/"+voiceFile+".mp3";
					self.audio = new Audio(voiceSrc);
					self.audio.play();
				});

				var sourceText;
				if (src) {
					sourceText = typeof src.tag === "number"
						? (state === "direct"
						   ? "Available" : "From " + self.buildShipName(src.tag) )
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
				$(".ship_name",shipEntity).text( self.buildShipName(masterId, shipData) );

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
					KC3StrategyTabs.gotoTab(null, $(this).attr("id"));
				});
				shipEntity.attr("id",masterId);
				shipList.append( shipEntity );
			});

			// Auto fit height of screen
			var innerHeight = Math.max(480, window.innerHeight) - (
				$("#content").position().top+$(".page_title").position().top+$(".page_title").height()+$(".page_padding").position().top+20
			);
			if(innerHeight>0){
				$(".tab_quotes .ship_list").css("height", innerHeight+"px");
				$(".tab_quotes .part_right").css("height", innerHeight+"px");
				$(".tab_quotes .voice_list").css("height", (innerHeight-32)+"px");
			}

			if(!!KC3StrategyTabs.pageParams[1]){
				this.showVoiceDetail(KC3StrategyTabs.pageParams[1]);
			}else{
				this.showVoiceDetail();
			}
		}
	};
})();
