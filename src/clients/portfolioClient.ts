// src/clients/portfolioClient.ts
import { RUN_ENV, getRunEnv, invokeTauri } from '@/adapters';
import { httpClient } from '@/adapters/http';
import type {
  Holding,
  IncomeSummary,
  DailyAccountValuation,
  PerformanceMetrics,
  SimplePerformanceMetrics
} from '@/lib/types';
import type { ItemDateRangeArgs, TypedItemDateRangeArgs } from '../bindings'; // Assuming these are exported from bindings.ts

// Local Option type if not globally available
type Option<T> = T | null | undefined;

export const getHoldings = async (accountId: string): Promise<Holding[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_holdings', { accountId });
  } else {
    return httpClient.query(['portfolio.getHoldings', accountId]);
  }
};

export const getHolding = async (accountId: string, assetId: string): Promise<Holding | null> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_holding', { accountId, assetId });
  } else {
    // rspc input is [string, string]
    return httpClient.query(['portfolio.getHolding', [accountId, assetId]]);
  }
};

export const getHistoricalValuations = async (
  accountId: string,
  startDate?: string,
  endDate?: string
): Promise<DailyAccountValuation[]> => {
  const args: ItemDateRangeArgs = { item_id: accountId, start_date: startDate, end_date: endDate };
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_historical_valuations', { accountId, startDate, endDate });
  } else {
    return httpClient.query(['portfolio.getHistoricalValuations', args]);
  }
};

export const getIncomeSummary = async (): Promise<IncomeSummary[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_income_summary');
  } else {
    return httpClient.query(['portfolio.getIncomeSummary']);
  }
};

export const calculateAccountsSimplePerformance = async (accountIds: string[]): Promise<SimplePerformanceMetrics[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('calculate_accounts_simple_performance', { accountIds });
  } else {
    return httpClient.query(['portfolio.calculateSimplePerformance', accountIds]);
  }
};

export const calculatePerformanceHistory = async (
  itemType: string,
  itemId: string,
  startDate?: string,
  endDate?: string
): Promise<PerformanceMetrics> => {
  const args: TypedItemDateRangeArgs = { item_type: itemType, item_id: itemId, start_date: startDate, end_date: endDate };
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('calculate_performance_history', { itemType, itemId, startDate, endDate });
  } else {
    return httpClient.query(['portfolio.calculatePerformanceHistory', args]);
  }
};

export const calculatePerformanceSummary = async (
  itemType: string,
  itemId: string,
  startDate?: string,
  endDate?: string
): Promise<PerformanceMetrics> => {
  const args: TypedItemDateRangeArgs = { item_type: itemType, item_id: itemId, start_date: startDate, end_date: endDate };
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('calculate_performance_summary', { itemType, itemId, startDate, endDate });
  } else {
    return httpClient.query(['portfolio.calculatePerformanceSummary', args]);
  }
};

// Placeholders for event-driven commands
export const requestPortfolioRecalculate = async (): Promise<void> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    await invokeTauri('recalculate_portfolio'); // Tauri command takes no args, just AppHandle
    return;
  } else {
    // rspc procedure 'portfolio.requestRecalculate' is a placeholder
    return httpClient.mutation(['portfolio.requestRecalculate', undefined]); // input: void
  }
};

export const requestPortfolioUpdate = async (): Promise<void> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    await invokeTauri('update_portfolio'); // Tauri command takes no args, just AppHandle
    return;
  } else {
    // rspc procedure 'portfolio.requestUpdate' is a placeholder
    return httpClient.mutation(['portfolio.requestUpdate', undefined]); // input: void
  }
};
