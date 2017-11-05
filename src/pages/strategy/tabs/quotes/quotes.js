(function(){
	"use strict";
	
	KC3StrategyTabs.quotes = new KC3StrategyTab("quotes");
	
	KC3StrategyTabs.quotes.definition = {
		audio: false,
		server_ip: "",
		repo_loc: "../../data/",
		enQuotes: [],
		jpQuotes: [],
		
		init :function() {
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
		},
		reload: function() {
			ConfigManager.load();
			this.enQuotes = [];
			if(ConfigManager.language !== "en")
				this.enQuotes = KC3Translation.getQuotes(this.repo_loc, false, "en", false, false);
			this.jpQuotes = [];
			if(ConfigManager.language !== "jp")
				this.jpQuotes = KC3Translation.getQuotes(this.repo_loc, false, "jp", false, false);
		},
		buildShipName: function(masterId, shipData) {
			return "[{0}] {1}".format(masterId, KC3Meta.shipName((shipData||KC3Master.ship(masterId)).api_name) );
		},
		showVoiceDetail: function(masterId) {
			var self = this;
			var language = ConfigManager.language;
			$("#error").empty().hide();
			KC3Meta.loadQuotes();
			var quotes = KC3Translation.getQuotes(this.repo_loc, true);
			masterId = Number(masterId) || 318;
			var shipLines = quotes[masterId];
			var shipData = KC3Master.ship(masterId);
			$(".voice_list").empty();
			$(".ship_info .ship_name").text( this.buildShipName(masterId, shipData) );
			$(".ship_info .ship_name").data("id", masterId);
			$(".ship_info .ship_name").addClass("hover").off("click").click(function(){
				KC3StrategyTabs.gotoTab("mstship", $(this).data("id") );
			});
			$(".ship_info .reload").off("click").click(function(){
				self.showVoiceDetail( $(".ship_info .ship_name").data("id") );
			});
			var toNextFunc = function(){
				if(!!$(this).data("asid")){
					self.scrollShipListTop( $(this).data("asid") );
					KC3StrategyTabs.gotoTab(null, $(this).data("asid") );
				}
			};
			if(shipData.api_aftershipid){
				$(".ship_info .after_ship").data("asid", shipData.api_aftershipid);
				$(".ship_info .after_ship").off("click").click(toNextFunc);
				$(".ship_info .after_ship").show();
			} else {
				$(".ship_info .after_ship").off("click");
				$(".ship_info .after_ship").hide();
			}
			var toFromFunc = function(){
				self.scrollShipListTop($(this).data("sid"));
				KC3StrategyTabs.gotoTab(null, $(this).data("sid"));
			};
			var toggleSrcFunc = function(){
				$(".ref_sub", $(this).parent()).slideToggle(200);
			};

			var allVoiceNums = KC3Translation.getShipVoiceNums(masterId, true, true);
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
				var voiceFile = KC3Meta.getFilenameByVoiceLine(masterId, voiceNum);
				var voiceLine = KC3Meta.getVoiceLineByFilename(masterId, voiceFile);
				$(".voice",elm).data("voiceFile", voiceFile);
				$(".voice",elm).data("voiceLine", voiceLine);

				$(".voice",elm).on("click", function() {
					var currentGraph = KC3Master.graph(masterId).api_filename;
					if(self.audio){ self.audio.pause(); }
					var voiceFile = $(this).data("voiceFile");
					var voiceLine = $(this).data("voiceLine");
					console.debug("VOICE: shipId, voiceNum, voiceFile, voiceLine", masterId,
						voiceNum, voiceFile, voiceLine);
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
				$(".source",elm).text( sourceText );
				if(sourceText.startsWith("From ")){
					$(".source",elm).addClass("hover").data("sid", src.tag);
					$(".source",elm).click(toFromFunc);
				}
				var subtitle = "";
				if(state === "missing")
					subtitle = "missing";
				else if (!(typeof src.val === 'string' || src.val instanceof String)) {
					var subtitles = [];
					$.each(src.val, function (delay, line) {
						subtitles.push(line);
					});
					subtitle = subtitles.join("</br>");
				} else
					subtitle = src.val;

				$(".subtitle",elm).html(subtitle);
				$(".division",elm).click(toggleSrcFunc);
				if(self.enQuotes && self.enQuotes[masterId] && self.enQuotes[masterId][voiceNum]){
					$(".en_src",elm).text(self.enQuotes[masterId][voiceNum]);
				}
				if(self.jpQuotes && self.jpQuotes[masterId] && self.jpQuotes[masterId][voiceNum]){
					$(".jp_src",elm).text(self.jpQuotes[masterId][voiceNum]);
				}
				const seasonalKeys = Object.keys(shipLines).filter(k => k.startsWith(voiceNum + '@'));
				if(seasonalKeys.length){
					let spQuotes = "";
					seasonalKeys.forEach(key => {
						spQuotes += "<b>[{0}]</b> {1}"
							.format(key.slice(key.indexOf('@') + 1), shipLines[key].val) +
							"<br/>";
					});
					$(".seasonal",elm).html(spQuotes).show();
				}
				$(".voice_list").append(elm);
			});
		},
		execute: function() {
			var self = this;
			var allShips = KC3Master.all_ships();
			var masterIds = Object
				  .keys( allShips )
				  .map( id => parseInt(id, 10) )
				  .filter( id => KC3Master.isRegularShip(id) )
				  .sort( (a, b) => a - b );

			var shipList = $(".ship_list");
			var quotes = KC3Translation.getQuotes(this.repo_loc, true, undefined, true);

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

			// Try to auto fit the height of window
			var innerHeight = Math.max(480, window.innerHeight) - 60;
			if(innerHeight>400){
				$(".tab_quotes .ship_list").css("height", innerHeight+"px");
				$(".tab_quotes .part_right").css("height", innerHeight+"px");
				$(".tab_quotes .voice_list").css("height", (innerHeight-32)+"px");
			}

			if(!!KC3StrategyTabs.pageParams[1]){
				this.showVoiceDetail(KC3StrategyTabs.pageParams[1]);
			}else{
				this.showVoiceDetail();
			}

			if(!!KC3StrategyTabs.pageParams[1]){
				this.showVoiceDetail(KC3StrategyTabs.pageParams[1]);
			}else{
				this.showVoiceDetail();
			}

			// Scroll list top to selected ship
			setTimeout(function(){self.scrollShipListTop();}, 0);
		},
		update: function(pageParams) {
			if(!!pageParams[1]){
				this.showVoiceDetail(pageParams[1]);
			}else{
				this.showVoiceDetail();
			}
			return true;
		},
		scrollShipListTop: function(shipId) {
			var shipList = $(".ship_list");
			var shipItem = $(".ship_list .ship_entity#{0}"
				.format(shipId || $(".ship_info .ship_name").data("id"))
			);
			var scrollTop = shipItem.length === 1 ?
				(shipItem.offset().top
				 + shipList.scrollTop()
				 - shipList.offset().top) : 0;
			shipList.scrollTop(scrollTop);
		}
	};
})();
