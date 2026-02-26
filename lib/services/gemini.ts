import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ClassificationResult {
    amount: number;
    description: string;
    category: string;
    type: 'income' | 'expense';
}

export async function classifyTransactions(
    apiKey: string,
    transactions: { description: string; amount: number }[]
): Promise<ClassificationResult[]> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Classify the following transactions as either 'income' or 'expense' and assign a category (one of: groceries, transportation, utilities, entertainment, healthcare, shopping, dining, rent/mortgage, salary, investments, insurance, subscriptions, other).
  
  Transactions:
  ${transactions.map((t, i) => `${i + 1}. Description: "${t.description}", Amount: ${t.amount}`).join('\n')}
  
  Return a JSON array of objects with fields: index (1-based), type, and category.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Extract JSON array
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) throw new Error("No JSON array found in response");

        const parsed: { index: number; type: string; category: string }[] = JSON.parse(jsonMatch[0]);

        return transactions.map((t, i) => {
            const p = parsed.find(item => item.index === i + 1);
            return {
                amount: t.amount,
                description: t.description,
                type: (p?.type.toLowerCase().includes('income') ? 'income' : 'expense') as 'income' | 'expense',
                category: p?.category || 'other'
            };
        });
    } catch (error) {
        console.error("Gemini classification failed:", error);
        // Fallback to naive logic if AI fails
        return transactions.map(t => ({
            amount: t.amount,
            description: t.description,
            type: (t.description.toLowerCase().includes('salary') || t.amount > 100000 ? 'income' : 'expense') as 'income' | 'expense',
            category: 'other'
        }));
    }
}
