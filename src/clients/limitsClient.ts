// src/clients/limitsClient.ts
import { RUN_ENV, getRunEnv, invokeTauri } from '@/adapters';
import { httpClient } from '@/adapters/http';
import type { ContributionLimit, NewContributionLimit, DepositsCalculation } from '@/lib/types';
// Assuming Procedures from bindings.ts has definitions for limits procedures

export const getContributionLimits = async (): Promise<ContributionLimit[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_contribution_limits');
  } else {
    return httpClient.query(['limits.getContributionLimits']);
  }
};

export const createContributionLimit = async (newLimit: NewContributionLimit): Promise<ContributionLimit> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('create_contribution_limit', { newLimit });
  } else {
    return httpClient.mutation(['limits.createContributionLimit', newLimit]);
  }
};

export const updateContributionLimit = async (id: string, updatedLimit: NewContributionLimit): Promise<ContributionLimit> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('update_contribution_limit', { id, updatedLimit });
  } else {
    // rspc input for 'limits.updateContributionLimit' is [string, NewContributionLimit]
    return httpClient.mutation(['limits.updateContributionLimit', [id, updatedLimit]]);
  }
};

export const deleteContributionLimit = async (id: string): Promise<void> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    await invokeTauri('delete_contribution_limit', { id });
    return;
  } else {
    return httpClient.mutation(['limits.deleteContributionLimit', id]);
  }
};

export const calculateDepositsForContributionLimit = async (limitId: string): Promise<DepositsCalculation> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('calculate_deposits_for_contribution_limit', { limitId });
  } else {
    return httpClient.query(['limits.calculateDeposits', limitId]);
  }
};
