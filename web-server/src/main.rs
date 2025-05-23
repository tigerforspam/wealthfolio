use axum::routing::get;
// For rspc v0.x, `rspc_axum::Endpoint` might not be what we use directly for service creation.
// Instead, we build a service from the rspc router.
use std::net::SocketAddr;
use std::sync::Arc; // Required for Arc, though router::get_router() returns Arc'd router
use tower_http::cors::{Any, CorsLayer};
use log::info;

// Assuming router.rs and its Ctx and get_router() are defined
mod router;

#[tokio::main]
async fn main() {
    env_logger::init(); // Initialize logger

    // 1. Get the router instance which includes the fully initialized Ctx
    // This returns Arc<rspc::internal::ArcedRouter<router::Ctx>>
    let app_router = router::get_router();

    let cors = CorsLayer::new()
        .allow_methods(Any)
        .allow_headers(Any)
        .allow_origin(Any); // Configure CORS appropriately for your needs

    // 2. Create the rspc service using the Ctx from app_router.
    // The endpoint closure will be called for each request, providing a fresh clone of the Ctx.
    // The `app_router.clone()` is important as `endpoint` might consume parts of it.
    // `move || app_router.ctx().clone()` ensures the original Ctx from `get_router` is cloned per request.
    let rspc_service = rspc_axum::Router::new()
        .endpoint(app_router.clone(), move || app_router.ctx().clone())
        .axum(); // .axum() converts the rspc endpoint builder into an Axum compatible Service.

    // 3. Construct the final Axum application router
    // Nest the rspc_service under the "/rspc" path.
    let axum_app = axum::Router::new()
        .route("/", get(|| async { "Hello, Wealthfolio Web!" })) // Root health check
        .nest_service("/rspc", rspc_service) // Nest the rspc router service
        .layer(cors); // Apply CORS to the entire application

    let addr = SocketAddr::from(([0, 0, 0, 0], 4000));
    info!("web-server listening on {}", addr);

    // 4. Start the Axum server using the modern axum::serve (for Axum 0.7+)
    axum::serve(
        tokio::net::TcpListener::bind(addr).await.unwrap(),
        axum_app.into_make_service() // .into_make_service() is standard for Axum services
    )
    .await
    .unwrap();
}
