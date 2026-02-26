'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { ChevronDown, TrendingUp, RefreshCw, Wallet } from 'lucide-react';
import { getMultipleCryptoPrices } from '@/lib/services/coingecko';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useLongevityAssets } from '@/hooks/use-longevity-assets';

export function LongevityAssetsBreakdown() {
  const { assets: userAssets, isLoading: hookLoading } = useLongevityAssets();
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<Record<string, number>>({});

  const fetchPrices = async () => {
    if (userAssets.length === 0) return;
    setLoading(true);
    try {
      const coinIds = Array.from(new Set(userAssets.map(a => a.coingeckoId)));
      const newPrices = await getMultipleCryptoPrices(coinIds);
      setPrices(newPrices);
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [userAssets]);

  const assetsWithValues = userAssets.map(asset => {
    const price = prices[asset.coingeckoId] || 0;
    return {
      ...asset,
      currentValue: asset.quantity * price,
      price
    };
  });

  const totalValue = assetsWithValues.reduce((sum, asset) => sum + asset.currentValue, 0);
  const totalExpectedYield = assetsWithValues.reduce((sum, asset) => sum + (asset.currentValue * asset.apy / 100), 0);

  if (hookLoading) {
    return <Card className="p-6 h-64 flex items-center justify-center">Loading assets...</Card>;
  }

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
            disabled={loading || userAssets.length === 0}
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
              className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          </Button>
        </div>
      </div>

      {expanded && (
        <>
          {userAssets.length > 0 ? (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-muted-foreground text-xs mb-1">Total Portfolio Value</p>
                  <p className="text-2xl font-bold text-accent">
                    {formatCurrency(totalValue)}
                  </p>
                </div>
                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-muted-foreground text-xs mb-1">Projected Annual Yield</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatCurrency(totalExpectedYield)}
                  </p>
                </div>
              </div>

              {/* Asset Details */}
              <div className="space-y-4 mb-6">
                {assetsWithValues.map((asset, idx) => (
                  <div
                    key={idx}
                    className="bg-muted/20 rounded-lg p-4 hover:bg-muted/40 transition-colors cursor-default border border-border hover:border-accent/30"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-foreground font-semibold text-sm">{asset.name}</h4>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {asset.price > 0 ? formatCurrency(asset.price) : 'Fetching...'}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] mt-1 line-clamp-1">{asset.description || `${asset.type.replace('_', ' ')} asset`}</p>
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
                          {totalValue > 0 ? ((asset.currentValue / totalValue) * 100).toFixed(1) : '0'}%
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5">
                        <div
                          className="bg-gradient-to-r from-accent to-cyan-400 h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${totalValue > 0 ? (asset.currentValue / totalValue) * 100 : 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between text-xs mt-3 pt-3 border-t border-border">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Quantity</span>
                        <span className="text-foreground font-medium font-mono">
                          {asset.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-muted-foreground">Market Value</span>
                        <span className="text-foreground font-bold text-accent">
                          {formatCurrency(asset.currentValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center px-4">
              <div className="bg-accent/10 p-4 rounded-full mb-4">
                <Wallet className="h-8 w-8 text-accent opacity-50" />
              </div>
              <p className="text-foreground font-semibold mb-1">No longevity assets found</p>
              <p className="text-muted-foreground text-xs mb-6 max-w-[200px]">
                Add your staking or yield positions in the Data page to track them here.
              </p>
              <Link href="/data">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-white font-bold h-9 px-6 rounded-lg">
                  Add Asset
                </Button>
              </Link>
            </div>
          )}

          {/* Footer Info */}
          <div className="pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
              <RefreshCw className="h-3 w-3" />
              {userAssets.length > 0 ? "Market data powered by CoinGecko. Auto-refreshes every 5m." : "Configure assets to start tracking real-time performance."}
            </p>
          </div>
        </>
      )}
    </Card>
  );
}
