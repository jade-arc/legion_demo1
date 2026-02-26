'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

import { useUserTransactions } from '@/hooks/use-user-transactions';
import { useMemo } from 'react';

export function TransactionSummary() {
  const { transactions, stats } = useUserTransactions();
  const [timeframe, setTimeframe] = useState<'6m' | '12m' | 'ytd'>('6m');

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    const now = new Date();
    const result: Record<string, { month: string; spending: number; income: number; sortKey: string }> = {};

    // Determine how many months to look back
    let monthsToLookBack = timeframe === '6m' ? 6 : timeframe === '12m' ? 12 : (now.getMonth() + 1);

    // Sort transactions by date
    const sortedTx = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Group by month
    transactions.forEach(tx => {
      const date = new Date(tx.date);
      const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      const sortKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

      if (!result[sortKey]) {
        result[sortKey] = { month: monthYear, spending: 0, income: 0, sortKey };
      }

      if (tx.type === 'income') {
        result[sortKey].income += tx.amount;
      } else {
        result[sortKey].spending += tx.amount;
      }
    });

    // Convert to array and filter for timeframe
    let dataArray = Object.values(result).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

    if (timeframe === '6m') {
      dataArray = dataArray.slice(-6);
    } else if (timeframe === '12m') {
      dataArray = dataArray.slice(-12);
    } else if (timeframe === 'ytd') {
      const currentYear = now.getFullYear();
      dataArray = dataArray.filter(d => d.sortKey.startsWith(currentYear.toString()));
    }

    return dataArray;
  }, [transactions, timeframe]);

  // Derived averages
  const averages = useMemo(() => {
    if (chartData.length === 0) return { spending: 0, income: 0 };
    const sums = chartData.reduce((acc, curr) => ({
      spending: acc.spending + curr.spending,
      income: acc.income + curr.income
    }), { spending: 0, income: 0 });

    return {
      spending: sums.spending / chartData.length,
      income: sums.income / chartData.length
    };
  }, [chartData]);

  return (
    <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <h3 className="text-foreground font-semibold">Income vs Spending ({timeframe === '6m' ? '6 Months' : timeframe === '12m' ? '12 Months' : 'Year to Date'})</h3>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={timeframe === '6m' ? 'default' : 'outline'}
            className={timeframe === '6m' ? 'bg-primary' : 'border-border hover:bg-muted'}
            onClick={() => setTimeframe('6m')}
          >
            6M
          </Button>
          <Button
            size="sm"
            variant={timeframe === '12m' ? 'default' : 'outline'}
            className={timeframe === '12m' ? 'bg-primary' : 'border-border hover:bg-muted'}
            onClick={() => setTimeframe('12m')}
          >
            12M
          </Button>
          <Button
            size="sm"
            variant={timeframe === 'ytd' ? 'default' : 'outline'}
            className={timeframe === 'ytd' ? 'bg-primary' : 'border-border hover:bg-muted'}
            onClick={() => setTimeframe('ytd')}
          >
            YTD
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-border hover:bg-muted ml-auto md:ml-0"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {chartData.length > 0 ? (
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a202c',
                  border: '1px solid #2d3748',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="square"
              />
              <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="spending" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              No transaction history available.
            </div>
          )}
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-1">Average Monthly Spending</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(averages.spending)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-1">Average Monthly Income</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(averages.income)}</p>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Spending patterns are analyzed to detect trends and inform rebalancing decisions. Higher spending volatility may trigger more frequent portfolio adjustments.
        </p>
      </div>
    </Card>
  );
}
