/**
 * KC3改 limiter instance manager of queued jobs (in Promise), depending on bottleneck.js (v1) library.
 */
(() => {
  "use strict";

  // Default managed instance and settings
  const defaultTooltipMaxConcurrent = 10;
  // Will be undefined if `bottleneck.js` not loaded before managers
  const tooltipLimiter = newTooltipLimiter(defaultTooltipMaxConcurrent);
  // console.debug('KC3QueueManager', 'init');

  function newTooltipLimiter (maxNb = defaultTooltipMaxConcurrent, debug = false) {
    let limiter;
    if (typeof window.Bottleneck === "function") {
      limiter = new Bottleneck(maxNb);
      if (debug) limiter.on("idle", () => {
        console.debug(`TooltipLimiter(${maxNb}) is idle`);
      });
    }
    return limiter;
  }

  function deferTooltip (handler, priority = 5, limiter = tooltipLimiter) {
    console.assert(typeof handler === "function", "handler is not a function", handler);
    console.assert(tooltipLimiter !== undefined && limiter instanceof Bottleneck, "limiter should be an instance of bottleneck");
    return limiter.schedulePriority(priority, () => new Promise(resolve => {
      handler();
      resolve(this);
    }));
  }

  function cancelTooltips (limiter) {
    console.assert(tooltipLimiter !== undefined && limiter !== tooltipLimiter, "default limiter cannot be stopped");
    if (limiter instanceof Bottleneck) limiter.stopAll(true);
  }

  window.KC3QueueManager = {
    tooltipLimiter,
    newTooltipLimiter,
    deferTooltip,
    cancelTooltips,
  };

})();
