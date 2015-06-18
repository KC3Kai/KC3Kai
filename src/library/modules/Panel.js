/* Panel.js
KC3改 Admiral Dashboard

An instatiatable class which support a single admiral dashboard interface.
Use multiple instances if switching between themes (horizontal/vertical)

var HorizontalPlayer = new KC3Panel( $(".theme-horizontal"), function(){
	console.log("panel initialized");
});
*/
(function(){
	"use strict";
	
	window.KC3Panel = function(domElement, initialization, elementMapping, params){
		// The $(xxx) jQuery element of the container
		this.domElement = domElement;
		
		// Execute passed initialization function or dummy function whichever is defined
		(initialization || function(){})();
		
		// Element mapping and its defaults to put values onto correct divs
		this.elements = elementMapping || {
			HQName		: ".hq-name",
			HQComment	: ".hq-comm",
			HQRank		: ".hq-rank",
			HQLevel		: ".hq-lvl",
			HQExpNext	: ".hq-exp",
			HQExpBar	: ".hq-exp-val",
			Bucket		: ".countbox.bucket .value",
			DevMat		: ".countbox.devmat .value",
			Torche		: ".countbox.torche .value", // add "e" in the end for 6 chars :P
			Screws		: ".countbox.screws .value",
			ShipsNow	: ".slotbox.ships .value",
			ShipsMax	: ".slotbox.ships .max",
			GearsNow	: ".slotbox.gears .value",
			GearsMax	: ".slotbox.gears .max"
		};
		
		// Support custom interface parameters
		this.params = params || {
			ExpBarWidth: 100
		};
	};
	
	/* $
	Get jQuery object for specific element on this panel, based on mapping name
	Usage returns jQuery: this.$("HQName").xxxx
	------------------------------------------*/
	KC3Panel.prototype.$ = function( name ){
		return $( this.elements[name], this.domElement );
	};
	
	/* SHOW
	Show interface
	------------------------------------------*/
	KC3Panel.prototype.show = function(){
		this.domElement.show();
		this.updateAll(); // Update values since it's not updated while hidden
	};
	
	/* HIDE
	Hide interface
	------------------------------------------*/
	KC3Panel.prototype.hide = function(){
		this.domElement.hide();
	};
	
	/* UPDATE
	Update the interface with latest values
	------------------------------------------*/
	KC3Panel.prototype.update = {
		
		/* ALL
		Update all parts of the panel
		------------------------------------------*/
		all :function(){
			this.hq();
			this.counts();
			this.timers();
			this.quests();
			this.fleet();
		},
		
		/* HQ
		Update main HQ info header
		------------------------------------------*/
		hq :function(){
			this.$("HQName").text( app.Player.name );
			this.$("HQComment").text( app.Player.desc );
			this.$("HQRank").text( app.Player.rank );
			this.$("HQLevel").text( app.Player.level );
			this.$("HQExpNext").text( app.Player.exp[1] );
			this.$("HQExpBar").css({
				width: (app.Player.exp[0] * this.params.ExpBarWidth)+"px"
			});
		},
		
		/* COUNTS
		Update slot counts and consumable values
		------------------------------------------*/
		counts :function(){
			this.$("Bucket").text( app.Resources.buckets );
			this.$("DevMat").text( app.Resources.devmats );
			this.$("Torche").text( app.Resources.torch );
			this.$("Screws").text( app.Resources.screws );
			this.$("ShipsNow").text( app.Ships.count() );
			this.$("ShipsMax").text( app.Ships.max );
			this.$("GearsNow").text( app.Gears.count() );
			this.$("GearsMax").text( app.Gears.max );
		},
		
		/* TIMERS
		Get time remaining from background service and update countdowns
		------------------------------------------*/
		timers :function(){
			
		},
		
		/* QUESTS
		Update latest active quests
		------------------------------------------*/
		quests :function(){
			
		},
		
		/* FLEET
		Update ship statuses on fleet
		------------------------------------------*/
		fleet :function(){
			
		}
	};
	
})();