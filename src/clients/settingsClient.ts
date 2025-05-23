// src/clients/settingsClient.ts
import { RUN_ENV, getRunEnv, invokeTauri } from '@/adapters';
import { httpClient } from '@/adapters/http';
import type { Settings, SettingsUpdate, ExchangeRate, NewExchangeRate } from '@/lib/types';
// Assuming Procedures from bindings.ts has definitions for settings and fx procedures

// Settings
export const getSettings = async (): Promise<Settings> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_settings');
  } else {
    return httpClient.query(['settings.get']);
  }
};

export const updateSettings = async (settingsUpdate: SettingsUpdate): Promise<Settings> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('update_settings', { settingsUpdate });
  } else {
    return httpClient.mutation(['settings.update', settingsUpdate]);
  }
};

// Exchange Rates (Fx)
export const getExchangeRates = async (): Promise<ExchangeRate[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_exchange_rates');
  } else {
    return httpClient.query(['settings.getExchangeRates']);
  }
};

export const addExchangeRate = async (newRate: NewExchangeRate): Promise<ExchangeRate> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('add_exchange_rate', { newRate });
  } else {
    return httpClient.mutation(['settings.addExchangeRate', newRate]);
  }
};

export const updateExchangeRate = async (rate: ExchangeRate): Promise<ExchangeRate> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('update_exchange_rate', { rate });
  } else {
    return httpClient.mutation(['settings.updateExchangeRate', rate]);
  }
};

export const deleteExchangeRate = async (rateId: string): Promise<void> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    await invokeTauri('delete_exchange_rate', { rateId });
    return;
  } else {
    return httpClient.mutation(['settings.deleteExchangeRate', rateId]);
  }
};
