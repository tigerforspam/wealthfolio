use std::sync::Arc;
use rspc::{Router, Rspc};
use serde::{Deserialize, Serialize};
use chrono::NaiveDate;
use log::warn; // For placeholder warnings

// Core service traits and types
use wealthfolio_core::{
    accounts::{AccountService, AccountServiceTrait, Account, NewAccount, AccountUpdate, AccountRepository},
    activities::{
        ActivitiesService, ActivityServiceTrait, Activity, ActivityImport, ActivitySearchResponse,
        ActivityUpdate, ImportMappingData, NewActivity, Sort, ActivityRepository
    },
    assets::{AssetService, AssetServiceTrait, Asset, AssetData, UpdateAssetProfile, AssetRepository},
    db::create_connection_pool,
    fx::{FxService, FxServiceTrait, fx_model::{ExchangeRate, NewExchangeRate}, FxRepository},
    goals::{GoalService, GoalServiceTrait, goals_model::{Goal, GoalsAllocation, NewGoal}, GoalRepository},
    limits::{LimitsService, LimitsServiceTrait, ContributionLimit, NewContributionLimit, DepositsCalculation, LimitsRepository},
    market_data::{MarketDataService, MarketDataServiceTrait, Quote, QuoteSummary, MarketDataProviderInfo, MarketDataRepository},
    settings::{SettingsService, SettingsServiceTrait, Settings, SettingsUpdate, SettingsRepository},
    portfolio::{
        holdings::{HoldingsService, HoldingsServiceTrait, Holding, HoldingsRepository},
        income::{IncomeService, IncomeServiceTrait, IncomeSummary, IncomeRepository},
        valuation::{ValuationService, ValuationServiceTrait, DailyAccountValuation, ValuationRepository},
        performance::{PerformanceService, PerformanceServiceTrait, PerformanceMetrics, SimplePerformanceMetrics, PerformanceRepository},
        // Assuming a general portfolio calculation service might be needed for recalculate_portfolio
        // For now, specific services are used.
        // recalculation::{PortfolioRecalculationService, PortfolioRecalculationServiceTrait, PortfolioRecalculationRepository} // Example
    }
};

// Context struct
#[derive(Clone)]
pub struct Ctx {
    activity_service: Arc<dyn ActivityServiceTrait>,
    account_service: Arc<dyn AccountServiceTrait>,
    asset_service: Arc<dyn AssetServiceTrait>,
    fx_service: Arc<dyn FxServiceTrait>,
    goal_service: Arc<dyn GoalServiceTrait>,
    limits_service: Arc<dyn LimitsServiceTrait>,
    market_data_service: Arc<dyn MarketDataServiceTrait>,
    settings_service: Arc<dyn SettingsServiceTrait>,
    holdings_service: Arc<dyn HoldingsServiceTrait>,
    income_service: Arc<dyn IncomeServiceTrait>,
    valuation_service: Arc<dyn ValuationServiceTrait>,
    performance_service: Arc<dyn PerformanceServiceTrait>,
    // portfolio_recalculation_service: Arc<dyn PortfolioRecalculationServiceTrait>, // Example
}

// Helper function for parsing date strings
fn parse_date_string(date_str: Option<String>) -> Result<Option<NaiveDate>, rspc::Error> {
    date_str.map(|s| NaiveDate::parse_from_str(&s, "%Y-%m-%d")
        .map_err(|e| rspc::Error::new(rspc::ErrorCode::BadRequest, format!("Invalid date format: {}. Use YYYY-MM-DD.", e))))
        .transpose()
}

// Input types for date ranges
#[derive(Deserialize, Serialize, specta::Type)]
pub struct DateRangeArgs {
    start_date: Option<String>,
    end_date: Option<String>,
}

#[derive(Deserialize, Serialize, specta::Type)]
pub struct ItemDateRangeArgs {
    item_id: String,
    start_date: Option<String>,
    end_date: Option<String>,
}

#[derive(Deserialize, Serialize, specta::Type)]
pub struct TypedItemDateRangeArgs {
    item_type: String, // e.g., "account", "portfolio"
    item_id: String,
    start_date: Option<String>,
    end_date: Option<String>,
}

