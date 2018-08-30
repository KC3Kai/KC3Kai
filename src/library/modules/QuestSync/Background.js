// Sync logic unique to the background context

(function () {
  'use strict';

  const QuestSync = {};

  QuestSync.startRemoteTracking = () => {
    // Promisify to mirror ContentScript implementation
    const { syncOnRemoteChanges: listener } = KC3QuestSync;
    return new Promise((resolve) => {
      if (!KC3QuestSync.hasListener(listener)) {
        KC3QuestSync.addListener(listener);
      }
      resolve();
    });
  };

  QuestSync.stopRemoteTracking = () => {
    // Promisify to mirror ContentScript implementation
    return new Promise((resolve) => {
      KC3QuestSync.removeListener(KC3QuestSync.syncOnRemoteChanges);
      resolve();
    });
  };

  QuestSync.syncOnStartup = () => {
    return Promise.resolve()
      .then(KC3QuestSync.checkSyncEnabled)
      .then((isSyncEnabled) => {
        if (!isSyncEnabled) { return Promise.resolve(); }
        return KC3QuestSync.getSyncStorage()
          .then(KC3QuestSync.syncQuests);
      })
      .catch(KC3QuestSync.logError);
  };

  QuestSync.sendNotification = (data) => {
    chrome.notifications.create('kc3kai_quests', data);
  };

  // ----------------------------------------------------------------------- //
  // ----------------------------[ LISTENERS ]------------------------------ //
  // ----------------------------------------------------------------------- //

  // ----------------------------[ SETTINGS ]------------------------------- //

  QuestSync.syncOnSyncEnabled = (e) => {
    return Promise.resolve(e)
      .then(KC3QuestSync.checkWasSyncEnabled)
      .then((wasSyncEnabled) => {
        if (!wasSyncEnabled) { return Promise.resolve(); }
        return KC3QuestSync.getSyncStorage()
          .then(KC3QuestSync.syncQuests);
      })
      .catch(KC3QuestSync.logError);
  };

  // Determine whether the change to localStorage was quest sync being turned on
  QuestSync.checkWasSyncEnabled = ({ key, newValue, oldValue } = {}) => {
    if (key !== 'config') { return false; }

    const oldConfig = JSON.parse(oldValue);
    if(!oldConfig) { return false; }
    const { chromeSyncQuests: wasEnabled } = oldConfig;
    if (wasEnabled) { return false; }

    const newConfig = JSON.parse(newValue);
    if(!newConfig) { return false; }
    const { chromeSyncQuests: isEnabled } = newConfig;
    return isEnabled;
  };

  // --------------------------[ SYNC STORAGE ]----------------------------- //

  QuestSync.syncOnRemoteChanges = ({ KC3QuestsData }, namespace) => {
    if (!KC3QuestSync.checkSyncEnabled() || namespace !== 'sync') { return; }

    const { newValue: data } = KC3QuestsData || {};
    if (data) {
      KC3QuestSync.syncQuests(data);
    }
  };

  // -------------------[ CHROME STORAGE EVENT WRAPPER ]-------------------- //

  QuestSync.addListener = (listener) => { chrome.storage.onChanged.addListener(listener); };
  QuestSync.hasListener = (listener) => { chrome.storage.onChanged.hasListener(listener); };
  QuestSync.removeListener = (listener) => { chrome.storage.onChanged.removeListener(listener); };

  // ----------------------------------------------------------------------- //
  // ------------------------------[ SYNC ]--------------------------------- //
  // ----------------------------------------------------------------------- //

  QuestSync.syncQuests = (remoteData) => {
    try {
      if (KC3QuestSync.validateSyncData(remoteData)) {
        KC3QuestManager.mergeSyncData(remoteData);
        KC3QuestSync.notifySynced(remoteData);
      }
    } catch (e) {
      KC3QuestSync.logError(e);
    }
  };

  QuestSync.validateSyncData = (remoteData) => {
    if (!remoteData) {
      console.info('No sync data'); /* RemoveLogging:skip */
      return false;
    }
    if (remoteData.syncStructVersion !== KC3QuestSync.syncStructVersion) {
      throw new Error(`Bad syncStructVersion: ${remoteData.syncStructVersion}`);
    }

    // short-circuit if no changes
    if (remoteData.quests === localStorage.quests) {
      console.info('No changes to be made'); /* RemoveLogging:skip */
      return false;
    }

    return true;
  };

  // ----------------------------------------------------------------------- //
  // -------------------------[ NOTIFICATION ]------------------------------ //
  // ----------------------------------------------------------------------- //

  QuestSync.notifySynced = (remoteData) => {
    if (KC3QuestSync.checkNotifyEnabled()) {
      KC3QuestSync.sendNotification(KC3QuestSync.composeNotification(remoteData));
    }
  };

  QuestSync.checkNotifyEnabled = () => {
    ConfigManager.loadIfNecessary();
    return !!ConfigManager.dataSyncNotification;
  };

  QuestSync.composeNotification = ({ syncTimeStamp }) => {
    const dt = new Date(parseInt(syncTimeStamp, 10)).toLocaleString();
    return {
      type: 'basic',
      title: KC3Meta.term('DesktopNotifyQuestsSyncTitle'),
      message: KC3Meta.term('DesktopNotifyQuestsSyncMessage').format(dt),
      iconUrl: chrome.extension.getURL('assets/img/quests/sortie.jpg'),
    };
  };

  // ----------------------------------------------------------------------- //
  // --------------------------[ GLOBAL INIT ]------------------------------ //
  // ----------------------------------------------------------------------- //

  window.KC3QuestSync = $.extend(window.KC3QuestSync || {}, QuestSync);

  window.addEventListener('storage', KC3QuestSync.syncOnSyncEnabled);
}());
