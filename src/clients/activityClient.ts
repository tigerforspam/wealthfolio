// src/clients/activityClient.ts
import { RUN_ENV, getRunEnv, invokeTauri } from '@/adapters';
import { httpClient } from '@/adapters/http'; // rspc client
import type { Activity, ActivityCreate, ActivityDetails, ActivitySearchResponse, ActivityUpdate } from '@/lib/types';
// import type { SearchActivitiesArgs } from 'web-server/src/router'; // This type might need to be moved or duplicated if direct import isn't feasible

// Helper to map frontend filter/sort types to backend SearchActivitiesArgs if they differ
// For now, assuming they are compatible or SearchActivitiesArgs is defined broadly enough
// or we adjust SearchActivitiesArgs in web-server/src/router.rs to match frontend needs.

// Define Filters and Sort types as expected by the original searchActivities command
interface Filters {
  accountId?: string;
  activityType?: string;
  symbol?: string;
}

interface Sort {
  id: string;
  desc: boolean;
}

// Define SearchActivitiesArgs here, assuming it's not directly importable or generated in bindings.ts yet
// This should match the structure expected by the 'search' procedure in the rspc router
interface SearchActivitiesArgs {
  page: number;
  pageSize: number;
  account_id_filter?: string[];
  activity_type_filter?: string[];
  asset_id_keyword?: string;
  sort?: { id: string; desc: boolean };
}


export const getAllActivities = async (): Promise<ActivityDetails[]> => {
  const runEnv = getRunEnv();
  if (runEnv === RUN_ENV.DESKTOP) {
    // Assuming 'search_activities' with no filters/full range is how 'getAll' is implemented
    const response = await invokeTauri<ActivitySearchResponse>('search_activities', {
      page: 0, // Or 1, depending on backend pagination (0 for offset, 1 for page number)
      pageSize: Number.MAX_SAFE_INTEGER,
      filters: {},
      searchKeyword: '',
      sort: { id: 'date', desc: true },
    });
    return response.data;
  } else {
    // For web, use the 'getAll' query if defined, or 'search' with appropriate params
    // The rspc router has a 'getAll' query.
    return httpClient.query(['getAll']);
  }
};

export const searchActivities = async (
  page: number,
  pageSize: number,
  filters: Filters, // Frontend type
  searchKeyword: string,
  sort: Sort,       // Frontend type
): Promise<ActivitySearchResponse> => {
  const runEnv = getRunEnv();
  
  const args: SearchActivitiesArgs = {
    page,
    pageSize,
    // Map frontend filters to backend SearchActivitiesArgs
    account_id_filter: filters.accountId ? [filters.accountId] : undefined,
    activity_type_filter: filters.activityType ? [filters.activityType] : undefined,
    asset_id_keyword: searchKeyword || undefined, // Ensure empty string becomes undefined if backend expects optional
    sort: sort ? { id: sort.id, desc: sort.desc } : undefined,
  };

  if (runEnv === RUN_ENV.DESKTOP) {
    return invokeTauri('search_activities', { // Payload for Tauri
      page,
      pageSize,
      accountIdFilter: filters?.accountId, // Tauri command uses different naming
      activityTypeFilter: filters?.activityType,
      assetIdKeyword: searchKeyword,
      sort,
    });
  } else {
    return httpClient.query(['search', args]);
  }
};

export const createActivity = async (activity: ActivityCreate): Promise<Activity> => {
  const runEnv = getRunEnv();
  if (runEnv === RUN_ENV.DESKTOP) {
    return invokeTauri('create_activity', { activity });
  } else {
    // Ensure `ActivityCreate` is compatible with `NewActivity` expected by rspc `create`
    return httpClient.mutation(['create', activity as any]); // Cast if necessary
  }
};

export const updateActivity = async (activity: ActivityUpdate): Promise<Activity> => {
  const runEnv = getRunEnv();
  if (runEnv === RUN_ENV.DESKTOP) {
    return invokeTauri('update_activity', { activity });
  } else {
    return httpClient.mutation(['update', activity as any]); // Cast if necessary
  }
};

// saveActivities is not directly in the rspc router from the plan,
// it might be a batch update. If it's many individual updates,
// the client would loop. For now, only implement for DESKTOP.
export const saveActivities = async (activities: ActivityUpdate[]): Promise<Activity[]> => {
  const runEnv = getRunEnv();
  if (runEnv === RUN_ENV.DESKTOP) {
    return invokeTauri('save_activities', { activities });
  } else {
    // For web, this would likely be a loop of individual updates or a new batch endpoint
    console.warn('saveActivities via HTTP is not implemented yet. Performing individual updates.');
    const results: Activity[] = [];
    for (const activity of activities) {
      results.push(await updateActivity(activity));
    }
    return results;
    // Or throw new Error('saveActivities for web is not implemented');
  }
};

export const deleteActivity = async (activityId: string): Promise<Activity> => {
  const runEnv = getRunEnv();
  if (runEnv === RUN_ENV.DESKTOP) {
    return invokeTauri('delete_activity', { activityId });
  } else {
    return httpClient.mutation(['delete', activityId]);
  }
};
