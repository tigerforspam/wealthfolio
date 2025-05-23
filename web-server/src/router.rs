use std::sync::Arc;
use rspc::{Router, Rspc};
use serde::{Deserialize, Serialize};
use wealthfolio_core::activities::{
    ActivitiesService, Activity, ActivityImport, ActivitySearchResponse, ActivityServiceTrait,
    ActivityUpdate, ImportMappingData, NewActivity, Sort,
};
use wealthfolio_core::db::create_connection_pool;
use wealthfolio_core::accounts::{AccountService, AccountServiceTrait, AccountRepository};
use wealthfolio_core::assets::{AssetService, AssetServiceTrait, AssetRepository};
use wealthfolio_core::fx::{FxService, FxServiceTrait, FxRepository};
use wealthfolio_core::settings::{SettingsService, SettingsRepository};
use wealthfolio_core::market_data::{MarketDataService, MarketDataRepository};


// Define a context for the rspc router
#[derive(Clone)]
pub struct Ctx {
    activity_service: Arc<dyn ActivityServiceTrait>,
    // Add other services if needed by other routers
}

// Define input/output types for procedures, mirroring Tauri command signatures
// These might need to be adjusted based on actual types in src-core
#[derive(Deserialize, Serialize)]
pub struct SearchActivitiesArgs {
    page: i64,
    page_size: i64,
    account_id_filter: Option<Vec<String>>,
    activity_type_filter: Option<Vec<String>>,
    asset_id_keyword: Option<String>,
    sort: Option<Sort>,
}

// This is the Router builder function
pub fn get_router() -> Arc<Router<Ctx>> {
    // Initialize services from src-core
    // This setup should ideally mirror how services are initialized in src-tauri/src/context/providers.rs
    // For simplicity, we'll initialize them directly here.
    // Ensure DATABASE_URL is set in the environment for the web server
    let pool = Arc::new(create_connection_pool().expect("Failed to create db pool"));
    
    let settings_repository = Arc::new(SettingsRepository::new(pool.clone()));
    let settings_service = Arc::new(SettingsService::new(settings_repository.clone()));
    
    let account_repository = Arc::new(AccountRepository::new(pool.clone()));
    let account_service = Arc::new(AccountService::new(account_repository.clone(), settings_service.clone()));
    
    let asset_repository = Arc::new(AssetRepository::new(pool.clone()));
    let asset_service = Arc::new(AssetService::new(asset_repository.clone(), settings_service.clone()));
    
    let fx_repository = Arc::new(FxRepository::new(pool.clone()));
    let fx_service = Arc::new(FxService::new(fx_repository.clone(), settings_service.clone()));

    let market_data_repository = Arc::new(MarketDataRepository::new(pool.clone()));
    // MarketDataService might have more complex dependencies, adjust as needed
    // For now, assuming it only needs the repository and settings_service
    let _market_data_service = Arc::new(MarketDataService::new(market_data_repository.clone(), settings_service.clone()));


    let activity_repository = Arc::new(wealthfolio_core::activities::ActivityRepository::new(pool.clone()));
    let activity_service_instance = Arc::new(ActivitiesService::new(
        activity_repository,
        account_service.clone(), // Assuming AccountServiceTrait is implemented by AccountService
        asset_service.clone(),   // Assuming AssetServiceTrait is implemented by AssetService
        fx_service.clone(),      // Assuming FxServiceTrait is implemented by FxService
    ));

    let router = <Router<Ctx>>::new()
        .config(
            rspc::Config::new()
                .export_ts_bindings("../src/bindings.ts") // Configure path for TypeScript bindings
        )
        .query("getAll", |t| {
            t(|ctx, _input: ()| async move {
                // Placeholder: Replace with actual call to activity_service.get_activities()
                // This might need to be activity_service.search_activities with no filters for consistency
                // For now, let's assume a simple get_activities exists or adapt search_activities
                ctx.activity_service.get_activities().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })
        .query("search", |t| {
            t(|ctx, args: SearchActivitiesArgs| async move {
                ctx.activity_service.search_activities(
                    args.page,
                    args.page_size,
                    args.account_id_filter,
                    args.activity_type_filter,
                    args.asset_id_keyword,
                    args.sort,
                ).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })
        .mutation("create", |t| {
            t(|ctx, activity: NewActivity| async move {
                // Note: Tauri commands often involve AppHandle for events. This is not directly available here.
                // If post-creation events are critical, consider how to handle them (e.g., WebSocket, or client refetches)
                ctx.activity_service.create_activity(activity).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })
        .mutation("update", |t| {
            t(|ctx, activity: ActivityUpdate| async move {
                ctx.activity_service.update_activity(activity).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })
        // `save` might be a batch update, which needs a specific implementation if not covered by `update`.
        // Assuming `save` is not a direct 1:1 with a single service method for now.
        // If `save_activities` from Tauri is a batch operation, you'll need a similar method in ActivityServiceTrait or handle it here.
        // For now, omitting `save` unless it's a simple alias for a loop of `update`.
        // .mutation("save", |t| { ... })
        .mutation("delete", |t| {
            t(|ctx, activity_id: String| async move {
                ctx.activity_service.delete_activity(activity_id).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })
        .build();

    Arc::new(router.arced(Ctx { activity_service: activity_service_instance }))
}
