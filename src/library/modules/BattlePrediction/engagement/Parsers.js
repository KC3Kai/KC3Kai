(function () {
  /*--------------------------------------------------------*/
  /* ------------------[ PARSER FACTORY ]------------------ */
  /*--------------------------------------------------------*/
  const parseAs = (parseFunc, json) => (json ? parseFunc(json) : []);

  const parserFactory = (() => {
    const parsers = {
      airBaseInjection(kouku) {
        return ({ api_air_base_injection }) => parseAs(kouku, api_air_base_injection);
      },
      injectionKouku(kouku) {
        return ({ api_injection_kouku }) => parseAs(kouku, api_injection_kouku);
      },
      airBaseAttack(kouku) {
        return ({ api_air_base_attack = [] }) =>
          api_air_base_attack
            .map(wave => parseAs(kouku, wave))
            .reduce((result, attacks) => result.concat(attacks), []);
      },
      kouku(kouku) {
        return ({ api_kouku }) => parseAs(kouku, api_kouku);
      },
      kouku2(kouku) {
        return ({ api_kouku2 }) => parseAs(kouku, api_kouku2);
      },
      support(support) {
        return ({ api_support_info }) => parseAs(support, api_support_info);
      },
      openingTaisen(hougeki) {
        return ({ api_opening_taisen }) => parseAs(hougeki, api_opening_taisen);
      },
      openingAtack(raigeki) {
        return ({ api_opening_atack }) => parseAs(raigeki, api_opening_atack);
      },
      hougeki1(hougeki) {
        return ({ api_hougeki1 }) => parseAs(hougeki, api_hougeki1);
      },
      hougeki2(hougeki) {
        return ({ api_hougeki2 }) => parseAs(hougeki, api_hougeki2);
      },
      hougeki3(hougeki) {
        return ({ api_hougeki3 }) => parseAs(hougeki, api_hougeki3);
      },
      raigeki(raigeki) {
        return ({ api_raigeki }) => parseAs(raigeki, api_raigeki);
      },
      midnight(yasen) {
        const { Role, bind } = KC3BattlePrediction;

        const getEnemyRole = (api_active_deck) => {
          // active deck isn't specified for enemy single fleet
          if (!api_active_deck) { return Role.MAIN_FLEET; }

          switch (api_active_deck[1]) {
            case 1:
              return Role.MAIN_FLEET;
            case 2:
              return Role.ESCORT_FLEET;
            default:
              throw new Error(`Bad api_active_deck: ${api_active_deck}`);
          }
        };

        return ({ api_hougeki, api_active_deck }) => {
          return parseAs(bind(yasen, getEnemyRole(api_active_deck)), api_hougeki);
        };
      },
    };

    return {
      create(parserName, ...args) {
        return parsers[parserName](...args);
      },
    };
  })();

  Object.assign(KC3BattlePrediction.battle.engagement, { parserFactory });
}());
