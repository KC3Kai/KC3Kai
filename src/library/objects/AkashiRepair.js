/* AkashiRepair.js

Manages the timer for a player's Akashi repairs.
NOTE1: new repair mechanic, happens on event sortie node, called 'Emergency Anchorage Repair',
has been implemented since 2019-8, so don't just simply word this 'home port' one with 'Anchorage Repair'.
NOTE2: Asahi Kai has implemented since 2023-8, who can start and 'boost' home port repairs, no longer Akashi only.
*/
(function () {
  "use strict";

  const MS_PER_SECOND = 1000;
  const MS_PER_MINUTE = 60 * MS_PER_SECOND;

  window.KC3AkashiRepair = function () {
    this.timer = new KC3AkashiRepair.Timer();
  };

  /*--------------------------------------------------------*/
  /*----------------------[ GETTERS ]-----------------------*/
  /*--------------------------------------------------------*/

  // Calculate the amount of HP that can be repaired,
  // and the amount of time until the next point of HP can be repaired
  KC3AkashiRepair.prototype.getProgress = function (dockTime, hpLost, fleet) {
    if (hpLost === 0) { return { repairedHp: 0, timeToNextRepair: 0 }; }
    // if we don't have enough information, just give up
    if (!Number.isInteger(hpLost) || !Number.isInteger(dockTime) || !this.timer.isRunning()) {
      return {/* repairedHp: undefined, timeToNextRepair: undefined */};
    }
    var elapsed = this.timer.getElapsed();

    if (!elapsed.canDoRepair()) {
      return KC3AkashiRepair.calculatePreRepairProgress(elapsed);
    }

    var repairTimeModifier = 1;
    if (fleet) {
      // actual modifier decided on doing first repair? in case of conditions unmet, like crane unequipped
      KC3AkashiRepair.updateRepairTimeModifier(fleet);
      repairTimeModifier = fleet.repairTimeMod;
    }
    var repairTime = KC3AkashiRepair.calculateRepairTime(dockTime, repairTimeModifier);
    var tickLength = KC3AkashiRepair.calculateTickLength(repairTime, hpLost);
    return KC3AkashiRepair.calculateProgress(elapsed, tickLength, hpLost);
  };

  KC3AkashiRepair.prototype.isRunning = function () {
    return this.timer.isRunning();
  };
  KC3AkashiRepair.prototype.canDoRepair = function () {
    return this.timer.getElapsed().canDoRepair();
  };
  KC3AkashiRepair.prototype.getElapsed = function () {
    return this.timer.getElapsed().ms();
  };

  /*--------------------------------------------------------*/
  /*---------------------[ LISTENERS ]----------------------*/
  /*--------------------------------------------------------*/

  // Listener for api_req_hensei/change
  KC3AkashiRepair.prototype.onChange = function (fleet) {
    KC3AkashiRepair.updateRepairTimeModifier(fleet);
    if (KC3AkashiRepair.hasRepairFlagship(fleet)) {
      this.timer.start();
    }
  };

  // Listener for api_req_hensei/preset_select
  KC3AkashiRepair.prototype.onPresetSelect = function (fleet) {
    KC3AkashiRepair.updateRepairTimeModifier(fleet);
    if (KC3AkashiRepair.hasRepairFlagship(fleet) && !this.timer.isRunning()) {
      this.timer.start();
    }
  };

  // Listener for api_port/port
  KC3AkashiRepair.prototype.onPort = function (fleets) {
    fleets.forEach(KC3AkashiRepair.updateRepairTimeModifier);
    if (this.timer.getElapsed().canDoRepair()) {
      var akashiFlagExists = fleets.some(KC3AkashiRepair.hasRepairFlagship);
      if (akashiFlagExists) {
        this.timer.start();
      } else {
        this.timer.stop();
      }
    }
  };

  /*--------------------------------------------------------*/
  /*-------------------[ PUBLIC HELPERS ]-------------------*/
  /*--------------------------------------------------------*/

  // Calculate the length of an Akashi repair in ms,
  // based on the length of an equivalent dock repair.
  // Required repair time reduced to about 85% by 2 repair ships (Asahi Kai with atleast 1 crane)
  // Modifier might be relevant to repair ship level? calculating and rounding unknown yet
  // https://twitter.com/Schmeichel20/status/1703728038700278122
  KC3AkashiRepair.calculateRepairTime = function (dockTime, modifier = 1) {
    return roundUpToMinute((dockTime - 30 * MS_PER_SECOND) * modifier);
  };

  // Set new repair time modifier to fleet if 2 repair ships found
  // Uncertain if repair time modifier applied to individual fleet or all fleets share one mod
  KC3AkashiRepair.updateRepairTimeModifier = function (fleet) {
    fleet.repairTimeMod = 1;
    if (KC3AkashiRepair.hasRepairFlagship(fleet) && KC3AkashiRepair.hasRepair2ndShip(fleet)) {
      fleet.repairTimeMod = 0.85;
    }
  };

  /*--------------------------------------------------------*/
  /*------------------[ INTERNAL CLASSES ]------------------*/
  /*--------------------------------------------------------*/

  /*-----------------------[ TIMER ]------------------------*/

  const LOCAL_STORAGE_KEY = 'akashiRepairStartTime';

  const Timer = function () {
    this.startTime = parseInt(localStorage.getItem(LOCAL_STORAGE_KEY), 10) || undefined;
  };

  Timer.prototype.start = function () {
    this.startTime = Date.now();
    localStorage.setItem(LOCAL_STORAGE_KEY, this.startTime);
  };
  Timer.prototype.stop = function () {
    this.startTime = undefined;
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  };

  Timer.prototype.isRunning = function () { return !!this.startTime; };

  Timer.prototype.getElapsed = function () {
    return new KC3AkashiRepair.DeltaTime(this.startTime);
  };
  KC3AkashiRepair.Timer = Timer;

  /*---------------------[ DELTA TIME ]---------------------*/

  const DeltaTime = function (startTime) {
    this.startTime = startTime;
    this.now = Date.now();
  };
  DeltaTime.prototype.canDoRepair = function () {
    return this.ms() >= 20 * MS_PER_MINUTE;
  };
  DeltaTime.prototype.ms = function () {
    return this.now - this.startTime || 0;
  };
  KC3AkashiRepair.DeltaTime = DeltaTime;

  /*--------------------------------------------------------*/
  /*----------------------[ HELPERS ]-----------------------*/
  /*--------------------------------------------------------*/

  // Returns true if the fleet's flagship is of the Repair Ship class, false otherwise
  KC3AkashiRepair.hasRepairFlagship = function (fleet) {
    var flagship = fleet.ship(0);
    return flagship.master().api_stype === 19 && KC3AkashiRepair.hasRepairFacility(flagship);
  };
  KC3AkashiRepair.hasRepair2ndShip = function (fleet) {
    var ship2nd = fleet.ship(1);
    return ship2nd.master().api_stype === 19 && KC3AkashiRepair.hasRepairFacility(ship2nd);
  };
  KC3AkashiRepair.hasRepairFacility = function (ship) {
    return ship.master().api_ctype === 49 || ship.hasEquipmentType(2, 31);
  };

  /*------------------[ REPAIR PROGRESS ]-------------------*/

  // Calculate the amount of time it takes to repair 1 HP,
  // rounded up to the nearest ms
  KC3AkashiRepair.calculateTickLength = function (repairTime, hpLost) {
    return Math.ceil(repairTime / hpLost);
  };

  // Calculate progress when no repairs are ready yet.
  KC3AkashiRepair.calculatePreRepairProgress = function (dt) {
    return {
      repairedHp: 0,
      timeToNextRepair: 20 * MS_PER_MINUTE - dt.ms(),
    };
  };

  const roundUpToMinute = function (ms) {
    return Math.ceil(ms / MS_PER_MINUTE) * MS_PER_MINUTE;
  };
  const roundDownToMinute = function (ms) {
    return Math.floor(ms / MS_PER_MINUTE) * MS_PER_MINUTE;
  };

  // Calculate progress when there are repairs ready
  KC3AkashiRepair.calculateProgress = function (deltaTime, tickLength, hpLost) {
    var result = { repairedHp: 0, timeToNextRepair: 0 };
    while (result.repairedHp < hpLost) {
      var nextTick = tickLength * (result.repairedHp + 1);
      if (roundDownToMinute(deltaTime.ms()) >= nextTick) {
        result.repairedHp += 1;
      } else {
        result.timeToNextRepair = roundUpToMinute(nextTick) - deltaTime.ms();
        break;
      }
    }
    if (result.repairedHp === 0) {
      return {
        repairedHp: 1,
        timeToNextRepair: roundUpToMinute(tickLength * 2) - deltaTime.ms(),
      };
    }
    return result;
  };
})();
