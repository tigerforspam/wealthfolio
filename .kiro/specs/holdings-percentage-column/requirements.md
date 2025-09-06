# Requirements Document

## Introduction

This feature adds a new column to the holdings table that displays each stock's percentage of the total account holdings. This will help users quickly understand the weight of each position in their portfolio and make informed decisions about diversification and rebalancing.

## Requirements

### Requirement 1

**User Story:** As a portfolio manager, I want to see what percentage each holding represents of my total portfolio value, so that I can quickly assess my portfolio allocation and identify overweight positions.

#### Acceptance Criteria

1. WHEN viewing the holdings table THEN the system SHALL display a new "Allocation %" column
2. WHEN calculating allocation percentage THEN the system SHALL use the market value of each holding divided by the total portfolio market value
3. WHEN displaying the percentage THEN the system SHALL show the value with 2 decimal precision (e.g., 12.34%)
4. WHEN the total portfolio value is zero or null THEN the system SHALL display 0% for all holdings
5. WHEN toggling between base currency and asset currency THEN the allocation percentage SHALL remain consistent based on base currency values

### Requirement 2

**User Story:** As a user, I want the allocation percentage column to be visually consistent with other columns in the table, so that the interface remains clean and professional.

#### Acceptance Criteria

1. WHEN viewing the allocation column THEN the system SHALL align the percentage values to the right
2. WHEN displaying the percentage THEN the system SHALL use consistent formatting with other numeric columns
3. WHEN the column is too narrow THEN the system SHALL handle text overflow gracefully
4. WHEN sorting by allocation percentage THEN the system SHALL sort numerically in ascending/descending order
5. WHEN the privacy mode is enabled THEN the system SHALL hide the allocation percentages along with other sensitive data

### Requirement 3

**User Story:** As a user, I want to be able to sort and filter by allocation percentage, so that I can easily identify my largest and smallest positions.

#### Acceptance Criteria

1. WHEN clicking the allocation column header THEN the system SHALL sort holdings by allocation percentage
2. WHEN sorting by allocation THEN the system SHALL maintain the same sorting behavior as other numeric columns
3. WHEN the column is hidden via column toggle THEN the system SHALL remember this preference
4. WHEN loading the table THEN the allocation column SHALL be visible by default
5. WHEN calculating percentages THEN the system SHALL update in real-time as market values change

### Requirement 4

**User Story:** As a user with multiple portfolios, I want to see allocation percentages that reflect the correct context (single account vs. all accounts), so that I can understand my position sizing appropriately for the current view.

#### Acceptance Criteria

1. WHEN viewing a single account's holdings THEN the system SHALL calculate allocation percentages based on that account's total market value only
2. WHEN viewing all portfolios together THEN the system SHALL calculate allocation percentages based on the combined total market value across all accounts
3. WHEN switching between single account and all accounts view THEN the system SHALL recalculate and update allocation percentages accordingly
4. WHEN holdings are aggregated across accounts THEN the system SHALL sum the market values for identical symbols before calculating percentages
5. WHEN an account has zero or negative total value THEN the system SHALL handle the calculation gracefully and display 0% for all holdings in that context