/* globals api_start2: true */
/* globals battleSample: true */
QUnit.skip( "Module", function() {
    localStorage.clear();
    
    QUnit.module( "BattlePrediction", function () {
        // fake KC3Database
        window.KC3Database = {
            init: function() {
                return true;
            },
            Sortie: function(ignored, callback) {
                callback(-1);
                return true;
            },
            updateNodes: function(id, newNodes) {
                return true;
            }
        };

        function testBattlePrediction(
            testTitle,
            battleData,
            expectedHPDay,
            expectedHPNight) {
            QUnit.test(testTitle, function(assert) {
                var pathToSrc = "../../../src/";
                ConfigManager.load();
                KC3Master.init(api_start2.api_data);
                KC3Meta.init(pathToSrc+"data/");
                KC3Meta.defaultIcon(pathToSrc+"assets/img/ui/empty.png");
                PlayerManager.init();
                KC3ShipManager.load();
                KC3GearManager.load();
                KC3Database.init();

                var isCombined = battleData.combined !== 0;
                PlayerManager.combinedFleet = battleData.combined;

                function registerGear(masterId) {
                    var itemId = KC3GearManager.count() + 10;
                    var gear = new KC3Gear();
                    gear.itemId = itemId;
                    gear.masterId = masterId;
                    KC3GearManager.list["x"+itemId] = gear;
                    return itemId;
                }

                function registerShip(masterId,level,equip) {
                    var rosterId = KC3ShipManager.count() + 10;
                    var ship = new KC3Ship();
                    ship.rosterId = rosterId;
                    ship.masterId = masterId;
                    ship.level = level;

                    if (equip) {
                        // 0-3 for normal items
                        // 4 for ex_item
                        $.each([0,1,2,3],function(ignored,i) {
                            if (equip[i] && equip[i] !== -1) {
                                ship.items[i] = registerGear(equip[i]);
                            }
                        });
                        if (equip[4] && equip[4] !== -1) {
                            ship.ex_item = registerGear(equip[4]);
                        }
                    }

                    KC3ShipManager.list["x"+rosterId] = ship;
                    return rosterId;
                }

                function makeFleet(fleetData) {
                    var fleet = new KC3Fleet();
                    if (fleetData) {
                        $.each([0,1,2,3,4,5],function(ignored,i) {
                            var shipData;
                            if (fleetData[i]) {
                                shipData = fleetData[i];
                                fleet.ships[i] =
                                    registerShip(shipData.mst_id,
                                                 shipData.level,
                                                 shipData.equip);
                            }
                        });
                    }
                    return fleet;
                }

                // make fleets
                var fleet = new KC3Fleet();
                var fleetEscort = new KC3Fleet();

                var i;
                var shipData;
                // fleet.ships;
                PlayerManager.fleets[0] = fleet = makeFleet(battleData.fleet1);
                if (isCombined) {
                    PlayerManager.fleets[1] = fleetEscort = makeFleet(battleData.fleet2);
                }

                localStorage.maps = JSON.stringify( {m00: {id:0, clear:1, kind: "single"}} );
                KC3SortieManager.onSortie = 0;
                KC3SortieManager.startSortie(
                    // fake map 0-0
                    0,0,
                    // fleet sent: first fleet
                    1,
                    // time & eventData: not used
                    null, null);
                KC3SortieManager.onSortie = 1;

                // set node 100 as boss node
                KC3SortieManager.setBoss(100, null);

                // battle node & boss node
                KC3SortieManager.advanceNode({
                    api_event_kind: 1,
                    api_no: 100
                }, null);

                KC3SortieManager.engageBattle(
                    battleData.battle.data,
                    null);

                var node = KC3SortieManager.currentNode();
                var enemyHPArr = node.enemyHP.map( function(x) {
                    return x.hp; });

                var allyHPArr = [];
                for (i=0; i<6; ++i) {
                    allyHPArr.push(fleet.ship(i).afterHp[0]);
                }
                if (isCombined) {
                    for (i=0; i<6; ++i) {
                        allyHPArr.push(fleetEscort.ship(i).afterHp[0]);
                    }
                }

                var hpArr = allyHPArr.concat(enemyHPArr);

                assert.deepEqual(hpArr,expectedHPDay,
                                 "hp prediction (day)" );

                if (!battleData.battle.yasen)
                    return;

                KC3SortieManager.engageNight( battleData.battle.yasen );

                enemyHPArr = node.enemyHP.map( function(x) {
                    return x.hp; });

                allyHPArr = [];
                for (i=0; i<6; ++i) {
                    allyHPArr.push(fleet.ship(i).afterHp[0]);
                }
                if (isCombined) {
                    for (i=0; i<6; ++i) {
                        allyHPArr.push(fleetEscort.ship(i).afterHp[0]);
                    }
                }
                hpArr = allyHPArr.concat(enemyHPArr);

                assert.deepEqual(hpArr,expectedHPNight,
                                 "hp prediction (night)" );
            });
        }

        testBattlePrediction(
            "normal battle",
            battleSample.normalBattle1,
            [4,7,71,36,50,37,311,
             -165,30,119,-28,19],
            [4,1,58,36,50,37,
             -139,0,-344,119,0,-280]
        );

        testBattlePrediction(
            "CTF battle",
            battleSample.ctfBattle1,
            [50,66,75,58,70,79,
             56,38,48,47,19,27,

             30,-53,-29,-93,-37,-34],
            [50,66,75,58,70,79,
             56,38,48,47,19,27,

             -37,0,0,0,0,0]
        );

        testBattlePrediction(
            "STF battle",
            battleSample.stfBattle1,
            [49,36,82,8,18,55,
             19,63,8,49,22,32,

             230,-61,197,230,-150,-141],
            [49,36,82,8,18,55,
             19,5,8,49,22,32,

             -59,0,147,58,0,0]
        );

        testBattlePrediction(
            "TECF battle",
            battleSample.tecfBattle1,
            [27,53,65,9,27,11,
             25,39,44,36,4,4,

             150,65,9,32,-80,36],
            [27,53,65,9,27,11,
             25,39,44,6,4,4,

             150,65,-308,-131,0,-147]
        );

        testBattlePrediction(
            "normal battle with damecon",
            battleSample.normBattleWithDameCon1,
            [8,32,7,8,4,25,

             396,130,-37,60,520,120],
            null
        );
    });
});
