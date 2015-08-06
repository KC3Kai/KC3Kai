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
		var oldBG = $(".wrapper").css("background-color");
		var newBG = oldBG.insert( oldBG.length-1, ", "+(ConfigManager.pan_opacity/100) );
		newBG = newBG.insert(3, "a");
		$(".wrapper").css("background-color", newBG);
		
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
		
		// Switching Activity Tabs
		$(".module.activity .activity_tab").on("click", function(){
			$(".module.activity .activity_tab").removeClass("active");
			$(this).addClass("active");
			$(".module.activity .activity_box").hide();
			$(".module.activity .activity_"+$(this).data("target")).show();
		});
		$(".module.activity .activity_tab.active").trigger("click");
		
		// Initialize timer objects with bindings to their UI
		KC3TimerManager.init([
			$("#wrapper .exped-box-1"),
			$("#wrapper .exped-box-2"),
			$("#wrapper .exped-box-3")
		],
		[
			$("#wrapper .repair-box-1"),
			$("#wrapper .repair-box-2"),
			$("#wrapper .repair-box-3"),
			$("#wrapper .repair-box-4")
		],
		[
			$("#wrapper .build-box-1"),
			$("#wrapper .build-box-2"),
			$("#wrapper .build-box-3"),
			$("#wrapper .build-box-4")
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
				Listeners[event](data);
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
			var CurrentFleet = PlayerManager.fleets[selectedFleet-1];
			
			// Fleet Summary Stats
			$(".summary-level .summary-text").text( CurrentFleet.totalLevel() );
			$(".summary-eqlos .summary-text").text( Math.round( CurrentFleet.eLoS() * 100) / 100 );
			$(".summary-airfp .summary-text").text( CurrentFleet.fighterPower() );
			$(".summary-speed .summary-text").text( CurrentFleet.speed() );
			$(".wrapper").css("box-shadow", "none");
			
			// Fleet Ships
			var FleetContainer = $(".fleet-ships");
			FleetContainer.html("");
			$.each(CurrentFleet.ships, function(index, rosterId){
				if(rosterId > -1){
					var CurrentShip = KC3ShipManager.get( rosterId );
					if(CurrentShip.masterId === 0){ return true; }
					var ShipBox = $(".factory .fleet-ship").clone().appendTo(FleetContainer);
					
					$(".ship-img img", ShipBox).attr("src", KC3Meta.shipIcon(CurrentShip.masterId));
					$(".ship-name", ShipBox).text( CurrentShip.name() );
					$(".ship-type", ShipBox).text( CurrentShip.stype() );
					$(".ship-lvl-txt", ShipBox).text(CurrentShip.level);
					$(".ship-lvl-next", ShipBox).text("-"+CurrentShip.exp[1]);
					$(".ship-lvl-val", ShipBox).css("width", (60*(CurrentShip.exp[2]/100))+"px");
					
					// FleetHP($(".wrapper"), ShipBox, CurrentShip.hp, rosterId );
					// FleetMorale( $(".ship-morale-box", ShipBox), CurrentShip.morale );

					for(var i = 1; i <= 4; i++){
						var gearBox = $(".ship-gear-" + i, ShipBox);
						if (i <= CurrentShip.slotnum) {
							// FleetEquipment( gearBox, CurrentShip.equipment(i-1), CurrentShip.slots[i-1] );
							if (CurrentShip.equipment(i-1).itemId > 0) {
								$(".ship-equip-capacity", gearBox).hide();
							}
						} else {
							// FleetEquipment( gearBox, null, null );
						}
					}
				}
			});
			
			// Expedition Timer Faces
			KC3TimerManager._exped[0].face( PlayerManager.fleets[1].ship(0).masterId );
			KC3TimerManager._exped[1].face( PlayerManager.fleets[2].ship(0).masterId );
			KC3TimerManager._exped[2].face( PlayerManager.fleets[3].ship(0).masterId );
		},
		
		dummy: {}
	};
	
})();