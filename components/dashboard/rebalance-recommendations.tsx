import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, ChevronDown, Loader2, Brain } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getAIRebalanceAdvice, RebalanceAdvice } from '@/lib/services/ai-rebalancer';

interface RebalanceProps {
  traditional: number;
  longevity: number;
  portfolioValue: number;
}

export function RebalanceRecommendations({ traditional, longevity, portfolioValue }: RebalanceProps) {
  const [expanded, setExpanded] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [advice, setAdvice] = useState<RebalanceAdvice | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem('wealth_api_keys');
        let apiKey = '';
        if (stored) {
          const keys = JSON.parse(stored);
          const active = keys.find((k: any) => k.active && k.provider === 'gemini');
          if (active) apiKey = active.key;
        }

        if (apiKey) {
          const res = await getAIRebalanceAdvice(apiKey, {
            traditional,
            longevity,
            totalValue: portfolioValue
          });
          setAdvice(res);
        } else {
          // Fallback if no API key
          const drift = Math.max(Math.abs(traditional - 70), Math.abs(longevity - 30));
          setAdvice({
            shouldRebalance: drift > 2,
            driftPercentage: drift,
            reason: `Portfolio is off by ${drift.toFixed(1)}%.`,
            recommendation: "Please configure a Gemini API key for detailed AI rebalancing advice.",
            suggestedTrades: []
          });
        }
      } catch (err) {
        console.error("Failed to get rebalance advice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAdvice();
  }, [traditional, longevity, portfolioValue]);

  const handleExecute = async () => {
    setExecuting(true);
    // Simulate execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    setExecuting(false);
    alert("Rebalancing execution simulated. In a production environment, this would trigger actual trades.");
  };

  if (!advice || (!advice.shouldRebalance && !loading)) return null;

  return (
    <Card className="bg-gradient-to-r from-orange-400/10 to-red-400/10 border border-orange-400/30 p-6 hover:border-orange-400/50 transition-colors">
      <div className="flex items-start gap-4">
        <div className="mt-1">
          <AlertTriangle className="h-6 w-6 text-orange-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-foreground font-semibold">Rebalance Recommended</h3>
                <span className="flex items-center gap-1 text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                  <Brain className="h-2.5 w-2.5" />
                  AI POWERED
                </span>
              </div>
              {loading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing allocation drift...
                </div>
              ) : (
                <p className="text-muted-foreground text-sm mb-4">
                  {advice.reason} {advice.recommendation}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(!expanded)}
              className="h-auto p-1 flex-shrink-0 hover:bg-muted"
            >
              <ChevronDown
                className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''
                  }`}
              />
            </Button>
          </div>

          {expanded && !loading && advice && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Traditional</span>
                    <span className="text-foreground font-semibold">{traditional.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target Traditional</span>
                    <span className="text-foreground font-semibold">70.0%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Current Longevity</span>
                    <span className="text-foreground font-semibold">{longevity.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Target Longevity</span>
                    <span className="text-foreground font-semibold">30.0%</span>
                  </div>
                </div>

                <div className="bg-background/40 rounded-lg p-4 border border-orange-400/20">
                  <h4 className="text-xs font-semibold text-foreground uppercase mb-3 tracking-wider">Suggested Trades</h4>
                  <div className="space-y-2">
                    {advice.suggestedTrades.length > 0 ? (
                      advice.suggestedTrades.map((trade, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className={trade.action === 'buy' ? 'text-green-400' : 'text-red-400'}>
                            {trade.action.toUpperCase()} {trade.asset}
                          </span>
                          <span className="text-foreground font-mono">{formatCurrency(trade.amount)}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Manual adjustment required.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-background disabled:opacity-50"
                  onClick={handleExecute}
                  disabled={executing}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  {executing ? 'Executing...' : 'Execute Rebalance'}
                </Button>
                <Button size="sm" variant="outline" className="border-border hover:bg-muted">
                  Full Analysis
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
