// src/clients/goalClient.ts
import { RUN_ENV, getRunEnv, invokeTauri } from '@/adapters';
import { httpClient } from '@/adapters/http';
import type { Goal, NewGoal, GoalsAllocation } from '@/lib/types';
// Assuming Procedures from bindings.ts has definitions for goal procedures

export const getGoals = async (): Promise<Goal[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_goals');
  } else {
    return httpClient.query(['goals.getAll']);
  }
};

export const createGoal = async (goal: NewGoal): Promise<Goal> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('create_goal', { goal });
  } else {
    return httpClient.mutation(['goals.create', goal]);
  }
};

export const updateGoal = async (goal: Goal): Promise<Goal> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('update_goal', { goal });
  } else {
    return httpClient.mutation(['goals.update', goal]);
  }
};

export const deleteGoal = async (goalId: string): Promise<number> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('delete_goal', { goalId });
  } else {
    return httpClient.mutation(['goals.delete', goalId]);
  }
};

export const updateGoalAllocations = async (allocations: GoalsAllocation[]): Promise<number> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('update_goal_allocations', { allocations });
  } else {
    return httpClient.mutation(['goals.updateAllocations', allocations]);
  }
};

export const loadGoalsAllocations = async (): Promise<GoalsAllocation[]> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('load_goals_allocations');
  } else {
    return httpClient.query(['goals.loadAllocations']);
  }
};