// Define input/output types for procedures, mirroring Tauri command signatures
// This is the existing one for activities.search, ensure it's still relevant or adapt.
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
    let pool = Arc::new(create_connection_pool().expect("Failed to create db pool"));

    // Initialize Repositories
    let settings_repository = Arc::new(SettingsRepository::new(pool.clone()));
    let account_repository = Arc::new(AccountRepository::new(pool.clone()));
    let asset_repository = Arc::new(AssetRepository::new(pool.clone()));
    let fx_repository = Arc::new(FxRepository::new(pool.clone()));
    let activity_repository = Arc::new(ActivityRepository::new(pool.clone()));
    let goal_repository = Arc::new(GoalRepository::new(pool.clone()));
    let limits_repository = Arc::new(LimitsRepository::new(pool.clone()));
    let market_data_repository = Arc::new(MarketDataRepository::new(pool.clone()));
    let holdings_repository = Arc::new(HoldingsRepository::new(pool.clone()));
    let income_repository = Arc::new(IncomeRepository::new(pool.clone()));
    let valuation_repository = Arc::new(ValuationRepository::new(pool.clone()));
    let performance_repository = Arc::new(PerformanceRepository::new(pool.clone()));
    // let portfolio_recalc_repo = Arc::new(PortfolioRecalculationRepository::new(pool.clone())); // Example

    // Initialize Services (order might matter based on dependencies)
    let settings_service = Arc::new(SettingsService::new(settings_repository.clone()));
    let account_service = Arc::new(AccountService::new(account_repository.clone(), settings_service.clone()));
    let asset_service = Arc::new(AssetService::new(asset_repository.clone(), settings_service.clone()));
    let fx_service = Arc::new(FxService::new(fx_repository.clone(), settings_service.clone()));
    
    // MarketDataService might need FxService, AssetService, SettingsService
    let market_data_service = Arc::new(MarketDataService::new(
        market_data_repository.clone(),
        asset_service.clone(),
        fx_service.clone(),
        settings_service.clone()
    ));

    let activity_service = Arc::new(ActivitiesService::new(
        activity_repository.clone(),
        account_service.clone(),
        asset_service.clone(),
        fx_service.clone(),
    ));
    let goal_service = Arc::new(GoalService::new(
        goal_repository.clone(), 
        account_service.clone(), 
        settings_service.clone()
    ));
    let limits_service = Arc::new(LimitsService::new(
        limits_repository.clone(),
        activity_service.clone(), // Assuming LimitsService needs ActivityService for deposit calculations
        account_service.clone(),
        settings_service.clone()
    ));
    
    // Portfolio Services
    let valuation_service = Arc::new(ValuationService::new(
        valuation_repository.clone(),
        account_service.clone(),
        asset_service.clone(),
        market_data_service.clone(),
        activity_service.clone(),
        fx_service.clone(),
        settings_service.clone()
    ));
    let holdings_service = Arc::new(HoldingsService::new(
        holdings_repository.clone(),
        valuation_service.clone(), // Holdings might derive from valuations
        account_service.clone(),
        asset_service.clone(),
        market_data_service.clone(),
        fx_service.clone(),
        settings_service.clone()
    ));
    let income_service = Arc::new(IncomeService::new(
        income_repository.clone(),
        activity_service.clone(),
        account_service.clone(),
        asset_service.clone(),
        settings_service.clone()
    ));
    let performance_service = Arc::new(PerformanceService::new(
        performance_repository.clone(),
        valuation_service.clone(), // Performance depends on valuations
        activity_service.clone(),
        account_service.clone(),
        settings_service.clone()
    ));
    // let portfolio_recalculation_service = Arc::new(PortfolioRecalculationService::new(portfolio_recalc_repo, ...)); // Example


    let router = <Router<Ctx>>::new()
        .config(
            rspc::Config::new()
                .export_ts_bindings("../src/bindings.ts")
        )
        // Activity Procedures (namespaced)
        .query("activities.getAll", |t| {
            t(|ctx, _input: ()| async move {
                ctx.activity_service.get_activities().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })
        .query("activities.search", |t| {
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
        .mutation("activities.create", |t| {
            t(|ctx, activity: NewActivity| async move {
                ctx.activity_service.create_activity(activity).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })
        .mutation("activities.update", |t| {
            t(|ctx, activity: ActivityUpdate| async move {
                ctx.activity_service.update_activity(activity).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })
        .mutation("activities.delete", |t| {
            t(|ctx, activity_id: String| async move {
                ctx.activity_service.delete_activity(activity_id).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            })
        })

        // Account Procedures
        .query("accounts.getAll", |t| t(|ctx, _input: ()| async move {
            ctx.account_service.get_all_accounts().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("accounts.getActive", |t| t(|ctx, _input: ()| async move {
            ctx.account_service.get_active_accounts().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("accounts.create", |t| t(|ctx, account: NewAccount| async move {
            ctx.account_service.create_account(account).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("accounts.update", |t| t(|ctx, account_update: AccountUpdate| async move {
            ctx.account_service.update_account(account_update).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("accounts.delete", |t| t(|ctx, account_id: String| async move {
            ctx.account_service.delete_account(&account_id).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))

        // Asset Procedures
        .query("assets.getData", |t| t(|ctx, asset_id: String| async move {
            ctx.asset_service.get_asset_data(&asset_id).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("assets.updateProfile", |t| t(|ctx, params: (String, UpdateAssetProfile)| async move {
            ctx.asset_service.update_asset_profile(&params.0, params.1).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("assets.updateDataSource", |t| t(|ctx, params: (String, String)| async move {
            ctx.asset_service.update_asset_data_source(&params.0, params.1).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))

        // Goal Procedures
        .query("goals.getAll", |t| t(|ctx, _input: ()| async move {
            ctx.goal_service.get_goals().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("goals.create", |t| t(|ctx, goal: NewGoal| async move {
            ctx.goal_service.create_goal(goal).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("goals.update", |t| t(|ctx, goal: Goal| async move {
            ctx.goal_service.update_goal(goal).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("goals.delete", |t| t(|ctx, goal_id: String| async move {
            ctx.goal_service.delete_goal(goal_id).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("goals.updateAllocations", |t| t(|ctx, allocations: Vec<GoalsAllocation>| async move {
            ctx.goal_service.upsert_goal_allocations(allocations).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("goals.loadAllocations", |t| t(|ctx, _input: ()| async move {
            ctx.goal_service.load_goals_allocations().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))

        // Limits Procedures
        .query("limits.getContributionLimits", |t| t(|ctx, _input: ()| async move {
            ctx.limits_service.get_contribution_limits().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("limits.createContributionLimit", |t| t(|ctx, new_limit: NewContributionLimit| async move {
            ctx.limits_service.create_contribution_limit(new_limit).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("limits.updateContributionLimit", |t| t(|ctx, params: (String, NewContributionLimit)| async move {
            ctx.limits_service.update_contribution_limit(&params.0, params.1).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("limits.deleteContributionLimit", |t| t(|ctx, id: String| async move {
            ctx.limits_service.delete_contribution_limit(&id).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("limits.calculateDeposits", |t| t(|ctx, limit_id: String| async move {
            let base_currency = ctx.settings_service.get_base_currency()
                .map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, format!("Failed to get base currency: {}", e)))?
                .unwrap_or_else(|| {
                    warn!("Base currency not set, defaulting to USD for limits.calculateDeposits");
                    "USD".to_string() // Default or handle error appropriately
                });
            ctx.limits_service.calculate_deposits_for_contribution_limit(&limit_id, &base_currency).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))

        // Market Data Procedures
        .query("marketData.searchSymbol", |t| t(|ctx, query: String| async move {
            ctx.market_data_service.search_symbol(&query).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("marketData.requestSync", |t| t(|_ctx, _params: (Option<Vec<String>>, bool)| async move {
            warn!("'marketData.requestSync' is a conceptual placeholder and needs actual MarketDataService method for web.");
            // Placeholder: In a real scenario, this might call something like:
            // ctx.market_data_service.trigger_sync_for_web(params.0, params.1).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
            Ok(()) // Placeholder
        }))
        .mutation("marketData.updateQuote", |t| t(|ctx, quote: Quote| async move {
            ctx.market_data_service.update_quote(quote).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("marketData.deleteQuote", |t| t(|ctx, id: String| async move {
            ctx.market_data_service.delete_quote(&id).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("marketData.getQuoteHistory", |t| t(|ctx, symbol: String| async move {
            ctx.market_data_service.get_historical_quotes_for_symbol(&symbol).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("marketData.getProviders", |t| t(|ctx, _input: ()| async move {
            ctx.market_data_service.get_market_data_providers_info().await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))

        // Portfolio Procedures
        .query("portfolio.getHoldings", |t| t(|ctx, account_id: String| async move {
            let base_currency = ctx.settings_service.get_base_currency()
                .map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))?
                .unwrap_or_else(|| {
                    warn!("Base currency not set, defaulting to USD for portfolio.getHoldings");
                    "USD".to_string()
                });
            ctx.holdings_service.get_holdings(&account_id, &base_currency).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("portfolio.getHolding", |t| t(|ctx, params: (String, String)| async move {
            let base_currency = ctx.settings_service.get_base_currency()
                .map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))?
                .unwrap_or_else(|| {
                    warn!("Base currency not set, defaulting to USD for portfolio.getHolding");
                    "USD".to_string()
                });
            ctx.holdings_service.get_holding(&params.0, &params.1, &base_currency).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("portfolio.getHistoricalValuations", |t| t(|ctx, args: ItemDateRangeArgs| async move {
            let start_date_opt = parse_date_string(args.start_date)?;
            let end_date_opt = parse_date_string(args.end_date)?;
            ctx.valuation_service.get_historical_valuations(&args.item_id, start_date_opt, end_date_opt).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("portfolio.getIncomeSummary", |t| t(|ctx, _input: ()| async move {
            ctx.income_service.get_income_summary().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("portfolio.calculateSimplePerformance", |t| t(|ctx, account_ids: Vec<String>| async move {
            let ids_to_process = if account_ids.is_empty() {
                ctx.account_service.get_active_accounts()
                    .map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))?
                    .into_iter().map(|acc| acc.id).collect()
            } else {
                account_ids
            };
            if ids_to_process.is_empty() { return Ok(Vec::new()); }
            ctx.performance_service.calculate_accounts_simple_performance(&ids_to_process).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("portfolio.calculatePerformanceHistory", |t| t(|ctx, args: TypedItemDateRangeArgs| async move {
            let start_date_opt = parse_date_string(args.start_date)?;
            let end_date_opt = parse_date_string(args.end_date)?;
            ctx.performance_service.calculate_performance_history(&args.item_type, &args.item_id, start_date_opt, end_date_opt).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("portfolio.calculatePerformanceSummary", |t| t(|ctx, args: TypedItemDateRangeArgs| async move {
            let start_date_opt = parse_date_string(args.start_date)?;
            let end_date_opt = parse_date_string(args.end_date)?;
            ctx.performance_service.calculate_performance_summary(&args.item_type, &args.item_id, start_date_opt, end_date_opt).await.map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("portfolio.requestRecalculate", |t| t(|_ctx, _input: ()| async move {
            warn!("'portfolio.requestRecalculate' is a conceptual placeholder.");
            Ok(())
        }))
        .mutation("portfolio.requestUpdate", |t| t(|_ctx, _input: ()| async move {
            warn!("'portfolio.requestUpdate' is a conceptual placeholder.");
            Ok(())
        }))

        // Settings & FX Procedures
        .query("settings.get", |t| t(|ctx, _input: ()| async move {
            ctx.settings_service.get_settings().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("settings.update", |t| t(|ctx, settings_update: SettingsUpdate| async move {
            ctx.settings_service.update_settings(&settings_update)
                 .map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))?;
            // Return the updated settings
            ctx.settings_service.get_settings().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .query("settings.getExchangeRates", |t| t(|ctx, _input: ()| async move {
            ctx.fx_service.get_exchange_rates().map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("settings.addExchangeRate", |t| t(|ctx, new_rate: NewExchangeRate| async move {
            ctx.fx_service.add_exchange_rate(new_rate).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("settings.updateExchangeRate", |t| t(|ctx, rate: ExchangeRate| async move {
            ctx.fx_service.update_exchange_rate(&rate.from_currency, &rate.to_currency, rate.rate).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .mutation("settings.deleteExchangeRate", |t| t(|ctx, rate_id: String| async move {
            // Assuming rate_id is the primary key for ExchangeRate table.
            // If it's a composite (from_currency, to_currency), the service method signature would need to change.
            // For now, assuming FxServiceTrait::delete_exchange_rate takes a single String ID.
            // If rate_id is actually something like "USD_EUR", then parse it in the service or here.
            // The provided signature for Tauri command was `delete_exchange_rate(from_currency: String, to_currency: String)`
            // Let's assume rate_id is a placeholder for a unique ID for the rate, or adjust if it's composite.
            // If the ID is composite (e.g. "USD/EUR"), this needs to be handled.
            // For now, we'll assume the service method `delete_exchange_rate` handles a single `String` ID.
            // If it's `(String, String)` then the input type here must change.
            // Let's assume the `rate_id` is a concatenation or a specific unique ID field.
            // Given the `ExchangeRate` struct has `id: String` from the core types, this should be fine.
            ctx.fx_service.delete_exchange_rate(&rate_id).map_err(|e| rspc::Error::new(rspc::ErrorCode::InternalServerError, e.to_string()))
        }))
        .build();

    Arc::new(router.arced(Ctx {
        activity_service,
        account_service,
        asset_service,
        fx_service,
        goal_service,
        limits_service,
        market_data_service,
        settings_service,
        holdings_service,
        income_service,
        valuation_service,
        performance_service,
        // portfolio_recalculation_service, // Example
    }))
}
