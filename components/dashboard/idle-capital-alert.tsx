'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Wallet, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

interface IdleCapitalAlertProps {
  amount: number;
}

export function IdleCapitalAlert({ amount }: IdleCapitalAlertProps) {
  return (
    <Card className="bg-gradient-to-r from-blue-400/10 to-cyan-400/10 border border-blue-400/30 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        <div className="flex-shrink-0 mt-0.5">
          <Lightbulb className="h-6 w-6 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-amber-200 font-semibold mb-1">Idle Capital Detected</h3>
          <p className="text-amber-200/80 text-sm">
            You have {formatCurrency(amount)} sitting in low-yield accounts.
            Moving this to Longevity Assets could increase your annual returns.
          </p>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm gap-4">
              <span className="text-muted-foreground flex-shrink-0">Idle Amount</span>
              <span className="text-foreground font-semibold text-right flex-shrink-0">${amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm gap-4">
              <span className="text-muted-foreground flex-shrink-0">Projected Annual Yield</span>
              <span className="text-green-400 font-semibold text-right flex-shrink-0">
                ${(amount * 0.08).toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="sm" className="bg-accent hover:bg-accent/90 text-background w-full sm:w-auto">
              Allocate Capital
            </Button>
            <Button size="sm" variant="outline" className="border-border hover:bg-muted w-full sm:w-auto">
              Review Opportunities
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
