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
			PlayerManager.loadFleets();
			KC3ShipManager.load();

			$(".tab_badge .factory").hide();

			$(".export_value", $("#ep_name").parent().parent()).text(PlayerManager.hq.name);
			$(".export_value", $("#ep_level").parent().parent()).text(PlayerManager.hq.level);
			$(".export_value", $("#ep_server").parent().parent()).text(PlayerManager.hq.server);
			$(".export_value", $("#ep_current_fleet").parent().parent()).text(
				JSON.stringify( PlayerManager.fleets.map(f => ({id:f.fleetId, name:f.name, ships:f.ships})) )
			);
			$(".export_value", $("#ep_k2").parent().parent()).text("[dynamically generated]");
			$(".export_value", $("#ep_colle").parent().parent()).text(
				JSON.stringify( Object.keys(KC3ShipManager.list).map(x => KC3ShipManager.list[x].masterId) )
			);

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
						if (pb.ship && pb.ship[i]) {
							t = t + "Last Update: " + new Date(pb.ship[i].timestamp);
						} else {
							t = t + "missing";
						}
						mkText(t);
					}
					mkText("Refresh this page to update the states. And No, we will not add the feature to re-select the previous choice when you refresh.");
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

				// the name is a bit confusing, but here this "submitBtn" acts like an agent
				// that allows us to construct and submit POST requests.
				var submitBtn = $(".tab_badge .factory .submit_form").clone();
				var formPart = $("form", submitBtn);
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

				var actionPath = $('input[name=lang]:checked', "#lang").val();
				if (!actionPath)
					actionPath = $('#radio_en', "#lang").val();
				formPart.attr("action",	 "http://www.sanya.moe/kcbadge/"+actionPath);
				// starting from chrome 56, a form needs to be attached to document
				// for the submit action to work. see https://github.com/KC3Kai/KC3Kai/issues/1781
				$(".tab_badge .page_section.dummy_section")
					.empty()
					.append( formPart );
				formPart.submit();
			});

			// select language based on user preference
			var kcLang = ConfigManager.language;
			var lang =
				kcLang === "en" ? "en"
				: kcLang === "jp" ? "jp"
				: kcLang === "scn" ? "cn"
				: kcLang === "tcn" ? "tw"
			: "en";
			$("#radio_"+lang, ".export_lang #lang").click();
		},
		exportFromIdList: function(ids) {
			return {
				ships: ids
			};
		},
		exportFromShipList: function() {
			KC3ShipManager.load();
			var ids = [];
			$.each( KC3ShipManager.list, function(k, ship) {
				ids.push( ship.masterId );
			});
			return this.exportFromIdList(ids);
		},
		exportFromPictureBook: function() {
			var pb = PictureBook.load();
			var ids = [];
			$.each(pb.ship, function(v, x) {
				ids.push( ...x.ids );
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
