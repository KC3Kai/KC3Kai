QUnit.module( "Module", function() {
    QUnit.module( "BattlePrediction", function () {
        // fake KC3Database
        window.KC3Database = {
            init: function() {
                return true;
            },
            Sortie: function(ignored, callback) {
                callback(-1);
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
                KC3Master.init(api_start2.api_data);
		        KC3Meta.init(pathToSrc+"data/");
		        KC3Meta.defaultIcon(pathToSrc+"assets/img/ui/empty.png");
		        ConfigManager.load();
		        PlayerManager.init();
		        KC3ShipManager.load();
		        KC3GearManager.load();
		        KC3Database.init();

                var isCombined = battleData.combined !== 0;
                PlayerManager.combinedFleet = battleData.combined;
                // register ships
                $.each(battleData.fleet1, function(rosterId,shipData) {
                    var ship = new KC3Ship();
                    ship.rosterId = rosterId;
                    ship.masterId = shipData.mst_id;
                    ship.level = shipData.level;
                    KC3ShipManager.list["x"+rosterId] = ship;
                });
                // register ships for combined fleets
                if (isCombined) {
                    $.each(battleData.fleet2, function(i,shipData) {
                        var rosterId = i + 6;
                        var ship = new KC3Ship();
                        ship.rosterId = rosterId;
                        ship.masterId = shipData.mst_id;
                        ship.level = shipData.level;
                        KC3ShipManager.list["x"+rosterId] = ship;
                    });
                }

                // make fleets
                var fleet = new KC3Fleet();
                var fleetEscort = new KC3Fleet();

                var i;
                // fleet.ships;
                for (i=0; i<6; ++i) {
                    if (battleData.fleet1[i]) {
                        fleet.ships[i] = i;
                    }
                }
                PlayerManager.fleets[0] = fleet;

                if (isCombined) {
                    for (i=0; i<6; ++i) {
                        if (battleData.fleet2[i]) {
                            fleetEscort.ships[i] = i+6;
                        }
                    }
                    PlayerManager.fleets[1] = fleetEscort;
                }

                localStorage.maps = JSON.stringify( {m00: {id:0, clear:1, kind: "single"}} );
                KC3SortieManager.startSortie(
                    // fake map 0-0
                    0,0,
                    // fleet sent: first fleet
                    1,
                    // time & eventData: not used
                    null, null);

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
        };

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
    });
});
