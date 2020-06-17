/**
 * CalculatorManager.js exported to window.KC3Calc.
 *
 * A collection or facade of calculation methods implemented by KC3改,
 * to simulate KC game mechanism, client hard-coded behaviors, server-side only
 * calculations without API result, or just some convenience methods.
 *
 * Lite methods collected here suggested to be general purpose, multi relationships
 * and done within one or few functions.
 *
 * Basic calculation logics related to specific class are located in their corresponding Object definition,
 * such as Fleet, Ship, Gear, LandBase.
 *
 * Complex logic functions will be broken into individual modules or objects:
 * @see BattlePrediction - analyses battle API data and simulates the battle results in advance;
 * @see AntiAir - estimates Anti-Air power and AACI types based on Ship's equipment, Fleet compos, etc;
 * @see WhoCallsTheFleetDB - estimates more stats of Ship or Gear based on a well updated static database;
 * @see AkashiRepair - simulates Akashi Anchorage Repair timer, estimates amount of HP recovering;
 */
(function(){
    "use strict";

    /**
     * Get fighter power text from 1 or more fleet(s), especially served for Combined Fleet.
     *
     * @param {Object} viewFleet - Fleet object currently being viewed, default 1st fleet.
     * @param {Object} escortFleet - Fleet object of escort for Combined Fleet, default 2nd fleet.
     * @param {boolean} isCombined - if current view is really Combined Fleet view, default false.
     * @return {string} fighter power text, formation according config: `air_formula`.
     * @see Fleet.fighterPowerText similar function only served for Fleet object.
     * @see Fleet.fighterVeteran
     * @see Fleet.fighterBounds
     * @see Fleet.fighterPower
     */
    const getFleetsFighterPowerText = (
            viewFleet = PlayerManager.fleets[0],
            escortFleet = PlayerManager.fleets[1],
            isCombined = false) => {
        var mainFleet = viewFleet;
        if(isCombined) { // force to 1st fleet if combined
            mainFleet = viewFleet = PlayerManager.fleets[0];
        }
        switch(ConfigManager.air_formula) {
            case 2:
                return "\u2248" + (
                    isCombined && ConfigManager.air_combined ?
                    mainFleet.fighterVeteran() + escortFleet.fighterVeteran() :
                    viewFleet.fighterVeteran());
            case 3:
                const mainBounds = mainFleet.fighterBounds();
                const escortBounds = escortFleet.fighterBounds();
                return  (isCombined && ConfigManager.air_combined ?
                        mainBounds[0] + escortBounds[0] : mainBounds[0])
                        + "~" +
                        (isCombined && ConfigManager.air_combined ?
                        mainBounds[1] + escortBounds[1] : mainBounds[1]);
            default:
                return isCombined && ConfigManager.air_combined ?
                    mainFleet.fighterPower() + escortFleet.fighterPower() :
                    viewFleet.fighterPower();
        }
    };

    /**
     * Build contact chance rates tooltip text from 1 or more fleet(s).
     * @param {Object} viewFleet - Fleet object currently being viewed, default 1st fleet.
     * @param {Object} escortFleet - Fleet object of escort for Combined Fleet, default 2nd fleet.
     * @param {boolean} isCombined - if current view is really Combined Fleet view, default false.
     * @param {number} planeSelectionTopN - how many planes to be listed for selection phase.
     * @return built html string.
     * @see Fleet.contactChanceInfo
     */
    const buildFleetsContactChanceText = (
            viewFleet = PlayerManager.fleets[0],
            escortFleet = PlayerManager.fleets[1],
            isCombined = false,
            planeSelectionTopN = 5) => {
        var mainFleet = viewFleet;
        if(isCombined) { // force to 1st fleet if combined
            mainFleet = viewFleet = PlayerManager.fleets[0];
        }
        const iconStyles = {
            "width":"13px", "height":"13px",
            "margin-top":"-3px", "margin-right":"2px"
        };
        let contact = viewFleet.contactChanceInfo();
        if(isCombined && ConfigManager.air_combined) {
            // combine contact info from two fleets
            const main = contact;
            const escort = escortFleet.contactChanceInfo();
            // only trigger rate can be summed
            const combined = {
                trigger: main.trigger + escort.trigger,
            };
            // ship position + 6 for escort fleet
            escort.planes.forEach(p => {p.shipOrder += 6;});
            combined.planes = main.planes.concat(escort.planes);
            // resort based on both fleets
            combined.planes.sort((a, b) => b.accurcy - a.accurcy || a.shipOrder - b.shipOrder);
            // recompute failure rate and success rate
            combined.cancelled = combined.planes.map(p => p.rate).reduce((acc, v) => acc * (1 - v), 1);
            combined.success = Math.min(combined.trigger, 1.0) * (1.0 - combined.cancelled);
            contact = combined;
        }
        let planeListHtml = "";
        if(contact.planes.length) {
            const topN = Math.min(contact.planes.length, planeSelectionTopN);
            for(let idx = 0; idx < topN; idx++) {
                const p = contact.planes[idx];
                planeListHtml += "#{0}\u2003"
                    .format(1 + idx);
                planeListHtml += $("<img />")
                    .attr("src", KC3Meta.shipIcon(p.shipMasterId))
                    .css(iconStyles)
                    .css("image-rendering", "auto")
                    .css("object-fit", "cover")
                    .prop("outerHTML");
                planeListHtml += $("<img />").attr("src", KC3Meta.itemIcon(p.icon))
                    .css(iconStyles).prop("outerHTML");
                planeListHtml += '<span style="color:#45a9a5">\u2605{0}</span>\u2003'
                    .format(p.stars);
                planeListHtml += "{0}%"
                    .format(Math.qckInt("floor", p.rate * 100, 1));
                if(idx < topN - 1) planeListHtml += "\n";
            }
            if(contact.planes.length > planeSelectionTopN) planeListHtml += "\n...";
            planeListHtml = KC3Meta.term("PanelAirContactPlanes")
                .format(planeSelectionTopN, planeListHtml);
        }
        let text = KC3Meta.term("PanelAirContactTip").format(
            KC3Meta.airbattle(1)[2] || "",
            Math.qckInt("floor", contact.success * 100, 1),
            Math.qckInt("floor", contact.trigger * 100, 1),
            Math.qckInt("ceil", contact.cancelled * 100, 1),
            planeListHtml
        );
        return $("<p></p>")
            .css("font-size", "11px")
            .html(text)
            .prop("outerHTML");
    };

    /**
     * Build open airstrike power tooltip text from 1 or more fleet(s).
     * @param {Object} viewFleet - Fleet object currently being viewed, default 1st fleet.
     * @param {Object} escortFleet - Fleet object of escort for Combined Fleet, default 2nd fleet.
     * @param {boolean} isCombined - if current view is really Combined Fleet view, default false.
     * @return built html string.
     * @see Fleet.airstrikePower
     */
    const buildFleetsAirstrikePowerText = (
            viewFleet = PlayerManager.fleets[0],
            escortFleet = PlayerManager.fleets[1],
            isCombined = false) => {
        var mainFleet = viewFleet;
        if(isCombined) { // force to 1st fleet if combined
            mainFleet = viewFleet = PlayerManager.fleets[0];
        }
        const battleConds = collectBattleConditions();
        const contactPlaneId = battleConds.contactPlaneId;
        const isContact = contactPlaneId > 0;
        const forJetAssault = false;
        // Known combined fleet airstrike modifier applied to normal player fleet vs enemy combined only,
        // against enemy main fleet -10, against escort fleet -20.
        // But impossible to assume our aircraft totally attack which enemy fleet...
        const combinedFleetMod = 0;
        const normalPower = mainFleet.airstrikePower(combinedFleetMod, forJetAssault, contactPlaneId);
        let criticalPower = null;
        if(ConfigManager.powerCritical) {
            criticalPower = mainFleet.airstrikePower(combinedFleetMod, forJetAssault, contactPlaneId, true);
        }
        if(isCombined && ConfigManager.air_combined) {
            const escortFleetPower = escortFleet.airstrikePower(combinedFleetMod, forJetAssault, contactPlaneId);
            normalPower[0] += escortFleetPower[0];
            normalPower[1] += escortFleetPower[1];
            normalPower[2] = normalPower[2] || escortFleetPower[2];
            if(ConfigManager.powerCritical) {
                const escortFleetCritical = escortFleet.airstrikePower(combinedFleetMod, forJetAssault, contactPlaneId, true);
                criticalPower[0] += escortFleetCritical[0];
                criticalPower[1] += escortFleetCritical[1];
                criticalPower[2] = criticalPower[2] || escortFleetCritical[2];
            }
        }
        // critical power array represents total values if critical triggered by all attackers,
        // so max possible range should be {0}(weakest) ~ {3}(strongest)
        const formatPowerRange = (pow, critical) => (critical ?
            (pow[2] ? "{0}({2})~{1}({3})" : "{0}({2})") :
            (pow[2] ? "{0}~{1}" : "{0}")).format(
                pow[0], pow[1], ...(critical || [])
            );
        const text = KC3Meta.term("PanelAirStrikeTip")
            .format(formatPowerRange(normalPower, criticalPower),
                isContact ? KC3Meta.term("BattleContact") : "");
        return $("<p></p>")
            .css("font-size", "11px")
            .html(text)
            .prop("outerHTML");
    };

    /**
     * Collect battle conditions from current battle node if available.
     * Do not fall-back to default value here if not available, leave it to appliers.
     * @return an object contains battle properties we concern at.
     */
    const collectBattleConditions = () => {
        const currentNode = KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP() ?
                KC3SortieManager.currentNode() : {};
        const isOnBattle = !!currentNode.stime;
        const playerCombinedFleetType = PlayerManager.combinedFleet;
        const isEnemyCombined = currentNode.enemyCombined;
        const rawApiData = currentNode.battleNight || currentNode.battleDay || {};
        const apiFormation = rawApiData.api_formation || [];
        // extract raw value from KCSAPI result because values in Node are translated
        const engagementId = apiFormation[2];
        const formationId = apiFormation[0];
        const enemyFormationId = apiFormation[1];
        const airBattleId = Object.getSafePath(currentNode.battleDay, "api_kouku.api_stage1.api_disp_seiku");
        const contactPlaneId = currentNode.fcontactId;
        const isStartFromNight = currentNode.startsFromNight;
        const playerFlarePos = currentNode.flarePos;
        const enemyFlarePos = currentNode.eFlarePos;
        return {
            isOnBattle,
            engagementId,
            formationId,
            enemyFormationId,
            airBattleId,
            contactPlaneId,
            playerCombinedFleetType,
            isEnemyCombined,
            isStartFromNight,
            playerFlarePos,
            enemyFlarePos
        };
    };

    /**
     * @return total resupply cost of all land bases.
     * @see PlayerManager.bases
     * @see LandBase.calcResupplyCost
     */
    const getLandBasesResupplyCost = () => {
        const total = {fuel: 0, ammo: 0, steel: 0, bauxite: 0};
        $.each(PlayerManager.bases, (i, base) => {
            const cost = base.calcResupplyCost();
            Object.keys(total).map(k => { total[k] += cost[k]; });
        });
        return total;
    };

    /**
     * @return total cost on sortie of all land bases set to sortie.
     * @see PlayerManager.bases
     * @see LandBase.calcSortieCost
     */
    const getLandBasesSortieCost = () => {
        const total = {fuel: 0, ammo: 0, steel: 0, bauxite: 0};
        $.each(PlayerManager.bases, (i, base) => {
            if(base.action === 1) {
                var cost = base.calcSortieCost();
                Object.keys(total).map(k => { total[k] += cost[k]; });
            }
        });
        return total;
    };

    /**
     * @return {number} the worst cond value [1, 3] of all land bases which are set to sortie.
     * @see PlayerManager.bases
     * @see LandBase.worstCond
     */
    const getLandBasesWorstCond = () => {
        var worst = 1;
        $.each(PlayerManager.bases, (i, base) => {
            if(base.action === 1) {
                worst = Math.max(worst, base.worstCond());
            }
        });
        return worst;
    };

    /**
     * @return {boolean} is all available land bases get resupplied.
     * @see PlayerManager.bases
     * @see LandBase.isPlanesSupplied
     */
    const isLandBasesSupplied = () => {
        return PlayerManager.bases.every(base => base.isPlanesSupplied());
    };

    /**
     * @return {number} the fighter power modifier dependent on how many high-altitude interceptors on defense mode, capped at 3
     * @see https://cdn.discordapp.com/attachments/208624431818342400/620539904694288395/lbas_tables_swdn.png
     */
    const getLandBaseHighAltitudeModifier = (world) => {
        return [0.5, 0.8, 1.1, 1.2][PlayerManager.bases
            .filter(base => base.map === world && base.action === 2)
            .reduce((acc, base) => acc + base.getHighAltitudeInterceptorCount(), 0)
        ] || 1.2;
    };

    /**
     * Get battle opponent's fighter power only based on master data.
     *
     * @param {Array}  enemyFleetShips - master ID array of opponent fleet ships.
     * @param {Array[]} enemyShipSlots - master ID array of equip slots, optional.
     *                                   length should be the same with enemyFleetShips.
     * @param {Array[]} enemySlotSizes - capacities of equip slots, optional, same length either.
     * @param {boolean} forLbas - specify true if power for LBAS battle requested.
     * @return {Array} a tuple contains [
     *           computed fighter power (without improvement and proficiency bonus),
     *           sum of known slot capacity,
     *           sum of slot capacity without air power,
     *           sum of slot capacity with recon planes equipped,
     *           exception map indicates which ship or gear missing required data:
     *             {shipId: null || {gearId: null || aaStat || 'recon'}}
     *         ]
     * @see Fleet, Ship, Gear classes to compute fighter power of player fleet.
     */
    const enemyFighterPower = (enemyFleetShips, enemyShipSlots, enemySlotSizes, forLbas) => {
        var totalPower = false;
        var totalCapacity = 0;
        var noAirPowerCapacity = 0;
        var reconCapacity = 0;
        const exceptions = {};
        // no ship IDs
        if(!enemyFleetShips) {
            exceptions.ship = null;
            return [totalPower, totalCapacity, exceptions];
        }
        $.each(enemyFleetShips, (shipIdx, shipId) => {
            // ignore -1 placeholder
            if(!shipId || shipId < 0) {
                return;
            }
            const shipMst = KC3Master.isAbyssalShip(shipId) ?
                KC3Master.abyssalShip(shipId, true) : KC3Master.ship(shipId);
            // no ship master data
            if(!shipMst) {
                exceptions[shipId] = null;
                return;
            }
            let shipSlots = (enemyShipSlots || [])[shipIdx] || shipMst.kc3_slots;
            // no slot gear IDs
            if(!Array.isArray(shipSlots)) {
                exceptions[shipId] = {};
                return;
            }
            // mainly remove -1 placeholders
            shipSlots = shipSlots.filter(id => id > 0);
            for(let slotIdx = 0; slotIdx < shipSlots.length; slotIdx++) {
                const gearId = shipSlots[slotIdx];
                const gearMst = KC3Master.slotitem(gearId);
                // no gear master data
                if(!gearMst) {
                    exceptions[shipId] = exceptions[shipId] || {};
                    exceptions[shipId][gearId] = null;
                    continue;
                }
                // for LBAS battle, recon planes participate, and their fighter power may be counted
                if(KC3GearManager.antiAirFighterType2Ids.includes(gearMst.api_type[2])
                    || (!!forLbas && KC3GearManager.landBaseReconnType2Ids.includes(gearMst.api_type[2]))) {
                    const aaStat = gearMst.api_tyku || 0;
                    const capacity = ((enemySlotSizes || [])[shipIdx] || shipMst.api_maxeq || [])[slotIdx];
                    if(capacity !== undefined) {
                        if(aaStat > 0) {
                            totalCapacity += capacity;
                            totalPower += Math.floor(Math.sqrt(capacity) * aaStat);
                        } else {
                            noAirPowerCapacity += capacity;
                        }
                    } else {
                        // no slot maxeq (capacity)
                        exceptions[shipId] = exceptions[shipId] || {};
                        exceptions[shipId][gearId] = aaStat;
                    }
                } else if(gearMst.api_type[1] === 7) {
                    // sum recon planes not participate in normal air battle but LBAS battle,
                    // seaplane fighters/bombers will not be dropped here
                    const capacity = ((enemySlotSizes || [])[shipIdx] || shipMst.api_maxeq || [])[slotIdx];
                    if(capacity !== undefined) {
                        reconCapacity += capacity;
                    } else {
                        exceptions[shipId] = exceptions[shipId] || {};
                        exceptions[shipId][gearId] = "recon";
                    }
                }
            }
        });
        return [totalPower, totalCapacity, noAirPowerCapacity, reconCapacity, exceptions];
    };

    /**
     * @param {number} basicPower - basic fighter power calculated by #enemyFighterPower
     * @return {Array} fighter power intervals array including [basic power, AD power, AP power, AS power, AS+ power].
     */
    const fighterPowerIntervals = (basicPower = false) => {
        return [basicPower,
            Math.round(basicPower / 3),
            Math.round(2 * basicPower / 3),
            Math.round(3 * basicPower / 2),
            3 * basicPower
        ];
    };

    /**
     * Get leveling goal data for specific ship, which defined at Strategy Room Leveling page.
     *
     * @param {Object} shipObj - KC3Ship instance
     * @param {Array} shipGoalConfig - leveling goal config for the ship, will fetch from all configs if omitted.
     * @param {Object} allGoalsConfig - all configs of all goals, will fetch from localStorage if omitted.
     * @param {number} expJustGained - ship exp just gained from a battle result screen.
     *                  Because ship exp data has not yet been updated,
     *                  so we need to add it to get the correct current exp.
     * @return {Object} calculated and converted data object explains defined leveling goal.
     *          will return a pseudo instance if no goal defined for the ship.
     * @see expcalc.js where defines ship leveling goal config array and manage all ship configs.
     */
    const getShipLevelingGoal = (shipObj,
            shipGoalConfig,
            allGoalsConfig = localStorage.getObject("goals"),
            expJustGained = 0) => {
        const goalResult = {
            targetLevel: undefined,
            expLeft: undefined,
            battlesLeft: Infinity
        };
        const shipGoal = Array.isArray(shipGoalConfig) ? shipGoalConfig :
            (allGoalsConfig || {})["s" + (shipObj || {}).rosterId];
        if(shipObj && shipObj.exists() && shipGoal) {
            goalResult.shipRoster = shipObj.rosterId;
            goalResult.shipMaster = shipObj.masterId;
            goalResult.targetLevel = shipGoal[0];
            goalResult.expLeft = KC3Meta.expShip(goalResult.targetLevel)[1] - (shipObj.exp[0] + expJustGained);
            goalResult.grindMap = [shipGoal[1], shipGoal[2]].join('-');
            goalResult.baseExpPerBattles = KC3Meta.mapExp(shipGoal[1], shipGoal[2]);
            goalResult.battleRank = ["F", "E", "D", "C", "B", "A", "S", "SS" ][shipGoal[4]] || "F";
            goalResult.rankModifier = [0, 0.5, 0.7, 0.8, 1, 1, 1.2][shipGoal[4]] || 0;
            goalResult.isFlagship = shipGoal[5] === 1;
            goalResult.flagshipModifier = goalResult.isFlagship ? 1.5 : 1;
            goalResult.isMvp = shipGoal[6] === 1;
            goalResult.baseExp = shipGoal[7] || 0;
            goalResult.mvpModifier = goalResult.isMvp ? 2 : 1;
            goalResult.expPerBattles = (shipGoal[7] || goalResult.baseExpPerBattles)
                * goalResult.rankModifier
                * goalResult.flagshipModifier
                * goalResult.mvpModifier;
            goalResult.battlesLeft = Math.ceil(goalResult.expLeft / goalResult.expPerBattles);
        }
        return goalResult;
    };

    /**
     * Calculates the timestamp of next in-game Quest/PvP/RankPtCutOff reset.
     * @param {number} now - timestamp of 'now', current timestamp by default.
     * @return {Object} an Object contains timestamp of {quest, pvp, rank, quarterly}.
     */
    const nextResetsTimestamp = (now = Date.now()) => {
        // Next Quest reset time (UTC 2000 / JST 0500)
        const utc8pm = new Date(now),
            utc6am = new Date(now), utc6pm = new Date(now);
        utc8pm.setUTCHours(20, 0, 0, 0);
        if(utc8pm.getTime() < now) utc8pm.shiftDate(1);
        // Next Quarterly Quests reset time
        const quarterlyUtc8pm = KC3QuestManager.repeatableTypes.quarterly.calculateNextReset(now);
        // Next PvP reset time (UTC 1800,0600 / JST 0300,1500)
        utc6am.setUTCHours(6, 0, 0, 0);
        utc6pm.setUTCHours(18, 0, 0, 0);
        if(utc6am.getTime() < now) utc6am.shiftDate(1);
        if(utc6pm.getTime() < now) utc6pm.shiftDate(1);
        const nextPvPstamp = Math.min(utc6am.getTime(), utc6pm.getTime());
        // Next Rank points cut-off time (-1 hour from PvP reset time)
        //   extra cut-off monthly on JST 2200, the last day of every month,
        //   but points from quest Z cannon not counted after JST 1400.
        let nextPtCutoff = new Date(nextPvPstamp);
        nextPtCutoff.shiftHour(-1);
        if(nextPtCutoff.getTime() < now) nextPtCutoff.shiftHour(13);
        if(nextPtCutoff.getMonth() > new Date(now).getMonth()
            || nextPtCutoff.getFullYear() > new Date(now).getFullYear()) {
            nextPtCutoff.setUTCHours(13, 0, 0, 0);
            if(nextPtCutoff.getTime() < now) {
                nextPtCutoff = new Date(utc6pm.getTime());
                nextPtCutoff.shiftHour(-1);
            }
        }
        // Next monthly expedition reset time (15th JST 1200)
        const utc3am15th = new Date(now);
        utc3am15th.setUTCHours(3, 0, 0, 0);
        utc3am15th.setUTCDate(15);
        if(utc3am15th.getTime() < now) utc3am15th.shiftMonth(1);
        return {
            quest: utc8pm.getTime(),
            pvp: nextPvPstamp,
            rank: nextPtCutoff.getTime(),
            quarterly: quarterlyUtc8pm,
            exped: utc3am15th.getTime(),
        };
    };

    /**
     * Calculates remaining time until next in-game Quest/PvP/RankPtCutOff reset.
     * @param {number} now - timestamp of 'now', current timestamp by default.
     * @param {number} expedLimitTimestamp - monthly exped reset timestamp from API result.
     * @return {Object} an Object contains the HH:MM:SS strings of {quest, pvp, rank, quarterly}.
     */
    const remainingTimeUntilNextResets = (now = Date.now(), expedLimitTimestamp = 0) => {
        const nextResets = nextResetsTimestamp(now);
        return {
            quest: String(Math.floor((nextResets.quest - now) / 1000)).toHHMMSS(),
            pvp: String(Math.floor((nextResets.pvp - now) / 1000)).toHHMMSS(),
            rank: String(Math.floor((nextResets.rank - now) / 1000)).toHHMMSS(),
            quarterly: String(Math.floor((nextResets.quarterly - now) / 1000)).toHHMMSS(true),
            exped: String(Math.floor(((expedLimitTimestamp || nextResets.exped) - now) / 1000)).toHHMMSS(true),
        };
    };

    const publicApi = {
    };

    // Export public API
    window.KC3Calc = Object.assign(publicApi, {
        getFleetsFighterPowerText,
        buildFleetsContactChanceText,
        buildFleetsAirstrikePowerText,
        collectBattleConditions,
        
        getLandBasesResupplyCost,
        getLandBasesSortieCost,
        getLandBasesWorstCond,
        isLandBasesSupplied,
        getLandBaseHighAltitudeModifier,
        
        enemyFighterPower,
        fighterPowerIntervals,
        
        getShipLevelingGoal,
        nextResetsTimestamp,
        remainingTimeUntilNextResets,
    });

})();
