/* Timer.js
KC3改 Timer Object

Contains a single timer which contains number of seconds left
Has functions for TimerManager to use
*/
(function(){
	"use strict";
	
	window.KC3Timer = function(element, type, num){
		this.alerted = false;
		this.type = type;
		this.num = num;
		this.element = element;
		this.deactivate();
	};
	
	KC3Timer.prototype.show = function(element){ this.element.show(); };
	KC3Timer.prototype.hide = function(element){ this.element.hide(); };
	
	KC3Timer.prototype.activate = function(completion, faceId, expedNum){
		this.active = true;
		this.completion = completion;
		if(typeof faceId != "undefined"){ if(faceId>0){ this.faceId = faceId; } }
		if(typeof expedNum != "undefined"){ this.expedNum = expedNum; }
		
		var remaining = this.completion - (new Date()).getTime();
		remaining = Math.ceil((remaining - (ConfigManager.alert_diff*1000))/1000);
		if(remaining <= 0){
			this.alerted = true;
		}
	};
	
	KC3Timer.prototype.deactivate = function(){
		this.active = false;
		this.completion = 0;
		this.faceId = 0;
		this.expedNum = 0;
		$(".timer-img img", this.element).attr("src", "../../../../assets/img/ui/empty.png");
		$(".timer-expnum", this.element).text("");
		$(".timer-time", this.element).text("");
	};
	
	KC3Timer.prototype.time = function(){
		$(".timer-time", this.element).text( this.text() );
	};
	
	KC3Timer.prototype.expnum = function(){
		if(this.expedNum > 0){
			$(".timer-expnum", this.element).text( this.expedNum );
		}
	};
	
	KC3Timer.prototype.face = function( faceId){
		if(typeof faceId != "undefined"){ this.faceId = faceId; }
		if(this.faceId > 0){
			$(".timer-img img", this.element).attr("src", KC3Meta.shipIcon(this.faceId, "../../../../assets/img/ui/empty.png"));
			$(".timer-img", this.element).attr("title", KC3Meta.shipName( KC3Master.ship(this.faceId).api_name ) );
		}
	};
	
	KC3Timer.prototype.updateElement = function(element){
		this.element = element;
	};
	
	KC3Timer.prototype.text = function(){
		if(this.active){
			var remaining = this.completion - (new Date()).getTime();
			var timerAllowance = (this.type == 2)?0:ConfigManager.alert_diff;
			remaining = Math.ceil((remaining - (timerAllowance*1000))/1000);
			if(remaining > 0){
				this.alerted = false;
				
				var hrs = Math.floor(remaining/3600);
				remaining = remaining - (hrs * 3600);
				if(hrs < 10){ hrs = "0"+hrs; }
				
				var min = Math.floor(remaining/60);
				remaining = remaining - (min * 60);
				if(min < 10){ min = "0"+min; }
				
				if(remaining < 10){ remaining = "0"+remaining; }
				
				return hrs+":"+min+":"+remaining;
			}else{
				this.completionAlert();
				return "Complete!";
			}
		}else{
			return "";
		}
	};
	
	KC3Timer.prototype.completionAlert = function(){
		if(this.alerted){ return false; }
		this.alerted = true;
		
		// Sound Alerts
		var notifSound;
		switch(ConfigManager.alert_type){
			case 1: notifSound = new Audio("../../../../assets/snd/ding.mp3"); break;
			case 2: notifSound = new Audio(ConfigManager.alert_custom); break; 
			default: notifSound = false; break;
		}
		if(notifSound){
			notifSound.volume = ConfigManager.alert_volume / 100;
			notifSound.play();
		}
		
		// Desktop notification
		if(ConfigManager.alert_desktop){
			var notifData = { type: "basic" };
			var shipName;
			
			// Notification types show varying messages
			switch(this.type){
				case 0:
					var thisFleet = PlayerManager.fleets[this.num+1];
					notifData.title = "Expedition Complete!";
					notifData.message = "Fleet "+(this.num+2)+" just arrived from Expedition #"+thisFleet.mission[1];
					notifData.iconUrl = "../../assets/img/quests/expedition.jpg";
					break;
				case 1:
					shipName = KC3ShipManager.get( PlayerManager.repairShips[this.num+1] ).name();
					notifData.title = "Repairs Complete!";
					notifData.message = shipName+" is out of the repair dock!";
					notifData.iconUrl = "../../assets/img/quests/supply.jpg";
					break;
				case 2:
					shipName = KC3Meta.shipName( KC3Master.ship( this.faceId ).api_name );
					notifData.title = "Construction Complete!";
					if(ConfigManager.info_face){
						notifData.message = "New face "+shipName+" has been constructed!";
					}else{
						notifData.message = "A newface is ready to see you in the construction docks!";
					}
					notifData.iconUrl = "../../assets/img/quests/build.jpg";
					break;
				default:break;
			}
			
			// Tell background page to show the notification, cant do it here
			(new RMsg("service", "notify_desktop", {
				notifId: this.type+"_"+this.num,
				data: notifData
			})).execute();
		}
		
	};
	
})();