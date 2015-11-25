(function(){
	"use strict";
	
	KC3StrategyTabs.expcalc = new KC3StrategyTab("expcalc");
	
	KC3StrategyTabs.expcalc.definition = {
		tabSelf: KC3StrategyTabs.expcalc,
		goals: {},
		mapexp: [],
		maplist: {},
		shipexp: {},
		
		rankNames: ["F", "E", "D", "C", "B", "A", "S", "SS" ],
		rankFactors: [0, 0.5, 0.7, 0.8, 1, 1, 1.2],
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Check for saved grind data
			if(typeof localStorage.goals != "undefined"){
				this.goals = JSON.parse(localStorage.goals);
			}
			
			// Get map exp rewards
			this.mapexp = JSON.parse($.ajax({
				url : '../../../../data/exp_map.json',
				async: false
			}).responseText);
			
			var self = this;
			$.each(this.mapexp, function(worldNum, mapNums){
				$.each(mapNums, function(mapNum, mapExp){
					if(mapExp > 0){
						self.maplist[worldNum+"-"+(mapNum+1)] = mapExp;
					}
				});
			});
			
			
			console.log(this.maplist);
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;
			
			// Add map list into the factory drop-downs
			$.each(this.maplist, function(MapName, MapExp){
				$(".tab_expcalc .factory .ship_map select").append("<option>"+MapName+"</option>");
			});
			
			var editingBox, mapSplit;
			
			// Edit Button
			$(".tab_expcalc .box_goals").on("click", ".ship_edit", function(){
				editingBox = $(this).parent();
				var grindData = self.goals[ "s"+editingBox.data("id") ];
				
				$(".ship_target input", editingBox).val( grindData[0] );
				$(".ship_map select", editingBox).val( grindData[1]+"-"+grindData[2] );
				$(".ship_rank select", editingBox).val(  grindData[4] );
				$(".ship_fs input", editingBox).prop("checked", grindData[5]);
				$(".ship_mvp input", editingBox).prop("checked", grindData[6]);
				
				$(".ship_value" , editingBox).hide();
				$(".ship_input" , editingBox).show();
				
				$(".ship_edit" , editingBox).hide();
				$(".ship_save" , editingBox).show();
			});
			
			// Save Button
			$(".tab_expcalc .box_goals").on("click", ".ship_save", function(){
				editingBox = $(this).parent();
				
				mapSplit = $(".ship_map select", editingBox).val().split("-");
				console.log("mapSplit", mapSplit);
				self.goals["s"+ editingBox.data("id") ] = [
					/*0*/ parseInt($(".ship_target input", editingBox).val(), 10), // target level
					/*1*/ parseInt(mapSplit[0], 10), // world
					/*2*/ parseInt(mapSplit[1], 10), // map
					/*3*/ 0, // node
					/*4*/ parseInt($(".ship_rank select", editingBox).val(), 10), // battle rank
					/*5*/ $(".ship_fs input", editingBox).prop("checked")?1:0, // flagship
					/*6*/ $(".ship_mvp input", editingBox).prop("checked")?1:0 // mvp
				];
				
				self.save();
				
				self.recompute( editingBox.data("id") );
				
				$(".ship_value" , editingBox).show();
				$(".ship_input" , editingBox).hide();
				
				$(".ship_edit" , editingBox).show();
				$(".ship_save" , editingBox).hide();
			});
			
			// Add to Goals Button
			$(".tab_expcalc").on("click", ".ship_add", function(){
				editingBox = $(this).parent();
				self.goals["s"+ editingBox.data("id") ] = [];
				self.save();
				//window.location.reload();
				
				$(".ship_edit", editingBox).show();
				$(".ship_rem", editingBox).show();
				editingBox.removeClass("inactive");
				editingBox.appendTo(".tab_expcalc .box_goals");
				self.recompute( editingBox.data("id") );
			});
			
			// Remove from Goals Button
			$(".tab_expcalc").on("click", ".ship_rem", function(){
				editingBox = $(this).parent();
				delete self.goals["s"+ editingBox.data("id") ];
				self.save();
				//window.location.reload();
				
				$(".ship_save", editingBox).hide();
				$(".ship_edit", editingBox).hide();
				$(".ship_rem", editingBox).hide();
				editingBox.addClass("inactive");
				var ThisShip = KC3ShipManager.get(editingBox.data("id"));
				if(ThisShip.master().api_aftershipid > 0 && ThisShip.level<ThisShip.master().api_afterlv){
					$(".tab_expcalc .box_recommend .clear").remove();
					editingBox.appendTo(".tab_expcalc .box_recommend");
					$("<div />").addClass("clear").appendTo(".tab_expcalc .box_recommend");
				}else{
					$(".tab_expcalc .box_other .clear").remove();
					editingBox.appendTo(".tab_expcalc .box_other");
					$("<div />").addClass("clear").appendTo(".tab_expcalc .box_other");
				}
			});
			
			// Show all ship_save
			var goalBox;
			$.each(KC3ShipManager.list, function(index, ThisShip){
				if(!ThisShip.lock){ return true; }
				
				// Create the ship box
				goalBox = $(".tab_expcalc .factory .ship_goal").clone();
				goalBox.attr("id", "goalBox"+ThisShip.rosterId);
				goalBox.data("id", ThisShip.rosterId);
				
				// Icon and level, common for all categories
				$(".ship_icon img", goalBox).attr("src", KC3Meta.shipIcon(ThisShip.masterId) );
				$(".ship_icon img", goalBox).attr("title", ThisShip.rosterId );
				$(".ship_name", goalBox).text( ThisShip.name() );
				$(".ship_type", goalBox).text( ThisShip.stype() );
				$(".ship_lv .ship_value", goalBox).text( ThisShip.level );
				
				// If ship already on the current goals
				if(typeof self.goals["s"+ThisShip.rosterId] != "undefined"){
					$(".ship_edit", goalBox).show();
					$(".ship_rem", goalBox).show();
					goalBox.appendTo(".tab_expcalc .box_goals");
					
					self.recompute( ThisShip.rosterId );
					return true;
				}
				
				goalBox.addClass("inactive");
				
				// If still has next remodel, add to recommendations
				if(ThisShip.master().api_aftershipid > 0 && ThisShip.level<ThisShip.master().api_afterlv){
					$(".ship_target .ship_value", goalBox).text( ThisShip.master().api_afterlv );
					goalBox.appendTo(".tab_expcalc .box_recommend");
					return true;
				}
				
				// If this is the last remodel stage, add to others
				if(ThisShip.level<99){
					$(".ship_target .ship_value", goalBox).text( 99 );
				}else{
					$(".ship_target .ship_value", goalBox).text( 150 );
				}
				goalBox.appendTo(".tab_expcalc .box_other");
			});
			
			//this.save();
			
			$("<div />").addClass("clear").appendTo(".tab_expcalc .box_recommend");
			$("<div />").addClass("clear").appendTo(".tab_expcalc .box_other");
		},
		
		save: function(){
			localStorage.goals = JSON.stringify(this.goals);
		},
		
		recompute: function( rosterId ){
			var goalBox = $("#goalBox"+rosterId);
			var grindData = this.goals["s"+rosterId];
			var ThisShip = KC3ShipManager.get( rosterId );
			var MasterShip = ThisShip.master();
			
			// This has just been added, no grinding data yet, initialize defaults
			if(grindData.length === 0){
				// As much as possible use arrays nowadays to shrink JSON size, we might run out of the 5MB localStorage allocated for our app
				grindData = [
					/*0*/ (MasterShip.api_aftershipid > 0 && ThisShip.level<MasterShip.api_afterlv)?MasterShip.api_afterlv:(ThisShip.level<99)?99:150, // target level
					/*1*/ 1, // world
					/*2*/ 1, // map
					/*3*/ 1, // node
					/*4*/ 6, // E=1 D=2 C=3 B=4 A=5 S=6 SS=7
					/*5*/ 0, // flagship
					/*6*/ 0 // mvp
				];
				this.goals["s"+ThisShip.rosterId] = grindData;
			}else{
				
			}
			
			// Target level
			$(".ship_target .ship_value", goalBox).text( grindData[0] );
			
			// Experience Left
			var expLeft = KC3Meta.expShip(grindData[0])[1] - ThisShip.exp[0];
			$(".ship_exp .ship_value", goalBox).text( expLeft );
			
			// Base Experience: MAP
			$(".ship_map .ship_value", goalBox).text( grindData[1]+"-"+grindData[2] );
			var expPerSortie = this.maplist[ grindData[1]+"-"+grindData[2] ];
			
			// Exp Modifier: MVP
			$(".ship_mvp .ship_value", goalBox).text( grindData[6]?"Yes":"No" );
			if(grindData[6]===1){ expPerSortie = expPerSortie * 2; }
			
			// Exp Modifier: FLAGSHIP
			$(".ship_fs .ship_value", goalBox).text( grindData[5]?"Yes":"No" );
			if(grindData[5]===1){ expPerSortie = expPerSortie * 1.5; }
			
			// Exp Modifier: RANK
			$(".ship_rank .ship_value", goalBox).text( this.rankNames[grindData[4]] );
			expPerSortie = expPerSortie * this.rankFactors[grindData[4]];
			
			// RESULT: Battles Left
			$(".ship_result .ship_value", goalBox).text( Math.ceil(expLeft / expPerSortie) );
		}
		
	};
	
})();
