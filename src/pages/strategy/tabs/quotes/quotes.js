(function(){
	"use strict";
	
	KC3StrategyTabs.quotes = new KC3StrategyTab("quotes");
	
	KC3StrategyTabs.quotes.definition = {
		gameServer: {},
		repo_loc: "../../data/",
		enQuotes: [],
		jpQuotes: [],
		clQuotes: [],
		showFriendLines: false,
		subtitleLang: "",
		
		init :function() {
			this.gameServer = PlayerManager.hq.getServer();
		},
		reload: function() {
			ConfigManager.load();
			this.subtitleLang = ConfigManager.subtitle_lang || ConfigManager.language;
			this.enQuotes = [];
			if(this.subtitleLang !== "en")
				this.enQuotes = KC3Translation.getQuotes(this.repo_loc, false, "en", false, false);
			this.jpQuotes = [];
			if(this.subtitleLang !== "jp")
				this.jpQuotes = KC3Translation.getQuotes(this.repo_loc, false, "jp", false, false);
			this.reloadQuotes();
		},
		buildShipName: function(masterId, shipData) {
			return "[{0}] {1}".format(masterId, shipData ? KC3Meta.shipName(shipData.api_name) : KC3Meta.shipNameById(masterId));
		},
		reloadQuotes: function() {
			KC3Meta.loadQuotes();
			this.clQuotes = KC3Translation.getQuotes(this.repo_loc, true, this.subtitleLang);
		},
		showVoiceDetail: function(masterId) {
			const self = this;
			$("#error").empty().hide();
			masterId = Number(masterId) || 318;
			const shipLines = this.clQuotes[masterId];
			const shipData = KC3Master.ship(masterId);
			$(".voice_list").html("");
			$(".ship_info .ship_name").text(this.buildShipName(masterId))
				.data("id", masterId).addClass("hover").off("click").click(function(){
				KC3StrategyTabs.gotoTab("mstship", $(this).data("id") );
			});
			$(".ship_info .reload").off("click").click(function(){
				self.reloadQuotes();
				self.showVoiceDetail( $(".ship_info .ship_name").data("id") );
			});
			const toNextFunc = function(){
				if(!!$(this).data("asid")){
					self.scrollShipListTop( $(this).data("asid") );
					KC3StrategyTabs.gotoTab(null, $(this).data("asid") );
				}
			};
			if(shipData.api_aftershipid){
				$(".ship_info .after_ship").data("asid", shipData.api_aftershipid)
					.off("click").click(toNextFunc).show();
			} else {
				$(".ship_info .after_ship").off("click").hide();
			}
			$(".ship_info .friend_lines").off("click").click(function(){
				self.showFriendLines = !self.showFriendLines;
				self.showVoiceDetail( $(".ship_info .ship_name").data("id") );
			});
			const toFromFunc = function(){
				self.scrollShipListTop($(this).data("sid"));
				KC3StrategyTabs.gotoTab(null, $(this).data("sid"));
			};
			const toggleSrcFunc = function(){
				$(".ref_sub", $(this).parent()).slideToggle(200);
			};
			const toQuoteHtmlLines = (quote, showDelayTime = true) => {
				if($.type(quote) === "string") return quote;
				return Object.keys(quote)
					.map(k => ((showDelayTime ? "({1}) " : "") + "{0}").format(quote[k], k))
					.join("</br>");
			};

			const allVoiceNums = KC3Translation.getShipVoiceNums(masterId, true, true, self.showFriendLines);
			const voiceTemplate = $(".factory .voice_entity");
			$.each(allVoiceNums,function(i,voiceNum) {
				const elm = voiceTemplate.clone();

				var state;
				var src;
				if (shipLines && shipLines[voiceNum]) {
					src = shipLines[voiceNum];
					if (src && typeof src.tag === "number") {
						state = (src.tag === masterId) ? "direct" : "inherit";
					} else if (src && self.subtitleLang === "en" && src.tag === "en") {
						state = "direct";
					}
				} else {
					state = "missing";
				}
				elm.addClass(state);

				const voiceFile = KC3Meta.getFilenameByVoiceLine(masterId, voiceNum);
				const voiceLine = KC3Meta.getVoiceLineByFilename(masterId, voiceFile);
				$(".voice",elm).text( "{0} [{1}]".format(KC3Translation.voiceNumToDesc(voiceNum), voiceNum) )
					.data("voiceFile", voiceFile)
					.data("voiceLine", voiceLine)
					.on("click", function() {
					const currentGraph = KC3Master.graph(masterId).api_filename;
					const voiceFile = $(this).data("voiceFile");
					const voiceLine = $(this).data("voiceLine");
					console.debug("VOICE: shipId, voiceNum, voiceFile, voiceLine", masterId,
						voiceNum, voiceFile, voiceLine);
					const voiceSrc = `${self.gameServer.urlPrefix}/kcs/sound/kc${currentGraph}/${voiceFile}.mp3`;
					if($(".voice_list .player audio").length){
						$(".voice_list .player audio").each((_, a) => {a.pause();});
					}
					$(".voice_list .player").empty();
					$(".voice_list .subtitle").removeClass("playing");
					const player = $('<audio controls autoplay controlslist="nodownload"><source/></audio>');
					$("source", player).attr("src", voiceSrc);
					$(".player", elm).html(player);
					const audio = player.get(0);
					audio.onloadedmetadata = function() {
						$(this).parent().append('<span>{0}</span>'.format(Math.round(this.duration * 1000)));
					};
					audio.ontimeupdate = function() {
						$("span", $(this).parent()).text('{0}/{1}'
							.format(Math.round(this.currentTime * 1000), Math.round(this.duration * 1000)));
					};
					audio.onplay = function() {
						$(".subtitle", elm).addClass("playing");
					};
					audio.onended = function() {
						$(".subtitle", elm).removeClass("playing");
					};
				});

				var sourceText = "missing";
				if(src) {
					sourceText = typeof src.tag === "number"
						? (state === "direct" ? "Available" : "From " + self.buildShipName(src.tag) )
						: src.tag;
				}
				$(".source",elm).text(sourceText);
				if(sourceText.startsWith("From ")){
					$(".source",elm).addClass("hover").data("sid", src.tag);
					$(".source",elm).click(toFromFunc);
				}
				const subtitleText = state === "missing" ? "missing" : toQuoteHtmlLines(src.val);
				$(".subtitle",elm).html(subtitleText);
				$(".division",elm).click(toggleSrcFunc);
				if(self.enQuotes && self.enQuotes[masterId] && self.enQuotes[masterId][voiceNum]){
					$(".en_src",elm).html(toQuoteHtmlLines(self.enQuotes[masterId][voiceNum], true));
				}
				if(self.jpQuotes && self.jpQuotes[masterId] && self.jpQuotes[masterId][voiceNum]){
					$(".jp_src",elm).html(toQuoteHtmlLines(self.jpQuotes[masterId][voiceNum], false));
				}
				const seasonalKeys = Object.keys(shipLines).filter(k => k.startsWith(voiceNum + '@'));
				if(seasonalKeys.length){
					let spQuotes = "";
					seasonalKeys.forEach(key => {
						spQuotes += "<b>[{0}]</b> {1}"
							.format(key.slice(key.indexOf('@') + 1), toQuoteHtmlLines(shipLines[key].val))
							+ "<br/>";
					});
					$(".seasonal",elm).html(spQuotes).show();
				}
				$(".voice_list").append(elm);
			});
		},
		execute: function() {
			const self = this;
			const allShips = KC3Master.all_ships();
			const masterIds = Object.keys( allShips )
				.map( id => parseInt(id, 10) )
				.filter( id => KC3Master.isRegularShip(id) )
				.sort( (a, b) => a - b );

			const shipList = $(".ship_list");
			const quotes = KC3Translation.getQuotes(this.repo_loc, true, undefined, true);

			const shipTemplate = $(".factory .ship_entity");
			$.each(masterIds, function(i, masterId) {
				const shipEntity = shipTemplate.clone();
				const shipData = allShips[masterId];

				const graphFilename = KC3Master.graph(masterId).api_filename;
				$(".ship_icon img",shipEntity).attr("src", KC3Meta.shipIcon(masterId));
				$(".ship_name",shipEntity).text(self.buildShipName(masterId, shipData))
					.attr("title", graphFilename);
				$(".ship_graph",shipEntity).text(graphFilename);

				const shipLines = quotes[masterId];
				const availableVoiceNums = KC3Translation.getShipVoiceNums(masterId);

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
						} else if (src && self.subtitleLang === "en" && src.tag === "en") {
							directCount = directCount + 1;
						}
					});
				}
				const total = availableVoiceNums.length;
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
			const innerHeight = Math.max(480, window.innerHeight) - 60;
			if(innerHeight > 400){
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
			setTimeout(function(){self.scrollShipListTop();}, 500);
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
			const shipList = $(".ship_list");
			const shipItem = $(".ship_list .ship_entity#{0}"
				.format(shipId || $(".ship_info .ship_name").data("id"))
			);
			const scrollTop = shipItem.length === 1 ?
				(shipItem.offset().top
				 + shipList.scrollTop()
				 - shipList.offset().top) : 0;
			shipList.scrollTop(scrollTop);
		}
	};
})();
