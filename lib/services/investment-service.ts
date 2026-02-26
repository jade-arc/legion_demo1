import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMultipleCryptoPrices } from "./coingecko";

export interface InvestmentOpportunity {
    asset: string;
    price: string;
    trend: 'up' | 'down' | 'neutral';
    recommendation: string;
    apy: string;
}

export async function getInvestmentAnalysis(
    apiKey: string,
    idleAmount: number
): Promise<InvestmentOpportunity[]> {
    const coins = ['ethereum', 'aave', 'tether', 'cardano', 'solana'];

    try {
        const prices = await getMultipleCryptoPrices(coins);

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `You are a crypto-investment analyst. I have ₹${idleAmount.toLocaleString('en-IN')} in idle capital.
    Current market prices (INR):
    ${Object.entries(prices).map(([id, price]) => `- ${id}: ₹${price.toLocaleString('en-IN')}`).join('\n')}
    
    Based on these prices and typical market trends, identify 3 top "Longevity" investment opportunities. 
    Focus on staking (ETH), yield (AAVE), or stable growth.
    
    Return a JSON array of objects with:
    - asset: string (e.g., "Ethereum Staking")
    - price: string (current price formatted with ₹)
    - trend: 'up' | 'down' | 'neutral'
    - recommendation: string (one sentence why this is good for longevity)
    - apy: string (estimated annual yield, e.g. "4.2%")`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON array found in response");

        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error("Investment analysis failed:", error);
        // Generic fallback
        return [
            {
                asset: "Ethereum Staking",
                price: "Market Price",
                trend: "neutral",
                recommendation: "Stake ETH for long-term network rewards and capital appreciation.",
                apy: "3.5%"
            },
            {
                asset: "Aave Lending",
                price: "Market Price",
                trend: "up",
                recommendation: "Supply liquidity to Aave for stable yields in the DeFi ecosystem.",
                apy: "5.1%"
            }
        ];
    }
}
