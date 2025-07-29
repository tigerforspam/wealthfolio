import { ReturnData } from '@/lib/types';
import { useState } from 'react';
import { CartesianGrid, Line, LineChart, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { format, parseISO, differenceInMonths, differenceInDays } from 'date-fns';
import { formatPercent, formatAmount } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart';
import { ValueType, NameType } from 'recharts/types/component/DefaultTooltipContent';

interface PerformanceChartProps {
  data: {
    id: string;
    name: string;
    currency: string;
    returns: ReturnData[];
    returnByValue?: number[];
  }[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [showReturnValue, setShowReturnValue] = useState(false);

  const formattedData = data[0]?.returns?.map((item, index) => {
    const dataPoint: Record<string, any> = { date: item.date };
    data.forEach((series) => {
      const matchingPoint = series.returns?.find((p) => p.date === item.date);
      if (matchingPoint) {
        dataPoint[series.id] = matchingPoint.value;
        if (series.returnByValue) {
          dataPoint[`${series.id}_value`] = series.returnByValue[index];
        }
      }
    });
    return dataPoint;
  });

  // Calculate appropriate tick interval based on date range
  const getTickInterval = () => {
    if (!formattedData?.length) return 30;

    const firstDate = parseISO(formattedData[0].date);
    const lastDate = parseISO(formattedData[formattedData.length - 1].date);
    const monthsDiff = differenceInMonths(lastDate, firstDate);
    const daysDiff = differenceInDays(lastDate, firstDate);

    if (daysDiff <= 7) return 0; // Show all days for 1 week
    if (daysDiff <= 31) return 7; // Weekly for 1 month
    if (monthsDiff <= 3) return 14; // Bi-weekly for 3 months
    if (monthsDiff <= 6) return 30; // Monthly for 6 months
    if (monthsDiff <= 12) return 60; // Bi-monthly for 1 year
    if (monthsDiff <= 36) return 90; // Quarterly for 3 years
    return 180; // Semi-annually for longer periods
  };

  // Format date based on range
  const formatXAxis = (dateStr: string) => {
    if (!formattedData?.length) return '';

    const date = parseISO(dateStr);
    const firstDate = parseISO(formattedData[0].date);
    const lastDate = parseISO(formattedData[formattedData.length - 1].date);
    const monthsDiff = differenceInMonths(lastDate, firstDate);
    const daysDiff = differenceInDays(lastDate, firstDate);

    if (daysDiff <= 31) {
      return format(date, 'MMM d'); // e.g., "Sep 15"
    }
    if (monthsDiff <= 36) {
      return format(date, 'MMM yyyy'); // e.g., "Sep 2023"
    }
    return format(date, 'yyyy'); // e.g., "2023"
  };

  // Add back the custom colors
  const CHART_COLORS = [
    '#4385BE', // blue-400
    '#CE5D97', // magenta-400
    '#3AA99F', // cyan-400
    '#8B7EC8', // purple-400
    '#879A39', // green-400
    '#D0A215', // yellow-500
    '#DA702C', // orange-400
    '#D14D41', // red-400
  ];

  // Update the chartConfig and Line components to use CHART_COLORS
  const chartConfig = data.reduce(
    (config, series, index) => {
      config[series.id] = {
        label: series.name,
        color: CHART_COLORS[index % CHART_COLORS.length],
      };
      if (showReturnValue && series.returnByValue) {
        const valueKey = `${series.id}_value`;
        config[valueKey] = {
          label: `${series.name} (Return Value)`,
          color: CHART_COLORS[(index + 2) % CHART_COLORS.length],
        };
      }
      return config;
    },
    {} as ChartConfig,
  );

  const tooltipFormatter: (value: ValueType, name: NameType, props: any) => [string, string] = (
    value,
    name,
    props,
  ) => {
    if (props.dataKey.includes('_value')) {
      const series = data.find((s) => props.dataKey.startsWith(s.id));
      if (series) {
        return [formatAmount(Number(value), series.currency), `${series.name} (Return Value)`];
      }
    }
    const formattedValue = formatPercent(Number(value));
    return [formattedValue, name.toString()];
  };

  const tooltipLabelFormatter = (label: string) => format(parseISO(label), 'PPP');

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center space-x-4 p-2">
        <div className="flex items-center space-x-2">
          <Checkbox id="showReturnValue" checked={showReturnValue} onCheckedChange={() => setShowReturnValue(!showReturnValue)} />
          <Label htmlFor="showReturnValue">Show Return Value</Label>
        </div>
      </div>
      <ChartContainer config={chartConfig} className="w-full h-full flex-grow">
        <ResponsiveContainer width="100%" height="100%" aspect={undefined}>
          <LineChart
            data={formattedData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={formatXAxis}
              interval={getTickInterval()}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(value) => formatPercent(value)}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={[-0.12, 'auto']}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(value) => formatAmount(value, data[0]?.currency || 'USD')}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={tooltipFormatter}
                  labelFormatter={tooltipLabelFormatter}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {data.map((series, seriesIndex) => (
              <>
                <Line
                  yAxisId="left"
                  key={series.id}
                  type="linear"
                  dataKey={series.id}
                  stroke={CHART_COLORS[seriesIndex % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={`${series.name} (TWR)`}
                />
                {showReturnValue && series.returnByValue && (
                  <Line
                    yAxisId="right"
                    key={`${series.id}_value`}
                    type="linear"
                    dataKey={`${series.id}_value`}
                    stroke={CHART_COLORS[(seriesIndex + 2) % CHART_COLORS.length]}
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                    name={`${series.name} (Return Value)`}
                  />
                )}
              </>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
}
