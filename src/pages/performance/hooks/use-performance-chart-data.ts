import { useMemo } from 'react';
import { useValuationHistory } from '@/hooks/use-valuation-history';
import { calculatePerformanceMetrics } from '@/lib/utils';
import { DateRange } from '@/lib/types';
import { useSettingsContext } from '@/lib/settings-provider';

export function usePerformanceChartData(dateRange: DateRange | undefined, accountId?: string) {
  const { valuationHistory, isLoading } = useValuationHistory(dateRange, accountId);
  const { settings } = useSettingsContext();
  const baseCurrency = settings?.baseCurrency || 'USD';

  const chartData = useMemo(() => {
    if (!valuationHistory?.length) return [];

    return valuationHistory.map((item, index) => {
      const subHistory = valuationHistory.slice(0, index + 1);
      const { simpleReturn, gainLossAmount } = calculatePerformanceMetrics(subHistory, false);

      return {
        date: item.valuationDate,
        totalValue: item.totalValue,
        netContribution: item.netContribution,
        returnRate: simpleReturn,
        returnByValue: gainLossAmount,
        currency: item.baseCurrency || baseCurrency,
      };
    });
  }, [valuationHistory, baseCurrency]);

  return { chartData, isLoading };
}
