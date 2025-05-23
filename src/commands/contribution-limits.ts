// src/commands/contribution-limits.ts
import {
  getContributionLimits as clientGetContributionLimits,
  createContributionLimit as clientCreateContributionLimit,
  updateContributionLimit as clientUpdateContributionLimit,
  deleteContributionLimit as clientDeleteContributionLimit,
  calculateDepositsForContributionLimit as clientCalculateDeposits,
} from '@/clients/limitsClient'; // Note: client is limitsClient.ts
import type { ContributionLimit, NewContributionLimit, DepositsCalculation } from '@/lib/types';
import { logger } from '@/adapters';

export const getContributionLimits = async (): Promise<ContributionLimit[]> => {
  try {
    return await clientGetContributionLimits();
  } catch (error) {
    logger.error('Error fetching contribution limits via client.', { error });
    throw error;
  }
};

export const createContributionLimit = async (newLimit: NewContributionLimit): Promise<ContributionLimit> => {
  try {
    return await clientCreateContributionLimit(newLimit);
  } catch (error) {
    logger.error('Error creating contribution limit via client.', { error });
    throw error;
  }
};

export const updateContributionLimit = async (id: string, updatedLimit: NewContributionLimit): Promise<ContributionLimit> => {
  try {
    return await clientUpdateContributionLimit(id, updatedLimit);
  } catch (error) {
    logger.error('Error updating contribution limit via client.', { id, error });
    throw error;
  }
};

export const deleteContributionLimit = async (id: string): Promise<void> => {
  try {
    await clientDeleteContributionLimit(id);
  } catch (error) {
    logger.error('Error deleting contribution limit via client.', { id, error });
    throw error;
  }
};

export const calculateDepositsForContributionLimit = async (limitId: string): Promise<DepositsCalculation> => {
  try {
    return await clientCalculateDeposits(limitId);
  } catch (error) {
    logger.error('Error calculating deposits for contribution limit via client.', { limitId, error });
    throw error;
  }
};
