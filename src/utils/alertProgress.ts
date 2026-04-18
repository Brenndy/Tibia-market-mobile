import { WatchAlert, getBuyCondition, getSellCondition } from '@/src/context/WatchlistContext';

// Maps current vs threshold to a 0..1 fill showing how close the alert is.
// Full = triggered. 0 = price is more than WINDOW away from threshold.
export function alertProgress(
  currentBuy: number | null,
  currentSell: number | null,
  alert: WatchAlert,
): { buy: number; sell: number; anyTriggered: boolean } {
  const WINDOW = 0.2;
  let buy = 0;
  let sell = 0;
  let anyTriggered = false;
  if (alert.buyAlert != null && currentBuy != null && currentBuy > 0) {
    const cond = getBuyCondition(alert);
    const triggered =
      cond === 'below' ? currentBuy <= alert.buyAlert : currentBuy >= alert.buyAlert;
    if (triggered) {
      buy = 1;
      anyTriggered = true;
    } else {
      const dist =
        cond === 'below'
          ? (currentBuy - alert.buyAlert) / alert.buyAlert
          : (alert.buyAlert - currentBuy) / alert.buyAlert;
      buy = Math.max(0, 1 - dist / WINDOW);
    }
  }
  if (alert.sellAlert != null && currentSell != null && currentSell > 0) {
    const cond = getSellCondition(alert);
    const triggered =
      cond === 'above' ? currentSell >= alert.sellAlert : currentSell <= alert.sellAlert;
    if (triggered) {
      sell = 1;
      anyTriggered = true;
    } else {
      const dist =
        cond === 'above'
          ? (alert.sellAlert - currentSell) / alert.sellAlert
          : (currentSell - alert.sellAlert) / alert.sellAlert;
      sell = Math.max(0, 1 - dist / WINDOW);
    }
  }
  return { buy, sell, anyTriggered };
}
