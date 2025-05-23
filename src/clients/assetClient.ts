// src/clients/assetClient.ts
import { RUN_ENV, getRunEnv, invokeTauri } from '@/adapters';
import { httpClient } from '@/adapters/http';
import type { Asset, AssetData, UpdateAssetProfile } from '@/lib/types';
// Assuming Procedures from bindings.ts has definitions for asset procedures

export const getAssetData = async (assetId: string): Promise<AssetData> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('get_asset_data', { assetId });
  } else {
    return httpClient.query(['assets.getData', assetId]);
  }
};

export const updateAssetProfile = async (id: string, payload: UpdateAssetProfile): Promise<Asset> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('update_asset_profile', { id, payload });
  } else {
    // rspc input for 'assets.updateProfile' is defined as [string, UpdateAssetProfile]
    return httpClient.mutation(['assets.updateProfile', [id, payload]]);
  }
};

export const updateAssetDataSource = async (id: string, dataSource: string): Promise<Asset> => {
  if (getRunEnv() === RUN_ENV.DESKTOP) {
    return invokeTauri('update_asset_data_source', { id, dataSource });
  } else {
    // rspc input for 'assets.updateDataSource' is defined as [string, string]
    return httpClient.mutation(['assets.updateDataSource', [id, dataSource]]);
  }
};
