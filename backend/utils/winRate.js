/**
 * Calculate win rate based on reached targets
 * TP1 reached: 0.3 (30%)
 * TP2 reached: 0.6 (60%)
 * TP3 reached: 1.0 (100%)
 * TP4+ reached: 1.0 (100%)
 */
export const calculateWinRate = (signal) => {
  if (!signal.targets || signal.targets.length === 0) {
    return 0;
  }

  // Find the highest reached target index (0-based)
  let highestReachedIndex = -1;
  for (let i = 0; i < signal.targets.length; i++) {
    if (signal.targets[i].reached) {
      highestReachedIndex = i;
    }
  }

  // If no targets reached, return 0
  if (highestReachedIndex === -1) {
    return 0;
  }

  // Calculate win rate based on highest reached TP
  // TP1 (index 0) = 0.3
  // TP2 (index 1) = 0.6
  // TP3+ (index 2+) = 1.0
  if (highestReachedIndex === 0) {
    return 0.3; // TP1 reached
  } else if (highestReachedIndex === 1) {
    return 0.6; // TP2 reached
  } else {
    return 1.0; // TP3 or higher reached
  }
};

/**
 * Calculate total win rate for multiple signals
 */
export const calculateTotalWinRate = (signals) => {
  if (!signals || signals.length === 0) {
    return 0;
  }

  const totalWinRate = signals.reduce((sum, signal) => {
    return sum + calculateWinRate(signal);
  }, 0);

  return totalWinRate / signals.length;
};

/**
 * Check if signal is a win based on reached targets
 * Win if TP1 or higher is reached
 */
export const isWin = (signal) => {
  return calculateWinRate(signal) > 0;
};
