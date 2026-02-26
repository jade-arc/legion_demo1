'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function TransactionSummary() {
  const [timeframe, setTimeframe] = useState<'6m' | '12m' | 'ytd'>('6m');

  // Generate 24 months of data (2 years)
  const allMonthsData = [
    // 2024
    { month: 'Jan 24', spending: 65000, income: 150000 },
    { month: 'Feb 24', spending: 68000, income: 150000 },
    { month: 'Mar 24', spending: 71000, income: 160000 },
    { month: 'Apr 24', spending: 69000, income: 160000 },
    { month: 'May 24', spending: 73000, income: 165000 },
    { month: 'Jun 24', spending: 72000, income: 160000 },
    { month: 'Jul 24', spending: 75000, income: 170000 },
    { month: 'Aug 24', spending: 71000, income: 165000 },
    { month: 'Sep 24', spending: 74000, income: 170000 },
    { month: 'Oct 24', spending: 69000, income: 165000 },
    { month: 'Nov 24', spending: 76000, income: 175000 },
    { month: 'Dec 24', spending: 85000, income: 185000 },
    // 2025
    { month: 'Jan 25', spending: 72000, income: 170000 },
    { month: 'Feb 25', spending: 71000, income: 170000 },
    { month: 'Mar 25', spending: 73000, income: 175000 },
    { month: 'Apr 25', spending: 74000, income: 180000 },
    { month: 'May 25', spending: 71500, income: 175000 },
    { month: 'Jun 25', spending: 73500, income: 180000 },
    { month: 'Jul 25', spending: 75000, income: 185000 },
    { month: 'Aug 25', spending: 72000, income: 180000 },
    { month: 'Sep 25', spending: 74500, income: 185000 },
    { month: 'Oct 25', spending: 71000, income: 175000 },
    { month: 'Nov 25', spending: 75500, income: 185000 },
    { month: 'Dec 25', spending: 82000, income: 195000 },
  ];

  // Filter data based on timeframe
  const get6mData = () => allMonthsData.slice(-6);
  const get12mData = () => allMonthsData.slice(-12);
  const getYtdData = () => {
    // YTD 2025 (Jan-Dec 2025)
    return allMonthsData.slice(12);
  };

  const data = timeframe === '6m' ? get6mData() : timeframe === '12m' ? get12mData() : getYtdData();

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
          <BarChart data={data}>
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
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-1">Average Monthly Spending</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(73500)}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-muted-foreground text-sm mb-1">Average Monthly Income</p>
          <p className="text-2xl font-bold text-foreground">{formatCurrency(172000)}</p>
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
