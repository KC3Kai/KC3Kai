(function () {
  const battle = {};

  // Phase parsers are defined as factories to avoid load order dependency
  // NB: May be worth caching instances if performance is an issue
  battle.phaseParserMap = {
    airBaseInjection: ({ parseKouku }) => ({ api_air_base_injection }) => parseKouku(api_air_base_injection),
    injectionKouku: ({ parseKouku }) => ({ api_injection_kouku }) => parseKouku(api_injection_kouku),
    airBaseAttack: ({ parseKouku }) => ({ api_air_base_attack = [] }) =>
      api_air_base_attack.reduce((result, wave) => result.concat(parseKouku(wave)), []),
    kouku: ({ parseKouku }) => ({ api_kouku }) => parseKouku(api_kouku),
    kouku2: ({ parseKouku }) => ({ api_kouku2 }) => parseKouku(api_kouku2),
    support: ({ parseSupport }) => ({ api_support_info }) => parseSupport(api_support_info),
    openingTaisen: ({ parseHougeki }) => ({ api_opening_taisen }) => parseHougeki(api_opening_taisen),
    openingAtack: ({ parseRaigeki }) => ({ api_opening_atack }) => parseRaigeki(api_opening_atack),
    hougeki1: ({ parseHougeki }) => ({ api_hougeki1 }) => parseHougeki(api_hougeki1),
    hougeki2: ({ parseHougeki }) => ({ api_hougeki2 }) => parseHougeki(api_hougeki2),
    hougeki3: ({ parseHougeki }) => ({ api_hougeki3 }) => parseHougeki(api_hougeki3),
    raigeki: ({ parseRaigeki }) => ({ api_raigeki }) => parseRaigeki(api_raigeki),
    nSupport: ({ parseSupport }) => ({ api_n_support_info }) => parseSupport(api_n_support_info),
    nHougeki1: ({ parseHougeki }) => ({ api_n_hougeki1 }) => parseHougeki(api_n_hougeki1),
    nHougeki2: ({ parseHougeki }) => ({ api_n_hougeki2 }) => parseHougeki(api_n_hougeki2),
    // nb shelling
    hougeki: ({ parseHougeki }) => ({ api_hougeki }) => parseHougeki(api_hougeki),
  };

  const wrapParser = parser => battleData => (battleData ? parser(battleData) : []);
  battle.getParsers = () => {
    const {
      kouku: { parseKouku },
      support: { parseSupport },
      hougeki: { parseHougeki },
      raigeki: { parseRaigeki },
    } = KC3BattlePrediction.battle.phases;

    return {
      parseKouku: wrapParser(parseKouku),
      parseSupport: wrapParser(parseSupport),
      parseHougeki: wrapParser(parseHougeki),
      parseRaigeki: wrapParser(parseRaigeki),
    };
  };

  battle.getPhaseParser = (phaseName) => {
    const { phaseParserMap, getParsers } = KC3BattlePrediction.battle;

    if (!phaseParserMap[phaseName]) { throw new Error(`Bad phase: ${phaseName}`); }

    return phaseParserMap[phaseName](getParsers());
  };

  Object.assign(window.KC3BattlePrediction.battle, battle);
}());
