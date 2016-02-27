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
            $(".tab_badge .factory").hide();
			
			$(".export_value", $("#ep_name").parent().parent()).html(PlayerManager.hq.name);
			$(".export_value", $("#ep_level").parent().parent()).html(PlayerManager.hq.level);
			$(".export_value", $("#ep_server").parent().parent()).html(PlayerManager.hq.server);
			$(".export_value", $("#ep_current_fleet").parent().parent()).html(localStorage.fleets);
			$(".export_value", $("#ep_k2").parent().parent()).html("[dynamically generated]");
			$(".export_value", $("#ep_colle").parent().parent()).html(localStorage.ships);
			
            $(".tab_badge .export_parts input").on("click", function () {
                // on every option change we clear exported results
                // in case the exported data has or don't have some intended fields
                $(".tab_badge .export_result").empty();
            });

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
                    mkText("Use data from the current ship list. Please note that ships that you had before but somehow scrapped, modfodded, or sunk in favor of more ship slots will not show up. If you want to show everything that you had so far, even in the past, use the Picture Book option.");
                } else {
                    mkText("Use data from the in-game picture book / album / kandex / library. This will export ships you had even in the past which had been lost, probably in favor of more ship slots. This however, will require you to visit the MAIN pages on the IN-GAME picture book for us to collect data. You just need to visit the FIVE MAIN pages (not the sub-pages). Also, you DO NOT need to wait for all images to load.");

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
					mkText("Refresh (F5) this strategy room to update the states. And No, we will not add the feature to re-select the previous choice when you refresh.");
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


                var submitBtn = $(".tab_badge .factory .submit_form").clone();
                var formPart = $("form", submitBtn);
                console.log( formPart.attr("action") );
                function encodeVal(d) {
                    return typeof(d) === "object"?JSON.stringify(d):d;
                }

                var resultPost = {};
                function checkLabel(sel) {
                    return $(sel).is(":checked");
                }

                if (checkLabel("#ep_name")) {
                    resultPost.ttkName = result.ttkName;
                }
                if (checkLabel("#ep_level")) {
                    resultPost.ttkLvl = result.ttkLvl;
                }
                if (checkLabel("#ep_server")) {
                    resultPost.ttkServer = result.ttkServer;
                }
                if (checkLabel("#ep_current_fleet")) {
                    resultPost.fleet = result.fleet;
                }
                if (checkLabel("#ep_k2") || checkLabel("#ep_colle")) {
                    resultPost.ships = result.ships;
                }
                if (checkLabel("#ep_k2")) {
                    resultPost.k2Flag = "on";
                }
                if (checkLabel("#ep_colle")) {
                    resultPost.colleFlag = "on";
                }
                
                $.each(resultPost, function(k,v) {
                    resultPost[k] = encodeVal(v);
                    $("<input type='hidden' />")
                        .attr("name", k)
                        .attr("value", encodeVal(v))
                        .appendTo( formPart );
                });

                formPart.submit();
            });
		},
        exportFromIdList: function(ids) {
            function setInsert(xs,v) {
                if (xs.indexOf(v) === -1)
                    xs.push(v);
                return xs;
            }

            console.log(ids);
            var originIds = [];
            $.each(ids, function(i,x) {
                setInsert(originIds, RemodelDb.originOf(x));
            });

            var k2 = {};
            var k2Mst = {};

            var k2Ids = [];
            var k2MstIds = [];
            $.each( ids, function(i,id) {
                var k2Id = K2Badge.mstId2KainiTable[id];
                if (k2Id) {
                    k2Ids.push(k2Id);
                    k2MstIds.push(id);

                    // the user can only get Bismarck drei (178)
                    // by remodeling Bismarck zwei (173)
                    // so if it turns out that the player has 178, we add 173
                    // into the list no matter the player has it or not.
                    if (id === 178) {
                        k2Ids.push( K2Badge.mstId2KainiTable[173] );
                        k2MstIds.push( 173 );
                    }
                }
            });
            console.assert( k2Ids.length === k2MstIds.length);

            $.each( K2Badge.k2Template, function(stype, v1) {
                var obj = {};
                var ar = [];
                $.each(v1, function(bid,v2) {
                    obj[bid] = (k2Ids.indexOf(bid) !== -1);
                    var offset = k2Ids.indexOf(bid);
                    if (offset !== -1) {
                        ar.push(k2MstIds[offset]);
                    }
                });
                k2[stype] = obj;
                k2Mst[stype] = ar;
            });
            return {
                ships: ids,
                k2Flag: "on",
                colleFlag: "on"
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
            console.log(pb);
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
                                         id: ship.masterId
                                         // str: "icon"+K2Badge.mstId2FleetIdTable[ship.masterId]
                                        } );

                    } else {
                        fleetInfo.push( null );
                    }
                }
                allFleetInfo.push( fleetInfo );
            }

            // console.log( allFleetInfo );
            return {
                fleet: allFleetInfo
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
