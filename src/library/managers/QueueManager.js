(() => {

  console.debug('KC3QueueManager', 'init');

  const tooltipLimiter = new Bottleneck(10);
  // tooltipLimiter.on('idle', () => console.debug(`tooltipMaxConcurrent#idle`));

  window.KC3QueueManager = {
    tooltipLimiter,
  };

})();
