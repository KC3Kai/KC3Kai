(function () {
  'use strict';

  KC3StrategyTabs.jukebox = new KC3StrategyTab('jukebox');

  KC3StrategyTabs.jukebox.definition = {
    tabSelf: KC3StrategyTabs.jukebox,

    // Properties of default config
    type: 'battle',
    volume: 1,

    // Current known implementation of battle BGM IDs
    // see also `main.js#TaskInit.prototype._playBGM` for event battle bgm overrides
    maxBattleId: 268,
    missingBattleIds: [24],

    /**
     * INIT: mandatory
     * Prepares initial static data needed.
     */
    init() {
      this.gameServer = PlayerManager.hq.getServer();
    },

    /**
     * RELOAD: optional
     * Loads latest player or game data if needed.
     */
    reload() {
      this.portbgm = KC3Master._raw.bgm;
      this.mapbgm = KC3Master._raw.mapbgm;
      this.detectMaxBattleBgmId();
      this.loadConfig();
    },

    /**
     * EXECUTE: mandatory
     * Places data onto the interface from scratch.
     */
    execute() {
      this.loadConfig();
      this.initAudioListeners();

      $('.music-types .type').on('click', (e) => {
        this.selectType($(e.target).attr('list-type'));
      });

      this.selectType(this.type);
    },

    detectMaxBattleBgmId() {
      const mapBgmIds = [];
      Object.values(this.mapbgm || {}).forEach(o => {
        mapBgmIds.push(o.api_moving_bgm);
        mapBgmIds.push(...o.api_map_bgm);
        mapBgmIds.push(...o.api_boss_bgm);
      });
      const prev = this.maxBattleId;
      this.maxBattleId = Math.max(this.maxBattleId, ...mapBgmIds);
      if (prev !== this.maxBattleId) { console.debug('Previous maxBattleId', prev); }
      console.debug('Current maxBattleId', this.maxBattleId);
      // Checks if missing ID implemented someday by the way
      this.missingBattleIds.forEach(id => {
        if (mapBgmIds.includes(id)) {
          console.log('Missing battle BGM ID detected', id);
          console.debug('News: missing battle BGM ID detected', id);
        }
      });
    },

    getConfig() {
      return {
        type: this.type,
        volume: this.volume,
      };
    },

    setType(value) {
      this.type = value || 'battle';
    },

    setVolume(value) {
      this.volume = Number(value) || 1;
    },

    loadConfig() {
      let config = localStorage.getObject('srJukebox');
      if (!config) {
        config = this.getConfig();
        this.saveConfig();
      }
      this.setType(config.type);
      this.setVolume(config.volume);
      return config;
    },

    saveConfig() {
      localStorage.setObject('srJukebox', this.getConfig());
    },

    getAudio() {
      return $('.music-player audio').get(0);
    },

    playAudio(src) {
      const audio = this.getAudio();
      const config = this.getConfig();
      audio.volume = config.volume;
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
      this.setType(type);
      this.saveConfig();

      $('.music-types .type').removeClass('active');
      $(`.music-types .type[list-type=${type}]`).addClass('active');
      this.clearList();

      switch (type) {
        case 'port':
          this.loadPortBgms();
          break;
        case 'map':
          this.loadMapBgms();
          break;
        default:
          this.loadBattleBgms();
          break;
      }
    },

    /**
     * Adds elements with information of tracks in current type to cleared list container.
     * @param {Array} bgms - list of bgm, with `api_id` and `api_name`.
     * @param {String} type - type name of bgm path, acceptable: `port`, `battle` and `fanfare`.
     */
    loadBgms(bgms, type) {
      bgms.forEach(bgm => {
        const item = $('.factory .track')
          .clone()
          .appendTo('.music-list')
          .attr('bgm-type', type)
          .attr('bgm-id', bgm.api_id);

        $('.id', item).text('#' + String(bgm.api_id).pad(3, '0'));
        $('.desc', item).text(bgm.api_name || "");
      });

      this.initTrackListeners();
    },

    loadPortBgms() {
      $('.music-list').addClass('list').removeClass('map');
      this.loadBgms(Object.values(this.portbgm), 'port');
    },

    loadBattleBgms() {
      $('.music-list').removeClass('list map');
      const bgms = Array.numbers(1, this.maxBattleId)
        .filter(id => !this.missingBattleIds.includes(id))
        .sort((a, b) => b - a)
        .map(id => ({ api_id: id }));
      this.loadBgms(bgms, 'battle');
    },

    loadMapBgms() {
      $('.music-list').addClass('list map');
      const bgms = [];
      Object.values(this.mapbgm).forEach(bgm => {
        const world = bgm.api_maparea_id, map = bgm.api_no;
        const mapName = [
          KC3Meta.isEventWorld(world) ? world + '-' : '',
          KC3Meta.mapToDesc(world, map)
        ].join('');
        bgms.push({ api_id: bgm.api_moving_bgm, api_name: mapName + ' Overworld' });
        bgms.push({ api_id: bgm.api_map_bgm[0], api_name: mapName + ' Day Battle' });
        bgms.push({ api_id: bgm.api_map_bgm[1], api_name: mapName + ' Night Battle' });
        bgms.push({ api_id: bgm.api_boss_bgm[0], api_name: mapName + ' Day Boss' });
        bgms.push({ api_id: bgm.api_boss_bgm[1], api_name: mapName + ' Night Boss' });
      });
      this.loadBgms(bgms, 'battle');
    },

    initTrackListeners() {
      $('.music-list .track').click(ev => {
        const target = ev.currentTarget;
        const id = $(target).attr('bgm-id');
        const type = $(target).attr('bgm-type');
        const src = `${this.gameServer.urlPrefix}/kcs2/resources${KC3Master.bgm_file(id, type)}`;
        this.playAudio(src);

        $('.music-list .track').removeClass('active');
        $(target).addClass('active');

        $('.music-player .ids span.id').text($('.id', target).text());
        $('.music-player .ids span.type').text(type);
        $('.music-player .desc').text('\u266a ' + $('.desc', target).text());
      });
    },

    /**
     * UPDATE: optional
     * Partially updates elements of the interface, possibly without clearing all contents first.
     */
    update(pageParams) {
      // Returning `true` means updating has been handled.
      return false;
    }

  };
})();
