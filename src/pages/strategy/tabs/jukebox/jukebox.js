(function () {
  'use strict';

  KC3StrategyTabs.jukebox = new KC3StrategyTab('jukebox');

  KC3StrategyTabs.jukebox.definition = {
    tabSelf: KC3StrategyTabs.jukebox,

    // Config
    type: 'battle',
    volume: 0.1,

    // Battle BGM
    maxBattleId: 216,
    missingBattleIds: [24],

    /* INIT: mandatory
    Prepares initial static data needed.
    ---------------------------------*/
    init: function () {
      const myServer = (new KC3Server()).setNum(PlayerManager.hq.server);
      this.serverIp = myServer.ip;
    },

    /* RELOAD: optional
    Loads latest player or game data if needed.
    ---------------------------------*/
    reload: function () {
      this.portbgm = KC3Master._raw.bgm;
      this.mapbgm = KC3Master._raw.mapbgm;
      this.maxBattleId = Math.max(this.maxBattleId, ...Object.values(this.mapbgm).map(v => v.api_boss_bgm).flat());
      this.loadConfig();
      console.debug('maxBattleId', this.maxBattleId);
    },

    /* EXECUTE: mandatory
    Places data onto the interface from scratch.
    ---------------------------------*/
    execute: function () {
      this.loadConfig();
      this.initAudioListeners();

      $('.type.port').on('click', () => {
        this.selectType('port');
      });
      $('.type.battle').on('click', () => {
        this.selectType('battle');
      });

      // Init default list
      this.selectType(this.type);
    },

    getConfig() {
      const config = {
        type: this.getType(),
        volume: this.getVolume(),
      };
      return config;
    },

    loadConfig() {
      let config;
      try {
        config = JSON.parse(localStorage.getItem('jukebox'));
      } catch (error) {
      }
      if (!config) {
        config = this.getConfig();
        this.saveConfig();
      }
      this.setType(config.type);
      this.setVolume(config.volume);
      return config;
    },

    saveConfig() {
      const config = this.getConfig();
      localStorage.setItem('jukebox', JSON.stringify(config));
    },

    getType() {
      return this.type;
    },

    setType(value) {
      this.type = value || 'battle';
    },

    getVolume() {
      return this.volume;
    },

    setVolume(value) {
      this.volume = Number(value) || 0.1;
    },

    getAudio() {
      const audio = document.querySelector('.music-player audio');
      return audio;
    },

    playAudio(src) {
      const audio = this.getAudio();
      audio.volume = this.getVolume();
      audio.src = src;
      audio.play();
    },

    initAudioListeners() {
      const audio = this.getAudio();
      audio.addEventListener('volumechange', () => {
        this.setVolume(audio.volume);
        this.saveConfig();
      });
    },

    clearList() {
      $('.music-list').html('');
    },

    selectType(type) {
      this.type = type;
      this.saveConfig();

      $('.music-types .type').removeClass('active');
      $(`.music-types .type.${type}`).addClass('active');
      this.clearList();

      switch (type) {
        case 'port':
          this.loadPortBgms();
          return;
        default:
          this.loadBattleBgms();
      }
    },

    /**
     *
     * @param {*} bgms list of bgm, with `api_id` and `api_name`
     */
    loadBgms(bgms) {
      bgms.forEach(bgm => {
        const item = $('.factory .track')
          .clone()
          .appendTo('.music-list')
          .attr('bgm-type', this.type)
          .attr('bgm-id', bgm.api_id);

        $('.id', item).text('#' + String(bgm.api_id).pad(3, '0'));
        $('.desc', item).text(bgm.api_name);
      });

      this.initTrackListeners();
    },

    loadPortBgms() {
      $('.music-list').addClass('list');
      this.loadBgms(Object.values(this.portbgm));
    },

    loadBattleBgms() {
      $('.music-list').removeClass('list');
      const bgms = Array(this.maxBattleId)
        .fill(null)
        .map((_, i) => i + 1)
        .filter(id => !this.missingBattleIds.includes(id))
        .sort((a, b) => b - a)
        .map(id => ({ api_id: id }));
      this.loadBgms(bgms);
    },

    initTrackListeners() {
      $('.music-list .track').click(ev => {
        const target = ev.currentTarget;
        const id = $(target).attr('bgm-id');
        const type = $(target).attr('bgm-type');
        const src = `http://${this.serverIp}/kcs2/resources${KC3Master.bgm_file(id, type)}`;
        this.playAudio(src);

        $('.music-list .track').removeClass('active');
        $(target).addClass('active');

        $('.music-player .id').text($('.id', target).text());
        $('.music-player .desc').text($('.desc', target).text());
      });
    },

    /* UPDATE: optional
    Partially update elements of the interface,
      possibly without clearing all contents first.
    Be careful! Do not only update new data,
      but also handle the old states (do cleanup).
    Return `false` if updating all needed,
      EXECUTE will be invoked instead.
    ---------------------------------*/
    update: function (pageParams) {
      // Use `pageParams` for latest page hash values,
      // KC3StrategyTabs.pageParams keeps the old values for states tracking

      // Returning `true` means updating has been handled.
      return false;
    }
  };
})();
