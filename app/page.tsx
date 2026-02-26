'use client';

import { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/dashboard/header';
import { RiskScoreCard } from '@/components/dashboard/risk-score-card';
import { PortfolioOverview } from '@/components/dashboard/portfolio-overview';
import { AllocationChart } from '@/components/dashboard/allocation-chart';
import { LongevityAssetsBreakdown } from '@/components/dashboard/longevity-assets-breakdown';
import { RebalanceRecommendations } from '@/components/dashboard/rebalance-recommendations';
import { IdleCapitalAlert } from '@/components/dashboard/idle-capital-alert';
import { TransactionSummary } from '@/components/dashboard/transaction-summary';
import { Card } from '@/components/ui/card';
import { useUserTransactions } from '@/hooks/use-user-transactions';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { getMultipleCryptoPrices } from '@/lib/services/coingecko';
import { formatCurrency } from '@/lib/utils';

interface DemoData {
  riskScore: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  portfolioValue: number;
  traditionalAllocation: number;
  longevityAllocation: number;
  monthlySpending: number;
  idleCapital: number;
  rebalanceNeeded: boolean;
}

export default function DashboardPage() {
  const { transactions, stats, isLoading: transLoading } = useUserTransactions();
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const prices = await getMultipleCryptoPrices(['ethereum', 'aave']);
        setCryptoPrices(prices);
      } catch (e) {
        console.error('Market data fetch failed:', e);
      }
    };
    fetchMarketData();
  }, []);

  useEffect(() => {
    // Calculate data from real transactions
    const timeout = setTimeout(() => {
      // Calculate longevity assets from transactions tagged as longevity or specific categories
      // For now, let's treat any transaction tagged or categorized appropriately
      // But user said remove ALL synthetic data, so if they haven't added anything, it should be 0

      const longevityValue = 0; // Removing hardcoded ETH/AAVE values

      const portfolioValue = stats.balance + longevityValue;

      // Calculate active months for average (max 3 as requested)
      let monthsCount = 1;
      if (transactions && transactions.length > 0) {
        const earliestDate = new Date(Math.min(...transactions.map(t => t.date.getTime())));
        const now = new Date();
        const diffMonth = (now.getFullYear() - earliestDate.getFullYear()) * 12 + (now.getMonth() - earliestDate.getMonth()) + 1;
        monthsCount = Math.max(1, Math.min(3, diffMonth));
      }

      const monthlySpending = stats.totalExpenses > 0 ? stats.totalExpenses / monthsCount : 0;
      const idleCapital = stats.balance * 0.15;

      const traditionValue = stats.balance;
      const total = traditionValue + longevityValue;

      const traditionAlloc = total > 0 ? (traditionValue / total) * 100 : 0;
      const longevityAlloc = total > 0 ? (longevityValue / total) * 100 : 0;

      // Calculate risk score based on real logic (simplified for now to 0 if no data)
      let riskScore = 0;
      if (stats.totalExpenses > 0) {
        riskScore = Math.max(30, Math.min(85, 50 + (stats.totalExpenses / Math.max(stats.totalIncome, 1)) * 20));
      }

      setData({
        riskScore: Math.round(riskScore),
        riskProfile: (riskScore < 40 ? 'conservative' : riskScore < 65 ? 'moderate' : 'aggressive') as 'conservative' | 'moderate' | 'aggressive',
        portfolioValue: Math.round(portfolioValue),
        traditionalAllocation: Math.round(traditionAlloc),
        longevityAllocation: Math.round(longevityAlloc),
        monthlySpending: Math.round(monthlySpending),
        idleCapital: Math.round(idleCapital),
        rebalanceNeeded: stats.totalExpenses > 0,
      });
      setLoading(false);
    }, 500);

    return () => clearTimeout(timeout);
  }, [stats, cryptoPrices]);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-foreground mt-4">Analyzing your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Quick Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8 justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              {stats.totalIncome > 0
                ? `You have ${transactions ? transactions.length : 0} transactions tracked`
                : 'Start by adding your transactions'}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/data">
              <Button className="bg-primary hover:bg-primary/90 text-background gap-2">
                <Plus className="h-4 w-4" />
                Add Transaction
              </Button>
            </Link>
            <Link href="/api-keys">
              <Button variant="outline" className="border-border hover:bg-muted">
                Configure API
              </Button>
            </Link>
          </div>
        </div>
        {/* Top Section: Risk Score & Portfolio Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <RiskScoreCard
            riskScore={data.riskScore}
            riskProfile={data.riskProfile}
            trend="stable"
          />
          <PortfolioOverview value={data.portfolioValue} />
          <Card className="bg-card border-border p-6">
            <h3 className="text-foreground font-semibold mb-4">Monthly Spending</h3>
            <div className="text-3xl font-bold text-primary mb-2">
              {formatCurrency(data.monthlySpending)}
            </div>
            <p className="text-muted-foreground text-sm">Average over last 3 months</p>
          </Card>
        </div>

        {/* Allocation Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AllocationChart
            traditional={data.traditionalAllocation}
            longevity={data.longevityAllocation}
          />
          <Card className="bg-card border-border p-6 hover:border-primary/50 transition-colors">
            <h3 className="text-foreground font-semibold mb-4">Allocation Breakdown</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Traditional Assets</span>
                  <span className="text-foreground font-semibold">{data.traditionalAllocation}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.traditionalAllocation}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Longevity Assets</span>
                  <span className="text-foreground font-semibold">{data.longevityAllocation}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${data.longevityAllocation}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Longevity Assets Breakdown */}
        <div className="mb-8">
          <LongevityAssetsBreakdown />
        </div>

        {/* Recommendations & Alerts */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {data.rebalanceNeeded && (
            <RebalanceRecommendations />
          )}
          {data.idleCapital > 0 && (
            <IdleCapitalAlert amount={data.idleCapital} />
          )}
        </div>

        {/* Transaction Summary */}
        <TransactionSummary />
      </main>
    </div>
  );
}
