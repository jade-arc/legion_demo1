import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Wallet, Lightbulb, Loader2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { getInvestmentAnalysis, InvestmentOpportunity } from '@/lib/services/investment-service';

interface IdleCapitalAlertProps {
  amount: number;
}

export function IdleCapitalAlert({ amount }: IdleCapitalAlertProps) {
  const [opportunities, setOpportunities] = useState<InvestmentOpportunity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem('wealth_api_keys');
        let apiKey = '';
        if (stored) {
          const keys = JSON.parse(stored);
          const active = keys.find((k: any) => k.active && k.provider === 'gemini');
          if (active) apiKey = active.key;
        }

        if (apiKey && amount > 0) {
          const advice = await getInvestmentAnalysis(apiKey, amount);
          setOpportunities(advice);
        }
      } catch (err) {
        console.error("Failed to load investment advice:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [amount]);

  return (
    <Card className="bg-gradient-to-r from-blue-400/10 to-cyan-400/10 border border-blue-400/30 p-4 md:p-6 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <TrendingUp className="h-48 w-48 text-blue-400" />
      </div>

      <div className="flex flex-col md:flex-row md:items-start gap-4 relative z-10">
        <div className="flex-shrink-0 mt-0.5">
          <div className="p-2 bg-blue-400/20 rounded-lg">
            <Lightbulb className="h-6 w-6 text-blue-400" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h3 className="text-blue-100 font-semibold flex items-center gap-2">
              Idle Capital Detected
              <span className="text-[10px] bg-blue-400/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                MARKET ANALYSIS LIVE
              </span>
            </h3>
            <span className="text-blue-300 font-bold text-lg">
              {formatCurrency(amount)}
            </span>
          </div>

          <p className="text-blue-200/80 text-sm mb-6 max-w-2xl">
            You have significant funds in low-yield accounts. Based on current market conditions and CoinGecko data, here are your best deployment opportunities:
          </p>

          {loading ? (
            <div className="flex items-center gap-3 text-blue-300 text-sm py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
              Performing market-wide analysis...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {opportunities.length > 0 ? (
                opportunities.map((opp, i) => (
                  <div key={i} className="bg-background/40 p-4 rounded-xl border border-blue-400/10 hover:border-blue-400/30 transition-all group">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-blue-100 uppercase tracking-wider">{opp.asset}</span>
                      {opp.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-400" />}
                      {opp.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-400" />}
                      {opp.trend === 'neutral' && <Minus className="h-3 w-3 text-gray-400" />}
                    </div>
                    <div className="text-lg font-bold text-white mb-1">{opp.apy} APY</div>
                    <div className="text-[10px] text-blue-300/80 mb-3">{opp.price}</div>
                    <p className="text-[11px] text-blue-200/70 leading-relaxed italic line-clamp-2">
                      "{opp.recommendation}"
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center text-blue-300/50 text-xs italic border border-dashed border-blue-400/20 rounded-xl">
                  Configure a Gemini API key to see real-time investment opportunities.
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button size="sm" className="bg-blue-400 hover:bg-blue-500 text-black font-semibold px-6">
              Allocate Now
            </Button>
            <Button size="sm" variant="outline" className="border-blue-400/30 hover:bg-blue-400/10 text-blue-200">
              Dismiss Area
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
