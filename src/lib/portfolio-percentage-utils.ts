import { Holding } from '@/lib/types';

/**
 * Calculates the allocation percentage of a holding relative to the total portfolio value
 * @param holding - The holding to calculate percentage for
 * @param totalValue - The total portfolio value in base currency
 * @returns The allocation percentage (0-100)
 */
export const calculateAllocationPercentage = (holding: Holding, totalValue: number): number => {
  // Handle edge cases
  if (totalValue <= 0) {
    return 0;
  }

  // Get holding value in base currency, default to 0 if null/undefined
  const holdingValue = holding.marketValue?.base ?? 0;

  // Calculate percentage
  const percentage = (holdingValue / totalValue) * 100;

  // Handle NaN results
  if (isNaN(percentage) || !isFinite(percentage)) {
    return 0;
  }

  return percentage;
};

/**
 * Formats a decimal percentage value to a string with 2 decimal places
 * @param percentage - The percentage value (0-100)
 * @returns Formatted percentage string (e.g., "12.34%")
 */
export const formatPercentage = (percentage: number): string => {
  // Handle edge cases
  if (isNaN(percentage) || !isFinite(percentage)) {
    return '0.00%';
  }

  return `${percentage.toFixed(2)}%`;
};

/**
 * Calculates the total portfolio value by summing all holdings' base market values
 * @param holdings - Array of holdings to sum
 * @returns Total portfolio value in base currency
 */
export const calculateTotalPortfolioValue = (holdings: Holding[]): number => {
  // Handle empty array
  if (!holdings || holdings.length === 0) {
    return 0;
  }

  const total = holdings.reduce((sum, holding) => {
    // Get market value in base currency, default to 0 if null/undefined
    const holdingValue = holding.marketValue?.base ?? 0;
    
    // Only add finite numbers
    if (isFinite(holdingValue)) {
      return sum + holdingValue;
    }
    
    return sum;
  }, 0);

  // Handle NaN results
  if (isNaN(total) || !isFinite(total)) {
    return 0;
  }

  return total;
};