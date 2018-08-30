(function () {
  const Util = {};

  /*--------------------------------------------------------*/
  /* --------------------[ PUBLIC API ]-------------------- */
  /*--------------------------------------------------------*/

  Util.extractFromJson = fields => (battleData) => {
    const { extendError, zipWith } = KC3BattlePrediction;
    const { normalizeFieldArrays, zipJson } = KC3BattlePrediction.battle.phases;

    if (fields.length === 0) { return []; }

    const arrays = fields.map(name => normalizeFieldArrays(name, battleData[name]));

    if (!arrays.every(array => array.length === arrays[0].length)) {
      throw extendError(new Error('Mismatched length of json arrays'), { battleData, fields });
    }

    return zipWith(zipJson, ...arrays);
  };

  /*--------------------------------------------------------*/
  /* --------------------[ INTERNALS ]--------------------- */
  /*--------------------------------------------------------*/

  /* ----------------[ EXTRACT FROM JSON ]----------------- */

  // Embed the prop name in the array - it will be needed by zipJson()
  Util.normalizeFieldArrays = (propName, array) => {
    return (array || []).map(value => ({ [propName]: value }));
  };

  Util.zipJson = (...elements) => Object.assign({}, ...elements);

  /*--------------------------------------------------------*/
  /* ---------------------[ EXPORTS ]---------------------- */
  /*--------------------------------------------------------*/

  Object.assign(KC3BattlePrediction.battle.phases, Util);
}());
