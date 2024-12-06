/* Server.js
KC3改 Server Object

Represent KanColle game server instance.
*/
(function(){
	"use strict";
	
	const kcBaseDomain = ".kancolle-server.com";
	const kcsNameInitials = "yksmotrrsbtpbhpskish";
	
	window.KC3Server = function(num, isDomain, isSecured){
		this.num = 0;
		this.ip = "";
		this.name = "";
		this.host = "";
		this.protocol = "";
		this.urlPrefix = "";
		this.isDomain = false;
		this.isSecured = false;
		if(num) this.setNum(num, isDomain, isSecured);
	};
	
	KC3Server.prototype.setUrl = function(url){
		const anchor = document.createElement("a");
		anchor.href = url;
		// here `ip` may stand for either IP address or domain hostname, old ip will be unused if isDomain true
		this.ip = anchor.host;
		// kc still using http and ip addresses (partially)
		// gadget and w01 (yokosuka) server have started to use domain since 2024-12-03
		// eg: w00g.       w01y.     kancolle-server.com
		// w02~w05 have started since 2024-12-06
		this.protocol = anchor.protocol;
		this.isSecured = this.protocol == "https:";
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
			const worldName = String(this.num).pad(2,"0") + kcsNameInitials.charAt(this.num - 1);
			this.host = serverInfo.domain || `w${worldName}${kcBaseDomain}`;
			this.urlPrefix = `${this.protocol}//${this.ip}`;
		}
		return this;
	};
	
	KC3Server.prototype.setNum = function(num, isDomain, isSecured){
		const serverInfo = KC3Meta.serverByNum(num);
		this.num = serverInfo.num;
		this.ip = serverInfo.ip;
		this.name = serverInfo.name;
		const worldName = String(this.num).pad(2,"0") + kcsNameInitials.charAt(this.num - 1);
		this.host = serverInfo.domain || `w${worldName}${kcBaseDomain}`;
		this.isDomain = isDomain === undefined ? !!serverInfo.domain : isDomain;
		this.isSecured = isSecured === undefined ? !!serverInfo.https : isSecured;
		this.protocol = this.isSecured ? "https:" : "http:";
		this.urlPrefix = `${this.protocol}//${this.isDomain ? this.host : this.ip}`;
		return this;
	};
	
})();