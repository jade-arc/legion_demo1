'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { ChevronDown, TrendingUp, RefreshCw } from 'lucide-react';
import { getMultipleCryptoPrices } from '@/lib/services/coingecko';
import { formatCurrency } from '@/lib/utils';

interface LongevityAsset {
  id: string; // CoinGecko ID
  name: string;
  allocation: number;
  value: number;
  quantity: number;
  apy: number;
  description: string;
}

export function LongevityAssetsBreakdown() {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({
    'ethereum': 230000,
    'aave': 12000,
    'tether': 83.50,
    'longevity-index': 100.00
  });

  const [assets, setAssets] = useState<LongevityAsset[]>([
    {
      id: 'ethereum',
      name: 'Ethereum Staking',
      allocation: 60,
      quantity: 1.8,
      value: 414000,
      apy: 3.2,
      description: 'Proof-of-stake rewards from Ethereum validators',
    },
    {
      id: 'aave',
      name: 'Yield Farming (Aave)',
      allocation: 25,
      quantity: 15,
      value: 180000,
      apy: 5.8,
      description: 'Liquidity provider yields from decentralized finance',
    },
    {
      id: 'longevity-index',
      name: 'Longevity Insurance',
      allocation: 10,
      quantity: 500,
      value: 50000,
      apy: 4.5,
      description: 'Index-linked insurance for extended lifespan events',
    },
    {
      id: 'tether',
      name: 'Digital Assets Reserve',
      allocation: 5,
      quantity: 300,
      value: 25050,
      apy: 0.0,
      description: 'Reserve stablecoin holdings for liquidity',
    },
  ]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const coinIds = assets.map(a => a.id).filter(id => id !== 'longevity-index');
      const newPrices = await getMultipleCryptoPrices(coinIds);
      setPrices(prev => ({ ...prev, ...newPrices }));

      // Update values based on new prices
      setAssets(prev => prev.map(asset => {
        const price = newPrices[asset.id] || prices[asset.id] || 100;
        return {
          ...asset,
          value: asset.quantity * price
        };
      }));
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    // Refresh every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalExpectedYield = assets.reduce((sum, asset) => sum + (asset.value * asset.apy / 100), 0);

  return (
    <Card className="bg-card border-border p-6 hover:border-accent/50 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-foreground font-semibold">Longevity Assets Breakdown</h3>
          <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wider">
            Real-time
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPrices}
            disabled={loading}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <ChevronDown
              className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''
                }`}
            />
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-muted-foreground text-xs mb-1">Total Value</p>
              <p className="text-2xl font-bold text-accent">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4">
              <p className="text-muted-foreground text-xs mb-1">Expected Annual Yield</p>
              <p className="text-2xl font-bold text-green-400">
                {formatCurrency(totalExpectedYield)}
              </p>
            </div>
          </div>

          {/* Asset Details */}
          <div className="space-y-4 mb-6">
            {assets.map((asset, idx) => (
              <div
                key={idx}
                className="bg-muted/20 rounded-lg p-4 hover:bg-muted/40 transition-colors cursor-default border border-border hover:border-primary/30"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-foreground font-semibold text-sm">{asset.name}</h4>
                      {asset.id !== 'longevity-index' && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatCurrency(prices[asset.id])}
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground text-[11px] mt-1">{asset.description}</p>
                  </div>
                  <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    <span className="text-green-400 font-semibold text-sm">{asset.apy}%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs gap-2">
                    <span className="text-muted-foreground">Allocation</span>
                    <span className="text-foreground font-semibold">
                      {((asset.value / totalValue) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-accent to-cyan-400 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${(asset.value / totalValue) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between text-xs mt-3 pt-3 border-t border-border">
                  <div className="flex flex-col">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="text-foreground font-medium font-mono">
                      {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground">Current Value</span>
                    <span className="text-foreground font-semibold">
                      {formatCurrency(asset.value)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground italic">
              * Market data powered by CoinGecko API. Prices refresh automatically every 5 minutes.
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
