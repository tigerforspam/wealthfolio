// src/commands/asset.ts
import {
  getAssetData as clientGetAssetData,
  updateAssetProfile as clientUpdateAssetProfile,
  updateAssetDataSource as clientUpdateAssetDataSource,
} from '@/clients/assetClient';
import type { Asset, AssetData, UpdateAssetProfile } from '@/lib/types';
import { logger } from '@/adapters';

export const getAssetData = async (assetId: string): Promise<AssetData> => {
  try {
    return await clientGetAssetData(assetId);
  } catch (error) {
    logger.error('Error fetching asset data via client.', { assetId, error });
    throw error;
  }
};

export const updateAssetProfile = async (id: string, payload: UpdateAssetProfile): Promise<Asset> => {
  try {
    return await clientUpdateAssetProfile(id, payload);
  } catch (error) {
    logger.error('Error updating asset profile via client.', { id, error });
    throw error;
  }
};

export const updateAssetDataSource = async (id: string, dataSource: string): Promise<Asset> => {
  try {
    return await clientUpdateAssetDataSource(id, dataSource);
  } catch (error) {
    logger.error('Error updating asset data source via client.', { id, error });
    throw error;
  }
};
