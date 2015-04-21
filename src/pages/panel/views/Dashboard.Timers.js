KC3.prototype.Dashboard.Timers = {
	interval: {},
	seconds:[[0,0,0],[0,0,0,0],[0,0,0,0]],
	
	init :function(){
		var self = this;
		this.interval = setInterval(function(){ self.countDown(); },1000);
	},
	
	countDown :function(){
		var numCtr;
		
		// Expedition
		for(numCtr in this.seconds[0]){
			if( this.seconds[0][numCtr] > 0 ){
				this.seconds[0][numCtr]--;
				this.timerText(".exped-box-"+(parseInt(numCtr,10)), this.seconds[0][numCtr]);
			}
		}
		
		// Repair
		for(numCtr in this.seconds[1]){
			if( this.seconds[1][numCtr] > 0 ){
				this.seconds[1][numCtr]--;
				this.timerText(".repair-box-"+(parseInt(numCtr,10)+1), this.seconds[1][numCtr]);
			}
		}
		
		// Construction
		for(numCtr in this.seconds[2]){
			if( this.seconds[2][numCtr] > 0 ){
				this.seconds[2][numCtr]--;
				this.timerText(".build-box-"+(parseInt(numCtr,10)+1), this.seconds[2][numCtr]);
			}
		}
	},
	
	timerText :function(element, remaining){
		remaining = Math.floor(remaining);
		
		var hrs = Math.floor(remaining/3600);
		remaining = remaining - (hrs * 3600);
		if(hrs < 10){ hrs = "0"+hrs; }
		
		var min = Math.floor(remaining/60);
		remaining = remaining - (min * 60);
		if(min < 10){ min = "0"+min; }
		
		if(remaining < 10){ remaining = "0"+remaining; }
		
		$(element+" .timer-time").text(hrs+":"+min+":"+remaining);
	},
	
	update :function(){
		var tmpClass = "box-timers-"+app.Player._repairCount;
		if( !$(".box-repairs").hasClass(tmpClass) ){
			$(".box-repairs").removeClass("box-timers-2");
			$(".box-repairs").removeClass("box-timers-3");
			$(".box-repairs").removeClass("box-timers-4");
			$(".box-repairs").addClass(tmpClass);
		}
		
		tmpClass = "box-timers-"+app.Player._buildCount;
		if( !$(".box-constructions").hasClass(tmpClass) ){
			$(".box-constructions").removeClass("box-timers-2");
			$(".box-constructions").removeClass("box-timers-3");
			$(".box-constructions").removeClass("box-timers-4");
			$(".box-constructions").addClass(tmpClass);
		}
		
		this.expedition( $(".exped-box-1"), 1 );
		this.expedition( $(".exped-box-2"), 2 );
		this.expedition( $(".exped-box-3"), 3 );
		
		this.repair( $(".repair-box-1"), 0 );
		this.repair( $(".repair-box-2"), 1 );
		this.repair( $(".repair-box-3"), 2 );
		this.repair( $(".repair-box-4"), 3 );
		
		this.build( $(".build-box-1"), 0 );
		this.build( $(".build-box-2"), 1 );
		this.build( $(".build-box-3"), 2 );
		this.build( $(".build-box-4"), 3 );
	},
	
	expedition :function( element, index ){
		this.seconds[0][index] = 0;
		
		var thisFleet = app.Player._fleets[index];
		if(typeof thisFleet != "undefined"){
			
			if(thisFleet.api_ship[0] > -1){
				var thisShip = app.Player._ships[ thisFleet.api_ship[0] ];
				$(".timer-img img", element).attr("src", app.Assets.shipIcon(thisShip.api_ship_id, '../../assets/img/ui/empty.png'));
			}else{
				$(".timer-img img", element).attr("src", "../../assets/img/ui/empty.png");
			}
			
			if( thisFleet.api_mission[0] == 1 ){
				var now = new Date().getTime();
				this.seconds[0][index] = (((thisFleet.api_mission[2]-60000)-now)/1000);
				
			}else if(thisFleet.api_mission[0]==2){
				$(".timer-time", element).text("Complete!");
				
			}else{
				$(".timer-time", element).text("Idle...");
				
			}
		}
	},
	
	repair :function( element, index ){
		this.seconds[1][index] = 0;
		
		var thisRepairSlot = app.Player._repair[index];
		if(typeof thisRepairSlot != "undefined"){
			switch(thisRepairSlot.api_state){
				case -1: break;
				case 0:
					$(".timer-img img", element).attr("src", "../../assets/img/ui/empty.png");
					$(".timer-time", element).text("");
					break;
				default:
					var thisShip = app.Player._ships[ thisRepairSlot.api_ship_id ];
					var now = new Date().getTime();
					$(".timer-img img", element).attr("src", app.Assets.shipIcon(thisShip.api_ship_id, '../../assets/img/ui/empty.png'));
					this.seconds[1][index] = Math.ceil(((thisRepairSlot.api_complete_time-60000)-now)/1000);
					break;
			}
		}
	},
	
	build :function( element, index ){
		this.seconds[2][index] = 0;
		
		var thisBuildSlot = app.Player._build[index];
		if(typeof thisBuildSlot != "undefined"){
			switch(thisBuildSlot.api_state){
				case 1:
					var thisShip = app.Master.ship( thisBuildSlot.api_created_ship_id );
					var now = new Date().getTime();
					$(".timer-img img", element).attr("src", app.Assets.shipIcon(thisShip.api_ship_id, '../../assets/img/ui/empty.png'));
					this.seconds[2][index] = Math.ceil(((thisBuildSlot.api_complete_time)-now)/1000);
					break;
				case 3:
					var thisShip = app.Master.ship( thisBuildSlot.api_created_ship_id );
					$(".timer-img img", element).attr("src", app.Assets.shipIcon(thisShip.api_ship_id, '../../assets/img/ui/empty.png'));
					$(".timer-time", element).text("Complete!");
					break;
				default:
					$(".timer-img img", element).attr("src", "../../assets/img/ui/empty.png");
					$(".timer-time", element).text("");
					break;
			}
		}
	}
	
};