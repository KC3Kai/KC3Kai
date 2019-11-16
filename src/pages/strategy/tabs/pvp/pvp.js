(function(){
	"use strict";
	
	KC3StrategyTabs.pvp = new KC3StrategyTab("pvp");
	
	KC3StrategyTabs.pvp.definition = {
		tabSelf: KC3StrategyTabs.pvp,
		
		exportingReplay: false,
		stegcover64: "",
		
		toggleMode: 1,
		itemsPerPage: 10,
		
		init :function(){
			this.locale = KC3Translation.getLocale();
		},
		reload :function(){
		},
		execute :function(){
			var self = this;
			// Count PvP records for pagination
			KC3Database.count_pvps(function(result){
				self.items = result;
				self.pages = Math.ceil( result / self.itemsPerPage );
				if(self.pages > 0){
					self.showPagination();
				} else {
					$(".tab_pvp .pagination").hide();
					$("#pvp_list").empty();
				}
				$(".tab_pvp .toggles .pvp_count").text(
					"Total pages: {1}, battles: {0}".format(self.items, self.pages, self.itemsPerPage)
				);
			});
			
			// Download replay button
			$("#pvp_list").on("click contextmenu", ".pvp_dl", function(e){
				e.preventDefault();
				self.downloadReplay($(this).data("id"), e);
			});
			
			// Show ship info
			$(".tab_pvp .pvp_toggle_ships").on("click", function(){
				if (self.toggleMode === 1) return false;
				self.toggleMode = 1;
				// Active button
				$(".tab_pvp .pvp_toggle").removeClass("active");
				$(this).addClass("active");
				// Animate boxes
				$(".tab_pvp .pvp_player .pvp_details_ship").animate({ width: 140 }, 500, function(){
					$(this).css({ "border-radius": "17px 5px 5px 17px" });
				});
				$(".tab_pvp .pvp_opponent .pvp_details_ship").animate({ width: 140 }, 500, function(){
					$(this).css({ "border-radius": "17px 5px 5px 17px" });
					$(".pvp_ship_name", this).css({ width: 40 });
				});
				$(".tab_pvp .pvp_player").animate({ width: 290 }, 500);
				$(".tab_pvp .pvp_opponent").animate({ width: 290 }, 500);
				$(".tab_pvp .pvp_battle").animate({ width: 0 }, 500);
			});
			
			// Show battle info
			$(".tab_pvp .pvp_toggle_battle").on("click", function(){
				if (self.toggleMode === 2) return false;
				self.toggleMode = 2;
				// Active button
				$(".tab_pvp .pvp_toggle").removeClass("active");
				$(this).addClass("active");
				// Animate boxes
				$(".tab_pvp .pvp_player .pvp_details_ship").animate({ width: 110 }, 500, function(){
					$(this).css({ "border-radius": "17px 5px 5px 17px" });
				});
				$(".tab_pvp .pvp_opponent .pvp_details_ship").animate({ width: 95 }, 500, function(){
					$(this).css({ "border-radius": "17px 5px 5px 17px" });
					$(".pvp_ship_name", this).css({ width: 57 });
				});
				$(".tab_pvp .pvp_player").animate({ width: 230 }, 500);
				$(".tab_pvp .pvp_opponent").animate({ width: 200 }, 500);
				$(".tab_pvp .pvp_battle").animate({ width: 150 }, 500);
			});
		},
		
		/* SHOW SPECIFIC PAGE
		---------------------------------*/
		showPage :function(pageNum){
			const self = this;
			this.toggleMode = 1;
			$("#pvp_list").empty();
			$(".tab_pvp .pvp_toggle").removeClass("active");
			$(".tab_pvp .pvp_toggle_ships").addClass("active");
			$(".tab_pvp .pvp_player").width(290);
			$(".tab_pvp .pvp_opponent").width(290);
			$(".tab_pvp .pvp_battle").width(0);
			KC3Database.get_pvps(pageNum, function(results){
				$.each(results, function(index, pvpBattle){
					self.cloneBattleBox(pvpBattle);
				});
				$("#pvp_list").createChildrenTooltips();
			}).catch(error => {
				console.error("Loading PvP record failed", error);
			});
		},
		
		/* CLONE ONE BATTLE BOX RECORD
		---------------------------------*/
		cloneBattleBox :function(pvpBattle){
			//console.debug("PvP battle record:", pvpBattle);
			const self = this;
			const recordBox = $(".tab_pvp .factory .pvp_record").clone();
			const showPvpLedger = function(sortieName) {
				KC3Database.con.navaloverall.where("type").equals(sortieName).toArray(arr => {
					const consumptions = arr.reduce((acc, o) =>
						acc.map((v, i) => acc[i] + (o.data[i] || 0)), [0,0,0,0,0,0,0,0]);
					if(arr.length && !consumptions.every(v => !v)) {
						const tooltip = consumptions.map((v, i) => {
							const icon = $("<img />").attr("src", "/assets/img/client/" +
									["fuel.png", "ammo.png", "steel.png", "bauxite.png",
									"ibuild.png", "bucket.png", "devmat.png", "screws.png"][i]
								).width(13).height(13).css("margin", "-3px 2px 0 0");
							return i < 4 || !!v ? $("<div/>").append(icon).append(v).html() : "";
						}).join(" ");
						const oldTooltip = $(".pvp_result img", recordBox).attr("title");
						$(".pvp_result img", recordBox).removeAttr("title").attr("titlealt",
							"{0}<br/>{1}".format(oldTooltip, tooltip)).lazyInitTooltip();
					}
				});
			};
			
			// Basic battle info
			$(".pvp_id", recordBox).text(pvpBattle.id);
			if (pvpBattle.time) {
				const pvpTime = new Date(pvpBattle.time * 1000);
				$(".pvp_date", recordBox).text(pvpTime.format("mmm d", false, this.locale))
					.attr("title", pvpTime.format("yyyy-mm-dd HH:MM:ss"));
			} else {
				$(".pvp_date", recordBox).text("Unknown");
			}
			$(".pvp_result img", recordBox)
				.attr("src", `/assets/img/client/ratings/${pvpBattle.rating}.png`)
				.attr("title", "Base EXP " + pvpBattle.baseEXP );
			$(".pvp_dl", recordBox).data("id", pvpBattle.id);
			if (pvpBattle.sortie_name) showPvpLedger(pvpBattle.sortie_name);
			
			// Player fleet
			$.each(pvpBattle.fleet, function(index, curShip){
				if (curShip == -1) return true;
				if (pvpBattle.mvp[0] == index+1) {
					curShip.mvp = true;
				}
				self.cloneShipBox(curShip, $(".pvp_player", recordBox));
			});
			
			// Opponent Fleet
			$.each(pvpBattle.data.api_ship_ke, function(index, mstId){
				if (mstId == -1) return true;
				self.cloneShipBox({
					opponent: true,
					equip: pvpBattle.data.api_eSlot[index],
					kyouka: (pvpBattle.data.api_eKyouka || [])[index] || [0,0,0,0],
					hp: pvpBattle.data.api_maxhps ? pvpBattle.data.api_maxhps[index+7] : pvpBattle.data.api_e_maxhps[index],
					stats: pvpBattle.data.api_eParam[index],
					level: pvpBattle.data.api_ship_lv[0] == -1 ? pvpBattle.data.api_ship_lv[index+1] : pvpBattle.data.api_ship_lv[index],
					mst_id: mstId,
				}, $(".pvp_opponent", recordBox));
			});
			
			self.fillBattleInfo(pvpBattle, $(".pvp_battle", recordBox));
			
			recordBox.appendTo("#pvp_list");
		},
		
		/* CLONE ONE SHIP BOX INTO BATTLE LIST
		---------------------------------*/
		cloneShipBox :function(data, targetBox){
			const self = this;
			const shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			const gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			const shipBox = $(".tab_pvp .factory .pvp_details_ship").clone();
			
			const shipName = KC3Meta.shipName(KC3Master.ship(data.mst_id).api_name);
			$(".pvp_ship_icon img", shipBox).attr("src", KC3Meta.shipIcon(data.mst_id))
				.attr("alt", data.mst_id).click(shipClickFunc);
			$(".pvp_ship_icon", shipBox).addClass("simg-"+data.mst_id);
			$(".pvp_ship_icon", shipBox).addClass("hover");
			$(".pvp_ship_name", shipBox).text(shipName)
				.attr("title", shipName);
			
			$(".pvp_ship_level span", shipBox).text(data.level);
			if (!data.opponent) {
				if (data.mvp) $(".pvp_ship_mvp_icon", shipBox).show();
			} else {
				$(".pvp_ship_hp span", shipBox).text(data.hp);
				$(".pvp_ship_level", shipBox).attr("title", "HP " + data.hp);
				$(".pvp_ship_fp", shipBox).text(data.stats[0]);
				$(".pvp_ship_tp", shipBox).text(data.stats[1]);
				$(".pvp_ship_aa", shipBox).text(data.stats[2]);
				$(".pvp_ship_ar", shipBox).text(data.stats[3]);
			}
			
			$.each(data.equip, function(index, itemMstId){
				if (itemMstId > 0) {
					const divTag = $("<div/>").addClass("pvp_ship_item");
					
					const thisItem = KC3Master.slotitem(itemMstId);
					const imgTag = $("<img/>").attr("src", KC3Meta.itemIcon(thisItem.api_type[3]))
						.attr("alt", itemMstId)
						.attr("title", KC3Meta.gearName(thisItem.api_name))
						.click(gearClickFunc);
					divTag.append(imgTag).addClass("hover");
					
					$(".pvp_ship_items", shipBox).append(divTag);
				}
			});
			
			targetBox.append(shipBox);
		},
		
		/* FILL BATTLE INFO WITH DATA
		---------------------------------*/
		fillBattleInfo :function(data, targetBox){
			// Process battle, create simulated node info
			const thisPvP = (new KC3Node(0, 0, data.time)).defineAsBattle();
			thisPvP.isPvP = true;
			thisPvP.letter = "PvP";
			// Do not require to simulate states of PvP sortie
			//KC3SortieManager.onPvP = true;
			//KC3SortieManager.appendNode(thisPvP);
			
			const battle_info_html = $(".tab_pvp .factory .pvp_battle_info").html();
			// Day Battle
			thisPvP.engage( data.data, 1);
			$(".pvp_battle_day", targetBox).html(battle_info_html);
			this.fillBattleBox(thisPvP, $(".pvp_battle_day", targetBox));
			
			if(KC3Node.debugPrediction()){
				if(data.yasen.api_deck_id !== undefined){
					thisPvP.night(data.yasen);
				}
				console.debug("PvP result rank", data.rating, data.id);
				console.assert(data.rating == (thisPvP.predictedRankNight || thisPvP.predictedRank), "Rank prediction mismatch", data);
				
				console.debug("PvP result mvp", data.mvp, data.id);
				if(thisPvP.predictedMvpCapable){
					const predictedMvps = thisPvP.predictedMvpsNight || thisPvP.predictedMvps || [];
					console.assert(data.mvp[0] == predictedMvps[0], "MVP prediction mismatch", data);
				} else {
					console.info("MVP prediction incapable");
				}
			}
			
		},
		
		/* FILL ONE BATTLE BOX (DAY/NIGHT)
		---------------------------------*/
		fillBattleBox :function(nodeInfo, targetBox){
			//console.debug("Simulated node info:", nodeInfo);
			$(".node_formation img.f", targetBox).attr("src", KC3Meta.formationIcon(nodeInfo.fformation))
				.attr("title", KC3Meta.formationText(nodeInfo.fformation));
			$(".node_formation img.e", targetBox).attr("src", KC3Meta.formationIcon(nodeInfo.eformation))
				.attr("title", KC3Meta.formationText(nodeInfo.eformation));
			$(".node_engage", targetBox).text( nodeInfo.engagement[2] );
			$(".node_engage", targetBox).addClass( nodeInfo.engagement[1] );
			$(".node_contact", targetBox).text([nodeInfo.fcontact, nodeInfo.econtact].join(" vs "));
			$(".node_detect", targetBox).text( nodeInfo.detection[0] );
			$(".node_detect", targetBox).addClass( nodeInfo.detection[1] );
			$(".node_airbattle", targetBox).text( nodeInfo.airbattle[0] );
			$(".node_airbattle", targetBox).addClass( nodeInfo.airbattle[1] );
			["Fighters","Bombers"].forEach(function(planeType){
				["player","abyssal"].forEach(function(side,jndex){
					const nodeName = ".node_"+(planeType[0])+(side[0]=='p' ? 'F' : 'A');
					// Plane total counts
					$(nodeName+"T", targetBox).text(nodeInfo["plane"+planeType][side][0]);
					// Plane losses
					if(nodeInfo["plane"+planeType][side][1] > 0)
						$(nodeName+"L", targetBox).text("-"+nodeInfo["plane"+planeType][side][1]);
				});
			});
			$(".node_planes", targetBox).attr("title", nodeInfo.buildAirBattleLossMessage());
		},
		
		/* PAGINATION
		---------------------------------*/
		showPagination :function(){
			const self = this;
			$(".tab_pvp .page_list").html('<ul class="pagination pagination-sm"></ul>');
			$(".tab_pvp .pagination").twbsPagination({
				totalPages: self.pages,
				visiblePages: 9,
				onPageClick: function (event, page) {
					self.showPage(page);
				}
			});
		},
		
		/* DOWNLOAD REPLAY
		---------------------------------*/
		downloadReplay :function(pvp_id, e){
			if(this.exportingReplay) return false;
			this.exportingReplay = true;
			
			const self = this;
			
			$("body").css("opacity", "0.5");
			
			if(this.stegcover64 === ""){
				this.stegcover64 = $.ajax({
					async: false,
					url: "../../../../assets/img/stegcover.b64"
				}).responseText;
			}
			
			var withDataCover64 = this.stegcover64;
			
			var rcanvas = document.createElement("canvas");
			rcanvas.width = 400;
			rcanvas.height = 400;
			var rcontext = rcanvas.getContext("2d");
			
			var domImg = new Image();
			domImg.onload = function(){
				rcontext.drawImage( domImg, 0, 0, 400, 400, 0, 0, 400, 400 );
				
				KC3Database.get_pvp_data(pvp_id, function(pvpData){
					console.debug("Downloading reply", pvp_id, ", data:", pvpData);
					if (pvpData.length === 0) {
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return false;
					} else {
						pvpData = pvpData[0];
					}
					
					rcontext.font = "26pt Calibri";
					rcontext.fillStyle = '#ffffff';
					rcontext.fillText("PvP", 20, 215);
					
					rcontext.font = "20pt Calibri";
					rcontext.fillStyle = '#ffffff';
					rcontext.fillText(PlayerManager.hq.name, 100, 210);
					
					var shipIconImage;
					$.each(pvpData.fleet, function(ShipIndex, ShipData){
						shipIconImage = $(".simg-"+ShipData.mst_id+" img")[0];
						rcontext.save();
						rcontext.beginPath();
						rcontext.arc((50 + 60 * ShipIndex),258,25,0,2*Math.PI);
						rcontext.closePath();
						rcontext.clip();
						rcontext.drawImage(shipIconImage, (shipIconImage.naturalWidth*0.17), 0, (shipIconImage.naturalWidth*0.67), shipIconImage.naturalHeight,
							(25 + 60 * ShipIndex), 232.5, 50, 50);
						rcontext.restore();
					});
					
					withDataCover64 = rcanvas.toDataURL("image/png");
					
					var encodeData = {
						battles: [
							{
								data: pvpData.data,
								yasen: pvpData.yasen
							}
						],
						combined: 0,
						diff: 0,
						fleet1: pvpData.fleet,
						fleet2: [],
						fleet3: [],
						fleet4: [],
						fleetnum: 1,
						hq: pvpData.hq,
						id: pvpData.id,
						support1: 0,
						support2: 0,
						world: 0,
						mapnum: 0,
					};
					
					if(e.which === 3) {
						if(e.altKey) {
							window.open("https://kc3kai.github.io/kancolle-replay/battleText.html#"
								+ JSON.stringify(encodeData), "_blank");
						} else {
							window.open("https://kc3kai.github.io/kancolle-replay/battleplayer.html#"
								+ encodeURIComponent(JSON.stringify(encodeData)), "_blank");
						}
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return true;
					} else if(e.altKey) {
						self.copyToClipboard(JSON.stringify(encodeData), () => {
							alert("Replay data copied to clipboard");
						});
						self.exportingReplay = false;
						$("body").css("opacity", "1");
						return true;
					}
					
					steg.encode(JSON.stringify(encodeData), withDataCover64, {
						success: function(newImg){
							KC3ImageExport.writeToCanvas(newImg, { width: 400, height: 400 },
							function (error, canvas) {
								if (error) {
									self.endExport(error);
									return;
								}
								new KC3ImageExport(canvas, {
									filename: PlayerManager.hq.name + '_pvp_' + pvpData.id,
									format: 'png',
									subDir: 'replay',
								}).export(self.endExport.bind(self));
							});
						},
						error: function(e){
							self.endExport(e);
							return false;
						}
					});
					
				}).catch(function(e) {
					self.endExport(e);
					return false;
				});
				
			};
			domImg.src = this.stegcover64;
		},
		
		endExport : function(error, result) {
			if (error) {
				console.error("Generating replay data failed", error);
				alert("Failed to generate replay data");
			} else if (result && result.filename) {
				// Show a response 'cause download bar is hidden
				alert("Saved to {0}".format(result.filename));
			}
			this.exportingReplay = false;
			$("body").css("opacity", "1");
		},
		
		copyToClipboard : function(stringData, successCallback) {
			const copyHandler = function(e) {
				e.preventDefault();
				if(e.clipboardData) {
					e.clipboardData.setData("text/plain", stringData);
					if(typeof successCallback === "function") {
						successCallback.call(this, e);
					}
				} else {
					console.warn("Browser does not support Clipboard event");
				}
				return true;
			};
			document.addEventListener("copy", copyHandler);
			document.execCommand("copy");
			document.removeEventListener("copy", copyHandler);
		}
		
	};
	
})();
