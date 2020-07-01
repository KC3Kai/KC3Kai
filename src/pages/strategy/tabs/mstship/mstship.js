(function(){
	"use strict";
	
	KC3StrategyTabs.mstship = new KC3StrategyTab("mstship");
	
	KC3StrategyTabs.mstship.definition = {
		tabSelf: KC3StrategyTabs.mstship,
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
		currentGraph: "",
		currentShipId: 0,
		currentCardVersion: "",
		audio: false,
		server_ip: "",
		atLvlSlider: null,
		// placeholder, the real function is set during "execute()"
		// atLevelChange(newLevel) updates info on UI
		// with current ship & specified new level
		atLevelChange: null,
		// Merged master ship data with abyssal stats and seasonal CGs
		mergedMasterShips: {},
		damagedBossFileSuffix: "_d",
		
		/* INIT
		Prepares static data needed
		---------------------------------*/
		init :function(){
			KC3Meta.loadQuotes();
			var MyServer = (new KC3Server()).setNum( PlayerManager.hq.server );
			this.server_ip = MyServer.ip;
			// Ship master data will not changed frequently
			this.mergedMasterShips = KC3Master.all_ships(true, true);
		},
		
		/* RELOAD
		Prepares latest in game data
		---------------------------------*/
		reload :function(){
			ConfigManager.load();
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			$(".tab_mstship .runtime_id").text(chrome.runtime.id);
			var self = this;

			$(".stat_icon img").each((_, img) => {
				$(img).attr("src", KC3Meta.statIcon($(img).parent().data("stat")));
			});
			// slider setup for level-dependent stats
			self.atLvlSlider = $("input#at-level-slider");
			// create a dummy slider, this will be destroyed once there's something
			// to be displayed.
			self.atLvlSlider.slider();
			var sliderLevel = $(".at_level .level-val");
			var sliderDetail = $(".at_level .stat-detail");
			self.atLevelChange = function atLevelChange(newLevel) {
				sliderLevel.text( newLevel );
				var aswBound = WhoCallsTheFleetDb.getStatBound( self.currentShipId, 'asw' );
				var losBound = WhoCallsTheFleetDb.getStatBound( self.currentShipId, 'los' );
				var evsBound = WhoCallsTheFleetDb.getStatBound( self.currentShipId, 'evasion' );
				
				var asw = WhoCallsTheFleetDb.estimateStat(aswBound, newLevel);
				var los = WhoCallsTheFleetDb.estimateStat(losBound, newLevel);
				var evs = WhoCallsTheFleetDb.estimateStat(evsBound, newLevel);
				
				function ppr(v) { return v === false ? "???" : String(v); }
				$(".asw", sliderDetail).text( ppr(asw) );
				$(".los", sliderDetail).text( ppr(los) );
				$(".evs", sliderDetail).text( ppr(evs) );
			};

			// List all ships
			$.each(this.mergedMasterShips, function(index, shipData){
				if(!shipData) { return true; }
				const shipBox = $(".tab_mstship .factory .shipRecord").clone()
					.appendTo(".tab_mstship .shipRecords");
				const id = shipData.api_id;
				shipBox.attr("data-id", id);
				shipBox.data("bs", shipData.kc3_bship);
				$("img", shipBox).attr("src", KC3Master.isAbyssalShip(id) ?
					KC3Meta.abyssIcon(id) : KC3Meta.shipIcon(id)
				);
				const shipName = KC3Master.isAbyssalShip(id) ?
					KC3Meta.abyssShipName(id) : KC3Meta.shipName(shipData.api_name);
				$(".shipName", shipBox).text(`[${id}] ${shipName}`)
					.attr("title", shipName);
				
				if(ConfigManager.salt_list.indexOf(shipData.kc3_bship) >= 0) {
					shipBox.addClass('salted');
				}
			});
			$(".tab_mstship .shipRecords").createChildrenTooltips();
			
			// Select ship
			$(".tab_mstship .shipRecords .shipRecord").on("click", function(){
				var sid = $(this).data("id");
				if( sid != self.currentShipId ){
					KC3StrategyTabs.gotoTab(null, sid);
				}
			});
			
			// Play voice
			$(".tab_mstship .shipInfo .voices, .tab_mstship .shipInfo .hourlies").on("click", ".voice", function(){
				if(self.audio){ self.audio.pause(); }
				var vnum = Number($(this).data("vnum"));
				var voiceFile = KC3Meta.getFilenameByVoiceLine(self.currentShipId, vnum);
				$(".tab_mstship .shipInfo .subtitles").show();
				if(!voiceFile || voiceFile==100000){
					$(".tab_mstship .shipInfo .subtitles").html("This voice is currently disabled to be replayable in KC3Kai");
					return true;
				}
				var shipVersions = KC3Master.graph(self.currentShipId).api_version || [];
				var isPortVoices = vnum >= 2 && vnum <= 4;
				// 0: ship card version, 1: voice version, 2: poke voice version?
				var soundVersion = shipVersions[isPortVoices ? 2 : 1] || 1;
				var voiceSrc = "http://"+self.server_ip
							+ "/kcs/sound/kc"+self.currentGraph+"/"+voiceFile+".mp3"
							+ (soundVersion > 1 ? "?version=" + soundVersion : "");
				var voiceSize = 0;
				var playAndShowSubtitle = function(){
					// Playback voice audio file
					if(self.audio) { self.audio.pause(); }
					self.audio = new Audio(voiceSrc);
					self.audio.play();
					// Emulate subtitles
					var shipGirl = KC3Master.graph_file(self.currentGraph);
					var voiceLine = KC3Meta.getVoiceLineByFilename(shipGirl, voiceFile);
					var quote = KC3Meta.quote( shipGirl, voiceLine, voiceSize );
					
					console.debug("Playing subtitle: shipId, vnum, voiceLine, voiceFile, voiceSize:",
						shipGirl, vnum, voiceLine, voiceFile, voiceSize);
					if(quote){
						var quoteText = $.type(quote) === "string" ? quote
							: Object.keys(quote).map(k => quote[k]).join("</br>");
						$(".tab_mstship .shipInfo .subtitles").html(quoteText);
					} else {
						$(".tab_mstship .shipInfo .subtitles").html(
							"Quote not found yet for: ship={0}, vnum={1}, vline={2}"
								.format(shipGirl, vnum, voiceLine)
						);
					}
				};
				// Get audio file size first for seasonal Poke(1/2/3)
				if(isPortVoices){
					$.ajax({
						type: "HEAD",
						url: voiceSrc,
						async: true,
						success: (data, status, xhr) => {
							voiceSize = parseInt(xhr.getResponseHeader("Content-Length"), 10) || 0;
							playAndShowSubtitle();
						},
						error: (xhr, status, error) => {
							// try to playback even head failed, since cache may be hit
							playAndShowSubtitle();
						}
					});
				} else {
					playAndShowSubtitle();
				}
			});
			
			// On-click remodels
			$(".tab_mstship .shipInfo").on("click", ".remodel_name a", function(e){
				var sid = $(this).data("sid");
				self.scrollShipListTop(sid);
				KC3StrategyTabs.gotoTab(null, sid);
				e.preventDefault();
				return false;
			});
			// On-click other forms
			$(".tab_mstship .shipInfo").on("click", ".more .other_forms a", function(e){
				var sid = $(this).data("sid");
				self.scrollShipListTop(sid);
				KC3StrategyTabs.gotoTab(null, sid);
				e.preventDefault();
				return false;
			});
			// On-click seasonal CG links
			$(".tab_mstship .shipInfo").on("click", ".more .seasonal_cg a", function(e){
				var sid = $(this).data("sid");
				//self.scrollShipListTop(sid);
				KC3StrategyTabs.gotoTab(null, sid);
				e.preventDefault();
				return false;
			});
			
			// CG Notice can be dismissed
			/*
			if(!ConfigManager.dismissed_hints.cg_notice){
				$(".cg_notes").show();
				$(".cg_notes").on("click", function(e){
					ConfigManager.loadIfNecessary();
					ConfigManager.dismissed_hints.cg_notice = true;
					ConfigManager.save();
					// To keep URL for copying, do not disappear
					//$(".cg_notes").fadeOut();
					// Just change color to feed-back the action
					$(".cg_notes").css("background-color", "#f9f2f4");
					$(".cg_notes").attr("title", "Dismissed, will not be shown next time. But can always be found at Help Topics.");
				});
			}
			*/
			
			// Fold/unfold sections like a accordion widget
			$(".tab_mstship .shipInfo .accordion .head").on("click", function(e){
				$(this).next().slideToggle();
				return false;
			}).next().hide();
			
			// View big CG mode of our shipgirl
			$(".tab_mstship .shipInfo .cgswf .big_mode").on("click", function(e){
				if(KC3Master.isRegularShip(self.currentShipId)){
					self.showShip(self.currentShipId, false, true);
				}
			});
			
			// Show damaged CG of shipgirl or abyssal boss
			$(".tab_mstship .shipInfo .cgswf .dmg_mode").on("click", function(e){
				self.showShip(self.currentShipId, true, false);
			});
			
			// View all CG types
			$(".tab_mstship .shipInfo .type").on("click", function(e){
				self.showShip(self.currentShipId, false, false, true);
			});
			
			// Link to quotes developer page
			if(ConfigManager.devOnlyPages){
				$(".tab_mstship .shipInfo").on("click", ".to-quotes", function(e){
					KC3StrategyTabs.gotoTab("quotes", self.currentShipId);
				});
			}
			
			// Salt-toggle
			$(".tab_mstship .shipInfo").on("click", ".salty-zone", function(e){
				var
					saltList = ConfigManager.salt_list,
					shipData = KC3Master.ship(self.currentShipId),
					saltPos  = saltList.indexOf(shipData.kc3_bship),
					shipBox  = $(".shipRecord").filter(function(i,x){
						return shipData.kc3_bship == $(x).data('bs');
					});
				if(saltPos >= 0) {
					saltList.splice(saltPos,1);
					shipBox.removeClass('salted');
				} else {
					saltList.push(shipData.kc3_bship);
					shipBox.addClass('salted');
				}
				ConfigManager.save();
				e.preventDefault();
				self.showShip( shipData.api_id );
				return false;
			});
			
			// Link to ship specified by URL hash
			if(!!KC3StrategyTabs.pageParams[1]){
				this.showShip(KC3StrategyTabs.pageParams[1]);
				// Also expand unfolded section
				if(KC3StrategyTabs.pageParams.indexOf("aaci") > 1){
					$(".tab_mstship .shipInfo .aaci").parent().show();
				}
				if(KC3StrategyTabs.pageParams.indexOf("gunfit") > 1){
					$(".tab_mstship .shipInfo .gunfit").parent().show();
				}
			}else{
				this.showShip();
			}
			
			// Scroll list top to selected ship
			setTimeout(function(){self.scrollShipListTop();}, 0);
		},
		
		/* UPDATE: optional
		Partially update elements of the interface,
			possibly without clearing all contents first.
		Be careful! Do not only update new data,
			but also handle the old states (do cleanup).
		Return `false` if updating all needed,
			EXECUTE will be invoked instead.
		---------------------------------*/
		update :function(pageParams){
			if(!!pageParams && !!pageParams[1]){
				this.showShip(pageParams[1]);
			}else{
				this.showShip();
			}
			// Tell tab manager: Have handled the updating, don't re-execute the rendering
			return true;
		},
		
		scrollShipListTop :function(shipId){
			var shipList = $(".tab_mstship .shipRecords");
			var shipItem = $(".tab_mstship .shipRecords .shipRecord[data-id={0}]"
				.format(shipId || this.currentShipId)
			);
			var scrollTop = shipItem.length === 1 ?
				(shipItem.offset().top
				 + shipList.scrollTop()
				 - shipList.offset().top) : 0;
			shipList.scrollTop(scrollTop);
		},

		showShip :function(ship_id, switchDamagedGraph, switchCgView, switchAllGraphs){
			ship_id = Number(ship_id || "405");
			const self = this,
				shipData = this.mergedMasterShips[ship_id],
				saltState = function(){
					return ConfigManager.info_salt && shipData.kc3_bship && ConfigManager.salt_list.indexOf(shipData.kc3_bship)>=0;
				},
				denyTerm = function(){
					return ["MasterShipSalt","Un","Check"].filter(function(str,i){
						return ((i==1) && !saltState()) ? "" : str;
					}).join('');
				},
				saltClassUpdate = function(){
					if(saltState())
						$(".tab_mstship .shipInfo").addClass('salted');
					else
						$(".tab_mstship .shipInfo").removeClass('salted');
				};
			if(this.currentShipId !== ship_id){
				this.tryDamaged = false;
				this.tryBigMode = false;
			}
			if(switchDamagedGraph) this.tryDamaged = !this.tryDamaged;
			if(switchCgView) this.tryBigMode = !this.tryBigMode;
			const viewCgMode = !!this.tryBigMode;
			const tryDamagedGraph = !!this.tryDamaged;
			const showAllGraphs = switchAllGraphs && !$(".tab_mstship .shipInfo .basic .cglist").length;
			this.currentShipId = ship_id;

			console.debug("Viewing shipData", shipData);
			if(!shipData) { return; }
			
			const gearClickFunc = function(e) {
				KC3StrategyTabs.gotoTab("mstgear", $(this).data("id") || $(this).attr("alt"));
			};
			$(".tab_mstship .shipInfo .name").text( "[{0}] {1} {2}"
				.format(ship_id,
					KC3Master.isRegularShip(ship_id) ?
						ConfigManager.info_ship_class_name ?
							KC3Meta.term("ShipListFullNamePattern").format(
								KC3Meta.ctypeName(shipData.api_ctype), KC3Meta.shipName(shipData.api_name)) :
							KC3Meta.shipName(shipData.api_name) :
						KC3Master.isAbyssalShip(ship_id) ?
							KC3Meta.abyssShipName(ship_id) :
							KC3Meta.shipName(shipData.api_name),
					KC3Master.isAbyssalShip(ship_id) ? "" : KC3Meta.shipReadingName(shipData.api_yomi)
			) ).attr("title",
				KC3Master.isRegularShip(ship_id) ?
					ConfigManager.info_ship_class_name ?
						$(".tab_mstship .shipInfo .name").text() : // Show whole text field
						KC3Meta.ctypeName(shipData.api_ctype) : // Show ship class name
					KC3Master.isAbyssalShip(ship_id) ?
						KC3Meta.abyssShipName(ship_id) : // For Abyssal ships
						KC3Meta.shipName(shipData.api_name) // For Seasonal CGs
			).lazyInitTooltip();
			$(".tab_mstship .shipInfo .type").text( "{0}".format(KC3Meta.stype(shipData.api_stype)) );
			$(".tab_mstship .shipInfo .json").text( '"{0}":{1}'.format(ship_id, JSON.stringify(shipData)) );
			
			// CG VIEWER
			var shipFile = KC3Master.graph(ship_id).api_filename;
			// Changed to an Array from 2016-04-01
			var shipVersions = KC3Master.graph(ship_id).api_version || [];
			//console.debug("shipgraph.api_version", shipVersions);
			this.currentGraph = shipFile;
			this.currentCardVersion = shipVersions[0];
			
			// old swf url
			var shipSrc = "../../../../assets/swf/card.swf?sip=" + this.server_ip
					+ ("&shipFile=" + shipFile + (tryDamagedGraph ? this.damagedBossFileSuffix : ""))
					+ ("&abyss=" + (KC3Master.isAbyssalShip(ship_id) ? 1 : 0))
					+ (!this.currentCardVersion ? "" : "&ver=" + this.currentCardVersion);
			if(KC3Master.isSeasonalShip(ship_id)){
				shipSrc += "&forceFrame=8";
				// try to make it center
				shipSrc += "&forceX=-40&forceY=-80";
			} else if(KC3Master.isAbyssalShip(ship_id)){
				// get shipgraph battle offset
				let [x, y] = KC3Master.graph(ship_id).api_battle_n;
				// 0.4 is card default scale, try to center it by [-15, -15]
				x = Math.floor(x * 0.4) - 15; y = Math.floor(y * 0.4) - 15;
				shipSrc += "&forceX={0}&forceY={1}".format(x, y);
			} else if(viewCgMode){
				// view large CG
				shipSrc += "&forceFrame=10";
				let [x, y] = KC3Master.graph(ship_id).api_battle_n;
				x -= 180; y -= 280;
				shipSrc += "&forceX={0}&forceY={1}".format(x, y);
			}
			// new png url
			var cgType = KC3Master.isSeasonalShip(ship_id) ? "character_full" :
				KC3Master.isAbyssalShip(ship_id) || viewCgMode ? "full" :
				"card";
			var kcs2Src = `http://${this.server_ip}/kcs2/resources` +
				KC3Master.png_file(ship_id, cgType, "ship", tryDamagedGraph);
			if(this.currentCardVersion) kcs2Src += `?version=${this.currentCardVersion}`;
			
			if(this.croppie) this.croppie.croppie("destroy");
			if(showAllGraphs){
				$(".tab_mstship .shipInfo .cgswf").hide();
				const cgList = $('<div class="cglist"></div>').appendTo(".tab_mstship .shipInfo .basic");
				// To avoid loading seasonal image types not existed (no card and damaged basically),
				// see `ShipLoader.prototype.getSpecificAlbumImageLoadList`
				const isSpecificAlbumTypes = [
					5026, 5027, 5256, 5269, 5275, 5276, 5277, 5278, 5279, 5280,
					5281, 5282, 5283, 5284, 5285, 5286, 5287, 5288, 5289, 5290,
					5291, 5292, 5293, 5294, 5295, 5296, 5297, 5298, 5299, 5300,
					5301, 5302, 5303, 5304, 5305, 5306, 5357,
				].includes(ship_id);
				// No card but has damaged image
				const isSpButHasTaiha = [5269, 5357].includes(ship_id);
				const availableTypes = KC3Master.isSeasonalShip(ship_id) ?
					isSpecificAlbumTypes ? isSpButHasTaiha ? [
						'character_full', 'character_full_dmg',
						'character_up', 'character_up_dmg'
					] : ['character_full', 'character_up'] : [
						'card', 'character_full', 'character_full_dmg',
						'character_up', 'character_up_dmg'
					] : KC3Master.isAbyssalShip(ship_id) ?
					KC3Meta.abyssShipBorderClass(shipData) === "boss" ? [
						'banner', 'banner_dmg', 'banner_g_dmg',
						'full', 'full_dmg',
						'banner_d', 'full_d'
						// also exists: 'banner_g_d', 'full_dmg_d'...
					] : [
						'banner', 'banner_dmg', 'banner_g_dmg',
						'full', 'full_dmg'
						// some exists: 'banner3', 'banner3_g_dmg'
					] : ['card', 'card_dmg',
						'banner', 'banner_dmg', 'banner_g_dmg',
						'banner2', 'banner2_dmg', 'banner2_g_dmg',
						'full', 'full_dmg',
						'character_full', 'character_full_dmg',
						'character_up', 'character_up_dmg',
						'remodel', 'remodel_dmg',
						'supply_character', 'supply_character_dmg',
						'album_status'
					];
				// Special cut-in (Nelson Touch, Nagato/Mutsu Cutin) special type
				if(KC3Meta.specialCutinIds.includes(ship_id)) availableTypes.push("special");
				const imageErrorHandler = function(e) {
					$(this).unbind("error");
					// Hide optional debuffed abyssal boss alt lines,
					// since damaged boss state can be only determined via battle API `api_xal01` property.
					// And _dmg images are not available since boss 1846
					const typeTip = $(this).attr("title");
					if(typeTip.endsWith("_d") || typeTip.endsWith("_dmg")) $(this).hide();
				};
				availableTypes.forEach(type => {
					// Old suffix for debuffed boss CG used still, see `ShipLoader.hasai` & `hSuffix()`
					const isDebuffedBoss = type.endsWith("_d"),
						isDamaged = type.endsWith("_dmg"),
						qualifiedType = isDebuffedBoss ? type.slice(0, -2) :
							isDamaged ? type.slice(0, -4) : type;
					const img = $("<img />"),
						imgUri = KC3Master.png_file(ship_id, qualifiedType, "ship", isDamaged,
							isDebuffedBoss ? this.damagedBossFileSuffix : "");
					const url = `http://${this.server_ip}/kcs2/resources${imgUri}`
						+ (this.currentCardVersion ? `?version=${this.currentCardVersion}` : "");
					img.attr("src", url).attr("alt", imgUri).attr("title", type)
						.css("max-width", "100%")
						.error(imageErrorHandler)
						.appendTo(cgList);
					cgList.append('<div class="clear"></div>');
				});
			} else {
				$(".tab_mstship .shipInfo .basic .cglist").remove();
				setTimeout(() => {
					if(this.currentShipId !== ship_id) return;
					const cgswf = $(".tab_mstship .shipInfo .cgswf").show();
					this.croppie = $(".tab_mstship .shipInfo .cgswf .image").croppie({
						boundary: { width: cgswf.width(), height: cgswf.height() },
						viewport: KC3Master.isAbyssalShip(ship_id) ?
							{ width: 234, height: 200, type: "square" } :
							{ width: 218, height: 300, type: "square" },
						showZoomer: false,
					});
					if(!cgswf.length || !this.croppie.length) return;
					$(".tab_mstship .shipInfo .cgswf .cr-viewport").css("border", "none")
						.css("box-shadow", "none");
					$(".tab_mstship .shipInfo .cgswf .cr-image").attr("alt", "Loading");
					this.croppie.croppie("bind", {
						url: KC3Meta.isAF() && ship_id == KC3Meta.getAF(4) ? KC3Meta.getAF(3).format("bk") : kcs2Src,
						zoom: cgswf.attr("scale"),
					}).catch(err => {
						$(".tab_mstship .shipInfo .cgswf .cr-image").attr("alt", "ERROR: failed to load image");
					});
				}, 0);
			}
			
			$(".tab_mstship .shipInfo .salty-zone").text(KC3Meta.term(denyTerm()));
			$(".tab_mstship .shipInfo .hourlies").empty();
			
			saltClassUpdate();
			
			var statBox;
			if(KC3Master.isRegularShip(ship_id) && !viewCgMode && !showAllGraphs){
				// Ship-only, non abyssal
				$(".tab_mstship .shipInfo .stats").empty();
				$(".tab_mstship .shipInfo .stats").css("width", "");
				$(".tab_mstship .shipInfo .intro").html( shipData.api_getmes );
				$(".tab_mstship .shipInfo .cgswf")
					.css("width", "218px").css("height", "300px")
					.attr("scale", 218 / 327);
				
				// STATS
				var statFromDb = WhoCallsTheFleetDb.getShipStat(ship_id);
				$.each([
					["hp", "taik", "ShipHp"],
					["fp", "houg", "ShipFire"],
					["ar", "souk", "ShipArmor"],
					["tp", "raig", "ShipTorpedo"],
					["ev", "db_evasion", "ShipEvasion"],
					["aa", "tyku", "ShipAntiAir"],
					["ac", "db_carry", "ShipCarry"],
					["as", "db_asw", "ShipAsw"],
					["sp", "soku", "ShipSpeed"],
					["ls", "db_los", "ShipLos"],
					["rn", "leng", "ShipLength"],
					["lk", "luck", "ShipLuck"],
				], function(index, stat){
					statBox = $(".tab_mstship .factory .ship_stat").clone();
					$("img", statBox).attr("src", KC3Meta.statIcon(stat[0]));
					$(".ship_stat_name", statBox).text(stat[1])
						.attr("title", KC3Meta.term(stat[2]) || "")
						.lazyInitTooltip();
					
					if(stat[0]=="rn"){
						$(".ship_stat_text", statBox).text(["","Short","Medium","Long","V.Long"][shipData.api_leng]);
						$(".ship_stat_text", statBox).show();
						$(".ship_stat_value", statBox).hide();
						
					}else if(stat[0]=="sp"){
						$(".ship_stat_text", statBox).text({"5":"Slow","10":"Fast"}[shipData.api_soku]);
						$(".ship_stat_text", statBox).show();
						$(".ship_stat_value", statBox).hide();
						
					}else if(stat[0]=="hp"){
						$(".ship_stat_min", statBox).text(shipData["api_"+stat[1]][0]);
						// Show our max value for married ship, as api_taik[1] is usually unreachable
						$(".ship_stat_max span", statBox).text(KC3Ship.getMaxHp(ship_id));
						// api_taik[1] is used as upper limit for marriage increasing & HP modding
						$(".ship_stat_max", statBox).attr("title", shipData["api_"+stat[1]][1])
							.lazyInitTooltip();
					}else if(stat[1].startsWith("db_")){
						var realName = stat[1].slice(3);
						$(".ship_stat_name", statBox).text(realName);
						// New initial asw statistic added for Escort Carrier (CVE)
						if(stat[0]=="as" && shipData.api_tais){
							$(".ship_stat_min", statBox).text(shipData.api_tais[0]);
						} else {
							$(".ship_stat_min", statBox).text(
								statFromDb[realName] < 0 || statFromDb[realName] === ""
									? "tbc"
									: statFromDb[realName]
							);
						}
						if(realName==="carry"){
							$(".ship_stat_max", statBox).hide();
							if(statFromDb[realName] === undefined){
								$(".ship_stat_min", statBox).text(KC3Ship.getCarrySlots(ship_id));
							}
						} else {
							$(".ship_stat_max span", statBox).text(
								statFromDb[realName+"_max"] < 0 || statFromDb[realName+"_max"] === ""
									? "tbc"
									: statFromDb[realName+"_max"]
							);
						}
					}else{
						$(".ship_stat_min", statBox).text(shipData["api_"+stat[1]][0]);
						$(".ship_stat_max span", statBox).text(shipData["api_"+stat[1]][1]);
					}
					statBox.appendTo(".tab_mstship .shipInfo .stats");
				});
				
				var stockEquipments = WhoCallsTheFleetDb.getStockEquipment( ship_id );
				var remodelInfo = RemodelDb.remodelInfo( ship_id ) || {};
				var shipOriginId = RemodelDb.originOf(ship_id);

				
				// EQUIPMENT
				$(".tab_mstship .equipments .equipment").each(function(index){
					$(".capacity", this).text( shipData.api_maxeq[index] ).show();
					if(index >= shipData.api_slot_num){
						$(this).hide();
					}else{
						$(this).show();
					}

					// in case when the data isn't available,
					// slots should still be getting cleaned up
					$(".slotitem", this).empty().removeAttr("title");
					$(".sloticon img", this).attr("src", "").hide();

					if (stockEquipments) {
						let equipId = stockEquipments[index];
						if (equipId && (equipId > 0 || equipId.id > 0)) {
							let star = 0;
							if (equipId.id) {
								star = equipId.star;
								equipId = equipId.id;
							}
							const equipment = KC3Master.slotitem(equipId);
							const fakeGear = new KC3Gear({itemId: 1, masterId: equipId});
							let nameText = KC3Meta.gearName(equipment.api_name);
							if (star > 0) nameText += ` <span class="star">\u2605+${star}</span>`;
							$(".slotitem", this).html(nameText)
								.attr("title", fakeGear.htmlTooltip(shipData.api_maxeq[index]))
								.lazyInitTooltip();
							$(".sloticon img", this)
								.attr("src", KC3Meta.itemIcon(equipment.api_type[3]))
								.attr("alt", equipId).off("click")
								.click(gearClickFunc).show();
							$(".sloticon", this).addClass("hover");
						} else {
							$(".sloticon img", this).hide().off("click");
							$(".sloticon", this).removeClass("hover");
						}
					}
				});
				
				// MORE INFO
				if(shipData.api_aftershipid > 0){
					$(".tab_mstship .shipInfo .remodel_name a").text( KC3Meta.shipName(KC3Master.ship(shipData.api_aftershipid).api_name) );
					$(".tab_mstship .shipInfo .remodel_name a").data("sid", shipData.api_aftershipid);
					$(".tab_mstship .shipInfo .remodel_level span").text( shipData.api_afterlv );
					$(".tab_mstship .shipInfo .remodel_ammo .rsc_value").text( shipData.api_afterbull );
					$(".tab_mstship .shipInfo .remodel_steel .rsc_value").text( shipData.api_afterfuel );
					$(".tab_mstship .shipInfo .remodel_blueprint").toggle(
						// show blueprint icon for all these special materials
						!!(remodelInfo.blueprint || remodelInfo.catapult || remodelInfo.report
							|| remodelInfo.gunmat || remodelInfo.airmat)
					);
					$(".tab_mstship .shipInfo .remodel").show();
				}else{
					$(".tab_mstship .shipInfo .remodel").hide();
				}

				// other forms
				var otherFormIds = RemodelDb
					.remodelGroup(shipData.api_id)
					.filter( function(x) {
						return x !== shipData.api_id &&
							x !== shipData.api_aftershipid;
					});
				
				if (otherFormIds.length > 0) {
					$(".tab_mstship .shipInfo .more .other_forms a").remove();
					$.each(otherFormIds, function(i,x) {
						$("<a/>")
							.addClass("hover")
							.text( KC3Meta.shipName(self.mergedMasterShips[x].api_name) )
							.data("sid",x)
							.appendTo( ".tab_mstship .shipInfo .more .other_forms .other_forms_list" );
					});
					$(".tab_mstship .shipInfo .more .other_forms").show();
				} else {
					$(".tab_mstship .shipInfo .more .other_forms").hide();
				}

				// Seasonal CGs
				var seasonalCgIds = Object.keys(this.mergedMasterShips).filter(
					id => KC3Master.isSeasonalShip(id)
						&& this.mergedMasterShips[id].api_yomi === shipData.api_yomi
				);
				if (seasonalCgIds.length > 0) {
					$(".tab_mstship .shipInfo .more .seasonal_cg a").remove();
					$.each(seasonalCgIds, function(i, x) {
						$("<a/>")
							.addClass("hover")
							.text( KC3Meta.shipName(self.mergedMasterShips[x].api_name) )
							.data("sid", x)
							.appendTo( ".tab_mstship .shipInfo .more .seasonal_cg .seasonal_cg_list" );
					});
					$(".tab_mstship .shipInfo .more .seasonal_cg").show();
				} else {
					$(".tab_mstship .shipInfo .more .seasonal_cg").hide();
				}

				$(".tab_mstship .scrap .rsc").each(function(index){
					$(".rsc_value", this).text( shipData.api_broken[index] );
				});
				$(".tab_mstship .modfods .rsc").each(function(index){
					$(".rsc_value", this).text( shipData.api_powup[index] );
				});
				$(".tab_mstship .shipInfo .consume_fuel .rsc_value").text( shipData.api_fuel_max );
				$(".tab_mstship .shipInfo .consume_ammo .rsc_value").text( shipData.api_bull_max );

				// level-dependent stats
				var lowestLevel = RemodelDb.lowestLevel( self.currentShipId );
				// it seems "ticks" cannot be reset, so we have to
				// destroy the slider and build a fresh one.
				self.atLvlSlider.slider('destroy');
				self.atLvlSlider.slider({
					tooltip: 'hide',
					ticks: [lowestLevel, KC3Ship.getMarriedLevel() - 1, KC3Ship.getMaxLevel()]
				});
				self.atLvlSlider.on('change', function(e) {
					self.atLevelChange( e.value.newValue );
				});
				self.atLvlSlider.slider('setValue', KC3Ship.getMarriedLevel() - 1, true, true);

				$(".tab_mstship .shipInfo .subtitles").empty();
				
				// VOICE LINES
				$(".tab_mstship .shipInfo .voices").show();
				$(".tab_mstship .shipInfo .voices").empty();

				var allVoiceNums = KC3Translation.getShipVoiceNums(shipData.api_id, false, true);
				$.each(allVoiceNums, function(ignored, vnum){
					$("<div/>")
						.addClass("hover")
						.addClass("voice")
						.data("vnum", vnum)
						.text(KC3Translation.voiceNumToDesc(vnum) )
						.appendTo(".tab_mstship .shipInfo .voices");
				});
				$("<div/>").addClass("clear").appendTo(".tab_mstship .shipInfo .voices");
				
				// Hourly lines
				$(".tab_mstship .shipInfo .hourlies").show();
				$(".tab_mstship .shipInfo .hourlies").empty();
				
				if (KC3Meta.shipHasHourlyVoices(shipData.api_id)){
					$.each(this.hourlies, function(vnum, vname){
						var hhStr = vname.substring(0,2);
						var mmStr = vname.substring(2);
						$("<div/>")
							.addClass("hover")
							.addClass("voice")
							.data("vnum", vnum)
							.text(hhStr + ":" + mmStr)
							.appendTo(".tab_mstship .shipInfo .hourlies");
					});
					$("<div/>").addClass("clear").appendTo(".tab_mstship .shipInfo .hourlies");
				}
				
				// Equippable Items
				$(".equipSlots .equipList,.equipExSlot .equipList").empty();
				const addEquipType = (listClass, typeId) => {
					// use 2nd yellow icon instead of 1st green one if type is secondary gun
					const firstIconId = KC3Meta.itemIconsByType2(typeId)[typeId === 4 ? 1 : 0];
					// skip 'VT Fuze' and event item 'Transport Device', since they are not used for now
					if (!firstIconId || typeId === 50) return;
					const equipTypeBox = $(".tab_mstship .factory .equippableType").clone()
						.appendTo(listClass);
					$(".typeIcon img", equipTypeBox).attr("src", KC3Meta.itemIcon(firstIconId))
						.attr("title", "[?,?,{0},{1},?]".format(typeId, firstIconId));
					$(".typeName", equipTypeBox).text(KC3Meta.gearTypeName(2, typeId))
						.attr("title", KC3Meta.gearTypeName(2, typeId));
				};
				const equipTypes = KC3Master.equip_type(shipData.api_stype, shipData.api_id);
				if (equipTypes.length > 0) {
					equipTypes.forEach(addEquipType.bind(this, ".equipSlots .equipList"));
					$(".equipSlots").show().createChildrenTooltips();
				} else {
					$(".equipSlots").hide();
				}
				const exslotTypes = KC3Master.equip_exslot_type(equipTypes);
				if (exslotTypes.length > 0) {
					exslotTypes.forEach(addEquipType.bind(this, ".equipExSlot .equipList"));
					// specified items on exslot of specified ships
					const exslotItems = KC3Master.equip_exslot_ship(shipData.api_id);
					// `RemodelUtil.createSetListEx` hard-coded whether Improved Turbine can be equipped
					if (equipTypes.includes(17) && !exslotItems.includes(33)) {
						exslotItems.push(33);
					}
					if (exslotItems.length > 0) {
						exslotItems.forEach(item => {
							const gearMst = KC3Master.slotitem(item);
							const equipTypeBox = $(".tab_mstship .factory .equippableType").clone()
								.appendTo(".equipExSlot .equipList");
							$(".typeIcon img", equipTypeBox)
								.attr("src", KC3Meta.itemIcon(gearMst.api_type[3]))
								.attr("title", "[{0}]".format(item))
								.attr("alt", item).click(gearClickFunc);
							$(".typeIcon", equipTypeBox).addClass("hover");
							$(".typeName", equipTypeBox).text(KC3Meta.gearName(gearMst.api_name))
								.attr("title", KC3Meta.gearName(gearMst.api_name));
						});
					}
					$(".equipExSlot").show().createChildrenTooltips();
				} else {
					$(".equipExSlot").hide();
				}
				
				// AACI Types
				$(".aaciList").empty();
				const aaciList = AntiAir.sortedPossibleAaciList( AntiAir.shipAllPossibleAACIs(shipData) );
				if (aaciList.length > 0) {
					$.each(aaciList, function(idx, aaciObj){
						const aaciBox = $(".tab_mstship .factory .aaciPattern").clone();
						$(".apiId", aaciBox).text("[{0}]".format(aaciObj.id));
						if(aaciObj.icons[0] > 0) {
							$(".shipIcon img", aaciBox)
								.attr("src", KC3Meta.shipIcon(aaciObj.icons[0], undefined, false) )
								.attr("title", KC3Meta.aacitype(aaciObj.id)[0] || "");
						} else {
							$(".shipIcon img", aaciBox).hide();
						}
						if(aaciObj.icons.length > 1) {
							for(let i = 1; i < aaciObj.icons.length; i++) {
								const equipIcon = String(aaciObj.icons[i]).split(/[+-]/);
								$("<img/>")
									.attr("src", KC3Meta.itemIcon(equipIcon[0], 1))
									.attr("title", KC3Meta.aacitype(aaciObj.id)[i] || "")
									.appendTo($(".equipIcons", aaciBox));
								if(equipIcon.length > 1) {
									$('<img/>')
										.attr("src", KC3Meta.itemIcon(equipIcon[1], 1))
										.addClass(aaciObj.icons[i].indexOf("-") > -1 ? "minusIcon" : "plusIcon")
										.appendTo($(".equipIcons", aaciBox));
								}
							}
						}
						$(".fixed", aaciBox).text("+{0}".format(aaciObj.fixed));
						$(".modifier", aaciBox).text("x{0}".format(aaciObj.modifier));
						aaciBox.toggleClass("odd", (idx+1) % 2 !== 0);
						aaciBox.toggleClass("even", (idx+1) % 2 === 0);
						aaciBox.appendTo(".aaciList");
					});
					$(".aaci").show().createChildrenTooltips();
					$(".aaci").parent().prev().show();
				} else {
					$(".aaci").hide();
					$(".aaci").parent().prev().hide();
				}
				
				// GUN FITS
				$(".gunfitList").empty();
				const gunfits = KC3Meta.sortedGunfits(shipData.api_id);
				if (gunfits) {
					let lastWeightClass = "";
					let isOdd = false;
					const fillGearFitValue = function(gunfitBox, value, className) {
						$(".gearFit{0}".format(className), gunfitBox).text(
							(value > 0 ? "+" : "") + value
						);
						$(".gearFit{0}".format(className), gunfitBox).addClass(
							["fit_penalty", "fit_neutral", "fit_bonus"][Math.sign(value) + 1]
						);
					};
					$.each(gunfits, function(idx, gunfitObj) {
						if(lastWeightClass != gunfitObj.weight) {
							isOdd = !isOdd;
							lastWeightClass = gunfitObj.weight;
						}
						const itemId = gunfitObj.id;
						const gunfitBox = $(".tab_mstship .factory .fitgear").clone();
						const gearObj = KC3Master.slotitem(itemId);
						$(".gearName", gunfitBox).text(
							"[{0}] {1}".format(itemId, KC3Meta.gearName(gearObj.api_name))
						).attr("title", KC3Meta.gearName(gearObj.api_name)
						).data("id", itemId).on("click", gearClickFunc).addClass("hover");
						
						if (gunfitObj.unknown === true) {
							$(".gearFitDay", gunfitBox).text(KC3Meta.term("FitWeightUnknown"))
								.addClass("fit_unknown");
							$(".gearFitNight", gunfitBox).width(0);
						} else {
							fillGearFitValue(gunfitBox, gunfitObj.day, "Day");
							fillGearFitValue(gunfitBox, gunfitObj.night, "Night");
						}
						gunfitBox.addClass(gunfitObj.weight);
						gunfitBox.addClass(isOdd ? "odd" : "even");
						gunfitBox.appendTo(".gunfitList");
					});
					$(".gunfit").parent().prev().show();
				} else {
					$(".gunfit").parent().prev().hide();
				}

				// VISIBLE EQUIPMENT BONUS
				$(".bonusList").empty();
				const bonusDefs = KC3Gear.explicitStatsBonusGears();
				const bonusList = [];
				const synergyList = bonusDefs.synergyGears;
				
				const ensureArray = array => Array.isArray(array) ? array : [array];
				const checkBonusExtraRequirements = (bonusDef, shipId, originId, ctype, stype) => {
					if (bonusDef.excludes && bonusDef.excludes.includes(shipId)) { return false; }
					if (bonusDef.excludeOrigins && bonusDef.excludeOrigins.includes(originId)) { return false; }
					if (bonusDef.excludeClasses && bonusDef.excludeClasses.includes(ctype)) { return false; }
					if (bonusDef.excludeStypes && bonusDef.excludeStypes.includes(stype)) { return false; }
					if (bonusDef.remodel || bonusDef.remodelCap) {
						const remodelGroup = RemodelDb.remodelGroup(shipId);
						if(remodelGroup.indexOf(shipId) < bonusDef.remodel) { return false; }
						if(remodelGroup.indexOf(shipId) > bonusDef.remodelCap) { return false; }
					}
					if (bonusDef.stypes && !bonusDef.stypes.includes(stype)) { return false; }
					if (bonusDef.origins && !bonusDef.origins.includes(originId)) { return false; }
					if (bonusDef.ids && !bonusDef.ids.includes(shipId)) { return false; }
					return true;
				};
				const checkByShipBonusDef = (bonusDef, shipId, originId, stype, ctype, gearType2) => (
					(Array.isArray(gearType2) ?
						gearType2.some(id => KC3Master.equip_type(stype, shipId).includes(id)) :
						KC3Master.equip_type(stype, shipId).includes(gearType2)
					) && (
						(bonusDef.ids && bonusDef.ids.includes(shipId)) ||
						(bonusDef.origins && bonusDef.origins.includes(originId)) ||
						(bonusDef.stypes && bonusDef.stypes.includes(stype)) ||
						(bonusDef.classes && bonusDef.classes.includes(ctype)) ||
						(bonusDef.excludes && !bonusDef.excludes.includes(shipId)) ||
						(bonusDef.excludeOrigins && !bonusDef.excludeOrigins.includes(originId)) ||
						(bonusDef.excludeStypes && !bonusDef.excludeStypes.includes(stype)) ||
						(bonusDef.excludeClasses && !bonusDef.excludeClasses.includes(ctype)) ||
						(!bonusDef.ids && !bonusDef.origins && !bonusDef.stypes && !bonusDef.classes
							&& !bonusDef.excludes && !bonusDef.excludeOrigins && !bonusDef.excludeStypes && !bonusDef.excludeClasses)
					)
				);
				const checkByShipBonusRequirements = (byShip, shipId, originId, stype, ctype, gearType2) =>
					ensureArray(byShip).some(bonusDef => checkByShipBonusDef(bonusDef, shipId, originId, stype, ctype, gearType2));
				const addObjects = (obj1, obj2) => {
					for (const key in obj2) {
						obj1[key] = obj1[key] ? obj1[key] + obj2[key] : obj2[key];
					}
					return obj1;
				};
				const addStatsToBox = (stats, box) => {
					Object.keys(stats).forEach(function (stat) {
						if(!stats[stat]) return;
						const statBox = $(".tab_mstship .factory .gearStatBonus").clone();
						$(".statIcon img", statBox).attr("src", KC3Meta.statIconByApi(stat))
							.attr("title", KC3Meta.statNameTerm(stat, true));
						$(".statValue", statBox).text((stats[stat] > 0 ? "+" : "") + stats[stat]);
						$(".bonusStatsList", box).append(statBox);
					});
				};
				const synergyIcon = (flag) =>{
					if (flag.includes("Radar")) { return 11; }
					else if (flag.includes("Torpedo")) { return 5; }
					else if (flag.includes("LargeGunMount")) { return 3; }
					return 0;
				};
				
				for (const mstId in bonusDefs) {
					const def = bonusDefs[mstId];
					let bonus = {};
					const gearType2 = mstId.startsWith("t3_") ?
						KC3Meta.itemTypesByType3(Number(mstId.substr(3))) : mstId.startsWith("t2_") ?
						Number(mstId.substr(3)) : Number.isInteger(Number(mstId)) ?
						KC3Master.slotitem(mstId).api_type[2] : 0;
					if (def.byClass && Object.keys(def.byClass).includes(String(shipData.api_ctype))) {
						bonus = Object.assign(bonus, def);
					} else if (def.byShip && checkByShipBonusRequirements(def.byShip, shipData.api_id, shipOriginId, shipData.api_stype, shipData.api_ctype, gearType2)) {
						bonus = Object.assign(bonus, def);
					}
					if (Object.keys(bonus).length) {
						bonus.id = mstId;
						bonusList.push(bonus);
					}
				}
				let bonusFound = false;
				if (bonusList.length > 0) {
					$.each(bonusList, function (idx, gear) {
						let found = false, totalStats = {}, bonusStats = {}, synergyGear = [], starBonus = {};
						
						// Class bonuses
						if (gear.byClass && Object.keys(gear.byClass).includes(String(shipData.api_ctype))) {
							let classBonus = gear.byClass[shipData.api_ctype];
							if (typeof classBonus !== "object") { classBonus = gear.byClass[classBonus]; }
							classBonus = ensureArray(classBonus);
							classBonus.forEach(bonus => {
								if (checkBonusExtraRequirements(bonus, shipData.api_id, shipOriginId, shipData.api_ctype, shipData.api_stype) && !bonus.minCount) {
									found = true;
									if (!bonus.minStars) {
						// TODO: for all following `.single || .multiple`, should merge them instead of OR, and show a 'one-time' indicator
										bonusStats = bonus.single || bonus.multiple;
										totalStats = addObjects(totalStats, bonusStats);
										if (bonus.synergy) { synergyGear.push(bonus.synergy); }
									}
									else { starBonus[bonus.minStars] = {}; }
								}
							});
							// Improvement bonuses
							if (classBonus.length) {
								for (const minStar in starBonus) {
									starBonus[minStar] = Object.assign({}, totalStats);
									for (const bonusDef of classBonus) {
										if (bonusDef.minStars <= minStar) {
											bonusStats = bonusDef.single || bonusDef.multiple;
											starBonus[minStar] = addObjects(starBonus[minStar], bonusStats);
										}
									}
								}
							}
						}
						// Ship bonuses
						if (gear.byShip) {
							const gearType2 = gear.id.startsWith("t3_") ?
								KC3Meta.itemTypesByType3(Number(gear.id.substr(3))) : gear.id.startsWith("t2_") ?
								Number(gear.id.substr(3)) : Number.isInteger(Number(gear.id)) ?
								KC3Master.slotitem(gear.id).api_type[2] : 0;
							const list = ensureArray(gear.byShip).filter(bonusDef =>
								checkByShipBonusDef(bonusDef, shipData.api_id, shipOriginId, shipData.api_stype, shipData.api_ctype, gearType2));
							list.forEach(shipBonus => {
								found = true;
								if (!shipBonus.minStars) {
									bonusStats = shipBonus.single || shipBonus.multiple;
									totalStats = addObjects(totalStats, bonusStats);
									if (shipBonus.synergy) { synergyGear.push(shipBonus.synergy); }
								}
								else { starBonus[shipBonus.minStars] = {}; }
							});
							// Improvement bonuses
							if (list.length) {
								for (const minStar in starBonus) {
									starBonus[minStar] = Object.assign({}, totalStats);
									for (const bonusDef of list) {
										if (bonusDef.minStars <= minStar) {
											bonusStats = bonusDef.single || bonusDef.multiple;
											starBonus[minStar] = addObjects(starBonus[minStar], bonusStats);
										}
									}
								}
							}
						}
						
						if (found) {
							const gearBox = $(".tab_mstship .factory .gearBonuses").clone();
							if (gear.id.startsWith("t2_")) {
								const typeId = gear.id.substr(3);
								const firstIconId = KC3Meta.itemIconsByType2(typeId)[typeId === 4 ? 1 : 0];
								const typeName = KC3Meta.gearTypeName(2, typeId);
								$(".gearId", gearBox).text(`[T${typeId}]`);
								$(".gearIcon img", gearBox).attr("src", KC3Meta.itemIcon(firstIconId));
								const allGears = KC3Master.all_slotitems();
								const matchedGearNames = Object.keys(allGears).filter(
									id => !KC3Master.isAbyssalGear(id) && allGears[id].api_type[2] == typeId
								).map(id => KC3Meta.gearName(allGears[id].api_name)).join("\n");
								$(".gearName", gearBox).text(typeName).attr("title", matchedGearNames);
							} else if (gear.id.startsWith("t3_")) {
								const iconId = gear.id.substr(3);
								const typeName = KC3Meta.gearTypeName(3, iconId);
								$(".gearId", gearBox).text(`[I${iconId}]`);
								$(".gearIcon img", gearBox).attr("src", KC3Meta.itemIcon(iconId));
								const allGears = KC3Master.all_slotitems();
								const matchedGearNames = Object.keys(allGears).filter(
									id => !KC3Master.isAbyssalGear(id) && allGears[id].api_type[3] == iconId
								).map(id => KC3Meta.gearName(allGears[id].api_name)).join("\n");
								$(".gearName", gearBox).text(typeName).attr("title", matchedGearNames);
							} else {
								const master = KC3Master.slotitem(gear.id);
								const gearName = KC3Meta.gearName(master.api_name);
								$(".gearId", gearBox).text(`[${gear.id}]`);
								$(".gearIcon img", gearBox)
									.attr("src", KC3Meta.itemIcon(master.api_type[3]))
									.attr("alt", gear.id).click(gearClickFunc);
								$(".gearIcon", gearBox).addClass("hover");
								$(".gearName", gearBox).text(gearName).attr("title", gearName);
							}
							
							if (Object.keys(totalStats).length > 0) {
								const levelBox = $(".tab_mstship .factory .gearLevelBonus").clone();
								addStatsToBox(totalStats, levelBox);
								$(".leveledBonusStatsList", gearBox).append(levelBox);
							}
							
							Object.keys(starBonus).forEach(function (level) {
								const levelBox = $(".tab_mstship .factory .gearLevelBonus").clone();
								$(".gearLevel", levelBox).html("&#9733;{0}".format(
									Number(level) >= 10 ?
										'<span style="font-size: smaller">max</span>' :
										'+' + level
									)
								);
								addStatsToBox(starBonus[level], levelBox);
								$(".leveledBonusStatsList", gearBox).append(levelBox);
							});
							
							synergyGear.map((synergy) => {
								ensureArray(synergy).map((syn) => {
									const synergyBox = $(".tab_mstship .factory .synergy").clone();
									syn.flags.map((flag) => {
										const synergyFlag = $(".tab_mstship .factory .synergyFlag").clone();
										$(".synergyIcon img", synergyFlag).attr("src", KC3Meta.itemIcon(synergyIcon(flag)));
										const idList = synergyList[flag + "Ids"];
										const synergyName = (idList && idList.length === 1) ?
											KC3Meta.gearName(KC3Master.slotitem(idList[0]).api_name) :
											KC3Meta.term(flag.toCamelCase(true));
										const synergyNameList = idList.map(id =>
											`[${id}] ${KC3Meta.gearName(KC3Master.slotitem(id).api_name)}`);
										$(".synergyType", synergyFlag).html(synergyName)
											.attr("title", synergyNameList.join("\n"));
										$(".synergyFlags", synergyBox).append(synergyFlag);
									});
									
									if (syn.single || syn.distinct) {
										const bonus = syn.single || syn.distinct;
										const synergyBonusBox = $(".tab_mstship .factory .synergyBonusRow").clone();
										addStatsToBox(bonus, synergyBonusBox);
										if (syn.distinct) {
											$(".synergyType", synergyBox).append(
												$("<span>*</span>").attr("title", "Bonus with * mark effected only once")
											);
										}
										$(".synergyBonusRows", synergyBox).append(synergyBonusBox);
									} else if (syn.byCount) {
										Object.keys(syn.byCount).forEach(function (number) {
											if (isNaN(parseInt(number))) {
												return;
											}
											const synergyBonusBox = $(".tab_mstship .factory .synergyBonusRow").clone();
											addStatsToBox(syn.byCount[number], synergyBonusBox);
											$(".gearCount", synergyBonusBox).text(`x${number}`);
											$(".gearType", synergyBonusBox).append($("<img>").attr("src", KC3Meta.itemIcon(synergyIcon(syn.byCount.gear))));
											$(".synergyBonusRows", synergyBox).append(synergyBonusBox);
										});
									}
									$(".synergyGears", gearBox).append(synergyBox);
								});
							});
							
							$(".bonusList").append(gearBox);
							bonusFound = true;
						}
					});
				}
				$(".bonusList").parent().prev().toggle(bonusFound);

				// BOXES
				$(".tab_mstship .shipInfo .stats").show();
				$(".tab_mstship .shipInfo .equipments").show();
				$(".tab_mstship .shipInfo .intro").show();
				$(".tab_mstship .shipInfo .more").show();
				$(".tab_mstship .shipInfo .json").hide();
				$(".tab_mstship .shipInfo .boss").hide();
				$(".tab_mstship .shipInfo .encounter").hide();
				$(".tab_mstship .shipInfo .accordion").show();
				$(".tab_mstship .shipInfo .tokubest").show();
				if(ConfigManager.info_salt)
					$(".tab_mstship .shipInfo .tokubest .salty-zone").show();
				else
					$(".tab_mstship .shipInfo .tokubest .salty-zone").hide();
				if(ConfigManager.devOnlyPages)
					$(".tab_mstship .shipInfo .tokubest .to-quotes").show();
				else
					$(".tab_mstship .shipInfo .tokubest .to-quotes").hide();
			} else if (KC3Master.isAbyssalShip(ship_id) && !showAllGraphs) {
				// Abyssal, show larger CG viewer
				$(".tab_mstship .shipInfo .stats").hide();
				$(".tab_mstship .shipInfo .equipments").hide();
				$(".tab_mstship .shipInfo .json").hide().css("width", "100%");
				$(".tab_mstship .shipInfo .subtitles").empty().hide();
				$(".tab_mstship .shipInfo .cgswf")
					.css("width", "100%").css("height", "400px")
					.attr("scale", 400 / 1000);
				$(".tab_mstship .shipInfo .boss").toggle("boss" === KC3Meta.abyssShipBorderClass(shipData));
				
				// ENEMY STATS
				// show stats if encounter once, or show stats of internal db
				KC3Database.get_enemyInfo(ship_id, function(enemyDbStats){
					var abyssDb = KC3Master.abyssalShip(ship_id, false);
					var abyssMaster = self.mergedMasterShips[ship_id];
					console.debug("Enemy DB stats", enemyDbStats);
					console.debug("Abyssal internal stats", abyssDb);
					console.debug("Merged abyssal master", abyssMaster);
					$(".tab_mstship .shipInfo .encounter").toggle(!!enemyDbStats);
					if(enemyDbStats || abyssDb){
						$(".tab_mstship .shipInfo .stats").empty();
						$(".tab_mstship .shipInfo .stats").css("width", "220px");
						// ENEMY EQUIPMENT
						const equipMasters = [];
						const sumEquipTotalStat = statName => equipMasters.reduce((total, mst) => (
							total + (mst && mst.api_id > 0 ? mst[`api_${statName}`] || 0 : 0)
						), 0);
						const maxEquipStat = statName => Math.max(...equipMasters.map(mst => (
							mst && mst.api_id > 0 ? mst[`api_${statName}`] || 0 : 0
						)));
						$(".tab_mstship .equipments .equipment").each(function(index){
							$(this).show();
							let maxeq;
							if(abyssDb && abyssDb.api_maxeq && typeof abyssMaster.api_maxeq[index] !== "undefined"){
								maxeq = abyssMaster.api_maxeq[index];
								$(".capacity", this).text(maxeq).show();
							} else {
								$(".capacity", this).text(index >= abyssMaster.api_slot_num ? "-" : "?").show();
							}
							// Priority to show equipment recorded via encounter
							const equipId = enemyDbStats ? enemyDbStats["eq"+(index+1)] : (abyssMaster.kc3_slots || [])[index];
							if (equipId > 0) {
								const equipment = KC3Master.slotitem(equipId);
								equipMasters.push(equipment);
								const fakeGear = new KC3Gear({ itemId: 2, masterId: equipId });
								$(".slotitem", this).text(KC3Meta.gearName(equipment.api_name))
									.attr("title", fakeGear.htmlTooltip(maxeq))
									.lazyInitTooltip();
								$(".sloticon img", this)
									.attr("src", KC3Meta.itemIcon(equipment.api_type[3]))
									.attr("alt", equipId).off("click").click(gearClickFunc).show();
								$(".sloticon", this).addClass("hover");
								// Check diff for updating `abyssal_stats.json`
								if(enemyDbStats && (!abyssDb || !abyssDb.kc3_slots ||
									typeof abyssMaster.kc3_slots[index] === "undefined" ||
									enemyDbStats["eq"+(index+1)] != abyssMaster.kc3_slots[index])){
									$(".slotitem", this).html(
										$("<span style='color:yellow'></span>").text($(".slotitem", this).text())
									).attr("title",
										"{0} => {1}".format((abyssMaster.kc3_slots||[])[index], enemyDbStats["eq"+(index+1)])
									);
								}
							} else {
								$(".slotitem", this).empty().removeAttr("title");
								$(".sloticon img", this).hide().off("click");
								$(".sloticon", this).removeClass("hover");
							}
						});
						
						// ENEMY STATS
						$.each([
							["hp", "taik", "ShipHp"],
							["fp", "houg", "ShipFire"],
							["ar", "souk", "ShipArmor"],
							["tp", "raig", "ShipTorpedo"],
							["aa", "tyku", "ShipAntiAir"],
							["as", "tais", "ShipAsw"/*, "kc3_asw"*/],
							["ev", "houk", "ShipEvasion"/*, "kc3_evas"*/],
							["ht", "houm", "ShipAccuracy"/*, "kc3_tacc"*/],
							["ls", "saku", "ShipLos"/*, "kc3_los"*/],
							["sp", "soku", "ShipSpeed"],
							["rn", "leng", "ShipLength"],
							["if", "airpow"],
						], function(index, stat){
							statBox = $(".tab_mstship .factory .ship_stat").clone();
							$("img", statBox).attr("src", KC3Meta.statIcon(stat[0]));
							$(".ship_stat_name", statBox).text(stat[1])
								.attr("title", KC3Meta.term(stat[2]) || "")
								.lazyInitTooltip();
							if(stat[0] === "sp"){
								const speedEnNameMap = {"0":"Land","5":"Slow","10":"Fast","15":"Fast+","20":"Fastest"};
								$(".ship_stat_text", statBox).text(
									speedEnNameMap[abyssMaster.api_soku] || abyssMaster.api_soku
								).attr("title", abyssMaster.api_soku);
								$(".ship_stat_text", statBox).show();
								$(".ship_stat_value", statBox).hide();
							} else if(stat[0] === "rn"){
								const rangeEnNames = ["","Short","Medium","Long","V.Long","V.Long+"];
								const masterLeng = abyssMaster.api_leng,
									maxLengFromEquips = !equipMasters.length ? 0 : maxEquipStat("leng"),
									maxLeng = Math.max(masterLeng, maxLengFromEquips);
								$(".ship_stat_text", statBox).text(
									rangeEnNames[maxLeng] || "None"
								).attr("title", "{0} = max({1}, {2})"
									.format(maxLeng, masterLeng, maxLengFromEquips)
								);
								$(".ship_stat_text", statBox).show();
								$(".ship_stat_value", statBox).hide();
								$(".ship_stat_min", statBox).text(masterLeng);
								$(".ship_stat_max span", statBox).text(maxLengFromEquips);
								// Different color to indicate mismatched values between internal and max of equipment
								if(maxLengFromEquips > 0 && masterLeng !== maxLengFromEquips){
									$(".ship_stat_text", statBox).css("color",
										masterLeng > maxLengFromEquips ? "blue" : "orangered");
								}
							} else if(stat[0] === "if"){
								// Compute fighter air power based on known slots
								$(".ship_stat_min", statBox).text(
									KC3Calc.enemyFighterPower([abyssMaster.api_id])[0] || 0
								);
								$(".ship_stat_max", statBox).hide();
							} else {
								// Priority to show master stats recorded by encounters db
								let masterStat = enemyDbStats ? enemyDbStats[stat[0]] : abyssMaster["api_" + stat[1]];
								// Show those hidden stats in db partially, but not included in master data
								let isUnknownStat = false;
								if(masterStat === undefined && !!stat[3]) {
									masterStat = abyssMaster[stat[3]] || undefined;
									isUnknownStat = true;
								}
								if(masterStat === undefined){
									$(".ship_stat_min", statBox).text("-");
									masterStat = 0;
									isUnknownStat = true;
								} else {
									$(".ship_stat_min", statBox).text(masterStat);
								}
								if(!equipMasters.length || stat[0] === "hp"){
									$(".ship_stat_max", statBox).hide();
								} else {
									$(".ship_stat_max span", statBox).text(masterStat + sumEquipTotalStat(stat[1]));
								}
								// Check diff for updating internal db: `abyssal_stats.json`
								if(!isUnknownStat && enemyDbStats && (!abyssDb ||
									typeof abyssDb["api_" + stat[1]] === "undefined" ||
									enemyDbStats[stat[0]] != abyssDb["api_" + stat[1]])){
									// Different color to indicate stats attribute to be updated
									$(".ship_stat_min", statBox).html(
										$("<span style='color:orangered'></span>").text($(".ship_stat_min", statBox).text())
									).attr("title",
										"{0} => {1}".format(abyssDb["api_" + stat[1]], enemyDbStats[stat[0]])
									);
								}
							}
							statBox.appendTo(".tab_mstship .shipInfo .stats");
						});
						
						$(".tab_mstship .shipInfo .stats").show();
						$(".tab_mstship .shipInfo .equipments").show();
					} else {
						$(".tab_mstship .shipInfo .json").show();
						$(".tab_mstship .shipInfo .boss").hide();
					}
				});
				
				$(".tab_mstship .shipInfo .voices").hide();
				$(".tab_mstship .shipInfo .hourlies").hide();
				$(".tab_mstship .shipInfo .intro").hide();
				$(".tab_mstship .shipInfo .more").hide();
				$(".tab_mstship .shipInfo .accordion").hide();
				$(".tab_mstship .shipInfo .tokubest").hide();
			} else {
				$(".tab_mstship .shipInfo .stats").hide();
				$(".tab_mstship .shipInfo .equipments").hide();
				$(".tab_mstship .shipInfo .json").hide().css("width", "100%");
				$(".tab_mstship .shipInfo .subtitles").hide();
				$(".tab_mstship .shipInfo .cgswf")
					.css("width", "100%").css("height", "600px")
					.attr("scale", KC3Master.isSeasonalShip(ship_id) ? 600 / 645 : 600 / 1300);
				
				$(".tab_mstship .shipInfo .voices").hide();
				$(".tab_mstship .shipInfo .hourlies").hide();
				$(".tab_mstship .shipInfo .intro").hide();
				$(".tab_mstship .shipInfo .boss").hide();
				$(".tab_mstship .shipInfo .encounter").hide();
				$(".tab_mstship .shipInfo .more").hide();
				$(".tab_mstship .shipInfo .accordion").hide();
				$(".tab_mstship .shipInfo .tokubest").hide();
			}
			
		}
	};
	
})();
