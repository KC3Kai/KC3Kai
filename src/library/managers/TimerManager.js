/* TimerManager.js
KC3改 Sortie Manager

Container object for timers for expedition, construction, and repair
*/
(function(){
	"use strict";
	
	window.KC3TimerManager = {
		_exped: [],
		_repair: [],
		_build: [],
		
		init :function(eMap, rMap, bMap){
			this._exped = [
				new KC3Timer(eMap[0]),
				new KC3Timer(eMap[1]),
				new KC3Timer(eMap[2])
			];
			this._repair = [
				new KC3Timer(rMap[0]),
				new KC3Timer(rMap[1]),
				new KC3Timer(rMap[2]),
				new KC3Timer(rMap[3])
			];
			this._build = [
				new KC3Timer(bMap[0]),
				new KC3Timer(bMap[1]),
				new KC3Timer(bMap[2]),
				new KC3Timer(bMap[3])
			];
		},
		
		exped :function(num){ return this._exped[num-2]; },
		repair :function(num){ return this._repair[num-1]; },
		build :function(num){ return this._build[num-1]; },
		
		update: function(){
			this._exped[0].time();
			this._exped[1].time();
			this._exped[2].time();
			this._repair[0].time();
			this._repair[1].time();
			this._repair[2].time();
			this._repair[3].time();
			this._build[0].time();
			this._build[1].time();
			this._build[2].time();
			this._build[3].time();
		}
	};
	
})();