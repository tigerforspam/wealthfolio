// src/commands/goal.ts
import {
  getGoals as clientGetGoals,
  createGoal as clientCreateGoal,
  updateGoal as clientUpdateGoal,
  deleteGoal as clientDeleteGoal,
  updateGoalAllocations as clientUpdateGoalAllocations,
  loadGoalsAllocations as clientLoadGoalsAllocations,
} from '@/clients/goalClient';
import type { Goal, NewGoal, GoalsAllocation } from '@/lib/types';
import { logger } from '@/adapters';

export const getGoals = async (): Promise<Goal[]> => {
  try {
    return await clientGetGoals();
  } catch (error) {
    logger.error('Error fetching goals via client.', { error });
    throw error;
  }
};

export const createGoal = async (goal: NewGoal): Promise<Goal> => {
  try {
    return await clientCreateGoal(goal);
  } catch (error) {
    logger.error('Error creating goal via client.', { error });
    throw error;
  }
};

export const updateGoal = async (goal: Goal): Promise<Goal> => {
  try {
    return await clientUpdateGoal(goal);
  } catch (error) {
    logger.error('Error updating goal via client.', { error });
    throw error;
  }
};

export const deleteGoal = async (goalId: string): Promise<number> => {
  try {
    return await clientDeleteGoal(goalId);
  } catch (error) {
    logger.error('Error deleting goal via client.', { goalId, error });
    throw error;
  }
};

export const updateGoalAllocations = async (allocations: GoalsAllocation[]): Promise<number> => {
  try {
    return await clientUpdateGoalAllocations(allocations);
  } catch (error) {
    logger.error('Error updating goal allocations via client.', { error });
    throw error;
  }
};

export const loadGoalsAllocations = async (): Promise<GoalsAllocation[]> => {
  try {
    return await clientLoadGoalsAllocations();
  } catch (error) { // Corrected: added {
    logger.error('Error loading goal allocations via client.', { error });
    throw error;
  }
};
