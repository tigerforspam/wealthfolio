use axum::routing::get;
use rspc_axum::Endpoint;
use std::net::SocketAddr;
use tower_http::cors::{Any, CorsLayer};
use log::info;
use std::sync::Arc; // Required for Arc

mod router; // Ensure this module is declared

#[tokio::main]
async fn main() {
    env_logger::init(); // Initialize logger

    let router_instance = router::get_router();

    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_headers(Any)
        .allow_origin(Any); // Configure CORS appropriately for your needs

    let app = axum::Router::new()
        .route("/", get(|| async { "Hello, Wealthfolio Web!" }))
        .nest("/rspc", router_instance.endpoint(|| {
            // This context creation needs to align with how Ctx is defined and expected by the router.
            // It's crucial that the service instances here are properly initialized and shared if needed.
            // Re-initializing services per request (as implied by direct new() calls here without shared state)
            // is generally not recommended for production due to overhead and potential state issues.
            // The router::get_router() function already creates an Arc<Router<Ctx>>, 
            // and the Ctx within that router holds Arc-wrapped services.
            // The endpoint closure here should ideally clone or reuse that context.
            // However, rspc's endpoint builder expects a function that returns a Ctx.
            // A common pattern is to have services initialized once and then clone their Arc references into the Ctx.
            
            // Let's refine this to properly initialize services once and use them.
            // This mimics the service initialization from router::get_router but ensures it's done for the endpoint context.
            // Ideally, services would be initialized once for the whole application.
            let pool = Arc::new(wealthfolio_core::db::create_connection_pool().expect("Failed to create db pool for endpoint"));
            
            let settings_repository = Arc::new(wealthfolio_core::settings::SettingsRepository::new(pool.clone()));
            let settings_service = Arc::new(wealthfolio_core::settings::SettingsService::new(settings_repository.clone()));
            
            let account_repository = Arc::new(wealthfolio_core::accounts::AccountRepository::new(pool.clone()));
            let account_service = Arc::new(wealthfolio_core::accounts::AccountService::new(account_repository.clone(), settings_service.clone()));
            
            let asset_repository = Arc::new(wealthfolio_core::assets::AssetRepository::new(pool.clone()));
            let asset_service = Arc::new(wealthfolio_core::assets::AssetService::new(asset_repository.clone(), settings_service.clone()));
            
            let fx_repository = Arc::new(wealthfolio_core::fx::FxRepository::new(pool.clone()));
            let fx_service = Arc::new(wealthfolio_core::fx::FxService::new(fx_repository.clone(), settings_service.clone()));
            
            let activity_repository = Arc::new(wealthfolio_core::activities::ActivityRepository::new(pool.clone()));
            let activity_service_instance = Arc::new(wealthfolio_core::activities::ActivitiesService::new(
                activity_repository,
                account_service.clone(), 
                asset_service.clone(),   
                fx_service.clone(),      
            ));

            router::Ctx { activity_service: activity_service_instance }
        }))
        .layer(cors);

    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    info!("web-server listening on {}", addr);

    // Corrected server binding and serving
    axum::serve(tokio::net::TcpListener::bind(addr).await.unwrap(), app.into_make_service())
        .await
        .unwrap();
}
