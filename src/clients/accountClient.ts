// src/clients/accountClient.ts
import { RUN_ENV, getRunEnv, invokeTauri } from '@/adapters';
import { httpClient } from '@/adapters/http';
import type { Account, NewAccount, AccountUpdate } from '@/lib/types';
// Procedures type should provide specific input/result types for these keys
// For example, Procedures['queries']['accounts.getAll']['result'] should be Account[]

export const getAllAccounts = async (): Promise<Account[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_accounts');
  } else {
    return httpClient.query(['accounts.getAll']);
  }
};

export const getActiveAccounts = async (): Promise<Account[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_active_accounts');
  } else {
    return httpClient.query(['accounts.getActive']);
  }
};

export const createAccount = async (account: NewAccount): Promise<Account> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('create_account', { account });
  } else {
    return httpClient.mutation(['accounts.create', account]);
  }
};

export const updateAccount = async (accountUpdate: AccountUpdate): Promise<Account> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('update_account', { accountUpdate });
  } else {
    return httpClient.mutation(['accounts.update', accountUpdate]);
  }
};

export const deleteAccount = async (accountId: string): Promise<void> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    // Tauri command `delete_account` returns Result<(), String>
    // We adapt to Promise<void> for consistency if successful
    await invokeTauri('delete_account', { accountId });
    return;
  } else {
    return httpClient.mutation(['accounts.delete', accountId]);
  }
};
