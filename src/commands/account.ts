// src/commands/account.ts
import {
  getAllAccounts as clientGetAllAccounts, // Aliasing for clarity
  getActiveAccounts as clientGetActiveAccounts,
  createAccount as clientCreateAccount,
  updateAccount as clientUpdateAccount,
  deleteAccount as clientDeleteAccount,
} from '@/clients/accountClient';
import type { Account, NewAccount, AccountUpdate } from '@/lib/types';
import { logger } from '@/adapters';

export const getAccounts = async (): Promise<Account[]> => {
  try {
    return await clientGetAllAccounts();
  } catch (error) {
    logger.error('Error fetching all accounts via client.', { error });
    throw error;
  }
};

export const getActiveAccounts = async (): Promise<Account[]> => {
  try {
    return await clientGetActiveAccounts();
  } catch (error) {
    logger.error('Error fetching active accounts via client.', { error });
    throw error;
  }
};

export const createAccount = async (account: NewAccount): Promise<Account> => {
  try {
    return await clientCreateAccount(account);
  } catch (error) {
    logger.error('Error creating account via client.', { error });
    throw error;
  }
};

export const updateAccount = async (accountUpdate: AccountUpdate): Promise<Account> => {
  try {
    return await clientUpdateAccount(accountUpdate);
  } catch (error) {
    logger.error('Error updating account via client.', { error });
    throw error;
  }
};

export const deleteAccount = async (accountId: string): Promise<void> => {
  try {
    await clientDeleteAccount(accountId);
  } catch (error) {
    logger.error('Error deleting account via client.', { accountId, error });
    throw error;
  }
};
