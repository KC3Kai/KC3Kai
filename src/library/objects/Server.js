/* Server.js
KC3改 Server Object

Represent KanColle game server instance.
*/
(function(){
	"use strict";
	
	const kcBaseDomain = ".kancolle-server.com";
	
	window.KC3Server = function(num, isSecured){
		this.num = 0;
		this.ip = "";
		this.name = "";
		this.host = "";
		this.protocol = "";
		this.urlPrefix = "";
		this.isDomain = false;
		if(num) this.setNum(num, isSecured);
	};
	
	KC3Server.prototype.setUrl = function(url){
		const anchor = document.createElement("a");
		anchor.href = url;
		this.ip = anchor.host;
		// kc still using http and ip addresses (partially)
		// gadget and w01 (yokosuka) server have started to use domain since 2024-12-03
		// eg: w00g.       w01y.     kancolle-server.com
		this.protocol = anchor.protocol;
		const domainMatch = (this.ip || "").match(/w(\d+)\w+\.kancolle-server\.com/);
		this.isDomain = !!(domainMatch && domainMatch[1]);
		const serverInfo = this.isDomain ? KC3Meta.serverByNum(domainMatch[1]) : KC3Meta.server(this.ip);
		this.num = serverInfo.num;
		this.name = serverInfo.name;
		if(this.isDomain) {
			this.host = this.ip;
			this.ip = serverInfo.ip;
			this.urlPrefix = `${this.protocol}//${this.host}`;
		} else {
			this.host = serverInfo.domain || `w${String(this.num).pad(2,"0")}y` + kcBaseDomain;
			this.urlPrefix = `${this.protocol}//${this.ip}`;
		}
		return this;
	};
	
	KC3Server.prototype.setNum = function(num, isSecured = false){
		const serverInfo = KC3Meta.serverByNum(num);
		this.num = serverInfo.num;
		this.ip = serverInfo.ip;
		this.name = serverInfo.name;
		this.host = serverInfo.domain || `w${String(this.num).pad(2,"0")}y` + kcBaseDomain;
		this.isDomain = !!serverInfo.domain;
		this.protocol = isSecured ? "https:" : "http:";
		this.urlPrefix = `${this.protocol}//${this.isDomain ? this.host : this.ip}`;
		return this;
	};
	
})();