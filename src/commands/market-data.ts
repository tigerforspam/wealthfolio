// src/commands/market-data.ts
import {
  searchSymbol as clientSearchSymbol,
  requestMarketDataSync as clientRequestMarketDataSync,
  updateQuote as clientUpdateQuote,
  deleteQuote as clientDeleteQuote,
  getQuoteHistory as clientGetQuoteHistory,
  getMarketDataProviders as clientGetMarketDataProviders,
} from '@/clients/marketDataClient';
import type { Quote, QuoteSummary, MarketDataProviderInfo } from '@/lib/types';
import { logger } from '@/adapters';
type Option<T> = T | null | undefined;

export const searchSymbol = async (query: string): Promise<QuoteSummary[]> => {
  try {
    return await clientSearchSymbol(query);
  } catch (error) {
    logger.error('Error searching symbol via client.', { query, error });
    throw error;
  }
};

export const syncMarketData = async (symbols: Option<string[]>, refetchAll: boolean): Promise<void> => {
  try {
    // Note: The client function is named requestMarketDataSync
    await clientRequestMarketDataSync(symbols, refetchAll);
  } catch (error) {
    logger.error('Error requesting market data sync via client.', { error });
    throw error;
  }
};

export const updateQuote = async (quote: Quote): Promise<void> => {
  try {
    await clientUpdateQuote(quote);
  } catch (error) {
    logger.error('Error updating quote via client.', { error });
    throw error;
  }
};

export const deleteQuote = async (id: string): Promise<void> => {
  try {
    await clientDeleteQuote(id);
  } catch (error) {
    logger.error('Error deleting quote via client.', { id, error });
    throw error;
  }
};

export const getQuoteHistory = async (symbol: string): Promise<Quote[]> => {
  try {
    return await clientGetQuoteHistory(symbol);
  } catch (error) {
    logger.error('Error fetching quote history via client.', { symbol, error });
    throw error;
  }
};

export const getMarketDataProviders = async (): Promise<MarketDataProviderInfo[]> => {
  try {
    return await clientGetMarketDataProviders();
  } catch (error) {
    logger.error('Error fetching market data providers via client.', { error });
    throw error;
  }
};
