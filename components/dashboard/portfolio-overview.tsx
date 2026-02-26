'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, ArrowUpRight, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PortfolioOverviewProps {
  value: number;
}

export function PortfolioOverview({ value }: PortfolioOverviewProps) {
  return (
    <Card className="bg-card border-border p-6 hover:shadow-lg hover:shadow-primary/5 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-sm font-medium">Projected Return</span>
          <span className="text-3xl font-bold text-green-400">+12.0%</span>
        </div>
      </div>

      <div className="mt-6 pt-6 border-t border-border">
        <p className="text-xs text-muted-foreground">
          Projections based on historical performance and current allocation strategy.
        </p>
      </div>
    </Card>
  );
}
