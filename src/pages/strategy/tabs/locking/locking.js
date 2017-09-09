(function(){
    "use strict";

    class KC3LockingDefinition extends KC3ShipListGrid {
        constructor() {
            super("locking");
            this.lockLimit = 5;
        }

        /* INIT
        Prepares initial static data needed.
        ---------------------------------*/
        init() {
            this.defineSorters();
            this.showListRowCallback = this.showShipLockingRow;
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
            this.addLockBoxes();
            $(".map_area, .ships_area", $(".lock_modes")).empty();
            this.fillLockBoxes();
            this.setDroppable();
            
            this.tab = $(".tab_locking");
            $(".clearAllPlans", this.tab).on("click", this.clearAllPlannedLocks.bind(this));
            
            this.shipListDiv = $(".ship_list", this.tab);
            this.shipListDiv.on("preShow", () => {
                $(".filters input").each((_, elem) => { elem.disabled = true; });
            });
            this.shipListDiv.on("postShow", ()=> {
                $(".filters input").each((_, elem) => { elem.disabled = false; });
                this.adjustHeight();
            });
            this.shipRowTemplateDiv = $(".factory .ship_item", this.tab);
            this.addFilterUI();
            this.showListGrid();
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
            for (let i = 0; i < this.lockLimit; i++) {
                const cElm = $(".factory .lock_mode", this.tab).clone()
                    .appendTo(".tab_locking .lock_modes");
                cElm.addClass("lock_mode_" + (i + 1));
                $(".drop_area", cElm).attr("data-boxId", i);
            }
        }

        clearAllPlannedLocks() {
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

        adjustHeight() {
            $(".ship_list, .filters", this.tab)
                .css("height", "calc( 100vh - " + $(".ship_list", this.tab).offset().top + "px - 5px )");
        }

        mapShipLockingStatus(shipObj) {
            const mappedObj = this.defaultShipDataMapping(shipObj);
            const shipMaster = shipObj.master();
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
                as: [shipObj.as[1], shipObj.nakedStats("as"), shipObj.as[0] ],
                ev: [shipObj.ev[1], shipObj.nakedStats("ev"), shipObj.ev[0] ],
                ls: [shipObj.ls[1], shipObj.nakedStats("ls"), shipObj.ls[0] ],
                // [maxed modded, current + modded, dupe, master init]
                lk: [shipObj.lk[1], shipObj.lk[0], shipObj.lk[0], shipMaster.api_luck[0]],
                exSlot: shipObj.ex_item,

                canEquipDaihatsu: shipObj.canEquipDaihatsu()
            });

            this.lockPlans.forEach((tagPlan, tagId) => {
                if (tagPlan.indexOf(mappedObj.id) !== -1)
                    mappedObj.lockPlan = tagId;
            });

            return mappedObj;
        }

        fillLockBoxes() {
            this.shipList.forEach(ship => {
                if (ship.sally !== 0) {
                    this.addShipToBox(ship.sally - 1, ship);
                }
            });
            this.lockPlans.forEach((shipIds, tag) => {
                shipIds.forEach(shipId => {
                    this.shipList.forEach(ship => {
                        if(ship.id === shipId && ship.sally === 0) {
                            this.addShipToBox(tag, ship);
                        }
                    });
                });
            });
        }

        defineSorters() {
            this.defaultSorterDefinitions();
            const define = this.defineSimpleSorter.bind(this);
            define("sally", "Sally",        ship => -ship.sally);
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
                    cursor: "pointer",
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
                    el.text(statVal[1 + (this.filterValues.equipStats & 1)])
                        .toggleClass("max", statVal[1] >= statVal[0]);
                } else {
                    el.text(statVal);
                }

                // for mod-able stats, modded value: [1] - [0]
                if(["tp","fp","aa","ar","yasen"].indexOf(stat) !== -1 && statVal[0] !== statVal[1]) {
                    el.append(`<span>+${statVal[0] - statVal[1]}</span>`);
                }
                // for luck value, 0: maxed modded, 1: current, 2: current again, 3: master init
                if(stat === "lk" && statVal[1] > statVal[3] && statVal[1] < statVal[0]) {
                    el.append(`<sup class='sub'>${statVal[1] - statVal[3]}</sup>`);
                }
            });

            [0,1,2,3].forEach(i => {
                this.equipSlot(shipRow, i + 1, ship.slots[i], ship.equip[i]);
            });
        }

        equipSlot(cElm, equipNum, equipSlot, gearId) {
            const element = $(".ship_equip_" + equipNum, cElm);
            $("img", element).hide();
            $("span", element).each((_, e) => {
                if(equipSlot > 0)
                    $(e).text(equipSlot);
                else
                    $(e).hide();
            });
        }

        addFilterUI() {
            // Ship type
            KC3Meta._stype.forEach((stype, i) => {
                if(stype && [12, 15].indexOf(i) === -1) {
                    const elm = $(".factory .ship_filter_type", this.tab).clone()
                        .appendTo(".tab_locking .filters .ship_types");
                    elm.data("id", i);
                    $("input[type='checkbox']", elm).attr("id", "shipType_" + i)
                        .data("typeId", i);
                    $("label", elm).attr("for", "shipType_" + i);
                    $(".filter_name label", elm).text(stype);
                }
            });

            // Speed
            $(".ship_filter_speed", this.tab).empty();
            ["All", "Slow", "Fast+"].forEach((speed, i) => {
                const elm = $(".factory .ship_filter_radio", this.tab).clone()
                    .appendTo(".tab_locking .filters .ship_filter_speed");
                $("input[type='radio']", elm).val(i).attr("name", "filter_speed")
                    .attr("id", "filter_speed_"+i);
                $("label", elm).text(speed).attr("for", "filter_speed_" + i);
                if(i === 0) $("input[type='radio']", elm)[0].checked = true;
            });

            // Daihatsu
            ["---", "Capable", "Incapable"].forEach((val, i) => {
                const elm = $(".factory .ship_filter_radio", this.tab).clone()
                    .appendTo(".tab_locking .filters .ship_filter_daihatsu");
                $("input[type='radio']", elm).val(i).attr("name", "filter_daihatsu")
                    .attr("id", "filter_daihatsu_" + i);
                $("label", elm).text(val).attr("for", "filter_daihatsu_" + i);
                if(i === 0) $("input[type='radio']", elm)[0].checked = true;
            });

            // Hide tag locked (not heart locked)
            let elm = $(".factory .ship_filter_checkbox", this.tab).clone()
                .appendTo(".tab_locking .filters .ship_filter_taglocked");
            $("input[type='checkbox']", elm).attr("id", "taglocked");
            $(".filter_name label", elm).attr("for", "taglocked").text("Locked");

            // Equip stats
            elm = $(".factory .ship_filter_checkbox", this.tab).clone()
                .appendTo(".tab_locking .filters .ship_filter_equipstats");
            $("input[type='checkbox']", elm).attr("id", "equipstats");
            $(".filter_name label", elm).attr("for", "equipstats").text("Stats");

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
                stypes : $(".filters .ship_types input[type='checkbox']:checked", this.tab)
                    .toArray().map( el => Number($(el).data("typeId")) )
            };
        }

        prepareFilters() {
            this.defineSimpleFilter("speed", [], 0,
                (index, ship) => {
                    return (this.filterValues.speed === 0)
                        || (this.filterValues.speed === 1 && ship.speed < 10)
                        || (this.filterValues.speed === 2 && ship.speed >= 10);
                }
            );
            this.defineSimpleFilter("daihatsu", [], 0,
                (index, ship) => {
                    return (this.filterValues.daihatsu === 0)
                        || (this.filterValues.daihatsu === 1 && ship.canEquipDaihatsu)
                        || (this.filterValues.daihatsu === 2 && !ship.canEquipDaihatsu);
                }
            );
            this.defineSimpleFilter("tagLocked", [], 0,
                (index, ship) => {
                    return (!this.filterValues.tagLocked)
                        || (this.filterValues.tagLocked && !ship.sally);
                }
            );

            this.defineSimpleFilter("shipType", [], 0,
                (index, ship) => {
                    return (this.filterValues.stypes.length === 0)
                        || (this.filterValues.stypes.indexOf(ship.stype) !== -1);
                }
            );
        }

        loadShipLockPlan() {
            if (localStorage.lock_plan !== undefined)
                this.lockPlans = JSON.parse(localStorage.lock_plan);
            else
                this.resetShipLockPlan();
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
            $(".ships_area div[data-rosterid='" + ship.id + "']", this.tab).remove();
            const shipBox = $(".tab_locking .factory .lship").clone()
                .appendTo(".tab_locking .lock_mode_" + (boxIndex + 1) + " .ships_area");

            $("img", shipBox).attr("src", KC3Meta.shipIcon(ship.masterId));
            shipBox.attr("data-rosterid", ship.id );
            shipBox.attr("data-boxcolorid", boxIndex);
            shipBox.attr("title", "{0:name} Lv.{1:level} ({2:stype})"
                .format(ship.name, ship.level, KC3Meta.stype(ship.stype))
            );
            if(ship.sally) {
                shipBox.addClass("gamelocked").removeClass("hover");
                shipBox.off("click");
            } else {
                shipBox.addClass("plannedlock");
                shipBox.on("click", () => {this.cleanupPlannedLock(ship);} );
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
            $(".ships_area div[data-rosterid='" + ship.id + "']", this.tab).remove();
            this.adjustHeight();
        }

        getShipById(id) {
            return this.shipList.filter( ship => ship.id === id )[0];
        }

        setDroppable() {
            $(".drop_area").droppable({
                accept: ".ship_item",
                addClasses: false,
                drop: (event, ui) => {
                    const ship = this.getShipById(ui.draggable.data("ship_id"));
                    const boxIndex = $(event.target).data("boxid");
                    this.switchPlannedLock(ship, boxIndex);
                }
            });
        }

        fastUpdateLockPlan(ship, newLockPlan) {
            if(ship.lockPlan !== undefined)
                $(".ship_sally", ship.row).removeClass("lock_mode_" + (ship.lockPlan + 1));

            $(".ship_sally", ship.row).addClass("lock_plan")
                .text("").addClass("lock_mode_" + (newLockPlan + 1));
            ship.lockPlan = newLockPlan;
        }
    }

    KC3StrategyTabs.locking = new KC3StrategyTab("locking");
    KC3StrategyTabs.locking.definition = new KC3LockingDefinition();

})();
