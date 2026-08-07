/**
 * KC3改 limiter instance manager of queued jobs (in Promise), depending on bottleneck.js (v1) library.
 */
(() => {
  "use strict";

  // Default managed instance and settings
  const defaultTooltipMaxConcurrent = 10;
  const tooltipLimiter = new Bottleneck(defaultTooltipMaxConcurrent);
  // tooltipLimiter.on('idle', () => console.debug(`tooltipMaxConcurrent#idle`));
  // console.debug('KC3QueueManager', 'init');

  function newTooltipLimiter (maxNb = defaultTooltipMaxConcurrent) {
    return new Bottleneck(maxNb);
  }

  function deferTooltip (handler, priority = 5, limiter = tooltipLimiter) {
    console.assert(typeof handler === "function", "handler is not a function", handler);
    return limiter.schedulePriority(priority, () => new Promise(resolve => {
      handler();
      resolve(this);
    }));
  }

  function cancelTooltips (limiter) {
    console.assert(limiter !== tooltipLimiter, "default limiter cannot be stopped");
    if (limiter instanceof Bottleneck) limiter.stopAll(true);
  }

  window.KC3QueueManager = {
    tooltipLimiter,
    newTooltipLimiter,
    deferTooltip,
    cancelTooltips,
  };

})();
