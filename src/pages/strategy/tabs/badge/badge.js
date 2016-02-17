(function(){
	"use strict";

	KC3StrategyTabs.badge = new KC3StrategyTab("badge");

	KC3StrategyTabs.badge.definition = {
		tabSelf: KC3StrategyTabs.badge,

		/* INIT
		   Prepares all data needed
		   ---------------------------------*/
		init :function(){
		},

		/* EXECUTE
		   Places data onto the interface
		   ---------------------------------*/
		execute :function(){
            var self = this;
            $(".tab_badge .export_method input").change( function() {
                // adjust text accordingly
                var v = $(this).val();

                $(".export_method .desc").empty();

                function mkText(text) {
                    $("<div />")
                        .text(text)
                        .appendTo(".export_method .desc");
                }

                var pb,i;
                if (v === 'shiplist') {
                    mkText("Export Data from Current Ship List");
                } else {
                    mkText("Export Data from Picture Book," +
                           "require sync-ing in-game picture book");

                    mkText("Status:");
                    pb = PictureBook.load();
                    for (i=1; i<=5; ++i) {
                        var t = "Vol." + i + ", ";
                        if (pb[i]) {
                            t = t + "Last Update: " + new Date(pb[i].timestamp);
                        } else {
                            t = t + "missing";
                        }
                        mkText(t);
                    }
                }

            });
            $("#radio_sl").prop("checked",true).trigger('change');

            $(".tab_badge .export_control a").on("click", function() {
                var v = $(".tab_badge .export_method input:checked").val();
                $(".tab_badge .export_result").empty();

                function mkText(text) {
                    $("<div />")
                        .text(text)
                        .appendTo(".tab_badge .export_result");
                }

                var result =
                    v === 'shiplist'
                    ? self.exportFromShipList()
                    : v === 'picturebook'
                    ? self.exportFromPictureBook()
                    : {};
                result = $.extend(
                    result,
                    self.exportTtkInfo(),
                    self.exportFleetInfo());

                $.each(result, function(k,v) {
                    mkText(String(k) + "=" + v);
                });

            });
		},
        exportFromIdList: function(ids) {
            function setInsert(xs,v) {
                if (xs.indexOf(v) === -1)
                    xs.push(v);
                return xs;
            }

            var originIds = [];
            $.each(ids, function(i,x) {
                setInsert(originIds, RemodelDb.originOf(x));
            });

            var colleIds = [];
            $.each( originIds, function(i,mid) {
                var result = K2Badge.mstId2ColleTable[mid];
                if (result) {
                    colleIds.push( result );
                } else {
                    console.warn("error looking up mstId:", mid);
                }
            });

            var colle = {};
            $.each(colleIds, function(i,x) {
                colle[x] = true;
            });

            var colleEncoded = btoa(JSON.stringify(colle));

            var k2 = {};

            var k2Ids = [];
            $.each( ids, function(i,id) {
                var k2Id = K2Badge.mstId2KainiTable[id];
                if (k2Id) {
                    k2Ids.push(k2Id);

                    // the user can only get Bismarck drei (178)
                    // by remodeling Bismarck zwei (173)
                    // so if it turns out that the player has 178, we add 173
                    // into the list no matter the player has it or not.
                    if (id === 178) {
                        k2Ids.push( K2Badge.mstId2KainiTable[173] );
                    }
                }
            });
            $.each( K2Badge.k2Template, function(stype, v1) {
                var obj = {};
                $.each(v1, function(bid,v2) {
                    obj[bid] = (k2Ids.indexOf(bid) !== -1);
                });
                k2[stype] = obj;
            });
            var k2Encoded = btoa( JSON.stringify(k2));
            return {
                colle: colleEncoded,
                k2: k2Encoded
            };
        },
        exportFromShipList: function() {
            var ids = [];
            $.each( KC3ShipManager.list, function(k,ship) {
                ids.push( ship.masterId );
            });
            return this.exportFromIdList(ids);
        },
        exportFromPictureBook: function() {
            var pb = PictureBook.load();
            var i;
            var ids = [];
            $.each(pb, function(vol,x) {
                ids = ids.concat( x.ids );
            });
            return this.exportFromIdList(ids);
        },
        exportFleetInfo: function() {
            PlayerManager.loadFleets();

            var allFleetInfo = [];
            var i,j;
            for (i=0; i<4;++i) {
                var fleetInfo = [];
                var fleet = PlayerManager.fleets[i];
                for (j=0;j<6;++j) {
                    if (fleet && fleet.ships[j] !== -1) {
                        var ship = KC3ShipManager.get(fleet.ships[j]);
                        fleetInfo.push( {lvl: ship.level,
                                         str: "icon"+K2Badge.mstId2FleetIdTable[ship.masterId]
                                        } );

                    } else {
                        fleetInfo.push( {lvl:1,
                                         str:""} );
                    }
                }
                allFleetInfo.push( fleetInfo );

            }
            var levelStr = allFleetInfo
                .map( function(fleet) {
                    return fleet
                        .map( function(s) {
                            return s.lvl; })
                        .join(",");
                }).join("|");
            var fleetStr = allFleetInfo
                .map( function(fleet) {
                    return fleet
                        .map( function(s) {
                            return s.str; })
                        .join(",");
                }).join("|");

            return {
                fleet: btoa(fleetStr),
                fleetLvl: btoa(levelStr)
            };
        },
        exportTtkInfo: function() {
            var result = {};
            result.ttkLvl = PlayerManager.hq.level;
            result.ttkName = PlayerManager.hq.name;
            result.ttkServer = PlayerManager.hq.server;
            return result;
        }
	};

})();
