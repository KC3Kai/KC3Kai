// Parser for 航空 (aerial combat) phase
(function () {
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  const parseKouku = ({ api_stage3, api_stage3_combined }) => {
    const { getAttacksToMainOrEscort } = KC3BattlePrediction.battle.phases.kouku;

    const mainAttacks = api_stage3 ? getAttacksToMainOrEscort('main', api_stage3) : [];
    const escortAttacks = api_stage3_combined ? getAttacksToMainOrEscort('escort', api_stage3_combined) : [];

    return mainAttacks.concat(escortAttacks);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  const getAttacksToMainOrEscort = (role, { api_fdam, api_edam }) => {
    const { parseDamageArray } = KC3BattlePrediction.battle.phases.kouku;

    const playerAttacks = api_fdam ? parseDamageArray('player', role, api_fdam) : [];
    const enemyAttacks = api_edam ? parseDamageArray('enemy', role, api_edam) : [];

    return playerAttacks.concat(enemyAttacks);
  };

  const parseDamageArray = (side, role, damageArray) => {
    const { normalizeArrayIndexing, battle: { createAttack } } = KC3BattlePrediction;

    const damages = normalizeArrayIndexing(damageArray);
    return damages.reduce((result, damage, position) => {
      const attack = createAttack(side, role, position, damage);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.kouku, {
    parseKouku,
    getAttacksToMainOrEscort,
    parseDamageArray,
  });
}());
