/* AkashiRepair.js

Manages the timer for a player's Akashi repairs.
*/
(function () {
  "use strict";

  var MS_PER_SECOND = 1000;
  var MS_PER_MINUTE = 60 * MS_PER_SECOND;

  window.KC3AkashiRepair = function () {
    this.timer = new KC3AkashiRepair.Timer();
  };

  /*--------------------------------------------------------*/
  /*----------------------[ GETTERS ]-----------------------*/
  /*--------------------------------------------------------*/

  // Calculate the amount of HP that can be repaired,
  // and the amount of time until the next point of HP can be repaired
  KC3AkashiRepair.prototype.getProgress = function (dockTime, hpLost) {
    if (hpLost === 0) { return { repairedHp: 0, timeToNextRepair: 0 }; }
    // if we don't have enough information, just give up
    if (!Number.isInteger(hpLost) || !Number.isInteger(dockTime) || !this.timer.isRunning()) {
      return {/* repairedHp: undefined, timeToNextRepair: undefined */};
    }
    var elapsed = this.timer.getElapsed();

    if (!elapsed.canDoRepair()) {
      return KC3AkashiRepair.calculatePreRepairProgress(elapsed);
    }

    var repairTime = KC3AkashiRepair.calculateRepairTime(dockTime);
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
    if (KC3AkashiRepair.hasRepairFlagship(fleet)) {
      this.timer.start();
    }
  };

  // Listener for api_req_hensei/preset_select
  KC3AkashiRepair.prototype.onPresetSelect = function (fleet) {
    if (KC3AkashiRepair.hasRepairFlagship(fleet) && !this.timer.isRunning()) {
      this.timer.start();
    }
  };

  // Listener for api_port/port
  KC3AkashiRepair.prototype.onPort = function (fleets) {
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
  // based on the length of an equivalent dock repair
  KC3AkashiRepair.calculateRepairTime = function (dockTime) {
    return roundUpToMinute(dockTime - 30 * MS_PER_SECOND);
  };

  /*--------------------------------------------------------*/
  /*------------------[ INTERNAL CLASSES ]------------------*/
  /*--------------------------------------------------------*/

  var Timer = function () { this.startTime = undefined; };
  Timer.prototype.start = function () { this.startTime = Date.now(); };
  Timer.prototype.stop = function () { this.startTime = undefined; };
  Timer.prototype.isRunning = function () { return !!this.startTime; };
  Timer.prototype.getElapsed = function () {
    return new KC3AkashiRepair.DeltaTime(this.startTime);
  };
  KC3AkashiRepair.Timer = Timer;

  var DeltaTime = function (startTime) {
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
    return flagship.master().api_stype === 19;
  };

  /*------------------[ REPAIR PROGRESS ]-------------------*/

  // Calculate the amount of time it takes to repair 1 HP,
  // rounded up to the nearest ms
  KC3AkashiRepair.calculateTickLength = function (repairTime, hpLost) {
    return Math.ceil(repairTime / hpLost);
  };

  // Calculate progress when no repairs are ready yet
  KC3AkashiRepair.calculatePreRepairProgress = function (dt) {
    return {
      repairedHp: 0,
      timeToNextRepair: 20 * MS_PER_MINUTE - dt.ms(),
    };
  };

  var roundUpToMinute = function (ms) {
    return Math.ceil(ms / MS_PER_MINUTE) * MS_PER_MINUTE;
  };
  var roundDownToMinute = function (ms) {
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
