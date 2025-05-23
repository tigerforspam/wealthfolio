// src/commands/portfolio.ts
import {
  getHoldings as clientGetHoldings,
  getHolding as clientGetHolding,
  getHistoricalValuations as clientGetHistoricalValuations,
  getIncomeSummary as clientGetIncomeSummary,
  calculateAccountsSimplePerformance as clientCalcSimplePerformance,
  calculatePerformanceHistory as clientCalcPerformanceHistory,
  calculatePerformanceSummary as clientCalcPerformanceSummary,
  requestPortfolioRecalculate as clientRequestPortfolioRecalculate,
  requestPortfolioUpdate as clientRequestPortfolioUpdate,
} from '@/clients/portfolioClient';
import type {
  Holding,
  IncomeSummary,
  DailyAccountValuation,
  PerformanceMetrics,
  SimplePerformanceMetrics,
} from '@/lib/types';
import { logger } from '@/adapters';

export const getHoldings = async (accountId: string): Promise<Holding[]> => {
  try {
    return await clientGetHoldings(accountId);
  } catch (error) {
    logger.error('Error fetching holdings via client.', { accountId, error });
    throw error;
  }
};

export const getHolding = async (accountId: string, assetId: string): Promise<Holding | null> => {
  try {
    return await clientGetHolding(accountId, assetId);
  } catch (error) {
    logger.error('Error fetching specific holding via client.', { accountId, assetId, error });
    throw error;
  }
};

export const getHistoricalValuations = async (
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<DailyAccountValuation[]> => {
  try {
    return await clientGetHistoricalValuations(accountId, startDate, endDate);
  } catch (error) {
    logger.error('Error fetching historical valuations via client.', { accountId, error });
    throw error;
  }
};

export const getIncomeSummary = async (): Promise<IncomeSummary[]> => {
  try {
    return await clientGetIncomeSummary();
  } catch (error) {
    logger.error('Error fetching income summary via client.', { error });
    throw error;
  }
};

export const calculateAccountsSimplePerformance = async (accountIds: string[]): Promise<SimplePerformanceMetrics[]> => {
  try {
    return await clientCalcSimplePerformance(accountIds);
  } catch (error) {
    logger.error('Error calculating accounts simple performance via client.', { error });
    throw error;
  }
};

export const calculatePerformanceHistory = async (
  itemType: string,
  itemId: string,
  startDate?: string,
  endDate?: string
): Promise<PerformanceMetrics> => {
  try {
    return await clientCalcPerformanceHistory(itemType, itemId, startDate, endDate);
  } catch (error) {
    logger.error('Error calculating performance history via client.', { itemType, itemId, error });
    throw error;
  }
};

export const calculatePerformanceSummary = async (
  itemType: string,
  itemId: string,
  startDate?: string,
  endDate?: string
): Promise<PerformanceMetrics> => {
  try {
    return await clientCalcPerformanceSummary(itemType, itemId, startDate, endDate);
  } catch (error) {
    logger.error('Error calculating performance summary via client.', { itemType, itemId, error });
    throw error;
  }
};

// Commands that were previously event emitters in Tauri
export const recalculatePortfolio = async (): Promise<void> => {
  try {
    // Calls clientRequestPortfolioRecalculate from portfolioClient
    await clientRequestPortfolioRecalculate();
  } catch (error) {
    logger.error('Error requesting portfolio recalculate via client.', { error });
    throw error;
  }
};

export const updatePortfolio = async (): Promise<void> => {
  try {
    // Calls clientRequestPortfolioUpdate from portfolioClient
    await clientRequestPortfolioUpdate();
  } catch (error) {
    logger.error('Error requesting portfolio update via client.', { error });
    throw error;
  }
};
