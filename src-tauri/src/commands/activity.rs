use std::collections::HashSet;
use std::sync::Arc;

use crate::context::ServiceContext;
use crate::events::{emit_portfolio_trigger_recalculate, PortfolioRequestPayload};
use log::debug;
use tauri::{AppHandle, State};
use wealthfolio_core::activities::{
    Activity, ActivityDetails, ActivityImport, ActivitySearchResponse, ActivityUpdate, ImportMappingData,
    NewActivity, Sort,
};

use csv::WriterBuilder;

// Helper function to generate symbols for portfolio recalculation (single activity)
fn get_symbols_to_sync(
    state: &State<'_, Arc<ServiceContext>>,
    activity_account_id: &str,
    activity_currency: &str,
    activity_asset_id: &str,
) -> Result<Vec<String>, String> {
    let account = state
        .account_service()
        .get_account(activity_account_id)
        .map_err(|e| format!("Failed to get account {}: {}", activity_account_id, e))?;
    let account_currency = account.currency;

    let mut symbols = vec![activity_asset_id.to_string()];

    if !activity_currency.is_empty() && activity_currency != &account_currency {
        let fx_symbol = format!("{}{}=X", account_currency, activity_currency);
        symbols.push(fx_symbol);
    }
    Ok(symbols)
}

// Helper function to generate symbols for imported activities (batch)
fn get_all_symbols_to_sync(
    state: &State<'_, Arc<ServiceContext>>,
    account_id: &str,
    activities: &[ActivityImport], // Use slice
) -> Result<Vec<String>, String> {
    let account = state
        .account_service()
        .get_account(account_id)
        .map_err(|e| format!("Failed to get account {}: {}", account_id, e))?;
    let account_currency = account.currency;

    let mut all_symbols: HashSet<String> = HashSet::new();

    for activity_import in activities {
        // Add asset symbol
        if !activity_import.symbol.is_empty() {
            all_symbols.insert(activity_import.symbol.clone());
        }

        // Add FX symbol if currencies differ
        if !activity_import.currency.is_empty() && activity_import.currency != account_currency {
            let fx_symbol = format!("{}{}=X", account_currency, activity_import.currency);
            all_symbols.insert(fx_symbol);
        }
    }
    Ok(all_symbols.into_iter().collect())
}

fn format_activity_to_csv_row(activity: &ActivityDetails, is_privacy_enabled: bool) -> Vec<String> {
    let mut row = vec![
        activity.id.clone(),
        activity.account_id.clone(),
        activity.date.clone(),
        activity.activity_type.clone(),
        activity.asset_id.clone(),
        activity.asset_symbol.clone().unwrap_or_default(),
        activity.asset_name.clone().unwrap_or_default(),
    ];

    // quantity
    row.push(activity.get_quantity().to_string());

    // unit_price, mask if privacy
    let unit_price_str = if is_privacy_enabled {
        "****".to_string()
    } else {
        activity.get_unit_price().to_string()
    };
    row.push(unit_price_str);

    // amount, mask if privacy
    let amount_str = if is_privacy_enabled {
        "****".to_string()
    } else {
        activity.get_amount().map_or("0".to_string(), |a| a.to_string())
    };
    row.push(amount_str);

    // fee, mask if privacy
    let fee_str = if is_privacy_enabled {
        "****".to_string()
    } else {
        activity.get_fee().to_string()
    };
    row.push(fee_str);

    row.push(activity.currency.clone());
    row.push(activity.comment.clone().unwrap_or_default());
    row.push(activity.is_draft.to_string());

    row
}

fn create_csv_from_activities(activities: Vec<ActivityDetails>, is_privacy_enabled: bool) -> String {
    let headers = vec![
        "id", "accountId", "activityDate", "activityType", "assetId", "assetSymbol", "assetName",
        "quantity", "unitPrice", "amount", "fee", "currency", "comment", "isDraft"
    ];

    let mut wtr = WriterBuilder::new().has_headers(false).from_writer(vec![]);
    wtr.write_record(&headers).unwrap();

    for activity in activities {
        let row = format_activity_to_csv_row(&activity, is_privacy_enabled);
        wtr.write_record(&row).unwrap();
    }

    let data = wtr.into_inner().unwrap();
    String::from_utf8(data).expect("Failed to convert CSV to string")
}

#[tauri::command]
pub async fn get_activities(
    state: State<'_, Arc<ServiceContext>>,
) -> Result<Vec<Activity>, String> {
    debug!("Fetching all activities...");
    Ok(state.activity_service().get_activities()?)
}

