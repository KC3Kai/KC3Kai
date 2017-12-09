(function () {
  const createTarget = ({ side, position }) => {
    const { validateEnum, battle: { validatePosition }, Side } = KC3BattlePrediction;

    if (!validateEnum(Side, side)) { throw new Error(`Bad side: ${side}`); }
    if (!validatePosition(position)) { throw new Error(`Bad position: ${position}`); }

    return Object.freeze({ side, position });
  };

  // Sanity check position index - should be an integer in range [0,7)
  // Since 2017-11-17 (Event Fall 2017) 7 player ships fleet available
  const validatePosition = (position) => {
    return position >= 0 && position < 12 && position === Math.floor(position);
  };

  Object.assign(window.KC3BattlePrediction.battle, { createTarget, validatePosition });
}());
