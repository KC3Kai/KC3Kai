/* RemodelDb.js

   Everything related to ship remodels

*/
(function() {
    "use strict";

    window.RemodelDb = {
        _db: null,
        // NOTE: masterData on init is optional
        // as long as pre-processed data has been saved in localStorage
        init: function(masterData) {
            // load stored db if any
            if (typeof localStorage.remodelDb !== 'undefined')
                this._db = JSON.parse( localStorage.remodelDb );
            var isRaw = false;
            if (!masterData && KC3Master.available) {
                masterData = KC3Master._raw;
                isRaw = true;
            }
            if (masterData && this.requireUpdate(masterData, isRaw)) {
                try {
                    var db = this.mkDb(masterData, isRaw);
                    localStorage.remodelDb = JSON.stringify(db);
                    this._db = db;
                    console.info("RemodelDb: database updated based on", isRaw ? "Master raw" : "api_start2");
                } catch (e) {
                    console.error("RemodelDb: updating error", e);
                }
            } else {
                console.log("RemodelDb: no update required");
            }

            if (! this._db) {
                console.info("RemodelDb: database unavailable, need to re-initialize with master data");/*RemoveLogging:skip*/
            }
        },
        // compare master data against _db (could be null)
        // if this function returns true, then we need to perform a db update
        requireUpdate: function(masterData, isRaw) {
            if (!this._db)
                return true;
            if (this._db.shipCount !== (isRaw ? Object.keys(masterData.ship).length : masterData.api_mst_ship.length) ||
                this._db.upgradeCount !== (isRaw ? Object.keys(masterData.shipupgrade).length : masterData.api_mst_shipupgrade.length))
                return true;
            return false;
        },
        // Phase 1 according to the following doc: https://github.com/andanteyk/ElectronicObserver/blob/3d3286c15ddb587eb9d95146b855d1c0964ef064/ElectronicObserver/Other/Information/kcmemo.md#%E6%94%B9%E8%A3%85%E6%99%82%E3%81%AB%E5%BF%85%E8%A6%81%E3%81%AA%E7%89%B9%E6%AE%8A%E8%B3%87%E6%9D%90
        // Phase 2 see: main.js#ShipUpgradeModelHolder.prototype._getRequiredDevkitNum
        calcDevMat: function(steel, ship_id_from, blueprint_count) {
            switch(ship_id_from) {
                case 82: // Ise Kai
                    return 80;
                case 88: // Hyuuga Kai
                    return 181;
                case 149: // Kongou K2
                    return 300;
                case 150: // Hiei K2
                    return 330;
                case 277: // Akagi Kai
                    return 100;
                case 594: // Akagi Kai Ni
                case 599: // Akagi Kai Ni E
                    return 80;
                case 278: // Kaga Kai
                    return 120;
                case 610: // Kaga Kai Ni E
                    return 84;
                case 646: // Kaga Kai Ni Go
                    return 60;
                case 698: // Kaga Kai Ni
                    return 88;
                case 213: // Tenryuu
                    return 24;
                case 214: // Tatsuta
                case 242: // Shiratsuyu
                case 632: // Ariake
                case 643: // Ume
                    return 15;
                case 231: // Akebono
                case 344: // Asashimo
                case 350: // Umikaze
                    return 30;
                case 312: // Hamakaze
                case 317: // Urakaze
                case 320: // Isokaze
                case 381: // Shinyou Kai
                    return 40;
                case 884: // Unyou
                    return 32;
                case 382: // Unyou Kai
                    return 64;
                case 313: // Tanikaze
                case 228: // Yukikaze Kai
                    return 50;
                case 651: // Tan Yang
                case 681: // Samuel B.Roberts Kai
                    return 60;
                case 208: // Shikinami
                case 225: // Kagerou
                case 226: // Shiranui
                case 227: // Kuroshio
                case 301: // Akigumo
                case 345: // Takanami
                case 362: // Oyashio
                case 390: // Amagiri Kai
                case 903: // Amagiri K2
                case 368: // Uranami
                case 720: // Hayashio
                case 545: // Saratoga Mk.2
                case 550: // Saratoga Mk.2 Mod.2
                    return 20;
                case 206: // Isonami
                    return 28;
                case 588: // Yamakaze K2
                case 667: // Yamakaze K2D
                case 900: // Yamashiomaru
                    return 10;
                case 555: // Zuihou K2
                case 560: // Zuihou K2B
                case 908: // Amagiri K2D
                    return 5;
                case 359: // Okinami
                case 562: // Johnston
                case 596: // Fletcher
                    return 80;
                case 692: // Fletcher Kai
                    return 120;
                case 628: // Fletcher Kai Mod.2
                    return 180;
                case 629: // Fletcher Mk.II
                    return 20;
                case 520: // Janus
                    return 90;
                case 597: // Atlanta
                    return 100;
                case 293: // Yuubari Kai
                case 622: // Yuubari Kai Ni
                case 623: // Yuubari Kai Ni Toku
                case 624: // Yuubari Kai Ni D
                case 652: // Kuma Kai Ni
                case 657: // Kuma Kai Ni D
                    return 30;
                case 215: // Kuma
                case 579: // Gotland Kai
                    return 55;
                case 306: // Noshiro Kai
                    return 80;
                case 307: // Yahagi Kai
                    return 88;
                case 663: // Yahagi Kai Ni
                    return 45;
                case 668: // Yahagi K2B
                    return 15;
                case 73: // Mogami Kai
                    return 60;
                case 501: // Mogami Kai Ni
                    return 45;
                case 506: // Mogami Kai Ni Toku
                    return 15;
                case 318: // Ryuuhou Kai
                case 894: // Houshou Kai Ni
                    return 20;
                case 699: // Souya (AGS)
                    return 5;
                case 645: // Souya (AGL)
                    return 20;
                case 396: // Gambier Bay Kai
                    return 60;
                case 877: // Conte di Cavour
                    return 30;
                case 878: // Conte di Cavour Kai
                case 916: // Yamato Kai Ni Juu
                    return 50;
                default:
                    return this.isIgnoreDevMat(blueprint_count, ship_id_from)
                        || (steel < 4500) ? 0
                         : (steel < 5500) ? 10
                         : (steel < 6500) ? 15
                         : 20;
            }
        },
        // does not consume devmat if using blueprint, except:
        // still consumes devmat if converting Suzuya/Kumano K2 to Kou K2
        // Phase 2 see: main.js#ShipUpgradeModelHolder._USE_DEVKIT_GROUP_
        isIgnoreDevMat: function(blueprint_count, ship_id_from) {
            return blueprint_count > 0 && ![503, 504].includes(ship_id_from);
        },
        // Phase 1 some convert remodeling also consumes torches,
        // see also: https://github.com/andanteyk/ElectronicObserver/blob/3d3286c15ddb587eb9d95146b855d1c0964ef064/ElectronicObserver/Other/Information/kcmemo.md#%E9%AB%98%E9%80%9F%E5%BB%BA%E9%80%A0%E6%9D%90
        // Phase 2 see: main.js#ShipUpgradeModelHolder.prototype._getRequiredBuildKitNum
        calcTorch: function(ship_id_from) {
            switch(ship_id_from) {
                case 213: // Tenryuu
                    return 8;
                case 214: // Tatsuta
                    return 5;
                case 215: // Kuma
                    return 55;
                case 652: // Kuma Kai Ni
                case 657: // Kuma Kai Ni D
                    return 15;
                case 312: // Hamakaze
                case 317: // Urakaze
                case 320: // Isokaze
                case 632: // Ariake
                case 643: // Ume
                    return 10;
                case 231: // Akebono
                case 900: // Yamashiomaru
                    return 15;
                case 313: // Tanikaze
                    return 20;
                case 651: // Tan Yang
                    return 30;
                case 503: // Suzuya K2
                case 504: // Kumano K2
                case 508: // Suzuya Kou K2
                case 509: // Kumano Kou K2
                    return 20;
                case 545: // Saratoga Mk.2
                case 550: // Saratoga Mk.2 Mod.2
                    return 30;
                case 555: // Zuihou K2
                case 560: // Zuihou K2B
                    return 20;
                case 562: // Johnston
                case 596: // Fletcher
                case 520: // Janus
                case 588: // Yamakaze K2
                case 667: // Yamakaze K2D
                case 390: // Amagiri Kai
                case 903: // Amagiri K2
                case 908: // Amagiri K2D
                    return 10;
                case 692: // Fletcher Kai
                case 628: // Fletcher Kai Mod.2
                    return 30;
                case 629: // Fletcher Mk.II
                case 681: // Samuel B.Roberts Kai
                    return 20;
                case 597: // Atlanta
                    return 20;
                case 594: // Akagi Kai Ni
                case 599: // Akagi Kai Ni E
                case 698: // Kaga Kai Ni
                case 646: // Kaga Kai Ni Go
                    return 30;
                case 610: // Kaga Kai Ni E
                    return 84;
                case 293: // Yuubari Kai
                case 622: // Yuubari Kai Ni
                case 623: // Yuubari Kai Ni Toku
                case 624: // Yuubari Kai Ni D
                    return 30;
                case 579: // Gotland Kai
                    return 35;
                case 306: // Noshiro Kai
                    return 77;
                case 307: // Yahagi Kai
                    return 88;
                case 663: // Yahagi Kai Ni
                    return 30;
                case 668: // Yahagi K2B
                case 883: // Ryuuhou K2E
                case 888: // Ryuuhou K2
                case 285: // Houshou Kai
                case 894: // Houshou Kai Ni
                case 899: // Houshou Kai Ni Sen
                    return 20;
                case 501: // Mogami Kai Ni
                    return 60;
                case 506: // Mogami Kai Ni Toku
                    return 40;
                case 699: // Souya (AGS)
                case 650: // Souya (AGB)
                    return 5;
                case 645: // Souya (AGL)
                    return 10;
                case 396: // Gambier Bay Kai
                    return 73;
                case 877: // Conte di Cavour
                    return 10;
                case 878: // Conte di Cavour Kai
                    return 20;
                case 916: // Yamato Kai Ni Juu
                    return 50;
                default:
                    return 0;
            }
        },
        // hard-coded new consumption 'New Artillery Material' since 2018-02-16
        // see: main.js#ShipUpgradeModel.prototype.newhokohesosizai
        calcGunMat: function(ship_id_from) {
            switch(ship_id_from) {
                case 136: // to Yamato K2
                case 148: // to Musashi K2
                    return 3;
                case 149: // to Kongou K2C
                case 150: // to Hiei K2C
                    return 2;
                case 206: // to Isonami K2
                    return 1;
                default: return 0;
            }
        },
        mkDb: function(masterData, isRaw) {
            var self = this;
            // step 1: collect remodel info
            /*
               remodelInfo[ shipId  ] =
                 { ship_id_from: Int
                 , ship_id_to: Int
                 , level: Int
                 , steel: Int
                 , ammo: Int
                 , catapult: Int
                 , blueprint: Int
                 , report: Int
                 , gunmat: Int
                 , airmat: Int
                 , armmat: Int
                 , boiler: Int
                 , devmat: Int
                 , torch: Int
                 , remodel_level: Int
                 }
             */
            var remodelInfo = {};
            // all ship Ids (except abyssal)
            var shipIds = [];
            // all ship Ids that appears in x.aftershipid
            // stored as a set.
            var shipDstIds = {};

            $.each(isRaw ? masterData.ship : masterData.api_mst_ship, function(i,x){
                if (!KC3Master.isRegularShip(x.api_id))
                    return;
                shipIds.push( x.api_id );
                var shipId_to = parseInt(x.api_aftershipid,10) || 0;
                if (shipId_to === 0)
                    return;

                shipDstIds[shipId_to] = true;
                var remodel =
                    { ship_id_from: x.api_id,
                      ship_id_to: shipId_to,
                      level: x.api_afterlv,
                      // yes, this is steel
                      steel: x.api_afterfuel,
                      ammo: x.api_afterbull,
                      // these fields are unknown for now
                      catapult: 0,
                      blueprint: 0,
                      report: 0,
                      gunmat: 0,
                      airmat: 0,
                      armmat: 0,
                      boiler: 0,
                      devmat: 0,
                      torch: 0
                    };

                remodel.devmat = self.calcDevMat(remodel.steel, remodel.ship_id_from);
                remodel.torch = self.calcTorch(remodel.ship_id_from);
                remodel.gunmat = self.calcGunMat(remodel.ship_id_from);
                remodelInfo[x.api_id] = remodel;

            });

            function id2name(id) {
                return KC3Meta.shipNameById(id);
            }

            // step 2: get all original ship ids
            // an original ship can only remodel into other ships
            // but is never a remodel target
            // known exception: Souya (AGS) -> (AGL) -> (AGB) -> (AGS) -> ...
            var originalShipIds = [];
            $.each( shipIds, function(i,x) {
                if (!shipDstIds[x])
                    originalShipIds.push(x);
            });

            // walk through master shipupgrade data for more accurate info rather than master ships only
            $.each(isRaw ? masterData.shipupgrade : masterData.api_mst_shipupgrade, function(i,x) {
                if (x.api_current_ship_id === 0)
                    return;
                var remodel = remodelInfo[x.api_current_ship_id];
                console.assert(
                    remodel.ship_id_to === x.api_id,
                    "data inconsistent:", x.api_id);
                remodel.catapult = x.api_catapult_count;
                remodel.blueprint = x.api_drawing_count;
                remodel.report = x.api_report_count;
                remodel.airmat = x.api_aviation_mat_count;
                remodel.armmat = x.api_arms_mat_count;
                remodel.boiler = x.api_boiler_count;
                // recalc devmat according blueprint
                remodel.devmat = self.calcDevMat(remodel.steel, remodel.ship_id_from, remodel.blueprint);
                // add loop converted remodel if original ship is also remodel target
                if(!originalShipIds.includes(x.api_original_ship_id))
                    originalShipIds.push(x.api_original_ship_id);
                remodel.remodel_level = x.api_upgrade_level;
            });

            /*
               remodelGroups[ originalShipId  ] =
                 { origin: shipId
                 // circular-remodels are all considered final forms
                 , final_forms: [shipId]
                 // all forms of one kanmusu
                 , group: [shipId]
                 }
             */
            var remodelGroups = {};
            // reverse from shipId to original
            var originOf = {};

            $.each( originalShipIds, function(i, x) {
                var group = [x];
                var cur = x;
                while (typeof remodelInfo[cur] !== 'undefined' &&
                       group.indexOf(remodelInfo[cur].ship_id_to) === -1) {
                    cur = remodelInfo[cur].ship_id_to;
                    group.push( cur );
                }

                cur = group[group.length-1];
                var final_forms = [ cur ];
                while (typeof remodelInfo[cur] !== 'undefined' &&
                       final_forms.indexOf(remodelInfo[cur].ship_id_to) === -1) {
                    cur = remodelInfo[cur].ship_id_to;
                    final_forms.push( cur );
                }

                remodelGroups[x] =
                    { origin: x,
                      group: group,
                      final_forms: final_forms,
                    };

                $.each(group, function(j,y) {
                    originOf[y] = x;
                });
            });

            return { remodelInfo: remodelInfo,
                     remodelGroups: remodelGroups,
                     originOf: originOf,
                     // this 2 numbers are "checksum"s, if master data does not change
                     // on this 2 numbers, we don't recompute
                     shipCount: isRaw ? Object.keys(masterData.ship).length : masterData.api_mst_ship.length,
                     upgradeCount: isRaw ? Object.keys(masterData.shipupgrade).length : masterData.api_mst_shipupgrade.length
                   };
        },
        // return root ship in this ship's remodel chain
        originOf: function(shipId) {
            return this._db ? this._db.originOf[shipId] : undefined;
        },
        // return remodel info, including cost and required level
        remodelInfo: function(shipId) {
            return this._db ? this._db.remodelInfo[shipId] : undefined;
        },
        // return all ships in ship's remodel chain
        // in other words, all ships that considered "same" kanmusu
        remodelGroup: function(shipId) {
            var oid = this.originOf(shipId);
            return oid ? this._db.remodelGroups[oid].group : [];
        },
        // get final forms / remodels of one ship,
        // cyclic remodels are all considered final
        finalForms: function(shipId) {
            var oid = this.originOf(shipId);
            return oid ? this._db.remodelGroups[oid].final_forms : [];
        },
        // check if one ship is in her final form
        isFinalForm: function(shipId) {
            var ff = this.finalForms(shipId);
            return ff ? ff.indexOf(shipId) !== -1 : false;
        },
        // return ship id of the previous form.
        // if the ship is already in original form, "false" will be returned
        // this relation is not circular - tracing from final form using "previousForm"
        // will not result in infinite loop.
        previousForm: function(shipId) {
            if (shipId === this.originOf(shipId))
                return false;
            var group = this.remodelGroup(shipId);
            var curInd = group.indexOf(shipId);
            console.assert(
                curInd > 0, 
                "previousForm: querying on original form?" );
            return group[curInd-1];
        },
        // query the lowest level certain ship can have
        lowestLevel: function(shipId) {
            var prevId = this.previousForm(shipId);
            if (!prevId)
                return 1;

            var prevInfo = this.remodelInfo(prevId);
            return prevInfo.level;
        },
        dumpRemodelGroups: function() {
            return this._db ? JSON.stringify( this._db.remodelGroups ) : "";
        },
        // returns all possible remodel levels for current ship
        // returns false if the shipId is invalid
        nextLevels: function(shipId) {
            var self = this;
            var remodelGroup = this.remodelGroup(shipId).slice();
            if (!remodelGroup) return false;
            // either the final form doesn't remodel or
            // remodels into another final form, we don't care
            // for the purpose of this function.
            remodelGroup.pop();

            // for ships that has at least been remodelled once,
            // there is no need keeping her prior form info here.
            while (remodelGroup.length > 0 && remodelGroup[0] !== shipId)
                remodelGroup.shift();
            var levels = remodelGroup.map( function(sid) {
                return self.remodelInfo(sid).level; });
            return levels;
        }
    };
})();
