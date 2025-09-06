# Design Document

## Overview

This feature adds an "Allocation %" column to the holdings table that displays each holding's percentage of the total portfolio value. The implementation will calculate percentages based on the current context (single account vs. all portfolios) and integrate seamlessly with the existing table structure and currency toggle functionality.

## Architecture

### Data Flow
1. **Holdings Data**: The existing `holdings` array from `useHoldings` hook contains market values in base currency
2. **Total Calculation**: Calculate total portfolio value by summing all holdings' `marketValue.base` values
3. **Percentage Calculation**: For each holding, divide its `marketValue.base` by the total and multiply by 100
4. **Display**: Show percentage with appropriate formatting and privacy controls

### Context Awareness
- **Single Account View**: When `selectedAccount.id` is a specific account, calculate percentages based on that account's holdings only
- **All Portfolios View**: When `selectedAccount.id` is `PORTFOLIO_ACCOUNT_ID`, calculate percentages based on combined holdings across all accounts
- **Currency Toggle**: Percentages remain consistent regardless of currency display toggle since calculations use base currency values

## Components and Interfaces

### Modified Components

#### HoldingsTable Component
- **Location**: `src/pages/holdings/components/holdings-table.tsx`
- **Changes**: Add new column definition for allocation percentage
- **Props**: No changes to existing props interface

#### Column Definition
```typescript
{
  id: 'allocation',
  accessorFn: (row) => calculateAllocationPercentage(row, totalPortfolioValue),
  enableHiding: true,
  header: ({ column }) => (
    <DataTableColumnHeader className="justify-end" column={column} title="Allocation %" />
  ),
  meta: {
    label: 'Allocation %',
  },
  cell: ({ row }) => (
    <div className="flex min-h-[40px] flex-col items-end justify-center px-4">
      <span className={cn("text-sm", isHidden && "blur-sm")}>
        {formatPercentage(calculateAllocationPercentage(row.original, totalPortfolioValue))}
      </span>
      <div className="text-xs text-transparent">-</div>
    </div>
  ),
  sortingFn: (rowA, rowB) => {
    const percentA = calculateAllocationPercentage(rowA.original, totalPortfolioValue);
    const percentB = calculateAllocationPercentage(rowB.original, totalPortfolioValue);
    return percentA - percentB;
  },
}
```

### New Utility Functions

#### calculateAllocationPercentage
```typescript
const calculateAllocationPercentage = (holding: Holding, totalValue: number): number => {
  if (totalValue <= 0) return 0;
  const holdingValue = holding.marketValue?.base ?? 0;
  return (holdingValue / totalValue) * 100;
};
```

#### formatPercentage
```typescript
const formatPercentage = (percentage: number): string => {
  return `${percentage.toFixed(2)}%`;
};
```

#### calculateTotalPortfolioValue
```typescript
const calculateTotalPortfolioValue = (holdings: Holding[]): number => {
  return holdings.reduce((total, holding) => {
    return total + (holding.marketValue?.base ?? 0);
  }, 0);
};
```

## Data Models

### Existing Types Used
- **Holding**: Already contains `marketValue.base` for calculations
- **Account**: Used to determine context (single vs. all portfolios)

### No New Types Required
The implementation leverages existing data structures without requiring new type definitions.

## Error Handling

### Edge Cases
1. **Zero Total Value**: When total portfolio value is 0, display 0% for all holdings
2. **Null/Undefined Values**: Handle missing `marketValue.base` by treating as 0
3. **Negative Values**: Handle negative holdings appropriately in percentage calculations
4. **Empty Holdings Array**: Handle gracefully when no holdings exist

### Error Scenarios
```typescript
// Handle division by zero
if (totalValue <= 0) return 0;

// Handle missing market value
const holdingValue = holding.marketValue?.base ?? 0;

// Handle NaN results
const percentage = isNaN(result) ? 0 : result;
```

## Testing Strategy

### Unit Tests
1. **Percentage Calculation**: Test `calculateAllocationPercentage` with various inputs
   - Normal positive values
   - Zero total value
   - Negative holdings
   - Missing market values

2. **Formatting**: Test `formatPercentage` function
   - Standard percentages (12.34%)
   - Edge cases (0%, 100%, >100%)
   - Decimal precision

3. **Total Calculation**: Test `calculateTotalPortfolioValue`
   - Mixed positive/negative values
   - Empty arrays
   - Holdings with missing values

### Integration Tests
1. **Column Rendering**: Verify column appears in table with correct data
2. **Sorting**: Test sorting functionality works correctly
3. **Privacy Mode**: Verify percentages are hidden when privacy is enabled
4. **Currency Toggle**: Confirm percentages remain consistent when toggling currencies
5. **Context Switching**: Test percentage recalculation when switching between accounts

### Visual Testing
1. **Column Alignment**: Verify right-alignment matches other numeric columns
2. **Responsive Design**: Test column behavior on different screen sizes
3. **Column Toggle**: Verify column can be hidden/shown via column toggle

## Implementation Approach

### Phase 1: Core Calculation Logic
1. Implement utility functions for percentage calculation
2. Add total portfolio value calculation
3. Add percentage formatting function

### Phase 2: Column Integration
1. Add new column definition to `getColumns` function
2. Integrate with existing table structure
3. Ensure proper sorting and filtering

### Phase 3: Context Awareness
1. Pass total portfolio value to column calculations
2. Ensure recalculation when account context changes
3. Test with both single account and all portfolios views

### Phase 4: Privacy and Accessibility
1. Integrate with existing privacy controls
2. Ensure proper accessibility attributes
3. Test with screen readers and keyboard navigation

## Performance Considerations

### Calculation Efficiency
- Calculate total portfolio value once per render, not per row
- Use `useMemo` to memoize total calculation when holdings change
- Avoid recalculating percentages unnecessarily

### Memory Usage
- No additional data storage required
- Calculations performed on-demand during rendering
- Leverage existing data structures

## Security Considerations

### Privacy Integration
- Respect existing `isBalanceHidden` privacy setting
- Apply same blur effect used by other sensitive columns
- No additional sensitive data exposure

### Data Validation
- Validate numeric inputs before calculations
- Handle edge cases gracefully
- Prevent division by zero errors