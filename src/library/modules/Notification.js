/**
 * KC3改 configured Chrome Desktop Notifications sender triggered from devtools panel events.
 * @see Timer.js - another notifications sender triggered by managed timer events.
 * @see Service.js - background messaging service to invoke `chrome.notifications` API actually.
 */
(() => {
  'use strict';

  var audio = null;

  function clearSound() {
    if (!audio) {
      return;
    }

    audio.pause();
    audio = null;
  }

  function getSoundSrc(alertType, alertCustomSrc) {
    switch (alertType) {
      case 1:
        return '/assets/snd/pop.mp3';
      case 2:
        return alertCustomSrc;
      case 3:
        return '/assets/snd/ding.mp3';
      case 4:
        return '/assets/snd/dong.mp3';
      case 5:
        return '/assets/snd/bell.mp3';
    }
    return;
  }

  function playSound(alertType, alertCustomSrc) {
    const src = getSoundSrc(alertType, alertCustomSrc);
    if (!src) {
      return;
    }

    clearSound();
    audio = new Audio(src);
    audio.volume = ConfigManager.alert_volume / 100;
    audio.play();
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

  /** On event of ship morale recovered to average */
  function notifyMorale() {
    const canNotify = !!ConfigManager.alert_morale_notif
      && !(KC3SortieManager.isOnSortie() || KC3SortieManager.isPvP());
    if (!canNotify) {
      return;
    }

    playSound(ConfigManager.alert_type, ConfigManager.alert_custom);
    notifyDesktop('morale', {
      type: 'basic',
      title: KC3Meta.term('DesktopNotifyMoraleTitle'),
      message: KC3Meta.term('DesktopNotifyMoraleMessage'),
      iconUrl: '/assets/img/ui/morale.png'
    });
    focusTab();
  }

  /** On event of ship morale increased above average (sparkled state) */
  function notifySparkle() {
    const canNotify = !!ConfigManager.alert_sparkle;
    if (!canNotify) {
      return;
    }

    playSound(ConfigManager.alert_type_sparkle, ConfigManager.alert_custom_sparkle);
    notifyDesktop('sparkle', {
      type: 'basic',
      title: KC3Meta.term('DesktopNotifySparkleTitle'),
      message: KC3Meta.term('DesktopNotifySparkleMessage'),
      iconUrl: '/assets/img/ui/foodsup.png'
    });
    focusTab();
  }

  window.KC3Notification = {
    playSound,
    focusTab,
    notifyDesktop,
    notifyMorale,
    notifySparkle,
  };

})();
