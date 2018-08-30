/**
 * PictureBook.js
 *
 * Keep track of in-game picture book info, work like a 'cache'.
 */
(function() {
    "use strict";

    window.PictureBook = {

        load: function() {
            if (localStorage.pictureBook === undefined)
                localStorage.pictureBook = JSON.stringify( {} );
            return JSON.parse( localStorage.pictureBook );
        },

        /**
         * @return true if specific ship has ever been owned by player based on picture book info.
         */
        isEverOwnedShip: function(shipMasterId) {
            const pictureBook = this.load();
            const baseShips = pictureBook.baseShips || [];
            return baseShips.indexOf( RemodelDb.originOf(shipMasterId) ) > -1;
        },

        /**
         * Update ship base form ID info in time, since player will not usually go to in-game picture book.
         */
        updateBaseShip: function(...shipMasterIds) {
            const pictureBook = this.load();
            const baseShips = pictureBook.baseShips = pictureBook.baseShips || [];
            shipMasterIds.forEach(id => {
                const baseId = RemodelDb.originOf(id);
                if (baseId && baseShips.indexOf(baseId) === -1) {
                    baseShips.push(baseId);
                }
            });
            localStorage.pictureBook = JSON.stringify( pictureBook );
        },

        record: function(params, response) {
            const pictureBook = this.load();
            // note: params are all url encoded strings, these api_* are numeric tho
            // current known types: 1: ship and 2: equipment
            const type = ["unk", "ship", "gear"][params.api_type] || "unk";
            // major pages (volume) on the left side of in-game picture book screen
            const page = params.api_no;
            // last updated timestamp
            const timestamp = Date.now();
            const apiList = (response.api_data || {}).api_list;
            const baseShips = pictureBook.baseShips = pictureBook.baseShips || [];

            // shrink data to those info only we really care about to save storage space:
            // joined master IDs of unlocked this ship form / equipment,
            // for ship form, it may be Kai or Kai Ni if it's individual picture item,
            // other elements of `api_table_id` may be other forms combined into this item,
            // or seasonal CG graph IDs for this form.
            const ids = [], rings = [];
            if (Array.isArray(apiList)) {
                apiList.forEach(item => {
                    const shipIds = item.api_table_id.filter(id => KC3Master.isRegularShip(id));
                    // note: not all forms of a ship will exist, mostly Kai form missing
                    ids.push(...shipIds);
                    // for ship, `api_state` arrays are used to indicate type of CG/event unlocked:
                    // [0] = basic unlocked, [1] = chuuha CG, [2] = Married, [3], [4] = ?
                    if (type === "ship") {
                        item.api_state.forEach((state, index) => {
                            if (state[0] && state[2]) {
                                rings.push(item.api_table_id[index]);
                            }
                        });
                    }
                    // record base form ID of all ships for duplicated ships checking
                    shipIds.forEach(id => {
                        const baseId = RemodelDb.originOf(id);
                        if (baseId && baseShips.indexOf(baseId) === -1) {
                            baseShips.push(baseId);
                        }
                    });
                });
            }
            const currentType = pictureBook[type] = pictureBook[type] || {};
            currentType[page] = {
                ids,
                timestamp
            };
            if (type === "ship") currentType[page].rings = rings;

            // clean pages not used any more, past implementation messes up pages from ship and gear.
            [1, 2, 3, 4, 5].forEach(p => { delete pictureBook[p]; });

            localStorage.pictureBook = JSON.stringify( pictureBook );
            console.log("Picture Book updated for", type, page, currentType[page]);
        }

    };
})();
