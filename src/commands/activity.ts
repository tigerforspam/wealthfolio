// src/commands/activity.ts
import {
  getAllActivities as clientGetAll,
  searchActivities as clientSearch,
  createActivity as clientCreate,
  updateActivity as clientUpdate,
  saveActivities as clientSave,
  deleteActivity as clientDelete,
} from '@/clients/activityClient';
import type { Activity, ActivityCreate, ActivityDetails, ActivitySearchResponse, ActivityUpdate } from '@/lib/types';
import { logger } from '@/adapters'; // Assuming logger is still needed from adapters

// Re-define or import Filters and Sort if they were specific to this file
// For now, assuming they are implicitly handled by the client or types are compatible.
interface Filters {
  accountId?: string;
  activityType?: string;
  symbol?: string;
}

interface Sort {
  id: string;
  desc: boolean;
}

export const getActivities = async (): Promise<ActivityDetails[]> => {
  try {
    return await clientGetAll();
  } catch (error) {
    logger.error('Error fetching all activities via client.'); // Updated log
    throw error;
  }
};

export const searchActivities = async (
  page: number,
  pageSize: number,
  filters: Filters,
  searchKeyword: string,
  sort: Sort,
): Promise<ActivitySearchResponse> => {
  try {
    return await clientSearch(page, pageSize, filters, searchKeyword, sort);
  } catch (error) {
    logger.error('Error fetching activities via client.'); // Updated log
    throw error;
  }
};

export const createActivity = async (activity: ActivityCreate): Promise<Activity> => {
  try {
    return await clientCreate(activity);
  } catch (error) {
    logger.error('Error creating activity via client.'); // Updated log
    throw error;
  }
};

export const updateActivity = async (activity: ActivityUpdate): Promise<Activity> => {
  try {
    return await clientUpdate(activity);
  } catch (error) {
    logger.error('Error updating activity via client.'); // Updated log
    throw error;
  }
};

export const saveActivities = async (activities: ActivityUpdate[]): Promise<Activity[]> => {
  try {
    return await clientSave(activities);
  } catch (error) {
    logger.error('Error saving activities via client.'); // Updated log
    throw error;
  }
};

export const deleteActivity = async (activityId: string): Promise<Activity> => {
  try {
    return await clientDelete(activityId);
  } catch (error) {
    logger.error('Error deleting activity via client.'); // Updated log
    throw error;
  }
};
