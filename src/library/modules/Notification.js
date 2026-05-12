(() => {

  let audio = new Audio();
  audio = null;

  function clear() {
    if (!audio) {
      return;
    }

    audio.pause();
    audio = null;
  }

  function getSrc(alertType, alertCustomSrc) {
    switch (alertType) {
      case 1:
        return '../../../../assets/snd/pop.mp3';
      case 2:
        return alertCustomSrc;
      case 3:
        return '../../../../assets/snd/ding.mp3';
      case 4:
        return '../../../../assets/snd/dong.mp3';
      case 5:
        return '../../../../assets/snd/bell.mp3';
    }
    return null;
  }

  function notify(alertType, alertCustomSrc) {
    clear();

    const src = getSrc(alertType, alertCustomSrc);
    if (src) {
      audio = new Audio(src);
    }
    if (!audio) {
      return;
    }

    audio.volume = ConfigManager.alert_volume / 100;
    audio.play();
  }

  function notifyMorale() {
    const canNotify = !!ConfigManager.alert_morale_notif
      && !(KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP());
    if (!canNotify) {
      return;
    }

    notify(ConfigManager.alert_type, ConfigManager.alert_custom);
    notifyDesktop('morale', {
      type: 'basic',
      title: KC3Meta.term('DesktopNotifyMoraleTitle'),
      message: KC3Meta.term('DesktopNotifyMoraleMessage'),
      iconUrl: '/assets/img/ui/morale.png'
    });
    focusTab();
  }

  function notifySparkle() {
    const canNotify = !!ConfigManager.alert_sparkle;
    if (!canNotify) {
      return;
    }

    notify(ConfigManager.alert_type_sparkle, ConfigManager.alert_custom_sparkle);
    notifyDesktop('sparkle', {
      type: 'basic',
      title: KC3Meta.term('DesktopNotifySparkleTitle'),
      message: KC3Meta.term('DesktopNotifySparkleMessage'),
      iconUrl: '/assets/img/ui/foodsup.png'
    });
    focusTab();
  }

  function notifyDesktop(notifId, data) {
    (new RMsg('service', 'notify_desktop', {
      notifId,
      data,
      tabId: chrome.devtools.inspectedWindow.tabId
    })).execute();
  }

  function focusTab() {
    if (!ConfigManager.alert_focustab) {
      return;
    }

    (new RMsg('service', 'focusGameTab', {
      tabId: chrome.devtools.inspectedWindow.tabId
    })).execute();
  }

  window.KC3Notification = {
    clear,
    notify,
    notifyMorale,
    notifySparkle,
    notifyDesktop,
    focusTab,
  };

})()
