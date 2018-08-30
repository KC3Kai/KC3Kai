// Sync logic shared by the background and content script contexts

(function () {
  'use strict';

  const QuestSync = { syncStructVersion: 2 };

  // ----------------------------------------------------------------------- //
  // ---------------------------[ PUBLIC API ]------------------------------ //
  // ----------------------------------------------------------------------- //

  QuestSync.save = (questData) => {
    return Promise.all([
      Promise.resolve().then(KC3QuestSync.checkSyncEnabled),
      KC3QuestSync.checkChangesExist(questData),
    ])
      .then((checks) => {
        const shouldSave = checks.every(result => !!result);
        return shouldSave ? KC3QuestSync.saveToSync(questData) : undefined;
      })
      .catch(KC3QuestSync.logError);
  };

  // ----------------------------------------------------------------------- //
  // ---------------------------[ PRIVATE API ]----------------------------- //
  // ----------------------------------------------------------------------- //

  QuestSync.init = () => {
    return Promise.resolve()
      .then(KC3QuestSync.startRemoteTracking)
      .then(KC3QuestSync.syncOnStartup)
      .catch(KC3QuestSync.logError);
  };

  QuestSync.logError = (error) => { console.error("Quest Sync:", error); };

  // ------------------------------[ SAVE ]--------------------------------- //

  QuestSync.checkSyncEnabled = () => {
    ConfigManager.loadIfNecessary();
    return !!ConfigManager.chromeSyncQuests;
  };

  QuestSync.checkChangesExist = ({ quests }) => {
    return KC3QuestSync.getSyncStorage()
      .then((syncData) => { return !syncData || quests !== syncData.quests; });
  };

  QuestSync.saveToSync = (questData) => {
    const data = Object.assign({ syncStructVersion: KC3QuestSync.syncStructVersion }, questData);
    return Promise.resolve()
      .then(KC3QuestSync.stopRemoteTracking)
      .then(KC3QuestSync.setSyncStorage.bind(null, data))
      .catch(KC3QuestSync.logError);
  };

  // -------------------[ CHROME STORAGE SYNC WRAPPER ]--------------------- //

  QuestSync.getSyncStorage = () =>
    KC3ChromeSync.get('KC3QuestsData').then(KC3QuestSync.deserialize);

  QuestSync.setSyncStorage = data =>
    KC3ChromeSync.set('KC3QuestsData', KC3QuestSync.serialize(data));

  // ChromeSync requires a string as input, so we need to stringify the data
  // Since the quests prop is already stringified, we parse it first to avoid double stringification
  QuestSync.serialize = (questData) => {
    const quests = questData.quests ? JSON.parse(questData.quests) : {};
    return JSON.stringify(Object.assign({}, questData, { quests }));
  };

  QuestSync.deserialize = (json) => {
    if (!json) { return undefined; }

    const result = JSON.parse(json);
    return Object.assign(result, { quests: JSON.stringify(result.quests) });
  };

  // ----------------------------------------------------------------------- //
  // --------------------------[ GLOBAL INIT ]------------------------------ //
  // ----------------------------------------------------------------------- //

  window.KC3QuestSync = $.extend(window.KC3QuestSync || {}, QuestSync);
}());
