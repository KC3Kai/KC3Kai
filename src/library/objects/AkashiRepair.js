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
})();
