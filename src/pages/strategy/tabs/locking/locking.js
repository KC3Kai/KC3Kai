(function(){
    "use strict";

    class KC3LockingDefinition extends KC3ShipListGrid {
        constructor() {
            super("locking");
        }

        /* INIT
        Prepares initial static data needed.
        ---------------------------------*/
        init() {
            this.defineSorters();
            this.showListRowCallback = this.showShipLockingRow;
            // Amount of locking tags depends on MO/EO settings of each event,
            // order and colors of tag texture see: main.js#BannerPlate.prototype._getTexture,
            // and please update `lockingTagConfigs` and `lockingTagColors` by themes in `fud_quarterly.json` file.
            // NOTE: texture ID and our color ID is 0-based index, but API property `sally` is 1-based.
            // SIDENOTE1: tag conds checking can be found in EventSortieCondition.prototype._check
            // SIDENOTE2: relationships between map gauge, boss edges and bgm ids can be found in BattleScene.TaskInit.prototype._showHpGauge /.prototype._playBGM
            const configs = KC3Meta.eventLockingTagConfigs();
            this.lockLimit = ConfigManager.sr_locktag_max || configs.maxTagAmount || 2;
            this.moLocks = ConfigManager.sr_locktag_mo || configs.moTagIds || [];
            this.eoLocks = ConfigManager.sr_locktag_eo || configs.eoTagIds || [];
            this.heartLockMode = 2;
            this.showShipLevel = true;
            this.scrollFixed = true;
            this.currentTab = "all";
        }

        /* RELOAD
        Loads latest player or game data if needed.
        ---------------------------------*/
        reload() {
            KC3ShipManager.load();
            KC3GearManager.load();
            this.loadShipLockPlan();
            this.prepareFilters();
            this.prepareShipList(true, this.mapShipLockingStatus);
        }

        /* EXECUTE
        Places data onto the interface from scratch.
        ---------------------------------*/
        execute() {
            this.tab = $(".tab_locking");
            this.addLockBoxes();
            this.loadLockModeColors();
            $(".map_area, .ships_area", $(".lock_modes")).empty();
            this.fillLockBoxes();
            this.setDroppable();
            this.switchToLockTab(this.currentTab);
            let startTime = Date.now();
            $(".selectTab", this.tab).on("click", (e) => {
                const newTab = $(e.currentTarget).data("tab");
                if (!!newTab && newTab !== this.currentTab) {
                    this.switchToLockTab(newTab);
                }
            });
            $(".clearAllPlans", this.tab).on("click", this.clearAllPlannedLocks.bind(this));
            $(".toggleShipLevel", this.tab).on("click", (e) => {
                this.showShipLevel = !this.showShipLevel;
                $(".ships_area .lship .level", this.tab).toggle(this.showShipLevel);
            });
            $(".ships_area .lship .level", this.tab).toggle(this.showShipLevel);
            $(".toggleFixedScroll", this.tab).on("click", (e) => {
                this.scrollFixed = !this.scrollFixed;
                $(".vscroll", this.tab).toggleClass("scroll_fix", this.scrollFixed);
                if (this.scrollFixed) this.adjustHeight();
            });
            $(".vscroll", this.tab).toggleClass("scroll_fix", this.scrollFixed);

            this.shipListDiv = $(".ship_list", this.tab);
            this.shipListDiv.on("preShow", () => {
                $(".filters input").each((_, elem) => { elem.disabled = true; });
                startTime = Date.now();
            });
            this.shipListDiv.on("postShow", ()=> {
                $(".filters input").each((_, elem) => { elem.disabled = false; });
                this.adjustHeight();
                // Defer another adjustment because at this timing new version chrome still hide dom (fail to get element's size and offset)
                setTimeout(() => {
                    this.switchToLockTab(this.currentTab);
                    this.adjustHeight();
                }, Date.now() - startTime);
            });
            this.shipRowTemplateDiv = $(".factory .ship_item", this.tab);
            this.addFilterUI();
            this.showListGrid();
            $(".ship_header .ship_stat img").each((_, img) => {
                $(img).attr("src", KC3Meta.statIcon($(img).parent().data("type")));
            });
            this.shipListHeaderDiv = $(".ship_header .ship_field.hover", this.tab);
            this.registerShipListHeaderEvent(this.shipListHeaderDiv);
            this.shipListHeaderDiv.on("click", (e) => {
                $(".ship_header .ship_field.hover.sorted").removeClass("sorted");
                $(e.currentTarget).addClass("sorted");
            });
            this.shipListDiv.on("click", ".ship_item .ship_sally", (e) => {
                const ship = this.getShipById($(e.currentTarget)
                    .closest(".ship_item").data("ship_id"));
                if (ship.sally === 0) {
                    this.switchPlannedLock(ship);
                }
            });
        }

        addLockBoxes() {
            const lockModesDiv = $(".lock_modes", this.tab);
            let currentTab = $('<div class="tabs"></div>').appendTo(lockModesDiv);
            for (let i = 0; i < this.lockLimit; i++) {
                const lockBox = $(".factory .lock_mode", this.tab).clone();
                lockBox.addClass("lock_mode_" + (i + 1));
                $(".drop_area", lockBox).attr("data-boxId", i);
                lockBox.appendTo(currentTab);
                if (this.moLocks.includes(i) || !this.eoLocks.length) {
                    lockBox.addClass("lock_mo");
                }
                if (this.eoLocks.includes(i) || !this.moLocks.length) {
                    lockBox.addClass("lock_eo");
                }
            }
            this.currentTab = "all";
            // No tabbed boxes needed, hide all control buttons
            if (!this.moLocks.length || !this.eoLocks.length) {
                this.currentTab = "all";
                $(".selectTab.tab_all", this.tab).hide();
                $(".selectTab.tab_mo", this.tab).hide();
                $(".selectTab.tab_eo", this.tab).hide();
            }
        }

        switchToLockTab(newTab) {
            this.currentTab = newTab;
            $(".selectTab", this.tab).addClass("bscolor3");
            $(".selectTab.tab_" + this.currentTab, this.tab).removeClass("bscolor3").addClass("bscolor1");
            if (this.currentTab === "all") {
                $('.lock_mode', this.tab).show();
            } else {
                const lockTypeClass = 'lock_' + this.currentTab;
                $('.lock_mode', this.tab).hide();
                $(`.lock_mode.${lockTypeClass}`, this.tab).show();
            }
            this.loadLockModeColors();
            this.adjustHeight();
        }

        clearAllPlannedLocks() {
            if (!confirm(KC3Meta.term("LockingPlannerClearLocksConfirm"))) return;
            localStorage.removeItem("lock_plan");
            $(".ships_area .plannedlock", this.tab).remove();
            this.shipList.forEach(ship => {
                $(".ship_sally", ship.row).removeClass("lock_mode_" + (ship.lockPlan + 1));
                delete ship.lockPlan;
            });
            $(".ship_sally", this.shipListDiv).removeClass("lock_plan");
            this.resetShipLockPlan();
            this.adjustHeight();
        }

        setStyleVar(name, value) {
            // set vars to parent element `planner_area` for sharing with children
            const plannerNativeStyle = $(".planner_area", this.tab).get(0).style;
            plannerNativeStyle.removeProperty(name);
            plannerNativeStyle.setProperty(name, value);
        }

        loadLockModeColors() {
            const tagColors = KC3Meta.eventLockingTagColors(ConfigManager.sr_theme);
            tagColors.forEach((color, i) => {
                this.setStyleVar(`--lockColor${i + 1}`, color);
            });
            // try to auto adjust lock mode box width and margin
            const lockTypeClass = 'lock_' + this.currentTab;
            const tabLockCount = this.currentTab === "all"
                ? this.lockLimit
                : $(".tab_locking .lock_modes .tabs" + ` .${lockTypeClass}`).length;
            const tabLockContainerWidth = $(".tab_locking .lock_modes").width();
            const tabLockFixedWidth = [670, 670, 310, 220, 160, 130, 100, 90, 70, 70][tabLockCount] || 70;
            const tabLockAutoWidth = Math.max(70, Math.floor(tabLockContainerWidth / tabLockCount) - 5);
            this.setStyleVar(`--lockModeWidth`, (tabLockContainerWidth > 800 ? tabLockAutoWidth : tabLockFixedWidth) + "px");
        }

        adjustHeight() {
            this.setStyleVar("--shipListOffsetTop",
                $(".ship_list", this.tab).offset().top + "px");
            this.updateLockCount();
        }

        mapShipLockingStatus(shipObj) {
            const mappedObj = this.defaultShipDataMapping(shipObj);
            const shipMaster = shipObj.master();
            const shipNakedStats = shipObj.nakedStats();
            Object.assign(mappedObj, {
                hp: shipObj.hp[1],
                sally: shipObj.sally,
                // [master maxed, master init + modded, current with equipment stats]
                fp: [shipMaster.api_houg[1], shipMaster.api_houg[0] + shipObj.mod[0], shipObj.fp[0] ],
                tp: [shipMaster.api_raig[1], shipMaster.api_raig[0] + shipObj.mod[1], shipObj.tp[0] ],
                yasen:[shipMaster.api_houg[1] + shipMaster.api_raig[1],
                    shipMaster.api_houg[0] + shipObj.mod[0] + shipMaster.api_raig[0] + shipObj.mod[1],
                    shipObj.fp[0] + shipObj.tp[0]
                ],
                aa: [shipMaster.api_tyku[1], shipMaster.api_tyku[0] + shipObj.mod[2], shipObj.aa[0] ],
                ar: [shipMaster.api_souk[1], shipMaster.api_souk[0] + shipObj.mod[3], shipObj.ar[0] ],
                // [maxed with leveling, naked current, current with equipment stats]
                as: [shipObj.as[1], shipNakedStats.as, shipObj.as[0] ],
                ev: [shipObj.ev[1], shipNakedStats.ev, shipObj.ev[0] ],
                ls: [shipObj.ls[1], shipNakedStats.ls, shipObj.ls[0] ],
                // [maxed modded, current + modded, dupe, master init]
                lk: [shipObj.lk[1], shipObj.lk[0], shipObj.lk[0], shipMaster.api_luck[0]],

                slotCount: shipMaster.api_slot_num,
                slotMaxSize: shipMaster.api_maxeq,
                exSlot: shipObj.ex_item,

                canEquipDaihatsu: shipObj.canEquipDaihatsu(),
                canEquipTank: shipObj.canEquipTank(),
                canEquipFCF: shipObj.canEquipFCF()
            });

            this.lockPlans.forEach((tagPlan, tagId) => {
                if (tagPlan.indexOf(mappedObj.id) !== -1)
                    mappedObj.lockPlan = tagId;
            });

            return mappedObj;
        }

        fillLockBoxes() {
            const compareShips = (a, b) => a.sortId - b.sortId || b.level - a.level || a.id - b.id;
            this.shipList.sort(compareShips);
            this.shipList.forEach(ship => {
                if (ship.sally !== 0) {
                    this.addShipToBox(ship.sally - 1, ship);
                }
            });
            this.lockPlans = this.lockPlans.map((ids, tag) => {
                if (!ids.length) {
                    return [];
                }
                const ships = this.shipList.filter(ship => ids.includes(ship.id) && ship.sally === 0);
                ships.sort(compareShips);
                ships.forEach(ship => this.addShipToBox(tag, ship));
                return ships.map(ship => ship.id);
            });
            this.updateLockCount();
        }

        defineSorters() {
            this.defaultSorterDefinitions();
            const define = this.defineSimpleSorter.bind(this);
            define("sally", "LockingTag",   ship =>
                -ship.sally || -((ship.lockPlan === undefined ? -1 : ship.lockPlan) + 1) || ship.id);
            define("hp",    "MaxHp",        ship => -ship.hp);
            define("fp",    "FirePower",    ship => -ship.fp[1 + (this.filterValues.equipStats & 1)]);
            define("tp",    "Torpedo",      ship => -ship.tp[1 + (this.filterValues.equipStats & 1)]);
            define("aa",    "AntiAir",      ship => -ship.aa[1 + (this.filterValues.equipStats & 1)]);
            define("ar",    "Armor",        ship => -ship.ar[1 + (this.filterValues.equipStats & 1)]);
            define("as",    "AntiSubmarine",ship => -ship.as[1 + (this.filterValues.equipStats & 1)]);
            define("ev",    "Evasion",      ship => -ship.ev[1 + (this.filterValues.equipStats & 1)]);
            define("ls",    "LineOfSight",  ship => -ship.ls[1 + (this.filterValues.equipStats & 1)]);
            define("lk",    "Luck",         ship => -ship.lk[1]);
            define("yasen", "Yasen",        ship => -ship.yasen[1 + (this.filterValues.equipStats & 1)]);
        }

        showShipLockingRow(ship, shipRow) {
            shipRow.data("ship_id", ship.id);
            ship.row = shipRow;

            if(ship.sally !== 0){
                $(".ship_field.ship_sally", shipRow).text(ship.sally)
                    .addClass("lock_mode_" + ship.sally);
            } else {
                const icon = $(".ship_icon", shipRow);
                shipRow.draggable({
                    helper: () => icon.clone().addClass("ship_icon_dragged").appendTo(".planner_area"),
                    revert: "invalid",
                    containment: $(".planner_area"),
                    cursor: "move",
                    cursorAt: { left: 18, top: 18 }
                });

                if(ship.lockPlan !== undefined){
                    $(".ship_field.ship_sally", shipRow)
                        .text("")
                        .addClass("lock_mode_" + (ship.lockPlan + 1))
                        .addClass("lock_plan");
                }
            }

            ["hp","fp","tp","aa","ar","as","ev","ls","lk","yasen"].forEach(stat => {
                const statVal = ship[stat];
                const el = $(`.ship_stat.ship_${stat}`, shipRow);

                if(Array.isArray(statVal)) {
                    // 0: maxed modded, 1: naked + modded, 2: with equipment
                    $(".stat_value", el).text(statVal[1 + (this.filterValues.equipStats & 1)]);
                    el.toggleClass("max", statVal[1] >= statVal[0]);
                } else {
                    $(".stat_value", el).text(statVal);
                }

                // for mod-able stats, modded value: [1] - [0]
                if(["tp","fp","aa","ar","yasen"].includes(stat) && statVal[0] > statVal[1]) {
                    $(".stat_left", el).text(`+${statVal[0] - statVal[1]}`);
                } else {
                    $(".stat_left", el).hide();
                }
                // for luck value, 0: maxed modded, 1: current, 2: current again, 3: master init
                if(stat === "lk" && statVal[1] > statVal[3] && statVal[1] < statVal[0]) {
                    $("sup", el).text(statVal[1] - statVal[3]);
                } else {
                    $("sup", el).hide();
                }
            });

            [0,1,2,3,4].forEach(i => {
                this.showEquipSlot(shipRow, i + 1, ship.slotCount,
                    ship.slotMaxSize[i], ship.slots[i], ship.equip[i]);
            });
            // for ex-slot, although it's hidden
            this.showEquipSlot(shipRow, 6, ship.slotCount, 0, 0, ship.exSlot);
        }

        showEquipSlot(rowElem, index, slotCount, slotMaxSize, slotCurrentSize, equipId) {
            const element = $(".ship_equip_" + (index > 5 ? "ex" : index), rowElem);
            const isShowCurrent = !!this.filterValues.equipIcons;
            if(equipId > 0 && isShowCurrent) {
                const gear = KC3GearManager.get(equipId);
                if(gear.exists()) {
                    $("img", element)
                        .attr("src", KC3Meta.itemIcon(gear.master().api_type[3]))
                        .attr("alt", gear.master().api_id)
                        .click(this.gearClickFunc)
                        .error(function() {
                            $(this).unbind("error").attr("src", "/assets/img/ui/empty.png");
                        });
                    $("span", element).hide();
                    element.addClass("hover");
                } else {
                    equipId = 0;
                }
            }
            if(equipId <= 0 || !isShowCurrent) {
                $("img", element).hide();
                const slotSize = isShowCurrent ? slotCurrentSize : slotMaxSize;
                $("span", element).text(slotSize).toggle(slotMaxSize > 0);
                element.toggleClass("slot_open", index <= slotCount);
            }
            if(slotCount > 4) element.parent().addClass("slot5");
            // hide ex-slot or closed-slot elements
            if(index > slotCount) element.hide();
        }

        addFilterUI() {
            // Ship type
            $.each(KC3Meta.sortedStypes(), (i, stype) => {
                if(stype.id && stype.order < 999) {
                    const elm = $(".factory .ship_filter_type", this.tab).clone()
                        .appendTo(".tab_locking .filters .ship_types");
                    elm.data("id", stype.id);
                    $("input[type='checkbox']", elm).attr("id", "shipType_" + stype.id)
                        .data("typeId", stype.id);
                    $("label", elm).attr("for", "shipType_" + stype.id);
                    $(".filter_name label", elm).text(stype.name);
                }
            });

            // Speed
            $(".ship_filter_speed", this.tab).empty();
            [KC3Meta.term("LockingPlannerFilterSpeedAll"), KC3Meta.term("LockingPlannerFilterSpeedSlow"),
             KC3Meta.term("LockingPlannerFilterSpeedFast+")].forEach((speed, i) => {
                const elm = $(".factory .ship_filter_radio", this.tab).clone()
                    .appendTo(".tab_locking .filters .ship_filter_speed");
                $("input[type='radio']", elm).val(i).attr("name", "filter_speed")
                    .attr("id", "filter_speed_" + i);
                $("label", elm).text(speed).attr("for", "filter_speed_" + i);
                if(i === 0) $("input[type='radio']", elm)[0].checked = true;
            });

            // Daihatsu/Amphibious Tank
            [KC3Meta.term("LockingPlannerFilterCanEquipAll"), KC3Meta.term("LockingPlannerFilterCanEquipDaihatsu"),
             KC3Meta.term("LockingPlannerFilterCanEquipDaihatsuOnly"), KC3Meta.term("LockingPlannerFilterCanEquipTank"),
             KC3Meta.term("LockingPlannerFilterCanEquipTankOnly"), KC3Meta.term("LockingPlannerFilterCanEquipBoth"),
             KC3Meta.term("LockingPlannerFilterCanEquipEither"), KC3Meta.term("LockingPlannerFilterCanEquipNeither"),
             KC3Meta.term("LockingPlannerFilterCanEquipFcf")].forEach((val, i) => {
                const elm = $(".factory .ship_filter_radio", this.tab).clone()
                    .appendTo(".tab_locking .filters .ship_filter_daihatsu");
                $("input[type='radio']", elm).val(i).attr("name", "filter_daihatsu")
                    .attr("id", "filter_daihatsu_" + i);
                $("label", elm).text(val).attr("for", "filter_daihatsu_" + i);
                if(i === 0) $("input[type='radio']", elm)[0].checked = true;
            });

            // Hide tag locked (not heart-locked)
            let elm = $(".factory .ship_filter_checkbox", this.tab).clone()
                .appendTo(".tab_locking .filters .ship_filter_taglocked");
            $("input[type='checkbox']", elm).attr("id", "taglocked");
            $(".filter_name label", elm).attr("for", "taglocked").text(KC3Meta.term("LockingPlannerFilterLockedHide"));

            // Equip stats
            elm = $(".factory .ship_filter_checkbox", this.tab).clone()
                .appendTo(".tab_locking .filters .ship_filter_equipstats");
            $("input[type='checkbox']", elm).attr("id", "equipstats");
            $(".filter_name label", elm).attr("for", "equipstats").text(KC3Meta.term("LockingPlannerFilterEquipStats"));
            // Equip icons
            elm = $(".factory .ship_filter_checkbox", this.tab).clone()
                .appendTo(".tab_locking .filters .ship_filter_equipicons");
            $("input[type='checkbox']", elm).attr("id", "equipicons");
            $(".filter_name label", elm).attr("for", "equipicons").text(KC3Meta.term("LockingPlannerFilterEquipIcons"));
            // Ex-slot opened
            elm = $(".factory .ship_filter_checkbox", this.tab).clone()
                .appendTo(".tab_locking .filters .ship_filter_exslotopen");
            $("input[type='checkbox']", elm).attr("id", "exslotopen");
            $(".filter_name label", elm).attr("for", "exslotopen").text(KC3Meta.term("LockingPlannerFilterEquipExslot"));

            this.updateFilters();

            $(".filters", this.tab).change(() => {
                this.updateFilters();
                this.showListGrid();
            });
        }

        updateFilters() {
            this.filterValues = {
                speed : Number($("input[name='filter_speed']:checked", this.tab).val()),
                daihatsu : Number($("input[name='filter_daihatsu']:checked", this.tab).val()),
                tagLocked : $(".filters .ship_filter_taglocked input[type='checkbox']", this.tab)
                    .prop("checked"),
                equipStats : $(".filters .ship_filter_equipstats input[type='checkbox']", this.tab)
                    .prop("checked"),
                equipIcons : $(".filters .ship_filter_equipicons input[type='checkbox']", this.tab)
                    .prop("checked"),
                exslotOpen : $(".filters .ship_filter_exslotopen input[type='checkbox']", this.tab)
                    .prop("checked"),
                stypes : $(".filters .ship_types input[type='checkbox']:checked", this.tab)
                    .toArray().map( el => Number($(el).data("typeId")) )
            };
        }

        prepareFilters() {
            this.defineSimpleFilter("speed", [], 0,
                (filterDef, ship) => {
                    return (this.filterValues.speed === 0)
                        || (this.filterValues.speed === 1 && ship.speed < 10)
                        || (this.filterValues.speed === 2 && ship.speed >= 10);
                }
            );
            this.defineSimpleFilter("daihatsu", [], 0,
                (filterDef, ship) => {
                    return (this.filterValues.daihatsu === 0)
                        || (this.filterValues.daihatsu === 1 && ship.canEquipDaihatsu)
                        || (this.filterValues.daihatsu === 2 && ship.canEquipDaihatsu && !ship.canEquipTank)
                        || (this.filterValues.daihatsu === 3 && ship.canEquipTank)
                        || (this.filterValues.daihatsu === 4 && !ship.canEquipDaihatsu && ship.canEquipTank)
                        || (this.filterValues.daihatsu === 5 && ship.canEquipDaihatsu && ship.canEquipTank)
                        || (this.filterValues.daihatsu === 6 && (ship.canEquipDaihatsu || ship.canEquipTank))
                        || (this.filterValues.daihatsu === 7 && !(ship.canEquipDaihatsu || ship.canEquipTank))
                        || (this.filterValues.daihatsu === 8 && ship.canEquipFCF);
                }
            );
            this.defineSimpleFilter("tagLocked", [], 0,
                (filterDef, ship) => {
                    return (!this.filterValues.tagLocked)
                        || (this.filterValues.tagLocked && !ship.sally);
                }
            );
            this.defineSimpleFilter("exslotOpen", [], 0,
                (filterDef, ship) => {
                    return (this.filterValues.exslotOpen && (ship.exSlot > 0 || ship.exSlot === -1))
                        || (!this.filterValues.exslotOpen);
                }
            );

            this.defineSimpleFilter("shipType", [], 0,
                (filterDef, ship) => {
                    return (this.filterValues.stypes.length === 0)
                        || (this.filterValues.stypes.indexOf(ship.stype) !== -1);
                }
            );
        }

        loadShipLockPlan() {
            if (localStorage.lock_plan !== undefined) {
                this.lockPlans = JSON.parse(localStorage.lock_plan);
                // Add insufficient & remove overflow, guarantee = `this.lockLimit`
                while (this.lockPlans.length < this.lockLimit) {
                    this.lockPlans.push([]);
                }
                if (this.lockPlans.length > this.lockLimit)
                    this.lockPlans.length = this.lockLimit;
            } else {
                this.resetShipLockPlan();
            }
        }

        resetShipLockPlan() {
            this.lockPlans = [];
            for (let i = 0; i < this.lockLimit; i++)
                this.lockPlans.push([]);
        }

        saveShipLockPlan(){
            localStorage.lock_plan = JSON.stringify(this.lockPlans);
        }

        /**
         * Drag & drop area
         */
        addShipToBox(boxIndex, ship) {
            $(`.ships_area div[data-rosterid='${ship.id}']`, this.tab).remove();
            const shipBox = $(".tab_locking .factory .lship").clone()
                .appendTo(`.tab_locking .lock_mode_${boxIndex + 1} .ships_area`);

            $("img", shipBox).attr("src", KC3Meta.shipIcon(ship.masterId));
            $(".level", shipBox).text(ship.level).toggle(this.showShipLevel);
            shipBox.data("ship_id", ship.id);
            shipBox.attr("data-rosterid", ship.id );
            shipBox.attr("data-boxcolorid", boxIndex);
            shipBox.attr("title", "{1:name} {2:stype} Lv.{3:level} (#{0:id})"
                .format(ship.id, ship.name, KC3Meta.stype(ship.stype), ship.level)
            ).lazyInitTooltip();
            if(ship.sally) {
                shipBox.addClass("gamelocked");
                shipBox.off("dblclick");
            } else {
                shipBox.addClass("plannedlock");
                shipBox.on("dblclick", () => {this.cleanupPlannedLock(ship);} );
                shipBox.draggable({
                    revert: (valid) => {
                        if(!valid) this.cleanupPlannedLock(ship);
                    },
                    containment: $(".planner_area"),
                    cursor: "move",
                    start: (e, ui) => {
                        $(e.target).tooltip("disable");
                        $(".level", e.target).hide();
                    }
                });
            }
        }

        switchPlannedLock(ship, index) {
            if(index === undefined) {
                index = ship.lockPlan !== undefined ? ship.lockPlan : -1;
                if( ++index >= this.lockLimit) {
                    return this.cleanupPlannedLock(ship);
                }
            }
            this.addShipToBox(index, ship);
            this.lockPlans.forEach((tagPlan, tagId) => {
                this.lockPlans[tagId] = tagPlan.filter(shipInPlanId => shipInPlanId !== ship.id);
            });
            this.lockPlans[index].push(ship.id);
            this.fastUpdateLockPlan(ship, index);
            this.saveShipLockPlan();
            this.adjustHeight();
        }

        cleanupPlannedLock(ship) {
            $(".ship_sally", ship.row).removeClass("lock_plan lock_mode_" + (ship.lockPlan + 1));
            this.lockPlans[ship.lockPlan] = this.lockPlans[ship.lockPlan]
                .filter(shipInPlanId => shipInPlanId !== ship.id);
            delete ship.lockPlan;
            this.saveShipLockPlan();
            $(`.ships_area div[data-rosterid='${ship.id}']`, this.tab).remove();
            this.adjustHeight();
        }

        getShipById(id) {
            return this.shipList.filter( ship => ship.id === id )[0];
        }

        setDroppable() {
            const dropEventFunc = (event, ui) => {
                const ship = this.getShipById(ui.draggable.data("ship_id"));
                const boxIndex = $(".drop_area", $(event.target)).data("boxid");
                this.switchPlannedLock(ship, boxIndex);
            };
            $(".lock_mode").droppable({
                accept: ".ship_item,.lship",
                addClasses: false,
                drop: dropEventFunc
            });
        }

        fastUpdateLockPlan(ship, newLockPlan) {
            if(ship.lockPlan !== undefined)
                $(".ship_sally", ship.row).removeClass("lock_mode_" + (ship.lockPlan + 1));

            $(".ship_sally", ship.row).addClass("lock_plan")
                .text("").addClass("lock_mode_" + (newLockPlan + 1));
            ship.lockPlan = newLockPlan;
        }

        updateLockCount() {
            $(".lock_mode").each((_, lock) => {
                const total = $(".ships_area > .lship", lock).length;
                const planned = $(".ships_area > .lship.plannedlock", lock).length;
                $(".ship_count", lock).text("{0} /{1}".format(planned, total));
            });
        }

    }

    KC3StrategyTabs.locking = new KC3StrategyTab("locking");
    KC3StrategyTabs.locking.definition = new KC3LockingDefinition();

})();
