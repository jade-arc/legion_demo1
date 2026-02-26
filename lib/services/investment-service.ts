import { GoogleGenerativeAI } from "@google/generative-ai";
import { getMultipleCryptoPrices } from "./coingecko";

export interface InvestmentOpportunity {
    asset: string;
    price: string;
    priceValue: number;
    suggestedAmount: number;
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
    - priceValue: number (the current raw price in INR)
    - suggestedAmount: number (how much of the ₹${idleAmount} to invest in this asset)
    - trend: 'up' | 'down' | 'neutral'
    - recommendation: string (one sentence why this is good for longevity)
    - apy: string (estimated annual yield, e.g. "4.2%")
    
    Ensure the sum of suggestedAmount does not exceed ₹${idleAmount}.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON array found in response");

        const rawData = JSON.parse(jsonMatch[0]);

        return rawData.map((opp: any) => ({
            ...opp,
            priceValue: Number(opp.priceValue) || 0,
            suggestedAmount: Number(opp.suggestedAmount) || 0
        }));
    } catch (error) {
        console.error("Investment analysis failed:", error);
        // Generic fallback
        return [
            {
                asset: "Ethereum Staking",
                price: "Market Price",
                priceValue: 0,
                suggestedAmount: idleAmount * 0.5,
                trend: "neutral",
                recommendation: "Stake ETH for long-term network rewards and capital appreciation.",
                apy: "3.5%"
            },
            {
                asset: "Aave Lending",
                price: "Market Price",
                priceValue: 0,
                suggestedAmount: idleAmount * 0.3,
                trend: "up",
                recommendation: "Supply liquidity to Aave for stable yields in the DeFi ecosystem.",
                apy: "5.1%"
            }
        ];
    }
}
