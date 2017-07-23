(function () {
  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  const parseHougeki = (playerRole, battleData) => {
    const { parseTargets, parseDamages, zipAttacks } = KC3BattlePrediction.battle.phases.hougeki;

    return zipAttacks(parseTargets(playerRole, battleData), parseDamages(battleData));
  };

  const parseCombinedHougeki = (battleData) => {
    const { parseCombinedTargets, parseDamages, zipAttacks }
      = KC3BattlePrediction.battle.phases.hougeki;

    return zipAttacks(parseCombinedTargets(battleData), parseDamages(battleData));
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ---------------------[ TARGETS ]---------------------- */

  const parseTargets = (playerRole, { api_df_list } = {}) => {
    const { normalizeArrayIndexing, bind } = KC3BattlePrediction;
    const { normalizeTargetFormat, convertToTarget } = KC3BattlePrediction.battle.phases.hougeki;

    if (!api_df_list) { throw new Error('No api_df_list in battle data'); }

    const targets = normalizeTargetFormat(normalizeArrayIndexing(api_df_list));
    return targets.map(bind(convertToTarget, playerRole));
  };

  // Unpack target index from the array KCAPI uses for each attack
  const normalizeTargetFormat = (dfList) => {
    return dfList.map((indexes) => {
      // Both indexes for a double attack should be the same
      if (!indexes.every(x => x === indexes[0])) {
        throw new Error(`Bad index: [${indexes}]`);
      }
      return indexes[0];
    });
  };

  const convertToTarget = (playerRole, targetIndex) => {
    const { Side, Role } = KC3BattlePrediction;

    if (targetIndex < 1 || targetIndex > 12 || targetIndex !== Math.floor(targetIndex)) {
      throw new Error(`Bad target index: ${targetIndex}`);
    }

    // Note: KCACPI uses 1-based indexes, so we need to convert to 0-based indexing
    if (targetIndex <= 6) {
      return { side: Side.PLAYER, role: playerRole, position: targetIndex - 1 };
    }
    return { side: Side.ENEMY, role: Role.MAIN_FLEET, position: targetIndex - 7 };
  };

  /* --------------[ COMBINED FLEET TARGETS ]-------------- */

  const parseCombinedTargets = ({ api_df_list, api_at_eflag } = {}) => {
    const { normalizeArrayIndexing: normalize } = KC3BattlePrediction;
    const {
      parseCombinedTargetIndexes: parseIndexes,
      parseCombinedTargetSides: parseSides,
      zipCombinedTargets,
    } = KC3BattlePrediction.battle.phases.hougeki;

    if (!api_df_list) { throw new Error('No api_df_list in battle data'); }
    if (!api_at_eflag) { throw new Error('No api_at_eflag in battle data'); }

    const indexes = parseIndexes(normalize(api_df_list));
    const sides = parseSides(normalize(api_at_eflag));

    return zipCombinedTargets(indexes, sides);
  };

  const parseCombinedTargetIndexes = (dfList) => {
    const { normalizeTargetFormat, convertToCombinedTargetIndex }
      = KC3BattlePrediction.battle.phases.hougeki;

    const targetIndexes = normalizeTargetFormat(dfList);
    return targetIndexes.map(convertToCombinedTargetIndex);
  };

  const convertToCombinedTargetIndex = (targetIndex) => {
    const { Role } = KC3BattlePrediction;

    if (targetIndex < 1 || targetIndex > 12 || targetIndex !== Math.floor(targetIndex)) {
      throw new Error(`Bad target index: ${targetIndex}`);
    }

    // KCAPI uses 1-based indexes, so we need to convert to 0-base
    return targetIndex <= 6
      ? { role: Role.MAIN_FLEET, position: targetIndex - 1 }
      : { role: Role.ESCORT_FLEET, position: targetIndex - 7 };
  };

  const parseCombinedTargetSides = (atEFlags) => {
    const { Side } = KC3BattlePrediction;

    return atEFlags.map((eFlag) => {
      switch (eFlag) {
        case 0: return Side.ENEMY;
        case 1: return Side.PLAYER;
        default: throw new Error(`Bad eFlag: ${eFlag}`);
      }
    });
  };

  const zipCombinedTargets = (indexes, sides) => {
    if (indexes.length !== sides.length) {
      throw new Error(`Mismatched number of indexes (${indexes.length}) and sides (${sides.length})`);
    }
    return indexes.map(({ role, position }, i) => {
      const side = sides[i];
      return { side, role, position };
    });
  };

  /* ----------------------[ DAMAGE ]---------------------- */

  const parseDamages = ({ api_damage } = {}) => {
    const { normalizeArrayIndexing } = KC3BattlePrediction;
    const { convertToDamage } = KC3BattlePrediction.battle.phases.hougeki;

    if (!api_damage) { throw new Error('No api_damage in battle data'); }

    const damages = normalizeArrayIndexing(api_damage);
    return damages.map(convertToDamage);
  };

  const convertToDamage = (damages) => {
    return damages.reduce((sum, x) => sum + x, 0);
  };

  /* ---------------------[ ATTACKS ]---------------------- */

  const zipAttacks = (targets, damages) => {
    const { createAttack } = KC3BattlePrediction.battle;

    if (targets.length !== damages.length) { throw new Error('Mismatched number of targets and damages'); }

    return targets.reduce((result, { side, role, position }, index) => {
      const attack = createAttack(side, role, position, damages[index]);
      return attack.damage ? result.concat(attack) : result;
    }, []);
  };

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases.hougeki, {
    // Public
    parseHougeki,
    parseCombinedHougeki,
    // Internal
    parseTargets,
    normalizeTargetFormat,
    convertToTarget,

    parseCombinedTargets,
    parseCombinedTargetIndexes,
    convertToCombinedTargetIndex,
    parseCombinedTargetSides,
    zipCombinedTargets,

    parseDamages,
    convertToDamage,

    zipAttacks,
  });
}());
