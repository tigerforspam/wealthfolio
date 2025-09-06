import { describe, it, expect } from 'vitest';
import { 
  calculateAllocationPercentage, 
  formatPercentage, 
  calculateTotalPortfolioValue 
} from './portfolio-percentage-utils';
import { Holding, HoldingType } from '@/lib/types';

// Helper function to create a mock holding
const createMockHolding = (marketValueBase: number | null | undefined): Holding => ({
  id: 'test-holding',
  holdingType: HoldingType.STOCK,
  accountId: 'test-account',
  quantity: 100,
  localCurrency: 'USD',
  baseCurrency: 'USD',
  marketValue: {
    local: marketValueBase ?? 0,
    base: marketValueBase ?? 0,
  },
  weight: 0,
  asOfDate: '2024-01-01',
});

describe('calculateAllocationPercentage', () => {
  it('should calculate correct percentage for normal values', () => {
    const holding = createMockHolding(1000);
    const totalValue = 10000;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(10);
  });

  it('should return 0 when total value is zero', () => {
    const holding = createMockHolding(1000);
    const totalValue = 0;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(0);
  });

  it('should return 0 when total value is negative', () => {
    const holding = createMockHolding(1000);
    const totalValue = -5000;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(0);
  });

  it('should handle null market value', () => {
    const holding = createMockHolding(null);
    const totalValue = 10000;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(0);
  });

  it('should handle undefined market value', () => {
    const holding = createMockHolding(undefined);
    const totalValue = 10000;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(0);
  });

  it('should handle negative holding values', () => {
    const holding = createMockHolding(-500);
    const totalValue = 10000;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(-5);
  });

  it('should return 0 for NaN total value', () => {
    const holding = createMockHolding(1000);
    const totalValue = NaN;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(0);
  });

  it('should return 0 for infinite total value', () => {
    const holding = createMockHolding(1000);
    const totalValue = Infinity;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(0);
  });

  it('should handle 100% allocation', () => {
    const holding = createMockHolding(10000);
    const totalValue = 10000;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(100);
  });

  it('should handle greater than 100% allocation', () => {
    const holding = createMockHolding(15000);
    const totalValue = 10000;
    
    const result = calculateAllocationPercentage(holding, totalValue);
    
    expect(result).toBe(150);
  });
});

describe('formatPercentage', () => {
  it('should format normal percentage with 2 decimal places', () => {
    const result = formatPercentage(12.3456);
    
    expect(result).toBe('12.35%');
  });

  it('should format zero percentage', () => {
    const result = formatPercentage(0);
    
    expect(result).toBe('0.00%');
  });

  it('should format 100% correctly', () => {
    const result = formatPercentage(100);
    
    expect(result).toBe('100.00%');
  });

  it('should format percentage greater than 100%', () => {
    const result = formatPercentage(150.789);
    
    expect(result).toBe('150.79%');
  });

  it('should handle negative percentages', () => {
    const result = formatPercentage(-5.123);
    
    expect(result).toBe('-5.12%');
  });

  it('should handle NaN values', () => {
    const result = formatPercentage(NaN);
    
    expect(result).toBe('0.00%');
  });

  it('should handle infinite values', () => {
    const result = formatPercentage(Infinity);
    
    expect(result).toBe('0.00%');
  });

  it('should handle negative infinite values', () => {
    const result = formatPercentage(-Infinity);
    
    expect(result).toBe('0.00%');
  });

  it('should round correctly', () => {
    const result = formatPercentage(12.345);
    
    expect(result).toBe('12.35%');
  });

  it('should handle very small percentages', () => {
    const result = formatPercentage(0.001);
    
    expect(result).toBe('0.00%');
  });
});

describe('calculateTotalPortfolioValue', () => {
  it('should calculate total for multiple holdings', () => {
    const holdings = [
      createMockHolding(1000),
      createMockHolding(2000),
      createMockHolding(3000),
    ];
    
    const result = calculateTotalPortfolioValue(holdings);
    
    expect(result).toBe(6000);
  });

  it('should return 0 for empty array', () => {
    const result = calculateTotalPortfolioValue([]);
    
    expect(result).toBe(0);
  });

  it('should handle null holdings array', () => {
    const result = calculateTotalPortfolioValue(null as any);
    
    expect(result).toBe(0);
  });

  it('should handle undefined holdings array', () => {
    const result = calculateTotalPortfolioValue(undefined as any);
    
    expect(result).toBe(0);
  });

  it('should handle holdings with null market values', () => {
    const holdings = [
      createMockHolding(1000),
      createMockHolding(null),
      createMockHolding(2000),
    ];
    
    const result = calculateTotalPortfolioValue(holdings);
    
    expect(result).toBe(3000);
  });

  it('should handle holdings with undefined market values', () => {
    const holdings = [
      createMockHolding(1000),
      createMockHolding(undefined),
      createMockHolding(2000),
    ];
    
    const result = calculateTotalPortfolioValue(holdings);
    
    expect(result).toBe(3000);
  });

  it('should handle mixed positive and negative values', () => {
    const holdings = [
      createMockHolding(1000),
      createMockHolding(-500),
      createMockHolding(2000),
    ];
    
    const result = calculateTotalPortfolioValue(holdings);
    
    expect(result).toBe(2500);
  });

  it('should handle all zero values', () => {
    const holdings = [
      createMockHolding(0),
      createMockHolding(0),
      createMockHolding(0),
    ];
    
    const result = calculateTotalPortfolioValue(holdings);
    
    expect(result).toBe(0);
  });

  it('should handle infinite values by excluding them', () => {
    const holdingWithInfinity = createMockHolding(1000);
    holdingWithInfinity.marketValue.base = Infinity;
    
    const holdings = [
      createMockHolding(1000),
      holdingWithInfinity,
      createMockHolding(2000),
    ];
    
    const result = calculateTotalPortfolioValue(holdings);
    
    expect(result).toBe(3000);
  });

  it('should handle NaN values by excluding them', () => {
    const holdingWithNaN = createMockHolding(1000);
    holdingWithNaN.marketValue.base = NaN;
    
    const holdings = [
      createMockHolding(1000),
      holdingWithNaN,
      createMockHolding(2000),
    ];
    
    const result = calculateTotalPortfolioValue(holdings);
    
    expect(result).toBe(3000);
  });

  it('should return 0 if all values are invalid', () => {
    const holdingWithNaN = createMockHolding(NaN);
    const holdingWithInfinity = createMockHolding(Infinity);
    
    const holdings = [
      holdingWithNaN,
      holdingWithInfinity,
    ];
    
    const result = calculateTotalPortfolioValue(holdings);
    
    expect(result).toBe(0);
  });
});