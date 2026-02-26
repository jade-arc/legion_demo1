import { GoogleGenerativeAI } from "@google/generative-ai";

export interface RebalanceAdvice {
    shouldRebalance: boolean;
    driftPercentage: number;
    reason: string;
    recommendation: string;
    suggestedTrades: {
        action: 'buy' | 'sell';
        asset: string;
        amount: number;
    }[];
}

export async function getAIRebalanceAdvice(
    apiKey: string,
    data: {
        traditional: number;
        longevity: number;
        totalValue: number;
        targetTraditional?: number;
        targetLongevity?: number;
    }
): Promise<RebalanceAdvice> {
    const { traditional, longevity, totalValue, targetTraditional = 70, targetLongevity = 30 } = data;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const tradDrift = traditional - targetTraditional;
    const longDrift = longevity - targetLongevity;
    const maxDrift = Math.max(Math.abs(tradDrift), Math.abs(longDrift));

    const prompt = `You are an expert financial advisor specializing in a 70/30 (Traditional/Longevity) portfolio strategy.
  
  Current Portfolio State:
  - Traditional Allocation: ${traditional.toFixed(1)}% (Target: ${targetTraditional}%)
  - Longevity Allocation: ${longevity.toFixed(1)}% (Target: ${targetLongevity}%)
  - Total Portfolio Value: ₹${totalValue.toLocaleString('en-IN')}
  
  Analyze the drift and provide rebalancing advice. Rebalance is usually recommended if drift exceeds 2-5%.
  
  Return a JSON object with:
  - shouldRebalance: boolean
  - driftPercentage: number (the absolute maximum drift)
  - reason: string (brief explanation of why or why not)
  - recommendation: string (a concise professional summary of what to do)
  - suggestedTrades: array of { action: 'buy'|'sell', asset: string, amount: number }
  
  Use ₹ for all amounts. Keep the tone professional but accessible.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("AI Rebalance Advisor failed:", error);
        // Fallback logic
        const shouldRebalance = maxDrift > 5;
        const shiftAmount = (totalValue * maxDrift) / 100;

        return {
            shouldRebalance,
            driftPercentage: maxDrift,
            reason: shouldRebalance ? `Portfolio has drifted ${maxDrift.toFixed(1)}% from target.` : "Portfolio is well-balanced.",
            recommendation: shouldRebalance
                ? `Consider shifting ${shiftAmount.toLocaleString('en-IN')} to restore your 70/30 balance.`
                : "No immediate action required.",
            suggestedTrades: shouldRebalance ? [
                {
                    action: tradDrift > 0 ? 'sell' : 'buy',
                    asset: 'Traditional Assets',
                    amount: Math.abs(shiftAmount)
                },
                {
                    action: longDrift > 0 ? 'sell' : 'buy',
                    asset: 'Longevity Assets',
                    amount: Math.abs(shiftAmount)
                }
            ] : []
        };
    }
}
