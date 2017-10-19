/* Server.js
KC3改 Server Object

Represent KanColle game server instance.
*/
(function(){
	"use strict";
	
	window.KC3Server = function(){
		this.num = 0;
		this.ip = "";
		this.name = "";
	};
	
	KC3Server.prototype.setUrl = function(url){
		var anchor = document.createElement("a");
		anchor.href = url;
		this.ip = anchor.host;
		
		var ServerInfo = KC3Meta.server( this.ip );
		this.num = ServerInfo.num;
		this.name = ServerInfo.name;
		return this;
	};
	
	KC3Server.prototype.setNum = function(num){
		var ServerInfo = KC3Meta.serverByNum( num );
		this.num = num;
		this.ip = ServerInfo.ip;
		this.name = ServerInfo.name;
		return this;
	};
	
})();