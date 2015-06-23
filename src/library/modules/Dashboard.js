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
		start : function(){
			
		},
		catbomb : function( container, data ){
			
		},
		hq : function( container, data ){
			console.log("Default Listener [hq]", data);
		},
		counts : function( container, data ){
			console.log("Default Listener [counts]", data);
		},
		timers : function( container, data ){
			console.log("Default Listener [timers]", data);
		},
		quests : function( container, data ){
			console.log("Default Listener [quests]", data);
		},
		fleet : function( container, data ){
			console.log("Default Listener [fleet]", data);
		},
		compass : function( container, data ){
			
		},
		battleStart : function( container, data ){
			
		},
		battleResult : function( container, data ){
			
		},
		equipmentCraft : function( container, data ){
			
		},
		shipCraft : function( container, data ){
			
		},
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
		var DataListeners = ["hq","counts","timers","quests","fleet"];
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
	KC3Dashboard.prototype.trigger = function( event ){
		this.listeners[ event.name ]( this.domElement, event );
	};
	
})();