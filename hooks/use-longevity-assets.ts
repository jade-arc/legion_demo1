'use client';

import { useState, useCallback, useEffect } from 'react';

export interface LongevityAsset {
    id: string; // Internal unique ID
    coingeckoId: string; // CoinGecko ID for price tracking
    name: string;
    type: 'staking' | 'yield_farming' | 'lending' | 'insurance';
    quantity: number;
    initialInvestment: number;
    apy: number;
    description: string;
    contractAddress?: string;
    updatedAt: Date;
}

const STORAGE_KEY = 'wealth_platform_longevity_assets';

export function useLongevityAssets() {
    const [assets, setAssets] = useState<LongevityAsset[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Load assets from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                const loadedAssets = parsed.map((a: any) => ({
                    ...a,
                    updatedAt: new Date(a.updatedAt),
                }));
                setAssets(loadedAssets);
            }
        } catch (error) {
            console.error('Failed to load longevity assets:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addAsset = useCallback((asset: Omit<LongevityAsset, 'id' | 'updatedAt'>) => {
        const newAsset: LongevityAsset = {
            ...asset,
            id: `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            updatedAt: new Date(),
        };

        setAssets(prev => {
            const updated = [...prev, newAsset];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });

        return newAsset;
    }, []);

    const removeAsset = useCallback((id: string) => {
        setAssets(prev => {
            const updated = prev.filter(a => a.id !== id);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const updateAsset = useCallback((id: string, updates: Partial<LongevityAsset>) => {
        setAssets(prev => {
            const updated = prev.map(a =>
                a.id === id ? { ...a, ...updates, updatedAt: new Date() } : a
            );
            localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
        });
    }, []);

    const clearAllAssets = useCallback(() => {
        setAssets([]);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

    return {
        assets,
        isLoading,
        addAsset,
        removeAsset,
        updateAsset,
        clearAllAssets,
    };
}
