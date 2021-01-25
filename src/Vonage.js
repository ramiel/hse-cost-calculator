const ONE_MILLION = 1000000;
const FREE_MINUTES = 2000;

export const vonageSubscribedMinutesCost = (
  minutes,
  ignoreFreeMinutes = false
) => {
  let cost = 0;
  const freeMinutes = ignoreFreeMinutes ? 0 : FREE_MINUTES;
  if (minutes < 100000) {
    cost = Math.max(0, minutes - freeMinutes) * 0.00475;
  } else if (minutes >= 100000 && minutes < 500000) {
    const tier1 = 100000 * 0.00475;
    cost = tier1 + (minutes - freeMinutes - 100000) * 0.0045;
  } else if (minutes >= 500000 && minutes < 1.5 * ONE_MILLION) {
    const tier1 = 100000 * 0.00475;
    const tier2 = 400000 * 0.0045;
    cost = tier1 + tier2 + (minutes - freeMinutes - 100000 - 400000) * 0.00425;
  } else if (minutes >= 1.5 * ONE_MILLION && minutes < 5 * ONE_MILLION) {
    const tier1 = 100000 * 0.00475;
    const tier2 = 400000 * 0.0045;
    const tier3 = 1 * ONE_MILLION * 0.00425;
    cost =
      tier1 +
      tier2 +
      tier3 +
      (minutes - freeMinutes - 100000 - 400000 - ONE_MILLION) * 0.004;
  } else {
    throw new Error("Vonage does not support this volume of video chats");
  }
  return cost;
};
