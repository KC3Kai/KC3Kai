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
      nSupport(support) {
        return ({ api_n_support_info }) => parseAs(support, api_n_support_info);
      },
      nHougeki1(hougeki) {
        return ({ api_n_hougeki1 }) => parseAs(hougeki, api_n_hougeki1);
      },
      nHougeki2(hougeki) {
        return ({ api_n_hougeki2 }) => parseAs(hougeki, api_n_hougeki2);
      },
      midnight(yasen) {
        return ({ api_hougeki }) => parseAs(yasen, api_hougeki);
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