#[tauri::command]
pub async fn search_activities(
    page: i64,                                 // Page number, 1-based
    page_size: i64,                            // Number of items per page
    account_id_filter: Option<Vec<String>>,    // Optional account_id filter
    activity_type_filter: Option<Vec<String>>, // Optional activity_type filter
    asset_id_keyword: Option<String>,          // Optional asset_id keyword for search
    sort: Option<Sort>,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ActivitySearchResponse, String> {
    debug!("Search activities params: page={}, page_size={}, account_filter={:?}, type_filter={:?}, keyword={:?}, sort={:?}",
           page, page_size, account_id_filter, activity_type_filter, asset_id_keyword, sort);
    let result = state.activity_service().search_activities(
        page,
        page_size,
        account_id_filter,
        activity_type_filter,
        asset_id_keyword,
        sort,
    );
    match &result {
        Ok(r) => debug!("Search activities result: total={}, data_len={}", r.meta.total_row_count, r.data.len()),
        Err(e) => debug!("Search activities error: {}", e),
    }
    Ok(result?)
}

#[tauri::command]
pub async fn create_activity(
    activity: NewActivity,
    state: State<'_, Arc<ServiceContext>>,
    handle: AppHandle,
) -> Result<Activity, String> {
    debug!("Creating activity...");
    let result = state.activity_service().create_activity(activity).await?;
    
    let handle = handle.clone();
    let symbols_for_payload = get_symbols_to_sync(
        &state,
        &result.account_id,
        &result.currency,
        &result.asset_id,
    )?;

    let payload = PortfolioRequestPayload::builder()
        .account_ids(Some(vec![result.account_id.clone()]))
        .refetch_all_market_data(true)
        .symbols(Some(symbols_for_payload))
        .build();
    emit_portfolio_trigger_recalculate(&handle, payload);

    Ok(result)
}

#[tauri::command]
pub async fn update_activity(
    activity: ActivityUpdate,
    state: State<'_, Arc<ServiceContext>>,
    handle: AppHandle,
) -> Result<Activity, String> {
    debug!("Updating activity...");

    let original_activity = state
        .activity_service()
        .get_activity(&activity.id)
        .map_err(|e| e.to_string())?;

    let result = state.activity_service().update_activity(activity).await?;
    let handle = handle.clone();

    let symbols_for_payload = get_symbols_to_sync(
        &state,
        &result.account_id,
        &result.currency,
        &result.asset_id,
    )?;

    let mut account_ids_for_payload = vec![result.account_id.clone()];
    if original_activity.account_id != result.account_id {
        account_ids_for_payload.push(original_activity.account_id);
    }

    let payload: PortfolioRequestPayload = PortfolioRequestPayload::builder()
        .account_ids(Some(account_ids_for_payload))
        .refetch_all_market_data(true)
        .symbols(Some(symbols_for_payload))
        .build();
    emit_portfolio_trigger_recalculate(&handle, payload);

    Ok(result)
}

#[tauri::command]
pub async fn delete_activity(
    activity_id: String,
    state: State<'_, Arc<ServiceContext>>,
    handle: AppHandle,
) -> Result<Activity, String> {
    debug!("Deleting activity...");
    let result = state.activity_service().delete_activity(activity_id).await.map_err(|e| e.to_string())?;
    let handle = handle.clone();
    let account_id_clone = result.account_id.clone();
    let symbols = vec![result.asset_id.clone()];

    let payload = PortfolioRequestPayload::builder()
        .account_ids(Some(vec![account_id_clone]))
        .refetch_all_market_data(true)
        .symbols(Some(symbols))
        .build();
    emit_portfolio_trigger_recalculate(&handle, payload);

    Ok(result)
}

#[tauri::command]
pub async fn get_account_import_mapping(
    account_id: String,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ImportMappingData, String> {
    debug!("Getting import mapping for account: {}", account_id);
    Ok(state.activity_service().get_import_mapping(account_id)?)
}

#[tauri::command]
pub async fn save_account_import_mapping(
    mapping: ImportMappingData,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<ImportMappingData, String> {
    debug!("Saving import mapping for account: {}", mapping.account_id);
    state.activity_service().save_import_mapping(mapping).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_activities_import(
    account_id: String,
    activities: Vec<ActivityImport>,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<Vec<ActivityImport>, String> {
    debug!("Checking activities import for account: {}", account_id);
    let result = state
        .activity_service()
        .check_activities_import(account_id, activities)
        .await?;
    Ok(result)
}

#[tauri::command]
pub async fn import_activities(
    account_id: String,
    activities: Vec<ActivityImport>,
    state: State<'_, Arc<ServiceContext>>,
    handle: AppHandle,
) -> Result<Vec<ActivityImport>, String> {
    debug!("Importing activities for account: {}", account_id);

    // Generate symbols (including FX) using the new helper function
    let symbols_for_payload = get_all_symbols_to_sync(&state, &account_id, &activities)?;

    let result = state
        .activity_service()
        .import_activities(account_id.clone(), activities) // activities is moved here
        .await?;
    let handle = handle.clone();

    let payload = PortfolioRequestPayload::builder()
        .account_ids(Some(vec![account_id])) // account_id is still available
        .refetch_all_market_data(true)
        .symbols(Some(symbols_for_payload))
        .build();
    emit_portfolio_trigger_recalculate(&handle, payload);

    Ok(result)
}

#[tauri::command]
pub async fn export_activities(
    account_id: String,
    is_privacy_enabled: bool,
    state: State<'_, Arc<ServiceContext>>,
) -> Result<String, String> {
    debug!("Exporting activities for account: {}", account_id);

    let search_result = state.activity_service().search_activities(1, 100000, Some(vec![account_id.clone()]), None, None, None)
        .map_err(|e| format!("Failed to get activities: {}", e))?;
    let mut activities: Vec<ActivityDetails> = search_result.data;

    if activities.is_empty() {
        return Err("No activities to export".to_string());
    }

    // Sort by date descending
    activities.sort_by(|a, b| b.date.cmp(&a.date));

    if activities.len() > 50000 {
        return Err("Too many activities to export (limit 50k)".to_string());
    }

    let activities_count = activities.len();
    let csv_content = create_csv_from_activities(activities, is_privacy_enabled);
    debug!("CSV generated, length: {}, activities count: {}", csv_content.len(), activities_count);

    Ok(csv_content)
}

