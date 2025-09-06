# Implementation Plan

- [x] 1. Create utility functions for percentage calculations
  - Implement `calculateAllocationPercentage` function that takes a holding and total value, returns percentage
  - Implement `formatPercentage` function that formats decimal to percentage string with 2 decimal places
  - Implement `calculateTotalPortfolioValue` function that sums all holdings' base market values
  - Add proper error handling for edge cases (zero totals, null values, NaN results)
  - _Requirements: 1.2, 1.4, 4.5_

- [x] 2. Add allocation percentage column to holdings table
  - Add new column definition with id 'allocation' to the `getColumns` function
  - Configure column header with right-aligned "Allocation %" title using `DataTableColumnHeader`
  - Implement cell renderer that displays formatted percentage with privacy blur support
  - Set column as hideable with `enableHiding: true`
  - Add column to default visible columns (not in `defaultColumnVisibility` hidden list)
  - _Requirements: 1.1, 2.1, 2.4, 3.4_

- [x] 3. Implement percentage calculation logic in table component
  - Calculate total portfolio value using `useMemo` hook to optimize performance
  - Pass total value to column accessorFn for percentage calculations
  - Ensure calculations update when holdings data changes
  - Handle empty holdings array and zero total value scenarios
  - _Requirements: 1.2, 1.3, 4.1, 4.2_

- [x] 4. Add sorting functionality for allocation column
  - Implement custom `sortingFn` that compares percentage values numerically
  - Ensure sorting works correctly with edge cases (zero percentages, equal values)
  - Test sorting in both ascending and descending order
  - _Requirements: 3.1, 3.2_

- [x] 5. Integrate with privacy controls
  - Apply `isHidden` privacy state to blur percentage values when privacy mode is enabled
  - Ensure percentage column respects same privacy behavior as other sensitive columns
  - Test privacy toggle functionality with allocation percentages
  - _Requirements: 2.5_

- [x] 6. Position allocation column appropriately in table
  - Insert allocation column after "Total Value" column and before "Total Gain/Loss" column
  - Ensure column ordering makes logical sense in the context of other financial data
  - Verify column width and alignment work well with existing columns
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 7. Add unit tests for utility functions
  - Write tests for `calculateAllocationPercentage` with various scenarios (normal values, zero total, negative holdings, missing values)
  - Write tests for `formatPercentage` with edge cases (0%, 100%, >100%, decimal precision)
  - Write tests for `calculateTotalPortfolioValue` with mixed values and empty arrays
  - Ensure all edge cases and error conditions are covered
  - _Requirements: 1.4, 4.5_

- [x] 8. Test integration with currency toggle functionality
  - Verify allocation percentages remain consistent when toggling between base and asset currencies
  - Confirm percentages are calculated using base currency values regardless of display toggle
  - Test that percentage calculations are not affected by currency conversion display
  - _Requirements: 1.5_

- [x] 9. Test multi-account context scenarios
  - Verify percentage calculations work correctly when viewing single account holdings
  - Test percentage calculations when viewing all portfolios combined
  - Ensure percentages recalculate appropriately when switching between account contexts
  - Confirm aggregated holdings show correct percentages relative to total portfolio
  - _Requirements: 4.1, 4.2, 4.3, 4.4_