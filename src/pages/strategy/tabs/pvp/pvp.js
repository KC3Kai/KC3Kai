(function(){
	"use strict";
	
	KC3StrategyTabs.pvp = new KC3StrategyTab("pvp");
	
	KC3StrategyTabs.pvp.definition = {
		tabSelf: KC3StrategyTabs.pvp,
		
		box_record: false,
		box_ship: false,
		
		exportingReplay: false,
		stegcover64: "",
		
		toggleMode: 1,
		itemsPerPage: 10,
		
		init :function(){},
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
					self.showPage(1);
				} else {
					$(".tab_pvp .pagination").hide();
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
			var self = this;
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
			});
		},
		
		/* CLONE ONE BATTLE BOX RECORD
		---------------------------------*/
		cloneBattleBox :function(pvpBattle){
			//console.debug("PvP battle record:", pvpBattle);
			var self = this;
			
			self.box_record = $(".tab_pvp .factory .pvp_record").clone();
			
			// Basic battle info
			$(".pvp_id", self.box_record).text(pvpBattle.id);
			if (pvpBattle.time) {
				let pvpTime = new Date(pvpBattle.time * 1000);
				$(".pvp_date", self.box_record).text(pvpTime.format("mmm d"))
					.attr("title", pvpTime.format("yyyy-mm-dd HH:MM:ss"));
			} else {
				$(".pvp_date", self.box_record).text("Unknown");
			}
			$(".pvp_result img", self.box_record)
				.attr("src", "../../assets/img/client/ratings/"+pvpBattle.rating+".png")
				.attr("title", "Base EXP " + pvpBattle.baseEXP );
			$(".pvp_dl", self.box_record).data("id", pvpBattle.id);
			
			// Player fleet
			$.each(pvpBattle.fleet, function(index, curShip){
				if (curShip == -1) return true;
				if (pvpBattle.mvp[0] == index+1) {
					curShip.mvp = true;
				}
				self.cloneShipBox(curShip, $(".pvp_player", self.box_record));
			});
			
			// Opponent Fleet
			$.each(pvpBattle.data.api_ship_ke, function(index, mstId){
				if (mstId == -1) return true;
				self.cloneShipBox({
					opponent: true,
					equip: pvpBattle.data.api_eSlot[index],
					kyouka: pvpBattle.data.api_eKyouka[index],
					hp: pvpBattle.data.api_maxhps[index+7],
					stats: pvpBattle.data.api_eParam[index],
					level: pvpBattle.data.api_ship_lv[index+1],
					mst_id: mstId,
				}, $(".pvp_opponent", self.box_record));
			});
			
			self.fillBattleInfo(pvpBattle, $(".pvp_battle", self.box_record));
			
			self.box_record.appendTo("#pvp_list");
		},
		
		/* CLONE ONE SHIP BOX INTO BATTLE LIST
		---------------------------------*/
		cloneShipBox :function(data, targetBox){
			var self = this;
			var shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			var gearClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstgear", $(this).attr("alt"));
			};
			this.box_ship = $(".tab_pvp .factory .pvp_details_ship").clone();
			
			let shipName = KC3Meta.shipName(KC3Master.ship(data.mst_id).api_name);
			$(".pvp_ship_icon img", this.box_ship).attr("src", KC3Meta.shipIcon(data.mst_id))
				.attr("alt", data.mst_id).click(shipClickFunc);
			$(".pvp_ship_icon", this.box_ship).addClass("simg-"+data.mst_id);
			$(".pvp_ship_icon", this.box_ship).addClass("hover");
			$(".pvp_ship_name", this.box_ship).text(shipName)
				.attr("title", shipName);
			
			$(".pvp_ship_level span", this.box_ship).text(data.level);
			if (!data.opponent) {
				if (data.mvp) $(".pvp_ship_mvp_icon", this.box_ship).show();
			} else {
				$(".pvp_ship_hp span", this.box_ship).text(data.hp);
				$(".pvp_ship_level", this.box_ship).attr("title", "HP " + data.hp);
				$(".pvp_ship_fp", this.box_ship).text(data.stats[0]);
				$(".pvp_ship_tp", this.box_ship).text(data.stats[1]);
				$(".pvp_ship_aa", this.box_ship).text(data.stats[2]);
				$(".pvp_ship_ar", this.box_ship).text(data.stats[3]);
			}
			
			var thisItem, divTag, imgTag;
			$.each(data.equip, function(index, itemMstId){
				if (itemMstId > 0) {
					var divTag = $("<div/>").addClass("pvp_ship_item");
					
					thisItem = KC3Master.slotitem(itemMstId);
					var imgTag = $("<img/>").attr("src", "../../assets/img/items/"+thisItem.api_type[3]+".png")
						.attr("alt", itemMstId)
						.attr("title", KC3Meta.gearName(thisItem.api_name))
						.click(gearClickFunc);
					divTag.append(imgTag).addClass("hover");
					
					$(".pvp_ship_items", self.box_ship).append(divTag);
				}
			});
			
			targetBox.append(this.box_ship);
		},
		
		/* FILL BATTLE INFO WITH DATA
		---------------------------------*/
		fillBattleInfo :function(data, targetBox){
			// Process battle
			KC3SortieManager.onPvP = true;
			var thisPvP = (new KC3Node()).defineAsBattle();
			KC3SortieManager.nodes.push(thisPvP);
			thisPvP.isPvP = true;
			
			var battle_info_html = $(".tab_pvp .factory .pvp_battle_info").html();
			
			// Day Battle
			thisPvP.engage( data.data, 1);
			$(".pvp_battle_day", targetBox).html(battle_info_html);
			this.fillBattleBox(thisPvP, $(".pvp_battle_day", targetBox));
		},
		
		/* FILL ONE BATTLE BOX (DAY/NIGHT)
		---------------------------------*/
		fillBattleBox :function(nodeInfo, targetBox){
			//console.debug("Simulated node info:", nodeInfo);
			$(".node_engage", targetBox).text( nodeInfo.engagement[2] );
			$(".node_engage", targetBox).addClass( nodeInfo.engagement[1] );
			$(".node_contact", targetBox).text(nodeInfo.fcontact +" vs "+nodeInfo.econtact);
			$(".node_detect", targetBox).text( nodeInfo.detection[0] );
			$(".node_detect", targetBox).addClass( nodeInfo.detection[1] );
			$(".node_airbattle", targetBox).text( nodeInfo.airbattle[0] );
			$(".node_airbattle", targetBox).addClass( nodeInfo.airbattle[1] );
			["Fighters","Bombers"].forEach(function(planeType){
				["player","abyssal"].forEach(function(side,jndex){
					var nodeName = ".node_"+(planeType[0])+(side[0]=='p' ? 'F' : 'A');
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
			var self = this;
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
			
			var self = this;
			
			$("body").css("opacity", "0.5");
			
			if(this.stegcover64===""){
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
				
				KC3Database.get_pvp_data( pvp_id, function(pvpData){
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
						rcontext.drawImage(shipIconImage,0,0,70,70,25+(60*ShipIndex),233,50,50);
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
						id: 0,
						support1: 0,
						support2: 0,
						world: 0,
						mapnum: 0,
					};
					
					if(e.which === 3) {
						window.open("https://kc3kai.github.io/kancolle-replay/battleplayer.html#" + encodeURIComponent(JSON.stringify(encodeData), "_blank"));
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
					
				});
				
			};
			domImg.src = this.stegcover64;
		},
		
		endExport : function(error, result) {
			if (error) {
				console.error(error, error.stack);
				alert("Failed to generate replay data");
			} else if (result && result.filename) {
				// Show a response 'cause download bar is hidden
				alert("Saved to {0}".format(result.filename));
			}
			this.exportingReplay = false;
			$("body").css("opacity", "1");
		}
		
	};
	
})();
