// Parser for 航空 (aerial combat) phase
(function () {
  const COMBINED_FLEET_MAIN_ALIGN = 6;
  const Kouku = {};
  const { pipe, juxt, flatten, map, filter, Side } = KC3BattlePrediction;
  /*--------------------------------------------------------*/
  /* ----------------------[ PUBLIC ]---------------------- */
  /*--------------------------------------------------------*/

  Kouku.parseKouku = (battleData) => {
    const { createAttack } = KC3BattlePrediction.battle;
    const {
      mergeFleetDamageArrays,
      parsePlayerJson,
      parseEnemyJson,
      isDamagingAttack,
    } = KC3BattlePrediction.battle.phases.kouku;

    return pipe(
      mergeFleetDamageArrays,
      juxt([parsePlayerJson, parseEnemyJson]),
      flatten,
      filter(isDamagingAttack),
      map(createAttack)
    )(battleData);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ INTERNAL ]--------------------- */
  /*--------------------------------------------------------*/

  // Combine the damage arrays for main and escort fleets
  Kouku.mergeFleetDamageArrays = ({ api_stage3, api_stage3_combined }) => {
    const { padAndConcatFleetArrays } = KC3BattlePrediction.battle.phases.kouku;
    return {
      api_fdam: padAndConcatFleetArrays(
        (api_stage3 && api_stage3.api_fdam) || [],
        (api_stage3_combined && api_stage3_combined.api_fdam) || []
      ),
      api_edam: padAndConcatFleetArrays(
        (api_stage3 && api_stage3.api_edam) || [],
        (api_stage3_combined && api_stage3_combined.api_edam) || []
      ),
    };
  };

  // Pad main fleet array with 0 damage to guarantee escort fleet position starts from 6
  Kouku.padAndConcatFleetArrays = (mainArr, escortArr) => (
    escortArr.length > 0 ?
      mainArr.concat(
        Array(Math.max(0, COMBINED_FLEET_MAIN_ALIGN - mainArr.length)).fill(0),
        escortArr) :
      mainArr.slice(0)
  );

  Kouku.parsePlayerJson = ({ api_fdam }) => api_fdam.map(
    (damage, position) => ({ damage, defender: { side: Side.PLAYER, position } })
  );
  Kouku.parseEnemyJson = ({ api_edam }) => api_edam.map(
    (damage, position) => ({ damage, defender: { side: Side.ENEMY, position } })
  );

  Kouku.isDamagingAttack = ({ damage }) => damage > 0;

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.kouku, Kouku);
}());
