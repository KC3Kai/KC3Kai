/* Dashboard.js
KC3改 Admiral Dashboard

An instatiatable class which support a single admiral dashboard interface.
Use multiple instances for different layouts (horizontal vs vertical)
\library\modules\Panel.js is a manager designed to utilize multiple instances of this
*/
(function(){
	"use strict";
	
	window.KC3Dashboard = function( params ){
		this.selector = params.container;
		this.externalHtml = params.externalHtml || false;
		this.data = params.variables || {};
		this.customReady = params.ready || function(){};
		this.setListeners( params.listeners );
	};
	
	KC3Dashboard.prototype.onReady = function(){
		// Apply panel box opacity
		var oldBG = this.domElement.css("background-color");
		var newBG = oldBG.insert( oldBG.length-1, ", "+(ConfigManager.pan_opacity/100) );
		newBG = newBG.insert(3, "a"); // "rgb" -> "rgba"
		this.domElement.css("background-color", newBG);
		
		// Call custom ready function defined on constructor
		this.customReady();
	};
	
	/* SET LISTENERS
	Load an external HTML source
	------------------------------------------*/
	KC3Dashboard.prototype.setListeners = function( definedListeners ){
		// Assign listeners if defined or use default
		this.listeners = {};
		$.extend(this.listeners, {
			GameStart: function(container, data){},
			CatBomb: function(container, data){},
			HomeScreen: function(container, data){},
			HQ: function(container, data){},
			Consumables: function(container, data){},
			ShipSlots: function(container, data){},
			GearSlots: function(container, data){},
			Timers: function(container, data){},
			Quests: function(container, data){},
			Fleet: function(container, data){},
			SortieStart: function(container, data){},
			CompassResult: function(container, data){},
			BattleStart: function(container, data){},
			BattleNight: function(container, data){},
			BattleResult: function(container, data){},
			CraftGear: function(container, data){},
			CraftShip: function(container, data){},
			ClearedMap: function(container, data){}
		}, definedListeners || {});
	};
	
	/* START
	Assumes prerequisites are ready
	------------------------------------------*/
	KC3Dashboard.prototype.start = function(){
		this.domElement = $(this.selector);
		if(this.externalHtml){
			var self = this;
			$.ajax({
				url: this.externalHtml,
				success: function(htmlContent){
					self.domElement.html( htmlContent );
					self.onReady();
				}
			});
		}else{
			this.onReady();
		}
	};
	
	/* SHOW
	Show interface
	------------------------------------------*/
	KC3Dashboard.prototype.show = function(){
		this.domElement.show();
		// Update interface values by triggering listeners, since it's not updated while hidden
		try {
			var DataListeners = ["HQ","Consumables","ShipSlots","GearSlots","Timers","Quests","Fleet"];
			for(var ctr in DataListeners){
				this.listeners[ DataListeners[ctr] ]( this.domElement, {}, this.data );
			}
		}catch(e){ console.log("Updating interface values failed"); }
	};
	
	/* HIDE
	Hide interface
	------------------------------------------*/
	KC3Dashboard.prototype.hide = function(){
		this.domElement.hide();
	};
	
	/* TRIGGER
	Execute one of the listeners
	------------------------------------------*/
	KC3Dashboard.prototype.trigger = function( event, data ){
		if(typeof this.listeners[ event ] != "undefined"){
			this.listeners[ event ]( this.domElement, data, this.data );
		}
	};
	
})();