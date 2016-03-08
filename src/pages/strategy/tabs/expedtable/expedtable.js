(function(){
	"use strict";
	
	KC3StrategyTabs.expedtable = new KC3StrategyTab("expedtable");
	
	KC3StrategyTabs.expedtable.definition = {
		tabSelf: KC3StrategyTabs.expedtable,
		
		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			
		},
		
		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			
			// Add all expedition numbers on the list
			var KE = PS["KanColle.Expedition"];
			$('.tab_expedtable .expedNumbers').html("");
			KE.allExpeditions.forEach( function(curVal, ind) {
				var row = $('.tab_expedtable .factory .expedNum').clone();
				$(".expedCheck input", row).attr("value", curVal.id.toString());
				$(".expedText", row).text( curVal.id.toString() );
				$(".expedTime", row).text( (curVal.cost.time*60).toString().toHHMMSS().substring(0,5) );
				
				var boxNum = Math.ceil((ind+1)/8);
				$(".tab_expedtable .expedNumBox_"+boxNum).append( row );
			});
			
			// Add world toggle
			$(".tab_expedtable .expedNumBox")
				.filter(function(i,x){return $(x).hasClass("expedNumBox_"+(i+1));})
				.each(function(i,x){
					var
						row = $('.tab_expedtable .factory .expedNum').clone().addClass("expedWhole").removeClass("expedNum"),
						val = true;
					$("input",".expedNumBox_"+(i+1)).each(function(id,elm){
						val&= $(elm).prop("checked");
					});
					$(row)
						.find(".expedCheck input")
							.attr("value", i+1)
							.prop("checked", val)
						.end()
						.find(".expedText")
							.text( "World " + (i+1) )
						.end()
						.find(".expedTime")
							.remove()
						.end();
					
					$(x).prepend(row);
				}).on("click", '.expedNum input', function(){
					var
						worldNum     = Math.qckInt("ceil",($(this).attr("value")) / 8),
						context      = ".tab_expedtable .expedNumBox_"+worldNum,
						parentCheck  = true;
					self.exped_filters = [];
					$(".expedNum   input",context).each(function(i,x){ parentCheck &= $(x).prop("checked"); });
					$(".expedWhole input",context).prop("checked",parentCheck);
				}).on("click", ".expedWhole input", function() {
					var
						worldNum = $(this).val(),
						state    = $(this).prop("checked"),
						expeds   = $(".tab_expedtable .expedNumBox_"+worldNum+" .expedNum input");
					expeds.each(function(i,x){
						var
							elmState = $(x).prop("checked"),
							expedNum = parseInt($(x).val());
						if(elmState ^ state) { // check different state
							$(x).prop("checked",state);
						}
					});
				});
			
			// Calculate
			var resultTable = $('.tab_expedtable .results tbody');
			$('.tab_expedtable .calculate_btn').click(function(){
				var fP = parseInt($(".tab_expedtable .priorityFuel").val(), 10);
				var aP = parseInt($(".tab_expedtable .priorityAmmo").val(), 10);
				var sP = parseInt($(".tab_expedtable .prioritySteel").val(), 10);
				var bP = parseInt($(".tab_expedtable .priorityBaux").val(), 10);
				var afkHH = parseInt($(".tab_expedtable .afkH").val(), 10);
				var afkMM = parseInt($(".tab_expedtable .afkM").val(), 10);
				
				var afkTime = afkHH*60 + afkMM;
				
				var KEP = PS["KanColle.Expedition.Plan"];
				resultTable.empty();
				
				var selectedItemsQ = $('.tab_expedtable .expedNumBox .expedNum input:checked');
				
				var selectedItems = [];
				selectedItemsQ.each( function() {
					selectedItems.push( parseInt( $(this).attr("value"),10) );
				});
				
				var fleetCount = parseInt( $(".tab_expedtable .fleetCounts input:checked").val(), 10);
				
				var results = KEP.calcWithExpeditionIdsFleetCountJS(fleetCount,fP,aP,sP,bP,afkTime,selectedItems);
				
				for (var i = 0; i < results.length && i < 50; ++i) {
					var curVal = results[i];
					var row = $('<tr></tr>');
					$('<td></td>').text(curVal.eIds).appendTo(row);
					$('<td></td>').text(curVal.hourly.fuel.toFixed(2)).appendTo(row);
					$('<td></td>').text(curVal.hourly.ammo.toFixed(2)).appendTo(row);
					$('<td></td>').text(curVal.hourly.steel.toFixed(2)).appendTo(row);
					$('<td></td>').text(curVal.hourly.bauxite.toFixed(2)).appendTo(row);
					$('<td></td>').text(curVal.resourceScore.toFixed(2)).appendTo(row);
					resultTable.append( row );

				}
			});
		}
		
	};
	
})();