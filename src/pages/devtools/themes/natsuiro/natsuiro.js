(function(){
	"use strict";
	
	// Flags
	var currentLayout = "";
	var isRunning = false;
	
	// Interface values
	var selectedFleet = 1;
	
	
	$(document).on("ready", function(){
		// Check localStorage
		if(!window.localStorage){
			$("#wait").hide();
			$("<div>").css({
				"width" : "450px",
				"padding" : "15px 20px",
				"background" : "#fcc",
				"border-radius" : "10px",
				"margin" : "30px auto 0px",
				"text-align" : "center",
				"font-weight" : "bold",
				"font-size" : "12px",
				"border" : "1px solid #c77"
			}).html( KC3Meta.term("PanelErrorStorage") ).appendTo("body");
			return true;
		}
		
		// Initialize data managers
		ConfigManager.load();
		KC3Meta.init("../../../../data/");
		KC3Meta.defaultIcon("../../../../assets/img/ui/empty.png");
		KC3Master.init();
		PlayerManager.init();
		KC3ShipManager.load();
		KC3GearManager.load();
		KC3Database.init();
		KC3Translation.execute();
		
		// Panel customizations: panel opacity
		$(".wrapper_bg").css("opacity", ConfigManager.pan_opacity/100);
		
		// Panel customizations: bg image
		if(ConfigManager.pan_bg_image === ""){
			$("body").css("background", ConfigManager.pan_bg_color);
		}else{
			$("body").css("background-image", "url("+ConfigManager.pan_bg_image+")");
			$("body").css("background-color", ConfigManager.pan_bg_color);
			$("body").css("background-size", ConfigManager.pan_bg_size);
			$("body").css("background-position", ConfigManager.pan_bg_position);
			$("body").css("background-repeat", "no-repeat");
		}
		
		// Close CatBomb modal
		$("#catBomb .closebtn").on("click", function(){
			$("#catBomb").fadeOut(300);
		});
		
		// HQ name censoring
		$(".admiral_name").on("click", function(){
			if($(this).hasClass("censor")){
				$(this).removeClass("censor");
			}else{
				$(this).addClass("censor");
			}
		});
		
		// Screenshot buttons
		$(".module.controls .btn_ss1").on("click", function(){
			$(this).hide();
			
			// Tell service to pass a message to gamescreen on inspected window to get a screenshot
			(new RMsg("service", "screenshot", {
				tabId: chrome.devtools.inspectedWindow.tabId,
				playerName: PlayerManager.hq.name
			}, function(response){
				$(".module.controls .btn_ss1").show();
			})).execute();
		});
		
		// Switching Activity Tabs
		$(".module.activity .activity_tab").on("click", function(){
			$(".module.activity .activity_tab").removeClass("active");
			$(this).addClass("active");
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_"+$(this).data("target")).show();
		});
		$(".module.activity .activity_tab.active").trigger("click");
		
		// Fleet selection
		$(".module.controls .fleet_num").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(".module.controls .fleet_rengo").removeClass("active");
			$(this).addClass("active");
			selectedFleet = parseInt( $(this).text(), 10);
			Listeners.Fleet();
		});
		
		// Combined Fleet button
		$(".module.controls .fleet_rengo").on("click", function(){
			$(".module.controls .fleet_num").removeClass("active");
			$(this).addClass("active");
			selectedFleet = 5;
			Listeners.Fleet();
		});
		
		// Toggle mini-bars under combined fleet ship list
		$(".module.fleet .shiplist_combined").on("click", ".sship .ship_bars", function(){
			if($(this).css("opacity") == "0"){
				$(".module.fleet .sship .ship_bars").css("opacity", "1");
			}else{
				$(".module.fleet .sship .ship_bars").css("opacity", "0");
			}
		});
		
		// Trigger initial selected fleet num
		$(".module.controls .fleet_num.active").trigger("click");
		
		// Initialize timer objects with bindings to their UI
		KC3TimerManager.init([
			$(".module.activity .expedition_1"),
			$(".module.activity .expedition_2"),
			$(".module.activity .expedition_3")
		],
		[
			$(".module.activity .repair_1"),
			$(".module.activity .repair_2"),
			$(".module.activity .repair_3"),
			$(".module.activity .repair_4")
		],
		[
			$(".module.activity .build_1"),
			$(".module.activity .build_2"),
			$(".module.activity .build_3"),
			$(".module.activity .build_4")
		]);
		
		// Update Timer UIs
		setInterval(function(){
			KC3TimerManager.update();
		}, 1000);
		
		// Devbuild: auto-activate dashboard while designing
		Activate();
		
		// Start Network listener
		KC3Network.addGlobalListener(function(event, data){
			if(isRunning || event == "HomeScreen" || event == "GameStart"){
				if(typeof Listeners[event] != "undefined"){
					Listeners[event](data);
				}
			}
		});
		KC3Network.listen();
		
		// Attempt to activate game on inspected window
		(new RMsg("service", "activateGame", {
			tabId: chrome.devtools.inspectedWindow.tabId
		})).execute();
		
		// Waiting for actions
		$("<div>").css({
			"width" : "300px",
			"height" : "50px",
			"line-height" : "50px",
			"background" : "#fff",
			"border-radius" : "10px",
			"margin" : "30px auto 0px",
			"text-align" : "center",
			"font-weight" : "bold",
			"font-size" : "14px"
		}).addClass("waitingForActions").html( KC3Meta.term("PanelWaitActions") ).appendTo("body");
	});
	
	
	$(window).on("resize", function(){
		Orientation();
	});
	
	
	function Activate(){
		isRunning = true;
		Orientation();
		$(".waitingForActions").hide();
		$(".wrapper").show();
	}
	
	
	function Orientation(){
		if(!isRunning){ return false; }
		
		// Wide interface, switch to vertical if not yet
		if( $(window).width() >= 800 && currentLayout != "vertical" ){
			$(".wrapper").removeClass("h").addClass("v");
			
		// Narrow interface, switch to horizontal if not yet
		}else if( $(window).width() < 800 && currentLayout != "horizontal" ){
			$(".wrapper").removeClass("v").addClass("h");
		}
	}
	
	
	/* NETWORK LISTENERS
	----------------------------*/
	var Listeners = {
		GameStart: function(data){ Activate(); },
		HomeScreen: function(data){ Activate(); },
		
		CatBomb: function(data){
			$("#catBomb").hide();
			$("#catBomb .title").html( data.title );
			$("#catBomb .description").html( data.message );
			$("#catBomb").fadeIn(300);
		},
		
		HQ: function(data){
			$(".admiral_name").text( PlayerManager.hq.name );
			$(".admiral_comm").text( PlayerManager.hq.desc );
			$(".admiral_rank").text( PlayerManager.hq.rank );
			$(".admiral_lvval").text( PlayerManager.hq.level );
			$(".admiral_lvbar").css({width: Math.round(PlayerManager.hq.exp[0]*58)+"px"});
			$(".admiral_lvnext").text( "-"+PlayerManager.hq.exp[1] );
		},
		
		Consumables: function(data){
			$(".count_fcoin").text( PlayerManager.consumables.fcoin );
			$(".count_buckets").text( PlayerManager.consumables.buckets );
			$(".count_screws").text( PlayerManager.consumables.screws );
			$(".count_torch").text( PlayerManager.consumables.torch );
		},
		
		ShipSlots: function(data){
			$(".count_ships").text( KC3ShipManager.count() ).each(function(){
				if((KC3ShipManager.max - KC3ShipManager.count()) <= 5){
					$(this).addClass("danger");
				}else{
					$(this).removeClass("danger");
				}
			});
			$(".max_ships").text( "/"+ KC3ShipManager.max );
		},
		
		GearSlots: function(data){
			$(".count_gear").text( KC3GearManager.count() ).each(function(){
				if((KC3GearManager.max - KC3GearManager.count()) <= 20){
					$(this).addClass("danger");
				}else{
					$(this).removeClass("danger");
				}
			});
			$(".max_gear").text( "/"+ KC3GearManager.max );
		},
		
		Timers: function(data){
			// Expedition numbers
			KC3TimerManager._exped[0].expnum();
			KC3TimerManager._exped[1].expnum();
			KC3TimerManager._exped[2].expnum();
			
			// Repair faces
			KC3TimerManager._repair[0].face();
			KC3TimerManager._repair[1].face();
			KC3TimerManager._repair[2].face();
			KC3TimerManager._repair[3].face();
			
			// Construction faces
			if(ConfigManager.info_face){
				KC3TimerManager._build[0].face();
				KC3TimerManager._build[1].face();
				KC3TimerManager._build[2].face();
				KC3TimerManager._build[3].face();
			}
		},
		
		Quests: function(data){
			KC3QuestManager.load();
			var questType, questBox;
			$(".module.quests").html("");
			$.each(KC3QuestManager.getActives(), function(index, quest){
				questBox = $("#factory .quest").clone().appendTo(".module.quests");
				if(!quest.tracking){ questBox.addClass("untracked"); }
				$(".quest_color", questBox).css("background", quest.getColor() );
				if(quest.meta){
					$(".quest_text", questBox).text( quest.meta().name );
					$(".quest_text", questBox).attr("title", quest.meta().desc );
				}else{
					$(".quest_text", questBox).text( KC3Meta.term("UntranslatedQuest") );
					$(".quest_text", questBox).attr("title", KC3Meta.term("UntranslatedQuest") );
				}
				$(".quest_track", questBox).text( quest.outputShort(true) );
				$(".quest_track", questBox).attr("title", quest.outputShort(true) );
			});
		},
		
		Fleet: function(data){
			var FleetSummary;
			
			$(".shiplist_single").html("");
			$(".shiplist_single").hide();
			$(".shiplist_combined_fleet").html("");
			$(".shiplist_combined").hide();
			
			// COMBINED
			if(selectedFleet==5){
				var MainFleet = PlayerManager.fleets[0];
				var EscortFleet = PlayerManager.fleets[1];
				
				FleetSummary = {
					lv: MainFleet.totalLevel() + EscortFleet.totalLevel(),
					elos: Math.round( (MainFleet.eLoS()+EscortFleet.eLoS()) * 100) / 100,
					air: MainFleet.fighterPower() + EscortFleet.fighterPower(),
					speed:
						(MainFleet.fastFleet && EscortFleet.fastFleet)
						? KC3Meta.term("SpeedFast") : KC3Meta.term("SpeedSlow")
				};
				
				$.each(MainFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".sship", rosterId))
							.commonElements()
							.defineShort()
							.appendTo(".module.fleet .shiplist_main");
					}
				});
				
				$.each(EscortFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".sship", rosterId))
							.commonElements()
							.defineShort()
							.appendTo(".module.fleet .shiplist_escort");
					}
				});
				
				$(".shiplist_combined").show();
				
			// SINGLE
			}else{
				var CurrentFleet = PlayerManager.fleets[selectedFleet-1];
				
				FleetSummary = {
					lv: CurrentFleet.totalLevel(),
					elos: Math.round( CurrentFleet.eLoS() * 100) / 100,
					air: CurrentFleet.fighterPower(),
					speed: CurrentFleet.speed()
				};
				
				$.each(CurrentFleet.ships, function(index, rosterId){
					if(rosterId > -1){
						(new KC3NatsuiroShipbox(".lship", rosterId))
							.commonElements()
							.defineLong()
							.appendTo(".module.fleet .shiplist_single");
					}
				});
				
				$(".shiplist_single").show();
			}
			
			// Fleet Summary Stats
			$(".summary-level .summary_text").text( FleetSummary.lv );
			$(".summary-eqlos .summary_text").text( FleetSummary.elos );
			$(".summary-airfp .summary_text").text( FleetSummary.air );
			$(".summary-speed .summary_text").text( FleetSummary.speed );
			
			// Expedition Timer Faces
			if(KC3TimerManager._exped.length > 0){
				KC3TimerManager._exped[0].faceId = PlayerManager.fleets[1].ship(0).masterId;
				KC3TimerManager._exped[1].faceId = PlayerManager.fleets[2].ship(0).masterId;
				KC3TimerManager._exped[2].faceId = PlayerManager.fleets[3].ship(0).masterId;
				KC3TimerManager._exped[0].face();
				KC3TimerManager._exped[1].face();
				KC3TimerManager._exped[2].face();
			}
		},
		
		dummy: {}
	};
	
})();