/* NosakiSparkle.js

Manages the timer for the player's Nosaki sparkling mechanic.
*/

(function () {
  "use strict";

  const MS_PER_SECOND = 1000;
  const MS_PER_MINUTE = 60 * MS_PER_SECOND;

  window.KC3NosakiSparkle = function () {
    this.timer = new KC3NosakiSparkle.Timer();
  };

  /*--------------------------------------------------------*/
  /*----------------------[ GETTERS ]-----------------------*/
  /*--------------------------------------------------------*/

  KC3NosakiSparkle.prototype.isRunning = function () {
    return this.timer.isRunning();
  };
  KC3NosakiSparkle.prototype.canDoSparkle = function () {
    return this.timer.getElapsed().canDoSparkle();
  };
  KC3NosakiSparkle.prototype.getElapsed = function () {
    return this.timer.getElapsed().ms();
  };

  /*--------------------------------------------------------*/
  /*---------------------[ LISTENERS ]----------------------*/
  /*--------------------------------------------------------*/

  // Listener for api_req_hensei/change
  KC3NosakiSparkle.prototype.onChange = function (fleet) {
    if (KC3NosakiSparkle.getSparklerPosition(fleet)) {
      this.timer.start();
    }
  };

  // Listener for api_req_hensei/preset_select
  KC3NosakiSparkle.prototype.onPresetSelect = function (fleet) {
    if (KC3NosakiSparkle.getSparklerPosition(fleet)) {
      if (!this.timer.isRunning()) {
        this.timer.start();
      }
    }
  };

  // Listener for api_port/port
  KC3NosakiSparkle.prototype.onPort = function (fleets) {
    if (this.timer.getElapsed().canDoSparkle()) {
      var sparklerFlagExists = fleets.some(KC3NosakiSparkle.getSparklerPosition);
      if (sparklerFlagExists) {
        this.timer.start();
      } else {
        this.timer.stop();
      }
    }
  };

  /*--------------------------------------------------------*/
  /*------------------[ INTERNAL CLASSES ]------------------*/
  /*--------------------------------------------------------*/

  /*-----------------------[ TIMER ]------------------------*/

  const LOCAL_STORAGE_KEY = 'nosakiSparkleStartTime';

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
    return new KC3NosakiSparkle.DeltaTime(this.startTime);
  };
  KC3NosakiSparkle.Timer = Timer;

  /*---------------------[ DELTA TIME ]---------------------*/

  const DeltaTime = function (startTime) {
    this.startTime = startTime;
    this.now = Date.now();
  };
  DeltaTime.prototype.canDoSparkle = function () {
    const elapsed = this.ms();
    if (elapsed > 30 * MS_PER_MINUTE) {
      return 2;
    }
    if (elapsed > 15 * MS_PER_MINUTE) {
      return 1;
    }
    return 0;
  };
  DeltaTime.prototype.ms = function () {
    return this.now - this.startTime || 0;
  };
  KC3NosakiSparkle.DeltaTime = DeltaTime;

  /*--------------------------------------------------------*/
  /*----------------------[ HELPERS ]-----------------------*/
  /*--------------------------------------------------------*/

  // Returns the sparkler's fleet position (counting from 1) if there is one, 0 otherwise
  KC3NosakiSparkle.getSparklerPosition = function (fleet) {
    const sparklerShips = [996, 1002];
    if (sparklerShips.includes(fleet.ship(0).masterId)) {
      return 1;
    }
    if (sparklerShips.includes(fleet.ship(1).masterId)) {
      return 2;
    }
    return 0;
  }

  // Returns the sparkler's morale per tick gain
  KC3NosakiSparkle.getSparklerPower = function (ship) {
    const power2 = [996];
    const power3 = [1002];
    if (power2.includes(ship.masterId)) {
      return 2;
    }
    if (power3.includes(ship.masterId)) {
      return 3;
    }
    return 0;
  }
})();