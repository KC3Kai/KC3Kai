(function(){
	"use strict";
	
	KC3StrategyTabs.quotes = new KC3StrategyTab("quotes");
	
	KC3StrategyTabs.quotes.definition = {
		tabSelf: KC3StrategyTabs.quotes,
		audio: false,
		server_ip: "",
		lines: {
			"Intro" : 1,
			"Library" : 25,
			"Poke(1)" : 2,
			"Poke(2)" : 3,
			"Poke(3)" : 4,
			"Married" : 28,
			"Wedding" : 24,
			"Ranking" : 8,
			"Join" : 13,
			"Equip(1)" : 9,
			"Equip(2)" : 10,
			"Equip(3)" : 26,
			"Supply" : 27,
			"Docking(1)" : 11,
			"Docking(2)" : 12,
			"Construction" : 5,
			"Return" : 7,
			"Sortie" : 14,
			"Battle" : 15,
			"Attack" : 16,
			"Yasen(1)" : 18,
			"Yasen(2)" : 17,
			"MVP" : 23,
			"Damaged(1)" : 19,
			"Damaged(2)" : 20,
			"Damaged(3)" : 21,
			"Sunk" : 22,
			"Idle" : 29,
			"Repair" : 6
		},
		hourlies: {
			30: "0000",
			31: "0100",
			32: "0200",
			33: "0300",
			34: "0400",
			35: "0500",
			36: "0600",
			37: "0700",
			38: "0800",
			39: "0900",
			40: "1000",
			41: "1100",
			42: "1200",
			43: "1300",
			44: "1400",
			45: "1500",
			46: "1600",
			47: "1700",
			48: "1800",
			49: "1900",
			50: "2000",
			51: "2100",
			52: "2200",
			53: "2300"
		},

		sortedVoiceNums: [
			1,25,2,3,4,28,24,8,13,9,10,26,27,11,
			12,5,7,14,15,16,18,17,23,19,20,21,22,29,6,
			30,31,32,33,34,35,36,37,38,39,40,41,
			42,43,44,45,46,47,48,49,50,51,52,53],

		descToId: {
			"Intro" : 1,
			"Library" : 25,
			"Poke(1)" : 2,
			"Poke(2)" : 3,
			"Poke(3)" : 4,
			"Married" : 28,
			"Wedding" : 24,
			"Ranking" : 8,
			"Join" : 13,
			"Equip(1)" : 9,
			"Equip(2)" : 10,
			"Equip(3)" : 26,
			"Supply" : 27,
			"Docking(1)" : 11,
			"Docking(2)" : 12,
			"Construction" : 5,
			"Return" : 7,
			"Sortie" : 14,
			"Battle" : 15,
			"Attack" : 16,
			"Yasen(1)" : 18,
			"Yasen(2)" : 17,
			"MVP" : 23,
			"Damaged(1)" : 19,
			"Damaged(2)" : 20,
			"Damaged(3)" : 21,
			"Sunk" : 22,
			"Idle" : 29,
			"Repair" : 6,
			"H0000":30, "H0100":31, "H0200":32, "H0300":33,
			"H0400":34, "H0500":35, "H0600":36, "H0700":37,
			"H0800":38, "H0900":39, "H1000":40, "H1100":41,
			"H1200":42, "H1300":43, "H1400":44, "H1500":45,
			"H1600":46, "H1700":47, "H1800":48, "H1900":49,
			"H2000":50, "H2100":51, "H2200":52, "H2300":53
		},

		/* INIT
		   Prepares all data needed
		   ---------------------------------*/
		init :function(){
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
		},

		showVoiceDetail: function(masterId,shipData,voiceNums) {
			var self = this;
			var idToDesc = {};
			$.each(self.descToId, function(k,v) {
				idToDesc[v] = k;
			});

			var repo = "../../data/";
			var quotes = KC3Translation.getQuotes(repo, true);
			var shipLines = quotes[masterId];
			var language = ConfigManager.language;
			$(".voice_list").empty();
			$(".part_right .ship_name").text("[" + masterId + "] " + shipData.api_name);
			$.each(self.sortedVoiceNums,function(i,voiceNum) {
				if (voiceNum === 6
					|| voiceNums.indexOf(voiceNum) === -1)
					return;
				
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

				if (src) {
					$(".voice",elm).text(idToDesc[voiceNum]);

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

					var sourceText = typeof src.tag === "number"
						? (state === "direct"
						   ? "Available" : "From " + KC3Master.ship(src.tag).api_name ) 
						: src.tag;

					$(".source",elm).text( sourceText  );
					$(".subtitle",elm).text( (state === "missing") ? "missing"
											 :src.val );
					$(".voice_list").append(elm);
				}				 
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

			var normalVoiceNums = [];
			$.each(self.lines, function(k,num) {
				if (k !== "Idle" && k !== "Repair")
					normalVoiceNums.push(num);
			});
			var i;
			var hourlyVoiceNums = [];
			for (i=30;i<=53;++i)
				hourlyVoiceNums.push(i);

			$.each(masterIds, function(i, masterId) {
				var shipEntity = $(".factory .ship_entity").clone();
				var shipData = allShips[masterId];
				// console.log(shipData);

				$(".ship_icon img",shipEntity).attr("src", KC3Meta.shipIcon(masterId));
				$(".ship_name",shipEntity).text("[" + masterId + "] " + shipData.api_name);

				var shipLines = quotes[masterId];
				var availableVoiceNums = normalVoiceNums.slice();
				/*jshint -W069 */
				if (shipData.api_voicef >= 1)
					availableVoiceNums.push( self.lines["Idle"] );
				/*jshint +W069 */
				if (shipData.api_voicef > 1)
					availableVoiceNums = availableVoiceNums.concat( hourlyVoiceNums );

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
