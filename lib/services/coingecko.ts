/**
 * CoinGecko Service
 * Handles real-time price fetching for cryptocurrencies
 */

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache
const cache: Record<string, { price: number; timestamp: number }> = {};

export async function getCryptoPrice(coinId: string): Promise<number> {
    const now = Date.now();

    // Check cache first
    if (cache[coinId] && now - cache[coinId].timestamp < CACHE_TTL) {
        return cache[coinId].price;
    }

    try {
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=inr`
        );
        const data = await response.json();

        if (data[coinId] && data[coinId].inr) {
            const price = data[coinId].inr;
            cache[coinId] = { price, timestamp: now };
            return price;
        }

        throw new Error(`Price not found for ${coinId}`);
    } catch (error) {
        console.error(`[CoinGecko] Failed to fetch price for ${coinId}:`, error);
        // Return last cached price if available, otherwise fallback
        return cache[coinId]?.price || 0;
    }
}

export async function getMultipleCryptoPrices(coinIds: string[]): Promise<Record<string, number>> {
    const now = Date.now();
    const result: Record<string, number> = {};
    const toFetch: string[] = [];

    coinIds.forEach((id) => {
        if (cache[id] && now - cache[id].timestamp < CACHE_TTL) {
            result[id] = cache[id].price;
        } else {
            toFetch.push(id);
        }
    });

    if (toFetch.length === 0) return result;

    try {
        const ids = toFetch.join(',');
        const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr`
        );
        const data = await response.json();

        toFetch.forEach((id) => {
            if (data[id] && data[id].inr) {
                const price = data[id].inr;
                cache[id] = { price, timestamp: now };
                result[id] = price;
            } else {
                result[id] = cache[id]?.price || 0;
            }
        });

        return result;
    } catch (error) {
        console.error(`[CoinGecko] Failed to fetch multiple prices:`, error);
        toFetch.forEach((id) => {
            result[id] = cache[id]?.price || 0;
        });
        return result;
    }
}
