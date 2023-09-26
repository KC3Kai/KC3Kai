/* Server.js
KC3改 Server Object

Represent KanColle game server instance.
*/
(function(){
	"use strict";
	
	window.KC3Server = function(num, isDomain){
		this.num = 0;
		this.ip = "";
		this.name = "";
		this.host = "";
		this.protocol = "";
		this.urlPrefix = "";
		this.isDomain = false;
		if(num) this.setNum(num, isDomain);
	};
	
	KC3Server.prototype.setUrl = function(url){
		const anchor = document.createElement("a");
		anchor.href = url;
		this.ip = anchor.host;
		// kc still using http and ip addresses, fake sub domain reserved for future
		this.protocol = anchor.protocol;
		const domainMatch = (this.ip || "").match(/world(\d+)\.kan-colle\.com/);
		this.isDomain = !!(domainMatch && domainMatch[1]);
		const serverInfo = this.isDomain ? KC3Meta.serverByNum(domainMatch[1]) : KC3Meta.server(this.ip);
		this.num = serverInfo.num;
		this.name = serverInfo.name;
		if(this.isDomain) {
			this.host = this.ip;
			this.ip = serverInfo.ip;
			this.urlPrefix = `${this.protocol}//${this.host}`;
		} else {
			this.host = `world${this.num}.kan-colle.com`;
			this.urlPrefix = `${this.protocol}//${this.ip}`;
		}
		return this;
	};
	
	KC3Server.prototype.setNum = function(num, isDomain = false){
		const serverInfo = KC3Meta.serverByNum(num);
		this.num = serverInfo.num;
		this.ip = serverInfo.ip;
		this.name = serverInfo.name;
		this.host = `world${this.num}.kan-colle.com`;
		this.protocol = "http:";
		this.urlPrefix = `${this.protocol}//${isDomain ? this.host : this.ip}`;
		return this;
	};
	
})();