/* Listeners.js
Network Listeners on Natsuiro theme
*/
(function(){
	"use strict";
	
	window.NatsuiroListeners = {
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