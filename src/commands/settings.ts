// src/commands/settings.ts
import {
  getSettings as clientGetSettings,
  updateSettings as clientUpdateSettings,
  // Exchange rate functions are also in settingsClient, but will be called from exchange-rates.ts
} from '@/clients/settingsClient';
import type { Settings, SettingsUpdate } from '@/lib/types';
import { logger } from '@/adapters';

export const getSettings = async (): Promise<Settings> => {
  try {
    return await clientGetSettings();
  } catch (error) {
    logger.error('Error fetching settings via client.', { error });
    throw error;
  }
};

export const updateSettings = async (settingsUpdate: SettingsUpdate): Promise<Settings> => {
  try {
    return await clientUpdateSettings(settingsUpdate);
  } catch (error) {
    logger.error('Error updating settings via client.', { error });
    throw error;
  }
};
