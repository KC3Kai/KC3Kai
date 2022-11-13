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
		// Since 2022-11-09, 1st abyssal slotitem ID bumped from 501 to 1501
		// New constant added, see main.js#SlotConst.ENEMY_SLOT_BORDER
		abyssalGearIdFrom: 1500,
		// Devs still archive seasonal ID backward from old max 997
		// Since 2017-11-27, 998~ going to be used
		// Since 2019-06-25, devs shifted IDs from 729~ to 5001~
		seasonalCgIdFrom: 5000,
		// Devs assigned Colorado Kai to 1496 making more things strange since 2019-05-25
		//seasonalCgIdTo: 1400,
		// Clear new updates data after 1 week
		newUpdatesExpiredAfter: 7 * 24 * 60 * 60 * 1000,
		maxStypeCount: 0,

		_raw: {},
		_abyssalShips: {},
		_seasonalShips: {},

		init: function( raw ){
			this.load();

			if(typeof raw != "undefined"){
				return this.processRaw( raw );
			}

			try {
				this.updateRemodelTable();
			} catch(e) {
				console.warn("Updating remodel table unexpected", e);
			}
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

			if(KC3Meta.isAF() && this._raw.newShips[KC3Meta.getAF(4)] === undefined) {
				this._raw.newShips[KC3Meta.getAF(4)] = KC3Meta.getAF(2) - KC3Master.newUpdatesExpiredAfter;
				if(beforeCounts) beforeCounts[0] -= 1;
			}

			try {
				this.updateRemodelTable();
			} catch(e) {
				console.warn("Updating remodel table unexpected", e);
			}

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
			var ships = $.extend(true, {}, this._raw.ship);
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
				// Seasonal data leaking fixed again since 2017-10-18
			}
			return ships;
		},

		seasonal_ship :function(id){
			return this._seasonalShips[id] || false;
		},

		abyssal_ship :function(id){
			var as = $.extend(true, {}, this._abyssalShips[id]);
			return $.extend(as, this.ship(id));
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

		/**
		 * Build image or other file type URI of asset resources (like ship, equipment, useitem) since KC2ndSeq (HTML5 mode) on 2018-08-17.
		 * @see graph - replace old swf filename method, its filename now used as `uniqueKey` for some case
		 * @see main.js/ShipLoader.getPath - for the method of constructing resource path and usage of `uniqueKey` above
		 * @see main.js/SuffixUtil - for the method of calculating suffix numbers
		 * @param id - master id of ship or slotitem (also possible for furniture/useitem...)
		 * @param type - [`card`, `banner`, `full`, `character_full`, `character_up`, `remodel`, `supply_character`, `album_status`] for ship;
		 *               [`card`, `card_t`, `item_character`, `item_up`, `item_on`, `remodel`, `btxt_flat`, `statustop_item`, `airunit_banner`, `airunit_fairy`, `airunit_name`] for slotitem
		 * @param rscPath - `ship` or `slot`, or other known resource sub-folders
		 * @param isDamaged - for damaged ship CG, even some abyssal bosses
		 * @param debuffedAbyssalSuffix - specify old suffix for debuffed abyssal boss full CG. btw suffix is `_d`
		 */
		rsc_file :function(id, type, rscPath, isDamaged = false, debuffedAbyssalSuffix = ""){
			if(!id || id < 0 || !type || !rscPath) return "";
			const typeWithSuffix = type + (isDamaged && rscPath === "ship" ? "_dmg" : "");
			const typeWithPrefix = rscPath + "_" + typeWithSuffix;
			const key = str => str.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
			const getFilenameSuffix = (id, typeStr) => String(
				1000 + 17 * (Number(id) + 7) *
				KC3Meta.resourceKeys[(key(typeStr) + Number(id) * typeStr.length) % 100] % 8973
			);
			const padWidth = ({
				"ship": 4, "slot": 4, "furniture": 3, "useitem": 3, "bgm": 3,
			})[rscPath];
			const paddedId = String(id).padStart(padWidth || 3, "0"),
				suffix = !["useitem", "se"].includes(rscPath) ? "_" + getFilenameSuffix(id, typeWithPrefix) : "";
			const uniqueKey = type === "full" && rscPath === "ship" ? ((key) => (
					key ? "_" + key : ""
				))(this.graph(id).api_filename) : "";
			const fileExt = ({ "bgm": ".mp3" })[rscPath] || ".png";
			return `/${rscPath}/${typeWithSuffix}/${paddedId}${debuffedAbyssalSuffix}${suffix}${uniqueKey}${fileExt}`;
		},
		png_file :function(id, type = "card", shipOrSlot = "ship", isDamaged = false, debuffedAbyssalSuffix = ""){
			return this.rsc_file(id, type, shipOrSlot, isDamaged, debuffedAbyssalSuffix);
		},
		bgm_file :function(id, type = "port"){
			return this.rsc_file(id, type, "bgm");
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

		all_slotitem_icontypes :function(){
			if(!this._allIconTypes || !this._allIconTypes.length){
				if(!Array.isArray(this._allIconTypes)) this._allIconTypes = [];
				$.each(this.all_slotitems(), (_, g) => {
					const iconType = g.api_type[3];
					if(!this._allIconTypes.includes(iconType)) this._allIconTypes.push(iconType);
				});
				this._allIconTypes.sort((a, b) => a - b);
			}
			return this._allIconTypes;
		},

		stype :function(id){
			return !this.available ? false : this._raw.stype[id] || false;
		},

		stype_count :function(){
			this.maxStypeCount = this.maxStypeCount || (!this.available ? 22 : Object.keys(this._raw.stype).length || 22);
			return this.maxStypeCount;
		},

		slotitem_equiptype :function(id){
			return !this.available ? false : this._raw.slotitem_equiptype[id] || false;
		},

		equip_type :function(stype, shipId){
			if(!this.available) return false;
			// use ship specified equip types first if found
			const equipTypeArr = shipId && this.equip_ship(shipId).api_equip_type;
			if(equipTypeArr) return equipTypeArr;
			const equipTypeObj = this.stype(stype).api_equip_type || {};
			// remap equip types object of ship type to array
			return Object.keys(equipTypeObj).filter(type => !!equipTypeObj[type]).map(id => Number(id));
		},

		equip_type_sp :function(slotitemId, defaultType){
			return KC3Meta.specialEquipTypeMap[slotitemId] || defaultType;
		},

		equip_ship :function(shipId){
			const equipShips = this._raw.equip_ship || {};
			// look up ship specified equip types
			return !this.available ? false :
				equipShips[Object.keys(equipShips).find(i => equipShips[i].api_ship_id == shipId)] || false;
		},

		equip_exslot_type :function(equipTypes, stype, shipId){
			if(!this.available) return false;
			// remap general exslot types object to array
			const generalExslotTypes = Object.keys(this._raw.equip_exslot).map(i => this._raw.equip_exslot[i]);
			const regularSlotTypes = equipTypes || this.equip_type(stype, shipId) || [];
			return !regularSlotTypes.length ? generalExslotTypes :
				generalExslotTypes.filter(type => regularSlotTypes.includes(type));
		},

		// @return different from functions above, returns a slotitem ID list, not type2 ID list
		equip_exslot_ship :function(shipId){
			const exslotShips = this._raw.equip_exslot_ship || {};
			// find and remap ship specified exslot items
			return !this.available ? [] : Object.keys(exslotShips)
				.filter(i => exslotShips[i].api_ship_ids.includes(Number(shipId)))
				.map(i => exslotShips[i].api_slotitem_id) || [];
		},

		/**
		 * Special cases hard-coded at client-side:
		 *   * [553/554] Ise-class Kai Ni can equip main gun on first 2 slots only,
		 *     nothing needed to be handled for now, since we haven't added slot index condition.
		 *     * see `main.js#RemodelUtil.excludeEquipList`
		 *     * see `main.js#TaskIdleMain._onDropSlotItem`
		 *   * [392/724] Richelieu-class Kai can equip seaplane bomber [194] Laté 298B only,
		 *     either hard-coded the exception conndition in following codes.
		 *     * see `main.js#TaskChoiceSlotItem.prototype._initSetList_` and `#_updateListItem_`
		 *     * see `main.js#SlotitemModelHolder.prototype.createUnsetList` and `#createUnsetList_unType`
		 *   * [166] AkitsuMaru Kai can equip aviation personnel [402] Arctic Gear & Deck Personnel only,
		 *     the same hard-code method with Richelieu's one
		 *   * [622/623/624] Yuubari Kai Ni+ can NOT equip main gun/torpedo [1, 2, 5, 22] on slot 4, can only equip [12, 21, 43] on slot 5,
		 *     nothing needed to be handled for now, since we haven't added slot index condition.
		 *     * see `main.js#RemodelUtil.excludeEquipList`
		 *     * see `main.js#TaskIdleMain._onDropSlotItem`
		 *   * [662/663/668] Noshiro/Yahagi Kai Ni+ can NOT equip torpedo [5] on slot 4,
		 *     nothing needed to be handled for now, since we haven't added slot index condition.
		 *     * see `main.js#RemodelUtil.excludeEquipList`
		 *     * see `main.js#TaskIdleMain._onDropSlotItem`
		 */
		equip_on :function(gearId, type2Id){
			if(!this.available) return false;
			gearId = Number(gearId);
			if(!type2Id && gearId > 0) {
				const slotitem = this.slotitem(gearId);
				if(!slotitem) return false;
				type2Id = this.equip_type_sp(slotitem.api_id, slotitem.api_type[2]);
			}
			const capableStypes = [];
			$.each(this._raw.stype, (_, stype) => {
				if(!!(stype.api_equip_type || {})[type2Id])
					capableStypes.push(stype.api_id);
			});
			const capableShips = [], incapableShips = [];
			$.each(this._raw.equip_ship, (_, equipShip) => {
				const shipId = equipShip.api_ship_id,
					shipMst = this.ship(shipId), stype = shipMst.api_stype;
				const equipTypes = equipShip.api_equip_type;
				if(!capableStypes.includes(stype) && equipTypes.includes(type2Id))
					capableShips.push(shipId);
				if(capableStypes.includes(stype) && !equipTypes.includes(type2Id))
					incapableShips.push(shipId);
			});
			const generalExslotTypes = Object.keys(this._raw.equip_exslot).map(i => this._raw.equip_exslot[i]);
			const isCapableToExslot = generalExslotTypes.includes(type2Id);
			let exslotCapableShips = false;
			if(gearId > 0) {
				const exslotShips = this._raw.equip_exslot_ship || {};
				const exslotGear = Object.keys(exslotShips)
					.find(i => exslotShips[i].api_slotitem_id == gearId);
				if(exslotGear) {
					exslotCapableShips = exslotShips[exslotGear].api_ship_ids.slice(0);
				} else {
					exslotCapableShips = [];
				}
			}
			// Remove Richelieu-class Kai from Seaplane Bomber type list except Late 298B
			if(type2Id === 11 && gearId !== 194) {
				const richelieuKaiPos = capableShips.indexOf(392);
				if(richelieuKaiPos >= 0) capableShips.splice(richelieuKaiPos, 1);
				const jeanBartKaiPos = capableShips.indexOf(724);
				if(jeanBartKaiPos >= 0) capableShips.splice(jeanBartKaiPos, 1);
			}
			// Remove AkitsuMaru Kai from Aviation Personnel type list except Arctic Gear & Deck Personnel
			if(type2Id === 35 && gearId !== 402) {
				const akitsumaruKaiPos = capableShips.indexOf(166);
				if(akitsumaruKaiPos >= 0) capableShips.splice(akitsumaruKaiPos, 1);
			}
			return {
				stypes: capableStypes,
				includes: capableShips,
				excludes: incapableShips,
				exslot: isCapableToExslot,
				exslotIncludes: exslotCapableShips,
			};
		},

		/**
		 * @param gearMstId - slotitem to be checked, all slotitem ids returned if omitted
		 * @param shipTypeId - stype to be checked, allowed stype ids (if any) returned if omitted
		 * @return the array contains slotitem master ids or stype ids can be equipped on exslot by capable ships,
		 *         which not indicated by API data, but hard-coded in client instead.
		 * @see `#createSetListEx`/`#createSetListFromMstId`/`#createUnsetListFromMstId` in main.js
		 */
		equip_exslot_ids :function(gearMstId, shipTypeId) {
			// Improved Kanhon Type Turbine can be always equipped on exslot of capable ship types
			// Submarine Stern Torpedo Launchers can be equipped on exslot, added since 2021-11-19
			// Skilled Deck Personnel can be equipped on exslot for stype 7,11,18, added since 2022-08-26
			const allGearIds = [33, 442, 443, 477, 478];
			const stypeGearIds1 = [477, 478], stypes1 = [7, 11, 18];
			if(!gearMstId) return allGearIds;
			if(!shipTypeId) return stypeGearIds1.includes(gearMstId) ? stypes1
				: allGearIds.includes(gearMstId);
			return stypeGearIds1.includes(gearMstId) ? stypes1.includes(shipTypeId)
				: allGearIds.includes(gearMstId);
		},

		/**
		 * Check if specified equipment (or equip type) can be equipped on specified ship.
		 * @param {number} shipId - the master ID of ship to be checked.
		 * @param {number} gearId - the master ID of a gear to be checked. if omitted, will be checked by equip type.
		 * @param {number} gearType2 - the equip type ID of api_type[2] value, optional, but cannot be omitted at the same time with gearId.
		 * @return 1 indicates can be equipped on (some) regular slots, 2: ex-slot, 3: both, 0: cannot equip. false on exception.
		 * @see #equip_on
		 */
		equip_on_ship :function(shipId, gearId, gearType2) {
			if(!this.available) return false;
			if(!shipId) return false;
			const gearMstId = Number(gearId),
				shipMstId = Number(shipId),
				shipMst = this.ship(shipMstId);
			if(!shipMst) return false;
			const stype = shipMst.api_stype;
			const equipOn = this.equip_on(gearMstId, gearType2);
			if(!equipOn || (!equipOn.stypes.length && !equipOn.includes.length)) return false;
			var result = 0;
			if(Array.isArray(equipOn.excludes) && !equipOn.excludes.includes(shipMstId)) {
				if(equipOn.stypes.includes(stype)) result |= 1;
				else if(Array.isArray(equipOn.includes) && equipOn.includes.includes(shipMstId)) result |= 1;
			}
			const isExslotCapableCheckedByClient = this.equip_exslot_ids(gearMstId, stype);
			if(equipOn.exslot || isExslotCapableCheckedByClient) {
				if(result) result |= 2;
			} else if(Array.isArray(equipOn.exslotIncludes) && equipOn.exslotIncludes.includes(shipMstId)) {
				result |= 2;
			}
			return result;
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

		furniture :function(id, no, type){
			if(!this.available) return false;
			if(!id && no >= 0 && type >= 0){
				$.each(this._raw.furniture, (i, f) => {
					if(f.api_no === no && f.api_type === type){
						id = f.api_id;
						return false;
					}
				});
			}
			return id > 0 ? this._raw.furniture[id] || false : false;
		},

		all_furniture :function(){
			return this._raw.furniture || {};
		},

		missionDispNo :function(id){
			var dispNo = (this.mission(id) || {}).api_disp_no;
			return dispNo || String(id);
		},

		setCellData :function(startData){
			// `api_mst_mapcell` removed since KC Phase 2,
			// have to collect them from `api_req_map/start.api_cell_data`
			const mapcell = this._raw.mapcell || {};
			const world = startData.api_maparea_id, map = startData.api_mapinfo_no;
			const newCellsArr = startData.api_cell_data;
			if(world > 0 && map > 0 && Array.isArray(newCellsArr) && newCellsArr.length > 0) {
				if(KC3Meta.isEventWorld(world)) {
					// Clean existed cells of old events for small footprint,
					// since old event maps data will be accumulated to big
					$.each(mapcell, (id, cell) => {
						if(KC3Meta.isEventWorld(cell.api_maparea_id) && cell.api_maparea_id < world)
							delete mapcell[id];
					});
				} else {
					// Clean existed cells of this map for old master data
					const apiIds = newCellsArr.map(c => c.api_id);
					$.each(mapcell, (id, cell) => {
						if(!apiIds.includes(id) &&
							cell.api_maparea_id === world && cell.api_mapinfo_no === map)
							delete mapcell[id];
					});
				}
				newCellsArr.forEach(cell => {
					mapcell[cell.api_id] = {
						api_map_no: Number([world, map].join('')),
						api_maparea_id: world,
						api_mapinfo_no: map,
						api_id: cell.api_id,
						api_no: cell.api_no,
						api_color_no: cell.api_color_no,
						api_passed: cell.api_passed,
					};
					if(cell.api_distance !== undefined)
						mapcell[cell.api_id].api_distance = cell.api_distance;
				});
				this._raw.mapcell = mapcell;
				this.save();
			}
		},

		mapCell :function(world, map, edge){
			const mapCells = {};
			$.each(this._raw.mapcell || {}, (id, cell) => {
				if(cell.api_maparea_id === world && cell.api_mapinfo_no === map)
					mapCells[cell.api_no] = cell;
			});
			return edge === undefined ? mapCells : mapCells[edge] || {};
		},

		abyssalShip :function(id, isMasterMerged){
			var master = !!isMasterMerged && this.isAbyssalShip(id) && $.extend(true, {}, this.ship(id)) || {};
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
			return id > this.seasonalCgIdFrom; // && id <= this.seasonalCgIdTo;
		},

		isAbyssalShip :function(id){
			return id > this.abyssalShipIdFrom && id <= this.seasonalCgIdFrom;
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
