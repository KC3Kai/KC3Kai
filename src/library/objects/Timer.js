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
	
	KC3Timer.prototype.activate = function(completion, faceId, expedNum, rosterId){
		this.active = true;
		this.completion = completion;
		if(faceId > 0){ this.faceId = faceId; }
		if(expedNum > 0){ this.expedNum = expedNum; }
		if(rosterId > 0){ this.rosterId = rosterId; }
		
		var remaining = this.completion - Date.now();
		remaining = Math.ceil((remaining - (ConfigManager.alert_diff*1000))/1000);
		if(remaining <= 0){
			this.alerted = true;
			$(".timer-time", this.element).attr("title", "");
		} else {
			$(".timer-time", this.element).attr("title",
				String(remaining).plusCurrentTime(true) );
		}
	};
	
	KC3Timer.prototype.deactivate = function(){
		this.active = false;
		this.completion = 0;
		this.faceId = 0;
		this.expedNum = 0;
		this.rosterId = 0;
		$(".timer-img img", this.element).hide();
		$(".timer-expnum", this.element).text("");
		$(".timer-time", this.element).text("").attr("title", "");
	};
	
	KC3Timer.prototype.time = function(){
		$(".timer-time", this.element).text( this.text() );
	};
	
	KC3Timer.prototype.expnum = function(){
		if(this.expedNum > 0){
			$(".timer-expnum", this.element).text( KC3Master.missionDispNo(this.expedNum) );
		}
	};
	
	KC3Timer.prototype.face = function(faceId = this.faceId, isLocked = false){
		if(this.faceId > 0){
			$(".timer-img img", this.element).attr("src", this.rosterId > 0 ?
				KC3ShipManager.get(this.rosterId).shipIcon() :
				KC3Meta.shipIcon(this.faceId, "/assets/img/ui/empty.png"));
			$(".timer-img", this.element).attr("title",
				KC3Meta.shipName( KC3Master.ship(this.faceId).api_name )
			);
			$(".timer-img", this.element).data("masterId", this.faceId).off("dblclick")
				.on("dblclick", function(e){
					(new RMsg("service", "strategyRoomPage", {
						tabPath: "mstship-{0}".format($(this).data("masterId"))
					})).execute();
				});
			$(".timer-img", this.element).toggleClass("lsc", !!this.lsc)
				.toggleClass("new_ship", !!this.newShip);
			$(".timer-img", this.element).removeClass("locked");
			$(".timer-img img", this.element).show();
		}else{
			$(".timer-img", this.element).attr("title", "")
				.removeData("masterId").off("dblclick");
			$(".timer-img img", this.element).hide();
			$(".timer-img", this.element).toggleClass("locked", isLocked);
			$(".timer-img", this.element).removeClass("lsc new_ship");
		}
		return $(".timer-img", this.element);
	};
	
	KC3Timer.prototype.updateElement = function(element){
		this.element = element;
	};
	
	KC3Timer.prototype.remainingTime = function(){
		return this.active ? (this.completion - Date.now()) : 0;
	};
	
	KC3Timer.prototype.text = function(){
		if(this.active){
			var remaining = this.remainingTime();
			var timerAllowance = (this.type == 2)?0:ConfigManager.alert_diff;
			remaining = Math.ceil((remaining - (timerAllowance*1000))/1000);
			if(remaining > 0){
				this.alerted = false;
				return String(remaining).toHHMMSS();
			}else{
				this.completionAlert();
				return KC3Meta.term("TimerComplete");
			}
		}else{
			return "";
		}
	};
	
	KC3Timer.prototype.completionAlert = function(){
		if(this.alerted){ return false; }
		this.alerted = true;
		
		// Sound Alerts
		if(KC3TimerManager.notifSound){
			KC3TimerManager.notifSound.pause();
		}
		switch(ConfigManager.alert_type){
			case 1: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/pop.mp3"); break;
			case 2: KC3TimerManager.notifSound = new Audio(ConfigManager.alert_custom); break;
			case 3: KC3TimerManager.notifSound = new Audio("../../../../assets/snd/ding.mp3"); break;
			default: KC3TimerManager.notifSound = false; break;
		}
		if(KC3TimerManager.notifSound){
			KC3TimerManager.notifSound.volume = ConfigManager.alert_volume / 100;
			KC3TimerManager.notifSound.play();
		}
		
		// Desktop notification
		var notifData = { type: "basic" };
		var shipName;
		
		// Notification types show varying messages
		switch(this.type){
			case 0:
				var thisFleet = PlayerManager.fleets[this.num+1];
				notifData.title = KC3Meta.term("DesktopNotifyExpedCompleteTitle");
				notifData.message = KC3Meta.term("DesktopNotifyExpedCompleteMessage")
					.format(this.num + 2, KC3Master.missionDispNo(thisFleet.mission[1]));
				notifData.iconUrl = "../../assets/img/quests/expedition.jpg";
				break;
			case 1:
				var shipRef = KC3ShipManager.get(PlayerManager.repairShips[this.num+1]);
				shipName = shipRef.name();
				notifData.title = KC3Meta.term("DesktopNotifyRepairCompleteTitle");
				notifData.message = KC3Meta.term("DesktopNotifyRepairCompleteMessage").format(shipName);
				notifData.iconUrl = "../../assets/img/quests/supply.jpg";
				shipRef.applyRepair();
				break;
			case 2:
				shipName = KC3Meta.shipName( KC3Master.ship( this.faceId ).api_name );
				notifData.title = KC3Meta.term("DesktopNotifyConstrCompleteTitle");
				if(ConfigManager.info_face){
					notifData.message = KC3Meta.term("DesktopNotifyConstrCompleteMessageFaced").format(shipName);
				}else{
					notifData.message = KC3Meta.term("DesktopNotifyConstrCompleteMessageUnknown");
				}
				notifData.iconUrl = "../../assets/img/quests/build.jpg";
				break;
			default:break;
		}
		
		// Tell background page to show the notification, cant do it here
		if(ConfigManager.alert_desktop){
			(new RMsg("service", "notify_desktop", {
				notifId: this.type+"_"+this.num,
				data: notifData
			})).execute();
		}
	
	};

})();
