// src/clients/marketDataClient.ts
import { RUN_ENV, getRunEnv, invokeTauri } from '@/adapters';
import { httpClient } from '@/adapters/http';
import type { Quote, QuoteSummary, MarketDataProviderInfo } from '@/lib/types';
// Assuming Procedures from bindings.ts has definitions for marketData procedures
type Option<T> = T | null | undefined; // Local Option type if not globally available

export const searchSymbol = async (query: string): Promise<QuoteSummary[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('search_symbol', { query });
  } else {
    return httpClient.query(['marketData.searchSymbol', query]);
  }
};

export const requestMarketDataSync = async (symbols: Option<string[]>, refetchAll: boolean): Promise<void> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    // This Tauri command ('sync_market_data') just emits an event and returns Ok(())
    await invokeTauri('sync_market_data', { symbols, refetchAll });
    return;
  } else {
    // The rspc procedure 'marketData.requestSync' is a placeholder
    // It's defined to take [Option<string[]>, boolean]
    // This client call matches that, but the backend functionality is stubbed.
    return httpClient.mutation(['marketData.requestSync', [symbols, refetchAll]]);
  }
};

export const updateQuote = async (quote: Quote): Promise<void> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    await invokeTauri('update_quote', { quote });
    return;
  } else {
    return httpClient.mutation(['marketData.updateQuote', quote]);
  }
};

export const deleteQuote = async (id: string): Promise<void> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    await invokeTauri('delete_quote', { id });
    return;
  } else {
    return httpClient.mutation(['marketData.deleteQuote', id]);
  }
};

export const getQuoteHistory = async (symbol: string): Promise<Quote[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_quote_history', { symbol });
  } else {
    return httpClient.query(['marketData.getQuoteHistory', symbol]);
  }
};

export const getMarketDataProviders = async (): Promise<MarketDataProviderInfo[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_market_data_providers');
  } else {
    return httpClient.query(['marketData.getProviders']);
  }
};
