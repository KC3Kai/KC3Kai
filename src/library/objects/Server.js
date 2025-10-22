/* Server.js
KC3改 Server Object

Represent KanColle game server instance.
*/
(function(){
	"use strict";
	
	// kc server ip addresses are replaced by domain hostnames:
	// server gadget and w01 (yokosuka) have started to use domain since 2024-12-03
	//    eg: w00g.      w01y.          kancolle-server.com
	// w02~w05 have started since 2024-12-06
	// w06~w10 have started since 2024-12-09
	// w11~w15 have started since 2024-12-11
	// w16~w20 have started since 2024-12-13
	// https migration done since 2025-10-17
	//   with DMM frontend upgrade: 'www. dmm.com/netgame/' -> 'play.games.dmm.com/'
	//   this introduced script ES module requirement, depending on minimal chrome m61 (winxp out)
	const kcBaseDomain = ".kancolle-server.com";
	const kcsNameInitials = "yksmotlrsbtpbhpskish";
	
	window.KC3Server = function(num, isDomain, isSecured, originUrl){
		this.num = 0;
		this.ip = "";
		this.name = "";
		this.host = "";
		this.protocol = "";
		this.urlPrefix = "";
		this.isDomain = false;
		this.isSecured = false;
		if(num) this.setNum(num, isDomain, isSecured, originUrl);
	};
	
	KC3Server.prototype.setUrl = function(url){
		const anchor = new URL(url);
		// here `ip` may stand for either IP address or domain hostname, old ip will be unused if isDomain true
		this.ip = anchor.hostname;
		this.host = anchor.host;
		this.protocol = anchor.protocol;
		this.isSecured = this.protocol == "https:";
		this.urlPrefix = anchor.origin;
		const domainMatch = (this.ip || "").match(/w(\d+)\w+\.kancolle-server\.com/);
		this.isDomain = !!(domainMatch && domainMatch[1]);
		const serverInfo = this.isDomain ? KC3Meta.serverByNum(domainMatch[1]) : KC3Meta.server(this.ip);
		this.num = serverInfo.num;
		this.name = serverInfo.name;
		if(this.isDomain) {
			this.ip = serverInfo.ip;
		} else {
			if(this.num === 0) {
				// to indicate 'Unknown server', might be redirected for a cache server
				this.num = -1;
			} else {
				const worldName = String(this.num).pad(2, "0") + kcsNameInitials.charAt(this.num - 1);
				this.host = serverInfo.domain || `w${worldName}${kcBaseDomain}`;
			}
		}
		return this;
	};
	
	KC3Server.prototype.setNum = function(num, isDomain, isSecured, originUrl){
		const serverInfo = KC3Meta.serverByNum(num);
		this.num = serverInfo.num;
		this.ip = serverInfo.ip;
		this.name = serverInfo.name;
		const worldName = String(this.num).pad(2, "0") + kcsNameInitials.charAt(this.num - 1);
		this.host = serverInfo.domain || `w${worldName}${kcBaseDomain}`;
		// first use info (domain/protocol) from actually dectected and saved in api link,
		// but hostname not saved, so will depend on internal meta or auto-gen one
		this.isDomain = isDomain === undefined ? !!serverInfo.domain : !!isDomain;
		this.isSecured = isSecured === undefined ? !!serverInfo.https : !!isSecured;
		this.protocol = this.isSecured ? "https:" : "http:";
		this.urlPrefix = originUrl ? originUrl : `${this.protocol}//${this.isDomain ? this.host : this.ip}`;
		if(this.num < 0) {
			this.num = 0;
			this.host = this.ip;
		}
		// override saved urlPrefix if demanded KCCP service configured
		if(ConfigManager.cache_proxy_enabled)
			this.urlPrefix = ConfigManager.cache_proxy_url || "http://127.0.0.1:8081";
		return this;
	};
	
})();