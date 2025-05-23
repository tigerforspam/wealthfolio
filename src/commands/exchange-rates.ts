// src/commands/exchange-rates.ts
import {
  getExchangeRates as clientGetExchangeRates,
  addExchangeRate as clientAddExchangeRate,
  updateExchangeRate as clientUpdateExchangeRate,
  deleteExchangeRate as clientDeleteExchangeRate,
} from '@/clients/settingsClient'; // Note: Using settingsClient for FX functions
import type { ExchangeRate, NewExchangeRate } from '@/lib/types';
import { logger } from '@/adapters';

export const getExchangeRates = async (): Promise<ExchangeRate[]> => {
  try {
    return await clientGetExchangeRates();
  } catch (error) {
    logger.error('Error fetching exchange rates via client.', { error });
    throw error;
  }
};

export const addExchangeRate = async (newRate: NewExchangeRate): Promise<ExchangeRate> => {
  try {
    return await clientAddExchangeRate(newRate);
  } catch (error) {
    logger.error('Error adding exchange rate via client.', { error });
    throw error;
  }
};

export const updateExchangeRate = async (rate: ExchangeRate): Promise<ExchangeRate> => {
  try {
    return await clientUpdateExchangeRate(rate);
  } catch (error) {
    logger.error('Error updating exchange rate via client.', { error });
    throw error;
  }
};

export const deleteExchangeRate = async (rateId: string): Promise<void> => {
  try {
    await clientDeleteExchangeRate(rateId);
  } catch (error) {
    logger.error('Error deleting exchange rate via client.', { rateId, error });
    throw error;
  }
};
