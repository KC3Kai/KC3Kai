(function(){
	"use strict";

	KC3StrategyTabs.expcalc = new KC3StrategyTab("expcalc");

	KC3StrategyTabs.expcalc.definition = {
		tabSelf: KC3StrategyTabs.expcalc,
		goals: {},
		goalTemplates: [], // to be initialized in "init"
		rankNames: ["F", "E", "D", "C", "B", "A", "S", "SS" ],

		/* INIT
		Prepares all data needed
		---------------------------------*/
		init :function(){
			// Check for saved grind data
			if(typeof localStorage.goals != "undefined"){
				this.goals = JSON.parse(localStorage.goals);
			}

			this.goalTemplates = GoalTemplateManager.load();
		},

		/* RELOAD
		Prepares latest ships data
		---------------------------------*/
		reload :function(){
			KC3ShipManager.load();
			// clean grind data of non-exists ship(s)
			var isCleaned = false;
			Object.keys(this.goals).forEach(key => {
				if(KC3ShipManager.get(key.slice(1)).isDummy()) {
					isCleaned |= delete this.goals[key];
				}
			});
			if(isCleaned) this.save();
		},

		computeNextLevel: function(masterId, currentLevel) {
			function setAdd(arr,x) {
				if (arr.indexOf(x) === -1)
					arr.push(x);
			}
			// figure out a list of possible goal levels in ascending order.
			// a goal level might be remodel level or 99 (can be married) / 165 (full exp)
			var possibleNextLevels = RemodelDb.nextLevels( masterId );
			setAdd(possibleNextLevels, KC3Ship.getMarriedLevel() - 1);
			setAdd(possibleNextLevels, KC3Ship.getMaxLevel());

			while (possibleNextLevels.length > 0 && possibleNextLevels[0] <= currentLevel)
				possibleNextLevels.shift();

			return possibleNextLevels.length > 0 ? possibleNextLevels[0] : false;
		},

		getSettings: function() {
			var defSettings = {
				showGoalTemplates: true,
				showRecommended: true,
				showOtherShips: true,
				shipsOrderType: "id",
				shipsSortDirection: "up",
				shipsOrderSecondType: "",
				shipsSortSecondDirection: "up",
				closeToRemodelLevelDiff: 5
			};
			var settings;
			if (typeof localStorage.srExpcalc === "undefined") {
				localStorage.srExpcalc = JSON.stringify( defSettings );
				settings = defSettings;
			} else {
				settings = JSON.parse( localStorage.srExpcalc );
				// For smooth transition to ordering version
				if (typeof settings.shipsOrderType === "undefined"
					|| typeof settings.shipsSortDirection === "undefined"
					|| typeof settings.shipsOrderSecondType === "undefined"
					|| typeof settings.shipsSortSecondDirection === "undefined") {
					settings.shipsOrderType = "id";
					settings.shipsSortDirection = "up";
					settings.shipsOrderSecondType = "";
					settings.shipsSortSecondDirection = "up";
				}
			}
			return settings;
		},

		// settingModifier( oldSettings ) should return the new settings object.
		// feel free to change fields in oldSettings in order to make the new one.
		modifySettings: function(settingModifier) {
			var newSettings = settingModifier(this.getSettings());
			localStorage.srExpcalc = JSON.stringify( newSettings );
			return newSettings;
		},

		configSectionToggles: function() {
			var self = this;

			var jqGoalTemplates = $(".gt_content");
			var jqRecommended = $(".recom_content");
			var jqOtherShips = $(".other_content");

			var jqToggleGT = $(".toggle_goal_templates");
			var jqToggleRecom = $(".toggle_recommended");
			var jqToggleOther = $(".toggle_other_ships");
			
			var jqOrderTypes = $(".order_line dd");

			var jqCloseToRemLvlDiff = $("input#inp_lvl_diff");

			function updateUI() {
				var settings = self.getSettings();
				jqGoalTemplates.toggle( settings.showGoalTemplates );
				jqRecommended.toggle( settings.showRecommended );
				jqOtherShips.toggle( settings.showOtherShips );
				jqOrderTypes.removeClass("active up down");
				jqOrderTypes.filter(".order_" + settings.shipsOrderType).addClass("active").addClass(settings.shipsSortDirection);
				jqOrderTypes.filter(".order_" + settings.shipsOrderSecondType).addClass("active").addClass(settings.shipsSortSecondDirection); // other style for secondary?

				jqToggleGT
					.toggleClass("active", settings.showGoalTemplates);
				jqToggleRecom
					.toggleClass("active", settings.showRecommended);
				jqToggleOther
					.toggleClass("active", settings.showOtherShips);

				jqCloseToRemLvlDiff.val( settings.closeToRemodelLevelDiff );
				orderShips(settings.shipsOrderType, settings.shipsSortDirection, settings.shipsOrderSecondType, settings.shipsSortSecondDirection);
			}

			updateUI();
			function negateField(field) {
				return function(obj) {
					// well, make sure not to use old obj afterwards.
					obj[field] = !obj[field];
					return obj;
				};
			}
			
			function updateOrder(field, newState) {
				return function(obj) {
					obj[field] = newState;
					return obj;
				};
			}

			jqToggleGT.on("click", function() {
				self.modifySettings( negateField("showGoalTemplates") );
				updateUI();
			});
			jqToggleRecom.on("click", function() {
				self.modifySettings( negateField("showRecommended") );
				updateUI();
			});

			jqToggleOther.on("click", function() {
				self.modifySettings( negateField("showOtherShips") );
				updateUI();
			});
			jqOrderTypes.on("click", function(e) {
				if (e.shiftKey && self.getSettings().shipsOrderType != $(this).data("order")) {
					if ($(this).hasClass("up")) {
						self.modifySettings(updateOrder("shipsSortSecondDirection", "down"));
					} else {
						self.modifySettings(updateOrder("shipsSortSecondDirection", "up"));
					}
					self.modifySettings(updateOrder("shipsOrderSecondType", $(this).data("order")));
				} else {
					if ($(this).hasClass("up")) {
						self.modifySettings(updateOrder("shipsSortDirection", "down"));
					} else {
						self.modifySettings(updateOrder("shipsSortDirection", "up"));
					}
					self.modifySettings(updateOrder("shipsOrderType", $(this).data("order")));
					self.modifySettings(updateOrder("shipsOrderSecondType", ""));
				}
				updateUI();
			});
			jqOrderTypes.on("keyup keydown", function() {
				updateUI();
			});
			jqCloseToRemLvlDiff
				.on("blur", function() {
					var jqObj = $(this);
					var settings = self.getSettings();
					var newInp = parseInt(jqObj.val(), 10);
					if (!newInp) {
						// restore option when the input isn't valid
						jqObj.val( settings.closeToRemodelLevelDiff );
						return;
					} else {
						self.modifySettings( function(settings) {
							settings.closeToRemodelLevelDiff = newInp;
							return settings;
						});
						updateUI();
						$(".btn_hl_close_to_remodel").click();
					}
				})
				.on("keydown", function(e) {
					// disable tab otherwise UI might be ruined
					if (e.which === 9)
						e.preventDefault();

					// give up focus when hitting enter
					// so that "blur" event can be triggered.
					if (e.which === 13) {
						this.blur();
						e.preventDefault();
					}
				});
				
			function orderShips(sortKey, sortOrder, sortSecondKey, sortSecondOrder) {
				function sortBoxes(boxSorted) {
					var sortedElements = $(boxSorted).find(".ship_goal");
					var sorter = function(a, b, sortType, order) {
						var isUp = (order == "up") ? -1 : 1;

						// Various order types
						if (sortType == "id") {
							return isUp * (+$(b).attr("id").substr(7) - +$(a).attr("id").substr(7));
						} else if (sortType == "name") {
							return isUp * ($(b).find(".ship_info .ship_name").text().toUpperCase().localeCompare($(a).find(".ship_info .ship_name").text().toUpperCase()));
						} else if (sortType == "level") {
							return isUp * (+$(b).find(".ship_lv .ship_value").text() - +$(a).find(".ship_lv .ship_value").text());
						} else if (sortType == "remodel") {
							return isUp * (+$(b).find(".ship_target .ship_value").text() - +$(a).find(".ship_target .ship_value").text());
						} else if (sortType == "lvldiff") {
							return isUp * ((+$(b).find(".ship_target .ship_value").text() - +$(b).find(".ship_lv .ship_value").text()) - (+$(a).find(".ship_target .ship_value").text() - +$(a).find(".ship_lv .ship_value").text()));
						} else if (sortType == "xpdiff") {
							return isUp * (+$(b).find(".ship_exp .ship_value").text() - +$(a).find(".ship_exp .ship_value").text());
						} else if (sortType == "shiptype") {
							return isUp * ($(b).find(".ship_info .ship_type").text().localeCompare($(a).find(".ship_info .ship_type").text()));
						}
					};
					sortedElements.sort(function(a, b) {
						var primarySort = sorter(a, b, sortKey, sortOrder);
						return primarySort ? primarySort : sorter(a, b, sortSecondKey, sortSecondOrder);
					})
					.prependTo(boxSorted);
				}
				
				sortBoxes(".box_goals");
				sortBoxes(".box_recommend");
				sortBoxes(".box_other");
			}
		},

		configHighlightToggles: function() {
			var self = this;
			// show Close To Remodel options should be shown only when
			// this button is clicked. If user clears all highlights
			// or want to show other kinds of highlights, we hide the option again.
			$(".box_control_line.line_close_to_remodel").hide();

			function clearHighlight( jqObj ) {
				jqObj.removeClass(
					"highlight_stype " +
					"highlight_closeToRemodel " +
					"highlight_canBeRemodelled ");
				return jqObj;
			}
			$(".btn_hl_clear").on("click", function() {
				$(".section_body .ship_goal").each( function(i,x) {
					var jqObj = $(x);
					clearHighlight(jqObj);
					$(".box_control_line.line_close_to_remodel").hide();
				});
			});
			$(".btn_hl_close_to_remodel").on("click", function() {
				$(".box_control_line.line_close_to_remodel").show();
				var settings = self.getSettings();
				$(".section_body .ship_goal").each( function(i,x) {
					var jqObj = $(x);
					clearHighlight(jqObj);
					var rosterId = jqObj.data("id");
					var ThisShip = KC3ShipManager.get( rosterId );
					if (ThisShip.isDummy()) return;
					
					var goalLevel = 
						self.computeNextLevel( ThisShip.masterId, ThisShip.level );

					if (goalLevel === false || goalLevel >= KC3Ship.getMarriedLevel() - 1)
						return;
					if (goalLevel - ThisShip.level <= settings.closeToRemodelLevelDiff ) {
						jqObj.addClass("highlight_closeToRemodel");
					}
				});
			});
			$(".btn_hl_can_be_remodelled").on("click", function() {
				$(".box_control_line.line_close_to_remodel").hide();
				$(".section_body .ship_goal").each( function(i,x) {
					var jqObj = $(x);
					clearHighlight(jqObj);
					var rosterId = jqObj.data("id");
					var ThisShip = KC3ShipManager.get( rosterId );
					if (ThisShip.isDummy()) return;
					var nextLevels = RemodelDb.nextLevels( ThisShip.masterId );
					// If can be remodelled (without convert remodels)
					if (nextLevels !== false &&
						nextLevels.length > 0 &&
						!RemodelDb.isFinalForm(ThisShip.masterId) &&
						nextLevels[0] <= ThisShip.level) {
						jqObj.addClass("highlight_canBeRemodelled");
					}
				});
			});
		},

		/* EXECUTE
		Places data onto the interface
		---------------------------------*/
		execute :function(){
			var self = this;

			// Add map list into the factory drop-downs
			$.each(KC3Meta.allMapsExp(), function(mapName, mapExp){
				if(mapExp > 0){
					$(".tab_expcalc .factory .ship_map select").append("<option>" + mapName + "</option>");
					$(".tab_expcalc .factory .goal_map select").append("<option>" + mapName + "</option>");
				}
			});

			var editingBox, mapSplit;

			// Edit Button
			$(".section_expcalc .box_goals").on("click", ".ship_edit", function(){
				editingBox = $(this).parent();
				var grindData = self.goals[ "s"+editingBox.data("id") ];

				$(".ship_target input", editingBox).val( grindData[0] );
				$(".ship_map select", editingBox).val( grindData[1]+"-"+grindData[2] );
				$(".ship_rank select", editingBox).val( grindData[4] );
				$(".ship_fs input", editingBox).prop("checked", grindData[5]);
				$(".ship_mvp input", editingBox).prop("checked", grindData[6]);

				$(".ship_value" , editingBox).hide();
				$(".ship_input" , editingBox).show();

				$(".ship_edit" , editingBox).hide();
				$(".ship_save" , editingBox).show();
			});

			// Save Button
			$(".section_expcalc .box_goals").on("click", ".ship_save", function(){
				editingBox = $(this).parent();

				mapSplit = $(".ship_map select", editingBox).val().split("-");
				//console.debug("mapSplit", mapSplit);
				self.goals["s"+ editingBox.data("id") ] = [
					/*0*/ parseInt($(".ship_target input", editingBox).val(), 10), // target level
					/*1*/ parseInt(mapSplit[0], 10), // world
					/*2*/ parseInt(mapSplit[1], 10), // map
					/*3*/ 0, // node
					/*4*/ parseInt($(".ship_rank select", editingBox).val(), 10), // battle rank
					/*5*/ $(".ship_fs input", editingBox).prop("checked")?1:0, // flagship
					/*6*/ $(".ship_mvp input", editingBox).prop("checked")?1:0 // mvp
				];

				self.save();

				self.recompute( editingBox.data("id") );

				$(".ship_value" , editingBox).show();
				$(".ship_input" , editingBox).hide();

				$(".ship_edit" , editingBox).show();
				$(".ship_save" , editingBox).hide();
			});

			// Add to Goals Button
			$(".section_expcalc").on("click", ".ship_add", function(){
				editingBox = $(this).parent();
				self.goals["s"+ editingBox.data("id") ] = [];
				self.save();

				$(".ship_edit", editingBox).show();
				$(".ship_rem", editingBox).show();
				editingBox.removeClass("inactive");
				editingBox.appendTo(".section_expcalc .box_goals");
				self.recompute( editingBox.data("id") );
			});

			function goalTemplateSetupUI(tdata, goalBox) {
				var mapStr = tdata.map.join("-");

				// "show" mode
				$(".goal_type .goal_value",goalBox)
					.text( GoalTemplateManager.showSType(tdata.stype) );
				$(".goal_map .goal_value",goalBox).text( mapStr );
				$(".goal_rank .goal_value",goalBox).text( self.rankNames[tdata.rank] );
				$(".goal_fs .goal_value",goalBox).text( tdata.flagship? "Yes":"No" );
				$(".goal_mvp .goal_value",goalBox).text( tdata.mvp? "Yes":"No" );

				// "edit" mode
				$(".goal_type input",goalBox)
					.val( GoalTemplateManager.showInputSType(tdata.stype) );
				$(".goal_map select",goalBox).val( mapStr );
				$(".goal_rank select",goalBox).val( tdata.rank );
				$(".goal_fs input", goalBox).prop("checked", tdata.flagship);
				$(".goal_mvp input", goalBox).prop("checked", tdata.mvp);

				// enable / disable
				if (! tdata.enable) {
					goalBox.addClass("disabled");
				} else {
					goalBox.removeClass("disabled");
				}
				$(".goal_onoff", goalBox).text( tdata.enable? "Enabled":"Disabled");

				$(".goal_fs .goal_value", goalBox).toggleClass("bool_no",!tdata.flagship);
				$(".goal_mvp .goal_value", goalBox).toggleClass("bool_no",!tdata.mvp);
			}

			function goalTemplateEdit(t) {
				$(".goal_edit",t).hide();
				$(".goal_save",t).show();

				$(".goal_col .goal_value",t).hide();
				$(".goal_col .goal_input",t).show();
				$(".manage_buttons",t).hide();
			}

			function goalTemplateShow(t) {
				$(".goal_edit",t).show();
				$(".goal_save",t).hide();

				$(".goal_col .goal_value",t).show();
				$(".goal_col .goal_input",t).hide();
				$(".manage_buttons",t).show();
			}

			function goalTemplateRemove(t) {
				var ind = t.index();
				self.goalTemplates.splice(ind,1);
				GoalTemplateManager.save( self.goalTemplates );
				t.remove();
			}

			// swap two templates, make sure abs(index1 - index2) == 1
			// and index1 is a valid index (index2 doesn't have to be)
			function goalTemplateSwap(index1,index2) {
				if (Math.abs(index1 - index2) == 1) {
					if (index2 >= 0 && index2 < self.goalTemplates.length) {
						// swap data
						var tmp = self.goalTemplates[index1];
						self.goalTemplates[index1] = self.goalTemplates[index2];
						self.goalTemplates[index2] = tmp;
						GoalTemplateManager.save( self.goalTemplates );
						// setup UI
						var cs = $(".box_goal_templates").children();
						goalTemplateSetupUI(self.goalTemplates[index1],
											$(cs[index1]) );
						goalTemplateShow(cs[index1]);
						goalTemplateSetupUI(self.goalTemplates[index2],
											$(cs[index2]));
						goalTemplateShow(cs[index2]);
					}
				}
			}

			// for saving modification
			function goalTemplateSave(t) {
				var stypeRaw = $(".goal_type input",t).val();
				var stype = GoalTemplateManager.parseSType( stypeRaw );
				var mapRaw = $(".goal_map select",t).val();
				var map = mapRaw.split("-").map(function (x) { return parseInt(x,10); });
				var rankNum = parseInt($(".goal_rank select", t).val(), 10);
				var flagship = $(".goal_fs input", t).prop("checked");
				var mvp = $(".goal_mvp input", t).prop("checked");

				var obj = self.goalTemplates[t.index()];
				var result = {
					stype: stype,
					map: map,
					rank: rankNum,
					flagship: flagship,
					mvp: mvp };
				// use extend to make sure "enable" field is properly kept
				self.goalTemplates[t.index()] = $.extend(obj, result);
				GoalTemplateManager.save( self.goalTemplates );
			}

			function goalTemplateToggle(t) {
				var ind = t.index();
				var obj = self.goalTemplates[ind];
				obj.enable = ! obj.enable;
				GoalTemplateManager.save( self.goalTemplates );
				goalTemplateSetupUI( self.goalTemplates[ind], t);
			}

			// Goal Template Edit & Save button events
			$(".section_expcalc").on("click", ".goal_template .goal_edit", function() {
				var goalBox = $(this).parent().parent();
				goalTemplateEdit(goalBox);
			});

			$(".section_expcalc").on("click", ".goal_template .goal_save", function() {
				var goalBox = $(this).parent().parent();
				goalTemplateSave(goalBox);
				goalTemplateSetupUI(self.goalTemplates[ goalBox.index() ], goalBox);
				goalTemplateShow(goalBox);
			});

			$(".section_expcalc").on("click", ".goal_template .goal_rem", function() {
				var goalBox = $(this).parent().parent();
				goalTemplateRemove(goalBox);
			});


			$(".section_expcalc").on("click", ".goal_template .goal_up", function() {
				var goalBox = $(this).parent().parent();
				var ind = goalBox.index();
				goalTemplateSwap(ind, ind-1);
			});

			$(".section_expcalc").on("click", ".goal_template .goal_down", function() {
				var goalBox = $(this).parent().parent();
				var ind = goalBox.index();
				goalTemplateSwap(ind, ind+1);
			});

			$(".section_expcalc").on("click", ".goal_template .goal_onoff", function() {
				var goalBox = $(this).parent().parent();
				goalTemplateToggle(goalBox);
			});

			$(".section_expcalc").on("click", ".goal_template .goal_hl_coverage", function() {
				$(".box_control_line.line_close_to_remodel").hide();
				var goalBox = $(this).parent().parent();
				var stypes = self.goalTemplates[goalBox.index()].stype;
				// if there's an "Any" filter, don't proceed because
				// we will end up highlighting everything
				if (stypes.indexOf("*") != -1)
					return true;
				var stypeIds = GoalTemplateManager.mapShipTypeAbbrs2Ids(stypes);
				// traverse all ships, toggle "highlight" flag
				$(".section_body .ship_goal").each( function(i,x) {
					var jqObj = $(x);
					jqObj.removeClass(
						"highlight_stype " +
						"highlight_closeToRemodel " +
						"highlight_canBeRemodelled ");
					var rosterId = jqObj.data("id");
					var ThisShip = KC3ShipManager.get( rosterId );
					var MasterShip = ThisShip.master();
					var stypeId = MasterShip.api_stype;
					jqObj.toggleClass("highlight_stype", stypeIds.indexOf(stypeId) != -1);
				});
			});

			$(".section_expcalc").on("click", ".goal_template .goal_apply", function() {
				var goalBox = $(this).parent().parent();
				var template = self.goalTemplates[goalBox.index()];

				var targetShips = [];
				$(".section_expcalc .box_goals .ship_goal").each( function(i,x) {
					var jqObj = $(x);
					var rosterId = $(x).data("id");
					var ThisShip = KC3ShipManager.get( rosterId );
					var MasterShip = ThisShip.master();
					var stypeId = MasterShip.api_stype;

					if (GoalTemplateManager.checkShipType(stypeId, template))
						targetShips.push( {
							rosterId: rosterId,
							shipDesc:
							  ThisShip.name() + " Lv." + ThisShip.level +
								" (" + rosterId + ")"
						}  );
				});

				// build a dialog for confirmation
				var shipsStr = targetShips.map( function(x) { return x.shipDesc; }).join("\n");
				if (! confirm( "Applying template to following ship(s): \n" + shipsStr + "\nConfirm ?"))
					return true;

				$.each( targetShips, function(i,x) {
					console.debug("Target ship", JSON.stringify(x) );
					var grindData = self.goals["s" + x.rosterId];
					self.goals["s" + x.rosterId] =
						GoalTemplateManager.applyTemplate(grindData, template);
					self.save();
					self.recompute( x.rosterId );
				});
			});

			// inserting into existing templates
			$.each(this.goalTemplates, function(i,x) {
				var goalBox = $(".tab_expcalc .factory .goal_template").clone();
				goalTemplateSetupUI(self.goalTemplates[i], goalBox);
				goalTemplateShow(goalBox);

				goalBox.appendTo(".section_expcalc .box_goal_templates");
			});

			$(".section_expcalc .new_template a").on("click", function () {
				var goalBox = $(".tab_expcalc .factory .goal_template").clone();
				var dat = GoalTemplateManager.newTemplate();
				self.goalTemplates.push(dat);
				GoalTemplateManager.save( self.goalTemplates );
				goalTemplateSetupUI(dat, goalBox);
				goalTemplateShow(goalBox);
				goalBox.toggleClass("disabled", !dat.enable);
				goalBox.appendTo(".section_expcalc .box_goal_templates");
			});

			// TODO: prevent double click text selection?

			// Remove from Goals Button
			$(".section_expcalc").on("click", ".ship_rem", function(){
				editingBox = $(this).parent();

				var ShipRosterId = editingBox.data("id");
				var ThisShip = KC3ShipManager.get(ShipRosterId);
				var nextLevel = self.computeNextLevel( ThisShip.masterId, ThisShip.level );

				var curGoal = self.goals["s"+ ShipRosterId];
				// when the ship can still be remodelled further
				// and the current goal set is fewer than that,
				// we can ask user whether he wants to update the goal level
				// instead of removing this goal.
				if (nextLevel < KC3Ship.getMarriedLevel() - 1
					&& typeof curGoal !== "undefined"
					&& curGoal[0] < nextLevel) {

					var resp = confirm(
						"Would you like to change your leveling goal for " +
						ThisShip.name() + " (" + ShipRosterId + ") to level " +
						nextLevel + "?");
					if (resp) {
						self.goals["s"+ ShipRosterId][0] = nextLevel;
						self.save();
						self.recompute( ThisShip.rosterId );
						return true;
					}
				}

				delete self.goals["s"+ editingBox.data("id") ];
				self.save();

				$(".ship_value" , editingBox).show();
				$(".ship_input" , editingBox).hide();

				$(".ship_save", editingBox).hide();
				$(".ship_edit", editingBox).hide();
				$(".ship_rem", editingBox).hide();
				editingBox.addClass("inactive");

				// the only can when nextLevel === false is when your ship have reached Lv.max
				if (nextLevel === false) {
					editingBox.remove();
					return;
				}

				if (nextLevel < KC3Ship.getMarriedLevel() - 1) {
					$(".section_expcalc .box_recommend .clear").remove();
					editingBox.appendTo(".section_expcalc .box_recommend");
					$("<div />").addClass("clear").appendTo(".section_expcalc .box_recommend");
				} else {
					$(".section_expcalc .box_other .clear").remove();
					editingBox.appendTo(".section_expcalc .box_other");
					$("<div />").addClass("clear").appendTo(".section_expcalc .box_other");
				}
			});

			// Show all ship_save
			var goalBox;
			var shipClickFunc = function(e){
				KC3StrategyTabs.gotoTab("mstship", $(this).attr("alt"));
			};
			$.each(KC3ShipManager.list, function(index, ThisShip){
				if(!ThisShip.lock){ return true; }

				// Create the ship box
				goalBox = $(".tab_expcalc .factory .ship_goal").clone();
				goalBox.attr("id", "goalBox"+ThisShip.rosterId);
				goalBox.data("id", ThisShip.rosterId);

				// Icon and level, common for all categories
				$(".ship_icon img", goalBox).attr("src", KC3Meta.shipIcon(ThisShip.masterId) );
				$(".ship_icon img", goalBox).attr("alt", ThisShip.masterId );
				$(".ship_icon img", goalBox).click(shipClickFunc);
				$(".ship_icon img", goalBox).attr("title", ThisShip.name() + ' (' + ThisShip.rosterId + ')' );
				$(".ship_name", goalBox).text( ThisShip.name() );
				$(".ship_type", goalBox).text( ThisShip.stype() );
				$(".ship_lv .ship_value", goalBox).text( ThisShip.level );

				// If ship is already one of the current goals
				if(typeof self.goals["s"+ThisShip.rosterId] != "undefined"){
					$(".ship_edit", goalBox).show();
					$(".ship_rem", goalBox).show();
					goalBox.appendTo(".section_expcalc .box_goals");

					self.recompute( ThisShip.rosterId );
					return true;
				}

				goalBox.addClass("inactive");

				// If next remodel lvl is greater than current, add to recommendations
				var goalLevel = self.computeNextLevel( ThisShip.masterId, ThisShip.level );
				if (goalLevel === false)
					return true;

				$(".ship_target .ship_value", goalBox).text( goalLevel );
				var expLeft = KC3Meta.expShip(goalLevel)[1] - ThisShip.exp[0];
				$(".ship_exp .ship_value", goalBox).text( expLeft );
				if (goalLevel < KC3Ship.getMarriedLevel() - 1) {
					goalBox.appendTo(".section_expcalc .box_recommend");
					return true;
				} else {
					goalBox.appendTo(".section_expcalc .box_other");
					return true;
				}

			});

			//this.save();

			self.configSectionToggles();
			self.configHighlightToggles();
			$("<div />").addClass("clear").appendTo(".section_expcalc .box_recommend");
			$("<div />").addClass("clear").appendTo(".section_expcalc .box_other");
		},

		save: function(){
			localStorage.goals = JSON.stringify(this.goals);
		},

		recompute: function( rosterId ){
			var self = this;
			var goalBox = $("#goalBox"+rosterId);
			var grindData = this.goals["s"+rosterId];
			var ThisShip = KC3ShipManager.get( rosterId );
			var MasterShip = ThisShip.master();

			// This has just been added, no grinding data yet, initialize defaults
			if(grindData.length === 0){
				var goalLevel = self.computeNextLevel( ThisShip.masterId, ThisShip.level );
				// if we ever want to run "recompute" on any ship, that particular ship
				// should have already been added in this tab
				// (those locked but have not yet reached Lv max) in the first place.
				console.assert( goalLevel !== false, "targeting ship that has no goal?" );
				// As much as possible use arrays nowadays to shrink JSON size,
				// we might run out of the 5MB localStorage allocated for our app
				grindData = [
					/*0*/ goalLevel, // target level
					/*1*/ 1, // world
					/*2*/ 1, // map
					/*3*/ 1, // node
					/*4*/ 6, // E=1 D=2 C=3 B=4 A=5 S=6 SS=7
					/*5*/ 0, // flagship
					/*6*/ 0 // mvp
				];

				var i;
				for (i=0; i<self.goalTemplates.length; ++i) {
					var template = self.goalTemplates[i];
					if (template.enable &&
						GoalTemplateManager.checkShipType(MasterShip.api_stype, template)) {
						grindData = GoalTemplateManager.applyTemplate(grindData, template);
						break;
					}
				}

				this.goals["s"+ThisShip.rosterId] = grindData;
				this.save();
			}

			var shipGoal = KC3Calc.getShipLevelingGoal(ThisShip, grindData, this.goals);
			// Target level
			$(".ship_target .ship_value", goalBox).text( shipGoal.targetLevel );

			// Experience Left
			$(".ship_exp .ship_value", goalBox).text( shipGoal.expLeft );
			goalBox.toggleClass("goaled", shipGoal.expLeft <= 0);

			// Base Experience: MAP
			$(".ship_map .ship_value", goalBox).text( shipGoal.grindMap );

			// Exp Modifier: MVP
			$(".ship_mvp .ship_value", goalBox).text( shipGoal.isMvp ? "Yes" : "No" );
			$(".ship_mvp .ship_value", goalBox).toggleClass( "bool_no", !shipGoal.isMvp);

			// Exp Modifier: FLAGSHIP
			$(".ship_fs .ship_value", goalBox).text( shipGoal.isFlagship ? "Yes" : "No" );
			$(".ship_fs .ship_value", goalBox).toggleClass( "bool_no", !shipGoal.isFlagship);

			// Exp Modifier: RANK
			$(".ship_rank .ship_value", goalBox).text( shipGoal.battleRank );

			// RESULT: Battles Left
			$(".ship_result .ship_value", goalBox).text( shipGoal.battlesLeft );
		}

	};

})();
