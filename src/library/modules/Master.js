/* Master.js
KC3改 Master Dataset

Represents master data from api_start2
Indexes significant data for easier access
Saves and loads significant data for future use
*/
(function(){
	"use strict";

	window.KC3Master = {
		available: false,
		// Not start from, excluding
		abyssalShipIdFrom: 1500,
		abyssalGearIdFrom: 500,
		// Devs still archive seasonal ID backward from old max 997
		// Since 2017-11-27, 998~ going to be used
		seasonalCgIdFrom: 700,
		// Clear new updates data after 1 week
		newUpdatesExpiredAfter: 7 * 24 * 60 * 60 * 1000,

		_raw: {},
		_abyssalShips: {},
		_seasonalShips: {},

		init: function( raw ){
			this.load();

			if(typeof raw != "undefined"){
				return this.processRaw( raw );
			}

			this.updateRemodelTable();
			return false;
		},

		/* Process raw data, fresh from API
		-------------------------------------*/
		processRaw :function(raw){
			var beforeCounts = false;
			if( Object.size(this._raw) > 0) {
				beforeCounts = [ Object.size(this._raw.ship), Object.size(this._raw.slotitem) ];
			}
			this._raw.newShips = this._raw.newShips || {};
			this._raw.newItems = this._raw.newItems || {};
			this._raw.newGraphs = this._raw.newGraphs || {};
			this._raw.changedGraphs = this._raw.changedGraphs || {};

			var self = this,
				diff = {"ship":"newShips", "slotitem":"newItems", "shipgraph":"newGraphs"},
				oraw = $.extend({}, this._raw),
				newCounts = [0, 0],
				ctime = Date.now();

			// Loops through each api_mst_
			Object.keys(raw).forEach(function(mst_name) {
				var mst_data = raw[mst_name];
				var short_mst_name = mst_name.replace("api_mst_", "");

				// If the current master item is an array
				if (Array.isArray(mst_data)) {
					// Add the master item to local raw, as empty object
					self._raw[short_mst_name] = {};

					// Store the contents into the new local raw object
					mst_data.map(function(elem, i){
						var elem_key = elem.api_id || i;
						// Add elements to local raw, with their IDs as indexes
						// Elements have no IDs, store them with their original indexes
						// There are duplicated api_id in `shipupgrade`, so use indexes instead
						if(short_mst_name === "shipupgrade") elem_key = i;
						self._raw[short_mst_name][elem_key] = elem;

						if(!!diff[short_mst_name] && !!oraw[short_mst_name]) {
							if(!oraw[short_mst_name][elem_key]) {
								self._raw[diff[short_mst_name]][elem_key] = ctime;
							} else {
								if(short_mst_name === "shipgraph") {
									if(self._raw[short_mst_name][elem_key].api_version[0]
										!= oraw[short_mst_name][elem_key].api_version[0]) {
										self._raw.changedGraphs[elem_key] = ctime;
									} else if(self._raw.changedGraphs[elem_key] &&
										(ctime - self._raw.changedGraphs[elem_key]) > self.newUpdatesExpiredAfter) {
										delete self._raw.changedGraphs[elem_key];
									}
								}
								if(self._raw[diff[short_mst_name]][elem_key] &&
									(ctime - self._raw[diff[short_mst_name]][elem_key]) > self.newUpdatesExpiredAfter) {
									delete self._raw[diff[short_mst_name]][elem_key];
								}
							}
						}
					});
				}
			});

			this.updateRemodelTable();
			this.save();
			this.available = true;

			// If there was a count before this update, calculate how many new
			if (beforeCounts) {
				return [
					Object.size(this._raw.ship) - beforeCounts[0],
					Object.size(this._raw.slotitem) - beforeCounts[1]
				];
			} else {
				return [0,0];
			}
		},

		loadAbyssalShips: function(repo) {
			var shipJson = $.ajax({
				url : repo + "abyssal_stats.json",
				async: false
			}).responseText;
			try {
				this._abyssalShips = JSON.parse(shipJson) || {};
			} catch(e) {
			}
		},

		loadSeasonalShips: function(repo) {
			var shipJson = $.ajax({
				url : repo + "seasonal_mstship.json",
				async: false
			}).responseText;
			try {
				this._seasonalShips = JSON.parse(shipJson) || {};
			} catch(e) {
			}
		},

		/* Data Access
		-------------------------------------*/
		ship :function(id){
			return !this.available ? false : this._raw.ship[id] || false;
		},

		all_ships :function(withAbyssals, withSeasonals){
			var id, ss, as;
			var ships = $.extend({}, this._raw.ship);
			if(!!withAbyssals && Object.keys(ships).length > 0
				&& Object.keys(this._abyssalShips).length > 0){
				for(id in this._abyssalShips){
					ss = ships[id];
					as = this._abyssalShips[id];
					if(!!ss && !!as){
						for(var k in as){
							if(k !== "api_id" && !ss.hasOwnProperty(k))
								ss[k] = as[k];
						}
					}
				}
			}
			if(!!withSeasonals && Object.keys(ships).length > 0
				&& Object.keys(this._seasonalShips).length > 0){
				for(id in this._seasonalShips){
					ss = ships[id];
					if(!ss) { ships[id] = this._seasonalShips[id]; }
				}
				// Apply a patch for Mikuma typo of KC devs
				//ships[882] = this._seasonalShips[882];
				//ships[793] = this._seasonalShips[793];
				// Apply a patch for Asashimo Torelli submarine :P
				//ships[787] = this._seasonalShips[787];
				// Seasonal data no longer leaked since 2017-04-05
				// Seasonal data leaks again since 2017-09-12 if ID < 800
				// Seasonal data leaking fixed again since 207-10-18
			}
			return ships;
		},

		seasonal_ship :function(id){
			return this._seasonalShips[id] || false;
		},

		new_ships :function(){
			return this._raw.newShips || {};
		},

		remove_new_ship :function(id){
			delete this._raw.newShips[id];
		},

		graph :function(id){
			return !this.available ? false : this._raw.shipgraph[id] || false;
		},

		graph_file :function(filename){
			var self = this;
			return !this.available ? false : Object.keys(this._raw.shipgraph).filter(function(key){
				return self._raw.shipgraph[key].api_filename === filename;
			})[0];
		},

		new_graphs :function(){
			return this._raw.newGraphs || {};
		},

		remove_new_graphs :function(id){
			delete this._raw.newGraphs[id];
		},

		changed_graphs :function(){
			return this._raw.changedGraphs || {};
		},

		remove_changed_graphs :function(id){
			delete this._raw.changedGraphs[id];
		},

		slotitem :function(id){
			return !this.available ? false : this._raw.slotitem[id] || false;
		},

		all_slotitems :function(){
			return this._raw.slotitem || {};
		},

		new_slotitems :function(){
			return this._raw.newItems || {};
		},

		remove_new_slotitem :function(id){
			delete this._raw.newItems[id];
		},

		stype :function(id){
			return !this.available ? false : this._raw.stype[id] || false;
		},

		slotitem_equiptype :function(id){
			return !this.available ? false : this._raw.slotitem_equiptype[id] || false;
		},

		useitem :function(id){
			return !this.available ? false : this._raw.useitem[id] || false;
		},

		all_useitems :function(){
			return this._raw.useitem || {};
		},

		mission :function(id){
			return !this.available ? false : this._raw.mission[id] || false;
		},

		all_missions :function(){
			return this._raw.mission || {};
		},

		missionDispNo :function(id){
			var dispNo = (this.mission(id) || {}).api_disp_no;
			return dispNo || String(id);
		},

		abyssalShip :function(id, isMasterMerged){
			var master = !!isMasterMerged && this.isAbyssalShip(id) && $.extend({}, this.ship(id)) || {};
			return Object.keys(master).length === 0 &&
				(Object.keys(this._abyssalShips).length === 0 || !this._abyssalShips[id]) ?
				false : $.extend(master, this._abyssalShips[id]);
		},

		isRegularShip :function(id){
			// Master ID starts from 1, so range should be (lbound, ubound]
			// falsy id always returns false
			return !!id && !(this.isAbyssalShip(id) || this.isSeasonalShip(id));
		},

		isNotRegularShip :function(id){
			return !this.isRegularShip(id);
		},

		isSeasonalShip :function(id){
			return id > this.seasonalCgIdFrom && id <= this.abyssalShipIdFrom;
		},

		isAbyssalShip :function(id){
			return id > this.abyssalShipIdFrom;
		},

		isAbyssalGear :function(id){
			return id > this.abyssalGearIdFrom;
		},

		/* Save to localStorage
		-------------------------------------*/
		save :function(){
			localStorage.raw = JSON.stringify(this._raw);
		},

		/* Load from localStorage
		-------------------------------------*/
		load :(function(){
			var keyStor = {
				raw: function fnlRaw(data){
					this._raw = data;
					return true;
				},
				master: function fnlMaster(data){
					this._raw.ship = data.ship;
					this._raw.shipgraph = data.graph || {};
					this._raw.slotitem = data.slotitem;
					this._raw.stype = data.stype;
					this._raw.newShips = data.newShips || {};
					this._raw.newItems = data.newItems || {};
					this._raw.newGraphs = data.newGraphs || {};
					this._raw.changedGraphs = data.changedGraphs || {};
					return true;
				},
			};

			function fnLoad(){
				/*jshint validthis:true*/
				this.available = false;
				for(var storType in keyStor) {
					if(this.available) continue;
					if(typeof localStorage[storType] == 'undefined') continue;

					try {
						var tempRaw = JSON.parse(localStorage[storType]);
						if(!tempRaw.ship) throw Error("Non-existing ship");

						this.available = this.available || keyStor[storType].call(this,tempRaw);
						console.info("Loaded master: %c%s%c data", "color:darkblue", storType, "color:initial");
					} catch (e) {
						console.error("Failed to process master: %s data", storType, e);
					}
				}
				return this.available;
			}

			return fnLoad;
		})(),

		/* Remodel Table Storage
		-------------------------------------*/
		removeRemodelTable :function(){
			var cShip,ship_id;
			for(ship_id in this._raw.ship) {
				cShip = this._raw.ship[ship_id];
				if(!cShip) { /* invalid API */ continue; }
				if(!cShip.api_buildtime) { /* non-kanmusu by API */ continue; }
				delete cShip.kc3_maxed;
				delete cShip.kc3_model;
				delete cShip.kc3_bship;
			}
		},
		updateRemodelTable :function(){
			var cShip,ccShip,remodList,ship_id,shipAry,modelLv,bship_id;
			this.removeRemodelTable();
			shipAry = Object.keys(this.all_ships());
			remodList = [];
			modelLv = 1;
			while(shipAry.length) {
				ship_id = parseInt(shipAry.shift());
				cShip = this._raw.ship[ship_id];

				// Pre-checks of the remodel table
				if(!cShip)               { /* invalid API */ continue; }
				// `api_buildtime` always non-zero for all shipgirls even not able to be built,
				// can be used to differentiate seasonal graph / abyssal data
				if(!cShip.api_buildtime) { /* non-kanmusu by API */ continue; }

				/* proposed variable:
				  kc3 prefix variable -> to prevent overwriting what devs gonna say later on
					maxed flag -> is it the end of the cycle? is it returns to a cyclic model?
					model level -> mark the current model is already marked.
					base id -> base form of the ship
				*/
				cShip.api_aftershipid = Number(cShip.api_aftershipid);
				if(!!cShip.kc3_model)    { /* already checked ship */ modelLv = 1; continue; }
				if(cShip.api_name.indexOf("改") >= 0 && modelLv <= 1) { /* delays enumeration of the remodelled ship in normal state */ continue; }

				// Prepare remodel flag
				cShip.kc3_maxed = false;
				cShip.kc3_model = modelLv++; // 1 stands for base model
				cShip.kc3_bship = cShip.kc3_bship || ship_id;

				// Prepare salt list for every base ship that is not even a remodel
				// Only for enabled salt check
				if(
					(ConfigManager.info_salt) &&
					(ConfigManager.salt_list.indexOf(cShip.kc3_bship) < 0) &&
					(this._raw.newShips[cShip.kc3_bship])
				){
					ConfigManager.salt_list.push(cShip.kc3_bship);
				}

				// Check whether remodel is available and skip further processing
				if(!!cShip.api_afterlv) {
					shipAry.unshift(cShip.api_aftershipid);
					ccShip = this._raw.ship[cShip.api_aftershipid];
					ccShip.kc3_bship = cShip.kc3_bship;
					cShip.kc3_maxed = !!ccShip.kc3_model;
					continue;
				}
				// Finalize model data
				cShip.kc3_maxed = true;
				modelLv = 1;
			}
		}

	};

})();
