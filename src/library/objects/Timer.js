/* Timer.js
KC3改 Timer Object

Contains a single timer which contains number of seconds left
Has functions for TimerManager to use
*/
(function(){
	"use strict";
	
	window.KC3Timer = function(element){
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
	
	KC3Timer.prototype.face = function(){
		if(this.faceId > 0){
			$(".timer-img img", this.element).attr("src", KC3Meta.shipIcon(this.faceId, "../../../../assets/img/ui/empty.png"));
		}
	};
	
	KC3Timer.prototype.updateElement = function(element){
		this.element = element;
	}
	
	KC3Timer.prototype.text = function(){
		if(this.active){
			var remaining = this.completion - (new Date()).getTime();
			remaining = Math.ceil((remaining - (ConfigManager.alert_diff*1000))/1000);
			if(remaining > 0){
				var hrs = Math.floor(remaining/3600);
				remaining = remaining - (hrs * 3600);
				if(hrs < 10){ hrs = "0"+hrs; }
				
				var min = Math.floor(remaining/60);
				remaining = remaining - (min * 60);
				if(min < 10){ min = "0"+min; }
				
				if(remaining < 10){ remaining = "0"+remaining; }
				
				return hrs+":"+min+":"+remaining;
			}else{
				return "Complete!";
			}
		}else{
			return "";
		}
	};
	
})();