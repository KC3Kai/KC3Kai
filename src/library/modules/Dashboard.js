/* Dashboard.js
KC3改 Admiral Dashboard

An instatiatable class which support a single admiral dashboard interface.
Use multiple instances for different layouts (horizontal vs vertical)
\library\modules\Panel.js is a manager designed to utilize multiple instances of this
*/
(function(){
	"use strict";
	
	// Default listeners if theme did not define it. Theme is expected to use default CSS selectors
	var defaultListeners = {
		GameStart: function(container, data){  },
		CatBomb: function(container, data){  },
		HomeScreen: function(container, data){  },
		HQ: function(container, data){  },
		Consumables: function(container, data){  },
		ShipSlots: function(container, data){  },
		GearSlots: function(container, data){  },
		Timers: function(container, data){  },
		Quests: function(container, data){  },
		Fleet: function(container, data){  },
		SortieStart: function(container, data){  },
		CompassResult: function(container, data){  },
		BattleStart: function(container, data){  },
		BattleNight: function(container, data){  },
		BattleResult: function(container, data){  },
		CraftGear: function(container, data){  },
		CraftShip: function(container, data){  },
		ClearedMap: function(container, data){  }
	};
	
	// Default params if theme did not define it
	var defaultParams = {
		ExpBarWidth: 100
	};
	
	
	/* CONSTRUCTOR
	Take in theme's custom listeners and params
	If not defined, defaults will be used as seen on the merging
	------------------------------------------*/
	window.KC3Dashboard = function(domElement, definedListeners, definedParams){
		// The $(xxx) jQuery element of the container
		this.domElement = domElement;
		
		// Assign listeners if defined or use default
		this.listeners = {};
		$.extend(this.listeners, defaultListeners, definedListeners || {});
		
		// Assign custom params if defined or use default
		this.params = {};
		$.extend(this.params, defaultParams, definedParams || {});
	};
	
	/* SHOW
	Show interface
	------------------------------------------*/
	KC3Dashboard.prototype.show = function(){
		this.domElement.show();
		// Update interface values by triggering listeners, since it's not updated while hidden
		var DataListeners = ["HQ","Consumables","ShipSlots","GearSlots","Timers","Quests","Fleet"];
		for(var ctr in DataListeners){
			this.listeners[ DataListeners[ctr] ]( this.domElement, {} );
		}
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
		this.listeners[ event ]( this.domElement, data );
	};
	
})();