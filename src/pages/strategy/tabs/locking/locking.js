(function(){
    "use strict";

    class KC3LockingDefinition extends KC3ShipListGrid{
        constructor() {
            super("locking");
            this.lock_limit = 5;
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
                $(".filters input").each((_, elem) => elem.disabled = true);
            });
            this.shipListDiv.on("postShow", ()=> {
                $(".filters input").each((_, elem) => elem.disabled = false);
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
            this.shipListDiv.on("click",".ship_item .ship_sally", (e) => {
                const ship = this.getShipById($(e.currentTarget)
                    .closest(".ship_item").data("ship_id"));
                if (ship.sally === 0) {
                    this.switchPlannedLock(ship);
                }
            });
        }

        addLockBoxes(){
            for (let i = 0; i < this.lock_limit; i++) {
                let cElm = $(".factory .lock_mode", this.tab).clone().appendTo(".tab_locking .lock_modes");
                cElm.addClass("lock_mode_" + (i + 1));
                $(".drop_area", cElm).attr("data-boxId", i);
            }
        }

        clearAllPlannedLocks(){
            localStorage.removeItem("lock_plan");
            $(".ships_area .plannedlock", this.tab).remove();
            this.shipList.forEach(ship => {
                $(".ship_sally", ship.row).removeClass("lock_mode_" + (ship.lock_plan+1));
                delete ship.lock_plan;
            });
            $(".ship_sally", this.shipListDiv).removeClass("lock_plan");
            this.resetShipLockPlan();
            this.adjustHeight();
        }

        adjustHeight(){
            $(".ship_list, .filters", this.tab)
                .css("height","calc( 100vh - " + $(".ship_list", this.tab).offset().top + "px - 5px )");
        }

        addFilterUI(){
            // ship type
            for(let idx in KC3Meta._stype){
                if(KC3Meta._stype[idx] && ["12", "15"].indexOf(idx) < 0){
                    let cElm = $(".factory .ship_filter_type", this.tab).clone().appendTo(".tab_locking .filters .ship_types");
                    cElm.data("id", idx);
                    $("input[type='checkbox']",cElm).attr("id","shipType_"+idx).data("typeId",idx);
                    $("label",cElm).attr("for","shipType_"+idx);
                    $(".filter_name label", cElm).text(KC3Meta.stype(idx));
                }
            }

            // Speed
            $(".ship_filter_speed", this.tab).empty();
            ["All","Slow","Fast"].forEach((speed, i) => {
                let cElm = $(".factory .ship_filter_radio", this.tab).clone().appendTo(".tab_locking .filters .ship_filter_speed");
                $("input[type='radio']",cElm).val(i).attr("name","filter_speed").attr("id","filter_speed_"+i);
                $("label",cElm).text(speed).attr("for","filter_speed_"+i);
                if(i===0) $("input[type='radio']",cElm)[0].checked=true;
            });

            // Daihatsu
            ["-","Capable","Incapable"].forEach((val, i) => {
                let cElm = $(".factory .ship_filter_radio", this.tab).clone().appendTo(".tab_locking .filters .ship_filter_daihatsu");
                $("input[type='radio']",cElm).val(i).attr("name","filter_daihatsu").attr("id","filter_daihatsu_"+i);
                $("label",cElm).text(val).attr("for","filter_daihatsu_"+i);
                if(i===0) $("input[type='radio']",cElm)[0].checked=true;
            });

            this.updateFilters();

            $(".filters", this.tab).change(() => {
                this.updateFilters();
                this.showListGrid();
            });
        }

        mapShipLockingStatus(shipObj) {
            const mappedObj = this.defaultShipDataMapping(shipObj);
            const shipMaster = shipObj.master();
            Object.assign(mappedObj, {
                hp: shipObj.hp[1],
                sally: shipObj.sally,

                fp: [shipMaster.api_houg[1], shipMaster.api_houg[0]+shipObj.mod[0], shipObj.fp[0] ],
                tp: [shipMaster.api_raig[1], shipMaster.api_raig[0]+shipObj.mod[1], shipObj.tp[0] ],
                yasen:[shipMaster.api_houg[1] + shipMaster.api_raig[1],
                    shipMaster.api_houg[0]+shipObj.mod[0] + shipMaster.api_raig[0]+shipObj.mod[1],
                    shipObj.fp[0] + shipObj.tp[0]
                ],
                aa: [shipMaster.api_tyku[1], shipMaster.api_tyku[0]+shipObj.mod[2], shipObj.aa[0] ],
                ar: [shipMaster.api_souk[1], shipMaster.api_souk[0]+shipObj.mod[3], shipObj.ar[0] ],
                as: [this.getDerivedStatNaked("tais", shipObj.as[0], shipObj), shipObj.as[0] ],
                ev: [this.getDerivedStatNaked("houk", shipObj.ev[0], shipObj), shipObj.ev[0] ],
                ls: [this.getDerivedStatNaked("saku", shipObj.ls[0], shipObj), shipObj.ls[0] ],
                lk: [shipObj.lk[1], shipObj.lk[0], shipMaster.api_luck[0]],
                exSlot: shipObj.ex_item,

                canEquipDaihatsu: shipObj.canEquipDaihatsu()
            });

            this.lock_plan.forEach((tagPlan, tagId) => {
                if (tagPlan.indexOf(mappedObj.id) !== -1)
                    mappedObj.lock_plan = tagId;
            });

            return mappedObj;
        }

        fillLockBoxes(){
            this.shipList.forEach(ship => {
                if (ship.sally !== 0) {
                    this.addShipToBox(ship.sally - 1, ship);
                }
            });
            this.lock_plan.forEach((shipIds, tag) => {
                shipIds.forEach(shipId => {
                    this.shipList.forEach(ship => {
                        if(ship.id === shipId && ship.sally === 0){
                            this.addShipToBox(tag, ship);
                        }
                    });
                });
            });
        }

        getDerivedStatNaked(StatName, EquippedValue, ShipObj){
            const Items = ShipObj.equipment(true);
            for(let ctr in Items){
                if(!Items.hasOwnProperty(ctr))
                    continue;
                if(Items[ctr].itemId > 0){
                    EquippedValue -= Items[ctr].master()["api_"+StatName];
                }
            }
            return EquippedValue;
        }

        defineSorters() {
            this.defaultSorterDefinitions();
            const define = this.defineSimpleSorter.bind(this);
            define("sally", "Sally",        ship => -ship.sally);
            define("hp",    "MaxHp",        ship => -ship.hp);
            define("fp",    "FirePower",    ship => -ship.fp[1]);
            define("tp",    "Torpedo",      ship => -ship.tp[1]);
            define("aa",    "AntiAir",      ship => -ship.aa[1]);
            define("ar",    "Armor",        ship => -ship.ar[1]);
            define("as",    "AntiSubmarine",ship => -ship.as[1]);
            define("ev",    "Evasion",      ship => -ship.ev[1]);
            define("ls",    "LineOfSight",  ship => -ship.ls[1]);
            define("lk",    "Luck",         ship => -ship.lk[1]);
            define("yasen", "Yasen",        ship => -ship.yasen[1]);
        }

        showShipLockingRow(ship, shipRow) {
            shipRow.data("ship_id", ship.id);
            ship.row = shipRow;

            if(ship.sally!==0){
                $(".ship_field.ship_sally", shipRow).text(ship.sally).addClass("lock_mode_"+ship.sally);
            } else {
                const icon = $(".ship_icon", shipRow);
                icon.draggable({
                    helper: ()=>icon.clone().addClass("ship_icon_dragged").appendTo(".planner_area"),
                    revert: "invalid",
                    containment: $(".planner_area")
                });

                if(typeof ship.lock_plan !=="undefined"){
                    $(".ship_field.ship_sally", shipRow)
                        .text("")
                        .addClass("lock_mode_"+(ship.lock_plan+1))
                        .addClass("lock_plan");
                }
            }

            ["hp","fp","tp","aa","ar","as","ev","ls","lk","yasen"].forEach(stat => {
                const statVal = ship[stat];
                const el = $(`.ship_stat.ship_${stat}`,shipRow);

                if(typeof statVal !== "object")
                    el.text(statVal);
                else
                    el.text(statVal[1]).toggleClass("max", statVal[1] >= statVal[0]);

                if(["tp","fp","aa","ar","yasen"].indexOf(stat)!==-1 && statVal[0]!==statVal[1]){
                    el.append(`<span>+${statVal[0]-statVal[1]}</span>`);
                }
                if(stat==="lk" && statVal[1] > statVal[2]){
                    el.append(`<sup class='sub'>${statVal[1]-statVal[2]}</sup>`);
                }
            });

            [0,1,2,3].forEach(i => {
                this.equipImg(shipRow, i + 1, ship.slots[i], ship.equip[i]);
            });
        }

        equipImg(cElm, equipNum, equipSlot, gearId){
            const element = $(".ship_equip_" + equipNum, cElm);
            $("img", element).hide();
            $("span", element).each((_, e) => {
                if(equipSlot > 0)
                    $(e).text(equipSlot);
                else if(equipSlot === -2)
                // for ex slot opened, but not equipped
                    $(e).addClass("empty");
                else
                    $(e).css('visibility','hidden');
            });
        }

        updateFilters(){
            this.filterValues ={
                Speed : Number($("input[name='filter_speed']:checked", this.tab).val()),
                Daihatsu : Number($("input[name='filter_daihatsu']:checked", this.tab).val()),
                Types : $(".filters .ship_types input[type='checkbox']:checked", this.tab).toArray().map((el)=>Number($(el).data("typeId")))
            };
        }

        prepareFilters(){
            this.defineSimpleFilter("speed", [], 0,
                (index, ship) => {
                    return (this.filterValues.Speed === 0)
                        || (this.filterValues.Speed === 1 && ship.speed<10)
                        || (this.filterValues.Speed === 2 && ship.speed>=10);
                }
            );
            this.defineSimpleFilter("daihatsu", [], 0,
                (index, ship) => {
                    return (this.filterValues.Daihatsu === 0)
                        || (this.filterValues.Daihatsu === 1 && ship.canEquipDaihatsu)
                        || (this.filterValues.Daihatsu === 2 && !ship.canEquipDaihatsu);
                }
            );

            this.defineSimpleFilter("ship_type", [], 0,
                (index, ship) => {
                    return (this.filterValues.Types.length === 0)
                        || (this.filterValues.Types.indexOf(ship.stype) !== -1);
                }
            );
        }

        loadShipLockPlan() {
            if (typeof localStorage.lock_plan !== "undefined")
                this.lock_plan = JSON.parse(localStorage.lock_plan);
            else
                this.resetShipLockPlan();
        }

        resetShipLockPlan() {
            this.lock_plan = [];
            for (let i = 0; i < this.lock_limit; i++)
                this.lock_plan.push([]);
        }

        saveShipLockPlan(){
            localStorage.lock_plan = JSON.stringify(this.lock_plan);
        }

        /**
         * Drag & drop
         */
        addShipToBox(boxIndex, ship){
            $(".ships_area div[data-rosterid='"+ship.id+"']", this.tab).remove();
            const shipBox = $(".tab_locking .factory .lship").clone()
                .appendTo(".tab_locking .lock_mode_"+(boxIndex+1)+" .ships_area");

            $("img", shipBox).attr("src", KC3Meta.shipIcon(ship.masterId));
            shipBox.attr("data-rosterid", ship.id );
            shipBox.attr("data-boxcolorid", boxIndex);
            shipBox.attr("title", ship.name+" Lv."+ship.level+" ("+KC3Meta.stype(ship.stype)+")" );
            if(ship.sally){
                shipBox.addClass("gamelocked");
            } else {
                shipBox.addClass("plannedlock");
                shipBox.dblclick(() => {this.cleanupPlannedLock(ship);} );
            }
        }

        switchPlannedLock(ship, index){
            if(index === undefined) {
                index = typeof ship.lock_plan !== "undefined" ? ship.lock_plan : -1;
                if( ++index >= this.lock_limit){
                    return this.cleanupPlannedLock(ship);
                }
            }
            this.addShipToBox(index, ship);
            this.lock_plan.forEach((tagPlan, tagId) => {
                this.lock_plan[tagId] = tagPlan.filter(shipInPlanId => shipInPlanId !== ship.id);
            });
            this.lock_plan[index].push(ship.id);
            this.fastUpdateLockPlan(ship, index);
            this.saveShipLockPlan();
            this.adjustHeight();
        }

        cleanupPlannedLock(ship){
            $(".ship_sally",ship.row).removeClass("lock_plan lock_mode_"+(ship.lock_plan+1));
            this.lock_plan[ship.lock_plan] = this.lock_plan[ship.lock_plan]
                .filter(shipInPlanId => shipInPlanId !== ship.id);
            delete ship.lock_plan;
            this.saveShipLockPlan();
            $(".ships_area div[data-rosterid='" + ship.id + "']", this.tab).remove();
            this.adjustHeight();
        }

        getShipById(id){
            return this.shipList.filter( ship => ship.id === id )[0];
        }

        setDroppable(){
            $(".drop_area")
                .droppable({
                    accept: ".ship_icon",
                    addClasses: false,
                    drop: (event, ui)=>{
                        const ship = this.getShipById(ui.draggable.closest(".ship_item").data("ship_id"));
                        const boxIndex = $(event.target).data("boxid");
                        this.switchPlannedLock(ship,boxIndex);
                    }
                });
        }

        fastUpdateLockPlan(ship, new_lock_plan){
            if(typeof ship.lock_plan !== "undefined")
                $(".ship_sally",ship.row).removeClass("lock_mode_" + (ship.lock_plan+1));

            $(".ship_sally",ship.row).addClass("lock_plan").text("").addClass("lock_mode_"+(new_lock_plan+1));
            ship.lock_plan = new_lock_plan;
        }
    }

    KC3StrategyTabs.locking = new KC3StrategyTab("locking");
    KC3StrategyTabs.locking.definition = new KC3LockingDefinition();
})();